import { defineVisualizer } from '../engine/visualizer.js';

export default defineVisualizer({
  meta: { id: 'number-line', title: 'Number Line' },
  duration: 30,
  controls: {
    position: { type: 'range', min: -10, max: 15, default: 5, label: 'Position' },
  },

  setup(ctx) {
    ctx.state.position = ctx.params.position ?? 5;
  },

  draw(ctx, t) {
    const { p, W, H, state, theme } = ctx;
    const pos = Math.round(state.position ?? 5);
    const MIN = -10;
    const MAX = 15;
    const RANGE = MAX - MIN;

    p.clear();
    p.background(p.color(theme.bg));

    const lineY  = H * 0.52;
    const xLeft  = W * 0.07;
    const xRight = W * 0.93;
    const lineW  = xRight - xLeft;

    // Axis
    p.stroke(p.color(theme.grid));
    p.strokeWeight(2);
    p.line(xLeft, lineY, xRight, lineY);

    // Arrow heads
    p.fill(p.color(theme.grid));
    p.noStroke();
    p.triangle(xLeft - 6, lineY - 5, xLeft - 6, lineY + 5, xLeft - 13, lineY);
    p.triangle(xRight + 6, lineY - 5, xRight + 6, lineY + 5, xRight + 13, lineY);

    // Ticks and labels
    for (let n = MIN; n <= MAX; n++) {
      const x     = xLeft + (n - MIN) / RANGE * lineW;
      const isZ   = n === 0;
      const isPos = n === pos;
      const major = n % 5 === 0 || isZ;
      const tick  = isZ ? 16 : major ? 10 : 5;

      p.stroke(isZ ? p.color(theme.primary) : p.color(theme.grid));
      p.strokeWeight(isZ ? 2.5 : major ? 1.5 : 0.8);
      p.line(x, lineY - tick, x, lineY + tick);

      if (major || isZ || isPos) {
        p.noStroke();
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(isZ ? 13 : 11);
        p.textStyle(isZ ? p.BOLD : p.NORMAL);
        p.textFont(theme.fontMono);
        p.fill(
          isPos && !isZ ? p.color(theme.secondary) :
          isZ            ? p.color(theme.primary)   :
                           p.color(theme.textLo)
        );
        p.text(n, x, lineY + tick + 5);
        p.textFont(theme.fontSans);
      }
    }

    // Shade region from 0 to pos (direction fill)
    if (pos !== 0) {
      const x0  = xLeft + (0 - MIN) / RANGE * lineW;
      const xP  = xLeft + (pos - MIN) / RANGE * lineW;
      const col = pos > 0 ? theme.secondary : theme.danger;
      p.noStroke();
      p.fill(p.color(col + '33'));
      p.rect(Math.min(x0, xP), lineY - 3, Math.abs(xP - x0), 6, 2);
    }

    // Position dot
    const px = xLeft + (pos - MIN) / RANGE * lineW;
    p.noStroke();
    p.fill(p.color(theme.secondary));
    p.circle(px, lineY, 22);

    // Label above dot
    p.fill(p.color(theme.secondary));
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(16);
    p.textStyle(p.BOLD);
    p.textFont(theme.fontMono);
    p.text(pos, px, lineY - 14);
    p.textFont(theme.fontSans);

    // Description
    const steps   = Math.abs(pos);
    const dir     = pos > 0 ? 'right' : pos < 0 ? 'left' : '';
    const desc    = pos === 0
      ? 'at zero — the origin'
      : `${steps} step${steps !== 1 ? 's' : ''} ${dir} of zero`;
    p.noStroke();
    p.fill(p.color(theme.textLo));
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(13);
    p.textStyle(p.NORMAL);
    p.text(desc, W * 0.5, lineY + 36);
  },

  update(ctx) {
    ctx.state.position = ctx.params.position ?? 5;
  },

  caption(ctx, t) {
    const pos = Math.round(ctx.state.position ?? 5);
    return `position: ${pos}`;
  },
});
