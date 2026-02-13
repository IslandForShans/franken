import factionsJSONRaw from "./factions.json";
import discordantStarsJSONRaw from "./discordant-stars.json";
import { processFactionData } from "../utils/dataProcessor";

export const factionsData = processFactionData(factionsJSONRaw);
export const discordantStarsData = processFactionData(discordantStarsJSONRaw);