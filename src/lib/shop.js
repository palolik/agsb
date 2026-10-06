import { asArray } from "./safe";

// Shop (buy + rent travel gear). Limits mirror the backend order controller.
export const MAX_QTY = 10;
export const MAX_RENT_DAYS = 60;

export const ORDER_STATUS = {
  pending: { label: "Pending", label_bn: "অপেক্ষমাণ", badge: "badge-ghost" },
  confirmed: { label: "Confirmed", label_bn: "নিশ্চিত", badge: "badge-success" },
  shipped: { label: "Shipped", label_bn: "পাঠানো হয়েছে", badge: "badge-info" },
  delivered: { label: "Delivered", label_bn: "ডেলিভারি সম্পন্ন", badge: "badge-success" },
  rented_out: { label: "Rented out", label_bn: "ভাড়ায় দেওয়া", badge: "badge-info" },
  returned: { label: "Returned", label_bn: "ফেরত এসেছে", badge: "badge-info" },
  completed: { label: "Completed", label_bn: "সম্পন্ন", badge: "badge-success" },
  cancelled: { label: "Cancelled", label_bn: "বাতিল", badge: "badge-error" },
};

export const FULFILMENT = {
  delivery: { label: "Home delivery", label_bn: "হোম ডেলিভারি" },
  pickup: { label: "Pickup", label_bn: "পিকআপ" },
};

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
export const todayInDhaka = () => new Date(Date.now() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// YYYY-MM-DD shifted by n days.
export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Inclusive day count (pick up and return on the same day = 1), or 0 when
// the dates are missing or reversed.
export function rentDays(start, end) {
  if (!DATE.test(start || "") || !DATE.test(end || "")) return 0;
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
  return days > 0 ? days : 0;
}

// Problem with a rental date range, or "" when it is fine (in `lang`).
export function rentDatesProblem(start, end, lang = "en") {
  const bn = lang === "bn";
  if (!DATE.test(start || "") || !DATE.test(end || "")) return bn ? "ভাড়ার তারিখ বেছে নিন" : "Choose rental dates";
  if (start < todayInDhaka()) return bn ? "ভাড়া অতীতের কোনো তারিখ থেকে শুরু করা যাবে না" : "Rental cannot start in the past";
  if (end < start) return bn ? "ফেরতের তারিখ শুরুর তারিখের দিন বা তার পরে হতে হবে" : "Return date must be on or after the start date";
  if (rentDays(start, end) > MAX_RENT_DAYS) return bn ? `সর্বোচ্চ ${MAX_RENT_DAYS} দিনের জন্য ভাড়া নেওয়া যায়` : `Rentals are limited to ${MAX_RENT_DAYS} days`;
  return "";
}

// lang "bn" formats with Bangla month names and digits (like formatDateRange).
export const formatDay = (iso, lang = "en") => {
  if (!DATE.test(iso || "")) return iso || "";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

export const productName = (p) => p?.name_bn || p?.name || "";

export const canBuy = (p) => p?.salePrice > 0;
export const canRent = (p) => p?.rentPerDay > 0;
export const stockFor = (p, kind) => Math.max(0, Number(kind === "rent" ? p?.rentStock : p?.saleStock) || 0);

// Price of one cart/order line (deposit excluded).
export function linePrice(item) {
  const qty = Number(item.qty) || 0;
  if (item.kind === "rent") return (Number(item.rentPerDay) || 0) * rentDays(item.startDate, item.endDate) * qty;
  return (Number(item.salePrice) || 0) * qty;
}

export const lineDeposit = (item) => (item.kind === "rent" ? (Number(item.rentDeposit) || 0) * (Number(item.qty) || 0) : 0);

export const optionsLabel = (options) =>
  Object.entries(options || {}).map(([k, v]) => `${k}: ${v}`).join(" · ");

// "2 × Tent, Backpack" style one-liner for order lists (names in `lang`).
export const itemsSummary = (items, lang = "en") =>
  asArray(items).map((i) => `${i.qty} × ${lang === "bn" ? i.name_bn || i.name : i.name || i.name_bn}`).join(", ");

// Unpaid orders hold their stock only until holdExpiresAt; the backend sweep
// that cancels them runs every few minutes, so a passed deadline counts as
// expired here too (same rules as trip bookings in booking.js).
const awaitingPayment = (order) =>
  order?.orderStatus !== "cancelled" && ["unpaid", "failed"].includes(order?.paymentStatus);

export function orderHoldDeadline(order) {
  if (!order?.holdExpiresAt || !awaitingPayment(order)) return null;
  const d = new Date(order.holdExpiresAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isOrderHoldExpired(order, now = Date.now()) {
  if (order?.orderStatus === "cancelled") return order.cancelReason === "expired";
  const deadline = orderHoldDeadline(order);
  return !!deadline && deadline.getTime() <= now;
}

export const canPayOrder = (order, now = Date.now()) =>
  !!order && awaitingPayment(order) && !isOrderHoldExpired(order, now);
