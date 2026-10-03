// Public contact details and social links, set per deployment through Vite
// env vars (see .env.example). Every value defaults to "" and the UI hides any
// link or line whose value is empty, so the site never shows a dead link or a
// made-up number.

const env = import.meta.env || {};
const read = (key) => (typeof env[key] === "string" ? env[key].trim() : "");

export const site = {
  phone: read("VITE_CONTACT_PHONE"), // shown as typed, e.g. "+880 1712-345678"
  whatsapp: read("VITE_CONTACT_WHATSAPP").replace(/\D/g, ""), // digits only, e.g. 8801712345678
  email: read("VITE_CONTACT_EMAIL"),
  social: {
    facebook: read("VITE_SOCIAL_FACEBOOK"),
    instagram: read("VITE_SOCIAL_INSTAGRAM"),
    tiktok: read("VITE_SOCIAL_TIKTOK"),
    youtube: read("VITE_SOCIAL_YOUTUBE"),
  },
};

// wa.me link for the configured WhatsApp number, or "" when none is set.
export function whatsappUrl(text, number = site.whatsapp) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// tel: link for the configured phone number, or "" when none is set.
export function telUrl(phone = site.phone) {
  const cleaned = String(phone || "").replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "";
}

export function mailtoUrl(email = site.email) {
  return email ? `mailto:${email}` : "";
}
