import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { healthRouter } from "./modules/health/health.router";
import { tenantRouter } from "./modules/tenant/tenant.router";
import { campaignRouter } from "./modules/campaign/campaign.router";
import { participantRouter } from "./modules/participant/participant.router";
import { swaggerRouter } from "./docs/swagger";
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

// CORS configuration
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

// Body & cookie parsers
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// Static file serving for widget.js
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));
app.get("/widget.js", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "widget.js"));
});

// Root ping
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "QueueJump API",
    version: "1.0.0",
    status: "running",
    docs: "/api/docs",
  });
});

// Routes
app.use("/api/docs", swaggerRouter);
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/tenants", tenantRouter);
app.use("/api/v1/campaigns", campaignRouter);
app.use("/api/v1/waitlist", participantRouter);

// 404 catch-all
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Central error handler
app.use(errorHandler);