export type Kind = "auto" | "studio" | "paul";

export type TtsPref = { engine: Kind; rate: number; pitch: number };

const KEY = "v01d.tts";

export function loadTts(): TtsPref {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const j = JSON.parse(raw) as Partial<TtsPref>;
      return {
        engine: j.engine === "studio" || j.engine === "paul" || j.engine === "auto" ? j.engine : "auto",
        rate: typeof j.rate === "number" ? j.rate : 1,
        pitch: typeof j.pitch === "number" ? j.pitch : 1,
      };
    }
  } catch {
    /* */
  }
  return { engine: "auto", rate: 1, pitch: 1 };
}

export function saveTts(p: TtsPref) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* */
  }
}
