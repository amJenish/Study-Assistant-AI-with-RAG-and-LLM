import { Msg } from "@/lib/types";
import { useEffect, useRef } from "react";

export default function ChatPanel({
  activeSessionId,
  messages,
  input,
  setInput,
  busy,
  onSend,
}: {
  activeSessionId: string | null;
  messages: Msg[];
  input: string;
  setInput: (v: string) => void;
  busy: boolean;
  onSend: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const safeMessages = messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [safeMessages]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="font-semibold">Chat</div>
        <div className="text-xs text-zinc-500 truncate">
          Active session: {activeSessionId ?? "none"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 bg-zinc-50">
        {safeMessages.length === 0 ? (
          <div className="text-zinc-500">
            {activeSessionId
              ? "Upload a PDF, then ask a question."
              : "Create/select a session from the left."}
          </div>
        ) : (
          <div className="space-y-3">
            {safeMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[75%] rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                  <div className="text-xs text-zinc-500 mb-1">
                    {m.role === "user" ? "You" : "Bot"}
                  </div>

                  <div className="whitespace-pre-wrap text-sm">{m.text}</div>

                  {/* Sources (big joint string) */}
                  {m.role === "bot" && m.sources && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-zinc-500 hover:underline">
                        Sources
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg p-2">
                        {m.sources}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white p-3">
        <div className="flex gap-2">
          <input
            disabled={!activeSessionId || busy}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Ask something…"
            className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-50"
          />
          <button
            disabled={!activeSessionId || busy}
            onClick={onSend}
            className="rounded-xl border border-zinc-200 px-4 py-2 hover:bg-zinc-50 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {busy && <div className="mt-2 text-xs text-zinc-500">Working…</div>}
      </div>
    </div>
  );
}