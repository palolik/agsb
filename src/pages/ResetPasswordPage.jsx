import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { HiLockClosed, HiExclamation } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { apiSend } from "../lib/api";
import PageMeta from "../components/PageMeta";
import LogoMark from "../components/LogoMark";

const MIN_PASSWORD = 8;
const TOKEN_RE = /^[a-f0-9]{64}$/i;

// Sets a new password from the emailed link (/reset-password?token=...).
// The backend signs out every session, so the user logs in again after.
export default function ResetPasswordPage() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = (params.get("token") || "").trim();
  const validLink = TOKEN_RE.test(token);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    if (form.password.length < MIN_PASSWORD) {
      setError(t("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।", "Password must be at least 8 characters."));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t("পাসওয়ার্ড দুটো মেলেনি।", "Passwords do not match."));
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await apiSend("/auth/reset-password", "POST", { token: token.toLowerCase(), newPassword: form.password });
      // Every session was revoked, including one in this browser.
      if (user) await logout();
      navigate("/login", {
        replace: true,
        state: { notice: t("পাসওয়ার্ড বদলানো হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।", "Your password has been reset. Log in with your new password.") },
      });
    } catch (err) {
      setError(err.message);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <PageMeta noindex title={t("নতুন পাসওয়ার্ড", "Reset password")} />
      {/* Keep the reset token out of Referer headers. */}
      <meta name="referrer" content="no-referrer" />
      <div className="text-center mb-8">
        <LogoMark className="w-12 h-12 mx-auto mb-4 block" />
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("নতুন পাসওয়ার্ড দিন", "Set a new password")}</h1>
        <p className="text-base-content/50 mt-1">{t("কমপক্ষে ৮ অক্ষরের একটি পাসওয়ার্ড বেছে নিন", "Choose a password with at least 8 characters")}</p>
      </div>

      {!validLink ? (
        <div role="alert" className="card bg-base-200 p-6 border border-base-300 text-center">
          <HiExclamation className="w-10 h-10 text-warning mx-auto mb-3" aria-hidden="true" />
          <p className="text-base-content/70">{t("এই রিসেট লিংকটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।", "This reset link is invalid or has expired.")}</p>
          <Link to="/forgot-password" className="btn btn-primary mt-5">{t("নতুন লিংক চান", "Request a new link")}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
          {error && (
            <div role="alert" className="alert alert-error text-sm py-2">
              <span>
                {error}{" "}
                {/invalid|expired/i.test(error) && (
                  <Link to="/forgot-password" className="underline font-medium">{t("নতুন লিংক চান", "Request a new link")}</Link>
                )}
              </span>
            </div>
          )}

          <div>
            <label className="label" htmlFor="reset-password"><span className="label-text">{t("নতুন পাসওয়ার্ড", "New password")}</span></label>
            <label className="input input-bordered bg-base-300 w-full">
              <HiLockClosed className="w-5 h-5 shrink-0 text-base-content/40" />
              <input
                id="reset-password"
                type="password"
                required
                minLength={MIN_PASSWORD}
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="grow"
              />
            </label>
          </div>

          <div>
            <label className="label" htmlFor="reset-confirm"><span className="label-text">{t("পাসওয়ার্ড নিশ্চিত করুন", "Confirm password")}</span></label>
            <label className="input input-bordered bg-base-300 w-full">
              <HiLockClosed className="w-5 h-5 shrink-0 text-base-content/40" />
              <input
                id="reset-confirm"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="grow"
              />
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? <><span className="loading loading-spinner loading-sm" /> {t("সংরক্ষণ হচ্ছে…", "Saving…")}</> : t("পাসওয়ার্ড বদলান", "Reset password")}
          </button>
        </form>
      )}
    </div>
  );
}
