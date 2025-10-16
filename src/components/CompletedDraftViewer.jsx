import React from 'react';
import './UnifiedStyles.css';

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
    <div className="completed-draft-viewer">
      <div className="completed-draft-content">
        {/* Header */}
        <div className="completed-draft-header">
          <div className="completed-draft-header-content">
            <div>
              <h2 className="text-2xl font-bold">{draft.lobbyName}</h2>
              <p className="text-sm mt-1" style={{color: '#6b7280'}}>
                Completed: {formatDate(draft.completedAt)}
              </p>
              <p className="text-sm" style={{color: '#6b7280'}}>
                Duration: {getDuration()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="completed-draft-close"
            >
              ×
            </button>
          </div>

          {/* Draft Settings */}
          <div className="completed-draft-settings">
            <h3 className="completed-draft-settings-title">Draft Settings</h3>
            <div className="completed-draft-settings-grid">
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
        <div className="completed-draft-body">
          {draft.factions && draft.factions.map((faction, idx) => (
            <div key={idx} className="completed-draft-faction">
              <h3 className="completed-draft-faction-title">
                {faction.playerName}
                {draft.players?.[idx]?.isHost && (
                  <span className="player-badge" style={{marginLeft: '0.5rem'}}>
                    HOST
                  </span>
                )}
              </h3>

              <div className="grid-cols-3 grid">
                {Object.entries(faction.components).map(([category, items]) => {
                  if (category === 'name' || !Array.isArray(items) || items.length === 0) {
                    return null;
                  }

                  return (
                    <div key={category} style={{background: 'white', padding: '0.75rem', borderRadius: '0.25rem'}}>
                      <h4 className="font-semibold text-sm capitalize mb-2" style={{borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem'}}>
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                        {items.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-xs" style={{marginBottom: '0.25rem'}}>
                            <div className="flex items-start">
                              <span style={{color: '#9ca3af', marginRight: '0.25rem'}}>•</span>
                              <div style={{flex: 1}}>
                                <div className="font-medium">{item.name}</div>
                                {item.faction && (
                                  <div style={{color: '#6b7280', fontStyle: 'italic'}}>
                                    {item.faction}
                                  </div>
                                )}
                                {item.isSwap && (
                                  <div className="text-xs" style={{color: '#3b82f6'}}>
                                    ↻ Swapped from {item.originalComponent}
                                  </div>
                                )}
                                {item.isExtra && (
                                  <div className="text-xs" style={{color: '#10b981'}}>
                                    + Added from {item.triggerComponent}
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 pt-2 text-xs" style={{borderTop: '1px solid #e5e7eb', color: '#6b7280'}}>
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
          <div className="completed-draft-history">
            <details style={{cursor: 'pointer'}}>
              <summary className="font-semibold mb-2">
                Draft History ({draft.draftHistory.length} picks)
              </summary>
              <div className="completed-draft-history-content">
                <div style={{fontSize: '0.75rem'}}>
                  {draft.draftHistory.map((entry, idx) => (
                    <div key={idx} className="completed-draft-history-item">
                      <span className="font-medium" style={{color: '#6b7280'}}>
                        R{entry.round}
                      </span>
                      <span style={{color: '#9ca3af'}}>
                        P{entry.playerIndex + 1}
                      </span>
                      <span style={{flex: 1}}>
                        picked <span className="font-medium">{entry.item?.name}</span>
                        {entry.item?.faction && (
                          <span style={{color: '#6b7280'}}> ({entry.item.faction})</span>
                        )}
                      </span>
                      <span style={{color: '#9ca3af', fontSize: '0.75rem'}}>
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
        <div className="completed-draft-footer">
          <div className="completed-draft-id">
            Draft ID: <code>{draft.id}</code>
          </div>
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}