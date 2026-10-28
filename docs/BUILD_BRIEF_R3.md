# Build brief — round 3 (growth into thin categories)

Goal: the largest motion library, where **every motion is reusable for any purpose**. A motion is a generic, parameterised
building block — never a one-off scene with baked-in content.

## Reusability contract (required for every new motion)
- **Content is props**: every visible word (`title`, `subtitle`, `label`, `items[]`, …), every number/data series
  (`values[]`, `data[]`), and every picture (`src` / `images[]` / `logoSrc`) is a JSON prop with a sensible generic default.
  Defaults are neutral sample content (no real brands, people, places that imply facts).
- **Brand is props**: `background`, `ink`, `accent` (+ `accent2` if needed) colours; `fontFamily` if the motion is type-led.
- **Timing is props** where meaningful (`speed`, `hold`, `stagger`, `startAt`); counts (`count`, `rows`) scale.
- **Works at 16:9, 1:1 and 9:16** (reflow with `useStage()`; portrait helpers in `src/core/portrait.tsx`).
- Deterministic (seeded noise, no Math.random/Date), u-units from `useStage()`, `propDocs` for every prop, good `useFor`
  and `tags` so `mgl suggest` finds it.
- If it can sit on top of other content, render a transparent background when `background` is `'transparent'`.

## Process
1. `node cli/mgl.mjs suggest "<idea>"` — skip if an existing motion already does it (extend nothing; new files only).
2. Read docs/AUTHORING.md once. New file under `src/motions/<category>/<id>.tsx`.
3. `node cli/gen-registry.mjs && npx tsc --noEmit` (fix only your files; other agents work in parallel).
4. Stills: render ONE at a time (`node cli/mgl.mjs still ...`), 2 frames 16:9 + one 9:16 + one with custom props
   (your own text/colours) to prove reusability. Read them, fix clutter / clipping / tiny text.
5. At the end: `node cli/mgl.mjs gallery --only <your ids> --force`.
- Never kill node/chrome processes globally. No commit/push.
- Report: ids, files, props, still paths, limitations.
