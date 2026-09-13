/** Commands to prove dual-core, FIFO, firmware timer. Copy, run, read. */

export const DIAG = [
  "systemd-analyze verify packaging/arch/dual-core/osv01d-cores.service",
  "systemctl daemon-reload",
  "systemctl enable --now osv01d-cores.service",
  "systemctl status osv01d-cores.service --no-pager -l",
  "journalctl -u osv01d-cores.service -n 50 --no-pager",
  "ls -l /run/osv01d/cores.in",
  "printf 'thanks\\n' > /run/osv01d/cores.in",
  "printf 'ffmpeg -i a.wav b.mp3\\n' > /run/osv01d/cores.in",
  "tail -n 20 /var/log/osv01d/diplomat.log /var/log/osv01d/machine.log",
  "systemctl list-timers osv01d-firmware.timer --no-pager",
  "fwupdmgr get-updates",
  "npx vitest run src/lib/hector/cores.test.ts src/lib/v01d/horizon.test.ts",
  "bash packaging/arch/dual-core/verify.sh",
  "pw-cli ls Node | grep diplomat",
  "systemctl --user enable --now osv01d-hear.service",
  "systemctl --user status osv01d-hear.service --no-pager",
  "bash packaging/arch/sign.sh",
  "sha256sum -c packaging/arch/SHA256SUMS",
] as const;

export function wantsDiagnose(text: string) {
  return /\b(diagnos(e|tic)|verify (the )?(unit|service|cores|install)|systemctl status)\b/i.test(text);
}

export function sayDiagnose() {
  return `Run these:\n${DIAG.join("\n")}`;
}
