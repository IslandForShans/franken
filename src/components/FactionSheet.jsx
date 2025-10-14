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
  
  const categories = [
    "abilities", "faction_techs", "agents", "commanders", "heroes",
    "promissory", "flagship", "mech", "starting_techs", "starting_fleet",
    "commodity_values", "blue_tiles", "red_tiles", "home_systems"
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
    
    if (showReductionHelper) {
      const extraComponents = getExtraComponents(component.name, component.faction);
      if (extraComponents.length > 0) {
        const confirmMessage = `Keeping ${component.name} will add: ${extraComponents.map(e => e.name).join(", ")}. Continue?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    }
    
    console.log("Removing component:", category, index, component.name);
    onRemove(category, index);
  };

  const handleSwap = (category, index) => {
    const component = drafted[category][index];
    
    // Check for swap options triggered by THIS component
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
                const isUnit = (category === 'flagship' || category === 'mech');
                const swapOption = getSwapOptions(item.name, item.faction);
                const extraComponents = getExtraComponents(item.name, item.faction);
                
                // FIXED: Check if THIS component triggers any swaps
                const triggeredSwaps = getSwapOptionsForTrigger(item.name, item.faction);
                
                return (
                  <div
                    key={id + index}
                    className={`border rounded p-2 relative cursor-pointer hover:shadow overflow-hidden ${
                      item.isSwap ? "bg-blue-50 border-blue-300" : 
                      item.isExtra ? "bg-green-50 border-green-300" : "bg-gray-50"
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                  >
                    <div className="flex justify-between gap-2">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-semibold break-words">
                          {item.name}
                          {item.isSwap && <span className="text-blue-600 text-xs ml-2">[SWAPPED]</span>}
                          {item.isExtra && <span className="text-green-600 text-xs ml-2">[EXTRA]</span>}
                        </div>
                        
                        {item.faction && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 break-words">
                            {item.icon && <img src={item.icon} alt={item.faction} className="w-4 h-4" />}
                            {item.faction}
                          </div>
                        )}
                        
                        {/* Tech card format - single tech or tech package */}
                        {(category === 'faction_techs' || category === 'starting_techs') && (
                          <div className="mt-2">
                            {item.techs && item.techs.length > 0 ? (
                              <div className="space-y-2">
                                {item.choose_count && (
                                  <div className="text-[11px] font-semibold text-orange-600 mb-1 pb-1 border-b border-orange-200">
                                    {item.note || `Choose ${item.choose_count} of the following:`}
                                  </div>
                                )}
                                {item.techs.map((tech, techIdx) => (
                                  <div key={techIdx} className="pb-2 border-b last:border-b-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-gray-800 text-xs">{tech.name}</span>
                                      {tech.tech_type_icon && (
                                        <img src={tech.tech_type_icon} alt={tech.tech_type} className="w-4 h-4" title={tech.tech_type} />
                                      )}
                                    </div>
                                    {tech.description && (
                                      <div className="text-gray-700 italic text-[11px] leading-tight">
                                        {isExpanded ? tech.description : (
                                          <span className="line-clamp-2">{tech.description}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  {item.tech_type_icon && (
                                    <img src={item.tech_type_icon} alt={item.tech_type} className="w-4 h-4" title={item.tech_type} />
                                  )}
                                  {item.prerequisite_icons && item.prerequisite_icons.length > 0 && (
                                    <div className="flex gap-1 items-center">
                                      <span className="text-gray-600 text-[10px]">Req:</span>
                                      {item.prerequisite_icons.map((icon, idx) => (
                                        <img key={idx} src={icon} alt="Prerequisite" className="w-3 h-3" />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {item.combat && (
                                  <>
                                    {item.abilities && item.abilities.length > 0 && (
                                      <div className="text-xs font-semibold text-purple-700 mb-1">
                                        {item.abilities.join(', ')}
                                      </div>
                                    )}
                                    
                                    {item.description && (
                                      <div className="text-xs text-gray-700 mb-2 italic leading-tight">
                                        {isExpanded ? item.description : (
                                          <span className="line-clamp-2">{item.description}</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    <div className="flex gap-2 text-[10px] font-mono bg-gray-200 p-1.5 rounded border border-gray-300">
                                      {item.cost !== undefined && <span className="font-semibold">Cost: {item.cost}</span>}
                                      <span className="font-semibold">Combat: {item.combat}</span>
                                      {item.move !== undefined && <span className="font-semibold">Move: {item.move}</span>}
                                      {item.capacity !== undefined && <span className="font-semibold">Capacity: {item.capacity}</span>}
                                    </div>
                                  </>
                                )}
                                
                                {!item.combat && item.description && (
                                  <div className="text-xs text-gray-700 italic leading-tight">
                                    {isExpanded ? item.description : (
                                      <span className="line-clamp-2">{item.description}</span>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Unit card format for flagships and mechs */}
                        {(category === 'flagship' || category === 'mech') && item.combat && (
                          <div className="mt-2">
                            {item.abilities && item.abilities.length > 0 && (
                              <div className="text-xs font-semibold text-purple-700 mb-1">
                                {item.abilities.join(', ')}
                              </div>
                            )}
                            
                            {item.description && (
                              <div className="text-xs text-gray-700 mb-2 italic leading-tight">
                                {isExpanded ? item.description : (
                                  <span className="line-clamp-2">{item.description}</span>
                                )}
                              </div>
                            )}
                            
                            {item.variants && item.variants.length > 0 ? (
                              <div className="space-y-1">
                                {item.variants.map((variant, vIdx) => (
                                  <div key={vIdx} className="flex items-center gap-2 text-[10px] font-mono bg-gray-200 p-1.5 rounded border border-gray-300">
                                    <span className="font-semibold text-blue-600">{variant.location}:</span>
                                    {item.cost !== undefined && vIdx === 0 && <span className="font-semibold">Cost: {item.cost}</span>}
                                    <span className="font-semibold">Combat: {variant.combat}</span>
                                    {variant.move !== undefined && <span className="font-semibold">Move: {variant.move}</span>}
                                    {variant.capacity !== undefined && <span className="font-semibold">Capacity: {variant.capacity}</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex gap-2 text-[10px] font-mono bg-gray-200 p-1.5 rounded border border-gray-300">
                                {item.cost !== undefined && <span className="font-semibold">Cost: {item.cost}</span>}
                                <span className="font-semibold">Combat: {item.combat}</span>
                                {item.move !== undefined && <span className="font-semibold">Move: {item.move}</span>}
                                {item.capacity !== undefined && <span className="font-semibold">Capacity: {item.capacity}</span>}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Regular description for non-unit, non-tech components */}
                        {!(category === 'flagship' || category === 'mech' || category === 'faction_techs' || category === 'starting_techs') && item.description && !isExpanded && (
                          <div className="text-xs text-gray-600 truncate mt-1">
                            {item.description}
                          </div>
                        )}

                        {/* Show swap/extra info when not expanded */}
                        {!isExpanded && showReductionHelper && !isUnit && category !== 'faction_techs' && category !== 'starting_techs' && (
                          <div className="mt-1 text-xs">
                            {swapOption && (
                              <div className="text-blue-600 break-words">↔ Swap available: {swapOption.name}</div>
                            )}
                            {extraComponents.length > 0 && (
                              <div className="text-green-600 break-words">+ Will add: {extraComponents.map(e => e.name).join(", ")}</div>
                            )}
                          </div>
                        )}

                        {/* Tiles: planets, anomalies, wormholes */}
                        {isExpanded && isTile && (
                          <div className="mt-2 text-xs text-gray-700 border-t pt-2">
                            {item.planets?.map((p, idx) => (
                              <div key={p.name + idx} className="mb-2 p-1 bg-gray-100 rounded">
                                <div className="font-semibold text-sm text-green-700 break-words">{p.name}</div>
                                <div className="flex items-center gap-1 text-xs">
                                  <span>{p.resource}</span>
                                  {p.resource_icon && <img src={p.resource_icon} alt="Resources" className="w-3 h-3" />}
                                  <span>/</span>
                                  <span>{p.influence}</span>
                                  {p.influence_icon && <img src={p.influence_icon} alt="Influence" className="w-3 h-3" />}
                                </div>
                                {p.traits && p.traits.length > 0 && (
                                  <div className="text-xs text-purple-600 break-words">
                                    Traits: {p.traits.join(", ")}
                                  </div>
                                )}
                                {p.tech_specialty_icons && p.tech_specialty_icons.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-orange-600 break-words">
                                    <span>Tech:</span>
                                    {p.tech_specialty_icons.map((icon, tIdx) => (
                                      <img key={tIdx} src={icon} alt="Tech" className="w-3 h-3" />
                                    ))}
                                  </div>
                                )}
                                {p.legendary_icon && (
                                  <div className="flex items-center gap-1 text-xs text-yellow-700 font-medium break-words">
                                    <img src={p.legendary_icon} alt="Legendary" className="w-3 h-3" />
                                    <span>Legendary: {p.legendary_ability}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {item.wormhole_icon && (
                              <div className="flex items-center gap-1 text-xs text-purple-700 font-medium">
                                <span>Wormhole:</span>
                                <img src={item.wormhole_icon} alt={item.wormhole} className="w-4 h-4" />
                              </div>
                            )}
                            
                            {item.anomaly_icons && item.anomaly_icons.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-red-700 font-medium">
                                <span>Anomalies:</span>
                                {item.anomaly_icons.map((icon, aIdx) => (
                                  <img key={aIdx} src={icon} alt="Anomaly" className="w-4 h-4" />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Full description when expanded for non-units, non-techs */}
                        {isExpanded && !(category === 'flagship' || category === 'mech' || category === 'faction_techs' || category === 'starting_techs') && item.description && (
                          <div className="mt-2 text-sm text-gray-700 whitespace-pre-line border-t pt-2 break-words">
                            {item.description}
                          </div>
                        )}

                        {/* Expanded swap/extra info */}
                        {isExpanded && showReductionHelper && (
                          <div className="mt-2 border-t pt-2">
                            {swapOption && (
                              <div className="text-sm text-blue-700 mb-2">
                                <strong>Swap Option:</strong> {swapOption.name}
                                <div className="text-xs break-words">Reason: {swapOption.triggerComponent}</div>
                              </div>
                            )}
                            {extraComponents.length > 0 && (
                              <div className="text-sm text-green-700">
                                <strong>Will Add if Kept:</strong>
                                <ul className="text-xs ml-4 list-disc">
                                  {extraComponents.map((extra, idx) => (
                                    <li key={idx} className="break-words">{extra.name} ({extra.type.replace('_', ' ')})</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {showReductionHelper && swapOption && !item.isSwap && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleSwap(category, index);
                            }}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 whitespace-nowrap"
                          >
                            Swap
                          </button>
                        )}

                        {(showReductionHelper || !isCurrentPlayer) && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleRemove(category, index); 
                            }}
                            className={`text-xs hover:underline px-2 py-1 rounded whitespace-nowrap ${
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

            {showReductionHelper && status.needsReduction && (
              <div className="mt-2 text-sm text-red-600 font-medium bg-red-50 p-2 rounded">
                ⚠️ Remove {status.excess} component{status.excess !== 1 ? 's' : ''} from this category
              </div>
            )}
          </div>
        );
      })}
      
      {/* Swap Modal */}
      {swapModalOpen && swapTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Swap Options for {swapTarget.component.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              This component allows you to swap in the following options:
            </p>
            
            <div className="space-y-3">
              {swapOptions.map((option, idx) => (
                <div key={idx} className="border rounded p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">{option.name}</div>
                      <div className="text-sm text-gray-600">{option.category.replace('_', ' ')}</div>
                    </div>
                    <button
                      onClick={() => confirmSwap(option)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Swap
                    </button>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Faction:</strong> {option.faction}
                  </div>
                  <div className="text-sm text-gray-700 mt-2">
                    This will add {option.name} to your {option.category.replace('_', ' ')} category.
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
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}