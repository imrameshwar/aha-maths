// ui/scene-count.js — Count-Quest: tap-and-count over an illustrated scene.
//
// The interactive core of the "accuracy sandwich": the IMAGE is mood (a
// hand-drawn placeholder now, a Higgsfield still later), but the COUNT and the
// hotspot coordinates are code-owned truth loaded from content/scenes/<id>.json.
// A child taps each object; the counter (mono, fixed) ticks up; found objects
// glow; a decoy gives gentle "not that one" feedback with no penalty; finding
// them all celebrates. Fully keyboard-operable (hotspots are real <button>s)
// and reduced-motion aware.
//
// mountSceneCount(container, sceneId, { onComplete }) → { remove() }

import { t, getLang }      from './i18n.js';
import { isSoundEnabled }  from './audio.js';

let _actx = null;
function pop(freq = 440, dur = 0.12, type = 'sine', gain = 0.14) {
  if (!isSoundEnabled()) return;
  try {
    _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === 'suspended') _actx.resume();
    const o = _actx.createOscillator(), g = _actx.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(_actx.destination);
    const t0 = _actx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch { /* audio is a nice-to-have, never a blocker */ }
}
function chime() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => pop(f, 0.18, 'triangle', 0.12), i * 90));
}

function reducedMotion() {
  return document.documentElement.dataset.motion === 'reduce' ||
         window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function mountSceneCount(container, sceneId, opts = {}) {
  const res = await fetch(`content/scenes/${sceneId}.json`);
  if (!res.ok) throw new Error(`Scene not found: ${sceneId}`);
  const scene = await res.json();
  return renderScene(container, scene, opts);
}

function renderScene(container, scene, { onComplete } = {}) {
  const reduce  = reducedMotion();
  const total   = scene.count;
  const object  = scene.object_i18n ? t(scene.object_i18n) : '';
  const found   = new Set();

  const spotsHTML = (scene.hotspots || []).map((h, i) => `
    <button class="sc-spot" data-idx="${i}"
            style="left:${h.x * 100}%;top:${h.y * 100}%;width:${h.r * 200}%"
            aria-label="${object} ${i + 1}" aria-pressed="false">
      <span class="sc-check" aria-hidden="true">✓</span>
    </button>`).join('');

  const decoysHTML = (scene.decoys || []).map((d, i) => `
    <button class="sc-decoy" data-decoy="${i}"
            style="left:${d.x * 100}%;top:${d.y * 100}%;width:${d.r * 200}%"
            aria-label="${d.i18n ? t(d.i18n) : ''}"></button>`).join('');

  container.innerHTML = `
    <div class="scene-count${reduce ? ' is-reduced' : ''}">
      <div class="sc-stage" style="aspect-ratio:${scene.aspect || 1.3333}">
        <img class="sc-image" src="${scene.image}" alt="" draggable="false">
        <div class="sc-ripples" aria-hidden="true"></div>
        ${spotsHTML}
        ${decoysHTML}
        <div class="sc-confetti" aria-hidden="true"></div>
      </div>
      <div class="sc-hud">
        <div class="sc-counter" aria-live="polite" aria-atomic="true">
          <span class="sc-num">0</span><span class="sc-slash"> / </span><span class="sc-total">${total}</span>
        </div>
      </div>
      <div class="sc-toast" role="status" aria-live="polite" hidden></div>
      <div class="sc-success" role="status" aria-live="polite" hidden>
        <img class="sc-success-mascot" src="assets/mascot.svg" alt="" width="52" height="52">
        <div class="sc-success-text"></div>
      </div>
    </div>`;

  const root    = container.querySelector('.scene-count');
  const stage   = root.querySelector('.sc-stage');
  const numEl   = root.querySelector('.sc-num');
  const toastEl = root.querySelector('.sc-toast');
  const okEl    = root.querySelector('.sc-success');
  let toastTimer = null, done = false;

  root.querySelectorAll('.sc-spot').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = +btn.dataset.idx;
      if (found.has(idx) || done) return;
      found.add(idx);
      btn.classList.add('is-found');
      btn.setAttribute('aria-pressed', 'true');
      numEl.textContent = String(found.size);
      pop(360 + found.size * 90, 0.12, 'sine', 0.16);   // rising pitch per find
      if (found.size >= total) complete();
    });
  });

  root.querySelectorAll('.sc-decoy').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (done) return;
      btn.classList.remove('sc-shake'); void btn.offsetWidth; btn.classList.add('sc-shake');
      pop(150, 0.14, 'square', 0.10);                    // gentle "bonk", no penalty
      showToast(btn.getAttribute('aria-label'));
    });
  });

  // Tap on empty scene → a friendly ripple, never a penalty (age 5!).
  stage.addEventListener('click', e => {
    if (done || e.target.closest('.sc-spot, .sc-decoy')) return;
    if (reduce) return;
    const r = stage.getBoundingClientRect();
    const rip = document.createElement('span');
    rip.className = 'sc-ripple';
    rip.style.left = `${((e.clientX - r.left) / r.width) * 100}%`;
    rip.style.top  = `${((e.clientY - r.top) / r.height) * 100}%`;
    root.querySelector('.sc-ripples').appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove());
  });

  function showToast(msg) {
    if (!msg) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.remove('is-in'); void toastEl.offsetWidth; toastEl.classList.add('is-in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
  }

  function complete() {
    done = true;
    const line = t('ui.scene_found_all').replace('{n}', total).replace('{object}', object);
    okEl.querySelector('.sc-success-text').textContent = line;
    okEl.hidden = false;
    okEl.classList.add('is-in');
    chime();
    if (!reduce) launchConfetti(root.querySelector('.sc-confetti'));
    if (typeof onComplete === 'function') onComplete();
  }

  return { remove() { clearTimeout(toastTimer); container.innerHTML = ''; } };
}

function launchConfetti(stage) {
  if (!stage) return;
  const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--success)', 'var(--accent2)'];
  for (let i = 0; i < 40; i++) {
    const dot = document.createElement('span');
    dot.className = 'sc-confetti-dot';
    dot.style.cssText =
      `background:${COLORS[i % COLORS.length]};left:${Math.random() * 100}%;` +
      `width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px;` +
      `animation-delay:${Math.random() * 0.5}s;animation-duration:${0.9 + Math.random() * 0.8}s;` +
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`;
    stage.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }
}
