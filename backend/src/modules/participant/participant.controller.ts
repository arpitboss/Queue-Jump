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
    if (req.accepts("html") && !req.xhr) {
      const returnUrl = env.APP_URL;
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Email Confirmed - QueueJump</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0A0A0C; color: #EDEDED; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #141418; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 40px 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(16,185,129,0.12); color: #10B981; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px; border: 1px solid rgba(16,185,129,0.25); }
    h1 { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px 0; }
    p { font-size: 14px; color: #A1A1AA; line-height: 1.5; margin: 0 0 24px 0; }
    .badge { display: inline-block; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px; padding: 6px 14px; font-size: 13px; font-weight: 600; color: #FFFFFF; margin-bottom: 24px; }
    .btn { display: block; width: 100%; background: #FFFFFF; color: #0A0A0A; text-decoration: none; padding: 12px 0; border-radius: 10px; font-size: 13px; font-weight: 600; box-shadow: 0 2px 10px rgba(255,255,255,0.1); transition: opacity 0.15s; box-sizing: border-box; }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#10003;</div>
    <h1>Spot Verified!</h1>
    <p>Your email has been confirmed. You are officially in line for <strong>${result.campaignName || "the launch"}</strong>.</p>
    <div class="badge">Current Position: #${result.position}</div>
    <a href="${returnUrl}" class="btn">View Waitlist & Invite Friends &rarr;</a>
  </div>
</body>
</html>`;
      res.setHeader("Content-Type", "text/html");
      res.status(200).send(html);
      return;
    }

    res.status(200).json(result);
  } catch (err: any) {
    if (req.accepts("html") && !req.xhr) {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verification Error - QueueJump</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0A0A0C; color: #EDEDED; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #141418; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 40px 32px; max-width: 440px; width: 100%; text-align: center; }
    .icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(239,68,68,0.12); color: #EF4444; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px; border: 1px solid rgba(239,68,68,0.25); }
    h1 { font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px 0; }
    p { font-size: 14px; color: #A1A1AA; line-height: 1.5; margin: 0 0 24px 0; }
    .btn { display: inline-block; background: rgba(255,255,255,0.08); color: #EDEDED; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9888;</div>
    <h1>Verification Expired or Invalid</h1>
    <p>${err.message || "This confirmation link is invalid or has already been used."}</p>
    <a href="${env.APP_URL}" class="btn">Return to Homepage</a>
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
