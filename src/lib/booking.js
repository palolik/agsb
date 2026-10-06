// Share of the total paid online to hold a booking; must match the backend.
export const ADVANCE_RATE = 0.4;
export const MAX_TICKETS = 10;

export const GENDERS = [
  { value: "male", label: "Male", label_bn: "পুরুষ" },
  { value: "female", label: "Female", label_bn: "নারী" },
  { value: "other", label: "Other", label_bn: "অন্যান্য" },
];

export const RELATIONS = [
  { value: "self", label: "Self", label_bn: "নিজে" },
  { value: "spouse", label: "Spouse", label_bn: "স্বামী/স্ত্রী" },
  { value: "parent", label: "Parent", label_bn: "বাবা/মা" },
  { value: "child", label: "Child", label_bn: "সন্তান" },
  { value: "sibling", label: "Sibling", label_bn: "ভাই/বোন" },
  { value: "relative", label: "Relative", label_bn: "আত্মীয়" },
  { value: "friend", label: "Friend", label_bn: "বন্ধু" },
  { value: "colleague", label: "Colleague", label_bn: "সহকর্মী" },
  { value: "other", label: "Other", label_bn: "অন্যান্য" },
];

export const PAYMENT_STATUS = {
  unpaid: { label: "Advance not paid", label_bn: "অগ্রিম পরিশোধ হয়নি", badge: "badge-warning" },
  pending_verification: { label: "Payment under review", label_bn: "পেমেন্ট যাচাই চলছে", badge: "badge-info" },
  advance_paid: { label: "Advance paid", label_bn: "অগ্রিম পরিশোধিত", badge: "badge-success" },
  paid_full: { label: "Fully paid", label_bn: "সম্পূর্ণ পরিশোধিত", badge: "badge-success" },
  failed: { label: "Payment failed", label_bn: "পেমেন্ট ব্যর্থ", badge: "badge-error" },
};

export const BOOKING_STATUS = {
  pending: { label: "Pending", label_bn: "অপেক্ষমাণ", badge: "badge-ghost" },
  confirmed: { label: "Confirmed", label_bn: "নিশ্চিত", badge: "badge-success" },
  cancelled: { label: "Cancelled", label_bn: "বাতিল", badge: "badge-error" },
  completed: { label: "Completed", label_bn: "সম্পন্ন", badge: "badge-info" },
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

// lang "bn" formats with Bangla month names and digits.
export const formatHoldTime = (date, lang = "en") =>
  date.toLocaleString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

// "mm:ss" (or "h:mm:ss") left until the deadline.
export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Tickets exist once the advance (or the full amount) is verified.
export const hasTickets = (booking) =>
  !!booking && booking.bookingStatus !== "cancelled" && ["advance_paid", "paid_full"].includes(booking.paymentStatus);

export const canPay = (booking, now = Date.now()) =>
  !!booking && awaitingPayment(booking) && !isHoldExpired(booking, now);
