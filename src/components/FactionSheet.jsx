import React, { useState } from "react";
import { getSwapOptions, getExtraComponents, getSwapOptionsForTrigger } from "../data/undraftable-components.js";

export default function FactionSheet({
  drafted = {},
  draftLimits = {},
  onRemove = () => {},
  onDropComponent = () => {},
  onSwapComponent = () => {},
  title = "Your Drafted Faction",
  isCurrentPlayer = false,
  showReductionHelper = false,
  playerIndex = null
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapOptions, setSwapOptions] = useState([]);
  const [swapTarget, setSwapTarget] = useState(null);

  const getId = (item) => item?.id ?? item?.name ?? JSON.stringify(item);

  const formatCategoryName = (category) => {
    const names = {
      abilities: "FACTION ABILITIES",
      faction_techs: "FACTION TECHNOLOGIES",
      agents: "AGENTS",
      commanders: "COMMANDERS",
      heroes: "HEROES",
      promissory: "PROMISSORY NOTES",
      flagship: "FLAGSHIP",
      mech: "MECH",
      starting_techs: "STARTING TECHNOLOGIES",
      starting_fleet: "STARTING FLEET",
      commodity_values: "COMMODITIES",
      blue_tiles: "BLUE TILES",
      red_tiles: "RED TILES",
      home_systems: "HOME SYSTEM"
    };
    return names[category] || category.toUpperCase().replace(/_/g, " ");
  };

  const getCategoryStatus = (category) => {
    const items = drafted[category] || [];
    const limit = draftLimits[category] || 0;
    const excess = Math.max(0, items.length - limit);
    return { items, limit, excess, needsReduction: excess > 0 };
  };

  const getAvailableSwapsForCategory = (category) => {
    const swaps = [];
    const categories = Object.keys(drafted);
    
    categories.forEach(cat => {
      const items = drafted[cat] || [];
      items.forEach(item => {
        const triggeredSwaps = getSwapOptionsForTrigger(item.name, item.faction);
        triggeredSwaps.forEach(swap => {
          if (swap.category === category) {
            swaps.push({
              ...swap,
              triggerComponent: item
            });
          }
        });
      });
    });
    
    return swaps;
  };

  const handleRemove = (category, index) => {
    const component = drafted[category][index];
    
    if (showReductionHelper) {
      const extraComponents = getExtraComponents(component.name, component.faction);
      if (extraComponents.length > 0) {
        const confirmMessage = `Keeping ${component.name} will add: ${extraComponents.map(e => e.name).join(", ")}. Continue?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }
    
    onRemove(category, index);
  };

  const handleSwap = (category, index) => {
    const component = drafted[category][index];
    const availableSwaps = getSwapOptionsForTrigger(component.name, component.faction);
    
    if (availableSwaps.length > 0) {
      setSwapOptions(availableSwaps);
      setSwapTarget({ category, index, component });
      setSwapModalOpen(true);
    }
  };

  const confirmSwap = (swapOption) => {
    if (swapTarget && onSwapComponent && playerIndex !== null) {
      onSwapComponent(playerIndex, swapOption.category, 0, swapOption, swapTarget.component);
    }
    setSwapModalOpen(false);
    setSwapOptions([]);
    setSwapTarget(null);
  };

  const renderUnitStats = (item) => {
    if (!item.combat) return null;

    return (
      <div className="flex gap-2 mt-2">
        {item.cost !== undefined && (
          <div className="flex flex-col items-center bg-yellow-900 rounded-full w-12 h-12 justify-center border-2 border-yellow-600">
            <div className="text-[10px] text-yellow-300 font-bold">COST</div>
            <div className="text-lg font-bold text-white">{item.cost}</div>
          </div>
        )}
        <div className="flex flex-col items-center bg-red-900 rounded-full w-12 h-12 justify-center border-2 border-red-600">
          <div className="text-[10px] text-red-300 font-bold">COMBAT</div>
          <div className="text-lg font-bold text-white">{item.combat}</div>
        </div>
        {item.move !== undefined && (
          <div className="flex flex-col items-center bg-blue-900 rounded-full w-12 h-12 justify-center border-2 border-blue-600">
            <div className="text-[10px] text-blue-300 font-bold">MOVE</div>
            <div className="text-lg font-bold text-white">{item.move}</div>
          </div>
        )}
        {item.capacity !== undefined && (
          <div className="flex flex-col items-center bg-green-900 rounded-full w-12 h-12 justify-center border-2 border-green-600">
            <div className="text-[10px] text-green-300 font-bold">CAPACITY</div>
            <div className="text-lg font-bold text-white">{item.capacity}</div>
          </div>
        )}
      </div>
    );
  };

  const renderComponent = (item, category, index) => {
    const id = getId(item);
    const isExpanded = expandedId === id;
    const swapOption = getSwapOptions(item.name, item.faction);
    const extraComponents = getExtraComponents(item.name, item.faction);
    const triggeredSwaps = getSwapOptionsForTrigger(item.name, item.faction);

    return (
      <div
        key={id + index}
        className={`relative mb-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
          item.isSwap ? "bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500" : 
          item.isExtra ? "bg-gradient-to-br from-green-900 to-green-800 border-green-500" : 
          "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600"
        } hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/50`}
        onClick={() => setExpandedId(isExpanded ? null : id)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="text-yellow-400 font-bold text-lg tracking-wide">
              {item.name?.toUpperCase()}
            </div>
            {item.faction && (
              <div className="flex items-center gap-2 mt-1">
                {item.icon && <img src={item.icon} alt={item.faction} className="w-5 h-5" />}
                <span className="text-blue-300 text-sm">{item.faction}</span>
              </div>
            )}
            {item.isSwap && <span className="text-blue-400 text-xs">[SWAPPED]</span>}
            {item.isExtra && <span className="text-green-400 text-xs">[EXTRA]</span>}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0 ml-2">
            {showReductionHelper && swapOption && !item.isSwap && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleSwap(category, index);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500 border border-blue-400"
              >
                SWAP
              </button>
            )}
            {(showReductionHelper || !isCurrentPlayer) && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleRemove(category, index); 
                }}
                className={`px-3 py-1 text-xs font-bold rounded border ${
                  showReductionHelper && getCategoryStatus(category).needsReduction 
                    ? "bg-red-600 text-white hover:bg-red-500 border-red-400" 
                    : "bg-gray-700 text-red-400 hover:bg-gray-600 border-gray-500"
                }`}
              >
                REMOVE
              </button>
            )}
          </div>
        </div>

        {/* Unit stats for flagships/mechs/starting_fleet */}
        {(category === 'flagship' || category === 'mech' || category === 'starting_fleet') && item.combat && renderUnitStats(item)}

        {/* Abilities */}
        {item.abilities && item.abilities.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {item.abilities.map((ability, idx) => (
                <span key={idx} className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs font-semibold border border-purple-600">
                  {ability}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div className={`mt-3 text-gray-300 text-sm italic border-t border-gray-700 pt-2 ${
            !isExpanded && "line-clamp-2"
          }`}>
            {item.description}
          </div>
        )}

        {/* Tech information */}
        {(category === 'faction_techs' || category === 'starting_techs') && item.techs && (
          <div className="mt-3 space-y-2 border-t border-gray-700 pt-2">
            {item.choose_count && (
              <div className="text-orange-400 text-xs font-bold bg-orange-900/30 p-2 rounded border border-orange-700">
                {item.note || `Choose ${item.choose_count} of the following:`}
              </div>
            )}
            {item.techs.map((tech, techIdx) => (
              <div key={techIdx} className="bg-gray-800/50 p-2 rounded border border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-cyan-400 font-semibold text-sm">{tech.name}</span>
                  {tech.tech_type_icon && (
                    <img src={tech.tech_type_icon} alt={tech.tech_type} className="w-5 h-5" />
                  )}
                </div>
                {tech.description && (
                  <div className="text-gray-400 text-xs italic">{tech.description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Single tech card */}
        {(category === 'faction_techs' || category === 'starting_techs') && !item.techs && item.tech_type_icon && (
          <div className="mt-2 flex items-center gap-2">
            <img src={item.tech_type_icon} alt={item.tech_type} className="w-6 h-6" />
            {item.prerequisite_icons && item.prerequisite_icons.length > 0 && (
              <div className="flex gap-1 items-center">
                <span className="text-gray-400 text-xs">Requirements:</span>
                {item.prerequisite_icons.map((icon, idx) => (
                  <img key={idx} src={icon} alt="Prerequisite" className="w-4 h-4" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tile planets */}
        {(category === 'blue_tiles' || category === 'red_tiles') && item.planets && (
          <div className="mt-3 space-y-2 border-t border-gray-700 pt-2">
            {item.planets.map((planet, pIdx) => (
              <div key={pIdx} className="bg-gradient-to-r from-green-900/30 to-transparent p-2 rounded border-l-4 border-green-600">
                <div className="text-green-400 font-bold">{planet.name}</div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-yellow-300">{planet.resource}R</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-blue-300">{planet.influence}I</span>
                </div>
                {planet.traits && planet.traits.length > 0 && (
                  <div className="text-purple-400 text-xs mt-1">
                    Traits: {planet.traits.join(", ")}
                  </div>
                )}
                {planet.technology_specialty && planet.technology_specialty.length > 0 && (
                  <div className="text-orange-400 text-xs mt-1">
                    Tech Specialty: {planet.technology_specialty.join(", ")}
                  </div>
                )}
                {planet.legendary_ability && (
                  <div className="text-yellow-400 text-xs mt-1 font-semibold">
                    ⭐ Legendary: {planet.legendary_ability}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Commodity value display */}
        {category === 'commodity_values' && item.value !== undefined && (
          <div className="mt-2 flex items-center justify-center">
            <div className="bg-yellow-900 rounded-lg px-6 py-3 border-2 border-yellow-600">
              <div className="text-yellow-300 text-xs font-bold">COMMODITIES</div>
              <div className="text-4xl font-bold text-white text-center">{item.value}</div>
            </div>
          </div>
        )}

        {/* Swap/Extra warnings */}
        {isExpanded && showReductionHelper && (
          <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
            {swapOption && (
              <div className="bg-blue-900/30 border border-blue-600 rounded p-2 text-sm">
                <div className="text-blue-400 font-bold">SWAP AVAILABLE:</div>
                <div className="text-blue-300">{swapOption.name}</div>
              </div>
            )}
            {extraComponents.length > 0 && (
              <div className="bg-green-900/30 border border-green-600 rounded p-2 text-sm">
                <div className="text-green-400 font-bold">WILL ADD IF KEPT:</div>
                <ul className="text-green-300 text-xs ml-4 list-disc">
                  {extraComponents.map((extra, idx) => (
                    <li key={idx}>{extra.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const categories = [
    { key: 'abilities', col: 1 },
    { key: 'faction_techs', col: 1 },
    { key: 'agents', col: 2 },
    { key: 'commanders', col: 2 },
    { key: 'heroes', col: 2 },
    { key: 'promissory', col: 1 },
    { key: 'flagship', col: 3 },
    { key: 'mech', col: 3 },
    { key: 'starting_techs', col: 1 },
    { key: 'starting_fleet', col: 3 },
    { key: 'commodity_values', col: 2 },
    { key: 'blue_tiles', col: 1 },
    { key: 'red_tiles', col: 1 },
    { key: 'home_systems', col: 1 }
  ];

  const getColumnCategories = (col) => categories.filter(c => c.col === col);

  return (
    <div className={`rounded-lg p-6 ${
      isCurrentPlayer ? "bg-gradient-to-br from-blue-950 to-gray-900 border-4 border-blue-500" : "bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700"
    }`}>
      {/* Title */}
      <div className="mb-6 text-center border-b-2 border-yellow-600 pb-4">
        <h2 className="text-3xl font-bold text-yellow-400 tracking-widest uppercase">
          {title}
        </h2>
      </div>

      {showReductionHelper && (
        <div className="mb-6 p-4 bg-orange-900/50 border-2 border-orange-600 rounded-lg">
          <div className="font-bold text-orange-400 text-lg">⚠️ REDUCTION PHASE</div>
          <div className="text-orange-300 text-sm mt-1">
            Remove excess components to meet faction limits. Red categories need reduction.
          </div>
        </div>
      )}

      {/* Three column layout */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(col => (
          <div key={col} className="space-y-4">
            {getColumnCategories(col).map(({ key: category }) => {
              const status = getCategoryStatus(category);
              const availableSwaps = showReductionHelper ? getAvailableSwapsForCategory(category) : [];

              return (
                <div
                  key={category}
                  className={`rounded-lg border-2 p-3 ${
                    showReductionHelper && status.needsReduction 
                      ? "bg-red-950/50 border-red-600" 
                      : "bg-gray-800/50 border-gray-600"
                  }`}
                >
                  {/* Category header */}
                  <div className="mb-3 pb-2 border-b-2 border-yellow-700">
                    <h3 className="text-yellow-400 font-bold text-sm tracking-wide">
                      {formatCategoryName(category)}
                    </h3>
                    <div className={`text-xs mt-1 ${
                      status.needsReduction ? "text-red-400 font-bold" : "text-gray-400"
                    }`}>
                      {status.items.length}/{status.limit}
                      {status.needsReduction && ` (Remove ${status.excess})`}
                    </div>
                  </div>

                  {/* Available swaps */}
                  {showReductionHelper && availableSwaps.length > 0 && (
                    <div className="mb-3 p-2 bg-blue-900/30 border border-blue-600 rounded">
                      <div className="text-blue-400 font-bold text-xs mb-2">SWAPS AVAILABLE:</div>
                      {availableSwaps.map((swap, idx) => (
                        <div key={idx} className="mb-2 p-2 bg-gray-900 rounded border border-blue-500">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-xs font-semibold">{swap.name}</div>
                              <div className="text-gray-400 text-[10px]">
                                From: {swap.triggerComponent.name}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (onSwapComponent && playerIndex !== null) {
                                  onSwapComponent(playerIndex, swap.category, 0, swap, swap.triggerComponent);
                                }
                              }}
                              className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-500 whitespace-nowrap flex-shrink-0"
                            >
                              ADD
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Components */}
                  {status.items.length === 0 ? (
                    <div className="text-gray-500 text-sm italic text-center py-4 border-2 border-dashed border-gray-700 rounded">
                      No {formatCategoryName(category).toLowerCase()} selected
                    </div>
                  ) : (
                    status.items.map((item, index) => renderComponent(item, category, index))
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Swap Modal */}
      {swapModalOpen && swapTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto border-4 border-yellow-600">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4 tracking-wide">
              SWAP OPTIONS FOR {swapTarget.component.name?.toUpperCase()}
            </h3>
            
            <div className="space-y-3">
              {swapOptions.map((option, idx) => (
                <div key={idx} className="bg-gray-800 border-2 border-blue-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xl font-bold text-blue-400">{option.name}</div>
                      <div className="text-sm text-gray-400">{option.category.replace('_', ' ')}</div>
                      <div className="text-sm text-cyan-400 mt-1">{option.faction}</div>
                    </div>
                    <button
                      onClick={() => confirmSwap(option)}
                      className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 border-2 border-blue-400"
                    >
                      SWAP
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSwapModalOpen(false);
                  setSwapOptions([]);
                  setSwapTarget(null);
                }}
                className="px-6 py-3 bg-gray-700 text-white font-bold rounded hover:bg-gray-600 border-2 border-gray-500"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}