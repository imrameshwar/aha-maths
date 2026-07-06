# Aha Maths — Premium Design Plan

*A design review + a phased plan to take the site from "competent and clean" to
"premium and unforgettable" — without breaking the zero-build, data-driven, dual-mode-engine
foundation that already works.*

Companion to `LEARN-PLATFORM-PLAN.md` (that doc = product/curriculum spine; this doc = the
visual / craft layer that sits on top of it).

---

## 0. The one-sentence diagnosis

The site is a **well-built dark developer dashboard** wearing the clothes of a **joyful,
bilingual, 5-to-100 learning brand**. Everything *works*; almost nothing *delights*. Premium
is the distance between those two — and for this brand it is closed by **warmth, depth, light,
motion, and authored (not clip-art) visuals**, not by more hairline borders.

**North star (the reference triangle):**
> **Brilliant.org's craft × 3Blue1Brown's glowing-math atmosphere × Duolingo's warmth & delight.**

Not Linear/Vercel minimalism — that's premium for B2B SaaS and would fight the "khelo, samajho,
mascot, confetti, 5yo-to-100yo" identity. Our premium is *characterful*, not *austere*.

---

## 1. Review — what's strong, what's holding it back

### Strengths (keep, build on)
- **Solid token discipline already exists** — dark/light/high-contrast/kid/colorblind themes as
  CSS custom properties (`styles/learn.css`), a11y (text-size, dyslexia font, reduced-motion,
  skip-link), premium fonts bundled (Plus Jakarta Sans + Mukta for हिंदी). Great bones.
- **The dual-mode p5 engine** is the crown jewel and is *under-used on the marketing surface* —
  the brand literally is "math you watch," yet the homepage shows zero live math.
- **Charming content voice** — "Shaadi mein kitni roti chahiye?", the 5-beat arc, the story mode.
- **Correct information architecture** — hero → continue → featured story → world map → play → email.

### What reads as "not premium" (the fixable gaps)
1. **Flat, single-plane world.** Pure `#0B0F1A` everywhere + 1px hairline borders. No depth, no
   light source, no atmosphere. This is the #1 tell.
2. **No living visual anywhere on the landing page.** Text-on-navy hero. The product never
   demonstrates itself. (We ship p5 — this is a layup we're not taking.)
3. **Commodity components.** Every hover is `border-color + translateY(-2px)`; every button is a
   flat fill with `opacity: 0.88`. Competent, generic, forgettable.
4. **Emoji as brand visuals.** 🍞 in the lesson hook, 🔢➕🍕 as the eight world icons, 🦉 as the
   mascot. Emoji render differently on every OS and instantly cheapen a premium surface.
5. **Thin type hierarchy.** Hero maxes at 56px/800 with default tracking — safe, not commanding.
6. **Accent colors are decoration, not a system.** Cyan/amber are sprinkled; the 8 gorgeous world
   colors are wasted on a 3px stripe instead of driving the whole card's mood.
7. **The footer says "Made with p5.js."** Developer artifact, not a brand.
8. **No OG share image** (`og:image` is unset) — every share renders as a blank card.
9. **Spacing has no rhythm** — awkward large vertical gaps between sections.
10. **The ⚙ settings/theme/lang switcher is plain pill rows** — the one place users touch the
    "premium" promise most, and it looks like a debug menu.

---

## 2. The design-system foundation (do this first — everything rides on it)

Create **`styles/tokens.css`** as the single source of truth, imported before everything. Today's
tokens are ~6 values; premium needs a full, intentional scale. This is low-risk, high-leverage:
it makes every later change *cohere*.

**Color — from flat accents to a semantic scale**
- Keep the brand hues (navy / cyan `#22D3EE` / amber `#FBBF24` / purple `#A78BFA` / green) but add
  `-soft` (wash), `-glow` (shadow), and `-strong` variants for each, so usage is consistent.
- Replace pure-flat backgrounds with a **2-stop base gradient** (`#0B0F1A → #0D1220`) so the page has sky.
- Define the **8 world colors as first-class duotone pairs** (base + soft-radial), not lone hex stripes.

**Elevation — replace hairlines with light**
- A 4-step shadow scale (`--elev-1..4`): soft, layered, low-opacity ambient shadows.
- A **top inner-highlight** convention on cards (`box-shadow: inset 0 1px 0 rgba(255,255,255,.06)`)
  so surfaces read as *lit from above* instead of *outlined*.

**Type scale** — `--fs-display / h1 / h2 / h3 / body / caption / mono`, each with tuned tracking
(tighter on display, looser on caps eyebrows), `font-feature-settings` for ligatures + tabular-nums
(honours the existing [[numeric-readouts-monospace]] rule).

**Spacing** — an 8pt scale (`--sp-1..12`) and **standard section padding** to fix the rhythm gaps.

**Radius / blur / z-index / motion** — radius scale (`8/12/16/24/full`), a blur token for glass,
a z-index ladder, and a **motion set**: `--ease-spring: cubic-bezier(.34,1.56,.64,1)`,
`--ease-out: cubic-bezier(.16,1,.3,1)`, plus duration tokens. (They already spring the mascot —
systematize it so *everything* moves with the same personality.)

*Acceptance:* one `tokens.css` imported everywhere; `style.css` / `hub.css` / `learn.css` reference
only tokens (no raw hex). No visual regression yet — just the substrate.

---

## 3. Atmosphere & depth pass (the biggest visible jump for the least effort — pure CSS)

1. **Layered background.** Behind the hero: two very-low-opacity radial glows (cyan top-left,
   purple bottom-right, ~8–12%), a faint mathematical **dot/grid texture**, and a **2–3% grain**
   overlay to kill gradient banding on dark. The page gains a "night-sky lab" mood.
2. **Elevation on every card** (world cards, sim cards, story feature, email, beat cards): swap the
   1px border for `--elev-2` + top inner-highlight; border becomes a faint accent, not the structure.
3. **Gradient + glow on the hero keyword** — "aha moment" gets a cyan→teal (or cyan→violet)
   text-gradient with a soft glow, the 3b1b signature. Used *sparingly* (hero + big lesson numbers only).
4. **World cards go duotone.** Each card carries a soft radial wash in its own world color; on hover
   the wash blooms and a world-colored glow lifts it. The map turns from a grey grid into 8 moods.
5. **Refined buttons.** Gradient fill + inset highlight + soft glow + real press (`scale .97`) +
   the `→` nudges on hover + a beautiful `:focus-visible` ring. One `.btn` system, three variants.

*Acceptance:* side-by-side, the homepage reads "crafted product," not "starter template" — with
zero new content and no JS.

---

## 4. Hero & landing narrative (sell the transformation, show the product)

- **Ambient hero canvas** — a slow, low-contrast, *living* p5 sketch behind the hero (drifting number
  lattice → resolving into a spiral / a breathing curve). This is the single most on-brand premium
  move: "math you watch," proven in the first second. Must pause offscreen/backgrounded, cap DPR,
  and respect `prefers-reduced-motion` (fall back to a static gradient) — all gotchas you already
  solved in the story engine.
- **"See it · Play it · Understand it" showcase strip** — three small *live/looping* mini-demos
  pulled from `visualizers/` right on the landing page. Brilliant.org's whole conversion engine is
  "let them touch it before signup." We already own the widgets; wire three in.
- **"For every age" band** — a warm three-up (a 5-year-old counting, a student, a grandparent)
  making the 5-to-100 promise human and visible instead of a tagline.
- **Credibility slot** — designed placeholder for `@ahamaths` subscriber proof / a quote / "as seen
  on YouTube," so the page has social proof the moment it exists.
- **Rebuild the footer** — brand mark + tagline, nav columns, a mini language/theme toggle, socials,
  © line. Kill "Made with p5.js."
- **Ship an OG share image** (`og:image`) + a real favicon set. Table-stakes for a premium share.

*Acceptance:* a first-time visitor sees living math above the fold, can touch a demo without leaving,
understands *who it's for*, and a shared link renders a branded card.

---

## 5. Brand identity & authored visuals (retire the emoji)

- **Logomark + wordmark.** Evolve the flat "AM" square into an ownable mark — a glowing "aha" spark /
  dot-to-number motif / stylised `∴`, with a subtle gradient + glow. Small effort, big identity lift.
- **Custom 8-world icon set** (SVG, duotone, each in its world color) replacing 🔢➕🍕🔺🔣📏📊∞.
  These icons are the visual anchors of the entire map — the highest-ROI illustration investment.
- **An illustration language** for lesson hooks — replace 🍞-style emoji with authored vector spots
  (or reuse p5 for the hook visual too), so every picture looks *made for Aha Maths*.
- **The mascot** ("Ganita" the owl, currently 🦉). Design a real character with 2–3 poses/reactions
  (idle, "aha!", cheer). It's simultaneously brand, warmth, and the delight the plan already calls for.

*Note:* items here need design/illustration resources (or a generation pass) — flagged as the one
non-CSS dependency. Icons + logomark first; mascot + full illustration set can follow.

---

## 6. Motion & micro-interactions (tactility = premium)

- **Scroll-reveal**: sections/cards fade-and-rise on first view (IntersectionObserver, one shared
  util, gated on reduced-motion). Single biggest "feels expensive" upgrade after depth.
- **Spring hovers** on cards/buttons via the motion tokens; cards get an optional pointer-tracked
  spotlight/tilt on the feature + showcase cards.
- **Counters/number reveals** animate (tabular-nums, honouring [[numeric-readouts-monospace]]).
- **Delight on the marketing surface** — the featured-story digits already pulse (good); let world
  cards subtly breathe, and carry the lessons' confetti/sound vocabulary onto the "aha" of a demo.

*Acceptance:* nothing snaps; every state change eases; reduced-motion users get instant, static UI.

---

## 7. Theming polish — 4 themes exist, make each feel intentional

- **Light** isn't inverted dark: warmer whites, real soft shadows (not 1px greys), tuned glow→wash.
- **Kid** gets bigger radii + tap targets + bouncier motion, not just a palette swap.
- **High-contrast / colorblind** verified against the depth/glow layer (glows must never *carry*
  meaning — the plan already flags the cyan/green hue clash).
- **A premium switcher UI** — turn the plain ⚙ pill rows into a beautiful segmented control with
  live swatch previews for theme + a crisp EN/हिं toggle. This is where users *feel* the polish.

*Acceptance:* switch through all themes on mobile + desktop with no broken contrast, no lost depth,
and a switcher that itself looks premium.

---

## 8. The details that quietly signal "premium"

Custom text-selection color · custom thin scrollbar · beautiful `:focus-visible` rings · caret color ·
shimmer-sweep skeletons (upgrade the existing ones) · branded 404 + offline pages · intentional
first-visit/empty states · consistent iconography (no mixed emoji + SVG). Individually tiny;
collectively they're the difference.

---

## 9. Roadmap (phased, each with an acceptance test)

| Phase | Scope | Effort | Payoff |
|---|---|---|---|
| **P0 · Tokens** | `tokens.css`: color scale, elevation, type scale, spacing, radius, motion. Refactor existing CSS to reference it. | S | Substrate for everything |
| **P1 · Atmosphere** | Layered bg + grain, elevation on all cards, gradient/glow hero text, duotone world cards, one `.btn` system. Pure CSS. | M | **Biggest visible jump** |
| **P2 · Hero & landing** | Ambient p5 hero canvas, live showcase strip, "for every age", new footer, OG image + favicons. | M–L | Sells the product |
| **P3 · Brand & icons** | Logomark, custom 8-world SVG icons, hook illustration language, mascot. *(design dependency)* | M–L | Ownable identity |
| **P4 · Motion** | Scroll-reveal util, spring hovers, spotlight/tilt, counters. | M | "Feels expensive" |
| **P5 · Theming polish** | Per-theme depth, premium settings/lang switcher UI. | M | Polish users touch |
| **P6 · Lesson & story polish** | Apply the system to `learn.html` runner + story pages; replace emoji hooks with authored visuals. | M | Consistency end-to-end |
| **P7 · Cinematic layer** | Higgsfield + Remotion asset pipeline: ultra Story-of-Numbers cut, hero/section b-roll, 8 world covers, OG/promo. *(§12 — heaviest dependency, do LAST / in parallel)* | L | The "ultra" ceiling |

**Recommended start:** **P0 → P1 in one pass.** They're almost entirely CSS/token work, carry zero
content risk, and deliver the largest perceived-quality leap. P2's ambient canvas is the marquee
follow-up.

---

## 10. Quick wins (ship this week, high impact / low effort)

1. Base background gradient + 2–3% grain overlay (kills the "flat" feel instantly).
2. Elevation + top-highlight on cards (retire hairline borders).
3. Gradient + glow on the hero keyword.
4. Duotone world-color washes on the map cards.
5. One real `.btn` system with press state + focus ring.
6. Bigger, tighter hero type (clamp to ~84px, `letter-spacing: -0.02em`, `line-height: 1.05`).
7. Rebuild the footer + add an OG image.

Seven CSS-mostly changes that move the needle from "clean template" to "premium product."

---

## 11. Open inputs (decisions that unblock the visual work)

- **Brand direction confirm:** warm/playful-premium (Duolingo × Brilliant × 3b1b) — assumed here as
  the fit; confirm before P3.
- **Illustration resourcing:** commission vs AI-generate the world icons, mascot, and hook art
  (this is the only non-CSS dependency in the plan).
- **Ambient hero canvas:** OK to add a lightweight p5 sketch to the landing page (perf-capped,
  reduced-motion-safe)?
- **Real handle/domain + OG copy** (still placeholders `@ahamaths` / `ahamaths.com`) for the share card.
- **Cinematic layer scope (§12):** confirm budget/appetite for a Higgsfield + Remotion asset pipeline,
  and agree the hard rule — *AI carries mood only, never the math or any text.*

---

## 12. The Cinematic Layer — Higgsfield + Remotion (the "ultra" version)

*Added per the "make magic with Higgsfield images + Remotion" idea. Reviewed honestly below:
it is a genuine premium ceiling-raiser — **as a scoped cinematic layer, not a replacement** for
the interactive engine.*

### 12.1 Verdict
**Yes, but confined.** Generative cinematic visuals (Higgsfield **Soul** for stills, **DoP/video**
for motion) + **Remotion** as the compositor are a real "ultra" lever for **atmosphere, story,
world-art, and marketing** — while the **interactive learning core stays p5** and **AI never
carries the mathematical content or any text.** Get that boundary right and it's magic; blur it and
it quietly destroys a *maths* brand's credibility.

### 12.2 The three non-negotiable guardrails
1. **AI carries mood, code carries truth.** AI models are unreliable at digits, symbols, geometry,
   counts, and Devanagari. Never let a generated frame *be* the number line, the πr² slices, a count,
   or a diagram. Those are always rendered by code/p5 on top. → the **"accuracy sandwich"** (§12.4).
2. **Interactivity stays p5.** The pedagogy is *touch, drag, play*. AI is watch-only; it augments the
   **Story/cinematic** and **marketing** surfaces, not the lessons.
3. **Weight is the enemy of this audience.** Mobile-first, low-connectivity, offline-PWA. Every
   cinematic asset: short loop (≤6–8s), poster frame, AV1/H.265 + WebP/AVIF stills, lazy-load, and
   gated on `prefers-reduced-motion` + `Save-Data`. p5 stays the lightweight default; cinematic is
   the *enhancement*, never the blocker.

Plus two brand rules: **no baked-in text** (localise EN/हिं in HTML/p5, never in the image — matches
the existing "English-on-canvas, Hindi-via-HTML" decision), and **Studio-sync isolation** (cinematic
assets live website-only, like the `story/` folder decision — they must never pollge the Studio render sync).

### 12.3 Where it's a genuine win (ranked)
1. **Ultra "Story of Numbers" (cinematic cut).** The best fit by far — narrative, emotional,
   watch-only. Higgsfield scene art (shepherd, tally bones, clay tablets, Roman struggle, the cosmos)
   → Remotion composites narration + captions + transitions → a cinematic MP4. Keep the *interactive*
   `numbers-story.html` as the primary; this becomes the premium "watch the cinematic cut" companion
   (that link already exists — this makes it worth clicking).
2. **Hero ambient + section backdrops.** A cinematic "night-sky math lab" loop behind the hero /
   section dividers — the atmosphere layer from §3/§4, elevated. (p5 ambient remains the fallback.)
3. **8 world cover-arts + OG/share image + a 20–30s promo trailer.** High-craft marketing surfaces,
   each in its locked world palette.
4. **Mascot & hook-illustration base.** Concept art to retire the emoji (§5) — AI as the *starting
   point*, then redrawn/vectorised for consistency and correctness.

### 12.4 The technical spine — the "accuracy sandwich" + pipeline
**Every cinematic asset = three layers, back to front:**
`AI cinematic b-roll (mood)` → `code/p5 render (the real math + diagrams)` → `HTML/Remotion text
(bilingual captions, labels)`. The middle and top layers are always authored, so the math and words
are always correct and localisable; only the *backdrop* is generative.

**Asset pipeline (still deploy-anywhere static output):**
```
Higgsfield (Soul stills / DoP video)         ← generate cinematic b-roll to a locked style board
      → curate + style-lock (navy/cyan/amber/purple tokens; heavy rejection pass)
      → Remotion  ← compositor: layer p5/code math + captions + transitions; export
      → optimise (ffmpeg: ≤8s loops, AV1/H.265 + poster; WebP/AVIF stills)
      → /assets/cine/  ← website-only; lazy + reduced-motion + Save-Data gated
```
Remotion is already in your toolchain (the longform/Remotion pivot), so this reuses known tech — it
becomes the bridge that guarantees the math/text overlay is pixel-accurate on top of the AI mood.

### 12.5 Roadmap placement
Slot as **P7 — do it LAST or in parallel**, never before P0–P1. Reasons: it's the heaviest
dependency (generation cost, curation time, asset weight), and P0–P1's pure-CSS depth pass already
delivers most of the perceived-premium jump at near-zero risk. Prove the "ultra Story of Numbers"
cut first as the flagship pilot; if it lands, extend to hero b-roll and world covers.

*Acceptance:* the cinematic Story cut plays as an optimised, poster-backed, reduced-motion-safe asset
where **every number, symbol, and word on screen is code-rendered and correct**, the AI supplies only
the backdrop, mobile LCP stays within budget, and nothing generative leaks into the Studio sync.
