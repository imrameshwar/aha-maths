// story/audio-fx.js — procedural sound for the interactive story.
// Pure WebAudio (oscillators + noise) — NO audio files, so it works offline and
// ships nothing extra. A soft ambient pad + a handful of UI/story SFX.
//
// Autoplay policy: nothing makes sound until ensure() runs inside a user gesture
// (the "Begin the story" tap). Everything routes through a master gain that the
// sound toggle mutes.

export function createAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null, master = null, enabled = true;
  let ambient = null; // { gain, nodes:[], lfo }

  function ensure() {
    if (!AC) return false;
    if (!ac) {
      ac = new AC();
      master = ac.createGain();
      master.gain.value = enabled ? 0.5 : 0.0001;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return true;
  }

  function setEnabled(on) {
    enabled = on;
    if (master && ac) master.gain.setTargetAtTime(on ? 0.5 : 0.0001, ac.currentTime, 0.05);
    if (!on) stopAmbient();
  }

  // ── one-shot tone ──
  function tone({ freq = 440, dur = 0.15, type = 'sine', gain = 0.18, glideTo = null, delay = 0, attack = 0.01 }) {
    if (!ac || !enabled) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // ── short filtered-noise burst (thunks / whooshes) ──
  function noise({ dur = 0.2, gain = 0.15, type = 'lowpass', from = 1200, to = 300, delay = 0, q = 0.8 }) {
    if (!ac || !enabled) return;
    const t0 = ac.currentTime + delay;
    const n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource(); src.buffer = buf;
    const filt = ac.createBiquadFilter(); filt.type = type; filt.Q.value = q;
    filt.frequency.setValueAtTime(from, t0);
    filt.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(g).connect(master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  // ── named SFX ──
  const click     = () => tone({ freq: 480, glideTo: 560, dur: 0.07, type: 'triangle', gain: 0.10 });
  const pop       = () => tone({ freq: 620, glideTo: 940, dur: 0.10, type: 'triangle', gain: 0.14 });
  const stoneDrop = () => { tone({ freq: 210, glideTo: 90, dur: 0.16, type: 'sine', gain: 0.22 }); noise({ dur: 0.09, gain: 0.10, from: 600, to: 120 }); };
  const tick      = () => tone({ freq: 900, dur: 0.05, type: 'square', gain: 0.05 });
  const whoosh    = () => noise({ dur: 0.34, gain: 0.10, from: 300, to: 1600, type: 'bandpass', q: 0.6 });
  const chime     = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, dur: 0.42, type: 'sine', gain: 0.14, delay: i * 0.09, attack: 0.02 }));

  // Per-era ambient "beds" — same pad, but each era gets its own root pitch +
  // filter colour so travelling through time is felt in the sound (S3).
  const ERA_AMBIENCE = {
    night:  { root: 110,    filt: 620 },
    dawn:   { root: 130.81, filt: 900 },
    bone:   { root: 98,     filt: 520 },
    clay:   { root: 110,    filt: 680 },
    marble: { root: 146.83, filt: 820 },
    ink:    { root: 123.47, filt: 720 },
    saffron:{ root: 138.59, filt: 860 },
    cosmic: { root: 87.31,  filt: 480 },
  };

  // ── soft ambient pad ──
  function ambientOn(eraName = 'night') {
    if (!ensure() || !enabled || ambient) return;
    const era = ERA_AMBIENCE[eraName] || ERA_AMBIENCE.night;
    const g = ac.createGain(); g.gain.value = 0.0001; g.connect(master);
    const filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = era.filt; filt.connect(g);
    const oscs = [];
    // root + fifth + octave, gently detuned
    [1, 1.4983, 2].forEach((mult, i) => {
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = era.root * mult; o.detune.value = (i - 1) * 4;
      const og = ac.createGain(); og.gain.value = i === 2 ? 0.35 : 0.6;
      o.connect(og).connect(filt); o.start(); oscs.push(o);
    });
    // slow breathing LFO on the pad gain
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ac.createGain(); lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(g.gain); lfo.start();
    g.gain.setTargetAtTime(0.05, ac.currentTime, 1.5); // fade in
    ambient = { gain: g, filt, oscs, nodes: [...oscs, lfo] };
  }

  // Retune the running pad to a new era (crossfade of pitch + filter colour).
  function setAmbienceEra(eraName) {
    if (!ambient || !ac) return;
    const era = ERA_AMBIENCE[eraName] || ERA_AMBIENCE.night;
    const now = ac.currentTime;
    ambient.filt.frequency.setTargetAtTime(era.filt, now, 0.8);
    [1, 1.4983, 2].forEach((mult, i) => {
      if (ambient.oscs[i]) ambient.oscs[i].frequency.setTargetAtTime(era.root * mult, now, 0.9);
    });
  }
  function stopAmbient() {
    if (!ambient || !ac) return;
    const a = ambient; ambient = null;
    a.gain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.4);
    setTimeout(() => a.nodes.forEach(n => { try { n.stop(); } catch {} }), 1200);
  }

  return {
    ensure, setEnabled, ambientOn, ambientOff: stopAmbient, setAmbienceEra,
    click, pop, stoneDrop, tick, whoosh, chime,
    get enabled() { return enabled; },
    get supported() { return !!AC; },
  };
}
