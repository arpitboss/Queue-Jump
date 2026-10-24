"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Download,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { apiRequest, API_URL } from "@/lib/api";
import { Campaign, LeaderboardItem, FraudBlockLogItem } from "@/lib/types";

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [fraudLogs, setFraudLogs] = useState<FraudBlockLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "fraud" | "embed">("leaderboard");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [widgetTheme, setWidgetTheme] = useState<"dark" | "light">("dark");
  const [exporting, setExporting] = useState(false);
  const [admitting, setAdmitting] = useState(false);
  const [admitCount, setAdmitCount] = useState(10);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitSuccess, setAdmitSuccess] = useState<string | null>(null);

  // New Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newBonusHours, setNewBonusHours] = useState(24);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  const loadData = useCallback(async () => {
    let token = typeof window !== "undefined" ? localStorage.getItem("queuejump_token") : null;
    if (!token) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      setLoading(false);
      return;
    }

    try {
      const campData = await apiRequest<{ campaigns: Campaign[] }>("/api/v1/campaigns", { token: token || undefined });
      setCampaigns(campData.campaigns || []);

      if (campData.campaigns && campData.campaigns.length > 0) {
        const activeId = selectedCampaignId || campData.campaigns[0].id;
        setSelectedCampaignId(activeId);

        const activeCamp = campData.campaigns.find((c) => c.id === activeId) || campData.campaigns[0];

        const [lbData, fraudData] = await Promise.all([
          apiRequest<{ leaderboard: LeaderboardItem[]; total: number }>(
            "/api/v1/waitlist/leaderboard?limit=50",
            { campaignKey: activeCamp.publicKey }
          ).catch(() => ({ leaderboard: [], total: 0 })),
          apiRequest<{ logs: FraudBlockLogItem[]; total: number }>(
            `/api/v1/campaigns/${activeCamp.id}/fraud-logs?limit=50`,
            { token: token || undefined }
          ).catch(() => ({ logs: [], total: 0 })),
        ]);

        setLeaderboard(lbData.leaderboard || []);
        setTotalParticipants(lbData.total || 0);
        setFraudLogs(fraudData.logs || []);
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      if (typeof window !== "undefined") {
        localStorage.removeItem("queuejump_token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  
  async function handleExportCSV() {
    if (!selectedCampaign) return;
    setExporting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("queuejump_token") : null;
      const res = await fetch(`${API_URL}/api/v1/campaigns/${selectedCampaign.id}/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Could not generate CSV export.");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `waitlist_${selectedCampaign.name.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleAdmitCohortSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCampaign) return;
    setAdmitting(true);
    setAdmitSuccess(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("queuejump_token") : null;
      const res = await apiRequest<{ admittedCount: number }>(`/api/v1/campaigns/${selectedCampaign.id}/admit`, {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({ count: admitCount }),
      });
      setAdmitSuccess(`Successfully granted access to ${res.admittedCount} participants!`);
      await loadData();
      setTimeout(() => setShowAdmitModal(false), 2000);
    } catch (err: any) {
      alert(err.message || "Failed to admit cohort");
    } finally {
      setAdmitting(false);
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setCreatingCampaign(true);
    try {
      const res = await apiRequest<{ campaign: Campaign & { secretKey: string } }>("/api/v1/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: newCampaignName.trim(),
          referralBonusSec: newBonusHours * 3600,
          webhookUrl: newWebhookUrl.trim() || null,
          milestones: [
            { count: 3, reward: "Early Beta Access" },
            { count: 10, reward: "Free Pro Account for 1 Year" },
          ],
        }),
      });

      setShowCreateModal(false);
      setNewCampaignName("");
      setNewWebhookUrl("");
      await loadData();
      setSelectedCampaignId(res.campaign.id);
    } catch (err: any) {
      alert(err.message || "Failed to create campaign.");
    } finally {
      setCreatingCampaign(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const totalReferrals = leaderboard.reduce((acc, curr) => acc + (curr.verifiedReferrals || 0), 0);
  const viralKFactor = totalParticipants > 0 ? (totalReferrals / totalParticipants).toFixed(2) : "0.00";

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-[#737373]">
        Loading campaign statistics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Campaign Switcher & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#0A0A0A] tracking-tight">
              {selectedCampaign ? selectedCampaign.name : "Campaigns"}
            </h1>
            {selectedCampaign?.isDemo && (
              <span className="text-[11px] font-medium bg-[#F7F7F8] text-[#737373] border border-black/[0.08] px-2 py-0.5 rounded-full">
                Demo
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#737373] font-mono mt-0.5">
            Key: {selectedCampaign?.publicKey || "None"}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {campaigns.length > 1 && (
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-white border border-black/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#0A0A0A] outline-none cursor-pointer"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            className="p-2 bg-white hover:bg-neutral-50 border border-black/[0.08] rounded-xl text-[#737373] hover:text-[#0A0A0A] transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#3074FE]" : ""}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-vibrant-dark text-xs font-medium px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-black/[0.08] rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block mb-1">Total Subscribers</span>
          <div className="text-2xl font-semibold text-[#0A0A0A] font-mono tabular-nums">
            {totalParticipants}
          </div>
          <span className="text-[11.5px] text-[#A1A1A1] mt-0.5 block">Active on waitlist</span>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block mb-1">Viral Factor (K)</span>
          <div className="text-2xl font-semibold text-[#14804A] font-mono tabular-nums">
            {viralKFactor}x
          </div>
          <span className="text-[11.5px] text-[#A1A1A1] mt-0.5 block">{totalReferrals} verified referrals</span>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block mb-1">Blocked Entries</span>
          <div className="text-2xl font-semibold text-[#0A0A0A] font-mono tabular-nums">
            {fraudLogs.length}
          </div>
          <span className="text-[11.5px] text-[#A1A1A1] mt-0.5 block">Disposable & bot IPs</span>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#737373] block mb-1">Queue Status</span>
          <div className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Operational
          </div>
          <span className="text-[11.5px] text-[#A1A1A1] mt-1 block">Real-time rank updates</span>
        </div>
      </div>

      {/* Segmented Control Tabs & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-[#EFEFEF] p-1 rounded-xl w-max border border-black/[0.04]">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-white text-[#0A0A0A] shadow-sm"
                : "text-[#737373] hover:text-[#0A0A0A]"
            }`}
          >
            Leaderboard ({totalParticipants})
          </button>

          <button
            onClick={() => setActiveTab("fraud")}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "fraud"
                ? "bg-white text-[#0A0A0A] shadow-sm"
                : "text-[#737373] hover:text-[#0A0A0A]"
            }`}
          >
            Fraud Log ({fraudLogs.length})
          </button>

          <button
            onClick={() => setActiveTab("embed")}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "embed"
                ? "bg-white text-[#0A0A0A] shadow-sm"
                : "text-[#737373] hover:text-[#0A0A0A]"
            }`}
          >
            Integration & Embed
          </button>
        </div>

        {activeTab === "leaderboard" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="btn-vibrant-white text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download entire waitlist as CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#737373]" />
              <span>{exporting ? "Generating CSV..." : "Export CSV"}</span>
            </button>
            <button
              onClick={() => setShowAdmitModal(true)}
              className="btn-vibrant-dark text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5 cursor-pointer"
              title="Grant beta access to top verified participants"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admit Cohort</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Leaderboard Table */}
      {activeTab === "leaderboard" && (
        <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] text-[#737373] uppercase text-[11px] font-medium border-b border-black/[0.06]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Subscriber</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Invite Code</th>
                  <th className="py-3 px-4">Verified Referrals</th>
                  <th className="py-3 px-4">Joined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-[#0A0A0A] font-mono">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#737373] font-sans">
                      No signups yet on this campaign. Test joining from the live demo on the homepage!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item) => (
                    <tr key={item.referralCode} className="hover:bg-[#F7F7F8]/50 transition">
                      <td className="py-3 px-4 font-semibold text-[#0A0A0A]">
                        #{item.rank}
                      </td>
                      <td className="py-3 px-4 text-[#0A0A0A]">{item.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium font-sans border ${
                          item.status === "ADMITTED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "VERIFIED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {item.status || "VERIFIED"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-[#F7F7F8] border border-black/[0.06] px-2 py-0.5 rounded text-[11px] text-[#737373]">
                          {item.referralCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#14804A]">
                        {item.verifiedReferrals}
                      </td>
                      <td className="py-3 px-4 text-[#737373]">
                        {new Date(item.joinedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Fraud Shield Logs */}
      {activeTab === "fraud" && (
        <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-black/[0.06]">
            <h3 className="text-sm font-semibold text-[#0A0A0A]">Filtered Abuse & Throwaway Attempts</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Entries rejected automatically by disposable domain checks and IP velocity limits.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F8] text-[#737373] uppercase text-[11px] font-medium border-b border-black/[0.06]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Attempted Email</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Filter Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-[#0A0A0A] font-mono">
                {fraudLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[#737373] font-sans">
                      No fraudulent signups recorded. All current entries verified.
                    </td>
                  </tr>
                ) : (
                  fraudLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F7F7F8]/50 transition">
                      <td className="py-3 px-4 text-[#737373]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">{log.rawEmail}</td>
                      <td className="py-3 px-4 text-[#737373]">{log.ipAddress}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                          {log.reason}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Embed Code & Keys */}
      {activeTab === "embed" && selectedCampaign && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-black/[0.08] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0A0A0A]">Public Campaign Key</h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Safe to use in HTML embed tags and client-side code.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#F7F7F8] border border-black/[0.08] rounded-lg p-2 font-mono text-xs">
              <span className="flex-1 text-[#0A0A0A] truncate px-1">
                {selectedCampaign.publicKey}
              </span>
              <button
                onClick={() => copyToClipboard(selectedCampaign.publicKey, "pk")}
                className="p-1 text-[#737373] hover:text-[#0A0A0A] transition cursor-pointer"
              >
                {copiedKey === "pk" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#0A0A0A]">
                  HTML Embed Snippet
                </label>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#737373] text-[11px]">Theme:</span>
                  <button
                    type="button"
                    onClick={() => setWidgetTheme("dark")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      widgetTheme === "dark"
                        ? "bg-[#0A0A0A] text-white"
                        : "bg-[#F7F7F8] text-[#737373] hover:text-[#0A0A0A]"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setWidgetTheme("light")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      widgetTheme === "light"
                        ? "bg-[#0A0A0A] text-white"
                        : "bg-[#F7F7F8] text-[#737373] hover:text-[#0A0A0A]"
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>
              <div className="bg-[#18181B] text-zinc-300 p-3 rounded-lg font-mono text-[11.5px] relative">
                <pre className="overflow-x-auto">
{`<div id="queuejump" data-key="${selectedCampaign.publicKey}" data-theme="${widgetTheme}"></div>\n<script src="${API_URL}/widget.js" async></script>`}
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `<div id="queuejump" data-key="${selectedCampaign.publicKey}" data-theme="${widgetTheme}"></div>\n<script src="${API_URL}/widget.js" async></script>`,
                      "embed_code"
                    )
                  }
                  className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition cursor-pointer"
                >
                  {copiedKey === "embed_code" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0A0A0A]">Hosted Widget Page</h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Direct URL to this campaign's standalone responsive waitlist.
              </p>
            </div>

            <div className="bg-[#F7F7F8] border border-black/[0.08] rounded-lg p-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-[#737373] truncate">
                /embed/{selectedCampaign.publicKey}?theme={widgetTheme}
              </span>
              <a
                href={`/embed/${selectedCampaign.publicKey}?theme=${widgetTheme}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3074FE] hover:underline inline-flex items-center gap-1 font-medium ml-2"
              >
                <span>Preview ({widgetTheme.toUpperCase()})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>


        {/* Comprehensive Integration & Developer Guide */}
        <div className="bg-white border border-black/[0.08] rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-semibold text-[#0A0A0A]">
              Founder & Developer Integration Guide
            </h3>
            <p className="text-xs text-[#737373] mt-1">
              Connect QueueJump to your website using either the 2-line drop-in widget or the direct REST API.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 pt-2">
            {/* Guide Card 1: Drop-in Embed */}
            <div className="bg-[#F7F7F8] border border-black/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#0A0A0A] text-white text-xs font-bold flex items-center justify-center">1</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">Drop-in Widget</h4>
              </div>
              <p className="text-xs text-[#737373] leading-relaxed">
                Paste the snippet inside your HTML, Webflow, Framer, or WordPress site. Uses Shadow DOM so it will never clash with your website's styles.
              </p>
              <div className="bg-[#18181B] text-zinc-300 p-2.5 rounded-lg text-[11px] font-mono">
                data-theme="dark|light"<br/>
                data-accent="#3074FE"
              </div>
            </div>

            {/* Guide Card 2: Headless API */}
            <div className="bg-[#F7F7F8] border border-black/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#3074FE] text-white text-xs font-bold flex items-center justify-center">2</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">Headless REST API</h4>
              </div>
              <p className="text-xs text-[#737373] leading-relaxed">
                Have a custom Figma design? Call our REST API directly from your React/Next.js/HTML form with your campaign key header.
              </p>
              <div className="bg-[#18181B] text-zinc-300 p-2.5 rounded-lg text-[11px] font-mono">
                POST /api/v1/waitlist/join<br/>
                X-Campaign-Key: pk_live_...
              </div>
            </div>

            {/* Guide Card 3: Webhooks & Automations */}
            <div className="bg-[#F7F7F8] border border-black/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">Webhooks & Sync</h4>
              </div>
              <p className="text-xs text-[#737373] leading-relaxed">
                Get real-time signed JSON payloads whenever someone verifies, unlocks a milestone reward, or gets admitted to your beta cohort.
              </p>
              <div className="bg-[#18181B] text-zinc-300 p-2.5 rounded-lg text-[11px] font-mono">
                Events: participant.verified<br/>
                milestone.unlocked, admitted
              </div>
            </div>
          </div>

          {/* Quick API Examples */}
          <div className="border-t border-black/[0.06] pt-4 space-y-3">
            <h4 className="text-xs font-semibold text-[#0A0A0A]">Headless API Request Example (cURL)</h4>
            <div className="bg-[#18181B] text-zinc-300 p-3 rounded-lg font-mono text-[11.5px] overflow-x-auto">
              curl -X POST ${API_URL}/api/v1/waitlist/join \<br/>
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
              &nbsp;&nbsp;-H "X-Campaign-Key: ${selectedCampaign.publicKey}" \<br/>
              &nbsp;&nbsp;-d '&#123; "email": "founder@startup.com", "referralCode": "optional_ref" &#125;'
            </div>
          </div>
        </div>

        {/* Live Visual Preview Card */}
        <div className="bg-white border border-black/[0.08] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0A0A0A]">
                Live Visual Preview ({widgetTheme.toUpperCase()} THEME)
              </h3>
              <p className="text-xs text-[#737373] mt-0.5">
                Real-time preview of how this widget renders when embedded on an external website.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-black/[0.05] text-[#737373]">
              data-theme="{widgetTheme}"
            </span>
          </div>

          <div className={`p-8 rounded-xl border flex items-center justify-center transition-colors duration-200 ${
            widgetTheme === "dark" ? "bg-[#09090B] border-zinc-800" : "bg-[#F4F4F5] border-black/[0.06]"
          }`}>
            <div className={`w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4 border transition-all duration-200 ${
              widgetTheme === "dark"
                ? "bg-[#0E0E12] border-white/[0.08] text-white"
                : "bg-white border-black/[0.08] text-[#0A0A0A]"
            }`}>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#3074FE]/10 text-[#3074FE] border border-[#3074FE]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3074FE] animate-pulse"></span>
                  Live Waitlist
                </span>
                <h4 className="text-lg font-bold tracking-tight">Join {selectedCampaign.name}</h4>
                <p className={`text-xs ${widgetTheme === "dark" ? "text-zinc-400" : "text-[#737373]"}`}>
                  Reserve your spot. Skip ahead in line when you invite friends.
                </p>
              </div>
              <div className="space-y-2">
                <input
                  type="email"
                  readOnly
                  placeholder="name@company.com"
                  className={`w-full px-3 py-2 rounded-lg text-xs outline-none border ${
                    widgetTheme === "dark"
                      ? "bg-[#181822] border-white/10 text-white placeholder-zinc-500"
                      : "bg-[#F7F7F8] border-black/[0.08] text-[#0A0A0A] placeholder-zinc-400"
                  }`}
                />
                <button
                  type="button"
                  className="w-full bg-[#3074FE] text-white font-medium text-xs py-2.5 rounded-lg transition"
                >
                  Get Priority Spot →
                </button>
              </div>
              <div className="text-center text-[10.5px] text-zinc-500 pt-1">
                Powered by QueueJump
              </div>
            </div>
          </div>
        </div>
      </div>
    )}


      {/* Admit Cohort Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/[0.08] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#0A0A0A]">
                Admit Cohort to Beta
              </h3>
              <p className="text-xs text-[#737373] mt-1">
                Grant instant beta access to the top-ranked verified participants on this waitlist.
              </p>
            </div>

            <form onSubmit={handleAdmitCohortSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[#0A0A0A] font-medium block mb-1">
                  Number of top participants to admit:
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[10, 25, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAdmitCount(num)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        admitCount === num
                          ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                          : "bg-[#F7F7F8] border-black/[0.08] text-[#737373] hover:text-[#0A0A0A]"
                      }`}
                    >
                      Top {num}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={admitCount}
                  onChange={(e) => setAdmitCount(Number(e.target.value))}
                  min={1}
                  max={500}
                  className="w-full bg-[#F7F7F8] border border-black/[0.08] focus:border-[#3074FE] focus:bg-white rounded-lg px-3 py-2 text-[#0A0A0A] outline-none"
                />
              </div>

              {admitSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {admitSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="btn-vibrant-white px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={admitting}
                  className="btn-vibrant-dark px-4 py-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  {admitting ? "Admitting..." : `Grant Access to Top ${admitCount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/[0.08] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[#0A0A0A]">Create Launch Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#0A0A0A] font-medium block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="Beta Launch Waitlist"
                  required
                  className="w-full bg-[#F7F7F8] border border-black/[0.08] focus:border-[#3074FE] focus:bg-white rounded-lg px-3 py-2 text-[#0A0A0A] outline-none"
                />
              </div>

              <div>
                <label className="text-[#0A0A0A] font-medium block mb-1">Referral Skip Value (Hours)</label>
                <input
                  type="number"
                  value={newBonusHours}
                  onChange={(e) => setNewBonusHours(Number(e.target.value))}
                  min={1}
                  className="w-full bg-[#F7F7F8] border border-black/[0.08] focus:border-[#3074FE] focus:bg-white rounded-lg px-3 py-2 text-[#0A0A0A] outline-none"
                />
              </div>

              <div>
                <label className="text-[#0A0A0A] font-medium block mb-1">Webhook URL (Optional)</label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/queuejump"
                  className="w-full bg-[#F7F7F8] border border-black/[0.08] focus:border-[#3074FE] focus:bg-white rounded-lg px-3 py-2 text-[#0A0A0A] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-vibrant-white px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="btn-vibrant-dark px-4 py-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  {creatingCampaign ? "Creating..." : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
