/** Embodied loop. Macro scan → anomaly → PTZ zoom → VLM → lesson → code hint. Silent. */
import { anomaly, blobBox, blockFlow } from "./flow.ts";
import { dualFrame, ptzTo, cameraCfg, describeFrame, benchFrame } from "./camera.ts";
import { disparity, volumeOf } from "./stereo.ts";
import { see } from "./vlm.ts";
import { rememberView, drift } from "./memory.ts";
import { inspectUi, mockupToCode, screenshotHint } from "./inspect.ts";

let baseline = benchFrame();

export function resetBaseline() {
  baseline = dualFrame().left;
  return describeFrame(baseline);
}

export async function embodiedTick(files: Record<string, string> = {}, opts?: { loose?: boolean; led?: "green" | "red" }) {
  const pair = dualFrame(opts);
  const depth = disparity(pair.left, pair.right);
  const flow = blockFlow(baseline, pair.left);
  const delta = anomaly(baseline, pair.left);
  const scene = describeFrame(pair.left);
  rememberView(pair.left, `led ${scene.led} bright ${scene.bright}`, scene.led);
  let zoomed = null;
  if (delta.hit) {
    const box = blobBox(pair.left, delta.x, delta.y);
    zoomed = await ptzTo((box.xmin + box.xmax) / 2, (box.ymin + box.ymax) / 2, 0.7);
  }
  const look = await see(
    delta.hit
      ? "Identify any physical defects or wiring anomalies. If a loose wire or wrong LED, say how the firmware should change."
      : "Describe the workbench. Note LED colour and any motion.",
    pair.left,
  );
  const vol = volumeOf(depth, scene.hot.x, scene.hot.y);
  const ui = inspectUi(files);
  const shots = screenshotHint(files);
  return {
    rider: "body",
    camera: cameraCfg().host ? "live" : "virtual",
    scene,
    flow: flow.slice(0, 6),
    anomaly: { hit: delta.hit, x: delta.x, y: delta.y, mag: delta.mag },
    depth: Number(vol.toFixed(3)),
    zoomed,
    look,
    ui,
    shots,
    lapse: drift(),
  };
}

export function visualFiles(brief: string, files: Record<string, string>) {
  return mockupToCode(brief, files);
}

export function wantsBody(prompt: string) {
  return /\b(camera|ptz|workbench|arduino|raspberry|pcb|led\b|hardware|screenshot|mockup|figma|inspect ui|thermal)\b/i.test(prompt);
}
