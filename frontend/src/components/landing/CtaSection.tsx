"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-20 md:py-24 border-t border-white/5 bg-[#09090B] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-500/10 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-[#FF4F00] flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
          <Zap className="w-6 h-6 fill-[#FF4F00]" />
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Ready to launch your viral waitlist?
        </h2>

        <p className="text-base text-zinc-400 max-w-xl mx-auto">
          Start turning your pre-launch traffic into a self-sustaining viral loop in under two minutes.
        </p>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-[#FF4F00] hover:bg-[#FF661A] text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition shadow-xl shadow-orange-500/25 active:scale-[0.98]"
          >
            <span>Open Founder Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
