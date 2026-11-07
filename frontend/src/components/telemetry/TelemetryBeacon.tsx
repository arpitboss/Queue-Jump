"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/api";

export function TelemetryBeacon() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Record site access & referrer origin telemetry
    try {
      fetch(`${API_URL}/api/v1/telemetry/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: window.location.pathname,
          referrer: document.referrer || "Direct",
        }),
      }).catch(() => {});
    } catch {}

    // 2. Health heartbeat to keep Render server warm (every 3 minutes)
    const pingHealth = () => {
      fetch(`${API_URL}/api/v1/health`, { cache: "no-store" }).catch(() => {});
    };

    pingHealth(); // Initial instant wakeup
    const interval = setInterval(pingHealth, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}