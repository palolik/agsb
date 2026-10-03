import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { resolveImage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { HiDownload, HiPhotograph, HiCamera, HiLocationMarker, HiShare, HiLockClosed } from "react-icons/hi";
import { FaMedal } from "react-icons/fa";
import { asArray, asText } from "../lib/safe";
import { Spinner, ErrorState, EmptyState } from "../components/StateViews";
import PageMeta from "../components/PageMeta";
import CoverImage from "../components/CoverImage";

// Free plan (or no plan recorded) can't download premium frames.
function hasPremium(user) {
  const plan = asText(user?.plan).trim();
  return Boolean(user) && plan !== "" && plan.toLowerCase() !== "free";
}

function extensionFor(blob, url) {
  const fromType = { "image/png": "png", "image/webp": "webp", "image/jpeg": "jpg" }[blob.type];
  if (fromType) return fromType;
  const m = /\.(png|webp|jpe?g)(?:\?|$)/i.exec(url);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

// The image lives on the API origin, where <a download> is ignored for
// cross-origin URLs, so fetch it as a blob and save it via an object URL.
async function downloadFrame(frame) {
  const url = resolveImage(frame.image);
  if (!url) throw new Error("This frame has no image yet.");
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Could not reach the server. Try again.");
  }
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  if (!blob.size) throw new Error("Download failed (empty file)");
  const objectUrl = URL.createObjectURL(blob);
  const slug = asText(frame.districtSlug) || asText(frame._id) || "frame";
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `agsb-frame-${slug}.${extensionFor(blob, url)}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function FrameCard({ frame, district, locked }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = asText(frame.name);

  async function onClick() {
    if (locked) {
      navigate("/membership");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await downloadFrame(frame);
    } catch (err) {
      setError(err.message || "Download failed");
    } finally {
      setBusy(false);
    }
  }

  const districtName = district?.name_en || asText(frame.districtSlug);
  return (
    <div className="card bg-base-200 overflow-hidden border border-base-300 card-hover group" data-testid="frame-card">
      <div className="relative h-40">
        {frame.image ? (
          <CoverImage image={frame.image} alt={name} />
        ) : (
          <div className="w-full h-full bg-base-300 flex items-center justify-center"><HiPhotograph className="w-10 h-10 text-base-content/30" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-base-100/90 via-transparent to-transparent" />
        {frame.premium && (
          <span className="absolute top-2 right-2 badge badge-warning gap-1" data-testid="premium-badge">
            <HiLockClosed className="w-3 h-3" aria-hidden="true" /> Premium
          </span>
        )}
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-xs text-primary font-bold">আমি ঘুরেছি</p>
          {district?.name_bn && <p className="text-sm font-bold text-base-content">{district.name_bn}</p>}
        </div>
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-base-content truncate" title={name}>{name}</p>
          <span className="text-xs text-base-content/50">{districtName}</span>
          <div className={`text-xs ${frame.premium ? "text-warning" : "text-primary"}`}>{frame.premium ? "Premium" : "Free"}</div>
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={busy}
          className={`btn btn-xs shrink-0 ${locked ? "btn-warning" : "btn-primary"}`}
          aria-label={locked ? `Unlock ${name} with a membership` : `Download ${name}`}
          title={locked ? "Premium frame — get a membership" : "Download"}
        >
          {busy ? <span className="loading loading-spinner loading-xs" /> : locked ? <HiLockClosed /> : <HiDownload />}
        </button>
      </div>
      {error && <p role="alert" className="px-3 pb-3 text-xs text-error">{error}</p>}
    </div>
  );
}

function FrameGallery({ onRetry }) {
  const { user } = useAuth();
  const { data: frames, loading, error } = useFetch("/frames");
  // District names are a nice-to-have; frames still render if this fails.
  const { data: districts } = useFetch("/districts");
  const bySlug = useMemo(
    () => new Map(asArray(districts).map((d) => [d.slug, d])),
    [districts],
  );
  const premiumUser = hasPremium(user);

  if (loading) return <Spinner label="Loading frames…" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  const list = asArray(frames);
  if (list.length === 0) return <EmptyState message="No photo frames yet — check back soon." />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      {list.map((f) => (
        <FrameCard
          key={f._id || f.id}
          frame={f}
          district={bySlug.get(f.districtSlug)}
          locked={Boolean(f.premium) && !premiumUser}
        />
      ))}
    </div>
  );
}

export default function FramesPage() {
  const [attempt, setAttempt] = useState(0);
  const { data: plans } = useFetch("/membership-plans");
  // First paid plan's price (plans come sorted by `order`), only if the API has one.
  const paidPlan = asArray(plans).find((p) => asText(p.name).toLowerCase() !== "free" && /\d/.test(asText(p.price)));
  const priceLabel = paidPlan ? `${asText(paidPlan.price)}${asText(paidPlan.period)}` : "";

  const meta = <PageMeta title="ফটো ফ্রেম · Photo Frames" description="Download district photo frames and share your “আমি ঘুরেছি” memories." />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {meta}
      <div className="text-center mb-10">
        <HiCamera className="w-12 h-12 text-primary mx-auto mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold text-base-content">আমি ঘুরেছি — Photo Frames</h1>
        <p className="text-base-content/50 mt-2 max-w-xl mx-auto">Download beautiful district photo frames, share your travel memories, and collect all 64!</p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { step: "1", icon: HiLocationMarker, title: "Pick your district", desc: "Choose a district frame or a special edition design" },
          { step: "2", icon: HiCamera, title: "Download the frame", desc: "Save the frame and add your travel photo to it" },
          { step: "3", icon: HiShare, title: "Share your memory", desc: "Share on social media with #আমিঘুরেছি" },
        ].map(s => (
          <div key={s.step} className="card bg-base-200 p-5 border border-base-300 text-center">
            <s.icon className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-bold text-base-content">{s.title}</h3>
            <p className="text-sm text-base-content/60 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Frame gallery */}
      <h2 className="text-2xl font-bold text-base-content mb-4">District Frames</h2>
      <FrameGallery key={attempt} onRetry={() => setAttempt((n) => n + 1)} />

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
            <Link to="/membership" className="btn btn-primary">
              Get Premium{priceLabel && ` — from ${priceLabel}`}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 w-48">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-base-300 rounded-lg flex items-center justify-center"><HiPhotograph className="w-7 h-7 text-base-content/40" /></div>
            ))}
          </div>
        </div>
      </div>

      {/* 64 district badge tracker */}
      <div className="card bg-primary/10 border border-primary/20 p-6 text-center">
        <h2 className="text-2xl font-bold text-base-content mb-2 flex items-center justify-center gap-2"><FaMedal className="text-primary" /> 64-District Badge Tracker</h2>
        <p className="text-base-content/60 mb-4">Create an account to track your district visits, collect badges, and earn the ultimate completion certificate!</p>
        <Link to="/membership" className="btn btn-primary">Start Tracking</Link>
      </div>
    </div>
  );
}
