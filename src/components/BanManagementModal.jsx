import React, { useState } from "react";
import { createPortal } from "react-dom";
import factionsJSONRaw from "../data/factions.json";
import discordantStarsJSONRaw from "../data/discordant-stars.json";
import { processFactionData } from "../utils/dataProcessor.js";
import './UnifiedStyles.css';

const factionsJSON = processFactionData(factionsJSONRaw);
const discordantStarsJSON = processFactionData(discordantStarsJSONRaw);

export default function BanManagementModal({
  isOpen,
  onClose,
  bannedFactions,
  bannedComponents,
  onBanFaction,
  onBanComponent,
  categories,
  expansionsEnabled = { pok: true, te: false, ds: false, us: false, firmobs: false }
}) {
  const [componentSearchTerm, setComponentSearchTerm] = useState("");

  if (!isOpen) return null;

  // Expansion exclusions (from DraftSimulator.jsx)
  const pokExclusions = {
    factions: ["The Nomad", "The Vuil'Raith Cabal", "The Argent Flight", "The Titans of Ul", "The Mahact Gene-Sorcerers", "The Empyrean", "The Naaz-Rokha Alliance"],
    tiles: ["59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80"]
  };

  const teExclusions = {
    factions: ["The Council Keleres", "The Deepwrought Scholarate", "The Ral Nel Consortium", "Last Bastion", "The Crimson Rebellion"],
    tiles: ["97", "98", "99", "100", "101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "113", "114", "115", "116", "117"]
  };

  const noFirmament = {
    factions: ["The Firmament", "The Obsidian"]
  };

  // Filter factions based on expansion settings
  const getFilteredFactions = () => {
    let factions = [...factionsJSON.factions];
    
    // Filter out PoK factions if PoK is disabled
    if (!expansionsEnabled.pok) {
      factions = factions.filter(f => !pokExclusions.factions.includes(f.name));
    }
    
    // Filter out TE factions if TE is disabled
    if (!expansionsEnabled.te) {
      factions = factions.filter(f => !teExclusions.factions.includes(f.name));
    }
    
    // Filter out Firmament/Obsidian if disabled
    if (!expansionsEnabled.firmobs) {
      factions = factions.filter(f => !noFirmament.factions.includes(f.name));
    }
    
    // Add Discordant Stars factions if enabled
    if (expansionsEnabled.ds && discordantStarsJSON?.factions) {
      factions = [...factions, ...discordantStarsJSON.factions];
    }
    
    return factions;
  };

  const getAllComponentsForBanning = () => {
    const allComponents = [];
    const filteredFactions = getFilteredFactions();
    
    categories.forEach(category => {
      // Get components from base + enabled expansion factions
      const categoryComponents = filteredFactions.flatMap(f => 
        (f[category] || []).map(comp => ({
          ...comp,
          faction: f.name,
          category,
          displayName: `${comp.name} (${f.name} - ${category})`
        }))
      );
      
      // Get tiles based on expansion settings
      if (category === 'blue_tiles' || category === 'red_tiles') {
        let tiles = [...(factionsJSON.tiles[category] || [])];
        
        // Filter out PoK tiles if PoK is disabled
        if (!expansionsEnabled.pok) {
          tiles = tiles.filter(tile => !pokExclusions.tiles.includes(tile.id));
        }
        
        // Filter out TE tiles if TE is disabled
        if (!expansionsEnabled.te) {
          tiles = tiles.filter(tile => !teExclusions.tiles.includes(tile.id));
        }
        
        // Add Uncharted Space tiles if enabled
        if (expansionsEnabled.us && discordantStarsJSON?.tiles?.[category]) {
          tiles = [...tiles, ...discordantStarsJSON.tiles[category]];
        }
        
        const tileComponents = tiles.map(comp => ({
          ...comp,
          category,
          displayName: `${comp.name} (${category})`
        }));
        
        allComponents.push(...categoryComponents, ...tileComponents);
      } else {
        allComponents.push(...categoryComponents);
      }
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

  const filteredFactions = getFilteredFactions();

  const modalContent = (
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
              {filteredFactions.map(faction => {
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

  // Render using a portal to the document body
  return createPortal(modalContent, document.body);
}