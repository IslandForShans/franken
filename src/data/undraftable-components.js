// src/data/undraftable-components.js
// Components that cannot be drafted but are available as swaps/additions

export const undraftableComponents = {
  // Abilities that are gained when drafting other components
  abilities: [
    { name: "Awaken", faction: "Titans", triggerComponent: "Terragenesis", type: "gain_extra" },
    { name: "Coalescence", faction: "Titans", triggerComponent: "Terragenesis", type: "gain_extra" },
    { name: "Devour", faction: "Cabal", triggerComponent: "Amalgamation", type: "gain_when_draft" },
    { name: "Devour", faction: "Cabal", triggerComponent: "Riftmeld", type: "gain_when_draft" },
    { name: "Fragile", faction: "Jol-Nar", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Mitosis", faction: "Arborec", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Hubris", faction: "Mahact", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Propagation", faction: "Nekro", reason: "Just Plain Garbage", type:"garbage" }
  ],

  // Home systems with optional swaps
  home_systems: [
    { name: "Creuss Gate", faction: "Ghosts", triggerComponent: "Slipstream", type: "optional_swap" },
    { name: "Creuss HS", faction: "Ghosts", triggerComponent: "Slipstream", type: "optional_swap" }
  ],

  // Promissory notes
  promissory: [
    { name: "Gift of Prescience", faction: "Naalu", triggerComponent: "Telepathic", type: "optional_swap" },
    { name: "Dark Pact", faction: "Empyrean", triggerComponent: "Dark Whispers", type: "gain_extra" },
    { name: "Promise of Protection", faction: "Mentak", triggerComponent: "Pillage", type: "optional_swap" },
    { name: "Antivirus", faction: "Nekro", triggerComponent: "Tech Singularity", type: "optional_swap" }
  ],

  // Faction techs
  faction_techs: [
    { name: "Valefar Assimilator Y", faction: "Nekro", triggerComponent: "Galactic Threat", type: "optional_swap" },
    { name: "Valefar Assimilator X", faction: "Nekro", triggerComponent: "Tech Singularity", type: "optional_swap" },
    { name: "Vortex", faction: "Cabal", triggerComponent: "Dimensional Tear II", type: "optional_swap" }
  ],

  // Leaders
  agents: [
    { name: "Artuno", faction: "Nomad", triggerComponent: "The Company", type: "gain_extra" },
    { name: "Thundarian", faction: "Nomad", triggerComponent: "The Company", type: "gain_extra" },
    { name: "Suffi An", faction: "Mentak", triggerComponent: "Pillage", type: "optional_swap" }
  ],

  commanders: [
    { name: "That Which Molds Flesh", faction: "Cabal", triggerComponent: "Dimensional Tear II", type: "optional_swap" },
    { name: "IL Na Viroset", faction: "Mahact", triggerComponent: "Edict", type: "optional_swap" }
  ],

  heroes: [
    { name: "Dimensional Anchor", faction: "Cabal", triggerComponent: "Dimensional Tear II", type: "optional_swap" }
  ],

  // Mechs
  mech: [
    { name: "ZS Thunderbolt M2", faction: "Sol", triggerComponent: "Orbital Drop", type: "optional_swap" },
    { name: "Blackshade Infiltrator", faction: "Yssaril", triggerComponent: "Stall Tactics", type: "optional_swap" },
    { name: "Ember Colossus", faction: "Muaat", triggerComponent: "Star Forge", type: "optional_swap" },
    { name: "Moyin's Ashes", faction: "Yin", triggerComponent: "Indoctrination", type: "optional_swap" },
    { name: "Mordred", faction: "Nekro", triggerComponent: "X or Y Assimilators", type: "optional_swap" },
    { name: "Starlancer", faction: "Mahact", triggerComponent: "Edict", type: "optional_swap" },
    { name: "Shield Paling", faction: "Jol-Nar", reason: "Just Plain Garbage", type: "garbage" }
  ],

  // Flagships
  flagship: [
    { name: "Hil Colish", faction: "Ghosts", triggerComponent: "any component w/ delta WH", type: "optional_swap" }
  ],

  // Base units (completely undraftable)
  base_units: [
    { name: "Floating Factory I", faction: "Saar", type: "base_unit" },
    { name: "Memorial I", faction: "Nomad", type: "base_unit" },
    { name: "Saturn Engine I", faction: "Titans", type: "base_unit" },
    { name: "Hel-Titan I", faction: "Titans", type: "base_unit" },
    { name: "Dimensional Tear I", faction: "Cabal", type: "base_unit" },
    { name: "Spec Ops I", faction: "Sol", type: "base_unit" },
    { name: "Prototype War Sun I", faction: "Muaat", type: "base_unit" },
    { name: "Super-Dreadnought I", faction: "L1Z1X", type: "base_unit" },
    { name: "Advanced Carrier I", faction: "Sol", type: "base_unit" },
    { name: "Strike Wing Alpha I", faction: "Argent", type: "base_unit" },
    { name: "Letani Warrior I", faction: "Arborec", type: "base_unit" },
    { name: "Crimson Legionnaire I", faction: "Mahact", type: "base_unit" },
    { name: "Hybrid Crystal Fighter I", faction: "Naalu", type: "base_unit" },
    { name: "Exotrireme I", faction: "Sardakk", type: "base_unit" }
  ],

  // Starting techs
  starting_techs: [
    { name: "Brutish Minds", faction: "Sardakk", reason: "Just Plain Garbage", type: "garbage" }
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