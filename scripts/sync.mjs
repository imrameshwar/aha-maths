// scripts/sync.mjs — push this website's sim code INTO the Aha Maths Studio.
//
// This website is the SOURCE OF TRUTH for the dual-mode sim code: you author and
// perfect the sketches here (web-first), then push them to the Studio so it can
// render the videos. Direction is website → Studio.
//
// Run:  npm run sync                          (Studio assumed at ../AhaMaths)
//       STUDIO_ROOT=/path/to/AhaMaths npm run sync
//
// What it pushes (here → Studio):
//   engine/*        → <studio>/engine/
//   visualizers/*   → <studio>/visualizers/
//
// What it does NOT touch (Studio-owned):
//   • shorts/NNN-slug/short.config.js  — per-short PRODUCTION config (seed/params,
//     plus beats timed to the voiceover, intro/outro). Edit those in the Studio.
//   • the Studio's app/, render/, scripts/, node_modules/, shorts/*/out.
//   • sims/*.config.js here are LOCAL PREVIEW configs only — never pushed.
//
// The copy is additive-overwrite: files present here overwrite the Studio's copies,
// but Studio-only files (e.g. a visualizer scaffolded there) are left in place, not
// deleted. To make the website authoritative for such a file, copy it here first.

import { cpSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const WEBSITE_ROOT = resolve(import.meta.dirname, '..');
const STUDIO_ROOT  = process.env.STUDIO_ROOT || resolve(WEBSITE_ROOT, '..', 'AhaMaths');

if (!existsSync(STUDIO_ROOT)) {
  console.error(`\n✗ Studio not found at: ${STUDIO_ROOT}`);
  console.error(`  Set STUDIO_ROOT=/path/to/AhaMaths and re-run.\n`);
  process.exit(1);
}
if (!existsSync(join(STUDIO_ROOT, 'engine')) || !existsSync(join(STUDIO_ROOT, 'visualizers'))) {
  console.error(`\n✗ ${STUDIO_ROOT} doesn't look like the Studio (no engine/ or visualizers/).\n`);
  process.exit(1);
}

const here = (...p) => join(WEBSITE_ROOT, ...p);
const studio = (...p) => join(STUDIO_ROOT, ...p);

console.log(`\n  Pushing sim code (website → Studio):\n  → ${STUDIO_ROOT}\n`);

// engine/ — the whole dual-mode engine (render + interactive hosts + deps).
cpSync(here('engine'), studio('engine'), { recursive: true });
console.log('  ✓ engine/       → <studio>/engine/');

// visualizers/ — every simulation's draw code.
cpSync(here('visualizers'), studio('visualizers'), { recursive: true });
console.log('  ✓ visualizers/  → <studio>/visualizers/');

const vizCount = readdirSync(here('visualizers')).filter((f) => f.endsWith('.js')).length;
console.log(`\n  Done. ${vizCount} visualizer file(s) + engine synced. The Studio can now render`);
console.log(`  from the exact code you perfected on the web. (Configs stay Studio-owned.)\n`);
