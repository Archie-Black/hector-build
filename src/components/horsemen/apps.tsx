import { useEffect, useMemo, useState } from "react";
import { Enclave, Riv, VECTORS, hopPort, status } from "@/lib/chimera";
import { hectorEpoch, hectorHop } from "@/lib/hector";
import { LAW, sealed } from "@/lib/hector/unique";
import { CHARTER } from "@/lib/v01d/charter";
import { readIntent } from "@/lib/v01d/intent";
import { ask as hectorAsk } from "@/lib/v01d/ask";
import { plan } from "@/lib/v01d/runtime";
import { split } from "@/lib/hector/cores";
import { say } from "@/lib/v01d/tts";
import type { AppId } from "@/lib/horsemen/layout";
import { GhostWalk } from "./ghostwalk";
import { GhostIT } from "./ghostit";
import { FileGlyph } from "./icons";
import { HxIde } from "./hx-ide";
import { Portal } from "./portal";
import { Crapple } from "./crapple";
import { LinuxRoom } from "./room";
import { Asimov01 } from "./asimov";
import { Suite } from "./suite";
import { SysPanel } from "./sys";

export function AppBody({ app }: { app: AppId }) {
  if (app === "code") return <HxIde />;
  if (app === "terminal") return <Term />;
  if (app === "security") return <Security />;
  if (app === "notes") return <GhostIT />;
  if (app === "files") return <Files start="/v01d/home" />;
  if (app === "programs") return <Files start="/v01d/programs" />;
  if (app === "ghostwalk") return <GhostWalk />;
  if (app === "portal") return <Portal />;
  if (app === "crapple") return <Crapple pane="darwin" />;
  if (app === "unix") return <Crapple pane="unix" />;
  if (app === "helix") return <LinuxRoom start="helix" />;
  if (app === "room") return <LinuxRoom />;
  if (app === "asimov") return <Asimov01 />;
  if (app === "forge") return <Suite start="forge" />;
  if (app === "suite") return <Suite />;
  if (app === "settings") return <Prefs />;
  return <Trash />;
}

function Security() {
  const enc = useMemo(() => new Enclave(new Uint8Array(32).fill(3)), []);
  const riv = useMemo(() => new Riv(), []);
  const [snap, setSnap] = useState(() => status(enc, riv));
  const [note, setNote] = useState("This computer is sealed.");

  useEffect(() => {
    void riv.pin([{ name: "hector", bytes: new TextEncoder().encode("chimera-v1") }]).then(() => setSnap(status(enc, riv)));
  }, [enc, riv]);

  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sm">
      <p className="text-ash">Your work stays on this machine. The lock is on.</p>
      <p className="font-mono text-xs text-ice">
        check {snap.riv} · door {hopPort(snap.epoch)} · {hectorEpoch()}
      </p>
      <div className="flex flex-wrap gap-2">
        {VECTORS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              void hectorHop(v, "heartbeat").then((wire) => {
                setNote(`Checked ${v} in ${wire.wait} ms.`);
                setSnap(status(enc, riv));
              });
            }}
            className="h-11 rounded-lg border border-cobalt px-3 text-ash transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            Check {v}
          </button>
        ))}
      </div>
      <p className="mt-auto text-uranium">{note}</p>
    </div>
  );
}

function Term() {
  const [lines, setLines] = useState<string[]>(["Type a command. Try help."]);
  const [cmd, setCmd] = useState("");

  function run(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (t.toLowerCase() === "clear") {
      setLines([]);
      return;
    }
    setLines((xs) => [...xs.slice(-40), `› ${t}`, ...reply(t)]);
  }

  return (
    <div className="flex h-full flex-col font-mono text-sm">
      <div className="min-h-0 flex-1 overflow-auto p-3 text-ash">
        {lines.map((l, i) => (
          <p key={i} className={l.startsWith("›") ? "text-uranium" : "text-ash"}>
            {l}
          </p>
        ))}
      </div>
      <form
        className="flex border-t border-cobalt/40"
        onSubmit={(e) => {
          e.preventDefault();
          run(cmd);
          setCmd("");
        }}
      >
        <span className="px-3 py-2 text-uranium">›</span>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          className="h-12 min-w-0 flex-1 bg-transparent text-ash outline-none"
          aria-label="Command"
          autoComplete="off"
        />
      </form>
    </div>
  );
}

function reply(t: string): string[] {
  const k = t.toLowerCase();
  if (k === "help") return ["arrange — line up open windows", "clear — wipe this screen", "who", "law", "run <file>"];
  if (k === "who") return ["Hector. Spectral HX. OS V01D."];
  if (k === "law") return [LAW.text, CHARTER.text, sealed() ? "Sealed." : "Burning."];
  if (k.startsWith("run ")) {
    const file = t.slice(4).trim();
    const intent = readIntent({ tool: file, prompt: t });
    if (intent.stance === "deny") return [intent.why];
    if (intent.stance === "range") return [intent.why, "The Range is the sandbox. Nothing leaves."];
    const go = plan(file);
    return [go.note, go.how];
  }
  if (k === "arrange") {
    window.dispatchEvent(new Event("v01d-tile"));
    return ["Windows lined up."];
  }
  return [`I don't know “${t}”. Try help.`];
}

function Files({ start = "/v01d/home" }: { start?: string }) {
  const [at, setAt] = useState(start);
  const [items, setItems] = useState<{ name: string; dir: boolean; native: string; kind: string; path: string; run?: string }[]>([]);
  const [shares, setShares] = useState<{ name: string; unc: string; smb: string }[]>([]);
  const [q, setQ] = useState("");
  const [heard, setHeard] = useState("");
  useEffect(() => {
    void fetch(`/api/v1/v01d/fs?at=${encodeURIComponent(at)}`)
      .then((r) => r.json())
      .then((j: { items: typeof items }) => setItems((j.items || []).filter((it) => !/\.ghstkrt$/i.test(it.name))));
  }, [at]);
  useEffect(() => {
    void fetch("/api/v1/v01d/share")
      .then((r) => r.json())
      .then((j: { shares: typeof shares }) => setShares(j.shares || []));
  }, []);
  const rooms = [
    { label: "Home", path: "/v01d/home" },
    { label: "Programs", path: "/v01d/programs" },
    { label: "Shared", path: "/v01d/shared" },
  ];
  const here = rooms.find((r) => r.path === at)?.label || items[0]?.native || "Home";
  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-cobalt/25 p-2">
        {rooms.map((r) => (
          <button
            key={r.path}
            type="button"
            onClick={() => setAt(r.path)}
            className={`h-9 rounded-lg px-3 text-xs ${at === r.path ? "bg-cobalt/40 text-ash" : "text-steel"}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <ul className="min-h-0 flex-1 overflow-auto p-3">
        {items.map((it) => (
          <li key={it.path}>
            <button
              type="button"
              className="flex h-12 w-full items-center gap-3 border-b border-cobalt/20 px-2 text-left text-sm"
              onClick={() => {
                if (it.dir) setAt(it.path);
                else {
                  void fetch("/api/v1/v01d/run", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ file: it.run || it.name, prompt: `open ${it.name}` }),
                  }).then(async (r) => {
                    const j = (await r.json()) as { ok?: boolean; launch?: { note?: string } };
                    setHeard(j.launch?.note || (j.ok ? `Opening ${it.name}.` : "Stopped."));
                  });
                }
              }}
            >
              <FileGlyph />
              <span className="flex-1 text-ash">{it.name}</span>
              <span className="text-[11px] text-steel">{it.native}</span>
            </button>
          </li>
        ))}
      </ul>
      {at.includes("shared") ? (
        <ul className="border-t border-cobalt/25 px-3 py-2 text-xs text-steel">
          {shares.map((s) => (
            <li key={s.unc} className="flex justify-between gap-2 py-1">
              <span className="text-ash">{s.name}</span>
              <span className="font-mono">{s.unc}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <form
        className="flex items-center gap-2 border-t border-cobalt/25 px-2"
        onSubmit={(e) => {
          e.preventDefault();
          const job = hectorAsk(`${q} in ${here}`);
          setHeard(job.say);
          if (job.voice && job.voice !== "silent" && split(`${q} in ${here}`).core === "diplomat") say(job.say);
          if (job.app === "programs") setAt("/v01d/programs");
          if (/\b(share|picture|photo|media)\b/i.test(q)) setAt("/v01d/shared");
          if (/\b(home|document|download)\b/i.test(q)) setAt("/v01d/home");
          setQ("");
        }}
      >
        <img src="/horsemen/hector.png" alt="" className="size-6 object-contain" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask Hector in this folder"
          aria-label="Ask Hector in this folder"
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-ash outline-none placeholder:text-steel"
        />
        {heard ? <span className="hidden max-w-[10rem] truncate text-[10px] text-uranium sm:inline">{heard}</span> : null}
      </form>
    </div>
  );
}

function Prefs() {
  return (
    <div className="sys-page">
      <SysPanel />
    </div>
  );
}

function Trash() {
  return (
    <div className="p-4 text-sm text-steel">
      Trash is empty. Closed windows are gone. Documents you save stay in Files.
    </div>
  );
}
