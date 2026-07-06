// story/draw-lib.js — shared p5 drawing + math helpers for the Story pieces.
// Pure helpers only (no p5 instance owned here). Imported by the interactive
// journey. Kept separate from visualizers/ so `npm run sync` never ships it to
// the Studio — this is website-only "watch/play" content.

export const C = {
  bg:        '#0B0F1A',
  surface:   '#141A2A',
  grid:      '#222B3D',
  primary:   '#22D3EE', // cyan  — the active idea
  secondary: '#FBBF24', // amber — the answer / zero
  success:   '#34D399',
  danger:    '#F87171',
  accent2:   '#A78BFA', // violet — the exotic / imaginary
  textHi:    '#FFFFFF',
  textLo:    '#94A3B8',
  dawn:      '#F59E0B',
  wool:      '#E2E8F0',
};
export const F = { sans: 'Plus Jakarta Sans', mono: 'JetBrains Mono', deva: 'Mukta' };

// ── math / easing ────────────────────────────────────────────────────────────
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clamp   = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp    = (a, b, t) => a + (b - a) * t;
export const smooth  = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
export const eoc     = (x) => { x = clamp01(x); return 1 - Math.pow(1 - x, 3); };
export const eic     = (x) => { x = clamp01(x); return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2; };
export const eob     = (x) => { const c1=1.70158, c3=c1+1; x=clamp01(x); return 1 + c3*Math.pow(x-1,3) + c1*Math.pow(x-1,2); };
export const seg  = (t, a, b) => eoc((t - a) / (b - a));
export const segL = (t, a, b) => clamp01((t - a) / (b - a));
export const dist2 = (ax, ay, bx, by) => { const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; };

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hexToRgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ── S1 · Living-scene set dressing ─────────────────────────────────────────────
// Each scene names an "era". The framework paints an era backdrop BEHIND the
// scene every frame, so every scene gets a *place* (sky, horizon, drifting
// motes) for free — the maths marks still draw on top. Kept subtle + dark so
// contrast with the glowing cyan/amber/white marks stays high.
const REDUCED = typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// top sky, bottom sky, mote colour, mote kind, whether to draw a hill horizon.
export const ERAS = {
  night:  { top: '#070B16', bot: '#0B1226', mote: '#22D3EE', kind: 'star',  hills: false, ground: '#05070E' },
  dawn:   { top: '#101a30', bot: '#3a2a1f', mote: '#FBBF24', kind: 'bird',  hills: true,  ground: '#0E1526' },
  bone:   { top: '#0E1220', bot: '#241d16', mote: '#E2E8F0', kind: 'dust',  hills: true,  ground: '#0A0D16' },
  clay:   { top: '#161020', bot: '#2c2015', mote: '#FBBF24', kind: 'dust',  hills: false, ground: '#1a130c' },
  marble: { top: '#0d1424', bot: '#1c2233', mote: '#94A3B8', kind: 'dust',  hills: false, ground: '#0A0F1C' },
  ink:    { top: '#080d1e', bot: '#101a34', mote: '#22D3EE', kind: 'glyph', hills: false, ground: '#060a16' },
  saffron:{ top: '#12162c', bot: '#2b1d2e', mote: '#FBBF24', kind: 'star',  hills: false, ground: '#0a0d1c' },
  cosmic: { top: '#05060F', bot: '#120A24', mote: '#A78BFA', kind: 'star',  hills: false, ground: '#04040c' },
};

// ── S7 · Higgsfield backdrop plates (drop-in) ──────────────────────────────────
// If a painted plate exists for an era it becomes the bottom layer (mood), with
// the procedural set as the fallback. ACCURACY SANDWICH: the plate carries mood
// ONLY — every number/mark is still drawn by code on top, and bilingual text by
// HTML. Plates live in assets/story-plates/<era>.{webp|jpg}; missing → procedural.
// Data-saver / Save-Data skips them. Load is lazy + cached per era.
const PLATES = {};
export function loadPlate(p, era) {
  if (PLATES[era]) return PLATES[era];
  const rec = { img: null, state: 'loading' };
  PLATES[era] = rec;
  const base = `assets/story-plates/${era}`;
  const ok = (img) => { rec.img = img; rec.state = 'ready'; };
  // try .webp, then .jpg, then give up (procedural fallback forever)
  p.loadImage(`${base}.webp`, ok, () =>
    p.loadImage(`${base}.jpg`, ok, () => { rec.state = 'failed'; }));
  return rec;
}
// cover-fit an image into WxH (center-crop the overflow)
function drawCover(p, img, W, H) {
  if (!img || !img.width) return;
  const ir = img.width / img.height, cr = W / H;
  let dw, dh;
  if (ir > cr) { dh = H; dw = H * ir; } else { dw = W; dh = W / ir; }
  p.image(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

// A gentle pointer-parallax offset (px) for a layer at the given depth (0..1).
export function parallax(ctx, depth) {
  if (REDUCED || !ctx.mouse) return { x: 0, y: 0 };
  const mx = (ctx.mouse.x / ctx.W - 0.5), my = (ctx.mouse.y / ctx.H - 0.5);
  const k = ctx.S * 0.03 * depth;
  return { x: -mx * k, y: -my * k };
}

export function eraBackdrop(p, ctx, eraName) {
  const era = ERAS[eraName] || ERAS.night;
  const { W, H, S } = ctx;
  // lazy per-mount mote field
  if (!ctx.__motes || ctx.__moteEra !== eraName) {
    const r = mulberry32(9 + eraName.length);
    ctx.__motes = Array.from({ length: 46 }, () => ({
      x: r(), y: r(), r: 0.5 + r() * 1.8, sp: 0.2 + r() * 0.8, ph: r() * 6.28,
      drift: (0.2 + r() * 0.6) * (r() < 0.5 ? 1 : -1),
    }));
    ctx.__moteEra = eraName;
  }
  // S7: a painted plate (mood layer) if one exists, else the procedural set.
  const saveData = typeof navigator !== 'undefined' && navigator.connection && navigator.connection.saveData;
  const plate = saveData ? null : loadPlate(p, eraName);
  const hasPlate = plate && plate.state === 'ready' && plate.img;

  if (hasPlate) {
    // parallax the plate a touch, then a contrast scrim so code marks stay legible
    const off = parallax(ctx, 0.4);
    p.push(); p.translate(off.x, off.y);
    drawCover(p, plate.img, W + Math.abs(off.x) * 2 + 8, H + Math.abs(off.y) * 2 + 8);
    p.pop();
    // era-tinted darkening + a stronger bottom scrim (where readouts/captions sit)
    p.noStroke(); p.fill(col(p, era.bot, 90)); p.rect(0, 0, W, H);
    const sc = p.drawingContext.createLinearGradient(0, 0, 0, H);
    sc.addColorStop(0, hexToRgba(era.top, 0.28)); sc.addColorStop(0.55, 'rgba(0,0,0,0)'); sc.addColorStop(1, hexToRgba(era.ground, 0.62));
    p.drawingContext.fillStyle = sc; p.drawingContext.fillRect(0, 0, W, H);
  } else {
    // vertical sky gradient
    const g = p.drawingContext.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, era.top); g.addColorStop(1, era.bot);
    p.drawingContext.fillStyle = g; p.drawingContext.fillRect(0, 0, W, H);

    // far hill silhouettes (two parallax layers)
    if (era.hills) {
      const draw = (baseY, amp, hex, depth) => {
        const off = parallax(ctx, depth);
        p.noStroke(); p.fill(col(p, hex, 255));
        p.beginShape(); p.vertex(-20, H + 20);
        for (let x = -20; x <= W + 20; x += Math.max(24, W / 22)) {
          const y = baseY + off.y + Math.sin(x * 0.006 + baseY) * amp;
          p.vertex(x + off.x, y);
        }
        p.vertex(W + 20, H + 20); p.endShape(p.CLOSE);
      };
      draw(H * 0.72, S * 0.05, era.ground, 0.5);
      draw(H * 0.82, S * 0.04, era.top === '#101a30' ? '#0b1220' : era.ground, 1.0);
    } else {
      // a soft ground band for non-hill eras (grounds the scene)
      p.noStroke(); p.fill(col(p, era.ground, 200)); p.rect(0, H * 0.84, W, H * 0.16);
    }
  }

  // drifting motes (dust / birds / stars / faint glyphs), parallax layer
  // (subtler over a painted plate so they read as atmosphere, not clutter)
  const moteScale = hasPlate ? 0.5 : 1;
  const off = parallax(ctx, 0.8);
  const t = ctx.t;
  p.noStroke();
  for (const m of ctx.__motes) {
    const dx = REDUCED ? m.x : (m.x + t * 0.01 * m.drift + 1) % 1;
    const yb = m.y * 0.8;
    const bob = REDUCED ? 0 : Math.sin(t * m.sp + m.ph) * S * 0.01;
    const px = dx * W + off.x, py = yb * H + bob + off.y;
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * m.sp + m.ph));
    if (era.kind === 'bird') {
      p.stroke(col(p, era.mote, 90 * tw * moteScale)); p.strokeWeight(1.4); p.noFill();
      p.line(px - m.r * 3, py, px, py - m.r * 1.4); p.line(px, py - m.r * 1.4, px + m.r * 3, py);
      p.noStroke();
    } else if (era.kind === 'glyph') {
      txt(p, ['0','1','+','='][m.ph & 3] || '0', px, py, S * 0.02 + m.r, era.mote, { font: F.mono, a: 55 * tw * moteScale });
    } else {
      p.fill(col(p, era.mote, (era.kind === 'star' ? 130 : 70) * tw * moteScale));
      p.circle(px, py, m.r * (era.kind === 'dust' ? 1.6 : 1.2));
    }
  }
}

// ── p5 primitives ─────────────────────────────────────────────────────────────
export function col(p, hex, a = 255) { const c = p.color(hex); c.setAlpha(a); return c; }

export function txt(p, str, x, y, size, hex, o = {}) {
  const { font = F.sans, bold = false, italic = false, ha, va, a = 255, glow = 0 } = o;
  p.push();
  p.textFont(font); p.textSize(size);
  p.textAlign(ha ?? p.CENTER, va ?? p.CENTER);
  p.textStyle(bold && italic ? p.BOLDITALIC : bold ? p.BOLD : italic ? p.ITALIC : p.NORMAL);
  if (glow > 0) { p.drawingContext.shadowBlur = glow; p.drawingContext.shadowColor = hexToRgba(hex, a / 255); }
  p.noStroke(); p.fill(col(p, hex, a));
  p.text(str, x, y);
  p.drawingContext.shadowBlur = 0;
  p.pop();
}

export function glowShape(p, hex, blur, a, fn) {
  p.drawingContext.shadowBlur = blur;
  p.drawingContext.shadowColor = hexToRgba(hex, a);
  fn();
  p.drawingContext.shadowBlur = 0;
}

export function makeStars(n, seed = 7) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => ({
    x: r(), y: r() * 0.98, r: 0.6 + r() * 2.0,
    b: 0.4 + r() * 0.6, sp: 0.6 + r() * 2.4, ph: r() * 6.28, warm: r() < 0.12,
  }));
}
export function starfield(p, stars, time, alpha, W, H) {
  p.noStroke();
  for (const s of stars) {
    const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * s.sp + s.ph));
    p.fill(col(p, s.warm ? C.secondary : C.textHi, 255 * alpha * tw * s.b));
    p.circle(s.x * W, s.y * H, s.r);
  }
}

export function pebble(p, x, y, r, hex, a = 255, glow = 0) {
  glowShape(p, hex, glow, (a / 255) * 0.9, () => { p.noStroke(); p.fill(col(p, hex, a)); p.circle(x, y, r * 2); });
  p.noStroke(); p.fill(col(p, C.textHi, a * 0.5));
  p.circle(x - r * 0.32, y - r * 0.34, r * 0.7);
}

// A woolly sheep facing right. s = body radius.
export function sheep(p, x, y, s, a = 255, hi = false) {
  p.push(); p.noStroke();
  p.stroke(col(p, C.textLo, a)); p.strokeWeight(s * 0.14);
  p.line(x - s * 0.4, y + s * 0.5, x - s * 0.4, y + s * 0.95);
  p.line(x + s * 0.35, y + s * 0.5, x + s * 0.35, y + s * 0.95);
  p.noStroke();
  if (hi) { p.drawingContext.shadowBlur = 22; p.drawingContext.shadowColor = hexToRgba(C.primary, 0.55); }
  p.fill(col(p, C.wool, a));
  for (const [dx, dy, rr] of [[-.5,0,.62],[.1,-.25,.7],[.55,0,.55],[0,.2,.72],[-.2,-.3,.5]])
    p.circle(x + dx * s, y + dy * s, rr * s * 2);
  p.drawingContext.shadowBlur = 0;
  p.fill(col(p, C.grid, a)); p.circle(x + s * 0.85, y - s * 0.05, s * 0.85);
  p.fill(col(p, C.textHi, a * 0.9)); p.circle(x + s * 1.02, y - s * 0.12, s * 0.13);
  p.pop();
}

// Place-value cells centred at (cx,cy). Returns [{x,y}] left→right.
export function placeCells(p, cx, cy, cw, ch, labels, occupancy, hotIdx, labelFont = F.sans) {
  const n = labels.length, gap = cw * 0.28;
  const totalW = n * cw + (n - 1) * gap, x0 = cx - totalW / 2;
  const cells = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cw + gap) + cw / 2;
    const on = occupancy ? occupancy[i] : false;
    const hot = i === hotIdx;
    p.push(); p.rectMode(p.CENTER); p.noFill();
    if (on || hot) { p.drawingContext.shadowBlur = 18; p.drawingContext.shadowColor = hexToRgba(hot ? C.secondary : C.primary, 0.5); }
    p.stroke(col(p, hot ? C.secondary : on ? C.primary : C.grid, on || hot ? 235 : 150));
    p.strokeWeight(on || hot ? 2.5 : 1.5);
    p.fill(col(p, C.surface, on ? 205 : 120));
    p.rect(x, cy, cw, ch, 10);
    p.drawingContext.shadowBlur = 0; p.pop();
    txt(p, labels[i], x, cy + ch / 2 + 22, Math.max(11, cw * 0.15), on ? C.primary : C.textLo, { bold: true, font: labelFont });
    cells.push({ x, y: cy });
  }
  return cells;
}
