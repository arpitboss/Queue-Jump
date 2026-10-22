"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, ArrowRight, Lock, Mail, User, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "/api/v1/tenants/register" : "/api/v1/tenants/login";
    const body = isRegister ? { name, email, password } : { email, password };

    try {
      const data = await apiRequest<{ accessToken: string }>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      localStorage.setItem("queuejump_token", data.accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  // Quick 1-click demo login helper
  async function handleDemoLogin() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ accessToken: string }>("/api/v1/tenants/login", {
        method: "POST",
        body: JSON.stringify({ email: "demo@queuejump.dev", password: "demopassword123" }),
      });
      localStorage.setItem("queuejump_token", data.accessToken);
      router.push("/dashboard");
    } catch {
      // If seed was not run, fallback to auto-register
      try {
        const regData = await apiRequest<{ accessToken: string }>("/api/v1/tenants/register", {
          method: "POST",
          body: JSON.stringify({
            name: "Demo Founder",
            email: `demo_${Date.now()}@queuejump.dev`,
            password: "demopassword123",
          }),
        });
        localStorage.setItem("queuejump_token", regData.accessToken);
        router.push("/dashboard");
      } catch (err: any) {
        setError(err.message || "Failed to log in as demo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-grid-pattern relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[300px] bg-orange-500/10 blur-[120px] pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#FF4F00] flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">QueueJump</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {isRegister ? "Create Founder Account" : "Sign in to Founder Dashboard"}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Control your campaigns, milestones, and anti-fraud shield.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#101016] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Quick Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>1-Click Instant Demo Access</span>
            <span className="text-zinc-500 font-mono">(demo@queuejump.dev)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#101016] px-3 text-xs text-zinc-500 uppercase tracking-widest font-mono">
              or credentials
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arpit Verma"
                    required
                    className="w-full bg-[#161620] border border-white/10 focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@company.com"
                  required
                  className="w-full bg-[#161620] border border-white/10 focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={8}
                  className="w-full bg-[#161620] border border-white/10 focus:border-[#FF4F00] focus:ring-1 focus:ring-[#FF4F00] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF4F00] hover:bg-[#FF661A] text-white font-medium text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-zinc-400">
            {isRegister ? "Already have an account?" : "Don't have an account yet?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-[#FF4F00] hover:underline font-medium cursor-pointer"
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}