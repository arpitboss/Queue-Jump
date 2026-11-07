import { Router, Request, Response, NextFunction } from "express";
import {
  handleCreateCampaign,
  handleListCampaigns,
  handleGetCampaign,
  handleUpdateCampaign,
  handleDeleteCampaign,
  handleExportParticipants,
  handleAdmitCohort,
} from "./campaign.controller";
import { tenantAuth } from "../../middlewares/tenantAuth";
import { fraudService } from "../fraud/fraud.service";
import { campaignService } from "./campaign.service";

export const campaignRouter = Router();

campaignRouter.use(tenantAuth);

campaignRouter.post("/", handleCreateCampaign);
campaignRouter.get("/", handleListCampaigns);
campaignRouter.get("/:id", handleGetCampaign);
campaignRouter.patch("/:id", handleUpdateCampaign);
campaignRouter.delete("/:id", handleDeleteCampaign);

// Fraud Logs for Campaign
campaignRouter.get("/:id/fraud-logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify that the authenticated tenant owns this campaign
    await campaignService.getCampaignById(req.tenant!.id, req.params.id as string);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const result = await fraudService.getFraudLogs(req.params.id as string, limit, offset);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
campaignRouter.get("/:id/export", handleExportParticipants);
campaignRouter.post("/:id/admit", handleAdmitCohort);
