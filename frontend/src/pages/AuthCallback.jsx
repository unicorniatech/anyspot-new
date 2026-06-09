import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Sparkles } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const fragment = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(fragment);
    const sessionId = params.get("session_id");

    (async () => {
      if (!sessionId) {
        navigate("/login", { replace: true });
        return;
      }
      try {
        const { user } = await api.exchangeSession(sessionId);
        setUser(user);
        // Clear hash and route to dashboard
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { replace: true, state: { user } });
      } catch (e) {
        navigate("/login", { replace: true, state: { error: "Could not complete sign in." } });
      }
    })();
  }, [navigate, setUser]);

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
