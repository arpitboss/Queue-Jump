"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, Copy, Share2, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { OdometerNumber } from "../widget/OdometerNumber";
import { apiRequest } from "@/lib/api";
import { JoinWaitlistResponse, DemoSimulateResponse } from "@/lib/types";

const DEMO_CAMPAIGN_KEY = "pk_live_demo_queuejump";

export function LivePlayground() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [participant, setParticipant] = useState<JoinWaitlistResponse | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [spotsJumped, setSpotsJumped] = useState<number | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const start = performance.now();
    try {
      const data = await apiRequest<JoinWaitlistResponse>("/api/v1/waitlist/join", {
        method: "POST",
        campaignKey: DEMO_CAMPAIGN_KEY,
        body: JSON.stringify({ email: email.trim() }),
      });

      const elapsed = parseFloat((performance.now() - start).toFixed(2));
      setLastLatency(elapsed);
      setParticipant(data);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.75 },
        colors: ["#FF4F00", "#10B981", "#FFFFFF"],
      });
    } catch (err: any) {
      setError(err.message || "Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulateReferral() {
    if (!participant || simulating) return;

    setSimulating(true);
    try {
      const result = await apiRequest<DemoSimulateResponse>("/api/v1/waitlist/demo-simulate", {
        method: "POST",
        campaignKey: DEMO_CAMPAIGN_KEY,
        body: JSON.stringify({ referralCode: participant.referralCode }),
      });

      setParticipant((prev) =>
        prev
          ? {
              ...prev,
              position: result.newPosition,
              verifiedReferrals: result.verifiedReferrals,
              totalParticipants: result.totalParticipants,
            }
          : null
      );

      setSpotsJumped(result.spotsJumped);
      setLastLatency(result.redisLatencyMs);

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.65 },
        colors: ["#FF4F00", "#FFD700", "#10B981"],
      });

      setTimeout(() => setSpotsJumped(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to simulate referral.");
    } finally {
      setSimulating(false);
    }
  }

  function copyReferralLink() {
    if (!participant) return;
    navigator.clipboard.writeText(participant.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Decorative Aura Glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500/20 via-emerald-500/10 to-orange-500/20 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

      <div className="bg-[#101015]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400 tracking-wide uppercase">
              Live Redis Cluster Playground
            </span>
          </div>

          {lastLatency !== null && (
            <div className="text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
              <span className="text-emerald-400 font-semibold">{lastLatency}ms</span> latency
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!participant ? (
            /* STEP 1: Enter Email */
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white tracking-tight">
                  Try the Live Viral Waitlist
                </h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  Enter any test email to reserve a spot in the real Redis Sorted Set and test the viral referral mechanics.
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@stealthstartup.com"
                    required
                    className="w-full bg-[#181820] border border-white/10 focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 outline-none transition"
                  />
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-1.5 text-xs text-red-400 pt-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF4F00] hover:bg-[#FF661A] active:scale-[0.99] text-white font-medium text-sm py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="inline-block animate-pulse">Calculating ZSET Rank...</span>
                  ) : (
                    <>
                      <span>Join Live Waitlist</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Anti-bot & temp-mail protected
                </span>
                <span>Sub-10ms O(log N)</span>
              </div>
            </motion.div>
          ) : (
            /* STEP 2: Position Card & Live Simulate Referral */
            <motion.div
              key="position"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Odometer Rank Callout */}
              <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-xl p-5 text-center relative overflow-hidden">
                {spotsJumped !== null && spotsJumped > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-2 right-3 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full"
                  >
                    +{spotsJumped} spots jumped!
                  </motion.div>
                )}

                <div className="text-xs uppercase tracking-widest font-mono text-zinc-400 font-medium">
                  Your Live Queue Position
                </div>

                <div className="my-2">
                  <OdometerNumber
                    value={participant.position}
                    prefix="#"
                    className="text-5xl text-white drop-shadow-md"
                  />
                </div>

                <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-400 pt-2 border-t border-white/5">
                  <span>
                    Total in line: <strong className="text-white">{participant.totalParticipants}</strong>
                  </span>
                  <span>â€¢</span>
                  <span>
                    Verified referrals: <strong className="text-emerald-400">{participant.verifiedReferrals}</strong>
                  </span>
                </div>
              </div>

              {/* Action Button: Simulate Referral */}
              <button
                onClick={handleSimulateReferral}
                disabled={simulating}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-orange-500 to-[#FF4F00] hover:from-orange-400 hover:to-orange-500 text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition shadow-lg shadow-orange-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${simulating ? "animate-spin" : "group-hover:scale-110 transition"}`} />
                <span>{simulating ? "Executing ZINCRBY..." : "Simulate Friend Referral (+Jump Ahead)"}</span>
              </button>

              {/* Referral Link Copy Bar */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Shareable Viral Link:</span>
                  <span className="text-[11px] font-mono text-zinc-500">{participant.referralCode}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#181820] border border-white/10 rounded-xl p-1.5 pr-2">
                  <span className="flex-1 text-xs font-mono text-zinc-400 px-2 truncate">
                    {participant.referralLink}
                  </span>
                  <button
                    onClick={copyReferralLink}
                    className="bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Reset link for demo */}
              <div className="text-center pt-1">
                <button
                  onClick={() => {
                    setParticipant(null);
                    setEmail("");
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition underline underline-offset-4 cursor-pointer"
                >
                  Enter another test email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}