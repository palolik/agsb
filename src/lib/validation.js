// Bangladeshi mobile number: optional +88/88 prefix, then 01[3-9] and 8 digits.
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

export const PHONE_ERROR = "Enter a valid Bangladeshi mobile number, e.g. 01712345678 or +8801712345678.";

// Spaces and dashes are allowed while typing ("+880 1712-345678").
export function normalizePhone(value) {
  return String(value ?? "").replace(/[\s-]/g, "");
}

export function isValidBdPhone(value) {
  return BD_PHONE.test(normalizePhone(value));
}

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}
