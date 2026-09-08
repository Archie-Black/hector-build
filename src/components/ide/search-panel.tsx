import { useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { searchFiles } from "@/lib/ide/model";

export function SearchPanel() {
  const open = useForgeStore((s) => s.searchOpen);
  const files = useForgeStore((s) => s.files);
  const [q, setQ] = useState("");
  if (!open) return null;
  const hits = searchFiles(files, q);

  return (
    <div className="absolute inset-y-12 left-0 z-20 flex w-72 flex-col border-r border-line bg-surface">
      <div className="flex h-11 items-center gap-2 px-2">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search workspace"
          className="h-9 flex-1 bg-transparent text-sm outline-none"
        />
        <button type="button" className="text-xs text-muted" onClick={() => useForgeStore.getState().setSearchOpen(false)}>
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
        {hits.map((hit, i) => (
          <button
            key={i}
            type="button"
            className="mb-1 w-full rounded-md px-2 py-2 text-left"
            onClick={() => useForgeStore.getState().openPath(hit.path)}
          >
            <p className="font-mono text-xs">{hit.path}:{hit.line}</p>
            <p className="truncate text-xs text-muted">{hit.text}</p>
          </button>
        ))}
        {q && hits.length === 0 ? <p className="px-2 text-xs text-muted">No hits.</p> : null}
      </div>
    </div>
  );
}
