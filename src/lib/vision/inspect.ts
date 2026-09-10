/** Live app inspection + mockup-to-code. The visual DevOps pillar. */

const CSS_HINT = /(?:padding|margin|gap|font-size|color|background)\s*:\s*[^;]+/gi;

export function mockupToCode(brief: string, files: Record<string, string>) {
  const css: string[] = [];
  for (const text of Object.values(files)) {
    const hits = text.match(CSS_HINT) ?? [];
    css.push(...hits.slice(0, 12));
  }
  const title = brief.replace(/[^\w\s]/g, " ").trim().slice(0, 40) || "View";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <link rel="stylesheet" href="ui.css"/>
</head>
<body>
  <main class="stage">
    <h1>${title}</h1>
    <p>${brief.slice(0, 180)}</p>
  </main>
</body>
</html>
`;
  const style = `:root { color-scheme: dark; --bg:#000; --accent:#0047ab; --uranium:#e6ff2a; }
html,body { margin:0; background:var(--bg); color:#e8eef8; font: 16px/1.45 "Instrument Sans", system-ui, sans-serif; }
.stage { min-height:100dvh; display:grid; place-items:center; padding:2rem; }
h1 { letter-spacing:-0.04em; }
${css.join(";\n")}
`;
  return { "index.html": html, "ui.css": style };
}

export function inspectUi(files: Record<string, string>) {
  const html = Object.entries(files).filter(([p]) => /\.html?$/i.test(p));
  const css = Object.entries(files).filter(([p]) => /\.css$/i.test(p));
  const bugs: string[] = [];
  for (const [path, text] of html) {
    if (!/viewport/i.test(text)) bugs.push(`${path}: missing viewport`);
    if (/<img\b(?![^>]*alt=)/i.test(text)) bugs.push(`${path}: image without alt`);
    if (!/<title>/i.test(text)) bugs.push(`${path}: missing title`);
  }
  for (const [path, text] of css) {
    if (/position:\s*fixed/i.test(text) && !/padding-top|safe-area/i.test(text)) bugs.push(`${path}: fixed chrome may cover content`);
    if (/font-size:\s*[0-9]px/i.test(text)) bugs.push(`${path}: tiny px type`);
  }
  return { pages: html.length, sheets: css.length, bugs };
}

export function screenshotHint(files: Record<string, string>) {
  return Object.keys(files).filter((p) => /\.(png|jpe?g|webp|svg)$/i.test(p)).slice(0, 8);
}
