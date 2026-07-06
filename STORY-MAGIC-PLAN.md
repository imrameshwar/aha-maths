# STORY-MAGIC-PLAN — making "The Story of Numbers / संख्याओं की कहानी" the best interactive maths story anywhere

*Written 2026-07-05, after a full code + live review of `numbers-story.html`,
`story/numbers-interactive.js`, `story/numbers-script.js`, `styles/journey.css`.*

**North star:** the player shouldn't *read about* the invention of numbers —
they should **live it**. You stand under the starless sky, YOU are the shepherd
losing a sheep, YOU drop the zero into place, and at the end the story turns and
points at **you** — the newest person in a 10,000-year chain. Nicky-Case-level
"feel it" × Brilliant-level craft × the warmth of a grandparent telling a story.

---

## 1 · Honest review of what exists today

### What is already genuinely strong (rare, keep all of it)
- **The interaction design is on-concept in every scene.** 1:1 sheep↔stone
  matching, tally bundles of five, the Roman-numeral explosion slider, dragging
  a digit across place columns, physically dropping zero into `1_5`, yanking
  zeros out so 105/1005 collapse — each hands-on moment IS the maths idea.
  This is the hardest part and it's done.
- **The dialogue script is good writing**, in both languages. Character beats
  ("But master… how do I multiply them?" / "…Carefully.") land. The interact-gated
  Continue ("👆 Your turn") is the right story-game grammar.
- **Deep plumbing few competitors have:** bilingual EN/हिं with live re-render,
  beat-runner with cue gating, per-scene p5 mounts (resolution-independent),
  procedural WebAudio SFX + ambient, badges + resume + start-over, keyboard
  alternates for both drag scenes, reduced-motion paths, offline/PWA, 0-error.

### The 7 gaps between "competent exhibit" and "magical story"

| # | Gap | Evidence from the live review |
|---|-----|-------------------------------|
| G1 | **No world on stage.** Scenes are diagrams on flat navy. | Shepherd scene = 6 white blob-sheep in empty boxes labelled "the fold"/"the pouch"; no meadow, no hills, no dawn mist, and **the shepherd himself never appears**. The cast exists only as emoji in the bubble below. |
| G2 | **The layout breaks immersion.** Stage and dialogue don't share a viewport. | At 1280×800 you scroll between the sky (canvas) and Ganita's bubble; the page hero (big title + subtitle + chips) permanently eats ~360px. Story ≠ webpage — it needs a theater. |
| G3 | **Robotic voice.** Web-Speech TTS (especially hi-IN voices) is the single loudest "cheap" signal. | A story is 70% voice. The user already records channel VO — that asset is unused here. |
| G4 | **Emoji cast.** 🦉🧑‍🌾📜 avatars, platform-dependent rendering. | Already flagged as deferred in P6; it's the last emoji surface on the site and it's on the flagship. |
| G5 | **No sense of travelling through time.** Scene changes are a fade+sweep; every era looks/sounds the same. | No timeline, no era palette shifts, no era ambience (night crickets → bazaar → scriptorium → cosmos). |
| G6 | **The player is a spectator with tasks, not a character.** | Best-in-class explorables make it *you*. Nothing here knows or reflects the player; the finale honours 6 contributors — and never the 7th one who just relived the whole journey. |
| G7 | **Payoffs are quiet.** Discover = small chime + hidden badge. | `ui/celebrate.js` (confetti+chord+haptic) exists site-wide and is NOT wired here. Completion shelf is nice but static; no share moment (`ui/share-card.js` also unused here). |

### Small concrete nits (fix in passing)
- `Next →` in the outer nav silently skips the whole story with no friction —
  keep it (freedom + a11y) but demote it visually vs the in-bubble Continue.
- Scene-2 headline "Morning — let them out" renders clipped under the sticky
  header right after a scroll-jump.
- On-canvas microcopy ("the fold", "tap to place stars") stays English in हिं
  mode — Mukta is now bundled (`F.deva`), so Hindi-on-canvas is unblocked.
- Scene 11's "1,400,000,000 = a nation of people" dot cloud caps at 220 dots —
  the visual doesn't grow between steps 4→5→6 the way the number does.

---

## 2 · Benchmark — who "best in the market" actually is

| Competitor | What they do better | What WE do better already |
|---|---|---|
| Nicky Case (Parable of the Polygons, Evolution of Trust) | You *feel* the idea in your hands; personality everywhere; one seamless scroll | Bilingual, audio, badges, mobile PWA |
| Brilliant.org | Production polish, micro-feedback on every touch | Real narrative arc, characters, free |
| Bartosz Ciechanowski | Gorgeous layered diagrams, physical depth | Story, characters, voice, Hindi |
| TED-Ed / YouTube history-of-numbers videos | Cinematic art + human VO | INTERACTIVE — they can't gate on "your turn" |
| Duolingo Stories | Character voice acting, hearts/streaks | Real mathematics, hands-on canvas |

**The winning position nobody occupies:** *an interactive, bilingual, voiced,
character-driven playable documentary of a maths idea.* Every phase below buys
a piece of that.

---

## 3 · The plan — 8 phases, each shippable alone, ordered by feel-per-effort

### S0 · STORY THEATER (layout & immersion) — pure CSS/JS, no content change
The single biggest felt jump, like P1 was for the site.
- On **Begin**: the page enters *theater mode* — hero collapses to a one-line
  breadcrumb, site header auto-hides on scroll-down (reappears on scroll-up),
  stage + dialogue locked together in one viewport at every common size
  (stage flex-grows, bubble pinned below it; the 0.54×innerH cap becomes a
  real `dvh`-based layout, not a heuristic).
- **Era timeline ribbon** above the stage: a thin strand from 🦴 40,000 BC →
  💻 today; a glowing marker walks it as scenes advance (this alone fixes half
  of G5). Scene dots merge into it (replaces the current abstract dot row).
- Demote outer `Next/Back` to quiet ghost buttons; in-bubble **Continue** is
  the story's one primary action. Arrow keys unchanged.
- Vignette + soft edge-glow around the stage in theater mode (tokens exist).

### S1 · LIVING SCENES (set-dressing pass on all 12) — p5 only, no new deps
Give every scene a *place*, using layered draw-lib helpers (cheap, reusable):
`skyGradient(era)`, `silhouetteHills()`, `groundPlane()`, `driftMotes()`
(dust/fireflies/embers per era), pointer-parallax (2 background layers shift
1–3% toward the mouse; off under reduced-motion).
- **S1-scene1:** placed stars twinkle-bloom; at discover, the player's own stars
  connect into a faint constellation — *their* sky remembers them (echoed in S5).
- **S1-scene2:** dawn meadow — grass band, hill silhouettes, fold as a wooden pen,
  sheep get ears/legs/waddle (draw-lib `sheep()` upgrade), stones arc when they
  drop into a drawn leather pouch, the lost sheep visibly wanders off-edge.
- **S1-scene4:** clay gets texture (noise-stippled), wedges press in with a
  depth shadow + squash animation, stylus cursor.
- **S1-scene9:** digit wheels become real 3D-feeling drums (vertical strip of
  digits scrolling with easing + overshoot), brass frame.
- **S1-scene11:** fix the dot-count cliff; zoom becomes a continuous eased
  scale-flight (pebble → flock → market → city lights → Earth glow → galaxy
  spiral), not 7 discrete swaps.
- Era palette: each scene tints `C.bg`/glow toward its era (deep night →
  dawn amber → clay ochre → marble → ink indigo → cosmic violet). One shared
  `eraTint(scene)` in draw-lib; captions/chrome stay token-driven.

### S2 · THE CAST COMES ON STAGE (retires G1+G4 together)
- **Authored SVG character set** in the mascot/logo style (geometric, warm,
  2-tone + world colours): Ganita the owl (exists), shepherd, hunter, scribe,
  merchant+apprentice, teacher+student, scholar, trader, astronomer, child,
  geometer. One shared rig: head/body groups, blink every 3–6s, idle bob,
  talk-state (beak/mouth + slight lean), entrance = walk/fade in.
- Characters appear **inside the stage** (HTML/SVG layer positioned over the
  canvas edge, not drawn in p5 — keeps p5 maths-only, matches the accuracy
  sandwich: *art carries mood, code carries maths*).
- The speaking character **lights up and gestures toward the interaction**
  when its beat has `cue:'interact'`; bubble avatars switch from emoji to the
  same SVG heads. Ganita walks the whole journey with you (owl on a branch /
  ledge per era — continuity character).

### S3 · REAL VOICE + ERA SOUND (retires G3, biggest "premium" signal)
- **Per-beat recorded VO**: `assets/vo/numbers/<sceneId>-<beatIdx>-<lang>.mp3`
  + a tiny manifest; beat-runner plays the file when present, falls back to
  the existing Web-Speech narrator otherwise — so VO can land incrementally,
  scene by scene. The user already has a channel VO pipeline (Hinglish); this
  is recording + dropping files, no new infra. (Alt if recording stalls:
  one-time neural TTS render — ElevenLabs/Google WaveNet hi-IN — same files.)
- Word-level or beat-level **caption highlight** while audio plays.
- **Era ambience beds** in audio-fx.js (procedural first: filtered-noise
  crickets for night, wind+bird chirps for dawn, low murmur for bazaar,
  reverberant room tone for scriptorium, deep drone + shimmer for cosmos),
  crossfaded on scene change, ducked under VO. Tiny looped files only if
  procedural falls short; Save-Data + 🔇 respected as today.
- Wire **`celebrate()`** (already site-wide) on every scene discover, tinted
  to the era colour; keep the chime.

### S4 · YOU ARE IN THE STORY (retires G6 — the emotional differentiator)
- Begin overlay asks (optional, skippable): **"What's your name?"** —
  stored in `am-story:numbers`. Beat text supports `{name}` templates:
  the shepherd says "Watch the pouch for me, {name}."
- Scene 1 becomes *your* sky; scene 2 *your* flock ("One of YOUR sheep is
  missing"); the scholar hands the zero **to you** by name.
- **Finale gains a 7th node: YOU.** After lighting the six, a seventh circle
  fades in with the player's name (or "You / आप") — "…and you, {name}, who
  just walked 10,000 years in ten minutes. The question is yours now."
  This is the moment people screenshot.
- Completion wires **`share-card.js`**: bilingual 1080² card — "I lived the
  Story of Numbers — 12/12 ✦ {name}" with their constellation from scene 1
  drawn on it. (Card stays code-rendered → digits/Devanagari always crisp.)

### S5 · MAGIC THREADS (connective tissue + finale spectacle)
- **The pebble motif:** the stone from scene 2 visually recurs — it becomes a
  tally bone's notch, a clay wedge, sits beside the zero tile, and in scene 11
  it's the first thing you zoom out from. One object travelling through time =
  the story's soul.
- **Badge constellation:** earned badges are stars; the completion shelf
  becomes a night sky where the 12 badges connect into "**?**" → morphs into
  "**∞**". (Replaces the static emoji shelf; emoji badges → small SVG marks.)
- Scene-to-scene **match-cut transitions**: pouch-stone morphs into a tally
  mark; MCMXLIV crumbles into the place-value columns; zero drop ripples into
  scene 8's numbers. (Implemented as short handover animations on the incoming
  scene's first 0.8s — no engine rewrite.)

### S6 · हिंदी ON CANVAS + LANGUAGE POLISH
- Mukta is bundled and `F.deva` already exists in draw-lib: pass `lang` into
  scene draws; localize on-canvas microcopy ("the fold" → "बाड़ा", "tap to
  place stars" → "तारे लगाइए", readouts stay numeric/mono). This finally makes
  हिं mode feel native end-to-end, not "Hindi text around an English exhibit."
- Hindi VO = the S3 files (`-hi.mp3`); danda-split fallback already handled.

### S7 · ILLUSTRATED BACKDROP SWAP (gated on generation budget — matches M2)
- The S1 set-dressing layers are structured as **swappable backdrop plates**:
  when Higgsfield art lands (storybook-painterly, per PRODUCTION-MAGIC-PLAN
  art direction), each era's painted still slides under the p5 layer exactly
  like Count-Quest scenes — **accuracy sandwich enforced**: AI paints mood,
  p5 draws every digit/mark, HTML carries text. Weight-gated (≤200KB/plate,
  lazy, poster-first, Save-Data → S1 procedural set stays as fallback).

---

## 4 · Tech decisions (pre-made, so build can start on "go")
- **No framework rewrite.** The per-scene p5 engine + beat-runner survive as-is;
  everything above is layers on top (same strategy that worked for the TOLD-STORY
  upgrade). Anything DOM-animated uses CSS transforms + WAAPI, no GSAP dep.
- **Characters = authored SVG in DOM**, not p5-drawn (crisper, themeable,
  reusable in bubbles/cards, keeps maths canvas pure).
- **VO = static mp3 files + manifest**, graceful fallback to Web Speech —
  no server, works offline once cached, sw precache per scene shipped.
- **All motion honors** `prefers-reduced-motion` + `data-motion`; all audio
  behind the existing 🔊 toggle + Begin gesture; hidden-by-default elements
  get the `[hidden]{display:none}` guard (the recurring gotcha — 5 hits now).
- Order of build = S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7. S0+S1 alone already
  clear the "feels magical" bar; S3 (voice) is the biggest external-effort item
  (recording ~30 min of VO ×2 languages, ~130 beats).

## 5 · Open inputs needed from the user (none block S0–S2)
1. **Voice for S3**: record own Hinglish/Hindi VO (recommended — it's the
   channel's identity) vs one-time neural TTS render?
2. **Name-ask in S4**: OK to ask (optionally) for a first name? (stored only
   in localStorage, privacy.html gets one line).
3. **S7 art budget/timing** — same Higgsfield decision already pending in
   PRODUCTION-MAGIC-PLAN (this plan just consumes it).
