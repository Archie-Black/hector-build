#pragma once
#include <algorithm>
#include <cmath>
#include <cstdint>

namespace hx {

/** Moon twitch. 0.16 g. Slide, dash, dive. Original. Not a clone. */
inline constexpr float MOON_G = 9.80665f * 0.16f;

enum class Gait : uint8_t { Run, Slide, Dash, Dive, Air };

struct Omni {
  float x = 0, y = 0, z = 1.8f;
  float vx = 0, vy = 0, vz = 0;
  float g = MOON_G;
  Gait gait = Gait::Run;
  float cool = 0;
};

inline void wish(Omni& p, float fx, float fy, float dt, bool slide, bool dash, bool dive) {
  p.cool = std::max(0.f, p.cool - dt);
  const float ground = p.z <= 1.81f;
  if (!ground) p.gait = Gait::Air;
  else if (dive && p.cool <= 0) {
    p.gait = Gait::Dive;
    p.vx *= 1.35f;
    p.vy *= 1.35f;
    p.vz = 2.2f;
    p.cool = 0.7f;
  } else if (dash && p.cool <= 0) {
    p.gait = Gait::Dash;
    const float n = std::hypot(fx, fy);
    if (n > 0.01f) {
      p.vx += (fx / n) * 18.f;
      p.vy += (fy / n) * 18.f;
    }
    p.cool = 0.45f;
  } else if (slide && ground) {
    p.gait = Gait::Slide;
  } else if (ground) {
    p.gait = Gait::Run;
  }
  const float acc = p.gait == Gait::Slide ? 8.f : 22.f;
  const float drag = p.gait == Gait::Slide ? 0.4f : 6.f;
  p.vx += (fx * acc - p.vx * drag) * dt;
  p.vy += (fy * acc - p.vy * drag) * dt;
  p.vz -= p.g * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.z += p.vz * dt;
  if (p.z < 1.8f) {
    p.z = 1.8f;
    p.vz = 0;
  }
}

inline void into_rig(Omni& p, float& rvx, float& rvy) {
  rvx += p.vx;
  rvy += p.vy;
  p.vx = p.vy = p.vz = 0;
  p.gait = Gait::Run;
}

} // namespace hx
