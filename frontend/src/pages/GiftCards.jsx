import { Link } from "react-router-dom";
import { ArrowLeft, Gift, Mail } from "lucide-react";
import { useI18n } from "../lib/i18n";

const AMOUNTS = [25, 50, 100, 200];

export default function GiftCards() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A4A7A] hover:text-[#0E0E52] text-sm mb-10">
          <ArrowLeft size={14} /> {t("giftCards.backHome")}
        </Link>
        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("giftCards.pill")}</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
          {t("giftCards.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-[#4A4A7A] leading-relaxed text-lg">
          {t("giftCards.intro")}
        </p>

        <div className="mt-12 bg-[#0E0E52] rounded-2xl p-8 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-[#CBF3D2] flex items-center justify-center mx-auto mb-6">
            <Gift size={32} className="text-[#0E0E52]" />
          </div>
          <h2 className="font-display text-2xl font-semibold">{t("giftCards.heroTitle")}</h2>
          <p className="mt-2 text-white/70">{t("giftCards.heroText")}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              disabled
              className="rounded-2xl border border-[#0E0E52]/10 bg-white p-5 text-center hover:border-[#CBF3D2] transition-colors disabled:opacity-60"
            >
              <span className="font-display text-2xl font-semibold text-[#0E0E52]">${a}</span>
              <span className="block text-xs text-[#4A4A7A] mt-1">{t("giftCards.card")}</span>
            </button>
          ))}
        </div>

        <div className="mt-10 bg-white rounded-2xl border border-[#0E0E52]/10 p-6">
          <h3 className="font-display text-xl font-semibold text-[#0E0E52] mb-2">{t("giftCards.howTitle")}</h3>
          <ul className="space-y-3 text-[#4A4A7A]">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#CBF3D2] text-[#0E0E52] text-xs flex items-center justify-center shrink-0">1</span>
              {t("giftCards.step1")}
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#CBF3D2] text-[#0E0E52] text-xs flex items-center justify-center shrink-0">2</span>
              {t("giftCards.step2")}
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#CBF3D2] text-[#0E0E52] text-xs flex items-center justify-center shrink-0">3</span>
              {t("giftCards.step3")}
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <a
            href="mailto:hello@anyspot.app"
            className="inline-flex items-center gap-2 text-[#0E0E52] font-medium hover:text-[#FF8552]"
          >
            <Mail size={16} /> {t("giftCards.contact")}
          </a>
        </div>
      </div>
    </div>
  );
}
