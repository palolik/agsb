// Share of the total paid online to hold a booking; must match the backend.
export const ADVANCE_RATE = 0.4;
export const MAX_TICKETS = 10;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const RELATIONS = [
  { value: "self", label: "Self" },
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "relative", label: "Relative" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "other", label: "Other" },
];

export const PAYMENT_STATUS = {
  unpaid: { label: "Advance not paid", badge: "badge-warning" },
  pending_verification: { label: "Payment under review", badge: "badge-info" },
  advance_paid: { label: "Advance paid", badge: "badge-success" },
  paid_full: { label: "Fully paid", badge: "badge-success" },
  failed: { label: "Payment failed", badge: "badge-error" },
};

export const BOOKING_STATUS = {
  pending: { label: "Pending", badge: "badge-ghost" },
  confirmed: { label: "Confirmed", badge: "badge-success" },
  cancelled: { label: "Cancelled", badge: "badge-error" },
  completed: { label: "Completed", badge: "badge-info" },
};

export const BD_PHONE = /^(?:\+?880|0)1[3-9]\d{8}$/;

export const taka = (n) => `৳${Number(n || 0).toLocaleString("en-IN")}`;

export const advanceFor = (total) => Math.ceil(total * ADVANCE_RATE);

// Unpaid bookings hold their seats only until holdExpiresAt (newer backends;
// it is removed once payment is submitted). The backend sweep that cancels
// them with cancelReason "expired" only runs every few minutes, so a passed
// holdExpiresAt counts as expired here too.
const awaitingPayment = (booking) =>
  booking?.bookingStatus !== "cancelled" && ["unpaid", "failed"].includes(booking?.paymentStatus);

// Returns a Date while an unpaid booking has a seat hold, else null. The
// date may already be in the past; see isHoldExpired.
export function holdDeadline(booking) {
  if (!booking?.holdExpiresAt || !awaitingPayment(booking)) return null;
  const d = new Date(booking.holdExpiresAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isHoldExpired(booking, now = Date.now()) {
  if (booking?.bookingStatus === "cancelled") return booking.cancelReason === "expired";
  const deadline = holdDeadline(booking);
  return !!deadline && deadline.getTime() <= now;
}

export const formatHoldTime = (date) =>
  date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

// "mm:ss" (or "h:mm:ss") left until the deadline.
export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const canPay = (booking, now = Date.now()) =>
  !!booking && awaitingPayment(booking) && !isHoldExpired(booking, now);
