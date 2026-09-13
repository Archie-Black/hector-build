// CUDA reference kernel. ROCm counterpart: native/asimov/rdna/step.hip
#include <cuda_runtime.h>
#include <math.h>

struct Bot {
  float x, y, th, v, w, r;
};

extern "C" __global__ void cuda_substep(Bot* b, float h, float mu) {
  if (threadIdx.x != 0) return;
  b->th += b->w * h;
  b->x += cosf(b->th) * b->v * h;
  b->y += sinf(b->th) * b->v * h;
  b->v *= 1.f - mu * h;
}
