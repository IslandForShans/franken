import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import FactionSheet from './FactionSheet';
import DraftHistory from './DraftHistory';
import FrankenDrazBuilder from './FrankenDrazBuilder';
import { executeSwap } from '../utils/swapUtils';

export default function MultiplayerGuestView({
  mpState,
  myPlayerIndex,
  onSubmitPicks,
  onSubmitFaction,
  onNavigate,
}) {
  const [pendingPicks, setPendingPicks] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [phaseSubmitted, setPhaseSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [localFaction, setLocalFaction] = useState(null);
  const headerRef = useRef(null);
  const prevPhaseRef = useRef(null);
  const prevRoundRef = useRef(null);

  // Reset local state whenever the host broadcasts a new phase or round
  useEffect(() => {
    const newPhase = mpState?.draftPhase;
    const newRound = mpState?.round;
    if (newPhase !== prevPhaseRef.current || newRound !== prevRoundRef.current) {
      prevPhaseRef.current = newPhase;
      prevRoundRef.current = newRound;
      const broadcastFaction = mpState?.factions?.[myPlayerIndex];
      if (broadcastFaction) setLocalFaction({ ...broadcastFaction });
      setSubmitted(false);
      setPhaseSubmitted(false);
      setPendingPicks([]);
    }
  }, [mpState?.draftPhase, mpState?.round, myPlayerIndex]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--header-height', `${h}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Waiting for host to start ────────────────────────────────────────
  if (!mpState?.draftStarted) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg font-semibold">Waiting for host to start the draft...</div>
          <div className="text-sm mt-2 text-gray-500">You are connected as Player {myPlayerIndex + 1}</div>
        </div>
      </div>
    );
  }

  const {
    factions = [],
    playerBags = [],
    round = 1,
    draftPhase = 'draft',
    draftVariant = 'franken',
    firstRoundPickCount = 3,
    subsequentRoundPickCount = 2,
    categories = [],
    draftLimits = {},
    draftHistory = [],
    pendingSwaps = [],
    playerCount = 2,
    expansionsEnabled = {},
  } = mpState;

  const myFaction = localFaction ?? factions[myPlayerIndex] ?? {};
  const myBag = playerBags[myPlayerIndex] ?? {};
  const maxPicks = round === 1 ? firstRoundPickCount : subsequentRoundPickCount;
  const myPendingSwaps = pendingSwaps.filter(s => s.playerIndex === myPlayerIndex);

  // playerProgress for the Sidebar — counts items already in the faction per category
  const myProgress = {};
  categories.forEach(cat => { myProgress[cat] = myFaction[cat]?.length ?? 0; });

  const handlePick = useCallback((category, component) => {
    if (submitted || draftPhase !== 'draft') return;
    const compId = component.id || component.name;
    const alreadyPicked = pendingPicks.some(
      p => p.category === category && (p.component.id || p.component.name) === compId
    );
    if (alreadyPicked) {
      setPendingPicks(prev => prev.filter(
        p => !(p.category === category && (p.component.id || p.component.name) === compId)
      ));
    } else {
      if (pendingPicks.length >= maxPicks) return;
      setPendingPicks(prev => [...prev, { category, component }]);
    }
  }, [pendingPicks, maxPicks, submitted, draftPhase]);

  const handleSubmitPicks = () => {
    if (pendingPicks.length < maxPicks) {
      alert(`You must pick ${maxPicks} component${maxPicks !== 1 ? 's' : ''}.`);
      return;
    }
    setSubmitted(true);
    onSubmitPicks(pendingPicks);
  };

  const handleSubmitPhase = (phase) => {
    setPhaseSubmitted(true);
    onSubmitFaction(myFaction, phase);
  };

  // ── Shared header ────────────────────────────────────────────────────
  const renderHeader = (showBagToggle = false) => (
    <div ref={headerRef} className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg app-header">
      <div className="px-4 py-2">
        <h2 className="text-xl font-bold text-yellow-400">Franken Draft — Player {myPlayerIndex + 1}</h2>
        <div className="flex items-center gap-3 mt-2">
          {showBagToggle && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="sidebar-toggle-button px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
            >
              {sidebarCollapsed ? '→ Bag' : '← Hide'}
            </button>
          )}
          {draftPhase === 'complete' && onNavigate && (
            <button
              onClick={() => onNavigate('/mapbuilder-draft', { factions, playerCount })}
              className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              🗺️ Build Map
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── DRAFT PHASE ──────────────────────────────────────────────────────
  if (draftPhase === 'draft') {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="flex min-h-[100dvh]">
          <Sidebar
            isOpen={!sidebarCollapsed}
            categories={categories}
            onSelectCategory={setSelectedCategory}
            playerProgress={myProgress}
            draftLimits={draftLimits}
            selectedCategory={selectedCategory}
            availableComponents={myBag}
            onComponentClick={handlePick}
            draftVariant={draftVariant}
          />
          {!sidebarCollapsed && (
            <div
              className="sidebar-backdrop"
              role="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarCollapsed(true)}
            />
          )}

          <div className="flex-1 flex flex-col">
            {renderHeader(true)}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Status / submit bar */}
              <div className={`p-3 rounded-lg border ${submitted
                ? 'bg-yellow-900/30 border-yellow-600'
                : 'bg-blue-900/30 border-blue-600'}`}>
                <h3 className={`font-bold text-sm ${submitted ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {submitted
                    ? `✓ Picks submitted — waiting for other players... (Round ${round})`
                    : `Round ${round} — Choose ${maxPicks} component${maxPicks !== 1 ? 's' : ''} from your bag`}
                </h3>

                {!submitted && pendingPicks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pendingPicks.map((pick, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-800 hover:bg-red-800 text-white px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                        onClick={() => handlePick(pick.category, pick.component)}
                        title="Click to remove"
                      >
                        {pick.component.name} ×
                      </span>
                    ))}
                  </div>
                )}

                {!submitted && (
                  <button
                    onClick={handleSubmitPicks}
                    disabled={pendingPicks.length < maxPicks}
                    className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Submit Picks ({pendingPicks.length}/{maxPicks})
                  </button>
                )}
              </div>

              <FactionSheet
                drafted={myFaction}
                onRemove={() => {}}
                draftLimits={draftLimits}
                title={myFaction.name || `Player ${myPlayerIndex + 1}`}
                playerIndex={myPlayerIndex}
              />

              <DraftHistory history={draftHistory} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REDUCTION PHASE ──────────────────────────────────────────────────
  if (draftPhase === 'reduction') {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
        {renderHeader(false)}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 bg-orange-900/30 rounded-lg border border-orange-600">
            <h3 className="font-bold text-orange-400 text-lg mb-2">Reduction Phase</h3>
            <p className="text-orange-300 text-sm mb-3">
              Remove excess components from your faction to meet the limits. Click any component to remove it.
            </p>
            {!phaseSubmitted ? (
              <button
                onClick={() => handleSubmitPhase('reduction')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Done with Reductions
              </button>
            ) : (
              <div className="text-xs text-yellow-400 font-semibold">✓ Submitted — waiting for other players...</div>
            )}
          </div>

          <FactionSheet
            drafted={myFaction}
            onRemove={(cat, idx) => {
              if (phaseSubmitted) return;
              setLocalFaction(prev => {
                const updated = { ...prev, [cat]: [...(prev[cat] || [])] };
                updated[cat].splice(idx, 1);
                return updated;
              });
            }}
            draftLimits={draftLimits}
            title={myFaction.name || `Player ${myPlayerIndex + 1}`}
            playerIndex={myPlayerIndex}
            showReductionHelper={true}
            showRemoveButton={!phaseSubmitted}
          />
        </div>
      </div>
    );
  }

  // ── SWAP PHASE ───────────────────────────────────────────────────────
  if (draftPhase === 'swap') {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
        {renderHeader(false)}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-600">
            <h3 className="font-bold text-blue-400 text-lg mb-2">Swap Phase</h3>
            <p className="text-blue-300 text-sm mb-3">
              Review available component swaps. You can choose to swap or refuse.
            </p>
            {!phaseSubmitted ? (
              <button
                onClick={() => handleSubmitPhase('swap')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Done with Swaps
              </button>
            ) : (
              <div className="text-xs text-yellow-400 font-semibold">✓ Submitted — waiting for other players...</div>
            )}
          </div>

          <FactionSheet
            drafted={myFaction}
            onRemove={() => {}}
            onSwapComponent={(_, category, componentIdx, swapOption, triggerComponent) => {
              if (phaseSubmitted) return;
              const { updatedFactions } = executeSwap({
                factions: [myFaction],
                playerIndex: 0,
                swapCategory: category,
                replaceIndex: componentIdx,
                swapOption,
                triggerComponent,
              });
              if (updatedFactions[0]) setLocalFaction(updatedFactions[0]);
            }}
            onRefuseSwap={() => {}}
            draftLimits={draftLimits}
            title={myFaction.name || `Player ${myPlayerIndex + 1}`}
            playerIndex={myPlayerIndex}
            showSwapHelper={!phaseSubmitted}
            availableSwaps={myPendingSwaps}
          />
        </div>
      </div>
    );
  }

  // ── BUILD PHASE (FrankenDraz only) ───────────────────────────────────
  if (draftPhase === 'build') {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
        {renderHeader(false)}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-600">
            <h3 className="font-bold text-purple-400 text-lg mb-2">Build Phase</h3>
            <p className="text-purple-300 text-sm mb-2">
              Build your faction from the components you drafted. You must stay within the standard faction limits.
            </p>
            {!phaseSubmitted ? (
              <button
                onClick={() => handleSubmitPhase('build')}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors shadow-lg"
              >
                Complete My Build
              </button>
            ) : (
              <div className="text-xs text-yellow-400 font-semibold">✓ Submitted — waiting for other players...</div>
            )}
          </div>

          <FrankenDrazBuilder
            playerIndex={myPlayerIndex}
            draftedItems={myFaction}
            builtFaction={myFaction}
            onAddComponent={(category, component) => {
              if (phaseSubmitted) return;
              setLocalFaction(prev => ({
                ...prev,
                [category]: [...(prev[category] || []), component],
              }));
            }}
            onRemoveComponent={(category, index) => {
              if (phaseSubmitted) return;
              setLocalFaction(prev => {
                const updated = { ...prev, [category]: [...(prev[category] || [])] };
                updated[category].splice(index, 1);
                return updated;
              });
            }}
            factionLimits={draftLimits}
            expansionsEnabled={expansionsEnabled}
            activeCategories={categories}
          />
        </div>
      </div>
    );
  }

  // ── COMPLETE PHASE ───────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {renderHeader(false)}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-6 bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-xl border-2 border-green-500 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🎉</span>
            <h3 className="font-bold text-green-400 text-2xl">Draft Complete!</h3>
          </div>
          <p className="text-green-300">Your faction has been finalized. Review it below.</p>
        </div>

        <FactionSheet
          drafted={myFaction}
          onRemove={() => {}}
          draftLimits={draftLimits}
          title={`${myFaction.name || `Player ${myPlayerIndex + 1}`} — Final Faction`}
          playerIndex={myPlayerIndex}
        />

        <DraftHistory history={draftHistory} />
      </div>
    </div>
  );
}