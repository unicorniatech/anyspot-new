import { Link } from "react-router-dom";
import { ArrowLeft, Dumbbell, Sparkles } from "lucide-react";
import { useI18n } from "../lib/i18n";

const CATEGORIES = [
  { key: "yoga", icon: "🧘" },
  { key: "pilates", icon: "🤸" },
  { key: "hiit", icon: "🔥" },
  { key: "cycling", icon: "🚴" },
  { key: "strength", icon: "🏋️" },
  { key: "dance", icon: "💃" },
];

export default function Classes() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A4A7A] hover:text-[#0E0E52] text-sm mb-10">
          <ArrowLeft size={14} /> {t("classes.backHome")}
        </Link>
        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("classes.pill")}</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
          {t("classes.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-[#4A4A7A] leading-relaxed text-lg">
          {t("classes.intro")}
        </p>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to={`/explore?category=${c.key}`}
              className="bg-white rounded-2xl border border-[#0E0E52]/10 p-6 hover:-translate-y-1 hover:border-[#CBF3D2] transition-all"
            >
              <div className="text-3xl mb-4">{c.icon}</div>
              <h3 className="font-display text-xl font-semibold text-[#0E0E52]">{t(`classes.${c.key}`)}</h3>
              <p className="mt-2 text-sm text-[#4A4A7A]">{t(`classes.${c.key}Desc`)}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-[#0E0E52] rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#CBF3D2] flex items-center justify-center">
              <Dumbbell size={24} className="text-[#0E0E52]" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">{t("classes.ctaTitle")}</h3>
              <p className="text-white/70 text-sm">{t("classes.ctaText")}</p>
            </div>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 bg-[#FF8552] text-white px-6 py-3 rounded-full font-medium hover:bg-[#E57545] transition-colors"
          >
            <Sparkles size={16} /> {t("classes.ctaButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}
