import { redis } from "../../config/redis";

export interface VisitPayload {
  path: string;
  referrer?: string;
  ipAddress: string;
  country?: string;
  city?: string;
  userAgent?: string;
}

export class TelemetryService {
  async recordVisit(payload: VisitPayload): Promise<void> {
    const timestamp = Date.now();
    let cleanOrigin = "Direct";
    if (payload.referrer && payload.referrer.trim().length > 0) {
      try {
        const u = new URL(payload.referrer);
        cleanOrigin = u.hostname.replace(/^www\./, "");
      } catch {
        cleanOrigin = payload.referrer.slice(0, 32);
      }
    }

    const country = payload.country || "Unknown";
    const logItem = JSON.stringify({
      path: payload.path || "/",
      referrer: cleanOrigin,
      country,
      city: payload.city || null,
      userAgent: (payload.userAgent || "").slice(0, 80),
      timestamp,
    });

    try {
      const pipeline = redis.pipeline();
      pipeline.incr("telemetry:total_visits");
      pipeline.zincrby("telemetry:referrers", 1, cleanOrigin);
      pipeline.zincrby("telemetry:countries", 1, country);
      pipeline.lpush("telemetry:recent_visits", logItem);
      pipeline.ltrim("telemetry:recent_visits", 0, 99);
      await pipeline.exec();
    } catch (err: any) {
      console.warn("Telemetry record warning:", err.message);
    }
  }

  async getStats(): Promise<any> {
    try {
      const pipeline = redis.pipeline();
      pipeline.get("telemetry:total_visits");
      pipeline.zrevrange("telemetry:referrers", 0, 9, "WITHSCORES");
      pipeline.zrevrange("telemetry:countries", 0, 9, "WITHSCORES");
      pipeline.lrange("telemetry:recent_visits", 0, 19);

      const results = await pipeline.exec();
      if (!results) {
        return { totalVisits: 0, topReferrers: [], topCountries: [], recentVisits: [] };
      }

      const totalVisits = Number(results[0][1] || 0);

      const rawReferrers = (results[1][1] as string[]) || [];
      const topReferrers: { source: string; count: number }[] = [];
      for (let i = 0; i < rawReferrers.length; i += 2) {
        topReferrers.push({ source: rawReferrers[i], count: Number(rawReferrers[i + 1]) });
      }

      const rawCountries = (results[2][1] as string[]) || [];
      const topCountries: { country: string; count: number }[] = [];
      for (let i = 0; i < rawCountries.length; i += 2) {
        topCountries.push({ country: rawCountries[i], count: Number(rawCountries[i + 1]) });
      }

      const rawRecent = (results[3][1] as string[]) || [];
      const recentVisits = rawRecent
        .map((r) => {
          try { return JSON.parse(r); } catch { return null; }
        })
        .filter(Boolean);

      return {
        totalVisits,
        topReferrers,
        topCountries,
        recentVisits,
        backendStatus: {
          status: "online",
          uptimeSeconds: Math.floor(process.uptime()),
          memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
          serverTime: new Date().toISOString(),
        },
      };
    } catch {
      return {
        totalVisits: 0,
        topReferrers: [],
        topCountries: [],
        recentVisits: [],
        backendStatus: { status: "online", uptimeSeconds: Math.floor(process.uptime()) },
      };
    }
  }
}

export const telemetryService = new TelemetryService();
