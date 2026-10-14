# Brief for motion-building agents

You are building part of the **Opus Motion Library**: a Remotion 4 (React 19, TypeScript, SVG, three.js) library
of reusable, parameterised motion graphics reverse-engineered from 23 sample videos.

Project root: `C:\Users\govin\Music\motion_graphics_library` (Windows; in Bash use `/c/Users/govin/Music/motion_graphics_library`).

## Read first
1. `docs/AUTHORING.md` — the rules and the template. Follow them exactly.
2. `docs/PLAN.md` — the whole library; your rows tell you which source techniques each motion must cover.
3. The analysis docs `analysis/videoN.md` — open the subsections named in your assignment (search by technique id).
   They have measured timings, easing, colours and implementation recipes. Reproduce those numbers.
4. Look at the source: contact sheets `analysis/sheets/videoN/s_XX.jpg` (1 fps, timestamped) and extracted frames in
   `analysis/frames/videoN/`. Pull extra frames if needed: `ffmpeg -v error -ss T -i sample/videoN.mp4 -frames:v 1 -vf scale=960:-2 out/check/x.jpg`.
5. Existing code to reuse: `src/core/*` (ease, random, stage, shapes, fonts, types), and finished motions in
   `src/motions/text/` and `src/motions/shape/sonar-ping.tsx` as style references.

## Where to write
- Your motions: `src/motions/<family>/<id>.tsx`, one `defineMotion` per file (a file may export a second small one if they share code).
- Shared helpers just for your family: a NEW file `src/core/<family>-kit.tsx` (or similar). Do **not** edit existing
  `src/core/*` files, `src/Compose.tsx`, `src/Root.tsx`, `cli/*`, or other agents' families — other agents work in parallel.
  If you think a core change is needed, mention it in your final reply.
- Test images you may use as `src` while checking: `public/test/plate1.jpg … plate10.jpg` (use as `demo/owl.jpg`).
  Defaults must NOT reference them — defaults must look finished with procedural content.

## Parallel-safety
Other agents bundle the same project at the same time. Always write each file complete in one go, so the project
never contains a half-written file. If a bundle/tsc error comes from someone else's file, wait ~30 s and retry
(do not edit their file). Use `--concurrency 4` on mp4 renders.

## Verify each motion (required)
```bash
node cli/gen-registry.mjs
npx tsc --noEmit
node cli/mgl.mjs still <id> --frame <F> --out out/check/<id>-<F>.png                      # several frames across the motion
node cli/mgl.mjs still <id> --frame <F> --format portrait --out out/check/<id>-p.png       # vertical sanity check
node cli/mgl.mjs render <id> --concurrency 4 --out out/check/<id>.mp4                       # at least once
ffmpeg -v error -y -i out/check/<id>.mp4 -vf "fps=4,scale=480:-2,tile=6x4" -frames:v 1 out/check/<id>-sheet.jpg
```
Look at the stills and the sheet with the Read tool and compare them with the source frames. Iterate until the motion
clearly reads as the same technique as the source, with good composition and no glitches (nothing off-frame by accident,
no ugly default colours, text readable, motion fills the whole duration). Quality bar: something a motion designer would be
happy to ship.

## Final reply (keep it short)
For each motion: `id — one line on what it does — status (ok / limitation)`. Then any core changes you recommend.
