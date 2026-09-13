#!/usr/bin/env bash
# GhostWalk is the only browser. Linux associations. Windows and Darwin morph inside the app.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$HOME/.local/share/applications/ghostwalk.desktop"
mkdir -p "$(dirname "$APP")"
cat > "$APP" <<EOF
[Desktop Entry]
Type=Application
Name=GhostWalk
Comment=OS V01D browser. Morphs to the machine.
Exec=xdg-open %u
MimeType=text/html;application/xhtml+xml;x-scheme-handler/http;x-scheme-handler/https;x-scheme-handler/osv01d;
Icon=$ROOT/public/horsemen/icons/ghostwalk.png
Terminal=false
Categories=Network;WebBrowser;
EOF
if command -v xdg-settings >/dev/null; then
  xdg-settings set default-web-browser ghostwalk.desktop 2>/dev/null || true
fi
if command -v xdg-mime >/dev/null; then
  xdg-mime default ghostwalk.desktop x-scheme-handler/http x-scheme-handler/https text/html 2>/dev/null || true
fi
echo "GhostWalk is the browser."
