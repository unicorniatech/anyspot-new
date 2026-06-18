import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          navigate("/login", { replace: true, state: { error: "Could not complete sign in." } });
          return;
        }
        await refresh();
        navigate("/dashboard", { replace: true });
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
