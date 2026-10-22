import { Campaign } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        email: string;
        name: string;
      };
      campaign?: {
        id: string;
        tenantId: string;
        name: string;
        publicKey: string;
        referralBonusSec: number;
        webhookUrl: string | null;
        webhookSecret: string | null;
        milestonesJson: unknown;
        isDemo: boolean;
      };
    }
  }
}
export {};