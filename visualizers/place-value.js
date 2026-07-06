import { defineVisualizer } from '../engine/visualizer.js';

export default defineVisualizer({
  meta: { id: 'place-value', title: 'Place Value' },
  duration: 40,
  controls: {
    count: { type: 'range', min: 0, max: 19, default: 7, label: 'Count' },
  },

  setup(ctx) {
    ctx.state.count = ctx.params.count ?? 7;
  },

  draw(ctx, t) {
    const { p, W, H, state, theme } = ctx;
    const count = Math.round(state.count ?? 7);
    const tens  = Math.floor(count / 10);
    const ones  = count % 10;

    p.clear();
    p.background(p.color(theme.bg));

    const boxW = Math.min(W * 0.38, 180);
    const boxH = Math.min(H * 0.58, 220);
    const gap  = W * 0.07;
    const y0   = H * 0.14;
    const xT   = W * 0.5 - gap * 0.5 - boxW;
    const xO   = W * 0.5 + gap * 0.5;

    // Section labels
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(Math.min(14, W * 0.03));
    p.textStyle(p.BOLD);
    p.textFont(theme.fontMono);
    p.fill(p.color(theme.primary));
    p.text('TENS', xT + boxW * 0.5, y0 - 6);
    p.fill(p.color(theme.secondary));
    p.text('ONES', xO + boxW * 0.5, y0 - 6);
    p.textFont(theme.fontSans);

    // Box borders
    p.noFill();
    p.strokeWeight(1.5);
    p.stroke(p.color(theme.primary + '55'));
    p.rect(xT, y0, boxW, boxH, 10);
    p.stroke(p.color(theme.secondary + '55'));
    p.rect(xO, y0, boxW, boxH, 10);

    // Draw tens dots (large, centered in box)
    const tenDotR = Math.min(boxW * 0.22, boxH / (Math.max(tens, 1) * 2 + 0.5), 28);
    const tenPad  = tenDotR * 0.55;
    p.noStroke();
    for (let i = 0; i < tens; i++) {
      const cx = xT + boxW * 0.5;
      const cy = y0 + tenPad + tenDotR + i * (tenDotR * 2 + tenPad);
      p.fill(p.color(theme.primary));
      p.circle(cx, cy, tenDotR * 2);
    }
    if (tens === 0) {
      p.fill(p.color(theme.textLo + '44'));
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text('empty', xT + boxW * 0.5, y0 + boxH * 0.5);
    }

    // Draw ones dots (grid in box)
    const cols   = ones <= 4 ? 1 : 2;
    const rows   = Math.ceil(ones / cols);
    const onesDR = Math.min(
      (boxW - 16) / (cols * 2 + (cols - 1) * 0.4),
      (boxH - 16) / (rows * 2 + (rows - 1) * 0.4),
      20
    );
    const onesGap = onesDR * 0.45;
    const totalOnesW = cols * onesDR * 2 + (cols - 1) * onesGap;
    const totalOnesH = rows * onesDR * 2 + (rows - 1) * onesGap;
    const ox0 = xO + (boxW - totalOnesW) * 0.5 + onesDR;
    const oy0 = y0 + (boxH - totalOnesH) * 0.5 + onesDR;

    p.noStroke();
    for (let i = 0; i < ones; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx  = ox0 + col * (onesDR * 2 + onesGap);
      const cy  = oy0 + row * (onesDR * 2 + onesGap);
      p.fill(p.color(theme.secondary));
      p.circle(cx, cy, onesDR * 2);
    }
    if (ones === 0) {
      p.fill(p.color(theme.textLo + '44'));
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text('empty', xO + boxW * 0.5, y0 + boxH * 0.5);
    }

    // Bottom formula
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(Math.min(17, W * 0.035));
    p.textStyle(p.BOLD);
    p.textFont(theme.fontMono);

    const tenStr  = `${tens} ten${tens !== 1 ? 's' : ''}`;
    const oneStr  = `${ones} one${ones !== 1 ? 's' : ''}`;
    const formula = `${count} = ${tenStr} + ${oneStr}`;
    p.fill(p.color(theme.textHi));
    p.text(formula, W * 0.5, y0 + boxH + 14);
    p.textFont(theme.fontSans);
  },

  update(ctx) {
    ctx.state.count = ctx.params.count ?? 7;
  },

  caption(ctx, t) {
    const count = Math.round(ctx.state.count ?? 7);
    return `${count} = ${Math.floor(count / 10)} tens + ${count % 10} ones`;
  },
});
