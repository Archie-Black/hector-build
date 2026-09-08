#!/usr/bin/env bash
# Install Node 22 into Hector Build / Spectral HX (bundled runtime, not system Node).
set -euo pipefail

DEST="${1:-}"
if [ -z "$DEST" ]; then
  echo "usage: install-node22.sh <app-root>"
  exit 1
fi

VER="${HECTOR_NODE_VERSION:-22.23.2}"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) NODE_ARCH=x64 ;;
  aarch64|arm64) NODE_ARCH=arm64 ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

BIN="$DEST/runtime/node/bin/node"
if [ -x "$BIN" ]; then
  cur="$("$BIN" -v 2>/dev/null || true)"
  if [ "$cur" = "v$VER" ]; then
    echo "Node $cur already in $DEST/runtime/node"
    exit 0
  fi
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
TARBALL="node-v${VER}-linux-${NODE_ARCH}.tar.xz"
URL="https://nodejs.org/dist/v${VER}/${TARBALL}"
echo "Installing Node ${VER} into Hector Build / Spectral HX..."
curl -fsSL "$URL" -o "$TMP/$TARBALL"
mkdir -p "$DEST/runtime"
rm -rf "$DEST/runtime/node"
tar --no-same-owner -xJf "$TMP/$TARBALL" -C "$TMP"
mv "$TMP/node-v${VER}-linux-${NODE_ARCH}" "$DEST/runtime/node"
"$DEST/runtime/node/bin/node" -v
"$DEST/runtime/node/bin/npm" -v
echo "Node 22 is inside the app at $DEST/runtime/node"
