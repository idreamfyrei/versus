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
    <nav className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary-dark">
          Versus.
        </Link>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-20 rounded-lg animate-shimmer" />
          ) : isAuthenticated ? (
            <>
              <Link
                to="/vs/new"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Plus size={16} />
                Create
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-surface-dark transition-colors"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-surface-dark transition-colors text-gray-500"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/vs/new"
                className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-surface-dark transition-colors"
              >
                Quick Poll
              </Link>
              <Link
                to="/login"
                className="px-4 py-1.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
