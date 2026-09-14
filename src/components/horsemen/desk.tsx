import { LayoutGrid, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { english, USER_FACES } from "@/lib/horsemen/bucky";
import { MENU, meta, type AppId, type Pane, place, tiles } from "@/lib/horsemen/layout";
import { wobble } from "@/lib/horsemen/tqc";
import { boot } from "@/lib/v01d/kernel";
import { bootSound, unlock } from "@/lib/v01d/sound";
import { warm } from "@/lib/v01d/tts";
import { opening, parked, seenOpen } from "@/lib/v01d/overture";
import { load, type Profile } from "@/lib/v01d/comfort";
import { bootFeel } from "@/lib/v01d/feel";
import { face } from "@/lib/v01d/comfort";
import { ask as hectorAsk } from "@/lib/v01d/ask";
import { Welcome } from "./welcome";
import { AppBody } from "./apps";
import { BuckyBall } from "./ball";
import { ClockNet } from "./clock";
import { VoidField } from "./void-field";
import { VoidOpen } from "./void-open";
import { VoidMark } from "./void-logo";
import { SysFab } from "./sys";
import { VoidRing } from "./void-ring";
import { AskGhost } from "./hector-ask";
import { AppGlyph } from "./icons";
import { Window } from "./pane";
import { loadWeave, pinDesks, joinBuild, type Weave } from "@/lib/v01d/weave";
import { requestAlerts, requestSite } from "@/lib/v01d/cloud";
import { WeaveDock } from "./weave";

type Space = { panes: Pane[]; focus: string | null };

function empty(): Space[] {
  return Array.from({ length: USER_FACES }, () => ({ panes: [], focus: null }));
}

export function HorsemenDesk() {
  const [spaces, setSpaces] = useState<Space[]>(empty);
  const [desk, setDesk] = useState(0);
  const [expo, setExpo] = useState(false);
  const [menu, setMenu] = useState(false);
  const [joined, setJoined] = useState(false);
  const [loom, setLoom] = useState<Weave>(() => loadWeave());
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [drop, setDrop] = useState<string | null>(null);
  const [heard, setHeard] = useState("");
  const [who, setWho] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [overture, setOverture] = useState(() => !seenOpen());
  const [mark, setMark] = useState(() => (seenOpen() ? parked() : opening(0)));
  const drag = useRef<{ id: string; dx: number; dy: number; kind: "move" | "resize"; lx: number; ly: number } | null>(null);
  const zTop = useRef(40);

  const space = spaces[desk] ?? spaces[0];
  const panes = space.panes;
  const focus = space.focus;

  const filled = useMemo(
    () => spaces.map((s, i) => (s.panes.some((p) => !p.leaving) ? i : -1)).filter((i) => i >= 0),
    [spaces],
  );
  const hector = Math.min(15, filled.length * 3 + panes.length);
  const line = loom.join?.note || english(filled, hector, joined || filled.length >= USER_FACES);

  useEffect(() => {
    setLoom(pinDesks(spaces));
  }, [spaces]);

  useEffect(() => {
    boot();
    bootFeel();
    bootSound();
    warm();
    setWho(load());
    setReady(true);
  }, []);

  useEffect(() => {
    const onFeel = () => {
      setWho(null);
    };
    window.addEventListener("v01d-comfort", onFeel);
    return () => window.removeEventListener("v01d-comfort", onFeel);
  }, []);

  useEffect(() => {
    const onTile = () => snap();
    window.addEventListener("v01d-tile", onTile);
    const onOpen = (e: Event) => {
      const app = (e as CustomEvent<{ app?: AppId }>).detail?.app;
      if (app) open(app);
    };
    window.addEventListener("v01d-open", onOpen);
    return () => {
      window.removeEventListener("v01d-tile", onTile);
      window.removeEventListener("v01d-open", onOpen);
    };
  }, [desk]);

  useEffect(() => {
    if (filled.length >= USER_FACES) setJoined(true);
  }, [filled.length]);

  function patch(fn: (s: Space) => Space) {
    setSpaces((xs) => xs.map((s, i) => (i === desk ? fn(s) : s)));
  }

  function bump(id: string) {
    zTop.current += 1;
    patch((s) => ({
      focus: id,
      panes: s.panes.map((p) => (p.id === id ? { ...p, z: zTop.current, hidden: false } : p)),
    }));
  }

  function snap() {
    setMenu(false);
    patch((s) => {
      const ids = s.panes.filter((p) => !p.leaving && !p.hidden).map((p) => p.app);
      const slots = tiles(window.innerWidth, window.innerHeight, ids);
      return { ...s, panes: s.panes.map((p) => (slots[p.app] ? { ...p, rect: slots[p.app], max: false, hidden: false } : p)) };
    });
  }

  function open(app: AppId) {
    setMenu(false);
    setExpo(false);
    void fetch("/api/v1/v01d/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: app, prompt: `open ${app}` }),
    }).catch(() => undefined);
    const existing = panes.find((p) => p.app === app && !p.leaving);
    if (existing) {
      bump(existing.id);
      return;
    }
    zTop.current += 1;
    const m = meta(app);
    const next: Pane = {
      id: `${app}-${Date.now()}`,
      app,
      title: m.title,
      rect: place(window.innerWidth, window.innerHeight),
      z: zTop.current,
      leaving: false,
      max: false,
      hidden: false,
    };
    patch((s) => ({ focus: next.id, panes: [...s.panes.filter((p) => !p.leaving), next] }));
  }

  function onHector(job: ReturnType<typeof hectorAsk>) {
    setHeard(job.say);
    if (job.tile) snap();
    if (job.run === "join") {
      const w = joinBuild();
      setLoom(w);
      setJoined(true);
      setExpo(true);
      void fetch("/api/v1/v01d/weave", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ act: "join" }),
      }).catch(() => undefined);
    }
    if (job.run === "fabric-heal") void requestSite("repair");
    if (job.run === "site-scale") void requestSite("scale");
    if (job.run === "site-roll") void requestSite("roll");
    if (job.run === "site-backup") void requestSite("backup");
    if (job.run === "site-restore") void requestSite("restore");
    if (job.run === "site-mesh") void requestSite("mesh");
    if (job.run === "site-alerts") void requestAlerts();
    if (job.run === "downloads") {
      try {
        sessionStorage.setItem("v01d.fs.at", "/v01d/home/Downloads");
      } catch {
        /* */
      }
    }
    if (job.app === "code") {
      try {
        sessionStorage.setItem("v01d.hx.task", JSON.stringify(job));
      } catch {
        /* */
      }
      window.dispatchEvent(new CustomEvent("v01d-hx-task", { detail: job }));
    }
    if (job.app) open(job.app);
  }

  function close(id: string) {
    patch((s) => ({ ...s, panes: s.panes.map((p) => (p.id === id ? { ...p, leaving: true } : p)) }));
    window.setTimeout(() => {
      patch((s) => ({ ...s, panes: s.panes.filter((p) => p.id !== id) }));
    }, 220);
  }

  function onDown(id: string, kind: "move" | "resize", e: PointerEvent) {
    e.stopPropagation();
    const p = panes.find((x) => x.id === id);
    if (!p || p.max) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    bump(id);
    drag.current = { id, kind, dx: kind === "move" ? e.clientX - p.rect.x : p.rect.w - e.clientX, dy: kind === "move" ? e.clientY - p.rect.y : p.rect.h - e.clientY, lx: e.clientX, ly: e.clientY };
  }

  function onMove(e: PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const vx = e.clientX - d.lx;
    const vy = e.clientY - d.ly;
    setTilt(wobble(vx, vy));
    d.lx = e.clientX;
    d.ly = e.clientY;
    patch((s) => ({
      ...s,
      panes: s.panes.map((p) => {
        if (p.id !== d.id) return p;
        if (d.kind === "move") return { ...p, rect: { ...p.rect, x: e.clientX - d.dx, y: Math.max(56, e.clientY - d.dy) } };
        return { ...p, rect: { ...p.rect, w: Math.max(300, e.clientX + d.dx), h: Math.max(200, e.clientY + d.dy) } };
      }),
    }));
  }

  function onUp() {
    if (drag.current) {
      setDrop(drag.current.id);
      window.setTimeout(() => setDrop(null), 420);
    }
    drag.current = null;
    setTilt({ x: 0, y: 0 });
  }

  function goDesk(i: number) {
    if (i === desk && !expo) {
      setExpo(true);
      return;
    }
    setExpo(false);
    setDesk(i);
  }

  const living = panes.filter((p) => !p.leaving);
  const names = who ? face(who) : null;

  if (ready && !who) {
    return <Welcome onDone={(p) => setWho(p)} />;
  }

  return (
    <main
      className={`relative h-dvh w-full overflow-hidden bg-void text-ash ${who?.desk === "work" ? "desk-work" : "desk-play"} ${overture ? "desk-overture" : ""}`}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerDown={() => {
        setMenu(false);
        unlock();
      }}
    >
      <VoidField quiet={who?.desk === "work"} />
      {overture ? (
        <VoidOpen
          onTick={setMark}
          onDone={() => {
            setMark(parked());
            setOverture(false);
          }}
        />
      ) : null}
      {overture ? null : <VoidMark top={mark.top} scale={mark.scale} opacity={1} />}
      <SysFab />
      <header className="workspace-bar pane-glass absolute inset-x-0 top-0 z-50 flex items-center gap-3 rounded-none px-3" onPointerDown={(e) => e.stopPropagation()}>
        <div className="ws-pack">
          <div className="flex items-center gap-1">
            {spaces.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Workspace ${i + 1}`}
                aria-pressed={desk === i && !expo}
                onClick={() => goDesk(i)}
                className={`ws-radio ${desk === i && !expo ? "on" : ""}`}
              />
            ))}
            <button type="button" aria-label="All workspaces" aria-pressed={expo} onClick={() => setExpo((v) => !v)} className={`ws-ball ${expo ? "on" : ""}`} />
          </div>
          <span className="ws-label">workspaces</span>
        </div>
      </header>
      <div className="absolute top-12 right-3 z-50 flex items-start gap-2">
        <AskGhost onJob={onHector} />
        <ClockNet onSettings={() => open("settings")} />
      </div>

      {expo ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pt-14 pb-20 expo-veil">
          <BuckyBall
            filled={filled}
            hector={hector}
            onPick={(i) => {
              setDesk(i);
              setExpo(false);
            }}
          />
          <p className="mt-4 max-w-lg px-6 text-center text-sm leading-relaxed text-ash">{line}</p>
          <WeaveDock
            weave={loom}
            onJoin={(w) => {
              setLoom(w);
              setJoined(true);
            }}
          />
        </div>
      ) : (
        <>
          <VoidRing onOpen={open} desk={who?.desk ?? "play"} />
          {living
            .filter((p) => !p.hidden)
            .map((p) => (
              <Window
                key={p.id}
                pane={p}
                focused={focus === p.id}
                tilt={focus === p.id ? tilt : { x: 0, y: 0 }}
                dropping={drop === p.id}
                onFocus={() => bump(p.id)}
                onClose={() => close(p.id)}
                onMax={() => patch((s) => ({ ...s, panes: s.panes.map((x) => (x.id === p.id ? { ...x, max: !x.max } : x)) }))}
                onMin={() => patch((s) => ({ ...s, panes: s.panes.map((x) => (x.id === p.id ? { ...x, hidden: true } : x)) }))}
                onDown={(e) => onDown(p.id, "move", e)}
                onResize={(e) => onDown(p.id, "resize", e)}
              >
                <AppBody app={p.app} />
              </Window>
            ))}
        </>
      )}

      {menu ? (
        <div className="start-menu absolute bottom-[4.75rem] left-3 z-50 w-[min(380px,calc(100%-24px))] p-3" onPointerDown={(e) => e.stopPropagation()}>
          <p className="flex items-center gap-2 px-2 pb-2 text-xs tracking-[0.28em] text-uranium uppercase">
            <img src="/horsemen/hector.png" alt="" className="size-5 object-contain" crossOrigin="anonymous" />
            {names?.start ?? "Start"}
          </p>
          <ul className="max-h-[min(52vh,420px)] overflow-auto">
            {MENU.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => open(a.id)} className="start-item flex w-full items-center gap-3 px-3 py-3 text-left">
                  <span className="desk-plate size-11">
                    <AppGlyph id={a.id} className="size-8" />
                  </span>
                  <span>
                    <span className="block text-sm text-uranium">{a.id === "files" ? names?.files ?? a.title : a.id === "room" ? names?.linux ?? a.title : a.title}</span>
                    <span className="block text-xs text-ice/80">{a.blurb}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={snap} className="start-item mt-1 flex h-12 w-full items-center gap-3 px-3 text-left">
            <LayoutGrid className="size-5 text-uranium" />
            <span>
              <span className="block text-sm text-uranium">Arrange windows</span>
              <span className="block text-xs text-ice/80">Line them up so nothing is lost.</span>
            </span>
          </button>
          <button type="button" onClick={() => open("settings")} className="start-item mt-1 flex h-14 w-full items-center gap-3 border-t border-cobalt/40 px-3 pt-3 text-left">
            <Settings className="size-5 text-uranium" />
            <span>
              <span className="block text-sm text-uranium">Settings</span>
              <span className="block text-xs text-ice/80">Sound, network, and how this computer feels.</span>
            </span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMenu((v) => !v)}
        onPointerDown={(e) => e.stopPropagation()}
        className="start-btn absolute bottom-3 left-3 z-50 flex h-14 items-center gap-2 px-4"
      >
        <img src="/horsemen/hector.png" alt="" className="size-8 object-contain" crossOrigin="anonymous" />
        {names?.start ?? "Start"}
      </button>
    </main>
  );
}
