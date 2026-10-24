import Redis from "ioredis";
import { env } from "./env";

// Normalize URL to rediss:// if connecting to Upstash or remote host
let redisUrlStr = env.REDIS_URL.trim();
if (
  redisUrlStr.startsWith("redis://") &&
  (redisUrlStr.includes("upstash.io") || (!redisUrlStr.includes("localhost") && !redisUrlStr.includes("127.0.0.1")))
) {
  redisUrlStr = "rediss://" + redisUrlStr.slice("redis://".length);
}

const isTls = redisUrlStr.startsWith("rediss://");
const redisUrl = new URL(redisUrlStr);

export const redis = new Redis(redisUrlStr, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  commandTimeout: 3000,
  connectTimeout: 5000,
  enableOfflineQueue: false,
  family: 0,
  tls: isTls
    ? {
        servername: redisUrl.hostname,
        rejectUnauthorized: false,
      }
    : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 3000);
    return delay;
  },
});

redis.on("error", (err) => {
  console.warn("Redis connection warning:", err.message);
});

export async function pingRedis(): Promise<{ status: "up" | "down"; latencyMs?: number; error?: string }> {
  try {
    const start = Date.now();
    const pingPromise = redis.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Redis ping timed out")), 2000)
    );
    await Promise.race([pingPromise, timeoutPromise]);
    return { status: "up", latencyMs: Date.now() - start };
  } catch (err: any) {
    return { status: "down", error: err.message };
  }
}
