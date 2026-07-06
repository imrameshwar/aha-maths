// ui/lesson.js — fetches lesson JSON, renders the 5-beat template.

import { t, getLang, tLang } from './i18n.js';
import { speak, isSoundEnabled } from './audio.js';
import { markBeat, markComplete } from './progress.js';
import { celebrate } from './celebrate.js';

const BEATS = [
  { id: 'hook',    icon: '📖' },
  { id: 'play',    icon: '🎮' },
  { id: 'aha',     icon: '✨' },
  { id: 'check',   icon: '🎯' },
  { id: 'connect', icon: '🗺️' },
];

let _lesson      = null;
let _beat        = 0;
let _sketch      = null;   // active p5 sketch instance (Play beat only)
let _sceneHandle = null;   // active Count-Quest scene instance (Check beat only)
let _mountId     = 0;      // nonce — cancels stale async sketch mounts
let _available   = null;   // Set of lesson ids that actually have content
let _worlds      = null;   // worlds.json (cached) — for the Aha payoff's world colour
let _worldColor  = null;   // current lesson's world colour

export function getLessonIdFromURL() {
  return new URLSearchParams(window.location.search).get('lesson');
}

export async function loadLesson(id) {
  const [res, avail, worlds] = await Promise.all([
    fetch(`content/lessons/${id}.json`),
    _available ? Promise.resolve(_available) : fetch('content/lessons/index.json').then(r => r.json()).catch(() => ({ available: [] })),
    _worlds ? Promise.resolve(_worlds) : fetch('content/worlds.json').then(r => r.json()).catch(() => []),
  ]);
  if (!res.ok) throw new Error(`Lesson not found: ${id}`);
  if (!_available) _available = new Set(avail.available);
  if (!_worlds) _worlds = worlds;
  _lesson = await res.json();
  _worldColor = (_worlds.find(w => w.id === _lesson.world) || {}).color || null;
  _beat   = 0;
  _renderAll();

  // Re-render on language change; update sketch lang param instead of remounting.
  document.addEventListener('am:langchange', () => {
    if (_sketch) _sketch.setParam('lang', getLang());
    _renderAll();
  });
}

// ── Internal render helpers ────────────────────────────────────────────────────

function _renderAll() {
  _renderHeader();
  _renderJsonLd();
  _renderBeatNav();
  _renderBeat();
  _renderControls();
}

// Refine the page's LearningResource JSON-LD with this lesson's real title/desc
// (JS-running crawlers pick it up; the static default in learn.html covers the rest).
function _renderJsonLd() {
  const el = document.getElementById('lesson-ld');
  if (!el || !_lesson) return;
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `${t(_lesson.i18n.title)} — Aha Maths`,
    description: t(_lesson.i18n.subtitle),
    educationalLevel: 'All ages',
    learningResourceType: 'Interactive lesson',
    inLanguage: [getLang()],
    isAccessibleForFree: true,
    url: `https://ahamaths.com/learn.html?lesson=${_lesson.id}`,
    provider: { '@type': 'Organization', name: 'Aha Maths', url: 'https://ahamaths.com/' },
  });
}

function _renderHeader() {
  const world = _lesson.world;
  const badge = document.getElementById('lesson-world-badge');
  const title = document.getElementById('lesson-title');
  const sub   = document.getElementById('lesson-subtitle');
  if (badge) badge.textContent = `${t(`world.${world}.name`)} · ${t(`world.${world}.subtitle`)}`;
  if (title) title.textContent = t(_lesson.i18n.title);
  if (sub)   sub.textContent   = t(_lesson.i18n.subtitle);
}

function _renderBeatNav() {
  const nav = document.getElementById('beat-nav');
  if (!nav) return;

  nav.innerHTML = BEATS.map((b, i) => {
    const cls = i === _beat ? 'is-active' : i < _beat ? 'is-done' : '';
    return `
      <button class="beat-dot ${cls}" data-beat="${i}" aria-label="${t('beats.' + b.id)}">
        <span class="beat-dot-pip">${i < _beat ? '✓' : i + 1}</span>
        <span class="beat-dot-label">${t('beats.' + b.id)}</span>
      </button>
    `;
  }).join('');

  nav.querySelectorAll('[data-beat]').forEach(btn => {
    btn.addEventListener('click', () => _goToBeat(parseInt(btn.dataset.beat, 10)));
  });
}

function _renderControls() {
  const prevBtn = document.getElementById('beat-prev');
  const nextBtn = document.getElementById('beat-next');
  const isFirst = _beat === 0;
  const isLast  = _beat === BEATS.length - 1;

  if (prevBtn) {
    prevBtn.disabled    = isFirst;
    prevBtn.textContent = `← ${t('ui.prev')}`;
    prevBtn.onclick     = () => _goToBeat(_beat - 1);
  }
  if (nextBtn) {
    nextBtn.textContent = isLast ? t('ui.done') : `${t('ui.next')} →`;
    nextBtn.onclick     = () => { if (!isLast) _goToBeat(_beat + 1); };
  }
}

function _goToBeat(idx) {
  if (idx < 0 || idx >= BEATS.length) return;
  _beat = idx;
  _renderBeatNav();
  _renderBeat();
  _renderControls();
  if (_lesson) {
    if (idx === BEATS.length - 1) markComplete(_lesson.id);
    else markBeat(_lesson.id, idx);
  }
}

// ── Beat content ───────────────────────────────────────────────────────────────

function _renderBeat() {
  // Destroy previous sketch / scene before replacing innerHTML.
  if (_sketch) { _sketch.remove(); _sketch = null; }
  if (_sceneHandle) { _sceneHandle.remove?.(); _sceneHandle = null; }
  _mountId++;   // invalidate any in-flight async mount

  const container = document.getElementById('lesson-container');
  if (!container) return;

  const beatId = BEATS[_beat].id;
  container.innerHTML = _beatHTML(beatId);

  // Wire audio buttons.
  container.querySelectorAll('[data-speak-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key  = btn.dataset.speakKey;
      const text = t(key);
      speak(text, getLang());
    });
  });

  // The "aha payoff": one big, unified celebration when the insight lands.
  if (beatId === 'aha') celebrate({ colors: _worldColor ? [_worldColor] : undefined });
  if (beatId === 'play' && _lesson.visualizer) _mountSketch();
  if (beatId === 'check') _wireCheckInteraction(container);
  if (beatId === 'connect') _wireConnectShare(container);
}

// Connect beat: a shareable, code-rendered, always-bilingual "aha" card —
// "Aaj maine seekha: <lesson>" — via the Web Share API (Save fallback).
function _wireConnectShare(container) {
  const btn = container.querySelector('#connect-share');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const titleEn = tLang('en', _lesson.i18n.title);
    const titleHi = tLang('hi', _lesson.i18n.title);
    const spec = {
      kicker:   'Aha Maths',
      emoji:    '✨',
      big:      '',
      lineEn:   tLang('en', 'ui.learned_card').replace('{title}', titleEn),
      lineHi:   tLang('hi', 'ui.learned_card').replace('{title}', titleHi),
      urlShort: 'ahamaths.com',
      tag:      t('khoj.card_tag'),
    };
    const text = t('ui.share_aha_text').replace('{title}', t(_lesson.i18n.title));
    btn.disabled = true;
    try {
      const { shareCard } = await import('./share-card.js');
      await shareCard({
        spec, text,
        url: `https://ahamaths.com/learn.html?lesson=${_lesson.id}`,
        filename: `aha-maths-${_lesson.id}.png`,
      });
    } finally {
      btn.disabled = false;
    }
  });
}

// ── Beat HTML templates ────────────────────────────────────────────────────────

function _beatHTML(beat) {
  const lesson = _lesson;
  const i18n   = lesson.i18n;

  const audioBtn = (speakKey) => `
    <button class="audio-btn" data-speak-key="${speakKey}" aria-label="${t('ui.listen')}">
      <svg class="audio-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M17 8.5a4.5 4.5 0 0 1 0 7"/><path d="M19.5 6a8 8 0 0 1 0 12"/></svg>
      <span>${t('ui.listen')}</span>
    </button>
  `;

  switch (beat) {

    case 'hook': return `
      <div class="beat-card beat-hook">
        <div class="beat-eyebrow">
          <span class="beat-name">${t('beats.hook')}</span>
          <span class="beat-sub"> · ${t('beats.hook_sub')}</span>
        </div>
        <h2 class="beat-title" data-i18n="${i18n.hook_title}">${t(i18n.hook_title)}</h2>
        <p class="beat-body" data-i18n="${i18n.hook_body}">${t(i18n.hook_body)}</p>
        ${audioBtn(i18n.hook_body)}
        <div class="beat-illustration hook-illustration" aria-hidden="true">
          <div class="hook-units">
            ${[1, 2, 3, 4, 5].map((n, i) => `
              <div class="hook-unit" style="--delay:${(i * 0.1).toFixed(2)}s">
                <span class="hook-token"></span>
                <span class="hook-link"></span>
                <span class="hook-num">${n}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;

    case 'play': return `
      <div class="beat-card beat-play">
        <div class="beat-eyebrow">
          <span class="beat-name">${t('beats.play')}</span>
          <span class="beat-sub"> · ${t('beats.play_sub')}</span>
        </div>
        <h2 class="beat-title" data-i18n="${i18n.play_title}">${t(i18n.play_title)}</h2>
        <p class="beat-body" data-i18n="${i18n.play_instruction}">${t(i18n.play_instruction)}</p>
        ${audioBtn(i18n.play_instruction)}
        <div class="sketch-wrap" id="sketch-wrap"></div>
      </div>`;

    case 'aha': return `
      <div class="beat-card beat-aha">
        <div class="beat-eyebrow">
          <span class="beat-name">${t('beats.aha')}</span>
          <span class="beat-sub"> · ${t('beats.aha_sub')}</span>
        </div>
        <h2 class="beat-title" data-i18n="${i18n.aha_title}">${t(i18n.aha_title)}</h2>
        <p class="beat-body" data-i18n="${i18n.aha_body}">${t(i18n.aha_body)}</p>
        ${audioBtn(i18n.aha_body)}
        <div class="aha-reveal">
          <div class="aha-number">5</div>
          <div class="aha-equals">=</div>
          <div class="aha-items">
            <span>●</span><span>●</span><span>●</span><span>●</span><span>●</span>
          </div>
        </div>
        <div class="mascot-guide" aria-live="polite">
          <img class="mascot-char" src="assets/mascot.svg" alt="" aria-hidden="true" width="46" height="46">

          <div class="mascot-bubble">${t('ui.mascot_aha')}</div>
        </div>
      </div>`;

    case 'check': return `
      <div class="beat-card beat-check">
        <div class="beat-eyebrow">
          <span class="beat-name">${t('beats.check')}</span>
          <span class="beat-sub"> · ${t('beats.check_sub')}</span>
        </div>
        <h2 class="beat-title" data-i18n="${i18n.check_title}">${t(i18n.check_title)}</h2>
        <div class="check-tasks" id="check-tasks">
          ${lesson.checks.map((c, ci) => `
            <div class="check-task" data-check="${ci}" data-type="${c.type}" data-count="${c.count ?? 5}">
              <p class="check-prompt" data-i18n="${c.i18n.prompt}">${t(c.i18n.prompt)}</p>
              ${audioBtn(c.i18n.prompt)}
              ${c.type === 'scene-count'
                ? `<div class="scene-count-mount" id="scene-mount-${ci}" data-scene="${c.scene}" data-count="${c.count ?? 5}"></div>`
                : _tapGridHTML(ci, c.count ?? 5)}
            </div>
          `).join('')}
        </div>
      </div>`;

    case 'connect': return `
      <div class="beat-card beat-connect">
        <div class="beat-eyebrow">
          <span class="beat-name">${t('beats.connect')}</span>
          <span class="beat-sub"> · ${t('beats.connect_sub')}</span>
        </div>
        <h2 class="beat-title" data-i18n="ui.connect_title">${t('ui.connect_title')}</h2>
        <p class="beat-body" data-i18n="${i18n.connect_body}">${t(i18n.connect_body)}</p>
        ${audioBtn(i18n.connect_body)}
        <div class="connect-actions">
          ${lesson.watch_url
            ? `<a class="connect-btn connect-watch" href="${lesson.watch_url}" target="_blank" rel="noopener">▶ ${t('ui.watch_short')}</a>`
            : `<span class="connect-btn connect-watch is-soon">▶ ${t('ui.watch_coming_soon')}</span>`
          }
          ${lesson.next && _available.has(lesson.next)
            ? `<a class="connect-btn connect-next" href="learn.html?lesson=${lesson.next}" data-i18n="${i18n.connect_next_label}">${t(i18n.connect_next_label)}</a>`
            : lesson.next
              ? `<span class="connect-btn connect-watch is-soon">🔜 ${t('ui.next_coming_soon')}</span>
                 <a class="connect-btn connect-watch" href="index.html">${t('ui.back_to_map')}</a>`
              : ''
          }
          <button class="connect-btn connect-share" type="button" id="connect-share">${t('ui.share_aha')}</button>
        </div>
      </div>`;

    default:
      return `<div class="beat-card"><p>${beat}</p></div>`;
  }
}

// ── p5 sketch mounting ─────────────────────────────────────────────────────────

async function _mountSketch() {
  const myId = _mountId;
  const wrapEl = document.getElementById('sketch-wrap');
  if (!wrapEl) return;

  const [{ default: viz }, { mountSketch }] = await Promise.all([
    import(`../visualizers/${_lesson.visualizer}.js`),
    import('./sketch.js'),
  ]);

  if (myId !== _mountId) return;   // beat changed while loading

  const freshWrap = document.getElementById('sketch-wrap');
  if (!freshWrap) return;

  const initParams = { lang: getLang() };
  if (_lesson.controls) {
    for (const [key, ctrl] of Object.entries(_lesson.controls)) {
      if (ctrl.default !== undefined) initParams[key] = ctrl.default;
    }
  }
  _sketch = mountSketch(freshWrap, viz, {
    params:      initParams,
    aspectRatio: 16 / 9,
  });
}

// ── Check beat interaction ─────────────────────────────────────────────────────

// The abstract dot-grid check — also the universal fallback for scene-count
// (Save-Data, offline, or a scene that fails to load).
function _tapGridHTML(ci, count) {
  return `
    <div class="tap-grid" id="tap-grid-${ci}" data-count="${count}">
      ${Array.from({ length: count }, (_, k) =>
        `<button class="tap-item" data-idx="${k}" aria-label="${k + 1}"></button>`
      ).join('')}
    </div>
    <div class="tap-counter" id="tap-counter-${ci}" aria-live="polite" aria-atomic="true">
      <span class="tc-num">0</span> / ${count}
    </div>
    <div class="tap-success" id="tap-success-${ci}" role="status" aria-live="polite" hidden>
      <span class="ts-icon">✓</span>
      <span class="ts-text">${t('beats.aha')}!</span>
    </div>`;
}

function _wireCheckInteraction(container) {
  container.querySelectorAll('.check-task').forEach((taskEl) => {
    const ci = parseInt(taskEl.dataset.check, 10);
    if (taskEl.dataset.type === 'scene-count') _wireSceneCount(taskEl, ci);
    else                                       _wireTapCount(ci);
  });
}

function _wireTapCount(ci) {
  const target  = parseInt(document.getElementById(`tap-grid-${ci}`)?.dataset.count, 10) || 5;
  const grid    = document.getElementById(`tap-grid-${ci}`);
  const counter = document.getElementById(`tap-counter-${ci}`);
  const success = document.getElementById(`tap-success-${ci}`);
  if (!grid) return;
  let tapped = 0;
  const tappedSet = new Set();

  grid.querySelectorAll('.tap-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      if (tappedSet.has(idx)) return;
      tappedSet.add(idx);
      tapped++;
      btn.classList.add('is-tapped');
      btn.setAttribute('aria-pressed', 'true');

      const numEl = counter?.querySelector('.tc-num');
      if (numEl) numEl.textContent = tapped;

      if (tapped >= target && success) {
        success.hidden = false;
        success.classList.add('pop-in');
      }
    });
  });
}

// Count-Quest: mount the illustrated tap-and-count scene, with the dot-grid as
// the universal fallback (Save-Data, no scene id, or any load failure).
async function _wireSceneCount(taskEl, ci) {
  const mount   = document.getElementById(`scene-mount-${ci}`);
  if (!mount) return;
  const sceneId  = mount.dataset.scene;
  const saveData = navigator.connection && navigator.connection.saveData;

  if (saveData || !sceneId) { _sceneFallback(mount, ci); return; }

  try {
    const { mountSceneCount } = await import('./scene-count.js');
    if (!document.body.contains(mount)) return;   // beat changed while loading
    _sceneHandle = await mountSceneCount(mount, sceneId, {});
  } catch {
    _sceneFallback(mount, ci);
  }
}

function _sceneFallback(mount, ci) {
  const count = parseInt(mount.dataset.count, 10) || 5;
  mount.innerHTML = _tapGridHTML(ci, count);
  _wireTapCount(ci);
}
