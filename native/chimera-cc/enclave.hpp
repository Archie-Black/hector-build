#pragma once
#include <cstdint>
#include <cstring>
#include <vector>

namespace chimera {
inline bool ct_eq(const uint8_t* a, size_t na, const uint8_t* b, size_t nb) {
  size_t n = na > nb ? na : nb;
  unsigned d = (unsigned)(na ^ nb);
  for (size_t i = 0; i < n; i++) {
    uint8_t x = i < na ? a[i] : 0;
    uint8_t y = i < nb ? b[i] : 0;
    d |= (unsigned)(x ^ y);
  }
  return d == 0;
}
struct Wipe {
  uint8_t* p;
  size_t n;
  ~Wipe() {
    if (p) std::memset(p, 0, n);
  }
};
inline uint16_t hop_port(uint32_t epoch, uint16_t base) {
  return (uint16_t)(base + (epoch * 7919u) % 400u);
}
}
