import { useMemo, useState } from "react";
import { joinBuild, loadWeave, seams, type Weave } from "@/lib/v01d/weave";
import { pick } from "@/lib/horsemen/sphere-fx";

export function WeaveDock({
  weave,
  onJoin,
}: {
  weave: Weave;
  onJoin: (w: Weave) => void;
}) {
  const [open, setOpen] = useState(true);
  const desks = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const p of weave.parts) {
      const row = m.get(p.desk) || [];
      row.push(p.title);
      m.set(p.desk, row);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [weave]);
  const links = seams();
  if (!weave.parts.length) return null;
  return (
    <div className="weave-dock pane-glass" onPointerDown={(e) => e.stopPropagation()}>
      <header>
        <button type="button" onClick={() => setOpen((v) => !v)}>
          Connectors
        </button>
        <button
          type="button"
          className="weave-join"
          onClick={() => {
            pick();
            onJoin(joinBuild());
          }}
        >
          Join into one build
        </button>
      </header>
      {open ? (
        <div className="weave-body">
          {desks.map(([i, names]) => (
            <p key={i}>
              <b>Workspace {i + 1}</b>
              <span>{names.join(" · ")}</span>
            </p>
          ))}
          {links.length ? (
            <ul>
              {links.map((s) => (
                <li key={s.id}>
                  {s.from + 1} → {s.to + 1} · {s.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">Hector will wire matching parts when you join.</p>
          )}
          {weave.join ? <p className="note">{weave.join.note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function bootWeave() {
  return loadWeave();
}
