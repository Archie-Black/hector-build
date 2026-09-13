import { useEffect, useRef } from "react";
import { USER_FACES, rotX, rotY, soccer, type Face, type Vec } from "@/lib/horsemen/bucky";
import { hum, pick, tick, whoosh } from "@/lib/horsemen/sphere-fx";

type Props = {
  filled: number[];
  hector: number;
  onPick: (desk: number) => void;
};

type Shot = { pts: Vec[]; n: Vec; z: number; i: number; kind: Face["kind"] };

const LIGHT: Vec = [0.42, 0.62, 0.78];

export function BuckyBall({ filled, hector, onPick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const filledRef = useRef(filled);
  const hectorRef = useRef(hector);
  const pickRef = useRef(onPick);
  filledRef.current = filled;
  hectorRef.current = hector;
  pickRef.current = onPick;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const faces = soccer();
    const motes = Array.from({ length: 48 }, () => {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(Math.random() * 2 - 1);
      return { x: Math.sin(b) * Math.cos(a), y: Math.cos(b), z: Math.sin(b) * Math.sin(a), s: 0.6 + Math.random() * 1.4 };
    });
    let raf = 0;
    let ang = 0.42;
    let pit = 0.22;
    let vAng = 0.0042;
    let vPit = 0;
    let hover = -1;
    let pulse = 0;
    let lastWhoosh = 0;
    const drag = { on: false, x: 0, y: 0, moved: false };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stopHum = reduce ? () => {} : hum();

    const fit = () => {
      const css = Math.min(window.innerWidth, window.innerHeight) * 0.84;
      const dpr = Math.min(1.25, window.devicePixelRatio || 1);
      canvas.style.width = `${css}px`;
      canvas.style.height = `${css}px`;
      canvas.width = Math.max(1, (css * dpr) | 0);
      canvas.height = canvas.width;
    };
    fit();
    window.addEventListener("resize", fit);

    const project = (f: Face, a: number, p: number): Shot => {
      const pts = f.verts.map((v) => rotX(rotY(v, a), p));
      const n = rotX(rotY(f.n, a), p);
      return { pts, n, z: n[2], i: f.i, kind: f.kind };
    };

    const hitAt = (x: number, y: number, shown: Shot[]) => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = w * 0.4;
      for (const f of shown) {
        if (f.kind !== "hex" || f.i >= USER_FACES || f.z < 0.08) continue;
        const pts = f.pts.map((p) => [cx + p[0] * R, cy - p[1] * R] as [number, number]);
        if (inside(pts, x, y)) return f.i;
      }
      return -1;
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = w * 0.4;
      if (!reduce && !drag.on) {
        ang += vAng;
        pit += vPit;
        vAng *= 0.985;
        vPit *= 0.985;
        if (Math.abs(vAng) < 0.0032) vAng += 0.00008;
        pit = Math.max(-0.72, Math.min(0.72, pit));
      }
      pulse *= 0.92;
      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(cx, cy, R * 0.12, cx, cy, R * 1.35);
      g.addColorStop(0, "rgba(0,71,171,0.18)");
      g.addColorStop(0.55, "rgba(5,5,6,0.0)");
      g.addColorStop(1, "rgba(5,5,6,0.45)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const shown = faces.map((f) => project(f, ang, pit)).sort((a, b) => a.z - b.z);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const m of motes) {
        const p = rotX(rotY([m.x, m.y, m.z], ang * 1.15), pit);
        if (p[2] < 0.05) continue;
        const x = cx + p[0] * R * 1.18;
        const y = cy - p[1] * R * 1.18;
        ctx.fillStyle = `rgba(230,255,42,${0.08 + p[2] * 0.22})`;
        ctx.beginPath();
        ctx.arc(x, y, m.s * (0.8 + p[2]), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      for (const f of shown) {
        if (f.z < -0.12) continue;
        const ndot = Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]);
        const user = f.kind === "hex" && f.i < USER_FACES;
        const mine = filledRef.current.includes(f.i);
        const hid = f.kind === "hex" && f.i >= USER_FACES && f.i - USER_FACES < hectorRef.current;
        const on = hover === f.i;
        const grow = on ? 1.06 : 1;
        const bloom = on || (user && pulse > 0.05 && hover < 0) ? 1 + pulse * 0.12 : 1;
        ctx.beginPath();
        f.pts.forEach((p, k) => {
          const x = cx + p[0] * R * grow * bloom;
          const y = cy - p[1] * R * grow * bloom;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        const a = 0.07 + ndot * 0.42 + f.z * 0.12;
        if (user && mine) ctx.fillStyle = `rgba(0,90,210,${0.22 + a})`;
        else if (on) ctx.fillStyle = `rgba(230,255,42,${0.16 + a * 0.4})`;
        else if (hid) ctx.fillStyle = `rgba(230,255,42,${0.05 + a * 0.18})`;
        else if (f.kind === "pent") ctx.fillStyle = `rgba(8,16,32,${0.35 + a * 0.2})`;
        else ctx.fillStyle = `rgba(160,190,230,${0.04 + a * 0.14})`;
        ctx.fill();
        ctx.strokeStyle = on ? "rgba(230,255,42,0.95)" : user ? `rgba(110,168,255,${0.55 + ndot * 0.4})` : "rgba(110,168,255,0.22)";
        ctx.lineWidth = (on ? 2.4 : user ? 1.7 : 0.7) * (w / 700);
        ctx.stroke();
        if (user) {
          ctx.save();
          ctx.shadowColor = "rgba(230,255,42,0.65)";
          ctx.shadowBlur = 12 * (w / 700);
          ctx.fillStyle = on ? "#ffffff" : "#e6ff2a";
          ctx.font = `${Math.max(13, w * 0.032)}px IBM Plex Sans, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const c = f.pts.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]] as Vec, [0, 0, 0]);
          ctx.fillText(String(f.i + 1), cx + (c[0] / 6) * R * grow, cy - (c[1] / 6) * R * grow);
          ctx.restore();
        }
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const rim = ctx.createRadialGradient(cx, cy, R * 0.78, cx, cy, R * 1.02);
      rim.addColorStop(0, "rgba(0,0,0,0)");
      rim.addColorStop(0.7, "rgba(0,71,171,0.08)");
      rim.addColorStop(1, "rgba(230,255,42,0.12)");
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
    };

    const down = (e: PointerEvent) => {
      drag.on = true;
      drag.moved = false;
      drag.x = e.clientX;
      drag.y = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const shown = faces.map((f) => project(f, ang, pit)).sort((a, b) => b.z - a.z);
      const p = local(e);
      const i = hitAt(p.x, p.y, shown);
      if (i !== hover) {
        hover = i;
        if (i >= 0) tick();
      }
      canvas.style.cursor = i >= 0 ? "pointer" : drag.on ? "grabbing" : "grab";
      if (!drag.on) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 3) drag.moved = true;
      vAng = dx * 0.012;
      vPit = dy * 0.01;
      ang += vAng;
      pit = Math.max(-0.72, Math.min(0.72, pit + vPit));
      drag.x = e.clientX;
      drag.y = e.clientY;
      const spd = Math.hypot(vAng, vPit);
      if (spd > 0.02 && e.timeStamp - lastWhoosh > 140) {
        whoosh(spd);
        lastWhoosh = e.timeStamp;
      }
    };
    const up = (e: PointerEvent) => {
      const moved = drag.moved;
      drag.on = false;
      if (moved) return;
      const p = local(e);
      const shown = faces.map((f) => project(f, ang, pit)).sort((a, b) => b.z - a.z);
      const i = hitAt(p.x, p.y, shown);
      if (i >= 0) {
        pulse = 1;
        pick();
        pickRef.current(i);
      }
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.style.cursor = "grab";
    return () => {
      cancelAnimationFrame(raf);
      stopHum();
      window.removeEventListener("resize", fit);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, []);

  return <canvas ref={ref} className="ball-canvas mx-auto block" aria-label="Desktops. Drag to turn. Click a hex to go there." />;
}

function inside(pts: [number, number][], x: number, y: number) {
  let ok = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const hit = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (hit) ok = !ok;
  }
  return ok;
}
