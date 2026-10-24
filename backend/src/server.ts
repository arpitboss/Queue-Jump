import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";
import { redis } from "./config/redis";
import { loadDisposableDomains } from "./modules/fraud/disposableDomainService";

process.on("unhandledRejection", (reason: any) => {
  console.warn("Unhandled promise rejection:", reason?.message || reason);
});

process.on("uncaughtException", (err: any) => {
  console.error("Uncaught exception:", err?.message || err);
});

async function bootstrap() {
  // Bind port immediately so Render's port scanner detects the open port instantly
  const port = env.PORT || 4000;
  const host = "0.0.0.0";

  const server = app.listen(port, host, () => {
    console.log(`QueueJump Backend listening on ${host}:${port} (${env.NODE_ENV})`);
    console.log(`Health endpoint: http://${host}:${port}/api/v1/health`);
  });

  // Load disposable email domains blocklist asynchronously without blocking port listening
  loadDisposableDomains()
    .then((count) => console.log(`Loaded ${count} disposable email domains into blocklist.`))
    .catch((err) => console.warn("Failed to load disposable domains blocklist:", err.message));

  // Graceful shutdown handling
  let isShuttingDown = false;

  async function gracefulShutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await prisma.$disconnect();
        console.log("PostgreSQL connection disconnected.");
      } catch (e: any) {
        console.warn("Error disconnecting PostgreSQL:", e.message);
      }

      try {
        await redis.quit();
        console.log("Redis connection closed.");
      } catch (err: any) {
        console.warn("Error disconnecting Redis:", err.message);
      }
      process.exit(0);
    });

    // Force close after 10 seconds if graceful close hangs
    setTimeout(() => {
      console.error("Forced shutdown: timeout exceeded.");
      process.exit(1);
    }, 10000).unref();
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
