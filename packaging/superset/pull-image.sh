#!/usr/bin/env bash
set -euo pipefail
IMAGE="${SUPERSET_IMAGE:-apache/superset:GHA-dev-34215550932}"
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not on this machine. Install Docker, then re-run."
  echo "  docker pull $IMAGE"
  exit 1
fi
docker pull "$IMAGE"
echo "Pulled $IMAGE (internal warehouse — no login)."
