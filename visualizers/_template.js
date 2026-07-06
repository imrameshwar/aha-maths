// visualizers/_template.js — copy this to start a new short.
// Scaffold with: npm run new-short -- <slug> "Title"
//
// Implement the Visualizer contract from engine/visualizer.js.
// The engine owns the chrome (title/caption/footer/intro/outro).
// You only draw inside ctx.stageRect.

import { defineVisualizer } from '../engine/visualizer.js';

export default defineVisualizer({
  meta: { id: 'REPLACE_ME', pillar: 'A', title: 'REPLACE ME' },

  // CONTENT seconds (engine adds introDuration + outroDuration on top).
  duration: 12,

  // Interactive controls — the interactive host (Phase 5) auto-builds sliders
  // from this schema. Render mode uses the defaults (or config.params override).
  // Delete if the sketch has no tunable parameters.
  controls: {
    // speed: { default: 1, min: 0.1, max: 3, step: 0.1, label: 'Speed' },
  },

  // Build initial state into ctx.state. Seed randomness via ctx.rng.
  // Called once before the first frame.
  setup(ctx) {
    // ctx.state.example = ctx.rng();
  },

  // OPTIONAL: advance stateful simulations. Called once per content frame,
  // in order. Delete if your visualizer is a pure function of t
  // (Pillar A explainers usually are).
  // update(ctx, t, dt) {
  //   ctx.state.angle += dt * ctx.params.speed;
  // },

  // Render this frame.
  //   t = seconds since content start (0 → duration)
  //   p = progress 0 → 1
  //
  // PURITY RULES (break any of these → non-deterministic render):
  //   • Draw ONLY inside ctx.stageRect — never bleed into the chrome zones.
  //   • All positions/sizes MUST be fractions of stageRect.w / .h — never
  //     hardcoded px. This keeps the sketch crisp at 1080×1920 (render) AND
  //     at any browser size (interactive/responsive).
  //   • Never call Math.random(). Use ctx.rng (seeded mulberry32).
  //     If you use p.random()/p.noise(), seed them in setup() first.
  //   • Never read Date.now(), p.millis(), p.frameCount, or p.deltaTime.
  //     Drive everything from the passed t / p only.
  draw(ctx, t, p) {
    const { p: g, theme, stageRect: s } = ctx;

    // Example: a circle that moves across the stage.
    // All coordinates are fractions of stageRect — resolution-independent.
    const cx = s.x + s.w * p;
    const cy = s.y + s.h * 0.5;
    const r  = s.w * 0.08;

    g.push();
    g.noStroke();
    g.fill(g.color(theme.primary));
    g.circle(cx, cy, r * 2);
    g.pop();
  },

  // OPTIONAL: one-line status for the caption zone (renders in JetBrains Mono).
  // caption(ctx, t, p) {
  //   return `t = ${t.toFixed(2)} s`;
  // },
});
