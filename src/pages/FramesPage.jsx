import { Link } from "react-router-dom";
import { districts, divisions } from "../data";
import { HiDownload, HiPhotograph, HiStar } from "react-icons/hi";

const featured = districts.filter(d => d.status === "complete").slice(0, 8);

export default function FramesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">📸</div>
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">আমি ঘুরেছি — Photo Frames</h1>
        <p className="text-base-content/50 mt-2 max-w-xl mx-auto">Download beautiful district photo frames, share your travel memories, and collect all 64!</p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { step: "1", icon: "📍", title: "Pick your district", desc: "Choose from 64 district frames plus special edition designs" },
          { step: "2", icon: "📷", title: "Upload your photo", desc: "Add your travel photo to the frame using our builder" },
          { step: "3", icon: "📤", title: "Share your memory", desc: "Download and share on social media with #আমিঘুরেছি" },
        ].map(s => (
          <div key={s.step} className="card bg-base-200 p-5 border border-base-300 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <h3 className="font-bold text-base-content">{s.title}</h3>
            <p className="text-sm text-base-content/60 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Frame gallery */}
      <h2 className="text-2xl font-bold text-base-content mb-4">District Frames</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {featured.map(d => (
          <div key={d.id} className="card bg-base-200 overflow-hidden border border-base-300 card-hover group">
            <div className="relative h-40">
              <img src={d.image} alt={d.name_en} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-base-100/90 via-transparent to-transparent" />
              <div className="absolute inset-0 border-[6px] border-primary/30 rounded-lg m-2" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-xs text-primary font-bold">আমি ঘুরেছি</p>
                <p className="text-sm font-bold text-base-content">{d.name_bn}</p>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-base-content/50">{d.name_en}</span>
                <div className="text-xs text-primary">Free</div>
              </div>
              <button className="btn btn-primary btn-xs"><HiDownload /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Premium section */}
      <div className="card bg-base-200 border border-base-300 p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <span className="badge badge-warning mb-2">Premium</span>
            <h2 className="text-2xl font-bold text-base-content mb-2">Premium Frame Collection</h2>
            <p className="text-base-content/60 mb-4">
              Get access to exclusive designs — heritage frames, seasonal editions, division frames, and the 64-district completion certificate frame.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["No watermark", "HD download", "Exclusive designs", "Priority access"].map(f => (
                <span key={f} className="badge badge-ghost border-base-300">{f}</span>
              ))}
            </div>
            <Link to="/membership" className="btn btn-primary">Get Premium — ৳199/mo</Link>
          </div>
          <div className="grid grid-cols-2 gap-2 w-48">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-base-300 rounded-lg flex items-center justify-center text-2xl">🖼️</div>
            ))}
          </div>
        </div>
      </div>

      {/* 64 district badge tracker */}
      <div className="card bg-primary/10 border border-primary/20 p-6 text-center">
        <h2 className="text-2xl font-bold text-base-content mb-2">🏅 64-District Badge Tracker</h2>
        <p className="text-base-content/60 mb-4">Create an account to track your district visits, collect badges, and earn the ultimate completion certificate!</p>
        <Link to="/membership" className="btn btn-primary">Start Tracking</Link>
      </div>
    </div>
  );
}
