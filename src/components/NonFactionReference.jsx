import React, { useMemo, useState } from "react";
import { nonFactionCards } from "../data/nonFactionPacks";

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
          {card.subtype && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-700 text-blue-300">
              {card.subtype}
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
    const groups = {};
    filteredCards.forEach((card) => {
      if (!groups[card.type]) groups[card.type] = [];
      groups[card.type].push(card);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
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
        {groupedByType.map(([type, cards]) => (
          <section
            key={type}
            className="rounded-xl border border-gray-700 overflow-hidden"
          >
            <div className="bg-gray-800/80 px-4 py-2 border-b border-gray-700">
              <h2 className="text-blue-400 font-semibold text-sm uppercase tracking-wide">
                {type} ({cards.length})
              </h2>
            </div>
            <div className="p-3 bg-gray-900/50 space-y-2">
              {cards.map((card) => (
                <NonFactionCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
