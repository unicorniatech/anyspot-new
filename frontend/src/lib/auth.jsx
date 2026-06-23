import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getDemoToken, setDemoToken } from "./api";
import { supabase } from "./supabase";

const AuthCtx = createContext({ user: null, loading: true, refresh: async () => null, logout: async () => {} });

const AUTH_KEY = ["auth-me"];

async function fetchAuthUser() {
  const demoToken = getDemoToken();
  if (demoToken) {
    return api.authMe().catch(() => null);
  }
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return null;
  return api.authMe().catch(() => null);
}

export function AuthProvider({ children }) {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_KEY,
    queryFn: fetchAuthUser,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: AUTH_KEY });
    });
    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, [qc]);

  const loading = isLoading;

  const refresh = async () => {
    const data = await qc.fetchQuery({
      queryKey: AUTH_KEY,
      queryFn: fetchAuthUser,
      staleTime: 0,
    });
    return data;
  };

  const setUser = (u) => qc.setQueryData(AUTH_KEY, u);

  const logout = async () => {
    setDemoToken(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    try { await api.logout(); } catch { /* ignore */ }
    qc.setQueryData(AUTH_KEY, null);
  };

  return (
    <AuthCtx.Provider value={{ user: user || null, loading, refresh, setUser, setDemoToken, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export { AUTH_KEY };
