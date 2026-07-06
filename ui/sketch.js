// ui/sketch.js — mounts a visualizer in a lesson beat.
// Lighter than createInteractive: no video layout zones, bridges CSS theme vars live.

import * as easing from '../engine/easing.js';
import { makeRng }  from '../engine/rng.js';

function _cssTheme() {
  const s = getComputedStyle(document.documentElement);
  const g = v => s.getPropertyValue(v).trim();
  return {
    bg:        g('--bg')        || '#0B0F1A',
    surface:   g('--surface')   || '#141A2A',
    grid:      g('--grid')      || '#222B3D',
    primary:   g('--primary')   || '#22D3EE',
    secondary: g('--secondary') || '#FBBF24',
    success:   g('--success')   || '#34D399',
    danger:    g('--danger')    || '#F87171',
    accent2:   g('--accent2')   || '#A78BFA',
    textHi:    g('--text-hi')   || '#FFFFFF',
    textLo:    g('--text-lo')   || '#94A3B8',
    fontSans:  'Inter',
    fontMono:  'JetBrains Mono',
  };
}

export function mountSketch(wrapEl, viz, options = {}) {
  const { params: initParams = {}, seed = 42, aspectRatio = 16 / 9 } = options;

  // Merge control defaults with caller overrides.
  const params = {};
  for (const [k, v] of Object.entries(viz.controls || {})) params[k] = v.default;
  Object.assign(params, initParams);

  const state = {};
  let _p5 = null;
  let ctx  = null;

  // p5 calls setup() synchronously inside the constructor, so _p5 would still
  // be null at that point. Pass p (the sketch instance) as an explicit argument.
  function _buildCtx(p, W, H) {
    const pad   = 10;
    const stage = { x: pad, y: pad, w: W - pad * 2, h: H - pad * 2 };
    return {
      p, theme: _cssTheme(), W, H,
      stageRect: stage, zones: { stage },
      rng: makeRng(seed), params, ease: easing,
      motifs: null, fps: 60, mode: 'interactive',
      config: { seed }, state,
    };
  }

  _p5 = new window.p5((p) => {
    p.setup = () => {
      const w = wrapEl.clientWidth || 400;
      const h = Math.round(w / aspectRatio);
      p.createCanvas(w, h).parent(wrapEl);
      p.frameRate(60);
      ctx = _buildCtx(p, w, h);
      viz.setup(ctx);
    };

    p.draw = () => {
      if (!ctx) return;
      ctx.theme = _cssTheme();          // live CSS-var theme every frame
      p.background(p.color(ctx.theme.bg));
      const t = p.millis() / 1000;
      if (viz.update) viz.update(ctx, t, p.deltaTime / 1000);
      viz.draw(ctx, t);
    };

    p.windowResized = () => {
      if (!wrapEl.isConnected) { p.remove(); return; }
      const w = wrapEl.clientWidth;
      const h = Math.round(w / aspectRatio);
      if (w === p.width && h === p.height) return;
      p.resizeCanvas(w, h);
      const prev = ctx?.state ?? {};
      ctx = _buildCtx(p, w, h);
      Object.assign(ctx.state, prev);   // preserve tap state across resize
      viz.setup(ctx);
    };
  });

  return {
    setParam(name, value) { params[name] = value; },
    getState()            { return ctx?.state ?? state; },
    remove()              { if (_p5) { _p5.remove(); _p5 = null; ctx = null; } },
  };
}
