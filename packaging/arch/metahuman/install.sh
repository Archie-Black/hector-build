#!/usr/bin/env bash
# MetaHuman 5.8 + OpenRigLogic. Creator is an Unreal plugin. Rig is MIT.
set -euo pipefail
ROOT="${OSV01D_MH:-/opt/osv01d/metahuman}"
HERE="$(cd "$(dirname "$0")" && pwd)"
install -d "$ROOT"
if [[ ! -d "$ROOT/OpenRigLogic/.git" ]] && command -v git >/dev/null 2>&1; then
  git clone --depth 1 https://github.com/EpicGames/openriglogic.git "$ROOT/OpenRigLogic" || true
fi
echo "MetaHuman Creator: enable Core Data in the Unreal 5.8 installer, then Plugins > MetaHuman Creator."
echo "OpenRigLogic: $ROOT/OpenRigLogic"
echo "Hector asset script: $HERE/../../../native/horizon/UE/SpectralHorizon/Scripts/hector_metahuman.py"
