import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth";
import { LogOut, LayoutDashboard, Plus } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-black tracking-tight">
          VERSUS.
        </Link>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-20 rounded-full animate-shimmer" />
          ) : isAuthenticated ? (
            <>
              <Link
                to="/vs/new"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold tracking-wide rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                <Plus size={15} />
                CREATE
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full hover:bg-secondary transition-colors"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground"
                title="Log out"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold tracking-wide hover:opacity-60 transition-opacity"
              >
                LOG IN
              </Link>
              <Link
                to="/vs/new"
                className="rounded-full bg-foreground px-6 py-2.5 text-sm font-bold tracking-wide text-background hover:opacity-90 transition-opacity"
              >
                QUICK POLL
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
