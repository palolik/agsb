// "3 days ago" / "৩ দিন আগে"; older than a month shows the date.
export function timeAgo(iso, lang) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const locale = lang === "bn" ? "bn-BD" : "en-GB";
  const secs = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(secs);
  if (abs >= 30 * 86400) return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs >= 86400) return rtf.format(Math.round(secs / 86400), "day");
  if (abs >= 3600) return rtf.format(Math.round(secs / 3600), "hour");
  if (abs >= 60) return rtf.format(Math.round(secs / 60), "minute");
  return rtf.format(0, "second");
}
