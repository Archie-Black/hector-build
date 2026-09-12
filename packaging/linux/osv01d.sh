#!/usr/bin/env bash
set -euo pipefail
PREFIX="${HECTOR_PREFIX:-$HOME/.local/share/hector-build}"
export PATH="$PREFIX/runtime/node/bin:$PATH"
cd "$PREFIX"
exec "$PREFIX/runtime/node/bin/node" "$PREFIX/packaging/linux/serve-and-open.mjs"
