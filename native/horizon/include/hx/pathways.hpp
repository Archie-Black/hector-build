#pragma once
#include <cmath>
#include <cstdint>
#include <string>
#include <vector>

namespace hx {

/** Same 3-strand pathways as src/lib/v01d/pathways.ts. UE and Godot call this. */
inline void sigma(int* p, int g) {
  const int a = (g < 0 ? -g : g) - 1;
  const int t = p[a];
  p[a] = p[a + 1];
  p[a + 1] = t;
}

inline int class_id(const int perm[3], int writhe) {
  int seen[3] = {0, 0, 0};
  int code = 0;
  for (int i = 0; i < 3; ++i) {
    if (seen[i]) continue;
    int n = 0, j = i;
    while (!seen[j]) {
      seen[j] = 1;
      j = perm[j];
      ++n;
    }
    code = code * 10 + n;
  }
  return code * 1000 + ((writhe + 256) & 255);
}

inline float tt_score(const int perm[3], int writhe) {
  int idx[3] = {perm[0], perm[1], (writhe < 0 ? -writhe : writhe) % 3};
  float v0 = 1.f, v1 = 0.f;
  for (int k = 0; k < 3; ++k) {
    const int i = idx[k] % 3;
    float n0 = v0 * (1.f - 0.15f * i) + v1 * 0.2f;
    float n1 = v0 * 0.2f + v1 * (1.f - 0.1f * i);
    const float z = std::sqrt(n0 * n0 + n1 * n1);
    if (z > 0.f) {
      v0 = n0 / z;
      v1 = n1 / z;
    }
  }
  return v0 < 0.f ? -v0 : v0;
}

inline int think_id(const char* text) {
  int perm[3] = {0, 1, 2};
  int writhe = 0;
  if (!text || !text[0]) return class_id(perm, 0);
  unsigned h = 0;
  for (const char* c = text; *c; ++c) {
    if (*c == ' ') {
      const int gen = static_cast<int>(h % 2) + 1;
      const int sign = (h & 1) ? 1 : -1;
      sigma(perm, sign * gen);
      writhe += sign;
      h = 0;
      continue;
    }
    h = h * 31u + static_cast<unsigned char>(*c);
  }
  if (h) {
    const int gen = static_cast<int>(h % 2) + 1;
    const int sign = (h & 1) ? 1 : -1;
    sigma(perm, sign * gen);
    writhe += sign;
  }
  return class_id(perm, writhe);
}

inline void reduce_word(std::vector<int>& w) {
  std::vector<int> s;
  s.reserve(w.size());
  for (int g : w) {
    if (!s.empty() && s.back() == -g) s.pop_back();
    else s.push_back(g);
  }
  if (s.empty()) s.push_back(1);
  w.swap(s);
}

inline void molt_writhe(std::vector<int>& w, int target) {
  reduce_word(w);
  int wr = 0;
  for (int g : w) wr += g > 0 ? 1 : -1;
  while (wr < target) {
    w.push_back(1);
    w.push_back(1);
    wr += 2;
  }
  while (wr > target) {
    w.push_back(-1);
    w.push_back(-1);
    wr -= 2;
  }
  reduce_word(w);
}

}
