import React from "react";

export default function DraftSettingsPanel({
  playerCount, setPlayerCount,
  draftVariant, setDraftVariant,
  draftLimits, setDraftLimits,
  firstRoundPickCount, setFirstRoundPickCount,
  subsequentRoundPickCount, setSubsequentRoundPickCount
}) {
  const handleLimitChange = (cat, val) => {
    setDraftLimits({...draftLimits, [cat]: parseInt(val)});
  };

  return (
    <div className="border p-2 rounded mb-2 bg-gray-50">
      <h3 className="font-bold mb-1">Draft Settings</h3>
      <div className="flex space-x-2 mb-1">
        <label>Players:
          <input type="number" value={playerCount} min={2} max={8} onChange={e=>setPlayerCount(parseInt(e.target.value))} className="border ml-1 p-1 w-16"/>
        </label>
        <label>Variant:
          <select value={draftVariant} onChange={e=>setDraftVariant(e.target.value)} className="border ml-1 p-1">
            <option value="franken">Franken</option>
            <option value="rotisserie">Rotisserie</option>
            <option value="power">Power Draft</option>
          </select>
        </label>
      </div>
      <div className="flex space-x-2 mb-1">
        <label>First Round Picks:
          <input type="number" value={firstRoundPickCount} onChange={e=>setFirstRoundPickCount(parseInt(e.target.value))} className="border ml-1 p-1 w-16"/>
        </label>
        <label>Subsequent Picks:
          <input type="number" value={subsequentRoundPickCount} onChange={e=>setSubsequentRoundPickCount(parseInt(e.target.value))} className="border ml-1 p-1 w-16"/>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Object.keys(draftLimits).map(cat => (
          <label key={cat} className="text-xs">
            {cat}:
            <input type="number" value={draftLimits[cat]} onChange={e=>handleLimitChange(cat, e.target.value)} className="border ml-1 p-1 w-16"/>
          </label>
        ))}
      </div>
    </div>
  );
}