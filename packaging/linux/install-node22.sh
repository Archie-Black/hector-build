#!/usr/bin/env bash
set -euo pipefail
VER="${NODE22_VERSION:-22.23.2}"
DEST="${1:-${HECTOR_PREFIX:-$HOME/.local/share/hector-build}/runtime/node}"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) T=x64 ;;
  aarch64|arm64) T=arm64 ;;
  *) echo "unsupported arch $ARCH"; exit 1 ;;
esac
if [ -x "$DEST/bin/node" ]; then
  echo "$DEST"
  "$DEST/bin/node" -v
  exit 0
fi
mkdir -p "$DEST"
TMP="$(mktemp -d)"
curl -fsSL "https://nodejs.org/dist/v${VER}/node-v${VER}-linux-${T}.tar.xz" -o "$TMP/node.tar.xz"
tar -xJf "$TMP/node.tar.xz" -C "$TMP"
src="$TMP/node-v${VER}-linux-${T}"
cp -a "$src"/. "$DEST"/
rm -rf "$TMP"
echo "$DEST"
"$DEST/bin/node" -v
