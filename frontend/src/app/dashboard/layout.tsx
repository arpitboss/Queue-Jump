"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, LayoutDashboard, LogOut, ArrowLeft, Shield } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("queuejump_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("queuejump_token");
    router.push("/login");
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-zinc-500 font-mono text-xs">
        Loading QueueJump telemetry...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-white/5 bg-[#0D0D12] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-[#FF4F00] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Zap className="w-3.5 h-3.5 fill-white" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">QueueJump</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 text-orange-400" />
            <span>Control Center</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Landing Page</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-red-400 transition flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}