// src/data/undraftable-components.js
// Components that cannot be drafted but are available as swaps/additions
/**
Templates:

{ name: "", faction: "", triggerComponent: "", type: "" }
{ name: "", faction: "", reason: "Just Plain Garbage", type: "garbage" }
{ name: "", faction: "", triggerComponent: "", type: "draftable_and_swap" }
**/

export const undraftableComponents = {
  // Abilities that are gained/optionally swapped when drafting other components
  abilities: [
    //Base + PoK
    { name: "Awaken", faction: "The Titans of Ul", triggerComponent: "Terragenesis", type: "gain_extra" },
    { name: "Coalescence", faction: "The Titans of Ul", triggerComponent: "Terragenesis", type: "gain_extra" },
    { name: "Devour", faction: "The Vuil'Raith Cabal", triggerComponent: "Amalgamation", type: "gain_when_draft" },
    { name: "Devour", faction: "The Vuil'Raith Cabal", triggerComponent: "Riftmeld", type: "gain_when_draft" },
    { name: "Fragile", faction: "The Universities of Jol-Nar", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Mitosis", faction: "The Arborec", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Hubris", faction: "The Mahact Gene-Sorcerers", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Propagation", faction: "The Nekro Virus", reason: "Just Plain Garbage", type:"garbage" },
    // Discordant Stars
    { name: "Arms Dealer", faction: "The Shipwrights of Axis", triggerComponent: "Military Industrial Complex", type: "gain_extra" },
    { name: "Cybernetic Madness", faction: "The Savages of Cymiae", triggerComponent: "Autonetic Memory", type: "gain_extra" },
    { name: "Flotilla", faction: "The Dih-Mohn Flotilla", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Free People", faction: "The Free Systems Compact", triggerComponent: "Diplomats", type: "gain_extra" },
    { name: "Limited Vision", faction: "The Augurs of Ilyxum", triggerComponent: "Oracle AI", type: "gain_extra" },
    { name: "Probability Algorithms", faction: "The Augurs of Ilyxum", triggerComponent: "Oracle AI", type: "gain_extra" },
    { name: "Shroud of Lith", faction: "The Kollec Society", triggerComponent: "Cloaked Fleets", type: "gain_extra" },
    { name: "Shroud of Lith", faction: "The Kollec Society", triggerComponent: "Nightingale V", type: "gain_extra" },
    { name: "Shroud of Lith", faction: "The Kollec Society", triggerComponent: "Nightshade Vanguard", type: "gain_extra" },
    { name: "Subterfuge", faction: "The Li-Zho Dynasty", triggerComponent: "Cunning", type: "gain_extra" },
    { name: "Lithoids", faction: "The L'tokk Khrask", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Privileged Citizenry", faction: "The Mirveda Protectorate", triggerComponent: "Gauss Cannon II", type: "gain_extra" },
    { name: "Divination", faction: "The Myko-Mentori", triggerComponent: "Prescient Memories", type: "gain_extra" },
    { name: "Singularity Point", faction: "The Nivyn Star Kings", triggerComponent: "Voidflare Warden II", type: "gain_extra" },
    { name: "Celestial Guides", faction: "The Nivyn Star Kings", triggerComponent: "Nivyn Home System", type: "draftable_and_swap" },
    { name: "Orbital Foundries", faction: "Roh-Dhna Mechatronics", triggerComponent: "Terrafactory II", type: "gain_extra" },
    { name: "Stealth Insertion", faction: "The Tnelis Syndicate", triggerComponent: "Daedalon", type: "gain_extra" },
    { name: "Fine Print", faction: "The Vaden Banking Clans", triggerComponent: "Collateralized Loans", type: "gain_extra" },
    { name: "Fine Print", faction: "The Vaden Banking Clans", triggerComponent: "Komdar Borodin", type: "gain_extra" },
    { name: "Fine Print", faction: "The Vaden Banking Clans", triggerComponent: "Acula Network", type: "gain_extra" },
    { name: "Binding Debts", faction: "The Vaden Banking Clans", triggerComponent: "Acula Network", type: "gain_extra" },
    { name: "Holding Company", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Targeted Aquisition", faction: "The Veldyr Sovereignty", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Biophobic", faction: "The Zelian Purifier", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Paranoia", faction: "The Zelian Purifier", triggerComponent: "Zelian Home System", type: "gain_extra" },
    { name: "Ancient Blueprints", faction: "The Bentor Conglomerate", triggerComponent: "C.O.O. Mgur", type: "gain_extra" },
    { name: "Byssus", faction: "The Cheiran Hordes", triggerComponent: "Operator Kkavras", type: "gain_extra" },
    { name: "Decree", faction: "The Edyn Mandate", triggerComponent: "Rune Bearer", type: "optional_swap" },
    { name: "Radiance", faction: "The Edyn Mandate", triggerComponent: "Rune Bearer", type: "optional_swap" },
    { name: "Mobile Command", faction: "The Ghoti Wayfarers", triggerComponent: "Ghoti Starting Fleet", type: "gain_extra" },
    { name: "Abyssal Embrace", faction: "The Ghoti Wayfarers", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Celestial Reclamation", faction: "The GLEdge Union", triggerComponent: "Mantle Cracking", type: "gain_extra" },
    { name: "Heroism", faction: "The Beserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    { name: "Valor", faction: "The Beserkers of Kjalengard", triggerComponent: "GLory", type: "gain_extra" },
    { name: "Plague Reservoir", faction: "The Kyro Sodality", triggerComponent: "Contagion", type: "gain_extra" },
    { name: "Subversive", faction: "The Kyro Sodality", triggerComponent: "Contagion", type: "gain_extra" },
    { name: "A New Edifice", faction: "The Lanefir Remnants", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Desperados", faction: "The Nokar Sellships", triggerComponent: "Hired Guns", type: "gain_extra" }
  ],

  // Home systems with optional swaps
  home_systems: [
    //Base + PoK
    { name: "Creuss Gate", faction: "The Ghosts of Creuss", triggerComponent: "Slipstream", type: "optional_swap" },
    { name: "Ghosts Home System", faction: "The Ghosts of Creuss", triggerComponent: "Slipstream", type: "optional_swap" },
    //Discordant Stars
    { name: "Free Systems Home System", faction: "The Free Systms Compact", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Ghoti Home System", faction: "The Ghoti Wayfarers", triggerComponent: "Mobile Command", type: "gain_extra" }
  ],

  // Promissory notes
  promissory: [
    //Base + PoK
    { name: "Gift of Prescience", faction: "The Naalu Collective", triggerComponent: "Telepathic", type: "optional_swap" },
    { name: "Dark Pact", faction: "The Empyrean", triggerComponent: "Dark Whispers", type: "gain_extra" },
    { name: "Promise of Protection", faction: "The Mentak Coalition", triggerComponent: "Pillage", type: "optional_swap" },
    { name: "Antivirus", faction: "The Nekro Virus", triggerComponent: "Tech Singularity", type: "optional_swap" },
    //DS
    { name: "Read the Fates", faction: "The Augurs of Ilyxum", triggerComponent: "Oracle AI", type: "optional_swap" },
    { name: "Branch Office - Tax haven", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Branch Office - Broadcast Hub", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Branch Office - Reserve Bank", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Branch Office - Orbital Shipyard", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" }
  ],

  // Faction techs
  faction_techs: [
    //Base + PoK
    { name: "Valefar Assimilator Y", faction: "The Nekro Virus", triggerComponent: "Galactic Threat", type: "optional_swap" },
    { name: "Valefar Assimilator X", faction: "The Nekro Virus", triggerComponent: "Tech Singularity", type: "optional_swap" },
    //DS
    { name: "Voidflare Warden II", faction: "The Nivyn Star Kings", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Zhrgar Stimulants", faction: "The Beserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    { name: "ATS Armaments", faction: "The Lanefir Remnants", reason: "Just Plain Garbage", type: "garbage" }
  ],

  // Leaders
  agents: [
    //Base + PoK
    { name: "Artuno the Betrayer", faction: "The Nomad", triggerComponent: "The Company", type: "gain_extra" },
    { name: "The Thundarian", faction: "The Nomad", triggerComponent: "The Company", type: "gain_extra" },
    { name: "Suffi An", faction: "The Mentak Coalition", triggerComponent: "Pillage", type: "optional_swap" },
    //DS
    { name: "Lactarius Indigo", faction: "The Myko-Mentori", triggerComponent: "Prescient Memories", type: "optional_swap" },
    { name: "Merkismathr Asvand", faction: "The Beserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" }
  ],
  
  commanders: [
    //Base + PoK
    { name: "IL Na Viroset", faction: "The Mahact Gene-Sorcerers", triggerComponent: "Imperia", type: "optional_swap" },
    //DS
    { name: "Designer TckVsk", faction: "The Shipwrights of Axis", triggerComponent: "Military Industrial Complex", type: "optional_swap" },
    { name: "Jarl Vel & Jarl Jotrun", faction: "The Ghemina Raiders", triggerComponent: "The Lady & The Lord", type: "optional_swap" },
    { name: "Dhume Tathu", faction: "The Li-Zho Dynasty", triggerComponent: "Cunning", type: "optional_swap" },
    { name: "Vera Khage", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "optional_swap" },
    { name: "C.M.O. Ranc", faction: "The Bentor Conglomerate", triggerComponent: "C.O.O. Mgur", type: "optional_swap" },
    { name: "Sdallari Tvungovot", faction: "The Beserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    { name: "Jack Hallard", faction: "The Nokar Sellships", triggerComponent: "Hired Guns", type: "optional_swap" }
  ],

  heroes: [
    //Base + PoK
    { name: "Dimensional Anchor", faction: "The Vuil'Raith Cabal", triggerComponent: "Dimensional Tear II", type: "optional_swap" },
    //DS
    { name: "Demi-Queen Mdcksssk", faction: "The Shipwrights of Axis", triggerComponent: "Military Industrial Complex", type: "optional_swap" },
    { name: "Raze Order", faction: "The Ghemina Raiders", triggerComponent: "The Lady & The Lord", type: "optional_swap" },
    { name: "Destiny Drive", faction: "The Ghemina Raiders", triggerComponent: "The Lady & The Lord", type: "optional_swap" },
    { name: "Synchronicity Algorithm", faction: "The Augurs of Ilyxum", triggerComponent: "Oracle AI", type: "optional_swap" },
    { name: "Khaz-Rin Li", faction: "The Li-Zho Dynasty", triggerComponent: "Cunning", type: "optional_swap" },
    { name: "Singularity Cradle", faction: "The Nivyn Star Kings", triggerComponent: "Voidflare Warden II", type: "optional_swap" },
    { name: "Shadow Council", faction: "The Olradin League", triggerComponent: "Policies", type: "optional_swap" },
    { name: "Auberon Elyrin", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "optional_swap" },
    { name: "A Tale of Legends", faction: "The Beserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" }
  ],

  // Mechs
  mech: [
    //Base + PoK
    { name: "ZS Thunderbolt M2", faction: "The Federation of Sol", triggerComponent: "Orbital Drop", type: "optional_swap" },
    { name: "Blackshade Infiltrator", faction: "The Yssaril Tribes", triggerComponent: "Stall Tactics", type: "optional_swap" },
    { name: "Ember Colossus", faction: "The Embers of Muaat", triggerComponent: "Star Forge", type: "optional_swap" },
    { name: "Moyin's Ashes", faction: "The Yin Brotherhood", triggerComponent: "Indoctrination", type: "optional_swap" },
    { name: "Mordred", faction: "The Nekro Virus", triggerComponent: "X or Y Assimilators", type: "optional_swap" },
    { name: "Starlancer", faction: "The Mahact Gene-Sorcerers", triggerComponent: "Edict", type: "optional_swap" },
    { name: "Shield Paling", faction: "The Universities of Jol-Nar", reason: "Just Plain Garbage", type: "garbage" },
    //DS
    { name: "Liberator", faction: "The Free Systems Compact", triggerComponent: "Rally to the Cause", type: "optional_swap" },
    { name: "Oro-Zhin Elite", faction: "The Li-Zho Dynasty", triggerComponent: "Cunning", type: "optional_swap" },
    { name: "Exemplar", faction: "The Olradin League", triggerComponent: "Policies", type: "optional_swap" },
    { name: "Autofabricator", faction: "Roh'Dhna Mechatronics", triggerComponent: "Recycled Materials", type: "optional_swap" },
    { name: "The Collector", faction: "The Vaden Banking Clans", triggerComponent: "Acula Network", type: "optional_swap" },
    { name: "Skald", faction: "The Beserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" }
  ],

  // Flagships
  flagship: [
    //Base + Pok
    { name: "Hil Colish", faction: "The Ghosts of Creuss", triggerComponent: "any component w/ delta WH", type: "optional_swap" },
    //DS
    { name: "Hulgade's Hammer", faction: "The Beserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    { name: "All Mother", faction: "The Ghoti Wayfarers", triggerComponent: "Ghoti Starting Fleet", type: "draftable_and_swap" }
  ],

  // Base units (completely undraftable)
  base_units: [
    //Base + PoK
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
    { name: "Exotrireme I", faction: "Sardakk N'orr", type: "base_unit" },
    //DS
    { name: "Trade Port I", faction: "The Celdauri Trade Confederation", type: "base_unit" },
    { name: "Unholy Abomination I", faction: "The Savages of Cymiae", type: "base_unit" },
    { name: "Aegis I", faction: "The Dih-Mohn Flotilla", type: "base_unit" },
    { name: "Corsair I", faction: "The Florzen Profiteers", type: "base_unit" },
    { name: "Combat Transport I", faction: "The Ghemina Raiders", type: "base_unit" },
    { name: "Heavy Bomber I", faction: "The Li-Zho Dynasty", type: "base_unit" },
    { name: "Shattered Sky I", faction: "The L'tokk Khrask", type: "base_unit" },
    { name: "Gauss Cannon I", faction: "The Mirveda Protectorate", type: "base_unit" },
    { name: "Mycelium Ring I", faction: "The Myko-Mentori", type: "base_unit" },
    { name: "Voidflare Warden I", faction: "The Nivyn Star Kings", type: "base_unit" },
    { name: "Terrafactory I", faction: "Roh'Dhna Mechatronics", type: "base_unit" },
    { name: "Blockade Runner I", faction: "The Tnelis Syndicate", type: "base_unit" },
    { name: "Raider I", faction: "The Vaylerian Scourge", type: "base_unit" },
    { name: "Lancer Dreadnought I", faction: "The Veldyr Sovereignty", type: "base_unit" },
    { name: "Impactor I", faction: "The Zelian Purifier", type: "base_unit" },
    { name: "Chitin Hulk I", faction: "The Cheiran Hordes", type: "base_unit" },
    { name: "Orion Platform I", faction: "The GLEdge Union", type: "base_unit" },
    { name: "Star Dragon I", faction: "The Berserkers of Kjalengard", type: "base_unit" },
    { name: "Sabre I", faction: "The Nokar Sellships", type: "base_unit" }
  ],

  // Starting techs
  starting_techs: [
    { name: "Sardakk Starting Tech", faction: "Sardakk N'orr", reason: "Just Plain Garbage", type: "garbage" }
  ],
  
  //Starting Fleets
  starting_fleets: [
    //DS
    { name: "L'tokk Starting Fleet", faction: "L'tokk Khrask", triggerComponent: "Shattered Sky II", type: "optional_swap" }
  ],
  
  //Commodities
  commodities: [
    { name: "Commodities", faction: "The Myko-Mentori", reason: "Just Plain Garbage", type: "garbage" },
  ]
};

export const isComponentUndraftable = (componentName, faction = null, phase = "draft") => {
  for (const category of Object.values(undraftableComponents)) {
    const found = category.find(comp => 
      comp.name === componentName && 
      (faction ? comp.faction === faction : true)
    );
    if (found) {
      // Allow draftable_and_swap types during draft phase
      if (found.type === "draftable_and_swap" && phase === "draft") {
        return null;
      }
      return found;
    }
  }
  return null;
};

export const getSwapOptions = (componentName, faction) => {
  const undraftable = isComponentUndraftable(componentName, faction, "reduction");
  if (undraftable && (undraftable.type === "optional_swap" || undraftable.type === "draftable_and_swap")) {
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