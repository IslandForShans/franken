import { factionsData, discordantStarsData } from "../data/processedData";

/**
 * Find full component data from JSON files
 */
export const findFullComponentData = (componentName, factionName, targetCategory) => {
  // Try base factions first
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
  
  return null;
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
export const executeSwap = ({ factions, playerIndex, swapCategory, replaceIndex, swapOption, triggerComponent }) => {
  const fullComponent = findFullComponentData(swapOption.name, swapOption.faction, swapCategory);

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
    triggerComponent: triggerComponent.name
  };

  const updatedFactions = [...factions];
  updatedFactions[playerIndex] = { ...updatedFactions[playerIndex] };
  updatedFactions[playerIndex][swapCategory] = [...updatedFactions[playerIndex][swapCategory]];
  updatedFactions[playerIndex][swapCategory][replaceIndex] = swapComponent;

  return { updatedFactions, swapComponent };
};