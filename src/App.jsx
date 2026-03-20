import { useState, useRef, useCallback, useEffect } from "react";
import MainPage from "./components/MainPage";
import DraftSimulator from "./components/DraftSimulator";
import TheorycraftingApp from "./components/TheorycraftingApp";
import ComponentReference from "./components/ComponentReference";
import NonFactionReference from "./components/NonFactionReference";
import TI4MapBuilder from "./components/TI4MapBuilder";
import DraftMapBuilder from "./components/DraftMapBuilder";
import MiltyDraftPage from "./components/MiltyDraftPage";
import { useWebRTCMultiplayer } from "./hooks/useWebRTCMultiplayer";
import CombatSimulator from "./components/CombatSimulator";
import ChatPanel from "./components/ChatPanel";

const DRAFT_CHAT_NOTES = [
  "This is a live chat! Some notes: Don't refresh the page or you will be disconnected. During the reduction/build, and swap phase do not click remove on something unless you mean to, it cannot be added back currently.",
];

function MapBuilderDisconnectedScreen({ multiplayer }) {
  const [offerInput, setOfferInput] = useState("");
  const [myAnswerCode, setMyAnswerCode] = useState("");
  const { phase, error, clearError, joinWithOfferCode, clearSavedGuestState } = multiplayer;
  const handleJoin = async () => {
    const code = await joinWithOfferCode(offerInput.trim());
    if (code) setMyAnswerCode(code);
  };
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🔌</div>
          <h2 className="text-xl font-bold text-yellow-400">Disconnected from Map Builder</h2>
          <p className="text-sm text-gray-400 mt-1">Ask the host to generate a new offer code for your slot. When you are reconnected, the map will appear blank, once the next tile is placed it should reload the map.</p>
        </div>
        {error && (
          <div className="p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-xs flex justify-between gap-2">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-200 shrink-0">✕</button>
          </div>
        )}
        {!myAnswerCode ? (
          <>
            <textarea value={offerInput} onChange={e => setOfferInput(e.target.value)} placeholder="Paste offer code here..." className="w-full text-xs bg-gray-950 border border-gray-600 rounded p-2 text-gray-300 resize-none h-20 font-mono" />
            <button onClick={handleJoin} disabled={!offerInput.trim() || phase === "connecting"} className="w-full px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors">
              {phase === "connecting" ? "Connecting..." : "Reconnect to Map Builder"}
            </button>
          </>
        ) : (
          <>
            <div className="text-xs text-gray-400">Send this answer code back to the host:</div>
            <textarea readOnly value={myAnswerCode} className="w-full text-xs bg-gray-950 border border-gray-600 rounded p-2 text-gray-300 resize-none h-20 font-mono" />
            <button onClick={() => navigator.clipboard.writeText(myAnswerCode)} className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">Copy Answer Code</button>
          </>
        )}
        <button onClick={() => { clearSavedGuestState(); sessionStorage.removeItem("mp_mapbuilder_data"); window.location.href = "/"; }} className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Leave draft
        </button>
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const page = sessionStorage.getItem("current_page");
      if (page === "draft" && (sessionStorage.getItem("mp_guest_state") || sessionStorage.getItem("mp_host_draft_state"))) return "draft";
      if (page === "mapbuilder-draft" && sessionStorage.getItem("mp_mapbuilder_data")) return "mapbuilder-draft";
    } catch {}
    return "home";
  });
  const [mapBuilderDraftData, setMapBuilderDraftData] = useState(() => {
    try {
      const saved = sessionStorage.getItem("mp_mapbuilder_data");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [chatMessages, setChatMessages] = useState([]);

  // ── Multiplayer lives here so the connection survives navigation ──────
  const onStateReceivedRef = useRef(null);
  const onPeerMessageRef = useRef(null);
  const onPeerConnectedRef = useRef(null);
  const wasGuestRef = useRef(false);

  useEffect(() => {
    sessionStorage.setItem("current_page", currentPage);
  }, [currentPage]);

  const multiplayer = useWebRTCMultiplayer({
    onStateReceived: (state) => onStateReceivedRef.current?.(state),
    onPeerMessage: (slotId, msg) => {
      // Guest: host is telling us to navigate to map builder
      if (msg.type === "NAVIGATE_MAP_BUILDER") {
        sessionStorage.setItem("mp_mapbuilder_data", JSON.stringify(msg.data)); // ← add
        setMapBuilderDraftData(msg.data);
        setCurrentPage("mapbuilder-draft");
        return;
      }
      if (msg.type === "CHAT") {
        setChatMessages((prev) => [...prev, msg]);
        if (multiplayer.role === "host") {
          Object.keys(multiplayer.peers).forEach((peerId) => {
            if (peerId !== slotId) multiplayer.sendToPeer(peerId, msg);
          });
        }
        return;
      }
      onPeerMessageRef.current?.(slotId, msg);
    },
    onPeerConnected: (slotId) => onPeerConnectedRef.current?.(slotId),
  });

  const myChatLabel = multiplayer.mySlotId
    ? `Player ${parseInt(multiplayer.mySlotId.replace("player_", ""), 10)}`
    : "Player 1";

  const sendChatMessage = useCallback(
    (text) => {
      const msg = { type: "CHAT", from: myChatLabel, text, timestamp: Date.now() };
      setChatMessages((prev) => [...prev, msg]);
      if (multiplayer.role === "host") {
        Object.keys(multiplayer.peers).forEach((slotId) =>
          multiplayer.sendToPeer(slotId, msg),
        );
      } else if (multiplayer.role === "guest") {
        multiplayer.sendToHost(msg);
      }
    },
    [myChatLabel, multiplayer],
  );

  useEffect(() => {
    if (multiplayer.role === "guest") wasGuestRef.current = true;
  }, [multiplayer.role]);

  useEffect(() => {
    if (currentPage !== "mapbuilder-draft") return;
    if (multiplayer.role) return; // already has a role
    try {
      const saved = sessionStorage.getItem("mp_host_draft_state");
      if (!saved) return;
      const s = JSON.parse(saved);
      if (!s.playerCount) return;
      multiplayer.startHosting();
      const guestSlots = Array.from(
        { length: s.playerCount - 1 },
        (_, i) => `player_${i + 2}`,
      );
      multiplayer.markSlotsDisconnected(guestSlots);
    } catch {}
  }, [currentPage]);
  // ─────────────────────────────────────────────────────────────────────

  const handleNavigate = (path, data) => {
    if (path === "/mapbuilder-draft") {
      const d = data ?? null;
      if (d) sessionStorage.setItem("mp_mapbuilder_data", JSON.stringify(d)); // ← add
      setMapBuilderDraftData(d);
      setCurrentPage("mapbuilder-draft");
    } else if (path === "/draft") {
      setCurrentPage("draft");
    } else if (path === "/milty") {
      setCurrentPage("milty");
    } else if (path === "/theorycrafting") {
      setCurrentPage("theorycrafting");
    } else if (path === "/reference") {
      setCurrentPage("reference");
    } else if (path === "/reference-non-faction") {
      setCurrentPage("reference-non-faction");
    } else if (path === "/mapbuilder") {
      setCurrentPage("mapbuilder");
    } else if (path === "/combat") {
      setCurrentPage("combat");
    } else {
      setCurrentPage("home");
    }
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      {currentPage === "home" && <MainPage onNavigate={handleNavigate} />}
      {currentPage === "draft" && (
        <DraftSimulator
          onNavigate={handleNavigate}
          multiplayer={multiplayer}
          onStateReceivedRef={onStateReceivedRef}
          onPeerMessageRef={onPeerMessageRef}
          chatMessages={chatMessages}
          onSendChat={sendChatMessage}
          myChatLabel={myChatLabel}
          chatSystemNotes={DRAFT_CHAT_NOTES}
          onPeerConnectedRef={onPeerConnectedRef}
        />
      )}
      {currentPage === "milty" && (
        <MiltyDraftPage onNavigate={handleNavigate} />
      )}
      {currentPage === "theorycrafting" && (
        <TheorycraftingApp onNavigate={handleNavigate} />
      )}
      {currentPage === "reference" && (
        <ComponentReference onNavigate={handleNavigate} />
      )}
      {currentPage === "reference-non-faction" && (
        <NonFactionReference onNavigate={handleNavigate} />
      )}
      {currentPage === "mapbuilder" && (
        <TI4MapBuilder onNavigate={handleNavigate} />
      )}
      {currentPage === "mapbuilder-draft" && mapBuilderDraftData && (
        !!sessionStorage.getItem("mp_guest_slot") && !sessionStorage.getItem("mp_host_draft_state") && !multiplayer.role
          ? <MapBuilderDisconnectedScreen multiplayer={multiplayer} />
          : <DraftMapBuilder
              onNavigate={handleNavigate}
              draftData={mapBuilderDraftData}
              multiplayer={multiplayer}
              onPeerMessageRef={onPeerMessageRef}
              chatMessages={chatMessages}
              onSendChat={sendChatMessage}
              myChatLabel={myChatLabel}
              chatSystemNotes={DRAFT_CHAT_NOTES}
            />
      )}
      {currentPage === "combat" && (
        <CombatSimulator onNavigate={handleNavigate} />
      )}
      {(currentPage === "draft" || currentPage === "mapbuilder-draft") &&
        multiplayer.role && (
          <ChatPanel
            messages={chatMessages}
            onSend={sendChatMessage}
            myLabel={myChatLabel}
            systemNotes={DRAFT_CHAT_NOTES}
          />
        )}
    </div>
  );
}

export default App;