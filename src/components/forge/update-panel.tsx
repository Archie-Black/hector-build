import { useForgeStore } from "@/lib/forge-store";
import { Button } from "@/components/ui/button";

export function UpdatePanel() {
  const updates = useForgeStore((s) => s.updates);
  const hour = String(updates.installHour).padStart(2, "0");

  return (
    <div className="rounded-md bg-surface px-4 py-3">
      <p className="text-[11px] tracking-[0.14em] text-subtle uppercase">Improvement agent</p>
      <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">
        Builds a daily update. Install needs your approval, unless silent install is on
        for a set hour.
      </p>
      {updates.pending ? (
        <div className="mt-3 rounded-sm bg-inset px-3 py-3">
          <p className="text-sm text-fg">{updates.pending.summary}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" onClick={() => useForgeStore.getState().approveUpdate()}>
              Approve install
            </Button>
            <button
              type="button"
              className="h-11 px-3 text-xs text-muted hover:text-fg"
              onClick={() => useForgeStore.getState().dismissUpdate()}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-subtle">No pending build.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <label className="flex h-11 items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={updates.policy === "silent"}
            onChange={(e) =>
              useForgeStore.getState().setUpdatePolicy(e.target.checked ? "silent" : "approve")
            }
          />
          Silent install
        </label>
        <label className="flex h-11 items-center gap-2 text-muted">
          at
          <input
            type="number"
            min={0}
            max={23}
            value={updates.installHour}
            onChange={(e) => useForgeStore.getState().setInstallHour(Number(e.target.value))}
            className="h-11 w-16 rounded-sm bg-inset px-2 text-fg outline-none"
          />
          :00
        </label>
      </div>
      {updates.policy === "silent" ? (
        <p className="mt-1 text-xs text-subtle">
          Next silent window: {hour}:00. The build still waits for that hour.
        </p>
      ) : null}
    </div>
  );
}
