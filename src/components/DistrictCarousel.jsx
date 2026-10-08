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
// Without the scrollend event, scrolling must stop this long before the loop
// jumps back to the middle copy.
const SETTLE_MS = 140;

// Horizontally scrolling district cards bent around a curve: each card tilts
// and grows with its distance from the centre, as if seen from inside a
// cylinder. Loops forever: the list is rendered three times and, whenever
// scrolling settles outside the middle copy, the scroller jumps by one copy's
// width to the identical spot in the middle copy, which looks like nothing
// happened. Auto-advances unless the user is interacting or prefers reduced
// motion.
export default function DistrictCarousel({ districts, divisions }) {
  const { t, pick } = useLang();
  const scrollerRef = useRef(null);
  const cardRefs = useRef([]);
  const pausedUntil = useRef(0);
  const hovering = useRef(false);
  const list = asArray(districts);
  const copies = list.length > 1 ? 3 : 1;
  const looped = Array.from({ length: copies }, (_, c) => list.map(d => ({ d, c }))).flat();

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
    const n = list.length;
    // Once scrolling settles in the first or last copy, jump to the same spot
    // in the middle copy.
    let settle = 0;
    const recenter = () => {
      const cards = cardRefs.current;
      if (copies < 3 || !cards[n] || !cards[2 * n]) return;
      const copyWidth = cards[n].offsetLeft - cards[0].offsetLeft;
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      const shift = center < cards[n].offsetLeft ? copyWidth : center >= cards[2 * n].offsetLeft ? -copyWidth : 0;
      if (!shift) return;
      // Re-curve in the same frame as the jump, with the cards' transform
      // transition off, so no card visibly animates from its old tilt.
      for (const el of cards) if (el) el.style.transition = "none";
      scroller.scrollLeft += shift;
      applyCurve();
      void scroller.offsetWidth;
      for (const el of cards) if (el) el.style.transition = "";
    };
    const hasScrollEnd = "onscrollend" in window;
    const onScroll = () => {
      schedule();
      if (hasScrollEnd) return;
      clearTimeout(settle);
      settle = setTimeout(recenter, SETTLE_MS);
    };
    // Start on the middle card of the middle copy so both sides curve evenly.
    const mid = cardRefs.current[(copies === 3 ? n : 0) + Math.floor(n / 2)];
    if (mid) scroller.scrollLeft = mid.offsetLeft + mid.offsetWidth / 2 - scroller.clientWidth / 2;
    applyCurve();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    if (hasScrollEnd) scroller.addEventListener("scrollend", recenter);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("scrollend", recenter);
      window.removeEventListener("resize", schedule);
    };
  }, [applyCurve, list.length, copies]);

  const step = useCallback((dir) => {
    const scroller = scrollerRef.current;
    const first = cardRefs.current[0];
    if (!scroller || !first) return;
    const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
    scroller.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: "smooth" });
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
        {looped.map(({ d, c }, i) => (
          <Link
            key={`${c}-${d.id}`}
            ref={(el) => { cardRefs.current[i] = el; }}
            to={`/districts/${d.slug}`}
            // The outer copies only exist for the loop; keep them out of the
            // tab order and away from screen readers.
            aria-hidden={copies === 3 && c !== 1 ? true : undefined}
            tabIndex={copies === 3 && c !== 1 ? -1 : undefined}
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
