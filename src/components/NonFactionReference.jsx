import React, { useMemo, useState } from "react";
import { nonFactionCards } from "../data/nonFactionPacks";
import { ICON_MAP } from "../utils/dataProcessor";

const NON_FACTION_SUBTYPE_ICON_MAP = {
  biotic: ICON_MAP.techColors.Green,
  propulsion: ICON_MAP.techColors.Blue,
  cybernetic: ICON_MAP.techColors.Yellow,
  warfare: ICON_MAP.techColors.Red,
  cultural: ICON_MAP.traits.Cultural,
  hazardous: ICON_MAP.traits.Hazardous,
  industrial: ICON_MAP.traits.Industrial,
  frontier: ICON_MAP.traits.Frontier,
};

const NON_FACTION_TYPE_ICON_MAP = {
  Relic: ICON_MAP.misc?.Relic,
  "Action Card": ICON_MAP.misc?.["Action Card"],
  Agenda: ICON_MAP.misc?.Agenda,
  Explore: ICON_MAP.misc?.Explore,
  "Secret Objective": ICON_MAP.misc?.["Secret Objective"],
  "Promissory Note": ICON_MAP.misc?.["Promissory Note"],
  "Stage 1 Public Objective": ICON_MAP.misc?.["Stage 1 Public Objective"],
  "Stage 2 Public Objective": ICON_MAP.misc?.["Stage 2 Public Objective"],
};

const getSubtypeIcon = (subtype) => {
  if (!subtype) return null;
  return NON_FACTION_SUBTYPE_ICON_MAP[String(subtype).toLowerCase()] || null;
};

function NonFactionCard({ card }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg border border-gray-700 bg-gray-800/60 overflow-hidden"
      onClick={() => setExpanded((prev) => !prev)}
    >
      <div className="px-3 py-2 cursor-pointer hover:bg-gray-700/40 transition-colors">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-yellow-400 font-semibold text-sm">
            {card.name}
          </span>
          {card.amount !== undefined && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-white-300">
              x{card.amount}
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-700 text-purple-300">
            {card.source}
          </span>
          <span className="ml-auto text-white-500 text-xs">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-700/60 px-3 py-2 space-y-2">
          {card.note && (
            <p className="text-sm text-blue-400 italic mb-1">{card.note}</p>
          )}
          <p className="text-sm text-white-300 leading-relaxed">{card.text}</p>
          <div className="text-xs text-gray-400 flex gap-3 flex-wrap">
            <span>
              <span className="text-gray-500">Type:</span> {card.type}
            </span>
            <span>
              <span className="text-gray-500">Mod:</span> {card.modId}
            </span>
            {card.version && (
              <span>
                <span className="text-gray-500">Version:</span> {card.version}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NonFactionReference({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState(new Set());
  const [activeSources, setActiveSources] = useState(new Set());
  const [collapsedTypes, setCollapsedTypes] = useState(new Set());

  const toggleType = (type) => {
    setCollapsedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const typeOptions = useMemo(
    () => [...new Set(nonFactionCards.map((card) => card.type))].sort(),
    [],
  );

  const sourceOptions = useMemo(
    () => [...new Set(nonFactionCards.map((card) => card.source))].sort(),
    [],
  );

  const filteredCards = useMemo(() => {
    const s = search.trim().toLowerCase();

    return nonFactionCards.filter((card) => {
      if (activeTypes.size > 0 && !activeTypes.has(card.type)) return false;
      if (activeSources.size > 0 && !activeSources.has(card.source))
        return false;
      if (!s) return true;

      return (
        card.name.toLowerCase().includes(s) ||
        card.text.toLowerCase().includes(s) ||
        String(card.subtype || "")
          .toLowerCase()
          .includes(s)
      );
    });
  }, [search, activeTypes, activeSources]);

  const groupedByType = useMemo(() => {
    const typeMap = {};
    filteredCards.forEach((card) => {
      if (!typeMap[card.type]) typeMap[card.type] = {};
      const sub = card.subtype || "";
      if (!typeMap[card.type][sub]) typeMap[card.type][sub] = [];
      typeMap[card.type][sub].push(card);
    });
    return Object.entries(typeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, subtypeMap]) => [
        type,
        Object.entries(subtypeMap).sort(([a], [b]) => a.localeCompare(b)),
      ]);
  }, [filteredCards]);

  const toggleSetValue = (setter, value) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  return (
    <div className="h-[100dvh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onNavigate("/")}
            className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
          >
            ← Home
          </button>
          <h1 className="text-xl font-bold text-yellow-400">
            Non-Faction Card Reference
          </h1>
          <span className="ml-auto text-xs text-gray-400">
            {filteredCards.length} / {nonFactionCards.length} cards
          </span>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-3 space-y-2">
          <input
            type="search"
            placeholder="Search cards, text, subtype..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-white-600 focus:outline-none focus:border-yellow-500 text-sm"
          />
          <div className="space-y-1">
            <div className="text-xs text-gray-400">Filter by type</div>
            <div className="flex flex-wrap gap-1.5">
              {typeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleSetValue(setActiveTypes, type)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors ${
                    activeTypes.has(type)
                      ? "bg-blue-700/60 border-blue-500 text-blue-200"
                      : "bg-gray-800 border-gray-600 text-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-400">Filter by source/mod</div>
            <div className="flex flex-wrap gap-1.5">
              {sourceOptions.map((source) => (
                <button
                  key={source}
                  onClick={() => toggleSetValue(setActiveSources, source)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold border transition-colors ${
                    activeSources.has(source)
                      ? "bg-yellow-700/60 border-yellow-500 text-yellow-200"
                      : "bg-gray-800 border-gray-600 text-gray-300"
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {groupedByType.length === 0 && (
          <div className="text-sm text-gray-400">
            No cards match the current filters.
          </div>
        )}
        {groupedByType.map(([type, subtypeEntries]) => {
          const totalCount = subtypeEntries.reduce(
            (n, [, cs]) => n + cs.length,
            0,
          );
          return (
            <section
              key={type}
              className="rounded-xl border border-gray-700 overflow-hidden"
            >
              <button
                className="w-full bg-gray-800/80 px-4 py-2 border-b border-gray-700 hover:bg-gray-700/60 transition-colors text-left"
                onClick={() => toggleType(type)}
              >
                <h2 className="text-blue-400 font-semibold text-sm uppercase tracking-wide flex items-center gap-1.5">
                  {NON_FACTION_TYPE_ICON_MAP[type] && (
                    <img
                      src={NON_FACTION_TYPE_ICON_MAP[type]}
                      alt={type}
                      className="w-4 h-4"
                    />
                  )}
                  {type} ({totalCount})
                  <span className="ml-auto text-gray-500 text-xs">
                    {collapsedTypes.has(type) ? "▼" : "▲"}
                  </span>
                </h2>
              </button>
              {!collapsedTypes.has(type) && (
                <div className="p-3 bg-gray-900/50 space-y-3">
                  {subtypeEntries.map(([subtype, cards]) =>
                    subtype ? (
                      <div key={subtype}>
                        <div className="flex items-center gap-1.5 px-1 pb-1 mb-1 border-b border-gray-700/50">
                          {getSubtypeIcon(subtype) && (
                            <img
                              src={getSubtypeIcon(subtype)}
                              alt={subtype}
                              className="w-3.5 h-3.5"
                            />
                          )}
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {subtype} ({cards.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {cards.map((card) => (
                            <NonFactionCard key={card.id} card={card} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div key="__no-subtype__" className="space-y-2">
                        {cards.map((card) => (
                          <NonFactionCard key={card.id} card={card} />
                        ))}
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
