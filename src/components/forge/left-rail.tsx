import { Link } from "@tanstack/react-router";
import { FileTree } from "@/components/forge/file-tree";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { useForgeStore } from "@/lib/forge-store";

export function LeftRail() {
  const busy = useForgeStore((s) => s.busy);
  const memory = useForgeStore((s) => s.memory);

  return (
    <aside className="left-rail flex h-full w-64 shrink-0 flex-col border-r border-line glass-window">
      <div className="px-2 pt-2">
        <SpectreStage busy={busy} ghosts={3 + Math.min(memory.lessons.length, 2)} />
        <p className="px-2 pb-1 text-center text-xs text-subtle">Hector Build</p>
      </div>
      <FileTree />
      <nav className="flex flex-col gap-2 px-3 pb-3">
        <Link to="/hx" className="flex h-11 items-center justify-center rounded-md bg-accent text-sm text-accent-fg">
          Spectral HX
        </Link>
        <button type="button" className="h-11 rounded-md glass-thin" onClick={() => useForgeStore.getState().setSurface("maze")}>
          Play
        </button>
        <button type="button" className="h-11 rounded-md glass-thin" onClick={() => useForgeStore.getState().setSurface("studio")}>
          Studio
        </button>
      </nav>
    </aside>
  );
}
