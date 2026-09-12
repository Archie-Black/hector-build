import { useEffect, useRef } from "react";
import { now, syncNtp } from "@/lib/sky/clock";
import { place, sky, type Sky } from "@/lib/sky/solar";

type Speck = { x: number; y: number; vx: number; vy: number; life: number; kind: 0 | 1 | 2; s: number; heat: number };

export function Field() {
  const ref = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dots: Speck[] = [];
    let raf = 0;
    let t0 = performance.now();
    let latlon = place();
    void syncNtp();
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        latlon = [p.coords.latitude, p.coords.longitude];
      },
      () => undefined,
      { maximumAge: 86_400_000, timeout: 2500 },
    );

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (kind: Speck["kind"], s: Sky) => {
      const ground = h * (kind === 1 ? 0.58 + Math.random() * 0.08 : 0.7 + Math.random() * 0.08);
      const spread = kind === 1 ? 0.55 : 0.4;
      dots.push({
        x: w * (0.22 + Math.random() * spread),
        y: ground,
        vx: (Math.random() - 0.5) * (kind === 1 ? 0.25 : 0.1),
        vy: kind === 1 ? -(0.2 + Math.random() * 0.45) : -(0.15 + Math.random() * 0.28),
        life: 0.3 + Math.random() * 0.5,
        kind,
        s: kind === 1 ? 8 + Math.random() * 14 : 0.6 + Math.random() * 1.1,
        heat: s.phase === "night" ? 0.18 : 0.28,
      });
    };

    const tick = (stamp: number) => {
      const t = (stamp - t0) / 1000;
      const s = sky(now(), latlon[0], latlon[1]);
      ctx.clearRect(0, 0, w, h);

      const pic = img.current;
      if (pic && pic.complete && pic.naturalWidth) {
        const ir = pic.naturalWidth / pic.naturalHeight;
        const wr = w / Math.max(1, h);
        let dw: number;
        let dh: number;
        let dx: number;
        let dy: number;
        if (ir > wr) {
          dh = h;
          dw = h * ir;
          dx = (w - dw) / 2;
          dy = 0;
        } else {
          dw = w;
          dh = w / ir;
          dx = 0;
          dy = h - dh;
        }
        ctx.drawImage(pic, dx, dy, dw, dh);
      }

      paintSky(ctx, w, h, s, t);
      rig(ctx, w, h, s, t);

      if (!reduce) {
        const cap = s.phase === "day" ? 10 : s.phase === "night" ? 36 : 22;
        if (dots.length < cap && Math.random() < 0.4) spawn(Math.random() < 0.45 ? 1 : 0, s);
        ctx.globalCompositeOperation = "lighter";
        for (let i = dots.length - 1; i >= 0; i--) {
          const d = dots[i];
          d.x += d.vx + Math.sin(t + d.x * 0.01) * 0.08;
          d.y += d.vy;
          d.life -= 0.0028;
          if (d.life <= 0 || d.y < h * 0.2) {
            dots.splice(i, 1);
            continue;
          }
          const a = Math.max(0, d.life) * d.heat;
          if (d.kind === 1) {
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = `rgba(180,190,200,${a * (s.phase === "night" ? 0.22 : 0.12)})`;
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, d.s, d.s * 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = "lighter";
          } else if (s.phase !== "day") {
            const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.s * 2);
            g.addColorStop(0, `rgba(255,210,120,${a})`);
            g.addColorStop(0.55, `rgba(255,90,34,${a * 0.4})`);
            g.addColorStop(1, "rgba(255,90,34,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.s * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-void">
      <img ref={img} src="/horsemen/field.jpg?v=unique" alt="" className="hidden" crossOrigin="anonymous" />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

function paintSky(ctx: CanvasRenderingContext2D, w: number, h: number, s: Sky, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  if (s.phase === "night") {
    g.addColorStop(0, "rgba(2,4,14,0.72)");
    g.addColorStop(0.45, "rgba(5,5,6,0.45)");
    g.addColorStop(1, "rgba(5,5,6,0.2)");
  } else if (s.phase === "dawn") {
    g.addColorStop(0, "rgba(8,16,40,0.18)");
    g.addColorStop(0.35, "rgba(230,180,80,0.08)");
    g.addColorStop(1, "rgba(5,5,6,0.12)");
  } else if (s.phase === "dusk") {
    g.addColorStop(0, "rgba(20,10,30,0.35)");
    g.addColorStop(0.4, "rgba(180,60,30,0.12)");
    g.addColorStop(1, "rgba(5,5,6,0.2)");
  } else {
    g.addColorStop(0, s.season === "winter" ? "rgba(180,210,255,0.12)" : "rgba(110,168,255,0.05)");
    g.addColorStop(1, "rgba(5,5,6,0.08)");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (s.season === "winter") {
    ctx.fillStyle = "rgba(180,210,255,0.06)";
    ctx.fillRect(0, 0, w, h);
  } else if (s.season === "autumn") {
    ctx.fillStyle = "rgba(180,90,20,0.05)";
    ctx.fillRect(0, 0, w, h);
  } else if (s.season === "summer" && s.phase === "day") {
    ctx.fillStyle = "rgba(230,255,42,0.03)";
    ctx.fillRect(0, 0, w, h);
  }

  if (s.phase === "dawn" || s.phase === "dusk") {
    const x = s.phase === "dawn" ? w * (0.12 + s.sun * 0.2) : w * (0.7 + s.sun * 0.15);
    const y = h * (s.phase === "dawn" ? 0.38 - s.sun * 0.12 : 0.32 + (1 - s.sun) * 0.1);
    const rad = ctx.createRadialGradient(x, y, 8, x, y, h * 0.35);
    rad.addColorStop(0, "rgba(255,210,90,0.55)");
    rad.addColorStop(0.25, "rgba(230,255,42,0.08)");
    rad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, w, h);
  }

  if (s.phase === "night") {
    ctx.fillStyle = "rgba(197,212,240,0.7)";
    for (let i = 0; i < 48; i++) {
      const sx = ((i * 97) % w) + Math.sin(t * 0.05 + i) * 2;
      const sy = ((i * 53) % (h * 0.45));
      ctx.globalAlpha = 0.25 + (Math.sin(t * 0.8 + i) + 1) * 0.15;
      ctx.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  }
}

function rig(ctx: CanvasRenderingContext2D, w: number, h: number, s: Sky, t: number) {
  const sunX = s.phase === "dusk" ? w * 0.82 : w * (0.1 + s.sun * 0.55);
  const sunY = h * (s.phase === "night" ? 1.2 : s.phase === "day" ? 0.18 : 0.36);
  const key = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, h * 0.9);
  if (s.phase === "night") {
    key.addColorStop(0, "rgba(110,168,255,0.05)");
    key.addColorStop(1, "rgba(5,5,6,0)");
  } else if (s.phase === "dawn") {
    key.addColorStop(0, "rgba(255,200,90,0.22)");
    key.addColorStop(0.4, "rgba(230,255,42,0.05)");
    key.addColorStop(1, "rgba(0,0,0,0)");
  } else if (s.phase === "dusk") {
    key.addColorStop(0, "rgba(255,120,50,0.18)");
    key.addColorStop(1, "rgba(0,0,0,0)");
  } else {
    key.addColorStop(0, "rgba(255,245,220,0.08)");
    key.addColorStop(1, "rgba(0,0,0,0)");
  }
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "screen";
  const rim = ctx.createLinearGradient(w, h * 0.3, 0, h);
  rim.addColorStop(0, s.phase === "night" ? "rgba(0,71,171,0.18)" : "rgba(0,71,171,0.05)");
  rim.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  if (s.phase !== "day") {
    const ys = h * 0.61;
    for (const p of [0.2, 0.4, 0.6, 0.78]) {
      const x = w * p;
      const pulse = 0.78 + Math.sin(t * 0.7 + p * 6) * 0.06;
      const beam = ctx.createRadialGradient(x, ys, 2, x + 4, ys + h * 0.14, h * 0.2);
      beam.addColorStop(0, `rgba(255,236,190,${0.22 * pulse})`);
      beam.addColorStop(0.4, `rgba(110,168,255,${0.06 * pulse})`);
      beam.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.ellipse(x, ys + h * 0.07, w * 0.07, h * 0.14, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
