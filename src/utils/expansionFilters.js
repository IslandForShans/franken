export const pokExclusions = {
  factions: ["The Nomad", "The Vuil'Raith Cabal", "The Argent Flight", "The Titans of Ul", "The Mahact Gene-Sorcerers", "The Empyrean", "The Naaz-Rokha Alliance"],
  tiles: ["59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80"]
};

export const teExclusions = {
  factions: ["The Council Keleres", "The Deepwrought Scholarate", "The Ral Nel Consortium", "Last Bastion", "The Crimson Rebellion"],
  tiles: ["97", "98", "99", "100", "101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "113", "114", "115", "116", "117"]
};

export const noFirmament = {
  factions: ["The Firmament", "The Obsidian"]
};

export const brExclusions = {
  factions: ["Atokera Legacy", "Belkosea Allied States", "Pharad'n Order", "Qhet Republic", "Toldar Concordat", "Uydai Conclave"]
};

export const isBlueReverieFaction = (name) => brExclusions.factions.includes(name);

export function filterFactionsByExpansions(factions, expansionsEnabled = {}) {
    let out = [...factions];
    if (!expansionsEnabled.pok) out = out.filter(f => !pokExclusions.factions.includes(f.name));
    if (!expansionsEnabled.te) out = out.filter(f => !teExclusions.factions.includes(f.name));
    if (!expansionsEnabled.firmobs) out = out.filter(f => !noFirmament.factions.includes(f.name));
    return out;
}

export function filterTilesByExpansions(tiles, expansionsEnabled = {}) {
    let out = [...tiles];
    if (!expansionsEnabled.pok) out = out.filter(t => !pokExclusions.tiles.includes(t.id));
    if (!expansionsEnabled.te) out = out.filter(t => !teExclusions.tiles.includes(t.id));
    return out;
}