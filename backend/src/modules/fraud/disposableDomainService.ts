import fs from "fs";
import path from "path";
import { redis } from "../../config/redis";

const REDIS_KEY = "fraud:disposable_domains";
let inMemoryFallbackSet: Set<string> | null = null;

export async function loadDisposableDomains(): Promise<number> {
  const filePath = path.resolve(__dirname, "../../../scripts/disposable-domains.txt");
  if (!fs.existsSync(filePath)) {
    return 0;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const domains = content
    .split(/\r?\n/)
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0 && !d.startsWith("#"));

  inMemoryFallbackSet = new Set(domains);

  try {
    if (domains.length > 0) {
      await redis.sadd(REDIS_KEY, ...domains);
    }
  } catch (err: any) {
    console.warn("Could not cache disposable domains in Redis, using in-memory set:", err.message);
  }

  return domains.length;
}

export async function isDisposableDomain(domain: string): Promise<boolean> {
  const normalized = domain.trim().toLowerCase();

  try {
    const isMember = await redis.sismember(REDIS_KEY, normalized);
    if (isMember === 1) return true;
  } catch {
    // Fall back to in-memory check
    if (inMemoryFallbackSet && inMemoryFallbackSet.has(normalized)) {
      return true;
    }
  }

  return false;
}