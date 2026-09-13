/** Seal a bounce: watermark, BWF-style rights, SHA-256, local receipt. Not a QTSP. */

import { sha256 } from "./hash";
import { hear, mark } from "./mark";
import { pcm, wav } from "./wav";

export type Rights = {
  holder: string;
  isrc: string;
  title: string;
};

export type Receipt = {
  title: string;
  holder: string;
  isrc: string;
  stamp: string;
  sha256: string;
  mark: number;
  note: string;
};

const KEY = "v01d-forge-ledger";

export async function seal(bytes: Uint8Array, rights: Rights): Promise<{ file: Uint8Array; receipt: Receipt }> {
  const raw = pcm(bytes);
  const keyed = `${rights.holder}|${rights.isrc}|${rights.title}`;
  const marked = raw.length ? mark(raw, keyed) : raw;
  const file = raw.length ? wav(marked) : bytes;
  const hash = await sha256(file);
  const receipt: Receipt = {
    title: rights.title,
    holder: rights.holder,
    isrc: rights.isrc,
    stamp: new Date().toISOString(),
    sha256: hash,
    mark: raw.length ? hear(marked, keyed) : 0,
    note: "Local proof of existence on this machine. The watermark is in the WAV PCM. MP3 can wound it. The hash proves this file. Register with SOCAN for royalties.",
  };
  save(receipt);
  return { file, receipt };
}

export function ledger(): Receipt[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return raw ? (JSON.parse(raw) as Receipt[]) : [];
  } catch {
    return [];
  }
}

function save(r: Receipt) {
  const all = ledger().concat(r).slice(-200);
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(all));
  } catch {
    /* empty */
  }
}

export function wantsForge(text: string) {
  return /\b(studio|ardour|d[\s-]?a[\s-]?w|copyright|watermark|protect (the |this )?track|music (suite|author)|bounce)\b/i.test(text);
}
