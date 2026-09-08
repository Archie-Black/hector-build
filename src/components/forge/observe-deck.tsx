import { X } from "lucide-react";
import { GhostWorkshop } from "@/components/forge/ghost-workshop";
import { ScaffoldGraph } from "@/components/forge/scaffold-graph";
import { useForgeStore } from "@/lib/forge-store";
import { ROLE_LABEL } from "@/lib/workspace/team";

export function ObserveDeck() {
  const open = useForgeStore((s) => s.observe);
  const verbose = useForgeStore((s) => s.verbose);
  const traces = useForgeStore((s) => s.traces);
  const progress = useForgeStore((s) => s.progress);
  const tasks = useForgeStore((s) => s.tasks);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg/95 p-3 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div>
          <p className="text-sm font-medium">Spectral HX</p>
          <p className="text-xs text-muted tabular-nums">Build {Math.round(progress)}%</p>
        </div>
        <button
          type="button"
          className="ml-auto flex size-11 items-center justify-center rounded-md bg-surface"
          onClick={() => useForgeStore.getState().setObserve(false)}
          aria-label="Close operations"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-2">
        <section className="flex min-h-0 flex-col rounded-lg bg-surface p-3">
          <h2 className="mb-2 text-[11px] tracking-[0.14em] text-subtle uppercase">Log</h2>
          <ul className="mb-3 space-y-1 text-sm">
            {tasks.map((task) => (
              <li key={task.id} className="flex justify-between gap-2 text-muted">
                <span>
                  {ROLE_LABEL[task.assignee]} · {task.title}
                </span>
                <span className="tabular-nums text-subtle">{task.status}</span>
              </li>
            ))}
          </ul>
          <ul className="min-h-0 flex-1 space-y-2 overflow-auto text-sm leading-relaxed">
            {verbose.map((line) => (
              <li key={line.id} className="text-muted">
                {line.text}
              </li>
            ))}
            {traces.map((t, i) => (
              <li key={`t-${i}`} className={t.ok ? "text-muted" : "text-fail"}>
                {t.name} · {t.detail}
              </li>
            ))}
          </ul>
        </section>
        <section className="flex min-h-0 flex-col gap-3">
          <GhostWorkshop />
          <ScaffoldGraph />
        </section>
      </div>
    </div>
  );
}
