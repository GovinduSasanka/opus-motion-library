# Changelog

## Unreleased
- **300+ new motions** from round-2 research (lemo-opuscar, mg-styles-15, pdoom-video, the attached videos, the prompt
  corpus): the catalogue now lists 412 motions.
- **Style engine**: restyle any motion, mix or Compose spec with one style id: `mgl render --style`, `style` on specs,
  scenes and layers, `look` on web players and `<opus-motion>`. 147 styles, see `docs/STYLES.md`.
- **Transitions**: 33 new types (doors, curtains, CRT, tracking tear, rewrite, erase, blinds, tiles, mosaic, overprint,
  scan, portal, squeegee, lights, flood, stripes, burn, brush, ball, shockwave, layer swap, container expand) and new
  options on existing ones: iris `shape`, `hold`, `closeopen` and `bloom`; wipe `brush`, `mist` and `band`. See `docs/TRANSITIONS.md`.
- **New variants and props on 64 existing motions**. Defaults are unchanged, so existing renders look the same.
- **MCP server** for AI agents (`mcp/server.mjs`, `.mcp.json`, `opus-motion-mcp` bin, `npm run mcp`): search motions,
  styles and recipes, preview, render, export, add to project, integration guide.

## 1.1.0 — 2026-10-22
- Premium showreel film (8:21) with word-synced captions, caption/tag placement from rendered stills, beat-snapped cuts.
- Mix motions: `layers` in scenes, `mix` motion, overlay opacity and blend modes.
- Use from any project: `AGENTS.md`, `mgl suggest`, `mgl add`, `mgl export`, 19 recipes, `MotionPlayer` /
  `MotionMix` / `MotionBackground`, `<opus-motion>` custom element, measured catalog metadata, examples.
- New motions: `scene-tag`, `sms-thread`, `mix`. Premium caption variant.
- Audio files are no longer bundled (licence): `node cli/fetch-audio.mjs`.

## 1.0.0 — 2026-10-14
- 106 motions, 33 transitions, composer, narrated-video director, CLI, docs.
