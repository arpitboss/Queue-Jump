import crypto from "crypto";
import { prisma } from "../../config/db";
import { leaderboardService } from "../leaderboard/leaderboard.service";
import { fraudService } from "../fraud/fraud.service";
import { generateReferralCode } from "../../utils/referralCode";
import { NotFoundError, AppError, ForbiddenError, RateLimitError } from "../../utils/errors";
import { dispatchWebhook } from "../../jobs/webhookJob";
import { dispatchEmail } from "../../jobs/emailJob";
import { checkRateLimit } from "../../middlewares/rateLimiter";
import { env } from "../../config/env";

export interface CampaignContext {
  id: string;
  name: string;
  publicKey: string;
  referralBonusSec: number;
  webhookUrl: string | null;
  webhookSecret: string | null;
  milestonesJson: unknown;
  isDemo: boolean;
}

export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 2) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  return `${local[0]}***${local[local.length - 1]}${domain}`;
}

export class ParticipantService {
  async joinWaitlist(
    campaign: CampaignContext,
    rawEmail: string,
    referrerCode: string | undefined | null,
    ipAddress: string,
    userAgent?: string
  ) {
    // 1. Resolve referrer if code was supplied
    let referrerId: string | null = null;
    if (referrerCode) {
      const referrer = await prisma.participant.findUnique({
        where: { referralCode: referrerCode },
        select: { id: true, campaignId: true },
      });
      if (referrer && referrer.campaignId === campaign.id) {
        referrerId = referrer.id;
      }
    }

    // 2. Validate input and anti-fraud checks
    const fraudResult = await fraudService.validateParticipantSignup({
      campaignId: campaign.id,
      rawEmail,
      ipAddress,
      referrerId,
    });

    const { canonicalEmail, localPart } = fraudResult;

    // 3. Check for existing participant (Idempotent response)
    const existing = await prisma.participant.findUnique({
      where: {
        campaignId_canonicalEmail: {
          campaignId: campaign.id,
          canonicalEmail,
        },
      },
    });

    const milestones =
      typeof campaign.milestonesJson === "string"
        ? JSON.parse(campaign.milestonesJson)
        : (campaign.milestonesJson as any[]) || [];

    if (existing) {
      const { position, total } = await leaderboardService.getRankTelemetry(campaign.id, existing.id);
      const nextMilestone = milestones.find((m: any) => m.count > existing.verifiedReferrals) || null;

      return {
        isNewSignup: false,
        participantId: existing.id,
        referralCode: existing.referralCode,
        referralLink: `${env.APP_URL}?ref=${existing.referralCode}`,
        position: position ?? 1,
        totalParticipants: total,
        verifiedReferrals: existing.verifiedReferrals,
        nextMilestone,
        status: existing.status,
      };
    }

    // 4. Generate unique referral code with collision retry
    let referralCode = generateReferralCode(localPart);
    let collision = await prisma.participant.findUnique({ where: { referralCode } });
    let attempts = 0;
    while (collision && attempts < 3) {
      referralCode = generateReferralCode();
      collision = await prisma.participant.findUnique({ where: { referralCode } });
      attempts++;
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const joinedAt = new Date();

    // 5. Insert participant into PostgreSQL
    const participant = await prisma.participant.create({
      data: {
        campaignId: campaign.id,
        rawEmail,
        canonicalEmail,
        referralCode,
        referredById: referrerId,
        verificationToken,
        ipAddress,
        userAgent: userAgent || null,
        joinedAt,
        status: "PENDING",
      },
    });

    // 6. Insert participant into Redis ZSET
    const initialScore = leaderboardService.calculateScore(joinedAt, 0, campaign.referralBonusSec);
    await leaderboardService.addParticipant(campaign.id, participant.id, initialScore);

    // 7. Enqueue double-opt-in verification email
    await dispatchEmail({
      to: rawEmail,
      type: "verification",
      subject: `Verify your email for ${campaign.name}`,
      variables: {
        verifyUrl: `${env.API_URL}/api/v1/waitlist/verify?token=${verificationToken}`,
        campaignName: campaign.name,
      },
    });

    // 8. Get real-time rank and total
    const { position, total } = await leaderboardService.getRankTelemetry(campaign.id, participant.id);
    const nextMilestone = milestones.find((m: any) => m.count > 0) || null;

    return {
      isNewSignup: true,
      participantId: participant.id,
      referralCode: participant.referralCode,
      referralLink: `${env.APP_URL}?ref=${participant.referralCode}`,
      position: position ?? total,
      totalParticipants: total,
      verifiedReferrals: 0,
      nextMilestone,
      status: participant.status,
    };
  }

  async verifyEmail(token: string) {
    if (!token || typeof token !== "string") {
      throw new AppError("Verification token is required", 400, "MISSING_TOKEN");
    }

    // Atomic interactive transaction to guarantee single crediting
    const result = await prisma.$transaction(async (tx) => {
      const participant = await tx.participant.findUnique({
        where: { verificationToken: token },
        include: {
          campaign: true,
          referredBy: true,
        },
      });

      if (!participant || participant.status !== "PENDING") {
        throw new AppError(
          "Invalid, expired, or already-verified confirmation token.",
          400,
          "INVALID_TOKEN"
        );
      }

      // Mark verified
      const updated = await tx.participant.update({
        where: { id: participant.id },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          verificationToken: null,
        },
      });

      let referrerUpdated: any = null;
      let milestoneUnlocked: any = null;

      // Credit referrer if one exists
      if (participant.referredById && participant.referredBy) {
        referrerUpdated = await tx.participant.update({
          where: { id: participant.referredById },
          data: {
            verifiedReferrals: { increment: 1 },
          },
        });

        // Check milestones
        const milestones =
          typeof participant.campaign.milestonesJson === "string"
            ? JSON.parse(participant.campaign.milestonesJson)
            : (participant.campaign.milestonesJson as any[]) || [];

        milestoneUnlocked = milestones.find((m: any) => m.count === referrerUpdated.verifiedReferrals) || null;
      }

      return {
        participant: updated,
        campaign: participant.campaign,
        referrer: referrerUpdated,
        milestoneUnlocked,
      };
    });

    // Redis rank jump for referrer (executed outside DB transaction)
    if (result.referrer) {
      await leaderboardService.jumpParticipant(
        result.campaign.id,
        result.referrer.id,
        result.campaign.referralBonusSec
      );

      // Trigger Webhook & Email for milestone if crossed
      if (result.milestoneUnlocked && result.campaign.webhookUrl && result.campaign.webhookSecret) {
        await dispatchWebhook({
          campaignId: result.campaign.id,
          webhookUrl: result.campaign.webhookUrl,
          webhookSecret: result.campaign.webhookSecret,
          eventType: "milestone.unlocked",
          payload: {
            referrerId: result.referrer.id,
            referralCode: result.referrer.referralCode,
            verifiedReferrals: result.referrer.verifiedReferrals,
            milestone: result.milestoneUnlocked,
          },
        });

        await dispatchEmail({
          to: result.referrer.rawEmail,
          type: "milestone",
          subject: `Reward Unlocked: ${result.milestoneUnlocked.reward}!`,
          variables: {
            reward: result.milestoneUnlocked.reward,
            campaignName: result.campaign.name,
          },
        });
      }

      // Trigger Webhook for participant verified
      if (result.campaign.webhookUrl && result.campaign.webhookSecret) {
        await dispatchWebhook({
          campaignId: result.campaign.id,
          webhookUrl: result.campaign.webhookUrl,
          webhookSecret: result.campaign.webhookSecret,
          eventType: "participant.verified",
          payload: {
            participantId: result.participant.id,
            canonicalEmail: result.participant.canonicalEmail,
            referralCode: result.participant.referralCode,
            referrerId: result.referrer.id,
          },
        });
      }
    }

    const { position, total } = await leaderboardService.getRankTelemetry(
      result.campaign.id,
      result.participant.id
    );

    return {
      success: true,
      message: "Email successfully verified. Your waitlist position is confirmed!",
      position: position ?? 1,
      totalParticipants: total,
    };
  }

  async demoSimulateReferral(campaign: CampaignContext, referralCode: string, ipAddress: string) {
    if (!campaign.isDemo) {
      throw new ForbiddenError(
        "Referral simulation is only permitted in the Interactive Demo Playground.",
        "DEMO_ONLY_ENDPOINT"
      );
    }

    // Rate limit simulation to avoid abuse (max 10 per minute per IP)
    const rateCheck = await checkRateLimit(`demo_sim:${ipAddress}`, 10, 60);
    if (!rateCheck.allowed) {
      throw new RateLimitError("Demo simulation rate limit reached. Please wait a minute.");
    }

    const participant = await prisma.participant.findUnique({
      where: { referralCode },
    });

    if (!participant || participant.campaignId !== campaign.id) {
      throw new NotFoundError("Participant not found for simulation.", "PARTICIPANT_NOT_FOUND");
    }

    const startLatency = performance.now();

    // 1. Get old position
    const { position: oldPosition } = await leaderboardService.getRankTelemetry(campaign.id, participant.id);

    // 2. Increment in Postgres
    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        verifiedReferrals: { increment: 1 },
      },
    });

    // 3. Jump score in Redis
    await leaderboardService.jumpParticipant(campaign.id, participant.id, campaign.referralBonusSec);

    // 4. Get new position
    const { position: newPosition, total } = await leaderboardService.getRankTelemetry(campaign.id, participant.id);

    const redisLatencyMs = parseFloat((performance.now() - startLatency).toFixed(2));
    const previous = oldPosition ?? 1;
    const current = newPosition ?? 1;
    const spotsJumped = Math.max(0, previous - current);

    return {
      participantId: participant.id,
      referralCode: participant.referralCode,
      previousPosition: previous,
      newPosition: current,
      spotsJumped,
      verifiedReferrals: updated.verifiedReferrals,
      totalParticipants: total,
      redisLatencyMs,
    };
  }

  async getStatus(campaign: CampaignContext, referralCode: string) {
    const participant = await prisma.participant.findUnique({
      where: { referralCode },
      select: {
        id: true,
        campaignId: true,
        rawEmail: true,
        referralCode: true,
        status: true,
        verifiedReferrals: true,
        joinedAt: true,
      },
    });

    if (!participant || participant.campaignId !== campaign.id) {
      throw new NotFoundError("Participant referral code not found", "PARTICIPANT_NOT_FOUND");
    }

    const { position, total } = await leaderboardService.getRankTelemetry(campaign.id, participant.id);
    const potentialJump = await leaderboardService.calculatePotentialJump(
      campaign.id,
      participant.id,
      campaign.referralBonusSec
    );

    const milestones =
      typeof campaign.milestonesJson === "string"
        ? JSON.parse(campaign.milestonesJson)
        : (campaign.milestonesJson as any[]) || [];

    const nextMilestone = milestones.find((m: any) => m.count > participant.verifiedReferrals) || null;

    return {
      participantId: participant.id,
      referralCode: participant.referralCode,
      referralLink: `${env.APP_URL}?ref=${participant.referralCode}`,
      position: position ?? 1,
      totalParticipants: total,
      verifiedReferrals: participant.verifiedReferrals,
      potentialJump,
      nextMilestone,
      status: participant.status,
    };
  }

  async getLeaderboard(campaign: CampaignContext, limit = 20) {
    const top = await leaderboardService.getTopParticipants(campaign.id, limit);

    if (top.length === 0) {
      return { leaderboard: [], total: 0 };
    }

    const participantIds = top.map((t) => t.participantId);
    const records = await prisma.participant.findMany({
      where: { id: { in: participantIds } },
      select: {
        id: true,
        rawEmail: true,
        referralCode: true,
        verifiedReferrals: true,
        joinedAt: true,
      },
    });

    const recordMap = new Map(records.map((r) => [r.id, r]));

    const leaderboard = top
      .map((entry, index) => {
        const p = recordMap.get(entry.participantId);
        if (!p) return null;
        return {
          rank: index + 1,
          email: maskEmail(p.rawEmail),
          referralCode: p.referralCode,
          verifiedReferrals: p.verifiedReferrals,
          joinedAt: p.joinedAt,
        };
      })
      .filter(Boolean);

    const total = await leaderboardService.getTotalCount(campaign.id);

    return { leaderboard, total };
  }
}

export const participantService = new ParticipantService();