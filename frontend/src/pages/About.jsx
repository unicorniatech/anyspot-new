import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Target, Users } from "lucide-react";
import { useI18n } from "../lib/i18n";
import BrandMark from "../components/BrandMark";

export default function About() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A4A7A] hover:text-[#0E0E52] text-sm mb-10">
          <ArrowLeft size={14} /> {t("about.backHome")}
        </Link>
        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("about.pill")}</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
          {t("about.title")}
        </h1>
        <p className="mt-6 text-[#4A4A7A] leading-relaxed text-lg">
          {t("about.intro")}
        </p>

        <div className="mt-12 grid sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-[#0E0E52]/10 p-6">
            <div className="w-10 h-10 rounded-full bg-[#CBF3D2] flex items-center justify-center mb-4">
              <Heart size={20} className="text-[#0E0E52]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[#0E0E52]">{t("about.card1Title")}</h3>
            <p className="mt-2 text-sm text-[#4A4A7A]">{t("about.card1Text")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#0E0E52]/10 p-6">
            <div className="w-10 h-10 rounded-full bg-[#FF8552]/20 flex items-center justify-center mb-4">
              <Target size={20} className="text-[#0E0E52]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[#0E0E52]">{t("about.card2Title")}</h3>
            <p className="mt-2 text-sm text-[#4A4A7A]">{t("about.card2Text")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#0E0E52]/10 p-6">
            <div className="w-10 h-10 rounded-full bg-[#0E0E52] flex items-center justify-center mb-4">
              <Users size={20} className="text-white" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[#0E0E52]">{t("about.card3Title")}</h3>
            <p className="mt-2 text-sm text-[#4A4A7A]">{t("about.card3Text")}</p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <BrandMark iconClassName="w-10 h-10 mx-auto" textClassName="text-[#0E0E52] justify-center" />
          <p className="mt-4 text-[#4A4A7A]">{t("about.closing")}</p>
        </div>
      </div>
    </div>
  );
}
