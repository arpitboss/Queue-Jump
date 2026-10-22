import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "20s", target: 50 },  // Ramp up to 50 users
    { duration: "60s", target: 200 }, // Sustain 200 concurrent users
    { duration: "20s", target: 0 },   // Ramp down
  ],
  thresholds: {
    // Assert 95% of requests finish under 100ms
    http_req_duration: ["p(95)<100"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:4000";
const CAMPAIGN_KEY = __ENV.CAMPAIGN_KEY || "pk_live_demo_queuejump";

export default function () {
  const isJoinAction = Math.random() < 0.7; // 70% joins, 30% status reads

  if (isJoinAction) {
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const payload = JSON.stringify({
      email: `loadtest_${__VU}_${__ITER}_${randomSuffix}@gmail.com`,
    });

    const params = {
      headers: {
        "Content-Type": "application/json",
        "X-Campaign-Key": CAMPAIGN_KEY,
      },
    };

    const res = http.post(`${BASE_URL}/api/v1/waitlist/join`, payload, params);

    check(res, {
      "join returns 201 or 200": (r) => r.status === 201 || r.status === 200,
      "response has position": (r) => JSON.parse(r.body).position !== undefined,
    });
  } else {
    // 30% status lookups
    const params = {
      headers: {
        "X-Campaign-Key": CAMPAIGN_KEY,
      },
    };

    const res = http.get(`${BASE_URL}/api/v1/waitlist/leaderboard?limit=10`, params);

    check(res, {
      "leaderboard returns 200": (r) => r.status === 200,
    });
  }

  sleep(0.1);
}