import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import "./UnifiedStyles.css";

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

  // Hover preview state
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef(null);

  const supportsHover =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(hover: hover)").matches;

  const formatCategoryName = (category) =>
    category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

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

  const clampToViewport = (x, y, width = 300, height = 420) => {
    const padding = 12;
    const maxX = window.innerWidth - width - padding;
    const maxY = window.innerHeight - height - padding;

    return {
      x: Math.min(x, maxX),
      y: Math.min(y, maxY)
    };
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Draft Categories</h2>
        <div className="sidebar-subtitle">
          Click categories to view available components
        </div>
      </div>

      <div className="sidebar-content">
        {categories.map((cat) => {
          const progress = playerProgress[cat] || 0;
          const limit = draftLimits[cat] || 0;
          const isExpanded = expandedCategory === cat;
          const components = availableComponents[cat] || [];
          const canPick = progress < limit;

          return (
            <div key={cat} className="sidebar-category">
              <button
                className={`sidebar-category-button ${
                  isExpanded ? "sidebar-category-button-expanded" : ""
                }`}
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {formatCategoryName(cat)}
                    </div>
                    <div className="text-sm">
                      {progress}/{limit} selected
                    </div>
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
                            isDisabled
                              ? "sidebar-component-item-disabled"
                              : ""
                          }`}
                          onClick={() =>
                            !isDisabled &&
                            handleComponentClick(cat, component)
                          }
                          onMouseEnter={(e) => {
                            if (!supportsHover) return;

                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const pos = clampToViewport(
                              rect.right + 12,
                              rect.top
                            );

                            hoverTimeoutRef.current = setTimeout(() => {
                              setHoverPosition(pos);
                              setHoveredComponent({
                                component,
                                category: cat
                              });
                            }, 150);
                          }}
                          onMouseLeave={() => {
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                            }
                            setHoveredComponent(null);
                          }}
                        >
                          <div className="font-medium">
                            {component.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* === Hover Preview (Portal) === */}
      {hoveredComponent &&
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

            {/* Unit Stats for Flagship and Mech */}
            {(hoveredComponent.category === 'flagship' || hoveredComponent.category === 'mech') && hoveredComponent.component.combat && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {hoveredComponent.component.cost !== undefined && (
                    <div>
                      <span className="font-semibold text-yellow-400">Cost:</span>{' '}
                      <span className="text-white">{hoveredComponent.component.cost}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-red-400">Combat:</span>{' '}
                    <span className="text-white">{hoveredComponent.component.combat}</span>
                  </div>
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
