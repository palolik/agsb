export const PLAN_STATUS = {
  open: { label: "Booking open", badge: "badge-success" },
  full: { label: "Fully booked", badge: "badge-warning" },
  closed: { label: "Booking closed", badge: "badge-ghost" },
  completed: { label: "Completed", badge: "badge-info" },
  cancelled: { label: "Cancelled", badge: "badge-error" },
};

export function planStatus(plan) {
  const status = plan?.status || "open";
  if (status === "open" && plan?.seats_available === 0) return PLAN_STATUS.full;
  return PLAN_STATUS[status] || PLAN_STATUS.open;
}

// Open plans with seats left (or no seat limit set) can still be requested.
export const isBookable = (plan) => (plan?.status || "open") === "open" && plan?.seats_available !== 0;

const fmt = (d, opts) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", opts);

export function formatDateRange(start, end) {
  if (!start) return "";
  if (!end || end === start) return fmt(start, { day: "numeric", month: "short", year: "numeric" });
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmt(start, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" })} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function seatsLabel(seats) {
  if (seats === null || seats === undefined) return "";
  if (seats === 0) return "No seats left";
  return `${seats} seat${seats === 1 ? "" : "s"} left`;
}
