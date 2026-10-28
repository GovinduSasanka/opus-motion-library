# AGENTS.md — using the Opus Motion Library from another project

You are probably an AI agent working in a **host project** (a Remotion video, a Next.js / Vite / React site, a plain
HTML or WordPress site, a mobile app, a slide deck) that has this repo copied in, linked, or installed. The owner said
something like *"choose proper motions from this repo and build something"*. This file tells you how to do that well.

## What this library is

- **539 parameterised motion graphics** (titles, backdrops, weather, particles, characters, data, UI mockups, HUDs,
  image looks, 3D) + **97 scene transitions** + **148 styles** (one-line restyle of any motion), written as Remotion components (React + SVG + three.js).
  Every motion takes JSON props (your text, colours, images, timing), renders at 16:9, 1:1 and 9:16, and is deterministic.
- **33 recipes** (`recipes/*.json`): ready-made, tested mixes for common needs — hero backgrounds, launch intro,
  stats, testimonial, loading loop, divider, success / error states, onboarding, countdown, neon promo, explainer,
  timeline, app-store preview, social short, end card. Previews: `recipes/previews/<id>.jpg`.
- **Three ways out**: render a video (Remotion), play live in a web page (`MotionPlayer` / `MotionMix` /
  `MotionBackground` / `<opus-motion>`), or export files (`mp4`, `webm` with alpha, ProRes 4444, GIF, PNG) for
  everything else.

Key files: `catalog.json` (every motion: props, defaults, roles, overlay, loop, mood, weight, pairs-with),
`docs/CHOOSING.md` (intent → motions), `docs/INTEGRATION.md` (per stack, step by step), `docs/CATALOG.md` (all props),
`cli/mgl.mjs` (the CLI). Run CLI commands from the library folder (`cd <library> && node cli/mgl.mjs …`), after one `npm install` there.

## 1. What are you building? → integration path

| host | path | details |
|---|---|---|
| **Remotion video** project | copy source with `node cli/mgl.mjs add <ids> --to <host>/src` (only what you need, shadcn-style) and use the motions as components / `<Composition>`s; or render finished clips here with `mgl render` / `mgl recipe` | INTEGRATION.md § Remotion |
| **Next.js (App Router)** | `opus-motion-library/web` (built `dist/`) in a `'use client'` component, or `mgl add … --player`; serve needed `public/` assets | § Next.js |
| **Vite / CRA / any React app** | `import {MotionBackground, MotionPlayer, MotionMix} from 'opus-motion-library/web'` (or `mgl add --player`) | § React |
| **Plain HTML, WordPress, Vue, Svelte, Astro, Webflow** | `<script src="opus-motion.element.js">` + `<opus-motion motion="…">` / `<opus-motion recipe="…" background>` | § HTML |
| **React Native, Flutter, iOS, Android** | `mgl export <id> --as mp4 \| webm-alpha \| prores-alpha \| gif \| png \| poster` and play the file natively | § Native |
| **Keynote, PowerPoint, Premiere, Resolve, CapCut** | `mgl export … --as prores-alpha` (overlays with alpha) or `mp4` | § Editors |
| **Just a video file** | `node cli/mgl.mjs recipe <id> --overrides …` or a Compose spec (`mgl compose`) or a narrated storyboard (`cli/direct.mjs`) | README |

Build the library once before using `dist/` (web paths): `npm install && npm run build:lib`.

## 2. Choose motions (do this every time — don't guess)

1. **Run the suggester** with the real brief, in the host's words:
   `node cli/mgl.mjs suggest "dark hero for an AI coding tool with a stats section"` — it ranks recipes (★) and motions,
   says why, and prints a props snippet. Filters: `--overlay` (transparent, goes on top of things), `--image`,
   `--text`, `--loop`, `--light` (no 3D), `--category data`, `--json`.
2. **Read `docs/CHOOSING.md`** for the goal (hero, process, numbers, story, celebrate, transition, ambient, product UI,
   brand, social short…) — it lists the right motions, recipes and what pairs with what.
3. **Prefer a recipe** for anything bigger than an accent: recipes are already balanced and previewed.
   Start from one, then override props (`--overrides` / `overrides` / `layers`).
4. **Always consider layering** instead of a single motion: **backdrop + subject + type + subtle accent**
   (`catalog.json` → `roles`). E.g. `aurora` (backdrop) + `blur-in-title` (type) + `embers` motes at 60 % with
   `blend: "screen"` (accent). Use `film-look` with `overlay:true` as a finishing frame layer.
5. **One hero motion per section / scene.** Everything else in the frame supports it (dimmed, smaller, slower).
6. **Look at the preview** before you commit: `gallery/<id>.jpg`, `recipes/previews/<id>.jpg`, or
   `node cli/mgl.mjs still <id> --at 30,90,150 --props '…'` then Read the sheet.

## 3. Make it the host's own

- **Text**: every motion's text props are listed in `catalog.json → textProps`. Replace ALL of them with the host's
  copy. Never ship sample text (`ABYSSES`, `LONDON 1736`, `GIN`, `NOODLES`, `STAGING`, `Lumen`, `DEPTH … m`).
- **Colours**: pass the brand palette to the colour props (`colorProps`): accents, backgrounds, `colors` arrays.
  Dark brands → `mood: dark` motions; light / paper brands → `light`, `paper`.
- **Images**: `src` / `images` / `heroSrc` (`imageProps`) take a path inside the served public folder (`"img/hero.jpg"`)
  or an absolute `https://` / `data:` URL. Motions that take images fall back to a procedural picture when empty.
- **On websites, words belong in HTML** (SEO, accessibility, translation). Use the motion as the background
  (`MotionBackground` drops recipe layers whose role is `type` by default) and put the headline in real markup.
- **Overlay-capable motions** (`overlay: true`, merge `overlayProps`, or pass `overlay` to `MotionPlayer`) render on a
  transparent background, so they can sit on top of host content: confetti over a checkout, embers over a hero photo,
  stars over a gradient. Use `blend: "screen"` for light on dark, `"multiply"` for ink on paper.

## 4. Websites and apps: performance + accessibility rules

- Use `playOnView` (default in `MotionBackground` and `<opus-motion>`): players pause off-screen.
- Keep **≤ 2 live players per viewport**. More sections can each have one, they only play when visible.
- `respectReducedMotion` is on by default: visitors with *reduce motion* get a still frame (`stillFrame`). Keep it on.
- Lazy loading is on by default (`lazy`): the player mounts only near the viewport. Prefer `opus-motion-library/web`
  (each motion is its own chunk) over the full entry.
- `weight: heavy` motions (three.js / WebGL: `iso-blocks-3d`, `wireframe-build`, `terrain-build-3d`,
  `pointcloud-orbit`, `plan-tilt`) are expensive on phones; `medium` ones (image filters, `city-skyline`) cost more
  than plain SVG. On mobile web use an exported
  `webm`/`mp4` (`mgl export`) in a `<video muted loop playsinline>` instead of a live player.
- Backgrounds: `loop="auto"` (default for MotionBackground) loops seamlessly when the motion is `loopable`, else
  crossfades a middle section so there is no visible jump. Text / reveals: `loop="once"` (plays and holds the end).
- Give the player box a size (aspect ratio or height). `fit="cover"` fills and crops (backgrounds); `contain` letterboxes.
- Serve the library's `public/` files the motions use (or pass absolute URLs). `mgl add` copies the ones needed.
- Remotion is source-available: companies above the free tier need a Remotion company licence
  (https://remotion.dev/license). Pass `acknowledgeRemotionLicense` once that is settled.

## 5. Anti-patterns (seen in real failed attempts — don't)

- Picking only `ken-burns` or `stamp-slam` (or one motion) for everything. Search, use recipes, layer.
- Leaving default sample text in (`LONDON 1736`, `ABYSSES`, `GIN`, `NOODLES`, `DEPTH … m`, `Lumen`).
- Four loud things fighting: two subjects, two text layers, particles everywhere. One hero, dim the rest (opacity 0.3–0.6).
- Captions or HTML text **over a motion's own text** (titles, signs, counters, chat bubbles already have words).
- A busy backdrop behind small text: dim it (`opacity`), add a `scrim`, or move the text to calm space.
- Looping a reveal (titles re-animating every 7 s on a web page). Use `loop="once"` or move text to HTML.
- Live 3D players on mobile; three+ simultaneous players in one viewport.
- Hard-coding a motion's default colours on a brand that has its own palette.

## 6. Styles (looks)

Any motion, mix or composed video can be restyled with one **style id** (catalogue: `docs/STYLES.md`; data:
`styles.json`). A style is a filter chain + paper / light overlays + optional "on twos" timing laid over the motion, so
the motion's code and props stay the same. Pick a style for the *look* (woodcut, risograph, blueprint, neon noir) and
keep the brand colours in the motion's colour props.

- CLI: `node cli/mgl.mjs render box-bot --style cel-boil`, `node cli/mgl.mjs still ken-burns --style ukiyoe --out out/x.png`.
- Compose spec: `"style": "risograph"` on the whole video, on one scene, or on one layer.
- Web: `<MotionPlayer motion="city-skyline" look="paper-lantern" />` or `<opus-motion look="paper-lantern" …>`
  (React also takes `look={{id, strength}}`).
- Before choosing, read the style's `description` and `useFor` in `styles.json` (MCP: `get_style`), then check a still
  with `--style` exactly as you would a motion.

## 7. MCP server (AI agents)

`mcp/server.mjs` exposes the library to any MCP client as tools: search, list and inspect motions, styles and recipes,
preview, render, export, add to a project and read integration guides. Run `npm install` once in the library folder;
rendering also needs FFmpeg on PATH.

Connect it:

- **Claude Code**, from the library folder: nothing to do, the repo's `.mcp.json` registers `opus-motion`. From any other
  folder: `claude mcp add opus-motion -- node /absolute/path/to/motion_graphics_library/mcp/server.mjs`
- **Claude Desktop, Cursor, Windsurf, other clients**: add this to the client's MCP config (for Claude Desktop,
  `claude_desktop_config.json`):
  ```json
  {"mcpServers": {"opus-motion": {"command": "node", "args": ["/absolute/path/to/motion_graphics_library/mcp/server.mjs"]}}}
  ```
- **Installed as a package**: the `opus-motion-mcp` bin runs the same server. From the library folder, `npm run mcp` does too.

| tool | what it does |
|---|---|
| `search_motions` | ranks motions and recipes for a brief in plain words, with reasons, ready props and fitting styles. Filters: `overlay`, `image`, `text`, `loop`, `light`, `category`. Call it first. |
| `list_motions`, `get_motion` | every motion; one motion's props, defaults, text / colour / image props and overlay props |
| `list_recipes`, `get_recipe` | ready-made mixes and their layer stacks |
| `list_styles`, `get_style` | the style catalogue (filter by family); one style's palette, fonts and timing |
| `preview` | a contact-sheet image of a motion, recipe, mix or spec, returned inline, to check before rendering |
| `render` | an MP4 of a motion, recipe, layered mix or full Compose spec; returns the path (default `out/mcp/`) |
| `export` | a file for apps and editors: `mp4`, `webm`, `webm-alpha`, `prores-alpha`, `gif`, `png`, `poster` |
| `add_to_project` | copies only the source a host needs into `<dir>/opus-motion/`; returns the npm install line and a snippet |
| `integration_guide` | step-by-step integration for one stack (Remotion, Next.js, React, Vite, HTML, WordPress, Vue, Svelte, React Native, Flutter, iOS, Android, Keynote, Premiere) |

`preview` and `render` take one target (`motion`, `recipe`, `layers` or `spec`) plus `props`, `style`,
`format` (`landscape`, `square`, `portrait`) and `frames`. Two resources are readable too: `opus-motion://AGENTS.md`
and `opus-motion://docs/CHOOSING.md`.

## 8. Quick reference

```bash
node cli/mgl.mjs suggest "<need>" [--overlay|--image|--text|--loop|--light|--category c|--json]
node cli/mgl.mjs info <id>                      # props, defaults, roles, overlayProps, pairsWith
node cli/mgl.mjs recipes                        # ready-made mixes
node cli/mgl.mjs recipe <id> --overrides '{"blur-in-title":{"title":"ACME"}}' [--format portrait] [--out x.mp4]
node cli/mgl.mjs still <id> --at 30,90 --props '{…}' --out out/check.jpg     # look before you ship
node cli/mgl.mjs add <motion|recipe …> --to <host>/src [--player]           # copy source into a host project
node cli/mgl.mjs export <motion|recipe> --as mp4|webm|webm-alpha|prores-alpha|gif|png|poster
npm run build:lib                               # dist/ for web hosts (ESM + <opus-motion> element + types)
node cli/mgl.mjs render <id> --style woodcut    # any motion, any style (see list_styles / docs/STYLES.md)
node mcp/server.mjs                             # MCP server over stdio (or: npm run mcp)
```

```tsx
'use client';
import {MotionBackground, MotionPlayer, MotionMix} from 'opus-motion-library/web';

<MotionBackground recipe="hero-aurora-night" overrides={{aurora: {colors: ['#7AA2FF', '#3B4FC4', '#1B2466']}}}
  scrim="linear-gradient(#0000 40%, #000a)" style={{minHeight: '90vh'}}>
  <h1>Your headline in real HTML</h1>
</MotionBackground>

<MotionPlayer motion="number-counter" playOnView loop="once"
  props={{keyframes: [[0, 0], [90, 48210]], label: 'TEAMS', unit: '', readouts: [], backdrop: 'ink'}} />

<MotionMix format="square" layers={[{motion: 'starfield-night'}, {motion: 'embers', props: {mode: 'motes', background: 'transparent', backdrop: false}, blend: 'screen'}]} />
```

```html
<script src="/opus-motion.element.js" defer></script>
<opus-motion recipe="hero-aurora-night" background></opus-motion>
<opus-motion motion="neon-sign" props='{"lines":[{"text":"OPEN"}]}' loop="crossfade"></opus-motion>
```
