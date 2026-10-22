import crypto from "crypto";

export interface CampaignKeyPair {
  publicKey: string;
  secretKey: string;
  secretKeyHash: string;
  webhookSecret: string;
}

export function generateCampaignKeys(): CampaignKeyPair {
  const publicKey = `pk_live_${crypto.randomBytes(16).toString("hex")}`;
  const secretKey = `sk_live_${crypto.randomBytes(24).toString("hex")}`;
  const secretKeyHash = crypto.createHash("sha256").update(secretKey).digest("hex");
  const webhookSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

  return {
    publicKey,
    secretKey,
    secretKeyHash,
    webhookSecret,
  };
}

export function hashSecretKey(secretKey: string): string {
  return crypto.createHash("sha256").update(secretKey).digest("hex");
}