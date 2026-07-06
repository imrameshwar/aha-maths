# Aha Maths — Website (source of truth)

The public website for **Aha Maths** ("Math you watch. Math you play."): a homepage
that lists the simulations, plus one interactive page per simulation — an embedded
YouTube Short on top and the **same p5.js sketch, live and draggable**, below.

This repo is **two things at once**:

1. A **standalone, deployable static site** — no build step, no runtime dependency on
   anything else. Deploy the folder as-is.
2. The **source of truth for the dual-mode sim code** (`engine/` + `visualizers/`).
   You author and perfect the sketches *here* (web-first), then push them to the Aha
   Maths Studio to render the videos.

**Flow:** build & perfect the sim on the website → `npm run sync` → the Studio renders
the Short from the exact same code. The website leads; the video follows.

---

## Run it locally

```bash
npm run serve      # → http://127.0.0.1:8080
```

No `npm install` needed (zero dependencies; p5 is bundled in `lib/`).

---

## Push sim code to the Studio

When a sketch is ready (or you tweaked `engine/` / a `visualizers/*.js`), push it to
the Studio so it can render:

```bash
npm run sync                               # Studio assumed at ../AhaMaths
STUDIO_ROOT=/path/to/AhaMaths npm run sync # or point it explicitly
```

This copies `engine/` and `visualizers/` **from here → the Studio**, overwriting the
Studio's copies. It never deletes Studio-only files, and it never touches the Studio's
per-short configs (see ownership below).

### Who owns what
| This website owns (edit here) | The Studio owns (edit there) |
|---|---|
| `engine/` — the dual-mode engine | `shorts/NNN-slug/short.config.js` — per-short **production** config: seed/params **+ beats timed to the voiceover + intro/outro** |
| `visualizers/*.js` — every sketch's draw code | rendering, VO, mux, publish (`app/`, `render/`) |
| The site: `*.html`, `style.css`, SEO/copy, deploy | the shorts backlog + published assets |

`sims/*.config.js` here are **local preview configs** — just enough for the widget to
run in the browser. The Studio's `short.config.js` is the real one; these are not
pushed and can differ.

> **Note on new sims:** if you scaffold a brand-new short in the Studio (which creates
> a `visualizers/<slug>.js` stub there), copy that stub into this repo's `visualizers/`
> to make the website authoritative for it — otherwise the next `sync` won't manage it
> (sync overwrites, but never deletes, so nothing breaks either way).

---

## Project layout

```
AhaMathsWebsite/
├── index.html            # homepage — the simulation grid
├── area-of-circle.html   # a per-simulation page (video + live sketch + explainer)
├── style.css             # site styles (brand tokens shared with the engine)
├── assets/fonts/         # Inter + JetBrains Mono
├── engine/               # SOURCE OF TRUTH — dual-mode engine (pushed to the Studio)
├── visualizers/          # SOURCE OF TRUTH — every sketch (pushed to the Studio)
├── sims/                 # local PREVIEW configs (Studio owns the production ones)
├── lib/p5.min.js         # third-party p5 library (bundled)
├── scripts/
│   ├── serve.mjs         # local static server (npm run serve)
│   └── sync.mjs          # push engine/ + visualizers/ → the Studio (npm run sync)
└── package.json
```

---

## Add a new simulation page

1. Author the sketch here: add `visualizers/<slug>.js` (and a `sims/<slug>.config.js`
   preview stub with any default params/seed). Perfect it live via `npm run serve`.
2. Copy `area-of-circle.html` → `<slug>.html` and point the three imports near the
   bottom at the new slug:
   ```js
   import('./sims/<slug>.config.js')
   import('./visualizers/<slug>.js')
   import('./engine/interactive.js')   // stays the same
   ```
   …then update the page's title, copy, SEO tags, and hero.
3. Replace a "Coming soon" card in `index.html` with a real
   `<a class="sim-card" href="<slug>.html">`.
4. `npm run sync` — pushes the new sketch to the Studio so it can render the Short.

---

## Count-Quest — tap-and-count scenes (the illustrated check)

A lesson's Check beat can be an illustrated **tap-and-count** scene instead of the
abstract dot grid: a warm picture where the child taps each object (mangoes, cats…),
found ones glow, a decoy gives gentle "not that one" feedback, and finding them all
celebrates. It's the interactive face of the "accuracy sandwich": **the picture is
mood; the count and the hotspot coordinates are code-owned truth.**

**Pieces:**
- `content/scenes/<id>.json` — the truth: `count`, normalized `hotspots` (`{x,y,r}`),
  `decoys`, `object_i18n`, `image` path, `aspect`.
- `assets/scenes/<id>.svg|png|avif` — the picture (a hand-drawn placeholder today; a
  curated Higgsfield still later).
- `ui/scene-count.js` + `styles/scene-count.css` — the runtime (keyboard-operable,
  reduced-motion aware). Falls back to the dot grid on Save-Data or any load failure.
- `tools/hotspot-author.html` — **dev-only** curation tool: load an image, click each
  object, mark decoys, tune radii, export the scene JSON. (Not shipped — excluded from
  the SW precache + sitemap.)

**To add / swap a scene:**
1. Generate + **curate** the image (every object fully visible, separated, same scale;
   count verified). Drop it in `assets/scenes/`.
2. Open `tools/hotspot-author.html` (via `npm run serve` → `/tools/hotspot-author.html`),
   load the image, click each object, mark the decoy(s), export → `content/scenes/<id>.json`.
3. Point a lesson's check at it:
   `"checks": [{ "type": "scene-count", "scene": "<id>", "count": <N>, "i18n": {...} }]`
   (keep `count` — it drives the dot-grid fallback).
4. Add the `object_i18n` + decoy i18n strings to `content/i18n/{en,hi}.json`.
5. Precache the new `.json` + image in `sw.js` and bump `CACHE`.

> **Never regenerate the image after authoring hotspots** — the coords are per-pixel.
> Re-authoring is the only safe swap.

---

## Before going live (TODOs)

- **Email capture** — forms POST to `https://formspree.io/f/REPLACE_WITH_FORM_ID`.
  Create a form (Formspree / Buttondown / Mailchimp) and paste the real endpoint.
- **YouTube embed** — `area-of-circle.html` shows a "publishing soon" placeholder;
  uncomment the `<iframe>` and set the real video ID once the Short is live.
- **Domain / SEO** — canonical + Open Graph URLs say `https://ahamaths.com/`. Once the real
  domain is confirmed, update it in every `<meta>`/`<link canonical>` tag, `robots.txt`, and
  `scripts/gen-sitemap.mjs`'s `BASE`, then re-run `npm run sitemap`.
- **Handle** — links point to `youtube.com/@ahamaths`; confirm the real handle.
- **New lesson content** — after adding a `content/lessons/<id>.json`, add its id to
  `content/lessons/index.json`'s `available` array (this is what keeps world-card "Start"
  buttons and the Connect beat's "Next" link from ever pointing at a lesson that 404s) and
  re-run `npm run sitemap`.

## Deploy

Static files, no build:

- **GitHub Pages** — serve from the repo root of the default branch. `404.html` at the root
  is served automatically for unmatched paths.
- **Netlify** — no build command; publish directory = repo root. `404.html` is auto-detected.
- **Vercel** — no build command; publish directory = repo root. Add a rewrite so unmatched
  paths render `404.html` (Vercel doesn't auto-detect it): `{ "source": "/(.*)", "destination": "/404.html" }`
  as a fallback in `vercel.json`.
- **Any static host / S3 / nginx** — upload the folder; set the host's custom-error-document
  (S3 bucket property / nginx `error_page 404`) to `/404.html`.

