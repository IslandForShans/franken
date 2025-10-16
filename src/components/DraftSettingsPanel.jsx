import React from "react";
import './UnifiedStyles.css';

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
  <div className="settings-panel">
    <h3 className="settings-title">Draft Settings</h3>
    <div className="settings-row">
      <label className="settings-label">Players:
        <input type="number" value={playerCount} min={2} max={8} onChange={e=>setPlayerCount(parseInt(e.target.value))} className="input input-sm" style={{width: '4rem', marginLeft: '0.25rem'}}/>
      </label>
      <label className="settings-label">Variant:
        <select value={draftVariant} onChange={e=>setDraftVariant(e.target.value)} className="input input-sm" style={{marginLeft: '0.25rem'}}>
          <option value="franken">Franken</option>
          <option value="rotisserie">Rotisserie</option>
          <option value="power">Power Draft</option>
        </select>
      </label>
    </div>
    <div className="settings-row">
      <label className="settings-label">First Round Picks:
        <input type="number" value={firstRoundPickCount} onChange={e=>setFirstRoundPickCount(parseInt(e.target.value))} className="input input-sm" style={{width: '4rem', marginLeft: '0.25rem'}}/>
      </label>
      <label className="settings-label">Subsequent Picks:
        <input type="number" value={subsequentRoundPickCount} onChange={e=>setSubsequentRoundPickCount(parseInt(e.target.value))} className="input input-sm" style={{width: '4rem', marginLeft: '0.25rem'}}/>
      </label>
    </div>
    <div className="settings-grid">
      {Object.keys(draftLimits).map(cat => (
        <label key={cat} className="settings-label">
          {cat}:
          <input type="number" value={draftLimits[cat]} onChange={e=>handleLimitChange(cat, e.target.value)} className="input input-sm" style={{width: '4rem', marginLeft: '0.25rem'}}/>
        </label>
      ))}
    </div>
  </div>
);
}