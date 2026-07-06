// visualizers/area-of-circle.js — Area of a Circle = πr²
// Pillar A explainer: pure function of t (no update, no state beyond setup geometry).
// 6 phases: whole circle → slice → unroll → straighten → label → payoff.
// Dual-mode: render drives N/unroll from the timeline; interactive reads ctx.params.

import { defineVisualizer } from '../engine/visualizer.js';

const TAU = Math.PI * 2;
const PI  = Math.PI;

// Lerp two 2-D points.
function lp(a, b, u) {
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}

// Hex color string + 0-255 alpha → 8-digit hex '#RRGGBBAA'.
function hex8(hexColor, alpha255) {
  return hexColor + Math.round(alpha255).toString(16).padStart(2, '0');
}

// Compute N (even) and unroll [0,1] from content time in render mode.
function renderState(t, ease) {
  if (t < 2.5) return { N: 0, unroll: 0 };

  const u = ease.clamp01(ease.remap(t, 5.5, 9.0, 0, 1));
  const unroll = t < 5.5 ? 0 : ease.outCubic(ease.clamp01(ease.remap(t, 5.5, 8.5, 0, 1)));

  let N;
  if (t < 5.5)    N = 12;
  else if (u < 0.30) N = 12;
  else if (u < 0.55) N = 24;
  else if (u < 0.75) N = 48;
  else               N = 96;

  return { N, unroll };
}

export default defineVisualizer({
  meta: { id: 'area-of-circle', pillar: 'A', title: 'Area = πr²' },
  duration: 16,

  controls: {
    slices: { default: 64, min: 8,  max: 256, step: 2,    label: 'Slices' },
    unroll: { default: 1,  min: 0,  max: 1,   step: 0.01, label: 'Unroll' },
  },

  setup(ctx) {
    const s = ctx.stageRect;
    const R = 0.30 * Math.min(s.w, s.h);   // spec-mandated radius (Math-QA gate)
    ctx.state.R  = R;
    ctx.state.cx = s.x + s.w / 2;
    ctx.state.cy = s.y + s.h * 0.27;        // upper portion of stage
    ctx.state.ry = s.y + s.h * 0.67;        // vertical center of the rectangle row
  },

  draw(ctx, t) {
    const { p: g, theme, stageRect: s, params, ease, mode } = ctx;
    const { R, cx, cy, ry } = ctx.state;

    // ── Resolve N and unroll ──────────────────────────────────────────────────
    let N, unroll;
    if (mode === 'interactive') {
      N = Math.round(params.slices);
      if (N % 2 !== 0) N++;           // keep even for clean up/down pairing
      unroll = params.unroll;
    } else {
      ({ N, unroll } = renderState(t, ease));
    }
    N = Math.max(4, N);

    // Rectangle geometry — exactly πR × R (the proof).
    const rectW  = PI * R;              // Math-QA: this MUST match the label "πr"
    const rx     = cx - rectW / 2;      // left edge, centered under the circle
    const ry_top = ry - R / 2;
    const ry_bot = ry + R / 2;
    const slotW  = rectW / N;           // each wedge occupies this width in the row

    g.push();
    g.rectMode(g.CORNER);

    // ── Phase 1: full circle (N === 0, t < 2.5s) ─────────────────────────────
    if (N === 0) {
      g.noStroke();
      g.fill(g.color(theme.primary));
      g.circle(cx, cy, R * 2);
    } else {
      // ── Phases 2-4: N wedges transitioning circle → rectangle ─────────────
      for (let i = 0; i < N; i++) {
        // Stagger: left wedges move first (small fraction).
        const stagger = (i / N) * 0.18;
        const u_i = ease.clamp01((unroll - stagger) / (1 - 0.18));
        const eu  = ease.outCubic(u_i);

        // Circle vertices: tip at center, base on arc.
        const a0   = (TAU * i / N) - PI / 2;       // start angle (top = -π/2)
        const a1   = (TAU * (i + 1) / N) - PI / 2; // end angle
        const tipC = { x: cx, y: cy };
        const lftC = { x: cx + R * Math.cos(a0), y: cy + R * Math.sin(a0) };
        const rgtC = { x: cx + R * Math.cos(a1), y: cy + R * Math.sin(a1) };

        // Rectangle vertices: alternate tip-up / tip-down so wedges interlock.
        // Even i → tip at top (ry_top), base at bottom (ry_bot).
        // Odd  i → tip at bottom (ry_bot), base at top (ry_top).
        // Each wedge base spans 2·slotW (its true arc share). Adjacent up/down
        // wedges then share a FULL slanted edge and tile a SOLID parallelogram
        // of area πR² — the area is conserved (no picket-fence gaps). The
        // horizontal advance per wedge is slotW, so N wedges span N·slotW = πR;
        // the ±slotW end slant vanishes as N rises → reads as a clean rectangle.
        const isEven = i % 2 === 0;
        const px0    = cx - (N + 1) * slotW / 2;   // center the (N+1)·slotW-wide fill under the circle
        const baseRy = isEven ? ry_bot : ry_top;
        const tipRy  = isEven ? ry_top : ry_bot;
        const tipR   = { x: px0 + (i + 1) * slotW, y: tipRy };
        const lftR   = { x: px0 + i * slotW,       y: baseRy };
        const rgtR   = { x: px0 + (i + 2) * slotW, y: baseRy };

        const tip = lp(tipC, tipR, eu);
        const lft = lp(lftC, lftR, eu);
        const rgt = lp(rgtC, rgtR, eu);

        // Two alternating cyan shades — alternation makes rearranged row legible.
        g.fill(g.color(isEven ? '#22D3EE' : '#0F8FA8'));
        g.noStroke();
        g.triangle(tip.x, tip.y, lft.x, lft.y, rgt.x, rgt.y);

        // Thin bg-colored gap lines visible while wedges are still in circle form.
        if (eu < 0.6) {
          g.stroke(g.color(theme.bg));
          g.strokeWeight(2);
          g.line(tip.x, tip.y, lft.x, lft.y);
          g.line(tip.x, tip.y, rgt.x, rgt.y);
        }
      }
    }

    // ── Radius line + label (phases 1-2, fades out by t=3.5s) ────────────────
    if (t < 3.5) {
      const fade  = t < 2.5 ? 1 : 1 - ease.remap(t, 2.5, 3.5, 0, 1);
      const alpha = fade * 255;
      const angle = -PI / 3;              // 60° from top → avoids overlapping wedge 0
      const ex = cx + R * Math.cos(angle);
      const ey = cy + R * Math.sin(angle);

      g.stroke(g.color(hex8(theme.secondary, alpha)));
      g.strokeWeight(3);
      g.line(cx, cy, ex, ey);
      g.noStroke();
      g.fill(g.color(hex8(theme.secondary, alpha)));
      g.textFont(theme.fontMono);
      g.textStyle(g.BOLD);
      g.textSize(s.w * 0.07);
      g.textAlign(g.LEFT, g.CENTER);
      g.text('r', ex + 18, ey - 8);
    }

    // ── Rectangle outline (fades in as unroll → 1, stays for phases 5-6) ─────
    const rectVisible = mode === 'interactive' ? unroll : (unroll > 0.55 || t >= 9.0);
    if (rectVisible) {
      const fade  = mode === 'interactive'
        ? ease.clamp01(ease.remap(unroll, 0.55, 0.9, 0, 1))
        : ease.clamp01(ease.remap(unroll > 0 ? unroll : 1, 0.55, 0.9, 0, 1));
      g.noFill();
      g.stroke(g.color(hex8(theme.secondary, fade * 255)));
      g.strokeWeight(3);
      g.rect(rx, ry_top, rectW, R);       // width = πR exactly (Math-QA gate)
    }

    // ── Phase 5: dimension labels (9.0–13.5s) ────────────────────────────────
    if (t >= 9.0 && t < 13.5) {
      const la = ease.outCubic(ease.clamp01(ease.remap(t, 9.0, 10.5, 0, 1)));

      g.stroke(g.color(theme.secondary));
      g.strokeWeight(2.5);
      g.fill(g.color(theme.secondary));
      g.textFont(theme.fontMono);
      g.textStyle(g.BOLD);
      g.textSize(s.w * 0.062);

      // Width brace above the rectangle.
      const braceY = ry_top - 38;
      g.line(rx, braceY, rx + rectW, braceY);
      g.line(rx, braceY, rx, ry_top - 10);
      g.line(rx + rectW, braceY, rx + rectW, ry_top - 10);
      g.noStroke();
      g.textAlign(g.CENTER, g.BOTTOM);
      g.text('πr', cx, braceY - 6);  // πr

      // Height brace to the right (fades in slightly later).
      if (la > 0.4) {
        const braceX = rx + rectW + 16;
        g.stroke(g.color(theme.secondary));
        g.strokeWeight(2.5);
        g.line(braceX, ry_top, braceX, ry_bot);
        g.line(braceX, ry_top, rx + rectW + 6, ry_top);
        g.line(braceX, ry_bot, rx + rectW + 6, ry_bot);
        g.noStroke();
        g.fill(g.color(theme.secondary));
        g.textAlign(g.CENTER, g.CENTER);
        g.text('r', braceX, ry);
      }
    }

    // ── Phase 5 in interactive mode: always show labels when unroll ≈ 1 ──────
    if (mode === 'interactive' && unroll > 0.85) {
      const la = ease.clamp01(ease.remap(unroll, 0.85, 1.0, 0, 1));
      g.stroke(g.color(hex8(theme.secondary, la * 255)));
      g.strokeWeight(2);
      g.fill(g.color(hex8(theme.secondary, la * 255)));
      g.textFont(theme.fontMono);
      g.textStyle(g.BOLD);
      g.textSize(s.w * 0.055);

      const braceY = ry_top - 34;
      g.line(rx, braceY, rx + rectW, braceY);
      g.line(rx, braceY, rx, ry_top - 8);
      g.line(rx + rectW, braceY, rx + rectW, ry_top - 8);
      g.noStroke();
      g.textAlign(g.CENTER, g.BOTTOM);
      g.text('πr', cx, braceY - 4);

      const braceX = rx + rectW + 16;
      g.stroke(g.color(hex8(theme.secondary, la * 255)));
      g.line(braceX, ry_top, braceX, ry_bot);
      g.line(braceX, ry_top, rx + rectW + 6, ry_top);
      g.line(braceX, ry_bot, rx + rectW + 6, ry_bot);
      g.noStroke();
      g.fill(g.color(hex8(theme.secondary, la * 255)));
      g.textAlign(g.CENTER, g.CENTER);
      g.text('r', braceX, ry);
    }

    // ── Phase 6: payoff readout (13.5–16s) ───────────────────────────────────
    const showPayoff = mode === 'interactive' ? unroll >= 1 : t >= 13.5;
    if (showPayoff) {
      const fa    = mode === 'interactive' ? 1 : ease.outCubic(ease.clamp01(ease.remap(t, 13.5, 14.5, 0, 1)));
      const alpha = fa * 255;
      g.noStroke();
      g.fill(g.color(hex8(theme.secondary, alpha)));
      g.textFont(theme.fontMono);
      g.textStyle(g.BOLD);
      g.textSize(s.w * 0.071);
      g.textAlign(g.CENTER, g.CENTER);
      // πr² — π=π, ²=² (verified tofu-free in probe)
      g.text('Area = πr × r = πr²', cx, s.y + s.h * 0.89);
    }

    g.pop();
  },

  caption(ctx, t) {
    const { ease, params, mode } = ctx;
    if (mode === 'interactive') {
      return `slices: ${Math.round(params.slices)}`;
    }
    if (t < 2.5 || t > 9.5) return '';
    const { N } = renderState(t, ease);
    return `slices: ${N}`;
  },
});
