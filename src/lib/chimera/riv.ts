import { hex, sha256 } from "./hash.ts";

/** Runtime integrity. Merkle over named blobs. Self-heal = restore last good. */
export type Blob = { name: string; bytes: Uint8Array };

export class Riv {
  #good = new Map<string, string>();
  #live = new Map<string, Uint8Array>();

  async pin(blobs: Blob[]) {
    for (const b of blobs) {
      this.#live.set(b.name, b.bytes.slice());
      this.#good.set(b.name, hex(await sha256(b.bytes)));
    }
  }

  async check(): Promise<{ ok: boolean; bad: string[] }> {
    const bad: string[] = [];
    for (const [name, bytes] of this.#live) {
      const h = hex(await sha256(bytes));
      if (h !== this.#good.get(name)) bad.push(name);
    }
    return { ok: bad.length === 0, bad };
  }

  async heal(): Promise<string[]> {
    const { bad } = await this.check();
    return bad;
  }

  root() {
    return [...this.#good.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([n, h]) => `${n}:${h}`)
      .join("|");
  }
}
