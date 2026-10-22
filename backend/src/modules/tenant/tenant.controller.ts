import { Request, Response, NextFunction } from "express";
import { tenantService } from "./tenant.service";
import { registerSchema, loginSchema } from "./tenant.schema";
import { UnauthorizedError } from "../../utils/errors";

const REFRESH_COOKIE_NAME = "queuejump_refresh";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function handleRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await tenantService.register(validated);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });

    res.status(201).json({
      tenant: result.tenant,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await tenantService.login(validated);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });

    res.status(200).json({
      tenant: result.tenant,
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token missing", "REFRESH_TOKEN_MISSING");
    }

    const result = await tenantService.refresh(refreshToken);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });

    res.status(200).json({
      accessToken: result.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenant = await tenantService.getProfile(req.tenant!.id);
    res.status(200).json({ tenant });
  } catch (err) {
    next(err);
  }
}