"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
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
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Consistent Brand Logo */}
        <div className="flex justify-center mb-5">
          <BrandLogo />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-[#0A0A0A]">
          {isRegister ? "Create founder account" : "Sign in to dashboard"}
        </h2>
        <p className="mt-1.5 text-xs text-[#737373]">
          Manage your waitlists, milestone rewards, and referral analytics.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-black/[0.08] rounded-2xl p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
          {/* Quick Demo Access Button matching .btn-vibrant-white */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-vibrant-white w-full py-2.5 px-3 text-xs font-medium gap-2 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#14804A]" />
            <span>1-Click Instant Demo Login</span>
            <span className="text-[#8C8C8C] font-mono">(demo@queuejump.dev)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-black/[0.08] w-full" />
            <span className="bg-white px-3 text-[11px] text-[#A1A1A1] uppercase tracking-wider font-mono">
              or credentials
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0A0A0A]">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  className="w-full bg-[#FAFAFA] border border-black/[0.09] focus:bg-white focus:border-[#3074FE] focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-[#A1A1A1] transition"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0A0A0A]">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@company.com"
                required
                className="w-full bg-[#FAFAFA] border border-black/[0.09] focus:bg-white focus:border-[#3074FE] focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-[#A1A1A1] transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0A0A0A]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={8}
                className="w-full bg-[#FAFAFA] border border-black/[0.09] focus:bg-white focus:border-[#3074FE] focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-[#A1A1A1] transition"
              />
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200/80 p-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-vibrant-dark w-full py-2.5 px-4 text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="text-center text-xs text-[#737373]">
            {isRegister ? "Already have an account?" : "Don't have an account yet?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-[#3074FE] hover:underline font-medium cursor-pointer"
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
