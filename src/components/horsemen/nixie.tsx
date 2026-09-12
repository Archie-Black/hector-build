import { useEffect, useState } from "react";

const GLYPH = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function NixieClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  return (
    <div className="nixie-board pointer-events-none absolute top-4 right-4 z-20" aria-hidden="true">
      <Tube value={hh[0]} />
      <Tube value={hh[1]} />
      <Colon />
      <Tube value={mm[0]} />
      <Tube value={mm[1]} />
      <Colon />
      <Tube value={ss[0]} />
      <Tube value={ss[1]} />
    </div>
  );
}

function Tube({ value }: { value: string }) {
  return (
    <span className="nixie-tube">
      {GLYPH.map((g) => (
        <span key={g} className={g === value ? "nixie-lit" : "nixie-ghost"}>
          {g}
        </span>
      ))}
    </span>
  );
}

function Colon() {
  return <span className="nixie-colon">:</span>;
}
