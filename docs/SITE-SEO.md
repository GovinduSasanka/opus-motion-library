# Site & SEO

The public site (`site/`, deployed by `.github/workflows/pages.yml` to https://govindusasanka.github.io/opus-motion-library/)
is a Vite + React app for the interactive parts (live gallery, recipes, transitions) **plus** a build-time prerender that
writes real HTML for everything a search engine or an AI crawler should read.

## What the build produces

`cd site && npm run build` = copy assets → `tsc` → `vite build` → `node prerender/index.mjs` → `node scripts/verify-prerender.mjs`.

| URL (under the base path) | what |
|---|---|
| `/` | the React landing page; `index.html` gets unique title/description/canonical/OG/Twitter/JSON-LD (WebSite, SoftwareSourceCode, SoftwareApplication, FAQPage) and a static fallback inside `#root` |
| `/motion/<id>/` | one page per `catalog.json` entry: description, use-for, tags, facts, props table, Remotion / React / HTML code, related motions, gallery strip, JSON-LD (`SoftwareSourceCode` + `BreadcrumbList`) |
| `/category/<id>/` | one page per category (`ItemList` JSON-LD) |
| `/gallery/` | every motion on one page, grouped by category |
| `/recipes/`, `/recipe/<id>/` | recipes |
| `/transitions/`, `/styles/`, `/docs/` | listings |
| `/404.html` | `noindex` page; also redirects old `/gallery/<id>`, `/recipes/<id>` links to the real pages |
| `/sitemap.xml` | every page above, with `lastmod` and image entries; `/robots.txt`, `/llms.txt` |

Every number on the site (motions, styles, transitions, recipes, categories) is read from `catalog.json`, `styles.json`,
`transitions.json` and `recipes/*.json` at build time — nothing is hard-coded. A new motion in `catalog.json` gets its page,
its category entry and a sitemap URL on the next deploy. `scripts/verify-prerender.mjs` fails the build if a catalog id has no
page, a title is duplicated, JSON-LD does not parse, the sitemap is incomplete or an internal link is broken.

## How the prerender works

`site/prerender/index.mjs` is plain Node. It bundles `src/snippets.ts` and `src/seo-content.ts` with esbuild (already a Vite
dependency) so the code samples, FAQ, category copy and counts are the same as in the React app, reads the data files from the
repo root, and writes `dist/**/index.html` from string templates. Static pages share `static/site.css` and `static/site.js`
(copy buttons, live star count) — no framework, no hydration. The landing page is the Vite output with the `<!-- seo:head -->`
and `<!-- seo:body -->` markers of `site/index.html` filled in; React replaces the fallback when it mounts.

Env: `SITE_BASE` (default `/opus-motion-library/`) and `SITE_ORIGIN` (default `https://govindusasanka.github.io`) control every
URL (canonical, sitemap, OG, links). With `SITE_BASE=/` it works for a root domain.

## Edit the copy

- Headline, sub-line, FAQ, category titles/blurbs, docs list: `site/src/seo-content.ts` (used by both the app and the prerender).
- Page layouts: `site/prerender/index.mjs`; CSS of static pages: `site/static/site.css`.
- Landing social card: `site/public/media/og-card.png` (1200x630, no counts on it). Regenerate with `cd site && npm run og-card`.
- Motion pages use `gallery/<id>.jpg` (a 1440x270 three-frame strip) as `og:image`; motions without a gallery image fall back to
  the landing card in their social tags and show a "play it live" note on the page.

## Things GitHub Pages limits

- **robots.txt only counts at the host root.** A project site (`/opus-motion-library/`) is not the root of `govindusasanka.github.io`,
  so crawlers ignore `dist/robots.txt`; the `Sitemap:` line in it is harmless. Submit
  `https://govindusasanka.github.io/opus-motion-library/sitemap.xml` in Google Search Console and Bing Webmaster Tools (URL-prefix
  property), or serve the site from a custom domain / the `GovinduSasanka.github.io` user repo and put `robots.txt` there.
- **Hash routes are not indexed.** `#/gallery/aurora` is the interactive view; the indexable twin is `/motion/aurora/` (linked from
  the drawer). Both are linked to each other.
- Pages serves `404.html` with a real 404 status for unknown URLs (the app uses hash routes, so no SPA fallback is needed), so stray URLs are not indexed.

## Growth checklist (manual, in the GitHub UI)

Repository **About**: description "The world's largest open-source motion graphics library — Remotion & React templates, transitions
and recipes. AI-agent ready (MCP)." and website `https://govindusasanka.github.io/opus-motion-library/`; topics such as
`motion-graphics`, `remotion`, `react`, `animation`, `video`, `after-effects-alternative`, `lower-thirds`, `transitions`, `threejs`,
`mcp`, `ai-agents`, `open-source`; upload `site/public/media/og-card.png` as the repository social preview.
