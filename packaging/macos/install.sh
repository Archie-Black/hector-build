#!/usr/bin/env bash
# Hector Build on macOS. HVF Darwin seat. LaunchAgents. No WSL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PREFIX="${HECTOR_PREFIX:-$HOME/Library/Application Support/HectorBuild}"
AGENTS="${HOME}/Library/LaunchAgents"
BREW="${HOMEBREW_PREFIX:-/opt/homebrew}"

mkdir -p "$PREFIX" "$AGENTS"
cp -R "$ROOT/packaging/darwin/launchd/"*.plist "$AGENTS/" 2>/dev/null || true

if [[ -x "$BREW/bin/node" ]]; then
  NODE="$BREW/bin/node"
elif command -v node >/dev/null; then
  NODE="$(command -v node)"
else
  echo "Need Node 22. brew install node@22"
  exit 1
fi

ln -sfn "$ROOT" "$PREFIX/src"
echo "LIVE prefix=$PREFIX node=$($NODE -v) accel=hvf webconnect=6081 retina=2560x1600"
echo "Next: npm run desktop   or   npm run desktop:mac"
