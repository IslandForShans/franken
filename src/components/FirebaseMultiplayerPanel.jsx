// src/components/FirebaseMultiplayerPanel.jsx
import React, { useState, useEffect } from 'react';
import { multiplayerService } from '../services/firebaseMultiplayer';
import CompletedDraftViewer from './CompletedDraftViewer.jsx';

export default function FirebaseMultiplayerPanel({ draftSettings, onDraftStart, onDraftStateSync }) {
  const [view, setView] = useState('menu'); // menu, create, join, lobby, drafting, history
  const [lobbyName, setLobbyName] = useState('');
  const [password, setPassword] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [canReconnect, setCanReconnect] = useState(false);
  const [completedDrafts, setCompletedDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);

  // Check for reconnection possibility on mount
  useEffect(() => {
    checkReconnection();
  }, []);

  // Start heartbeat when in lobby or drafting
  useEffect(() => {
    if (view === 'lobby' || view === 'drafting') {
      multiplayerService.startHeartbeat();
      return () => multiplayerService.stopHeartbeat();
    }
  }, [view]);

  const checkReconnection = async () => {
    const canReconnectResult = await multiplayerService.canReconnect();
    setCanReconnect(canReconnectResult);
  };

  const handleReconnect = async () => {
    const result = await multiplayerService.reconnect();
    if (result.success) {
      setLobby(result.lobbyData);
      setIsHost(result.lobbyData.host === multiplayerService.playerId);
      
      if (result.lobbyData.status === 'drafting') {
        setView('drafting');
        // Sync the existing draft state back to the app
        if (onDraftStateSync) {
          onDraftStateSync(result.lobbyData.draftState);
        }
      } else {
        setView('lobby');
      }
      setError('');
    } else {
      setError(result.error);
      setCanReconnect(false);
    }
  };

  useEffect(() => {
    if (view === 'lobby' || view === 'drafting') {
      const unsubscribe = multiplayerService.onLobbyUpdate((lobbyData) => {
        if (!lobbyData) {
          // Lobby was deleted
          setView('menu');
          setError('Lobby was closed by host');
          setLobby(null);
          return;
        }

        setLobby(lobbyData);
        
        // Sync draft state to parent component in real-time
        if (lobbyData.status === 'drafting' && onDraftStateSync) {
          onDraftStateSync(lobbyData.draftState);
        }
        
        // Check if draft started and transition to drafting view
        if (lobbyData.status === 'drafting' && view === 'lobby') {
          setView('drafting');
          onDraftStart && onDraftStart(lobbyData);
        }
      });

      return () => unsubscribe && unsubscribe();
    }
  }, [view, onDraftStart, onDraftStateSync]);

  const handleCreateLobby = async () => {
    if (!lobbyName || !password || !playerName) {
      setError('Please fill in all fields');
      return;
    }

    const result = await multiplayerService.createLobby(
      lobbyName,
      password,
      playerName,
      draftSettings
    );

    if (result.success) {
      setIsHost(true);
      setView('lobby');
      setError('');
    } else {
      setError(result.error);
    }
  };

  const handleJoinLobby = async () => {
    if (!lobbyName || !password || !playerName) {
      setError('Please fill in all fields');
      return;
    }

    const result = await multiplayerService.joinLobby(lobbyName, password, playerName);

    if (result.success) {
      setIsHost(false);
      setView('lobby');
      setError('');
      
      // If joining a lobby that's already drafting, transition immediately
      const lobbyRef = await multiplayerService.getLobbyData();
      if (lobbyRef && lobbyRef.status === 'drafting') {
        setView('drafting');
        if (onDraftStateSync) {
          onDraftStateSync(lobbyRef.draftState);
        }
        onDraftStart && onDraftStart(lobbyRef);
      }
    } else {
      setError(result.error);
    }
  };

  const handleStartDraft = async () => {
    if (!isHost) return;
    
    const players = Object.values(lobby.players || {});
    if (players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }

    const allReady = players.every(p => p.ready || p.isHost);
    if (!allReady) {
      setError('All players must be ready');
      return;
    }

    await multiplayerService.startDraft();
    // View will transition automatically via the listener
  };

  const handleLeaveLobby = async () => {
    await multiplayerService.leaveLobby();
    setView('menu');
    setLobby(null);
    setError('');
  };

  const handleEndDraft = async (factions, draftHistory, settings) => {
    if (!isHost) return;
    
    if (confirm('Are you sure you want to end the draft? This will save the results and close the lobby.')) {
      const result = await multiplayerService.completeDraft(factions, draftHistory, settings);
      
      if (result.success) {
        alert(`Draft saved successfully! Draft ID: ${result.draftId}`);
        await multiplayerService.deleteLobby();
        setView('menu');
        setLobby(null);
        setError('');
      } else {
        setError('Failed to save draft: ' + result.error);
      }
    }
  };

  const toggleReady = async () => {
    if (!lobby) return;
    const myPlayer = lobby.players[multiplayerService.playerId];
    await multiplayerService.setPlayerReady(!myPlayer.ready);
  };

  const handleViewHistory = async () => {
    if (!playerName) {
      setError('Please enter your name to view history');
      return;
    }

    const drafts = await multiplayerService.getCompletedDrafts(playerName);
    setCompletedDrafts(drafts);
    setView('history');
  };

  const handleViewDraft = async (draftId) => {
    const draft = await multiplayerService.getCompletedDraft(draftId);
    setSelectedDraft(draft);
  };

  // Menu View
  if (view === 'menu') {
    return (
      <div className="border rounded p-4 bg-gray-50">
        <h3 className="font-bold text-lg mb-4">Multiplayer Draft</h3>
        
        {canReconnect && (
          <div className="mb-4 p-3 bg-yellow-100 rounded border border-yellow-300">
            <p className="text-sm font-semibold mb-2">Reconnect to your session?</p>
            <button
              onClick={handleReconnect}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Reconnect to Lobby
            </button>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => setView('create')}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Lobby
          </button>
          
          <button
            onClick={() => setView('join')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Join Lobby
          </button>

          <button
            onClick={handleViewHistory}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            View Draft History
          </button>
        </div>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-600">
          <p>• Create a lobby with a unique name and password</p>
          <p>• Share the lobby name and password with friends</p>
          <p>• All players must be ready before starting</p>
          <p>• You can rejoin an active lobby if disconnected</p>
        </div>
      </div>
    );
  }

  // Create Lobby View
  if (view === 'create') {
    return (
      <div className="border rounded p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Create Lobby</h3>
          <button onClick={() => setView('menu')} className="text-sm text-gray-600 hover:text-gray-800">
            ← Back
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lobby Name</label>
            <input
              type="text"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              placeholder="Choose a unique lobby name"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full border rounded p-2"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateLobby}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Create Lobby
          </button>
        </div>
      </div>
    );
  }

  // Join Lobby View
  if (view === 'join') {
    return (
      <div className="border rounded p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Join Lobby</h3>
          <button onClick={() => setView('menu')} className="text-sm text-gray-600 hover:text-gray-800">
            ← Back
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lobby Name</label>
            <input
              type="text"
              value={lobbyName}
              onChange={(e) => setLobbyName(e.target.value)}
              placeholder="Enter lobby name"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border rounded p-2"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleJoinLobby}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Join Lobby
          </button>
        </div>
      </div>
    );
  }

  // Lobby View (waiting for players)
  if (view === 'lobby' && lobby) {
    const players = Object.entries(lobby.players || {}).map(([id, player]) => ({
      id,
      ...player
    }));
    const playerCount = players.length;
    const allReady = players.every(p => p.ready || p.isHost);

    return (
      <div className="border rounded p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-lg">{lobby.name}</h3>
            <p className="text-sm text-gray-600">{playerCount} player{playerCount !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleLeaveLobby}
            className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Leave
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Players:</h4>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center bg-white p-2 rounded"
              >
                <div>
                  <span className="font-medium">{player.name}</span>
                  {player.isHost && (
                    <span className="ml-2 text-xs bg-yellow-200 px-2 py-1 rounded">
                      HOST
                    </span>
                  )}
                </div>
                <div>
                  {player.ready ? (
                    <span className="text-green-600 text-sm">✓ Ready</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Not Ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {!isHost && (
            <button
              onClick={toggleReady}
              className={`w-full px-4 py-2 rounded ${
                lobby.players[multiplayerService.playerId]?.ready
                  ? 'bg-gray-400 text-white'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {lobby.players[multiplayerService.playerId]?.ready ? 'Not Ready' : 'Ready'}
            </button>
          )}

          {isHost && (
            <button
              onClick={handleStartDraft}
              disabled={playerCount < 2 || !allReady}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Draft {!allReady && '(Waiting for players...)'}
            </button>
          )}
        </div>

        <div className="mt-4 p-2 bg-blue-50 rounded text-xs">
          <p className="font-semibold">Share this info:</p>
          <p>Lobby: <code className="bg-white px-1">{lobby.name}</code></p>
          <p className="mt-1 text-gray-600">Password: (share privately)</p>
        </div>
      </div>
    );
  }

  // Drafting View (draft in progress)
  if (view === 'drafting' && lobby) {
    const players = Object.entries(lobby.players || {}).map(([id, player]) => ({
      id,
      ...player
    }));

    return (
      <div className="border rounded p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-lg">{lobby.name}</h3>
            <p className="text-sm text-green-600">Draft in Progress</p>
          </div>
          {isHost && (
            <button
              onClick={() => {
                // Parent component should pass factions, history, settings
                if (window.endMultiplayerDraft) {
                  window.endMultiplayerDraft(handleEndDraft);
                } else {
                  alert('Please use the "End Draft" button in the main interface');
                }
              }}
              className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              End Draft & Save
            </button>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-semibold mb-2">Players:</h4>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex justify-between items-center bg-white p-2 rounded"
              >
                <div>
                  <span className="font-medium">{player.name}</span>
                  {player.isHost && (
                    <span className="ml-2 text-xs bg-yellow-200 px-2 py-1 rounded">
                      HOST
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-green-600 text-sm">● Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded text-sm">
          <p className="font-semibold mb-1">Draft Info:</p>
          <p>Round: {lobby.draftState?.round || 1}</p>
          <p>Phase: {lobby.draftState?.phase || 'draft'}</p>
          <p>Current Player: {lobby.draftState?.currentPlayer + 1 || 1}</p>
          <p className="mt-2 text-xs text-gray-600">
            Players can rejoin using the same lobby name and password
          </p>
        </div>
      </div>
    );
  }

  // History View
  if (view === 'history') {
    return (
      <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Draft History</h3>
          <button onClick={() => setView('menu')} className="text-sm text-gray-600 hover:text-gray-800">
            ← Back
          </button>
        </div>

        {selectedDraft ? (
          <div className="space-y-3">
            <button
              onClick={() => setSelectedDraft(null)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to list
            </button>

            <div className="bg-white p-3 rounded">
              <h4 className="font-semibold mb-2">{selectedDraft.lobbyName}</h4>
              <p className="text-sm text-gray-600">
                Completed: {new Date(selectedDraft.completedAt).toLocaleString()}
              </p>
              
              <div className="mt-3">
                <p className="font-semibold text-sm mb-2">Players & Factions:</p>
                {selectedDraft.factions.map((faction, idx) => (
                  <div key={idx} className="mb-3 p-2 bg-gray-50 rounded">
                    <p className="font-medium">{faction.playerName}</p>
                    <div className="text-xs mt-1 space-y-1">
                      {Object.entries(faction.components).map(([category, items]) => {
                        if (Array.isArray(items) && items.length > 0 && category !== 'name') {
                          return (
                            <div key={category}>
                              <span className="font-semibold">{category}:</span> {items.length} items
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {completedDrafts.length === 0 ? (
              <p className="text-sm text-gray-600">No completed drafts found for "{playerName}"</p>
            ) : (
              completedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white p-3 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => handleViewDraft(draft.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{draft.lobbyName}</h4>
                      <p className="text-xs text-gray-600">
                        {draft.players.length} players
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(draft.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Completed Draft Viewer Modal */}
        {selectedDraft && (
          <CompletedDraftViewer
            draft={selectedDraft}
            onClose={() => setSelectedDraft(null)}
          />
        )}
      </div>
    );
  }

  return null;
}