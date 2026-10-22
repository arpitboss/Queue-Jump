import crypto from "crypto";
import { prisma } from "../../config/db";
import { leaderboardService } from "../leaderboard/leaderboard.service";
import { fraudService } from "../fraud/fraud.service";
import { generateReferralCode } from "../../utils/referralCode";
import { NotFoundError } from "../../utils/errors";
import { env } from "../../config/env";

export interface CampaignContext {
  id: string;
  name: string;
  publicKey: string;
  referralBonusSec: number;
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

    // 7. Get real-time rank and total
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