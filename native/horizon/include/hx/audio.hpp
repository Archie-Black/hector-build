#pragma once
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <vector>

namespace hx {

struct Hit {
  float t = 0;
  float absorb = 0;
};

/** Spatial path as a braid of delay taps. One fused mix. */
inline void braid_audio(float* out, int n, float sr, const Hit* hits, int nh, const float* src) {
  std::fill(out, out + n, 0.f);
  for (int h = 0; h < nh; ++h) {
    const int d = static_cast<int>(hits[h].t * sr);
    const float g = std::max(0.f, 1.f - hits[h].absorb);
    for (int i = d; i < n; ++i) out[i] += src[i - d] * g;
  }
}

inline std::vector<Hit> bounce(float dist, float walls) {
  std::vector<Hit> h(3);
  h[0] = {dist / 343.f, 0.02f * walls};
  h[1] = {h[0].t * 1.7f, 0.18f + 0.04f * walls};
  h[2] = {h[0].t * 2.9f, 0.45f};
  return h;
}

} // namespace hx
