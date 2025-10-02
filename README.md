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

- **Franken**: Each player gets a bag of components, picks items, then passes bags
- **Rotisserie**: All components in shared pools, players pick in turn order
- **Power**: Like Franken but with higher component limits

## Key Features

- Real-time multiplayer via Socket.io
- Faction theorycrafting mode
- Draft history tracking
- Component search and filtering
- Tile resource/influence calculations (semi-working)

## Adding/Fixing soon

- Creating custom Non-Draft Components
- Adding DS as an optional/standalone
- Adding US as an optional/standalone
- Fixing Res/Inf optimal calculations
- Better styling
- Icons
- Making faction sheets look closer to irl sheets
- P2P "Multiplayer"
- Ability to remove components is broken in main draft screen, fixed in faction builder
- Have Res/Inf show in sidebar
- Fix local multiplayer, currently unusable

## Eventual Non-Franken features to add

- Faction Reference
- Lore Reference
- Milty Draft
- Map Builder


