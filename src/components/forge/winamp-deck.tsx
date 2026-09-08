import { useEffect, useRef, useState } from "react";
import { GhostVis } from "@/components/forge/ghost-vis";
import { sfx } from "@/lib/sfx/hector";
import { useForgeStore } from "@/lib/forge-store";

type Track = { name: string; url: string };

const AUDIO = /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i;

export function WinampDeck() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anal = useRef<AnalyserNode | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ghosts, setGhosts] = useState(true);
  const [beat, setBeat] = useState(0);
  const [time, setTime] = useState("00:00");
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    sfx.open();
    const a = audioRef.current;
    if (!a) return;
    const ctx = new AudioContext();
    try {
      const src = ctx.createMediaElementSource(a);
      const node = ctx.createAnalyser();
      node.fftSize = 64;
      src.connect(node);
      node.connect(ctx.destination);
      anal.current = node;
      const data = new Uint8Array(node.frequencyBinCount);
      let raf = 0;
      const draw = () => {
        node.getByteFrequencyData(data);
        const c = canvasRef.current;
        if (c) {
          const g = c.getContext("2d");
          if (g) {
            g.fillStyle = "#0a0c12";
            g.fillRect(0, 0, c.width, c.height);
            const w = c.width / data.length;
            data.forEach((v, n) => {
              g.fillStyle = n % 2 ? "#6ea8ff" : "#3dff9a";
              g.fillRect(n * w, c.height - v / 4, w - 1, v / 4);
            });
          }
        }
        const avg = data.reduce((s, v) => s + v, 0) / (data.length || 1) / 255;
        setBeat(avg);
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(raf);
    } catch {
      return undefined;
    }
  }, []);

  function loadFiles(list: FileList | null) {
    if (!list) return;
    const next: Track[] = [];
    for (const f of Array.from(list)) {
      if (!AUDIO.test(f.name) && !f.type.startsWith("audio/")) continue;
      next.push({ name: f.name, url: URL.createObjectURL(f) });
    }
    setTracks(next);
    setI(0);
    setAsked(true);
    sfx.ok();
  }

  function playAt(n: number) {
    const a = audioRef.current;
    const t = tracks[n];
    if (!a || !t) return;
    a.src = t.url;
    void a.play();
    setPlaying(true);
    setI(n);
    sfx.click();
  }

  return (
    <div className="relative flex h-dvh flex-col items-center justify-center px-4">
      <GhostVis on={ghosts && playing} beat={beat} />
      <div className="winamp">
        <div className="winamp-title">
          <span>HECTOR AMP</span>
          <button type="button" className="winamp-x" onClick={() => useForgeStore.getState().setSurface("work")}>
            ×
          </button>
        </div>
        <div className="winamp-lcd">
          <p className="winamp-time">{time}</p>
          <p className="winamp-track">{tracks[i]?.name ?? "no file — grant a folder"}</p>
          <canvas ref={canvasRef} width={220} height={28} className="winamp-vis" />
        </div>
        <div className="winamp-btns">
          <button type="button" onClick={() => playAt(Math.max(0, i - 1))}>
            ⏮
          </button>
          <button
            type="button"
            onClick={() => {
              const a = audioRef.current;
              if (!a) return;
              if (playing) {
                a.pause();
                setPlaying(false);
              } else playAt(i);
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => {
              audioRef.current?.pause();
              setPlaying(false);
              sfx.whoosh();
            }}
          >
            ⏹
          </button>
          <button type="button" onClick={() => playAt((i + 1) % Math.max(tracks.length, 1))}>
            ⏭
          </button>
        </div>
        <label className="winamp-grant">
          <input
            type="file"
            multiple
            // @ts-expect-error webkitdirectory is the folder grant
            webkitdirectory=""
            accept="audio/*"
            onChange={(e) => loadFiles(e.target.files)}
          />
          {asked ? "Folder granted" : "Ask to search this folder for audio"}
        </label>
        <label className="winamp-ghosts">
          <input type="checkbox" checked={ghosts} onChange={(e) => setGhosts(e.target.checked)} />
          Desktop ghosts
        </label>
        <ul className="winamp-pl">
          {tracks.map((t, n) => (
            <li key={t.url}>
              <button type="button" className={n === i ? "on" : ""} onClick={() => playAt(n)}>
                {n + 1}. {t.name}
              </button>
            </li>
          ))}
        </ul>
        <p className="winamp-foot">
          Retro deck inside Hector. Windows users can also install classic Winamp from downloads.
          VLC is HTML5 audio here (LIVE). System VLC is STUB in this sandbox.
        </p>
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60);
            setTime(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
          }}
          onEnded={() => playAt((i + 1) % Math.max(tracks.length, 1))}
        />
      </div>
    </div>
  );
}
