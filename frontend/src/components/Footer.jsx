import { Instagram, Twitter, Mail } from "lucide-react";
import BrandMark from "./BrandMark";
import { useI18n } from "../lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer data-testid="site-footer" className="mt-24 bg-[#0E0E52] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <BrandMark iconClassName="w-9 h-9" textClassName="text-white" />
          <p className="mt-4 max-w-md text-white/70 leading-relaxed">
            {t("footer.blurb")}
          </p>
          <div className="mt-6 flex gap-3">
            {[Instagram, Twitter, Mail].map((Icon, i) => (
              <button
                key={i}
                className="w-10 h-10 rounded-full border border-white/15 hover:bg-[#FF8552] hover:border-[#FF8552] transition-colors flex items-center justify-center"
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="anyspot-pill text-[#CBF3D2]">{t("footer.product")}</p>
          <ul className="mt-4 space-y-2 text-white/70 text-sm">
            <li>{t("footer.exploreStudios")}</li>
            <li>{t("footer.classLibrary")}</li>
            <li>{t("footer.creditPacks")}</li>
            <li>{t("footer.giftCards")}</li>
          </ul>
        </div>

        <div>
          <p className="anyspot-pill text-[#CBF3D2]">{t("footer.company")}</p>
          <ul className="mt-4 space-y-2 text-white/70 text-sm">
            <li>{t("footer.about")}</li>
            <li>{t("footer.partnerWithUs")}</li>
            <li>{t("footer.press")}</li>
            <li>{t("footer.careers")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-white/50">
          <span>© 2026 AnySpot. {t("footer.moveAnywhere")}</span>
          <span>{t("footer.crafted")}</span>
        </div>
      </div>
    </footer>
  );
}
