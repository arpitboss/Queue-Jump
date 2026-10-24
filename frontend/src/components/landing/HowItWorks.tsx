"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { API_URL } from "@/lib/api";

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"widget" | "api">("widget");
  const [copied, setCopied] = useState(false);

  const widgetCode = `<!-- Drop in anywhere: Webflow, Framer, Next.js, or HTML -->
<div id="queuejump" data-key="pk_live_your_campaign_key" data-theme="dark"></div>
<script src="${API_URL}/widget.js" async></script>`;

  const apiCode = `// Or submit from your custom form or mobile app
const res = await fetch("${API_URL}/api/v1/waitlist/join", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Campaign-Key": "pk_live_your_campaign_key",
  },
  body: JSON.stringify({
    email: "subscriber@company.com",
    referralCode: "friend-code", // optional
  }),
});

const { position, referralLink } = await res.json();`;

  const code = activeTab === "widget" ? widgetCode : apiCode;

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section id="how-it-works" className="py-20 md:py-24 border-t border-black/[0.06] bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: steps */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#737373] mb-2">
                Setup
              </p>
              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#0A0A0A] mb-2">
                Up and running in 3 steps
              </h2>
              <p className="text-[14px] text-[#737373] leading-relaxed">
                No complex infrastructure. Create your campaign, embed two lines of code, and start collecting signups.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  n: "1",
                  title: "Create your campaign",
                  desc: "Set your waitlist name and milestone rewards in the dashboard.",
                },
                {
                  n: "2",
                  title: "Add the embed or call the API",
                  desc: "Drop two lines of HTML on your landing page, or use our headless endpoints.",
                },
                {
                  n: "3",
                  title: "Subscribers share automatically",
                  desc: "New signups get their personal invite link immediately and begin sharing.",
                },
              ].map((step) => (
                <div key={step.n} className="flex gap-3">
                  <span className="text-[12px] font-mono font-semibold text-[#737373] mt-0.5 shrink-0 w-5">
                    0{step.n}
                  </span>
                  <div>
                    <h4 className="text-[14px] font-semibold text-[#0A0A0A]">{step.title}</h4>
                    <p className="text-[12.5px] text-[#737373] mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tabbed IDE code block matching user reference */}
          <div className="lg:col-span-7 bg-[#121215] text-zinc-200 border border-white/[0.09] rounded-2xl overflow-hidden shadow-xl">
            {/* Top Editor Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181D] border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/40 border border-[#EF4444]/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/40 border border-[#F59E0B]/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/40 border border-[#10B981]/60" />
                </div>
                <div className="flex gap-1 bg-black/25 p-0.5 rounded-lg border border-white/[0.06]">
                  {(["widget", "api"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-[11.5px] font-mono px-2.5 py-1 rounded-md transition cursor-pointer ${
                        activeTab === tab
                          ? "bg-white/[0.12] text-white shadow-xs font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {tab === "widget" ? "embed.html" : "fetch_api.js"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clearly visible, tactile Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11.5px] font-medium transition cursor-pointer border border-white/10 shadow-xs active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body with Line Numbers */}
            <div className="p-4 font-mono text-[12px] text-zinc-300 leading-relaxed overflow-x-auto flex gap-3.5 select-text">
              <div className="select-none text-zinc-600 text-right pr-2.5 border-r border-white/[0.08] font-mono shrink-0">
                {code.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <div className="overflow-x-auto whitespace-pre font-mono text-zinc-200">
                <pre>{code}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
