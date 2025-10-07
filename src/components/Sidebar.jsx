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
                              
                              {/* Tech card format - single tech or tech package */}
                              {(cat === 'faction_techs' || cat === 'starting_techs') && (
                                <div className="text-xs mt-2 border-t pt-2">
                                  {/* Check if this is a tech package (multiple techs) */}
                                  {component.techs && component.techs.length > 0 ? (
                                    <div className="space-y-2">
                                      {component.choose_count && (
                                        <div className="text-[11px] font-semibold text-orange-600 mb-1 pb-1 border-b border-orange-200">
                                          {component.note || `Choose ${component.choose_count} of the following:`}
                                        </div>
                                      )}
                                      {component.techs.map((tech, techIdx) => (
                                        <div key={techIdx} className="pb-2 border-b last:border-b-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-800">{tech.name}</span>
                                            {tech.tech_type && (
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                tech.tech_type === 'Blue' ? 'bg-blue-500 text-white' :
                                                tech.tech_type === 'Red' ? 'bg-red-500 text-white' :
                                                tech.tech_type === 'Green' ? 'bg-green-500 text-white' :
                                                tech.tech_type === 'Yellow' ? 'bg-yellow-500 text-white' :
                                                'bg-gray-500 text-white'
                                              }`}>
                                                {tech.tech_type}
                                              </span>
                                            )}
                                          </div>
                                          {tech.description && (
                                            <div className="text-gray-700 italic text-[11px]">
                                              {tech.description}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    /* Single tech display */
                                    <>
                                      <div className="flex items-center gap-2 mb-1">
                                        {component.tech_type && (
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                            component.tech_type === 'Blue' ? 'bg-blue-500 text-white' :
                                            component.tech_type === 'Red' ? 'bg-red-500 text-white' :
                                            component.tech_type === 'Green' ? 'bg-green-500 text-white' :
                                            component.tech_type === 'Yellow' ? 'bg-yellow-500 text-white' :
                                            'bg-gray-500 text-white'
                                          }`}>
                                            {component.tech_type}
                                          </span>
                                        )}
                                        {component.prerequisites && component.prerequisites.length > 0 && (
                                          <div className="flex gap-1 items-center">
                                            <span className="text-gray-600 text-[10px]">Req:</span>
                                            {component.prerequisites.map((prereq, idx) => (
                                              <span key={idx} className={`w-3 h-3 rounded-full ${
                                                prereq === 'Blue' ? 'bg-blue-500' :
                                                prereq === 'Red' ? 'bg-red-500' :
                                                prereq === 'Green' ? 'bg-green-500' :
                                                prereq === 'Yellow' ? 'bg-yellow-500' :
                                                'bg-gray-500'
                                              }`} title={prereq}></span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* For unit upgrade techs */}
                                      {component.combat && (
                                        <>
                                          {component.abilities && component.abilities.length > 0 && (
                                            <div className="font-semibold text-purple-700 mb-1">
                                              {component.abilities.join(', ')}
                                            </div>
                                          )}
                                          {component.description && (
                                            <div className="text-gray-700 mb-1 italic">
                                              {component.description}
                                            </div>
                                          )}
                                          <div className="flex gap-2 text-gray-800 font-mono text-[10px] bg-gray-100 p-1 rounded">
                                            {component.cost !== undefined && <span>Cost: {component.cost}</span>}
                                            <span>Combat: {component.combat}</span>
                                            {component.move !== undefined && <span>Move: {component.move}</span>}
                                            {component.capacity !== undefined && <span>Capacity: {component.capacity}</span>}
                                          </div>
                                        </>
                                      )}
                                      
                                      {/* For non-unit techs */}
                                      {!component.combat && component.description && (
                                        <div className="text-gray-700 italic">
                                          {component.description}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                              
                              {/* Unit card format for flagship and mech */}
                              {(cat === 'flagship' || cat === 'mech') && component.combat && (
                                <div className="text-xs mt-2 border-t pt-2">
                                  {component.abilities && component.abilities.length > 0 && (
                                    <div className="font-semibold text-purple-700 mb-1">
                                      {component.abilities.join(', ')}
                                    </div>
                                  )}
                                  {component.description && (
                                    <div className="text-gray-700 mb-1 italic">
                                      {component.description}
                                    </div>
                                  )}
                                  
                                  {/* Check for variants (different stats by location) */}
                                  {component.variants && component.variants.length > 0 ? (
                                    <div className="space-y-1">
                                      {component.variants.map((variant, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-gray-800 font-mono text-[10px] bg-gray-100 p-1 rounded">
                                          <span className="font-semibold text-blue-600">{variant.location}:</span>
                                          {component.cost !== undefined && idx === 0 && <span>Cost: {component.cost}</span>}
                                          <span>Combat: {variant.combat}</span>
                                          {variant.move !== undefined && <span>Move: {variant.move}</span>}
                                          {variant.capacity !== undefined && <span>Capacity: {variant.capacity}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    /* Standard single stat line */
                                    <div className="flex gap-2 text-gray-800 font-mono text-[10px] bg-gray-100 p-1 rounded">
                                      {component.cost !== undefined && <span>Cost: {component.cost}</span>}
                                      {component.combat && <span>Combat: {component.combat}</span>}
                                      {component.move !== undefined && <span>Move: {component.move}</span>}
                                      {component.capacity !== undefined && <span>Capacity: {component.capacity}</span>}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Regular description for non-units and non-techs */}
                              {!(cat === 'flagship' || cat === 'mech' || cat === 'faction_techs' || cat === 'starting_techs') && component.description && (
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