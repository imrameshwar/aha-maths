// engine/rng.js — seeded, deterministic RNG (mulberry32).
// Visualizers MUST use ctx.rng instead of Math.random() so every render of the
// same config produces identical frames.

export function makeRng(seed = 1) {
  let a = seed >>> 0;
  const rng = function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Convenience helpers
  rng.range = (lo, hi) => lo + (hi - lo) * rng();
  rng.int = (lo, hi) => Math.floor(rng.range(lo, hi + 1));
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  return rng;
}

export default makeRng;
