/** Formant is always on. Heavier mouths wait until they live on disk. */
export type Engine = "formant" | "chatterbox" | "voxcpm" | "fish";

const ORDER: Engine[] = ["chatterbox", "voxcpm", "fish", "formant"];

export function pick(): Engine {
  try {
    const want = localStorage.getItem("v01d.voice") as Engine | null;
    if (want === "formant") return "formant";
  } catch {
    /* sealed */
  }
  return "formant";
}

export function engines() {
  return ORDER.map((id) => ({
    id,
    ready: id === "formant",
    note:
      id === "formant"
        ? "Klatt vocal tract. Perfect Paul path. No GPU."
        : id === "chatterbox"
          ? "Real-time emotion tags. Install when you want it."
          : id === "voxcpm"
            ? "Studio 48k. Install when you want it."
            : "Many speakers. Install when you want it.",
  }));
}
