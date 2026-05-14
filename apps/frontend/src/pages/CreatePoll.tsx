import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, ArrowRight, Rocket, Copy, Check, AlertTriangle } from "lucide-react";
import type { Poll, CreatePollInput, CreatePollResponse } from "@versus/shared";

interface QuestionDraft {
  text: string;
  options: { text: string }[];
  isMandatory: boolean;
}

function defaultQuestion(): QuestionDraft {
  return { text: "", options: [{ text: "" }, { text: "" }], isMandatory: true };
}

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function CreatePoll() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showCreatorName, setShowCreatorName] = useState(false);
  const [enableToast, setEnableToast] = useState(false);
  const [slug, setSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [questions, setQuestions] = useState<QuestionDraft[]>([defaultQuestion()]);

  const [savedPoll, setSavedPoll] = useState<Poll | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!expiresAt) e.expiresAt = "Expiry date is required";
    else if (new Date(expiresAt) <= new Date()) e.expiresAt = "Expiry must be in the future";
    if (slug && !/^[a-z0-9-]{3,50}$/.test(slug)) e.slug = "Lowercase letters, numbers, and hyphens only (3-50 chars)";

    questions.forEach((q, qi) => {
      if (!q.text.trim()) e[`q${qi}`] = "Question text is required";
      const validOpts = q.options.filter((o) => o.text.trim());
      if (validOpts.length < 2) e[`q${qi}opts`] = "At least 2 options required";
      q.options.forEach((o, oi) => {
        if (!o.text.trim()) e[`q${qi}o${oi}`] = "Option text is required";
      });
    });

    if (questions.length === 0) e.questions = "Add at least one question";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const updateQuestion = (qi: number, partial: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...partial } : q)));
  };

  const updateOption = (qi: number, oi: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { text } : o)) } : q
      )
    );
  };

  const addOption = (qi: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, { text: "" }] } : q))
    );
  };

  const removeOption = (qi: number, oi: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q
      )
    );
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body: CreatePollInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => ({ text: o.text.trim() })),
          isMandatory: q.isMandatory,
        })),
        isAnonymous,
        showCreatorName,
        enableToast,
        slug: slug.trim() || undefined,
        expiresAt: new Date(expiresAt).toISOString(),
      };

      const data = await api.post<CreatePollResponse>("/vs", body);
      setSavedPoll(data.poll);
      if (data.adminKey) setAdminKey(data.adminKey);
      setStep(2);
      toast.success("Draft saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save poll");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!savedPoll) return;
    setActivating(true);
    try {
      const headers: Record<string, string> = {};
      if (adminKey) headers["x-admin-key"] = adminKey;
      await api.patch(`/vs/${savedPoll._id}/activate`, undefined);
      toast.success("Poll is live!");
      navigate(isAuthenticated ? "/dashboard" : `/vs/${savedPoll.slug || savedPoll.shareId}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to activate poll");
    } finally {
      setActivating(false);
    }
  };

  const copyAdminKey = async () => {
    if (!adminKey) return;
    await navigator.clipboard.writeText(adminKey);
    setCopiedKey(true);
    toast.success("Admin key copied!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const shareUrl = savedPoll
    ? `${window.location.origin}/vs/${savedPoll.slug || savedPoll.shareId}`
    : "";

  if (step === 2 && savedPoll) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-slide-in">
        <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to edit
        </button>

        <h1 className="text-3xl font-black text-gray-900 mb-2">Review Your Poll</h1>
        <p className="text-gray-500 mb-8">Preview how respondents will see your poll before going live.</p>

        {adminKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Save your admin key!</p>
                <p className="text-sm text-amber-700 mt-1">You're not signed in. This key is the only way to manage your poll later.</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="bg-white px-3 py-1.5 rounded-lg text-sm font-mono border border-amber-200 select-all">
                    {adminKey}
                  </code>
                  <button onClick={copyAdminKey} className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                    {copiedKey ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} className="text-amber-700" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated && !adminKey && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-sm text-primary-dark">
            Sign in to unlock full analytics and manage your poll from the dashboard.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{savedPoll.title}</h2>
          {savedPoll.description && <p className="text-gray-500 text-sm mb-4">{savedPoll.description}</p>}

          {savedPoll.questions.map((q, qi) => (
            <div key={q._id} className="mb-6 last:mb-0">
              <p className="font-semibold text-gray-800 mb-3">
                {qi + 1}. {q.text}
                {q.isMandatory && <span className="text-danger ml-1">*</span>}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label key={opt._id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-surface-dark transition-colors cursor-pointer">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    <span className="text-sm text-gray-700">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-xl p-4 mb-6 text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Responses:</span> {savedPoll.isAnonymous ? "Anonymous" : "Authenticated"}</p>
          <p><span className="font-medium">Expires:</span> {new Date(savedPoll.expiresAt).toLocaleString()}</p>
          {savedPoll.slug && <p><span className="font-medium">Custom slug:</span> /vs/{savedPoll.slug}</p>}
          {savedPoll.enableToast && <p><span className="font-medium">Vote toasts:</span> Enabled</p>}
          <p><span className="font-medium">Share link:</span> {shareUrl}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl border border-border font-semibold hover:bg-surface-dark transition-all">
            Edit
          </button>
          <button
            onClick={handleActivate}
            disabled={activating}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            <Rocket size={18} />
            {activating ? "Going live..." : "Go Public"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-slide-in">
      <h1 className="text-3xl font-black text-gray-900 mb-2">Create a Poll</h1>
      <p className="text-gray-500 mb-8">Set up your questions, pick your options, and share with the world.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your poll about?"
            className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
          {errors.title && <p className="text-danger text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional context for your poll..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Questions</h2>
          {errors.questions && <p className="text-danger text-xs">{errors.questions}</p>}

          {questions.map((q, qi) => (
            <div key={qi} className="bg-surface rounded-2xl border border-border p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mt-0.5">
                  {qi + 1}
                </span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                    placeholder="Your question..."
                    className="w-full px-3 py-2 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm bg-white"
                  />
                  {errors[`q${qi}`] && <p className="text-danger text-xs mt-1">{errors[`q${qi}`]}</p>}
                </div>
                {questions.length > 1 && (
                  <button
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                    className="p-1.5 text-gray-400 hover:text-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="ml-10 space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm bg-white"
                    />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(qi, oi)} className="p-1 text-gray-400 hover:text-danger transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                    {errors[`q${qi}o${oi}`] && <p className="text-danger text-xs">{errors[`q${qi}o${oi}`]}</p>}
                  </div>
                ))}
                {errors[`q${qi}opts`] && <p className="text-danger text-xs mt-1">{errors[`q${qi}opts`]}</p>}
                <button
                  onClick={() => addOption(qi)}
                  className="text-xs text-primary font-medium hover:text-primary-dark transition-colors ml-5"
                >
                  + Add option
                </button>
              </div>

              <div className="ml-10 mt-3">
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.isMandatory}
                    onChange={(e) => updateQuestion(qi, { isMandatory: e.target.checked })}
                    className="rounded accent-primary"
                  />
                  Required question
                </label>
              </div>
            </div>
          ))}

          <button
            onClick={() => setQuestions((prev) => [...prev, defaultQuestion()])}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            <Plus size={16} />
            Add question
          </button>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Settings</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-white cursor-pointer hover:bg-surface-dark transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">Anonymous responses</p>
                <p className="text-xs text-gray-500">No login required to vote</p>
              </div>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded accent-primary scale-110"
              />
            </label>

            {isAuthenticated && (
              <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-white cursor-pointer hover:bg-surface-dark transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">Show your name</p>
                  <p className="text-xs text-gray-500">Display creator name on poll</p>
                </div>
                <input
                  type="checkbox"
                  checked={showCreatorName}
                  onChange={(e) => setShowCreatorName(e.target.checked)}
                  className="rounded accent-primary scale-110"
                />
              </label>
            )}

            <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-white cursor-pointer hover:bg-surface-dark transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">Vote toasts</p>
                <p className="text-xs text-gray-500">"Someone just voted!" alerts</p>
              </div>
              <input
                type="checkbox"
                checked={enableToast}
                onChange={(e) => setEnableToast(e.target.checked)}
                className="rounded accent-primary scale-110"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Custom URL slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/vs/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="my-cool-poll"
                className="flex-1 px-3 py-2 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            {errors.slug && <p className="text-danger text-xs mt-1">{errors.slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expires at *</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
            {errors.expiresAt && <p className="text-danger text-xs mt-1">{errors.expiresAt}</p>}
          </div>
        </div>

        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "Saving..." : <>Review <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
