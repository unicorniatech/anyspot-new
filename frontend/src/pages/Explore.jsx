import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, Clock, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";

function formatTime(iso, language, fallback) {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString(language || "en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export default function Explore() {
  const { language, t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [maxCredits, setMaxCredits] = useState(5);
  const [timeOfDay, setTimeOfDay] = useState("any");
  const qc = useQueryClient();

  const CATEGORIES = [
    { key: "All", label: t("categories.all") },
    { key: "Pilates", label: t("categories.pilates") },
    { key: "Yoga", label: t("categories.yoga") },
    { key: "HIIT", label: t("categories.hiit") },
    { key: "Cycling", label: t("categories.cycling") },
    { key: "Strength", label: t("categories.strength") },
  ];
  const TIMES = [
    { key: "any", label: t("times.any") },
    { key: "morning", label: t("times.morning") },
    { key: "midday", label: t("times.midday") },
    { key: "evening", label: t("times.evening") },
  ];

  const queryParams = useMemo(() => {
    const p = {};
    if (search) p.search = search;
    if (category && category !== "All") p.category = category;
    if (maxCredits < 5) p.max_credits = maxCredits;
    if (timeOfDay !== "any") p.time_of_day = timeOfDay;
    return p;
  }, [search, category, maxCredits, timeOfDay]);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes", queryParams],
    queryFn: () => api.listClasses(queryParams),
  });

  const safeClasses = (Array.isArray(classes) ? classes : [])
    .filter((c) => c && typeof c === "object")
    .map((c, idx) => ({
      id: c.id || `class-${idx}`,
      studio_id: c.studio_id || "",
      image: c.image || "https://images.unsplash.com/photo-1591258370814-01609b341790",
      title: c.title || t("explore.untitledClass"),
      category: c.category || t("explore.classFallback"),
      credits: typeof c.credits === "number" ? c.credits : 0,
      studio_name: c.studio_name || t("explore.studioFallback"),
      instructor: c.instructor || t("common.instructorTba"),
      start_time: c.start_time || "",
      duration_min: typeof c.duration_min === "number" ? c.duration_min : 60,
      spots_left: typeof c.spots_left === "number" ? c.spots_left : 0,
      waitlist_count: typeof c.waitlist_count === "number" ? c.waitlist_count : 0,
    }));

  const bookMutation = useMutation({
    mutationFn: api.book,
    onSuccess: (data) => {
      if (data?.status === "waitlist") {
        toast.success(t("explore.waitlistToast"));
      } else {
        toast.success(t("explore.bookedToast"));
      }
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || t("common.somethingWentWrong"));
    },
  });

  const onBookClick = (classId) => {
    if (!user) {
      navigate("/signup?role=customer", { state: { from: "/explore" } });
      return;
    }
    bookMutation.mutate(classId);
  };

  const goToStudio = (studioId) => {
    if (!studioId) return;
    navigate(`/studio/${studioId}`);
  };

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("explore.pill")}</span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52]">
              {t("explore.title")}
            </h1>
          </div>
          <p className="text-[#4A4A7A] text-sm">
            <span className="font-display text-2xl text-[#0E0E52] font-semibold">{safeClasses.length}</span> {t("explore.classesAvailable")}
          </p>
        </div>

        {/* Filters */}
        <div className="mt-10 bg-white border border-[#0E0E52]/10 rounded-2xl p-5 anyspot-card-shadow space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px] flex items-center gap-2 border border-[#0E0E52]/10 rounded-full px-4 py-2">
              <Search size={16} className="text-[#4A4A7A]" />
              <input
                data-testid="explore-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("explore.searchPlaceholder")}
                className="flex-1 bg-transparent outline-none text-sm text-[#0E0E52]"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-[#4A4A7A]">
              <Filter size={14} /> {t("explore.filters")}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                data-testid={`filter-category-${c.key}`}
                onClick={() => setCategory(c.key)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  category === c.key
                    ? "bg-[#0E0E52] text-white"
                    : "border border-[#0E0E52]/10 text-[#0E0E52] hover:bg-[#CBF3D2]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">
                {t("explore.maxCredits")}: <span className="text-[#FF8552]">{maxCredits}</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={maxCredits}
                onChange={(e) => setMaxCredits(Number(e.target.value))}
                data-testid="filter-credits-slider"
                className="w-full mt-2 accent-[#FF8552]"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A] mr-2">
                {t("explore.time")}:
              </span>
              {TIMES.map((t) => (
                <button
                  key={t.key}
                  data-testid={`filter-time-${t.key}`}
                  onClick={() => setTimeOfDay(t.key)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    timeOfDay === t.key
                      ? "bg-[#CBF3D2] text-[#0E0E52]"
                      : "border border-[#0E0E52]/10 text-[#4A4A7A]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Class grid */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="classes-grid">
          {isLoading && (
            <p className="text-[#4A4A7A] col-span-full">{t("explore.loadingClasses")}</p>
          )}
          {!isLoading && safeClasses.length === 0 && (
            <div className="col-span-full text-center py-16 border border-dashed border-[#0E0E52]/10 rounded-2xl">
              <Sparkles size={28} className="mx-auto text-[#FF8552]" />
              <p className="mt-3 text-[#0E0E52] font-display text-xl">{t("explore.noClassesTitle")}</p>
              <p className="text-[#4A4A7A] text-sm">{t("explore.noClassesDesc")}</p>
            </div>
          )}
          {safeClasses.map((c) => (
            <div
              key={c.id}
              data-testid={`class-card-${c.id}`}
              role={c.studio_id ? "button" : undefined}
              tabIndex={c.studio_id ? 0 : undefined}
              onClick={() => goToStudio(c.studio_id)}
              onKeyDown={(e) => {
                if (!c.studio_id) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToStudio(c.studio_id);
                }
              }}
              className={`bg-white rounded-2xl border border-[#0E0E52]/10 overflow-hidden hover:-translate-y-1 transition-transform group ${c.studio_id ? "cursor-pointer" : ""}`}
            >
              <div className="relative h-44 overflow-hidden">
                <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <span className="absolute top-3 left-3 anyspot-pill bg-white/95 text-[#0E0E52]">
                  {c.category}
                </span>
                <span className="absolute top-3 right-3 anyspot-pill bg-[#FF8552] text-white">
                  {c.credits} {t("common.creditsShort")}
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF8552]">
                  {c.studio_name}
                </p>
                <h3 className="font-display text-xl mt-1 text-[#0E0E52] font-medium">{c.title}</h3>
                <p className="text-sm text-[#4A4A7A] mt-1">{t("common.with")} {c.instructor}</p>

                <div className="mt-4 flex items-center justify-between text-sm text-[#4A4A7A]">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {formatTime(c.start_time, language, t("common.timeTba"))}
                  </span>
                  <span>{c.duration_min} {t("common.min")}</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-[#4A4A7A]">
                    {c.spots_left > 0
                      ? `${c.spots_left} ${t("explore.spotsLeft")}`
                      : `${t("explore.full")} · ${c.waitlist_count || 0} ${t("explore.onWaitlist")}`}
                  </span>
                  <button
                    data-testid={`book-class-${c.id}`}
                    disabled={bookMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookClick(c.id);
                    }}
                    className={`text-white rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      c.spots_left > 0
                        ? "bg-[#FF8552] hover:bg-[#E57545]"
                        : "bg-[#0E0E52] hover:bg-[#0E0E52]/80"
                    }`}
                  >
                    {c.spots_left > 0 ? t("explore.book") : t("explore.joinWaitlist")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
