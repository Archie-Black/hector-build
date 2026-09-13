#pragma once
#include <cstdint>
#include <vector>

namespace hx {

/** One GPU sim. Many writes. 5.8 Data Channel idea — ours. */
enum class Burst : uint8_t { Drip, Lava, Play, Heat };

struct Event {
  Burst kind = Burst::Drip;
  float x = 0;
  float y = 0;
  float z = 0;
  float heat = 0.37f;
};

struct Channel {
  std::vector<Event> q;
  void publish(Event e) { q.push_back(e); }
  void drain() { q.clear(); }
};

inline Event drip(float x, float heat) { return {Burst::Drip, x, 1.f, 0, heat}; }
inline Event lava(float heat) { return {Burst::Lava, 0, 0, 0, heat}; }
inline Event play() { return {Burst::Play, 0, 0, 0, 1.f}; }

} // namespace hx
