#pragma once
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <vector>

namespace hx {

/** Ours. Voxel Plugin / Zylann hook later. Crater now. */
struct Grid {
  int n = 32;
  std::vector<float> h; // 0 intact … 1 gone
  Grid() : h(static_cast<size_t>(n * n), 0.f) {}
};

inline int at(const Grid& g, int x, int y) {
  x = std::clamp(x, 0, g.n - 1);
  y = std::clamp(y, 0, g.n - 1);
  return y * g.n + x;
}

inline float crater(Grid& g, float wx, float wy, float ke) {
  const float r = std::min(8.f, 0.6f + std::sqrt(ke) * 0.04f);
  float mass = 0;
  const int cx = static_cast<int>(wx);
  const int cy = static_cast<int>(wy);
  const int ir = static_cast<int>(r) + 1;
  for (int y = cy - ir; y <= cy + ir; y++) {
    for (int x = cx - ir; x <= cx + ir; x++) {
      if (x < 0 || y < 0 || x >= g.n || y >= g.n) continue;
      const float d = std::hypot(static_cast<float>(x) - wx, static_cast<float>(y) - wy);
      if (d > r) continue;
      const float cut = (1.f - d / r) * std::min(1.f, ke / 400.f);
      float& cell = g.h[static_cast<size_t>(at(g, x, y))];
      const float add = std::min(1.f - cell, cut);
      cell += add;
      mass += add;
    }
  }
  return mass;
}

inline void regenerate(Grid& g, float dt, float rate = 0.08f) {
  for (float& c : g.h) c = std::max(0.f, c - rate * dt);
}

} // namespace hx
