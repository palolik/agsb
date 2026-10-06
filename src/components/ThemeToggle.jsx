import { HiMoon, HiSun } from "react-icons/hi";
import { useTheme } from "../context/ThemeContext";
import { useLang } from "../context/LanguageContext";

export default function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const { t } = useLang();
  const label = mode === "dark" ? t("লাইট থিমে যান", "Switch to light theme") : t("ডার্ক থিমে যান", "Switch to dark theme");
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="btn btn-ghost btn-sm btn-circle" data-testid="theme-toggle">
      {mode === "dark" ? <HiSun className="w-5 h-5" aria-hidden="true" /> : <HiMoon className="w-5 h-5" aria-hidden="true" />}
    </button>
  );
}
