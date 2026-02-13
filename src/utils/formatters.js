export const CATEGORY_LABELS = {
    abilities: "Abilities",
    faction_techs: "Faction Techs",
    agents: "Agents",
    commanders: "Commanders",
    heroes: "Heroes",
    promissory: "Promissory",
    starting_tech: "Starting Techs",
    starting_fleet: "Starting Fleet",
    commodity_value: "Commodities",
    flagship: "Flagship",
    mech: "Mech",
    home_systems: "Home System",
    breakthrough: "Breakthrough"
};

export function formatCategoryName(category) {
    return CATEGORY_LABELS[category] ||
        category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}