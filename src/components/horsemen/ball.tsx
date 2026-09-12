import { useEffect, useRef } from "react";
import { USER_FACES, rotX, rotY, soccer, type Face } from "@/lib/horsemen/bucky";

type Props = {
  filled: number[];
  hector: number;
  onPick: (desk: number) => void;
};

export function BuckyBall({ filled, hector, onPick }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const faces = useRef(soccer());
  const ang = useRef(0.4);
  const pit = useRef(0.25);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const s = Math.min(window.innerWidth, window.innerHeight) * 0.72;
      canvas.width = s;
      canvas.height = s;
    };
    resize();
    window.addEventListener("resize", resize);

    const project = (f: Face, a: number, p: number) => {
      const pts = f.verts.map((v) => {
        const r = rotX(rotY(v, a), p);
        return r;
      });
      const n = rotX(rotY(f.n, a), p);
      return { pts, n, z: n[2], i: f.i, kind: f.kind };
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = w * 0.38;
      ctx.clearRect(0, 0, w, h);
      if (!reduce && !drag.current) ang.current += 0.004;
      const shown = faces.current
        .map((f) => project(f, ang.current, pit.current))
        .sort((a, b) => a.z - b.z);
      for (const f of shown) {
        if (f.z < -0.05) continue;
        ctx.beginPath();
        f.pts.forEach((p, k) => {
          const x = cx + p[0] * R;
          const y = cy - p[1] * R;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        const user = f.kind === "hex" && f.i < USER_FACES;
        const mine = filled.includes(f.i);
        const hid = f.kind === "hex" && f.i >= USER_FACES && f.i - USER_FACES < hector;
        const light = 0.12 + f.z * 0.35;
        if (user && mine) ctx.fillStyle = `rgba(0,71,171,${0.28 + light})`;
        else if (hid) ctx.fillStyle = `rgba(230,255,42,${0.08 + light * 0.2})`;
        else ctx.fillStyle = `rgba(197,212,240,${0.05 + light * 0.12})`;
        ctx.fill();
        ctx.strokeStyle = user ? "rgba(110,168,255,0.85)" : "rgba(110,168,255,0.35)";
        ctx.lineWidth = user ? 1.6 : 0.8;
        ctx.stroke();
        if (user) {
          ctx.fillStyle = "#e6ff2a";
          ctx.font = `${Math.max(12, w * 0.03)}px IBM Plex Sans, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const c = f.pts.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]);
          ctx.fillText(String(f.i + 1), cx + (c[0] / 6) * R, cy - (c[1] / 6) * R);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const hit = (x: number, y: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const R = w * 0.38;
      const shown = faces.current
        .map((f) => project(f, ang.current, pit.current))
        .sort((a, b) => b.z - a.z);
      for (const f of shown) {
        if (f.kind !== "hex" || f.i >= USER_FACES || f.z < 0.05) continue;
        const pts = f.pts.map((p) => [cx + p[0] * R, cy - p[1] * R] as [number, number]);
        if (inside(pts, x, y)) return f.i;
      }
      return null;
    };

    const down = (e: PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.current) return;
      ang.current += (e.clientX - drag.current.x) * 0.008;
      pit.current = Math.max(-0.8, Math.min(0.8, pit.current + (e.clientY - drag.current.y) * 0.008));
      drag.current = { x: e.clientX, y: e.clientY };
    };
    const up = (e: PointerEvent) => {
      const start = drag.current;
      drag.current = null;
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;
      const r = canvas.getBoundingClientRect();
      const sx = ((e.clientX - r.left) / r.width) * canvas.width;
      const sy = ((e.clientY - r.top) / r.height) * canvas.height;
      const i = hit(sx, sy);
      if (i != null) onPick(i);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
    };
  }, [filled, hector, onPick]);

  return <canvas ref={ref} className="ball-canvas mx-auto block" />;
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
