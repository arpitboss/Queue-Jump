import { Queue, Worker, Job } from "bullmq";
import { bullmqConnection } from "../config/bullmq";
import { env } from "../config/env";

export interface EmailJobData {
  to: string;
  type: "verification" | "milestone";
  subject: string;
  variables: Record<string, string>;
}

export const emailQueue = new Queue<EmailJobData>("emails", {

  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

emailQueue.on("error", (err) => {
  console.warn("BullMQ emailQueue warning:", err.message);
});

export async function dispatchEmail(data: EmailJobData) {
  try {
    await emailQueue.add(`email:${data.type}:${Date.now()}`, data);
  } catch (err: any) {
    console.warn("Could not enqueue email job:", err.message);
  }
}

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(
    "emails",
    async (job: Job<EmailJobData>) => {
      const { to, type, subject, variables } = job.data;

      // In local dev without RESEND_API_KEY, log the email content clearly
      if (!env.RESEND_API_KEY) {
        console.log(`\n📧 [DEV EMAIL MOCK] ----------------------------------`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Type: ${type}`);
        console.log(`Variables:`, variables);
        console.log(`-----------------------------------------------------\n`);
        return;
      }

      // If RESEND_API_KEY is configured, dispatch via Resend REST API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "QueueJump <noreply@queuejump.dev>",
          to: [to],
          subject,
          text: `Hi! Here is your QueueJump update: ${JSON.stringify(variables, null, 2)}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend API failed: ${response.statusText}`);
      }
    },
    { connection: bullmqConnection, concurrency: 5 }
  );

  return worker;
}