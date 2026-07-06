// ui/accessibility.js — font-size scaling, dyslexia font, reduced-motion toggle.

const LS_FONTSIZE = 'am-fontsize';
const LS_FONT     = 'am-font';
const LS_MOTION   = 'am-motion';

// ── Font size ──────────────────────────────────────────────────────────────────

export function getFontSize() {
  return localStorage.getItem(LS_FONTSIZE) || 'md';
}

export function setFontSize(size) {
  localStorage.setItem(LS_FONTSIZE, size);
  document.documentElement.dataset.fontsize = size;
  document.dispatchEvent(new Event('am:fontsizechange'));
}

// ── Font family ────────────────────────────────────────────────────────────────

export function getFont() {
  return localStorage.getItem(LS_FONT) || 'default';
}

export function setFont(f) {
  localStorage.setItem(LS_FONT, f);
  document.documentElement.dataset.font = f;
  document.dispatchEvent(new Event('am:fontchange'));
}

// ── Motion ─────────────────────────────────────────────────────────────────────

export function getMotion() {
  const saved = localStorage.getItem(LS_MOTION);
  if (saved) return saved;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'full';
}

export function setMotion(m) {
  localStorage.setItem(LS_MOTION, m);
  document.documentElement.dataset.motion = m;
  document.dispatchEvent(new Event('am:motionchange'));
}

// ── Init: apply all saved prefs to <html> on page load ────────────────────────

export function initAccessibility() {
  document.documentElement.dataset.fontsize = getFontSize();
  document.documentElement.dataset.font     = getFont();
  document.documentElement.dataset.motion   = getMotion();
}
