// ui/audio.js — Web Speech API narrator for lesson beats.
// No audio files needed: uses the browser's built-in TTS (EN + हिंदी).

const LS_KEY = 'am-sound';

let _enabled = localStorage.getItem(LS_KEY) !== 'off';

export function isSoundEnabled()    { return _enabled; }

export function setSoundEnabled(on) {
  _enabled = on;
  localStorage.setItem(LS_KEY, on ? 'on' : 'off');
  if (!on && window.speechSynthesis) window.speechSynthesis.cancel();
  document.dispatchEvent(new CustomEvent('am:soundchange', { detail: { enabled: on } }));
}

export function speak(text, lang = 'en') {
  if (!_enabled || !window.speechSynthesis || !text) return;
  const utter    = new SpeechSynthesisUtterance(text);
  utter.lang     = lang === 'hi' ? 'hi-IN' : 'en-US';
  utter.rate     = 0.9;
  utter.pitch    = 1.05;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}
