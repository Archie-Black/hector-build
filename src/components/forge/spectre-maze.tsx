import { useEffect, useRef, useState } from "react";
import { useForgeStore } from "@/lib/forge-store";
import { useP2PRoom } from "@/lib/multiplayer/use-p2p-room";

const COLS = 13;
const ROWS = 11;
const TILE = 40;
const W = COLS * TILE;
const H = ROWS * TILE;

type Cell = 0 | 1 | 2;

function makeMap(): Cell[][] {
  const m: Cell[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < COLS; x++) {
      const edge = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
      const pillar = x % 2 === 0 && y % 2 === 0;
      const spawn = x + y < 4;
      if (edge || pillar) row.push(1);
      else if (spawn) row.push(0);
      else row.push(Math.random() < 0.58 ? 2 : 0);
    }
    m.push(row);
  }
  return m;
}

function blocked(map: Cell[][], x: number, y: number) {
  const tx = Math.round(x);
  const ty = Math.round(y);
  if (ty < 0 || tx < 0 || ty >= ROWS || tx >= COLS) return true;
  return map[ty][tx] !== 0;
}

export function SpectreMaze() {
  const [room, setRoom] = useState("hxmaze");
  const [live, setLive] = useState(false);
  if (!live) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/70 px-4">
        <div className="w-full max-w-sm rounded-lg p-6 text-center glass-window">
          <p className="text-lg font-medium">Spectre Maze</p>
          <p className="mt-2 text-sm text-muted">Ghost lattice. Bomberman rules. Arrows move. Space charges.</p>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value.replace(/[^a-z0-9_-]/gi, "").slice(0, 16) || "hxmaze")}
            className="mt-4 h-11 w-full rounded-md bg-inset px-3 text-sm"
            aria-label="Room"
          />
          <button
            type="button"
            className="mt-3 h-12 w-full rounded-md bg-accent text-sm text-accent-fg"
            onClick={() => setLive(true)}
          >
            Play
          </button>
          <button
            type="button"
            className="mt-2 h-11 w-full text-sm text-muted"
            onClick={() => useForgeStore.getState().setSurface("work")}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  return <MazePlay room={room} />;
}

function MazePlay({ room }: { room: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState("Clear the maze.");
  const touch = useRef({ x: 0, y: 0, bomb: false });
  const [, bump] = useState(0);
  const p2p = useP2PRoom({ room, name: "ghost" });
  const remotes = useRef<Record<string, { x: number; y: number }>>({});
  const pos = useRef({ x: 1, y: 1 });

  useEffect(
    () =>
      p2p.onMessage((from, data) => {
        const d = data as { x?: number; y?: number };
        if (typeof d.x === "number" && typeof d.y === "number") {
          remotes.current[from] = { x: d.x, y: d.y };
        }
      }),
    [p2p.onMessage],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gfx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const hector = new Image();
    hector.src = "/hector/hector-v2.png";
    const agent = new Image();
    agent.src = "/hector/agent-v2.png";

    let map = makeMap();
    let px = 1;
    let py = 1;
    let bombs: { x: number; y: number; t: number; range: number }[] = [];
    let flames: { x: number; y: number; t: number }[] = [];
    let enemies = [
      { x: COLS - 2, y: ROWS - 2, dx: -1, dy: 0 },
      { x: COLS - 2, y: 1, dx: 0, dy: 1 },
      { x: 1, y: ROWS - 2, dx: 1, dy: 0 },
    ];
    let over = false;
    let won = false;
    const keys: Record<string, boolean> = {};
    let acc = 0;
    let last = performance.now();
    let moveCool = 0;
    let bombCool = 0;
    let sendAt = 0;

    const down = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    function explode(x: number, y: number, range: number) {
      const dirs = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
      for (const d of dirs) {
        for (let i = d.x === 0 && d.y === 0 ? 0 : 1; i <= (d.x === 0 && d.y === 0 ? 0 : range); i++) {
          const tx = x + d.x * i;
          const ty = y + d.y * i;
          if (ty < 0 || tx < 0 || ty >= ROWS || tx >= COLS) break;
          if (map[ty][tx] === 1) break;
          flames.push({ x: tx, y: ty, t: 0.45 });
          if (map[ty][tx] === 2) {
            map[ty][tx] = 0;
            break;
          }
        }
      }
    }

    function step(dt: number) {
      if (over) return;
      moveCool -= dt;
      bombCool -= dt;
      const t = touch.current;
      const dx = keys.ArrowRight || keys.d || keys.D || t.x > 0 ? 1 : keys.ArrowLeft || keys.a || keys.A || t.x < 0 ? -1 : 0;
      const dy = keys.ArrowDown || keys.s || keys.S || t.y > 0 ? 1 : keys.ArrowUp || keys.w || keys.W || t.y < 0 ? -1 : 0;
      if (moveCool <= 0 && (dx || dy)) {
        const nx = px + dx;
        const ny = py + dy;
        if (!blocked(map, nx, ny)) {
          px = nx;
          py = ny;
          pos.current = { x: px, y: py };
        }
        moveCool = 0.14;
      }
      if ((keys[" "] || t.bomb) && bombCool <= 0 && bombs.length < 2) {
        bombs.push({ x: px, y: py, t: 2.2, range: 2 });
        bombCool = 0.35;
      }
      bombs = bombs.filter((b) => {
        b.t -= dt;
        if (b.t <= 0) {
          explode(b.x, b.y, b.range);
          return false;
        }
        return true;
      });
      flames = flames.filter((f) => {
        f.t -= dt;
        return f.t > 0;
      });
      const hit = (x: number, y: number) => flames.some((f) => f.x === x && f.y === y);
      enemies = enemies.filter((e) => {
        if (Math.random() < 0.02) {
          const opts = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
          ];
          const pick = opts[Math.floor(Math.random() * opts.length)];
          e.dx = pick.x;
          e.dy = pick.y;
        }
        const nx = e.x + e.dx;
        const ny = e.y + e.dy;
        if (blocked(map, nx, ny)) {
          e.dx *= -1;
          e.dy *= -1;
        } else {
          e.x = nx;
          e.y = ny;
        }
        return !hit(e.x, e.y);
      });
      if (hit(px, py) || enemies.some((e) => e.x === px && e.y === py)) {
        over = true;
        setHud("Caught. Close and play again.");
      }
      if (!over && enemies.length === 0) {
        won = true;
        over = true;
        setHud("Maze clear.");
      }
    }

    function draw() {
      gfx.fillStyle = "#000000";
      gfx.fillRect(0, 0, W, H);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = map[y][x];
          gfx.fillStyle = cell === 1 ? "#0c1a38" : cell === 2 ? "rgba(0,71,171,0.35)" : "#05070c";
          gfx.fillRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
        }
      }
      for (const f of flames) {
        gfx.fillStyle = "rgba(0,120,255,0.7)";
        gfx.fillRect(f.x * TILE + 6, f.y * TILE + 6, TILE - 12, TILE - 12);
      }
      for (const b of bombs) {
        gfx.fillStyle = "#e8eef8";
        gfx.beginPath();
        gfx.arc(b.x * TILE + TILE / 2, b.y * TILE + TILE / 2, 10 + Math.sin(b.t * 8) * 2, 0, Math.PI * 2);
        gfx.fill();
      }
      if (hector.complete) gfx.drawImage(hector, px * TILE + 4, py * TILE + 2, TILE - 8, TILE - 4);
      for (const e of enemies) {
        if (agent.complete) gfx.drawImage(agent, e.x * TILE + 6, e.y * TILE + 4, TILE - 12, TILE - 8);
      }
      for (const r of Object.values(remotes.current)) {
        if (agent.complete) gfx.globalAlpha = 0.7;
        if (agent.complete) gfx.drawImage(agent, r.x * TILE + 6, r.y * TILE + 4, TILE - 12, TILE - 8);
        gfx.globalAlpha = 1;
      }
      if (over) {
        gfx.fillStyle = "rgba(0,0,0,0.55)";
        gfx.fillRect(0, 0, W, H);
        gfx.fillStyle = "#e8eef8";
        gfx.font = "20px Instrument Sans, sans-serif";
        gfx.textAlign = "center";
        gfx.fillText(won ? "Clear" : "Caught", W / 2, H / 2);
      }
    }

    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      while (acc >= 1 / 60) {
        step(1 / 60);
        acc -= 1 / 60;
      }
      if (now - sendAt > 80) {
        p2p.broadcast({ x: px, y: py });
        sendAt = now;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [p2p.broadcast]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-bg/80 px-4">
      <div className="rounded-lg p-3 glass-window">
        <p className="mb-2 text-center text-xs text-subtle">
          room {room} · {p2p.peers.length} peer{p2p.peers.length === 1 ? "" : "s"}
        </p>
        <canvas ref={canvasRef} width={W} height={H} className="block max-h-[70dvh] w-full rounded-md" />
      </div>
      <p className="text-sm text-muted">{hud}</p>
      <div className="flex flex-wrap justify-center gap-2 md:hidden">
        {(["up", "left", "bomb", "right", "down"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="h-12 min-w-16 rounded-md bg-accent px-4 text-sm text-accent-fg"
            onPointerDown={() => {
              touch.current = {
                x: k === "left" ? -1 : k === "right" ? 1 : 0,
                y: k === "up" ? -1 : k === "down" ? 1 : 0,
                bomb: k === "bomb",
              };
              bump((n) => n);
            }}
            onPointerUp={() => {
              touch.current = { x: 0, y: 0, bomb: false };
            }}
          >
            {k}
          </button>
        ))}
      </div>
      <button type="button" className="h-11 rounded-md px-4 text-sm glass-thin" onClick={() => useForgeStore.getState().setSurface("work")}>
        Close
      </button>
    </div>
  );
}
