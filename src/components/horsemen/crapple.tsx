import { useRef, useState } from "react";
import { mapButton, mapKey, mapWheel } from "@/lib/v01d/crapple";

export function Crapple({ pane = "darwin" }: { pane?: "darwin" | "unix" }) {
  const [log, setLog] = useState<string[]>(
    pane === "unix"
      ? ["Unix window. Read, write, execute."]
      : ["Darwin window. Windows key is Command. One mouse button. Wheel scrolls."],
  );
  const box = useRef<HTMLDivElement>(null);

  function note(s: string) {
    setLog((xs) => xs.concat(s).slice(-8));
  }

  return (
    <div
      className="crapple"
      tabIndex={0}
      ref={box}
      onKeyDown={(e) => {
        const m = mapKey(e.code);
        if (m.cmd) {
          e.preventDefault();
          note("Command");
        }
      }}
      onMouseDown={(e) => {
        const b = mapButton(e.button);
        e.preventDefault();
        note(b === 0 ? "click" : `button ${b}`);
      }}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={(e) => {
        const w = mapWheel(e.deltaX, e.deltaY);
        e.preventDefault();
        if (w.scroll) note(`scroll ${w.scroll > 0 ? "down" : "up"}`);
      }}
    >
      <header className="crapple-bar">
        <i className="crapple-dot" />
        <b>{pane === "unix" ? "UNIX" : "CRAPPLE"}</b>
        <em>{pane === "unix" ? "posix" : "darwin"}</em>
      </header>
      <div className="crapple-glass">
        {log.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    </div>
  );
}
