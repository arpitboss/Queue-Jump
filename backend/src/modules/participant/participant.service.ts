import crypto from "crypto";
import { prisma } from "../../config/db";
import { leaderboardService } from "../leaderboard/leaderboard.service";
import { fraudService } from "../fraud/fraud.service";
import { generateReferralCode } from "../../utils/referralCode";
import { NotFoundError, AppError } from "../../utils/errors";
import { dispatchWebhook } from "../../jobs/webhookJob";
import { dispatchEmail } from "../../jobs/emailJob";
import { env } from "../../config/env";

export interface CampaignContext {
  id: string;
  name: string;
  publicKey: string;
  referralBonusSec: number;
  requireEmailVerification?: boolean;
  allowedDomains?: string | null;
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
    userAgent?: string,
    originUrl?: string
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

    // Helper to format referral link attributing to the host website
    const formatReferralLink = (code: string) => {
      const base = originUrl || env.APP_URL;
      const cleanBase = base.split("?")[0];
      return `${cleanBase}?ref=${code}`;
    };

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
        referralLink: formatReferralLink(existing.referralCode),
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
    const requireVerification = campaign.requireEmailVerification ?? false;
    const initialStatus = requireVerification ? "PENDING" : "VERIFIED";

    // 5. Insert participant into PostgreSQL
    const participant = await prisma.participant.create({
      data: {
        campaignId: campaign.id,
        rawEmail,
        canonicalEmail,
        referralCode,
        referredById: referrerId,
        verificationToken: requireVerification ? verificationToken : null,
        ipAddress,
        userAgent: userAgent || null,
        joinedAt,
        status: initialStatus,
        verifiedAt: requireVerification ? null : joinedAt,
      },
    });

    // 6. Insert participant into Redis ZSET
    const initialScore = leaderboardService.calculateScore(joinedAt, 0, campaign.referralBonusSec);
    await leaderboardService.addParticipant(campaign.id, participant.id, initialScore);

    // 7. Instant Mode: Credit referrer immediately if double opt-in is not required
    if (!requireVerification && referrerId) {
      try {
        const updatedReferrer = await prisma.participant.update({
          where: { id: referrerId },
          data: { verifiedReferrals: { increment: 1 } },
        });

        // Boost referrer's rank in Redis
        await leaderboardService.jumpParticipant(
          campaign.id,
          referrerId,
          campaign.referralBonusSec
        );

        // Check milestones for referrer
        const milestoneUnlocked = milestones.find((m: any) => m.count === updatedReferrer.verifiedReferrals) || null;
        if (milestoneUnlocked && campaign.webhookUrl && campaign.webhookSecret) {
          await dispatchWebhook({
            campaignId: campaign.id,
            webhookUrl: campaign.webhookUrl,
            webhookSecret: campaign.webhookSecret,
            eventType: "milestone.unlocked",
            payload: {
              participantId: updatedReferrer.id,
              email: maskEmail(updatedReferrer.rawEmail),
              verifiedReferrals: updatedReferrer.verifiedReferrals,
              milestone: milestoneUnlocked,
            },
          });
        }
      } catch (err: any) {
        console.warn("Could not credit referrer instantly:", err.message);
      }
    }

    // 8. If double-opt-in is required, enqueue verification email
    if (requireVerification) {
      await dispatchEmail({
        to: rawEmail,
        type: "verification",
        subject: `Verify your spot for ${campaign.name}`,
        variables: {
          verifyUrl: `${env.API_URL}/api/v1/waitlist/verify?token=${verificationToken}`,
          campaignName: campaign.name,
        },
      });
    }

    // 9. Dispatch webhook for new signup if configured
    if (campaign.webhookUrl && campaign.webhookSecret) {
      await dispatchWebhook({
        campaignId: campaign.id,
        webhookUrl: campaign.webhookUrl,
        webhookSecret: campaign.webhookSecret,
        eventType: "participant.verified",
        payload: {
          participantId: participant.id,
          email: maskEmail(participant.rawEmail),
          referralCode: participant.referralCode,
          status: participant.status,
          joinedAt: participant.joinedAt,
        },
      });
    }

    // 10. Get real-time rank and total
    const { position, total } = await leaderboardService.getRankTelemetry(campaign.id, participant.id);
    const nextMilestone = milestones.find((m: any) => m.count > 0) || null;

    return {
      isNewSignup: true,
      participantId: participant.id,
      referralCode: participant.referralCode,
      referralLink: formatReferralLink(participant.referralCode),
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

    // Redis rank jump for referrer
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
            participantId: result.referrer.id,
            email: maskEmail(result.referrer.rawEmail),
            verifiedReferrals: result.referrer.verifiedReferrals,
            milestone: result.milestoneUnlocked,
          },
        });

        await dispatchEmail({
          to: result.referrer.rawEmail,
          type: "milestone",
          subject: `Reward Unlocked: ${result.milestoneUnlocked.reward}!`,
          variables: {
            campaignName: result.campaign.name,
            reward: result.milestoneUnlocked.reward,
            referrals: String(result.referrer.verifiedReferrals),
          },
        });
      }
    }

    return {
      message: "Email successfully verified. Your waitlist position has been confirmed!",
      participantId: result.participant.id,
      campaignId: result.campaign.id,
    };
  }

  async demoSimulateReferral(campaign: CampaignContext, referralCode?: string, ipAddress: string = "127.0.0.1") {
    let target = null;
    if (referralCode) {
      target = await prisma.participant.findUnique({
        where: { referralCode },
      });
    }

    if (!target) {
      target = await prisma.participant.findFirst({
        where: { campaignId: campaign.id, status: "VERIFIED" },
        orderBy: { joinedAt: "asc" },
      });
    }

    if (!target) {
      throw new NotFoundError("No participants in campaign to simulate referrals for.");
    }

    const simEmail = `simulated_${Math.floor(Math.random() * 89999 + 10000)}@devtest.internal`;

    await prisma.participant.create({
      data: {
        campaignId: campaign.id,
        rawEmail: simEmail,
        canonicalEmail: simEmail,
        referralCode: generateReferralCode(),
        referredById: target.id,
        status: "VERIFIED",
        verifiedAt: new Date(),
        ipAddress,
      },
    });

    const updatedTarget = await prisma.participant.update({
      where: { id: target.id },
      data: { verifiedReferrals: { increment: 1 } },
    });

    await leaderboardService.jumpParticipant(
      campaign.id,
      target.id,
      campaign.referralBonusSec
    );

    const { position, total } = await leaderboardService.getRankTelemetry(campaign.id, target.id);

    return {
      success: true,
      simulatedUserEmail: maskEmail(simEmail),
      beneficiaryId: target.id,
      newVerifiedReferrals: updatedTarget.verifiedReferrals,
      newPosition: position,
      totalParticipants: total,
    };
  }

  async getStatus(campaign: CampaignContext, referralCode: string) {
    const participant = await prisma.participant.findUnique({
      where: { referralCode },
    });

    if (!participant || participant.campaignId !== campaign.id) {
      throw new NotFoundError("Participant not found for this campaign", "PARTICIPANT_NOT_FOUND");
    }

    const { position, total } = await leaderboardService.getRankTelemetry(campaign.id, participant.id);

    return {
      participantId: participant.id,
      referralCode: participant.referralCode,
      referralLink: `${env.APP_URL}?ref=${participant.referralCode}`,
      position: position ?? 1,
      totalParticipants: total,
      verifiedReferrals: participant.verifiedReferrals,
      status: participant.status,
    };
  }

  async getLeaderboard(campaign: CampaignContext, limit: number = 20) {
    const topEntries = await leaderboardService.getTopParticipants(campaign.id, limit);
    let topIds = topEntries.map((e) => e.participantId);

    if (topIds.length === 0) {
      const dbFallback = await prisma.participant.findMany({
        where: { campaignId: campaign.id },
        orderBy: [{ verifiedReferrals: "desc" }, { joinedAt: "asc" }],
        take: limit,
        select: { id: true },
      });
      topIds = dbFallback.map((p) => p.id);
    }

    if (topIds.length === 0) {
      return { leaderboard: [], total: 0 };
    }

    const participants = await prisma.participant.findMany({
      where: { id: { in: topIds } },
      select: {
        id: true,
        rawEmail: true,
        referralCode: true,
        verifiedReferrals: true,
        status: true,
        joinedAt: true,
      },
    });

    const pMap = new Map(participants.map((p) => [p.id, p]));

    const leaderboard = topIds
      .map((id, index) => {
        const p = pMap.get(id);
        if (!p) return null;
        return {
          rank: index + 1,
          participantId: p.id,
          email: maskEmail(p.rawEmail),
          maskedEmail: maskEmail(p.rawEmail),
          referralCode: p.referralCode || "N/A",
          verifiedReferrals: p.verifiedReferrals,
          status: p.status,
          joinedAt: p.joinedAt,
        };
      })
      .filter(Boolean);

    const total = await leaderboardService.getTotalCount(campaign.id);

    return { leaderboard, total };
  }
}

export const participantService = new ParticipantService();
