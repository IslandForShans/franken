import React, { useState, useEffect, useRef } from "react";
import FactionSheet from "./FactionSheet.jsx";
import Sidebar from "./Sidebar.jsx";
import factionsJSONRaw from "../data/factions.json";
import discordantStarsJSONRaw from "../data/discordant-stars.json";
import { processFactionData } from "../utils/dataProcessor.js";

// Process faction data for icons
const factionsJSON = processFactionData(factionsJSONRaw);
const discordantStarsJSON = processFactionData(discordantStarsJSONRaw);

const baseFactionLimits = {
  blue_tiles: 2, red_tiles: 1, abilities: 3, faction_techs: 2, agents: 1,
  commanders: 1, heroes: 1, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1, home_systems: 1,
  breakthrough: 1
};

const powerFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 5, faction_techs: 4, agents: 3,
  commanders: 3, heroes: 3, promissory: 2, starting_techs: 2, starting_fleet: 2,
  commodity_values: 2, flagship: 1, mech: 1, home_systems: 1,
  breakthrough: 2
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
    home_systems: [],
    breakthrough: []
  });
  const [draftLimits, setDraftLimits] = useState(baseFactionLimits);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [powerMode, setPowerMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const headerRef = useRef(null);

  const categories = Object.keys(baseFactionLimits).filter(c => c !== 'blue_tiles' && c !== 'red_tiles');

  const getAllComponents = (category) => {
    const allComponents = [
      ...(factionsJSON.factions.flatMap(f =>
        (f[category] || []).map(item => {
          const isUnitUpgrade = item.tech_type === "Unit Upgrade";

          return {
            ...item,
            faction: f.name,
            factionIcon: f.icon,

            // Make unit upgrades render like units
            ...(isUnitUpgrade && {
              unit: true,
              stats: {
                cost: item.cost,
                combat: item.combat,
                abilities: item.abilities,
                description: item.description
              }
            })
          };
        })
      )),
      ...(factionsJSON.tiles[category] || [])
    ];

    return allComponents.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
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
        home_systems: faction.home_systems ? [...faction.home_systems] : [],
        breakthrough: faction.breakthrough || []
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
      home_systems: [],
      breakthrough: []
    });
  };

  const handleTogglePowerMode = () => {
    setPowerMode(!powerMode);
    setDraftLimits(powerMode ? baseFactionLimits : powerFactionLimits);
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
        home_systems: "Home System",
        breakthrough: "Breakthroughs"
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

      components.forEach((component, idx) => {
        const num = `${idx + 1}.`.padEnd(4);
        if (component.faction) {
          output += `${num}${component.name} (${component.faction})\n`;
        } else {
          output += `${num}${component.name}\n`;
        }
      });
      
      output += `\n`;
    });

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

  const exportForAsyncCommands = () => {
    const categoryCommandMap = {
      abilities: "/franken ability_add ability:",
      faction_techs: "/franken faction_tech_add tech:",
      agents: "/franken leader_add leader:",
      commanders: "/franken leader_add leader:",
      heroes: "/franken leader_add leader:",
      promissory: "/franken pn_add promissory:",
      flagship: "/franken unit_add unit:",
      mech: "/franken unit_add unit:",
      breakthrough: "/franken breakthrough_add breakthrough:"
    };

    let output = [];

    Object.keys(categoryCommandMap).forEach(category => {
      (customFaction[category] || []).forEach(component => {
        output.push(`${categoryCommandMap[category]} ${component.name}`);
      });
    });

    const blob = new Blob([output.join("\n")], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${customFaction.name.replace(/\s+/g, '_')}_async_commands.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFactionTechsForSheet = () => {
    return (customFaction.faction_techs || []).map(ft => {
      const original = factionsJSON.factions
        .flatMap(f => f.faction_techs || [])
        .find(t => t.name === ft.name);

      if (!original) return ft;

      if (original.unit_upgrades) {
        const unitStats = [
          'cost','combat', 'move', 'capacity', 'abilities', 'description'
        ].reduce((acc, key) => {
          if (original[key] !== undefined) acc[key] = original[key];
          return acc;
        }, {});

        return {
          ...ft,
          unit_upgrades: original.unit_upgrades,
          ...unitStats
        };
      }

      return ft;
    });
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

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="h-full flex">
        <div className={`sidebar ${!sidebarCollapsed ? 'open' : ''}`}>
          <div className="sidebar-header">
            <button
              className="sidebar-close-button md:hidden"
              aria-label="Close sidebar"
              onClick={() => setSidebarCollapsed(true)}
            >
              ✕
            </button>

            <h1 className="sidebar-title">TI4 Faction Builder</h1>
            <p className="sidebar-subtitle">Build custom factions</p>

            <div className="space-y-2 mb-4 mt-4">
              <select 
                value={selectedFaction} 
                onChange={e => setSelectedFaction(e.target.value)}
                className="w-full border border-gray-700 p-2 rounded bg-gray-800 text-white text-sm"
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
                  className="flex-1 px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-700 hover:bg-blue-500 transition-colors text-sm"
                >
                  Load
                </button>
                <button 
                  onClick={handleClearFaction}
                  className="flex-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            <input 
              type="text" 
              value={customFaction.name}
              onChange={e => setCustomFaction(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-700 p-2 rounded mb-4 bg-gray-800 text-white text-sm"
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
                <span className="font-medium text-white text-sm">Power Mode Limits</span>
              </label>
              <div className="text-xs text-gray-400">
                {powerMode ? "Higher component limits" : "Standard component limits"}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <button 
                onClick={exportFaction}
                className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-500 font-semibold transition-colors text-sm"
              >
                Export Faction (JSON)
              </button>

              <button 
                onClick={exportForAsync}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-semibold transition-colors text-sm"
              >
                Export as Text
              </button>

              <button 
                onClick={exportForAsyncCommands}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 font-semibold transition-colors text-sm"
              >
                Export for Async
              </button>
            </div>
          </div>

          <div className="sidebar-content">
            <Sidebar
              categories={categories}
              onSelectCategory={setExpandedCategory}
              playerProgress={Object.fromEntries(
                categories.map(cat => [cat, customFaction[cat]?.length || 0])
              )}
              draftLimits={draftLimits}
              selectedCategory={expandedCategory}
              availableComponents={(() => {
                const components = {};
                categories.forEach(cat => {
                  let all = getAllComponents(cat);

                  // Hide unit-upgrade faction techs that are "I" or "V1" (show only "II" or "V2")
if (cat === "faction_techs") {
  all = all.filter(ft => {
    const name = ft.name || "";
    // Filter out " I" but not " II"
    if (name.includes(" I") && !name.includes(" II")) {
      return false;
    }
    // Filter out " V1" but not " V2"
    if (name.includes(" V1") && !name.includes(" V2")) {
      return false;
    }
    return true;
  });
}

                  components[cat] = all;
                });

                return components;
              })()}
              onComponentClick={handleAddComponent}
              isMultiplayer={false}
              draftVariant={powerMode ? "power" : "franken"}
            />
          </div>
        </div>

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
              drafted={{
                ...customFaction,
                faction_techs: getFactionTechsForSheet()
              }}
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