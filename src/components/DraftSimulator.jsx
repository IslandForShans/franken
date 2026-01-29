import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Sidebar from "./Sidebar.jsx";
import FactionSheet from "./FactionSheet.jsx";
import DraftHistory from "./DraftHistory.jsx";
import DraftSettingsPanel from "./DraftSettingsPanel.jsx";
import DraftSummary from "./DraftSummary.jsx";
import FirebaseMultiplayerPanel from "./FirebaseMultiplayerPanel.jsx";
import { shuffleArray } from "../utils/shuffle.js";
import factionsJSONRaw from "../data/factions.json";
import discordantStarsJSONRaw from "../data/discordant-stars.json";
import { processFactionData } from "../utils/dataProcessor.js";
import { isComponentUndraftable, getSwapOptions, getExtraComponents } from "../data/undraftable-components.js";
import BanManagementModal from "./BanManagementModal.jsx";
import { multiplayerService } from "../services/firebaseMultiplayer.js";

// PERFORMANCE: Process faction data once at module load instead of on every render
const factionsJSON = processFactionData(factionsJSONRaw);
const discordantStarsJSON = processFactionData(discordantStarsJSONRaw);

// PERFORMANCE: Define constants outside component to avoid recreation on every render
const baseFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 3, faction_techs: 2, agents: 1,
  commanders: 1, heroes: 1, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1, home_systems: 1, breakthrough: 1
};

const powerFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 4, faction_techs: 3, agents: 2,
  commanders: 2, heroes: 2, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1, home_systems: 1, breakthrough: 1
};

const defaultDraftLimits = Object.fromEntries(
  Object.entries(baseFactionLimits).map(([key, value]) => [key, value + 1])
);

const powerDraftLimits = Object.fromEntries(
  Object.entries(powerFactionLimits).map(([key, value]) => [key, value + 1])
);

// PERFORMANCE: Define exclusions outside component
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

export default function DraftSimulator({ onNavigate }) {
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
  const [showSummary, setShowSummary] = useState(true);
  const [picksThisRound, setPicksThisRound] = useState(0);
  const [draftStarted, setDraftStarted] = useState(false);
  const [draftPhase, setDraftPhase] = useState("draft");
  const [firstRoundPickCount, setFirstRoundPickCount] = useState(3);
  const [subsequentRoundPickCount, setSubsequentRoundPickCount] = useState(2);
  const [pendingPicks, setPendingPicks] = useState([]);
  const [isPickingPhase, setIsPickingPhase] = useState(true);

  // Ban system
  const [bannedFactions, setBannedFactions] = useState(new Set());
  const [bannedComponents, setBannedComponents] = useState(new Set());

  // Multiplayer state
  const [multiplayerEnabled, setMultiplayerEnabled] = useState(false);
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // UI state
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const headerRef = useRef(null);

  // Expansion toggles
  const [expansionsEnabled, setExpansionsEnabled] = useState({
    pok: true,
    te: false,
    firmobs: false
  });

  // PERFORMANCE: Memoize active categories computation
  const categories = useMemo(() => {
    const baseCategories = [
      'abilities', 'faction_techs', 'promissory', 'flagship',
      'starting_techs', 'starting_fleet', 'commodity_values',
      'blue_tiles', 'red_tiles', 'home_systems'
    ];
    const pokCategories = ['agents', 'commanders', 'heroes', 'mech'];
    const teCategories = ['breakthrough'];

    let activeCategories = [...baseCategories];

    if (expansionsEnabled.pok) {
      activeCategories.push(...pokCategories);
    }

    if (expansionsEnabled.te) {
      activeCategories.push(...teCategories);
    }

    return activeCategories;
  }, [expansionsEnabled.pok, expansionsEnabled.te]);

  const syncToFirebase = useRef(null);

  useEffect(() => {
    if (multiplayerEnabled && draftStarted) {
      if (syncToFirebase.current) clearTimeout(syncToFirebase.current);
      syncToFirebase.current = setTimeout(() => {
        multiplayerService.syncDraftState({
          factions,
          draftHistory,
          playerProgress,
          currentPlayer,
          round,
          phase: draftPhase,
          playerBags,
          rotisseriePool,
          pendingPicks,
          isPickingPhase
        });
      }, 1000);
    }
  }, [multiplayerEnabled, draftStarted, factions, draftHistory, currentPlayer, round, draftPhase]);

  useEffect(() => {
    const setHeaderHeightVar = () => {
      try {
        const el = headerRef.current;
        const h = el ? Math.ceil(el.getBoundingClientRect().height) : 56;
        document.documentElement.style.setProperty('--header-height', `${h}px`);
      } catch (e) {
        document.documentElement.style.setProperty('--header-height', `56px`);
      }
    };
    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);
    return () => window.removeEventListener('resize', setHeaderHeightVar);
  }, [settingsCollapsed]);

  useEffect(() => {
    const baseLimits = draftVariant === "power" ? powerFactionLimits : baseFactionLimits;
    const draftBaseLimits = draftVariant === "power" ? powerDraftLimits : defaultDraftLimits;
    
    const filteredLimits = {};
    categories.forEach(cat => {
      if (draftVariant === "rotisserie") {
        filteredLimits[cat] = baseLimits[cat];
      } else {
        filteredLimits[cat] = draftBaseLimits[cat];
      }
    });
    
    setDraftLimits(filteredLimits);
  }, [draftVariant, categories]);

  useEffect(() => {
    if (multiplayerEnabled) {
      window.endMultiplayerDraft = (endDraftCallback) => {
        endDraftCallback(factions, draftHistory, {
          variant: draftVariant,
          playerCount,
          draftLimits,
          firstRoundPickCount,
          subsequentRoundPickCount
        });
      };
    }
    
    return () => {
      delete window.endMultiplayerDraft;
    };
  }, [multiplayerEnabled, factions, draftHistory, draftVariant, playerCount, draftLimits]);

  // PERFORMANCE: useCallback for handleDraftStateSync
  const handleDraftStateSync = useCallback((draftState) => {
    if (!draftState) return;
    if (draftState.factions) setFactions(draftState.factions);
    if (draftState.draftHistory) setDraftHistory(draftState.draftHistory);
    if (draftState.playerProgress) setPlayerProgress(draftState.playerProgress);
    if (typeof draftState.currentPlayer === 'number') setCurrentPlayer(draftState.currentPlayer);
    if (typeof draftState.round === 'number') setRound(draftState.round);
    if (draftState.phase) setDraftPhase(draftState.phase);
    if (draftState.playerBags) setPlayerBags(draftState.playerBags);
    if (draftState.rotisseriePool) setRotisseriePool(draftState.rotisseriePool);
    if (draftState.pendingPicks) setPendingPicks(draftState.pendingPicks);
    if (typeof draftState.isPickingPhase === 'boolean') setIsPickingPhase(draftState.isPickingPhase);
  }, []);

  // PERFORMANCE: Memoize getFilteredComponents with useCallback
  const getFilteredComponents = useCallback((category) => {
    const factionComponents = factionsJSON.factions
      .filter(f => !bannedFactions.has(f.name))
      .filter(f => expansionsEnabled.pok || !pokExclusions.factions.includes(f.name))
      .filter(f => expansionsEnabled.te || !teExclusions.factions.includes(f.name))
      .filter(f => expansionsEnabled.firmobs || !noFirmament.factions.includes(f.name))
      .flatMap(f => (f[category] || [])
        .filter(comp => !bannedComponents.has(comp.id || comp.name))
        .filter(comp => !isComponentUndraftable(comp.name, f.name))
        .map(item => ({ ...item, faction: f.name, factionIcon: f.icon }))
      );

    const dsComponents = expansionsEnabled.ds && discordantStarsJSON?.factions
      ? discordantStarsJSON.factions
          .filter(f => !bannedFactions.has(f.name))
          .flatMap(f => (f[category] || [])
            .filter(comp => !bannedComponents.has(comp.id || comp.name))
            .filter(comp => !isComponentUndraftable(comp.name, f.name))
            .map(item => ({ ...item, faction: f.name, factionIcon: f.icon }))
          )
      : [];

    const tiles = (factionsJSON.tiles[category] || [])
      .filter(tile => !bannedComponents.has(tile.id || tile.name))
      .filter(tile => expansionsEnabled.pok || !pokExclusions.tiles.includes(tile.id))
      .filter(tile => expansionsEnabled.te || !teExclusions.tiles.includes(tile.id));

    const usTiles = expansionsEnabled.us && discordantStarsJSON?.tiles?.[category]
      ? discordantStarsJSON.tiles[category]
          .filter(tile => !bannedComponents.has(tile.id || tile.name))
      : [];

    return [...factionComponents, ...dsComponents, ...tiles, ...usTiles];
  }, [bannedFactions, bannedComponents, expansionsEnabled]);

  // PERFORMANCE: useCallback for createBagsWithUniqueDistribution
  const createBagsWithUniqueDistribution = useCallback(() => {
    const bags = Array.from({ length: playerCount }, () => ({}));
    
    console.log(`Creating ${playerCount} bags for ${playerCount} players`);
    
    categories.forEach(category => {
      const allComponents = getFilteredComponents(category);
      const bagSize = draftLimits[category];
      
      let distributionPool = [];
      const totalNeeded = playerCount * bagSize;
      
      if (totalNeeded <= allComponents.length) {
        distributionPool = shuffleArray([...allComponents]);
      } else {
        const timesToRepeat = Math.ceil(totalNeeded / allComponents.length);
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
    
    console.log(`Created bags:`, bags.length);
    return bags;
  }, [playerCount, categories, getFilteredComponents, draftLimits]);

  const initializeDraft = useCallback((settings) => {
    const { variant, playerCount, players } = settings;

    const emptyFactions = Array.from({ length: playerCount }, (_, i) => {
        const playerName = players?.[i]?.name || `Player ${i + 1}`;
        const f = { name: playerName };
        categories.forEach(cat => { f[cat] = []; });
        return f;
    });
    setFactions(emptyFactions);

    setPlayerProgress(Array.from({ length: playerCount }, () => {
        const p = {};
        categories.forEach(cat => { p[cat] = 0; });
        return p;
    }));

    if (variant === "rotisserie") {
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
    setPendingPicks([]);
    setIsPickingPhase(true);
    
    setTimeout(() => {
        checkAndAdvanceIfNeeded(emptyFactions, Array.from({ length: playerCount }, () => {
            const p = {};
            categories.forEach(cat => { p[cat] = 0; });
            return p;
        }), 0);
    }, 100);
  }, [categories, getFilteredComponents, createBagsWithUniqueDistribution]);

  const checkAndAdvanceIfNeeded = (currentFactions, currentProgress, playerIdx) => {
    if (draftVariant === "rotisserie") return;
    
    const bag = playerBags[playerIdx];
    const progress = currentProgress[playerIdx];
    
    if (!bag) return;
    
    let canPick = false;
    categories.forEach(cat => {
        const inBag = bag[cat]?.length || 0;
        const alreadyPicked = progress[cat] || 0;
        const limit = draftLimits[cat];
        
        if (inBag > 0 && alreadyPicked < limit) {
            canPick = true;
        }
    });
    
    if (!canPick) {
        console.log(`Player ${playerIdx + 1} auto-passing on initialization - nothing to draft`);
        const nextPlayer = (playerIdx + 1) % playerCount;
        setCurrentPlayer(nextPlayer);
        
        if (nextPlayer !== 0) {
            checkAndAdvanceIfNeeded(currentFactions, currentProgress, nextPlayer);
        }
    }
  };

  const startDraftSolo = useCallback(() => {
    initializeDraft({
        variant: draftVariant,
        playerCount,
        draftLimits,
        firstRoundPickCount,
        subsequentRoundPickCount,
    });
  }, [initializeDraft, draftVariant, playerCount, draftLimits, firstRoundPickCount, subsequentRoundPickCount]);

  const cancelDraft = useCallback(() => {
    setDraftStarted(false);
    setDraftHistory([]);
    setPlayerBags([]);
    setPlayerProgress([]);
    setFactions([]);
    setCurrentPlayer(0);
    setRound(1);
    setPicksThisRound(0);
    setDraftPhase('draft');
    setPendingPicks([]);
    setIsPickingPhase(true);
    setShowSummary(true);
  }, []);

  const getAvailableComponents = useCallback(() => {
    if (multiplayerEnabled) {
      return playerBags || {};
    } else if (draftVariant === "rotisserie") {
      return rotisseriePool;
    } else if (draftStarted && playerBags.length > 0) {
      return playerBags[currentPlayer] || {};
    }
    return {};
  }, [multiplayerEnabled, draftVariant, draftStarted, playerBags, currentPlayer, rotisseriePool]);

  const getMaxPicksForRound = useCallback(() => {
    const baseNeeded = round === 1 ? firstRoundPickCount : subsequentRoundPickCount;
    
    if (draftVariant === "rotisserie") return 1;
    
    const currentBag = playerBags[currentPlayer];
    const progress = playerProgress[currentPlayer];
    
    if (!currentBag) return 0;
    
    let availablePicks = 0;
    categories.forEach(cat => {
      const inBag = currentBag[cat]?.length || 0;
      const alreadyPicked = progress[cat] || 0;
      const limit = draftLimits[cat];
      const canPickInCategory = Math.min(inBag, limit - alreadyPicked);
      
      if (canPickInCategory > 0) {
        availablePicks++;
      }
    });
    
    return Math.min(baseNeeded, availablePicks);
  }, [round, firstRoundPickCount, subsequentRoundPickCount, draftVariant, playerBags, currentPlayer, playerProgress, categories, draftLimits]);

  const handlePick = useCallback((category, component) => {
    if (!category || !component || !draftStarted || draftPhase !== "draft" || !isPickingPhase) return;

    const currentProgress = playerProgress[currentPlayer][category] || 0;
    const pendingCountInCategory = pendingPicks.filter(p => p.category === category).length;
  
    if (currentProgress + pendingCountInCategory >= draftLimits[category]) {
        alert(`Cannot pick more ${category.replace('_', ' ')}. Limit: ${draftLimits[category]}`);
        return;
    }

    const maxPicks = getMaxPicksForRound();
    if (pendingPicks.length >= maxPicks) {
        alert(`You can only pick ${maxPicks} component${maxPicks !== 1 ? 's' : ''} this round.`);
        return;
    }

    if (pendingCountInCategory >= 1) {
        alert(`You can only pick one ${category.replace('_', ' ')} per round.`);
        return;
    }

    setPendingPicks(prev => [...prev, {
        category,
        component: { ...component }
    }]);
  }, [draftStarted, draftPhase, isPickingPhase, playerProgress, currentPlayer, pendingPicks, draftLimits, getMaxPicksForRound]);

  const handleRemovePendingPick = useCallback((category, componentId) => {
    setPendingPicks(prev => 
        prev.filter(pick => 
        !(pick.category === category && (pick.component.id || pick.component.name) === componentId)
        )
    );
  }, []);

  const handleSubmitPicks = () => {
    const maxPicks = getMaxPicksForRound();
    
    if (draftVariant === "rotisserie") {
        if (pendingPicks.length !== 1) {
        alert("You must pick exactly 1 component in Rotisserie mode.");
        return;
        }
    } else {
        if (pendingPicks.length < maxPicks) {
        alert(`You must pick ${maxPicks} component${maxPicks !== 1 ? 's' : ''} this round. Currently: ${pendingPicks.length}`);
        return;
        }
        
        if (pendingPicks.length > maxPicks) {
        alert(`You can only pick up to ${maxPicks} components this round.`);
        return;
        }
    }

    const fc = [...factions];
    const pg = [...playerProgress];

    pendingPicks.forEach(({ category, component }) => {
        fc[currentPlayer][category] = [...(fc[currentPlayer][category] || []), component];
        pg[currentPlayer][category] = (pg[currentPlayer][category] || 0) + 1;

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
            const currentBagIdx = currentPlayer;
            nb[currentBagIdx] = { ...nb[currentBagIdx] };
            const compId = component.id || component.name;
            nb[currentBagIdx][category] = nb[currentBagIdx][category].filter(c => (c.id || c.name) !== compId);
            return nb;
        });
        }

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

    advanceToNextPlayer(fc, pg);
  };

  const advanceToNextPlayer = (updatedFactions, updatedProgress) => {
    setTimeout(() => {
        let nextPlayer = (currentPlayer + 1) % playerCount;
        let attempts = 0;
        const maxAttempts = playerCount;
        
        while (attempts < maxAttempts) {
            const completedRound = nextPlayer === 0;
            
            if (completedRound && draftVariant !== "rotisserie") {
                setRound(r => r + 1);
                setPlayerBags(prev => {
                    if (prev.length <= 1) return prev;
                    const rotated = [...prev];
                    const last = rotated.pop();
                    rotated.unshift(last);
                    return rotated;
                });
            }
            
            setCurrentPlayer(nextPlayer);
            setFactions(updatedFactions);
            setPlayerProgress(updatedProgress);
            
            if (draftVariant !== "rotisserie") {
                const nextBag = completedRound && playerBags.length > 1 
                    ? [...playerBags.slice(1), playerBags[0]][nextPlayer]
                    : playerBags[nextPlayer];
                    
                const nextProgress = updatedProgress[nextPlayer];
                
                let canPick = false;
                categories.forEach(cat => {
                    const inBag = nextBag?.[cat]?.length || 0;
                    const alreadyPicked = nextProgress[cat] || 0;
                    const limit = draftLimits[cat];
                    
                    if (inBag > 0 && alreadyPicked < limit) {
                        canPick = true;
                    }
                });
                
                if (!canPick) {
                    console.log(`Player ${nextPlayer + 1} auto-passing - nothing they can draft from their bag`);
                    nextPlayer = (nextPlayer + 1) % playerCount;
                    attempts++;
                    continue;
                }
            }
            
            setIsPickingPhase(true);
            setPicksThisRound(0);
            
setTimeout(() => {
    const factionLimits = draftVariant === "power" ? powerFactionLimits : baseFactionLimits;
    
    const allPlayersComplete = updatedFactions.every((faction, idx) => {
        return categories.every(cat => {
            const current = faction[cat]?.length || 0;
            const limit = draftLimits[cat];
            return current >= limit;
        });
    });
    
    if (allPlayersComplete) {
        console.log("Draft complete - checking if reduction is needed");
        
        const needsReduction = updatedFactions.some((faction, idx) => {
            return categories.some(cat => {
                const current = faction[cat]?.length || 0;
                const limit = factionLimits[cat];
                const isOver = current > limit;
                if (isOver) {
                    console.log(`Player ${idx + 1} ${cat}: ${current}/${limit} - needs reduction`);
                }
                return isOver;
            });
        });
        
        if (needsReduction) {
            console.log("Moving to reduction phase");
            setDraftPhase("reduction");
            setIsPickingPhase(false);
        } else {
            console.log("No reduction needed - adding extra components and completing");
            const factionsWithExtras = addAllExtraComponents(updatedFactions);
            setFactions(factionsWithExtras);
            setDraftPhase("complete");
            setIsPickingPhase(false);
        }
    }
}, 100);
            
            return;
        }
        
        console.log("No players can draft from their bags - checking completion");
        
setTimeout(() => {
            const allPlayersComplete = updatedFactions.every((faction, idx) => {
                return categories.every(cat => {
                    const current = faction[cat]?.length || 0;
                    const limit = draftLimits[cat];
                    return current >= limit;
                });
            });
            
            if (allPlayersComplete) {
  const factionLimits = draftVariant === "power" ? powerFactionLimits : baseFactionLimits;
  
  console.log("Draft complete - checking if reduction is needed");
  
  const needsReduction = updatedFactions.some((faction, idx) => {
    return categories.some(cat => {
      const current = faction[cat]?.length || 0;
      const limit = factionLimits[cat];
      const isOver = current > limit;
      if (isOver) {
        console.log(`Player ${idx + 1} ${cat}: ${current}/${limit} - needs reduction`);
      }
      return isOver;
    });
  });
  
  if (needsReduction) {
    console.log("Moving to reduction phase");
    setDraftPhase("reduction");
    setIsPickingPhase(false);
  } else {
    console.log("No reduction needed - skipping to complete");
    const factionsWithExtras = addAllExtraComponents(updatedFactions);
    setFactions(factionsWithExtras);
    setDraftPhase("complete");
    setIsPickingPhase(false);
  }
}
        }, 100);
    }, 300);
  };

  const checkDraftCompletion = () => {
  if (draftVariant === "rotisserie") return;

  const factionLimits = draftVariant === "power" ? powerFactionLimits : baseFactionLimits;
  
  console.log("Checking draft completion");
  
  const allPlayersComplete = factions.every((faction, idx) => {
    const complete = categories.every(cat => {
      const current = faction[cat]?.length || 0;
      const limit = draftLimits[cat];
      return current >= limit;
    });
    return complete;
  });

  console.log("All players reached draft limits?", allPlayersComplete);

  if (allPlayersComplete) {
    const needsReduction = factions.some((faction, idx) => {
      return categories.some(cat => {
        const current = faction[cat]?.length || 0;
        const limit = factionLimits[cat];
        const isOver = current > limit;
        if (isOver) {
          console.log(`Player ${idx + 1} ${cat}: ${current}/${limit} - needs reduction`);
        }
        return isOver;
      });
    });
    
    if (needsReduction) {
      console.log("Moving to reduction phase");
      setDraftPhase("reduction");
      setIsPickingPhase(false);
    } else {
      console.log("No reduction needed - adding extra components and completing");
      const factionsWithExtras = addAllExtraComponents(factions);
      setFactions(factionsWithExtras);
      setDraftPhase("complete");
      setIsPickingPhase(false);
    }
  }
};

  const addAllExtraComponents = (currentFactions) => {
    const updatedFactions = currentFactions.map((faction, playerIdx) => {
      const newFaction = { ...faction };
      
      categories.forEach(category => {
        const components = faction[category] || [];
        
        components.forEach(component => {
          const extraComponents = getExtraComponents(component.name, component.faction);
          
          if (extraComponents.length > 0) {
            console.log(`Adding extra components for ${component.name}:`, extraComponents.map(e => e.name));
            
            extraComponents.forEach(extra => {
              let targetCategory = category;
              
              const categoryMap = {
                "Artuno the Betrayer": "agents",
                "The Thundarian": "agents", 
                "Awaken": "abilities",
                "Coalescence": "abilities",
                "Devour": "abilities",
                "Dark Pact": "promissory",
                "Ghoti Home System": "home_systems"
              };

              if (categoryMap[extra.name]) {
                targetCategory = categoryMap[extra.name];
              }

              const extraComponent = {
                id: extra.name.toLowerCase().replace(/\s+/g, '_'),
                name: extra.name,
                faction: extra.faction,
                description: `Gained from ${component.name}`,
                isExtra: true,
                triggerComponent: component.name
              };

              if (!newFaction[targetCategory]) {
                newFaction[targetCategory] = [];
              }
              
              const alreadyAdded = newFaction[targetCategory].some(
                item => item.name === extra.name && item.isExtra
              );
              
              if (!alreadyAdded) {
                newFaction[targetCategory] = [...newFaction[targetCategory], extraComponent];
                
                setDraftHistory(prev => [...prev, {
                  playerIndex: playerIdx,
                  category: targetCategory,
                  item: extraComponent,
                  round: "AUTO-ADD",
                  componentId: extraComponent.id,
                  action: `Added ${extraComponent.name} from ${component.name}`
                }]);
              }
            });
          }
        });
      });
      
      return newFaction;
    });
    
    return updatedFactions;
  };

  const getCurrentFactionLimits = useCallback(() => {
    return draftVariant === "power" ? powerFactionLimits : baseFactionLimits;
  }, [draftVariant]);

  const handleSwap = (playerIndex, swapCategory, componentIndex, swapOption, triggerComponent) => {
    if (!swapOption) return;

    const fc = [...factions];
    
    const swapComponent = {
      id: swapOption.name.toLowerCase().replace(/\s+/g, '_'),
      name: swapOption.name,
      faction: swapOption.faction,
      description: `Swapped from ${triggerComponent.name}`,
      isSwap: true,
      originalComponent: triggerComponent.name,
      triggerComponent: triggerComponent.name
    };

    if (!fc[playerIndex][swapCategory]) {
      fc[playerIndex][swapCategory] = [];
    }
    fc[playerIndex][swapCategory].push(swapComponent);
    setFactions(fc);

    setDraftHistory(prev => [...prev, {
      playerIndex,
      category: swapCategory,
      item: swapComponent,
      round: "SWAP",
      componentId: swapComponent.id,
      action: `Swapped for ${swapComponent.name} (triggered by ${triggerComponent.name})`
    }]);
  };

 const handleReduction = (playerIndex, category, componentIndex) => {
  console.log("=== HANDLE REDUCTION CALLED ===");
  console.log("Player:", playerIndex, "Category:", category, "Index:", componentIndex);
  
  const component = factions[playerIndex][category][componentIndex];
  console.log("Removing component:", component?.name);
  
  const fc = [...factions];
  fc[playerIndex][category].splice(componentIndex, 1);
  setFactions(fc);

  const factionLimits = getCurrentFactionLimits();
  
  console.log("=== REDUCTION CHECK ===");
  console.log("Faction Limits:", factionLimits);
  
  const allPlayersReduced = fc.every((faction, idx) => {
    console.log(`\nChecking Player ${idx + 1}:`);
    const playerComplete = categories.every(cat => {
      const currentCount = faction[cat]?.length || 0;
      const limit = factionLimits[cat];
      const isOver = currentCount > limit;
      console.log(`  ${cat}: ${currentCount}/${limit} ${isOver ? '❌ OVER' : '✓'}`);
      return currentCount <= limit;
    });
    console.log(`  Player ${idx + 1} complete: ${playerComplete}`);
    return playerComplete;
  });

  console.log("\nAll players reduced?", allPlayersReduced);

  if (allPlayersReduced) {
    console.log("Reduction complete - adding extra components");
    const factionsWithExtras = addAllExtraComponents(fc);
    setFactions(factionsWithExtras);
    setDraftPhase("complete");
    return;
  }
};

  const handleBanFaction = useCallback((factionName) => {
    setBannedFactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(factionName)) {
        newSet.delete(factionName);
      } else {
        newSet.add(factionName);
      }
      return newSet;
    });
  }, []);

  const handleBanComponent = useCallback((componentId) => {
    setBannedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  }, []);

  const renderCurrentPlayerInfo = () => {
    if (draftPhase === "reduction") {
        return (
        <div className="p-3 bg-orange-900/30 rounded-lg border border-orange-600">
            <h3 className="font-bold text-orange-400 text-sm">Reduction Phase</h3>
            <div className="text-xs text-orange-300">Remove excess components to meet faction limits</div>
        </div>
        );
    }

    if (draftPhase === "complete") {
        return (
        <div className="p-3 bg-green-900/30 rounded-lg border border-green-600">
            <h3 className="font-bold text-green-400 text-sm">Draft Complete!</h3>
            <div className="text-xs text-green-300">All factions finalized</div>
        </div>
        );
    }

    if (!draftStarted) {
        return (
        <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-600">
            <h3 className="font-bold text-yellow-400 text-sm">Configure settings and click "Start Draft" to begin</h3>
        </div>
        );
    }

    if (multiplayerEnabled) {
        return (
        <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-600">
            <h3 className="font-bold text-blue-400 text-sm">Multiplayer Draft - Round {round}</h3>
            <div className="text-xs text-blue-300">Selected picks: {selectedPicks.length}</div>
        </div>
        );
    }

    const maxPicks = getMaxPicksForRound();
    
    if (maxPicks === 0 && draftVariant !== "rotisserie") {
        setTimeout(() => {
            advanceToNextPlayer(factions, playerProgress);
        }, 500);
        
        return (
        <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-600">
            <h3 className="font-bold text-yellow-400 text-sm">Player {currentPlayer + 1}'s Turn - Round {round}</h3>
            <div className="text-xs text-orange-400">
            Auto-passing: No available picks from this bag (all categories at limit)
            </div>
            <div className="text-xs text-gray-400">Bag {currentPlayer} of {playerBags.length} bags</div>
        </div>
        );
    }
  
    return (
        <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-600">
        <h3 className="font-bold text-blue-400 text-sm">Player {currentPlayer + 1}'s Turn - Round {round}</h3>
        <div className="text-xs text-blue-300">
            Pending picks: {pendingPicks.length} / {maxPicks} (must pick {maxPicks})
            {draftVariant === "rotisserie" && " (One pick per turn)"}
        </div>
        <div className="text-xs text-blue-300">Variant: {draftVariant}</div>
        <div className="text-xs text-gray-400">Bag {currentPlayer} of {playerBags.length} bags</div>
      
        {pendingPicks.length > 0 && (
            <div className="mt-2">
            <div className="text-xs font-semibold mb-1 text-blue-300">Your pending picks:</div>
            <div className="flex flex-wrap gap-1">
                {pendingPicks.map((pick, idx) => (
                <span 
                    key={idx}
                    className="bg-blue-800 px-2 py-1 rounded text-xs cursor-pointer hover:bg-red-800 text-white transition-colors"
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
            disabled={pendingPicks.length < maxPicks}
            className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
            >
            Submit Picks ({pendingPicks.length}/{maxPicks})
            </button>
        )}
      
        {!isPickingPhase && (
            <div className="mt-2 text-xs text-gray-400">
            Picks submitted. Moving to next player...
            </div>
        )}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
  <div className="flex h-screen">
        <Sidebar
          isOpen={!sidebarCollapsed}
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

        {!sidebarCollapsed && (
          <div
            className="sidebar-backdrop"
            role="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

  <div className="flex-1 flex flex-col">
          <div ref={headerRef} className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg app-header">
            <div className="px-4 py-2">
                <h2 className="text-xl font-bold text-yellow-400">Franken Draft</h2>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className={`sidebar-toggle-button px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors`}
                      aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                    >
                      {sidebarCollapsed ? '☰' : '✕'}
                    </button>

                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('/')}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
                      >
                        ← Home
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowBanModal(true)} 
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                  > 
                    Manage Bans
                  </button>

                  <BanManagementModal 
                    isOpen={showBanModal} 
                    onClose={() => setShowBanModal(false)} 
                    bannedFactions={bannedFactions} 
                    bannedComponents={bannedComponents} 
                    onBanFaction={handleBanFaction} 
                    onBanComponent={handleBanComponent} 
                    categories={categories} 
                    expansionsEnabled={expansionsEnabled}
                  />
                  
                  {!multiplayerEnabled && !draftStarted && (
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors" 
                      onClick={startDraftSolo}
                    >
                      Start Draft
                    </button>
                  )}
                  
                  <button 
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors" 
                    onClick={() => setShowSummary(s => !s)}
                  >
                    {showSummary ? "Hide" : "Show"} Summary
                  </button>
                  
                  {draftStarted && (
                    <button
                      onClick={() => setSettingsCollapsed(!settingsCollapsed)}
                      className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
                    >
                      {settingsCollapsed ? "Show" : "Hide"} Info
                    </button>
                  )}
                  {draftStarted && !multiplayerEnabled && (
                    <button
                      onClick={cancelDraft}
                      className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                    >
                      Cancel Draft
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
  {!settingsCollapsed && (
    <div>
      {!multiplayerEnabled && !draftStarted && (
        <>
          <div className="mb-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="font-bold mb-2 text-yellow-400 text-sm">Expansions</h3>
            
            <label className="flex items-center cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={expansionsEnabled.pok}
                onChange={(e) => setExpansionsEnabled(prev => ({ ...prev, pok: e.target.checked }))}
                className="mr-2"
              />
              <span className="font-medium text-white text-sm">Prophecy of Kings</span>
            </label>
            <div className="text-xs text-gray-200 ml-6 mb-2">
              Enables: 7 new factions, Agents, Commanders, Heroes, Mechs, and new tiles.
            </div>

            <label className="flex items-center cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={expansionsEnabled.te}
                onChange={(e) => setExpansionsEnabled(prev => ({ ...prev, te: e.target.checked }))}
                className="mr-2"
              />
              <span className="font-medium text-white text-sm">Thunder's Edge</span>
            </label>
            <div className="text-xs text-gray-200 ml-6 mb-2">
              Enables: 5 New factions, Breakthroughs, and new tiles. (No Firmament/Obsidian)
            </div>

            <label className="flex items-center cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={expansionsEnabled.ds}
                onChange={(e) => setExpansionsEnabled(prev => ({ ...prev, ds: e.target.checked }))}
                className="mr-2"
              />
              <span className="font-medium text-white text-sm">Discordant Stars (DS, Unfinished)</span>
            </label>
            <div className="text-xs text-gray-200 ml-6 mb-2">
              Adds: 30 new factions with all components
            </div>

            <label className="flex items-center cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={expansionsEnabled.us}
                onChange={(e) => setExpansionsEnabled(prev => ({ ...prev, us: e.target.checked }))}
                className="mr-2"
              />
              <span className="font-medium text-white text-sm">Uncharted Space (US)</span>
            </label>
            <div className="text-xs text-gray-200 ml-6 mb-2">
              Adds: Additional system tiles
            </div>

            <label className="flex items-center cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={expansionsEnabled.firmobs}
                onChange={(e) => setExpansionsEnabled(prev => ({ ...prev, firmobs: e.target.checked }))}
                className="mr-2"
              />
              <span className="font-medium text-white text-sm">Add Firmament/Obsidian</span>
            </label>
            <div className="text-xs text-gray-200 ml-6 mb-2">
              Adds: The Firmament and The Obsidian to the draft. (disabled by default)
            </div>
          </div>

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
        </>
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
            console.log("Draft starting with lobby data:", lobbyData);

            const players = Object.values(lobbyData.players || {}).sort(
              (a, b) => a.joinedAt - b.joinedAt
            );

            initializeDraft({
              ...lobbyData.settings,
              playerCount: players.length,
              players,
            });
          }}
          onDraftStateSync={handleDraftStateSync}
        />
      )}

      {renderCurrentPlayerInfo()}
    </div>
  )}

  {(() => {
    console.log("Render check:", { 
      multiplayerEnabled, 
      draftStarted, 
      draftPhase,
      factionsLength: factions.length,
      currentPlayer 
    });
    
    if (!multiplayerEnabled && draftStarted && draftPhase === "draft") {
      console.log("Rendering draft phase");
      return (
        <FactionSheet
          drafted={factions[currentPlayer] || {}}
          onRemove={() => {}}
          draftLimits={draftLimits}
          title={`Player ${currentPlayer + 1}'s Draft`}
          isCurrentPlayer={true}
        />
      );
    } else if (!multiplayerEnabled && draftStarted && draftPhase === "reduction") {
      console.log("Rendering reduction phase for", factions.length, "factions");
      return (
        <>
          <div className="mb-4 p-4 bg-orange-900/30 rounded-lg border border-orange-600">
            <h3 className="font-bold text-orange-400 text-lg mb-2">Reduction Phase</h3>
            <p className="text-orange-300 text-sm">
              Remove excess components from each faction to meet the faction limits. Click any component to remove it.
            </p>
          </div>
          {factions.map((f, i) => {
            console.log(`Rendering faction ${i}:`, f.name);
            return (
              <FactionSheet
                key={i}
                drafted={f}
                onRemove={(cat, idx) => handleReduction(i, cat, idx)}
                onSwapComponent={(playerIdx, category, componentIdx, swapOption, triggerComponent) => 
                  handleSwap(playerIdx, category, componentIdx, swapOption, triggerComponent)
                }
                draftLimits={getCurrentFactionLimits()}
                title={`Player ${i + 1} - Remove Excess Components`}
                showReductionHelper={true}
                playerIndex={i}
              />
            );
          })}
        </>
      );
    } else if (!multiplayerEnabled && draftStarted && draftPhase === "complete") {
      console.log("Rendering complete phase");
      return (
        <>
          <div className="mb-4 p-6 bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-xl border-2 border-green-500 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🎉</span>
              <h3 className="font-bold text-green-400 text-2xl">Draft Complete!</h3>
            </div>
            <p className="text-green-300 mb-4">
              All factions have been finalized with extra components added. Review your custom factions below.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowSummary(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
              >
                📊 View Summary
              </button>
              <button
  onClick={() => {
    const generateDraftText = () => {
      let text = `=== TI4 Draft Export ===\n`;
      text += `Exported At: ${new Date().toLocaleString()}\n`;
      text += `Variant: ${draftVariant}, Players: ${playerCount}\n\n`;

      factions.forEach((faction, idx) => {
        text += `Player ${idx + 1}: ${faction.name}\n`;
        text += '--------------------\n';

        Object.keys(faction).forEach(category => {
          const comps = faction[category];
          if (!Array.isArray(comps) || comps.length === 0) return;

          text += `Category: ${category}\n`;
          comps.forEach(comp => {
            text += `  - ${comp.name}`;
            if (comp.description) text += `: ${comp.description}`;
            const flags = [];
            if (comp.isExtra) flags.push("Extra");
            if (comp.isSwap) flags.push("Swap");
            if (flags.length > 0) text += ` [${flags.join(", ")}]`;
            text += `\n`;
          });
          text += `\n`;
        });

        text += '\n';
      });

      return text;
    };

    const draftText = generateDraftText();
    const blob = new Blob([draftText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute(
      'download',
      `ti4_draft_${new Date().toISOString().slice(0, 10)}.txt`
    );
    linkElement.click();
    URL.revokeObjectURL(url);
  }}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
>
  💾 Export Draft
</button>

              <button
                onClick={() => {
                  if (confirm('Start a new draft? This will clear the current draft.')) {
                    cancelDraft();
                  }
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
              >
                🔄 New Draft
              </button>
            </div>
          </div>
          
          {factions.map((f, i) => (
            <FactionSheet
              key={i}
              drafted={f}
              onRemove={() => {}}
              draftLimits={getCurrentFactionLimits()}
              title={`${f.name} - Final Faction`}
              playerIndex={i}
            />
          ))}
        </>
      );
    } else if (multiplayerEnabled) {
      console.log("Rendering multiplayer");
      return (
        <FactionSheet
          drafted={factions[multiplayerService.playerId] || {}}
          onRemove={() => {}}
          draftLimits={draftLimits}
          title="Your Multiplayer Draft"
        />
      );
    } else {
      console.log("Rendering default/waiting state");
      return factions.length > 0 ? (
        factions.map((f, i) => (
          <FactionSheet
            key={i}
            drafted={f}
            onRemove={() => {}}
            draftLimits={getCurrentFactionLimits()}
            title={f.name}
          />
        ))
      ) : (
        <div className="p-8 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400 text-lg">
            Configure your settings and click "Start Draft" to begin
          </p>
        </div>
      );
    }
  })()}

  <DraftHistory history={draftHistory} />
  {showSummary && <DraftSummary factions={factions} />}
</div>
        </div>
      </div>
    </div>
  );
}