# Story of Numbers — era backdrop plates (S7 art brief)

**Style chosen:** storybook-painterly · **Tool:** Higgsfield
**Status:** the drop-in system is BUILT + verified. A placeholder `clay.jpg` proves it composites.
You generate 8 paintings → they slide in automatically.

---

## The one rule that matters: the accuracy sandwich
The painting carries **MOOD ONLY**. Code still draws every number, digit and mark on
top; HTML carries all the bilingual text. So each plate **must**:
- contain **NO text, NO numbers, NO letters, NO symbols, NO writing** (models mangle
  them and it's fatal for a maths brand);
- keep the **center calm and fairly dark** — that's where glowing cyan/white/amber
  numbers get drawn. Put the interest at the **top and edges**;
- keep the **bottom third quiet** (captions + readouts sit there; the code adds a dark
  scrim, but don't fight it with bright busy detail along the bottom);
- stay in one **cohesive painterly family** across all 8 so the journey feels like one book.

---

## Exact specs (so they drop in with zero rework)
| Thing | Value |
|---|---|
| Count | **8 images** (one per "era", listed below) |
| Aspect / size | **16:10**, export **1600×1000** or larger (I downscale) |
| Format | **WEBP** preferred, or **JPG** (I'll convert either way) |
| Weight | I compress to **≤200 KB** each — you can send full-res, don't worry about size |
| Filenames | exactly `<era>.webp` or `<era>.jpg` → drop in **`assets/story-plates/`** |
| Text | **none** (see the rule above) |

**Easiest path for you:** generate the 8, **send me the raw images at any size/format.**
I'll crop to 16:10, compress under budget, rename, place them in `assets/story-plates/`,
add them to the service-worker precache, and verify each one in its real scene. You
literally just generate + send.

The 8 filenames: `night · dawn · bone · clay · marble · ink · saffron · cosmic`.
**Highest impact first:** `ink` and `cosmic` each appear behind **3 scenes** — do those
two first if you want the biggest jump for the least art.

---

## The 8 Higgsfield prompts (copy-paste; set aspect to 16:10 / widescreen)

Append this **style tail** to every prompt:
> *storybook-painterly gouache illustration, soft hand-painted brushwork, warm muted
> palette, atmospheric depth, gentle cinematic light, calm and uncluttered with open
> negative space in the middle, picture-book children's-book art, no text, no numbers,
> no letters, no writing, no symbols, no UI — wide 16:10.*

**1 · `night`** — *(Scene 1, "before numbers")*
A vast prehistoric night sky from before humanity had numbers — deep indigo and
midnight blue, a soft scatter of faint stars, one low dark hill on the horizon and a
single tiny lone figure gazing up in quiet wonder; the empty contemplative sky fills
most of the frame. Palette deep navy to midnight blue with cool starlight.

**2 · `dawn`** — *(Scene 2, the shepherd — optional; his scene has hand-drawn dawn already,
I'll wire the plate in if you make one)*
A gentle sunrise over soft rolling green-gold meadow hills, misty morning light, a faint
wooden sheep-pen far off, a warm amber sun low on the horizon; pastoral, peaceful, calm
open sky. Palette warm dawn amber over cool morning indigo.

**3 · `bone`** — *(Scene 3, tally marks — ice age)*
An ice-age twilight at the mouth of a cave, cool blue dusk with a warm campfire glow
spilling out, faint hints of antlers and carved bones, distant snowy hills; primitive,
hushed, ancient. Palette cool slate-blue with a single warm ember glow.

**4 · `clay`** — *(Scene 4, first cities — Mesopotamia)* *(placeholder exists)*
A Mesopotamian river city at golden sunset, terraced ziggurat temple silhouettes, a calm
reflective river, warm ochre and terracotta haze, a low glowing sun; ancient and grand.
Palette warm clay-ochre to burnt orange.

**5 · `marble`** — *(Scene 5, Roman numerals)*
A Roman marble forum at soft golden hour, rows of pale stone columns and arches catching
warm light, cool marble in shadow; imperial, orderly, a little heavy and grand. Palette
cool marble grey-blue with warm gold light.

**6 · `ink`** — *(Scenes 6–8: place value, zero, the power of zero — ancient India) ★ do first*
An ancient Indian scholar's courtyard at night — glowing oil lamps and stacked palm-leaf
manuscripts, a temple silhouette beneath a deep starry indigo-teal sky; contemplative and
sacred, the hush of a great idea being born. Palette deep indigo-teal with warm lamp glow.

**7 · `saffron`** — *(Scene 9, the numerals travel India → the world)*
A warm trade-route journey at dusk — a caravan crossing golden dunes from India toward
distant Arabian domes and, far beyond, European spires; saffron sky melting into teal, a
sense of movement and passage. Palette saffron-gold warming into a teal horizon.

**8 · `cosmic`** — *(Scenes 10–12: new numbers, scales, finale — the universe) ★ do first*
A breathtaking deep-space vista — a spiral galaxy and soft violet nebula clouds, scattered
distant stars, serene and infinite, with a dark empty center for focus; cosmic scale and
wonder. Palette deep space black into deep violet.

---

## What's already done on my side (so you can trust the pipeline)
- `story/draw-lib.js`: `loadPlate()` + cover-fit compositing inside `eraBackdrop()`. A plate
  becomes the bottom layer with an era-tinted contrast scrim; motes stay subtle over it;
  **missing plate → the procedural set (built in S1) shows instead** — nothing breaks.
- **Save-Data / data-saver users** automatically skip plates (procedural fallback).
- Verified: `clay.jpg` placeholder composites behind the tablet in Scene 4 with the "0/12
  goats" readout still legible; plate-less eras fall back cleanly; 0 console errors.
- When your finals land I'll: place + compress them, add to `sw.js` precache, wire the
  `dawn` plate into the shepherd scene (its one bespoke case), and re-verify all 12 scenes.

**TL;DR — all I need from you: the 8 paintings (start with `ink` + `cosmic`), text-free,
calm center. Send them any size and I'll do the rest.**
