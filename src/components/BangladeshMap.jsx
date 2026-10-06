import { memo } from "react";
import { DISTRICT_PATHS } from "../data/bdMapShapes";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { MAP_VIEWBOX } from "../data/districtMapPositions";
import { useLang } from "../context/LanguageContext";

// Each label is centred on its district's pin point (allDistricts.js):
// baseline about a third of the 25px font below it.
const LABEL_BASELINE_OFFSET = 9;

// Shorter Bangla labels where the full name doesn't fit (mirrors `map_label`).
const MAP_LABELS_BN = { chapainawabganj: "নবাবগঞ্জ" };

// Clickable districts act as buttons: Enter/Space activate them like a click.
function onActivateKey(e, fn) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
}

// The district map: one <path> per district piece plus its name. All colours
// and states come from CSS (.bd-map in src/index.css); `districtClass(slug)`
// adds state classes such as "is-visited", "is-selected" or "is-hovered".
//
// With `onSelect`, the districts themselves are the controls (no pins):
//   isInteractive(slug)  which districts can be selected (default: all)
//   ariaLabel(slug)      accessible name of a district button
//   onHover(slug|null)   pointer/focus enters or leaves a district
function BangladeshMap({ districtClass, showLabels = true, className = "", onSelect, isInteractive, ariaLabel, onHover }) {
  const { lang, t } = useLang();
  const bn = lang === "bn";
  return (
    <svg
      viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
      className={`bd-map ${className}`}
      role={onSelect ? "group" : "img"}
      aria-label={t("বাংলাদেশের মানচিত্র", "Map of Bangladesh")}
    >
      <g className="bd-districts">
        {/* SVG has no z-index: the selected district is drawn last so its
            outline isn't hidden under the neighbours' borders. (Only on
            selection, not hover: moving the element under the pointer would
            swallow the click.) */}
        {[...ALL_DISTRICTS]
          .map((d) => ({ d, state: districtClass?.(d.slug) || "" }))
          .sort((a, b) => a.state.includes("is-selected") - b.state.includes("is-selected"))
          .map(({ d, state }) => {
          const interactive = Boolean(onSelect) && (!isInteractive || isInteractive(d.slug));
          const props = interactive
            ? {
              role: "button",
              tabIndex: 0,
              "aria-label": ariaLabel?.(d.slug) || (bn ? d.name_bn || d.name_en : d.name_en),
              onClick: () => onSelect(d.slug),
              onKeyDown: (e) => onActivateKey(e, () => onSelect(d.slug)),
              onMouseEnter: () => onHover?.(d.slug),
              onMouseLeave: () => onHover?.(null),
              onFocus: () => onHover?.(d.slug),
              onBlur: () => onHover?.(null),
            }
            : {};
          return (
            <g
              key={d.slug}
              data-slug={d.slug}
              className={`bd-district ${interactive ? "is-interactive" : ""} ${state}`}
              {...props}
            >
              {(DISTRICT_PATHS[d.slug] || []).map((path, i) => <path key={i} d={path} />)}
            </g>
          );
        })}
      </g>
      {showLabels && (
        <g className="bd-labels" aria-hidden="true">
          {ALL_DISTRICTS.map((d) => (
            <text key={d.slug} x={d.pin[0]} y={d.pin[1] + LABEL_BASELINE_OFFSET} textAnchor="middle" className="bd-label">
              {bn ? MAP_LABELS_BN[d.slug] || d.name_bn || d.name_en : d.map_label || d.name_en}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}

export default memo(BangladeshMap);
