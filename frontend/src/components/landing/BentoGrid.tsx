"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/ui/CodeBlock";

const CANONICAL_SITE_HOST = "queuejump.arpitverma.me";
const CANONICAL_SITE_URL = "https://queuejump.arpitverma.me";

export function BentoGrid() {
  const [refCopied, setRefCopied] = useState(false);

  const handleCopyRefLink = () => {
    navigator.clipboard.writeText(`${CANONICAL_SITE_URL}/waitlist?ref=alex`);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  const embedCode = `<!-- 1. Drop into Framer, Webflow, or Next.js -->
<div id="queuejump-widget" data-campaign="wl_live_9k3mF2x"></div>
<script src="${CANONICAL_SITE_URL}/widget.js" async></script>`;

  const webhookCode = `// Instant webhook payload delivered to your stack
{
  "event": "milestone.unlocked",
  "subscriber": "alex@buildspace.so",
  "milestone": "early_beta_wave_1",
  "rank": 17,
  "referral_count": 5,
  "timestamp": "2026-11-13T12:00:00Z"
}`;

  const codeTabsData = [
    { id: "embed", label: "embed.html", code: embedCode },
    { id: "webhook", label: "webhook.json", code: webhookCode },
  ];

  return (
    <section id="features" className="py-24 md:py-32 bg-white">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-6">

        {/* Section header */}
        <div className="mb-14">
          <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#737373] mb-3 font-medium">
            Features
          </p>
          <h2 className="text-[28px] sm:text-[34px] font-semibold text-[#0A0A0A] tracking-[-0.03em] leading-[1.15]">
            Everything you need to turn signups into referrals
          </h2>
          <p className="text-[14.5px] text-[#737373] mt-2.5 max-w-xl leading-relaxed">
            Live queue jumping, automated milestone rewards, and built-in spam protection for your launch.
          </p>
        </div>

        {/* 
          2-Column Bento Grid:
          Row 1: Equal-height balanced cards (Queue Jumps + Spam Protection)
          Row 2: Full-width Developer & Webhooks Integration Card
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ─── Card 1: Automatic Rank Recalculation ─── */}
          <div className="bg-[#FAFAFA] border border-black/[0.06] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[18px] font-semibold text-[#0A0A0A] tracking-[-0.02em]">
                  Automatic rank recalculation
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-500/[0.08] px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping-calm" />
                  Live Sync
                </span>
              </div>
              <p className="text-[14px] text-[#737373] leading-[1.6] mb-5">
                Spots update the moment a friend joins through someone's unique invite link.
              </p>
            </div>

            {/* Product UI Mock — Leaderboard with Milestone Bar */}
            <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] mt-auto">
              
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-black/[0.05] flex items-center justify-between bg-white">
                <span className="text-[11px] font-mono text-[#8C8C8C] uppercase tracking-wider font-medium">
                  Waitlist Leaderboard
                </span>
                <span className="text-[11px] font-mono text-[#8C8C8C]">
                  142 subscribers
                </span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-black/[0.04]">
                <div className="px-4 py-2.5 flex items-center gap-3 text-[13px]">
                  <span className="font-mono text-[#A1A1A1] w-6 text-right text-[12px]">#15</span>
                  <span className="text-[#525252] flex-1 truncate">sarah@stripe.com</span>
                  <span className="font-mono text-[#A1A1A1] text-[12px]">4 invites</span>
                </div>

                <div className="px-4 py-2.5 flex items-center gap-3 text-[13px]">
                  <span className="font-mono text-[#A1A1A1] w-6 text-right text-[12px]">#16</span>
                  <span className="text-[#525252] flex-1 truncate">david@framer.com</span>
                  <span className="font-mono text-[#A1A1A1] text-[12px]">3 invites</span>
                </div>

                {/* Highlighted active referral leaping row */}
                <div className="px-4 py-2.5 flex items-center gap-3 text-[13px] bg-emerald-500/[0.04] border-l-2 border-emerald-500">
                  <span className="font-mono text-[#0A0A0A] font-semibold w-6 text-right text-[12px]">#17</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[#0A0A0A] font-medium truncate">alex@buildspace.so</span>
                    <span className="text-[10px] font-mono text-[#8C8C8C] bg-black/[0.05] px-1.5 py-0.5 rounded shrink-0">
                      ref_9x2b
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium shrink-0 inline-flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9V3M3.5 5.5 6 3l2.5 2.5" />
                    </svg>
                    +125 spots
                  </span>
                </div>

                <div className="px-4 py-2.5 flex items-center gap-3 text-[13px]">
                  <span className="font-mono text-[#A1A1A1] w-6 text-right text-[12px]">#18</span>
                  <span className="text-[#525252] flex-1 truncate">elena@linear.app</span>
                  <span className="font-mono text-[#A1A1A1] text-[12px]">2 invites</span>
                </div>
              </div>

              {/* Milestone Progress Bar */}
              <div className="px-4 py-2.5 border-t border-black/[0.05] flex items-center justify-between">
                <span className="text-[12.5px] text-[#0A0A0A] font-medium">Early Beta Access</span>
                <span className="text-[11px] font-mono text-emerald-700 font-medium">5 / 5 unlocked ✓</span>
              </div>
              <div className="px-4 pb-3 pt-0">
                <div className="w-full h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                  <div className="h-full w-full bg-emerald-500 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer-sweep" />
                  </div>
                </div>
              </div>

              {/* Referral Link Bar */}
              <div className="px-4 py-2.5 bg-[#F7F7F8] border-t border-black/[0.05] flex items-center justify-between text-[12px]">
                <span className="text-[#737373] font-mono truncate mr-3 text-[11.5px]">
                  {CANONICAL_SITE_HOST}/waitlist?ref=alex
                </span>
                <button
                  type="button"
                  onClick={handleCopyRefLink}
                  className="text-[11px] font-mono font-medium text-[#0A0A0A] bg-white border border-black/[0.09] px-2 py-0.5 rounded cursor-pointer shrink-0 transition-colors hover:bg-[#F7F7F8] active:scale-[0.97]"
                >
                  {refCopied ? "Copied ✓" : "Copy link"}
                </button>
              </div>

            </div>
          </div>

          {/* ─── Card 2: Spam & Fraud Protection ─── */}
          <div className="bg-[#FAFAFA] border border-black/[0.06] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[18px] font-semibold text-[#0A0A0A] tracking-[-0.02em]">
                  Built-in spam protection
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-500/[0.08] px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping-calm" />
                  Active Filter
                </span>
              </div>
              <p className="text-[14px] text-[#737373] leading-[1.6] mb-5">
                Filters disposable domains, alias farming, and scripted bots automatically.
              </p>
            </div>

            {/* Product UI Mock — Validation Log (Matched Height & Structure to Card 1) */}
            <div className="bg-white rounded-xl border border-black/[0.06] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] relative mt-auto">
              
              {/* Laser-Thin Precision Inspection Line */}
              <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent animate-scanner-sweep pointer-events-none z-10" />

              {/* Header */}
              <div className="px-4 py-2.5 border-b border-black/[0.05] flex items-center justify-between bg-white">
                <span className="text-[11px] font-mono text-[#8C8C8C] uppercase tracking-wider font-medium">
                  Validation Log
                </span>
                <span className="text-[11px] font-mono text-[#8C8C8C]">
                  4 rules evaluated
                </span>
              </div>

              {/* 4 Inspection Rows with Authentic Technical Subtitles */}
              <div className="divide-y divide-black/[0.04]">
                {/* Row 1: Disposable domain */}
                <div className="px-4 py-2 flex items-center justify-between gap-3 text-[13px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[12px] text-[#737373] font-mono block truncate line-through decoration-black/25">
                        user@10minutemail.com
                      </span>
                      <span className="text-[10.5px] font-mono text-[#8C8C8C] block">
                        Disposable MX record blocked
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-rose-600 bg-rose-500/[0.08] px-2 py-0.5 rounded font-medium shrink-0">
                    Blocked
                  </span>
                </div>

                {/* Row 2: Gmail alias */}
                <div className="px-4 py-2 flex items-center justify-between gap-3 text-[13px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[12px] text-[#525252] font-mono block truncate">
                        alex+test@gmail.com
                      </span>
                      <span className="text-[10.5px] font-mono text-[#8C8C8C] block">
                        Normalized to canonical inbox
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#737373] bg-black/[0.04] px-2 py-0.5 rounded font-medium shrink-0">
                    Deduplicated
                  </span>
                </div>

                {/* Row 3: Automated bot */}
                <div className="px-4 py-2 flex items-center justify-between gap-3 text-[13px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[12px] text-[#737373] font-mono block truncate">
                        script_bot_94@tor.exit
                      </span>
                      <span className="text-[10.5px] font-mono text-[#8C8C8C] block">
                        Tor exit node · Rate-limited
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#737373] bg-black/[0.04] px-2 py-0.5 rounded font-medium shrink-0">
                    Filtered
                  </span>
                </div>

                {/* Row 4: Authentic subscriber */}
                <div className="px-4 py-2 flex items-center justify-between gap-3 text-[13px] bg-emerald-500/[0.02]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[12px] text-[#0A0A0A] font-mono font-medium block truncate">
                        founder@company.com
                      </span>
                      <span className="text-[10.5px] font-mono text-emerald-700/80 block">
                        DNS MX passed · Spot #17 reserved
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-500/[0.08] px-2 py-0.5 rounded font-medium shrink-0">
                    Verified ✓
                  </span>
                </div>
              </div>

              {/* Protection Status Footer Bar */}
              <div className="px-4 py-2.5 bg-[#F7F7F8] border-t border-black/[0.05] flex items-center justify-between text-[11px] font-mono text-[#737373]">
                <span>List Deliverability</span>
                <span className="text-[#0A0A0A] font-medium">100% Real Inboxes</span>
              </div>

            </div>
          </div>

          {/* ─── Card 3: Developer Integration & Webhooks (Full Width) ─── */}
          <div className="md:col-span-2 bg-[#FAFAFA] border border-black/[0.06] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Clear founder description & compatibility */}
              <div className="lg:col-span-4 space-y-4">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#0A0A0A] tracking-[-0.02em] mb-1.5">
                    Embed anywhere. Trigger webhooks.
                  </h3>
                  <p className="text-[14px] text-[#737373] leading-[1.6]">
                    Drop the widget into Framer, Webflow, or Next.js in 60 seconds. When someone reaches an invite goal, QueueJump dispatches signed payloads to Loops, Resend, or your own server.
                  </p>
                </div>

                {/* Integration Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Next.js", "Framer", "Webflow", "HTML", "Loops", "Resend"].map((name) => (
                    <span
                      key={name}
                      className="text-[11.5px] font-mono text-[#525252] px-2.5 py-1 rounded-md border border-black/[0.08] bg-white shadow-xs"
                    >
                      {name}
                    </span>
                  ))}
                </div>

                {/* Live Webhook Monitor Strip */}
                <div className="p-3 rounded-xl bg-white border border-black/[0.06] space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#8C8C8C]">Live Webhook Dispatch</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping-calm" />
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11.5px] font-mono bg-[#F7F7F8] px-2.5 py-1.5 rounded border border-black/[0.04]">
                    <span className="text-[#0A0A0A] truncate mr-2">
                      POST /api/webhooks/reward
                    </span>
                    <span className="text-emerald-700 font-medium shrink-0">
                      200 OK · 18ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Unified CodeBlock */}
              <div className="lg:col-span-8">
                <CodeBlock tabs={codeTabsData} />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}