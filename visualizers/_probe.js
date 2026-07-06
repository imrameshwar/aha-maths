// visualizers/_probe.js — pipeline acceptance test. Throwaway; not a real short.
//
// Proves: (1) render pipeline works end-to-end, (2) animation is live (moving dot),
// (3) all math glyphs render without tofu boxes (§6 glyph-coverage check).
// Delete the 000-probe/ dir after Phase 2 passes; keep this file for re-testing.

import { defineVisualizer } from '../engine/visualizer.js';

export default defineVisualizer({
  meta: { id: '_probe', pillar: 'A', title: '_probe' },
  duration: 3,

  draw(ctx, t, p) {
    const { p: g, theme, stageRect: s } = ctx;

    // Background panel so the stage area is visually distinct
    g.push();
    g.noStroke();
    g.fill(g.color(theme.surface));
    g.rectMode(g.CORNER);
    g.rect(s.x, s.y, s.w, s.h, 24);
    g.pop();

    // --- Moving dot (proves animation is live) ---
    const cx = s.x + s.w * p;
    const cy = s.y + s.h * 0.35;
    g.push();
    g.noStroke();
    g.fill(g.color(theme.primary));
    g.drawingContext.globalAlpha = 0.25;
    g.circle(cx, cy, 120);
    g.drawingContext.globalAlpha = 1;
    g.circle(cx, cy, 60);
    g.pop();

    // --- Glyph probe (§6 coverage check — must show NO tofu boxes) ---
    g.push();
    g.noStroke();
    g.textAlign(g.CENTER, g.CENTER);

    // Math symbols in fontMono (the render font for all numbers/formulas)
    g.textFont(theme.fontMono);
    g.textStyle(g.BOLD);
    g.fill(g.color(theme.secondary));
    g.textSize(s.w * 0.052);
    g.text('π ² ³ × ÷ ≈ √ ∞ θ ° Σ ½ ⅓', s.x + s.w / 2, s.y + s.h * 0.55);

    // Channel name in fontSans
    g.textFont(theme.fontSans);
    g.textStyle(g.BOLD);
    g.fill(g.color(theme.textHi));
    g.textSize(s.w * 0.075);
    g.text('Aha Maths', s.x + s.w / 2, s.y + s.h * 0.65);

    // Live t readout (fontMono, fixed width — proves mono renders cleanly)
    g.textFont(theme.fontMono);
    g.textStyle(g.NORMAL);
    g.fill(g.color(theme.textLo));
    g.textSize(s.w * 0.042);
    g.text(`t = ${t.toFixed(3)} s`, s.x + s.w / 2, s.y + s.h * 0.75);

    g.pop();
  },

  caption(ctx, t) {
    return `pipeline probe · t = ${t.toFixed(2)} s`;
  },
});
