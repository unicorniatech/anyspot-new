import "@/index.css";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import Explore from "@/pages/Explore";
import StudioProfile from "@/pages/StudioProfile";
import Dashboard from "@/pages/Dashboard";
import Partner from "@/pages/Partner";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import { AuthProvider } from "@/lib/auth";

function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function AppRouter() {
  // CRITICAL: detect OAuth callback synchronously (not in useEffect) to prevent race conditions.
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/studio/:id" element={<StudioProfile />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner"
          element={
            <ProtectedRoute>
              <Partner />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
