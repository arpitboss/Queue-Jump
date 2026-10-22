"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

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

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#0A0A0A] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-[60px] border-b border-black/[0.06] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <BrandLogo />
          <span className="text-[#D4D4D4]">/</span>
          <span className="text-xs font-medium text-[#737373]">
            Campaign Management
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Link
            href="/"
            className="text-[#737373] hover:text-[#0A0A0A] transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </Link>
          <div className="h-3.5 w-px bg-black/[0.08]" />
          <button
            onClick={handleLogout}
            className="text-[#737373] hover:text-red-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {mounted ? children : (
          <div className="py-20 text-center text-[#737373] text-xs font-mono">
            Loading campaign data...
          </div>
        )}
      </main>
    </div>
  );
}
