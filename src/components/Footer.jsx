import { Link } from "react-router-dom";
import { HiMail, HiPhone, HiHeart } from "react-icons/hi";
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { site, whatsappUrl, telUrl, mailtoUrl } from "../config/site";

const SOCIALS = [
  { key: "facebook", label: "Facebook", Icon: FaFacebook },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "tiktok", label: "TikTok", Icon: FaTiktok },
  { key: "youtube", label: "YouTube", Icon: FaYoutube },
].filter((s) => site.social[s.key]);

export default function Footer() {
  const wa = whatsappUrl();
  const tel = telUrl();
  const mail = mailtoUrl();
  const hasContact = Boolean(wa || tel || mail);
  return (
    <footer className="bg-base-200 border-t border-base-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-content font-bold">ঘ</div>
              <span className="font-bold text-base-content">AGSB</span>
            </Link>
            <p className="text-sm text-base-content/60 mb-4">
              ৬৪ জেলা, এক দেশ, অসংখ্য গল্প।<br />
              Discover all 64 districts of Bangladesh.
            </p>
            {SOCIALS.length > 0 && (
              <div className="flex gap-3">
                {SOCIALS.map(({ key, label, Icon }) => (
                  <a key={key} href={site.social[key]} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-primary"><Icon aria-hidden="true" /></a>
                ))}
              </div>
            )}
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm font-semibold text-base-content mb-3">Explore</h4>
            <div className="space-y-2">
              <Link to="/districts" className="block text-sm text-base-content/60 hover:text-primary transition-colors">All Districts</Link>
              <Link to="/map" className="block text-sm text-base-content/60 hover:text-primary transition-colors">Interactive Map</Link>
              <Link to="/plans" className="block text-sm text-base-content/60 hover:text-primary transition-colors">Trip Plans</Link>
              <Link to="/blog" className="block text-sm text-base-content/60 hover:text-primary transition-colors">Travel Blog</Link>
              <Link to="/frames" className="block text-sm text-base-content/60 hover:text-primary transition-colors">Photo Frames</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-base-content mb-3">Company</h4>
            <div className="space-y-2">
              <Link to="/about" className="block text-sm text-base-content/60 hover:text-primary transition-colors">About Us</Link>
              <Link to="/partners" className="block text-sm text-base-content/60 hover:text-primary transition-colors">Partners</Link>
              <Link to="/membership" className="block text-sm text-base-content/60 hover:text-primary transition-colors">Membership</Link>
              <Link to="/contact" className="block text-sm text-base-content/60 hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>

          {/* Contact — only the channels configured in src/config/site.js */}
          <div>
            <h4 className="text-sm font-semibold text-base-content mb-3">Get in Touch</h4>
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
                <Link to="/contact" className="block text-sm text-base-content/60 hover:text-primary transition-colors">Send us a message</Link>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-base-300 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-base-content/40">© 2026 AmiGhuriSaraBangladesh. All rights reserved.</p>
          <p className="text-xs text-base-content/40"><span className="inline-flex items-center gap-1">Made with <HiHeart className="text-error" /> for Bangladesh</span></p>
        </div>
      </div>
    </footer>
  );
}
