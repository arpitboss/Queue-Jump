import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { UnauthorizedError } from "../utils/errors";
import { prisma } from "../config/db";

export async function tenantAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header", "AUTH_HEADER_MISSING");
    }

    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired access token", "TOKEN_EXPIRED");
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { id: true, email: true, name: true },
    });

    if (!tenant) {
      throw new UnauthorizedError("Tenant account no longer exists", "TENANT_NOT_FOUND");
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
}