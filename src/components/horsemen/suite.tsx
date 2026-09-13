import { useState } from "react";
import { Forge } from "./forge";
import { MetaHuman } from "./metahuman";
import {
  FILTERS,
  FLOORS,
  LOOKS,
  PODS,
  STREAMS,
  SUITE,
  onFloor,
  streamCmd,
  type Floor,
} from "@/lib/hx/suite";

export function Suite({ start = "photo" }: { start?: Floor }) {
  const [floor, setFloor] = useState<Floor>(start);
  const [look, setLook] = useState("void");
  const [note, setNote] = useState<string>(SUITE.note);
  const [live, setLive] = useState(STREAMS[0]!.id);
  const [pod, setPod] = useState(PODS[1]!.id);
  const tools = onFloor(floor);
  const filters = FILTERS.filter((f) => f.floor === floor);

  async function open(bin: string, extra?: string[]) {
    const r = await fetch("/api/v1/v01d/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: bin, prompt: `open ${[bin, ...(extra || [])].join(" ")}` }),
    });
    const j = (await r.json()) as { ok?: boolean; intent?: { why?: string } };
    setNote(j.ok ? `Opening ${bin}.` : j.intent?.why || "Stopped.");
  }

  return (
    <div className={`genesis look-${look}`}>
      <header className="genesis-bar">
        <b>Genesis HX Suite</b>
        <em>local · unlimited on this box</em>
      </header>
      <nav className="genesis-floors" aria-label="Floors">
        {FLOORS.map((f) => (
          <button key={f.id} type="button" className={floor === f.id ? "on" : ""} onClick={() => setFloor(f.id)}>
            {f.title}
          </button>
        ))}
      </nav>
      <p className="genesis-blurb">{FLOORS.find((f) => f.id === floor)?.blurb}</p>
      <div className="genesis-grid">
        {tools.map((t) => (
          <button key={t.id} type="button" className="genesis-card" onClick={() => void open(t.bin)}>
            <strong>{t.title}</strong>
            <span>{t.job}</span>
          </button>
        ))}
      </div>
      {filters.length ? (
        <section className="genesis-tools">
          <p>Filters & tools</p>
          <ul>
            {filters.map((f) => (
              <li key={f.id}>
                <b>{f.name}</b>
                <span>{f.how}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {floor === "forge" ? <Forge /> : null}
      {floor === "world" ? <MetaHuman /> : null}
      {floor === "live" ? (
        <section className="genesis-tools">
          <p>Streaming desks</p>
          <div className="genesis-pills">
            {STREAMS.map((s) => (
              <button key={s.id} type="button" className={live === s.id ? "on" : ""} onClick={() => setLive(s.id)}>
                {s.name} · {s.w}×{s.h} @{s.fps}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="genesis-go"
            onClick={() => {
              const s = STREAMS.find((x) => x.id === live)!;
              setNote(`${s.name}. ${s.w}×${s.h} ${s.fps} fps ${s.kbps} kbps. Scene ${s.scene}.`);
              void open("obs", streamCmd(s.id).slice(1));
            }}
          >
            Go live
          </button>
        </section>
      ) : null}
      {floor === "sound" ? (
        <section className="genesis-tools">
          <p>Podcast desks</p>
          <div className="genesis-pills">
            {PODS.map((p) => (
              <button key={p.id} type="button" className={pod === p.id ? "on" : ""} onClick={() => setPod(p.id)}>
                {p.name} · {p.rate / 1000} kHz
              </button>
            ))}
          </div>
          <p className="genesis-note">{PODS.find((p) => p.id === pod)?.note}</p>
          <button
            type="button"
            className="genesis-go"
            onClick={() => {
              const p = PODS.find((x) => x.id === pod)!;
              setNote(`${p.name}. ${p.rate} Hz, ${p.ch} ch, ${p.bits}-bit. Opening Audacity.`);
              void open("audacity");
            }}
          >
            Open the desk
          </button>
        </section>
      ) : null}
      <footer className="genesis-look">
        <span>Look</span>
        {LOOKS.map((l) => (
          <button key={l.id} type="button" className={look === l.id ? "on" : ""} onClick={() => setLook(l.id)} title={l.note}>
            {l.name}
          </button>
        ))}
        <em>{note}</em>
      </footer>
    </div>
  );
}
