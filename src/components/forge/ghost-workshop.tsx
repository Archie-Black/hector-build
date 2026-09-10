import { useForgeStore } from "@/lib/forge-store";
import { ROLE_LABEL } from "@/lib/workspace/team";
import { GhostSprite } from "@/components/forge/ghost-sprite";

export function GhostWorkshop() {
  const busy = useForgeStore((s) => s.busy);
  const tasks = useForgeStore((s) => s.tasks);
  const crew = tasks.length
    ? tasks
    : [
        { id: "lead", title: "Stand by", assignee: "lead" as const, status: "queued" as const, crew: 1 },
        { id: "scout", title: "Stand by", assignee: "scout" as const, status: "queued" as const, crew: 1 },
        { id: "patch", title: "Stand by", assignee: "patch" as const, status: "queued" as const, crew: 1 },
        { id: "test", title: "Stand by", assignee: "test" as const, status: "queued" as const, crew: 1 },
      ];

  return (
    <div className={"relative h-full min-h-52 overflow-hidden rounded-md bg-inset " + (busy ? "hector-busy" : "")}>
      <p className="absolute top-2 left-3 z-10 text-[11px] tracking-[0.14em] text-subtle uppercase">
        Delegation
      </p>
      {crew.slice(0, 4).map((task, i) => (
        <div
          key={task.id}
          className="workshop-ghost"
          style={{ animationDelay: `${i * -1.4}s`, top: `${18 + i * 16}%` }}
        >
          <GhostSprite kind="agent" className="h-14 w-14" />
          <span className="mt-1 block max-w-28 truncate text-center text-[10px] text-muted">
            {ROLE_LABEL[task.assignee]} · {task.status}
          </span>
        </div>
      ))}
      <GhostSprite
        kind="hector"
        className="hector-foreman pointer-events-none absolute right-3 bottom-2 h-20 w-20"
      />
    </div>
  );
}
