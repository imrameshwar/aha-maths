// ui/share-card.js — branded, always-bilingual canvas share cards (1080²).
//
// A reusable, code-rendered share image so text is always crisp and bilingual
// (English + Devanagari via Mukta). Used by the lesson "aha" card on the Connect
// beat; general enough for any surface. `shareCard()` wraps the Web Share API and
// falls back to downloading the PNG when sharing isn't available.
//
// buildShareCard(spec) → { blob, url }
// shareCard({ spec, text, url, filename }) → 'shared' | 'saved' | 'cancelled' | 'failed'

const NAVY = '#0B0F1A', NAVY2 = '#0E2233', CYAN = '#22D3EE', AMBER = '#FBBF24',
      PURPLE = '#A78BFA', INK = '#F1F5F9', MUTE = '#94A3B8';

async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('800 100px "Plus Jakarta Sans"'),
      document.fonts.load('600 100px "Plus Jakarta Sans"'),
      document.fonts.load('700 100px "Mukta"'),
      document.fonts.load('800 100px "JetBrains Mono"'),
    ]);
    await document.fonts.ready;
  } catch { /* fall back to system fonts */ }
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// Shrink a font until the text fits maxW (keeps long lesson titles on one line).
function fitFont(ctx, text, weight, family, start, maxW, min = 28) {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 4;
  } while (size > min);
  return size;
}

function draw(ctx, S, spec) {
  const { kicker, emoji, big, lineEn, lineHi, urlShort, tag } = spec;

  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, NAVY); bg.addColorStop(1, NAVY2);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
  const glow = ctx.createRadialGradient(S / 2, 430, 40, S / 2, 430, 560);
  glow.addColorStop(0, 'rgba(34,211,238,0.22)'); glow.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = 'rgba(148,163,184,0.28)'; ctx.lineWidth = 3;
  roundRect(ctx, 44, 44, S - 88, S - 88, 44); ctx.stroke();

  ctx.textBaseline = 'alphabetic';

  // Header — logomark tile + wordmark (left), kicker (right).
  const lg = ctx.createLinearGradient(96, 96, 168, 168);
  lg.addColorStop(0, CYAN); lg.addColorStop(1, PURPLE);
  ctx.fillStyle = lg; roundRect(ctx, 96, 96, 72, 72, 18); ctx.fill();
  ctx.fillStyle = NAVY; ctx.font = '800 30px "JetBrains Mono", monospace';
  ctx.textAlign = 'center'; ctx.fillText('AM', 132, 141);
  ctx.textAlign = 'left';
  ctx.fillStyle = INK; ctx.font = '800 38px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Aha Maths', 188, 133);
  ctx.textAlign = 'right';
  ctx.fillStyle = AMBER; ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(kicker, S - 96, 133);

  // Hero emoji.
  ctx.textAlign = 'center';
  ctx.font = '150px "Apple Color Emoji","Noto Color Emoji", system-ui';
  ctx.fillText(emoji, S / 2, big ? 380 : 410);

  // Optional big readout (mono cyan) — e.g. a score.
  let y = big ? 560 : 486;
  if (big) {
    ctx.save();
    ctx.shadowColor = 'rgba(34,211,238,0.55)'; ctx.shadowBlur = 40; ctx.fillStyle = CYAN;
    const fs = fitFont(ctx, big, '800', '"JetBrains Mono", monospace', 156, S - 220);
    ctx.font = `800 ${fs}px "JetBrains Mono", monospace`;
    ctx.fillText(big, S / 2, y);
    ctx.restore();
    y += 96;
  }

  // Bilingual lines — English (white) then Devanagari (amber, Mukta).
  const fsEn = fitFont(ctx, lineEn, '800', '"Plus Jakarta Sans", sans-serif', 56, S - 150);
  ctx.fillStyle = INK; ctx.font = `800 ${fsEn}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(lineEn, S / 2, y);
  y += 74;
  const fsHi = fitFont(ctx, lineHi, '700', '"Mukta", sans-serif', 56, S - 150);
  ctx.fillStyle = AMBER; ctx.font = `700 ${fsHi}px "Mukta", sans-serif`;
  ctx.fillText(lineHi, S / 2, y);

  // URL pill.
  ctx.font = '700 34px "JetBrains Mono", monospace';
  const uw = ctx.measureText(urlShort).width;
  const pw = uw + 72, ph = 74, px = (S - pw) / 2, py = 872;
  ctx.fillStyle = 'rgba(34,211,238,0.12)';
  roundRect(ctx, px, py, pw, ph, 37); ctx.fill();
  ctx.strokeStyle = 'rgba(34,211,238,0.5)'; ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 37); ctx.stroke();
  ctx.fillStyle = CYAN; ctx.fillText(urlShort, S / 2, py + 49);

  // Tagline.
  ctx.fillStyle = MUTE; ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(tag, S / 2, 1002);
}

export async function buildShareCard(spec) {
  await ensureFonts();
  const S = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  draw(canvas.getContext('2d'), S, spec);
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png');
  return { blob, url };
}

export async function shareCard({ spec, text, url, filename = 'aha-maths.png' }) {
  let file = null;
  try {
    const { blob } = await buildShareCard(spec);
    if (blob) file = new File([blob], filename, { type: 'image/png' });
  } catch { /* share text-only if the image failed */ }

  const data = { title: 'Aha Maths', text };
  if (url) data.url = url;
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    data.files = [file];
    delete data.url;   // some targets reject url + files together
  }

  try {
    if (navigator.share) { await navigator.share(data); return 'shared'; }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
  }

  // No Web Share (or it threw) → save the PNG instead.
  try {
    const { url: u } = await buildShareCard(spec);
    const a = document.createElement('a');
    a.href = u; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    return 'saved';
  } catch { return 'failed'; }
}
