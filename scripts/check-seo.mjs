import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

let pages = 0;
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'admin') walk(file); continue; }
    if (!file.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${file}: one H1`);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${file}: canonical`);
    for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
    if (!html.includes('noindex')) {
      assert(html.includes('GTM-WC7RMTV'), `${file}: missing GTM`);
      assert(!html.includes('gtag/js'), `${file}: duplicate GA installation`);
    }
    pages++;
  }
};
walk('_site');
const sitemap = fs.readFileSync('_site/sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
for (const url of urls) {
  assert(url.startsWith('https://sezginmesut.com/'), url);
  const file = path.join('_site', new URL(url).pathname, 'index.html');
  assert(fs.existsSync(file), `Missing sitemap page: ${file}`);
  assert(!fs.readFileSync(file, 'utf8').includes('noindex'), `Noindex sitemap page: ${file}`);
}
assert(!sitemap.includes('/kategori/ahsap/'), 'Empty category in sitemap');
assert(fs.readFileSync('_site/index.html', 'utf8').includes('href="/blog/istanbul-bursa-honda-sh125/"'), 'Homepage discovery link');
for (const input of ['http://sezginmesut.com/blog/?x=1', 'https://www.sezginmesut.com/blog/?x=1', 'https://shiny-band-eca5.sezgindesigner.workers.dev/blog/?x=1']) {
  const response = await worker.fetch(new Request(input), {});
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://sezginmesut.com/blog/?x=1');
}
const response = await worker.fetch(new Request('https://sezginmesut.com/blog/'), { ASSETS: { fetch: () => new Response('asset') } });
assert.equal(await response.text(), 'asset');
console.log(`SEO checks passed: ${pages} HTML pages, ${urls.length} sitemap URLs, JSON-LD, tracking and Worker redirects.`);
