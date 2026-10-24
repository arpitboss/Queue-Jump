import ExcelJS from "exceljs";
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
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "QueueJump Viral Engine";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Waitlist Participants", {
      views: [{ showGridLines: true }],
    });

    // 1. Title Banner (Rows 1-2)
    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `QUEUEJUMP WAITLIST REPORT — ${campaign.name.toUpperCase()}`;
    titleCell.font = { name: "Arial", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF09090B" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    worksheet.getRow(1).height = 34;

    const totalCount = participants.length;
    const verifiedCount = participants.filter((p) => p.status === "VERIFIED" || p.status === "ADMITTED").length;
    const admittedCount = participants.filter((p) => p.status === "ADMITTED").length;
    const totalReferrals = participants.reduce((acc, p) => acc + (p.verifiedReferrals || 0), 0);

    worksheet.mergeCells("A2:H2");
    const metaCell = worksheet.getCell("A2");
    metaCell.value = `Exported: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC  |  Key: ${campaign.publicKey}  |  Subscribers: ${totalCount}  |  Verified: ${verifiedCount}  |  Admitted: ${admittedCount}  |  Total Referrals: ${totalReferrals}`;
    metaCell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF52525B" } };
    metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F5" } };
    metaCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    worksheet.getRow(2).height = 22;

    // Row 3: Blank separator
    worksheet.getRow(3).height = 8;

    // 2. Table Headers (Row 4)
    const headers = [
      "Rank",
      "Subscriber Email",
      "Canonical Email",
      "Queue Status",
      "Verified Referrals",
      "Unique Invite Code",
      "Joined Date (UTC)",
      "Verified Date (UTC)",
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 26;

    headers.forEach((_, colIndex) => {
      const cell = headerRow.getCell(colIndex + 1);
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF18181B" } };
      cell.alignment = { vertical: "middle", horizontal: colIndex === 0 || colIndex === 3 || colIndex === 4 ? "center" : "left" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF27272A" } },
        bottom: { style: "medium", color: { argb: "FF09090B" } },
      };
    });

    // 3. Columns Widths
    worksheet.columns = [
      { key: "rank", width: 10 },
      { key: "email", width: 34 },
      { key: "canonical", width: 34 },
      { key: "status", width: 18 },
      { key: "referrals", width: 20 },
      { key: "code", width: 22 },
      { key: "joinedAt", width: 22 },
      { key: "verifiedAt", width: 22 },
    ];

    // 4. Populate Data Rows with Zebra Striping and Status Pills
    participants.forEach((p, idx) => {
      const rowNum = 5 + idx;
      const row = worksheet.getRow(rowNum);
      const isEven = idx % 2 === 0;

      const joinedStr = p.joinedAt ? p.joinedAt.toISOString().replace("T", " ").slice(0, 19) : "";
      const verifiedStr = p.verifiedAt ? p.verifiedAt.toISOString().replace("T", " ").slice(0, 19) : "";

      row.values = [
        idx + 1,
        p.rawEmail,
        p.canonicalEmail,
        p.status,
        p.verifiedReferrals,
        p.referralCode,
        joinedStr,
        verifiedStr,
      ];
      row.height = 22;

      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        cell.font = { name: "Arial", size: 9.5 };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE4E4E7" } },
          right: { style: "thin", color: { argb: "FFF4F4F5" } },
        };

        if (c === 1 || c === 5) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (c === 4) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }

        if (!isEven) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
        }

        if (c === 4) {
          if (p.status === "ADMITTED") {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE9FE" } };
            cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF5B21B6" } };
          } else if (p.status === "VERIFIED") {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
            cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF166534" } };
          } else {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
            cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF92400E" } };
          }
        }
      }
    });

    // 5. Excel AutoFilter Dropdowns
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: 8 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      campaignName: campaign.name.replace(/[^a-zA-Z0-9_-]/g, "_"),
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
