# QueueJump — Engineering Specification

> Viral waitlist & referral engine. Drop-in widget for pre-launch pages.

---

## 1. What We're Building

**QueueJump** is a multi-tenant SaaS platform that lets founders add referral-powered waitlists to any landing page in under 2 minutes. Think Clerk or Resend, but for waitlists — *"You're #412 in line. Refer 3 friends to jump ahead."*

The product ships as three connected pieces inside a single monorepo:

**A. Marketing Site & Live Playground (`/`)**
A developer-facing landing page with a working demo baked into the hero. Visitors enter a real email, see their live queue position tick down, and can simulate a referral to watch their rank jump in real time. This isn't a mockup — it hits the actual Redis leaderboard.

**B. Founder Dashboard (`/dashboard/*`)**
The authenticated control panel where developers create waitlist campaigns, configure referral bonuses, set milestone rewards, review blocked fraud attempts, grab their API keys, and export verified leads.

**C. Embeddable Widget & REST API (`/embed/[key]` & `widget.js`)**
Customers either paste a 2-line `<script>` tag into their site to render a pre-built signup card, or hit the headless REST API directly from a custom frontend. The widget works cross-origin out of the box.

---

## 2. Why These Technical Decisions

**Redis Sorted Sets for ranking** — A waitlist with 100K+ users needs sub-10ms position lookups. `ZRANK` on a Sorted Set gives us O(log N) without any SQL `COUNT(*)` scans. Positions update instantly when referrals land.

**BullMQ over a standalone message broker** — We already need Redis. BullMQ gives us reliable job queues, delayed retries, and dead-letter handling without adding another service to the Docker stack. One fewer thing to monitor, one fewer thing to break.

**Email validation at the gate** — Referral systems are bot magnets. We normalize emails (strip `+` aliases, collapse Gmail dots), block disposable domains, and rate-limit by IP. Not a "fraud AI pipeline" — just the basics done properly.

**Double-opt-in before crediting referrals** — A referrer's rank only improves after the referred user verifies their email. This runs inside a Postgres transaction to prevent double-crediting. No verification click, no credit, no exceptions.

---

## 3. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | Node.js 20 LTS, TypeScript 5, Express | Mature, fast enough, strong typing |
| Database | PostgreSQL 16, Prisma ORM | ACID transactions for referral attribution |
| Cache & Leaderboard | Redis 7 (`ioredis`) | Sorted Sets for O(log N) ranking |
| Job Queue | BullMQ (Redis-backed) | Webhook delivery, email jobs, retries |
| Email Delivery | Resend (free tier: 3K/month) | Verification emails, milestone notifications |
| Frontend | Next.js (App Router), Tailwind CSS, Framer Motion | SSR, design system, animations |
| Validation | `zod` everywhere | Runtime type safety for all inputs |
| Auth | JWT (access + refresh tokens, `bcrypt` hashing) | Stateless auth for dashboard |
| Testing | Vitest + Supertest | Unit + integration |
| Dev Environment | Docker Compose | Postgres, Redis, all local |

### Project Structure

```
queuejump/
├── docker-compose.yml
├── .env.example
├── SPEC.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json                    # strict: true, no implicit any
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts                      # Seeds a demo campaign for the playground
│   ├── scripts/
│   │   ├── disposable-domains.txt       # Known temp-mail domains
│   │   └── k6-load-test.js
│   ├── public/
│   │   └── widget.js                    # Drop-in embeddable script
│   └── src/
│       ├── app.ts                       # Express app config (helmet, cors, routes)
│       ├── server.ts                    # Listen + graceful shutdown
│       ├── config/
│       │   ├── env.ts                   # zod-validated env vars
│       │   ├── db.ts                    # Prisma client singleton
│       │   ├── redis.ts                 # ioredis connection
│       │   └── bullmq.ts               # Queue + Worker setup
│       ├── middlewares/
│       │   ├── apiKeyAuth.ts            # Resolves campaign from X-Campaign-Key header
│       │   ├── tenantAuth.ts            # JWT verification for dashboard routes
│       │   ├── rateLimiter.ts           # Redis sliding-window per IP
│       │   └── errorHandler.ts          # Global error handler, standard envelope
│       ├── modules/
│       │   ├── tenant/                  # Register, login, profile
│       │   ├── campaign/                # CRUD, API key generation
│       │   ├── participant/             # Join, verify, status
│       │   ├── leaderboard/             # Redis ZSET operations
│       │   ├── fraud/                   # Email validation, domain blocking
│       │   └── webhook/                 # Signed delivery, retry logic
│       ├── jobs/
│       │   ├── emailJob.ts              # Sends verification/milestone emails via Resend
│       │   └── webhookJob.ts            # HMAC-signed webhook delivery with retries
│       └── utils/
│           ├── emailNormalizer.ts
│           ├── referralCode.ts          # Human-readable codes: "bright-fox-9k2"
│           └── hmac.ts                  # Webhook signature utils
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── page.tsx                 # Landing page + live playground
        │   ├── login/page.tsx
        │   ├── dashboard/
        │   │   ├── page.tsx             # Overview metrics
        │   │   ├── campaigns/page.tsx   # Campaign management
        │   │   ├── leaderboard/page.tsx # Live ranks + fraud logs
        │   │   └── settings/page.tsx    # API keys, webhook config, embed preview
        │   └── embed/[publicKey]/page.tsx
        └── components/
            ├── landing/
            ├── dashboard/
            └── widget/
```

---

## 4. Database Schema

### PostgreSQL (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ParticipantStatus {
  PENDING
  VERIFIED
  FLAGGED
}

model Tenant {
  id           String     @id @default(uuid())
  name         String
  email        String     @unique
  passwordHash String     // bcrypt, cost factor 12
  createdAt    DateTime   @default(now())
  campaigns    Campaign[]
}

model Campaign {
  id                   String        @id @default(uuid())
  tenantId             String
  tenant               Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name                 String
  publicKey            String        @unique   // pk_live_<random> — used in client widgets
  secretKeyHash        String        @unique   // sk_live_<random> — hashed, used for server mgmt
  referralBonusSec     Int           @default(86400) // Seconds to subtract from score per referral (default: 24h)
  webhookUrl           String?
  webhookSecret        String?       // Auto-generated HMAC secret for signing payloads
  milestonesJson       Json          @default("[]")
  // TODO: Extract to a Milestone table when we add milestone editing UI
  // Shape: [{ "count": 3, "reward": "Early Beta Access" }, { "count": 10, "reward": "Pro Free" }]
  isDemo               Boolean       @default(false) // True only for the seeded playground campaign
  createdAt            DateTime      @default(now())
  participants         Participant[]
  fraudLogs            FraudBlockLog[]

  @@index([tenantId])
}

model Participant {
  id                String            @id @default(uuid())
  campaignId        String
  campaign          Campaign          @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  rawEmail          String
  canonicalEmail    String            // Normalized to prevent +alias and dot-trick gaming
  referralCode      String            @unique
  referredById      String?
  referredBy        Participant?      @relation("ReferralTree", fields: [referredById], references: [id])
  referrals         Participant[]     @relation("ReferralTree")
  status            ParticipantStatus @default(PENDING)
  verifiedReferrals Int               @default(0)
  verificationToken String?           @unique
  ipAddress         String
  userAgent         String?
  joinedAt          DateTime          @default(now())
  verifiedAt        DateTime?

  @@unique([campaignId, canonicalEmail])
  @@index([campaignId, referralCode])
  @@index([referredById])
}

model FraudBlockLog {
  id          String   @id @default(uuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  rawEmail    String
  ipAddress   String
  reason      String   // DISPOSABLE_DOMAIN | INVALID_MX | IP_RATE_LIMIT | SELF_REFERRAL_IP
  createdAt   DateTime @default(now())

  @@index([campaignId, createdAt])
}

model WebhookDeliveryLog {
  id          String   @id @default(uuid())
  campaignId  String
  eventType   String   // participant.verified | milestone.unlocked
  payload     Json
  statusCode  Int?
  attempt     Int      @default(1)
  success     Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

### Redis Leaderboard Design

Each campaign has a Redis Sorted Set that orders participants by effective queue position.

**Key:** `campaign:{campaignId}:leaderboard`
**Member:** participant ID
**Score:** `joinedAtUnixSeconds - (verifiedReferrals × referralBonusSec)`

Lower scores sort first, so earlier signups and more referrals both move you toward the front.

**Operations:**
- Add on signup: `ZADD campaign:{id}:leaderboard <joinedAtUnix> <participantId>`
- Credit referral: `ZINCRBY campaign:{id}:leaderboard -<bonusSec> <referrerParticipantId>`
- Get position (1-indexed): `ZRANK campaign:{id}:leaderboard <participantId>` + 1
- Get total count: `ZCARD campaign:{id}:leaderboard`
- Leaderboard page: `ZRANGE campaign:{id}:leaderboard 0 <limit> WITHSCORES`

**Reconciliation:** On backend startup, if the leaderboard key is missing (Redis restart), rebuild it from Postgres using the score formula above. This runs once, takes ~2s for 100K rows, and logs a warning.

---

## 5. API Design

### Standard Error Envelope

Every error response follows this shape:

```json
{
  "error": {
    "code": "DISPOSABLE_EMAIL",
    "message": "Disposable email domains are not allowed.",
    "details": { "domain": "mailinator.com" }
  }
}
```

Error codes are stable strings that clients can switch on. Messages are human-readable and may change.

### CORS Policy

- **Dashboard API routes** (`/api/v1/tenants/*`, `/api/v1/campaigns/*`): Same-origin only (frontend domain)
- **Public widget routes** (`/api/v1/waitlist/*`): Open CORS (`Access-Control-Allow-Origin: *`) — these are called from customer sites via the embed widget
- The `widget.js` script itself is served with permissive CORS headers

### Auth

**Dashboard (tenant) routes:** Bearer JWT in `Authorization` header.
- Access token: 15-minute expiry, contains `{ tenantId, email }`
- Refresh token: 7-day expiry, stored as httpOnly cookie
- Password hashing: bcrypt, cost factor 12

**Public widget routes:** `X-Campaign-Key: pk_live_<key>` header.
- Resolved to a campaign via `apiKeyAuth` middleware
- Campaign metadata cached in Redis for 5 minutes (`campaign:pk:{publicKey}`)

### Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/v1/health` | None | Ping Postgres + Redis |
| `POST` | `/api/v1/tenants/register` | None | Create account |
| `POST` | `/api/v1/tenants/login` | None | Get JWT pair |
| `POST` | `/api/v1/tenants/refresh` | Refresh cookie | Rotate access token |
| `POST` | `/api/v1/campaigns` | Tenant JWT | Create campaign |
| `GET` | `/api/v1/campaigns` | Tenant JWT | List tenant's campaigns |
| `GET` | `/api/v1/campaigns/:id` | Tenant JWT | Campaign detail + stats |
| `PATCH` | `/api/v1/campaigns/:id` | Tenant JWT | Update settings |
| `POST` | `/api/v1/waitlist/join` | Campaign key | Join waitlist |
| `GET` | `/api/v1/waitlist/status/:referralCode` | Campaign key | Get position + stats |
| `GET` | `/api/v1/waitlist/leaderboard` | Campaign key | Top N participants |
| `POST` | `/api/v1/waitlist/verify` | None | Email verification callback |
| `POST` | `/api/v1/waitlist/demo-simulate` | Campaign key | Playground only — simulate a referral (restricted to `isDemo: true` campaigns) |
| `GET` | `/api/v1/dashboard/stats/:campaignId` | Tenant JWT | Aggregate metrics |
| `GET` | `/api/v1/dashboard/fraud-logs/:campaignId` | Tenant JWT | Paginated fraud log |

---

## 6. Phased Build Plan

Each phase has clear deliverables and a way to verify it works before moving on.

---

### Phase 1 — Foundation & Infrastructure

Set up the monorepo, Docker services, database, and a health endpoint.

**Deliverables:**
1. `docker-compose.yml` running PostgreSQL 16 and Redis 7 (no RabbitMQ — BullMQ uses Redis)
2. `backend/` initialized with TypeScript (strict mode), Express, Prisma
3. `backend/src/config/env.ts` — all env vars validated through zod at startup. App crashes immediately on missing/invalid config.
4. Prisma schema from Section 4 applied via migration
5. `GET /api/v1/health` returns `200` with `{ "status": "ok", "postgres": "up", "redis": "up" }`

**Verify:**
```bash
docker compose up -d
cd backend && npm run dev
curl http://localhost:4000/api/v1/health
# → { "status": "ok", "postgres": "up", "redis": "up" }
```

---

### Phase 2 — Tenants, Campaigns & API Key Auth

Build the account system, campaign CRUD, and the middleware that resolves API keys.

**Deliverables:**
1. `POST /api/v1/tenants/register` — bcrypt hash, return JWT pair
2. `POST /api/v1/tenants/login` — verify password, return JWT pair
3. `POST /api/v1/tenants/refresh` — rotate access token from refresh cookie
4. `POST /api/v1/campaigns` — generate `pk_live_<32-char-hex>` and `sk_live_<32-char-hex>`, hash the secret key before storing
5. `GET /api/v1/campaigns` — list campaigns for the authenticated tenant
6. `apiKeyAuth` middleware: resolve campaign from `X-Campaign-Key` header, cache in Redis for 5 min
7. `prisma/seed.ts` — seed a demo campaign (`isDemo: true`) with known public key for the playground
8. Vitest tests: tenant signup, login, campaign creation, Redis cache hit on second API call

**Verify:**
Register a tenant, create a campaign, confirm the public key resolves through `apiKeyAuth`.

---

### Phase 3 — Input Validation & Abuse Prevention

Prevent bots, disposable emails, and self-referral gaming.

**Email Normalization (`utils/emailNormalizer.ts`):**
- Lowercase and trim
- Strip everything between `+` and `@`
- For `gmail.com` / `googlemail.com`: remove dots in local part, normalize domain to `gmail.com`
- Example: `A.R.P.I.T+test@googlemail.com` → `arpit@gmail.com`

**Disposable Domain Blocking:**
- Load `scripts/disposable-domains.txt` into a Redis Set (`fraud:disposable_domains`) on startup
- Check with `SISMEMBER` — O(1) lookup

**DNS MX Verification (async, non-blocking):**
- After the signup response is sent, queue a background job to verify the domain has valid MX records via `dns.promises.resolveMx()` with a 2-second timeout
- Cache valid domains in Redis for 24 hours (`fraud:mx_valid:{domain}`)
- If MX check fails, flag the participant (don't block — reduces false positives from slow DNS)

**IP Rate Limiting (`middlewares/rateLimiter.ts`):**
- Sliding window: max 5 signups per IP per 15 minutes per campaign
- Uses Redis sorted set with timestamp scoring (clean expired entries on each check)
- Self-referral detection: flag when new participant's IP matches referrer's IP within the same campaign

All blocked attempts are logged to `FraudBlockLog` with a reason code.

**Verify:**
- Unit test: `A.R.P.I.T+spam@googlemail.com` → `arpit@gmail.com`
- Integration test: `test@mailinator.com` returns `400` with error code `DISPOSABLE_EMAIL` and creates a `FraudBlockLog` row
- Integration test: 6th rapid signup from same IP returns `429`

---

### Phase 4 — Waitlist Core & Redis Leaderboard

The heart of the product — joining the waitlist and seeing your live rank.

**`POST /api/v1/waitlist/join` (requires `X-Campaign-Key`):**
1. Run fraud checks from Phase 3
2. Normalize email, check for existing `[campaignId, canonicalEmail]` — if exists, return current rank idempotently (`200`)
3. Insert participant (status: `PENDING`), generate referral code and verification token
4. Add to Redis ZSET with `joinedAt` as score
5. Get position via `ZRANK` + 1, total via `ZCARD`
6. Queue verification email job (BullMQ → Resend)
7. Return `201`:

```json
{
  "participantId": "uuid",
  "referralCode": "bright-fox-9k2",
  "referralLink": "https://yoursite.com?ref=bright-fox-9k2",
  "position": 412,
  "totalParticipants": 1847,
  "verifiedReferrals": 0,
  "nextMilestone": { "count": 3, "reward": "Early Beta Access" },
  "status": "PENDING"
}
```

**`GET /api/v1/waitlist/status/:referralCode`:**
- Fetch participant from Postgres, pipeline `ZRANK` + `ZCARD` from Redis
- Include milestone progress

**`GET /api/v1/waitlist/leaderboard`:**
- `ZRANGE` top 20 with scores, hydrate with participant emails (masked: `a***t@gmail.com`)

**Startup reconciliation:**
- On boot, check if leaderboard key exists. If not (Redis was restarted), rebuild from Postgres. Log a warning.

**Verify:**
Sign up 10 users sequentially. Confirm positions are 1–10. Confirm `ZRANK` calls return in under 5ms.

---

### Phase 5 — Email Verification, Referral Attribution & Webhooks

The referral loop: verify → credit referrer → trigger webhooks.

**`POST /api/v1/waitlist/verify?token=<token>`:**

Runs inside a Postgres interactive transaction (`prisma.$transaction`):
1. Find participant where `verificationToken == token AND status == PENDING` — if no match, return `400` (already verified or invalid)
2. Set `status = VERIFIED`, `verifiedAt = now()`, clear `verificationToken`
3. If `referredById` exists:
   - Increment referrer's `verifiedReferrals` by 1
   - `ZINCRBY campaign:{id}:leaderboard -{bonusSec} <referrerId>` — referrer jumps ahead immediately
   - Check if referrer crossed a milestone threshold → queue `milestone.unlocked` webhook + email

**`POST /api/v1/waitlist/demo-simulate` (playground only):**
- Guarded: only works on campaigns with `isDemo: true`
- Rate limited: 3 simulations per IP per minute
- Creates a fake verified referral for the requesting participant, credits the rank jump

**Webhook Delivery (`jobs/webhookJob.ts`):**
- Signs payload with HMAC-SHA256: `X-QueueJump-Signature: sha256=<hex>`
- POST to `campaign.webhookUrl` with 5-second timeout
- Log every attempt in `WebhookDeliveryLog`
- On failure: BullMQ automatic retry with exponential backoff (10s → 60s → 5min), max 3 attempts

**Email Jobs (`jobs/emailJob.ts`):**
- Verification email: contains link to `POST /api/v1/waitlist/verify?token=<token>`
- Milestone email: congratulates user on unlocking a reward tier
- Sent via Resend SDK

**Verify:**
User A signs up (position #1). User B signs up (position #2). User C signs up with User B's referral code (position #3). Verify User C's email. Confirm User B's Redis score drops by `referralBonusSec` and User B is now at position #1.

---

### Phase 6 — Embeddable Widget, API Docs & Load Testing

**`widget.js` (`backend/public/widget.js`):**
- Vanilla JS, zero dependencies, < 8KB gzipped
- Mounts inside a Shadow DOM to prevent style leakage from host pages
- Reads `data-key` attribute from the host `<div>` to get the campaign public key
- Detects `?ref=` query parameter for referral attribution
- Usage:
  ```html
  <div id="queuejump" data-key="pk_live_abc123"></div>
  <script src="https://your-domain.com/widget.js"></script>
  ```

**API Documentation:**
- Swagger/OpenAPI spec at `/api/docs`
- Generated from route decorators or a maintained `openapi.yaml`

**Load Test (`scripts/k6-load-test.js`):**
- 200 virtual users, 2-minute sustained run
- Mix: 70% join, 30% status check
- Document observed p50/p95/p99 latencies (don't hardcode pass/fail thresholds — measure and report)

**Verify:**
- Drop `widget.js` into a plain HTML file, confirm the signup flow works cross-origin
- Run k6 script, document results

---

### Phase 7 — Landing Page & Live Playground

Initialize the Next.js frontend and build the marketing site.

**Design Direction:**
Study the Hero, Bento, and CTA sections on [vibrant.design](https://vibrant.design) for the level of craft we're targeting. The landing page should feel like it belongs next to tools like Linear, Resend, or Dub — not like a hackathon project.

**Design System:**
- **Mode:** Dark — deep neutral canvas (`hsl(240 10% 4%)`), elevated cards with subtle `1px` borders (`rgba(255,255,255,0.06)`), no harsh pure-black backgrounds
- **Accent:** A warm signal orange for primary CTAs and interactive elements. Emerald green for "verified" / "live" status indicators.
- **Typography:** `Inter` or `Plus Jakarta Sans` for UI text (tight tracking, medium weight for headings). `JetBrains Mono` or `Geist Mono` for all data — queue positions, latency numbers, API keys, referral codes, code snippets.
- **Motion:** Framer Motion spring physics for the rank odometer, subtle `scale(0.98)` press feedback on buttons, staggered fade-in on scroll for sections. No gratuitous animation — every transition should communicate state change.
- **Spacing & Layout:** Generous whitespace. Max content width ~1200px. Sections separated by ample vertical rhythm, not heavy dividers.

**Section 1 — Hero with Live Playground:**
Split layout. Left: pill badge, bold headline ("Turn your waitlist into a growth engine"), subtext explaining the product, and a `<script>` snippet with copy button. Right: a working waitlist card connected to the seeded demo campaign — enter an email, card transitions to show live rank, referral link, and a "Simulate a Friend Referral" button. Clicking it calls the demo-simulate endpoint and rolls the position number down with spring animation. Show a small monospace label confirming the Redis operation completed.

**Section 2 — Feature Bento Grid:**
3 modular cards, asymmetric layout (`2-col + 1-col` or similar):
- **Speed card:** Animated comparison — traditional SQL position lookup vs Redis ZSET, with a latency bar that fills in real time
- **Fraud prevention card:** Terminal-style feed showing blocked signup attempts with reason codes, auto-scrolling
- **Webhooks card:** Visual flow diagram: referral verified → job queued → signed webhook delivered

Each card should have subtle hover elevation and interactive elements (not static images).

**Section 3 — How It Works:**
3-step horizontal strip with a tabbed code block switching between the HTML embed snippet and a `curl` example showing the raw API response.

**Section 4 — CTA:**
Full-width dark section with a clear call to action. "Start building" button links to `/login`.

**Verify:**
`npm run dev` on frontend. Visit `localhost:3000`. Enter an email in the playground, see a real position. Click simulate, watch the rank animate down.

---

### Phase 8 — Founder Dashboard

Build the authenticated dashboard that founders use daily.

**Layout:** Collapsible sidebar with campaign switcher. Main content area with tab navigation.

**Top Metrics Strip:**
4 cards in monospace: Total Signups, Viral Coefficient (referrals per user), Fraud Blocks (last 7d), Leaderboard Size. Data fetched from `/api/v1/dashboard/stats/:campaignId`.

**Campaign Settings:**
- Create/edit campaign name
- Set `referralBonusSec` with a human-readable label ("Each referral jumps the user ahead by X hours")
- Milestone builder: add/remove reward tiers (`{ count, reward }`)
- Webhook URL configuration with a "Send Test" button

**Leaderboard View:**
Paginated table: rank, masked email, referral code, verified referral count, status badge (PENDING / VERIFIED / FLAGGED), joined date. Real-time updates via polling every 10s.

**Fraud Log View:**
Table of `FraudBlockLog` entries: timestamp, raw email, IP, reason badge (color-coded by type). Filterable by reason.

**API Keys & Embed:**
- One-click copy for `pk_live_...` and `sk_live_...`
- Live preview of the embeddable widget with the campaign's actual public key
- Code snippet ready to paste

**Verify:**
Log in, create a campaign. Use `curl` to sign up with a `mailinator.com` email — see the fraud log update in the dashboard. Create a legitimate signup — see the leaderboard update.

---

### Phase 9 — Polish, Widget View & Hardening

Final pass: standalone embed page, edge cases, and production readiness.

**Standalone Embed View (`/embed/[publicKey]`):**
A clean, borderless page designed to be loaded in an iframe or linked from the widget. Supports `?ref=` query param for referral tracking. Includes one-click share buttons (X, WhatsApp, LinkedIn) and a milestone progress bar.

**Production Hardening:**
- `helmet` security headers on all routes
- Request body size limits (100KB)
- Graceful shutdown: drain BullMQ workers, close DB connections
- `NODE_ENV` gating: demo-simulate endpoint disabled in production unless campaign is `isDemo: true`
- Add `robots.txt` and proper `<meta>` tags for SEO on the landing page

**Edge Cases to Handle:**
- Redis connection drops mid-request: fall back to Postgres-based rank calculation (slower but correct)
- Duplicate verification clicks: idempotent, return success without re-crediting
- Campaign deletion: cascade-delete participants and leaderboard key
- Referral code collision: retry with a new random suffix (max 3 attempts)

**Verify:**
Full end-to-end walkthrough: land on homepage → try playground → sign up as tenant → create campaign → test widget embed on a separate HTML page → verify a referral flows through correctly → check dashboard updates.

---

## 7. Conventions

**Code Organization:**
- Controllers are thin — parse HTTP input (validated with zod), call a service, return the response
- Business logic lives in `services/`
- Database access lives in `repositories/` (or Prisma calls in services for simple queries)
- Every external input is validated with a zod schema before it touches business logic

**TypeScript:**
- `strict: true`, no `any`, no `ts-ignore`
- Shared types in `types/` directory within each module

**Error Handling:**
- Custom `AppError` class with `statusCode`, `code` (stable string), and `message`
- Global error handler catches all unhandled errors, logs them, and returns the standard error envelope
- Never leak stack traces or internal details in production responses

**Testing:**
- Unit tests for pure logic (email normalizer, HMAC signing, score calculations)
- Integration tests for API endpoints (with test database + Redis, reset between tests)
- No mocking Redis or Postgres in integration tests — use real instances from Docker

**Git:**
- Commit after each phase passes verification
- Conventional commit messages: `feat(phase-1): foundation and docker setup`

---

## 8. Future Considerations (Not In Scope)

These are explicitly **not** part of the initial build but worth noting for later:

- **Proper Milestone table** — replace `milestonesJson` with a normalized relation
- **Analytics dashboard** — daily signup trends, referral conversion funnel
- **Custom widget theming** — let founders customize colors, copy, and layout
- **Email template editor** — custom verification and milestone email content
- **Team accounts** — multiple users per tenant
- **Webhook signature verification docs** — public guide for customers to verify signatures
- **Rate limiting dashboard** — let founders adjust rate limits per campaign
- **Data export** — CSV/JSON export of participant lists
- **GDPR compliance** — data deletion requests, consent tracking, retention policies
