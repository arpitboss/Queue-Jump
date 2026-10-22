export interface Milestone {
  count: number;
  reward: string;
}

export interface Campaign {
  id: string;
  name: string;
  publicKey: string;
  secretKey?: string;
  referralBonusSec: number;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  milestones: Milestone[];
  isDemo?: boolean;
  createdAt: string;
  _count?: {
    participants: number;
    fraudLogs?: number;
  };
}

export interface Participant {
  id: string;
  rawEmail: string;
  canonicalEmail?: string;
  referralCode: string;
  status: "PENDING" | "VERIFIED" | "FLAGGED";
  verifiedReferrals: number;
  joinedAt: string;
  verifiedAt?: string | null;
}

export interface JoinWaitlistResponse {
  isNewSignup: boolean;
  participantId: string;
  referralCode: string;
  referralLink: string;
  position: number;
  totalParticipants: number;
  verifiedReferrals: number;
  nextMilestone: Milestone | null;
  status: "PENDING" | "VERIFIED" | "FLAGGED";
}

export interface DemoSimulateResponse {
  participantId: string;
  referralCode: string;
  previousPosition: number;
  newPosition: number;
  spotsJumped: number;
  verifiedReferrals: number;
  totalParticipants: number;
  redisLatencyMs: number;
}

export interface LeaderboardItem {
  rank: number;
  email: string;
  referralCode: string;
  verifiedReferrals: number;
  joinedAt: string;
}

export interface FraudBlockLogItem {
  id: string;
  campaignId: string;
  rawEmail: string;
  ipAddress: string;
  reason: "DISPOSABLE_DOMAIN" | "INVALID_MX" | "IP_RATE_LIMIT" | "SELF_REFERRAL_IP" | string;
  createdAt: string;
}

export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  campaigns: Campaign[];
}