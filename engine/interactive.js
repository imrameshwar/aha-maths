// engine/interactive.js — live interactive host.
// Wraps a visualizer in a looping p5 sketch with wall-clock t, responsive canvas,
// and a param map driven by the control panel (sliders in the play page).
//
// Usage (from the play page):
//   import { createInteractive } from '/engine/interactive.js';
//   const interactive = createInteractive(p, { config, viz });
//   // in p.draw(): interactive.tick();
//   // slider oninput: interactive.setParam('slices', value);
//   // button: interactive.reshuffleSeed();

import { theme as defaultTheme } from './theme.js';
import { computeLayout }         from './layout.js';
import { makeRng }               from './rng.js';
import * as easing               from './easing.js';
import * as motifs               from './motifs.js';

export function createInteractive(p, { config, viz }) {
  const theme = { ...defaultTheme, ...(config.theme || {}) };

  // Params: control defaults, overridable by config.params, then live slider.
  const params = {};
  for (const [name, ctl] of Object.entries(viz.controls || {})) {
    params[name] =
      config.params?.[name] !== undefined ? config.params[name] : ctl.default;
  }

  let seed = config.seed ?? 42;

  function buildCtx() {
    const W = p.width;
    const H = p.height;
    const layout = computeLayout(W, H);
    return {
      p,
      theme,
      W,
      H,
      stageRect: layout.stage,
      zones:     layout,
      rng:       makeRng(seed),
      params,           // live reference — slider writes go here
      ease:      easing,
      motifs,
      fps:       60,
      mode:      'interactive',
      config,
      state:     {},
    };
  }

  let ctx = buildCtx();
  viz.setup(ctx);

  // Wall-clock tracking — drives t in the content window, loops at viz.duration.
  let clockOrigin = null;

  function tick() {
    const nowSec = p.millis() / 1000;
    if (clockOrigin === null) clockOrigin = nowSec;
    const elapsed = nowSec - clockOrigin;
    const dur     = viz.duration || 10;
    const t       = elapsed % dur;               // loop content
    const prog    = t / dur;

    p.background(p.color(theme.bg));

    // Subtle stage background so the active zone is distinct from the outer bg.
    const s = ctx.stageRect;
    p.push();
    p.noStroke();
    p.fill(p.color(theme.surface));
    p.rectMode(p.CORNER);
    p.rect(s.x, s.y, s.w, s.h, 16);
    p.pop();

    // Advance stateful sims (Pillar B). Interactive uses real dt, not step index.
    if (viz.update) viz.update(ctx, t, 1 / 60);

    // Visualizer draws ONLY inside ctx.stageRect.
    viz.draw(ctx, t, prog);

    // Caption zone.
    const caption = viz.caption ? (viz.caption(ctx, t, prog) || '') : '';
    if (caption) {
      const c = ctx.zones.caption;
      p.push();
      p.noStroke();
      p.fill(p.color(theme.surface));
      p.rectMode(p.CORNER);
      p.rect(c.x, c.y + 30, c.w, c.h - 60, 24);
      p.fill(p.color(theme.textHi));
      p.textAlign(p.CENTER, p.CENTER);
      p.textFont(theme.fontMono);
      p.textStyle(p.NORMAL);
      p.textSize(Math.min(46, s.w * 0.049));
      p.text(caption, c.x + c.w / 2, c.y + c.h / 2);
      p.pop();
    }

    // Footer handle.
    const f = ctx.zones.footer;
    p.push();
    p.noStroke();
    p.fill(p.color(theme.textLo));
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont(theme.fontSans);
    p.textStyle(p.BOLD);
    p.textSize(Math.min(40, s.w * 0.043));
    p.text(theme.handle, ctx.W / 2, f.y + f.h / 2 - 10);
    p.pop();
  }

  function setParam(name, value) {
    params[name] = value;
  }

  function reshuffleSeed() {
    // Use Math.random() here — this is interactive, not the deterministic renderer.
    seed = Math.floor(Math.random() * 99999);
    ctx = buildCtx();
    clockOrigin = null;
    viz.setup(ctx);
  }

  function windowResized() {
    // Rebuild layout for the new canvas size; keep params + seed.
    const W = p.width;
    const H = p.height;
    const layout = computeLayout(W, H);
    ctx.W        = W;
    ctx.H        = H;
    ctx.stageRect = layout.stage;
    ctx.zones     = layout;
    // Re-run setup so the visualizer recomputes geometry (state may depend on stageRect).
    ctx.state = {};
    ctx.rng   = makeRng(seed);
    viz.setup(ctx);
  }

  return { tick, setParam, reshuffleSeed, windowResized, controls: viz.controls || {}, params };
}

export default createInteractive;
