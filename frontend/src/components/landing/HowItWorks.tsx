"use client";

import { useState } from "react";
import { Check, Copy, Code2, Sparkles } from "lucide-react";

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"widget" | "rest">("widget");
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- 1. Paste into any Webflow, Framer, WordPress, or HTML site -->
<div id="queuejump" data-key="pk_live_your_campaign_key"></div>
<script src="https://queuejump.dev/widget.js" async></script>`;

  const restCode = `// 2. Or connect from your custom React / Next.js form
const response = await fetch("https://api.queuejump.dev/api/v1/waitlist/join", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Campaign-Key": "pk_live_your_campaign_key",
  },
  body: JSON.stringify({
    email: "founder@startup.com",
    referralCode: "friend-code-optional"
  }),
});

const { position, referralLink } = await response.json();`;

  const codeToShow = activeTab === "widget" ? embedCode : restCode;

  function copyCode() {
    navigator.clipboard.writeText(codeToShow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section id="how-it-works" className="py-24 border-t border-white/5 bg-[#09090B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: 3 Steps */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-2">
                Quick Integration
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Live on your site in under two minutes
              </h2>
              <p className="text-sm text-zinc-400 mt-2">
                No complex backend infrastructure required. Drop it onto your landing page and start collecting referrals instantly.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF4F00] text-sm font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Create a Campaign</h4>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    Set milestone rewards (e.g. 3 invites = VIP access) and copy your public campaign key.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF4F00] text-sm font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Drop in the 2-Line Snippet</h4>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    Paste our isolated widget onto Webflow, Framer, Next.js, or connect directly via REST API.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#FF4F00] text-sm font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Watch Word-of-Mouth Multiply</h4>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    Subscribers invite colleagues and friends on Twitter, LinkedIn, and group chats to jump the line.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tabbed Code Preview */}
          <div className="lg:col-span-7 bg-[#111116] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Tab Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#16161E] border-b border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("widget")}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === "widget"
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  HTML Embed Tag
                </button>
                <button
                  onClick={() => setActiveTab("rest")}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === "rest"
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Headless REST API
                </button>
              </div>

              <button
                onClick={copyCode}
                className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Code Body */}
            <div className="p-5 font-mono text-xs overflow-x-auto text-zinc-300 leading-relaxed bg-[#0C0C10]">
              <pre>{codeToShow}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
