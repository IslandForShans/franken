import { useState, useCallback, useRef } from "react";

const IMAGE_BASE = "./tiles";
const TILE_NAMES = {
  "18": "Mecatol_Rex",
};
const SIDEBAR_TILE_IDS = Array.from({ length: 32 }, (_, i) => String(i + 19));
const HOME_TILE_IDS = Array.from({ length: 17 }, (_, i) => String(i + 1));

const S = 62;
const D = Math.sqrt(3) * S;

const MAP_POSITIONS = [
  { label: "000", x: 0, y: 0 },
  { label: "101", x: 0, y: -D }, { label: "102", x: 1.5*S, y: -D/2 },
  { label: "103", x: 1.5*S, y: D/2 }, { label: "104", x: 0, y: D },
  { label: "105", x: -1.5*S, y: D/2 }, { label: "106", x: -1.5*S, y: -D/2 },
  { label: "201", x: 0, y: -2*D }, { label: "202", x: 1.5*S, y: -3*D/2 },
  { label: "203", x: 3*S, y: -D }, { label: "204", x: 3*S, y: 0 },
  { label: "205", x: 3*S, y: D }, { label: "206", x: 1.5*S, y: 3*D/2 },
  { label: "207", x: 0, y: 2*D }, { label: "208", x: -1.5*S, y: 3*D/2 },
  { label: "209", x: -3*S, y: D }, { label: "210", x: -3*S, y: 0 },
  { label: "211", x: -3*S, y: -D }, { label: "212", x: -1.5*S, y: -3*D/2 },
  { label: "301", x: 0, y: -3*D }, { label: "302", x: 1.5*S, y: -5*D/2 },
  { label: "303", x: 3*S, y: -2*D }, { label: "304", x: 4.5*S, y: -3*D/2 },
  { label: "305", x: 4.5*S, y: -D/2 }, { label: "306", x: 4.5*S, y: D/2 },
  { label: "307", x: 4.5*S, y: 3*D/2 }, { label: "308", x: 3*S, y: 2*D },
  { label: "309", x: 1.5*S, y: 5*D/2 }, { label: "310", x: 0, y: 3*D },
  { label: "311", x: -1.5*S, y: 5*D/2 }, { label: "312", x: -3*S, y: 2*D },
  { label: "313", x: -4.5*S, y: 3*D/2 }, { label: "314", x: -4.5*S, y: D/2 },
  { label: "315", x: -4.5*S, y: -D/2 }, { label: "316", x: -4.5*S, y: -3*D/2 },
  { label: "317", x: -3*S, y: -2*D }, { label: "318", x: -1.5*S, y: -5*D/2 },
];

const PAD = S * 1.2;
const CANVAS_W = 9 * S + PAD * 2;
const CANVAS_H = 7 * D + PAD * 2;
const ORIGIN_X = CANVAS_W / 2;
const ORIGIN_Y = CANVAS_H / 2;
const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

const TILE_PALETTE = [
  "#0d2a45","#112d4a","#0e2740","#103048","#0f2b46","#122f4e","#0d2843",
  "#112c48","#0c2540","#133150","#0e2a44","#102e48","#102c46","#122f4c",
];
function tileColor(id) { return TILE_PALETTE[parseInt(id, 10) % TILE_PALETTE.length]; }
function tileImageSrc(id) {
  const name = TILE_NAMES[id];
  return name ? `${IMAGE_BASE}/${id}_${name}.png` : null;
}

function HexTile({ id, size }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = tileImageSrc(id);
  const w = size * 2, h = Math.sqrt(3) * size;
  return (
    <div style={{ width: w, height: h, clipPath: HEX_CLIP, overflow: "hidden", position: "relative", cursor: "grab", flexShrink: 0 }}>
      {src && !imgFailed ? (
        <img src={src} alt="" onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} draggable={false} />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          background: `radial-gradient(ellipse at 40% 35%, ${tileColor(id)}ff 0%, #040c18 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2,
        }}>
          <span style={{ color: "#6aaec8", fontSize: size * 0.3, fontWeight: 700, fontFamily: "serif", letterSpacing: 1 }}>
            {String(id).padStart(2, "0")}
          </span>
          {TILE_NAMES[id] && (
            <span style={{ color: "#3a6a84", fontSize: size * 0.14, textAlign: "center", padding: "0 6px", fontFamily: "serif" }}>
              {TILE_NAMES[id].replace(/_/g, " ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EmptySlot({ label, size, isOver }) {
  const w = size * 2, h = Math.sqrt(3) * size;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${w / 2 + size * Math.cos(a)},${h / 2 + size * Math.sin(a)}`;
  }).join(" ");
  return (
    <div style={{ width: w, height: h, position: "relative" }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <polygon points={pts}
          fill={isOver ? "rgba(80,160,210,0.14)" : "rgba(20,50,90,0.15)"}
          stroke={isOver ? "#5ab4dc" : "#1e4060"}
          strokeWidth={isOver ? 2 : 1.5}
          strokeDasharray={isOver ? "none" : "4,4"}
          style={{ transition: "all 0.12s" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: isOver ? "#2a6080" : "#1a3a55",
        fontSize: size * 0.18, fontFamily: "serif", fontWeight: 600, letterSpacing: 1,
      }}>{label}</div>
    </div>
  );
}

export default function TI4MapBuilder({ onNavigate }) {
  const [placed, setPlaced] = useState({ "000": "18" });
  const [dragOver, setDragOver] = useState(null);
  const [section, setSection] = useState("systems");
  const dragRef = useRef(null);

  const mapString = ["000", ...MAP_POSITIONS.slice(1).map(p => p.label)]
    .map(lbl => placed[lbl] || "0").join(" ");

  const onSidebarDragStart = useCallback((id) => { dragRef.current = { type: "sidebar", id }; }, []);
  const onMapDragStart = useCallback((label, id) => { dragRef.current = { type: "map", id, from: label }; }, []);

  const onDragOver = useCallback((e, label) => { e.preventDefault(); setDragOver(label); }, []);
  const onDragLeave = useCallback(() => setDragOver(null), []);

  const onDrop = useCallback((e, to) => {
    e.preventDefault(); setDragOver(null);
    const src = dragRef.current;
    if (!src) return;
    setPlaced(prev => {
      const next = { ...prev };
      if (src.type === "sidebar") {
        next[to] = src.id;
      } else {
        const existing = prev[to];
        next[to] = src.id;
        if (src.from !== to) {
          if (existing) next[src.from] = existing;
          else delete next[src.from];
        }
      }
      return next;
    });
    dragRef.current = null;
  }, []);

  const onRemove = useCallback((label) => {
    if (label === "000") return;
    setPlaced(prev => { const n = { ...prev }; delete n[label]; return n; });
  }, []);

  const activeTiles = section === "systems" ? SIDEBAR_TILE_IDS : HOME_TILE_IDS;
  const placedSet = new Set(Object.values(placed));

  return (
    <div style={{ display: "flex", height: "100vh", background: "linear-gradient(to bottom right, #0a0e1a, #1a1f2e, #000000)", color: "#c8dde8", fontFamily: "system-ui,sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #03080f; }
        ::-webkit-scrollbar-thumb { background: #1a3a5a; border-radius: 3px; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 168, minWidth: 168, background: "#050d19", borderRight: "1px solid #0c1e30", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 12px 10px", borderBottom: "1px solid #0c1e30" }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#3a7a9a", textTransform: "uppercase", marginBottom: 10 }}>
            Tile Library
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {["systems","home"].map(s => (
              <button key={s} onClick={() => setSection(s)} style={{
                flex: 1, padding: "4px 0",
                background: section === s ? "#0c2235" : "transparent",
                border: `1px solid ${section === s ? "#1a4a6a" : "#0c1e30"}`,
                borderRadius: 3, color: section === s ? "#5aacc4" : "#1e4060",
                fontSize: 9, fontFamily: "'Cinzel',serif", letterSpacing: 1,
                cursor: "pointer", textTransform: "capitalize", transition: "all 0.12s",
              }}>{s === "systems" ? "Systems" : "Home"}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {activeTiles.map(id => {
            const isPlaced = placedSet.has(id);
            return (
              <div key={id} draggable={!isPlaced} onDragStart={() => !isPlaced && onSidebarDragStart(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  opacity: isPlaced ? 0.3 : 1, cursor: isPlaced ? "default" : "grab",
                  padding: "3px 5px 3px 3px", borderRadius: 4, border: "1px solid transparent",
                  transition: "all 0.1s",
                }}
                onMouseEnter={e => { if (!isPlaced) e.currentTarget.style.background = "#091820"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <HexTile id={id} size={20} />
                <span style={{ fontSize: 10, color: isPlaced ? "#1a3a50" : "#5aacc4", fontFamily: "'Cinzel',serif", fontWeight: 600 }}>
                  {TILE_NAMES[id] ? TILE_NAMES[id].replace(/_/g," ") : `Tile ${String(id).padStart(2,"0")}`}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "8px 10px", borderTop: "1px solid #0c1e30", fontSize: 8, color: "#1a3a50", lineHeight: 1.6, fontFamily: "'Cinzel',serif", letterSpacing: 0.5 }}>
          Drag onto the map.<br/>Right-click to remove.<br/>Drag to swap slots.
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="app-header bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
  <div className="px-4 py-2 flex justify-between items-center">
    <div className="flex items-center gap-3">
      {onNavigate && (
        <button
          onClick={() => onNavigate('/')}
          className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
        >
          ← Home
        </button>
      )}
      <h2 className="text-xl font-bold text-yellow-400">Map Builder</h2>
      <span className="text-xs text-gray-500 font-semibold tracking-widest uppercase hidden sm:inline">3-Ring Standard</span>
    </div>
    <button
      onClick={() => setPlaced({ "000": "18" })}
      className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
    >
      Clear Map
    </button>
  </div>
</div>

        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, #061120 0%, #03080f 75%)", borderRadius: 6 }} />
            {MAP_POSITIONS.map(({ label, x, y }) => {
              const id = placed[label];
              const cx = ORIGIN_X + x, cy = ORIGIN_Y + y;
              const hexH = Math.sqrt(3) * S;
              const isOver = dragOver === label;
              return (
                <div key={label} style={{ position: "absolute", left: cx - S, top: cy - hexH / 2, zIndex: isOver ? 10 : 1 }}
                  onDragOver={e => onDragOver(e, label)} onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e, label)} onContextMenu={e => { e.preventDefault(); onRemove(label); }}
                >
                  {id ? (
                    <div draggable onDragStart={() => onMapDragStart(label, id)}
                      style={{ clipPath: HEX_CLIP, filter: isOver ? "brightness(1.35)" : "brightness(1)", transition: "filter 0.12s", outline: "none" }}>
                      <HexTile id={id} size={S} />
                    </div>
                  ) : (
                    <EmptySlot label={label} size={S} isOver={isOver} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map string */}
        <div style={{ padding: "8px 16px", borderTop: "1px solid #0c1e30", background: "#040a14", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 2, color: "#1e4060", textTransform: "uppercase", flexShrink: 0 }}>Map String</span>
          <div style={{
            flex: 1, background: "#040c18", border: "1px solid #0c1e30", borderRadius: 3,
            padding: "4px 8px", fontSize: 9, color: "#2a6a8a", fontFamily: "monospace",
            letterSpacing: 1, overflowX: "auto", whiteSpace: "nowrap",
          }}>{mapString}</div>
          <button onClick={() => navigator.clipboard?.writeText(mapString)} style={{
            background: "transparent", border: "1px solid #1a3a5a", borderRadius: 3,
            color: "#2a5a7a", fontSize: 8, fontFamily: "'Cinzel',serif", letterSpacing: 2,
            padding: "4px 10px", cursor: "pointer", textTransform: "uppercase", flexShrink: 0,
          }}>Copy</button>
        </div>
      </div>
    </div>
  );
}