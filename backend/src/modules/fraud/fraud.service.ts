import { prisma } from "../../config/db";
import { normalizeEmail, NormalizedEmailResult } from "../../utils/emailNormalizer";
import { isDisposableDomain } from "./disposableDomainService";
import { checkDomainMx } from "./dnsMxService";
import { checkRateLimit } from "../../middlewares/rateLimiter";
import { AppError, RateLimitError } from "../../utils/errors";

export interface ValidateSignupParams {
  campaignId: string;
  rawEmail: string;
  ipAddress: string;
  referrerId?: string | null;
}

export interface ValidationSuccess {
  canonicalEmail: string;
  rawEmail: string;
  domain: string;
  localPart: string;
  ipAddress: string;
  isSelfReferral: boolean;
}

export class FraudService {
  async logFraudBlock(campaignId: string, rawEmail: string, ipAddress: string, reason: string): Promise<void> {
    try {
      await prisma.fraudBlockLog.create({
        data: {
          campaignId,
          rawEmail,
          ipAddress,
          reason,
        },
      });
    } catch (err: any) {
      console.error("Failed to write FraudBlockLog:", err.message);
    }
  }

  async validateParticipantSignup(params: ValidateSignupParams): Promise<ValidationSuccess> {
    const { campaignId, rawEmail, ipAddress, referrerId } = params;

    // 1. IP Sliding-Window Rate Limit (5 per 15 min per campaign)
    const rateLimitKey = `${campaignId}:${ipAddress}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 5, 900);

    if (!rateCheck.allowed) {
      await this.logFraudBlock(campaignId, rawEmail, ipAddress, "IP_RATE_LIMIT");
      throw new RateLimitError(
        "Too many signup attempts from this IP address. Please wait 15 minutes before trying again."
      );
    }

    // 2. Canonical Email Normalization (+alias & Gmail dot removal)
    let emailResult: NormalizedEmailResult;
    try {
      emailResult = normalizeEmail(rawEmail);
    } catch {
      await this.logFraudBlock(campaignId, rawEmail, ipAddress, "MALFORMED_EMAIL");
      throw new AppError("Please provide a valid email address.", 400, "INVALID_EMAIL");
    }

    // 3. Disposable Domain Blocker (O(1) Redis lookup)
    const isDisposable = await isDisposableDomain(emailResult.domain);
    if (isDisposable) {
      await this.logFraudBlock(campaignId, rawEmail, ipAddress, "DISPOSABLE_DOMAIN");
      throw new AppError(
        "Temporary or disposable email domains are not allowed.",
        400,
        "DISPOSABLE_EMAIL",
        { domain: emailResult.domain }
      );
    }

    // 4. Self-Referral Detection (Matching IP with referrer)
    let isSelfReferral = false;
    if (referrerId) {
      const referrer = await prisma.participant.findUnique({
        where: { id: referrerId },
        select: { ipAddress: true, canonicalEmail: true },
      });

      if (referrer) {
        if (referrer.ipAddress === ipAddress) {
          isSelfReferral = true;
          await this.logFraudBlock(campaignId, rawEmail, ipAddress, "SELF_REFERRAL_IP");
        }
        if (referrer.canonicalEmail === emailResult.canonicalEmail) {
          isSelfReferral = true;
          await this.logFraudBlock(campaignId, rawEmail, ipAddress, "SELF_REFERRAL_EMAIL");
        }
      }
    }

    // 5. Async Non-Blocking DNS MX verification
    // Runs in the background so slow DNS resolvers never block the user's signup response
    setImmediate(async () => {
      try {
        const mxValid = await checkDomainMx(emailResult.domain);
        if (!mxValid) {
          await this.logFraudBlock(campaignId, rawEmail, ipAddress, "INVALID_MX");
        }
      } catch {
        // Safe background catch
      }
    });

    return {
      ...emailResult,
      ipAddress,
      isSelfReferral,
    };
  }

  async getFraudLogs(campaignId: string, limit = 50, offset = 0) {
    const [total, logs] = await Promise.all([
      prisma.fraudBlockLog.count({ where: { campaignId } }),
      prisma.fraudBlockLog.findMany({
        where: { campaignId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);

    return { total, logs, limit, offset };
  }
}

export const fraudService = new FraudService();