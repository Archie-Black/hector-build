import { useState } from "react";
import { planHelix, type Plan } from "@/lib/helix/plan";

export function Helix() {
  const [q, setQ] = useState("");
  const [to, setTo] = useState<"linux" | "win">("linux");
  const [out, setOut] = useState<Plan | null>(null);

  function go() {
    const t = q.trim();
    if (!t) return;
    setOut(planHelix(`convert ${t} to ${to === "win" ? "windows" : "linux"}`, t));
  }

  return (
    <div className="helix">
      <header className="helix-bar">
        <b>HELIX</b>
        <em>rebuild or wrap</em>
      </header>
      <form
        className="helix-row"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Program or source path" aria-label="Program" />
        <button type="button" className={to === "linux" ? "on" : ""} onClick={() => setTo("linux")}>
          Linux
        </button>
        <button type="button" className={to === "win" ? "on" : ""} onClick={() => setTo("win")}>
          Windows
        </button>
        <button type="submit">Go</button>
      </form>
      {out ? (
        <div className="helix-out">
          <p>{out.note}</p>
          <ul>
            {out.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {out.sh ? <pre>{out.sh.split("\n").slice(0, 6).join("\n")}…</pre> : null}
        </div>
      ) : (
        <p className="helix-idle">Source gets rebuilt. A lone binary gets an adapter that other machines can run without Hector.</p>
      )}
    </div>
  );
}
