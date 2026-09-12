import { BOND, sealBond } from "./bond";
import { CHARTER, sealCharter } from "./charter";
import { sealGrant } from "./grant";
import { burn, LAW } from "@/lib/hector/unique";
import { evolve } from "./lab";
import { snapshot } from "./place";
import { listing } from "./samba";
import { taught } from "./talk";
import { sealVoice, VOICE } from "./voice/adapt";

/** First thing OS V01D does. Laws first. Filesystems learn. Hector builds. */
export function boot() {
  burn();
  sealCharter();
  sealGrant();
  sealBond();
  sealVoice();
  const lab = evolve();
  return { law: LAW, charter: CHARTER, bond: BOND, voice: VOICE, talk: taught(), share: listing(), lab, place: snapshot() };
}