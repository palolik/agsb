import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { districts } from "../data";
import { HiUser, HiMail, HiPhone, HiLockClosed } from "react-icons/hi";

export default function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", district: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  if (user) return <Navigate to="/profile" replace />;

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      signup(form);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-content font-bold text-xl mx-auto mb-4">ঘ</div>
        <h1 className="text-2xl md:text-3xl font-bold text-base-content">অ্যাকাউন্ট তৈরি করুন</h1>
        <p className="text-base-content/50 mt-1">Join and start your 64-district challenge — free</p>
      </div>

      <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        <div>
          <label className="label"><span className="label-text">আপনার নাম</span></label>
          <div className="relative">
            <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30" />
            <input
              type="text"
              required
              placeholder="Full name"
              className="input input-bordered bg-base-300 w-full pl-10"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>

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
          <label className="label"><span className="label-text">ফোন / WhatsApp</span></label>
          <div className="relative">
            <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30" />
            <input
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              className="input input-bordered bg-base-300 w-full pl-10"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label"><span className="label-text">হোম জেলা (optional)</span></label>
          <select
            className="select select-bordered bg-base-300 w-full"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.id} value={d.slug}>{d.name_bn} ({d.name_en})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div>
            <label className="label"><span className="label-text">নিশ্চিত করুন</span></label>
            <div className="relative">
              <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input input-bordered bg-base-300 w-full pl-10"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full">Sign Up Free</button>

        <p className="text-sm text-center text-base-content/50">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
