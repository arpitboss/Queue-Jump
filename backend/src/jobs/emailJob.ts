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
  const appUrl = env.APP_URL || "https://queuejump.arpitverma.me";
  const campaignName = variables.campaignName || "Priority Access";

  if (type === "verification") {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirm your spot for ${campaignName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #EDEDED;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0A0A0C; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #121217; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);">
          <!-- Header Brand Bar -->
          <tr>
            <td style="padding: 28px 32px 0 32px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.25); color: #60A5FA; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 20px;">
                      Priority Waitlist
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; color: #71717A; font-weight: 600; letter-spacing: 0.04em;">
                      ⚡ QueueJump
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 24px 32px 0 32px; text-align: left;">
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; line-height: 1.3; color: #FFFFFF; letter-spacing: -0.02em;">
                Confirm your spot for <span style="color: #60A5FA;">${campaignName}</span>
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #A1A1AA;">
                You're one step away from securing your position in the priority queue. Click the button below to confirm your email, lock in your rank, and unlock your unique referral link to jump ahead of others.
              </p>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${variables.verifyUrl}" style="display: block; width: 100%; box-sizing: border-box; background: #FFFFFF; color: #0A0A0C; font-size: 14px; font-weight: 700; text-align: center; text-decoration: none; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(255, 255, 255, 0.12);">
                      Confirm My Spot &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Viral Loop Explanation Box -->
              <div style="background-color: #171720; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px 16px; margin-bottom: 28px;">
                <div style="font-size: 12px; font-weight: 600; color: #E4E4E7; margin-bottom: 4px;">
                  🚀 How to jump ahead in line:
                </div>
                <div style="font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                  Once verified, share your personal invite link. Every friend who joins through your link bumps you forward in the queue.
                </div>
              </div>

              <!-- Fallback Direct URL -->
              <p style="font-size: 11px; color: #52525B; line-height: 1.5; margin: 0 0 28px 0; word-break: break-all;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="${variables.verifyUrl}" style="color: #71717A; text-decoration: underline;">${variables.verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Viral Growth Footer (Acquisition Engine for QueueJump) -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; background-color: #0E0E12; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #71717A; text-transform: uppercase; letter-spacing: 0.08em;">
                Powered by QueueJump
              </p>
              <p style="margin: 0 0 14px 0; font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                Building a startup or product? Turn your cold signups into viral referral loops in under 2 minutes.
              </p>
              <a href="${appUrl}" style="display: inline-block; font-size: 12px; font-weight: 600; color: #60A5FA; text-decoration: none; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); padding: 6px 14px; border-radius: 6px;">
                Launch Your Viral Waitlist Free &rarr;
              </a>
            </td>
          </tr>
        </table>

        <!-- Small Unsubscribe / Notice -->
        <p style="margin: 20px 0 0 0; font-size: 11px; color: #52525B; text-align: center;">
          If you did not request to join ${campaignName}, you can safely disregard this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // Milestone Unlocked Email
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reward Unlocked - ${campaignName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #EDEDED;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0A0A0C; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #121217; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);">
          <tr>
            <td style="padding: 28px 32px 0 32px; text-align: left;">
              <span style="display: inline-block; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: #34D399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 20px;">
                🎉 Milestone Unlocked
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px 28px 32px; text-align: left;">
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">
                You earned: <span style="color: #34D399;">${variables.reward}</span>
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #A1A1AA;">
                Congratulations! Thanks to your <strong>${variables.referrals} verified referrals</strong> on <strong>${campaignName}</strong>, you have officially unlocked this exclusive reward.
              </p>
              <div style="background-color: #171720; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px 16px;">
                <div style="font-size: 12px; color: #A1A1AA; line-height: 1.5;">
                  Keep inviting friends to unlock even higher tiers and reach the front of the queue!
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #0E0E12; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <span style="font-size: 11px; color: #71717A;">Powered by QueueJump ⚡</span>
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
