import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { api } from "../lib/api";
import BrandMark from "../components/BrandMark";
import { useI18n } from "../lib/i18n";

export default function Signup() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = (searchParams.get("role") || "").toLowerCase();
  const roleIntent = roleParam === "studio" ? "studio" : "customer";
  const defaultTarget = roleIntent === "studio" ? "/partner" : "/dashboard";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studioName, setStudioName] = useState("");
  const [studioAddress, setStudioAddress] = useState("");
  const [studioPhone, setStudioPhone] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const signUpWithPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(roleIntent)}&next=${encodeURIComponent(defaultTarget)}`;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: roleIntent, phone: phone.trim() },
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || t("auth.couldNotCreateAccount"));
      return;
    }

    if (!data?.session) {
      setMessage(t("auth.accountCreatedCheckEmail"));
      return;
    }

    if (roleIntent) {
      try {
        await api.authUpdateRole(roleIntent);
      } catch {
        // ignore role update errors and continue to app
      }
    }

    if (phone.trim()) {
      try {
        await api.updateMe({ phone: phone.trim() });
      } catch {
        // ignore profile update errors and continue to app
      }
    }

    if (roleIntent === "studio") {
      try {
        await api.partnerBootstrap({
          studio_name: studioName.trim(),
          address: studioAddress.trim(),
          contact_name: name.trim(),
          contact_phone: studioPhone.trim() || phone.trim(),
        });
      } catch {
        // ignore bootstrap errors and continue to partner where user can retry onboarding
      }
    }

    navigate(defaultTarget, { replace: true });
  };

  const signUpWithGoogle = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(roleIntent)}&next=${encodeURIComponent(defaultTarget)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { role: roleIntent } },
    });

    setLoading(false);

    if (oauthError) {
      setError(oauthError.message || t("auth.couldNotGoogleSignUp"));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#CBF3D2] blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full bg-[#FF8552]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-md mx-auto px-6 pt-16 pb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A4A7A] hover:text-[#0E0E52] text-sm mb-12">
          <ArrowLeft size={14} /> {t("auth.backHome")}
        </Link>

        <div className="mb-10">
          <BrandMark iconClassName="w-10 h-10" textClassName="text-[#0E0E52]" />
        </div>

        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("auth.getStarted")}</span>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-[#0E0E52]/10 p-1 bg-white">
          <Link
            to="/signup?role=customer"
            className={`text-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              roleIntent === "customer" ? "bg-[#0E0E52] text-white" : "text-[#0E0E52] hover:bg-[#0E0E52]/5"
            }`}
          >
            {t("auth.iAmCustomer")}
          </Link>
          <Link
            to="/signup?role=studio"
            className={`text-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              roleIntent === "studio" ? "bg-[#0E0E52] text-white" : "text-[#0E0E52] hover:bg-[#0E0E52]/5"
            }`}
          >
            {t("auth.iOwnStudio")}
          </Link>
        </div>
        <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
          {t("auth.createAccountLead")}<br />
          <span className="italic text-[#FF8552]">{t("auth.anyspotAccount")}</span>
        </h1>
        <p className="mt-5 text-[#4A4A7A] leading-relaxed">
          {t("auth.signupDescription")}
        </p>
        {roleIntent === "studio" && (
          <p className="mt-2 text-sm text-[#0E0E52]">{t("auth.studioModeSignup")}</p>
        )}

        {error && (
          <p className="mt-6 px-4 py-3 rounded-xl bg-[#FF8552]/10 text-[#FF8552] text-sm">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-6 px-4 py-3 rounded-xl bg-[#CBF3D2]/60 text-[#0E0E52] text-sm">
            {message}
          </p>
        )}

        <form onSubmit={signUpWithPassword} className="mt-8 space-y-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("auth.fullName")}
            className="w-full rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("auth.phoneOptional")}
            className="w-full rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
          />
          {roleIntent === "studio" && (
            <>
              <input
                type="text"
                required
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder={t("auth.studioName")}
                className="w-full rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
              />
              <input
                type="text"
                required
                value={studioAddress}
                onChange={(e) => setStudioAddress(e.target.value)}
                placeholder={t("auth.studioAddress")}
                className="w-full rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
              />
              <input
                type="tel"
                value={studioPhone}
                onChange={(e) => setStudioPhone(e.target.value)}
                placeholder={t("auth.studioPhoneOptional")}
                className="w-full rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
              />
            </>
          )}
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
            minLength={6}
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
            {loading ? t("auth.creatingAccount") : t("auth.createAccountBtn")}
          </button>
        </form>

        <button
          onClick={signUpWithGoogle}
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

        <p className="mt-4 text-sm text-[#4A4A7A] text-center">
          {t("auth.alreadyHaveAccount")} <Link to={`/login?role=${roleIntent}`} className="text-[#0E0E52] font-medium hover:text-[#FF8552]">{t("auth.signInLink")}</Link>
        </p>
      </div>
    </div>
  );
}
