# TI4 Franken Draft

A React application for drafting custom Twilight Imperium 4 factions using the Franken Draft format. Supports both solo and multiplayer drafting.

## Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
### Solo Draft Mode
```bash
npm run dev
```
Opens the app at `http://localhost:5173`

### Multiplayer Mode
1. Start the server:
   ```bash
   npm run start-server
   ```
   Server runs on `http://localhost:4000`

2. Start the client:
   ```bash
   npm run dev
   ```

3. Enable multiplayer in the UI and connect to server

- **Franken**: Each player gets a bag of components, picks items, then passes bags
- **Rotisserie**: All components in shared pools, players pick in turn order
- **Power**: Like Franken but with higher component limits

## Key Features

- Real-time multiplayer via Socket.io
- Faction theorycrafting mode
- Draft history tracking
- Component search and filtering
- Tile resource/influence calculations (semi-working)

## Adding soon

- Ability to cancel the draft
- Creating custom Non-Draft Components
- Adding DS as an optional/standalone
- Adding US as an optional/standalone
- Fixing Res/Inf optimal calculations
- Better styling
- Icons
- Making faction sheets look closer to irl sheets
- Changing optional swaps and adds to happen after faction components are confirmed after draft is done
