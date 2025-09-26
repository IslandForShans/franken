import React, { useState } from "react";
import { getSwapOptions, getExtraComponents } from "../data/undraftable-components.js";

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
  
  const categories = [
    "abilities", "faction_techs", "agents", "commanders", "heroes",
    "promissory", "flagship", "mech", "starting_techs", "starting_fleet",
    "commodity_values", "blue_tiles", "red_tiles"
  ];

  const getId = (item) => item?.id ?? item?.name ?? JSON.stringify(item);

  const handleDrop = (e, category) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.category && data.componentId) {
        onDropComponent(category, data);
      }
    } catch {}
  };

  const allowDrop = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const formatCategoryName = (category) => {
    return category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCategoryStatus = (category) => {
    const items = drafted[category] || [];
    const limit = draftLimits[category] || 0;
    const excess = Math.max(0, items.length - limit);
    return { items, limit, excess, needsReduction: excess > 0 };
  };

  const handleRemove = (category, index) => {
    const component = drafted[category][index];
    
    // Check if removing this component would trigger adds
    const extraComponents = getExtraComponents(component.name, component.faction);
    if (extraComponents.length > 0 && showReductionHelper) {
      const confirmMessage = `Keeping ${component.name} will add: ${extraComponents.map(e => e.name).join(", ")}. Continue?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }
    
    onRemove(category, index);
  };

  const handleSwap = (category, index) => {
    const component = drafted[category][index];
    const swapOption = getSwapOptions(component.name, component.faction);
    
    if (swapOption && onSwapComponent && playerIndex !== null) {
      onSwapComponent(playerIndex, category, index, swapOption);
    }
  };

  return (
    <div className={`border rounded p-4 ${isCurrentPlayer ? "bg-blue-50 border-blue-300" : "bg-gray-100"}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      {showReductionHelper && (
        <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded">
          <div className="font-semibold text-orange-800">Reduction Phase Instructions:</div>
          <div className="text-sm text-orange-700">
            Click "Remove" on excess components to meet faction limits. 
            Red categories need reduction. Components may have swap options or trigger additional components.
          </div>
        </div>
      )}

      {categories.map((category) => {
        const status = getCategoryStatus(category);
        const categoryBgColor = showReductionHelper && status.needsReduction ? "bg-red-50 border-red-300" : "bg-white";

        return (
          <div
            key={category}
            className={`mb-6 p-3 border rounded ${categoryBgColor}`}
            onDragOver={allowDrop}
            onDrop={(e) => handleDrop(e, category)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">
                {formatCategoryName(category)}
              </h3>
              <div className="text-sm">
                <span className={status.needsReduction ? "text-red-600 font-bold" : "text-gray-600"}>
                  {status.items.length}/{status.limit} 
                  {status.needsReduction && ` (-${status.excess} needed)`}
                </span>
              </div>
            </div>

            {status.items.length === 0 && (
              <div className="text-sm text-gray-500 italic p-4 border-2 border-dashed border-gray-300 rounded">
                {isCurrentPlayer ? "Available components will appear in sidebar" : `No ${formatCategoryName(category)} selected`}
              </div>
            )}

            <div className="grid gap-2">
              {status.items.map((item, index) => {
                const id = getId(item);
                const isExpanded = expandedId === id;
                const isTile = ["blue_tiles", "red_tiles"].includes(category);
                const swapOption = getSwapOptions(item.name, item.faction);
                const extraComponents = getExtraComponents(item.name, item.faction);
                
                return (
                  <div
                    key={id + index}
                    className={`border rounded p-2 relative cursor-pointer hover:shadow ${
                      item.isSwap ? "bg-blue-50 border-blue-300" : 
                      item.isExtra ? "bg-green-50 border-green-300" : "bg-gray-50"
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                  >
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {item.name}
                          {item.isSwap && <span className="text-blue-600 text-xs ml-2">[SWAPPED]</span>}
                          {item.isExtra && <span className="text-green-600 text-xs ml-2">[EXTRA]</span>}
                        </div>
                        
                        {item.faction && (
                          <div className="text-xs text-blue-600">{item.faction}</div>
                        )}
                        
                        {item.description && !isExpanded && (
                          <div className="text-xs text-gray-600 truncate mt-1">
                            {item.description}
                          </div>
                        )}

                        {/* Show swap/extra info when not expanded */}
                        {!isExpanded && showReductionHelper && (
                          <div className="mt-1 text-xs">
                            {swapOption && (
                              <div className="text-blue-600">↔ Swap available: {swapOption.name}</div>
                            )}
                            {extraComponents.length > 0 && (
                              <div className="text-green-600">+ Will add: {extraComponents.map(e => e.name).join(", ")}</div>
                            )}
                          </div>
                        )}

                        {/* Tiles: planets, anomalies, wormholes */}
                        {isExpanded && isTile && (
                          <div className="mt-2 text-xs text-gray-700 border-t pt-2">
                            {item.planets?.map((p, idx) => (
                              <div key={p.name + idx} className="mb-2 p-1 bg-gray-100 rounded">
                                <div className="font-semibold text-sm text-green-700">{p.name}</div>
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

                        {/* Full description when expanded */}
                        {isExpanded && item.description && (
                          <div className="mt-2 text-sm text-gray-700 whitespace-pre-line border-t pt-2">
                            {item.description}
                          </div>
                        )}

                        {/* Expanded swap/extra info */}
                        {isExpanded && showReductionHelper && (
                          <div className="mt-2 border-t pt-2">
                            {swapOption && (
                              <div className="text-sm text-blue-700 mb-2">
                                <strong>Swap Option:</strong> {swapOption.name}
                                <div className="text-xs">Reason: {swapOption.triggerComponent}</div>
                              </div>
                            )}
                            {extraComponents.length > 0 && (
                              <div className="text-sm text-green-700">
                                <strong>Will Add if Kept:</strong>
                                <ul className="text-xs ml-4 list-disc">
                                  {extraComponents.map((extra, idx) => (
                                    <li key={idx}>{extra.name} ({extra.type.replace('_', ' ')})</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-1 ml-2">
                        {/* Swap button - only show during reduction if swap available */}
                        {showReductionHelper && swapOption && !item.isSwap && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleSwap(category, index);
                            }}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Swap
                          </button>
                        )}

                        {/* Remove button */}
                        {(showReductionHelper || !isCurrentPlayer) && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleRemove(category, index); 
                            }}
                            className={`text-xs hover:underline px-2 py-1 rounded ${
                              showReductionHelper && status.needsReduction 
                                ? "bg-red-500 text-white font-bold hover:bg-red-600" 
                                : "text-red-600 hover:bg-red-50"
                            }`}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

              <div className="mt-2 text-sm text-red-600 font-medium bg-red-50 p-2 rounded">
                ⚠️ Remove {status.excess} component{status.excess !== 1 ? 's' : ''} from this category
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}