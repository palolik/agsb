import { useState } from "react";
import { HiMail, HiPhone, HiLocationMarker } from "react-icons/hi";
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
import { districts } from "../data";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", district: "", purpose: "general", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => { e.preventDefault(); setSent(true); };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-2">যোগাযোগ করুন</h1>
      <p className="text-base-content/50 mb-8">Need a custom travel plan? Have a question? We'd love to hear from you.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {sent ? (
            <div className="card bg-success/10 border border-success/20 p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-base-content mb-2">Message sent!</h2>
              <p className="text-base-content/60">We'll get back to you within 4 hours. Check WhatsApp for a faster response.</p>
              <button onClick={() => setSent(false)} className="btn btn-ghost btn-sm mt-4">Send another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card bg-base-200 p-6 border border-base-300 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label"><span className="label-text">আপনার নাম</span></label>
                  <input type="text" placeholder="Name" className="input input-bordered bg-base-300 w-full" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="label"><span className="label-text">ফোন / WhatsApp</span></label>
                  <input type="tel" placeholder="+880 1XXX-XXXXXX" className="input input-bordered bg-base-300 w-full" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label"><span className="label-text">জেলা (optional)</span></label>
                  <select className="select select-bordered bg-base-300 w-full" value={form.district} onChange={e => setForm({...form, district: e.target.value})}>
                    <option value="">Select district</option>
                    {districts.map(d => <option key={d.id} value={d.slug}>{d.name_bn} ({d.name_en})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label"><span className="label-text">বিষয়</span></label>
                  <select className="select select-bordered bg-base-300 w-full" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})}>
                    <option value="general">General inquiry</option>
                    <option value="plan">Custom travel plan</option>
                    <option value="partner">Partner with us</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label"><span className="label-text">বার্তা</span></label>
                <textarea placeholder="Tell us about your trip idea, group size, budget..." className="textarea textarea-bordered bg-base-300 w-full h-32" required value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary w-full">Send Message</button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="card bg-base-200 p-5 border border-base-300">
            <h3 className="font-bold text-base-content mb-3">Quick contact</h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-3 text-sm text-base-content/70 hover:text-primary transition-colors">
                <div className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center text-success"><FaWhatsapp /></div>
                WhatsApp us
              </a>
              <a href="mailto:hello@amighuri.com" className="flex items-center gap-3 text-sm text-base-content/70 hover:text-primary transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary"><HiMail /></div>
                hello@amighuri.com
              </a>
              <a href="#" className="flex items-center gap-3 text-sm text-base-content/70 hover:text-primary transition-colors">
                <div className="w-9 h-9 rounded-lg bg-info/15 flex items-center justify-center text-info"><FaFacebook /></div>
                Facebook Page
              </a>
              <a href="#" className="flex items-center gap-3 text-sm text-base-content/70 hover:text-primary transition-colors">
                <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary"><FaInstagram /></div>
                Instagram
              </a>
            </div>
          </div>
          <div className="card bg-primary/10 border border-primary/20 p-5">
            <h3 className="font-bold text-base-content mb-1">Response time</h3>
            <p className="text-sm text-base-content/60">We typically respond within 4 hours. For urgent travel plans, WhatsApp is fastest.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
