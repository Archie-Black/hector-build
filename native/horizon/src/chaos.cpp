#include "hx/chaos.hpp"
#include "hx/kart.hpp"
#include <cstdio>

int main() {
  hx::Field f;
  f.bodies.push_back({});
  hx::Kart k;
  hx::step(k, 1.f, 0.f, 1.f / 60.f, true);
  hx::smash(f, 0, 120.f);
  hx::integrate(f, 1.f / 60.f);
  std::printf("chaos broken=%d q=%zu heat=%.2f\n", f.bodies[0].broken, f.fx.q.size(), k.heat);
  return f.bodies[0].broken && f.fx.q.size() >= 2 ? 0 : 1;
}
