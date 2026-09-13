/** Run a job inside Arch WSL (distro OSV01D). Hector calls this. The person does not. */

export type Hit = { ok: boolean; out: string; note: string };

export async function hook(inner: string): Promise<Hit> {
  if (!inner) return { ok: true, out: "", note: "Nothing to run." };
  try {
    const res = await fetch("/api/v1/wsl", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inner }),
    });
    const j = (await res.json()) as { ok?: boolean; out?: string; note?: string };
    return { ok: Boolean(j.ok), out: j.out || "", note: j.note || (j.ok ? "Done." : "The Linux room did not answer.") };
  } catch {
    return { ok: false, out: "", note: "I could not reach the Linux room from here." };
  }
}
