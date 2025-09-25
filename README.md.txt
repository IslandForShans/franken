# TI4 Franken Draft

A React application for drafting custom Twilight Imperium 4 factions using the Franken Draft format. Supports both solo and multiplayer drafting.

## Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create the data directory structure**:
   ```bash
   mkdir -p src/data
   mkdir -p src/utils
   mkdir -p src/components
   mkdir -p server
   ```

3. **Copy files to correct locations**:
   - Move `index,js.txt` content to `server/index.js` (use the fixed version provided)
   - Move `factions.json` to `src/data/factions.json` (use the complete version provided)
   - All component files go in `src/components/`
   - `shuffle.js` goes in `src/utils/`

4. **Initialize Tailwind CSS**:
   ```bash
   npx tailwindcss init -p
   ```

## Development

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

## Project Structure

```
├── src/
│   ├── components/           # React components
│   │   ├── DraftSimulator.jsx    # Main draft logic
│   │   ├── ComponentViewer.jsx   # Component browsing/selection
│   │   ├── FactionSheet.jsx      # Drafted faction display
│   │   ├── MultiplayerPanel.jsx  # Multiplayer controls
│   │   └── ...
│   ├── data/
│   │   └── factions.json     # Faction and tile data
│   ├── utils/
│   │   └── shuffle.js        # Array shuffling utility
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/
│   └── index.js              # Socket.io multiplayer server
├── public/
├── package.json
└── vite.config.js
```

## Draft Variants

- **Franken**: Each player gets a bag of components, picks items, then passes bags
- **Rotisserie**: All components in shared pools, players pick in turn order
- **Power**: Like Franken but with higher component limits

## Key Features

- Drag & drop component selection
- Real-time multiplayer via Socket.io
- Faction theorycrafting mode
- Draft history tracking
- Component search and filtering
- Tile resource/influence calculations

## Fixed Issues

- ✅ Added missing dependencies (lodash, express, tailwindcss)
- ✅ Fixed server file extension and imports
- ✅ Created proper Tailwind configuration
- ✅ Fixed data structure inconsistencies
- ✅ Corrected bag rotation logic
- ✅ Improved multiplayer state management
- ✅ Added proper error handling

## Troubleshooting

### "Cannot resolve module" errors
Ensure all files are in the correct directories as shown in the project structure.

### Tailwind styles not working  
Make sure you ran `npx tailwindcss init -p` and that `src/index.css` contains the Tailwind directives.

### Multiplayer connection issues
- Check that the server is running on the correct port
- Verify firewall settings if connecting from other devices
- Use the host machine's IP address for other devices

### Components not displaying
Check that `src/data/factions.json` has the complete data structure with proper property names (e.g., `resource` not `resources`).

## Contributing

The application uses a modular component structure. Key areas for expansion:

- Additional faction data in `factions.json`
- More draft variants in `DraftSimulator.jsx`
- Enhanced UI components
- Additional tile types and properties