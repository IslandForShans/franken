import React, { useState } from "react";
import factionsJSONRaw from "../data/factions.json";
import discordantStarsJSONRaw from "../data/discordant-stars.json";
import { ICON_MAP, processFactionData } from "../utils/dataProcessor.js";
import { isComponentUndraftable } from "../data/undraftable-components.js";
import './UnifiedStyles.css';

const factionsJSON = processFactionData(factionsJSONRaw);
const discordantStarsJSON = processFactionData(discordantStarsJSONRaw);

const TECH_ICONS = {
  red: ICON_MAP.techColors.Red,
  blue: ICON_MAP.techColors.Blue,
  green: ICON_MAP.techColors.Green,
  yellow: ICON_MAP.techColors.Yellow
};

export default function FrankenDrazBuilder({
  playerIndex,
  draftedItems,
  builtFaction,
  onAddComponent,
  onRemoveComponent,
  factionLimits,
  expansionsEnabled = {},
  activeCategories = [],
  bannedComponents = new Set()
}) {
  const [selectedCategory, setSelectedCategory] = useState('abilities');
  const [expandedFaction, setExpandedFaction] = useState(null);

  // Only show categories that are active in this draft
  const categories = [
    'abilities', 'faction_techs', 'agents', 'commanders', 'heroes', 'promissory',
    'starting_techs', 'starting_fleet', 'commodity_values', 'flagship', 'mech',
    'home_systems', 'breakthrough'
  ].filter(cat => activeCategories.includes(cat));

  const formatCategoryName = (category) =>
    category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Get all components available from drafted factions for a category
  const getAvailableComponents = (category) => {
    const components = [];
    const draftedFactions = draftedItems.factions || [];

    draftedFactions.forEach(draftedFaction => {
      let fullFaction = factionsJSON.factions.find(f => f.name === draftedFaction.name);
      if (!fullFaction && discordantStarsJSON?.factions) {
        fullFaction = discordantStarsJSON.factions.find(f => f.name === draftedFaction.name);
      }

      if (fullFaction && fullFaction[category]) {
        fullFaction[category].forEach(comp => {
          if (
            !isComponentUndraftable(comp.name, fullFaction.name) &&
            !bannedComponents.has(comp.id || comp.name)
          ) {
            components.push({
              ...comp,
              faction: fullFaction.name,
              factionIcon: fullFaction.icon,
              icon: fullFaction.icon
            });
          }
        });
      }
    });

    return components;
  };

  // Check if component is already in the built faction
  const isComponentAdded = (componentName, factionName) => {
    return categories.some(cat => {
      const items = builtFaction[cat] || [];
      return items.some(item => item.name === componentName && item.faction === factionName);
    });
  };

  // Get current count for a category
  const getCategoryCount = (category) => {
    return (builtFaction[category] || []).length;
  };

  // Check if category is at limit
  const isCategoryAtLimit = (category) => {
    const count = getCategoryCount(category);
    const limit = factionLimits[category];
    return count >= limit;
  };

  // Render a component card
  const renderComponentCard = (component, category) => {
    const isAdded = isComponentAdded(component.name, component.faction);
    const atLimit = isCategoryAtLimit(category);
    const canAdd = !isAdded && !atLimit;

    const isUnit = ['flagship', 'mech', 'starting_fleet'].includes(category);
    const isTech = ['faction_techs', 'starting_techs'].includes(category);
    const isTile = ['blue_tiles', 'red_tiles', 'home_systems'].includes(category);
    const isBreakthrough = category === 'breakthrough';
    const typeIcon = component.tech_type ? TECH_ICONS[component.tech_type.toLowerCase()] : null;

    return (
      <div
        key={`${component.name}-${component.faction}`}
        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
          isAdded
            ? 'bg-green-900/30 border-green-600'
            : canAdd
            ? 'bg-gray-800/50 border-gray-600 hover:border-blue-500 hover:bg-blue-900/20'
            : 'bg-gray-900/50 border-gray-700 opacity-50 cursor-not-allowed'
        }`}
        onClick={() => canAdd && onAddComponent(category, component)}
      >
        {/* Header */}
        <div className="flex items-start gap-2">
          {(component.icon || component.factionIcon) && (
            <img src={component.icon || component.factionIcon} alt={component.faction} className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-yellow-400 text-sm uppercase">{component.name}</div>
              {isAdded && <span className="text-green-400 text-xs font-semibold flex-shrink-0">✓ ADDED</span>}
            </div>
            <div className="text-xs text-gray-400 mb-1">{component.faction}</div>

            {/* Unit stats */}
            {isUnit && component.combat && (
              <div className="text-xs flex gap-2 mt-1" style={{ color: '#fff' }}>
                {component.cost !== undefined && <span className="font-semibold">Cost: {component.cost}</span>}
                <span className="font-semibold">Combat: {component.combat}</span>
                {component.move !== undefined && <span className="font-semibold">Move: {component.move}</span>}
                {component.capacity !== undefined && <span className="font-semibold">Capacity: {component.capacity}</span>}
              </div>
            )}

            {/* Unit abilities */}
            {isUnit && component.abilities && component.abilities.length > 0 && (
              <div className="text-xs mt-1" style={{ color: '#c084fc' }}>
                <span className="font-semibold">Abilities:</span> {component.abilities.join(', ')}
              </div>
            )}

            {/* Tech type & prerequisites */}
            {isTech && component.tech_type && (
              <div className="text-xs mt-1" style={{ color: '#93c5fd' }}>
                <span className="font-semibold">Type:</span>
                {typeIcon ? (
                  <img
                    src={typeIcon}
                    alt={`${component.tech_type} tech`}
                    title={`${component.tech_type} tech`}
                    className="inline-block w-4 h-4 ml-1 align-middle"
                  />
                ) : (
                  <span className="ml-1">{component.tech_type}</span>
                )}
                {component.prerequisites && component.prerequisites.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="font-semibold">Prereqs:</span>
                    {component.prerequisites.map((prereq, idx) => {
                      const prereqName = typeof prereq === 'string' ? prereq : prereq.tech_type || prereq.color || '';
                      const prereqIcon = TECH_ICONS[prereqName.toLowerCase()];
                      if (!prereqIcon) {
                        return <span key={idx}>{prereqName}</span>;
                      }
                      return (
                        <img
                          key={idx}
                          src={prereqIcon}
                          alt={`${prereqName} prerequisite`}
                          title={`${prereqName} prerequisite`}
                          className="w-4 h-4"
                        />
                      );
                    })}
                  </span>
                )}
              </div>
            )}

            {/* Leaders note */}
            {(category === 'commanders' || category === 'heroes') && component.note && (
              <div className="text-xs mt-1 font-semibold" style={{ color: '#fbbf24' }}>
                {component.note}
              </div>
            )}

            {/* Starting techs package */}
            {category === 'starting_techs' && (
              <div className="text-xs mt-1">
                {component.note && (
                  <div className="font-semibold mb-1" style={{ color: '#fbbf24' }}>{component.note}</div>
                )}
                {Array.isArray(component.techs) && component.techs.map((t, i) => {
                  const techColorMap = { Blue: '#60a5fa', Red: '#f87171', Green: '#34d399', Yellow: '#fcd34d' };
                  const color = techColorMap[t.tech_type] || '#fff';
                  return (
                    <div key={i} style={{ color, marginBottom: '0.15rem' }}>
                      • {typeof t === 'string' ? t : t.name}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Breakthrough synergy */}
            {isBreakthrough && component.synergy && component.synergy.length > 0 && (
              <div className="text-xs mt-1" style={{ color: '#fbbf24' }}>
                <span className="font-semibold">Synergy:</span>
                <span className="ml-1 inline-flex flex-wrap items-center gap-2">
                  {component.synergy.map((s, idx) => {
                    const primaryIcon = TECH_ICONS[s.primary?.toLowerCase()];
                    const secondaryIcon = TECH_ICONS[s.secondary?.toLowerCase()];

                    if (!primaryIcon || !secondaryIcon) {
                      return <span key={idx}>{`${s.primary}/${s.secondary}`}</span>;
                    }

                    return (
                      <span key={idx} className="inline-flex items-center gap-1">
                        <img src={primaryIcon} alt={`${s.primary} tech`} title={`${s.primary} tech`} className="w-4 h-4" />
                        <img src="./icons/synergy-symbol.png" alt="synergy" title="synergy" className="w-3 h-3" />
                        <img src={secondaryIcon} alt={`${s.secondary} tech`} title={`${s.secondary} tech`} className="w-4 h-4" />
                      </span>
                    );
                  })}
                </span>
              </div>
            )}

            {/* Tile planets */}
            {isTile && component.planets && component.planets.length > 0 && (
              <div className="text-xs mt-1" style={{ color: '#6ee7b7' }}>
                <span className="font-semibold">{component.planets.length} Planet{component.planets.length !== 1 ? 's' : ''}:</span>
                {component.planets.map((p, idx) => (
                  <div key={idx} style={{ marginLeft: '0.5rem', marginTop: '0.15rem' }}>
                    <span className="font-semibold text-white">{p.name}</span>
                    {' '}
                    <span style={{ color: '#fcd34d' }}>R: {p.resource || p.resources || 0}</span>
                    {' '}
                    <span style={{ color: '#93c5fd' }}>I: {p.influence || 0}</span>
                    {p.traits && p.traits.length > 0 && (
                      <span style={{ color: '#c084fc' }}> • {p.traits.join(', ')}</span>
                    )}
                    {p.technology_specialty && p.technology_specialty.length > 0 && (
                      <span style={{ color: '#fb923c' }}> • Tech: {p.technology_specialty.join(', ')}</span>
                    )}
                    {p.legendary_ability && (
                      <div style={{ color: '#fcd34d', fontStyle: 'italic' }}>Legendary: {p.legendary_ability}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tile wormhole & anomalies */}
            {isTile && component.wormhole && (
              <div className="text-xs mt-1" style={{ color: '#c084fc' }}>
                <span className="font-semibold">Wormhole:</span> {component.wormhole}
              </div>
            )}
            {isTile && component.anomalies && component.anomalies.length > 0 && (
              <div className="text-xs mt-1" style={{ color: '#ef4444' }}>
                <span className="font-semibold">Anomalies:</span> {component.anomalies.join(', ')}
              </div>
            )}

            {/* Description — always for non-units, hidden for units (too long) */}
            {component.description && (
              <div className="text-xs text-gray-300 mt-1 italic">{component.description}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render built faction component
  const renderBuiltComponent = (component, category, index) => {
    return (
      <div
        key={`built-${category}-${index}`}
        className="p-2 rounded bg-blue-900/30 border border-blue-600 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {component.icon && (
            <img src={component.icon} alt={component.faction} className="w-4 h-4" />
          )}
          <div>
            <div className="font-semibold text-sm text-blue-300">{component.name}</div>
            <div className="text-xs text-gray-400">{component.faction}</div>
          </div>
        </div>
        <button
          onClick={() => onRemoveComponent(category, index)}
          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
        >
          Remove
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">
        Player {playerIndex + 1} - Build Your Faction
      </h3>

      {/* Drafted Factions Display */}
      <div className="mb-4 p-3 bg-purple-900/20 rounded border border-purple-600">
        <h4 className="font-semibold text-purple-400 mb-2">Your Drafted Factions:</h4>
        <div className="flex flex-wrap gap-2">
          {(draftedItems.factions || []).map((faction, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-purple-800/50 px-3 py-2 rounded cursor-pointer hover:bg-purple-700/50 transition-colors"
              onClick={() => setExpandedFaction(expandedFaction === faction.name ? null : faction.name)}
            >
              {faction.icon && <img src={faction.icon} alt={faction.name} className="w-6 h-6" />}
              <span className="text-white font-medium">{faction.name}</span>
            </div>
          ))}
        </div>
        {expandedFaction && (
          <div className="mt-3 p-3 bg-gray-900/50 rounded">
            <h5 className="text-sm font-semibold text-yellow-400 mb-2">
              Available from {expandedFaction}:
            </h5>
            <div className="text-xs text-gray-300">
              Click a category below to see components from this faction
            </div>
          </div>
        )}
      </div>

      {/* Drafted Tiles Display */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-blue-900/20 rounded border border-blue-600">
          <h4 className="font-semibold text-blue-400 mb-2 text-sm">Blue Tiles ({(draftedItems.blue_tiles || []).length})</h4>
          <div className="space-y-1">
            {(draftedItems.blue_tiles || []).slice(0, 3).map((tile, idx) => (
              <div key={idx} className="text-xs text-gray-300">{tile.name}</div>
            ))}
            {(draftedItems.blue_tiles || []).length > 3 && (
              <div className="text-xs text-gray-400">+{(draftedItems.blue_tiles || []).length - 3} more</div>
            )}
          </div>
        </div>
        <div className="p-3 bg-red-900/20 rounded border border-red-600">
          <h4 className="font-semibold text-red-400 mb-2 text-sm">Red Tiles ({(draftedItems.red_tiles || []).length})</h4>
          <div className="space-y-1">
            {(draftedItems.red_tiles || []).slice(0, 3).map((tile, idx) => (
              <div key={idx} className="text-xs text-gray-300">{tile.name}</div>
            ))}
            {(draftedItems.red_tiles || []).length > 3 && (
              <div className="text-xs text-gray-400">+{(draftedItems.red_tiles || []).length - 3} more</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left side: Component Selection */}
        <div className="space-y-3">
          <h4 className="font-semibold text-blue-400">Select Components to Add:</h4>
          
          {/* Category Selector */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const count = getCategoryCount(cat);
              const limit = factionLimits[cat];
              const atLimit = count >= limit;
              
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : atLimit
                      ? 'bg-green-800 text-green-200'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {formatCategoryName(cat).replace(' ', '\n')} ({count}/{limit})
                </button>
              );
            })}
          </div>

          {/* Available Components */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h5 className="text-sm font-semibold text-yellow-400 sticky top-0 bg-gray-800 py-2">
              Available {formatCategoryName(selectedCategory)}:
            </h5>
            {getAvailableComponents(selectedCategory).length === 0 ? (
              <div className="text-sm text-gray-400 p-3 bg-gray-900/50 rounded">
                No {formatCategoryName(selectedCategory).toLowerCase()} available from your drafted factions
              </div>
            ) : (
              getAvailableComponents(selectedCategory).map(comp => 
                renderComponentCard(comp, selectedCategory)
              )
            )}
          </div>
        </div>

        {/* Right side: Current Build */}
        <div className="space-y-3">
          <h4 className="font-semibold text-green-400">Your Faction Build:</h4>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {categories.map(cat => {
              const items = builtFaction[cat] || [];
              const count = items.length;
              const limit = factionLimits[cat];
              const isOverLimit = count > limit;

              if (items.length === 0) return null;

              return (
                <div
                  key={cat}
                  className={`p-3 rounded border-2 ${
                    isOverLimit
                      ? 'bg-red-900/30 border-red-600'
                      : 'bg-gray-900/50 border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-semibold text-yellow-400 text-sm">
                      {formatCategoryName(cat)}
                    </h5>
                    <span
                      className={`text-xs font-bold ${
                        isOverLimit ? 'text-red-400' : count === limit ? 'text-green-400' : 'text-gray-400'
                      }`}
                    >
                      {count}/{limit} {isOverLimit && '⚠️ OVER LIMIT'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => renderBuiltComponent(item, cat, idx))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}