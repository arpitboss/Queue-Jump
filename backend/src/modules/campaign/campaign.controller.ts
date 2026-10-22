import { Request, Response, NextFunction } from "express";
import { campaignService } from "./campaign.service";
import { createCampaignSchema, updateCampaignSchema } from "./campaign.schema";

export async function handleCreateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = createCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign(req.tenant!.id, validated);
    res.status(201).json({ campaign });
  } catch (err) {
    next(err);
  }
}

export async function handleListCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const campaigns = await campaignService.listCampaigns(req.tenant!.id);
    res.status(200).json({ campaigns });
  } catch (err) {
    next(err);
  }
}

export async function handleGetCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const campaign = await campaignService.getCampaignById(req.tenant!.id, req.params.id as string);
    res.status(200).json({ campaign });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = updateCampaignSchema.parse(req.body);
    const campaign = await campaignService.updateCampaign(req.tenant!.id, req.params.id as string, validated);
    res.status(200).json({ campaign });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await campaignService.deleteCampaign(req.tenant!.id, req.params.id as string);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}