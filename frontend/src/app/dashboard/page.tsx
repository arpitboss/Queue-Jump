"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  ShieldAlert,
  Zap,
  TrendingUp,
  Plus,
  Key,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  ListOrdered,
  AlertOctagon,
  Clock,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
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

  // New Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newBonusHours, setNewBonusHours] = useState(24);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [createdKeys, setCreatedKeys] = useState<{ publicKey: string; secretKey: string } | null>(null);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  const loadData = useCallback(async () => {
    try {
      const campData = await apiRequest<{ campaigns: Campaign[] }>("/api/v1/campaigns");
      setCampaigns(campData.campaigns || []);

      if (campData.campaigns && campData.campaigns.length > 0) {
        const activeId = selectedCampaignId || campData.campaigns[0].id;
        setSelectedCampaignId(activeId);

        const activeCamp = campData.campaigns.find((c) => c.id === activeId) || campData.campaigns[0];

        // Fetch leaderboard & fraud logs for this campaign
        const [lbData, fraudData] = await Promise.all([
          apiRequest<{ leaderboard: LeaderboardItem[]; total: number }>(
            "/api/v1/waitlist/leaderboard?limit=50",
            { campaignKey: activeCamp.publicKey }
          ).catch(() => ({ leaderboard: [], total: 0 })),
          apiRequest<{ logs: FraudBlockLogItem[]; total: number }>(
            `/api/v1/campaigns/${activeCamp.id}/fraud-logs?limit=50`
          ).catch(() => ({ logs: [], total: 0 })),
        ]);

        setLeaderboard(lbData.leaderboard || []);
        setTotalParticipants(lbData.total || 0);
        setFraudLogs(fraudData.logs || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      setCreatedKeys({
        publicKey: res.campaign.publicKey,
        secretKey: res.campaign.secretKey,
      });

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

  // Calculate Viral Coefficient (Referrals per user)
  const totalReferrals = leaderboard.reduce((acc, curr) => acc + (curr.verifiedReferrals || 0), 0);
  const viralKFactor = totalParticipants > 0 ? (totalReferrals / totalParticipants).toFixed(2) : "0.00";

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-zinc-500 animate-pulse">
        Synchronizing campaign telemetries...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Bar: Campaign Switcher & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{selectedCampaign ? selectedCampaign.name : "Active Campaigns"}</span>
              {selectedCampaign?.isDemo && (
                <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
                  Demo Playground Campaign
                </span>
              )}
            </h1>
            <p className="text-xs font-mono text-zinc-400">
              ID: {selectedCampaign?.id || "None"} • Created {new Date(selectedCampaign?.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {campaigns.length > 1 && (
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-[#121217] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
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
            className="p-2 bg-[#121217] hover:bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-400" : ""}`} />
          </button>

          <button
            onClick={() => {
              setCreatedKeys(null);
              setShowCreateModal(true);
            }}
            className="flex-1 sm:flex-none bg-[#FF4F00] hover:bg-[#FF661A] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Telemetry Bento Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Signups */}
        <div className="bg-[#121217] border border-white/5 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Total Signups</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {totalParticipants}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Redis ZSET membership
          </div>
        </div>

        {/* Card 2: Viral K-Factor */}
        <div className="bg-[#121217] border border-white/5 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Viral K-Factor</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">
            {viralKFactor}x
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {totalReferrals} verified referrals attributed
          </div>
        </div>

        {/* Card 3: Fraud Interceptions */}
        <div className="bg-[#121217] border border-white/5 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Bots Intercepted</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-red-400">
            {fraudLogs.length}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Temp-mail & IP rate blocks
          </div>
        </div>

        {/* Card 4: Redis Engine Status */}
        <div className="bg-[#121217] border border-white/5 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Leaderboard Health</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-center gap-2 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Sub-5ms rank lookups
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === "leaderboard"
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <ListOrdered className="w-4 h-4 text-orange-400" />
          <span>Live Leaderboard ({totalParticipants})</span>
        </button>

        <button
          onClick={() => setActiveTab("fraud")}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === "fraud"
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-red-400" />
          <span>Fraud Shield Logs ({fraudLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("embed")}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer ${
            activeTab === "embed"
              ? "bg-white/10 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Code2 className="w-4 h-4 text-purple-400" />
          <span>Embed Widget & Keys</span>
        </button>
      </div>

      {/* TAB 1: Live Leaderboard Table */}
      {activeTab === "leaderboard" && (
        <div className="bg-[#101015] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#14141D] text-zinc-400 font-mono uppercase text-[11px] border-b border-white/5">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Rank</th>
                  <th className="py-3.5 px-4 font-semibold">Participant Email</th>
                  <th className="py-3.5 px-4 font-semibold">Referral Code</th>
                  <th className="py-3.5 px-4 font-semibold">Verified Referrals</th>
                  <th className="py-3.5 px-4 font-semibold">Joined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300 font-mono">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      No participants on this waitlist yet. Try the playground on the landing page!
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((item) => (
                    <tr key={item.referralCode} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        {item.rank <= 3 ? (
                          <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px]">
                            {item.rank}
                          </span>
                        ) : (
                          <span className="text-zinc-500 ml-1">#{item.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-200">{item.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[11px] text-zinc-300">
                          {item.referralCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-400 font-bold">{item.verifiedReferrals}</span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {new Date(item.joinedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Fraud Shield Table */}
      {activeTab === "fraud" && (
        <div className="bg-[#101015] border border-white/10 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
          <div>
            <h3 className="text-base font-bold text-white">Blocked Abuse & Bot Audit Log</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Every intercepted disposable email, rate-limited bot IP, or self-referral attempt is logged in real time.
            </p>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#14141D] text-zinc-400 font-mono uppercase text-[11px] border-b border-white/5">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Attempted Email</th>
                  <th className="py-3 px-4 font-semibold">Origin IP</th>
                  <th className="py-3 px-4 font-semibold">Security Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300 font-mono">
                {fraudLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-zinc-500">
                      No fraudulent signups blocked yet. The shield is active.
                    </td>
                  </tr>
                ) : (
                  fraudLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 text-zinc-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-200">{log.rawEmail}</td>
                      <td className="py-3 px-4 text-zinc-400">{log.ipAddress}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.reason === "DISPOSABLE_DOMAIN"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : log.reason === "IP_RATE_LIMIT"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
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

      {/* TAB 3: Embed Widget & API Keys */}
      {activeTab === "embed" && selectedCampaign && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* API Keys */}
          <div className="lg:col-span-6 bg-[#101015] border border-white/10 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-orange-400" />
                <span>Campaign API Keys</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Use your public key in client-side widgets. Never expose your secret key in frontend code.
              </p>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="text-zinc-400">Public Key (Client Embeds):</div>
                <div className="flex items-center gap-2 bg-[#161620] border border-white/10 rounded-xl p-2 pr-3">
                  <span className="flex-1 text-emerald-400 truncate px-1">
                    {selectedCampaign.publicKey}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedCampaign.publicKey, "pk")}
                    className="text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    {copiedKey === "pk" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-zinc-400">Embed Snippet:</div>
                <div className="bg-[#161620] border border-white/10 rounded-xl p-3 relative group">
                  <pre className="text-zinc-300 overflow-x-auto text-[11px] leading-relaxed">
{`<div id="queuejump" data-key="${selectedCampaign.publicKey}"></div>\n<script src="http://localhost:4000/widget.js" async></script>`}
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `<div id="queuejump" data-key="${selectedCampaign.publicKey}"></div>\n<script src="http://localhost:4000/widget.js" async></script>`,
                        "embed_code"
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-white transition cursor-pointer"
                  >
                    {copiedKey === "embed_code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Standalone Embed Link Preview */}
          <div className="lg:col-span-6 bg-[#101015] border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Standalone Hosted Waitlist</h3>
              <p className="text-xs text-zinc-400 mt-1">
                You can also link directly to your hosted waitlist page or embed it in an iframe.
              </p>
            </div>

            <div className="bg-[#161620] border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 truncate">
                http://localhost:3000/embed/{selectedCampaign.publicKey}
              </span>
              <a
                href={`/embed/${selectedCampaign.publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold transition shrink-0 ml-2"
              >
                <span>Open View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Create Waitlist Campaign</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Configure your referral bonus rules and generate live API keys.
              </p>
            </div>

            {createdKeys ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                  ✔ Campaign created successfully! Save your secret key now — it cannot be viewed again.
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-400">Public Key (pk_live):</span>
                  <div className="p-2 bg-[#181824] rounded-lg text-white select-all break-all">
                    {createdKeys.publicKey}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-400">Secret Key (sk_live - Save now):</span>
                  <div className="p-2 bg-[#181824] rounded-lg text-amber-400 select-all break-all">
                    {createdKeys.secretKey}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedKeys(null);
                  }}
                  className="w-full bg-white text-black font-semibold py-2.5 rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Campaign Name</label>
                  <input
                    type="text"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    placeholder="e.g. Acme Mobile App Launch"
                    required
                    className="w-full bg-[#181824] border border-white/10 focus:border-[#FF4F00] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    Referral Spot Bonus (Hours Jumped per Invite)
                  </label>
                  <input
                    type="number"
                    value={newBonusHours}
                    onChange={(e) => setNewBonusHours(Number(e.target.value))}
                    min={1}
                    max={720}
                    required
                    className="w-full bg-[#181824] border border-white/10 focus:border-[#FF4F00] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                  <span className="text-[11px] text-zinc-500">
                    Default 24h = jumping 1 day ahead in timestamp scoring per verified referral.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Webhook URL (Optional)</label>
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="https://your-api.com/api/webhooks/queuejump"
                    className="w-full bg-[#181824] border border-white/10 focus:border-[#FF4F00] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCampaign}
                    className="bg-[#FF4F00] hover:bg-[#FF661A] text-white font-medium text-xs px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {creatingCampaign ? "Creating..." : "Create Campaign"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}