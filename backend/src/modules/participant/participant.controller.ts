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

    // If opened directly from an email client in browser via GET, render a clean confirmation screen
    const isBrowserHtml = req.method === "GET" && req.accepts("html");
    if (isBrowserHtml) {
      const baseUrl = (env.APP_URL || "https://queuejump.arpitverma.me").replace(/\/+$/, "");
      const referralLink = `${baseUrl}/embed/${result.publicKey}?ref=${result.referralCode}`;
      const founderDomain = result.allowedDomains?.split(",")[0]?.trim();
      const hasFounderSite = founderDomain && founderDomain.startsWith("http");
      const founderRedirectUrl = hasFounderSite
        ? `${founderDomain}${founderDomain.includes("?") ? "&" : "?"}ref=${result.referralCode}`
        : null;

      const encodedReferral = encodeURIComponent(referralLink);
      const encodedShareText = encodeURIComponent(`I just reserved my spot for ${result.campaignName || "this waitlist"}. Use my invite link to skip ahead:`);

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spot Confirmed - ${result.campaignName || "QueueJump"}</title>
  <link rel="icon" type="image/svg+xml" href="${baseUrl}/icon.svg">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FAFAFA;
      color: #0A0A0A;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 36px 28px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .check-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.1);
      color: #10B981;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin-bottom: 16px;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0A0A0A;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    .campaign-name {
      font-size: 13px;
      color: #52525B;
      font-weight: 500;
      margin-bottom: 20px;
    }
    
    .rank-card {
      background: #F4F4F5;
      border: 1px solid #E4E4E7;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .rank-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #71717A;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .rank-num {
      font-size: 32px;
      font-weight: 800;
      color: #0A0A0A;
      letter-spacing: -0.03em;
    }

    .link-section {
      margin-bottom: 18px;
      text-align: left;
    }
    .link-label {
      font-size: 11px;
      font-weight: 600;
      color: #71717A;
      margin-bottom: 6px;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .link-row {
      display: flex;
      gap: 8px;
    }
    .link-input {
      flex: 1;
      background: #FAFAFA;
      border: 1px solid #D4D4D8;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 12px;
      color: #0A0A0A;
      outline: none;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .copy-btn {
      background: #0A0A0A;
      color: #FFFFFF;
      border: none;
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .copy-btn:hover {
      background: #27272A;
    }

    .share-row {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }
    .share-btn {
      flex: 1;
      padding: 8px 6px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      border: 1px solid #E4E4E7;
      background: #FAFAFA;
      color: #52525B;
      transition: all 0.15s;
    }
    .share-btn:hover {
      background: #F4F4F5;
      color: #0A0A0A;
    }

    .return-btn {
      display: block;
      width: 100%;
      background: #0A0A0A;
      color: #FFFFFF;
      text-decoration: none;
      padding: 12px 0;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
      transition: background 0.15s;
    }
    .return-btn:hover {
      background: #27272A;
    }

    .brand-footer {
      border-top: 1px solid #F4F4F5;
      padding-top: 16px;
      font-size: 11px;
      color: #A1A1AA;
    }
    .brand-footer a {
      color: #10B981;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
  <script>\n    if (window.history && window.history.replaceState) {\n      var cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;\n      window.history.replaceState({}, document.title, cleanUrl);\n    }\n  </script>\n</head>
<body>
  <div class="card">
    <div class="check-icon">&#10003;</div>
    <h1>Spot Confirmed!</h1>
    <div class="campaign-name">${result.campaignName || "Priority Waitlist"}</div>

    <div class="rank-card">
      <div class="rank-label">Your Priority Position</div>
      <div class="rank-num">#${result.position}</div>
    </div>

    <div class="link-section">
      <span class="link-label">Your Unique Referral Link</span>
      <div class="link-row">
        <input class="link-input" id="refLink" value="${referralLink}" readonly />
        <button class="copy-btn" id="copyBtn" onclick="copyReferral()">Copy</button>
      </div>
    </div>

    <div class="share-row">
      <a class="share-btn" href="https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedReferral}" target="_blank" rel="noopener">Share on X</a>
      <a class="share-btn" href="https://wa.me/?text=${encodedShareText}%20${encodedReferral}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedReferral}" target="_blank" rel="noopener">LinkedIn</a>
    </div>

    ${founderRedirectUrl ? `
      <a href="${founderRedirectUrl}" class="return-btn">Return to ${result.campaignName} &rarr;</a>
    ` : ''}

    <div class="brand-footer">
      Powered by <a href="${baseUrl}" target="_blank">QueueJump</a> &bull; Viral Referral Engine
    </div>
  </div>

  <script>
    function copyReferral() {
      var input = document.getElementById("refLink");
      var btn = document.getElementById("copyBtn");
      var text = input.value;

      function showSuccess() {
        btn.textContent = "Copied!";
        btn.style.background = "#10B981";
        setTimeout(function() {
          btn.textContent = "Copy";
          btn.style.background = "#0A0A0A";
        }, 2000);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showSuccess).catch(function() {
          fallbackCopy();
        });
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        input.focus();
        input.select();
        try {
          var ok = document.execCommand("copy");
          if (ok) showSuccess();
        } catch (e) {
          prompt("Copy your referral link:", text);
        }
      }
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
      const baseUrl = (env.APP_URL || "https://queuejump.arpitverma.me").replace(/\/+$/, "");
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verification - QueueJump</title>
  <link rel="icon" type="image/svg+xml" href="${baseUrl}/icon.svg">
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FAFAFA;
      color: #0A0A0A;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 36px 28px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin-bottom: 16px;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
    h1 { font-size: 18px; font-weight: 700; color: #0A0A0A; margin: 0 0 8px 0; }
    p { font-size: 13px; color: #52525B; line-height: 1.5; margin: 0 0 20px 0; }
    .btn { display: inline-block; background: #0A0A0A; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9888;</div>
    <h1>Already Verified or Expired</h1>
    <p>${err.message || "This confirmation link is invalid or has already been used."}</p>
    <a href="${baseUrl}" class="btn">Return to QueueJump</a>
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
