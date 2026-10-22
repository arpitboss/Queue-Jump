"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"widget" | "api">("widget");
  const [copied, setCopied] = useState(false);

  const widgetCode = `<!-- Drop in anywhere: Webflow, Framer, Next.js, or HTML -->
<div id="queuejump-waitlist" data-campaign="pk_live_your_key"></div>
<script src="https://queuejump.dev/embed.js" async></script>`;

  const apiCode = `// Or call the REST API from any backend
const res = await fetch("https://api.queuejump.dev/v1/waitlist/join", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Campaign-Key": "pk_live_your_key",
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

          {/* Right: tabbed code block */}
          <div className="lg:col-span-7 bg-[#18181B] text-zinc-200 border border-black/[0.1] rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-[#27272A] border-b border-white/[0.06]">
              <div className="flex gap-1">
                {(["widget", "api"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-medium px-3 py-1 rounded-md transition cursor-pointer ${
                      activeTab === tab ? "bg-white/[0.12] text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {tab === "widget" ? "HTML Embed" : "REST API"}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopy}
                className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-4 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto">
              <pre>{code}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
