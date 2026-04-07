export const FLEXI_FRANKEN_TOTAL_POINTS = 6;

export const FLEXI_FRANKEN_BASE_LIMITS = {
  abilities: 4,
  faction_techs: 3,
  agents: 1,
  commanders: 1,
  heroes: 1,
  promissory: 1,
  starting_techs: 1,
  starting_fleet: 1,
  commodity_values: 1,
  flagship: 1,
  mech: 1,
  home_systems: 1,
  breakthrough: 1,
  blue_tiles: 3,
  red_tiles: 2,
};

// baseCost = cost of 1st extra in this category.
// Each subsequent extra costs baseCost + N where N = # already added.
// maxExtras = hard cap (undefined = unlimited, point-gated only).
export const FLEXI_POINT_COSTS = {
  abilities:         { baseCost: 1 },
  faction_techs:     { baseCost: 1 },
  agents:            { baseCost: 1 },
  commanders:        { baseCost: 1 },
  heroes:            { baseCost: 1 },
  promissory:        { baseCost: 1 },
  commodity_values:  { baseCost: 3, maxExtras: 1 },
  breakthrough:      { baseCost: 2, maxExtras: 1 },
};

/**
 * For each item in a category array, returns the flexi point cost if it is
 * beyond the base limit, or null if within the base limit or auto-gained.
 * Auto-gained items (isExtra: true) are always free.
 */
export function getCategoryItemCosts(items = [], cat) {
  const info = FLEXI_POINT_COSTS[cat];
  const baseLimit = FLEXI_FRANKEN_BASE_LIMITS[cat] ?? 0;
  let baseCount = 0;
  let extraCount = 0;
  return items.map(item => {
    // Auto-gained and swapped items are always free and don't occupy a slot
    if (item.isExtra || item.isSwap) return null;
    if (baseCount < baseLimit) { baseCount++; return null; }
    const cost = info ? (info.baseCost + extraCount) : null;
    extraCount++;
    return cost;
  });
}

/** Total flexi points spent across all categories in a built faction. */
export function calcFlexiPointsUsed(builtFaction) {
  let total = 0;
  Object.keys(FLEXI_POINT_COSTS).forEach(cat => {
    getCategoryItemCosts(builtFaction[cat] || [], cat)
      .forEach(cost => { if (cost != null) total += cost; });
  });
  return total;
}

/**
 * Cost to add one more extra to a category, or null if not possible
 * (category doesn't support extras, or max extras already reached).
 */
export function getNextExtraCost(builtFaction, cat) {
  const info = FLEXI_POINT_COSTS[cat];
  if (!info) return null;
  const items = builtFaction[cat] || [];
  const baseLimit = FLEXI_FRANKEN_BASE_LIMITS[cat] ?? 0;
  const nonAutoCount = items.filter(i => !i.isExtra).length;
  if (nonAutoCount < baseLimit) return null; // still within base — no cost
  const existingExtras = nonAutoCount - baseLimit;
  if (info.maxExtras != null && existingExtras >= info.maxExtras) return null;
  return info.baseCost + existingExtras;
}

export const FLEXI_TOOLTIP =
`FlexiDraz — Point Buy System

Base Limits:
  4 Abilities · 3 Faction Techs
  1 of everything else

You have ${FLEXI_FRANKEN_TOTAL_POINTS} points to spend on extras:

  Ability / Faction Tech / Agent / Commander /
  Hero / Promissory:
    1st extra costs 1pt, 2nd costs 2pt, 3rd costs 3pt…

  Extra Commodity Value: Max 1 extra, costs 3pt.

  Breakthrough: Max 1 extra, costs 2pt.

  +1 Flagship Plastic Limit: Max 1 extra, costs 1pt.

Auto-gained components (from drafting specific cards) are always FREE.`;

export const FLEXI_REDRAW_TOOLTIP =
`Redraw Phase (FlexiFranken only):

Before the Build Phase, 2 optional rounds:

  Round 1 — Free:
    Discard one drafted faction and pick a replacement
    from the undrafted faction pool.

  Round 2 — Costs 1 Flexi Point:
    Do it again at the cost of 1 point.

You may skip either or both rounds.`;