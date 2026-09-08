import { createServerFn } from "@tanstack/react-start";

function parseRepo(input: string): { owner: string; repo: string } | null {
  const t = input.trim().replace(/\.git$/, "");
  const m =
    t.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/i) ||
    t.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

const TEXT = /\.(md|txt|js|ts|tsx|jsx|json|css|html|yml|yaml|toml|mjs|cjs)$/i;

export const importApprovedRepo = createServerFn({ method: "POST" })
  .validator((input: { url: string }) => input)
  .handler(async ({ data }) => {
    const parsed = parseRepo(data.url);
    if (!parsed) {
      return { ok: false as const, error: "I need a GitHub link like owner/name." };
    }
    const treeRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/HEAD?recursive=1`,
      { headers: { Accept: "application/vnd.github+json", "User-Agent": "HectorBuild" } },
    );
    if (!treeRes.ok) {
      return {
        ok: false as const,
        error: "I could not open that repo. It may be private or missing.",
      };
    }
    const treeBody = (await treeRes.json()) as {
      tree?: { path?: string; type?: string; size?: number }[];
    };
    const blobs = (treeBody.tree ?? [])
      .filter(
        (n) =>
          n.type === "blob" &&
          n.path &&
          TEXT.test(n.path) &&
          (n.size ?? 0) < 80_000,
      )
      .slice(0, 40);
    const files: Record<string, string> = {};
    for (const node of blobs) {
      const raw = await fetch(
        `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/HEAD/${node.path}`,
      );
      if (!raw.ok) continue;
      files[node.path as string] = await raw.text();
    }
    if (!Object.keys(files).length) {
      return { ok: false as const, error: "That repo had no readable text files I could take." };
    }
    return {
      ok: true as const,
      repo: `${parsed.owner}/${parsed.repo}`,
      files,
    };
  });
