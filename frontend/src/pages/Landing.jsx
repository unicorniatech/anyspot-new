import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Search, MapPin, Star, Sparkles, ArrowUpRight, Heart, Compass, Clock } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../lib/i18n";

const HERO_IMG = "https://images.unsplash.com/photo-1747239069226-55382c570116";

export default function Landing() {
  const { t } = useI18n();
  const { data: studios = [] } = useQuery({ queryKey: ["studios"], queryFn: api.listStudios });
  const [q, setQ] = useState("");
  const studioList = Array.isArray(studios) ? studios : [];

  const CATEGORIES = [
    { name: t("categories.pilates"), value: "Pilates", icon: "✦" },
    { name: t("categories.yoga"), value: "Yoga", icon: "◎" },
    { name: t("categories.hiit"), value: "HIIT", icon: "✕" },
    { name: t("categories.cycling"), value: "Cycling", icon: "◯" },
    { name: t("categories.strength"), value: "Strength", icon: "▲" },
  ];

  return (
    <div className="bg-[#FDFDFD]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 lg:pt-20 pb-16 lg:pb-24 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7 fade-up">
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">
              <Sparkles size={12} /> {t("landing.heroPill")}
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mt-6 leading-[0.95] tracking-tighter font-semibold text-[#0E0E52]">
              {t("landing.heroTitleStart")}
              <span className="italic font-normal text-[#FF8552]"> {t("landing.heroTitleAccent")}</span>,
              <br />
              {t("landing.heroTitleEnd")}
            </h1>
            <p className="mt-6 max-w-xl text-[#4A4A7A] text-lg leading-relaxed">
              {t("landing.heroDescription")}
            </p>

            {/* search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/explore${q ? `?search=${encodeURIComponent(q)}` : ""}`;
              }}
              data-testid="hero-search-form"
              className="mt-10 flex items-center gap-2 bg-white border border-[#0E0E52]/10 rounded-full p-2 shadow-[0_8px_32px_rgba(14,14,82,0.05)] max-w-xl"
            >
              <div className="flex items-center gap-2 pl-3 text-[#4A4A7A]">
                <Search size={18} />
              </div>
              <input
                data-testid="hero-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("landing.searchPlaceholder")}
                className="flex-1 outline-none bg-transparent text-[#0E0E52] placeholder:text-[#4A4A7A]/60 py-2"
              />
              <button
                data-testid="hero-search-submit"
                className="bg-[#FF8552] text-white px-6 py-3 rounded-full font-medium hover:bg-[#E57545] transition-colors"
              >
                {t("landing.discover")}
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.value}
                  to={`/explore?category=${c.value}`}
                  data-testid={`category-chip-${c.value.toLowerCase()}`}
                  className="px-4 py-2 rounded-full border border-[#0E0E52]/10 text-sm text-[#0E0E52] hover:bg-[#CBF3D2] hover:border-[#CBF3D2] transition-colors"
                >
                  <span className="text-[#FF8552] mr-1.5">{c.icon}</span>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative fade-up">
            <div className="relative rounded-[2rem] overflow-hidden h-[520px] anyspot-card-shadow">
              <img src={HERO_IMG} alt={t("landing.heroImageAlt")} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E52]/60 via-transparent to-transparent" />

              <div className="absolute top-6 left-6 right-6 flex justify-between">
                <span className="anyspot-pill bg-white/90 text-[#0E0E52] backdrop-blur-md">
                  {t("landing.nowBooking")}
                </span>
                <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#FF8552]">
                  <Heart size={16} />
                </button>
              </div>

              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#FF8552] font-bold">
                      {t("landing.featured")}
                    </p>
                    <p className="font-display text-xl font-semibold mt-1 text-[#0E0E52]">
                      {t("landing.featuredClassTitle")}
                    </p>
                    <p className="text-sm text-[#4A4A7A] mt-1 flex items-center gap-1.5">
                      <MapPin size={12} /> {t("landing.featuredClassMeta")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-semibold text-[#0E0E52]">3</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#4A4A7A]">{t("landing.credits")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stat card */}
            <div className="hidden lg:block absolute -left-10 bottom-16 bg-[#0E0E52] text-white rounded-2xl p-5 w-56 anyspot-card-shadow">
              <p className="anyspot-pill bg-[#FF8552] text-white">{t("landing.live")}</p>
              <p className="mt-3 font-display text-3xl font-semibold">412</p>
              <p className="text-white/70 text-sm">{t("landing.classesAvailableWeek")}</p>
            </div>
          </div>
        </div>

        {/* soft tea-green blob */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-[#CBF3D2] blur-3xl opacity-50 pointer-events-none" />
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Compass, title: t("landing.discoverStudiosTitle"), desc: t("landing.discoverStudiosDesc") },
            { icon: Clock, title: t("landing.bookSecondsTitle"), desc: t("landing.bookSecondsDesc") },
            { icon: Sparkles, title: t("landing.moveAnywhereTitle"), desc: t("landing.moveAnywhereDesc") },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 border border-[#0E0E52]/10 hover:-translate-y-1 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-[#CBF3D2] flex items-center justify-center text-[#0E0E52]">
                <s.icon size={20} />
              </div>
              <h3 className="font-display text-xl font-medium mt-5 text-[#0E0E52]">{s.title}</h3>
              <p className="text-[#4A4A7A] mt-2 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED STUDIOS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-16 lg:pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("landing.featuredStudiosPill")}</span>
            <h2 className="font-display text-3xl md:text-4xl mt-4 tracking-tight font-medium text-[#0E0E52]">
              {t("landing.featuredStudiosTitle")}
            </h2>
          </div>
          <Link
            to="/explore"
            className="hidden md:flex items-center gap-1 text-sm text-[#0E0E52] hover:text-[#FF8552] transition-colors"
            data-testid="see-all-studios"
          >
            {t("landing.seeAll")} <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-6">
          {studioList.map((s, idx) => {
            const categories = Array.isArray(s?.categories) ? s.categories : [];
            const primaryCategory = categories[0] || t("common.studio");
            const locationLabel = [s?.neighborhood, s?.city].filter(Boolean).join(", ") || t("landing.locationComingSoon");
            const studioId = s?.id || `studio-${idx}`;
            return (
            <Link
              key={studioId}
              to={`/studio/${studioId}`}
              data-testid={`studio-card-${s.id}`}
              className={`group relative overflow-hidden rounded-2xl bg-white border border-[#0E0E52]/10 hover:-translate-y-1 transition-all ${
                idx === 0 ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5"
              }`}
            >
              <div className={`relative ${idx === 0 ? "h-[420px]" : "h-[200px]"} overflow-hidden`}>
                <img
                  src={s.cover_image}
                  alt={s.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E52]/70 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <span className="anyspot-pill bg-white/90 text-[#0E0E52]">
                    {primaryCategory}
                  </span>
                  <span className="anyspot-pill bg-[#FF8552] text-white flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> {s.rating}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="font-display text-2xl font-semibold">{s.name}</p>
                  <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {locationLabel}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-[#4A4A7A] line-clamp-2 leading-relaxed">{s.tagline}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {categories.slice(0, 3).map((c) => (
                    <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-[#CBF3D2]/50 text-[#0E0E52]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="rounded-3xl bg-[#0E0E52] text-white p-10 lg:p-16 grid lg:grid-cols-2 gap-10 items-center overflow-hidden relative">
          <div>
            <span className="anyspot-pill bg-[#FF8552] text-white">{t("landing.ctaPill")}</span>
            <h2 className="font-display text-3xl md:text-5xl mt-4 leading-tight tracking-tight font-medium">
              {t("landing.ctaTitleStart")}{" "}
              <span className="text-[#CBF3D2] italic">{t("landing.ctaTitleAccent")}</span>.
            </h2>
            <p className="text-white/70 mt-4 max-w-md">
              {t("landing.ctaDescription")}
            </p>
            <Link
              to="/explore"
              data-testid="cta-explore-now"
              className="mt-8 inline-flex items-center gap-2 bg-[#FF8552] text-white px-8 py-3 rounded-full font-medium hover:bg-[#E57545] transition-colors"
            >
              {t("landing.exploreClasses")} <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hidden lg:flex justify-end">
            <div className="grid grid-cols-2 gap-4 w-fit">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl ${
                    i % 3 === 0 ? "bg-[#CBF3D2] text-[#0E0E52]" : "bg-white/5 text-white"
                  } p-5 w-32 h-32 flex flex-col justify-between`}
                >
                  <span className="font-display text-3xl">0{i}</span>
                  <span className="text-xs uppercase tracking-widest">{t("landing.step")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
