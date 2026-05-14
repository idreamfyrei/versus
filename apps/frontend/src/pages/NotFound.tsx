import { Link } from "react-router";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fade-slide-in">
      <p className="text-7xl font-black text-gray-200 mb-2">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Back to home
      </Link>
    </div>
  );
}
