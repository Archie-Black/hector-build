#!/usr/bin/env bash
# Optional mouths. Formant is already in. These wait until you want them.
set -euo pipefail
ROOT="${HECTOR_VOICE:-/opt/v01d/voice}"
mkdir -p "$ROOT"
gcc -O3 -ffast-math -o "$ROOT/hector-say" "$(dirname "$0")/klatt.c" -lm
# chatterbox / voxcpm / fish stay off until pulled on purpose
echo "formant ready: $ROOT/hector-say"
