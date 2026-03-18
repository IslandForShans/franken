import { useState, useRef, useEffect } from "react";

export default function ChatPanel({ messages, onSend, myLabel, systemNotes = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const prevLengthRef = useRef(0);
  const bottomRef = useRef(null);

  // Track unread messages while closed
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      if (!isOpen) setUnread((u) => u + (messages.length - prevLengthRef.current));
      prevLengthRef.current = messages.length;
    }
  }, [messages.length, isOpen]);

  // Scroll to bottom when open or new message arrives
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(0);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  const allItems = [
    ...systemNotes.map((note, i) => ({ kind: "system", text: note, key: `note-${i}` })),
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
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl flex flex-col" style={{ height: 360, maxHeight: "calc(100dvh - 2rem)" }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 flex-shrink-0">
        <span className="font-semibold text-yellow-400 text-sm">💬 Draft Chat</span>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-sm leading-none">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-2 text-sm">
        {allItems.map((item) =>
          item.kind === "system" ? (
            <div key={item.key} className="text-center text-xs text-blue-300 italic bg-blue-900/30 rounded px-2 py-1">
              {item.text}
            </div>
          ) : (
            <div key={item.key} className={`flex flex-col ${item.from === myLabel ? "items-end" : "items-start"}`}>
              <span className="text-xs text-gray-400 mb-0.5">{item.from}</span>
              <span className={`px-2 py-1 rounded-lg max-w-[85%] break-words text-white ${item.from === myLabel ? "bg-blue-700" : "bg-gray-700"}`}>
                {item.text}
              </span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 border-t border-gray-700 flex gap-2 flex-shrink-0 items-center overflow-hidden">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 min-w-0 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex-shrink-0 px-3 py-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white rounded text-sm transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}