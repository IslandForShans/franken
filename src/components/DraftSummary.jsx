import React from "react";
import { calculateOptimalResources } from "../utils/resourceCalculator.js";

export default function DraftSummary({ factions }) {
  return (
    <div className="border p-4 rounded shadow bg-gray-50">
      <h2 className="text-xl font-bold mb-2">Draft Summary</h2>
      {factions.map((f, i) => {
        const blueTiles = f.blue_tiles || [];
        const redTiles = f.red_tiles || [];
        const allTiles = [...blueTiles, ...redTiles];
        
        // Collect all planets from all tiles
        const allPlanets = [];
        allTiles.forEach(tile => {
          if (tile.planets) {
            tile.planets.forEach(p => {
              allPlanets.push({
                name: p.name,
                resource: p.resource || 0,
                influence: p.influence || 0,
                traits: p.traits || [],
                technology_specialty: p.technology_specialty || [],
                legendary_ability: p.legendary_ability
              });
            });
          }
        });

        // Calculate optimal resource assignment
        const resourceCalc = calculateOptimalResources(allPlanets);

        return (
          <div key={i} className="mb-4 border-b pb-2">
            <h3 className="font-semibold text-lg">{f.name}</h3>

            {/* Resource/Influence Summary */}
            <div className="ml-2 mb-3 p-3 bg-blue-50 rounded">
              <strong className="text-lg">Resource/Influence Summary:</strong>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-medium">Total Available:</div>
                  <div>{resourceCalc.totalResource} Resources</div>
                  <div>{resourceCalc.totalInfluence} Influence</div>
                </div>
                <div>
                  <div className="font-medium text-green-700">Optimal Assignment:</div>
                  <div className="text-lg font-bold text-green-700">
                    {resourceCalc.optimal}/{resourceCalc.optimal}
                  </div>
                  <div className="text-xs text-gray-600">
                    +{resourceCalc.leftoverResource + resourceCalc.leftoverInfluence} flex 
                    ({resourceCalc.leftoverResource}R or {resourceCalc.leftoverInfluence}I)
                  </div>
                </div>
              </div>

              {/* Show planet assignments */}
              {resourceCalc.assignment.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <div className="font-medium text-xs mb-1">Recommended Planet Usage:</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <div className="font-semibold text-blue-700">For Resources:</div>
                      {resourceCalc.assignment
                        .filter(a => a.usedFor === 'resource')
                        .map((a, idx) => (
                          <div key={idx}>
                            {a.planet.name} ({a.planet.resource}R)
                          </div>
                        ))}
                    </div>
                    <div>
                      <div className="font-semibold text-purple-700">For Influence:</div>
                      {resourceCalc.assignment
                        .filter(a => a.usedFor === 'influence')
                        .map((a, idx) => (
                          <div key={idx}>
                            {a.planet.name} ({a.planet.influence}I)
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tiles Detail */}
            <div className="ml-2 mb-2">
              <strong>Tiles ({allTiles.length}):</strong>
              <ul className="ml-2 text-sm">
                {allTiles.map((tile, idx) => (
                  <li key={idx} className="mb-2">
                    <div className="font-medium">{tile.name}</div>
                    {tile.wormhole && (
                      <span className="text-purple-600 text-xs">Wormhole: {tile.wormhole}</span>
                    )}
                    {tile.anomalies && tile.anomalies.length > 0 && (
                      <span className="text-red-600 text-xs ml-2">
                        Anomalies: {tile.anomalies.join(", ")}
                      </span>
                    )}
                    {tile.planets && tile.planets.map(p => (
                      <div key={p.name} className="ml-4 text-xs text-gray-700">
                        • {p.name}: {p.resource}R/{p.influence}I
                        {p.traits && p.traits.length > 0 && (
                          <span className="text-purple-600 ml-1">
                            [{p.traits.join(", ")}]
                          </span>
                        )}
                        {p.technology_specialty && p.technology_specialty.length > 0 && (
                          <span className="text-orange-600 ml-1">
                            Tech: {p.technology_specialty.join(", ")}
                          </span>
                        )}
                        {p.legendary_ability && (
                          <div className="text-yellow-700 ml-2 italic">
                            Legendary: {p.legendary_ability}
                          </div>
                        )}
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </div>

            {/* Other Components */}
            {Object.keys(f).filter(c => !["name","blue_tiles","red_tiles"].includes(c)).map(cat => {
              const items = f[cat] || [];
              if (items.length === 0) return null;
              
              return (
                <div key={cat} className="ml-2 mb-2">
                  <strong className="capitalize">
                    {cat.replace('_', ' ')} ({items.length}):
                  </strong>
                  <ul className="ml-2 text-sm">
                    {items.map((item, idx) => (
                      <li key={idx} className="text-gray-700">
                        {item.name}
                        {item.isSwap && <span className="text-blue-600 text-xs ml-1">[Swapped]</span>}
                        {item.isExtra && <span className="text-green-600 text-xs ml-1">[Extra]</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}