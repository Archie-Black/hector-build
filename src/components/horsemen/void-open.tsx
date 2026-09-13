import { useEffect, useRef, useState } from "react";
import { birth, beat, CREDIT, GLYPHS, MARS, markOpen, opening, parked, slit, SPEECH_AT, VOID_LOOP, wantsInstall, type Shot } from "@/lib/v01d/overture";
import { hectorSpeaks, warmSpeech } from "@/lib/v01d/overture-audio";
import { score } from "@/lib/v01d/void-score";
import { bootSound, unlock } from "@/lib/v01d/sound";

export function VoidOpen({ onDone, onTick }: { onDone: () => void; onTick: (s: Shot) => void }) {
  const [t, setT] = useState(0);
  const voice = useRef<(() => void) | null>(null);
  const tick = useRef(onTick);
  const done = useRef(onDone);
  tick.current = onTick;
  done.current = onDone;
  useEffect(() => {
    if (!wantsInstall()) {
      tick.current(parked());
      done.current();
      return;
    }
    bootSound();
    unlock();
    warmSpeech();
    const stopDrone = score();
    const t0 = performance.now();
    let id = 0;
    let spoke = false;
    const loop = (now: number) => {
      const ms = now - t0;
      const o = opening(ms);
      setT(ms);
      tick.current(o);
      if (!spoke && ms / 1000 >= SPEECH_AT) {
        spoke = true;
        voice.current = hectorSpeaks();
      }
      if (o.done) {
        markOpen();
        stopDrone();
        tick.current(parked());
        done.current();
        return;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      stopDrone();
    };
  }, []);

  const o = opening(t);
  const s = t / 1000;
  return (
    <div className="void-open" aria-hidden>
      <video className="void-open-mars" src={VOID_LOOP} poster={MARS} autoPlay muted loop playsInline />
      <div className="void-open-black" style={{ opacity: o.black }} />
      <p className="void-open-star" style={{ opacity: o.letters }}>
        {GLYPHS.map((g, i) => {
          const local = beat(s, i);
          if (g === "1") {
            const b = birth(local);
            return (
              <span key={g} className="void-i" style={{ opacity: b.slit.opacity }}>
                <em style={{ transform: `translateX(${-b.split}em)`, clipPath: "inset(0 50% 0 0)" }}>1</em>
                <em style={{ transform: `translateX(${b.split}em)`, clipPath: "inset(0 0 0 50%)" }}>1</em>
              </span>
            );
          }
          const sl = slit(local);
          return (
            <span key={g} style={{ clipPath: `inset(${sl.inset})`, opacity: sl.opacity }}>
              {g}
            </span>
          );
        })}
      </p>
      <p className="void-open-credit" style={{ opacity: o.credit }}>
        {CREDIT}
      </p>
      <p className="void-open-speech" style={{ opacity: o.speech }}>
        {o.typed}
        <i />
      </p>
    </div>
  );
}
