import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { usePollSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { Clock, Users, CheckCircle, LogIn, Trophy, Minus, Equal } from "lucide-react";
import type { PublicPollView, QuestionSummary, SocketResponsePayload, SocketToastPayload, SocketStatusPayload } from "@versus/shared";

function ConsensusLabel({ consensus }: { consensus: QuestionSummary["consensus"] }) {
  const config = {
    clear_winner: { icon: Trophy, label: "Clear winner", className: "text-emerald-600" },
    tight_race: { icon: Minus, label: "Tight race", className: "text-amber-600" },
    split_decision: { icon: Equal, label: "Split decision", className: "text-gray-500" },
  };
  const c = config[consensus];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.className}`}>
      <c.icon size={12} />
      {c.label}
    </span>
  );
}

function ResultsView({ results, questions }: { results: NonNullable<PublicPollView["results"]>; questions: PublicPollView["poll"]["questions"] }) {
  return (
    <div className="space-y-6">
      {results.questionSummaries.map((qs) => {
        const question = questions.find((q) => q._id === qs.questionId);
        const maxCount = Math.max(...qs.options.map((o) => o.count), 1);
        return (
          <div key={qs.questionId} className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between mb-4">
              <p className="font-semibold text-gray-900">{qs.questionText || question?.text}</p>
              <ConsensusLabel consensus={qs.consensus} />
            </div>
            <div className="space-y-3">
              {qs.options.map((opt) => {
                const isWinner = opt.count === maxCount && opt.count > 0;
                return (
                  <div key={opt.optionId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`${isWinner ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {opt.optionText}
                        {isWinner && " ✦"}
                      </span>
                      <span className="font-semibold text-primary">{opt.percentage}%</span>
                    </div>
                    <div className="h-2.5 bg-surface-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full animate-grow-bar transition-all duration-500 ${isWinner ? "bg-primary" : "bg-primary/40"}`}
                        style={{ width: `${opt.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">{qs.totalAnswers} answer{qs.totalAnswers !== 1 ? "s" : ""}</p>
          </div>
        );
      })}
      <div className="text-center text-sm text-gray-400 py-2">
        {results.summary || `${results.totalResponses} response${results.totalResponses !== 1 ? "s" : ""} collected`}
      </div>
    </div>
  );
}

function SkeletonPoll() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="h-8 w-2/3 animate-shimmer rounded" />
      <div className="h-4 w-1/3 animate-shimmer rounded" />
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-border p-6">
          <div className="h-5 w-3/4 animate-shimmer rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 animate-shimmer rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PollPage() {
  const { slugOrId } = useParams();
  const [searchParams] = useSearchParams();
  const adminKeyParam = searchParams.get("key");
  const { isAuthenticated } = useAuth();

  const [data, setData] = useState<PublicPollView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const pollId = data?.poll._id;
  const socket = usePollSocket(pollId);

  const fetchPoll = useCallback(async () => {
    try {
      const url = adminKeyParam ? `/vs/${slugOrId}?key=${adminKeyParam}` : `/vs/${slugOrId}`;
      const result = await api.get<PublicPollView>(url);
      setData(result);
    } catch (err: any) {
      if (err?.code === "POLL_NOT_FOUND" || err?.code === "POLL_DRAFT") {
        setNotFound(true);
      } else {
        toast.error(err?.message || "Failed to load poll");
      }
    } finally {
      setLoading(false);
    }
  }, [slugOrId, adminKeyParam]);

  useEffect(() => { fetchPoll(); }, [fetchPoll]);

  useEffect(() => {
    if (!socket) return;

    const handleNewResponse = (payload: SocketResponsePayload) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          results: prev.results
            ? { ...prev.results, totalResponses: payload.totalResponses, questionSummaries: payload.questionSummaries }
            : { totalResponses: payload.totalResponses, questionSummaries: payload.questionSummaries, summary: "" },
        };
      });
    };

    const handleToast = (payload: SocketToastPayload) => {
      toast(payload.message, { icon: "🗳️" });
    };

    const handleStatus = (payload: SocketStatusPayload) => {
      setData((prev) => prev ? { ...prev, poll: { ...prev.poll, status: payload.status as any } } : prev);
      if (payload.status === "closed" || payload.status === "expired") {
        toast.info("This poll has been closed.");
      }
    };

    const handleDeleted = () => {
      toast.error("This poll has been deleted.");
      setNotFound(true);
    };

    socket.on("response:new", handleNewResponse);
    socket.on("toast:vote:updates", handleToast);
    socket.on("poll:closed", handleStatus);
    socket.on("poll:published", handleStatus);
    socket.on("poll:deleted", handleDeleted);

    return () => {
      socket.off("response:new", handleNewResponse);
      socket.off("toast:vote:updates", handleToast);
      socket.off("poll:closed", handleStatus);
      socket.off("poll:published", handleStatus);
      socket.off("poll:deleted", handleDeleted);
    };
  }, [socket]);

  const handleSubmit = async () => {
    if (!data) return;
    const missing = data.poll.questions.filter((q) => q.isMandatory && !answers[q._id]);
    if (missing.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }
    setSubmitting(true);
    try {
      const answersArr = Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }));
      await api.post(`/vs/${slugOrId}/respond`, { answers: answersArr });
      toast.success("Response submitted!");
      setData((prev) => prev ? { ...prev, hasResponded: true } : prev);
      fetchPoll();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonPoll />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-slide-in">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Poll not found</h1>
        <p className="text-gray-500 mb-6">This poll doesn't exist or hasn't been published yet.</p>
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all">
          Go home
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { poll, hasResponded, canClaim, results } = data;
  const isActive = poll.status === "active";
  const isClosed = poll.status === "closed" || poll.status === "expired";
  const needsAuth = isActive && !poll.isAnonymous && !isAuthenticated;
  const canRespond = isActive && !hasResponded && !needsAuth;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-slide-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 mb-2">{poll.title}</h1>
        {poll.description && <p className="text-gray-500">{poll.description}</p>}
        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {isClosed ? "Closed" : `Expires ${new Date(poll.expiresAt).toLocaleDateString()}`}
          </span>
          {results && (
            <span className="flex items-center gap-1">
              <Users size={14} />
              {results.totalResponses} vote{results.totalResponses !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {canClaim && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-primary-dark font-medium">
            This is your poll!{" "}
            <Link to="/login" className="underline hover:text-primary">Sign in</Link>{" "}
            to claim it and access full analytics.
          </p>
        </div>
      )}

      {needsAuth && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <LogIn size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Sign in to respond</p>
            <p className="text-sm text-amber-700">This poll requires authentication to vote.</p>
          </div>
          <Link to="/login" className="ml-auto px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all shrink-0">
            Sign in
          </Link>
        </div>
      )}

      {hasResponded && !isClosed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">You've already responded. Here are the live results:</p>
        </div>
      )}

      {(hasResponded || isClosed || poll.isPublished) && results ? (
        <ResultsView results={results} questions={poll.questions} />
      ) : canRespond ? (
        <div className="space-y-6">
          {poll.questions.map((q, qi) => (
            <div key={q._id} className="bg-white rounded-2xl border border-border p-5">
              <p className="font-semibold text-gray-900 mb-4">
                {qi + 1}. {q.text}
                {q.isMandatory && <span className="text-danger ml-1">*</span>}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      answers[q._id] === opt._id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:bg-surface-dark"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      answers[q._id] === opt._id ? "border-primary" : "border-gray-300"
                    }`}>
                      {answers[q._id] === opt._id && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm text-gray-700">{opt.text}</span>
                    <input
                      type="radio"
                      name={q._id}
                      value={opt._id}
                      checked={answers[q._id] === opt._id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: opt._id }))}
                      className="sr-only"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full px-5 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Response"}
          </button>
        </div>
      ) : needsAuth ? (
        <div className="space-y-6">
          {poll.questions.map((q, qi) => (
            <div key={q._id} className="bg-white rounded-2xl border border-border p-5 opacity-60">
              <p className="font-semibold text-gray-900 mb-4">
                {qi + 1}. {q.text}
                {q.isMandatory && <span className="text-danger ml-1">*</span>}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <div key={opt._id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span className="text-sm text-gray-700">{opt.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
