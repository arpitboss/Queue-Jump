import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { RateLimitError } from "../utils/errors";

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  resetSeconds: number;
}

// In-memory sliding window fallback in case Redis is offline or degraded
const memoryStore = new Map<string, number[]>();

function checkMemoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  let timestamps = memoryStore.get(key) || [];
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    memoryStore.set(key, timestamps);
    return {
      allowed: false,
      currentCount: timestamps.length,
      remaining: 0,
      resetSeconds: windowSeconds,
    };
  }

  timestamps.push(now);
  memoryStore.set(key, timestamps);

  if (memoryStore.size > 5000) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.length === 0 || v[v.length - 1] < windowStart) {
        memoryStore.delete(k);
      }
    }
  }

  return {
    allowed: true,
    currentCount: timestamps.length,
    remaining: Math.max(0, limit - timestamps.length),
    resetSeconds: windowSeconds,
  };
}

export async function checkRateLimit(
  key: string,
  limit = 5,
  windowSeconds = 900 // 15 minutes default
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const redisKey = `ratelimit:ip:${key}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    pipeline.zcard(redisKey);
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
    pipeline.expire(redisKey, windowSeconds);

    const results = await pipeline.exec();
    if (!results) {
      return checkMemoryRateLimit(key, limit, windowSeconds);
    }

    const currentCount = (results[1][1] as number) || 0;
    const allowed = currentCount < limit;

    return {
      allowed,
      currentCount: currentCount + 1,
      remaining: Math.max(0, limit - currentCount - 1),
      resetSeconds: windowSeconds,
    };
  } catch (err) {
    // Safe in-memory fallback prevents fail-open bypass when Redis is unreachable
    return checkMemoryRateLimit(key, limit, windowSeconds);
  }
}

export function createRateLimiter(options: {
  limit?: number;
  windowSeconds?: number;
  message?: string;
  prefix?: string;
}) {
  const limit = options.limit || 10;
  const windowSeconds = options.windowSeconds || 900;
  const message = options.message || "Too many requests. Please try again later.";
  const prefix = options.prefix || "global";

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const ip =
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.ip ||
      "127.0.0.1";

    const key = `${prefix}:${ip}`;
    const check = await checkRateLimit(key, limit, windowSeconds);

    if (!check.allowed) {
      next(new RateLimitError(message));
      return;
    }
    next();
  };
}