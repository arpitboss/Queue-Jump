import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/db";
import { redis } from "./config/redis";

const server = app.listen(env.PORT, () => {
  console.log(`QueueJump Backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`Health endpoint: http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful shutdown handling
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    console.log("HTTP server closed.");
    try {
      await prisma.$disconnect();
      console.log("PostgreSQL connection disconnected.");
    } catch (e: any) {
      console.error("Error disconnecting PostgreSQL:", e.message);
    }

    try {
      await redis.quit();
      console.log("Redis connection closed.");
    } catch (e: any) {
      console.error("Error disconnecting Redis:", e.message);
    }

    console.log("Graceful shutdown complete.");
    process.exit(0);
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    console.error("Graceful shutdown timeout exceeded. Forcefully exiting.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));