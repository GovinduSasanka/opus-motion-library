# Contributing

Thanks for helping! Motions, recipes, fixes, docs and integrations are all welcome.

## Ground rules
- Be kind — see the [Code of Conduct](CODE_OF_CONDUCT.md).
- One motion or one fix per pull request keeps reviews quick.
- Everything must be **deterministic** (no `Math.random`, `Date.now` or timers — use `src/core/random.ts`).
- Motions must look finished with zero props, at 16:9, 1:1 and 9:16.
- Only add assets you have the right to share (your own work, CC0, or a licence that allows redistribution).

## Setup
```bash
git clone https://github.com/GovinduSasanka/opus-motion-library.git
cd opus-motion-library
npm install
node cli/gen-registry.mjs
npm run studio            # browse every motion
```

## Add a motion
1. Read [`docs/AUTHORING.md`](docs/AUTHORING.md) — the template and the rules.
2. Create `src/motions/<family>/<id>.tsx` exporting `defineMotion({...})` with defaults and a `propDocs` line per prop.
3. Run `node cli/gen-registry.mjs && npx tsc --noEmit && node cli/gen-docs.mjs`.
4. Check it: `node cli/mgl.mjs still <id> --at 10,60,120 --out out/<id>.jpg` in landscape and `--format portrait`.
5. `node cli/mgl.mjs gallery --only <id>` to add its preview strip, then open a PR with a screenshot or short clip.

## Add a recipe
A recipe is a tested mix of motions (`recipes/<id>.json`). Keep it balanced — backdrop + subject + type + a subtle accent —
and render its preview (`node cli/mgl.mjs recipe <id>`), see existing ones for the format.

## Pull requests
- `node cli/gen-registry.mjs && npx tsc --noEmit` must pass (CI runs it).
- Describe what it looks like and attach a still or GIF.
- Generated files (`src/registry.ts`, `catalog.json`, `docs/CATALOG.md`) should be regenerated, not hand-edited.
