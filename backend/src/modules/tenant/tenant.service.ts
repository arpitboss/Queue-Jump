import { prisma } from "../../config/db";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { ConflictError, UnauthorizedError, NotFoundError } from "../../utils/errors";
import { RegisterInput, LoginInput } from "./tenant.schema";

export class TenantService {
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

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const tenant = await prisma.tenant.findUnique({
        where: { id: payload.tenantId },
      });

      if (!tenant) {
        throw new UnauthorizedError("Tenant not found", "TENANT_NOT_FOUND");
      }

      const newAccessToken = generateAccessToken({ tenantId: tenant.id, email: tenant.email });
      const newRefreshToken = generateRefreshToken({ tenantId: tenant.id, email: tenant.email });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }
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