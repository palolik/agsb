import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Site language: "bn" (default, matches <html lang="bn"> in index.html) or "en".
export const LANG_KEY = "agsb_lang";
const LANGS = ["bn", "en"];

function readSaved() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGS.includes(saved) ? saved : "bn";
  } catch {
    return "bn";
  }
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readSaved);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // Storage unavailable (private mode): the choice lasts for this visit.
    }
  }, []);

  const value = useMemo(() => {
    const bn = lang === "bn";
    return {
      lang,
      setLang,
      toggle: () => setLang(bn ? "en" : "bn"),
      // Inline pair: t("সব", "All"). Falls back to the other text if one is empty.
      t: (bnText, enText) => (bn ? bnText ?? enText : enText ?? bnText),
      // Localized field from an API record: pick(d, "name") reads name_bn /
      // name_en, falling back to plain `name` (products store English there).
      pick: (obj, field) => {
        if (!obj) return "";
        const bnVal = obj[`${field}_bn`];
        const enVal = obj[`${field}_en`] ?? obj[field];
        return (bn ? bnVal || enVal : enVal || bnVal) || "";
      },
    };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
