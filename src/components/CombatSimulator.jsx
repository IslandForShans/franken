import { useState, useCallback } from "react";

// ─── Unit Definitions ─────────────────────────────────────────────────────────

const SPACE_UNITS = [
  {
    id: "fighter",
    name: "Fighter",
    combat: 9,
    dice: 1,
    sustain: false,
    afbHit: 0,
    afbDice: 0,
    isFighter: true,
  },
  {
    id: "destroyer",
    name: "Destroyer",
    combat: 9,
    dice: 1,
    sustain: false,
    afbHit: 9,
    afbDice: 2,
    isFighter: false,
  },
  {
    id: "carrier",
    name: "Carrier",
    combat: 9,
    dice: 1,
    sustain: false,
    afbHit: 0,
    afbDice: 0,
    isFighter: false,
  },
  {
    id: "cruiser",
    name: "Cruiser",
    combat: 7,
    dice: 1,
    sustain: false,
    afbHit: 0,
    afbDice: 0,
    isFighter: false,
  },
  {
    id: "dreadnought",
    name: "Dreadnought",
    combat: 5,
    dice: 1,
    sustain: true,
    afbHit: 0,
    afbDice: 0,
    isFighter: false,
  },
  {
    id: "warsun",
    name: "War Sun",
    combat: 3,
    dice: 3,
    sustain: true,
    afbHit: 0,
    afbDice: 0,
    isFighter: false,
  },
  {
    id: "flagship",
    name: "Flagship",
    combat: 5,
    dice: 2,
    sustain: true,
    afbHit: 0,
    afbDice: 0,
    isFighter: false,
  },
];

const GROUND_UNITS = [
  {
    id: "infantry",
    name: "Infantry",
    combat: 8,
    dice: 1,
    sustain: false,
    afbHit: 0,
    afbDice: 0,
    isFighter: false,
  },
  {
    id: "mech",
    name: "Mech",
    combat: 6,
    dice: 1,
    sustain: true,
    afbHit: 0,
    afbDice: 0,
    isFighter: false,
  },
];

// ─── Simulation Engine ────────────────────────────────────────────────────────

const ITERATIONS = 10000;
const MAX_ROUNDS = 15;

function rollDie() {
  return Math.ceil(Math.random() * 10);
}

function initFleet(counts, defs) {
  const f = {};
  for (const def of defs)
    f[def.id] = { count: counts[def.id] ?? 0, damaged: 0 };
  return f;
}

function totalUnits(fleet) {
  return Object.values(fleet).reduce((s, u) => s + u.count, 0);
}

function fleetCombatHits(fleet, defs) {
  let hits = 0;
  for (const def of defs) {
    const u = fleet[def.id];
    for (let i = 0; i < u.count * def.dice; i++) {
      if (rollDie() >= def.combat) hits++;
    }
  }
  return hits;
}

function fleetAfbHits(fleet, defs) {
  let hits = 0;
  for (const def of defs) {
    if (!def.afbDice) continue;
    const u = fleet[def.id];
    for (let i = 0; i < u.count * def.afbDice; i++) {
      if (rollDie() >= def.afbHit) hits++;
    }
  }
  return hits;
}

// Optimal hit assignment: fighters → non-sustain → sustain absorb → destroy damaged sustainers
function applyHits(fleet, hits, defs) {
  const u = {};
  for (const def of defs)
    u[def.id] = { count: fleet[def.id].count, damaged: fleet[def.id].damaged };

  for (const def of defs.filter((d) => d.isFighter)) {
    const take = Math.min(u[def.id].count, hits);
    u[def.id].count -= take;
    hits -= take;
    if (!hits) return u;
  }
  for (const def of defs.filter((d) => !d.isFighter && !d.sustain)) {
    const take = Math.min(u[def.id].count, hits);
    u[def.id].count -= take;
    hits -= take;
    if (!hits) return u;
  }
  for (const def of defs.filter((d) => d.sustain)) {
    const available = u[def.id].count - u[def.id].damaged;
    const take = Math.min(available, hits);
    u[def.id].damaged += take;
    hits -= take;
    if (!hits) return u;
  }
  for (const def of defs.filter((d) => d.sustain)) {
    const take = Math.min(u[def.id].damaged, hits);
    u[def.id].count -= take;
    u[def.id].damaged -= take;
    hits -= take;
    if (!hits) return u;
  }
  for (const def of defs.filter((d) => d.sustain)) {
    const take = Math.min(u[def.id].count, hits);
    u[def.id].count -= take;
    hits -= take;
    if (!hits) return u;
  }
  return u;
}

function simulate(atkCounts, defCounts, mode, bombardmentHits) {
  const defs = mode === "space" ? SPACE_UNITS : GROUND_UNITS;
  let atkWins = 0,
    defWins = 0,
    draws = 0;

  const roundData = Array.from({ length: MAX_ROUNDS }, () => ({
    reached: 0,
    atkUnits: 0,
    defUnits: 0,
    atkHits: 0,
    defHits: 0,
    atkDamaged: 0,
    defDamaged: 0,
  }));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    let atk = initFleet(atkCounts, defs);
    let def = initFleet(defCounts, defs);

    if (mode === "space") {
      // Anti-Fighter Barrage phase
      const atkAfb = fleetAfbHits(atk, defs);
      const defAfb = fleetAfbHits(def, defs);
      if (def["fighter"])
        def["fighter"].count = Math.max(0, def["fighter"].count - atkAfb);
      if (atk["fighter"])
        atk["fighter"].count = Math.max(0, atk["fighter"].count - defAfb);
    } else {
      // Bombardment phase (pre-ground combat)
      if (bombardmentHits > 0) {
        def = applyHits(def, bombardmentHits, defs);
      }
    }

    let round = 0;
    while (totalUnits(atk) > 0 && totalUnits(def) > 0 && round < MAX_ROUNDS) {
      roundData[round].reached++;

      const atkH = fleetCombatHits(atk, defs);
      const defH = fleetCombatHits(def, defs);

      roundData[round].atkHits += atkH;
      roundData[round].defHits += defH;

      atk = applyHits(atk, defH, defs);
      def = applyHits(def, atkH, defs);

      roundData[round].atkUnits += totalUnits(atk);
      roundData[round].defUnits += totalUnits(def);
      roundData[round].atkDamaged += Object.values(atk).reduce(
        (s, u) => s + u.damaged,
        0,
      );
      roundData[round].defDamaged += Object.values(def).reduce(
        (s, u) => s + u.damaged,
        0,
      );

      round++;
    }

    const atkT = totalUnits(atk),
      defT = totalUnits(def);
    if (atkT > 0 && defT === 0) atkWins++;
    else if (defT > 0 && atkT === 0) defWins++;
    else draws++;
  }

  return {
    atkWin: +((atkWins / ITERATIONS) * 100).toFixed(1),
    defWin: +((defWins / ITERATIONS) * 100).toFixed(1),
    draw: +((draws / ITERATIONS) * 100).toFixed(1),
    rounds: roundData
      .map((r, i) =>
        r.reached > 0
          ? {
              round: i + 1,
              reached: +((r.reached / ITERATIONS) * 100).toFixed(1),
              atkSurviving: +(r.atkUnits / r.reached).toFixed(2),
              defSurviving: +(r.defUnits / r.reached).toFixed(2),
              atkHits: +(r.atkHits / r.reached).toFixed(2),
              defHits: +(r.defHits / r.reached).toFixed(2),
              atkDamaged: +(r.atkDamaged / r.reached).toFixed(2),
              defDamaged: +(r.defDamaged / r.reached).toFixed(2),
            }
          : null,
      )
      .filter((r) => r && r.reached >= 1),
  };
}

// ─── Text Parsing ─────────────────────────────────────────────────────────────

const UNIT_ALIASES = {
  fighter: "fighter",
  fighters: "fighter",
  f: "fighter",
  destroyer: "destroyer",
  destroyers: "destroyer",
  dest: "destroyer",
  dd: "destroyer",
  carrier: "carrier",
  carriers: "carrier",
  ca: "carrier",
  cruiser: "cruiser",
  cruisers: "cruiser",
  cr: "cruiser",
  dreadnought: "dreadnought",
  dreadnoughts: "dreadnought",
  dn: "dreadnought",
  dread: "dreadnought",
  warsun: "warsun",
  "war sun": "warsun",
  "war suns": "warsun",
  ws: "warsun",
  flagship: "flagship",
  flagships: "flagship",
  fs: "flagship",
  flag: "flagship",
  infantry: "infantry",
  infantries: "infantry",
  inf: "infantry",
  mech: "mech",
  mechs: "mech",
};

function parseFleetText(text) {
  const counts = {};
  const lower = text.toLowerCase();
  // Try multi-word aliases first (e.g. "war sun")
  const sorted = Object.keys(UNIT_ALIASES).sort((a, b) => b.length - a.length);
  const regex = new RegExp(
    `(\\d+)\\s*(${sorted.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g",
  );
  let m;
  while ((m = regex.exec(lower)) !== null) {
    const num = parseInt(m[1]);
    const unitId = UNIT_ALIASES[m[2]];
    if (unitId && num > 0) counts[unitId] = (counts[unitId] ?? 0) + num;
  }
  return counts;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UnitRow({ def, count, onSet }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-200">{def.name}</span>
        <span className="text-xs text-gray-500">
          {def.combat}
          {def.dice > 1 ? `(×${def.dice})` : ""}
          {def.sustain ? " · Sustain" : ""}
          {def.afbDice ? ` · AFB ${def.afbHit}(×${def.afbDice})` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSet(def.id, count - 1)}
          className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors flex items-center justify-center"
        >
          −
        </button>
        <span className="w-6 text-center font-mono font-bold text-white">
          {count}
        </span>
        <button
          onClick={() => onSet(def.id, count + 1)}
          className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}

function FleetBuilder({
  label,
  color,
  side,
  defs,
  counts,
  onSet,
  text,
  onTextChange,
  onApplyText,
  onClear,
}) {
  const borderColor = color === "blue" ? "border-blue-500" : "border-red-500";
  const headerColor = color === "blue" ? "text-blue-400" : "text-red-400";
  const btnColor =
    color === "blue"
      ? "bg-blue-700 hover:bg-blue-600"
      : "bg-red-700 hover:bg-red-600";

  return (
    <div className={`bg-gray-800 rounded-xl border ${borderColor} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-lg font-bold ${headerColor}`}>{label}</h2>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Text input */}
      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`e.g. "2 carriers, 3f, 1 dn"`}
          className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          onKeyDown={(e) => e.key === "Enter" && onApplyText()}
        />
        <button
          onClick={onApplyText}
          className={`px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors ${btnColor}`}
        >
          Apply
        </button>
      </div>

      {/* Unit spinners */}
      <div>
        {defs.map((def) => (
          <UnitRow
            key={def.id}
            def={def}
            count={counts[def.id] ?? 0}
            onSet={(id, val) => onSet(side, id, val)}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400">
        Total:{" "}
        <span className="text-white font-semibold">
          {defs.reduce((s, d) => s + (counts[d.id] ?? 0), 0)}
        </span>{" "}
        units
        {defs.some((d) => d.sustain && (counts[d.id] ?? 0) > 0) && (
          <span className="ml-3">
            Sustainers:{" "}
            <span className="text-yellow-400 font-semibold">
              {defs
                .filter((d) => d.sustain)
                .reduce((s, d) => s + (counts[d.id] ?? 0), 0)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

function WinBar({ atkWin, defWin, draw }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm font-semibold mb-1">
        <span className="text-blue-400">Attacker {atkWin}%</span>
        {draw > 0 && <span className="text-gray-400">Draw {draw}%</span>}
        <span className="text-red-400">Defender {defWin}%</span>
      </div>
      <div className="flex h-8 rounded-lg overflow-hidden">
        <div
          className="bg-blue-600 transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
          style={{ width: `${atkWin}%` }}
        >
          {atkWin >= 8 ? `${atkWin}%` : ""}
        </div>
        {draw > 0 && (
          <div
            className="bg-gray-600 transition-all duration-500 flex items-center justify-center text-xs font-bold text-gray-300"
            style={{ width: `${draw}%` }}
          >
            {draw >= 5 ? `${draw}%` : ""}
          </div>
        )}
        <div
          className="bg-red-700 transition-all duration-500 flex items-center justify-center text-xs font-bold text-white flex-1"
          style={{ width: `${defWin}%` }}
        >
          {defWin >= 8 ? `${defWin}%` : ""}
        </div>
      </div>
    </div>
  );
}

function ResultsTable({ rounds }) {
  if (rounds.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 text-xs">
            <th className="py-2 text-left">Round</th>
            <th className="py-2 text-center">Reached</th>
            <th className="py-2 text-center text-blue-400">Atk Hits</th>
            <th className="py-2 text-center text-red-400">Def Hits</th>
            <th className="py-2 text-center text-blue-400">Atk Surviving</th>
            <th className="py-2 text-center text-red-400">Def Surviving</th>
            <th className="py-2 text-center text-blue-400">Atk Damaged</th>
            <th className="py-2 text-center text-red-400">Def Damaged</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr
              key={r.round}
              className="border-b border-gray-800 hover:bg-gray-800/50"
            >
              <td className="py-1.5 font-bold text-yellow-400">{r.round}</td>
              <td className="py-1.5 text-center text-gray-400">{r.reached}%</td>
              <td className="py-1.5 text-center text-blue-300">{r.atkHits}</td>
              <td className="py-1.5 text-center text-red-300">{r.defHits}</td>
              <td className="py-1.5 text-center text-blue-300">
                {r.atkSurviving}
              </td>
              <td className="py-1.5 text-center text-red-300">
                {r.defSurviving}
              </td>
              <td className="py-1.5 text-center text-blue-300">
                {r.atkDamaged}
              </td>
              <td className="py-1.5 text-center text-red-300">
                {r.defDamaged}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        All values are averages across {ITERATIONS.toLocaleString()} simulated
        combats. "Reached" = % of battles that lasted to this round.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CombatSimulator({ onNavigate }) {
  const [mode, setMode] = useState("space");
  const [atkCounts, setAtkCounts] = useState({});
  const [defCounts, setDefCounts] = useState({});
  const [atkText, setAtkText] = useState("");
  const [defText, setDefText] = useState("");
  const [bombardmentHits, setBombardmentHits] = useState(0);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  const defs = mode === "space" ? SPACE_UNITS : GROUND_UNITS;

  const handleModeChange = (m) => {
    setMode(m);
    setAtkCounts({});
    setDefCounts({});
    setAtkText("");
    setDefText("");
    setBombardmentHits(0);
    setResults(null);
  };

  const setCount = (side, unitId, val) => {
    const setter = side === "atk" ? setAtkCounts : setDefCounts;
    setter((prev) => ({ ...prev, [unitId]: Math.max(0, Math.min(20, val)) }));
    setResults(null);
  };

  const applyText = (side) => {
    const text = side === "atk" ? atkText : defText;
    const parsed = parseFleetText(text);
    if (Object.keys(parsed).length === 0) return;
    const setter = side === "atk" ? setAtkCounts : setDefCounts;
    setter(parsed);
    setResults(null);
  };

  const clear = (side) => {
    if (side === "atk") {
      setAtkCounts({});
      setAtkText("");
    } else {
      setDefCounts({});
      setDefText("");
    }
    setResults(null);
  };

  const runSimulation = useCallback(() => {
    const atkTotal = defs.reduce((s, d) => s + (atkCounts[d.id] ?? 0), 0);
    const defTotal = defs.reduce((s, d) => s + (defCounts[d.id] ?? 0), 0);
    if (atkTotal === 0 || defTotal === 0) return;
    setRunning(true);
    setTimeout(() => {
      setResults(simulate(atkCounts, defCounts, mode, bombardmentHits));
      setRunning(false);
    }, 0);
  }, [atkCounts, defCounts, mode, bombardmentHits, defs]);

  const atkTotal = defs.reduce((s, d) => s + (atkCounts[d.id] ?? 0), 0);
  const defTotal = defs.reduce((s, d) => s + (defCounts[d.id] ?? 0), 0);
  const canSimulate = atkTotal > 0 && defTotal > 0;

  return (
    <div className="min-h-[100dvh] bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button
            onClick={() => onNavigate("/")}
            className="text-gray-400 hover:text-white transition-colors text-sm shrink-0"
          >
            ← Home
          </button>
          <h1 className="text-lg font-bold text-yellow-400">
            Combat Simulator
          </h1>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleModeChange("space")}
              className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${mode === "space" ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              🚀 Space
            </button>
            <button
              onClick={() => handleModeChange("ground")}
              className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${mode === "ground" ? "bg-yellow-500 text-black" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              ⚔️ Ground
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Fleet Builders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FleetBuilder
            label="Attacker"
            color="blue"
            side="atk"
            defs={defs}
            counts={atkCounts}
            onSet={setCount}
            text={atkText}
            onTextChange={setAtkText}
            onApplyText={() => applyText("atk")}
            onClear={() => clear("atk")}
          />
          <FleetBuilder
            label="Defender"
            color="red"
            side="def"
            defs={defs}
            counts={defCounts}
            onSet={setCount}
            text={defText}
            onTextChange={setDefText}
            onApplyText={() => applyText("def")}
            onClear={() => clear("def")}
          />
        </div>

        {/* Bombardment (ground only) */}
        {mode === "ground" && (
          <div className="bg-gray-800 rounded-xl border border-orange-700 p-4">
            <h3 className="text-sm font-bold text-orange-400 mb-2">
              Pre-Combat Bombardment
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Enter the total number of bombardment hits dealt to the defender
              before ground combat begins.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBombardmentHits((h) => Math.max(0, h - 1))}
                className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center font-mono font-bold text-white text-lg">
                {bombardmentHits}
              </span>
              <button
                onClick={() => setBombardmentHits((h) => h + 1)}
                className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors"
              >
                +
              </button>
              <span className="text-xs text-gray-500 ml-2">
                bombardment hits on defender
              </span>
            </div>
          </div>
        )}

        {/* Simulate button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={runSimulation}
            disabled={running || !canSimulate}
            className="px-10 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-lg text-lg transition-colors"
          >
            {running
              ? "Simulating…"
              : `⚔️ Simulate (${ITERATIONS.toLocaleString()} runs)`}
          </button>
          {!canSimulate && (
            <p className="text-xs text-gray-500">
              Both sides need at least 1 unit to simulate.
            </p>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="bg-gray-800 rounded-xl border border-yellow-700 p-4 space-y-4">
            <h2 className="text-lg font-bold text-yellow-400 border-b border-gray-700 pb-2">
              Results
            </h2>

            {/* Win probability */}
            <WinBar
              atkWin={results.atkWin}
              defWin={results.defWin}
              draw={results.draw}
            />

            {/* Big numbers */}
            <div className="grid grid-cols-3 gap-3 text-center mb-2">
              <div className="bg-blue-900/40 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-300">
                  {results.atkWin}%
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Attacker Wins
                </div>
              </div>
              <div className="bg-gray-700/40 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-300">
                  {results.draw}%
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Both Eliminated
                </div>
              </div>
              <div className="bg-red-900/40 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-300">
                  {results.defWin}%
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Defender Wins
                </div>
              </div>
            </div>

            {/* Round breakdown */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-2">
                Round-by-Round Breakdown
              </h3>
              <ResultsTable rounds={results.rounds} />
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
          <p>
            <span className="text-gray-300 font-semibold">
              Text input shortcuts:
            </span>{" "}
            f=Fighter, dest=Destroyer, ca=Carrier, cr=Cruiser, dn=Dreadnought,
            ws=War Sun, fs=Flagship, inf=Infantry, mech=Mech
          </p>
          <p>
            <span className="text-gray-300 font-semibold">Assumptions:</span>{" "}
            Optimal hit assignment (fighters first, then non-sustain, then
            sustain absorb). Flagship uses generic 5(×2) sustain stats. Combat
            rolls 1–10, hit on ≥ target.
          </p>
        </div>
      </div>
    </div>
  );
}
