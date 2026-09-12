#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <vector>

namespace hx {

/** Tensor-train cores. Contract on the fly. Never materialize W. */
struct Core {
  int r0 = 1, n = 1, r1 = 1;
  std::vector<float> w; // r0 * n * r1
  float at(int a, int i, int b) const { return w[static_cast<size_t>((a * n + i) * r1 + b)]; }
};

inline Core core(int r0, int n, int r1) {
  Core c{r0, n, r1, std::vector<float>(static_cast<size_t>(r0 * n * r1), 0.f)};
  for (int i = 0; i < n && i < r0 && i < r1; ++i) c.w[static_cast<size_t>((i * n + i) * r1 + i)] = 1.f;
  return c;
}

inline std::vector<float> contract(const std::vector<Core>& tt, const int* idx, int d) {
  std::vector<float> v(1, 1.f);
  for (int k = 0; k < d; ++k) {
    const Core& c = tt[static_cast<size_t>(k)];
    std::vector<float> n(static_cast<size_t>(c.r1), 0.f);
    for (int a = 0; a < c.r0; ++a)
      for (int b = 0; b < c.r1; ++b) n[static_cast<size_t>(b)] += v[static_cast<size_t>(a)] * c.at(a, idx[k], b);
    v.swap(n);
  }
  return v;
}

inline void braid_cores(Core& a, Core& b) {
  const int n = std::min(a.n, b.n);
  for (int i = 0; i < n; ++i) {
    const int ia = std::min(i, a.r0 - 1);
    const int ib = std::min(i, b.r0 - 1);
    const int ja = std::min(i, a.r1 - 1);
    const int jb = std::min(i, b.r1 - 1);
    float& x = a.w[static_cast<size_t>((ia * a.n + i) * a.r1 + ja)];
    float& y = b.w[static_cast<size_t>((ib * b.n + i) * b.r1 + jb)];
    const float t = x;
    x = 0.5f * (x + y);
    y = 0.5f * (t + y);
  }
}

} // namespace hx
