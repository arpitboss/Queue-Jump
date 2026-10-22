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
      milestones: typeof c.milestonesJson === "string" ? JSON.parse(c.milestonesJson) : c.milestonesJson,
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
      throw new ForbiddenError("You do not have access to this campaign", "FORBIDDEN");
    }

    return {
      ...campaign,
      secretKeyHash: undefined, // Never leak hash
      milestones:
        typeof campaign.milestonesJson === "string"
          ? JSON.parse(campaign.milestonesJson)
          : campaign.milestonesJson,
    };
  }

  async updateCampaign(tenantId: string, campaignId: string, input: UpdateCampaignInput) {
    const existing = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!existing) {
      throw new NotFoundError("Campaign not found", "CAMPAIGN_NOT_FOUND");
    }

    if (existing.tenantId !== tenantId) {
      throw new ForbiddenError("You do not have access to this campaign", "FORBIDDEN");
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.referralBonusSec !== undefined ? { referralBonusSec: input.referralBonusSec } : {}),
        ...(input.webhookUrl !== undefined ? { webhookUrl: input.webhookUrl } : {}),
        ...(input.milestones !== undefined ? { milestonesJson: JSON.stringify(input.milestones) } : {}),
      },
    });

    // Invalidate Redis cache for this public key
    try {
      await redis.del(`campaign:pk:${existing.publicKey}`);
    } catch {
      // Ignore Redis del error
    }

    return {
      ...updated,
      secretKeyHash: undefined,
      milestones:
        typeof updated.milestonesJson === "string"
          ? JSON.parse(updated.milestonesJson)
          : updated.milestonesJson,
    };
  }

  async deleteCampaign(tenantId: string, campaignId: string) {
    const existing = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!existing) {
      throw new NotFoundError("Campaign not found", "CAMPAIGN_NOT_FOUND");
    }

    if (existing.tenantId !== tenantId) {
      throw new ForbiddenError("You do not have access to this campaign", "FORBIDDEN");
    }

    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    // Cleanup Redis keys
    try {
      await redis.del(`campaign:pk:${existing.publicKey}`);
      await redis.del(`campaign:${existing.id}:leaderboard`);
    } catch {
      // Ignore
    }

    return { success: true };
  }
}

export const campaignService = new CampaignService();