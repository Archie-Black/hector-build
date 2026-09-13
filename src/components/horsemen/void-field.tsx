import { useEffect, useRef } from "react";
import { VOID } from "@/lib/v01d/void";
import { boot, ease } from "@/lib/v01d/void-gl";
import { tune } from "@/lib/v01d/void-gl-learn";

export function VoidField({ quiet = false }: { quiet?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const look = useRef({ x: 0, y: 0 });
  const want = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      want.current = { x: (e.clientX / window.innerWidth - 0.5) * 24, y: (e.clientY / window.innerHeight - 0.5) * 16 };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = reduce ? null : boot(canvas, img.current ?? undefined);
    const ctx = gl ? null : canvas.getContext("2d", { alpha: false });
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let hide = document.hidden;
    const fit = () => {
      const scale = Math.min(1.25, window.devicePixelRatio || 1) * (quiet ? 0.5 : 0.78);
      w = Math.max(1, (window.innerWidth * scale) | 0);
      h = Math.max(1, (window.innerHeight * scale) | 0);
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };
    fit();
    window.addEventListener("resize", fit);
    const onVis = () => {
      hide = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    const tick = (stamp: number) => {
      raf = requestAnimationFrame(tick);
      if (hide) return;
      const dt = Math.min(48, stamp - last);
      last = stamp;
      look.current = ease(look.current, want.current);
      const t = stamp / 1000;
      const q = reduce || quiet ? 0.32 : tune(dt);
      if (gl) gl.draw(t, look.current, q, w, h);
      else if (ctx) {
        ctx.fillStyle = "#050506";
        ctx.fillRect(0, 0, w, h);
        const pic = img.current;
        if (pic && pic.complete && pic.naturalWidth) ctx.drawImage(pic, 0, 0, w, h);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      gl?.stop();
      window.removeEventListener("resize", fit);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [quiet]);

  return (
    <div className="void-gpu pointer-events-none absolute inset-0 overflow-hidden bg-void">
      <img ref={img} src={VOID.wallpaper} alt="" className="hidden" />
      <canvas ref={ref} className="void-gpu-canvas" />
    </div>
  );
}
