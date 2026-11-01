import { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";
import { participantService } from "./participant.service";
import { joinWaitlistSchema } from "./participant.schema";

export async function handleJoinWaitlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = joinWaitlistSchema.parse(req.body);
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";
    const userAgent = req.headers["user-agent"];

    let originUrl: string | undefined = validated.originUrl || undefined;
    if (!originUrl) {
      if (req.headers.origin) {
        originUrl = req.headers.origin as string;
      } else if (req.headers.referer) {
        try {
          originUrl = new URL(req.headers.referer as string).origin;
        } catch {
          originUrl = undefined;
        }
      }
    }

    const result = await participantService.joinWaitlist(
      req.campaign as any,
      validated.email,
      validated.referralCode,
      ipAddress,
      userAgent,
      originUrl
    );

    const statusCode = result.isNewSignup ? 201 : 200;
    res.status(statusCode).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleVerifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = (req.query.token as string) || req.body?.token;
    const result = await participantService.verifyEmail(token);

    // If opened directly from an email client in browser, render a premium confirmation screen
    const isBrowserHtml = req.method === "GET" && req.accepts("html");
    if (isBrowserHtml) {
      const waitlistPage = `${env.APP_URL}/embed/${result.publicKey}?ref=${result.referralCode}`;
      const founderDomain = result.allowedDomains?.split(",")[0]?.trim();
      const destinationUrl = (founderDomain && founderDomain.startsWith("http"))
        ? `${founderDomain}${founderDomain.includes("?") ? "&" : "?"}ref=${result.referralCode}`
        : waitlistPage;

      const referralLink = waitlistPage;
      const encodedReferral = encodeURIComponent(referralLink);
      const encodedShareText = encodeURIComponent(`I just joined the priority waitlist for ${result.campaignName || "this launch"}. Use my invite link to skip ahead in line:`);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spot Confirmed - ${result.campaignName || "QueueJump"}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0A0A0C; color: #EDEDED; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #131318; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 36px 28px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 16px 50px rgba(0,0,0,0.6); }
    .icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(16,185,129,0.12); color: #10B981; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 18px; border: 1px solid rgba(16,185,129,0.25); }
    h1 { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 6px 0; letter-spacing: -0.02em; }
    .campaign-tag { font-size: 13px; color: #60A5FA; font-weight: 600; margin-bottom: 20px; }
    
    .position-pill { background: #1A1A22; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 20px; }
    .position-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717A; margin-bottom: 4px; font-weight: 600; }
    .position-num { font-size: 32px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.03em; }

    .link-section { margin-bottom: 20px; text-align: left; }
    .link-label { font-size: 11px; font-weight: 600; color: #A1A1AA; margin-bottom: 6px; display: block; }
    .link-box { display: flex; gap: 8px; }
    .link-input { flex: 1; background: #0D0D11; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; font-size: 12px; color: #EDEDED; outline: none; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .copy-btn { background: #272730; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.12); padding: 9px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; shrink-0; }
    .copy-btn:hover { background: #32323D; }

    .share-row { display: flex; gap: 8px; margin-bottom: 22px; }
    .share-btn { flex: 1; padding: 8px; border-radius: 8px; font-size: 11px; font-weight: 600; text-decoration: none; text-align: center; border: 1px solid rgba(255,255,255,0.08); background: #181820; color: #D4D4D8; transition: background 0.15s; }
    .share-btn:hover { background: #22222C; color: #FFFFFF; }

    .cta-btn { display: block; width: 100%; background: #FFFFFF; color: #0A0A0C; text-decoration: none; padding: 13px 0; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 14px rgba(255,255,255,0.1); transition: opacity 0.15s; margin-bottom: 22px; }
    .cta-btn:hover { opacity: 0.9; }

    .brand-footer { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 18px; font-size: 11px; color: #71717A; }
    .brand-footer a { color: #60A5FA; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#10003;</div>
    <h1>Spot Confirmed!</h1>
    <div class="campaign-tag">${result.campaignName || "Priority Waitlist"}</div>

    <div class="position-pill">
      <div class="position-label">Your Priority Position</div>
      <div class="position-num">#${result.position}</div>
    </div>

    <div class="link-section">
      <span class="link-label">Your Unique Referral Link</span>
      <div class="link-box">
        <input class="link-input" id="refLink" value="${referralLink}" readonly />
        <button class="copy-btn" id="copyBtn" onclick="copyReferral()">Copy</button>
      </div>
    </div>

    <div class="share-row">
      <a class="share-btn" href="https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedReferral}" target="_blank" rel="noopener">Share on X</a>
      <a class="share-btn" href="https://wa.me/?text=${encodedShareText}%20${encodedReferral}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedReferral}" target="_blank" rel="noopener">LinkedIn</a>
    </div>

    <a href="${destinationUrl}" class="cta-btn">View Live Waitlist &rarr;</a>

    <div class="brand-footer">
      Powered by <strong>QueueJump</strong> ⚡ &bull; <a href="${env.APP_URL}" target="_blank">Launch a viral waitlist</a>
    </div>
  </div>

  <script>
    function copyReferral() {
      const input = document.getElementById("refLink");
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById("copyBtn");
        btn.textContent = "Copied!";
        btn.style.background = "#10B981";
        btn.style.color = "#000000";
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.style.background = "#272730";
          btn.style.color = "#FFFFFF";
        }, 2000);
      });
    }
  </script>
</body>
</html>`;
      res.setHeader("Content-Type", "text/html");
      res.status(200).send(html);
      return;
    }

    res.status(200).json(result);
  } catch (err: any) {
    const isBrowserHtml = req.method === "GET" && req.accepts("html");
    if (isBrowserHtml) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verification - QueueJump</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0A0A0C; color: #EDEDED; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #131318; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 36px 28px; max-width: 440px; width: 100%; text-align: center; }
    .icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(239,68,68,0.12); color: #EF4444; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 18px; border: 1px solid rgba(239,68,68,0.25); }
    h1 { font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px 0; }
    p { font-size: 13px; color: #A1A1AA; line-height: 1.5; margin: 0 0 24px 0; }
    .btn { display: inline-block; background: rgba(255,255,255,0.08); color: #EDEDED; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9888;</div>
    <h1>Already Verified or Expired</h1>
    <p>${err.message || "This confirmation link is invalid or has already been used."}</p>
    <a href="${env.APP_URL}" class="btn">Return to QueueJump</a>
  </div>
</body>
</html>`;
      res.setHeader("Content-Type", "text/html");
      res.status(400).send(html);
      return;
    }
    next(err);
  }
}

export async function handleDemoSimulate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const referralCode = req.body?.referralCode;
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const result = await participantService.demoSimulateReferral(
      req.campaign as any,
      referralCode,
      ipAddress
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const referralCode = req.params.referralCode as string;
    const result = await participantService.getStatus(req.campaign as any, referralCode);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await participantService.getLeaderboard(req.campaign as any, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
