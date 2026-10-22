import { z } from "zod";

export const milestoneItemSchema = z.object({
  count: z.number().int().positive("Milestone referral count must be greater than 0"),
  reward: z.string().trim().min(1, "Reward description is required"),
});

export const createCampaignSchema = z.object({
  name: z.string().trim().min(2, "Campaign name must be at least 2 characters"),
  referralBonusSec: z.number().int().min(0, "Bonus seconds cannot be negative").default(86400),
  webhookUrl: z.string().trim().url("Invalid webhook URL").optional().nullable(),
  milestones: z.array(milestoneItemSchema).default([]),
});

export const updateCampaignSchema = z.object({
  name: z.string().trim().min(2, "Campaign name must be at least 2 characters").optional(),
  referralBonusSec: z.number().int().min(0).optional(),
  webhookUrl: z.string().trim().url("Invalid webhook URL").optional().nullable(),
  milestones: z.array(milestoneItemSchema).optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;