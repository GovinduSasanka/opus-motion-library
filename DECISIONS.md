# Decisions

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
