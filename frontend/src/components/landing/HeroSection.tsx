"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LivePlayground } from "./LivePlayground";

export function HeroSection() {
  return (
    <section className="pt-16 pb-12 md:pt-22 md:pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Main headline block */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-[12px] font-medium text-[#737373] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14804A]" />
            Waitlist referral engine
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-[44px] font-semibold tracking-[-0.025em] text-[#0A0A0A] leading-[1.16] mb-4">
            Turn waitlist signups
            <br className="hidden sm:inline" /> into referrals.
          </h1>

          <p className="text-[15px] sm:text-[16px] text-[#737373] max-w-lg mx-auto leading-relaxed mb-7 font-normal">
            When someone joins your waitlist, QueueJump gives them a spot in line and an invite link. As friends join through their link, they move up.
          </p>

          {/* Tactile Buttons matching vibrant.design: White tactile button + Rich Blue button */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Link
              href="/dashboard"
              className="btn-vibrant-primary text-[13.5px] font-medium px-5 py-2.5 gap-1.5"
            >
              <span>Create your waitlist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="https://github.com/arpitboss/Queue-Jump"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-vibrant-white text-[13.5px] font-medium px-4 py-2.5 gap-2"
            >
              <svg className="w-4 h-4 fill-current opacity-80" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>

          <p className="text-[12px] text-[#A1A1A1] font-medium tracking-tight">
            Test the live widget below ↓
          </p>
        </div>

        {/* Live Demo Widget inside frosted glass container */}
        <div id="demo" className="max-w-md mx-auto">
          <LivePlayground />
        </div>
      </div>
    </section>
  );
}
