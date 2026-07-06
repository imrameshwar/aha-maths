// scripts/serve.mjs — tiny static server for local preview of the website.
// Run:  npm run serve   → http://127.0.0.1:8080
//
// The deployed site needs no server at all (any static host works); this is only
// for local development so ES-module imports + fonts resolve over http://.

import { createServer } from 'http';
import { readFile }     from 'fs/promises';
import { join, extname, resolve, normalize } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html',            '.css':  'text/css',
  '.js':   'application/javascript', '.mjs': 'application/javascript',
  '.json': 'application/json',      '.ttf':  'font/ttf',
  '.png':  'image/png',            '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain',           '.xml':  'application/xml',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Contain the path inside ROOT (no ../ escapes).
  const filePath = join(ROOT, normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`<h1>404</h1><p>Not found: ${urlPath}</p>`);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Aha Maths — website preview`);
  console.log(`  →  http://127.0.0.1:${PORT}\n`);
});
