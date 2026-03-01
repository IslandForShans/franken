import nonFrankenData from "./non-franken.json";
import dsNonFrankenData from "./ds-non-franken.json";
import { buildNonFactionCatalog } from "../utils/nonFactionCards";

const basePack = {
  meta: {
    id: "base",
    name: "Base + PoK",
    source: "Base",
  },
  cards: nonFrankenData,
};

const discordantStarsPack = {
  meta: {
    id: "discordant-stars",
    name: "Discordant Stars",
    source: "DS",
  },
  cards: {
    explores: dsNonFrankenData.explores,
    relics: dsNonFrankenData.relics,
    action_cards:
      dsNonFrankenData.action_cards || dsNonFrankenData["action cards"],
    agendas: dsNonFrankenData.agendas,
    technologies: dsNonFrankenData.technologies,
    promissory: dsNonFrankenData.promissory,
  },
};

export const nonFactionPacks = [basePack, discordantStarsPack];

export const nonFactionCards = buildNonFactionCatalog(nonFactionPacks);
