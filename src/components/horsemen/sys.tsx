import { Settings } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { bootFeel, onFeel, patchFeel, type Feel } from "@/lib/v01d/feel";
import { applyGain, bootSound, muted, onMute, setMuted, unlock } from "@/lib/v01d/sound";
import { VoicePrefs } from "./voice";
import { clear } from "@/lib/v01d/comfort";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="sys-row">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SysPanel() {
  const [f, setF] = useState<Feel>(() => bootFeel());
  const [off, setOff] = useState(() => muted());
  useEffect(() => onFeel(setF), []);
  useEffect(() => onMute(() => setOff(muted())), []);

  function put(part: Partial<Feel>) {
    unlock();
    patchFeel(part);
    if (part.mute !== undefined) setMuted(part.mute);
    if (part.volume !== undefined) applyGain();
  }

  return (
    <div className="sys-sheet" role="dialog" aria-label="System settings">
      <header>
        <b>System</b>
        <em>Make this desk comfortable.</em>
      </header>
      <section>
        <h3>Sound</h3>
        <Row label="Volume">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={f.volume}
            aria-label="Volume"
            onChange={(e) => put({ volume: Number(e.target.value), mute: false })}
          />
        </Row>
        <Row label="Mute">
          <button type="button" className={off ? "on" : ""} onClick={() => put({ mute: !off })}>
            {off ? "On" : "Off"}
          </button>
        </Row>
        <Row label="Spatial audio">
          <button type="button" className={f.spatial ? "on" : ""} onClick={() => put({ spatial: !f.spatial })}>
            {f.spatial ? "Aether on" : "Stereo"}
          </button>
        </Row>
        <Row label="Room">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={f.room}
            aria-label="Room"
            onChange={(e) => put({ room: Number(e.target.value) })}
          />
        </Row>
      </section>
      <section>
        <h3>Sight</h3>
        <Row label="Brightness">
          <input type="range" min={0.62} max={1.35} step={0.01} value={f.brightness} aria-label="Brightness" onChange={(e) => put({ brightness: Number(e.target.value) })} />
        </Row>
        <Row label="Contrast">
          <input type="range" min={0.75} max={1.4} step={0.01} value={f.contrast} aria-label="Contrast" onChange={(e) => put({ contrast: Number(e.target.value) })} />
        </Row>
        <Row label="High contrast">
          <button type="button" className={f.high ? "on" : ""} onClick={() => put({ high: !f.high })}>
            {f.high ? "On" : "Off"}
          </button>
        </Row>
        <Row label="Less glass">
          <button type="button" className={f.flat ? "on" : ""} onClick={() => put({ flat: !f.flat })}>
            {f.flat ? "On" : "Off"}
          </button>
        </Row>
      </section>
      <section>
        <h3>Type and motion</h3>
        <Row label="Text size">
          <input type="range" min={0.85} max={1.45} step={0.01} value={f.font} aria-label="Text size" onChange={(e) => put({ font: Number(e.target.value) })} />
        </Row>
        <Row label="Motion">
          <button type="button" className={f.motion === "less" ? "on" : ""} onClick={() => put({ motion: f.motion === "less" ? "full" : "less" })}>
            {f.motion === "less" ? "Less" : "Full"}
          </button>
        </Row>
        <Row label="Bigger pointer">
          <button type="button" className={f.pointer ? "on" : ""} onClick={() => put({ pointer: !f.pointer })}>
            {f.pointer ? "On" : "Off"}
          </button>
        </Row>
      </section>
      <VoicePrefs />
      <button
        type="button"
        className="sys-again"
        onClick={() => {
          clear();
          window.dispatchEvent(new Event("v01d-comfort"));
        }}
      >
        Ask me again how this should feel
      </button>
    </div>
  );
}

export function SysFab() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    bootSound();
    bootFeel();
  }, []);
  return (
    <div className="void-sys">
      {open ? <SysPanel /> : null}
      <button
        type="button"
        className="void-trash"
        aria-label="Trash"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent("v01d-open", { detail: { app: "trash" } }));
        }}
      >
        <img src="/horsemen/icons/trash.png" alt="" />
      </button>
      <button
        type="button"
        className="void-mute"
        aria-label="System settings"
        aria-expanded={open}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          unlock();
          setOpen((v) => !v);
        }}
      >
        <Settings size={18} />
      </button>
    </div>
  );
}
