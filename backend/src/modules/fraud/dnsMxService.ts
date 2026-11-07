import dns from "dns";
import { redis } from "../../config/redis";

const CACHE_TTL_SECONDS = 86400; // 24 hours
const NEGATIVE_TTL_SECONDS = 3600; // 1 hour

export async function checkDomainMx(domain: string): Promise<boolean> {
  const norm = domain.trim().toLowerCase();
  if (
    norm === "example.com" ||
    norm.endsWith(".example.com") ||
    norm === "localhost" ||
    norm.endsWith(".internal") ||
    norm.endsWith(".test") ||
    process.env.NODE_ENV === "test"
  ) {
    return true;
  }

  const cacheKey = `fraud:mx_valid:${norm}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) return cached === "1";
  } catch {}

  try {
    const resolvePromise = dns.promises.resolveMx(norm);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS lookup timeout")), 1500)
    );
    const records = await Promise.race([resolvePromise, timeoutPromise]);
    const isValid = Array.isArray(records) && records.length > 0;
    try {
      await redis.setex(cacheKey, isValid ? CACHE_TTL_SECONDS : NEGATIVE_TTL_SECONDS, isValid ? "1" : "0");
    } catch {}
    return isValid;
  } catch (err: any) {
    if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
      try {
        await redis.setex(cacheKey, NEGATIVE_TTL_SECONDS, "0");
      } catch {}
      return false;
    }
    return true;
  }
}