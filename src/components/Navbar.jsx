import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiMenu, HiX, HiGlobe, HiUser } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/", label: "Home" },
  { to: "/districts", label: "Districts" },
  { to: "/map", label: "Map" },
  { to: "/plans", label: "Trip Plans" },
  { to: "/blog", label: "Blog" },
  { to: "/partners", label: "Partners" },
  { to: "/frames", label: "Frames" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <nav className="bg-base-200/80 backdrop-blur-xl border-b border-base-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-content font-bold text-lg">ঘ</div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-base-content leading-tight">আমিঘুরিসারাবাংলাদেশ</div>
              <div className="text-[10px] text-secondary leading-tight tracking-wide">64 DISTRICTS · ONE COUNTRY</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === n.to
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-300/50"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm btn-circle hidden sm:flex">
              <HiGlobe className="w-5 h-5" />
            </button>
            <Link to="/contact" className="btn btn-primary btn-sm hidden md:flex">
              Plan a Trip
            </Link>
            <Link to={user ? "/profile" : "/login"} className="btn btn-ghost btn-sm">
              {user ? (
                <span className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </span>
              ) : (
                <HiUser className="w-5 h-5" />
              )}
            </Link>
            <button
              className="btn btn-ghost btn-sm btn-circle lg:hidden"
              onClick={() => setOpen(!open)}
            >
              {open ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-base-300 bg-base-200">
          <div className="px-4 py-3 space-y-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm ${
                  pathname === n.to
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-base-content/70"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-base-300 space-y-2">
              <Link to="/contact" onClick={() => setOpen(false)} className="btn btn-primary btn-sm w-full">
                Plan a Trip
              </Link>
              <Link
                to={user ? "/profile" : "/login"}
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm w-full border-base-300"
              >
                {user ? `My Profile (${user.name})` : "Log In / Sign Up"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
