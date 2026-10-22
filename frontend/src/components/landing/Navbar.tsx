"use client";

import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#09090B]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4F00] to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">QueueJump</span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
          <a href="#playground" className="hover:text-white transition">
            Live Demo
          </a>
          <a href="#features" className="hover:text-white transition">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-white transition">
            How It Works
          </a>
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition flex items-center gap-1"
          >
            <span>API Docs</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-medium text-zinc-400 hover:text-white transition px-3 py-1.5"
          >
            Sign in
          </Link>

          <Link
            href="/dashboard"
            className="text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition px-3.5 py-2 rounded-lg shadow-sm"
          >
            Founder Dashboard &rarr;
          </Link>
        </div>
      </div>
    </header>
  );
}
