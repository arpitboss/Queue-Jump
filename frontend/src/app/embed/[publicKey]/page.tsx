"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Copy, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { OdometerNumber } from "@/components/widget/OdometerNumber";
import { apiRequest } from "@/lib/api";
import { JoinWaitlistResponse } from "@/lib/types";

function EmbedContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const publicKey = (params.publicKey as string) || "";
  const referralCodeParam = searchParams.get("ref");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [participant, setParticipant] = useState<JoinWaitlistResponse | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<JoinWaitlistResponse>("/api/v1/waitlist/join", {
        method: "POST",
        campaignKey: publicKey,
        body: JSON.stringify({
          email: email.trim(),
          referralCode: referralCodeParam,
        }),
      });

      setParticipant(data);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#FF4F00", "#10B981", "#FFFFFF"],
      });
    } catch (err: any) {
      setError(err.message || "Could not reserve spot. Please verify email.");
    } finally {
      setLoading(false);
    }
  }

  function copyReferral() {
    if (!participant) return;
    navigator.clipboard.writeText(participant.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-md bg-[#101016] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Official Waitlist</span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          Reserve Your Priority Spot
        </h2>
        <p className="text-xs text-zinc-400">
          Invite friends to climb the leaderboard and unlock exclusive pre-launch perks.
        </p>
      </div>

      {!participant ? (
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full bg-[#181824] border border-white/10 focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition"
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF4F00] hover:bg-[#FF661A] text-white font-medium text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? "Joining..." : "Join Waitlist"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Verified anti-fraud protection</span>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          {/* Live Rank Callout */}
          <div className="bg-[#161622] border border-white/10 rounded-xl p-5 text-center">
            <div className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
              Your Confirmed Position
            </div>
            <div className="my-2">
              <OdometerNumber
                value={participant.position}
                prefix="#"
                className="text-5xl text-white font-extrabold"
              />
            </div>
            <div className="text-xs font-mono text-zinc-500">
              Total in line: <span className="text-zinc-300">{participant.totalParticipants}</span>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-zinc-300">Share your invite link to jump ahead:</div>
            <div className="flex items-center gap-2 bg-[#181824] border border-white/10 rounded-xl p-1.5 pr-2">
              <span className="flex-1 text-xs font-mono text-zinc-400 px-2 truncate">
                {participant.referralLink}
              </span>
              <button
                onClick={copyReferral}
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Social Sharing Buttons */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I just joined the waitlist! Join here:")}&url=${encodeURIComponent(participant.referralLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#181824] hover:bg-white/10 border border-white/5 rounded-lg text-zinc-300 font-medium transition"
            >
              X (Twitter)
            </a>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join the waitlist with me: ${participant.referralLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#181824] hover:bg-white/10 border border-white/5 rounded-lg text-zinc-300 font-medium transition"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(participant.referralLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#181824] hover:bg-white/10 border border-white/5 rounded-lg text-zinc-300 font-medium transition"
            >
              LinkedIn
            </a>
          </div>
        </div>
      )}

      {/* Footer Credit */}
      <div className="text-center pt-2 border-t border-white/5 text-[11px] text-zinc-600">
        Powered by <a href="/" className="text-zinc-400 hover:underline">QueueJump Engine</a>
      </div>
    </div>
  );
}

export default function StandaloneEmbedPage() {
  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs font-mono text-zinc-500 animate-pulse">Loading waitlist...</div>}>
        <EmbedContent />
      </Suspense>
    </div>
  );
}