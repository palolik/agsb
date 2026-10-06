import { HiUserGroup } from "react-icons/hi";
import { seatsLabel } from "../lib/planSchedule";
import { useLang } from "../context/LanguageContext";

// "X of Y seats left" with a bar of how full the plan is. Nothing for plans
// without a seat limit.
export default function SeatsMeter({ plan, className = "" }) {
  const { lang, t } = useLang();
  const left = plan?.seats_available;
  const label = seatsLabel(left, plan?.seats_total, lang);
  if (!label) return null;
  const total = plan.seats_total;
  const showBar = typeof total === "number" && total > 0;
  const filled = showBar ? Math.min(100, Math.round(((total - left) / total) * 100)) : 0;
  // Few seats left is worth a warning colour.
  const low = left === 0 || (showBar && left / total <= 0.2);
  return (
    <div className={className}>
      <div className={`flex items-center gap-1.5 text-xs ${low ? "text-warning font-medium" : "text-base-content/60"}`}>
        <HiUserGroup className={low ? "" : "text-primary"} aria-hidden="true" /> {label}
      </div>
      {showBar && (
        <div className="h-1.5 rounded-full bg-base-300 mt-1 overflow-hidden" role="progressbar" aria-label={t("বুক হওয়া সিট", "Seats booked")} aria-valuemin={0} aria-valuemax={total} aria-valuenow={total - left}>
          <div className={`h-full rounded-full ${low ? "bg-warning" : "bg-primary"}`} style={{ width: `${filled}%` }} />
        </div>
      )}
    </div>
  );
}
