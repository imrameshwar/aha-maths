/* ui/world-icons.js — custom duotone SVG icons for the 8 worlds (Premium P3).
   Replaces the emoji (🔢➕🍕…) that rendered inconsistently across OSes and
   cheapened the world map. Each icon is a 24×24 line+soft-fill mark that inherits
   its world colour via `currentColor` (the world card sets color:var(--world-color)),
   so one icon set recolours per theme automatically. */

const S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

export const WORLD_ICONS = {
  // Numbers — an abacus (counting / one-to-one correspondence)
  numbers: `<svg ${S}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" fill="currentColor" fill-opacity="0.12"/>
    <line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="16" x2="21" y2="16"/>
    <circle cx="8" cy="10" r="1.6" fill="currentColor" stroke="none"/>
    <circle cx="13" cy="10" r="1.6" fill="currentColor" stroke="none"/>
    <circle cx="10" cy="16" r="1.6" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="16" r="1.6" fill="currentColor" stroke="none"/></svg>`,

  // Arithmetic — plus over minus
  arithmetic: `<svg ${S}>
    <rect x="3" y="3" width="18" height="18" rx="4.5" fill="currentColor" fill-opacity="0.12"/>
    <line x1="12" y1="6.5" x2="12" y2="11.5"/><line x1="9.5" y1="9" x2="14.5" y2="9"/>
    <line x1="9.5" y1="15.5" x2="14.5" y2="15.5"/></svg>`,

  // Fractions — a quarter-shaded pie (part of a whole)
  fractions: `<svg ${S}>
    <path d="M12 12 V3 A9 9 0 0 1 21 12 Z" fill="currentColor" fill-opacity="0.22" stroke="none"/>
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`,

  // Shapes — a triangle overlapping a circle
  shapes: `<svg ${S}>
    <circle cx="9" cy="15" r="5" fill="currentColor" fill-opacity="0.16"/>
    <path d="M15 4 L21.5 16.5 L8.5 16.5 Z"/></svg>`,

  // Algebra — the unknown x in a box
  algebra: `<svg ${S}>
    <rect x="3" y="3" width="18" height="18" rx="4.5" fill="currentColor" fill-opacity="0.12"/>
    <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/><line x1="15.5" y1="8.5" x2="8.5" y2="15.5"/></svg>`,

  // Measure — a ruler with ticks
  measure: `<svg ${S}>
    <rect x="2.5" y="7.5" width="19" height="9" rx="2" fill="currentColor" fill-opacity="0.12"/>
    <line x1="6.5" y1="7.5" x2="6.5" y2="12"/><line x1="10.5" y1="7.5" x2="10.5" y2="10.5"/>
    <line x1="14.5" y1="7.5" x2="14.5" y2="12"/><line x1="18.5" y1="7.5" x2="18.5" y2="10.5"/></svg>`,

  // Data — an ascending bar chart
  data: `<svg ${S}>
    <line x1="4" y1="20" x2="20.5" y2="20"/>
    <rect x="6" y="13" width="3.4" height="7" rx="1" fill="currentColor" fill-opacity="0.2"/>
    <rect x="11" y="9" width="3.4" height="11" rx="1" fill="currentColor" fill-opacity="0.2"/>
    <rect x="16" y="5.5" width="3.4" height="14.5" rx="1" fill="currentColor" fill-opacity="0.2"/></svg>`,

  // Infinite — the lemniscate
  infinite: `<svg ${S}>
    <path d="M12 12 C9 8 4.5 8 4.5 12 C4.5 16 9 16 12 12 C15 8 19.5 8 19.5 12 C19.5 16 15 16 12 12 Z"
          fill="currentColor" fill-opacity="0.14"/></svg>`,
};
