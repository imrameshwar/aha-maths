// story/characters.js — the cast, as authored inline SVG portraits (S2).
// Geometric "mascot" style to match assets/mascot.svg + logo: rounded head,
// white eye-discs with glints, warm accents. One shared face rig + a
// distinguishing "topper" (hat / hair / headwear) per character, so the cast
// reads at a glance without 13 bespoke drawings.
//
// charSVG(id) → an <svg> string (64×64). The eyes carry a `.am-eyes` class so
// journey.css can blink them; a talking portrait gets `.is-talking` on the wrap
// (mouth animates). Kept data-only (no p5) like numbers-script.js.

const SKIN = { tan: '#C8956B', light: '#E0B088', deep: '#9E6B3E', rosy: '#E8B48C' };

// shared face: eye discs + irises + glints (+ optional mouth). Returns SVG guts.
function face(opt = {}) {
  const { eyeY = 32, eyeR = 5.6, mouth = 'smile', big = false } = opt;
  const er = big ? 6.6 : eyeR, ir = big ? 3.4 : 2.8;
  const m = mouth === 'smile'
      ? `<path class="am-mouth" d="M27 43 Q32 47 37 43" fill="none" stroke="#5A3A22" stroke-width="1.8" stroke-linecap="round"/>`
    : mouth === 'o'
      ? `<ellipse class="am-mouth" cx="32" cy="44" rx="2.6" ry="3.2" fill="#5A3A22"/>`
      : '';
  return `
    <g class="am-eyes">
      <circle cx="24" cy="${eyeY}" r="${er}" fill="#fff"/>
      <circle cx="40" cy="${eyeY}" r="${er}" fill="#fff"/>
      <circle cx="24.8" cy="${eyeY + 0.6}" r="${ir}" fill="#0B0F1A"/>
      <circle cx="39.2" cy="${eyeY + 0.6}" r="${ir}" fill="#0B0F1A"/>
      <circle cx="26" cy="${eyeY - 1}" r="1.2" fill="#fff"/>
      <circle cx="40.4" cy="${eyeY - 1}" r="1.2" fill="#fff"/>
    </g>
    ${m}`;
}
const head = (skin) => `<circle cx="32" cy="34" r="22" fill="${skin}"/>`;
const ear  = (skin) => `<circle cx="12" cy="35" r="4" fill="${skin}"/><circle cx="52" cy="35" r="4" fill="${skin}"/>`;

// ── per-character SVG (id → guts inside a 64×64 svg) ────────────────────────────
const BUILD = {
  // Narrator — Ganita the owl (echoes assets/mascot.svg)
  narrator: () => `
    <path d="M18 14 L26 22 L14 22 Z" fill="#A78BFA"/>
    <path d="M46 14 L50 22 L38 22 Z" fill="#22D3EE"/>
    <ellipse cx="32" cy="34" rx="21" ry="22" fill="url(#am-owl)"/>
    <ellipse cx="32" cy="40" rx="13" ry="14" fill="#0B0F1A" fill-opacity="0.15"/>
    ${face({ eyeY: 30, eyeR: 8, mouth: '' })}
    <path d="M32 34 L28 39 L36 39 Z" fill="#FBBF24"/>`,

  // Shepherd — straw hat
  shepherd: () => `
    ${ear(SKIN.tan)}${head(SKIN.tan)}${face()}
    <ellipse cx="32" cy="17" rx="24" ry="6" fill="#C89A45"/>
    <path d="M20 17 Q32 -1 44 17 Z" fill="#E0B457"/>
    <rect x="20" y="15" width="24" height="3" rx="1.5" fill="#8A6B24"/>`,

  // Hunter — headband + feather
  hunter: () => `
    ${ear(SKIN.deep)}${head(SKIN.deep)}${face()}
    <path d="M46 10 Q50 18 46 24" fill="none" stroke="#34D399" stroke-width="3" stroke-linecap="round"/>
    <rect x="12" y="18" width="40" height="5" rx="2.5" fill="#34D399"/>`,

  // Scribe — head-cloth
  scribe: () => `
    ${head(SKIN.light)}${face()}
    <path d="M9 30 Q10 8 32 8 Q54 8 55 30 Q44 18 32 18 Q20 18 9 30 Z" fill="#E8ECF2"/>
    <path d="M9 30 Q20 20 32 20 Q44 20 55 30" fill="none" stroke="#C7CEDA" stroke-width="1.6"/>`,

  // Roman merchant — laurel wreath
  merchant: () => `
    ${ear(SKIN.light)}${head(SKIN.light)}${face()}
    <path d="M12 26 Q8 14 20 12" fill="none" stroke="#B8912E" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M52 26 Q56 14 44 12" fill="none" stroke="#B8912E" stroke-width="2.4" stroke-linecap="round"/>
    <g fill="#D8B24A"><circle cx="14" cy="22" r="2"/><circle cx="16" cy="16" r="2"/><circle cx="50" cy="22" r="2"/><circle cx="48" cy="16" r="2"/></g>`,

  // Apprentice — small round cap
  apprentice: () => `
    ${ear(SKIN.tan)}${head(SKIN.tan)}${face()}
    <path d="M14 20 Q32 4 50 20 Z" fill="#A78BFA"/>
    <circle cx="32" cy="9" r="2.4" fill="#7C6BD6"/>`,

  // Teacher — hair bun + round glasses
  teacher: () => `
    ${head(SKIN.light)}${face()}
    <path d="M12 24 Q12 8 32 8 Q52 8 52 24 Q42 14 32 14 Q22 14 12 24 Z" fill="#3A2E4A"/>
    <circle cx="32" cy="7" r="4.5" fill="#3A2E4A"/>
    <g fill="none" stroke="#22D3EE" stroke-width="1.6"><circle cx="24" cy="32" r="7"/><circle cx="40" cy="32" r="7"/><path d="M31 32 h2"/></g>`,

  // Student — side-parted hair, young
  student: () => `
    ${head(SKIN.tan)}${face({ big: true })}
    <path d="M11 26 Q11 7 32 7 Q53 7 53 26 Q50 16 34 15 Q34 22 30 22 Q22 20 11 26 Z" fill="#5A3E6E"/>`,

  // Indian scholar — turban with a jewel
  scholar: () => `
    ${ear(SKIN.deep)}${head(SKIN.deep)}${face()}
    <path d="M9 24 Q9 4 32 4 Q55 4 55 24 Q48 12 32 12 Q16 12 9 24 Z" fill="#2FB985"/>
    <path d="M9 24 Q32 14 55 24" fill="none" stroke="#26996E" stroke-width="2"/>
    <circle cx="32" cy="12" r="2.6" fill="#FBBF24"/>`,

  // Trader — desert turban + scarf
  trader: () => `
    ${head(SKIN.tan)}${face()}
    <path d="M8 26 Q8 6 32 6 Q56 6 56 26 Q46 14 32 14 Q18 14 8 26 Z" fill="#E0B457"/>
    <path d="M8 26 Q6 34 14 40" fill="none" stroke="#E0B457" stroke-width="5" stroke-linecap="round"/>
    <path d="M8 26 Q32 16 56 26" fill="none" stroke="#C89A45" stroke-width="1.8"/>`,

  // Astronomer — tall pointed cap with a star
  astronomer: () => `
    ${ear(SKIN.light)}${head(SKIN.light)}${face()}
    <path d="M16 20 L32 -6 L48 20 Z" fill="#6D5AC4"/>
    <path d="M16 20 Q32 12 48 20 Z" fill="#5847B0"/>
    <path d="M32 4 l1.4 3 3.2.3-2.4 2.1.8 3.1-3-1.7-3 1.7.8-3.1-2.4-2.1 3.2-.3z" fill="#FBBF24"/>`,

  // Child — single tuft, rosy cheeks, big eyes
  child: () => `
    ${ear(SKIN.rosy)}${head(SKIN.rosy)}${face({ big: true })}
    <circle cx="18" cy="40" r="2.6" fill="#F19A9A" fill-opacity="0.7"/>
    <circle cx="46" cy="40" r="2.6" fill="#F19A9A" fill-opacity="0.7"/>
    <path d="M32 12 Q30 4 35 5 Q31 8 34 12 Z" fill="#22D3EE"/>`,

  // Geometer — flat cap + compass mark
  geometer: () => `
    ${ear(SKIN.tan)}${head(SKIN.tan)}${face()}
    <path d="M10 18 Q32 6 54 18 L54 21 Q32 12 10 21 Z" fill="#C99A3A"/>
    <path d="M30 15 L26 24 M34 15 L38 24" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" fill="none"/>`,
};

export function charSVG(id, { talking = false } = {}) {
  const build = BUILD[id] || BUILD.narrator;
  return `<svg class="am-char${talking ? ' is-talking' : ''}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="am-owl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22D3EE"/><stop offset="1" stop-color="#A78BFA"/></linearGradient></defs>
    ${build()}
  </svg>`;
}
