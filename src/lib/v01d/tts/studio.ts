/** Host studio mouth. The machine's own voices, picked like a grown-up. */

export function canStudio() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function voices() {
  if (!canStudio()) return [];
  return speechSynthesis.getVoices().map((v) => ({
    name: v.name,
    lang: v.lang,
    default: v.default,
    local: v.localService,
  }));
}

function pickVoice() {
  const all = speechSynthesis.getVoices();
  const en = all.filter((v) => /^en(-|$)/i.test(v.lang));
  const rank = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/google/.test(n)) s += 8;
    if (/microsoft|david|guy|ryan|andrew/.test(n)) s += 7;
    if (/alex|daniel|fred|tom/.test(n)) s += 6;
    if (/male|man/.test(n)) s += 3;
    if (v.localService) s += 2;
    if (/en-us/i.test(v.lang)) s += 2;
    if (/female|woman|zira|samantha|karen/.test(n)) s -= 4;
    return s;
  };
  const pool = en.length ? en : all;
  return pool.slice().sort((a, b) => rank(b) - rank(a))[0] || null;
}

let token = 0;

export function studioSay(text: string, rate = 0.92, pitch = 0.86) {
  if (!canStudio()) return () => {};
  speechSynthesis.cancel();
  const id = ++token;
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = rate;
  u.pitch = pitch;
  u.volume = 1;
  u.lang = v?.lang || "en-US";
  speechSynthesis.speak(u);
  return () => {
    if (token === id) speechSynthesis.cancel();
  };
}

export function studioStop() {
  if (canStudio()) speechSynthesis.cancel();
}

export function warmStudio() {
  if (!canStudio()) return;
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener("voiceschanged", () => speechSynthesis.getVoices(), { once: true });
}
