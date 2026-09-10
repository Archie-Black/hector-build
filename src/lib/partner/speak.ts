/** Chat replies as a person. Lingua does the talking. */
import type { Proof } from "../workspace/prove.ts";
import { learn, render } from "../lingo/lingua.ts";

function named(paths: string[]) {
  const clean = paths.filter(Boolean);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean[0]}, ${clean[1]}, and ${clean.length - 2} more`;
}

export function speakScout(files: number, lints: number) {
  const draft = !files
    ? "Nothing in here yet. Tell me what you want and I'll start."
    : lints
      ? `I had a look. ${files} files, a few nits. I didn't touch anything. Say the word and I'll fix them.`
      : `I had a look. ${files} files, nothing screaming at me. Ready when you are.`;
  return render(draft, { who: "hector", mood: "chat" });
}

export function speakPlan(paths: string[]) {
  const list = named(paths);
  const draft = !list ? "I know how I'd do it. Want me to just go ahead?" : `I'd start with ${list}. Want me to go ahead?`;
  return render(draft, { who: "hector", mood: "build" });
}

export function speakDone(input: { written: string[]; proof: Proof; url?: string }) {
  const where = named(input.written);
  let draft: string;
  if (input.url) draft = `It's up. ${input.url}`;
  else if (!input.proof.done) {
    const fail = input.proof.fail;
    draft = where
      ? `I got it into ${where}, but I'm not calling it done — ${fail === 1 ? "one check is still failing" : `${fail} checks are still failing`}. I'll keep going.`
      : `Not done yet. ${fail === 1 ? "One check is still failing." : `${fail} checks are still failing.`} I'll stay on it.`;
  } else if (!where) draft = "Done. Checks passed.";
  else if (input.written.length === 1) draft = `Done. That's in ${where}. Checks passed.`;
  else draft = `Done. I put that in ${where}. Checks passed.`;
  return render(draft, { who: "hector", mood: input.proof.done ? "done" : "stuck" });
}

export function speakOnIt(prompt: string) {
  learn(prompt);
  const bit = prompt.trim().replace(/\s+/g, " ").slice(0, 48);
  const draft = !bit ? "On it." : /^(hi|hello|hey)\b/i.test(bit) ? "Hey. What do you want built?" : "On it.";
  return render(draft, { who: "hector", job: prompt, lastHuman: prompt, mood: /^(hi|hello|hey)\b/i.test(bit) ? "chat" : "build" });
}