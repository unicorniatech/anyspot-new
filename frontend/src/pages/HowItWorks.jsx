import { Link } from "react-router-dom";
import { Layers, ChartLine, Sparkles, ArrowUpRight } from "lucide-react";
import { useI18n } from "../lib/i18n";

export default function HowItWorks() {
  const { t } = useI18n();

  const points = [
    {
      icon: Layers,
      title: t("howItWorks.oneMembershipTitle"),
      description: t("howItWorks.oneMembershipDesc"),
    },
    {
      icon: ChartLine,
      title: t("howItWorks.trackingTitle"),
      description: t("howItWorks.trackingDesc"),
    },
    {
      icon: Sparkles,
      title: t("howItWorks.aiTitle"),
      description: t("howItWorks.aiDesc"),
    },
  ];

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-20">
        <div className="max-w-3xl">
          <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("howItWorks.pill")}</span>
          <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52] leading-[1.05]">
            {t("howItWorks.title")} <span className="italic text-[#FF8552]">{t("howItWorks.titleAccent")}</span>
          </h1>
          <p className="mt-5 text-[#4A4A7A] leading-relaxed text-lg">{t("howItWorks.description")}</p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {points.map((point, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[#0E0E52]/10 p-6 anyspot-card-shadow">
              <div className="w-11 h-11 rounded-full bg-[#CBF3D2] flex items-center justify-center text-[#0E0E52]">
                <point.icon size={18} />
              </div>
              <h3 className="mt-4 font-display text-xl text-[#0E0E52] font-medium">{point.title}</h3>
              <p className="mt-2 text-sm text-[#4A4A7A] leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 bg-[#FF8552] text-white px-7 py-3 rounded-full font-medium hover:bg-[#E57545] transition-colors"
            data-testid="how-it-works-cta"
          >
            {t("howItWorks.cta")} <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
