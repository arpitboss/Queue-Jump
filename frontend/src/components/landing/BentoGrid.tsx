"use client";

import { useState, useEffect } from "react";
import { Zap, ShieldCheck, Webhook, Activity, Clock, Terminal, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function BentoGrid() {
  const [terminalIndex, setTerminalIndex] = useState(0);

  const logs = [
    { type: "BLOCKED", email: "bot_99@10minutemail.com", reason: "DISPOSABLE_DOMAIN", time: "12ms ago" },
    { type: "NORMALIZED", email: "john.doe+promo@googlemail.com", to: "johndoe@gmail.com", time: "34ms ago" },
    { type: "RATE_LIMITED", ip: "198.51.100.24", reason: "IP_RATE_LIMIT (>5/15m)", time: "110ms ago" },
    { type: "VERIFIED", email: "alex@hey.com", rank: "#42", jump: "+50 spots", time: "280ms ago" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalIndex((prev) => (prev + 1) % logs.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [logs.length]);

  return (
    <section id="features" className="py-24 border-t border-white/5 bg-[#09090B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-orange-400 font-semibold">
            Architectural Engineering
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Built for 100K+ concurrent signups, not toy demos
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            A high-craft developer stack combining Redis Sorted Sets, BullMQ retries, and atomic PostgreSQL transactions.
          </p>
        </div>

        {/* Asymmetric 3-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Redis ZSET Performance (7 cols) */}
          <div className="md:col-span-7 bg-[#101015] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Sub-10ms Queue Ranking with Redis Sorted Sets
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Traditional waitlists crash under launch traffic when calculating positions via SQL <code className="text-orange-400 font-mono">COUNT(*) WHERE created_at &lt; user_created_at</code>. QueueJump maintains rank in logarithmic time.
              </p>
            </div>

            {/* Benchmark Graphic */}
            <div className="mt-8 space-y-4 bg-[#14141C] border border-white/5 rounded-xl p-5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Standard SQL OFFSET scan (100k rows):</span>
                  <span className="text-red-400 font-bold">420.5ms</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500/80 h-full rounded-full w-[95%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    QueueJump Redis ZRANK + ZINCRBY:
                  </span>
                  <span className="text-emerald-400 font-bold">0.42ms</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full w-[4%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: 3-Layer Anti-Fraud Shield (5 cols) */}
          <div className="md:col-span-5 bg-[#101015] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Automated Bot & Abuse Shield
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Prevents leaderboard rigging via canonical email normalization, disposable domain blocking, and sliding-window IP limits.
              </p>
            </div>

            {/* Live Terminal Simulation */}
            <div className="mt-6 bg-[#09090D] border border-white/10 rounded-xl p-4 font-mono text-xs">
              <div className="flex items-center gap-1.5 pb-3 border-b border-white/5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-[11px] text-zinc-500 ml-2">fraud-audit-stream</span>
              </div>

              <div className="space-y-2 text-[11px]">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`transition duration-300 ${
                      idx === terminalIndex ? "text-white opacity-100 font-semibold" : "text-zinc-500 opacity-60"
                    }`}
                  >
                    <span
                      className={
                        log.type === "BLOCKED"
                          ? "text-red-400"
                          : log.type === "RATE_LIMITED"
                          ? "text-amber-400"
                          : log.type === "NORMALIZED"
                          ? "text-blue-400"
                          : "text-emerald-400"
                      }
                    >
                      [{log.type}]
                    </span>{" "}
                    {log.email || log.ip} &rarr; {log.reason || log.jump || log.to}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Event-Driven Webhooks & Rewards (Full 12 cols) */}
          <div className="md:col-span-12 bg-[#101015] border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Webhook className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Signed HMAC Webhooks & Milestone Rewards
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Automatically notify your backend when participants cross referral milestones (e.g. 3 referrals = Early Access). Every payload is cryptographically signed with HMAC-SHA256 and backed by BullMQ retries.
                </p>
              </div>

              {/* Interactive Pipeline Diagram */}
              <div className="lg:col-span-7 bg-[#14141C] border border-white/5 rounded-xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1">
                    <div className="text-[11px] font-mono text-zinc-500">TRIGGER</div>
                    <div className="text-xs font-bold text-white">3 Referrals Verified</div>
                    <div className="text-[10px] text-emerald-400 font-mono">ACID Confirmed</div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1">
                    <div className="text-[11px] font-mono text-zinc-500">DISPATCHER</div>
                    <div className="text-xs font-bold text-white">BullMQ Queue</div>
                    <div className="text-[10px] text-orange-400 font-mono">Auto Retries</div>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1">
                    <div className="text-[11px] font-mono text-zinc-500">DELIVERY</div>
                    <div className="text-xs font-bold text-white">Signed Webhook</div>
                    <div className="text-[10px] text-purple-400 font-mono">HMAC-SHA256</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}