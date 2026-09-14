#!/usr/bin/env bash
# Fetch Hector Build / Spectral HX / OS images from www.doomchat.ca/downloads/
# Falls back to the Punisher mirror path when that tree is mounted.
set -euo pipefail
DEST="${V01D_DOWNLOADS:-${HOME:-/root}/v01d/home/Downloads}"
URL="${V01D_DOWNLOADS_URL:-https://www.doomchat.ca/downloads}"
PUNISHER="${V01D_PUNISHER:-/mnt/c/Users/Dark0/Downloads/OSV01D/hector-build}"
mkdir -p "$DEST"
ok=0
pull() {
  local file="$1"
  if [[ -f "$PUNISHER/$file" ]]; then
    cp -f "$PUNISHER/$file" "$DEST/$file"
    echo "ok  local $file"
    ok=$((ok + 1))
    return
  fi
  if curl -fL --retry 3 -o "$DEST/$file.part" "$URL/$file"; then
    mv "$DEST/$file.part" "$DEST/$file"
    echo "ok  $URL/$file"
    ok=$((ok + 1))
  else
    rm -f "$DEST/$file.part"
    echo "wait $URL/$file"
  fi
}
pull hector-build.tar.gz
pull spectral-hx.tar.gz
pull osv01d.iso
pull osv01d.img.xz
echo "downloads in $DEST ($ok files). community: $URL/community/"
