import React, { useState, useMemo } from "react";
import factionsJSONRaw from "../data/factions.json";
import discordantStarsJSONRaw from "../data/discordant-stars.json";
import { processFactionData, ICON_MAP } from "../utils/dataProcessor.js";

const factionsJSON = processFactionData(factionsJSONRaw);
const discordantStarsJSON = processFactionData(discordantStarsJSONRaw);

const ALL_FACTIONS = [
  ...factionsJSON.factions,
  ...(discordantStarsJSON?.factions || []),
];

const CATEGORIES = [
  { key: 'abilities',       label: 'Abilities' },
  { key: 'faction_techs',   label: 'Faction Techs' },
  { key: 'agents',          label: 'Agents' },
  { key: 'commanders',      label: 'Commanders' },
  { key: 'heroes',          label: 'Heroes' },
  { key: 'promissory',      label: 'Promissory' },
  { key: 'flagship',        label: 'Flagships' },
  { key: 'mech',            label: 'Mechs' },
  { key: 'starting_techs',  label: 'Starting Techs' },
  { key: 'starting_fleet',  label: 'Starting Fleet' },
  { key: 'commodity_values',label: 'Commodities' },
  { key: 'breakthrough',    label: 'Breakthrough' },
  { key: 'home_systems',    label: 'Home Systems' },
];

const TECH_ICONS = {
  Red: ICON_MAP.techColors.Red,
  Blue: ICON_MAP.techColors.Blue,
  Green: ICON_MAP.techColors.Green,
  Yellow: ICON_MAP.techColors.Yellow,
};

const TECH_BG = {
  Red: 'bg-red-900/30 border-red-700',
  Blue: 'bg-blue-900/30 border-blue-700',
  Green: 'bg-green-900/30 border-green-700',
  Yellow: 'bg-yellow-900/30 border-yellow-700',
};

function StatPill({ label, value }) {
  if (value === undefined || value === null) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-700/60 text-xs">
      <span className="text-yellow-400">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </span>
  );
}

function ComponentCard({ component, category, faction }) {
  const [expanded, setExpanded] = useState(false);

  const isTech     = category === 'faction_techs';
  const isUnit     = category === 'flagship' || category === 'mech';
  const isUnitLikeTech = isTech && ['cost', 'combat', 'move', 'capacity'].some(
    (statKey) => component[statKey] !== undefined && component[statKey] !== null
  );
  const showUnitStats = isUnit || isUnitLikeTech;
  const isLeader   = ['agents','commanders','heroes'].includes(category);
  const isTile     = category === 'home_systems';
  const isFleet    = category === 'starting_fleet';
  const isCommodity= category === 'commodity_values';
  const isStarting = category === 'starting_techs';

  // Commodity / starting fleet / starting tech are simple
  if (isCommodity) {
    return (
      <div className="px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700 flex items-center gap-2">
        <span className="text-yellow-400 font-bold text-lg">{component.description}</span>
        <span className="text-white-400 text-xs">commodities</span>
        <span className="ml-auto text-xs text-white-500 italic">{faction.name}</span>
      </div>
    );
  }

  if (isFleet) {
    return (
      <div className="px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700">
        <div className="flex items-center gap-1 mb-1">
          {faction.icon && <img src={faction.icon} alt="" className="w-3 h-3 opacity-60" />}
          <span className="text-xs text-white-500 italic">{faction.name}</span>
        </div>
        <p className="text-sm text-white-200">{component.description}</p>
      </div>
    );
  }

  if (isStarting) {
    return (
      <div className="px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700">
        <div className="flex items-center gap-1 mb-1">
          {faction.icon && <img src={faction.icon} alt="" className="w-3 h-3 opacity-60" />}
          <span className="text-xs text-white-500 italic">{faction.name}</span>
        </div>
        {component.note && <p className="text-xs text-white-400 italic mb-1">{component.note}</p>}
        <div className="flex flex-wrap gap-1">
          {(component.techs || []).map((tech, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-700 text-xs text-white"
            >
              {tech.tech_type && TECH_ICONS[tech.tech_type] && (
                <img src={TECH_ICONS[tech.tech_type]} alt={tech.tech_type} className="w-3 h-3" />
              )}
              {tech.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const techBg = isTech && component.tech_type ? TECH_BG[component.tech_type] || 'bg-gray-800/60 border-gray-700' : 'bg-gray-800/60 border-gray-700';
  const hasMore = component.description || component.abilities?.length || (isTile && component.planets?.length);

  return (
    <div
      className={`rounded-lg border transition-all ${techBg} ${hasMore ? 'cursor-pointer hover:border-gray-500' : ''}`}
      onClick={() => hasMore && setExpanded(e => !e)}
    >
      {/* Card Header */}
      <div className="flex items-start gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-yellow-400 text-sm">{component.name}</span>
            {/* Unit stats inline */}
            {showUnitStats && (
              <div className="flex gap-1 flex-wrap">
                <StatPill label="Cost" value={component.cost} />
                <StatPill label="Combat" value={component.combat} />
                {component.move !== undefined && <StatPill label="Move" value={component.move} />}
                {component.capacity !== undefined && <StatPill label="Cap" value={component.capacity} />}
              </div>
            )}
          </div>
          {/* Prereqs */}
          {isTech && component.prerequisite_icons?.length > 0 && (
            <div className="flex gap-1 mt-1">
              {component.prerequisite_icons.map((icon, i) => (
                <img key={i} src={icon} alt="prereq" className="w-3.5 h-3.5" />
              ))}
            </div>
          )}
        </div>
        {hasMore && (
          <span className="text-white-500 text-xs mt-0.5 flex-shrink-0">{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Expanded body */}
      {!expanded && (
        <div className="px-3 pb-3 border-t border-gray-700/50 pt-2 space-y-2">
          {/* Unit abilities list */}
          {showUnitStats && component.abilities?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {component.abilities.map((ab, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-gray-700 text-xs text-purple-400">{ab}</span>
              ))}
            </div>
          )}
          {component.description && (
            <p className="text-s text-white-300 leading-relaxed">{component.description}</p>
          )}
          {/* Home system planets */}
          {isTile && component.planets?.map((planet, i) => (
            <div key={i} className="text-xs space-y-0.5 border-t border-gray-700/40 pt-2 first:border-t-0 first:pt-0">
              <div className="font-semibold text-white">{planet.name}</div>
              <div className="flex gap-3 text-white-300">
                {planet.resource !== undefined && <span><span className="text-blue-400">R</span> {planet.resource}</span>}
                {planet.influence !== undefined && <span><span className="text-yellow-400">I</span> {planet.influence}</span>}
                {planet.trait && <span className="text-green-400">{planet.trait}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- By Faction View ----
function ByFactionView({ factions, search, activeCategories }) {
  const [collapsed, setCollapsed] = useState({});

  const toggle = (name) => setCollapsed(c => ({ ...c, [name]: !c[name] }));

  return (
    <div className="space-y-3">
      {factions.map(faction => {
        const sections = activeCategories
          .map(cat => {
            const raw = faction[cat.key];
            if (!raw || (Array.isArray(raw) && raw.length === 0)) return null;
            const items = Array.isArray(raw) ? raw : [raw];

            // Filter by search
            const filtered = items.filter(item => {
              if (!search) return true;
              const s = search.toLowerCase();
              if (typeof item === 'string' || typeof item === 'number') return String(item).toLowerCase().includes(s);
              return (
                item.name?.toLowerCase().includes(s) ||
                String(item.description ?? '').toLowerCase().includes(s)
              );
            });
            if (filtered.length === 0) return null;
            return { cat, filtered };
          })
          .filter(Boolean);

        if (sections.length === 0) return null;
        const isCollapsed = collapsed[faction.name];

        return (
          <div key={faction.name} className="rounded-xl border border-gray-700 overflow-hidden">
            {/* Faction Header */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800/80 hover:bg-gray-700/60 transition-colors text-left"
              onClick={() => toggle(faction.name)}
            >
              {faction.icon && <img src={faction.icon} alt="" className="w-7 h-7" />}
              <span className="font-bold text-white-400 text-base flex-1">{faction.name}</span>
              <span className="text-white-500 text-xs">{sections.reduce((a, s) => a + s.filtered.length, 0)} components</span>
              <span className="text-white-500 ml-2">{isCollapsed ? '▼' : '▲'}</span>
            </button>

            {isCollapsed && (
              <div className="px-4 py-3 bg-gray-900/50 space-y-4">
                {sections.map(({ cat, filtered }) => (
                  <div key={cat.key}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2 border-b border-gray-700/50 pb-1">
                      {cat.label}
                    </div>
                    <div className="space-y-1.5">
                      {filtered.map((item, i) => (
                        <ComponentCard key={i} component={item} category={cat.key} faction={faction} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- By Category View ----
function ByCategoryView({ factions, search, activeCategories }) {
  const [collapsed, setCollapsed] = useState({});
  const toggle = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  return (
    <div className="space-y-3">
      {activeCategories.map(cat => {
        const allItems = factions.flatMap(faction => {
          const raw = faction[cat.key];
          if (!raw) return [];
          const items = Array.isArray(raw) ? raw : [raw];
          return items.map(item => ({ item, faction }));
        });

        const filtered = allItems.filter(({ item }) => {
          if (!search) return true;
          const s = search.toLowerCase();
          if (typeof item === 'string' || typeof item === 'number') return String(item).toLowerCase().includes(s);
          return (
            item.name?.toLowerCase().includes(s) ||
            String(item.description ?? '').toLowerCase().includes(s)
          );
        });

        if (filtered.length === 0) return null;
        const isCollapsed = collapsed[cat.key];

        // Group by faction within category
        const byFaction = {};
        filtered.forEach(({ item, faction }) => {
          if (!byFaction[faction.name]) byFaction[faction.name] = { faction, items: [] };
          byFaction[faction.name].items.push(item);
        });

        return (
          <div key={cat.key} className="rounded-xl border border-gray-700 overflow-hidden">
            {/* Category Header */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800/80 hover:bg-gray-700/60 transition-colors text-left"
              onClick={() => toggle(cat.key)}
            >
              <span className="font-bold text-blue-400 text-base flex-1">{cat.label}</span>
              <span className="text-white-500 text-xs">{filtered.length} components</span>
              <span className="text-white-500 ml-2">{isCollapsed ? '▼' : '▲'}</span>
            </button>

            {isCollapsed && (
              <div className="px-4 py-3 bg-gray-900/50 space-y-4">
                {Object.values(byFaction).map(({ faction, items }) => (
                  <div key={faction.name}>
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-700/50 pb-1">
                      {faction.icon && <img src={faction.icon} alt="" className="w-4 h-4" />}
                      <span className="text-xs font-semibold text-white-400 uppercase tracking-wider">{faction.name}</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item, i) => (
                        <ComponentCard key={i} component={item} category={cat.key} faction={faction} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Main Export ----
export default function ComponentReference({ onNavigate }) {
  const [view, setView]             = useState('faction'); // 'faction' | 'category'
  const [search, setSearch]         = useState('');
  const [activeCategories, setActiveCategories] = useState(new Set(CATEGORIES.map(c => c.key)));

  const toggleCategory = (key) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const visibleCategories = useMemo(
    () => CATEGORIES.filter(c => activeCategories.has(c.key)),
    [activeCategories]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onNavigate('/')}
            className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
          >
            ← Home
          </button>
          <h1 className="text-xl font-bold text-yellow-400">Component Reference</h1>

          {/* View Toggle */}
          <div className="ml-auto flex rounded-lg overflow-hidden border border-gray-600">
            <button
              onClick={() => setView('faction')}
              className={`px-4 py-1.5 text-sm font-semibold transition-colors ${view === 'faction' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white-300 hover:bg-gray-700'}`}
            >
              By Faction
            </button>
            <button
              onClick={() => setView('category')}
              className={`px-4 py-1.5 text-sm font-semibold transition-colors ${view === 'category' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white-300 hover:bg-gray-700'}`}
            >
              By Category
            </button>
          </div>
        </div>

        {/* Search + Category Filters */}
        <div className="max-w-6xl mx-auto px-4 pb-3 space-y-2">
          <input
            type="search"
            placeholder="Search components, descriptions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-white focus:outline-none focus:border-yellow-500 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategories(activeCategories.size === CATEGORIES.length ? new Set() : new Set(CATEGORIES.map(c => c.key)))}
              className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white-300 border border-gray-600 transition-colors"
            >
              {activeCategories.size === CATEGORIES.length ? 'None' : 'All'}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => toggleCategory(cat.key)}
                className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors ${
                  activeCategories.has(cat.key)
                    ? 'bg-blue-700/60 border-blue-500 text-blue-200'
                    : 'bg-gray-800 border-gray-600 text-white-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {view === 'faction' ? (
          <ByFactionView factions={ALL_FACTIONS} search={search} activeCategories={visibleCategories} />
        ) : (
          <ByCategoryView factions={ALL_FACTIONS} search={search} activeCategories={visibleCategories} />
        )}
      </div>
    </div>
  );
}