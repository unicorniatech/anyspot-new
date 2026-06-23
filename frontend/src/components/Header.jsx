import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import BrandMark from "./BrandMark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navItems = [
  { to: "/", labelKey: "nav.home", protected: false },
  { to: "/how-it-works", labelKey: "nav.howItWorks", protected: false },
  { to: "/explore", labelKey: "nav.explore", protected: false },
  { to: "/dashboard", labelKey: "nav.dashboard", protected: true, role: "customer" },
  { to: "/partner", labelKey: "nav.partner", protected: true, role: "studio" },
  { to: "/admin", labelKey: "nav.admin", protected: true, role: "admin" },
];

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const visibleNavItems = navItems.filter((n) => {
    if (!n.protected) return true;
    if (!user) return false;
    if (n.role && user?.role !== n.role) return false;
    return true;
  });

  const onLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
    : "";

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-[#0E0E52]/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
          <BrandMark iconClassName="w-9 h-9" textClassName="text-[#0E0E52]" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {visibleNavItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.to.replace("/", "") || "home"}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#CBF3D2] text-[#0E0E52]"
                    : "text-[#4A4A7A] hover:text-[#0E0E52]"
                }`
              }
              end={n.to === "/"}
            >
              {t(n.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!loading && user && user.role === "customer" && (
            <Link
              to="/dashboard"
              data-testid="credit-pill"
              className="hidden sm:flex items-center gap-2 rounded-full bg-[#0E0E52] text-white px-4 py-2 text-sm hover:bg-[#FF8552] transition-colors"
            >
              <span className="font-display font-semibold">{user.credits}</span>
              <span className="text-white/70 text-xs uppercase tracking-widest">{t("nav.credits")}</span>
            </Link>
          )}

          <div className="hidden md:flex items-center gap-1">
            <button
              aria-label="English"
              onClick={() => setLanguage("en")}
              className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                language === "en" ? "border-[#FF8552] ring-2 ring-[#FF8552]/30" : "border-transparent"
              }`}
            >
              <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
                <path fill="#bd3d44" d="M0 0h640v48H0z" />
                <path fill="#fff" d="M0 48h640v48H0z" />
                <path fill="#bd3d44" d="M0 96h640v48H0z" />
                <path fill="#fff" d="M0 144h640v48H0z" />
                <path fill="#bd3d44" d="M0 192h640v48H0z" />
                <path fill="#fff" d="M0 240h640v48H0z" />
                <path fill="#bd3d44" d="M0 288h640v48H0z" />
                <path fill="#fff" d="M0 336h640v48H0z" />
                <path fill="#bd3d44" d="M0 384h640v48H0z" />
                <path fill="#fff" d="M0 432h640v48H0z" />
                <path fill="#192f5d" d="M0 0h320v288H0z" />
              </svg>
            </button>
            <button
              aria-label="Čeština"
              onClick={() => setLanguage("cs-CZ")}
              className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                language === "cs-CZ" ? "border-[#FF8552] ring-2 ring-[#FF8552]/30" : "border-transparent"
              }`}
            >
              <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
                <path fill="#fff" d="M0 0h640v480H0z" />
                <path fill="#d7141a" d="M0 320h640v160H0z" />
                <path fill="#11457e" d="M0 0h640v160H0z" />
              </svg>
            </button>
          </div>

          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="user-menu-btn"
                  className="w-9 h-9 rounded-full bg-[#CBF3D2] text-[#0E0E52] font-semibold flex items-center justify-center hover:ring-2 hover:ring-[#FF8552] transition-all overflow-hidden"
                >
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{initials}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white">
                <DropdownMenuLabel>
                  <p className="text-sm text-[#0E0E52] font-medium truncate">{user.name}</p>
                  <p className="text-xs text-[#4A4A7A] truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === "customer" && (
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard">
                    {t("nav.myDashboard")}
                  </DropdownMenuItem>
                )}
                {user?.role === "studio" && (
                  <DropdownMenuItem onClick={() => navigate("/partner")} data-testid="menu-partner">
                    {t("nav.partnerMode")}
                  </DropdownMenuItem>
                )}
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin">
                    {t("nav.admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="menu-logout"
                  onClick={onLogout}
                  className="text-[#FF8552] focus:text-[#FF8552]"
                >
                  <LogOut size={14} className="mr-2" /> {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/signup?role=customer"
                data-testid="signup-btn"
                className="bg-[#FF8552] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#E57545] transition-colors"
              >
                {t("nav.joinCustomer")}
              </Link>
              <Link
                to="/signup?role=studio"
                data-testid="signup-studio-btn"
                className="text-[#0E0E52] px-4 py-2 rounded-full text-sm font-medium border border-[#0E0E52]/15 hover:bg-[#0E0E52]/5 transition-colors"
              >
                {t("nav.listStudio")}
              </Link>
            </div>
          ) : null}

          <button
            data-testid="mobile-menu-btn"
            className="md:hidden p-2 rounded-full border border-[#0E0E52]/10"
            onClick={() => setOpen((o) => !o)}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#0E0E52]/10 bg-white">
          <div className="px-6 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 py-1">
              <span className="text-xs text-[#4A4A7A]">{t("language.label")}</span>
              <button
                aria-label="English"
                onClick={() => setLanguage("en")}
                className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                  language === "en" ? "border-[#FF8552] ring-2 ring-[#FF8552]/30" : "border-transparent"
                }`}
              >
                <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
                  <path fill="#bd3d44" d="M0 0h640v48H0z" />
                  <path fill="#fff" d="M0 48h640v48H0z" />
                  <path fill="#bd3d44" d="M0 96h640v48H0z" />
                  <path fill="#fff" d="M0 144h640v48H0z" />
                  <path fill="#bd3d44" d="M0 192h640v48H0z" />
                  <path fill="#fff" d="M0 240h640v48H0z" />
                  <path fill="#bd3d44" d="M0 288h640v48H0z" />
                  <path fill="#fff" d="M0 336h640v48H0z" />
                  <path fill="#bd3d44" d="M0 384h640v48H0z" />
                  <path fill="#fff" d="M0 432h640v48H0z" />
                  <path fill="#192f5d" d="M0 0h320v288H0z" />
                </svg>
              </button>
              <button
                aria-label="Čeština"
                onClick={() => setLanguage("cs-CZ")}
                className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                  language === "cs-CZ" ? "border-[#FF8552] ring-2 ring-[#FF8552]/30" : "border-transparent"
                }`}
              >
                <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
                  <path fill="#fff" d="M0 0h640v480H0z" />
                  <path fill="#d7141a" d="M0 320h640v160H0z" />
                  <path fill="#11457e" d="M0 0h640v160H0z" />
                </svg>
              </button>
            </div>
            {!loading && !user && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/signup?role=customer"
                  data-testid="mobile-signup-btn"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center bg-[#FF8552] text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-[#E57545] transition-colors"
                >
                  {t("nav.joinCustomer")}
                </Link>
                <Link
                  to="/signup?role=studio"
                  data-testid="mobile-signup-studio-btn"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center text-[#0E0E52] px-3 py-1.5 rounded-full text-xs font-medium border border-[#0E0E52]/15 hover:bg-[#0E0E52]/5 transition-colors"
                >
                  {t("nav.listStudio")}
                </Link>
              </div>
            )}
            {visibleNavItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`py-2 text-sm ${
                  loc.pathname === n.to ? "text-[#FF8552]" : "text-[#0E0E52]"
                }`}
              >
                {t(n.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
