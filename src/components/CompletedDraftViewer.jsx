// src/components/CompletedDraftViewer.jsx
import React from 'react';

export default function CompletedDraftViewer({ draft, onClose }) {
  if (!draft) return null;

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = () => {
    if (!draft.createdAt || !draft.completedAt) return 'Unknown';
    const duration = draft.completedAt - draft.createdAt;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{draft.lobbyName}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Completed: {formatDate(draft.completedAt)}
              </p>
              <p className="text-sm text-gray-600">
                Duration: {getDuration()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Draft Settings */}
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h3 className="font-semibold text-sm mb-2">Draft Settings</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Variant:</span>{' '}
                {draft.settings?.variant || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Players:</span>{' '}
                {draft.players?.length || 0}
              </div>
              <div>
                <span className="font-medium">First Round Picks:</span>{' '}
                {draft.settings?.firstRoundPickCount || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Subsequent Picks:</span>{' '}
                {draft.settings?.subsequentRoundPickCount || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Factions Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {draft.factions && draft.factions.map((faction, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-bold mb-3 flex items-center">
                {faction.playerName}
                {draft.players?.[idx]?.isHost && (
                  <span className="ml-2 text-xs bg-yellow-200 px-2 py-1 rounded">
                    HOST
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(faction.components).map(([category, items]) => {
                  if (category === 'name' || !Array.isArray(items) || items.length === 0) {
                    return null;
                  }

                  return (
                    <div key={category} className="bg-white p-3 rounded">
                      <h4 className="font-semibold text-sm mb-2 capitalize border-b pb-1">
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <ul className="space-y-1">
                        {items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-xs">
                            <div className="flex items-start">
                              <span className="text-gray-400 mr-1">•</span>
                              <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                {item.faction && (
                                  <div className="text-gray-500 italic">
                                    {item.faction}
                                  </div>
                                )}
                                {item.isSwap && (
                                  <div className="text-blue-600 text-xs">
                                    ↻ Swapped from {item.originalComponent}
                                  </div>
                                )}
                                {item.isExtra && (
                                  <div className="text-green-600 text-xs">
                                    + Added from {item.triggerComponent}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                        Total: {items.length}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Draft History Section */}
        {draft.draftHistory && draft.draftHistory.length > 0 && (
          <div className="border-t bg-gray-50 p-4">
            <details className="cursor-pointer">
              <summary className="font-semibold mb-2">
                Draft History ({draft.draftHistory.length} picks)
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto bg-white rounded p-3">
                <div className="space-y-1 text-xs">
                  {draft.draftHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1">
                      <span className="font-medium text-gray-600">
                        R{entry.round}
                      </span>
                      <span className="text-gray-500">
                        P{entry.playerIndex + 1}
                      </span>
                      <span className="flex-1">
                        picked <span className="font-medium">{entry.item?.name}</span>
                        {entry.item?.faction && (
                          <span className="text-gray-500"> ({entry.item.faction})</span>
                        )}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {entry.category?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-gray-600">
            Draft ID: <code className="bg-gray-200 px-2 py-1 rounded">{draft.id}</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}