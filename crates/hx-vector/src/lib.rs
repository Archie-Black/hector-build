pub mod embed;
pub mod index;

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
    let req: SearchReq = serde_json::from_str(input).map_err(|e| e.to_string())?;
    let now = if req.now_ms == 0 {
        1_700_000_000_000
    } else {
        req.now_ms
    };
    let mut idx = MdvIndex::new(now);
    idx.ingest_files(&req.files, 480);
    let hits = idx.search(&req.query, req.k.min(32));
    let res = SearchRes {
        engine: "hx-vector-mdv",
        docs: idx.len(),
        hits,
    };
    serde_json::to_string(&res).map_err(|e| e.to_string())
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
    match search_json(&input) {
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
