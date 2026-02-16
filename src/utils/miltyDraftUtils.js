import { factionsData, discordantStarsData } from "../data/processedData";
import { pokExclusions, teExclusions, noFirmament, brExclusions } from "./expansionFilters";
import { calculateOptimalResources } from "./resourceCalculator";
import { shuffleArray } from "./shuffle";

const DEFAULT_EXPANSIONS = {
  pok: true,
  te: false,
  ds: false,
  us: false,
  firmobs: false,
  dsOnly: false,
  br: false,
};

export function clampInt(val, min, max, fallback = min) {
  const n = Number(val);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function factionAllowedByExpansion(name, expansionsEnabled) {
  if (!expansionsEnabled.pok && pokExclusions.factions.includes(name)) return false;
  if (!expansionsEnabled.te && teExclusions.factions.includes(name)) return false;
  if (!expansionsEnabled.firmobs && noFirmament.factions.includes(name)) return false;
  if (!expansionsEnabled.br && brExclusions.factions.includes(name)) return false;
  return true;
}

function tileAllowedByExpansion(tile, expansionsEnabled) {
  const id = String(tile?.id ?? "");
  if (!expansionsEnabled.pok && pokExclusions.tiles.includes(id)) return false;
  if (!expansionsEnabled.te && teExclusions.tiles.includes(id)) return false;
  return true;
}

export function getFilteredFactionPool({
  expansionsEnabled = DEFAULT_EXPANSIONS,
  bannedFactions = new Set(),
}) {
  const baseFactions = (expansionsEnabled.dsOnly ? [] : factionsData?.factions ?? [])
    .filter(f => !bannedFactions.has(f.name))
    .filter(f => factionAllowedByExpansion(f.name, expansionsEnabled));

  const dsFactions = (expansionsEnabled.ds ? discordantStarsData?.factions ?? [] : [])
    .filter(f => !bannedFactions.has(f.name));

  // DS faction set can include BR factions if present in DS packs; optional filter:
  const filteredDsFactions = dsFactions.filter(f => factionAllowedByExpansion(f.name, expansionsEnabled));

  return [...baseFactions, ...filteredDsFactions].map(f => ({
    name: f.name,
    icon: f.icon,
    home_systems: Array.isArray(f.home_systems)
      ? f.home_systems
      : Array.isArray(f.home_system)
      ? f.home_system
      : [],
  }));
}

export function sampleUnique(items, count) {
  if (count >= items.length) return shuffleArray(items);
  return shuffleArray(items).slice(0, count);
}

function allTilesFromSources(expansionsEnabled) {
  const baseBlue = factionsData?.tiles?.blue_tiles ?? [];
  const baseRed = factionsData?.tiles?.red_tiles ?? [];

  let dsBlue = [];
  let dsRed = [];
  if (expansionsEnabled.ds && (expansionsEnabled.us || expansionsEnabled.dsOnly)) {
    dsBlue = discordantStarsData?.tiles?.blue_tiles ?? [];
    dsRed = discordantStarsData?.tiles?.red_tiles ?? [];
  }

  return {
    blue: [...baseBlue, ...dsBlue].filter(t => tileAllowedByExpansion(t, expansionsEnabled)),
    red: [...baseRed, ...dsRed].filter(t => tileAllowedByExpansion(t, expansionsEnabled)),
  };
}

function tilePlanetList(tile) {
  return Array.isArray(tile?.planets) ? tile.planets : [];
}

function tileHasLegendary(tile) {
  return tilePlanetList(tile).some(p => !!p?.legendary_ability);
}

function tileTechSpecialtyCount(tile) {
  return tilePlanetList(tile).reduce((acc, p) => {
    const arr = Array.isArray(p?.technology_specialty) ? p.technology_specialty : [];
    return acc + arr.length;
  }, 0);
}

function tileAnomalyCount(tile) {
  const arr = Array.isArray(tile?.anomalies) ? tile.anomalies : [];
  return arr.length;
}

function tileWormholeCount(tile) {
  return tile?.wormhole ? 1 : 0;
}

export function calculateSliceStats(sliceTiles) {
  const planets = sliceTiles.flatMap(tilePlanetList);
  const resInf = calculateOptimalResources(planets);

  const legendaryCount = sliceTiles.reduce((acc, t) => acc + (tileHasLegendary(t) ? 1 : 0), 0);
  const wormholeCount = sliceTiles.reduce((acc, t) => acc + tileWormholeCount(t), 0);
  const anomalyCount = sliceTiles.reduce((acc, t) => acc + tileAnomalyCount(t), 0);
  const techSpecCount = sliceTiles.reduce((acc, t) => acc + tileTechSpecialtyCount(t), 0);

  return {
    totalResource: resInf.totalResource,
    totalInfluence: resInf.totalInfluence,
    optimalResource: resInf.optimalResource,
    optimalInfluence: resInf.optimalInfluence,
    flexValue: resInf.flexValue,
    legendaryCount,
    wormholeCount,
    anomalyCount,
    techSpecCount,
  };
}

export function passesSliceConstraints(stats, constraints = {}) {
  const {
    resInfProfile = "balanced",
    minLegendary,
    maxLegendary,
    minWormholes,
    maxWormholes,
    minAnomalies,
    maxAnomalies,
    minTechSpecs,
    maxTechSpecs,
  } = constraints;

  if (typeof minLegendary === "number" && stats.legendaryCount < minLegendary) return false;
  if (typeof maxLegendary === "number" && stats.legendaryCount > maxLegendary) return false;
  if (typeof minWormholes === "number" && stats.wormholeCount < minWormholes) return false;
  if (typeof maxWormholes === "number" && stats.wormholeCount > maxWormholes) return false;
  if (typeof minAnomalies === "number" && stats.anomalyCount < minAnomalies) return false;
  if (typeof maxAnomalies === "number" && stats.anomalyCount > maxAnomalies) return false;
  if (typeof minTechSpecs === "number" && stats.techSpecCount < minTechSpecs) return false;
  if (typeof maxTechSpecs === "number" && stats.techSpecCount > maxTechSpecs) return false;

  const total = stats.totalResource + stats.totalInfluence;
  if (resInfProfile === "high" && total < 12) return false;
  if (resInfProfile === "low" && total > 10) return false;

  return true;
}

function makeSliceSignature(sliceTiles) {
  return sliceTiles
    .map(t => String(t?.id ?? t?.name ?? ""))
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

export function generateSlicePool({
  size,
  expansionsEnabled = DEFAULT_EXPANSIONS,
  sliceConstraints = {},
  maxAttempts = 12000,
}) {
  const { blue, red } = allTilesFromSources(expansionsEnabled);

  // Milty-like shape target in this implementation: 3 blue + 2 red
  if (blue.length < 3 || red.length < 2) {
    return { slices: [], warning: "Not enough eligible tiles to form slices." };
  }

  const unique = new Map();
  let attempts = 0;

  while (unique.size < size && attempts < maxAttempts) {
    attempts += 1;

    const bluePick = sampleUnique(blue, 3);
    const redPick = sampleUnique(red, 2);
    const tiles = [...bluePick, ...redPick];

    const stats = calculateSliceStats(tiles);
    if (!passesSliceConstraints(stats, sliceConstraints)) continue;

    const sig = makeSliceSignature(tiles);
    if (!unique.has(sig)) {
      unique.set(sig, {
        id: `slice_${unique.size + 1}`,
        tiles,
        stats,
      });
    }
  }

  const slices = Array.from(unique.values());
  const warning = slices.length < size
    ? `Requested ${size} slices; generated ${slices.length} within constraints.`
    : null;

  return { slices, warning };
}

export function generateTablePositionPool(playerCount) {
  const suffixes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  return Array.from({ length: playerCount }, (_, i) => ({
    id: `table_position_${i + 1}`,
    name: suffixes[i] ?? `${i + 1}th`,
    position: i + 1,
  }));
}

export function makeSnakeTurnQueue(playerOrder, categories) {
  const queue = [];
  categories.forEach((cat, roundIdx) => {
    const order = roundIdx % 2 === 0 ? playerOrder : [...playerOrder].reverse();
    order.forEach(playerId => {
      queue.push({ playerId, category: cat });
    });
  });
  return queue;
}

export function randomPlayerOrder(playerCount) {
  return shuffleArray(Array.from({ length: playerCount }, (_, i) => i));
}

export function toDraftMapBuilderPayload({ players, playerCount }) {
  const factions = players.map((p, idx) => {
    const factionPick = p.picks?.faction;
    const slicePick = p.picks?.slice;
    const tablePos = p.picks?.position;

    const blueTiles = (slicePick?.tiles ?? []).filter(t => {
      // heuristic: tiles with planets/anomalies/wormholes can be in either color pools;
      // fallback to source tagging if present
      return !String(t?.id ?? "").startsWith("4") || true;
    });

    // keep split as 3 blue + 2 red for DraftMapBuilder convention
    const blue = blueTiles.slice(0, 3);
    const red = (slicePick?.tiles ?? []).filter(t => !blue.includes(t)).slice(0, 2);

    return {
      name: p.name || `Player ${idx + 1}`,
      table_position: tablePos ? [tablePos] : [],
      home_systems: factionPick?.home_systems?.length ? [factionPick.home_systems[0]] : [],
      blue_tiles: blue,
      red_tiles: red,
    };
  });

  return { factions, playerCount };
}