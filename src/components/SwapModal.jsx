import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./UnifiedStyles.css";
import { ICON_MAP } from "../utils/dataProcessor";

const TECH_ICONS = {
  red: ICON_MAP.techColors.Red,
  blue: ICON_MAP.techColors.Blue,
  green: ICON_MAP.techColors.Green,
  yellow: ICON_MAP.techColors.Yellow
};

export default function SwapModal({
  isOpen,
  swapOptions,
  triggerComponent,
  targetCategory,
  availableReplacements,
  onConfirm,
  onRefuse,
  onCancel
}) {
  const [step, setStep] = useState("chooseSwap"); // "chooseSwap" or "chooseReplace"
  const [selectedSwap, setSelectedSwap] = useState(null);

  if (!isOpen) return null;

  const handleSelectSwap = (option) => {
    setSelectedSwap(option);
    setStep("chooseReplace");
  };

  const handleSelectReplacement = (index) => {
    onConfirm(selectedSwap, index);
    // Reset state
    setStep("chooseSwap");
    setSelectedSwap(null);
  };

  const handleCancel = () => {
    setStep("chooseSwap");
    setSelectedSwap(null);
    onCancel();
  };

  const handleRefuse = () => {
    if (selectedSwap) {
      onRefuse(selectedSwap);
    } else if (swapOptions.length > 0) {
      onRefuse(swapOptions[0]);
    }
    setStep("chooseSwap");
    setSelectedSwap(null);
  };

  const renderComponentDetails = (component) => (
  <>
    <div className="swap-option-name">{component.name}</div>
    <div className="swap-option-faction">{component.faction}</div>
    
    {/* Tech type and prerequisites - for faction_techs */}
    {component.tech_type && (
      <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#9ca3af' }}>
        <span className="font-semibold">Type:</span> {component.tech_type}
        {component.prerequisites && component.prerequisites.length > 0 && (
          <div className="flex items-center gap-1 ml-2">
            <span className="font-semibold">Prerequisites:</span>
            {component.prerequisites.map((prereq, i) => {
              const techKey = prereq.toLowerCase();
              const icon = TECH_ICONS[techKey];
              if (!icon) return <span key={i}>{prereq}</span>;
              return (
                <img
                  key={i}
                  src={icon}
                  alt={`${prereq} prerequisite`}
                  className="w-4 h-4"
                />
              );
            })}
          </div>
        )}
      </div>
    )}

    {/* Synergies - for faction_techs */}
    {Array.isArray(component.synergies) && component.synergies.length > 0 && (
      <div className="mt-2 text-xs">
        <span className="font-semibold" style={{ color: '#9ca3af' }}>Synergies:</span>
        {component.synergies.map((syn, i) => {
          const primaryKey = syn.primary?.toLowerCase();
          const secondaryKey = syn.secondary?.toLowerCase();
          const primaryIcon = TECH_ICONS[primaryKey];
          const secondaryIcon = TECH_ICONS[secondaryKey];
          
          if (!primaryIcon || !secondaryIcon) return null;

          return (
            <div key={i} className="flex items-center gap-2 mt-1">
              <img src={primaryIcon} alt={`${syn.primary} tech`} className="w-4 h-4" />
              <img src="./icons/synergy-symbol.png" alt="synergy" className="w-3 h-3" />
              <img src={secondaryIcon} alt={`${syn.secondary} tech`} className="w-4 h-4" />
            </div>
          );
        })}
      </div>
    )}

    {/* Breakthrough synergy */}
    {Array.isArray(component.synergy) && component.synergy.length > 0 && (
      <div className="mt-2 text-xs">
        <span className="font-semibold" style={{ color: '#fbbf24' }}>Synergy:</span>
        {component.synergy.map((syn, i) => {
          const primaryKey = syn.primary?.toLowerCase();
          const secondaryKey = syn.secondary?.toLowerCase();
          const primaryIcon = TECH_ICONS[primaryKey];
          const secondaryIcon = TECH_ICONS[secondaryKey];
          
          if (!primaryIcon || !secondaryIcon) return null;

          return (
            <div key={i} className="flex items-center gap-2 mt-1">
              <img src={primaryIcon} alt={`${syn.primary} tech`} className="w-4 h-4" />
              <img src="./icons/synergy-symbol.png" alt="synergy" className="w-3 h-3" />
              <img src={secondaryIcon} alt={`${syn.secondary} tech`} className="w-4 h-4" />
            </div>
          );
        })}
      </div>
    )}
    
    {component.description && (
      <div className="text-xs mt-2" style={{ color: '#d1d5db', fontStyle: 'italic' }}>
        {component.description}
      </div>
    )}
    
    {/* Unit stats */}
    {(component.combat !== undefined || component.cost !== undefined || 
      component.move !== undefined || component.capacity !== undefined) && (
      <div className="text-xs mt-2 grid grid-cols-2 gap-1" style={{ color: '#fff' }}>
        {component.cost !== undefined && (
          <div><span className="font-semibold text-yellow-400">Cost:</span> {component.cost}</div>
        )}
        {component.combat !== undefined && (
          <div><span className="font-semibold text-red-400">Combat:</span> {component.combat}</div>
        )}
        {component.move !== undefined && (
          <div><span className="font-semibold text-blue-400">Move:</span> {component.move}</div>
        )}
        {component.capacity !== undefined && (
          <div><span className="font-semibold text-green-400">Capacity:</span> {component.capacity}</div>
        )}
      </div>
    )}
    
    {/* Unit abilities */}
    {component.abilities && component.abilities.length > 0 && (
      <div className="text-xs mt-2" style={{ color: '#c084fc' }}>
        <span className="font-semibold">Abilities:</span> {component.abilities.join(', ')}
      </div>
    )}

    {/* Planets - for tiles/home systems */}
    {component.planets && component.planets.length > 0 && (
      <div className="mt-2 text-xs border-t border-gray-700 pt-2">
        <div className="font-semibold mb-1" style={{ color: '#6ee7b7' }}>
          Planets ({component.planets.length}):
        </div>
        {component.planets.map((planet, idx) => (
          <div key={idx} className="ml-2 mb-2 pb-2 border-b border-gray-700 last:border-b-0">
            <div className="font-semibold" style={{ color: '#6ee7b7' }}>{planet.name}</div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div><span className="font-semibold text-yellow-400">R:</span> {planet.resource || 0}</div>
              <div><span className="font-semibold text-blue-400">I:</span> {planet.influence || 0}</div>
            </div>
            {planet.traits && planet.traits.length > 0 && (
              <div className="mt-1" style={{ color: '#c084fc' }}>
                <span className="font-semibold">Traits:</span> {planet.traits.join(', ')}
              </div>
            )}
            {planet.technology_specialty && planet.technology_specialty.length > 0 && (
              <div className="mt-1" style={{ color: '#fb923c' }}>
                <span className="font-semibold">Tech:</span> {planet.technology_specialty.join(', ')}
              </div>
            )}
            {planet.legendary_ability && (
              <div className="mt-1 p-1 rounded" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <span className="font-semibold" style={{ color: '#fbbf24' }}>Legendary:</span>{' '}
                <span style={{ color: '#fff', fontStyle: 'italic' }}>{planet.legendary_ability}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Wormhole - for tiles */}
    {component.wormhole && (
      <div className="text-xs mt-2" style={{ color: '#c084fc' }}>
        <span className="font-semibold">Wormhole:</span> {component.wormhole}
      </div>
    )}

    {/* Anomalies - for tiles */}
    {component.anomalies && component.anomalies.length > 0 && (
      <div className="text-xs mt-2" style={{ color: '#ef4444' }}>
        <span className="font-semibold">Anomalies:</span> {component.anomalies.join(', ')}
      </div>
    )}

    {/* Starting techs */}
    {component.note && (
      <div className="text-xs mt-2 font-semibold" style={{ color: '#fbbf24' }}>
        {component.note}
      </div>
    )}
    
    {Array.isArray(component.techs) && component.techs.length > 0 && (
      <div className="text-xs mt-2 border-t border-gray-700 pt-2">
        <div className="font-semibold mb-1" style={{ color: '#67e8f9' }}>Technologies:</div>
        {component.techs.map((t, i) => {
          const techColorMap = {
            'Blue': '#60a5fa',
            'Red': '#f87171',
            'Green': '#34d399',
            'Yellow': '#fcd34d'
          };
          const techColor = techColorMap[t.tech_type] || '#ffffff';
          
          return (
            <div key={i} className="ml-2" style={{ color: techColor }}>
              • {typeof t === "string" ? t : t.name}
              {t.description && (
                <div className="ml-3 text-xs italic" style={{ color: '#9ca3af' }}>
                  {t.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}

    {/* Commodity value */}
    {component.value !== undefined && (
      <div className="text-xs mt-2" style={{ color: '#fbbf24' }}>
        <span className="font-semibold">Commodity Value:</span> {component.value}
      </div>
    )}
  </>
);

  const modalContent = (
    <div className="swap-modal-overlay">
      <div className="swap-modal-content">
        {step === "chooseSwap" && (
          <>
            <h3 className="swap-modal-title">CHOOSE COMPONENT TO GAIN</h3>
            <div className="text-sm mb-4" style={{ color: '#9ca3af' }}>
              Triggered by: <span className="font-semibold text-blue-400">{triggerComponent?.name}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {swapOptions.map((option, idx) => (
                <div key={idx} className="swap-option">
                  <div className="swap-option-header">
                    <div style={{ flex: 1 }}>
                      {renderComponentDetails(option)}
                      <div className="swap-option-category mt-2">
                        Category: {option.category?.replace('_', ' ')}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSelectSwap(option)} 
                      className="btn btn-primary"
                    >
                      SELECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === "chooseReplace" && selectedSwap && (
  <>
    <h3 className="swap-modal-title">
      REPLACE WHICH {selectedSwap.category?.replace('_', ' ').toUpperCase()}?
    </h3>
    <div className="text-sm mb-4" style={{ color: '#9ca3af' }}>
      You selected: <span className="font-semibold text-green-400">{selectedSwap.name}</span>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {availableReplacements
        .filter(comp => !comp.isSwap)  // ADD THIS - Filter out already-swapped components
        .map((comp, idx) => {
          // We need to find the original index for the onConfirm callback
          const originalIndex = availableReplacements.indexOf(comp);
          
          return (
            <div key={idx} className="swap-option">
              <div className="swap-option-header">
                <div style={{ flex: 1 }}>
                  {renderComponentDetails(comp)}
                </div>
                <button 
                  onClick={() => handleSelectReplacement(originalIndex)} 
                  className="btn btn-danger"
                >
                  REPLACE
                </button>
              </div>
            </div>
          );
        })}
    </div>
    
    {/* ADD THIS - Show message if no replaceable components */}
    {availableReplacements.filter(comp => !comp.isSwap).length === 0 && (
      <div className="text-center p-4 text-sm" style={{ color: '#9ca3af' }}>
        All {selectedSwap.category?.replace('_', ' ')} components have already been swapped.
        <br />
        <span className="text-xs">You cannot swap a component that is already a swap.</span>
      </div>
    )}
    
    <button
      onClick={() => setStep("chooseSwap")}
      className="btn btn-secondary mt-4"
    >
      ← BACK TO SWAP OPTIONS
    </button>
  </>
)}

        <div className="swap-modal-footer">
          <button onClick={handleRefuse} className="btn btn-warning">
            REFUSE SWAP
          </button>
          <button onClick={handleCancel} className="btn btn-secondary">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}