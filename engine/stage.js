// engine/stage.js — the reusable engine ("the stage").
// Owns: timeline (intro -> content -> outro), per-frame sequencing, the title /
// caption / footer chrome, deterministic stateful-sim stepping, and the ctx
// handed to the visualizer. Built ONCE; not touched on a normal weekday.

import { theme as defaultTheme, ASPECTS } from './theme.js';
import { computeLayout } from './layout.js';
import { makeRng } from './rng.js';
import * as easing from './easing.js';
import * as motifs from './motifs.js';
import { drawIntro, drawOutro } from './cards.js';
import { beatAt, drawSubtitle } from './beats.js';

function drawChrome(ctx, t, p01, viz) {
  const { p, theme, W, zones, config } = ctx;
  const title = (config.intro && config.intro.title) || config.title || '';
  const handle = config.handle || theme.handle;

  // --- Title zone: small logo mark + topic title (left aligned) ---
  p.push();
  p.noStroke();
  const m = zones.title;
  const r = 34;
  p.fill(p.color(theme.primary));
  p.rectMode(p.CENTER);
  p.rect(m.x + 60, m.y + m.h / 2, r * 2, r * 2, r * 0.5);
  p.fill(p.color(theme.bg));
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont(theme.fontMono);
  p.textStyle(p.BOLD);
  p.textSize(r * 0.95);
  p.text(theme.logoText, m.x + 60, m.y + m.h / 2 + 2);

  p.rectMode(p.CORNER);
  p.fill(p.color(theme.textHi));
  p.textAlign(p.LEFT, p.CENTER);
  p.textFont(theme.fontSans);
  p.textStyle(p.BOLD);
  p.textSize(52);
  p.text(title, m.x + 120, m.y + m.h / 2 + 2);
  p.pop();

  // --- Caption zone: one-line status from the visualizer ---
  let caption = '';
  try {
    caption = viz.caption ? viz.caption(ctx, t, p01) || '' : '';
  } catch (_) {
    caption = '';
  }
  if (caption) {
    const c = zones.caption;
    p.push();
    p.noStroke();
    p.fill(p.color(theme.surface));
    p.rectMode(p.CORNER);
    p.rect(c.x, c.y + 30, c.w, c.h - 60, 24);
    p.fill(p.color(theme.textHi));
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont(theme.fontMono);
    p.textStyle(p.NORMAL);
    p.textSize(46);
    p.text(caption, c.x + c.w / 2, c.y + c.h / 2);
    p.pop();
  }

  // --- Footer: handle, centered, in the safe zone ---
  p.push();
  p.noStroke();
  p.fill(p.color(theme.textLo));
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont(theme.fontSans);
  p.textStyle(p.BOLD);
  p.textSize(40);
  p.text(handle, W / 2, zones.footer.y + zones.footer.h / 2 - 10);
  p.pop();
}

export function createStage(p, { config, viz, aspect, lengthSec } = {}) {
  const theme = { ...defaultTheme, ...(config.theme || {}) };
  // Per-render aspect override (vertical / horizontal / square). Replaces the
  // theme's default W/H before layout — the interactive widget never passes this.
  if (aspect && ASPECTS[aspect]) {
    theme.W = ASPECTS[aspect].W;
    theme.H = ASPECTS[aspect].H;
  }
  const W = theme.W;
  const H = theme.H;
  const fps = config.fps || theme.fps;
  const layout = computeLayout(W, H);

  const ctx = {
    p,
    theme,
    W,
    H,
    stageRect: layout.stage,
    zones: layout,
    rng: makeRng(config.seed ?? 1),
    params: config.params || {},
    ease: easing,
    motifs,
    fps,
    config,
    state: {},
  };

  const introD = (config.intro && config.intro.duration) ?? theme.introDuration;
  const outroD = (config.outro && config.outro.duration) ?? theme.outroDuration;

  // The visualizer authors its motion + beats against its native duration. If a
  // target `lengthSec` is requested, fit the WHOLE short into it by retiming only
  // the content span (intro/outro keep their branded lengths). We keep contentD =
  // nativeD but stretch/squash the clock via `timeScale`, so the visualizer and
  // beats still see native-second timings and stay proportionally correct.
  const nativeD = viz.duration || 10;
  let contentD = nativeD;
  if (lengthSec && lengthSec > 0) {
    contentD = Math.max(1, lengthSec - introD - outroD);
  }
  const timeScale = nativeD / contentD;   // native seconds elapsed per real content second

  const introFrames = Math.round(introD * fps);
  const contentFrames = Math.round(contentD * fps);
  const outroFrames = Math.round(outroD * fps);
  const totalFrames = introFrames + contentFrames + outroFrames;

  // Build the visualizer's initial state once.
  if (viz.setup) viz.setup(ctx);
  let lastUpdated = -1;

  function renderFrame(i) {
    p.background(p.color(theme.bg));

    if (i < introFrames) {
      const lt = i / fps;
      const lp = introFrames > 1 ? i / (introFrames - 1) : 1;
      drawIntro(ctx, lt, lp);
      return;
    }

    if (i < introFrames + contentFrames) {
      const ci = i - introFrames;
      // Native visualizer time (0..nativeD): the real content clock scaled so the
      // sim always plays its full arc regardless of the target length.
      const tC = (ci / fps) * timeScale;
      const pC = contentFrames > 1 ? ci / (contentFrames - 1) : 1;

      // Advance stateful sims deterministically: one update per content frame,
      // in order. Catch up if frames were skipped (shouldn't happen in render).
      // dt is scaled too so a Pillar-B sim evolves the same total amount.
      if (viz.update && ci > lastUpdated) {
        for (let k = lastUpdated + 1; k <= ci; k++) {
          viz.update(ctx, (k / fps) * timeScale, (timeScale / fps));
        }
        lastUpdated = ci;
      }

      drawChrome(ctx, tC, pC, viz);

      // Clip to the stage rect so a visualizer can never bleed into chrome.
      const g = p.drawingContext;
      g.save();
      g.beginPath();
      g.rect(ctx.stageRect.x, ctx.stageRect.y, ctx.stageRect.w, ctx.stageRect.h);
      g.clip();
      viz.draw(ctx, tC, pC);
      g.restore();

      // Narration subtitle (timed beats) — drawn ON TOP of the visualizer so it
      // is never hidden by content. Positioned just above the caption zone.
      const beat = beatAt(config.beats, tC);
      if (beat) {
        drawSubtitle(ctx, beat.text, ctx.W / 2, ctx.zones.caption.y - 18, tC - beat.t);
      }
      return;
    }

    // Outro
    const oi = i - introFrames - contentFrames;
    const lt = oi / fps;
    const lp = outroFrames > 1 ? oi / (outroFrames - 1) : 1;
    drawOutro(ctx, lt, lp);
  }

  return {
    ctx,
    fps,
    totalFrames,
    introFrames,
    contentFrames,
    outroFrames,
    renderFrame,
    // Handy for the thumbnail generator: pick a representative content frame.
    midContentFrame: introFrames + Math.floor(contentFrames * 0.6),
  };
}

export default createStage;
