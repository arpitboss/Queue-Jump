import Redis from "ioredis";
import { env } from "./env";

const isTls = env.REDIS_URL.startsWith("rediss://");

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  tls: isTls ? { rejectUnauthorized: false } : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 150, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  console.warn("Redis connection warning:", err.message);
});

export async function pingRedis(): Promise<{ status: "up" | "down"; latencyMs?: number; error?: string }> {
  try {
    const start = Date.now();
    await redis.ping();
    return { status: "up", latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: "down", error: err.message };
  }
}
