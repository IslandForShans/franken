import React, { useMemo, useState } from "react";

export default function ComponentViewer({
  category,
  data = [],
  factions = [],
  selectedFaction = "all",
  onFactionChange = () => {},
  onComponentClick = () => {},
  playerProgress = {},
  draftLimits = {}
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const picksSoFar = (playerProgress[category] || 0);
  const limitForCategory = draftLimits[category];
  const picksRemaining = limitForCategory ? Math.max(0, limitForCategory - picksSoFar) : undefined;

  const getId = (item) => item?.id ?? item?.name ?? JSON.stringify(item);

  const filteredData = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    return data.filter(item => {
      // Handle faction filtering - some items may not have faction property
      if (selectedFaction !== "all" && item.faction && item.faction !== selectedFaction) return false;
      
      if (!q) return true;

      const matchesName = item.name?.toLowerCase().includes(q);
      const matchesDesc = item.description?.toLowerCase().includes(q);
      
      // Handle tile-specific properties
      const matchesPlanet = item.planets?.some(p => p.name?.toLowerCase().includes(q)) || false;
      const matchesTraits = item.planets?.some(p => 
        p.traits?.some(trait => trait.toLowerCase().includes(q))
      ) || false;
      const matchesAnomalies = item.anomalies?.some(anomaly => 
        anomaly.toLowerCase().includes(q)
      ) || false;
      const matchesWormhole = item.wormhole?.toLowerCase().includes(q) || false;

      return matchesName || matchesDesc || matchesPlanet || matchesTraits || matchesAnomalies || matchesWormhole;
    }).sort((a,b) => (a.name || "").localeCompare(b.name || ""));
  }, [data, selectedFaction, searchTerm]);

  const handleClick = (item) => {
    if (picksRemaining === 0) return;
    onComponentClick(category, item);
  };

  const handleDragStart = (e, item) => {
    const id = getId(item);
    e.dataTransfer.setData("application/json", JSON.stringify({ category, componentId: id }));
    e.dataTransfer.effectAllowed = "move";
  };

  const getUniqueFactionsFromData = () => {
    const factionNames = new Set();
    data.forEach(item => {
      if (item.faction) {
        factionNames.add(item.faction);
      }
    });
    return Array.from(factionNames).sort();
  };

  const availableFactions = getUniqueFactionsFromData();

  return (
    <div className="border rounded p-3 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        {availableFactions.length > 0 && (
          <select
            value={selectedFaction}
            onChange={(e) => onFactionChange(e.target.value)}
            className="border p-1 rounded text-sm"
            aria-label="Filter by faction"
          >
            <option value="all">All Factions</option>
            {availableFactions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}

        <input
          type="search"
          placeholder="Search components, planets, anomalies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border p-1 rounded text-sm"
        />

        {picksRemaining !== undefined && (
          <div className="text-sm font-medium ml-2">
            Remaining: <strong>{picksRemaining}</strong> / {limitForCategory}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[56vh] overflow-y-auto pr-2">
        {filteredData.length === 0 && (
          <div className="col-span-full text-sm text-gray-600">No results found.</div>
        )}

        {filteredData.map(item => {
          const id = getId(item);
          const isDisabled = picksRemaining === 0;
          const isTile = !!(item.planets || item.anomalies || item.wormhole);
          const isExpanded = expandedId === id;

          return (
            <div
              key={id}
              className={`component-card border rounded p-3 bg-white relative cursor-pointer ${
                isDisabled 
                  ? "opacity-60 pointer-events-none" 
                  : "hover:shadow-md hover:border-blue-300"
              }`}
              onClick={() => { 
                setExpandedId(isExpanded ? null : id); 
                if (!isDisabled) handleClick(item); 
              }}
              draggable={!isDisabled}
              onDragStart={(e) => handleDragStart(e, item)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{item.name}</div>
                  {item.faction && <div className="text-xs text-blue-600 mb-1">{item.faction}</div>}
                  
                  {item.description && (
                    <div className="mt-1 text-xs text-gray-700">
                      {isExpanded ? (
                        <div className="whitespace-pre-line">{item.description}</div>
                      ) : (
                        <div className="truncate">{item.description}</div>
                      )}
                    </div>
                  )}

                  {/* Tile details - planets, anomalies, wormholes */}
                  {isExpanded && isTile && (
                    <div className="mt-2 text-xs text-gray-700 border-t pt-2">
                      {item.planets?.map((p, idx) => (
                        <div key={p.name + idx} className="mb-2 p-1 bg-gray-50 rounded">
                          <div className="font-semibold text-xs text-green-700">{p.name}</div>
                          <div className="text-xs">
                            Resources: {p.resource || 0} • Influence: {p.influence || 0}
                          </div>
                          {p.traits && p.traits.length > 0 && (
                            <div className="text-xs text-purple-600">
                              Traits: {p.traits.join(", ")}
                            </div>
                          )}
                          {p.technology_specialty && p.technology_specialty.length > 0 && (
                            <div className="text-xs text-orange-600">
                              Tech: {p.technology_specialty.join(", ")}
                            </div>
                          )}
                          {p.legendary_ability && (
                            <div className="text-xs text-yellow-700 font-medium">
                              Legendary: {p.legendary_ability}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {item.wormhole && (
                        <div className="text-xs text-purple-700 font-medium">
                          Wormhole: {item.wormhole}
                        </div>
                      )}
                      
                      {item.anomalies && item.anomalies.length > 0 && (
                        <div className="text-xs text-red-700 font-medium">
                          Anomalies: {item.anomalies.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Non-tile components - show condensed info when not expanded */}
                  {!isExpanded && !isTile && item.planets?.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.planets.length} planet{item.planets.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div className="ml-2 text-xs text-gray-400">
                  {isExpanded ? "▲" : "▼"}
                </div>
              </div>

              {isDisabled && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <div className="text-sm font-semibold text-gray-700 bg-white px-2 py-1 rounded shadow">
                    Limit reached
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}