/** Sovereign studio on OS V01D. Open tools only. Hector seals the bounce. */

export const STUDIO = Object.freeze({
  daw: "Ardour",
  bounce: "/v01d/studio/bounces",
  vault: "/v01d/studio/vault",
  note: "Ardour records. Cardinal, IEM, Surge XT, Vital sit on the rack. Hector watermarks PCM, hashes the file, and files a local receipt. Register with SOCAN for royalties.",
  rack: [
    { name: "Ardour", job: "Multi-track desk and mixer." },
    { name: "Cardinal", job: "Modular synthesis." },
    { name: "Spectral HX Aether", job: "Spatial bus. Ambisonic in, binaural out." },
    { name: "IEM Plug-in Suite", job: "Ambisonic plugins on the Ardour rack." },
    { name: "Surge XT", job: "Wavetable." },
    { name: "Vital", job: "Wavetable and MPE." },
  ],
});

export function bounceWav(seconds = 1, rate = 44100) {
  const n = Math.floor(seconds * rate);
  const pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) pcm[i] = Math.round(Math.sin((i / rate) * 440 * Math.PI * 2) * 8000);
  return pcm;
}
