shader_type canvas_item;
// Same field as src/lib/v01d/void-gl.ts. HAL feeds u_q from RDNA/CUDA dt.
uniform float u_t;
uniform vec2 u_look;
uniform float u_q = 1.0;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void fragment() {
	vec2 p = UV * 2.0 - 1.0;
	p -= u_look * 0.018;
	float n = 0.0;
	for (int i = 0; i < 5; i++) {
		n += h(floor(p * (2.2 + float(i) * 1.15) + u_t * 0.02)) / (float(i) + 1.2);
	}
	vec3 col = vec3(0.02, 0.02, 0.024);
	col += vec3(0.0, 0.12, 0.45) * n * 0.28 * u_q;
	COLOR = vec4(col, 1.0);
}
