import { embed, pointOf } from "@/lib/geometry/embed";

const PAGE = 65536;

function morton12(x: number, y: number) {
  let z = 0;
  for (let i = 0; i < 12; i++) {
    z |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1));
  }
  return z >>> 0;
}

function binOf(tag: string) {
  const p = pointOf(embed(tag));
  return morton12(Math.floor(p.x * 4095), Math.floor(p.y * 4095));
}

export type HyperSlab = {
  morton: number;
  ptr: number;
  cap: number;
  used: number;
  nest: number;
  tag: string;
};

export type HyperStats = {
  pages: number;
  bins: number;
  claims: number;
  nested: number;
  bytes: number;
};

/** Geometric allocator over WASM linear memory. Addresses stay linear (WASM). Layout is voxels. */
export class HyperMemory {
  memory: WebAssembly.Memory;
  slabs = new Map<number, HyperSlab>();
  claims = new Map<number, { size: number; morton: number; tag: string }>();
  bump = 64;
  nestDepth = 0;

  constructor(memory?: WebAssembly.Memory) {
    this.memory = memory ?? new WebAssembly.Memory({ initial: 16, maximum: 2048 });
  }

  wrap(memory: WebAssembly.Memory) {
    this.memory = memory;
    return this;
  }

  pages() {
    return this.memory.buffer.byteLength / PAGE;
  }

  grow(pages: number) {
    try {
      this.memory.grow(pages);
      return true;
    } catch {
      return false;
    }
  }

  ensure(bytes: number) {
    const need = this.bump + bytes + 32;
    while (this.memory.buffer.byteLength < need) {
      if (!this.grow(1)) return false;
    }
    return true;
  }

  nest() {
    this.nestDepth += 1;
    return this.nestDepth;
  }

  unnest() {
    this.nestDepth = Math.max(0, this.nestDepth - 1);
  }

  alloc(tag: string, size: number) {
    const n = Math.max(8, (size + 7) & ~7);
    const morton = binOf(tag);
    let slab = this.slabs.get(morton);
    if (!slab || slab.used + n > slab.cap) {
      if (!this.ensure(Math.max(n, 4096))) return 0;
      const cap = Math.max(n, 4096);
      slab = { morton, ptr: this.bump, cap, used: 0, nest: this.nestDepth, tag };
      this.bump += cap;
      this.slabs.set(morton, slab);
    }
    const ptr = slab.ptr + slab.used;
    slab.used += n;
    this.claims.set(ptr, { size: n, morton, tag });
    return ptr;
  }

  claim(ptr: number, size: number, tag: string) {
    this.claims.set(ptr, { size, morton: binOf(tag), tag });
  }

  free(ptr: number) {
    this.claims.delete(ptr);
  }

  compact() {
    let nested = 0;
    for (const s of this.slabs.values()) if (s.nest > 0) nested += 1;
    return nested;
  }

  stats(): HyperStats {
    return {
      pages: this.pages(),
      bins: this.slabs.size,
      claims: this.claims.size,
      nested: this.compact(),
      bytes: this.memory.buffer.byteLength,
    };
  }
}

export const hyper = new HyperMemory();
