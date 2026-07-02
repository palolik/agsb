import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiMail, HiLockClosed } from "react-icons/hi";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  if (user) return <Navigate to="/profile" replace />;

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      login(form);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-content font-bold text-xl mx-auto mb-4">ঘ</div>
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">আবার স্বাগতম</h1>
        <p className="text-base-content/50 mt-1">Log in to track your districts and manage your trips</p>
      </div>

      <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        <div>
          <label className="label"><span className="label-text">ইমেইল</span></label>
          <div className="relative">
            <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="input input-bordered bg-base-300 w-full pl-10"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label"><span className="label-text">পাসওয়ার্ড</span></label>
          <div className="relative">
            <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30" />
            <input
              type="password"
              required
              placeholder="••••••••"
              className="input input-bordered bg-base-300 w-full pl-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full">Log In</button>

        <p className="text-sm text-center text-base-content/50">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
