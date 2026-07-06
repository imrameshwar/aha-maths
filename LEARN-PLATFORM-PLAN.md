# Aha Maths — Learn Platform Plan

**"Ganit dekho, khelo, samajho."** — *See it. Play it. Understand it.*

A plan to grow the current Aha Maths website into a structured, bilingual, playful
**learning journey** where anyone — a 5-year-old who can't read yet, or a 100-year-old
who left school 80 years ago — can *feel* mathematics. The only prerequisite is basic
Hindi or English.

> **Author's note (review + decisions).** This doc is written as both the web-design
> spec and the mathematical curriculum spine. Two forks were left to judgement and are
> resolved here: (1) **scalability** → a *data-driven* platform in the existing repo,
> reusing the proven dual-mode p5 engine; a lesson is *data + a sketch*, never a
> hand-authored page. (2) **structure** → a *spiral world-map* with per-lesson difficulty
> tiers, so one path serves all ages at their own depth.

---

## 0. Review of what exists today

**Strengths (keep and build on):**
- A **dual-mode p5.js engine** (`engine/`): the same sketch renders to video *and* runs
  as a live, draggable interactive widget. This is the crown jewel — every lesson's
  "play" beat is free once a visualizer exists.
- **Locked brand + theme tokens** (`engine/theme.js`): navy `#0B0F1A`, cyan `#22D3EE`,
  amber `#FBBF24`, purple `#A78BFA`; Inter + JetBrains Mono. Consistent video ↔ widget.
- **Zero-build, deploy-anywhere** static site. No toolchain to fight.
- Real content to reuse: `area-of-circle`, `pythagoras-theorem` (+ `monte-carlo-pi`,
  `game-of-life` in the Studio backlog).

**Gaps for the new goal (what this plan fixes):**
- Structure is a **flat gallery of Short-companions**, not a learning path. No basic→advanced spine.
- **One language** (English labels, Hinglish voice). No in-page EN/हिंदी switch.
- **One theme** (dark). No light / high-contrast / kid theme; no accessibility controls.
- **Hand-authored HTML per page** — won't scale to hundreds of lessons.
- No progress, no guidance, no "where do I start / where next".
- No pedagogical arc inside a lesson — a Short *shows*; a lesson must *teach from scratch*.

---

## 1. Vision & non-negotiable principles

**The promise:** open any lesson and within 10 seconds you are *touching* the idea, not
reading about it. Understanding arrives through play, not prose.

1. **Concrete before abstract.** Every concept opens with a real, desi story — roti,
   marbles/kanche, money, cricket runs, a tokri of mangoes — *then* the symbol appears.
2. **Show, don't tell.** Interactive-first. Minimal text; big visuals. A pre-reader
   should get the "aha" from motion + audio alone.
3. **Bilingual to the core.** EN ⇄ हिंदी toggles *everything* — UI, lesson copy, and the
   labels *inside* the p5 sketches. Optional Hinglish audio narration (great for
   pre-readers and elders).
4. **One path, many depths.** Each lesson has 🟢 Beginner / 🔵 Explorer / 🟣 Deep tiers.
   The 5-year-old and the grandparent walk the same map; the tier changes the challenge,
   not the topic.
5. **Playful & kind.** Mascot, satisfying micro-animations, confetti on the "aha",
   light streaks/stickers. **No red X, no shame** — wrong answers nudge, never punish.
6. **Radically accessible.** Large tap targets, audio narration, text-size control,
   dyslexia-friendly font option, reduced-motion, full keyboard nav, colorblind-safe
   palettes. (Note: cyan `primary` and green `success` are close in hue — never rely on
   that pair alone to carry meaning.)
7. **No account to start.** Progress lives in `localStorage`. Private, instant, offline-friendly.

**Content gate (borrowed from the channel):** *Can a viewer feel the idea in the first
few seconds of visual?* If not, the lesson isn't ready.

---

## 2. Information architecture (the structure)

```
Home / Hub  ── "Ganit ka Naksha" (the world map) + Continue where you left off
│
├── Learn        the spiral path → Worlds → Lessons        ← the main product
├── Play         free-play sandbox / gallery of interactive sims (reuses widgets)
├── Watch        the YouTube Shorts (today's gallery lives here)
├── Settings ⚙   language · theme · sound · motion · text size   ← top-right icon, everywhere
└── About        who/why, for parents & teachers
```

### The curriculum spine — 8 Worlds, basic → advanced

A coherent K-through-wonder progression. Each World is a cluster of nodes on the map;
each node is a lesson with three depth tiers. Reused existing sims are marked ♻.

| # | World (EN / हिंदी) | Core lessons (start → advance) | Reuse |
|---|---|---|---|
| 1 | **Numbers** · संख्याएँ | What is a number? (counting, 1-to-1) → Zero & place value → The number line → Negative numbers → Compare/order, odd/even → Big numbers | |
| 2 | **Arithmetic** · जोड़-घटाव | Add (combine) → Subtract (take away / distance) → Multiply (repeated add + array/area) → Divide (sharing) → **Why −×−=+** (the number-line flip) | ♻ −×−=+ |
| 3 | **Fractions & Decimals** · टुकड़े | Part of a whole (roti) → Equivalent fractions → Add/compare fractions → Decimals = place value extended → Percentages (discounts/money) | |
| 4 | **Shapes & Space** · आकार | Points, lines, angles → Triangle angles = 180° (tear the corners) → Perimeter & area → **Area of a circle = πr²** → Symmetry → 3D shapes | ♻ area-of-circle |
| 5 | **Patterns & Algebra** · पहेलियाँ | Sequences & patterns → The unknown box (x) → Balancing scales (equations) → **Pythagoras a²+b²=c²** → Reading graphs | ♻ pythagoras |
| 6 | **Measure, Ratio & Proportion** · नाप-तोल | Units & estimation → Ratio (mixing) → Proportion & scaling → Speed = distance ÷ time | |
| 7 | **Data & Chance** · आँकड़े और संयोग | Reading charts → Average (fair share) → Probability (dice) → **Monte-Carlo π** → **Emergence: Game of Life** | ♻ monte-carlo-pi, game-of-life |
| 8 | **The Infinite & Beautiful** · अनंत | Limits (slice smaller forever) → Golden ratio & Fibonacci → Primes → Slopes & areas (calculus intuition) → Stories of π and e | |

**Design intent:** Worlds 1–3 anchor the "everyone shares this" base; 4–7 build power;
World 8 is the *wonder tier* that keeps a curious adult (or a bright kid) hooked. The
map is a spiral, not a wall — later worlds visibly loop back to earlier ideas.

---

## 3. The Lesson template (the scalability + engagement engine)

Every lesson is the **same 5-beat arc** — a shrunk version of the "teach from scratch"
spine (Motivation → Honest problem → Naive struggle → The insight → Payoff). Consistency
means learners always know how to move, and authors always know what to fill in.

| Beat | Name (EN / हिंदी) | What happens |
|---|---|---|
| 1 | **Hook** · कहानी | A real-world question. *"Shaadi mein kitni roti chahiye?"* No math symbols yet. |
| 2 | **Play** · खेलो | The interactive p5 widget + sliders. The learner *does* the thing. |
| 3 | **Aha** · समझो | The reveal. One big visual, one line of text. Confetti / sound. |
| 4 | **Check** · पक्का? | 1–3 playful low-stakes tasks (drag, tap, estimate). Nudges, never shames. |
| 5 | **Connect** · आगे | Where this sits on the map + "Watch the Short" + next node. |

A lesson is authored as **data + a sketch**, never a bespoke page:

```jsonc
// content/lessons/1-01-counting.json
{
  "id": "1-01-counting",
  "world": "numbers",
  "order": 1,
  "tiers": ["beginner", "explorer", "deep"],
  "visualizer": "counting",          // → visualizers/counting.js (dual-mode p5)
  "controls": { "count": { "default": 3, "min": 1, "max": 20, "step": 1 } },
  "i18n": {                          // keys resolved from i18n/en.json + hi.json
    "hook":  "lesson.counting.hook",
    "aha":   "lesson.counting.aha"
  },
  "checks": [ { "type": "tap-count", "answer": 5 } ],
  "watch": "https://youtube.com/shorts/…",
  "next": "1-02-place-value"
}
```

Adding a lesson = write one JSON file + one visualizer + copy strings in two dictionaries.
No HTML, no routing, no layout work. **That is the scale story.**

---

## 4. Features

**Required (your ask), fully specified:**
- **⚙ Settings icon** (top-right, on every screen) opening a panel with:
  - **Language:** `English ⇄ हिंदी` — swaps all UI, lesson copy, *and sketch labels*.
  - **Theme:** Dark (current) · Light · High-contrast · **Playful/Kid** · "match my
    device" (`prefers-color-scheme`). Themes are CSS custom properties on `<html data-theme>`.

**Also required to deliver the promise (recommended, phased):**
- **Sound & haptics** toggle; audio narration per lesson (pre-readers + elders).
- **Motion** toggle (reduced-motion) and **text-size** control; **dyslexia-friendly font** option; **colorblind-safe palette** option.
- **Progress & continue** (localStorage): resume, per-world completion, light streak, sticker/badge on each "aha".
- **The map/Hub**: playful spiral, "start here" for newcomers, search/filter by world & tier.
- **Responsive, mobile-first, touch-first** (most learners are on phones), then **PWA / offline** (installable, low-connectivity friendly).
- **Free-play sandbox** per world; **Watch** integration back to the Shorts.
- **A friendly mascot/guide** that speaks both languages and reacts to the "aha".

---

## 5. Technical approach (scalable, still zero-build)

Keep the deploy-anywhere static site, but make it **data-driven**:

```
AhaMathsWebsite/
├── index.html            ← Hub / world map (the new front door)
├── learn.html            ← lesson runner (renders ANY lesson from its JSON)
├── engine/               ← REUSED as-is (dual-mode p5 + theme tokens)
├── visualizers/          ← REUSED + grows (one sketch per interactive lesson)
├── content/
│   ├── worlds.json       ← the 8 worlds + node graph (drives the map)
│   └── lessons/*.json    ← one file per lesson (the schema in §3)
├── i18n/
│   ├── en.json           ← all English strings
│   └── hi.json           ← all Hindi strings
├── ui/
│   ├── router.js         ← tiny client-side router (?lesson=1-01-counting)
│   ├── i18n.js           ← string lookup + language state
│   ├── theme.js          ← data-theme + tokens + Settings panel
│   ├── progress.js       ← localStorage progress/streak/badges
│   └── lesson.js         ← renders the 5-beat template from lesson JSON
└── styles/               ← theme tokens as CSS custom properties
```

**Why not a framework yet?** Vanilla + data-driven keeps the engine reuse trivial and the
deploy dead-simple, and it *already* scales to a few hundred lessons. **Migration path:**
when authoring friction shows up (~30–50 lessons, or when we want content collections +
built-in i18n while keeping p5 as islands), adopt **Astro** — it stays static-output,
preserves every p5 sketch as an island, and is the modern low-risk step up. React/Next is
the heavier fallback and not recommended unless we add server features (auth, sync).

**i18n rule:** no hardcoded strings anywhere — UI *and* sketch labels pull from the
dictionaries. Verify Devanagari glyph coverage in the fonts (p5 renders missing glyphs as
silent blanks, same gotcha noted for math glyphs).

**Theming rule:** all color/spacing/size are CSS custom properties; a theme is just a set
of token values under `[data-theme="…"]`. The p5 engine already reads colors from
`ctx.theme` — bridge those tokens so widgets recolor with the site.

---

## 6. Roadmap (phased, each with an acceptance test)

- **P0 — Foundations / the shell.** i18n system, theme system + Settings panel, lesson
  JSON schema, router, the 5-beat lesson renderer, responsive shell, progress store.
  *Accept:* one placeholder lesson renders from data, fully, in EN **and** हिंदी, across
  all themes, on a phone.
- **P1 — First World, first lesson end-to-end.** Build **Numbers → "What is a number?
  (Counting)"** through the full template with a new `counting` visualizer + audio.
  Then Zero & Place Value, Number Line, Negatives. *Accept:* a non-reader child and an
  adult can each complete "Counting" using visuals + audio, in both languages.
- **P2 — The Hub / world map.** The playful spiral, "start here", continue, badges, search.
  *Accept:* a first-time visitor lands, understands where to begin, and returns to resume.
- **P3 — Port the existing sims into lessons.** area-of-circle → World 4 (+ World 8 limit
  intuition); pythagoras → World 5; monte-carlo-pi + game-of-life → World 7; −×−=+ →
  World 2. *Accept:* 5+ real lessons live purely from reused visualizers.
- **P4 — Playful & accessibility polish.** Mascot, sound/haptics, PWA/offline, dyslexia
  font, colorblind palette, reduced motion, text size. *Accept:* passes a basic a11y +
  Lighthouse pass; usable offline after first load.
- **P5 — Scale-out & authoring.** Finish Numbers + Arithmetic worlds; contributor/author
  guide; consider the Astro migration; light analytics; wire Watch + email capture.

---

## 7. Where we start (recommendation)

**World 1 · Numbers**, and specifically the flagship lesson **"What is a number?
(Counting & one-to-one correspondence)."**

Why this first:
- **Counting is the one idea literally every human shares** — the perfect proof that the
  5-to-100 promise and the template actually work.
- It's the **most visual** possible concept (put marbles in a tokri, one tap = one
  count), so a pre-reader gets it from motion + audio with zero text.
- It sets up the deepest early "aha" — the *very next* lesson, **Zero & Place Value**,
  reveals *why 9 rolls over to 10*, which genuinely surprises adults too. Hooking a
  grandparent on lesson 2 validates the whole product.

**First two build targets:** `1-01-counting` and `1-02-place-value` — one to prove the
pipeline, one to prove the "wow".

---

## 8. Open inputs before P1 build

- **Public name/handle & domain** for the platform (the `@ahamaths` handle and
  `ahamaths.com` are still placeholders in the current site).
- **Hindi voice**: text-to-speech vs. recorded Hinglish narration for lesson audio.
- **Font**: confirm a single family with full Latin **and** Devanagari coverage (or pair
  Inter + a Devanagari face) so EN/हिंदी look equally intentional.
- **Mascot**: do we design an original character, and does it have a name in both languages?
```
