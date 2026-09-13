// Asimov RDNA — ROCm counterpart to native/asimov/cuda/step.cu. HIP, gfx1201. DeltaKingZero.
#include <hip/hip_runtime.h>

struct Bot {
  float x, y, th, v, w, r;
};

extern "C" __global__ void rdna_substep(Bot* b, float h, float mu) {
  if (threadIdx.x != 0) return;
  b->th += b->w * h;
  b->x += cosf(b->th) * b->v * h;
  b->y += sinf(b->th) * b->v * h;
  b->v *= 1.f - mu * h;
}
