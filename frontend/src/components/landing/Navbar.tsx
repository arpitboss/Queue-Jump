"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { API_URL } from "@/lib/api";

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("queuejump_token") : null;
    setIsLoggedIn(!!token);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full h-[60px] bg-white/80 backdrop-blur-xl border-b border-black/[0.05]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <BrandLogo />

        <nav className="hidden md:flex items-center gap-6 text-[13px] text-[#737373]">
          <a href="#demo" className="hover:text-[#0A0A0A] transition">Interactive Demo</a>
          <a href="#features" className="hover:text-[#0A0A0A] transition">Features</a>
          <a href="#how-it-works" className="hover:text-[#0A0A0A] transition">How It Works</a>
          <a
            href={`${API_URL}/api/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0A0A0A] transition inline-flex items-center gap-1"
          >
            API <ArrowUpRight className="w-3 h-3 opacity-60" />
          </a>
        </nav>

        {/* Dynamic Action row: shows Dashboard when logged in, Log in / Get Started when logged out */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="btn-vibrant-dark text-[13px] font-medium px-4 py-2 inline-flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 opacity-70" />
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3 h-3 opacity-60" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13px] text-[#737373] hover:text-[#0A0A0A] font-medium transition"
              >
                Log in
              </Link>
              <Link
                href="/dashboard"
                className="btn-vibrant-dark text-[13px] font-medium px-4 py-2"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
