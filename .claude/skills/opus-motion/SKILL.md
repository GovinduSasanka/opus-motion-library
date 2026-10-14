---
name: opus-motion
description: Make videos with the Opus Motion Library — ~100 reverse-engineered, parameterised motion graphics (titles, transitions, shapes, weather, characters, data/HUD, image looks, 3D) rendered with Remotion. Use when the user asks for a specific motion ("do the sonar ping", "a stamp slam that says X", "an underwater descent"), wants several motions stitched into a video, or wants a narrated explainer built from motions. Works in C:\Users\govin\Music\motion_graphics_library.
---

# Opus Motion Library

Root: `C:\Users\govin\Music\motion_graphics_library` (Bash: `/c/Users/govin/Music/motion_graphics_library`).

## 1. Find the motion
- `node cli/mgl.mjs list` (optionally `--category text|transition|shape|fx|environment|character|data|ui|hud|camera|texture|3d`)
- `node cli/mgl.mjs info <id>` — every prop with default and notes. Full reference: `docs/CATALOG.md`.
- Transitions: `docs/TRANSITIONS.md` (types: fade slide wipe iris blob tear zoom flash glitch clock flip ripple spiral wave
  bands diagonal push-blur page-turn storm whiteout bar strip dots xray, several with `variant`s).
- Unsure which motion matches a described effect? grep `docs/TECHNIQUES.md` (source technique → motion) and the
  descriptions in `catalog.json`.

## 2. One motion → video
```bash
node cli/mgl.mjs render <id> --props '{"key":"value"}' [--format landscape|square|portrait] [--frames N] --out out/<name>.mp4
node cli/mgl.mjs still <id> --at 10,60,120 --out out/<name>-sheet.jpg     # preview frames first, Read the sheet
```
Images: put files in `public/` and pass the public-relative path (`"src": "demo/owl.jpg"`).

## 3. Several motions → one video (no narration)
Write `specs/<name>.json` (`scenes[]` with `motion`, `props`, `duration`, `offset`, `transition`; optional `overlays[]`,
`captions[]`, `audio{music, musicCues, sfx}`), then `node cli/mgl.mjs compose specs/<name>.json --out out/<name>.mp4`.

## 4. Narrated story → video
Write `storyboards/<name>.json` (see `storyboards/demo.json`): each scene has `motion`, `props`, `say` (narration line),
`min` frames, `transition`, optional `music` (switches the bed), `sfx`, `overlays`, `offset`.
```bash
node cli/direct.mjs storyboards/<name>.json            # Qwen3-TTS voice (local) -> timing -> captions -> render -> -16 LUFS master
C:/Users/govin/.flick-venv/Scripts/python.exe cli/voice-check.py public/voice/<name>   # Whisper check; reword any BAD line and rerun
```
Never use cloud voice/music services for this library; music and sfx come from `public/music` and `public/sfx` (Pixabay).

## 5. Check before handing over
Tile the render (`ffmpeg -i out/x.mp4 -vf "fps=1,scale=480:-2,tile=6x5" -frames:v 1 out/x-sheet.jpg`), Read it, fix props.

## Adding a motion
Follow `docs/AUTHORING.md`, put it in `src/motions/<family>/<id>.tsx`, run `node cli/gen-registry.mjs && npx tsc --noEmit && node cli/gen-docs.mjs`.
