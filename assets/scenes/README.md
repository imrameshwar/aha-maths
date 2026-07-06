# Count-Quest scenes — style board + generation briefs

The picture is **mood**; the count + hotspots are **code-owned truth**. Generate in
Higgsfield, curate hard, author hotspots in `tools/hotspot-author.html`, and the runtime
(`ui/scene-count.js`) does the rest. The code side already accepts any raster (PNG/AVIF/WebP)
or SVG — set the real `aspect` in the scene JSON (the author tool computes it) so nothing crops
and hotspots align.

---

## Style board (cite this in every prompt — reject anything off it)

- **Look:** warm Rajasthani **storybook / children's-book painterly**, soft morning light,
  gentle depth. Not photoreal (uncanny fruit/animals), not flat vector.
- **Palette:** warm creams, golden-orange, leaf-greens; friendly, high-warmth. Reads on the
  navy/cyan/amber brand without fighting it.
- **Composition:** clean, uncluttered, objects **fully visible, separated, same scale**, good
  contrast against background.
- **Hard bans (auto-reject):** any **text / numbers / watermark**; **hands or human figures**;
  extra/партial/overlapping copies of the countable object; stray look-alike blobs; cluttered bg.

Aspect: **4:3** unless a scene says otherwise (matches the placeholder + keeps mobile framing).
Generate **6–10 candidates** per scene; expect **60–80% rejection** on countable scenes — normal.

---

## Scene 001 · `mango-tree` (level 1 · counting · lesson 1-01)

Replaces `mango-tree.svg`. **Count = 5. One decoy (a bird).**

**Higgsfield Soul prompt:**
> A warm storybook illustration of a single mango tree in a sunlit Rajasthani courtyard.
> Exactly **five** ripe golden-orange mangoes hang in the green canopy — each mango clearly
> **separated, fully visible, and the same size**. One small blue bird perches on a branch to
> the side. Soft morning light, painterly children's-book style, warm gentle palette, clean
> uncluttered composition. No text, no numbers, no watermark. 4:3.

**Negative / avoid:** text, numbers, watermark, extra fruit, clustered or overlapping mangoes,
cut-off mangoes, hands, people, busy background, photoreal.

**Curation gate (verify before authoring):** exactly 5 mangoes · none merged or occluded · all
similar size · the bird is unmistakably a bird · no stray orange blobs that could be miscounted.

---

## How to hand it back to me

1. Generate + pick the winner in your Higgsfield account.
2. Drop the file in `assets/scenes/` (e.g. `mango-tree.png`) — or just share it with me.
3. I'll: curate-check it → author hotspots in the tool → update `content/scenes/mango-tree.json`
   (image path + coords + real aspect) → optimise (AVIF/WebP, poster) → precache + bump `sw.js`.
   The placeholder SVG stays as the offline/Save-Data-cheap fallback if we want it.

## Next scenes to brief when ready (difficulty ladder)

- `cats-room` (lvl 1, counting) — the user's original example; count 3–7 cats in a room.
- `mango-baskets` (lvl 2) — 3 baskets of 4 → grouping → multiplication (world 2).
- `rotis-eaten` (lvl 4) — 12 rotis, 3 eaten (crumbs on a plate) → subtraction as story.
