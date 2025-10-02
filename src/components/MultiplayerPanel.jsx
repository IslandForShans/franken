// src/components/MultiplayerPanel.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

export default function MultiplayerPanel({
  serverUrl,
  setServerUrl,
  socketRef,
  lobby,
  setLobby,
  playerBag,
  onConfirmPicks,
  onSubmitPicks,
  localPlayerSocketId,
  draftState
}) {
  const [playerName, setPlayerName] = useState("LocalPlayer");
  const [lobbyIdInput, setLobbyIdInput] = useState("");
  const [playersList, setPlayersList] = useState([]);
  const [connected, setConnected] = useState(false);
  const [selectedPicks, setSelectedPicks] = useState([]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    function handleLobbyUpdate(updatedLobby) {
      setPlayersList(updatedLobby.players || []);
      setLobby(updatedLobby);
    }

    function handleYourBag({ bag }) {
      // update bag is handled by DraftSimulator (listening to 'yourBag'); here we just clear selected picks
      setSelectedPicks([]);
    }

    socket.on("lobbyUpdate", handleLobbyUpdate);
    socket.on("yourBag", handleYourBag);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.off("lobbyUpdate", handleLobbyUpdate);
      socket.off("yourBag", handleYourBag);
    };
  }, [socketRef, setLobby]);

  const handleHost = async () => {
    if (!serverUrl) {
      alert("Set server URL (e.g. http://192.168.1.123:4000)");
      return;
    }
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(serverUrl, { transports: ["websocket"] });
    }
    socket.emit("createLobby", { lobbyId: lobby?.id || undefined, playerName }, (res) => {
      if (res && res.ok) {
        setLobby({ id: res.lobbyId, players: [res.player] });
        setPlayersList([res.player]);
      } else if (res && !res.ok) {
        alert("Could not create lobby: " + (res.error || "unknown"));
      }
    });
  };

  const handleJoin = () => {
    if (!serverUrl) {
      alert("Set server URL (ex: http://192.168.1.123:4000)");
      return;
    }
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(serverUrl, { transports: ["websocket"] });
    }
    socket.emit("joinLobby", { lobbyId: lobbyIdInput, playerName }, (res) => {
      if (res && res.ok) {
        setLobby(res.lobby);
      } else {
        alert("Join failed: " + (res.error || "unknown"));
      }
    });
  };

  const handleSubmitPicks = () => {
    // selectedPicks is an array of {category, componentId}
    const s = socketRef.current;
    if (!s) return alert("Not connected");
    s.emit("submitPicks", { picks: selectedPicks }, (res) => {
      if (!res.ok) alert("Submit picks failed: " + (res.error || ""));
      else onSubmitPicks && onSubmitPicks(selectedPicks);
    });
  };

  const handleConfirm = () => {
    const s = socketRef.current;
    if (!s) return alert("Not connected");
    s.emit("confirmPicks", {}, (res) => {
      if (!res.ok) alert("Confirm failed: " + (res.error || ""));
      else onConfirmPicks && onConfirmPicks();
    });
  };

  return (
    <div className="border p-2 rounded bg-gray-50">
      <h4 className="font-bold">Multiplayer</h4>

      <div className="mb-2">
        <label className="text-xs block">Server URL (host machine IP):</label>
        <input 
          value={serverUrl} 
          onChange={e=>setServerUrl(e.target.value)} 
          className="w-full border p-1 rounded" 
          placeholder="http://192.168.x.x:4000" 
        />
      </div>

      <div className="flex space-x-2 mb-2">
        <input 
          value={playerName} 
          onChange={e=>setPlayerName(e.target.value)} 
          className="border p-1 rounded flex-1" 
          placeholder="Your name"
        />
        <button onClick={handleHost} className="px-2 py-1 bg-green-500 text-white rounded">Host</button>
      </div>

      <div className="mb-2">
        <label className="text-xs">Or join a lobby id:</label>
        <div className="flex space-x-2 mt-1">
          <input 
            value={lobbyIdInput} 
            onChange={e=>setLobbyIdInput(e.target.value)} 
            className="border p-1 rounded flex-1" 
            placeholder="Lobby ID"
          />
          <button onClick={handleJoin} className="px-2 py-1 bg-blue-500 text-white rounded">Join</button>
        </div>
      </div>

      <div className="mb-2">
        <strong>Connection:</strong> {connected ? "Connected" : "Disconnected"}
      </div>

      <div className="mb-2">
        <strong>Players:</strong>
        <ul className="text-sm">
          {playersList.map(p => 
            <li key={p.socketId}>
              {p.name}{p.confirmed ? " (confirmed)" : ""}
            </li>
          )}
        </ul>
      </div>

      <div className="flex space-x-2">
        <button onClick={handleSubmitPicks} className="px-2 py-1 bg-yellow-500 text-white rounded">
          Submit Picks
        </button>
        <button onClick={handleConfirm} className="px-2 py-1 bg-indigo-600 text-white rounded">
          Confirm Picks
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-600">
        <div>Round: {draftState?.round}</div>
        <div>Variant: {draftState?.variant}</div>
      </div>
    </div>
  );
}