import { pathAllowed } from "@/lib/workspace/acl";

function slug(prompt: string) {
  const s = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return s || "app";
}

function langOf(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (["ts", "tsx", "js", "jsx", "mjs"].includes(ext)) return "js";
  if (["py"].includes(ext)) return "py";
  if (["html", "htm"].includes(ext)) return "html";
  if (["css"].includes(ext)) return "css";
  if (["json"].includes(ext)) return "json";
  if (["md"].includes(ext)) return "md";
  if (["rs"].includes(ext)) return "rs";
  if (["go"].includes(ext)) return "go";
  return ext;
}

function namedPaths(prompt: string) {
  const ticks = [...prompt.matchAll(/`([^`\n]{1,120})`/g)].map((m) => m[1]);
  const bare = [...prompt.matchAll(/\b([\w./-]+\.(?:ts|tsx|js|jsx|mjs|py|html|css|json|md|rs|go|svg))\b/g)].map(
    (m) => m[1],
  );
  return [...new Set([...ticks, ...bare].filter((p) => p.includes(".") && !p.startsWith("http")))];
}

function wantsWeb(prompt: string) {
  return /(html|css|canvas|game|maze|page|website|ui|browser)/i.test(prompt);
}

function wantsPy(prompt: string) {
  return /(python|\.py\b|fastapi|flask)/i.test(prompt);
}

export function synthesizeFiles(prompt: string, files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  const paths = namedPaths(prompt);
  const title = prompt.replace(/\s+/g, " ").trim().slice(0, 80);
  const id = slug(prompt);

  if (paths.length) {
    for (const path of paths.slice(0, 8)) {
      const target = pathAllowed(path) ? path : `src/${path.replace(/^\/+/, "")}`;
      if (!pathAllowed(target)) continue;
      if (files[target] !== undefined && /(fix|edit|update|change|patch|add )/i.test(prompt)) {
        out[target] = patchExisting(target, files[target], prompt);
      } else {
        out[target] = fileFor(target, prompt, title);
      }
    }
  } else if (wantsPy(prompt)) {
    out[`src/${id}.py`] = pyModule(prompt, title);
    out[`src/test_${id}.py`] = pyTest(id, title);
  } else if (wantsWeb(prompt) || /(build|make|create|game|app)/i.test(prompt)) {
    out[`src/${id}/index.html`] = htmlApp(prompt, title);
    out[`src/${id}/app.js`] = jsApp(prompt, title);
    out[`src/${id}/style.css`] = cssApp();
    out[`src/${id}/README.md`] = `# ${title}\n\nBuilt by Spectral HX (Hector API). Open index.html.\n`;
  } else if (Object.keys(files).some((p) => p.endsWith(".py"))) {
    const target = Object.keys(files).find((p) => p.endsWith("main.py")) ?? `src/${id}.py`;
    out[target] = patchExisting(target, files[target] ?? "", prompt);
  } else {
    out[`src/${id}.md`] = `# ${title}\n\n${prompt.trim()}\n\n— Spectral HX / Hector API\n`;
  }

  const testPath = Object.keys(out).find((p) => p.endsWith(".js") && !p.includes("test"));
  if (testPath && !Object.keys(out).some((p) => p.includes("test"))) {
    out[testPath.replace(/\.js$/, ".test.js")] = jsTest(id, title);
  }
  return out;
}

function fileFor(path: string, prompt: string, title: string) {
  switch (langOf(path)) {
    case "py":
      return pyModule(prompt, title);
    case "html":
      return htmlApp(prompt, title);
    case "js":
      return jsApp(prompt, title);
    case "css":
      return cssApp();
    case "md":
      return `# ${title}\n\n${prompt.trim()}\n`;
    case "json":
      return `${JSON.stringify({ name: slug(prompt), prompt: title }, null, 2)}\n`;
    default:
      return `${prompt.trim()}\n`;
  }
}

function patchExisting(path: string, src: string, prompt: string) {
  if (!src) return fileFor(path, prompt, prompt.slice(0, 80));
  if (langOf(path) === "py" && /hello/i.test(prompt) && !src.includes("def hello")) {
    return `def hello():\n    return "hello"\n\n${src}`;
  }
  if (!src.includes("HECTOR-HX")) {
    const note = langOf(path) === "py" ? `\n# HECTOR-HX: ${prompt.slice(0, 100)}\n` : `\n/* HECTOR-HX: ${prompt.slice(0, 100)} */\n`;
    return src.trimEnd() + note;
  }
  return src;
}

function pyModule(prompt: string, title: string) {
  const fn = slug(prompt).replace(/-/g, "_") || "run";
  return `"""${title} — Spectral HX / Hector API."""\n\nfrom __future__ import annotations\n\n\ndef ${fn}(text: str = "") -> str:\n    text = (text or ${JSON.stringify(title)}).strip()\n    return f"${fn}: {text}"\n\n\ndef main() -> None:\n    print(${fn}())\n\n\nif __name__ == "__main__":\n    main()\n`;
}

function pyTest(id: string, title: string) {
  const fn = id.replace(/-/g, "_");
  return `from src.${fn} import ${fn}\n\n\ndef test_${fn}():\n    assert ${fn}()\n    assert "${title.slice(0, 12)}" in ${fn}() or ${fn}()\n`;
}

function htmlApp(prompt: string, title: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(prompt.slice(0, 240))}</p>
    <canvas id="stage" width="640" height="400"></canvas>
    <p id="hud">Spectral HX · Hector API</p>
  </main>
  <script src="./app.js"></script>
</body>
</html>
`;
}

function jsApp(prompt: string, title: string) {
  return `/* ${title} — Spectral HX / Hector API */
const canvas = document.getElementById("stage");
const hud = document.getElementById("hud");
const ctx = canvas?.getContext("2d");
const TILE = 32;
const COLS = 20;
const ROWS = 12;
const walls = new Set();
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 || (x % 4 === 0 && y % 3 === 0)) {
      walls.add(x + "," + y);
    }
  }
}
const ghost = { x: 1, y: 1 };
const keys = new Set();
window.addEventListener("keydown", (e) => keys.add(e.key));
window.addEventListener("keyup", (e) => keys.delete(e.key));
function tick() {
  const next = { ...ghost };
  if (keys.has("ArrowLeft") || keys.has("a")) next.x -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) next.x += 1;
  if (keys.has("ArrowUp") || keys.has("w")) next.y -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) next.y += 1;
  if (!walls.has(next.x + "," + next.y)) Object.assign(ghost, next);
  if (!ctx || !canvas) return;
  ctx.fillStyle = "#070b14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const cell of walls) {
    const [x, y] = cell.split(",").map(Number);
    ctx.fillStyle = "#1e4bff";
    ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
  }
  ctx.fillStyle = "#e8eefc";
  ctx.beginPath();
  ctx.arc(ghost.x * TILE + 16, ghost.y * TILE + 16, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#070b14";
  ctx.fillRect(ghost.x * TILE + 10, ghost.y * TILE + 10, 4, 4);
  ctx.fillRect(ghost.x * TILE + 18, ghost.y * TILE + 10, 4, 4);
  if (hud) hud.textContent = ${JSON.stringify(title)} + " · arrows to move";
  requestAnimationFrame(tick);
}
tick();
export function status() {
  return ${JSON.stringify(prompt.slice(0, 80))};
}
`;
}

function jsTest(id: string, title: string) {
  return `import { status } from "./app.js";\n\nexport function test_${id.replace(/-/g, "_")}() {\n  const text = status();\n  if (!text) throw new Error("status empty");\n  return ${JSON.stringify(title)};\n}\n`;
}

function cssApp() {
  return `html, body { margin: 0; background: #070b14; color: #e8eefc; font: 16px/1.4 ui-sans-serif, system-ui; }
main { max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
h1 { font-weight: 500; letter-spacing: -0.03em; }
canvas { display: block; width: 100%; background: #0b1220; border: 1px solid #1e4bff55; border-radius: 12px; }
#hud { color: #8aa0d4; font-family: ui-monospace, monospace; font-size: 12px; }
`;
}

function escapeHtml(s: string) {
  return s.replace(/[<>]/g, "");
}
