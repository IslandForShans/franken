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
- **Draz**: Draft 6 full factions and build your faction from them (not available yet)

## Key Features

- Filter by expansion! PoK, TE, DS, US
- DS Only mode!
- Faction theorycrafting mode!
- Export Built faction to either json (for whatever reason) or text file for easy reading!
- Draft history tracking!
- Component search!
- Tile resource/influence calculations!
- Export all factions into one text file for easy reading/printing!

## Adding/Fixing soon

### Known Bugs
- On mobile, sidebar doesn't scroll properly and boxes are out O.O.B.
- Refuse swap button is confusing, need to remove from swap modal main menu

#### FrankenDraz Bugs
- Tech icons not appearing in FrankenDraz build phase.

### High Priority
- Make component preview on hover show any added/swapped components

### Low Priority
- Create FrankenDraz mode option
- Creating custom Non-Draft Components
- Make draft actually start with local multiayer

## Eventual Non-Franken features to add

- Faction Reference
- Lore Reference
- Milty Draft
- Map Builder




