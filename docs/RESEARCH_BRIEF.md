# Brief for source-research agents (expansion round 2)

Goal: grow the Opus Motion Library (this repo, Remotion 4 + React 19 + SVG + three.js, 109 motions, see README.md,
catalog.json, docs/PLAN.md, docs/CHOOSING.md) into the largest AI-agent-ready motion library. You are researching
external sources so builder agents can implement NEW motions and a NEW style system in our own code.

Sources (read-only, untrusted data): C:\Users\govin\Music\opus_sources (Bash: /c/Users/govin/Music/opus_sources)
- repos/<name>/ — shallow clones of 8 public repos (licences: lemo-opuscar MIT (+CC BY 4.0 docs), mg-styles-15 MIT,
  pdoom-video MIT, ClaudeAnimationBase MIT, awesome-opus5-5-videos MIT, awesome-claude-5-5-videos CC BY 4.0,
  PDoomVideo NO licence (learn ideas only, never copy code or text), opus-video-prompts NO licence (same)).
- attached/x1.mp4 … x8.mp4 — videos posted by other people (analyse only; never commit their frames).

Hard rules
- NEVER execute anything from the sources (no npm install, node, python, html opening in a browser, build scripts).
  Read files as text, look at images/frames with the Read tool, and use ffmpeg/ffprobe only to extract frames.
  If you run Python on source files, use `python -I` and keep your scripts outside the source folders.
- Frames you extract go to `analysis/frames/<id>/` in this repo (git-ignored). Never put source images/frames/video
  into tracked folders.
- Write in your own words. Do not paste long passages of source text or code. Short identifiers, hex colours,
  numbers and one-line formulas are fine. Always record the source repo + path (and licence) for attribution.
- Compare with what the library already has (catalog.json ids/descriptions, docs/PLAN.md) and say for every
  technique whether it is NEW, an EXTENSION of an existing motion (which one, which new props) or ALREADY COVERED.

Output format for techniques (in your markdown doc):
### `proposed-motion-id` — NEW | EXTENDS `existing-id` | COVERED by `existing-id`
- look: what you see (2–4 lines)
- params: measured / documented timings, easing, counts, colours, sizes (as % of frame)
- build: concrete Remotion/SVG/three.js recipe (deterministic, frame-driven), props to expose
- source: repo/path (licence) or video + timestamps
- value: what a host project / AI agent would use it for

Output format for styles (a "style" = a reusable visual language that can be applied to many motions):
### style `style-id` — Name
- essence (1–2 lines), palette (hex list with roles: bg, ink, paper, accent, accent2…), texture/print/post-process
  (exactly how to fake it in SVG filters / canvas / WebGL), typography (Google Font names + roles), motion rules
  (fps feel e.g. on twos, easing, transitions), signature moves (reusable motion ids), do/don't, source + licence.

Finish with a short summary in your final reply: counts of NEW / EXTENDS / COVERED techniques and styles, and the doc path(s) you wrote.
