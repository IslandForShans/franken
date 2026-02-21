import { useState, useCallback, useRef, useLayoutEffect, useMemo, useEffect } from "react";
import { ALL_TILE_KEYS, TILE_CODE_TO_JSON_ID } from "../data/tileCatalog";
import { factionsData, discordantStarsData } from "../data/processedData";
import { calculateOptimalResources } from "../utils/resourceCalculator";

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

function generateMapPositions(rings) {
  const D = Math.sqrt(3) * S;
  const dirs = [
    [1.5 * S, D / 2], [0, D], [-1.5 * S, D / 2],
    [-1.5 * S, -D / 2], [0, -D], [1.5 * S, -D / 2],
  ];
  const positions = [{ label: "000", x: 0, y: 0, ring: 0 }];
  for (let r = 1; r <= rings; r++) {
    let cx = 0, cy = -r * Math.sqrt(3) * S;
    let num = 1;
    positions.push({ label: `${r}${String(num).padStart(2, "0")}`, x: cx, y: cy, ring: r });
    for (let d = 0; d < 6; d++) {
      const steps = d === 5 ? r - 1 : r;
      for (let s = 0; s < steps; s++) {
        cx += dirs[d][0]; cy += dirs[d][1]; num++;
        positions.push({ label: `${r}${String(num).padStart(2, "0")}`, x: cx, y: cy, ring: r });
      }
    }
  }
  return positions;
}

function buildAdjacency(positions) {
  const D = Math.sqrt(3) * S;
  const adj = {};
  positions.forEach(p => { adj[p.label] = []; });
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = Math.abs(positions[i].x - positions[j].x);
      const dy = Math.abs(positions[i].y - positions[j].y);
      if (
        (Math.abs(dx - 1.5 * S) < 0.5 && Math.abs(dy - D / 2) < 0.5) ||
        (dx < 0.5 && Math.abs(dy - D) < 0.5)
      ) {
        adj[positions[i].label].push(positions[j].label);
        adj[positions[j].label].push(positions[i].label);
      }
    }
  }
  return adj;
}

function getTileExpansion(code, isHyperlane) {
  if (code === "00") return "special";
  if (isHyperlane) return "hyperlane";
  if (code.startsWith("D") || code.startsWith("d")) return "ds";
  if (code.startsWith("BR")) return "br";
  const n = parseInt(code, 10);
  if (isNaN(n)) return "special";
  if (n === 112) return "base";
  if (n >= 51 && n <= 82) return "pok";
  if (n >= 83 && n <= 91) return "pok"; // hyperlane base numbers
  if (n >= 92 && n <= 120) return "te";
  return "base";
}

function buildTileDataLookup() {
  const lookup = new Map();
  const addTiles = (tiles) => {
    if (!tiles) return;
    [...(tiles.blue_tiles || []), ...(tiles.red_tiles || [])].forEach(tile => {
      if (tile.id) lookup.set(String(tile.id), tile);
    });
  };
  if (factionsData?.tiles) addTiles(factionsData.tiles);
  if (discordantStarsData?.tiles) addTiles(discordantStarsData.tiles);
  return lookup;
}
const TILE_DATA_LOOKUP = buildTileDataLookup();

function buildTileMeta(key) {
  const [code = key, ...nameParts] = key.split("_");
  const jsonId = code in TILE_CODE_TO_JSON_ID
    ? TILE_CODE_TO_JSON_ID[code]
    : String(parseInt(code, 10)) !== "NaN" ? String(parseInt(code, 10)) : null;
  const data = jsonId ? TILE_DATA_LOOKUP.get(jsonId) : null;
  const isHyperlane = key.includes("Hyperlane");
  const planets = data?.planets || [];
  const anomalies = data?.anomalies || [];
  const wormhole = data?.wormhole || null;
  return {
    key,
    code,
    name: nameParts.join(" ") || code,
    src: `${import.meta.env.BASE_URL}tiles/${key}.png`,
    planets,
    wormhole,
    anomalies,
    expansion: getTileExpansion(code, isHyperlane),
    planetCount: data ? planets.length : null,
    legendary: planets.some(p => p.legendary_ability),
    traits: [...new Set(planets.flatMap(p => p.traits || []))],
    techSpecialty: [...new Set(planets.flatMap(p => p.technology_specialty || []))],
  };
}

const ALL_TILES = ALL_TILE_KEYS.map(buildTileMeta);
const HOME_TILE_CODES = new Set([
  ...Array.from({ length: 17 }, (_, i) => String(i + 1).padStart(2, "0")),
  "D01","D02","D03","D04","D05","D06","D07","D08","D09","D10","D11","D12","D13","D14","D15","D16","D17","D18","D19","D20","D21","D22","D23","D24","D25","D26","D27","D28","D29","D30","D31","D32","D33","D34",
  "BR1","BR2","BR3","BR4","BR5","BR6",
  "51", "51r", "52", "53", "54", "55", "56", "57", "58", "118", "92", "93", "94", "95", "96a", "96b"
]);
const HOME_TILES = ALL_TILES.filter((tile) => HOME_TILE_CODES.has(tile.code));
const NON_HOME_TILES = ALL_TILES.filter((tile) => !HOME_TILE_CODES.has(tile.code));
const INELIGIBLE_CODES = new Set([
  "00","18","112",
  "17","17r",
  "51","51h","51r",
  "82a","82ah","82b","82bh",
  "118",
  "94",
]);
const INELIGIBLE_KEY_FRAGMENTS = ["xmas","SorrowWH"];

const ELIGIBLE_SYSTEM_TILES = NON_HOME_TILES.filter(t =>
  !t.isHyperlane &&
  !INELIGIBLE_CODES.has(t.code) &&
  !t.key.startsWith("00_") &&   // belt-and-suspenders for all blank variants
  !INELIGIBLE_KEY_FRAGMENTS.some(f => t.key.includes(f))
);
const HOME_TILE_KEY = "00_green";
const DEFAULT_CENTER_TILE = ALL_TILES.find((tile) => tile.code === "112")?.key || "112_Mecatol";

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

const CORNER_W = 116;
const CORNER_H = 100;

function CornerSlot({ slot, tileKey, onDrop, onRemove }) {
  const [over, setOver] = useState(false);
  const tile = tileKey ? buildTileMeta(tileKey) : null;
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { setOver(false); onDrop(e, slot); }}
      onContextMenu={e => { e.preventDefault(); onRemove(slot); }}
      style={{
        width: CORNER_W, height: CORNER_H,
        border: `2px dashed ${over ? "#60a5fa" : "#4b5563"}`,
        borderRadius: 8,
        background: over ? "rgba(96,165,250,0.1)" : "rgba(17,24,39,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", transition: "border-color 0.12s, background 0.12s",
        cursor: tile ? "default" : "copy",
        flexShrink: 0,
      }}
    >
      {tile ? (
        <img
          src={tile.src}
          alt={tile.code}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          draggable={false}
        />
      ) : (
        <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{slot}</span>
      )}
    </div>
  );
}

export default function TI4MapBuilder({ onNavigate }) {
  const [placed, setPlaced] = useState({ "000": DEFAULT_CENTER_TILE });
  const [dragOver, setDragOver] = useState(null);
  const [section, setSection] = useState("systems");
  const [fitScale, setFitScale] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [ringCount, setRingCount] = useState(3);
  const [searchTerm, setSearchTerm] = useState("");
  const [expansionFilter, setExpansionFilter] = useState(new Set());
  const [playerCount, setPlayerCount] = useState(6);
  const [generatedHomeLabels, setGeneratedHomeLabels] = useState(null);
  const [genSettings, setGenSettings] = useState({
    matchWormholes: true,
    anomalyRatio: 0.2,      // fraction of fill slots that are anomaly tiles
    legendaryCount: 2,
    minHomeResource: 3,
    minHomeInfluence: 2,  // "normal" | "rich" | "poor"
    genExpansions: new Set(["base","pok","te","ds"]),
  });
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [corners, setCorners] = useState({});

  const dragRef = useRef(null);
  const mapViewportRef = useRef(null);

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) return;
    const cW = 3 * ringCount * S + PAD * 2;
    const cH = (2 * ringCount + 1) * Math.sqrt(3) * S + PAD * 2;
    const updateScale = () => {
      const { width, height } = viewport.getBoundingClientRect();
      if (!width || !height) return;
      setFitScale(Math.min(1, (width - 24) / cW, (height - 24) / cH));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [ringCount]);

  const toggleFilter = useCallback((f) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });
  }, []);

  const mapPositions = useMemo(() => generateMapPositions(ringCount), [ringCount]);
  const canvasW = useMemo(() => 3 * ringCount * S + PAD * 2, [ringCount]);
  const canvasH = useMemo(() => (2 * ringCount + 1) * Math.sqrt(3) * S + PAD * 2, [ringCount]);
  const originX = canvasW / 2;
  const originY = canvasH / 2;
  const adjacency = useMemo(() => buildAdjacency(mapPositions), [mapPositions]);

  const activeTiles = useMemo(() => {
    let base = section === "home" ? HOME_TILES : NON_HOME_TILES;
    if (expansionFilter.size > 0)
      base = base.filter(t => expansionFilter.has(t.expansion));
    if (activeFilters.size > 0)
      base = base.filter(tile => {
        for (const f of activeFilters) {
          if (f === "hyperlane" && !tile.isHyperlane) return false;
          if (f === "wormhole" && !tile.wormhole) return false;
          if (f === "anomaly" && tile.anomalies.length === 0) return false;
          if (f === "legendary" && !tile.legendary) return false;
          if (f === "0p" && tile.planetCount !== 0) return false;
          if (f === "1p" && tile.planetCount !== 1) return false;
          if (f === "2p" && tile.planetCount !== 2) return false;
          if (f === "3p" && tile.planetCount !== 3) return false;
          if (f === "cultural" && !tile.traits.includes("Cultural")) return false;
          if (f === "hazardous" && !tile.traits.includes("Hazardous")) return false;
          if (f === "industrial" && !tile.traits.includes("Industrial")) return false;
          if (f === "tech" && tile.techSpecialty.length === 0) return false;
        }
        return true;
      });
    if (searchTerm.trim())
      base = base.filter(t =>
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return base;
  }, [section, activeFilters, expansionFilter, searchTerm]);
  const placedSet = useMemo(() => new Set(Object.values(placed)), [placed]);
  const mapScale = fitScale * zoomLevel;

  const mapString = useMemo(() => {
  const tokens = ["000", ...MAP_POSITIONS.slice(1).map(p => p.label)]
    .map(lbl => {
      const key = placed[lbl];
      if (!key) return "0";
      return key.split("_")[0];
    });
  return `{${tokens[0]}} ${tokens.slice(1).join(" ")}`;
}, [placed]);

  const homeStats = useMemo(() => {
    if (!generatedHomeLabels) return null;
    const stats = {};
    for (const label of generatedHomeLabels) {
      const planets = [];
      (adjacency[label] || []).forEach(n => {
        const key = placed[n];
        if (key) buildTileMeta(key).planets.forEach(p => planets.push(p));
      });
      stats[label] = calculateOptimalResources(planets);
    }
    return stats;
  }, [generatedHomeLabels, placed, adjacency]);

  const currentDeviation = useMemo(() => {
    if (!homeStats) return null;
    const scores = Object.values(homeStats).map(s => s.optimalResource + s.optimalInfluence);
    if (scores.length < 2) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.max(...scores.map(v => Math.abs(v - mean)));
  }, [homeStats]);

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

  const onZoom = useCallback((delta) => {
    setZoomLevel((current) => Math.max(0.5, Math.min(2.5, Number((current + delta).toFixed(2)))));
  }, []);

  const onWheelZoom = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    onZoom(delta);
  }, [onZoom]);

  useEffect(() => {
  const el = mapViewportRef.current;
  if (!el) return;
  el.addEventListener("wheel", onWheelZoom, { passive: false });
  return () => el.removeEventListener("wheel", onWheelZoom);
}, [onWheelZoom]);

  const onViewportMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('[draggable="true"]')) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOffsetStartRef.current = { ...panOffset };
  };

  const onViewportMouseMove = (e) => {
    if (!isPanningRef.current) return;
    setPanOffset({
      x: panOffsetStartRef.current.x + (e.clientX - panStartRef.current.x),
      y: panOffsetStartRef.current.y + (e.clientY - panStartRef.current.y),
    });
  };

  const onViewportMouseUp = () => {
    isPanningRef.current = false;
  };

  const onCopyMapString = () => {
    navigator.clipboard?.writeText(mapString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const HOME_CORNER_PICKS = {
  3: [0, 2, 4],        // 301, 307, 313
  4: [1, 2, 4, 5],     // 304, 307, 313, 316
  5: [1, 2, 3, 4, 5],  // 304, 307, 310, 313, 316
  6: [0, 1, 2, 3, 4, 5],
  };

  const HOME_LABELS_BY_PLAYER_COUNT = {
    7: ["401", "404", "407", "410", "416", "419", "422"],
    8: ["401", "404", "407", "410", "413", "416", "419", "422"],
  };

  useEffect(() => {
    if (playerCount >= 7 && ringCount < 4) {
      setRingCount(4);
      setPlaced({ "000": DEFAULT_CENTER_TILE });
      setGeneratedHomeLabels(null);
    }
  }, [playerCount, ringCount]);

  const generateMap = useCallback(() => {
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
    const cornerPicks = HOME_CORNER_PICKS[playerCount];
    const explicitHomeLabels = HOME_LABELS_BY_PLAYER_COUNT[playerCount] ?? null;
    if (!cornerPicks && !explicitHomeLabels) { alert("Player count not supported for generation yet."); return; }

    const outerRing = mapPositions.filter(p => p.ring === ringCount);
    const homePositions = explicitHomeLabels
      ? explicitHomeLabels.map(lbl => mapPositions.find(p => p.label === lbl)).filter(Boolean)
      : cornerPicks.map(i => outerRing[i * ringCount]).filter(Boolean);
    const homeLabels = new Set(homePositions.map(p => p.label));
    const fillPositions = mapPositions.filter(p => p.label !== "000" && !homeLabels.has(p.label));
    const fillCount = fillPositions.length;

    const eligiblePool = ELIGIBLE_SYSTEM_TILES.filter(t =>
      genSettings.genExpansions.has(t.expansion)
    );

    const dedupe = arr => { const seen = new Set(); return arr.filter(t => seen.has(t.key) ? false : (seen.add(t.key), true)); };
    const anomalyPool = dedupe(eligiblePool.filter(t => t.anomalies.length > 0));
    const legendaryPool = dedupe(eligiblePool.filter(t => t.legendary && t.anomalies.length === 0));
    const voidTiles = dedupe(eligiblePool.filter(t => t.anomalies.length === 0 && !t.legendary && t.planets.length === 0));
    const systemTiles = dedupe(eligiblePool.filter(t => t.anomalies.length === 0 && !t.legendary && t.planets.length > 0));

    const targetAnomalyCount = Math.min(Math.round(fillCount * genSettings.anomalyRatio), anomalyPool.length);
    const targetLegendaryCount = Math.min(genSettings.legendaryCount, legendaryPool.length);

    const MAX_ATTEMPTS = 500;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const tempPlaced = {};
      const usedKeys = new Set();

      // Step 1: Place anomaly tiles — no two adjacent, no repeats
      const shuffledPositions = shuffle(fillPositions);
      const shuffledAnomalies = shuffle(anomalyPool);
      let aIdx = 0;
      for (const pos of shuffledPositions) {
        if (aIdx >= shuffledAnomalies.length) break;
        while (aIdx < shuffledAnomalies.length && usedKeys.has(shuffledAnomalies[aIdx].key)) aIdx++;
        if (aIdx >= shuffledAnomalies.length) break;
        if (Object.values(tempPlaced).filter(v => v.isAnomaly).length >= targetAnomalyCount) break;
        const adjHasAnomaly = (adjacency[pos.label] || []).some(n => tempPlaced[n]?.isAnomaly);
        if (!adjHasAnomaly) {
          usedKeys.add(shuffledAnomalies[aIdx].key);
          tempPlaced[pos.label] = { key: shuffledAnomalies[aIdx++].key, isAnomaly: true };
        }
      }
      if (Object.values(tempPlaced).filter(v => v.isAnomaly).length < targetAnomalyCount) continue;

      // Step 2: Place legendary tiles — not adjacent to homes, no repeats
      const nonAnomalyPositions = shuffle(fillPositions.filter(p => !tempPlaced[p.label]));
      const shuffledLegendary = shuffle(legendaryPool);
      let lIdx = 0;
      let legPlaced = 0;
      for (const pos of nonAnomalyPositions) {
        if (legPlaced >= targetLegendaryCount) break;
        while (lIdx < shuffledLegendary.length && usedKeys.has(shuffledLegendary[lIdx].key)) lIdx++;
        if (lIdx >= shuffledLegendary.length) break;
        const adjToHome = (adjacency[pos.label] || []).some(n => homeLabels.has(n));
        if (!adjToHome) {
          usedKeys.add(shuffledLegendary[lIdx].key);
          tempPlaced[pos.label] = { key: shuffledLegendary[lIdx++].key };
          legPlaced++;
        }
      }

      // Step 3: Fill remaining with normal tiles (voids weighted 3x), no repeats
      const remainingPositions = fillPositions.filter(p => !tempPlaced[p.label]);
      const weightedNormal = dedupe([...voidTiles, ...voidTiles, ...voidTiles, ...systemTiles].filter(t => !usedKeys.has(t.key)));
      const shuffledNormal = shuffle(weightedNormal);
      remainingPositions.forEach((pos, i) => {
        if (shuffledNormal[i]) {
          usedKeys.add(shuffledNormal[i].key);
          tempPlaced[pos.label] = { key: shuffledNormal[i].key };
        }
      });

      // Step 4: Check wormhole matching
      if (genSettings.matchWormholes) {
        const wormholeCounts = {};
        Object.values(tempPlaced).forEach(({ key }) => {
          const meta = buildTileMeta(key);
          if (meta.wormhole) {
            const wh = Array.isArray(meta.wormhole) ? meta.wormhole : [meta.wormhole];
            wh.forEach(w => { wormholeCounts[w] = (wormholeCounts[w] || 0) + 1; });
          }
        });
        if (Object.entries(wormholeCounts).some(([, count]) => count < 2)) continue;
      }

      // Step 5: Check balance and minimums per home system
      if (homePositions.length > 0) {
        const homeTotals = homePositions.map(homePos => {
          let res = 0, inf = 0;
          (adjacency[homePos.label] || []).forEach(n => {
            const entry = tempPlaced[n];
            if (entry) {
              buildTileMeta(entry.key).planets.forEach(p => {
                res += (p.resource || 0);
                inf += (p.influence || 0);
              });
            }
          });
          return { res, inf };
        });

        const belowMin = homeTotals.some(
          t => t.res < genSettings.minHomeResource || t.inf < genSettings.minHomeInfluence
        );
        if (belowMin) continue;

        if (homePositions.length > 1) {
          const scores = homeTotals.map(t => t.res + t.inf);
          const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
          const maxDev = Math.max(...scores.map(v => Math.abs(v - mean)));
          if (maxDev > 7) continue;
        }
      }

      // Success
      const newPlaced = { "000": DEFAULT_CENTER_TILE };
      homePositions.forEach(p => { newPlaced[p.label] = HOME_TILE_KEY; });
      Object.entries(tempPlaced).forEach(([lbl, { key }]) => { newPlaced[lbl] = key; });
      setPlaced(newPlaced);
      setGeneratedHomeLabels(new Set(homePositions.map(p => p.label)));
      return;
    }

    alert("Could not generate a valid map after many attempts. Try relaxing settings (lower legendary count, reduce minimums, or disable wormhole matching).");
  }, [ringCount, mapPositions, adjacency, playerCount, genSettings]);

  const balanceMap = useCallback(() => {
    if (!generatedHomeLabels) return;
    const homeArr = [...generatedHomeLabels];

    const getScore = (placedMap, homeLabel) => {
      const planets = [];
      (adjacency[homeLabel] || []).forEach(n => {
        const key = placedMap[n];
        if (key && key !== HOME_TILE_KEY && key !== DEFAULT_CENTER_TILE) {
          buildTileMeta(key).planets.forEach(p => planets.push(p));
        }
      });
      const calc = calculateOptimalResources(planets);
      return calc.optimalResource + calc.optimalInfluence;
    };

    const getDeviation = (placedMap) => {
      const scores = homeArr.map(lbl => getScore(placedMap, lbl));
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      return Math.max(...scores.map(v => Math.abs(v - mean)));
    };

    setPlaced(prev => {
      const fillLabels = Object.keys(prev).filter(
        lbl => lbl !== "000" && !generatedHomeLabels.has(lbl)
      );

      const currentDev = getDeviation(prev);
      let bestDev = currentDev;
      let bestSwap = null;

      const meetsMinimums = (placedMap) => {
        return homeArr.every(homeLabel => {
          const planets = [];
          (adjacency[homeLabel] || []).forEach(n => {
            const key = placedMap[n];
            if (key && key !== HOME_TILE_KEY && key !== DEFAULT_CENTER_TILE) {
              buildTileMeta(key).planets.forEach(p => planets.push(p));
            }
          });
          const res = planets.reduce((sum, p) => sum + (p.resource || 0), 0);
          const inf = planets.reduce((sum, p) => sum + (p.influence || 0), 0);
          return res >= genSettings.minHomeResource && inf >= genSettings.minHomeInfluence;
        });
      };

      // Find the single swap that reduces deviation the most without violating minimums
      for (let i = 0; i < fillLabels.length; i++) {
        for (let j = i + 1; j < fillLabels.length; j++) {
          const a = fillLabels[i], b = fillLabels[j];
          const candidate = { ...prev, [a]: prev[b], [b]: prev[a] };
          const dev = getDeviation(candidate);
          if (dev < bestDev && meetsMinimums(candidate)) {
            bestDev = dev;
            bestSwap = [a, b];
          }
        }
      }

      if (!bestSwap) return prev; // already at local optimum
      const [a, b] = bestSwap;
      return { ...prev, [a]: prev[b], [b]: prev[a] };
    });
  }, [generatedHomeLabels, adjacency, genSettings]);

  const onCornerDrop = useCallback((e, slot) => {
    e.preventDefault();
    const src = dragRef.current;
    if (!src) return;
    setCorners(prev => ({ ...prev, [slot]: src.key }));
  }, []);

  const onCornerRemove = useCallback((slot) => {
    setCorners(prev => { const next = { ...prev }; delete next[slot]; return next; });
  }, []);

  return (
    <div style={{ display: "flex", height: "100dvh", background: "linear-gradient(to bottom right, #0a0e1a, #1a1f2e, #000000)", color: "#c8dde8", fontFamily: "system-ui,sans-serif", overflow: "hidden" }}>
      {sidebarVisible && <div style={{ width: 220, minWidth: 220, background: "#0f172a", borderRight: "1px solid #4b5563", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 10px 10px", borderBottom: "1px solid #4b5563" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#fcd34d", textTransform: "uppercase", marginBottom: 8 }}>
            Tile Library
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {["systems", "home"].map((s) => (
              <button
                key={s}
                onClick={() => { setSection(s); setActiveFilters(new Set()); }}
                style={{
                  flex: 1, padding: "5px 0",
                  background: section === s ? "#374151" : "transparent",
                  border: `1px solid ${section === s ? "#6b7280" : "#4b5563"}`,
                  borderRadius: 6,
                  color: section === s ? "#f9fafb" : "#d1d5db",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                {s === "systems" ? "Systems" : "Home"}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search tiles..."
            style={{
              width: "100%", background: "#030712", border: "1px solid #4b5563",
              borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#d1d5db",
              marginTop: 6, marginBottom: 4, boxSizing: "border-box", outline: "none",
            }}
          />
          {/* Expansion filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
            {[
              { id: "base", label: "Base", color: "#374151" },
              { id: "pok", label: "PoK", color: "#7c3aed" },
              { id: "te", label: "TE", color: "#0369a1" },
              { id: "ds", label: "DS", color: "#b45309" },
              ...(section === "systems" ? [{ id: "hyperlane", label: "Lane", color: "#374151" }] : []),
            ].map(({ id, label, color }) => (
              <button
                key={id}
                onClick={() => setExpansionFilter(prev => {
                  const next = new Set(prev);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                })}
                style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer",
                  background: expansionFilter.has(id) ? color : "transparent",
                  border: `1px solid ${expansionFilter.has(id) ? color : "#4b5563"}`,
                  color: expansionFilter.has(id) ? "#fff" : "#9ca3af",
                }}
              >{label}</button>
            ))}
          </div>
          {(() => {
            const filterBtn = (id, label, color = "#4b5563") => (
              <button
                key={id}
                onClick={() => toggleFilter(id)}
                style={{
                  padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer",
                  background: activeFilters.has(id) ? color : "transparent",
                  border: `1px solid ${activeFilters.has(id) ? color : "#4b5563"}`,
                  color: activeFilters.has(id) ? "#fff" : "#9ca3af",
                }}
              >{label}</button>
            );
            return (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 4 }}>
                  {filterBtn("0p", "0P")}
                  {filterBtn("1p", "1P")}
                  {filterBtn("2p", "2P")}
                  {filterBtn("3p", "3P")}
                  {filterBtn("wormhole", "WH", "#6d28d9")}
                  {filterBtn("anomaly", "Anom", "#b91c1c")}
                  {filterBtn("legendary", "Leg", "#b45309")}
                  {filterBtn("tech", "Tech", "#0369a1")}
                  {section === "systems" && filterBtn("hyperlane", "Lane", "#065f46")}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {filterBtn("cultural", "Cult", "#1d4ed8")}
                  {filterBtn("hazardous", "Haz", "#991b1b")}
                  {filterBtn("industrial", "Ind", "#3f6212")}
                  {activeFilters.size > 0 && (
                    <button
                      onClick={() => setActiveFilters(new Set())}
                      style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", background: "#374151", border: "1px solid #6b7280", color: "#d1d5db" }}
                    >✕ Clear</button>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: 6 }}>
  {activeTiles.map((tile) => {
    const isPlaced = placedSet.has(tile.key);
    return (
      <div
        key={tile.key}
        draggable={!isPlaced}
        onDragStart={() => !isPlaced && onSidebarDragStart(tile.key)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: isPlaced ? 0.35 : 1,
          cursor: isPlaced ? "default" : "grab",
          borderRadius: 6,
        }}
      >
        <HexTile tile={tile} size={97} />
        <span style={{ fontSize: 10, color: isPlaced ? "#6b7280" : "#f3f4f6", fontWeight: 600, marginTop: 3, textAlign: "center" }}>
          {tile.code}
        </span>
      </div>
    );
  })}
</div>

        <div style={{ padding: "8px 10px", borderTop: "1px solid #4b5563", fontSize: 10, color: "#9ca3af", lineHeight: 1.6 }}>
          Drag onto the map.<br />Right-click to remove.<br />Drag to swap slots.
        </div>
      </div>}

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
              <button
                onClick={() => setSidebarVisible(v => !v)}
                className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
                title={sidebarVisible ? "Hide tile library" : "Show tile library"}
              >
                {sidebarVisible ? "◀ Tiles" : "▶ Tiles"}
              </button>
              <h2 className="text-xl font-bold text-yellow-400">Map Builder</h2>
              <div className="flex items-center gap-1 rounded-md border border-gray-600 bg-gray-800 px-1 py-0.5">
                <button onClick={() => { setRingCount(r => Math.max(1, r-1)); setPlaced({"000": DEFAULT_CENTER_TILE}); setGeneratedHomeLabels(null); }} className="px-1.5 text-gray-200 hover:text-white">−</button>
                <span className="px-1 text-xs text-gray-300 min-w-[52px] text-center">{ringCount} Ring{ringCount !== 1 ? "s" : ""}</span>
                <button onClick={() => { setRingCount(r => Math.min(13, r+1)); setPlaced({"000": DEFAULT_CENTER_TILE}); setGeneratedHomeLabels(null); }} className="px-1.5 text-gray-200 hover:text-white">+</button>
              </div>
              <div className="ml-2 flex items-center gap-1 rounded-md border border-gray-600 bg-gray-800 px-1 py-0.5">
                <button onClick={() => onZoom(-0.1)} className="px-1.5 text-gray-200 hover:text-white" title="Zoom out">−</button>
                <button onClick={() => setZoomLevel(1)} className="px-1.5 text-xs text-gray-300 hover:text-white" title="Reset zoom">{Math.round(zoomLevel * 100)}%</button>
                <button onClick={() => onZoom(0.1)} className="px-1.5 text-gray-200 hover:text-white" title="Zoom in">+</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#1f2937", border: "1px solid #4b5563", borderRadius: 8, padding: "2px 6px" }}>
                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Players</span>
                <button onClick={() => setPlayerCount(p => Math.max(3, p-1))} className="px-1.5 text-gray-200 hover:text-white text-sm">−</button>
                <span style={{ fontSize: 12, color: "#f3f4f6", fontWeight: 700, minWidth: 14, textAlign: "center" }}>{playerCount}</span>
                <button onClick={() => setPlayerCount(p => Math.min(8, p+1))} className="px-1.5 text-gray-200 hover:text-white text-sm">+</button>
              </div>
              <button
                onClick={generateMap}
                className="px-3 py-1.5 rounded-lg bg-green-800 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
              >
                Generate Map
              </button>

              {generatedHomeLabels && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={balanceMap}
                    className="px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    Balance
                  </button>
                  <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                    dev: <span style={{ color: currentDeviation <= 2 ? "#86efac" : currentDeviation <= 5 ? "#fbbf24" : "#f87171", fontWeight: 700 }}>{currentDeviation?.toFixed(1)}</span>
                  </span>
                </div>
              )}
              <button onClick={() => setSettingsOpen(o => !o)} className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors">⚙ Settings</button>
              <button onClick={() => { setPlaced({ "000": DEFAULT_CENTER_TILE }); setCorners({}); setGeneratedHomeLabels(null); }} className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors">Clear Map</button>
            </div>
          </div>
          {settingsOpen && (
            <div style={{ borderTop: "1px solid #4b5563", background: "#111827", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Map String */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, letterSpacing: 1, color: "#9ca3af", textTransform: "uppercase", flexShrink: 0 }}>Map String</span>
                <div style={{ flex: 1, background: "#030712", border: "1px solid #4b5563", borderRadius: 6, padding: "6px 8px", fontSize: 11, color: "#d1d5db", fontFamily: "monospace", overflowX: "auto", whiteSpace: "nowrap" }}>{mapString}</div>
                <button onClick={onCopyMapString} style={{ background: copied ? "#166534" : "#374151", border: `1px solid ${copied ? "#4ade80" : "#6b7280"}`, borderRadius: 6, color: "#f3f4f6", fontSize: 11, fontWeight: 600, padding: "5px 12px", cursor: "pointer", textTransform: "uppercase", flexShrink: 0 }}>{copied ? "Copied!" : "Copy"}</button>
              </div>

              {/* Generation Settings */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>

                {/* Wormholes + Galaxy Mode */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fcd34d", textTransform: "uppercase", letterSpacing: 1 }}>Generation</span>
                  {[
                    { key: "matchWormholes", label: "Match Wormholes" },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#d1d5db", cursor: "pointer" }}>
                      <input type="checkbox" checked={genSettings[key]} onChange={e => setGenSettings(s => ({ ...s, [key]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                  <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                    {[
                    { key: "minHomeResource", label: "Min Home Res", min: 0, max: 15, step: 1 },
                    { key: "minHomeInfluence", label: "Min Home Inf", min: 0, max: 15, step: 1 },
                  ].map(({ key, label, min, max, step }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: "#d1d5db", width: 90 }}>{label}</span>
                      <button onClick={() => setGenSettings(s => ({ ...s, [key]: Math.max(min, s[key] - step) }))} style={{ padding: "1px 6px", background: "#374151", border: "1px solid #6b7280", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 12 }}>−</button>
                      <span style={{ fontSize: 11, color: "#f3f4f6", minWidth: 20, textAlign: "center" }}>{genSettings[key]}</span>
                      <button onClick={() => setGenSettings(s => ({ ...s, [key]: Math.min(max, s[key] + step) }))} style={{ padding: "1px 6px", background: "#374151", border: "1px solid #6b7280", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 12 }}>+</button>
                    </div>
                  ))}
                  </div>
                </div>

                {/* Numeric settings */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fcd34d", textTransform: "uppercase", letterSpacing: 1 }}>Ratios</span>
                  {[
                    { key: "anomalyRatio", label: "Anomaly %", min: 0, max: 0.5, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
                    { key: "legendaryCount", label: "Legendaries", min: 0, max: 10, step: 1, fmt: v => v },
                  ].map(({ key, label, min, max, step, fmt }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "#d1d5db", width: 80 }}>{label}</span>
                      <button onClick={() => setGenSettings(s => ({ ...s, [key]: Math.max(min, +(s[key] - step).toFixed(3)) }))} style={{ padding: "1px 6px", background: "#374151", border: "1px solid #6b7280", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 12 }}>−</button>
                      <span style={{ fontSize: 11, color: "#f3f4f6", minWidth: 28, textAlign: "center" }}>{fmt(genSettings[key])}</span>
                      <button onClick={() => setGenSettings(s => ({ ...s, [key]: Math.min(max, +(s[key] + step).toFixed(3)) }))} style={{ padding: "1px 6px", background: "#374151", border: "1px solid #6b7280", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 12 }}>+</button>
                    </div>
                  ))}
                </div>

                {/* Expansion toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fcd34d", textTransform: "uppercase", letterSpacing: 1 }}>Include Tiles From</span>
                  {[
                    { id: "base", label: "Base Game" },
                    { id: "pok", label: "Prophecy of Kings" },
                    { id: "te", label: "Thunder's Edge" },
                    { id: "ds", label: "Discordant Stars" },
                  ].map(({ id, label }) => (
                    <label key={id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#d1d5db", cursor: "pointer" }}>
                      <input type="checkbox"
                        checked={genSettings.genExpansions.has(id)}
                        onChange={e => setGenSettings(s => {
                          const next = new Set(s.genExpansions);
                          e.target.checked ? next.add(id) : next.delete(id);
                          return { ...s, genExpansions: next };
                        })} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          ref={mapViewportRef}
          onMouseDown={onViewportMouseDown}
          onMouseMove={onViewportMouseMove}
          onMouseUp={onViewportMouseUp}
          onMouseLeave={onViewportMouseUp}
          style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, cursor: isPanningRef.current ? "grabbing" : "default" }}
        >
          {/* Corner slots - positioned in viewport corners, unaffected by map pan/zoom */}
          {[
            { slot: "tl", style: { top: 12, left: 12 } },
            { slot: "tr", style: { top: 12, right: 12 } },
            { slot: "bl", style: { bottom: 12, left: 12 } },
            { slot: "br", style: { bottom: 12, right: 12 } },
          ].map(({ slot, style }) => (
            <div key={slot} style={{ position: "absolute", zIndex: 20, ...style }}>
              <CornerSlot
                slot={slot}
                tileKey={corners[slot]}
                onDrop={onCornerDrop}
                onRemove={onCornerRemove}
              />
            </div>
          ))}
          <div style={{ position: "relative", width: canvasW, height: canvasH, flexShrink: 0, transform: `scale(${mapScale}) translate(${panOffset.x / mapScale}px, ${panOffset.y / mapScale}px)`, transformOrigin: "center" }}>
            {mapPositions.map(({ label, x, y }) => {
              const key = placed[label];
              const tile = key ? buildTileMeta(key) : null;
              const cx = originX + x;
              const cy = originY + y;
              const hexH = Math.sqrt(3) * S;
              const isOver = dragOver === label;
              return (
                <div
                  key={label}
                  style={{ position: "absolute", left: cx - S, top: cy - hexH / 2, zIndex: isOver ? 10 : 1, ...(homeStats?.[label] ? { zIndex: 5 } : {}) }}
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

                  {homeStats?.[label] && (() => {
        const s = homeStats[label];
        return (
          <div style={{
            position: "absolute", inset: 0, clipPath: HEX_CLIP,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 6,
            background: "rgba(0,0,0,0.78)",
          }}>
            <div style={{ textAlign: "center", lineHeight: 1.3 }}>
              <div style={{ fontSize: S * 0.3, fontWeight: 900, letterSpacing: 1 }}>
                <span style={{ color: "#fbbf24" }}>{s.optimalResource}R</span>
                <span style={{ color: "#6b7280", margin: "0 4px" }}>/</span>
                <span style={{ color: "#60a5fa" }}>{s.optimalInfluence}I</span>
              </div>
              <div style={{ fontSize: S * 0.18, color: "#9ca3af", fontWeight: 600 }}>
                ({s.totalResource}R / {s.totalInfluence}I)
              </div>
              {s.flexValue > 0 && (
                <div style={{ fontSize: S * 0.18, color: "#86efac", fontWeight: 700 }}>{s.flexValue} flex</div>
              )}
            </div>
          </div>
        );
      })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}