import React, { useState, useEffect, useRef } from "react";
import FactionSheet from "./FactionSheet.jsx";
import factionsJSONRaw from "../data/factions.json";
import discordantStarsJSONRaw from "../data/discordant-stars.json";
import { processFactionData } from "../utils/dataProcessor.js";

// Process faction data for icons
const factionsJSON = processFactionData(factionsJSONRaw);
const discordantStarsJSON = processFactionData(discordantStarsJSONRaw);

const baseFactionLimits = {
  blue_tiles: 2, red_tiles: 1, abilities: 3, faction_techs: 2, agents: 1,
  commanders: 1, heroes: 1, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1, home_systems: 1
};

const powerFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 5, faction_techs: 4, agents: 3,
  commanders: 3, heroes: 3, promissory: 2, starting_techs: 2, starting_fleet: 2,
  commodity_values: 2, flagship: 1, mech: 1, home_systems: 1
};

export default function TheorycraftingApp({ onNavigate }) {
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
    red_tiles: [],
    home_systems: []
  });
  const [draftLimits, setDraftLimits] = useState(baseFactionLimits);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [powerMode, setPowerMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const headerRef = useRef(null);

  const categories = Object.keys(baseFactionLimits).filter(c => c !== 'blue_tiles' && c !== 'red_tiles');

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
        red_tiles: [],
        home_systems: faction.home_systems ? [...faction.home_systems] : []
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
      red_tiles: [],
      home_systems: []
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

  const exportForAsync = () => {
    const formatCategoryNameForExport = (category) => {
      const names = {
        abilities: "Faction Abilities",
        faction_techs: "Faction Technologies",
        agents: "Agents",
        commanders: "Commanders",
        heroes: "Heroes",
        promissory: "Promissory Notes",
        flagship: "Flagship",
        mech: "Mech",
        starting_techs: "Starting Technologies",
        starting_fleet: "Starting Fleet",
        commodity_values: "Commodities",
        blue_tiles: "Blue Tiles",
        red_tiles: "Red Tiles",
        home_systems: "Home System"
      };
      return names[category] || category.toUpperCase().replace(/_/g, " ");
    };

    let output = `${customFaction.name}\n`;
    output += `Mode: ${powerMode ? "Power" : "Standard"}\n`;
    output += `Created: ${new Date().toLocaleDateString()}\n`;
    output += `${"=".repeat(50)}\n\n`;

    const allCategories = Object.keys(baseFactionLimits);
    
    allCategories.forEach(category => {
      const components = customFaction[category] || [];
      if (components.length === 0) return;

      output += `${formatCategoryNameForExport(category)}:\n`;
      output += `${"-".repeat(formatCategoryNameForExport(category).length + 1)}\n`;

      components.forEach((component, idx) => {
      if (category === "starting_fleet") {
        components.forEach(entry => {
          if (entry.description) {
            output += `- ${entry.description}\n`;
          }
        });
        output += `\n`;
        return;
      }

      if (category === "starting_techs") {
        components.forEach(entry => {
          if (entry.note) {
            output += `${entry.note}\n`;
          }

          if (Array.isArray(entry.techs)) {
            entry.techs.forEach(tech => {
              output += `- ${tech.name}\n`;
            });
          } else if (entry.name) {
            output += `- ${entry.name}\n`;
        }
        output += `\n`;
        });
        return;
      }

        const num = `${idx + 1}.`.padEnd(4);
        if (component.faction) {
          output += `${num}${component.name} (${component.faction})\n`;
        } else {
          output += `${num}${component.name}\n`;
        }
      });
      
      output += `\n`;
    });

    // Create and download text file
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${customFaction.name.replace(/\s+/g, '_')}_async.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const setHeaderHeightVar = () => {
      try {
        const el = headerRef.current;
        const h = el ? Math.ceil(el.getBoundingClientRect().height) : 56;
        document.documentElement.style.setProperty('--header-height', `${h}px`);
      } catch (e) {
        document.documentElement.style.setProperty('--header-height', `56px`);
      }
    };

    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);
    return () => window.removeEventListener('resize', setHeaderHeightVar);
  }, []);

  const renderComponentCard = (component, cat, idx, isDisabled, alreadySelected) => {
    const isUnit = (cat === 'flagship' || cat === 'mech');
    const isTech = (cat === 'faction_techs' || cat === 'starting_techs');
    
    return (
      <div
        key={component.id || component.name || idx}
        className={`p-2 mb-1 rounded border cursor-pointer transition-colors text-sm ${
          isDisabled 
            ? "bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700" 
            : "bg-gray-800 hover:bg-gray-700 hover:border-blue-500 border-gray-700 text-white"
        }`}
        onClick={() => {
          if (!isDisabled) {
            handleAddComponent(cat, component);
          }
        }}
      >
        <div className="font-medium">{component.name}</div>
        
        {component.faction && (
          <div className="flex items-center gap-1 text-xs text-blue-400 mt-0.5">
            {component.icon && <img src={component.icon} alt={component.faction} className="w-4 h-4" />}
            {component.faction}
          </div>
        )}
        
        {isTech && (
          <div className="text-xs mt-2">
            {component.techs && component.techs.length > 0 ? (
              <div className="space-y-2">
                {component.choose_count && (
                  <div className="text-[11px] font-semibold text-orange-400 mb-1 pb-1 border-b border-orange-700">
                    {component.note || `Choose ${component.choose_count} of the following:`}
                  </div>
                )}
                {component.techs.map((tech, techIdx) => (
                  <div key={techIdx} className="pb-2 border-b last:border-b-0 border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-200">{tech.name}</span>
                      {tech.tech_type_icon && (
                        <img src={tech.tech_type_icon} alt={tech.tech_type} className="w-4 h-4" title={tech.tech_type} />
                      )}
                    </div>
                    {tech.description && (
                      <div className="text-gray-400 italic text-[11px]">
                        {tech.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  {component.tech_type_icon && (
                    <img src={component.tech_type_icon} alt={component.tech_type} className="w-4 h-4" title={component.tech_type} />
                  )}
                  {component.prerequisite_icons && component.prerequisite_icons.length > 0 && (
                    <div className="flex gap-1 items-center">
                      <span className="text-gray-400 text-[10px]">Req:</span>
                      {component.prerequisite_icons.map((icon, idx) => (
                        <img key={idx} src={icon} alt="Prerequisite" className="w-3 h-3" />
                      ))}
                    </div>
                  )}
                </div>
                
                {component.combat && (
                  <>
                    {component.abilities && component.abilities.length > 0 && (
                      <div className="font-semibold text-purple-400 mb-1">
                        {component.abilities.join(', ')}
                      </div>
                    )}
                    {component.description && (
                      <div className="text-gray-400 mb-1 italic line-clamp-2">
                        {component.description}
                      </div>
                    )}
                    <div className="flex gap-2 text-gray-300 font-mono text-[10px] bg-gray-900 p-1 rounded">
                      {component.cost !== undefined && <span>Cost: {component.cost}</span>}
                      <span>Combat: {component.combat}</span>
                      {component.move !== undefined && <span>Move: {component.move}</span>}
                      {component.capacity !== undefined && <span>Capacity: {component.capacity}</span>}
                    </div>
                  </>
                )}
                
                {!component.combat && component.description && (
                  <div className="text-gray-400 italic line-clamp-2">
                    {component.description}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {isUnit && component.combat && (
          <div className="text-xs mt-2">
            {component.abilities && component.abilities.length > 0 && (
              <div className="font-semibold text-purple-400 mb-1">
                {component.abilities.join(', ')}
              </div>
            )}
            {component.description && (
              <div className="text-gray-400 mb-1 italic line-clamp-2">
                {component.description}
              </div>
            )}
            
            {component.variants && component.variants.length > 0 ? (
              <div className="space-y-1">
                {component.variants.map((variant, vIdx) => (
                  <div key={vIdx} className="flex items-center gap-2 text-gray-300 font-mono text-[10px] bg-gray-900 p-1 rounded">
                    <span className="font-semibold text-blue-400">{variant.location}:</span>
                    {component.cost !== undefined && vIdx === 0 && <span>Cost: {component.cost}</span>}
                    <span>Combat: {variant.combat}</span>
                    {variant.move !== undefined && <span>Move: {variant.move}</span>}
                    {variant.capacity !== undefined && <span>Capacity: {variant.capacity}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 text-gray-300 font-mono text-[10px] bg-gray-900 p-1 rounded">
                {component.cost !== undefined && <span>Cost: {component.cost}</span>}
                <span>Combat: {component.combat}</span>
                {component.move !== undefined && <span>Move: {component.move}</span>}
                {component.capacity !== undefined && <span>Capacity: {component.capacity}</span>}
              </div>
            )}
          </div>
        )}
        
        {!isUnit && !isTech && component.description && (
          <div className="text-xs text-gray-400 line-clamp-2 mt-1">
            {component.description}
          </div>
        )}
        
        {component.planets && component.planets.length > 0 && (
          <div className="mt-1 border-t border-gray-700 pt-1">
            {component.planets.map((planet, pIdx) => (
              <div key={pIdx} className="text-xs mb-1">
                <div className="font-semibold text-green-400">{planet.name}</div>
                <div className="flex items-center gap-1 text-gray-300">
                  <span>{planet.resource}</span>
                  {planet.resource_icon && <img src={planet.resource_icon} alt="Resources" className="w-3 h-3" />}
                  <span>/</span>
                  <span>{planet.influence}</span>
                  {planet.influence_icon && <img src={planet.influence_icon} alt="Influence" className="w-3 h-3" />}
                </div>
                {planet.trait_icons && planet.trait_icons.length > 0 && (
                  <div className="flex items-center gap-1 text-purple-400">
                    <span>Traits:</span>
                    {planet.trait_icons.map((icon, tIdx) => (
                      <img key={tIdx} src={icon} alt="Trait" className="w-4 h-4" title={planet.traits?.[tIdx]} />
                    ))}
                  </div>
                )}
                {planet.legendary_icon && (
                  <div className="flex items-center gap-1 text-yellow-400 font-medium">
                    <img src={planet.legendary_icon} alt="Legendary" className="w-3 h-3" />
                    <span>Legendary</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {alreadySelected && (
          <div className="text-xs text-green-400 font-medium mt-1">
            ✓ Selected
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="h-full flex">
        {!sidebarCollapsed && (
          <div className={`sidebar ${!sidebarCollapsed ? 'open' : ''} w-80 border-r border-gray-700 bg-gray-900 flex flex-col`}>
            <div className="p-4 border-b border-gray-700 bg-gray-900/95">
              <button
                className="sidebar-close-button"
                aria-label="Close sidebar"
                onClick={() => setSidebarCollapsed(true)}
              >
                ✕
              </button>

              <h1 className="text-xl font-bold mb-2 text-yellow-400">TI4 Faction Builder</h1>

              <div className="space-y-2 mb-4">
                <select 
                  value={selectedFaction} 
                  onChange={e => setSelectedFaction(e.target.value)}
                  className="w-full border border-gray-700 p-2 rounded bg-gray-800 text-white"
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
                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-700 hover:bg-blue-500 transition-colors"
                  >
                    Load
                  </button>
                  <button 
                    onClick={handleClearFaction}
                    className="flex-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <input 
                type="text" 
                value={customFaction.name}
                onChange={e => setCustomFaction(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-700 p-2 rounded mb-4 bg-gray-800 text-white"
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
                  <span className="font-medium text-white">Power Mode Limits</span>
                </label>
                <div className="text-xs text-gray-400">
                  {powerMode ? "Higher component limits" : "Standard component limits"}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <button 
                  onClick={exportFaction}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 font-semibold transition-colors"
                >
                  Export Faction (JSON)
                </button>
                <button 
                  onClick={exportForAsync}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-semibold transition-colors"
                >
                  Export for Async
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {categories.map(cat => {
                const isExpanded = expandedCategory === cat;
                const components = getAllComponents(cat);
                const currentCount = customFaction[cat].length;
                const limit = draftLimits[cat];
                const canAdd = currentCount < limit;

                return (
                  <div key={cat} className="border-b border-gray-700">
                    <button
                      className={`w-full text-left p-3 hover:bg-gray-800 transition-colors ${
                        isExpanded ? "bg-blue-900 border-l-4 border-blue-500" : ""
                      }`}
                      onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white">{formatCategoryName(cat)}</div>
                          <div className="text-sm text-gray-400">
                            {currentCount}/{limit} selected
                          </div>
                        </div>
                        <div className="text-gray-400">
                          {isExpanded ? "▲" : "▼"}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-gray-900 border-t border-gray-700 max-h-80 overflow-y-auto">
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
                              
                              return renderComponentCard(component, cat, idx, isDisabled, alreadySelected);
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
        )}

        {!sidebarCollapsed && (
          <div
            className="sidebar-backdrop"
            role="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          <div ref={headerRef} className="app-header bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
            <div className="px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('/')}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
                  >
                    ← Home
                  </button>
                )}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
                >
                  {sidebarCollapsed ? '→ Show' : '← Hide'} Sidebar
                </button>
                <h2 className="text-xl font-bold text-yellow-400">Faction Builder</h2>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 bg-gradient-to-b from-gray-900 to-gray-800">
            <FactionSheet
              drafted={customFaction}
              onRemove={handleRemoveComponent}
              draftLimits={draftLimits}
              title={`${customFaction.name} ${powerMode ? "(Power Mode)" : "(Standard)"}`}
              hiddenCategories={["blue_tiles", "red_tiles"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}