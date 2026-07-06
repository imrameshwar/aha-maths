// engine/visualizer.js — the Visualizer contract (the one swappable slot).
//
// A visualizer is a plain object implementing this interface:
//
//   meta     : { id, pillar: 'A'|'B', title }
//   duration : number   // CONTENT seconds (intro/outro added by the engine)
//   controls : { <name>: { default, min, max, step, label } }
//              OPTIONAL — interactive host auto-builds sliders from this;
//              render mode uses the defaults (or config.params override).
//   setup(ctx)             // build initial state into ctx.state (seed via ctx.rng)
//   update(ctx, t, dt)     // OPTIONAL: advance stateful sims; called once/frame in order
//   draw(ctx, t, p)        // render this frame; draw ONLY inside ctx.stageRect
//   caption(ctx, t, p)     // OPTIONAL: one-line status string for the caption zone
//
// ctx provides: { p, theme, W, H, stageRect, zones, rng, params, ease, motifs,
//                 fps, mode, config, state }.
// ctx.mode = 'render' | 'interactive'. Most visualizers ignore it.
// ctx.params = live control values (interactive) or defaults/config.params (render).
//
// Purity rules — MANDATORY for deterministic render:
//   • Never call Math.random() — use ctx.rng (seeded mulberry32).
//   • If you use p.random() / p.noise(), call p.randomSeed(seed) / p.noiseSeed(seed)
//     in setup() — otherwise they are non-deterministic.
//   • Never read wall-clock or p5 loop-state: no Date.now(), p.millis(),
//     p.frameCount, or p.deltaTime. Drive everything from the passed t / p.
//   • Compute positions as fractions of stageRect.w/.h (not hardcoded px) so the
//     same sketch is resolution-independent in interactive / responsive mode.

export function defineVisualizer(spec) {
  if (typeof spec.draw !== 'function') {
    throw new Error('Visualizer must implement draw(ctx, t, p).');
  }
  return {
    meta:     spec.meta     || {},
    duration: spec.duration ?? 10,
    controls: spec.controls || {},
    setup:    spec.setup    || (() => {}),
    update:   spec.update   || null,
    draw:     spec.draw,
    caption:  spec.caption  || (() => ''),
  };
}

export default defineVisualizer;
