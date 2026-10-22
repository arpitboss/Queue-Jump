import { Queue, Worker, Job } from "bullmq";
import { bullmqConnection } from "../config/bullmq";
import { prisma } from "../config/db";
import { signWebhookPayload } from "../utils/hmac";

export interface WebhookJobData {
  campaignId: string;
  webhookUrl: string;
  webhookSecret: string;
  eventType: "participant.verified" | "milestone.unlocked";
  payload: Record<string, unknown>;
}

export const webhookQueue = new Queue<WebhookJobData>("webhooks", {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000, // 10s -> 20s -> 40s
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export async function dispatchWebhook(data: WebhookJobData) {
  try {
    await webhookQueue.add(`webhook:${data.eventType}:${Date.now()}`, data);
  } catch (err: any) {
    console.warn("Could not enqueue webhook job (Redis offline?):", err.message);
  }
}

// In-process worker (can be run standalone in production)
export function startWebhookWorker() {
  const worker = new Worker<WebhookJobData>(
    "webhooks",
    async (job: Job<WebhookJobData>) => {
      const { campaignId, webhookUrl, webhookSecret, eventType, payload } = job.data;
      const body = JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      const signature = signWebhookPayload(body, webhookSecret);
      let statusCode: number | null = null;
      let success = false;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-QueueJump-Signature": signature,
            "User-Agent": "QueueJump-Webhook/1.0",
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        statusCode = response.status;
        success = response.ok;

        if (!response.ok) {
          throw new Error(`Webhook target responded with status ${response.status}`);
        }
      } catch (err: any) {
        console.warn(`Webhook delivery attempt ${job.attemptsMade + 1} failed:`, err.message);
        throw err; // Trigger BullMQ retry
      } finally {
        await prisma.webhookDeliveryLog.create({
          data: {
            campaignId,
            eventType,
            payload: JSON.parse(body),
            statusCode,
            attempt: job.attemptsMade + 1,
            success,
          },
        });
      }
    },
    { connection: bullmqConnection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`Webhook job ${job?.id} failed permanently after max attempts:`, err.message);
  });

  return worker;
}