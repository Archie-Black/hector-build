use crate::embed::{cosine, embed, layer_of_path, point_of, DIM};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct Doc {
    pub path: String,
    pub offset: u32,
    pub text: String,
    pub layer: String,
    pub salience: f32,
    pub hits: u32,
    pub last_hit_ms: u64,
    pub vec: [f32; DIM],
}

#[derive(Serialize, Deserialize)]
pub struct Hit {
    pub path: String,
    pub offset: u32,
    pub score: f32,
    pub text: String,
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub layer: String,
    pub hits: u32,
}

pub struct MdvIndex {
    docs: Vec<Doc>,
    now_ms: u64,
}

impl MdvIndex {
    pub fn new(now_ms: u64) -> Self {
        Self {
            docs: Vec::new(),
            now_ms,
        }
    }

    pub fn ingest_files(&mut self, files: &serde_json::Map<String, serde_json::Value>, chunk: usize) {
        self.docs.clear();
        for (path, value) in files {
            let Some(text) = value.as_str() else { continue };
            let layer = layer_of_path(path).to_string();
            let mut offset = 0usize;
            if text.is_empty() {
                continue;
            }
            while offset < text.len() {
                let mut end = (offset + chunk).min(text.len());
                while end > offset && !text.is_char_boundary(end) {
                    end -= 1;
                }
                let slice = &text[offset..end];
                if slice.trim().is_empty() {
                    offset = end;
                    continue;
                }
                let salience = (slice.len() as f32 / 800.0).clamp(0.15, 1.0);
                let vec = embed(slice, &layer, salience, 0, self.now_ms, self.now_ms);
                self.docs.push(Doc {
                    path: path.clone(),
                    offset: offset as u32,
                    text: slice.to_string(),
                    layer: layer.clone(),
                    salience,
                    hits: 0,
                    last_hit_ms: self.now_ms,
                    vec,
                });
                if end == text.len() {
                    break;
                }
                offset = end;
            }
        }
    }

    pub fn search(&mut self, query: &str, k: usize) -> Vec<Hit> {
        let q = embed(query, "working", 1.0, 0, self.now_ms, self.now_ms);
        let mut scored: Vec<(usize, f32)> = self
            .docs
            .iter()
            .enumerate()
            .map(|(i, d)| (i, cosine(&q, &d.vec)))
            .collect();
        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        scored.truncate(k.max(1));
        let mut hits = Vec::with_capacity(scored.len());
        for (i, score) in scored {
            let doc = &mut self.docs[i];
            doc.hits = doc.hits.saturating_add(1);
            doc.last_hit_ms = self.now_ms;
            doc.vec = embed(
                &doc.text,
                &doc.layer,
                (doc.salience + 0.05).min(1.0),
                doc.hits,
                doc.last_hit_ms,
                self.now_ms,
            );
            doc.salience = (doc.salience + 0.05).min(1.0);
            let (x, y, z) = point_of(&doc.vec);
            hits.push(Hit {
                path: doc.path.clone(),
                offset: doc.offset,
                score,
                text: doc.text.chars().take(280).collect(),
                x,
                y,
                z,
                layer: doc.layer.clone(),
                hits: doc.hits,
            });
        }
        hits
    }

    pub fn len(&self) -> usize {
        self.docs.len()
    }
}
