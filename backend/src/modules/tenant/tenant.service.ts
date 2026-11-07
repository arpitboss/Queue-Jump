import { prisma } from "../../config/db";
import { redis } from "../../config/redis";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { ConflictError, UnauthorizedError, NotFoundError } from "../../utils/errors";
import { RegisterInput, LoginInput } from "./tenant.schema";

export class TenantService {
  private getRevocationKey(token: string): string {
    return `token:revoked:${token.slice(-32)}`;
  }

  async register(input: RegisterInput) {
    const existing = await prisma.tenant.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError("An account with this email already exists", "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await hashPassword(input.password);

    const tenant = await prisma.tenant.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken({ tenantId: tenant.id, email: tenant.email });
    const refreshToken = generateRefreshToken({ tenantId: tenant.id, email: tenant.email });

    return {
      tenant,
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { email: input.email },
    });

    if (!tenant) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await comparePassword(input.password, tenant.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const accessToken = generateAccessToken({ tenantId: tenant.id, email: tenant.email });
    const refreshToken = generateRefreshToken({ tenantId: tenant.id, email: tenant.email });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        createdAt: tenant.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(oldRefreshToken: string) {
    try {
      // Check revocation in Redis
      try {
        const isRevoked = await redis.get(this.getRevocationKey(oldRefreshToken));
        if (isRevoked) {
          throw new UnauthorizedError("Refresh token has been revoked", "TOKEN_REVOKED");
        }
      } catch (err: any) {
        if (err?.code === "TOKEN_REVOKED") throw err;
      }

      const payload = verifyRefreshToken(oldRefreshToken);
      const tenant = await prisma.tenant.findUnique({
        where: { id: payload.tenantId },
      });

      if (!tenant) {
        throw new UnauthorizedError("Tenant not found", "TENANT_NOT_FOUND");
      }

      // Revoke old refresh token on rotation
      try {
        await redis.setex(this.getRevocationKey(oldRefreshToken), 30 * 86400, "1");
      } catch {}

      const newAccessToken = generateAccessToken({ tenantId: tenant.id, email: tenant.email });
      const newRefreshToken = generateRefreshToken({ tenantId: tenant.id, email: tenant.email });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        await redis.setex(this.getRevocationKey(refreshToken), 30 * 86400, "1");
      } catch {}
    }
    return { success: true };
  }

  async getProfile(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        campaigns: {
          select: {
            id: true,
            name: true,
            publicKey: true,
            referralBonusSec: true,
            isDemo: true,
            createdAt: true,
            _count: {
              select: { participants: true },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError("Tenant profile not found", "TENANT_NOT_FOUND");
    }

    return tenant;
  }
}

export const tenantService = new TenantService();