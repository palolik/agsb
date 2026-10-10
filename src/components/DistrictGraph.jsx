import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_DISTRICTS } from "../data/allDistricts";
import { districtName } from "../lib/districtNames";
import { DISTRICT_PATHS } from "../data/bdMapShapes";

// Hero "knowledge graph": every district is a node placed at its map pin, so
// the graph keeps Bangladesh's shape, linked to its nearest neighbours. Nodes
// drift independently (positions are written straight to the DOM each frame,
// not through React state), labels cross-fade Bangla ⇄ English, and a
// spotlight walks the graph showing both names at once.

const NEIGHBOURS = 3;
const SPOTLIGHT_MS = 2600;

// Deterministic 0..1 noise so the layout is stable across renders.
const noise = (i, salt) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function buildGraph() {
  const nodes = ALL_DISTRICTS.map((d, i) => ({
    slug: d.slug,
    en: districtName(d.name_en),
    bn: d.name_bn,
    x: d.pin[0],
    y: d.pin[1],
    // Drift: amplitude (viewBox units), speed and phase per axis.
    ax: 14 + noise(i, 1) * 22,
    ay: 14 + noise(i, 2) * 22,
    sx: 0.35 + noise(i, 3) * 0.5,
    sy: 0.35 + noise(i, 4) * 0.5,
    px: noise(i, 5) * Math.PI * 2,
    py: noise(i, 6) * Math.PI * 2,
  }));

  const seen = new Set();
  const edges = [];
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .filter(o => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, NEIGHBOURS)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([Math.min(i, j), Math.max(i, j)]);
        }
      });
  });
  return { nodes, edges };
}

export default function DistrictGraph({ className = "" }) {
  const { nodes, edges } = useMemo(buildGraph, []);
  const nodeRefs = useRef([]);
  const edgeRefs = useRef([]);
  const spotRef = useRef(null);
  const [spot, setSpot] = useState(() => nodes.findIndex(n => n.slug === "dhaka"));
  const [hovering, setHovering] = useState(false);
  const spotIdx = useRef(spot);
  spotIdx.current = spot;

  const reduceMotion = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Per-frame drift.
  useEffect(() => {
    if (reduceMotion) return;
    let raf;
    const pos = nodes.map(n => [n.x, n.y]);
    const tick = (ms) => {
      const t = ms / 1000;
      nodes.forEach((n, i) => {
        const x = n.x + Math.sin(t * n.sx + n.px) * n.ax;
        const y = n.y + Math.cos(t * n.sy + n.py) * n.ay;
        pos[i][0] = x;
        pos[i][1] = y;
        nodeRefs.current[i]?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      });
      edges.forEach(([a, b], k) => {
        const el = edgeRefs.current[k];
        if (!el) return;
        el.setAttribute("x1", pos[a][0].toFixed(1));
        el.setAttribute("y1", pos[a][1].toFixed(1));
        el.setAttribute("x2", pos[b][0].toFixed(1));
        el.setAttribute("y2", pos[b][1].toFixed(1));
      });
      const s = pos[spotIdx.current];
      if (s) spotRef.current?.setAttribute("transform", `translate(${s[0].toFixed(1)} ${s[1].toFixed(1)})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes, edges, reduceMotion]);

  // Spotlight walks to a random neighbour, so it travels along the edges.
  useEffect(() => {
    if (reduceMotion || hovering) return;
    const id = setInterval(() => {
      setSpot(cur => {
        const next = edges.filter(([a, b]) => a === cur || b === cur).map(([a, b]) => (a === cur ? b : a));
        return next.length ? next[Math.floor(Math.random() * next.length)] : 0;
      });
    }, SPOTLIGHT_MS);
    return () => clearInterval(id);
  }, [edges, reduceMotion, hovering]);

  const s = nodes[spot];
  const cardW = s ? Math.max(220, s.bn.length * 27, s.en.length * 18) + 50 : 0;
  const isLit = ([a, b]) => a === spot || b === spot;

  return (
    <div className={`district-graph relative ${className}`} aria-hidden="true">
      <svg viewBox="-60 40 1580 1730" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="dg-glow">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Country outline behind the graph, from the same map viewBox as the pins. */}
        <g fill="var(--color-primary)" fillOpacity="0.06" stroke="var(--color-primary)" strokeOpacity="0.35" strokeWidth="2" strokeLinejoin="round">
          {Object.entries(DISTRICT_PATHS).flatMap(([slug, paths]) =>
            paths.map((d, k) => <path key={`${slug}-${k}`} d={d} />)
          )}
        </g>

        <g strokeLinecap="round">
          {edges.map((e, k) => (
            <line
              key={k}
              ref={el => (edgeRefs.current[k] = el)}
              x1={nodes[e[0]].x} y1={nodes[e[0]].y} x2={nodes[e[1]].x} y2={nodes[e[1]].y}
              stroke={isLit(e) ? "var(--color-primary)" : "var(--color-base-content)"}
              strokeOpacity={isLit(e) ? 0.85 : 0.14}
              strokeWidth={isLit(e) ? 5 : 2.5}
              className={isLit(e) ? "dg-edge-lit" : undefined}
              style={{ transition: "stroke-opacity .6s, stroke-width .6s" }}
            />
          ))}
        </g>

        <g>
          {nodes.map((n, i) => (
            <g
              key={n.slug}
              ref={el => (nodeRefs.current[i] = el)}
              transform={`translate(${n.x} ${n.y})`}
              onMouseEnter={() => { setHovering(true); setSpot(i); }}
              onMouseLeave={() => setHovering(false)}
              style={{ cursor: "default" }}
            >
              <circle r="34" fill="transparent" />
              <circle r={i === spot ? 0 : 11} fill="oklch(0.72 0.16 150)" stroke="var(--color-base-100)" strokeWidth="3" />
              <g className="dg-label" style={{ "--dg-delay": `${-(i * 0.53) % 8}s` }} opacity={i === spot ? 0 : 1}>
                <text className="dg-bn" y="-22" textAnchor="middle" fontSize="30" fill="var(--color-base-content)">{n.bn}</text>
                <text className="dg-en" y="-22" textAnchor="middle" fontSize="28" fill="var(--color-base-content)">{n.en}</text>
              </g>
            </g>
          ))}
        </g>

        {s && (
          <g ref={spotRef} transform={`translate(${s.x} ${s.y})`} style={{ pointerEvents: "none" }}>
            <circle r="90" fill="url(#dg-glow)" className="dg-pulse" />
            <circle r="17" fill="var(--color-primary)" stroke="var(--color-base-100)" strokeWidth="5" />
            <g key={spot} className="dg-card" transform="translate(0 -46)">
              <rect x={-cardW / 2} y="-104" width={cardW} height="104" rx="22"
                fill="var(--color-base-100)" fillOpacity="0.92"
                stroke="var(--color-primary)" strokeOpacity="0.5" strokeWidth="3" />
              <text y="-58" textAnchor="middle" fontSize="44" fontWeight="700" fill="var(--color-primary)">{s.bn}</text>
              <text y="-18" textAnchor="middle" fontSize="30" fill="var(--color-base-content)" fillOpacity="0.7">{s.en}</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
