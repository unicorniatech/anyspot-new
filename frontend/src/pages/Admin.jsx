import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Calendar, CreditCard, TrendingUp, UserCheck, Ban } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

function CountCard({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    blue: "bg-[#0E0E52] text-white",
    orange: "bg-[#FF8552] text-white",
    mint: "bg-[#CBF3D2] text-[#0E0E52]",
    white: "bg-white text-[#0E0E52] border border-[#0E0E52]/10",
  };
  return (
    <div className={`rounded-2xl p-6 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <Icon size={18} />
        </div>
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <p className="font-display text-4xl font-semibold">{value ?? "—"}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#0E0E52]/10 p-6">
      <h2 className="font-display text-xl font-semibold text-[#0E0E52] mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Admin() {
  const { t } = useI18n();
  const { user, loading } = useAuth();

  const { data: overview, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: api.adminOverview,
    enabled: !!user && user.role === "admin",
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: api.adminUsers,
    enabled: !!user && user.role === "admin",
  });

  const { data: transactions } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: api.adminTransactions,
    enabled: !!user && user.role === "admin",
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#0E0E52]/20 border-t-[#FF8552] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 text-center">
        <h1 className="font-display text-3xl text-[#0E0E52]">{t("admin.accessDenied")}</h1>
        <p className="mt-2 text-[#4A4A7A]">{t("admin.adminOnly")}</p>
      </div>
    );
  }

  const counts = overview?.counts || {};

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      <div className="mb-8">
        <span className="anyspot-pill bg-[#CBF3D2] text-[#0E0E52]">{t("admin.pill")}</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 font-semibold text-[#0E0E52]">
          {t("admin.title")}
        </h1>
        <p className="mt-2 text-[#4A4A7A]">{t("admin.description")}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <CountCard
          icon={Users}
          label={t("admin.users")}
          value={counts.users}
          tone="blue"
        />
        <CountCard
          icon={Building2}
          label={t("admin.studios")}
          value={counts.studios}
          tone="orange"
        />
        <CountCard
          icon={Calendar}
          label={t("admin.classes")}
          value={counts.classes}
          tone="mint"
        />
        <CountCard
          icon={CreditCard}
          label={t("admin.bookings")}
          value={counts.bookings}
          tone="white"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Section title={t("admin.recentSignups")}>
            {users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#4A4A7A] border-b border-[#0E0E52]/10">
                      <th className="pb-3 font-medium">{t("admin.name")}</th>
                      <th className="pb-3 font-medium">{t("admin.email")}</th>
                      <th className="pb-3 font-medium">{t("admin.role")}</th>
                      <th className="pb-3 font-medium">{t("admin.joined")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 8).map((u) => (
                      <tr key={u.user_id} className="border-b border-[#0E0E52]/5 last:border-0">
                        <td className="py-3 text-[#0E0E52] font-medium">{u.name}</td>
                        <td className="py-3 text-[#4A4A7A]">{u.email}</td>
                        <td className="py-3">
                          <span className="anyspot-pill bg-[#CBF3D2]/60 text-[#0E0E52]">{u.role}</span>
                        </td>
                        <td className="py-3 text-[#4A4A7A]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[#4A4A7A]">{t("admin.noUsers")}</p>
            )}
          </Section>
        </div>

        <div>
          <Section title={t("admin.activitySummary")}>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#CBF3D2]/30">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-[#0E0E52]" />
                  <span className="text-sm text-[#0E0E52]">{t("admin.confirmed")}</span>
                </div>
                <span className="font-semibold text-[#0E0E52]">{counts.confirmed ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FF8552]/10">
                <div className="flex items-center gap-2">
                  <Ban size={16} className="text-[#FF8552]" />
                  <span className="text-sm text-[#0E0E52]">{t("admin.cancelled")}</span>
                </div>
                <span className="font-semibold text-[#0E0E52]">{counts.cancelled ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#0E0E52]/10">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#0E0E52]" />
                  <span className="text-sm text-[#0E0E52]">{t("admin.conversion")}</span>
                </div>
                <span className="font-semibold text-[#0E0E52]">
                  {counts.bookings ? `${Math.round(((counts.confirmed || 0) / counts.bookings) * 100)}%` : "—"}
                </span>
              </div>
            </div>
          </Section>
        </div>
      </div>

      <Section title={t("admin.transactions")}>
        {transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#4A4A7A] border-b border-[#0E0E52]/10">
                  <th className="pb-3 font-medium">{t("admin.type")}</th>
                  <th className="pb-3 font-medium">{t("admin.user")}</th>
                  <th className="pb-3 font-medium">{t("admin.studio")}</th>
                  <th className="pb-3 font-medium">{t("admin.credits")}</th>
                  <th className="pb-3 font-medium">{t("admin.status")}</th>
                  <th className="pb-3 font-medium">{t("admin.date")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b border-[#0E0E52]/5 last:border-0">
                    <td className="py-3 text-[#0E0E52]">{tx.type}</td>
                    <td className="py-3 text-[#0E0E52] font-medium">{tx.user_name || "—"}</td>
                    <td className="py-3 text-[#4A4A7A]">{tx.studio_name || "—"}</td>
                    <td className="py-3 text-[#0E0E52]">{tx.amount}</td>
                    <td className="py-3">
                      <span
                        className={`anyspot-pill ${
                          tx.status === "completed"
                            ? "bg-[#CBF3D2] text-[#0E0E52]"
                            : "bg-[#FF8552]/10 text-[#FF8552]"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-[#4A4A7A]">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#4A4A7A]">{t("admin.noTransactions")}</p>
        )}
      </Section>
    </div>
  );
}
