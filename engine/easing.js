// engine/easing.js — tweening helpers. All take t in [0,1] and return eased [0,1]
// (except back/elastic which may slightly overshoot). Pure, no global state.

export const linear = (t) => t;
export const inQuad = (t) => t * t;
export const outQuad = (t) => 1 - (1 - t) * (1 - t);
export const inOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const inCubic = (t) => t * t * t;
export const outCubic = (t) => 1 - Math.pow(1 - t, 3);
export const inOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const outBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

// Utilities
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const clamp01 = (v) => clamp(v, 0, 1);
// Map x from [a,b] to [c,d], clamped.
export const remap = (x, a, b, c, d) => lerp(c, d, clamp01((x - a) / (b - a || 1)));
// Smooth in-then-out pulse over a window, peak at center. Returns 0..1.
export const pulse = (t, start, end) => {
  if (t < start || t > end) return 0;
  const p = (t - start) / (end - start || 1);
  return Math.sin(p * Math.PI);
};

export const ease = {
  linear, inQuad, outQuad, inOutQuad, inCubic, outCubic, inOutCubic,
  outBack, inOutSine, lerp, clamp, clamp01, remap, pulse,
};

export default ease;
