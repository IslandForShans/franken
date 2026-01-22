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

- Real-time multiplayer via Firebase (unavailable)
- Faction theorycrafting mode!
- Export Built faction to either json (for whatever reason) or text file for easy reading!
- Draft history tracking!
- Component search and filtering!
- Tile resource/influence calculations!
- Export all factions into one text file for easy reading/printing!

## Adding/Fixing soon

### High Priority
- Change fonts to make things easier to read
- Add tech icons
- Show prerequisites for faction techs
- Change Async export to automatically create a list of commands to run
- Change untis to be an array instead of just a description for starting fleets
- Add Thunders Edge stuff once Luminous works out how to implement into franken (~month after release)

### Low Priority
- Create FrankenDraz mode option
- Adding DS as an optional/standalone (in progress)
- Adding US as an optional/standalone (in progress)
- Make expansion content able to be separated.
- Creating custom Non-Draft Components
- Make draft actually start with local multiayer

## Eventual Non-Franken features to add

- Faction Reference
- Lore Reference
- Milty Draft
- Map Builder




