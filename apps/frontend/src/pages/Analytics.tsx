import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { api } from "@/lib/api";
import { usePollSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Copy, X, Share2, Eye, Users, TrendingUp, Clock, Smartphone, Monitor, Tablet, Trophy, Minus, Equal } from "lucide-react";
import type { Poll, AnalyticsData, SocketResponsePayload, SocketStatusPayload } from "@versus/shared";

const CHART_COLORS = ["#4f46e5", "#818cf8", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];
const DEVICE_ICONS: Record<string, typeof Smartphone> = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

interface ActivityItem {
  id: string;
  message: string;
  time: Date;
}

function StatCard({ icon: Icon, label, value, pulse }: { icon: typeof Users; label: string; value: string | number; pulse?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        <Icon size={16} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold text-gray-900 ${pulse ? "animate-pulse-counter" : ""}`}>{value}</p>
    </div>
  );
}

function ConsensusTag({ consensus }: { consensus: string }) {
  const config: Record<string, { icon: typeof Trophy; label: string; className: string }> = {
    clear_winner: { icon: Trophy, label: "Clear winner", className: "text-emerald-600 bg-emerald-50" },
    tight_race: { icon: Minus, label: "Tight race", className: "text-amber-600 bg-amber-50" },
    split_decision: { icon: Equal, label: "Split", className: "text-gray-600 bg-gray-100" },
  };
  const c = config[consensus] || config.split_decision;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.className}`}>
      <c.icon size={12} />
      {c.label}
    </span>
  );
}

export function Analytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [pulseStat, setPulseStat] = useState(false);
  const prevTotal = useRef(0);

  const socket = usePollSocket(id);

  useEffect(() => {
    async function load() {
      try {
        const [pollData, analyticsData] = await Promise.all([
          api.get<{ poll: Poll }>(`/vs/${id}`).then((d) => (d as any).poll || d),
          api.get<AnalyticsData>(`/vs/${id}/analytics`),
        ]);
        setPoll(pollData as Poll);
        setAnalytics(analyticsData);
        prevTotal.current = analyticsData.totalResponses;
      } catch (err: any) {
        toast.error(err?.message || "Failed to load analytics");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleNewResponse = (payload: SocketResponsePayload) => {
      setAnalytics((prev) => {
        if (!prev) return prev;
        return { ...prev, totalResponses: payload.totalResponses, questionSummaries: payload.questionSummaries };
      });
      if (payload.totalResponses > prevTotal.current) {
        setPulseStat(true);
        setTimeout(() => setPulseStat(false), 500);
        prevTotal.current = payload.totalResponses;
      }
      setActivity((prev) => [
        { id: crypto.randomUUID(), message: "New response received", time: new Date() },
        ...prev.slice(0, 19),
      ]);
    };

    const handleStatus = (payload: SocketStatusPayload) => {
      setPoll((prev) => prev ? { ...prev, status: payload.status as any } : prev);
    };

    socket.on("response:new", handleNewResponse);
    socket.on("poll:closed", handleStatus);
    socket.on("poll:published", handleStatus);

    return () => {
      socket.off("response:new", handleNewResponse);
      socket.off("poll:closed", handleStatus);
      socket.off("poll:published", handleStatus);
    };
  }, [socket]);

  const handleAction = async (action: "close" | "publish") => {
    if (!id) return;
    const msg = action === "close"
      ? "Close this poll? It will stop accepting new responses."
      : "Publish results? This makes results visible to everyone and cannot be undone.";
    if (!confirm(msg)) return;
    try {
      await api.patch(`/vs/${id}/${action}`);
      toast.success(action === "close" ? "Poll closed" : "Results published");
      setPoll((prev) => prev ? { ...prev, status: action === "close" ? "closed" : prev.status, isPublished: action === "publish" ? true : prev.isPublished } : prev);
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action} poll`);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this poll permanently? This cannot be undone.")) return;
    try {
      await api.del(`/vs/${id}`);
      toast.success("Poll deleted");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete poll");
    }
  };

  const copyLink = async () => {
    if (!poll) return;
    const url = `${window.location.origin}/vs/${poll.slug || poll.shareId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-8 w-1/3 animate-shimmer rounded mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-shimmer rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-64 animate-shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!poll || !analytics) return null;

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    active: "bg-emerald-50 text-emerald-700",
    expired: "bg-amber-50 text-amber-700",
    closed: "bg-red-50 text-red-700",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-fade-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-gray-900">{poll.title}</h1>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusColor[poll.status] || ""}`}>
              {poll.status}
            </span>
          </div>
          {poll.status === "active" && (
            <p className="text-sm text-gray-500">Expires {new Date(poll.expiresAt).toLocaleString()}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={copyLink} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-surface-dark transition-all">
            <Copy size={14} /> Copy link
          </button>
          {poll.status === "active" && (
            <button onClick={() => handleAction("close")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-danger/30 text-danger text-sm font-medium hover:bg-red-50 transition-all">
              <X size={14} /> Close
            </button>
          )}
          {(poll.status === "closed" || poll.status === "expired") && !poll.isPublished && (
            <button onClick={() => handleAction("publish")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all">
              <Share2 size={14} /> Publish
            </button>
          )}
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Responses" value={analytics.totalResponses} pulse={pulseStat} />
        <StatCard icon={Eye} label="Views" value={analytics.views} />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${analytics.completionRate}%`} />
        <StatCard icon={Clock} label="Resp / Hour" value={analytics.responseRate.toFixed(1)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Response velocity */}
        {analytics.responseVelocity.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-gray-900 mb-1">Response Momentum</h3>
            {analytics.peakTime && (
              <p className="text-xs text-gray-500 mb-4">Peak: {analytics.peakTime}</p>
            )}
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={analytics.responseVelocity}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Device breakdown */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-gray-900 mb-4">Devices</h3>
          {analytics.deviceBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={analytics.deviceBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3}>
                    {analytics.deviceBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {analytics.deviceBreakdown.map((d, i) => {
                  const Icon = DEVICE_ICONS[d.type.toLowerCase()] || Monitor;
                  return (
                    <div key={d.type} className="flex items-center gap-2 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <Icon size={14} className="text-gray-400" />
                      <span className="text-gray-700 capitalize">{d.type}</span>
                      <span className="ml-auto font-medium text-gray-900">{d.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          )}
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-bold text-gray-900">Question Breakdown</h2>
        {analytics.questionSummaries.map((qs) => (
          <div key={qs.questionId} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between mb-4">
              <p className="font-semibold text-gray-900">{qs.questionText}</p>
              <ConsensusTag consensus={qs.consensus} />
            </div>
            <ResponsiveContainer width="100%" height={qs.options.length * 44 + 20}>
              <BarChart data={qs.options} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="optionText" tick={{ fontSize: 12 }} width={140} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(value: number, _: string, props: any) => [`${value} (${props.payload.percentage}%)`, "Votes"]}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Question engagement + Platform breakdown */}
      {(analytics.questionEngagement.length > 0 || analytics.platformBreakdown.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {analytics.questionEngagement.some((q) => !q.isMandatory) && (
            <div className="bg-white rounded-2xl border border-border p-5">
              <h3 className="font-bold text-gray-900 mb-4">Question Engagement</h3>
              <div className="space-y-3">
                {analytics.questionEngagement.filter((q) => !q.isMandatory).map((q) => (
                  <div key={q.questionId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate mr-3">{q.questionText}</span>
                      <span className="font-medium text-gray-900 shrink-0">{q.percentage}%</span>
                    </div>
                    <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${q.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {analytics.platformBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-5">
              <h3 className="font-bold text-gray-900 mb-4">Platforms</h3>
              <div className="space-y-2">
                {analytics.platformBreakdown.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{p.name}</span>
                    <span className="font-medium text-gray-900">{p.count} ({p.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity feed */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-8">
        <h3 className="font-bold text-gray-900 mb-4">Activity Feed</h3>
        {activity.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm py-1.5 animate-fade-in">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-gray-700">{item.message}</span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">
                  {item.time.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Waiting for new responses...</p>
        )}
      </div>

      {/* Danger zone */}
      <div className="border border-danger/20 rounded-2xl p-5">
        <h3 className="font-bold text-danger mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">Permanently delete this poll and all its responses.</p>
        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-xl border border-danger text-danger text-sm font-medium hover:bg-red-50 transition-all"
        >
          Delete Poll
        </button>
      </div>
    </div>
  );
}
