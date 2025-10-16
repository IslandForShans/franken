import React from "react";
import './UnifiedStyles.css';

export default function DraftHistory({ history = [] }) {
  return (
  <div className="draft-history">
    <h2 className="draft-history-title">Draft History</h2>
    <ul className="draft-history-list">
      {history.map((h, i) => (
        <li key={i} className="draft-history-item">
          Round {h.round} - {h.playerName || `Player ${h.playerIndex + 1}`} picked {h.componentId || h.item?.name || h.item?.id} ({h.category})
        </li>
      ))}
    </ul>
  </div>
);
}