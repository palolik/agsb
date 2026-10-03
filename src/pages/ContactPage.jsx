import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiMail, HiPhone, HiCheckCircle } from "react-icons/hi";
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
import { useFetch } from "../hooks/useFetch";
import { apiSend } from "../lib/api";
import { asArray } from "../lib/safe";
import { isValidBdPhone, normalizePhone, PHONE_ERROR } from "../lib/validation";
import { site, whatsappUrl, mailtoUrl, telUrl } from "../config/site";
import PageMeta from "../components/PageMeta";

const EMPTY_FORM = { name: "", phone: "", district: "", purpose: "general", message: "" };
const MAX = { name: 100, phone: 20, message: 2000 };
const PURPOSES = [
  { value: "general", label: "General inquiry" },
  { value: "plan", label: "Trip plan inquiry" },
  { value: "membership", label: "Membership" },
  { value: "partner", label: "Partner with us" },
  { value: "feedback", label: "Feedback" },
];

// Links such as /contact?purpose=membership&plan=Explorer (MembershipPage) or
// /contact?purpose=plan&district=sylhet (DistrictDetailPage) pre-fill the form.
function formFromQuery(params) {
  const purpose = params.get("purpose");
  const plan = (params.get("plan") || "").slice(0, 60);
  const district = (params.get("district") || "").slice(0, 100);
  const form = { ...EMPTY_FORM };
  if (PURPOSES.some((p) => p.value === purpose)) form.purpose = purpose;
  if (district) form.district = district;
  if (purpose === "membership" && plan) {
    form.message = `I'd like to join the ${plan} membership plan. Please tell me how to pay and activate it.`;
  }
  return form;
}

export default function ContactPage() {
  const { data: districts } = useFetch("/districts");
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => formFromQuery(searchParams));
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // A ref, not just state, so a fast double click can't slip past the guard.
  const submittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    setError("");
    setPhoneError("");
    const payload = {
      ...form,
      name: form.name.trim(),
      phone: normalizePhone(form.phone.trim()),
      message: form.message.trim(),
    };
    if (!payload.name || !payload.message) {
      setError("Please fill in your name and message.");
      return;
    }
    if (!isValidBdPhone(payload.phone)) {
      setPhoneError(PHONE_ERROR);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await apiSend("/contact", "POST", payload);
      setForm(EMPTY_FORM);
      setSent(true);
    } catch (err) {
      // api.js puts the server's message (e.g. a 429 "Too many…") on the error.
      setError(err.message || "Could not send your message. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Only channels configured in src/config/site.js are shown.
  const quickLinks = [
    { key: "wa", href: whatsappUrl(), label: "WhatsApp us", Icon: FaWhatsapp, tone: "bg-success/15 text-success", external: true },
    { key: "mail", href: mailtoUrl(), label: site.email, Icon: HiMail, tone: "bg-primary/15 text-primary" },
    { key: "tel", href: telUrl(), label: site.phone, Icon: HiPhone, tone: "bg-accent/15 text-accent" },
    { key: "fb", href: site.social.facebook, label: "Facebook Page", Icon: FaFacebook, tone: "bg-info/15 text-info", external: true },
    { key: "ig", href: site.social.instagram, label: "Instagram", Icon: FaInstagram, tone: "bg-secondary/15 text-secondary", external: true },
  ].filter((l) => l.href);

  const meta = <PageMeta title="যোগাযোগ · Contact" description="Questions about a trip plan, a district or membership? Send us a message." />;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">যোগাযোগ করুন</h1>
      <p className="text-base-content/50 mb-8">Have a question about a trip plan or a district? We'd love to hear from you.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {sent ? (
            <div className="card bg-success/10 border border-success/20 p-8 text-center">
              <HiCheckCircle className="w-14 h-14 text-success mx-auto mb-4" />
              <h2 className="text-xl font-bold text-base-content mb-2">Message sent!</h2>
              <p className="text-base-content/60">We'll get back to you within 4 hours.{whatsappUrl() ? " Check WhatsApp for a faster response." : ""}</p>
              <button onClick={() => setSent(false)} className="btn btn-ghost btn-sm mt-4">Send another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
              {error && <div className="alert alert-error text-sm py-2">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label"><span className="label-text">আপনার নাম</span></label>
                  <input type="text" placeholder="Name" className="input input-bordered bg-base-300 w-full" required maxLength={MAX.name} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="label"><span className="label-text">ফোন / WhatsApp</span></label>
                  <input
                    type="tel"
                    placeholder="01712-345678"
                    className={`input input-bordered bg-base-300 w-full ${phoneError ? "input-error" : ""}`}
                    required
                    maxLength={MAX.phone}
                    value={form.phone}
                    aria-invalid={phoneError ? "true" : undefined}
                    onChange={e => {
                      setForm({...form, phone: e.target.value});
                      if (phoneError) setPhoneError("");
                    }}
                  />
                  {phoneError && <p className="text-error text-xs mt-1" data-testid="phone-error">{phoneError}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label"><span className="label-text">জেলা (optional)</span></label>
                  <select className="select select-bordered bg-base-300 w-full" value={form.district} onChange={e => setForm({...form, district: e.target.value})}>
                    <option value="">Select district</option>
                    {asArray(districts).map(d => <option key={d.id} value={d.slug}>{d.name_bn} ({d.name_en})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label"><span className="label-text">বিষয়</span></label>
                  <select className="select select-bordered bg-base-300 w-full" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})}>
                    {PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label"><span className="label-text">বার্তা</span></label>
                <textarea placeholder="Tell us about your trip idea, group size, budget..." className="textarea textarea-bordered bg-base-300 w-full h-32" required maxLength={MAX.message} value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                <p className="text-xs text-base-content/40 text-right mt-1">{form.message.length}/{MAX.message}</p>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? <><span className="loading loading-spinner loading-sm" /> Sending…</> : "Send Message"}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {quickLinks.length > 0 && (
            <div className="card bg-base-200 p-5 border border-base-300">
              <h3 className="font-bold text-base-content mb-3">Quick contact</h3>
              <div className="space-y-3">
                {quickLinks.map(({ key, href, label, Icon, tone, external }) => (
                  <a key={key} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-3 text-sm text-base-content/70 hover:text-primary transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}><Icon /></div>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="card bg-primary/10 border border-primary/20 p-5">
            <h3 className="font-bold text-base-content mb-1">Response time</h3>
            <p className="text-sm text-base-content/60">We typically respond within 4 hours.{whatsappUrl() ? " For urgent travel plans, WhatsApp is fastest." : ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
