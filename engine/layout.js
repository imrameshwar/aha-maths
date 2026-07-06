// engine/layout.js — aspect-aware framing with safe zones.
// Splits the canvas into reusable rectangles. The visualizer draws ONLY in
// `stage`; the engine owns title / caption / footer. Three shapes are framed:
//   • portrait  (W<H, e.g. 1080x1920) — tall Shorts framing (default)
//   • landscape (W>H, e.g. 1920x1080) — tight top/bottom bands, wide stage
//   • square    (W===H, e.g. 1080x1080) — medium bands, generous side inset
// Visualizers stay fraction-based off `stage`, so most adapt for free.

export function computeLayout(W = 1080, H = 1920) {
  const landscape = W > H;
  const square    = W === H;

  if (landscape) {
    const titleH = 130;
    const captionH = 130;
    const footerH = 80;
    const stageTop = titleH;
    const stageHeight = H - titleH - captionH - footerH;
    return {
      W,
      H,
      landscape: true,
      square: false,
      title: { x: 0, y: 0, w: W, h: titleH },
      stage: { x: 90, y: stageTop + 16, w: W - 180, h: stageHeight - 32 },
      caption: { x: 120, y: stageTop + stageHeight, w: W - 240, h: captionH },
      footer: { x: 0, y: H - footerH, w: W, h: footerH },
    };
  }

  if (square) {
    // Square: bands between portrait and landscape; keep the stage close to a
    // 1:1 window with comfortable side insets.
    const titleH = 150;
    const captionH = 160;
    const footerH = 110;
    const stageTop = titleH;
    const stageHeight = H - titleH - captionH - footerH;
    return {
      W,
      H,
      landscape: false,
      square: true,
      title: { x: 0, y: 0, w: W, h: titleH },
      stage: { x: 80, y: stageTop + 16, w: W - 160, h: stageHeight - 32 },
      caption: { x: 90, y: stageTop + stageHeight, w: W - 180, h: captionH },
      footer: { x: 0, y: H - footerH, w: W, h: footerH },
    };
  }

  const titleH = 170;   // topic title + logo
  const captionH = 230; // current-step text / counters
  const footerH = 190;  // @handle — kept clear of Shorts UI chrome

  const stageTop = titleH;
  const stageHeight = H - titleH - captionH - footerH;

  return {
    W,
    H,
    landscape: false,
    square: false,
    title: { x: 0, y: 0, w: W, h: titleH },
    // Inset the stage a little so visuals never touch the edges.
    stage: { x: 70, y: stageTop + 20, w: W - 140, h: stageHeight - 40 },
    caption: { x: 60, y: stageTop + stageHeight, w: W - 120, h: captionH },
    footer: { x: 0, y: H - footerH, w: W, h: footerH },
  };
}

export default computeLayout;
