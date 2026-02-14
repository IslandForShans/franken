import { useState, useCallback, useRef, useLayoutEffect, useMemo } from "react";
import { ALL_TILE_KEYS } from "../data/tileCatalog";

const S = 62;
const D = Math.sqrt(3) * S;
const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

const MAP_POSITIONS = [
  { label: "000", x: 0, y: 0 },
  { label: "101", x: 0, y: -D }, { label: "102", x: 1.5 * S, y: -D / 2 },
  { label: "103", x: 1.5 * S, y: D / 2 }, { label: "104", x: 0, y: D },
  { label: "105", x: -1.5 * S, y: D / 2 }, { label: "106", x: -1.5 * S, y: -D / 2 },
  { label: "201", x: 0, y: -2 * D }, { label: "202", x: 1.5 * S, y: -3 * D / 2 },
  { label: "203", x: 3 * S, y: -D }, { label: "204", x: 3 * S, y: 0 },
  { label: "205", x: 3 * S, y: D }, { label: "206", x: 1.5 * S, y: 3 * D / 2 },
  { label: "207", x: 0, y: 2 * D }, { label: "208", x: -1.5 * S, y: 3 * D / 2 },
  { label: "209", x: -3 * S, y: D }, { label: "210", x: -3 * S, y: 0 },
  { label: "211", x: -3 * S, y: -D }, { label: "212", x: -1.5 * S, y: -3 * D / 2 },
  { label: "301", x: 0, y: -3 * D }, { label: "302", x: 1.5 * S, y: -5 * D / 2 },
  { label: "303", x: 3 * S, y: -2 * D }, { label: "304", x: 4.5 * S, y: -3 * D / 2 },
  { label: "305", x: 4.5 * S, y: -D / 2 }, { label: "306", x: 4.5 * S, y: D / 2 },
  { label: "307", x: 4.5 * S, y: 3 * D / 2 }, { label: "308", x: 3 * S, y: 2 * D },
  { label: "309", x: 1.5 * S, y: 5 * D / 2 }, { label: "310", x: 0, y: 3 * D },
  { label: "311", x: -1.5 * S, y: 5 * D / 2 }, { label: "312", x: -3 * S, y: 2 * D },
  { label: "313", x: -4.5 * S, y: 3 * D / 2 }, { label: "314", x: -4.5 * S, y: D / 2 },
  { label: "315", x: -4.5 * S, y: -D / 2 }, { label: "316", x: -4.5 * S, y: -3 * D / 2 },
  { label: "317", x: -3 * S, y: -2 * D }, { label: "318", x: -1.5 * S, y: -5 * D / 2 },
];

const PAD = S * 1.2;
const CANVAS_W = 9 * S + PAD * 2;
const CANVAS_H = 7 * D + PAD * 2;
const ORIGIN_X = CANVAS_W / 2;
const ORIGIN_Y = CANVAS_H / 2;
function buildTileMeta(key) {
  const [code = key, ...nameParts] = key.split("_");
  return {
    key,
    code,
    name: nameParts.join(" ") || code,
    src: `${import.meta.env.BASE_URL}tiles/${key}.png`,
  };
}

const ALL_TILES = ALL_TILE_KEYS.map(buildTileMeta);
const HOME_TILE_CODES = new Set(Array.from({ length: 17 }, (_, i) => String(i + 1).padStart(2, "0")));
const HOME_TILES = ALL_TILES.filter((tile) => HOME_TILE_CODES.has(tile.code));
const NON_HOME_TILES = ALL_TILES.filter((tile) => !HOME_TILE_CODES.has(tile.code));
const DEFAULT_CENTER_TILE = ALL_TILES.find((tile) => tile.code === "18")?.key || "18_MR";

function HexTile({ tile, size }) {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  return (
    <div style={{ width: w, height: h, clipPath: HEX_CLIP, overflow: "hidden", position: "relative", cursor: "grab", flexShrink: 0 }}>
      <img
        src={tile.src}
        alt={tile.name}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        draggable={false}
      />
    </div>
  );
}

function EmptySlot({ label, size, isOver }) {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${w / 2 + size * Math.cos(a)},${h / 2 + size * Math.sin(a)}`;
  }).join(" ");
  return (
    <div style={{ width: w, height: h, position: "relative" }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <polygon
          points={pts}
          fill={isOver ? "rgba(96,165,250,0.2)" : "rgba(55,65,81,0.3)"}
          stroke={isOver ? "#60a5fa" : "#6b7280"}
          strokeWidth={isOver ? 2 : 1.5}
          strokeDasharray={isOver ? "none" : "4,4"}
          style={{ transition: "all 0.12s" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isOver ? "#bfdbfe" : "#9ca3af",
          fontSize: size * 0.18,
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function TI4MapBuilder({ onNavigate }) {
  const [placed, setPlaced] = useState({ "000": DEFAULT_CENTER_TILE });
  const [dragOver, setDragOver] = useState(null);
  const [section, setSection] = useState("systems");
  const [mapScale, setMapScale] = useState(1);
  const dragRef = useRef(null);
  const mapViewportRef = useRef(null);

  useLayoutEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const { width, height } = viewport.getBoundingClientRect();
      if (!width || !height) return;

      const horizontalScale = (width - 24) / CANVAS_W;
      const verticalScale = (height - 24) / CANVAS_H;
      setMapScale(Math.min(1, horizontalScale, verticalScale));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  const activeTiles = section === "home" ? HOME_TILES : NON_HOME_TILES;
  const placedSet = useMemo(() => new Set(Object.values(placed)), [placed]);

  const mapString = ["000", ...MAP_POSITIONS.slice(1).map((p) => p.label)]
    .map((lbl) => (placed[lbl] ? buildTileMeta(placed[lbl]).code : "0"))
    .join(" ");

  const onSidebarDragStart = useCallback((key) => {
    dragRef.current = { type: "sidebar", key };
  }, []);

  const onMapDragStart = useCallback((label, key) => {
    dragRef.current = { type: "map", key, from: label };
  }, []);

  const onDragOver = useCallback((e, label) => {
    e.preventDefault();
    setDragOver(label);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(null), []);

  const onDrop = useCallback((e, to) => {
    e.preventDefault();
    setDragOver(null);
    const src = dragRef.current;
    if (!src) return;
    setPlaced((prev) => {
      const next = { ...prev };
      if (src.type === "sidebar") {
        next[to] = src.key;
      } else {
        const existing = prev[to];
        next[to] = src.key;
        if (src.from !== to) {
          if (existing) next[src.from] = existing;
          else delete next[src.from];
        }
      }
      return next;
    });
  }, []);

  const onRemove = useCallback((label) => {
    if (label === "000") return;
    setPlaced((prev) => {
      const next = { ...prev };
      delete next[label];
      return next;
    });
  }, []);

  return (
    <div style={{ display: "flex", height: "100dvh", background: "linear-gradient(to bottom right, #0a0e1a, #1a1f2e, #000000)", color: "#c8dde8", fontFamily: "system-ui,sans-serif", overflow: "hidden" }}>
      <div style={{ width: 220, minWidth: 220, background: "#0f172a", borderRight: "1px solid #4b5563", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 12px 10px", borderBottom: "1px solid #4b5563" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#fcd34d", textTransform: "uppercase", marginBottom: 10 }}>
            Tile Library
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["systems", "home"].map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  background: section === s ? "#374151" : "transparent",
                  border: `1px solid ${section === s ? "#6b7280" : "#4b5563"}`,
                  borderRadius: 6,
                  color: section === s ? "#f9fafb" : "#d1d5db",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s === "systems" ? "Systems" : "Home"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {activeTiles.map((tile) => {
            const isPlaced = placedSet.has(tile.key);
            return (
              <div
                key={tile.key}
                draggable={!isPlaced}
                onDragStart={() => !isPlaced && onSidebarDragStart(tile.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  opacity: isPlaced ? 0.35 : 1,
                  cursor: isPlaced ? "default" : "grab",
                  padding: "4px 6px 4px 3px",
                  borderRadius: 6,
                }}
              >
                <HexTile tile={tile} size={20} />
                <span style={{ fontSize: 11, color: isPlaced ? "#6b7280" : "#f3f4f6", fontWeight: 600 }}>
                  {tile.code} · {tile.name}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "8px 10px", borderTop: "1px solid #4b5563", fontSize: 10, color: "#9ca3af", lineHeight: 1.6 }}>
          Drag onto the map.<br />Right-click to remove.<br />Drag to swap slots.
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="app-header bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
  <div className="px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {onNavigate && (
                <button
                  onClick={() => onNavigate("/")}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
                >
                  ← Home
                </button>
              )}
              <h2 className="text-xl font-bold text-yellow-400">Map Builder</h2>
              <span className="text-xs text-gray-400 font-semibold tracking-widest uppercase hidden sm:inline">3-Ring Standard</span>
            </div>
            <button
              onClick={() => setPlaced({ "000": DEFAULT_CENTER_TILE })}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
            >
              Clear Map
            </button>
          </div>
        </div>

        <div ref={mapViewportRef} style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, flexShrink: 0, transform: `scale(${mapScale})`, transformOrigin: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, #111827 0%, #030712 75%)", borderRadius: 6 }} />
            {MAP_POSITIONS.map(({ label, x, y }) => {
              const key = placed[label];
              const tile = key ? buildTileMeta(key) : null;
              const cx = ORIGIN_X + x;
              const cy = ORIGIN_Y + y;
              const hexH = Math.sqrt(3) * S;
              const isOver = dragOver === label;
              return (
                <div
                  key={label}
                  style={{ position: "absolute", left: cx - S, top: cy - hexH / 2, zIndex: isOver ? 10 : 1 }}
                  onDragOver={(e) => onDragOver(e, label)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, label)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onRemove(label);
                  }}
                >
                  {tile ? (
                    <div draggable onDragStart={() => onMapDragStart(label, tile.key)} style={{ clipPath: HEX_CLIP, filter: isOver ? "brightness(1.2)" : "brightness(1)", transition: "filter 0.12s", outline: "none" }}>
                      <HexTile tile={tile} size={S} />
                    </div>
                  ) : (
                    <EmptySlot label={label} size={S} isOver={isOver} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "8px 16px", borderTop: "1px solid #4b5563", background: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, letterSpacing: 1, color: "#9ca3af", textTransform: "uppercase", flexShrink: 0 }}>Map String</span>
          <div style={{ flex: 1, background: "#030712", border: "1px solid #4b5563", borderRadius: 6, padding: "6px 8px", fontSize: 11, color: "#d1d5db", fontFamily: "monospace", overflowX: "auto", whiteSpace: "nowrap" }}>
            {mapString}
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(mapString)}
            style={{ background: "#374151", border: "1px solid #6b7280", borderRadius: 6, color: "#f3f4f6", fontSize: 11, fontWeight: 600, padding: "5px 12px", cursor: "pointer", textTransform: "uppercase", flexShrink: 0 }}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}