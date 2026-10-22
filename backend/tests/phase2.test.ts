import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";

// In-memory mock stores for unit/integration testing
const tenantsDb = new Map<string, any>();
const campaignsDb = new Map<string, any>();
const redisCache = new Map<string, string>();

vi.mock("../src/config/db", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.email) {
          for (const t of tenantsDb.values()) {
            if (t.email === where.email) return Promise.resolve(t);
          }
        }
        if (where.id) return Promise.resolve(tenantsDb.get(where.id) || null);
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data, select }) => {
        const id = `tenant_${Date.now()}`;
        const created = { id, ...data, createdAt: new Date() };
        tenantsDb.set(id, created);
        return Promise.resolve({
          id,
          name: created.name,
          email: created.email,
          createdAt: created.createdAt,
        });
      }),
    },
    campaign: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = `camp_${Date.now()}`;
        const created = { id, ...data, createdAt: new Date() };
        campaignsDb.set(id, created);
        return Promise.resolve(created);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const list = Array.from(campaignsDb.values()).filter((c) => c.tenantId === where.tenantId);
        return Promise.resolve(
          list.map((c) => ({
            ...c,
            _count: { participants: 0, fraudLogs: 0 },
          }))
        );
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.publicKey) {
          for (const c of campaignsDb.values()) {
            if (c.publicKey === where.publicKey) return Promise.resolve(c);
          }
        }
        if (where.id) return Promise.resolve(campaignsDb.get(where.id) || null);
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const item = campaignsDb.get(where.id);
        if (!item) return Promise.resolve(null);
        const updated = { ...item, ...data };
        campaignsDb.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
  },
  pingPostgres: vi.fn().mockResolvedValue({ status: "up" }),
}));

vi.mock("../src/config/redis", () => ({
  redis: {
    get: vi.fn().mockImplementation((key) => Promise.resolve(redisCache.get(key) || null)),
    setex: vi.fn().mockImplementation((key, _ttl, val) => {
      redisCache.set(key, val);
      return Promise.resolve("OK");
    }),
    del: vi.fn().mockImplementation((key) => {
      redisCache.delete(key);
      return Promise.resolve(1);
    }),
    ping: vi.fn().mockResolvedValue("PONG"),
    status: "ready",
  },
  pingRedis: vi.fn().mockResolvedValue({ status: "up" }),
}));

describe("Phase 2: Tenant & Campaign Management + API Key Auth", () => {
  beforeEach(() => {
    tenantsDb.clear();
    campaignsDb.clear();
    redisCache.clear();
  });

  it("registers a new tenant and returns access token + sets refresh cookie", async () => {
    const res = await request(app)
      .post("/api/v1/tenants/register")
      .send({
        name: "Acme Corp",
        email: "founder@acme.com",
        password: "securepassword123",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.tenant).toHaveProperty("email", "founder@acme.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("authenticates an existing tenant via login", async () => {
    await request(app)
      .post("/api/v1/tenants/register")
      .send({
        name: "Acme Corp",
        email: "founder@acme.com",
        password: "securepassword123",
      });

    const res = await request(app)
      .post("/api/v1/tenants/login")
      .send({
        email: "founder@acme.com",
        password: "securepassword123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("creates a campaign with live public key and one-time secret key", async () => {
    const regRes = await request(app)
      .post("/api/v1/tenants/register")
      .send({
        name: "Acme Corp",
        email: "founder@acme.com",
        password: "securepassword123",
      });

    const token = regRes.body.accessToken;

    const campRes = await request(app)
      .post("/api/v1/campaigns")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Acme Waitlist",
        referralBonusSec: 86400,
        milestones: [{ count: 3, reward: "Free Beta" }],
      });

    expect(campRes.status).toBe(201);
    expect(campRes.body.campaign.publicKey).toMatch(/^pk_live_[a-f0-9]{32}$/);
    expect(campRes.body.campaign.secretKey).toMatch(/^sk_live_[a-f0-9]{48}$/);
    expect(campRes.body.campaign.webhookSecret).toMatch(/^whsec_[a-f0-9]{48}$/);
  });

  it("rejects campaign creation without valid JWT token", async () => {
    const res = await request(app)
      .post("/api/v1/campaigns")
      .send({ name: "Rogue Campaign" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_HEADER_MISSING");
  });
});