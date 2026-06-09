import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { MapPin, Star, Clock, Check, ArrowLeft, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";

function formatTime(iso) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export default function StudioProfile() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: studio } = useQuery({ queryKey: ["studio", id], queryFn: () => api.getStudio(id) });
  const { data: classes = [] } = useQuery({
    queryKey: ["studio-classes", id],
    queryFn: () => api.getStudioClasses(id),
  });

  const book = useMutation({
    mutationFn: api.book,
    onSuccess: () => {
      toast.success("Booked! See you soon.");
      qc.refetchQueries({ queryKey: ["auth-me"] });
      qc.invalidateQueries({ queryKey: ["studio-classes", id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(err?.response?.data?.detail || "Something went wrong"),
  });

  if (!studio) return <div className="p-10 text-[#4A4A7A]">Loading…</div>;

  return (
    <div className="bg-[#FDFDFD] min-h-screen pb-20">
      <Toaster position="top-center" richColors />

      {/* Cover */}
      <div className="relative h-[44vh] overflow-hidden">
        <img src={studio.cover_image} alt={studio.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E52]/70 via-[#0E0E52]/20 to-transparent" />
        <Link
          to="/explore"
          className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-sm text-[#0E0E52]"
          data-testid="studio-back-btn"
        >
          <ArrowLeft size={14} /> Explore
        </Link>
        <div className="absolute bottom-8 left-0 right-0 max-w-7xl mx-auto px-6 lg:px-10 text-white">
          <span className="anyspot-pill bg-white/95 text-[#0E0E52]">{studio.categories[0]}</span>
          <h1 className="font-display text-4xl md:text-6xl tracking-tighter font-semibold mt-4">
            {studio.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-white/90 text-sm">
            <span className="flex items-center gap-1.5"><MapPin size={14} /> {studio.neighborhood}, {studio.city}</span>
            <span className="flex items-center gap-1.5"><Star size={14} fill="currentColor" className="text-[#FF8552]" /> {studio.rating} · {studio.review_count} reviews</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-12 grid lg:grid-cols-12 gap-10">
        {/* Left content */}
        <div className="lg:col-span-7 space-y-12">
          <section>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">The vibe</span>
            <p className="font-display text-2xl md:text-3xl tracking-tight mt-4 text-[#0E0E52] leading-snug">
              {studio.tagline}.
            </p>
            <p className="mt-5 text-[#4A4A7A] leading-relaxed">{studio.vibe}</p>
          </section>

          <section>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">Amenities</span>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
              {studio.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm text-[#0E0E52] bg-white border border-[#0E0E52]/10 rounded-xl px-4 py-3">
                  <Check size={14} className="text-[#FF8552]" /> {a}
                </div>
              ))}
            </div>
          </section>

          <section>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">Gallery</span>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {studio.gallery.map((g, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? "col-span-2 row-span-2 h-80" : "h-40"}`}>
                  <img src={g} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </section>

          <section>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">Lead instructor</span>
            <div className="mt-5 bg-white border border-[#0E0E52]/10 rounded-2xl p-6 flex gap-5 items-center">
              <img src={studio.instructor_image} alt={studio.instructor_name} className="w-20 h-20 rounded-full object-cover" />
              <div>
                <p className="font-display text-xl text-[#0E0E52] font-medium">{studio.instructor_name}</p>
                <p className="text-sm text-[#4A4A7A] mt-1 leading-relaxed">{studio.instructor_bio}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Schedule */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 bg-white border border-[#0E0E52]/10 rounded-2xl p-6 anyspot-card-shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-[#0E0E52] font-medium">Class schedule</h3>
              <span className="text-xs text-[#4A4A7A]">{classes.length} upcoming</span>
            </div>

            <div className="mt-5 max-h-[640px] overflow-y-auto space-y-3 pr-1" data-testid="studio-schedule">
              {classes.length === 0 && (
                <p className="text-sm text-[#4A4A7A]">No upcoming classes.</p>
              )}
              {classes.slice(0, 30).map((c) => {
                const t = formatTime(c.start_time);
                return (
                  <div key={c.id} className="group flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-[#0E0E52]/10 hover:bg-[#CBF3D2]/20 transition-colors">
                    <div className="w-14 text-center">
                      <p className="text-xs uppercase tracking-widest text-[#FF8552] font-bold">{t.day}</p>
                      <p className="font-display text-lg text-[#0E0E52] leading-tight">{t.date.split(" ")[1]}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#0E0E52] text-sm">{c.title}</p>
                      <p className="text-xs text-[#4A4A7A] flex items-center gap-1.5">
                        <Clock size={11} /> {t.time} · {c.duration_min}m · {c.spots_left} left
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg text-[#0E0E52]">{c.credits}<span className="text-xs text-[#4A4A7A] ml-0.5">cr</span></p>
                      <button
                        data-testid={`schedule-book-${c.id}`}
                        disabled={book.isPending || c.spots_left === 0}
                        onClick={() => book.mutate(c.id)}
                        className="mt-1 text-xs px-3 py-1 rounded-full bg-[#FF8552] text-white hover:bg-[#E57545] transition-colors disabled:opacity-50"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-[#CBF3D2]/40 text-[#0E0E52] text-sm flex items-start gap-2">
              <Sparkles size={14} className="text-[#FF8552] mt-0.5" />
              <p>Credits are deducted at booking. Cancel up to 12 hours in advance for a full refund.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
