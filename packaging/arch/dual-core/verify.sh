#!/usr/bin/env bash
# Prove the dual-core unit, FIFO, firmware timer, and Hector tests.
set -u
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
fail=0
say() { printf '%s\n' "$*"; }
ok() { say "ok  $*"; }
bad() { say "FAIL  $*"; fail=1; }

say "== units"
if command -v systemd-analyze >/dev/null; then
  systemd-analyze verify "$ROOT/packaging/arch/dual-core/osv01d-cores.service" && ok "cores unit" || bad "cores unit"
  systemd-analyze verify "$ROOT/packaging/arch/osv01d-firmware-keep.service" && ok "firmware-keep unit" || bad "firmware-keep unit"
else
  say "skip systemd-analyze (not installed)"
fi

if grep -c '\[Service\]' "$ROOT/packaging/arch/dual-core/osv01d-cores.service" | grep -qx 1; then
  ok "one Service block"
else
  bad "Service block count"
fi
if grep -q CPUSchedulingPolicy "$ROOT/packaging/arch/dual-core/osv01d-cores.service"; then
  bad "RR still in unit"
else
  ok "no RR policy"
fi
if grep -q 'Unit=osv01d-firmware-keep.service' "$ROOT/packaging/arch/osv01d-firmware.timer"; then
  ok "timer targets keep"
else
  bad "timer target"
fi

say "== live (if installed)"
if command -v systemctl >/dev/null; then
  systemctl is-enabled osv01d-cores.service 2>/dev/null && ok "cores enabled" || say "cores not enabled"
  systemctl is-active osv01d-cores.service 2>/dev/null && ok "cores active" || say "cores not active"
  systemctl is-active osv01d-firmware.timer 2>/dev/null && ok "firmware timer" || say "firmware timer not active"
  systemctl status osv01d-cores.service --no-pager -l 2>/dev/null | sed -n '1,12p' || true
  journalctl -u osv01d-cores.service -n 20 --no-pager 2>/dev/null || true
  systemctl list-timers osv01d-firmware.timer --no-pager 2>/dev/null || true
fi

say "== fifo + gateway"
if [[ -p /run/osv01d/cores.in ]]; then
  ok "fifo /run/osv01d/cores.in"
  printf '%s\n' "thanks for keeping this clean" > /run/osv01d/cores.in &
  printf '%s\n' "ffmpeg -i a.wav b.mp3" > /run/osv01d/cores.in &
  wait || true
else
  say "fifo not present (daemon not running)"
  python3 - "$ROOT/packaging/arch/dual-core/gateway.py" <<'PY' || bad "gateway import"
import runpy, sys
sys.argv = ["gateway"]
# syntax only
import pathlib
src = pathlib.Path(sys.argv[0] if False else "").name
PY
  python3 -m py_compile "$ROOT/packaging/arch/dual-core/gateway.py" && ok "gateway.py compiles" || bad "gateway.py"
fi

say "== logs"
[[ -f /var/log/osv01d/machine.log ]] && ok "machine.log" || say "no machine.log yet"
[[ -f /var/log/osv01d/diplomat.log ]] && ok "diplomat.log" || say "no diplomat.log yet"
[[ -f /etc/security/limits.d/99-osv01d-rt.conf ]] && ok "rt limits" || say "rt limits not installed"

say "== hector tests"
if command -v npx >/dev/null && [[ -f "$ROOT/package.json" ]]; then
  (cd "$ROOT" && npx vitest run src/lib/hector/cores.test.ts src/lib/v01d/horizon.test.ts --reporter=dot) && ok "vitest cores+horizon" || bad "vitest"
else
  say "skip vitest"
fi

say "== signatures"
if [[ -f "$ROOT/packaging/arch/SHA256SUMS" ]]; then
  (cd "$ROOT" && sha256sum -c packaging/arch/SHA256SUMS) && ok "sha256" || bad "sha256"
else
  bad "SHA256SUMS missing"
fi
if [[ -f "$ROOT/packaging/arch/SHA256SUMS.asc" ]]; then
  gpg --verify "$ROOT/packaging/arch/SHA256SUMS.asc" "$ROOT/packaging/arch/SHA256SUMS" && ok "gpg sums" || bad "gpg sums"
else
  say "no gpg sig yet (hashes only). makepkg --sign after a key exists."
fi
cat <<'EOF'
systemd-analyze verify packaging/arch/dual-core/osv01d-cores.service
systemctl daemon-reload
systemctl enable --now osv01d-cores.service
systemctl status osv01d-cores.service --no-pager -l
journalctl -u osv01d-cores.service -n 50 --no-pager
ls -l /run/osv01d/cores.in
printf 'thanks\n' > /run/osv01d/cores.in
printf 'ffmpeg -i a.wav b.mp3\n' > /run/osv01d/cores.in
tail -n 20 /var/log/osv01d/diplomat.log /var/log/osv01d/machine.log
systemctl list-timers osv01d-firmware.timer --no-pager
fwupdmgr get-updates
npx vitest run src/lib/hector/cores.test.ts src/lib/v01d/horizon.test.ts
bash packaging/linux/doctor.sh
EOF

exit "$fail"
