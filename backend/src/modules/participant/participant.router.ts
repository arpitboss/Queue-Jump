import { Router } from "express";
import { handleJoinWaitlist, handleGetStatus, handleGetLeaderboard } from "./participant.controller";
import { apiKeyAuth } from "../../middlewares/apiKeyAuth";

export const participantRouter = Router();

// All waitlist participant endpoints require X-Campaign-Key
participantRouter.use(apiKeyAuth);

participantRouter.post("/join", handleJoinWaitlist);
participantRouter.get("/status/:referralCode", handleGetStatus);
participantRouter.get("/leaderboard", handleGetLeaderboard);