import factionsJSONRaw from "./factions.json";
import discordantStarsJSONRaw from "./discordant-stars.json";
import lostLegaciesJSONRaw from "./lost-legacies.json";
import { processFactionData } from "../utils/dataProcessor";

export const factionsData = processFactionData(factionsJSONRaw);
export const discordantStarsData = processFactionData(discordantStarsJSONRaw);
export const lostLegaciesData = processFactionData(lostLegaciesJSONRaw);
