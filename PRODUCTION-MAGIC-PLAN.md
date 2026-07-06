# Aha Maths — Production & Magic Plan

*A senior design/production review of the site as it stands today (post P0–P2 of
`PREMIUM-DESIGN-PLAN.md`), split into two halves:*

- **Part A — Production-ready:** everything that must be true before real traffic hits the site.
- **Part B — The Magic layer:** the Higgsfield-powered interactive + cinematic upgrades that move
  the reaction from *"nice site"* to *"how is this free?"* — headlined by the **Count-Quest**
  (tap-and-count generated scenes) idea.

Companions: `LEARN-PLATFORM-PLAN.md` (curriculum spine) · `PREMIUM-DESIGN-PLAN.md` (visual system).
This doc supersedes neither; it is the **launch checklist + the next ceiling**.

---

## 0. Review verdict (live review, desktop + mobile, 2026-07-04)

**What has landed and works** — the P0–P2 pass genuinely transformed the site:
glow hero with ambient p5 canvas, tokens.css driving everything, duotone world cards with
**custom SVG icons** (emoji retired on the map), elevation instead of hairlines, showcase strip,
"for every age" band, rebuilt footer, scroll-reveal, OG/mascot/icon SVGs, settings panel,
5-beat lesson runner with a working `tap-count` check, the interactive Story of Numbers, and a
P7 "accuracy sandwich" prototype on `cinema.html`. The bones are now *premium*.

**What the live review caught** (these drove Part A — status as of 2026-07-05):

1. ✅ **FIXED — Mobile header was broken.** At 375px the nav overflowed — the "Learn" pill clipped
   off the right edge. Now a hamburger (`ui/nav.js`) collapses `.site-nav` below 720px; settings ⚙
   stays visible alongside it. Verified at 320/375px.
2. 🔴 **Email capture still posts to `REPLACE_WITH_FORM_ID`.** Needs a real Formspree/Buttondown
   account — the one item in this list that only the account owner can complete.
3. ✅ **FIXED — `og:image` now a real PNG.** Rendered via headless Chrome (1200×630), referenced
   in `og:image`/`twitter:image` with width/height.
4. ✅ **FIXED — Homepage is now bilingual.** Full `initI18n/initTheme/initSettings/initAccessibility`
   mounted; 65-key `home` i18n namespace covers nav/hero/showcase/world-map/footer. `ui/hub.js`'s
   `initHub(lang)` already supported Hindi — it just needed to stop being hardcoded to `'en'`.
5. ✅ **FIXED — p5.js deferred.** Lazy-loaded via `requestIdleCallback` after first paint; confirmed
   last in the network waterfall.
6. ✅ **FIXED — unreferenced 976 KB `logo.png` deleted.**
7. ✅ **FIXED — `robots.txt`, data-driven `sitemap.xml` (`npm run sitemap`), branded `404.html`
   (division-by-zero joke + mascot), and a dependency-free `offline.html` wired into `sw.js`'s
   fetch handler.** Domain/handle still say placeholder `ahamaths.com`/`@ahamaths` — pending the
   account owner confirming the real ones.
8. ✅ **FIXED — content cliff handled, not papered over.** `content/lessons/index.json` is now the
   single source of truth for what's actually playable; world cards route "Start" to the first
   *available* lesson (never a 404) and lock worlds with zero content; the Connect beat's "Next"
   link only renders if the target lesson exists, otherwise a "coming soon" pill + real map link;
   a warm mascot empty-state replaced the generic red error box for unresolvable lesson ids.
9. 🟡 Emoji still carry meaning in the header nav (✨🎬📚), age chips (🧒🎓👵), sim hooks (🍕🤯)
   and the story mascot (🦉) — the last "cheap" tell on otherwise authored surfaces.
10. 🟡 `index.html` lacks the skip-link; keyboard/aria pass not yet done end-to-end on the story
    scenes; counters don't announce via `aria-live`.

---

## Part A — Production-ready

### A1. Launch blockers (do first, ~1–2 days total)

| # | Fix | Notes |
|---|---|---|
| 1 | **Mobile nav** | Collapse header at <640px: logo + hamburger (or logo + single "Menu" sheet). Kill the emoji labels; use the world-icon SVG style. Test 320/375/414 px. |
| 2 | **Real form endpoint** | Create the Formspree/Buttondown form, paste the ID, add an error state (currently only the button text changes). Add a honeypot field. |
| 3 | **OG image as PNG** | Export `assets/og-image.svg` → `og-image.png` 1200×630 (the SVG can stay as the master). Add `og:image:width/height`, `twitter:image` same PNG. *(This is also Higgsfield job #1 — see B4 — but ship a code-rendered PNG now.)* |
| 4 | **Homepage i18n + settings** | Mount `initI18n` + `initSettings` (+ the EN/हिं toggle that story pages already have) on `index.html`; add `data-i18n` keys for hero/sections. The brand's #1 differentiator must be visible on the front door. |
| 5 | **Defer p5 on the homepage** | `<script src="lib/p5.min.js" defer>` + init the ambient canvas on `requestIdleCallback` (or IntersectionObserver on the hero) with a static gradient until then. Also: serve a slimmed p5 build if feasible; the ambient sketch uses a fraction of the API. |
| 6 | **Delete `logo.png`** | 976 KB, unreferenced. |
| 7 | **Content cliff handling** | Lessons that don't exist yet must render as "🔜 coming soon" *inside the world card* (greyed rows), and `learn.html` must show a designed "this lesson is being drawn" state (mascot + notify CTA + link back to map), not the error box. |

### A2. Launch checklist (the unglamorous 20%)

- **SEO/meta:** `robots.txt` ✅, `sitemap.xml` ✅, **handle confirmed** (`@AhaMathsOfficial`, applied
  site-wide) ✅, **JSON-LD** ✅ (`Organization` on home; `LearningResource` on `learn.html`, refined
  per-lesson by `ui/lesson.js`; story/sim pages already had theirs), **`apple-touch-icon` 180×180 + PNG
  favicon (16/32) + PWA 192/512 icons** ✅ (rasterised from the new `assets/logo-mark.svg`, wired into
  every page head + `manifest.json`). 🔴 Still pending: **web domain** (handle ≠ domain; OG/canonical
  still use the `ahamaths.com` placeholder).
- ✅ **Error surfaces — DONE.** Branded `404.html` (division-by-zero joke + mascot + full nav),
  dependency-free `offline.html` wired into `sw.js` as the navigation-fetch fallback, and a warm
  `.lesson-empty` mascot state (A1.7) replacing the generic error box.
- 🟡 **Service worker discipline — partially done.** Cache name is still hand-bumped (now `am-v27`)
  but each round of fixes in this doc has bumped it correctly and precached every new file; a
  build-stamp/hash-based automation is still a nice-to-have, not a blocker at this size.
- 🔲 **Analytics + monitoring — not wired.** Recommended: GoatCounter (free, no credit card, no
  cookies) over Plausible (paid-only) for this stage. Deliberately NOT stubbing in a placeholder
  script tag across every page — unlike the email form's single placeholder, enabling analytics
  is a product/privacy decision the account owner should make, not one to pre-wire silently.
  `privacy.html` already has a forward-looking "if enabled" disclosure ready for it.
- ✅ **Performance budget — the fixable-without-a-server-round-trip half DONE.** Measured via
  `performance.getEntriesByType('resource')`: the homepage was shipping **2.5 MB of raw TTF
  fonts** — bigger than the deferred p5 bundle it replaced as the #1 offender. Converted all 6
  fonts to WOFF2 (`woff2_compress`), kept the `.ttf` as a same-origin fallback in `@font-face`'s
  `src` list. Result: **non-deferred page weight dropped from 1716 KB → 672 KB (61% smaller)**,
  zero visual risk (WOFF2 has >97% global support and is a pure format swap). `sw.js`'s precache
  list updated to match (WOFF2 in, unused TTF precache entries out — same scope as before, not
  expanded). Remaining weight is dominated by 3 Mukta (Devanagari) files (~420 KB combined) that
  load on every visit because Hindi glyphs (हिंदी) appear in the DOM immediately even in English
  mode — a further win (subsetting or lazy-loading Mukta until हिंदी is actually toggled) needs
  `fonttools`/`pyftsubset`, not installed in this environment; flagged, not done. No formal
  Lighthouse/CI run yet.
- ✅ **Accessibility pass — DONE, including the contrast audit.** Skip-link added to every page
  (`index`, `learn`, `404`, `cinema`, `numbers-story`, `story-of-numbers`, `privacy`),
  `aria-live="polite"` on the lesson tap-counter and check-success state, and — the harder one —
  **keyboard alternatives added to the two drag-only Story of Numbers scenes** (place-value: a
  "Move digit left →" button; the zero scene: a "Drop zero into place" button), reusing the
  existing `controls`/`onControl` HTML-button mechanism so they're natively focusable/keyboard-
  operable, verified end-to-end. **WCAG AA contrast audit run across all 5 themes** (a script
  computing real contrast ratios for every text/background pair, not eyeballed) — caught a
  genuine, serious bug: **the Kid theme's accent colors (primary/secondary/success/danger/
  accent2) measured 1.7–3.0:1 against its background, failing AA (4.5:1) badly, used as direct
  text color in 54 places site-wide** — the worst possible theme for this to be broken in, given
  the audience is 5-year-olds. Fixed by deepening each color within its same hue family until it
  clears ~4.6:1 (script-verified, not guessed), then updating `ui/settings.js`'s hardcoded swatch
  preview to match so the picker doesn't lie about the theme. Also nudged the Color-safe theme's
  accent2/danger (were 3.7:1/4.1:1 — "large text only") up to 4.6:1+ for small text too. Verified
  visually: Kid theme still reads warm/playful (burnt-orange/marigold/periwinkle), not muddy.
  NOT done: full keyboard walk of the other 10 story scenes (most are already click/tap buttons,
  not drag, so lower risk).
- 🔲 **Cross-browser ritual** — not run (iOS Safari / Android WebView / Firefox pass still open).
- ✅ **Legal/trust — DONE.** `privacy.html` — a short, honest, accurate page listing every
  localStorage key the site actually uses (verified by grepping the codebase, not guessed),
  the email-form third-party disclosure, a forward-looking analytics note, and a contact
  placeholder. Linked from the homepage footer.

### A3. Content minimum for launch

Don't launch the 8-world map with 1 playable world — launch **"World 1 complete + Story"** and
frame the rest honestly:

- Finish the 4 Numbers lessons (3 exist; audit `1-04-negatives`) **+ 2-01 addition** so
  "next lesson" from world 1 doesn't dead-end.
- Worlds 3–8 cards get a "notify me" micro-CTA instead of a dead Start button.
- The Story of Numbers is the flagship — put it above the world map on mobile.

---

## Part B — The Magic layer (Higgsfield + engine)

> **The one rule that keeps this brand credible** (carried from `PREMIUM-DESIGN-PLAN.md` §12):
> **AI carries mood, code carries truth.** No generated pixel ever *is* the number, the count,
> the diagram, or the Devanagari. With Count-Quest we extend the rule to interactivity:
> **AI paints the scene, a human curates the truth, code runs the game.**

### B1. ⭐ Count-Quest — the tap-and-count game (the user's idea, productionised)

**The idea:** Higgsfield generates a warm, story-book scene — *a Rajasthani courtyard with cats
sleeping on charpais, a mango tree with fruit hiding among leaves, a wedding kitchen with stacks
of rotis* — and the child **taps each object to count it**. Every tap: the object glows, a
counter ticks up in mono type, a soft "pop" plays. Find them all → confetti + the mascot's "aha!"
This turns the existing abstract `tap-count` check (grey dots on navy) into the single most
magical thing on the site — and it's *exactly* the right use of generative AI, because the scene
is mood and the math is curated metadata.

**Why it works pedagogically:** counting *real-world-ish* objects in a scene is one-to-one
correspondence — the actual learning goal of lesson 1-01 — plus visual search (attention), plus
"math lives in *your* world" (courtyards, mangoes, rotis — not clip-art apples).

**Architecture — the "curated hotspot" pattern:**

```
Higgsfield Soul (still, 2048px, locked style board)
   → generate 6–10 candidates per scene brief
   → CURATION GATE (human): pick frames where every target object is
     fully visible, unambiguous, countable; reject merged/half objects
   → Hotspot Author tool (tiny local HTML page, ~150 lines):
     load image → click each object → drag its radius → export JSON
   → /content/scenes/<id>.json  +  /assets/scenes/<id>.avif|webp (+ blur-up poster)
   → runtime: new check/play type "scene-count" in lesson.js
```

```jsonc
// content/scenes/courtyard-cats.json
{
  "id": "courtyard-cats",
  "image": "assets/scenes/courtyard-cats",   // .avif + .webp + poster
  "object_i18n": "scene.cats.object",         // "cats" / "बिल्लियाँ"
  "count": 7,                                  // human-verified, twice
  "hotspots": [ { "x": 0.31, "y": 0.62, "r": 0.05 }, ... ],
  "decoys": [ { "x": 0.8, "y": 0.2, "r": 0.04, "i18n": "scene.cats.decoy_dog" } ],
  "difficulty": 1
}
```

**Runtime rules (all existing engine vocabulary):**
- Tap a hotspot → ring-glow (code-drawn, world-color), counter increments in **mono +
  fixed precision** (per the numeric-readout rule), pop sound, already-found objects stay marked.
- Tap empty space → gentle ripple, no penalty (age 5!). Tap a decoy → mascot giggle
  ("woh kutta hai, billi nahi!").
- Found all → confetti + count reads "7 — saat — seven"; Check beat variant asks the number
  *first* ("Kitni billiyan? Tap your answer: 5 6 7 8") and then lets them verify by tapping.
- Fully offline-able: one AVIF + one JSON per scene (~120–200 KB total each).
- `prefers-reduced-motion`: no glow pulse; `Save-Data`: fall back to the current dot-grid
  version (which stays as the universal fallback — never delete it).

**The difficulty ladder writes itself (and maps to the curriculum):**

| Level | Scene brief | Math |
|---|---|---|
| 1 | 3–7 cats, all obvious | counting (1-01) |
| 2 | mangoes in 3 baskets of 4 | grouping → addition/multiplication (2-01/2-03) |
| 3 | some objects half-hidden *by design* | careful counting, working memory |
| 4 | 12 rotis, 3 eaten — plates with crumbs | subtraction as story (2-02) |
| 5 | cut fruits — "kitne *aadhe*?" | fractions (3-01) |
| 6 | crowd scene, 2 seconds, then hidden | estimation — "andaza lagao" |

**Where it ships (three placements, one system):**
1. **Play beat** of 1-01 counting (replace the grey dots when a scene is available).
2. **Check beat** — the "answer first, verify by tapping" variant.
3. **"Aaj ka Khoj"** (Today's Find) — a standalone daily scene on the homepage/Play Mode with a
   shareable result card ("Maine 7/7 billiyan dhoondhi! 🐈 ahamaths.com/khoj") — this is the
   viral loop; a Web-Share-API card, code-rendered so text is always crisp and bilingual.
   ✅ **SHIPPED (2026-07-05)** — `khoj.html` + `ui/khoj.js` reuse `scene-count.js` + the mango
   scene as-is (swap-ready). Full-screen mobile-first tap-and-count → result card that shares a
   **canvas-rendered 1080×1080 bilingual PNG** (EN + Devanagari via Mukta) through the Web Share
   API, with Save-card / Copy-link fallbacks when `navigator.share` is absent. Deterministic
   scene-of-the-day, Save-Data → dot-grid fallback, reduced-motion aware, keyboard-operable.
   Linked from the homepage (nav pill + invite banner). Remaining M3: aha-payoff unification +
   aha-gems, and more daily scenes as Higgsfield art lands.

**Curation is the whole game — write these into the scene brief:** objects must be *fully
visible, separated, similar scale, count verified by two people* (or one person twice, a day
apart). Ambiguity ("is that a cat or a cushion?") is a bug at levels 1–2 and a *feature* only at
level 3+. Never regenerate an image after hotspots are authored (coords are per-pixel). No text,
no numbers, no fingers-counting hands in any generated frame.

### B2. Higgsfield across the site — ranked placements

| Rank | Surface | What Higgsfield makes | Why it amazes |
|---|---|---|---|
| 1 | **Count-Quest scenes** (B1) | 6–10 interactive scenes | Generative AI you can *touch* — nobody in the maths-ed space has this |
| 2 | **Story of Numbers backdrops** | 12 scene paintings (shepherd & sheep, tally bones, clay tablets, Roman market, the void before zero, Aryabhata's sky) behind the existing interactive stage | The story goes from "dark canvas + emoji owl" to *illustrated storybook* while every interactive element stays p5 |
| 3 | **Cinematic cut b-roll** | The `cinema.html` accuracy-sandwich already has the mood-layer slot waiting for exactly this clip (Higgsfield DoP, ≤8s loops) | Completes P7's flagship |
| 4 | **8 world cover-arts** | One painting per world in its locked palette (numbers = night-sky observatory, fractions = mithai shop…) shown as card-hover reveal / world-page hero | The map becomes 8 *places*, not 8 colors |
| 5 | **Mascot final design** | Character-consistent owl ("Ganita") sheet: idle, aha!, cheer, thinking → **vectorise the winner** and retire 🦉 | Warmth + brand, reused everywhere forever |
| 6 | **Lesson hook spot-art** | One warm illustration per lesson hook (the roti kitchen for 1-01…) | Kills the last emoji, makes every lesson feel authored |
| 7 | **OG/share art + 20–30s trailer** | The share card (B1's Khoj cards + the site-wide og-image) and a launch trailer | Every share looks expensive |

*(2, 3 were already in §12 of the premium plan — Count-Quest jumps the queue to #1 because it's
the only one that is interactive, curricular, AND viral at once.)*

### B3. Engine-side magic (no AI needed, multiplies everything above)

- ✅ **The "aha" payoff moment — SHIPPED (2026-07-05).** `ui/celebrate.js` — one shared burst reused
  by the lesson Aha beat and the Khoj win: full-viewport confetti tinted to the world's colour, a warm
  C-major chord (WebAudio, gated on the sound setting), and `navigator.vibrate(30)`. Reduced-motion
  drops the visual rain (chord + haptic stay). Replaced the old per-card confetti in `ui/lesson.js`.
- ✅ **Aha-gems — SHIPPED (2026-07-05).** `ui/hub.js` `_renderGems` shelves one faceted gem per
  completed lesson in its world's colour on the homepage map (newest glows), derived straight from
  `am-progress` localStorage — no separate store to drift. Gives the map a reason to be revisited.
- **Ambient scene parallax:** Count-Quest & story backdrops get a 2-layer parallax
  (image + code-drawn fireflies/dust in world color) — pointer-tilt on desktop, gyro-free
  scroll-tilt on mobile. Makes stills feel alive for ~0 KB.
- ✅ **Shareable aha-cards — SHIPPED (2026-07-05).** NEW reusable `ui/share-card.js` renders a
  branded, always-bilingual 1080² card ("I learned: <lesson>" / "मैंने सीखा: <lesson>", auto-shrink
  to fit) via the Web Share API with a Save-PNG fallback; wired to a "Share your aha ✨" button on the
  lesson Connect beat. Same code-rendered-truth approach as the Khoj card.

### B4. Higgsfield production pipeline (one pipeline, all seven placements)

```
1. STYLE BOARD (once): 6–8 reference stills locked to brand — warm Rajasthani light,
   storybook-painterly, navy/cyan/amber accents, characters consistent, NO TEXT ANYWHERE.
   Every future prompt cites this board. Reject anything off-palette.
2. GENERATE: Higgsfield Soul for stills (Count-Quest, story, covers, hooks);
   Higgsfield DoP/video for ≤8s cinematic loops. Always 6–10 candidates per asset.
3. CURATE (the human gate): correctness (countable objects), style-lock, no text/digits,
   no uncanny hands/faces. Expect 60–80% rejection on countable scenes — that's normal.
4. AUTHOR TRUTH: hotspot JSON for interactive scenes; caption/timing JSON for story/cinema.
5. OPTIMISE: stills → AVIF+WebP (≤150 KB @ ~1600w) + 20px blur-up poster;
   video → AV1/H.265 ≤8s + poster frame; everything lazy, reduced-motion & Save-Data gated.
6. PLACE: /assets/scenes|story|cine/ — website-only, excluded from Studio sync (existing rule).
```

**Budget note:** the style board + Count-Quest pack of 6 scenes + 12 story backdrops is roughly
100–150 generations after rejections — one focused weekend of generation + curation, then the
hotspot authoring is minutes per scene with the tool.

---

## C. Roadmap

| Phase | Scope | Effort | Gate to next |
|---|---|---|---|
| **L0 · Blockers** | A1 items 1–7 | 1–2 days | Mobile header perfect at 320px; a WhatsApp share shows the card; form delivers email |
| **L1 · Launch checklist** | A2 + A3 (SEO files, SW discipline, analytics, a11y pass, error pages, World-1-complete content) | 3–5 days | Lighthouse ≥90 ×4 on mobile; full keyboard walk of story; no dead-end links |
| **M1 · Count-Quest pilot** | 🟢 **ENGINE + PIPELINE BUILT** (`ui/scene-count.js`, `styles/scene-count.css`, scene JSON schema, `tools/hotspot-author.html`, `scene-count` wired into 1-01's Check beat with dot-grid Save-Data/failure fallback, bilingual, keyboard + reduced-motion). Proven end-to-end with a **hand-drawn placeholder** (`assets/scenes/mango-tree.svg`, 5 mangoes + 1 decoy bird). ⬜ Remaining = swap the placeholder for a curated **Higgsfield** still (re-author hotspots in the tool) + add more scenes (cats, baskets). | Engine done; art gen pending | A 5-year-old counts unaided on a phone ✅ (placeholder); Save-Data gets dots ✅; real Higgsfield art pending |
| **M2 · Story illustrated** | 12 backdrops into `numbers-story.html` + parallax + mascot final (retire 🦉) | ~1 week | Story feels like a storybook; interactives untouched; LCP budget holds |
| **M3 · Khoj + share loop** | 🟢 **DONE** — (a) **Daily Khoj page + share card** (`khoj.html`, `ui/khoj.js`, `styles/khoj.css`; reuses `scene-count.js` + mango scene; canvas-rendered 1080² bilingual PNG via Web Share API + Save/Copy fallback; homepage nav + invite banner). (b) **Unified aha-payoff moment** (`ui/celebrate.js`: full-viewport confetti in the world's colour + warm major chord + `navigator.vibrate(30)`, reduced-motion aware; fires on the lesson Aha beat and the Khoj win — replaced the old in-card confetti). (c) **Aha-gems** (`ui/hub.js` `_renderGems`: one faceted gem per completed lesson in its world colour, shelved on the map, newest glows — derived from progress, no new store). All Save-Data/reduced-motion/keyboard covered. (d) **Daily rotation now has 4 scenes** — `mango-tree` (5), `courtyard-cats` (6, decoy dog), `festival-diyas` (7, decoy flower), `mela-balloons` (6, decoy kite), each a hand-drawn placeholder + swap-ready for Higgsfield art; deterministic scene-of-the-day + `?scene=<id>` override. ⬜ Only remaining = swap the placeholder SVGs for curated Higgsfield stills (art-budget gated). | 3–5 days | A Khoj result shared to WhatsApp renders a crisp bilingual card ✅ (card verified; live share is gesture-gated on a real device) |
| **M4 · Cinematic + covers** | DoP b-roll into cinema.html, 8 world covers, trailer, OG art v2 | parallel/ongoing | The P7 acceptance test from the premium plan |

**This week:** L0 in one sitting (it's a day of real work), start L1, and generate the **style
board** in parallel — it unblocks every Higgsfield placement and costs nothing but curation taste.

---

## D. Open decisions

1. **Domain + handle** — still `ahamaths.com` / `@ahamaths` placeholders; blocks OG, sitemap, SW scope.
2. **Form provider** — Formspree free tier vs Buttondown (doubles as the newsletter engine).
3. **Analytics** — Plausible (paid, polished) vs GoatCounter (free) — either is cookie-banner-free.
4. **Count-Quest art direction** — storybook-painterly (recommended: hides AI artifacts, ages well,
   fits "5 to 100") vs photo-real (riskier: uncanny cats, dated in a year).
5. **Mascot canon** — confirm "Ganita the owl" before M2 locks the character sheet.
