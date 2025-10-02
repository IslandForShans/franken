import React, { useState } from "react";
import FactionSheet from "./FactionSheet.jsx";
import factionsJSON from "../data/factions.json";

const baseFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 3, faction_techs: 2, agents: 1,
  commanders: 1, heroes: 1, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1
};

const powerFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 4, faction_techs: 3, agents: 2,
  commanders: 2, heroes: 2, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1
};

export default function TheorycraftingApp() {
  const [selectedFaction, setSelectedFaction] = useState("");
  const [customFaction, setCustomFaction] = useState({
    name: "Custom Faction",
    abilities: [],
    faction_techs: [],
    agents: [],
    commanders: [],
    heroes: [],
    promissory: [],
    flagship: [],
    mech: [],
    starting_techs: [],
    starting_fleet: [],
    commodity_values: [],
    blue_tiles: [],
    red_tiles: []
  });
  const [draftLimits, setDraftLimits] = useState(baseFactionLimits);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [powerMode, setPowerMode] = useState(false);

  const categories = Object.keys(baseFactionLimits);

  const getAllComponents = (category) => {
    const allComponents = [
      ...(factionsJSON.factions.flatMap(f => (f[category] || []).map(item => ({ ...item, faction: f.name })))),
      ...(factionsJSON.tiles[category] || [])
    ];
    return allComponents.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  };

  const handleAddComponent = (category, component) => {
    const currentLimit = powerMode ? powerFactionLimits[category] : baseFactionLimits[category];
    if (customFaction[category].length >= currentLimit) return;
    
    setCustomFaction(prev => ({
      ...prev,
      [category]: [...prev[category], component]
    }));
  };

  const handleRemoveComponent = (category, index) => {
    setCustomFaction(prev => {
      const updated = { ...prev };
      updated[category] = [...prev[category]];
      updated[category].splice(index, 1);
      return updated;
    });
  };

  const handleLoadFaction = (factionName) => {
    const faction = factionsJSON.factions.find(f => f.name === factionName);
    if (faction) {
      const loadedFaction = {
        name: faction.name + " (Base)",
        abilities: faction.abilities || [],
        faction_techs: faction.faction_techs || [],
        agents: faction.agents || [],
        commanders: faction.commanders || [],
        heroes: faction.heroes || [],
        promissory: faction.promissory || [],
        flagship: faction.flagship || [],
        mech: faction.mech || [],
        starting_techs: faction.starting_techs || [],
        starting_fleet: faction.starting_fleet || [],
        commodity_values: faction.commodity_values || [],
        blue_tiles: [],
        red_tiles: []
      };
      setCustomFaction(loadedFaction);
    }
  };

  const handleClearFaction = () => {
    setCustomFaction({
      name: "Custom Faction",
      abilities: [],
      faction_techs: [],
      agents: [],
      commanders: [],
      heroes: [],
      promissory: [],
      flagship: [],
      mech: [],
      starting_techs: [],
      starting_fleet: [],
      commodity_values: [],
      blue_tiles: [],
      red_tiles: []
    });
  };

  const handleTogglePowerMode = () => {
    setPowerMode(!powerMode);
    setDraftLimits(powerMode ? baseFactionLimits : powerFactionLimits);
  };

  const formatCategoryName = (category) => {
    return category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const exportFaction = () => {
    const factionData = {
      ...customFaction,
      mode: powerMode ? "power" : "standard",
      created: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(factionData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${customFaction.name.replace(/\s+/g, '_')}_faction.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="h-screen w-screen bg-gray-200">
      <div className="h-full flex bg-white rounded-lg shadow m-4">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-100 flex flex-col">
          <div className="p-4 border-b bg-gray-200">
            <h1 className="text-xl font-bold mb-4">TI4 Faction Builder</h1>
            
            <div className="space-y-2 mb-4">
              <select 
                value={selectedFaction} 
                onChange={e => setSelectedFaction(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Load Base Faction...</option>
                {factionsJSON.factions.map(f => 
                  <option key={f.name} value={f.name}>{f.name}</option>
                )}
              </select>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleLoadFaction(selectedFaction)}
                  disabled={!selectedFaction}
                  className="flex-1 px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-400"
                >
                  Load
                </button>
                <button 
                  onClick={handleClearFaction}
                  className="flex-1 px-3 py-1 bg-red-500 text-white rounded"
                >
                  Clear
                </button>
              </div>
            </div>

            <input 
              type="text" 
              value={customFaction.name}
              onChange={e => setCustomFaction(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border p-2 rounded mb-4"
              placeholder="Faction Name"
            />

            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={powerMode}
                  onChange={handleTogglePowerMode}
                  className="mr-2"
                />
                <span className="font-medium">Power Mode Limits</span>
              </label>
              <div className="text-xs text-gray-600">
                {powerMode ? "Higher component limits" : "Standard component limits"}
              </div>
            </div>

            <button 
              onClick={exportFaction}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
            >
              Export Faction
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {categories.map(cat => {
              const isExpanded = expandedCategory === cat;
              const components = getAllComponents(cat);
              const currentCount = customFaction[cat].length;
              const limit = draftLimits[cat];
              const canAdd = currentCount < limit;

              return (
                <div key={cat} className="border-b">
                  <button
                    className={`w-full text-left p-3 hover:bg-gray-200 transition-colors ${
                      isExpanded ? "bg-blue-100 border-l-4 border-blue-500" : ""
                    }`}
                    onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{formatCategoryName(cat)}</div>
                        <div className="text-sm text-gray-600">
                          {currentCount}/{limit} selected
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? "▲" : "▼"}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-white border-t max-h-80 overflow-y-auto">
                      {components.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 italic">
                          No components available
                        </div>
                      ) : (
                        <div className="p-2">
                          {components.map((component, idx) => {
                            const alreadySelected = customFaction[cat].some(
                              item => (item.id || item.name) === (component.id || component.name)
                            );
                            const isDisabled = !canAdd || alreadySelected;
                            
                            return (
                              <div
                                key={component.id || component.name || idx}
                                className={`p-2 mb-1 rounded border cursor-pointer transition-colors text-sm ${
                                  isDisabled 
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                    : "bg-gray-50 hover:bg-blue-50 hover:border-blue-300"
                                }`}
                                onClick={() => {
                                  if (!isDisabled) {
                                    handleAddComponent(cat, component);
                                  }
                                }}
                              >
                                <div className="font-medium">{component.name}</div>
                                {component.faction && (
                                  <div className="text-xs text-blue-600">{component.faction}</div>
                                )}
                                {component.description && (
                                  <div className="text-xs text-gray-600 line-clamp-2 mt-1">
                                    {component.description}
                                  </div>
                                )}
                                {alreadySelected && (
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    ✓ Selected
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <FactionSheet
            drafted={customFaction}
            onRemove={handleRemoveComponent}
            draftLimits={draftLimits}
            title={`${customFaction.name} ${powerMode ? "(Power Mode)" : "(Standard)"}`}
          />
        </div>
      </div>
    </div>
  );
}