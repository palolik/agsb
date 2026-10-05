// The BD map SVG positions each district label by its left edge, sized for
// 17.9px Arial. To enlarge labels (src/index.css) without them drifting right,
// re-anchor every label at its centre. The centre is estimated from the
// original text length (average Arial glyph ≈ 0.52em, labels are scaled 0.93
// horizontally), which is close enough at map scale. Labels are also lifted
// above their district pin.
const ORIGINAL_FONT_SIZE = 17.8907;
const AVG_GLYPH_EM = 0.52;
// Pins (allDistricts.js) sit 22 units above each original baseline; lift the
// label so its baseline is 12 units above the pin and the dot shows below it.
const LIFT = 34;

export function centerMapLabels(markup) {
  if (!markup || typeof DOMParser === "undefined") return markup;
  const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return markup;
  svg.querySelectorAll("text").forEach((text) => {
    const match = /matrix\(([^)]+)\)/.exec(text.getAttribute("transform") || "");
    if (!match) return;
    const [a, b, c, d, x, y] = match[1].trim().split(/[\s,]+/).map(Number);
    if (![a, b, c, d, x, y].every(Number.isFinite)) return;
    const halfWidth = (text.textContent.length * ORIGINAL_FONT_SIZE * AVG_GLYPH_EM * a) / 2;
    text.setAttribute("transform", `matrix(${a} ${b} ${c} ${d} ${x + halfWidth} ${y - LIFT})`);
    text.setAttribute("text-anchor", "middle");
  });
  return new XMLSerializer().serializeToString(svg);
}
