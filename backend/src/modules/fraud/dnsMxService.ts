import dns from "dns";
import { redis } from "../../config/redis";

const CACHE_TTL_SECONDS = 86400; // 24 hours

export async function checkDomainMx(domain: string): Promise<boolean> {
  const cacheKey = `fraud:mx_valid:${domain.toLowerCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return cached === "1";
    }
  } catch {
    // Ignore Redis read error
  }

  try {
    // 2-second timeout Promise
    const resolvePromise = dns.promises.resolveMx(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DNS MX lookup timeout")), 2000)
    );

    const records = await Promise.race([resolvePromise, timeoutPromise]);
    const isValid = Array.isArray(records) && records.length > 0;

    try {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, isValid ? "1" : "0");
    } catch {
      // Ignore Redis write error
    }

    return isValid;
  } catch {
    // In case of DNS timeout or resolution error, treat as unverified rather than blocking
    return false;
  }
}