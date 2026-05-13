import { authClient } from "@/lib/auth";

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
  };
}
