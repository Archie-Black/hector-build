import { BackButton } from "@/components/forge/back-button";
import { HxRoster } from "@/components/hx/hx-roster";
import { useForgeStore } from "@/lib/forge-store";

export function HxLiveWindow() {
  const traces = useForgeStore((s) => s.traces);
  const busy = useForgeStore((s) => s.busy);
  const status = useForgeStore((s) => s.status);

  return (
    <aside className="flex h-full w-full flex-col">
      <div className="flex items-center gap-2 px-2 py-1 glass-thin">
        <p className="flex-1 text-sm">Spectral HX</p>
        <BackButton
          onClick={() => {
            useForgeStore.getState().closeHx();
            if (typeof window !== "undefined" && window.name === "spectral-hx") window.close();
          }}
          label="Close"
        />
      </div>
      <HxRoster compact />
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3 text-sm">
        <p className="text-xs text-subtle">{busy ? "live · receiving Hector jobs" : "live · waiting for Hector"}</p>
        <p className="mt-2 text-muted">{status}</p>
        {traces.slice(-8).map((t, i) => (
          <p key={i} className={"mt-2 font-mono text-xs " + (t.ok ? "text-muted" : "text-fail")}>
            {t.name} · {t.detail}
          </p>
        ))}
      </div>
    </aside>
  );
}
