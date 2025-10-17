/*import React, { useState } from "react";
import './UnifiedStyles.css';

export default function Sidebar({ 
  categories, 
  onSelectCategory, 
  playerProgress, 
  draftLimits, 
  selectedCategory,
  availableComponents = {},
  onComponentClick,
  isMultiplayer = false,
  draftVariant = "franken"
}) {
  const [expandedCategory, setExpandedCategory] = useState(selectedCategory);

  const formatCategoryName = (category) => {
    return category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleCategoryClick = (category) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      onSelectCategory(null);
    } else {
      setExpandedCategory(category);
      onSelectCategory(category);
    }
  };

  const handleComponentClick = (category, component) => {
    if (onComponentClick) {
      onComponentClick(category, component);
    }
  };

  return (
  <div className="sidebar">
    <div className="sidebar-header">
      <h2 className="sidebar-title">Draft Categories</h2>
      <div className="sidebar-subtitle">
        Click categories to view available components
      </div>
      {draftVariant === "rotisserie" && (
        <div className="text-xs font-medium mt-1" style={{color: '#f97316'}}>
          Rotisserie Mode: One pick per turn
        </div>
      )}
    </div>
    
    <div className="sidebar-content">
      {categories.map(cat => {
        const progress = playerProgress[cat] || 0;
        const limit = draftLimits[cat] || 0;
        const isExpanded = expandedCategory === cat;
        const components = availableComponents[cat] || [];
        const canPick = progress < limit;

        return (
          <div key={cat} className="sidebar-category">
            <button
              className={`sidebar-category-button ${isExpanded ? 'sidebar-category-button-expanded' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{formatCategoryName(cat)}</div>
                  <div className="text-sm" style={{color: isExpanded ? '#ffffffff' : '#ffffffff'}}>
                    {progress}/{limit} selected
                    {!canPick && <span style={{color: '#dc2626', marginLeft: '0.25rem'}}>(MAX)</span>}
                  </div>
                  {components.length > 0 && (
                    <div className="text-xs" style={{color: isExpanded ? '#2563eb' : '#3b82f6'}}>
                      {components.length} available
                    </div>
                  )}
                </div>
                <div style={{color: isExpanded ? '#374151' : '#9ca3af'}}>
                  {isExpanded ? "▲" : "▼"}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="sidebar-category-content">
                {components.length === 0 ? (
                  <div className="empty-state">
                    No components available in your {draftVariant === "rotisserie" ? "pool" : "bag"}
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="text-xs mb-2" style={{color: '#bfc3caff', paddingLeft: '0.25rem'}}>
                      {draftVariant === "rotisserie" ? "Shared Pool" : "Your Bag"} • Click to pick
                    </div>
                    
                    {components
                      .sort((a, b) => {
                        const factionSort = (a.faction || "").localeCompare(b.faction || "");
                        if (factionSort !== 0) return factionSort;
                        return (a.name || "").localeCompare(b.name || "");
                      })
                      .map((component, idx) => {
                        const isDisabled = !canPick || (draftVariant === "rotisserie" && !canPick);
                        
                        return (
                          <div
                            key={component.id || component.name || idx}
                            className={`sidebar-component-item ${isDisabled ? 'sidebar-component-item-disabled' : ''}`}
                            onClick={() => {
                              if (!isDisabled) {
                                handleComponentClick(cat, component);
                              }
                            }}
                          >
                            <div className="font-medium" style={{color: isDisabled ? '#9ca3af' : '#fcd34d'}}>{component.name}</div>
                            
                            {component.faction && (
                              <div className="flex items-center gap-1 text-xs font-medium mt-1" style={{color: isDisabled ? '#9ca3af' : '#276afaff'}}>
                                {component.icon && <img src={component.icon} alt={component.faction} style={{width: '1rem', height: '1rem'}} />}
                                {component.faction}
                              </div>
                            )}
                            

                            {component.description && (
                              <div className="text-xs line-clamp-2 mt-1" style={{color: isDisabled ? '#6b7280' : '#fff'}}>
                                {component.description.length > 100 
                                  ? component.description.substring(0, 100) + "..." 
                                  : component.description
                                }
                              </div>
                            )}
                            
                            {isDisabled && (
                              <div className="text-xs font-medium mt-1" style={{color: '#dc2626'}}>
                                Cannot pick (limit reached)
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
);
}*/

import React, { useState } from "react";
import './UnifiedStyles.css';

export default function Sidebar({ 
  categories, 
  onSelectCategory, 
  playerProgress, 
  draftLimits, 
  selectedCategory,
  availableComponents = {},
  onComponentClick,
  isMultiplayer = false,
  draftVariant = "franken"
}) {
  const [expandedCategory, setExpandedCategory] = useState(selectedCategory);

  const formatCategoryName = (category) => {
    return category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleCategoryClick = (category) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      onSelectCategory(null);
    } else {
      setExpandedCategory(category);
      onSelectCategory(category);
    }
  };

  const handleComponentClick = (category, component) => {
    if (onComponentClick) {
      onComponentClick(category, component);
    }
  };

  return (
  // Sidebar container — header-level toggle moved to DraftSimulator so this file only renders the panel
  <div className={`sidebar ${typeof arguments[0].isOpen !== 'undefined' && arguments[0].isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Draft Categories</h2>
          <div className="sidebar-subtitle">
            Click categories to view available components
          </div>
          {draftVariant === "rotisserie" && (
            <div className="text-xs font-medium mt-1" style={{color: '#f97316'}}>
              Rotisserie Mode: One pick per turn
            </div>
          )}
        </div>

        <div className="sidebar-content">
          {categories.map(cat => {
            const progress = playerProgress[cat] || 0;
            const limit = draftLimits[cat] || 0;
            const isExpanded = expandedCategory === cat;
            const components = availableComponents[cat] || [];
            const canPick = progress < limit;

            return (
              <div key={cat} className="sidebar-category">
                <button
                  className={`sidebar-category-button ${isExpanded ? 'sidebar-category-button-expanded' : ''}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{formatCategoryName(cat)}</div>
                      <div className="text-sm" style={{color: '#ffffffff'}}>
                        {progress}/{limit} selected
                        {!canPick && <span style={{color: '#dc2626', marginLeft: '0.25rem'}}>(MAX)</span>}
                      </div>
                      {components.length > 0 && (
                        <div className="text-xs" style={{color: isExpanded ? '#2563eb' : '#3b82f6'}}>
                          {components.length} available
                        </div>
                      )}
                    </div>
                    <div style={{color: isExpanded ? '#374151' : '#9ca3af'}}>
                      {isExpanded ? "▲" : "▼"}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="sidebar-category-content">
                    {components.length === 0 ? (
                      <div className="empty-state">
                        No components available in your {draftVariant === "rotisserie" ? "pool" : "bag"}
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="text-xs mb-2" style={{color: '#bfc3caff', paddingLeft: '0.25rem'}}>
                          {draftVariant === "rotisserie" ? "Shared Pool" : "Your Bag"} • Click to pick
                        </div>

                        {components
                          .sort((a, b) => {
                            const factionSort = (a.faction || "").localeCompare(b.faction || "");
                            if (factionSort !== 0) return factionSort;
                            return (a.name || "").localeCompare(b.name || "");
                          })
                          .map((component, idx) => {
                            const isDisabled = !canPick || (draftVariant === "rotisserie" && !canPick);
                            const isTile = !!(component.planets || component.anomalies || component.wormhole);
                            const isUnit = !!(component.cost !== undefined && component.combat);
                            
                            return (
                              <div
                                key={component.id || component.name || idx}
                                className={`sidebar-component-item ${isDisabled ? 'sidebar-component-item-disabled' : ''}`}
                                onClick={() => {
                                  if (!isDisabled) {
                                    handleComponentClick(cat, component);
                                  }
                                }}
                              >
                                <div className="font-medium" style={{color: isDisabled ? '#9ca3af' : '#fcd34d'}}>
                                  {component.name}
                                </div>

                                {component.faction && (
                                  <div className="flex items-center gap-1 text-xs font-medium mt-1" style={{color: isDisabled ? '#9ca3af' : '#276afaff'}}>
                                    {component.icon && <img src={component.icon} alt={component.faction} style={{width: '1rem', height: '1rem'}} />}
                                    {component.faction}
                                  </div>
                                )}

                                {/* Unit stats */}
                                {isUnit && (
                                  <div className="text-xs mt-1 flex gap-2" style={{color: isDisabled ? '#9ca3af' : '#fff'}}>
                                    {component.cost !== undefined && <span>Cost: {component.cost}</span>}
                                    <span>Combat: {component.combat}</span>
                                    {component.move !== undefined && <span>Move: {component.move}</span>}
                                    {component.capacity !== undefined && <span>Cap: {component.capacity}</span>}
                                  </div>
                                )}

                                {/* Tile info */}
                                {isTile && component.planets && (
                                  <div className="text-xs mt-1" style={{color: isDisabled ? '#9ca3af' : '#6ee7b7'}}>
                                    {component.planets.map(p => (
                                      <div key={p.name}>
                                        {p.name}: {p.resource}R/{p.influence}I
                                        {p.traits && p.traits.length > 0 && ` [${p.traits.join(', ')}]`}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {component.description && !isTile && (
                                  <div className="text-xs line-clamp-2 mt-1" style={{color: isDisabled ? '#6b7280' : '#fff'}}>
                                    {component.description.length > 100 
                                      ? component.description.substring(0, 100) + "..." 
                                      : component.description}
                                  </div>
                                )}
                                
                                {isDisabled && (
                                  <div className="text-xs font-medium mt-1" style={{color: '#dc2626'}}>
                                    Cannot pick (limit reached)
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
  );
}

