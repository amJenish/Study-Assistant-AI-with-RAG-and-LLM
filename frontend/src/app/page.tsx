"use client";

import { useRef, useState } from "react";
import SessionsPanel from "@/components/SessionsPanel";
import ChatPanel from "@/components/ChatPanel";
import UploadsPanel from "@/components/UploadsPanel";
import { Msg, Paper, Session } from "@/lib/types";
import { askSession, createSession, endSession, removeFile, uploadToSession } from "@/lib/api";

export default function Page() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // per-session local UI state (since backend sessions are in-memory)
  const [papersBySession, setPapersBySession] = useState<Record<string, Paper[]>>({});
  const [msgsBySession, setMsgsBySession] = useState<Record<string, Msg[]>>({});

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const activePapers: Paper[] = activeSessionId ? papersBySession[activeSessionId] ?? [] : [];
  const activeMessages: Msg[] = activeSessionId ? msgsBySession[activeSessionId] ?? [] : [];

  async function newSession() {
    setBusy(true);
    try {
      const { session_id } = await createSession();

      const s: Session = {
        id: session_id,
        name: `Session ${sessions.length + 1}`,
        createdAt: Date.now(),
      };

      setSessions((prev) => [s, ...prev]);
      setActiveSessionId(session_id);

      // initialize local state for this session so messages/papers are never undefined
      setPapersBySession((prev) => ({ ...prev, [session_id]: [] }));
      setMsgsBySession((prev) => ({ ...prev, [session_id]: [] }));
      setInput("");
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  function selectSession(id: string) {
    setActiveSessionId(id);
    setInput("");
  }

  function deleteSessionLocal(id: string) {
    // purely removes it from the left panel list (does not call backend)
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setInput("");
    }
  }

  async function handleUpload(file: File) {
    if (!activeSessionId) return;

    setBusy(true);
    try {
      const data = await uploadToSession(activeSessionId, file);
      const paper: Paper = { paper_id: data.paper_id, title: data.title || file.name };

      setPapersBySession((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] ?? []), paper],
      }));
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemovePaper(paper_id: string) {
    if (!activeSessionId) return;

    setBusy(true);
    try {
      const data = await removeFile(activeSessionId, paper_id);

      setPapersBySession((prev) => ({
        ...prev,
        [activeSessionId]: (prev[activeSessionId] ?? []).filter(
          (p) => p.paper_id !== data.removed_file_id
        ),
      }));
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!activeSessionId) return;

    const q = input.trim();
    if (!q) return;

    setInput("");

    // add user message
    setMsgsBySession((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] ?? []), { role: "user", text: q }],
    }));

    setBusy(true);
    try {
      const data = await askSession(activeSessionId, q);

      // add bot message + sources string
      setMsgsBySession((prev) => ({
        ...prev,
        [activeSessionId]: [
          ...(prev[activeSessionId] ?? []),
          { role: "bot", text: data.answer, sources: data.sources },
        ],
      }));
    } catch (e) {
      setMsgsBySession((prev) => ({
        ...prev,
        [activeSessionId]: [
          ...(prev[activeSessionId] ?? []),
          { role: "bot", text: `Error: ${String(e)}` },
        ],
      }));
    } finally {
      setBusy(false);
    }
  }

  async function endActiveSession() {
    if (!activeSessionId) return;

    setBusy(true);
    try {
      await endSession(activeSessionId);

      // clear local state for that session (optional)
      setPapersBySession((prev) => ({ ...prev, [activeSessionId]: [] }));
      setMsgsBySession((prev) => ({ ...prev, [activeSessionId]: [] }));
      setInput("");
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="h-screen w-screen grid grid-cols-[260px_1fr_320px]">
      {/* Left */}
      <SessionsPanel
        sessions={sessions}
        activeId={activeSessionId}
        onNew={newSession}
        onSelect={selectSession}
        onDeleteLocal={deleteSessionLocal}
        busy={busy}
      />

      {/* Center */}
      <ChatPanel
        activeSessionId={activeSessionId}
        messages={activeMessages}
        input={input}
        setInput={setInput}
        busy={busy}
        onSend={send}
      />

      {/* Right */}
      <div className="h-full relative">
        <UploadsPanel
          activeSessionId={activeSessionId}
          papers={activePapers}
          busy={busy}
          onUploadClick={() => fileRef.current?.click()}
          onRemove={handleRemovePaper}
        />

        {/* Hidden file picker */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.currentTarget.value = "";
          }}
        />

        {/* End session button */}
        <div className="absolute bottom-3 left-3 right-3">
          <button
            disabled={!activeSessionId || busy}
            onClick={endActiveSession}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50 disabled:opacity-50"
          >
            End Active Session (backend cleanup)
          </button>
        </div>
      </div>
    </main>
  );
}