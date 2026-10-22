"use client";

import { useState } from "react";
import { Check, Copy, Terminal, Shield, Zap, ArrowRight } from "lucide-react";
import { LivePlayground } from "./LivePlayground";

export function HeroSection() {
  const [copied, setCopied] = useState(false);
  const embedCode = `<div id="queuejump" data-key="pk_live_your_key"></div>\n<script src="https://queuejump.dev/widget.js"></script>`;

  function copyCode() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-grid-pattern">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-orange-500/15 via-rose-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Product Positioning */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-[#FF4F00] text-xs font-medium">
              <Zap className="w-3.5 h-3.5 fill-[#FF4F00]" />
              <span>O(log N) Redis-Powered Waitlist Engine</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Turn your pre-launch waitlist into a{" "}
              <span className="bg-gradient-to-r from-[#FF4F00] via-orange-400 to-amber-300 bg-clip-text text-transparent">
                viral growth loop
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
              Drop referral-powered queue leaderboards onto any landing page in under 2 minutes. Let users jump ahead in line when they refer friends, verified via atomic state machines and anti-fraud filters.
            </p>

            {/* Script Snippet Box */}
            <div className="space-y-2 pt-2 max-w-xl">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-orange-400" />
                  <span>2-Line Drop-in Embed Tag:</span>
                </span>
                <button
                  onClick={copyCode}
                  className="hover:text-white transition flex items-center gap-1 text-[11px] font-mono cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied!" : "Copy snippet"}</span>
                </button>
              </div>

              <div className="bg-[#101016] border border-white/10 rounded-xl p-3.5 font-mono text-xs text-zinc-300 relative group overflow-x-auto">
                <pre className="text-zinc-400">
                  <span className="text-blue-400">&lt;div</span> <span className="text-amber-300">id=</span><span className="text-emerald-400">&quot;queuejump&quot;</span> <span className="text-amber-300">data-key=</span><span className="text-emerald-400">&quot;pk_live_your_key&quot;</span><span className="text-blue-400">&gt;&lt;/div&gt;</span>{`\n`}
                  <span className="text-blue-400">&lt;script</span> <span className="text-amber-300">src=</span><span className="text-emerald-400">&quot;https://queuejump.dev/widget.js&quot;</span><span className="text-blue-400">&gt;&lt;/script&gt;</span>
                </pre>
              </div>
            </div>

            {/* Proof Points */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 max-w-lg">
              <div>
                <div className="text-xl font-bold font-mono text-white">&lt;10ms</div>
                <div className="text-xs text-zinc-500">ZSET Rank Updates</div>
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-emerald-400">3-Layer</div>
                <div className="text-xs text-zinc-500">Anti-Bot Shield</div>
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-orange-400">100%</div>
                <div className="text-xs text-zinc-500">ACID Attribution</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Playground */}
          <div className="lg:col-span-5" id="playground">
            <LivePlayground />
          </div>
        </div>
      </div>
    </section>
  );
}