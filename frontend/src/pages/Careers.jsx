import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, MapPin, Check } from "lucide-react";
import { useI18n } from "../lib/i18n";

const ROLES = [
  { key: "foundingEngineer", location: "Remote" },
  { key: "studioSuccess", location: "Prague / Remote" },
  { key: "growthMarketing", location: "Remote" },
];

export default function Careers() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A4A7A] hover:text-[#0E0E52] text-sm mb-10">
          <ArrowLeft size={14} /> {t("careers.backHome")}
        </Link>
        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("careers.pill")}</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
          {t("careers.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-[#4A4A7A] leading-relaxed text-lg">
          {t("careers.intro")}
        </p>

        <div className="mt-12 space-y-4">
          {ROLES.map((r) => (
            <div key={r.key} className="bg-white rounded-2xl border border-[#0E0E52]/10 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#CBF3D2] flex items-center justify-center shrink-0">
                    <Briefcase size={20} className="text-[#0E0E52]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[#0E0E52]">{t(`careers.${r.key}`)}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#4A4A7A]">
                      <MapPin size={12} /> {r.location}
                    </div>
                  </div>
                </div>
                <button
                  disabled
                  className="shrink-0 bg-[#0E0E52] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#FF8552] transition-colors disabled:opacity-60"
                >
                  {t("careers.apply")}
                </button>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-[#4A4A7A]">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#0E0E52]" /> {t("careers.benefit1")}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#0E0E52]" /> {t("careers.benefit2")}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#0E0E52]" /> {t("careers.benefit3")}
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
