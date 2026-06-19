import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  Briefcase, Plus, TrendingUp, Users, Calendar, Coins, Edit2, Trash2, ChevronRight, Sparkles,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import ClassFormDialog from "../components/ClassFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-2xl p-6 border ${accent ? "bg-[#0E0E52] text-white border-transparent" : "bg-white border-[#0E0E52]/10"}`}>
      <div className={`anyspot-pill ${accent ? "bg-white/15 text-white" : "bg-[#CBF3D2] text-[#0E0E52]"}`}>
        <Icon size={12} /> {label}
      </div>
      <p className={`font-display text-5xl mt-5 font-semibold ${accent ? "text-white" : "text-[#0E0E52]"}`}>{value}</p>
    </div>
  );
}

export default function Partner() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null); // class id
  const [rosterFor, setRosterFor] = useState(null); // class obj

  const { user: authUser } = useAuth();
  const { data: overview } = useQuery({ queryKey: ["partner-overview"], queryFn: api.partnerOverview });
  const { data: classes = [] } = useQuery({
    queryKey: ["partner-classes", "upcoming"],
    queryFn: () => api.partnerClasses({ upcoming: true }),
  });
  const { data: roster = [] } = useQuery({
    queryKey: ["partner-roster", rosterFor?.id],
    queryFn: () => api.partnerRoster(rosterFor.id),
    enabled: !!rosterFor,
  });

  const del = useMutation({
    mutationFn: api.deleteClass,
    onSuccess: () => {
      toast.success("Class deleted. Attendees refunded.");
      qc.invalidateQueries({ queryKey: ["partner-classes"] });
      qc.invalidateQueries({ queryKey: ["partner-overview"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      setConfirmDel(null);
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Couldn't delete"),
  });

  const upcomingRoster = Array.isArray(overview?.upcoming_roster) ? overview.upcoming_roster : [];
  const topClasses = Array.isArray(overview?.top_classes) ? overview.top_classes : [];

  return (
    <div className="bg-[#FDFDFD] min-h-screen" data-testid="partner-dashboard">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-20">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">
              <Briefcase size={12} /> Partner mode
            </span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52]">
              Studio command.
            </h1>
            <p className="text-[#4A4A7A] mt-2">
              Demo partner — managing {overview?.total_studios ?? "—"} studios on AnySpot.
            </p>
          </div>
          <button
            data-testid="add-class-btn"
            onClick={() => { setEditing(null); setOpen(true); }}
            className="bg-[#FF8552] text-white px-6 py-3 rounded-full font-medium hover:bg-[#E57545] transition-colors inline-flex items-center gap-2 anyspot-coral-shadow"
          >
            <Plus size={16} /> Add class
          </button>
        </div>

        {/* KPI Grid */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={TrendingUp} label="Reservations · 7d" value={overview?.reservations_week ?? "—"} accent />
          <StatCard icon={Calendar} label="Reservations · 30d" value={overview?.reservations_month ?? "—"} />
          <StatCard icon={Coins} label="Credits · 7d" value={overview?.credits_week ?? "—"} />
          <StatCard icon={Sparkles} label="Active classes" value={overview?.active_classes ?? "—"} />
        </div>

        {/* Roster + Top */}
        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#0E0E52]/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-[#0E0E52] font-medium">Upcoming roster · next 7 days</h3>
              <span className="text-xs text-[#4A4A7A]">{upcomingRoster.length} classes</span>
            </div>
            <div className="mt-5 space-y-2" data-testid="upcoming-roster">
              {upcomingRoster.map((r) => {
                const fill = r.capacity ? Math.round(((r.capacity - r.spots_left) / r.capacity) * 100) : 0;
                return (
                  <div key={r.class_id} className="grid grid-cols-12 items-center gap-3 py-3 border-b last:border-b-0 border-[#0E0E52]/5">
                    <div className="col-span-5">
                      <p className="font-medium text-sm text-[#0E0E52]">{r.title}</p>
                      <p className="text-xs text-[#4A4A7A]">{r.studio_name} · {fmtDate(r.start_time)}</p>
                    </div>
                    <div className="col-span-4">
                      <div className="flex items-center justify-between text-xs text-[#4A4A7A]">
                        <span>{r.booked} / {r.capacity}</span>
                        {r.waitlist > 0 && (
                          <span className="text-[#FF8552] font-semibold">+{r.waitlist} waitlist</span>
                        )}
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-[#0E0E52]/5 overflow-hidden">
                        <div className="h-full bg-[#FF8552]" style={{ width: `${fill}%` }} />
                      </div>
                    </div>
                    <div className="col-span-3 text-right">
                      <button
                        data-testid={`view-roster-${r.class_id}`}
                        onClick={() => setRosterFor(r)}
                        className="text-xs text-[#0E0E52] hover:text-[#FF8552] inline-flex items-center gap-1"
                      >
                        View roster <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {upcomingRoster.length === 0 && (
                <p className="text-sm text-[#4A4A7A] py-4">No classes in the next 7 days.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#0E0E52]/10 rounded-2xl p-6">
            <h3 className="font-display text-xl text-[#0E0E52] font-medium">Top classes</h3>
            <div className="mt-5 space-y-3" data-testid="top-classes">
              {topClasses.map((t, idx) => (
                <div key={t.class_id} className="flex items-center gap-3">
                  <span className="font-display text-2xl text-[#FF8552] w-7">0{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#0E0E52] truncate">{t.title}</p>
                    <p className="text-xs text-[#4A4A7A] truncate">{t.studio_name}</p>
                  </div>
                  <span className="text-sm font-display text-[#0E0E52]">{t.bookings}</span>
                </div>
              ))}
              {topClasses.length === 0 && (
                <p className="text-sm text-[#4A4A7A]">No reservations yet. Once members book, top classes appear here.</p>
              )}
            </div>
          </div>
        </div>

        {/* Classes table */}
        <div className="mt-12">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-display text-2xl md:text-3xl tracking-tight text-[#0E0E52] font-medium">
              All upcoming classes
            </h2>
            <p className="text-sm text-[#4A4A7A]">{classes.length} scheduled</p>
          </div>

          <div className="mt-6 bg-white border border-[#0E0E52]/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm" data-testid="classes-table">
              <thead className="bg-[#CBF3D2]/30 text-[#0E0E52]">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Class</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Studio</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">When</th>
                  <th className="text-left px-5 py-3 font-medium">Fill</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Credits</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => {
                  const booked = c.capacity - c.spots_left;
                  return (
                    <tr key={c.id} className="border-t border-[#0E0E52]/5 hover:bg-[#CBF3D2]/10" data-testid={`partner-class-row-${c.id}`}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#0E0E52]">{c.title}</p>
                        <p className="text-xs text-[#4A4A7A]">{c.category} · {c.instructor}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-[#4A4A7A]">{c.studio_name}</td>
                      <td className="px-5 py-4 hidden lg:table-cell text-[#4A4A7A]">{fmtDate(c.start_time)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[#0E0E52]">{booked}/{c.capacity}</span>
                          {c.waitlist_count > 0 && (
                            <span className="text-[10px] uppercase tracking-widest text-[#FF8552] font-bold">+{c.waitlist_count} wl</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-[#0E0E52]">{c.credits}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            data-testid={`edit-class-${c.id}`}
                            onClick={() => { setEditing(c); setOpen(true); }}
                            className="w-8 h-8 rounded-full hover:bg-[#CBF3D2] flex items-center justify-center text-[#0E0E52]"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            data-testid={`delete-class-${c.id}`}
                            onClick={() => setConfirmDel(c)}
                            className="w-8 h-8 rounded-full hover:bg-[#FF8552] hover:text-white flex items-center justify-center text-[#0E0E52]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {classes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-[#4A4A7A]">No upcoming classes. Hit &ldquo;Add class&rdquo; to publish one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ClassFormDialog
        key={editing?.id || (open ? "new" : "closed")}
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        editing={editing}
      />

      <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <AlertDialogContent data-testid="confirm-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[#0E0E52]">Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              All active bookings will be cancelled and credits refunded. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="confirm-delete-cancel">Keep class</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-confirm"
              onClick={() => del.mutate(confirmDel.id)}
              className="bg-[#FF8552] hover:bg-[#E57545]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Roster panel */}
      <AlertDialog open={!!rosterFor} onOpenChange={(v) => !v && setRosterFor(null)}>
        <AlertDialogContent data-testid="roster-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[#0E0E52]">
              Roster · {rosterFor?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#4A4A7A]">
              {rosterFor && fmtDate(rosterFor.start_time)} · {rosterFor?.studio_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2 mt-2">
            {roster.length === 0 && <p className="text-sm text-[#4A4A7A]">No reservations yet.</p>}
            {roster.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between border border-[#0E0E52]/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#CBF3D2] text-[#0E0E52] flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm text-[#0E0E52] font-medium">{authUser && r.user_id === authUser.user_id ? `${authUser.name} (you)` : "Member"}</p>
                    <p className="text-xs text-[#4A4A7A]">Booked {fmtDate(r.created_at)}</p>
                  </div>
                </div>
                <span className={`anyspot-pill text-xs ${r.status === "waitlist" ? "bg-[#FF8552]/15 text-[#FF8552]" : "bg-[#CBF3D2] text-[#0E0E52]"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="roster-close">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
