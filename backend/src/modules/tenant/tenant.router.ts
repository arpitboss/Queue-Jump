import { Router } from "express";
import { handleRegister, handleLogin, handleRefresh, handleMe } from "./tenant.controller";
import { tenantAuth } from "../../middlewares/tenantAuth";

export const tenantRouter = Router();

tenantRouter.post("/register", handleRegister);
tenantRouter.post("/login", handleLogin);
tenantRouter.post("/refresh", handleRefresh);
tenantRouter.get("/me", tenantAuth, handleMe);