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

function getEmailHtml(data: EmailJobData): string {
  const { type, variables } = data;
  if (type === "verification") {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f7f8; padding: 40px 16px; margin: 0; color: #0a0a0a;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid rgba(0,0,0,0.08); padding: 36px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
    <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #3074fe; margin-bottom: 8px;">Priority Waitlist</div>
    <h1 style="font-size: 22px; font-weight: 700; color: #0a0a0a; margin: 0 0 12px 0; letter-spacing: -0.02em;">Confirm your spot for ${variables.campaignName || "the launch"}</h1>
    <p style="font-size: 14px; line-height: 1.5; color: #737373; margin: 0 0 24px 0;">You're almost there! Click the button below to verify your email, lock in your place in line, and receive your priority invite link.</p>
    <a href="${variables.verifyUrl}" style="display: inline-block; background: #0a0a0a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center;">Verify My Email &rarr;</a>
    <p style="font-size: 12px; color: #a1a1aa; margin: 32px 0 0 0; line-height: 1.4;">If you did not request to join this waitlist, you can safely disregard this message.</p>
  </div>
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f7f7f8; padding: 40px 16px; margin: 0; color: #0a0a0a;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid rgba(0,0,0,0.08); padding: 36px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
    <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #10b981; margin-bottom: 8px;">Milestone Unlocked! 🎉</div>
    <h1 style="font-size: 22px; font-weight: 700; color: #0a0a0a; margin: 0 0 12px 0; letter-spacing: -0.02em;">${variables.reward}</h1>
    <p style="font-size: 14px; line-height: 1.5; color: #737373; margin: 0 0 20px 0;">Congratulations! Thanks to your ${variables.referrals} verified referrals on ${variables.campaignName || "QueueJump"}, you have unlocked this exclusive perk.</p>
  </div>
</body>
</html>`;
}

export function startEmailWorker() {
  const worker = new Worker<EmailJobData>(
    "emails",
    async (job: Job<EmailJobData>) => {
      const { to, type, subject, variables } = job.data;
      const htmlContent = getEmailHtml(job.data);

      // In local dev without RESEND_API_KEY, log the email content clearly
      if (!env.RESEND_API_KEY || env.RESEND_API_KEY.includes("your_api_key")) {
        console.log(`\n📧  [DEV EMAIL DISPATCH] ------------------------------`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Type: ${type}`);
        console.log(`Link: ${variables.verifyUrl || "N/A"}`);
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
          html: htmlContent,
          text: `${subject}\n\n${variables.verifyUrl || JSON.stringify(variables)}`,
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
