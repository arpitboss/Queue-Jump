import { ConnectionOptions } from "bullmq";
import { env } from "./env";

// Ensure URL starts with rediss:// if pointing to Upstash or remote host with TLS
let redisUrlStr = env.REDIS_URL.trim();
if (
  redisUrlStr.startsWith("redis://") &&
  (redisUrlStr.includes("upstash.io") || (!redisUrlStr.includes("localhost") && !redisUrlStr.includes("127.0.0.1")))
) {
  redisUrlStr = "rediss://" + redisUrlStr.slice("redis://".length);
}

const isTls = redisUrlStr.startsWith("rediss://");
const redisUrl = new URL(redisUrlStr);

export const bullmqConnection: ConnectionOptions = {
  host: redisUrl.hostname || "127.0.0.1",
  port: Number(redisUrl.port) || 6379,
  username: redisUrl.username ? decodeURIComponent(redisUrl.username) : "default",
  password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 10000,
  tls: isTls
    ? {
        servername: redisUrl.hostname,
        rejectUnauthorized: false,
      }
    : undefined,
};
