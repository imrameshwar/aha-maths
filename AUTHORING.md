# Authoring Guide — Aha Maths Learn Platform

How to add a new lesson from scratch. The whole pipeline is data-driven:
one JSON file + one visualizer + strings in two i18n files. No HTML needed.

---

## 1. Lesson ID and world

Lessons are identified as `W-LL-slug` (e.g. `2-03-multiplication`):
- `W` = world order (1-8)
- `LL` = lesson order within that world (01, 02, …)
- `slug` = short kebab-case name

World IDs and their order numbers are in `content/worlds.json`.

---

## 2. Add the lesson JSON

Create `content/lessons/<id>.json`:

```json
{
  "id": "2-03-multiplication",
  "world": "arithmetic",
  "world_order": 2,
  "lesson_order": 3,
  "tiers": ["beginner", "explorer", "deep"],
  "default_tier": "beginner",
  "visualizer": "multiplication",
  "controls": {
    "a": { "type": "range", "min": 1, "max": 9, "default": 3 },
    "b": { "type": "range", "min": 1, "max": 9, "default": 4 }
  },
  "i18n": {
    "title":              "lesson.multiplication.title",
    "subtitle":           "lesson.multiplication.subtitle",
    "hook_title":         "lesson.multiplication.hook.title",
    "hook_body":          "lesson.multiplication.hook.body",
    "play_title":         "lesson.multiplication.play.title",
    "play_instruction":   "lesson.multiplication.play.instruction",
    "aha_title":          "lesson.multiplication.aha.title",
    "aha_body":           "lesson.multiplication.aha.body",
    "check_title":        "lesson.multiplication.check.title",
    "connect_body":       "lesson.multiplication.connect.body",
    "connect_next_label": "lesson.multiplication.connect.next_label"
  },
  "checks": [
    {
      "type": "tap-count",
      "count": 12,
      "i18n": { "prompt": "lesson.multiplication.check_q1.prompt" }
    }
  ],
  "watch_url": null,
  "next": "2-04-division",
  "prev": "2-02-subtraction"
}
```

**Key fields:**
- `visualizer` — must match a file in `visualizers/`
- `controls` — exposed as sliders in the Play beat; synced to the p5 sketch
- `checks` — array of interactive challenges for the Check beat
  - `type: "tap-count"` — user taps `count` items; emoji is 🥭 by default
- `watch_url` — YouTube Shorts URL (null until the Short is published)
- `next` / `prev` — lesson IDs for navigation arrows

---

## 3. Add i18n strings

Add a block to `content/i18n/en.json` under `"lesson"`:

```json
"multiplication": {
  "title":    "What does × really mean?",
  "subtitle": "Repeated addition in disguise",
  "hook": {
    "title": "3 rows of 4 chairs — how many chairs?",
    "body":  "You could count every chair. Or count one row (4) and then hop: 4, 8, 12. That's multiplication — adding the same group over and over. 3 × 4 means 'three lots of 4'."
  },
  "play": {
    "title":       "Count the grid",
    "instruction": "Change the rows and columns with the sliders. Count the dots in the grid."
  },
  "aha": {
    "title": "Multiplication is just fast addition!",
    "body":  "3 × 4 = 4 + 4 + 4 = 12. You could always expand it back into repeated addition. The grid shows why a × b = b × a — it's the same grid rotated 90°."
  },
  "check": { "title": "Let's make sure!" },
  "check_q1": { "prompt": "Tap all 12 dots in the 3×4 grid to count them." },
  "connect": {
    "body":       "Multiplication powers division, fractions, algebra, and calculus. Next: what is division?",
    "next_label": "Next: Division →"
  }
}
```

Then add the same block in Hindi to `content/i18n/hi.json`.

---

## 4. Create the visualizer

Create `visualizers/<name>.js`. All visualizers use the `defineVisualizer` contract:

```js
import { defineVisualizer } from '../engine/visualizer.js';

export default defineVisualizer({
  meta: {
    id:    'multiplication',
    title: 'Multiplication',
  },

  // Total video duration in seconds (also sets p5 loop timing).
  duration: 30,

  // Controls that appear as sliders in interactive (Play beat) mode.
  controls: {
    a: { type: 'range', min: 1, max: 9, default: 3, label: 'Rows' },
    b: { type: 'range', min: 1, max: 9, default: 4, label: 'Cols' },
  },

  // Called once when the sketch is first created.
  setup(ctx) {
    ctx.state.a = ctx.params.a ?? 3;
    ctx.state.b = ctx.params.b ?? 4;
  },

  // Called every frame. t goes 0→1 over `duration` seconds.
  draw(ctx, t) {
    const { p, W, H, state, theme } = ctx;
    const a = Math.round(state.a ?? 3);
    const b = Math.round(state.b ?? 4);

    p.clear();
    p.background(p.color(theme.bg));

    // ... draw your visualizer here ...

    // All colors come from theme:
    //   theme.bg, theme.surface, theme.grid
    //   theme.primary, theme.secondary, theme.accent2
    //   theme.success, theme.danger
    //   theme.textHi, theme.textLo        (camelCase!)
    //   theme.fontSans, theme.fontMono    (NOT fontSansMono)

    // Caption shown below the sketch in the lesson UI.
  },

  // Called every frame in interactive mode — sync live slider params to state.
  update(ctx) {
    ctx.state.a = ctx.params.a ?? 3;
    ctx.state.b = ctx.params.b ?? 4;
  },

  // Text returned here appears as a subtitle below the sketch canvas.
  caption(ctx, t) {
    const a = Math.round(ctx.state.a ?? 3);
    const b = Math.round(ctx.state.b ?? 4);
    return `${a} × ${b} = ${a * b}`;
  },
});
```

**`ctx` object:**
| Field | Type | Description |
|---|---|---|
| `p` | p5 instance | All p5 drawing APIs (`p.circle`, `p.text`, etc.) |
| `W`, `H` | number | Canvas width and height in pixels |
| `state` | object | Mutable per-frame state (initialise in `setup`) |
| `params` | object | Current slider values (read-only in `draw`) |
| `theme` | object | Current CSS theme colours as hex strings |

**Theme fields (all camelCase):**
`bg`, `surface`, `grid`, `primary`, `secondary`, `accent2`, `success`, `danger`, `textHi`, `textLo`, `fontSans`, `fontMono`

---

## 5. Add the lesson to worlds.json (if not already there)

Open `content/worlds.json` and add your lesson ID to the appropriate world's `lessons` array, keeping `"order"` sequential:

```json
{ "id": "2-03-multiplication", "order": 3 }
```

---

## 6. Test the lesson

Navigate to:
```
http://localhost:8080/learn.html?lesson=2-03-multiplication
```

Work through all 5 beats:
- **Hook** — story text and illustration display correctly
- **Play** — p5 sketch mounts, sliders work, caption updates
- **Aha!** — 🦉 mascot appears, text is clear
- **Check** — tap interaction reaches success state
- **Connect** — next/prev links navigate correctly

Test in both `en` and `hi` languages (⚙ → Language) and in all 5 themes.

---

## 7. Checklist

- [ ] `content/lessons/<id>.json` created
- [ ] `content/i18n/en.json` — all lesson string keys added
- [ ] `content/i18n/hi.json` — all lesson string keys translated
- [ ] `visualizers/<name>.js` created (or reused existing)
- [ ] `content/worlds.json` — lesson appears in correct world array
- [ ] `sw.js` SHELL array — add lesson JSON and visualizer paths for offline caching
- [ ] All 5 beats tested in EN + HI + all themes
