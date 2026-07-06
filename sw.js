// sw.js — Service Worker for offline support.
// Strategy: cache-first for static assets, network-first for JSON data.

const CACHE = 'am-v40';
const SHELL = [
  './',
  'index.html',
  'learn.html',
  'khoj.html',
  'story-of-numbers.html',
  'numbers-story.html',
  '404.html',
  'offline.html',
  'privacy.html',
  'styles/error.css',
  // WOFF2 (~65% smaller than the TTF masters) is what every page actually
  // requests via @font-face — precache those, not the unused TTF fallback.
  // (Inter/JetBrains Mono stay out of the eager precache, same as before —
  // they're canvas/lesson fonts, picked up lazily via the fetch handler.)
  'assets/fonts/PlusJakartaSans.woff2',
  'assets/fonts/Mukta-Regular.woff2',
  'assets/fonts/Mukta-SemiBold.woff2',
  'assets/fonts/Mukta-Bold.woff2',
  'styles/tokens.css',
  'style.css',
  'styles/learn.css',
  'styles/hub.css',
  'styles/story.css',
  'styles/journey.css',
  'styles/scene-count.css',
  'styles/khoj.css',
  'ui/scene-count.js',
  'ui/khoj.js',
  'ui/share-card.js',
  'content/scenes/mango-tree.json',
  'assets/scenes/mango-tree.svg',
  'content/scenes/courtyard-cats.json',
  'assets/scenes/courtyard-cats.svg',
  'content/scenes/festival-diyas.json',
  'assets/scenes/festival-diyas.svg',
  'content/scenes/mela-balloons.json',
  'assets/scenes/mela-balloons.svg',
  'cinema.html',
  'styles/cinema.css',
  'story/cinema-scene.js',
  'story/story-of-numbers.js',
  'story/numbers-interactive.js',
  'story/numbers-script.js',
  'story/characters.js',
  'story/vo.js',
  'story/audio-fx.js',
  'story/draw-lib.js',
  'lib/p5.min.js',
  'ui/i18n.js',
  'ui/theme.js',
  'ui/settings.js',
  'ui/accessibility.js',
  'ui/lesson.js',
  'ui/audio.js',
  'ui/hub.js',
  'ui/world-icons.js',
  'ui/hero-ambient.js',
  'ui/motion.js',
  'ui/nav.js',
  'ui/celebrate.js',
  'ui/progress.js',
  'ui/sketch.js',
  'content/i18n/en.json',
  'content/i18n/hi.json',
  'content/worlds.json',
  'content/lessons/index.json',
  'content/lessons/1-01-counting.json',
  'content/lessons/1-02-place-value.json',
  'content/lessons/1-03-number-line.json',
  'content/lessons/1-04-negatives.json',
  'content/lessons/2-01-addition.json',
  'content/lessons/4-04-circle-area.json',
  'content/lessons/5-04-pythagoras.json',
  'visualizers/counting-dots.js',
  'visualizers/place-value.js',
  'visualizers/number-line.js',
  'visualizers/addition.js',
  'visualizers/area-of-circle.js',
  'visualizers/pythagoras-theorem.js',
  'engine/visualizer.js',
  'engine/theme.js',
  'assets/logo-mark.svg',
  'assets/apple-touch-icon.png',
  'assets/favicon-32.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/mascot.svg',
  'assets/og-image.svg',
  'assets/og-image.png',
  'manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(SHELL.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Dev convenience: never cache on localhost, so file edits show up on reload
  // (a cache-first SW is a menace during local development).
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  // Network-first for JSON (keeps content fresh).
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (JS, CSS, HTML, fonts).
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(r => {
          if (r && r.status === 200 && r.type !== 'opaque') {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => {
          // Offline + not cached: for a page navigation, show the branded
          // offline page instead of the browser's default "no internet" screen.
          if (e.request.mode === 'navigate') return caches.match('offline.html');
          return Response.error();
        });
    })
  );
});
