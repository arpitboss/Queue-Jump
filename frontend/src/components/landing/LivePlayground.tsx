"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, Copy, Share2, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Gift } from "lucide-react";
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
  const [spotsJumped, setSpotsJumped] = useState<number | null>(null);

  async function joinWithEmail(targetEmail: string) {
    if (!targetEmail.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<JoinWaitlistResponse>("/api/v1/waitlist/join", {
        method: "POST",
        campaignKey: DEMO_CAMPAIGN_KEY,
        body: JSON.stringify({ email: targetEmail.trim() }),
      });

      setParticipant(data);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.75 },
        colors: ["#FF4F00", "#10B981", "#FFFFFF"],
      });
    } catch (err: any) {
      setError(err.message || "Unable to reach waitlist server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    await joinWithEmail(email);
  }

  function handleQuickDemo() {
    const demoEmail = `founder_${Math.floor(1000 + Math.random() * 9000)}@startup.com`;
    setEmail(demoEmail);
    joinWithEmail(demoEmail);
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

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.65 },
        colors: ["#FF4F00", "#FFD700", "#10B981"],
      });

      setTimeout(() => setSpotsJumped(null), 3500);
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

  function shareToTwitter() {
    if (!participant) return;
    const text = encodeURIComponent(`Just joined the waitlist for QueueJump! Use my invite link to skip the line: ${participant.referralLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Subtle Ambient Glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-orange-500/20 blur-xl opacity-75 pointer-events-none -z-10" />

      <div className="bg-[#111116] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400 tracking-wide">
              Live Subscriber Experience
            </span>
          </div>

          <span className="text-[11px] text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
            Interactive Preview
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!participant ? (
            /* STEP 1: Enter Email or Quick Demo */
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white tracking-tight">
                  See how visitors experience your waitlist
                </h3>
                <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                  Subscribers get an instant queue number and a personalized link to invite friends and skip the line.
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF4F00] hover:bg-[#FF661A] active:scale-[0.99] text-white font-medium text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span className="inline-block animate-pulse">Reserving spot...</span>
                    ) : (
                      <>
                        <span>Join Waitlist</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    disabled={loading}
                    className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-medium text-sm py-3 px-4 rounded-xl border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Try 1-Click Demo</span>
                  </button>
                </div>
              </form>

              <div className="mt-5 flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Spam & disposable emails blocked
                </span>
                <span>Instant referral links</span>
              </div>
            </motion.div>
          ) : (
            /* STEP 2: Position Card & Live Simulate Referral */
            <motion.div
              key="position"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Confirmed Ticket Header */}
              <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-xl p-5 text-center relative overflow-hidden">
                {spotsJumped !== null && spotsJumped > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-3 right-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full"
                  >
                    +{spotsJumped} spots jumped!
                  </motion.div>
                )}

                <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                  Your Current Queue Position
                </div>

                <div className="my-2.5">
                  <OdometerNumber
                    value={participant.position}
                    prefix="#"
                    className="text-5xl text-white font-bold drop-shadow-md"
                  />
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-zinc-400 pt-2 border-t border-white/5">
                  <span>
                    Total in line: <strong className="text-white">{participant.totalParticipants}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Invited friends: <strong className="text-emerald-400">{participant.verifiedReferrals}</strong>
                  </span>
                </div>
              </div>

              {/* Milestone Callout */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF4F00] flex items-center justify-center text-white shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="text-xs leading-snug">
                  <span className="text-white font-semibold">Next reward: </span>
                  <span className="text-orange-200">
                    {participant.nextMilestone?.reward || "Early Access Beta"}
                  </span>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Share your invite link below to move up in line faster.
                  </p>
                </div>
              </div>

              {/* Action Button: Simulate Referral */}
              <button
                onClick={handleSimulateReferral}
                disabled={simulating}
                className="w-full bg-[#FF4F00] hover:bg-[#FF661A] text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition shadow-lg shadow-orange-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${simulating ? "animate-spin" : ""}`} />
                <span>{simulating ? "Simulating referral..." : "Simulate Friend Invite (+Skip Ahead)"}</span>
              </button>

              {/* Referral Link Sharing */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Your Personal Referral Link:</span>
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
                  <button
                    onClick={shareToTwitter}
                    title="Share on X"
                    className="bg-[#1D9BF0]/15 hover:bg-[#1D9BF0]/25 text-[#1D9BF0] p-1.5 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
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
                  Test with a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
