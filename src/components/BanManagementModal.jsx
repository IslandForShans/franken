import React, { useState } from "react";
import factionsJSONRaw from "../data/factions.json";
import { processFactionData } from "../utils/dataProcessor.js";

// Process faction data for icons
const factionsJSON = processFactionData(factionsJSONRaw);

export default function BanManagementModal({
  isOpen,
  onClose,
  bannedFactions,
  bannedComponents,
  onBanFaction,
  onBanComponent,
  categories
}) {
  const [componentSearchTerm, setComponentSearchTerm] = useState("");

  if (!isOpen) return null;

  const getAllComponentsForBanning = () => {
    const allComponents = [];
    categories.forEach(category => {
      const categoryComponents = [
        ...(factionsJSON.factions.flatMap(f => 
          (f[category] || []).map(comp => ({
            ...comp,
            faction: f.name,
            category,
            displayName: `${comp.name} (${f.name} - ${category})`
          }))
        )),
        ...(factionsJSON.tiles[category] || []).map(comp => ({
          ...comp,
          category,
          displayName: `${comp.name} (${category})`
        }))
      ];
      allComponents.push(...categoryComponents);
    });
    return allComponents;
  };

  const allComponents = getAllComponentsForBanning();
  const filteredComponents = componentSearchTerm 
    ? allComponents.filter(comp => 
        comp.name.toLowerCase().includes(componentSearchTerm.toLowerCase()) ||
        comp.faction?.toLowerCase().includes(componentSearchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Ban Management</h3>
          <button 
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Close
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Faction Bans - FIXED: Added proper flex and overflow */}
          <div className="border rounded p-4 flex flex-col min-h-0">
            <h4 className="font-semibold mb-3 flex-shrink-0">
              Banned Factions ({bannedFactions.size})
            </h4>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
              {factionsJSON.factions.map(faction => {
                const isBanned = bannedFactions.has(faction.name);
                return (
                  <div 
                    key={faction.name}
                    className="flex items-center hover:bg-gray-100 p-2 rounded cursor-pointer flex-shrink-0"
                    onClick={() => onBanFaction(faction.name)}
                  >
                    <input 
                      type="checkbox" 
                      checked={isBanned}
                      onChange={() => {}}
                      className="mr-3 pointer-events-none flex-shrink-0"
                    />
                    <span className={`${isBanned ? "line-through text-gray-500" : ""} text-sm`}>
                      {faction.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Component Bans - FIXED: Added proper flex and overflow */}
          <div className="border rounded p-4 flex flex-col min-h-0">
            <h4 className="font-semibold mb-3 flex-shrink-0">
              Component Bans ({bannedComponents.size})
            </h4>
            
            <input 
              type="text" 
              placeholder="Search components to ban..."
              value={componentSearchTerm}
              onChange={(e) => setComponentSearchTerm(e.target.value)}
              className="w-full border p-2 rounded mb-3 flex-shrink-0"
            />
            
            {componentSearchTerm && (
              <div className="max-h-40 overflow-y-auto border rounded p-2 mb-3 bg-gray-50 flex-shrink-0">
                {filteredComponents.slice(0, 20).map((comp, idx) => (
                  <div 
                    key={`${comp.name}-${comp.faction}-${idx}`}
                    className="flex justify-between items-center py-1 hover:bg-gray-100 px-2 rounded"
                  >
                    <span className="text-sm truncate">{comp.displayName}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        onBanComponent(comp.id || comp.name);
                        setComponentSearchTerm("");
                      }}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2 flex-shrink-0"
                    >
                      Ban
                    </button>
                  </div>
                ))}
                {filteredComponents.length > 20 && (
                  <div className="text-xs text-gray-500 p-2">
                    Showing first 20 results. Refine search for more.
                  </div>
                )}
              </div>
            )}

            <div className="text-sm text-gray-600 mb-2 font-medium flex-shrink-0">
              Currently Banned:
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 text-sm space-y-1">
              {Array.from(bannedComponents).map(compId => (
                <div 
                  key={compId} 
                  className="flex justify-between items-center bg-red-50 p-2 rounded flex-shrink-0"
                >
                  <span className="truncate flex-1">{compId}</span>
                  <button 
                    type="button"
                    onClick={() => onBanComponent(compId)}
                    className="text-red-600 hover:underline ml-2 text-xs flex-shrink-0"
                  >
                    Unban
                  </button>
                </div>
              ))}
              {bannedComponents.size === 0 && (
                <div className="text-gray-500 italic">No components banned</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between flex-shrink-0">
          <button 
            type="button"
            onClick={() => {
              Array.from(bannedFactions).forEach(f => onBanFaction(f));
              Array.from(bannedComponents).forEach(c => onBanComponent(c));
            }}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Clear All Bans
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
