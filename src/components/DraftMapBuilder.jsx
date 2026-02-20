import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { ALL_TILE_KEYS, TILE_CODE_TO_JSON_ID } from "../data/tileCatalog";
import { HS_POSITIONS, SLICE_ORDER, ALL_SLICE_LABELS } from "../utils/sliceDefinitions";
import { shuffleArray } from "../utils/shuffle";
import { calculateOptimalResources } from "../utils/resourceCalculator";
import { factionsData, discordantStarsData } from "../data/processedData";

// ── Hex geometry (self-contained, no coupling to TI4MapBuilder) ─────────────
const S = 62;
const D = Math.sqrt(3) * S;
const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
const PAD = S * 1.2;
const CANVAS_W = 9 * S + PAD * 2;
const CANVAS_H = 7 * D + PAD * 2;
const OX = CANVAS_W / 2;
const OY = CANVAS_H / 2;

const MAP_3RING = (() => {
  const dirs = [[1.5*S,D/2],[0,D],[-1.5*S,D/2],[-1.5*S,-D/2],[0,-D],[1.5*S,-D/2]];
  const pos = [{ label:"000", x:0, y:0, ring:0 }];
  for (let r = 1; r <= 3; r++) {
    let cx = 0, cy = -r*D, num = 1;
    pos.push({ label:`${r}${String(num).padStart(2,"0")}`, x:cx, y:cy, ring:r });
    for (let d = 0; d < 6; d++) {
      const steps = d === 5 ? r - 1 : r;
      for (let s = 0; s < steps; s++) {
        cx += dirs[d][0]; cy += dirs[d][1]; num++;
        pos.push({ label:`${r}${String(num).padStart(2,"0")}`, x:cx, y:cy, ring:r });
      }
    }
  }
  return pos;
})();

function buildAdjacency3Ring() {
  const adj = {};
  MAP_3RING.forEach(p => { adj[p.label] = []; });
  for (let i = 0; i < MAP_3RING.length; i++) {
    for (let j = i + 1; j < MAP_3RING.length; j++) {
      const dx = Math.abs(MAP_3RING[i].x - MAP_3RING[j].x);
      const dy = Math.abs(MAP_3RING[i].y - MAP_3RING[j].y);
      if ((Math.abs(dx - 1.5*S) < 0.5 && Math.abs(dy - D/2) < 0.5) || (dx < 0.5 && Math.abs(dy - D) < 0.5)) {
        adj[MAP_3RING[i].label].push(MAP_3RING[j].label);
        adj[MAP_3RING[j].label].push(MAP_3RING[i].label);
      }
    }
  }
  return adj;
}
const ADJACENCY = buildAdjacency3Ring();

// ── Tile planet lookup (for res/inf overlay) ───────────────────────────────
const DMB_TILE_LOOKUP = new Map();
(factionsData?.tiles?.blue_tiles ?? []).forEach(t => { if (t.id != null) DMB_TILE_LOOKUP.set(String(t.id), t); });
(factionsData?.tiles?.red_tiles ?? []).forEach(t => { if (t.id != null) DMB_TILE_LOOKUP.set(String(t.id), t); });
(factionsData?.tiles?.home_systems ?? []).forEach(t => { if (t.id != null) DMB_TILE_LOOKUP.set(String(t.id), t); });
(discordantStarsData?.tiles?.blue_tiles ?? []).forEach(t => { if (t.id != null) DMB_TILE_LOOKUP.set(String(t.id), t); });
(discordantStarsData?.tiles?.red_tiles ?? []).forEach(t => { if (t.id != null) DMB_TILE_LOOKUP.set(String(t.id), t); });

function getTilePlanets(key) {
  if (!key) return [];
  const code = key.split("_")[0];
  const jsonId = TILE_CODE_TO_JSON_ID[code] !== undefined
    ? String(TILE_CODE_TO_JSON_ID[code])
    : (!isNaN(parseInt(code, 10)) ? String(parseInt(code, 10)) : null);
  return DMB_TILE_LOOKUP.get(jsonId)?.planets ?? [];
}

const HOME_SYSTEM_ID_TO_TILE_KEY = new Map([
  ["barony_hs", "10_ArcPime"],
  ["dws_hs", "95_Deepwrought"],
  ["bastion_hs", "92_Bastion"],
  ["rn_hs", "93_RalNel"],
  ["crimson_hs", "118_Crimson"],
  ["firmament_hs", "96a_Firmament"],
  ["obsidian_hs", "96b_Obsidian"],
  ["ghoti_hs", "D11_Void"],
  ["belkosea_hs", "BR5_Belkosea"],
  ["toldar_hs", "BR6_Toldar"],
]);

// ── Tile key lookup ─────────────────────────────────────────────────────────
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Build two lookup maps at module level for O(1) lookups
const TILE_KEY_BY_NAME = new Map();   // normalized name → key
const TILE_KEY_BY_CODE = new Map();   // numeric code string → key (e.g. "19" → "19_Wellon")
const TILE_KEY_BY_JSON_ID = new Map(); // json tile id string → key (e.g. "4253" → "d100")
ALL_TILE_KEYS.forEach(key => {
  const parts = key.split("_");
  const code = parts[0];
  const name = parts.slice(1).join(" ");
  TILE_KEY_BY_NAME.set(norm(name), key);
  if (!TILE_KEY_BY_CODE.has(code)) TILE_KEY_BY_CODE.set(code, key);
});
Object.entries(TILE_CODE_TO_JSON_ID).forEach(([code, jsonId]) => {
  const tileKey = TILE_KEY_BY_CODE.get(code);
  if (tileKey) TILE_KEY_BY_JSON_ID.set(String(jsonId), tileKey);
});

TILE_KEY_BY_NAME.set("arcprime", "10_ArcPime");

function findTileKey(tileObjOrName) {
  if (!tileObjOrName) return null;
  const isObj = typeof tileObjOrName === 'object';
  const name = isObj ? tileObjOrName.name : tileObjOrName;

  // 1. Normalized name match (works for blue/red system tiles)
  if (name) {
    const byName = TILE_KEY_BY_NAME.get(norm(String(name)));
    if (byName) return byName;
  }

  if (isObj && tileObjOrName.id) {
  const mapped = HOME_SYSTEM_ID_TO_TILE_KEY.get(String(tileObjOrName.id));
  if (mapped) return mapped;
}

  // 2. Numeric id field (works for tiles with id like "19", "35" and DS JSON ids like "4253")
  if (isObj && tileObjOrName.id) {
    const rawId = String(tileObjOrName.id);

    const byJsonId = TILE_KEY_BY_JSON_ID.get(rawId);
    if (byJsonId) return byJsonId;

    const numericId = rawId.replace(/\D/g, '');
    if (numericId) {
      const byCode = TILE_KEY_BY_CODE.get(numericId);
      if (byCode) return byCode;
    }
  }

  // 3. Planet name matching — home system objects use names like "Jol-Nar Home System"
  //    but the tile catalog key is named after a planet (e.g. "12_Nar").
  //    Try each planet name until one matches a catalog key.
  if (isObj && Array.isArray(tileObjOrName.planets)) {
    for (const planet of tileObjOrName.planets) {
      if (planet?.name) {
        const byPlanet = TILE_KEY_BY_NAME.get(norm(planet.name));
        if (byPlanet) return byPlanet;
      }
    }
  }

  // 4. Bare string as code
  if (!isObj) {
    const byCode = TILE_KEY_BY_CODE.get(String(tileObjOrName));
    if (byCode) return byCode;
  }

  return null;
}

// ── Eligible fill tiles (tiles not used by any player) ──────────────────────
const INELIGIBLE_CODES = new Set(["00","18","17","17r","51","51h","51r","82a","82ah","82b","82bh","81a","81b","83a","83b","84a","84b","85a","86b","87a","87b","88a","88b","89a","89b","90a","90b","91a","91b","96a","96b","118","94"]);
const HOME_CODES_SET = new Set([
  ...Array.from({length:17}, (_,i) => String(i+1).padStart(2,"0")),
  ...Array.from({length:9}, (_,i) => `D${String(i+1).padStart(2,"0")}`),
  ...Array.from({length:6}, (_,i) => `BR${i+1}`),
  "92","92new","93","93new","94","94new","17r","51h",
]);
const ALL_ELIGIBLE_KEYS = ALL_TILE_KEYS.filter(key => {
  const [code] = key.split("_");
  return !INELIGIBLE_CODES.has(code) && !HOME_CODES_SET.has(code)
    && !key.startsWith("00_") && !key.includes("xmas") && !key.includes("SorrowWH")
    && !key.includes("hyperlane");
});

// ── Small rendering helpers ─────────────────────────────────────────────────
const BASE_URL = import.meta.env.BASE_URL;

function HexTile({ tileKey, size, dimmed }) {
  const w = size * 2, h = Math.sqrt(3) * size;
  return (
    <div style={{ width:w, height:h, clipPath:HEX_CLIP, overflow:"hidden", flexShrink:0 }}>
      <img
        src={`${BASE_URL}tiles/${tileKey}.png`}
        alt={tileKey}
        draggable={false}
        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity: dimmed ? 0.4 : 1 }}
      />
    </div>
  );
}

function EmptyHex({ size, highlight, label, color }) {
  const w = size * 2, h = Math.sqrt(3) * size;
  const pts = Array.from({length:6}, (_,i) => {
    const a = (Math.PI/3)*i;
    return `${w/2+size*Math.cos(a)},${h/2+size*Math.sin(a)}`;
  }).join(" ");
  return (
    <div style={{ width:w, height:h, position:"relative" }}>
      <svg width={w} height={h} style={{ position:"absolute", inset:0 }}>
        <polygon points={pts} fill={highlight ? "rgba(96,165,250,0.15)" : color ?? "rgba(55,65,81,0.3)"}
          stroke={highlight ? "#60a5fa" : color ?? "#6b7280"} strokeWidth={highlight ? 2 : 1.5}
          strokeDasharray={highlight ? "none" : "4,4"} />
      </svg>
      {label && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          color: highlight ? "#bfdbfe" : "#9ca3af", fontSize: size*0.2, fontWeight:600 }}>
          {label}
        </div>
      )}
    </div>
  );
}

const PLAYER_COLORS = ["#f59e0b","#60a5fa","#4ade80","#f472b6","#a78bfa","#fb923c"];

const HOME_CLOCKWISE = ["301", "304", "307", "310", "313", "316"];
const CLOCKWISE_SHIFT_BY_HOME = {
  "301": { from: "202", to: "203" },
  "304": { from: "204", to: "205" },
  "307": { from: "206", to: "207" },
  "310": { from: "208", to: "209" },
  "313": { from: "210", to: "211" },
  "316": { from: "212", to: "201" },
};

function applyClockwiseGapShift(basePlaced, players) {
  if (!players.length) return basePlaced;

  const occupiedHomes = new Set(players.map(p => p.hsLabel).filter(Boolean));
  const next = { ...basePlaced };
  let changed = false;

  players.forEach(player => {
    if (!player.hsLabel) return;

    const hsIdx = HOME_CLOCKWISE.indexOf(player.hsLabel);
    if (hsIdx === -1) return;

    const nextHsClockwise = HOME_CLOCKWISE[(hsIdx + 1) % HOME_CLOCKWISE.length];
    if (occupiedHomes.has(nextHsClockwise)) return;

    const shiftRule = CLOCKWISE_SHIFT_BY_HOME[player.hsLabel];
    if (!shiftRule) return;

    const sourceTile = next[shiftRule.from];
    if (!sourceTile) return;
    if (next[shiftRule.to]) return;

    delete next[shiftRule.from];
    next[shiftRule.to] = sourceTile;
    changed = true;
  });

  return changed ? next : basePlaced;
}

// ── Main component ──────────────────────────────────────────────────────────
export default function DraftMapBuilder({ onNavigate, draftData, multiplayer, onPeerMessageRef }) {
  const { factions, playerCount } = draftData;
  const viewportRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);
  const isMapHost = multiplayer?.role === 'host';
const isMapGuest = multiplayer?.role === 'guest';
const myMapPlayerIndex = multiplayer?.mySlotId
  ? parseInt(multiplayer.mySlotId.replace('player_', ''), 10) - 1
  : 0;
// In multiplayer: guests get their player index, host is always index 0
const myPlayerIndex = isMapGuest ? myMapPlayerIndex : 0;

  // Compute player order (sorted by table position) and their HS labels
  const players = useMemo(() => {
    const hsPositions = HS_POSITIONS[playerCount] ?? HS_POSITIONS[6];
    const basePlayers = factions
      .map((f, idx) => {
        const tablePos = f.table_position?.[0];
        const position = tablePos?.position ?? null;
        const positionLabel = tablePos?.name ?? (position != null ? `${position}` : "—");
        const hsLabel = (position != null && position >= 1 && position <= hsPositions.length)
          ? hsPositions[position - 1]
          : null;
        const sliceTiles = SLICE_ORDER[hsLabel] ?? [];
        const draftedKeys = [
          ...(f.blue_tiles ?? []).slice(0, 3),
          ...(f.red_tiles ?? []).slice(0, 2),
        ].map(t => findTileKey(t)).filter(Boolean);
        const hsObj = f.home_systems?.[0];
        const hsKey = hsObj ? findTileKey(hsObj) : null;
        const hsStats = calculateOptimalResources(hsObj?.planets ?? []);
        return { factionIdx: idx, name: f.name, positionLabel, position, hsLabel, sliceTiles, draftedKeys, hsKey, hsStats };
      }).sort((a, b) => a.position - b.position);

      const occupiedHomes = new Set(basePlayers.map(p => p.hsLabel).filter(Boolean));

    return basePlayers.map(player => {
      if (!player.hsLabel) return player;

      const hsIdx = HOME_CLOCKWISE.indexOf(player.hsLabel);
      if (hsIdx === -1) return player;

      const nextHsClockwise = HOME_CLOCKWISE[(hsIdx + 1) % HOME_CLOCKWISE.length];
      if (occupiedHomes.has(nextHsClockwise)) return player;

      const shiftRule = CLOCKWISE_SHIFT_BY_HOME[player.hsLabel];
      if (!shiftRule) return player;

      return {
        ...player,
        sliceTiles: player.sliceTiles.map(label => label === shiftRule.from ? shiftRule.to : label),
      };
    });
  }, [factions, playerCount]);

  const allDraftedKeySet = useMemo(() => {
    const s = new Set();
    players.forEach(p => p.draftedKeys.forEach(k => s.add(k)));
    return s;
  }, [players]);

  const fillPool = useMemo(() =>
    ALL_ELIGIBLE_KEYS.filter(k => !allDraftedKeySet.has(k)),
    [allDraftedKeySet]
  );

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width && height) setFitScale(Math.min((width - 24) / CANVAS_W, (height - 24) / CANVAS_H));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Mode selection state ────────────────────────────────────────────────
  const [mode, setMode] = useState(null); // null | "random" | "mantis"
  const [placed, setPlaced] = useState({ "000": "112_Mecatol" });

  const fromMilty = !!draftData?.fromMilty;

  // Auto-place all slice tiles when coming from Milty draft
  useEffect(() => {
    if (!fromMilty || players.length === 0) return;
    setPlaced(prev => {
      const next = { ...prev };
      players.forEach(p => {
        if (p.hsLabel && p.hsKey) next[p.hsLabel] = p.hsKey;
        p.sliceTiles.forEach((label, idx) => {
          const key = p.draftedKeys[idx];
          if (key && label) next[label] = key;
        });
      });
      return next;
    });
    setMode("random");
    setFillDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromMilty, players.length > 0]);

  // Place HS tiles whenever players data resolves
  useEffect(() => {
    setPlaced(prev => {
      const next = { ...prev };
      let changed = false;
      players.forEach(p => {
        if (p.hsLabel && p.hsKey && !next[p.hsLabel]) {
          next[p.hsLabel] = p.hsKey;
          changed = true;
        }
      });
      const shifted = applyClockwiseGapShift(next, players);
      if (shifted !== next) changed = true;
      return changed ? shifted : prev;
    });
  }, [players]);
  const [fillDone, setFillDone] = useState(false);

  // ── Random mode ────────────────────────────────────────────────────────
  const doRandomPlace = () => {
    const next = { ...placed };
    players.forEach(p => {
      const shuffled = shuffleArray([...p.draftedKeys]);
      p.sliceTiles.forEach((label, i) => {
        if (shuffled[i]) next[label] = shuffled[i];
      });
    });
    setPlaced(next);
    setMode("random");
    setFillDone(false);
  };

  const doFillRemaining = () => {
    const next = applyClockwiseGapShift(placed, players);
    const remaining = shuffleArray([...fillPool]);
    let ri = 0;
    MAP_3RING.forEach(({ label }) => {
      if (label === "000" || next[label]) return;
      if (remaining[ri]) next[label] = remaining[ri++];
    });
    setPlaced(next);
    setFillDone(true);
  };

  // ── NEW: hyperlane fill ────────────────────────────────────────────────
  const doFillHyperlanes = () => {
    const next = { ...placed };
    const HS_ALL = ["301", "304", "307", "310", "313", "316"];
    const occupiedHS = new Set(players.map(p => p.hsLabel).filter(Boolean));

    // Build a hyperlane tile key: code + angle (omit angle suffix when 0)
    const hl = (code, baseAngle, rotDeg) => {
      const angle = (baseAngle + rotDeg) % 360;
      return `${code}${angle === 0 ? '' : angle}_Hyperlane`;
    };

    // Helper to build a map-position label for a given ring and 0-based index
    const r1lbl = (i) => `1${String((i % 6) + 1).padStart(2, '0')}`;
    const r2lbl = (i) => `2${String((i % 12) + 1).padStart(2, '0')}`;
    const r3lbl = (i) => `3${String((i % 18) + 1).padStart(2, '0')}`;

    HS_ALL.forEach((hsLabel, k) => {
      if (occupiedHS.has(hsLabel)) return; // skip — player is here

      // Clockwise neighbour: if it has no player, push the ring-2 left tile one step further
      const nextHasPlayer = occupiedHS.has(HS_ALL[(k + 1) % 6]);
      const pushLeft = !nextHasPlayer;

      // rotSteps: how many 60° turns away from the base pattern (k=3, position 310)
      const rotSteps = ((k - 3) + 6) % 6;
      const rotDeg   = rotSteps * 60;

      // Base ring indices (defined at k=3 / 310):
      //   ring1 spoke:        index 3  → 104
      //   ring2 right:        index 6  → 207
      //   ring2 left normal:  index 7  → 208
      //   ring2 left pushed:  index 8  → 209
      //   ring3 left of HS:   index 8  → 309
      //   ring3 HS slot:      index 9  → 310
      //   ring3 right of HS:  index 10 → 311
      const r2LeftIdx = pushLeft ? 8 : 7;

      const placements = [
        [r1lbl(3  + rotSteps),         hl('86a', 0,   rotDeg)],
        [r2lbl(5  + 2*rotSteps),       hl('88a', 0,   rotDeg)],
        [r2lbl(r2LeftIdx + 2*rotSteps),hl('88a', 240, rotDeg)],
        [r3lbl(8  + 3*rotSteps),       hl('84a', 300, rotDeg)],
        [r3lbl(9  + 3*rotSteps),       hl('85a', 0,   rotDeg)],
        [r3lbl(10 + 3*rotSteps),       hl('84a', 0,   rotDeg)],
      ];

      placements.forEach(([label, key]) => {
        if (!next[label]) next[label] = key; // only fill empty slots
      });
    });

    setPlaced(next);
    setFillDone(true);
  };

  // ── Mantis state ───────────────────────────────────────────────────────
  const [mantis, setMantis] = useState(null);
  /*
    mantis = {
      turnNumber: number,          // 0 to players.length*5 - 1
      bags: string[][],            // tile key bags per player (in playerOrder index)
      mulligansUsed: boolean[],
      drawnTile: string | null,
      isMulligan: boolean,
    }
  */

  const startMantis = () => {
    const bags = players.map(p => shuffleArray([...p.draftedKeys]));
    setMantis({
      turnNumber: 0,
      bags,
      mulligansUsed: players.map(() => false),
      drawnTile: null,
      isMulligan: false,
    });
    setMode("mantis");
    setFillDone(false);
  };

  const mantisDraw = () => {
    setMantis(m => {
      const pidx = m.turnNumber % players.length;
      const bag = [...m.bags[pidx]];
      if (bag.length === 0) return m;
      const drawn = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
      const newBags = m.bags.map((b, i) => i === pidx ? bag : b);
      return { ...m, bags: newBags, drawnTile: drawn, isMulligan: false };
    });
  };

  const mantisPlace = () => {
    setMantis(m => {
      if (!m.drawnTile) return m;
      const pidx = m.turnNumber % players.length;
      const slotIdx = Math.floor(m.turnNumber / players.length);
      const player = players[pidx];
      const slotLabel = player.sliceTiles[slotIdx];

      setPlaced(prev => ({ ...prev, [slotLabel]: m.drawnTile }));
      return { ...m, drawnTile: null, turnNumber: m.turnNumber + 1 };
    });
  };

  const mantisMulligan = () => {
    setMantis(m => {
      if (!m.drawnTile) return m;
      const pidx = m.turnNumber % players.length;
      // Put tile back
      const bag = [...m.bags[pidx], m.drawnTile];
      const newBags = m.bags.map((b, i) => i === pidx ? bag : b);
      const mulligansUsed = [...m.mulligansUsed];
      mulligansUsed[pidx] = true;
      return { ...m, bags: newBags, drawnTile: null, mulligansUsed, isMulligan: true };
    });
  };

  // After mulligan, draw again immediately
  const mantisDrawAfterMulligan = () => {
    setMantis(m => {
      const pidx = m.turnNumber % players.length;
      const bag = [...m.bags[pidx]];
      if (bag.length === 0) return { ...m, isMulligan: false };
      const drawn = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
      const newBags = m.bags.map((b, i) => i === pidx ? bag : b);
      return { ...m, bags: newBags, drawnTile: drawn, isMulligan: false };
    });
  };

  useEffect(() => {
  if (!onPeerMessageRef) return;
  onPeerMessageRef.current = (slotId, msg) => {
    if (msg.type === 'MANTIS_STATE') {
      setMantis(msg.mantis);
      setPlaced(msg.placed);
      if (msg.mode) setMode(msg.mode);
    }
    if (msg.type === 'MANTIS_ACTION') {
      if (!isMapHost) return;
      if (msg.action === 'DRAW') {
        mantisDraw();
      } else if (msg.action === 'PLACE') {
        mantisPlace();
      } else if (msg.action === 'MULLIGAN') {
        mantisMulligan();
      } else if (msg.action === 'DRAW_AFTER_MULLIGAN') {
        mantisDrawAfterMulligan();
      }
    }
  };
}, [onPeerMessageRef, isMapHost, mantisDraw, mantisPlace, mantisMulligan, mantisDrawAfterMulligan]);

useEffect(() => {
  if (!isMapHost || !mantis || !multiplayer) return;
  Object.keys(multiplayer.peers).forEach(slotId => {
    multiplayer.sendToPeer(slotId, {
      type: 'MANTIS_STATE',
      mantis,
      placed,
      mode,
    });
  });
}, [mantis, placed]);

  // Mantis derived values
  const mantisInfo = useMemo(() => {
    if (!mantis) return null;
    const total = players.length * 5;
    const done = players.length === 0 || mantis.turnNumber >= total;
    const pidx = done ? null : mantis.turnNumber % players.length;
    const slotIdx = done ? null : Math.floor(mantis.turnNumber / players.length);
    const slotNames = ["Ring 1", "Ring 2", "Ring 2", "Ring 3", "Ring 3"];
    const player = pidx !== null ? players[pidx] : null;
    return { done, pidx, slotIdx, slotName: slotIdx !== null ? slotNames[slotIdx] : null, player };
  }, [mantis, players]);

  // ── Home stats overlay ─────────────────────────────────────────────────
  const homeStats = useMemo(() => {
    const stats = {};
    players.forEach(p => {
      if (!p.hsLabel) return;
      const planets = [];
      (ADJACENCY[p.hsLabel] ?? []).forEach(n => {
        const key = placed[n];
        if (key && key !== "112_Mecatol") {
          getTilePlanets(key).forEach(planet => planets.push(planet));
        }
      });
      const resInf = calculateOptimalResources(planets);
      stats[p.hsLabel] = {
        playerName: p.name,
        color: PLAYER_COLORS[p.position - 1],
        ...resInf,
      };
    });
    return stats;
  }, [players, placed]);

  // Which labels are each player's slice (for coloring empty slots)
  const sliceOwner = useMemo(() => {
    const map = {};
    players.forEach((p, i) => {
      p.sliceTiles.forEach(lbl => { map[lbl] = i; });
      if (p.hsLabel) map[p.hsLabel] = i;
    });
    return map;
  }, [players]);

  // ── Render ─────────────────────────────────────────────────────────────
  const placedForExport = useMemo(() => {
    return applyClockwiseGapShift(placed, players);
  }, [placed, players]);


  const mapString = useMemo(() => {
    const tokens = ["000", ...MAP_3RING.slice(1).map(p => p.label)]
      .map(lbl => {
        const key = placedForExport[lbl];
        if (!key) return "0";
        return key.split("_")[0];
      });
    return `{${tokens[0]}} ${tokens.slice(1).join(" ")}`;
  }, [placedForExport]);

  const [copied, setCopied] = useState(false);
  const copyMap = () => {
    navigator.clipboard?.writeText(mapString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", background:"linear-gradient(to bottom right,#0a0e1a,#1a1f2e,#000)", color:"#c8dde8", fontFamily:"system-ui,sans-serif", overflow:"hidden" }}>
      {/* Header */}
      <div className="app-header bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <div className="px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("/")} className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors">← Home</button>
            <h2 className="text-xl font-bold text-yellow-400">Draft Map Builder</h2>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"monospace", background:"#030712", border:"1px solid #374151", borderRadius:5, padding:"3px 8px", maxWidth:300, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
              {mapString}
            </div>
            <button onClick={copyMap} className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Sidebar: player info */}
        <div style={{ width:200, minWidth:200, background:"#0f172a", borderRight:"1px solid #4b5563", overflowY:"auto", padding:"12px 8px", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, color:"#fcd34d", textTransform:"uppercase", marginBottom:4 }}>Players</div>
          {players.map((p, i) => (
  <div key={i} style={{ padding:"8px", borderRadius:6, background:"#1e293b", border:`1px solid ${PLAYER_COLORS[p.position-1]}44` }}>
    <div style={{ fontSize:11, fontWeight:700, color: PLAYER_COLORS[p.position-1] }}>{p.name}</div>
    <div style={{ fontSize:10, color:"#9ca3af", marginTop:3, display:"flex", justifyContent:"space-between" }}>
      <span style={{ color:"#fcd34d" }}>Draft Order:</span>
      <span style={{ color:"#d1d5db", fontWeight:600 }}>{p.positionLabel}</span>
    </div>
    <div style={{ fontSize:10, color:"#9ca3af", marginTop:2, display:"flex", justifyContent:"space-between" }}>
      <span style={{ color:"#fcd34d" }}>Map Seat:</span>
      <span style={{ color:"#d1d5db", fontWeight:600 }}>{p.position ?? "—"}</span>
    </div>
    <div style={{ fontSize:10, color:"#9ca3af", marginTop:2, display:"flex", justifyContent:"space-between" }}>
      <span>HS:</span>
      <span>{p.hsLabel ?? "—"}</span>
    </div>
    <div style={{ fontSize:10, color:"#6b7280", marginTop:2 }}>{p.draftedKeys.length} tiles</div>
  </div>
))}

          {/* Mode buttons */}
          {!mode && !fromMilty && (
            <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#fcd34d", textTransform:"uppercase", letterSpacing:1 }}>Placement Mode</div>
              <button onClick={doRandomPlace} className="px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">🎲 Random</button>
              <button onClick={startMantis} className="px-3 py-2 rounded-lg bg-purple-800 hover:bg-purple-700 text-white text-sm font-semibold transition-colors">🃏 Mantis Draft</button>
            </div>
          )}

          {mode === "random" && !fillDone && (!multiplayer || isMapHost) && (
            <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
              <button onClick={doRandomPlace} className="px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">↺ Re-randomize</button>
              <button onClick={doFillRemaining} className="px-3 py-2 rounded-lg bg-green-800 hover:bg-green-700 text-white text-xs font-semibold transition-colors">🎲 Fill with Random Tiles</button>
<button onClick={doFillHyperlanes} className="px-3 py-2 rounded-lg bg-cyan-900 hover:bg-cyan-800 text-white text-xs font-semibold transition-colors">〰 Fill with Hyperlanes</button>
            </div>
          )}

          {mode === "random" && !fillDone && (!multiplayer || isMapHost) && (
            <div style={{ marginTop:8, fontSize:10, color:"#4ade80", fontWeight:600 }}>✓ Map complete</div>
          )}

          {mode === "mantis" && mantisInfo?.done && !fillDone && (!multiplayer || isMapHost) && (
            <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontSize:11, color:"#4ade80", fontWeight:700 }}>✓ All tiles placed!</div>
              <button onClick={doFillRemaining} className="px-3 py-2 rounded-lg bg-green-800 hover:bg-green-700 text-white text-xs font-semibold transition-colors">🎲 Fill with Random Tiles</button>
<button onClick={doFillHyperlanes} className="px-3 py-2 rounded-lg bg-cyan-900 hover:bg-cyan-800 text-white text-xs font-semibold transition-colors">〰 Fill with Hyperlanes</button>
            </div>
          )}

          {mode === "mantis" && fillDone && (
            <div style={{ marginTop:8, fontSize:10, color:"#4ade80", fontWeight:600 }}>✓ Map complete</div>
          )}
        </div>

        {/* Map viewport */}
        <div ref={viewportRef} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:12, position:"relative" }}>
          <div style={{ position:"relative", width:CANVAS_W, height:CANVAS_H, flexShrink:0, transform:`scale(${fitScale})`, transformOrigin:"center" }}>
            {MAP_3RING.map(({ label, x, y }) => {
              const key = placed[label];
              const cx = OX + x, cy = OY + y;
              const hexH = D;
              const ownerIdx = sliceOwner[label];
              const ownerColor = ownerIdx !== undefined ? PLAYER_COLORS[players[ownerIdx]?.position - 1] : undefined;
              const isHS = players.some(p => p.hsLabel === label);
              const isMantisTarget = mode === "mantis" && mantis && !mantisInfo?.done && (() => {
                const pidx = mantis.turnNumber % players.length;
                const slotIdx = Math.floor(mantis.turnNumber / players.length);
                return players[pidx]?.sliceTiles[slotIdx] === label;
              })();

              return (
                <div key={label} style={{ position:"absolute", left:cx-S, top:cy-hexH/2, zIndex: isMantisTarget ? 5 : 1 }}>
                  {key ? (
                    <HexTile tileKey={key} size={S} />
                  ) : (
                    <EmptyHex size={S} highlight={isMantisTarget}
                      label={isHS ? "HS" : label}
                      color={ownerColor ? `${ownerColor}44` : undefined} />
                  )}
                  {/* HS label overlay */}
                  {isHS && key && (() => {
                    const player = players.find(p => p.hsLabel === label);
                    return (
                      <div style={{ position:"absolute", inset:0, clipPath:HEX_CLIP, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:3, background:"rgba(0,0,0,0.55)", gap:2 }}>
                        <span style={{ fontSize:S*0.15, fontWeight:700, color: PLAYER_COLORS[player?.position-1], textAlign:"center", textShadow:"0 1px 3px #000" }}>Seat {player?.position}</span>
                        <span style={{ fontSize:S*0.12, fontWeight:600, color:"#fcd34d", textAlign:"center", textShadow:"0 1px 3px #000" }}>Draft: {player?.positionLabel}</span>
                         <div style={{ fontSize:S*0.14, fontWeight:800, letterSpacing:0.3, lineHeight:1.1, textShadow:"0 1px 2px #000" }}>
                          <span style={{ color:"#fbbf24" }}>{player?.hsStats?.optimalResource ?? 0}R</span>
                          <span style={{ color:"#6b7280", margin:"0 4px" }}>/</span>
                          <span style={{ color:"#60a5fa" }}>{player?.hsStats?.optimalInfluence ?? 0}I</span>
                        </div>
                        <div style={{ fontSize:S*0.11, color:"#9ca3af", fontWeight:600, lineHeight:1.1, textShadow:"0 1px 2px #000" }}>
                          ({player?.hsStats?.totalResource ?? 0}R/{player?.hsStats?.totalInfluence ?? 0}I)
                        </div>
                      </div>
                    );
                  })()}

                  {homeStats[label] && (() => {
                    const s = homeStats[label];
                    return (
                      <div style={{
                        position:"absolute", inset:0,
                        clipPath:"polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                        display:"flex", flexDirection:"column",
                        alignItems:"center", justifyContent:"center",
                        pointerEvents:"none", zIndex:6,
                        background:"rgba(0,0,0,0.72)",
                      }}>
                        <div style={{ textAlign:"center", lineHeight:1.3 }}>
                          <div style={{ fontSize:S*0.27, fontWeight:900 }}>
                            <span style={{ color:"#fbbf24" }}>{s.optimalResource}R</span>
                            <span style={{ color:"#6b7280", margin:"0 3px" }}>/</span>
                            <span style={{ color:"#60a5fa" }}>{s.optimalInfluence}I</span>
                          </div>
                          <div style={{ fontSize:S*0.16, color:"#9ca3af" }}>
                            ({s.totalResource}R/{s.totalInfluence}I)
                          </div>
                          {s.flexValue > 0 && (
                            <div style={{ fontSize:S*0.15, color:"#86efac" }}>{s.flexValue} flex</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* Mantis Draft overlay panel */}
          {mode === "mantis" && mantis && !mantisInfo?.done && (
            <div style={{ position:"absolute", bottom:16, left:"50%", transform:"translateX(-50%)", background:"#0f172a", border:"1px solid #4b5563", borderRadius:12, padding:"16px 24px", minWidth:360, zIndex:20, boxShadow:"0 8px 32px rgba(0,0,0,0.8)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12, alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:10, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>Current Turn</div>
                  <div style={{ fontSize:16, fontWeight:800, color: PLAYER_COLORS[mantisInfo.player?.position-1] }}>
                    {mantisInfo.player?.name} — {mantisInfo.slotName}
                  </div>
                  <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>
                    Placing into {mantisInfo.player?.sliceTiles[mantisInfo.slotIdx]}
                  </div>
                </div>
                <div style={{ fontSize:11, color:"#9ca3af", textAlign:"right" }}>
                  Turn {mantis.turnNumber + 1}/{players.length * 5}
                  {mantis.mulligansUsed[mantis.turnNumber % players.length] && (
                    <div style={{ color:"#f87171" }}>Mulligan used</div>
                  )}
                </div>
              </div>

              {/* Drawn tile display */}
              {mantis.drawnTile && (
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <HexTile tileKey={mantis.drawnTile} size={40} />
                  <div style={{ fontSize:13, color:"#d1d5db", fontWeight:600 }}>{mantis.drawnTile.split("_").slice(1).join(" ")}</div>
                </div>
              )}

              {/* Determine if it's this player's turn */}
{(() => {
  const myPlayersArrayIndex = !multiplayer
  ? -1  // solo: isMyTurn will be overridden below
  : players.findIndex(p => p.factionIdx === myMapPlayerIndex);

const isMyTurn = !multiplayer  // solo always shows buttons
  ? true
  : mantisInfo.pidx === myPlayersArrayIndex;  // guest: only on their turn

  // For multiplayer guests, actions send to host instead of applying locally
  const onDraw = isMapGuest
    ? () => multiplayer.sendToHost({ type: 'MANTIS_ACTION', action: 'DRAW' })
    : mantisDraw;
  const onPlace = isMapGuest
    ? () => multiplayer.sendToHost({ type: 'MANTIS_ACTION', action: 'PLACE' })
    : mantisPlace;
  const onMulligan = isMapGuest
    ? () => multiplayer.sendToHost({ type: 'MANTIS_ACTION', action: 'MULLIGAN' })
    : mantisMulligan;
  const onDrawAfterMulligan = isMapGuest
    ? () => multiplayer.sendToHost({ type: 'MANTIS_ACTION', action: 'DRAW_AFTER_MULLIGAN' })
    : mantisDrawAfterMulligan;

  return (
    <div style={{ display:"flex", gap:8 }}>
      {!mantis.drawnTile && !mantis.isMulligan && isMyTurn && (
        <button onClick={onDraw} className="flex-1 px-4 py-2 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-bold transition-colors">
          Draw Tile
        </button>
      )}
      {!mantis.drawnTile && !mantis.isMulligan && !isMyTurn && (
        <div style={{ flex:1, textAlign:'center', color:'#6b7280', fontSize:12, padding:'8px 0' }}>
          Waiting for {mantisInfo.player?.name}...
        </div>
      )}
      {mantis.isMulligan && isMyTurn && (
        <button onClick={onDrawAfterMulligan} className="flex-1 px-4 py-2 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-sm font-bold transition-colors">
          Draw Again (Mulligan)
        </button>
      )}
      {mantis.drawnTile && !mantis.isMulligan && isMyTurn && (
        <>
          <button onClick={onPlace} className="flex-1 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-bold transition-colors">
            Place Tile
          </button>
          {!mantis.mulligansUsed[mantis.turnNumber % players.length] && (
            <button onClick={onMulligan} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors">
              Mulligan
            </button>
          )}
        </>
      )}
    </div>
  );
})()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}