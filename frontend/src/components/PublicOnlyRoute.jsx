import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return children;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
