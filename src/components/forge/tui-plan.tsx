import { Button } from "@/components/ui/button";
import { useForgeStore } from "@/lib/forge-store";

export function TuiPlan({ onRun }: { onRun: (prompt: string) => void }) {
  const plan = useForgeStore((s) => s.plan);
  if (!plan) return null;
  return (
    <div className="mx-3 mt-3 rounded-md bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-[0.14em] text-subtle uppercase">Plan review</p>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-sm text-muted">
        {plan}
      </pre>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          onClick={() => {
            useForgeStore.getState().setSessionMode("swarm");
            onRun(`Execute the approved plan:\n${plan}`);
          }}
        >
          Approve and run
        </Button>
        <button
          type="button"
          className="h-11 px-3 text-xs text-muted hover:text-fg"
          onClick={() => useForgeStore.getState().setPlan("")}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
