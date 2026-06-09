import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

const AuthCtx = createContext({ user: null, loading: true, refresh: async () => null, logout: async () => {} });

const AUTH_KEY = ["auth-me"];

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  // CRITICAL: If returning from OAuth callback, skip the /me check.
  // AuthCallback will exchange the session_id and establish the session first.
  const skip = typeof window !== "undefined" && window.location.hash?.includes("session_id=");

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_KEY,
    queryFn: () => api.authMe().catch(() => null),
    enabled: !skip,
    staleTime: 0,
    retry: false,
  });

  // When skip is true (OAuth callback), don't show loading state forever
  const loading = skip ? false : isLoading;

  const refresh = async () => {
    const data = await qc.fetchQuery({
      queryKey: AUTH_KEY,
      queryFn: () => api.authMe().catch(() => null),
      staleTime: 0,
    });
    return data;
  };

  const setUser = (u) => qc.setQueryData(AUTH_KEY, u);

  const logout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    qc.setQueryData(AUTH_KEY, null);
  };

  return (
    <AuthCtx.Provider value={{ user: user || null, loading, refresh, setUser, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export { AUTH_KEY };
