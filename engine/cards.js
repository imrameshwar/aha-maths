// engine/cards.js — intro & outro full-screen cards. Data-driven from the
// short config (config.intro / config.outro). Never edited per video.

import { outBack, outCubic, clamp01, pulse } from './easing.js';

function brandMark(ctx, cx, cy, r, alpha = 255) {
  const { p, theme } = ctx;
  p.push();
  p.noStroke();
  p.fill(p.color(theme.primary));
  p.drawingContext.globalAlpha = alpha / 255;
  p.rectMode(p.CENTER);
  p.rect(cx, cy, r * 2, r * 2, r * 0.5);
  p.fill(p.color(theme.bg));
  p.textAlign(p.CENTER, p.CENTER);
  p.textStyle(p.BOLD);
  p.textFont(theme.fontMono);
  p.textSize(r * 0.95);
  p.text(theme.logoText, cx, cy + r * 0.05);
  p.drawingContext.globalAlpha = 1;
  p.pop();
}

export function drawIntro(ctx, t, prog) {
  const { p, theme, W, H, config } = ctx;
  const intro = config.intro || {};
  const title = intro.title || config.title || (config.visualizer || 'Untitled');
  const hook = intro.hook || '';

  // Animate: mark pops in, title slides up + fades, hook fades after.
  const a1 = outBack(clamp01(prog / 0.35));      // mark
  const a2 = outCubic(clamp01((prog - 0.2) / 0.4)); // title
  const a3 = clamp01((prog - 0.5) / 0.4);          // hook

  p.push();
  p.textAlign(p.CENTER, p.CENTER);

  brandMark(ctx, W / 2, H * 0.34, 70 * a1, 255 * clamp01(a1));

  p.noStroke();
  p.fill(p.color(theme.textHi));
  p.drawingContext.globalAlpha = a2;
  p.textFont(theme.fontSans);
  p.textStyle(p.BOLD);
  p.textSize(96);
  p.text(title, W / 2, H * 0.47 + (1 - a2) * 30);

  p.drawingContext.globalAlpha = a3;
  p.fill(p.color(theme.secondary));
  p.textStyle(p.NORMAL);
  p.textSize(54);
  p.text(hook, W / 2, H * 0.55);

  p.drawingContext.globalAlpha = 1;
  p.pop();
}

export function drawOutro(ctx, t, prog) {
  const { p, theme, W, H, config } = ctx;
  const outro = config.outro || {};
  const cta = outro.cta || 'Follow for more';
  const next = outro.next || '';
  const handle = config.handle || theme.handle;

  const a1 = outCubic(clamp01(prog / 0.4));
  const a2 = clamp01((prog - 0.35) / 0.4);
  const beat = 1 + 0.04 * pulse(prog, 0.4, 1.0);

  p.push();
  p.textAlign(p.CENTER, p.CENTER);

  brandMark(ctx, W / 2, H * 0.36, 64, 255 * a1);

  p.noStroke();
  p.fill(p.color(theme.textHi));
  p.drawingContext.globalAlpha = a1;
  p.textFont(theme.fontSans);
  p.textStyle(p.BOLD);
  p.textSize(78 * beat);
  p.text(cta, W / 2, H * 0.47);

  p.fill(p.color(theme.primary));
  p.textSize(56);
  p.text(handle, W / 2, H * 0.53);

  if (next) {
    p.drawingContext.globalAlpha = a2;
    p.fill(p.color(theme.textLo));
    p.textStyle(p.NORMAL);
    p.textSize(44);
    p.text('Next: ' + next, W / 2, H * 0.62);
  }

  p.drawingContext.globalAlpha = 1;
  p.pop();
}

export default { drawIntro, drawOutro };
