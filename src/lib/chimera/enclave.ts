import { wipe } from "./ct.ts";
import { hex, sha256 } from "./hash.ts";

/** Software enclave. Assumes the host OS is hostile. Seals secrets in-process. */
export type Seal = { iv: Uint8Array; ct: Uint8Array; tag: string };

function xor(a: Uint8Array, key: Uint8Array) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ key[i % key.length];
  return out;
}

export class Enclave {
  #key: Uint8Array;
  #epoch: number;
  constructor(seed: Uint8Array) {
    this.#key = seed.slice();
    this.#epoch = 1;
  }

  epoch() {
    return this.#epoch;
  }

  async mutate() {
    const next = await sha256(this.#key);
    wipe(this.#key);
    this.#key = next;
    this.#epoch += 1;
  }

  async seal(plain: Uint8Array): Promise<Seal> {
    const iv = (await sha256(new Uint8Array([...this.#key, this.#epoch & 255]))).subarray(0, 12);
    const stream = await sha256(new Uint8Array([...this.#key, ...iv]));
    const ct = xor(plain, stream);
    const mac = await sha256(new Uint8Array([...this.#key, ...iv, ...ct]));
    return { iv, ct, tag: hex(mac.subarray(0, 16)) };
  }

  async open(s: Seal): Promise<Uint8Array | null> {
    const mac = await sha256(new Uint8Array([...this.#key, ...s.iv, ...s.ct]));
    const expect = hex(mac.subarray(0, 16));
    if (expect !== s.tag) return null;
    const stream = await sha256(new Uint8Array([...this.#key, ...s.iv]));
    return xor(s.ct, stream);
  }

  die() {
    wipe(this.#key);
  }
}
