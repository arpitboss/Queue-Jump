import { Router, Request, Response } from "express";
import { telemetryService } from "./telemetry.service";
import { createRateLimiter } from "../../middlewares/rateLimiter";

export const telemetryRouter = Router();

const visitLimiter = createRateLimiter({
  limit: 30,
  windowSeconds: 60,
  prefix: "telemetry",
});

// Beacon / ping endpoint to record access & referrer telemetry
telemetryRouter.post("/visit", visitLimiter, async (req: Request, res: Response) => {
  try {
    const ip =
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.ip ||
      "127.0.0.1";

    const country =
      (req.headers["cf-ipcountry"] as string) ||
      (req.headers["x-vercel-ip-country"] as string) ||
      null;

    const city = (req.headers["cf-ipcity"] as string) || null;
    const { path: visitPath, referrer } = req.body || {};

    await telemetryService.recordVisit({
      path: visitPath || "/",
      referrer: referrer || (req.headers.referer as string) || undefined,
      ipAddress: ip,
      country: country || undefined,
      city: city || undefined,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: false });
  }
});

// Telemetry statistics for dashboard
telemetryRouter.get("/stats", async (_req: Request, res: Response) => {
  const stats = await telemetryService.getStats();
  res.status(200).json(stats);
});
