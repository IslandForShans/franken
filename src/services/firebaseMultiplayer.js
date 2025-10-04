// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, get, onValue, remove, update, push } from "firebase/database";
import { firebaseConfig } from '../config/firebase.js';
import bcrypt from 'bcryptjs';
import { getAuth, signInAnonymously } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app);

export const ensureAuthenticated = async () => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

export class MultiplayerService {
  constructor() {
    this.currentLobbyId = null;
    this.playerId = null;
    this.listeners = [];
    this.loadStoredSession();
  }

  // Load stored session from localStorage for reconnection
  loadStoredSession() {
    try {
      const stored = localStorage.getItem('ti4_multiplayer_session');
      if (stored) {
        const session = JSON.parse(stored);
        // Only restore if session is less than 24 hours old
        if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
          this.currentLobbyId = session.lobbyId;
          this.playerId = session.playerId;
        } else {
          this.clearStoredSession();
        }
      }
    } catch (error) {
      console.error('Error loading stored session:', error);
    }
  }

  // Save session to localStorage for reconnection
  saveSession() {
    try {
      const session = {
        lobbyId: this.currentLobbyId,
        playerId: this.playerId,
        timestamp: Date.now()
      };
      localStorage.setItem('ti4_multiplayer_session', JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Clear stored session
  clearStoredSession() {
    try {
      localStorage.removeItem('ti4_multiplayer_session');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Check if player can reconnect to existing session
  async canReconnect() {
    if (!this.currentLobbyId || !this.playerId) return false;

    try {
    
      await ensureAuthenticated();
    
      const lobbyRef = ref(database, `lobbies/${this.currentLobbyId}`);
      const snapshot = await get(lobbyRef);
      
      if (!snapshot.exists()) return false;

      const lobbyData = snapshot.val();
      // Check if this player is still in the lobby
      return lobbyData.players && lobbyData.players[this.playerId];
    } catch (error) {
      return false;
    }
  }

  // Reconnect to existing session
  async reconnect() {
    if (!this.currentLobbyId || !this.playerId) {
      throw new Error('No session to reconnect to');
    }

    try {
    
      await ensureAuthenticated();
    
      const lobbyRef = ref(database, `lobbies/${this.currentLobbyId}`);
      const snapshot = await get(lobbyRef);

      if (!snapshot.exists()) {
        this.clearStoredSession();
        throw new Error('Lobby no longer exists');
      }

      const lobbyData = snapshot.val();

      if (!lobbyData.players || !lobbyData.players[this.playerId]) {
        this.clearStoredSession();
        throw new Error('You are no longer in this lobby');
      }

      // Update last seen timestamp
      const playerRef = ref(database, `lobbies/${this.currentLobbyId}/players/${this.playerId}/lastSeen`);
      await set(playerRef, Date.now());

      return { success: true, lobbyData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate unique player ID
  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a new lobby
  async createLobby(lobbyName, password, playerName, draftSettings) {
    try {
    
      await ensureAuthenticated();
    
      // Check if lobby name already exists
      const lobbyRef = ref(database, `lobbies/${lobbyName}`);
      const snapshot = await get(lobbyRef);
      
      if (snapshot.exists()) {
        throw new Error("Lobby name already taken");
      }

      this.playerId = this.generatePlayerId();
      this.currentLobbyId = lobbyName;
      
      const hashedPassword = await bcrypt.has(password, 10)

      const lobbyData = {
        name: lobbyName,
        password: hashedPassword, // In production, hash this!
        host: this.playerId,
        created: Date.now(),
        status: 'waiting', // waiting, drafting, complete
        settings: draftSettings,
        players: {
          [this.playerId]: {
            name: playerName,
            joinedAt: Date.now(),
            isHost: true,
            ready: false,
            lastSeen: Date.now()
          }
        },
        draftState: {
          currentPlayer: 0,
          round: 1,
          phase: 'setup',
          factions: [],
          playerProgress: [],
          draftHistory: [],
          playerBags: [],
          rotisseriePool: {}
        }
      };

      await set(lobbyRef, lobbyData);
      this.saveSession();
      return { success: true, lobbyId: lobbyName, playerId: this.playerId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Join existing lobby
  async joinLobby(lobbyName, password, playerName) {
    try {
    
      await ensureAuthenticated();
    
      const lobbyRef = ref(database, `lobbies/${lobbyName}`);
      const snapshot = await get(lobbyRef);

      if (!snapshot.exists()) {
        throw new Error("Lobby not found");
      }

      const lobbyData = snapshot.val();
      
      const isValid = await bcrypt.compare(password, lobbyData.password);
      if (!isValid) {
        throw new Error("Incorrect Password");
      }

      if (lobbyData.password !== password) {
        throw new Error("Incorrect password");
      }

      // Allow rejoining if draft is in progress
      if (lobbyData.status === 'complete') {
        throw new Error("Draft has ended");
      }

      this.playerId = this.generatePlayerId();
      this.currentLobbyId = lobbyName;

      const playerRef = ref(database, `lobbies/${lobbyName}/players/${this.playerId}`);
      await set(playerRef, {
        name: playerName,
        joinedAt: Date.now(),
        isHost: false,
        ready: lobbyData.status === 'drafting', // Auto-ready if draft already started
        lastSeen: Date.now()
      });

      this.saveSession();
      return { success: true, lobbyId: lobbyName, playerId: this.playerId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get current lobby data
  async getLobbyData() {
    if (!this.currentLobbyId) return null;

    const lobbyRef = ref(database, `lobbies/${this.currentLobbyId}`);
    const snapshot = await get(lobbyRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  // Listen to lobby updates
  onLobbyUpdate(callback) {
    if (!this.currentLobbyId) return;

    const lobbyRef = ref(database, `lobbies/${this.currentLobbyId}`);
    const unsubscribe = onValue(lobbyRef, (snapshot) => {
      const data = snapshot.val();
      callback(data); // Pass null if lobby was deleted
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

    const updates = {
      [`lobbies/${this.currentLobbyId}/status`]: 'drafting',
      [`lobbies/${this.currentLobbyId}/draftState/phase`]: 'draft',
      [`lobbies/${this.currentLobbyId}/draftState/currentPlayer`]: 0,
      [`lobbies/${this.currentLobbyId}/draftState/round`]: 1,
      [`lobbies/${this.currentLobbyId}/draftState/startedAt`]: Date.now()
    };

    await update(ref(database), updates);
  }

  // Sync complete draft state to Firebase
  async syncDraftState(draftState) {
    if (!this.currentLobbyId) return;

    const draftStateRef = ref(database, `lobbies/${this.currentLobbyId}/draftState`);
    await update(draftStateRef, {
      ...draftState,
      lastUpdated: Date.now()
    });
  }

  // Sync specific draft updates (for real-time updates)
  async updateDraftState(stateUpdates) {
    if (!this.currentLobbyId) return;

    const draftStateRef = ref(database, `lobbies/${this.currentLobbyId}/draftState`);
    await update(draftStateRef, {
      ...stateUpdates,
      lastUpdated: Date.now()
    });
  }

  // Save completed draft to archive
  async saveCompletedDraft(factions, draftHistory, settings) {
    if (!this.currentLobbyId) return;

    try {
      const lobbyData = await this.getLobbyData();
      if (!lobbyData) return;

      // Create completed draft object
      const completedDraft = {
        lobbyName: lobbyData.name,
        completedAt: Date.now(),
        createdAt: lobbyData.created,
        settings: settings,
        players: Object.entries(lobbyData.players || {}).map(([id, player]) => ({
          name: player.name,
          isHost: player.isHost
        })),
        factions: factions.map((faction, index) => ({
          playerName: faction.name,
          playerIndex: index,
          components: faction
        })),
        draftHistory: draftHistory,
        draftId: `${this.currentLobbyId}_${Date.now()}`
      };

      // Save to completedDrafts collection
      const completedDraftsRef = ref(database, 'completedDrafts');
      const newDraftRef = push(completedDraftsRef);
      await set(newDraftRef, completedDraft);

      return { success: true, draftId: newDraftRef.key };
    } catch (error) {
      console.error('Error saving completed draft:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete draft and archive it
  async completeDraft(factions, draftHistory, settings) {
    if (!this.currentLobbyId) return;

    // Save to archive first
    const saveResult = await this.saveCompletedDraft(factions, draftHistory, settings);

    // Mark lobby as complete
    await update(ref(database, `lobbies/${this.currentLobbyId}`), {
      status: 'complete',
      completedAt: Date.now(),
      archivedDraftId: saveResult.draftId
    });

    return saveResult;
  }

  // Get completed drafts for a player (by searching their name)
  async getCompletedDrafts(playerName, limit = 10) {
    try {
      const draftsRef = ref(database, 'completedDrafts');
      const snapshot = await get(draftsRef);

      if (!snapshot.exists()) return [];

      const drafts = [];
      snapshot.forEach((child) => {
        const draft = child.val();
        // Check if this player was in the draft
        const wasInDraft = draft.players.some(p => p.name === playerName);
        if (wasInDraft) {
          drafts.push({
            id: child.key,
            ...draft
          });
        }
      });

      // Sort by completion date (newest first) and limit
      return drafts
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting completed drafts:', error);
      return [];
    }
  }

  // Get a specific completed draft by ID
  async getCompletedDraft(draftId) {
    try {
      const draftRef = ref(database, `completedDrafts/${draftId}`);
      const snapshot = await get(draftRef);
      return snapshot.exists() ? { id: draftId, ...snapshot.val() } : null;
    } catch (error) {
      console.error('Error getting completed draft:', error);
      return null;
    }
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

  // Update player's last seen timestamp (for detecting disconnects)
  async updateLastSeen() {
    if (!this.currentLobbyId || !this.playerId) return;

    const playerRef = ref(database, `lobbies/${this.currentLobbyId}/players/${this.playerId}/lastSeen`);
    await set(playerRef, Date.now());
  }

  // Start heartbeat to keep connection alive
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Update last seen every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.updateLastSeen();
    }, 30000);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Leave lobby
  async leaveLobby() {
    if (!this.currentLobbyId || !this.playerId) return;

    this.stopHeartbeat();

    const lobbyData = await this.getLobbyData();
    
    // If host is leaving, transfer host to another player or delete lobby
    if (lobbyData && lobbyData.host === this.playerId) {
      const players = Object.keys(lobbyData.players || {}).filter(id => id !== this.playerId);
      
      if (players.length > 0) {
        // Transfer host to next player
        const newHost = players[0];
        await update(ref(database, `lobbies/${this.currentLobbyId}`), {
          host: newHost
        });
        await update(ref(database, `lobbies/${this.currentLobbyId}/players/${newHost}`), {
          isHost: true
        });
      } else {
        // No players left, delete lobby
        await this.deleteLobby();
      }
    }

    // Remove this player
    const playerRef = ref(database, `lobbies/${this.currentLobbyId}/players/${this.playerId}`);
    await remove(playerRef);

    // Clean up listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];

    this.clearStoredSession();
    this.currentLobbyId = null;
    this.playerId = null;
  }

  // Delete lobby (host only)
  async deleteLobby() {
    if (!this.currentLobbyId) return;

    const lobbyRef = ref(database, `lobbies/${this.currentLobbyId}`);
    await remove(lobbyRef);

    // Clean up listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];

    this.stopHeartbeat();
    this.clearStoredSession();
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

  // Clean up old lobbies (utility function - can be called periodically)
  async cleanupOldLobbies(maxAgeHours = 24) {
    const lobbiesRef = ref(database, 'lobbies');
    const snapshot = await get(lobbiesRef);
    
    if (!snapshot.exists()) return;

    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    const promises = [];
    snapshot.forEach((child) => {
      const lobby = child.val();
      const age = now - (lobby.created || 0);
      
      if (age > maxAge) {
        promises.push(remove(child.ref));
      }
    });

    await Promise.all(promises);
  }

  // Clean up old completed drafts (to save database space)
  async cleanupOldCompletedDrafts(maxAgeMonths = 3) {
    const draftsRef = ref(database, 'completedDrafts');
    const snapshot = await get(draftsRef);
    
    if (!snapshot.exists()) return;

    const now = Date.now();
    const maxAge = maxAgeMonths * 30 * 24 * 60 * 60 * 1000;

    const promises = [];
    snapshot.forEach((child) => {
      const draft = child.val();
      const age = now - (draft.completedAt || 0);
      
      if (age > maxAge) {
        promises.push(remove(child.ref));
      }
    });

    await Promise.all(promises);
  }
}

export const multiplayerService = new MultiplayerService();