import { Link } from "react-router-dom";
import { ArrowLeft, Newspaper } from "lucide-react";
import { useI18n } from "../lib/i18n";

const RELEASES = [
  { date: "2026-06-15", key: "launch" },
  { date: "2026-05-22", key: "partner" },
  { date: "2026-04-10", key: "wellness" },
];

export default function Press() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4A4A7A] hover:text-[#0E0E52] text-sm mb-10">
          <ArrowLeft size={14} /> {t("press.backHome")}
        </Link>
        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("press.pill")}</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
          {t("press.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-[#4A4A7A] leading-relaxed text-lg">
          {t("press.intro")}
        </p>

        <div className="mt-12 space-y-4">
          {RELEASES.map((r) => (
            <div key={r.key} className="bg-white rounded-2xl border border-[#0E0E52]/10 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0E0E52]/10 flex items-center justify-center shrink-0">
                <Newspaper size={20} className="text-[#0E0E52]" />
              </div>
              <div>
                <p className="text-xs text-[#4A4A7A]">{new Date(r.date).toLocaleDateString()}</p>
                <h3 className="font-display text-lg font-semibold text-[#0E0E52] mt-1">{t(`press.${r.key}Title`)}</h3>
                <p className="mt-2 text-sm text-[#4A4A7A]">{t(`press.${r.key}Text`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
