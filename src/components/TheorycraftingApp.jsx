import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import FactionSheet from "./FactionSheet.jsx";
import factionsJSONRaw from "../data/factions.json";
import discordantStarsJSONRaw from "../data/discordant-stars.json";
import { processFactionData, ICON_MAP } from "../utils/dataProcessor.js";

// Tech color icons mapping
const TECH_ICONS = {
  red: ICON_MAP.techColors.Red,
  blue: ICON_MAP.techColors.Blue,
  green: ICON_MAP.techColors.Green,
  yellow: ICON_MAP.techColors.Yellow
};

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

const isBlueReverieFaction = (factionName) => {
  const brFactions = [
    "Atokera Legacy",
    "Belkosea Allied States",
    "Pharad'n Order",
    "Qhet Republic",
    "Toldar Concordat",
    "Uydai Conclave"
  ];
  return brFactions.includes(factionName);
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
  const [unlimitedMode, setUnlimitedMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [dsOnlyMode, setDsOnlyMode] = useState(false);
  const [dsAddMode, setDsAddMode] = useState(false);
  const [brAddMode, setBrAddMode] = useState(false);
  const [factionFilterOpen, setFactionFilterOpen] = useState(false);
  const [visibleFactions, setVisibleFactions] = useState(new Set());
  const headerRef = useRef(null);

  // Hover preview state for component popups
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef(null);

  const supportsHover =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(hover: hover)").matches;

  // Helper to clamp popup position to viewport
  const clampToViewport = (x, y, width = 300, height = 420) => {
    const padding = 12;
    const maxX = window.innerWidth - width - padding;
    const maxY = window.innerHeight - height - padding;

    return {
      x: Math.min(Math.max(padding, x), maxX),
      y: Math.min(Math.max(padding, y), maxY)
    };
  };

  // FIXED: Explicitly list categories to ensure home_systems and breakthrough are included
  const categories = [
    'abilities', 'faction_techs', 'agents', 'commanders', 'heroes', 'promissory',
    'starting_techs', 'starting_fleet', 'commodity_values', 'flagship', 'mech',
    'home_systems', 'breakthrough'
  ];

  // Helper function for better category display names
  const getCategoryDisplayName = (category) => {
    const nameMap = {
      abilities: "Abilities",
      faction_techs: "Faction Techs",
      agents: "Agents",
      commanders: "Commanders",
      heroes: "Heroes",
      promissory: "Promissory",
      starting_techs: "Starting Techs",
      starting_fleet: "Starting Fleet",
      commodity_values: "Commodities",
      flagship: "Flagship",
      mech: "Mech",
      home_systems: "Home System",
      breakthrough: "Breakthrough"
    };
    return nameMap[category] || category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getAllComponents = (category) => {
    let baseComponents = [];
    let dsComponents = [];
    let brComponents = [];

    // Get base game components
    baseComponents = [
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

    // Get Discordant Stars components (excluding Blue Reverie)
    dsComponents = [
      ...(discordantStarsJSON.factions
        .filter(f => !isBlueReverieFaction(f.name))
        .flatMap(f =>
          (f[category] || []).map(item => {
            const isUnitUpgrade = item.tech_type === "Unit Upgrade";

            return {
              ...item,
              faction: f.name,
              factionIcon: f.icon,
              isDiscordantStars: true,

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
      ...(discordantStarsJSON.tiles[category] || []).map(item => ({
        ...item,
        isDiscordantStars: true
      }))
    ];

    // Get Blue Reverie components (from DS JSON)
    brComponents = [
      ...(discordantStarsJSON.factions
        .filter(f => isBlueReverieFaction(f.name))
        .flatMap(f =>
          (f[category] || []).map(item => {
            const isUnitUpgrade = item.tech_type === "Unit Upgrade";

            return {
              ...item,
              faction: f.name,
              factionIcon: f.icon,
              isBlueReverie: true,

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
        ))
    ];

    // Combine based on mode
    let allComponents = [];
    if (dsOnlyMode) {
      // Show ONLY DS components (not BR)
      allComponents = dsComponents;
    } else if (dsAddMode) {
      // Show base + DS components (not BR)
      allComponents = [...baseComponents, ...dsComponents];
    } else {
      // Show only base components
      allComponents = baseComponents;
    }

    // Add Blue Reverie if enabled
    if (brAddMode) {
      allComponents = [...allComponents, ...brComponents];
    }

    return allComponents.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  };

  // Filter components based on global search term
  const filterComponentsBySearch = (components, searchTerm) => {
    if (!searchTerm) return components;
    
    const q = searchTerm.toLowerCase().trim();
    
    return components.filter(item => {
      const matchesName = item.name?.toLowerCase().includes(q);
      const matchesDesc = String(item.description ?? "").toLowerCase().includes(q);
      const matchesFaction = item.faction?.toLowerCase().includes(q);
      
      // Handle tile-specific properties
      const matchesPlanet = item.planets?.some(p => p.name?.toLowerCase().includes(q)) || false;
      const matchesTraits = item.planets?.some(p => 
        p.traits?.some(trait => trait.toLowerCase().includes(q))
      ) || false;
      const matchesAnomalies = item.anomalies?.some(anomaly => 
        anomaly.toLowerCase().includes(q)
      ) || false;
      const matchesWormhole = item.wormhole?.toLowerCase().includes(q) || false;

      return matchesName || matchesDesc || matchesFaction || matchesPlanet || matchesTraits || matchesAnomalies || matchesWormhole;
    });
  };

  const handleAddComponent = (cat, item) => {
    // Skip limit check in unlimited mode
    if (!unlimitedMode) {
      const currentLimit = powerMode ? powerFactionLimits[cat] : baseFactionLimits[cat];
      if (customFaction[cat].length >= currentLimit) return;
    }
    
    setCustomFaction(prev => ({
      ...prev,
      [cat]: [...prev[cat], item]
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
    // Try to find in base factions first
    let faction = factionsJSON.factions.find(f => f.name === factionName);
    let factionSource = "Base";
    
    // If not found, try Discordant Stars
    if (!faction) {
      faction = discordantStarsJSON.factions.find(f => f.name === factionName);
      if (faction) {
        factionSource = isBlueReverieFaction(faction.name) ? "BR" : "DS";
      }
    }
    
    if (faction) {
      const loadedFaction = {
        name: faction.name + ` (${factionSource})`,
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
    // Reset unlimited mode when toggling power mode
    if (unlimitedMode) {
      setUnlimitedMode(false);
    }
  };

  const handleToggleUnlimitedMode = () => {
    setUnlimitedMode(!unlimitedMode);
    // If enabling unlimited, ensure power mode is off
    if (!unlimitedMode && powerMode) {
      setPowerMode(false);
      setDraftLimits(baseFactionLimits);
    }
  };

  const handleToggleDsOnlyMode = () => {
    const newValue = !dsOnlyMode;
    console.log('DS Only Mode toggled:', newValue, 'dsAddMode:', dsAddMode);
    setDsOnlyMode(newValue);
    
    // If enabling DS Only, disable DS Add
    if (newValue && dsAddMode) {
      console.log('Disabling DS Add Mode');
      setDsAddMode(false);
    }
  };

  const handleToggleDsAddMode = () => {
    const newValue = !dsAddMode;
    console.log('DS Add Mode toggled:', newValue, 'dsOnlyMode:', dsOnlyMode);
    setDsAddMode(newValue);
    
    // If enabling DS Add, disable DS Only
    if (newValue && dsOnlyMode) {
      console.log('Disabling DS Only Mode');
      setDsOnlyMode(false);
    }
  };

  const handleToggleBrAddMode = () => {
    const newValue = !brAddMode;
    console.log('BR Add Mode toggled:', newValue);
    setBrAddMode(newValue);
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
        breakthrough: "Breakthrough"
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
      // Search in base and DS factions (includes BR)
      const original = [
        ...factionsJSON.factions.flatMap(f => f.faction_techs || []),
        ...discordantStarsJSON.factions.flatMap(f => f.faction_techs || [])
      ].find(t => t.name === ft.name);

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

  // Get combined faction list for dropdown
  const getAllFactionsList = React.useCallback(() => {
    const baseFactions = factionsJSON.factions.map(f => ({ ...f, source: 'Base' }));
    const dsFactions = discordantStarsJSON.factions
      .filter(f => !isBlueReverieFaction(f.name))
      .map(f => ({ ...f, source: 'DS' }));
    const brFactions = discordantStarsJSON.factions
      .filter(f => isBlueReverieFaction(f.name))
      .map(f => ({ ...f, source: 'BR' }));
    
    // Apply filtering based on mode
    let filteredFactions = [];
    
    if (dsOnlyMode) {
      // DS Only mode: Show ONLY DS factions (not BR)
      filteredFactions = dsFactions;
    } else if (dsAddMode) {
      // DS Add mode: Show base + DS factions (not BR)
      filteredFactions = [...baseFactions, ...dsFactions];
    } else {
      // Default mode: Show only base factions
      filteredFactions = baseFactions;
    }
    
    // Add Blue Reverie if enabled
    if (brAddMode) {
      filteredFactions = [...filteredFactions, ...brFactions];
    }
    
    return filteredFactions.sort((a, b) => a.name.localeCompare(b.name));
  }, [dsOnlyMode, dsAddMode, brAddMode]);

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

  const toggleFactionVisibility = (name) => {
  setVisibleFactions(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    return next;
  });
};

const clearFactionFilter = () => {
  setVisibleFactions(new Set());
};

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="h-full flex">
        {!sidebarCollapsed && (
          <div className="sidebar open">
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
                {getAllFactionsList().map(f => 
                  <option key={f.name + f.source} value={f.name}>
                    {f.name} {f.source === 'DS' ? '(DS)' : f.source === 'BR' ? '(BR)' : ''}
                  </option>
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
              <label className="flex items-center cursor-pointer mb-2">
                <input 
                  type="checkbox" 
                  checked={powerMode}
                  onChange={handleTogglePowerMode}
                  className="mr-2"
                  disabled={unlimitedMode}
                />
                <span className={`font-medium text-white text-sm ${unlimitedMode ? 'text-gray-500' : ''}`}>
                  Power Mode Limits
                </span>
              </label>
              <div className="text-xs text-gray-400 mb-3">
                {powerMode ? "Higher component limits" : "Standard component limits"}
              </div>
              
              <label className="flex items-center cursor-pointer mb-2">
                <input 
                  type="checkbox" 
                  checked={unlimitedMode}
                  onChange={handleToggleUnlimitedMode}
                  className="mr-2"
                />
                <span className="font-medium text-white text-sm">Unlimited Mode</span>
              </label>
              <div className="text-xs text-gray-400 mb-3">
                {unlimitedMode ? "No component limits" : "Enable to remove all limits"}
              </div>

              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="text-sm font-semibold text-yellow-400 mb-2">Discordant Stars</div>
                
                <label className="flex items-center cursor-pointer mb-2">
                  <input 
                    type="checkbox" 
                    checked={dsOnlyMode}
                    onChange={handleToggleDsOnlyMode}
                    className="mr-2"
                  />
                  <span className="font-medium text-white text-sm">DS Only Mode</span>
                </label>
                <div className="text-xs text-gray-400 mb-3">
                  {dsOnlyMode ? "Showing only DS components" : "Show only Discordant Stars components"}
                </div>
                
                <label className="flex items-center cursor-pointer mb-2">
                  <input 
                    type="checkbox" 
                    checked={dsAddMode}
                    onChange={handleToggleDsAddMode}
                    className="mr-2"
                  />
                  <span className="font-medium text-white text-sm">Add DS Components</span>
                </label>
                <div className="text-xs text-gray-400 mb-3">
                  {dsAddMode ? "Adding DS components to base game" : "Add Discordant Stars to base game components"}
                </div>

                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={brAddMode}
                    onChange={handleToggleBrAddMode}
                    className="mr-2"
                  />
                  <span className="font-medium text-white text-sm">Add Blue Reverie (BR)</span>
                </label>
                <div className="text-xs text-gray-400">
                  {brAddMode ? "Adding Blue Reverie components" : "Add Blue Reverie components (from DS data)"}
                </div>
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

            {/* Global Search Input - At Bottom of Header */}
            <div className="border-t border-gray-700 pt-3">
              <input 
                type="search" 
                placeholder="Search all components..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="w-full border border-gray-700 p-2 rounded bg-gray-800 text-white text-sm"
              />
              {globalSearchTerm && (
                <div className="text-xs text-gray-400 mt-1">
                  Searching across all categories
                </div>
              )}
            </div>

            <button
  onClick={() => setFactionFilterOpen(true)}
  className="w-full mt-3 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
>
  Filter Factions
</button>

          </div>

          <div className="sidebar-content">
            {/* Categories List - directly rendered */}
            {(() => {
              const displayCategories = (() => {
                // If there's a global search, filter categories to only show those with results
                if (globalSearchTerm) {
                  return categories.filter(cat => {
                    let all = getAllComponents(cat);
                    
                    // Hide unit-upgrade faction techs that are "I" or "V1" (show only "II" or "V2")
                    if (cat === "faction_techs") {
                      all = all.filter(ft => {
                        const name = ft.name || "";
                        if (name.includes(" I") && !name.includes(" II")) {
                          return false;
                        }
                        if (name.includes(" V1") && !name.includes(" V2")) {
                          return false;
                        }
                        return true;
                      });
                    }
                    
                    // Filter by search term
                    const filtered = filterComponentsBySearch(all, globalSearchTerm);
                    
                    // Only include category if it has matching results
                    return filtered.length > 0;
                  });
                }
                return categories;
              })();

              const availableComponents = (() => {
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

                  // Apply global search filter
                  all = filterComponentsBySearch(all, globalSearchTerm);

                  if (visibleFactions.size > 0) {
  all = all.filter(c => !c.faction || visibleFactions.has(c.faction));
}

components[cat] = all;
                });

                return components;
              })();

              const playerProgress = Object.fromEntries(
                categories.map(cat => [cat, customFaction[cat]?.length || 0])
              );

              return displayCategories.map(cat => {
                const progress = playerProgress[cat] || 0;
                const limit = draftLimits[cat] || 0;
                const isExpanded = expandedCategory === cat;
                const components = availableComponents[cat] || [];
                const canPick = unlimitedMode || progress < limit;

                return (
                  <div key={cat} className="sidebar-category">
                    <button
                      className={`sidebar-category-button ${
                        isExpanded ? "sidebar-category-button-expanded" : ""
                      }`}
                      onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {getCategoryDisplayName(cat)}
                          </div>
                          {!unlimitedMode && (
                            <div className="text-sm">
                              {progress}/{limit} selected
                            </div>
                          )}
                          {unlimitedMode && (
                            <div className="text-sm">
                              {progress} selected
                            </div>
                          )}
                        </div>
                        <div>{isExpanded ? "▲" : "▼"}</div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="sidebar-category-content">
                        <div className="p-2">
                          {components.map((component, idx) => {
                            const isDisabled = !canPick;
                            
                            return (
                              <div
                                key={component.id || component.name || idx}
                                className={`sidebar-component-item ${
                                  isDisabled ? "sidebar-component-item-disabled" : ""
                                }`}
                                onClick={() => !isDisabled && handleAddComponent(cat, component)}
                                onMouseEnter={(e) => {
                                  if (!supportsHover) return;

                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const pos = clampToViewport(rect.right + 12, rect.top);

                                  hoverTimeoutRef.current = setTimeout(() => {
                                    setHoverPosition(pos);
                                    setHoveredComponent({ component, category: cat });
                                  }, 150);
                                }}
                                onMouseLeave={() => {
                                  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                  setHoveredComponent(null);
                                }}
                              >
                                <div className="flex items-center gap-2 font-medium">
                                  {/* Faction Icon */}
                                  {component.factionIcon && (
                                    <img
                                      src={component.factionIcon}
                                      alt={component.faction}
                                      className="w-5 h-5 rounded-full"
                                    />
                                  )}
                                  
                                  <span>{component.name}</span>

                                  {/* Tile Planet Trait + Tech Specialty Icons */}
                                  {(cat === "red_tiles" || cat === "blue_tiles" || cat === "home_systems") &&
                                    Array.isArray(component.planets) &&
                                    component.planets.flatMap((planet, pIdx) => {
                                      const traitIcons = Array.isArray(planet.trait_icons)
                                        ? planet.trait_icons.map((icon, iIdx) => (
                                            <img
                                              key={`trait-${pIdx}-${iIdx}`}
                                              src={icon}
                                              alt="planet trait"
                                              title="Planet Trait"
                                              className="w-4 h-4"
                                            />
                                          ))
                                        : [];

                                      const techIcons = Array.isArray(planet.tech_specialty_icons)
                                        ? planet.tech_specialty_icons.map((icon, iIdx) => (
                                            <img
                                              key={`tech-${pIdx}-${iIdx}`}
                                              src={icon}
                                              alt="tech specialty"
                                              title="Tech Specialty"
                                              className="w-4 h-4"
                                            />
                                          ))
                                        : [];

                                      return [...traitIcons, ...techIcons];
                                    })}

                                  {/* Tile Wormhole Icon */}
                                  {(cat === "red_tiles" || cat === "blue_tiles" || cat === "home_systems") &&
                                    component.wormhole_icon && (
                                      <img
                                        src={component.wormhole_icon}
                                        alt="wormhole"
                                        title="Wormhole"
                                        className="w-4 h-4"
                                      />
                                  )}

                                  {/* Tile Anomaly Icons */}
                                  {(cat === "red_tiles" || cat === "blue_tiles") &&
                                    Array.isArray(component.anomaly_icons) &&
                                    component.anomaly_icons.map((icon, i) => (
                                      <img
                                        key={`anomaly-${i}`}
                                        src={icon}
                                        alt="anomaly"
                                        title="Anomaly"
                                        className="w-4 h-4"
                                      />
                                    ))}

                                  {/* Faction Tech Prerequisite Icons */}
                                  {cat === "faction_techs" &&
                                    Array.isArray(component.prerequisites) &&
                                    component.prerequisites.map((p, i) => {
                                      const techKey = p.toLowerCase();
                                      const icon = TECH_ICONS[techKey];
                                      if (!icon) return null;
                                      return (
                                        <img
                                          key={i}
                                          src={icon}
                                          alt={`${p} prerequisite`}
                                          title={`${p} prerequisite`}
                                          className="w-4 h-4"
                                        />
                                      );
                                    })}

                                  {/* Breakthrough Synergy Icons */}
                                  {cat === "breakthrough" &&
                                    Array.isArray(component.synergy) &&
                                    component.synergy.map((syn, i) => {
                                      const primaryKey = syn.primary?.toLowerCase();
                                      const secondaryKey = syn.secondary?.toLowerCase();
                                      const primaryIcon = TECH_ICONS[primaryKey];
                                      const secondaryIcon = TECH_ICONS[secondaryKey];
                                      
                                      if (!primaryIcon || !secondaryIcon) return null;

                                      return (
                                        <div key={i} className="flex items-center gap-1">
                                          <img
                                            src={primaryIcon}
                                            alt={`${syn.primary} tech`}
                                            title={`${syn.primary} tech`}
                                            className="w-4 h-4"
                                          />
                                          <img
                                            src="./icons/synergy-symbol.png"
                                            alt="synergy"
                                            title="synergy"
                                            className="w-3 h-3"
                                          />
                                          <img
                                            src={secondaryIcon}
                                            alt={`${syn.secondary} tech`}
                                            title={`${syn.secondary} tech`}
                                            className="w-4 h-4"
                                          />
                                        </div>
                                      );
                                    })}

                                  {/* Discordant Stars Badge */}
                                  {component.isDiscordantStars && (
                                    <span className="text-xs px-1.5 py-0.5 bg-yellow-600 text-white rounded">DS</span>
                                  )}

                                  {/* Blue Reverie Badge */}
                                  {component.isBlueReverie && (
                                    <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded">BR</span>
                                  )}
                                </div>
                                {isDisabled && !unlimitedMode && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Limit reached
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {components.length === 0 && (
                            <div className="text-xs text-gray-400 p-2">
                              No components found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
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
              drafted={{
                ...customFaction,
                faction_techs: getFactionTechsForSheet()
              }}
              onRemove={handleRemoveComponent}
              draftLimits={unlimitedMode ? {} : draftLimits}
              title={`${customFaction.name} ${unlimitedMode ? "(Unlimited)" : powerMode ? "(Power Mode)" : "(Standard)"}${dsOnlyMode ? " - DS Only" : dsAddMode ? " + DS" : ""}${brAddMode ? " + BR" : ""}`}
              hiddenCategories={["blue_tiles", "red_tiles"]}
            />
          </div>
        </div>
      </div>

      {factionFilterOpen && createPortal(
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999]">
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-[400px] max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold text-yellow-400 mb-3">Show Factions</h2>

      <div className="space-y-2">
        {getAllFactionsList().map(f => {
          const isActive = visibleFactions.has(f.name);
          return (
            <label key={f.name + f.source} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => toggleFactionVisibility(f.name)}
              />
              <span className="text-white">
                {f.name} {f.source === "DS" ? "(DS)" : f.source === "BR" ? "(BR)" : ""}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={clearFactionFilter}
          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
        >
          Clear Filter
        </button>
        <button
          onClick={() => setFactionFilterOpen(false)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
        >
          Done
        </button>
      </div>
    </div>
  </div>,
  document.body
)}


      {/* Hover Preview Popup */}
      {hoveredComponent && supportsHover &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: hoverPosition.y,
              left: hoverPosition.x,
              width: "300px",
              maxHeight: "500px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              background: "#0b1220",
              border: "1px solid var(--border-color)",
              borderRadius: "0.75rem",
              padding: "1rem",
              boxShadow: "0 30px 70px rgba(0,0,0,0.85)",
              zIndex: 100000,
              pointerEvents: "none"
            }}
          >
            <div
              className="font-bold mb-2 uppercase"
              style={{
                color: "var(--accent-yellow)",
                fontSize: "1.1rem",
                letterSpacing: "0.05em"
              }}
            >
              {hoveredComponent.component.name}
            </div>

            {hoveredComponent.component.faction && (
              <div
                className="text-sm mb-2"
                style={{ color: "var(--accent-blue)" }}
              >
                {hoveredComponent.component.faction}
              </div>
            )}

            {/* Tech Color with Synergies */}
            {hoveredComponent.category === 'faction_techs' && hoveredComponent.component.tech_type && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {hoveredComponent.component.tech_type}
                </span>
                {hoveredComponent.component.prerequisites && hoveredComponent.component.prerequisites.length > 0 && (
                  <div className="flex items-center gap-1">
                    {hoveredComponent.component.prerequisites.map((prereq, i) => {
                      const techKey = prereq.toLowerCase();
                      const icon = TECH_ICONS[techKey];
                      if (!icon) return null;
                      return (
                        <img
                          key={i}
                          src={icon}
                          alt={`${prereq} prerequisite`}
                          className="w-5 h-5"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Synergies for faction techs */}
            {hoveredComponent.category === 'faction_techs' &&
              Array.isArray(hoveredComponent.component.synergies) &&
              hoveredComponent.component.synergies.map((syn, i) => {
                const primaryKey = syn.primary?.toLowerCase();
                const secondaryKey = syn.secondary?.toLowerCase();
                const primaryIcon = TECH_ICONS[primaryKey];
                const secondaryIcon = TECH_ICONS[secondaryKey];
                
                if (!primaryIcon || !secondaryIcon) return null;

                return (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Synergy:</span>
                    <img
                      src={primaryIcon}
                      alt={`${syn.primary} tech`}
                      className="w-5 h-5"
                    />
                    <img
                      src="./icons/synergy-symbol.png"
                      alt="synergy"
                      className="w-4 h-4"
                    />
                    <img
                      src={secondaryIcon}
                      alt={`${syn.secondary} tech`}
                      className="w-5 h-5"
                    />
                  </div>
                );
              })}

            {/* Breakthrough Synergy Icons in Preview */}
            {hoveredComponent.category === 'breakthrough' &&
              Array.isArray(hoveredComponent.component.synergy) &&
              hoveredComponent.component.synergy.map((syn, i) => {
                const primaryKey = syn.primary?.toLowerCase();
                const secondaryKey = syn.secondary?.toLowerCase();
                const primaryIcon = TECH_ICONS[primaryKey];
                const secondaryIcon = TECH_ICONS[secondaryKey];
                
                if (!primaryIcon || !secondaryIcon) return null;

                return (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Synergy:</span>
                    <img
                      src={primaryIcon}
                      alt={`${syn.primary} tech`}
                      className="w-5 h-5"
                    />
                    <img
                      src="./icons/synergy-symbol.png"
                      alt="synergy"
                      className="w-4 h-4"
                    />
                    <img
                      src={secondaryIcon}
                      alt={`${syn.secondary} tech`}
                      className="w-5 h-5"
                    />
                  </div>
                );
              })}

            {/* Starting Techs - Special handling */}
            {hoveredComponent.category === 'starting_techs' && (
              <div className="text-sm mb-3">
                {hoveredComponent.component.note && (
                  <div className="font-semibold mb-2" style={{ color: "var(--accent-yellow)" }}>
                    {hoveredComponent.component.note}
                  </div>
                )}
                {Array.isArray(hoveredComponent.component.techs) && (
                  <ul className="space-y-1">
                    {hoveredComponent.component.techs.map((t, i) => {
                      const techColorMap = {
                        'Blue': '#60a5fa',
                        'Red': '#f87171',
                        'Green': '#34d399',
                        'Yellow': '#fcd34d'
                      };
                      const techColor = techColorMap[t.tech_type] || '#ffffff';
                      
                      return (
                        <li key={i} style={{ color: techColor }}>
                          • {typeof t === "string" ? t : t.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Regular techs array for other categories */}
            {hoveredComponent.category !== 'starting_techs' && Array.isArray(hoveredComponent.component.techs) && (
              <div className="text-sm mb-3">
                <strong>Techs:</strong>
                <ul className="list-disc list-inside">
                  {hoveredComponent.component.techs.map((t, i) => (
                    <li key={i}>
                      {typeof t === "string"
                        ? t
                        : `${t.name}${
                            t.tech_type ? ` (${t.tech_type})` : ""
                          }`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hoveredComponent.component.description && hoveredComponent.category !== 'starting_techs' && (
              <div
                className="text-sm italic mb-3"
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: 1.4
                }}
              >
                {hoveredComponent.component.description}
              </div>
            )}

            {/* Unit Stats for Flagship, Mech, and Starting Fleet */}
            {(
              hoveredComponent.component.combat !== undefined ||
              hoveredComponent.component.move !== undefined ||
              hoveredComponent.component.capacity !== undefined ||
              hoveredComponent.component.cost !== undefined ||
              (Array.isArray(hoveredComponent.component.abilities) &&
                hoveredComponent.component.abilities.length > 0)
            ) && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {hoveredComponent.component.cost !== undefined && (
                    <div>
                      <span className="font-semibold text-yellow-400">Cost:</span>{' '}
                      <span className="text-white">{hoveredComponent.component.cost}</span>
                    </div>
                  )}
                  {hoveredComponent.component.combat !== undefined && (
                    <div>
                      <span className="font-semibold text-red-400">Combat:</span>{' '}
                      <span className="text-white">{hoveredComponent.component.combat}</span>
                    </div>
                  )}
                  {hoveredComponent.component.move !== undefined && (
                    <div>
                      <span className="font-semibold text-blue-400">Move:</span>{' '}
                      <span className="text-white">{hoveredComponent.component.move}</span>
                    </div>
                  )}
                  {hoveredComponent.component.capacity !== undefined && (
                    <div>
                      <span className="font-semibold text-green-400">Capacity:</span>{' '}
                      <span className="text-white">{hoveredComponent.component.capacity}</span>
                    </div>
                  )}
                </div>
                {hoveredComponent.component.abilities && hoveredComponent.component.abilities.length > 0 && (
                  <div className="mt-2">
                    <span className="font-semibold text-purple-400">Abilities:</span>{' '}
                    <span className="text-white text-sm">{hoveredComponent.component.abilities.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tile/Home System Info - Planets */}
            {(hoveredComponent.category === 'blue_tiles' || 
              hoveredComponent.category === 'red_tiles' || 
              hoveredComponent.category === 'home_systems') && 
              hoveredComponent.component.planets && 
              hoveredComponent.component.planets.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="font-semibold mb-2 text-sm" style={{ color: "var(--accent-green)" }}>
                  Planets:
                </div>
                {hoveredComponent.component.planets.map((planet, idx) => (
                  <div key={idx} className="mb-3 pb-3 border-b border-gray-700 last:border-b-0">
                    <div className="font-semibold text-sm mb-1" style={{ color: "#6ee7b7" }}>
                      {planet.name}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-1">
                      <div>
                        <span className="font-semibold text-yellow-400">Resources:</span>{' '}
                        <span className="text-white">{planet.resource || 0}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-400">Influence:</span>{' '}
                        <span className="text-white">{planet.influence || 0}</span>
                      </div>
                    </div>
                    {planet.traits && planet.traits.length > 0 && (
                      <div className="text-xs mb-1">
                        <span className="font-semibold text-purple-400">Traits:</span>{' '}
                        <span className="text-white">{planet.traits.join(', ')}</span>
                      </div>
                    )}
                    {planet.technology_specialty && planet.technology_specialty.length > 0 && (
                      <div className="text-xs mb-1">
                        <span className="font-semibold text-orange-400">Tech:</span>{' '}
                        <span className="text-white">{planet.technology_specialty.join(', ')}</span>
                      </div>
                    )}
                    {planet.legendary_ability && (
                      <div className="text-xs mt-2 p-2 rounded" style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.3)" }}>
                        <span className="font-semibold" style={{ color: "var(--accent-yellow)" }}>Legendary:</span>{' '}
                        <span className="text-white italic">{planet.legendary_ability}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Wormhole and Anomalies for tiles */}
            {(hoveredComponent.category === 'blue_tiles' || hoveredComponent.category === 'red_tiles') && (
              <>
                {hoveredComponent.component.wormhole && (
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-purple-400">Wormhole:</span>{' '}
                    <span className="text-white">{hoveredComponent.component.wormhole}</span>
                  </div>
                )}
                {hoveredComponent.component.anomalies && hoveredComponent.component.anomalies.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-red-400">Anomalies:</span>{' '}
                    <span className="text-white">{hoveredComponent.component.anomalies.join(', ')}</span>
                  </div>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}