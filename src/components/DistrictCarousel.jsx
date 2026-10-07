import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import CoverImage from "./CoverImage";
import { asArray } from "../lib/safe";
import { useLang } from "../context/LanguageContext";

const AUTO_ADVANCE_MS = 3000;
// After the user scrolls or taps, wait this long before auto-advancing again.
const RESUME_AFTER_MS = 6000;
const MAX_TILT_DEG = 38;
const EDGE_SCALE = 0.3;

// Horizontally scrolling district cards bent around a curve: each card tilts
// and grows with its distance from the centre, as if seen from inside a
// cylinder. Auto-advances unless the user is interacting or prefers reduced
// motion.
export default function DistrictCarousel({ districts, divisions }) {
  const { t, pick } = useLang();
  const scrollerRef = useRef(null);
  const cardRefs = useRef([]);
  const pausedUntil = useRef(0);
  const hovering = useRef(false);
  const list = asArray(districts);

  const applyCurve = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const half = scroller.clientWidth / 2;
    const center = scroller.scrollLeft + half;
    for (const el of cardRefs.current) {
      if (!el) continue;
      const offset = (el.offsetLeft + el.offsetWidth / 2 - center) / half;
      const d = Math.max(-1.4, Math.min(1.4, offset));
      el.style.transform = `perspective(1100px) rotateY(${-d * MAX_TILT_DEG}deg) scale(${1 + Math.abs(d) * EDGE_SCALE})`;
      el.style.zIndex = String(Math.round(Math.abs(d) * 10));
    }
  }, []);

  // Re-curve on scroll and resize, throttled to one update per frame.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; applyCurve(); });
    };
    // Start on the middle card so both sides curve evenly.
    const mid = cardRefs.current[Math.floor(list.length / 2)];
    if (mid) scroller.scrollLeft = mid.offsetLeft + mid.offsetWidth / 2 - scroller.clientWidth / 2;
    applyCurve();
    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [applyCurve, list.length]);

  const step = useCallback((dir) => {
    const scroller = scrollerRef.current;
    const first = cardRefs.current[0];
    if (!scroller || !first) return;
    const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    const atStart = scroller.scrollLeft <= 2;
    if (dir > 0 && atEnd) scroller.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir < 0 && atStart) scroller.scrollTo({ left: scroller.scrollWidth, behavior: "smooth" });
    else scroller.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: "smooth" });
  }, []);

  // Auto-advance, skipped while hovered, recently touched, the tab is hidden,
  // or the user prefers reduced motion.
  useEffect(() => {
    if (list.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (hovering.current || document.hidden || Date.now() < pausedUntil.current) return;
      step(1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [list.length, step]);

  const pause = () => { pausedUntil.current = Date.now() + RESUME_AFTER_MS; };
  const manualStep = (dir) => { pause(); step(dir); };

  if (list.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}
      onFocus={pause}
      onPointerDown={pause}
      onWheel={pause}
      onTouchStart={pause}
    >
      <div
        ref={scrollerRef}
        className="relative flex gap-6 sm:gap-10 overflow-x-auto snap-x snap-mandatory scrollbar-none py-16 px-[calc(50%-5.5rem)] sm:px-[calc(50%-6.5rem)]"
        aria-label={t("জনপ্রিয় জেলা", "Popular districts")}
      >
        {list.map((d, i) => (
          <Link
            key={d.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            to={`/districts/${d.slug}`}
            className="relative shrink-0 snap-center w-44 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-base-300 group will-change-transform transition-transform duration-150 ease-out"
          >
            <CoverImage image={d.image} alt={pick(d, "name")} sizes="(min-width: 640px) 270px, 230px" width={416} height={555} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-white">
              <p className="text-[11px] uppercase tracking-wide text-white/70">{pick(asArray(divisions).find(dv => dv.id === d.division_id), "name")}</p>
              <h3 className="text-lg font-bold drop-shadow">{pick(d, "name")}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-2 -mt-6">
        <button type="button" onClick={() => manualStep(-1)} aria-label={t("আগের জেলা", "Previous district")} className="btn btn-circle btn-sm btn-ghost border-base-300">
          <HiChevronLeft className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => manualStep(1)} aria-label={t("পরের জেলা", "Next district")} className="btn btn-circle btn-sm btn-ghost border-base-300">
          <HiChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
