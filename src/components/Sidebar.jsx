import React, { useState } from "react";

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
    <div className="w-80 border-r bg-gray-100 flex flex-col h-full">
      <div className="p-3 border-b bg-gray-200">
        <h2 className="font-bold text-lg">Draft Categories</h2>
        <div className="text-sm text-gray-600 mt-1">
          Click categories to view available components
        </div>
        {draftVariant === "rotisserie" && (
          <div className="text-xs text-orange-600 mt-1 font-medium">
            Rotisserie Mode: One pick per turn
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {categories.map(cat => {
          const progress = playerProgress[cat] || 0;
          const limit = draftLimits[cat] || 0;
          const isExpanded = expandedCategory === cat;
          const components = availableComponents[cat] || [];
          const canPick = progress < limit;

          return (
            <div key={cat} className="border-b">
              <button
                className={`w-full text-left p-3 hover:bg-gray-200 transition-colors ${
                  isExpanded ? "bg-blue-100 border-l-4 border-blue-500" : ""
                }`}
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{formatCategoryName(cat)}</div>
                    <div className="text-sm text-gray-600">
                      {progress}/{limit} selected
                      {!canPick && <span className="text-red-500 ml-1">(MAX)</span>}
                    </div>
                    {components.length > 0 && (
                      <div className="text-xs text-blue-600">
                        {components.length} available
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? "▲" : "▼"}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="bg-white border-t max-h-80 overflow-y-auto">
                  {components.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 italic">
                      No components available in your {draftVariant === "rotisserie" ? "pool" : "bag"}
                    </div>
                  ) : (
                    <div className="p-2">
                      <div className="text-xs text-gray-500 mb-2 px-1">
                        {draftVariant === "rotisserie" ? "Shared Pool" : "Your Bag"} • Click to pick
                      </div>
                      
                      {components
                        .sort((a, b) => {
                          // Sort by faction first, then by name
                          const factionSort = (a.faction || "").localeCompare(b.faction || "");
                          if (factionSort !== 0) return factionSort;
                          return (a.name || "").localeCompare(b.name || "");
                        })
                        .map((component, idx) => {
                          const isDisabled = !canPick || (draftVariant === "rotisserie" && !canPick);
                          
                          return (
                            <div
                              key={component.id || component.name || idx}
                              className={`p-2 mb-1 rounded border cursor-pointer transition-all text-sm ${
                                isDisabled 
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" 
                                  : "bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border-gray-300 hover:shadow-sm"
                              }`}
                              onClick={() => {
                                if (!isDisabled) {
                                  handleComponentClick(cat, component);
                                }
                              }}
                            >
                              <div className="font-medium text-gray-900">{component.name}</div>
                              
                              {component.faction && (
                                <div className="text-xs text-blue-600 font-medium">{component.faction}</div>
                              )}
                              
                              {component.description && (
                                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {component.description.length > 100 
                                    ? component.description.substring(0, 100) + "..." 
                                    : component.description
                                  }
                                </div>
                              )}
                              
                              {/* Show tile info for system tiles */}
                              {component.planets && component.planets.length > 0 && (
                                <div className="mt-1 border-t pt-1">
                                  {component.planets.map((planet, pIdx) => (
                                    <div key={pIdx} className="text-xs mb-1">
                                      <div className="font-semibold text-green-700">{planet.name}</div>
                                      <div className="text-gray-700">
                                        {planet.resource}R / {planet.influence}I
                                      </div>
                                      {planet.traits && planet.traits.length > 0 && (
                                        <div className="text-purple-600">
                                          {planet.traits.join(", ")}
                                        </div>
                                      )}
                                      {planet.technology_specialty && planet.technology_specialty.length > 0 && (
                                        <div className="text-orange-600">
                                          Tech: {planet.technology_specialty.join(", ")}
                                        </div>
                                      )}
                                      {planet.legendary_ability && (
                                        <div className="text-yellow-700 font-medium">
                                          Legendary: {planet.legendary_ability}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {component.anomalies && component.anomalies.length > 0 && (
                                <div className="text-xs text-red-600 mt-1 font-medium">
                                  Anomalies: {component.anomalies.join(", ")}
                                </div>
                              )}
                              
                              {component.wormhole && (
                                <div className="text-xs text-purple-600 mt-1 font-medium">
                                  Wormhole: {component.wormhole}
                                </div>
                              )}

                              {isDisabled && (
                                <div className="text-xs text-red-500 mt-1 font-medium">
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