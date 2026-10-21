# CLAUDE.md

See **[AGENTS.md](AGENTS.md)** — how to choose, mix and integrate motions from this library into any project
(Remotion video, Next.js / React / Vite, plain HTML / WordPress, native apps, slides). Then `docs/CHOOSING.md` and
`docs/INTEGRATION.md`.

The 10 rules that matter most:

1. Run `node cli/mgl.mjs suggest "<the brief>"` before picking anything; read `docs/CHOOSING.md` for the goal.
2. Prefer a **recipe** (`node cli/mgl.mjs recipes`, previews in `recipes/previews/`) and customise it.
3. Layer: **backdrop + subject + type + subtle accent**; one hero motion per section, dim the supporting layers.
4. Replace every sample text prop (`textProps` in `catalog.json`) — never ship `ABYSSES`, `LONDON 1736`, `GIN`, `NOODLES`, `Lumen`.
5. Pass the host's brand colours to the colour props, and its images to `src` / `images` / `heroSrc`.
6. On websites: words in HTML over a `MotionBackground`; use overlay-capable motions (`overlay`) on top of host content.
7. Web performance: `playOnView`, lazy, reduced-motion still frame, ≤ 2 live players per viewport, `opus-motion-library/web`.
8. Heavy 3D motions on mobile → `mgl export` to webm/mp4; native apps / editors → `mgl export` (alpha: `webm-alpha`, `prores-alpha`).
9. Integrate per stack (`docs/INTEGRATION.md`): Remotion → `mgl add`; React/Next → `/web` or `mgl add --player`; HTML → `<opus-motion>`.
10. Look before you ship: render stills / screenshots and Read them; fix clutter, illegible text and leftover defaults.

Working on the library itself: follow `docs/AUTHORING.md`; after changes run `node cli/gen-registry.mjs && npx tsc --noEmit && node cli/gen-docs.mjs`.
