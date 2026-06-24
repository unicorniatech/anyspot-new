import { Link } from "react-router-dom";
import { ArrowLeft, Check, Coins } from "lucide-react";
import { useI18n } from "../lib/i18n";

const PACKS = [
  { credits: 10, price: 25, popular: false },
  { credits: 25, price: 55, popular: true },
  { credits: 60, price: 120, popular: false },
];

export default function Credits() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A4A7A] hover:text-[#0E0E52] text-sm mb-10">
          <ArrowLeft size={14} /> {t("credits.backHome")}
        </Link>
        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("credits.pill")}</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
          {t("credits.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-[#4A4A7A] leading-relaxed text-lg">
          {t("credits.intro")}
        </p>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {PACKS.map((p) => (
            <div
              key={p.credits}
              className={`relative rounded-2xl p-6 border ${
                p.popular
                  ? "bg-[#0E0E52] text-white border-[#0E0E52]"
                  : "bg-white text-[#0E0E52] border-[#0E0E52]/10"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 anyspot-pill bg-[#FF8552] text-white text-xs">
                  {t("credits.popular")}
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.popular ? "bg-[#CBF3D2]" : "bg-[#0E0E52]/10"}`}>
                  <Coins size={20} className="text-[#0E0E52]" />
                </div>
                <span className="font-display text-3xl font-semibold">{p.credits}</span>
              </div>
              <p className={`text-sm mb-1 ${p.popular ? "text-white/70" : "text-[#4A4A7A]"}`}>{t("credits.credits")}</p>
              <p className="font-display text-2xl font-semibold">${p.price}</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check size={14} className={p.popular ? "text-[#CBF3D2]" : "text-[#0E0E52]"} />
                  {t("credits.feature1")}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className={p.popular ? "text-[#CBF3D2]" : "text-[#0E0E52]"} />
                  {t("credits.feature2")}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className={p.popular ? "text-[#CBF3D2]" : "text-[#0E0E52]"} />
                  {t("credits.feature3")}
                </li>
              </ul>
              <button
                disabled
                className={`mt-6 w-full py-3 rounded-full font-medium transition-colors disabled:opacity-60 ${
                  p.popular ? "bg-[#FF8552] text-white hover:bg-[#E57545]" : "bg-[#0E0E52] text-white hover:bg-[#FF8552]"
                }`}
              >
                {t("credits.choose")}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[#4A4A7A]">{t("credits.note")}</p>
      </div>
    </div>
  );
}
