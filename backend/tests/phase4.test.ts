vi.mock("../src/jobs/emailJob", () => ({
  dispatchEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/jobs/webhookJob", () => ({
  dispatchWebhook: vi.fn().mockResolvedValue(undefined),
}));
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";

const participantsDb = new Map<string, any>();
const zsetMembers = new Map<string, number>();

vi.mock("../src/config/db", () => ({
  prisma: {
    campaign: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.publicKey === "pk_live_demo_test") {
          return Promise.resolve({
            id: "camp_demo_123",
            tenantId: "tenant_1",
            name: "Demo Campaign",
            publicKey: "pk_live_demo_test",
            referralBonusSec: 86400,
            webhookUrl: null,
            webhookSecret: "whsec_test",
            milestonesJson: JSON.stringify([{ count: 3, reward: "Beta Pass" }]),
            isDemo: true,
          });
        }
        return Promise.resolve(null);
      }),
    },
    participant: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.campaignId_canonicalEmail) {
          const { campaignId, canonicalEmail } = where.campaignId_canonicalEmail;
          for (const p of participantsDb.values()) {
            if (p.campaignId === campaignId && p.canonicalEmail === canonicalEmail) {
              return Promise.resolve(p);
            }
          }
        }
        if (where.referralCode) {
          for (const p of participantsDb.values()) {
            if (p.referralCode === where.referralCode) return Promise.resolve(p);
          }
        }
        if (where.id) return Promise.resolve(participantsDb.get(where.id) || null);
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = `part_${Date.now()}_${Math.random()}`;
        const created = { id, verifiedReferrals: 0, status: "PENDING", ...data };
        participantsDb.set(id, created);
        return Promise.resolve(created);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const ids: string[] = where.id?.in || [];
        const result = ids.map((id) => participantsDb.get(id)).filter(Boolean);
        return Promise.resolve(result);
      }),
    },
    fraudBlockLog: {
      create: vi.fn().mockResolvedValue({ id: "log_1" }),
    },
  },
}));

vi.mock("../src/config/redis", () => ({
  redis: {
    get: vi.fn().mockImplementation((key) => {
      if (key === "campaign:pk:pk_live_demo_test") {
        return Promise.resolve(
          JSON.stringify({
            id: "camp_demo_123",
            name: "Demo Campaign",
            publicKey: "pk_live_demo_test",
            referralBonusSec: 86400,
            webhookUrl: null,
            milestonesJson: [{ count: 3, reward: "Beta Pass" }],
            isDemo: true,
          })
        );
      }
      return Promise.resolve(null);
    }),
    setex: vi.fn().mockResolvedValue("OK"),
    sismember: vi.fn().mockResolvedValue(0),
    pipeline: vi.fn().mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      zrank: vi.fn().mockReturnThis(),
      exec: vi.fn().mockImplementation(() => {
        return Promise.resolve([
          [null, 0], // zrank: index 0 (#1)
          [null, zsetMembers.size || 1], // zcard: total
        ]);
      }),
    }),
    zadd: vi.fn().mockImplementation((_k, score, member) => {
      zsetMembers.set(member, score);
      return Promise.resolve(1);
    }),
    zcard: vi.fn().mockImplementation(() => Promise.resolve(zsetMembers.size)),
    zscore: vi.fn().mockResolvedValue("1700000000"),
    zcount: vi.fn().mockResolvedValue(12),
    zrange: vi.fn().mockImplementation(() => {
      const entries: string[] = [];
      for (const [member, score] of zsetMembers.entries()) {
        entries.push(member, score.toString());
      }
      return Promise.resolve(entries);
    }),
  },
}));

describe("Phase 4: Waitlist Signup & Redis Leaderboard Core", () => {
  beforeEach(() => {
    participantsDb.clear();
    zsetMembers.clear();
  });

  it("requires X-Campaign-Key for waitlist signup", async () => {
    const res = await request(app)
      .post("/api/v1/waitlist/join")
      .send({ email: "tester@gmail.com" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CAMPAIGN_KEY");
  });

  it("allows a user to join waitlist and returns 201 with position and referral link", async () => {
    const res = await request(app)
      .post("/api/v1/waitlist/join")
      .set("X-Campaign-Key", "pk_live_demo_test")
      .send({ email: "arpit@example.com" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("participantId");
    expect(res.body).toHaveProperty("referralCode");
    expect(res.body).toHaveProperty("position");
    expect(res.body).toHaveProperty("referralLink");
    expect(res.body.status).toBe("PENDING");
  });

  it("returns idempotent 200 response when same email joins again", async () => {
    await request(app)
      .post("/api/v1/waitlist/join")
      .set("X-Campaign-Key", "pk_live_demo_test")
      .send({ email: "repeat@example.com" });

    const res = await request(app)
      .post("/api/v1/waitlist/join")
      .set("X-Campaign-Key", "pk_live_demo_test")
      .send({ email: "repeat@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.isNewSignup).toBe(false);
  });

  it("looks up participant status by referral code", async () => {
    const joinRes = await request(app)
      .post("/api/v1/waitlist/join")
      .set("X-Campaign-Key", "pk_live_demo_test")
      .send({ email: "lookup@example.com" });

    const code = joinRes.body.referralCode;

    const statusRes = await request(app)
      .get(`/api/v1/waitlist/status/${code}`)
      .set("X-Campaign-Key", "pk_live_demo_test");

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.referralCode).toBe(code);
    expect(statusRes.body).toHaveProperty("potentialJump");
  });
});