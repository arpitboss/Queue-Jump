vi.mock("../src/jobs/emailJob", () => ({
  dispatchEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/jobs/webhookJob", () => ({
  dispatchWebhook: vi.fn().mockResolvedValue(undefined),
}));
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { signWebhookPayload, verifyWebhookSignature } from "../src/utils/hmac";

const participantsDb = new Map<string, any>();
const zsetMembers = new Map<string, number>();

vi.mock("../src/config/db", () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation(async (callback) => {
      const txMock = {
        participant: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.verificationToken) {
              for (const p of participantsDb.values()) {
                if (p.verificationToken === where.verificationToken) {
                  const referredBy = p.referredById ? participantsDb.get(p.referredById) : null;
                  return Promise.resolve({
                    ...p,
                    campaign: {
                      id: "camp_demo_1",
                      name: "Test",
                      referralBonusSec: 86400,
                      webhookUrl: null,
                      webhookSecret: null,
                      milestonesJson: [],
                    },
                    referredBy,
                  });
                }
              }
            }
            return Promise.resolve(null);
          }),
          update: vi.fn().mockImplementation(({ where, data }) => {
            const p = participantsDb.get(where.id);
            if (!p) return Promise.resolve(null);
            const updated = {
              ...p,
              ...data,
              verifiedReferrals:
                data.verifiedReferrals?.increment !== undefined
                  ? (p.verifiedReferrals || 0) + 1
                  : data.verifiedReferrals ?? p.verifiedReferrals,
            };
            participantsDb.set(where.id, updated);
            return Promise.resolve(updated);
          }),
        },
      };
      return callback(txMock);
    }),
    campaign: {
      findUnique: vi.fn().mockResolvedValue({
        id: "camp_demo_1",
        name: "Test Campaign",
        publicKey: "pk_live_demo_test",
        referralBonusSec: 86400,
        webhookUrl: null,
        webhookSecret: "whsec_test",
        milestonesJson: [],
        isDemo: true,
      }),
    },
    participant: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.referralCode) {
          for (const p of participantsDb.values()) {
            if (p.referralCode === where.referralCode) return Promise.resolve(p);
          }
        }
        if (where.id) return Promise.resolve(participantsDb.get(where.id) || null);
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const p = participantsDb.get(where.id);
        if (!p) return Promise.resolve(null);
        const updated = {
          ...p,
          verifiedReferrals:
            data.verifiedReferrals?.increment !== undefined
              ? (p.verifiedReferrals || 0) + 1
              : p.verifiedReferrals,
        };
        participantsDb.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    webhookDeliveryLog: {
      create: vi.fn().mockResolvedValue({ id: "wh_log_1" }),
    },
  },
}));

vi.mock("../src/config/redis", () => ({
  redis: {
    get: vi.fn().mockImplementation((key) => {
      if (key === "campaign:pk:pk_live_demo_test") {
        return Promise.resolve(
          JSON.stringify({
            id: "camp_demo_1",
            name: "Test Campaign",
            publicKey: "pk_live_demo_test",
            referralBonusSec: 86400,
            webhookUrl: null,
            webhookSecret: "whsec_test",
            milestonesJson: [],
            isDemo: true,
          })
        );
      }
      return Promise.resolve(null);
    }),
    pipeline: vi.fn().mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      zrank: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, 0],
        [null, 5],
      ]),
    }),
    zincrby: vi.fn().mockImplementation((_k, increment, member) => {
      const current = zsetMembers.get(member) || 100000;
      const updated = current + increment;
      zsetMembers.set(member, updated);
      return Promise.resolve(updated.toString());
    }),
    zrank: vi.fn().mockResolvedValue(0),
    zcard: vi.fn().mockResolvedValue(5),
  },
}));

describe("Phase 5: Double-Opt-In Verification & Webhooks", () => {
  beforeEach(() => {
    participantsDb.clear();
    zsetMembers.clear();
  });

  describe("HMAC Webhook Signatures", () => {
    it("signs and verifies payload signatures properly", () => {
      const payload = JSON.stringify({ event: "participant.verified", id: "123" });
      const secret = "whsec_secret_key_42";

      const signature = signWebhookPayload(payload, secret);
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);

      const isValid = verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);

      const tamperedValid = verifyWebhookSignature('{"tampered":true}', signature, secret);
      expect(tamperedValid).toBe(false);
    });
  });

  describe("Email Verification & Referral Crediting", () => {
    it("verifies participant email and credits the referrer with score reduction", async () => {
      // User A (Referrer)
      const userA = {
        id: "user_a",
        campaignId: "camp_demo_1",
        rawEmail: "usera@example.com",
        referralCode: "alpha-fox",
        status: "VERIFIED",
        verifiedReferrals: 0,
      };
      participantsDb.set("user_a", userA);
      zsetMembers.set("user_a", 100000);

      // User B (Signed up using User A's referral code)
      const userB = {
        id: "user_b",
        campaignId: "camp_demo_1",
        rawEmail: "userb@example.com",
        referralCode: "beta-wolf",
        referredById: "user_a",
        verificationToken: "token_123_valid",
        status: "PENDING",
      };
      participantsDb.set("user_b", userB);

      // Verify User B
      const res = await request(app).post("/api/v1/waitlist/verify?token=token_123_valid");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Confirm User A gained a verified referral
      expect(participantsDb.get("user_a").verifiedReferrals).toBe(1);

      // Confirm User B is now VERIFIED
      expect(participantsDb.get("user_b").status).toBe("VERIFIED");
    });

    it("rejects invalid or already-used verification tokens", async () => {
      const res = await request(app).post("/api/v1/waitlist/verify?token=non_existent_token");
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
  });

  describe("Demo Playground Simulation Endpoint", () => {
    it("simulates a referral jump for interactive playground demo", async () => {
      participantsDb.set("demo_user_1", {
        id: "demo_user_1",
        campaignId: "camp_demo_1",
        referralCode: "demo-code-99",
        verifiedReferrals: 0,
      });

      const res = await request(app)
        .post("/api/v1/waitlist/demo-simulate")
        .set("X-Campaign-Key", "pk_live_demo_test")
        .send({ referralCode: "demo-code-99" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("newPosition");
      expect(res.body).toHaveProperty("redisLatencyMs");
      expect(res.body.verifiedReferrals).toBe(1);
    });
  });
});