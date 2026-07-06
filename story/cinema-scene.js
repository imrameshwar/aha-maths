/* story/cinema-scene.js — P7 flagship prototype: the "accuracy sandwich".
   ────────────────────────────────────────────────────────────────────────────
   One cinematic Story-of-Numbers scene ("The Birth of Zero") that proves the
   architecture of the Higgsfield + Remotion cinematic layer WITHOUT needing the
   generation pipeline yet. Three composited layers, each independently toggleable:

     ① MOOD  — a cinematic atmospheric backdrop (gradient + drifting embers +
               vignette). This is the STAND-IN for a Higgsfield "Soul/DoP" frame;
               in production this layer is replaced by the AI clip. It carries
               *mood only* — never a number or a word.
     ② MATH  — the truth layer: place-value columns and the zero-drop, every digit
               CODE-RENDERED so it is always correct. This is what makes AI safe
               for a maths brand.
     ③ TEXT  — bilingual caption (EN/हिं), HTML overlay, localisable, never baked
               into pixels.

   Remotion's job in production = composite ②+③ on top of ①'s AI clip and export.
   Self-contained (own clamped clock, DPR-capped, reduced-motion → static payoff
   frame, pauses when the tab is hidden). */

const DUR = 14;            // seconds, loops
const LOGICAL_W = 1280, LOGICAL_H = 720;

const CAPTIONS = [
  { t0: 0.2, t1: 2.6,  en: 'Long ago, a number was missing.',                      hi: 'बहुत पहले, एक संख्या गायब थी।' },
  { t0: 2.6, t1: 5.6,  en: 'One hundred… no tens… five. But the middle was empty.', hi: 'एक सौ… कोई दहाई नहीं… पाँच। पर बीच खाली था।' },
  { t0: 5.6, t1: 8.6,  en: 'So they invented a shape for nothing.',                 hi: 'तो उन्होंने “कुछ नहीं” का आकार बनाया।' },
  { t0: 8.6, t1: 13.8, en: 'Zero — the nothing that changed everything.',           hi: 'शून्य — वह “कुछ नहीं” जिसने सब बदल दिया।' },
];

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
function tok(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function initCinema({ canvas, captionEl }) {
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PRIMARY = tok('--primary', '#22D3EE');
  const SECOND  = tok('--secondary', '#FBBF24');

  const state = { layers: { mood: true, math: true, text: true }, lang: 'en', playing: false };
  let t = 0, last = 0, raf = 0, scale = 1;

  // drifting embers for the mood layer
  const embers = Array.from({ length: 34 }, () => ({
    x: Math.random() * LOGICAL_W, y: Math.random() * LOGICAL_H,
    r: 1 + Math.random() * 2.4, sp: 6 + Math.random() * 16, ph: Math.random() * Math.PI * 2,
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    scale = canvas.width / LOGICAL_W;
  }

  // ── Layer ① Mood (Higgsfield drop-in stand-in) ──────────────────────────────
  function drawMood() {
    const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    g.addColorStop(0, '#0A0E18');
    g.addColorStop(0.55, '#12101A');
    g.addColorStop(1, '#1C130E');           // warm ember floor
    ctx.fillStyle = g; ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    const rg = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H * 0.52, 60, LOGICAL_W / 2, LOGICAL_H * 0.52, 620);
    rg.addColorStop(0, 'rgba(251,191,36,0.10)');
    rg.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    for (const e of embers) {
      const yy = ((e.y - t * e.sp) % LOGICAL_H + LOGICAL_H) % LOGICAL_H;
      const a = 0.12 + 0.12 * (Math.sin(t * 1.3 + e.ph) + 1) / 2;
      ctx.beginPath(); ctx.arc(e.x, yy, e.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251,191,36,${a})`; ctx.fill();
    }
    // vignette
    const vg = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, 300, LOGICAL_W / 2, LOGICAL_H / 2, 800);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }

  // ── Layer ② Math (the code-accurate truth) ──────────────────────────────────
  function drawMath() {
    const cx = LOGICAL_W / 2, cy = LOGICAL_H / 2 - 20;
    const cellW = 150, gap = 30, y = cy - 90, h = 180;
    const labels = ['HUNDREDS', 'TENS', 'UNITS'];
    const digits = ['1', '0', '5'];
    const startX = cx - (cellW * 3 + gap * 2) / 2;

    // slots appear 2.6→4.5 ; zero drops 5.6→7.4 ; payoff glow 8.6+
    const appear = clamp01((t - 2.4) / 1.6);
    const zeroT  = easeOut(clamp01((t - 5.6) / 1.8));
    const payoff = clamp01((t - 8.6) / 1.0);

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (cellW + gap);
      const midX = x + cellW / 2;
      const a = clamp01(appear * 1.2 - i * 0.12);
      if (a <= 0) continue;

      // cell
      ctx.globalAlpha = a;
      roundRect(x, y, cellW, h, 18);
      ctx.fillStyle = 'rgba(20,26,42,0.72)'; ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = (i === 1 && zeroT < 1)
        ? `rgba(251,191,36,${0.35 + 0.4 * Math.abs(Math.sin(t * 3))})`   // pulsing empty slot
        : 'rgba(148,163,184,0.35)';
      ctx.stroke();

      // place-value label
      ctx.font = `700 20px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.fillText(labels[i], midX, y + h + 34);

      // multiplier on payoff
      if (payoff > 0) {
        ctx.globalAlpha = a * payoff;
        ctx.font = `700 18px 'JetBrains Mono', monospace`;
        ctx.fillStyle = PRIMARY;
        ctx.fillText(['×100', '×10', '×1'][i], midX, y - 26);
        ctx.globalAlpha = a;
      }

      // digit (code-rendered → always correct)
      ctx.font = `800 96px 'JetBrains Mono', monospace`;
      if (i === 1) {
        // the invented zero drops in
        if (zeroT > 0) {
          const dy = lerp(-260, 0, zeroT);
          ctx.save();
          ctx.shadowColor = SECOND; ctx.shadowBlur = 26 * (0.4 + 0.6 * payoff + (1 - zeroT));
          ctx.fillStyle = SECOND;
          ctx.globalAlpha = a;
          ctx.fillText('0', midX, y + h / 2 + dy);
          ctx.restore();
        }
      } else {
        ctx.save();
        ctx.shadowColor = PRIMARY; ctx.shadowBlur = 10 + 18 * payoff;
        ctx.fillStyle = PRIMARY;
        ctx.fillText(digits[i], midX, y + h / 2);
        ctx.restore();
      }
    }

    // the resolved number "= 105"
    if (payoff > 0) {
      ctx.globalAlpha = payoff;
      ctx.font = `800 40px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('= 105', cx, y + h + 90);
    }
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ── Layer ③ Text (bilingual caption, HTML) ──────────────────────────────────
  function drawText() {
    if (!captionEl) return;
    if (!state.layers.text) { captionEl.textContent = ''; captionEl.style.opacity = 0; return; }
    const c = CAPTIONS.find(c => t >= c.t0 && t < c.t1);
    if (!c) { captionEl.style.opacity = 0; return; }
    const line = state.lang === 'hi' ? c.hi : c.en;
    if (captionEl.textContent !== line) captionEl.textContent = line;
    const fade = Math.min(clamp01((t - c.t0) / 0.5), clamp01((c.t1 - t) / 0.5));
    captionEl.style.opacity = fade;
  }

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;                 // clamp (tab was backgrounded)
    if (state.playing && !reduce) { t += dt; if (t > DUR) t = 0; }

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    if (state.layers.mood) drawMood();
    if (state.layers.math) drawMath();
    drawText();

    raf = requestAnimationFrame(frame);
  }

  // boot
  resize();
  window.addEventListener('resize', resize);
  if (reduce) { t = 11; state.playing = false; }         // static payoff frame
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { last = 0; });

  return {
    play()    { if (reduce) return; if (t >= DUR - 0.1) t = 0; state.playing = true; },
    pause()   { state.playing = false; },
    replay()  { t = 0; state.playing = !reduce; },
    setLang(l){ state.lang = l; },
    toggle(layer, on) { state.layers[layer] = on; },
    seek(sec) { t = Math.max(0, Math.min(DUR, sec)); },   // debug/scrub
    isReduced: reduce,
  };
}
