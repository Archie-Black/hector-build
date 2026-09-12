#pragma once
#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

namespace hx {

/** Kauffman-style hash of a chunk delta. Replaces a SQL row. */
inline uint64_t knot(const void* p, size_t n) {
  const auto* b = static_cast<const uint8_t*>(p);
  uint64_t h = 1469598103934665603ull;
  for (size_t i = 0; i < n; ++i) {
    h ^= b[i];
    h *= 1099511628211ull;
  }
  return h;
}

struct Chunk {
  int32_t x = 0, y = 0, z = 0;
  uint64_t inv = 0;
  std::vector<uint8_t> delta;
  void seal() { inv = knot(delta.data(), delta.size()) ^ knot(&x, 12); }
};

struct Inventory {
  uint64_t inv = 0;
  std::vector<uint32_t> items;
  void seal() { inv = knot(items.data(), items.size() * 4); }
};

inline bool same(const Chunk& a, const Chunk& b) { return a.inv == b.inv && a.x == b.x && a.y == b.y && a.z == b.z; }

} // namespace hx
