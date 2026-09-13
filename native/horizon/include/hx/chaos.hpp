#pragma once
#include "hx/niagara.hpp"
#include <cmath>
#include <vector>

namespace hx {

/** Chaos-style rigid. Break → one GPU write. Not a spawn storm. */
struct Body {
  float x = 0, y = 0, z = 0;
  float vx = 0, vy = 0, vz = 0;
  float hp = 100;
  bool broken = false;
};

struct Field {
  std::vector<Body> bodies;
  Channel fx;
};

inline void smash(Field& f, int i, float force) {
  if (i < 0 || static_cast<size_t>(i) >= f.bodies.size()) return;
  Body& b = f.bodies[static_cast<size_t>(i)];
  b.hp -= force;
  b.vx += force * 0.12f;
  if (b.hp <= 0 && !b.broken) {
    b.broken = true;
    f.fx.publish({Burst::Heat, b.x, b.y, b.z, 1.f});
    f.fx.publish(lava(1.f));
  }
}

inline void integrate(Field& f, float dt) {
  for (Body& b : f.bodies) {
    if (b.broken) {
      b.vz -= 9.8f * dt;
      b.z += b.vz * dt;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= 0.98f;
    b.vy *= 0.98f;
  }
}

} // namespace hx
