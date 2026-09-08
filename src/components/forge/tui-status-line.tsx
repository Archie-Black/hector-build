import { useForgeStore } from "@/lib/forge-store";
import { isXaiKey } from "@/lib/workspace/keys";

export function TuiStatusLine() {
  const tests = useForgeStore((s) => s.tests);
  const granted = useForgeStore((s) => s.granted);
  const sandbox = useForgeStore((s) => s.sandbox);
  const progress = useForgeStore((s) => s.progress);
  const mode = useForgeStore((s) => s.sessionMode);
  const platform = useForgeStore((s) => s.platform);
  const busy = useForgeStore((s) => s.busy);
  const connected = useForgeStore((s) => s.ownerReady || isXaiKey(s.visitorKey));
  const failed = tests.filter((t) => !t.pass).length;
  const pass = tests.length - failed;

  return (
    <footer className="flex h-8 shrink-0 items-center gap-3 overflow-hidden border-t border-line bg-surface px-3 font-mono text-xs text-muted">
      <span className="text-accent">hx</span>
      <span>grok-4.6</span>
      <span>{mode}</span>
      <span>{granted ? "granted" : "locked"}</span>
      <span className={failed ? "text-fail" : "text-pass"}>
        {pass}/{tests.length} tests
      </span>
      <span className="tabular-nums">{Math.round(progress)}%</span>
      <span>{sandbox ? "sandbox" : "live"}</span>
      <span>{platform}</span>
      <span className="ml-auto">{busy ? "running" : connected ? "ready" : "need key"}</span>
    </footer>
  );
}
