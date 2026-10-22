import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";

// Mock the db and redis pings for unit testing when containers are not yet running
vi.mock("../src/config/db", () => ({
  pingPostgres: vi.fn().mockResolvedValue({ status: "up", latencyMs: 2 }),
  prisma: {
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../src/config/redis", () => ({
  pingRedis: vi.fn().mockResolvedValue({ status: "up", latencyMs: 1 }),
  redis: {
    quit: vi.fn().mockResolvedValue("OK"),
  },
}));

describe("API Foundation & Health Checks", () => {
  it("GET / returns 200 with API metadata", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "QueueJump API");
    expect(res.body).toHaveProperty("status", "running");
  });

  it("GET /api/v1/health returns 200 and healthy telemetry when dependencies are up", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("postgres", "up");
    expect(res.body).toHaveProperty("redis", "up");
    expect(res.body).toHaveProperty("telemetry");
    expect(res.body.telemetry).toHaveProperty("postgresLatencyMs");
    expect(res.body.telemetry).toHaveProperty("redisLatencyMs");
    expect(res.body.telemetry).toHaveProperty("uptimeSeconds");
  });

  it("GET /api/v1/nonexistent returns 404 with standardized error envelope", async () => {
    const res = await request(app).get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("code", "NOT_FOUND");
    expect(res.body.error).toHaveProperty("message");
  });
});