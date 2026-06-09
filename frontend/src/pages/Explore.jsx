import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, Clock, Sparkles, MapPin } from "lucide-react";
import { toast, Toaster } from "sonner";

const CATEGORIES = ["All", "Pilates", "Yoga", "HIIT", "Cycling", "Strength"];
const TIMES = [
  { key: "any", label: "Any time" },
  { key: "morning", label: "Morning" },
  { key: "midday", label: "Midday" },
  { key: "evening", label: "Evening" },
];

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
}

export default function Explore() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [maxCredits, setMaxCredits] = useState(5);
  const [timeOfDay, setTimeOfDay] = useState("any");
  const qc = useQueryClient();

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

  const bookMutation = useMutation({
    mutationFn: api.book,
    onSuccess: (data) => {
      if (data?.status === "waitlist") {
        toast.success("Class is full — you're on the waitlist.");
      } else {
        toast.success("Booked! See you on the mat.");
      }
      qc.refetchQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || "Something went wrong");
    },
  });

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">Explore</span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52]">
              Find your next class.
            </h1>
          </div>
          <p className="text-[#4A4A7A] text-sm">
            <span className="font-display text-2xl text-[#0E0E52] font-semibold">{classes.length}</span> classes available
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
                placeholder="Search by class, studio or instructor"
                className="flex-1 bg-transparent outline-none text-sm text-[#0E0E52]"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-[#4A4A7A]">
              <Filter size={14} /> Filters
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                data-testid={`filter-category-${c}`}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  category === c
                    ? "bg-[#0E0E52] text-white"
                    : "border border-[#0E0E52]/10 text-[#0E0E52] hover:bg-[#CBF3D2]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-bold text-[#4A4A7A]">
                Max credits: <span className="text-[#FF8552]">{maxCredits}</span>
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
                Time:
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
            <p className="text-[#4A4A7A] col-span-full">Loading classes…</p>
          )}
          {!isLoading && classes.length === 0 && (
            <div className="col-span-full text-center py-16 border border-dashed border-[#0E0E52]/10 rounded-2xl">
              <Sparkles size={28} className="mx-auto text-[#FF8552]" />
              <p className="mt-3 text-[#0E0E52] font-display text-xl">No classes match your filters</p>
              <p className="text-[#4A4A7A] text-sm">Try widening your time or category.</p>
            </div>
          )}
          {classes.map((c) => (
            <div
              key={c.id}
              data-testid={`class-card-${c.id}`}
              className="bg-white rounded-2xl border border-[#0E0E52]/10 overflow-hidden hover:-translate-y-1 transition-transform group"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <span className="absolute top-3 left-3 anyspot-pill bg-white/95 text-[#0E0E52]">
                  {c.category}
                </span>
                <span className="absolute top-3 right-3 anyspot-pill bg-[#FF8552] text-white">
                  {c.credits} cr
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FF8552]">
                  {c.studio_name}
                </p>
                <h3 className="font-display text-xl mt-1 text-[#0E0E52] font-medium">{c.title}</h3>
                <p className="text-sm text-[#4A4A7A] mt-1">with {c.instructor}</p>

                <div className="mt-4 flex items-center justify-between text-sm text-[#4A4A7A]">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {formatTime(c.start_time)}
                  </span>
                  <span>{c.duration_min} min</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-[#4A4A7A]">
                    {c.spots_left > 0
                      ? `${c.spots_left} spots left`
                      : `Full · ${c.waitlist_count || 0} on waitlist`}
                  </span>
                  <button
                    data-testid={`book-class-${c.id}`}
                    disabled={bookMutation.isPending}
                    onClick={() => bookMutation.mutate(c.id)}
                    className={`text-white rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      c.spots_left > 0
                        ? "bg-[#FF8552] hover:bg-[#E57545]"
                        : "bg-[#0E0E52] hover:bg-[#0E0E52]/80"
                    }`}
                  >
                    {c.spots_left > 0 ? "Book" : "Join waitlist"}
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
