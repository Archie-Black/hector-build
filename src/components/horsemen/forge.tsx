import { useState } from "react";
import { ledger, seal, type Receipt } from "@/lib/forge/seal";
import { bounceWav, STUDIO } from "@/lib/forge/studio";
import { wav } from "@/lib/forge/wav";
import { AETHER, ping } from "@/lib/hx/aether";
import { playSpace } from "@/lib/v01d/voice/speak";

export function Forge() {
  const [holder, setHolder] = useState("DeltaKingZero");
  const [isrc, setIsrc] = useState("");
  const [title, setTitle] = useState("Untitled bounce");
  const [log, setLog] = useState<Receipt[]>(() => ledger());
  const [note, setNote] = useState<string>(STUDIO.note);
  const [az, setAz] = useState(0);

  async function bounce() {
    const { receipt } = await seal(wav(bounceWav(2)), { holder, isrc: isrc || "unregistered", title });
    setLog(ledger());
    setNote(`Sealed ${receipt.title}. SHA-256 ${receipt.sha256.slice(0, 12)}…`);
  }

  function space() {
    const p = ping({ az, el: 0.08, r: 1.2 });
    playSpace(p.l, p.r, p.rate);
    setNote(`${AETHER.name}. Azimuth ${(az * 180) / Math.PI | 0}°.`);
  }

  return (
    <div className="forge">
      <header className="forge-bar">
        <b>GENESIS HX · FORGE</b>
        <em>{STUDIO.daw} · {AETHER.name}</em>
      </header>
      <p className="forge-note">{STUDIO.note}</p>
      <ul className="forge-rack">
        {STUDIO.rack.map((r) => (
          <li key={r.name}>
            <b>{r.name}</b> — {r.job}
          </li>
        ))}
      </ul>
      <p className="forge-paths">
        Bounces {STUDIO.bounce} · Vault {STUDIO.vault}
      </p>
      <label>
        Rights holder
        <input value={holder} onChange={(e) => setHolder(e.target.value)} />
      </label>
      <label>
        ISRC
        <input value={isrc} onChange={(e) => setIsrc(e.target.value)} placeholder="optional" />
      </label>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <button type="button" onClick={() => void bounce()}>
        Bounce and seal
      </button>
      <label>
        Aether azimuth
        <input type="range" min={-1.5} max={1.5} step={0.05} value={az} onChange={(e) => setAz(Number(e.target.value))} />
      </label>
      <button type="button" onClick={space}>
        Ping space
      </button>
      <p className="forge-note">{note}</p>
      <ul className="forge-ledger">
        {log.slice().reverse().map((r) => (
          <li key={r.sha256 + r.stamp}>
            <strong>{r.title}</strong>
            <span>{r.holder}</span>
            <code>{r.sha256.slice(0, 16)}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
