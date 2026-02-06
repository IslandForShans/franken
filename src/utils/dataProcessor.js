// This file processes raw JSON data and adds icon paths automatically

export const ICON_PATH = "./icons/"; // Global constant for icon path

// Icon mappings
export const ICON_MAP = {
  // Tech colors
  techColors: {
    Blue: `${ICON_PATH}tech-blue.png`,
    Red: `${ICON_PATH}tech-red.png`,
    Green: `${ICON_PATH}tech-green.png`,
    Yellow: `${ICON_PATH}tech-yellow.png`,
  },
  
  // Resources and Influence
  resource: `${ICON_PATH}resource.png`,
  influence: `${ICON_PATH}influence.png`,
  
  // Wormholes
  wormholes: {
    Alpha: `${ICON_PATH}wormhole-alpha.png`,
    Beta: `${ICON_PATH}wormhole-beta.png`,
    Gamma: `${ICON_PATH}wormhole-gamma.png`,
  },
  
  // Anomalies
  anomalies: {
    "Asteroid Field": `${ICON_PATH}anomaly-asteroid.png`,
    "Nebula": `${ICON_PATH}anomaly-nebula.png`,
    "Supernova": `${ICON_PATH}anomaly-supernova.png`,
    "Gravity Rift": `${ICON_PATH}anomaly-gravity-rift.png`,
    "Entropic Scar": `${ICON_PATH}anomaly-entropic-scar.png`,
  },
  
  // Legendary
  legendary: `${ICON_PATH}legendary.png`,

  // Planet Traits
  traits: {
    "Cultural": `${ICON_PATH}trait-cultural.png`,
    "Hazardous": `${ICON_PATH}trait-hazardous.png`,
    "Industrial": `${ICON_PATH}trait-industrial.png`,
    "Space Station": `${ICON_PATH}space-station.png`,
  },
  
  // Faction icons (add your faction names)
  factions: {
    "The Arborec": `${ICON_PATH}factions/Arborec.png`,
    "The Argent Flight": `${ICON_PATH}factions/Argent.png`,
    "The Barony of Letnev": `${ICON_PATH}factions/Letnev.png`,
    "The Clan of Saar": `${ICON_PATH}factions/Saar.png`,
    "The Council Keleres": `${ICON_PATH}factions/Keleres.png`,
    "The Embers of Muaat": `${ICON_PATH}factions/Muaat.png`,
    "The Emirates of Hacan": `${ICON_PATH}factions/Hacan.png`,
    "The Empyrean": `${ICON_PATH}factions/Empyrean.png`,
    "The Federation of Sol": `${ICON_PATH}factions/Sol.png`,
    "The Ghosts of Creuss": `${ICON_PATH}factions/Creuss.png`,
    "The L1Z1X Mindnet": `${ICON_PATH}factions/L1Z1X.png`,
    "The Mahact Gene-Sorcerers": `${ICON_PATH}factions/Mahact.png`,
    "The Mentak Coalition": `${ICON_PATH}factions/Mentak.png`,
    "The Naalu Collective": `${ICON_PATH}factions/Naalu.png`,
    "The Naaz-Rokha Alliance": `${ICON_PATH}factions/Naaz-Rokha.png`,
    "The Nekro Virus": `${ICON_PATH}factions/Nekro.png`,
    "The Nomad": `${ICON_PATH}factions/Nomad.png`,
    "Sardakk N'orr": `${ICON_PATH}factions/Sardakk.png`,
    "The Titans of Ul": `${ICON_PATH}factions/Titans.png`,
    "The Universities of Jol-Nar": `${ICON_PATH}factions/Jol Nar.png`,
    "The Vuil'Raith Cabal": `${ICON_PATH}factions/Vuil'Raith.png`,
    "The Winnu": `${ICON_PATH}factions/Winnu.png`,
    "The Xxcha Kingdom": `${ICON_PATH}factions/Xxcha.png`,
    "The Yin Brotherhood": `${ICON_PATH}factions/Yin.png`,
    "The Yssaril Tribes": `${ICON_PATH}factions/Yssaril.png`,
    "The Deepwrought Scholarate": `${ICON_PATH}factions/Deepwrought.png`,
    "The Ral Nel Consortium": `${ICON_PATH}factions/Ral Nel.png`,
    "Last Bastion": `${ICON_PATH}factions/Bastion.png`,
    "The Firmament": `${ICON_PATH}factions/Firmament.png`,
    "The Crimson Rebellion": `${ICON_PATH}factions/Crimson.png`,
    "The Obsidian": `${ICON_PATH}factions/Obsidian.png`,
    //DS
    "The Augurs of Ilyxum": `${ICON_PATH}ds/Augurs.png`,
    "The Bentor Conglomerate": `${ICON_PATH}ds/Bentor.png`,
    "The Berserkers of Kjalengard": `${ICON_PATH}ds/Berserkers.png`,
    "The Celdauri Trade Confederation": `${ICON_PATH}ds/Celdauri.png`,
    "The Cheiran Hordes": `${ICON_PATH}ds/Cheiran.png`,
    "The Dih-Mohn Flotilla": `${ICON_PATH}ds/Dih-Mohn.png`,
    "The Edyn Mandate": `${ICON_PATH}ds/Edyn.png`,
    "The Florzen Profiteers": `${ICON_PATH}ds/Florzen.png`,
    "The Free Systems Compact": `${ICON_PATH}ds/Free-Systems.png`,
    "The Ghemina Raiders": `${ICON_PATH}ds/Ghemina.png`,
    "The Ghoti Wayfarers": `${ICON_PATH}ds/Ghoti.png`,
    "The GLEdge Union": `${ICON_PATH}ds/GLEdge.png`,
    "The Glimmer of Mortheus": `${ICON_PATH}ds/Glimmer.png`,
    "The Kyro Sodality": `${ICON_PATH}ds/Kyro.png`,
    "The Kortali Tribunal": `${ICON_PATH}ds/Kortali.png`,
    "The Kollec Society": `${ICON_PATH}ds/Kollec.png`,
    "The Lanefir Remnants": `${ICON_PATH}ds/Lanefir.png`,
    "The Li-Zho Dynasty": `${ICON_PATH}ds/Li-Zho.png`,
    "The L'tokk Khrask": `${ICON_PATH}ds/Khrask.png`,
    "The Mirveda Protectorate": `${ICON_PATH}ds/Mirveda.png`,
    "The Monks of Kolume": `${ICON_PATH}ds/Kolume.png`,
    "The Myko-Mentori": `${ICON_PATH}ds/Myko-Mentori.png`,
    "The Nivyn Star Kings": `${ICON_PATH}ds/Nivyn.png`,
    "The Nokar Sellships": `${ICON_PATH}ds/Nokar.png`,
    "The Olradin League": `${ICON_PATH}ds/Olradin.png`,
    "The Roh'Dhna Mechatronics": `${ICON_PATH}ds/Roh-Dhna.png`,
    "The Savages of Cymiae": `${ICON_PATH}ds/Cymiae.png`,
    "The Shipwrights of Axis": `${ICON_PATH}ds/Axis.png`,
    "The Tnelis Syndicate": `${ICON_PATH}ds/Tnelis.png`,
    "The Vaden Banking Clans": `${ICON_PATH}ds/Vaden.png`,
    "The Veldyr Sovereignty": `${ICON_PATH}ds/Veldyr.png`,
    "The Vaylerian Scourge": `${ICON_PATH}ds/Vaylerian.png`,
    "The Zealots of Rhodun": `${ICON_PATH}ds/Zealots.png`,
    "The Zelian Purifier": `${ICON_PATH}ds/Zelian.png`,
    //BR
    "Atokera Legacy": `${ICON_PATH}br/Atokera.png`,
    "Belkosea Allied States": `${ICON_PATH}br/Belkosea.png`,
    "Pharad'n Order": `${ICON_PATH}br/Pharadn.png`,
    "Qhet Republic": `${ICON_PATH}br/Qhet.png`,
    "Toldar Concordat": `${ICON_PATH}br/Toldar.png`,
    "Uydai Conclave": `${ICON_PATH}br/Uydai.png`
  }
};

/**
 * Process faction data to add icon paths
 */
export function processFactionData(rawFactionData) {
  if (!rawFactionData || !rawFactionData.factions) {
    return rawFactionData;
  }

  const processed = { ...rawFactionData };
  
  processed.factions = rawFactionData.factions.map(faction => {
    const processedFaction = { ...faction };
    
    // Add faction icon if available
    if (ICON_MAP.factions[faction.name]) {
      processedFaction.icon = ICON_MAP.factions[faction.name];
    }
    
    // Process faction techs
    if (processedFaction.faction_techs) {
      processedFaction.faction_techs = processedFaction.faction_techs.map(tech => {
        const processedTech = { ...tech };
        
        // Add tech color icon
        if (tech.tech_type && ICON_MAP.techColors[tech.tech_type]) {
          processedTech.tech_type_icon = ICON_MAP.techColors[tech.tech_type];
        }
        
        // Add prerequisite icons
        if (tech.prerequisites && tech.prerequisites.length > 0) {
          processedTech.prerequisite_icons = tech.prerequisites.map(
            prereq => ICON_MAP.techColors[prereq]
          ).filter(Boolean);
        }
        
        // Process tech package if exists
        if (processedTech.techs) {
          processedTech.techs = processedTech.techs.map(subTech => {
            const processedSubTech = { ...subTech };
            if (subTech.tech_type && ICON_MAP.techColors[subTech.tech_type]) {
              processedSubTech.tech_type_icon = ICON_MAP.techColors[subTech.tech_type];
            }
            return processedSubTech;
          });
        }
        
        return processedTech;
      });
    }
    
    // Process starting techs
    if (processedFaction.starting_techs) {
      processedFaction.starting_techs = processedFaction.starting_techs.map(tech => {
        const processedTech = { ...tech };
        
        if (tech.tech_type && ICON_MAP.techColors[tech.tech_type]) {
          processedTech.tech_type_icon = ICON_MAP.techColors[tech.tech_type];
        }
        
        if (processedTech.techs) {
          processedTech.techs = processedTech.techs.map(subTech => {
            const processedSubTech = { ...subTech };
            if (subTech.tech_type && ICON_MAP.techColors[subTech.tech_type]) {
              processedSubTech.tech_type_icon = ICON_MAP.techColors[subTech.tech_type];
            }
            return processedSubTech;
          });
        }
        
        return processedTech;
      });
    }
    
    return processedFaction;
  });
  
  // Process tiles if they exist
  if (processed.tiles) {
    ['blue_tiles', 'red_tiles'].forEach(tileCategory => {
      if (processed.tiles[tileCategory]) {
        processed.tiles[tileCategory] = processed.tiles[tileCategory].map(tile => {
          const processedTile = { ...tile };
          
          // Add wormhole icon
          if (tile.wormhole && ICON_MAP.wormholes[tile.wormhole]) {
            processedTile.wormhole_icon = ICON_MAP.wormholes[tile.wormhole];
          }
          
          // Add anomaly icons
          if (tile.anomalies && tile.anomalies.length > 0) {
            processedTile.anomaly_icons = tile.anomalies.map(
              anomaly => ICON_MAP.anomalies[anomaly]
            ).filter(Boolean);
          }
          
          // Process planets
          if (tile.planets && tile.planets.length > 0) {
            processedTile.planets = tile.planets.map(planet => {
              const processedPlanet = { ...planet };
              
              // Add resource/influence icons
              processedPlanet.resource_icon = ICON_MAP.resource;
              processedPlanet.influence_icon = ICON_MAP.influence;
              
              // Add legendary icon
              if (planet.legendary_ability) {
                processedPlanet.legendary_icon = ICON_MAP.legendary;
              }
              
              // Add tech specialty icons
              if (planet.technology_specialty && planet.technology_specialty.length > 0) {
                processedPlanet.tech_specialty_icons = planet.technology_specialty.map(
                  tech => ICON_MAP.techColors[tech]
                ).filter(Boolean);
              }

              // Add trait icons
              if (planet.traits && planet.traits.length > 0) {
                processedPlanet.trait_icons = planet.traits.map(
                  trait => ICON_MAP.traits[trait]
                ).filter(Boolean);
              }
              
              return processedPlanet;
            });
          }
          
          return processedTile;
        });
      }
    });
  }
  
  return processed;
}

/**
 * Load and process faction data
 */
export async function loadProcessedFactionData() {
  // Import your raw JSON
  const rawData = await import('../data/factions.json');
  
  // Process it to add icon paths
  return processFactionData(rawData.default || rawData);
}

/**
 * Get icon path for a specific type and value
 */
export function getIconPath(type, value) {
  switch (type) {
    case 'tech':
      return ICON_MAP.techColors[value];
    case 'wormhole':
      return ICON_MAP.wormholes[value];
    case 'anomaly':
      return ICON_MAP.anomalies[value];
    case 'resource':
      return ICON_MAP.resource;
    case 'influence':
      return ICON_MAP.influence;
    case 'legendary':
      return ICON_MAP.legendary;
    case 'faction':
      return ICON_MAP.factions[value];
    default:
      return null;
  }
}