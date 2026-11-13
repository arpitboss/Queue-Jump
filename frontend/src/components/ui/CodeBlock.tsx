"use client";

import { useState } from "react";

export interface CodeTab {
  id: string;
  label: string;
  code: string;
  language?: string;
}

interface CodeBlockProps {
  tabs: CodeTab[];
  className?: string;
}

export function CodeBlock({ tabs, className = "" }: CodeBlockProps) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const lines = (activeTab?.code ?? "").trim().split("\n");

  const handleCopy = () => {
    if (!activeTab) return;
    navigator.clipboard.writeText(activeTab.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-[#121215] text-zinc-200 border border-white/[0.09] rounded-xl overflow-hidden shadow-xl selection:bg-white/25 selection:text-white ${className}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181D] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {/* macOS dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/50 border border-[#EF4444]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/50 border border-[#F59E0B]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/50 border border-[#10B981]/70" />
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 bg-black/25 p-0.5 rounded-lg border border-white/[0.06]">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab?.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setCopied(false);
                  }}
                  className={`text-[12px] font-mono px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/[0.12] text-white font-medium shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Copy button — inline SVGs instead of Lucide */}
        <button
          type="button"
          onClick={handleCopy}
          className="text-[12px] font-sans font-medium text-zinc-300 hover:text-white px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all cursor-pointer inline-flex items-center gap-1.5"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto font-mono text-[12.5px] leading-relaxed flex">
        {/* Line numbers */}
        <div className="pr-3.5 mr-3.5 text-zinc-600 select-none text-right border-r border-white/[0.06] flex flex-col shrink-0 font-mono">
          {lines.map((_, i) => (
            <span key={i} className="leading-relaxed">
              {i + 1}
            </span>
          ))}
        </div>

        {/* Code */}
        <pre className="text-zinc-300 font-mono leading-relaxed whitespace-pre overflow-x-auto flex-1">
          <code>{activeTab?.code}</code>
        </pre>
      </div>
    </div>
  );
}
