import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  Briefcase, Plus, TrendingUp, Users, Calendar, Coins, Edit2, Trash2, ChevronRight, Sparkles,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import ClassFormDialog from "../components/ClassFormDialog";
import { useI18n } from "../lib/i18n";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";

function fmtDate(iso, language) {
  const d = new Date(iso);
  return d.toLocaleString(language || "en-US", {
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
  const { language, t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null); // class id
  const [rosterFor, setRosterFor] = useState(null); // class obj
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [typesInput, setTypesInput] = useState("");
  const [photosInput, setPhotosInput] = useState("");
  const [hoursInput, setHoursInput] = useState("");

  const { user: authUser } = useAuth();
  const { data: onboarding } = useQuery({ queryKey: ["partner-onboarding-status"], queryFn: api.partnerOnboardingStatus });
  const { data: studio } = useQuery({ queryKey: ["partner-studio"], queryFn: api.partnerStudio });
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
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeRoster = Array.isArray(roster) ? roster : [];

  const del = useMutation({
    mutationFn: api.deleteClass,
    onSuccess: () => {
      toast.success(t("partner.classDeleted"));
      qc.invalidateQueries({ queryKey: ["partner-classes"] });
      qc.invalidateQueries({ queryKey: ["partner-overview"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      setConfirmDel(null);
    },
    onError: (e) => toast.error(e?.response?.data?.detail || t("partner.classDeleteError")),
  });

  const saveProfile = useMutation({
    mutationFn: api.partnerOnboardingProfile,
    onSuccess: () => {
      toast.success(t("partner.profileSaved"));
      qc.invalidateQueries({ queryKey: ["partner-onboarding-status"] });
      qc.invalidateQueries({ queryKey: ["partner-studio"] });
    },
    onError: (e) => toast.error(e?.response?.data?.detail || t("partner.profileSaveError")),
  });

  useEffect(() => {
    if (!studio) return;
    setLogoUrl(studio.logo_url || "");
    setDescription(studio.description || studio.vibe || "");
    setTypesInput(Array.isArray(studio.categories) ? studio.categories.join(", ") : "");
    setPhotosInput(Array.isArray(studio.gallery) ? studio.gallery.join("\n") : "");
    setHoursInput(studio.opening_hours ? JSON.stringify(studio.opening_hours, null, 2) : "");
  }, [studio]);

  const onboardingIncomplete = onboarding && !onboarding.onboarding_completed;

  const submitOnboarding = (e) => {
    e.preventDefault();
    const studioTypes = typesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const photos = photosInput
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    let openingHours = {};
    if (hoursInput.trim()) {
      try {
        openingHours = JSON.parse(hoursInput);
      } catch {
        toast.error(t("partner.openingHoursInvalid"));
        return;
      }
    }

    if (!description.trim()) {
      toast.error(t("partner.studioDescriptionRequired"));
      return;
    }
    if (studioTypes.length === 0) {
      toast.error(t("partner.studioTypeRequired"));
      return;
    }

    saveProfile.mutate({
      logo_url: logoUrl.trim() || null,
      description: description.trim(),
      studio_types: studioTypes,
      photos,
      opening_hours: openingHours,
    });
  };

  const upcomingRoster = Array.isArray(overview?.upcoming_roster) ? overview.upcoming_roster : [];
  const topClasses = Array.isArray(overview?.top_classes) ? overview.top_classes : [];

  return (
    <div className="bg-[#FDFDFD] min-h-screen" data-testid="partner-dashboard">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-20">
        {onboardingIncomplete && (
          <div className="mb-10 bg-white border border-[#0E0E52]/10 rounded-2xl p-6" data-testid="partner-onboarding-form">
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("partner.onboardingPill")}</span>
            <h2 className="font-display text-3xl mt-4 tracking-tight text-[#0E0E52] font-semibold">{t("partner.onboardingTitle")}</h2>
            <p className="mt-2 text-[#4A4A7A]">{t("partner.onboardingDesc")}</p>
            <form onSubmit={submitOnboarding} className="mt-6 grid md:grid-cols-2 gap-4">
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder={t("partner.logoUrlOptional")}
                className="rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
              />
              <input
                type="text"
                value={typesInput}
                onChange={(e) => setTypesInput(e.target.value)}
                placeholder={t("partner.studioTypesPlaceholder")}
                className="rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("partner.studioDescriptionPlaceholder")}
                maxLength={300}
                className="md:col-span-2 min-h-[110px] rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
              />
              <textarea
                value={photosInput}
                onChange={(e) => setPhotosInput(e.target.value)}
                placeholder={t("partner.photosPlaceholder")}
                className="min-h-[110px] rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
              />
              <textarea
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                placeholder={t("partner.openingHoursPlaceholder")}
                className="min-h-[110px] rounded-2xl border border-[#0E0E52]/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CBF3D2]"
              />
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saveProfile.isPending}
                  className="bg-[#0E0E52] text-white px-6 py-3 rounded-full font-medium hover:bg-[#FF8552] transition-colors disabled:opacity-60"
                >
                  {saveProfile.isPending ? t("common.saving") : t("partner.saveStudioProfile")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">
              <Briefcase size={12} /> {t("partner.mode")}
            </span>
            <h1 className="font-display text-4xl md:text-5xl mt-4 tracking-tighter font-semibold text-[#0E0E52]">
              {t("partner.commandTitle")}
            </h1>
            <p className="text-[#4A4A7A] mt-2">
              {t("partner.commandSubtitle").replace("{count}", String(overview?.total_studios ?? "—"))}
            </p>
          </div>
          <button
            data-testid="add-class-btn"
            onClick={() => { setEditing(null); setOpen(true); }}
            className="bg-[#FF8552] text-white px-6 py-3 rounded-full font-medium hover:bg-[#E57545] transition-colors inline-flex items-center gap-2 anyspot-coral-shadow"
          >
            <Plus size={16} /> {t("partner.addClass")}
          </button>
        </div>

        {/* KPI Grid */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-5 gap-5">
          <StatCard icon={TrendingUp} label={t("partner.reservations7d")} value={overview?.reservations_week ?? "—"} accent />
          <StatCard icon={Calendar} label={t("partner.reservations30d")} value={overview?.reservations_month ?? "—"} />
          <StatCard icon={Coins} label={t("partner.credits7d")} value={overview?.credits_week ?? "—"} />
          <StatCard icon={Sparkles} label={t("partner.activeClasses")} value={overview?.active_classes ?? "—"} />
          <StatCard icon={Coins} label={t("partner.balance")} value={studio?.credits ?? "—"} />
        </div>

        {/* Roster + Top */}
        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#0E0E52]/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl text-[#0E0E52] font-medium">{t("partner.upcomingRoster")}</h3>
              <span className="text-xs text-[#4A4A7A]">{upcomingRoster.length} {t("partner.classesCount")}</span>
            </div>
            <div className="mt-5 space-y-2" data-testid="upcoming-roster">
              {upcomingRoster.map((r) => {
                const fill = r.capacity ? Math.round(((r.capacity - r.spots_left) / r.capacity) * 100) : 0;
                return (
                  <div key={r.class_id} className="grid grid-cols-12 items-center gap-3 py-3 border-b last:border-b-0 border-[#0E0E52]/5">
                    <div className="col-span-5">
                      <p className="font-medium text-sm text-[#0E0E52]">{r.title}</p>
                      <p className="text-xs text-[#4A4A7A]">{r.studio_name} · {fmtDate(r.start_time, language)}</p>
                    </div>
                    <div className="col-span-4">
                      <div className="flex items-center justify-between text-xs text-[#4A4A7A]">
                        <span>{r.booked} / {r.capacity}</span>
                        {r.waitlist > 0 && (
                          <span className="text-[#FF8552] font-semibold">+{r.waitlist} {t("partner.waitlistShort")}</span>
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
                        {t("partner.viewRoster")} <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {upcomingRoster.length === 0 && (
                <p className="text-sm text-[#4A4A7A] py-4">{t("partner.noClasses7d")}</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#0E0E52]/10 rounded-2xl p-6">
            <h3 className="font-display text-xl text-[#0E0E52] font-medium">{t("partner.topClasses")}</h3>
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
                <p className="text-sm text-[#4A4A7A]">{t("partner.noReservationsYet")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Classes table */}
        <div className="mt-12">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-display text-2xl md:text-3xl tracking-tight text-[#0E0E52] font-medium">
              {t("partner.allUpcomingClasses")}
            </h2>
            <p className="text-sm text-[#4A4A7A]">{safeClasses.length} {t("partner.scheduled")}</p>
          </div>

          <div className="mt-6 bg-white border border-[#0E0E52]/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm" data-testid="classes-table">
              <thead className="bg-[#CBF3D2]/30 text-[#0E0E52]">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">{t("partner.tableClass")}</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">{t("partner.tableStudio")}</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">{t("partner.tableWhen")}</th>
                  <th className="text-left px-5 py-3 font-medium">{t("partner.tableFill")}</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">{t("partner.tableCredits")}</th>
                  <th className="text-right px-5 py-3 font-medium">{t("partner.tableActions")}</th>
                </tr>
              </thead>
              <tbody>
                {safeClasses.map((c) => {
                  const booked = c.capacity - c.spots_left;
                  return (
                    <tr key={c.id} className="border-t border-[#0E0E52]/5 hover:bg-[#CBF3D2]/10" data-testid={`partner-class-row-${c.id}`}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#0E0E52]">{c.title}</p>
                        <p className="text-xs text-[#4A4A7A]">{c.category} · {c.instructor}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-[#4A4A7A]">{c.studio_name}</td>
                      <td className="px-5 py-4 hidden lg:table-cell text-[#4A4A7A]">{fmtDate(c.start_time, language)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[#0E0E52]">{booked}/{c.capacity}</span>
                          {c.waitlist_count > 0 && (
                            <span className="text-[10px] uppercase tracking-widest text-[#FF8552] font-bold">+{c.waitlist_count} {t("partner.waitlistShort")}</span>
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
                {safeClasses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-[#4A4A7A]">{t("partner.noUpcomingClasses")}</td>
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
            <AlertDialogTitle className="font-display text-[#0E0E52]">{t("partner.deleteClassTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("partner.deleteClassDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="confirm-delete-cancel">{t("partner.keepClass")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-confirm"
              onClick={() => del.mutate(confirmDel.id)}
              className="bg-[#FF8552] hover:bg-[#E57545]"
            >
              {t("partner.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Roster panel */}
      <AlertDialog open={!!rosterFor} onOpenChange={(v) => !v && setRosterFor(null)}>
        <AlertDialogContent data-testid="roster-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[#0E0E52]">
              {t("partner.rosterTitle")} · {rosterFor?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#4A4A7A]">
              {rosterFor && fmtDate(rosterFor.start_time, language)} · {rosterFor?.studio_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2 mt-2">
            {safeRoster.length === 0 && <p className="text-sm text-[#4A4A7A]">{t("partner.noReservations")}</p>}
            {safeRoster.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between border border-[#0E0E52]/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#CBF3D2] text-[#0E0E52] flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm text-[#0E0E52] font-medium">{authUser && r.user_id === authUser.user_id ? `${authUser.name} (${t("partner.you")})` : t("common.member")}</p>
                    <p className="text-xs text-[#4A4A7A]">{t("partner.bookedAt")} {fmtDate(r.created_at, language)}</p>
                  </div>
                </div>
                <span className={`anyspot-pill text-xs ${r.status === "waitlist" ? "bg-[#FF8552]/15 text-[#FF8552]" : "bg-[#CBF3D2] text-[#0E0E52]"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="roster-close">{t("common.close")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
