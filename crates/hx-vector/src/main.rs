use hx_vector::search_json;
use std::io::{self, Read};

fn main() {
    let mut raw = String::new();
    io::stdin().read_to_string(&mut raw).expect("stdin");
    match search_json(raw.trim()) {
        Ok(out) => {
            println!("{out}");
        }
        Err(err) => {
            eprintln!("{err}");
            std::process::exit(1);
        }
    }
}
