import { Pause, Play, Plus, RotateCcw } from "lucide-react";
import { JerseyGhost } from "@/components/hx/jersey-ghost";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useForgeStore } from "@/lib/forge-store";
import { ROLE_LABEL, type AgentRole, type TaskStatus } from "@/lib/workspace/team";

const COLS: TaskStatus[] = ["queued", "assigned", "active", "done", "blocked"];
const SPAWN: { role: AgentRole; title: string; cmd: string }[] = [
  { role: "scout", title: "Scout the workspace", cmd: "/scout Survey the workspace and report risks." },
  { role: "patch", title: "Patch lane", cmd: "/patch Implement the open assignment." },
  { role: "test", title: "Checks lane", cmd: "/swarm Run tests and keep going until they pass." },
  { role: "improve", title: "Improve lane", cmd: "/swarm Distill lessons and tighten the last change." },
];

type Props = { onRun: (text: string) => void };

export function HxOrchestration({ onRun }: Props) {
  const tasks = useForgeStore((s) => s.tasks);
  const busy = useForgeStore((s) => s.busy);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b border-line px-3 py-2">
        {SPAWN.map((s) => (
          <Button
            key={s.role}
            type="button"
            variant="line"
            size="sm"
            disabled={busy}
            onClick={() => {
              useForgeStore.getState().spawnLane(s.role, s.title);
              onRun(s.cmd);
            }}
          >
            <Plus className="size-4" />
            {ROLE_LABEL[s.role]}
          </Button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="grid min-w-[48rem] grid-cols-5 gap-2">
          {COLS.map((col) => (
            <div key={col} className="rounded-md bg-inset p-2">
              <p className="px-1 text-xs tracking-[0.14em] text-subtle uppercase">{col}</p>
              {tasks
                .filter((t) => t.status === col)
                .map((task) => (
                  <Card key={task.id} className="mt-2 p-3">
                    <JerseyGhost number={task.crew} busy={busy && (col === "active" || col === "assigned")} />
                    <CardTitle className="mt-2">{ROLE_LABEL[task.assignee]}</CardTitle>
                    <p className="mt-1 text-sm text-pretty">{task.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-md text-muted"
                        aria-label="Pause"
                        onClick={() => useForgeStore.getState().setTaskStatus(task.id, "queued")}
                      >
                        <Pause className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-md text-muted"
                        aria-label="Run"
                        onClick={() => useForgeStore.getState().setTaskStatus(task.id, "active")}
                      >
                        <Play className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-md text-muted"
                        aria-label="Retry"
                        onClick={() => {
                          useForgeStore.getState().setTaskStatus(task.id, "assigned");
                          onRun(`/${task.assignee === "test" ? "swarm" : task.assignee} ${task.title}`);
                        }}
                      >
                        <RotateCcw className="size-4" />
                      </button>
                    </div>
                  </Card>
                ))}
            </div>
          ))}
        </div>
        {tasks.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No lanes yet. Spawn a bot or send a job.</p>
        ) : (
          <p className="mt-3">
            <Badge>{tasks.length} lanes</Badge>
          </p>
        )}
      </div>
    </section>
  );
}
