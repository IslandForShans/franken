// src/components/FirebaseMultiplayerPanel.jsx
import React, { useState, useEffect } from 'react';
import { multiplayerService } from '../services/firebaseMultiplayer';

export default function FirebaseMultiplayerPanel({ draftSettings, onDraftStart }) {
  const [view, setView] = useState('menu'); // menu, create, join, lobby
  const [lobbyName, setLobbyName] = useState('');
  const [password, setPassword] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (view === 'lobby') {
      const unsubscribe = multiplayerService.onLobbyUpdate((lobbyData) => {
        setLobby(lobbyData);
        
        // Check if draft started
        if (lobbyData.status === 'drafting' && lobbyData.draftState.phase === 'draft') {
          onDraftStart && onDraftStart(lobbyData);
        }
      });

      return () => unsubscribe && unsubscribe();
    }
  }, [view]);

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
  };

  const handleLeaveLobby = async () => {
    await multiplayerService.leaveLobby();
    setView('menu');
    setLobby(null);
    setError('');
  };

  const toggleReady = async () => {
    if (!lobby) return;
    const myPlayer = lobby.players[multiplayerService.playerId];
    await multiplayerService.setPlayerReady(!myPlayer.ready);
  };

  // Menu View
  if (view === 'menu') {
    return (
      <div className="border rounded p-4 bg-gray-50">
        <h3 className="font-bold text-lg mb-4">Multiplayer Draft</h3>
        
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
        </div>

        <div className="mt-4 text-xs text-gray-600">
          <p>• Create a lobby with a unique name and password</p>
          <p>• Share the lobby name and password with friends</p>
          <p>• All players must be ready before starting</p>
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

  // Lobby View
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

  return null;
}