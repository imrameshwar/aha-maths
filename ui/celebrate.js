// ui/celebrate.js — the unified "aha payoff" celebration.
//
// One shared burst, reused across the lesson Aha beat and the Khoj win, so every
// win feels the same big way: a full-viewport confetti rain (tinted to the
// world's colour when known), a warm major chord, and a short haptic tap.
// Reduced-motion drops the visual rain; the chord + haptic stay (they aren't
// vestibular motion) and the chord is gated on the sound setting.
//
// celebrate({ colors?, sound = true, vibrate = true })

import { isSoundEnabled } from './audio.js';

const DEFAULT_COLORS =
  ['var(--primary)', 'var(--secondary)', 'var(--success)', 'var(--accent2)', 'var(--danger)'];

function reducedMotion() {
  return document.documentElement.dataset.motion === 'reduce' ||
         window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let _actx = null;
// A warm C-major chord (C5 · E5 · G5 · C6) with a soft swell — the "earned" sound.
function warmChord() {
  if (!isSoundEnabled()) return;
  try {
    _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === 'suspended') _actx.resume();
    const now = _actx.currentTime;
    const master = _actx.createGain();
    master.connect(_actx.destination);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = _actx.createOscillator();
      o.type = i === 3 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const g = _actx.createGain();
      g.gain.value = i === 3 ? 0.5 : 1;
      o.connect(g); g.connect(master);
      o.start(now + i * 0.04);
      o.stop(now + 1.25);
    });
  } catch { /* audio is a bonus, never a blocker */ }
}

export function celebrate({ colors, sound = true, vibrate = true } = {}) {
  if (sound) warmChord();
  if (vibrate && navigator.vibrate) { try { navigator.vibrate(30); } catch { /* unsupported */ } }
  if (reducedMotion()) return;

  const palette = (colors && colors.length ? colors : []).concat(DEFAULT_COLORS);
  const layer = document.createElement('div');
  layer.className = 'celebrate-layer';
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 90; i++) {
    const bit  = document.createElement('span');
    bit.className = 'celebrate-bit';
    const size = 7 + Math.random() * 9;
    bit.style.cssText =
      `left:${(Math.random() * 100).toFixed(2)}%;` +
      `background:${palette[i % palette.length]};` +
      `width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;` +
      `animation-delay:${(Math.random() * 0.5).toFixed(2)}s;` +
      `animation-duration:${(1.6 + Math.random() * 1.2).toFixed(2)}s;` +
      `--x:${(Math.random() * 2 - 1).toFixed(2)};` +
      `--spin:${Math.round(Math.random() * 720 - 360)}deg;` +
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`;
    layer.appendChild(bit);
  }

  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3600);   // outlast the slowest fall, then clean up
}
