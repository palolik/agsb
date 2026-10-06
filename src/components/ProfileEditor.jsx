import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { useFetch } from "../hooks/useFetch";
import { apiSend, TOKEN_KEY } from "../lib/api";
import { asArray } from "../lib/safe";
import { districtName } from "../lib/districtNames";
import { isValidBdPhone, normalizePhone, phoneError } from "../lib/validation";

// Edit name / phone / home district (PATCH /profile).
export function EditProfileForm({ user, onDone }) {
  const { updateUser } = useAuth();
  const { lang, t } = useLang();
  const { data: districts } = useFetch("/districts");
  const [form, setForm] = useState({ name: user.name || "", phone: user.phone || "", district: user.district || "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    if (!name) return setError(t("আপনার নাম লিখুন।", "Enter your name."));
    if (form.phone.trim() && !isValidBdPhone(form.phone)) return setError(phoneError(lang));
    setSaving(true);
    try {
      await updateUser({ name, phone: form.phone.trim() ? normalizePhone(form.phone) : "", district: form.district });
      onDone(true);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      {error && <div role="alert" className="alert alert-error text-sm py-2">{error}</div>}
      <div>
        <label className="label py-1" htmlFor="profile-name"><span className="label-text">{t("নাম", "Name")}</span></label>
        <input id="profile-name" className="input input-bordered input-sm bg-base-300 w-full" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label py-1" htmlFor="profile-phone"><span className="label-text">{t("ফোন", "Phone")}</span></label>
        <input id="profile-phone" type="tel" className="input input-bordered input-sm bg-base-300 w-full" placeholder="01712345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <label className="label py-1" htmlFor="profile-district"><span className="label-text">{t("নিজ জেলা", "Home district")}</span></label>
        <select id="profile-district" className="select select-bordered select-sm bg-base-300 w-full" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
          <option value="">{t("দেওয়া হয়নি", "Not set")}</option>
          {/* Keep a stored value the list doesn't have, so saving doesn't silently clear it. */}
          {form.district && !asArray(districts).some((d) => d.slug === form.district) && <option value={form.district}>{form.district}</option>}
          {asArray(districts).map((d) => <option key={d.id || d.slug} value={d.slug}>{lang === "bn" ? d.name_bn || districtName(d.name_en) : districtName(d.name_en)}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn btn-primary btn-sm flex-1" disabled={saving}>
          {saving ? <span className="loading loading-spinner loading-xs" /> : t("সেভ করুন", "Save")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm flex-1" disabled={saving} onClick={() => onDone(false)}>{t("বাতিল", "Cancel")}</button>
      </div>
    </form>
  );
}

// Change password (POST /auth/change-password). Other devices are signed
// out; this one switches to the fresh token the server returns.
export function ChangePasswordForm({ onDone }) {
  const { t } = useLang();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.newPassword.length < 8) return setError(t("নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।", "New password must be at least 8 characters."));
    if (form.newPassword !== form.confirm) return setError(t("নতুন পাসওয়ার্ড দুটো মেলেনি।", "New passwords do not match."));
    setSaving(true);
    try {
      const data = await apiSend("/auth/change-password", "POST", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
      onDone(true);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const input = (key, id, label, autoComplete) => (
    <div>
      <label className="label py-1" htmlFor={id}><span className="label-text">{label}</span></label>
      <input id={id} type="password" autoComplete={autoComplete} className="input input-bordered input-sm bg-base-300 w-full" required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      {error && <div role="alert" className="alert alert-error text-sm py-2">{error}</div>}
      {input("currentPassword", "pw-current", t("বর্তমান পাসওয়ার্ড", "Current password"), "current-password")}
      {input("newPassword", "pw-new", t("নতুন পাসওয়ার্ড", "New password"), "new-password")}
      {input("confirm", "pw-confirm", t("নতুন পাসওয়ার্ড নিশ্চিত করুন", "Confirm new password"), "new-password")}
      <p className="text-xs text-base-content/50">{t("এই ডিভাইসে আপনি লগইন থাকবেন; অন্য ডিভাইসগুলো থেকে লগআউট হয়ে যাবে।", "You stay signed in here; other devices are signed out.")}</p>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary btn-sm flex-1" disabled={saving}>
          {saving ? <span className="loading loading-spinner loading-xs" /> : t("পাসওয়ার্ড বদলান", "Change password")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm flex-1" disabled={saving} onClick={() => onDone(false)}>{t("বাতিল", "Cancel")}</button>
      </div>
    </form>
  );
}
