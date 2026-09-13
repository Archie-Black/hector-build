#include "hx/kart.hpp"
#include <cstdio>
#include <vector>

int main() {
  hx::Kart k;
  for (int i = 0; i < 240; i++) hx::step(k, 0.8f, (i > 80 && i < 140) ? 0.4f : 0.f, 1.f / 60.f, i == 200);
  std::vector<float> buf(1024);
  hx::scream(buf.data(), 1024, k.rpm, 48000.f);
  float e = 0;
  for (float x : buf) e += x * x;
  const hx::Kart g = hx::ghost_of(k, 1.f);
  std::printf("ghostkart v=%.2f rpm=%.0f hp=%.0f tape=%zu ghost=%.2f audio=%.4f\n", k.v, k.rpm, k.hp, k.tape.size(), g.x, e);
  return k.tape.size() == 240 && e > 0 && g.ghost ? 0 : 1;
}
