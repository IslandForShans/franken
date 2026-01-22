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

                          {cat === "starting_techs" && (
                            <div className="text-xs mt-1">
                              {component.note && (
                                <div>
                                  <strong>Note:</strong> {component.note}
                                </div>
                              )}
                              {Array.isArray(component.techs) && (
                                <ul className="list-disc list-inside">
                                  {component.techs.map((t, i) => (
                                    <li key={i}>
                                      {typeof t === "string"
                                        ? t
                                        : t.name}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
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

            {Array.isArray(hoveredComponent.component.techs) && (
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

            {hoveredComponent.component.description && (
              <div
                className="text-sm italic"
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: 1.4
                }}
              >
                {hoveredComponent.component.description}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
