#pragma once
#include <cstddef>
#include <cstdint>
#include <string>

#if defined(__linux__)
#include <fcntl.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>
#endif

namespace hx {

/** Zero-copy framebuffer. Linux shm. No user-space blit. */
struct Fb {
  int w = 0, h = 0;
  uint32_t* px = nullptr;
  int fd = -1;
  size_t bytes = 0;
  std::string name;
};

inline bool map_fb(Fb& f, int w, int h, const char* name) {
  f.w = w;
  f.h = h;
  f.bytes = static_cast<size_t>(w) * static_cast<size_t>(h) * 4;
  f.name = name;
#if defined(__linux__)
  f.fd = shm_open(name, O_CREAT | O_RDWR, 0600);
  if (f.fd < 0) return false;
  if (ftruncate(f.fd, static_cast<off_t>(f.bytes)) != 0) return false;
  void* p = mmap(nullptr, f.bytes, PROT_READ | PROT_WRITE, MAP_SHARED, f.fd, 0);
  if (p == MAP_FAILED) return false;
  f.px = static_cast<uint32_t*>(p);
  return true;
#else
  f.px = new uint32_t[static_cast<size_t>(w) * static_cast<size_t>(h)];
  return true;
#endif
}

inline void unmap_fb(Fb& f) {
#if defined(__linux__)
  if (f.px) munmap(f.px, f.bytes);
  if (f.fd >= 0) close(f.fd);
  if (!f.name.empty()) shm_unlink(f.name.c_str());
#else
  delete[] f.px;
#endif
  f.px = nullptr;
  f.fd = -1;
}

} // namespace hx
