import React, { useMemo, useState } from "react";
import './UnifiedStyles.css';

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
  <div className="border rounded p-3" style={{background: '#f9fafb'}}>
    <div className="flex items-center gap-2 mb-3">
      {availableFactions.length > 0 && (
        <select
          value={selectedFaction}
          onChange={(e) => onFactionChange(e.target.value)}
          className="input input-sm"
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
        className="input input-sm"
        style={{flex: 1}}
      />

      {picksRemaining !== undefined && (
        <div className="text-sm font-medium" style={{marginLeft: '0.5rem'}}>
          Remaining: <strong>{picksRemaining}</strong> / {limitForCategory}
        </div>
      )}
    </div>

    <div className="component-grid">
      {filteredData.length === 0 && (
        <div className="empty-state" style={{gridColumn: '1 / -1'}}>No results found.</div>
      )}

      {filteredData.map(item => {
        const id = getId(item);
        const isDisabled = picksRemaining === 0;
        const isTile = !!(item.planets || item.anomalies || item.wormhole);
        const isExpanded = expandedId === id;

        return (
          <div
            key={id}
            className={`component-card ${isDisabled ? 'component-card-disabled' : ''}`}
            onClick={() => { 
              setExpandedId(isExpanded ? null : id); 
              if (!isDisabled) handleClick(item); 
            }}
            draggable={!isDisabled}
            onDragStart={(e) => handleDragStart(e, item)}
          >
            <div className="flex justify-between items-start">
              <div style={{flex: 1}}>
                <div className="component-name">{item.name}</div>
                {item.faction && <div className="component-faction">{item.faction}</div>}
                
                {item.description && (
                  <div className="component-description">
                    {isExpanded ? (
                      <div style={{whiteSpace: 'pre-line'}}>{item.description}</div>
                    ) : (
                      <div className="truncate">{item.description}</div>
                    )}
                  </div>
                )}

                {isExpanded && isTile && (
                  <div className="planet-info">
                    {item.planets?.map((p, idx) => (
                      <div key={p.name + idx} className="planet-item">
                        <div className="planet-name">{p.name}</div>
                        <div className="planet-resources">
                          <span className="planet-resource-value">Resources: {p.resource || 0}</span>
                          <span>•</span>
                          <span className="planet-influence-value">Influence: {p.influence || 0}</span>
                        </div>
                        {p.traits && p.traits.length > 0 && (
                          <div className="planet-traits">
                            Traits: {p.traits.join(", ")}
                          </div>
                        )}
                        {p.technology_specialty && p.technology_specialty.length > 0 && (
                          <div className="planet-tech">
                            Tech: {p.technology_specialty.join(", ")}
                          </div>
                        )}
                        {p.legendary_ability && (
                          <div className="planet-legendary">
                            Legendary: {p.legendary_ability}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {item.wormhole && (
                      <div className="text-xs font-medium" style={{color: '#c084fc'}}>
                        Wormhole: {item.wormhole}
                      </div>
                    )}
                    
                    {item.anomalies && item.anomalies.length > 0 && (
                      <div className="text-xs font-medium" style={{color: '#dc2626'}}>
                        Anomalies: {item.anomalies.join(", ")}
                      </div>
                    )}
                  </div>
                )}

                {!isExpanded && !isTile && item.planets?.length > 0 && (
                  <div className="text-xs mt-1" style={{color: '#6b7280'}}>
                    {item.planets.length} planet{item.planets.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="text-xs" style={{marginLeft: '0.5rem', color: '#9ca3af'}}>
                {isExpanded ? "▲" : "▼"}
              </div>
            </div>

            {isDisabled && (
              <div className="component-limit-overlay">
                <div className="component-limit-badge">
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