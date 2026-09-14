#!/usr/bin/env bash
# VSCodium for Spectral HX. Heavy editor. Agent tasks live in packaging/hx/codium.
set +e
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PREFIX="${HECTOR_PREFIX:-$ROOT}"
if [ "$(id -u)" -eq 0 ]; then
  DEST="${CODIUM_PREFIX:-/opt/vscodium}"
else
  DEST="${CODIUM_PREFIX:-$PREFIX/runtime/vscodium}"
fi
BIN="$DEST/bin/codium"
MIRROR="${V01D_DOWNLOADS:-https://www.doomchat.ca/downloads}"
HX="${HECTOR_PREFIX:-$HOME}/v01d/hx"
[ -n "${HECTOR_PREFIX:-}" ] || HX="$HOME/v01d/hx"

if command -v codium >/dev/null 2>&1 && [ -x "$(command -v codium)" ]; then
  BIN="$(command -v codium)"
elif [ -x "$BIN" ]; then
  :
else
  mkdir -p "$DEST" "$PREFIX/runtime"
  TAR=""
  if curl -fsI "$MIRROR/vscodium-linux-x64.tar.gz" >/dev/null 2>&1; then
    TAR="$PREFIX/runtime/vscodium-linux-x64.tar.gz"
    curl -fL --retry 3 -o "$TAR" "$MIRROR/vscodium-linux-x64.tar.gz" || TAR=""
  fi
  if [ -z "$TAR" ] && command -v python3 >/dev/null; then
    URL="$(python3 - <<'PY'
import json, urllib.request
try:
    req = urllib.request.Request(
        "https://api.github.com/repos/VSCodium/vscodium/releases/latest",
        headers={"User-Agent": "osv01d"},
    )
    data = json.load(urllib.request.urlopen(req, timeout=20))
    for a in data.get("assets", []):
        n = a.get("name") or ""
        if n.startswith("VSCodium-linux-x64-") and n.endswith(".tar.gz"):
            print(a["browser_download_url"])
            break
except Exception:
    pass
PY
)"
    if [ -n "$URL" ]; then
      TAR="$PREFIX/runtime/vscodium-linux-x64.tar.gz"
      curl -fL --retry 3 -o "$TAR" "$URL" || TAR=""
    fi
  fi
  if [ -n "$TAR" ] && [ -f "$TAR" ]; then
    tar -xzf "$TAR" -C "$DEST"
  fi
fi

if [ -x "$DEST/bin/codium" ]; then
  BIN="$DEST/bin/codium"
fi
if [ -x "$BIN" ]; then
  mkdir -p "$HOME/.local/bin" /usr/local/bin 2>/dev/null || mkdir -p "$HOME/.local/bin"
  ln -sfn "$BIN" "$HOME/.local/bin/codium" 2>/dev/null || true
  ln -sfn "$BIN" /usr/local/bin/codium 2>/dev/null || true
  if [ -d /v01d/programs ]; then
    ln -sfn "$BIN" /v01d/programs/VSCodium 2>/dev/null || true
  fi
fi

mkdir -p "$HX/.vscode"
if [ -d "$ROOT/packaging/hx/codium/.vscode" ]; then
  cp -a "$ROOT/packaging/hx/codium/.vscode/." "$HX/.vscode/"
fi
echo "codium: ${BIN:-wait}"
exit 0
