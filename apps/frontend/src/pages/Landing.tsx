import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import {
  Plus, Share2, BarChart3, FileText, Zap, Users, Clock,
  ShieldCheck, Link2, Sparkles, ArrowRight,
} from "lucide-react";

/* ── Wave background ── */

function WaveBg() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg
        viewBox="0 0 1920 1200"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M -200 600 Q 400 200 900 700 T 2100 500"
          stroke="oklch(0.75 0.01 250)"
          strokeWidth="80"
          fill="none"
          strokeLinecap="round"
          className="animate-wave-draw"
        />
        <path
          d="M -200 900 Q 600 1200 1200 800 T 2200 1000"
          stroke="oklch(0.8 0.01 250)"
          strokeWidth="70"
          fill="none"
          strokeLinecap="round"
          className="animate-wave-draw-delay"
        />
      </svg>
    </div>
  );
}

/* ── Tilt card ── */

interface CardProps {
  variant: "light" | "blue" | "pink" | "blue-alt";
  badge?: string;
  metric: string;
  metricSuffix?: string;
  subtitle: string;
  desc: string;
  icon: React.ReactNode;
  delay: number;
}

const cardStyles = {
  light: {
    bg: "bg-card",
    text: "text-card-foreground",
    sub: "text-muted-foreground",
    label: "bg-foreground/5 text-foreground/70",
    icon: "border-foreground/20 text-foreground",
    pulse: "oklch(0.12 0.01 250 / 0.15)",
  },
  blue: {
    bg: "bg-vs-blue",
    text: "text-white",
    sub: "text-white/70",
    label: "bg-white/15 text-white/85",
    icon: "border-white/40 text-white",
    pulse: "oklch(1 0 0 / 0.25)",
  },
  pink: {
    bg: "bg-vs-pink",
    text: "text-foreground",
    sub: "text-foreground/60",
    label: "bg-foreground/10 text-foreground/70",
    icon: "border-foreground/25 text-foreground",
    pulse: "oklch(0.12 0.01 250 / 0.12)",
  },
  "blue-alt": {
    bg: "bg-vs-blue",
    text: "text-white",
    sub: "text-white/70",
    label: "bg-white/15 text-white/85",
    icon: "border-white/40 text-white",
    pulse: "oklch(1 0 0 / 0.25)",
  },
};

function BentoCard({ variant, badge, metric, metricSuffix, subtitle, desc, icon, delay }: CardProps) {
  const s = cardStyles[variant];
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: ny * 12, y: nx * -12 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={`group relative flex h-[380px] flex-col rounded-3xl p-7 ${s.bg} ${s.text} shadow-[0_20px_60px_-20px_rgba(0,0,0,0.2)] cursor-pointer overflow-hidden animate-slide-up`}
      style={{
        animationDelay: `${delay}ms`,
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.15s ease-out",
      }}
    >
      {badge && (
        <span className="absolute right-5 top-5 rounded-full bg-foreground px-3 py-1 text-[10px] font-bold tracking-widest text-white z-10"
          style={{ transform: "translateZ(40px)" }}
        >
          {badge}
        </span>
      )}

      <div className="flex flex-1 items-center justify-center" style={{ transform: "translateZ(50px)" }}>
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed ${s.icon} bg-white/10 transition-all duration-500 group-hover:rotate-[8deg] group-hover:scale-110 group-hover:shadow-[0_0_30px_var(--pulse-color)]`}
          style={{ "--pulse-color": s.pulse } as React.CSSProperties}
        >
          {icon}
        </div>
      </div>

      <div style={{ transform: "translateZ(30px)" }} className="space-y-2">
        <div className="text-3xl font-black tracking-tight">
          {metric}
          {metricSuffix && <span className="ml-1">{metricSuffix}</span>}
        </div>
        <div className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${s.label}`}>
          {subtitle}
        </div>
        <p className={`text-sm leading-relaxed ${s.sub}`}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Count-up hook ── */

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || started.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const elapsed = now - t0 - delay;
          if (elapsed < 0) { requestAnimationFrame(tick); return; }
          const p = Math.min(elapsed / duration, 1);
          setCount(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration, delay]);

  return { count, ref: elRef };
}

/* ── Poll bar ── */

function PollBar({ label, value, delay, color }: { label: string; value: number; delay: number; color: string }) {
  const { count, ref } = useCountUp(value, 1000, delay);

  return (
    <div ref={ref} className="relative flex h-12 items-center overflow-hidden rounded-full bg-secondary">
      <div
        className="absolute inset-y-0 left-0 rounded-full animate-bar-fill"
        style={{
          "--bar-width": `${value}%`,
          width: `${value}%`,
          backgroundColor: color,
          animationDelay: `${delay}ms`,
        } as React.CSSProperties}
      />
      <span className="relative z-10 px-5 text-sm font-semibold">{label}</span>
      <span className="relative z-10 ml-auto px-5 text-sm font-bold text-vs-blue">{count}%</span>
    </div>
  );
}

/* ── Step card ── */

function StepCard({ n, icon, title, desc, color, delay }: {
  n: string; icon: React.ReactNode; title: string; desc: string; color: string; delay: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-3xl bg-card p-8 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.12)] cursor-pointer transition-all duration-300 hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.2)] hover:-translate-y-2 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute right-6 top-6 text-5xl font-black text-foreground/5 transition-colors group-hover:text-foreground/10">
        {n}
      </span>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} transition-transform duration-400 group-hover:rotate-[-8deg] group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="mt-6 text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

/* ── Feature item ── */

function FeatureItem({ icon, title, desc, delay }: {
  icon: React.ReactNode; title: string; desc: string; delay: number;
}) {
  return (
    <div
      className="group flex gap-4 rounded-2xl bg-card p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] cursor-pointer transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground/70 transition-colors duration-300 group-hover:bg-vs-blue group-hover:text-white">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold tracking-tight">{title}</h4>
        <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

/* ── Page ── */

export function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <WaveBg />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-8 pt-12 pb-20">
          <h1 className="max-w-4xl text-5xl sm:text-6xl md:text-8xl font-black leading-[0.95] tracking-[-0.04em] animate-slide-up">
            {"Decisions, delivered fast.".split(" ").map((word, i) => (
              <span
                key={i}
                className="mr-4 inline-block animate-slide-up"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            className="mt-6 max-w-md text-base font-semibold leading-relaxed text-foreground animate-slide-up"
            style={{ animationDelay: "600ms" }}
          >
            Create polls, share a link, get answers. Versus turns messy group decisions into clean, real-time results.
          </p>

          <div className="mt-8 flex gap-3 animate-slide-up" style={{ animationDelay: "700ms" }}>
            <Link
              to="/vs/new"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold tracking-wide text-background transition-all duration-200 hover:scale-[1.04] active:scale-[0.96] hover:shadow-lg"
            >
              CREATE POLL
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="rounded-full border border-border bg-card px-7 py-3.5 text-sm font-bold tracking-wide transition-all duration-200 hover:scale-[1.04] active:scale-[0.96] hover:shadow-md"
              >
                SIGN UP
              </Link>
            )}
          </div>

          {/* Bento cards */}
          <div className="mt-20 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <BentoCard
              variant="light"
              metric="0.5s"
              subtitle="Flash Setup"
              desc="Create custom questions in under a minute."
              icon={
                <div className="text-center text-[10px] font-bold leading-tight">
                  <Plus className="mx-auto h-4 w-4" />
                  CREATE<br />POLL
                </div>
              }
              delay={0}
            />
            <BentoCard
              variant="blue"
              badge="POPULAR"
              metric="∞"
              metricSuffix="Share"
              subtitle="Public Links"
              desc="One link for Slack, WhatsApp, or the world."
              icon={<Share2 className="h-7 w-7" />}
              delay={100}
            />
            <BentoCard
              variant="pink"
              metric="Live"
              subtitle="Real-Time Pulse"
              desc="Watch the bars move as the votes roll in."
              icon={<BarChart3 className="h-7 w-7" />}
              delay={200}
            />
            <BentoCard
              variant="blue-alt"
              metric="HD"
              metricSuffix="Data"
              subtitle="Detailed Analytics"
              desc="Demographics, trends, and rich insights."
              icon={<FileText className="h-7 w-7" />}
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ── Versus the group chat ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-8 pb-24">
        <div className="grid grid-cols-1 gap-10 rounded-[2.5rem] bg-card p-8 sm:p-10 md:grid-cols-2 md:p-16 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div>
            <h2 className="text-5xl font-black leading-[1] tracking-[-0.04em] md:text-6xl">
              Versus the<br />group chat.
            </h2>
            <p className="mt-6 max-w-md font-medium leading-relaxed text-foreground/85">
              No more "where should we eat?" threads with 47 replies and zero consensus. One poll. One link. Done.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-vs-blue px-5 py-2.5 text-xs font-bold tracking-widest text-white">
                INSTANT RESULTS
              </span>
              <span className="rounded-full bg-vs-pink px-5 py-2.5 text-xs font-bold tracking-widest text-foreground">
                ANONYMOUS
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-background p-8 shadow-sm animate-scale-in" style={{ animationDelay: "400ms" }}>
            <h3 className="text-lg font-bold">Friday lunch showdown 🍕</h3>
            <div className="mt-6 space-y-3">
              <PollBar label="Sushi Place" value={52} delay={500} color="oklch(0.5 0.24 264 / 0.2)" />
              <PollBar label="Taco Truck" value={31} delay={650} color="oklch(0.5 0.24 264 / 0.15)" />
              <PollBar label="Just Coffee" value={17} delay={800} color="oklch(0.5 0.24 264 / 0.1)" />
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot" />
                <p className="text-xs font-semibold text-foreground/60">
                  <span className="text-foreground">248</span> votes · Updates live
                </p>
              </div>
              <div className="flex -space-x-1.5">
                {["bg-vs-blue", "bg-emerald-400", "bg-amber-400", "bg-rose-400"].map((c, i) => (
                  <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-background`} />
                ))}
                <div className="w-5 h-5 rounded-full bg-secondary border-2 border-background text-[8px] font-bold text-muted-foreground flex items-center justify-center">
                  +5
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Three steps ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-8 pb-24">
        <div>
          <div className="text-center animate-slide-up">
            <h2 className="text-5xl font-black tracking-[-0.04em] md:text-6xl">Three steps. Zero friction.</h2>
            <p className="mt-4 font-medium text-muted-foreground">From question to answer in under a minute.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            <StepCard
              n="01"
              icon={<Zap className="h-5 w-5 text-vs-blue" />}
              color="bg-[oklch(0.5_0.24_264_/_0.12)]"
              title="Build your poll"
              desc="Add questions, set options, pick who can vote. Draft it, tweak it, make it yours."
              delay={100}
            />
            <StepCard
              n="02"
              icon={<Share2 className="h-5 w-5 text-emerald-600" />}
              color="bg-emerald-100"
              title="Drop the link"
              desc="One URL goes everywhere — Slack, iMessage, email, social. No app install needed."
              delay={200}
            />
            <StepCard
              n="03"
              icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
              color="bg-amber-100"
              title="Watch it live"
              desc="Results stream in real-time. See who's winning, spot trends, declare a winner."
              delay={300}
            />
          </div>

          {/* Feature grid */}
          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
            <FeatureItem icon={<Users className="h-4 w-4" />} title="Anonymous or Auth'd" desc="Let anyone vote or require sign-in. Your poll, your rules." delay={0} />
            <FeatureItem icon={<Clock className="h-4 w-4" />} title="Auto-Expiry" desc="Set a deadline and walk away. Versus handles the rest." delay={50} />
            <FeatureItem icon={<ShieldCheck className="h-4 w-4" />} title="Duplicate Prevention" desc="One vote per person. Fingerprinting keeps it honest." delay={100} />
            <FeatureItem icon={<Link2 className="h-4 w-4" />} title="Custom Slugs" desc="Brand your poll URL. /vs/friday-lunch hits different." delay={150} />
            <FeatureItem icon={<BarChart3 className="h-4 w-4" />} title="Rich Analytics" desc="Device stats, response velocity, engagement metrics — all live." delay={200} />
            <FeatureItem icon={<Sparkles className="h-4 w-4" />} title="FOMO Toasts" desc={`"Someone just voted!" — subtle nudges that boost participation.`} delay={250} />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-8 pb-32">
        <div className="mx-auto max-w-3xl text-center animate-slide-up">
          <h2 className="text-6xl font-black tracking-[-0.04em] md:text-7xl">Ready to settle it?</h2>
          <p className="mt-4 font-medium text-muted-foreground">Create your first poll in seconds. No account needed.</p>
          <Link
            to="/vs/new"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-vs-blue px-8 py-4 text-base font-bold text-white shadow-[0_15px_40px_-10px_oklch(0.5_0.24_264_/_0.4)] transition-all duration-200 hover:scale-[1.05] hover:-translate-y-0.5 active:scale-[0.97]"
          >
            Start Your First Versus
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
