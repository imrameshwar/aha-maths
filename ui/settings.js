// ui/settings.js — settings panel: language, theme, sound, font size, font, motion.

import { t, getLang, setLang }                       from './i18n.js';
import { getTheme, setTheme }                        from './theme.js';
import { isSoundEnabled, setSoundEnabled }           from './audio.js';
import { getFontSize, setFontSize, getFont, setFont, getMotion, setMotion } from './accessibility.js';

export function initSettings() {
  const btn   = document.getElementById('settings-btn');
  const panel = document.getElementById('settings-panel');
  if (!btn || !panel) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const opening = panel.hidden;
    panel.hidden = !opening;
    btn.setAttribute('aria-expanded', String(opening));
    if (opening) _renderPanel();
  });

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn) _close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') _close();
  });

  // Re-render when any setting changes so active states stay in sync.
  document.addEventListener('am:langchange',     () => { if (!panel.hidden) _renderPanel(); });
  document.addEventListener('am:themechange',    () => { if (!panel.hidden) _renderPanel(); });
  document.addEventListener('am:soundchange',    () => { if (!panel.hidden) _renderPanel(); });
  document.addEventListener('am:fontsizechange', () => { if (!panel.hidden) _renderPanel(); });
  document.addEventListener('am:fontchange',     () => { if (!panel.hidden) _renderPanel(); });
  document.addEventListener('am:motionchange',   () => { if (!panel.hidden) _renderPanel(); });

  function _close() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }
}

function _renderPanel() {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;

  const lang     = getLang();
  const theme    = getTheme();
  const soundOn  = isSoundEnabled();
  const fontSize = getFontSize();
  const font     = getFont();
  const motion   = getMotion();

  // Representative palette per theme (bg + primary/secondary/accent) for the live swatch.
  const themeOpts = [
    { id: 'dark',  label: t('ui.theme_dark'),  sw: { bg: '#0B0F1A', p: '#22D3EE', s: '#FBBF24', a: '#A78BFA' } },
    { id: 'light', label: t('ui.theme_light'), sw: { bg: '#F8FAFC', p: '#0E7490', s: '#B45309', a: '#6D28D9' } },
    { id: 'hc',    label: t('ui.theme_hc'),    sw: { bg: '#000000', p: '#00F5FF', s: '#FFD700', a: '#CF9FFF' } },
    { id: 'kid',   label: t('ui.theme_kid'),   sw: { bg: '#FFFBF0', p: '#C64900', s: '#A26509', a: '#6355F0' } },
    { id: 'cb',    label: t('ui.theme_cb'),    sw: { bg: '#1A1A2E', p: '#4CC9F0', s: '#F77F00', a: '#AA66E2' } },
  ];

  panel.innerHTML = `
    <div class="sp-head">${t('ui.settings')}</div>
    <div class="sp-section">
      <div class="sp-label">${t('ui.language')}</div>
      <div class="sp-row">
        <button class="sp-opt${lang === 'en' ? ' is-active' : ''}" data-lang="en">English</button>
        <button class="sp-opt${lang === 'hi' ? ' is-active' : ''}" data-lang="hi">हिंदी</button>
      </div>
    </div>
    <div class="sp-section">
      <div class="sp-label">${t('ui.theme')}</div>
      <div class="sp-themes">
        ${themeOpts.map(o => `
          <button class="sp-theme${theme === o.id ? ' is-active' : ''}" data-theme="${o.id}" aria-label="${o.label}">
            <span class="sp-swatch" style="--sw-bg:${o.sw.bg}">
              <i style="background:${o.sw.p}"></i><i style="background:${o.sw.s}"></i><i style="background:${o.sw.a}"></i>
            </span>
            <span class="sp-theme-name">${o.label}</span>
          </button>`).join('')}
      </div>
    </div>
    <div class="sp-section">
      <div class="sp-label">${t('ui.sound')}</div>
      <div class="sp-row">
        <button class="sp-opt${soundOn ? ' is-active' : ''}"  data-sound="on">${t('ui.sound_on')} 🔊</button>
        <button class="sp-opt${!soundOn ? ' is-active' : ''}" data-sound="off">${t('ui.sound_off')} 🔇</button>
      </div>
    </div>
    <div class="sp-section">
      <div class="sp-label">${t('ui.font_size')}</div>
      <div class="sp-row">
        <button class="sp-opt${fontSize === 'sm' ? ' is-active' : ''}" data-fontsize="sm">${t('ui.fontsize_sm')}</button>
        <button class="sp-opt${fontSize === 'md' ? ' is-active' : ''}" data-fontsize="md">${t('ui.fontsize_md')}</button>
        <button class="sp-opt${fontSize === 'lg' ? ' is-active' : ''}" data-fontsize="lg">${t('ui.fontsize_lg')}</button>
      </div>
    </div>
    <div class="sp-section">
      <div class="sp-label">${t('ui.font_style')}</div>
      <div class="sp-row">
        <button class="sp-opt${font === 'default'  ? ' is-active' : ''}" data-font="default">${t('ui.font_default')}</button>
        <button class="sp-opt${font === 'dyslexic' ? ' is-active' : ''}" data-font="dyslexic">${t('ui.font_dyslexic')}</button>
      </div>
    </div>
    <div class="sp-section">
      <div class="sp-label">${t('ui.motion')}</div>
      <div class="sp-row">
        <button class="sp-opt${motion === 'full'   ? ' is-active' : ''}" data-motion="full">${t('ui.motion_full')}</button>
        <button class="sp-opt${motion === 'reduce' ? ' is-active' : ''}" data-motion="reduce">${t('ui.motion_reduce')}</button>
      </div>
    </div>
  `;

  panel.querySelectorAll('[data-lang]').forEach(b     => b.addEventListener('click', e => { e.stopPropagation(); setLang(b.dataset.lang); }));
  panel.querySelectorAll('[data-theme]').forEach(b    => b.addEventListener('click', e => { e.stopPropagation(); setTheme(b.dataset.theme); }));
  panel.querySelectorAll('[data-sound]').forEach(b    => b.addEventListener('click', e => { e.stopPropagation(); setSoundEnabled(b.dataset.sound === 'on'); }));
  panel.querySelectorAll('[data-fontsize]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setFontSize(b.dataset.fontsize); }));
  panel.querySelectorAll('[data-font]').forEach(b     => b.addEventListener('click', e => { e.stopPropagation(); setFont(b.dataset.font); }));
  panel.querySelectorAll('[data-motion]').forEach(b   => b.addEventListener('click', e => { e.stopPropagation(); setMotion(b.dataset.motion); }));
}
