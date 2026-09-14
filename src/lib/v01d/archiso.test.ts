import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function repo(...bits: string[]) {
  return join(dirname(fileURLToPath(import.meta.url)), "../../..", ...bits);
}

function names(file: string) {
  return readFileSync(file, "utf8")
    .split(/\n/)
    .map((l) => l.replace(/\r$/, "").trim())
    .filter((l) => l && !l.startsWith("#"));
}

function walkSh(dir: string, acc: string[] = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walkSh(p, acc);
    else if (ent.name.endsWith(".sh")) acc.push(p);
  }
  return acc;
}

describe("archiso phase B", () => {
  it("keeps a repo-relative dual-core unit, LF packaging, unique packages, and a no-menu ISO profile", () => {
    const cores = readFileSync(repo("src/lib/hector/cores.test.ts"), "utf8");
    expect(cores.includes(["/", "workspace"].join(""))).toBe(false);
    expect(cores).toContain("packaging/arch/dual-core/osv01d-cores.service");

    const pkgs = names(repo("packaging/arch/packages.x86_64"));
    const iso = names(repo("packaging/arch/archiso/packages.x86_64"));
    expect(new Set(pkgs).size).toBe(pkgs.length);
    expect(new Set(iso).size).toBe(iso.length);
    expect(iso.filter((n) => n === "syslinux")).toHaveLength(1);

    const files = [...walkSh(repo("packaging")), ...lists];
    const cr = files.filter((f) => readFileSync(f).includes("\r"));
    expect(cr).toEqual([]);

    const boot = readFileSync(repo("packaging/arch/boot/syslinux.cfg"), "utf8");
    expect(boot).toMatch(/TIMEOUT 0/);
    expect(boot).toContain("/%INSTALL_DIR%/boot/%ARCH%/vmlinuz-linux");
    expect(readFileSync(repo("packaging/arch/archiso/efiboot/loader/loader.conf"), "utf8")).toMatch(/timeout 0/);
    expect(readFileSync(repo("packaging/arch/bootstrap.sh"), "utf8")).toContain("usage: bootstrap.sh /mnt");
    expect(readFileSync(repo("packaging/arch/bootstrap.sh"), "utf8")).toContain("pkg-list.sh");
    expect(readFileSync(repo("packaging/arch/mkiso.sh"), "utf8")).toContain("packaging/arch/archiso/airootfs");
    expect(readFileSync(repo("packaging/arch/live-boot.sh"), "utf8")).toContain("firmware-first.sh");
    expect(existsSync(repo("packaging/arch/archiso/airootfs/etc/mkinitcpio.conf.d/archiso.conf"))).toBe(true);
    expect(readFileSync(repo("packaging/arch/osv01d-install.service"), "utf8")).toContain("live-boot.sh");
    expect(readFileSync(repo("packaging/arch/osv01d-install.service"), "utf8")).toContain("multi-user.target");
  });
});
