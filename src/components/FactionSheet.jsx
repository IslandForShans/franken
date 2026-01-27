import React, { useState } from "react";
import './UnifiedStyles.css';
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
  playerIndex = null,
  hiddenCategories = [] // optional array of category keys to hide
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
      home_systems: "HOME SYSTEM",
      breakthrough: "BREAKTHROUGHS"
    };
    return names[category] || category.toUpperCase().replace(/_/g, " ");
  };

  const getCategoryStatus = (category) => {
    const items = drafted[category] || [];
    const rawLimit = draftLimits[category];
const isUnlimited = rawLimit === undefined;

const limit = isUnlimited ? Infinity : rawLimit;
const excess = isUnlimited ? 0 : Math.max(0, items.length - limit);

return { items, limit, excess, needsReduction: !isUnlimited && excess > 0 };
  };

  const getAvailableSwapsForCategory = (category) => {
  const swaps = [];
  const categories = Object.keys(drafted);
  
  categories.forEach(cat => {
    const items = drafted[cat];
    
    // Safety check: ensure items is an array before iterating
    if (!items || !Array.isArray(items)) {
      return; // Skip this category
    }
    
    items.forEach(item => {
      // Safety check: ensure item has required properties
      if (!item || !item.name) {
        return; // Skip this item
      }
      
      const triggeredSwaps = getSwapOptionsForTrigger(item.name, item.faction);
      
      // Safety check: ensure triggeredSwaps is an array
      if (!triggeredSwaps || !Array.isArray(triggeredSwaps)) {
        return; // Skip if no swaps
      }
      
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

  let categories = [
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
    { key: 'home_systems', col: 1 },
    { key: 'breakthrough', col: 2 }
  ];

  // Remove any categories the parent explicitly asked to hide (Theorycrafting will use this)
  if (Array.isArray(hiddenCategories) && hiddenCategories.length > 0) {
    categories = categories.filter(c => !hiddenCategories.includes(c.key));
  }

  const getColumnCategories = (col) => categories.filter(c => c.col === col);




  // renderComponent helper function structure:
  const renderComponent = (item, category, index) => {
    const id = getId(item);
    const isExpanded = expandedId === id;
    const swapOption = getSwapOptions(item.name, item.faction);
    const extraComponents = getExtraComponents(item.name, item.faction);
    const triggeredSwaps = getSwapOptionsForTrigger(item.name, item.faction);
    const isUnit = (category === 'flagship' || category === 'mech' || category === 'starting_fleet');
    const isTech = (category === 'faction_techs' || category === 'starting_techs');
    const isTile = (category === 'blue_tiles' || category === 'red_tiles' || category === 'home_systems');
    const isBreakthrough = (category === 'breakthrough');

    return (
      <div
        key={id + index}
        className={`faction-component ${
          item.isSwap ? 'faction-component-swap' : 
          item.isExtra ? 'faction-component-extra' : ''
        }`}
        onClick={() => setExpandedId(isExpanded ? null : id)}
      >
        {/* Header */}
        <div className="faction-component-header">
          <div style={{flex: 1}}>
            <div className="faction-component-name">
              {item.name?.toUpperCase()}
            </div>
            {item.faction && (
              <div className="faction-component-faction">
                {item.icon && <img src={item.icon} alt={item.faction} style={{width: '1.25rem', height: '1.25rem'}} />}
                <span>{item.faction}</span>
              </div>
            )}
            {item.isSwap && <span className="text-xs" style={{color: '#93c5fd'}}>[SWAPPED]</span>}
            {item.isExtra && <span className="text-xs" style={{color: '#6ee7b7'}}>[EXTRA]</span>}
            
            {/* Unit stats - always show */}
            {isUnit && item.combat && (
              <div className="text-xs mt-2 flex gap-2" style={{color: '#fff'}}>
                {item.cost !== undefined && <span className="font-semibold">Cost: {item.cost}</span>}
                <span className="font-semibold">Combat: {item.combat}</span>
                {item.move !== undefined && <span className="font-semibold">Move: {item.move}</span>}
                {item.capacity !== undefined && <span className="font-semibold">Capacity: {item.capacity}</span>}
              </div>
            )}
            
            {/* Unit abilities - always show */}
            {isUnit && item.abilities && item.abilities.length > 0 && (
              <div className="text-xs mt-1" style={{color: '#c084fc'}}>
                <span className="font-semibold">Abilities:</span> {item.abilities.join(', ')}
              </div>
            )}

            {/* Breakthrough synergy - always show */}
            {isBreakthrough && item.synergy && item.synergy.length > 0 && (
              <div className="text-xs mt-2" style={{color: '#fbbf24'}}>
                <span className="font-semibold">Synergy:</span> {item.synergy.map(s => `${s.primary}/${s.secondary}`).join(', ')}
              </div>
            )}

            {/* Tile/Home System Planets - always show summary */}
            {isTile && item.planets && item.planets.length > 0 && (
              <div className="text-xs mt-2" style={{color: '#6ee7b7'}}>
                <span className="font-semibold">{item.planets.length} Planet{item.planets.length !== 1 ? 's' : ''}</span>
                {item.planets.map((p, idx) => (
                  <div key={idx} style={{marginLeft: '0.5rem', marginTop: '0.25rem'}}>
                    <div className="font-semibold">{p.name}</div>
                    <div style={{color: '#fcd34d'}}>R: {p.resource || 0}</div>
                    <div style={{color: '#93c5fd'}}>I: {p.influence || 0}</div>
                    {p.traits && p.traits.length > 0 && (
                      <div style={{color: '#c084fc'}}>Traits: {p.traits.join(', ')}</div>
                    )}
                    {p.technology_specialty && p.technology_specialty.length > 0 && (
                      <div style={{color: '#fb923c'}}>Tech: {p.technology_specialty.join(', ')}</div>
                    )}
                    {p.legendary_ability && (
                      <div style={{color: '#fcd34d', fontStyle: 'italic', marginTop: '0.25rem'}}>
                        Legendary: {p.legendary_ability}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Wormhole - always show */}
            {isTile && item.wormhole && (
              <div className="text-xs mt-1" style={{color: '#c084fc'}}>
                <span className="font-semibold">Wormhole:</span> {item.wormhole}
              </div>
            )}

            {/* Anomalies - always show */}
            {isTile && item.anomalies && item.anomalies.length > 0 && (
              <div className="text-xs mt-1" style={{color: '#ef4444'}}>
                <span className="font-semibold">Anomalies:</span> {item.anomalies.join(', ')}
              </div>
            )}

            {/* Starting Techs - always show */}
            {category === 'starting_techs' && (
              <div className="text-xs mt-2">
                {item.note && (
                  <div className="font-semibold mb-2" style={{color: '#fbbf24'}}>
                    {item.note}
                  </div>
                )}
                {Array.isArray(item.techs) && (
                  <div style={{marginLeft: '0.5rem'}}>
                    {item.techs.map((t, i) => {
                      const techColorMap = {
                        'Blue': '#60a5fa',
                        'Red': '#f87171',
                        'Green': '#34d399',
                        'Yellow': '#fcd34d'
                      };
                      const techColor = techColorMap[t.tech_type] || '#ffffff';
                      
                      return (
                        <div key={i} style={{color: techColor, marginBottom: '0.25rem'}}>
                          • {typeof t === "string" ? t : t.name}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="faction-component-actions">
            {showReductionHelper && swapOption && !item.isSwap && (
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleSwap(category, index);
                }}
                className="btn btn-primary btn-sm"
              >
                SWAP
              </button>
            )}
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                handleRemove(category, index);
              }}
              className="btn btn-danger btn-sm"
            >
              REMOVE
            </button>
          </div>
        </div>

        {/* Description - always show for non-units or if expanded */}
        {item.description && (!isUnit || isExpanded) && (
          <div className="faction-component-description">
            {item.description}
          </div>
        )}

        {/* Expanded details */}
        {isExpanded && (
          <div className="faction-component-details">
            {extraComponents.length > 0 && (
              <div className="faction-component-extra-list">
                <div className="faction-component-extra-title">EXTRA COMPONENTS:</div>
                {extraComponents.map((extra, idx) => (
                  <div key={idx} className="faction-component-extra-item">
                    {extra.name} ({extra.category})
                  </div>
                ))}
              </div>
            )}
            {triggeredSwaps.length > 0 && (
              <div className="faction-component-swap-list">
                <div className="faction-component-swap-title">SWAP OPTIONS:</div>
                {triggeredSwaps.map((swap, idx) => (
                  <div key={idx} className="faction-component-swap-item">
                    {swap.name} ({swap.category})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`faction-sheet ${isCurrentPlayer ? 'faction-sheet-current' : ''}`}>
      {/* Title */}
      <div className="card-header">
        <h2 className="faction-sheet-title">
          {title}
        </h2>
      </div>

      {showReductionHelper && Object.keys(draftLimits).length > 0 && (
        <div className="reduction-helper">
          <div className="reduction-helper-title">⚠️ REDUCTION PHASE</div>
          <div className="reduction-helper-text">
            Remove excess components to meet faction limits. Red categories need reduction.
          </div>
        </div>
      )}

      {/* Three column layout */}
      <div className="faction-category-grid">
        {[1, 2, 3].map(col => (
          <div key={col} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {getColumnCategories(col).map(({ key: category }) => {
              const status = getCategoryStatus(category);
              const availableSwaps = showReductionHelper ? getAvailableSwapsForCategory(category) : [];

              return (
                <div
                  key={category}
                  className={`faction-category ${status.needsReduction ? 'faction-category-needs-reduction' : ''}`}
                >
                  {/* Category header */}
                  <div className="faction-category-header">
                    <h3 className="faction-category-title">
                      {formatCategoryName(category)}
                    </h3>
                    <div className={`faction-category-count ${status.needsReduction ? 'faction-category-count-over' : ''}`}>
  {status.limit === Infinity
    ? `${status.items.length}`
    : `${status.items.length}/${status.limit}`
  }
  {status.needsReduction && ` (Remove ${status.excess})`}
</div>
                  </div>

                  {/* Available swaps */}
                  {showReductionHelper && availableSwaps.length > 0 && (
                    <div className="available-swaps">
                      <div className="available-swaps-title">SWAPS AVAILABLE:</div>
                      {availableSwaps.map((swap, idx) => (
                        <div key={idx} className="available-swap-item">
                          <div className="available-swap-header">
                            <div className="available-swap-info">
                              <div className="available-swap-name">{swap.name}</div>
                              <div className="available-swap-trigger">
                                From: {swap.triggerComponent.name}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (onSwapComponent && playerIndex !== null) {
                                  onSwapComponent(playerIndex, swap.category, 0, swap, swap.triggerComponent);
                                }
                              }}
                              className="btn btn-primary btn-sm"
                              style={{flexShrink: 0}}
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
                    <div className="empty-state">
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
        <div className="swap-modal-overlay">
          <div className="swap-modal-content">
            <h3 className="swap-modal-title">
              SWAP OPTIONS FOR {swapTarget.component.name?.toUpperCase()}
            </h3>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {swapOptions.map((option, idx) => (
                <div key={idx} className="swap-option">
                  <div className="swap-option-header">
                    <div>
                      <div className="swap-option-name">{option.name}</div>
                      <div className="swap-option-category">{option.category.replace('_', ' ')}</div>
                      <div className="swap-option-faction">{option.faction}</div>
                    </div>
                    <button
                      onClick={() => confirmSwap(option)}
                      className="btn btn-primary"
                    >
                      SWAP
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="swap-modal-footer">
              <button
                onClick={() => {
                  setSwapModalOpen(false);
                  setSwapOptions([]);
                  setSwapTarget(null);
                }}
                className="btn btn-secondary"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

// renderUnitStats helper function:
const renderUnitStats = (item) => {
  if (!item.combat) return null;

  return (
    <div className="unit-stats">
      {item.cost !== undefined && (
        <div className="unit-stat unit-stat-cost">
          <div className="unit-stat-label">COST</div>
          <div className="unit-stat-value">{item.cost}</div>
        </div>
      )}
      <div className="unit-stat unit-stat-combat">
        <div className="unit-stat-label">COMBAT</div>
        <div className="unit-stat-value">{item.combat}</div>
      </div>
      {item.move !== undefined && (
        <div className="unit-stat unit-stat-move">
          <div className="unit-stat-label">MOVE</div>
          <div className="unit-stat-value">{item.move}</div>
        </div>
      )}
      {item.capacity !== undefined && (
        <div className="unit-stat unit-stat-capacity">
          <div className="unit-stat-label">CAPACITY</div>
          <div className="unit-stat-value">{item.capacity}</div>
        </div>
      )}
    </div>
  );
};

}