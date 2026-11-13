"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { API_URL } from "@/lib/api";

const NAV_ITEMS = [
  { id: "demo", label: "Interactive Demo", href: "#demo" },
  { id: "features", label: "Features", href: "#features" },
  { id: "how-it-works", label: "How It Works", href: "#how-it-works" },
  { id: "docs", label: "API Docs", href: `${API_URL}/api/docs`, external: true },
];

/**
 * Precision mechanical vertical reel for a single digit (0-9).
 * Rolls smoothly like a mouse scroll wheel / mechanical odometer drum.
 * Completely immune to text collisions because each digit is in its own isolated slot.
 */
function ScrollWheelDigit({ digit }: { digit: string }) {
  const num = parseInt(digit, 10);
  if (isNaN(num)) {
    return <span className="inline-block text-[9.5px] font-mono leading-none">{digit}</span>;
  }
  return (
    <span className="relative inline-block h-[13px] w-[6px] overflow-hidden align-middle">
      <motion.span
        className="absolute left-0 top-0 flex flex-col text-center w-full"
        animate={{ y: -num * 13 }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 26,
          mass: 0.45,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="h-[13px] leading-[13px] text-[9.5px] font-mono font-medium tabular-nums text-center block text-white"
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Scrolling rolling number ticker for width values (e.g. 122 -> 72).
 * Digits roll vertically like a mouse scroll wheel, and hundreds column smoothly expands/collapses.
 */
function RollingWidth({ value }: { value: number }) {
  const rounded = Math.max(10, Math.round(value));
  const hundreds = Math.floor(rounded / 100);
  const tens = Math.floor((rounded % 100) / 10);
  const units = rounded % 10;
  const hasHundreds = rounded >= 100;

  return (
    <span className="inline-flex items-center tabular-nums">
      {/* Hundreds column (smooth width expand/collapse without popLayout jumble) */}
      <motion.span
        animate={{
          width: hasHundreds ? 6 : 0,
          opacity: hasHundreds ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 28,
        }}
        className="inline-block overflow-hidden"
      >
        <ScrollWheelDigit digit={hundreds.toString()} />
      </motion.span>

      {/* Tens column (always present) */}
      <ScrollWheelDigit digit={tens.toString()} />

      {/* Units column (always present) */}
      <ScrollWheelDigit digit={units.toString()} />
    </span>
  );
}

/**
 * Scrolling rolling number ticker for height values (e.g. 30 -> 32).
 */
function RollingHeight({ value }: { value: number }) {
  const rounded = Math.max(10, Math.round(value));
  const tens = Math.floor(rounded / 10);
  const units = rounded % 10;

  return (
    <span className="inline-flex items-center tabular-nums">
      <ScrollWheelDigit digit={tens.toString()} />
      <ScrollWheelDigit digit={units.toString()} />
    </span>
  );
}

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Single floating box state (zero layout thrashing, 120 FPS spring gliding)
  const [box, setBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    w: 120,
    h: 30,
    visible: false,
  });

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("queuejump_token") : null;
    setIsLoggedIn(!!token);
  }, []);

  const handleHover = useCallback((el: HTMLElement | null) => {
    if (!el || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    setBox({
      x: elRect.left - containerRect.left,
      y: elRect.top - containerRect.top,
      w: elRect.width,
      h: elRect.height,
      visible: true,
    });
    setHasInitialized(true);
  }, []);

  const handleLeave = useCallback(() => {
    setBox((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full h-[60px] bg-white/90 backdrop-blur-xl border-b border-black/[0.06] transition-all"
      onMouseLeave={handleLeave}
    >
      <div
        ref={containerRef}
        className="max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between relative"
      >
        {/* ─── SINGLE BUTTER-SMOOTH FLOATING VECTOR INSPECTOR ─── */}
        <motion.div
          initial={false}
          animate={{
            x: box.x,
            y: box.y,
            width: box.w,
            height: box.h,
            opacity: box.visible ? 1 : 0,
            scale: box.visible ? 1 : 0.98,
          }}
          transition={
            hasInitialized
              ? {
                  x: { type: "spring", stiffness: 450, damping: 32, mass: 0.5 },
                  y: { type: "spring", stiffness: 450, damping: 32, mass: 0.5 },
                  width: { type: "spring", stiffness: 450, damping: 32, mass: 0.5 },
                  height: { type: "spring", stiffness: 450, damping: 32, mass: 0.5 },
                  opacity: { duration: 0.12 },
                  scale: { duration: 0.12 },
                }
              : { duration: 0 }
          }
          className="absolute top-0 left-0 pointer-events-none z-10"
          style={{
            display: box.visible || box.x !== 0 ? "block" : "none",
          }}
        >
          {/* Hairline Vector Outline & Soft Vector Wash */}
          <div className="absolute inset-0 border border-[#2563EB] bg-[#2563EB]/[0.035] rounded-[2px]" />

          {/* 4 Precision Corner Handles with subtle shadow */}
          <span className="absolute -top-[3px] -left-[3px] w-[5px] h-[5px] bg-white border border-[#2563EB] shadow-[0_0.5px_1px_rgba(37,99,235,0.25)] pointer-events-none" />
          <span className="absolute -top-[3px] -right-[3px] w-[5px] h-[5px] bg-white border border-[#2563EB] shadow-[0_0.5px_1px_rgba(37,99,235,0.25)] pointer-events-none" />
          <span className="absolute -bottom-[3px] -left-[3px] w-[5px] h-[5px] bg-white border border-[#2563EB] shadow-[0_0.5px_1px_rgba(37,99,235,0.25)] pointer-events-none" />
          <span className="absolute -bottom-[3px] -right-[3px] w-[5px] h-[5px] bg-white border border-[#2563EB] shadow-[0_0.5px_1px_rgba(37,99,235,0.25)] pointer-events-none" />

          {/* Dynamic Dimension Tag with Smooth Mouse-Scroll Rolling Numbers */}
          <div className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-[9.5px] font-mono px-1.5 py-[1.5px] rounded-[2.5px] leading-none whitespace-nowrap shadow-[0_1px_3px_rgba(37,99,235,0.35)] flex items-center justify-center pointer-events-none z-20 select-none">
            <RollingWidth value={box.w} />
            <span className="text-[8px] font-mono text-white/70 mx-[2px] leading-none select-none">×</span>
            <RollingHeight value={box.h} />
          </div>
        </motion.div>

        {/* ─── BRAND LOGO (Inspectable) ─── */}
        <div className="flex items-center">
          <BrandLogo
            onMouseEnter={(e) => handleHover(e.currentTarget as HTMLElement)}
            className="px-2.5 py-1.5 rounded-[2px] transition-colors"
          />
        </div>

        {/* ─── NAVIGATION LINKS (Inspectable) ─── */}
        <nav className="hidden md:flex items-center gap-1 relative py-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              onMouseEnter={(e) => handleHover(e.currentTarget)}
              className="group relative px-3 py-1.5 text-[13.5px] font-medium text-[#525252] hover:text-[#0A0A0A] transition-colors duration-150 inline-flex items-center gap-1.5 select-none rounded-[2px]"
            >
              <span className="relative z-10">{item.label}</span>
              {item.external && (
                <svg
                  className="relative z-10 w-3 h-3 text-[#737373] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.5 8.5L8.5 3.5" />
                  <path d="M4 3.5H8.5V8" />
                </svg>
              )}
            </a>
          ))}
        </nav>

        {/* ─── AUTH / CTA ROW ─── */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="btn-vibrant-dark text-[13px] font-medium px-4 py-2 inline-flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 opacity-80"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="9" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="9" width="5" height="5" rx="1" />
                <rect x="9" y="9" width="5" height="5" rx="1" />
              </svg>
              <span>Dashboard</span>
              <svg
                className="w-3 h-3 opacity-60"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 6h7M6.5 3l3 3-3 3" />
              </svg>
            </Link>
          ) : (
            <>
              {/* Log in (Inspectable) */}
              <Link
                href="/login"
                onMouseEnter={(e) => handleHover(e.currentTarget)}
                className="group relative px-2.5 py-1.5 text-[13px] text-[#666666] hover:text-[#0A0A0A] font-medium transition-colors select-none inline-flex items-center rounded-[2px]"
              >
                <span className="relative z-10">Log in</span>
              </Link>

              <Link
                href="/dashboard"
                className="btn-vibrant-dark text-[13px] font-medium px-4 py-2 inline-flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <svg
                  className="w-3 h-3 opacity-60"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" />
                </svg>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}