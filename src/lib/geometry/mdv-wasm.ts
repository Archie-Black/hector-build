type WasmApi = {
  memory: WebAssembly.Memory;
  mdv_alloc: (n: number) => number;
  mdv_run: (n: number) => number;
  mdv_result_ptr: () => number;
  mdv_result_len: () => number;
};

let api: WasmApi | null = null;
let loading: Promise<WasmApi | null> | null = null;

export function rustEngineReady() {
  return api !== null;
}

export async function loadMdvWasm() {
  if (api) return api;
  if (loading) return loading;
  loading = (async () => {
    try {
      const res = await fetch("/hx-vector.wasm");
      if (!res.ok) return null;
      const { instance } = await WebAssembly.instantiateStreaming(res, {});
      const exp = instance.exports as Record<string, unknown>;
      api = {
        memory: exp.memory as WebAssembly.Memory,
        mdv_alloc: exp.mdv_alloc as (n: number) => number,
        mdv_run: exp.mdv_run as (n: number) => number,
        mdv_result_ptr: exp.mdv_result_ptr as () => number,
        mdv_result_len: exp.mdv_result_len as () => number,
      };
      return api;
    } catch {
      return null;
    }
  })();
  return loading;
}

export function rustSearch(files: Record<string, string>, query: string, k = 8) {
  if (!api) return null;
  const payload = JSON.stringify({ files, query, k, now_ms: Date.now() });
  const bytes = new TextEncoder().encode(payload);
  const ptr = api.mdv_alloc(bytes.length);
  new Uint8Array(api.memory.buffer, ptr, bytes.length).set(bytes);
  const n = api.mdv_run(bytes.length);
  if (n < 0) return null;
  const outPtr = api.mdv_result_ptr();
  const outLen = api.mdv_result_len();
  const json = new TextDecoder().decode(new Uint8Array(api.memory.buffer, outPtr, outLen));
  return JSON.parse(json) as {
    engine: string;
    docs: number;
    hits: { path: string; offset: number; score: number; text: string; x: number; y: number; z: number; layer: string; hits: number }[];
  };
}
