import { Paper } from "@/lib/types";

export default function UploadsPanel({
  activeSessionId,
  papers,
  busy,
  onUploadClick,
  onRemove,
}: {
  activeSessionId: string | null;
  papers: Paper[];
  busy: boolean;
  onUploadClick: () => void;
  onRemove: (paper_id: string) => void;
}) {
  return (
    <div className="h-full border-l border-zinc-200 bg-white p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Uploads</div>
        <button
          disabled={!activeSessionId || busy}
          onClick={onUploadClick}
          className="text-sm px-2 py-1 rounded-md border hover:bg-zinc-50 disabled:opacity-50"
        >
          Upload
        </button>
      </div>

      <div className="text-xs text-zinc-500 mb-2">
        Uploaded papers for the active session
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {papers.map((p) => (
          <div key={p.paper_id} className="p-2 rounded-lg border border-zinc-200">
            <div className="text-sm font-medium truncate">{p.title}</div>
            <div className="text-xs text-zinc-500 truncate">{p.paper_id}</div>

            <button
              disabled={busy}
              className="mt-2 text-xs text-red-600 hover:underline disabled:opacity-50"
              onClick={() => onRemove(p.paper_id)}
            >
              remove
            </button>
          </div>
        ))}

        {papers.length === 0 && (
          <div className="text-sm text-zinc-500">
            {activeSessionId ? "No uploads yet." : "Select/create a session first."}
          </div>
        )}
      </div>
    </div>
  );
}