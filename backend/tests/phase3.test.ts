import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeEmail } from "../src/utils/emailNormalizer";
import { isDisposableDomain, loadDisposableDomains } from "../src/modules/fraud/disposableDomainService";
import { fraudService } from "../src/modules/fraud/fraud.service";

const fraudLogsDb: any[] = [];
const participantsDb = new Map<string, any>();
const rateLimitStore = new Map<string, number[]>();

vi.mock("../src/config/db", () => ({
  prisma: {
    fraudBlockLog: {
      create: vi.fn().mockImplementation(({ data }) => {
        const item = { id: `log_${Date.now()}`, ...data, createdAt: new Date() };
        fraudLogsDb.push(item);
        return Promise.resolve(item);
      }),
      count: vi.fn().mockImplementation(() => Promise.resolve(fraudLogsDb.length)),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(fraudLogsDb)),
    },
    participant: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id) return Promise.resolve(participantsDb.get(where.id) || null);
        return Promise.resolve(null);
      }),
    },
  },
}));

vi.mock("../src/config/redis", () => ({
  redis: {
    sadd: vi.fn().mockResolvedValue(1),
    sismember: vi.fn().mockImplementation((_key, member) => {
      const known = ["mailinator.com", "10minutemail.com", "tempmail.com", "yopmail.com"];
      return Promise.resolve(known.includes(member) ? 1 : 0);
    }),
    pipeline: vi.fn().mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockImplementation(async function (this: any) {
        // Return simulated rate limit counts
        return [
          [null, 0],
          [null, rateLimitCountTracker],
          [null, 1],
          [null, 1],
        ];
      }),
    }),
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue("OK"),
  },
}));

let rateLimitCountTracker = 0;

describe("Phase 3: Email Normalization & Anti-Fraud Engine", () => {
  beforeEach(async () => {
    fraudLogsDb.length = 0;
    participantsDb.clear();
    rateLimitCountTracker = 0;
    await loadDisposableDomains();
  });

  describe("Email Normalizer", () => {
    it("strips +alias and normalizes googlemail.com to gmail.com without dots", () => {
      const result = normalizeEmail("Arpit.Verma+spam99@googlemail.com");
      expect(result.canonicalEmail).toBe("arpitverma@gmail.com");
      expect(result.domain).toBe("gmail.com");
      expect(result.localPart).toBe("arpitverma");
    });

    it("strips +alias for regular custom domain without removing dots", () => {
      const result = normalizeEmail("john.doe+waitlist@startup.io");
      expect(result.canonicalEmail).toBe("john.doe@startup.io");
      expect(result.domain).toBe("startup.io");
    });

    it("throws error for malformed emails", () => {
      expect(() => normalizeEmail("invalid-email")).toThrow();
      expect(() => normalizeEmail("@domain.com")).toThrow();
      expect(() => normalizeEmail("user@")).toThrow();
    });
  });

  describe("Disposable Domain Blocker", () => {
    it("identifies known temporary email domains", async () => {
      expect(await isDisposableDomain("mailinator.com")).toBe(true);
      expect(await isDisposableDomain("10minutemail.com")).toBe(true);
      expect(await isDisposableDomain("yopmail.com")).toBe(true);
      expect(await isDisposableDomain("gmail.com")).toBe(false);
      expect(await isDisposableDomain("customstartup.co")).toBe(false);
    });
  });

  describe("Fraud Service Validation", () => {
    it("blocks disposable email and writes to FraudBlockLog", async () => {
      await expect(
        fraudService.validateParticipantSignup({
          campaignId: "camp_1",
          rawEmail: "bot123@mailinator.com",
          ipAddress: "192.168.1.1",
        })
      ).rejects.toThrow("Temporary or disposable email domains are not allowed.");

      expect(fraudLogsDb.length).toBe(1);
      expect(fraudLogsDb[0].reason).toBe("DISPOSABLE_DOMAIN");
      expect(fraudLogsDb[0].rawEmail).toBe("bot123@mailinator.com");
    });

    it("detects self-referral when IP matches the referrer", async () => {
      participantsDb.set("ref_user_1", {
        id: "ref_user_1",
        ipAddress: "203.0.113.42",
        canonicalEmail: "original@gmail.com",
      });

      const result = await fraudService.validateParticipantSignup({
        campaignId: "camp_1",
        rawEmail: "friend@yahoo.com",
        ipAddress: "203.0.113.42", // same IP as referrer
        referrerId: "ref_user_1",
      });

      expect(result.isSelfReferral).toBe(true);
      expect(fraudLogsDb.some((log) => log.reason === "SELF_REFERRAL_IP")).toBe(true);
    });

    it("enforces sliding-window rate limit on rapid signups", async () => {
      rateLimitCountTracker = 5; // Reached limit

      await expect(
        fraudService.validateParticipantSignup({
          campaignId: "camp_1",
          rawEmail: "user6@gmail.com",
          ipAddress: "198.51.100.5",
        })
      ).rejects.toThrow("Too many signup attempts");

      expect(fraudLogsDb.some((log) => log.reason === "IP_RATE_LIMIT")).toBe(true);
    });
  });
});