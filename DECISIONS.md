# Decisions

## Summary (2026-10-29, end of round 3) — read this first

**What was built.** The library grew from 429 to **616 motions** (148 styles, 97 transitions). Every new motion follows
`docs/BUILD_BRIEF_R3.md`: text, data, colours, images and timing are all props, and it works at 16:9, 1:1 and 9:16.
- New families: camera, texture, product, document, map, mascot, social, explainer, intros and outros, UI loops, charts (16), music, gaming,
  sports, annotation overlays, slides, kinetic type, e-commerce, verticals, developer and AI, nature, travel and food, education, news, events, and 3D.
- Portrait pass: 139 motions fixed.
- Text and colour props added to 66 older motions; their default renders are unchanged.
- **Use it anywhere**:
  - `mgl serve` HTTP render API for video-creation websites and backends.
  - JSON Schema for every motion's props (`props-schema.json`).
  - Controlled-frame players and the `<opus-motion>` seek API for timeline editors.
  - `examples/timeline-editor/`.
  - A one-tag element at `https://govindusasanka.github.io/opus-motion-library/opus-motion.element.js`.
- **Site and SEO**:
  - "The world's largest open-source motion graphics library" positioning, with live counts and a star button.
  - A prerendered page for every motion, category and recipe.
  - sitemap.xml, llms.txt, JSON-LD, an OG card and a FAQ.
  - The README was rewritten with a hero mosaic and GIF, a family table and a star call to action.
- **Sample film** (release v1.2.0):
  - 7:20, 1080p, 28 connected chapters: every family layered and joined by the library's own transitions.
  - Local Qwen3-TTS narration, word-synced captions, and a finale wall with all 616 motions.
  - It plays on the site's "The film" section and is linked from the README.
  - Rebuild it: `python storyboards/build-sample-film.py && node cli/direct.mjs storyboards/sample-film.json --concurrency 4 --out out/sample-film.mp4`.

**How to run.** `node cli/mgl.mjs suggest "<brief>"`, `node cli/mgl.mjs serve`, and `npm run dev` (studio). The site is in `site/` (`npm run build`).
After adding motions: `node cli/gen-registry.mjs && npx tsc --noEmit && node cli/gen-docs.mjs && node cli/gen-schemas.mjs`.

**Verified.**
- `tsc` is clean; CI and Deploy site are green on main.
- The live site, motion pages and element bundle return 200.
- Film contact sheets were reviewed (no black frames, −16.5 LUFS).

**Needs you**
1. `npm publish` (`opus-motion-library@1.2.0`). The jsDelivr and unpkg one-tag URLs only work after this.
2. Submit the sitemap in Google Search Console and Bing Webmaster Tools. Then run a Rich Results test on one `/motion/<id>/` page.
3. Upload a social preview image in the GitHub repo settings. `site/public/media/social-preview.png` is ready; GitHub has no API for it.
4. Optional: post the sample film (release v1.2.0) to YouTube or X and link it in the README. Posting on your behalf was not done.

## Update (2026-10-29) — sample film "everything, all connected"

**Summary.** `out/sample-film.mp4` (local only, `out/` is git-ignored): one continuous 16:9 1080p30 film, about 7 min 20 s. It has
a cold open, 28 chapters (one for every motion family, each with 3–8 motions layered as backdrop + subject + type + accent and
joined by the library's transitions), a style-engine demo, a "use it anywhere" chapter, and a finale wall with a tile for every one
of the 616 catalog motions and a live counter, then an end card (repo URL + "Star on GitHub"). Narration is local Qwen3-TTS (Ryan),
captions are word-synced premium captions, music is ducked under the voice, and the mix is loudness-normalised to about −16 LUFS.
- Regenerate it: `python storyboards/build-sample-film.py && node cli/direct.mjs storyboards/sample-film.json --concurrency 4 --out out/sample-film.mp4`
  (set `QWEN_PYTHON=C:/Users/govin/.qwen-venv/Scripts/python.exe` and `WHISPER_PYTHON=<python with openai-whisper>`). The narration counts, the
  3D / sports picks and the finale wall come from `catalog.json`, so new motions are picked up when you re-run.
- Contact sheets of the final mp4 (one frame every 5 s): `out/sample-film-contact-{0,1,2}.jpg`.

Decisions:
- **Sample brand "Fernwick"** (invented) with one palette (navy ink `#0E1118`, paper `#F4F0E8`, blue `#6C8CFF`, coral `#FF7A59`,
  mint `#3DD6B0`, gold `#FFC857`). "Northwind", "Tidewell", "Lumen" and "Brightline" already appear as defaults in the library, so I didn't use them.
  Every sample text prop is replaced. Numbers on screen are labelled as sample data.
- **Chapter tags** reuse the `scene-tag` overlay ("CHAPTER 07 / 28 · name · the motion ids used"), so each chapter tells viewers
  which ids to copy.
- **Style demo**: the same layered shot shown in its own style, then as `blueprint`, `silkscreen-poster` and `pixel-8bit`. I tested
  `risograph` too, but it was too noisy on this shot.
- **Finale wall**: `public/sample-film/wall/<id>.jpg` is the middle frame of each `gallery/<id>.jpg`, or a fresh still when a gallery
  strip is missing. The folder is generated and now git-ignored. The wall uses `thumbnail-mosaic` (grid) twice so it holds while
  the narration runs.
- **`cli/direct.mjs`, two small changes**: (1) a scene's `style` is passed through to the Compose spec (before, it was dropped);
  (2) when scenes are inserted or removed, voice takes with identical text are reused instead of being voiced again, and a take is
  thrown away whenever its line text changes.
- Music: Pixabay beds from `public/music` (local only, never committed). They switch per section: cinematic-promo, inspiring,
  epic-action, tension-documentary and epic-cinematic-intense.

Known issues:
- A few motions are caught mid-entrance at chapter starts (quiz, match stats, podium gold reveal). That's how they animate in,
  not a fault.
- The low-poly terrain fly-over holds for about 9 s under its narration line, and its camera move is slow.
- Whisper mishears some words ("16x9", "tight" for "type"). Captions use the script text, so they are unaffected.
- The renderer printed `THREE.WebGLRenderer: Context Lost` warnings, but the sampled 3D frames rendered correctly.

**Published**: release v1.2.0 has the 1080p and 720p mp4s. The site plays the 720p mp4 from the release and falls back to the old highlight if it fails to load.
Its music is Pixabay-licensed, which is fine in a video but must not go into the repo.

## Update (2026-10-29) — "use it anywhere": HTTP render server, props schemas, editor/timeline support

**Summary.** Video-creation websites, backends and agents can now use the library without touching its source:
- `node cli/mgl.mjs serve` (`cli/serve.mjs`, also `npm run serve`): HTTP catalog + render queue. `GET /api/motions[/:id[/schema|/preview]]`,
  `/api/suggest`, `/api/styles`, `/api/recipes`, `/api/transitions`, `POST /api/render` (motion | recipe | layers | spec → mp4, webm,
  webm-alpha, prores-alpha, gif, poster), `GET/DELETE /api/jobs/:id`, `GET /api/jobs/:id/file` (Range), `/assets/*`, `/dist/*`, OpenAPI outline.
  Bundles once, one job at a time, CORS on, binds 127.0.0.1 and checks the Host header; optional `--token` / `MGL_SERVE_TOKEN`. Docs: `docs/HTTP_API.md` (Docker included).
- `props-schema.json` (`cli/schema.mjs` + `cli/gen-schemas.mjs`, `mgl schema <id>`, part of `npm run gen`): JSON Schema (2020-12) per motion from the
  catalog defaults / docs, with `enum` for closed "a | b | c" docs and `x-opus-widget` / `x-opus-text` hints for property panels (616 motions at the time of writing).
- Editor support in the web layer (`src/web`): `frame` (controlled), `onFrame`, `playerRef` on `MotionPlayer` / `MotionMix` / `MotionBackground`;
  `<opus-motion>` gets a `frame` attribute, `seekTo()`, `play()`, `pause()`, `getCurrentFrame()`, `player` and an `opus-frame` event.
- `examples/timeline-editor/`: a working multi-track editor in one HTML file (drag clips, schema-driven inspector, play / scrub, "Render mp4" through the server)
  and `TimelineEditor.tsx` (React building blocks, typechecked).
- Docs: "Use it anywhere" matrix, "Video-editor websites" and "One script tag from a CDN" sections in `docs/INTEGRATION.md`; compact matrix in `AGENTS.md`; README link.
- CI: `pages.yml` copies `dist/opus-motion.element.js` + catalog / schema JSON next to the showcase site; `ci.yml` runs `gen-schemas`; `package.json` gets
  `props-schema.json` / `styles.json` / `transitions.json` exports, `jsdelivr` / `unpkg` fields, `serve` and `schemas` scripts.

**Verified.** `tsc --noEmit` clean; `npm run build:lib` ok (element 9.2 MB, 2.9 MB gzip); server: `/api/motions`, schema, suggest, styles, recipes, preview, assets (and
path-traversal / bad Host / token / CORS checks); renders through the queue: motion → mp4 (h264, 540x540, 45 frames), poster PNG, webm-alpha (`yuva420p`), a layers mix and a 2-scene
Compose spec with transition and overlay (frame counts match), cancel while queued and while rendering; the timeline example in headless Chrome (scrub, edit a prop keeps the playhead, play advances,
pause syncs, Render button end to end against the server).

**Decisions.**
- `POST /api/render` `format` means the *output file type* (`mp4` default); the size preset is `aspect` (`landscape | square | portrait`). The old preset names are still accepted in `format` for CLI parity. Change in `plan()` in `cli/serve.mjs`.
- One `props-schema.json` (1.9 MB) instead of 615 files; `node cli/gen-schemas.mjs --split schemas` writes per-id files when a host wants them. Regenerate with `npm run gen` (new motions from other agents are NOT in it until then).
- Enums are parsed from prose docs: they are the intended choices, not a security boundary; open lists ("a | b | …") only get `x-opus-options`. Server does not validate props against the schema (the motion decides).
- `frame` is controlled only while paused; a playing player is never seeked, so `onFrame` can be fed back into `frame` without fighting playback. Playback itself goes through `playerRef` / `el.play()`.
- `/assets` and `/dist` stay open even with `--token` (public library files); only `/api` is protected. `POST /api/shutdown` exists only with `--allow-shutdown`.
- Jobs live in memory and files are deleted after `--ttl` (60 min); a restart forgets them. One render at a time per process; scale by running more containers.
- The element bundle is everything-in-one (9.2 MB); for production pages the docs point to the React `/web` entry or an exported video.

**Needs you**
- `npm publish` of `opus-motion-library` (npm returns 404 today). Until then the jsDelivr / unpkg one-tag URL `https://cdn.jsdelivr.net/npm/opus-motion-library@1.1.0/dist/opus-motion.element.js`
  does not exist; the docs say so. (jsDelivr's GitHub mirror cannot serve it because `dist/` is gitignored: checked, 404.)
- Push `main` so the updated Pages workflow publishes `https://govindusasanka.github.io/opus-motion-library/opus-motion.element.js` (404 today; Pages itself is live). Not pushed here (no commit / push allowed).
- The Dockerfile in `docs/HTTP_API.md` is untested (no Docker on this machine). `mgl serve` needs the dev dependencies (`@remotion/bundler`, `@remotion/renderer`), so install the repo, not just the npm package.
- Hosting the server publicly: set `--token` and `--cors-origin`, keep it off internal networks (renders fetch any URL in the props), and settle the Remotion company licence.

## Update (2026-10-29) — site: "world's largest" positioning + SEO prerender

Details and how to edit: `docs/SITE-SEO.md`. Summary:
- Landing hero now says "The world's largest open-source motion graphics library" with live counts (motions · styles ·
  transitions · recipes, all read from catalog.json / styles.json / transitions.json / recipes at build time) and CTAs Star on
  GitHub (live star count from the public GitHub API, cached 1 h in localStorage, silent fallback), Browse gallery, Quick start.
  Added category tiles and a FAQ (also in FAQPage JSON-LD).
- `npm run build` in `site/` now ends with `node prerender/index.mjs` (static HTML for every motion, category, recipe, gallery,
  transitions, styles, docs, landing, 404, sitemap.xml, robots.txt, llms.txt) and `scripts/verify-prerender.mjs` (fails the build on
  missing pages / duplicate titles / bad JSON-LD / broken links). The Pages workflow needs no change.
- Decisions: the app keeps hash routes (`#/gallery/<id>`) for the interactive view and the static pages are separate indexable
  URLs (`/motion/<id>/`) that link to each other; no new dependencies (esbuild comes with Vite); `og:image` of a motion is its
  gallery strip as asked (1440x270, not 1.91:1 — platforms crop it; a per-motion 1200x630 card would need ~600 renders);
  landing card `site/public/media/og-card.png` has no counts so it never goes stale; the "styles" count reaches the app through
  a Vite `define` (styles.json is too big to bundle); categories added after the original 11 (game, music, product, …) now have
  labels and show in the gallery filter (they were missing before).
- **Needs you**: (1) robots.txt cannot work on a project-pages path — submit the sitemap in Google Search Console / Bing
  Webmaster Tools (or use a custom domain); (2) set the repo About text, topics and social preview in the GitHub UI (suggested
  text in docs/SITE-SEO.md); (3) after the first deploy, run a Rich Results test on one /motion/ page.

## Update (2026-10-29) — round 3: reusable building blocks (429 → 605+ motions)

The ask: "the world's largest library; everything reusable for any purpose". Rules for every new motion are in
`docs/BUILD_BRIEF_R3.md` (all words / numbers / images / brand colours / timing are props with neutral defaults,
16:9 + 1:1 + 9:16, transparent background where it can overlay, stills checked with custom props).
- **Reusability pass on old motions**: colour props on 15 motions, visible text → props on 51 motions (defaults
  identical; landscape regression ≤ 0.04/255). Remaining hard-coded strings are glyphs/units (`out/qa/hardcoded-text.md`).
- **New families** (8 each, Sonnet builders, ~4 at a time): camera moves, textures, product, document, maps, original
  mascot "Pip", social/marketing, explainers, intros/outros, website UI loops, charts ×2 (donut … sankey, gantt, org
  chart, network), music/audio, gaming/esports, tutorial annotation overlays, presentation slides, kinetic type,
  e-commerce, business verticals (fitness, budget, property, booking, weather), developer/AI, nature loops,
  travel/food, education/kids, news/documentary; sports and events in progress.
- **Known limits** (from the builders): text widths are estimated (very long strings shrink/ellipsise); most were
  checked with stills only, not full playback; the 8 annotation overlays' gallery jpgs were rendered with
  `demoBackground: true` (a plain `mgl gallery --force` would make them black — re-render with that prop);
  map coastline is coarse (0.45°); emission-spectrum wavelengths are rounded.

## Update (2026-10-28, night) — portrait (9:16) pass over the whole library

- All 429 motions rendered at 9:16 and reviewed (`out/qa/portrait-all.md`): 268 ok, 161 issues. 139 motions fixed for
  portrait (reframing, closer cameras, bigger labels); every fix is portrait-only and the 16:9 default render was
  regression-checked (all ≤ 0.87/255). Helpers `src/core/portrait.tsx` / `portrait3.tsx` (portrait-only fit/zoom).
- Not fixed: `plan-tilt` walk-through in portrait, `globe-3d` (overlay, small labels), `map-mask-reveal` (by design),
  partial: mission-clock, iso-actuators, screen-recorder-camera, book-open-3d, walker-world-scroll. The 18 "sample text"
  findings are intentional defaults (hosts replace them, rule 4).
- `gallery/physics-pile.jpg` was stale and is regenerated.

## Update (2026-10-28, afternoon) — QA pass, 5 more motions, plan-tilt popup

- The 9 new motions were QA'd at 16:9 + 9:16 and fixed (microscope cell overlap / nucleus sizes / mag flash, card-helix
  lining numerals + portrait clipping, worm mounds / x-ray / framing, element leader dot, bigger labels in dna, star,
  pythagoras, textbook). Gallery images added.
- 5 more motions from the new reference videos: `atom-electron-cloud`, `flame-test-colors`, `emission-spectrum-lines`
  (wavelengths are rounded visible lines, not checked against a table), `body-vessel-glow`, `masonry-gallery-switch`.
- `plan-tilt` `mode: 'popup'` built; default regression plan-tilt 0.00 / comic-halftone 0.00; transition-reel gallery regenerated.
- Total: 429 motions, 148 styles. Full-library portrait QA report: `out/qa/portrait-all.md` (in progress / see next commit).

## Update (2026-10-28, 10:30–11:00 session) — coverage gap, 5 new reference videos, polish

**Coverage check of the 8 repos**: every planned motion from the repo analyses was built (the "(T)" items as transition
types/variants; a handful under nearby ids such as `tilt-shift-diorama`, `doc-highlight-evidence`, `vhs-crt-pass`,
`particle-shape-morph`, `mesh-gradient-bg`; some as styles: `clay-3d`, `iso-diorama`, `shape-morph`). All 15 mg-styles-15
looks exist under renamed ids. **One gap found**: lemo-opuscar `styles/microscope` had never been analysed → added the
`microscope` style and the `microscope-dive` motion. 68 of 70 planned EXTENDS targets were done; this session added the
`comic-halftone` ones (registrationKick / registrationDrift / tint / spotInks / offsetShadow / cutout, helper
`src/core/r2-up-kit.tsx`). `plan-tilt` popup mode is still not built.

**Added this session** (424 motions, 148 styles; tsc clean at 10:51; the 5 video motions compiled but were NOT visually checked before commit — review their stills): `microscope` style, `microscope-dive`, `dna-helix-unzip`,
`order-book-depth`, `pythagoras-rearrange`, transition-reel `include: 'all' | 'extra'` (labels for every variant), stronger
weak styles (typewriter-art, soft-pastel, letterpress-newsprint, stained-glass) if their agent finished in time.

**5 new reference videos (Downloads, 2026-10-28)** — contact sheets in git-ignored `analysis/sheets/r3/v1–v5.jpg`; one
motion each was started at 10:48 with a 10:56 deadline:
- v1 periodic table in 3D (lab room, element columns by property, atom cloud, alkali-in-water, flame test, spectrum) → `element-columns-3d`
- v2 mechanical segmented worm breaching a line-art desert, x-ray pass → `segmented-worm-breach`
- v3 flat-vector "iron in your blood came from a star" (body vessels glow, blood cells, star fusion shells H→Fe, supernova) → `star-fusion-shells`
- v4 static physics textbook turned interactive (open book, line-art apparatus, energy beakers) → `textbook-energy-lab`
- v5 pastel gallery app with cards on a 3D ring, giant "Top 10" serif, detail panel → `card-helix-gallery`
Whichever were unfinished at 10:57 were left out of the commit. **Next session**: finish the missing ones, plus
follow-ups from these videos: atom electron cloud (click adds a proton), alkali metal in water bowl, flame-test colours,
emission spectrum bars, body-vessel glow, masonry gallery switch.

**Portrait QA (9:16)** was started for all motions but the machine was overloaded by ~16 parallel renders; partial reports
in `out/qa/portrait-*.md`. Found so far: hud-chrome and mission-clock sparse/small in portrait, powers-of-ten tick ring
cropped, prompt-wall low-contrast text, line-draw-on caption truncated. Resume with `node out/qa/p3-run.mjs` (skips done ids).

**Known**: `gallery/transition-reel.jpg` is stale (33-transition version) — regenerate it; the comic-halftone default
regression could not be rendered under load (code path unchanged when props are off) — re-run
`node cli/mgl.mjs gallery --only comic-halftone --force --dir out/regress && python cli/regress.py comic-halftone`.

## Summary (2026-10-28) — round 2: the large library

**What was built** (on top of the 109-motion v1.1 library)
- **424 motions** (+306): ported/re-derived from lemo-opuscar, mg-styles-15, pdoom-video, ClaudeAnimationBase (MIT, file
  headers + THIRD_PARTY_NOTICES.md), the 8 attached reference videos, and the 1,138-case prompt corpus (ideas only from
  the unlicensed repos). New families: game, music, document, product, map, mascot.
- **147 styles** (+96) through the style engine: `--style <id>` on any render, `style` in compose specs, recipes and layers,
  `look` on web players. styles.json now carries signature / avoid / confusableWith / motionRules for agents.
- **97 transitions** (types + variants) plus new options (iris shapes / hold / bloom, wipe brush / mist, page-turn curl3d,
  tear peel, …). Defaults unchanged.
- **New variants / props on 64 existing motions** (captions, HUD, charts, counters, film look, line draw, …). Default renders
  were re-rendered and diffed against gallery/ — all identical (max mean diff 0.87/255).
- **33 recipes** (+14 from the prompt research: saas-launch-30s, explainer-5-scene, showreel-15s, game-trailer-20s, …);
  recipes may now set one `style` for the whole film (CLI, MCP and web players).
- Docs: AGENTS.md / README sections for styles and the MCP server, counts updated everywhere (README, AGENTS, package.json,
  skill, site).

**How to run**: `npm install`; `node cli/mgl.mjs suggest "<brief>"`, `node cli/mgl.mjs recipe <id>`,
`node cli/mgl.mjs render <motion> --style <style>`; MCP: `npm run mcp` (see AGENTS.md §7).

**Verified**: `gen-registry`, `tsc --noEmit`, `gen-docs`, site build, `npm run build:lib`; every motion has a gallery strip;
CI and Pages deploy green on GitHub; all 306 new motions were looked at on contact sheets (7 dead-end / framing fixes); each builder checked a landscape sheet
and a portrait still per motion; default-regression diff for all extended motions.

**Regression tool**: `node cli/mgl.mjs gallery --only a,b --force --dir out/regress && python cli/regress.py a,b`.

**How the work was split** (to save usage): Sonnet builders per batch of ~10 ids, one Opus agent for the style engine, Haiku
for docs; at most 4–7 agents at once after the usage-limit stop.

**Known limits** (from the builders; fine to ship, worth polishing later)
- Some "3D" ideas are 2D/SVG approximations: exploded-view-snap, frost-to-clear, holo-globe, outrun-grid, white-model-
  projection, sdf-liquid-shade, crayon-pressure-pass (SVG filter, not shader).
- Untested optional inputs: video `src` (telestrator-freeze, talking-head-pip, frame-blend-timelapse), audio `src`
  (audio-spectrum), custom images on a few image motions (knife-*, woodblock-print-reveal, wash-arrival).
- Weak styles: typewriter-art (faint at 720p), soft-pastel (subtle), stained-glass (square panes), letterpress-newsprint.
- Not built: style EXTENDS items (11, mostly covered by the improved core styles); plan-tilt 3D popup; transition-reel
  has no labels for the new transition variants.
- data-story-60s / history-film-90s recipes contain illustrative numbers and events — replace with sourced data.

**Needs you**: nothing blocking. Files from your other projects were left uncommitted on purpose: `public/{dmd-charleston,
dpp-pete,govindu,jamsession,leadlatch,sites}`, `public/voice/{jamsession,leadlatch}-promo`, `specs/leadlatch-*.json`,
`cli/mgl-hk.mjs`, `cli/mgl-lc.mjs`.


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

**Needs you**: see "Public launch → Needs you" below.

## Public launch (2026-10-22)

**Done**: the repo is public at https://github.com/GovinduSasanka/opus-motion-library with a live site
(https://govindusasanka.github.io/opus-motion-library/, deployed by `.github/workflows/pages.yml`), CI (`ci.yml`),
release v1.1.0 (8:21 showreel + 74 s highlight), 20 topics, Discussions on, issue/PR templates, CONTRIBUTING,
CODE_OF_CONDUCT, SECURITY, CHANGELOG, six starter issues (#1–#6), and a README built to convert visitors
(preview GIF, badges, 60-second quickstart, AI-agent section, generated visual catalogue, star-history chart).

Decisions:
- **Fresh public repo instead of flipping the old one.** The old history contained frames of the 23 sample videos
  (`analysis/sheets/`, some with other companies' logos) and Pixabay mp3s, which must not be redistributed; GitHub also
  keeps PR #1's commits reachable forever. So PR #1 was merged in the old repo, which was renamed
  **`opus-motion-library-archive` (still private, everything kept)**, and the history was rewritten without those files
  (`git filter-branch`, all 19 commits kept) and pushed to a new public `opus-motion-library`. Local clone: `origin` =
  public repo, `archive` = old repo. Full backup of every old ref: `../opus-motion-library-backup.bundle`.
- **Audio is local only now** (`public/music/*.mp3`, `public/sfx/*.mp3` are git-ignored; your copies are still on disk).
  Others run `node cli/fetch-audio.mjs`; `cli/direct.mjs` renders without any audio file that is missing.
- **Sample-video contact sheets stay local** (`analysis/sheets/` git-ignored, still on your disk). The text analysis
  (`analysis/videoN.md`) is public — it is our own write-up.
- **Not affiliated with Anthropic** disclaimer added (name uses "Opus"/"Claude").
- **Package metadata** (`package.json` 1.1.0, no longer `private`) is ready for npm, but nothing was published.

### Needs you
1. **Social preview image**: GitHub → Settings → General → Social preview → upload `docs/media/social-preview.png`
   (GitHub has no API for this). Makes every shared link show the collage.
2. **Pin the repo** on your profile (Profile → Customize your pins) so it is your headline project.
3. **Post the launch** — ready-to-paste Show HN, X thread, Reddit and dev.to drafts in `docs/launch/POSTS.md`
   (posting on your behalf isn't something I do). Best first: Show HN on a weekday morning US time, with the GIF.
4. **npm** (optional, extra reach): `npm login`, then `npm run build:lib && npm publish` — the name `opus-motion-library` is free.
5. **Archive repo**: keep `opus-motion-library-archive` private as the record, or delete it when you are sure.
6. Delete `../opus-motion-library-backup.bundle` once you are happy (97 MB).
7. Remotion licence: free for individuals/small teams; companies above that need a Remotion company licence.

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

## Prompt-corpus research (2026-10-24, expansion round 2)

Outputs: `analysis/sources/prompts.md` (clusters, top-60 missing techniques, top-20 styles, 40 request phrasings),
`analysis/sources/prompt-cases.json` (1185 records, 1138 unique cases), `docs/prompt-index.json` (case → our motions).
Regenerate: `python -I out/prompt-research/parse_cases.py <opus_sources/repos> <repo>` then
`python -I out/prompt-research/render_md.py <opus_sources/repos>` (scripts live in git-ignored `out/`; copy them into
`cli/` if they should be kept).

- **Case list for awesome-claude-5-5-videos** = the 424 posts in `data/collection-index.csv` (what the README calls the case
  list). The 1,401-row `domain-style.csv` snapshot is only used as a cross-check and to label styles, not as records.
- **opus-video-prompts has no licence**: records hold our own English titles/summaries (written from the case metadata),
  links and detected features only; prompt text was scanned in memory and never written out. The 54 `cases.json` rows
  plus 4 prompt files without a case row → 58 records.
- **MIT/CC-BY summaries are generated** (title or first English sentence + detected genre/length/format/tools/techniques,
  ≤200 chars) rather than hand-written; fill-in templates are labelled "template" instead of quoting them.
- **Technique detection is a keyword taxonomy** (`out/prompt-research/taxonomy.py`) plus style-implied techniques;
  "banned/avoid …" lists in prompts are stripped first so excluded effects are not counted. Counts are lower bounds.
- **Ranking** = cases × usefulness (1–5, my judgement). Pipeline items (`sfx-synth-score`, `motion-blur-subframes`) stay in
  the list but are marked; `stop-motion-boil`, `crt-vhs-overlay` and `cinematic-camera-3d` are EXTENDS of existing core
  helpers / style engine, not new motions.
- Thumbnail contact sheets (61 thumbnails) are in git-ignored `analysis/frames/prompt-thumbs/`.

## R2 group TR — 33 transition techniques (agent TR)

- All 33 TR techniques are built; several that are the same effect were merged into one type with variants:
  `crt-power-on-off` + `crt-off` + `crt-collapse` → `crt` (variants `off`, `on`); `brush-wipe` + `brush-band-wipe`
  → `brush` (code from ClaudeAnimationBase, MIT — the pdoom version is idea-only); `deco-door-split` +
  `revolving-door-wipe` + `swing-doors-reveal` → `door` (variants `revolve`, `saloon`); `pillar-wipe` +
  `foreground-occluder` → `occluder` (variants `trunks`, `foliage`, `clouds`, `waves`); `field-blinds-wipe` →
  `blinds:open`; `stepped-diagonal-wipe` → `diagonal:stepped`; `line-open-wipe` → `bands:line` (they relate to
  existing types, so variants instead of new types). Change later by splitting the variant into its own `type`
  in `presentationFor`.
- New spec fields `colors` (palette types) and `text` (rewrite) were added to `TransitionSpec`; shared presentation
  helpers moved from src/transitions.tsx into src/transitions/kit.tsx (same exports, no API change); new
  presentations live in src/transitions/{pattern,doors,screens,paint,burst,world}.tsx.
- `mosaic:swirl` builds its feDisplacementMap twist image on a canvas keyed by frame-derived values only
  (deterministic); `door`, `burn`, `layer-swap` render a scene 2–4×, documented in docs/TRANSITIONS.md notes.
- Did not run cli/gen-docs.mjs (parallel agents were still adding motions; the main agent should run it once at
  the end).

## 14 missing recipes (prompts.md section 4)

- Added recipes/{3d-flythrough-20s, explainer-5-scene, saas-launch-30s, game-trailer-20s, story-short-30s, lyric-video-vertical, generative-loop, showreel-15s, take-apart-explainer, history-film-90s, ui-morph-loop, data-story-60s, pixel-short-loop, kinetic-type-film}.json plus previews in recipes/previews/.
- Ids kept as proposed, but history-film-90s (24 s) and data-story-60s (22 s) are shortened cuts because recipes are capped at 30 s; their notes say how to extend.
- Motions that did not exist were substituted: cinematic-camera-3d / iso-diorama -> terrain-build-3d fly-by + ocean-surface-3d; lyric-sync-type -> lyric-video; particle-morph -> particle-shape-morph; unit-marbles / bar-chart-race -> isotype-count; crt-vhs-overlay -> vhs-crt-pass. callout-labels is not used in take-apart-explainer because exploded-view-3d draws its own numbered labels.
- Styles: recipeSpec ignores a top-level `style`, so styles are set per scene or per layer (teardown, cinematic-3d, light-editorial-minimal). Several proposed style ids (dark-tech-minimal, grainy-gradient) do not exist; swiss-reel looked bad on light backgrounds and was dropped.
- Example figures in data-story-60s and the history events are illustrative; replace with sourced data.

## Hard-coded text to props pass (out/qa/hardcoded-text.md, 51 motions)
- Every user-meaningful visible string in the 51 listed motions is now an additive JSON prop whose default is today's text
  (landscape default renders match gallery/, except rocket-launch and carousel-3d, whose gallery jpgs were already stale).
- Placeholders in template-style props: frame-blend-timelapse `speedLine` ({n}, {s}), shutter-blur `shutterLabel` ({f}, {n}).
- live-chart `gaugeTitle` defaults to '' meaning the old automatic text (REASONING EFFORT when title is QUALITY, else EFFORT).
- Left hard-coded on purpose: unit/glyph strings (`×`, `%`, `●●● ▮`, page numbers), computed log lines in width-pressure-type
  (INFO/WARN/FAIL), the SX/SY/AREA readout symbols in bouncing-ball, fallback-only strings ('Feed', 'Start'), table-status
  keywords ('Paid'/'Pending') in screen-recorder-camera (they drive the colour).
