import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { districts, divisions } from "../data";
import { HiX, HiExternalLink } from "react-icons/hi";

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (mapInstance.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [23.8, 90.4],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    const greenIcon = L.divIcon({
      className: "",
      html: `<div style="width:24px;height:24px;background:#4CAF50;border:2px solid #1B5E20;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.4);">📍</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    districts.forEach(d => {
      const marker = L.marker([d.lat, d.lng], { icon: greenIcon }).addTo(map);
      marker.on("click", () => setSelected(d));
      marker.bindTooltip(d.name_en, {
        className: "!bg-base-200 !text-base-content !border-base-300 !rounded-lg !px-2 !py-1 !text-xs !shadow-lg",
        direction: "top",
        offset: [0, -12],
      });
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div className="relative h-[calc(100vh-64px)]">
      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Header overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-base-200/90 backdrop-blur-lg rounded-xl p-3 border border-base-300 shadow-xl">
          <h1 className="text-lg font-bold text-base-content">🗺️ Bangladesh Map</h1>
          <p className="text-xs text-base-content/50">Click any marker to explore</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden md:block">
        <div className="bg-base-200/90 backdrop-blur-lg rounded-xl p-3 border border-base-300 shadow-xl">
          <p className="text-xs font-medium text-base-content/70 mb-2">Divisions</p>
          <div className="grid grid-cols-2 gap-1">
            {divisions.map(dv => (
              <div key={dv.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{background: dv.color}} />
                <span className="text-xs text-base-content/60">{dv.name_en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected district panel */}
      {selected && (
        <div className="absolute top-4 right-4 bottom-4 z-[1000] w-72 sm:w-80">
          <div className="bg-base-200/95 backdrop-blur-lg rounded-xl border border-base-300 shadow-2xl h-full overflow-y-auto">
            <div className="relative">
              <img src={selected.image} alt={selected.name_en} className="w-full h-36 object-cover rounded-t-xl" />
              <button onClick={() => setSelected(null)} className="absolute top-2 right-2 btn btn-circle btn-sm btn-ghost bg-base-200/80">
                <HiX />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-200 p-3">
                <span className="badge badge-sm" style={{background: divisions.find(dv => dv.id === selected.division_id)?.color + "33", color: divisions.find(dv => dv.id === selected.division_id)?.color, border: "none"}}>
                  {divisions.find(dv => dv.id === selected.division_id)?.name_en}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold text-base-content">{selected.name_bn}</h2>
              <p className="text-sm text-base-content/60">{selected.name_en}</p>
              <p className="text-sm text-primary mt-1">{selected.tagline}</p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-base-300/50 rounded-lg p-2">
                  <div className="text-xs text-base-content/40">Budget</div>
                  <div className="text-sm font-medium text-base-content">{selected.budget}</div>
                </div>
                <div className="bg-base-300/50 rounded-lg p-2">
                  <div className="text-xs text-base-content/40">Best time</div>
                  <div className="text-sm font-medium text-base-content">{selected.best_time}</div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-base-content/50 mb-2">Top attractions</p>
                {selected.attractions.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-base-300/50 last:border-0">
                    <span className="text-xs">📍</span>
                    <span className="text-sm text-base-content/70">{a.name}</span>
                  </div>
                ))}
              </div>

              <Link to={`/districts/${selected.slug}`} className="btn btn-primary btn-sm w-full mt-4">
                View full guide <HiExternalLink className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
