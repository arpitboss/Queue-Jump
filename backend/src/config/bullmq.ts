import { ConnectionOptions } from "bullmq";
import { env } from "./env";

const isTls = env.REDIS_URL.startsWith("rediss://");
const redisUrl = new URL(env.REDIS_URL);

export const bullmqConnection: ConnectionOptions = {
  host: redisUrl.hostname || "127.0.0.1",
  port: Number(redisUrl.port) || 6379,
  username: redisUrl.username ? decodeURIComponent(redisUrl.username) : undefined,
  password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: isTls ? { rejectUnauthorized: false } : undefined,
};
