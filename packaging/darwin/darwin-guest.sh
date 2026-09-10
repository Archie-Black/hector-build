#!/usr/bin/env bash
# Hector Darwin seat — QEMU with Cinema 30″ 2560×1600, webconnect, USB tablet.
# Drops a PureDarwin/Darwin ISO at packaging/darwin/darwin.iso when you have one.
# Without an ISO the compositor still runs; this script is the hardware jail.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="$ROOT/data/kvm"
ISO=""
for c in "$ROOT/packaging/darwin/darwin.iso" "$ROOT/packaging/darwin/puredarwin.iso" "$ROOT/packaging/guest/alpine-virt-x86_64.iso"; do
  [[ -f "$c" ]] && ISO="$c" && break
done
PIDF="$DIR/darwin.pid"
LOG="$DIR/darwin.log"
VNC=5901
WS=5701
WEB=6081
MEM="${HECTOR_DARWIN_MEM:-2048}"
CPUS="${HECTOR_DARWIN_CPUS:-2}"
W=2560
H=1600

mkdir -p "$DIR"

QEMU="${QEMU:-}"
if [[ -z "$QEMU" ]]; then
  if [[ -x "$ROOT/runtime/qemu/qemu-system-x86_64" ]]; then QEMU="$ROOT/runtime/qemu/qemu-system-x86_64"
  elif command -v qemu-system-x86_64 >/dev/null 2>&1; then QEMU="$(command -v qemu-system-x86_64)"
  else QEMU="qemu-system-x86_64"
  fi
fi

accel() {
  case "$(uname -s)" in
    Darwin) echo hvf ;;
    Linux) [[ -e /dev/kvm ]] && echo kvm || echo tcg ;;
    MINGW*|MSYS*|CYGWIN*|Windows_NT) echo whpx ;;
    *) echo tcg ;;
  esac
}

status() {
  if [[ -f "$PIDF" ]] && kill -0 "$(cat "$PIDF")" 2>/dev/null; then
    echo "LIVE pid=$(cat "$PIDF") vnc=127.0.0.1:$VNC webconnect=127.0.0.1:$WEB retina=${W}x${H}"
  else
    echo "DOWN qemu=$(command -v "$QEMU" >/dev/null && echo yes || echo STUB) iso=${ISO:-none} accel=$(accel)"
  fi
}

start() {
  command -v "$QEMU" >/dev/null 2>&1 || { echo "STUB: qemu missing — compositor still live"; exit 0; }
  if [[ -f "$PIDF" ]] && kill -0 "$(cat "$PIDF")" 2>/dev/null; then status; return 0; fi
  : >"$LOG"
  A=$(accel)
  CD=()
  [[ -n "$ISO" ]] && CD=(-cdrom "$ISO" -boot d)
  "$QEMU" \
    -machine "q35,accel=${A}:tcg" \
    -m "$MEM" -smp "$CPUS" \
    -name hector-darwin \
    -device "virtio-vga,edid=on,xres=$W,yres=$H" \
    -usb -device usb-kbd -device usb-tablet \
    -nic "user,model=virtio-net-pci,hostfwd=tcp:127.0.0.1:2223-:22,hostfwd=tcp:127.0.0.1:${WEB}-:6081" \
    -vnc "127.0.0.1:1,websocket=${WS}" \
    "${CD[@]}" \
    -pidfile "$PIDF" \
    -serial "file:$LOG" \
    -daemonize
  status
}

stop() {
  if [[ -f "$PIDF" ]]; then
    kill "$(cat "$PIDF")" 2>/dev/null || true
    sleep 0.3
    kill -9 "$(cat "$PIDF")" 2>/dev/null || true
    rm -f "$PIDF"
  fi
  echo DOWN
}

cmd="${1:-status}"
case "$cmd" in
  start|stop|status) "$cmd" ;;
  *) echo "usage: $0 start|stop|status"; exit 1 ;;
esac
