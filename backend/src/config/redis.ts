import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

export async function pingRedis(): Promise<{ status: "up" | "down"; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    if (redis.status !== "ready" && redis.status !== "connecting") {
      await redis.connect();
    }
    const pong = await redis.ping();
    if (pong === "PONG") {
      return { status: "up", latencyMs: Date.now() - start };
    }
    return { status: "down", error: `Unexpected response: ${pong}` };
  } catch (err: any) {
    return { status: "down", error: err.message };
  }
}