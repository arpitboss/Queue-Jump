"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
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
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#10B981", "#0A0A0A", "#71717A"],
      });
    } catch (err: any) {
      setError(err.message || "Unable to reach waitlist server. Please check the backend connection.");
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

      setSpotsJumped(result.spotsJumped);
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

      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.7 },
        colors: ["#10B981", "#0A0A0A"],
      });

      setTimeout(() => setSpotsJumped(null), 3000);
    } catch (err: any) {
      setError(err.message || "Demo simulation failed. Please try again.");
    } finally {
      setSimulating(false);
    }
  }

  function handleCopy() {
    if (!participant) return;
    navigator.clipboard.writeText(participant.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setParticipant(null);
    setEmail("");
    setError(null);
    setSpotsJumped(null);
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden text-left">
      {/* Widget Header */}
      <div className="px-5 py-3 bg-white/70 border-b border-black/[0.05] flex items-center justify-between text-[11.5px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#14804A]" />
          <span className="font-medium text-[#0A0A0A]">Live Widget Preview</span>
        </div>
        <span className="text-[#8C8C8C] font-mono">Demo Mode</span>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {!participant ? (
            <motion.div
              key="join-form"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              <div className="text-center mb-5">
                <h3 className="text-[16px] font-semibold text-[#0A0A0A] mb-1">
                  Join the pre-launch waitlist
                </h3>
                <p className="text-[13px] text-[#737373]">
                  Enter an email to receive your queue spot and invite link.
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    disabled={loading}
                    className="flex-1 bg-white border border-black/[0.09] shadow-inner rounded-xl px-3.5 py-2 text-[13px] text-[#0A0A0A] placeholder-[#A1A1A1] focus:outline-none focus:border-black/40 transition"
                  />
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="btn-vibrant-dark text-[13px] font-medium px-4 py-2 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Joining..." : "Join"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    disabled={loading}
                    className="text-[12px] text-[#0A0A0A] hover:underline font-medium cursor-pointer"
                  >
                    Fill sample email
                  </button>
                  <span className="text-[11.5px] text-[#A1A1A1]">Instant preview</span>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-2.5 rounded-lg bg-red-50 border border-red-200/60 text-red-700 text-xs">
                  {error}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="position-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="space-y-5"
            >
              {/* Position Header - Notice prefix="#" handled cleanly without double hash */}
              <div className="text-center pb-2 border-b border-black/[0.06]">
                <span className="text-[11px] uppercase tracking-wider text-[#737373] font-medium block mb-1">
                  Your Current Spot
                </span>
                <div className="text-4xl font-semibold text-[#0A0A0A] tracking-tight flex items-center justify-center">
                  <OdometerNumber value={participant.position} prefix="#" />
                </div>
                <p className="text-[12px] text-[#737373] mt-1">
                  {participant.totalParticipants - participant.position > 0
                    ? `ahead of ${participant.totalParticipants - participant.position} other ${
                        participant.totalParticipants - participant.position === 1 ? "person" : "people"
                      } in line`
                    : "You are currently in line. Invite friends to jump ahead!"}
                </p>
              </div>

              {/* Jump celebration pill */}
              <AnimatePresence>
                {spotsJumped && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-medium px-3 py-1.5 rounded-lg text-center"
                  >
                    Friend joined! You skipped {spotsJumped} spots ahead.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Invite Link Box */}
              <div>
                <label className="text-[11.5px] text-[#737373] font-medium block mb-1.5">
                  Share your link to move up in line
                </label>
                <div className="flex items-center gap-2 p-1.5 bg-white border border-black/[0.08] shadow-inner rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={participant.referralLink}
                    className="flex-1 bg-transparent px-2 text-[12px] font-mono text-[#0A0A0A] focus:outline-none truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="btn-vibrant-white text-[12px] font-medium px-3 py-1 shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#14804A]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Milestone Tracker */}
              <div className="bg-white/80 border border-black/[0.06] rounded-xl p-3 text-[12px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[#0A0A0A]">Next milestone</span>
                  <span className="text-[#737373] tabular-nums font-mono text-[11.5px]">
                    {participant.verifiedReferrals} / 3 invites
                  </span>
                </div>
                <p className="text-[#737373] text-[11.5px]">
                  Refer 3 friends to unlock Early Beta Access on launch day.
                </p>
              </div>

              {/* Simulation test button - Rich Blue Tactile button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSimulateReferral}
                  disabled={simulating}
                  className="btn-vibrant-primary w-full text-[13.5px] font-medium py-2.5 cursor-pointer disabled:opacity-50"
                >
                  {simulating ? "Simulating referral..." : "Simulate friend signup (+3 spots)"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[12px] text-[#737373] hover:text-[#0A0A0A] transition cursor-pointer"
                  >
                    Try another email
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
