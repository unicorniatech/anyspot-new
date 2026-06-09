import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navItems = [
  { to: "/", label: "Home", protected: false },
  { to: "/explore", label: "Explore", protected: false },
  { to: "/dashboard", label: "Dashboard", protected: true },
  { to: "/partner", label: "Partner", protected: true },
];

export default function Header() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();

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
          <div className="w-9 h-9 rounded-full bg-[#0E0E52] flex items-center justify-center text-white group-hover:bg-[#FF8552] transition-colors">
            <Sparkles size={18} strokeWidth={2.4} />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-[#0E0E52]">
            AnySpot
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#CBF3D2] text-[#0E0E52]"
                    : "text-[#4A4A7A] hover:text-[#0E0E52]"
                }`
              }
              end={n.to === "/"}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!loading && user && (
            <Link
              to="/dashboard"
              data-testid="credit-pill"
              className="hidden sm:flex items-center gap-2 rounded-full bg-[#0E0E52] text-white px-4 py-2 text-sm hover:bg-[#FF8552] transition-colors"
            >
              <span className="font-display font-semibold">{user.credits}</span>
              <span className="text-white/70 text-xs uppercase tracking-widest">Credits</span>
            </Link>
          )}

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
                <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard">
                  My dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/partner")} data-testid="menu-partner">
                  Partner mode
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="menu-logout"
                  onClick={onLogout}
                  className="text-[#FF8552] focus:text-[#FF8552]"
                >
                  <LogOut size={14} className="mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading ? (
            <Link
              to="/login"
              data-testid="signin-btn"
              className="bg-[#FF8552] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#E57545] transition-colors"
            >
              Sign in
            </Link>
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
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`py-2 text-sm ${
                  loc.pathname === n.to ? "text-[#FF8552]" : "text-[#0E0E52]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
