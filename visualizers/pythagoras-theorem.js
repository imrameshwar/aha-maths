// visualizers/pythagoras-theorem.js — a² + b² = c² visual proof.
// Shows a right triangle with squares on each side, cells filling to prove areas.
// Dual-mode: render animates over t; interactive uses params.a + params.b sliders.

import { defineVisualizer } from '../engine/visualizer.js';

export default defineVisualizer({
  meta:     { id: 'pythagoras-theorem', pillar: 'A', title: 'a² + b² = c²' },
  duration: 14,

  controls: {
    a: { default: 3, min: 1, max: 6, step: 1, label: 'Side a' },
    b: { default: 4, min: 1, max: 6, step: 1, label: 'Side b' },
  },

  setup(ctx) {
    ctx.state.a = ctx.params.a ?? 3;
    ctx.state.b = ctx.params.b ?? 4;
  },

  update(ctx) {
    // Sync state with live param changes in interactive mode.
    ctx.state.a = Math.round(ctx.params.a ?? 3);
    ctx.state.b = Math.round(ctx.params.b ?? 4);
  },

  draw(ctx, t) {
    const { p, theme, stageRect: s, mode } = ctx;
    const a = ctx.state.a;
    const b = ctx.state.b;
    const c2 = a * a + b * b;
    const c  = Math.sqrt(c2);

    // Animation progress (0→1 over the first 10 s, then hold).
    const prog = mode === 'render'
      ? Math.min(1, t / 10)
      : 1;

    const cellMax = Math.max(a * a, b * b, c2);
    const unit    = Math.min(s.w / (3 * cellMax / a + 6), s.h / (cellMax / a + 4), 18);

    // Each square's pixel size.
    const sqA = a * unit;
    const sqB = b * unit;
    const sqC = Math.ceil(c) * unit;   // visual only — shown as proper c² below

    // Column layout: [a²]  gap  [b²]  gap  [c²]
    const totalW = a * unit + b * unit + Math.ceil(c) * unit + 2 * unit * 1.5;
    const ox     = s.x + (s.w - totalW) / 2;
    const topY   = s.y + unit * 1.2;

    // Draw one square: grid of cells filled up to fillCount.
    function drawSquare(lx, ly, side, fillCount, fillColor) {
      const total = side * side;
      for (let row = 0; row < side; row++) {
        for (let col = 0; col < side; col++) {
          const idx = row * side + col;
          const cx  = lx + col * unit;
          const cy  = ly + row * unit;
          const filled = idx < Math.floor(fillCount);
          p.noStroke();
          p.fill(filled ? p.color(fillColor) : p.color(theme.surface));
          p.rect(cx, cy, unit - 1, unit - 1, 2);
          if (!filled) {
            p.noFill();
            p.stroke(p.color(theme.grid));
            p.strokeWeight(0.5);
            p.rect(cx, cy, unit - 1, unit - 1, 2);
          }
        }
      }
      // border
      p.noFill();
      p.stroke(p.color(fillColor));
      p.strokeWeight(2);
      p.rect(lx, ly, side * unit, side * unit, 3);
    }

    const x1 = ox;
    const x2 = x1 + sqA + unit * 1.5;
    const x3 = x2 + sqB + unit * 1.5;
    const labelY = topY + Math.max(sqA, sqB, sqC) + unit * 0.8;

    // Stagger fill: a² fills first (0→0.33), b² next (0.33→0.66), c² last (0.66→1)
    const fillA  = prog < 0.33 ? (prog / 0.33) * (a * a) : a * a;
    const fillB  = prog < 0.33 ? 0 : prog < 0.66 ? ((prog - 0.33) / 0.33) * (b * b) : b * b;
    const fillC  = prog < 0.66 ? 0 : ((prog - 0.66) / 0.34) * c2;

    drawSquare(x1, topY, a, fillA, theme.secondary);
    drawSquare(x2, topY, b, fillB, theme.accent2);

    // c² square: draw as ceil(c) × ceil(c) but only fill c2 cells
    const cCols = Math.ceil(c);
    for (let row = 0; row < cCols; row++) {
      for (let col = 0; col < cCols; col++) {
        const idx = row * cCols + col;
        const cx  = x3 + col * unit;
        const cy  = topY + row * unit;
        const inRange = idx < c2;           // only c2 cells exist
        const filled  = inRange && idx < Math.floor(fillC);
        p.noStroke();
        p.fill(filled ? p.color(theme.primary) : inRange ? p.color(theme.surface) : p.color(theme.bg));
        p.rect(cx, cy, unit - 1, unit - 1, 2);
        if (inRange && !filled) {
          p.noFill();
          p.stroke(p.color(theme.grid));
          p.strokeWeight(0.5);
          p.rect(cx, cy, unit - 1, unit - 1, 2);
        }
      }
    }
    p.noFill();
    p.stroke(p.color(theme.primary));
    p.strokeWeight(2);
    p.rect(x3, topY, cCols * unit, cCols * unit, 3);

    // Labels above each square
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textFont(theme.fontMono);
    p.textStyle(p.BOLD);
    p.textSize(Math.min(unit * 1.0, 15));

    p.fill(p.color(theme.secondary));
    p.text(`a² = ${a}² = ${a * a}`, x1 + sqA / 2, topY - 4);

    p.fill(p.color(theme.accent2));
    p.text(`b² = ${b}² = ${b * b}`, x2 + sqB / 2, topY - 4);

    p.fill(p.color(theme.primary));
    p.text(`c² = ${a*a}+${b*b} = ${c2}`, x3 + (cCols * unit) / 2, topY - 4);

    // Bottom formula
    const fY = labelY + unit * 0.6;
    p.textSize(Math.min(unit * 1.1, 18));
    p.textAlign(p.CENTER, p.TOP);

    if (prog > 0.5) {
      const formulaAlpha = Math.min(1, (prog - 0.5) / 0.2) * 255;
      p.fill(p.color(theme.secondary + _alpha(formulaAlpha)));
      p.text(`${a * a}`, s.x + s.w * 0.35, fY);
      p.fill(p.color(theme.textLo + _alpha(formulaAlpha)));
      p.text(` + `, s.x + s.w * 0.42, fY);
      p.fill(p.color(theme.accent2 + _alpha(formulaAlpha)));
      p.text(`${b * b}`, s.x + s.w * 0.5, fY);
      p.fill(p.color(theme.textLo + _alpha(formulaAlpha)));
      p.text(` = `, s.x + s.w * 0.57, fY);
      p.fill(p.color(theme.primary + _alpha(formulaAlpha)));
      p.text(`${c2}`, s.x + s.w * 0.64, fY);
    }

    if (prog > 0.85) {
      const aAlpha = Math.min(1, (prog - 0.85) / 0.15) * 255;
      p.textSize(Math.min(unit * 0.85, 13));
      p.fill(p.color(theme.textLo + _alpha(aAlpha)));
      p.text(`a² + b² = c²`, s.x + s.w / 2, fY + unit * 1.6);
    }
  },

  caption(ctx) {
    const { a, b } = ctx.state;
    const c2 = a * a + b * b;
    return `a=${a}  b=${b}  c²=${c2}  (${a}²+${b}²=${c2})`;
  },
});

function _alpha(a) {
  return Math.round(Math.min(255, Math.max(0, a))).toString(16).padStart(2, '0');
}
