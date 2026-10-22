import { ConnectionOptions } from "bullmq";
import { env } from "./env";

// Parse Redis URL for BullMQ connection options
const redisUrl = new URL(env.REDIS_URL);

export const bullmqConnection: ConnectionOptions = {
  host: redisUrl.hostname || "127.0.0.1",
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};