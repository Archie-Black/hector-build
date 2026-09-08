import { hyper } from "@/lib/geometry/hyper-memory";

const ERRNO = { SUCCESS: 0, BADF: 8, INVAL: 28, NOENT: 44, NOMEM: 48, NOSYS: 52, NOTDIR: 54 } as const;

type Fd = { path: string; kind: "file" | "dir" | "stdout"; data: Uint8Array; pos: number };

function view() {
  return new DataView(hyper.memory.buffer);
}

function u32(ptr: number) {
  return view().getUint32(ptr, true);
}

function su32(ptr: number, v: number) {
  view().setUint32(ptr, v, true);
}

function su64(ptr: number, v: bigint) {
  view().setBigUint64(ptr, v, true);
}

function bytes(ptr: number, len: number) {
  return new Uint8Array(hyper.memory.buffer, ptr, len);
}

function text(ptr: number, len: number) {
  return new TextDecoder().decode(bytes(ptr, len));
}

/** WASI preview 1 host. Paths hash into HyperMemory voxels. */
export function createWasi(files: () => Record<string, string>, stdout: (s: string) => void) {
  const fds = new Map<number, Fd>();
  fds.set(1, { path: "/stdout", kind: "stdout", data: new Uint8Array(), pos: 0 });
  fds.set(2, { path: "/stderr", kind: "stdout", data: new Uint8Array(), pos: 0 });
  fds.set(3, { path: "/", kind: "dir", data: new Uint8Array(), pos: 0 });
  let nextFd = 4;

  function openPath(path: string): number {
    const clean = path.replace(/^\/+/, "");
    const body = files()[clean];
    if (body === undefined && clean !== "" && clean !== ".") return -1;
    const data = new TextEncoder().encode(body ?? Object.keys(files()).join("\n"));
    const fd = nextFd++;
    const slot = hyper.alloc("wasi:" + clean, data.length || 16);
    if (slot && data.length) new Uint8Array(hyper.memory.buffer, slot, data.length).set(data);
    fds.set(fd, { path: clean || "/", kind: body === undefined ? "dir" : "file", data, pos: 0 });
    return fd;
  }

  const wasi_snapshot_preview1: Record<string, (...args: number[]) => number> = {
    args_get: () => ERRNO.SUCCESS,
    args_sizes_get: (argc, argv_buf) => {
      su32(argc, 0);
      su32(argv_buf, 0);
      return ERRNO.SUCCESS;
    },
    environ_get: () => ERRNO.SUCCESS,
    environ_sizes_get: (count, buf) => {
      su32(count, 0);
      su32(buf, 0);
      return ERRNO.SUCCESS;
    },
    clock_res_get: (id, ptr) => {
      su64(ptr, 1000n);
      return ERRNO.SUCCESS;
    },
    clock_time_get: (_id, _prec, ptr) => {
      su64(ptr, BigInt(Date.now()) * 1_000_000n);
      return ERRNO.SUCCESS;
    },
    fd_advise: () => ERRNO.SUCCESS,
    fd_allocate: () => ERRNO.SUCCESS,
    fd_close: (fd) => {
      fds.delete(fd);
      return ERRNO.SUCCESS;
    },
    fd_datasync: () => ERRNO.SUCCESS,
    fd_fdstat_get: (fd, ptr) => {
      const f = fds.get(fd);
      if (!f) return ERRNO.BADF;
      const mem = view();
      mem.setUint8(ptr, f.kind === "dir" ? 3 : 4);
      mem.setUint16(ptr + 2, 0, true);
      su64(ptr + 8, 0n);
      su64(ptr + 16, 0n);
      return ERRNO.SUCCESS;
    },
    fd_fdstat_set_flags: () => ERRNO.SUCCESS,
    fd_filestat_get: () => ERRNO.SUCCESS,
    fd_filestat_set_size: () => ERRNO.SUCCESS,
    fd_filestat_set_times: () => ERRNO.SUCCESS,
    fd_pread: () => ERRNO.NOSYS,
    fd_prestat_get: (fd, ptr) => {
      if (fd !== 3) return ERRNO.BADF;
      view().setUint8(ptr, 0);
      su32(ptr + 4, 1);
      return ERRNO.SUCCESS;
    },
    fd_prestat_dir_name: (fd, ptr, len) => {
      if (fd !== 3) return ERRNO.BADF;
      bytes(ptr, Math.min(len, 1))[0] = "/".charCodeAt(0);
      return ERRNO.SUCCESS;
    },
    fd_pwrite: () => ERRNO.NOSYS,
    fd_read: (fd, iovs, iovsLen, nread) => {
      const f = fds.get(fd);
      if (!f) return ERRNO.BADF;
      let n = 0;
      for (let i = 0; i < iovsLen; i++) {
        const base = iovs + i * 8;
        const p = u32(base);
        const l = u32(base + 4);
        const slice = f.data.subarray(f.pos, f.pos + l);
        bytes(p, slice.length).set(slice);
        f.pos += slice.length;
        n += slice.length;
      }
      su32(nread, n);
      return ERRNO.SUCCESS;
    },
    fd_readdir: () => ERRNO.NOSYS,
    fd_renumber: () => ERRNO.SUCCESS,
    fd_seek: (fd, offsetLo, offsetHi, whence, newoff) => {
      const f = fds.get(fd);
      if (!f) return ERRNO.BADF;
      const off = offsetLo + offsetHi * 0x100000000;
      if (whence === 0) f.pos = off;
      else if (whence === 1) f.pos += off;
      else f.pos = f.data.length + off;
      su64(newoff, BigInt(f.pos));
      return ERRNO.SUCCESS;
    },
    fd_sync: () => ERRNO.SUCCESS,
    fd_tell: (fd, ptr) => {
      const f = fds.get(fd);
      if (!f) return ERRNO.BADF;
      su64(ptr, BigInt(f.pos));
      return ERRNO.SUCCESS;
    },
    fd_write: (fd, iovs, iovsLen, nwritten) => {
      let n = 0;
      let out = "";
      for (let i = 0; i < iovsLen; i++) {
        const base = iovs + i * 8;
        const p = u32(base);
        const l = u32(base + 4);
        out += text(p, l);
        n += l;
      }
      if (fd === 1 || fd === 2) stdout(out);
      su32(nwritten, n);
      return ERRNO.SUCCESS;
    },
    path_create_directory: () => ERRNO.NOSYS,
    path_filestat_get: () => ERRNO.SUCCESS,
    path_filestat_set_times: () => ERRNO.SUCCESS,
    path_link: () => ERRNO.NOSYS,
    path_open: (_fd, _dirflags, pathPtr, pathLen, _oflags, _r1, _r2, _r3, _r4, _fdflags, opened) => {
      const path = text(pathPtr, pathLen);
      const fd = openPath(path);
      if (fd < 0) return ERRNO.NOENT;
      su32(opened, fd);
      return ERRNO.SUCCESS;
    },
    path_readlink: () => ERRNO.NOSYS,
    path_remove_directory: () => ERRNO.NOSYS,
    path_rename: () => ERRNO.NOSYS,
    path_symlink: () => ERRNO.NOSYS,
    path_unlink_file: () => ERRNO.NOSYS,
    poll_oneoff: () => ERRNO.NOSYS,
    proc_exit: (code) => {
      throw new Error("WASI proc_exit " + code);
    },
    proc_raise: () => ERRNO.NOSYS,
    sched_yield: () => ERRNO.SUCCESS,
    random_get: (ptr, len) => {
      const buf = bytes(ptr, len);
      if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(buf);
      else for (let i = 0; i < len; i++) buf[i] = (i * 29) & 255;
      return ERRNO.SUCCESS;
    },
    sock_accept: () => ERRNO.NOSYS,
    sock_recv: () => ERRNO.NOSYS,
    sock_send: () => ERRNO.NOSYS,
    sock_shutdown: () => ERRNO.NOSYS,
  };

  return { wasi_snapshot_preview1 };
}

export function wasiReady(imports: WebAssembly.Imports) {
  return Boolean(imports.wasi_snapshot_preview1?.fd_write);
}
