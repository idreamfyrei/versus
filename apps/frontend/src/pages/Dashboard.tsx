import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "@/lib/api";
import { Plus, Copy, Check, BarChart3, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PollListItem, PollStatus } from "@versus/shared";

const STATUS_CONFIG: Record<PollStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
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
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
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
    <div className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-all hover:-translate-y-0.5 animate-fade-slide-in flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{poll.title}</h3>
        <span className={`shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
        <span>{poll.responseCount} response{poll.responseCount !== 1 ? "s" : ""}</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        {poll.status === "active" ? (
          <span className="text-emerald-600 font-medium">{timeLeft(poll.expiresAt)}</span>
        ) : (
          <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-3 border-t border-border">
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
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
            >
              <ExternalLink size={14} />
              View
            </Link>
            <Link
              to={`/vs/${poll._id}/analytics`}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
            >
              <BarChart3 size={14} />
              Analytics
            </Link>
          </>
        )}
        <ShareLink shareId={poll.shareId} slug={poll.slug} />
        <button
          onClick={(e) => { e.preventDefault(); onDelete(poll._id); }}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-danger transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="h-5 w-3/4 animate-shimmer rounded mb-3" />
      <div className="h-4 w-1/2 animate-shimmer rounded mb-4" />
      <div className="h-8 w-full animate-shimmer rounded" />
    </div>
  );
}

export function Dashboard() {
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PollStatus | "all">("all");

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

  const filtered = filter === "all" ? polls : polls.filter((p) => p.status === filter);
  const activeCount = polls.filter((p) => p.status === "active").length;
  const totalResponses = polls.reduce((sum, p) => sum + p.responseCount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Your Polls</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} active poll{activeCount !== 1 ? "s" : ""} · {totalResponses} total response{totalResponses !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/vs/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          Create Poll
        </Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === f.value
                ? "bg-primary text-white"
                : "bg-surface-dark text-gray-600 hover:bg-gray-200"
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
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">
            {filter === "all" ? "No polls yet. Create your first one!" : `No ${filter} polls.`}
          </p>
          {filter === "all" && (
            <Link
              to="/vs/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all"
            >
              <Plus size={18} />
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
