import { useEffect, useState } from "react";
import { CHARTER } from "@/lib/v01d/charter";
import { ACT, boot, step } from "@/lib/hx/horizon";
import { godotMissing, type Gd } from "@/lib/hx/godot";
import { author, type Kit } from "@/lib/hx/author";
import { market, type Market } from "@/lib/hx/market";
import { missing, type Ue } from "@/lib/hx/ue";

type Tab = "Play" | "Library" | "Forge" | "DooMChaT";

const GAMES = [
  { name: "Spectral Horizon", note: "The Oasis", icon: "/horsemen/icons/portal.png" },
  { name: "VoidKart", note: "Drift", icon: "/horsemen/icons/portal.png" },
  { name: "Ghost Maze", note: "Bones", icon: "/horsemen/hector-ask.png" },
  { name: "Range", note: "Practice", icon: "/horsemen/icons/security.png" },
];

export function Portal() {
  const [open, setOpen] = useState<Tab | null>("Play");
  const [hz, setHz] = useState(() => boot());
  const [ue, setUe] = useState<Ue>(missing);
  const [gd, setGd] = useState<Gd>(godotMissing);
  const [kit, setKit] = useState<Kit | null>(null);
  const [ad, setAd] = useState<Market | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setHz((w) => step(w)), 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void fetch("/api/v1/hx/ue")
      .then((r) => r.json())
      .then(setUe)
    void fetch("/api/v1/hx/godot")
      .then((r) => r.json())
      .then(setGd)
      .catch(() => setGd(godotMissing()));
  }, []);

  const toggle = (t: Tab) => setOpen((v) => (v === t ? null : t));

  return (
    <div className="portal-realm">
      <img src="/horsemen/portal/hell.jpg" alt="" className="portal-hell" />
      <div className="portal-flow" aria-hidden />
      <div className="portal-rim" aria-hidden />

      <aside className="portal-rail">
        <p className="portal-mark">
          <img src="/horsemen/icons/portal.png" alt="" />
          PORTAL
        </p>

        <div className={`portal-drop ${open === "Play" ? "open" : ""}`}>
          <button type="button" className="portal-key" onClick={() => toggle("Play")}>
            Play
          </button>
          <ul className="portal-fly">
            {GAMES.map((g) => (
              <li key={g.name}>
                <button type="button" className="portal-item">
                  <img src={g.icon} alt="" />
                  {g.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={`portal-drop ${open === "Library" ? "open" : ""}`}>
          <button type="button" className="portal-key" onClick={() => toggle("Library")}>
            Library
          </button>
          <p className="portal-fly portal-line">Games stay on this machine. Windows or Linux.</p>
        </div>

        <div className={`portal-drop ${open === "Forge" ? "open" : ""}`}>
          <button type="button" className="portal-key" onClick={() => toggle("Forge")}>
            Forge
          </button>
          <div className="portal-fly">
            <button
              type="button"
              className="portal-item"
              onClick={() => {
                void fetch("/api/v1/hx/godot", { method: "POST" })
                  .then((r) => r.json())
                  .then(setGd);
              }}
            >
              Godot 4.7
            </button>
            <button
              type="button"
              className="portal-item"
              onClick={() => {
                void fetch("/api/v1/hx/ue", { method: "POST" })
                  .then((r) => r.json())
                  .then(setUe);
              }}
            >
              Unreal Editor 5.8
            </button>
            <button
              type="button"
              className="portal-item"
              onClick={() => {
                const k = author("Spectral Horizon");
                setKit(k);
                void fetch("/api/v1/hx/author", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ want: k.title }),
                });
              }}
            >
              Author
            </button>
            <p className="portal-line">{gd.note}</p>
            <p className="portal-line">{ue.note}</p>
            <button
              type="button"
              className="portal-item"
              onClick={() => {
                const k = author("Spectral Horizon");
                setKit(k);
                setAd(market(k, hz));
                void fetch("/api/v1/hx/market", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ want: k.title }),
                });
              }}
            >
              Market
            </button>
            {ad ? <p className="portal-line">{ad.hook}</p> : null}
            {ad ? <p className="portal-line">D1 {Math.round(ad.d1 * 100)}% · n {ad.n} · lives {ad.lives.toFixed(1)} · {ad.holes[0]?.fix}</p> : null}
          </div>
        </div>

        <div className={`portal-drop ${open === "DooMChaT" ? "open" : ""}`}>
          <button type="button" className="portal-key" onClick={() => toggle("DooMChaT")}>
            DooMChaT
          </button>
          <a className="portal-fly portal-item" href={CHARTER.doomchat} target="_blank" rel="noreferrer">
            <img src="/horsemen/icons/doomchat.png" alt="" />
            y.doomchat.ca
          </a>
        </div>
      </aside>

      <p className="portal-tick">
        {hz.tick} · {ACT[hz.act]}
      </p>
    </div>
  );
}
