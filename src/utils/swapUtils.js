import { factionsData, discordantStarsData } from "../data/processedData";

const getFactionCategoryData = (faction, targetCategory) => {
  if (!faction) return null;
  return (
    faction[targetCategory] ||
    (targetCategory === "home_systems" ? faction.home_system : null)
  );
};

const findFactionComponent = (
  factions,
  componentName,
  factionName,
  category,
) => {
  const faction = factions?.find((item) => item.name === factionName);
  const categoryData = getFactionCategoryData(faction, category);
  const found = categoryData?.find((item) => item.name === componentName);

  if (!found) return null;

  return {
    ...found,
    faction: faction.name,
    factionIcon: faction.icon,
    icon: faction.icon,
  };
};

const findTileComponent = (tiles, componentName, category) => {
  const found = tiles?.[category]?.find((tile) => tile.name === componentName);
  return found ? { ...found } : null;
};

export const findFullComponentData = (
  componentName,
  factionName,
  targetCategory,
) => {
  return (
    findFactionComponent(
      factionsData.factions,
      componentName,
      factionName,
      targetCategory,
    ) ||
    findFactionComponent(
      discordantStarsData?.factions,
      componentName,
      factionName,
      targetCategory,
    ) ||
    findTileComponent(factionsData.tiles, componentName, targetCategory) ||
    findTileComponent(
      discordantStarsData?.tiles,
      componentName,
      targetCategory,
    ) ||
    null
  );
};

/**
 * Execute a swap operation
 * @param {Object} params - Swap parameters
 * @param {Array} params.factions - Current factions array
 * @param {number} params.playerIndex - Player index
 * @param {string} params.swapCategory - Category to swap in
 * @param {number} params.replaceIndex - Index of component to replace
 * @param {Object} params.swapOption - The swap option selected
 * @param {Object} params.triggerComponent - The component that triggered the swap
 * @returns {Object} - { updatedFactions, swapComponent }
 */
export const executeSwap = ({
  factions,
  playerIndex,
  swapCategory,
  replaceIndex,
  swapOption,
  triggerComponent,
}) => {
  const fullComponent = findFullComponentData(
    swapOption.name,
    swapOption.faction,
    swapCategory,
  );

  if (!fullComponent) {
    console.warn("Component not found in faction data:", swapOption.name);
    return { updatedFactions: factions, swapComponent: null };
  }

  const swapComponent = {
    ...fullComponent,
    faction: swapOption.faction,
    factionIcon: fullComponent.icon || fullComponent.factionIcon,
    icon: fullComponent.icon || fullComponent.factionIcon,
    isSwap: true,
    originalComponent: triggerComponent.name,
    triggerComponent: triggerComponent.name,
  };

  const updatedFactions = [...factions];
  updatedFactions[playerIndex] = { ...updatedFactions[playerIndex] };
  updatedFactions[playerIndex][swapCategory] = [
    ...updatedFactions[playerIndex][swapCategory],
  ];
  updatedFactions[playerIndex][swapCategory][replaceIndex] = swapComponent;

  return { updatedFactions, swapComponent };
};
