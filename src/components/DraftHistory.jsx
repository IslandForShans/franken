import React from "react";

export default function DraftHistory({ history = [] }) {
  return (
    <div className="border p-2 rounded shadow bg-gray-100 max-h-48 overflow-y-auto">
      <h2 className="font-bold mb-1 text-sm">Draft History</h2>
      <ul className="text-xs">
        {history.map((h, i) => (
          <li key={i}>
            Round {h.round} - {h.playerName || `Player ${h.playerIndex + 1}`} picked {h.componentId || h.item?.name || h.item?.id} ({h.category})
          </li>
        ))}
      </ul>
    </div>
  );
}