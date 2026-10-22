import { Router } from "express";
import {
  handleCreateCampaign,
  handleListCampaigns,
  handleGetCampaign,
  handleUpdateCampaign,
  handleDeleteCampaign,
} from "./campaign.controller";
import { tenantAuth } from "../../middlewares/tenantAuth";

export const campaignRouter = Router();

campaignRouter.use(tenantAuth);

campaignRouter.post("/", handleCreateCampaign);
campaignRouter.get("/", handleListCampaigns);
campaignRouter.get("/:id", handleGetCampaign);
campaignRouter.patch("/:id", handleUpdateCampaign);
campaignRouter.delete("/:id", handleDeleteCampaign);