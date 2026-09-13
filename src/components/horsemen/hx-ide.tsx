import { useEffect, useRef, useState } from "react";
import { ask as hectorAsk } from "@/lib/v01d/ask";
import { pingFabric, requestAlerts, requestSite } from "@/lib/v01d/cloud";
import { accel } from "@/lib/hx/rdna";

type Note = { who: "you" | "hx"; text: string; jersey?: number };
type Crew = { id: number; n: number; task: string };

export function HxIde() {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<Note[]>([
    { who: "hx", text: "Spectral HX. Tell me what to build. Ghosts take the work. RDNA and CUDA compile as a team." },
  ]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void pingFabric();
  }, []);

  useEffect(() => {
    box.current?.scrollTo(0, box.current.scrollHeight);
  }, [log]);

  function send() {
    const t = q.trim();
    if (!t) return;
    setQ("");
    const job = hectorAsk(t);
    if (job.run === "fabric-heal") void requestSite("repair");
    if (job.run === "site-scale") void requestSite("scale");
    if (job.run === "site-roll") void requestSite("roll");
    if (job.run === "site-backup") void requestSite("backup");
    if (job.run === "site-restore") void requestSite("restore");
    if (job.run === "site-mesh") void requestSite("mesh");
    if (job.run === "rdna") {
      const a = accel({ amd: true, nvidia: true });
      setLog((xs) => xs.concat({ who: "hx", text: `${a.note} ${a.cc.join(" + ")}.` }));
    }
    if (job.app) window.dispatchEvent(new CustomEvent("v01d-open", { detail: { app: job.app } }));
    const n = job.jersey ?? Math.min(9, 1 + Math.floor(t.length / 24));
    const id = Date.now();
    setCrew((xs) => xs.concat({ id, n, task: t.slice(0, 42) }).slice(-6));
    setLog((xs) =>
      xs.concat(
        { who: "you", text: t },
        { who: "hx", text: job.say, jersey: n },
      ),
    );
    if (job.tile) window.dispatchEvent(new Event("v01d-tile"));
  }

  return (
    <div className="hx-ide">
      <header className="hx-bar">
        <img src="/horsemen/icons/hx.png" alt="" />
        <b>SPECTRAL HX</b>
        <em>{crew.length ? `${crew.reduce((a, c) => a + c.n, 0)} ghosts` : "ready"}</em>
      </header>
      <div className="hx-chat">
        <aside className="hx-crew" aria-label="Ghost agents">
          {crew.length === 0 ? <p className="hx-idle">Waiting.</p> : null}
          {crew.map((c) => (
            <div key={c.id} className="hx-agent">
              <span className="hx-ghost">
                <img src="/horsemen/hector-ask.png" alt="" />
                <b>{c.n}</b>
              </span>
              <p>{c.task}</p>
            </div>
          ))}
        </aside>
        <div className="hx-log" ref={box}>
          {log.map((m, i) => (
            <p key={i} className={m.who === "you" ? "you" : "hx"}>
              {m.jersey ? <span className="hx-tag">{m.jersey}</span> : null}
              {m.text}
            </p>
          ))}
        </div>
      </div>
      <form
        className="hx-send"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          value={q}
          rows={2}
          aria-label="Message Spectral HX"
          placeholder="Tell Spectral HX what to build."
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
