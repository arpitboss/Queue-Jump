"use client";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { API_URL } from "@/lib/api";

export function Footer() {
  return (
    <footer className="w-full pt-16 pb-0 border-t border-black/[0.06] bg-white relative overflow-hidden">
      {/* Top Section: Logo & Links */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-12">
          <BrandLogo />

          <div className="flex flex-wrap items-center gap-6 text-[13px] text-[#737373]">
            <a href="https://github.com/arpitboss/Queue-Jump" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A0A0A] transition">
              GitHub
            </a>
            <a href={`${API_URL}/api/docs`} target="_blank" rel="noopener noreferrer" className="hover:text-[#0A0A0A] transition">
              Documentation
            </a>
            <a href="/dashboard" className="hover:text-[#0A0A0A] transition">
              Dashboard
            </a>
            <a href="/login" className="hover:text-[#0A0A0A] transition">
              Sign In
            </a>
            <span className="text-[#A1A1A1] text-xs">
              &copy; 2026 QueueJump
            </span>
          </div>
        </div>
      </div>

      {/* Full-bleed debossed architectural watermark matching Image 5 from vibrant.design */}
      <div className="w-full overflow-hidden select-none pointer-events-none text-center">
        <span className="text-[13vw] font-black tracking-[0.16em] uppercase leading-none block whitespace-nowrap bg-gradient-to-b from-black/[0.055] via-black/[0.02] to-transparent bg-clip-text text-transparent translate-y-[15%]">
          QUEUEJUMP
        </span>
      </div>
    </footer>
  );
}
