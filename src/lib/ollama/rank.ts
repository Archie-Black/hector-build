/** Pick the strongest coder on a home box. Size and “coder” beat a random 3B chat model. */

export function modelScore(name: string) {
  const n = name.toLowerCase();
  if (/embed|vision|llava|minicpm-v|nomic/.test(n)) return -1000;
  let s = 0;
  if (/coder|codestral|deepseek|devstral|starcoder|qwen2\.5-coder|qwen3-coder/.test(n)) s += 60;
  if (/granite/.test(n)) s += 50;
  if (/granite4\.2/.test(n)) s += 10;
  if (/instruct|chat/.test(n)) s += 4;
  const b = n.match(/(\d+(?:\.\d+)?)\s*b/);
  if (b) s += Math.min(90, Number(b[1]));
  if (/\b(70|72|32|34|27|22)b\b/.test(n)) s += 12;
  if (/\b(1|1.5|2|3)b\b/.test(n) && !/coder/.test(n)) s -= 8;
  return s;
}

export function rankModels(names: string[]) {
  return [...new Set(names)]
    .map((name) => ({ name, score: modelScore(name) }))
    .filter((m) => m.score > -50)
    .sort((a, b) => b.score - a.score);
}

export function pickPair(names: string[]) {
  const ranked = rankModels(names);
  if (!ranked.length) return null;
  const best = ranked[0]!.name;
  const fast =
    ranked.find((m) => /\b(7|8|14)b\b/.test(m.name.toLowerCase()))?.name ??
    ranked.find((m) => m.score < ranked[0]!.score)?.name ??
    best;
  return { best, fast, ranked };
}

export function ctxFor(name: string) {
  const n = name.toLowerCase();
  if (/\b(70|72)b\b/.test(n)) return 16_384;
  if (/granite/.test(n)) return 32_768;
  if (/\b(32|34|27)b\b/.test(n)) return 24_576;
  if (/\b(14|22)b\b/.test(n)) return 32_768;
  return 32_768;
}
