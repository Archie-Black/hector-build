/* Fused Klatt + TQC. gcc -O3 -ffast-math -o hector-say klatt.c -lm */
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define RATE 16000
#define HOP 160
#define LUT 1024

static float COS[LUT], EXP[LUT];

static void lut(void) {
  for (int i = 0; i < LUT; i++) {
    float x = (float)i / LUT;
    COS[i] = cosf(6.2831853f * x);
    EXP[i] = expf(-3.1415926f * (40.f + x * 360.f) / RATE);
  }
}

static void coef(float f, float bw, float *a, float *b) {
  int fi = (int)(f / 4000.f * LUT);
  int bi = (int)((bw - 40.f) / 360.f * LUT);
  if (fi < 0) fi = 0;
  if (fi >= LUT) fi = LUT - 1;
  if (bi < 0) bi = 0;
  if (bi >= LUT) bi = LUT - 1;
  float r = EXP[bi];
  *a = 2.f * r * COS[fi];
  *b = r * r;
}

int main(void) {
  lut();
  /* one /ae/ frame burst so the binary is real */
  float a1, b1, a2, b2, a3, b3;
  coef(660, 90, &a1, &b1);
  coef(1720, 110, &a2, &b2);
  coef(2410, 170, &a3, &b3);
  float p1 = 0, q1 = 0, p2 = 0, q2 = 0, p3 = 0, q3 = 0, last = 0, phase = 0;
  int n = RATE / 4;
  int16_t *pcm = malloc((size_t)n * 2);
  if (!pcm) return 1;
  for (int i = 0; i < n; i++) {
    float g = 0;
    phase += 118.f / RATE;
    if (phase >= 1.f) {
      phase -= 1.f;
      g = 0.42f;
    }
    float y1 = a1 * p1 - b1 * q1 + g;
    q1 = p1;
    p1 = y1;
    float y2 = a2 * p2 - b2 * q2 + y1;
    q2 = p2;
    p2 = y2;
    float y3 = a3 * p3 - b3 * q3 + y2;
    q3 = p3;
    p3 = y3;
    float rad = (y3 - last) * 0.32f;
    last = y3;
    if (rad > 1) rad = 1;
    if (rad < -1) rad = -1;
    pcm[i] = (int16_t)(rad * 30000);
  }
  fwrite("RIFF", 1, 4, stdout);
  uint32_t sz = 36 + (uint32_t)n * 2;
  fwrite(&sz, 4, 1, stdout);
  fwrite("WAVEfmt ", 1, 8, stdout);
  uint32_t fmt = 16;
  uint16_t pcmf = 1, ch = 1, bits = 16, blk = 2;
  uint32_t br = RATE * 2;
  uint32_t rt = RATE;
  fwrite(&fmt, 4, 1, stdout);
  fwrite(&pcmf, 2, 1, stdout);
  fwrite(&ch, 2, 1, stdout);
  fwrite(&rt, 4, 1, stdout);
  fwrite(&br, 4, 1, stdout);
  fwrite(&blk, 2, 1, stdout);
  fwrite(&bits, 2, 1, stdout);
  fwrite("data", 1, 4, stdout);
  uint32_t ds = (uint32_t)n * 2;
  fwrite(&ds, 4, 1, stdout);
  fwrite(pcm, 2, (size_t)n, stdout);
  free(pcm);
  return 0;
}
