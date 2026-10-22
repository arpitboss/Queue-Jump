import { Router } from "express";
import {
  handleJoinWaitlist,
  handleVerifyEmail,
  handleDemoSimulate,
  handleGetStatus,
  handleGetLeaderboard,
} from "./participant.controller";
import { apiKeyAuth } from "../../middlewares/apiKeyAuth";

export const participantRouter = Router();

// Public verification callback endpoint (no campaign key needed)
participantRouter.post("/verify", handleVerifyEmail);
participantRouter.get("/verify", handleVerifyEmail);

// Endpoints requiring X-Campaign-Key
participantRouter.post("/join", apiKeyAuth, handleJoinWaitlist);
participantRouter.post("/demo-simulate", apiKeyAuth, handleDemoSimulate);
participantRouter.get("/status/:referralCode", apiKeyAuth, handleGetStatus);
participantRouter.get("/leaderboard", apiKeyAuth, handleGetLeaderboard);