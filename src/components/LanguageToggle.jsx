import { useLang } from "../context/LanguageContext";

// Two-segment switch: the active language is highlighted.
export default function LanguageToggle() {
  const { lang, setLang } = useLang();
  const option = (value, label, aria) => (
    <button
      type="button"
      onClick={() => setLang(value)}
      aria-pressed={lang === value}
      aria-label={aria}
      lang={value}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${lang === value ? "bg-primary text-primary-content" : "text-base-content/60 hover:text-base-content"}`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Language / ভাষা" className="flex items-center rounded-full border border-base-300 bg-base-200 p-0.5" data-testid="lang-toggle">
      {option("bn", "বাং", "বাংলা")}
      {option("en", "EN", "English")}
    </div>
  );
}
