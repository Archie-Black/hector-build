/** Content-addressed weights. Git holds the tiny one. Giants live on the box. Hector heals. */

export type Weight = {
  id: string;
  file: string;
  url: string;
  sha256: string;
  bytes: number;
  job: string;
  need: boolean;
};

export type Blob = { bytes: number; sha256: string };
export type State = "ok" | "missing" | "corrupt" | "unsigned" | "partial";
export type Verdict = { id: string; job: string; need: boolean; state: State; action: "use" | "refetch" | "stamp" | "skip"; note: string };

export const WEIGHTS: Weight[] = [
  {
    id: "whisper-tiny",
    file: "ggml-tiny.bin",
    url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
    sha256: "be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21",
    bytes: 77_691_713,
    job: "captions",
    need: true,
  },
  {
    id: "sd35-large",
    file: "sd3.5_large.safetensors",
    url: "https://huggingface.co/stabilityai/stable-diffusion-3.5-large",
    sha256: "",
    bytes: 16_000_000_000,
    job: "comfy",
    need: false,
  },
  {
    id: "flux-schnell",
    file: "flux1-schnell.safetensors",
    url: "https://huggingface.co/black-forest-labs/FLUX.1-schnell",
    sha256: "",
    bytes: 23_000_000_000,
    job: "comfy",
    need: false,
  },
];

export function byId(id: string) {
  return WEIGHTS.find((w) => w.id === id);
}

export function inspect(w: Weight, blob?: Blob): Verdict {
  if (!blob || blob.bytes <= 0) {
    return { id: w.id, job: w.job, need: w.need, state: "missing", action: w.need ? "refetch" : "skip", note: w.need ? "Required weight is gone. Fetch it." : "Optional. Suite keeps going." };
  }
  if (blob.bytes < w.bytes * 0.98 && w.bytes > 0) {
    return { id: w.id, job: w.job, need: w.need, state: "partial", action: "refetch", note: "Download stopped short. Resume." };
  }
  if (!w.sha256) {
    return { id: w.id, job: w.job, need: w.need, state: "unsigned", action: "stamp", note: "Human catalog had no hash. Stamp the one we measured." };
  }
  if (blob.sha256 !== w.sha256) {
    return { id: w.id, job: w.job, need: w.need, state: "corrupt", action: "refetch", note: "Checksum failed. Do not use. Fetch again." };
  }
  return { id: w.id, job: w.job, need: w.need, state: "ok", action: "use", note: "Verified." };
}

export function canRun(job: string, vs: Verdict[]) {
  const row = vs.filter((v) => v.job === job);
  if (!row.length) return true;
  if (row.some((v) => v.state === "ok")) return true;
  return !row.some((v) => v.need);
}

export function live(vs: Verdict[]) {
  const jobs = [...new Set(WEIGHTS.map((w) => w.job))];
  return jobs.filter((j) => canRun(j, vs));
}

export function wantsWeights(text: string) {
  return /\b(heal (the )?weights|missing (weights|models)|model weights|fetch (flux|sd|whisper)|repair (corrupt )?weights|corrupt weights)\b/i.test(text);
}
