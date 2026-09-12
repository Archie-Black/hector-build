import { useEffect, useRef, useState } from "react";
import { ask as hectorAsk } from "@/lib/v01d/ask";
import { prefer, setPrefer } from "@/lib/v01d/inquisitor";
import { hatSrc, load, save, SHOW, type Hat, type Skin } from "@/lib/v01d/skin";
import { play, speak } from "@/lib/v01d/voice/speak";

type Note = { who: "you" | "hector"; text: string };

export function AskGhost({
  onJob,
}: {
  onJob: (job: ReturnType<typeof hectorAsk>) => void;
}) {
  const [skin, setSkin] = useState<Skin>(load);
  const [chat, setChat] = useState(false);
  const [dress, setDress] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    setSkin(load());
  }, [chat, dress]);

  return (
    <>
      <button
        type="button"
        aria-label="Ask Hector"
        className="ask-ghost"
        style={{ filter: `hue-rotate(${skin.hue}deg)` }}
        onClick={() => {
          const n = Date.now();
          if (n - last.current < 380) setChat(true);
          last.current = n;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setDress(true);
        }}
      >
        <img src="/horsemen/hector-ask.png" alt="" className="ask-ghost-body" />
        {skin.hat !== "none" ? <img src={hatSrc(skin.hat)} alt="" className="ask-ghost-hat" /> : null}
      </button>
      {chat ? (
        <HectorChat
          skin={skin}
          onClose={() => setChat(false)}
          onDress={() => setDress(true)}
          onJob={onJob}
        />
      ) : null}
      {dress ? (
        <Dress
          skin={skin}
          onSave={(s) => {
            setSkin(save(s));
            setDress(false);
          }}
          onClose={() => setDress(false)}
        />
      ) : null}
    </>
  );
}

function HectorChat({
  skin,
  onClose,
  onDress,
  onJob,
}: {
  skin: Skin;
  onClose: () => void;
  onDress: () => void;
  onJob: (job: ReturnType<typeof hectorAsk>) => void;
}) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<Note[]>([{ who: "hector", text: "Ask. I will not narrate the whole job." }]);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo(0, box.current.scrollHeight);
  }, [log]);
  return (
    <div className="hector-chat pane-glass" onPointerDown={(e) => e.stopPropagation()}>
      <header className="flex items-center gap-2 border-b border-cobalt/40 px-3 py-2">
        <img src="/horsemen/hector-ask.png" alt="" className="size-8 object-contain" style={{ filter: `hue-rotate(${skin.hue}deg)` }} />
        <p className="flex-1 text-sm text-uranium">{skin.name || "Hector"}</p>
        <button type="button" className="text-xs text-ice" onClick={onDress}>
          Dress
        </button>
        <button type="button" className="text-xs text-steel" onClick={onClose}>
          Close
        </button>
      </header>
      <div ref={box} className="min-h-0 flex-1 overflow-auto px-3 py-2 text-sm">
        {log.map((n, i) => (
          <p key={i} className={n.who === "you" ? "text-ash" : "text-uranium"}>
            {n.text}
          </p>
        ))}
      </div>
      <form
        className="flex border-t border-cobalt/40"
        onSubmit={(e) => {
          e.preventDefault();
          const t = q.trim();
          if (!t) return;
          const job = hectorAsk(t);
          setLog((l) => [...l, { who: "you", text: t }, { who: "hector", text: job.say }]);
          if (job.voice && job.voice !== "silent") play(speak(job.say).pcm);
          onJob(job);
          setQ("");
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-ash outline-none"
          placeholder="Tell Hector"
          aria-label="Tell Hector"
        />
      </form>
    </div>
  );
}

function Dress({ skin, onSave, onClose }: { skin: Skin; onSave: (s: Skin) => void; onClose: () => void }) {
  const [s, setS] = useState(skin);
  const hats: Hat[] = ["none", "fedora", "toque"];
  return (
    <div className="hector-dress pane-glass p-3" onPointerDown={(e) => e.stopPropagation()}>
      <p className="text-xs tracking-[0.2em] text-uranium uppercase">Your Hector</p>
      <div className="relative mx-auto my-3 size-28">
        <img src="/horsemen/hector-ask.png" alt="" className="size-28 object-contain" style={{ filter: `hue-rotate(${s.hue}deg)` }} />
        {s.hat !== "none" ? <img src={hatSrc(s.hat)} alt="" className="ask-ghost-hat" /> : null}
      </div>
      <input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} className="mb-2 h-10 w-full bg-transparent text-sm text-ash outline-none" aria-label="Name" />
      <input type="range" min={0} max={360} value={s.hue} onChange={(e) => setS({ ...s, hue: Number(e.target.value) })} className="w-full" aria-label="Color" />
      <div className="mt-2 flex gap-2">
        {hats.map((h) => (
          <button key={h} type="button" onClick={() => setS({ ...s, hat: h })} className={`rounded-lg px-2 py-1 text-xs ${s.hat === h ? "bg-cobalt/40 text-uranium" : "text-ice"}`}>
            {h}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[10px] tracking-[0.2em] text-ice uppercase">Show off</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {SHOW.map((p) => (
          <button key={p.name} type="button" onClick={() => setS(p)} className="text-xs text-ash hover:text-uranium">
            {p.name}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-xs text-steel">
        Language
        <select
          className="ml-2 bg-transparent text-uranium"
          defaultValue={prefer()}
          onChange={(e) => setPrefer(e.target.value)}
        >
          {["en", "es", "fr", "de", "zh", "ja", "ar", "ru"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3 flex gap-2">
        <button type="button" className="text-sm text-uranium" onClick={() => onSave(s)}>
          Save
        </button>
        <button type="button" className="text-sm text-steel" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
