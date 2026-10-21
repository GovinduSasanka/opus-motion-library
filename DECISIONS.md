# Decisions

## Summary (2026-10-21) — premium demo + "use it from any project"

**What was built**
1. **Premium demo film** (`out/demo.mp4`, attached to release v1.1.0, 8:21, 1080p30): cinematic cold open
   (mountain fly-by, "Light. Depth. Life. And character."), a 12-shot hook montage, an "OPUS MOTION" title, then 11
   chapters that show every motion once with a glass index tag ("042 / 106 · Depth Descent"), 4 layered "mix" shots,
   a fast full-mix finale, logo and end card. No mention of sample videos or how it was built; leftover sample text
   (NOODLES, "12 principles" HUD, "written by Claude", export-time stats…) is overridden.
2. **Captions aligned to the picture and the voice**: Whisper word timestamps → each word lights up as it is spoken
   (`captionStyle.variant: "premium"`); per scene, rendered stills decide the caption band (top/bottom) and tone
   (light/dark) so captions never sit on a motion's own text; tags pick the calmest corner on the other edge.
3. **Cuts on the beat** (librosa beat grids, `music.snap`), whole-video finishing overlay (grain + vignette).
4. **Mixing**: `layers` in Compose scenes / storyboards, a `mix` motion, overlay opacity + blend.
5. **Use from other projects** (see the integration section below): AGENTS.md / CLAUDE.md, `mgl suggest`,
   19 recipes, web components + `<opus-motion>` element, `mgl add`, `mgl export`, examples verified in a browser.

**How to run**: `npm install`; demo: `python storyboards/build-demo.py && node cli/direct.mjs storyboards/demo.json`;
library for web: `npm run build:lib`; AI agents start at `AGENTS.md`.

**Verified**: final demo rendered and reviewed scene by scene (one frame per scene, 158 scenes), loudness −16.8 LUFS,
no unintended black frames; examples (React/Vite, HTML, Remotion `mgl add`) built and screenshotted by the integration work.

**Needs you**: review PR; decide whether to commit `dist/` for HTML-only hosts; Remotion company licence if used by a
company above the free tier; the repo is private — make it public if you want to share the demo link.

## Demo decisions (2026-10-21)
- **Narration only at key beats** (cold open, title, chapter cards, ~8 highlights) instead of a line per motion — a
  showreel reads more premium with music carrying most scenes. Chapter-card VO has no caption (the card already shows it).
- **Every motion shown once with an index tag**; `transition-reel`, `scene-tag` (used as the tag overlay) and `mix`
  (shown as four layered shots) are not separate scenes. Tag total = number of tagged shots (106).
- **README still says the library was reverse-engineered from sample videos** — that's documentation of the repo, not
  the demo. Remove it there too if you prefer: README.md first paragraph.
- **Music**: added `epic-action` and `epic-cinematic-intense` (Pixabay licence, from repo-shorts) for chapters 5 and 9.
- **Caption fit**: one caption line up to 10 words / 56 characters; longer sentences split at the comma nearest the middle.
- **Stale voice takes** from the old demo were deleted from `public/voice/demo/`.
- Change the film by editing `storyboards/build-demo.py` (tables of motions, offsets, props, transitions, VO lines).


Decisions made while working unattended. Each section: what was unclear, what was chosen, how to change it.

## Integration layer: choose / mix / use in other projects (2026-10-21)

**Summary.** The repo now teaches and enables a host project (or an AI agent in it) to pick motions, mix them and
integrate them into any stack: capability metadata in `catalog.json` (measured, not guessed), `mgl suggest`,
19 recipes with previews, web components (`MotionPlayer` / `MotionMix` / `MotionBackground`), a code-split ESM build,
a self-contained `<opus-motion>` custom element, `mgl add` (copy source shadcn-style) and `mgl export`
(mp4 / webm-alpha / prores-alpha / gif / png / poster), plus `AGENTS.md`, `CLAUDE.md`, `docs/CHOOSING.md`,
`docs/INTEGRATION.md`, updated skill (repo + `~/.claude/skills/opus-motion`).
How to run: `npm install && npm run build:lib`; `node cli/mgl.mjs suggest "…"`; examples in `examples/`.
Verified: react-vite example built and screenshotted (hero/stats/mix/launch animate, no console errors); html example
screenshotted (3 elements animate, asset-base images load, fonts load); reduced-motion emulation shows still frames (0 % change); `mgl add` into a scratch Remotion project
typechecked, bundled and rendered stills of all three compositions; webm-alpha export has `alpha_mode=1` / `yuva420p`
(mean alpha 0.05 on a confetti frame); prores-alpha is `yuva444p12le` profile 4444.

Decisions (what was unclear → what I chose → how to change):
- **Metadata is measured.** `cli/probe-meta.mjs` renders every motion at 384×216 and measures luma (mood dark/mid/light),
  loop seam (last→first frame diff vs. median frame diff, plus "still moving at the end"), and alpha with the
  heuristic `overlayProps` (mean alpha < 0.85 = overlay). Results in `docs/motion-probe.json`; hand overrides in
  `docs/motion-meta.json` win. Re-run `node cli/probe-meta.mjs [--only id]` after changing a motion.
- **`loopable` = seamless by measurement** (strict; final list: `iso-bar-chart`, `embers`, `sonar-ping` at 144 frames — bursts whose first/last frames merely look alike were overridden to false). Ambient motions that are not seamless still loop on the web via
  `loop="crossfade"` (plays a middle section and crossfades the wrap); `MotionBackground` uses `loop="auto"`.
- **Extra metadata** beyond the brief: `roles` (backdrop/subject/type/accent/frame), `weight` (heavy = three.js, found
  by scanning imports), `textProps` / `imageProps` / `colorProps`, `overlayProps`, `pairsWith`, `notes`, `avoid`, `file`.
- **Two ESM entries**: `opus-motion-library` (static, everything incl. registry/Compose/Layers/transitions) and
  `opus-motion-library/web` (same components, one chunk per motion, Compose loaded on demand). The examples use `/web`.
- **Web components don't import Layers/Compose types**: `src/web/types.ts` has structural copies (`MixLayer`, `MixSpec`);
  `src/lib.ts` has a compile-time check that `MixLayer` equals `LayerSpec`, so drift fails `tsc`. `src/web/hosts.tsx`
  re-implements the Layers semantics from definitions (needed for code splitting and `mgl add`).
- **Circular import registry ↔ mix ↔ Layers** broke the code-split build (mix evaluated before the registry array).
  Fixed on my side: the generated lazy loader loads such motions through the registry. Not changed in Layers.tsx.
- **package.json**: runtime libraries moved from `dependencies` to `peerDependencies` (ranges) + `devDependencies`
  (exact, so the repo still installs everything); added `@remotion/player` 4.0.532, `esbuild` 0.28.1 (was only
  transitive), `@types/react-dom`, `puppeteer-core` (for `examples/screenshot.mjs`). `dist/` is gitignored — run
  `npm run build:lib` (to commit it instead, remove `dist/` from `.gitignore`). `sideEffects` lists only the element.
- **Text-motion transparency**: `Backdrop kind="none"` (src/core/text-kit.tsx) now paints transparent when no colour is
  forced (was black); `story-caption-box` and `end-card-credits` roots are transparent with `backdrop:"none"`.
  Image paths: `resolveSrc` moved to `src/core/asset.ts` and used by every motion (was `staticFile` in 6 files) so
  absolute `https:`/`data:` URLs work everywhere. Defaults unchanged.
- **MotionTransition skipped**: playing a transition between two live React subtrees inside a scaled player is not
  reliable (host DOM loses interactivity and layout). Documented alternatives in INTEGRATION.md.
- **Web text**: `MotionBackground` / `<opus-motion background>` drop recipe layers whose `role` is `"type"` so headlines
  are real HTML. Recipes carry `role` per layer (ignored by Layers.tsx).
- **Recipes use a neutral placeholder brand ("Lumen")** and are documented as "replace the text". Previews are 3-frame
  strips (20/50/85 %, 480 px per frame) in `recipes/previews/`. Recipe `testimonial-quote` and `social-short-captions`
  reference `public/demo/*.jpg`; `mgl add` copies referenced public assets.
- **`mgl add` output**: `<host>/<dir>/` (default `opus-motion`) with `src/` structure, generated `registry.ts`, `meta.ts`,
  `index.ts` (exports motions + `<recipe>Recipe` bundles; `'use client'` when `--player`). Next.js was documented but not
  built here (no Next app in this repo); Option A (copy source) avoids duplicate-React issues of `file:` links.
- **playOnView race**: a freshly mounted Player sometimes ignored `play()`; the shell now retries on animation frames until `isPlaying()`.
- **Remotion licence** note added to AGENTS/INTEGRATION; players pass `acknowledgeRemotionLicense` only when the host sets it.

Needs you / for the other agent:
- (other agent) `src/Layers.tsx`: consider importing the registry lazily (or moving `MotionById` lookups behind a
  function) to remove the registry ↔ mix ↔ Layers cycle at the source; my loader workaround covers the web build.
- (other agent) `src/motions/text/kinetic-captions.tsx`: document `background: "transparent"` as overlay mode in its
  propDocs (I set `overlayProps` for it in `docs/motion-meta.json`; the recipe `social-short-captions` relies on it).
- (owner) Decide whether `dist/` should be committed for HTML-only hosts that have no Node.
- (owner) Remotion company licence if this is used commercially by a company above Remotion's free tier.

## Showcase site + launch media (2026-10-22)

**What**: `site/` — Vite + React + TS showcase, deployed by `.github/workflows/pages.yml` to
https://govindusasanka.github.io/opus-motion-library/ (base `/opus-motion-library/`, override with `SITE_BASE`).
Pages: landing (live hero, why strip, highlight film, motion wall, quickstart, AI-agent section, live recipes),
`#/gallery` (+ `#/gallery/<id>` detail drawer with format toggle, live JSON props editor, props table, CLI / React /
HTML / Remotion-spec snippets), `#/recipes`, `#/transitions`, `#/docs`. Run: `cd site && npm install && npm run dev`
(after `npm run build:lib` at the root); production: `npm run build`, output `site/dist`.

- **Dogfoods `opus-motion-library/web` via `file:..`** (same as `examples/react-vite`) rather than the element bundle:
  per-motion code splitting (only the hero's two motions load on the landing page, ~1 MB first view incl. fonts),
  and the React components give the editor live prop updates. CI builds `dist/` first (`npm run build:lib`).
- **Hash routing** (`#/gallery/aurora`) so GitHub Pages needs no 404 rewrite; deep links work.
- **Live-player budget**: the hero, plus one hovered card (a global hover slot) or the open detail panel. Thumbnails
  are the middle frame of `gallery/<id>.jpg` (CSS background-position), loaded by IntersectionObserver.
  Reduced motion → still frames (library default) and no hover playback.
- **Players render at the box's device-pixel size**, not 1920×1080 (`Sized` in `site/src/components/live.tsx`).
  Found while verifying: the library's SVG `PixelateFilter` (aurora's default `pixelSize: 6`, pixel-dither,
  comic-halftone…) renders blank / partial in Chrome when a 1920-wide composition is displayed scaled down
  (e.g. 300–500 px wide). Rendering the composition near 1:1 avoids it and is cheaper. **Library follow-up**: users
  of `MotionPlayer` at small sizes will hit this too — consider making `PixelateFilter` scale-robust or documenting
  "pass width/height near the display size" in INTEGRATION.md.
- Assets: `site/copy-assets.mjs` copies `public/demo`, `gallery/`, `recipes/previews/` into `site/public` at build
  time (gitignored); no music / sfx / voice. Generated missing gallery strips for `mix`, `scene-tag`, `sms-thread`.
- Site install in CI: `npm ci || npm install` — the `file:..` link records the library's package.json in
  `site/package-lock.json`, so a version bump at the root would otherwise make `npm ci` in `site/` fail.
- Remotion's licence note still prints once in the console (warning, not an error); `acknowledgeRemotionLicense` was
  not passed because that is the owner's call.
- **Media**: `site/public/media/highlight.mp4` — 73.7 s cut of `out/demo.mp4` (16 segments: cold open, montage + title,
  bouncing/eyes/hex, city fireworks, bathysphere, giant eye, crowd, image looks, product UI, wireframe ship,
  "108 motions" card, after-hours mix, end card), 1280×720 H.264 CRF 28 + AAC 128k, faststart, **8.8 MB**;
  `poster.jpg` from the end card. `docs/media/preview.gif` — 11.7 s, 720 px, 12 fps, 128-colour palette, **5.7 MB**
  (replaces the 19.8 MB draft that was committed earlier). `docs/media/social-preview.png` 1280×640 (also used as
  the site's og:image at `media/social-preview.png`).
- Verified with puppeteer-core + Remotion's Chrome headless shell, `site/dist` served under `/opus-motion-library/`:
  landing, gallery (+ detail), recipes (+ detail), transitions, docs at 1440 and 390 px — no horizontal overflow,
  no console errors; hero / detail players change between shots 1 s apart; props editor re-renders live; Esc closes.

**Needs you / main agent**: enable Pages (Settings → Pages → Source: GitHub Actions) and push `main`; upload
`docs/media/social-preview.png` in Settings → General → Social preview; link the site + GIF from README.
