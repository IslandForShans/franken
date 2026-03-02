# TI4 Franken Draft

A React application for drafting custom Twilight Imperium 4 factions using the Franken Draft format. Supports both solo and multiplayer(eventually) drafting.

## Quick Setup

**Install dependencies**:
   ```bash
   npm install
   ```
### Solo Draft Mode
   ```bash
   npm run dev
   ```

- **Franken**: Each player gets a bag of components, picks items, then passes bags
- **Rotisserie**: All components in shared pools, players pick in turn order
- **Power**: Like Franken but with higher component limits
- **Draz**: Draft 6 full factions and build your faction from them

## Key Features

- Filter by expansion! PoK, TE, DS, US
- DS Only mode!
- Faction theorycrafting mode!
- Export Built faction to either json (for whatever reason) or text file for easy reading!
- Draft history tracking!
- Component search!
- Tile resource/influence calculations!
- Export all factions into one text file for easy reading/printing!
- Detailed draft summary!
- Export draft history!
- Variants: Normal, Power, Rotisserie, FrankenDraz!
- Component Reference!
- Map Build after Draft! Mantis style or random placement!
- Milty Draft!

## Adding/Fixing soon

### Known Bugs

### High Priority

### Low Priority
- Nucleus Draft
- Creating custom Non-Draft Components
- Make draft actually start with local multiayer

## Eventual Non-Franken features to add

- Lore Reference
- Game Reference
- L.R.R.

## Non-Faction Reference: adding new packs

The non-faction card reference is built from `src/data/nonFactionPacks.js` and normalized by `src/utils/nonFactionCards.js`.

### 1) Add/import your source data file

- Put the new dataset in `src/data/` (JSON is easiest).
- Import that file in `src/data/nonFactionPacks.js`.

### 2) Create a pack entry in `nonFactionPacks`

Add an object with:

- `meta.id`: unique slug-like id (used in generated card IDs, e.g. `my-pack`).
- `meta.name`: human-readable pack name.
- `meta.source`: short source label shown in the UI filters.
- `cards`: object keyed by type buckets (e.g. `explores`, `relics`, `action_cards`, `agendas`, `technologies`, `promissory`).

Example:

```js
const myPack = {
  meta: {
    id: "my-pack",
    name: "My Homebrew Pack",
    source: "HB",
  },
  cards: {
    explores: myData.explores,
    relics: myData.relics,
    action_cards: myData.action_cards,
    agendas: myData.agendas,
    technologies: myData.technologies,
    promissory: myData.promissory,
  },
};

export const nonFactionPacks = [basePack, discordantStarsPack, myPack];
```

### 3) Optional: override displayed type labels

If your type keys differ, add `typeLabels` to the pack:

```js
typeLabels: {
  custom_key: "Custom Label",
}
```

### 4) Keep the card shape compatible

For each card object, include at least:

- `name`
- `text` **or** `description`

Optional fields supported by the normalizer:

- `amount`, `subtype`, `source`, `deck`, `tags`, `version`, `id`, `replace`

### 5) Sub-categories in the UI

- The non-faction reference groups cards first by `type`, then by `subtype`.
- Nested structures in raw data are auto-flattened into subtypes (for example Explore decks like `cultural`, `hazardous`, `industrial`, `frontier`).

### 6) Replace existing cards from earlier packs (optional)

- Reuse the same `id` and set `replace: true` in a later pack.
- Later packs win when `replace` is enabled.




