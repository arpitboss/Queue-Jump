"use client";

export function Footer() {
  return (
    <footer className="py-12 border-t border-white/5 bg-[#070709] text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          QueueJump &copy; 2026 — Viral Waitlist & Referral Engine.
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/arpitboss/Queue-Jump"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition"
          >
            GitHub Repository
          </a>
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition"
          >
            OpenAPI Specs
          </a>
        </div>
      </div>
    </footer>
  );
}