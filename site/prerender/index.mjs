/*
 * Build-time prerenderer. Runs after `vite build` (see `npm run build`) and turns the data files of the library into
 * real, crawlable HTML — no JavaScript needed to read any page:
 *
 *   /                          landing (the Vite index.html, with SEO head tags + a static fallback inside #root)
 *   /gallery/                  every motion on one page, by category
 *   /category/<id>/            one page per category
 *   /motion/<id>/              one page per motion in catalog.json (props, code, related motions, JSON-LD)
 *   /recipes/ + /recipe/<id>/  recipes
 *   /transitions/  /styles/  /docs/
 *   /404.html  /sitemap.xml  /robots.txt  /llms.txt
 *
 * Every count comes from catalog.json / styles.json / transitions.json / recipes/*.json at build time.
 * Env: SITE_BASE (default /opus-motion-library/), SITE_ORIGIN (default https://govindusasanka.github.io).
 * Reuses src/snippets.ts and src/seo-content.ts through esbuild (already a dependency of Vite), so the code samples and
 * the copy are the same as in the React app.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(SITE, '..');
const DIST = path.join(SITE, 'dist');

let BASE = process.env.SITE_BASE ?? '/opus-motion-library/';
if (!BASE.startsWith('/')) BASE = `/${BASE}`;
if (!BASE.endsWith('/')) BASE = `${BASE}/`;
const ORIGIN = (process.env.SITE_ORIGIN ?? 'https://govindusasanka.github.io').replace(/\/+$/, '');
const BUILD_DATE = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('site/dist/index.html not found — run `vite build` first');

// ---------------------------------------------------------------- shared TypeScript (snippets + copy) bundled for Node
const cache = path.join(SITE, 'node_modules', '.cache', 'mgl-prerender');
fs.mkdirSync(cache, {recursive: true});
await build({
  entryPoints: {snippets: path.join(SITE, 'src/snippets.ts'), content: path.join(SITE, 'src/seo-content.ts')},
  outdir: cache,
  bundle: true,
  format: 'esm',
  platform: 'node',
  outExtension: {'.js': '.mjs'},
  logLevel: 'error',
});
const {motionSnippets, recipeSnippets, transitionSnippets} = await import(pathToFileURL(path.join(cache, 'snippets.mjs')).href);
const C = await import(pathToFileURL(path.join(cache, 'content.mjs')).href);
const {REPO_URL, SITE_NAME, HEADLINE, TITLE_TAG, KEYWORDS} = C;

// ---------------------------------------------------------------- data
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const catalog = readJson(path.join(ROOT, 'catalog.json')).sort((a, b) => a.title.localeCompare(b.title));
const styles = readJson(path.join(ROOT, 'styles.json'));
const transitionFrames = readJson(path.join(ROOT, 'transitions.json'));
const transitions = C.parseTransitions(fs.readFileSync(path.join(ROOT, 'docs/TRANSITIONS.md'), 'utf8'), transitionFrames);
const recipes = fs
  .readdirSync(path.join(ROOT, 'recipes'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => readJson(path.join(ROOT, 'recipes', f)))
  .sort((a, b) => a.title.localeCompare(b.title));
const byId = new Map(catalog.map((m) => [m.id, m]));
const catIds = C.orderCategories(catalog.map((m) => m.category));
const byCat = new Map(catIds.map((c) => [c, catalog.filter((m) => m.category === c)]));
const totals = {motions: catalog.length, styles: styles.length, transitions: transitions.length, recipes: recipes.length, categories: catIds.length};

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => {
  s = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 30))}…`;
};
/** a meta description of at most n characters: whole sentences when they fit, else cut at a word */
const metaDesc = (text, suffix, n = 158) => {
  text = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (text.length + suffix.length + 1 <= n) return `${text} ${suffix}`;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = '';
  for (const sn of sentences) {
    if ((out + sn).trim().length > n) break;
    out += sn;
  }
  return out.trim().length > 60 ? out.trim() : clip(text, n);
};
/** JSON for <script type="application/ld+json">: no raw "<" so it can never close the tag */
const ld = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const rel = (p = '') => `${BASE}${p}`; // site-relative URL (honours the base path)
const abs = (p = '') => `${ORIGIN}${BASE}${p}`; // absolute URL
const catInfo = (id) => C.categoryInfo(id);
const money = (n) => n.toLocaleString('en-US');

const jpegCache = new Map();
/** {w, h} of a JPEG in dist, or null if the file is missing */
const jpegSize = (relPath) => {
  if (jpegCache.has(relPath)) return jpegCache.get(relPath);
  let out = null;
  try {
    const b = fs.readFileSync(path.join(DIST, relPath));
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        out = {w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5)};
        break;
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  } catch {
    out = null;
  }
  jpegCache.set(relPath, out);
  return out;
};

const fmtVal = (v) => {
  const s = JSON.stringify(v);
  if (s === undefined) return '—';
  return s.length > 90 ? `${s.slice(0, 87)}…` : s;
};
const starterProps = (m) => {
  const keys = [...m.textProps, ...m.colorProps, ...m.imageProps];
  const pick = keys.length ? keys : Object.keys(m.props).slice(0, 4);
  const out = {};
  for (const k of pick) if (m.props[k]) out[k] = m.props[k].default;
  return out;
};

const writePage = (urlPath, html) => {
  const file = path.join(DIST, urlPath, 'index.html');
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, html);
};

// cache-bust the shared static assets
const hash = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
fs.mkdirSync(path.join(DIST, 'static'), {recursive: true});
for (const f of ['site.css', 'site.js']) fs.copyFileSync(path.join(SITE, 'static', f), path.join(DIST, 'static', f));
const CSS = `${rel('static/site.css')}?v=${hash(path.join(SITE, 'static/site.css'))}`;
const JS = `${rel('static/site.js')}?v=${hash(path.join(SITE, 'static/site.js'))}`;

const SOCIAL_CARD = {path: 'media/og-card.png', w: 1200, h: 630, alt: `${SITE_NAME}: ${HEADLINE}`};
const OWNER = {'@type': 'Person', name: 'Govindu Sasanka', url: 'https://github.com/GovinduSasanka'};
const SITE_ID = `${abs()}#website`;
const MIT = 'https://opensource.org/licenses/MIT';

// ---------------------------------------------------------------- <head>
const FONTS = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';

/** the SEO-relevant part of <head>, shared by every page (also used to rewrite the landing page) */
const seoHead = ({title, description, canonical, image, robots = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1', ogType = 'website', jsonld = []}) => {
  const img = image ?? {url: abs(SOCIAL_CARD.path), w: SOCIAL_CARD.w, h: SOCIAL_CARD.h, alt: SOCIAL_CARD.alt};
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : '',
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    canonical ? `<meta property="og:url" content="${esc(canonical)}" />` : '',
    `<meta property="og:image" content="${esc(img.url)}" />`,
    img.w ? `<meta property="og:image:width" content="${img.w}" />` : '',
    img.h ? `<meta property="og:image:height" content="${img.h}" />` : '',
    `<meta property="og:image:alt" content="${esc(img.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img.url)}" />`,
    `<meta name="twitter:image:alt" content="${esc(img.alt)}" />`,
    ...jsonld.map((j) => `<script type="application/ld+json">${ld(j)}</script>`),
  ]
    .filter(Boolean)
    .join('\n    ');
};

const BRAND_SVG = '<svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="19" fill="none" stroke="#E9C27A" stroke-width="5"/><circle cx="45.5" cy="18.5" r="6" fill="#F2EEE6"/></svg>';

const NAV = [
  ['gallery/', 'Gallery'],
  ['recipes/', 'Recipes'],
  ['transitions/', 'Transitions'],
  ['styles/', 'Styles'],
  ['docs/', 'Docs'],
];

const header = (current) => `<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${rel()}" aria-label="${SITE_NAME} home">${BRAND_SVG}<span>Opus <em>Motion</em></span></a>
    <nav class="site-nav" aria-label="Main">
      ${NAV.map(([p, l]) => `<a href="${rel(p)}"${current === p ? ' aria-current="page"' : ''}>${l}</a>`).join('\n      ')}
      <a href="${rel('#/gallery')}" title="Play every motion live in the browser">Live gallery</a>
    </nav>
    <a class="star-link" href="${REPO_URL}" rel="noopener" aria-label="Star ${SITE_NAME} on GitHub">★ Star on GitHub <span class="n" data-star-count></span></a>
  </div>
</header>`;

const footer = () => `<footer class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <h2>${SITE_NAME}</h2>
        <p>${totals.motions} motions · ${totals.styles} styles · ${totals.transitions} transitions · ${totals.recipes} recipes — ${HEADLINE.toLowerCase()}. Free, MIT-licensed, built on <a href="https://www.remotion.dev" rel="noopener">Remotion</a>, React, SVG and three.js.</p>
      </div>
      <div>
        <h2>Explore</h2>
        <ul>
          <li><a href="${rel('gallery/')}">All ${totals.motions} motions</a></li>
          <li><a href="${rel('recipes/')}">Recipes</a></li>
          <li><a href="${rel('transitions/')}">Transitions</a></li>
          <li><a href="${rel('styles/')}">Styles</a></li>
          <li><a href="${rel('docs/')}">Docs</a></li>
          <li><a href="${rel('#/gallery')}">Live gallery</a></li>
        </ul>
      </div>
      <div>
        <h2>Categories</h2>
        <ul>
          ${catIds.slice(0, 10).map((c) => `<li><a href="${rel(`category/${c}/`)}">${esc(catInfo(c).title)}</a></li>`).join('\n          ')}
        </ul>
      </div>
      <div>
        <h2>Project</h2>
        <ul>
          <li><a href="${REPO_URL}" rel="noopener">GitHub</a></li>
          <li><a href="${REPO_URL}/blob/main/AGENTS.md" rel="noopener">AGENTS.md</a></li>
          <li><a href="${REPO_URL}/releases" rel="noopener">Releases</a></li>
          <li><a href="${REPO_URL}/issues" rel="noopener">Issues</a></li>
          <li><a href="${REPO_URL}/blob/main/LICENSE" rel="noopener">MIT licence</a></li>
        </ul>
      </div>
    </div>
    <p class="legal">Code released under the MIT licence. Remotion is source-available — see remotion.dev/license for company use. An independent open-source project.</p>
  </div>
</footer>`;

/** a complete static page */
const page = ({urlPath, title, description, current, body, image, preload, jsonld = [], robots, ogType}) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#07080B" />
    ${seoHead({title, description, canonical: abs(urlPath), image, jsonld, robots, ogType})}
    <link rel="icon" type="image/svg+xml" href="${rel('favicon.svg')}" />
    ${preload ? `<link rel="preload" as="image" href="${esc(preload)}" fetchpriority="high" />` : ''}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${FONTS}" />
    <link rel="stylesheet" href="${CSS}" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    ${header(current)}
    <main id="main" class="wrap">
${body}
    </main>
    ${footer()}
    <script src="${JS}" defer></script>
  </body>
</html>
`;

const crumbs = (items) =>
  `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([label, p], i) => (i === items.length - 1 ? `<li aria-current="page">${esc(label)}</li>` : `<li><a href="${rel(p)}">${esc(label)}</a></li>`)).join('')}</ol></nav>`;

const crumbLd = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([label, p], i) => ({'@type': 'ListItem', position: i + 1, name: label, item: abs(p)})),
});

const snippetBlock = (label, lang, code) =>
  `<div class="snippet"><div class="snippet-bar"><span>${esc(label)}</span><button type="button" data-copy aria-label="Copy ${esc(label)}">Copy</button></div><pre><code class="language-${lang}">${esc(code)}</code></pre></div>`;

// ---------------------------------------------------------------- cards
const hasGallery = (id) => Boolean(jpegSize(`gallery/${id}.jpg`));

const motionCard = (m, {lazy = true} = {}) => {
  const sz = jpegSize(`gallery/${m.id}.jpg`);
  // the preview strip is 3 frames wide: each card shows the middle frame (CSS), so width/height describe the strip
  const img = sz
    ? `<img src="${rel(`gallery/${m.id}.jpg`)}" alt="${esc(`${m.title} — ${catInfo(m.category).noun} preview`)}" width="${sz.w}" height="${sz.h}" ${lazy ? 'loading="lazy"' : ''} decoding="async" />`
    : `<span class="ph">${esc(catInfo(m.category).label)}</span>`;
  return `<li><a class="card" href="${rel(`motion/${m.id}/`)}"><div class="thumb">${img}</div><div class="card-body"><h3>${esc(m.title)}</h3><p>${esc(clip(m.useFor || m.description, 140))}</p><code>${esc(m.id)}</code></div></a></li>`;
};

const recipeCard = (r) => {
  const has = fs.existsSync(path.join(DIST, 'recipes', `${r.id}.jpg`));
  const sz = has ? jpegSize(`recipes/${r.id}.jpg`) : null;
  const img = sz ? `<img src="${rel(`recipes/${r.id}.jpg`)}" alt="${esc(`${r.title} recipe preview`)}" width="${sz.w}" height="${sz.h}" loading="lazy" decoding="async" />` : `<span class="ph">recipe</span>`;
  return `<li><a class="card" href="${rel(`recipe/${r.id}/`)}"><div class="thumb">${img}</div><div class="card-body"><h3>${esc(r.title)}</h3><p>${esc(clip(r.useFor, 150))}</p><code>${esc(r.id)}</code></div></a></li>`;
};

// ---------------------------------------------------------------- related motions
const tagSet = new Map(catalog.map((m) => [m.id, new Set((m.tags ?? []).map((t) => t.toLowerCase()))]));
const reverseSets = new Map();
for (const m of catalog) for (const p of m.pairsWith ?? []) (reverseSets.get(p) ?? reverseSets.set(p, new Set()).get(p)).add(m.id);
const related = (m, n = 6) => {
  const mine = tagSet.get(m.id);
  const scored = [];
  for (const o of catalog) {
    if (o.id === m.id) continue;
    let s = 0;
    if ((m.pairsWith ?? []).includes(o.id)) s += 6;
    if (reverseSets.get(m.id)?.has(o.id)) s += 3;
    if (o.category === m.category) s += 2;
    for (const t of tagSet.get(o.id)) if (mine.has(t)) s += 1;
    for (const k of o.mood ?? []) if ((m.mood ?? []).includes(k)) s += 0.5;
    if (s > 2 && hasGallery(o.id)) scored.push([s, o]);
  }
  scored.sort((a, b) => b[0] - a[0] || a[1].id.localeCompare(b[1].id));
  return scored.slice(0, n).map(([, o]) => o);
};

// ---------------------------------------------------------------- motion pages
const yesNo = (v) => (v ? 'yes' : 'no');
const fmtList = (a) => (a && a.length ? a.join(', ') : '—');
const motionPage = (m) => {
  const info = catInfo(m.category);
  const urlPath = `motion/${m.id}/`;
  const sz = jpegSize(`gallery/${m.id}.jpg`);
  const imgUrl = sz ? abs(`gallery/${m.id}.jpg`) : null;
  const secs = (m.bestLength / 30).toFixed(1);
  const props = starterProps(m);
  const snips = motionSnippets(m.id, props, 'landscape', m.overlay);
  const snip = (id) => snips.find((s) => s.id === id);
  const title = `${m.title} — free ${info.noun} for Remotion & React | Opus Motion`;
  const description = metaDesc(m.description, `Free ${info.noun} for Remotion & React.`);
  const alt = `${m.title}: three frames of the ${info.noun}, start, middle and end`;
  const rels = related(m);
  const crumbItems = [['Home', ''], ['Gallery', 'gallery/'], [info.title, `category/${m.category}/`], [m.title, urlPath]];
  const sources = (m.source ?? []).filter(Boolean);

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        crumbLd(crumbItems),
        {
          '@type': 'SoftwareSourceCode',
          '@id': `${abs(urlPath)}#code`,
          name: m.title,
          description: m.description,
          url: abs(urlPath),
          mainEntityOfPage: abs(urlPath),
          ...(imgUrl ? {image: {'@type': 'ImageObject', url: imgUrl, width: sz.w, height: sz.h, caption: alt}, thumbnailUrl: imgUrl} : {}),
          keywords: [...(m.tags ?? []), 'motion graphics', 'Remotion', 'React'].join(', '),
          genre: info.title,
          applicationCategory: 'MultimediaApplication',
          programmingLanguage: {'@type': 'ComputerLanguage', name: 'TypeScript'},
          runtimePlatform: 'Remotion',
          codeRepository: REPO_URL,
          sameAs: `${REPO_URL}/blob/main/${m.file}`,
          license: MIT,
          isAccessibleForFree: true,
          author: OWNER,
          isPartOf: {'@type': 'WebSite', '@id': SITE_ID, name: SITE_NAME, url: abs()},
          dateModified: BUILD_DATE,
        },
      ],
    },
  ];

  const body = `      ${crumbs(crumbItems)}
      <article>
        <header>
          <p class="eyebrow"><a href="${rel(`category/${m.category}/`)}" style="color:inherit;text-decoration:none">${esc(info.label)}</a> · ${esc(m.id)}</p>
          <h1>${esc(m.title)}</h1>
          <p class="lead">${esc(m.description)}</p>
          <p class="muted">A free, MIT-licensed ${esc(info.noun)} from the ${SITE_NAME} — ${totals.motions} motions for Remotion, React and plain HTML.</p>
        </header>
        ${
          sz
            ? `<figure class="strip"><img src="${rel(`gallery/${m.id}.jpg`)}" alt="${esc(alt)}" width="${sz.w}" height="${sz.h}" fetchpriority="high" decoding="async" /><figcaption>${esc(m.title)} — start, middle and end of the ${secs}-second motion.</figcaption></figure>`
            : `<div class="strip missing">Preview strip not rendered yet — <a href="${rel(`#/gallery/${m.id}`)}">play ${esc(m.title)} live</a>.</div>`
        }
        <div class="cta-row">
          <a class="btn btn-gold" href="${rel(`#/gallery/${m.id}`)}">▶ Play it live &amp; edit props</a>
          <a class="btn btn-ghost" href="${REPO_URL}/blob/main/${esc(m.file)}" rel="noopener">View source on GitHub</a>
          <a class="btn btn-ghost" href="${REPO_URL}" rel="noopener">★ Star the library</a>
        </div>

        <section class="block" aria-labelledby="use">
          <h2 id="use">What ${esc(m.title)} is for</h2>
          <p class="lead">${esc(m.useFor)}</p>
          ${m.tags?.length ? `<ul class="tags" aria-label="Tags">${m.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        </section>

        <section class="block" aria-labelledby="facts">
          <h2 id="facts">Details</h2>
          <dl class="facts">
            <dt>Category</dt><dd><a href="${rel(`category/${m.category}/`)}">${esc(info.title)}</a></dd>
            <dt>Length</dt><dd>${secs} s (${m.durationInFrames} frames at 30 fps)${m.bestLength !== m.durationInFrames ? `, best at ${(m.bestLength / 30).toFixed(1)} s` : ''}</dd>
            <dt>Formats</dt><dd>${esc(fmtList((m.formats ?? []).map((f) => ({landscape: '16:9', square: '1:1', portrait: '9:16'}[f] ?? f))))}</dd>
            <dt>Weight</dt><dd>${esc(m.weight)}${m.weight === 'heavy' ? ' (three.js / WebGL — export to video for mobile)' : ''}</dd>
            <dt>Transparent overlay</dt><dd>${yesNo(m.overlay)}</dd>
            <dt>Seamless loop</dt><dd>${yesNo(m.loopable)}</dd>
            <dt>Text props</dt><dd>${m.textProps?.length ? m.textProps.map((p) => `<code>${esc(p)}</code>`).join(' ') : '—'}</dd>
            <dt>Colour props</dt><dd>${m.colorProps?.length ? m.colorProps.map((p) => `<code>${esc(p)}</code>`).join(' ') : '—'}</dd>
            ${m.takesImage ? `<dt>Image props</dt><dd>${m.imageProps.map((p) => `<code>${esc(p)}</code>`).join(' ')}</dd>` : ''}
            <dt>Mood</dt><dd>${esc(fmtList(m.mood))}</dd>
            <dt>Roles</dt><dd>${esc(fmtList(m.roles))}</dd>
            ${(m.pairsWith ?? []).filter((p) => byId.has(p)).length ? `<dt>Pairs with</dt><dd>${m.pairsWith.filter((p) => byId.has(p)).map((p) => `<a href="${rel(`motion/${p}/`)}">${esc(byId.get(p).title)}</a>`).join(', ')}</dd>` : ''}
            ${m.avoid ? `<dt>Avoid</dt><dd>${esc(m.avoid)}</dd>` : ''}
          </dl>
        </section>

        <section class="block" aria-labelledby="code">
          <h2 id="code">Use ${esc(m.title)} in Remotion, React or HTML</h2>
          <h3>Remotion project</h3>
          ${snippetBlock('terminal', 'bash', `# copy this motion into your Remotion project\nnode cli/mgl.mjs add ${m.id} --to ../my-app/src\n\n${snip('cli').code}`)}
          <h3>React / Next.js</h3>
          ${snippetBlock('tsx', 'tsx', snip('react').code)}
          <h3>Plain HTML / WordPress</h3>
          ${snippetBlock('html', 'html', snip('html').code)}
          <h3>Compose spec (multi-scene video)</h3>
          ${snippetBlock('json', 'json', snip('spec').code)}
        </section>

        ${
          Object.keys(m.props ?? {}).length
            ? `<section class="block" aria-labelledby="props">
          <h2 id="props">${esc(m.title)} props</h2>
          <p class="muted">${Object.keys(m.props).length} parameters — change any of them to make the motion yours.</p>
          <div class="table-wrap"><table>
            <thead><tr><th scope="col">Prop</th><th scope="col">Default</th><th scope="col">What it does</th></tr></thead>
            <tbody>
              ${Object.entries(m.props).map(([k, v]) => `<tr><td><code>${esc(k)}</code></td><td><code>${esc(fmtVal(v.default))}</code></td><td>${esc(v.doc ?? '')}</td></tr>`).join('\n              ')}
            </tbody>
          </table></div>
        </section>`
            : ''
        }

        ${
          rels.length
            ? `<section class="block" aria-labelledby="related">
          <h2 id="related">Related motions</h2>
          <ul class="grid">${rels.map((o) => motionCard(o)).join('')}</ul>
        </section>`
            : ''
        }

        ${
          m.notes || sources.length
            ? `<section class="block prose" aria-labelledby="credits">
          <h2 id="credits">Notes &amp; credits</h2>
          ${m.notes ? `<p>${esc(m.notes)}</p>` : ''}
          ${sources.length ? `<p>Technique sources:</p><ul>${sources.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        </section>`
            : ''
        }
      </article>`;

  writePage(urlPath, page({urlPath, title, description, current: 'gallery/', body, jsonld, image: imgUrl ? {url: imgUrl, w: sz.w, h: sz.h, alt} : undefined, preload: sz ? rel(`gallery/${m.id}.jpg`) : undefined, ogType: 'article'}));
  return {urlPath, imgUrl, title: m.title};
};

// ---------------------------------------------------------------- listing pages
const itemList = (items) => ({
  '@type': 'ItemList',
  numberOfItems: items.length,
  itemListElement: items.map(([name, p], i) => ({'@type': 'ListItem', position: i + 1, url: abs(p), name})),
});

const categoryNav = (active) =>
  `<ul class="toc" aria-label="Categories">${catIds.map((c) => `<li><a class="chip" href="${rel(`category/${c}/`)}"${c === active ? ' aria-current="page" style="border-color:var(--gold);color:var(--text)"' : ''}>${esc(catInfo(c).label)} <span class="dim">${byCat.get(c).length}</span></a></li>`).join('')}</ul>`;

const galleryPage = () => {
  const urlPath = 'gallery/';
  const crumbItems = [['Home', ''], ['Gallery', urlPath]];
  const title = `All ${totals.motions} Motion Graphics — Free Gallery | Opus Motion`;
  const description = clip(`Browse all ${totals.motions} free open-source motion graphics for Remotion and React: lower thirds, animated charts, backgrounds, characters, UI mockups, 3D and transitions.`, 158);
  const body = `      ${crumbs(crumbItems)}
      <header>
        <p class="eyebrow">Gallery</p>
        <h1>${totals.motions} free motion graphics, ${totals.categories} categories</h1>
        <p class="lead">Every motion in the ${SITE_NAME} on one page. Open one for its props and copy-paste code for Remotion, React and HTML — or <a href="${rel('#/gallery')}">play them all live in the interactive gallery</a>.</p>
        ${categoryNav()}
      </header>
      ${catIds
        .map(
          (c) => `<section class="block" id="${c}" aria-labelledby="h-${c}">
        <h2 id="h-${c}"><a href="${rel(`category/${c}/`)}" style="color:inherit;text-decoration:none">${esc(catInfo(c).title)}</a> <span class="dim" style="font-size:.6em">${byCat.get(c).length}</span></h2>
        <p class="muted">${esc(catInfo(c).blurb)}</p>
        <ul class="grid">${byCat.get(c).map((m) => motionCard(m)).join('')}</ul>
      </section>`,
        )
        .join('\n      ')}`;
  writePage(urlPath, page({urlPath, title, description, current: 'gallery/', body, jsonld: [{'@context': 'https://schema.org', '@graph': [crumbLd(crumbItems), {'@type': 'CollectionPage', name: `${SITE_NAME} gallery`, url: abs(urlPath), isPartOf: {'@id': SITE_ID}}, itemList(catalog.map((m) => [m.title, `motion/${m.id}/`]))]}]}));
};

const categoryPage = (c) => {
  const list = byCat.get(c);
  const info = catInfo(c);
  const urlPath = `category/${c}/`;
  const crumbItems = [['Home', ''], ['Gallery', 'gallery/'], [info.title, urlPath]];
  const title = `${info.title} — ${list.length} Free Motions | Opus Motion`;
  const description = clip(`${list.length} free open-source ${info.title.toLowerCase()} for Remotion, React and HTML. ${info.blurb}`, 158);
  const body = `      ${crumbs(crumbItems)}
      <header>
        <p class="eyebrow">Category</p>
        <h1>${esc(info.title)} <span class="dim" style="font-size:.5em">${list.length}</span></h1>
        <p class="lead">${esc(info.blurb)}</p>
        <p class="muted">${list.length} free ${esc(info.noun)}s in the ${SITE_NAME}, each with its props and code for Remotion, React and plain HTML.</p>
        ${categoryNav(c)}
      </header>
      <ul class="grid">${list.map((m) => motionCard(m)).join('')}</ul>
      <div class="cta-row"><a class="btn btn-gold" href="${rel(`#/gallery`)}">▶ Play them live</a><a class="btn btn-ghost" href="${rel('gallery/')}">All ${totals.motions} motions</a></div>`;
  writePage(urlPath, page({urlPath, title, description, current: 'gallery/', body, jsonld: [{'@context': 'https://schema.org', '@graph': [crumbLd(crumbItems), {'@type': 'CollectionPage', name: info.title, description: info.blurb, url: abs(urlPath), isPartOf: {'@id': SITE_ID}}, itemList(list.map((m) => [m.title, `motion/${m.id}/`]))]}]}));
};

const recipesPage = () => {
  const urlPath = 'recipes/';
  const crumbItems = [['Home', ''], ['Recipes', urlPath]];
  const title = `${totals.recipes} Remotion Video Recipes & Templates | Opus Motion`;
  const description = clip(`${totals.recipes} ready-made, previewed motion graphics recipes for Remotion and React: hero backdrops, product launches, stats reveals, testimonials and celebrations. Free, MIT.`, 158);
  const body = `      ${crumbs(crumbItems)}
      <header>
        <p class="eyebrow">Recipes</p>
        <h1>${totals.recipes} ready-made mixes, tested and previewed</h1>
        <p class="lead">A recipe is a layer stack (backdrop + subject + type + accent) or a multi-scene spec with transitions. Start from one, then override the words and colours.</p>
      </header>
      <ul class="grid list-cards">${recipes.map(recipeCard).join('')}</ul>`;
  writePage(urlPath, page({urlPath, title, description, current: 'recipes/', body, jsonld: [{'@context': 'https://schema.org', '@graph': [crumbLd(crumbItems), itemList(recipes.map((r) => [r.title, `recipe/${r.id}/`]))]}]}));
};

const recipePage = (r) => {
  const urlPath = `recipe/${r.id}/`;
  const crumbItems = [['Home', ''], ['Recipes', 'recipes/'], [r.title, urlPath]];
  const has = fs.existsSync(path.join(DIST, 'recipes', `${r.id}.jpg`));
  const sz = has ? jpegSize(`recipes/${r.id}.jpg`) : null;
  const imgUrl = sz ? abs(`recipes/${r.id}.jpg`) : null;
  const snips = recipeSnippets(r);
  const motionIds = [...new Set((r.layers ?? []).concat((r.scenes ?? []).flatMap((s) => (s.layers ?? []).concat(s.motion ? [s] : []))).map((l) => l.motion).filter(Boolean))];
  const used = motionIds.filter((id) => byId.has(id));
  const title = `${r.title} — free Remotion recipe | Opus Motion`;
  const description = metaDesc(r.useFor, `Free ${r.format ?? 'landscape'} Remotion recipe.`);
  const alt = `${r.title} recipe preview`;
  const body = `      ${crumbs(crumbItems)}
      <article>
        <header>
          <p class="eyebrow">Recipe · ${esc(r.format ?? 'landscape')}${r.scenes ? ` · ${r.scenes.length} scenes` : r.layers ? ` · ${r.layers.length} layers` : ''}</p>
          <h1>${esc(r.title)}</h1>
          <p class="lead">${esc(r.useFor)}</p>
          ${r.tags?.length ? `<ul class="tags" aria-label="Tags">${r.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        </header>
        ${sz ? `<figure class="strip"><img src="${rel(`recipes/${r.id}.jpg`)}" alt="${esc(alt)}" width="${sz.w}" height="${sz.h}" fetchpriority="high" decoding="async" /><figcaption>${esc(r.title)} — frames from the recipe.</figcaption></figure>` : ''}
        <div class="cta-row">
          <a class="btn btn-gold" href="${rel(`#/recipes/${r.id}`)}">▶ Play it live</a>
          <a class="btn btn-ghost" href="${REPO_URL}/blob/main/recipes/${esc(r.id)}.json" rel="noopener">Recipe JSON on GitHub</a>
        </div>
        ${
          used.length
            ? `<section class="block" aria-labelledby="made">
          <h2 id="made">Motions in this recipe</h2>
          <ul class="grid">${used.map((id) => motionCard(byId.get(id))).join('')}</ul>
        </section>`
            : ''
        }
        <section class="block" aria-labelledby="code">
          <h2 id="code">Use it in Remotion, React or HTML</h2>
          ${snips.map((s) => `<h3>${esc(s.label)}</h3>${snippetBlock(s.label, s.lang, s.code)}`).join('\n          ')}
        </section>
      </article>`;
  writePage(urlPath, page({urlPath, title, description, current: 'recipes/', body, image: imgUrl ? {url: imgUrl, w: sz.w, h: sz.h, alt} : undefined, preload: sz ? rel(`recipes/${r.id}.jpg`) : undefined, ogType: 'article', jsonld: [{'@context': 'https://schema.org', '@graph': [crumbLd(crumbItems), {'@type': 'SoftwareSourceCode', name: r.title, description: r.useFor, url: abs(urlPath), ...(imgUrl ? {image: imgUrl} : {}), keywords: (r.tags ?? []).join(', '), codeRepository: REPO_URL, license: MIT, programmingLanguage: 'TypeScript', isAccessibleForFree: true, author: OWNER, isPartOf: {'@id': SITE_ID}}]}]}));
  return {urlPath, imgUrl, title: r.title};
};

const transitionsPage = () => {
  const urlPath = 'transitions/';
  const crumbItems = [['Home', ''], ['Transitions', urlPath]];
  const title = `${totals.transitions} Video Transitions for Remotion | Opus Motion`;
  const description = clip(`${totals.transitions} free video transitions for Remotion and React — iris, wipes, ink, torn paper, glitch and more — with fields and recommended lengths. MIT licensed.`, 158);
  const spec = transitionSnippets('iris', 'bloom').find((s) => s.id === 'spec');
  const body = `      ${crumbs(crumbItems)}
      <header>
        <p class="eyebrow">Transitions</p>
        <h1>${totals.transitions} video transitions, ready to chain</h1>
        <p class="lead">Scene-to-scene transitions for Remotion compose specs: iris, wipes, ink, torn paper, glitch, page turns and more. Put one on any scene with <code>"transition": {"type": "…"}</code>.</p>
      </header>
      <section class="block" aria-labelledby="usage"><h2 id="usage">Add a transition to a scene</h2>${snippetBlock('compose spec', 'json', spec.code)}</section>
      <section class="block" aria-labelledby="all">
        <h2 id="all">All transitions</h2>
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Transition</th><th scope="col">Looks like</th><th scope="col">Length</th><th scope="col">Fields</th></tr></thead>
          <tbody>
            ${transitions.map((t) => `<tr id="${C.transitionSlug(t.key)}"><td><code>${esc(t.key)}</code></td><td>${esc(t.looks)}</td><td>${t.frames} frames (${(t.frames / 30).toFixed(1)} s)</td><td class="dim">${esc(t.fields)}</td></tr>`).join('\n            ')}
          </tbody>
        </table></div>
      </section>
      <div class="cta-row"><a class="btn btn-gold" href="${rel('#/transitions')}">▶ Preview them live</a><a class="btn btn-ghost" href="${REPO_URL}/blob/main/docs/TRANSITIONS.md" rel="noopener">Full reference on GitHub</a></div>`;
  writePage(urlPath, page({urlPath, title, description, current: 'transitions/', body, jsonld: [{'@context': 'https://schema.org', '@graph': [crumbLd(crumbItems), {'@type': 'CollectionPage', name: `${SITE_NAME} transitions`, url: abs(urlPath), isPartOf: {'@id': SITE_ID}}]}]}));
};

const stylesPage = () => {
  const urlPath = 'styles/';
  const crumbItems = [['Home', ''], ['Styles', urlPath]];
  const title = `${totals.styles} One-Line Visual Styles for Motion Graphics | Opus Motion`;
  const description = clip(`${totals.styles} free visual styles — woodcut, risograph, blueprint, neon noir, anime cel — that restyle any Remotion motion or video with one id. MIT licensed.`, 158);
  const fams = [...new Set(styles.map((s) => s.family))];
  const body = `      ${crumbs(crumbItems)}
      <header>
        <p class="eyebrow">Styles</p>
        <h1>${totals.styles} one-line visual styles</h1>
        <p class="lead">A style is one id that changes the whole look of a motion, a mix or a video — a woodcut print, a risograph, a blueprint, neon noir, anime cel — while the code and props stay the same.</p>
        ${snippetBlock('terminal', 'bash', 'node cli/mgl.mjs render box-bot --style cel-boil\nnode cli/mgl.mjs still ken-burns --style ukiyoe --out out/ukiyoe.png')}
        <ul class="toc" aria-label="Style families">${fams.map((f) => `<li><a class="chip" href="#f-${esc(f)}">${esc(f)}</a></li>`).join('')}</ul>
      </header>
      ${fams
        .map(
          (f) => `<section class="block" id="f-${esc(f)}" aria-labelledby="h-${esc(f)}">
        <h2 id="h-${esc(f)}" style="text-transform:capitalize">${esc(f)} styles</h2>
        <ul class="grid list-cards">${styles
          .filter((s) => s.family === f)
          .map((s) => `<li><div class="card"><div class="card-body"><h3>${esc(s.name)}</h3><p>${esc(clip(s.useFor || s.description, 150))}</p><code>--style ${esc(s.id)}</code><div class="swatches" aria-hidden="true">${(s.palette?.swatches ?? []).map((c) => `<i style="background:${esc(c)}"></i>`).join('')}</div></div></div></li>`)
          .join('')}</ul>
      </section>`,
        )
        .join('\n      ')}`;
  writePage(urlPath, page({urlPath, title, description, current: 'styles/', body, jsonld: [{'@context': 'https://schema.org', '@graph': [crumbLd(crumbItems), {'@type': 'CollectionPage', name: `${SITE_NAME} styles`, url: abs(urlPath), isPartOf: {'@id': SITE_ID}}]}]}));
};

const docsPage = () => {
  const urlPath = 'docs/';
  const crumbItems = [['Home', ''], ['Docs', urlPath]];
  const title = `Docs: Remotion, React, HTML & MCP Guides | Opus Motion`;
  const description = clip(`Quick start, integration guides for Remotion, Next.js, React and plain HTML, the MCP server and AGENTS.md for AI agents — everything for the ${SITE_NAME}.`, 158);
  const items = C.docsList(totals);
  const body = `      ${crumbs(crumbItems)}
      <header>
        <p class="eyebrow">Docs</p>
        <h1>Everything is in the repo, in plain Markdown</h1>
        <p class="lead">Guides for Remotion, React, Next.js and plain HTML, the MCP server, and AGENTS.md for AI agents. These open on GitHub — your AI agent reads the same files.</p>
      </header>
      <ul class="grid list-cards">${items.map((d) => `<li><a class="card" href="${esc(d.url)}" rel="noopener"><div class="card-body"><p class="eyebrow" style="margin:0 0 6px">${esc(d.tag)}</p><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p></div></a></li>`).join('')}</ul>`;
  writePage(urlPath, page({urlPath, title, description, current: 'docs/', body, jsonld: [{'@context': 'https://schema.org', '@graph': [crumbLd(crumbItems)]}]}));
};

// ---------------------------------------------------------------- landing: rewrite dist/index.html (the React app) with real tags + static fallback
const landing = () => {
  const file = path.join(DIST, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const title = TITLE_TAG;
  const description = C.metaDescription(totals);
  const faq = C.faq(totals);
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {'@type': 'WebSite', '@id': SITE_ID, url: abs(), name: SITE_NAME, description, inLanguage: 'en', publisher: OWNER},
        {
          '@type': 'SoftwareSourceCode',
          '@id': `${abs()}#code`,
          name: SITE_NAME,
          description: `${HEADLINE}: ${C.subline(totals)}.`,
          url: abs(),
          codeRepository: REPO_URL,
          programmingLanguage: [{'@type': 'ComputerLanguage', name: 'TypeScript'}],
          runtimePlatform: 'Remotion, React, Node.js',
          license: MIT,
          isAccessibleForFree: true,
          keywords: KEYWORDS.join(', '),
          image: abs(SOCIAL_CARD.path),
          author: OWNER,
        },
        {
          '@type': 'SoftwareApplication',
          name: SITE_NAME,
          applicationCategory: 'DeveloperApplication',
          applicationSubCategory: 'Motion graphics library',
          operatingSystem: 'Windows, macOS, Linux, Web',
          url: abs(),
          description,
          image: abs(SOCIAL_CARD.path),
          license: MIT,
          offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
          author: OWNER,
        },
        {'@type': 'FAQPage', mainEntity: faq.map((f) => ({'@type': 'Question', name: f.q, acceptedAnswer: {'@type': 'Answer', text: f.a.replace(/`/g, '')}}))},
      ],
    },
  ];
  const head = seoHead({title, description, canonical: abs(), jsonld});
  html = html.replace(/<!-- seo:head:start -->[\s\S]*?<!-- seo:head:end -->/, () => `<!-- seo:head:start -->\n    ${head}\n    <!-- seo:head:end -->`);
  if (!html.includes('seo:head:start')) throw new Error('index.html is missing the <!-- seo:head:start --> marker');

  const faqHtml = faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a.replace(/`/g, ''))}</p></details>`).join('');
  const featured = ['aurora', 'stamp-slam', 'number-counter', 'live-chart', 'ken-burns', 'neon-sign', 'fireworks', 'city-skyline'].filter((id) => byId.has(id));
  const fallback = `
      <header class="nav is-solid"><div class="nav-inner">
        <a class="brand" href="${rel()}" aria-label="${SITE_NAME} home">${BRAND_SVG}<span>Opus <em>Motion</em></span></a>
        <nav class="nav-links" aria-label="Main">${NAV.map(([p, l]) => `<a href="${rel(p)}">${l}</a>`).join('')}</nav>
        <a class="nav-gh" href="${REPO_URL}" rel="noopener"><span>GitHub</span></a>
      </div></header>
      <main id="main">
        <section class="hero"><div class="hero-content wrap">
          <p class="kicker"><span class="dot"></span> Open source · MIT · Remotion + React</p>
          <h1 class="display hero-title">${esc(HEADLINE.split('open-source')[0])}<span class="nb">open-source</span> <em>motion graphics library</em></h1>
          <p class="hero-stats">${esc(C.subline(totals))}</p>
          <p class="lede">${esc(C.lede(totals))}</p>
          <div class="cta-row">
            <a class="btn btn-gold" href="${REPO_URL}" rel="noopener">★ Star on GitHub</a>
            <a class="btn btn-ghost" href="${rel('gallery/')}">Browse gallery →</a>
            <a class="btn btn-ghost" href="#/quickstart">Quick start</a>
          </div>
        </div></section>
        <section class="section wrap" aria-labelledby="cats-h">
          <h2 class="h2" id="cats-h">Free motion graphics for every kind of video</h2>
          <p class="sub">Lower thirds and kinetic typography, animated charts, backgrounds, characters, UI mockups, 3D, HUDs and video transitions — each motion has its own page with props and copy-paste code for Remotion, React and HTML.</p>
          <ul class="cat-grid">${catIds.map((c) => `<li><a class="cat-tile" href="${rel(`category/${c}/`)}"><b>${esc(catInfo(c).title)}</b><span>${byCat.get(c).length} motions</span></a></li>`).join('')}</ul>
          <p class="sub small">Popular: ${featured.map((id) => `<a href="${rel(`motion/${id}/`)}">${esc(byId.get(id).title)}</a>`).join(' · ')}. Or see <a href="${rel('gallery/')}">all ${totals.motions} motions</a>, the <a href="${rel('recipes/')}">recipes</a>, <a href="${rel('transitions/')}">transitions</a> and <a href="${rel('styles/')}">styles</a>.</p>
        </section>
        <section id="quickstart" class="section wrap" aria-labelledby="qs-h">
          <h2 class="h2" id="qs-h">From clone to first render in three commands</h2>
          <pre><code>git clone ${REPO_URL}.git\ncd opus-motion-library\nnpm install\nnode cli/mgl.mjs suggest "dark hero for an AI tool"\nnode cli/mgl.mjs render stamp-slam --props '{"lines":["HELLO","2026"],"keyword":"WORLD"}'</code></pre>
        </section>
        <section id="faq" class="section wrap faq" aria-labelledby="faq-h">
          <h2 class="h2" id="faq-h">Questions, answered</h2>
          <div class="faq-list">${faqHtml}</div>
        </section>
      </main>
      <noscript><p class="wrap">${SITE_NAME} plays motions live in the browser and needs JavaScript for that; everything else on this page, and every motion page, works without it. Repository: <a href="${REPO_URL}">${REPO_URL}</a></p></noscript>
      `;
  if (!html.includes('seo:body:start')) throw new Error('index.html is missing the <!-- seo:body:start --> marker');
  html = html.replace(/<!-- seo:body:start -->[\s\S]*?<!-- seo:body:end -->/, () => `<!-- seo:body:start -->${fallback}<!-- seo:body:end -->`);
  html = html.replace(/<noscript>The Opus Motion Library site[\s\S]*?<\/noscript>\s*/, '');
  fs.writeFileSync(file, html);
};

// ---------------------------------------------------------------- 404 (GitHub Pages serves dist/404.html for unknown URLs)
const notFound = () => {
  const body = `      <header>
        <p class="eyebrow">404</p>
        <h1>That page does not exist</h1>
        <p class="lead">The link may be old or mistyped. Try the gallery, or search the ${totals.motions} motions.</p>
        <div class="cta-row">
          <a class="btn btn-gold" href="${rel('gallery/')}">Browse the gallery</a>
          <a class="btn btn-ghost" href="${rel()}">Home</a>
          <a class="btn btn-ghost" href="${rel('#/gallery')}">Interactive gallery</a>
        </div>
        ${categoryNav()}
      </header>
      <script>
        // legacy / shared links such as /gallery/aurora or /recipes/product-launch -> the real pages
        (function () {
          var base = ${JSON.stringify(BASE)};
          var p = location.pathname;
          if (p.indexOf(base) !== 0) return;
          var parts = p.slice(base.length).split('/').filter(Boolean);
          if (parts.length === 2 && (parts[0] === 'gallery' || parts[0] === 'motions')) location.replace(base + 'motion/' + parts[1] + '/');
          else if (parts.length === 2 && parts[0] === 'recipes') location.replace(base + 'recipe/' + parts[1] + '/');
          else if (parts.length === 2 && parts[0] === 'categories') location.replace(base + 'category/' + parts[1] + '/');
        })();
      </script>`;
  const html = page({urlPath: '404.html', title: `Page not found | ${SITE_NAME}`, description: `This page does not exist. Browse all ${totals.motions} free open-source motion graphics instead.`, current: '', body, robots: 'noindex,follow'});
  fs.writeFileSync(path.join(DIST, '404.html'), html.replace(/<link rel="canonical"[^>]*>\s*/, '').replace(/<meta property="og:url"[^>]*>\s*/, ''));
};

// ---------------------------------------------------------------- run
let motionResults = [];
for (const m of catalog) motionResults.push(motionPage(m));
for (const c of catIds) categoryPage(c);
const recipeResults = recipes.map(recipePage);
galleryPage();
recipesPage();
transitionsPage();
stylesPage();
docsPage();
landing();
notFound();

// ---------------------------------------------------------------- sitemap, robots, llms.txt
const urls = [
  {loc: abs(), pri: '1.0', freq: 'weekly', images: [{loc: abs(SOCIAL_CARD.path), title: `${SITE_NAME}: ${HEADLINE}`}]},
  {loc: abs('gallery/'), pri: '0.9', freq: 'weekly'},
  ...catIds.map((c) => ({loc: abs(`category/${c}/`), pri: '0.8', freq: 'weekly'})),
  {loc: abs('recipes/'), pri: '0.8', freq: 'weekly'},
  {loc: abs('transitions/'), pri: '0.7', freq: 'monthly'},
  {loc: abs('styles/'), pri: '0.7', freq: 'monthly'},
  {loc: abs('docs/'), pri: '0.7', freq: 'monthly'},
  ...motionResults.map((r) => ({loc: abs(r.urlPath), pri: '0.6', freq: 'monthly', images: r.imgUrl ? [{loc: r.imgUrl, title: r.title}] : []})),
  ...recipeResults.map((r) => ({loc: abs(r.urlPath), pri: '0.6', freq: 'monthly', images: r.imgUrl ? [{loc: r.imgUrl, title: r.title}] : []})),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>${(u.images ?? []).map((i) => `\n    <image:image><image:loc>${esc(i.loc)}</image:loc><image:title>${esc(i.title)}</image:title></image:image>`).join('')}
  </url>`,
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
fs.writeFileSync(
  path.join(DIST, 'llms.txt'),
  `# ${SITE_NAME}

> ${HEADLINE}. ${C.subline(totals)}. Free, MIT-licensed Remotion + React motion graphics for videos, websites and apps. AI-agent ready (AGENTS.md, catalog.json, MCP server).

## Start here
- [Gallery of all ${totals.motions} motions](${abs('gallery/')}): every motion with props and code
- [Recipes](${abs('recipes/')}): ready-made mixes
- [Transitions](${abs('transitions/')})
- [Styles](${abs('styles/')})
- [Docs](${abs('docs/')})
- [Repository](${REPO_URL}): source, AGENTS.md, README, MCP server
- [catalog.json](${REPO_URL}/blob/main/catalog.json): machine-readable catalog of every motion

## Categories
${catIds.map((c) => `- [${catInfo(c).title}](${abs(`category/${c}/`)}): ${byCat.get(c).length} motions`).join('\n')}
`,
);

const pagesWritten = motionResults.length + catIds.length + recipeResults.length + 7;
console.log(`prerendered ${pagesWritten} pages (${motionResults.length} motions, ${catIds.length} categories, ${recipeResults.length} recipes + gallery/recipes/transitions/styles/docs/landing/404), sitemap with ${urls.length} URLs`);
console.log(`counts: ${C.subline(totals)} | base ${BASE} | origin ${ORIGIN} | motions without preview image: ${catalog.filter((m) => !hasGallery(m.id)).length}`);
