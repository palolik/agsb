import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiMail, HiLockClosed } from "react-icons/hi";
import { normalizeEmail } from "../lib/validation";
import PageMeta from "../components/PageMeta";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/profile";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const meta = <PageMeta title="লগইন · Log in" />;
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
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-content font-bold text-xl mx-auto mb-4">ঘ</div>
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">আবার স্বাগতম</h1>
        <p className="text-base-content/50 mt-1">Log in to track your districts and manage your trips</p>
      </div>

      <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        <div>
          <label className="label"><span className="label-text">ইমেইল</span></label>
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
          <label className="label"><span className="label-text">পাসওয়ার্ড</span></label>
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
          {submitting ? <><span className="loading loading-spinner loading-sm" /> Logging in…</> : "Log In"}
        </button>

        <p className="text-sm text-center text-base-content/50">
          Don't have an account? <Link to="/signup" state={location.state} className="text-primary hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
