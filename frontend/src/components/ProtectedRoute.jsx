import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Sparkles } from "lucide-react";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="auth-loading">
        <div className="flex items-center gap-3 text-[#0E0E52]">
          <div className="w-10 h-10 rounded-full bg-[#CBF3D2] flex items-center justify-center text-[#FF8552] animate-pulse">
            <Sparkles size={18} />
          </div>
          <span className="font-display text-lg">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
