// ui/i18n.js — language state, string lookup, and DOM updates.

const LANGS = ['en', 'hi'];
const LS_KEY = 'am-lang';

let _lang = localStorage.getItem(LS_KEY) || 'en';
let _strings = { en: {}, hi: {} };

export async function initI18n() {
  const [en, hi] = await Promise.all([
    fetch('content/i18n/en.json').then(r => r.json()),
    fetch('content/i18n/hi.json').then(r => r.json()),
  ]);
  _strings = { en, hi };
  _applyLang(_lang);
}

// Resolve a dot-separated key against the current language, falling back to EN.
export function t(key) {
  const val = _resolve(_strings[_lang], key) ?? _resolve(_strings.en, key);
  return val ?? key;
}

// Resolve a key against a SPECIFIC language (falling back to EN). Used to build
// the always-bilingual Khoj share card regardless of the active UI language.
export function tLang(lang, key) {
  const val = _resolve(_strings[lang], key) ?? _resolve(_strings.en, key);
  return val ?? key;
}

export function getLang() { return _lang; }

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  _lang = lang;
  localStorage.setItem(LS_KEY, lang);
  _applyLang(lang);
}

function _resolve(obj, key) {
  return key.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
}

function _applyLang(lang) {
  document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
  // Update all static [data-i18n] nodes in the document.
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  document.dispatchEvent(new CustomEvent('am:langchange', { detail: { lang } }));
}
