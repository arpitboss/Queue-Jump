import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { healthRouter } from "./modules/health/health.router";
import { errorHandler } from "./middlewares/errorHandler";
import { NotFoundError } from "./utils/errors";
import { env } from "./config/env";

export const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration:
// Public waitlist/widget endpoints will have open CORS;
// other endpoints allow APP_URL or localhost in dev.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (env.NODE_ENV !== "production") return callback(null, true);
      if (origin === env.APP_URL) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parsers with size limit
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Root ping
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "QueueJump API",
    version: "1.0.0",
    status: "running",
    docs: "/api/docs",
  });
});

// Health check endpoint
app.use("/api/v1/health", healthRouter);

// 404 catch-all
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Central error handler
app.use(errorHandler);