// Bangladeshi mobile number: optional +88/88 prefix, then 01[3-9] and 8 digits.
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

export const PHONE_ERROR = "Enter a valid Bangladeshi mobile number, e.g. 01712345678 or +8801712345678.";
export const PHONE_ERROR_BN = "সঠিক বাংলাদেশি মোবাইল নম্বর দিন, যেমন 01712345678 বা +8801712345678।";

// Phone error in the site language ("bn" | "en"); defaults to English.
export function phoneError(lang) {
  return lang === "bn" ? PHONE_ERROR_BN : PHONE_ERROR;
}

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
