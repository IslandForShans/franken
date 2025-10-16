import React, { useState } from "react";
import ComponentViewer from "./ComponentViewer.jsx";

export default function TheorycraftingPanel({ factionsData, draftLimits }) {
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [activeComponents, setActiveComponents] = useState({});

  const handleAdd = (cat, item) => {
    setActiveComponents(prev => ({
      ...prev,
      [cat]: [...(prev[cat] || []), item]
    }));
  };

  const handleRemove = (cat, idx) => {
    const copy = {...activeComponents};
    copy[cat].splice(idx,1);
    setActiveComponents(copy);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white min-h-screen rounded-xl shadow-lg border border-gray-700 p-4">
      <select value={selectedFaction} onChange={e=>setSelectedFaction(e.target.value)} className="input mb-2">
        <option value="">Select Faction</option>
        {factionsData.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
      </select>

      {selectedFaction && (
        <>
          {Object.keys(draftLimits).map(cat => (
            <div key={cat} className="mb-2">
              <h4 className="font-semibold">{cat}</h4>
              <ComponentViewer
                category={cat}
                data={[...(factionsData.find(f => f.name === selectedFaction)[cat] || [])]}
                factions={factionsData}
                selectedFaction={selectedFaction}
                onFactionChange={()=>{}}
                onComponentClick={item=>handleAdd(cat, item)}
              />
              <div className="mt-1">
                {activeComponents[cat] && activeComponents[cat].map((item, idx)=>(
                  <div key={idx} className="border p-1 rounded mb-1 flex justify-between">
                    <span>{item.name}</span>
                    <button onClick={()=>handleRemove(cat, idx)} style={{color: '#dc2626'}}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
