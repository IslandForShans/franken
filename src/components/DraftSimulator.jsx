// Complete updated DraftSimulator with all new features
import React, { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import FactionSheet from "./FactionSheet.jsx";
import DraftHistory from "./DraftHistory.jsx";
import DraftSettingsPanel from "./DraftSettingsPanel.jsx";
import DraftSummary from "./DraftSummary.jsx";
import MultiplayerPanel from "./MultiplayerPanel.jsx";
import { shuffleArray } from "../utils/shuffle.js";
import factionsJSON from "../data/factions.json";
import { isComponentUndraftable, getSwapOptions, getExtraComponents } from "../data/undraftable-components.js";

// Updated limits system
const baseFactionLimits = {
  blue_tiles: 3, 
  red_tiles: 2, 
  abilities: 3, 
  faction_techs: 2, 
  agents: 1,
  commanders: 1, 
  heroes: 1, 
  promissory: 1, 
  starting_techs: 1, 
  starting_fleet: 1,
  commodity_values: 1, 
  flagship: 1, 
  mech: 1
};

const powerFactionLimits = {
  blue_tiles: 3, 
  red_tiles: 2, 
  abilities: 4, 
  faction_techs: 3, 
  agents: 2,
  commanders: 2, 
  heroes: 2, 
  promissory: 1, 
  starting_techs: 1, 
  starting_fleet: 1,
  commodity_values: 1, 
  flagship: 1, 
  mech: 1
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
  const [draftPhase, setDraftPhase] = useState("draft"); // "draft" or "reduction"

  // Ban system
  const [bannedFactions, setBannedFactions] = useState(new Set());
  const [bannedComponents, setBannedComponents] = useState(new Set());

  // Multiplayer state
  const [multiplayerEnabled, setMultiplayerEnabled] = useState(false);
  const socketRef = useRef(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:4000");
  const [lobby, setLobby] = useState(null);
  const [playerBag, setPlayerBag] = useState(null);

  const categories = Object.keys(baseFactionLimits);

  // Update limits when variant changes
  useEffect(() => {
    if (draftVariant === "rotisserie") {
      setDraftLimits(draftVariant === "power" ? powerFactionLimits : baseFactionLimits);
    } else {
      setDraftLimits(draftVariant === "power" ? powerDraftLimits : defaultDraftLimits);
    }
  }, [draftVariant]);

  // Component filtering with ban system
  const getFilteredComponents = (category) => {
    return [
      ...(factionsJSON.factions
        .filter(f => !bannedFactions.has(f.name))
        .flatMap(f => (f[category] || [])
          .filter(comp => !bannedComponents.has(comp.id || comp.name))
          .filter(comp => {
            const undraftable = isComponentUndraftable(comp.name, f.name);
            return !undraftable || undraftable.type !== "base_unit";
          })
          .map(item => ({ ...item, faction: f.name }))
        )
      ),
      ...(factionsJSON.tiles[category] || [])
        .filter(comp => !bannedComponents.has(comp.id || comp.name))
    ];
  };

  const createBagsWithUniqueDistribution = () => {
    const bags = Array.from({ length: playerCount }, () => ({}));
    
    categories.forEach(category => {
      const allComponents = getFilteredComponents(category);
      const bagSize = Math.min(draftLimits[category] * 2, allComponents.length);
      
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
      return playerBag || {};
    } else if (draftVariant === "rotisserie") {
      return rotisseriePool;
    } else if (draftStarted && playerBags[currentPlayer]) {
      return playerBags[currentPlayer];
    }
    return {};
  };

  const handlePick = (category, component) => {
    if (!category || !component || !draftStarted || draftPhase !== "draft") return;

    const currentProgress = playerProgress[currentPlayer][category] || 0;
    if (currentProgress >= draftLimits[category]) return;

    // Add component and handle swap/extra components
    const newComponent = { ...component };
    const swapOptions = getSwapOptions(component.name, component.faction);
    const extraComponents = getExtraComponents(component.name, component.faction);

    if (draftVariant === "rotisserie") {
      const compId = component.id || component.name;
      if (!rotisseriePool[category]?.find(c => (c.id || c.name) === compId)) return;

      setFactions(prev => {
        const newF = [...prev];
        newF[currentPlayer] = { ...newF[currentPlayer] };
        newF[currentPlayer][category] = [...(newF[currentPlayer][category] || []), newComponent];
        return newF;
      });

      setPlayerProgress(prev => {
        const np = [...prev];
        np[currentPlayer] = { ...np[currentPlayer] };
        np[currentPlayer][category] = (np[currentPlayer][category] || 0) + 1;
        return np;
      });

      setRotisseriePool(prev => {
        const pool = { ...prev };
        pool[category] = pool[category].filter(c => (c.id || c.name) !== compId);
        return pool;
      });

      const nextPlayer = (currentPlayer + 1) % playerCount;
      setCurrentPlayer(nextPlayer);
      if (nextPlayer === 0) setRound(r => r + 1);
      
    } else {
      // Bag draft logic (similar to rotisserie but with bags)
      const bag = playerBags[currentPlayer];
      if (!bag?.[category]) return;
      
      const compId = component.id || component.name;
      if (!bag[category].find(c => (c.id || c.name) === compId)) return;

      setFactions(prev => {
        const nf = [...prev];
        nf[currentPlayer] = { ...nf[currentPlayer] };
        nf[currentPlayer][category] = [...(nf[currentPlayer][category] || []), newComponent];
        return nf;
      });

      setPlayerProgress(prev => {
        const np = [...prev];
        np[currentPlayer] = { ...np[currentPlayer] };
        np[currentPlayer][category] = (np[currentPlayer][category] || 0) + 1;
        return np;
      });

      setPlayerBags(prev => {
        const nb = [...prev];
        nb[currentPlayer] = { ...nb[currentPlayer] };
        nb[currentPlayer][category] = nb[currentPlayer][category].filter(c => (c.id || c.name) !== compId);
        return nb;
      });

      const newPicksThisRound = picksThisRound + 1;
      setPicksThisRound(newPicksThisRound);

      const neededPicks = 3; // Simplified for now
      if (newPicksThisRound >= neededPicks) {
        const nextPlayer = (currentPlayer + 1) % playerCount;
        setCurrentPlayer(nextPlayer);
        setPicksThisRound(0);
        
        if (nextPlayer === 0) {
          setRound(r => r + 1);
          setPlayerBags(prev => {
            if (prev.length <= 1) return prev;
            const rotated = [...prev];
            const last = rotated.pop();
            rotated.unshift(last);
            return rotated;
          });
        }
      }
    }

    setDraftHistory(prev => [...prev, { 
      playerIndex: currentPlayer, category, item: component, round,
      componentId: component.id || component.name
    }]);

    // Check if draft is complete
    checkDraftCompletion();
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

  const handleReduction = (playerIndex, category, componentIndex) => {
    const fc = [...factions];
    fc[playerIndex][category].splice(componentIndex, 1);
    setFactions(fc);
  };

  const BanManagementPanel = () => {
    const [showBanPanel, setShowBanPanel] = useState(false);
    
    if (!showBanPanel) {
      return (
        <button 
          onClick={() => setShowBanPanel(true)}
          className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Manage Bans
        </button>
      );
    }

    return (
      <div className="border rounded p-4 bg-red-50 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Ban Management</h3>
          <button 
            onClick={() => setShowBanPanel(false)}
            className="px-2 py-1 text-sm bg-gray-400 text-white rounded"
          >
            Close
          </button>
        </div>
        {/* Ban interface implementation */}
      </div>
    );
  };

  const renderCurrentPlayerInfo = () => {
    if (draftPhase === "reduction") {
      return (
        <div className="mb-4 p-3 bg-orange-100 rounded">
          <h3 className="font-bold">Reduction Phase</h3>
          <div className="text-sm">Remove 1 component from each category to meet faction limits</div>
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
        </div>
      );
    }

    const neededPicks = draftVariant === "rotisserie" ? 1 : 3;
    return (
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <h3 className="font-bold">Player {currentPlayer + 1}'s Turn - Round {round}</h3>
        <div className="text-sm">Picks this round: {picksThisRound} / {neededPicks}</div>
        <div className="text-sm">Variant: {draftVariant}</div>
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
                <BanManagementPanel />
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
                firstRoundPickCount={3}
                setFirstRoundPickCount={() => {}}
                subsequentRoundPickCount={2}
                setSubsequentRoundPickCount={() => {}}
              />
            )}

            {multiplayerEnabled && (
              <MultiplayerPanel
                serverUrl={serverUrl}
                setServerUrl={setServerUrl}
                socketRef={socketRef}
                lobby={lobby}
                setLobby={setLobby}
                playerBag={playerBag}
                onConfirmPicks={() => {}}
                onSubmitPicks={() => {}}
                localPlayerSocketId={null}
                draftState={{ round, variant: draftVariant }}
              />
            )}

            {renderCurrentPlayerInfo()}
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
                  draftLimits={getCurrentFactionLimits()}
                  title={`Player ${i + 1} - Remove Excess Components`}
                  showReductionHelper={true}
                />
              ))
            ) : multiplayerEnabled ? (
              <FactionSheet
                drafted={{}}
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