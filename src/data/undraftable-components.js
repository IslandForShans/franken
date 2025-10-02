// src/data/undraftable-components.js
// Components that cannot be drafted but are available as swaps/additions

export const undraftableComponents = {
  // Abilities that are gained when drafting other components
  abilities: [
    { name: "Awaken", faction: "The Titans of Ul", triggerComponent: "Terragenesis", type: "gain_extra" },
    { name: "Coalescence", faction: "The Titans of Ul", triggerComponent: "Terragenesis", type: "gain_extra" },
    { name: "Devour", faction: "The Vuil'Raith Cabal", triggerComponent: "Amalgamation", type: "gain_when_draft" },
    { name: "Devour", faction: "The Vuil'Raith Cabal", triggerComponent: "Riftmeld", type: "gain_when_draft" },
    { name: "Fragile", faction: "The Universities of Jol-Nar", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Mitosis", faction: "The Arborec", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Hubris", faction: "The Mahact Gene-Sorcerers", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Propagation", faction: "The Nekro Virus", reason: "Just Plain Garbage", type:"garbage" }
  ],

  // Home systems with optional swaps
  home_systems: [
    { name: "Creuss Gate", faction: "The Ghosts of Creuss", triggerComponent: "Slipstream", type: "optional_swap" },
    { name: "Ghosts Home System", faction: "The Ghosts of Creuss", triggerComponent: "Slipstream", type: "optional_swap" }
  ],

  // Promissory notes
  promissory: [
    { name: "Gift of Prescience", faction: "The Naalu Collective", triggerComponent: "Telepathic", type: "optional_swap" },
    { name: "Dark Pact", faction: "The Empyrean", triggerComponent: "Dark Whispers", type: "gain_extra" },
    { name: "Promise of Protection", faction: "The Mentak Coalition", triggerComponent: "Pillage", type: "optional_swap" },
    { name: "Antivirus", faction: "The Nekro Virus", triggerComponent: "Tech Singularity", type: "optional_swap" }
  ],

  // Faction techs
  faction_techs: [
    { name: "Valefar Assimilator Y", faction: "The Nekro Virus", triggerComponent: "Galactic Threat", type: "optional_swap" },
    { name: "Valefar Assimilator X", faction: "The Nekro Virus", triggerComponent: "Tech Singularity", type: "optional_swap" }
  ],

  // Leaders
  agents: [
    { name: "Artuno the Betrayer", faction: "The Nomad", triggerComponent: "The Company", type: "gain_extra" },
    { name: "The Thundarian", faction: "The Nomad", triggerComponent: "The Company", type: "gain_extra" },
    { name: "Suffi An", faction: "The Mentak Coalition", triggerComponent: "Pillage", type: "optional_swap" }
  ],

  commanders: [
    { name: "IL Na Viroset", faction: "The Mahact Gene-Sorcerers", triggerComponent: "Imperia", type: "optional_swap" }
  ],

  heroes: [
    { name: "Dimensional Anchor", faction: "The Vuil'Raith Cabal", triggerComponent: "Dimensional Tear II", type: "optional_swap" }
  ],

  // Mechs
  mech: [
    { name: "ZS Thunderbolt M2", faction: "The Federation of Sol", triggerComponent: "Orbital Drop", type: "optional_swap" },
    { name: "Blackshade Infiltrator", faction: "The Yssaril Tribes", triggerComponent: "Stall Tactics", type: "optional_swap" },
    { name: "Ember Colossus", faction: "The Embers of Muaat", triggerComponent: "Star Forge", type: "optional_swap" },
    { name: "Moyin's Ashes", faction: "The Yin Brotherhood", triggerComponent: "Indoctrination", type: "optional_swap" },
    { name: "Mordred", faction: "The Nekro Virus", triggerComponent: "X or Y Assimilators", type: "optional_swap" },
    { name: "Starlancer", faction: "The Mahact Gene-Sorcerers", triggerComponent: "Edict", type: "optional_swap" },
    { name: "Shield Paling", faction: "The Universities of Jol-Nar", reason: "Just Plain Garbage", type: "garbage" }
  ],

  // Flagships
  flagship: [
    { name: "Hil Colish", faction: "The Ghosts of Creuss", triggerComponent: "any component w/ delta WH", type: "optional_swap" }
  ],

  // Base units (completely undraftable)
  base_units: [
    { name: "Floating Factory I", faction: "The Clan of Saar", type: "base_unit" },
    { name: "Memoria I", faction: "The Nomad", type: "base_unit" },
    { name: "Saturn Engine I", faction: "The Titans of Ul", type: "base_unit" },
    { name: "Hel-Titan I", faction: "The Titans of Ul", type: "base_unit" },
    { name: "Dimensional Tear I", faction: "The Vuil'Raith Cabal", type: "base_unit" },
    { name: "Spec Ops I", faction: "The Federation of Sol", type: "base_unit" },
    { name: "Prototype War Sun I", faction: "The Embers of Muaat", type: "base_unit" },
    { name: "Super-Dreadnought I", faction: "The L1Z1X Mindnet", type: "base_unit" },
    { name: "Advanced Carrier I", faction: "The Federation of Sol", type: "base_unit" },
    { name: "Strike Wing Alpha I", faction: "The Argent Flight", type: "base_unit" },
    { name: "Letani Warrior I", faction: "The Arborec", type: "base_unit" },
    { name: "Crimson Legionnaire I", faction: "The Mahact Gene-Sorcerers", type: "base_unit" },
    { name: "Hybrid Crystal Fighter I", faction: "The Naalu Collective", type: "base_unit" },
    { name: "Exotrireme I", faction: "Sardakk N'orr", type: "base_unit" }
  ],

  // Starting techs
  starting_techs: [
    { name: "Sardakk Starting Tech", faction: "Sardakk N'orr", reason: "Just Plain Garbage", type: "garbage" }
  ]
};

export const isComponentUndraftable = (componentName, faction = null) => {
  for (const category of Object.values(undraftableComponents)) {
    const found = category.find(comp => 
      comp.name === componentName && 
      (faction ? comp.faction === faction : true)
    );
    if (found) return found;
  }
  return null;
};

export const getSwapOptions = (componentName, faction) => {
  const undraftable = isComponentUndraftable(componentName, faction);
  if (undraftable && undraftable.type === "optional_swap") {
    return undraftable;
  }
  return null;
};

export const getExtraComponents = (componentName, faction) => {
  const results = [];
  for (const category of Object.values(undraftableComponents)) {
    const extras = category.filter(comp => 
      comp.triggerComponent === componentName && 
      comp.faction === faction && 
      (comp.type === "gain_extra" || comp.type === "gain_when_draft")
    );
    results.push(...extras);
  }
  return results;
};