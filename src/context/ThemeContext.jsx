import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Keep in sync with the inline script in index.html, which applies the theme
// before first paint so the page never flashes the wrong one.
export const THEME_KEY = "agsb_theme";
const THEMES = { dark: "agsb", light: "agsb-light" };
const darkQuery = () => window.matchMedia?.("(prefers-color-scheme: dark)");

// "light" / "dark" once the visitor picks one; null = follow the OS setting.
function readSaved() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

const systemMode = () => (darkQuery()?.matches === false ? "light" : "dark");

const ThemeContext = createContext({ mode: "dark", toggle: () => {} });

export function ThemeProvider({ children }) {
  const [saved, setSaved] = useState(readSaved);
  const [system, setSystem] = useState(systemMode);
  const mode = saved || system;

  // Follow OS changes while the visitor hasn't picked a theme.
  useEffect(() => {
    const query = darkQuery();
    if (!query) return undefined;
    const onChange = () => setSystem(systemMode());
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", THEMES[mode]);
  }, [mode]);

  const toggle = useCallback(() => {
    const next = mode === "dark" ? "light" : "dark";
    setSaved(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage unavailable (private mode): the choice lasts for this visit.
    }
  }, [mode]);

  return <ThemeContext.Provider value={{ mode, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
