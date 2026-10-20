import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

// Serve exactly the emitted files under a project prefix, with no clean-URL
// rewrites. This catches links that work in preview but fail on static hosting.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const prefix = '/galaxy-in-research-dashboard/';
const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith(prefix)) {res.writeHead(404).end(); return;}
  let relative = pathname.slice(prefix.length);
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(root)) {res.writeHead(404).end(); return;}
  try {res.end(await fs.readFile(filename));}
  catch {res.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const visited = new Set();
async function check(reference, base) {
  const url = new URL(reference, base);
  if (url.origin !== origin) return;
  assert.ok(url.pathname.startsWith(prefix), `Escaped repository path: ${url}`);
  url.hash = ''; url.search = '';
  if (visited.has(url.href)) return;
  visited.add(url.href);
  const response = await fetch(url);
  assert.equal(response.status, 200, `Missing built resource: ${url}`);
  const body = await response.text();
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    const document = new JSDOM(body).window.document;
    for (const element of document.querySelectorAll('[href], [src]')) {
      const target = element.getAttribute('href') ?? element.getAttribute('src');
      if (target && !target.startsWith('#')) await check(target, url);
    }
  }
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.html')) {
    // Framework's shared standard library also names lazy adapters that are
    // intentionally not emitted unless used (for example Arrow or DuckDB).
    const imports = /(?:\bfrom\s*|\bimport\s+)["']([^"']+)["']/g;
    for (const match of body.matchAll(imports)) {
      if (/^(\.|\/|https?:)/.test(match[1])) await check(match[1], url);
    }
    if (!url.pathname.includes('/_observablehq/')) {
      for (const match of body.matchAll(/\bimport\s*\(\s*["']([^"']+)["']/g)) await check(match[1], url);
    }
    for (const match of body.matchAll(/"path"\s*:\s*"([^"]+)"/g)) await check(match[1], url);
  }
  if (url.pathname.endsWith('.css')) {
    for (const match of body.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) await check(match[1], url);
  }
}
try {
  await check(prefix, origin);
  await check(`${prefix}papers.html?year=2025&country=US`, origin);
  console.log(`PASS static project hosting: ${visited.size} page, asset, module, and data URLs resolve under ${prefix}`);
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
