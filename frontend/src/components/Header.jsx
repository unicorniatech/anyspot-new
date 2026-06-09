import { Link, NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Sparkles, Menu } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function Header() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: api.me });
  const [open, setOpen] = useState(false);
  const loc = useLocation();

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
          <Link
            to="/dashboard"
            data-testid="credit-pill"
            className="hidden sm:flex items-center gap-2 rounded-full bg-[#0E0E52] text-white px-4 py-2 text-sm hover:bg-[#FF8552] transition-colors"
          >
            <span className="font-display font-semibold">{me?.credits ?? "—"}</span>
            <span className="text-white/70 text-xs uppercase tracking-widest">Credits</span>
          </Link>
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
