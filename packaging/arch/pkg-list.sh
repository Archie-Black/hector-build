#!/usr/bin/env bash
# Unique pacman names. Comments and blanks dropped. Used by bootstrap.
set -euo pipefail
LIST="${1:?packages.x86_64}"
awk '
  /^[[:space:]]*#/ { next }
  /^[[:space:]]*$/ { next }
  {
    gsub(/\r/, "")
    if (!seen[$0]++) print
  }
' "$LIST"
