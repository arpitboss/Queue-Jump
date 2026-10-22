import { redis } from "../config/redis";

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  resetSeconds: number;
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
    // 1. Remove expired timestamps
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    // 2. Count requests in current window
    pipeline.zcard(redisKey);
    // 3. Add current timestamp
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
    // 4. Set expiry on the whole set
    pipeline.expire(redisKey, windowSeconds);

    const results = await pipeline.exec();
    if (!results) {
      return { allowed: true, currentCount: 1, remaining: limit - 1, resetSeconds: windowSeconds };
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
    // If Redis fails, allow request through so system doesn't outage
    console.warn("Rate limiter Redis failure, allowing request:", (err as Error).message);
    return { allowed: true, currentCount: 1, remaining: limit - 1, resetSeconds: windowSeconds };
  }
}