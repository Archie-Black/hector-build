Hector Darwin
=============

Open Darwin (XNU + Mach + BSD + IOKit), upgraded for Hector:

  • Mach ports are capabilities with knot rights. A stolen name is not a stolen right.
  • launchd jobs are agents. Webconnect and KVM start at bootstrap.
  • Quartz backing is 2×. Default glass is Cinema Display 30″ — 2560×1600, 16:10.
  • IOKit HID is the Mac↔PC KVM switch. ⌘ on Darwin is Ctrl on the PC.

This is not macOS and does not ship Apple binaries.

Drop a PureDarwin (or other APSL Darwin) ISO here as darwin.iso if you want
QEMU to boot a real Darwin kernel. Without it, Hector still runs the Darwin
seat: Retina compositor, webconnect, keymap, agent grab.

  bash packaging/darwin/darwin-guest.sh start

Accel: KVM on Linux, HVF on a Mac, WHPX on Windows, TCG otherwise.
Webconnect: same-origin /api/v1/kvm  (classic port 6081).
KVM cycle: Ctrl+Shift+\  (⌘⇧\ on the Darwin seat).
