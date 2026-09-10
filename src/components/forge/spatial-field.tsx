import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Pointer-driven spatial stage. Sets --sx/--sy on the field for CSS 3D. */
export function SpatialField({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      ty = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
    };
    const leave = () => {
      tx = 0;
      ty = 0;
    };
    const tick = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      el.style.setProperty("--sx", cx.toFixed(4));
      el.style.setProperty("--sy", cy.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ref} className={"spatial-field " + (className ?? "")}>
      {children}
    </div>
  );
}

const MOTES = [
  { x: 8, y: 18, d: "11s", z: -80 },
  { x: 22, y: 42, d: "14s", z: -40 },
  { x: 71, y: 14, d: "9s", z: 20 },
  { x: 88, y: 36, d: "16s", z: -120 },
  { x: 14, y: 72, d: "13s", z: 10 },
  { x: 46, y: 8, d: "10s", z: -30 },
  { x: 63, y: 78, d: "15s", z: -70 },
  { x: 81, y: 62, d: "12s", z: 30 },
  { x: 33, y: 88, d: "17s", z: -50 },
  { x: 52, y: 31, d: "8s", z: 16 },
];

export function SpatialFx() {
  return (
    <>
      <div className="spatial-floor" aria-hidden />
      <div className="spatial-volume" aria-hidden />
      <div className="spatial-motes" aria-hidden>
        {MOTES.map((m) => (
          <span
            key={`${m.x}-${m.y}`}
            style={
              {
                left: `${m.x}%`,
                top: `${m.y}%`,
                animationDuration: m.d,
                "--mz": `${m.z}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
