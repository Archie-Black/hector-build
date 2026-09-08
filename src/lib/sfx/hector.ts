let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType = "square", gain = 0.04) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.stop(c.currentTime + dur);
}

export const sfx = {
  click: () => beep(880, 0.05, "square", 0.03),
  open: () => {
    beep(220, 0.08, "triangle", 0.04);
    setTimeout(() => beep(440, 0.08, "triangle", 0.03), 80);
  },
  whoosh: () => beep(140, 0.2, "sawtooth", 0.02),
  ok: () => beep(660, 0.1, "square", 0.035),
};
