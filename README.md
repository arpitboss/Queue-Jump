# ⚡ QueueJump

> **High-concurrency, viral waitlist and referral engine with sub-millisecond Redis ZSET rank calculations, multi-layer anti-fraud shields, and automated cohort rollouts.**

Built for founders and growth engineers who want to turn product launches into viral loops (Robinhood / Superhuman style).

---

## ✨ Features

- **⚡ Sub-Millisecond Rank Telemetry**: Powered by Redis Sorted Sets (`ZSET`). Atomic score updates and rank lookups with zero DB bottleneck even under viral traffic spikes.
- **🎨 2-Line Drop-in Widget**: Encapsulated in native browser **Shadow DOM** for 100% CSS isolation. Supports `dark` and `light` modes plus custom brand accent colors (`data-accent`).
- **🔗 Automatic Host Referral Attribution**: Referral links automatically attribute back to the customer's actual landing page domain (`mycoolsite.com?ref=code`).
- **🛡️ 4-Layer Anti-Fraud Shield**:
  - Disposable temporary email domain blocking (50,000+ domains).
  - Real-time DNS MX record verification.
  - IP sliding-window velocity rate limiting.
  - Self-referral IP matching and circular referral graph cycle detection.
- **🚀 Staged Cohort Beta Rollouts**: Grant access in waves (Top 10, 25, 50, 100). Sets status to `ADMITTED` and dispatches real-time webhooks.
- **📥 1-Click CSV Export**: Download complete waitlist data with ranks, canonical emails, referral counts, and timestamps.
- **🔔 Real-Time Signed Webhooks**: Cryptographically signed HMAC-SHA256 payloads for `participant.verified`, `milestone.unlocked`, and `participant.admitted`.
- **⚙️ Headless API Mode**: Complete REST API for teams building 100% custom UI in React, Vue, Next.js, or mobile apps.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack), TailwindCSS, Lucide Icons, Canvas Confetti |
| **Backend API** | Node.js, Express, TypeScript, Zod Schema Validation |
| **Database** | PostgreSQL with Prisma ORM |
| **Cache & Queue** | Redis (ioredis), BullMQ background worker |
| **Security & Email** | JWT, bcryptjs, crypto HMAC, Resend API (with local fallback mock) |
| **Documentation** | OpenAPI 3.0 & Interactive Swagger UI (`/api/docs`) |

---

## 🚀 Quickstart

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/arpitboss/Queue-Jump.git
cd Queue-Jump

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the backend:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/queuejump"
REDIS_URL="redis://localhost:6379"
PORT=4000
NODE_ENV="development"
JWT_ACCESS_SECRET="your-64-char-random-jwt-secret"
JWT_REFRESH_SECRET="your-64-char-random-refresh-secret"
RESEND_API_KEY="re_..." # Optional for local development
APP_URL="http://localhost:3000"
API_URL="http://localhost:4000"
```

In `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 3. Initialize Database & Seed Demo Data
```bash
cd backend
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Locally
Start both backend and frontend development servers:
```bash
# Terminal 1 - Backend API (Port 4000)
cd backend && npm run dev

# Terminal 2 - Frontend App (Port 3000)
cd frontend && npm run dev
```

Visit:
- **Landing & Playground**: [http://localhost:3000](http://localhost:3000)
- **Founder Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Swagger API Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🔌 Integration Guide

### Option A: 2-Line Drop-In Widget (Webflow, Framer, WordPress, HTML)
Add this anywhere on your website:

```html
<!-- Place where you want the waitlist card to appear -->
<div 
  id="queuejump" 
  data-key="pk_live_your_campaign_key"
  data-theme="dark"
  data-accent="#3074FE">
</div>

<!-- Load the embed script -->
<script src="https://your-queuejump-backend.com/widget.js" async></script>
```

#### Widget Configuration Attributes:
| Attribute | Description | Default |
|---|---|---|
| `data-key` | **Required**. Public campaign key (`pk_live_...`) | None |
| `data-theme` | Visual theme: `dark` or `light` | `dark` |
| `data-accent` | Hex color for buttons, badges, and focus borders | `#3074FE` |
| `data-api-url` | Backend host URL (auto-detected from script src) | Auto |

---

### Option B: Headless REST API (Custom React / Next.js / Mobile)

#### 1. Join Waitlist
```bash
curl -X POST https://your-queuejump-backend.com/api/v1/waitlist/join \
  -H "Content-Type: application/json" \
  -H "X-Campaign-Key: pk_live_your_key_here" \
  -d '{
    "email": "sarah@acme.com",
    "referralCode": "optional_ref_code",
    "originUrl": "https://acme.com"
  }'
```

**Response (201 Created)**:
```json
{
  "isNewSignup": true,
  "participantId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "referralCode": "sarah42",
  "referralLink": "https://acme.com?ref=sarah42",
  "position": 14,
  "totalParticipants": 850,
  "verifiedReferrals": 0,
  "status": "VERIFIED"
}
```

#### 2. Check Participant Queue Status
```bash
curl https://your-queuejump-backend.com/api/v1/waitlist/status/sarah42 \
  -H "X-Campaign-Key: pk_live_your_key_here"
```

#### 3. Fetch Top Leaderboard
```bash
curl "https://your-queuejump-backend.com/api/v1/waitlist/leaderboard?limit=25" \
  -H "X-Campaign-Key: pk_live_your_key_here"
```

---

## 🪝 Webhooks & Verification

QueueJump sends signed HTTP POST payloads when critical events happen. Verify the authenticity of each request using your **Webhook Secret**:

### Node.js Signature Verification Example
```javascript
const crypto = require("crypto");

function verifyQueueJumpWebhook(req, secret) {
  const signature = req.headers["x-queuejump-signature"];
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

### Supported Webhook Events
- `participant.verified`: Triggered when a new user confirms their place in line.
- `milestone.unlocked`: Triggered when a participant hits a referral milestone (e.g., 5 referrals unlock Early Access).
- `participant.admitted`: Triggered when a founder rolls out beta access to a cohort.

---

## 📄 License
MIT License. Free to use for personal and commercial projects.
