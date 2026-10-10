import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiMenu, HiX, HiUser, HiShoppingCart } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import { useLang } from "../context/LanguageContext";

const nav = [
  { to: "/", bn: "হোম", en: "Home" },
  { to: "/districts", bn: "জেলা", en: "Districts" },
  { to: "/map", bn: "ম্যাপ", en: "Map" },
  { to: "/plans", bn: "ট্রিপ প্ল্যান", en: "Trip Plans" },
  { to: "/shop", bn: "শপ", en: "Shop" },
  { to: "/blog", bn: "ব্লগ", en: "Blog" },
  { to: "/partners", bn: "পার্টনার", en: "Partners" },
  { to: "/frames", bn: "ফ্রেম", en: "Frames" },
];

// "/" only matches itself; other entries also match their sub-pages
// (e.g. /districts/sylhet highlights Districts).
function isActive(pathname, to) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { count } = useCart();
  const { t } = useLang();

  return (
    // Always the dark theme, whatever the site theme is.
    <nav data-theme="agsb" className="print:hidden bg-base-200/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/assets/agsb_logo.webp" alt="আমি ঘুরি সারা বাংলাদেশ" width="400" height="247" className="h-12 w-auto" />          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                aria-current={isActive(pathname, n.to) ? "page" : undefined}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(pathname, n.to)
                    ? "bg-primary text-primary-content font-medium"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-300/50"
                }`}
              >
                {t(n.bn, n.en)}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link to="/contact" className="btn btn-primary btn-sm hidden md:flex">
              {t("ট্রিপ প্ল্যান করুন", "Plan a Trip")}
            </Link>
            <div className="hidden sm:block"><LanguageToggle /></div>
            <ThemeToggle />
            <Link
              to="/cart"
              aria-label={count ? t(`কার্ট (${count}টি পণ্য)`, `Cart (${count} item${count === 1 ? "" : "s"})`) : t("কার্ট", "Cart")}
              title={t("কার্ট", "Cart")}
              className={`btn btn-ghost btn-sm btn-circle relative ${pathname === "/cart" ? "text-primary" : ""}`}
            >
              <HiShoppingCart className="w-5 h-5" aria-hidden="true" />
              {count > 0 && (
                <span aria-hidden="true" className="badge badge-primary badge-xs absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] font-bold">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
            <Link
              to={user ? "/profile" : "/login"}
              aria-label={user ? t(`আমার প্রোফাইল (${user.name || "অ্যাকাউন্ট"})`, `My profile (${user.name || "account"})`) : t("লগ ইন", "Log in")}
              title={user ? t("আমার প্রোফাইল", "My profile") : t("লগ ইন", "Log in")}
              className="btn btn-ghost btn-sm"
            >
              {user ? (
                <span aria-hidden="true" className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </span>
              ) : (
                <HiUser className="w-5 h-5" aria-hidden="true" />
              )}
            </Link>
            <button
              type="button"
              aria-label={open ? t("মেনু বন্ধ করুন", "Close menu") : t("মেনু খুলুন", "Open menu")}
              aria-expanded={open}
              aria-controls="mobile-menu"
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
        <div id="mobile-menu" className="lg:hidden border-t border-base-300 bg-base-200">
          <div className="px-4 py-3 space-y-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, n.to) ? "page" : undefined}
                className={`block px-3 py-2.5 rounded-lg text-sm ${
                  isActive(pathname, n.to)
                    ? "bg-primary text-primary-content font-medium"
                    : "text-base-content/70"
                }`}
              >
                {t(n.bn, n.en)}
              </Link>
            ))}
            <div className="pt-2 border-t border-base-300 space-y-2">
              <div className="flex items-center justify-between px-3 py-1 sm:hidden">
                <span className="text-sm text-base-content/70">{t("ভাষা", "Language")}</span>
                <LanguageToggle />
              </div>
              <Link to="/cart" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm w-full">
                <HiShoppingCart className="w-4 h-4" aria-hidden="true" /> {t("কার্ট", "Cart")}{count > 0 ? ` (${count})` : ""}
              </Link>
              <Link to="/contact" onClick={() => setOpen(false)} className="btn btn-primary btn-sm w-full">
                {t("ট্রিপ প্ল্যান করুন", "Plan a Trip")}
              </Link>
              <Link
                to={user ? "/profile" : "/login"}
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm w-full"
              >
                {user ? t(`আমার প্রোফাইল (${user.name})`, `My Profile (${user.name})`) : t("লগ ইন / সাইন আপ", "Log In / Sign Up")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
