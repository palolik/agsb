import { Link } from "react-router-dom";
import { HiMail, HiPhone, HiHeart } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";
import { site, whatsappUrl, telUrl, mailtoUrl } from "../config/site";
import { useSocials } from "../hooks/useSocials";
import LogoMark from "./LogoMark";
import { useLang } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLang();
  const socials = useSocials();
  const wa = whatsappUrl();
  const tel = telUrl();
  const mail = mailtoUrl();
  const hasContact = Boolean(wa || tel || mail);
  return (
    <footer className="print:hidden bg-base-200 border-t border-base-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <LogoMark className="w-8 h-8" />
              <span className="font-bold text-base-content">AGSB</span>
            </Link>
            <p className="text-sm text-base-content/60 mb-4">
              {t("৬৪ জেলা, এক দেশ, অসংখ্য গল্প।", "64 districts, one country, countless stories.")}<br />
              {t("ঘুরে দেখুন বাংলাদেশের ৬৪টি জেলা।", "Discover all 64 districts of Bangladesh.")}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {socials.map(({ key, url, label, Icon }) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-primary"><Icon aria-hidden="true" /></a>
                ))}
              </div>
            )}
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-semibold text-base-content mb-3">{t("ঘুরে দেখুন", "Explore")}</h4>
            <div className="space-y-2">
              <Link to="/districts" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("সব জেলা", "All Districts")}</Link>
              <Link to="/map" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("ইন্টারঅ্যাকটিভ ম্যাপ", "Interactive Map")}</Link>
              <Link to="/plans" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("ট্রিপ প্ল্যান", "Trip Plans")}</Link>
              <Link to="/shop" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("শপ", "Shop")}</Link>
              <Link to="/blog" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("ট্রাভেল ব্লগ", "Travel Blog")}</Link>
              <Link to="/frames" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("ফটো ফ্রেম", "Photo Frames")}</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-base-content mb-3">{t("প্রতিষ্ঠান", "Company")}</h4>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("আমাদের সম্পর্কে", "About Us")}</Link>
              <Link to="/partners" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("পার্টনার", "Partners")}</Link>
              <Link to="/membership" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("মেম্বারশিপ", "Membership")}</Link>
              <Link to="/contact" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("যোগাযোগ", "Contact")}</Link>
            </div>
          </div>

          {/* Contact — only the channels configured in src/config/site.js */}
          <div>
            <h4 className="text-sm font-semibold text-base-content mb-3">{t("যোগাযোগ করুন", "Get in Touch")}</h4>
            <div className="space-y-2">
              {mail && (
                <a href={mail} className="flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors">
                  <HiMail className="w-4 h-4" /> {site.email}
                </a>
              )}
              {tel && (
                <a href={tel} className="flex items-center gap-2 text-sm text-base-content/60 hover:text-primary transition-colors">
                  <HiPhone className="w-4 h-4" /> {site.phone}
                </a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <FaWhatsapp className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {!hasContact && (
                <Link to="/contact" className="block text-sm text-base-content/60 hover:text-primary transition-colors">{t("আমাদের মেসেজ পাঠান", "Send us a message")}</Link>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-base-300 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-base-content/40">© 2026 AmiGhuriSaraBangladesh. {t("সর্বস্বত্ব সংরক্ষিত।", "All rights reserved.")}</p>
          <p className="text-xs text-base-content/40"><span className="inline-flex items-center gap-1">{t("বাংলাদেশের জন্য", "Made with")} <HiHeart className="text-error" /> {t("দিয়ে তৈরি", "for Bangladesh")}</span></p>
        </div>
      </div>
    </footer>
  );
}
