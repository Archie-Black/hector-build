import { useEffect, useState } from "react";
import { engines, loadTts, saveTts, say, using, voices, type Kind } from "@/lib/v01d/tts";

export function VoicePrefs() {
  const [pref, setPref] = useState(loadTts);
  const [now, setNow] = useState(using);
  const [list, setList] = useState(() => voices());
  useEffect(() => {
    const id = window.setInterval(() => {
      setList(voices());
      setNow(using());
    }, 800);
    return () => window.clearInterval(id);
  }, []);
  function put(engine: Kind) {
    const next = { ...pref, engine };
    saveTts(next);
    setPref(next);
    setNow(using());
  }
  return (
    <section className="rounded-xl border border-cobalt/40 bg-void/40 p-3">
      <p className="font-mono text-[10px] tracking-[0.2em] text-uranium uppercase">Voice</p>
      <p className="mt-2 text-sm text-ash">Advanced TTS. Studio is the host. Paul is baked. Auto picks the better one.</p>
      <p className="mt-1 text-xs text-steel">Now speaking with {now}.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {engines().map((e) => (
          <button
            key={e.id}
            type="button"
            disabled={!e.ready && e.id === "studio"}
            onClick={() => put(e.id)}
            className={`h-10 rounded-lg px-3 text-xs ${pref.engine === e.id ? "bg-cobalt/40 text-uranium" : "border border-cobalt/40 text-ash"}`}
          >
            {e.id}
          </button>
        ))}
        <button
          type="button"
          className="h-10 rounded-lg border border-cobalt/40 px-3 text-xs text-ash"
          onClick={() => say("I am Hector. Welcome to OS VOID.")}
        >
          Test
        </button>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-steel">
        {engines().map((e) => (
          <li key={e.id}>
            {e.id}
            {e.ready ? " · on" : " · waiting"} — {e.note}
          </li>
        ))}
      </ul>
      {list.length ? (
        <p className="mt-2 text-[11px] text-steel">Studio mouths: {list.slice(0, 4).map((v) => v.name).join(" · ")}</p>
      ) : null}
    </section>
  );
}
