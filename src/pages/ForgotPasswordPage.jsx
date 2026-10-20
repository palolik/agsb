import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiMail, HiCheckCircle, HiKey, HiLockClosed } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { apiSend } from "../lib/api";
import { normalizeEmail } from "../lib/validation";
import PageMeta from "../components/PageMeta";
import LogoMark from "../components/LogoMark";

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;
const CODE_LENGTH = 6;
const DEFAULT_RESEND_SECONDS = 60;
const DEFAULT_CODE_MINUTES = 10;

// Three-step reset: email -> 6-digit emailed code -> new password.
// The backend answers step 1 the same way whether or not the address has an
// account, so the page never says which. The reset token from step 2 lives in
// component state only (never the URL or storage).
export default function ForgotPasswordPage() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(location.state?.email || "");
  const [sentTo, setSentTo] = useState("");
  const [codeMinutes, setCodeMinutes] = useState(DEFAULT_CODE_MINUTES);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const codeInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

  // Tick once a second while the resend button is cooling down.
  useEffect(() => {
    if (step !== 2 || resendAt <= Date.now()) return undefined;
    const id = setInterval(() => {
      const ts = Date.now();
      setNow(ts);
      if (ts >= resendAt) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [step, resendAt]);

  // Move focus to the main field of each step.
  useEffect(() => {
    if (step === 2) codeInputRef.current?.focus();
    if (step === 3) passwordInputRef.current?.focus();
  }, [step]);

  function rateLimitedOr(err) {
    return err.status === 429
      ? t("অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।", "Too many attempts. Please wait a while and try again.")
      : err.message;
  }

  // Wraps a submit so double clicks and Enter spam send one request.
  async function guarded(fn) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await fn();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function sendCode(address) {
    return guarded(async () => {
      setError("");
      setInfo("");
      try {
        const data = await apiSend("/auth/forgot-password", "POST", { email: address });
        const wait = Number(data.resendAfterSeconds) > 0 ? Number(data.resendAfterSeconds) : DEFAULT_RESEND_SECONDS;
        const ts = Date.now();
        setSentTo(address);
        setCodeMinutes(Number(data.codeMinutes) > 0 ? Number(data.codeMinutes) : DEFAULT_CODE_MINUTES);
        setNow(ts);
        setResendAt(ts + wait * 1000);
        setCode("");
        setInfo(t(
          "আপনার ইমেইলে একটি ৬-সংখ্যার কোড পাঠানো হয়েছে।",
          "We sent a 6-digit code to your email."
        ));
        setStep(2);
      } catch (err) {
        if (err.status === 404) {
          // No account uses this email: stay on step 1 so it can be corrected.
          setStep(1);
          setError(t("এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।", "No account found with this email."));
        } else {
          setError(rateLimitedOr(err));
        }
      }
    });
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    sendCode(normalizeEmail(email));
  }

  function handleCodeSubmit(e) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setError(t("ইমেইলে পাঠানো ৬-সংখ্যার কোডটি দিন।", "Enter the 6-digit code from the email."));
      return;
    }
    guarded(async () => {
      setError("");
      try {
        const data = await apiSend("/auth/verify-reset-code", "POST", { email: sentTo, code });
        if (!data.resetToken) throw new Error(t("কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।", "Something went wrong. Please try again."));
        setResetToken(data.resetToken);
        setInfo("");
        setStep(3);
      } catch (err) {
        setError(rateLimitedOr(err));
      }
    });
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < MIN_PASSWORD) {
      setError(t("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।", "Password must be at least 8 characters."));
      return;
    }
    if (form.password.length > MAX_PASSWORD) {
      setError(t("পাসওয়ার্ড সর্বোচ্চ ২০০ অক্ষরের হতে পারে।", "Password can be at most 200 characters."));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t("পাসওয়ার্ড দুটো মেলেনি।", "Passwords do not match."));
      return;
    }
    guarded(async () => {
      try {
        await apiSend("/auth/reset-password", "POST", { resetToken, newPassword: form.password });
        setResetToken("");
        // Every session was revoked, including one in this browser.
        if (user) await logout();
        navigate("/login", {
          replace: true,
          state: { notice: t("পাসওয়ার্ড বদলানো হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।", "Your password has been reset. Log in with your new password.") },
        });
      } catch (err) {
        // An invalid or expired reset token cannot be retried: start over.
        if (err.status === 400 && /token|expired/i.test(err.message)) {
          setResetToken("");
          setCode("");
          setForm({ password: "", confirm: "" });
          setInfo("");
          setStep(1);
        }
        setError(rateLimitedOr(err));
      }
    });
  }

  function changeEmail() {
    setError("");
    setInfo("");
    setCode("");
    setStep(1);
  }

  const steps = [
    t("ইমেইল", "Email"),
    t("কোড", "Code"),
    t("নতুন পাসওয়ার্ড", "New password"),
  ];

  const subtitle = step === 1
    ? t("আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা একটি ৬-সংখ্যার কোড পাঠাব", "Enter your account email and we'll send you a 6-digit code")
    : step === 2
      ? t("ইমেইলে পাঠানো কোডটি দিন", "Enter the code we emailed you")
      : t("কমপক্ষে ৮ অক্ষরের একটি পাসওয়ার্ড বেছে নিন", "Choose a password with at least 8 characters");

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <PageMeta noindex title={t("পাসওয়ার্ড ভুলে গেছেন", "Forgot password")} />
      <div className="text-center mb-6">
        <LogoMark className="w-12 h-12 mx-auto mb-4 block" />
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">
          {step === 3 ? t("নতুন পাসওয়ার্ড দিন", "Set a new password") : t("পাসওয়ার্ড ভুলে গেছেন?", "Forgot your password?")}
        </h1>
        <p className="text-base-content/50 mt-1">{subtitle}</p>
      </div>

      <ol className="steps w-full mb-6 text-xs" aria-label={t("ধাপ", "Steps")}>
        {steps.map((label, i) => (
          <li
            key={label}
            className={`step ${i < step ? "step-primary" : ""}`}
            aria-current={i + 1 === step ? "step" : undefined}
          >
            {label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form onSubmit={handleEmailSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
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
            {submitting ? <><span className="loading loading-spinner loading-sm" /> {t("পাঠানো হচ্ছে…", "Sending…")}</> : t("কোড পাঠান", "Send code")}
          </button>

          <p className="text-sm text-center text-base-content/50">
            {t("পাসওয়ার্ড মনে পড়েছে?", "Remembered it?")} <Link to="/login" className="text-primary hover:underline">{t("লগইন করুন", "Log in")}</Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleCodeSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
          {info && !error && (
            <div role="status" className="alert alert-success text-sm py-2">
              <HiCheckCircle className="w-5 h-5" aria-hidden="true" />
              <span>{info}</span>
            </div>
          )}
          {error && <div role="alert" className="alert alert-error text-sm py-2">{error}</div>}

          <p className="text-sm text-base-content/70">
            {t("কোড পাঠানো হয়েছে:", "Code sent to:")} <span className="font-medium text-base-content break-all">{sentTo}</span>{" "}
            <button type="button" className="link link-primary text-sm" onClick={changeEmail}>
              {t("ইমেইল বদলান", "Change email")}
            </button>
          </p>

          <div>
            <label className="label" htmlFor="forgot-code"><span className="label-text">{t("৬-সংখ্যার কোড", "6-digit code")}</span></label>
            <label className="input input-bordered bg-base-300 w-full">
              <HiKey className="w-5 h-5 shrink-0 text-base-content/40" />
              <input
                ref={codeInputRef}
                id="forgot-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={CODE_LENGTH}
                required
                placeholder="123456"
                aria-describedby="forgot-code-help"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                className="grow tracking-[0.5em] font-mono text-lg"
              />
            </label>
            <p id="forgot-code-help" className="text-xs text-base-content/50 mt-2">
              {t(
                `কোডটির মেয়াদ ${codeMinutes} মিনিট। ইমেইল না পেলে স্প্যাম ফোল্ডার দেখুন।`,
                `The code expires in ${codeMinutes} minutes. Can't find it? Check your spam folder.`
              )}
            </p>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting || code.length !== CODE_LENGTH}>
            {submitting ? <><span className="loading loading-spinner loading-sm" /> {t("যাচাই হচ্ছে…", "Verifying…")}</> : t("কোড যাচাই করুন", "Verify code")}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm w-full"
            disabled={submitting || resendIn > 0}
            onClick={() => sendCode(sentTo)}
          >
            {resendIn > 0
              ? t(`আবার কোড পাঠান (${resendIn} সে.)`, `Resend code (${resendIn}s)`)
              : t("আবার কোড পাঠান", "Resend code")}
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handlePasswordSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
          {error && <div role="alert" className="alert alert-error text-sm py-2">{error}</div>}

          <div>
            <label className="label" htmlFor="reset-password"><span className="label-text">{t("নতুন পাসওয়ার্ড", "New password")}</span></label>
            <label className="input input-bordered bg-base-300 w-full">
              <HiLockClosed className="w-5 h-5 shrink-0 text-base-content/40" />
              <input
                ref={passwordInputRef}
                id="reset-password"
                type="password"
                required
                minLength={MIN_PASSWORD}
                maxLength={MAX_PASSWORD}
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
            <label className={`input input-bordered bg-base-300 w-full ${mismatch ? "input-error" : ""}`}>
              <HiLockClosed className="w-5 h-5 shrink-0 text-base-content/40" />
              <input
                id="reset-confirm"
                type="password"
                required
                maxLength={MAX_PASSWORD}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={mismatch || undefined}
                aria-describedby={mismatch ? "reset-confirm-error" : undefined}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="grow"
              />
            </label>
            {mismatch && (
              <p id="reset-confirm-error" className="text-xs text-error mt-2">{t("পাসওয়ার্ড দুটো মেলেনি", "Passwords do not match")}</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting || mismatch}>
            {submitting ? <><span className="loading loading-spinner loading-sm" /> {t("সংরক্ষণ হচ্ছে…", "Saving…")}</> : t("পাসওয়ার্ড বদলান", "Reset password")}
          </button>
        </form>
      )}
    </div>
  );
}
