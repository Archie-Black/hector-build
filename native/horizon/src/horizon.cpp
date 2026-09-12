#include "hx/audio.hpp"
#include "hx/fb.hpp"
#include "hx/world.hpp"
#include <cstdio>
#include <vector>

int main() {
  hx::World w;
  w.boot();
  for (int i = 0; i < 240; ++i) w.step(1.f / 60.f);
  const int idx[4] = {1, 2, 3, 0};
  const hx::Act a = w.think(idx);
  std::vector<float> src(1024, 0.f);
  src[0] = 1.f;
  std::vector<float> out(1024, 0.f);
  const auto hits = hx::bounce(1.2f, 2.f);
  hx::braid_audio(out.data(), 1024, 48000.f, hits.data(), static_cast<int>(hits.size()), src.data());
  float e = 0;
  for (float x : out) e += x * x;
  std::printf("horizon tick=%llu inv=%llx act=%d audio=%.4f people=%zu\n",
              static_cast<unsigned long long>(w.tick),
              static_cast<unsigned long long>(w.inv),
              static_cast<int>(a), e, w.people.size());
  return w.tick == 240 && e > 0 && !w.people.empty() ? 0 : 1;
}
