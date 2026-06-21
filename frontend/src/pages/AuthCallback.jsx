import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search || "");
        const roleParam = (params.get("role") || "").toLowerCase();
        const roleIntent = roleParam === "studio" ? "studio" : "customer";
        const next = params.get("next") || (roleIntent === "studio" ? "/partner" : "/dashboard");

        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          navigate("/login", { replace: true, state: { error: "Could not complete sign in." } });
          return;
        }
        if (roleIntent) {
          try {
            await api.authUpdateRole(roleIntent);
          } catch {
            // ignore role update errors and continue
          }
        }
        if (roleIntent === "studio") {
          try {
            await api.partnerBootstrap({});
          } catch {
            // ignore bootstrap errors and continue
          }
        }
        await refresh();
        navigate(next, { replace: true });
      } catch (e) {
        navigate("/login", { replace: true, state: { error: "Could not complete sign in." } });
      }
    })();
  }, [navigate, refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
      <div className="flex items-center gap-3 text-[#0E0E52]">
        <div className="w-10 h-10 rounded-full bg-[#FF8552] flex items-center justify-center text-white animate-pulse">
          <Sparkles size={18} />
        </div>
        <span className="font-display text-xl">Signing you in…</span>
      </div>
    </div>
  );
}
