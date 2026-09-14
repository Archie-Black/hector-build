/** Hexagon sphere. Glass ticks, spin air, pick chime. Hertz from Godot + UE. */

import { ENGINE_SFX } from "@/lib/v01d/engine-sfx";
import { bus, unlock } from "@/lib/v01d/sound";

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
  const b = bus();
  if (!b) return;
  unlock();
  const t = b.ac.currentTime;
  const o = b.ac.createOscillator();
  const g = b.ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(b.gain);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function tick() {
  tone(ENGINE_SFX.tick, 0.06, "triangle", 0.045, -180);
}

export function whoosh(speed: number) {
  const b = bus();
  if (!b) return;
  unlock();
  const t = b.ac.currentTime;
  const n = b.ac.createBuffer(1, 0.18 * b.ac.sampleRate, b.ac.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = b.ac.createBufferSource();
  src.buffer = n;
  const f = b.ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = ENGINE_SFX.whoosh + Math.min(1800, Math.abs(speed) * 8000);
  f.Q.value = 0.7;
  const g = b.ac.createGain();
  g.gain.setValueAtTime(Math.min(0.12, 0.03 + Math.abs(speed) * 0.4), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  src.connect(f);
  f.connect(g);
  g.connect(b.gain);
  src.start(t);
}

export function pick() {
  tone(ENGINE_SFX.pickA, 0.18, "sine", 0.07, 0);
  tone(ENGINE_SFX.pickB, 0.28, "triangle", 0.05, 40);
}

export function hum() {
  const b = bus();
  if (!b) return () => {};
  unlock();
  const o = b.ac.createOscillator();
  const g = b.ac.createGain();
  o.type = "sine";
  o.frequency.value = ENGINE_SFX.hum;
  g.gain.value = 0.012;
  o.connect(g);
  g.connect(b.gain);
  o.start();
  return () => {
    try {
      g.gain.exponentialRampToValueAtTime(0.0001, b.ac.currentTime + 0.2);
      o.stop(b.ac.currentTime + 0.22);
    } catch {
      /* */
    }
  };
}
