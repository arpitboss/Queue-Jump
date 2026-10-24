"use client";

import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  href?: string;
}

export function BrandLogo({ className = "", href = "/" }: BrandLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2 select-none group ${className}`}>
      {/* Organic fluid pebble droplet mark in soft electric blue */}
      <div className="w-[18px] h-[18px] relative flex items-center justify-center shrink-0">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 8.5C4 5.5 6.5 3 9.5 3C13.5 3 17 6.5 17 10.5C17 14 14.5 16.5 11 16.5C6.5 16.5 4 12.5 4 8.5Z"
            fill="#10B981"
            fillOpacity="0.25"
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
      <span className="text-[15px] tracking-[-0.015em] leading-none flex items-baseline">
        <strong className="font-semibold text-[#0A0A0A]">Queue</strong>
        <span className="font-normal text-[#8C8C8C] ml-0.5">Jump</span>
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
