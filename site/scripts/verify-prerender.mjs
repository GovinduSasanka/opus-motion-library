/*
 * Post-build check (runs at the end of `npm run build`): fails the build if the prerendered SEO output is incomplete.
 *  - one /motion/<id>/ page per catalog.json entry, one /category/<id>/ per category, one /recipe/<id>/ per recipe
 *  - sitemap.xml lists every page and every listed URL exists in dist/
 *  - robots.txt, 404.html, landing tags present; unique <title>, one <h1>, canonical, description, valid JSON-LD on every page
 *  - every internal href/src that starts with the base path resolves to a file
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(SITE, '..');
const DIST = path.join(SITE, 'dist');
let BASE = process.env.SITE_BASE ?? '/opus-motion-library/';
if (!BASE.startsWith('/')) BASE = `/${BASE}`;
if (!BASE.endsWith('/')) BASE = `${BASE}/`;
const ORIGIN = (process.env.SITE_ORIGIN ?? 'https://govindusasanka.github.io').replace(/\/+$/, '');

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
const recipes = fs.readdirSync(path.join(ROOT, 'recipes')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
const cats = [...new Set(catalog.map((m) => m.category))];

const errors = [];
const fail = (m) => errors.push(m);
const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const exists = (u) => {
  let p = decodeURIComponent(u.slice(BASE.length).split('#')[0].split('?')[0]);
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return fs.existsSync(path.join(DIST, p));
};

for (const m of catalog) if (!fs.existsSync(path.join(DIST, 'motion', m.id, 'index.html'))) fail(`missing page: motion/${m.id}/`);
for (const c of cats) if (!fs.existsSync(path.join(DIST, 'category', c, 'index.html'))) fail(`missing page: category/${c}/`);
for (const r of recipes) if (!fs.existsSync(path.join(DIST, 'recipe', r, 'index.html'))) fail(`missing page: recipe/${r}/`);
for (const f of ['index.html', 'gallery/index.html', 'recipes/index.html', 'transitions/index.html', 'styles/index.html', 'docs/index.html', '404.html', 'sitemap.xml', 'robots.txt', 'media/og-card.png', 'static/site.css'])
  if (!fs.existsSync(path.join(DIST, f))) fail(`missing file: ${f}`);

const titles = new Map();
const htmls = walk(DIST).filter((f) => f.endsWith('.html'));
let jsonld = 0;
for (const f of htmls) {
  const rel = path.relative(DIST, f).replace(/\\/g, '/');
  const h = fs.readFileSync(f, 'utf8');
  const title = (h.match(/<title>([^<]*)<\/title>/) ?? [])[1];
  if (!title) fail(`no <title>: ${rel}`);
  if (rel !== '404.html') {
    if (title && titles.has(title)) fail(`duplicate <title> in ${rel} and ${titles.get(title)}`);
    titles.set(title, rel);
    if (!/<link rel="canonical" href="https:\/\//.test(h)) fail(`no canonical: ${rel}`);
    if (!/<meta name="description" content="[^"]{40,}"/.test(h)) fail(`no/short meta description: ${rel}`);
    if (!/<meta property="og:image" content="https:\/\//.test(h)) fail(`no og:image: ${rel}`);
    if (!/<meta name="twitter:card"/.test(h)) fail(`no twitter:card: ${rel}`);
    if ((h.match(/<h1[ >]/g) ?? []).length !== 1) fail(`expected exactly one <h1>: ${rel}`);
  }
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
      jsonld++;
    } catch {
      fail(`invalid JSON-LD: ${rel}`);
    }
  }
  const bad = new Set();
  for (const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) if (BASE !== '/' ? m[1].startsWith(BASE) && !exists(m[1]) : !exists(`/${m[1].slice(1)}`)) bad.add(m[1]);
  for (const u of bad) fail(`broken internal reference in ${rel}: ${u}`);
}

const sitemap = fs.existsSync(path.join(DIST, 'sitemap.xml')) ? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8') : '';
const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
const expected = 1 + 1 + cats.length + 4 + catalog.length + recipes.length; // landing, gallery, categories, recipes/transitions/styles/docs, motions, recipe pages
if (locs.length !== expected) fail(`sitemap has ${locs.length} URLs, expected ${expected}`);
for (const l of locs) {
  if (!l.startsWith(`${ORIGIN}${BASE}`)) fail(`sitemap URL outside base: ${l}`);
  else if (!exists(l.slice(ORIGIN.length))) fail(`sitemap URL without a file: ${l}`);
}
for (const m of catalog) if (!locs.includes(`${ORIGIN}${BASE}motion/${m.id}/`)) fail(`sitemap lacks motion/${m.id}/`);
const robots = fs.existsSync(path.join(DIST, 'robots.txt')) ? fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8') : '';
if (!robots.includes(`Sitemap: ${ORIGIN}${BASE}sitemap.xml`)) fail('robots.txt does not point to the sitemap');

if (errors.length) {
  console.error(`prerender verification FAILED (${errors.length}):\n  ${errors.slice(0, 40).join('\n  ')}`);
  process.exit(1);
}
console.log(`prerender verified: ${htmls.length} HTML pages, ${catalog.length} motion pages, ${cats.length} categories, ${recipes.length} recipes, ${locs.length} sitemap URLs, ${jsonld} JSON-LD blocks, titles unique, internal links resolve`);
