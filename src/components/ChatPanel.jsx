// ChatPanel.jsx — full file replacement (it's small enough)
import { useState, useRef, useEffect } from "react";

const TENOR_KEY = "LIVDSRZULELA"; // Tenor public beta key

const COMMON_EMOJIS = [
  "😂","😭","💀","🔥","👀","✅","❌","🎉","👍","👎","🤔","😤","🥹","💯",
  "🫡","😬","🤣","😍","🙏","😅","🥲","😎","🤯","😱","🫠","🤡","💥","⚔️",
  "🛸","🌌","🎲","🃏","🏆","💰","🗺️","⭐","🌠","🔴","🔵","🟡","🟢","🟣",
];

export default function ChatPanel({ messages, onSend, myLabel, systemNotes = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [dismissedNotes, setDismissedNotes] = useState(new Set());
  const [panelSize, setPanelSize] = useState({ width: 288, height: 400 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const prevLengthRef = useRef(0);
  const bottomRef = useRef(null);
  const gifSearchRef = useRef(null);
  const gifDebounceRef = useRef(null);

  const onResizeMouseDown = (e) => {
  e.preventDefault();
  isResizingRef.current = true;
  resizeStartRef.current = {
    x: e.clientX,
    y: e.clientY,
    w: panelSize.width,
    h: panelSize.height,
  };
  const onMove = (e) => {
    if (!isResizingRef.current) return;
    const dw = resizeStartRef.current.x - e.clientX; // dragging left = wider
    const dh = resizeStartRef.current.y - e.clientY; // dragging up = taller
    setPanelSize({
      width: Math.max(240, Math.min(600, resizeStartRef.current.w + dw)),
      height: Math.max(300, Math.min(800, resizeStartRef.current.h + dh)),
    });
  };
  const onUp = () => {
    isResizingRef.current = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
};

  // ── unread + scroll logic (unchanged) ─────────────────────────────────────
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      if (!isOpen) setUnread((u) => u + (messages.length - prevLengthRef.current));
      prevLengthRef.current = messages.length;
    }
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(0);
  };

  // ── GIF helpers ────────────────────────────────────────────────────────────
const fetchGifs = async (query) => {
  setGifLoading(true);
  try {
    const endpoint = query
      ? `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=12`
      : `https://g.tenor.com/v1/trending?key=${TENOR_KEY}&limit=12`;
    const res = await fetch(endpoint);
    const data = await res.json();
    setGifResults(data.results || []);
  } catch {
    setGifResults([]);
  }
  setGifLoading(false);
};

  const handleGifSearchChange = (val) => {
    setGifSearch(val);
    clearTimeout(gifDebounceRef.current);
    gifDebounceRef.current = setTimeout(() => fetchGifs(val), 400);
  };

const sendGif = (gif) => {
  const url = gif.media?.[0]?.gif?.url || gif.media?.[0]?.tinygif?.url;
  if (!url) return;
  onSend(`[GIF]${url}`);
  setShowGifPicker(false);
  setGifSearch("");
};

  // ── Send helpers ───────────────────────────────────────────────────────────
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
    setShowEmojiPicker(false);
  };

  const appendEmoji = (emoji) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // ── Message renderer ───────────────────────────────────────────────────────
  const renderMessageContent = (text) => {
    if (typeof text === "string" && text.startsWith("[GIF]")) {
      const url = text.slice(5);
      return (
        <img
          src={url}
          alt="GIF"
          style={{ maxWidth: "100%", borderRadius: 6, display: "block" }}
        />
      );
    }
    return text;
  };

  const allItems = [
  ...systemNotes
    .map((note, i) => ({ kind: "system", text: note, key: `note-${i}`, noteIdx: i }))
    .filter((n) => !dismissedNotes.has(n.noteIdx)),
  ...messages.map((m, i) => ({ kind: "chat", ...m, key: `msg-${i}` })),
];

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-full font-semibold shadow-lg flex items-center gap-2 transition-colors"
      >
        💬 Chat
        {unread > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-tight">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
  className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl flex flex-col"
  style={{ width: panelSize.width, height: panelSize.height, maxHeight: "calc(100dvh - 2rem)" }}
>
  {/* Resize handle — top-left corner */}
  <div
    onMouseDown={onResizeMouseDown}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: 16,
      height: 16,
      cursor: "nw-resize",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.4 }}>
      <line x1="1" y1="9" x2="9" y2="1" stroke="#9ca3af" strokeWidth="1.5" />
      <line x1="1" y1="5" x2="5" y2="1" stroke="#9ca3af" strokeWidth="1.5" />
    </svg>
  </div>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 flex-shrink-0">
        <span className="font-semibold text-yellow-400 text-sm">💬 Draft Chat</span>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-sm leading-none">✕</button>
      </div>

      {/* GIF picker */}
      {showGifPicker && (
        <div className="flex-shrink-0 border-b border-gray-700 p-2 bg-gray-800">
          <input
            ref={gifSearchRef}
            type="text"
            value={gifSearch}
            onChange={(e) => handleGifSearchChange(e.target.value)}
            placeholder="Search GIFs…"
            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-yellow-500 mb-2"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
              maxHeight: 150,
              overflowY: "auto",
            }}
          >
            {gifLoading && (
              <div className="col-span-3 text-center text-xs text-gray-400 py-2">Loading…</div>
            )}
            {!gifLoading && gifResults.length === 0 && (
              <div className="col-span-3 text-center text-xs text-gray-500 py-2">No results</div>
            )}
            {gifResults.map((gif) => (
              <button
                key={gif.id}
                onClick={() => sendGif(gif)}
                style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
              >
<img
  src={gif.media?.[0]?.tinygif?.url || gif.media?.[0]?.gif?.url}
  alt={gif.title}
  style={{ width: "100%", borderRadius: 4, display: "block" }}
/>
              </button>
            ))}
          </div>
          <div className="text-right mt-1">
            <span style={{ fontSize: 9, color: "#6b7280" }}>Powered by Tenor</span>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div
          className="flex-shrink-0 border-b border-gray-700 p-2 bg-gray-800"
          style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
        >
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => appendEmoji(emoji)}
              style={{
                fontSize: 18,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                lineHeight: 1,
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-2 text-sm">
        {allItems.map((item) =>
          item.kind === "system" ? (
  <div key={item.key} className="flex items-start gap-1 text-xs text-blue-300 italic bg-blue-900/30 rounded px-2 py-1">
    <span className="flex-1">{item.text}</span>
    <button
      onClick={() => setDismissedNotes((prev) => new Set(prev).add(item.noteIdx))}
      style={{
        background: "transparent",
        border: "none",
        color: "#60a5fa",
        cursor: "pointer",
        fontSize: 11,
        lineHeight: 1,
        padding: "1px 2px",
        flexShrink: 0,
      }}
      title="Dismiss"
    >
      ✕
    </button>
  </div>
) : (
            <div key={item.key} className={`flex flex-col ${item.from === myLabel ? "items-end" : "items-start"}`}>
              <span className="text-xs text-gray-400 mb-0.5">{item.from}</span>
              <span
                className={`px-2 py-1 rounded-lg max-w-[85%] break-words text-white ${item.from === myLabel ? "bg-blue-700" : "bg-gray-700"}`}
              >
                {renderMessageContent(item.text)}
              </span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="px-2 py-2 border-t border-gray-700 flex gap-1 flex-shrink-0 items-center">
        {/* Emoji button */}
        <button
          onClick={() => { setShowEmojiPicker((v) => !v); setShowGifPicker(false); }}
          title="Emoji"
          style={{
            fontSize: 16,
            background: showEmojiPicker ? "#374151" : "transparent",
            border: "1px solid #374151",
            borderRadius: 6,
            cursor: "pointer",
            padding: "3px 5px",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          😊
        </button>
        {/* GIF button */}
        <button
  onClick={() => {
  const opening = !showGifPicker;
  setShowGifPicker(opening);
  if (opening) fetchGifs(gifSearch || "");
}}
  title="GIF"
  style={{
    fontSize: 11,
    fontWeight: 800,
    background: showGifPicker ? "#374151" : "transparent",
    border: "1px solid #374151",
    borderRadius: 6,
    cursor: "pointer",
    padding: "3px 5px",
    color: "#fcd34d",
    flexShrink: 0,
  }}
>
  GIF
</button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="flex-1 min-w-0 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex-shrink-0 px-2 py-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white rounded text-sm transition-colors"
        >
          ↑
        </button>
      </div>
    </div>
  );
}