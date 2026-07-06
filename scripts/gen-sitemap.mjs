// scripts/gen-sitemap.mjs — regenerates sitemap.xml from worlds.json + the
// available-lessons manifest, so it only ever lists pages that actually
// resolve (never a lesson JSON that 404s). Run after adding/removing a lesson:
//
//   node scripts/gen-sitemap.mjs

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const BASE = 'https://ahamaths.com';

const STATIC_PAGES = [
  { loc: '/',                     priority: '1.0' },
  { loc: '/learn.html',           priority: '0.9' },
  { loc: '/numbers-story.html',   priority: '0.8' },
  { loc: '/area-of-circle.html',  priority: '0.7' },
  { loc: '/cinema.html',          priority: '0.3' },
  { loc: '/privacy.html',         priority: '0.2' },
];

async function main() {
  const worlds    = JSON.parse(await readFile(resolve(ROOT, 'content/worlds.json'), 'utf8'));
  const { available } = JSON.parse(await readFile(resolve(ROOT, 'content/lessons/index.json'), 'utf8'));
  const availableSet = new Set(available);

  const lessonUrls = worlds
    .flatMap(w => w.lessons)
    .filter(l => availableSet.has(l.id))
    .map(l => ({ loc: `/learn.html?lesson=${l.id}`, priority: '0.6' }));

  const urls = [...STATIC_PAGES, ...lessonUrls];
  const today = new Date().toISOString().slice(0, 10);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  await writeFile(resolve(ROOT, 'sitemap.xml'), xml);
  console.log(`sitemap.xml written — ${urls.length} URLs (${lessonUrls.length} lessons).`);
}

main();
