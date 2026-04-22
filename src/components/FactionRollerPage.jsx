import React, { useMemo, useState } from "react";
import { factionsData, discordantStarsData } from "../data/processedData";
import {
  pokExclusions,
  teExclusions,
  brExclusions,
} from "../utils/expansionFilters";
import { isComponentUndraftable } from "../data/undraftable-components";

const CATEGORY_CONFIG = [
  { key: "abilities", label: "Abilities" },
  { key: "faction_techs", label: "Faction Techs" },
  { key: "agents", label: "Agents" },
  { key: "commanders", label: "Commanders" },
  { key: "heroes", label: "Heroes" },
  { key: "promissory", label: "Promissory" },
  { key: "starting_techs", label: "Starting Techs" },
  { key: "starting_fleet", label: "Starting Fleet" },
  { key: "commodity_values", label: "Commodity Values" },
  { key: "flagship", label: "Flagship" },
  { key: "mech", label: "Mech" },
  { key: "home_systems", label: "Home System" },
  { key: "breakthrough", label: "Breakthrough" },
];

const REQUIRED_CATEGORIES = CATEGORY_CONFIG.map((c) => c.key);

const randomIndex = (list) => Math.floor(Math.random() * list.length);

const pickRandom = (list) => {
  if (!list || list.length === 0) return null;
  return list[randomIndex(list)];
};

const resolveSet = (factionName, source) => {
  if (source === "ds") {
    return brExclusions.factions.includes(factionName) ? "br" : "ds";
  }
  if (teExclusions.factions.includes(factionName)) return "te";
  if (pokExclusions.factions.includes(factionName)) return "pok";
  return "base";
};

const cloneBuild = (build) =>
  Object.fromEntries(
    REQUIRED_CATEGORIES.map((cat) => [cat, [...(build[cat] || [])]]),
  );

const applyRandomSwaps = (build, poolsByCategory, swapCount = 0) => {
  const nextBuild = cloneBuild(build);
  const swapLog = [];

  if (!swapCount) return { build: nextBuild, swapLog };

  for (let attempt = 0; attempt < swapCount; attempt += 1) {
    const eligibleCats = REQUIRED_CATEGORIES.filter((cat) => {
      const current = nextBuild[cat] || [];
      const pool = poolsByCategory[cat] || [];
      if (!current.length || pool.length < 2) return false;
      return pool.some((candidate) => candidate.id !== current[0]?.id);
    });

    if (!eligibleCats.length) break;
    const category = pickRandom(eligibleCats);
    const current = nextBuild[category][0];
    const pool = (poolsByCategory[category] || []).filter(
      (candidate) => candidate.id !== current.id,
    );

    if (!pool.length) continue;

    const replacement = pickRandom(pool);
    nextBuild[category] = [replacement];
    swapLog.push({
      category,
      from: current,
      to: replacement,
    });
  }

  return { build: nextBuild, swapLog };
};

const flattenFactionComponents = (faction) => {
  const out = {};

  REQUIRED_CATEGORIES.forEach((category) => {
    const comps = Array.isArray(faction[category]) ? faction[category] : [];
    out[category] = comps
      .filter((component) => !isComponentUndraftable(component.name, faction.name))
      .map((component, index) => ({
        ...component,
        id: component.id || `${faction.name}-${category}-${component.name}-${index}`,
        faction: faction.name,
        factionIcon: faction.icon,
      }));
  });

  return out;
};

const buildFromFaction = (faction) => {
  const build = {};
  const factionComponents = flattenFactionComponents(faction);

  REQUIRED_CATEGORIES.forEach((category) => {
    const pick = pickRandom(factionComponents[category] || []);
    build[category] = pick ? [pick] : [];
  });

  return build;
};

const buildFromPools = (poolsByCategory) => {
  const build = {};

  REQUIRED_CATEGORIES.forEach((category) => {
    const pick = pickRandom(poolsByCategory[category] || []);
    build[category] = pick ? [pick] : [];
  });

  return build;
};

const hasRequiredSlots = (build) =>
  REQUIRED_CATEGORIES.every((category) => Array.isArray(build[category]) && build[category].length > 0);

const extractPoolsFromFactions = (factions) => {
  const pools = Object.fromEntries(REQUIRED_CATEGORIES.map((cat) => [cat, []]));

  factions.forEach((faction) => {
    const mapped = flattenFactionComponents(faction);
    REQUIRED_CATEGORIES.forEach((category) => {
      pools[category].push(...mapped[category]);
    });
  });

  return pools;
};

const ExpansionToggles = ({ enabledSets, onToggle }) => (
  <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 mb-6">
    <h3 className="text-lg font-bold text-yellow-400 mb-3">Global Set Filters</h3>
    <div className="flex flex-wrap gap-4">
      {[
        ["pok", "PoK"],
        ["ds", "DS"],
        ["te", "TE"],
        ["br", "BR"],
      ].map(([key, label]) => (
        <label key={key} className="inline-flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={enabledSets[key]}
            onChange={() => onToggle(key)}
            className="h-4 w-4"
          />
          {label}
        </label>
      ))}
    </div>
  </div>
);

const ResultBuild = ({ build, swapLog, title }) => {
  if (!build) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-600 bg-gray-900/70 p-4">
      <h5 className="text-md font-bold text-green-300 mb-3">{title}</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {CATEGORY_CONFIG.map((category) => {
          const item = build[category.key]?.[0];
          return (
            <div key={category.key} className="rounded border border-gray-700 p-2">
              <div className="text-gray-400 text-xs uppercase">{category.label}</div>
              <div className="text-white font-semibold">{item?.name || "—"}</div>
              {item?.faction && (
                <div className="text-xs text-gray-400">{item.faction}</div>
              )}
            </div>
          );
        })}
      </div>
      {swapLog?.length > 0 && (
        <div className="mt-3 text-xs text-blue-300 space-y-1">
          <div className="font-bold text-blue-200">Swap Log</div>
          {swapLog.map((entry, index) => {
            const cat = CATEGORY_CONFIG.find((c) => c.key === entry.category)?.label || entry.category;
            return (
              <div key={`${entry.category}-${index}`}>
                {cat}: {entry.from.name} → {entry.to.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function FactionRollerPage({ onNavigate }) {
  const [enabledSets, setEnabledSets] = useState({
    pok: true,
    ds: true,
    te: true,
    br: true,
  });

  const [mode1SwapCount, setMode1SwapCount] = useState(0);
  const [mode2SwapCount, setMode2SwapCount] = useState(0);
  const [mode3SwapCount, setMode3SwapCount] = useState(0);

  const [mode2Selections, setMode2Selections] = useState(
    Object.fromEntries(REQUIRED_CATEGORIES.map((cat) => [cat, []])),
  );
  const [mode3FactionSelections, setMode3FactionSelections] = useState([]);

  const [mode1Result, setMode1Result] = useState(null);
  const [mode2Result, setMode2Result] = useState(null);
  const [mode3Result, setMode3Result] = useState(null);

  const allFactions = useMemo(() => {
    const base = factionsData.factions.map((faction) => ({
      ...faction,
      source: "base",
      setTag: resolveSet(faction.name, "base"),
    }));
    const ds = discordantStarsData.factions.map((faction) => ({
      ...faction,
      source: "ds",
      setTag: resolveSet(faction.name, "ds"),
    }));
    return [...base, ...ds];
  }, []);

  const filteredFactions = useMemo(
    () =>
      allFactions.filter((faction) => {
        if (faction.setTag === "pok" && !enabledSets.pok) return false;
        if (faction.setTag === "ds" && !enabledSets.ds) return false;
        if (faction.setTag === "te" && !enabledSets.te) return false;
        if (faction.setTag === "br" && !enabledSets.br) return false;
        return true;
      }),
    [allFactions, enabledSets],
  );

  const globalPools = useMemo(
    () => extractPoolsFromFactions(filteredFactions),
    [filteredFactions],
  );

  const mode2Pools = useMemo(() => {
    const out = Object.fromEntries(REQUIRED_CATEGORIES.map((cat) => [cat, []]));

    REQUIRED_CATEGORIES.forEach((category) => {
      const selectedIds = new Set(mode2Selections[category] || []);
      out[category] = (globalPools[category] || []).filter((component) =>
        selectedIds.has(component.id),
      );
    });

    return out;
  }, [globalPools, mode2Selections]);

  const mode3Factions = useMemo(() => {
    const selected = new Set(mode3FactionSelections);
    return filteredFactions.filter((faction) => selected.has(faction.name));
  }, [filteredFactions, mode3FactionSelections]);

  const mode3Pools = useMemo(() => extractPoolsFromFactions(mode3Factions), [mode3Factions]);

  const toggleSet = (key) => {
    setEnabledSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rollMode1 = () => {
    const faction = pickRandom(filteredFactions);
    if (!faction) {
      setMode1Result({ error: "No factions match your current set filters." });
      return;
    }

    const baseBuild = buildFromFaction(faction);
    const { build, swapLog } = applyRandomSwaps(baseBuild, globalPools, mode1SwapCount);

    if (!hasRequiredSlots(build)) {
      setMode1Result({ error: "Rolled faction is missing one or more required categories." });
      return;
    }

    setMode1Result({ faction, build, swapLog });
  };

  const rollMode2 = () => {
    const baseBuild = buildFromPools(mode2Pools);

    if (!hasRequiredSlots(baseBuild)) {
      setMode2Result({ error: "Select at least one drafted component for every category." });
      return;
    }

    const { build, swapLog } = applyRandomSwaps(baseBuild, mode2Pools, mode2SwapCount);
    setMode2Result({ build, swapLog });
  };

  const rollMode3 = () => {
    if (!mode3Factions.length) {
      setMode3Result({ error: "Select at least one drafted faction." });
      return;
    }

    const baseBuild = buildFromPools(mode3Pools);

    if (!hasRequiredSlots(baseBuild)) {
      setMode3Result({ error: "Selected factions do not provide all required component categories." });
      return;
    }

    const { build, swapLog } = applyRandomSwaps(baseBuild, mode3Pools, mode3SwapCount);
    setMode3Result({ build, swapLog });
  };

  const updateMode2Selection = (category, options) => {
    const ids = Array.from(options).map((option) => option.value);
    setMode2Selections((prev) => ({ ...prev, [category]: ids }));
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={() => onNavigate?.("/")}
          className="mb-4 rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 text-sm font-semibold"
        >
          ← Back to Home
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">Faction Roller</h1>
        <p className="text-gray-300 mb-6">
          Roll random factions and Franken builds with global expansion filtering and swap support.
        </p>

        <ExpansionToggles enabledSets={enabledSets} onToggle={toggleSet} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="rounded-xl border border-blue-500/40 bg-blue-950/20 p-4">
            <h2 className="text-xl font-bold text-blue-300 mb-2">Random Faction Roller</h2>
            <p className="text-sm text-gray-300 mb-3">
              Decision paralysis with choosing a faction to play? No more! Roll for a random faction!
            </p>
            <label className="block text-sm mb-2">
              Random swaps: <span className="text-yellow-300 font-semibold">{mode1SwapCount}</span>
            </label>
            <input
              type="range"
              min="0"
              max="8"
              value={mode1SwapCount}
              onChange={(e) => setMode1SwapCount(Number(e.target.value))}
              className="w-full mb-3"
            />
            <button
              type="button"
              onClick={rollMode1}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 font-semibold"
            >
              Roll random faction
            </button>
            {mode1Result?.error && <p className="mt-3 text-sm text-red-300">{mode1Result.error}</p>}
            {mode1Result?.faction && (
              <div className="mt-3 text-sm text-gray-200">
                Base faction: <span className="font-bold text-yellow-300">{mode1Result.faction.name}</span>
              </div>
            )}
            <ResultBuild build={mode1Result?.build} swapLog={mode1Result?.swapLog} title="Rolled Build" />
          </section>

          <section className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4">
            <h2 className="text-xl font-bold text-purple-300 mb-2">Franken Roller (Drafted Components)</h2>
            <p className="text-sm text-gray-300 mb-3">
              Franken Decision paralysis? Select drafted components and roll a random faction built from them.
            </p>
            <label className="block text-sm mb-2">
              Random swaps: <span className="text-yellow-300 font-semibold">{mode2SwapCount}</span>
            </label>
            <input
              type="range"
              min="0"
              max="8"
              value={mode2SwapCount}
              onChange={(e) => setMode2SwapCount(Number(e.target.value))}
              className="w-full mb-3"
            />

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {CATEGORY_CONFIG.map((category) => (
                <div key={category.key}>
                  <label className="text-xs text-gray-300 mb-1 block">{category.label}</label>
                  <select
                    multiple
                    value={mode2Selections[category.key]}
                    onChange={(e) => updateMode2Selection(category.key, e.target.selectedOptions)}
                    className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-xs"
                    size={4}
                  >
                    {(globalPools[category.key] || []).map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.name} ({component.faction})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={rollMode2}
              className="mt-3 rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 font-semibold"
            >
              Roll franken faction
            </button>
            {mode2Result?.error && <p className="mt-3 text-sm text-red-300">{mode2Result.error}</p>}
            <ResultBuild build={mode2Result?.build} swapLog={mode2Result?.swapLog} title="Franken Result" />
          </section>

          <section className="rounded-xl border border-green-500/40 bg-green-950/20 p-4">
            <h2 className="text-xl font-bold text-green-300 mb-2">FrankenDraz Roller (Drafted Factions)</h2>
            <p className="text-sm text-gray-300 mb-3">
              Select drafted factions and roll a random faction from their draftable components.
            </p>
            <label className="block text-sm mb-2">
              Random swaps: <span className="text-yellow-300 font-semibold">{mode3SwapCount}</span>
            </label>
            <input
              type="range"
              min="0"
              max="8"
              value={mode3SwapCount}
              onChange={(e) => setMode3SwapCount(Number(e.target.value))}
              className="w-full mb-3"
            />
            <select
              multiple
              value={mode3FactionSelections}
              onChange={(e) =>
                setMode3FactionSelections(Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-sm"
              size={12}
            >
              {filteredFactions.map((faction) => (
                <option key={faction.name} value={faction.name}>
                  {faction.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={rollMode3}
              className="mt-3 rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 font-semibold"
            >
              Roll frankendraz faction
            </button>
            {mode3Result?.error && <p className="mt-3 text-sm text-red-300">{mode3Result.error}</p>}
            <ResultBuild build={mode3Result?.build} swapLog={mode3Result?.swapLog} title="FrankenDraz Result" />
          </section>
        </div>
      </div>
    </div>
  );
}