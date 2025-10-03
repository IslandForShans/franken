import React, { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import FactionSheet from "./FactionSheet.jsx";
import DraftHistory from "./DraftHistory.jsx";
import DraftSettingsPanel from "./DraftSettingsPanel.jsx";
import DraftSummary from "./DraftSummary.jsx";
import FirebaseMultiplayerPanel from "./FirebaseMultiplayerPanel.jsx";
import { shuffleArray } from "../utils/shuffle.js";
import factionsJSON from "../data/factions.json";
import { isComponentUndraftable, getSwapOptions, getExtraComponents } from "../data/undraftable-components.js";
import BanManagementModal from "./BanManagementModal.jsx";

// Updated limits system
const baseFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 3, faction_techs: 2, agents: 1,
  commanders: 1, heroes: 1, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1
};

const powerFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 4, faction_techs: 3, agents: 2,
  commanders: 2, heroes: 2, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1
};

const defaultDraftLimits = Object.fromEntries(
  Object.entries(baseFactionLimits).map(([key, value]) => [key, value + 1])
);

const powerDraftLimits = Object.fromEntries(
  Object.entries(powerFactionLimits).map(([key, value]) => [key, value + 1])
);

export default function DraftSimulator() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [playerCount, setPlayerCount] = useState(4);
  const [factions, setFactions] = useState([]);
  const [draftHistory, setDraftHistory] = useState([]);
  const [playerBags, setPlayerBags] = useState([]);
  const [playerProgress, setPlayerProgress] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [round, setRound] = useState(1);
  const [draftLimits, setDraftLimits] = useState(defaultDraftLimits);
  const [draftVariant, setDraftVariant] = useState("franken");
  const [rotisseriePool, setRotisseriePool] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [picksThisRound, setPicksThisRound] = useState(0);
  const [draftStarted, setDraftStarted] = useState(false);
  const [draftPhase, setDraftPhase] = useState("draft");
  const [firstRoundPickCount, setFirstRoundPickCount] = useState(3);
  const [subsequentRoundPickCount, setSubsequentRoundPickCount] = useState(2);
  const [pendingPicks, setPendingPicks] = useState([]); // Temporary picks before submission
  const [isPickingPhase, setIsPickingPhase] = useState(true); // true = picking, false = locked in

  // Ban system
  const [bannedFactions, setBannedFactions] = useState(new Set());
  const [bannedComponents, setBannedComponents] = useState(new Set());

  // Multiplayer state
  const [multiplayerEnabled, setMultiplayerEnabled] = useState(false);
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [draftedComponents, setDraftedComponents] = useState({});

  const categories = Object.keys(baseFactionLimits);

  // Update limits when variant changes
  useEffect(() => {
    if (draftVariant === "rotisserie") {
      setDraftLimits(draftVariant === "power" ? powerFactionLimits : baseFactionLimits);
    } else {
      setDraftLimits(draftVariant === "power" ? powerDraftLimits : defaultDraftLimits);
    }
  }, [draftVariant]);

  // Component filtering with ban system - FIXED to exclude ALL undraftable types
  const getFilteredComponents = (category) => {
    return [
      ...(factionsJSON.factions
        .filter(f => !bannedFactions.has(f.name))
        .flatMap(f => (f[category] || [])
          .filter(comp => !bannedComponents.has(comp.id || comp.name))
          .filter(comp => {
            // Check if component is undraftable
            const undraftable = isComponentUndraftable(comp.name, f.name);
            // Exclude if undraftable exists (any type)
            // These components should only be available through swaps/adds during reduction
            return !undraftable;
          })
          .map(item => ({ ...item, faction: f.name }))
        )
      ),
      ...(factionsJSON.tiles[category] || [])
        .filter(comp => !bannedComponents.has(comp.id || comp.name))
        .filter(comp => {
          // Check tiles for undraftable status (though most won't have faction)
          const undraftable = isComponentUndraftable(comp.name);
          return !undraftable;
        })
    ];
  };

  const createBagsWithUniqueDistribution = () => {
    const bags = Array.from({ length: playerCount }, () => ({}));
    
    categories.forEach(category => {
      const allComponents = getFilteredComponents(category);
      const bagSize = Math.min(draftLimits[category], allComponents.length);
      
      let distributionPool = [];
      if (playerCount * bagSize <= allComponents.length) {
        distributionPool = shuffleArray([...allComponents]);
      } else {
        const timesToRepeat = Math.ceil((playerCount * bagSize) / allComponents.length);
        for (let i = 0; i < timesToRepeat; i++) {
          distributionPool = distributionPool.concat(
            allComponents.map(comp => ({ ...comp, copyIndex: i }))
          );
        }
        distributionPool = shuffleArray(distributionPool);
      }
      
      let componentIndex = 0;
      for (let playerIdx = 0; playerIdx < playerCount; playerIdx++) {
        bags[playerIdx][category] = [];
        for (let i = 0; i < bagSize && componentIndex < distributionPool.length; i++) {
          bags[playerIdx][category].push(distributionPool[componentIndex]);
          componentIndex++;
        }
      }
    });
    
    return bags;
  };

  const startDraftSolo = () => {
    const emptyFactions = Array.from({ length: playerCount }, (_, i) => {
      const f = { name: `Player ${i + 1}` };
      categories.forEach(cat => { f[cat] = []; });
      return f;
    });
    setFactions(emptyFactions);

    setPlayerProgress(Array.from({ length: playerCount }, () => {
      const p = {};
      categories.forEach(cat => { p[cat] = 0; });
      return p;
    }));

    if (draftVariant === "rotisserie") {
      const pool = {};
      categories.forEach(cat => {
        pool[cat] = getFilteredComponents(cat);
      });
      setRotisseriePool(pool);
      setPlayerBags([]);
    } else {
      const bags = createBagsWithUniqueDistribution();
      setPlayerBags(bags);
      setRotisseriePool({});
    }

    setDraftHistory([]);
    setCurrentPlayer(0);
    setRound(1);
    setPicksThisRound(0);
    setDraftPhase("draft");
    setDraftStarted(true);
  };

  const getAvailableComponents = () => {
    if (multiplayerEnabled) {
      return playerBags || {};
    } else if (draftVariant === "rotisserie") {
      return rotisseriePool;
    } else if (draftStarted && playerBags[currentPlayer]) {
      return playerBags[currentPlayer];
    }
    return {};
  };

  const handlePick = (category, component) => {
    if (!category || !component || !draftStarted || draftPhase !== "draft" || !isPickingPhase) return;

    const currentProgress = playerProgress[currentPlayer][category] || 0;
    const pendingCountInCategory = pendingPicks.filter(p => p.category === category).length;
  
    // Check total category limit
    if (currentProgress + pendingCountInCategory >= draftLimits[category]) {
        alert(`Cannot pick more ${category}. Limit: ${draftLimits[category]}`);
        return;
    }

    // NEW: Check if already picked one from this category this round
    if (pendingCountInCategory >= 1) {
        alert(`You can only pick one ${category.replace('_', ' ')} per round.`);
        return;
    }

    // Add to pending picks
    setPendingPicks(prev => [...prev, {
        category,
        component: { ...component }
    }]);
  };

  // Add function to remove from pending picks
  const handleRemovePendingPick = (category, componentId) => {
    setPendingPicks(prev => 
        prev.filter(pick => 
        !(pick.category === category && (pick.component.id || pick.component.name) === componentId)
        )
    );
  };

  // Add submit picks function
  const handleSubmitPicks = () => {
    if (draftVariant === "rotisserie") {
        // Rotisserie: must pick exactly 1
        if (pendingPicks.length !== 1) {
        alert("You must pick exactly 1 component in Rotisserie mode.");
        return;
        }
    } else {
        // Bag draft: must pick required amount
        const neededPicks = round === 1 ? firstRoundPickCount : subsequentRoundPickCount;
        if (pendingPicks.length < neededPicks) {
        alert(`You must pick ${neededPicks} components this round. Currently: ${pendingPicks.length}`);
        return;
        }
    }

    // Move pending picks to actual faction
    const fc = [...factions];
    const pg = [...playerProgress];

    pendingPicks.forEach(({ category, component }) => {
        fc[currentPlayer][category] = [...(fc[currentPlayer][category] || []), component];
        pg[currentPlayer][category] = (pg[currentPlayer][category] || 0) + 1;

        // Remove from bags/pools
        if (draftVariant === "rotisserie") {
        setRotisseriePool(prev => {
            const pool = { ...prev };
            const compId = component.id || component.name;
            pool[category] = pool[category].filter(c => (c.id || c.name) !== compId);
            return pool;
        });
        } else {
        setPlayerBags(prev => {
            const nb = [...prev];
            nb[currentPlayer] = { ...nb[currentPlayer] };
            const compId = component.id || component.name;
            nb[currentPlayer][category] = nb[currentPlayer][category].filter(c => (c.id || c.name) !== compId);
            return nb;
        });
        }

        // Add to history
        setDraftHistory(prev => [...prev, { 
        playerIndex: currentPlayer, 
        category, 
        item: component, 
        round,
        componentId: component.id || component.name
        }]);
    });

    setFactions(fc);
    setPlayerProgress(pg);
    setPendingPicks([]);
    setIsPickingPhase(false);

    // Move to next player after short delay
    setTimeout(() => {
        const nextPlayer = (currentPlayer + 1) % playerCount;
        setCurrentPlayer(nextPlayer);
        setIsPickingPhase(true);
        setPicksThisRound(0);
    
        if (nextPlayer === 0) {
        setRound(r => r + 1);
        // Rotate bags in bag draft
        if (draftVariant !== "rotisserie") {
            setPlayerBags(prev => {
            if (prev.length <= 1) return prev;
            const rotated = [...prev];
            const last = rotated.pop();
            rotated.unshift(last);
            return rotated;
            });
        }
      }

        // Check if draft is complete
        checkDraftCompletion();
    },    300);
  };

  const checkDraftCompletion = () => {
    if (draftVariant === "rotisserie") return; // Rotisserie doesn't need reduction

    const allPlayersComplete = factions.every(faction => 
      categories.every(cat => (faction[cat]?.length || 0) >= draftLimits[cat])
    );

    if (allPlayersComplete) {
      setDraftPhase("reduction");
    }
  };

  const getCurrentFactionLimits = () => {
    return draftVariant === "power" ? powerFactionLimits : baseFactionLimits;
  };

  const handleSwap = (playerIndex, category, componentIndex, swapOption) => {
    if (!swapOption) return;

    // Replace the component with its swap option
    const fc = [...factions];
    const originalComponent = fc[playerIndex][category][componentIndex];
    
    // Create swap component based on undraftable data
    const swapComponent = {
      id: swapOption.name.toLowerCase().replace(/\s+/g, '_'),
      name: swapOption.name,
      faction: swapOption.faction,
      description: `Swapped from ${originalComponent.name}`,
      isSwap: true,
      originalComponent: originalComponent.name
    };

    fc[playerIndex][category][componentIndex] = swapComponent;
    setFactions(fc);

    // Add to history
    setDraftHistory(prev => [...prev, {
      playerIndex,
      category,
      item: swapComponent,
      round: "SWAP",
      componentId: swapComponent.id,
      action: `Swapped ${originalComponent.name} for ${swapComponent.name}`
    }]);
  };

  const handleAddExtraComponent = (playerIndex, category, triggerComponent) => {
    const extraComponents = getExtraComponents(triggerComponent.name, triggerComponent.faction);
    
    extraComponents.forEach(extra => {
      // Find the correct category for this extra component
      let targetCategory = category;
      
      // Map extra components to their correct categories
      const categoryMap = {
        "Artuno": "agents",
        "Thundarian": "agents", 
        "Awaken": "abilities",
        "Coalescence": "abilities",
        "Devour": "abilities",
        "Dark Pact": "promissory"
      };

      if (categoryMap[extra.name]) {
        targetCategory = categoryMap[extra.name];
      }

      const extraComponent = {
        id: extra.name.toLowerCase().replace(/\s+/g, '_'),
        name: extra.name,
        faction: extra.faction,
        description: `Gained from ${triggerComponent.name}`,
        isExtra: true,
        triggerComponent: triggerComponent.name
      };

      // Add to the faction
      const fc = [...factions];
      if (!fc[playerIndex][targetCategory]) {
        fc[playerIndex][targetCategory] = [];
      }
      fc[playerIndex][targetCategory].push(extraComponent);
      setFactions(fc);

      // Add to history
      setDraftHistory(prev => [...prev, {
        playerIndex,
        category: targetCategory,
        item: extraComponent,
        round: "ADD",
        componentId: extraComponent.id,
        action: `Added ${extraComponent.name} from ${triggerComponent.name}`
      }]);
    });
  };

  const handleReduction = (playerIndex, category, componentIndex) => {
    const component = factions[playerIndex][category][componentIndex];
    
    // Check if this component triggers extra adds
    const extraComponents = getExtraComponents(component.name, component.faction);
    if (extraComponents.length > 0) {
      // Component is being kept - add extra components
      handleAddExtraComponent(playerIndex, category, component);
    }

    // Remove the component
    const fc = [...factions];
    fc[playerIndex][category].splice(componentIndex, 1);
    setFactions(fc);

    // Check if reduction is complete for all players
    const factionLimits = getCurrentFactionLimits();
    const allPlayersReduced = fc.every(faction => 
      categories.every(cat => (faction[cat]?.length || 0) <= factionLimits[cat])
    );

    if (allPlayersReduced) {
      setDraftPhase("complete");
    }
  };

  // Ban management functions
  const handleBanFaction = (factionName) => {
    setBannedFactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(factionName)) {
        newSet.delete(factionName);
      } else {
        newSet.add(factionName);
      }
      return newSet;
    });
  };

  const handleBanComponent = (componentId) => {
    setBannedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  const [showBanModal, setShowBanModal] = useState(false);

  // Update renderCurrentPlayerInfo to show pending picks
  const renderCurrentPlayerInfo = () => {
    if (draftPhase === "reduction") {
        return (
        <div className="mb-4 p-3 bg-orange-100 rounded">
            <h3 className="font-bold">Reduction Phase</h3>
            <div className="text-sm">Remove excess components to meet faction limits</div>
        </div>
        );
    }

    if (draftPhase === "complete") {
        return (
        <div className="mb-4 p-3 bg-green-100 rounded">
            <h3 className="font-bold">Draft Complete!</h3>
            <div className="text-sm">All factions finalized</div>
        </div>
        );
    }

    if (!draftStarted) {
        return (
        <div className="mb-4 p-3 bg-yellow-100 rounded">
            <h3 className="font-bold">Configure settings and click "Start Draft" to begin</h3>
        </div>
        );
    }

    if (multiplayerEnabled) {
        return (
        <div className="mb-4 p-3 bg-blue-100 rounded">
            <h3 className="font-bold">Multiplayer Draft - Round {round}</h3>
            <div className="text-sm">Selected picks: {selectedPicks.length}</div>
        </div>
        );
    }

    const neededPicks = draftVariant === "rotisserie" ? 1 : 
                      (round === 1 ? firstRoundPickCount : subsequentRoundPickCount);
  
    return (
        <div className="mb-4 p-3 bg-blue-100 rounded">
        <h3 className="font-bold">Player {currentPlayer + 1}'s Turn - Round {round}</h3>
        <div className="text-sm">
            Pending picks: {pendingPicks.length} / {neededPicks}
            {draftVariant === "rotisserie" && " (One pick per turn)"}
        </div>
        <div className="text-sm">Variant: {draftVariant}</div>
      
        {pendingPicks.length > 0 && (
            <div className="mt-2">
            <div className="text-xs font-semibold mb-1">Your pending picks:</div>
            <div className="flex flex-wrap gap-1">
                {pendingPicks.map((pick, idx) => (
                <span 
                    key={idx}
                    className="bg-blue-200 px-2 py-1 rounded text-xs cursor-pointer hover:bg-red-200"
                    onClick={() => handleRemovePendingPick(pick.category, pick.component.id || pick.component.name)}
                    title="Click to remove"
                >
                    {pick.component.name} ×
                </span>
                ))}
            </div>
            </div>
        )}

        {isPickingPhase && (
            <button
            onClick={handleSubmitPicks}
            disabled={pendingPicks.length < neededPicks}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
            Submit Picks ({pendingPicks.length}/{neededPicks})
            </button>
        )}
      
        {!isPickingPhase && (
            <div className="mt-2 text-sm text-gray-600">
            Picks submitted. Moving to next player...
            </div>
        )}
        </div>
    );
  };

  return (
    <div className="h-full p-4 bg-gray-200">
      <div className="h-full flex bg-white rounded-lg shadow">
        <Sidebar
          categories={categories}
          onSelectCategory={setSelectedCategory}
          playerProgress={multiplayerEnabled ? {} : (playerProgress[currentPlayer] || {})}
          draftLimits={draftPhase === "reduction" ? getCurrentFactionLimits() : draftLimits}
          selectedCategory={selectedCategory}
          availableComponents={getAvailableComponents()}
          onComponentClick={handlePick}
          isMultiplayer={multiplayerEnabled}
          draftVariant={draftVariant}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Franken Draft Simulator</h2>
              <div className="flex space-x-2">
                <button onClick={() => setShowBanModal(true)} className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"> 
                Manage Bans
                </button>

                <BanManagementModal isOpen={showBanModal} onClose={() => setShowBanModal(false)} bannedFactions={bannedFactions} bannedComponents={bannedComponents} onBanFaction={handleBanFaction} onBanComponent={handleBanComponent} categories={categories} />
                {!multiplayerEnabled && !draftStarted && (
                  <button 
                    className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600" 
                    onClick={startDraftSolo}
                  >
                    Start Draft
                  </button>
                )}
                <button 
                  className="px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-600" 
                  onClick={() => setShowSummary(s => !s)}
                >
                  {showSummary ? "Hide" : "Show"} Summary
                </button>
                <button 
                  className={`px-3 py-1 rounded ${multiplayerEnabled ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 hover:bg-gray-300"}`} 
                  onClick={() => setMultiplayerEnabled(me => !me)}
                >
                  {multiplayerEnabled ? "Disable Multiplayer" : "Enable Multiplayer"}
                </button>
              </div>
            </div>

            {!multiplayerEnabled && !draftStarted && (
              <DraftSettingsPanel
                playerCount={playerCount}
                setPlayerCount={setPlayerCount}
                draftVariant={draftVariant}
                setDraftVariant={setDraftVariant}
                draftLimits={draftLimits}
                setDraftLimits={setDraftLimits}
                firstRoundPickCount={firstRoundPickCount}
                setFirstRoundPickCount={setFirstRoundPickCount}
                subsequentRoundPickCount={subsequentRoundPickCount}
                setSubsequentRoundPickCount={setSubsequentRoundPickCount}
              />
            )}

            {multiplayerEnabled && (
                <FirebaseMultiplayerPanel
                    draftSettings={{
                        variant: draftVariant,
                        playerCount: playerCount,
                        draftLimits: draftLimits,
                        firstRoundPickCount: firstRoundPickCount,
                        subsequentRoundPickCount: subsequentRoundPickCount
                    }}
                    onDraftStart={(lobbyData) => {
                        // Handle draft start from Firebase
                        console.log("Draft starting with lobby data:", lobbyData);
                    }}
                />
            )}

            {renderCurrentPlayerInfo()}

            {/* Cancel Draft Button */}
            {draftStarted && (
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to cancel the draft? All progress will be lost.")) {
                    setDraftStarted(false);
                    setDraftPhase("draft");
                    setFactions([]);
                    setPlayerBags([]);
                    setPlayerProgress([]);
                    setRotisseriePool({});
                    setDraftHistory([]);
                    setCurrentPlayer(0);
                    setRound(1);
                    setPicksThisRound(0);
                  }
                }}
                className="mt-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Cancel Draft
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Show only current player's faction in draft phase */}
            {draftPhase === "draft" && !multiplayerEnabled && draftStarted ? (
              <FactionSheet
                drafted={factions[currentPlayer] || {}}
                onRemove={() => {}} // No removal during draft
                draftLimits={draftLimits}
                title={`Player ${currentPlayer + 1}'s Draft`}
                isCurrentPlayer={true}
              />
            ) : draftPhase === "reduction" && !multiplayerEnabled ? (
              // Show all players during reduction phase
              factions.map((f, i) => (
                <FactionSheet
                  key={i}
                  drafted={f}
                  onRemove={(cat, idx) => handleReduction(i, cat, idx)}
                  onSwapComponent={(playerIdx, category, componentIdx, swapOption) => handleSwap(playerIdx, category, componentIdx, swapOption)}
                  draftLimits={getCurrentFactionLimits()}
                  title={`Player ${i + 1} - Remove Excess Components`}
                  showReductionHelper={true}
                  playerIndex={i}
                />
              ))
            ) : multiplayerEnabled ? (
              <FactionSheet
                drafted={draftedComponents}
                onRemove={() => {}}
                draftLimits={draftLimits}
                title="Your Multiplayer Draft"
              />
            ) : (
              // Show all factions when draft hasn't started or is complete
              factions.map((f, i) => (
                <FactionSheet
                  key={i}
                  drafted={f}
                  onRemove={() => {}}
                  draftLimits={getCurrentFactionLimits()}
                  title={f.name}
                />
              ))
            )}

            <DraftHistory history={draftHistory} />
            {showSummary && <DraftSummary factions={factions} />}
          </div>
        </div>
      </div>
    </div>
  );
}