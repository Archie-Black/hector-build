// CUDA reference lidar. ROCm counterpart: native/asimov/rdna/lidar.hip
#include <cuda_runtime.h>
#include <math.h>

extern "C" __global__ void cuda_lidar(float* ranges, int n, float x, float y, float th) {
  int i = int(blockIdx.x * blockDim.x + threadIdx.x);
  if (i >= n) return;
  float a = th + (float(i) / float(n)) * 6.2831853f - 3.14159265f;
  ranges[i] = fminf(10.f, 0.2f + fabsf(cosf(a + x * 0.01f + y * 0.01f)));
}
