import React, { useMemo, useState } from "react";
import {
  clampInt,
  getFilteredFactionPool,
  sampleUnique,
  generateSlicePool,
  generateTablePositionPool,
  randomPlayerOrder,
  makeSnakeTurnQueue,
  toDraftMapBuilderPayload,
} from "../utils/miltyDraftUtils";
import { ALL_TILE_KEYS, TILE_CODE_TO_JSON_ID } from "../data/tileCatalog";
import { ICON_MAP } from "../utils/dataProcessor";

const BASE_URL = import.meta.env.BASE_URL;

const DEFAULT_EXPANSIONS = {
  pok: true,
  te: false,
  ds: false,
  us: false,
  firmobs: false,
  dsOnly: false,
  br: false,
};

const DEFAULT_CONSTRAINTS = {
  resInfProfile: "balanced",
  minLegendary: 0,
  maxLegendary: 5,
  minWormholes: 0,
  maxWormholes: 5,
  minAnomalies: 0,
  maxAnomalies: 5,
  minTechSpecs: 0,
  maxTechSpecs: 8,
};

const CATEGORIES = ["faction", "slice", "position"];

// Build three lookup maps for robust tile key resolution
const MILTY_KEY_BY_CODE = new Map();   // "19" → "19_Wellon"
const MILTY_KEY_BY_NAME = new Map();   // "wellon" → "19_Wellon"
const MILTY_KEY_BY_JSON_ID = new Map(); // "4253" → "d100"

ALL_TILE_KEYS.forEach(key => {
  const parts = key.split("_");
  const code = parts[0];
  const name = parts.slice(1).join("").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!MILTY_KEY_BY_CODE.has(code.toLowerCase())) MILTY_KEY_BY_CODE.set(code.toLowerCase(), key);
  if (name) MILTY_KEY_BY_NAME.set(name, key);
});
Object.entries(TILE_CODE_TO_JSON_ID).forEach(([code, jsonId]) => {
  const tileKey = MILTY_KEY_BY_CODE.get(code.toLowerCase());
  if (tileKey) MILTY_KEY_BY_JSON_ID.set(String(jsonId), tileKey);
});

function tileToTileKey(tile) {
  if (!tile) return null;
  if (typeof tile === "string") return MILTY_KEY_BY_CODE.get(tile.toLowerCase()) ?? tile;

  // 1. Explicit key field
  const keyLike = tile.key ?? tile.tile_key;
  if (typeof keyLike === "string" && keyLike.length > 0) return keyLike;

  // 2. JSON id (handles DS tiles like 4253, and base tiles like 19)
  if (tile.id != null) {
    const strId = String(tile.id);
    const byJsonId = MILTY_KEY_BY_JSON_ID.get(strId);
    if (byJsonId) return byJsonId;
    const byCode = MILTY_KEY_BY_CODE.get(strId.toLowerCase());
    if (byCode) return byCode;
  }

  // 3. Tile name
  if (tile.name) {
    const norm = tile.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const byName = MILTY_KEY_BY_NAME.get(norm);
    if (byName) return byName;
  }

  // 4. Planet names (home system fallback)
  if (Array.isArray(tile.planets)) {
    for (const planet of tile.planets) {
      if (planet?.name) {
        const norm = planet.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const byPlanet = MILTY_KEY_BY_NAME.get(norm);
        if (byPlanet) return byPlanet;
      }
    }
  }

  return null;
}

function SliceMiniMap({ slice }) {
  const S = 54;
  const D = Math.sqrt(3) * S;
  const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

  const tileKeys = (slice?.tiles ?? []).map(tileToTileKey);
  const stats = slice?.stats;

  // The 5 slice tile centers relative to a phantom home at (0,0).
  // Bounding box of all tile edges: x in [-2.5S, 2.5S], y in [-2.5D, 0]
  // So content is exactly 5S wide and 2.5D tall. Add padding.
  const PAD = 6;
  const W = Math.ceil(5 * S) + PAD * 2;
  const H_CANVAS = Math.ceil(2.5 * D) + PAD * 2;

  // Place phantom home just below the bottom edge so bottom tiles sit flush.
  const ox = W / 2;
  const oy = H_CANVAS - PAD;

  const positions = [
    { x: ox,            y: oy - 2 * D },       // R1: straight up
    { x: ox,            y: oy - 1 * D },       // R2: center spoke
    { x: ox - 1.5 * S, y: oy - 1.5 * D },     // R2: upper-left
    { x: ox + 1.5 * S, y: oy - 0.5 * D },     // R3: lower-right
    { x: ox - 1.5 * S, y: oy - 0.5 * D },     // R2: lower-left
  ];

  const TileHex = ({ tileKey, x, y }) => (
    <div style={{
      position: "absolute",
      left: x - S,
      top: y - D / 2,
      width: S * 2,
      height: D,
      clipPath: HEX_CLIP,
      overflow: "hidden",
      background: "#2a3f5f",
    }}>
      {tileKey
        ? <img
            src={`${BASE_URL}tiles/${tileKey}.png`}
            alt="tile"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(1.35) saturate(1.15)" }}
          />
        : null
      }
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{
        position: "relative",
        width: W,
        height: H_CANVAS,
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: 6,
        background: "#1a2540",
        border: "1px solid #3a5a8f",
      }}>
        {positions.map((pos, i) => (
          <TileHex key={i} tileKey={tileKeys[i]} x={pos.x} y={pos.y} />
        ))}
      </div>
      {stats && (
        <div style={{ fontSize: 11, lineHeight: 1.7, color: "#cbd5e1", minWidth: 78 }}>
          <div><span style={{ color: "#fbbf24" }}>{stats.optimalResource}R</span> / <span style={{ color: "#60a5fa" }}>{stats.optimalInfluence}I</span></div>
          <div style={{ color: "#9ca3af", fontSize: 10 }}>({stats.totalResource}R / {stats.totalInfluence}I)</div>
          {stats.flexValue > 0 && <div style={{ color: "#86efac", fontSize: 10 }}>{stats.flexValue} flex</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {stats.legendaryCount > 0 && Array.from({ length: stats.legendaryCount }).map((_, i) => (
              <img key={`leg-${i}`} src={ICON_MAP.legendary} alt="legendary" title="Legendary" style={{ width: 16, height: 16 }} />
            ))}
            {stats.wormholeCount > 0 && Array.from({ length: stats.wormholeCount }).map((_, i) => (
              <img key={`wh-${i}`} src={ICON_MAP.wormholes.Alpha} alt="wormhole" title="Wormhole" style={{ width: 16, height: 16 }} />
            ))}
            {stats.anomalyCount > 0 && Array.from({ length: stats.anomalyCount }).map((_, i) => (
              <img key={`anom-${i}`} src={ICON_MAP.anomalies["Asteroid Field"]} alt="anomaly" title="Anomaly" style={{ width: 16, height: 16 }} />
            ))}
            {stats.techSpecCount > 0 && Array.from({ length: stats.techSpecCount }).map((_, i) => (
              <img key={`tech-${i}`} src={ICON_MAP.techColors.Blue} alt="tech specialty" title="Tech Specialty" style={{ width: 16, height: 16 }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export default function MiltyDraftPage({ onNavigate }) {
  const [playerCount, setPlayerCount] = useState(6);
  const [factionPoolSize, setFactionPoolSize] = useState(9);
  const [slicePoolSize, setSlicePoolSize] = useState(9);
  const [playerNamesText, setPlayerNamesText] = useState("");

  const [expansionsEnabled, setExpansionsEnabled] = useState(DEFAULT_EXPANSIONS);
  const [sliceConstraints, setSliceConstraints] = useState(DEFAULT_CONSTRAINTS);

  const [bannedFactionsText, setBannedFactionsText] = useState("");

  const [phase, setPhase] = useState("setup"); // setup | draft | done
  const [warning, setWarning] = useState(null);

  const [draftState, setDraftState] = useState(null);

  const parsedPlayerNames = useMemo(() => {
    return playerNamesText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 8);
  }, [playerNamesText]);

  const bannedFactions = useMemo(() => {
    const names = bannedFactionsText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    return new Set(names);
  }, [bannedFactionsText]);

  const playerRows = useMemo(() => {
    const n = clampInt(playerCount, 2, 8, 6);
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      name: parsedPlayerNames[i] || `Player ${i + 1}`,
      picks: {},
    }));
  }, [playerCount, parsedPlayerNames]);

  const currentTurn = useMemo(() => {
    if (!draftState) return null;
    return draftState.turnQueue[draftState.turnIndex] ?? null;
  }, [draftState]);

  const startDraft = () => {
    const pc = clampInt(playerCount, 2, 8, 6);
    const factionCount = clampInt(factionPoolSize, pc, 40, 12);
    const sliceCount = clampInt(slicePoolSize, pc, 30, 8);

    const factions = getFilteredFactionPool({ expansionsEnabled, bannedFactions });
    if (factions.length < pc) {
      setWarning(`Not enough eligible factions for ${pc} players with current filters/bans.`);
      return;
    }

    const factionPool = sampleUnique(factions, Math.min(factionCount, factions.length));
    if (factionPool.length < pc) {
      setWarning(`Faction pool (${factionPool.length}) must be at least player count (${pc}).`);
      return;
    }

    const { slices, warning: sliceWarn } = generateSlicePool({
      size: sliceCount,
      expansionsEnabled,
      sliceConstraints,
    });

    if (slices.length < pc) {
      setWarning(`Not enough slices generated (${slices.length}) for ${pc} players. Relax slice constraints.`);
      return;
    }

    const positionPool = generateTablePositionPool(pc);

    const order = randomPlayerOrder(pc);
    const turnQueue = makeSnakeTurnQueue(order, CATEGORIES);

    const players = playerRows.map(p => ({ ...p, picks: {} }));

    setDraftState({
      players,
      playerOrder: order,
      turnQueue,
      turnIndex: 0,
      pools: {
        faction: factionPool,
        slice: slices,
        position: positionPool,
      },
      discarded: {
        faction: [],
        slice: [],
        position: [],
      },
    });

    setWarning(sliceWarn || null);
    setPhase("draft");
  };

  const pickItem = (item) => {
    setDraftState(prev => {
      if (!prev) return prev;

      const turn = prev.turnQueue[prev.turnIndex];
      if (!turn) return prev;

      const { playerId, category } = turn;
      const pool = prev.pools[category] ?? [];

      const idx = pool.findIndex(p => {
        if (category === "slice") return p.id === item.id;
        return (p.id ?? p.name) === (item.id ?? item.name);
      });
      if (idx < 0) return prev;

      const picked = pool[idx];
      const nextPool = [...pool.slice(0, idx), ...pool.slice(idx + 1)];

      const players = prev.players.map((pl, i) => {
        if (i !== playerId) return pl;
        return { ...pl, picks: { ...pl.picks, [category]: picked } };
      });

      const nextState = {
        ...prev,
        players,
        pools: {
          ...prev.pools,
          [category]: nextPool,
        },
        turnIndex: prev.turnIndex + 1,
      };

      if (nextState.turnIndex >= nextState.turnQueue.length) {
        // draft complete, discard leftovers
        nextState.discarded = {
          faction: nextState.pools.faction,
          slice: nextState.pools.slice,
          position: nextState.pools.position,
        };
      }

      return nextState;
    });
  };

  const finishToMapBuilder = () => {
    if (!draftState) return;

    const payload = toDraftMapBuilderPayload({
      players: draftState.players,
      playerCount: clampInt(playerCount, 2, 8, 6),
    });

    onNavigate("/mapbuilder-draft", payload);
  };

  const draftDone = !!draftState && draftState.turnIndex >= draftState.turnQueue.length;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-400">TI4 Milty Draft</h1>
        <div className="flex gap-2">
          <button onClick={() => onNavigate("/")} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm font-semibold">Home</button>
          <button onClick={() => { setPhase("setup"); setDraftState(null); }} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm font-semibold">Reset</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {phase === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 space-y-4">
              <h2 className="font-bold text-lg text-indigo-300">Settings</h2>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Players (2-8)
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={playerCount}
                    onChange={(e) => setPlayerCount(clampInt(e.target.value, 2, 8, 6))}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                  />
                </label>

                <label className="text-sm">
                  Faction options
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={factionPoolSize}
                    onChange={(e) => setFactionPoolSize(clampInt(e.target.value, 0, 60, 9))}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                  />
                </label>

                <label className="text-sm">
                  Slice options
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={slicePoolSize}
                    onChange={(e) => setSlicePoolSize(clampInt(e.target.value, 0, 60, 9))}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                  />
                </label>
              </div>

              <label className="block text-sm">
                Player names (one per line; optional)
                <textarea
                  rows={8}
                  value={playerNamesText}
                  onChange={(e) => setPlayerNamesText(e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                  placeholder={`Alice\nBob\nCarol\n...`}
                />
              </label>

              <label className="block text-sm">
                Banned factions (one per line; optional)
                <textarea
                  rows={6}
                  value={bannedFactionsText}
                  onChange={(e) => setBannedFactionsText(e.target.value)}
                  className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                />
              </label>
            </div>

            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 space-y-4">
              <h2 className="font-bold text-lg text-indigo-300">Expansions + Slice Constraints</h2>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.keys(expansionsEnabled).map((k) => (
                  <label key={k} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!expansionsEnabled[k]}
                      onChange={(e) => setExpansionsEnabled((prev) => ({ ...prev, [k]: e.target.checked }))}
                    />
                    <span>{{
                      pok: "Prophecy of Kings",
                      te: "Thunder's Edge",
                      ds: "Discordant Stars",
                      us: "Uncharted Space",
                      firmobs: "Firmament / Obsidian",
                      dsOnly: "DS Only Mode",
                      br: "Blue Reverie",
                    }[k] ?? k}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <label>
                  R/I profile
                  <select
                    value={sliceConstraints.resInfProfile}
                    onChange={(e) => setSliceConstraints((p) => ({ ...p, resInfProfile: e.target.value }))}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="high">High average</option>
                    <option value="low">Low average</option>
                  </select>
                </label>

                {[
                  ["minLegendary", "Min legendary"],
                  ["maxLegendary", "Max legendary"],
                  ["minWormholes", "Min wormholes"],
                  ["maxWormholes", "Max wormholes"],
                  ["minAnomalies", "Min anomalies"],
                  ["maxAnomalies", "Max anomalies"],
                  ["minTechSpecs", "Min tech specs"],
                  ["maxTechSpecs", "Max tech specs"],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      value={sliceConstraints[key]}
                      onChange={(e) => setSliceConstraints((p) => ({ ...p, [key]: clampInt(e.target.value, 0, 99, 0) }))}
                      className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                    />
                  </label>
                ))}
              </div>

              {warning && <div className="text-yellow-300 text-sm">⚠️ {warning}</div>}

              <button
                onClick={startDraft}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 font-bold"
              >
                Start Milty Draft
              </button>
            </div>
          </div>
        )}

        {phase === "draft" && draftState && !draftDone && (
          <div className="space-y-4">
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 flex flex-wrap justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-gray-400">Current Turn</div>
                <div className="text-lg font-bold text-indigo-300">
                  {draftState.players[currentTurn.playerId]?.name} picks {currentTurn.category}
                </div>
              </div>
              <div className="text-sm text-gray-300">
                Turn {draftState.turnIndex + 1} / {draftState.turnQueue.length}
              </div>
            </div>

            {/* Faction + Position side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`bg-gray-900/60 border rounded-lg p-3 ${currentTurn.category === "faction" ? "border-indigo-400" : "border-gray-700"}`}>
                <h3 className="font-bold mb-2">Faction Pool ({draftState.pools.faction.length})</h3>
                <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                  {draftState.pools.faction.map((f) => (
                    <button
                      key={f.name}
                      disabled={currentTurn.category !== "faction"}
                      onClick={() => pickItem(f)}
                      className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`bg-gray-900/60 border rounded-lg p-3 ${currentTurn.category === "position" ? "border-indigo-400" : "border-gray-700"}`}>
                <h3 className="font-bold mb-2">Table Positions ({draftState.pools.position.length})</h3>
                <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                  {draftState.pools.position.map((pos) => (
                    <button
                      key={pos.id}
                      disabled={currentTurn.category !== "position"}
                      onClick={() => pickItem(pos)}
                      className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pos.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Slices — full width, 3-per-row grid, no height cap */}
            <div className={`bg-gray-900/60 border rounded-lg p-4 ${currentTurn.category === "slice" ? "border-indigo-400" : "border-gray-700"}`}>
              <h3 className="font-bold mb-3">Slice Pool ({draftState.pools.slice.length})</h3>
              <div className="grid grid-cols-2 gap-3">
                {draftState.pools.slice.map((s) => (
                  <button
                    key={s.id}
                    disabled={currentTurn.category !== "slice"}
                    onClick={() => pickItem(s)}
                    className="text-left rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-3 border border-gray-700 hover:border-indigo-500 transition-colors"
                  >
                    <div className="font-semibold text-sm text-indigo-300 mb-2">{s.id}</div>
                    <SliceMiniMap slice={s} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === "draft" && draftState && draftDone && (
          <div className="space-y-4">
            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-bold text-green-300 mb-3">Draft Complete</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {draftState.players.map((p, idx) => (
                  <div key={idx} className="bg-gray-800/70 rounded p-3 border border-gray-700">
                    <div className="font-bold">{p.name}</div>
                    <div className="text-sm text-gray-300">Faction: {p.picks.faction?.name ?? "—"}</div>
                    <div className="text-sm text-gray-300">Slice: {p.picks.slice?.id ?? "—"}</div>
                    <div className="text-sm text-gray-300">Position: {p.picks.position?.name ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-4">
              <h3 className="font-bold mb-2">Discarded leftovers</h3>
              <div className="text-sm text-gray-300">Factions: {draftState.discarded.faction.length}</div>
              <div className="text-sm text-gray-300">Slices: {draftState.discarded.slice.length}</div>
              <div className="text-sm text-gray-300">Positions: {draftState.discarded.position.length}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={finishToMapBuilder}
                className="px-4 py-2 rounded bg-orange-700 hover:bg-orange-600 font-bold"
              >
                🗺️ Send to Draft Map Builder
              </button>
              <button
                onClick={() => { setPhase("setup"); setDraftState(null); }}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 font-semibold"
              >
                New Milty Draft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}