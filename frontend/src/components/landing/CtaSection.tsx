"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { API_URL } from "@/lib/api";

export function CtaSection() {
  return (
    <section className="py-20 border-t border-black/[0.06] bg-[#F7F7F8]">
      <div className="max-w-xl mx-auto px-4 text-center">
        <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#0A0A0A] mb-3">
          Start collecting referrals before launch.
        </h2>
        <p className="text-[14px] text-[#737373] mb-7 max-w-md mx-auto leading-relaxed">
          Set up a campaign in under 5 minutes and give your earliest supporters a reason to spread the word.
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-[#0A0A0A] hover:bg-neutral-800 text-white text-[13px] font-medium px-4 py-2 rounded-full transition shadow-sm"
          >
            Create a waitlist <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href={`${API_URL}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-[#EFEFEF] text-[#0A0A0A] border border-black/[0.08] text-[13px] font-medium px-4 py-2 rounded-full transition"
          >
            API Documentation
          </a>
        </div>
      </div>
    </section>
  );
}
