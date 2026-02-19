import { useState, useRef } from 'react';
import MainPage from './components/MainPage';
import DraftSimulator from './components/DraftSimulator';
import TheorycraftingApp from './components/TheorycraftingApp';
import ComponentReference from './components/ComponentReference';
import TI4MapBuilder from './components/TI4MapBuilder';
import DraftMapBuilder from './components/DraftMapBuilder';
import MiltyDraftPage from './components/MiltyDraftPage';
import { useWebRTCMultiplayer } from './hooks/useWebRTCMultiplayer';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [mapBuilderDraftData, setMapBuilderDraftData] = useState(null);

  // ── Multiplayer lives here so the connection survives navigation ──────
  const onStateReceivedRef = useRef(null);
  const onPeerMessageRef = useRef(null);

  const multiplayer = useWebRTCMultiplayer({
    onStateReceived: (state) => onStateReceivedRef.current?.(state),
    onPeerMessage: (slotId, msg) => {
      // Guest: host is telling us to navigate to map builder
      if (msg.type === 'NAVIGATE_MAP_BUILDER') {
        setMapBuilderDraftData(msg.data);
        setCurrentPage('mapbuilder-draft');
        return;
      }
      onPeerMessageRef.current?.(slotId, msg);
    },
  });
  // ─────────────────────────────────────────────────────────────────────

  const handleNavigate = (path, data) => {
    if (path === '/mapbuilder-draft') {
      setMapBuilderDraftData(data ?? null);
      setCurrentPage('mapbuilder-draft');
    } else if (path === '/draft') {
      setCurrentPage('draft');
    } else if (path === '/milty') {
      setCurrentPage('milty');
    } else if (path === '/theorycrafting') {
      setCurrentPage('theorycrafting');
    } else if (path === '/reference') {
      setCurrentPage('reference');
    } else if (path === '/mapbuilder') {
      setCurrentPage('mapbuilder');
    } else {
      setCurrentPage('home');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto">
      {currentPage === 'home' && <MainPage onNavigate={handleNavigate} />}
      {currentPage === 'draft' && (
        <DraftSimulator
          onNavigate={handleNavigate}
          multiplayer={multiplayer}
          onStateReceivedRef={onStateReceivedRef}
          onPeerMessageRef={onPeerMessageRef}
        />
      )}
      {currentPage === 'milty' && <MiltyDraftPage onNavigate={handleNavigate} />}
      {currentPage === 'theorycrafting' && <TheorycraftingApp onNavigate={handleNavigate} />}
      {currentPage === 'reference' && <ComponentReference onNavigate={handleNavigate} />}
      {currentPage === 'mapbuilder' && <TI4MapBuilder onNavigate={handleNavigate} />}
      {currentPage === 'mapbuilder-draft' && mapBuilderDraftData && (
        <DraftMapBuilder
          onNavigate={handleNavigate}
          draftData={mapBuilderDraftData}
          multiplayer={multiplayer}
          onPeerMessageRef={onPeerMessageRef}
        />
      )}
    </div>
  );
}

export default App;