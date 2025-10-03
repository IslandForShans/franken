// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, get, onValue, remove, update } from "firebase/database";
import { firebaseConfig } from '../config/firebase.js';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

export class MultiplayerService {
  constructor() {
    this.currentLobbyId = null;
    this.playerId = null;
    this.listeners = [];
  }

  // Generate unique player ID
  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a new lobby
  async createLobby(lobbyName, password, playerName, draftSettings) {
    try {
      // Check if lobby name already exists
      const lobbyRef = ref(database, `lobbies/${lobbyName}`);
      const snapshot = await get(lobbyRef);
      
      if (snapshot.exists()) {
        throw new Error("Lobby name already taken");
      }

      this.playerId = this.generatePlayerId();
      this.currentLobbyId = lobbyName;

      const lobbyData = {
        name: lobbyName,
        password: password, // In production, hash this!
        host: this.playerId,
        created: Date.now(),
        status: 'waiting', // waiting, drafting, complete
        settings: draftSettings,
        players: {
          [this.playerId]: {
            name: playerName,
            joinedAt: Date.now(),
            isHost: true,
            ready: false
          }
        },
        draftState: {
          currentPlayer: 0,
          round: 1,
          phase: 'setup'
        }
      };

      await set(lobbyRef, lobbyData);
      return { success: true, lobbyId: lobbyName, playerId: this.playerId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Join existing lobby
  async joinLobby(lobbyName, password, playerName) {
    try {
      const lobbyRef = ref(database, `lobbies/${lobbyName}`);
      const snapshot = await get(lobbyRef);

      if (!snapshot.exists()) {
        throw new Error("Lobby not found");
      }

      const lobbyData = snapshot.val();

      if (lobbyData.password !== password) {
        throw new Error("Incorrect password");
      }

      if (lobbyData.status !== 'waiting') {
        throw new Error("Draft already in progress");
      }

      this.playerId = this.generatePlayerId();
      this.currentLobbyId = lobbyName;

      const playerRef = ref(database, `lobbies/${lobbyName}/players/${this.playerId}`);
      await set(playerRef, {
        name: playerName,
        joinedAt: Date.now(),
        isHost: false,
        ready: false
      });

      return { success: true, lobbyId: lobbyName, playerId: this.playerId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Listen to lobby updates
  onLobbyUpdate(callback) {
    if (!this.currentLobbyId) return;

    const lobbyRef = ref(database, `lobbies/${this.currentLobbyId}`);
    const unsubscribe = onValue(lobbyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Mark player as ready
  async setPlayerReady(ready = true) {
    if (!this.currentLobbyId || !this.playerId) return;

    const playerRef = ref(database, `lobbies/${this.currentLobbyId}/players/${this.playerId}/ready`);
    await set(playerRef, ready);
  }

  // Start draft (host only)
  async startDraft() {
    if (!this.currentLobbyId) return;

    const statusRef = ref(database, `lobbies/${this.currentLobbyId}/status`);
    await set(statusRef, 'drafting');

    // Initialize draft state
    const draftStateRef = ref(database, `lobbies/${this.currentLobbyId}/draftState`);
    await update(draftStateRef, {
      phase: 'draft',
      currentPlayer: 0,
      round: 1
    });
  }

  // Submit picks
  async submitPicks(picks) {
    if (!this.currentLobbyId || !this.playerId) return;

    const picksRef = ref(database, `lobbies/${this.currentLobbyId}/playerPicks/${this.playerId}`);
    await set(picksRef, {
      picks,
      submittedAt: Date.now()
    });
  }

  // Leave lobby
  async leaveLobby() {
    if (!this.currentLobbyId || !this.playerId) return;

    const playerRef = ref(database, `lobbies/${this.currentLobbyId}/players/${this.playerId}`);
    await remove(playerRef);

    // Clean up listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];

    this.currentLobbyId = null;
    this.playerId = null;
  }

  // Delete lobby (host only)
  async deleteLobby() {
    if (!this.currentLobbyId) return;

    const lobbyRef = ref(database, `lobbies/${this.currentLobbyId}`);
    await remove(lobbyRef);

    this.currentLobbyId = null;
    this.playerId = null;
  }

  // Get list of all lobbies (for lobby browser)
  async getPublicLobbies() {
    const lobbiesRef = ref(database, 'lobbies');
    const snapshot = await get(lobbiesRef);
    
    if (!snapshot.exists()) return [];

    const lobbies = [];
    snapshot.forEach((child) => {
      const lobby = child.val();
      const playerCount = Object.keys(lobby.players || {}).length;
      
      lobbies.push({
        name: lobby.name,
        playerCount,
        status: lobby.status,
        created: lobby.created
      });
    });

    return lobbies.filter(l => l.status === 'waiting');
  }
}

export const multiplayerService = new MultiplayerService();