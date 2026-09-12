/** Hashed telemetry only. No cleartext internals in logs. */
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return new Uint8Array(await crypto.subtle.digest("SHA-256", data as BufferSource));
  }
  const { createHash } = await import("node:crypto");
  return new Uint8Array(createHash("sha256").update(data).digest());
}

export function hex(b: Uint8Array) {
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function tag(msg: string) {
  return hex((await sha256(new TextEncoder().encode(msg))).subarray(0, 12));
}
