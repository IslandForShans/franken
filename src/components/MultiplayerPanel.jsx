import { useState } from 'react';

export default function MultiplayerPanel({ playerCount, multiplayer }) {
  const {
    role, phase, peers, error, clearError,
    startHosting, createOfferForSlot, receiveAnswer,
    joinWithOfferCode,
  } = multiplayer;

  const [offerCodes, setOfferCodes] = useState({});
  const [answerInputs, setAnswerInputs] = useState({});
  const [offerInput, setOfferInput] = useState('');
  const [myAnswerCode, setMyAnswerCode] = useState('');
  const [copied, setCopied] = useState({});
  const [showJoinForm, setShowJoinForm] = useState(false);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  };

  const handleGenerateOffer = async (slotId) => {
    const code = await createOfferForSlot(slotId);
    if (code) setOfferCodes(prev => ({ ...prev, [slotId]: code }));
  };

  const handleReceiveAnswer = async (slotId) => {
    const ok = await receiveAnswer(answerInputs[slotId] || '');
    if (ok) setAnswerInputs(prev => ({ ...prev, [slotId]: '' }));
  };

  const handleJoin = async () => {
    const answerCode = await joinWithOfferCode(offerInput.trim());
    if (answerCode) setMyAnswerCode(answerCode);
  };

  // Slots for guests: player_2, player_3, ... up to playerCount
  const guestSlots = Array.from({ length: playerCount - 1 }, (_, i) => `player_${i + 2}`);

  // Idle state — show Host / Join buttons
  if (phase === 'idle' && !showJoinForm) {
    return (
      <div className="p-4 bg-gray-800 rounded-xl border border-gray-600 space-y-3">
        <h3 className="font-bold text-yellow-400">🌐 Multiplayer</h3>
        <div className="flex gap-3">
          <button
            onClick={startHosting}
            className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Host Game
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 rounded-xl border border-gray-600 space-y-4">
      <h3 className="font-bold text-yellow-400">🌐 Multiplayer</h3>

      {error && (
        <div className="p-2 bg-red-900/50 border border-red-500 rounded text-red-300 text-xs flex justify-between items-start gap-2">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-200 shrink-0">✕</button>
        </div>
      )}

      {/* ── HOST UI ── */}
      {role === 'host' && (
        <div className="space-y-4">
          <div className="text-xs text-gray-400">
            Generate an offer code for each player, share it with them, then paste back their answer code.
          </div>
          {guestSlots.map((slotId, i) => {
            const peer = peers[slotId];
            return (
              <div key={slotId} className="space-y-2 p-3 bg-gray-900 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-200">Player {i + 2}</span>
                  {peer?.connected
                    ? <span className="text-xs text-green-400">● Connected</span>
                    : peer
                    ? <span className="text-xs text-yellow-400">◌ Waiting</span>
                    : null}
                </div>

                {!offerCodes[slotId] ? (
                  <button
                    onClick={() => handleGenerateOffer(slotId)}
                    className="w-full px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-semibold transition-colors"
                  >
                    Generate Offer Code
                  </button>
                ) : (
                  <>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Share this with Player {i + 2}:</div>
                      <div className="flex gap-2">
                        <textarea
                          readOnly
                          value={offerCodes[slotId]}
                          className="flex-1 text-xs bg-gray-950 border border-gray-600 rounded p-1.5 text-gray-300 resize-none h-16 font-mono"
                        />
                        <button
                          onClick={() => copy(offerCodes[slotId], `offer_${slotId}`)}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white self-start"
                        >
                          {copied[`offer_${slotId}`] ? '✓' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {!peer?.connected && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Paste their answer code:</div>
                        <div className="flex gap-2">
                          <textarea
                            value={answerInputs[slotId] || ''}
                            onChange={e => setAnswerInputs(prev => ({ ...prev, [slotId]: e.target.value }))}
                            placeholder="Paste answer code here..."
                            className="flex-1 text-xs bg-gray-950 border border-gray-600 rounded p-1.5 text-gray-300 resize-none h-16 font-mono"
                          />
                          <button
                            onClick={() => handleReceiveAnswer(slotId)}
                            disabled={!answerInputs[slotId]?.trim()}
                            className="px-2 py-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 rounded text-xs text-white self-start"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── GUEST / JOIN UI ── */}
      {role !== 'host' && (
        <div className="space-y-3">
          {phase !== 'connected' ? (
            <>
              <div className="text-xs text-gray-400">Paste the offer code from the host:</div>
              <textarea
                value={offerInput}
                onChange={e => setOfferInput(e.target.value)}
                placeholder="Paste offer code here..."
                className="w-full text-xs bg-gray-950 border border-gray-600 rounded p-2 text-gray-300 resize-none h-20 font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoin}
                  disabled={!offerInput.trim() || phase === 'connecting'}
                  className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {phase === 'connecting' ? 'Connecting...' : 'Generate Answer Code'}
                </button>
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>

              {myAnswerCode && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Send this back to the host:</div>
                  <div className="flex gap-2">
                    <textarea
                      readOnly
                      value={myAnswerCode}
                      className="flex-1 text-xs bg-gray-950 border border-gray-600 rounded p-1.5 text-gray-300 resize-none h-16 font-mono"
                    />
                    <button
                      onClick={() => copy(myAnswerCode, 'answer')}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white self-start"
                    >
                      {copied.answer ? '✓' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs text-yellow-400 mt-2">⏳ Waiting for host to connect...</div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-green-400 font-semibold">● Connected to host</div>
          )}
        </div>
      )}
    </div>
  );
}