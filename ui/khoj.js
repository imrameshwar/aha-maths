// ui/khoj.js — "Aaj ka Khoj" (Today's Find): the standalone daily Count-Quest.
//
// A full-screen, playful tap-and-count game. It reuses ui/scene-count.js and the
// mango-tree scene as-is (swap-ready for real Higgsfield art later). On completion
// it shows a shareable result card via the Web Share API, with a canvas-rendered
// image so the text is always crisp and bilingual — the viral share loop (M3).

import { t, getLang, tLang } from './i18n.js';
import { celebrate }         from './celebrate.js';

// Daily rotation. Each is a hand-drawn placeholder today, swap-ready for a curated
// Higgsfield still (re-author hotspots, repoint the JSON — the count stays truth).
const SCENES   = ['mango-tree', 'courtyard-cats', 'festival-diyas', 'mela-balloons'];
const SITE_URL = 'https://ahamaths.com/khoj';
const SHORT_URL = 'ahamaths.com/khoj';

let _handle    = null;   // active scene-count / fallback instance
let _scene     = null;   // today's scene JSON (count + object are code-owned truth)
let _completed = false;
let _cardBlob  = null;    // memoised result-card image (crisp, bilingual)
let _cardUrl   = null;

// A stable "scene of the day" so the same visitor gets the same Khoj all day and
// a fresh one tomorrow (deterministic, no server, no storage needed). A ?scene=<id>
// param pins a specific scene — handy for sharing or replaying a past day's find.
function todaysSceneId() {
  const forced = new URLSearchParams(location.search).get('scene');
  if (forced && SCENES.includes(forced)) return forced;
  const day = Math.floor(Date.now() / 86_400_000);
  return SCENES[day % SCENES.length];
}

const interp = (str, map) =>
  String(str).replace(/\{(\w+)\}/g, (_, k) => (k in map ? map[k] : `{${k}}`));

function reducedMotion() {
  return document.documentElement.dataset.motion === 'reduce' ||
         window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function initKhoj() {
  const sceneId = todaysSceneId();
  try {
    const res = await fetch(`content/scenes/${sceneId}.json`);
    _scene = res.ok ? await res.json() : null;
  } catch { _scene = null; }

  applyText();
  render();

  document.addEventListener('am:langchange', () => {
    applyText();
    // Mid-game a fresh mount is jarring; only the completed card needs retranslating
    // (and it must NOT re-fire the celebration).
    if (_completed) showResult(false);
  });
}

// Prompt / hint copy that depends on the scene's object name (can't be pure
// data-i18n because it interpolates {object}).
function applyText() {
  const object = _scene?.object_i18n ? t(_scene.object_i18n) : '';
  const promptEl = document.getElementById('khoj-prompt');
  if (promptEl) promptEl.textContent = interp(t('khoj.prompt'), { object });
}

function render() {
  _completed = false;
  if (_cardUrl && _cardUrl.startsWith('blob:')) URL.revokeObjectURL(_cardUrl);
  _cardBlob = _cardUrl = null;

  const stage  = document.getElementById('khoj-stage');
  const result = document.getElementById('khoj-result');
  if (result) result.hidden = true;
  if (!stage) return;

  if (_handle) { _handle.remove?.(); _handle = null; }

  const sceneId  = todaysSceneId();
  const saveData = navigator.connection && navigator.connection.saveData;
  const onComplete = () => showResult(true);

  // Save-Data (or a missing / broken scene) falls back to the abstract dot grid —
  // exactly like scene-count does inside the lesson runner. Never a dead end.
  if (saveData || !_scene) {
    _handle = mountDotFallback(stage, _scene?.count ?? 5, onComplete);
    return;
  }

  import('./scene-count.js')
    .then(({ mountSceneCount }) => mountSceneCount(stage, sceneId, { onComplete }))
    .then(h => { _handle = h; })
    .catch(() => { _handle = mountDotFallback(stage, _scene.count, onComplete); });
}

// ── Dot-grid fallback (Save-Data / offline / no image) ──────────────────────────
function mountDotFallback(stage, count, onComplete) {
  const dots = Array.from({ length: count }, (_, k) =>
    `<button class="khoj-dot" data-idx="${k}" aria-label="${k + 1}"></button>`).join('');
  stage.innerHTML = `
    <div class="khoj-fallback">
      <div class="khoj-dot-grid">${dots}</div>
      <div class="sc-hud">
        <div class="sc-counter" aria-live="polite" aria-atomic="true">
          <span class="sc-num">0</span><span class="sc-slash"> / </span><span class="sc-total">${count}</span>
        </div>
      </div>
    </div>`;

  const numEl = stage.querySelector('.sc-num');
  const found = new Set();
  let done = false;
  stage.querySelectorAll('.khoj-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.idx;
      if (found.has(i) || done) return;
      found.add(i);
      btn.classList.add('is-tapped');
      btn.setAttribute('aria-pressed', 'true');
      numEl.textContent = String(found.size);
      if (found.size >= count) { done = true; onComplete(); }
    });
  });
  return { remove() { stage.innerHTML = ''; } };
}

// ── Result card ─────────────────────────────────────────────────────────────────
async function showResult(isNew = false) {
  _completed = true;
  const result = document.getElementById('khoj-result');
  if (!result || !_scene) return;

  // The unified aha-payoff: a full-viewport rain over the win. Sound stays off
  // here — scene-count already plays its completion chime — so they don't clash.
  if (isNew) celebrate({ sound: false });

  const count    = _scene.count;
  const object   = _scene.object_i18n ? t(_scene.object_i18n) : '';
  const emoji    = _scene.emoji || '🎉';

  result.querySelector('.khoj-result-emoji').textContent  = emoji;
  result.querySelector('.khoj-result-score').textContent  = `${count}/${count}`;
  result.querySelector('.khoj-result-kicker').textContent = t('khoj.result_kicker');
  result.querySelector('.khoj-result-line').textContent   =
    interp(t('khoj.result_line'), { n: count, object, emoji });

  const shareBtn = result.querySelector('.khoj-share');
  const dlBtn    = result.querySelector('.khoj-download');
  const copyBtn  = result.querySelector('.khoj-copy');
  const againBtn = result.querySelector('.khoj-again');
  shareBtn.textContent = t('khoj.share');
  dlBtn.textContent    = t('khoj.download');
  copyBtn.textContent  = t('khoj.copy');
  againBtn.textContent = t('khoj.again');

  // Web Share is best-effort and gesture-gated; if it isn't available we hide the
  // button and lean on Save / Copy, which always work.
  shareBtn.hidden = !navigator.share;

  shareBtn.onclick = () => shareCard();
  dlBtn.onclick    = () => downloadCard();
  copyBtn.onclick  = () => copyLink(copyBtn);
  againBtn.onclick = () => render();

  result.hidden = false;
  if (!reducedMotion()) {
    result.classList.remove('is-in'); void result.offsetWidth; result.classList.add('is-in');
  }
  result.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });

  // Render the crisp, bilingual card image and drop it into the preview.
  try {
    const { blob, url } = await getCard();
    const img = result.querySelector('.khoj-card-preview');
    if (img && url) { img.src = url; img.hidden = false; }
    dlBtn.disabled = !blob;
  } catch { /* preview is a bonus; the buttons still fall back to text/link */ }
}

// ── Canvas card (1080×1080, brand-locked, always bilingual) ─────────────────────
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
  } catch { /* fall back to system fonts — Devanagari still renders via Mukta/system */ }
}

async function getCard() {
  if (_cardBlob && _cardUrl) return { blob: _cardBlob, url: _cardUrl };
  await ensureFonts();

  const S = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  drawCard(canvas.getContext('2d'), S);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  _cardBlob = blob;
  _cardUrl  = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png');
  return { blob: _cardBlob, url: _cardUrl };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(ctx, S) {
  const count    = _scene.count;
  const emoji    = _scene.emoji || '🎉';
  const objectEn = tLang('en', _scene.object_i18n);
  const objectHi = tLang('hi', _scene.object_i18n);
  const lineEn   = interp(tLang('en', 'khoj.card_line'), { n: count, object: objectEn });
  const lineHi   = interp(tLang('hi', 'khoj.card_line'), { n: count, object: objectHi });

  // Brand-locked palette (the share card must look the same regardless of theme).
  const NAVY = '#0B0F1A', NAVY2 = '#0E2233', CYAN = '#22D3EE', AMBER = '#FBBF24',
        PURPLE = '#A78BFA', INK = '#F1F5F9', MUTE = '#94A3B8';

  // Background: navy gradient + a soft cyan glow behind the score.
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, NAVY); bg.addColorStop(1, NAVY2);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
  const glow = ctx.createRadialGradient(S / 2, 430, 40, S / 2, 430, 560);
  glow.addColorStop(0, 'rgba(34,211,238,0.24)'); glow.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, S, S);

  // Inner frame.
  ctx.strokeStyle = 'rgba(148,163,184,0.28)'; ctx.lineWidth = 3;
  roundRect(ctx, 44, 44, S - 88, S - 88, 44); ctx.stroke();

  ctx.textBaseline = 'alphabetic';

  // Header — logomark tile + wordmark (left), Khoj eyebrow (right).
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
  ctx.fillText(tLang('en', 'khoj.eyebrow'), S - 96, 133);

  // Hero emoji + score.
  ctx.textAlign = 'center';
  ctx.font = '170px "Apple Color Emoji","Noto Color Emoji", system-ui';
  ctx.fillText(emoji, S / 2, 400);
  ctx.save();
  ctx.shadowColor = 'rgba(34,211,238,0.55)'; ctx.shadowBlur = 40;
  ctx.fillStyle = CYAN; ctx.font = '800 168px "JetBrains Mono", monospace';
  ctx.fillText(`${count}/${count}`, S / 2, 600);
  ctx.restore();

  // Bilingual result lines — English then Devanagari (Mukta), always both.
  ctx.fillStyle = INK; ctx.font = '800 52px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(lineEn, S / 2, 712);
  ctx.fillStyle = AMBER; ctx.font = '700 54px "Mukta", sans-serif';
  ctx.fillText(lineHi, S / 2, 790);

  // URL pill.
  ctx.font = '700 34px "JetBrains Mono", monospace';
  const urlW = ctx.measureText(SHORT_URL).width;
  const pillW = urlW + 72, pillH = 74, pillX = (S - pillW) / 2, pillY = 872;
  ctx.fillStyle = 'rgba(34,211,238,0.12)';
  roundRect(ctx, pillX, pillY, pillW, pillH, 37); ctx.fill();
  ctx.strokeStyle = 'rgba(34,211,238,0.5)'; ctx.lineWidth = 2;
  roundRect(ctx, pillX, pillY, pillW, pillH, 37); ctx.stroke();
  ctx.fillStyle = CYAN; ctx.fillText(SHORT_URL, S / 2, pillY + 49);

  // Tagline.
  ctx.fillStyle = MUTE; ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(t('khoj.card_tag'), S / 2, 1002);
}

// ── Share / download / copy ─────────────────────────────────────────────────────
async function shareCard() {
  const count  = _scene.count;
  const object = _scene.object_i18n ? t(_scene.object_i18n) : '';
  const emoji  = _scene.emoji || '🎉';
  const text   = interp(t('khoj.share_text'), { n: count, object, emoji, url: SHORT_URL });

  let file = null;
  try {
    const { blob } = await getCard();
    if (blob) file = new File([blob], 'aaj-ka-khoj.png', { type: 'image/png' });
  } catch { /* share text-only if the image failed */ }

  const data = { title: 'Aha Maths — Aaj ka Khoj', text, url: SITE_URL };
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    // Some targets reject url + files together; the image + text carry the link.
    data.files = [file];
    delete data.url;
  }

  try {
    if (navigator.share) { await navigator.share(data); return; }
  } catch (e) {
    if (e && e.name === 'AbortError') return;   // user dismissed the sheet
  }
  downloadCard();   // no Web Share (or it threw) → save the image instead
}

async function downloadCard() {
  try {
    const { url } = await getCard();
    const a = document.createElement('a');
    a.href = url; a.download = 'aaj-ka-khoj.png';
    document.body.appendChild(a); a.click(); a.remove();
  } catch { /* nothing else we can do */ }
}

async function copyLink(btn) {
  try {
    await navigator.clipboard.writeText(SITE_URL);
    const prev = btn.textContent;
    btn.textContent = t('khoj.copied');
    btn.classList.add('is-ok');
    setTimeout(() => { btn.textContent = prev; btn.classList.remove('is-ok'); }, 1800);
  } catch { /* clipboard blocked — the URL is on the card anyway */ }
}
