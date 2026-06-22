import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { MapPin, Star, Clock, Check, ArrowLeft, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useI18n } from "../lib/i18n";

function formatTime(iso, language) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString(language || "en-US", { weekday: "short" }),
    date: d.toLocaleDateString(language || "en-US", { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(language || "en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export default function StudioProfile() {
  const { language, t } = useI18n();
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: studio } = useQuery({ queryKey: ["studio", id], queryFn: () => api.getStudio(id) });
  const { data: classes = [] } = useQuery({
    queryKey: ["studio-classes", id],
    queryFn: () => api.getStudioClasses(id),
  });

  const safeStudio = studio || null;
  const studioCategories = Array.isArray(safeStudio?.categories) ? safeStudio.categories : [];
  const studioAmenities = Array.isArray(safeStudio?.amenities) ? safeStudio.amenities : [];
  const studioGallery = Array.isArray(safeStudio?.gallery) ? safeStudio.gallery : [];
  const safeClasses = Array.isArray(classes) ? classes : [];

  const book = useMutation({
    mutationFn: api.book,
    onSuccess: () => {
      toast.success(t("studioProfile.bookedToast"));
      qc.refetchQueries({ queryKey: ["auth-me"] });
      qc.invalidateQueries({ queryKey: ["studio-classes", id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(err?.response?.data?.detail || t("common.somethingWentWrong")),
  });

  if (!safeStudio) return <div className="p-10 text-[#4A4A7A]">{t("common.loading")}</div>;

  return (
    <div className="bg-[#FDFDFD] min-h-screen pb-20">
      <Toaster position="top-center" richColors />

      {/* Cover */}
      <div className="relative h-[44vh] overflow-hidden">
        <img src={safeStudio.cover_image || "https://images.unsplash.com/photo-1591258370814-01609b341790"} alt={safeStudio.name || t("common.studio")} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E52]/70 via-[#0E0E52]/20 to-transparent" />
        <Link
          to="/explore"
          className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-sm text-[#0E0E52]"
          data-testid="studio-back-btn"
        >
          <ArrowLeft size={14} /> {t("studioProfile.backExplore")}
        </Link>
        <div className="absolute bottom-8 left-0 right-0 max-w-7xl mx-auto px-6 lg:px-10 text-white">
          <span className="anyspot-pill bg-white/95 text-[#0E0E52]">{studioCategories[0] || t("common.studio")}</span>
          <h1 className="font-display text-4xl md:text-6xl tracking-tighter font-semibold mt-4">
            {safeStudio.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-white/90 text-sm">
            <span className="flex items-center gap-1.5"><MapPin size={14} /> {[safeStudio.neighborhood, safeStudio.city].filter(Boolean).join(", ") || t("studioProfile.locationTba")}</span>
            <span className="flex items-center gap-1.5"><Star size={14} fill="currentColor" className="text-[#FF8552]" /> {safeStudio.rating ?? 0} · {safeStudio.review_count ?? 0} {t("studioProfile.reviews")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-12 grid lg:grid-cols-12 gap-10">
        {/* Left content */}
        <div className="lg:col-span-7 space-y-12">
          <section>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("studioProfile.vibe")}</span>
            <p className="font-display text-2xl md:text-3xl tracking-tight mt-4 text-[#0E0E52] leading-snug">
              {safeStudio.tagline || ""}.
            </p>
            <p className="mt-5 text-[#4A4A7A] leading-relaxed">{safeStudio.vibe || ""}</p>
          </section>

          <section>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("studioProfile.amenities")}</span>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
              {studioAmenities.map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm text-[#0E0E52] bg-white border border-[#0E0E52]/10 rounded-xl px-4 py-3">
                  <Check size={14} className="text-[#FF8552]" /> {a}
                </div>
              ))}
            </div>
          </section>

          <section>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("studioProfile.gallery")}</span>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {studioGallery.map((g, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? "col-span-2 row-span-2 h-80" : "h-40"}`}>
                  <img src={g} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </section>

          <section>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("studioProfile.leadInstructor")}</span>
            <div className="mt-5 bg-white border border-[#0E0E52]/10 rounded-2xl p-6 flex gap-5 items-center">
              <img src={safeStudio.instructor_image || "https://images.pexels.com/photos/6739935/pexels-photo-6739935.jpeg"} alt={safeStudio.instructor_name || t("common.instructorTba")} className="w-20 h-20 rounded-full object-cover" />
              <div>
                <p className="font-display text-xl text-[#0E0E52] font-medium">{safeStudio.instructor_name || t("studioProfile.tba")}</p>
                <p className="text-sm text-[#4A4A7A] mt-1 leading-relaxed">{safeStudio.instructor_bio || ""}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Schedule */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 bg-white border border-[#0E0E52]/10 rounded-2xl p-6 anyspot-card-shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-[#0E0E52] font-medium">{t("studioProfile.classSchedule")}</h3>
              <span className="text-xs text-[#4A4A7A]">{safeClasses.length} {t("studioProfile.upcoming")}</span>
            </div>

            <div className="mt-5 max-h-[640px] overflow-y-auto space-y-3 pr-1" data-testid="studio-schedule">
              {safeClasses.length === 0 && (
                <p className="text-sm text-[#4A4A7A]">{t("studioProfile.noUpcoming")}</p>
              )}
              {safeClasses.slice(0, 30).map((c) => {
                const timeParts = formatTime(c.start_time, language);
                return (
                  <div key={c.id} className="group flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-[#0E0E52]/10 hover:bg-[#CBF3D2]/20 transition-colors">
                    <div className="w-14 text-center">
                      <p className="text-xs uppercase tracking-widest text-[#FF8552] font-bold">{timeParts.day}</p>
                      <p className="font-display text-lg text-[#0E0E52] leading-tight">{timeParts.date.split(" ")[1]}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#0E0E52] text-sm">{c.title}</p>
                      <p className="text-xs text-[#4A4A7A] flex items-center gap-1.5">
                        <Clock size={11} /> {timeParts.time} · {c.duration_min}{t("common.min")} · {c.spots_left} {t("studioProfile.left")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg text-[#0E0E52]">{c.credits}<span className="text-xs text-[#4A4A7A] ml-0.5">{t("common.creditsShort")}</span></p>
                      <button
                        data-testid={`schedule-book-${c.id}`}
                        disabled={book.isPending || c.spots_left === 0}
                        onClick={() => book.mutate(c.id)}
                        className="mt-1 text-xs px-3 py-1 rounded-full bg-[#FF8552] text-white hover:bg-[#E57545] transition-colors disabled:opacity-50"
                      >
                        {t("explore.book")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-[#CBF3D2]/40 text-[#0E0E52] text-sm flex items-start gap-2">
              <Sparkles size={14} className="text-[#FF8552] mt-0.5" />
              <p>{t("studioProfile.bookingPolicy")}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
