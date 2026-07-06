// ui/nav.js — mobile hamburger toggle for .site-nav (index.html header).

export function initMobileNav() {
  const btn = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!btn || !nav) return;

  const close = () => {
    nav.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const opening = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', opening);
    btn.setAttribute('aria-expanded', String(opening));
  });

  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && e.target !== btn) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 720) close(); });
}
