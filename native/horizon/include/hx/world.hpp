#pragma once
#include "audio.hpp"
#include "knot.hpp"
#include "npc.hpp"
#include "tt.hpp"
#include <array>
#include <cstdint>
#include <vector>

namespace hx {

struct Player {
  float x = 0, y = 0, z = 0;
  float yaw = 0;
  Inventory bag;
  uint32_t id = 0;
};

struct World {
  std::vector<Player> people;
  std::vector<Chunk> ground;
  std::vector<Core> mind;
  uint64_t tick = 0;
  uint64_t inv = 0;

  void boot() {
    mind = {core(2, 8, 2), core(2, 8, 2), core(2, 8, 2), core(2, 8, 4)};
    people.push_back(Player{});
    Chunk c{};
    c.delta.assign(64, 1);
    c.seal();
    ground.push_back(c);
    seal();
  }

  void step(float dt) {
    tick++;
    if (!people.empty()) {
      people[0].x += dt * 0.01f;
      people[0].bag.seal();
    }
    if (mind.size() > 1) braid_cores(mind[0], mind[1]);
    seal();
  }

  Act think(const int idx[4]) const { return route(mind, idx); }

  void seal() {
    uint64_t h = knot(&tick, 8);
    for (const auto& c : ground) h ^= c.inv;
    for (const auto& p : people) h ^= knot(&p.x, 12) ^ p.bag.inv;
    inv = h;
  }
};

} // namespace hx
