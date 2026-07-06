// ui/theme.js — CSS custom-property theme switching + localStorage persistence.

const THEMES = ['dark', 'light', 'hc', 'kid', 'cb'];
const LS_KEY = 'am-theme';

let _theme = localStorage.getItem(LS_KEY) || _systemDefault();

function _systemDefault() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function initTheme() {
  _applyTheme(_theme);
}

export function getTheme() { return _theme; }

export function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  _theme = theme;
  localStorage.setItem(LS_KEY, theme);
  _applyTheme(theme);
}

function _applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.dispatchEvent(new CustomEvent('am:themechange', { detail: { theme } }));
}
