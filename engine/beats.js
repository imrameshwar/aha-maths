// engine/beats.js — narration beat / subtitle helpers.
//
// A short config may declare timed beats (seconds into the CONTENT):
//   beats: [ { t: 0,  text: 'Compare adjacent elements' },
//            { t: 6,  text: 'Bigger values bubble up' },
//            { t: 12, text: 'O(n^2) — slow for big arrays' } ]
// The engine shows the active beat as a subtitle pill above the caption zone,
// so on-screen English text stays in sync with your Hinglish voiceover.

import { ease } from './easing.js';

export function beatAt(beats, t) {
  if (!beats || !beats.length) return null;
  let active = null;
  for (const b of beats) {
    if (t >= b.t) active = b;
    else break;
  }
  return active;
}

// Number that counts up from `from` to `to` across progress p (eased).
export function countUp(from, to, p, easeFn = ease.outCubic) {
  return from + (to - from) * easeFn(ease.clamp01(p));
}

// Draw a subtitle pill centered at (cx, bottomY). Fades in over `fade` seconds
// since the beat started.
export function drawSubtitle(ctx, text, cx, bottomY, sinceStart = 1, fade = 0.3) {
  if (!text) return;
  const { p, theme } = ctx;
  const a = ease.clamp01(sinceStart / fade);
  p.push();
  p.textFont(theme.fontSans);
  p.textStyle(p.BOLD);
  p.textSize(44);
  const w = p.textWidth(text) + 70;
  const h = 86;
  p.drawingContext.globalAlpha = a;
  p.noStroke();
  p.fill(p.color(theme.primary));
  p.rectMode(p.CENTER);
  p.rect(cx, bottomY - h / 2, w, h, h / 2);
  p.fill(p.color(theme.bg));
  p.textAlign(p.CENTER, p.CENTER);
  p.text(text, cx, bottomY - h / 2 + 2);
  p.drawingContext.globalAlpha = 1;
  p.pop();
}

export default { beatAt, countUp, drawSubtitle };
