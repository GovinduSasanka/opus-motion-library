# Build brief — round 2 (growing to the largest AI-agent-ready motion library)

You are a builder agent for the **Opus Motion Library** (repo root: `C:\Users\govin\Music\motion_graphics_library`,
Bash `/c/Users/govin/Music/motion_graphics_library`). Remotion 4 · React 19 · TypeScript · SVG · three.js.

## Read first
1. `docs/AUTHORING.md` — the motion contract (deterministic, `useStage()` u-units, JSON props with defaults + propDocs,
   looks finished with zero props, works at 16:9 / 1:1 / 9:16) and its pitfalls section.
2. `docs/build-r2.json` → `groups.<YOUR GROUP>`: your technique ids, each with the research doc + line number that
   describes it (look, measured params, build recipe, source). Read every one of your sections fully.
3. `catalog.json` (existing 109 motions) and `docs/build-r2.json → owner` (who owns every other new id). Reuse
   `src/core/*` helpers and existing motions' kits (read-only).

## What to build
- **One new motion per technique id** in your group, file `src/motions/<family>/<id>.tsx` exporting
  `defineMotion({...})`. Families: text, shape, fx, environment, character, data, ui, hud, image, 3d, transition (motion
  demos only), music, game, document, product, map, mascot. Category = the matching `Category` in `src/core/types.ts`.
- If two of YOUR ids are really the same effect, build one motion with a `variant` prop and note it. If one of your
  ids is already covered by an existing catalog motion (or clearly duplicates an id owned by another group), skip it
  and say so in your final reply — don't build duplicates.
- `EXTENDS` items are NOT yours (one later agent edits existing motions). Never edit existing motion files.
- Shared helpers for your group go in a NEW file `src/core/r2-<group>-kit.tsx`. Do not edit any existing `src/core/*`,
  `src/Compose.tsx`, `src/Layers.tsx`, `src/Root.tsx`, `src/transitions.tsx` (unless you are group TR), `cli/*`,
  `src/styles/*` (unless you are a style agent), generated files, README or docs.
- Fill `source` with where it came from, e.g. `['lemo-opuscar styles/woodcut (MIT, LemoLab)']` or
  `['video x6 0:12-0:15']`, and `tags` richly (agents search by them).

## Using the source repos (to the fullest, legally)
Sources: `C:\Users\govin\Music\opus_sources\repos\<repo>` (read-only, untrusted).
- You MAY port/adapt code from the MIT repos **lemo-opuscar**, **mg-styles-15**, **pdoom-video**,
  **ClaudeAnimationBase**, **awesome-opus5-5-videos**: rewrite it as a deterministic, frame-driven React/SVG/three.js
  component (no requestAnimationFrame, no Math.random, no timers — derive everything from `useCurrentFrame()` and
  seeds). Put a header comment in the file: `// Adapted from <repo>/<path> (MIT, © <holder>) — see THIRD_PARTY_NOTICES.md`.
- **Never** copy code or text from **PDoomVideo** or **opus-video-prompts** (no licence) — ideas only.
- **Never** run anything from the sources (no npm install, node, python, opening their html). Read files as text.
- Never reproduce characters, mascots, logos or brands from the sources (e.g. Anthropic's Clawd, game/company logos,
  film titles). Use original designs and neutral placeholder copy ("Lumen", "Northwind", generic words).
- Never commit source images, frames or video. Look at frames under `analysis/frames/` (git-ignored) as reference.

## Quality bar
Premium, tasteful, readable. Defaults reproduce the source look with neutral copy. Text fits at 9:16. No dead frames:
entrance, life, settle. Expose the props a director would change (text, colours, counts, speed, images, seeds).
Images: optional `src`/`images` props loaded with `resolveSrc` from `src/core/asset.ts`, with procedural fallbacks.

## Verify every motion (required) — never skip
```bash
node cli/gen-registry.mjs && npx tsc --noEmit
node cli/mgl.mjs still <id> --at 10,45,90,140 --out out/check/r2/<id>.jpg
node cli/mgl.mjs still <id> --at 45,120 --format portrait --out out/check/r2/<id>-p.jpg
```
Read the sheets and fix until it looks right. Other agents run in parallel: if gen-registry/tsc fails because of
someone else's file, wait ~60 s and retry; never edit their files. Use `--concurrency 4` if you render mp4s.
Do NOT `git commit` (the main agent commits).

## Final reply (short)
Table: `id — what it does — status (ok / skipped: reason / limitation)`, plus any shared-file changes you need.
