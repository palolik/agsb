export const PLAN_STATUS = {
  open: { label: "Booking open", label_bn: "বুকিং চলছে", badge: "badge-success" },
  full: { label: "Fully booked", label_bn: "সব সিট বুকড", badge: "badge-warning" },
  started: { label: "Trip started", label_bn: "ট্রিপ শুরু হয়েছে", badge: "badge-ghost" },
  closed: { label: "Booking closed", label_bn: "বুকিং বন্ধ", badge: "badge-ghost" },
  completed: { label: "Completed", label_bn: "সম্পন্ন", badge: "badge-info" },
  cancelled: { label: "Cancelled", label_bn: "বাতিল", badge: "badge-error" },
};

// Mirrors the backend: a trip whose YYYY-MM-DD start date is before today in
// Dhaka (UTC+6) has started and can't be booked. Plans without a usable start
// date are not restricted.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const todayInDhaka = () => new Date(Date.now() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
export const hasStarted = (plan) => {
  const start = typeof plan?.start_date === "string" ? plan.start_date.slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(start) && start < todayInDhaka();
};

export function planStatus(plan) {
  const status = plan?.status || "open";
  if (status === "open" && hasStarted(plan)) return PLAN_STATUS.started;
  if (status === "open" && plan?.seats_available === 0) return PLAN_STATUS.full;
  return PLAN_STATUS[status] || PLAN_STATUS.open;
}

// Open plans that haven't started, with seats left (or no seat limit set), can
// still be requested.
export const isBookable = (plan) =>
  (plan?.status || "open") === "open" && plan?.seats_available !== 0 && !hasStarted(plan);

// lang "bn" formats with Bangla month names and digits.
const fmt = (d, opts, lang) => new Date(`${d}T00:00:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", opts);

export function formatDateRange(start, end, lang = "en") {
  if (!start || typeof start !== "string") return "";
  if (typeof end !== "string") end = "";
  if (!end || end === start) return fmt(start, { day: "numeric", month: "short", year: "numeric" }, lang);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmt(start, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" }, lang)} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" }, lang)}`;
}

// "12 of 40 seats left" when the plan's total is known (seats_total from the
// API), else "12 seats left". "" for plans without a seat limit.
export function seatsLabel(seats, total, lang = "en") {
  if (seats === null || seats === undefined) return "";
  if (lang === "bn") {
    if (seats === 0) return "কোনো সিট খালি নেই";
    return typeof total === "number" && total >= seats ? `${total}টির মধ্যে ${seats}টি সিট খালি` : `${seats}টি সিট খালি`;
  }
  if (seats === 0) return "No seats left";
  const of = typeof total === "number" && total >= seats ? ` of ${total}` : "";
  return `${seats}${of} seat${(total ?? seats) === 1 ? "" : "s"} left`;
}
