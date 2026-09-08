#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PREFIX="${XDG_DATA_HOME:-$HOME/.local/share}"
BIN="${XDG_BIN_HOME:-$HOME/.local/bin}"
APPDIR="$PREFIX/hector-build"
APP="$PREFIX/applications"

echo "Installing Hector Build and Spectral HX into $APPDIR"

mkdir -p "$APPDIR" "$BIN" "$APP" "$PREFIX/icons/hicolor/256x256/apps"

bash "$ROOT/packaging/linux/install-node22.sh" "$ROOT"
NODE_HOME="$ROOT/runtime/node"
export PATH="$NODE_HOME/bin:$PATH"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude node_modules --exclude .git --exclude artifacts --exclude screenshots \
    --exclude .vercel --exclude public/downloads \
    "$ROOT/" "$APPDIR/"
else
  tar -C "$ROOT" --exclude=node_modules --exclude=.git --exclude=artifacts \
    --exclude=screenshots --exclude=.vercel --exclude=public/downloads \
    -cf - . | tar -C "$APPDIR" -xf -
fi

cd "$APPDIR"
export PATH="$APPDIR/runtime/node/bin:$PATH"
if [ ! -x "$APPDIR/runtime/node/bin/node" ]; then
  bash "$APPDIR/packaging/linux/install-node22.sh" "$APPDIR"
fi
"$APPDIR/runtime/node/bin/npm" install --omit=dev

cat > "$BIN/hector-build" <<EOF
#!/usr/bin/env bash
export PATH="$APPDIR/runtime/node/bin:\$PATH"
exec "$APPDIR/runtime/node/bin/node" "$APPDIR/packaging/linux/serve-and-open.mjs" hector "\$@"
EOF
cat > "$BIN/spectral-hx" <<EOF
#!/usr/bin/env bash
export PATH="$APPDIR/runtime/node/bin:\$PATH"
exec "$APPDIR/runtime/node/bin/node" "$APPDIR/packaging/linux/serve-and-open.mjs" hx "\$@"
EOF
chmod +x "$BIN/hector-build" "$BIN/spectral-hx" "$APPDIR/packaging/linux/serve-and-open.mjs"

if [ -x "$APPDIR/packaging/linux/bin/hx-search" ]; then
  ln -sf "$APPDIR/packaging/linux/bin/hx-search" "$BIN/hx-search"
  echo "Rust meta-dynamic search: $BIN/hx-search"
fi

grep -q '.local/bin' "$HOME/.bashrc" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
grep -q '.local/bin' "$HOME/.profile" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.profile"

sed "s|^Exec=.*|Exec=$BIN/hector-build|" "$APPDIR/packaging/linux/hector-build.desktop" > "$APP/hector-build.desktop"
sed "s|^Exec=.*|Exec=$BIN/spectral-hx|" "$APPDIR/packaging/linux/spectral-hx.desktop" > "$APP/spectral-hx.desktop"
chmod +x "$APP/hector-build.desktop" "$APP/spectral-hx.desktop"

if [ -f "$APPDIR/public/hector/hector-v2.png" ]; then
  cp "$APPDIR/public/hector/hector-v2.png" "$PREFIX/icons/hicolor/256x256/apps/hector-build.png"
  cp "$APPDIR/public/hector/agent-v2.png" "$PREFIX/icons/hicolor/256x256/apps/spectral-hx.png"
fi

command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$APP" >/dev/null 2>&1 || true

echo
echo "Installed."
echo "  Hector Build  →  hector-build"
echo "  Spectral HX   →  spectral-hx"
echo
echo "Each command opens a full desktop window (Windows Chrome if you are in WSL)."
