shader_type canvas_item;
// OS V01D void field. Same uniforms as WebGL and UE VoidNebula.usf. DeltaKingZero.
uniform float u_t;
uniform vec2 u_look;
uniform float u_q = 1.0;
uniform vec2 u_res = vec2(1920.0, 1080.0);

float hx_hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hx_hash(i);
	float b = hx_hash(i + vec2(1.0, 0.0));
	float c = hx_hash(i + vec2(0.0, 1.0));
	float d = hx_hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int steps) {
	float v = 0.0;
	float a = 0.55;
	for (int i = 0; i < 5; i++) {
		if (i >= steps) {
			break;
		}
		v += a * noise(p);
		p = p * 2.07 + vec2(1.7, 9.2);
		a *= 0.5;
	}
	return v;
}

void fragment() {
	vec2 uv = UV;
	vec2 p = uv * 2.0 - 1.0;
	p.x *= u_res.x / max(u_res.y, 1.0);
	p -= u_look * 0.016;
	int steps = u_q > 0.78 ? 5 : (u_q > 0.5 ? 4 : 3);
	float n = fbm(p * 1.35 + u_t * 0.018, steps);
	float n2 = fbm(p * 2.8 - u_t * 0.011 + 17.0, steps - 1);
	vec3 col = vec3(0.02, 0.02, 0.024);
	col = mix(col, vec3(0.0, 0.11, 0.42), n * 0.34 * u_q);
	col += vec3(0.18, 0.38, 0.78) * n2 * 0.12 * u_q;
	float star = step(0.9964 - 0.008 * u_q, hx_hash(floor(uv * u_res * 0.55)));
	float tw = 0.55 + 0.45 * sin(u_t * 2.1 + hx_hash(uv * u_res) * 40.0);
	col += vec3(0.92, 1.0, 0.42) * star * tw * 0.55 * u_q;
	float vig = smoothstep(1.35, 0.18, length(p * 0.72));
	col *= mix(0.55, 1.0, vig);
	col = col / (col + vec3(1.0));
	col = pow(col, vec3(0.92));
	COLOR = vec4(col, 1.0);
}
