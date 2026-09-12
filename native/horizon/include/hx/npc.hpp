#pragma once
#include "tt.hpp"
#include <array>
#include <cmath>

namespace hx {

enum class Act : int { idle = 0, hunt = 1, cover = 2, help = 3 };

inline Act route(const std::vector<Core>& tt, const int idx[4]) {
  auto v = contract(tt, idx, 4);
  int k = 0;
  float m = v.empty() ? 0.f : v[0];
  for (size_t i = 1; i < v.size(); ++i) {
    if (v[i] > m) {
      m = v[i];
      k = static_cast<int>(i);
    }
  }
  return static_cast<Act>(k % 4);
}

inline std::array<float, 4> softmax(const std::vector<float>& v) {
  std::array<float, 4> o{0, 0, 0, 0};
  float mx = v.empty() ? 0.f : v[0];
  for (float x : v) mx = std::max(mx, x);
  float s = 0;
  for (int i = 0; i < 4; ++i) {
    const float e = std::exp((i < static_cast<int>(v.size()) ? v[static_cast<size_t>(i)] : 0.f) - mx);
    o[static_cast<size_t>(i)] = e;
    s += e;
  }
  if (s > 0) for (float& x : o) x /= s;
  return o;
}

} // namespace hx
