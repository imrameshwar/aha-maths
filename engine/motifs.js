// engine/motifs.js — reusable visual motifs so visualizers stay short and look
// consistent. All take ctx (for p + theme) and draw into the current canvas.

import { ease } from './easing.js';

// Two x positions swapping places. Returns the interpolated x and a vertical
// "lift" arc (negative = up). Pass an already-eased t for snappier motion.
export function swapArc(xA, xB, t, liftAmount = 1) {
  const e = ease.inOutCubic(ease.clamp01(t));
  return {
    x: ease.lerp(xA, xB, e),
    lift: -Math.sin(ease.clamp01(t) * Math.PI) * liftAmount,
  };
}

// Expanding ring that fades out — great for "this is the active element".
export function highlightPulse(ctx, x, y, baseR, t, color) {
  const { p } = ctx;
  const k = ease.clamp01(t);
  p.push();
  p.noFill();
  p.stroke(p.color(color || ctx.theme.primary));
  p.strokeWeight(4 * (1 - k) + 1);
  p.drawingContext.globalAlpha = 1 - k;
  p.circle(x, y, baseR + k * baseR * 2.2);
  p.drawingContext.globalAlpha = 1;
  p.pop();
}

// Soft glow disc (drawn under a node/dot to make it pop).
export function glow(ctx, x, y, r, color, strength = 0.5) {
  const { p } = ctx;
  p.push();
  p.noStroke();
  const c = p.color(color || ctx.theme.primary);
  for (let i = 3; i >= 1; i--) {
    p.drawingContext.globalAlpha = (strength / 3) * i * 0.6;
    p.fill(c);
    p.circle(x, y, r * (1 + i * 0.7));
  }
  p.drawingContext.globalAlpha = 1;
  p.pop();
}

// A rounded value chip (used by array/cell visualizers).
export function chip(ctx, x, y, w, h, label, { fill, text, font } = {}) {
  const { p, theme } = ctx;
  p.push();
  p.noStroke();
  p.fill(p.color(fill || theme.surface));
  p.rectMode(p.CORNER);
  p.rect(x, y, w, h, 14);
  p.fill(p.color(text || theme.textHi));
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont(font || theme.fontMono);
  p.textStyle(p.BOLD);
  p.textSize(Math.min(h * 0.42, w * 0.5));
  p.text(label, x + w / 2, y + h / 2 + 2);
  p.pop();
}

// Fade an accumulation buffer toward the background (for trails/random walks).
// Call once per frame in update(): trailFade(buf, theme.bg, 0.08).
export function trailFade(buf, bgColor, amount = 0.08) {
  buf.push();
  buf.noStroke();
  const c = buf.color(bgColor);
  c.setAlpha(Math.round(amount * 255));
  buf.fill(c);
  buf.rectMode(buf.CORNER);
  buf.rect(0, 0, buf.width, buf.height);
  buf.pop();
}

export default { swapArc, highlightPulse, glow, chip, trailFade };
