#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PREFIX="${HECTOR_PREFIX:-$HOME/.local/share/hector-build}"
echo "Installing Hector Build and Spectral HX into $PREFIX"
mkdir -p "$PREFIX"
# Copy the tree the app needs. Do not copy node_modules or huge caches.
if [ "$ROOT" != "$PREFIX" ]; then
  mkdir -p "$PREFIX"
  rsync -a --delete \
    --exclude node_modules --exclude .git --exclude native/chimera/target \
    --exclude artifacts --exclude dist \
    "$ROOT"/ "$PREFIX"/ || cp -a "$ROOT"/. "$PREFIX"/
fi
bash "$PREFIX/packaging/linux/install-node22.sh" "$PREFIX/runtime/node"
export PATH="$PREFIX/runtime/node/bin:$PATH"
cd "$PREFIX"
if [ ! -d node_modules ]; then
  npm install
fi
mkdir -p "$HOME/.local/share/applications" "$HOME/.local/bin"
cp "$PREFIX/packaging/linux/osv01d.desktop" "$HOME/.local/share/applications/osv01d.desktop"
sed -i "s|@PREFIX@|$PREFIX|g" "$HOME/.local/share/applications/osv01d.desktop" || true
ln -sf "$PREFIX/packaging/linux/osv01d.sh" "$HOME/.local/bin/osv01d"
chmod +x "$PREFIX/packaging/linux/"*.sh "$PREFIX/packaging/linux/hector-open" "$PREFIX/native/horizon/scripts/"*.sh "$PREFIX/packaging/cloud/"*.sh "$PREFIX/packaging/forge/"*.sh "$PREFIX/packaging/suite/"*.sh "$PREFIX/packaging/linux/install-flavor.sh" "$PREFIX/packaging/arch/"*.sh "$PREFIX/packaging/arch/mkiso.sh" || true
make -C "$PREFIX/native/horizon" || true
HECTOR_PREFIX="$PREFIX" bash "$PREFIX/packaging/linux/install-os-games.sh" "$PREFIX" || true
HECTOR_PREFIX="$PREFIX" bash "$PREFIX/packaging/wsl/install.sh" || true
HECTOR_PREFIX="$PREFIX" bash "$PREFIX/packaging/asimov/install.sh" || true
HECTOR_PREFIX="$PREFIX" bash "$PREFIX/packaging/forge/install.sh" "$HOME/v01d/studio" || true
HECTOR_PREFIX="$PREFIX" bash "$PREFIX/packaging/suite/install.sh" || true
HECTOR_PREFIX="$PREFIX" bash "$PREFIX/packaging/linux/fetch-images.sh" || true
ln -sf "$PREFIX/packaging/linux/hector-open" "$HOME/.local/bin/hector-open"
echo "Launch: $HOME/.local/bin/osv01d"
echo "Wayland session: native/v01d/wayland/session.sh"
echo "Doctor: bash $PREFIX/packaging/linux/doctor.sh"
echo "User card: $PREFIX/packaging/linux/USER.md"
echo "ISO: bash $PREFIX/packaging/arch/mkiso.sh"
echo "Cloud fabric (VPS): sudo bash $PREFIX/packaging/cloud/bootstrap_cloud.sh"
echo "Downloads: https://www.doomchat.ca/downloads/"
