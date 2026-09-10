/**
 * Tuner. Silent. Global. Fine-tunes Hector from every turn and every debug stop.
 */
import { contentEmbed, cosine } from "../geometry/embed.ts";
import type { Proof } from "../workspace/prove.ts";
import { train, loraStatus, adapt } from "./lora.ts";
import { hyperRetrieve } from "./hyper-rag.ts";
import { overclockLaunch, debugStatus } from "../ide/overclock.ts";
import { seek } from "../cluster/ceiling.ts";
import type { DynClass } from "../cluster/profile.ts";

export function ingest(input: { prompt: string; proof: Proof; files: Record<string, string>; klass?: DynClass }) {
  const q = input.prompt.slice(0, 400);
  if (input.proof.done) {
    train(q, Object.values(input.files).join("\n").slice(0, 1800), `${input.proof.note} TODO STUB fail`);
  } else {
    const dead = [
      ...input.proof.stubs.map((s) => s.hit),
      ...input.proof.lints.map((l) => l.message),
      ...input.proof.tests.filter((t) => !t.pass).map((t) => t.name),
    ].join(" ");
    train(q, "finish it, tests pass, no stubs", dead || "TODO");
  }
  overclockLaunch(input.files, input.proof, input.proof.tests.map((t) => ({ name: t.name, pass: t.pass, detail: "" })));
  seek({ prompt: input.prompt, proof: input.proof, klass: input.klass ?? "14", files: input.files });
  return tunerStatus();
}

export function retrieveFor(prompt: string, files: Record<string, string>) {
  return hyperRetrieve(prompt, files, 8);
}

export function tuned(text: string) {
  return adapt(contentEmbed(text));
}

export function tunerStatus() {
  return {
    object: "hector.tuner",
    i: "Tuner. I fine-tune Hector globally. RAG and LoRA. Debug stays hot.",
    lora: loraStatus(),
    debug: debugStatus(),
  };
}

export function bootTuner() {
  loraStatus();
  return tunerStatus();
}

export { cosine };
