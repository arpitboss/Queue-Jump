"use client";

import { useState } from "react";
import { Terminal, Code, Check, Copy } from "lucide-react";

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"widget" | "rest">("widget");
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- 1. Drop into any HTML or React/Next.js page -->
<div id="queuejump" data-key="pk_live_your_campaign_key"></div>
<script src="https://queuejump.dev/widget.js" async></script>`;

  const restCode = `// 2. Or hit the headless REST API from your custom UI
const response = await fetch("https://api.queuejump.dev/api/v1/waitlist/join", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Campaign-Key": "pk_live_your_campaign_key",
  },
  body: JSON.stringify({
    email: "founder@startup.com",
    referralCode: "optional-friend-code"
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
              <div className="text-xs font-mono uppercase tracking-widest text-orange-400 font-semibold mb-2">
                Implementation
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Live on your site in under two minutes
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Create a Campaign</h4>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    Configure your referral spot bonus (e.g. 24h jump per invite) and grab your public key.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Embed Script or Headless API</h4>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    Drop our isolated Shadow DOM card onto Webflow, Framer, or Next.js, or hit the REST endpoint.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Watch Positions Jump</h4>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    When signups verify their email, their referrers automatically jump spots in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tabbed Code Preview */}
          <div className="lg:col-span-7 bg-[#101015] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Tab Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#15151E] border-b border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("widget")}
                  className={`text-xs font-mono font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === "widget"
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  HTML Embed Tag
                </button>
                <button
                  onClick={() => setActiveTab("rest")}
                  className={`text-xs font-mono font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
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
                className="text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
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