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
const BASE_MODE_LIMITS = {
  abilities: 3,
  faction_techs: 2,
  agents: 1,
  commanders: 1,
  heroes: 1,
  promissory: 1,
  starting_techs: 1,
  starting_fleet: 1,
  commodity_values: 1,
  flagship: 1,
  mech: 1,
  home_systems: 1,
  breakthrough: 1,
};
const POWERED_MODE_LIMITS = {
  abilities: 4,
  faction_techs: 3,
  agents: 2,
  commanders: 2,
  heroes: 2,
  promissory: 1,
  starting_techs: 1,
  starting_fleet: 1,
  commodity_values: 1,
  flagship: 1,
  mech: 1,
  home_systems: 1,
  breakthrough: 1,
};

const randomIndex = (list) => Math.floor(Math.random() * list.length);

const pickRandom = (list) => {
  if (!list || list.length === 0) return null;
  return list[randomIndex(list)];
};
const randomSwapCount = (maxSwaps) => Math.floor(Math.random() * (maxSwaps + 1));
const normalize = (value) => String(value || "").toLowerCase().trim();
const fuzzyScore = (query, text) => {
  const q = normalize(query);
  const t = normalize(text);
  if (!q) return 1;
  if (t.includes(q)) return 100 - t.indexOf(q);

  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] === q[qi]) qi += 1;
  }
  return qi === q.length ? 10 : -1;
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
      const currentIds = new Set(current.map((item) => item.id));
      return pool.some((candidate) => !currentIds.has(candidate.id));
    });

    if (!eligibleCats.length) break;
    const category = pickRandom(eligibleCats);
    const currentItems = nextBuild[category];
    const swapIndex = randomIndex(currentItems);
    const current = currentItems[swapIndex];
    const pool = (poolsByCategory[category] || []).filter(
      (candidate) => !currentItems.some((item) => item.id === candidate.id),
    );

    if (!pool.length) continue;

    const replacement = pickRandom(pool);
    nextBuild[category][swapIndex] = replacement;
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

const buildFromPools = (poolsByCategory, limitsByCategory) => {
  const build = {};

  REQUIRED_CATEGORIES.forEach((category) => {
    const pool = [...(poolsByCategory[category] || [])];
    const limit = limitsByCategory[category] ?? 1;
    const picks = [];

    while (pool.length > 0 && picks.length < limit) {
      const idx = randomIndex(pool);
      picks.push(pool[idx]);
      pool.splice(idx, 1);
    }

    build[category] = picks;
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
              {!build[category.key]?.length && <div className="text-white font-semibold">—</div>}
              {(build[category.key] || []).map((entry) => (
                <div key={entry.id} className="mt-1">
                  <div className="text-white font-semibold">{entry?.name}</div>
                  {entry?.faction && <div className="text-xs text-gray-400">{entry.faction}</div>}
                </div>
              ))}
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

  const [mode2Selections, setMode2Selections] = useState(
    Object.fromEntries(REQUIRED_CATEGORIES.map((cat) => [cat, []])),
  );
  const [mode2Query, setMode2Query] = useState("");
  const [mode3FactionSelections, setMode3FactionSelections] = useState([]);
  const [mode3Query, setMode3Query] = useState("");

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
  const mode2ComponentCatalog = useMemo(
    () =>
      REQUIRED_CATEGORIES.flatMap((category) =>
        (globalPools[category] || []).map((component) => ({
          ...component,
          category,
          categoryLabel: CATEGORY_CONFIG.find((c) => c.key === category)?.label || category,
        })),
      ),
    [globalPools],
  );
  const mode2Matches = useMemo(
    () =>
      mode2ComponentCatalog
        .map((item) => ({
          item,
          score: fuzzyScore(mode2Query, `${item.name} ${item.faction} ${item.categoryLabel}`),
        }))
        .filter((entry) => entry.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 30)
        .map((entry) => entry.item),
    [mode2ComponentCatalog, mode2Query],
  );
  const mode3Matches = useMemo(
    () =>
      filteredFactions
        .map((faction) => ({ faction, score: fuzzyScore(mode3Query, faction.name) }))
        .filter((entry) => entry.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map((entry) => entry.faction),
    [filteredFactions, mode3Query],
  );

  const toggleSet = (key) => {
    setEnabledSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rollMode1 = () => {
    const faction = pickRandom(filteredFactions);
    if (!faction) {
      setMode1Result({ error: "No factions match your current set filters." });
      return;
    }

    setMode1Result({ faction });
  };

  const rollMode2 = () => {
    const baseBuild = buildFromPools(mode2Pools, BASE_MODE_LIMITS);

    if (!hasRequiredSlots(baseBuild)) {
      setMode2Result({ error: "Select at least one drafted component for every category." });
      return;
    }

    const swapCount = randomSwapCount(8);
    const { build, swapLog } = applyRandomSwaps(baseBuild, mode2Pools, swapCount);
    setMode2Result({ build, swapLog, swapCount });
  };

  const rollMode3 = () => {
    if (!mode3Factions.length) {
      setMode3Result({ error: "Select at least one drafted faction." });
      return;
    }

    const baseBuild = buildFromPools(mode3Pools, POWERED_MODE_LIMITS);

    if (!hasRequiredSlots(baseBuild)) {
      setMode3Result({ error: "Selected factions do not provide all required component categories." });
      return;
    }

    const swapCount = randomSwapCount(8);
    const { build, swapLog } = applyRandomSwaps(baseBuild, mode3Pools, swapCount);
    setMode3Result({ build, swapLog, swapCount });
  };

  const addMode2Component = (component) => {
    const category = component.category;
    const limit = BASE_MODE_LIMITS[category] ?? 1;
    setMode2Selections((prev) => {
      const current = prev[category] || [];
      if (current.includes(component.id) || current.length >= limit) return prev;
      return { ...prev, [category]: [...current, component.id] };
    });
  };
  const removeMode2Component = (category, id) =>
    setMode2Selections((prev) => ({ ...prev, [category]: (prev[category] || []).filter((x) => x !== id) }));
  const addMode3Faction = (factionName) =>
    setMode3FactionSelections((prev) => (prev.includes(factionName) ? prev : [...prev, factionName]));
  const removeMode3Faction = (factionName) =>
    setMode3FactionSelections((prev) => prev.filter((name) => name !== factionName));

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
          Roll random factions and Franken builds with global expansion filtering.
        </p>

        <ExpansionToggles enabledSets={enabledSets} onToggle={toggleSet} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="rounded-xl border border-blue-500/40 bg-blue-950/20 p-4">
            <h2 className="text-xl font-bold text-blue-300 mb-2">Random Faction Roller</h2>
            <p className="text-sm text-gray-300 mb-3">
              Decision paralysis with choosing a faction to play? No more! Roll for a random faction!
            </p>
            <button
              type="button"
              onClick={rollMode1}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 font-semibold"
            >
              Roll random faction
            </button>
            {mode1Result?.error && <p className="mt-3 text-sm text-red-300">{mode1Result.error}</p>}
            {mode1Result?.faction && (
              <div className="mt-3 rounded border border-blue-700 bg-blue-900/20 p-3 text-sm text-gray-200">
                <div className="font-bold text-yellow-300 text-lg">{mode1Result.faction.name}</div>
                {mode1Result.faction.icon && (
                  <img src={mode1Result.faction.icon} alt={mode1Result.faction.name} className="mt-2 w-10 h-10" />
                )}
              </div>
            )}
        </section>

          <section className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4">
            <h2 className="text-xl font-bold text-purple-300 mb-2">Franken Roller (Drafted Components)</h2>
            <p className="text-sm text-gray-300 mb-3">
              Franken Decision paralysis? Select drafted components and roll a random faction built from them.
            </p>
            <input
              type="text"
              value={mode2Query}
              onChange={(e) => setMode2Query(e.target.value)}
              placeholder="Search components or faction..."
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-sm mb-3"
            />
            <div className="max-h-[220px] overflow-y-auto rounded border border-gray-700">
              {mode2Matches.map((component) => (
                <button
                  key={`${component.category}-${component.id}`}
                  type="button"
                  onClick={() => addMode2Component(component)}
                  className="w-full text-left px-2 py-1 text-xs border-b border-gray-800 hover:bg-purple-900/30"
                >
                  {component.name} ({component.faction}) • {component.categoryLabel}
                </button>
              ))}
            </div>
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1 mt-3">
              {CATEGORY_CONFIG.map((category) => (
                <div key={category.key}>
                  <label className="text-xs text-gray-300 mb-1 block">
                    {category.label} ({(mode2Selections[category.key] || []).length}/{BASE_MODE_LIMITS[category.key]})
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {(mode2Selections[category.key] || []).map((id) => {
                      const item = (globalPools[category.key] || []).find((component) => component.id === id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => removeMode2Component(category.key, id)}
                          className="text-xs rounded bg-purple-900/50 px-2 py-1 border border-purple-700"
                        >
                          {item?.name || id} ✕
                        </button>
                      );
                    })}
                  </div>
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
            {mode2Result?.build && (
              <p className="mt-3 text-xs text-blue-200">
                Random swaps applied: {mode2Result.swapCount}
              </p>
            )}
            <ResultBuild build={mode2Result?.build} swapLog={mode2Result?.swapLog} title="Franken Result" />
          </section>

          <section className="rounded-xl border border-green-500/40 bg-green-950/20 p-4">
            <h2 className="text-xl font-bold text-green-300 mb-2">FrankenDraz Roller (Drafted Factions)</h2>
            <p className="text-sm text-gray-300 mb-3">
              Select drafted factions and roll a random faction from their draftable components.
            </p>
            <input
              type="text"
              value={mode3Query}
              onChange={(e) => setMode3Query(e.target.value)}
              placeholder="Search factions..."
              className="w-full rounded bg-gray-900 border border-gray-700 p-2 text-sm mb-3"
            />
            <div className="max-h-[220px] overflow-y-auto rounded border border-gray-700">
              {mode3Matches.map((faction) => (
                <button
                  key={faction.name}
                  type="button"
                  onClick={() => addMode3Faction(faction.name)}
                  className="w-full text-left px-2 py-1 text-sm border-b border-gray-800 hover:bg-green-900/30"
                >
                  {faction.name}
                </button>
              ))}
              </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {mode3FactionSelections.map((factionName) => (
                <button
                  key={factionName}
                  type="button"
                  onClick={() => removeMode3Faction(factionName)}
                  className="text-xs rounded bg-green-900/50 px-2 py-1 border border-green-700"
                >
                  {factionName} ✕
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={rollMode3}
              className="mt-3 rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 font-semibold"
            >
              Roll frankendraz faction
            </button>
            {mode3Result?.error && <p className="mt-3 text-sm text-red-300">{mode3Result.error}</p>}
            {mode3Result?.build && (
              <p className="mt-3 text-xs text-blue-200">
                Random swaps applied: {mode3Result.swapCount}
              </p>
            )}
            <ResultBuild build={mode3Result?.build} swapLog={mode3Result?.swapLog} title="FrankenDraz Result" />
          </section>
        </div>
      </div>
    </div>
  );
}