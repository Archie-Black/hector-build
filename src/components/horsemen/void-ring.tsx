import { useEffect, useMemo, useRef, useState } from "react";
import { APPS, type AppId } from "@/lib/horsemen/layout";
import { aim, carousel, lift, nearest } from "@/lib/v01d/void";
import { feel } from "@/lib/v01d/nerves";
import { ICON } from "./icons";

type Slot = { key: string; title: string; blurb: string; src: string; app?: AppId; href?: string };

function slots(): Slot[] {
  const desk: Slot[] = APPS.filter((a) => a.desk).map((a) => ({
    key: a.id,
    title: a.title,
    blurb: a.blurb,
    src: ICON[a.id],
    app: a.id,
  }));
  desk.push({
    key: "doomchat",
    title: "DooMChaT",
    blurb: "Your house. doomchat.ca · y.doomchat.ca",
    src: "/horsemen/icons/doomchat.png",
    href: "https://y.doomchat.ca",
  });
  return desk;
}

function pose(el: HTMLElement, n: number, i: number, rot: number, armed: boolean, on: boolean) {
  const c = carousel(n, i, rot);
  el.style.transform = `translate3d(${c.x}px, ${Math.sin(c.th) * 8}px, ${c.z}px) rotateY(${c.yaw}deg) scale(${lift(c.scale, armed, on)})`;
  el.style.zIndex = String(10 + ((c.depth * 40) | 0));
  el.style.opacity = String(0.38 + c.depth * 0.62);
  el.classList.toggle("on", on);
}

export function VoidRing({ onOpen, desk = "play" }: { onOpen: (id: AppId) => void; desk?: "play" | "work" }) {
  const items = useMemo(() => slots().filter((s) => desk === "play" || s.app !== "portal"), [desk]);
  const n = items.length;
  const [grab, setGrab] = useState(false);
  const [armed, setArmed] = useState(false);
  const want = useRef<number | null>(null);
  const live = useRef(0);
  const drag = useRef<{ x: number; rot: number } | null>(null);
  const moved = useRef(false);
  const hold = useRef(false);
  const bodies = useRef<(HTMLButtonElement | null)[]>([]);
  const lastHit = useRef(0);

  function paint(r: number) {
    const armedNow = hold.current;
    const f = nearest(n, r);
    for (let i = 0; i < n; i++) {
      const el = bodies.current[i];
      if (el) pose(el, n, i, r, armedNow, armedNow && i === f.i);
    }
    if (f.i !== lastHit.current) {
      lastHit.current = f.i;
    }
  }

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let id = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      let r = live.current;
      let dirty = false;
      if (want.current !== null && !drag.current) {
        let d = want.current - r;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        r += d * Math.min(1, dt / 220);
        if (Math.abs(d) < 0.008) {
          r = want.current;
          want.current = null;
        }
        live.current = r;
        dirty = true;
      } else if (!hold.current && !reduce && !drag.current) {
        r += dt * 0.00018;
        live.current = r;
        dirty = true;
      } else if (drag.current) {
        dirty = true;
      }
      if (dirty) paint(r);
      id = requestAnimationFrame(loop);
    };
    paint(live.current);
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Enter" && e.key !== "Escape") return;
      e.preventDefault();
      if (e.key === "Escape") {
        rest();
        return;
      }
      arm();
      const f = nearest(n, live.current);
      if (e.key === "ArrowRight") {
        const i = (f.i + 1) % n;
        want.current = aim(n, i);
        lastHit.current = i;
      } else if (e.key === "ArrowLeft") {
        const i = (f.i + n - 1) % n;
        want.current = aim(n, i);
        lastHit.current = i;
      } else if (e.key === "Enter") {
        go(items[f.i]!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, n, onOpen]);

  function arm() {
    hold.current = true;
    setArmed(true);
    paint(live.current);
  }

  function rest() {
    hold.current = false;
    drag.current = null;
    want.current = null;
    setArmed(false);
    setGrab(false);
    paint(live.current);
  }

  function go(s: Slot) {
    feel("somatic", s.app || "desk", s.title);
    if (s.app) onOpen(s.app);
    else if (s.href) window.open(s.href, "_blank", "noreferrer");
  }

  return (
    <div
      className={`void-orbit ${armed ? "armed" : ""}`}
      tabIndex={0}
      aria-label="Desktop carousel. Click to hold. Wheel turns. Double-click opens."
      onPointerLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        rest();
      }}
      onWheel={(e) => {
        if (!hold.current) return;
        want.current = null;
        live.current += e.deltaY * 0.0024 + e.deltaX * 0.0024;
        paint(live.current);
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button,a")) return;
        moved.current = false;
        if (!hold.current) {
          arm();
          return;
        }
        setGrab(true);
        drag.current = { x: e.clientX, rot: live.current };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        if (Math.abs(e.clientX - drag.current.x) > 6) moved.current = true;
        live.current = drag.current.rot + (e.clientX - drag.current.x) * 0.006;
        paint(live.current);
      }}
      onPointerUp={() => {
        drag.current = null;
        setGrab(false);
        if (hold.current && moved.current) want.current = nearest(n, live.current).snap;
      }}
      onClick={() => {
        if (!hold.current) arm();
      }}
    >
      <div className="void-stage">
        {items.map((s, i) => (
          <button
            key={s.key}
            type="button"
            ref={(el) => {
              bodies.current[i] = el;
            }}
            className={`void-body ${grab ? "grab" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!hold.current) {
                arm();
                lastHit.current = i;
                return;
              }
              want.current = aim(n, i);
              lastHit.current = i;
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              arm();
              go(s);
            }}
            title={s.blurb}
          >
            <span className="void-crystal">
              <img src={s.src} alt="" draggable={false} />
              <b>{s.title}</b>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
