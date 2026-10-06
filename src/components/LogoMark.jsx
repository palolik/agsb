// Brand mark: map pin on Bangladesh green with the red sun of the flag.
// Same drawing as public/favicon.svg.
export default function LogoMark({ className = "w-9 h-9", title }) {
  return (
    <svg viewBox="0 0 48 48" className={`shrink-0 ${className}`} role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"} aria-label={title}>
      <rect width="48" height="48" rx="12" fill="#006a4e" />
      <path d="M8 36c6-4.5 11-5 16-3.2S35 36 40 33" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 7.5c-7.2 0-13 5.6-13 12.7C11 29.3 24 39 24 39s13-9.7 13-18.8C37 13.1 31.2 7.5 24 7.5z" fill="#fff" />
      <circle cx="24" cy="20.3" r="5.6" fill="#f42a41" />
    </svg>
  );
}
