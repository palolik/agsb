import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { HiMail, HiCheckCircle } from "react-icons/hi";
import { useLang } from "../context/LanguageContext";
import { apiSend } from "../lib/api";
import { normalizeEmail } from "../lib/validation";
import PageMeta from "../components/PageMeta";
import LogoMark from "../components/LogoMark";

// Asks the backend to email a reset link. The reply is the same whether or
// not the address has an account, so the page never says which.
export default function ForgotPasswordPage() {
  const { t } = useLang();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    const value = normalizeEmail(email);
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await apiSend("/auth/forgot-password", "POST", { email: value });
      setSentTo(value);
    } catch (err) {
      setError(err.status === 429
        ? t("অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।", "Too many attempts. Please wait a while and try again.")
        : err.message);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <PageMeta noindex title={t("পাসওয়ার্ড ভুলে গেছেন", "Forgot password")} />
      <div className="text-center mb-8">
        <LogoMark className="w-12 h-12 mx-auto mb-4 block" />
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("পাসওয়ার্ড ভুলে গেছেন?", "Forgot your password?")}</h1>
        <p className="text-base-content/50 mt-1">{t("আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা পাসওয়ার্ড রিসেটের লিংক পাঠাব", "Enter your account email and we'll send you a link to reset your password")}</p>
      </div>

      {sentTo ? (
        <div className="card bg-base-200 p-6 border border-base-300 space-y-4">
          <div role="status" className="alert alert-success text-sm py-2">
            <HiCheckCircle className="w-5 h-5" aria-hidden="true" />
            <span>
              {t(
                `${sentTo} ঠিকানায় কোনো অ্যাকাউন্ট থাকলে রিসেট লিংক পাঠানো হয়েছে। ইনবক্স (ও স্প্যাম ফোল্ডার) দেখুন।`,
                `If an account exists for ${sentTo}, a reset link is on its way. Check your inbox (and spam folder).`
              )}
            </span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm w-full" onClick={() => setSentTo("")}>
            {t("অন্য ইমেইল দিন", "Use a different email")}
          </button>
          <Link to="/login" className="btn btn-primary w-full">{t("লগইনে ফিরে যান", "Back to log in")}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
          {error && <div role="alert" className="alert alert-error text-sm py-2">{error}</div>}

          <div>
            <label className="label" htmlFor="forgot-email"><span className="label-text">{t("ইমেইল", "Email")}</span></label>
            <label className="input input-bordered bg-base-300 w-full">
              <HiMail className="w-5 h-5 shrink-0 text-base-content/40" />
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="grow"
              />
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? <><span className="loading loading-spinner loading-sm" /> {t("পাঠানো হচ্ছে…", "Sending…")}</> : t("রিসেট লিংক পাঠান", "Send reset link")}
          </button>

          <p className="text-sm text-center text-base-content/50">
            {t("পাসওয়ার্ড মনে পড়েছে?", "Remembered it?")} <Link to="/login" className="text-primary hover:underline">{t("লগইন করুন", "Log in")}</Link>
          </p>
        </form>
      )}
    </div>
  );
}
