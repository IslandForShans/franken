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
import { ALL_TILE_KEYS } from "../data/tileCatalog";

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

const TILE_CODE_TO_KEY = new Map(
  ALL_TILE_KEYS.map((key) => {
    const [code] = key.split("_");
    return [code.toLowerCase(), key];
  })
);

function tileToTileKey(tile) {
  if (!tile) return null;

  if (typeof tile === "string") {
    const directMatch = TILE_CODE_TO_KEY.get(tile.toLowerCase());
    return directMatch ?? tile;
  }

  const keyLike = tile.key ?? tile.tile_key;
  if (typeof keyLike === "string" && keyLike.length > 0) return keyLike;

  const id = String(tile.id ?? "").toLowerCase();
  if (!id) return null;
  return TILE_CODE_TO_KEY.get(id) ?? null;
}

function SliceMiniMap({ slice }) {
  // Snapshot-style layout (matches a cropped map view in 310 orientation)
  // Uses the same flat-top hex proportions as your map builder.
  const S = 44;
  const D = Math.sqrt(3) * S;
  const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

  // Slice tile order (same semantics used elsewhere):
  // [R1, R3-first, R2-spoke, R3-second, R2-left]
  const tiles = slice?.tiles ?? [];
  const tileKeys = (slice?.tiles ?? []).map(tileToTileKey);

  // Coordinates are relative to an H (home) placeholder and emulate
  // positions as if the slice were seen on the actual map in 310 orientation.
  const origin = { x: 200, y: 206 }; // H center
  const pos = {
    r1: { x: origin.x + 0, y: origin.y - 2 * D },       // 104
    r3a: { x: origin.x + 0, y: origin.y - 1 * D },      // 207
    r2spoke: { x: origin.x - 1.5 * S, y: origin.y - 1.5 * D }, // 208
    r3b: { x: origin.x + 1.5 * S, y: origin.y - 0.5 * D },     // 309
    r2left: { x: origin.x - 1.5 * S, y: origin.y - 0.5 * D },  // 311
  };

  const stats = slice?.stats;

  const TileHex = ({ tileKey, x, y }) => {
    const w = S * 2;
    const h = D;
    return (
      <div
        style={{
          position: "absolute",
          left: x - S,
          top: y - h / 2,
          width: w,
          height: h,
          clipPath: HEX_CLIP,
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,0.45)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
          background: "#111827",
        }}
      >
        {tileKey ? (
          <img
            src={`${BASE_URL}tiles/${tileKey}.png`}
            alt="tile"
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-3">
      <div
        style={{
          position: "relative",
          width: 400,
          height: 252,
          margin: "0 auto",
        }}
      >
        <TileHex tileKey={tileKeys[0]} x={pos.r1.x} y={pos.r1.y} />
        <TileHex tileKey={tileKeys[1]} x={pos.r3a.x} y={pos.r3a.y} />
        <TileHex tileKey={tileKeys[2]} x={pos.r2spoke.x} y={pos.r2spoke.y} />
        <TileHex tileKey={tileKeys[3]} x={pos.r3b.x} y={pos.r3b.y} />
        <TileHex tileKey={tileKeys[4]} x={pos.r2left.x} y={pos.r2left.y} />

        {/* Home placeholder + overlay stats (placed where H would be on map) */}
        <div
          style={{
            position: "absolute",
            left: origin.x - S,
            top: origin.y - D / 2,
            width: S * 2,
            height: D,
            clipPath: HEX_CLIP,
            border: "2px solid rgba(74,222,128,0.9)",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            color: "#e5e7eb",
            fontSize: 10,
            lineHeight: 1.2,
          }}
        >
          <div className="font-extrabold text-green-400 text-xs">H</div>
          <div>{stats?.totalResource ?? 0}R / {stats?.totalInfluence ?? 0}I</div>
          <div>L{stats?.legendaryCount ?? 0} · W{stats?.wormholeCount ?? 0}</div>
          <div>A{stats?.anomalyCount ?? 0} · T{stats?.techSpecCount ?? 0}</div>
        </div>
      </div>
    </div>
  );
}


export default function MiltyDraftPage({ onNavigate }) {
  const [playerCount, setPlayerCount] = useState(6);
  const [factionPoolSize, setFactionPoolSize] = useState(12);
  const [slicePoolSize, setSlicePoolSize] = useState(8);
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
                    min={2}
                    max={60}
                    value={factionPoolSize}
                    onChange={(e) => setFactionPoolSize(clampInt(e.target.value, 2, 60, 12))}
                    className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                  />
                </label>

                <label className="text-sm">
                  Slice options
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={slicePoolSize}
                    onChange={(e) => setSlicePoolSize(clampInt(e.target.value, 2, 60, 8))}
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
                    <span>{k}</span>
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Factions */}
              <div className={`bg-gray-900/60 border rounded-lg p-3 ${currentTurn.category === "faction" ? "border-indigo-400" : "border-gray-700"}`}>
                <h3 className="font-bold mb-2">Faction Pool ({draftState.pools.faction.length})</h3>
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
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

              {/* Slices */}
              <div className={`bg-gray-900/60 border rounded-lg p-3 ${currentTurn.category === "slice" ? "border-indigo-400" : "border-gray-700"}`}>
                <h3 className="font-bold mb-2">Slice Pool ({draftState.pools.slice.length})</h3>
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  {draftState.pools.slice.map((s) => (
                    <button
                      key={s.id}
                      disabled={currentTurn.category !== "slice"}
                      onClick={() => pickItem(s)}
                      className="w-full text-left rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
                    >
                      <div className="font-semibold mb-1">{s.id}</div>
                      <SliceMiniMap slice={s} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Positions */}
              <div className={`bg-gray-900/60 border rounded-lg p-3 ${currentTurn.category === "position" ? "border-indigo-400" : "border-gray-700"}`}>
                <h3 className="font-bold mb-2">Table Positions ({draftState.pools.position.length})</h3>
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
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