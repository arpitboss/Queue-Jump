import { Router, Request, Response } from "express";
import { pingPostgres } from "../../config/db";
import { pingRedis } from "../../config/redis";

export const healthRouter = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const checkWithTimeout = async <T>(promise: Promise<T>, fallback: T, ms = 2500): Promise<T> => {
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
    };

    const [pgResult, redisResult] = await Promise.all([
      checkWithTimeout(pingPostgres(), { status: "down", error: "Postgres check timed out" }),
      checkWithTimeout(pingRedis(), { status: "down", error: "Redis check timed out" }),
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
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
