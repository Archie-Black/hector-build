import { useEffect, useState } from "react";
import { CHARTER } from "@/lib/v01d/charter";
import { ACT, boot, step } from "@/lib/hx/horizon";
import { godotMissing, type Gd } from "@/lib/hx/godot";
import { author, type Kit } from "@/lib/hx/author";
import { market, type Market } from "@/lib/hx/market";
import { missing, type Ue } from "@/lib/hx/ue";
import { boot as nxBoot, publish, step as nxStep, type Channel } from "@/lib/hx/niagara";
import { GAMES, SEATS, SKIN, nextOf, type Game, type Seat } from "@/lib/hx/handler";
import { MODS, type Mod } from "@/lib/hx/mods";
import { die, grant, spawn, spend, survive, total, type Wallet, boot as walletBoot } from "@/lib/hx/spectre";
import { RULES, boot as royaleBoot, finish, tick as royaleTick, type Round } from "@/lib/hx/royale";
import { SQUAD, drop as canDrop, laneOf, matchmake, note as queueNote, type Pilot } from "@/lib/hx/match";

export function Portal() {
  const [open, setOpen] = useState<Seat | null>(null);
  const [pick, setPick] = useState<Game>(GAMES[0]!);
  const [hz, setHz] = useState(() => boot());
  const [ue, setUe] = useState<Ue>(missing);
  const [gd, setGd] = useState<Gd>(godotMissing);
  const [kit, setKit] = useState<Kit | null>(null);
  const [ad, setAd] = useState<Market | null>(null);
  const [nx, setNx] = useState<Channel>(() => nxBoot());
  const [live, setLive] = useState("");
  const [wallet, setWallet] = useState<Wallet>(() => spawn(walletBoot()));
  const [round, setRound] = useState<Round>(() => royaleBoot());
  const [own, setOwn] = useState<string[]>([]);
  const [mod, setMod] = useState<Mod>(MODS[0]!);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHz((w) => {
        const n = step(w);
        setNx((c) => nxStep(c, n.tick));
        setRound((r) => {
          const next = royaleTick(r, 0.05);
          if (r.alive && next.left === 0 && r.left > 0) setWallet((wlt) => survive(wlt));
          return next;
        });
        return n;
      });
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    void fetch("/api/v1/hx/ue")
      .then((r) => r.json())
      .then(setUe)
      .catch(() => setUe(missing()));
    void fetch("/api/v1/hx/godot")
      .then((r) => r.json())
      .then(setGd)
      .catch(() => setGd(godotMissing()));
  }, []);

  const deck: Game[] = kit
    ? GAMES.concat({ name: kit.title, note: "Build", icon: "/horsemen/icons/hx.png", engine: "both" })
    : GAMES;

  const toggle = (t: Seat) => {
    if (t === "Play") {
      play();
      return;
    }
    setNx((c) => publish(c, { kind: "heat", x: 0.2, heat: 0.7 }));
    setOpen((v) => (v === t ? null : t));
  };

  const you: Pilot = { id: "you", name: "you", mmr: Math.min(3200, 400 + Math.floor(wallet.earned / 8)), party: "home" };
  const ticket = matchmake([you]);

  function play() {
    setNx((c) => publish(c, { kind: "play", x: 0.5, heat: 1 }));
    if (pick.name === "Spectral Horizon") {
      const L = matchmake([you]);
      if (!L || !canDrop(L)) {
        setOpen("Queue");
        setLive(queueNote(L ?? { lane: laneOf(you.mmr), teams: [], full: false }));
        return;
      }
      setRound(royaleBoot());
      setWallet((w) => spawn(w));
      setLive(`Royale. ${L.lane}. ${SQUAD} to a squad. ${RULES.cash}`);
    } else {
      setLive(`Playing ${pick.name}`);
    }
    setOpen(null);
  }

  function focus(g: Game) {
    setPick(g);
    setLive("");
  }

  const make = () => {
    const k = author(pick.name);
    setKit(k);
    setAd(market(k, hz));
    setWallet((w) => grant(w, 400, "build"));
    setPick({ name: k.title, note: "Build", icon: "/horsemen/icons/hx.png", engine: "both" });
    void fetch("/api/v1/hx/author", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ want: k.title }),
    });
  };

  const i = Math.max(0, deck.findIndex((g) => g.name === pick.name));
  const prev = deck[(i - 1 + deck.length) % deck.length]!;
  const next = deck[(i + 1) % deck.length]!;
  const mi = Math.max(0, MODS.findIndex((m) => m.id === mod.id));
  const mPrev = MODS[(mi - 1 + MODS.length) % MODS.length]!;
  const mNext = MODS[(mi + 1) % MODS.length]!;

  function buy() {
    if (own.includes(mod.id)) {
      setLive(`${mod.name} is yours.`);
      return;
    }
    const n = spend(wallet, mod.cost);
    if (!n) {
      setLive("Earn Spectre. Never cash.");
      return;
    }
    setWallet(n);
    setOwn((xs) => xs.concat(mod.id));
    setLive(`Equipped ${mod.name}`);
  }

  return (
    <div
      className="portal-realm"
      style={{
        ["--heat" as string]: String(nx.heat),
        ["--burst" as string]: String(nx.burst),
        ["--drip-x" as string]: String(nx.x),
      }}
    >
      <img src="/horsemen/portal/hell.jpg" alt="" className="portal-hell" />
      <div className="portal-flow" aria-hidden />
      <div className="portal-scan" aria-hidden />
      <div className="portal-burst" aria-hidden />

      <aside className="portal-rail">
        <p className="portal-mark">
          <img src="/horsemen/icons/handler.png" alt="" />
          <span>
            SPECTRAL HORIZON
            <b>Portal 00:13</b>
          </span>
        </p>

        {SEATS.map((t) => (
          <div key={t} className={`portal-drop ${open === t ? "open" : ""}`}>
            <button
              type="button"
              className={`portal-key ${t === "Play" ? "portal-play" : ""}`}
              style={{
                ["--plate" as string]: `url(${SKIN[t].plate})`,
                ["--lag" as string]: SKIN[t].lag,
                ["--tilt" as string]: SKIN[t].tilt,
                ["--drip" as string]: SKIN[t].drip,
                ["--gap" as string]: SKIN[t].gap,
                ["--fall" as string]: SKIN[t].fall,
              }}
              onClick={() => toggle(t)}
            >
              {t === "Play" ? `Play ${pick.name}` : t}
            </button>
            {t === "Library" ? (
              <ul className="portal-fly">
                {deck.map((g) => (
                  <li key={g.name}>
                    <button type="button" className={`portal-item ${pick.name === g.name ? "on" : ""}`} onClick={() => focus(g)}>
                      <img src={g.icon} alt="" />
                      {g.name}
                      <em>{g.engine}</em>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {t === "Store" ? (
              <div className="portal-fly">
                <p className="portal-line">Spectre {total(wallet)} · never cash</p>
                {MODS.map((m) => (
                  <button key={m.id} type="button" className={`portal-item ${mod.id === m.id ? "on" : ""}`} onClick={() => setMod(m)}>
                    <img src={m.icon} alt="" />
                    {m.name}
                    <em>{m.cost}</em>
                  </button>
                ))}
              </div>
            ) : null}
            {t === "Friends" ? (
              <a className="portal-fly portal-item" href={CHARTER.doomchat} target="_blank" rel="noreferrer">
                <img src="/horsemen/icons/doomchat.png" alt="" />
                DooMChaT
              </a>
            ) : null}
            {t === "Forge" ? (
              <div className="portal-fly">
                <button type="button" className="portal-item" onClick={() => void fetch("/api/v1/hx/godot", { method: "POST" }).then((r) => r.json()).then(setGd)}>
                  Godot 4.7
                </button>
                <button type="button" className="portal-item" onClick={() => void fetch("/api/v1/hx/ue", { method: "POST" }).then((r) => r.json()).then(setUe)}>
                  Unreal 5.8
                </button>
                <button type="button" className="portal-item" onClick={make}>
                  Author
                </button>
                <button
                  type="button"
                  className="portal-item"
                  onClick={() => {
                    const k = kit ?? author(pick.name);
                    setKit(k);
                    setAd(market(k, hz));
                  }}
                >
                  Market
                </button>
              </div>
            ) : null}
            {t === "Queue" ? (
              <div className="portal-fly">
                <p className="portal-line">
                  {queueNote(ticket ?? { lane: laneOf(you.mmr), teams: [], full: false })}
                </p>
                <p className="portal-line">
                  {laneOf(you.mmr)} · mmr {you.mmr} · squad {SQUAD}
                </p>
              </div>
            ) : null}
            {t === "Vault" ? <p className="portal-fly portal-line">Knot on this machine. Windows and Linux. Same save.</p> : null}
            {t === "Pulse" ? (
              <div className="portal-fly">
                <p className="portal-line">
                  {Math.floor(round.left / 60)}:{String(Math.floor(round.left % 60)).padStart(2, "0")} · Spectre {total(wallet)}
                </p>
                {round.missions
                  .filter((m) => !m.secret || round.missions.filter((x) => !x.secret).every((x) => x.done))
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="portal-item"
                      onClick={() => {
                        const n = finish(m, round);
                        setRound(n.round);
                        if (n.pay) setWallet((w) => grant(w, n.pay, "mission"));
                      }}
                    >
                      {m.done ? "done" : m.name}
                    </button>
                  ))}
                <button
                  type="button"
                  className="portal-item"
                  onClick={() => {
                    const d = die(wallet);
                    setWallet(d.wallet);
                    setLive(`Dropped ${d.drop} Spectre. Respawn ${RULES.spawn}.`);
                  }}
                >
                  Drop
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </aside>

      {open === "Store" ? (
        <div className="portal-rolo">
          <button type="button" className="rolo-card rolo-side" onClick={() => setMod(mPrev)}>
            <img src={mPrev.icon} alt="" />
            <span>{mPrev.name}</span>
          </button>
          <button type="button" className="rolo-card rolo-focus" onClick={buy} aria-current="true">
            <img src={mod.icon} alt="" />
            <span>{mod.name}</span>
            <em>
              {own.includes(mod.id) ? "yours" : `${mod.cost} Spectre`} · {mod.by}
            </em>
          </button>
          <button type="button" className="rolo-card rolo-side" onClick={() => setMod(mNext)}>
            <img src={mNext.icon} alt="" />
            <span>{mNext.name}</span>
          </button>
        </div>
      ) : (
      <div
        className="portal-rolo"
        onWheel={(e) => {
          e.preventDefault();
          focus(nextOf(deck, pick, e.deltaY > 0 ? 1 : -1));
        }}
      >
        <button type="button" className="rolo-card rolo-side" onClick={() => focus(prev)}>
          <img src={prev.icon} alt="" />
          <span>{prev.name}</span>
        </button>
        <button type="button" className="rolo-card rolo-focus" onClick={play} aria-current="true">
          <img src={pick.icon} alt="" />
          <span>{pick.name}</span>
          <em>{pick.note} · {pick.engine === "both" ? "Godot + Unreal" : pick.engine === "ue" ? "Unreal 5.8" : "Godot 4.7"}</em>
        </button>
        <button type="button" className="rolo-card rolo-side" onClick={() => focus(next)}>
          <img src={next.icon} alt="" />
          <span>{next.name}</span>
        </button>
      </div>
      )}

      <p className="portal-tick">
        <span className={gd.ok ? "on" : ""}>G4.7</span>
        <span className={ue.ok ? "on" : ""}>UE5.8</span>
        {hz.tick} · {ACT[hz.act]} · {hz.inv.toString(16)}
        {live ? ` · ${live}` : ""}
      </p>
    </div>
  );
}
