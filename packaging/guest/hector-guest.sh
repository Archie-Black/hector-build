#!/usr/bin/env bash
# Hector Guest — Alpine + QEMU, virtio, share, SSH, serial, wipe.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="$ROOT/data/guest"
ISO="$ROOT/packaging/guest/alpine-virt-x86_64.iso"
DISK="$DIR/hector-guest.qcow2"
SNAP="$DIR/hector-guest-snap.qcow2"
LOG="$DIR/serial.log"
PIDF="$DIR/qemu.pid"
MON="$DIR/monitor.sock"
QEMU="${QEMU:-}"
if [[ -z "$QEMU" ]]; then
  if [[ -x "$ROOT/runtime/qemu/qemu-system-x86_64" ]]; then
    QEMU="$ROOT/runtime/qemu/qemu-system-x86_64"
  else
    QEMU="qemu-system-x86_64"
  fi
fi
QIMG="${QEMU_IMG:-}"
if [[ -z "$QIMG" ]]; then
  if [[ -x "$ROOT/runtime/qemu/qemu-img" ]]; then
    QIMG="$ROOT/runtime/qemu/qemu-img"
  else
    QIMG="qemu-img"
  fi
fi
SHARE="${HECTOR_SHARE:-$ROOT}"
MEM="${HECTOR_GUEST_MEM:-512}"
CPUS="${HECTOR_GUEST_CPUS:-2}"
SSH_PORT="${HECTOR_GUEST_SSH:-2222}"

mkdir -p "$DIR"

have_qemu() { command -v "$QEMU" >/dev/null 2>&1 || [[ -x "$QEMU" ]]; }

status() {
  if [[ -f "$PIDF" ]] && kill -0 "$(cat "$PIDF")" 2>/dev/null; then
    echo "LIVE pid=$(cat "$PIDF") ssh=127.0.0.1:$SSH_PORT share=$SHARE"
  else
    echo "DOWN qemu=$(have_qemu && echo yes || echo STUB) iso=$([[ -f $ISO ]] && echo yes || echo missing)"
  fi
}

create_disk() {
  [[ -x "$QIMG" ]] || command -v "$QIMG" >/dev/null || return 0
  [[ -f "$DISK" ]] || "$QIMG" create -f qcow2 "$DISK" 8G
}

start() {
  have_qemu || { echo "STUB: qemu-system-x86_64 not on PATH"; exit 2; }
  [[ -f "$ISO" ]] || { echo "STUB: Alpine ISO missing"; exit 2; }
  if [[ -f "$PIDF" ]] && kill -0 "$(cat "$PIDF")" 2>/dev/null; then
    status
    return 0
  fi
  create_disk
  : >"$LOG"
  KVM=()
  [[ -e /dev/kvm ]] && KVM=(-enable-kvm -cpu host)
  "$QEMU" \
    "${KVM[@]}" \
    -machine q35,accel=kvm:tcg \
    -m "$MEM" \
    -smp "$CPUS" \
    -name hector-guest \
    -drive "file=$DISK,if=virtio,cache=writeback,discard=unmap" \
    -cdrom "$ISO" \
    -boot order=dc \
    -virtfs "local,path=$SHARE,mount_tag=hector,security_model=mapped-xattr,id=hector" \
    -netdev "user,id=n0,hostfwd=tcp:127.0.0.1:${SSH_PORT}-:22" \
    -device virtio-net-pci,netdev=n0 \
    -device virtio-rng-pci \
    -device virtio-balloon \
    -nographic \
    -serial "file:$LOG" \
    -monitor "unix:$MON,server,nowait" \
    -pidfile "$PIDF" \
    -daemonize
  status
}

stop() {
  if [[ -f "$PIDF" ]]; then
    kill "$(cat "$PIDF")" 2>/dev/null || true
    sleep 0.4
    kill -9 "$(cat "$PIDF")" 2>/dev/null || true
    rm -f "$PIDF" "$MON"
  fi
  echo DOWN
}

snapshot() {
  command -v qemu-img >/dev/null || { echo "STUB qemu-img"; exit 2; }
  [[ -f "$DISK" ]] || { echo "no disk"; exit 1; }
  cp -f "$DISK" "$SNAP"
  echo "snapshot $SNAP"
}

wipe() {
  stop
  rm -f "$DISK" "$SNAP" "$LOG" "$PIDF" "$MON"
  echo WIPED
}

console() {
  tail -n "${1:-80}" "$LOG" 2>/dev/null || true
}

cmd="${1:-status}"
case "$cmd" in
  start|stop|wipe|status|snapshot|console) "$cmd" "${2:-}" ;;
  *) echo "usage: $0 start|stop|wipe|status|snapshot|console"; exit 1 ;;
esac
