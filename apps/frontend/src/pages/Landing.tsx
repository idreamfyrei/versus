import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Share2, BarChart3, Shield } from "lucide-react";

export function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="overflow-hidden">
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-24">
        <div className="max-w-2xl animate-fade-slide-in">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.1]">
            Decisions,
            <br />
            delivered fast.
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-md">
            The polling platform designed for human connection. Simple sharing, beautiful data, and instant clarity.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to={isAuthenticated ? "/vs/new" : "/vs/new"}
              className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Create a Poll
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl border border-border font-semibold hover:bg-surface-dark transition-all"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Zap,
              stat: "0.5s",
              title: "Flash Setup",
              desc: "Create custom questions in under a minute.",
              color: "text-amber-500",
            },
            {
              icon: Share2,
              title: "Share",
              stat: "1 Link",
              desc: "One link for Slack, WhatsApp, or the world.",
              color: "text-primary",
            },
            {
              icon: BarChart3,
              title: "Live",
              stat: "Real-time",
              desc: "Watch the bars move as the votes roll in.",
              color: "text-primary",
            },
            {
              icon: Shield,
              title: "Secure",
              stat: "Anonymous",
              desc: "Anonymous or authenticated — your choice.",
              color: "text-emerald-500",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-all hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-surface-dark flex items-center justify-center mb-4 ${item.color}`}>
                <item.icon size={24} />
              </div>
              <p className="text-2xl font-bold">{item.stat}</p>
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{item.title}</p>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="bg-white rounded-3xl border border-border p-8 sm:p-12 flex flex-col sm:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              Better than a group chat.
            </h2>
            <p className="mt-4 text-gray-500">
              Versus cleans up the noise. No more scrolling through hundreds of messages to find out where the team wants to go for lunch.
            </p>
            <div className="mt-6 flex gap-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                Instant Results
              </span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                Anonymous
              </span>
            </div>
          </div>
          <div className="flex-1 bg-surface rounded-2xl p-6 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-4">Where are we eating? 🎯</p>
            {[
              { name: "Italian Bistro", pct: 36 },
              { name: "Street Tacos", pct: 46 },
              { name: "Just Coffee", pct: 18 },
            ].map((item) => (
              <div key={item.name} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold text-primary">{item.pct}%</span>
                </div>
                <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full animate-grow-bar"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-3">142 votes · Updates every sec</p>
          </div>
        </div>
      </section>

      <section className="text-center pb-24">
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Ready to clear the air?</h2>
        <Link
          to="/vs/new"
          className="mt-6 inline-block px-8 py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Initialize Your First Poll
        </Link>
      </section>
    </div>
  );
}
