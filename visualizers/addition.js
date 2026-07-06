import { defineVisualizer } from '../engine/visualizer.js';

export default defineVisualizer({
  meta: { id: 'addition', title: 'Addition' },
  duration: 30,
  controls: {
    a: { type: 'range', min: 1, max: 9, default: 3, label: 'Group A' },
    b: { type: 'range', min: 1, max: 9, default: 4, label: 'Group B' },
  },

  setup(ctx) {
    ctx.state.a = ctx.params.a ?? 3;
    ctx.state.b = ctx.params.b ?? 4;
  },

  draw(ctx, t) {
    const { p, W, H, state, theme } = ctx;
    const a = Math.round(state.a ?? 3);
    const b = Math.round(state.b ?? 4);

    p.clear();
    p.background(p.color(theme.bg));

    // 0→0.35: separate; 0.35→0.55: slide together; 0.55→1: merged
    const merge = Math.max(0, Math.min(1, (t - 0.35) / 0.2));
    const merged = merge >= 1;

    const dotR   = Math.min(W / (Math.max(a, b, 4) * 3.2), H * 0.14, 24);
    const dotGap = dotR * 2.2;
    const midY   = H * 0.46;
    const midX   = W * 0.5;

    if (!merged) {
      // Group A — left half, sliding right as merge progresses
      const aW  = a * dotGap - (dotGap - dotR * 2);
      const axC = midX * (1 - merge) * 0.5 + (midX - aW * 0.5) * merge;
      _drawRow(p, a, axC + aW * 0.5, midY, dotR, dotGap, theme.secondary, theme);

      // "+" sign (fades as merge progresses)
      const plusAlpha = Math.round((1 - merge) * 255).toString(16).padStart(2, '0');
      p.noStroke();
      p.fill(p.color(theme.textLo + plusAlpha));
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(28);
      p.textStyle(p.BOLD);
      p.text('+', midX, midY);

      // Group B — right half, sliding left as merge progresses
      const bW  = b * dotGap - (dotGap - dotR * 2);
      const bxC = midX + midX * (1 - merge) * 0.5 - (bW * 0.5) * merge;
      _drawRow(p, b, bxC + bW * 0.5 - bW * (1 - merge) * 0.25, midY, dotR, dotGap, theme.primary, theme);
    } else {
      // Merged — show all dots together in two-colored row
      _drawRowTwo(p, a, b, midX, midY, dotR, dotGap, theme.secondary, theme.primary, theme);
    }

    // Formula
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textFont(theme.fontMono);
    p.textStyle(p.BOLD);

    if (merged) {
      p.fill(p.color(theme.success));
      p.textSize(20);
      p.text(`${a}  +  ${b}  =  ${a + b}`, midX, H * 0.7);
    } else {
      p.fill(p.color(theme.textHi));
      p.textSize(17);
      p.fill(p.color(theme.secondary));
      p.text(`${a}`, midX * 0.28, H * 0.7);
      p.fill(p.color(theme.textLo));
      p.text(`+`, midX, H * 0.7);
      p.fill(p.color(theme.primary));
      p.text(`${b}`, midX + midX * 0.72, H * 0.7);
      p.fill(p.color(theme.textLo));
      p.text(`= ?`, midX + midX * 0.72 + dotGap * 2.5, H * 0.7);
    }
    p.textFont(theme.fontSans);
  },

  update(ctx) {
    ctx.state.a = ctx.params.a ?? 3;
    ctx.state.b = ctx.params.b ?? 4;
  },

  caption(ctx, t) {
    const a = Math.round(ctx.state.a ?? 3);
    const b = Math.round(ctx.state.b ?? 4);
    return `${a} + ${b} = ${a + b}`;
  },
});

function _drawRow(p, n, cx, cy, dotR, gap, color, theme) {
  const totalW = (n - 1) * gap;
  p.noStroke();
  p.fill(p.color(color));
  for (let i = 0; i < n; i++) {
    const x = cx - totalW * 0.5 + i * gap;
    p.circle(x, cy, dotR * 2);
  }
}

function _drawRowTwo(p, a, b, cx, cy, dotR, gap, colorA, colorB, theme) {
  const total  = a + b;
  const totalW = (total - 1) * gap;
  p.noStroke();
  for (let i = 0; i < total; i++) {
    const x = cx - totalW * 0.5 + i * gap;
    p.fill(p.color(i < a ? colorA : colorB));
    p.circle(x, cy, dotR * 2);
  }
}
