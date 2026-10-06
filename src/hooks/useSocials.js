import { FaFacebook, FaInstagram, FaYoutube, FaTiktok, FaWhatsapp, FaLinkedin, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useFetch } from "./useFetch";
import { asArray } from "../lib/safe";
import { site } from "../config/site";

export const SOCIAL_PLATFORMS = {
  facebook: { label: "Facebook", Icon: FaFacebook, tone: "bg-info/15 text-info" },
  instagram: { label: "Instagram", Icon: FaInstagram, tone: "bg-secondary/15 text-secondary" },
  youtube: { label: "YouTube", Icon: FaYoutube, tone: "bg-error/15 text-error" },
  tiktok: { label: "TikTok", Icon: FaTiktok, tone: "bg-base-content/10 text-base-content" },
  whatsapp: { label: "WhatsApp", Icon: FaWhatsapp, tone: "bg-success/15 text-success" },
  x: { label: "X", Icon: FaXTwitter, tone: "bg-base-content/10 text-base-content" },
  linkedin: { label: "LinkedIn", Icon: FaLinkedin, tone: "bg-info/15 text-info" },
  website: { label: "Website", Icon: FaGlobe, tone: "bg-primary/15 text-primary" },
};

const isWebUrl = (url) => /^https?:\/\//i.test(String(url || ""));

// Social links managed in the admin panel (GET /socials). Until any are added
// (or while the API is unreachable) the links from the VITE_SOCIAL_* env vars
// are used, so a deployment that only set those keeps working.
// Each item: { key, platform, label, url, Icon, tone }.
export function useSocials() {
  const { data } = useFetch("/socials");
  const fromApi = asArray(data)
    .filter((s) => SOCIAL_PLATFORMS[s.platform] && isWebUrl(s.url))
    .map((s) => ({ key: s._id || `${s.platform}-${s.url}`, platform: s.platform, url: s.url, label: s.label || SOCIAL_PLATFORMS[s.platform].label }));
  const list = fromApi.length
    ? fromApi
    : Object.entries(site.social)
      .filter(([platform, url]) => SOCIAL_PLATFORMS[platform] && isWebUrl(url))
      .map(([platform, url]) => ({ key: platform, platform, url, label: SOCIAL_PLATFORMS[platform].label }));
  return list.map((s) => ({ ...s, Icon: SOCIAL_PLATFORMS[s.platform].Icon, tone: SOCIAL_PLATFORMS[s.platform].tone }));
}
