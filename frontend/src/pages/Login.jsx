import { useState } from "react";
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { supabase } from "../lib/supabase";
import { api, setDemoToken } from "../lib/api";
import BrandMark from "../components/BrandMark";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";

const demoAccounts = [
  { label: "Admin", email: "admin@anyspot.demo", password: "demo-admin-2024", role: "admin", target: "/admin" },
  { label: "Gym", email: "gym@anyspot.demo", password: "demo-gym-2024", role: "studio", target: "/partner" },
  { label: "User", email: "user@anyspot.demo", password: "demo-user-2024", role: "customer", target: "/dashboard" },
];

export default function Login() {
  const { t } = useI18n();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const roleParam = (searchParams.get("role") || "").toLowerCase();
  const roleIntent = ["studio", "admin"].includes(roleParam) ? roleParam : "customer";
  const defaultTarget = roleIntent === "studio" ? "/partner" : roleIntent === "admin" ? "/admin" : "/dashboard";
  const from = state?.from || defaultTarget;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(state?.error || "");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  const loginAsDemo = async (account) => {
    setError("");
    setDemoLoading(account.label);
    try {
      const { token } = await api.demoLogin(account.email, account.password);
      setDemoToken(token);
      await refresh();
      navigate(account.target, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || t("auth.couldNotSignIn"));
    } finally {
      setDemoLoading(null);
    }
  };

  const signInWithPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message || t("auth.couldNotSignIn"));
      return;
    }

    if (roleIntent === "customer" || roleIntent === "studio") {
      try {
        await api.authUpdateRole(roleIntent);
      } catch {
        // ignore role update errors and continue to app
      }
    }

    if (roleIntent === "studio") {
      try {
        await api.partnerBootstrap({});
      } catch {
        // ignore bootstrap errors and continue to app
      }
    }

    navigate(from, { replace: true });
  };

  const signIn = async () => {
    setError("");
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(roleIntent)}&next=${encodeURIComponent(defaultTarget)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    setLoading(false);

    if (error) {
      setError(error.message || t("auth.couldNotGoogleSignIn"));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#CBF3D2] blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full bg-[#FF8552]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-md mx-auto px-6 pt-16 pb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A4A7A] hover:text-[#0E0E52] text-sm mb-12" data-testid="back-to-home">
          <ArrowLeft size={14} /> {t("auth.backHome")}
        </Link>

        <div className="mb-10">
          <BrandMark iconClassName="w-10 h-10" textClassName="text-[#0E0E52]" />
        </div>

        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("auth.welcomeBack")}</span>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-[#0E0E52]/10 p-1 bg-white">
          <Link
            to="/login?role=customer"
            className={`text-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              roleIntent === "customer" ? "bg-[#0E0E52] text-white" : "text-[#0E0E52] hover:bg-[#0E0E52]/5"
            }`}
          >
            {t("auth.customerLogin")}
          </Link>
          <Link
            to="/login?role=studio"
            className={`text-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              roleIntent === "studio" ? "bg-[#0E0E52] text-white" : "text-[#0E0E52] hover:bg-[#0E0E52]/5"
            }`}
          >
            {t("auth.studioLogin")}
          </Link>
          <Link
            to="/login?role=admin"
            className={`text-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              roleIntent === "admin" ? "bg-[#0E0E52] text-white" : "text-[#0E0E52] hover:bg-[#0E0E52]/5"
            }`}
          >
            {t("auth.adminLogin")}
          </Link>
        </div>
        <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
          {t("auth.signInLead")}<br />
          <span className="italic text-[#FF8552]">{t("auth.anywhere")}</span>.
        </h1>
        <p className="mt-5 text-[#4A4A7A] leading-relaxed">
          {t("auth.signInDescription")}
        </p>
        {roleIntent === "studio" && (
          <p className="mt-2 text-sm text-[#0E0E52]">{t("auth.studioModeLogin")}</p>
        )}

        {error && (
          <p className="mt-6 px-4 py-3 rounded-xl bg-[#FF8552]/10 text-[#FF8552] text-sm" data-testid="login-error">
            {error}
          </p>
        )}

        <form onSubmit={signInWithPassword} className="mt-8 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.email")}
            className="w-full rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.password")}
            className="w-full rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0E0E52] text-white py-3 rounded-full font-medium hover:bg-[#FF8552] transition-colors disabled:opacity-60"
          >
            {loading ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>

        <button
          data-testid="google-signin-btn"
          onClick={signIn}
          disabled={loading}
          className="mt-3 w-full border border-[#0E0E52]/20 text-[#0E0E52] py-3 rounded-full font-medium hover:bg-[#0E0E52]/5 transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#0E0E52"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#0E0E52" opacity=".85"/>
            <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.167.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#0E0E52" opacity=".7"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#0E0E52" opacity=".55"/>
          </svg>
          {t("auth.continueGoogle")}
        </button>

        <div className="mt-6 border-t border-[#0E0E52]/10 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={16} className="text-[#FF8552]" />
            <span className="text-sm font-medium text-[#0E0E52]">Demo accounts</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.label}
                type="button"
                disabled={demoLoading !== null}
                onClick={() => loginAsDemo(account)}
                className="text-center rounded-xl px-2 py-3 text-xs font-medium border border-[#0E0E52]/10 hover:bg-[#CBF3D2]/30 hover:border-[#CBF3D2] transition-colors disabled:opacity-60"
              >
                <span className="block text-[#0E0E52] font-semibold">{account.label}</span>
                <span className="block text-[#4A4A7A] mt-1">{account.email}</span>
                <span className="block text-[#9A9A9A] mt-1">{account.password}</span>
                {demoLoading === account.label && <span className="block text-[#FF8552] mt-1">...</span>}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-[#4A4A7A] text-center">
          {t("auth.newHere")} <Link to={`/signup?role=${roleIntent}`} className="text-[#0E0E52] font-medium hover:text-[#FF8552]">{t("auth.createAccount")}</Link>
        </p>

        <p className="mt-6 text-xs text-[#4A4A7A] text-center">
          {t("auth.bySigningIn")}
        </p>
      </div>
    </div>
  );
}
