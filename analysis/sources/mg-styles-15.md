# Source analysis: mg-styles-15 (15 motion-design styles, one 10 s film each)

- Repo: `opus_sources/repos/mg-styles-15` (github.com/Vincentwei1021/mg-styles-15), **MIT** for code, prompts, docs and
  films. Third-party pieces keep their own licences: VCSL instrument samples, HDRI, paper texture, photos and Natural Earth
  map data are CC0 / public domain; glyph outlines in `demos/04-3d-render/assets/mesh/` and `demos/08-morph/glyphs.json`
  are SIL OFL; fonts are not in the repo. Credit line for anything we build from it: "technique after mg-styles-15 (MIT)".
- Everything below is written in our own words. We take ideas, numbers and structure, never code or prompt text.
- Frames (git-ignored): `analysis/frames/mg/<nn-name>/` with `sheet_1fps.jpg` (5x2 tile, t = 0…9 s), `full_01..10.jpg`
  (1920 px, t = 0.5…9.5 s) and `burst_*.jpg` (dense 12 fps bursts of the key moves).
- Compared against: `catalog.json` (109 motions), `transitions.json` (33 transitions), `styles.json` (13 styles:
  woodcut, risograph, ink-wash, blueprint, pixel-8bit, comic-halftone, watercolor, newsprint, neon-noir, crt-terminal,
  pencil-sketch, cyanotype, film-noir) and `docs/PLAN.md`.

## Totals

| | count |
|---|---|
| styles documented | **15** |
| techniques NEW | **50** |
| techniques EXTENDS an existing motion / transition / core helper | **30** |
| techniques ALREADY COVERED | **4** |

Style ids: `cel-boil`, `iso-diorama`, `flat-vector-pop`, `gold-line-luxe`, `soft-3d-candy`, `shape-morph`,
`sticker-explainer`, `cyber-hud-fui`, `collage-cutout`, `aurora-glass`, `bauhaus-kinetic`, `synthwave-vhs`,
`pixel-quest`, `liquid-candy`, `variety-hanazi`.

| # | film | style id | relation to `styles.json` |
|---|---|---|---|
| 05 | 手作 HAND MADE (24 fps) | `cel-boil` | NEW (a line-boil look; complements `pencil-sketch`, `ink-wash`) |
| 03 | ISOPOLIS | `iso-diorama` | NEW (motion family exists: `iso-blocks-3d`, `iso-bar-chart`) |
| 01 | popwise · One Dot | `flat-vector-pop` | NEW |
| 02 | ATELIER LINEA · One Line | `gold-line-luxe` | NEW |
| 04 | soft. · Soft Landing (Blender, 24 fps) | `soft-3d-candy` | NEW |
| 08 | morphe. | `shape-morph` | NEW |
| 19 | How Many Elements Hide in a Phone? | `sticker-explainer` | NEW |
| 22 | KESTREL-9 | `cyber-hud-fui` | NEW (partly shares grammar with `blueprint`, `crt-terminal`) |
| 06 | NOGGIN Quarterly | `collage-cutout` | NEW (halftone prep reuses `comic-halftone` / `newsprint`) |
| 12 | Aurora · Think in Light | `aurora-glass` | NEW |
| 09 | KONSTRUKTION | `bauhaus-kinetic` | NEW (print plates overlap `risograph` misregistration) |
| 10 | NEON DRIVE · Midnight 1986 | `synthwave-vhs` | NEW (grade overlaps `neon-noir`; CRT pass overlaps `crt-terminal`) |
| 20 | PIXEL QUEST | `pixel-quest` | EXTENDS `pixel-8bit` (adds 320x180 native canvas x6, platformer grammar, palette LUT) |
| 07 | drop. | `liquid-candy` | NEW |
| 18 | 喵呜日记 EP.07 (9:16) | `variety-hanazi` | NEW |

## How the films were made (pipeline worth copying)

- **One pure function of time per film.** Every demo exposes `window.renderAt(t)` that draws the frame for any time t;
  `harness/render.mjs` seeks headless Chrome frame by frame (it also seeks CSS/WAAPI animations), supports sub-frame
  motion blur (`mb` samples per frame, `shutter` fraction, accumulated before encode), a monotone time-remap table (used
  for tape-stutter / speed ramps) and parallel workers, then pipes PNGs to ffmpeg. This is the Remotion model already;
  the two things we lack as first-class helpers are **sub-frame motion-blur accumulation** and **time-remap segments**
  (see `time-remap-clock`, `tape-stutter` below and pdoom's `shutter-blur` / `time-stutter`).
- **`cues.json` per film**: fps, bpm, key/mode, and named section times (`build`, `drop`, `outro`) plus a dictionary of
  named frame cues (`impact1`, `launch`, `wipe`, `letters`, `letterStagger` …). Picture and soundtrack both read it, so
  every visual hit lands on a sound. Proposal for us: a `cues` prop / `useCues()` hook so a motion's internal beats can be
  re-timed to a host's music without editing code (pairs with pdoom's `beat-grid`).
- **Sound is code** (`lib/audio/mgaudio`, Python): per-style music *recipes* (synthwave, darksynth, chiptune, techno,
  pop, future_bass, trap …) whose tempo grid is anchored so bar 0 lands exactly on the drop; SFX are loudness-normalised
  one-shots placed by their **sync point** (transient for impacts, pass-by peak for whooshes, the END for risers /
  charges / lock-ons); the music bed ducks ~3 dB around each SFX; master to -14 LUFS, true peak <= -1 dBTP, mono-safe
  M/S widening. We do not have audio; the per-film "Sound notes" below give cue ideas for a future `sfx` layer, and the
  sync-point rule is worth adopting in any audio work for the library.
- **Determinism**: seeded hashes (mulberry32 / FNV), closed-form physics or precomputed simulations (the 3D film writes
  contact times to `events.json` for the sound), no `Math.random()` at draw time.
- **Two review rounds** with `rubric.md` (below) took the films from first render to 7.6–8.2 / 10 jury scores.

## Guidance for AI agents: what makes a good MG film (summary of `rubric.md` + `template.md`)

`template.md` — how a style prompt is built. Every prompt = shared boilerplate (role, how to work, rules, craft
checklist, self-review, deliverables) + four style-specific parts:
1. **Output (fixed)**: size, fps, exactly 10.000 s, H.264 + 48 kHz stereo AAC, -14 LUFS, true peak <= -1 dBTP.
2. **Suggested technical route**: SVG / Canvas / WebGL / three.js / Blender and the key implementation trick — the
   maker may switch route only if it clearly raises quality and must say why.
3. **Creative seed**: a one-line title + the most canonical-yet-impressive reading of the style, written as a **beat
   sheet in seconds** (hook -> escalation -> climax -> end frame), 3–6 concrete hex colours, type mood, and the sound
   (genre + key SFX). The maker may change story, copy and brand names but must stay the canonical form of the style.
4. **Signature features and key techniques**: where the style comes from, its visual markers, and executable techniques
   (curve parameters, frame counts, layer structure), one per line.
Writing rules: signature features must be **testable** ("overshoot cubic-bezier(0.34,1.56,0.64,1), stagger 2–4 frames",
not "make it bouncy"); the seed must have **beats with timecodes** or the result comes out flat and template-like; brand
names and copy are **fictional** to avoid trademark trouble.

`rubric.md` — the jury pass (a second AI that did not make the film), then a revise pass.
- Look properly: contact sheet every 0.5 s, filmstrips around the fastest moves and the hero moment, full-res frames at
  5–8 key times; inspect edges, type setting, aliasing, banding, texture, clipping at 100 %.
- Spec check: exact duration, size, fps, audio present, loudness/peak targets, no unintended black or static spans,
  visual hits aligned to audio onsets.
- Score 1–10 on seven axes, calibrated (5 = student, 6 = template, 7 = solid pro, 8 = high-end agency, 9 = award
  shortlist; most first renders are 5–7, do not inflate): **style fidelity** (every signature feature present),
  **concept / wow** (clear idea, hook in the first 0.5 s, one unmistakable hero moment, satisfying end frame), **motion
  craft** (easing, spacing, overlap, anticipation, follow-through, arcs, motion blur; nothing dead or jittery),
  **design & typography** (composition, hierarchy, grid, type incl. CJK, palette, negative space), **finish / texture**
  (light, grain, glow appropriate to the style; no banding or aliasing), **sound sync**, **technical**.
- Output 5–10 fixes ordered by impact, each with timecode, the observable problem, why it matters and a concrete how-to
  with numbers; at least one fix must raise the wow factor. Flag as critical: anything generic / AI-template-looking,
  unnatural copy, fallback fonts or tofu, any spec failure.
- Revise pass: keep version N, apply every critical and high-impact fix (a better substitute is allowed if justified),
  go beyond the list for wow, do not regress strengths, re-render and re-look until the fixes truly land, report what was
  applied or skipped.

How we should use this in the library:
- Add the seven-axis rubric (with the calibration scale) to `docs/AUTHORING.md` / rule 10 "look before you ship", and
  give every new style in `styles.json` a **testable signature list** in the template's spirit (e.g. "on twos",
  "2–3 frame smear on fast moves", "overshoot 1.56", "boil every 2 frames, 1.5 px").
- Recipes should be written as **beat sheets**: hook in the first 0.5 s, escalation, one hero moment around 55–70 %,
  a held end frame (>= 0.6 s) with the brand / title.
- Every hit should be a named cue (see `cues.json` above) so a later audio layer or a host's music can be synced.

## Consolidation notes for builders (overlaps across groups and other sources)

Several techniques were found independently in different films / repos. Build each once:
- **CRT on/off transition** — `crt-power-on-off` (22-hud), `crt-off` (10-synthwave) and pdoom's `crt-collapse` are one
  transition `crt` (power-off = squash to a horizontal line, then a dot, white flash; power-on = the reverse with a
  phosphor bloom).
- **Screen / tape post stack** — `crt-post-stack` (22-hud, EXTENDS `film-look`), `vhs-pass` + `crt-pass` (10-synthwave)
  and pdoom's `post-stack`: one composable `<LookStack>` (scanlines, aperture mask, chroma bleed, tracking-error bands,
  head-switch noise, bloom, grain, vignette) with presets `vhs`, `crt`, `fui`.
- **On-twos / boil** — `exposure-sheet` (05-cel-boil, core `onTwos`), `stepped-boil` (06-collage, per-layer step in
  `mix`) and `ink-brush-boil` (05): one core helper `useStepped(step, seed)` + a boil displacement filter, exposed as
  per-layer `step` / `boil` props in `mix`.
- **Smear frames** — `smear-frame` (05-cel-boil) and the character rig's `smear-trail`: one helper.
- **Stickers** — `sticker-slap` (19-paperclip) and `sticker-cutout-burst` (18-hanazi): one motion with a die-cut white
  border + drop shadow, variants `slap` / `burst`.
- **Logo lockups** — `dot-logo-lockup` (01), `wordmark-fly-assemble` (08), `blob-to-wordmark` (07),
  `pixel-logo-drop` (20), `chrome-title-slam` (10): keep `glyph-orbit-logo` as the umbrella for assemble-type lockups;
  `chrome-title-slam` and `blob-to-wordmark` are distinct enough to stay separate.
- **Time remapping** — `time-remap-clock` (02), `tape-stutter` (10) and pdoom's `time-stutter`: one core wrapper
  `<TimeRemap segments=[{from,to,speed}]>` with presets `stutter`, `tape-stop`, `ramp`.
- **Map routes** — `dashed-flight-loop` and `supply-route-map` both EXTEND `map-route`.
- **Transitions to add** (check each against the existing 33 before building): `tiles` (`tile-cascade`), `stripes`
  (`candy-stripe-wipe`; verify it is different enough from existing `bands`), `crt`, `liquid-flood` (an upgrade of
  existing `wave`, glossy SDF edge), `brush` (character-rig `brush-wipe` + PDoomVideo `brush-band-wipe` idea), `iris`
  gains a shape / on-subject target (`field-bloom-wipe`, `iris-on-subject`, `shape-iris`), `tear` gains a peel
  (`paper-tear-peel`), `blob` gains a bubble shape (`bubble-shape-wipe`).

Per-group counts (as written by each analysis pass): A (05, 03, 01, 02, 04) NEW 16 / EXTENDS 9 / COVERED 2;
B (08, 19, 22, 06, 12) NEW 15 / EXTENDS 12 / COVERED 2; C (09, 10, 20, 07, 18) NEW 19 / EXTENDS 9 / COVERED 0.
The overlaps above mean about 47 distinct NEW builds after merging.

---

# Part A: mg-styles-15 — group A (05 cel-boil, 03 isometric, 01 flat-vector, 02 line-art, 04 3d-render)

Source: `opus_sources/repos/mg-styles-15` (MIT, Vincentwei1021). Per film: `videos/<nn-name>.mp4`, `prompts/<nn-name>.md`,
`demos/<nn-name>/` (picture code + `cues.json` timing sheet + `audio.py`). Frames: `analysis/frames/mg/<nn-name>/`
(`sheet_1fps.jpg`, `full_01..10.jpg` at t = 0.5…9.5 s, `burst_*.jpg` = 4-column tiles of dense bursts).
Shared architecture worth copying in spirit: each film is one pure function `renderAt(t)`; a single `cues.json`
(bpm-gridded beat times) is read by BOTH the picture and the soundtrack script, so every hit lands on an audio onset.
The harness renders `mb` sub-frame samples per frame (`shutter 0.5`) for motion blur, never straddling a hard cut.
All observations below are paraphrased; numbers/hexes are measured from code or frames.

---

## 05-cel-boil — 手作 HAND MADE (1920×1080, 24 fps)

Second by second (from frames + `cues.json`):
- 0.0–0.33 dark brown close-up of a red matchbox striker (on 2s), anticipation of the match head.
- 0.33–1.0 strike on 1s: a stretched smear frame, then a "multiples" frame (4 overlapping heads), a 1-frame yellow starburst
  on cream paper, then the match is upright on the box with a flame lit; a warm cream light pool spreads behind.
- 1.0–2.5 the flame wakes (eyes open 1.25, blink 1.42, looks L/R), crouches and jumps off the match (on 1s), match left burnt.
- 2.5–5.5 the flame spirit (rubber-hose arms, white gloves) dances on the box on 2s: three hops with a red dotted animator
  arc guide drawn ahead, twirl, shimmy, "ta-da" hold on 3s with sparkles.
- 5.5–6.5 spin wind-up with motion-line rings (on 1s), squash to a flat pancake (eyes ><), speed lines converge.
- 6.5–7.0 BURST: 2 impact frames (full red field + yellow/white star), then a red/yellow starburst with cream cloud puffs,
  debris and sparks, matchbox blown off frame.
- 7.0–9.0 the FX re-form: a scalloped red cloud plate, strokes of 手作 written in yellow on 2s (11 stroke cues 0.125 s
  apart), "HAND MADE" + "一帧一帧 · 亲手点亮" tagline.
- 9.0–10.0 pull back (100 → 90 → 86 → 84 %, 3 drawings on 2s) to reveal the sheet on an animation peg bar on a desk; red
  pencil "第146张" circled; a cartoon thumb riffles the stack on 1s showing earlier drawings (flame, match), back to top
  sheet, flame wink on 3s. Persistent tiny "SC.05" slate top-left and "No. 0xx" drawing counter bottom-right.

### style `cel-boil` — Hand-inked Cel / Line Boil
- essence: frame-by-frame hand-inked cartoon on warm paper where every line breathes (re-drawn each exposure) and timing
  switches between ones, twos and threes; Buck/Giant-Ant hybrid with cel FX (smoke, sparks, speed lines).
- palette: ink `#1C1613`, tomato `#E5402B`, sunny yellow `#FFC425`, cream paper `#F4E9D0`, paper-white highlight `#FFF6E2`,
  red col-erase pencil `#D9573F`; dark intro ground ≈ `#2A1E1A`; light pool `#FFF0B4`/`#FFF7DF` multiplied.
- texture: scanned-look paper base + "tooth" layer composited with `multiply` over everything and re-offset per drawing
  (every cel is a new sheet); flat fills offset 2–4 px from the ink (off-register); stepped (not gradient) glow pools with
  scissor-scalloped edges; hatched cast shadows. In SVG: `feTurbulence` paper tile + `mix-blend-mode:multiply` at 10–15 %,
  boil via re-seeded displacement of path points (not `feDisplacementMap`, which blurs strokes).
- typography: hand-marker CJK (LXGW Marker Gothic / Long Cang), Caveat for annotations ("No. 012", "on 2s"). Google
  alternatives: Long Cang, Caveat, ZCOOL KuaiLe, Patrick Hand.
- motion rules: 24 fps; exposure schedule per section (2s for acting, 1s for strikes/jumps/bursts, 3s for holds); boil
  loops 4 variants (3 on a 3s hold); smear frames on fast action; anticipation + squash on every jump; hits on 120 bpm
  grid (beat = 12 frames, 16th = 3 frames).
- signature moves: `ink-brush-boil`, `exposure-sheet`, `smear-frame`, `cel-impact-burst`, `flipbook-riffle-outro`,
  `flame-sprite`, plus existing `speed-lines`, `smoke-puffs`, `sparkle-burst`, `emote-pop`, `onion-skin-arc` (dotted arc guide).
- do: keep line weight "drawn at the same size" under camera zoom (scale ink width and boil amplitude by 1/zoom); vary
  boil per object seed; keep palette to 4 colours. don't: smooth 24-fps interpolation, gradients, uniform-width strokes,
  boiling a hold so strongly it reads as jitter.
- source: `demos/05-cel-boil/js/engine.js`, `js/scene.js`, `cues.json`, `prompts/05-cel-boil.md` (MIT).

### `exposure-sheet` — EXTENDS core `onTwos` (src/core)
- look: action alternates between crisp ones (strike, jump, burst), relaxed twos (acting) and floaty threes (holds); the
  drawing changes only when the exposure ticks, and the boil seed changes with it.
- params: schedule rows `[fromFrame, toFrame, step]`, e.g. 0–8 @2, 8–24 @1, 24–48 @2, 48–60 @1, 60–108 @2, 108–120 @3,
  120–132 @2, 132–168 @1, 168–224 @2, 224–230 @1, 230–240 @3. Boil variant = drawingId % 4 (or % 3 on a 3s hold).
- build: `drawing(frame, sched) → {fq, id, step}`: walk rows accumulating `ceil((b-a)/step)` drawings; quantised frame
  `fq = a + floor((f-a)/step)*step` feeds every animation curve; `id` seeds boil. New props on any doodle motion:
  `exposure?: [from,to,step][]` (fallback: `boilEvery`). Global helper `useExposure(sched)` in core.
- source: `demos/05-cel-boil/js/scene.js` (`SCHED`, `drawing`, `bv`), `cues.json.exposure` (MIT).
- value: makes any library motion read as authentic hand animation; agents can write "on 1s for the hit" in a spec.

### `ink-brush-boil` — NEW (core sketch-kit upgrade + demo motion)
- look: tapered, pressure-varying ink lines (heavier on the lower-right "shadow side"), round caps, that wobble subtly
  every drawing; flat fills wobble independently and sit off-register.
- params: resample centreline every 3.2 px; boil = world-space simplex noise displacement, amp 2.2–2.4 px, scale 70 px,
  z = seed*2.371 (so neighbours wobble coherently); width w ≈ 6 px × (1 + 0.35·noise(s/60)) × (1 + 0.35·max(0, n·light))
  with light dir (0.55, 0.83); taper in 14 px / out 26 px to 25 % min width; caps = 8-segment semicircles.
- build: pure TS: `spline → resample → boil(seed) → outline(pts, widthFn)` gives a polygon; render as SVG `<path>` fill
  (not stroke). Closed shapes inked as 1–2 overlapping strokes with 2.5 px overshoot. Hatch helper clips parallel lines
  to a polygon with ±35 % gap jitter. Props: `inkWidth`, `boilAmp`, `boilScale`, `taper`, `heavySide`, `offRegister`.
- source: `demos/05-cel-boil/js/engine.js` (`boil`, `outline`, `inkW`, `inkStroke`, `fillShape`, `hatch`) (MIT).
- value: one kit upgrade that lifts every doodle motion (`scribble-ball`, `emote-pop`, `smoke-puffs`, `heart-draw-fill`) from
  uniform SVG strokes to real brush ink.

### `smear-frame` — NEW
- look: the fastest frame of a move is a single drawing where the object is stretched along its path (150–300 %) with
  dry-brush streaks, followed by a "multiples" frame showing 3–4 overlapping copies; the next frame is clean again.
- params: exactly 1 frame each, exposure on 1s; strike at 0.33–0.46 s; take-off smear on the jump leaves 3–5 speed lines.
- build: `<SmearFrame from to at shape>`: if `frame === at` draw the shape as a capsule hull of start/end silhouettes with
  streak lines; if `frame === at+1` draw N copies lerped between prev/next pose at 0.6 opacity; else normal. Props:
  `stretch`, `multiples`, `streaks`, `color`.
- source: `demos/05-cel-boil/js/scene.js` (`drawStrikeSmear`, `smearUp`), `videos/05-cel-boil.mp4` 0.29–0.46 s (MIT).
- value: an instant "animator craft" signal for hits, whooshes, logo slams; works over any subject as an accent.

### `cel-impact-burst` — EXTENDS `comic-burst`
- look: 2 full-frame impact frames (red field + white/yellow star, then inverse), then a red/yellow jagged starburst whose
  rim is ringed by cream ink-outlined cloud puffs, sparks and debris; the puffs later gather into a scalloped title plate.
- params: impact frames at 6.500 and 6.542 s (2 frames @24); debris at +0.08/+0.17/+0.29 s; star ~120 % of frame height;
  puffs = 3–5 circle clusters, paper-coloured fill with ink rim; re-form 7.0–8.5 s on 2s.
- build: new props on `comic-burst`: `impactFrames` (count, colours), `puffRing` (count, radius), `debris`, `reformTo`
  ('cloud-plate' | 'none') + `plateColor`; the plate is a scalloped ellipse (circles clamped to overlap the core ≥ 0.5 r so
  no paper holes appear).
- source: `demos/05-cel-boil/js/scene.js` (`drawStarburst`, `drawPuff`, cloud plate builder), video 6.2–8.6 s (MIT).
- value: the climax of any explainer / product reveal, with the title emerging from the explosion.

### `flipbook-riffle-outro` — NEW
- look: the film's final frame pulls back to become the top sheet of a stack of animation paper on a peg bar on a desk;
  a red pencil circles the drawing count ("No. 146"); a cartoon thumb lifts the lower-right corner and riffles back
  through earlier drawings; it settles on the top sheet and the character winks.
- params: pull-back scale 100 → 90 → 86 → 84 % in 3 drawings on 2s; riffle 6 frames on 1s showing drawings
  [150,121,108,61,30,13]; desk border ~8 % of frame; sheet shadow multiply 6 %.
- build: Remotion: render the "film" composition into a sub-`<Sequence>` frozen at chosen earlier frames (`<Freeze>`),
  stack 3–4 sheets with 2 px offsets, peg-bar holes on top, corner flap = clip-path triangle + curled gradient; thumb is a
  simple glove shape. Props: `riffleFrames[]`, `countLabel`, `deskColor`, `pegBar`.
- source: `demos/05-cel-boil/js/scene.js` (`drawDesk`, `drawThumb`, `RIFFLE`), video 9.0–9.7 s (MIT).
- value: a memorable "it was all hand-made" signature ending for studio reels, behind-the-scenes and craft brands.

### `flame-sprite` — NEW (character)
- look: a teardrop flame mascot (red outer, yellow inner, paper-white glint) with dot eyes, blush, rubber-hose arms and
  white cartoon gloves; expressions: sleepy, neutral, determined, happy ^ ^, squeezed >< ; squash to pancake on impact.
- params: body ~14 % of frame height on stage; arms as single tapered curves; hop arcs with squash 0.7 / stretch 1.25.
- build: SVG rig in `character-kit`: body path from 3 control lobes with boil; face states enum; arms via 2-segment
  bezier from shoulder anchors; `pose` keys per frame. Props: `expression`, `arms`, `colors`, `flicker`.
- source: `demos/05-cel-boil/js/scene.js` (`drawSpirit`, `drawFace`, `drawArms`) (MIT; our own design, do not copy shapes).
- value: a warm mascot for energy / ideas / "spark" metaphors; complements `box-bot` and `blob-mascot`.

Sound idea (from `audio.py`): 120 bpm swing; marimba/xylophone + pizzicato + upright bass; woodblock on landings,
vibraslap on the twirl, timpani + suspended cymbal on the burst, a post-master "hit maximiser" only inside the boom window.

---

## 03-isometric — ISOPOLIS · Let the City Grow (1920×1080, 30 fps)

Second by second:
- 0.0–0.9 blueprint: a cyan dotted iso grid on lilac; four dark navy tiles fall and flip into a 2×2 core.
- 0.25–1.6 tiles drop in concentric rings (6 rings, 0.25 s apart), each falling with rotation, squash and two micro
  bounces, a 2 px cyan rim flashing on contact; rings fill the 12×12 island; soil layers slide under (1.62).
- 1.75–4.4 roads draw on; in an all-white "clay" world, houses, turbines, rail and 12 downtown blocks grow by a sweep
  front across screen-x (staggered 0.19–0.25 s), roof caps land 0.375 s after the base; trees pop.
- 4.6–5.75 the central navy tower stacks in segments (base, 3 segments 0.25 s apart, antenna, ring); cars and train start.
- 6.0 HERO "drop": the tower flashes, a cyan ring pulses out and a colour wave converts the clay city into pastel colour
  (scan line climbing each facade), windows light, island glows.
- 6.25–7.5 drones fly packets, three floating stat cards pop (12 min COMMUTE, 98.6 % ENERGY, 1.28 PB/s DATA) with mini bars.
- 7.75–8.75 camera pulls back/slides so the floating island sits top-right in a lilac void; whoosh 8.2.
- 8.56–9.0 letters of "ISOPOLIS" drop onto the ground plane one by one (0.0625 s stagger) as standing 3D extruded glyphs
  with contact shadows; Chinese tagline + mono stats line; hold with a cyan floor ping to 10 s.

### style `iso-diorama` — Pastel Isometric Miniature
- essence: a true-orthographic miniature world (35.264° elevation, 45° azimuth, no vanishing point) in soft pastel studio
  light with AO; things grow, click into place and come alive.
- palette: bg gradient `#EEEAFC` → `#DAD3F7` → `#C4BAEF`; ink/navy `#2C2960`; grass `#94DFBD`; plaza `#F4F1FD`;
  road `#8781D0`; water `#8CC6FF`; peach `#FFC4AC`; butter `#FFE6A1`; coral `#FF9E86`; lilac `#D9D1FA`; data cyan
  `#62F0F2`; window lit `#FFF0C8`; clay pre-colour `#F1EEFA`.
- texture/post: progressive accumulation (sub-pixel jitter AA + jittered sun = soft shadows + sub-frame motion blur +
  rotated SSAO kernel), light bloom (strength 0.28, radius 0.35, threshold 1.6) on emissive glow layer only; no grain.
- typography: Unbounded 800 for the iso title (extruded), mono for stats; Google: Unbounded, Space Grotesk, JetBrains Mono,
  Noto Sans SC.
- motion rules: everything lands on the 120 bpm grid (1/16 = 0.125 s); springs (ω 20–22, ζ 0.42–0.55) for pops;
  growth fronts sweep across screen-x; camera only translates/zooms (never rotates), with a punch zoom kick at the drop;
  parallax foreground clouds.
- signature moves: `iso-tile-ring-drop`, `iso-city-build`, `colour-ignition-wave`, `iso-stat-cards`, `iso-ground-title`,
  existing `iso-bar-chart`, `blob-mascot`, `city-skyline`.
- do: keep 2:1 pixel slope and z-order by screen y; one hero colour (navy tower) against pastels; card UI inside iso space.
  don't: perspective cameras, camera rotation, saturated primaries, hard black shadows.
- source: `demos/03-isometric/js/{main,world,render,anim,title,ui}.js`, `cues.json` (MIT).

### `iso-tile-ring-drop` — EXTENDS `iso-bar-chart`
- look: floor tiles fall from above with a spin that settles flat exactly at contact, squash on landing, two tiny bounces,
  and a cyan outline flash; tiles arrive in rings expanding from the centre.
- params: `drop(tau)`: fall 0.3 s from h0 = 1.6 tile with y = h0(1-u²), rot = 1.7 rad·(1-u)^2.2, stretch 1+0.06u²;
  after contact bounces 0.07 then 0.3×0.07 (0.16 s + 0.10 s), squash sy = 1 − 0.3·e^(−τ/0.05)·cos(40τ); ring cadence
  0.25 s; within a ring ~70 ms angular stagger; rim decays over ~6 frames.
- build: new prop `floorIntro: 'none' | 'ring-drop' | 'sweep'` + `ringEvery` on `iso-bar-chart` / `iso-blocks-3d`;
  per-instance landing time = ring(i,j)·ringEvery + angle stagger; drive instancedMesh matrices from the closed form.
- source: `demos/03-isometric/js/anim.js` (`drop`, `spring`, `pop`), `cues.json.rings` (MIT).
- value: a satisfying "board assembles" intro for any iso chart, map or product diorama.

### `iso-city-build` — NEW (3d)
- look: a 12×12 iso island builds itself: roads draw, white blocks grow from the ground with overshoot and lagged roofs,
  a hero tower stacks in segments, traffic loops, drones carry packets, the camera slides back to frame the floating island.
- params: map-driven layout (string rows: `r` road, `b` block, `p` plaza, `c` core, `w` water, `t` tree, `f` flower);
  growth front sweep keys screen-x → time (−8.5→2.0 s … 8.5→4.8 s); house stagger 0.19–0.375 s; roof lag 0.375 s; tower
  segments 0.25 s apart; drones 0.25 s apart; pull-back 7.75–8.75 s with hermite x/y/zoom keys.
- build: three.js OrthographicCamera at (1,1,1) direction; buildings = boxes/cylinders scaled in Y with `pop()` spring;
  window grids via a shader with per-floor lit fraction; cars/train on closed polyline loops parametrised by t; props:
  `map`, `palette`, `heroTower`, `traffic`, `drones`, `pullback`, `seed`.
- source: `demos/03-isometric/js/world.js`, `main.js`, `cues.json` (MIT).
- value: smart-city / platform / architecture explainers; a host can pass its own map and colours.

### `colour-ignition-wave` — NEW (3d grade technique)
- look: the whole scene is matte white clay; at the hero beat a pulse ring leaves the centre and, as it reaches each
  object, colour climbs its facade from the ground with a thin bright scan line; empty tiles flip over to a coloured
  underside.
- params: clay `#F1EEFA` (grass `#E6E2F2`, road `#CFCBE6`); pulse speed 15 units/s; per-object delay = distance/speed +
  height/9; camera exposure dips −0.15 over 0.07 s before the hit then +0.3 decaying e^(−30τ); zoom kick.
- build: material `onBeforeCompile` uniform `uFlash` (arrival time) + `uDelay`; fragment mixes clay→base colour where
  `worldY < (t - uFlash)*climbSpeed`, adds an emissive band 3–4 px at the front. Props: `igniteAt`, `origin`, `speed`,
  `clayColor`, `scanColor`.
- source: `demos/03-isometric/js/world.js` (`clayMat`, flash delay, two-faced tiles), `main.js` (drop punch) (MIT).
- value: a universal "before → after / switched on" hero moment for any three.js motion (`terrain-build-3d`,
  `wireframe-build`, `iso-bar-chart`).

### `iso-stat-cards` — EXTENDS `callout-labels`
- look: small white rounded cards floating above the island with a CJK label, an English caps sub-label, a big numeral
  and a coloured mini bar sparkline; they pop on the beat and bob slightly.
- params: three cards at 6.5/6.75/7.0 s; card ≈ 6 % W × 14 % H; numeral ~2× label size; bars in coral/mint/sky.
- build: new `variant: 'iso-card'` on `callout-labels`; anchor = projected 3D point (or pixel coordinate), spring scale
  pop, optional leader stem. Props: `items[{label, sub, value, unit, bars[]}]`, `cardColor`.
- source: `demos/03-isometric/js/ui.js`, video 6.4–7.6 s (MIT).
- value: KPI annotations on dioramas and dashboards.

### `iso-ground-title` — NEW (text, 3d)
- look: a bold extruded wordmark stands on the iso ground plane; letters drop in left-to-right on 16ths, each with a
  contact shadow, slight bounce and lean; tagline and a mono stats line set flat on the plane below.
- params: letter step 0.0625 s starting 8.5625; Unbounded 800; letters ≈ 6 % H; shadow blurred dark lilac 30 %.
- build: opentype.js-free route in Remotion: SVG text skewed into iso space (scaleY 86.6 %, skew ±30°, rotate ∓30°) with a
  stacked-offset extrusion (8–12 copies darkening) or three.js `TextGeometry`; per-letter `drop()` from above. Props:
  `text`, `font`, `depth`, `stagger`, `plane: 'left'|'right'|'floor'`.
- source: `demos/03-isometric/js/title.js`, `title5.js`, video 8.4–9.2 s (MIT).
- value: titles that belong to the iso world rather than floating flat over it.

### `accum-render-3d` — NEW (core three-kit pass)
- look: film-quality three.js frames: no aliasing, soft area-light shadows, AO, real motion blur.
- params: N sub-renders per frame, each with sub-pixel jitter, jittered sun direction, sub-frame time and a rotated SSAO
  kernel (16 samples, interleaved-gradient noise); accumulate then bloom then grade.
- build: `useAccumulation({samples, shutter, shadowJitter})` in `src/core/three-kit` rendering into a float target inside a
  Remotion `<ThreeCanvas>`; only for render (`getRemotionEnvironment().isRendering`), 1 sample in preview.
- source: `demos/03-isometric/js/render.js` (MIT).
- value: lifts all 3d motions (`pointcloud-orbit`, `terrain-build-3d`, `iso-blocks-3d`) to Blender-like finish.

Sound idea: marimba note per building landing, wood clack per tile (granular clicks across the ring's 70 ms), a quick
rising zipper of ticks for rail pillars, clock ticks under the intro.

---

## 01-flat-vector — popwise · One Dot (1920×1080, 30 fps)

Second by second:
- 0.0–1.2 ultramarine field over a cream floor; a coral ball drops with speed lines, squashes on impact (frame 15) with
  yellow/white impact rays and expanding ground rings, re-bounces (frame 24), anticipates and launches up (27–31).
- 1.3–3.0 the ball becomes the sun (lands 40, rays 41); a far silhouette skyline rises (38), 9 flat buildings pop in at a
  3-frame stagger (44+), clouds slide (50), birds (56), trees (62), windows light (64–82), a bus drives.
- 2.9–3.8 camera anticipates (86) then pushes (90) into one lit window of the dark tower: blur, radial speed lines, the
  room arrives (112).
- 3.8–5.0 a geometric character with glasses at a laptop blinks (114); phone pings (120); head snaps (129), "!" (135).
- 5.0–5.4 a coral speech bubble from the phone balloons to fill the frame (wipe 150) → mint pill → cream (154/158) colour
  field chain.
- 5.5–8.0 a 2×2 grid of colour cells bursts in rhythm (180/195/210/225): 01 进步 bar chart grows, 02 搞定 check draws,
  03 心动 heart pops, 04 攒钱 coin flips; the coral dot rides each icon.
- 7.8–8.5 cells collapse (233) into circles; the bar becomes a white stem on ultramarine: the "i" of the logo; the dot
  lands on it as the tittle.
- 8.1–10 letters of "popwise" pop out from the i (1-frame stagger, 243+), dot hops and re-lands (247–255), CN tagline 每天
  聪明一点点 (259) and EN "EVERY DAY, A LITTLE WISER" (266), beat bobs at 270/285.

### style `flat-vector-pop` — Flat Vector Explainer (showreel grade)
- essence: one continuous shot of bold, gradient-free geometric shapes and characters, carried by elastic springs and
  element-driven transitions; one hero moves at a time.
- palette: ultramarine `#2B2BFF` (bg), coral `#FF5A4E` (hero dot), sunflower `#FFC62B`, mint `#2EE6A8`, cream `#FFF6E9`
  (ground/paper), ink `#151433`; secondary tint of ultramarine for far skyline (~`#4B4BFF`).
- texture: none — strictly flat; only motion blur (sub-frame accumulation, shutter 0.5) and occasional radial speed lines.
- typography: Fredoka 700 (rounded logotype), Fredoka 600 tracked caps for EN tagline, a rounded CJK (Resource Han
  Rounded; Google alternative: M PLUS Rounded 1c / ZCOOL KuaiLe).
- motion rules: 30 fps; damped springs `spring(t, f=2 Hz, ζ=0.4)` for settles; `pop` = spring f 2.4, ζ 0.42 with
  velocity-driven squash/stretch (amt 0.12, clamped ±0.3) pinned to exactly 1 after 0.9 s; 3-phase entries
  (anticipation → stretch → squash → overshoot → settle); stagger 2–4 frames (buildings 3, letters 1); ~10 % squash;
  transitions are shape wipes or an element flying out and carrying the cut.
- signature moves: `bouncing-ball` (impact variant), `flat-city-popup`, `flat-person-desk`, `bubble-shape-wipe`,
  `icon-grid-burst`, `dot-logo-lockup`, `kinetic-captions`.
- do: one hero dot that survives every scene (continuity); keep counts small and shapes chunky; hold the logo 1 s with
  micro bob. don't: gradients, outlines thicker than accents, several things moving at once, crossfades.
- source: `demos/01-flat-vector/index.html`, `cues.json`, `prompts/01-flat-vector.md` (MIT).

### `impact-drop` — EXTENDS `bouncing-ball`
- look: a ball falls with two vertical speed streaks, squashes flat on a cream ground with yellow + white burst rays and
  2–3 expanding elliptical ground rings, rebounds, anticipates (squash) and launches up with a motion-blurred stretch.
- params: impacts at frames 15 and 24; anticipation 27, launch 31; ray count 6–8 in two colours; rings expand to ~4×
  ball width over ~12 frames; squash ~0.6 sy.
- build: new props on `bouncing-ball`: `mode: 'impact'`, `impactRays` (count, colours), `groundRings`, `ground`
  ('line' | 'band'), `launchAt`, `paletteFlat`.
- source: `demos/01-flat-vector/index.html` (`ballA`, `burstLine`, `ring`), video 0.3–1.2 s (MIT).
- value: a 1-second hook that proves craft; the ball can become any logo dot.

### `flat-city-popup` — EXTENDS `city-skyline`
- look: flat buildings in brand colours pop up one by one with mini overshoot, polka-dot windows that light in sequence,
  clouds and a red sun with stubby rays, then the camera anticipates and pushes into one window, whose interior becomes
  the next scene.
- params: 9 buildings, 3-frame stagger, each `pop` overshoot; window wave over 18 frames; push 90–112 (≈0.75 s) with a
  2–4 % back-up anticipation, radial speed lines and motion blur.
- build: new props: `style: 'flat'`, `popStagger`, `windowShape: 'dot'|'rect'`, `pushInto: {building, window, at}`
  (reverse of existing pull-back), `interior` slot (render prop / child composition inside the window).
- source: `demos/01-flat-vector/index.html` (`updWorld`, `camera`, `camFor`), video 1.3–3.8 s (MIT).
- value: "zoom into where the user lives" opener for SaaS/explainers.

### `flat-person-desk` — NEW (character)
- look: a geometric person (round head, bun, round glasses, mint top) at a laptop in a cosy yellow room (window, framed
  picture, plant, mug with steam, pendant lamp); blinks, reacts to a phone ping with head snap, "!" mark, then a smile.
- params: blink 2–3 frames; head snap ~3 frames with overshoot; limbs rotate about anchor points (rig); bob on beats.
- build: SVG rig with parent groups (torso → head; shoulder → elbow → hand) and `rotate` about anchors; expression enum
  (neutral, surprised, smile); room props as data. Props: `skin`, `hair`, `shirt`, `room`, `events[{at, type}]`.
- source: `demos/01-flat-vector/index.html` (`updInterior`, `mkArm`), video 3.8–5.0 s (MIT; design our own character).
- value: a reusable "user" for app explainers, pairs with `sms-thread` and `chat-bubbles`.

### `bubble-shape-wipe` — EXTENDS transition `blob` (docs/TRANSITIONS.md)
- look: a notification/speech bubble grows from the phone, its tail swinging, until it fills the frame; inside, a pill
  shape grows into the next colour field and another rounded shape wipes to cream: a chain of shape wipes.
- params: bubble anticipation 6 frames, wipe 150 → 154 → 158 (4-frame chain); easeIn into the fill, overshoot on pills.
- build: new transition option `shape: 'bubble' | 'pill' | 'circle'`, `chain: [colors]`, `origin {x,y}`, tail angle.
- source: `demos/01-flat-vector/index.html`, video 4.8–5.4 s (MIT).
- value: element-driven cuts that are on-brand and avoid crossfades.

### `icon-grid-burst` — NEW (data / ui)
- look: a 2×2 grid of flat colour cells with numbered labels; on each beat one cell bursts alive: a bar chart grows, a
  check mark draws, a heart pops, a coin flips; the hero dot rides the active icon; then cells collapse to circles and
  merge into the logo.
- params: bursts every 15 frames (0.5 s at 120 bpm); labels `01 进步 / 02 搞定 / 03 心动 / 04 攒钱` style (small caps 30 px);
  cells use 4 palette colours; collapse at 233–240.
- build: `cells[{icon: 'bars'|'check'|'heart'|'coin'|custom path, label, color}]`, `beatFrames`, `collapseTo: 'logo'|'none'`;
  each icon has a pure draw-on function (stroke-dashoffset for check, scaleY spring for bars, rotateY for coin).
- source: `demos/01-flat-vector/index.html` (`updIcons`), video 5.5–8.0 s (MIT).
- value: "four benefits in four beats" section for product promos and slides.

### `dot-logo-lockup` — EXTENDS `glyph-orbit-logo`
- look: the last remaining icon morphs into the stem of an "i", the hero dot lands on top as its tittle, the rest of the
  wordmark pops out letter by letter on either side from the i; dot hops once more and settles; bilingual tagline.
- params: letter stagger 1 frame; dot rise 247, apex 250, drop 251–255 with squash; tagline CN +4 frames, EN +11 frames.
- build: new props on `glyph-orbit-logo`: `variant: 'dot-stem'`, `fromShape` (rect bar), `anchorChar` index, `dotColor`,
  `letterPop` spring.
- source: `demos/01-flat-vector/index.html` (`updLogo`, `logoDot`), video 7.8–9.5 s (MIT).
- value: match-cut logo reveals for brands with a dotted i/j or any round mark.

Sound idea: future-bass/pop at 120 bpm in F major; a pop/boing/whoosh on every entry, cues in frames.

---

## 02-line-art — ATELIER LINEA · One Line (1920×1080, 30 fps)

Second by second:
- 0.0–0.2 extreme close-up (zoom 5.8×) of a glowing gold pen tip whipping along a ground line on midnight navy.
- 0.2–1.9 the line forms a seed, then a sapling with three leaf pairs (zoom easing 3.5 → 2.25).
- 1.8–3.9 a tendril becomes a roof beam (hold 2.08–2.23), a pavilion with an arched door, towers (hold 3.5–3.65).
- 3.85–5.1 skyline continues (hold 4.75–4.9) then a long horizon line; older segments dim behind the tip.
- 5.1–6.5 the horizon becomes a breaking wave, curls into a loop, lifts and draws a circle (the logo ring) and an arch door
  inside it (7.0–7.5); camera eases to the logo.
- 7.4–8.0 anticipation (ring thins to 1.5 px and heats) → HERO: the ring floods with molten gold from its anchor (camera
  kick ×1.03), a bevelled gold medallion with the arch carved out, light pulse travels back along the whole line.
- 7.8–9.0 dolly out to a composed poster; wordmark "ATELIER LINEA" (tracked serif) and tagline "如于一线" with hairline rules.
- 9.0–10 slow 3 % push; a narrow 18° sheen crosses the coin; a light "breath" flows forward into the coin.

### style `gold-line-luxe` — One-Line Luxury Line Art
- essence: one constant-width champagne line on a near-black navy ground draws the entire story without lifting the pen,
  ending in a line-to-fill logo moment and a quiet tracked serif wordmark.
- palette: bg `#0B1320` with a soft radial lift; line `#E9D7A5`; hot tip / molten rim `#FFF6DC`; glow `rgb(232,200,138)` and
  `rgb(214,178,112)`; dimmed old line ≈ 35 % mix to bg.
- texture: fine film grain (grain tile, low alpha), faint navy dust motes; glows as radial gradients; no other effects.
- typography: thin letter-spaced serif caps (Google: Cormorant Garamond 500 / Cinzel / Marcellus, tracking ~0.4 em) and a
  light CJK serif (Noto Serif SC 300) for the tagline.
- motion rules: draw speed eased with `cubic-bezier(0.65,0,0.35,1)` into corners; punctuation holds where the pen stops
  (0.15 s) with the camera clock stopping too; constant on-screen line width (≈ 3 px; world width = LW / zoom); the camera
  follows the tip with smoothing and then dollies out to a poster; only one "hit" (the fill).
- signature moves: `one-line-journey`, `time-remap-clock`, `light-pulse-path`, `stroke-to-fill-medallion`,
  `blur-in-title` (wordmark), existing `line-draw-on`, `handwrite-on`.
- do: connect each figure's tail to the next figure's start; dim the past; let negative space dominate. don't: vary line
  width with zoom, add colours, cut the line, use bouncy easing.
- source: `demos/02-line-art/film.js`, `cues.json`, `prompts/02-line-art.md` (MIT).

### `one-line-journey` — NEW (shape / text)
- look: a single gold line with a glowing pen tip travels through a sequence of figures (seed → plant → building →
  skyline → wave → logo) as one continuous path; a virtual camera rides the tip, zoomed in early and pulling back as the
  drawing grows; older parts fade to ~35 %.
- params: path = ordered pieces with weights; draw keyframes `[t, marker]` (e.g. seed 0.2, stem 0.75, roof 2.083 … arch
  7.5); zoom keys 5.8 → 1.1 interpolated in log space with monotone cubic; camera = Gaussian-weighted average of tip
  positions over ±0.8 s (σ 0.3 s) with 0.08 s look-ahead; first 0.5 s the camera chases the tip with a 2-frame lag;
  roll −0.016 rad banking through the wave; dim = floor + (1−floor)(1 − smooth(0.2, 1.5, age)); tail taper over first
  130 px of arclength.
- build: Remotion SVG: concatenate piece `d` strings, measure with `svg-path-properties` (arclength table, deterministic),
  `strokeDasharray` reveal driven by eased per-piece timing; draw in ~40 px chunks to colour by age; camera = SVG group
  transform; tip = 3 stacked radial-gradient circles. Props: `pieces[{d, weight}]`, `timeline`, `color`, `bg`, `lineWidth`,
  `zoomKeys`, `follow`, `dimTo`, `holds[]`, `poster: {at, center, zoom}`.
- source: `demos/02-line-art/film.js` (`camera`, `PIECES`, draw loop), `cues.json` (draw/zoom/holds/camera) (MIT).
- value: luxury, architecture, finance and founder-story films; agents can feed brand-specific path pieces.

### `time-remap-clock` — NEW (core helper)
- look: the camera (or a simulation) eases to a full stop on each punctuation hold, then runs up to ~2× to catch back up
  to the timeline, giving musical "breaths" without retiming the whole animation.
- params: ease-out over 0.133 s into the hold, velocity 0 through it, release 0.5 s with a sin² boost sized so the clock
  is back on the timeline; 3D film variant: 0.35× slow-mo at the apex, ≤ 1.35× catch-up.
- build: precompute `clock[i] = ∫ v(t) dt` on a 1/600 s grid (trapezoid), `clock(t)` = lerp; `useTimeRemap(holds,
  {easeIn, release, minSpeed})` returns a remapped time used by any motion. Pure and deterministic.
- source: `demos/02-line-art/film.js` (`CT`, `camClock`), `demos/04-3d-render/cues.json` (`_r2` note, `R(t)` in `blender/sim.py`) (MIT).
- value: lets hosts add holds/slow-mo on beats to any library motion; key for music sync.

### `light-pulse-path` — NEW (fx)
- look: after the line is drawn, a bright soft packet of light runs along it (forward or backward), leaving the line a
  little brighter; at the end a gentle "breath" of light flows into the logo.
- params: brightness bump = amp·exp(−((s − s_pulse)/300)²) along arclength s (px); pulse 7.55–8.45 s; trail level 0.74;
  a 6 px hot glow `rgba(255,246,220,0.35)` on the packet; breath amp 0.55, width 240 px.
- build: overlay on any SVG path motion: re-stroke the path in chunks with per-chunk opacity from the Gaussian, or use a
  moving `strokeDasharray` window with a blurred copy. Props: `path`, `from`, `to`, `direction`, `width`, `color`, `trail`.
- source: `demos/02-line-art/film.js` (pulse and breath terms in the line loop) (MIT).
- value: "energy flowing" through circuits, routes (`map-route`), org charts, `branch-grow`, logos.

### `stroke-to-fill-medallion` — EXTENDS `line-draw-on`
- look: an outline ring thins and heats, then floods with gold from its anchor point with a molten 6 px rim leading the
  fill edge; result is a bevelled metal medallion with a carved shape (doorway) and a soft halo; later a narrow sheen
  sweeps across.
- params: anticipation 7.4–7.5 (ring 3 → 1.5 px, hot); fill 7.5 s, swell 0.367 s, overshoot 7.6/7.8/7.93; rim `#FFF6DC` →
  `#E9D7A5`; carved hole via `destination-out`; sheen 9.2–9.96 s, 18°, ~40 px band at 0.35 alpha; camera kick ×1.03
  decaying over ~9 frames.
- build: new props on `line-draw-on`: `fillGroups`, `fillFrom: {x,y}` (radial clip circle grows from anchor), `fillStyle:
  'flat'|'metal'` (linear gradient + inner bevel via offset blurred copies), `carve` path, `sheenAt`.
- source: `demos/02-line-art/film.js` (fill canvas, bevel, sheen), video 7.3–8.4 s (MIT).
- value: premium logo reveals; pairs with any outline logo SVG supplied by the host.

### `tracked-serif-wordmark` — COVERED by `blur-in-title`
- look: widely tracked serif caps fade/rise in with a slight spread, small tagline, hairline rules growing either side.
- params: glyph stagger 0.045 s, duration 0.95 s, tagline +0.42 s, rules 9.25–9.6 s at 55 % alpha.
- build: already achievable with `blur-in-title` (tracked title, tagline and rule); add `rules: 'sides'` if needed.
- source: `demos/02-line-art/film.js` (wordmark block), `cues.json.wordmark` (MIT).
- value: end card for luxury pieces.

Sound idea: 72 bpm felt piano + string swell; a pen whisper whose loudness follows tip speed (speed/corner data dumped
from the same path); soft clicks on corners; chime and reverse sparkle on the fill.

---

## 04-3d-render — soft. · Soft Landing (1920×1080, 24 fps, Blender Cycles + HTML overlay)

Second by second:
- 0.0–0.5 macro, shallow DOF: a vast bed of cream capsules in rows, a pink sweep band rolling toward the lens; a glossy
  pink jelly "s" falls into frame.
- 0.5 the "s" lands, sinks into the soft bed, jiggles (squash follow-through) and fires a radial ripple ring through the field.
- 1.5 / 2.0 / 2.5 "o", "f", "t" drop on the beats; camera pulls back (camA 0.54–1.9, long-tail ease) to a low 3/4 view.
- 3.0–3.75 build: a counter-sweep wave lifts the letters again in reading order on 16ths.
- 3.9–5.75 camB reframes; letters tremble (5.0–5.98); a chrome ball enters (5.3), hangs (5.8–5.93) and slams beside the
  "t" at 5.975.
- 6.0 HERO: shockwave; the capsules flip and fling as a crater blooms — their lilac undersides turn up so the whole field
  changes colour from cream to lilac as the front passes; letters hop when the front reaches them; the "t" crown hangs
  in slow-mo (0.35× 6.48–6.70) and the field catches up by 7.8.
- 6.25–9.2 camC settles to the hero framing; 8.0 tagline "SOFTNESS CARRIES WEIGHT / 柔软 · 自有分量" in tracked DM Sans
  under the word; 8.6–10 end hold with a faint breathing band behind the word.

### style `soft-3d-candy` — Soft 3D Candy Render (C4D/Octane pastel ident)
- essence: physically lit pastel studio with candy materials (SSS gummy, clear-coated plastic, chrome), MoGraph cloner
  fields that ripple and react, inflated type with jelly physics, filmic 24 fps with real motion blur and shallow DOF.
- palette: cyc `#F1E4EC`, world bg `#F6E8F1`, grade tint `#EADCF2`; gummy hero `#FF5AA6`; pill cap `#EBDCCD` (cream),
  pill body `#C6B9F3` (lilac); chrome `#F4F3F6` (metal, roughness 0.045); pink rim strip light `#FF6FAE`; plum flag
  `#2A1830`; floor shadow ink `#817971`.
- texture/post: Cycles with OIDN, motion blur shutter 0.5, DOF (bladeless, f-stop keyed per shot), AO-tinted cyc, overlay
  film grain at 9 % (`mix-blend-mode: overlay`, re-offset per frame) + soft vignette in the HTML overlay. three.js route:
  `MeshPhysicalMaterial` (transmission/thickness for gummy, clearcoat 1 / clearcoatRoughness 0.06 for pills, metalness 1
  for chrome), RoomEnvironment PMREM, `BokehPass`, `accum-render-3d` for blur.
- typography: inflated rounded lowercase wordmark (Google: Fredoka / Baloo 2 bold, bevelled + inflated mesh); tagline DM
  Sans 600, 32 px, tracking 0.26 em, caps; CJK Noto Sans SC 500, tracking 0.36 em.
- motion rules: 24 fps; long-tail ease (expo-out k ≈ 7.2: ~80 % of a move in the first 20 %); impacts on 120 bpm beats;
  physics-feel (sink, jiggle, ripple) via closed-form or precomputed ODE; one slow-mo apex; end on a clean held hero.
- signature moves: `cloner-bed-ripple`, `jelly-type-drop`, `shockwave-flip-field`, `accum-render-3d`, `time-remap-clock`.
- do: keep 2–3 materials, soft big area lights + a coloured rim strip, DOF that isolates the hero; keep the type readable
  at the end. don't: hard shadows, saturated colours across the board, 30 fps "2D" timing, unmotivated camera moves.
- source: `demos/04-3d-render/blender/{scene,sim,render,common,make_letters}.py`, `index.html`, `cues.json` (MIT; glyph
  meshes in `assets/mesh` are OFL-derived).

### `cloner-bed-ripple` — NEW (3d)
- look: a dense grid of glossy capsules (or spheres) like a pin-art bed; effector bands roll across it raising and tilting
  the pills; impacts send damped ripple rings outward.
- params: height = Σ sweeps + Σ rings. Sweep band: `exp(−(u/σ)²)` with u = projection on direction − speed·(t − tMid)
  (e.g. speed 3.4, σ 0.8, amp 0.26); radial ring: same with r; ripple packet: `amp·exp(−(ρ/(1.1λ))²)·cos(2πρ/λ)·e^(−τ/decay)/
  sqrt(1 + r/0.6)`, ρ = r − cτ (c 3.4–4.4, λ 0.95–1.15, decay 0.85–1.1); pills tilt along the height gradient.
- build: three.js `InstancedMesh` of capsules (CapsuleGeometry), per-frame matrices from the closed form (deterministic);
  props `cols`, `rows`, `shape`, `colors{cap, body}`, `sweeps[]`, `impacts[{x, y, at, amp}]`, `camera`, `dof`.
- source: `demos/04-3d-render/blender/sim.py` (`sweep`, `ring`, `wave_height`) (MIT).
- value: satisfying "ASMR" background/floor for product idents, logo stings and hero sections; field can spell shapes.

### `jelly-type-drop` — NEW (text, 3d)
- look: inflated glossy candy letters fall one per beat into a soft bed, sink, wobble with jelly follow-through and settle;
  when a later shockwave reaches them they hop again in reading order.
- params: drops at 0.5/1.5/2.0/2.5 s; soft bed force = A(e^(pen/λ) − 1) − Cd·v (A 1.43, λ 0.02, Cd 85), integrated at dt
  1/2400 s; squash = damped oscillator kicked by bed deceleration; hop air time 0.26 s; re-lifts on 16ths (3.375–3.75).
- build: three.js `TextGeometry` with large bevel (bevelSize ~0.3 em, segments 8) as "inflated"; per-letter vertical track
  precomputed with the ODE at mount (pure function of props) and indexed by frame; jelly = non-uniform scale (sy ↓, sxz ↑
  by 1/sqrt). Props: `text`, `font`, `material: 'gummy'|'plastic'|'chrome'`, `beats[]`, `bedStiffness`, `jiggle`.
- source: `demos/04-3d-render/blender/sim.py` (`bed_force`, `letter_track`, `herm`), video 0.3–2.8 s (MIT).
- value: playful brand word reveals; with `cloner-bed-ripple` gives the full C4D-ident look in the browser.

### `shockwave-flip-field` — NEW (3d, fx)
- look: a heavy chrome ball slams into the field; a ring front races out; capsules in the front leap, tumble and land
  flipped so their other-coloured half faces up, recolouring the whole field as the front passes; some fly off frame.
- params: ball hang 5.8–5.93 then slam 5.975; front speed 5.0 units/s; colour change cream → lilac; fling height ∝
  1/distance; slow-mo apex 0.35× then catch-up ≤ 1.35× (time-remap-clock).
- build: per-instance `arrive = r / speed`; for τ = t − arrive in [0, flight]: ballistic arc + rotation of π about a
  random horizontal axis (seeded) → instance shows its body colour; two-colour capsule = two half-meshes or vertex colour
  by local y. Props: `impact {x, y, at}`, `speed`, `flipColor`, `flingRatio`.
- source: `demos/04-3d-render/blender/sim.py`, `cues.json` (ball_enter, hang, ball_contact, shock_speed), video 5.6–7.0 s (MIT).
- value: a hero "state change" moment (brand colour takeover, before/after, launch), strong for idents and thumbnails.

### `long-tail-camera` — COVERED by `terrain-build-3d` (cinematic flyby camera) + core ease
- look: camera moves that cover ~80 % of the distance in the first 20 % then glide; DOF focus pulls with the shot.
- params: expo-out k 7.2 (`1 − e^(−k u)` normalised); shots camA 0.54–1.9, camB 3.9–5.75, camC 6.25–9.2; focal length
  and f-stop keyed per shot.
- build: existing camera rigs + `ease.expoOut`; add `dof` focus keys where three motions use `BokehPass`.
- source: `demos/04-3d-render/blender/scene.py`, `sim.py` (`expo_out`) (MIT).
- value: makes any 3d motion feel like a product film.

Sound idea: ASMR soft thuds/squishes per landing (from `events.json` contact times written by the sim), bubbly pops on
capsule flings, airy pad, one deep hit on the ball slam.

---

## Notes for builders
- Shared determinism pattern in all 5 demos: seeded hash (`mulberry32`/FNV) + closed-form physics or precomputed ODE,
  `cues.json` on a bpm grid read by picture and sound, sub-frame motion blur at render time. Mirrors Remotion's model.
- Copy ideas and numbers, not code: every source file is MIT, but write our own TS implementations and credit
  "mg-styles-15 (MIT)" in technique notes.

COUNTS: styles=5 new=16 extends=9 covered=2

NEW technique ids: `ink-brush-boil`, `smear-frame`, `flipbook-riffle-outro`, `flame-sprite`, `iso-city-build`,
`colour-ignition-wave`, `iso-ground-title`, `accum-render-3d`, `flat-person-desk`, `icon-grid-burst`, `one-line-journey`,
`time-remap-clock`, `light-pulse-path`, `cloner-bed-ripple`, `jelly-type-drop`, `shockwave-flip-field`.
EXTENDS: `exposure-sheet` (core onTwos), `cel-impact-burst` (comic-burst), `iso-tile-ring-drop` (iso-bar-chart),
`iso-stat-cards` (callout-labels), `impact-drop` (bouncing-ball), `flat-city-popup` (city-skyline), `bubble-shape-wipe`
(transition blob), `dot-logo-lockup` (glyph-orbit-logo), `stroke-to-fill-medallion` (line-draw-on).
COVERED: `tracked-serif-wordmark` (blur-in-title), `long-tail-camera` (terrain-build-3d + core ease).

---

# Part B: mg-styles-15 — group B (08-morph, 19-paperclip, 22-hud, 06-collage, 12-aurora-glass)

Source: `opus_sources/repos/mg-styles-15` (MIT, © Vincentwei1021). Per film: `videos/<nn-name>.mp4`, `prompts/<nn-name>.md`,
`demos/<nn-name>/` (index.html / JS / cues.json / audio.py). Frames: `analysis/frames/mg/<nn-name>/` (sheet_1fps.jpg,
full_01..10.jpg at t = 0.5 … 9.5 s, burst_*.jpg). Everything below is described in our own words; numbers are read from
the frames, cues.json and code constants. Every film is a 10.000 s web page rendered as a pure function of t
(`window.renderAt(t)`) — the same contract as a Remotion composition, so all of it ports frame-driven.

Comparison baseline: `catalog.json` (109 motions), `transitions.json` (34 transitions), `docs/PLAN.md`.

---

## 08-morph — "morphe. — One Shape, Every Story" (1920×1080, 30 fps)

Second by second (frames + cues.json, 150 bpm, beat 0.4 s):
- 0.0–0.6 an ink drop falls on cream paper and squashes into a black mug with steam strands and a saucer line (lands 0.4).
- 1.3–2.0 the mug crouches (anticipation), goes through a red circle while the steam strands become sun rays; a marigold
  colour field blooms out of the sun as a feathered disc (1.62) and fills the frame; rays click round one notch per beat.
- 2.4–3.2 sun sinks onto a horizon, the lower rays flatten into three reflection waves; the frame splits: red sky over an
  ultramarine sea (wipe 2.45 / 2.6).
- 3.6–4.4 the sunset sinks into the sea (blue floods up, 3.98) and pops back out as a cream gull flapping (wing upper edges
  are arcs of the sun's own radius — shared geometry makes the morph read).
- 4.8–5.4 gull → circle → paper plane; 5.6 launch along a dashed trail, loop-the-loop with a stall upside-down at the apex
  (6.04–6.14, music drops out), dive.
- 6.3–6.4 the plane collapses into a capsule and slams into a red location pin; cream field returns (6.4) with a shockwave;
  the pin hops, dashed loop path stays as a drawn trace.
- 7.0–7.6 pin → circle → cream heart on a red field (7.23); two heart beats (7.8, 7.93).
- 8.0–8.6 figure-ground swap: the heart turns ink while a dark field spills from under it; heart → circle → the letter
  "m"; letters o-r-p-h-e fly in one by one (step 0.075 s, travel 0.42 s) with motion blur; a red full stop lands last;
  coloured dashes (one per palette colour) stream in under the wordmark and line up (9.14–9.38). Tagline 8.95.
- Persistent UI: bottom-left chapter "0N/07 + CJK word + mono gloss", bottom-right 7-dot progress pill.

### style `shape-morph` — Shape Morph (graphic storytelling)
- essence: one hero silhouette continuously becomes the next meaningful icon on the beat; flat solid colour fields swap
  behind it; one shape, many stories, ending on a logo.
- palette: paper/bg `#F4EEE3` (cream), ink `#16151B`, accent `#FF4F2B` (vermilion), accent2 `#FFB627` (marigold), accent3
  `#2438E8` (ultramarine). Fields alternate between these; never more than 2 visible at once. Colour lerps in OKLab.
- texture/post: real paper texture as a luminance modulation (zero-mean, ±2 %: `pixel *= 1 + paper*(r+g+b)`), plus a
  512² gaussian grain tile (σ≈2 levels, softened 3×3, offset per frame by (f·197, f·331)), soft vignette. In Remotion: an
  SVG `feTurbulence` grain + a paper image in `mix-blend-mode: multiply` at 4–6 % — or our core `PaperTexture` + `FilmGrain`.
- typography: rounded geometric sans for the wordmark (Outfit, weight 600), mono gloss (IBM Plex Mono 500), CJK
  HarmonyOS Sans SC 500 for chapter words. Chapter text tiny (≈1.8 % H).
- motion rules: 30 fps full (not on twos); morph curve `cubic-bezier(0.7,0,0.3,1)` with ≈3-frame cushions; each A→B
  goes A→circle→B, each half 8–12 frames; 10–15 % squash/stretch along the travel direction + 15–25° rotation during
  the morph; impact squash = damped sine `A·sin(2πτ/0.28)·e^(−7.5τ)` (A 0.07–0.26); anticipation crouch 0.3 s before
  each morph; motion blur by averaging sub-frame samples (0.5 shutter). Camera: ±0.5° slow roll, 1–3 % breathing zoom.
- signature moves: `shape-morph-chain`, `field-bloom-wipe`, `dashed-flight-loop`, `wordmark-fly-assemble`.
- do: keep vertex counts equal and first vertices aligned; share geometry between consecutive icons (sun radius = gull wing
  arc = pin eye = full stop). don't: morph two complex shapes directly (knots), use more than one hero shape, use gradients.
- source: `demos/08-morph/index.html`, `cues.json`, `prompts/08-morph.md` (MIT).

### `shape-morph-chain` — NEW
- look: a solid icon (mug, sun, sunset, gull, plane, pin, heart, letter) morphs into the next through a circle or capsule,
  rotating and stretching on the way; its sub-parts (steam → rays → waves; mug handle hole → pin eye) morph in lockstep.
- params: body resampled to 240 points, holes 72, open strokes 24 points each (8 stroke slots per icon), shading facet 60.
  Absent parts are "collapsed" (all points at one spot, width 0) so slot counts stay constant. Alignment = brute-force
  cyclic shift minimising Σ‖A_i − B_(i+s)‖² (step 2 for speed); orientation normalised by signed area. Morph halves
  0.3–0.4 s; ease (0.7,0,0.3,1); rot 18–26°; squash 0.12–0.14; path control point offsets the travel into an arc.
- build: React component `<ShapeMorph shapes={[svgPath…]} via="circle" />`. Precompute (useMemo) `samplePath(d, N)` via
  `getPointAtLength` (or `svg-path-properties` for SSR), orient, `alignTo(prev, next)`. Per frame: find segment, `u =
  bezier(0.7,0,0.3,1)(progress)`, lerp points (first half A→circle, second circle→B), apply matrix (scale 1+sq·sin(πu)
  along velocity angle, rotation rot·sin(πu)), output one `<path>`. Colour via OKLab lerp. Props: `shapes[] {d, fill,
  holes?, strokes?}`, `via` circle|capsule|none, `beatFrames`, `squash`, `rotate`, `points` (240), `background fields`.
  Can also accept emoji/icon-font glyph outlines (opentype.js) as shapes.
- source: `demos/08-morph/index.html` (sampleD, resamplePoly, bestShift, alignTo, MP table) (MIT).
- value: the core "visual storytelling" grammar — product-to-benefit explainers, logo reveals, icon sequences for slides.
  Nothing in the catalog morphs arbitrary outlines today (petal-bloom / heart-draw-fill are fixed shapes).

### `field-bloom-wipe` — EXTENDS transition `iris`
- look: the next background colour grows out of the hero shape as a disc whose edge is soft while it moves fast and crisp
  when it stops; or a horizon line rises/falls as a straight edge (sky/sea split).
- params: feather width proportional to edge speed (fw > 1.5 px → feathered radial gradient mask, else hard clip); bloom
  ease (0.42,0,0.12,1) ≈ 0.4–0.5 s; the shape's own decor is redrawn inside each field so the field "owns" its decoration.
- build: add to `iris` props `origin` (follow a subject's x/y per frame), `featherBySpeed` (px per px/frame), `shape`
  circle|horizontal-edge, `color`. Implementation: radial-gradient mask on the incoming layer.
- source: `demos/08-morph/index.html` drawFields / drawSoftField (MIT).
- value: colour-block scene changes that feel caused by the subject, for any explainer.

### `dashed-flight-loop` — EXTENDS `map-route`
- look: a paper plane takes off along a straight run, loops the loop, hangs upside-down at the apex for ≈3 frames, dives;
  a dashed white trail is drawn behind it and stays; landing triggers a shockwave ring.
- params: path = line + 3 circular quarter arcs (r 255 px on 1080p) + line to target; launch ease (0.32,0,0.1,1), hang
  0.1 s, dive `u^1.65`; heading from finite differences ±2 samples; dash ≈ 12/8 px, 2 px white @60 %.
- build: `map-route` gains `style: 'loop'` (path generator), `apexHang` (frames), `trail: 'dashed'`, `marker: 'plane'`,
  `onLand: 'shock'`. Sample the path once (1200 pts), animate `u(t)`.
- source: `demos/08-morph/index.html` FP / flightU (MIT).
- value: "send / launch / deliver" beats in product explainers.

### `wordmark-fly-assemble` — EXTENDS `glyph-orbit-logo`
- look: after the hero becomes the first letter, the remaining letters fly in one after another from the hero point,
  motion-blurred, settle into the wordmark; the final dot in accent colour lands last; short colour dashes from each scene
  stream in under the logo and line up as a palette signature.
- params: per-letter step 0.075 s, travel 0.42 s, fly 0.32 s, expo-out (0.16,1,0.3,1); end dots stagger 0.04 s, dur 0.7 s.
- build: new `mode: 'fly-from-point'` on glyph-orbit-logo with `origin`, `step`, `travel`, `dotColor`, `paletteDashes[]`.
- source: `demos/08-morph/index.html` drawLetters, drawEndDots (MIT).
- value: logo end cards that are built from the film's own parts.

### `impact-squash` — COVERED by `bouncing-ball` / `blob-mascot`
- damped-sine squash on landing and anticipation crouch before a move. Worth extracting the formula
  `A·sin(2πτ/0.28)·e^(−7.5τ)` into `src/core` easing helpers so every motion can call it.

---

## 19-paperclip — "How Many Elements Hide in a Phone?" (PaperClip-style explainer, 1920×1080, 30 fps)

Second by second:
- 0.0–0.4 a phone photo sticker (white outline, soft shadow) falls in rotated, blurred, slaps flat at 0.33 with a small
  wobble; 0.2–0.9 the question title (heavy CJK sans, 2 lines) wipes in line by line from a mask; a red underline draws.
- 1.25–2.0 slow drift, then the camera flies down the giant canvas (van Wijk zoom-pan, slight zoom-out mid-flight).
- 1.9–2.8 four part stickers (battery, mainboard, chip, magnet) slap around the phone; leader lines draw from the parts;
  labels (CJK + tracked English) and element badges (dark rounded squares "Li", "Co", "Cu Sn Au", red "Nd Pr") pop in.
- 3.3–4.3 fly to the periodic table: 118 rounded tiles; used elements light dark one by one, rare-earth row lights red;
  a giant "8 → 70 /118" count-up ticks; badges peel off the part stickers and fly into their tiles.
- 5.2–6.3 bar chart where each bar is a row of element chips (23 transition metals, 16 rare earth in red, 12, 11, 8),
  numbers at the ends.
- 6.3–7.3 world map (light grey land on a rounded plate): ore stickers (cobalt, tin, lithium) with labels, red curved
  supply routes draw from mines to a red factory pin in China.
- 7.3–8.4 two-stage pull-out: the whole canvas turns out to be the screen of a phone (white rim, dark bezel), lifted like
  a sticker peeling up; it tilts and parks on the left of a dark slate frame.
- 8.0–10 title card on the right: giant red "70" with white outline flies in blurred and lands (ring flash), "/118" in grey,
  heavy CJK headline with a red underline, small caption; scene breadcrumbs (01 拆解 / 02 周期表 / 03 分布 / 04 产地) bottom.

### style `sticker-explainer` — Sticker Explainer (PaperClip / 回形针 knowledge-video look)
- essence: cut-out photo stickers with fat white outlines + flat icons + exact charts on one giant calm canvas, linked by
  long continuous camera moves; serious, dense, every beat adds a new visual.
- palette: bg canvas `#E9EEF2` (cool off-white) with a 48 px dot grid `#C5CFD8`; card `#F7F9FB`; ink `#25313D` (slate);
  mid `#8C9AA8`; accent `#FF5A36` (signal orange-red, used only for the key number/rare earths/routes); end-frame slate
  `#1D2731` → `#161E26` radial.
- texture/post: none on the canvas (clean), shadows do the depth: `drop-shadow(0 (6+34·lift)px (10+34·lift)px
  rgba(22,34,46,.26))`; camera motion blur only during flights.
- typography: Inter (700–900 for numbers, `tnum`), Alibaba PuHuiTi / any heavy CJK sans for titles; tracked caps English
  sublabels at ≈1 % H; one size jump per screen (huge number vs. tiny caption).
- motion rules: 30 fps; camera flights 0.6–1.0 s with van Wijk "zoom out while travelling" (rho 0.85; 1.25 for the pull);
  stickers slap in 0.2 s (scale 1.3→1, rot 6°→0, shadow lift 1→0) then damped wobble `e^(−10t)·cos(2π·4.5t)`;
  labels pop with ease-out-cubic; screen jolts 3–8 px on big slaps.
- signature moves: `sticker-slap`, `canvas-flythrough`, `periodic-table-lightup`, `chip-stack-bars`, `exploded-parts-leaders`.
- do: equal-weight sans, strict alignment, numbers to scale; 2–3 colours + one accent; one continuous shot.
  don't: drop shadows without outline, decorative gradients, more than one accent, hard cuts.
- source: `demos/19-paperclip/index.html`, `tools/stickers.py`, `prompts/19-paperclip.md` (MIT; photos CC0/PD).

### `sticker-slap` — NEW
- look: a photo cut-out with a thick white outline drops onto the page from "above the camera": large, tilted, blurred and
  with a wide soft shadow, then lands flat with a tiny squash and a two-cycle wobble; the shadow tightens on contact.
- params: outline 8–12 px at 1080p (10 px here), anti-aliased (distance-field edge `clamp(OUT+0.75−dist)`); slap 0.2 s:
  `s = 1 + 0.3·(1−p²)`, `rot = 6°·(1−p²)`, lift = 1−p²; after land `s = 1 − 0.035·wob`, `rot = −0.8°·wob`,
  `wob = e^(−10t)·cos(2π·4.5t)`; shadow offset 6→40 px, blur 10→44 px with lift; optional camera jolt 4–8 px.
- build: `<Sticker src outline={10} outlineColor="#fff" land={frame} from="above" />`. Outline at runtime without
  preprocessing: SVG filter `feMorphology operator="dilate" radius=r` on SourceAlpha → `feFlood` white → `feComposite in`
  → merge under the image (or 24-direction offset-stamp trick on canvas: draw the alpha 24× around a circle of radius r,
  `source-in` fill white). Requires transparent PNG input (document: run rembg/birefnet yourself, CLI could do it with
  an opt-in Python helper). Props: `src`, `outline`, `outlineColor`, `shadow`, `land`, `fromScale`, `fromRotate`, `wobble`.
- source: `demos/19-paperclip/index.html` slap(), shadow(); `tools/stickers.py` cutout() (MIT); also `06-collage` rimmed().
- value: the universal "photo → sticker" treatment for explainers, social posts, product callouts; overlay-capable.

### `canvas-flythrough` — NEW
- look: one huge layout (here 2400×5900) holding all sections; a virtual camera flies between "stations" — zooming out
  slightly while travelling, settling with a long ease — and at the end pulls all the way out to reveal the canvas was a
  phone screen.
- params: keys `{t, x, y, z, move: drift|fly|pull, anchor?}`; fly ease (0.62,0,0.22,1), pull (0.5,0,0.08,1);
  `d3.interpolateZoom` with rho 0.85 (fly) / 1.25 (pull); drift segments use sine in-out on x/y and log-space z;
  anchored moves keep a chosen world point travelling on a straight screen line. Camera blur: 4 affine taps across the
  shutter (pan offset + radial zoom via a displacement map) + gaussian σ ∝ speed (capped 6 px), off below 1.2 px/frame.
- build: Remotion `<CanvasCamera keys={…}>{children}</CanvasCamera>` that applies a `matrix()` to an absolutely sized
  world div; implement van Wijk inline (≈20 lines) to avoid d3. Motion blur via our existing sub-frame or a
  speed-proportional `filter: blur()` along the velocity (SVG `feGaussianBlur stdDeviation="sx sy"`). Optional `frame`
  prop = 'phone' wraps the world in a device bezel for the final pull-out reveal.
- source: `demos/19-paperclip/index.html` cam(), camBlur(), cues.json `cam` (MIT).
- value: explainers, product tours, pitch "one-shot" infographics; host agents lay out sections and just list stations.

### `periodic-table-lightup` — NEW
- look: the 118-element periodic table as rounded tiles; selected elements light up in sequence (ink fill, white symbol),
  a category lights in accent; a big count-up "N /118" sits in the empty top gap; tiles can receive flying badges.
- params: tile ≈ 92 px on the 2400-wide canvas (radius 12, 2 px inset stroke `#CDD6DE`), lit fill `#25313D`, accent fill
  `#FF5A36`; light-up stagger ≈ 1 frame per tile with ease-out pop (scale 1.15→1); counter ticks one value per frame.
- build: generic `<GridLightup grid="periodic|custom" lit=[…] accent=[…] order="sequence|random|by-row" counter />`;
  ship the periodic layout as data (symbol, row, col, group). Custom grid mode = any category matrix (e.g. 50 states,
  feature matrix).
- source: `demos/19-paperclip/index.html` tiles / TP / USED (MIT).
- value: "how many X of Y" science/finance explainers; data storytelling.

### `chip-stack-bars` — NEW
- look: horizontal bars built from labelled unit chips (one chip per item), each row a category with a tiny CJK/English
  label above and the count at the end; the highlighted row uses the accent colour.
- params: chip ≈ 26 px square, 4 px gap, radius 4; rows grow left-to-right chip by chip (1 chip/frame), count number
  rolls; 5 rows here (23 / 16 / 12 / 11 / 8).
- build: `<ChipBars rows={[{label, items:['Ti','V',…], accent?}]} />`; deterministic stagger; reuse number roll from
  `number-counter`.
- source: `demos/19-paperclip/index.html` CATS / chart section (MIT).
- value: unit-chart (isotype) alternative to bar charts — counts of things that have names.

### `exploded-parts-leaders` — EXTENDS `callout-labels`
- look: sticker parts slap around a central product, a dot on each part, a 2 px leader line draws to a label block (bold
  CJK name, tracked English sublabel, row of element badges).
- build: new `variant: 'parts'` with `items[{src, anchor, labelPos, title, sub, badges[]}]`, sticker slap per item (reuse
  `sticker-slap`), leader draw 0.28 s ease-out-cubic, badges pop 2 frames apart.
- source: `demos/19-paperclip/index.html` PARTS (MIT).
- value: teardown / anatomy shots for hardware, food, product pages.

### `supply-route-map` — EXTENDS `map-route`
- look: a flat world map (light land on a rounded plate), photo stickers of origins with labels, red curved routes
  draw from origins to one destination pin.
- build: `map-route` gains `style: 'world'` (Natural Earth 110m topojson rendered to SVG paths at build time — PD data),
  `routes[{from, to, label, sticker}]`, great-circle or quadratic arc, stroke-dash draw-on.
- source: `demos/19-paperclip/index.html` + `assets/countries-110m.json` (Natural Earth, PD) (MIT).
- value: supply chains, travel, shipping, "where it comes from".

### `hero-count-card` — COVERED by `number-counter`
- the end card's giant outlined red "70" with "/118" + headline is a number-counter layout; at most add `outline` and
  `ringFlash` props.

---

## 22-hud — "KESTREL-9 · Target Acquired" (Cyberpunk HUD / FUI, 1920×1080, 30 fps)

Second by second:
- 0.0–0.12 black; CRT power-on: a hot horizontal line opens vertically into the picture.
- 0.12–1.5 boot: crosshair lines shoot out to the frame edges, outer scope ring draws (0.4), tick ring (0.55), inner
  ring segments (0.7), left panel (0.9), right panel (1.15), hex grid revealed by a wave from the centre (1.2), wireframe
  globe fades in (1.4); boot log types line by line with "[OK]" ticks; every element appears with a 4-frame flicker.
- 2.4–4.4 data live: numbers decode from scrambled glyphs (5 frames) and roll; sparklines; radar sweep with blips (period
  2 s); "SLANT RNG 3145.2" counts down; a scan band sweeps across the globe; ground track draws.
- 4.4–5.9 "SIGNAL DETECTED": the globe turns onto the target (Asia), three candidate boxes appear with MATCH % (4.9, 5.4,
  5.9).
- 5.9–6.23 four corner brackets fly in from the screen corners and snap 1.4→1.0 on the target; lock ratchet ticks.
- 6.4 LOCK: white-hot impact frame, then an orange re-ink wave spreads radially from the target and flips the whole HUD
  from cyan to alert orange; "目标锁定 | LOCKED" banner opens; the camera dives into the globe (6.43–7.1), coastline
  fills the scope; coordinates "N31°14′ E121°29′" type (7.25); alert pulses every 0.5 s.
- 8.4–9.4 outro: map intel (city dots, sea tracks), uplink bar fills (9.0–9.4).
- 9.77–10 CRT power-off: picture squashes to a hot line, the line shrinks to a dot.

### style `cyber-hud-fui` — Cyberpunk HUD / FUI (film-UI grade)
- essence: dense but restrained film-interface graphics — cyan linework on near-black teal, mono data, rings and
  brackets — that flips to orange alert at the climax.
- palette: bg `#020A0D` → centre `#030F12` radial; ink/line `#00E5FF` (cyan), dim `#0B7C8C`, deep `#0E3A42`, hot white
  `#E8FEFF`, rec red `#FF2A1F`; alert ramp `#FF6600` (core) → `#FFDBB3` (white-hot).
- texture/post (in order): bloom on the line layer; text composited AFTER bloom (crisp glyphs + 1.5 px glow + dark knock-out
  halo); radial chromatic aberration `off = dc·(CA·(0.3 + 1.2·r²))`; 3 px scanlines (`0.9 + 0.1·cos(2πy/3)`); a
  rolling interference band (gaussian, +7 %); vignette 0.55 at corners; soft shoulder (overbright bleeds to white rather
  than clipping hue); per-frame grain ±1.4 % + 1/255 dither; micro-glitch = horizontal slice displacement in 54 bands,
  ≤7 % width, only on beats.
- typography: Chakra Petch 600–700 (big numerals, banners), Rajdhani 700 (labels), JetBrains Mono 600 (data), HarmonyOS
  Sans SC 900 (CJK banner). Data text 10–14 px on 1080p — tiny, many columns.
- motion rules: hierarchical stagger (frame → rings → panels → data), every element "powers in" with a 4-frame
  flicker (opacity 0.7, 0.1, 1.0, 0.45, then 1); numbers decode over 5 frames; brackets fast-out slow-in; beats on a
  120 bpm grid; nothing eases slowly except the camera dive (cubic out 1.45 s).
- signature moves: `crt-power-on-off`, `alert-reink-wave`, `target-lock`, `holo-globe`, `fui-panels`.
- do: keep 80 % of the frame quiet and dim; reserve hot white for the focus; one colour flip per film.
  don't: rainbow neon, thick strokes (>2 px), big blur glows on text, random glitches everywhere.
- source: `demos/22-hud/index.html`, `js/hud.js`, `js/holo.js`, `js/post.js`, `cues.json` (MIT; map data Natural Earth PD).

### `crt-power-on-off` — NEW (motion + transition `crt`)
- look: power-on — black, a hot cyan-white horizontal line appears at mid-height and opens vertically into the image;
  power-off — the image squashes vertically to a glowing line (≈0.6 of the time), then the line shrinks horizontally to
  a bright dot that fades.
- params: on: aperture half-height = `open·0.5`, line glow `exp(−((dy−ah)·H/(3+6(1−open)))²)·(1−open)·1.6`, horizontal
  falloff gaussian of width 0.18+0.9·open; duration ≈ 4–6 frames. off: last 6 frames; `sy = (1−cz/0.6)^2.2` (min 0.003),
  then `sx` 1→0 over cz 0.6–1; brightness ×(1+2cz); dot gaussian.
- build: WebGL-free version: two layers — content with `transform: scaleY(sy) scaleX(sx)` + `filter: brightness()`, plus
  an SVG line/ellipse with gaussian glow. Expose as transition `crt` (in/out) and as `film-look` prop `powerOn/powerOff`.
- source: `demos/22-hud/js/post.js` FINAL_FS (uOpen, uClose) (MIT).
- value: retro-tech / gaming intros and outros, "screen off" endings; fits with the synthwave style too.

### `alert-reink-wave` — NEW
- look: at the climax a ring expands from the target; everything inside it is re-coloured from cyan to orange (by
  brightness), a thin white-hot front and a softer orange annulus ride the edge; selected elements (true reds, some
  panels) keep their colour.
- params: wave radius grows to ≈1300 px in ≈0.45 s; inside mask `1 − smoothstep(R−110, R, d)`; front `exp(−((d−R)/9)²)`;
  glow annulus σ 40 px at R−22; re-ink maps luminance I and whiteness w = min/max to `mix(#FF6600, #FFDBB3,
  smoothstep(0.3, 0.95, w))·I`; background tints to a warm near-black.
- build: in Remotion, render the HUD twice (cyan and alert palettes) and reveal the alert copy through an SVG radial
  mask with a feathered edge + a stroke circle for the front (cheap and deterministic). Props: `origin`, `at`, `duration`,
  `fromPalette`, `toPalette`, `keep` (ids exempt). Generalises to any palette swap (day→night, calm→alarm, brand A→B).
- source: `demos/22-hud/js/post.js` COMP_FS reink/uWave (MIT).
- value: the climax beat of any HUD, alert, "status changed" or brand re-skin moment; could be a transition `reink`.

### `target-lock` — NEW
- look: candidate boxes with ids and MATCH % appear over a subject; four L-brackets fly in from the frame corners, close
  in and snap onto the target (1.4→1.0 scale), a lock ratchet fills, then a banner "TARGET LOCKED" opens from the centre
  with coordinates typing below.
- params: brackets travel 5.9→6.17 s (≈8 frames), snap 1.4→1.0 with fast-out slow-in over ≈5 frames; arm length ≈ 0.4 of
  half-size; line 2 px square caps; candidates 0.5 s apart; ratchet one tick per 3 segments; banner opens 0.3 s.
- build: `<TargetLock target={{x,y,size}} candidates={[…]} label="TARGET LOCKED" labelCn coords at />` pure SVG;
  overlay-capable on video/images (face, product, map). Reuse `scramble` decode for labels.
- source: `demos/22-hud/js/hud.js` brackets(), acquire(), banner() (MIT).
- value: gaming edits, tech reviews ("found the bug"), product highlight on a screenshot. hud-chrome has no lock-on today.

### `holo-globe` — NEW
- look: a three.js wireframe Earth: coastlines grow on, 10° graticule, fibonacci-dotted land, fresnel atmosphere shell,
  tilted orbit rings, a scan band sweeping every 2 s; it turns onto a target, a beam and surface rings mark it, then the
  camera dives to a regional map with city dots and moving sea tracks.
- params: coastlines as LineSegments with per-vertex `aU` (0..1 along the line) and per-line start offset → draw-on by
  threshold in the shader; graticule 10°, local 1° grid near the target fades in with zoom; turn 1 s hermite; dive cubic-out
  1.45 s, pitch in-out 1.9 s; colour `#00E5FF`, additive.
- build: `@remotion/three` scene; coastline data from Natural Earth 50m/110m (PD) baked to JSON; props `target {lat,lon}`,
  `turnAt`, `diveAt`, `color`, `dots`, `graticule`, `scanPeriod`, `transparent` (overlay mode).
- source: `demos/22-hud/js/holo.js` (MIT), `assets/land-50m.json` (Natural Earth, PD).
- value: geo explainers, news intros, cyber/defence, logistics; pairs with `target-lock` and `supply-route-map`.

### `fui-panels` — EXTENDS `hud-chrome`
- look: side columns of FUI panels (index number + label + CJK sub), typed boot log with `[OK]`, decoding numbers, rolling
  readouts with unit bars, sparklines, spectrum bars, a radar with a conic sweep and blinking blips, a hex grid revealed by
  a radial wave, header with call sign, REC dot and UTC clock, scope rings with ticks.
- params: power-in flicker [0.7, 0.1, 1.0, 0.45] over 4 frames; decode: each char resolves when hash < f/n, n = 5 frames,
  glyph set `A–Z0–9#%&/<>`; radar period 2 s, blips fade e^(−t); hex cell 30 px, lines 16 % opacity, 3.5 % of cells
  twinkle at 5 Hz; panels 0.25 s apart.
- build: hud-chrome new `theme: 'fui'` and props `panels[]`, `radar`, `hexGrid`, `bootLog[]`, `decode` (frames), `alertAt`
  (hooks `alert-reink-wave`). Keep everything SVG; scanlines/CA via `film-look`.
- source: `demos/22-hud/js/hud.js` flick(), scramble(), panel(), radar(), spark(); `post.js` hex grid (MIT).
- value: makes hud-chrome usable as a full sci-fi interface skin, not just crop marks.

### `crt-post-stack` — EXTENDS `film-look`
- scanlines (3 px), rolling interference band, radial CA with r² growth, slice micro-glitch on beats, soft-shoulder tone
  map, crushed-black white-hot impact flash. New `film-look` props: `scanlines`, `rollBand`, `sliceGlitch`, `impactFlashAt`,
  preset `crt`. (The library's core Scanlines texture exists; this adds the CRT behaviour.)

---

## 06-collage — "NOGGIN Quarterly — THE MIND IS A COLLAGE" (Collage / Cut-out, 1920×1080, rendered 30, animated on 12)

Second by second (90 bpm; every visual event on the 1/12 s grid):
- 0.0–0.33 a giant engraved pointing hand slaps the portrait in; 0.33 Victorian portrait cut-out (mono halftone, scissor
  white rim) slaps onto kraft paper; 0.67 a red disc slaps behind it; 1.0 torn newspaper scraps.
- 1.33–2.0 the jaw (a separate cut piece) flaps open/shut in three replacement poses: speech scraps "AHEM", red "咳咳",
  black "!" chips pop beside the mouth.
- 2.33 a stamp "沿虚线剪开 CUT ALONG THE LINE" slaps; 2.5–3.17 a dashed cut line runs across the forehead and scissors snip
  along it on 16ths (5 snips); 3.33–3.67 the scalp rattles; 3.67–4.0 one 8th of dead air.
- 4.0 POP: the top of the head flips open on a brass brad hinge, a torn wedge of nebula space opens, ransom-letter "BANG!"
  chips and paper confetti burst; 4.33 rocket, 4.67 earth, 5.0 birds, 5.33 roses, 5.5 butterflies spill out.
- 6.0–6.5 engraved manicule hands point and tap; 6.33 a black diagonal band slaps across the bottom "THE MIND IS A COLLAGE";
  6.67–7.17 hero: CJK ransom tiles "脑 洞 大 开" (red/black/white blocks) slap one per 16th.
- 7.5 a rip runs down the page (2 steps), 7.67 the two halves crack apart with a 2-frame shake, then peel off like curling
  paper showing the kraft back, revealing a red page.
- 8.33 end card: torn-paper masthead strip "NOGGIN", CJK subtitle, the opened head in the right corner; 8.67 jaw flaps
  again; 9.0 round black button badge "随刊附赠剪刀一把 SCISSORS INCLUDED"; 9.5 the lid snaps shut.

### style `collage-cutout` — Collage / Cut-out (Dada × Monty Python × constructivist editorial)
- essence: public-domain engravings and photos cut out with scissors, halftoned, slapped onto kraft/newsprint by an
  unseen hand, puppeted at the joints, animated at 12 fps; bold red/black diagonal type.
- palette: paper/bg kraft (texture, mid `#B89A72`), page red (texture, `#D2261C`), ink `#16130F`, paper white rim
  `#F4EFE4`, newsprint cream `#F2ECDF`, tape/brass `#D6A945`, deep brown shadow `rgba(34,20,8,.36)`.
- texture/post: every cut-out pre-baked: mono halftone 45°, period 6.5 px (tint `(0.93,0.88,0.78)`) for portraits; CMYK
  halftone period 5.5–6 px, 45–75 % mix, sat 1.1–1.25 for colour items; polygonal scissor rim 3.5–5 px (dilate → close
  concavities → straight-facet polygon, ±0.7 px vertex noise). Finish: grain in `overlay` 26 % (shifted per step), dust in
  `multiply` 35 % switching every 2 steps, warm multiply vignette 28 %. Hard drop shadows (blur 5 px, offset 3/5) that grow
  with lift.
- typography: Anton (condensed bold caps, English headlines), Noto Serif SC 900 in individual ransom tiles (CJK), Noto
  Sans SC 700 small text, a typewriter mono for captions; type always on paper chips/strips, rotated −5…−10°.
- motion rules: picture stepped at 12 fps; resting pieces boil at 6 fps with ±1.1 px jitter, moving pieces ±2 px and
  ±0.4°; slaps arrive in 3 steps from 1.38× scale with a 2-step dust puff; cuts on 16ths of 90 bpm; one 8th of silence
  before the big pop; rostrum camera moves on 6 fps steps.
- signature moves: `collage-puppet`, `scissor-cut`, `ransom-note-type`, `paper-tear-peel`, `sticker-slap` (variant
  'collage'), `stepped-boil`.
- do: real PD/CC0 imagery only; asymmetric, overlapping layout; motivated sound (snips, slaps, tape). don't: smooth 30 fps
  tweens, soft drop shadows, clean vector icons, perfectly straight placement.
- source: `demos/06-collage/index.html`, `work/prep.py`, `cues.json`, `prompts/06-collage.md` (MIT; images PD/CC0 —
  NASA, engravings, VCSL samples).

### `collage-puppet` — NEW
- look: a cut-out portrait split into pieces (scalp lid, face, jaw) pinned at pivots; the jaw swaps between 3 poses to
  "talk"; the scalp flips open on a brass brad like a lid, revealing a torn wedge of another image (space) from which
  objects spill out one per beat, each with its own little action (rocket flame flicker, bird flap, butterfly 2-frame flap).
- params: jaw poses closed / half / open, one pose per 12 fps step, 3 flaps at 1/3 s; lid opens in ≈4 steps with overshoot
  and a hinge slap, wedge torn edge amplitude ≈ 8–14 px; spill items every 1/6–1/3 s, each slapped (3-step drop from
  1.38×).
- build: `<CollagePuppet face jaw lid reveal={src} spill={[src…]} talkAt={[frames]} openAt />` — pieces are PNGs with
  pivots in a JSON layout (pivot x/y, rest rotation, pose rotations). Provide a procedural default (a drawn engraving-style
  head) so it works without assets; host passes its own cut-outs. Stepped time via `stepped-boil`.
- source: `demos/06-collage/index.html` drawHead, MOUTH, LIDF, SPILL; `work/prep.py` (MIT).
- value: Monty-Python style comedy beats, music/street-culture promos, "mind blown" explainers.

### `scissor-cut` — NEW
- look: a dashed "cut here" line draws across an image; a pair of scissors travels along it opening/closing on each snip;
  the cut piece then separates (lifts, flips, or falls).
- params: 5 snips on 16ths (1/6 s), blades open 0→25° and close within one step; dashes 10/7 px, 2 px ink; scissors scale
  ≈ 6 % W.
- build: SVG scissors (two blades rotating around a pivot), `pathLength` dash reveal behind the scissors; props `path`,
  `snips`, `at`, `separate: 'lift'|'flip'|'fall'`, `color`.
- source: `demos/06-collage/index.html` scissors(), CUT (MIT).
- value: "cut through the noise", price-cut / coupon promos, before-after splits, transition into a reveal.

### `ransom-note-type` — NEW
- look: each letter or word sits on its own scrap of paper (newsprint, red, black, white) with a different face/colour,
  slightly rotated, slapped in one by one ("BANG!", "脑 洞 大 开"); also speech-bubble scraps with a torn tail and a
  diagonal black band with condensed white caps.
- params: per tile rotation ±6°, scale jitter ±8 %, quad corners jittered ±5 px (cutQuad); one tile per 16th; band slaps
  in 3 steps at −6°; masthead strip has torn ends (24 top/bottom samples ±1.5 px, 10 side samples ±rough).
- build: `<RansomType text tiles={['red','black','paper','news']} seed at step />` SVG with seeded jitter; reuse slap.
- source: `demos/06-collage/index.html` drawBang, speechScrap, chip, tornStrip, band (MIT).
- value: punk/editorial titles, music promos, meme captions. Distinct from comic-burst and stamp-slam.

### `paper-tear-peel` — EXTENDS transition `tear`
- look: a jagged rip runs top to bottom (2 steps), the page shakes, then each half peels away curling over a cylinder,
  showing the kraft back of the paper with mirrored print show-through, revealing the next scene.
- params: rip = line from (1190,−60) to (770,1140) + sines (amp 22, 8) + noise ±7; curl radius 70→130 px over 4 steps;
  mapping `d ≤ πR ? R·sin(d/R) : πR − d` (recto then verso), verso shading dark at the crest, light mid, dark where it
  lies flat; halves yanked off-frame; 2-frame camera shake (6,−5) then (−3,3).
- build: `tear` gains props `peel: true`, `curlRadius`, `versoColor`, `steps` (stepped), `seed`. Implement with canvas
  affine strips or as an SVG approximation (clip each half; draw a curled band as a gradient-filled shape along the fold).
- source: `demos/06-collage/index.html` TEAR, PEEL, curlHalf, setMap (MIT).
- value: paper/collage scene changes; the more physical cousin of `tear` and `page-turn`.

### `halftone-cutout-prep` — EXTENDS `comic-halftone`
- mono 45° halftone with a paper tint for engravings/photos, and a CMYK-screen mode for colour items, plus a polygonal
  scissor rim. New props on comic-halftone: `mode: 'mono'|'cmyk'`, `tint`, `cutout: true` (alpha input → scissor rim
  `rim` px, `facets` tolerance). Can share the outline code with `sticker-slap`.
- source: `demos/06-collage/work/prep.py` halftone_mono, halftone_cmyk, scissor_border (MIT).

### `stepped-boil` — EXTENDS `mix` (per-layer props)
- quantise each layer's time to 12 fps (`Math.floor(t·12)/12`), boil resting layers at 6 fps; seeded jitter per step
  (±2 px, ±0.4° moving; ±1.1 px resting). Add `stepFps`, `jitterPx`, `jitterDeg`, `boilFps` to `mix` layers so ANY
  motion can be made to look stop-motion. Similar stepping already exists inside `comic-halftone` (`step`) and
  `scribble-ball`; this generalises it.
- source: `demos/06-collage/index.html` K, Q, Q6, jit, boil (MIT).

---

## 12-aurora-glass — "Aurora — Think in Light" (Aurora & Glassmorphism / Liquid Glass, 1920×1080, 30 fps)

Second by second (80 bpm; drop at 6.0):
- 0.0–1.5 in medias res: a frosted glass chat card is already landing (parallax, slight 3D tilt) over a violet-blue-cyan
  aurora; the user bubble "Plan a slow Sunday for me." rises in; a "Listening" card with a live voice waveform and a glowing
  cyan orb slides in behind; typing dots (0.7).
- 1.5–3.0 the reply streams in word by word (each word opacity + 8 px rise), four lines; chips "Add to calendar",
  "Remind me at 3:30" (3.0). Camera slowly pulls back/tilts.
- 3.75–4.85 a third card (Focus toggle, Glow slider) — toggle turns on (3.75), the slider knob glides to 74 %.
- 4.5–5.45 the slider knob swells into a liquid glass bead (metaball), detaches and grows into a capsule lens.
- 5.95–6.9 the lens glides over the reply text, magnifying it with rainbow fringes at the rim; at the drop (6.0) a slow
  violet ring of light ripples through the aurora and "when the light turns gold" glows gold through the lens.
- 6.7–7.3 the cards part and drift out of focus (defocus) to the sides; the lens lands in the wordmark "Aurora" as the "o".
- 7.75–8.3 the lens shrinks into a thin glass ring "o"; 8.5 tagline "Think in light. 想，有光。" fades up; 9.0 a refraction
  wave expands from the ring; 9.1–9.6 a glint runs around the ring.

### style `aurora-glass` — Aurora & Liquid Glass (AI-product-launch look)
- essence: slow-drifting pools of adjacent-hue light under frosted glass cards and a refracting liquid-glass lens; quiet,
  translucent, expensive; nothing fast.
- palette: base `#040312` (indigo black), violet `#7050FF`, blue `#2F46F2`, cyan `#34CFF0`, magenta `#B653F0`, indigo
  `#3320A8`, periwinkle `#8C8CFF`, extra `#3036D8`; glass text white 85–95 %; warm moment gold `#FFC98A`.
- texture/post: aurora is a shader field (no image blur needed): 7 anisotropic gaussians, domain-warped by 2 octaves of
  simplex noise (scale 0.9 and 2.1 per 1080 px, time 0.035/0.06), colour = weighted mean, coverage `(1−e^(−1.5·Σw))^1.3`
  toward the base so valleys stay deep indigo; overlapping cores brighten ×1.22 instead of muddying; faint vertical "silk"
  streaks; sparse sharp light motes (≤0.3 px/frame) so the frost visibly blurs them; 3–5 % noise dither against banding.
- typography: Sora 300 (wordmark, light, wide), Inter 400–500 (UI), HarmonyOS Sans SC (CJK tagline). Text enters with
  opacity + 8 px rise only.
- motion rules: sine / near-linear easing; text rise 0.7–0.9 s; word stagger 32–60 ms; camera: Catmull-Rom hermite keys,
  log-distance dolly; cards with perspective parallax and 2–4° tilt; defocus by depth when cards pass the focal plane.
- signature moves: `mesh-gradient-bg`, `glass-ui-cards`, `liquid-glass-lens`, `refraction-ripple`.
- do: adjacent hues only, dark base with bright pools, generous radii, 1 px highlights. don't: complementary colours (go
  muddy), fast moves, opaque cards, hard shadows, more than one lens.
- source: `demos/12-aurora-glass/main.js`, `shaders.js`, `cues.json`, `prompts/12-aurora-glass.md` (MIT).

### `mesh-gradient-bg` — NEW (sibling of `aurora`)
- look: big soft pools of violet, blue, cyan and magenta light drifting slowly over an indigo-black base, gently warping;
  optional ripple of light at a beat.
- params: 7 blobs `{color, rx 240–560, ry 170–380 (px@1080p), angle, intensity 0.3–1.15, closed-bezier loop 24–40 s}`;
  warp amplitude ≈ 60–120 px; ripple = gaussian ring σ 170 px pushing coordinates 46 px, +20 % gain; parallax 0.35 of
  camera.
- build: one fragment shader (Remotion `@remotion/three` full-screen plane or a raw WebGL canvas) with `uT = frame/fps`;
  CSS fallback = absolutely positioned radial-gradient ellipses with `filter: blur(100px)` moved along Bézier loops +
  `mix-blend-mode: screen` + an SVG grain. Props: `colors[]`, `base`, `blobs`, `speed`, `warp`, `rippleAt`, `grain`,
  `motes`. Must be overlay-friendly as a `MotionBackground` on websites (cheap CSS mode).
- source: `demos/12-aurora-glass/shaders.js` FS_AURORA, `main.js` BLOBS/loopBezier (MIT).
- value: the default 2025–26 tech-brand backdrop; hero sections, AI product pages, keynote slides. The current `aurora`
  motion is a night-sky curtain scene, not a mesh gradient.

### `glass-ui-cards` — NEW
- look: frosted glass cards float in 3D with parallax: blurred, saturated backdrop, faint white fill, a 1 px inner highlight
  brighter on the edge facing the light, a broad diagonal sheen, a 1 px catch-light running around a corner; inside, live
  micro-UI: chat bubbles, streamed reply, voice waveform with glowing orb, toggle, slider, chips.
- params: backdrop blur ≈ 30 px (4× downsample + separable gaussian), saturation ×1.38, white fill 8.5 %, rim refraction:
  backdrop pulled 24 px inward within 13 px of the edge (`rim^1.3`), inner rim glow 26 px; stroke 0.9 px at 14–70 % white by
  facing; sheen gaussian width 0.45 along (0.8,0.6); radius ≈ 28–36 px; soft shadow projected on the background.
- build: Remotion DOM: `backdrop-filter: blur(30px) saturate(1.4)` + `background: rgba(255,255,255,.085)` + `box-shadow:
  inset 0 0 0 1px rgba(255,255,255,.3)` + a linear-gradient sheen pseudo-element; for renders where backdrop-filter is
  unreliable, blur a copy of the backdrop clipped to the card. Card content as children. Props: `cards[{x,y,z,tilt,w,h,
  content}]`, `camera keys`, `frost`, `tint`, `lightDir`. Pre-built content blocks: `ChatBubble`, `StreamedReply`
  (word rise), `VoiceWave`, `Toggle`, `Slider`, `Chip`.
- source: `demos/12-aurora-glass/shaders.js` FS_CARD, `main.js` cards/riseA (MIT).
- value: AI-assistant demos, app feature films, website heroes; complements `browser-mockup`/`sms-thread` with a
  translucent look. (card-fan 'connect' has glass cards but no frosted UI.)

### `liquid-glass-lens` — NEW
- look: a capsule of clear thick glass (iOS 26 "Liquid Glass") glides over content, magnifying it, bending it at a
  rounded bezel, splitting colours into thin rainbow fringes at the rim, casting a soft shadow and a caustic brightening;
  it can be born from a UI knob (metaball bead) and end as the "o" ring of a wordmark.
- params: SDF rounded slab (centre, half-size, radius, stretch matrix); height = squircle bezel `(1−(1−x)^k)^(1/k)` on
  `x = −sd/bezel`; normal from height gradient; 7 spectral taps with IOR = ior + disp·k (k from +1 violet to −1 red), weights
  form a violet→red ramp summing to 1 per channel; displacement clamped (`maxDisp`); magnification ≈ 1.15–1.3; shadow
  offset 8 + 22·lift px, softness 8 + 30·lift; refraction ring for the final wave: gaussian σ 15 px, bends ≈ 2.5 px.
- build: needs a shader pass over the rendered scene. Remotion route: render content into a three.js `RenderTarget` (or use
  `@remotion/three` with an HTML texture), apply a full-screen lens fragment shader; SVG fallback: `feDisplacementMap`
  driven by a precomputed normal-map image of the capsule (R/G = normal x/y) + three offset copies (R,G,B channels with
  slightly different scales) for dispersion + `feSpecularLighting` rim. Props: `path` (keys), `size`, `radius`, `bezel`,
  `ior`, `dispersion`, `magnify`, `from: 'bead'`, `toRing` (wordmark letter index), `overlay` (lens over host content).
- source: `demos/12-aurora-glass/shaders.js` FS_LENS (heightAt, spectral loop) (MIT).
- value: the hero "wow" for product launches; a lens over any website hero/screenshot; logo end card where the lens becomes
  a letter.

### `refraction-ripple` — EXTENDS `sonar-ping`
- a single ring expands from a point and refracts what it crosses (radial displacement `wx·e^(−wx²)`, ≈2.5 px) with a light
  crest; add to sonar-ping `style: 'refract'`, `bend`, `crestColor`, `overlay`. SVG route: `feDisplacementMap` with an
  animated radial-gradient ring map.
- source: `demos/12-aurora-glass/shaders.js` (uWave) (MIT).

### `soft-rise-text` — EXTENDS `kinetic-captions`
- per-word opacity (sine) + 8 px rise (ease-out cubic) over 0.7 s, 32–60 ms stagger, no scale/pop. Add `variant: 'rise'`
  with `risePx`, `stagger`, `duration`. (blur-in-title covers letter blur, not this calm word rise.)
- source: `demos/12-aurora-glass/main.js` riseA (MIT).

---

## Sound notes (for builders adding audio cues; all synthesised in `audio.py`, MIT)
- 08-morph: future-bass bed 150 bpm in D, plucky arpeggio; one pitched whoosh per morph landing on the beat; ceramic clink
  on the mug, water swash on the sea, paper flick on the plane; at the loop apex the whole music bus is pulled out (silence)
  and slams back with a rubber-stamp thock at the pin.
- 19-paperclip: clean tech bed 120 bpm; whoosh peak aligned to the measured camera-speed peak of each fly; wood tick
  once per frame during count-up; the 4 hero slaps on one saturated, compressed bus.
- 22-hud: darksynth 120 bpm, call-sign motif D-F-A; boot-log typing + [OK] ticks; lock ratchet one tick per 3 segments;
  ascending lock tone resolving to D; a 250 ms hole (music −9 dB) before the lock impact; four panned bracket whooshes.
- 06-collage: jazzy boom-bap 90 bpm with vinyl crackle; real foley (scissors, tape pulls, paper slaps with a synth thump
  under, crumple, pages); muted-horn lick on jaw flaps; snare roll 16ths→32nds over the snips; an 8th of silence before POP.
- 12-aurora-glass: ambient pad 80 bpm in E (Emaj9), HPF 220 Hz; soft air on card arrivals panned with the card; barely
  audible typing ticks; celesta E7 on the ring glint.

---

COUNTS: styles=5 new=15 extends=12 covered=2

Styles: `shape-morph`, `sticker-explainer`, `cyber-hud-fui`, `collage-cutout`, `aurora-glass`

NEW technique ids: `shape-morph-chain`, `sticker-slap`, `canvas-flythrough`, `periodic-table-lightup`, `chip-stack-bars`,
`crt-power-on-off`, `alert-reink-wave`, `target-lock`, `holo-globe`, `collage-puppet`, `scissor-cut`, `ransom-note-type`,
`mesh-gradient-bg`, `glass-ui-cards`, `liquid-glass-lens`

EXTENDS: `field-bloom-wipe` (iris), `dashed-flight-loop` (map-route), `wordmark-fly-assemble` (glyph-orbit-logo),
`exploded-parts-leaders` (callout-labels), `supply-route-map` (map-route), `fui-panels` (hud-chrome), `crt-post-stack`
(film-look), `paper-tear-peel` (tear), `halftone-cutout-prep` (comic-halftone), `stepped-boil` (mix), `refraction-ripple`
(sonar-ping), `soft-rise-text` (kinetic-captions)

COVERED: `impact-squash` (bouncing-ball / blob-mascot), `hero-count-card` (number-counter)

---

# Part C: mg-styles-15, group C: 09-bauhaus, 10-synthwave, 20-pixel, 07-liquid, 18-hanazi

Source: `opus_sources/repos/mg-styles-15` (MIT; photos/samples CC0/PD, fonts not included). Per film:
`videos/<nn-name>.mp4`, `prompts/<nn-name>.md`, `demos/<nn-name>/` (+ `cues.json`, `audio.py`). Frames:
`analysis/frames/mg/<nn-name>/` (sheet_1fps.jpg, full_01..10.jpg, burst_*.jpg). All text below is our own description;
numbers / hex / one-line formulas are quoted from the source for attribution.

Common architecture worth copying (all five films): every frame is a **pure function of t** (`window.renderAt(t)`),
times live in a `cues.json` timing sheet shared by picture and `audio.py` (each visual hit = one SFX on the same frame),
all hard cuts gated by a frame-snapped time `snap(t)=round(t*30)/30` so motion-blur sub-samples never straddle a cut.
This maps 1:1 onto Remotion (`useCurrentFrame()` + a cue table per motion).

---

## 09-bauhaus — KONSTRUKTION · 20 Schläge (kinetic Bauhaus poster, 1920×1080, 30 fps, 120 BPM)

Second by second (sheet + bursts a/b/c):
- 0–0.5 s: cream paper, construction grid rules itself from the centre axes outward (each line pair lands on a 16th note as a
  3 px pen stroke, then relaxes to a hairline); a blurred red disc drops in and lands dead on beat 1 (0.5 s).
- 0.5–2.5 s: black bar lands at the top (1.0), yellow triangle slides in (1.5), triangle flips (2.0), blue square scales
  (2.5); each landing is pre-announced half a beat earlier by a black Passkreuz (crosshair registration target).
- 3–4 s: the whole group turns −90° about the frame centre in a 12-tooth escapement (stepped 7.5° detents, fast in the middle).
- 4–6 s: semicircle slides one module, quarter-disc sweeps, horizon rule draws, red splits; composition = Kandinsky poster.
- 6.0 s (drop): poster shatters into 120 px tiles that each turn 90° about their own centre in a radial wave (burst_b),
  re-forming a pattern of quarter-circles; 6.5 s 240 px cards tumble over a horizontal axis (diagonal wave from top-left)
  to a black back sheet with a giant ▲■● triad; column pairs slide one module alternately; GELB 黄 / ROT 红 / BLAU 蓝 labels
  stamp 2 frames apart at 7.0 (burst_c).
- 7.5–8 s: cards flip home over the vertical axis, converging on the frame centre; 8 s freeze on the poster.
- 8–10 s: "BAUHAUS" set vertically (heavy geometric sans) builds letter by letter at left, small caps
  "FORM · FARBE · FUNKTION" + CJK; plates drift out of register then snap back at 9.5 ("press lock").

### style `bauhaus-kinetic` — Bauhaus Kinetic Poster
- essence: primary geometry on a strict modular grid; every move is an integer number of modules, lands on a beat, no overshoot.
  Mechanical order is the point.
- palette: paper `#F1E9DA` (bg), ink black `#111111`/`#1C1A12`, red `#E03C31` (prints as `#EB3F33`), yellow `#F2B705`,
  blue `#1E4FA3` (on black reads `#0942A3`). Never more than these five.
- texture/print: render each ink as a separate plate (canvas/SVG layer per colour, knockout not overprint), then a press pass:
  paper photo texture (tooth) ×(1 + 0.32·tooth), large value-noise mottle ±1.8 %, vignette 10 %, per-plate misregistration
  offset 1–4.5 px, ink density 0.955 (→ +0.12 for one frame on hero hits = "ink kiss"), rough edges from noise. In SVG: one `<g>`
  per ink with `transform=translate(dx,dy)` driven by a registration curve + `feTurbulence`→`feDisplacementMap` (scale 1.5) on
  edges + paper texture multiply.
- typography: Poppins 900 (stand-in for Futura/Bauhaus-era geometric sans) — cap height = exactly 1 module (120 px), word ink
  length = exactly 8 modules (tracking solved from glyph metrics); Poppins 600 13–24 px tracked +30 % for folio lines
  ("BOGEN 09 · KONSTRUKTION IN 20 SCHLÄGEN · 120 BPM · M = 120 PX"); CJK labels in a heavy sans.
- motion rules: 30 fps, power2.inOut (`u<.5?2u²:1−(−2u+2)²/2`) or power2.in for drops ("land dead"), never back/elastic;
  1 action per beat (0.5 s); pivots alternate own-centre / corner / frame-centre; rotations can be escapement-stepped.
- signature moves: `grid-beat-construct`, `tile-cascade`, `print-plates` look, vertical title lockup, registration targets.
- do: snap every coordinate to the module; announce landings with a target on the off-beat; keep the folio/marks frame.
  don't: overshoot, gradients, drop shadows, more than 5 inks, off-grid positions.
- source: `prompts/09-bauhaus.md`, `demos/09-bauhaus/film.js`, `cues.json` (MIT).

### `grid-beat-construct` — NEW
- look: a cream sheet whose module grid rules itself from the centre outward, then primitives (disc, bar, triangle, square,
  semicircle, quarter-disc) land/slide/flip/scale one per beat, each preceded by a crosshair target; ends in a locked poster.
- params: module M = 120 px (6.25 % W), grid inset y0 = 60; line pair at distance d from centre lands at
  `0.125 + d·0.125 s`, draws over 0.25 s, 3 px pen stroke relaxing to 1.1 px hairline over 0.2 s (first axes at 6 px);
  beat 0.5 s; target ring r 21–25 px + 4 crosshair arms 32×4 px shown for the half beat before landing; group turn
  escapement: eased progress quantised into 12 teeth of 7.5°, each tooth moves in its last 65 %:
  `θ = −90° + 7.5°·(k + io2((f−0.35)/0.65))`.
- build: Remotion SVG on a module grid; a `cues` array of `{id, beat, verb: land|slide|flip|scale|rotate, pivot, from, to}`;
  each verb is a frame-driven interpolate with `Easing.inOut(Easing.quad)`; positions in module units. Props: `module`,
  `bpm`, `palette`, `shapes[]`, `title`, `subtitle`, `folio`, `pivotMode`, `showTargets`, `escapementTeeth`.
- source: `demos/09-bauhaus/film.js` (gridProg, target, groupAngle), `cues.json` events (MIT); video 0–6 s.
- value: beat-synced kinetic posters, music promos, logo builds from primitives, explainer intros with a rational/Swiss feel.

### `tile-cascade` — NEW (also proposes transition `tiles`)
- look: the frame is diced into square tiles that turn 90° about their own centres in a radial ripple, then larger cards
  tumble over (foreshortened like real cards) in a diagonal wave to reveal a back image, slide in columns, and flip home
  converging on the centre.
- params: R1 rotate 120 px tiles, 90°, dur 0.25 s, wave span 0.25 s from an origin point (delay ∝ distance/maxDistance);
  R2 flip 240 px cards about horizontal axis, dur 0.2 s, span 0.3 s, diagonal from top-left (delay ∝ x+y);
  R3 column pairs slide ±1 module, wave right→left; R4 flip home about vertical axis, delay ∝ (maxR − r) so the wave
  converges on the centre. Card scale = cos(π·ease(u)); far edge foreshortened `1 − 0.22·|sin|`; face shaded `1 − 0.2·|sin|`;
  behind a turning card show a black bed (never paper). Shutter shortened 0.5→0.3 while cards turn. Every tile landing
  = one click SFX (hundreds, panned by x).
- build: in Remotion, render source A and back B as two AbsoluteFill layers; map over a tile grid of `<div>`s each with
  `overflow:hidden` + inner positioned copy of A/B, transform `rotate()` or `rotateX/rotateY` with `perspective` and
  `backface-visibility`; delay from the tile centre. For performance on big grids use a WebGL fragment shader that
  samples A/B per tile (as the source does). Props: `tileSize`, `verb: rotate|flipX|flipY|slide`, `origin`,
  `waveSpan`, `dur`, `front`, `back`, `sound`.
- source: `demos/09-bauhaus/film.js` shader (rotTile, slideCol, inkAt), `cues.json` ripples R1–R4 (MIT); video 6.0–8.0 s.
- value: the "drop" moment of any beat edit; a transition (`tiles`) between two scenes; grid reveals of products/photos.

### `print-plates` — NEW (core look helper, sits next to PaperTexture/FilmGrain)
- look: flat vector art reads as letterpress/screenprint: paper tooth through the ink, mottled density, 1–4 px colour plate
  misregistration that drifts and snaps back into register on a hit with a tiny paper jolt.
- params: registration curve: base 1 px → drifts to ~3.5 px during action → strikes into register (×0.15) on the hero hit,
  breathes apart to a 4.5 px Y/R/B spread over the hold, "press lock" snaps to 0.12 with +10 % ink and a 2 px vertical paper
  jolt settling over 2 frames; hero-hit camera punch ×1.03 → ×1.012 → 1 over 2 frames.
- build: wrapper component `<PrintPlates inks={{red:..., yellow:...}} reg={curve}>`; each ink layer an SVG group offset by its
  own vector × reg; paper texture via `feTurbulence` (baseFrequency 0.8, numOctaves 3) multiplied + low-frequency mottle;
  ink edge roughness via displacement map. Props: `paper`, `reg`, `spread`, `density`, `lockAt`, `grain`.
- source: `demos/09-bauhaus/film.js` (registration, camera, press shader) (MIT); video 7.0 s and 9.5 s.
- value: gives any flat motion (Bauhaus, Swiss, risograph, poster) a physical print finish; brand posters.

### `vertical-title-lockup` — EXTENDS `mask-rise-title`
- look: a heavy sans word set vertically (rotated 90°) along the left edge, letters arriving one per frame-pair, with a small
  tracked caps line and CJK running alongside.
- new props on `mask-rise-title`: `orientation: 'vertical'`, `fitToModules` (cap height = 1 module, length = N modules,
  tracking solved), `letterStepFrames` (2), `sideLine` (small caps text).
- source: `demos/09-bauhaus/film.js` (measureType, drawType, drawTitleV5) (MIT); video 8–9.5 s.
- value: poster end frames, editorial covers, sidebars on vertical video.

---

## 10-synthwave — NEON DRIVE · Midnight 1986 (1920×1080, 30 fps, 100 BPM, A minor)

Second by second (sheet + bursts a/c/d):
- 0–1 s: 4:3 rounded "TV" mask over black, VHS tracking noise, "PLAY ▶" OSD (VT323), "TRACKING" blinking at 3 Hz,
  picture stepped to 15 fps; a red sports car on a neon magenta grid.
- 1–1.5 s: the mask opens to full 16:9; camera tilts up, low over the grid; striped sun rises (1.1–3.9 s); palms pass left/right
  every 0.6 s; an oncoming head-light pair whips past (2.25 s); floor shock-pulses on build beats.
- 3.87–4.2 s: the tape rewinds 2 frames, drags at 15 fps, music gap (dead air) — anticipation.
- 4.2 s (drop): chrome "NEON DRIVE" slams in from huge scale in 2 frames with a full-frame white flash; the car is punched out
  as a black silhouette with a pink rim (burst_a), then launches forward leaving light trails and vanishes (4.875).
- 4.95–5.55: a diagonal glint sweeps across the chrome; 4-point star glint + anamorphic streak at 5.4.
- 5.8–6.6: pink neon script "Midnight" traces on with a hot head; 6.6 strikes on with flicker; tagline "SUMMER 1986 · IN HI-FI
  STEREO" (Michroma, tracked) 7.2–8.1; slow end dolly 7.2–9.6; second glint 8.4.
- 9.67 s: "STOP ■"; tape winds down at half speed; 9.83–9.97 CRT power-off: raster squashes to a hot line, then to a dot
  (burst_c).

### style `synthwave-vhs` — 80s Synthwave / VHS
- essence: OutRun nostalgia — a neon grid racing to a striped sunset, chrome type and a VHS tape that is visibly being played.
- palette: sky top `#0a0014`→purple `#2a0a4a`, haze magenta; grid line `rgb(255,41,209)` ≈ `#FF29D1` core blending to
  `#FFD9F7`; floor base `#050012`→`#170326`; sun ramp (bottom→top) `#FF3D8F` → `#FF6647` → `#FF9E38` → `#FFDB5C` → `#FFF59E`;
  sun halo `#FF478A`; mountains wire cyan `#4FE3FF` over dark fill; neon script `#FF2FB8` / inner `#FF8FE4` / core `#FFE6F8`;
  chrome face stops `#0b1a4d #1d4fae #5fb8ff #d8f6ff #ffffff | #2b0a26 #5a1438 #c2452f #ff9a3c #ffd98a #fff6dc` (hard horizon
  split at 0.494/0.506); chrome rim `#ffffff #8ea4dc #ffffff #3a1830 #ffab66 #fff4e0`; extrusion `#5C1080`→`#14032C`;
  OSD white `#F0F0F0`.
- texture/post: bloom (two glows: tight ≈4 px + wide ≈30 px at low opacity), then a VHS pass (see `vhs-pass`), film grain ±2.5 %,
  vignette 0.62·r², every 3rd scan row ×0.88.
- typography: Archivo 900 italic, width 125 % (chrome title); Mr Dafoe (neon script); Michroma (tracked tagline); VT323 (OSD).
  Google alternatives available for all four.
- motion rules: smooth camera at 30 fps but tape sections deliberately stepped to 15 fps, 2-frame reverse stutter before the
  drop, half-speed tape stop at the end; slam = 2-frame run-in, flash peak on the downbeat frame, exp decay (e^{−13u}).
- signature moves: `outrun-grid`, `chrome-title-slam`, `neon-sign` script strike, `vhs-pass`, `tape-stutter`, `crt-off`.
- do: build a dead-air gap right before the slam; keep text away from the horizon line; double glow on every neon element.
  don't: smooth gradients without scanlines, flat white text, uniform frame rate the whole way.
- source: `prompts/10-synthwave.md`, `demos/10-synthwave/index.html`, `cues.json`, `audio.py` (MIT).

### `outrun-grid` — NEW
- look: one-point-perspective neon floor grid scrolling toward camera to a hot horizon, banded retro sun with slowly scrolling
  cut-out stripes, ridged wireframe mountains, palm silhouettes and reflector posts whipping past, starry sky with a shooting
  star; kicks fire a shock ring that travels outward across the floor.
- params: grid cell 2.5 × 5 world units; line = core `1 − smoothstep(.3,1.35,d)` + glow `exp(−d/3.4) + 0.16·exp(−d/15)` (d in
  pixels via fwidth) → anti-aliased with distance fade `1 − smoothstep(.10,.42,fwidth)`; transverse lines smeared by per-sample
  travel to avoid strobing; pulse ring `exp(−|dist − age·240|/10)·exp(−1.3·age)`, pump 1 + 0.30·e^{−7·age}; sun band cut-outs:
  `w = 0.38 − y`, phase `w·8.5 − t·0.55`, gap width `clamp(0.42·w, 0, 0.62)` (bands widen toward the bottom, scroll down);
  sun radius ≈ 250 px at 1080p (23 % H); palms every 0.6 s alternating sides; sun reflection streak down the floor centre.
- build: three.js (or a single full-screen fragment shader in Remotion via `@remotion/three` / a `<canvas>` WebGL hook):
  floor plane shader, sun billboard shader, ridged-noise mountain mesh with wire overlay, sprite palms. Props: `speed`
  (curve), `gridColor`, `sunColors[]`, `sunRise` (frames), `mountains`, `palms`, `pulses` (frames), `car` (bool / image),
  `stars`, `horizonY`.
- source: `demos/10-synthwave/index.html` (sky, sun, mountains, floor grid, palms, posts) (MIT); video 1–4 s.
- value: retro/synthwave backdrop for music, gaming, 80s-themed promos, website hero loop (export to webm on mobile).

### `chrome-title-slam` — NEW
- look: an 80s chrome logotype — sky-to-sunset split gradient face, dark outline, bright rim, deep purple extrusion with a
  neon edge — slams in from huge scale, flashes the frame white, then a diagonal glint sweeps across it and a star glint pops.
- params: face gradient (see palette) split at 49.4/50.6 % of cap height; 14-step extrusion offset (0.30, 1.05)·scale per
  step, colour lerp `rgb(92,16,128)`→`rgb(20,3,44)`; neon rim stroke `#ff49d6` 2.6 px with 16 px shadow `rgba(255,0,176,.9)`;
  dark outline 9 px `#0a0014`; rim gradient stroke 4.6 px; bevel slivers = text minus text shifted (2.2, 3.2) white 90 % and
  (−2, −2.6) `#1a0620` 55 %; lower half overlaid with 7 horizon reflection lines + converging perspective lines at 13 %;
  slam: 2-frame run-in, flash 0.16·e^{−13u}; glint band `x = u·aspect + 0.9·v`, two gaussians (σ 0.09 and 0.03, 0.22 apart),
  sweep 0.6 s; 4-point star + anamorphic streak at the glint end.
- build: render chrome to an offscreen canvas once (or SVG with `<linearGradient>` + stacked `<text>` for extrusion), animate
  scale/opacity per frame; glint as an SVG gradient mask moving across `<text>` clipPath. Props: `text`, `font`,
  `faceStops`, `rimStops`, `extrudeColor`, `extrudeSteps`, `slamAt`, `flash`, `glintAt[]`, `starGlint`.
- source: `demos/10-synthwave/index.html` (chrome title block, chromeMesh shader, drawFlare) (MIT); video 4.13–5.6 s.
- value: retro title cards, gaming/esports intros, event posters, "Y2K chrome" brand moments.

### `neon-script-strike` — EXTENDS `neon-sign`
- look: a handwritten neon script word is traced on as unlit glass with only a hot white-pink head moving along the path, then
  the whole tube strikes on with a ballast flicker and settles humming.
- new props on `neon-sign`: `script` (path-based cursive font, stroke trace instead of letter-by-letter), `traceFrames`
  (0.8 s), `headGlow` (34 px radial white→`#FF00AA`), `strikeEnvelope` (per-frame levels `[1, .15, 1, 1, .08, .5, .85, 1]`
  starting on the hit), `glassColor` (unlit tube), `rotation` (−8° italic placement), `noPlate` (float over a scene).
  Lit tube = three fills: `#FF2FB8` blur 34 → `#FF8FE4` blur 5 → `#FFE6F8` core.
- source: `demos/10-synthwave/index.html` (strokeRange, drawScript, `neon_strike` cue) (MIT); video 5.8–6.9 s.
- value: overlay a neon subtitle on any scene; nightlife, music, retro promos.

### `vhs-pass` — NEW (core look helper `<VHS>`; complements `glitch-image` which only does bursts)
- look: a whole-frame VHS playback finish — chroma bleeding sideways, pinks smearing right, wobbling lines, a rolling tracking
  band with snow, head-switch noise at the bottom, occasional line tears, scanlines, rounded 4:3 CRT mask and an OSD.
- params: convert to YIQ; luma 3-tap (0.6 centre); chroma 9-tap trailing left with weights e^{−0.32i}, spacing 1.7 px, ×1.1
  saturation; RGB split 1.2–2.2 px (more on glitches); red smear 6 taps e^{−0.38i}, ×0.82; per-line wobble = 2 octaves value
  noise (1.1 px idle, +12 px while tracking); tracking band height 7.5 % H moving with `1 − fract(frame·0.023)`; line-tear
  glitch rows 6–20 px tall shoved ±8–40 px at listed glitch times (~1 per second); head-switch noise in bottom 5–17 px;
  scanline every 3rd row ×0.88; OSD composited after: "PLAY ▶", "TRACKING", "SP 0:00:0s", "STOP ■" in VT323 60 px; mask
  1440×1040 with 38 px corner radius opening to 1920×1080.
- build: Remotion: render children to a canvas / `@remotion/three` effect composer, or a WebGL `<AbsoluteFill>` shader that
  samples the child (via `useOffthreadVideo`-rendered texture or html2canvas-free route: build the scene in the same WebGL
  context). Cheap SVG fallback: `feColorMatrix` channel split + `feOffset` + `feDisplacementMap` with a horizontal noise strip
  + repeating-linear-gradient scanlines. Props: `intensity`, `tracking` (curve), `glitches[]`, `split`, `bleed`,
  `osd: {play, tracking, timecode, stop}`, `mask4x3` (curve), `scanlines`.
- source: `demos/10-synthwave/index.html` (VHS ShaderPass, drawOSD) (MIT); video 0–1.5 s, glitch frames 0.37/0.63/1.53/…
- value: retro edits, "found tape" intros, nostalgia ads; overlay on host footage.

### `tape-stutter` — NEW (core time-remap helper)
- look: the picture itself behaves like tape: steps to 15 fps while tracking, jumps 2 frames backwards (rewind blip), drags at
  15 fps into the drop, and at the end winds down at half speed.
- params: `sceneTime(f)`: f<30 → `floor(f/2)·2`; rewind window 2 frames → `r0 − 1 − (f − r0)`; drag → `floor(f/2)·2`; stop →
  `stop + (floor(f/2)·2 − st)/fps·0.5`. Audio: matching music slice-stutter at 1/15 s with −1 semitone step, then a tape-stop
  pitch-down.
- build: a `useTimeRemap(segments)` hook that returns a remapped frame to pass into child `Sequence`s (Remotion `<Freeze>` per
  frame or computing `frame` manually in components). Props: `segments: [{from,to,mode: step|reverse|half}]`.
- source: `demos/10-synthwave/index.html` sceneTime; `audio.py` region stutter + tape_stop (MIT).
- value: rhythm-editing tool usable by any motion (pre-drop tension, retro feel).

### `crt-off` — NEW transition (`crt`), also `crt-on` (see 20-pixel)
- look: TV switch-off: the image squashes vertically to a bright horizontal line, the line shrinks to a dot, a blue-white bloom
  fades; reverse for power-on.
- params: off over ≈4 frames (9.833–9.967 s): Y scale →0.004 first, then X →0.02; hot line `exp(−ly²/1.1)·exp(−lx²/5)`, bloom
  `(0.72,0.84,1)·exp(−len/60)`; brightness boost `1 + (1−sy)·1.4` while squashing.
- build: AbsoluteFill with `transform: scale(sx, sy)` + a white line div + radial-gradient bloom; frame table driven.
  Props: `direction: off|on`, `frames`, `lineColor`, `bloomColor`.
- source: `demos/10-synthwave/index.html` (uCrtX/uCrtY), `demos/20-pixel/film.js` PWR table (MIT); videos 10-synthwave 9.8 s,
  20-pixel 0–0.35 s.
- value: end cards, chapter breaks, retro transitions.

---

## 20-pixel — PIXEL QUEST · 像素冒险 (1920×1080 from 320×180 ×6, 30 fps, 150 BPM chiptune)

Second by second (sheet + bursts a/b/d):
- 0–0.35 s: CRT powers on — dot → line → white field → picture with a short vertical roll and line wobble.
- 0.3–4 s: side-scroller attract mode; day sky with dithered bands, sun, clouds; parallax mountains / mesas + pine forest +
  waterfall / near hills / brick-tile ground; red-haired hero runs (6-frame cycle), jumps (0.3, 2.0) collecting coins
  (score 100s, coin counter), stomps a slime at 2.4 (+500 popup); palette steps day → afternoon (1.6) → golden (3.2).
- 4.0–4.4 s: skid stop by a treasure chest; sunset palette; "!" emote; 4.6 a dialogue box opens with a name tab
  "神秘宝箱" and types "欢迎来到像素世界" one glyph per 0.1 s; box closes 5.8.
- 5.9–6.1 s: stepped camera push-in ×6 → ×8 → ×10 → ×12 (whole-pixel zoom on beats) onto hero + chest; chest shakes,
  "?" bubble, lid hops twice (6.2, 6.3), hero flinches.
- 6.4 s: chest bursts open: 1-frame white, 1-frame yellow palette flash, rotating dithered god-ray fan, coin fountain, item
  ("crystal") rises and lights a cool blue pool around the hero; palette goes dusk.
- 7.2 s: "PIXEL QUEST" block logo falls (12-frame gravity), white flash frame, squash/stretch bounce, dust puffs, sparks;
  7.6 shine sweep; 8.0 ribbon "像素冒险" unfolds; night front rolls in as a dithered ring wave; 8.4 "PRESS START" blinks.

### style `pixel-quest` — 16-bit Pixel Platformer
- essence: low-res indexed-colour game screen, hard pixels, stepped timing, palette (not filters) does all lighting.
- palette (QUEST-32 master, use by index): `0d0b1a 1b1a33 2a2f5a 3d4a8a 4f6fc0 5b9bea 8cc8f5 c8ecff ffffff 3b1f47 6b2d5c
  b0415f e8665a f59a4a ffd166 fff3b0 0f2a2a 1d4a3a 2e7a45 4fae4a 93d65a 2b1a1f 5a3326 8a5236 c07a45 e8b27c 7a1f2e d23c3c
  ffc9a0 4a5270 7d88a8 b8c2d9` — roles: outline/night `#0D0B1A`, sky blues `#4F6FC0→#C8ECFF`, sunset `#B0415F #E8665A
  #F59A4A`, gold `#FFD166 #FFF3B0`, greens `#1D4A3A→#93D65A`, dirt `#5A3326→#E8B27C`, hero red `#D23C3C`.
- texture/post: internal 320×180 indexed buffer, upscale ×6 with "sharp bilinear" (nearest inside the pixel, 1-px AA only at
  pixel borders) → CRT: barrel k = 0.03, scanline beam width 0.30–0.47 of a row by luminance (bright rows fatter),
  min 0.64, 8-direction glow taps at 1.6 and 3.4 px thresholded at 0.30 ×0.55, vignette 24 % r^2.6. All gradients = 2×2/4×4
  Bayer dither between palette steps.
- typography: Press Start 2P (HUD, PRESS START), Fusion Pixel 12 (CJK pixel font; free alternatives: Zpix, Ark Pixel),
  custom 6×7 block glyph logo with 4-px cells, vertical fill ramp, top bevel, drop extrusion 4 px, 1-px dark outline.
- motion rules: sprite anim on 10 fps (3 frames per pose), positions integers, no tweening; jumps = integer parabola
  `h = round(112·s·(1−s))`; 2-frame anticipation crouch before a jump, 2-frame land pose after; camera zoom in integer steps
  only; screen shake tables in whole pixels `[3,−3,2,−1,1,0]`; flashes are palette swaps (1 frame white, 1 frame yellow).
- signature moves: `pixel-platformer-scene`, `palette-lut-grade`, `pixel-logo-drop`, `crt-pass`, `pixel-reward-burst`,
  pixel dialogue box.
- do: keep every element on the 320×180 grid; light with palette swaps and dithered falloffs; colour-cycle water/stars.
  don't: rotate or scale sprites by non-integers, smooth easing, bilinear blur, alpha blending outside the palette.
- source: `prompts/20-pixel.md`, `demos/20-pixel/film.js`, `cues.json`, `audio.py` (MIT).

### `pixel-platformer-scene` — NEW
- look: an attract-mode platformer: parallax pixel landscape scrolling, a chibi hero running/jumping/collecting coins/stomping,
  score and coin HUD, waterfall and river with colour-cycled water, bridge sag, clouds drifting.
- params: 320×180; parallax factors far 0.125, mid 0.3, near 0.55, clouds 0.06 + 1 px per 4 frames; run cycle 6 poses @ 10 fps,
  tail/hair secondary 3-phase; jump 1 = 18 frames apex 56 px; coins +100, stomp +500 with tiny 3×5 digit popups; water
  cycle 4 colours @10 fps; star twinkle sequence `[8,31,29,31]` every 4 frames.
- build: Remotion `<canvas>` component with an `Uint8Array` index buffer redrawn per frame (pure from frame), sprites as
  string arrays (`'..11..'`) with auto 1-px outline, then upscale with `imageSmoothingEnabled=false` (or WebGL sharp-bilinear).
  Props: `palette`, `stagesAt`, `heroColor`, `events: [{t, kind: jump|coin|stomp|skid|stop}]`, `layers`, `hud`, `seed`,
  `scrollSpeed`, `crt`.
- source: `demos/20-pixel/film.js` (layers, heroSprite, heroPose, drawEntities, drawHUD) (MIT); video 0.3–4.4 s.
- value: gaming channels, indie-game trailers, "level up" moments in explainers, nostalgic brand ads.

### `palette-lut-grade` — NEW (core helper for pixel motions; related to `time-of-day-grade` which grades smooth vectors)
- look: time of day changes by swapping palette indices — day, afternoon, golden, sunset, dusk, night — each transition in two
  1/3-steps two frames apart; a dithered "night front" ring rolls in toward a light source; a local light pool re-lights
  materials with a dithered falloff; water and stars colour-cycle.
- params: semantic slots (sky s0–s4, sun, clouds, mountains, forest, grass, dirt, water…) × 6 stages table of master indices;
  mixed stages resolve to nearest palette colour with weights 0.3/0.59/0.11; transitions = 4 frames (1/3 at +0, 2/3 at +2);
  night wave radii 150 → 110 → 70 → 36 px at 0.1 s steps, edge width 12 px dithered by Bayer; light pool inner r1 solid,
  outer r dithered into 2 brighter LUTs.
- build: author pixel art in slot indices, keep `LUT[stage][slot] = masterIndex`; per frame build the LUT and map the index
  buffer to RGBA. Props: `stages: {name: frame}`, `palette`, `slotTable`, `cycleSlots`, `lightPool: {x,y,r,r1,from}`,
  `nightWave`.
- source: `demos/20-pixel/film.js` (env table, makeLUT, waveR/lightAt, renderAt LUT selection) (MIT); video 1.6–8.3 s.
- value: honest pixel-art day/night, mood shifts and spotlight effects without breaking the palette; reusable for any pixel scene.

### `pixel-logo-drop` — NEW
- look: chunky gold pixel logo falls from above with gravity, lands with a white flash frame, squashes and rebounds, puffs
  dithered dust from its corners, throws sparks; a shine band sweeps diagonally; a red ribbon subtitle unfolds; "PRESS START"
  blinks.
- params: fall 12 frames, `dy = −128·(1 − (i/12)²)`; flash frame white then gold; squash table per frame `[6,3,−4,−4]` px of
  height with width `[6,3,−2,−2]`; bounce `[0,−5,−2,0]` px in 2-frame steps; shake `[3,−3,2,−1,1,0]`; dust 10 frames;
  8 spark emitters 9 frames; shine 6-px bright + 2-px secondary band at 45°-ish (u = i + 0.7j), 18 px/frame for 12 frames;
  ribbon width 16 → 40 → 64 → 88 px per frame then tails; subtitle chars every 3 frames; blink 12 on / 12 off.
- build: pixel canvas or SVG `<rect>` grid with `shape-rendering: crispEdges`; logo from 6×7 glyph matrices (or a pixel font
  rasterised to cells). Props: `title`, `subtitle`, `cell`, `fillRamp`, `outline`, `dropAt`, `shineAt`, `ribbonColor`,
  `pressStart`, `glints`.
- source: `demos/20-pixel/film.js` (LG glyphs, buildLogo, drawLogo, drawRibbon, drawPress) (MIT); video 7.2–8.5 s.
- value: retro title cards, game-jam/stream intros, "achievement unlocked" end cards.

### `crt-pass` — EXTENDS core `Scanlines` helper (new `CRT` mode) + `crt-on` transition
- look: a CRT display over pixel art that keeps pixels crisp: slight barrel, luminance-dependent scanlines, phosphor glow on
  brights, dark rounded bezel edge; power-on = dot → line → white → picture with roll and line wobble.
- new props: `barrel` (0.03), `beamWidth` ([0.30, 0.47] by luma), `scanMin` (0.64), `glow` (threshold 0.30, gain 0.55),
  `vignette` (0.24, power 2.6), `sharpBilinear` (true), `powerOn` frame table: on-height `[.012,.007,.006,.034,.334,1…]`,
  on-width `[.018,1…]`, white `[1,1,.85,.6,.35,.16,.05,0…]`, roll 8/180 at frame 6, wobble `[1,−.75,.5,−.25]` px on frames 7–10.
- source: `demos/20-pixel/film.js` (WebGL2 CRT shader, PWR) (MIT); video 0–0.35 s and throughout.
- value: any pixel/retro scene; overlay on host UI captures for "retro computer" looks.

### `pixel-reward-burst` — NEW
- look: a chest shakes, hops its lid twice, then bursts open: palette flash, rotating dithered light-ray fan, a ballistic coin
  fountain, an item rises and glows; preceded by a stepped integer zoom onto the moment and "?"/"!" speech bubbles.
- params: zoom ×6 → ×8 → ×10 → ×12 on three successive 0.1 s beats, snaps back to ×6 on the flash; shake 0.5/−0.5 px then
  1/−0.5 px on lid hops; rays: 18 alternating angular bands, rotation 0.035 rad per 3 frames, radius grows 30 + 26·τ for 6
  frames then shrinks ~7 px/frame (pulsing ±2 px), dithered by `fall·1.3 > bayer`, core hole 14 px; rays collapse in two
  3-frame steps (R34, R18) on the logo shine; coins integer ballistic.
- build: pixel canvas; props `at`, `zoomSteps`, `rays`, `fountainCount`, `item`, `emotes`.
- source: `demos/20-pixel/film.js` (drawRays, fountPos, zoomAt, chest states) (MIT); video 5.9–7.2 s.
- value: unlock/reward/reveal beat in gamified product videos, giveaways, "new feature" reveals.

### `pixel-dialogue-box` — EXTENDS `story-caption-box`
- look: RPG text box with a name tab and a portrait icon, CJK pixel font typing one glyph per beat-subdivision, box opens and
  closes in stepped frames.
- new props on `story-caption-box`: `variant: 'pixel'`, `nameTab`, `icon`, `pixelFont` ('Fusion Pixel 12' / 'Press Start 2P'),
  `charTimes[]` (one per 0.1 s here), `pixelScale` (6).
- source: `demos/20-pixel/film.js` (drawBox), `cues.json` type[] (MIT); video 4.6–5.8 s.
- value: tutorial captions in game style, chat/dialogue moments in pixel videos.

---

## 07-liquid — drop. · It All Starts with a Drop (1920×1080, 30 fps, 150 BPM, D major)

Second by second (sheet + bursts a/b/c):
- 0–0.4 s: macro on a glossy tangerine drop falling (vertically stretched); lands at 0.4: flattens to a lens, throws a crown of
  tapered tendrils whose tips bead off as secondary droplets 2–3 frames later; glossy floor reflection (burst_a).
- 0.4–1.7 s: three more drops land (0.8, 1.2, 1.6) in pink/violet; camera pulls back from macro to wide; landed beads sit on
  the floor.
- 2.0–3.0 s: puddles hop into the centre mass one by one (merge at 2.0/2.4/2.8), mass wobbles; colours swirl inside as
  marbling.
- 3.2–3.6 s: the merged mass leaps, a thin thread snaps (3.43), mass lands (spherical, marbled) and splats.
- 4.0–4.45 s: impact crown, then three diagonal liquid sheets (violet, orange, pink) flood the frame L→R / R→L / L→R 70 ms
  apart with wavy fronts; full immersion at 4.42 (pink field with floating beads/bubbles, burst_b).
- 4.55–5.35 s: sheets drain away revealing four beads (orange, small coral, pink, violet) in a row.
- 5.75–6.4 s: beads gather, fuse into a capsule (necks), then at 6.4 the capsule erupts into a crown of spikes while morphing
  into the wordmark "drop" (Fraunces 900 soft) with a pink bloom flash; letter bridges snap at 6.417/6.45/6.483.
- 7.1–7.6 s: glint sweep across the letters; 7.6–8.57 a drip grows under a letter and snaps, lands at 8.4, ripples spread on
  the floor; 8.42 tagline "万物始于一滴 / EVERYTHING BEGINS AS A DROP" bottom-right; hold.

### style `liquid-candy` — Glossy Liquid Motion
- essence: thick candy-coloured liquid that drops, splashes, fuses and floods; everything organic, flung, glossy, never linear.
- palette: set plum `#3B0F4A`→`#1E0628` (floor darker), liquid ramp by thickness and hue u∈[0,1]:
  thin `#FFBD4D`→`#FF80A8`→`#D685FF`, mid `#FF5C0F`→`#FF1A70`→`#8F1FFF`, deep `#CC1A0A`→`#9E054D`→`#3D0A99`; bloom pink
  `#FF9EC8`; tagline `#FFE8F0`.
- texture/post: HDR linear lighting, bloom on bright pass, temporal supersampling motion blur (sub-shutter states averaged
  before bloom), fine grain; floor mirror reflection with blur and fade; soft shadow + coloured caustic cast down-right.
- typography: Fraunces 72pt 900 "Soft"/wonky (liquid wordmark, rendered as SDF); Noto Serif SC 600 44 px (CJK tagline,
  tracking 14); Inter 600 20 px tracked 5.5 (English line).
- motion rules: ease "flung" `cubic-bezier(0.22,1,0.36,1)`; secondary droplets 2–3 frames behind the main body; neck
  stretch → snap → 2–3 frame rebound; damped springs (f≈4 Hz, ζ 0.3) for wobble; `wob = e^{−t/decay}·sin(2πft)`.
- signature moves: `sdf-liquid-shade`, `drop-splash-crown`, `liquid-merge-hop`, `liquid-flood` transition,
  `blob-to-wordmark`, final drip + ripple.
- do: drive colour by thickness (thin rims light & warm, interiors deep); add a transmitted-light crescent opposite the key.
  don't: flat blobs with a single fill, linear motion, hard straight edges.
- source: `prompts/07-liquid.md`, `demos/07-liquid/js/{scene,shaders,engine,textsdf,type}.js`, `cues.json` (MIT).

### `sdf-liquid-shade` — NEW (shading model; the existing `metaball-heatmap` only does contour bands / dark goo)
- look: 2D metaball shapes that read as thick 3D glossy jelly: dome-shaped highlights, saturated rim glow, thin translucent
  lip, studio softbox reflections, wet hotspot, floor reflection.
- params: smooth union by log-sum-exp accumulator with sharpness k (also blends the gradient and the colour parameter u);
  inside distance x → height `h = Hc·tanh(√(2R(x+0.6))/Hc)`, R = 95 px, Hc = 210 px → normal `n = normalize(−∇h, 1)`; body
  colour mix thin→mid over x 0–5 px, →deep over 40–260 px; diffuse `0.26 + 0.50·(0.5+0.5·n·L)` × `(0.5+0.5·n.z)`, key
  L = (−0.55, −0.7, 0.62); transmitted crescent `pow(max(dot(n.xy, −L.xy),0),1.2)` in the side band; env = key softbox upper
  left + small top-right softbox + right strip + lower-left kicker; glint = narrow diagonal band sweeping.
- build: one full-frame WebGL fragment shader in Remotion (`<canvas>` + `useCurrentFrame` uniform upload), primitives
  passed as uniform arrays (balls {x,y,r,u,stretch,angle}, segments {a,b,ra,rb,u}); cheap SVG fallback: goo filter
  (`feGaussianBlur` 20 + `feColorMatrix` alpha ×20 −9) + inner `feSpecularLighting` on the blurred alpha as bump map.
  Props: `palette {thin, mid, deep}`, `lightDir`, `gloss`, `rim`, `reflection`, `background`.
- source: `demos/07-liquid/js/shaders.js` (fadd/fres, shadeLiquid, env), `engine.js` (temporal supersampling) (MIT).
- value: the look under every liquid motion (drops, logo melts, blob loaders, liquid buttons, transitions).

### `drop-splash-crown` — NEW
- look: a drop falls stretched, hits a glossy floor, squashes into a lens and throws a crown of tapered tendrils; the tips
  bead up and pinch off as secondary droplets that fly and land as small beads; the stub recoils; mirrored reflection below.
- params: impact at frame 12; stretch sv > 1 in flight, landing squash with overshoot halved (no pancake); 6–8 tendrils, edge
  ones lean out, centre stands up; tips pinch 2–3 frames after impact; secondary droplets ballistic with gravity, melt into
  puddle or bead; beads closer than 15 px merge; crown peak ≈ 38 % of frame width in macro framing.
- build: closed-form state per droplet `{x0,y0,vx,vy,r,u,tEmit}` → ball/segment primitives fed to `sdf-liquid-shade`.
  Props: `drops: [{t, x, size, hue}]`, `crown` (count, height), `secondaries`, `floorY`, `reflection`, `cameraMacro`.
- source: `demos/07-liquid/js/scene.js` (makeDroplet, emitDroplet, tendrilState), `cues.json` landings (MIT); video 0.3–1.7 s.
- value: drink/food/cosmetics ads, logo openers, "drop" product launches, loader hits.

### `liquid-merge-hop` — EXTENDS `metaball-heatmap`
- look: separate puddles hop ballistically into a central mass and fuse with a neck; the mass wobbles and keeps the merged
  colours swirling inside as marbling; then the mass leaps, a thin thread stretches and snaps, the mass lands and splats.
- new props on `metaball-heatmap`: `style: 'glossy'` (uses `sdf-liquid-shade`), `hops: [{t, from, to}]`, `marble` (ghost
  colour swirl inside), `leap: {t, height}`, `threadSnapAt`, `wobble {f: 2.8, decay: 0.22, amp: 20 px}`; mass radius
  `√(Σ r²·mergeK)` (area-conserving).
- source: `demos/07-liquid/js/scene.js` (hops, mergeK, massR, ghosts, sphereY) (MIT); video 2.0–3.9 s.
- value: data merges ("teams combine"), loaders, playful product morphs.

### `liquid-flood` — NEW transition (fulfils PLAN.md's planned `wave` / liquid-wave-wipe)
- look: two or three coloured liquid sheets sweep diagonally across the frame in alternating directions with wavy, bulging
  fronts, fully immerse the frame for ~0.45 s, then drain away revealing the next scene.
- params: 3 sheets launched 70 ms apart (4.035/4.105/4.175), out 4.55/4.62/4.69; front = sum of 3 sines (weights
  0.58/0.30/0.14, frequency ×1/×1.87/×3.13, phases drifting) + lean + one gaussian bulge (σ 250 px); back edge similar at
  0.85 amplitude; ease `bezier(0.28,0.55,0.42,1)` on the front; interior = domain-warped marbled bands; hits (sheet edge crossing
  centre) at 4.133/4.267/4.333 drive SFX.
- build: Remotion transition presentation: SVG path per sheet with the wavy edge computed per frame, filled with a gradient
  + `sdf-liquid-shade`-style highlight strip; next scene revealed under the last sheet's back edge. Props: `colors[]`,
  `direction`, `sheets`, `stagger`, `amp`, `freq`, `marble`.
- source: `demos/07-liquid/js/shaders.js` (waveShape, floodSD), `scene.js` (sheet) (MIT); video 4.0–5.35 s.
- value: high-energy scene transition for music/food/beauty edits; website section transitions (exported).

### `blob-to-wordmark` — NEW
- look: a row of coloured beads gathers, fuses into a capsule, then erupts into a crown of spikes while morphing into a
  glossy liquid wordmark, letters joined by thin liquid bridges that snap one after another; a glint sweeps; a drip forms
  under one letter, falls and ripples the floor; tagline fades in.
- params: per-letter SDFs (one letter per RGBA channel) generated from the font with sub-pixel EDT and gaussian smoothing
  (σ 10) so the medial-axis ridge does not crease the height field; morph slot ellipse → letter SDF by mix of distances and
  gradients; bridges snap 2 frames apart (6.417/6.45/6.483); glint 7.1–7.2; drip snap 8.567, ripple from 8.4; tagline 8.42.
- build: WebGL (as above) with letter SDF texture; SVG fallback: goo-filtered circles that tween to text glyph outlines
  (flubber-style path morph) under the same goo filter. Props: `word`, `font`, `colors[]` per letter, `gatherAt`, `snapAt`,
  `drip: {letter, at}`, `tagline`, `glintAt`.
- source: `demos/07-liquid/js/textsdf.js`, `shaders.js` (SDF morph), `scene.js`, `type.js` (MIT); video 5.75–10 s.
- value: liquid logo reveals for beverages, cosmetics, apps named after liquids; end cards.

---

## 18-hanazi — 喵呜日记 EP.07 (variety-show 花字 over a pet vlog, 1080×1920, 30 fps, 120 BPM)

Second by second (sheet + bursts a/b/d):
- 0–0.2 s: persistent badge "喵呜日记" (yellow pill with cat ears) + "EP.07" pink tag fly in top-left.
- 0.2–0.47 s: title "今日份快乐" pops in character by character (2-frame stagger) over a sunny white cat photo (slow Ken Burns +
  handheld drift); sparkles twinkle (0.8–1.07); the title hops on beats 1.0/1.5/2.0.
- 1.3–2.5 s: small marker-font aside "（小声）正在光合作用…" types in; a battery icon pops, charges 3 green bars (1.75/2.0/2.25),
  "满电!" label.
- 2.5 s: record scratch, cut to a grey cat close-up stare; "？？？" hop in (pink/blue/yellow, 2-frame stagger), vertical caption
  "空气突然安静" in skewed handwriting, sweat drops slide; crickets (dead air).
- 3.86–4.0 s: candy-stripe wipe — diagonal pink/yellow/cyan bands and a cyan stripe field sweep across; the badge rides the wipe
  (burst_d); tuxedo cat shot; guest tag "本期嘉宾 警长" slides in.
- 4.9 s: "前方高能" hazard banner slams (warning beeps); 5.25/5.5/5.75 three punch-in zooms (×1.4/2.0/2.9) on the cat's face.
- 6.0 s (drop): cut to the cat as a die-cut sticker (jagged white outline) on pink/yellow radial rays with motion marks;
  "震惊!!" in a yellow spiky burst with pink back burst, characters popping in 2 frames apart (burst_b); fur puffs boil.
- 6.6 s subline "这发量合理吗？!"; 7.0 a "发量检测" meter slams in and the needle whips to 爆表, "爆表!" label.
- 7.5 s: freeze; the sticker becomes a tilted photo card on a cyan diagonal-stripe board; 8.1 "绝绝子" pops (purple-pink
  gradient); 8.5 round red seal "猫主子认证" stamps onto the card; 8.9 "下期见~" pops; sparkles.

### style `variety-hanazi` — Variety-show 花字 (reaction captions)
- essence: emotional, over-decorated rounded captions that pop with a spring exactly on the joke beat, plus sticker decor
  (bursts, sweat, sparkles, stamps) over handheld footage — the native language of Chinese variety shows, vlogs and pet edits.
- palette: hot pink `#FF3D7F`, deep berry extrude `#A3124F`, navy outline `#1E2A78` / extrude `#0E1440`, ink `#1A1030`,
  lemon `#FFE14D` / burst yellow `#FFF15A`, sky cyan `#16B9F0` / sweat `#8EE8FF`, lime `#7BE35A`, seal red `#E8283C`,
  white `#FFFFFF` strokes; cyan stripe board.
- texture/post: none on type (clean vector); footage gets Ken Burns + 2-octave handheld noise + punch zooms; soft drop-shadow
  filter on caption groups; motion blur via 24 in-page sub-samples on fast frames.
- typography (Google-available stand-ins in brackets): Resource Han Rounded 900 (→ "M PLUS Rounded 1c" 900 / "Zen Maru
  Gothic"); Alimama ShuHeiTi bold for shock words (→ "ZCOOL QingKe HuangYou"); Douyin Sans bold (→ "Noto Sans SC" 900);
  LXGW Marker Gothic for asides (→ "Long Cang"/"ZCOOL KuaiLe"); ZCOOL KuaiLe (badge); Luckiest Guy (EP tag, seal ring text).
- motion rules: damped spring ζ 0.517, ω 22 → scale peaks 1.15 at frame 5, ≈1.01 by frame 8; per-char 2-frame stagger;
  captions land 2–3 frames after the visual/audio moment (SFX at t − 1 frame); hold = wiggle ±1.8° at 1.15 Hz + 3 px bob +
  1.2 % breathing; pop-out in 0.17 s (1 → 1.12 → 0); every caption has its own SFX (pop, boing, ding, scratch, slide whistle).
- signature moves: `hanazi-caption`, `reaction-decor` (emote-pop sticker set), `sticker-cutout-burst`, `candy-stripe-wipe`,
  `footage-punch`, round seal stamp, persistent show badge.
- do: one emotion per caption with matching font + decoration; keep captions inside safe areas of 9:16; layer 4–5 strokes.
  don't: single-stroke text, linear fades, captions that appear before the beat, more than 2 captions moving at once.
- source: `prompts/18-hanazi.md`, `demos/18-hanazi/index.html`, `cues.json`, `audio.py` (MIT; photos CC0/PD in `assets/`).

### `hanazi-caption` — NEW (a sibling of `kinetic-captions`, which is a subtitle track, not a decorative pop title)
- look: a fat rounded word built from five stacked layers — two-step offset extrusion, coloured outer stroke, thick white
  stroke, vertical gradient fill, top gloss — pops in per character with a spring, slight drop and rotation, then wiggles.
- params: layer stack for a 172 px title: extrude 16 px (`#A3124F`), outer stroke 12 px (`#FF3D7F`), white stroke 13 px,
  gradient fill, gloss 0.55 (white → 0 at 46 %); stroke widths `2·(white+outer)` on the back layers, `stroke-linejoin: round`;
  optional `skewX(−7…−8°)` for shock/aside; per char: scale `spring(u, .517, 22)`, drop `y0·(1 − spring(u,.55,20))`,
  rotation `r0·(1 − spring(u,.45,18))`; hold weights fade in over 0.22–0.57 s; pop-out 0.17 s.
- build: React/SVG: `<g>` per char containing 4–5 `<text>` copies (order back→front) with `paint-order` not needed; spring
  computed analytically from frame (no Remotion `spring()` state needed, but `spring({damping})` equivalent is fine).
  Props: `text`, `font`, `size`, `layers {extrude, extrudeColor, outer, outerColor, white, fill | fillStops, gloss}`, `skew`,
  `stagger` (2 frames), `at`, `out`, `wiggle`, `bob`, `perChar [{x,y,rot,drop}]`, `sfx`. Presets: `joy` (pink), `shock`
  (black outline, skew, yellow fill in a burst), `aside` (marker font, small, white), `question` (???), `bye`.
- source: `demos/18-hanazi/index.html` (HZ, charXf, driveHZ, spring) (MIT); video 0.2–0.5 s, 2.57 s, 6.0 s, 8.1 s, 8.9 s.
- value: social video packaging (Douyin/Bilibili/Reels/TikTok), vlogs, interviews, reaction moments; any host can drop
  emotional captions on top of footage.

### `reaction-decor` — EXTENDS `emote-pop`
- look: sticker-style reaction props with thick navy outlines: bouncing question marks, sliding sweat drops, 4-point sparkles,
  a battery that charges bar by bar, a hazard "前方高能" banner with warning triangles, a gauge meter whose needle whips to max.
- new props on `emote-pop`: `style: 'sticker'` (outline `#1E2A78` 6–9 px, white highlight), new icons `battery`
  (bars pop 0.25 s apart, bolt, "full" ding), `warn-banner` (scale 1.7 → 1 spring, rotation −14° → −5°, 15 fps jitter ±7 px
  under punches), `meter` (green/yellow/red arc, needle 0 → max in 4 frames with outBack then buzzing at the stop),
  `qmarks` (hop on beats), `sweat` (slide 74 px with inQuad), sparkle path `M0 −r Q k −k r 0 …` (k = 0.16 r) twinkle
  `spring(u,.4,26)·(0.8 + 0.2 sin)`.
- source: `demos/18-hanazi/index.html` (sparkleD, batt, sweat, warn, meter) (MIT); video 1.5–7.2 s.
- value: punch up any talking-head, product test or pet clip with legible "emotion props".

### `sticker-cutout-burst` — NEW
- look: the subject photo becomes a die-cut sticker (jagged white border with dark keyline) slammed onto a radial pink/yellow
  ray background with motion "shiver" marks, plus a yellow spiky burst (pink back-burst offset) holding a shock caption;
  on freeze the sticker turns into a tilted photo card on a stripe board.
- params: rays `raysD(n, R)` alternating wedges (pink `#FF3D7F` / yellow `#FFE14D`), burst path with n spikes, seeded radius
  jitter and spike 0.3; burst fill `#FFF15A` stroke 10 px `#1A1030`, back burst `#FF3D7F` stroke 9; burst scale
  `spring(u+2f, .42, 24)`; subject mask prepared offline (alpha PNG) with an offset jagged outline; fur-puff sprites 3 drawings
  boiled at 12 fps, scale 0.6 → 1.2 overshoot → 1.0; freeze hold 0.267 s before the card.
- build: needs a subject cut-out (host supplies PNG with alpha, or a matte); SVG `<image>` + outline = dilated alpha via
  `feMorphology dilate` + `feTurbulence`-displaced edge, filled white; rays/burst as generated paths. Props: `src` (alpha),
  `outline`, `rays {colors, count}`, `burst {text, colors, spikes}`, `marks`, `freezeToCard`, `cardTilt`.
  Related: `comic-burst` (onomatopoeia burst), `speed-lines`.
- source: `demos/18-hanazi/index.html` (burstD, raysD, focusD, puff, card), `assets/prep*.py` (offline matte prep) (MIT);
  video 6.0–7.6 s.
- value: meme/reaction "freeze-frame" moments, product hero stickers, thumbnails-in-motion.

### `candy-stripe-wipe` — NEW transition (`stripes`)
- look: a diagonal stack of pink, yellow and cyan bands sweeps across, trailing a cyan/white diagonal stripe field that fills
  the frame for a few frames before the next shot is revealed by the trailing bands; persistent overlays (badge) ride along with
  a slight motion-blur smear.
- params: ~8 frames total (3.86–4.13 s); band order pink `#FF3D7F` → yellow `#FFE14D` → cyan `#16B9F0`, each ≈ 4 % W, angle
  ≈ 70°; stripe field cyan/white 50 px stripes; whoosh SFX at 3.933.
- build: Remotion transition presentation with SVG polygons translating along x; the stripe field as a
  `repeating-linear-gradient(115deg, …)`. Props: `colors[]`, `stripeColors`, `angle`, `frames`, `direction`.
- source: `demos/18-hanazi/index.html` (candy wipe) (MIT); video 3.85–4.15 s.
- value: bright pop transition for social/vlog edits, kids/brand content.

### `footage-punch` — EXTENDS `ken-burns`
- look: handheld footage feel on stills: slow drift plus beat-locked punch-in zooms that step tighter on each beat, a damped
  kick shake on hits, and a freeze-frame.
- new props on `ken-burns`: `punches: [{at, zoom}]` (stepped 1.4 → 2.0 → 2.9 on 5.25/5.5/5.75 s, focus point `fx, fy`),
  `kick: [{at, amp}]` (`A·e^{−8u}·sin(2π·12u)` on x, 0.8·cos on y, small rotation), `handheld` 2-octave value noise
  (7 + 2.5 px x, 6 + 2 px y, 0.32° rot), `freezeAt`, `freezeHold`.
- source: `demos/18-hanazi/index.html` (hand, kick, place/geom, push cues) (MIT); video 0–6 s.
- value: turns any photo set into vlog-feeling footage under captions.

### `seal-stamp` — EXTENDS `stamp-slam`
- look: a round red seal (double white rings, curved text around the rim, bold two-line centre text) stamps onto a card with
  a grunge edge and speckle knock-outs.
- new props on `stamp-slam`: `shape: 'round'`, `ringText` (textPath top/bottom), `centerLines[]`, `grunge` (rough edge +
  speckles), `radius` (150 px at 1080 w). Colour `#E8283C`, rings 131/94 px white.
- source: `demos/18-hanazi/index.html` (stamp 猫主子认证) (MIT); video 8.5–8.9 s.
- value: "approved/certified" moments, product badges, end cards.

### `show-badge` — EXTENDS `scene-tag`
- look: a persistent show logo pill with cat-ear triangles and an episode tag, flies in at the start, idles with a tiny bob and an
  ear twitch, rides transitions.
- new props on `scene-tag`: `variant: 'badge'`, `ears` (bool), `episode` ("EP.07"), `idleBob`, `twitchAt[]`, `rideTransitions`.
- source: `demos/18-hanazi/index.html` (badgeArt, badge fly/twitch) (MIT); video 0–10 s.
- value: series branding on vertical social video.

---

## Sound design notes (for builder agents adding SFX cues)
- bauhaus: minimal click-techno 120 BPM; every landing = click/blip at the landing frame, panned by x; escapement = ratchet
  ticks on the eased-inverse tooth times; intro kick at −10 dB so the drop has contrast.
- synthwave: synthwave recipe 100 BPM A minor; tape stutter region (1/15 s slices, −1 semitone), tape-stop at the end; CRT on
  /whine/off SFX; hero = gated snare + pad swell + crash + gated 120 Hz buzz + relay clicks on each neon flicker.
- pixel: chiptune 150 BPM — 25 % pulse lead, 12.5 % harmony, 30 Hz NES arpeggio chords ping-ponged L/R, triangle bass, noise
  drums; jump/coin/stomp/chest SFX.
- liquid: bubbly gloops, drips, splashes, pour; flood hits on sheet-centre crossings.
- hanazi: bouncy pizz/tuba/glock/claps bed; per-char mouth pops rising in pitch (+9 % per char), boings on hops, bell ding on
  "full", record scratch that mutes the band until the wipe (crickets in the gap), whoosh on the wipe.

---

COUNTS: styles=5 new=19 extends=9 covered=0

NEW technique ids: `grid-beat-construct`, `tile-cascade` (+ transition `tiles`), `print-plates`, `outrun-grid`,
`chrome-title-slam`, `vhs-pass`, `tape-stutter`, `crt-off` (transition `crt`), `pixel-platformer-scene`,
`palette-lut-grade`, `pixel-logo-drop`, `pixel-reward-burst`, `sdf-liquid-shade`, `drop-splash-crown`, `liquid-flood`
(transition), `blob-to-wordmark`, `hanazi-caption`, `sticker-cutout-burst`, `candy-stripe-wipe` (transition `stripes`).

EXTENDS: `vertical-title-lockup`→mask-rise-title, `neon-script-strike`→neon-sign, `crt-pass`→core Scanlines,
`pixel-dialogue-box`→story-caption-box, `liquid-merge-hop`→metaball-heatmap, `reaction-decor`→emote-pop,
`footage-punch`→ken-burns, `seal-stamp`→stamp-slam, `show-badge`→scene-tag. Notes:
`hanazi-caption` could alternatively ship as `kinetic-captions` variant `hanazi`; `pixel-reward-burst` reuses `emote-pop`.

---

