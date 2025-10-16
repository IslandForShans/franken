import React, { useState } from "react";
import factionsJSONRaw from "../data/factions.json";
import { processFactionData } from "../utils/dataProcessor.js";
import './UnifiedStyles.css';

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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Ban Management</h3>
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Close
          </button>
        </div>

        <div className="ban-modal-grid modal-body">
          {/* Faction Bans */}
          <div className="ban-section">
            <h4 className="ban-section-header">
              Banned Factions ({bannedFactions.size})
            </h4>
            <div className="ban-list">
              {factionsJSON.factions.map(faction => {
                const isBanned = bannedFactions.has(faction.name);
                return (
                  <div 
                    key={faction.name}
                    className="ban-item"
                    onClick={() => onBanFaction(faction.name)}
                  >
                    <input 
                      type="checkbox" 
                      checked={isBanned}
                      onChange={() => {}}
                      className="checkbox"
                    />
                    <span className={isBanned ? "ban-item-checked text-sm" : "text-sm"}>
                      {faction.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Component Bans */}
          <div className="ban-section">
            <h4 className="ban-section-header">
              Component Bans ({bannedComponents.size})
            </h4>
            
            <input 
              type="text" 
              placeholder="Search components to ban..."
              value={componentSearchTerm}
              onChange={(e) => setComponentSearchTerm(e.target.value)}
              className="search-input mb-3"
              style={{flexShrink: 0}}
            />
            
            {componentSearchTerm && (
              <div style={{maxHeight: '10rem', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '0.25rem', padding: '0.5rem', marginBottom: '0.75rem', background: '#1f2937', flexShrink: 0}}>
                {filteredComponents.slice(0, 20).map((comp, idx) => (
                  <div 
                    key={`${comp.name}-${comp.faction}-${idx}`}
                    style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0'}}
                    className="ban-item-component"
                  >
                    <span className="text-sm truncate">{comp.displayName}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        onBanComponent(comp.id || comp.name);
                        setComponentSearchTerm("");
                      }}
                      className="btn btn-danger btn-sm"
                      style={{marginLeft: '0.5rem', flexShrink: 0}}
                    >
                      Ban
                    </button>
                  </div>
                ))}
                {filteredComponents.length > 20 && (
                  <div className="text-xs" style={{color: '#6b7280', padding: '0.5rem'}}>
                    Showing first 20 results. Refine search for more.
                  </div>
                )}
              </div>
            )}

            <div className="text-sm font-medium mb-2" style={{color: '#4b5563', flexShrink: 0}}>
              Currently Banned:
            </div>
            <div className="ban-list text-sm">
              {Array.from(bannedComponents).map(compId => (
                <div 
                  key={compId} 
                  style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fee2e2', padding: '0.5rem', borderRadius: '0.25rem', marginBottom: '0.25rem', flexShrink: 0}}
                >
                  <span className="truncate" style={{flex: 1}}>{compId}</span>
                  <button 
                    type="button"
                    onClick={() => onBanComponent(compId)}
                    style={{color: '#dc2626', marginLeft: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', flexShrink: 0}}
                  >
                    Unban
                  </button>
                </div>
              ))}
              {bannedComponents.size === 0 && (
                <div className="empty-state">No components banned</div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button"
            onClick={() => {
              Array.from(bannedFactions).forEach(f => onBanFaction(f));
              Array.from(bannedComponents).forEach(c => onBanComponent(c));
            }}
            className="btn btn-warning"
          >
            Clear All Bans
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}