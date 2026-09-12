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
chmod +x "$PREFIX/packaging/linux/"*.sh "$PREFIX/native/horizon/scripts/"*.sh || true
make -C "$PREFIX/native/horizon" || true
echo "Launch: $HOME/.local/bin/osv01d"
echo "Wayland session: native/v01d/wayland/session.sh"
echo "Doctor: bash $PREFIX/packaging/linux/doctor.sh"
