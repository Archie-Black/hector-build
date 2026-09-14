/** OS V01D field. WebGL2 compile of Godot nebula.gdshader / UE VoidNebula.usf. */

export const VERT = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a,0.0,1.0); }`;

export const FRAG = `#version 300 es
precision highp float;
uniform float u_t;
uniform vec2 u_res;
uniform vec2 u_look;
uniform float u_q;
uniform sampler2D u_tex;
uniform float u_has;
out vec4 o;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int steps){
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 5; i++) {
    if (i >= steps) break;
    v += a * noise(p);
    p = p * 2.07 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_res.x / max(u_res.y, 1.0);
  p -= u_look * 0.016;
  int steps = u_q > 0.78 ? 5 : (u_q > 0.5 ? 4 : 3);
  float n = fbm(p * 1.35 + u_t * 0.018, steps);
  float n2 = fbm(p * 2.8 - u_t * 0.011 + 17.0, steps - 1);
  vec3 voidc = vec3(0.02, 0.02, 0.024);
  vec3 cobalt = vec3(0.0, 0.11, 0.42);
  vec3 ice = vec3(0.18, 0.38, 0.78);
  vec3 col = voidc;
  if (u_has > 0.5) {
    vec2 suv = uv + u_look * 0.0035;
    col = texture(u_tex, suv).rgb * 0.88;
  }
  col = mix(col, cobalt, n * 0.34 * u_q);
  col += ice * n2 * 0.12 * u_q;
  float star = step(0.9964 - 0.008 * u_q, hash(floor(gl_FragCoord.xy * 0.55)));
  float tw = 0.55 + 0.45 * sin(u_t * 2.1 + hash(gl_FragCoord.xy) * 40.0);
  col += vec3(0.92, 1.0, 0.42) * star * tw * 0.55 * u_q;
  float vig = smoothstep(1.35, 0.18, length(p * 0.72));
  col *= mix(0.55, 1.0, vig);
  col = col / (col + vec3(1.0));
  col = pow(col, vec3(0.92));
  o = vec4(col, 1.0);
}`;

export function ease(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const k = 1 / (1 + Math.hypot(dx, dy) * 0.07);
  return { x: from.x + dx * k, y: from.y + dy * k };
}

function sh(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function boot(canvas: HTMLCanvasElement, pic?: HTMLImageElement) {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    desynchronized: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;
  const vs = sh(gl, gl.VERTEX_SHADER, VERT);
  const fs = sh(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "a");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  const vao = gl.createVertexArray();
  const buf = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([5, 5, 6, 255]));
  let hasPic = false;
  const load = () => {
    if (!pic || !pic.complete || !pic.naturalWidth) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pic);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    hasPic = true;
  };
  load();
  pic?.addEventListener("load", load, { once: true });
  const loc = {
    t: gl.getUniformLocation(prog, "u_t"),
    res: gl.getUniformLocation(prog, "u_res"),
    look: gl.getUniformLocation(prog, "u_look"),
    q: gl.getUniformLocation(prog, "u_q"),
    tex: gl.getUniformLocation(prog, "u_tex"),
    has: gl.getUniformLocation(prog, "u_has"),
  };
  gl.useProgram(prog);
  gl.uniform1i(loc.tex, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  return {
    draw(t: number, look: { x: number; y: number }, q: number, w: number, h: number) {
      gl.viewport(0, 0, w, h);
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1f(loc.t, t);
      gl.uniform2f(loc.res, w, h);
      gl.uniform2f(loc.look, look.x, look.y);
      gl.uniform1f(loc.q, q);
      gl.uniform1f(loc.has, hasPic ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    stop() {
      pic?.removeEventListener("load", load);
      gl.deleteBuffer(buf);
      gl.deleteTexture(tex);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    },
  };
}
