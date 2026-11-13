"use client";

import React, { forwardRef } from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  href?: string;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
}

export const BrandLogo = forwardRef<HTMLAnchorElement, BrandLogoProps>(function BrandLogo(
  { className = "", href = "/", onMouseEnter, onMouseLeave, children },
  ref
) {
  const innerContent = (
    <>
      {children}
      {/* Organic fluid pebble droplet mark in brand emerald */}
      <div className="w-[18px] h-[18px] relative flex items-center justify-center shrink-0 z-10">
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          className="transition-transform duration-200 group-hover:scale-105"
        >
          <path
            d="M4 8.5C4 5.5 6.5 3 9.5 3C13.5 3 17 6.5 17 10.5C17 14 14.5 16.5 11 16.5C6.5 16.5 4 12.5 4 8.5Z"
            fill="#10B981"
            fillOpacity="0.25"
            className="transition-colors duration-200 group-hover:fill-opacity-35"
          />
          <path
            d="M3.5 8C3.5 5.5 5.5 3.5 8 3.5"
            stroke="#10B981"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Two-tone typography matching vibrant.design: Queue (bold #0A0A0A) + Jump (lighter #8C8C8C) */}
      <span className="text-[15px] tracking-[-0.015em] leading-none flex items-baseline relative z-10">
        <strong className="font-semibold text-[#0A0A0A]">Queue</strong>
        <span className="font-normal text-[#8C8C8C] ml-0.5 group-hover:text-[#525252] transition-colors duration-150">Jump</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        ref={ref}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`relative inline-flex items-center gap-2 select-none group ${className}`}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative inline-flex items-center gap-2 select-none group ${className}`}
    >
      {innerContent}
    </div>
  );
});