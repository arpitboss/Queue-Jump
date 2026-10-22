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
   * Adds a participant to the Redis ZSET.
   */
  async addParticipant(
    campaignId: string,
    participantId: string,
    score: number
  ): Promise<void> {
    const key = this.getKey(campaignId);
    await redis.zadd(key, score, participantId);
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
    const key = this.getKey(campaignId);
    // zincrby with a negative value lowers the score (jumps ahead)
    const newScore = await redis.zincrby(key, -bonusSec, participantId);
    return parseFloat(newScore);
  }

  /**
   * Returns the 1-based queue position of a participant.
   */
  async getPosition(campaignId: string, participantId: string): Promise<number | null> {
    const key = this.getKey(campaignId);
    const rank = await redis.zrank(key, participantId);
    if (rank === null) return null;
    return rank + 1; // 1-indexed position
  }

  /**
   * Returns total participants in the waitlist.
   */
  async getTotalCount(campaignId: string): Promise<number> {
    const key = this.getKey(campaignId);
    return redis.zcard(key);
  }

  /**
   * Gets position and total count in a single atomic pipelined roundtrip.
   */
  async getRankTelemetry(campaignId: string, participantId: string): Promise<{ position: number | null; total: number }> {
    const key = this.getKey(campaignId);
    const pipeline = redis.pipeline();
    pipeline.zrank(key, participantId);
    pipeline.zcard(key);

    const results = await pipeline.exec();
    if (!results) return { position: null, total: 0 };

    const rankResult = results[0][1] as number | null;
    const total = (results[1][1] as number) || 0;
    const position = rankResult !== null ? rankResult + 1 : null;

    return { position, total };
  }

  /**
   * Estimates how many participants this user will jump past if they get 1 more referral.
   */
  async calculatePotentialJump(
    campaignId: string,
    participantId: string,
    bonusSec: number
  ): Promise<number> {
    const key = this.getKey(campaignId);
    const currentScoreStr = await redis.zscore(key, participantId);
    if (!currentScoreStr) return 0;

    const currentScore = parseFloat(currentScoreStr);
    const targetScore = currentScore - bonusSec;

    // Count participants between targetScore and currentScore (exclusive of current)
    const count = await redis.zcount(key, `(${targetScore}`, `(${currentScore}`);
    return count;
  }

  /**
   * Gets top N participants with their scores.
   */
  async getTopParticipants(campaignId: string, limit = 20): Promise<{ participantId: string; score: number }[]> {
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
  }

  /**
   * Rebuilds the Redis ZSET from PostgreSQL if Redis restarted or cache was evicted.
   */
  async reconcileLeaderboard(campaignId: string, referralBonusSec: number): Promise<number> {
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
  }
}

export const leaderboardService = new LeaderboardService();