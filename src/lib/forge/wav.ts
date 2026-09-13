/** 16-bit PCM WAV. Enough for a bounce. */

export function wav(pcm: Int16Array, rate = 44100, ch = 1) {
  const data = pcm.byteLength;
  const buf = new ArrayBuffer(44 + data);
  const v = new DataView(buf);
  const u = new Uint8Array(buf);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + data, true);
  w(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * ch * 2, true);
  v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, data, true);
  u.set(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength), 44);
  return u;
}

export function pcm(buf: Uint8Array) {
  if (buf.length < 44) return new Int16Array(0);
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const n = Math.max(0, Math.floor((buf.length - 44) / 2));
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) out[i] = v.getInt16(44 + i * 2, true);
  return out;
}
