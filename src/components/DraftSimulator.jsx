import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Sidebar from "./Sidebar.jsx";
import FactionSheet from "./FactionSheet.jsx";
import DraftHistory from "./DraftHistory.jsx";
import DraftSettingsPanel from "./DraftSettingsPanel.jsx";
import DraftSummary from "./DraftSummary.jsx";
import { shuffleArray } from "../utils/shuffle.js";
import { factionsData, discordantStarsData } from "../data/processedData.js";
import { pokExclusions, teExclusions, noFirmament, brExclusions } from "../utils/expansionFilters.js";
import { isComponentUndraftable, getSwapOptionsForTrigger, getExtraComponents } from "../data/undraftable-components.js";
import BanManagementModal from "./BanManagementModal.jsx";
import { executeSwap } from "../utils/swapUtils.js";
import FrankenDrazBuilder from "./FrankenDrazBuilder.jsx";
import { useWebRTCMultiplayer } from '../hooks/useWebRTCMultiplayer';
import MultiplayerPanel from './MultiplayerPanel';
import MultiplayerGuestView from './MultiplayerGuestView';

// PERFORMANCE: Define constants outside component to avoid recreation on every render
const baseFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 3, faction_techs: 2, agents: 1,
  commanders: 1, heroes: 1, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1, home_systems: 1, breakthrough: 1, table_position: 1
};

const powerFactionLimits = {
  blue_tiles: 3, red_tiles: 2, abilities: 4, faction_techs: 3, agents: 2,
  commanders: 2, heroes: 2, promissory: 1, starting_techs: 1, starting_fleet: 1,
  commodity_values: 1, flagship: 1, mech: 1, home_systems: 1, breakthrough: 1, table_position: 1
};

const defaultDraftLimits = {
  ...Object.fromEntries(Object.entries(baseFactionLimits).map(([key, value]) => [key, value + 1])),
  table_position: 1,
};

const powerDraftLimits = {
  ...Object.fromEntries(Object.entries(powerFactionLimits).map(([key, value]) => [key, value + 1])),
  table_position: 1,
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
  const [pendingSwaps, setPendingSwaps] = useState([]);

  // ─── MULTIPLAYER ────────────────────────────────────────────────────────────
const mpCollectedPicks = useRef({});
const mpCollectedFactions = useRef({});
const onPeerMessageRef = useRef(null);
const mpBroadcastedStart = useRef(false);
const [mpGuestState, setMpGuestState] = useState(null);

const multiplayer = useWebRTCMultiplayer({
  onStateReceived: (state) => setMpGuestState(state),
  onPeerMessage: (slotId, msg) => onPeerMessageRef.current?.(slotId, msg),
});

const { role: mpRole, broadcastState, sendToHost } = multiplayer;
const isMultiplayerHost = mpRole === 'host';
const isMultiplayerGuest = mpRole === 'guest';
const myPlayerIndex = multiplayer.mySlotId
  ? parseInt(multiplayer.mySlotId.replace('player_', ''), 10) - 1
  : 0;
// ────────────────────────────────────────────────────────────────────────────

  // Ban system
  const [bannedFactions, setBannedFactions] = useState(new Set());
  const [bannedComponents, setBannedComponents] = useState(new Set());

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const showSidebar = draftStarted && draftPhase === "draft";

  // UI state
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const headerRef = useRef(null);

  // Expansion toggles
  const [expansionsEnabled, setExpansionsEnabled] = useState({
    pok: true,
    te: false,
    ds: false,
    us: false,
    firmobs: false,
    dsOnly: false,
    br: false
  });

  const [frankenDrazSettings, setFrankenDrazSettings] = useState({
    factionsPerBag: 6,
    blueTilesPerBag: 4,
    redTilesPerBag: 3
  });

  // PERFORMANCE: Memoize active categories computation
  const categories = useMemo(() => {
    const baseCategories = [
      'table_position',
      'abilities', 'faction_techs', 'promissory', 'flagship',
      'starting_techs', 'starting_fleet', 'commodity_values',
      'blue_tiles', 'red_tiles', 'home_systems'
    ];
    const pokCategories = ['agents', 'commanders', 'heroes', 'mech'];
    const teCategories = ['breakthrough'];

    let activeCategories = [...baseCategories];

    // Respect PoK/TE toggles in all modes (including DS Only)
    if (expansionsEnabled.pok) {
      activeCategories.push(...pokCategories);
    }

      if (expansionsEnabled.te) {
      activeCategories.push(...teCategories);
    }

    return activeCategories;
  }, [expansionsEnabled.pok, expansionsEnabled.te, expansionsEnabled.dsOnly]);

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
    if (draftVariant === "frankendraz") {
      setFirstRoundPickCount(2);
      setSubsequentRoundPickCount(1);
      return; // draftLimits not used in FrankenDraz
    }

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
    if (!showSidebar) {
      setSidebarCollapsed(true);
    }
  }, [showSidebar]);

  // Broadcast to guests once the draft starts and bags are populated
useEffect(() => {
  if (draftStarted && isMultiplayerHost && !mpBroadcastedStart.current && playerBags.length > 0) {
    mpBroadcastedStart.current = true;
    broadcastState({
      factions, playerBags, round, draftPhase, draftStarted: true,
      draftVariant, firstRoundPickCount, subsequentRoundPickCount,
      playerCount, categories, draftLimits, draftHistory, pendingSwaps, expansionsEnabled,
    });
  }
  if (!draftStarted) mpBroadcastedStart.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [draftStarted, playerBags.length, isMultiplayerHost]);

  // PERFORMANCE: Memoize getFilteredComponents with useCallback
  const getFilteredComponents = useCallback((category, effectivePlayerCount = playerCount) => {
    if (category === 'table_position') {
      const suffixes = ['1st','2nd','3rd','4th','5th','6th','7th','8th'];
      return Array.from({ length: effectivePlayerCount }, (_, i) => ({
        name: suffixes[i] ?? `${i+1}th`,
        position: i + 1,
        id: `table_position_${i+1}`,
      }));
    }

    console.log(`Getting filtered components for category: ${category}`, {
      dsOnly: expansionsEnabled.dsOnly,
      ds: expansionsEnabled.ds,
      pok: expansionsEnabled.pok,
      te: expansionsEnabled.te,
      br: expansionsEnabled.br
    });

    // If DS Only mode is enabled, skip base game FACTIONS but still include all tiles
    const factionComponents = expansionsEnabled.dsOnly ? [] : factionsData.factions
      .filter(f => !bannedFactions.has(f.name))
      .filter(f => expansionsEnabled.pok || !pokExclusions.factions.includes(f.name))
      .filter(f => expansionsEnabled.te || !teExclusions.factions.includes(f.name))
      .filter(f => expansionsEnabled.firmobs || !noFirmament.factions.includes(f.name))
      .filter(f => expansionsEnabled.br || !brExclusions.factions.includes(f.name))
      .flatMap(f => (f[category] || [])
        .filter(comp => !bannedComponents.has(comp.name))
        .filter(comp => !isComponentUndraftable(comp.name, f.name))
        .map(item => ({ ...item, faction: f.name, factionIcon: f.icon, icon: f.icon }))
      );

    console.log(`Base faction components: ${factionComponents.length}`);

    const dsComponents = (expansionsEnabled.ds && discordantStarsData?.factions)
      ? discordantStarsData.factions
          .filter(f => !bannedFactions.has(f.name))
          .flatMap(f => {
            // Handle DS's different naming: "home_system" vs "home_systems"
            let categoryData = f[category];
            if (!categoryData && category === 'home_systems') {
              categoryData = f['home_system'];
            }
            
            if (!categoryData || !Array.isArray(categoryData)) return [];
            return categoryData
              .filter(comp => !bannedComponents.has(comp.name))
              .filter(comp => !isComponentUndraftable(comp.name, f.name))
              .map(item => ({ ...item, faction: f.name, factionIcon: f.icon, icon: f.icon }));
          })
      : [];

    console.log(`DS components: ${dsComponents.length}`);

    // DS Only mode only excludes base game FACTIONS, not tiles
    // When dsOnly is enabled, include ALL tiles (Base, PoK, TE)
    const tiles = (factionsData.tiles[category] || [])
      .filter(tile => !bannedComponents.has(tile.id || tile.name))
      .filter(tile => {
        // In dsOnly mode, include all tiles regardless of PoK/TE settings
        if (expansionsEnabled.dsOnly) {
          return true;
        }
        
        // In normal mode, filter based on expansion settings
        if (pokExclusions.tiles.includes(tile.id) && !expansionsEnabled.pok) {
          return false;
        }
        if (teExclusions.tiles.includes(tile.id) && !expansionsEnabled.te) {
          return false;
        }
        return true;
      });

    console.log(`Base tiles: ${tiles.length}`);

    // US tiles (Uncharted Space) - these contain tiles for DS
    // Include when either US is enabled OR when dsOnly is enabled (to get DS tiles)
    const shouldIncludeUSTiles = (expansionsEnabled.us || expansionsEnabled.dsOnly) && 
                                  expansionsEnabled.ds && 
                                  discordantStarsData?.tiles?.[category];
    
    const usTiles = shouldIncludeUSTiles
      ? (Array.isArray(discordantStarsData.tiles[category])
          ? discordantStarsData.tiles[category]
          : [])
          .filter(tile => !bannedComponents.has(tile.id || tile.name))
      : [];

    console.log(`US tiles: ${usTiles.length}`);

    const totalComponents = [...factionComponents, ...dsComponents, ...tiles, ...usTiles];
    console.log(`Total components for ${category}: ${totalComponents.length}`);
    
    return totalComponents;
  }, [bannedFactions, bannedComponents, expansionsEnabled]);

  // PERFORMANCE: useCallback for createBagsWithUniqueDistribution
  const createBagsWithUniqueDistribution = useCallback((effectivePlayerCount = playerCount) => {
    const bags = Array.from({ length: effectivePlayerCount }, () => ({}));
    
    console.log(`Creating ${effectivePlayerCount} bags for ${effectivePlayerCount} players`);
    
    categories.forEach(category => {
      const allComponents = getFilteredComponents(category, effectivePlayerCount);

      // Table positions should always be exactly one unique position per player,
      // randomized across bags (1st..N based on player count).
      if (category === 'table_position') {
        const validPositions = allComponents
          .filter(position => position.position >= 1 && position.position <= effectivePlayerCount)
          .slice(0, effectivePlayerCount);
        const shuffledPositions = shuffleArray([...validPositions]);

        for (let playerIdx = 0; playerIdx < effectivePlayerCount; playerIdx++) {
          bags[playerIdx][category] = shuffledPositions[playerIdx]
            ? [shuffledPositions[playerIdx]]
            : [];
        }
        return;
      }
      
      // Skip categories with no components
      if (allComponents.length === 0) {
        console.log(`Skipping ${category} - no components available`);
        bags.forEach(bag => {
          bag[category] = [];
        });
        return;
      }
      
      const bagSize = draftLimits[category];
      
      let distributionPool = [];
      const totalNeeded = effectivePlayerCount * bagSize;
      
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
      for (let playerIdx = 0; playerIdx < effectivePlayerCount; playerIdx++) {
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

  const createBagsForFrankenDraz = useCallback((effectivePlayerCount = playerCount) => {
    const bags = Array.from({ length: effectivePlayerCount }, () => ({
      factions: [],
      blue_tiles: [],
      red_tiles: []
    }));
    
    console.log(`Creating ${effectivePlayerCount} FrankenDraz bags`);
    
    // Get all available factions (names and icons only)
    // Get all available factions (names and icons only)
    let allFactions = expansionsEnabled.dsOnly ? [] : factionsData.factions
      .filter(f => !bannedFactions.has(f.name))
      .filter(f => expansionsEnabled.pok || !pokExclusions.factions.includes(f.name))
      .filter(f => expansionsEnabled.te || !teExclusions.factions.includes(f.name))
      .filter(f => expansionsEnabled.firmobs || !noFirmament.factions.includes(f.name))
      .filter(f => expansionsEnabled.br || !brExclusions.factions.includes(f.name))
      .map(f => ({ name: f.name, icon: f.icon }));
    
    if (expansionsEnabled.ds && discordantStarsData?.factions) {
      const dsFactions = discordantStarsData.factions
        .filter(f => !bannedFactions.has(f.name))
        .filter(f => expansionsEnabled.br || !brExclusions.factions.includes(f.name))
        .map(f => ({ name: f.name, icon: f.icon }));
      allFactions = [...allFactions, ...dsFactions];
    }
    
    // Get blue and red tiles
    const blueTiles = getFilteredComponents('blue_tiles');
    const redTiles = getFilteredComponents('red_tiles');
    
    // Distribute factions
    const { factionsPerBag } = frankenDrazSettings;
    let factionPool = shuffleArray([...allFactions]);
    const totalFactionsNeeded = effectivePlayerCount * factionsPerBag;
    
    // Repeat factions if needed
    while (factionPool.length < totalFactionsNeeded) {
      factionPool = [...factionPool, ...shuffleArray([...allFactions])];
    }
    factionPool = shuffleArray(factionPool);
    
    let factionIndex = 0;
    for (let playerIdx = 0; playerIdx < effectivePlayerCount; playerIdx++) {
      for (let i = 0; i < factionsPerBag && factionIndex < factionPool.length; i++) {
        bags[playerIdx].factions.push(factionPool[factionIndex]);
        factionIndex++;
      }
    }
    
    // Distribute blue tiles
    const { blueTilesPerBag } = frankenDrazSettings;
    let bluePool = shuffleArray([...blueTiles]);
    const totalBlueNeeded = effectivePlayerCount * blueTilesPerBag;
    
    while (bluePool.length < totalBlueNeeded) {
      bluePool = [...bluePool, ...shuffleArray([...blueTiles].map(t => ({ ...t, copyIndex: (bluePool.length / blueTiles.length) })))];
    }
    bluePool = shuffleArray(bluePool);
    
    let blueIndex = 0;
    for (let playerIdx = 0; playerIdx < effectivePlayerCount; playerIdx++) {
      for (let i = 0; i < blueTilesPerBag && blueIndex < bluePool.length; i++) {
        bags[playerIdx].blue_tiles.push(bluePool[blueIndex]);
        blueIndex++;
      }
    }
    
    // Distribute red tiles
    const { redTilesPerBag } = frankenDrazSettings;
    let redPool = shuffleArray([...redTiles]);
    const totalRedNeeded = effectivePlayerCount * redTilesPerBag;
    
    while (redPool.length < totalRedNeeded) {
      redPool = [...redPool, ...shuffleArray([...redTiles].map(t => ({ ...t, copyIndex: (redPool.length / redTiles.length) })))];
    }
    redPool = shuffleArray(redPool);
    
    let redIndex = 0;
    for (let playerIdx = 0; playerIdx < effectivePlayerCount; playerIdx++) {
      for (let i = 0; i < redTilesPerBag && redIndex < redPool.length; i++) {
        bags[playerIdx].red_tiles.push(redPool[redIndex]);
        redIndex++;
      }
    }
    
    console.log('Created FrankenDraz bags:', bags);
    return bags;
  }, [playerCount, getFilteredComponents, bannedFactions, expansionsEnabled, frankenDrazSettings]);

  const initializeDraft = useCallback((settings) => {
    const { variant, playerCount: rawPlayerCount, players } = settings;
    const effectivePlayerCount = Number(rawPlayerCount) || 4;

    setPlayerCount(effectivePlayerCount);

    const emptyFactions = Array.from({ length: effectivePlayerCount }, (_, i) => {
        const playerName = players?.[i]?.name || `Player ${i + 1}`;
        const f = { name: playerName };
        categories.forEach(cat => { f[cat] = []; });
        return f;
    });
    setFactions(emptyFactions);

    setPlayerProgress(Array.from({ length: effectivePlayerCount }, () => {
        const p = {};
        categories.forEach(cat => { p[cat] = 0; });
        return p;
    }));

    if (variant === "rotisserie") {
        const pool = {};
        categories.forEach(cat => {
        pool[cat] = getFilteredComponents(cat, effectivePlayerCount);
        });
        setRotisseriePool(pool);
        setPlayerBags([]);
    } else if (variant === "frankendraz") {
        const bags = createBagsForFrankenDraz(effectivePlayerCount);
        setPlayerBags(bags);
        setRotisseriePool({});
    } else {
        const bags = createBagsWithUniqueDistribution(effectivePlayerCount);
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
        checkAndAdvanceIfNeeded(emptyFactions, Array.from({ length: effectivePlayerCount }, () => {
            const p = {};
            categories.forEach(cat => { p[cat] = 0; });
            return p;
        }), 0);
    }, 100);
  }, [categories, getFilteredComponents, createBagsWithUniqueDistribution, createBagsForFrankenDraz ]);

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

    if (draftVariant === "frankendraz") {
      // Check if there's anything left in the FrankenDraz bag
      canPick = (bag.factions?.length > 0) || (bag.blue_tiles?.length > 0) || (bag.red_tiles?.length > 0);
    } else {
      categories.forEach(cat => {
          const inBag = bag[cat]?.length || 0;
          const alreadyPicked = progress[cat] || 0;
          const limit = draftLimits[cat];
          
          if (inBag > 0 && alreadyPicked < limit) {
              canPick = true;
          }
      });
    }
    
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
    if (draftVariant === "rotisserie") {
      return rotisseriePool;
    } else if (draftStarted && playerBags.length > 0) {
      return playerBags[currentPlayer] || {};
    }
    return {};
  }, [draftVariant, draftStarted, playerBags, currentPlayer, rotisseriePool]);
  
  const getMaxPicksForRound = useCallback(() => {
    const baseNeeded = round === 1 ? firstRoundPickCount : subsequentRoundPickCount;
    
    if (draftVariant === "rotisserie") return 1;
    
    if (draftVariant === "frankendraz") {
      const currentBag = playerBags[currentPlayer];
      if (!currentBag) return 0;
      const availableCategories = ['factions', 'blue_tiles', 'red_tiles'].filter(
        cat => currentBag[cat] && currentBag[cat].length > 0
      ).length;
      return Math.min(baseNeeded, availableCategories);
    }

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

    // FrankenDraz special handling
    if (draftVariant === "frankendraz") {
      const validCategories = ['factions', 'blue_tiles', 'red_tiles'];
      if (!validCategories.includes(category)) return;
      
      const componentId = component.id || component.name;
      
      // Check if already picked - if so, remove it (toggle behavior)
      const alreadyPicked = pendingPicks.some(p => 
        p.category === category && (p.component.id || p.component.name) === componentId
      );
      
      if (alreadyPicked) {
        setPendingPicks(prev => 
          prev.filter(pick => 
            !(pick.category === category && (pick.component.id || pick.component.name) === componentId)
          )
        );
        return;
      }

      const alreadyPickedInCategory = pendingPicks.some(p => p.category === category);
      if (alreadyPickedInCategory) {
        alert(`You can only pick one ${category.replace('_', ' ')} per round.`);
        return;
      }
      
      // Check if can add more picks
      const maxPicks = getMaxPicksForRound();
      if (pendingPicks.length >= maxPicks) {
        alert(`You can only pick ${maxPicks} item${maxPicks !== 1 ? 's' : ''} this round.`);
        return;
      }
      
      setPendingPicks(prev => [...prev, { category, component }]);
      return;
    }

    // Original logic for other draft variants
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
  }, [draftStarted, draftPhase, isPickingPhase, playerProgress, currentPlayer, pendingPicks, draftLimits, getMaxPicksForRound, draftVariant]);

  const handleRemovePendingPick = useCallback((category, componentId) => {
    setPendingPicks(prev => 
        prev.filter(pick => 
        !(pick.category === category && (pick.component.id || pick.component.name) === componentId)
        )
    );
  }, []);

  const handleSubmitPicks = () => {
    // ── MULTIPLAYER HOST: collect and wait for all guests ──
  if (isMultiplayerHost) {
    const maxPicks = getMaxPicksForRound();
    if (draftVariant === 'rotisserie') {
      if (pendingPicks.length !== 1) { alert('You must pick exactly 1 component.'); return; }
    } else {
      if (pendingPicks.length < maxPicks) {
        alert(`You must pick ${maxPicks} component${maxPicks !== 1 ? 's' : ''} this round.`);
        return;
      }
    }
    const picksSnapshot = [...pendingPicks];
    setPendingPicks([]);
    setIsPickingPhase(false);
    mpCheckAndApplyAllPicks(0, picksSnapshot);
    return;
  }
  // ── END MULTIPLAYER HOST ──

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
    let updatedBags = [...playerBags];

    pendingPicks.forEach(({ category, component }) => {
        fc[currentPlayer][category] = [...(fc[currentPlayer][category] || []), component];
        
        if (draftVariant !== "frankendraz") {
          pg[currentPlayer][category] = (pg[currentPlayer][category] || 0) + 1;
        }

        if (draftVariant === "rotisserie") {
        setRotisseriePool(prev => {
            const pool = { ...prev };
            const compId = component.id || component.name;
            pool[category] = pool[category].filter(c => (c.id || c.name) !== compId);
            return pool;
        });
        } else {
        // Update local bags array
        const currentBagIdx = currentPlayer;
        updatedBags[currentBagIdx] = { ...updatedBags[currentBagIdx] };
        const compId = component.id || component.name;
        updatedBags[currentBagIdx][category] = updatedBags[currentBagIdx][category].filter(c => (c.id || c.name) !== compId);
        }

        setDraftHistory(prev => [...prev, { 
        playerIndex: currentPlayer, 
        category, 
        item: component, 
        round,
        componentId: component.id || component.name
        }]);
    });

    // Set updated bags state
    setPlayerBags(updatedBags);
    setFactions(fc);
    setPlayerProgress(pg);
    setPendingPicks([]);
    setIsPickingPhase(false);

    // FOR FRANKENDRAZ: Check if all bags are empty using the updated bags
    if (draftVariant === "frankendraz") {
      const allBagsEmpty = updatedBags.every(bag => 
        (!bag.factions || bag.factions.length === 0) &&
        (!bag.blue_tiles || bag.blue_tiles.length === 0) &&
        (!bag.red_tiles || bag.red_tiles.length === 0)
      );
      
      if (allBagsEmpty) {
        console.log("All FrankenDraz bags are empty - moving to build phase");
        setDraftPhase("build");
        return; // Don't advance to next player
      }
    }

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
                // Check if bags are empty for FrankenDraz to transition to build phase
                if (draftVariant === "frankendraz") {
                    const allBagsEmpty = playerBags.every(bag => 
                        (!bag.factions || bag.factions.length === 0) &&
                        (!bag.blue_tiles || bag.blue_tiles.length === 0) &&
                        (!bag.red_tiles || bag.red_tiles.length === 0)
                    );
                    
                    if (allBagsEmpty) {
                        console.log("FrankenDraz draft complete - moving to build phase");
                        setDraftPhase("build");
                        setIsPickingPhase(false);
                        return;
                    }
                }
                
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
                
                if (draftVariant === "frankendraz") {
                    // Check if there's anything in the FrankenDraz bag
                    canPick = (nextBag?.factions?.length > 0) || (nextBag?.blue_tiles?.length > 0) || (nextBag?.red_tiles?.length > 0);
                } else {
                    categories.forEach(cat => {
                        const inBag = nextBag?.[cat]?.length || 0;
                        const alreadyPicked = nextProgress[cat] || 0;
                        const limit = draftLimits[cat];
                        
                        if (inBag > 0 && alreadyPicked < limit) {
                            canPick = true;
                        }
                    });
                }
                
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
    // Helper function to find full component data from JSON
    const findFullComponentData = (componentName, factionName, targetCategory) => {
      // First try to find in base factions
      const baseFaction = factionsData.factions.find(f => f.name === factionName);
      if (baseFaction && baseFaction[targetCategory]) {
        const found = baseFaction[targetCategory].find(c => c.name === componentName);
        if (found) {
          return { ...found, faction: baseFaction.name, factionIcon: baseFaction.icon, icon: baseFaction.icon };
        }
      }
      
      // Try DS factions
      if (discordantStarsData?.factions) {
        const dsFaction = discordantStarsData.factions.find(f => f.name === factionName);
        if (dsFaction) {
          // Handle DS's different naming for home_systems
          let categoryData = dsFaction[targetCategory];
          if (!categoryData && targetCategory === 'home_systems') {
            categoryData = dsFaction['home_system'];
          }
          
          if (categoryData) {
            const found = categoryData.find(c => c.name === componentName);
            if (found) {
              return { ...found, faction: dsFaction.name, factionIcon: dsFaction.icon, icon: dsFaction.icon };
            }
          }
        }
      }
      
      // If not found in factions, try tiles
      if (factionsData.tiles[targetCategory]) {
        const found = factionsData.tiles[targetCategory].find(t => t.name === componentName);
        if (found) return { ...found };
      }
      
      if (discordantStarsData?.tiles?.[targetCategory]) {
        const found = discordantStarsData.tiles[targetCategory].find(t => t.name === componentName);
        if (found) return { ...found };
      }
      
      return null;
    };

    const updatedFactions = currentFactions.map((faction, playerIdx) => {
      const newFaction = { ...faction };
      
      categories.forEach(category => {
        const components = faction[category] || [];
        
        components.forEach(component => {
          const extraComponents = getExtraComponents(component.name, component.faction);
          
          if (extraComponents.length > 0) {
            console.log(`Adding extra components for ${component.name}:`, extraComponents.map(e => e.name));
            
            extraComponents.forEach(extra => {
              let targetCategory = extra.category || category;
              
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

              // Try to find the full component data from JSON
              const fullComponentData = findFullComponentData(extra.name, extra.faction || component.faction, targetCategory);
              
              const extraComponent = fullComponentData ? {
                ...fullComponentData,           // Use full component data if found
                isExtra: true,                  // mark as extra
                triggerComponent: component.name // reference the source
              } : {
                ...extra,                       // fallback to basic extra data
                isExtra: true,
                triggerComponent: component.name,
                description: extra.description || `Gained from ${component.name}`,
                faction: extra.faction || component.faction,
                icon: extra.icon || component.icon || component.factionIcon,
                factionIcon: extra.factionIcon || component.factionIcon || component.icon
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
    if (draftVariant === "power") {
      return powerFactionLimits;
    }

    if (draftVariant === "frankendraz") {
      return {
        ...baseFactionLimits,
        abilities: 4,
        faction_techs: 3,
        blue_tiles: frankenDrazSettings.blueTilesPerBag,
        red_tiles: frankenDrazSettings.redTilesPerBag
      };
    }

    return baseFactionLimits;
  }, [draftVariant, frankenDrazSettings.blueTilesPerBag, frankenDrazSettings.redTilesPerBag]);

  // ─── MULTIPLAYER FUNCTIONS ───────────────────────────────────────────────────

// Collect triggered swaps across all factions
const collectAllSwaps = (factionList) => {
  const allSwaps = [];
  factionList.forEach((faction, playerIdx) => {
    categories.forEach(cat => {
      (faction[cat] || []).forEach((item, itemIdx) => {
        const triggered = getSwapOptionsForTrigger(item.name, item.faction);
        if (triggered?.length > 0) {
          triggered.forEach(swap => allSwaps.push({
            playerIndex: playerIdx, triggerComponent: item,
            triggerCategory: cat, triggerIndex: itemIdx, swapOption: swap,
          }));
        }
      });
    });
  });
  return allSwaps;
};

// Build a full broadcast payload, allowing specific fields to be overridden
const buildBroadcastPayload = (overrides = {}) => ({
  factions, playerBags, round, draftPhase, draftStarted: true,
  draftVariant, firstRoundPickCount, subsequentRoundPickCount,
  playerCount, categories, draftLimits, draftHistory, pendingSwaps, expansionsEnabled,
  ...overrides,
});

// Called when all players have submitted picks for a round
const mpCheckAndApplyAllPicks = (incomingPlayerIndex, incomingPicks) => {
  mpCollectedPicks.current[incomingPlayerIndex] = incomingPicks;
  if (Object.keys(mpCollectedPicks.current).length < playerCount) return;

  const collected = { ...mpCollectedPicks.current };
  mpCollectedPicks.current = {};

  // Apply all picks to factions and remove from bags
  const newFactions = factions.map(f => ({ ...f }));
  const newBags = playerBags.map(b => ({ ...b }));
  const newHistory = [...draftHistory];

  Object.entries(collected).forEach(([piStr, picks]) => {
    const pi = parseInt(piStr, 10);
    picks.forEach(({ category, component }) => {
      newFactions[pi][category] = [...(newFactions[pi][category] || []), component];
      const compId = component.id || component.name;
      newBags[pi] = { ...newBags[pi] };
      newBags[pi][category] = (newBags[pi][category] || []).filter(c => (c.id || c.name) !== compId);
      newHistory.push({ playerIndex: pi, category, item: component, round, componentId: compId });
    });
  });

  // Rotate bags (last bag moves to front)
  const rotatedBags = newBags.length > 1
    ? [newBags[newBags.length - 1], ...newBags.slice(0, newBags.length - 1)]
    : newBags;

  const newRound = round + 1;

  // FrankenDraz: check if all bags are empty → go to build phase
  if (draftVariant === 'frankendraz') {
    const allEmpty = rotatedBags.every(bag =>
      (!bag.factions || bag.factions.length === 0) &&
      (!bag.blue_tiles || bag.blue_tiles.length === 0) &&
      (!bag.red_tiles || bag.red_tiles.length === 0)
    );
    if (allEmpty) {
      setFactions(newFactions);
      setPlayerBags(rotatedBags);
      setDraftHistory(newHistory);
      setDraftPhase('build');
      setPendingPicks([]);
      setIsPickingPhase(true);
      broadcastState(buildBroadcastPayload({
        factions: newFactions, playerBags: rotatedBags,
        round: newRound, draftPhase: 'build', draftHistory: newHistory,
      }));
      return;
    }
  }

  // Standard: check if all players have met their draft limits
  const allLimitsMet = newFactions.every(faction =>
    categories.every(cat => (faction[cat]?.length || 0) >= (draftLimits[cat] || 0))
  );

  if (allLimitsMet) {
    const factionLimits = getCurrentFactionLimits();
    const needsReduction = newFactions.some(faction =>
      categories.some(cat => (faction[cat]?.length || 0) > (factionLimits[cat] ?? Infinity))
    );

    setFactions(newFactions);
    setPlayerBags(rotatedBags);
    setDraftHistory(newHistory);
    setPendingPicks([]);
    setIsPickingPhase(true);

    if (needsReduction) {
      setDraftPhase('reduction');
      broadcastState(buildBroadcastPayload({
        factions: newFactions, playerBags: rotatedBags,
        round: newRound, draftPhase: 'reduction', draftHistory: newHistory,
      }));
    } else {
      const allSwaps = collectAllSwaps(newFactions);
      if (allSwaps.length > 0) {
        setPendingSwaps(allSwaps);
        setDraftPhase('swap');
        broadcastState(buildBroadcastPayload({
          factions: newFactions, playerBags: rotatedBags,
          round: newRound, draftPhase: 'swap', pendingSwaps: allSwaps, draftHistory: newHistory,
        }));
      } else {
        const withExtras = addAllExtraComponents(newFactions);
        setFactions(withExtras);
        setDraftPhase('complete');
        broadcastState(buildBroadcastPayload({
          factions: withExtras, playerBags: rotatedBags,
          round: newRound, draftPhase: 'complete', draftHistory: newHistory,
        }));
      }
    }
    return;
  }

  // Continue drafting
  setFactions(newFactions);
  setPlayerBags(rotatedBags);
  setRound(newRound);
  setDraftHistory(newHistory);
  setPendingPicks([]);
  setIsPickingPhase(true);
  broadcastState(buildBroadcastPayload({
    factions: newFactions, playerBags: rotatedBags,
    round: newRound, draftPhase: 'draft', draftHistory: newHistory,
  }));
};

// Called when all players have submitted their faction for a non-draft phase
const mpCheckAndApplyAllFactions = (phase) => {
  if (Object.keys(mpCollectedFactions.current).length < playerCount) return;

  const collected = { ...mpCollectedFactions.current };
  mpCollectedFactions.current = {};

  // Merge: prefer collected version, fall back to existing
  const merged = factions.map((f, i) => collected[i] ? { ...collected[i] } : { ...f });
  const factionLimits = getCurrentFactionLimits();

  if (phase === 'reduction') {
    const allSwaps = collectAllSwaps(merged);
    if (allSwaps.length > 0) {
      setFactions(merged);
      setPendingSwaps(allSwaps);
      setDraftPhase('swap');
      broadcastState(buildBroadcastPayload({ factions: merged, draftPhase: 'swap', pendingSwaps: allSwaps }));
    } else {
      const withExtras = addAllExtraComponents(merged);
      setFactions(withExtras);
      setDraftPhase('complete');
      broadcastState(buildBroadcastPayload({ factions: withExtras, draftPhase: 'complete', pendingSwaps: [] }));
    }
  } else if (phase === 'swap') {
    const withExtras = addAllExtraComponents(merged);
    setFactions(withExtras);
    setDraftPhase('complete');
    broadcastState(buildBroadcastPayload({ factions: withExtras, draftPhase: 'complete', pendingSwaps: [] }));
  } else if (phase === 'build') {
    // Strip the drafted factions pool (same as handleCompleteBuildPhase)
    const cleaned = merged.map(faction => {
      const { factions: _, ...rest } = faction;
      return rest;
    });
    const needsReduction = cleaned.some(faction =>
      categories.some(cat => (faction[cat]?.length || 0) > (factionLimits[cat] ?? Infinity))
    );
    setFactions(cleaned);
    if (needsReduction) {
      setDraftPhase('reduction');
      broadcastState(buildBroadcastPayload({ factions: cleaned, draftPhase: 'reduction' }));
    } else {
      const allSwaps = collectAllSwaps(cleaned);
      if (allSwaps.length > 0) {
        setPendingSwaps(allSwaps);
        setDraftPhase('swap');
        broadcastState(buildBroadcastPayload({ factions: cleaned, draftPhase: 'swap', pendingSwaps: allSwaps }));
      } else {
        const withExtras = addAllExtraComponents(cleaned);
        setFactions(withExtras);
        setDraftPhase('complete');
        broadcastState(buildBroadcastPayload({ factions: withExtras, draftPhase: 'complete', pendingSwaps: [] }));
      }
    }
  }
};

// Host submits their own faction (index 0) for a phase
const handleHostFactionSubmit = (phase) => {
  mpCollectedFactions.current[0] = factions[0];
  mpCheckAndApplyAllFactions(phase);
};

// ────────────────────────────────────────────────────────────────────────────

const handleSwap = (playerIndex, swapCategory, componentIndex, swapOption, triggerComponent) => {
  const { updatedFactions, swapComponent } = executeSwap({
    factions,
    playerIndex,
    swapCategory,
    replaceIndex: componentIndex,
    swapOption,
    triggerComponent
  });

  if (!swapComponent) return;

  setFactions(updatedFactions);

  setDraftHistory(prev => [...prev, {
    playerIndex,
    category: swapCategory,
    item: swapComponent,
    round: "SWAP",
    componentId: swapComponent.id || swapComponent.name,
    action: `Swapped ${triggerComponent.name} → ${swapComponent.name}`
  }]);

  setPendingSwaps(prev => prev.filter(s => 
    !(s.playerIndex === playerIndex && 
      s.triggerComponent.name === triggerComponent.name &&
      s.swapOption.name === swapOption.name)
  ));
};

const handleRefuseSwap = (playerIndex, triggerComponent, swapOption) => {
  console.log(`Player ${playerIndex + 1} refused swap: ${swapOption.name}`);
  
  // Remove this swap from pending swaps
  setPendingSwaps(prev => prev.filter(s => 
    !(s.playerIndex === playerIndex && 
      s.triggerComponent.name === triggerComponent.name &&
      s.swapOption.name === swapOption.name)
  ));
};

const handleReduction = (playerIndex, category, componentIndex) => {
  console.log("=== HANDLE REDUCTION CALLED ===");
  console.log("Player:", playerIndex, "Category:", category, "Index:", componentIndex);
  
  const component = factions[playerIndex][category][componentIndex];
  console.log("Removing component:", component?.name);
  
  const fc = [...factions];
  fc[playerIndex][category].splice(componentIndex, 1);

  // Also remove any swapped components that were triggered by this component
  if (component && !component.isSwap) {
    categories.forEach(cat => {
      fc[playerIndex][cat] = fc[playerIndex][cat].filter(
        item => !(item.isSwap && item.triggerComponent === component.name)
      );
    });
  }

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

  // Always update factions state first
  setFactions(fc);

  if (allPlayersReduced) {
    console.log("Reduction complete - checking for available swaps");
    
    // Collect all available swaps across all players
    const allSwaps = [];
    fc.forEach((faction, playerIdx) => {
      categories.forEach(cat => {
        const items = faction[cat] || [];
        items.forEach((item, itemIdx) => {
          if (!item || !item.name) return;
          
          const triggeredSwaps = getSwapOptionsForTrigger(item.name, item.faction);
          if (triggeredSwaps && Array.isArray(triggeredSwaps) && triggeredSwaps.length > 0) {
            triggeredSwaps.forEach(swap => {
              allSwaps.push({
                playerIndex: playerIdx,
                triggerComponent: item,
                triggerCategory: cat,
                triggerIndex: itemIdx,
                swapOption: swap
              });
            });
          }
        });
      });
    });
    
    console.log(`Found ${allSwaps.length} available swaps`);
    
    if (allSwaps.length > 0) {
      console.log("Moving to swap phase");
      setPendingSwaps(allSwaps);
      setDraftPhase("swap");
      return;
    }
    
    console.log("No swaps available - adding extra components and completing");
    const factionsWithExtras = addAllExtraComponents(fc);
    setFactions(factionsWithExtras);
    setDraftPhase("complete");
  }
};

const handleAddComponentToBuild = (playerIndex, category, component) => {
    const fc = [...factions];
    
    // Check if at limit
    const currentCount = (fc[playerIndex][category] || []).length;
    const limit = getCurrentFactionLimits()[category];
    
    if (currentCount >= limit) {
      alert(`Cannot add more ${category}. Limit is ${limit}.`);
      return;
    }
    
    // Check if already added
    const alreadyAdded = (fc[playerIndex][category] || []).some(
      item => item.name === component.name && item.faction === component.faction
    );
    
    if (alreadyAdded) {
      return;
    }
    
    // Add component
    if (!fc[playerIndex][category]) {
      fc[playerIndex][category] = [];
    }
    
    fc[playerIndex][category] = [...fc[playerIndex][category], component];
    setFactions(fc);
  };
  
  const handleRemoveComponentFromBuild = (playerIndex, category, componentIndex) => {
    const fc = [...factions];
    
    if (!fc[playerIndex][category] || !fc[playerIndex][category][componentIndex]) {
      return;
    }
    
    fc[playerIndex][category] = fc[playerIndex][category].filter((_, idx) => idx !== componentIndex);
    setFactions(fc);
  };
  
  const handleCompleteBuildPhase = () => {
    const limits = getCurrentFactionLimits();
    
    // Check if any player needs reduction
    let needsReduction = false;
    
    factions.forEach((faction, idx) => {
      categories.forEach(cat => {
        const count = (faction[cat] || []).length;
        const limit = limits[cat];
        
        if (count > limit) {
          needsReduction = true;
        }
      });
    });
    
    // Remove 'factions' category from all players as it's no longer needed
    const fc = factions.map(faction => {
      const { factions: _, ...rest } = faction;
      return rest;
    });
    
    setFactions(fc);
    console.log("Build phase complete");
    
    // If any player is over limits, go to reduction phase
    // Otherwise skip straight to swap phase
    if (needsReduction) {
      console.log("Players over limits - moving to reduction phase");
      setDraftPhase("reduction");
    } else {
      console.log("All players within limits - checking for swaps");
      // Check for available swaps
      const allSwaps = [];
      fc.forEach((faction, playerIdx) => {
        categories.forEach(cat => {
          const items = faction[cat] || [];
          items.forEach((item, itemIdx) => {
            if (!item || !item.name) return;
            
            const triggeredSwaps = getSwapOptionsForTrigger(item.name, item.faction);
            if (triggeredSwaps && Array.isArray(triggeredSwaps) && triggeredSwaps.length > 0) {
              triggeredSwaps.forEach(swap => {
                allSwaps.push({
                  playerIndex: playerIdx,
                  triggerComponent: item,
                  triggerCategory: cat,
                  triggerIndex: itemIdx,
                  swapOption: swap
                });
              });
            }
          });
        });
      });
      
      if (allSwaps.length > 0) {
        console.log(`Found ${allSwaps.length} available swaps - moving to swap phase`);
        setPendingSwaps(allSwaps);
        setDraftPhase("swap");
      } else {
        console.log("No swaps available - adding extra components and completing");
        const factionsWithExtras = addAllExtraComponents(fc);
        setFactions(factionsWithExtras);
        setDraftPhase("complete");
      }
    }
  };

  useEffect(() => {
  if (draftPhase === "swap" && pendingSwaps.length === 0) {
    console.log("All swaps resolved - adding extra components and completing");
    const factionsWithExtras = addAllExtraComponents(factions);
    setFactions(factionsWithExtras);
    setDraftPhase("complete");
  }
}, [pendingSwaps, draftPhase]);

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

  if (draftPhase === "swap") {
    return (
      <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-600">
        <h3 className="font-bold text-blue-400 text-sm">Swap Phase</h3>
        <div className="text-xs text-blue-300">
          Review available swaps: {pendingSwaps.length} remaining
        </div>
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
        <div className="text-xs text-gray-400">Bag {currentPlayer + 1} of {playerBags.length} bags</div>
      
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

  onPeerMessageRef.current = (slotId, msg) => {
    if (msg.type === 'PICK') {
      const { playerIndex, picks } = msg;
      mpCheckAndApplyAllPicks(playerIndex, picks);
    }
    if (msg.type === 'FACTION_UPDATE') {
      const { playerIndex, faction, phase } = msg;
      mpCollectedFactions.current[playerIndex] = faction;
      mpCheckAndApplyAllFactions(phase);
    }
  };

  return (
    isMultiplayerGuest ? (
      <MultiplayerGuestView
        mpState={mpGuestState}
        myPlayerIndex={myPlayerIndex}
        onSubmitPicks={(picks) => sendToHost({ type: 'PICK', playerIndex: myPlayerIndex, picks })}
        onSubmitFaction={(faction, phase) => sendToHost({ type: 'FACTION_UPDATE', playerIndex: myPlayerIndex, faction, phase })}
        onNavigate={onNavigate}
      />
    ) : ( 
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black">
  <div className="flex min-h-[100dvh]">
        {showSidebar && (
          <>
            <Sidebar
              isOpen={!sidebarCollapsed}
              categories={categories}
              onSelectCategory={setSelectedCategory}
              playerProgress={playerProgress[currentPlayer] || {}}
              draftLimits={draftPhase === "reduction" ?
                getCurrentFactionLimits() : 
                draftLimits
              }
              selectedCategory={selectedCategory}
              availableComponents={getAvailableComponents()}
              onComponentClick={handlePick}
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
          </>
        )}

  <div className="flex-1 flex flex-col">
          <div ref={headerRef} className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg app-header">
            <div className="px-4 py-2">
                <h2 className="text-xl font-bold text-yellow-400">Franken Draft</h2>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-3">
                    {showSidebar && (
                      <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`sidebar-toggle-button px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors`}
                        aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                      >
                        {sidebarCollapsed ? '☰' : '✕'}
                      </button>
                    )}

                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('/')}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors mobile-action-button"
                      >
                        ← Home
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end mobile-toolbar-actions">
                  <button 
                    onClick={() => setShowBanModal(true)} 
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors mobile-action-button"
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
                  
                  {!draftStarted && (
                    <button 
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors mobile-action-button" 
                      onClick={startDraftSolo}
                    >
                      Start Draft
                    </button>
                  )}
                  
                  <button 
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors mobile-action-button"                     onClick={() => setShowSummary(s => !s)}
                  >
                    {showSummary ? "Hide" : "Show"} Summary
                  </button>
                  
                  {draftStarted && (
                    <button
                      onClick={() => setSettingsCollapsed(!settingsCollapsed)}
                      className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors mobile-action-button"                    >
                      {settingsCollapsed ? "Show" : "Hide"} Info
                    </button>
                  )}
                  {draftStarted && (
                    <button
                      onClick={cancelDraft}
                      className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors mobile-action-button"
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
      {!draftStarted && (
        <>
          <div className="mb-3 p-4 bg-gray-900/70 rounded-lg border border-gray-700">
  <h3 className="font-bold mb-4 text-yellow-400 text-sm">Expansions</h3>

  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
    {/* Prophecy of Kings */}
    <div>
      <label className="flex items-center cursor-pointer mb-1">
        <input
          type="checkbox"
          checked={expansionsEnabled.pok}
          onChange={(e) =>
            setExpansionsEnabled((prev) => ({ ...prev, pok: e.target.checked }))
          }
          className="mr-2"
        />
        <span className="font-medium text-white text-sm">Prophecy of Kings</span>
      </label>
      <div className="text-xs text-gray-200 ml-6">
        Enables: 7 new factions, Agents, Commanders, Heroes, Mechs, and new tiles.
      </div>
    </div>

    {/* Thunder's Edge */}
    <div>
      <label className="flex items-center cursor-pointer mb-1">
        <input
          type="checkbox"
          checked={expansionsEnabled.te}
          onChange={(e) =>
            setExpansionsEnabled((prev) => ({ ...prev, te: e.target.checked }))
          }
          className="mr-2"
        />
        <span className="font-medium text-white text-sm">Thunder's Edge</span>
      </label>
      <div className="text-xs text-gray-200 ml-6">
        Enables: 5 new factions, Breakthroughs, and new tiles. (No Firmament/Obsidian)
      </div>
    </div>

    {/* Discordant Stars */}
    <div>
      <label className="flex items-center cursor-pointer mb-1">
        <input
          type="checkbox"
          checked={expansionsEnabled.ds}
          onChange={(e) =>
            setExpansionsEnabled((prev) => ({ ...prev, ds: e.target.checked }))
          }
          className="mr-2"
        />
        <span className="font-medium text-white text-sm">
          Discordant Stars (DS)
        </span>
      </label>
      <div className="text-xs text-gray-200 ml-6">
        Adds: 30 new factions with all components
      </div>
    </div>

    {/* Uncharted Space */}
    <div>
      <label className="flex items-center cursor-pointer mb-1">
        <input
          type="checkbox"
          checked={expansionsEnabled.us}
          onChange={(e) =>
            setExpansionsEnabled((prev) => ({ ...prev, us: e.target.checked }))
          }
          className="mr-2"
        />
        <span className="font-medium text-white text-sm">Uncharted Space (US)</span>
      </label>
      <div className="text-xs text-gray-200 ml-6">
        Adds: Additional system tiles
      </div>
    </div>

    {/* Firmament/Obsidian */}
    <div>
      <label className="flex items-center cursor-pointer mb-1">
        <input
          type="checkbox"
          checked={expansionsEnabled.firmobs}
          onChange={(e) =>
            setExpansionsEnabled((prev) => ({ ...prev, firmobs: e.target.checked }))
          }
          className="mr-2"
        />
        <span className="font-medium text-white text-sm">Add Firmament/Obsidian</span>
      </label>
      <div className="text-xs text-gray-200 ml-6">
        Adds: The Firmament and The Obsidian to the draft. (disabled by default)
      </div>
    </div>

    {/* Discordant Stars Only Mode */}
    <div>
      <label className="flex items-center cursor-pointer mb-1">
        <input
          type="checkbox"
          checked={expansionsEnabled.dsOnly}
          disabled={!expansionsEnabled.ds}
          onChange={(e) =>
            setExpansionsEnabled((prev) => ({ ...prev, dsOnly: e.target.checked }))
          }
          className="mr-2"
        />
        <span
          className={`font-medium text-sm ${
            !expansionsEnabled.ds ? "text-gray-500" : "text-white"
          }`}
        >
          Discordant Stars Only Mode
        </span>
      </label>
      <div className="text-xs text-gray-200 ml-6">
        Removes all base game factions and tiles, using only Discordant Stars content. (Requires DS to be enabled)
      </div>
    </div>

    {/* Blue Reverie */}
    <div>
      <label className="flex items-center cursor-pointer mb-1">
        <input
          type="checkbox"
          checked={expansionsEnabled.br}
          onChange={(e) =>
            setExpansionsEnabled((prev) => ({ ...prev, br: e.target.checked }))
          }
          className="mr-2"
        />
        <span className="font-medium text-white text-sm">
          Blue Reverie
        </span>
      </label>
      <div className="text-xs text-gray-200 ml-6">
        Adds: 6 New factions by the creator of DS
      </div>
    </div>
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
            frankenDrazSettings={frankenDrazSettings}
            setFrankenDrazSettings={setFrankenDrazSettings}
          />
          <MultiplayerPanel playerCount={playerCount} multiplayer={multiplayer} />
        </>
      )}

      {renderCurrentPlayerInfo()}
    </div>
  )}

  {(() => {
    console.log("Render check:", {
      draftStarted, 
      draftPhase,
      factionsLength: factions.length,
      currentPlayer 
    });
    
    if (draftStarted && draftPhase === "draft") {
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
   } else if (draftStarted && draftPhase === "build") {
  const visibleFactions = isMultiplayerHost ? [factions[0]] : factions;
  return (
    <>
      <div className="mb-4 p-4 bg-purple-900/30 rounded-lg border border-purple-600">
        <h3 className="font-bold text-purple-400 text-lg mb-2">Build Phase</h3>
        <p className="text-purple-300 text-sm mb-2">
          Build your factions from the components you drafted. Click on components to add them to your build.
        </p>
        <p className="text-purple-300 text-sm mb-3">
          You must stay within the standard faction limits. Your drafted blue and red tiles are already included.
        </p>
        <button
          onClick={isMultiplayerHost ? () => handleHostFactionSubmit('build') : handleCompleteBuildPhase}
          className="mt-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors shadow-lg"
        >
          {isMultiplayerHost ? 'Complete My Build' : 'Complete Build Phase & Continue'}
        </button>
      </div>
      <div className="space-y-6">
        {visibleFactions.map((f, i) => {
          const actualIndex = isMultiplayerHost ? 0 : i;
          return (
            <FrankenDrazBuilder
              key={actualIndex}
              playerIndex={actualIndex}
              draftedItems={f}
              builtFaction={f}
              onAddComponent={(category, component) => handleAddComponentToBuild(actualIndex, category, component)}
              onRemoveComponent={(category, index) => handleRemoveComponentFromBuild(actualIndex, category, index)}
              factionLimits={getCurrentFactionLimits()}
              expansionsEnabled={expansionsEnabled}
              activeCategories={categories}
              bannedComponents={bannedComponents}
            />
          );
        })}
      </div>
    </>
  );
    } else if (draftStarted && draftPhase === "reduction") {
  const visibleFactions = isMultiplayerHost ? [factions[0]] : factions;
  return (
    <>
      <div className="mb-4 p-4 bg-orange-900/30 rounded-lg border border-orange-600">
        <h3 className="font-bold text-orange-400 text-lg mb-2">Reduction Phase</h3>
        <p className="text-orange-300 text-sm">
          Remove excess components from each faction to meet the faction limits. Click any component to remove it.
        </p>
        {isMultiplayerHost && (
          <button
            onClick={() => handleHostFactionSubmit('reduction')}
            className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Done with Reductions
          </button>
        )}
      </div>
      {visibleFactions.map((f, i) => {
        const actualIndex = isMultiplayerHost ? 0 : i;
        return (
          <FactionSheet
            key={actualIndex}
            drafted={f}
            onRemove={(cat, idx) => handleReduction(actualIndex, cat, idx)}
            onSwapComponent={(playerIdx, category, componentIdx, swapOption, triggerComponent) =>
              handleSwap(actualIndex, category, componentIdx, swapOption, triggerComponent)}
            draftLimits={getCurrentFactionLimits()}
            title={isMultiplayerHost ? 'Your Faction — Remove Excess' : `Player ${actualIndex + 1} - Remove Excess Components`}
            showReductionHelper={true}
            showRemoveButton={true}
            playerIndex={actualIndex}
          />
        );
      })}
    </>
  );
    } else if (draftStarted && draftPhase === "swap") {
  const visibleFactions = isMultiplayerHost ? [factions[0]] : factions;
  return (
    <>
      <div className="mb-4 p-4 bg-blue-900/30 rounded-lg border border-blue-600">
        <h3 className="font-bold text-blue-400 text-lg mb-2">Swap Phase</h3>
        <p className="text-blue-300 text-sm">
          Review available component swaps. You can choose to swap components or refuse the swap.
        </p>
        {isMultiplayerHost && (
          <button
            onClick={() => handleHostFactionSubmit('swap')}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Done with Swaps
          </button>
        )}
      </div>
      {visibleFactions.map((f, i) => {
        const actualIndex = isMultiplayerHost ? 0 : i;
        const playerSwaps = pendingSwaps.filter(s => s.playerIndex === actualIndex);
        return (
          <FactionSheet
            key={actualIndex}
            drafted={f}
            onRemove={() => {}}
            onSwapComponent={(playerIdx, category, componentIdx, swapOption, triggerComponent) =>
              handleSwap(actualIndex, category, componentIdx, swapOption, triggerComponent)}
            onRefuseSwap={(playerIdx, triggerComponent, swapOption) =>
              handleRefuseSwap(actualIndex, triggerComponent, swapOption)}
            draftLimits={{}}
            title={isMultiplayerHost ? 'Your Faction — Review Swaps' : `Player ${actualIndex + 1} - Review Swaps`}
            showSwapHelper={true}
            availableSwaps={playerSwaps}
            playerIndex={actualIndex}
          />
        );
      })}
    </>
  );
  } else if (draftStarted && draftPhase === "complete") {
  const visibleFactions = isMultiplayerHost ? [factions[0]] : factions;
  return (
    <>
      <div className="mb-4 p-6 bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-xl border-2 border-green-500 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🎉</span>
          <h3 className="font-bold text-green-400 text-2xl">Draft Complete! Click 'Export Draft' before pressing 'Build Map' to save selections!</h3>
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

              <button
                onClick={() => onNavigate('/mapbuilder-draft', { factions, playerCount })}
                className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
              >
                🗺️ Build Map
              </button>
            </div>
          </div>
      {visibleFactions.map((f, i) => {
        const actualIndex = isMultiplayerHost ? 0 : i;
        return (
          <FactionSheet
            key={actualIndex}
            drafted={f}
            onRemove={() => {}}
            draftLimits={getCurrentFactionLimits()}
            title={`${f.name} - Final Faction`}
            playerIndex={actualIndex}
          />
        );
      })}
    </>
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
    )
  );
}