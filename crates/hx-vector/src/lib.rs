pub mod embed;
pub mod index;

use crate::embed::{embed, point_of, DIM};
use crate::index::MdvIndex;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Deserialize)]
pub struct SearchReq {
    pub files: serde_json::Map<String, serde_json::Value>,
    pub query: String,
    #[serde(default = "default_k")]
    pub k: usize,
    #[serde(default)]
    pub now_ms: u64,
}

fn default_k() -> usize {
    8
}

#[derive(Serialize)]
pub struct SearchRes {
    pub engine: &'static str,
    pub docs: usize,
    pub hits: Vec<index::Hit>,
}

pub fn search_json(input: &str) -> Result<String, String> {
    dispatch(input)
}

pub fn dispatch(input: &str) -> Result<String, String> {
    let v: serde_json::Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    let op = v.get("op").and_then(|x| x.as_str()).unwrap_or("search");
    match op {
        "embed" => embed_op(&v),
        "fathom" => fathom_op(&v),
        "index" => index_op(&v),
        _ => search_op(&v),
    }
}

fn search_op(v: &serde_json::Value) -> Result<String, String> {
    let req: SearchReq = serde_json::from_value(v.clone()).map_err(|e| e.to_string())?;
    let now = if req.now_ms == 0 {
        1_700_000_000_000
    } else {
        req.now_ms
    };
    let mut idx = MdvIndex::new(now);
    idx.ingest_files(&req.files, 480);
    let hits = idx.search(&req.query, req.k.min(32));
    serde_json::to_string(&SearchRes {
        engine: "hx-vector-mdv",
        docs: idx.len(),
        hits,
    })
    .map_err(|e| e.to_string())
}

fn embed_op(v: &serde_json::Value) -> Result<String, String> {
    let text = v.get("text").and_then(|x| x.as_str()).unwrap_or("");
    let vec = embed(text, "semantic", 0.5, 0, 0, 1_700_000_000_000);
    let p = point_of(&vec);
    serde_json::to_string(&serde_json::json!({
        "engine": "hx-vector-mdv",
        "op": "embed",
        "dim": DIM,
        "x": p.0,
        "y": p.1,
        "z": p.2,
        "vec": vec.iter().copied().take(16).collect::<Vec<f32>>(),
    }))
    .map_err(|e| e.to_string())
}

fn index_op(v: &serde_json::Value) -> Result<String, String> {
    let files = v
        .get("files")
        .and_then(|x| x.as_object())
        .cloned()
        .unwrap_or_default();
    let mut idx = MdvIndex::new(1_700_000_000_000);
    idx.ingest_files(&files, 480);
    serde_json::to_string(&serde_json::json!({
        "engine": "hx-vector-mdv",
        "op": "index",
        "docs": idx.len(),
    }))
    .map_err(|e| e.to_string())
}

fn fathom_op(v: &serde_json::Value) -> Result<String, String> {
    let files = v
        .get("files")
        .and_then(|x| x.as_object())
        .cloned()
        .unwrap_or_default();
    let mut idx = MdvIndex::new(1_700_000_000_000);
    idx.ingest_files(&files, 480);
    let hits = if files.is_empty() {
        0
    } else {
        idx.search("lattice", 3).len()
    };
    serde_json::to_string(&serde_json::json!({
        "engine": "hx-vector-mdv",
        "op": "fathom",
        "wasm": true,
        "dim": DIM,
        "docs": idx.len(),
        "hits": hits,
        "ops": ["search", "embed", "index", "fathom"],
    }))
    .map_err(|e| e.to_string())
}

static WASM_IN: Mutex<Vec<u8>> = Mutex::new(Vec::new());
static WASM_OUT: Mutex<Vec<u8>> = Mutex::new(Vec::new());

#[no_mangle]
pub extern "C" fn mdv_alloc(n: u32) -> *mut u8 {
    let mut buf = WASM_IN.lock().unwrap();
    buf.clear();
    buf.resize(n as usize, 0);
    buf.as_mut_ptr()
}

#[no_mangle]
pub extern "C" fn mdv_run(n: u32) -> i32 {
    let input = {
        let buf = WASM_IN.lock().unwrap();
        String::from_utf8_lossy(&buf[..n as usize]).into_owned()
    };
    match dispatch(&input) {
        Ok(s) => {
            let mut out = WASM_OUT.lock().unwrap();
            *out = s.into_bytes();
            out.len() as i32
        }
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn mdv_result_ptr() -> *const u8 {
    WASM_OUT.lock().unwrap().as_ptr()
}

#[no_mangle]
pub extern "C" fn mdv_result_len() -> u32 {
    WASM_OUT.lock().unwrap().len() as u32
}
