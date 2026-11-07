import { Router } from "express";
import { handleRegister, handleLogin, handleRefresh, handleLogout, handleMe } from "./tenant.controller";
import { tenantAuth } from "../../middlewares/tenantAuth";
import { createRateLimiter } from "../../middlewares/rateLimiter";

export const tenantRouter = Router();

const authLimiter = createRateLimiter({
  limit: 10,
  windowSeconds: 900,
  message: "Too many login/register attempts. Please wait 15 minutes before trying again.",
  prefix: "auth",
});

tenantRouter.post("/register", authLimiter, handleRegister);
tenantRouter.post("/login", authLimiter, handleLogin);
tenantRouter.post("/refresh", handleRefresh);
tenantRouter.post("/logout", handleLogout);
tenantRouter.get("/me", tenantAuth, handleMe);
