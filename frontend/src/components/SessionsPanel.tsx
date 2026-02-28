import { Session } from "@/lib/types";

export default function SessionsPanel({
  sessions,
  activeId,
  onNew,
  onSelect,
  onDeleteLocal,
  busy,
}: {
  sessions: Session[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDeleteLocal: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div className="h-full border-r border-zinc-200 bg-white p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Sessions</div>
        <button
          disabled={busy}
          onClick={onNew}
          className="text-sm px-2 py-1 rounded-md border hover:bg-zinc-50 disabled:opacity-50"
        >
          + New
        </button>
      </div>

      <div className="text-xs text-zinc-500 mb-2">
        Local list for now (backend sessions are in-memory)
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={[
              "p-2 rounded-lg border cursor-pointer",
              s.id === activeId
                ? "border-zinc-900"
                : "border-zinc-200 hover:bg-zinc-50",
            ].join(" ")}
            onClick={() => onSelect(s.id)}
          >
            <div className="text-sm font-medium truncate">{s.name}</div>
            <div className="text-xs text-zinc-500 truncate">{s.id}</div>

            <button
              className="mt-2 text-xs text-red-600 hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLocal(s.id);
              }}
            >
              remove from list
            </button>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-sm text-zinc-500">
            No sessions yet. Click <span className="font-medium">+ New</span>.
          </div>
        )}
      </div>
    </div>
  );
}