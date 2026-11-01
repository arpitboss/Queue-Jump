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
  const appUrl = (env.APP_URL || "https://queuejump.arpitverma.me").replace(/\/+$/, "");
  const campaignName = variables.campaignName || "Priority Access";

  if (type === "verification") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirm your spot for ${campaignName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181B;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <!-- Brand Header -->
          <tr>
            <td style="padding: 28px 32px 0 32px;">
              <span style="font-size: 15px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.015em;">
                Queue<span style="color: #71717A; font-weight: 400;">Jump</span>
              </span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em;">
                Confirm your spot for ${campaignName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.55; color: #52525B;">
                Please click the button below to verify your email and secure your position in line.
              </p>

              <!-- Confirm Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <a href="${variables.verifyUrl}" style="display: inline-block; background-color: #0A0A0A; color: #FFFFFF; font-size: 14px; font-weight: 600; text-align: center; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
                      Confirm Email &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct URL -->
              <p style="font-size: 12px; color: #71717A; line-height: 1.5; margin: 0 0 28px 0; word-break: break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${variables.verifyUrl}" style="color: #10B981; text-decoration: underline;">${variables.verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Minimal Footer (QueueJump organic growth link) -->
          <tr>
            <td style="padding: 18px 32px 24px 32px; background-color: #FAFAFA; border-top: 1px solid #F4F4F5; text-align: left;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #71717A;">
                Powered by <a href="${appUrl}" style="color: #10B981; text-decoration: none; font-weight: 600;">QueueJump</a> &bull; Turn waitlists into viral loops
              </p>
              <p style="margin: 0; font-size: 11px; color: #A1A1AA;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // Milestone Unlocked Email
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reward Unlocked for ${campaignName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #18181B;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #FFFFFF; border: 1px solid #E4E4E7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 28px 32px 0 32px;">
              <span style="font-size: 15px; font-weight: 700; color: #0A0A0A;">
                Queue<span style="color: #71717A; font-weight: 400;">Jump</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px 28px 32px;">
              <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #0A0A0A;">
                You unlocked: <span style="color: #10B981;">${variables.reward}</span>
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.55; color: #52525B;">
                Thanks to your <strong>${variables.referrals} referrals</strong> on <strong>${campaignName}</strong>, you have earned this perk.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px; background-color: #FAFAFA; border-top: 1px solid #F4F4F5; text-align: left;">
              <span style="font-size: 11px; color: #71717A;">Powered by <a href="${appUrl}" style="color: #10B981; text-decoration: none; font-weight: 600;">QueueJump</a></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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

      // Format sender name dynamically: "[Campaign Name] via QueueJump <noreply@arpitverma.me>"
      const fromEnv = env.EMAIL_FROM || "QueueJump <noreply@arpitverma.me>";
      const emailMatch = fromEnv.match(/<([^>]+)>/);
      const senderEmail = emailMatch ? emailMatch[1] : fromEnv.trim();

      const senderDisplayName = variables.campaignName
        ? `${variables.campaignName} via QueueJump`
        : "QueueJump";

      const fromHeader = `${senderDisplayName} <${senderEmail}>`;

      // If RESEND_API_KEY is configured, dispatch via Resend REST API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromHeader,
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
