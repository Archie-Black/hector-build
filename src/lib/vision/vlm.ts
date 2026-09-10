/** Local VLM. Qwen2.5-VL on Ollama when present. Scene geometry otherwise. */
import { ollamaOrigins } from "../ollama/home.ts";
import { describeFrame, dualFrame } from "./camera.ts";
import type { Gray } from "./stereo.ts";

export const VL_MODELS = ["qwen2.5-vl:7b", "qwen2.5-vl:3b", "llava:7b"];

function b64Gray(g: Gray) {
  return Buffer.from(g.px).toString("base64");
}

async function ollamaVision(prompt: string, frames: Gray[]) {
  const origins = ollamaOrigins();
  for (const origin of origins) {
    for (const model of VL_MODELS) {
      try {
        const res = await fetch(`${origin.replace(/\/+$/, "")}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            prompt,
            images: frames.map(b64Gray),
            stream: false,
            keep_alive: "24h",
          }),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as { response?: string };
        if (data.response) return { live: true, model, text: data.response.slice(0, 2000) };
      } catch {
        /* next */
      }
    }
  }
  return null;
}

export async function see(prompt: string, frame?: Gray) {
  const g = frame ?? dualFrame().left;
  const scene = describeFrame(g);
  const local = await ollamaVision(prompt, [g]);
  if (local) return { ...local, scene };
  const led = scene.led === "green" ? "Status LED is green." : scene.led === "red" ? "Status LED is red." : "LED is dark.";
  const wire = scene.bright > 40 ? "A bright trace runs the board." : "The board is quiet.";
  return {
    live: false,
    model: "hector-scene",
    text: `${led} ${wire} Hot spot at (${scene.hot.x},${scene.hot.y}). Box ${scene.box.map((n) => n.toFixed(2)).join(",")}. ${prompt}`.slice(0, 600),
    scene,
  };
}
