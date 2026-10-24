import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";
import { prisma } from "../config/db";
import { redis } from "../config/redis";

const CACHE_TTL_SECONDS = 300; // 5 minutes

export async function apiKeyAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawKey = req.headers["x-campaign-key"] || (req.query.campaignKey as string);
    if (!rawKey || typeof rawKey !== "string" || !rawKey.startsWith("pk_live_")) {
      throw new UnauthorizedError(
        "Missing or malformed X-Campaign-Key header. Must start with pk_live_",
        "INVALID_CAMPAIGN_KEY"
      );
    }

    const cacheKey = `campaign:pk:${rawKey}`;

    let campaign: any = null;

    // 1. Try Redis cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        campaign = JSON.parse(cached);
      }
    } catch {
      // Fallback gracefully to DB if Redis is unreachable
    }

    // 2. Query PostgreSQL if not cached
    if (!campaign) {
      campaign = await prisma.campaign.findUnique({
        where: { publicKey: rawKey },
        select: {
          id: true,
          tenantId: true,
          name: true,
          publicKey: true,
          referralBonusSec: true,
          requireEmailVerification: true,
          allowedDomains: true,
          webhookUrl: true,
          webhookSecret: true,
          milestonesJson: true,
          isDemo: true,
        },
      });

      if (!campaign) {
        throw new UnauthorizedError(
          "Campaign not found for the provided API key",
          "CAMPAIGN_NOT_FOUND"
        );
      }

      // Cache campaign in Redis for 5 minutes
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(campaign));
      } catch {
        // Non-critical cache write error
      }
    }

    // 3. Domain Whitelist Check
    if (campaign.allowedDomains) {
      const origin = (req.headers.origin as string || "").toLowerCase();
      const referer = (req.headers.referer as string || "").toLowerCase();
      if (origin || referer) {
        const allowedList = campaign.allowedDomains
          .split(",")
          .map((d: string) => d.trim().toLowerCase())
          .filter(Boolean);

        const isAllowed = allowedList.some((allowed: string) => {
          return origin.includes(allowed) || referer.includes(allowed) || allowed === "*";
        });

        if (!isAllowed) {
          throw new UnauthorizedError(
            `Domain not authorized for this campaign key. Allowed: ${campaign.allowedDomains}`,
            "DOMAIN_NOT_ALLOWED"
          );
        }
      }
    }

    req.campaign = campaign;
    next();
  } catch (err) {
    next(err);
  }
}
