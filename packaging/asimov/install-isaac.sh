#!/usr/bin/env bash
# Full NVIDIA Isaac Sim 6.1.0 for Asimov 01. Latest GA (Sept 2026).
# Pip (Python 3.12) + ROS 2 extra + Docker 6.1.0 + standalone zip when disk and RTX allow.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ISAAC_VER="6.1.0"
PIP_VER="6.1.0.0"
PREFIX="${HECTOR_PREFIX:-$HOME/.local/share/hector-build}"
ENV="$PREFIX/isaac/env_isaacsim"
echo "Asimov 01 — Isaac Sim $ISAAC_VER"

export OMNI_KIT_ACCEPT_EULA=YES
export PRIVACY_CONSENT=Y

if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia-smi | head -8 || true
else
  echo "No NVIDIA RTX on this machine. Scripts and source stay. GPU app waits for an RTX box."
fi

PY=""
for c in python3.12 python3; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -n "$PY" ]; then
  ver="$($PY -c 'import sys; print("%d.%d"%sys.version_info[:2])')"
  mkdir -p "$PREFIX/isaac"
  if [ "$ver" = "3.12" ]; then
    "$PY" -m venv "$ENV"
    # shellcheck disable=SC1091
    source "$ENV/bin/activate"
    python -m pip install --upgrade pip
    python -m pip install torch==2.11.0 --index-url https://download.pytorch.org/whl/cu128 || python -m pip install torch==2.11.0 || true
    python -m pip install "isaacsim[all,extscache,ros2]==${PIP_VER}" --extra-index-url https://pypi.nvidia.com || echo "isaacsim pip needs NVIDIA index + Python 3.12 on the host."
    python -m pip install "isaaclab[isaacsim]" --extra-index-url https://pypi.nvidia.com || true
    deactivate || true
  else
    echo "Python $ver here. Isaac Sim $ISAAC_VER wants 3.12. Install python3.12 then re-run."
  fi
fi

if command -v docker >/dev/null 2>&1; then
  docker pull nvcr.io/nvidia/isaac-sim:${ISAAC_VER} || echo "Docker pull needs NGC access and ~10GB."
fi

ZIP="https://download.isaacsim.nvidia.com/isaac-sim-standalone-${ISAAC_VER}-linux-x86_64.zip"
if command -v nvidia-smi >/dev/null 2>&1 && [ "${ISAAC_STANDALONE:-}" = "1" ]; then
  mkdir -p "$PREFIX/isaac/standalone"
  curl -L --fail -o /tmp/isaac-sim-standalone.zip "$ZIP" && unzip -qo /tmp/isaac-sim-standalone.zip -d "$PREFIX/isaac/standalone" || echo "Standalone zip skipped."
  if [ -x "$PREFIX/isaac/standalone/post_install.sh" ]; then
    (cd "$PREFIX/isaac/standalone" && ./post_install.sh) || true
  fi
fi

echo "Isaac Sim $ISAAC_VER source: $ROOT/vendor/isaac/IsaacSim"
echo "Isaac Lab source: $ROOT/vendor/isaac/IsaacLab"
echo "Launch (GPU host): OMNI_KIT_ACCEPT_EULA=YES isaacsim isaacsim.exp.full"
echo "Headless: isaacsim isaacsim.exp.full.streaming --no-window"
echo "Docker: docker run --gpus all -e ACCEPT_EULA=Y -e PRIVACY_CONSENT=Y --rm --network=host nvcr.io/nvidia/isaac-sim:${ISAAC_VER}"
