import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./UnifiedStyles.css";
import { ICON_MAP } from "../utils/dataProcessor";

const TECH_ICONS = {
  red: ICON_MAP.techColors.Red,
  blue: ICON_MAP.techColors.Blue,
  green: ICON_MAP.techColors.Green,
  yellow: ICON_MAP.techColors.Yellow
};

export default function Sidebar({
  categories,
  onSelectCategory,
  playerProgress,
  draftLimits,
  selectedCategory,
  availableComponents = {},
  onComponentClick,
  draftVariant = "franken",
  defaultCollapsed = false,
  isSearching = false,
  noWrapper = false
}) {
  const [expandedCategory, setExpandedCategory] = useState(selectedCategory);
  const [showAllComponents, setShowAllComponents] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState(() => {
  if (defaultCollapsed) {
    return new Set(categories);
  }
  return new Set();
});


  // Hover preview state
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Auto-expand categories with matches when searching
useEffect(() => {
  if (isSearching) {
    // Expand categories that have components, keep others collapsed
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      Object.keys(availableComponents).forEach(cat => {
        const components = availableComponents[cat] || [];
        if (components.length > 0) {
          newSet.delete(cat); // Expand if has components
        } else {
          newSet.add(cat); // Collapse if no components
        }
      });
      return newSet;
    });
  } else if (defaultCollapsed) {
    // When search is cleared, collapse all if defaultCollapsed is true
    setCollapsedCategories(new Set(categories));
  }
}, [isSearching, availableComponents, categories, defaultCollapsed]);

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

  const toggleCategoryCollapse = (category) => {
  setCollapsedCategories(prev => {
    const newSet = new Set(prev);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    return newSet;
  });
};

const toggleAllCategories = () => {
  const allCategories = Object.keys(availableComponents).filter(cat => {
    const components = availableComponents[cat] || [];
    return components.length > 0;
  });
  
  // If more than half are collapsed, expand all. Otherwise collapse all.
  const collapsedCount = allCategories.filter(cat => collapsedCategories.has(cat)).length;
  const shouldExpandAll = collapsedCount > allCategories.length / 2;
  
  if (shouldExpandAll) {
    setCollapsedCategories(new Set());
  } else {
    setCollapsedCategories(new Set(allCategories));
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

  const content = (
  <>
    <div className="sidebar-header">
      <h2 className="sidebar-title">Draft Categories</h2>
      <button
        onClick={toggleAllCategories}
        className="w-full py-1 mb-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        title="Expand/Collapse All"
      >
        {Object.keys(availableComponents).filter(cat => {
          const components = availableComponents[cat] || [];
          return components.length > 0 && collapsedCategories.has(cat);
        }).length > Object.keys(availableComponents).filter(cat => {
          const components = availableComponents[cat] || [];
          return components.length > 0;
        }).length / 2 ? 'Expand All' : 'Collapse All'}
      </button>
      <div className="sidebar-subtitle">
        Hover over components to view details!
      </div>
    </div>

    <div className="sidebar-content">
      {Object.keys(availableComponents).flatMap((cat) => {
  const components = availableComponents[cat] || [];
  const progress = playerProgress[cat] || 0;
  const limit = draftLimits[cat] || 0;
  const canPick = progress < limit;
  const isCollapsed = collapsedCategories.has(cat);

  // Skip categories with no components
  if (components.length === 0) {
    return [];
  }

  return [
    // Category header (always shown)
    <div
  key={`header-${cat}`}
  className="sidebar-category-header text-sm font-bold mb-1 mt-2 text-yellow-400 flex items-center justify-between cursor-pointer hover:bg-gray-800 rounded transition-colors"
  style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
  onClick={() => toggleCategoryCollapse(cat)}
>
      <span>{formatCategoryName(cat)}</span>
      <svg
        className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>,

    // Components (only shown when not collapsed)
    ...(!isCollapsed ? components.map((component, idx) => {
      const isDisabled = !canPick;

      return (

            <div
              key={component.id || component.name || idx}
              className={`sidebar-component-item ${
                isDisabled ? "sidebar-component-item-disabled" : ""
              }`}
              onClick={() => !isDisabled && handleComponentClick(cat, component)}
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
                {component.factionIcon && (
                  <img
                    src={component.factionIcon}
                    alt={component.faction}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span>{component.name}</span>

                {/* ===== TILE PLANET TRAIT + TECH SPECIALTY ICONS ===== */}
                {(cat === "red_tiles" || cat === "blue_tiles") &&
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

                {(cat === "red_tiles" || cat === "blue_tiles") &&
                  component.wormhole_icon && (
                    <img
                      src={component.wormhole_icon}
                      alt="wormhole"
                      title="Wormhole"
                      className="w-4 h-4"
                    />
                  )}

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

                {cat === "faction_techs" &&
                  Array.isArray(component.prerequisites) &&
                  component.prerequisites.map((p, i) => {
                    const color =
                      typeof p === "string"
                        ? p
                        : p.tech_type || p.color || "";
                    const key = color.toLowerCase();
                    const icon = TECH_ICONS[key];
                    if (!icon) return null;

                    return (
                      <img
                        key={i}
                        src={icon}
                        alt={`${color} tech`}
                        title={`${color} tech`}
                        className="w-4 h-4"
                      />
                    );
                  })}

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
              </div>
            </div>
          );
        }) : [])
      ];
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

            {/* Unit Stats for Flagship and Mech */}
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
    </>
  );

  return noWrapper ? content : <div className="sidebar">{content}</div>;
}