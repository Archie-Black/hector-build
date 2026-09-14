import { useEffect, useRef, useState } from "react";
import { ask as hectorAsk } from "@/lib/v01d/ask";
import { pingFabric, requestAlerts, requestSite } from "@/lib/v01d/cloud";
import { accel } from "@/lib/hx/rdna";

type Note = { who: "you" | "hx"; text: string; jersey?: number };
type Crew = { id: number; n: number; task: string };
type Job = ReturnType<typeof hectorAsk>;

const STARTER = `/** Spectral HX. This box. */\nexport function main() {\n  return "OS V01D";\n}\n`;

function takePending(): Job | null {
  try {
    const raw = sessionStorage.getItem("v01d.hx.task");
    if (!raw) return null;
    sessionStorage.removeItem("v01d.hx.task");
    return JSON.parse(raw) as Job;
  } catch {
    return null;
  }
}

export function HxIde() {
  const [q, setQ] = useState("");
  const [file, setFile] = useState("program.ts");
  const [buf, setBuf] = useState(STARTER);
  const [git, setGit] = useState("git");
  const [term, setTerm] = useState<string[]>(["Spectral HX terminal. git · run · save."]);
  const [log, setLog] = useState<Note[]>([
    { who: "hx", text: "Spectral HX. Tell me what to build. Ghosts take the work. RDNA and CUDA compile as a team." },
  ]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void pingFabric();
    void fetch("/api/v1/v01d/hx")
      .then((r) => r.json())
      .then((j: { git?: string }) => setGit(j.git || "git"))
      .catch(() => setGit("git later"));
    const pending = takePending();
    if (pending) ingest(pending, pending.say);
    const onTask = (e: Event) => {
      const job = (e as CustomEvent<Job>).detail;
      if (job) ingest(job, job.say);
    };
    window.addEventListener("v01d-hx-task", onTask);
    return () => window.removeEventListener("v01d-hx-task", onTask);
  }, []);

  useEffect(() => {
    box.current?.scrollTo(0, box.current.scrollHeight);
  }, [log]);

  function ingest(job: Job, extra?: string) {
    if (job.run === "fabric-heal") void requestSite("repair");
    if (job.run === "site-scale") void requestSite("scale");
    if (job.run === "site-roll") void requestSite("roll");
    if (job.run === "site-backup") void requestSite("backup");
    if (job.run === "site-restore") void requestSite("restore");
    if (job.run === "site-mesh") void requestSite("mesh");
    if (job.run === "site-alerts") void requestAlerts();
    if (job.run === "rdna") {
      const a = accel({ amd: true, nvidia: true });
      setLog((xs) => xs.concat({ who: "hx", text: `${a.note} ${a.cc.join(" + ")}.` }));
    }
    const text = extra || job.say;
    const n = job.jersey ?? Math.min(9, 1 + Math.floor(text.length / 24));
    const id = Date.now();
    setCrew((xs) => xs.concat({ id, n, task: text.slice(0, 42) }).slice(-6));
    setLog((xs) => xs.concat({ who: "hx", text, jersey: n }));
    if (job.app && job.app !== "code") window.dispatchEvent(new CustomEvent("v01d-open", { detail: { app: job.app } }));
    if (job.tile) window.dispatchEvent(new Event("v01d-tile"));
  }

  function send() {
    const t = q.trim();
    if (!t) return;
    setQ("");
    setLog((xs) => xs.concat({ who: "you", text: t }));
    ingest(hectorAsk(t));
  }

  async function hx(act: string, extra?: Record<string, string>) {
    const r = await fetch("/api/v1/v01d/hx", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ act, file, body: buf, ...extra }),
    });
    const j = (await r.json()) as { ok?: boolean; note?: string };
    setTerm((xs) => [...xs.slice(-24), j.note || (j.ok ? "ok" : "stopped")]);
    if (act === "git" || act === "save") {
      void fetch("/api/v1/v01d/hx")
        .then((r2) => r2.json())
        .then((g: { git?: string }) => setGit(g.git || git))
        .catch(() => undefined);
    }
  }

  return (
    <div className="hx-ide">
      <header className="hx-bar">
        <img src="/horsemen/icons/hx.png" alt="" />
        <b>SPECTRAL HX</b>
        <em>{crew.length ? `${crew.reduce((a, c) => a + c.n, 0)} ghosts` : "ready"}</em>
        <span className="hx-git" title={git}>
          {git.split("\n")[0]}
        </span>
      </header>
      <div className="hx-work">
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
        <section className="hx-edit">
          <input
            className="hx-file"
            value={file}
            onChange={(e) => setFile(e.target.value)}
            aria-label="File name"
          />
          <textarea
            className="hx-buf"
            value={buf}
            onChange={(e) => setBuf(e.target.value)}
            spellCheck={false}
            aria-label="Editor"
          />
          <div className="hx-tools">
            <button type="button" onClick={() => void hx("save")}>
              Save
            </button>
            <button type="button" onClick={() => void hx("run")}>
              Run
            </button>
            <button type="button" onClick={() => void hx("git", { cmd: "status" })}>
              Git
            </button>
          </div>
          <pre className="hx-term">{term.join("\n")}</pre>
        </section>
        <div className="hx-chat">
          <div className="hx-log" ref={box}>
            {log.map((m, i) => (
              <p key={i} className={m.who === "you" ? "you" : "hx"}>
                {m.jersey ? <span className="hx-tag">{m.jersey}</span> : null}
                {m.text}
              </p>
            ))}
          </div>
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
