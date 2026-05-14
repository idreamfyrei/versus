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

const CHART_COLORS = [
  "oklch(0.5 0.18 264)",
  "oklch(0.6 0.15 264)",
  "oklch(0.7 0.12 264)",
  "oklch(0.8 0.08 264)",
  "oklch(0.85 0.05 264)",
  "oklch(0.9 0.03 264)",
];
const DEVICE_ICONS: Record<string, typeof Smartphone> = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

interface ActivityItem {
  id: string;
  message: string;
  time: Date;
}

function StatCard({ icon: Icon, label, value, pulse }: { icon: typeof Users; label: string; value: string | number; pulse?: boolean }) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon size={15} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className={`text-3xl font-black tracking-tight ${pulse ? "animate-pulse-counter" : ""}`}>{value}</p>
    </div>
  );
}

function ConsensusTag({ consensus }: { consensus: string }) {
  const config: Record<string, { icon: typeof Trophy; label: string; className: string }> = {
    clear_winner: { icon: Trophy, label: "Clear winner", className: "text-emerald-700 bg-emerald-50" },
    tight_race: { icon: Minus, label: "Tight race", className: "text-amber-700 bg-amber-50" },
    split_decision: { icon: Equal, label: "Split", className: "text-foreground/60 bg-secondary" },
  };
  const c = config[consensus] || config.split_decision;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${c.className}`}>
      <c.icon size={12} />
      {c.label}
    </span>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] ${className}`}>
      {children}
    </div>
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
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10">
        <div className="h-8 w-1/3 animate-shimmer rounded-xl mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-shimmer rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 animate-shimmer rounded-2xl" />
          <div className="h-64 animate-shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!poll || !analytics) return null;

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-secondary text-muted-foreground" },
    active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
    expired: { label: "Expired", className: "bg-amber-50 text-amber-700" },
    closed: { label: "Closed", className: "bg-red-50 text-red-700" },
  };
  const status = statusConfig[poll.status] || statusConfig.draft;

  const tooltipStyle = {
    borderRadius: 12,
    border: "none",
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
    fontSize: 12,
    fontWeight: 600,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 animate-fade-slide-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tight">{poll.title}</h1>
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${status.className}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {poll.status === "active"
                ? `Live analytics — expires ${new Date(poll.expiresAt).toLocaleString()}`
                : "Your poll performance at a glance."}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-card text-sm font-semibold shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] transition-all">
              <Copy size={14} /> Copy link
            </button>
            {poll.status === "active" && (
              <button onClick={() => handleAction("close")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all">
                <X size={14} /> Close
              </button>
            )}
            {(poll.status === "closed" || poll.status === "expired") && !poll.isPublished && (
              <button onClick={() => handleAction("publish")} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-vs-blue text-white text-sm font-bold hover:opacity-90 transition-all">
                <Share2 size={14} /> Publish
              </button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Responses" value={analytics.totalResponses} pulse={pulseStat} />
          <StatCard icon={Eye} label="Views" value={analytics.views} />
          <StatCard icon={TrendingUp} label="Completion Rate" value={`${analytics.completionRate}%`} />
          <StatCard icon={Clock} label="Resp / Hour" value={analytics.responseRate.toFixed(1)} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {analytics.responseVelocity.length > 0 && (
            <SectionCard className="lg:col-span-2">
              <h3 className="font-bold mb-1">Response Momentum</h3>
              {analytics.peakTime && (
                <p className="text-xs text-muted-foreground mb-4">Peak: {new Date(analytics.peakTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
              )}
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analytics.responseVelocity.map(v => {
                  const d = new Date(v.timestamp);
                  const isDaily = v.timestamp.endsWith("T00:00:00Z");
                  const isMinute = /T\d{2}:\d{2}:00Z$/.test(v.timestamp) && !v.timestamp.endsWith(":00:00Z");
                  const label = isDaily
                    ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    : isMinute
                      ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
                      : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric" });
                  return { ...v, label };
                })}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.15 264)" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="oklch(0.55 0.15 264)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "oklch(0.45 0.02 257)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.45 0.02 257)" }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => [value, "Responses"]} labelFormatter={(label: any) => label} />
                  <Area type="monotone" dataKey="count" stroke="oklch(0.55 0.15 264)" strokeWidth={2.5} fill="url(#colorCount)" dot={{ r: 4, fill: "oklch(0.55 0.15 264)", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          <SectionCard>
            <h3 className="font-bold mb-4">Devices</h3>
            {analytics.deviceBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={analytics.deviceBreakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} strokeWidth={0}>
                      {analytics.deviceBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 mt-3">
                  {analytics.deviceBreakdown.map((d, i) => {
                    const Icon = DEVICE_ICONS[d.type.toLowerCase()] || Monitor;
                    return (
                      <div key={d.type} className="flex items-center gap-2.5 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <Icon size={14} className="text-muted-foreground" />
                        <span className="capitalize">{d.type}</span>
                        <span className="ml-auto font-bold">{d.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
            )}
          </SectionCard>
        </div>

        {/* Question breakdown */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-black tracking-tight">Question Breakdown</h2>
          {analytics.questionSummaries.map((qs) => (
            <SectionCard key={qs.questionId}>
              <div className="flex items-start justify-between mb-5">
                <p className="font-bold">{qs.questionText}</p>
                <ConsensusTag consensus={qs.consensus} />
              </div>
              <ResponsiveContainer width="100%" height={qs.options.length * 48 + 10}>
                <BarChart data={qs.options} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="optionText" tick={{ fontSize: 13, fontWeight: 500 }} width={140} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: any, _: any, props: any) => [`${value} (${props.payload.percentage}%)`, "Votes"]} />
                  <Bar dataKey="count" fill="oklch(0.55 0.15 264)" radius={[0, 8, 8, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          ))}
        </div>

        {/* Engagement + Platforms */}
        {(analytics.questionEngagement.length > 0 || analytics.platformBreakdown.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {analytics.questionEngagement.some((q) => !q.isMandatory) && (
              <SectionCard>
                <h3 className="font-bold mb-4">Question Engagement</h3>
                <div className="space-y-3">
                  {analytics.questionEngagement.filter((q) => !q.isMandatory).map((q) => (
                    <div key={q.questionId}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="truncate mr-3">{q.questionText}</span>
                        <span className="font-bold shrink-0">{q.percentage}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-vs-blue rounded-full transition-all duration-500" style={{ width: `${q.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
            {analytics.platformBreakdown.length > 0 && (
              <SectionCard>
                <h3 className="font-bold mb-4">Platforms</h3>
                <div className="space-y-3">
                  {analytics.platformBreakdown.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-sm py-1">
                      <span>{p.name}</span>
                      <span className="font-bold">{p.count} ({p.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* Activity feed */}
        <SectionCard className="mb-8">
          <h3 className="font-bold mb-4">Activity Feed</h3>
          {activity.length > 0 ? (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm py-2 px-3 rounded-xl hover:bg-secondary transition-colors animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-vs-blue shrink-0" />
                  <span>{item.message}</span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    {item.time.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Waiting for new responses...</p>
          )}
        </SectionCard>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <h3 className="font-bold text-red-600 mb-1">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete this poll and all its responses.</p>
          <button
            onClick={handleDelete}
            className="px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Delete Poll
          </button>
        </div>
      </div>
    </div>
  );
}
