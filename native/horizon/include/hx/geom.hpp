#pragma once
#include <cmath>

namespace hx {

inline float laplacian(float self, const float* nbr, int n) {
  float s = 0.f;
  for (int i = 0; i < n; ++i) s += nbr[i] - self;
  return s;
}

inline float curvature(const float* h, int n) {
  if (n <= 0) return 1.f;
  float s = 0.f;
  for (int i = 0; i < n; ++i) {
    float lap = 0.f;
    if (i) lap += h[i - 1] - h[i];
    if (i + 1 < n) lap += h[i + 1] - h[i];
    s += std::fabs(lap);
  }
  return s / static_cast<float>(n);
}

inline float heat_step(float self, const float* nbr, int n, float dt) {
  float x = self + dt * laplacian(self, nbr, n);
  if (x < 0.f) return 0.f;
  if (x > 1.f) return 1.f;
  return x;
}

inline float forman(float hu, float hv, int du, int dv) {
  if (du < 1) du = 1;
  if (dv < 1) dv = 1;
  return hu + hv - (du - 1) * hu - (dv - 1) * hv;
}

inline int delay_ms(float k) {
  if (k < 0.f) k = 0.f;
  return static_cast<int>(32.f + k * 160.f + 0.5f);
}

}
