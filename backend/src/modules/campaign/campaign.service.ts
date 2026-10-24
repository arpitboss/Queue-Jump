import { prisma } from "../../config/db";
import { redis } from "../../config/redis";
import { generateCampaignKeys } from "../../utils/keyGenerator";
import { NotFoundError, ForbiddenError } from "../../utils/errors";
import { CreateCampaignInput, UpdateCampaignInput } from "./campaign.schema";

export class CampaignService {
  async createCampaign(tenantId: string, input: CreateCampaignInput) {
    const keys = generateCampaignKeys();

    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        name: input.name,
        publicKey: keys.publicKey,
        secretKeyHash: keys.secretKeyHash,
        webhookSecret: keys.webhookSecret,
        referralBonusSec: input.referralBonusSec,
        requireEmailVerification: input.requireEmailVerification ?? false,
        allowedDomains: input.allowedDomains || null,
        webhookUrl: input.webhookUrl || null,
        milestonesJson: JSON.stringify(input.milestones),
      },
    });

    return {
      id: campaign.id,
      name: campaign.name,
      publicKey: campaign.publicKey,
      secretKey: keys.secretKey, // Returned ONLY upon creation!
      webhookSecret: campaign.webhookSecret,
      referralBonusSec: campaign.referralBonusSec,
      requireEmailVerification: campaign.requireEmailVerification,
      allowedDomains: campaign.allowedDomains,
      webhookUrl: campaign.webhookUrl,
      milestones: input.milestones,
      createdAt: campaign.createdAt,
    };
  }

  async listCampaigns(tenantId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        publicKey: true,
        referralBonusSec: true,
        requireEmailVerification: true,
        allowedDomains: true,
        webhookUrl: true,
        milestonesJson: true,
        isDemo: true,
        createdAt: true,
        _count: {
          select: {
            participants: true,
            fraudLogs: true,
          },
        },
      },
    });

    return campaigns.map((c) => ({
      ...c,
      milestones:
        typeof c.milestonesJson === "string"
          ? JSON.parse(c.milestonesJson)
          : c.milestonesJson || [],
    }));
  }

  async getCampaignById(tenantId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            participants: true,
            fraudLogs: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError("Campaign not found", "CAMPAIGN_NOT_FOUND");
    }

    if (campaign.tenantId !== tenantId) {
      throw new ForbiddenError("You do not have access to this campaign");
    }

    return {
      id: campaign.id,
      name: campaign.name,
      publicKey: campaign.publicKey,
      webhookSecret: campaign.webhookSecret,
      referralBonusSec: campaign.referralBonusSec,
      requireEmailVerification: campaign.requireEmailVerification,
      allowedDomains: campaign.allowedDomains,
      webhookUrl: campaign.webhookUrl,
      milestones:
        typeof campaign.milestonesJson === "string"
          ? JSON.parse(campaign.milestonesJson)
          : campaign.milestonesJson || [],
      isDemo: campaign.isDemo,
      createdAt: campaign.createdAt,
      stats: {
        totalParticipants: campaign._count.participants,
        fraudBlocked: campaign._count.fraudLogs,
      },
    };
  }

  async updateCampaign(tenantId: string, campaignId: string, input: UpdateCampaignInput) {
    await this.getCampaignById(tenantId, campaignId);

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.referralBonusSec !== undefined) updateData.referralBonusSec = input.referralBonusSec;
    if (input.requireEmailVerification !== undefined) updateData.requireEmailVerification = input.requireEmailVerification;
    if (input.allowedDomains !== undefined) updateData.allowedDomains = input.allowedDomains;
    if (input.webhookUrl !== undefined) updateData.webhookUrl = input.webhookUrl;
    if (input.milestones !== undefined) updateData.milestonesJson = JSON.stringify(input.milestones);

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: updateData,
    });

    try {
      await redis.del(`campaign:pk:${updated.publicKey}`);
    } catch {
      // Non-critical cache purge error
    }

    return {
      id: updated.id,
      name: updated.name,
      publicKey: updated.publicKey,
      referralBonusSec: updated.referralBonusSec,
      requireEmailVerification: updated.requireEmailVerification,
      allowedDomains: updated.allowedDomains,
      webhookUrl: updated.webhookUrl,
      milestones:
        typeof updated.milestonesJson === "string"
          ? JSON.parse(updated.milestonesJson)
          : updated.milestonesJson || [],
    };
  }

  async deleteCampaign(tenantId: string, campaignId: string) {
    const campaign = await this.getCampaignById(tenantId, campaignId);

    if (campaign.isDemo) {
      throw new ForbiddenError("Cannot delete default demo campaign");
    }

    await prisma.campaign.delete({ where: { id: campaignId } });

    try {
      await redis.del(`campaign:pk:${campaign.publicKey}`);
      await redis.del(`leaderboard:${campaignId}`);
    } catch {
      // Non-critical cache cleanup error
    }

    return { success: true };
  }

  async exportParticipants(tenantId: string, campaignId: string) {
    const campaign = await this.getCampaignById(tenantId, campaignId);

    const participants = await prisma.participant.findMany({
      where: { campaignId },
      orderBy: [{ verifiedReferrals: "desc" }, { joinedAt: "asc" }],
      select: {
        rawEmail: true,
        canonicalEmail: true,
        status: true,
        verifiedReferrals: true,
        referralCode: true,
        joinedAt: true,
        verifiedAt: true,
        ipAddress: true,
      },
    });

    let csv = "Rank,Email,Status,Verified Referrals,Referral Code,Joined At,Verified At\n";
    participants.forEach((p, idx) => {
      const joined = p.joinedAt ? p.joinedAt.toISOString() : "";
      const verified = p.verifiedAt ? p.verifiedAt.toISOString() : "";
      csv += `${idx + 1},"${p.rawEmail}",${p.status},${p.verifiedReferrals},"${p.referralCode}","${joined}","${verified}"\n`;
    });

    return {
      csv,
      campaignName: campaign.name.replace(/[^a-zA-Z0-9_-]/g, "_"),
      totalCount: participants.length,
    };
  }

  async admitCohort(tenantId: string, campaignId: string, count: number) {
    await this.getCampaignById(tenantId, campaignId);
    const safeCount = Math.max(1, Math.min(count, 500));

    const candidates = await prisma.participant.findMany({
      where: { campaignId, status: "VERIFIED" },
      orderBy: [{ verifiedReferrals: "desc" }, { joinedAt: "asc" }],
      take: safeCount,
      select: {
        id: true,
        rawEmail: true,
        referralCode: true,
      },
    });

    if (candidates.length === 0) {
      return { admittedCount: 0, participants: [] };
    }

    const candidateIds = candidates.map((c) => c.id);
    await prisma.participant.updateMany({
      where: { id: { in: candidateIds } },
      data: { status: "ADMITTED" },
    });

    return {
      admittedCount: candidates.length,
      participants: candidates,
    };
  }

}


export const campaignService = new CampaignService();
