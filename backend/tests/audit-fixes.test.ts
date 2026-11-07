import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";

vi.mock("../src/config/db", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe("Audit Fixes & Security Hardening Verification", () => {
  it("GET /api/v1/telemetry/stats returns online server health and telemetry metrics", async () => {
    const res = await request(app).get("/api/v1/telemetry/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalVisits");
    expect(res.body).toHaveProperty("backendStatus");
    expect(res.body.backendStatus.status).toBe("online");
  });

  it("POST /api/v1/telemetry/visit records site visit beacon", async () => {
    const res = await request(app)
      .post("/api/v1/telemetry/visit")
      .send({ path: "/", referrer: "https://peerlist.io" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("POST /api/v1/tenants/logout clears cookie and returns 200", async () => {
    const res = await request(app).post("/api/v1/tenants/logout");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("Validates invalid input on login with 400", async () => {
    const res = await request(app)
      .post("/api/v1/tenants/login")
      .send({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });
});