import { useEffect, useMemo, useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { modName } from "@/lib/ide/keys";

export function CommandPalette() {
  const open = useForgeStore((s) => s.paletteOpen);
  const files = useForgeStore((s) => s.files);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const actions = [
    { id: "save", label: "Save file", run: () => useForgeStore.getState().saveActive() },
    { id: "format", label: "Format document", run: () => useForgeStore.getState().formatActive() },
    { id: "test", label: "Run checks", run: () => useForgeStore.getState().runChecks() },
    { id: "undo", label: "Undo apply", run: () => useForgeStore.getState().undoApply() },
    { id: "search", label: "Search workspace", run: () => useForgeStore.getState().setSearchOpen(true) },
    { id: "problems", label: "Problems", run: () => useForgeStore.getState().setBottomPane("problems") },
    { id: "term", label: "Terminal", run: () => useForgeStore.getState().setBottomPane("term") },
    { id: "diff", label: "Diff", run: () => useForgeStore.getState().setBottomPane("diff") },
    { id: "chat", label: "Toggle host chat", run: () => useForgeStore.getState().setHostChatOpen(!useForgeStore.getState().hostChatOpen) },
    { id: "settings", label: "Settings", run: () => useForgeStore.getState().setSettingsOpen(true) },
  ];
  const paths = Object.keys(files);
  const items = useMemo(() => {
    const n = q.trim().toLowerCase();
    const fileHits = paths
      .filter((p) => !n || p.toLowerCase().includes(n))
      .slice(0, 12)
      .map((path) => ({
        id: path,
        label: path,
        run: () => useForgeStore.getState().openPath(path),
      }));
    const cmdHits = actions.filter((a) => !n || a.label.toLowerCase().includes(n));
    return [...cmdHits, ...fileHits];
  }, [q, paths]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-bg/60 pt-24"
      onClick={() => useForgeStore.getState().setPaletteOpen(false)}
    >
      <div className="w-full max-w-lg rounded-lg bg-surface p-2 shadow-[var(--shadow-border)]" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Go to file · ${modName()}+P`}
          className="h-11 w-full bg-transparent px-3 text-sm outline-none"
          onKeyDown={(e) => {
            if (e.key === "Escape") useForgeStore.getState().setPaletteOpen(false);
            if (e.key === "Enter" && items[0]) {
              items[0].run();
              useForgeStore.getState().setPaletteOpen(false);
            }
          }}
        />
        <ul className="max-h-72 overflow-auto">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex h-9 w-full items-center rounded-md px-3 text-left font-mono text-xs text-muted"
                onClick={() => {
                  item.run();
                  useForgeStore.getState().setPaletteOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
