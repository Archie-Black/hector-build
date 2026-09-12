//! Chimera. Constant-time. Wipe. No logs.

#[inline(never)]
pub fn ct_eq(a: &[u8], b: &[u8]) -> bool {
    let n = a.len().max(b.len());
    let mut d = a.len() ^ b.len();
    for i in 0..n {
        let x = *a.get(i).unwrap_or(&0);
        let y = *b.get(i).unwrap_or(&0);
        d |= (x ^ y) as usize;
    }
    d == 0
}

pub fn wipe(buf: &mut [u8]) {
    for b in buf.iter_mut() {
        *b = 0;
    }
}

pub fn hop_port(epoch: u32, base: u16) -> u16 {
    base.wrapping_add(((epoch.wrapping_mul(7919)) % 400) as u16)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn eq_and_port() {
        assert!(ct_eq(b"aa", b"aa"));
        assert!(!ct_eq(b"aa", b"ab"));
        assert_ne!(hop_port(1, 8443), hop_port(2, 8443));
    }
}
