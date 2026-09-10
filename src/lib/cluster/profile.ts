/**
 * 9070 XT 16GB house. Best 7B/14B. Patriot JEDEC for the rest of the box.
 * Dynamic B is active params, not a 100B in RAM.
 */
export type DynClass = "7" | "14" | "mix";

export const PATRIOT = {
  ram: "Patriot Viper Steel DDR4",
  jedec: "DDR4-3200",
  xmp: false,
  cpu: "Ryzen 7 5700X3D stock, PBO off",
  gpu: "RX 9070 XT 16GB",
  vramGb: 16,
  gpuPower: 0.8,
  keepAlive: "-1",
  throttle: "none",
} as const;

/** Q4 weights + a little KV. 7B and 14B fit. 32B does not. */
export function canHoldVram(paramsB: number, vramGb = PATRIOT.vramGb, qBytes = 0.55) {
  return paramsB * qBytes + 3 <= vramGb;
}

export function paramB(name: string) {
  const m = name.toLowerCase().match(/(\d+(?:\.\d+)?)\s*b/);
  return m ? Number(m[1]) : 0;
}

export function isMoe(name: string) {
  return /moe|a\d+b|gpt-oss|mixtral|deepseek-coder-v2|qwen3-coder:30/i.test(name);
}
