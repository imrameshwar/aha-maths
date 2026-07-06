// story/story-of-numbers.js
// "The Story of Numbers" — a cinematic, scene-sequenced p5 animation for the
// Aha Maths website. This is the site's first STORY-mode piece: a documentary
// re-told as animation (Motivation → problem → invention → payoff), the exact
// narrative-longform shape the channel wants, but built to *watch in the browser*.
//
// It is deliberately NOT a dual-mode engine visualizer (visualizers/ get synced to
// the Studio). It lives in story/ so it stays website-only and self-contained.
//
// Public API:  initStory({ canvasWrap, captionLayer, els })  → { play, pause, seek }
// The HTML shell owns the DOM (buttons, scrubber, poster); this owns the clock,
// the scene sequence, all drawing, and caption sync.

// ── Brand palette (mirrors engine/theme.js + style.css tokens) ──────────────────
const C = {
  bg:        '#0B0F1A',
  surface:   '#141A2A',
  grid:      '#222B3D',
  primary:   '#22D3EE', // cyan  — the active idea
  secondary: '#FBBF24', // amber — "the answer" / zero
  success:   '#34D399',
  danger:    '#F87171',
  accent2:   '#A78BFA', // violet — the imaginary / the exotic
  textHi:    '#FFFFFF',
  textLo:    '#94A3B8',
  dawn:      '#F59E0B',
};
const F = { sans: 'Plus Jakarta Sans', mono: 'JetBrains Mono' };

// ── Tiny math + easing helpers ──────────────────────────────────────────────────
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp    = (a, b, t) => a + (b - a) * t;
const smooth  = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const eoc     = (x) => { x = clamp01(x); return 1 - Math.pow(1 - x, 3); };       // easeOutCubic
const eic     = (x) => { x = clamp01(x); return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2; };
const eob     = (x) => { const c1 = 1.70158, c3 = c1 + 1; x = clamp01(x); return 1 + c3*Math.pow(x-1,3) + c1*Math.pow(x-1,2); }; // easeOutBack
// Progress of the window [a,b] at time t, eased-out. 0 before a, 1 after b.
const seg  = (t, a, b) => eoc((t - a) / (b - a));
const segL = (t, a, b) => clamp01((t - a) / (b - a)); // linear version

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ── p5 drawing primitives ───────────────────────────────────────────────────────
function col(p, hex, a = 255) { const c = p.color(hex); c.setAlpha(a); return c; }

function txt(p, str, x, y, size, hex, o = {}) {
  const { font = F.sans, bold = false, italic = false, ha, va, a = 255, glow = 0, tracking = 0 } = o;
  p.push();
  p.textFont(font);
  p.textSize(size);
  p.textAlign(ha ?? p.CENTER, va ?? p.CENTER);
  p.textStyle(bold && italic ? p.BOLDITALIC : bold ? p.BOLD : italic ? p.ITALIC : p.NORMAL);
  if (glow > 0) { p.drawingContext.shadowBlur = glow; p.drawingContext.shadowColor = hexToRgba(hex, a / 255); }
  p.noStroke();
  p.fill(col(p, hex, a));
  if (tracking) {
    // simple letter-spacing for hero words
    let total = 0;
    const widths = [...str].map((ch) => { const w = p.textWidth(ch) + tracking; total += w; return w; });
    let cx = x - total / 2;
    p.textAlign(p.LEFT, o.va ?? p.CENTER);
    [...str].forEach((ch, i) => { p.text(ch, cx, y); cx += widths[i]; });
  } else {
    p.text(str, x, y);
  }
  p.drawingContext.shadowBlur = 0;
  p.pop();
}

function glowShape(p, hex, blur, a, fn) {
  p.drawingContext.shadowBlur = blur;
  p.drawingContext.shadowColor = hexToRgba(hex, a);
  fn();
  p.drawingContext.shadowBlur = 0;
}

// ── Reusable scene props ────────────────────────────────────────────────────────
function starfield(p, stars, time, alpha, W, H) {
  p.noStroke();
  for (const s of stars) {
    const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * s.sp + s.ph));
    p.fill(col(p, s.warm ? C.secondary : C.textHi, 255 * alpha * tw * s.b)); // p5 alpha is 0..255
    p.circle(s.x * W, s.y * H, s.r);
  }
}

function pebble(p, x, y, r, hex, a = 255, glow = 0) {
  glowShape(p, hex, glow, (a / 255) * 0.9, () => {
    p.noStroke(); p.fill(col(p, hex, a)); p.circle(x, y, r * 2);
  });
  p.fill(col(p, C.textHi, a * 0.5)); p.noStroke();
  p.circle(x - r * 0.32, y - r * 0.34, r * 0.7); // highlight
}

// A small woolly sheep facing right. s = body radius.
function sheep(p, x, y, s, a = 255) {
  p.push();
  p.noStroke();
  // legs
  p.stroke(col(p, C.textLo, a)); p.strokeWeight(s * 0.14);
  p.line(x - s * 0.4, y + s * 0.5, x - s * 0.4, y + s * 0.95);
  p.line(x + s * 0.35, y + s * 0.5, x + s * 0.35, y + s * 0.95);
  p.noStroke();
  // woolly body — clustered blobs
  p.fill(col(p, '#E2E8F0', a));
  for (const [dx, dy, rr] of [[-.5,0,.62],[.1,-.25,.7],[.55,0,.55],[0,.2,.72],[-.2,-.3,.5]])
    p.circle(x + dx * s, y + dy * s, rr * s * 2);
  // head
  p.fill(col(p, C.grid, a));
  p.circle(x + s * 0.85, y - s * 0.05, s * 0.85);
  p.fill(col(p, C.textHi, a * 0.9));
  p.circle(x + s * 1.02, y - s * 0.12, s * 0.13); // eye
  p.pop();
}

// Column of place-value cells. Returns cell centers.
function placeCells(p, cx, cy, cw, ch, labels, activeIdx, time, occupancy) {
  const n = labels.length;
  const gap = cw * 0.28;
  const totalW = n * cw + (n - 1) * gap;
  const x0 = cx - totalW / 2;
  const cells = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cw + gap) + cw / 2;
    const on = occupancy ? occupancy[i] : false;
    const hot = i === activeIdx;
    p.push();
    p.rectMode(p.CENTER);
    p.noFill();
    const edge = on ? C.primary : C.grid;
    const ea = on ? 230 : 150;
    if (on) { p.drawingContext.shadowBlur = 18; p.drawingContext.shadowColor = hexToRgba(C.primary, 0.5); }
    p.stroke(col(p, edge, ea)); p.strokeWeight(on ? 2.5 : 1.5);
    p.fill(col(p, C.surface, on ? 210 : 120));
    p.rect(x, cy, cw, ch, 10);
    p.drawingContext.shadowBlur = 0;
    p.pop();
    txt(p, labels[i], x, cy + ch / 2 + 22, Math.max(12, cw * 0.16), on ? C.primary : C.textLo,
        { font: F.sans, bold: true, tracking: 1 });
    cells.push({ x, y: cy });
  }
  return cells;
}

// ═════════════════════════════════════════════════════════════════════════════
// SCENES.  Each: { id, title, dur, space, captions:[{at,who?,text}], draw(p,lt,A) }
//   lt = local time in seconds within the scene.
//   A  = { W,H,cx,cy,S,stars,time }  (time = global clock, for twinkles)
// ═════════════════════════════════════════════════════════════════════════════
const SCENES = [

// ── 1 · The First Question ──────────────────────────────────────────────────────
{
  id: 'first-question', title: 'The First Question', dur: 16, space: true,
  captions: [
    { at: 0,  text: 'Before empires. Before writing. Before clocks and coins…' },
    { at: 4.5, text: 'there was a world without numbers.' },
    { at: 7.5, text: 'No 1. No 10. No 1000. No way to write your age or measure a field.' },
    { at: 12, text: 'And yet one question echoed through all of history…' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy } = A;
    // a lone firelight flickers low
    const fa = 90 + 40 * Math.sin(A.time * 6);
    glowShape(p, C.dawn, 60, 0.5, () => { p.noStroke(); p.fill(col(p, C.dawn, fa)); p.circle(cx, H * 0.86, A.S * 0.05); });
    // the question assembles from drifting embers, then glows
    const build = seg(lt, 11.5, 14.5);
    if (build > 0) {
      const a = 255 * build;
      txt(p, 'How many?', cx, cy, A.S * 0.14, C.secondary,
          { font: F.sans, bold: true, italic: true, a, glow: 40 * build });
    }
  },
},

// ── 2 · The Shepherd's Problem ──────────────────────────────────────────────────
{
  id: 'shepherd', title: "The Shepherd's Problem", dur: 22, space: false,
  captions: [
    { at: 0,  text: 'A shepherd leads his flock out at dawn.' },
    { at: 3.5, who: 'SHEPHERD', text: 'Wait… did I bring them all back?' },
    { at: 7,  text: 'He has no word for "twenty", no symbol to write. So he invents a trick.' },
    { at: 11, who: 'SHEPHERD', text: 'One sheep… one stone. Another sheep… another stone.' },
    { at: 15, text: 'At dusk, one stone leaves the pouch for each sheep that returns.' },
    { at: 19, who: 'SHEPHERD', text: 'One is missing.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    // dawn sky gradient + rising sun
    const g = p.drawingContext.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.bg); g.addColorStop(0.7, '#17233A'); g.addColorStop(1, '#3A2A1E');
    p.drawingContext.fillStyle = g; p.drawingContext.fillRect(0, 0, W, H);
    const sunY = lerp(H * 0.9, H * 0.42, smooth(lt / 10));
    glowShape(p, C.dawn, 70, 0.6, () => { p.noStroke(); p.fill(col(p, C.dawn, 220)); p.circle(W * 0.2, sunY, S * 0.11); });
    // ground
    p.noStroke(); p.fill(col(p, '#0E1526', 255)); p.rect(0, H * 0.82, W, H * 0.18);

    const N = 6;
    const fill   = Math.min(N, Math.floor(segL(lt, 0.5, 8) * N + 0.001));   // sheep out → pebbles in
    const backP  = segL(lt, 13, 19);
    const returned = Math.floor(backP * (N - 1) + 0.001);                    // only 5 return
    const remaining = lt < 13 ? fill : N - returned;

    // flock — sheep spread across the field, walking phase gives gentle bob
    const groundY = H * 0.8;
    for (let i = 0; i < N; i++) {
      const present = lt < 13 ? i < fill : i < N - 0 && i >= returned; // during return, front ones gone
      if (lt < 13 && i >= fill) continue;
      if (lt >= 13 && i < returned) continue;
      const baseX = lerp(W * 0.16, W * 0.66, i / (N - 1));
      const bob = Math.sin(A.time * 3 + i) * S * 0.012;
      sheep(p, baseX, groundY + bob, S * 0.055, 255);
    }

    // the pouch (stones) — a rounded bag on the right with a stack of pebbles
    const bx = W * 0.86, by = H * 0.6;
    txt(p, 'the pouch', bx, by - S * 0.2, Math.max(12, S * 0.03), C.textLo, { font: F.sans });
    p.push(); p.rectMode(p.CENTER); p.noStroke();
    p.fill(col(p, C.surface, 235)); p.stroke(col(p, C.grid, 220)); p.strokeWeight(2);
    p.rect(bx, by, S * 0.2, S * 0.26, 16);
    p.pop();
    // pebbles stack inside, one per remaining sheep
    for (let i = 0; i < remaining; i++) {
      const px = bx - S * 0.055 + (i % 2) * S * 0.055;
      const py = by + S * 0.09 - Math.floor(i / 2) * S * 0.05;
      const isLast = (lt >= 19 && remaining === 1);
      pebble(p, px, py, S * 0.022, isLast ? C.danger : C.secondary, 255, isLast ? 26 : 8);
    }
    // 1:1 tally readout
    txt(p, `sheep ${lt < 13 ? fill : N - returned}   ·   stones ${remaining}`,
        cx, H * 0.93, Math.max(13, S * 0.032), C.textLo, { font: F.mono });
    if (lt >= 19) txt(p, 'ONE STONE REMAINS', cx, H * 0.14, S * 0.045, C.danger, { font: F.sans, bold: true, glow: 20 });
  },
},

// ── 3 · Counting With the Body ──────────────────────────────────────────────────
{
  id: 'body-counting', title: 'Counting With the Body', dur: 16, space: false,
  captions: [
    { at: 0,  text: 'Long before ink and paper, numbers lived in the body.' },
    { at: 4,  text: 'On fingers. On toes. On bone. On rope tied into knots.' },
    { at: 8,  who: 'HUNTER', text: 'One deer today. Two yesterday. Three this week.' },
    { at: 12, text: 'Not numbers as we know them — memory made visible.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    // tally marks on "bone" — strokes appear one by one, grouped in fives
    const total = 12;
    const shown = Math.min(total, Math.floor(segL(lt, 0.5, 11) * total + 0.001));
    const groupW = S * 0.16, gap = S * 0.06;
    const groups = Math.ceil(total / 5);
    const startX = cx - (groups * groupW + (groups - 1) * gap) / 2;
    const rowY = cy - S * 0.02;
    txt(p, 'tally on bone', cx, rowY - S * 0.16, Math.max(12, S * 0.03), C.textLo, { font: F.sans });
    for (let g = 0; g < groups; g++) {
      const gx = startX + g * (groupW + gap);
      for (let k = 0; k < 5; k++) {
        const idx = g * 5 + k;
        if (idx >= shown) break;
        p.stroke(col(p, k === 4 ? C.secondary : C.primary, 240)); p.strokeWeight(S * 0.008);
        p.drawingContext.shadowBlur = 10; p.drawingContext.shadowColor = hexToRgba(C.primary, 0.4);
        if (k < 4) {
          const lx = gx + k * (groupW / 5);
          p.line(lx, rowY - S * 0.07, lx, rowY + S * 0.07);
        } else {
          p.line(gx - groupW * 0.02, rowY + S * 0.08, gx + groupW * 0.82, rowY - S * 0.08); // the crossing fifth
        }
        p.drawingContext.shadowBlur = 0;
      }
    }
    txt(p, String(shown), cx, cy + S * 0.19, S * 0.07, C.textHi, { font: F.mono, bold: true });

    // a hand of fingers rising (schematic), lower-left
    const fingers = Math.min(5, Math.ceil(segL(lt, 0.5, 5) * 5));
    const hx = W * 0.16, hy = H * 0.8;
    p.noStroke(); p.fill(col(p, C.grid, 220)); p.rectMode(p.CENTER);
    p.rect(hx, hy + S * 0.06, S * 0.12, S * 0.09, 8);
    for (let i = 0; i < 5; i++) {
      const up = i < fingers;
      p.fill(col(p, up ? C.secondary : C.grid, up ? 235 : 140));
      p.rect(hx - S * 0.045 + i * S * 0.0225, hy - (up ? S * 0.04 : S * 0.005), S * 0.016, up ? S * 0.11 : S * 0.03, 6);
    }
    // knotted rope, lower-right
    const knots = Math.min(4, Math.ceil(segL(lt, 4, 10) * 4));
    const ry = H * 0.82;
    p.stroke(col(p, C.textLo, 200)); p.strokeWeight(S * 0.006); p.noFill();
    p.line(W * 0.72, ry, W * 0.9, ry);
    p.noStroke();
    for (let i = 0; i < knots; i++) { p.fill(col(p, C.success, 230)); p.circle(W * 0.74 + i * S * 0.045, ry, S * 0.02); }
  },
},

// ── 4 · When Villages Became Cities ─────────────────────────────────────────────
{
  id: 'cities', title: 'When Villages Became Cities', dur: 16, space: false,
  captions: [
    { at: 0,  text: 'As villages became cities, counting was more than survival.' },
    { at: 4,  who: 'SCRIBE', text: 'Thirty jars of barley for the temple.' },
    { at: 8,  who: 'SCRIBE', text: 'Twelve goats for the king\'s storehouse.' },
    { at: 11.5, text: 'Now humans needed not just to count — but to count accurately.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    // a clay tablet
    p.push(); p.rectMode(p.CENTER); p.noStroke();
    glowShape(p, '#000000', 30, 0.4, () => {});
    p.fill(col(p, '#6B5A44', 255)); p.rect(cx, cy, S * 0.66, S * 0.46, 18);
    p.fill(col(p, '#7A6750', 255)); p.rect(cx, cy, S * 0.6, S * 0.4, 14);
    p.pop();

    // cuneiform-ish wedge rows pressed in over time
    const rows = [
      { y: cy - S * 0.1, n: 8, label: '30 jars  🌾', who: 4 },
      { y: cy + S * 0.06, n: 6, label: '12 goats', who: 8 },
    ];
    rows.forEach((r) => {
      const prog = segL(lt, r.who - 3.5, r.who + 1.5);
      const shown = Math.floor(prog * r.n + 0.001);
      for (let i = 0; i < shown; i++) {
        const wx = cx - S * 0.22 + i * S * 0.05;
        p.fill(col(p, '#3A2E22', 255)); p.noStroke();
        p.push(); p.translate(wx, r.y); p.rotate(-0.2);
        p.triangle(0, 0, S * 0.03, -S * 0.014, S * 0.03, S * 0.014); // wedge
        p.pop();
      }
    });
    // readouts appear as the scribe speaks
    if (lt >= 4) txt(p, '30', cx - S * 0.02, cy - S * 0.1, S * 0.05, C.secondary, { font: F.mono, bold: true, a: 255 * seg(lt, 4, 5) });
    if (lt >= 8) txt(p, '12', cx - S * 0.05, cy + S * 0.06, S * 0.05, C.secondary, { font: F.mono, bold: true, a: 255 * seg(lt, 8, 9) });
    txt(p, 'Mesopotamia · marks in wet clay', cx, cy + S * 0.3, Math.max(12, S * 0.03), C.textLo, { font: F.sans });
  },
},

// ── 5 · Symbols Are Born ────────────────────────────────────────────────────────
{
  id: 'symbols', title: 'Symbols Are Born', dur: 18, space: false,
  captions: [
    { at: 0,  text: 'Every civilization built its own symbols.' },
    { at: 3.5, text: 'Babylonian marks. Greek letters. Roman I · V · X · L · C · D · M.' },
    { at: 8,  who: 'APPRENTICE', text: 'Master… how do I multiply them?' },
    { at: 11, who: 'MERCHANT', text: '…Carefully.' },
    { at: 13.5, text: 'They could record numbers. But calculation was heavy, slow, hard.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    // three rows of numeral systems fading in.
    // Only glyphs the bundled fonts actually cover — cuneiform/hieroglyphs would tofu.
    const rows = [
      { y: cy - S * 0.2,  label: 'Older marks', glyphs: '|  ||  |||  ||||', at: 1 },
      { y: cy - 0.02 * S, label: 'Greek',       glyphs: 'Α Β Γ Δ Ε',      at: 2.2 },
      { y: cy + S * 0.16, label: 'Roman',       glyphs: 'I V X L C D M',   at: 3.5 },
    ];
    rows.forEach((r) => {
      // rows clear out once the "how do I multiply?" tangle takes over
      const a = 255 * seg(lt, r.at, r.at + 1.5) * (1 - segL(lt, 7.5, 8.7));
      if (a <= 2) return;
      txt(p, r.label, cx - S * 0.34, r.y, Math.max(12, S * 0.03), C.textLo, { font: F.sans, ha: p.RIGHT, a });
      txt(p, r.glyphs, cx - S * 0.24, r.y, S * 0.05, C.primary, { font: F.sans, bold: true, ha: p.LEFT, a });
    });

    // Roman multiplication tangles into a mess
    const t2 = segL(lt, 8, 15);
    if (t2 > 0) {
      const a = 255 * seg(lt, 8, 9);
      txt(p, 'XIV  ×  XXIII  =  ?', cx, cy - S * 0.16, S * 0.06, C.secondary, { font: F.sans, bold: true, a, glow: 14 * (a / 255) });
      // scattered flailing symbols
      const rnd = mulberry32(7);
      const shake = smooth(t2) * S * 0.04;
      for (let i = 0; i < 16; i++) {
        const gx = cx + (rnd() - 0.5) * S * 0.72;
        const gy = cy + S * 0.08 + (rnd() - 0.5) * S * 0.22;
        const jitter = Math.sin(A.time * 12 + i) * shake;
        txt(p, 'IVXLCDM'[i % 7], gx + jitter, gy, S * 0.04, C.danger,
            { font: F.sans, bold: true, a: 200 * smooth(t2) });
      }
    }
  },
},

// ── 6 · The Secret of Position (the aha) ────────────────────────────────────────
{
  id: 'place-value', title: 'The Secret of Position', dur: 20, space: false,
  captions: [
    { at: 0,  text: 'Then came a breakthrough that changed mathematics forever.' },
    { at: 4,  who: 'TEACHER', text: 'Look carefully. This is 2. This is 20. This is 200.' },
    { at: 9,  who: 'STUDENT', text: 'But… it is the same symbol.' },
    { at: 12, who: 'TEACHER', text: 'Yes. And its place changes its power.' },
    { at: 15.5, text: 'A few symbols could now express infinitely larger ideas.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    const cw = S * 0.16, ch = S * 0.22;
    const rowY = cy + S * 0.02;

    // place index d: 0=ones, 1=tens, 2=hundreds — slide the digit '2' left
    let d = 0;
    d = lerp(0, 1, seg(lt, 5, 7));
    if (lt > 9) d = lerp(1, 2, seg(lt, 9, 11));
    const dr = Math.round(clamp01(d / 2) * 2);
    const occ = [dr >= 2, dr >= 1, true]; // [hundreds, tens, ones] occupied
    const cells = placeCells(p, cx, rowY, cw, ch, ['Hundreds', 'Tens', 'Ones'], 2 - dr, A.time, occ);
    // cells indexed left→right: [hundreds, tens, ones]. digit place d → column index 2-d.
    const colFor = (place) => cells[2 - place];

    // zeros that hold the lower places
    if (dr >= 1) { const c = colFor(0); txt(p, '0', c.x, c.y, ch * 0.55, C.secondary, { font: F.mono, bold: true, glow: 14 }); }
    if (dr >= 2) { const c = colFor(1); txt(p, '0', c.x, c.y, ch * 0.55, C.secondary, { font: F.mono, bold: true, glow: 14 }); }

    // the sliding digit
    const fromP = lt <= 9 ? 0 : 1;
    const toP   = lt <= 9 ? 1 : 2;
    const cFrom = colFor(fromP), cTo = colFor(toP);
    const slide = lt < 5 ? 0 : lt < 9 ? seg(lt, 5, 7) : seg(lt, 9, 11);
    const dx = lerp(cFrom.x, cTo.x, slide);
    txt(p, '2', dx, rowY, ch * 0.6, C.primary, { font: F.mono, bold: true, glow: 22 });

    // ×10 pulse during a slide
    const sliding = (lt > 5 && lt < 7) || (lt > 9 && lt < 11);
    if (sliding) {
      const mid = (cFrom.x + cTo.x) / 2;
      txt(p, '×10', mid, rowY - ch * 0.8, S * 0.045, C.success, { font: F.sans, bold: true, glow: 12 });
    }

    // big value readout
    const val = dr === 0 ? 2 : dr === 1 ? 20 : 200;
    txt(p, String(val), cx, cy - S * 0.24, S * 0.11, C.textHi, { font: F.mono, bold: true, glow: 18 });
    txt(p, 'same digit — new power', cx, cy + S * 0.28, Math.max(12, S * 0.032), C.textLo, { font: F.sans });
  },
},

// ── 7 · The Mystery of Nothing ──────────────────────────────────────────────────
{
  id: 'nothing', title: 'The Mystery of Nothing', dur: 20, space: false,
  captions: [
    { at: 0,  text: 'But a shadow remained. How do you write a number with an empty place?' },
    { at: 5,  text: 'No tens… but hundreds. How do you give shape to nothing?' },
    { at: 10, who: 'SCHOLAR', text: 'Emptiness is not confusion. It has meaning. It has a place.' },
    { at: 15, text: 'And so, in ancient India, the world received one great idea: zero.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    const cw = S * 0.16, ch = S * 0.22, rowY = cy + S * 0.02;
    const filled = lt >= 15; // zero drops in near the end
    const occ = [true, filled, true];
    const cells = placeCells(p, cx, rowY, cw, ch, ['Hundreds', 'Tens', 'Ones'], filled ? 1 : -1, A.time, occ);

    txt(p, '1', cells[0].x, rowY, ch * 0.6, C.primary, { font: F.mono, bold: true, glow: 16 });
    txt(p, '5', cells[2].x, rowY, ch * 0.6, C.primary, { font: F.mono, bold: true, glow: 16 });

    if (!filled) {
      // ambiguity: the empty column blinks with a question mark; two readings flicker
      const q = 0.4 + 0.6 * Math.abs(Math.sin(A.time * 3));
      txt(p, '?', cells[1].x, rowY, ch * 0.6, C.danger, { font: F.sans, bold: true, a: 255 * q });
      const flip = Math.floor(A.time * 0.9) % 2 === 0;
      txt(p, flip ? 'is it  15 ?' : 'or  105 ?', cx, cy - S * 0.24, S * 0.06,
          flip ? C.textLo : C.danger, { font: F.mono, bold: true });
    } else {
      // zero drops from above into the tens column and locks the value to 105
      const drop = seg(lt, 15, 16.4);
      const zy = lerp(rowY - S * 0.5, rowY, drop);
      txt(p, '0', cells[1].x, zy, ch * 0.6, C.secondary, { font: F.mono, bold: true, glow: 26 });
      txt(p, '1 0 5', cx, cy - S * 0.24, S * 0.08, C.textHi, { font: F.mono, bold: true, glow: 18, a: 255 * seg(lt, 16.2, 17.2) });
      txt(p, 'zero holds the empty place', cx, cy + S * 0.3, Math.max(12, S * 0.032), C.secondary, { font: F.sans, a: 255 * seg(lt, 16.5, 17.5) });
    }
  },
},

// ── 8 · When Zero Changed the World ─────────────────────────────────────────────
{
  id: 'zero-power', title: 'When Zero Changed the World', dur: 16, space: true,
  captions: [
    { at: 0,  text: 'Without zero, place value collapses.' },
    { at: 3,  text: '101 becomes confusion. 1005 becomes chaos.' },
    { at: 7,  who: 'STUDENT', text: 'So this small circle means… nothing?' },
    { at: 10.5, who: 'SCHOLAR', text: 'It means nothing. And because of that — it means everything.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    const seq = ['1', '10', '100', '101', '1005'];
    const idx = Math.min(seq.length - 1, Math.floor(segL(lt, 0.5, 12) * seq.length));
    const cur = seq[idx];
    // draw the number big, with zeros pulsing amber
    p.textFont(F.mono); p.textStyle(p.BOLD); p.textSize(S * 0.2); p.textAlign(p.CENTER, p.CENTER);
    const totalW = p.textWidth(cur);
    let x = cx - totalW / 2;
    p.textAlign(p.LEFT, p.CENTER);
    for (const chr of cur) {
      const w = p.textWidth(chr);
      const isZero = chr === '0';
      const pulse = isZero ? (0.6 + 0.4 * Math.sin(A.time * 4)) : 1;
      const hex = isZero ? C.secondary : C.textHi;
      p.drawingContext.shadowBlur = isZero ? 30 : 14;
      p.drawingContext.shadowColor = hexToRgba(hex, 0.6 * pulse);
      p.noStroke(); p.fill(col(p, hex, 255 * (isZero ? pulse : 1)));
      p.text(chr, x, cy);
      x += w;
    }
    p.drawingContext.shadowBlur = 0;
    txt(p, 'the zeros hold the shape of the number', cx, cy + S * 0.26, Math.max(12, S * 0.032), C.textLo, { font: F.sans });
  },
},

// ── 9 · Ten Symbols, Endless Power ──────────────────────────────────────────────
{
  id: 'ten-symbols', title: 'Ten Symbols, Endless Power', dur: 20, space: true,
  captions: [
    { at: 0,  text: 'With just ten symbols — 0 1 2 3 4 5 6 7 8 9 — you can write any number.' },
    { at: 5,  text: 'The price of wheat. The distance to a star. The height of a temple.' },
    { at: 10, text: 'Born in India, carried and refined by Arab scholars, adopted by the world.' },
    { at: 15, text: 'We call them the Hindu-Arabic numerals — great ideas travel many hands.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    // the ten digits glow into a row
    const digitsY = cy - S * 0.16;
    const n = 10, sp = S * 0.085, x0 = cx - (n - 1) * sp / 2;
    for (let i = 0; i < n; i++) {
      const a = 255 * seg(lt, 0.3 + i * 0.18, 1.3 + i * 0.18);
      if (a <= 2) continue;
      txt(p, String(i), x0 + i * sp, digitsY, S * 0.07, C.primary, { font: F.mono, bold: true, a, glow: 16 * (a / 255) });
    }

    // an odometer of a big changing number
    const t2 = segL(lt, 4.5, 15);
    if (t2 > 0) {
      const rnd = mulberry32(Math.floor(A.time * 6));
      let s = '';
      for (let k = 0; k < 7; k++) s += Math.floor(rnd() * 10);
      const num = s.slice(0, 3) + ',' + s.slice(3);
      txt(p, num, cx, cy + S * 0.02, S * 0.09, C.textHi, { font: F.mono, bold: true, a: 255 * smooth(t2), glow: 12 });
    }

    // the journey arc: India → Arabia → Europe
    const jt = segL(lt, 10, 19);
    if (jt > 0) {
      const stops = [
        { x: 0.7, label: 'India' },
        { x: 0.5, label: 'Arab world' },
        { x: 0.3, label: 'Europe' },
      ];
      const ay = cy + S * 0.26;
      p.noFill(); p.stroke(col(p, C.grid, 200)); p.strokeWeight(2);
      p.beginShape();
      for (let s = 0; s <= 1; s += 0.02) p.vertex(lerp(W * 0.7, W * 0.3, s), ay - Math.sin(s * Math.PI) * S * 0.06);
      p.endShape();
      stops.forEach((st, i) => {
        const a = 255 * seg(jt, i * 0.25, i * 0.25 + 0.3);
        p.noStroke(); p.fill(col(p, C.secondary, a));
        p.drawingContext.shadowBlur = 14; p.drawingContext.shadowColor = hexToRgba(C.secondary, 0.6 * a / 255);
        p.circle(W * st.x, ay, S * 0.02); p.drawingContext.shadowBlur = 0;
        txt(p, st.label, W * st.x, ay + S * 0.05, Math.max(11, S * 0.028), C.textLo, { font: F.sans, a });
      });
      // a glyph travelling along the arc
      const s = eic(segL(jt, 0.15, 0.95));
      const gx = lerp(W * 0.7, W * 0.3, s), gy = ay - Math.sin(s * Math.PI) * S * 0.06;
      txt(p, '7', gx, gy - S * 0.03, S * 0.045, C.primary, { font: F.mono, bold: true, glow: 16 });
    }
  },
},

// ── 10 · More Than Counting ─────────────────────────────────────────────────────
{
  id: 'beyond-counting', title: 'More Than Counting', dur: 22, space: false,
  captions: [
    { at: 0,  text: 'At first, numbers counted sheep and grain. Then life asked harder questions.' },
    { at: 4,  who: 'MERCHANT', text: 'I owe more than I own. How do I write less than nothing?' },
    { at: 8,  who: 'CHILD', text: 'Can one loaf become four equal parts?' },
    { at: 11.5, who: 'ARCHITECT', text: 'I need more precision.' },
    { at: 14.5, who: 'GEOMETER', text: 'This length is no simple fraction.' },
    { at: 17.5, who: 'ALGEBRAIST', text: 'What number squares to a negative?' },
    { at: 20, text: 'Reality asked. Numbers answered.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    const axisY = cy + S * 0.06;
    const unit = S * 0.11;
    const x = (v) => cx + v * unit;
    // base axis
    p.stroke(col(p, C.grid, 220)); p.strokeWeight(2);
    p.line(W * 0.08, axisY, W * 0.92, axisY);
    // positive ticks (0..3) appear first
    for (let v = 0; v <= 3; v++) {
      const a = 255 * seg(lt, 0.3 + v * 0.4, 1.3 + v * 0.4);
      if (a <= 2) continue;
      p.stroke(col(p, C.primary, a)); p.strokeWeight(2);
      p.line(x(v), axisY - S * 0.02, x(v), axisY + S * 0.02);
      txt(p, String(v), x(v), axisY + S * 0.055, Math.max(12, S * 0.03), v === 0 ? C.secondary : C.textLo, { font: F.mono, bold: v === 0, a });
    }
    // negatives extend left
    for (let v = 1; v <= 3; v++) {
      const a = 255 * seg(lt, 4 + v * 0.3, 5 + v * 0.3);
      if (a <= 2) continue;
      p.stroke(col(p, C.danger, a)); p.strokeWeight(2);
      p.line(x(-v), axisY - S * 0.02, x(-v), axisY + S * 0.02);
      txt(p, '-' + v, x(-v), axisY + S * 0.055, Math.max(12, S * 0.03), C.danger, { font: F.mono, a });
    }
    // fraction 1/2 — a little bar split, marker between 0 and 1
    const fa = seg(lt, 8, 9.5);
    if (fa > 0) {
      p.noStroke(); p.fill(col(p, C.success, 200 * fa)); p.circle(x(0.5), axisY, S * 0.016);
      txt(p, '1/2', x(0.5), axisY - S * 0.05, Math.max(12, S * 0.03), C.success, { font: F.mono, bold: true, a: 255 * fa });
    }
    // decimal 3.14 near 3 (nudged left so it stays on-axis)
    const da = seg(lt, 11.5, 13);
    if (da > 0) { p.noStroke(); p.fill(col(p, C.primary, 220 * da)); p.circle(x(3.14 - 0.9), axisY, S * 0.014);
      txt(p, '3.14', x(3.14 - 0.9), axisY - S * 0.05, Math.max(12, S * 0.03), C.primary, { font: F.mono, bold: true, a: 255 * da }); }
    // irrational √2
    const ia = seg(lt, 14.5, 16);
    if (ia > 0) { p.noStroke(); p.fill(col(p, C.secondary, 220 * ia)); p.circle(x(1.414), axisY, S * 0.014);
      txt(p, '√2', x(1.414), axisY - S * 0.05, Math.max(12, S * 0.03), C.secondary, { font: F.sans, bold: true, a: 255 * ia }); }
    // imaginary i — an axis rises from 0
    const ma = seg(lt, 17.5, 19.5);
    if (ma > 0) {
      p.stroke(col(p, C.accent2, 220 * ma)); p.strokeWeight(2);
      p.line(x(0), axisY, x(0), axisY - S * 0.16 * ma);
      p.noStroke(); p.fill(col(p, C.accent2, 230 * ma));
      p.drawingContext.shadowBlur = 16; p.drawingContext.shadowColor = hexToRgba(C.accent2, 0.6 * ma);
      p.circle(x(0), axisY - S * 0.16 * ma, S * 0.016); p.drawingContext.shadowBlur = 0;
      txt(p, 'i', x(0) + S * 0.03, axisY - S * 0.16 * ma, S * 0.04, C.accent2, { font: F.sans, bold: true, italic: true, a: 255 * ma });
    }
  },
},

// ── 11 · From Pebbles to Planets ────────────────────────────────────────────────
{
  id: 'pebbles-to-planets', title: 'From Pebbles to Planets', dur: 18, space: true,
  captions: [
    { at: 0,  text: 'What began with pebbles became the language of science.' },
    { at: 4,  who: 'CHILD', text: 'One… two… three…' },
    { at: 7,  who: 'SCIENTIST', text: 'The galaxy is 2.5 million light-years away.' },
    { at: 11, who: 'PROGRAMMER', text: 'Here, everything becomes numbers.' },
    { at: 14, text: 'Numbers became the invisible architecture of the modern world.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    // pebble → orbiting system → galaxy of digits
    const morph = smooth(segL(lt, 3, 8));
    // central body
    pebble(p, cx, cy, lerp(S * 0.03, S * 0.055, morph), C.secondary, 255, lerp(10, 34, morph));
    // orbital rings appear
    const rings = segL(lt, 4, 9);
    for (let r = 0; r < 3; r++) {
      const a = 200 * seg(rings, r * 0.2, r * 0.2 + 0.4);
      if (a <= 2) continue;
      const rad = S * (0.11 + r * 0.07);
      p.noFill(); p.stroke(col(p, C.primary, a * 0.5)); p.strokeWeight(1.5); p.circle(cx, cy, rad * 2);
      const ang = A.time * (0.8 - r * 0.2) + r * 2;
      const ex = cx + Math.cos(ang) * rad, ey = cy + Math.sin(ang) * rad;
      p.noStroke(); p.fill(col(p, C.primary, a));
      p.drawingContext.shadowBlur = 12; p.drawingContext.shadowColor = hexToRgba(C.primary, 0.6);
      p.circle(ex, ey, S * 0.018); p.drawingContext.shadowBlur = 0;
    }
    // streaming digits outward → a "galaxy"
    const gal = segL(lt, 8, 17);
    if (gal > 0) {
      const rnd = mulberry32(99);
      p.textFont(F.mono); p.textStyle(p.BOLD); p.textAlign(p.CENTER, p.CENTER);
      for (let i = 0; i < 90; i++) {
        const ang = rnd() * Math.PI * 2 + A.time * 0.15;
        const rad = (0.05 + rnd() * 0.55) * S * (0.9 + 0.6 * gal);
        const px = cx + Math.cos(ang) * rad, py = cy + Math.sin(ang) * rad * 0.6;
        const a = 160 * gal * (0.4 + 0.6 * rnd());
        p.textSize(S * (0.016 + rnd() * 0.02));
        p.noStroke(); p.fill(col(p, rnd() > 0.5 ? C.primary : C.textLo, a));
        p.text(Math.floor(rnd() * 10), px, py);
      }
    }
    // the big cosmic number
    const na = seg(lt, 7.5, 9);
    if (na > 0 && lt < 14) txt(p, '2,500,000', cx, cy + S * 0.34, S * 0.06, C.secondary, { font: F.mono, bold: true, a: 255 * na * seg(14 - lt, 0, 1), glow: 14 });
  },
},

// ── 12 · Who Invented Numbers? · Finale ─────────────────────────────────────────
{
  id: 'finale', title: 'Who Invented Numbers?', dur: 22, space: true,
  captions: [
    { at: 0,  text: 'So who invented numbers? Not one person. Not one nation.' },
    { at: 4.5, text: 'Shepherds, traders, scribes, astronomers — across thousands of years.' },
    { at: 9,  text: 'The story of numbers is the story of human thought learning to hold the world.' },
    { at: 13.5, text: 'Once, scratches on bone. Now — in every screen, every clock, every machine.' },
    { at: 17.5, text: 'But it began simply: a missing sheep, a worried shepherd, a stone in a pouch.' },
  ],
  draw(p, lt, A) {
    const { W, H, cx, cy, S } = A;
    // stars that turn into digits
    const digify = smooth(segL(lt, 9, 15));
    p.textFont(F.mono); p.textStyle(p.BOLD); p.textAlign(p.CENTER, p.CENTER);
    const rnd = mulberry32(2024);
    for (let i = 0; i < 60; i++) {
      const sx = rnd() * W, sy = rnd() * H * 0.9;
      const tw = 0.5 + 0.5 * Math.sin(A.time * (1 + rnd() * 2) + i);
      if (rnd() < digify) {
        p.textSize(S * 0.022); p.noStroke();
        p.fill(col(p, i % 3 === 0 ? C.secondary : C.primary, 180 * tw));
        p.text(Math.floor(rnd() * 10), sx, sy);
      } else {
        p.noStroke(); p.fill(col(p, C.textHi, 160 * tw)); p.circle(sx, sy, 2.2);
      }
    }

    // montage of the many hands (first ~9s)
    const montage = segL(lt, 1, 8) * (1 - segL(lt, 9, 11));
    if (montage > 0.02) {
      const roles = ['shepherd', 'scribe', 'scholar', 'astronomer', 'trader', 'child'];
      const n = roles.length, ry = cy;
      roles.forEach((role, i) => {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        const rad = S * 0.26;
        const px = cx + Math.cos(ang) * rad, py = ry + Math.sin(ang) * rad * 0.7;
        const a = 255 * montage * seg(lt, 1 + i * 0.4, 2 + i * 0.4);
        p.noStroke();
        p.drawingContext.shadowBlur = 16; p.drawingContext.shadowColor = hexToRgba(C.primary, 0.4 * a / 255);
        p.fill(col(p, C.surface, a)); p.stroke(col(p, C.primary, a)); p.strokeWeight(1.5);
        p.circle(px, py, S * 0.06); p.drawingContext.shadowBlur = 0;
        txt(p, role, px, py + S * 0.055, Math.max(10, S * 0.024), C.textLo, { font: F.sans, a });
      });
      txt(p, 'many minds · many lands · one idea', cx, cy, Math.max(12, S * 0.032), C.textHi, { font: F.sans, a: 255 * montage });
    }

    // final: "How many?" rises, then the closing line
    const finalA = seg(lt, 15.5, 18);
    if (finalA > 0) {
      txt(p, 'How many?', cx, cy - S * 0.02, S * 0.12, C.secondary, { font: F.sans, bold: true, italic: true, a: 255 * finalA, glow: 34 * finalA });
    }
    const closeA = seg(lt, 19.5, 21);
    if (closeA > 0) {
      txt(p, 'The moment humans asked that question,', cx, cy + S * 0.16, Math.max(13, S * 0.033), C.textLo, { font: F.sans, italic: true, a: 220 * closeA });
      txt(p, 'civilization began to count itself into existence.', cx, cy + S * 0.21, Math.max(13, S * 0.033), C.textLo, { font: F.sans, italic: true, a: 220 * closeA });
    }
  },
},
];

// ═════════════════════════════════════════════════════════════════════════════
// PLAYER — clock, sequencing, transitions, DOM/caption sync.
// ═════════════════════════════════════════════════════════════════════════════
export function initStory({ canvasWrap, captionLayer, els }) {
  // cumulative start times
  let acc = 0;
  const starts = SCENES.map((s) => { const st = acc; acc += s.dur; return st; });
  const TOTAL = acc;

  // stable starfield
  const rnd = mulberry32(1337);
  const STARS = Array.from({ length: 150 }, () => ({
    x: rnd(), y: rnd() * 0.96, r: 0.6 + rnd() * 2.0,
    b: 0.4 + rnd() * 0.6, sp: 0.6 + rnd() * 2.4, ph: rnd() * 6.28, warm: rnd() < 0.12,
  }));

  let elapsed = 0;
  let playing = false;
  let ended = false;
  let lastCapKey = null;

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function sceneAt(t) {
    let i = SCENES.length - 1;
    for (let k = 0; k < SCENES.length; k++) if (t >= starts[k]) i = k; else break;
    return { i, lt: t - starts[i] };
  }

  // ── caption rendering ──
  function activeCaption(scene, lt) {
    const caps = scene.captions;
    let active = null;
    for (let k = 0; k < caps.length; k++) {
      const start = caps[k].at;
      const end = k + 1 < caps.length ? caps[k + 1].at : scene.dur - 0.3;
      if (lt >= start && lt < end) { active = caps[k]; break; }
    }
    return active;
  }

  function renderCaption(scene, lt) {
    const cap = activeCaption(scene, lt);
    const key = cap ? `${scene.id}:${cap.at}` : '';
    if (key === lastCapKey) return;
    lastCapKey = key;
    if (!cap) { captionLayer.innerHTML = ''; return; }
    const who = cap.who
      ? `<span class="cap-who">${cap.who}</span>`
      : '';
    captionLayer.innerHTML =
      `<div class="cap ${cap.who ? 'cap-dialogue' : 'cap-narrator'}">${who}<span class="cap-text">${cap.text}</span></div>`;
    // retrigger the fade-in animation
    const el = captionLayer.firstElementChild;
    if (el) { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
  }

  // ── DOM chrome sync ──
  function syncChrome(i) {
    if (els.titleChip) els.titleChip.textContent = `${i + 1} · ${SCENES[i].title}`;
    if (els.timeLabel) els.timeLabel.textContent = `${fmtTime(elapsed)} / ${fmtTime(TOTAL)}`;
    if (els.scrubber && document.activeElement !== els.scrubber) els.scrubber.value = String(elapsed);
    if (els.dots) els.dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    if (els.playBtn) els.playBtn.textContent = playing ? '❚❚' : (ended ? '↻' : '▶');
    if (els.playBtn) els.playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  // ── p5 sketch ──
  let p5inst = null;
  function boot() {
    p5inst = new window.p5((p) => {
      p.setup = () => {
        const w = canvasWrap.clientWidth || 900;
        const h = Math.round(w * 9 / 16);
        p.createCanvas(w, h).parent(canvasWrap);
        p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
        p.frameRate(60);
      };

      p.draw = () => {
        const W = p.width, H = p.height, S = Math.min(W, H);
        // advance clock — clamp dt so tab-away / hitch never fast-forwards the story
        if (playing) {
          elapsed += Math.min(p.deltaTime / 1000, 0.05);
          if (elapsed >= TOTAL) { elapsed = TOTAL; playing = false; ended = true; }
        }
        const { i, lt } = sceneAt(Math.min(elapsed, TOTAL - 0.001));
        const scene = SCENES[i];
        const A = { p, W, H, cx: W / 2, cy: H / 2, S, stars: STARS, time: elapsed };

        // background
        p.background(col(p, C.bg));
        if (scene.space) starfield(p, STARS, elapsed, 1, W, H);

        // scene
        scene.draw(p, lt, A);

        // vignette
        const gc = p.drawingContext;
        const grd = gc.createRadialGradient(W / 2, H / 2, S * 0.15, W / 2, H / 2, S * 0.78);
        grd.addColorStop(0, 'rgba(0,0,0,0)');
        grd.addColorStop(1, 'rgba(4,6,12,0.6)');
        gc.fillStyle = grd; gc.fillRect(0, 0, W, H);

        // scene-edge fade (to bg)
        let fade = 0;
        if (lt < 0.6) fade = Math.max(fade, 1 - eoc(lt / 0.6));
        const outStart = scene.dur - 0.7;
        if (lt > outStart) fade = Math.max(fade, eic((lt - outStart) / 0.7));
        if (ended) fade = 1; // hold on a clean end frame handled by poster
        if (fade > 0.001) { p.noStroke(); p.fill(col(p, C.bg, 255 * fade)); p.rect(0, 0, W, H); }

        // sync html
        renderCaption(scene, lt);
        syncChrome(i);

        if (ended) showEnd();
      };

      p.windowResized = () => {
        const w = canvasWrap.clientWidth;
        const h = Math.round(w * 9 / 16);
        if (w === p.width && h === p.height) return;
        p.resizeCanvas(w, h);
      };
    });
  }

  // ── end / poster state ──
  function showEnd() {
    if (els.poster) {
      els.poster.hidden = false;
      els.poster.classList.add('is-end');
      els.poster.querySelector('.poster-title').textContent = 'The Story of Numbers';
      els.poster.querySelector('.poster-sub').textContent = 'How many? — the question that started civilization.';
      els.poster.querySelector('.poster-play').textContent = '↻ Watch again';
    }
  }

  // ── controls ──
  function play() {
    if (ended) { elapsed = 0; ended = false; lastCapKey = null; }
    playing = true;
    if (els.poster) { els.poster.hidden = true; els.poster.classList.remove('is-end'); }
  }
  function pause() { playing = false; }
  function toggle() { playing ? pause() : play(); }
  function seek(t) {
    elapsed = Math.max(0, Math.min(TOTAL, t));
    ended = elapsed >= TOTAL;
    lastCapKey = null;
  }
  function jumpScene(delta) {
    const { i } = sceneAt(Math.min(elapsed, TOTAL - 0.001));
    const ni = Math.max(0, Math.min(SCENES.length - 1, i + delta));
    seek(starts[ni]);
    if (ended) ended = false;
  }

  // wire els
  if (els.playBtn)   els.playBtn.addEventListener('click', toggle);
  if (els.restartBtn) els.restartBtn.addEventListener('click', () => { seek(0); play(); });
  if (els.prevBtn)   els.prevBtn.addEventListener('click', () => jumpScene(-1));
  if (els.nextBtn)   els.nextBtn.addEventListener('click', () => jumpScene(1));
  if (els.scrubber) {
    els.scrubber.max = String(TOTAL);
    els.scrubber.step = '0.05';
    els.scrubber.addEventListener('input', () => seek(parseFloat(els.scrubber.value)));
  }
  if (els.dots) els.dots.forEach((d, k) => d.addEventListener('click', () => { seek(starts[k]); play(); }));
  if (els.poster) {
    const pb = els.poster.querySelector('.poster-play');
    if (pb) pb.addEventListener('click', play);
  }
  // keyboard
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.code === 'ArrowRight') jumpScene(1);
    else if (e.code === 'ArrowLeft') jumpScene(-1);
  });

  boot();
  syncChrome(0);

  // Render one exact frame on demand. Used to preview a timestamp when the p5
  // loop is paused (e.g. headless verification, where rAF doesn't tick).
  function renderAt(t) {
    playing = false;
    seek(t);
    if (p5inst && typeof p5inst.redraw === 'function') p5inst.redraw();
  }

  return {
    play, pause, seek, renderAt,
    get scenes() { return SCENES.map((s, i) => ({ i, title: s.title, start: starts[i] })); },
    total: TOTAL,
  };
}

export { SCENES };
