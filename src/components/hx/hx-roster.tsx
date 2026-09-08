import { JerseyGhost } from "@/components/hx/jersey-ghost";
import { SpectreStage } from "@/components/forge/spectre-stage";
import { useForgeStore } from "@/lib/forge-store";
import { ROLE_LABEL } from "@/lib/workspace/team";

export function HxRoster({ compact = false }: { compact?: boolean }) {
  const tasks = useForgeStore((s) => s.tasks);
  const busy = useForgeStore((s) => s.busy);
  const shown =
    tasks.length > 0
      ? tasks
      : [
          {
            id: "standby",
            title: "Standing by",
            assignee: "lead" as const,
            status: "queued" as const,
            crew: 1,
          },
        ];

  return (
    <aside className={"flex flex-col " + (compact ? "min-h-0 flex-1" : "h-full w-56 shrink-0 border-r border-line glass-window")}>
      <p className="px-3 pt-3 text-xs tracking-[0.14em] text-subtle uppercase">Agents</p>
      <div className="px-2 py-2">
        <SpectreStage busy={busy} ghosts={Math.min(5, Math.max(3, shown.reduce((n, t) => n + (t.crew || 1), 0)))} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {shown.map((task) => (
          <article key={task.id} className="mb-4 rounded-md px-2 py-3 text-center glass-thin">
            <JerseyGhost number={task.crew} busy={busy && (task.status === "active" || task.status === "assigned")} />
            <p className="mt-2 text-xs text-subtle">{ROLE_LABEL[task.assignee]}</p>
            <p className="mt-1 text-sm text-pretty">{task.title}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
