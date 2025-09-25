import React from "react";

const calculateRI = (tiles) => {
  let totalResource = 0;
  let totalInfluence = 0;

  tiles.forEach(tile => {
    if (tile.planets) {
      tile.planets.forEach(p => {
        totalResource += p.resource || 0;
        totalInfluence += p.influence || 0;
      });
    }
  });

  const optimal = Math.min(totalResource, totalInfluence);
  const leftoverResource = totalResource - optimal;
  const leftoverInfluence = totalInfluence - optimal;

  return { totalResource, totalInfluence, optimal, leftoverResource, leftoverInfluence };
};

export default function DraftSummary({ factions }) {
  return (
    <div className="border p-4 rounded shadow bg-gray-50">
      <h2 className="text-xl font-bold mb-2">Draft Summary</h2>
      {factions.map((f, i) => {
        const blueTiles = f.blue_tiles || [];
        const redTiles = f.red_tiles || [];
        const allTiles = [...blueTiles, ...redTiles];
        const ri = calculateRI(allTiles);

        return (
          <div key={i} className="mb-4 border-b pb-2">
            <h3 className="font-semibold">{f.name}</h3>

            <div className="ml-2 mb-2">
              <strong>Tiles</strong>
              <ul className="ml-2">
                {allTiles.map((tile, idx) => (
                  <li key={idx}>
                    {tile.name}
                    {tile.wormhole && <span className="text-purple-600"> W:{tile.wormhole}</span>}
                    {tile.anomalies && tile.anomalies.length>0 && <span className="text-red-600"> A:{tile.anomalies.join(", ")}</span>}
                    {tile.planets && tile.planets.map(p => (
                      <div key={p.name} className="ml-2 text-xs">
                        {p.name}: R={p.resource}, I={p.influence}
                        {p.traits.length>0 && `, Traits: ${p.traits.join(", ")}`}
                        {p.technology_specialty.length>0 && `, Tech: ${p.technology_specialty.join(", ")}`}
                        {p.legendary_ability && `, Legendary: ${p.legendary_ability}`}
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </div>

            <div className="ml-2 mb-2 text-sm">
              <strong>Resource/Influence Summary:</strong>
              <div>Total Resource: {ri.totalResource}</div>
              <div>Total Influence: {ri.totalInfluence}</div>
              <div>Optimal (Balanced) R/I: {ri.optimal}</div>
              <div>Leftover Resource: {ri.leftoverResource}</div>
              <div>Leftover Influence: {ri.leftoverInfluence}</div>
            </div>

            {Object.keys(f).filter(c => !["name","blue_tiles","red_tiles"].includes(c)).map(cat => (
              <div key={cat} className="ml-2 mb-1">
                <strong>{cat} ({f[cat].length})</strong>
                <ul className="ml-2">
                  {f[cat].map((item, idx) => (
                    <li key={idx}>
                      {item.name}
                      {item.wormhole && <span className="text-purple-600"> W:{item.wormhole}</span>}
                      {item.anomalies && item.anomalies.length>0 && <span className="text-red-600"> A:{item.anomalies.join(", ")}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}