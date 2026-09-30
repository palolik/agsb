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

export const canPay = (booking) =>
  booking && booking.bookingStatus !== "cancelled" && ["unpaid", "failed"].includes(booking.paymentStatus);
