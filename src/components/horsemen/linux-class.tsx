import { useEffect, useRef, useState } from "react";
import { grade, next, offer, type Lesson, type Progress } from "@/lib/v01d/linux-class";

export function LinuxClass({
  busy,
  teach,
  progress,
  onProgress,
}: {
  busy: boolean;
  teach: boolean;
  progress: Progress;
  onProgress: (p: Progress) => void;
}) {
  const line = offer(teach, busy, progress);
  const [on, setOn] = useState(false);
  const [hide, setHide] = useState(false);
  const was = useRef(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (busy && !was.current) setHide(false);
    was.current = busy;
  }, [busy]);

  if (!line || hide) return null;

  function open() {
    const l = next(progress);
    setLesson(l);
    setPicks([]);
    setNote("");
    setOn(true);
  }

  function submit() {
    if (!lesson) return;
    const g = grade(lesson, picks, progress);
    onProgress(g.progress);
    setNote(g.note);
    if (g.ok) {
      setLesson(next(g.progress));
      setPicks([]);
    }
  }

  return (
    <aside className="linux-class">
      <p>{line}</p>
      {!on ? (
        <div className="room-choice">
          <button type="button" onClick={open}>
            Start the lesson
          </button>
          <button type="button" onClick={() => { setHide(true); setOn(false); }}>
            Skip. Just the job.
          </button>
        </div>
      ) : lesson ? (
        <div>
          <h2>{lesson.title}</h2>
          <p>{lesson.body}</p>
          {lesson.code ? <pre className="class-code">{lesson.code}</pre> : null}
          {lesson.parts?.length ? (
            <ul className="class-parts">
              {lesson.parts.map((p) => (
                <li key={p.bit}>
                  <code>{p.bit}</code>
                  <span>{p.mean}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {lesson.quiz.map((q, i) => (
            <fieldset key={q.q}>
              <legend>{q.q}</legend>
              {q.picks.map((pick, j) => (
                <label key={pick}>
                  <input type="radio" name={`q${i}`} checked={picks[i] === j} onChange={() => setPicks((xs) => {
                    const n = xs.slice();
                    n[i] = j;
                    return n;
                  })} />
                  {pick}
                </label>
              ))}
            </fieldset>
          ))}
          <button type="button" onClick={submit}>
            Check
          </button>
          {note ? <p className="room-teach">{note}</p> : null}
        </div>
      ) : (
        <p>You're through this set.</p>
      )}
    </aside>
  );
}
