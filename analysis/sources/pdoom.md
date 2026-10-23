# Source study: the two "I'm Upping My P(doom)" music videos

Two independent code-rendered music videos for the same 156.6 s song. Both are lyric videos: every word on screen
is synced to the vocal and every big change lands on the beat. They are useful to us for one thing above all: **a
music-driven engine** (beat grid, sections, word-level lyric timing, hits) that the Opus Motion Library does not have
yet. Today our `Compose` spec only knows caption cues (`from/to` frames) and audio ducking; no motion can ask "where is
the beat?" or "how much of this word has been sung?".

| repo | licence | what we may use |
|---|---|---|
| `opus_sources/repos/pdoom-video` | MIT (code). Song, lyrics and `data/lyrics.json` are NOT covered (third-party). Fonts OFL. | ideas, formulas, numbers, data schemas; code may be adapted with attribution |
| `opus_sources/repos/PDoomVideo` | **no licence** | **idea only (no licence)**: described below in my own words; never copy code or text |

Nothing was executed. No rendered video is in either repo (only the song mp3), so the visual evidence is the 14
representative plate stills in `pdoom-video/app/public/plates/fig01–14.jpg` (1920×1080), tiled into
`analysis/frames/pdoom/plates_sheet.jpg` (git-ignored) and read at full size for fig02 (`loss`) and fig12 (`dense`).

---

## 1. pdoom-video (MIT): engine overview

**Architecture.** A Vite + TypeScript + three.js web app that renders *any song time t* deterministically at
1920×1080 logical px (true 4K with `?scale=2`). One file per "plate" (scene) in `app/src/scenes/`, a shared engine
in `app/src/engine/`, the edit in `app/src/timeline.ts`. Offline export (`app/scripts/render.ts`) drives headless
Chrome, streams raw frames over a WebSocket to ffmpeg (x264 CRF 16, 60 fps), two Chrome workers rendering 8-frame
chunks in turn. Modes: `stills`, `sheet` (contact sheets, `--cuts` = every scene boundary), `video`, `perf`,
`plates` (one still per plate, reused by the outro's rewind montage).

**Data model** (all produced offline by Python in `analysis/`, committed as JSON; the renderer never analyses audio):

- `data/lyrics.json` — `lines[] {i, text, start, end, words[]}`, each word `{w, start, end, conf, syl?: [[a,b],…]}`
  (seconds; `syl` only on multi-syllable held words, e.g. "AGI" has 3 spans). Produced by Demucs vocal stem → two
  CTC acoustic models fused → one constrained Viterbi pass over the whole song (garbage token between lines) →
  signal-based refinement of word edges → confidence from agreement with alternative emission sets, Whisper
  word timestamps as a cross-check, hand anchors/fixes where QA plots disagree (`analysis/align.py`).
- `data/audio.json` — `duration, bpm (132.007), beat_period, time_signature, beats[] (345), downbeats[] (87),
  sections[] {name,start,end} (14: intro, verse1, pre1, chorus1…outro), fps: 100`, eight envelopes
  `rms, low(<150 Hz), mid(150–2k), high(>4k), vocal, drums, bass, other` (100 fps, 46 ms RMS, 10 ms attack / 90 ms
  release, each normalised by its own 99th percentile), `onsets {kick, snare, hat, vocal: [[t, strength0..1],…]}`
  from the drum/vocal stems, plus a human-readable `notes` string (how the grid was fitted, where sections start).
  Constant-tempo grid fitted to drum + mix onsets, phase refined on kick attacks; bar phase resolved from snare on
  2 & 4 and chord changes every 2 bars (`analysis/analyze.py`).

**Runtime sync API** (`engine/audio.ts`, `engine/lyrics.ts`, every `Frame`):

- `beatAt(t)` continuous beat index (binary search, linear between beats, extrapolated by the mean period outside);
  `barAt(t)`, `timeOfBeat(i)`, `nearestBeat(t)`, `section(t)`.
- `env(name,t)` linear-interpolated envelope; `envPeak(name,t,w=0.08)` peak-hold.
- `hit(kind,t,halfLife)` = max over the last ≤6 onsets of `strength · 0.5^((t−t_on)/halfLife)` — a decaying pulse.
  Half-lives used: kick 0.12 s, snare 0.14, hat 0.06, vocal onset 0.15.
- Every frame carries `f.a = {rms,low,mid,high,vocal,drums,bass,other,kick,snare,hat,vonset}` and
  `f.beat, f.bar, f.beatPhase, f.barPhase`, plus local time `f.lt`, local progress `f.p`.
- `Lyrics.wordProgress(w,t)`: 0 before start, 1 after end, linear inside — or piecewise per syllable
  (`(i + (t−a)/(b−a))/n`) when `syl` exists. `lineCharProgress(line,t)` → characters sung (fractional, counting
  spaces) for per-glyph wipes. `lyrics.get('<words of a line>')` finds a line **by content** (curly/straight quote
  folding) — scenes never hard-code times.

**The edit** (`timeline.ts`): each scene window starts at `cut(q)` = *the last beat at or before the first word of
the line containing q* (+20 ms tolerance) and ends where the next one starts; a few use "nearest downbeat to a
line's end" or the `outro` section from the analysis. The same module can serve several entries with params
(`prompt` ×3 `{variant}`, `hook` ×4 `{n}` with escalating looks). Windows that touch = hard cut on a beat (the
default and the norm); overlapping windows = engine crossfade; a scene can set `handlesTransition` and composite the
previous scene's frame `f.under` itself using `f.tin` (0→1 over the overlap). Several plates hand off by *geometry*
(the next plate starts exactly where the last frame left the spark, the flatline, the caret).

**Determinism rules** worth copying verbatim as library policy: output is a pure function of t; seeded hashes only;
per-frame flicker keyed to `frameIdx(t)=round(t·60)` (constant across a motion-blur shutter) rather than
`floor(t·60)`; particle emitters with time-varying rate are born on a constant max-rate clock and thinned by hash,
so each particle keeps its identity at any sample time.

**Post** (`engine/post.ts`, per-scene overrides returned from `render()`): linear HDR → 7-level bloom pyramid
(threshold 0.85 linear, knee 0.5, 13-tap down / 9-tap tent up), orange film **halation** (`(1,0.18,0.04)·luma`),
radial chromatic aberration (1.2 px at the edge, ∝ r²), exposure, a tone **shoulder** (identity below 0.72, exp
shoulder above, desaturate to white past 2–12), invert (ink↔bone), additive bone **flash**, vignette 0.35,
fade, shake `[x,y]` px, punch **zoom**, then two-scale film grain (per-px + 2×2-px cells, amplitude
`grain·(0.55+1.2·l(1−l))`, i.e. stronger in midtones, default 0.055) and 1/255 dither. Global HUD = crop marks at
the bookends only.

**Motion blur** (render): every output frame = average of N sub-frames over a 0.2-frame shutter; `auto` refines
per 32×32 tile through 4→12→36→108→324 samples until the change is below 3/255 (still ≈12, camera move ≈36,
whips/slams 108–324).

---

## 2. PDoomVideo (no licence): engine overview — idea only

Described in my own words; nothing copied.

A p5.js + p5.brush **watercolour picture-book** video. One page paints every frame; chapters register
`(name, start, end, shots[[t0, fn]])` and each shot function paints the whole frame from song time (pure function of
t, rendered in parallel out of order by headless Chrome workers, then joined with the song by ffmpeg). The timing
model is much simpler than pdoom-video's: a fixed tempo constant (88 BPM, beat offset 0.21 s) gives beat position,
integer beat, a per-beat decaying `pulse` and an eighth-note variant; lyric data is **line-level only**
(`[start, end, text]` read off burned-in subtitles), so the karaoke fill speed is *estimated* from the line length
rather than aligned per word. Global layers added by the timeline (not by the shots): the karaoke bar, brush-wipe
chapter breaks at fixed times, and a corner P(doom) meter during choruses unless the shot stages the meter itself.
A character rig (a cartoon AI mascot plus a human "researcher" and guest monsters) with poses, faces, hats,
beat-synced dance styles and "mood" transitions — covered in `character-rig.md` from ClaudeAnimationBase, which is
the MIT-licensed successor of this rig.

Its storyboard rules are good editorial guidance (ideas, rephrased): *something must happen in every shot*; tell
jokes with pictures, keep the frame text-light (the karaoke already says the words); one location per chapter
with the camera moving through it; every chorus returns to the same set and escalates; transitions are motivated by
the action (a chomp to black, a zoom through an eye, crashing through a floor); mood changes never snap; a palette
arc across the whole film; the lead character ~40 % of frame height in dance shots; shots 1.4–4 s.

---

## 3. Styles

### style `engraved-treatise` — Plates from an illustrated treatise (pdoom-video)
- **essence:** deadpan scientific plates — hairline instruments, white-line engraving and technical drawings on
  near-black, one hazard-orange signal colour that is the only thing allowed to glow; huge confident grotesk lyrics
  over tiny mono footnotes. Every plate swaps idiom (oscilloscope, banknote, bureaucratic form, blueprint, roadmap,
  raymarched engraved 3D) while palette/type/grain stay constant.
- **palette:** bg/ink `#0A0A0B`, panel `#151517`, dim line `#5E5B57`, mid grey `#9C978F`, paper/type (bone)
  `#EEE9DF`, signal (the spark, sung word, the number) `#FF4D12`, hot core `#FF8A3D`, deep shadow of orange
  `#C21D0B`; one rare accent owned by a single ~2 s moment `#D8FF3C`. Some plates invert to bone paper + ink lines
  (forms, charts, banknote) for a light/dark rhythm; orange stays orange on both.
- **texture/post:** linear-light bloom only above ~0.85 (so only signal/ember glow; bone type never blooms), orange
  halation, ~1.2 px edge CA, filmic shoulder, midtone-weighted two-scale grain 0.055, vignette 0.35. Engraving
  shading = line density/width driven by darkness (`hatch(u,dark)`, `engrave(uv,dark,freq,angle)`), band-limited
  so lines never get closer than ~1–2 px (LOD doubles spacing and fades the in-between lines — no moiré). Paper
  plates: procedural fibres + raking light, inks drawn as channel-coded coverage (R typewriter, G print, B orange)
  and shaded separately (stamp ink with voids/mottling heavier at shape edges).
- **typography:** Archivo (variable width 62–125, weights 300–900) = the lyric voice, animated on its width axis
  (stretch on held notes, condense under pressure); IBM Plex Mono = the machine (labels, tokens, footnotes, QC
  logs); Cormorant Garamond italic = the rare prophetic register; single-stroke Hershey/EMS fonts = text *written*
  by the pen. All Google Fonts except the stroke fonts (Hershey: public domain). Kern glyph-by-glyph from the font's
  own tables; typographic quotes except in mono UI; no outlined/haloed type *except* the deliberate unsung-word
  hairline outline.
- **motion rules:** 60 fps with true shutter motion blur; hard cuts on downbeats; hits on kicks/snares; strong
  eases (`outExpo`, `inOutCubic`, damped springs) → hold → snap; camera never floats (snap reframe per beat,
  whip pans, crash dollies, punch-ins); held words keep creeping (scale `1 + 0.035·t`).
- **signature moves:** `spark-pen`, `karaoke-fill` (outline→solid), `word-slam-hook`, `width-pressure-type`,
  `stepped-readout`, `token-sampler-prompt`, `engraving-hatch`, `crt-collapse`.
- **do:** one glowing colour; deadpan mono annotations next to giant display type; lyrics integrated *into* the
  picture (on the curve, stamped on the form, painted as road markings, spelled by cells). **don't:** purple/cyan
  neon cyberpunk, glowing brains, code rain, lens-flare soup, particle nebulae, emoji, centred subtitles.
- **source:** `pdoom-video/docs/TREATMENT.md`, `app/src/engine/palette.ts`, `post.ts`, `glsl/common.ts` (MIT).

### style `watercolor-storybook` — Painted picture-book theatre (PDoomVideo) — idea only (no licence)
- **essence:** a hand-painted children's-book stage show: flat colour washes with soft bleeding watercolour
  backgrounds, wobbly ink outlines that boil, chunky marker lettering, paper texture under everything.
- **palette** (colour facts only): paper `#F3EBDC`, ink `#2B2233` (never pure black), clay `#D97757` / dark
  `#A84D33` / light `#F2A283`, night `#1F2550`, indigo `#2F3C7A`, rose `#E27A92`, ochre `#E8AA38` (karaoke sung
  colour), sap `#6E9F58`, teal `#3A9C98`, violet `#7B5CA8`, cream `#FFF5E2` (never pure white), sky `#8EC3E6`.
  Per-chapter palette arc: warm lamp-lit → sky → space violet/gold → steel/jazz blue → teal → alarm red → crimson/gold.
- **texture:** procedural paper (≈70 faint warm radial stains + ≈1400 short curved fibre strokes) under the frame;
  a static multiplied grain + warm edge vignette (≈35 %) over it so pigment sits *in* the paper. Fake in SVG:
  `feTurbulence` stains + fibre path set + multiply layer; watercolour fill = shape with `feDisplacementMap`
  (scale 6–12) edge + inner darker rim (`feMorphology` erode, low opacity) + turbulence pigment texture.
- **typography:** Permanent Marker (display/SFX, with an ink drop shadow), Shantell Sans 800 (karaoke) — Google Fonts.
- **motion rules:** linework boils at 12 fps (jitter reseeded 12×/s), characters bounce on every beat with squash
  and stretch, anticipation + overshoot (`backOut`, `elasticOut`), on-beat camera shake changes at 24 fps;
  something happens in every shot.
- **signature moves:** `brush-band-wipe`, `painted-karaoke-bar`, `shape-iris`, `stage-curtain`, `beat-dance-moves`.
- **do:** big silhouettes, one focal gag per shot, text-light frames. **don't:** labels/captions repeating the lyric.
- **source:** `PDoomVideo/ANIMATION_GUIDE.md`, `STORYBOARD.md`, `src/core.js`, `src/timeline.js` — idea only (no licence).

---

## 4. Techniques

### A. Music + lyric sync layer (infrastructure)

### `beat-grid` — NEW (core hook `useBeat` + `audio.json` schema)
- look: invisible; lets any motion pulse, cut, step or shake on the music.
- params: schema `{duration, bpm, beats[], downbeats[], sections[{name,start,end}], fps:100, rms/low/mid/high[],
  onsets{kick,snare,hat,vocal:[[t,strength]]}}`. Helpers: `beatAt(t)` (piecewise linear between beats),
  `barAt`, `timeOfBeat`, `nearestBeat`, `section(t)`, `env(name,t)`, `envPeak(name,t,0.08)`,
  `hit(kind,t,hl)=max s·0.5^((t−t_i)/hl)` with hl kick .12 / snare .14 / hat .06 / vocal .15.
- build: `src/core/beat.ts`: `loadBeatData(json)` + `useBeat()` returning `{t, beat, beatPhase, bar, barPhase,
  section, env(), hit(), events(kind,t0,t1)}` from `useCurrentFrame()/fps` (+ optional `offsetSec`). When no JSON
  is given, synthesise a constant grid from `bpm` + `firstBeat` (that already covers `beat-montage`, `hud-chrome`
  and `live-chart`'s `bpm` props). Generate JSON with a small script on the user's machine (librosa beat_track +
  onset_detect on a Demucs drum stem, or just bpm/offset). Expose `bpm`, `beatOffset`, `beatData` props on any
  beat-aware motion; `Compose` gets `spec.music = {file, beatData}` and passes it via context.
- source: `pdoom-video/app/src/engine/audio.ts`, `analysis/analyze.py`, `data/audio.json` notes (MIT).
- value: the single biggest missing primitive for music videos, promos and reels ("cut on the beat", "pulse on
  the kick").

### `lyric-timing` — NEW (core hook `useLyrics` + `lyrics.json` schema)
- look: invisible; per-word/per-syllable sung progress for any text motion.
- params: `{lines:[{text,start,end,words:[{w,start,end,conf?,syl?:[[a,b]]}]}]}` (seconds). `wordProgress`
  piecewise over syllables; `lineCharProgress` counts spaces; `get(textFragment, nth)` finds a line by content
  (fold curly quotes); anticipation window 0.4 s (show the upcoming line dim, never highlight ahead of the voice).
- build: `src/core/lyrics.ts` (pure functions + `useLyrics(data)`); conversion helpers from our existing
  `CaptionCue` (line-level) and from Whisper word timestamps (`word_timestamps=True`; the user has a local Whisper),
  with a fallback "estimated" mode (see `painted-karaoke-bar`) when only line times exist.
- source: `pdoom-video/app/src/engine/lyrics.ts`, `data/lyrics.json` schema (MIT; the lyric *content* is not MIT).
- value: karaoke/lyric videos, word-synced narration captions, podcast clips.

### `lyric-anchored-timeline` — NEW (Compose extension)
- look: scene cuts land on the beat just before the line they illustrate.
- params: `cut(q)` = last beat ≤ first word start of line q (+0.02 s tol); `after(q)` = downbeat nearest the line
  end; section starts from analysis; windows that touch = hard cut; overlap = crossfade or custom (`tin` 0→1).
- build: `Compose` spec scenes may give `startAt: {lyric:'<words of the line>', snap:'beat'|'downbeat'}` instead of frames;
  resolve to frames at spec-build time with `beat-grid` + `lyric-timing`. Pass `under`/`tin` to motions that opt
  into custom transitions (geometry hand-offs).
- source: `pdoom-video/app/src/timeline.ts`, `engine/engine.ts` (MIT).
- value: an agent can author a whole lyric video by lyric text, never by timestamps; re-timing the song just works.

### B. Lyric typography

### `karaoke-fill` — EXTENDS `kinetic-captions`
- look: the line is set big; sung glyphs are solid bone (or signal for the current word), unsung glyphs are a 1 px
  hairline outline or 30–40 % bone; the boundary moves through the word at the singer's speed, syllable by
  syllable (fig02 "SERVA|NT", fig12 "THR|OUGH" in orange over outline).
- params: wipe x from `lineCharProgress` → kerned glyph x (`glyphX(text,i)` — never `measure(slice)`, which
  drops the kern); unsung opacity 0.3–0.4 or outline; current word = signal `#FF4D12`; anticipation ≤0.4 s;
  title-safe ≥96 px from edges. Variant ideas from the plates: `mask` (each word a solid block labelled [MASK]
  that unmasks when sung), `reverse` (highlight right→left for a word that "disobeys"), `mirrored` (word set
  right-to-left), `stamp` (each word stamped on its start, with 2–3° rotation and ink texture).
- build: new props on `kinetic-captions`: `words` (lyric-timing data or `lyrics` + `line`), `mode:
  'pop'|'fill'|'outline-fill'|'mask'|'reverse'`, `sungColor`, `currentColor`, `unsungOpacity`, `anticipation`.
  Draw SVG `<text>` twice; clip the solid copy with a `<clipPath>` rect whose width = fractional glyph x; outline
  copy `fill:none; stroke-width:1`.
- source: `pdoom-video/docs/TREATMENT.md` "Karaoke rules", `engine/lyrics.ts`, `engine/type.ts`, plates fig02/fig12 (MIT).
- value: every lyric video / word-synced caption.

### `word-slam-hook` — NEW
- look: a hook phrase is played one word per hit, each word full-frame (Archivo 900, up to ~1150 px / W−150),
  slamming in exactly on the sung word, with type-specimen guides (hairlines at baseline and cap height, tiny mono
  labels "baseline", "cap-height · 0.7xx em"); 2 inverted frames on every slam; screen shake; the last word turns
  into a giant number that rolls to its new value.
- params: scale `hold·(1 + amt·(1 − outExpo((t−t0)/0.16)))`, amt 0.12–0.16 (0.25–0.3 in the maximal variant),
  `hold = 1 + 0.035·(t−t0)` (held words creep toward camera); shake 7–26 px with pulse half-life 0.05 s, punch zoom
  +4 % on the main hit; invert flash = 2 frames at 60 fps; escalation presets: (1) bone on ink clean, (2) ink on
  orange field heavier, (3) breakdown — hairline, tiny, lots of black, slow, (4) maximal — background strobes
  ink/orange/bone on eighths, every held word re-slams each beat with echo outlines, digits multiply
  (0.99999…). "UPPING" literally rises.
- build: `text/word-slam.tsx`; props `words` (or lyric line + `beatData`), `variant 1–4`, `font`, `ink`, `field`,
  `accent`, `guides`, `invertFrames`, `shake`, `finale: {value, from, decimals}` (reuse `number-counter` roll).
- source: `pdoom-video/app/src/scenes/hook.ts` (slam/retrig/punch logic), TREATMENT "HOOK ×4" (MIT).
- value: chorus hooks, promo taglines, sports/hype edits — "one word per beat" is a staple we lack.

### `width-pressure-type` — NEW
- look: a lyric is packed into a broadcast title-safe rectangle; on every kick it condenses (variable width
  125→62, weight 300→900, tracking negative) and more copies stack with collapsing leading until the box is a solid
  slab; then on stressed words the type bursts through title-safe (90 %), action-safe (93 %) and finally the frame
  border (crop marks splay out and snap back), with a deadpan mono QC log ("WARN text outside title safe (90%)" +
  timecode).
- params: width steps on the kick, hidden by a horizontal spring (squeeze + overshoot); leading collapses per kick
  and creeps between kicks; copies alternate two flat tones (no outlines); counter races 20 → 20,000 alongside.
- build: `text/pressure-type.tsx`; needs a variable font with a width axis (Archivo, Roboto Flex, Anybody — Google
  Fonts) via `font-variation-settings: 'wdth' X, 'wght' Y`; props `lines`, `kicks` (beat data), `widthFrom/To`,
  `weightFrom/To`, `copies`, `safeAreas`, `qcLog`, `accent`.
- source: `pdoom-video/app/src/scenes/dense-press.ts`, fig12 (MIT).
- value: "pressure/scale/too much" beats in explainers, launch videos, hype reels.

### `token-sampler-prompt` — NEW
- look: a thin prompt field in a dark void; the phrase is typed **as tokens** (word pieces) exactly on the sung
  word starts; ~0.16 s before each token a tiny next-token distribution (4–5 candidates with bars and
  probabilities, often jokes) flickers above it and the sampled candidate lights orange; caret blink; ⏎ launches the
  next section (flash/zoom/collapse on the downbeat). Camera "shots" re-frame between caret, typed text and field
  (zoom 1.25–2.7, tiny roll ±0.03 rad, push 0.02–0.06) and each token arrival kicks the camera a hair.
- params: token font 60 px mono; candidate list `[[text,p]]`, `pick` index; fake token ids; variants: rings
  pulling in behind (tunnel), bars closing in on the beat, letters drifting apart after typing (fragile ending).
- build: `ui/token-prompt.tsx`; props `tokens:[{s, dist:[[text,p]], pick, at?}]` (or `text` auto-split), `timing`
  (`lyric-timing` words or chars/sec), `accent`, `backdrop: 'void'|'rings'|'bars'`, `enterKey`, `drift`.
  Pairs with `typewriter-code` visually but is a different idiom (LLM sampling, not code).
- source: `pdoom-video/app/src/scenes/prompt.ts`, `prompt-data.ts` (MIT).
- value: AI-product videos, "how an LLM picks the next word" explainers, prompt demos.

### `lyric-on-path` — NEW
- look: the lyric rides along a curve the spark is drawing (a loss curve, a fuse, a road): each word appears on the
  path as it is sung; fuse variant — words glow when the burning front passes, then char to ash and crumble.
- params: path arc-length param; word i placed at arc length proportional to its start time; per-glyph tangent
  rotation; burn front = spark arc position; ash = desaturate to graphite + downward drift + opacity fade.
- build: SVG `<textPath>` with `startOffset` per word, or per-glyph placement via `getPointAtLength` (precomputed
  table, deterministic). Props `path`, `words`, `spark`, `burn`, `color`, `ashColor`.
- source: `pdoom-video/app/src/scenes/loss.ts`, `fuse.ts`; TREATMENT `loss`, `fuse` (MIT).
- value: text that follows a chart line, a route on a map, a timeline.

### `stroke-write-sync` — EXTENDS `handwrite-on`
- look: single-stroke (plotter) lettering written by a glowing pen in time with the vocal; the pen head is the
  spark.
- params: `writtenLength(st, charTimes, t)` maps each character's [start,end] (from word timings) to its stroke
  length range; Hershey script/sans/serif single-line fonts; optical kerning for pairs like To/AV/LT.
- build: add `charTimes` / `words` (lyric-timing) and `pen: 'nib'|'spark'` props to `handwrite-on`; add a
  `strokeFont` option using Hershey single-line glyphs (public domain) as SVG paths so `strokeDashoffset` can write
  them.
- source: `pdoom-video/app/src/engine/stroke.ts` (MIT), fonts `app/public/fonts/stroke/*.svg` (OFL / PD).
- value: signatures, "written by the AI" moments, plotter aesthetics.

### `cell-spell-text` — EXTENDS `dot-matrix`
- look: a top-down grid of 100,000 tiny cells (400×250) flickering in waves; the words are spelled by the cells
  themselves, each word lighting as it is sung; camera cranes from one cell (macro) out to the full floor with an
  exponential zoom and slow rotation.
- params: text mask at grid resolution (R = in text, G = u within word for a left→right fill, B = word index).
- build: `dot-matrix` new `mode:'text'` + props `text`/`words`, `grid:[cols,rows]`, `wave`, `zoomFrom`.
- source: `pdoom-video/app/src/scenes/dense-gpu.ts` (MIT).
- value: datacenter/scale stories, LED-wall typography.

### C. Recurring motif + readouts

### `spark-pen` — EXTENDS `line-draw-on`
- look: one orange point with a white-hot core, short tail, four tiny rays and sputtering sparks, dragging a
  hairline; it is the pen for everything (writes text, draws charts, becomes a fuse) — a continuity device across
  scenes.
- params: halo = a few concentric dots with falling intensity; particles born at a fixed max-rate clock, thinned by
  hash (keeps identity under motion blur), drawn as short additive streaks; head colour `#FF8A3D` core over
  `#FF4D12`, bloom only on it.
- build: `pen:'spark'` on `line-draw-on` (and reuse in `live-chart` head dot, `handwrite-on`); export
  `<SparkHead x y intensity/>` + `sparkParticles(headAt, rate)` from `fx-kit`.
- source: `pdoom-video/app/src/scenes/_motifs.ts` (MIT).
- value: a hero "thread" that ties a multi-scene video together.

### `stepped-readout` — EXTENDS `number-counter`
- look: a single value that is raised at story beats; each step rolls with `outExpo` over 0.9 s, then creeps slowly
  (≤20 % of the gap to the next value), with tiny noise jitter; a flash envelope (half-life 0.35 s) after each step;
  sometimes leaves its corner and blows up full screen, then returns. Overflow finale: passes 1.00 → log ruler →
  walls of zeros → ∞ → simplified to NaN with a footnote.
- params: steps `[{at,value}]` (may be lyric-anchored), `roll 0.9 s`, `creep 0.2`, `jitter 0.004`, `flashHL 0.35`.
- build: `number-counter` props `steps`, `creep`, `flash`, `blowUp:{at,dur}`; the readout component drawable
  anywhere (corner HUD or in-world).
- source: `pdoom-video/app/src/engine/hud.ts` (`PDoom`) (MIT).
- value: "risk/score climbs every chorus", progress bars that tell a story.

### D. Camera

### `beat-camera` — NEW (wrapper `<BeatCamera>`)
- look: the camera never floats — it snaps to a new framing on every beat (whip with roll, low hero angle,
  punch-in, orbit), steps in on each sung word and slams on the hit, chases a moving subject a beat-fraction late;
  a tilted "table" world rolls in steps on the kicks, each step caught by a damped spring.
- params: shot keys `{t, zoom, focus, rot, push}` blended with eases; `springStep(t, freq=4, damping=0.35) =
  1 − e^(−ζωt)·cos(ω√(1−ζ²)t)`; shake = noise keyed to `frameIdx` × pulse(hl 0.05); punch zoom +4 %; "settle
  before the cut" (zero shake/zoom for the last 0.1 s so hand-offs line up).
- build: `src/core/beat-camera.tsx`: wraps children in a transform (scale/rotate/translate around a focus point)
  driven by `keys` or by `beatData` triggers (`on: 'beat'|'downbeat'|'kick'`, `moves: ['punch','roll','whip']`);
  optional motion blur via `@remotion/motion-blur` during whips.
- source: `pdoom-video/app/src/scenes/prompt.ts` (shots), `room.ts`, `dense-askew.ts`, `engine/util.ts` (MIT).
- value: makes any static motion feel edited to music.

### `droste-dive` — EXTENDS `powers-of-ten`
- look: the frame nests inside itself (log-polar Droste), twists into a spiral, untwists and dives level by level,
  each nested frame stamped with a version tag, bottoming out on the next scene's first frame.
- build: new `mode:'droste'` taking any `child` render; per level scale `ratio^k`, tag text per level; WebGL log-polar
  warp or a cheap stack of scaled copies.
- source: `pdoom-video/app/src/scenes/loom.ts` (MIT).
- value: "recursive self-improvement", infinite-loop endings.

### E. Effects / post / render

### `post-stack` — EXTENDS `film-look`
- look: the global finishing pass of the treatise style (see style block); per-scene overrides.
- params: bloom threshold 0.85 linear, knee 0.5, radius 0.75, strength 0.55; halation 0.25 tinted `(1,.18,.04)`;
  CA 1.2 px edge ∝ r²; shoulder k 0.72; grain 0.055 midtone-weighted, 2 scales; vignette 0.35; `flash`, `invert`,
  `zoom`, `shake` as hit tools.
- build: `film-look` `overlay` mode as a full-video post layer with props `halation`, `halationColor`,
  `grainMidtones`, `shoulder`, and per-frame hit inputs (`flashAt[]`, `invertFrames[]`, `punchAt[]`) or `beatData`.
- source: `pdoom-video/app/src/engine/post.ts` (MIT).
- value: one-line "make it look filmic and hit on the beat" for any composition.

### `shutter-blur` — NEW (render wrapper)
- look: real motion streaks on whips, slams and crash zooms instead of stepped copies.
- params: shutter 0.2 frame, samples 12 (still) / 36 (camera move) / 108+ (whips); requires every motion to be a
  pure function of time (our motions already are).
- build: `<ShutterBlur samples shutterAngle>` = Remotion `@remotion/motion-blur` `CameraMotionBlur` around a layer;
  recipe guidance: enable only around hits to keep render cost down.
- source: `pdoom-video/README.md`, `docs/ENGINE.md` "Motion blur and sampling" (MIT).
- value: premium finish for fast type slams and transitions.

### `engraving-hatch` — NEW (kit shader + look)
- look: white-line scratchboard/banknote engraving: shading by line density and width, contour lines following the
  form, cross-hatch in the deepest shade, a hot rim light in signal orange.
- params: `hatch(u, darkness)`, `engrave(uv, darkness, freq, angle)`; line width ∝ darkness; LOD: never closer than
  ~1–2 px — spacing doubles and in-between lines fade (no moiré at any scale).
- build: GLSL helpers in `three-kit` / a WebGL `<EngraveShade>` for SDF or height-field subjects; an SVG fallback
  for flat shapes using `<pattern>` lines masked by a luminance map. Related: `duotone` already has an
  ink-etching image mode (images only); this is for procedural/3D subjects.
- source: `pdoom-video/app/src/engine/glsl/common.ts`, `ilya-glsl.ts` (moiré-free hatching notes) (MIT).
- value: the treatise style's core finish; also "engraved" product renders and banknote looks.

### `contour-dive` — EXTENDS `terrain-build-3d`
- look: a 3D landscape rendered as illuminated topographic contour lines with mono level labels (1e-7, 1e-8…),
  the camera dives down a canyon toward a sharp minimum, the spark's path the only orange thing (fig02).
- build: `terrain-build-3d` new `look:'contours'` (iso-lines of the heightmap via `fract(h·k)` band) + `camera:'dive'`
  + `trail` prop.
- source: `pdoom-video/app/src/scenes/loss.ts`, fig02 (MIT).
- value: optimisation/ML explainers, "descending into the data".

### `scope-trace` — EXTENDS `live-chart`
- look: a triggered phosphor oscilloscope: the trace glows under a glass graticule that parallaxes over it, the beam
  repaints once per beat, fading echoes; the lyric rides the wave; ends by collapsing to a point like a CRT turned off.
- build: `live-chart` `mode:'scope'` + `repaint:'beat'`, `echoes`, `graticule`, `exit:'crt'`.
- source: `pdoom-video/app/src/scenes/spacetime.ts` (MIT).
- value: audio/tech/medical intros; "stable signal" visual.

### `crt-collapse` — NEW (transition)
- look: the outgoing image squashes vertically to a bright horizontal line, the line shrinks to a point, the point
  holds a beat (it can become the next scene's spark/black hole) — the classic TV switch-off.
- params: ~6–10 frames: scaleY 1→0.004 with `inExpo` and brightness ×2–3, then scaleX →0 in 3–4 frames, glowing dot
  1–2 frames.
- build: new transition type `crt` in `TRANSITIONS`; props `x,y` (collapse point), `color`.
- source: `pdoom-video/app/src/scenes/shoggoth.ts`, `spacetime.ts` (MIT).
- value: retro tech cuts, "signal lost", flatline hand-offs.

### `page-burn-through` — NEW (transition)
- look: the next scene's spark travels under a paper page (its light shows through), bursts through on the beat,
  burns the page in two along its path and the halves swing away to reveal the next scene.
- build: transition type `burn`: SVG mask along a path with a glowing ember edge (`feTurbulence`-displaced stroke,
  orange→black char gradient), two half-page layers rotating out with perspective.
- source: `pdoom-video/app/src/scenes/bureau.ts` (MIT).
- value: paper/document scenes → anything; reveal a roadmap/plan.

### `rewind-loop-montage` — EXTENDS `beat-montage`
- look: after the end card, every earlier scene flashes past *backwards*, faster and faster, then the opening plays
  in reverse, brakes and parks on frame 0 — a seamless loop.
- build: `beat-montage` props `reverse`, `accelerate` (cut length shrinking), `loopToStart`; feed it stills
  rendered from the composition (`renderStill` per scene midpoint, like pdoom-video's `plates.json`).
- source: `pdoom-video/app/src/scenes/outro.ts`, `scripts/render.ts plates` (MIT).
- value: looping social videos, recap endings.

### `time-stutter` — NEW (wrapper)
- look: on a word like "repeat" the last beat of the scene stutters ×3 (time-remapped loop), then continues.
- build: `<TimeRemap map={(f)=>…}>` that renders its child at a remapped frame (Remotion: wrap child in a
  component that overrides frame via `Freeze`/`Sequence` offset per segment). Props `at`, `length`, `repeats`.
- source: `pdoom-video/app/src/scenes/bureau.ts` (MIT).
- value: DJ-style stutters in promos, emphasis edits.

### `guilloche-note` — NEW
- look: banknote security engraving: interlaced guilloché rosettes (`r = R + a·sin(nθ + φ_k)` families), lathe-work
  waves, a woven border band, a portrait oval with a line-relief engraved subject (horizontal lines displaced by
  height, thickened by shade), serial numbers and banknote lettering (fig06).
- build: SVG procedural paths (K = 20–60 curves per rosette, n = 6–18 lobes) in hairline ink on bone paper; props
  `title`, `subject` (image → line-relief), `denomination`, `serial`, `ink`, `accent`.
- source: `pdoom-video/app/src/scenes/ascent-note.ts`, fig06 (MIT).
- value: money/finance/stock videos, certificates, premium end cards.

### `beat-branch-explosion` — EXTENDS `branch-grow`
- look: a single line splits on every eighth (then every sixteenth) — 1→2→4→…→1024 branches — filling the frame
  in ~1.5 s, with shockwave rings from a hit word.
- build: `branch-grow` props `splitOn:'beat'|'eighth'|'sixteenth'` + `beatData`, `maxDepth 10`.
- source: `pdoom-video/app/src/scenes/room.ts` (MIT).
- value: "exponential growth" moments synced to music.

### `token-tree` — NEW
- look: a sentence is generated token by token along a chosen path while every node sprouts dim alternative
  branches with their tokens and probabilities that keep branching into the dark; the camera rides the tip then
  pulls back in beat steps until the whole tree is in frame; the final token is sampled from a readable list.
- build: `data/token-tree.tsx`: props `path:[{token,p,alts:[[t,p]]}]`, `timing`, `depth`, `accent`, `serifToken`
  (last token in an italic serif). Pairs with `token-sampler-prompt`.
- source: `pdoom-video/app/src/scenes/loom-tree.ts` (MIT).
- value: LLM explainers ("what the model could have said"), decision trees.

### `xray-word-cursor` — EXTENDS `xray-scan`
- look: the x-ray band's leading edge *is* the karaoke cursor: it sweeps on the sung words, revealing the hidden
  layer behind and the word cut into it.
- build: `xray-scan` prop `sync: {words}` mapping beam x to `wordProgress`; `passes` alternating direction per word.
- source: `pdoom-video/app/src/scenes/shoggoth.ts` (MIT).
- value: "see through the lies" reveals, before/after with lyrics.

### Already covered (pdoom-video)
- `beat-doubling` (clips replicate 1→64 on eighths) — COVERED by `cell-division` (add `beatData` timing only).
- `odometer` (31 engraved digit drums) — COVERED by `number-counter` `mode:'odometer'`.
- `whip-pan` with motion blur — COVERED by transition `push-blur`.
- `rubber-stamp` ("SAFE ENOUGH" slam with ink voids) — COVERED by `stamp-slam` (texture idea: voids heavier at edges).
- deadpan callouts / leader-line tags with live counters — COVERED by `callout-labels`.

### F. PDoomVideo — idea only (no licence)

### `brush-band-wipe` — NEW (transition) — idea only (no licence)
- look: five fat diagonal paint bands (frame rotated ≈ −6°) sweep across from the left with ragged painted ends,
  each band starting at a slightly different delay, fully covering the old scene; the scene swaps under full cover
  at the midpoint, then the bands drag off to the right the same staggered way. Two alternating colours per break,
  with a dry-brush hatch texture inside the bands.
- params (my numbers for our version): 5 bands each ≈ (H+420)/5 tall, delays {0, .14, .06, .18, .1} of each half,
  cover with `outCubic`, reveal with smoothstep; 18–24 frames total.
- build: transition type `brush` (SVG paths with a displaced ragged end cap, `feTurbulence` pigment), props
  `colors[2]`, `angle`, `bands`, `seed`. Differs from `storm` (`watercolor`): solid opaque bands, cover-then-reveal.
- source: `PDoomVideo/src/timeline.js` (wipe), `ANIMATION_GUIDE.md` — idea only (no licence).
- value: chapter breaks in painted/kids/storybook videos.

### `painted-karaoke-bar` — EXTENDS `kinetic-captions` — idea only (no licence)
- look: a dark painted ribbon (ragged watercolour edge, slight violet bleed) grows open from the centre at the
  bottom of the frame when a line starts; cream words fill left→right in ochre at an estimated singing speed;
  the ribbon closes at the line end.
- params: open in ≈0.18 s (`outCubic`), close in ≈0.12 s; estimated fill duration = `min(lineDur−0.1, 0.45 +
  0.075·chars)` (useful fallback when only line-level timing exists); keep key action above ≈ y 960 of 1080.
- build: `kinetic-captions` `variant:'painted-bar'` + `mode:'fill'` with `estimate:true` when `words` lack times.
- source: `PDoomVideo/src/timeline.js` (karaoke) — idea only (no licence).
- value: kid-friendly lyric/caption bar; the timing fallback is valuable on its own.

### `shape-iris` — EXTENDS transition `iris` — idea only (no licence)
- look: everything outside a shaped hole is painted over — the hole can be a mouth (reveal "from inside the
  mouth"), a heart, a keyhole, a star — opening or closing on a hit.
- build: `iris` transition gets `shape: 'circle'|'heart'|'star'|'keyhole'|'mouth'|{path}`; SVG mask with
  `fill-rule: evenodd` (frame rect + scaled shape).
- source: `PDoomVideo/src/core.js` (irisShape), `STORYBOARD.md` — idea only (no licence).
- value: playful motivated cuts.

### `stage-curtain` — NEW — idea only (no licence)
- look: a painted theatre: rotating two-colour sunburst backdrop, wooden floor from ~74 % H, spotlight cones, side
  curtains + valance in front that sweep open at the start and close at the end (bookend), optional red alarm wash.
- build: `environment/stage-curtain.tsx`; props `open` keys, `backdrop:'sunburst'|child`, `colors`, `spots[[x,color]]`,
  `alarm`, `curtainColor`. Overlay-capable front layer (curtains only) to frame any motion.
- source: `PDoomVideo/src/props.js` (stageBack/stageFront), `STORYBOARD.md` — idea only (no licence).
- value: "show"/announcement framing, open/close bookends, recurring set for choruses.

### `pump-meter` — EXTENDS `number-counter` — idea only (no licence)
- look: a big painted thermometer prop on the stage floor; a character pumps a bicycle pump and the value climbs in
  one pump-sized step per beat during each chorus, holding in between (8→34→61→86→99.9); cracks near the top.
- build: `number-counter` `gauge:'thermometer'` + `stepOn:'beat'`, `windows:[[from,to,v0,v1]]`, `cracked`.
- source: `PDoomVideo/src/timeline.js` (meter windows), `props.js` — idea only (no licence).
- value: gamified metrics, fundraising totals.

### `beat-dance-moves` — EXTENDS `box-bot` — idea only (no licence)
- look: a mascot dances on the beat from a small move library: bounce, hop, arms-up "raise the roof", sway, a spin
  every 4th beat (horizontal scale through cos), wave, stomp, shimmy, walk/run, and `mix` (switch style every 8
  beats). Each move = beat-phase-driven body offset, squash on the hit (decays over ~0.3 beat), arm angles.
- build: `box-bot` / `character-kit` `dance: style` + `beatData`; formulas of the form `dy = −|sin(π·beat)|·A`,
  `squash = max(0, 1 − 3.5·beatFrac)·k`. See `character-rig.md` for the rig itself.
- source: `PDoomVideo/src/clawd.js` (move) — idea only (no licence).
- value: chorus-line crowds, celebration states.

### `mood-take` — EXTENDS `eyes-blink` — idea only (no licence)
- look: a face never snaps between expressions: the eyes squash shut, the body does a quick squash/stretch "take"
  (~0.16 s), a reaction mark pops (sweat, sparkle, heart, "!"), then the new eyes open.
- build: `mood(t, [[t, expression, emote]])` helper in `character-kit` returning squint/take/emote envelopes;
  pairs with `emote-pop`. Detailed in `character-rig.md`.
- source: `PDoomVideo/src/clawd.js` (mood), `ANIMATION_GUIDE.md` — idea only (no licence).
- value: readable character acting in explainers.

### Already covered (PDoomVideo)
- line boil at 12 fps (jitter reseeded 12×/s) — COVERED by `emote-pop` / `scribble-ball` / `sketch-kit` boil.
- popping comic SFX words (FOOM, BOOM, CHOMP) — COVERED by `comic-burst`.
- troupe of backup dancers in hats — COVERED by `crowd-bob` (+ `beat-dance-moves`).

---

## 5. How to build a lyric-video engine in this library

Goal: an agent gives a song, its lyrics and a few art-direction words; the library returns a beat-cut, word-synced
lyric video built from our motions.

**1. Data (offline, on the user's machine, outside Remotion).**
- `public/<song>/beats.json` — `beat-grid` schema above. Minimum viable: `{bpm, firstBeat, duration}`; full: beats,
  downbeats, sections, onsets (kick/snare/hat/vocal with strength), 100 fps envelopes. Script: `cli/mgl beat
  <song.mp3>` (librosa `beat_track` + onset strength per band; optional Demucs drums stem). Record how it was made in
  a `notes` field like pdoom-video does.
- `public/<song>/lyrics.json` — `lyric-timing` schema. Script: `cli/mgl lyrics <song.mp3> <lyrics.txt>` using local
  Whisper word timestamps, then align the known lyric text to Whisper's words (difflib); keep `conf`; allow
  `syl` spans for held notes. Fallback: line times only (`estimate:true`).

**2. Core (`src/core/`).**
- `beat.ts`: `BeatData`, `beatAt`, `barAt`, `timeOfBeat`, `nearestBeat`, `section`, `env`, `hit`, `events`,
  `springStep`, `pulse`, `frameIdx`; React `BeatProvider` + `useBeat()` (time = frame/fps + offset).
- `lyrics.ts`: `Lyrics` class (`get`, `find`, `lineAt`, `lastLine`, `wordAt`, `wordProgress`,
  `lineCharProgress`, `smartQuotes`); `useLyrics()`.
- `layout.ts`: kerned glyph positions for SVG text (`glyphX`) so wipes split words without losing kerning
  (use opentype.js on the loaded Google Font, or `getSubStringLength` on a hidden `<text>`).

**3. Compose spec.**
```jsonc
{
  "music": { "file": "song.mp3", "beats": "song/beats.json", "lyrics": "song/lyrics.json" },
  "post": { "motion": "film-look", "props": { "overlay": true, "halation": 0.25, "grain": 0.055 } },
  "scenes": [
    { "startAt": { "lyric": "<first words of the verse line>", "snap": "beat" }, "motion": "live-chart",
      "props": { "mode": "trace", "pen": "spark" },
      "lyric": { "motion": "kinetic-captions", "mode": "outline-fill", "position": "top-left" } },
    { "startAt": { "lyric": "<hook words>", "nth": 0, "snap": "beat" }, "motion": "word-slam", "props": { "variant": 1 } }
  ]
}
```
Rules: scene windows end where the next begins (hard cut on the beat); `transition` only where motivated;
`lyric` layer per scene picks a lyric integration (caption, on-path, stamp, mask, written by the pen) and reads its
line by content.

**4. Components to add.** `kinetic-captions` modes (`fill`, `outline-fill`, `mask`, `reverse`, `painted-bar`),
`word-slam`, `pressure-type`, `token-prompt`, `lyric-on-path`, `<BeatCamera>`, `<ShutterBlur>`, `<TimeRemap>`,
transitions `crt`, `burn`, `brush`, `iris` shapes. Beat-aware props (`beatData` / `bpm` + `beatOffset`) on
`beat-montage`, `branch-grow`, `cell-division`, `number-counter`, `box-bot`.

**5. Direction rules for agents** (synthesised from both treatments):
- every word appears/highlights at its start and is complete by its end; dim preview ≤0.4 s early, never ahead;
- each section integrates the words *differently* and into the picture; keep words ≥96 px from the edges;
- cuts on downbeats, hits on kick/snare, camera eases into downbeats; something moves in every shot;
- one recurring motif (a spark, a mascot, a number) carries continuity; recurring hooks escalate each time;
- one glowing/accent colour, one type system, one grain for the whole film; vary idiom per section;
- check with contact sheets around every cut and every hit (pdoom-video's `sheet --cuts` habit).

---

COUNTS: techniques NEW 17 · EXTENDS 17 · COVERED 8 (pdoom-video: NEW 15 / EXTENDS 12 / COVERED 5; PDoomVideo idea-only: NEW 2 / EXTENDS 5 / COVERED 3) · styles 2 (`engraved-treatise`, `watercolor-storybook`)
