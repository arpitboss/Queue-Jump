"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Copy, AlertCircle } from "lucide-react";
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
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#3074FE", "#0A0A0A", "#737373"],
      });
    } catch (err: any) {
      setError(err.message || "Could not reserve spot. Please verify your email.");
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
    <div className="w-full max-w-md bg-white border border-black/[0.08] rounded-xl p-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-5 text-[#0A0A0A]">
      <div className="text-center space-y-1">
        <span className="text-[11px] font-medium text-[#737373] uppercase tracking-wider block">
          Priority Waitlist
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-[#0A0A0A]">
          Reserve your spot
        </h2>
        <p className="text-xs text-[#737373]">
          Invite friends to skip ahead in line.
        </p>
      </div>

      {!participant ? (
        <form onSubmit={handleJoin} className="space-y-3.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            disabled={loading}
            className="w-full bg-[#F7F7F8] border border-black/[0.08] focus:border-[#3074FE] focus:bg-white rounded-lg px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-[#A1A1A1] outline-none transition"
          />

          {error && (
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-[#0A0A0A] hover:bg-neutral-800 disabled:opacity-50 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition shadow-sm cursor-pointer"
          >
            {loading ? "Securing Spot..." : "Get Priority Spot"}
          </button>
        </form>
      ) : (
        <div className="space-y-5 text-center">
          <div className="bg-[#F7F7F8] border border-black/[0.06] rounded-xl p-5">
            <span className="text-[11px] uppercase tracking-wider text-[#737373] block mb-1">
              Your Position
            </span>
            <div className="text-4xl font-semibold text-[#0A0A0A] font-mono tracking-tight flex items-center justify-center gap-1">
              <span>#</span>
              <OdometerNumber value={participant.position} />
            </div>
            <p className="text-xs text-[#737373] mt-1.5">
              ahead of {Math.max(0, participant.totalParticipants - participant.position)} people
            </p>
          </div>

          <div className="text-left space-y-1.5">
            <label className="text-[11.5px] font-medium text-[#737373] block">
              Your Referral Link
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-[#F7F7F8] border border-black/[0.08] rounded-lg">
              <input
                type="text"
                readOnly
                value={participant.referralLink}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-[#0A0A0A] outline-none truncate"
              />
              <button
                onClick={copyReferral}
                className="bg-white hover:bg-neutral-50 text-[#0A0A0A] border border-black/[0.08] text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 inline-flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StandaloneEmbedPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs font-mono text-[#737373]">Loading waitlist widget...</div>}>
        <EmbedContent />
      </Suspense>
    </div>
  );
}
