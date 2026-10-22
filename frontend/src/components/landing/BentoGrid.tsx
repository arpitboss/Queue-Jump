"use client";

import { Check } from "lucide-react";

export function BentoGrid() {
  return (
    <section id="features" className="py-20 md:py-24 border-t border-black/[0.06] bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section title */}
        <div className="max-w-xl mb-12">
          <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#737373] mb-2">
            Features
          </p>
          <h2 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.015em] text-[#0A0A0A] mb-2.5">
            Everything you need to turn signups into referrals
          </h2>
          <p className="text-[14.5px] text-[#737373] leading-relaxed">
            A waitlist that encourages people to invite their friends, with automatic position updates and built-in spam protection.
          </p>
        </div>

        {/* 3-card bento grid with frosted styling */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Card 1: Referral Queue Jumping (7 cols) */}
          <div className="md:col-span-7 bg-[#FAFAFA]/90 backdrop-blur-md border border-black/[0.06] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-black/[0.12] transition-colors">
            <div className="mb-6">
              <span className="text-[11px] font-medium text-[#737373] uppercase tracking-wider block mb-2">
                Live positions
              </span>
              <h3 className="text-[17px] font-semibold text-[#0A0A0A] mb-2 leading-snug">
                Subscribers move up when friends join through their link
              </h3>
              <p className="text-[13.5px] text-[#737373] leading-relaxed">
                When someone refers a friend, their rank recalculates instantly. Set rewards for hitting referral milestones to keep people motivated.
              </p>
            </div>

            {/* Illustrative milestone ladder - clean font-sans typography */}
            <div className="space-y-2 bg-white border border-black/[0.06] rounded-xl p-3.5 text-xs shadow-sm">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60">
                <span className="text-emerald-800 font-medium">3 invites</span>
                <span className="text-emerald-900 font-medium inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-700" /> Early access unlocked
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F8] border border-black/[0.04]">
                <span className="text-[#737373]">5 invites</span>
                <span className="text-[#0A0A0A] font-medium">Pro plan — 6 months free</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F8] border border-black/[0.04] opacity-50">
                <span className="text-[#A1A1A1]">10 invites</span>
                <span className="text-[#737373]">Founding member badge</span>
              </div>
            </div>
          </div>

          {/* Card 2: Spam & Duplicate Protection (5 cols) */}
          <div className="md:col-span-5 bg-[#FAFAFA]/90 backdrop-blur-md border border-black/[0.06] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-black/[0.12] transition-colors">
            <div className="mb-6">
              <span className="text-[11px] font-medium text-[#737373] uppercase tracking-wider block mb-2">
                Spam protection
              </span>
              <h3 className="text-[17px] font-semibold text-[#0A0A0A] mb-2 leading-snug">
                Keep fake emails and bots off your list
              </h3>
              <p className="text-[13.5px] text-[#737373] leading-relaxed">
                Every signup is checked automatically so you launch to real people instead of throwaway inboxes.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { title: "Disposable email domains", detail: "Blocks 10-minute mail and temp services" },
                { title: "Gmail alias deduplication", detail: "Merges user+tag variations into one person" },
                { title: "IP velocity limits", detail: "Prevents automated scripts and self-referrals" },
              ].map((item) => (
                <div key={item.title} className="p-2.5 bg-white border border-black/[0.06] rounded-xl shadow-xs">
                  <div className="font-medium text-[#0A0A0A]">{item.title}</div>
                  <div className="text-[11.5px] text-[#737373] mt-0.5">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Webhooks & Automations (full width) */}
          <div className="md:col-span-12 bg-[#FAFAFA]/90 backdrop-blur-md border border-black/[0.06] rounded-2xl p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-black/[0.12] transition-colors">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-6">
                <span className="text-[11px] font-medium text-[#737373] uppercase tracking-wider block mb-2">
                  Integrations
                </span>
                <h3 className="text-[17px] font-semibold text-[#0A0A0A] mb-2 leading-snug">
                  Webhooks that trigger rewards automatically
                </h3>
                <p className="text-[13.5px] text-[#737373] leading-relaxed">
                  Send an event to your email tool (Loops, Resend, Customer.io) or internal API whenever someone unlocks a reward tier.
                </p>
              </div>

              <div className="lg:col-span-6 grid grid-cols-3 gap-2.5 text-center">
                {[
                  { step: "1", title: "Friend signs up", sub: "Via referral link" },
                  { step: "2", title: "Rank updates", sub: "Subscriber moves up" },
                  { step: "3", title: "Webhook fires", sub: "Reward granted" },
                ].map((item) => (
                  <div key={item.step} className="p-3 bg-white border border-black/[0.06] rounded-xl shadow-xs">
                    <span className="text-[10px] uppercase font-semibold text-[#A1A1A1] block mb-1">Step {item.step}</span>
                    <span className="text-[12px] font-medium text-[#0A0A0A] block">{item.title}</span>
                    <span className="text-[11px] text-[#737373] mt-0.5 block">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
