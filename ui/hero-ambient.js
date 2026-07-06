/* ui/hero-ambient.js — the ambient "living math" behind the hero (Premium P2).
   A slow, low-contrast constellation of drifting digits/symbols that connect
   with faint lines. This IS the brand ("math you watch") proven in the first
   second. Deliberately lightweight and self-contained (NOT the dual-mode engine):
     · one p5 instance, transparent canvas (the body atmosphere shows through)
     · pixel-density capped, low element count (scales with width)
     · pauses when the tab is hidden OR the hero scrolls offscreen (IntersectionObserver)
     · prefers-reduced-motion → a single static frame, no animation loop
   Text always stays above it (CSS z-index); pointer-events: none. */

const GLYPHS = '0123456789+−×÷=π∞√Σ';

function hexToRgb(hex) {
  const h = (hex || '').trim().replace('#', '');
  if (h.length < 6) return { r: 34, g: 211, b: 238 };      // cyan fallback
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

export function initHeroAmbient(container) {
  if (!container || !window.p5) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const tok = n => css.getPropertyValue(n).trim();
  const PRIMARY = hexToRgb(tok('--primary')  || '#22D3EE');
  const ACCENT  = hexToRgb(tok('--accent2')  || '#A78BFA');
  const SECOND  = hexToRgb(tok('--secondary')|| '#FBBF24');
  const PALETTE = [PRIMARY, PRIMARY, PRIMARY, ACCENT, SECOND];   // primary-weighted

  const sketch = (p) => {
    let pts = [], W = 0, H = 0;

    const measure = () => { W = container.clientWidth; H = container.clientHeight; };

    const seed = () => {
      pts = [];
      const N = Math.max(14, Math.min(42, Math.round(W / 40)));
      for (let i = 0; i < N; i++) {
        pts.push({
          x: p.random(W), y: p.random(H),
          vx: p.random(-0.11, 0.11), vy: p.random(-0.07, 0.07),
          ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
          sz: p.random(11, 22),
          col: PALETTE[(Math.random() * PALETTE.length) | 0],
          ph: p.random(p.TWO_PI), sp: p.random(0.004, 0.012),
        });
      }
    };

    p.setup = () => {
      measure();
      p.createCanvas(W, H);
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5));
      p.textAlign(p.CENTER, p.CENTER);
      p.textFont('JetBrains Mono');
      seed();
      if (reduce) { p.noLoop(); p.redraw(); }
    };

    p.windowResized = () => { measure(); p.resizeCanvas(W, H); if (reduce) p.redraw(); };

    p.draw = () => {
      p.clear();
      // faint connecting network
      p.strokeWeight(1);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 118) {
            p.stroke(PRIMARY.r, PRIMARY.g, PRIMARY.b, (1 - d / 118) * 16);
            p.line(a.x, a.y, b.x, b.y);
          }
        }
      }
      // drifting glyphs (twinkle via sine phase)
      p.noStroke();
      for (const pt of pts) {
        if (!reduce) {
          pt.x += pt.vx; pt.y += pt.vy; pt.ph += pt.sp;
          if (pt.x < -24) pt.x = W + 24; else if (pt.x > W + 24) pt.x = -24;
          if (pt.y < -24) pt.y = H + 24; else if (pt.y > H + 24) pt.y = -24;
        }
        const tw = (Math.sin(pt.ph) + 1) / 2;         // 0..1
        p.textSize(pt.sz);
        p.fill(pt.col.r, pt.col.g, pt.col.b, 12 + tw * 40);
        p.text(pt.ch, pt.x, pt.y);
      }
    };
  };

  const inst = new window.p5(sketch, container);

  // Resize with the hero box (new sections can shift its height).
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { if (inst && inst.windowResized) inst.windowResized(); }).observe(container);
  }

  // Pause when offscreen or tab hidden — no wasted frames.
  if (!reduce) {
    let onScreen = true, visible = !document.hidden;
    const apply = () => { (onScreen && visible) ? inst.loop() : inst.noLoop(); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { onScreen = es[0].isIntersecting; apply(); }, { threshold: 0 })
        .observe(container);
    }
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; apply(); });
  }

  return inst;
}
