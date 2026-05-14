import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-slide-in">
      <p className="text-8xl font-black text-foreground/5 mb-4">404</p>
      <h1 className="text-2xl font-black tracking-tight mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>
    </div>
  );
}
