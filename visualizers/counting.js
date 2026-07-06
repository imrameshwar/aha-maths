// visualizers/counting.js — Counting & one-to-one correspondence.
// Interactive: tap/click each item to count it.
// Render: items count up automatically over the duration.
// Dual-mode via defineVisualizer; lang string is passed in ctx.params.lang.

import { defineVisualizer } from '../engine/visualizer.js';

export default defineVisualizer({
  meta:     { id: 'counting', pillar: 'B', title: 'Counting' },
  duration: 10,

  controls: {
    count: { default: 5, min: 1, max: 10, step: 1, label: 'Items' },
  },

  setup(ctx) {
    const { p, stageRect: s, params, mode } = ctx;
    const N = Math.round(params.count ?? 5);

    ctx.state.N        = N;
    ctx.state.tapped   = [];     // item indices in tap order
    ctx.state.popMs    = {};     // item-index → millis() at tap time
    ctx.state.allDone  = false;
    ctx.state.doneSince = null;
    ctx.state.items    = _layout(s, N);

    if (mode !== 'interactive') return;

    p.mouseClicked = () => {
      if (p.mouseX < 0 || p.mouseX > p.width ||
          p.mouseY < 0 || p.mouseY > p.height) return;

      const { items, tapped, popMs } = ctx.state;
      for (let i = 0; i < items.length; i++) {
        if (tapped.includes(i)) continue;
        const it = items[i];
        const dx = p.mouseX - it.cx, dy = p.mouseY - it.cy;
        if (dx * dx + dy * dy <= it.r * it.r) {
          tapped.push(i);
          popMs[i] = p.millis();
          if (tapped.length === items.length) {
            ctx.state.allDone   = true;
            ctx.state.doneSince = p.millis();
            if (typeof ctx.state.onComplete === 'function') ctx.state.onComplete();
          }
          break;
        }
      }
    };
  },

  draw(ctx, t) {
    const { p, theme, stageRect: s, params, mode } = ctx;
    const { items, tapped, popMs, allDone, doneSince } = ctx.state;
    const N    = Math.round(params.count ?? 5);
    const lang = params.lang ?? 'en';
    const isHi = lang === 'hi';

    // ── How many counted ──────────────────────────────────────────────────────
    const counted = mode === 'render'
      ? Math.min(N, Math.floor(t / (9.5 / N)))
      : tapped.length;

    // ── Big count number ──────────────────────────────────────────────────────
    const cx     = s.x + s.w / 2;
    const numSz  = Math.min(s.w * 0.22, 88);
    const ctrY   = s.y + s.h * 0.21;

    p.noStroke();
    p.fill(p.color(theme.primary));
    p.textFont(theme.fontMono);
    p.textStyle(p.BOLD);
    p.textSize(numSz);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(counted, cx, ctrY);

    p.fill(p.color(theme.textLo));
    p.textSize(numSz * 0.42);
    p.text(`/ ${N}`, cx + numSz * 0.62, ctrY + numSz * 0.08);

    // ── Items ─────────────────────────────────────────────────────────────────
    for (let i = 0; i < N; i++) {
      const it       = items[i];
      const tapIdx   = tapped.indexOf(i);
      const isCounted = mode === 'render' ? i < counted : tapIdx !== -1;
      const orderNum  = isCounted ? (mode === 'render' ? i + 1 : tapIdx + 1) : 0;

      // Pop scale spring
      let sc = 1;
      if (isCounted) {
        const birthMs = mode === 'render'
          ? ((i / N) * 9.5) * 1000     // synthetic birth for render
          : (popMs[i] ?? 0);
        const ageMs = mode === 'render'
          ? (t * 1000 - birthMs)
          : (p.millis() - birthMs);
        if (ageMs >= 0 && ageMs < 380) {
          sc = 1 + 0.38 * Math.sin((ageMs / 380) * Math.PI);
        }
      }

      p.push();
      p.translate(it.cx, it.cy);
      p.scale(sc);

      if (isCounted) {
        p.noStroke();
        p.fill(p.color(theme.secondary));
      } else {
        p.fill(p.color(theme.surface));
        p.stroke(p.color(theme.grid));
        p.strokeWeight(Math.max(2, it.r * 0.09));
      }
      p.circle(0, 0, it.r * 2);

      if (isCounted && orderNum > 0) {
        p.noStroke();
        p.fill(p.color(theme.bg));
        p.textFont(theme.fontMono);
        p.textStyle(p.BOLD);
        p.textSize(Math.max(it.r * 0.76, 11));
        p.textAlign(p.CENTER, p.CENTER);
        p.text(orderNum, 0, 0);
      }

      p.pop();
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const ftY = s.y + s.h - 6;
    p.noStroke();
    p.textFont(theme.fontSans);
    p.textSize(Math.min(s.w * 0.057, 16));
    p.textAlign(p.CENTER, p.BOTTOM);

    if (allDone) {
      const pulse = 0.75 + 0.25 * Math.abs(Math.sin((p.millis() - (doneSince ?? 0)) / 420));
      p.fill(p.color(theme.success));
      p.textStyle(p.BOLD);
      // Keep footer text ASCII-safe inside p5 (Devanagari tofu risk).
      p.text('✓ Done!', cx, ftY);
    } else if (mode === 'interactive') {
      p.fill(p.color(theme.textLo));
      p.textStyle(p.NORMAL);
      p.text('Tap each one', cx, ftY);
    }
  },

  caption(ctx, t) {
    if (ctx.mode !== 'interactive') return '';
    const N = Math.round(ctx.params.count ?? 5);
    return `${ctx.state.tapped.length} / ${N}`;
  },
});

// Lay out N circles in a row (≤5) or two rows (>5), centred in stageRect.
function _layout(s, N) {
  const cols   = N <= 5 ? N : Math.ceil(N / 2);
  const rows   = N <= 5 ? 1 : 2;
  const areaT  = s.y + s.h * 0.38;
  const areaB  = s.y + s.h * 0.90;
  const areaH  = areaB - areaT;

  const r = Math.min(
    (s.w - 24) / (cols * 2 + (cols - 1) * 0.55) / 2,
    areaH     / (rows * 2 + (rows - 1) * 0.55) / 2,
    54,
  );
  const gapX   = r * 0.55;
  const gapY   = r * 0.55;
  const totalW = cols * 2 * r + (cols - 1) * gapX;
  const totalH = rows * 2 * r + (rows - 1) * gapY;
  const sx     = s.x + (s.w - totalW) / 2 + r;
  const sy     = areaT + (areaH - totalH) / 2 + r;

  return Array.from({ length: N }, (_, i) => ({
    cx: sx + (i % cols) * (2 * r + gapX),
    cy: sy + Math.floor(i / cols) * (2 * r + gapY),
    r,
  }));
}
