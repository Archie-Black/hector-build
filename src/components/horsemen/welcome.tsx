import { useState } from "react";
import { QUIZ, save, welcome, type Profile } from "@/lib/v01d/comfort";
import { room } from "@/lib/v01d/wsl";

export function Welcome({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const q = QUIZ[step]!;
  const first = step === 0;

  function pick(id: string) {
    const next = { ...draft, [q.id]: id };
    if (step + 1 >= QUIZ.length) {
      const p = save(next as Profile);
      onDone(p);
      return;
    }
    setDraft(next);
    setStep(step + 1);
  }

  return (
    <div className={`welcome ${first ? "welcome-install" : ""}`}>
      <p className="welcome-kicker">OS V01D · installing</p>
      <h1>{first ? "Hector here. How should I set this up?" : "How should this computer feel?"}</h1>
      <p className="welcome-ask">{q.ask}</p>
      <ul className={first ? "welcome-two" : ""}>
        {q.picks.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => pick(p.id)}>
              {p.say}
            </button>
          </li>
        ))}
      </ul>
      <p className="welcome-foot">{first ? "No loader. Firmware first. Signed updates only. Then we talk about the desk." : room(null).note}</p>
    </div>
  );
}

export function WelcomeDone({ p, onOpen }: { p: Profile; onOpen: () => void }) {
  return (
    <div className="welcome">
      <p className="welcome-kicker">OS V01D</p>
      <p className="welcome-ask">{welcome(p)}</p>
      <button type="button" onClick={onOpen}>
        Open the desk
      </button>
    </div>
  );
}
