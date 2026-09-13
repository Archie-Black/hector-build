#pragma once
#include "hx/voxel.hpp"
#include <vector>

namespace hx {

struct Hit {
  float x, y, z, mass, v;
};

struct Tally {
  float combo = 1;
  float window = 0;
  float points = 0;
  float scrap = 0;
  int chain = 0;
};

inline float kinetic(float mass, float v) { return 0.5f * mass * v * v; }

inline void impact(Tally& t, Grid& g, const Hit& h) {
  if (t.window <= 0) {
    t.combo = 1;
    t.chain = 0;
  }
  const float ke = kinetic(h.mass, h.v);
  const float m = crater(g, h.x, h.y, ke);
  if (m <= 0.001f) return;
  t.chain++;
  t.combo = t.combo > 7.6f ? 8.f : 1.f + t.chain * 0.35f;
  t.window = 1.8f;
  const float pts = m * h.v * t.combo;
  t.points += pts;
  t.scrap += pts * 0.15f;
}

struct Queue {
  std::vector<Hit> q;
  void push(Hit h) { q.push_back(h); }
  std::vector<Hit> take() {
    std::vector<Hit> out;
    out.swap(q);
    return out;
  }
};

inline void drain(Queue& q, Tally& t, Grid& g, float dt) {
  for (const Hit& h : q.take()) impact(t, g, h);
  if (t.window > 0) t.window -= dt;
}

} // namespace hx
