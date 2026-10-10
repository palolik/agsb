import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { HiMail, HiLockClosed } from "react-icons/hi";
import { normalizeEmail } from "../lib/validation";
import PageMeta from "../components/PageMeta";
import LogoMark from "../components/LogoMark";

export default function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/profile";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const meta = <PageMeta noindex title={t("লগইন", "Log in")} />;
  if (user) return <>{meta}<Navigate to={redirectTo} replace /></>;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await login({ email: normalizeEmail(form.email), password: form.password });
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
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">{t("আবার স্বাগতম", "Welcome back")}</h1>
        <p className="text-base-content/50 mt-1">{t("আপনার ঘোরা জেলাগুলোর হিসাব রাখতে ও ট্রিপ সামলাতে লগইন করুন", "Log in to track your districts and manage your trips")}</p>
      </div>

      <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

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

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? <><span className="loading loading-spinner loading-sm" /> {t("লগইন হচ্ছে…", "Logging in…")}</> : t("লগইন", "Log In")}
        </button>

        <p className="text-sm text-center text-base-content/50">
          {t("অ্যাকাউন্ট নেই?", "Don't have an account?")} <Link to="/signup" state={location.state} className="text-primary hover:underline">{t("সাইন আপ করুন", "Sign up")}</Link>
        </p>
      </form>
    </div>
  );
}
