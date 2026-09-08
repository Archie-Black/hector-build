import { useMemo, useState } from "react";
import { ChevronRight, FilePlus, Trash2 } from "lucide-react";
import { useForgeStore } from "@/lib/forge-store";
import { nestPaths, type TreeNode } from "@/lib/ide/model";

export function FileTree() {
  const files = useForgeStore((s) => s.files);
  const activePath = useForgeStore((s) => s.activePath);
  const dirty = useForgeStore((s) => s.dirty);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ src: true, demo: true });
  const paths = Object.keys(files).sort();
  const shown = filter ? paths.filter((p) => p.toLowerCase().includes(filter.toLowerCase())) : paths;
  const tree = useMemo(() => nestPaths(shown), [shown]);

  function render(nodes: TreeNode[], depth = 0) {
    return nodes.map((node) => {
      if (node.kind === "dir") {
        const expanded = open[node.path] ?? depth < 1;
        return (
          <div key={node.path}>
            <button
              type="button"
              className="flex h-8 w-full items-center gap-1 rounded-md px-2 text-left text-xs text-muted"
              style={{ paddingLeft: `${0.5 + depth * 0.6}rem` }}
              onClick={() => setOpen((s) => ({ ...s, [node.path]: !expanded }))}
            >
              <ChevronRight className={"size-3 " + (expanded ? "rotate-90" : "")} />
              {node.name}
            </button>
            {expanded ? render(node.kids ?? [], depth + 1) : null}
          </div>
        );
      }
      return (
        <button
          key={node.path}
          type="button"
          className={
            "flex h-8 w-full items-center truncate rounded-md px-2 text-left font-mono text-xs " +
            (node.path === activePath ? "bg-accent text-accent-fg" : "text-muted")
          }
          style={{ paddingLeft: `${0.75 + depth * 0.6}rem` }}
          onClick={() => useForgeStore.getState().openPath(node.path)}
        >
          {dirty[node.path] ? "● " : ""}
          {node.name}
        </button>
      );
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="px-3 pb-1 text-xs tracking-[0.14em] text-subtle uppercase">Explorer</p>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter files"
        className="mx-2 mb-2 h-9 rounded-md bg-inset px-2 text-xs outline-none"
      />
      <div className="min-h-0 flex-1 overflow-auto px-1 pb-2">{render(tree)}</div>
      <form
        className="flex gap-1 px-2 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) useForgeStore.getState().createFile(draft.trim());
          setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="src/new.js"
          className="h-9 min-w-0 flex-1 rounded-md bg-inset px-2 font-mono text-xs outline-none"
        />
        <button type="submit" aria-label="New file" className="flex size-9 items-center justify-center rounded-md text-muted">
          <FilePlus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Delete file"
          className="flex size-9 items-center justify-center rounded-md text-muted"
          onClick={() => useForgeStore.getState().deleteFile(activePath)}
        >
          <Trash2 className="size-4" />
        </button>
      </form>
    </div>
  );
}
