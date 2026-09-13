#!/usr/bin/env bash
# CAS weights. Verify. Stamp. Never abort the suite because Flux is late. DeltaKingZero.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PREFIX="${HECTOR_PREFIX:-$HOME/.local/share/hector-build}"
CAS="$PREFIX/weights/sha256"
DEST="${V01D_WEIGHTS:-$HOME/v01d/suite/weights}"
LEDGER="$PREFIX/weights/ledger.json"
mkdir -p "$CAS" "$DEST" "$(dirname "$LEDGER")"
[[ -f "$LEDGER" ]] || echo '{}' > "$LEDGER"

put() {
  local src="$1" sha="$2" name="$3"
  mkdir -p "$CAS"
  if [[ ! -f "$CAS/$sha" ]]; then
    cp -f "$src" "$CAS/$sha"
  fi
  ln -sfn "$CAS/$sha" "$DEST/$name"
}

TINY="$HERE/weights/ggml-tiny.bin"
WANT="be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21"
if [[ -f "$TINY" ]]; then
  got="$(sha256sum "$TINY" | awk '{print $1}')"
  if [[ "$got" != "$WANT" ]]; then
    echo "tiny corrupt — will refetch if the network is there" >&2
    curl -fL --retry 3 -C - -o "$TINY.part" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin" && mv "$TINY.part" "$TINY" || true
    got="$(sha256sum "$TINY" | awk '{print $1}')"
  fi
  if [[ "$got" == "$WANT" ]]; then
    put "$TINY" "$got" "ggml-tiny.bin"
    echo "ok whisper tiny"
  fi
fi

echo "Flux and SD3.5 stay optional. Hugging Face token pulls them into $CAS"
if command -v huggingface-cli >/dev/null 2>&1 && [[ -n "${HF_TOKEN:-}" ]]; then
  huggingface-cli download black-forest-labs/FLUX.1-schnell --local-dir "$DEST/flux" || echo "flux later"
  huggingface-cli download stabilityai/stable-diffusion-3.5-large --local-dir "$DEST/sd35" || echo "sd35 later"
fi
echo "suite continues"
