// ui/hub.js — renders the world map on index.html.
// Reads worlds.json + progress from localStorage; no framework needed.

import { getProgress, getLastLesson, countCompleted } from './progress.js';
import { WORLD_ICONS } from './world-icons.js';

const WORLD_LABELS = {
  numbers:    { en: 'Numbers',               hi: 'संख्याएँ',       desc_en: 'What are numbers? Count, compare, and understand zero.',        desc_hi: 'संख्या क्या है? गिनना, तुलना और शून्य।' },
  arithmetic: { en: 'Arithmetic',            hi: 'जोड़-घटाव',      desc_en: 'Add, subtract, multiply, divide — and understand why.',          desc_hi: 'जोड़, घटाओ, गुणा, भाग — और क्यों?' },
  fractions:  { en: 'Fractions & Decimals',  hi: 'टुकड़े',         desc_en: 'Parts of a whole — roti, pizza, money, and more.',               desc_hi: 'पूरे का हिस्सा — रोटी, पैसे और भी।' },
  shapes:     { en: 'Shapes & Space',        hi: 'आकार',           desc_en: 'Angles, area, and the magic of πr².',                            desc_hi: 'कोण, क्षेत्रफल और πr² का जादू।' },
  algebra:    { en: 'Patterns & Algebra',    hi: 'पहेलियाँ',       desc_en: 'Find the unknown. Patterns, equations, Pythagoras.',              desc_hi: 'अज्ञात खोजो। पैटर्न, समीकरण, पाइथागोरस।' },
  measure:    { en: 'Measure & Ratio',       hi: 'नाप-तोल',        desc_en: 'Units, ratios, proportions, and the idea of speed.',             desc_hi: 'इकाइयाँ, अनुपात और गति।' },
  data:       { en: 'Data & Chance',         hi: 'आँकड़े',         desc_en: 'Read charts, understand averages, feel probability.',            desc_hi: 'चार्ट पढ़ो, औसत समझो, संयोग महसूस करो।' },
  infinite:   { en: 'The Infinite & Beautiful', hi: 'अनंत',        desc_en: 'Limits, primes, Fibonacci, and a taste of calculus.',            desc_hi: 'सीमाएँ, अभाज्य, फिबोनाची और कैलकुलस।' },
};

let _available = null; // Set of lesson ids that actually have content (lazy-loaded once)

async function _getAvailable() {
  if (_available) return _available;
  try {
    const { available } = await fetch('content/lessons/index.json').then(r => r.json());
    _available = new Set(available);
  } catch {
    _available = new Set(); // fail safe: treat everything as "coming soon" rather than 404
  }
  return _available;
}

export async function initHub(lang = 'en') {
  const [worlds, progress, available] = await Promise.all([
    fetch('content/worlds.json').then(r => r.json()),
    Promise.resolve(getProgress()),
    _getAvailable(),
  ]);

  _renderContinue(progress, worlds, lang);
  _renderGems(worlds, progress, lang);
  _renderWorlds(worlds, progress, lang, available);
}

// Aha-gems: every completed lesson is a collectible gem in its world's colour,
// shelved on the map to reward progress and give a reason to come back. Derived
// straight from progress (localStorage) — no separate store to drift.
function _renderGems(worlds, progress, lang) {
  const el = document.getElementById('hub-gems');
  if (!el) return;
  const isHi = lang === 'hi';

  const gems = [];
  worlds.forEach((w, wi) => {
    w.lessons.forEach((l, li) => {
      const p = progress[l.id];
      if (p && p.completed) {
        gems.push({ id: l.id, color: w.color, wi, li, ts: p.lastSeen || 0,
                    wname: WORLD_LABELS[w.id]?.[isHi ? 'hi' : 'en'] ?? w.id });
      }
    });
  });

  if (!gems.length) { el.hidden = true; el.innerHTML = ''; return; }

  gems.sort((a, b) => a.wi - b.wi || a.li - b.li);
  const latestId = gems.reduce((m, g) => (g.ts > m.ts ? g : m), gems[0]).id;

  el.hidden = false;
  el.innerHTML = `
    <div class="hub-gems-inner">
      <div class="hub-gems-head">
        <span class="hub-gems-title">${isHi ? 'आपके रत्न' : 'Your gems'}</span>
        <span class="hub-gems-count">${gems.length}</span>
      </div>
      <div class="hub-gems-shelf">
        ${gems.map((g, i) => `
          <span class="hub-gem${g.id === latestId ? ' is-latest' : ''}"
                style="--gem:${g.color};--i:${i}"
                title="${g.wname} · ${g.id}"
                role="img" aria-label="${g.wname} · ${g.id}"></span>`).join('')}
      </div>
    </div>`;
}

function _renderContinue(progress, worlds, lang) {
  const el = document.getElementById('hub-continue');
  if (!el) return;

  const lastId = getLastLesson();
  if (!lastId) { el.hidden = true; return; }

  const world = worlds.find(w => w.lessons.some(l => l.id === lastId));
  const lesson = world?.lessons.find(l => l.id === lastId);
  const isHi = lang === 'hi';
  const wLabel = world ? (WORLD_LABELS[world.id]?.[isHi ? 'hi' : 'en'] ?? world.id) : '';

  el.hidden = false;
  el.innerHTML = `
    <div class="hub-continue-inner">
      <span class="hub-continue-icon" style="color:${world?.color ?? 'var(--primary)'}">${WORLD_ICONS[world?.id] ?? world?.icon ?? '📖'}</span>
      <div class="hub-continue-text">
        <span class="hub-continue-label">${isHi ? 'जारी रखो' : 'Continue where you left off'}</span>
        <span class="hub-continue-lesson">${wLabel} · ${lastId}</span>
      </div>
      <a class="hub-continue-btn" href="learn.html?lesson=${lastId}">
        ${isHi ? 'आगे →' : 'Resume →'}
      </a>
    </div>
  `;
}

function _renderWorlds(worlds, progress, lang, available) {
  const grid = document.getElementById('hub-worlds');
  if (!grid) return;
  const isHi = lang === 'hi';

  grid.innerHTML = worlds.map((w, wi) => {
    const labels  = WORLD_LABELS[w.id] ?? {};
    const name    = labels[isHi ? 'hi' : 'en']         ?? w.id;
    const desc    = labels[isHi ? 'desc_hi' : 'desc_en'] ?? '';
    const ids     = w.lessons.map(l => l.id);
    const total   = ids.length;
    const done    = countCompleted(ids);
    const pct     = total ? Math.round((done / total) * 100) : 0;
    // Only route "Start" into a lesson that actually has content — never into
    // a JSON that 404s, even if it's first by curriculum order.
    const orderedAvailable = [...w.lessons].sort((a, b) => a.order - b.order).filter(l => available.has(l.id));
    const firstLesson = orderedAvailable[0]?.id;
    const isLocked = orderedAvailable.length === 0;
    const isNew   = wi === 0;

    const ctaLabel = done > 0
      ? (isHi ? 'जारी रखो' : 'Continue')
      : (isHi ? 'शुरू करो' : 'Start');

    return `
      <div class="world-card${isLocked ? ' is-locked' : ''}${isNew ? ' is-new' : ''}"
           style="--world-color:${w.color}">
        <div class="world-card-header">
          <span class="world-icon">${WORLD_ICONS[w.id] ?? w.icon}</span>
          <span class="world-num">${String(w.order).padStart(2, '0')}</span>
        </div>
        <div class="world-card-body">
          <h3 class="world-name">${name}</h3>
          <p class="world-desc">${desc}</p>
          ${w.id === 'numbers'
            ? `<a class="world-story-link" href="numbers-story.html">${isHi ? '✨ कहानी खेलो — संख्याओं की कहानी' : '✨ Play the Story of Numbers'}</a>`
            : ''}
        </div>
        <div class="world-card-footer">
          <div class="world-progress">
            <div class="world-progress-bar">
              <div class="world-progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="world-progress-label">${done}/${total} ${isHi ? 'पाठ' : 'lessons'}</span>
          </div>
          ${isLocked
            ? `<span class="world-cta is-locked-cta">🔒 ${isHi ? 'जल्द' : 'Coming soon'}</span>`
            : `<a class="world-cta" href="learn.html?lesson=${firstLesson}">${ctaLabel} →</a>`
          }
        </div>
      </div>
    `;
  }).join('');
}
