/** Eerie void score. Sparse. Slow. Hertz from Godot void/score.gd and UE VoidScore.h. */

import { ENGINE_SFX } from "./engine-sfx";
import { bus, unlock } from "./sound";
import { SPEECH_AT } from "./overture";

function env(g: GainNode, ac: AudioContext, t: number, a: number, peak: number, hold: number, rel: number) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.linearRampToValueAtTime(peak * 0.7, t + a + hold);
  g.gain.linearRampToValueAtTime(0, t + a + hold + rel);
}

export const SCORE_DUCK = ENGINE_SFX.duck;

export function score() {
  unlock();
  const b = bus();
  if (!b) return () => {};
  const { ac, gain } = b;
  const out = ac.createGain();
  out.gain.value = 0;
  const delay = ac.createDelay(1.8);
  delay.delayTime.value = 0.42;
  const fb = ac.createGain();
  fb.gain.value = 0.38;
  const wet = ac.createGain();
  wet.gain.value = 0.45;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  out.connect(filter);
  filter.connect(gain);
  filter.connect(delay);
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(gain);

  const nodes: AudioScheduledSourceNode[] = [];

  const tone = (hz: number, type: OscillatorType, vol: number, dest: AudioNode) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = hz;
    g.gain.value = vol;
    o.connect(g);
    g.connect(dest);
    o.start();
    nodes.push(o);
    return { o, g };
  };

  const t0 = ac.currentTime;
  const bed = tone(ENGINE_SFX.bed, "sine", 0.09, out);
  const beat = tone(ENGINE_SFX.beat, "sine", 0.07, out);
  const fifth = tone(ENGINE_SFX.fifth, "triangle", 0.035, out);
  const air = tone(ENGINE_SFX.air, "sine", 0.012, out);
  bed.o.frequency.linearRampToValueAtTime(34.2, t0 + 40);
  beat.o.frequency.linearRampToValueAtTime(35.6, t0 + 40);
  const lfo = ac.createOscillator();
  const lfoG = ac.createGain();
  lfo.frequency.value = 0.07;
  lfoG.gain.value = 8;
  lfo.connect(lfoG);
  lfoG.connect(air.o.frequency);
  lfo.start();
  nodes.push(lfo);

  const noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const hiss = ac.createBufferSource();
  hiss.buffer = noiseBuf;
  hiss.loop = true;
  const hp = ac.createBiquadFilter();
  hp.type = "bandpass";
  hp.frequency.value = 2800;
  hp.Q.value = 0.7;
  const hissG = ac.createGain();
  hissG.gain.value = 0.018;
  hiss.connect(hp);
  hp.connect(hissG);
  hissG.connect(out);
  hiss.start();
  nodes.push(hiss);

  const bellAt = (when: number, hz: number) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.value = hz;
    o.connect(g);
    g.connect(out);
    env(g, ac, t0 + when, 0.04, 0.045, 0.2, 4.5);
    o.start(t0 + when);
    o.stop(t0 + when + 5);
    nodes.push(o);
  };
  bellAt(7.5, ENGINE_SFX.bell[0]);
  bellAt(18.2, ENGINE_SFX.bell[1]);
  bellAt(29.4, ENGINE_SFX.bell[2]);
  bellAt(41.0, ENGINE_SFX.bell[3]);

  out.gain.setValueAtTime(0, t0);
  out.gain.linearRampToValueAtTime(0.9, t0 + 8);
  out.gain.linearRampToValueAtTime(0.55, t0 + SPEECH_AT - 2.4);
  out.gain.linearRampToValueAtTime(0.06, t0 + SPEECH_AT + 0.6);
  out.gain.linearRampToValueAtTime(0.05, t0 + SPEECH_AT + 20);
  out.gain.linearRampToValueAtTime(0, t0 + 72);
  filter.frequency.setValueAtTime(1200, t0);
  filter.frequency.linearRampToValueAtTime(380, t0 + SPEECH_AT + 0.5);

  return () => {
    try {
      out.gain.cancelScheduledValues(0);
      out.gain.setValueAtTime(0, ac.currentTime);
      for (const o of nodes) {
        try {
          o.stop();
        } catch {
          /* */
        }
      }
    } catch {
      /* */
    }
  };
}
