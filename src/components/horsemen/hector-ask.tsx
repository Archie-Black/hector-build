import { useEffect, useRef, useState } from "react";
import { ask as hectorAsk } from "@/lib/v01d/ask";
import { search, type Hit } from "@/lib/v01d/search";
import { prefer, setPrefer } from "@/lib/v01d/inquisitor";
import { hatSrc, load, save, SHOW, type Hat, type Skin } from "@/lib/v01d/skin";

export function AskGhost({
  onJob,
}: {
  onJob: (job: ReturnType<typeof hectorAsk>) => void;
}) {
  const [skin, setSkin] = useState<Skin>(load);
  const [open, setOpen] = useState(false);
  const [dress, setDress] = useState(false);

  useEffect(() => {
    setSkin(load());
  }, [open, dress]);

  return (
    <>
      <button
        type="button"
        aria-label="Search this computer and the web"
        className="ask-ghost"
        style={{ filter: `hue-rotate(${skin.hue}deg)` }}
        onClick={() => setOpen(true)}
        onContextMenu={(e) => {
          e.preventDefault();
          setDress(true);
        }}
      >
        <img src="/horsemen/hector-ask.png" alt="" className="ask-ghost-body" />
        {skin.hat !== "none" ? <img src={hatSrc(skin.hat)} alt="" className="ask-ghost-hat" /> : null}
      </button>
      {open ? (
        <HectorSearch
          skin={skin}
          onClose={() => setOpen(false)}
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

function pick(h: Hit, onJob: (job: ReturnType<typeof hectorAsk>) => void) {
  if (h.where === "web" && h.url) {
    try {
      sessionStorage.setItem("v01d.walk", h.url);
    } catch {
      /* */
    }
    window.dispatchEvent(new CustomEvent("v01d-walk", { detail: { q: h.url } }));
    onJob({ app: "ghostwalk", say: h.blurb });
    return;
  }
  if (h.run && !h.app) {
    void fetch("/api/v1/v01d/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: h.run, prompt: `open ${h.title}` }),
    });
    onJob({ say: `Opening ${h.title}.` });
    return;
  }
  if (h.app) onJob({ app: h.app, say: h.blurb });
}

function HectorSearch({
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
  const hits = search(q);
  const box = useRef<HTMLInputElement>(null);
  useEffect(() => {
    box.current?.focus();
  }, []);

  function go(h?: Hit) {
    const t = q.trim();
    if (h) {
      pick(h, onJob);
      onClose();
      return;
    }
    if (!t) return;
    const web = hits.web[0];
    const sys = hits.system[0];
    pick(sys && (!web || sys.title.toLowerCase().includes(t.toLowerCase())) ? sys : web || sys!, onJob);
    onClose();
  }

  return (
    <div className="hector-chat pane-glass hector-search" onPointerDown={(e) => e.stopPropagation()}>
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
      <form
        className="flex border-b border-cobalt/40"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <input
          ref={box}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-ash outline-none"
          placeholder="Search this computer or the web"
          aria-label="Search this computer or the web"
        />
      </form>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-2 text-sm">
        {!q.trim() ? <p className="text-steel">Programs, files, settings. The web through GhostWalk.</p> : null}
        {hits.system.length ? (
          <p className="mb-1 mt-1 text-[10px] tracking-[0.16em] text-ice uppercase">This computer</p>
        ) : null}
        {hits.system.map((h) => (
          <button key={h.id} type="button" className="hector-hit" onClick={() => go(h)}>
            <b>{h.title}</b>
            <span>{h.blurb}</span>
          </button>
        ))}
        {hits.web.length ? (
          <p className="mb-1 mt-2 text-[10px] tracking-[0.16em] text-ice uppercase">Web</p>
        ) : null}
        {hits.web.map((h) => (
          <button key={h.id} type="button" className="hector-hit web" onClick={() => go(h)}>
            <b>{h.title}</b>
            <span>{h.blurb}</span>
          </button>
        ))}
      </div>
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
        <select className="ml-2 bg-transparent text-uranium" defaultValue={prefer()} onChange={(e) => setPrefer(e.target.value)}>
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
