/** Score ducks. Paul is the mouth. */

import { say, pcm } from "./voice/paul";
import { SPEECH } from "./overture";

export function warmSpeech() {
  pcm(SPEECH);
}

export function hectorSpeaks() {
  return say(SPEECH);
}
