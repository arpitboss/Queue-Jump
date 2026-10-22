import { Request, Response, NextFunction } from "express";
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

    const result = await participantService.joinWaitlist(
      req.campaign as any,
      validated.email,
      validated.referralCode,
      ipAddress,
      userAgent
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
    res.status(200).json(result);
  } catch (err) {
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