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
  const themeParam = searchParams.get("theme") || "dark";
  const isDark = themeParam === "dark";

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
          originUrl: typeof window !== "undefined" ? window.location.href.split("?")[0] : undefined,
        }),
      });

      setParticipant(data);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#3074FE", isDark ? "#FFFFFF" : "#0A0A0A", "#737373"],
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
    <div
      className={`w-full max-w-md rounded-2xl p-7 shadow-xl space-y-5 transition-colors duration-200 ${
        isDark
          ? "bg-[#0E0E12] border border-white/[0.08] text-white shadow-black/40"
          : "bg-white border border-black/[0.08] text-[#0A0A0A] shadow-black/5"
      }`}
    >
      <div className="text-center space-y-1">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider block ${
            isDark ? "text-[#3074FE]" : "text-[#737373]"
          }`}
        >
          Priority Waitlist
        </span>
        <h2 className="text-xl font-bold tracking-tight">Reserve your spot</h2>
        <p className={`text-xs ${isDark ? "text-[#8E8EA0]" : "text-[#737373]"}`}>
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
            className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition ${
              isDark
                ? "bg-[#181822] border border-white/10 text-white placeholder-[#71717A] focus:border-[#3074FE] focus:bg-[#1C1C28]"
                : "bg-[#F7F7F8] border border-black/[0.08] text-[#0A0A0A] placeholder-[#A1A1A1] focus:border-[#3074FE] focus:bg-white"
            }`}
          />

          {error && (
            <div className="p-2.5 text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-[#3074FE] hover:bg-[#2365EC] disabled:opacity-50 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition shadow-sm cursor-pointer"
          >
            {loading ? "Securing Spot..." : "Get Priority Spot →"}
          </button>
        </form>
      ) : (
        <div className="space-y-5 text-center">
          <div
            className={`border rounded-xl p-5 ${
              isDark ? "bg-[#14141B] border-white/[0.08]" : "bg-[#F7F7F8] border-black/[0.06]"
            }`}
          >
            <span
              className={`text-[11px] uppercase tracking-wider block mb-1 ${
                isDark ? "text-[#8E8EA0]" : "text-[#737373]"
              }`}
            >
              Your Position
            </span>
            <div className="text-4xl font-extrabold font-mono tracking-tight flex items-center justify-center">
              <OdometerNumber value={participant.position} prefix="#" />
            </div>
            <p className={`text-xs mt-1.5 ${isDark ? "text-[#8E8EA0]" : "text-[#737373]"}`}>
              ahead of {Math.max(0, participant.totalParticipants - participant.position)} people
            </p>
          </div>

          <div className="text-left space-y-1.5">
            <label
              className={`text-[11.5px] font-medium block ${
                isDark ? "text-[#8E8EA0]" : "text-[#737373]"
              }`}
            >
              Your Unique Invite Link
            </label>
            <div
              className={`flex items-center gap-2 p-1.5 border rounded-lg ${
                isDark ? "bg-[#16161D] border-white/10" : "bg-[#F7F7F8] border-black/[0.08]"
              }`}
            >
              <input
                type="text"
                readOnly
                value={participant.referralLink}
                className={`flex-1 bg-transparent px-2 text-xs font-mono outline-none truncate ${
                  isDark ? "text-zinc-200" : "text-[#0A0A0A]"
                }`}
              />
              <button
                onClick={copyReferral}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 inline-flex items-center gap-1 cursor-pointer ${
                  isDark
                    ? "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    : "bg-white hover:bg-neutral-50 text-[#0A0A0A] border border-black/[0.08]"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmbedWrapper() {
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme") || "dark";
  const isDark = themeParam === "dark";

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
        isDark ? "bg-[#09090B]" : "bg-[#F7F7F8]"
      }`}
    >
      <EmbedContent />
    </div>
  );
}

export default function StandaloneEmbedPage() {
  return (
    <Suspense fallback={<div className="text-xs font-mono text-[#737373] p-10 text-center">Loading waitlist widget...</div>}>
      <EmbedWrapper />
    </Suspense>
  );
}
