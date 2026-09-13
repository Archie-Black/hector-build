import { useEffect, useRef, useState } from "react";
import { drive, laws, openLab, permit, pulse, STACK } from "@/lib/asimov/lab";
import { facet } from "@/lib/asimov/backend";
import { HAL } from "@/lib/v01d/hal";
import { RDNA } from "@/lib/asimov/rdna";

export function Asimov01() {
  const [lab] = useState(() => openLab());
  const [note, setNote] = useState("Asimov 01. You permit. I drive. The laws hold.");
  const [on, setOn] = useState(false);
  const floor = useRef<HTMLCanvasElement>(null);
  const eye = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let id = 0;
    const loop = () => {
      pulse(lab, 0.04);
      paintFloor(floor.current, lab.world);
      paintEye(eye.current, lab.edges);
      setNote(lab.last.note);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [lab]);

  function go(v: number, w: number) {
    const g = drive(lab, v, w);
    setNote(g.note);
  }

  const st = facet({ amd: true, nvidia: true });
  const L = laws();

  return (
    <div className="asimov">
      <header className="asimov-bar">
        <b>ASIMOV 01</b>
        <em>{HAL.name} · {RDNA.name} · CUDA</em>
      </header>
      <p className="asimov-laws">
        I. {L[1].slice(0, 42)}… II. obey you unless I. III. stay intact unless I or II.
      </p>
      <div className="asimov-grid">
        <canvas ref={floor} width={420} height={260} aria-label="Gazebo floor" />
        <canvas ref={eye} width={160} height={96} aria-label="OpenCV eyes" />
      </div>
      <ul className="asimov-stack">
        <li>{STACK.hal.name} — {STACK.hal.role}</li>
        <li>{STACK.rdna.name} — {STACK.rdna.role}</li>
        <li>{STACK.ros.name} — {STACK.ros.role}</li>
        <li>{STACK.opencv.name} — {STACK.opencv.role}</li>
      </ul>
      <p className="asimov-laws">{st.note}</p>
      <div className="asimov-drive">
        <label>
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => {
              setOn(e.target.checked);
              permit(lab, e.target.checked);
            }}
          />
          You may drive
        </label>
        <button type="button" onClick={() => go(1.1, 0)}>Forward</button>
        <button type="button" onClick={() => go(0.4, 1.4)}>Left</button>
        <button type="button" onClick={() => go(0.4, -1.4)}>Right</button>
        <button type="button" onClick={() => go(0, 0)}>Stop</button>
      </div>
      <p className="asimov-note">{note}</p>
    </div>
  );
}

function paintFloor(c: HTMLCanvasElement | null, wo: ReturnType<typeof openLab>["world"]) {
  if (!c) return;
  const g = c.getContext("2d");
  if (!g) return;
  const sx = c.width / wo.w;
  const sy = c.height / wo.h;
  g.fillStyle = "#05070c";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#0047ab";
  wo.walls.forEach((w) => g.fillRect(w.x * sx, w.y * sy, w.w * sx, w.h * sy));
  wo.humans.forEach((h) => {
    g.fillStyle = "#e6ff2a";
    g.beginPath();
    g.arc(h.x * sx, h.y * sy, h.r * sx, 0, Math.PI * 2);
    g.fill();
  });
  const b = wo.bot;
  g.fillStyle = "#6ea8ff";
  g.beginPath();
  g.arc(b.x * sx, b.y * sy, b.r * sx, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#e6ff2a";
  g.beginPath();
  g.moveTo(b.x * sx, b.y * sy);
  g.lineTo(b.x * sx + Math.cos(b.th) * 18, b.y * sy + Math.sin(b.th) * 18);
  g.stroke();
}

function paintEye(c: HTMLCanvasElement | null, e: { w: number; h: number; px: Uint8ClampedArray }) {
  if (!c) return;
  const g = c.getContext("2d");
  if (!g) return;
  const img = g.createImageData(e.w, e.h);
  for (let i = 0; i < e.px.length; i++) {
    const v = e.px[i];
    img.data[i * 4] = v * 0.3;
    img.data[i * 4 + 1] = v * 0.6;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, e.w, e.h, 0, 0, c.width, c.height);
}
