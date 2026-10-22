"use client";

import { Users, ShieldCheck, Webhook, Zap, Gift, Check, ArrowRight, Sparkles } from "lucide-react";

export function BentoGrid() {
  return (
    <section id="features" className="py-20 md:py-28 border-t border-white/5 bg-[#09090B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for High-Growth Launches</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Everything you need for a viral launch
          </h2>
          <p className="text-base text-zinc-400">
            Replicate the iconic viral waitlist loops of Robinhood and Superhuman with zero infrastructure headache.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Gamified Queue Jumping (7 cols) */}
          <div className="md:col-span-7 bg-[#111116] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition duration-300">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF4F00]">
                <Zap className="w-5 h-5 fill-[#FF4F00]" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Gamified Line-Jumping That Users Actually Share
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Standard &quot;We&apos;ll be in touch&quot; forms have a 0% viral rate. QueueJump gives subscribers a real queue position and lets them skip 100+ spots for every friend they bring.
              </p>
            </div>

            {/* Visual Milestone Progression */}
            <div className="mt-8 space-y-3 bg-[#16161E] border border-white/5 rounded-xl p-5">
              <div className="text-xs font-medium text-zinc-400 flex items-center justify-between pb-1">
                <span>Subscriber Milestone Ladder:</span>
                <span className="text-emerald-400 font-semibold">2 of 3 Invites Completed</span>
              </div>

              {/* Step 1 */}
              <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-lg text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-zinc-300 font-medium">1 Friend Invited</span>
                </div>
                <span className="text-emerald-400 font-medium">+50 Spots Jumped</span>
              </div>

              {/* Step 2 */}
              <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#FF4F00] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                    2
                  </div>
                  <span className="text-white font-semibold">3 Friends Invited</span>
                </div>
                <span className="text-orange-400 font-semibold">Priority Beta Access (1 Left!)</span>
              </div>

              {/* Step 3 */}
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs opacity-60">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 text-zinc-400 flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </div>
                  <span className="text-zinc-400">5 Friends Invited</span>
                </div>
                <span className="text-zinc-500 font-mono">6 Months Pro Free</span>
              </div>
            </div>
          </div>

          {/* Card 2: Smart Bot & Spam Shield (5 cols) */}
          <div className="md:col-span-5 bg-[#111116] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between group hover:border-white/20 transition duration-300">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Authentic, Spam-Free Waitlists
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Referral systems attract spammers and fake emails. Our automated shield filters bad actors in real time so your list stays genuine and investor-ready.
              </p>
            </div>

            {/* Clean Feature Pills */}
            <div className="mt-8 space-y-3">
              <div className="p-3 bg-[#16161E] border border-white/5 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="text-xs">
                  <strong className="text-white block font-medium">Disposable Email Blocker</strong>
                  <span className="text-zinc-400 text-[11px]">Stops 10-minute mail & temporary inboxes</span>
                </div>
              </div>

              <div className="p-3 bg-[#16161E] border border-white/5 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="text-xs">
                  <strong className="text-white block font-medium">Alias & Dot Normalization</strong>
                  <span className="text-zinc-400 text-[11px]">Prevents self-referrals with +tag tricks</span>
                </div>
              </div>

              <div className="p-3 bg-[#16161E] border border-white/5 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="text-xs">
                  <strong className="text-white block font-medium">Rate-Limit Protection</strong>
                  <span className="text-zinc-400 text-[11px]">Blocks automated bot scripts and IP spam</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Instant Automations & Webhooks (12 cols) */}
          <div className="md:col-span-12 bg-[#111116] border border-white/10 rounded-2xl p-6 sm:p-8 group hover:border-white/20 transition duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Webhook className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Automate Rewards with Signed Webhooks
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Trigger automated welcome flows in Resend, Loops, or your backend whenever subscribers reach milestones or climb the top 100 leaderboard.
                </p>
              </div>

              {/* Workflow Pipeline */}
              <div className="lg:col-span-7 bg-[#16161E] border border-white/5 rounded-xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">1. Trigger</div>
                    <div className="text-xs font-bold text-white">Friend Joins Link</div>
                    <div className="text-[11px] text-emerald-400">Email Verified</div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">2. Queue Jump</div>
                    <div className="text-xs font-bold text-white">Ranks Advance</div>
                    <div className="text-[11px] text-orange-400">+50 Spots Ahead</div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">3. Delivery</div>
                    <div className="text-xs font-bold text-white">Webhook Sent</div>
                    <div className="text-[11px] text-purple-400">Invite Code Emailed</div>
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
