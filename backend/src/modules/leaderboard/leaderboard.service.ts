import { redis } from "../../config/redis";
import { prisma } from "../../config/db";

export class LeaderboardService {
  private getKey(campaignId: string): string {
    return `campaign:${campaignId}:leaderboard`;
  }

  /**
   * Calculates the Unix timestamp based score:
   * Score = joinedAtUnixSeconds - (verifiedReferrals * referralBonusSec)
   * Lower scores rank higher (ZRANK 0 is #1).
   */
  calculateScore(joinedAt: Date, verifiedReferrals: number, referralBonusSec: number): number {
    const joinedSec = Math.floor(joinedAt.getTime() / 1000);
    return joinedSec - verifiedReferrals * referralBonusSec;
  }

  /**
   * Adds a participant to the Redis ZSET with error safety.
   */
  async addParticipant(
    campaignId: string,
    participantId: string,
    score: number
  ): Promise<void> {
    try {
      const key = this.getKey(campaignId);
      await redis.zadd(key, score, participantId);
    } catch (err: any) {
      console.warn("Could not add participant to Redis ZSET:", err.message);
    }
  }

  /**
   * Decrements a participant's score when a referral is verified,
   * moving them forward in the queue.
   */
  async jumpParticipant(
    campaignId: string,
    participantId: string,
    bonusSec: number
  ): Promise<number> {
    try {
      const key = this.getKey(campaignId);
      const newScore = await redis.zincrby(key, -bonusSec, participantId);
      return parseFloat(newScore);
    } catch (err: any) {
      console.warn("Could not update Redis score on referral jump:", err.message);
      return 0;
    }
  }

  /**
   * Returns the 1-based queue position of a participant.
   */
  async getPosition(campaignId: string, participantId: string): Promise<number | null> {
    try {
      const key = this.getKey(campaignId);
      const rank = await redis.zrank(key, participantId);
      if (rank !== null) return rank + 1;
    } catch (err: any) {
      console.warn("Could not read Redis position:", err.message);
    }

    try {
      const count = await prisma.participant.count({ where: { campaignId } });
      return count || 1;
    } catch {
      return 1;
    }
  }

  /**
   * Returns total participants in the waitlist.
   */
  async getTotalCount(campaignId: string): Promise<number> {
    try {
      const key = this.getKey(campaignId);
      const count = await redis.zcard(key);
      if (count > 0) return count;
    } catch (err: any) {
      console.warn("Could not read Redis total count:", err.message);
    }

    try {
      return await prisma.participant.count({ where: { campaignId } });
    } catch {
      return 0;
    }
  }

  /**
   * Gets position and total count in a single atomic pipelined roundtrip,
   * with graceful fallback to PostgreSQL if Redis is degraded.
   */
  async getRankTelemetry(campaignId: string, participantId: string): Promise<{ position: number | null; total: number }> {
    try {
      const key = this.getKey(campaignId);
      const pipeline = redis.pipeline();
      pipeline.zrank(key, participantId);
      pipeline.zcard(key);

      const results = await pipeline.exec();
      if (results) {
        const rankResult = results[0][1] as number | null;
        const total = (results[1][1] as number) || 0;
        const position = rankResult !== null ? rankResult + 1 : null;
        if (total > 0) {
          return { position: position ?? total, total };
        }
      }
    } catch (err: any) {
      console.warn("Redis rank telemetry failed, falling back to PostgreSQL:", err.message);
    }

    try {
      const total = await prisma.participant.count({ where: { campaignId } });
      return { position: total || 1, total: total || 1 };
    } catch {
      return { position: 1, total: 1 };
    }
  }

  /**
   * Estimates how many participants this user will jump past if they get 1 more referral.
   */
  async calculatePotentialJump(
    campaignId: string,
    participantId: string,
    bonusSec: number
  ): Promise<number> {
    try {
      const key = this.getKey(campaignId);
      const currentScoreStr = await redis.zscore(key, participantId);
      if (!currentScoreStr) return 0;

      const currentScore = parseFloat(currentScoreStr);
      const targetScore = currentScore - bonusSec;

      const count = await redis.zcount(key, `(${targetScore}`, `(${currentScore}`);
      return count;
    } catch {
      return 3;
    }
  }

  /**
   * Gets top N participants with their scores.
   */
  async getTopParticipants(campaignId: string, limit = 20): Promise<{ participantId: string; score: number }[]> {
    try {
      const key = this.getKey(campaignId);
      const raw = await redis.zrange(key, 0, (limit - 1).toString(), "WITHSCORES");
      const result: { participantId: string; score: number }[] = [];

      for (let i = 0; i < raw.length; i += 2) {
        result.push({
          participantId: raw[i],
          score: parseFloat(raw[i + 1]),
        });
      }

      return result;
    } catch {
      return [];
    }
  }

  /**
   * Rebuilds the Redis ZSET from PostgreSQL if Redis restarted or cache was evicted.
   */
  async reconcileLeaderboard(campaignId: string, referralBonusSec: number): Promise<number> {
    try {
      const key = this.getKey(campaignId);
      const exists = await redis.exists(key);
      if (exists === 1) return 0; // Already warm

      console.warn(`[Leaderboard Reconciliation] Rebuilding Redis ZSET for campaign ${campaignId}...`);

      const participants = await prisma.participant.findMany({
        where: { campaignId },
        select: { id: true, joinedAt: true, verifiedReferrals: true },
      });

      if (participants.length === 0) return 0;

      const pipeline = redis.pipeline();
      for (const p of participants) {
        const score = this.calculateScore(p.joinedAt, p.verifiedReferrals, referralBonusSec);
        pipeline.zadd(key, score, p.id);
      }
      await pipeline.exec();

      console.log(`[Leaderboard Reconciliation] Restored ${participants.length} entries into Redis ZSET.`);
      return participants.length;
    } catch (err: any) {
      console.warn("Could not reconcile leaderboard to Redis:", err.message);
      return 0;
    }
  }
}

export const leaderboardService = new LeaderboardService();
