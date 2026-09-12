import { LayoutGrid, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { english, USER_FACES } from "@/lib/horsemen/bucky";
import { MENU, meta, type AppId, type Pane, place, tiles } from "@/lib/horsemen/layout";
import { wobble } from "@/lib/horsemen/tqc";
import { boot } from "@/lib/v01d/kernel";
import { AppBody } from "./apps";
import { BuckyBall } from "./ball";
import { ClockNet } from "./clock";
import { Field } from "./field";
import { AskGhost } from "./hector-ask";
import { AppGlyph, DeskIcons } from "./icons";
import { Window } from "./pane";

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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [drop, setDrop] = useState<string | null>(null);
  const [heard, setHeard] = useState("");
  const drag = useRef<{ id: string; dx: number; dy: number; kind: "move" | "resize"; lx: number; ly: number } | null>(null);
  const zTop = useRef(4);

  const space = spaces[desk] ?? spaces[0];
  const panes = space.panes;
  const focus = space.focus;

  const filled = useMemo(
    () => spaces.map((s, i) => (s.panes.some((p) => !p.leaving) ? i : -1)).filter((i) => i >= 0),
    [spaces],
  );
  const hector = Math.min(15, filled.length * 3 + panes.length);
  const line = english(filled, hector, joined || filled.length >= USER_FACES);

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    const onTile = () => snap();
    window.addEventListener("v01d-tile", onTile);
    return () => window.removeEventListener("v01d-tile", onTile);
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

  return (
    <main
      className="relative h-dvh w-full overflow-hidden bg-void text-ash"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerDown={() => setMenu(false)}
    >
      <Field />
      <header className="workspace-bar pane-glass absolute inset-x-0 top-0 z-50 flex h-11 items-center gap-3 rounded-none px-3" onPointerDown={(e) => e.stopPropagation()}>
        <img src="/horsemen/hector.png" alt="Hector the Spectre" className="size-8 object-contain" crossOrigin="anonymous" />
        <p className="hidden font-mono text-[11px] tracking-[0.28em] text-ice uppercase sm:block">OS V01D</p>
        <div className="flex items-center gap-1">
          {spaces.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Desktop ${i + 1}`}
              aria-pressed={desk === i && !expo}
              onClick={() => goDesk(i)}
              className={`ws-radio ${desk === i && !expo ? "on" : ""}`}
            />
          ))}
          <button type="button" aria-label="All desktops" aria-pressed={expo} onClick={() => setExpo((v) => !v)} className={`ws-ball ${expo ? "on" : ""}`} />
        </div>
      </header>
      <div className="absolute top-12 right-3 z-50 flex items-start gap-2">
        <AskGhost
          onJob={(job) => {
            setHeard(job.say);
            if (job.tile) snap();
            if (job.app) open(job.app);
          }}
        />
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
        </div>
      ) : (
        <>
          <DeskIcons onOpen={open} />
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
            Start
          </p>
          <ul className="max-h-[min(52vh,420px)] overflow-auto">
            {MENU.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => open(a.id)} className="start-item flex w-full items-center gap-3 px-3 py-3 text-left">
                  <span className="desk-plate size-11">
                    <AppGlyph id={a.id} className="size-8" />
                  </span>
                  <span>
                    <span className="block text-sm text-uranium">{a.title}</span>
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
        Start
      </button>
    </main>
  );
}
