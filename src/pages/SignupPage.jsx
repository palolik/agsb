import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { useFetch } from "../hooks/useFetch";
import { HiUser, HiMail, HiPhone, HiLockClosed, HiLocationMarker } from "react-icons/hi";
import { asArray } from "../lib/safe";
import { isValidBdPhone, normalizeEmail, normalizePhone, phoneError as phoneErrorText } from "../lib/validation";
import PageMeta from "../components/PageMeta";
import LogoMark from "../components/LogoMark";
import { districtName } from "../lib/districtNames";

export default function SignupPage() {
  const { user, signup } = useAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/profile";
  const { data: districts } = useFetch("/districts");
  const [form, setForm] = useState({ name: "", email: "", phone: "", district: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const meta = <PageMeta title={t("সাইন আপ", "Sign up")} description={t("ঘোরা জেলাগুলোর হিসাব রাখতে আর ব্যাজ সংগ্রহ করতে বিনামূল্যে অ্যাকাউন্ট খুলুন।", "Create a free account to track the districts you have visited and collect badges.")} />;
  if (user) return <>{meta}<Navigate to={redirectTo} replace /></>;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    setPhoneError("");
    const phone = normalizePhone(form.phone.trim());
    if (phone && !isValidBdPhone(phone)) {
      setPhoneError(phoneErrorText(lang));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t("পাসওয়ার্ড দুটো মেলেনি।", "Passwords do not match."));
      return;
    }
    if (form.password.length < 8) {
      setError(t("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।", "Password must be at least 8 characters."));
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await signup({
        name: form.name.trim(),
        email: normalizeEmail(form.email),
        phone,
        district: form.district,
        password: form.password,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      {meta}
      <div className="text-center mb-8">
        <LogoMark className="w-12 h-12 mx-auto mb-4 block" />
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("অ্যাকাউন্ট তৈরি করুন", "Create an account")}</h1>
        <p className="text-base-content/50 mt-1">{t("যোগ দিন আর শুরু করুন আপনার ৬৪ জেলা চ্যালেঞ্জ — একদম ফ্রি", "Join and start your 64-district challenge — free")}</p>
      </div>

      <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        <div>
          <label className="label"><span className="label-text">{t("আপনার নাম", "Your name")}</span></label>
          <label className="input input-bordered bg-base-300 w-full">
            <HiUser className="w-5 h-5 shrink-0 text-base-content/40" />
            <input
              type="text"
              required
              placeholder={t("পুরো নাম", "Full name")}
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="grow"
            />
          </label>
        </div>

        <div>
          <label className="label"><span className="label-text">{t("ইমেইল", "Email")}</span></label>
          <label className="input input-bordered bg-base-300 w-full">
            <HiMail className="w-5 h-5 shrink-0 text-base-content/40" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="grow"
            />
          </label>
        </div>

        <div>
          <label className="label"><span className="label-text">{t("ফোন / WhatsApp", "Phone / WhatsApp")}</span></label>
          <label className={`input input-bordered bg-base-300 w-full ${phoneError ? "input-error" : ""}`}>
            <HiPhone className="w-5 h-5 shrink-0 text-base-content/40" />
            <input
              type="tel"
              placeholder="01712-345678"
              maxLength={20}
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                if (phoneError) setPhoneError("");
              }}
              aria-invalid={phoneError ? "true" : undefined}
              className="grow"
            />
          </label>
          {phoneError && <p className="text-error text-xs mt-1" data-testid="phone-error">{phoneError}</p>}
        </div>

        <div>
          <label className="label"><span className="label-text">{t("নিজ জেলা (ঐচ্ছিক)", "Home district (optional)")}</span></label>
          <div className="relative">
            <HiLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 text-base-content/40 pointer-events-none" />
            <select
              className="select select-bordered bg-base-300 w-full pl-10"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            >
              <option value="">{t("জেলা বেছে নিন", "Select district")}</option>
              {asArray(districts).map((d) => (
                <option key={d.id} value={d.slug}>{lang === "bn" ? d.name_bn || districtName(d.name_en) : districtName(d.name_en)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label"><span className="label-text">{t("পাসওয়ার্ড", "Password")}</span></label>
            <label className="input input-bordered bg-base-300 w-full">
              <HiLockClosed className="w-5 h-5 shrink-0 text-base-content/40" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="grow"
              />
            </label>
          </div>
          <div>
            <label className="label"><span className="label-text">{t("নিশ্চিত করুন", "Confirm")}</span></label>
            <label className="input input-bordered bg-base-300 w-full">
              <HiLockClosed className="w-5 h-5 shrink-0 text-base-content/40" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="grow"
              />
            </label>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? <><span className="loading loading-spinner loading-sm" /> {t("সাইন আপ হচ্ছে…", "Signing up…")}</> : t("ফ্রি সাইন আপ করুন", "Sign Up Free")}
        </button>

        <p className="text-sm text-center text-base-content/50">
          {t("আগে থেকেই অ্যাকাউন্ট আছে?", "Already have an account?")} <Link to="/login" state={location.state} className="text-primary hover:underline">{t("লগইন করুন", "Log in")}</Link>
        </p>
      </form>
    </div>
  );
}
