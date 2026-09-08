import { ml_kem768 } from "@noble/post-quantum/ml-kem.js";
import { knotSeal } from "@/lib/geometry/braid";
import { hyper } from "@/lib/geometry/hyper-memory";

/**
 * Geometric twin of post-quantum crypto.
 * Hardness: Module-LWE (FIPS 203 ML-KEM-768). Geometry does not replace that.
 * Geometry: ciphertext lives in a knot/nest. AES-256 is the symmetric wrap (Grover-hard).
 */

export type KemBundle = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  cipherText: Uint8Array;
  shared: Uint8Array;
  nest: number;
  jones: string;
};

export function pqcLive() {
  try {
    const keys = ml_kem768.keygen();
    const enc = ml_kem768.encapsulate(keys.publicKey);
    const ss = ml_kem768.decapsulate(enc.cipherText, keys.secretKey);
    return ss.length === 32 && enc.sharedSecret.length === 32;
  } catch {
    return false;
  }
}

export function kemKeygen() {
  return ml_kem768.keygen();
}

export function kemEncap(publicKey: Uint8Array) {
  return ml_kem768.encapsulate(publicKey);
}

export function kemDecap(cipherText: Uint8Array, secretKey: Uint8Array) {
  return ml_kem768.decapsulate(cipherText, secretKey);
}

export function geoBind(bytes: Uint8Array) {
  let hex = "";
  for (let i = 0; i < Math.min(bytes.length, 64); i++) hex += bytes[i].toString(16).padStart(2, "0");
  const k = knotSeal(hex);
  const ptr = hyper.alloc("pqc:" + hex.slice(0, 16), Math.min(bytes.length, 4096));
  return { writhe: k.writhe, det: k.det, nest: ptr, perm: k.perm };
}

export async function mixDek(shared: Uint8Array, pwdBits: Uint8Array) {
  const raw = new Uint8Array(shared.length + pwdBits.length);
  raw.set(shared, 0);
  raw.set(pwdBits, shared.length);
  const key = await crypto.subtle.importKey("raw", raw as BufferSource, { name: "HKDF" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-512", salt: pwdBits as BufferSource, info: new TextEncoder().encode("hector-geo-pqc-v1") },
    key,
    256,
  );
  return crypto.subtle.importKey("raw", bits, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export function bundleOf(publicKey: Uint8Array, secretKey: Uint8Array, cipherText: Uint8Array, shared: Uint8Array): KemBundle {
  const g = geoBind(cipherText);
  return {
    publicKey,
    secretKey,
    cipherText,
    shared,
    nest: g.nest,
    jones: `${g.writhe}:${g.det}`,
  };
}
