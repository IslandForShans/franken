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

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      if (sessionStorage.getItem("mp_guest_state") &&
          sessionStorage.getItem("current_page") === "draft") return "draft";
    } catch {}
    return "home";
  });
  const [mapBuilderDraftData, setMapBuilderDraftData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // ── Multiplayer lives here so the connection survives navigation ──────
  const onStateReceivedRef = useRef(null);
  const onPeerMessageRef = useRef(null);
  
  useEffect(() => {
    sessionStorage.setItem("current_page", currentPage);
  }, [currentPage]);

  const multiplayer = useWebRTCMultiplayer({
    onStateReceived: (state) => onStateReceivedRef.current?.(state),
    onPeerMessage: (slotId, msg) => {
      // Guest: host is telling us to navigate to map builder
      if (msg.type === "NAVIGATE_MAP_BUILDER") {
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
  // ─────────────────────────────────────────────────────────────────────

  const handleNavigate = (path, data) => {
    if (path === "/mapbuilder-draft") {
      setMapBuilderDraftData(data ?? null);
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
        <DraftMapBuilder
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