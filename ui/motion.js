/* ui/motion.js — premium micro-interactions for the landing page (Phase 4).
   Two effects, both cheap and accessibility-gated:
     1. Scroll-reveal — cards/sections fade-and-rise the first time they enter view.
        Flash-free: an inline <head> script adds `.reveal-ready` synchronously so
        CSS can hide the targets before first paint; this module then reveals them.
        Under prefers-reduced-motion the class is never added → everything is shown.
     2. Pointer spotlight — a soft light that follows the cursor across a card
        (via --mx/--my custom props + a mix-blend overlay in CSS). Fine-pointer only. */

// Kept in sync with the reveal selectors in styles/hub.css.
const REVEAL_SELECTOR = '.show-card, .sim-card, .ages, .story-feature, .email-section, .section-title';
const SPOTLIGHT_SELECTOR = '.show-card, .world-card, .story-feature, .sim-card';

export function initMotion() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1 · Scroll-reveal ──────────────────────────────────────────────────────
  const targets = document.querySelectorAll(REVEAL_SELECTOR);
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));   // no motion: just show
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));
  }

  // ── 2 · Pointer spotlight ──────────────────────────────────────────────────
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduce) {
    document.addEventListener('pointermove', (ev) => {
      const card = ev.target.closest && ev.target.closest(SPOTLIGHT_SELECTOR);
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((ev.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--my', `${((ev.clientY - r.top) / r.height) * 100}%`);
    }, { passive: true });
  }
}
