import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Copy, Check, BarChart3, ExternalLink, Trash2, Inbox, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { PollListItem, PollStatus } from "@versus/shared";

const STATUS_CONFIG: Record<PollStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-secondary text-muted-foreground" },
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
  expired: { label: "Expired", className: "bg-amber-50 text-amber-700" },
  closed: { label: "Closed", className: "bg-red-50 text-red-700" },
};

const FILTERS: { label: string; value: PollStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Expired", value: "expired" },
  { label: "Closed", value: "closed" },
];

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function ShareLink({ shareId, slug }: { shareId: string; slug?: string }) {
  const [copied, setCopied] = useState(false);
  const path = slug || shareId;
  const url = `${window.location.origin}/vs/${path}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); copy(); }}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function PollCard({ poll, onDelete }: { poll: PollListItem; onDelete: (id: string) => void }) {
  const status = STATUS_CONFIG[poll.status];
  const slug = poll.slug || poll.shareId;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)] transition-all duration-200 hover:-translate-y-0.5 animate-fade-slide-in flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-lg leading-tight line-clamp-2">{poll.title}</h3>
        <span className={`shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
        <span>{poll.responseCount} response{poll.responseCount !== 1 ? "s" : ""}</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        {poll.status === "active" ? (
          <span className="text-emerald-600 font-medium">{timeLeft(poll.expiresAt)}</span>
        ) : (
          <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-4 pt-3 border-t border-border">
        {poll.status === "draft" ? (
          <Link
            to={`/vs/new?edit=${poll._id}`}
            className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Continue editing
          </Link>
        ) : (
          <>
            <Link
              to={`/vs/${slug}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink size={14} />
              View
            </Link>
            <Link
              to={`/vs/${poll._id}/analytics`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <BarChart3 size={14} />
              Analytics
            </Link>
          </>
        )}
        <ShareLink shareId={poll.shareId} slug={poll.slug} />
        <button
          onClick={(e) => { e.preventDefault(); onDelete(poll._id); }}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-danger transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="h-5 w-3/4 animate-shimmer rounded mb-3" />
      <div className="h-4 w-1/2 animate-shimmer rounded mb-4" />
      <div className="h-8 w-full animate-shimmer rounded" />
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PollStatus | "all">("all");
  const [showClaim, setShowClaim] = useState(false);
  const [claimAdminKey, setClaimAdminKey] = useState("");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    api.get<PollListItem[]>("/vs").then(setPolls).catch(() => toast.error("Failed to load polls")).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this poll? This cannot be undone.")) return;
    try {
      await api.del(`/vs/${id}`);
      setPolls((prev) => prev.filter((p) => p._id !== id));
      toast.success("Poll deleted");
    } catch {
      toast.error("Failed to delete poll");
    }
  };

  const handleClaim = async () => {
    if (!claimAdminKey.trim()) {
      toast.error("Admin key is required");
      return;
    }
    setClaiming(true);
    try {
      await api.post("/vs/claim", { adminKey: claimAdminKey.trim() });
      toast.success("Poll claimed! It now appears in your dashboard.");
      setShowClaim(false);
      setClaimAdminKey("");
      const updated = await api.get<PollListItem[]>("/vs");
      setPolls(updated);
    } catch (err: any) {
      toast.error(err?.message || "Failed to claim poll. Check your admin key.");
    } finally {
      setClaiming(false);
    }
  };

  const filtered = filter === "all" ? polls : polls.filter((p) => p.status === filter);
  const activeCount = polls.filter((p) => p.status === "active").length;
  const totalResponses = polls.reduce((sum, p) => sum + p.responseCount, 0);
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 animate-fade-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Hey, {firstName}</h1>
          <p className="text-muted-foreground mt-1">
            {polls.length === 0
              ? "You haven't created any polls yet. Let's change that."
              : `${activeCount} active poll${activeCount !== 1 ? "s" : ""} collecting ${totalResponses} total response${totalResponses !== 1 ? "s" : ""}.`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowClaim((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border font-semibold text-sm hover:bg-secondary transition-all"
          >
            <KeyRound size={16} />
            Claim Poll
          </button>
          <Link
            to="/vs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-sm tracking-wide hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            New Poll
          </Link>
        </div>
      </div>

      {showClaim && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-8 animate-fade-slide-in">
          <div className="flex items-start gap-3 mb-4">
            <KeyRound size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Claim an anonymous poll</p>
              <p className="text-xs text-muted-foreground mt-0.5">Created a poll without signing in? Paste your admin key to link it to your account.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Paste your admin key"
              value={claimAdminKey}
              onChange={(e) => setClaimAdminKey(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-5 py-2.5 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60"
            >
              {claiming ? "Claiming..." : "Claim"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === f.value
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:bg-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 animate-fade-slide-in">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-5">
            <Inbox size={28} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {filter === "all" ? "No polls yet" : `No ${filter} polls`}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {filter === "all"
              ? "Create your first poll and share it with your team, friends, or the internet."
              : "Try a different filter or create a new poll."}
          </p>
          {filter === "all" && (
            <Link
              to="/vs/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all"
            >
              <Plus size={16} />
              Create Your First Poll
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((poll) => (
              <PollCard key={poll._id} poll={poll} onDelete={handleDelete} />
            ))}
        </div>
      )}
    </div>
  );
}
