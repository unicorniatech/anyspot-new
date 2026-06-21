import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Coins, Calendar, History, X, Sparkles, MapPin, Clock } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useState } from "react";

function formatTime(iso) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-US", { weekday: "long" }),
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export default function Dashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("upcoming");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const { user: me } = useAuth();
  const { data: bookings = [] } = useQuery({ queryKey: ["bookings"], queryFn: api.bookings });

  const saveProfile = useMutation({
    mutationFn: api.updateMe,
    onSuccess: () => {
      toast.success("Profile updated.");
      qc.refetchQueries({ queryKey: ["auth-me"] });
      setEditingProfile(false);
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Couldn't update profile"),
  });

  const cancel = useMutation({
    mutationFn: api.cancel,
    onSuccess: () => {
      toast.success("Booking cancelled, credits refunded.");
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.refetchQueries({ queryKey: ["auth-me"] });
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Couldn't cancel"),
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => (b.status === "confirmed" || b.status === "waitlist") && new Date(b.start_time) > now);
  const past = bookings.filter((b) => !((b.status === "confirmed" || b.status === "waitlist") && new Date(b.start_time) > now));

  const startProfileEdit = () => {
    setProfileName(me?.name || "");
    setProfilePhone(me?.phone || "");
    setEditingProfile(true);
  };

  const submitProfile = (e) => {
    e.preventDefault();
    saveProfile.mutate({ name: profileName.trim(), phone: profilePhone.trim() });
  };

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">Welcome back</span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52]">
              Hi, {me?.name?.split(" ")[0] || "there"}.
            </h1>
            <p className="text-[#4A4A7A] mt-2">Your studio life, organised.</p>
          </div>
        </div>

        {/* Top widgets */}
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          <div className="md:col-span-3 bg-white border border-[#0E0E52]/10 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">Profile</span>
                <p className="mt-3 text-[#0E0E52] font-medium">{me?.name || "Member"}</p>
                <p className="text-sm text-[#4A4A7A]">{me?.email || ""}</p>
                <p className="text-sm text-[#4A4A7A]">{me?.phone || "No phone added"}</p>
              </div>
              <button
                onClick={startProfileEdit}
                className="px-4 py-2 rounded-full border border-[#0E0E52]/15 text-[#0E0E52] text-sm font-medium hover:bg-[#0E0E52]/5"
              >
                Edit profile
              </button>
            </div>
            {editingProfile && (
              <form onSubmit={submitProfile} className="mt-4 grid md:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Full name"
                  className="rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
                />
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="Phone"
                  className="rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saveProfile.isPending}
                    className="bg-[#0E0E52] text-white px-4 py-3 rounded-full text-sm font-medium hover:bg-[#FF8552] disabled:opacity-60"
                  >
                    {saveProfile.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-3 rounded-full text-sm font-medium border border-[#0E0E52]/15 text-[#0E0E52]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Credit card */}
          <div className="md:col-span-1 relative overflow-hidden rounded-2xl p-7 bg-[#FF8552] text-white">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10" />
            <span className="anyspot-pill bg-white/20 text-white"><Coins size={12} /> Balance</span>
            <p className="font-display text-6xl mt-6 font-semibold leading-none">{me?.credits ?? "—"}</p>
            <p className="mt-2 text-white/80 text-sm">credits available</p>
            <button
              data-testid="buy-credits-btn"
              onClick={() => toast.info("Stripe checkout coming in Phase 2")}
              className="mt-6 bg-white text-[#0E0E52] rounded-full px-5 py-2 text-sm font-medium hover:bg-[#CBF3D2] transition-colors"
            >
              Buy more credits
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white border border-[#0E0E52]/10 rounded-2xl p-6">
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]"><Calendar size={12} /> Upcoming</span>
            <p className="font-display text-5xl mt-5 text-[#0E0E52] font-semibold">{upcoming.length}</p>
            <p className="text-[#4A4A7A] text-sm mt-1">classes on the books</p>
          </div>

          <div className="bg-white border border-[#0E0E52]/10 rounded-2xl p-6">
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]"><History size={12} /> Completed</span>
            <p className="font-display text-5xl mt-5 text-[#0E0E52] font-semibold">{past.filter(p=>p.status==='confirmed').length}</p>
            <p className="text-[#4A4A7A] text-sm mt-1">classes attended</p>
          </div>
        </div>

        {/* Bookings */}
        <div className="mt-12">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-display text-2xl md:text-3xl tracking-tight text-[#0E0E52] font-medium">
              My bookings
            </h2>
            <div className="inline-flex rounded-full border border-[#0E0E52]/10 p-1 bg-white">
              {[
                { k: "upcoming", l: `Upcoming (${upcoming.length})` },
                { k: "past", l: `Past (${past.length})` },
              ].map((t) => (
                <button
                  key={t.k}
                  data-testid={`tab-${t.k}`}
                  onClick={() => setTab(t.k)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    tab === t.k ? "bg-[#0E0E52] text-white" : "text-[#4A4A7A]"
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3" data-testid="bookings-list">
            {list.length === 0 && (
              <div className="text-center py-16 border border-dashed border-[#0E0E52]/10 rounded-2xl">
                <Sparkles size={28} className="mx-auto text-[#FF8552]" />
                <p className="mt-3 text-[#0E0E52] font-display text-xl">
                  {tab === "upcoming" ? "No upcoming classes" : "Nothing here yet"}
                </p>
                <p className="text-[#4A4A7A] text-sm">
                  {tab === "upcoming" ? "Head to Explore and book your next session." : "Your finished classes will appear here."}
                </p>
              </div>
            )}
            {list.map((b) => {
              const t = formatTime(b.start_time);
              const isCancelled = b.status === "cancelled";
              return (
                <div
                  key={b.id}
                  data-testid={`booking-${b.id}`}
                  className="bg-white border border-[#0E0E52]/10 rounded-2xl p-4 flex items-center gap-5 hover:-translate-y-0.5 transition-transform"
                >
                  <img src={b.image} alt={b.class_title} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-[#FF8552] font-bold">{b.studio_name}</p>
                      {b.status === "waitlist" && (
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FF8552]/15 text-[#FF8552] font-bold">Waitlist</span>
                      )}
                    </div>
                    <p className="font-display text-lg text-[#0E0E52] font-medium truncate">{b.class_title}</p>
                    <p className="text-sm text-[#4A4A7A] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {t.day}, {t.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {t.time}</span>
                      <span>with {b.instructor}</span>
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-display text-2xl text-[#0E0E52]">{b.credits}<span className="text-xs text-[#4A4A7A] ml-0.5">cr</span></p>
                    {isCancelled ? (
                      <span className="text-xs text-[#4A4A7A]">Cancelled</span>
                    ) : tab === "upcoming" ? (
                      <button
                        data-testid={`cancel-booking-${b.id}`}
                        onClick={() => cancel.mutate(b.id)}
                        className="mt-1 inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-[#0E0E52]/15 text-[#0E0E52] hover:bg-[#0E0E52] hover:text-white transition-colors"
                      >
                        <X size={11} /> Cancel
                      </button>
                    ) : (
                      <span className="text-xs text-[#4A4A7A]">Completed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
