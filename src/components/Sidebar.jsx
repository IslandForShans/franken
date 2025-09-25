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
        {!isMultiplayer && (
          <div className="text-sm text-gray-600 mt-1">
            Click categories to view available components
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
                    </div>
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
                      No components available
                    </div>
                  ) : (
                    <div className="p-2">
                      {components
                        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                        .map((component, idx) => {
                          const isDisabled = !canPick || (draftVariant === "rotisserie" && progress >= limit);
                          
                          return (
                            <div
                              key={component.id || component.name || idx}
                              className={`p-2 mb-1 rounded border cursor-pointer transition-colors text-sm ${
                                isDisabled 
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                  : "bg-gray-50 hover:bg-blue-50 hover:border-blue-300"
                              }`}
                              onClick={() => {
                                if (!isDisabled) {
                                  handleComponentClick(cat, component);
                                }
                              }}
                            >
                              <div className="font-medium truncate">{component.name}</div>
                              {component.faction && (
                                <div className="text-xs text-blue-600">{component.faction}</div>
                              )}
                              {component.description && (
                                <div className="text-xs text-gray-600 truncate mt-1">
                                  {component.description}
                                </div>
                              )}
                              
                              {/* Show tile info for system tiles */}
                              {component.planets && component.planets.length > 0 && (
                                <div className="text-xs text-green-600 mt-1">
                                  {component.planets.map(p => 
                                    `${p.name} (${p.resource}/${p.influence})`
                                  ).join(", ")}
                                </div>
                              )}
                              
                              {component.anomalies && component.anomalies.length > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  {component.anomalies.join(", ")}
                                </div>
                              )}
                              
                              {component.wormhole && (
                                <div className="text-xs text-purple-600 mt-1">
                                  Wormhole: {component.wormhole}
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