// engine/theme.js — single source of truth for Aha Maths branding.
// Imported by BOTH the render host (stage.js) and the interactive host
// (interactive.js) so video and widget always match.
// NEVER hardcode hex/fonts in a visualizer — pull from ctx.theme.

export const theme = {
  // Surfaces
  bg:      '#0B0F1A',  // deep navy-black canvas
  surface: '#141A2A',  // panels / chart backgrounds
  grid:    '#222B3D',  // faint gridlines / baselines

  // Semantic colors
  primary:   '#22D3EE',  // vivid cyan — main accent / active element
  secondary: '#FBBF24',  // amber — labels / secondary state / "the answer"
  success:   '#34D399',  // resolved / equal / done
  danger:    '#F87171',  // discard / outside / wrong
  accent2:   '#A78BFA',  // extra accent (clearly distinct from cyan + green)

  // Text
  textHi: '#FFFFFF',
  textLo: '#94A3B8',

  // Typography — bare family names; host force-loads via @font-face.
  // NEVER use comma-fallback lists: p5's textFont wraps them, yielding serif.
  fontSans: 'Inter',
  fontMono: 'JetBrains Mono',

  // Timing
  fps:           60,
  introDuration: 0.4,  // quick brand flash — keep hook in the first second (Shorts retention)
  outroDuration: 2.0,

  // Brand
  logoText: 'AM',
  handle:   '@AhaMathsOfficial',

  // Canvas — vertical Shorts. These are OVERRIDABLE DEFAULTS: the render path can
  // pass a per-render `aspect` (see ASPECTS) that replaces W/H before a short is
  // drawn. The interactive widget (interactive.js / play/) ignores this and keeps
  // its own fixed web aspect — the video aspect must never leak into the widget.
  W: 1080,
  H: 1920,
};

// Per-render aspect presets. `renderShort(id, { aspect })` picks one; the render
// host resizes the canvas and layout.js re-frames the safe zones to match.
// `vertical` is the default and matches theme.W/H above.
export const ASPECTS = {
  vertical:   { W: 1080, H: 1920, label: 'Vertical 9:16' },
  horizontal: { W: 1920, H: 1080, label: 'Horizontal 16:9' },
  square:     { W: 1080, H: 1080, label: 'Square 1:1' },
};

export default theme;
