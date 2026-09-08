import { useForgeStore } from "@/lib/forge-store";

export function TuiDiffPane() {
  const diffs = useForgeStore((s) => s.diffs);
  if (!diffs.length) return null;
  return (
    <section className="max-h-48 overflow-auto border-t border-line bg-inset px-3 py-2 font-mono text-xs">
      <p className="mb-1 text-subtle uppercase tracking-[0.14em]">Diffs</p>
      {diffs.map((d) => (
        <article key={d.path} className="mb-3">
          <p className="text-accent">{d.path}</p>
          <pre className="whitespace-pre-wrap text-muted">
            {d.after.slice(0, 900) || "(deleted)"}
          </pre>
        </article>
      ))}
    </section>
  );
}
