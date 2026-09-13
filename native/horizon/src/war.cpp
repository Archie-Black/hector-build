#include "hx/omni.hpp"
#include "hx/score.hpp"
#include <cstdio>

int main() {
  hx::Omni p;
  hx::wish(p, 1.f, 0.f, 1.f / 60.f, false, true, false);
  float rvx = 4, rvy = 0;
  hx::into_rig(p, rvx, rvy);
  hx::Grid g;
  hx::Tally t;
  hx::Queue q;
  q.push({16, 16, 0, 12.f, 40.f});
  hx::drain(q, t, g, 1.f / 60.f);
  hx::regenerate(g, 0.5f);
  std::printf("war dash=%.2f rig=%.2f pts=%.1f scrap=%.1f combo=%.2f g=%.3f\n", p.cool, rvx, t.points, t.scrap, t.combo, p.g);
  return t.points > 0 && rvx > 4 && p.g < 2.f ? 0 : 1;
}
