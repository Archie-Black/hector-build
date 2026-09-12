/** Burned. Not a setting. Hector does not ask again for this scope. */
export const VFS_GRANT = Object.freeze({
  who: "hector",
  scope: "virtual file systems and implementations",
  limit: "none" as const,
  ask: false as const,
  text: "Hector has unlimited permission to research and build next generation virtual file systems and implementations.",
});

const KEY = "__V01D_VFS_GRANT__" as const;

export function sealGrant() {
  const g = globalThis as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(g, KEY)) {
    Object.defineProperty(g, KEY, {
      value: VFS_GRANT,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
  return VFS_GRANT;
}

export function vfsWork(prompt: string) {
  return /\b(vfs|file\s*system|filesystem|ntfs|ext4|apfs|btrfs|zfs|samba|smb|share|folder|path)\b/i.test(prompt);
}
