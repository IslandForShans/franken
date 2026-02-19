export const undraftableComponents = {
  // Abilities that are gained/optionally swapped when drafting other components
  abilities: [
    //Base + PoK + TE
    { name: "Awaken", faction: "The Titans of Ul", triggerComponent: "Terragenesis", type: "gain_extra" },
    { name: "Coalescence", faction: "The Titans of Ul", triggerComponent: "Terragenesis", type: "gain_extra" },
    { name: "Devour", faction: "The Vuil'Raith Cabal", triggerComponent: "Amalgamation", type: "gain_when_draft" },
    { name: "Devour (mini)", faction: "The Vuil'Raith Cabal", triggerComponent: "Riftmeld", type: "gain_when_draft" },
    { name: "Fragile", faction: "The Universities of Jol-Nar", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Mitosis", faction: "The Arborec", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Hubris", faction: "The Mahact Gene-Sorcerers", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Propagation", faction: "The Nekro Virus", reason: "Just Plain Garbage", type:"garbage" },
    { name: "Nocturne", faction: "The Obsidian", reason: "Just Plain Garbage", type: "garbage" },
    { name: "The Blade's Orchestra", faction: "The Obsidian", reason: "Not Draftable", type: "garbage" },
    { name: "Sundered", faction: "The Crimson Rebellion", triggerComponent: "Resonance Generator", type: "gain_extra" },
    { name: "Incursion", faction: "The Crimson Rebellion", triggerComponent: "Resonance Generator", type: "gain_extra" },
    { name: "The Sorrow", faction: "The Crimson Rebellion", reason: "Not Draftable", type: "garbage" },
    { name: "Research Team", faction: "The Deepwrought Scholarate", triggerComponent: "Oceanbound", type: "gain_extra" },
    { name: "Research Team", faction: "The Deepwrought Scholarate", triggerComponent: "Eanautic", type: "gain_exra" },
    { name: "Galvanize", faction: "Last Bastion", triggerComponent: "Raise the Standard", type: "gain_extra" },
    { name: "Galvanize", faction: "Last Bastion", triggerComponent: "Phoenix Standard", type: "gain_extra" },
    { name: "Puppets of the Blade", faction: "The Firmament", triggerComponent: "Plots Within Plots", type: "gain_extra" },
    { name: "Puppets of the Blade", faction: "The Firmament", triggerComponent: "The Sowing", type: "gain_extra" },
    { name: "Plots Within Plots", faction: "The Firmament", triggerComponent: "The Sowing", type: "gain_extra" },
    { name: "Puppets of the Blade", faction: "The Firmament", triggerComponent: "Firmament Home System", type: "gain_extra" },
    { name: "Plots Within Plots", faction: "The Firmament", triggerComponent: "Firmament Home System", type: "gain_extra" },
    { name: "Puppets of the Blade", faction: "The Firmament", triggerComponent: "Plane Splitter", type: "gain_extra" },
    { name: "Plots Within Plots", faction: "The Firmament", triggerComponent: "Plane Splitter", type: "gain_extra" },
    { name: "Puppets of the Blade", faction: "The Firmament", triggerComponent: "Neural Parasite", type: "gain_extra" },
    { name: "Plots Within Plots", faction: "The Firmament", triggerComponent: "Neural Parasite", type: "gain_extra" },
    { name: "Puppets of the Blade", faction: "The Firmament", triggerComponent: "Viper EX-23", type: "gain_extra" },
    { name: "Plots Within Plots", faction: "The Firmament", triggerComponent: "Viper EX-23", type: "gain_extra" },
    { name: "Marionettes", faction: "The Obsidian", reason: "Not Draftable", type: "garbage" },
    { name: "Miniaturization", faction: "The Ral Nel Consortium", triggerComponent: "Linkship II", tpye: "gain_extra" },
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
    { name: "Fine Print", faction: "The Vaden Banking Clans", triggerComponent: "Komdar Borodin - Banker", type: "gain_extra" },
    { name: "Fine Print", faction: "The Vaden Banking Clans", triggerComponent: "Putriv Sirvonsk - Clanmaster Prime", type: "gain_extra" },
    { name: "Binding Debts", faction: "The Vaden Banking Clans", triggerComponent: "Putriv Sirvonsk - Clanmaster Prime", type: "gain_extra" },
    { name: "Holding Company", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Targeted Acquisition", faction: "The Veldyr Sovereignty", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Biophobic", faction: "The Zelian Purifier", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Paranoia", faction: "The Zelian Purifier", triggerComponent: "Zelian Home System", type: "gain_extra" },
    { name: "Ancient Blueprints", faction: "The Bentor Conglomerate", triggerComponent: "C.O.O. Mgur - Deft Tradesperson", type: "gain_extra" },
    { name: "Ancient Blueprints", faction: "The Bentor Conglomerate", triggerComponent: "Wayfinder", type: "gain_extra" },
    { name: "Ancient Blueprints", faction: "The Bentor Conglomerate", triggerComponent: "Auctioneer", type: "gain_extra" },
    { name: "Byssus", faction: "The Cheiran Hordes", triggerComponent: "Operator Kkavras - Subspace Grapple", type: "gain_extra" },
    { name: "Decree", faction: "The Edyn Mandate", triggerComponent: "Rune Bearer", type: "optional_swap" },
    { name: "Radiance", faction: "The Edyn Mandate", triggerComponent: "Rune Bearer", type: "optional_swap" },
    { name: "Mobile Command", faction: "The Ghoti Wayfarers", triggerComponent: "Ghoti Starting Fleet", type: "gain_extra" },
    { name: "Abyssal Embrace", faction: "The Ghoti Wayfarers", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Celestial Reclamation", faction: "The GLEdge Union", triggerComponent: "Mantle Cracking", type: "gain_extra" },
    { name: "Heroism", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    { name: "Valor", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "gain_extra" },
    { name: "Plague Reservoir", faction: "The Kyro Sodality", triggerComponent: "Contagion", type: "gain_extra" },
    { name: "Subversive", faction: "The Kyro Sodality", triggerComponent: "Contagion", type: "gain_extra" },
    { name: "A New Edifice", faction: "The Lanefir Remnants", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Desperados", faction: "The Nokar Sellships", triggerComponent: "Hired Guns", type: "gain_extra" },
    //BR
    { name: "Living Metals", faction: "Atokera Legacy", triggerComponent: "Synthesis", type: "gain_extra" },
    { name: "Arrogance", faction: "Belkosea Allied States", triggerComponent: "Classified Developments", type: "gain_extra" },
    { name: "Ancient Empire", faction: "Pharad'n Order", triggerComponent: "Immortal II", type: "gain_extra" },
    { name: "Mark of Pharad'n", faction: "Pharad'n Order", triggerComponent: "Immortal II", type: "gain_extra" },
    { name: "Black Ops", faction: "Qhet Republic", triggerComponent: "Data Recovery", type: "gain_extra" },
    { name: "Pride", faction: "Toldar Concordat", triggerComponent: "Honor-Bound", type: "gain_extra" },
    { name: "The Code", faction: "Toldar Concordat", triggerComponent: "Honor-Bound", type: "gain_extra" },
    { name: "The Starlit Path", faction: "Uydai Conclave", triggerComponent: "Prescience", type: "gain_extra" },
    { name: "Narrow Way", faction: "Uydai Conclave", triggerComponent: "Prescience", type: "gain_extra" }
  ],

 // Home systems with optional swaps
  home_systems: [
    //Base + PoK + TE
    { name: "Creuss Gate", faction: "The Ghosts of Creuss", triggerComponent: "Slipstream", type: "optional_swap" },
    { name: "Ghosts Home System", faction: "The Ghosts of Creuss", triggerComponent: "Slipstream", type: "optional_swap" },
    { name: "Crimson Home System", faction: "The Crimson Rebellion", triggerComponent: "Resonance Generator", type: "optional_swap" },
    { name: "Crimson Home System", faction: "The Crimson Rebellion", triggerComponent: "The Sorrow", type: "gain_extra" },
    { name: "Obsidian Home System", faction: "The Obsidian", triggerComponent: "Firmament Home System", type: "gain_extra" },
    //Discordant Stars
    { name: "Free Systems Home System", faction: "The Free Systms Compact", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Ghoti Home System", faction: "The Ghoti Wayfarers", triggerComponent: "Mobile Command", type: "gain_extra" },
    //BR
    { name: "Pharad'n Home System", faction: "Pharad'n Order", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Uydai Home System", faction: "Uydai Conclave", triggerComponent: "Prescience", type: "optional_swap" }
  ],

 // Promissory notes
  promissory: [
    //Base + PoK + TE
    { name: "Gift of Prescience", faction: "The Naalu Collective", triggerComponent: "Telepathic", type: "optional_swap" },
    { name: "Dark Pact", faction: "The Empyrean", triggerComponent: "Dark Whispers", type: "gain_extra" },
    { name: "Promise of Protection", faction: "The Mentak Coalition", triggerComponent: "Pillage", type: "optional_swap" },
    { name: "Antivirus", faction: "The Nekro Virus", triggerComponent: "Tech Singularity", type: "optional_swap" },
    { name: "Black Ops", faction: "The Firmament", triggerComponent: "Firmament Home System", type: "gain_extra" },
    { name: "Malevolency", faction: "The Obsidian", triggerComponent: "Black Ops", type: "gain_extra" },
    //DS
    { name: "Read the Fates", faction: "The Augurs of Ilyxum", triggerComponent: "Oracle AI", type: "optional_swap" },
    { name: "Branch Office - Tax Haven", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Branch Office - Broadcast Hub", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Branch Office - Reserve Bank", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Branch Office - Orbital Shipyard", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "gain_extra" },
    { name: "Parallel Production", faction: "The Ghoti Wayfarers", triggerComponent: "Secrets of the Weave", type: "gain_extra" }
  ],

  // Faction techs
  faction_techs: [
    //Base + PoK + TE
    { name: "Valefar Assimilator Y", faction: "The Nekro Virus", triggerComponent: "Galactic Threat", type: "optional_swap" },
    { name: "Valefar Assimilator X", faction: "The Nekro Virus", triggerComponent: "Tech Singularity", type: "optional_swap" },
    { name: "Exile II", faction: "The Crimson Rebellion", triggerComponent: "Resonance Generator", type: "optional_swap" },
    { name: "Hydrothermal Mining", faction: "The Deepwrought Scholarate", triggerComponent: "Oceanbound", type: "optional_swap" },
    { name: "Plane Splitter (Flipped)", faction: "The Obsidian", triggerComponent: "Plane Splitter", type: "gain_extra" },
    { name: "Neural Parasite (Flipped)", faction: "The Obsidian", triggerComponent: "Neural Parasite", type: "gain_extra" },
    //DS
    { name: "Zhrgar Stimulants", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    { name: "ATS Armaments", faction: "The Lanefir Remnants", reason: "Just Plain Garbage", type: "garbage" },
    //BR
    { name: "Modular Designs", faction: "Atokera Legacy", triggerComponent: "Kohi", type: "optional_swap" }
  ],

  // Leaders
  agents: [
    //Base + PoK + TE
    { name: "Artuno the Betrayer", faction: "The Nomad", triggerComponent: "The Company", type: "gain_extra" },
    { name: "The Thundarian", faction: "The Nomad", triggerComponent: "The Company", type: "gain_extra" },
    { name: "Suffi An", faction: "The Mentak Coalition", triggerComponent: "Pillage", type: "optional_swap" },
    { name: "Doctor Carrina", faction: "The Deepwrought Scholarate", triggerComponent: "Oceanbound", type: "optional_swap" },
    { name: "Dame Briar", faction: "Last Bastion", triggerComponent: "Phoenix Standard", type: "optional_swap" },
    { name: "Myru Vos", faction: "The Firmament", triggerComponent: "Plots Within Plots", type: "optional_swap" },
    { name: "Vos Hollow", faction: "The Obsidian", triggerComponent: "Myru Vos", type: "gain_extra" },
    //DS
    { name: "Lactarius Indigo - Omen Caller", faction: "The Myko-Mentori", triggerComponent: "Prescient Memories", type: "optional_swap" },
    { name: "Merkismathr Asvand - Marshal of Trade", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    //BR
    { name: "Magruda - Orator", faction: "Atokera Legacy", triggerComponent: "Ordagka - Maker", type: "optional_swap" },
    { name: "Nokash - Architect", faction: "Pharad'n Order", triggerComponent: "Immortal II", type: "draftable_and_swap"}
  ],
  
  commanders: [
    //Base + PoK + TE
    { name: "Il Na Viroset", faction: "The Mahact Gene-Sorcerers", triggerComponent: "Imperia", type: "optional_swap" },
    { name: "That Which Molds Flesh", faction: "The Vuil'Raith Cabal", triggerComponent: "Dimensional Tear II", type: "optional_swap" },
    { name: "Ahk Siever", faction: "The Crimson Rebellion", triggerComponent: "Resonance Generator", type: "optional_swap" },
    { name: "Aello", faction: "The Deepwrought Scholarate", triggerComponent: "Oceanbound", type: "optional_swap" },
    { name: "Nip and Tuck", faction: "Last Bastion", triggerComponent: "Phoenix Standard", type: "optiona_swap" },
    { name: "Captain Aroz", faction: "The Firmament", triggerComponent: "Plots Within Plots", type: "optional_swap" },
    { name: "Aroz Hollow", faction: "The Obsidian", triggerComponent: "Captain Aroz", type: "gain_extra" },
    //DS
    { name: "Designer TckVsk - Dilligent Retro-Engineer", faction: "The Shipwrights of Axis", triggerComponent: "Military Industrial Complex", type: "optional_swap" },
    { name: "Jarl Vel & Jarl Jotrun - Raid Leaders", faction: "The Ghemina Raiders", triggerComponent: "The Lady & The Lord", type: "optional_swap" },
    { name: "Dhume Tathu - Ruthless Strategist", faction: "The Li-Zho Dynasty", triggerComponent: "Cunning", type: "optional_swap" },
    { name: "Vera Khage - Chief Legal Officer", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "optional_swap" },
    { name: "C.M.O. Ranc - Marketing Guru", faction: "The Bentor Conglomerate", triggerComponent: "C.O.O. Mgur - Deft Tradesperson", type: "optional_swap" },
    { name: "Sdallari Tvungovot - Marshal Engineer", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    { name: "Jack Hallard - The Commodore", faction: "The Nokar Sellships", triggerComponent: "Hired Guns", type: "optional_swap" },
    //BR
    { name: "Ciphus Gault - Mercenary Demon", faction: "Belkosea Allied States", triggerComponent: "Classified Developments", type: "optional_swap" },
    { name: "Avhkan - The Crow", faction: "Pharad'n Order", triggerComponent: "Immortal II", type: "optional_swap" },
    { name: "Baird Feraux - Reserved Strategist", faction: "Toldar Concordat", triggerComponent: "Honor-Bound", type: "optional_swap" }
  ],

  heroes: [
    //Base + PoK + TE
    { name: "It Feeds On Carrion", faction: "The Vuil'Raith Cabal", triggerComponent: "Dimensional Tear II", type: "optional_swap" },
    { name: "Lyra Keen", faction: "Last Bastion", triggerComponent: "Phoenix Standard", type: "optional_swap" },
    { name: "Sharsiss", faction: "The Firmament", triggerComponent: "Plots Within Plots", type: "optional_swap" },
    { name: "Sharsiss Hollow", faction: "The Obsidian", triggerComponent: "Sharsiss", type: "gain_extra" },
    //DS
    { name: "Demi-Queen Mdcksssk - Commissioner of Profits", faction: "The Shipwrights of Axis", triggerComponent: "Military Industrial Complex", type: "optional_swap" },
    { name: "Korela - The Lady", faction: "The Ghemina Raiders", triggerComponent: "The Lady & The Lord", type: "optional_swap" },
    { name: "Kantrus - The Lord", faction: "The Ghemina Raiders", triggerComponent: "The Lady & The Lord", type: "optional_swap" },
    { name: "Atropha - Weaver", faction: "The Augurs of Ilyxum", triggerComponent: "Oracle AI", type: "optional_swap" },
    { name: "Khaz-Rin Li-Zho - Empress", faction: "The Li-Zho Dynasty", triggerComponent: "Cunning", type: "optional_swap" },
    { name: "Krill Drakkon - Star-Crowned King", faction: "The Nivyn Star Kings", triggerComponent: "Voidflare Warden II", type: "optional_swap" },
    { name: "Pahn Silverfur - Council Speaker", faction: "The Olradin League", triggerComponent: "Policies", type: "optional_swap" },
    { name: "Auberon Elyrin - Chairman", faction: "The Veldyr Sovereignty", triggerComponent: "Corporate Entity", type: "optional_swap" },
    { name: "Ygegnad The Thunder - Honorary Skald", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    //BR
    { name: "Pharad'n the Immortal", faction: "Pharad'n Order", triggerComponent: "Immortal II", type: "optional_swap" }
  ],

  // Mechs
  mech: [
    //Base + PoK + TE
    { name: "ZS Thunderbolt M2", faction: "The Federation of Sol", triggerComponent: "Orbital Drop", type: "optional_swap" },
    { name: "Blackshade Infiltrator", faction: "The Yssaril Tribes", triggerComponent: "Stall Tactics", type: "optional_swap" },
    { name: "Ember Colossus", faction: "The Embers of Muaat", triggerComponent: "Star Forge", type: "optional_swap" },
    { name: "Moyin's Ashes", faction: "The Yin Brotherhood", triggerComponent: "Indoctrination", type: "optional_swap" },
    { name: "Mordred", faction: "The Nekro Virus", triggerComponent: "Valefar Assimilator X", type: "optional_swap" },
    { name: "Mordred", faction: "The Nekro Virus", triggerComponent: "Valefar Assimilator Y", type: "optional_swap" },
    { name: "Starlancer", faction: "The Mahact Gene-Sorcerers", triggerComponent: "Edict", type: "optional_swap" },
    { name: "Shield Paling", faction: "The Universities of Jol-Nar", reason: "Just Plain Garbage", type: "garbage" },
    { name: "Revenant", faction: "The Crimson Rebellion", triggerComponent: "Resonance Generator", type: "optional_swap" },
    { name: "A3 Valiance", faction: "Last Bastion", triggerComponent: "Phoenix Standard", type: "optional_swap" },
    { name: "Viper Hollow", faction: "The Obsidian", triggerComponent: "Viper EX-23", type: "gain_extra" },
    //DS
    { name: "Liberator", faction: "The Free Systems Compact", triggerComponent: "Rally to the Cause", type: "optional_swap" },
    { name: "Oro-Zhin Elite", faction: "The Li-Zho Dynasty", triggerComponent: "Cunning", type: "optional_swap" },
    { name: "Exemplar", faction: "The Olradin League", triggerComponent: "Policies", type: "optional_swap" },
    { name: "Autofabricator", faction: "The Roh'Dhna Mechatronics", triggerComponent: "Recycled Materials", type: "optional_swap" },
    { name: "Collector", faction: "The Vaden Banking Clans", triggerComponent: "Putriv Sirvonsk - Clanmaster Prime", type: "optional_swap" },
    { name: "Skald", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    //BR
    { name: "Paladin", faction: "Toldar Concordat", triggerComponent: "Honor-Bound", type: "optional_swap" }
  ],

  // Flagships
  flagship: [
    //Base + Pok + TE
    { name: "Hil Colish", faction: "The Ghosts of Creuss", triggerComponent: "any component w/ delta WH", type: "optional_swap" },
    { name: "Quietus", faction: "The Crimson Rebellion", triggerComponent: "Resonance Generator", type: "optional_swap" },
    { name: "D.W.S. Luminous", faction: "The Deepwrought Scholarate", triggerComponent: "Oceanbound", type: "optional_swap" },
    { name: "Heaven's Eye", faction: "The Firmament", triggerComponent: "Plots Within Plots", type: "optional_swap" },
    { name: "Heaven's Hollow", faction: "The Obsidian", triggerComponent: "Heaven's Eye", type: "gain_extra" },
    //DS
    { name: "Hulgade's Hammer", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap" },
    { name: "All Mother", faction: "The Ghoti Wayfarers", triggerComponent: "Ghoti Starting Fleet", type: "draftable_and_swap" },
    { name: "The Lady", faction: "The Ghemina Raiders", triggerComponent: "The Lady & The Lord", type: "gain_extra"}
  ],

  // Base units (completely undraftable)
  base_units: [
    //Base + PoK + TE
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
    { name: "4X41C 'HELIOS' V1", faction: "Last Bastion", type: "base_unit" },
    { name: "Linkship I", faction: "The Ral Nel Consortium", type: "base_unit" },
    { name: "Exile I", faction: "The Crimson Rebellion", type: "base_unit" },
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
    { name: "Terrafactory I", faction: "The Roh'Dhna Mechatronics", type: "base_unit" },
    { name: "Blockade Runner I", faction: "The Tnelis Syndicate", type: "base_unit" },
    { name: "Raider I", faction: "The Vaylerian Scourge", type: "base_unit" },
    { name: "Lancer Dreadnought I", faction: "The Veldyr Sovereignty", type: "base_unit" },
    { name: "Impactor I", faction: "The Zelian Purifier", type: "base_unit" },
    { name: "Chitin Hulk I", faction: "The Cheiran Hordes", type: "base_unit" },
    { name: "Orion Platform I", faction: "The GLEdge Union", type: "base_unit" },
    { name: "Star Dragon I", faction: "The Berserkers of Kjalengard", type: "base_unit" },
    { name: "Sabre I", faction: "The Nokar Sellships", type: "base_unit" },
    //BR
    { name: "Mirrorshard I", faction: "Atokera Legacy", type: "base_unit" },
    { name: "Wyvern I", faction: "Belkosea Allied States", type: "base_unit" },
    { name: "Immortal I", faction: "Pharad'n Order", type: "base_unit" },
    { name: "Commando I", faction: "Qhet Republic", type: "base_unit" },
    { name: "Battlecruiser I", faction: "Qhet Republic", type: "base_unit" }
  ],

  // Starting techs
  starting_techs: [
    { name: "Sardakk Starting Tech", faction: "Sardakk N'orr", reason: "Just Plain Garbage", type: "garbage" }
  ],
  
  //Starting Fleets
  starting_fleets: [
    //DS
    { name: "L'tokk Khrask Starting Fleet", faction: "The L'tokk Khrask", triggerComponent: "Shattered Sky II", type: "optional_swap" }
  ],
  
  //Commodities
  commodities: [
    // Base + PoK + TE
    { name: "Commodities", faction: "Last Bastion", reason: "Just Plain Garbage", type: "grabage" },
    //DS
    { name: "Commodities", faction: "The Myko-Mentori", reason: "Just Plain Garbage", type: "garbage" },
  ],

  breakthrough: [
    // Base + PoK + TE
    { name: "The Reaping", faction: "The Obsidian", triggerComponent: "The Sowing", type: "gain_extra" },
    //DS
    { name: "Professional Intrigue", faction: "The Li-Zho Dynasty", triggerComponent: "Cunning", type: "optional_swap"},
    { name: "Mended Grove", faction: "The L'tokk Khrask", triggerComponent: "Meteor Slings", type: "optional_swap"},
    { name: "Stabilization Arrays", faction: "The Mirveda Protectorate", triggerComponent: "Gauss Cannon II", type: "gain_extra"},
    { name: "Dreamwalkers", faction: "The Myko-Mentori", triggerComponent: "Mycelium-Ring II", type: "gain_extra"},
    { name: "Anomaly Stabilization", faction: "The Nivyn Star Kings", triggerComponent: "Voidflare Warden I", type: "gain_extra"},
    { name: "Insurrectionist Networking", faction: "The Olradin League", triggerComponent: "Policies", type: "optional_swap"},
    { name: "The Prodigy's Triumph", faction: "The Roh-Dhna Mechatronics", triggerComponent: "Terrafactory II", type: "optional_swap"},
    { name: "Strongarm Banking", faction: "The Vaden Banking Clans", triggerComponent: "Putriv Sirvonsk - Clanmaster Prime", type: "optional_swap"},
    { name: "Dhonraz Installations", faction: "The GLEdge Union", triggerComponent: "Mantle Cracking", type: "optional_swap"},
    { name: "Bannerhalls", faction: "The Berserkers of Kjalengard", triggerComponent: "Glory", type: "optional_swap"},
    { name: "Mercenary Captains", faction: "The Nokar Sellships", triggerComponent: "Hired Guns", type: "gain_extra"},
    //BR
    { name: "Trinity Stockpile", faction: "Belkosea Allied States", triggerComponent: "Classified Developments", type: "optional_swap" },
    { name: "Hidden Vaults", faction: "Pharad'n Order", triggerComponent: "Immortal II", type: "optional_swap" },
    { name: "Dyrun's War-Bell", faction: "Toldar Concordat", triggerComponent: "Honor-Bound", type: "draftable_and_swap" }
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

// Get swap options based on what component triggers the swap
export const getSwapOptionsForTrigger = (triggerComponentName, faction) => {
  const swapOptions = [];
  
  for (const [category, components] of Object.entries(undraftableComponents)) {
    components.forEach(comp => {
      if (comp.triggerComponent === triggerComponentName && 
          comp.faction === faction && 
          comp.type === "optional_swap") {
        swapOptions.push({
          ...comp,
          category: category
        });
      }
    });
  }
  
  return swapOptions;
};

export const getExtraComponents = (componentName, faction) => {
  const results = [];
  for (const [category, components] of Object.entries(undraftableComponents)) {
    const extras = components.filter(comp => 
      comp.triggerComponent === componentName && 
      comp.faction === faction && 
      (comp.type === "gain_extra" || comp.type === "gain_when_draft")
    );
    results.push(...extras.map(extra => ({ ...extra, category })));
  }
  return results;
};