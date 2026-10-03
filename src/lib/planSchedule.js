export const PLAN_STATUS = {
  open: { label: "Booking open", badge: "badge-success" },
  full: { label: "Fully booked", badge: "badge-warning" },
  started: { label: "Trip started", badge: "badge-ghost" },
  closed: { label: "Booking closed", badge: "badge-ghost" },
  completed: { label: "Completed", badge: "badge-info" },
  cancelled: { label: "Cancelled", badge: "badge-error" },
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

const fmt = (d, opts) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", opts);

export function formatDateRange(start, end) {
  if (!start || typeof start !== "string") return "";
  if (typeof end !== "string") end = "";
  if (!end || end === start) return fmt(start, { day: "numeric", month: "short", year: "numeric" });
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmt(start, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" })} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function seatsLabel(seats) {
  if (seats === null || seats === undefined) return "";
  if (seats === 0) return "No seats left";
  return `${seats} seat${seats === 1 ? "" : "s"} left`;
}
