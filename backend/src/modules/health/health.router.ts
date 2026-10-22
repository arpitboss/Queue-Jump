import { Router, Request, Response } from "express";
import { pingPostgres } from "../../config/db";
import { pingRedis } from "../../config/redis";

export const healthRouter = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  const [pgResult, redisResult] = await Promise.all([
    pingPostgres(),
    pingRedis(),
  ]);

  const allHealthy = pgResult.status === "up" && redisResult.status === "up";

  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? "ok" : "degraded",
    postgres: pgResult.status,
    redis: redisResult.status,
    telemetry: {
      postgresLatencyMs: pgResult.latencyMs,
      redisLatencyMs: redisResult.latencyMs,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    ...(pgResult.error || redisResult.error
      ? {
          errors: {
            ...(pgResult.error ? { postgres: pgResult.error } : {}),
            ...(redisResult.error ? { redis: redisResult.error } : {}),
          },
        }
      : {}),
  });
});