import React, { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import FactionSheet from "./FactionSheet.jsx";
import DraftHistory from "./DraftHistory.jsx";
import DraftSettingsPanel from "./DraftSettingsPanel.jsx";
import DraftSummary from "./DraftSummary.jsx";
import MultiplayerPanel from "./MultiplayerPanel.jsx";
import { shuffleArray } from "../utils/shuffle.js";
import factionsJSON from "../data/factions.json";

const defaultDraftLimits = {
  blue_tiles: 3,
  red_tiles: 2,
  abilities: 4,
  faction_techs: 3,
  agents: 2,
  commanders: 2,
  heroes: 2,
  promissory: 2,
  starting_techs: 2,
  starting_fleet: 2,
  commodity_values: 2,
  flagship: 2,
  mech: 2
};

const powerDraftLimits = {
  blue_tiles: 3,
  red_tiles: 2,
  abilities: 5,
  faction_techs: 4,
  agents: 3,
  commanders: 3,
  heroes: 3,
  promissory: 2,
  starting_techs: 2,
  starting_fleet: 2,
  commodity_values: 2,
  flagship: 2,
  mech: 2
};

export default function DraftSimulator() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedFactionFilter, setSelectedFactionFilter] = useState("all");
  const [playerCount, setPlayerCount] = useState(4);
  const [factions, setFactions] = useState([]);
  const [draftHistory, setDraftHistory] = useState([]);
  const [playerBags, setPlayerBags] = useState([]);
  const [playerProgress, setPlayerProgress] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [round, setRound] = useState(1);
  const [draftLimits, setDraftLimits] = useState(defaultDraftLimits);
  const [firstRoundPickCount, setFirstRoundPickCount] = useState(3);
  const [subsequentRoundPickCount, setSubsequentRoundPickCount] = useState(2);
  const [draftVariant, setDraftVariant] = useState("franken");
  const [rotisseriePool, setRotisseriePool] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [picksThisRound, setPicksThisRound] = useState(0);
  const [draftStarted, setDraftStarted] = useState(false);

  // Multiplayer state
  const [multiplayerEnabled, setMultiplayerEnabled] = useState(false);
  const socketRef = useRef(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:4000");
  const [lobby, setLobby] = useState(null);
  const [playerBag, setPlayerBag] = useState(null);
  const [localSocketId, setLocalSocketId] = useState(null);
  const [remotePlayers, setRemotePlayers] = useState([]);
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [draftedComponents, setDraftedComponents] = useState({});
  const categories = Object.keys(defaultDraftLimits);

  // Setup socket listeners for multiplayer
  useEffect(() => {
    if (!multiplayerEnabled || !socketRef.current) return;

    const socket = socketRef.current;

    const handleYourBag = ({ bag }) => {
      setPlayerBag(bag);
    };

    const handleDraftStarted = ({ draftState, players }) => {
      setRound(draftState.round);
      setRemotePlayers(players);
      const emptyDrafted = {};
      categories.forEach(cat => emptyDrafted[cat] = []);
      setDraftedComponents(emptyDrafted);
    };

    const handleDraftHistoryUpdate = (history) => {
      setDraftHistory(history);
    };

    const handleLobbyUpdate = (updatedLobby) => {
      setLobby(updatedLobby);
      setRound(updatedLobby.draftState?.round || 1);
    };

    socket.on("yourBag", handleYourBag);
    socket.on("draftStarted", handleDraftStarted);
    socket.on("draftHistoryUpdate", handleDraftHistoryUpdate);
    socket.on("lobbyUpdate", handleLobbyUpdate);
    socket.on("connect", () => setLocalSocketId(socket.id));

    return () => {
      socket.off("yourBag", handleYourBag);
      socket.off("draftStarted", handleDraftStarted);
      socket.off("draftHistoryUpdate", handleDraftHistoryUpdate);
      socket.off("lobbyUpdate", handleLobbyUpdate);
    };
  }, [multiplayerEnabled]);

  // Update limits when variant changes
  useEffect(() => {
    if (draftVariant === "power") {
      setDraftLimits(powerDraftLimits);
    } else {
      setDraftLimits(defaultDraftLimits);
    }
  }, [draftVariant]);

  const validateSettings = () => {
    const errors = [];
    if (playerCount < 2 || playerCount > 8) errors.push("Player count must be between 2 and 8");
    if (firstRoundPickCount <= 0 || subsequentRoundPickCount <= 0) errors.push("Pick counts must be greater than 0");
    if (errors.length) {
      alert("Settings errors:\n" + errors.join("\n"));
      return false;
    }
    return true;
  };

  const getAllComponents = (category) => {
    return [
      ...(factionsJSON.factions.flatMap(f => (f[category] || []).map(item => ({ ...item, faction: f.name })))),
      ...(factionsJSON.tiles[category] || [])
    ];
  };

  // Enhanced bag creation that ensures no duplicates across player bags
  const createBagsWithUniqueDistribution = () => {
    const bags = Array.from({ length: playerCount }, () => ({}));
    
    categories.forEach(category => {
      const allComponents = getAllComponents(category);
      const bagSize = Math.min(draftLimits[category], allComponents.length); // Give players their limit or all available
      const totalNeeded = playerCount * bagSize;
      
      console.log(`${category}: Need ${totalNeeded} components, have ${allComponents.length} available`);
      
      // Create a pool of components to distribute
      let distributionPool = [];
      
      if (totalNeeded <= allComponents.length) {
        // We have enough unique components for everyone
        distributionPool = shuffleArray([...allComponents]);
      } else {
        // Not enough unique components - create duplicates
        const timesToRepeat = Math.ceil(totalNeeded / allComponents.length);
        for (let i = 0; i < timesToRepeat; i++) {
          distributionPool = distributionPool.concat(
            allComponents.map(comp => ({ ...comp, copyIndex: i }))
          );
        }
        distributionPool = shuffleArray(distributionPool);
      }
      
      // Distribute components to players
      let componentIndex = 0;
      for (let playerIdx = 0; playerIdx < playerCount; playerIdx++) {
        bags[playerIdx][category] = [];
        
        // Give each player 'bagSize' components
        for (let i = 0; i < bagSize && componentIndex < distributionPool.length; i++) {
          bags[playerIdx][category].push(distributionPool[componentIndex]);
          componentIndex++;
        }
      }
    });
    
    return bags;
  };

  const getAvailableComponents = () => {
    if (multiplayerEnabled) {
      return playerBag || {};
    } else if (draftVariant === "rotisserie") {
      return rotisseriePool;
    } else if (draftStarted && playerBags.length > 0 && playerBags[currentPlayer]) {
      // Return the current player's bag
      return playerBags[currentPlayer];
    } else if (!draftStarted) {
      // Before draft starts, show all available components for preview
      const allAvailable = {};
      categories.forEach(cat => {
        allAvailable[cat] = getAllComponents(cat);
      });
      return allAvailable;
    }
    return {};
  };

  const startDraftSolo = () => {
    if (!validateSettings()) return;

    // Check if we have enough components for the draft
    const componentCounts = {};
    categories.forEach(cat => {
      componentCounts[cat] = getAllComponents(cat).length;
    });

    console.log("Available components per category:", componentCounts);

    // Properly initialize empty factions with all categories as empty arrays
    const emptyFactions = Array.from({ length: playerCount }, (_, i) => {
      const f = { name: `Player ${i + 1}` };
      categories.forEach(cat => {
        f[cat] = [];
      });
      return f;
    });
    setFactions(emptyFactions);

    // Initialize progress tracking - all categories start at 0
    setPlayerProgress(Array.from({ length: playerCount }, () => {
      const p = {};
      categories.forEach(cat => {
        p[cat] = 0;
      });
      return p;
    }));

    if (draftVariant === "rotisserie") {
      // ROTISSERIE: All components available in shared pools
      const pool = {};
      categories.forEach(cat => {
        pool[cat] = getAllComponents(cat);
      });
      setRotisseriePool(pool);
      setPlayerBags([]);
      console.log("Rotisserie pools created");
    } else {
      // FRANKEN/POWER DRAFT: Each player gets unique bag with limited components
      const bags = createBagsWithUniqueDistribution();
      setPlayerBags(bags);
      setRotisseriePool({});
      
      // Debug: Log bag contents for verification
      console.log("Bag draft created:");
      bags.forEach((bag, playerIdx) => {
        console.log(`Player ${playerIdx + 1} bag sizes:`, 
          Object.entries(bag).map(([cat, components]) => 
            `${cat}: ${components.length}`
          ).join(", ")
        );
      });
    }

    setDraftHistory([]);
    setCurrentPlayer(0);
    setRound(1);
    setPicksThisRound(0);
    setShowSummary(false);
    setDraftStarted(true);
  };

  // Fixed handlePick to work with proper bag system
  const handlePick = (category, component) => {
    if (!category || !component || !draftStarted) return;

    const currentProgress = playerProgress[currentPlayer] ? playerProgress[currentPlayer][category] || 0 : 0;
    if (currentProgress >= draftLimits[category]) {
      console.log(`Cannot add more ${category} components. Limit reached: ${currentProgress}/${draftLimits[category]}`);
      return;
    }

    // ROTISSERIE - pick from shared pools
    if (draftVariant === "rotisserie") {
      const compId = component.id || component.name;
      if (!rotisseriePool[category] || rotisseriePool[category].length === 0) return;

      // Check if component is still available in pool
      const componentInPool = rotisseriePool[category].find(c => (c.id || c.name) === compId);
      if (!componentInPool) {
        console.log(`Component ${compId} no longer available in pool`);
        return;
      }

      // Add component to player's faction
      setFactions(prev => {
        const newF = [...prev];
        newF[currentPlayer] = { ...newF[currentPlayer] };
        newF[currentPlayer][category] = [...(newF[currentPlayer][category] || []), component];
        return newF;
      });

      // Update progress
      setPlayerProgress(prev => {
        const np = [...prev];
        np[currentPlayer] = { ...np[currentPlayer] };
        np[currentPlayer][category] = (np[currentPlayer][category] || 0) + 1;
        return np;
      });

      // Remove component from shared pool
      setRotisseriePool(prev => {
        const pool = { ...prev };
        pool[category] = pool[category].filter(c => (c.id || c.name) !== compId);
        return pool;
      });

      setDraftHistory(prev => [...prev, { 
        playerIndex: currentPlayer, 
        category, 
        item: component, 
        round,
        componentId: compId
      }]);
      
      // Move to next player immediately in rotisserie
      const nextPlayer = (currentPlayer + 1) % playerCount;
      setCurrentPlayer(nextPlayer);
      if (nextPlayer === 0) setRound(r => r + 1);
      return;
    }

    // BAG DRAFT - pick from personal bags
    const bag = playerBags[currentPlayer];
    if (!bag || !bag[category]) {
      console.log(`No bag or category for player ${currentPlayer}`);
      return;
    }
    
    const compId = component.id || component.name;
    const compInBag = bag[category].find(c => (c.id || c.name) === compId);
    if (!compInBag) {
      console.log(`Component ${compId} not found in player ${currentPlayer}'s bag`);
      return;
    }

    // Add component to player's faction
    setFactions(prev => {
      const nf = [...prev];
      nf[currentPlayer] = { ...nf[currentPlayer] };
      nf[currentPlayer][category] = [...(nf[currentPlayer][category] || []), component];
      return nf;
    });

    // Update progress
    setPlayerProgress(prev => {
      const np = [...prev];
      np[currentPlayer] = { ...np[currentPlayer] };
      np[currentPlayer][category] = (np[currentPlayer][category] || 0) + 1;
      return np;
    });

    // Remove component from player's bag
    setPlayerBags(prev => {
      const nb = [...prev];
      nb[currentPlayer] = { ...nb[currentPlayer] };
      nb[currentPlayer][category] = nb[currentPlayer][category].filter(c => (c.id || c.name) !== compId);
      return nb;
    });

    setDraftHistory(prev => [...prev, { 
      playerIndex: currentPlayer, 
      category, 
      item: component, 
      round,
      componentId: compId
    }]);

    const newPicksThisRound = picksThisRound + 1;
    setPicksThisRound(newPicksThisRound);

    const neededPicks = round === 1 ? firstRoundPickCount : subsequentRoundPickCount;
    
    if (newPicksThisRound >= neededPicks) {
      const nextPlayer = (currentPlayer + 1) % playerCount;
      setCurrentPlayer(nextPlayer);
      setPicksThisRound(0);
      
      if (nextPlayer === 0) {
        setRound(r => r + 1);
        // Rotate bags to the right
        setPlayerBags(prev => {
          if (prev.length <= 1) return prev;
          const rotated = [...prev];
          const last = rotated.pop();
          rotated.unshift(last);
          return rotated;
        });
      }
    }
  };

  const renderCurrentPlayerInfo = () => {
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
    } else {
      const neededPicks = draftVariant === "rotisserie" ? 1 : 
                          (round === 1 ? firstRoundPickCount : subsequentRoundPickCount);
      return (
        <div className="mb-4 p-3 bg-blue-100 rounded">
          <h3 className="font-bold">Player {currentPlayer + 1}'s Turn - Round {round}</h3>
          <div className="text-sm">Picks this round: {picksThisRound} / {neededPicks}</div>
          <div className="text-sm">Variant: {draftVariant}</div>
          {draftVariant === "rotisserie" && (
            <div className="text-sm text-orange-600">One pick per turn</div>
          )}
        </div>
      );
    }
  };

  const handleRemoveComponent = (playerIndex, category, componentIndex) => {
    const fc = [...factions];
    fc[playerIndex][category].splice(componentIndex, 1);
    setFactions(fc);
    
    if (!multiplayerEnabled) {
      setPlayerProgress(prev => {
        const np = [...prev];
        np[playerIndex][category] = Math.max(0, (np[playerIndex][category] || 0) - 1);
        return np;
      });
    }
  };

  return (
    <div className="h-full p-4 bg-gray-200">
      <div className="h-full flex bg-white rounded-lg shadow">
        <Sidebar
          categories={categories}
          onSelectCategory={setSelectedCategory}
          playerProgress={multiplayerEnabled ? {} : (playerProgress[currentPlayer] || {})}
          draftLimits={draftLimits}
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
              <MultiplayerPanel
                serverUrl={serverUrl}
                setServerUrl={setServerUrl}
                socketRef={socketRef}
                lobby={lobby}
                setLobby={setLobby}
                playerBag={playerBag}
                onConfirmPicks={() => setSelectedPicks([])}
                onSubmitPicks={(picks) => console.log("Submitted picks:", picks)}
                localPlayerSocketId={localSocketId}
                draftState={{ round, variant: draftVariant }}
              />
            )}

            {renderCurrentPlayerInfo()}
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {multiplayerEnabled ? (
              <FactionSheet
                drafted={draftedComponents}
                onRemove={(cat, idx) => {
                  const updated = { ...draftedComponents };
                  updated[cat].splice(idx, 1);
                  setDraftedComponents(updated);
                }}
                draftLimits={draftLimits}
              />
            ) : (
              factions.map((f, i) => (
                <FactionSheet
                  key={i}
                  drafted={f}
                  onRemove={(cat, idx) => handleRemoveComponent(i, cat, idx)}
                  draftLimits={draftLimits}
                />
              ))
            )}

            <DraftHistory history={draftHistory} />

            {showSummary && <DraftSummary factions={multiplayerEnabled ? [draftedComponents] : factions} />}
          </div>
        </div>
      </div>
    </div>
  );
}