#pragma once
#include <cmath>
#include <cstdint>
#include <vector>

namespace hx {

/** Ghost Kart: Warzone. Pacejka-style slip. Open-wheel scream. Carnage. Original. */

struct Tape {
  float x, y, yaw, v, t;
};

struct Kart {
  float x = 0, y = 0, yaw = 0, v = 0, rpm = 800, heat = 0;
  float hp = 100, drift = 0;
  bool ghost = false;
  std::vector<Tape> tape;
};

inline float pacejka(float slip, float B = 10, float C = 1.9f, float D = 1, float E = 0.97f) {
  const float x = B * slip;
  return D * std::sin(C * std::atan(x - E * (x - std::atan(x))));
}

inline void step(Kart& k, float thr, float steer, float dt, bool fire) {
  const float slip = steer * 0.35f + k.drift * 0.02f;
  const float fx = pacejka(thr * 0.4f);
  const float fy = pacejka(slip);
  k.v += (fx * 28.f - k.v * 0.42f) * dt;
  if (k.v < 0) k.v = 0;
  k.yaw += (fy * 2.4f + steer * (0.8f + k.v * 0.04f)) * dt;
  k.x += std::cos(k.yaw) * k.v * dt;
  k.y += std::sin(k.yaw) * k.v * dt;
  k.rpm = 800.f + k.v * 420.f;
  if (k.rpm > 14500.f) k.rpm = 14500.f;
  k.drift = k.drift * 0.92f + std::fabs(steer) * k.v * 0.08f;
  if (fire) {
    k.heat = 1.f;
    k.hp -= 4.f;
  }
  k.heat *= 0.94f;
  if (!k.ghost) k.tape.push_back({k.x, k.y, k.yaw, k.v, static_cast<float>(k.tape.size()) * dt});
}

/** Grid scream. High-rev open-wheel. Not a licensed recording. */
inline void scream(float* o, int n, float rpm, float sr) {
  const float f = 90.f + rpm * 0.19f;
  const float g = 0.18f + rpm / 22000.f;
  for (int i = 0; i < n; i++) {
    const float t = static_cast<float>(i) / sr;
    const float saw = 2.f * std::fmod(t * f, 1.f) - 1.f;
    const float sq = saw > 0 ? 1.f : -1.f;
    const float hiss = std::sin(t * 7919.f) * 0.08f;
    o[i] = (saw * 0.55f + sq * 0.28f + hiss) * g;
  }
}

inline Kart ghost_of(const Kart& live, float t) {
  Kart g = live;
  g.ghost = true;
  if (live.tape.empty()) return g;
  const Tape& a = live.tape[std::min(static_cast<size_t>(t / 0.016f), live.tape.size() - 1)];
  g.x = a.x;
  g.y = a.y;
  g.yaw = a.yaw;
  g.v = a.v;
  g.hp = 100;
  return g;
}

} // namespace hx
