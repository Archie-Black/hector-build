import { hyper } from "@/lib/geometry/hyper-memory";
import { createWasi } from "@/lib/geometry/wasi";

type WasmApi = {
  memory: WebAssembly.Memory;
  mdv_alloc: (n: number) => number;
  mdv_run: (n: number) => number;
  mdv_result_ptr: () => number;
  mdv_result_len: () => number;
};

let api: WasmApi | null = null;
let loading: Promise<WasmApi | null> | null = null;
let wasiOn = false;
let filesRef: () => Record<string, string> = () => ({});

export function setWasmFiles(fn: () => Record<string, string>) {
  filesRef = fn;
}

export function rustEngineReady() {
  return api !== null;
}

export function wasiEngineReady() {
  return wasiOn;
}

export function hyperStats() {
  return hyper.stats();
}

async function instantiate(buf: ArrayBuffer) {
  const wasi = createWasi(filesRef, () => undefined);
  const imports: WebAssembly.Imports = {
    wasi_snapshot_preview1: wasi.wasi_snapshot_preview1 as unknown as WebAssembly.ModuleImports,
    env: { memory: hyper.memory },
    wasi: wasi.wasi_snapshot_preview1 as unknown as WebAssembly.ModuleImports,
  };
  try {
    return await WebAssembly.instantiate(buf, imports);
  } catch {
    return WebAssembly.instantiate(buf, {});
  }
}

export async function loadMdvWasm() {
  if (api) return api;
  if (loading) return loading;
  loading = (async () => {
    try {
      const urls = ["/hx-vector-wasi.wasm", "/hx-vector.wasm"];
      let buf: ArrayBuffer | null = null;
      let usedWasiFile = false;
      for (const url of urls) {
        const res = await fetch(url);
        if (!res.ok) continue;
        buf = await res.arrayBuffer();
        usedWasiFile = url.includes("wasi");
        break;
      }
      if (!buf) return null;
      const result = await instantiate(buf);
      const inst = result.instance;
      const exp = inst.exports as Record<string, unknown>;
      const mem = (exp.memory as WebAssembly.Memory | undefined) ?? hyper.memory;
      hyper.wrap(mem);
      hyper.alloc("boot", 64);
      wasiOn = WebAssembly.Module.imports(result.module).some(
        (i) => i.module === "wasi_snapshot_preview1" || i.module === "wasi",
      ) || usedWasiFile;
      api = {
        memory: mem,
        mdv_alloc: exp.mdv_alloc as (n: number) => number,
        mdv_run: exp.mdv_run as (n: number) => number,
        mdv_result_ptr: exp.mdv_result_ptr as () => number,
        mdv_result_len: exp.mdv_result_len as () => number,
      };
      if (typeof api.mdv_alloc !== "function") return null;
      return api;
    } catch {
      return null;
    }
  })();
  return loading;
}

export function wasmCall(payload: unknown): Record<string, unknown> | null {
  if (!api) return null;
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  hyper.nest();
  const ptr = api.mdv_alloc(bytes.length);
  hyper.claim(ptr, bytes.length, "mdv-in");
  new Uint8Array(api.memory.buffer, ptr, bytes.length).set(bytes);
  const n = api.mdv_run(bytes.length);
  hyper.unnest();
  if (n < 0) return null;
  const outPtr = api.mdv_result_ptr();
  const outLen = api.mdv_result_len();
  hyper.claim(outPtr, outLen, "mdv-out");
  const json = new TextDecoder().decode(new Uint8Array(api.memory.buffer, outPtr, outLen));
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function rustSearch(files: Record<string, string>, query: string, k = 8) {
  filesRef = () => files;
  const raw = wasmCall({ op: "search", files, query, k, now_ms: Date.now() });
  if (!raw) return null;
  return raw as unknown as {
    engine: string;
    docs: number;
    hits: { path: string; offset: number; score: number; text: string; x: number; y: number; z: number; layer: string; hits: number }[];
  };
}

export function rustEmbed(text: string) {
  return wasmCall({ op: "embed", text });
}

export function rustIndex(files: Record<string, string>) {
  filesRef = () => files;
  return wasmCall({ op: "index", files });
}

export function rustFathom(files: Record<string, string>) {
  filesRef = () => files;
  return wasmCall({ op: "fathom", files });
}

export function wasmBytes() {
  return api?.memory.buffer.byteLength ?? hyper.stats().bytes;
}
