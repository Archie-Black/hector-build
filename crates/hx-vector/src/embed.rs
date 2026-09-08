//! Meta-dynamic embeddings: 256-d content + 32-d live metadata, fused and L2-normalized.
//! Metadata is recomputed on every hit so the index moves as the workspace is used.

pub const DIM_CONTENT: usize = 256;
pub const DIM_META: usize = 32;
pub const DIM: usize = DIM_CONTENT + DIM_META;

pub const LAYERS: [&str; 5] = ["working", "episodic", "semantic", "procedural", "constitutional"];

fn mix(mut n: u32) -> u32 {
    n ^= n >> 16;
    n = n.wrapping_mul(0x7feb_352d);
    n ^= n >> 15;
    n = n.wrapping_mul(0x846c_a68b);
    n ^= n >> 16;
    n
}

fn token_hash(token: &str) -> u32 {
    let mut h: u32 = 2_166_136_161;
    for b in token.bytes() {
        h = h.wrapping_mul(16_777_619) ^ u32::from(b);
    }
    mix(h)
}

fn l2(v: &mut [f32]) {
    let n = v.iter().map(|x| x * x).sum::<f32>().sqrt().max(1e-12);
    for x in v.iter_mut() {
        *x /= n;
    }
}

pub fn content_embed(text: &str) -> [f32; DIM_CONTENT] {
    let mut acc = [0.0f32; DIM_CONTENT];
    let lower = text.to_ascii_lowercase();
    let mut count = 0usize;
    for tok in lower.split(|c: char| !c.is_ascii_alphanumeric() && c != '_') {
        if tok.len() < 2 {
            continue;
        }
        let h = token_hash(tok);
        let idx = (h as usize) % DIM_CONTENT;
        let sign = if h & 1 == 1 { 1.0 } else { -1.0 };
        acc[idx] += sign;
        acc[(idx + 7) % DIM_CONTENT] += sign * 0.5;
        count += 1;
        if count >= 80 {
            break;
        }
    }
    l2(&mut acc);
    acc
}

pub fn meta_embed(layer: &str, salience: f32, hits: u32, last_hit_ms: u64, now_ms: u64) -> [f32; DIM_META] {
    let mut vec = [0.0f32; DIM_META];
    if let Some(i) = LAYERS.iter().position(|l| *l == layer) {
        vec[i] = 1.0;
    }
    let age_days = ((now_ms.saturating_sub(last_hit_ms)) as f32 / 86_400_000.0).max(0.0);
    let recency = (-age_days / 14.0).exp();
    vec[8] = salience.clamp(0.0, 1.0);
    vec[9] = ((hits as f32).ln_1p()) / 8.0;
    vec[10] = recency;
    vec[11] = if layer == "constitutional" { 1.0 } else { 0.0 };
    vec
}

pub fn fuse(content: &[f32; DIM_CONTENT], meta: &[f32; DIM_META]) -> [f32; DIM] {
    let mut out = [0.0f32; DIM];
    out[..DIM_CONTENT].copy_from_slice(content);
    out[DIM_CONTENT..].copy_from_slice(meta);
    l2(&mut out);
    out
}

pub fn embed(text: &str, layer: &str, salience: f32, hits: u32, last_hit_ms: u64, now_ms: u64) -> [f32; DIM] {
    fuse(
        &content_embed(text),
        &meta_embed(layer, salience, hits, last_hit_ms, now_ms),
    )
}

pub fn cosine(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
}

pub fn point_of(vec: &[f32]) -> (f32, f32, f32) {
    let band = DIM_CONTENT / 3;
    let axis = |start: usize| {
        let s: f32 = vec[start..start + band].iter().sum();
        ((s + 1.0) / 2.0).clamp(0.0, 1.0)
    };
    (axis(0), axis(band), axis(band * 2))
}

pub fn layer_of_path(path: &str) -> &'static str {
    let p = path.to_ascii_lowercase();
    if p.contains("hector.md") || p.contains("constitution") {
        "constitutional"
    } else if p.contains(".test.") || p.contains("spec.") {
        "procedural"
    } else if p.ends_with(".md") {
        "episodic"
    } else {
        "semantic"
    }
}
