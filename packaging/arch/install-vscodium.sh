#!/usr/bin/env bash
# VSCodium on Arch. Spectral HX heavy editor. packaging/linux stays the installer.
set +e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$ROOT/packaging/linux/install-vscodium.sh"
exit 0
