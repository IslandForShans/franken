import { useState, useRef } from "react";
import { createPortal } from "react-dom";

export default function HoverInfoPopup({ content }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const hideTimerRef = useRef(null);

  const clearHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearHide();
    hideTimerRef.current = setTimeout(() => setVisible(false), 120);
  };

  const show = (e) => {
    clearHide();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(rect.right + 12, window.innerWidth - 320);
    const y = Math.min(rect.top, window.innerHeight - 400);
    setPos({ x, y });
    setVisible(true);
  };

  return (
    <>
      <span
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        className="cursor-help text-purple-400 hover:text-purple-200 text-base leading-none select-none"
      >
        ℹ️
      </span>

      {visible && createPortal(
        <div
          onMouseEnter={clearHide}
          onMouseLeave={scheduleHide}
          style={{
            position: "fixed",
            top: pos.y,
            left: pos.x,
            width: "300px",
            maxHeight: "500px",
            overflowY: "auto",
            background: "#0b1220",
            border: "1px solid var(--border-color)",
            borderRadius: "0.75rem",
            padding: "1rem",
            boxShadow: "0 30px 70px rgba(0,0,0,0.85)",
            zIndex: 100000,
            pointerEvents: "auto",
          }}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}