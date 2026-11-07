import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TelemetryBeacon } from "@/components/telemetry/TelemetryBeacon";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QueueJump | Referral Waitlists for High-Growth Launches",
  icons: {
    icon: "/icon.svg",
  },
  description: "Turn every waitlist signup into referrals with live queue positions, milestone rewards, and spam protection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-[#0A0A0A]">
        <TelemetryBeacon />
        {children}
      </body>
    </html>
  );
}