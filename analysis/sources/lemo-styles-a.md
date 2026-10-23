# lemo-opuscar styles — part A (29 styles, `archive-lighttable` … `microgame`)

Source: `repos/lemo-opuscar` (Lemo-Opuscar by LemoLab / Lemomo, @lemomo_ai, github.com/lemomo-ai/lemo-opuscar).
Licence: **code MIT, docs CC BY 4.0**. Everything below is written in our own words. Formulas are given only as
one-line summaries of the algorithm, and no source code is pasted. Attribute the library as "Lemo-Opuscar by LemoLab
(MIT / CC BY 4.0)" in any motion that ports one of these algorithms.

Method: for every style I read `STYLE.md`, `style.json` and `DEMO.md`, then skimmed the demo code (`styles/<s>/demo/**`)
for the rendering tricks. I looked at `styles/<s>/poster.jpg`, `docs/frames/<s>.jpg` and `styleboard/img/<s>_0.jpg`.
Palettes were measured with PIL (16-colour max-coverage quantisation; the top colours by area plus the most saturated
accents ≥ 0.4 % area) and checked against the hexes in the docs and code. In the palettes, **(m)** / **M** means
measured and **(d)** / **D** means documented in STYLE.md, DEMO.md or the code. No source file was executed.

Legend for techniques: **NEW** = no motion in `catalog.json` does this; **EXTENDS `id`** = add a variant/props to that
motion (or transition in `src/transitions.tsx`, or the shared `PaperTexture` / post helpers); **COVERED by `id`** = we
already have it. Style-level comparisons are against our `styles.json` (13 filter styles: woodcut, risograph,
ink-wash, blueprint, pixel-8bit, comic-halftone, watercolor, newsprint, neon-noir, crt-terminal, pencil-sketch,
cyanotype, film-noir).

---

## 0. What the engine is

**One HTML page per film, rendered as a pure function of time.** Each film is a folder whose `index.html` exposes
`window.DUR` (seconds), `window.render(t)` (draws the frame at time t, deterministic), `window.READY` (fonts and images
loaded), optional `window.EV = [{t, type, …}]` (sound and cue events) and optional `window.TEXTS(t)` (every visible text
with its pixel box, used by the reading-time checker). Headless Chrome (Playwright) calls `render(t)` for every frame
and screenshots it as JPEG. Several workers render in parallel, one browser each, and ffmpeg assembles the frames.
This is the same model as Remotion's `useCurrentFrame()`, so every technique below maps 1:1 onto a Remotion component.

- **Picture:** Canvas 2D for most 2D styles. three.js r170 (WebGL2, GPU) for the 3D styles. Raw WebGL2 fragment shaders
  for post passes (CRT/VHS, film damage, ink redraw, cyanotype, riso plates, crayon wax). There is no DOM animation:
  everything is drawn per frame.
- **Determinism rules:** no `Date.now()` and no unseeded `Math.random()`. No state is carried from the previous frame,
  so any frame renders alone, in any order, on any worker. Physics (brick collapse, debris) is **pre-simulated once with
  a fixed dt into a table** that `render(t)` reads.
- **Stepping:** characters and props step "on twos" (12 fps) where the style wants it (stop-motion, cel, pixel).
  **The camera and light always move every frame**, because a stepped camera reads as lag. This rule is worth copying
  into our `AUTHORING.md`.
- **One world→screen function per film.** Every effect that follows a subject (iris, zoom, loupe, label, spotlight)
  goes through it, and no screen coordinates are typed by hand. Labels pinned to moving 3D/2D objects are re-projected
  every frame.
- **Grain is added in ffmpeg at mux time**, not in the page, because per-frame page grain makes the frames
  incompressible and slow to capture. `mux.sh` also runs a two-pass loudnorm to −14 LUFS with a −1.2 dBTP limit.
- **One timeline file is the single source of truth** (`timeline.js`: sections with t, bpm and beats, plus named hit
  points as section + beat). It is exported to JSON so the score, the foley mixer, the subtitles and a `cuecheck`
  script all read the same numbers. The cuecheck aims for 0 ms between each visual hit and its music cue.
- **Audio is code too:** sampled instruments (VSCO 2 CE, VCSL, FreePats, Salamander…), Karplus–Strong plucked strings,
  numpy synthesis and procedural foley driven by `window.EV`. Voice is Kokoro TTS, checked by faster-whisper, with word
  timestamps used for subtitles. This matches our own Qwen3-TTS pipelines.
- **Readability gate (`readcheck.mjs`):** every on-screen text must stay fully in frame and unchanged for at least
  `CJK chars ÷ 4.5 + other chars ÷ 15 + 1.5 s` (minimum 1.5 s). Subtitles are held ≥ 1.8 s and never shorter than
  the spoken line + 0.6 s, and title cards ≥ 4 s. **Worth adopting as a lint for our recipes** (we already expose
  sample text props; a `TEXTS`-style reporter per motion would let `mgl` check reading time).

### Shared `core/` modules: the techniques

| file | technique (in our words) | port value |
|---|---|---|
| `core/lib.js` | `clamp/lerp/seg(t,a,b)` (0→1 window), easings `ss` (smoothstep), `eio` (cubic in-out), `eo/ei` (cubic), `back(t,s=1.8)`, **`spring(t,k=7,z=.35)` = 1 − e^(−z·k·t)·cos(1.6·k·√(1−z²)·t)** (one or two rebounds), seeded `mulberry32`, sine-hash `hash(n)`, 1-D value noise `vnoise`, **`monotone(keys)` = Fritsch–Carlson monotone cubic interpolation** (no overshoot between keys; tangents zeroed at local extrema and limited when α²+β²>9), `track(keys)` = per-dimension monotone tracks for multi-value keyframes (camera x, y, zoom), `env(t,a,b,fi,fo)` = 0→1→0 envelope. | **High.** Our `src/core/ease.ts` lacks a monotone-cubic camera track. `track()` is the right primitive for every camera path (zoom keyframes without overshoot), and it is about 25 lines. |
| `core/post/crt.js` | WebGL2 **VHS-on-CRT pass** with two inputs: the scene canvas plus a "glow" canvas that holds only the light sources. (1) Pre-pass: glow canvas + scene pixels above a luma threshold `smoothstep(thr, thr+.25, L)·sk`, 5-tap soft. (2) A 4-level pyramid (½, ¼, ⅛, 1/16) of downsample + separable 9-tap Gaussian. (3) Composite: **luma kept sharp, chroma (YCbCr) box-averaged horizontally over `bleed` px with Cr sampled `rshift` px to the left** (red smears right, like NTSC chroma bandwidth). Bloom = weighted pyramid sum, plus **halation** = the coarse levels tinted (1, .32, .16). Grade: saturation, smoothstep contrast mix, tint multiply, lift toward a purple shadow tint (.16,.08,.22) and fade. **Subtitles are composited before the scanlines** so they look recorded on the tape. Phosphor glow = max(bloom − .15, 0). Scanlines with a 3 px period whose depth shrinks in bright areas: `1 − scan·(.5 − .5cos(2πy/3))·(1 − .6L)`. RGB aperture grille boosts one channel per 3 px column. Corner darkening polynomial `x²y²·2 + .25(x²+y²)`. Frame flicker ±1 %. **Power-on:** sx = smoothstep(0,.3,p), sy = smoothstep(.3,1,p) (a dot becomes a line, then the frame), with a bright centre line. **Tape tracking:** per-line hash tearing, one rolling noise band, head-switching jitter in the bottom 5 %. Default "restrained" set: scan .18, grille .06, bleed 7 px, rshift 2 px, glow .35, corner .28, noise .018. | **Very high, port almost directly** as our `vhs-crt-pass` (§9). It would upgrade the `crt-terminal` style and `glitch-image`. |
| `core/three/post.js` | three.js post chain: MSAA scene + depth → optional **GTAO** (radius .25, 16 samples, denoised) → **physical depth of field**: signed circle of confusion `CoC = clamp(aperture·(1/focus − 1/z), ±maxCoC)` stored in alpha (negative = foreground). The gather uses **96 golden-angle spiral taps** at `r = maxCoC·√((i+.5)/N)`, θ = i·2.39996, with weight `smoothstep(r−1.5, r+.5, |CoC_s|)/(CoC_s²+1)`. **Leak guard:** a sample farther away than the centre may not spread wider than the centre's own CoC, so the background never smears over a sharp foreground. → UnrealBloom (.2, .5, 1.6) → vignette (aspect 1.25, smoothstep .25–.85) + warm multiply (1.06, 1, .9) + saturation + **soft contrast in linear space `c(1+k)/(1+k·c/(c+.6))`** → OutputPass (tone map). Rendered at 2× SSAA and downsampled. Note: for an orthographic camera the depth→viewZ conversion must be swapped, or the DoF breaks silently. | **High.** A shared `<ThreePost dof gtao>` for our three.js motions (`iso-blocks-3d`, `pointcloud-orbit`, `terrain-build-3d`, `wireframe-build`) gives the "macro toy / product" look that brick-toy, glass-product, data-physical and hd-2d share. |
| `core/render/*` | `still.mjs` (review stills, `--range a:b:step`), `video.mjs` (parallel workers, JPEG capture), `events.mjs` (export DUR + EV), `readcheck.mjs` (the reading gate above), `sheet.py` (contact sheets), `srt.py`, `mux.sh` (loudnorm + grain). | Process ideas: our `mgl` could gain a `readcheck` and a `cuecheck`. |
| `core/audio/*`, `core/tts/*` | Sampler with round-robins and seamless long-note extension, Karplus–Strong `pluck.py`, `sfx.py` procedural foley (`click`, `whoosh`, `thump`, `ding`, `paper`, noise beds; `add(buf, snd, at, gain, pan)`), Kokoro TTS + Whisper check. | Out of scope for the motions. Relevant to our recipes' sound design. |
| `core/fonts` | Self-hosted OFL subsets: Fredoka, Lilita One, IM Fell English, ZCOOL KuaiLe. | All of them are on Google Fonts. |

**Directing rules from `DIRECTOR.md` that are useful for our recipes** (paraphrased): hook in the first 3 s. One
"native move" per film, placed at the emotional peak (a transition made from the medium itself). At least four
different camera moves. Transitions designed inside the medium (page turn, carved line, ink bloom) as one consistent
grammar, with no default fades. At key moments the subject fills at least ⅓ of the frame height. Two real silences
before the turn. The most common failures: subject too small, colour on the same colour, subtitles over the subject,
gags too fast to read, blank frames in transitions, and timed effects that don't follow the subject after a camera move.

### How these styles map onto our `styles.json`

| lemo style | relation to our styles | note |
|---|---|---|
| archive-lighttable | NEW style | backlit scans plus a loupe. Closest to our `newsprint` only in subject. |
| art-deco | NEW style | gold keyline + airbrush shading + bulbs |
| ascii-crt | EXTENDS `crt-terminal` | adds real glyph-density ASCII, phosphor persistence, power-on |
| backrooms | NEW style (`vhs-camcorder`) | camcorder VHS. Overlaps `glitch-image` for the tape artefacts. |
| blueprint | EXTENDS `blueprint` + `cyanotype` | adds sheet physics (folds, bleaching, water blooms) and drafting order |
| brick-toy | NEW style (3D) | macro DoF toy plastic |
| briefing-board | NEW style | marker on whiteboard + magnet prints |
| caption-news | NEW style | sound-off news captions |
| cel-anime-80s | NEW style | needs `vhs-crt-pass` |
| city-symphony | NEW style | footage-driven. Needs host video. |
| countdown | NEW style | footage-driven split screen |
| crayon-book | NEW style | closest to `pencil-sketch` / `watercolor`, but wax on paper tooth |
| dark-keynote | NEW style | stage + grid + glow, Apple-keynote-like |
| data-physical | NEW style (3D) | |
| dataviz | NEW style | pencil on chart paper |
| engraving | NEW style | closest to `woodcut` / `pencil-sketch` |
| game-show | NEW style | candy-flat variety show |
| glass-product | NEW style (3D) | |
| halftone-dossier | EXTENDS `comic-halftone` / `newsprint` | flat spot inks + misregistered offset shadow |
| hd-2d | EXTENDS `pixel-8bit` | pixel sprites in a lit tilt-shift 3D world |
| hologram-hud | NEW style | relates to `neon-noir` / `crt-terminal` |
| impasto | NEW style | palette-knife oil |
| ink-wash | EXTENDS `ink-wash` | adds a real brush stroke engine, procedural rice paper, wet bleed and an ink-bloom transition |
| iso-infographic | NEW style | flat 2D true-isometric. Our iso motions are 3D clay. |
| kino-montage | NEW style | footage-driven. Two-tone print grade + red bands. |
| lidar-survey | NEW style (3D points) | extends `pointcloud-orbit` technically |
| living-screencast | NEW style | hi-res UI + low-res mascot |
| lowpoly-island | NEW style (3D) | |
| microgame | NEW style (meta) | each microgame switches medium. Its riso pass EXTENDS our `risograph` (3 plates). |

---


## 1. `archive-lighttable` — Archive Light Table (Evidence Films, *Two Seconds Short*, 40 s)

### style `archive-lighttable` — Archive Light Table
- **Essence:** real archive scans (glass negatives, telegrams, clippings) lying on a cool backlit light table; a loupe lands on one and *inside the lens* the object changes state (negative → positive, one line lights, a number lifts off, the photo opens into 2.5D depth). Quiet, modern, no vintage grade; the only colour is one signal hue for marks.
- **Palette:**
  - bg / light table `#F7F9FB` (d) — shader value rgb(.968,.976,.986); measured table around content `#e5e8ea`–`#e7e8ea` (m, styleboard frame)
  - desk beyond the table `#0E0F11` (d); glass-negative darks `#1e1d1a`–`#2e2d29` (m)
  - aluminium frame ≈ `#545759` (d, rgb .33/.34/.35)
  - ink `#15171A` (d)
  - photo greys inside the "photograph space": `#c5c4c0`, `#b5b4b0`, `#908f8b`, `#84837f`, `#656461` (m, poster + frame — neutral, very slightly warm silver-gelatin ramp)
  - negative glass (tint multiplier 0.98/0.93/0.84) → warm amber-grey `#504d46` / `#5f5b53` (m)
  - signal accent `#FF5A1F` (d; < 1 % of area so it never shows in the measured top colours — that is the rule)
  - caption plate `rgba(14,15,17,.74)` (d)
- **Texture / post-process (WebGL2, one fragment shader):**
  - Light table = emissive 0.97 white × radial falloff `1 − 0.14·|d|²` + two value-noise octaves (±0.5 %, ±0.6 %) as diffuser mottling; table → aluminium frame band → dark desk.
  - Glass negative transmission `T = 0.035 + 0.90·(1 − pos)^1.25`, tinted (0.98, 0.93, 0.84); emulsion mask from the scan (white margin touching the border = broken glass, table shows through).
  - Backlit paper: `base = light × tex × 1.02`; a lit line uses `ink = light × tex^1.6 × 1.18` (darker ink, brighter paper); unlit lines dim to ×0.62.
  - Procedural dust specks in a hashed cell grid anchored to world (not screen) coords.
  - Final: vignette `1 − 0.10·|(s − centre)/(1100,760)|²`, golden-ratio-stepped hash grain (heavier inside photographs). Most grain is added in ffmpeg at mux time.
  - **No** sepia, halftone or film damage.
- **Typography:** IBM Plex Mono (identifiers/dates/readings; 17–34 px = 1.6–3.1 % H, big readings 74–120 px = 7–11 % H); Inter / Noto Sans SC (labels 21–36 px ≈ 2–3.3 % H); a text serif (Noto Serif SC, or Source Serif 4 for Latin) only for titles and the one name in a photo (60–76 px ≈ 5.5–7 % H). Subtitles: bottom-centre dark plate with a 3 px signal-coloured edge; main line 36 px, second language 27 px.
- **Motion rules:** 24 fps on ones; camera = 2D centre + log-zoom + roll, each on monotone cubic (Fritsch–Carlson) tracks — no overshoot, no stepping. Loupe lands with ease-out ≈ 0.4 s (scale 1.35 → 1, shadow tightens), lifts the same way. Lines draw on in 0.3–0.6 s; text wipes in from its leader side; numbers count up and land on the voice. No cuts or fades: transitions are only *loupe land → push through lens → rise → lift → glide*.
- **Signature moves:** `loupe-magnify`, `negative-develop-reveal`, `line-light-up`, `photo-depth-dive`, `ground-plane-ruler`, `record-compare-strike`, `table-index-pullback`.
- **Do:** one world→screen function for camera and every mark; label = anchor dot + ring + vertical leader + text; keep lens magnification ≤ 1.5 screen px per scan px; hold compare cards still until read.
- **Don't:** slide the loupe over empty table (drop it straight on); one depth map for a photo with upright subjects (tears them); labels on a moving table; "vintage creep".
- **Source:** lemo-opuscar `styles/archive-lighttable/` (MIT code, CC BY 4.0 docs) — `STYLE.md`, `DEMO.md`, `demo/film.js` (shader + overlay), `demo/tools/prep.py` (masks / matting / fill).
- **Port note (MIT):**
  - *Loupe lens* — for every pixel with ρ = r/R < 1: offset `q = d / (1 + k·ρ²)` (k ≈ 0.16, pincushion), evaluated 3× with k scaled by 0.9 / 1.0 / 1.1 and a ±0.4 % radial scale per RGB channel → colour fringe at the rim; map q back to world through the lens's own centre and scale (S = camera zoom × 2.5). Rim ring 1.0 < ρ < 1.065: near-black ring lit by `max(0, n·L)^5 × bevel`, bevel = two Gaussians at u = 0.18 and 0.85 → machined highlight. Skirt 1.065 < ρ < 1.30: re-sample the table at `lensC + d·(0.955 + 0.045u)` (slight refraction) ×0.93, a dark Gaussian at the inner foot and a bright Gaussian line at u ≈ 0.93. Outside: soft contact shadow offset down-right in proportion to lift height.
  - *Develop front* — inside the lens `dev = 1 − smoothstep(uDev − 0.14, uDev, ρ)` mixes negative → positive; a warm Gaussian ring `exp(−((ρ − uDev)/0.022)²) × (1, .62, .36) × 0.22` rides the front; uDev animates 0 → 1.25 with ease-in-out in 0.8 s.
  - *Positive levelling* — `pc = clamp((pos − lo)/(hi − lo))^1.12`, then 60 % smoothstep + 40 % linear, mapped between `#0b0a09` and `#fcfaf5`.
  - *Line light-up* — a rectangular band mask per text line (30 px feather leading, 40 px trailing) whose right edge sweeps x0 → x1 with progress p; lit pixels use the "ink" formula, the rest dim.
  - *Photo parallax* — ground nearness `n = max(0, (y − horizonY)/(bottomY − horizonY))`; inverse-map each output point with 4 fixed-point iterations `p = c + (d − shift·enter·n)/(1 + dolly·enter·n)`. Upright subjects are separate cut-out layers.
  - *Perspective ruler* — ground row of a point D away: `y = horizon + K/D`; ruler length grows in log-distance `D(t) = D0·(Dend/D0)^t` so it advances steadily on screen; ticks every 100 ft crowd toward the horizon automatically.
  - Use `textureGrad` with an explicit footprint for texture reads inside lens branches (avoids dashed mip seams).

### Techniques

#### `loupe-magnify` — NEW
- look: a black-rimmed magnifier with a bevel highlight and clear acrylic skirt drops onto an image/document (scale 1.35 → 1, shadow tightens); inside, the content is 2.5× with pincushion and RGB fringe at the edge; optionally the camera pushes *through* the lens until the rim leaves frame.
- params: magnification 2.5; k 0.16; RGB k spread ±10 %; ring width 6.5 % of R, skirt to 1.30 R; land/lift 0.4 s ease-out; lens radius ≈ 25–30 % of H on screen; push-through zoom 0.31 → 1.5 over 1.3 s.
- build: three.js full-screen `ShaderMaterial` (or raw WebGL canvas driven by `useCurrentFrame`) sampling the host image texture; uniforms lensC, R, k, mag, A, lift; ring/skirt in the same shader. Props: `src`, `focus:[x,y]` (0–1), `magnify`, `landAt`, `liftAt`, `pushThrough`, `fringe`, `insideEffect: 'none'|'develop'|'lightLine'|'invert'`.
- source: lemo-opuscar `styles/archive-lighttable/demo/film.js`, lens branch of `main()` (MIT).
- value: the "look closer" beat for any evidence/explainer: a contract clause, a product detail, a screenshot, a map; a physical zoom that isn't a generic scale.

#### `negative-develop-reveal` — NEW
- look: a photo shown as warm amber glass negative; a circular develop front with a thin orange edge spreads from a point and turns it positive.
- params: front feather 0.14 R, edge Gaussian σ 0.022, edge colour (1, .62, .36) × 0.22; 0.8 s ease-in-out; negative T formula above.
- build: fragment shader on an image (`dev` radius uniform), or SVG: `feColorMatrix` invert + amber matrix for the negative, radial-gradient `<mask>` for the front, blurred stroked circle for the edge. Props: `src`, `origin`, `tint`, `edgeColor`, `mode: 'lens'|'fullframe'`.
- source: same file, `negative()` + lens `front` (MIT).
- value: before/after reveal for archives, X-ray → product, "the real picture" moment; also a candidate transition (`develop`).

#### `line-light-up` — NEW
- look: on a backlit document one line of type brightens left-to-right while the rest dims to ~62 %; an underline draws under it; a number gets ringed and lifts into a dark reading card with label and source.
- params: band feather 30/40 px; lit ink = tex^1.6 × 1.18; underline 0.3–0.6 s; ring draw 0.45 s ease-out; card plate rgba(14,15,17,.74), radius 3 px.
- build: image + SVG: a dim layer (opacity .62) with a sweeping rect `<mask>`; contrast via `feComponentTransfer` gamma inside the mask; ring = dashoffset circle; card = HTML. Props: `src`, `lines:[{box:[x0,y0,x1,y1], at}]`, `ring:{x,y,r,at}`, `card:{label,value,source}`, `accent`.
- source: `film.js` `band()`, `paper()`, `annot()` (MIT).
- value: quoting a source document on screen (contracts, receipts, patents, clippings) — strong for documentary/news agents.

#### `photo-depth-dive` — EXTENDS `ken-burns` (new props: `depth:'groundPlane'`, `horizonY`, `subjects:[{src}]`, `dolly`, `shift`)
- look: a still photo gains 2.5D depth: the ground swells under a dolly, cut-out upright subjects drift forward against the horizon.
- params: dolly 0.55, lateral shift (260, −140) px, subject drift 125 px; nearness linear from horizon to bottom row.
- build: per-pixel inverse map in a shader, or cheaper: slice the photo below the horizon into N strips each scaled by `1 + dolly·n`, plus subject layers.
- source: `film.js` `parallax()`, `int2s()`; `tools/prep.py` (MIT).
- value: makes any archival/hero photo feel like a place without generative video.

#### `ground-plane-ruler` — NEW
- look: a measuring tape laid on the ground of a photograph in true perspective, ticks crowding toward the horizon, a counter landing on the measured figure.
- params: y = horizon + K/D; length D0·(Dend/D0)^t; a tick per 100 units; counter ease-in-out; labels at 100/200/400.
- build: SVG polyline computed per frame from horizon + K + start/end points; reuse `number-counter` for the reading. Props: `horizonY`, `start`, `end`, `K`, `value`, `unit`, `tickEvery`.
- source: `film.js` `measure()` (MIT).
- value: distances / heights / spans on real photos (sports, architecture, travel).

#### `record-compare-strike` — EXTENDS `split-compare` (new props: `cards:[{crop, value, source}]`, `strikeIndex`, `holdFrames`, `verdict`)
- look: two caption cards, each with a crop of its source and a big mono value, held still ~2.7 s; then one value is struck through in the signal colour and a verdict ("−2 s") lands.
- params: hold ≥ letters/15 + 1.5 s; strike 3 px over 0.3 s; verdict after a beat of silence.
- build: two HTML cards + SVG line with dashoffset.
- source: `film.js` `compare()` (MIT).
- value: fact-checks, spec vs delivery, claim vs reality.


## 2. `art-deco` — Art Deco (Graphic & Type, *Midnight at the Starlight Hotel*, 58.4 s)

### style `art-deco` — Art Deco
- **Essence:** a 1930s Cassandre poster that moves: engraved gold keylines on warm lacquer black, hard-edged airbrushed volumes, everything organised on one sacred vertical axis. Transitions open/close along that axis (door leaves), light arrives as bulbs switching on one by one.
- **Palette:**
  - ground warm black `#0d0b09` (d), lacquer `#060504` (d); measured title frame `#050403` 30 %, `#130f08` 29 %, `#1f190d` 16 % (m) — never neutral black
  - night sky `#0a0e16` → horizon emerald `#10231f` (d); measured `#0b0f10` (m)
  - gold ramp: shadow `#6F5220`, base `#C9A24B`, light `#F3D98B`, specular `#FFF4D2` (d); measured gold glow area `#886830`, `#a17c3c`, `#b98e44`, `#d3a353`, `#f0c664` (m, sign frame)
  - hero accent burgundy `#8E1B2E` (d; light `#c23a4e`, dark `#4a0c17`); measured `#7f1c2a` / `#a63241` (m, the only large saturated area)
  - jewel secondary emerald `#1D6B57` (d)
  - ivory `#F2E8D5` (d) for paper, gloves, type; skin `#eebd92` (d)
  - bulb `#ffe6a3`, bulb core `#fffaf0`, glow rgb(255,196,92) (d)
- **Texture / print / post-process (Canvas2D):**
  - *Banded gold* = linear gradient with 7 stops around a moving `sheen` s: 0 → shadow, s−.30 → base, s−.08 → light, s → specular, s+.10 → base, s+.32 → shadow, 1 → base. Animate s −0.2 → 1.2 for a light sweep.
  - *gline (engraved keyline)*: three strokes on the same path — (1) dark underline width w+1.6 at 85 % alpha in shadow gold, (2) the gold gradient at width w (default 2.4 px), (3) a hairline highlight at 0.28 w in rgba(255,246,214,.55). Optional glow = canvas shadowBlur 14·glow + 2w; optional `double` = two mitred parallel offsets at ±gap, width 0.6 w.
  - *airbrush fill*: hard path filled with a directional linear gradient (light 38 % white mix → base at 0.42 → dark 62 % black mix) along the light direction (default upper-left, −2.3 rad); optional gold rim = stroke clipped to the shape, translated 1.6·rim against the light.
  - Mode-7 floor: for each screen row below the horizon, solve the ground depth `z = camY·f/(row − horizonRow)` and draw one 1-px row of the floor texture stretched between the projected left/right walls; then depth darkening gradient (.55 → .15 → .35) and warm reflection pools.
  - Light film grain 3 at mux. No black cartoon outlines.
- **Typography (all OFL Google Fonts):** Limelight (titles, ~11 % H caps in the gold title bar), Poiret One (numbers, sign skeletons, plaques), Josefin Sans SemiBold (subtitles ~40–42 px ≈ 3.8 % H; tracked caps subtitles ≈ 3 % H with +0.3 em tracking), Italiana (numerals, year badge). Subtitle card = ~88 % black stepped-end bar with double gold keyline that unfolds from centre, optional speaker icon.
- **Motion rules:** characters on twos (12 fps), camera / light / bulbs / gold draw-on / sheen on ones (24 fps). Everything unfolds from the centre: point → hairline → bars open symmetrically → text rises → wings + sparkle. Draw-on speed follows the musical phrase and lands on the hit. Bulbs: ignition overshoot 1.6× decaying over 0.18 s, then optional 16th-note chase. Mechanical ease-in-out with a small settle; escalation in threes. Transitions = symmetric door split, revolving-door wipe, leaves sliding shut, shape match-cuts. Never dissolve/slide.
- **Signature moves:** `deco-door-split`, `revolving-door-wipe`, `bulb-marquee-sign`, `gold-sheen-sweep`, `deco-title-bar`, `deco-sunburst-arch`, `kaleido-overhead`, `floor-dial-indicator`, `mode7-floor-perspective`.
- **Do:** one saturated accent for the protagonist; expand all hex to 6 digits; lift the background wedges so a gold point on black doesn't read as a black frame; characters ~7 heads tall, faceted planes.
- **Don't:** gold-foil slideshow, Art Nouveau curves, flat vector without airbrush, door leaves closing over a blank "interior" (close them over the live shot).
- **Source:** lemo-opuscar `styles/art-deco/` (MIT code, CC BY 4.0 docs) — `demo/engine/deco.js`, `engine/type.js`, `engine/bulbs.js`, `engine/cam.js`, `demo/film.js` (transitions), `demo/scenes/lobby.js` (mode-7 floor).
- **Port note (MIT):**
  - *Text → bulb sign:* rasterise the text in Poiret One, Zhang–Suen thin to a 1-px skeleton, trace chains using the **crossing number** (count separate neighbour runs around a pixel: 1 = end, 2 = line, ≥3 = junction; staircase pixels count as lines), weld chain ends within ~14 px, smooth (window 3), resample at equal arc spacing (`spacing` 20 px) → bulb centres. Cache per text.
  - *Bulb render:* dark socket ring (r·1.28) + gold rim if lit; unlit = dark glass radial gradient with a small specular dot; lit = additive radial halo radius `r·(3.2 + 1.6·max(0, v−1))` (0.55 → 0.16 → 0 alpha) plus a core gradient white → bulb → amber. Letter-level bloom: additive radial gradient at 0.22·avg-lit. Channel letters behind: wide gold stroke, then enamel stroke that warms toward `#5a2a14` as the letter lights.
  - *litSequence:* letter i on at T[i]; v = 1 + 0.6·(1 − dt/0.18) during the flash; after `chaseFrom`, bulbs with phase `(gi − (t−t0)·14) mod 5 < 1.5` go to 1.25, others to 0.65.
  - *Door split:* left/right halves of the outgoing frame are scaled horizontally by (1 − e) about their outer hinges (e = ease-in-out of progress from 0.12), a black gradient on the swinging leaf toward the seam (alpha 0.55·e), a glowing gold line at each leaf edge, plus a warm seam glow during the first 35 %.
  - *Pinhole camera:* yaw → pitch → roll on a point, `u = x·f/z`, `v = −y·f/z`; `scaleAt = f/z` for sprite sizes; `cardTransform` maps a flat card onto 3 projected corners with an affine (good for small letters/doors).

### Techniques

#### `deco-door-split` — NEW (transition)
- look: the outgoing frame splits on the centre seam into two door leaves hinged at the outer edges that swing open (foreshortened), revealing the next scene; gold glowing edges and a warm seam flash.
- params: duration ~0.8–1.2 s; ease-in-out starting at 12 % of progress; leaf shadow 0.55 black; seam glow radius 700 px fades in the first 35 %; edge keyline 3 px glow .8.
- build: add to `src/transitions.tsx` as `door` (variants `split` swing-open, `close` = two bronze leaves sliding in over the live shot for an ending). Render the outgoing scene twice clipped to halves with `transform: scaleX()` about hinge, or one copy with two CSS clip-paths. Props: `edgeColor`, `seamGlow`, `variant`.
- source: `styles/art-deco/demo/film.js` `splitOpen()` (MIT).
- value: a premium "threshold" transition for launches, chapter openings, hotel/event/luxury brands.

#### `revolving-door-wipe` — NEW (transition)
- look: a translucent glass panel with gold mullions sweeps right-to-left; the new scene is revealed behind its leading edge; a second fainter wing follows.
- params: panel width 220 px (11 % W); glass gradient alpha .05 → .28 → .05; travel x 2100 → −180 with ease-in-out; second wing 70 % alpha.
- build: `transitions.tsx` variant `revolve`: clip new scene to `x < edge`, draw panel div with linear-gradient + borders. Props: `glassTint`, `mullionColor`, `wings`.
- source: `film.js` `revolve()` (MIT).
- value: elegant lateral wipe for luxury/hospitality/retail.

#### `bulb-marquee-sign` — NEW (EXTENDS-adjacent to `neon-sign` but a different medium)
- look: any word becomes a theatre-marquee of evenly spaced warm bulbs on gold channel letters; letters ignite one per beat with a flash overshoot, then a chase runs across the sign.
- params: bulb spacing 20 px at 260 px font, bulb r = 0.3·spacing; flash 1.6× → 1 in 0.18 s; chase speed 14 bulbs/s, period 5, dim .35.
- build: precompute skeleton bulbs at build time (offline script: canvas raster + Zhang–Suen + crossing-number tracing) → JSON of bulb centres per letter, or at runtime in a `useMemo` with an OffscreenCanvas; render as SVG circles with radial gradients and `mix-blend-mode: screen` halos. Props: `text`, `font`, `litTimes[]` or `litPerFrames`, `chaseFrom`, `bulbColor`, `channelColor`, `background`.
- source: `styles/art-deco/demo/engine/bulbs.js` (MIT).
- value: counted reveals (countdown, launch name, award winner), Vegas/theatre/premiere titles; strong text motion an agent can retext.

#### `gold-sheen-sweep` — EXTENDS `blur-in-title` / new text-kit primitive (new props: `material:'gold'`, `sheenAt`)
- look: gold type and engraved keylines draw on, then a hot specular band slides across them on a hit.
- params: 7-stop banded gradient, sheen −0.2 → 1.2 over ~0.6 s; keyline = dark under-stroke + gradient + hairline highlight.
- build: SVG `linearGradient` with animated stop offsets applied as fill/stroke; reusable `GoldLine` / `GoldText` components in `text-kit`. Props: `gold:[shadow,base,light,spec]`, `sheen`, `width`, `double`.
- source: `engine/deco.js` `goldGrad`, `gline` (MIT).
- value: luxury, awards, anniversaries, premium product titles; the most reusable piece of this style.

#### `deco-title-bar` — NEW
- look: a stepped-end lacquer title bar with double gold keyline unfolds symmetrically from a centre point over a stepped arch + sunburst; subtitle tracked caps; diamond year badge with rays below; wings with speed lines either side.
- params: unfold order point → hairline → bars → text rise → wings/sparkle, ~1.2 s total; sunburst 72 rays alternating wedges; arch steps 3–4.
- build: SVG composition with `part` (0–1 draw-on via dashoffset) per element; Props: `title`, `subtitle`, `badge`, `rays`, `steps`, `accent`.
- source: `engine/type.js` `titleBar`, `yearBadge`; `engine/deco.js` `sunburst`, `archFrame` (MIT).
- value: opener/end card for events, galas, 1920s themes, NYE countdowns.

#### `mode7-floor-perspective` — NEW (world-kit primitive)
- look: a patterned marble floor rendered in true one-point perspective that slides/dollies with the camera, with depth darkening and mirrored glow reflections.
- params: per-row depth z = camY·f/(row − horizon); one texture row per screen row; darkening .55/.15/.35.
- build: canvas in Remotion (`<canvas>` + `useCurrentFrame`) or three.js plane — canvas version is cheap and deterministic. Props: `texture`, `camY`, `f`, `dolly`, `tint`.
- source: `demo/scenes/lobby.js` floor block (MIT).
- value: instant lobby/stage/hallway depth for any flat-vector scene; pairs with `parallax-landscape`.

## 3. `ascii-crt` — ASCII / CRT Terminal (Graphic & Type, *TRANQUILITY.LOG*, 59.8 s)

### style `ascii-crt` — ASCII / CRT Terminal
- **Essence:** one monochrome CRT terminal: every picture (title, landscape, planet, room, subtitles) is real glyphs on a monospace grid chosen by ink density, lit by P3 amber (or P1 green) phosphor on curved dark glass. The only camera is the *font size of the grid*. Cold, patient, typed; one warm (or cold) second colour once.
- **Palette:**
  - unlit glass `#090604` (d); measured screen blacks `#060503`–`#080604` 40–50 %, `#160f06`, `#281906` (m) — warm near-black, never neutral
  - phosphor ramp (d): dim `#FF6605` → mid `#FFB000` → overexposed `#FFEBB8`; measured in-frame `#3b2508`, `#533509`, `#734c0d`, `#986c13`, `#cdab24`, bright title `#fbf138` (m — bloom pushes the title toward yellow-white)
  - second colour, used once: ice blue-white `#BFE4FF` / `#B8E0FF` (d); measured Earth glyphs `#525f69`, `#394046`, `#212528` (m, dim rows) up to near-white
  - bezel `rgb(.018,.015,.013)` ≈ `#050403` with phosphor glow on its inner edge (d)
- **Texture / post-process:**
  - Glyph atlas: VT323 rendered at 160 px into a white atlas (cells 64×128, 4 px padding), each glyph **filled + stroked 2.2 px round-join** (electron-beam spread); tinted copies in pure red (phosphor channel) and pure green (second-colour channel) and black (for inverse-video knockouts). Draw with `drawImage` scaled to any cell width → zoom stays sharp.
  - Scene canvas is additive (`lighter`) on opaque black; **R channel = phosphor intensity, G = second colour**, B = flag; the CRT shader colours them.
  - CRT shader (WebGL2): barrel `x *= 1 + c·y²·0.9; y *= 1 + 1.25c·x²` with c = 0.045; horizontal beam smear (0.6 centre + 0.2 each side at ±0.8 px); phosphor map `mix(lo, mid, smoothstep(0, .55, a))·a + hi·smoothstep(.62, 1.25, a)·.55`; 4-level bloom (strength .55) + halo .22; 3 px scanlines `1 − 0.3·ph·(1 − 0.55·L)` (gaps narrow in bright areas); glass base colour × vignette `1 − corner(.35|d|² + .9x²y²)`; rounded-rect screen SDF (r 0.09); noise .025 scaled by (0.5+L); 1.2 % HV flicker per frame; faint top-left reflection (3 %); bezel picks up 22 % of the bloom near the edge. **No RGB grille, no chroma bleed** (monochrome tube).
  - Afterglow: analytic `exp(−(t − tOff)/0.12)`; moving glyphs add one trail sample at t − 35 ms × 0.3. Landing flash 1.9× decaying with τ 0.12 s.
  - No grain at mux; the noise lives in the picture.
- **Typography:** VT323 only (Google Fonts, OFL), cell 0.4 em × 0.8 em (1:2). Grids: title 20 cols (cell 84 px), terminal 80 cols (21 px → glyph height 3.9 % H), picture 240 cols (8 px), push-in up to a 450 px cell holding a 40-col sub-grid. Attributes dim/normal/bold = 0.42 / 0.70 / 1.0 brightness; inverse video. Subtitles = LOG strip at bottom: dim dashed separator, inverse `LOG` tag, `> ` prompt, uppercase line at 45 px (4.2 % H) typed word-by-word on voice timestamps.
- **Motion rules:** characters never leave the grid except in a declared transformation. Only three continuous motions: grid scale (camera), CRT physics, transformation particles. Typing is performance: machine 10–40 ms/char (boot 12 ms, commands 38 ms), dramatic lines on note values (120–150 ms = 16ths at 100 BPM), human typing hand-timed with bursts. Counters flip discretely, fast then slowing. Cuts = clear screen / redraw / scroll / power on-off, never a crossfade.
- **Signature moves:** `ascii-image-grid`, `ascii-grid-zoom`, `glyph-fractal-push`, `letters-become-image`, `crt-power-on-off`, `terminal-log-captions`, `phosphor-crt-post`.
- **Do:** silhouettes with negative space (dark = sparse dim glyphs, shadow side `.` only); far = sparser/darker, near = denser/brighter with a thin bright rim between planes; local contrast `m + 0.9·(m − mean)`; threshold cells below 0.05 to blank; gamma ≈ 1.25.
- **Don't:** an image with an "ASCII filter"; green matrix rain; free pixels/sprites; vector HUD lines; RGB grille; particles spawned from glyph centres (they stack into bars); stroked atlas glyphs for masks (closed counters — use a thin fill-only bitmap).
- **Source:** lemo-opuscar `styles/ascii-crt/` (MIT code, CC BY 4.0 docs) — `demo/term.js` (atlas, ramp, dither, image→cells), `demo/crt.js` (mono phosphor CRT), `demo/art.js` (earth/ground negatives), `demo/main.js` (letter fall, fractal push), `core/post/crt.js` (colour VHS/CRT parent).
- **Port note (MIT):**
  - *Density ramp:* measure each glyph's alpha coverage in the atlas; levels = coverage/maxCoverage × attribute (0.42/0.7/1.0) for every glyph in the allowed set; sort; drop levels within 0.018 of the previous (keep the bolder attribute). → ~20 levels. Restricting the set to the letters of a sentence makes "a picture made only of these words".
  - *Pick with dither:* `x = L·n + (bayer4x4[j&3][i&3]·0.5 + (hash(i,j) − 0.5)·0.5)·dither·1.6`, round, clamp → level. Dither 0.6–0.7.
  - *Image → cells:* render the subject into an offscreen "negative" exactly `cols·sx × rows·sy` (sx×sy = 3×6 samples/cell), average R/G/B per cell; cell centre is `(j + .5)·2cw` (cells are 2 cw tall).
  - *Letter-fall particles:* each target cell spawns from a random point inside a matching source glyph, starts at 18 px, shrinks to grid size, fades in over 0.2 s; x eases, `y = u·(0.6 + 0.4u)`; land bottom-to-top; flash 1.9× τ 0.12 s; source letters dim as they're consumed.
  - *Power on/off:* on — `sx = smoothstep(0,.35,p)`, `sy = max(.004, smoothstep(.35,1,p))`, brightness boost `(1−sy)³·1.4` and a hot centre line; off — `sy` collapses over 0–0.45, then `sx` over 0.45–0.85 to a dot; expo decays `exp(−t/0.18)` after off.
  - *Fractal push:* hold where the whole glyph reads (1 s), then push until the inner sub-grid text reads (cell 450 px, sub-text ≈ 28 px); text inside the glyph mask 100 %, outside 3–6 %, neighbour glyphs 20 %.

### Techniques

#### `ascii-image-grid` — NEW
- look: any image or procedural scene rebuilt as monospace glyphs on a strict grid; brightness → glyph ink density and dim/normal/bold attribute; dark areas stay empty.
- params: 80–240 columns; 3×6 samples per cell; ~20 ramp levels; Bayer 4×4 + hash dither 0.6–0.7; blank threshold 0.05; local contrast 0.9.
- build: offline/`useMemo` per image: downsample to cols×rows×(3×6) via OffscreenCanvas, compute cells; render with an atlas canvas (`drawImage` per cell) — SVG `<text>` is too slow above ~3k cells. Props: `src`, `cols`, `charset` (e.g. a sentence), `font`, `phosphor:'amber'|'green'|'white'|hex`, `secondColor`, `secondMask`, `reveal: 'rows'|'random'|'none'`.
- source: `styles/ascii-crt/demo/term.js` `makeRamp`, `pick`, `cellsFromImage` (MIT).
- value: logo/product/photo in a terminal aesthetic for dev tools, hacker, retro-computing, data brands. Distinct from `dot-matrix` (dots, not glyphs) and `pixel-dither`.

#### `letters-become-image` — NEW
- look: a typed sentence breaks apart; its letters fly as small particles into cells of a picture built only from those letters; ground lands bottom-to-top, the subject rises from behind the horizon; landing flashes.
- params: particle start 18 px → cell size, fade-in 0.2 s, path y = u(0.6 + 0.4u), flash 1.9× τ 0.12 s; total ~3–4 s; 1.5 s hold before the split with cursor blinks.
- build: precompute target cells (from `ascii-image-grid` with charset = sentence letters); each cell gets a seeded source glyph index, start offset inside that glyph, delay by row; per-frame position from closed-form easing. Props: `sentence`, `src`, `cols`, `durationInFrames`, `order:'bottomUp'|'random'`.
- source: `demo/main.js` letter-fall block (MIT).
- value: manifesto → crowd, product name → product, recipe → dish; a signature text-to-image climax.

#### `glyph-fractal-push` — NEW
- look: the camera pushes into one big glyph until you see it's made of smaller lines of text (logs, names, headlines); outside the glyph the text is barely visible.
- params: hold 1 s at full-glyph framing; cell grows to ≈ 450 px with a 40-col sub-grid; inside 100 %, outside 3–6 %, neighbours 20 %.
- build: sample the glyph's thin (fill-only) alpha bitmap per sub-cell as a mask; zoom is the grid cell width on an exponential curve. Props: `glyph`, `innerText[]`, `zoomTo`, `holdFrames`.
- source: `demo/main.js` fractal section, `term.js` `thin` bitmaps (MIT).
- value: "a company made of its people", "a year made of headlines" — scale reveal for text-heavy stories. Related but distinct from `powers-of-ten` (drawings, not text).

#### `crt-power-on-off` — NEW (also a transition candidate `crt`)
- look: black → a bright dot stretches into a horizontal line → opens vertically into the picture (on); reverse collapse to a line then a dot with afterglow (off).
- params: on: sx over 0–35 %, sy over 35–100 %, boost (1−sy)³·1.4; off: sy over 0–45 %, sx over 45–85 %; total 0.5–0.8 s; afterglow τ 0.18 s.
- build: CSS `transform: scale(sx, sy)` on the scene + a blurred white line div with `mix-blend-mode: screen`; or shader. Props: `mode:'on'|'off'`, `phosphorTint`, `durationInFrames`. Add to `transitions.tsx` as `crt`.
- source: `demo/crt.js`, `core/post/crt.js` (MIT).
- value: openers/endings for tech, retro, monitors, "the machine wakes up".

#### `phosphor-crt-post` — EXTENDS `film-look` (new props: `look:'crtMono'`, `phosphor`, `curvature`, `scanlines`, `beamSmear`, `afterglow`) — or a new `crt-screen` overlay
- look: monochrome phosphor colouring, barrel curvature, rounded screen mask with bezel glow, scanlines that thin in bright areas, bloom + halo, HV flicker, faint glass reflection.
- params: curv .045, scan .30 (3 px), bloom .55, halo .22, beam .8 px, noise .025, flicker 1.2 %, corner .55, reflection 3 %.
- build: one full-screen WebGL pass (three.js `ShaderMaterial` over a texture of the rendered layer). Also note the colour VHS variant in `core/post/crt.js`: YCbCr split with chroma averaged over ±bleed/2 px horizontally and red shifted 2 px right, 3-px RGB grille, tape tracking tear + rolling noise band + head-switch bar at bottom 5 %.
- source: `styles/ascii-crt/demo/crt.js`, `core/post/crt.js` (MIT).
- value: instant retro-screen finish over any motion (pairs with `typewriter-code`, `hud-chrome`).

#### `terminal-log-captions` — EXTENDS `kinetic-captions` (new props: `variant:'terminalLog'`, `tag`, `prompt`, `idleText`)
- look: captions as terminal output in a reserved bottom strip: dim dashed rule, inverse-video `LOG` tag, `> ` prompt, uppercase line typed word-by-word with the voice, block cursor; idle shows progress bars.
- params: 45 px VT323 (4.2 % H); hold 1.4 s after complete; ≥ max(1.8 s, speech + 0.6 s).
- build: HTML strip in the same CRT post layer. Props: `words:[{text,start}]`, `tag`, `phosphor`.
- source: `demo/main.js` SUBS + LOG strip (MIT).
- value: on-brand captions for any tech/terminal film.

## 4. `backrooms` — Liminal Found Footage (Cinema & Eras, *Night Shift Orientation*, 59.7 s)

### style `backrooms` — Liminal Found Footage
- **Essence:** one continuous first-person 1990s camcorder tape (4:3 VHS, pillarboxed) walking an empty, endless, familiar-but-wrong interior lit by humming fluorescent panels. Dread from emptiness, repetition, bureaucratic printed rules and the camera's own machinery failing (focus hunt, tracking tears, OSD clock jumps). No monster, no score.
- **Palette:**
  - pillarbox black `#000000` (m, 26 % = side bars)
  - dominant sickly hue — wallpaper `#d5bd66` (d) reads after VHS pass as `#948130` / `#857329` / `#7a6523` / `#69591d` (m) — the tape grade pushes it darker and greener
  - trim/baseboard `#4d3d26` (d) ≈ `#463711` (m)
  - carpet `#8c763c` (d), damp patches ×0.6
  - ceiling tile `#d9d3b8`, grid `#e6e1cf`, troffer `#fbfaf0` emissive ×5 (d); measured ceiling/haze `#c0b988`, `#69674d`, `#5a543f` (m)
  - exactly one signal colour: EXIT red `#ff2a1a` at emissive ×9 so it blooms (d)
  - OSD white `#ffffff` with black outline; REC dot red (d/m)
  - alternative material palettes (d): pool tile `#9fc7c0` / grout `#e6ece6` / water `#5e8f96`; school `#b9c49a` / lockers `#6f7f66` / lino `#a89a7d`
- **Texture / post-process:**
  - three.js scene rendered at **720×540**, upscaled by the VHS pass; post chain GTAO + DOF + bloom (core/three/post.js) → VHS ShaderPass → OSD/captions on top.
  - *Many-light flat lighting:* every troffer's colour/intensity in a 128×128 float DataTexture; each fragment sums the nearest 5×5 panels, `emitterCos × Lambert / (d² + 0.3)` + a bounce term; no shadows. Variation ±8 % warm/cool, +0–7 % green, 3.5 % dead, 2.5 % flickering.
  - *Fog follows light:* fog colour × (local bounce / average); scene background = fog × 0.15 so corridors fade to dark.
  - *VHS camcorder pass (order):* 4:3 frame → per-line time-base jitter (hash per line 0.3 px + low-freq wobble, total ≤ 0.25 px so text doesn't skew) → head-switching band on the bottom 8 lines → tracking tear (rolling noise band + big line offsets) → lens barrel 0.07 (aspect-corrected) on the image only, not the OSD → luma bandwidth: narrow Gaussian σ ≈ 1.25 px @720 vs wide, `Y += 0.9·(Y − Ywide)` edge-ringing halo → chroma: YIQ, IQ averaged over 11 taps spaced 0.4·chromaW (≈ ±10 px) with Gaussian weights and shifted 1.6 px right → highlight smear to the right 0.35 → AWB tint drift + exposure + AGC noise (streaky, stronger in darks) → 0–2 white dropout lines per frame fading along x → black lift 0.045 + soft highlight clip → vignette 0.42. Noise is stepped at 30 fps (tape rate) under a 24 fps render. **No scanlines, no RGB mask.**
  - Decay kept to single-digit %: tide-marks, nicotine band under the ceiling, ~7 % peeling seams, ~4 % yellowed tiles, <1 % missing tiles.
- **Typography:** OSD = hand-made 5×7 bitmap font with 1 px black outline (Google equivalents: **Silkscreen** or **VT323** with a text-stroke): `● REC` top-left, battery top-right, `PM 11:58` / `SEP.27.1996` bottom-right at ≈ 5.5 % H; title-generator text = same font ×2 (≈ 11 % H). Notices: IBM Plex Sans Condensed headers + IBM Plex Sans 600 numbered rules on yellowed laser-print paper. Captions: CEA-608 style — IBM Plex Mono 600, 42 px (3.9 % H), white on a solid black box per row, ≤ 32 chars, inside the 4:3 area, untouched by tape noise; `[PA]`, italics for the operator, SDH brackets `[LIGHTS FLICKER]`, `[SILENCE]`.
- **Motion rules:** one continuous handheld take; cuts only as tape events (roll-in, tracking tear, REC off). Handheld = gait (0.72 m stride, bob 3 cm, sway 1.8 cm, roll ±0.8°) + breathing 0.27 Hz + tremor at 1 / 3.5 / 9 Hz with amplitude driven by a **fear curve**; all shake frozen during a held breath. Look-down: pitch ≈ −1.2 rad, camera pushed 0.2 m forward → only shoe toes. Autofocus = focus distance animated with overshoot (blur → lock → slip → lock), blur from pulling focus near; zoom FOV 52° → 27° with aperture ×5. Flicker = three 0.1 s blackouts, AE catches up with ~0.45 s lag and gain noise pumps. Self-moving things are slow (door 1.3 s eased). Timeline compressed through one piecewise-linear warp `W()`.
- **Signature moves:** `vhs-camcorder-look`, `camcorder-osd`, `autofocus-hunt`, `tracking-tear-timejump`, `handheld-fear-rig`, `fluorescent-flicker-ae`, `liminal-corridor-3d`, `cea608-captions`.
- **Do:** partitions with gaps so far areas fall dark; dead-light zones ±5 m for a silhouette ("a hole in the light"); lower the camera parallel to a notice for close reads; hold rules ≥ 3–4 s uncovered; drive the signal red emissive ×9.
- **Don't:** monster close-ups, jump scares, stings; scanlines/RGB mask (that's CRT, not tape); a ruin (clean is the style); primitive-built figures; the word "Backrooms", wiki levels, community entity names.
- **Source:** lemo-opuscar `styles/backrooms/` (MIT code, CC BY 4.0 docs) — `demo/vhs.js`, `demo/osd.js`, `demo/world.js` (light DataTexture, fog), `demo/tex.js`, `demo/main.js` (handheld rig), `demo/story.js` (fear/focus curves, time warp), `demo/subs.js`, `demo/thing2d.js`.
- **Port note (MIT):**
  - *VHS pass* — portable as one fragment shader (order above). Key formulas: lens `p *= 1 + barrel·r²` with r² computed on aspect-corrected (1.333, 1) coords and `p *= 1 − 0.3·barrel` to keep the frame filled; edge ringing `Y + sharp·(Ynarrow − Ywide)`; chroma blur in YIQ with weights `exp(−i²/12)` for i = −5..5 and offset `(i·0.4·chromaW − shift)` px; dropouts = up to 3 hashed lines per frame, brightness fading linearly along their length.
  - *Handheld* — sum of value-noise channels per axis: pitch = n(1.1 Hz)·0.016 + n(3.7 Hz)·0.005·(1 + 2·fear) + n(9.5 Hz)·0.0022·fear + breath·0.006; yaw similar with gait sine; roll = n(0.6 Hz)·0.035 + gait·0.014 + n(7 Hz)·0.003·fear + 0.012 bias; everything × hold (0 when breath held). Gait phase from distance/stride, so standing still kills the bob.
  - *Fog-follows-light* and *many-light DataTexture* sum — straightforward to port to a three.js `onBeforeCompile` patch.

### Techniques

#### `vhs-camcorder-look` — EXTENDS `glitch-image` (new props: `look:'vhsCamcorder'`, `aspect:'4:3'`, `jitter`, `chromaShift`, `edgeRing`, `agcNoise`, `dropouts`, `tapeFps`, `trackingTearAt[]`) — could also be a sibling of `film-look`
- look: soft 1990s consumer tape: smeared chroma shifted right, white edge-enhancement halos, lifted blacks, streaky dark noise, wobbly lines, a head-switching band at the bottom, occasional white dropouts, pillarboxed 4:3.
- params: barrel 0.07, vignette 0.42, luma σ 1.25 px @720, sharp 0.9, chroma ±10 px shift 1.6 px, smear 0.35, black lift 0.045, jitter 0.3 px (≤ 0.25 px low-freq), noise at 30 fps.
- build: three.js full-screen pass over a texture of the child composition (or an SVG approximation: `feGaussianBlur` + `feColorMatrix` YIQ split + `feOffset` on chroma). Render the subject at 720×540 and upscale for authenticity. Props above + `osd` slot that bypasses distortion.
- source: `styles/backrooms/demo/vhs.js` (MIT).
- value: found-footage, nostalgia, "home video" memories, 90s brand throwbacks — very high demand on social.

#### `camcorder-osd` — EXTENDS `hud-chrome` (new props: `variant:'camcorder'`, `rec`, `battery`, `clock`, `date`, `titleText`)
- look: chunky white bitmap OSD with black outline: blinking `● REC`, battery icon, `PM 11:58` + `SEP.27.1996`; optional title-generator caption over the first shot; clock can jump after a tear.
- params: font ≈ 5.5 % H, title ×2; REC blink 1 Hz; margins ≈ 10 % W of the 4:3 area.
- build: SVG/HTML overlay, Silkscreen font with `paint-order: stroke` 3 px black. Transparent overlay. Props: `startTime`, `date`, `battery` (0–3 bars, blink when 0), `jumps:[{at, toTime}]`.
- source: `demo/osd.js` (MIT).
- value: any home-video framing; time-jump storytelling with the clock as evidence.

#### `autofocus-hunt` — NEW
- look: the image hunts focus: blur → snaps sharp → slips → locks, with a zoom-in narrowing the view; something is visible only in the sharp window.
- params: focus distance keyed with overshoot; blur radius ∝ |1/focus − 1/subject|; zoom FOV 52° → 27°; lock window ≈ 0.5 s.
- build: for 2D images: CSS/SVG blur radius from a keyed curve (spring overshoot) + scale; for three.js: the physical DOF pass (core/three/post.js CoC = aperture·(1/focus − 1/z)). Props: `src`, `keys:[{at, sharp:0..1}]`, `zoom`, `revealLayer` (only shown when sharp).
- source: `demo/story.js` focus curve + `core/three/post.js` (MIT).
- value: suspense reveal, "did you see that?", product reveal with a lens feel.

#### `tracking-tear-timejump` — NEW (transition `tracking`)
- look: a rolling noise band tears the picture horizontally, lines offset wildly, then the *identical* framing returns but something (OSD clock, a light, a detail) has changed.
- params: band height ≈ 7 % H, line offsets up to 3 % W inside the band, 0.3–0.6 s; vertical roll during the tear.
- build: transition presentation in `transitions.tsx`: displace rows of the outgoing scene with hashed offsets weighted by a Gaussian band moving down; swap to the new scene mid-band. Props: `bandSpeed`, `intensity`, `roll`.
- source: `demo/vhs.js` track/roll uniforms; `core/post/crt.js` `track` (MIT).
- value: time-skip/“later that night” cuts with a diegetic excuse.

#### `handheld-fear-rig` — EXTENDS `ken-burns` (new props: `handheld:{gait, breathHz, fear:[keys], holdBreath:[ranges]}`)
- look: camera moves like a person holding a camcorder: gait bob and sway, breathing, layered tremor that grows with fear, a frozen moment when breath is held.
- params: bob 3 cm-equivalent (≈ 0.6 % H), sway 1.8 cm, roll ±0.8°, breath 0.27 Hz, tremor 1 / 3.5 / 9 Hz.
- build: deterministic value-noise per axis (see port note), applied as CSS transform to any scene/image or as three.js camera offsets.
- source: `demo/main.js` rig (MIT).
- value: makes any static or 3D scene feel filmed by a person; reusable across every "documentary" style.

#### `liminal-corridor-3d` — NEW
- look: an endless office of mustard partitions, drop-ceiling troffers receding into dark fog, flat shadowless light, a few dead/flickering panels.
- params: grid 2.4 m, walls 0.16 m, ceiling 2.7 m, tiles 0.6×1.2 m, troffer every 2.4 m; 3.5 % dead, 2.5 % flicker; fog bg ×0.15.
- build: three.js instanced boxes from a seeded layout + custom lighting via DataTexture (nearest 5×5 lights) + light-following fog; procedural canvas textures. Props: `seed`, `palette` (wallpaper/trim/carpet), `signal` (EXIT colour), `route` keyframes, `fear`.
- source: `demo/world.js`, `demo/tex.js` (MIT).
- value: liminal/uncanny backdrops for horror-lite, mystery, "corporate dread" satire; pairs with `vhs-camcorder-look` + `camcorder-osd`.

## 5. `blueprint` — Blueprint (Graphic & Type, *Patent Pending: The Cloud Catcher*, 46.7 s)

### style `blueprint` — Blueprint / Cyanotype Engineering Drawing
- **Essence:** the whole film happens on one sheet of cyanotype paper on a dark drafting table: white technical line work on uneven Prussian blue, drawn in drafting order (centre lines → outlines → detail → hatching → dimensions → balloons → labels). The designed thing is the character; dry convention, witty notes; once, one drawing symbol becomes "real".
- **Palette:**
  - paper dark `#18336B` → light `#2A58A6` (d); measured `#1d3c77` 40 %, `#1a366c` 25 %, `#214485` 17 %, `#142a57` 10 % (m) — the paper mostly sits in the lower third of the ramp
  - lines `#E7F0F9` (d); measured soft line / text tones `#6e84aa`, `#7c90b2`, `#5d75a0` (m — thin lines are averaged with the blue at JPEG scale)
  - fold-wear / bleached edges `#8ca8d1` / `#809ecc` (d, rgb .55/.66/.82 and .50/.62/.80)
  - wet stain: paper × (0.70, 0.78, 0.92) + (0, .01, .05) → deeper, more saturated blue (d)
  - drafting cloth `#0D1116` (d; shader `rgb(.052,.066,.086)`)
  - subtitle box `rgba(12,28,62,.58)` (d)
  - one stamp red `#C23B2E`, used exactly once (d)
  - alt sheets (d): sun-bleached `#3A6DA8` → `#5B8CC4`; over-exposed `#0F2350` → `#1D3F80`
- **Texture / post-process (WebGL2 compositor in *sheet* coordinates, so it stays crisp at any zoom):**
  - Paper: `m = clamp(.10 + .95(n1 − .25) + .22(n2 − .5) + .14(n3 − .5) + .18·x/W)` with n1 = fbm(p/760), n2 = fbm(x/1500, y/70) (horizontal coating streaks), n3 = fbm(p/190); colour = mix(dark, light, m). Fibres ×(0.955 + 0.075·fib) + sparse bright strands. Cross fold: Gaussian ridges with light/dark edges (±6 %) + worn-white mix along the fold where fbm(p/9) is high. Bleached irregular edges (90 px band, fbm-wobbled) and corners (260 px). Specks −18 %.
  - Buffers: **ink** canvas greyscale (white = exposed line, black = paper), **fx** canvas (R = shadow darkening, G = wetness, B = stamp ink) added with `lighter`, **overlay** for subtitles (premultiplied). Lines composite as sharp × paper-grain breakup (0.80 + 0.20·smoothstep) + two blurred halos (0.18, 0.10) → slight mipmap bleed glow.
  - Wet: blue darkens/saturates, tide-mark rim = `wet(1 − wet)·4`, lines inside go soft (blurred tap ×0.35).
  - Stamp: ink with rubber-grain holes `smoothstep(.12, .45, vn·.6 + fbm·.6)`, max 92 % coverage.
  - Light film grain 4 at mux.
- **Typography (OFL):** Architects Daughter (hand lettering: header 132 sheet units, labels, notes, subtitles 38 px ≈ 3.5 % H); B612 / B612 Bold (title-block fields, "PATENT PENDING", NOTE/n cell); Allura (signature only). Text is written on left-to-right with a glowing nib. Subtitles = drawing-note boxes (1.2 px outer + 0.8 px inner white rule, NOTE / n cell, lettered on in 0.35 s, leader tick) placed per shot in empty sky, wrap ~880 px; every subtitle also lands in the sheet's GENERAL NOTES column.
- **Motion rules:** camera + draw-on on ones (24 fps); continuous moves inside a section, hard cuts on downbeats between sections; tiny camera bumps only for paper slap/stamp. Draw-on truncated by arc length with a glowing nib; each layer starts on a beat. Exploded parts leave one every ~0.055 of progress on 8ths, return one 8th per group with a click. Gears advance one tooth (7.5°) per 8th with 0.35-beat ease-out (escapement), meshing phase computed. Machine acting: droop/sag over ~1.5 s for failure, back-ease needle overshoot for joy. Line width on screen = sheet width × zoom^0.65.
- **Signature moves:** `drafting-order-draw`, `cyanotype-sheet`, `oblique-extrude-drawing`, `exploded-view-balloons`, `live-dimension-lines`, `fig-number-rewrite`, `cyanotype-water-bloom`, `symbol-becomes-real`, `title-block-endcard`.
- **Do:** fill every solid with "paper" before stroking it (painter's occlusion); keep the main figure ≥ 960/zoom from framed sheet edges; payoff object ~⅓ frame height; explode sideways; one gradient across a union shape (not per lobe).
- **Don't:** 3D rendering or glowing wireframe orbits (that's Hologram HUD); subtitles fixed at the bottom; line weights that don't scale with zoom; a second non-blue colour.
- **Source:** lemo-opuscar `styles/blueprint/` (MIT code, CC BY 4.0 docs) — `demo/paper.js` (cyanotype compositor), `demo/draw.js` (drafting engine), `demo/sheet.js` (title block, notes, stamp, revision cloud, rain), `demo/machine.js`, `demo/film.js`.
- **Port note (MIT):**
  - *Cyanotype shader* — formulas above port 1:1 to a Remotion WebGL/three.js plane or to SVG `feTurbulence` (baseFrequency ≈ 1/760 and anisotropic 1/1500 × 1/70 for streaks) + `feColorMatrix` mapping to the two blues.
  - *Cabinet-oblique projection* — `x += d·k·cos(a)`, `y −= d·k·sin(a)`; animate k 0 → 0.5 to make a flat elevation "turn".
  - *Sweep extrusion with hidden-line removal* — stroke the outline at N = ceil(offsetPx/1.4) depth steps with 2× width in white, then fill the same N steps black; a clean half-width silhouette survives; add vertex connector lines only where stepping a vertex along the depth direction leaves the polygon (point-in-polygon test).
  - *Draw-on* — truncate a polyline at arc length u·L, push the head position to a nib list, draw nibs as small glowing dots at the end of the frame.
  - *Dash patterns* — centre `[34,7,6,7]`, hidden `[11,7]`, phantom `[30,6,5,6,5,6]` in sheet units, scaled by zoom so the pattern stays on the paper.
  - *Puffed union shading* — one radial gradient over the union of circles; crescent shadow mask = union minus union shifted up-left; fill unions as a single nonzero path.

### Techniques

#### `drafting-order-draw` — EXTENDS `line-draw-on` (new props: `layers:[{kind:'centre'|'outline'|'detail'|'hatch'|'dim'|'balloon'|'label', at}]`, `dash`, `zoomWidthExp:0.65`, `nib`, `paperFill`)
- look: an object draws itself like an engineer would: dashed centre lines first, then heavy outlines, details, 45° hatching, dimension lines, numbered balloons, hand-lettered labels — each layer on a beat, a glowing nib at every stroke head.
- params: weights 3.2 / 2.0 / 1.25 / 0.9 sheet units; hatch 45°, spacing 8–14; nib glow; stagger within layer.
- build: SVG paths with `pathLength` + dashoffset per layer; solids get a background-coloured fill before stroke; width = base × zoom^0.65 when a camera zooms. Props above + `svgPaths` input.
- source: `styles/blueprint/demo/draw.js` (MIT).
- value: product explainers, how-it-works, patents, architecture — the most reusable blueprint move.

#### `cyanotype-sheet` — EXTENDS `PaperTexture` variant `blueprint-paper` (new props: `folds`, `bleachedEdges`, `coatingStreaks`, `deskShadow`)
- look: a physical cyanotype sheet with uneven Prussian blue, horizontal coating streaks, fibres, a cross fold with worn whitening, bleached irregular edges, lying on dark cloth with a drop shadow.
- params: see shader formulas; blues `#18336B` → `#2A58A6`; desk `#0D1116`.
- build: WebGL plane (best, zoom-proof) or SVG turbulence stack. Props: `dark`, `light`, `seed`, `fold:[cols,rows]`.
- source: `demo/paper.js` `paper()` (MIT).
- value: backdrop for every blueprint/engineering motion (`wireframe-build`, `radial-blueprint`, `gears`) — instant upgrade over a flat blue.

#### `oblique-extrude-drawing` — NEW
- look: a flat line elevation "turns" into a thick oblique drawing as the depth factor animates 0 → 0.5; hidden lines vanish correctly; exploded parts can fly along the depth axis.
- params: k 0 → 0.5 over ~1–2 s ease-in-out; angle 30–45°; N steps ≈ offset/1.4 px.
- build: canvas in Remotion (sweep stroke/fill trick) or SVG (render N offset copies of the path, white stroke then background fill, back to front). Props: `paths`, `depth`, `k`, `angle`, `explode:[{part, dz, at}]`.
- source: `demo/draw.js` `S()`, `solid()` (MIT).
- value: plan → object reveals, flat-pack furniture, circuit boards, without three.js.

#### `exploded-view-balloons` — NEW
- look: a drawn assembly comes apart part by part along an axis; each part trails a leader line and numbered balloon that follows it; a parts list fills in; parts return one per beat with a click.
- params: one part every ~0.055 of progress on 8th notes, eased; return one 8th per group; camera pulls back to make room; explode sideways.
- build: SVG groups with per-part offsets from a seeded order; balloon = circle + number + leader to part anchor. Props: `parts:[{svg, dir, label, qty}]`, `explodeAt`, `returnAt`, `beatFrames`, `partsList`.
- source: `demo/machine.js`, `demo/sheet.js` parts list (MIT).
- value: product teardowns, feature lists, "what's inside" for hardware/SaaS architecture diagrams.

#### `live-dimension-lines` — EXTENDS `callout-labels` (new props: `variant:'dimension'`, `measure:[{p1,p2,offset,label|valueFn}]`)
- look: engineering dimension lines with extension lines, arrowheads and a rotated label that measures a moving part — the number changes as the part moves.
- params: extension gap/overshoot, arrow 16×4.5 units, label written on after 60 % of the draw.
- build: SVG, recomputed per frame from part positions. 
- source: `demo/draw.js` `dim()`, `arrow()`, `balloon()` (MIT).
- value: data on physical things (sizes, travel, tolerances) — product specs.

#### `cyanotype-water-bloom` — NEW
- look: water drops land on the blueprint; each blooms into a deeper, more saturated blue stain with a pale tide line; white lines inside go soft; a drop on a signature makes ink bleed.
- params: stain growth ease-out ~0.6 s; rim = wet(1 − wet)·4; colour × (0.70, 0.78, 0.92); line blur where wet.
- build: SVG: radial blobs (turbulence-displaced circles) as a mask → `feColorMatrix` darken + blur on the line layer inside the mask; rim as stroked blurred ring. Props: `drops:[{x,y,at,r}]`, `paperColor`.
- source: `demo/paper.js` wet branch (MIT).
- value: rain/flood/emotion beats on any paper-based motion.

#### `fig-number-rewrite` — NEW (small, transition-like)
- look: "FIG. 1" is struck through by hand and rewritten "FIG. 2 · EXPLODED VIEW" beside it — the chapter change happens on the sheet.
- params: strike 0.25 s, rewrite 0.35 s with nib.
- build: `handwrite-on` + SVG strike line. Props: `from`, `to`, `font`.
- source: `demo/sheet.js` / `film.js` (MIT).
- value: chapter/version markers in any drawn explainer (could also be a `chapter-header` variant).

## 6. `brick-toy` — Brick Toy (Materials & 3D, *Rocket from Spare Parts*, 54 s)

### style `brick-toy` — Brick Toy (stop-motion macro)
- **Essence:** stop-motion toy-brick world on a real desk shot with a macro lens: glossy ABS bricks with studs, clean rectangular softbox highlights, darkened seams, real household props as landscape blurred behind; characters built from bricks move in held poses on twos while the camera glides on ones.
- **Palette:**
  - brick primaries (d): red `#c91a09`, blue `#0055bf`, yellow `#f2cd37`, green `#237841`, white `#f2f2ee`, black `#1b2a34`, + orange, light/dark grey, tan, azure
  - measured red bricks `#d71e04` / `#d51e03`, highlight `#ed3f31` / `#f03d2d`, shadow `#8d1102` / `#931305` (m) — the strong clearcoat produces a 3-step red
  - measured yellow (baseplate/icon) `#eab859` (m)
  - real-world neutrals (m): studio wall `#cecdcb`, `#b5b4b3`, desk greys `#868078`, `#6f6960`, `#524f47`, darks `#333226`; daylight sky behind rocket `#c5d8eb`, `#a3b1be` (m)
  - key light `#fff4e8` (d); grade: contrast +0.26, saturation ×1.1, slightly cool so whites stay white
  - subtitle pill `rgba(18,20,26,.62)` (d)
- **Texture / render / post (three.js r170):**
  - `MeshPhysicalMaterial`: clearcoat 0.85, clearcoat roughness 0.07, specularIntensity 0.9, envMapIntensity 1.15, roughness from a procedural canvas map (18 fingerprint arc sets + 70 scratches; base ≈ 0.17–0.27, scratches to ≈ 0.65). Translucent pieces: transmission 0.92, thickness 0.8, ior 1.52, roughness 0.06. Large baseplates matte (low clearcoat) or they wash with softbox colour.
  - Geometry: unit = 1 stud pitch (8 mm); brick h 1.2, plate 0.4; rounded box bevel ≈ 0.045–0.06; studs with a thin lip; merged + cached geometries.
  - Light: warm-white directional key from upper side (shadow frustum fitted per shot) + 2–3 `RectAreaLight` softboxes (key front, cool rim behind, one over a big set) + neutral daylight studio HDRI at ≈ 0.45; soft radial contact-shadow blob (canvas gradient .55 → 0) behind hero objects.
  - Post (core/three/post.js): GTAO radius ≈ 3.5 studs scale 2.5 (mandatory — seams and stud bases), physical DOF (CoC = aperture·|1/focus − 1/z|, 96-tap golden-angle spiral gather that stops background spreading over a sharp foreground), UnrealBloom 0.2, vignette/grade pass, 2× supersampling (render 3840×2160).
  - Effects built from bricks: fire = translucent orange/yellow round plates jittered every drawing; smoke = white round bricks growing and rolling outward; no particles, no gradients.
- **Typography:** Fredoka (OFL; in core/fonts) — subtitles Fredoka 600 46 px (4.3 % H) white in a dark rounded pill 150 px above the bottom with a small yellow 2×1 brick icon; second speaker gets a red brick icon + "MISSION CONTROL" tag; title Fredoka 700 popping in on 12 fps steps with a yellow tracked sub-line (34 px). Google equivalents: Fredoka; alt Baloo 2 / Nunito Black.
- **Motion rules:** characters and bricks step at 12 fps (floor(t·12)/12); camera, focus, fire and flying vehicles on ones (24 fps) — stepping the camera reads as judder. Bricks fly in on arcs and snap with overshoot 0.35 stud → 0 in ~0.17 s (≈ 4 frames), a click per snap. Big readable held poses (V arms = pride, arms up = alarm, bowed head = sad, hop = joy); walk legs ±0.55 rad with small bob; rigid joints, no bending. Collapses = pre-simulated rigid bodies: tip about base edge, gravity 420 studs/s² (true 1225 reads too fast), restitution ≈ 0.3, friction, settle. Aperture scaled to shot size (≈ 500–700 CU, 800 medium, 400 wide); focus on a head or the brick being placed. Cuts on bars; snaps as cut points; transitions = a brick covering the lens, a whip along the desk, a pull-out to the next set.
- **Signature moves:** `brick-snap-build`, `brick-collapse-physics`, `brick-rebuild-morph`, `toy-macro-dof`, `brick-fx-fire-smoke`, `desk-scale-reveal`, `stepped-title-pop`.
- **Do:** neutral daylight HDRI + cool grade; GTAO; 2× SSAA; track fast objects with their destination in frame; check real props against every camera; clamp random material indices.
- **Don't:** LEGO name/logo/minifig silhouette, lettered studs; squash/stretch (bricks are rigid); tungsten HDRI (orange whites); glossy baseplates; stepped camera; particle-system effects.
- **Source:** lemo-opuscar `styles/brick-toy/` (MIT code, CC BY 4.0 docs) — `demo/bricks.js` (geometry, plastic), `demo/actors.js` (rig), `demo/set.js` (desk, HDRI, softboxes), `demo/rockets.js` (physics, brick fire/smoke), `demo/main.js` (acting, cameras, DOF), `core/three/post.js`. Assets: Poly Haven CC0 (walnut veneer, studio HDRI, tea set, desk lamp — `core/assets/polyhaven/SOURCES.md`).
- **Port note (MIT):**
  - *Physical DOF gather (core/three/post.js)* — pass 1 writes colour + signed CoC = clamp(aperture·(1/focus − 1/z), ±maxCoC) into alpha (z from perspective depth); pass 2 gathers 96 samples on a golden-angle spiral (`r = maxCoC·sqrt((i+.5)/N)`, θ = i·2.39996), weight `smoothstep(r − 1.5, r + 0.5, |CoC_s|)/(CoC_s² + 1)`, and clamps a farther sample's radius to the centre's own radius so the background can't bleed over a sharp foreground. Ortho cameras need the orthographic depth conversion.
  - *Fingerprint roughness map* — canvas: base grey, 18 sets of concentric arcs (whorls) and 70 thin random scratch lines in a lighter value; used as `roughnessMap` with material roughness 1.
  - *Snap overshoot* — y offset = 0.35·(1 − u)·cos-ish decay over 4 frames after the arc lands; stepped at 12 fps like the pose.
  - *Toy-scale rigid bodies* — pre-simulate once with fixed dt (gravity 420, restitution 0.3, friction) and store per-frame transforms; render reads the table (deterministic).

### Techniques

#### `brick-snap-build` — NEW (3D)
- look: glossy toy bricks fly in on arcs, one per beat, and click into place with a tiny overshoot, stacking into an object (logo, rocket, number, word); characters/bricks step at 12 fps while the camera glides.
- params: arc flight ~0.5 s; snap overshoot 0.35 stud → 0 in 4 frames; 12 fps stepping; clearcoat .85/.07; GTAO; DOF aperture by shot size.
- build: three.js (`three-kit`) instanced rounded-box + stud geometries from a voxel/brick list; per-brick `landAt` frame; time quantised `Math.floor(frame/2)*2` for brick motion, camera on ones. Props: `bricks:[{x,y,z,w,d,h,color,landAt}]` or `voxelize:{text|svg, depth}`, `palette`, `stepFps:12`, `camera`, `surface:'walnut'|'paper'|'none'`.
- source: `styles/brick-toy/demo/bricks.js`, `main.js` (MIT).
- value: "built from the ground up" product/brand/logo builds, education, kids' content — a big, very legible new 3D look for the library.

#### `brick-collapse-physics` — NEW (3D)
- look: a built tower creaks, tips about its base edge and breaks into independent bricks that bounce (restitution 0.3) and settle; camera handheld shake on impact.
- params: gravity 420 studs/s², restitution 0.3, friction ~0.5; shake 0.2 s ramp, 0.4 s decay; deterministic pre-sim.
- build: precompute a simple box-rigid-body sim (or use cannon-es offline in a build script → JSON keyframes); render from table. Props: `bricks`, `pushAt`, `pushDir`, `seed`.
- source: `demo/rockets.js` (MIT).
- value: failure/pivot beats, "break it to rebuild it", playful destruction.

#### `brick-rebuild-morph` — NEW
- look: the same set of bricks lifts off one object and reassembles into a different one (career change, before/after, word re-spelled).
- params: shared brick ids; each brick arcs from A to B with staggered start on 8ths; snap per landing.
- build: match bricks between two layouts by colour/size (greedy nearest), animate arcs. Props: `from`, `to`, `stagger`.
- source: style native move "Rebuild into something else" (CC BY 4.0 docs) + engine above.
- value: transformation stories in a playful material.

#### `toy-macro-dof` — EXTENDS three-kit post / (new shared post: `dof:{focus, aperture, maxCoC}`, `gtao`, `ssaa:2`)
- look: real macro-lens shallow depth of field with correct foreground handling, AO in seams, soft bloom, slight vignette — makes any three.js motion read as a photographed miniature.
- params: maxCoC 16–18 px, aperture 400–900 by shot size, GTAO radius 0.25–3.5 scene units, bloom .2/.5/1.6, vignette .35.
- build: port `core/three/post.js` into `src/core/three-kit.tsx` as an optional composer for all 3D motions (`iso-blocks-3d`, `pointcloud-orbit`, `terrain-build-3d`).
- source: `core/three/post.js` (MIT).
- value: a single upgrade that lifts every existing 3D motion; also enables a future `tilt-shift` look.

#### `brick-fx-fire-smoke` — NEW
- look: rocket flame and smoke made of translucent round plates and white round bricks, jittered/rebuilt every drawing (12 fps), not particles.
- params: flame = 8–20 translucent orange/yellow round plates, re-seeded per drawing; smoke bricks grow ×1.5 and roll outward over ~1 s.
- build: seeded instanced meshes, seed = floor(frame/2). Props: `kind:'fire'|'smoke'|'water'`, `rate`, `palette`.
- source: `demo/rockets.js` (MIT).
- value: stop-motion VFX vocabulary reusable across brick/clay/papercraft looks.

## 7. `briefing-board` — Engineering Briefing Board (Evidence Films, *The Ship Decides*, 40 s)

### style `briefing-board` — Engineering Briefing Board
- **Essence:** one real whiteboard wall, filmed: enamel lit by a window, ghosts of erased marker, frame and tray. Cut-out photos of real objects land on it with weight and get pinned by magnets; marker ink draws itself in three colours with fixed meanings; the camera rides lines from fact to fact and only at the end pulls back to reveal the whole wall as a poster.
- **Palette:**
  - enamel `#F3F1EB` (d); measured `#ede9df` 33 %, `#dcd8ce`, `#cfcac0`, `#bfbcb3` (m — window falloff makes the board a 4-step warm-grey gradient)
  - wall `#8F8B83` (d), frame `#B9BCBF` (d), print paper `#FBFAF6` (d), shadow rgb(30,26,20) (d)
  - ink graphite `#23272E` (names, rules, facts) (d); measured text/greys `#74726c`, `#5e5d59` (m)
  - ink blue `#1F4FC8` (water & measurement) (d); measured `#7d8fb6` / `#8d9ab4` (m, thin lines averaged into the board)
  - ink red `#D33A21` (only the decision; ≤ 2–3 marks per frame) (d); measured `#d39384` 0.4 % (m — rarity confirmed)
  - water hatching `#5F86DA`, drafting grey `#6C727B` (d)
  - photographs carry the only full colour, one shared grade (lower saturation, warmer, lifted blacks)
- **Texture / render (Canvas2D, 6400×3600 board px):**
  - Enamel: flat `#F3F1EB` + low-frequency tonal drift; ~90 seeded **ghost strokes** (faint remains of wiped marker); smudges; window falloff gradient (multiply) from upper-left; a soft diagonal **sheen** that slides at a different rate than the board (it's a reflection); the frame casts a soft shadow on the warm-grey wall.
  - Ink layer (multiply): flat colour ≈ 90 %, lighter core, round caps, a wet-tip glint on the stroke being drawn. Erase = a soft band sweeps across; behind it only a blurred (2 px) ghost at ~7.5 % alpha.
  - Prints: cut-outs (BiRefNet matting or hand polygon) mounted at z ≈ 6–14; shadow = pre-blurred silhouette sprite tinted rgb(30,26,20), offset by `LIGHT = (0.45, 0.80) × z`, alpha `clamp(.36 − (z − 10)·.0005, .1, .36)`, blur grows with z. Thin structures (cables, hangers) re-drawn as clean lines at measured positions. Never upsample: ≥ 1 source px per screen px (checked per frame).
  - Parallax: camera distance D0 = 1700 board px at zoom 1; elements at height z shift accordingly (tray at z 70 nearest).
  - **Motion blur**: per frame estimate screen speed of 5 probe points across a 180° shutter (1/48 s); if > 2 px, render n = ceil(speed/2)+1 (≤ 24) sub-frames across the shutter and accumulate with running average alpha 1/(i+1). Subtitles drawn after (sharp).
  - Light grain 1 at mux; DOF blur ∝ aperture·zoom·|z − focus|/10.
- **Typography:** marker lettering = **LXGW Marker Gothic** (OFL; covers CJK + Latin; Latin-only alternatives: Permanent Marker or Kalam Bold) revealed glyph by glyph with seeded per-glyph tilt, baseline wobble and size jitter; content 100–160 board px, verdict 230–400. Printed labels/tags = sturdy sans (Noto Sans SC 700 78 px; Latin: Archivo / IBM Plex Sans), credit lines IBM Plex Mono. Stamp = Noto Sans SC 900 pitted red. Subtitles: frosted acrylic strip bottom-centre with a blue marker tick; Noto Sans SC 500 42 px (3.9 % H) over Archivo 500 29 px (2.7 % H); strictly one line per language (measured against 1,500 px).
- **Motion rules:** 24 fps on ones, nothing stepped. Camera = overlapping **beta-eased** moves (velocity ∝ u^a(1−u)^b, a,b ≈ 1.5–4; b > a = inertia) so speed and acceleration never jump; ≤ 3 px handheld breath; shake only on impacts. Arrivals: prints **drop** from the camera side (z falls quadratically to 55 %, then a 3.5 % sine bounce, 2° spin settling) as the shadow tightens; magnets **snap** (`1 − e^(−9t)cos(22t)`); tags **swing** about the pin (12°·e^(−4t)cos(11t)); removed magnets pop toward the lens. Something lands/draws/swings every 1–2 beats on the 16th grid. Judgement frames: whole item + limit + verdict, held ≥ 2.5 s, each wider than the last. Never: dissolves, scale-pops, bouncy UI easing, self-fading text.
- **Signature moves:** `board-print-drop`, `magnet-count-clack`, `ride-dimension-line`, `marker-ink-write`, `erase-to-ghost`, `rubber-stamp-verdict`, `whole-wall-pullback`, `projection-lines`.
- **Do:** design the wall as a poster first, then shoot every frame as a crop of it; keep ≤ ~60 % of the board width in view before the reveal; pin labels where the camera rests; one grade/one light vector for all photos.
- **Don't:** hand-drawn line art on a flat page (that's Whiteboard Explainer); headers/bullets/page turns; generated images as evidence; lettering inside photos; glimpsed text during moves.
- **Source:** lemo-opuscar `styles/briefing-board/` (MIT code, CC BY 4.0 docs) — `demo/kit/board.js` (whole renderer), `demo/kit/tools/prep_object.py` (cut-outs), `redraw_*.py`, `demo/tools/camcheck.mjs`, `rescheck.mjs`, `subcheck.mjs`, `demo/scenes/_gen_film.py` (film as JSON data).
- **Port note (MIT):**
  - *Beta ease* — precompute a 2048-entry LUT of the normalised cumulative integral of `m^a(1−m)^b`; `bease(u,a,b)` = linear lookup. a = b = 2 is smootherstep; overlapping moves sum smoothly. Drop-in for our `src/core/ease.ts`.
  - *Settle spring* — `1 − e^(−k t)·cos(f t)` (f 9–22, k 4.5–9).
  - *Shutter-accumulated motion blur* — the speed-adaptive sub-frame accumulation above maps directly to Remotion's `<CameraMotionBlur>` idea but adaptive (only when the camera moves > 2 px/shutter).
  - *Height shadows* — offset = LIGHT·z, blur ∝ z, alpha falls with z; same sprite reused.
  - Whole film is **data** (scene JSON with elements: tag, ink {dim, write}, print {arrive: drop|swing|snap|slide}, stamp, magnets, camera moves) — a good model for an agent-driven `mix`/recipe schema.

### Techniques

#### `board-print-drop` — NEW
- look: a cut-out photo is lowered onto a board from the camera side, lands with a tiny bounce and spin settle while its soft shadow tightens; two magnets clack on to pin it; slight parallax with camera moves.
- params: drop 0.6 s; land at 55 % (quadratic), bounce 3.5 % of lift, spin 2° → 0; shadow offset (0.45, 0.8)·z, alpha .36 → .1, blur ∝ z; magnets snap e^(−9t)cos(22t), 0.15 s after landing.
- build: HTML/SVG layer per print with CSS transforms (scale = 1 + z/D0) and a `filter: blur()` shadow copy; Props: `prints:[{src, x, y, w, rot, at, magnets:2}]`, `board`, `light:[.45,.8]`.
- source: `styles/briefing-board/demo/kit/board.js` arrive 'drop'/'snap' (MIT).
- value: evidence boards, mood boards, case studies, "here's what we tested" product comparisons — physical and premium.

#### `ride-dimension-line` — NEW (EXTENDS-adjacent to `live-chart`)
- look: a quantity drawn as a real length to one scale: a blue dimension arrow shoots from a start line, the camera rides its tip, overshoots past a limit line and settles; arrowhead taps on landing; a strike + dashed red shortfall if it fails.
- params: line 0.4–1.5 s (crawl vs rocket speed tells the story); scale 1.24 px per unit in demo; judgement hold ≥ 2.5 s; red strike on fail.
- build: SVG line with marker-end, camera = parent transform with beta-eased follow. Props: `items:[{label, value, unit, photo?}]`, `limit`, `scale`, `rideCamera`, `colors:{measure, fail}`.
- source: `board.js` ink kind 'dim'; DEMO.md judgement frames (MIT / CC BY).
- value: comparisons in real units (ranges, spans, prices against a budget) that read better than bar charts.

#### `marker-ink-write` — EXTENDS `handwrite-on` (new props: `variant:'marker'`, `inkColor`, `glyphJitter:{tilt, baseline, size}`, `wetGlint`, `multiply`)
- look: dry-erase marker lettering revealed glyph by glyph with seeded tilt and baseline wobble, slightly translucent multiply ink with lighter core and a wet glint at the nib.
- params: ink ≈ 90 % opacity; per-glyph tilt ±2–3°, baseline ±2 px, size ±3 %; hand speed.
- build: per-glyph `<text>` with seeded transforms and clip reveal; `mix-blend-mode: multiply`. 
- source: `board.js` hand lettering (~line 403) (MIT).
- value: whiteboard/briefing/classroom aesthetics with real fonts.

#### `erase-to-ghost` — NEW (also a transition-ish reveal)
- look: an eraser band sweeps across marker work; behind it only a blurred ~7 % ghost and haze remain — last year's plan visible under this year's.
- params: band soft edge ~40 px, sweep 0.5–0.8 s; ghost alpha 0.075, blur 2 px.
- build: SVG mask with a moving soft rect; the erased group duplicated at 7.5 % with blur. Props: `targetIds`, `at`, `direction`, `ghost`.
- source: `board.js` eraser pass (MIT).
- value: rejected options, revisions, before/after with memory.

#### `whole-wall-pullback` — EXTENDS `powers-of-ten` (new props: `variant:'poster'`, `crops:[{x,y,z,at}]`, `revealAt`)
- look: a film shot entirely as close crops of one big composition; the final move is a single long beta-eased pull-back revealing the whole wall as a finished poster.
- params: crops ≤ 60 % of width, never both side edges before the reveal; pull-back ~2 s (z 1.42 → 0.28) then a ×1.025 slow push.
- build: one large SVG/HTML canvas + camera transform track. Props above.
- source: DEMO.md shots 16–17, `board.js` camera (MIT / CC BY).
- value: summary/end-card for any explainer: everything at once, earned.

#### `rubber-stamp-verdict` — COVERED by `stamp-slam` (optional new props: `pitting` grain holes, `jolt` target object, `frameShake`)
- look: pitted red stamp impression lands with a thud, the struck object jolts and springs back.
- source: `board.js` `stampTexture`; `styles/blueprint/demo/paper.js` stamp holes (MIT).
- value: verdict beats — already in our library; only the pitted-ink texture is worth adding.


## 8. `caption-news` — Caption News (Edit & Documentary, *The Bee Ledger*, 59.5 s)

### style `caption-news` — Caption News
- **essence**: sound-off social news. Real footage / photos / the source PDF are the ground; one huge caption line is the lead actor, slammed in 2–3 chunks with one keyword on a yellow block. Hard cuts on a 120 BPM half-beat grid, rolling numbers, a source tag whenever a figure appears, the original document highlighted before its number is believed.
- **palette** (doc = `STYLE.md` / `demo/main.js` const `C`; meas = PIL on poster + `docs/frames` + styleboard, all three are the same split-screen frame):
  - bg / ink-dark `#0E0E0C` (doc) — footage under a 0→84 % bottom gradient measures `#171310`–`#2E2420` (meas, warm because of the 6 % warm soft-light layer)
  - caption ivory `#F7F5EF` (doc)
  - accent honey `#FFC21A` (doc) / `#FBC21C` (meas, 2.1 % of frame) — keyword block, gains, bug, highlighter
  - loss red `#FF4A3D` (doc) / `#F94B3E` (meas, 1.0 %) — losses, spikes
  - label grey `#8D8B83`, muted bars `#5E5C55` (doc); ledger card sheet `#151512` with rules at 4.5 % white every 54 px and a red double margin `rgba(255,74,61,.38)` at x 78/86 (doc)
  - document desk `#23221E` (code)
- **texture / post**: one footage grade for everything: CSS/canvas filter `contrast(1.07) saturate(0.92) brightness(0.98)` + a soft-light fill `rgba(255,170,70,0.06)` (documents 0.04). Legibility veils: bottom linear gradient 0→0.84 from y = 52 % of H, soft dark radial from bottom-left corner, top gradient 0.55→0 over 18 % H under the bug. Light grain at master only (ffmpeg grain 1). Scale limits: footage ≤ 1.5×, photos ≤ 1:1, archive ≤ 2.5×. Remotion: `filter` style on `<OffthreadVideo>` + an absolutely positioned `mix-blend-mode: soft-light` div; veils as CSS gradients.
- **typography**: CJK Noto Sans SC 900 (caption 88 px = 8.1 % H, verdict 110 px = 10.2 %); Latin Inter Tight 500 33 px (3.1 % H) for the second-language line, Inter Tight 800 with fixed-width digit cells for every number (hook number 270 px = 25 % H). Google Fonts: Noto Sans SC, Inter Tight — both available. Caption block left-aligned at x = 6.25 % W, CJK baseline y = 87.8 % H, Latin baseline 93.9 % H; one line per language, never wrapped.
- **motion rules**: 30 fps on ones. Cuts only on 0.5 s multiples; footage shots 1.5–3 s, data cards 3–4.5 s; captions change at most every ~2.5 s and may straddle cuts. Chunk slam: scale 1.3→1 in 0.13 s with `back(s=1.6)`, opacity full in 0.04 s, next chunk +0.12 s; keyword block wipes L→R in 0.12 s starting 0.05 s after its chunk; second-language line fades + rises 10 px in 0.18 s, 0.1 s after chunk 1. Transitions: hard cut; 1–2-frame white flash on the turn; card slide-in from right with 6 horizontal speed streaks (0.18 s); split opening from its divider; staggered grid rise (0.1 s); punch-in 0.3 s ease-out to 1.25×; mask transition (photo grows out of a map shape). No dissolves, no 3D flips. Strong action within 0.5 s of every cut; nothing static > 1 s (slow pushes 1.0→1.03).
- **signature moves**: `number-hook-block`, `caption-slam-keyword`, `proportion-sweep`, `doc-highlight-evidence`, `freeze-frame-brackets`, `ledger-split-counters`, `lit-panel-grid`, `punch-circle-callout`, `map-mask-reveal`, `news-bug-source-tag`.
- **do**: one accent colour with fixed meaning (honey = the point, red = loss); every number with a source tag in the same shot; re-set what must be read from a document as type; start split/grid animations 0.1–0.15 s *before* the cut so frame 1 already has picture; vertical 9:16 = new layout (caption under a 1080×1560 band, two-line chunks allowed).
- **don't**: anchors, tickers, crawls, centred title+bullets, two-line CJK captions in 16:9, captions over station logos (crop logos), words stronger than the source.
- **source**: lemo-opuscar `styles/caption-news/` (MIT code, CC BY 4.0 docs); key code `demo/main.js` (`num`, `capCard`, `hook`, `shotHalf`, `shotFreeze`, `paper`, `ledger`, `sourceTag`, `lowerThird`, `bug`).
- **Port note (MIT)**: (1) *fixed-slot digits*: measure the width of "0" once at the font size, give every digit that cell width and draw each glyph centred in its cell; non-digits use their own width — a rolling counter never jitters (trivial in React: one `<span>` per char with `width: 1ch`-like fixed px + `font-variant-numeric: tabular-nums` as a cheaper fallback). (2) *chunk slam*: per chunk `k = seg(t, t0, t0+0.13)`, scale `lerp(1.3, 1, back(k,1.6))`, alpha `clamp(3k)`; `back(t,s) = 1 + (t-1)²((s+1)(t-1)+s)`. (3) *keyword block*: rectangle of width `(textW+24)·eo(seg(t,t0+.05,t0+.17))` behind the word, height 1.1× font size, word drawn in bg ink. (4) *proportion sweep*: x = lerp(W, W(1−p), eo(seg)); clip the region right of x and redraw the same frame with `grayscale(1) brightness(.26) contrast(1.1)`; draw an 8 px honey bar at x. (5) *PDF highlight*: page rendered at 220 dpi so 1 pt = 3.0556 px; rectangles from `pdftotext -bbox` coords, `multiply` blend, fill `rgba(255,200,30,.88)`, width grows L→R over 0.3–0.5 s, 8 px horizontal / 5 px vertical padding; page tilted −0.7°, shadow blur 50 px offset 18 px, radial vignette to 55 % black.

### Techniques

#### `caption-slam-keyword` — EXTENDS `kinetic-captions` (new props: `chunks` split by `|`, `keyword` marked `{…}`, `slamScale` 1.3, `chunkStagger` 0.12, `secondLine`, `keywordColor`, `big` 1.25× verdict mode)
- look: a single huge left-aligned line slams in 2–3 chunks; one word sits on a honey block with dark text; a smaller second-language line rises in beneath.
- params: chunk in 0.13 s back(1.6); stagger 0.12 s; block wipe 0.12 s; second line 0.18 s fade + 10 px rise at +0.1 s; caption ≥ max(1.8 s, speech + 0.6 s); CJK size 8.1 % H, Latin 3.1 % H; shadow 20 px blur, 4 px offset, 60 % black.
- build: Remotion component; parse chunk/keyword markup; per chunk `interpolate` with custom `back` easing via `Easing.bezier` approximation or the exact formula; keyword block = absolutely positioned div with `scaleX` from left; fixed baseline positions as % of frame.
- source: lemo-opuscar `styles/caption-news/demo/main.js` `capCard()` (MIT); STYLE.md §4 (CC BY 4.0).
- value: the default caption for any sound-off social video, explainer or news short; agents only change text + accent.

#### `number-hook-block` — EXTENDS `number-counter` (new props: `block` background colour, `kicker` line, `unit` slam, `rollDuration` 0.45, `fixedSlots`)
- look: frame-4 hook — a kicker line slams, then a giant number on a yellow block rolls 0→value, unit and subject word slam beside it.
- params: kicker at 0.06 s, number block at 0.13 s scale 1.45→1 back(1.4), roll 0→value over 0.13–0.6 s ease-out, subject word at 0.4 s; number 25 % H; exits by sliding left 1200 px over 0.28 s.
- build: our number-counter with a `variant:'hook'`; fixed-width digit slots (see port note).
- source: `demo/main.js` `hook()` (MIT).
- value: the opening frame of any data short / ad stat.

#### `proportion-sweep` — NEW
- look: a bright vertical line sweeps across live footage to X % of the width; everything it has passed turns grey and dark; the percentage pops on the dark side.
- params: sweep 0.42 s ease-out-cubic; dark side `grayscale(1) brightness(0.26) contrast(1.1)`; bar 8 px (0.4 % W) accent; number 200 px (18.5 % H) slams 0.36 s after sweep start.
- build: two stacked copies of the same `<Img>`/`<OffthreadVideo>`; the top one filtered and clipped with `clipPath: inset(0 0 0 X%)`; props `src`, `percent`, `direction`, `accent`, `label`, `darkFilter`.
- source: `demo/main.js` `shotHalf()` (MIT).
- value: any "X % of …" statistic over a photo/video (churn, share lost, coverage) — instantly readable.

#### `doc-highlight-evidence` — NEW
- look: a document page lies tilted on a dark desk with a soft shadow; a highlighter sweeps over the key sentence; the number it states pops beside the page as a big accent block; optional pull-quote mark. Variant `reading-light` (from city-symphony): a soft Gaussian brightness band grows over the quoted line while the page pushes in.
- params: page tilt −0.7°, push 0.92→1.0 over the shot; highlighter multiply `rgba(255,200,30,.88)`, sweep 0.3–0.5 s; number block slams at +1 s, rotated −1.7°; vignette radius 300→1200 px to 55 % black; warm soft-light 4 %. Reading-light: band σ 95–140 px, +38 % brightness, paper tint ×(1, .93, .80), push 1.06→1.56 page widths.
- build: `<Img>` of a pre-rendered page (pdftoppm 220 dpi); highlight rects in page points × 3.0556; `mix-blend-mode: multiply` divs with animated width; props `pageSrc`, `marks[{t,x0,y0,x1,y1}]`, `callout`, `tilt`, `zoom`.
- source: `demo/main.js` `paper()`, `shotDoc6()`; city-symphony `tools/render.py` `page_frame()` (MIT).
- value: evidence/receipt beats for explainers, investor updates, legal and policy videos ("the report says it").

#### `freeze-frame-brackets` — NEW
- look: the video stops dead, a white flash, a small punch-in, colour drains to ~45 %, yellow corner brackets close in on the subject, a timecode chip with a red pause mark appears top-right.
- params: flash 0.14 s from 90 % white; punch 1.0→1.12 in 0.25 s then +0.04 creep; saturation 1→0.45; brackets shrink from 420×330 to 300×230 px in 0.2 s, 6 px stroke, 46 px arms; chip 220×44 px at 70 % black.
- build: `<Freeze frame>` around the video at the freeze time + CSS filter `saturate()`; SVG corner paths; props `freezeAt`, `focus{x,y,w,h}`, `timecode`, `accent`.
- source: `demo/main.js` `shotFreeze()` (MIT).
- value: "wait — look at this" moment in reaction videos, tutorials, sports, news.

#### `map-mask-reveal` — NEW
- look: a choropleth map pushes into one region outlined in the accent; a photo of that place grows out of the region's own outline until it fills the frame.
- params: states fill west→east as ticks; push over 1.3 s; mask growth 0.6 s; region outlined 4 px accent + leader label held ≥ 2.5 s before the push.
- build: SVG map (Natural Earth, Albers pre-projected); the photo in a `<clipPath>` that is the region path scaled about its centroid from 1→ (frame-covering factor) with ease-in; props `geojson`, `regionId`, `values`, `photo`.
- source: `demo/main.js` `shotMap()`; `demo/tools/map_prep.py` (MIT).
- value: location stories, store/branch reveals, travel and real-estate videos.

#### `news-bug-source-tag` — NEW
- look: top-left channel bug (accent square + name + topic), a "SOURCE · publisher · date" chip that slides in under it on data shots, and a small "Video: author · licence" credit chip top-right.
- params: bug 46 px high (4.3 % H) at (5 %, 4.8 %); source tag 36 px, slides 40 px in 0.2 s; credit 19 px text on 50 % black chip.
- build: overlay component; props `channel`, `topic`, `source`, `credit`, `accent`; transparent background so it layers over any motion.
- source: `demo/main.js` `bug()`, `sourceTag()`, `credit()` (MIT).
- value: attribution that agents can always attach (CC BY credits, data sources) — a compliance helper as much as a look.

Also: `ledger-split-counters` — EXTENDS `split-compare` (new props: `dividerDrop`, `badHalfFilter` desat + red tint, `counters[2]` racing, `stamp` on the divider after both settle); `lit-panel-grid` — EXTENDS `panel-triptych` (new prop: each panel lights accent border + label on its word time, panels rise staggered 0.1 s); `punch-circle-callout` — EXTENDS `callout-labels` (new props: 0.3 s punch-in 1→1.25, hand circle draw, Latin-name second label).

---

## 9. `cel-anime-80s` — 80s Cel Anime (Cartoon & Anime, *City Lights, 1987*, 59 s)

### style `cel-anime-80s` — 80s Cel Anime
- **essence**: late-80s OVA cel animation played back from videotape on a CRT: airbrushed painted backgrounds vs flat two-tone cels with hard shadow/highlight shapes and coloured lines, backlit neon glowing *through* the frame, limited animation on twos/threes.
- **palette** (doc = `demo/pal.js` + DEMO.md; meas = poster / docs frame / styleboard):
  - night ground indigo-violet `#130D1F`, `#2B1D30`, `#3A2F4D` (meas, 50–60 % of frame) — painted sky / street
  - neon magenta `#FF3FA4` / `#FF4FA8` (doc); meas `#CE6F6D`–`#CA6CAD` after bloom
  - neon cyan `#35E7FF`, `#8FF4FF` (doc); meas `#8AE0E6`
  - cobalt jacket `#2F6FE2` (doc) / `#214DC5` (meas, 7.7 % in the close-up)
  - window gold `#E2B24E` (doc), skin night `#E9C9C4` with shadow `#9B82B4` (doc), meas skin/peach `#DEA785`–`#E5A88A`
  - hero accent coral scarf `#FF6B6B` (doc)
  - line colours: skin `#5A2E2E`, hair `#2E1850` (doc) — never pure black
  - subtitles cream-yellow `#FFF0A0` with 9 px dark outline; radio voice `#8FF4FF` (doc)
  - dawn set: periwinkle / rose / peach / pale gold (doc, no hexes).
- **texture / post** (WebGL2, same math as `core/post/crt.js` — "restrained set A"): (1) pre-pass: emissive canvas + colour canvas thresholded at luma 0.9 (weight 0.12) → 4-level mip blur (½, ¼, ⅛, 1/16, 9-tap Gaussian each) → bloom 0.85, red-orange halation (b3+1.3·b4)×(1, .32, .16)×0.22; (2) tape signal: luma sharp, chroma (YCbCr) box-averaged over 7 px horizontally with Cr sampled 2 px to the right; (3) grade: sat 1.05, smoothstep S-curve 0.15, tint (1, .985, .97), shadow lift 0.04 toward `(0.16,.08,.22)`, fade 0.03; (4) subtitles composited here (so they get scanlines but not grade); (5) phosphor glow 0.35·max(blur−0.15,0); (6) scanlines period 3 px, `c *= 1 − 0.18·ph·(1 − 0.6L)`; (7) RGB grille: column x mod 3 boosts one channel ×(1+2g), others ×(1−g), g = 0.06; (8) corner darkening `1 − 0.28(2u²v² + 0.25(u²+v²))`; (9) noise ±0.018, flicker 1 %. Accents: power-on (dot → horizontal line → opens vertically, boost (1−sy)³), tracking noise (per-2-line horizontal tear, one rolling noise band, head-switch bar in the bottom 5 %). Grain in ffmpeg only (`noise=c0s=2:allf=t`, CRF 23). Two-canvas rule: draw every light source again on a separate **emissive** canvas and stamp every cel silhouette in black on it so glow never bleeds through characters.
- **typography**: title Kanit italic 900 (230 px = 21 % H) with a 6-stop vertical chrome gradient (`#E8F6FF` → `#7FC8FF` at 46 % → white horizon at 50 % → `#3A2A7A` at 54 % → `#FF6AA0` → `#FFD08A`), 26 px dark stroke `#120830` + 10 px neon stroke `#FF3FA4`; katakana line Dela Gothic One 64 px; subtitles Barlow Semi Condensed 600 54 px (5 % H), 96 px above bottom; small caps tagline Barlow SC 600 34 px tracked 12 px. All Google Fonts (Kanit, Dela Gothic One, Barlow Semi Condensed, Barlow).
- **motion rules**: 24 fps output; characters on twos (12 fps), performance beats (blinks, lip flaps, eye openings) on threes (8 fps); camera, light sweeps, flares, rain on ones. Hair/cloth as ribbons on a travelling sine, 4-drawing cycle (6 when calm). Blinks hold the closed drawing 2–3 frames; eye opening in 3 drawings. Impact frames: 2 frames inverted/monochrome silhouette on radial lines. Title flickers on at 12 fps (frames: 0, 0.3, 0.6, 1). Moving plates get a ~16 px horizontal smear. Transitions: cuts on bars, white flashes, impact frames, tracking noise — no dissolves or wipes.
- **signature moves**: `cel-shade-crescent`, `vhs-crt-pass`, `chrome-80s-title`, `colour-model-relight`, `neon-band-sweep`, `wet-street-reflection`, `anime-lens-flare`, `impact-frame`, multiplane crane, held "harmony" still with slow pan.
- **do**: emissive canvas separate from colour canvas; skin gets its own colour per lighting set; rim light offsets 2–4 px; line weight ×0.45–0.8 in extreme close-ups; clamp before S-curves; 4:3 pillarbox allowed for OVA feel.
- **don't**: gradients inside cels, uniform black outlines, moe eyes, film-print artefacts (gate weave, scratches — this is tape), digital dissolves, stepped camera.
- **source**: lemo-opuscar `styles/cel-anime-80s/` (MIT code, CC BY 4.0 docs); `demo/cel.js`, `pal.js`, `fx.js`, `bg.js`, `post.js`, `scenes1.js` (title), `scenes2.js` (light bands); shared `core/post/crt.js`.
- **Port note (MIT)**: (1) *automatic cel shading*: clip to shape P; shadow = fill of the even-odd union of P and P translated by d toward the light (the leftover crescent on the far side); highlight = same with the offset reversed; rim = same with a 2–4 px offset in a saturated neon colour. In SVG: `<clipPath>` of the shape + a `<path fill-rule="evenodd">` whose `d` is the shape twice (second copy translated) — no boolean ops needed. (2) *Catmull-Rom path with sharp-corner flag*: control points `p1 + (p2−p0)·k/6`, with sharp points falling back to 1/3 of the straight segment. (3) *ribbon/flutter*: centreline `y = sin(u·waves·2π − phase)·amp·u^0.8 + droop·u²`, widths from a function of u, offset along normals. (4) *colour models*: multiply each fill by `lit`, shadow by `shade`, line by `line` vectors per time of day (night lit (.78,.74,1.0), shade (.58,.52,.92), line (.8,.7,1.1); dawn lit (1.04,.9,.84); silhouette lit (.2,.16,.32); backlit lit (.42,.3,.55)) — then override skin by hand. (5) the full CRT pass (numbers above) ports almost 1:1 into a three.js/OGL full-screen fragment shader or a `@remotion/three` post pass.

### Techniques

#### `vhs-crt-pass` — NEW (wrapper/post; our `crt-terminal` style only has scanlines + green ramp; `glitch-image` covers RGB split but not tape signal)
- look: soft VHS-on-CRT playback over any child scene: smeared colour, red shifted right, fine scanlines, faint RGB grille, glowing highlights, darkened corners; optional power-on and tracking-noise bursts.
- params: see "texture / post" above (chroma blur 7 px, Cr shift 2 px, scan 3 px/0.18, grille 0.06, glow 0.35, corner 0.28, noise 0.018, power-on 0.3+0.7 of the `power` ramp, tracking band height ±7 % H).
- build: WebGL fragment shader on a canvas fed by the child rendered to texture (`@remotion/three` render target or OGL), deterministic hash noise keyed on frame; props `scan`, `grille`, `bleed`, `rshift`, `glow`, `corner`, `noise`, `powerOn` (frame range), `tracking` (frame ranges), `subtitles` (layer composited inside). Check moiré at 720p.
- source: lemo-opuscar `core/post/crt.js` and `styles/cel-anime-80s/demo/post.js` (MIT) — port the shader math directly.
- value: retro / 80s / found-footage / synthwave looks over any motion; a "tape" transition via power-on and tracking noise.

#### `cel-shade-crescent` — NEW (utility component + `<CelShape>`)
- look: flat fill, hard-edged shadow crescent, hard highlight crescent, saturated rim, coloured outline — instant 80s anime / cel look for any SVG shape.
- params: shadow offset 4–10 px toward light, highlight 2–6 px away, rim 2–4 px, line 2–3 px (×0.45–0.8 in close-ups), line colour = darkened fill.
- build: React SVG component `CelShape({d, fill, shade, hi, rim, line, light:[dx,dy]})` using clipPath + even-odd double path; works in every existing character motion (box-bot, blob-mascot) as a `shading:'cel'` prop.
- source: `demo/cel.js` `cel()`, `crescent()` (MIT).
- value: upgrades all flat characters/props to an anime look with one prop; very cheap to render.

#### `chrome-80s-title` — NEW
- look: heavy italic title in a sky-to-sunset chrome gradient with a white horizon line, thick dark outline plus neon outline, glowing through; flickers on, a light bar sweeps across, a star glint pops on one letter; katakana line above, red year below.
- params: gradient stops 0 / .46 / .5 / .54 / .8 / 1 as above; flicker at 12 fps (0, 0.3, 0.6, 1); sweep band 240 px wide crosses in 1.05 s starting 0.15 s; glint at 1.1–1.6 s `sin(πu)` envelope; 2-frame white flash on entry; slow push 1→1.045.
- build: SVG `<text>` with `<linearGradient>` fill, two `stroke` copies (`paint-order: stroke`), a blurred duplicate for glow (feGaussianBlur + `mix-blend-mode: screen`), sweep = gradient rect masked by the text; props `title`, `subtitle`, `year`, `tagline`, `neon`.
- source: `demo/scenes1.js` `titleCard()` (MIT).
- value: synthwave/retro title cards, YouTube intros, game trailers.

#### `colour-model-relight` — NEW (palette utility)
- look: one character or scene re-lit for night / dawn / backlit silhouette by multiplying each paint role separately — faces stay correct, lines darken with fills.
- params: multiplier sets above; skin override per set; hero accent colour must stay readable in every set.
- build: TS helper `relight(palette, set)` returning a new palette; exposed as `timeOfDay` prop on character motions and as a companion to `time-of-day-grade` (which grades the whole frame — this is the cel-correct alternative).
- source: `demo/pal.js` (MIT).
- value: same asset reused across times of day / moods without a frame filter.

#### `neon-band-sweep` — EXTENDS `light-sweep` (new props: `target:'subject'` using source-atop, `bands` colours, `direction`, `speed`)
- look: bands of magenta/cyan/gold light slide across a held close-up — speed and tension with zero character animation.
- params: 3 bands, ~0.6–1 s per crossing, weaker on faces; colour layer only (also drawn on emissive for glow).
- build: gradient rects with `mix-blend-mode: screen` clipped to the subject (`mask-image` of the subject or SVG clipPath).
- source: `demo/scenes1.js` l.129, `scenes2.js` l.119–137 (MIT).
- value: "held bust" shots for drives, waiting, scanning a page.

#### `wet-street-reflection` — EXTENDS `rain` (new prop: `reflection` plate)
- look: neon street mirrored in wet asphalt as vertical streaks with dark ripple bands.
- params: 6 stacked flipped copies scaled y −1.15, each shifted 26 px down, alpha 0.3·(1−i/7), blur 5 px; horizontal ripple bands every 6 px darkening `0.12 + 0.1 sin(0.37y) + 0.08 sin(1.3y)`; gradient to 70 % dark at the bottom.
- build: SVG `<g transform="scale(1,-1.15)">` copies with `filter: blur(5px)`, plus a repeating-linear-gradient overlay.
- source: `demo/bg.js` `reflectPlate()` (MIT).
- value: night city, neon-noir, rain scenes.

Also: `anime-lens-flare` — EXTENDS `star-glint` (new props: anamorphic streak ±900 px, 6-spike star, 5 hexagonal ghosts placed along the line through frame centre at k = .35/.62/1.15/1.4/1.75 in mint/pink/blue/gold/violet); horizontal neon streak background — EXTENDS `speed-lines` (new prop `mode:'horizontal'` with gradient-faded streaks 300–1700 px long, 1–7 px tall); `impact-frame` — EXTENDS `speed-lines` (new prop: 2-frame inverted silhouette over radial lines before a hit).

---

## 10. `city-symphony` — Time-lapse Symphony (Edit & Documentary, *One Day in New York*, 52 s)

### style `city-symphony` — Time-lapse Symphony
- **essence**: a city film cut like minimalist music: real footage bent in time (time-lapse to light rivers, one fragile thing in slow motion), cuts on beats and subdivisions, cut density following the score, a hard stop to black on a downbeat, no narrator.
- **palette** (doc = STYLE.md §3 / `tools/render.py`; meas = poster (noon clouds) and docs frame (crowd tracks)):
  - type warm white `#EDE8DF` (doc), secondary `#B0AAA0` (doc)
  - single accent sodium orange `#D9772F` (doc; `SODIUM (217,119,47)`) — meas `#AF784A`/`#A97850` on the tracks frame after darkening, visible as the rule under the number in the poster
  - matte / black `#000000` (21 px bars, 1.85:1)
  - footage after grade: desaturated cool greys `#464442`, `#4F4D4B`, `#3C3A38` (meas, darkened crowd plate), daylight sky `#A0A5AB`–`#D1D1D0` (meas poster).
- **texture / post** (numpy, `tools/render.py`, port to a shader): per-shot partial grey-world white balance (only pixels with luminance 0.12–0.88, gain = (mean/channel-mean)^strength, strength 0–0.6, **0 at night**) → saturation 0.86 → one LUT: sigmoid S-curve slope 6.2 pivot 0.47 normalised, blended 55 % S / 45 % linear, mapped to black 7/255 white 250/255, R ×1.025, B ×0.965 → bloom: ⅛-size copy, pixels above 170/255 ×1.6, Gaussian 6 px, upsampled, added × (1, .82, .62) × 0.09 day / 0.15–0.2 night → vignette `1 − 0.16·r^2.6` clamped ≥ 0.6 → grain: half-res Gaussian noise blurred 0.6 px, 10 pre-generated tiles cycled by (frame·7) mod 10, amplitude 9/255 × `(0.35 + 1.3·L·(1−L))` (strongest in mid-tones) → ±0.5 px gate weave (white noise convolved with a 15-tap Gaussian, ×1.1) → 1.85:1 matte.
- **typography**: Michroma (capitals, tracking 0.06–0.32 em) for numbers (84 px = 7.8 % H; 44 px when three stack) and Latin lines (14–22 px); Noto Sans SC 300–350 (tracking 0.08–0.14 em) for CJK lines 28 px; quote CJK 60 px, Latin 20 px caps. Left-aligned at 168–196 px (8.8–10.2 % W), never centred, never on a box — only a soft elliptical darkening (α ≤ 0.6). Google Fonts: Michroma, Noto Sans SC.
- **motion rules**: 30 fps; 120 BPM → 1 beat = 15 frames, triplet = 5, sixteenth = 3.75. All cut times from `bar(n, beat)`; cut-length table: 2 bars→1 bar (opening), 2 beats→1 beat, 1→½ beat with triplets, cells every 1–2 frames on sixteenths, 3–4 s on the brake, ½ beat → 4 → 2 frames into the hard stop. Speeds 0.3×–75× with frame blending (360° shutter); smoothstep ramps (1→6×, 2.2→0.3× in 0.55 s on the bar where the music stops). Camera only as slow push 1.00→1.05–1.10; opening still falls 1.0→1.3 in 0.35 s then accelerates to ×2. Hard cuts only; fades only from black for page and end card.
- **signature moves**: `frame-blend-timelapse`, `crowd-tracks`, `grid-multiply`, `digit-lock-counter`, `day-ring-dial`, `release-print-grade`, `strobe-pair`, `reverse-flashback`, `hard-stop`, reading-light page (see `doc-highlight-evidence`).
- **do**: score first; machines fast, people slow (people only as crowds, tracks or long-exposure ghosts); one long single-camera time-lapse returning 3–4 times as the clock; shape match cuts on the beat; text over the dark half.
- **don't**: narrator, source sound, sound effects, drone-porn montage on pop, lower thirds, centred cards, blending across hidden source cuts, > 40 % shutter on noon clouds.
- **source**: lemo-opuscar `styles/city-symphony/` (MIT code, CC BY 4.0 docs); `demo/tools/render.py` (grade, finish, weave, counter, lock_digits, dial, grid_plate, split_plate, Trails), `demo/tools/prep.py` (speed integration + blending), `demo/tools/timeline.py`.
- **Port note (MIT)**: (1) *speed curve → source time*: integrate keyframed speed with the trapezoid rule, `pos[i] = Σ (v[i]+v[i−1])/2 · Δt`; smoothstep between keys; each output frame averages the source frames between consecutive positions, capped to `blend` samples chosen evenly (`linspace`). (2) *crowd tracks*: per-pixel median over the fixed shot = background; |frame − bg| > 22/255 → connected components (area 8–900 px at half res) → centroids; link each to the nearest previous centroid within 70 px with a 2 px accent line; line alpha decays ×0.9 per frame; plate darkened + desaturated 0.15→0.55 s. (3) *lock digits*: k = floor((t−t0)/step); digit j < k shows its final value, others a seeded random digit per frame. (4) *grid stages*: each stage lights its cells in a fixed scattered order with step = min(sixteenth, 0.3 s / n); unlit cells keep the previous stage's picture (never black); in the final beat the clip index shifts by 5 every sixteenth; gutters 6 px black. (5) the grade LUT and grain weighting above port directly to a fragment shader.

### Techniques

#### `frame-blend-timelapse` — NEW (wrapper; Remotion's `@remotion/motion-blur` gives sub-frame trails for components, but not speed ramps + averaging of video)
- look: headlights become continuous lines, crowds fog, clouds water; speed ramps smoothly between keyed speeds.
- params: speed 0.3×–75×; blend cap 8–30 frames (≈40 % shutter for clouds: 24 of 60); ramp smoothstep; brake 2.2→0.3× in 0.55 s.
- build: for a video `src`: compute source time from the integrated speed curve; render `blend` `<OffthreadVideo>`/`<Img>` layers at evenly spaced source times with opacity 1/(i+1) running average (or one WebGL accumulate pass); for procedural children: render the child at k sub-frames and average. Props `speedKeys[[t,v]]`, `blend`, `shutter`.
- source: `demo/tools/prep.py` (MIT); STYLE.md §5/§8.
- value: hyperlapse / time-lapse looks from any clip, "time flies" beats, light-trail backgrounds.

#### `crowd-tracks` — NEW
- look: a still-ish crowd plate darkens and desaturates while glowing orange polylines link each walker to where they just were — people as data.
- params: threshold 22/255, blob area 8–900 px (half res), link radius 70 px, line 2 px sodium `#D9772F`, decay ×0.9/frame, plate fade 0.15→0.55 s.
- build: procedural version for our library: N seeded agents walking on a plate (or over a user image) — store nothing between frames: recompute each agent's last ~30 positions analytically and draw segments with alpha 0.9^age; optional precomputed tracks JSON from a real video. Props `src`, `agents`, `color`, `decay`, `linkRadius`.
- source: `demo/tools/render.py` `Trails` (MIT); poster `docs/frames/city-symphony.jpg`.
- value: footfall / mobility / network-activity explainers, smart-city and retail-analytics videos.

#### `grid-multiply` — NEW
- look: the frame splits 1×2 → 2×2 → 3×3 → 4×4 on the beat; new cells light in a scattered order over the previous stage; on the last beat cells re-cut every sixteenth.
- params: one stage per half bar or bar; fill window 0.3 s; 6 px black gutters; ORDER9/ORDER16 scattered permutations; pool of 16 one-second clips.
- build: Remotion component with `stages[{t, cols, rows, items}]`, `bpm`, `gutter`, `frantic` (last-beat re-cut); each cell an `<OffthreadVideo>`/`<Img>` cover-fitted.
- source: `demo/tools/render.py` `grid_plate()` (MIT).
- value: montage climaxes, "everything at once" beats, product-range or UGC walls (cf. `thumbnail-mosaic` which is static/zoom-based).

#### `digit-lock-counter` — EXTENDS `number-counter` (new prop `mode:'lock'`, `lockStep` = sixteenth, `onLock` events for a glockenspiel note; plus `mode:'scramble'` from dark-keynote)
- look: a census-type number where every digit spins randomly and locks left→right one per sixteenth; thin accent rule grows under it; one CJK line + one tracked Latin line.
- params: lock step 0.125 s at 120 BPM; rule 2 px; number 7.8 % H Michroma.
- build: per digit seeded random per frame until its lock frame; fixed-width slots.
- source: `demo/tools/render.py` `lock_digits()`, `counter()` (MIT).
- value: population/user/revenue numbers with musical sync.

#### `day-ring-dial` — NEW
- look: small thin 24-hour ring bottom-right with an orange hand and a 3-hour arc; runs with the film's day, freezes and dims during a slow passage, spins backwards during a rewind.
- params: ~150 px diameter (14 % H); hour keys `[(t, hour)]` with linear interpolation; dim to ~40 % on the brake.
- build: SVG; props `hourKeys`, `accent`, `dimRanges`, `position`.
- source: `demo/tools/render.py` `dial_hour()`, `draw_dial()` (MIT).
- value: "a day in the life" films, shift/operations timelines, any time-of-day structure; pairs with `time-of-day-grade`.

#### `release-print-grade` — EXTENDS `film-look` (new props: `lut:'sigmoid'` slope/pivot/mix, `blackPoint` 7, `whitePoint` 250, `warm` R×1.025/B×0.965, `sat` 0.86, `bloomTint` (1,.82,.62), `grainMidtoneWeight`, `matte` 1.85, `weavePx` 0.5, `greyWorld` strength)
- look: one 35 mm print look unifying mismatched footage (modern 4K, archive B&W, phone).
- params: as "texture / post" above.
- build: SVG `feComponentTransfer` (table from the sigmoid LUT, per channel) + feColorMatrix saturation; bloom via blurred thresholded copy; grain from a pre-rendered tile set.
- source: `demo/tools/render.py` `make_luts`, `grade`, `finish` (MIT).
- value: makes stock + user footage + archive cut together.

Also: `strobe-pair` — NEW (S): two same-position frames (noon/night or a photo pair) alternating every 2 frames — a 0.5 s time-collapse punctuation; `reverse-flashback` — EXTENDS `beat-montage` (new prop `reverse: true` replaying earlier shots in reverse order at 4 then 2 frames each, with the dial spinning backwards); `hard-stop` — editorial rule (cut picture to black on the bar line with the music's dry signal cut in 15 ms, reverb left ringing) — document in `docs/CHOOSING.md`, not a motion.

---

## 11. `countdown` — Live Countdown Split-screen (Edit & Documentary, *Counting Itself Down*, 59.5 s)

### style `countdown` — Live Countdown Split-screen
- **essence**: real-time edit of one event with a known zero: screen time = event time, a ticking clock is the lead, cells multiply as zero nears (every cell the same second), all cells merge into one picture at zero and the clock inverts.
- **palette** (doc = STYLE.md §3 / `demo/index.html` `C`; meas = poster / styleboard 3×3 grid frame):
  - ground `#06080A` (doc) / `#0A0D10` (meas, 52 % of frame); panels `#0B0E11` (doc)
  - main text `#F2F5F7`, secondary `#7C878D` (doc); cell border `rgba(222,232,238,.16)`
  - accent orange `#FF5B1F` (doc) / `#F05A24`–`#F45D27` (meas 1.1–1.3 %) — T− sign, synced dots, ticks done, event flags, active control segment
  - speaking light / "heard" tags `#FF3B30` (doc)
  - plates over footage `rgba(6,8,10,.80)`; after zero the clock block becomes `#FF5B1F` with text `#0A0B0C` (inverted)
  - footage after grade: warm-cool neutrals `#282722`, `#484139`, `#5F5951` (meas).
- **texture / post**: hard rectangles, 24 px outer margin, 8–9 px gutters, 1 px border, light radial vignette to 36 % black on video cells; no rounded corners, no shadows, no 3D. One ffmpeg grade for every source: `eq=contrast=1.07:saturation=0.9:gamma=0.97:brightness=-0.01,colorbalance=rs=-0.02:bs=0.03:rh=0.03:bh=-0.02` (cool shadows, warm highlights) + grain 1 at master. Remotion equivalent: `filter: contrast(1.07) saturate(0.9) brightness(0.99)` + a split-tone via SVG feComponentTransfer.
- **typography**: clock Barlow Condensed SemiBold in fixed digit slots, ≤ 132 px (12 % H), T−/T+ at 0.85×, tenths at 0.41× grey, 10-segment sub-second bar (6 px) under it; CJK Noto Sans SC 500/700; Latin Barlow; labels/codes IBM Plex Mono 10–13 px. Transcript: English 30–34 px word by word + CJK line whole. Google Fonts: Barlow Condensed, Barlow, IBM Plex Mono, Noto Sans SC.
- **motion rules**: 30 fps. Each whole second the new digits drop 14 px in 0.12 s (ease-out), sub-second bar empties one segment per 0.1 s (fills after zero). Re-layout 0.34 s easeInOutCubic: surviving cells interpolate rects, new cells open from their left edge, leaving cells close to the left, a 3 px orange border flash ~0.2 s on landing; grid fills one cell per spoken count in 0.30 s; swaps wipe in from the left; photos push ≤ 6 %; names pop 0.16 s apart; documents move one row in 0.45 s, highlight sweeps 0.35 s. Layout changes land on spoken calls, never on music. Never: slow push-ins on video, page turns, centred pop words, speed ramps.
- **signature moves**: `split-grid-countdown` (with `many-into-one` merge), `mission-clock` (with clock inversion + control strip), `live-transcript-box`, `planned-vs-heard-checklist`, `cam-chip-sync-badge`, `event-flag-bar`, second countdown + profile, document by rows.
- **do**: one mapping M = t − T0; honest sync badges ("same window · not frame-synced"); a new element every 1–2 s instead of fake camera moves; music silent 0.25 s before zero; zero = the loudest native sound.
- **don't**: time jumps, re-ordering, speed-ups, security-wall static layouts, colour other than orange/grey in the graphics, proportional clock digits.
- **source**: lemo-opuscar `styles/countdown/` (MIT code, CC BY 4.0 docs); all in `demo/index.html` (`LAY` keyframes, `layoutAt`, `drawClock`, `drawTx`, `drawCheck`, `drawDoc`, `drawProfile`, merge code in `render`).
- **Port note (MIT)**: (1) *layout keyframes*: `LAY = [{t, cells:{id:[x,y,w,h]}, grid?, merge?, cut?, swap?}]`; at time t take current L and previous Lp, k = eio(seg(t, L.t, L.t + dur)) (dur 0.34 / pop 0.30 / merge 0.42); cell in both → lerp rects; only in L → width grows `w·k` from the left edge; only in Lp → width shrinks `w·(1−k)`; swap → new rect covers the old one from the left. (2) *merge many→one*: each grid cell is assigned to its tile of the full frame by its column/row (640×360 tiles for 3×3, spans for wide cells), rects lerp to the tiles with eio over 0.42 s while each tile crossfades to the same full-screen shot; chips/borders vanish in the first half; white flash `rgba(255,248,236,.7)` decaying `exp(−t/0.11)`. (3) *clock*: digits clipped to their line and offset by `−14·(1 − eo(since/0.12))` px scaled with size; inverted state = orange fill, dark ink, header text swap, flash `exp(−6M)`. (4) *control strip*: segment i active fills its width `·eo(seg(t, handT, handT+0.3))` plus a 0.6 s warm flash on hand-over.

### Techniques

#### `split-grid-countdown` — NEW
- look: one shot splits into 2, 3–4, then a 3×3 wall of synced cameras around a big clock as zero approaches; at zero every cell slides to its tile and they fuse into one full-screen picture with a warm flash.
- params: margins 24 px, gutters 8–9 px, re-layout 0.34 s eio, pop 0.30 s, merge 0.42 s, flash τ 0.11 s, dashed "STANDBY" placeholders (6/6 dash) before cells connect.
- build: Remotion component driven by `layouts[{frame, cells}]` keyed by content id; each cell renders any child (video, motion, image) cover-fitted inside a clipped div; `mergeAt`, `mergeTo` (full-screen child). Props `layouts`, `cells{id: ReactNode}`, `chips`, `accent`.
- source: `demo/index.html` `LAY`, `layoutAt()`, `render()` merge branch (MIT).
- value: launches, product drops, election/sports/score countdowns, multi-camera event recaps, "many sources agree" evidence beats.

#### `mission-clock` — NEW (our `number-counter` counts values; `hud-chrome` has a timecode but no countdown state machine)
- look: a T−00:04.0 clock in fixed slots with an orange T−, grey tenths, a ten-segment bar draining each second; at zero it flips to orange with dark T+ and "elapsed" header; a control strip of named segments fills on hand-overs.
- params: digits ≤ 12 % H, drop 14 px / 0.12 s, segments 6 px tall 4 px gaps, flash on inversion `exp(−6M)` 80 % white.
- build: SVG/HTML; props `zeroFrame`, `format` (T−mm:ss.t | HH:MM:SS | match clock), `segments[{label, at}]`, `inverted` colours, `size`; emits tick events per second for the mixer.
- source: `demo/index.html` `drawClock()` (MIT).
- value: launches, deadlines, sales ending, live events, sports; a reusable HUD element.

#### `live-transcript-box` — EXTENDS `kinetic-captions` (new props: `speakerTag` with live dot, `wordTimes` reveal with 0.08 s fade per word, block cursor, `secondLine` whole-cue CJK/translation, `box` cell style, `speakerColors`)
- look: a fixed dark box: red "speaking" dot, speaker type, the English words appearing at their spoken times with a block cursor, the translation line below.
- params: English 30–34 px, CJK larger; cue ≥ max(1.8 s, speech + 0.6 s); narrator tagged in accent so it is never mistaken for native audio.
- build: words from whisper timestamps (`words.json`).
- source: `demo/index.html` `drawTx()` (MIT).
- value: podcasts, interviews, live-stream clips, bilingual subtitles.

#### `planned-vs-heard-checklist` — NEW
- look: a list of milestones with planned times; each ticks with an orange check as the clock passes it; when the audio actually says it, a red "heard −32.1" tag with a tiny waveform icon appears.
- params: rows ~5 % H, tick pop 0.3 s, red tag `#FF3B30`.
- build: SVG list; props `items[{label, sub, planned, heard?}]`, `clockZero`; accent + alert colours.
- source: `demo/index.html` `drawCheck()` (MIT).
- value: launch checklists, project timelines, schedules vs reality, onboarding steps.

#### `cam-chip-sync-badge` — NEW (S)
- look: per-cell chip top-left (square dot, `CAM 4`, localized name, small English) and a badge top-right: `● LIVE SYNC`, `○ SAME WINDOW` (hatched grey), `1× REAL-TIME`.
- params: chip on 84 % dark plate; mono 10–13 px; orange dot = synced, grey = unsynced.
- build: overlay component; props `code`, `name`, `sync:'live'|'window'|'retimed'`.
- source: `demo/index.html` chip/badge drawing (MIT); STYLE.md §8.
- value: honest multi-source footage labelling for any split screen or surveillance/CCTV look.

Also: `event-flag-bar` — EXTENDS `scene-tag` (new variant `flag`: orange bar with black type slides in at the bottom of a cell on its call, held ≥ reading time); second countdown + flight profile — EXTENDS `live-chart` (new prop: a time-axis profile with a marker and a "−1:47 to X" sub-clock).

---

## 12. `crayon-book` — Crayon Picture Book (Hand-drawn & Painting, *The Moon Can't Sleep*, 52 s)

### style `crayon-book` — Crayon Picture Book
- **essence**: a picture-book page drawn live in wax crayon on toothy warm paper; colour spills past outlines, every line boils on twos, a single watercolour wash reveals what white wax was hiding. Drawing and colouring are the plot.
- **palette** (doc = `demo/pal.js`; meas = poster / docs frame / styleboard, all night scenes after the wash):
  - paper `#F4EFE3` (doc) — barely visible after the wash
  - wash ultramarine transmittance (0.15, 0.19, 0.44) (doc) → measured sky `#393E62`, `#454A6E`, `#292E56`, `#54587A` (meas, 75–80 % of frame)
  - outline indigo `#2D3263` (doc; never black)
  - yellow `#F5C63C` (doc) / `#D6AE3C` (meas moon after paper/grain), orange `#EC8A3C`, red `#D4483C` (doc) / `#A6463E`–`#A84742` (meas roof), pink `#EE8EA4`, peach `#F4C7A4`, brown `#7A4B31`, ochre `#E7B867` (meas `#B69355`), green `#62A24C`, sky `#79ACD9`, violet `#6A5AA6`, white wax `#FBFAF4` (doc) — 11 crayons + 1 wash.
- **texture / post** (WebGL2 compositor `demo/gl.js`, all portable): (1) *paper tooth height* = 3 octaves of value noise at scales 1.35 / 2.9 / 6.3 px weighted .34/.33/.21, + horizontal fibre grooves `(vn(x/10, y/1.9) − .5)·.22` + `(vn(x/2.1, y/13) − .5)·.08`; `tooth = smoothstep(.16, .86, raw + .06)`; anchored to the page (pans with camera; across zoom octaves crossfade two scales so grain stays ~1 px). (2) *wax adhesion*: each crayon layer is a canvas with RGB = colour, A = pressure; `thr = 1 − 1.22·pressure`, coverage `smoothstep(thr − soft, thr + soft, tooth)·smoothstep(0, .18, pressure)`, colour ×(1 − 0.10·p²) (heavy = deeper). (3) *watercolour*: density canvas; tide-mark edges `(d − blur_mip4)·edge + (d − blur_mip2)·edge·.6`; cauliflower variation `0.82 + 0.3·lo` (noise at 160/55/19 px); granulation `×(1 + gran·.45·smoothstep(.35, .05, tooth))` in deep pits; **wax resist** `×(1 − 0.93·smoothstep(.12, .55, waxCoverage))`; transmit `mix(1, washColour, d)`, extra darkening above d = 1. (4) *final*: emboss from tooth gradient lit top-left, reduced ×(1 − .55·wax) where wax fills; wax sheen +0.018; warm vignette; low mottling ±2 %. No ffmpeg grain (bloats file).
- **typography**: printed words = Patrick Hand 50–56 px (4.6–5.2 % H) in the outline colour, bottom-centre, each glyph tilted/offset and boiling on twos, written L→R in ~0.35 s on a ragged knock-out paper patch; titles hand-lettered in Gaegu Bold letter by letter. Both on Google Fonts.
- **motion rules**: everything drawn steps at 12 fps (lines, colouring, characters, boil seed `floor(t·12)`); camera, wash leading edge and twinkles at 24 fps. Boil: per stroke re-jitter (< 1 px) every 2 frames; characters full amplitude, background lines ~0.6, background fills still; halve the boil when the film calms. Lines draw on along their length in 0.4–0.9 s; colouring row by row; text letter by letter. Acting by substitution (new drawing per pose on the beat). Crayon can't fade: things leave by camera move, page turn or being coloured over. Transitions: drawing on, colouring over, the wash, pan, page turn; never a dissolve.
- **signature moves**: `wax-resist-reveal`, `crayon-wax-shader`, `crayon-hatch-fill`, `crayon-line-boil`, `book-pullback-turn`, "colouring is an action", child-logic faces on objects.
- **do**: ≤ 12 crayons, outlines one dark non-black colour, one white reserved for resist, ≤ 1 watercolour per film that never paints characters; overshoot outlines by a few px; characters "keep the paper white" (knock-out) behind them; composite characters after the wash; pressure ≥ 0.8 under a wash.
- **don't**: vector clip-art with a crayon filter, black outlines, screen-fixed paper grain, dark subtitle boxes, strings/grand piano.
- **source**: lemo-opuscar `styles/crayon-book/` (MIT code, CC BY 4.0 docs); `demo/gl.js` (shaders), `demo/crayon.js` (line, fill, text), `demo/rig.js`, `demo/end.js` (page on desk, page turn), `demo/pal.js`.
- **Port note (MIT)**: the four shader stages above are self-contained GLSL math (value noise + smoothstep thresholds + mip-blur differences) and can be ported to a three.js `ShaderMaterial` / OGL pass almost verbatim in our own words. *Hatch fill* algorithm: rotate the polygon so hatching is horizontal (angle ≈ 0.62 rad ± boil jitter 0.035), scan rows with gap ≈ 10.5 px ×(0.8 + 0.4·hash), intersect edges to get spans, join consecutive single-span rows that overlap into one zig-zag polyline (alternating ends), extend each end by an overshoot ≈ 7 px × random(−0.15..0.95), jitter row y by ±0.35·gap per boil step; draw each segment twice (width w at α 0.62·p, width 0.42w at α 0.30·p) with per-segment pressure p·(0.72 + 0.42·hash) so strokes stay visible; `draw` 0..1 cuts the total length for row-by-row colouring; optional cross pass at +1.25 rad with 0.7 pressure. *Crayon line*: resample the polyline to 3 px steps, offset by a low-frequency hand wobble (vnoise) of 1–2 px, width ±15 %, tapered ends, a denser core plus 1–2 thin streaks.

### Techniques

#### `wax-resist-reveal` — NEW (signature; no equivalent in our `watercolor` style or motions)
- look: a page that looks almost blank in places; a broad watercolour wash sweeps across and hundreds of white-crayon stars or a hidden message appear — the wash cannot stick to wax.
- params: wash ultramarine (0.15, .19, .44) or rose / sap green; resist 0.93; edge pooling 1.6; granulation 0.6; band brush with bristle streaks α ≤ 0.12 and a darker wet leading edge; sweep ~2–3 s on a held wide; glockenspiel note per uncovered star (`glint` events).
- build: Option A (exact): WebGL pass (port of `FS_WASH`) with a wax-coverage texture from the white-crayon layer. Option B (SVG): wash = animated mask (brush-band path growing) over a multiply-blended colour layer, with the white marks drawn *above* the wash masked by the same wash mask so they appear exactly as it passes; edge darkening via feMorphology/feGaussianBlur difference. Props `hidden` (SVG paths/text), `washColor`, `direction`, `duration`.
- source: `demo/gl.js` `FS_WASH`, DEMO.md "wax resist" (MIT / CC BY 4.0).
- value: reveal of a hidden message / product feature / thank-you names; kids' brands, greeting cards, education.

#### `crayon-wax-shader` — NEW (style filter; our `pencil-sketch` / `watercolor` styles lack paper-tooth adhesion)
- look: any drawn layer looks like wax crayon on toothy paper: speckled at light pressure, near-solid at heavy, embossed paper grain.
- params: tooth octaves 1.35/2.9/6.3 px + fibre grooves; threshold `1 − 1.22p`, soft ±; emboss strength; mottling ±2 %; vignette warm.
- build: wrapper `<CrayonPaper pressure>` applying a WebGL shader to its child, or a cheaper SVG approximation: `feTurbulence` (baseFrequency ~0.5/0.25, 3 octaves) → `feComponentTransfer` threshold driven by the child's alpha → `feComposite in` + `feDiffuseLighting` emboss. Props `paperColor`, `pressure`, `toothScale`, `emboss`.
- source: `demo/gl.js` TOOTH + layer shader + final composite (MIT).
- value: a whole new hand-made style layer for every flat motion; add as a `crayon` entry in `styles.json`.

#### `crayon-hatch-fill` — NEW
- look: areas coloured with visible back-and-forth zig-zag strokes overshooting the outline, each pass a slightly different pressure, optional lighter cross-hatch; fills progressively row by row.
- params: angle 0.62 rad, gap 10.5 px, width 11 px, overshoot 7 px, pressure 0.62 default, cross +1.25 rad at 0.7 pressure, boil every 2 frames.
- build: pure TS geometry (scanline spans → zig-zag polylines, port note) emitting SVG `<path>`s with stroke-dasharray for `draw` progress; props `polygon`, `color`, `pressure`, `angle`, `gap`, `overshoot`, `cross`, `progress`, `boil`.
- source: `demo/crayon.js` `fill()` (MIT).
- value: "colouring in" as an action (filling a chart bar, a map region, a product silhouette); pairs with `heart-draw-fill` and `perspective-grid`.

#### `crayon-line-boil` — EXTENDS `line-draw-on` (new props: `medium:'crayon'`, `boilFps` 12, `wobble` 1–2 px, `taper`, `streaks`, `pressure`)
- look: hand-drawn crayon outlines that draw on and then keep gently boiling.
- params: resample 3 px, wobble 1–2 px, width ±15 %, taper both ends, boil seed `floor(frame/2)`.
- build: our line-draw-on path renderer with a per-boil-step seeded offset + an SVG turbulence-displacement filter whose seed changes every 2 frames.
- source: `demo/crayon.js` `line()` (MIT).
- value: hand-made feel for any line art, captions, doodles.

#### `book-pullback-turn` — EXTENDS transition `page-turn` (new props: `pullBack` — the full frame shrinks into a page of a book lying on a desk with crayons beside it, then the page turns to an end card; per-strip affine page curl)
- look: the one-take page is revealed to be a physical book; the page turns to "The End".
- params: pull-back ~2 s ease-in-out; page turn with per-strip affine transforms (avoid rectangle staircase); vignette/emboss only on the outer scene during the transition.
- build: scale the scene into a rect inside a desk plate (procedural wood + paper shadow); reuse `page-turn` for the turn.
- source: `demo/end.js` (MIT); STYLE.md §9 pitfalls.
- value: storybook endings, "chapter two" beats, year-in-review closers.

---

## 13. `dark-keynote` — Dark Tech Keynote (Information & Keynote, *Room to Think*, 42 s)

### style `dark-keynote` — Dark Tech Keynote
- **essence**: a software launch film where the UI is the star: near-black stage, hairline grid, soft cool light, one brand accent, every element snapping to the grid on the beat; generated chaos → one decisive action → light reveal → one giant number → put-away.
- **palette** (doc = `demo/engine.js` `PAL`; meas = poster / docs frame / styleboard):
  - stage `#0A0B0F` (doc) / `#0A0A0F` (meas, 54 %) with radial lift `#151822` at upper centre; cool glow `#3B4CCA` at 8 % (top-right)
  - surfaces `#12151C`, `#1A1E28`, `#222734` (doc); meas `#101219`, `#1A1D25`; border `rgba(255,255,255,.08)`, inner highlight 10 %
  - text `#E8EAF0` / dim `#8A90A0` / mute `#5C6272` (doc)
  - one accent: lime `#B7F34A` (default; meas as glow ring/cursor ~1 %), alternatives violet `#8B7CFF`, orange `#FF7A1A`
  - problem red `#FF5A5F` (badges only while the problem exists)
  - generated thumbnails supply the only warm colour: `#F4A466`, `#B8764E`, `#96C2F0` (meas).
- **texture / post**: no grain; stage = base fill + radial gradient (centre (0.5W, 0.34H), radius 0.75W, `#151822` at 95 %→0) + cool glow at (0.78W, 0.12H) r 900 px α 0.08 + 50–55 % corner vignette. Grid: 48 px module, minor lines white 3.2 %, every 4th line 6 %, pixel-snapped (+0.5), follows the camera. Panels: rounded rect, soft shadow (offset variant for hundreds of items), top-lit fill, 1 px border 8 % white, 1 px inner top highlight. Depth blur scales with 2.5D magnification. Light reveal: only swept pixels light up (base 7 %), soft front 260 px, glint ≤ 20 % (code default 0.5 used sparingly).
- **typography**: Inter (UI, captions ~40 px = 3.7 % H, headlines), Inter Tight 600 for giant numbers (tracking −4.5 %), JetBrains Mono for labels/filenames/status (wide tracking in small caps). Title in poster: Inter ~140 px (13 % H) with the lime cursor as brand mark; subtitle mono tracked ~0.3 em. Google Fonts: Inter, Inter Tight, JetBrains Mono.
- **motion rules**: 24 fps on ones, no stepping, no boil. Everything lands on the grid and on the beat; moves start a beat early. Easing: fast-out with one small overshoot (`back`, s ≈ 1.3–1.35) + immediate settle; rotation via `spring(k=9, z=0.42)`. Spawns 0.2–0.3 s, one motion type per element type (drop+bounce, fling, slide-in, pop). Cursor acts: ≥ 8 frames wind-up, 2-frame contact, squash/stretch, spring follow-through; blinking on the beat. Disappearing is designed (retract one part per beat, CRT-off squash). Transitions = UI expand/collapse; an expansion on a beat starts one frame early (~80 % open on the beat). Camera: 2.5D `s = 1/(1/zoom − z)`, continuous log-space pull-back keyed per bar, push-in through freeze, whip pull-out in one beat, log-zoom dive + match cut.
- **signature moves**: `ui-accumulation-storm`, `snap-grid-collapse`, `light-reveal-sweep`, `glyph-scramble-number`, `ui-freeze-silence`, `caption-toast`, `ui-put-away`, `type-stream-trails`, `cursor-protagonist`.
- **do**: one accent per film reserved for the product; problem colour disappears after the turn; generate the mess by rule and trim/pad groups to exact slot counts; typed destinations + curved paths + trails instead of nearest-slot snapping; lift content while captions are up.
- **don't**: real OS chrome (traffic lights, docks, menu bars), scanlines/hologram, grain, floaty sine drift, flat tinted rectangles for "closing", hard white glints, strip-perspective of semi-transparent canvases.
- **source**: lemo-opuscar `styles/dark-keynote/` (MIT code, CC BY 4.0 docs); `demo/engine.js` (bg, grid, panel, litShape, trail, caret, UI kit, flyPose, motionBlur, lightReveal, perspective, scramble, toast, camera), `demo/world.js` (264-element generator, snap targets), `demo/timeline.js` (note tables), `demo/film.js`.
- **Port note (MIT)**: (1) *flyPose*: position `lerp(from, to, back(p, 1.35))`, rotation `lerp(…, clamp(spring(1.2p, 9, .42)))` with `spring(t,k,z) = 1 − e^(−zkt)·cos(k√(1−z²)·1.6t)`, scale `lerp(…, eo(p))`, morph `ss(seg(p, .15, .7))`. (2) *motionBlur*: draw n samples at p − span·k/(n−1), newest opaque, older at alpha `0.5(1−k/n)/(n−1)·2.2`. (3) *lightReveal*: project onto the band normal (angle 0.62 rad); total length L = |w cos| + |h sin|; front = −soft + p(L + 2·soft); draw the source at base alpha, then a copy masked (`destination-in`) by a linear gradient from opaque at front−soft to clear at front; add a `source-in` white gradient band (glint) at the front with `lighter`. (4) *strip perspective*: rotate a flat card about Y by drawing ~96 vertical slices, each scaled by f = D/(D + X sinθ) with D = 2.2w (project the opaque surface, light afterwards). (5) *scramble*: before its lock time each digit shows a glyph from `0-9#%/*+=<>?$&@ABCDEFXZ` chosen by hash(frame, i) drawn 3× with alphas .85/.3/.14 offset upward 9 % of px (vertical motion blur); after lock, a damped drop `−0.12px·e^(−14d)cos(40d)` for 0.3 s. (6) *2.5D camera*: s = 1/(1/zoom − z), clamp when 1/zoom − z ≤ 0.02; objects nearer the lens move faster (parallax) and should blur by magnification.

### Techniques

#### `snap-grid-collapse` — NEW
- look: hundreds of scattered notifications, files and photos fly along curved, typed paths with coloured trails into a perfect grid in one beat; each type to its own rows; grid lines and container appear only then.
- params: flight per element p over ~0.5–0.8 s staggered by type row; back(1.35) overshoot along final tangent; same-type paths bend the same way; trails per category desaturated; groups trimmed/padded to exact slot counts.
- build: Remotion component; items `[{type, from, renderer}]` → `snapGrid(cols, rows, tile, gap)` slots → `assignSlots` by type then index; per-item `flyPose`; trails as SVG polylines of the last k positions (analytical, deterministic). Props `items`, `grid`, `beatFrame`, `trail`, `accent`.
- source: `demo/engine.js` `snapGrid`, `assignSlots`, `flyPose`, `trail`; `demo/world.js` (MIT).
- value: "we organise it all" promise for SaaS, CMS, schedulers, file managers, inbox tools.

#### `ui-accumulation-storm` — NEW (our `browser-mockup`, `chat-bubbles`, `sms-thread` show single UIs; nothing generates escalating UI noise)
- look: notification cards, file icons, tabs, photo tiles, red badges spawn faster and faster (on score notes), piling up with depth and drift until the screen is overwhelmed; optional freeze mid-air.
- params: 264 elements in the demo; spawn types drop+bounce / fling / slide-in / pop in 0.2–0.3 s; tremble of a few px for tension; spawn times from a phasing note table (second voice drifting); depth z for 2.5D parallax + blur.
- build: seeded generator `(seed, count, accel) → [{t, type, x, y, z, rot}]`; render with a lightweight UI kit (notif, fileIcon, photo, badge, window); `freezeAt` stops all poses; props `density`, `kinds`, `spawnTimes` (optional external beats), `freeze`.
- source: `demo/world.js`, `demo/engine.js` UI kit (MIT).
- value: the "problem" act of every SaaS ad/explainer; pairs with `snap-grid-collapse` as cause → effect.

#### `light-reveal-sweep` — EXTENDS `light-sweep` (new props: `mode:'reveal'` — only swept pixels turn on, `base` 0.07, `soft` 260 px, `angle` 0.62 rad, `glint` ≤ 0.2, `keep`)
- look: a product window sits at a few percent brightness; a soft diagonal band of light passes and leaves it fully lit, a faint glint riding the front.
- params: sweep ≤ ~1.3 s; band 90 px glint; base 7 %.
- build: CSS `mask-image: linear-gradient(...)` with animated position over the lit copy, unlit copy at opacity 0.07; glint = second gradient layer `mix-blend-mode: plus-lighter` masked by the content alpha.
- source: `demo/engine.js` `lightReveal()` (MIT).
- value: hero reveals of dashboards, pricing pages, devices, logos.

#### `glyph-scramble-number` — EXTENDS `number-counter` (new prop `mode:'scramble'`, `locks[]` per character, glyph set, vertical blur trail, spring drop)
- look: a giant number made of flickering glyph noise that locks into the answer digit by digit, each landing with a tiny bounce.
- params: 24 fps glyph change; trail alphas .85/.3/.14 offset 9 % of size; lock on sixteenth notes; drop amplitude 12 % size, decay 14/s, 40 rad/s; Inter Tight 600 tracking −4 %.
- build: per char span with fixed advance; seeded glyph per frame.
- source: `demo/engine.js` `scramble()` (MIT).
- value: the one-stat screen of any keynote; also a stronger variant of `glyph-orbit-logo`'s scramble.

#### `caption-toast` — EXTENDS `kinetic-captions` (new variant `toast`: bottom-centre dark translucent pill, 1 px light border, accent "speaking" dot with glow, 0.16 s rise + fade, `dense` opacity when busy)
- look: captions styled as a UI notification pill.
- params: pill height 1.9× font, padding 1.2× font each side, fill `rgba(12,14,19,.72→.88)`, shadow 40 px blur 10 px offset, dot r 0.14× font.
- build: HTML div; reusable for any tech/UI-themed video.
- source: `demo/engine.js` `toast()` (MIT).
- value: subtitle style for SaaS demos and product films.

Also: `ui-put-away` — NEW (S): the UI dismantles one part per beat (retract, CRT-off squash to a point) until one element remains — endings for focus/"less" stories; `cursor-protagonist` — EXTENDS `bouncing-ball` (new subject `caret`: blinking text cursor with squash/stretch, ≥ 8-frame anticipation, 2-frame contact, trail) — a brandable living element; `perspective-card-turn` — NEW (S): strip-rendered Y-rotation (≤ 24°) of any flat card with a light sweep, the "product turns on stage" shot without 3D; hairline stage + grid backdrop — EXTENDS `hud-chrome`/new style token `dark-keynote` in `styles.json` (bg, three surfaces, 48 px grid).

---

## 14. `data-physical` — Data Physicalization (Evidence Films, *Two Spirals*, 39.4 s)

### style `data-physical` — Data Physicalization
- **essence**: real statistics built as real objects — every unit a countable plate/block/coin stacked to exact scale on a crafted base, lit like a studio product shot (warm low key, cool rim, shallow depth of field, PBR materials); growth is assembly, and the chart is finally revealed as an installation.
- **palette** (doc = STYLE.md §3 example + `demo/set.js`; meas = poster (top view) / styleboard (macro stack)):
  - seamless sweep greige `#C4BEB4` (doc); measured backdrop `#E7D8C8`, `#D8CBBB`, `#E5D9CB` (meas, 60–70 % — warmer/lighter than doc because of the key light and vignette)
  - walnut base (texture, tint `#A88D78`) → meas `#604934`, `#463322`, `#59422E`
  - aluminium (solar) `#C8CCD1` metal 1 rough .27 (doc) → reads grey-taupe `#968065`/`#AEA49B` from above (meas)
  - acrylic (wind) `#9FD3D6` transmission .72, attenuation `#5FB3B8` (doc) → meas teal-grey stack tops
  - brass ruler `#D2B07A` (doc) / `#AF7A28`–`#A77426` (meas); brass puck top `#DCBD86`
  - ink `#1C1D20` (doc); accent signal orange `#D4521C` (doc) — verdict line/leader, meas `#CF9573` blended
  - floor `#BFB8AD`, inlay `#EFE4CF` (code).
- **texture / post**: three.js r170 via `core/three/post.js`: MSAA + GTAO ambient occlusion (radius .25, scale 2.5, amount .85) → physical depth of field (CoC = aperture·(1/focus − 1/z) clamped, 96-tap golden-angle spiral gather, background samples limited to the centre's own CoC so blur never spreads over a sharp foreground) → UnrealBloom (0.2, .5, 1.6) → vignette/grade (vignette 0.35 with x stretched 1.25, warm ×(1.06, 1, .9), soft contrast `c(1+k)/(1 + k·c/(c+.6))`) → OutputPass, rendered at 2× and downsampled. Lighting: low-intensity HDRI for reflections only, warm key at 20–35° elevation with long soft shadows, 1–2 cool rims. Pieces: InstancedMesh thin boxes, each with mm-scale random offset (`jt`, `jr`), yaw jitter, ±7 % value change and a hairline gap. Light grain only (pale background), no flares/CA.
- **typography**: light grotesk for numbers — Inter 200–300 (hero reading 130–170 px = 12–16 % H; stack reading 46–56 px); labels/verdicts Noto Sans SC 500 24–46 px; mono for units, years, source line (20–24 px; the poster uses a JetBrains-Mono-like mono for the inlaid years); serif title only (poster: Noto Serif SC-like heavy serif ~90 px). Google Fonts: Inter, Noto Sans SC, Noto Serif SC, JetBrains Mono / IBM Plex Mono.
- **motion rules**: 24 fps on ones; camera never stops (2–5 % creep on holds). Cascade: stack assembles bottom→top in 0.5–1.0 s, each piece drops a few cm with ease-out (y offset 0.12·(1 − eo(u))). Feed: pieces arrive from out of frame with quintic ease-out `(1−u)^5` on height (1.0 unit), yaw unwinding ±(0.35–0.6) rad, small tilt/translation that settle; 8–16 pieces/s; counter driven by *landed* count, not time. Heavy last object: gravity `y = h·(1 − u²)`, one tiny damped bounce `0.012·e^(−9b)·|sin(26b)|`. Readings fade + rise 16 px and draw their leader; leave by fading. Base, landed pieces and rulers never move. One continuous take; no cuts to charts, no wipes.
- **signature moves**: `stack-plates-3d` (unit close-up, paired climb, feed), `chart-to-installation`, `last-object-drop`, `pinned-reading-label`, `verdict-plate`, `source-line`.
- **do**: one unit = one object, rule stated on screen once; a heavier ruler material every 10th unit; materials (not paint) separate series and must read at thumbnail size; every number with its source in frame; tie counters to the object count; acrylic roughness ≥ 0.2.
- **don't**: scaling/morphing bars, icons or flat colour coding, glows/outlines/fake UI, dark mode, rainbow palettes, lens flares; readings over the subtitle strip; verdict before readings have been still ≥ 2.5 s.
- **source**: lemo-opuscar `styles/data-physical/` (MIT code, CC BY 4.0 docs); `demo/set.js` (buildSet, SHEETS, landed, pose, update), `demo/film.js` (camera keys via `track()`, reading kit), `core/three/post.js`, walnut textures in `core/assets/polyhaven/` (CC0).
- **Port note (MIT)**: (1) *schedule-as-data*: precompute every sheet `{series, k, t0, land, mode, jitter}`; pose is a pure function of t, so `landed(series, t)` = count of sheets with land ≤ t — counters and foley read the same table. (2) *pose*: before t0 hide; cascade mode `y = base + TH(k+.5) + .12(1 − eo(u))`; feed mode `f = (1−u)^5`, `y += 1.0f`, `yaw += ±(.35 + .25·hash)·f`, translate/tilt jitter × f. (3) *DoF gather* in `core/three/post.js`: CoC in alpha, 96 samples at radius `maxCoc·√((i+.5)/N)` angle `i·2.39996`, weight `smoothstep(r−1.5, r+.5, |coc_s|)/(coc_s²+1)`, background samples clamped to the centre CoC — ports directly to a `@remotion/three` EffectComposer pass. (4) *soft contrast* tone curve and the stretched vignette above.

### Techniques

#### `stack-plates-3d` — NEW (our `iso-bar-chart` / `iso-blocks-3d` are clay bars that grow; nothing builds values from countable pieces)
- look: data series as stacks of real thin plates (brushed aluminium, teal acrylic, brass every 10th) on a walnut base; stacks assemble piece by piece; the newest period's increase is fed one plate at a time while a pinned reading rolls with the landings.
- params: unit = one plate (e.g. 10 GW), ruler every 10th; cascade 0.5–1 s; feed 8–16 plates/s, quintic ease-out, yaw unwind; hairline gaps, ±7 % value jitter; GTAO + DoF + warm key/cool rim.
- build: `@remotion/three` scene; `InstancedMesh` per material; deterministic schedule from props `series[{label, material, values[]}]`, `unit`, `rulerEvery`, `layout:'row'|'spiral'|'grid'|'map'`, `feedIndex`; `landed()` drives counter + emits `EV` for foley (tick per plate, pitched note per ruler plate on a pentatonic ladder). Materials as presets (`aluminium`, `acrylic`, `brass`, `oak`, `stone`, `copper-coin`).
- source: `demo/set.js` (MIT), `core/three/post.js` (MIT), STYLE.md §5/§8 (CC BY 4.0).
- value: premium annual-report / ESG / investor / energy / budget visuals; very high perceived quality for data.

#### `chart-to-installation` — NEW (camera move + composition; EXTENDS nothing we have)
- look: after close readings, the camera cranes back and up to a ~70° top view and the stacks read as a dial/skyline/table piece; the base's inlaid tick ring and years become the typography.
- params: crane ~4 s eased; target offset left to leave room for an end card; inlaid marks rendered to a canvas texture (alpha map, polygonOffset) on the base.
- build: camera keys via monotone cubic `track()` (Fritsch–Carlson, in `core/lib.js`) — port as a TS util for all our 3D motions; props `bases:'dial'|'map'|'table'`, `inlay` labels.
- source: `demo/film.js`, `demo/set.js` inlay; `core/lib.js` `monotone`, `track` (MIT).
- value: signature ending for any 3D data piece; summary shots.

#### `last-object-drop` — NEW (S/M)
- look: a single brass puck engraved with the final number falls into the centre with gravity, one tiny bounce, shadow tightening; a 0.3–0.6 s suck-out of all sound before it lands.
- params: fall 0.5 s `y = 2.6(1 − u²)`, bounce `0.012·e^(−9b)|sin 26b|`, yaw unwinding 0.9 rad·(1 − eo(u)); engraving via canvas texture on the top face.
- build: three.js cylinder with brass PBR; props `value`, `label`, `material`, `dropAt`; also usable in 2D as SVG coin with drop shadow.
- source: `demo/set.js` `update()` puck branch (MIT).
- value: totals, ratios, "target met" endings.

#### `pinned-reading-label` — EXTENDS `callout-labels` (new props: `worldAnchor` projected every frame through the camera, `swatch` of series material, translucent paper plate 84 %, `stackPair` (two readings in one column, larger on top), safe-box clamping, `source` line)
- look: dot on the object, 1.4 px leader, small material swatch, category line, then a light-weight big value + unit on a paper plate; a verdict plate in the accent with a growing underline in the upper-left third.
- params: value 46–56 px (hero 130–170 px), rise 16 px fade-in, verdict only after readings still ≥ 2.5 s; source line 20–22 px ink 60 % in a corner.
- build: world→screen via three.js `Vector3.project` each frame; HTML overlay.
- source: `demo/film.js` reading kit (`pairLabels`, `verdict`, `plate`, `swatch`) (MIT).
- value: any 3D motion that needs data labels stuck to objects (pointcloud-orbit, terrain-build-3d, iso charts).

Also: `studio-dof-post` — EXTENDS `film-look` for 3D motions (new props: physical DoF with focus distance + aperture, GTAO, warm/cool grade, 2× supersample) — a shared `@remotion/three` post stack worth porting once for all our 3D motions.

---


## 15. `dataviz` — Data Storytelling (Information & Keynote, demo *A Hundred Summers*, 50 s)

### style `dataviz` — Data Storytelling (pencil on cream chart paper)
- **essence:** one real dataset drawn mark by mark on cream paper by an on-screen red–blue pencil; handwritten notes pinned to data points; every movement is a chart operation (mark lands, axis grows, rescale, morph). The chart is the camera, the rhythm and the plot.
- **palette** (M = measured with PIL from poster / docs frame / styleboard; D = documented in DEMO.md / engine.js):
  - bg paper `#F6F3EC` (M 81–92 % of every frame, D identical) · dot grid `#E4DDCF` (D, 24 px pitch) · gridlines `#DDD6C9` (D) · zero line `#BDB4A5` (D)
  - ink `#2B2723` (D; M dark text ~`#2d2a26`) · tick text `#6E665C` (D)
  - blue pencil (memories, human notes) `#2F5D8A` (D) · red pencil (records, warnings) `#A8283A` (D; M `#9e1527`/`#cb4d44` in the stripes)
  - diverging value ramp (D, ColorBrewer RdBu): `#2166AC #4393C3 #92C5DE #D1E5F0 #F2EEE8(centre) #FDDBC7 #F4A582 #D6604D #B2182B #7A0F1E(beyond +1)`; measured in the stripes frame: `#428fbf #66a8ce #87bdd9 #add1e5 #d4e3ea … #f9d7c5 #ee9d7f #da6a58 #cb4d44 #9e1527` (matches the ramp after JPEG).
  - pencil wood `#E3C79C` (D) · one non-data accent spark `#D97757` (D)
- **texture / print / post-process:**
  - Paper tile 512² built once with a seeded PRNG: base fill, per-pixel noise ±2.5 plus a low-frequency "cloud" term `sin(u·.785+sin(v·.785)·1.3)·.5 + sin(v·1.57+1.3)·.3` scaled ×2.2 (blue channel ×0.9 → warm), then 900 fibre strokes 3–17 px long, width 0.6–1.2, half `rgba(120,100,70,.07)` half `rgba(255,255,255,.35)`. Pattern-filled in WORLD space so it moves with the camera. Dot grid 24 px drawn in world space too (radius ∝ 1/√zoom so dots stay ~1.4 px).
  - Pencil stroke: resample polyline every 2.5 px; offset each point along the normal by `(vnoise(arcLen·.02 + seed·13.1) − .5)·2·wobble·width` (low-freq wobble); 2 passes (2nd pass offset ±width/4, alpha .45, width .6); per-segment alpha × `1 − grain·hash(i)` (graphite break-up); taper `min(1, f·8, (1−f)·8+.35)` on width; `progress` clips by arc length and returns the tip so the pencil prop can ride it.
  - Handwriting: glyphs rasterised once per string into an offscreen canvas with per-glyph rotation ±1.7° and baseline ±2.5 %, then a grain tile punched out with `destination-out` (~16 % of pixels knocked out). Reveal = clip rect growing left→right; the returned tip dances over the x-height: `y − size·(.28 + .22·(sin(f·.55)·.5 + sin(f·1.31+1)·.3))`.
  - Ink shapes: flat ramp fill + 45° graphite hatch every 7 px at alpha `hatch·(.5+.5·hash)` clipped to the shape, then a 2-pass pencil outline.
  - No grain in mux (vector style).
- **typography:** Newsreader (Google) — chart headline 66 px world (≈6 % H) and figure-caption subtitles 42 px (3.9 % H, left-aligned at x=180, baseline y≈985, hairline rule above, ≤2 lines); IBM Plex Mono 17–20 px (1.6–1.9 % H) ticks and kicker (`1926–1958`); Caveat 30 px world (2.8 % H) handwriting in pencil colours. Title typesets letter by letter (each glyph fades and settles from +25 % size below).
- **motion rules:** 24 fps on ones; the data rhythm IS the music grid (90 BPM chosen so a 1/32 = exactly 2 frames). Accelerate by subdividing (quarters → eighths → sixteenths → 32nds), not by tempo. Rescale = ratchet: 4 steps on 1/32 notes each eased over .09 beat (a calm rescale is smooth). Dot landing pop .25 s (×1.55 via `1 + .55·sin(πk)·(1−.4k)`), ripple ring .6 s growing to r·3.6, suppressed if marks closer than .1 s. Pencil acting: lift before tap, shadow meets tip on contact, tremble at peaks, flinch = freeze ½ beat then .5 s end-over-end flip to red end. No fades/dissolves — transitions are chart operations; one hard cut in the whole film, into silence.
- **camera:** 2D `{x,y,zoom,roll,shake}` over one sheet. ECU 4× on first dot → pull to 1.55× as axis grows → track with newest mark at ~62 % W → pedestal + Dutch creep (0 → −1.5°) → 2-frame punch-in 1.22→1.42× with decaying shake → fast pull-out 1.0× + roll −3° + 2 px tremor → locked-off for morph. Frozen-pane tick strip when the real axis scrolls off.
- **signature moves:** `pencil-chart-draw`, `pinned-hand-annotation`, `dot-to-stripes-morph`, `axis-ratchet-rescale`, `frame-break-spike`, `empty-next-cell`, `red-blue-pencil-performer`.
- **do:** one idea at a time; colour encodes only the value; notes pinned in data space (value + px offset) so rescales keep layout; keep pale values pale; select data columns by header name.
- **don't:** dashboards, slides, decorative colour, stretched ramps, ripples in dense passages, captions over a morph or a silence; pencil body lying across fresh marks (steepen its angle).
- **source:** lemo-opuscar `styles/dataviz/` (MIT code, CC BY 4.0 docs) — `STYLE.md`, `DEMO.md`, `demo/engine.js` (paperTile, pencilStroke, handText, textImage, dataDot, morphMark, inkShape, drawPencil), `demo/music/score.py` (sonification `midi = 62 + (v+.4)·17`, pentatonic snap below centre).
- **Port note (MIT):** `pencilStroke` (resample → normal-offset value-noise wobble → 2 passes → hash-alpha grain → taper → arc-length progress returning the tip) is ~30 lines and ports directly to an SVG/canvas `PencilPath` in `src/core/sketch-kit.tsx`. The dot→stripe morph is pure math: with u∈[0,1], `fall = smoothstep(u/.45)` moves the dot's y to the band centre, `grow = easeOutCubic((u−.3)/.7)` lerps x to the cell centre and size from 2r×2r to cellW×bandH, corner radius r→0 at 1.5×grow, ring alpha 1−grow. The unclosed hand ring = 48-point polar curve with `turns≈1.12`, radius `r·(1 + .08 sin(5t+seed) + .06t)`, x stretched ×1.08. The diverging ramp is `u = (v − centre)/half` mapped to the 10-stop RdBu list.

### Techniques
#### `pencil-chart-draw` — EXTENDS `live-chart` (new props: `mode:'pencil'`, `paper`, `pencilProp`, `markRing`, `rhythmGrid`)
- look: a dot-and-line series is drawn left to right by a real-looking hex pencil (blue/red halves, wood cone); each data dot pops with a thin ink ring and a faint ripple; the line is a wobbly graphite stroke, not a vector line.
- params: dots r 6 px + 1.5 px ink ring; pop .25 s ×1.55; ripple .6 s to 3.6 r; series line 2.4 px; axes 1.4–1.6 px; pencil enters from lower right at 35–58°, shadow offset grows with lift (lift 0–1.2, scale ×(1+.35·lift)); mark cadence follows a subdivided beat grid (¼ → ⅛ → 1/16 → 1/32 notes).
- build: SVG `<path>` per segment with wobble computed from seeded value noise along arc length; reveal via arc-length `progress`; `PencilProp` component (hex body, two-colour halves, cone, lead) positioned at the returned tip; `flip` prop rotates end-over-end around a pivot 180 px up the body (`scaleX = cos(πflip)`), switching blue→red past 0.5.
- source: lemo-opuscar `styles/dataviz/demo/engine.js` (MIT), DEMO.md "Motion numbers".
- value: any data film/explainer where "a human drew this" warmth matters (reports, climate, finance, education).

#### `pinned-hand-annotation` — EXTENDS `callout-labels` (new props: `hand:true`, `leaderBend`, `ringTurns`, `pencilColor`, `pinSpace:'data'`)
- look: a handwritten note (Caveat, blue for human memories, red for records) is written left to right while a wobbly curved leader runs to an un-closed hand-drawn ring around one data point; small doodles (three-curl wave, heart) may follow the text.
- params: Caveat 30 px world; glyph jitter ±1.7° / ±2.5 % baseline; grain knock-out 16 %; leader = quadratic Bézier with control offset `bend .22` perpendicular to the chord, width 1.4, wobble .4; ring turns 1.12 starting at −2.2 rad; right-aligned notes still write L→R (pencil hops to the first letter, 16 % of the text phase).
- build: text rasterised to `<image>`/offscreen canvas or SVG `<text>` with per-glyph transforms + an SVG mask that grows; leader and ring via `PencilPath`; positions given in data space and converted every frame through the chart scale so notes follow rescales.
- source: `styles/dataviz/demo/engine.js` (`handText`, `leader`, `ringPath`, `wavePath`, `heartPath`).
- value: annotate any chart, map or screenshot with human notes; agent can pin notes to values instead of pixels.

#### `dot-to-stripes-morph` — NEW
- look: a finished dot-and-line chart sweeps, mark by mark from left to right, into a full-height "warming stripes" band: each dot falls to the band centre, stretches into a coloured stripe and loses its ring; line segments fade as their left dot starts; notes return as tiny pencil ticks above the band.
- params: sweep over 0.85 beat total; per-mark u: fall in first 45 % (smoothstep), grow from 30 % (ease-out cubic), radius → 0 at 67 %; stripe colour = diverging ramp of the value around a reference mean with symmetric half-span (demo centre 0.22 °C, half .85 °C).
- build: one React component taking `values[]`, `centre`, `half`, `t0`, `sweep`; per-mark local u = `clamp((t − t0 − i·stagger)/dur)`; draw `<rect rx>` with interpolated centre/size; optional `stripesFill(path)` to fill any closed SVG shape (a country, a logo) with stripes.
- source: `styles/dataviz/demo/engine.js` `morphMark`, `stripesFill`, `valueColor`, `rampRGB`; DEMO.md Morph.
- value: climate/finance/health "the whole century in one band" reveal; brand-safe because the ramp centre/colours are props.

#### `axis-ratchet-rescale` — NEW
- look: a new value overshoots the plot box and pierces the top frame line (torn edge stays as a scar); the y axis rescales in 4 ratchet clicks, every tick label and mark sliding to its new position each click; camera punches in over 2 frames with decaying shake.
- params: hold the pierced state ≥ ½ beat (a break rescaled after .17 s was invisible); 4 steps on 1/32 notes, each eased over .09 beat; punch zoom ×1.16 over 2 frames + shake decaying; second (calm) rescale is smooth.
- build: scale domain = keyframed `track()` of discrete steps with per-step `eio`; all marks re-projected from data each frame; scar = small zig-zag break path left in the frame line at the pierce x.
- source: `styles/dataviz/STYLE.md` §5–§8 "Breaking the frame", DEMO.md Shots.
- value: "record-breaking" moments (viral spike, price bubble, flood) in any chart motion; pairs with `number-counter`.

#### `empty-next-cell` — NEW (small)
- look: a dashed pencil rectangle draws itself around its perimeter as the slot for the value nobody knows yet, with a handwritten "?" label; can widen into an end card (frame within frame).
- params: dash 9 / gap 7, width 1.6, red pencil; drawn over ~1 s by perimeter progress.
- build: SVG rect with `stroke-dasharray` + a perimeter-progress mask; `widen` prop interpolates the rect to the full frame.
- source: `styles/dataviz/demo/engine.js` `dashedCell`.
- value: forecasts, "what's next" end cards, upcoming launches.

---

## 16. `engraving` — Copperplate Engraving (Print & Printmaking, demo *The Honeybee, Plate VII*, 40 s)

### style `engraving` — Copperplate Engraving (natural-history plate)
- **essence:** an intaglio plate that engraves itself: a burin cuts swelling lines, a proof is pulled, the figure builds outline → hatching → cross-hatching → darks, magnified roundels fly to the margins, then transparent hand-colouring blooms under the ink. Tone is ONLY line density; every line swells and tapers.
- **palette:**
  - paper `#F1E8D2` (D sheet) / `#EFE6CF` (D engine) — M dominant `#ddcfad` 56–58 % (plate area, darker after JPEG + the plate tone) and `#e6dbc2` 10–11 % (margin)
  - plate tone inside the plate mark `#E8DDC2` at 55 % (D) · foxing spots `#9A6A34` (D)
  - ink `#1C1510` (D; M darkest clusters `#664924`/`#716049` because ink lines are thin and blend with paper)
  - wash pigments (D, also visible M `#a17b45 #87673b`): amber `#D9962A`, ochre `#A8743E`, umber head `#8A6242`, eye `#6E4A3C`, wing blue-grey `#A9C3CF` (α .5), legs `#7A5A3C`, pollen `#EAA21A`
  - copper (opening only): `#5E2A12 → #94502C → #4E220E`, groove trough `#240C05`, burr `rgba(255,226,186)`; subtitle slip `#F4EDDB`, script `#2B1E14`.
- **texture / print / post-process:**
  - Sheet = world-space laid paper (fibres, horizontal laid lines, sparse foxing) that zooms with the camera; pressed bevelled plate mark at (70,44)–(1850,1036) with bevel dark top/left, light bottom/right; ruled border 2.4 px rule + 0.8 px hairline 9 px inside.
  - **Swell law** per hatch line: `w = wMin + (wMax−wMin)·min(1, v·1.25)^γ` where `v = (tone − thr)/(1 − thr)`; then `w ·= (1−swell) + swell·sin(πu)^0.7` (u = position along the run, swell .8) and tapered over the first/last `max(10 px, 22 % L)` with exponent .8. Widths: outline 1.8–2.4 (×.45–1.35), hatch 0.18→2.0, cross ×.78, third ×.6, hair/stipple .6–.9.
  - **Three passes** by tone thresholds on 0–1: family 1 from .14, crossing from ~.5, third (lozenge) from ~.75; spacing ≈ figure height/180 (3.1–3.7 px on a 600 px figure), ×1.1 cross, ×1.25 third. Optional `bend`/`bend2` curve the hatch lines quadratically/cubically to follow a form.
  - **Tone field from shape** (`formTone`): rasterise the polygon at ~180 cells, two-pass 3-4 chamfer distance transform, inflate to a pillow `h = R·sqrt(1 − (1 − d/R)²)`, central-difference normal, Lambert with light `(−.55,−.62,.56)`, plus a rim term near the edge; tone = 1 − lambert. **Contour hatching** = marching-squares iso-lines of the distance field every `spacing`, chained into polylines, width by tone.
  - **Occlusion** by subtracting excluded polygons' scanline spans per hatch line (not even-odd).
  - **Wash** (`Wash`): per region an offscreen bitmap: fill + stroke of width 2·spill (3.5 px spill), 2/1.5 px misregister, tide-line (dark ring stroke minus inner), low-frequency density lift .55, 1–2 backruns (pale bloom with darker rim) on regions > 12000 px², granulation from paper tooth; drawn with `multiply` UNDER the ink. Bloom: clip to a ragged noisy circle from the brush-touch origin growing as `1−(1−p)^2.2`, plus a travelling wet-front stroke at alpha .35·(1−p).
  - All ink is vector, bucketed by width into Path2D chunks → fast and sharp at any zoom.
- **typography:** Bodoni Moda (title 50 px ≈4.6 % H, tracking .16 em; labels 17 px ≈1.6 %, tracking .14) — roman capitals cut glyph by glyph; Bodoni Moda Italic 20–24 px (≈2 %) for Latin names; Pinyon Script 29 px (2.7 %) notes and 38 px (3.5 %) subtitles on a deckled paper slip (max width 860, ≤2 lines). Nothing fades: roman is cut, script is written.
- **motion rules:** 24 fps; cutting order is the animation; strokes at constant burin speed, 6–90 at once; first stroke starts ≥⅓ cut at frame 0; full build ≤ ~5 s. Roundels lift 30 px on an eased arc and grow log-linearly to r 120; colour regions bloom 1.25–1.6 s, staggered 0.42 s. Transitions only from printmaking (proof peel, tissue guard, burnish & re-cut, new sheet). No dissolves/wipes/UI slides.
- **camera:** a loupe over a sheet: 4.2× following the burin tip with 3° roll → locked while proof peels → log-zoom pull-out 4×→1× → push 4.3× to a part and ride with its roundel to a 1.45× reading frame → tilt at reading zoom → ≤2 % breathing push during colour → locked final plate.
- **signature moves:** `burin-engrave-hatch`, `magnification-roundel`, `wash-bloom-colour`, `copper-proof-pull`, `natural-size-inset`, `engraved-plate-frame`.
- **do:** one light direction for the whole film; outlines heavier away from light; hatch along each part's axis; leaders routed with ≥34 px clearance; reserve colour for one event.
- **don't:** grey fills, uniform-width lines, sepia filters, colour on lettering, burin skew > 15°, regular helix swarf, roundels authored small (author at r 500 and scale in).
- **source:** lemo-opuscar `styles/engraving/` (MIT code, CC BY 4.0 docs) — `demo/engine/burin.js` (Ink, hatch, engraveTone, formTone, contourHatch, outline, stipple, fur), `plate.js` (drawSheet, engraveText, writeScript, roundelFrame), `wash.js`, `copper.js`, `index.js` (`engraveShape(svgPath, {light, spacing, style})`), `demo/example/index.html`.
- **Port note (MIT):** the whole engine is engine-grade and SVG-path-driven, so it ports almost 1:1 into a TS module: (1) `hatch` = rotate polygon edges into the hatch frame, step a scanline every `spacing·(1 ± jitter/2)`, intersect spans, subtract occluder spans, sample along each span every 2.5 px, width by tone + swell + taper, output variable-width polylines (render as filled ribbons in SVG or per-segment strokes in canvas); (2) `formTone` = chamfer DT + pillow + Lambert as above; (3) `contourHatch` = marching squares on the DT; (4) Ink scheduling: each stroke gets a start/end time by group and concurrency, length grows with time. `engraveShape` turns ANY SVG path (logo, icon, product silhouette) into an engraving — huge value for agents.

### Techniques
#### `burin-engrave-hatch` — NEW
- look: any SVG shape becomes a copperplate engraving that cuts itself in order: swelling outline runs, then a sweep of parallel hatch lines bent to the form, then cross-hatching in half-tones, then a third lozenge family and stipple in the darks — tone purely from line density.
- params: light `(−.55,−.62)`; spacing ≈ H/180; thresholds .14 / .5 / .75; widths per Port note; schedule e.g. outline 0–1.1 s (conc 2), h1 .8–2.2 s (conc 40), h2 1.6–2.7, h3 2.2–3.0; paper `#F1E8D2`, ink `#1C1510`.
- build: pre-compute strokes once (useMemo, seeded) from `path` prop; each stroke has [t0,t1]; at frame f draw strokes with t1 < t fully and growing ones partially (variable-width ribbon via polygon offset). Props: `path | svgSrc`, `light`, `spacing`, `style:'hatch'|'contour'`, `passes`, `duration`, `ink`, `paper`. Optional burin tip prop + swarf ribbon at the growing stroke's head.
- source: `styles/engraving/demo/engine/burin.js`, `index.js` (MIT).
- value: logo/product reveal in "heritage" tone, museum labels, banknote/certificate looks, editorial illustration — works from any SVG an agent has.

#### `magnification-roundel` — NEW
- look: a ring is scribed around a part of the figure, the inside burnishes clean and is re-engraved magnified, then the roundel (double-ruled circle on a ruled-line ground) lifts off and flies on an eased arc to a margin slot, trailing a hairline leader back to a dot on the part; a figure number and label (roman caps, italic term, script note) are cut on landing.
- params: final radius 120 px (11 % H); double rule 2 px + .75 px 4 px inside; ground of horizontal lines every 11 local units; lift 30 px mid-flight; log-linear scale growth; leader .95 px with ≥34 px clearance via one waypoint; slots at (300,300), (300,700), (1620,700), (1620,300).
- build: `<g>` with clipPath circle; content rendered at large radius (or a live zoomed copy of the subject via nested transform) and scaled in; flight path quadratic Bézier; leader = polyline anchor→waypoint→rim recomputed each frame.
- source: `styles/engraving/demo/engine/plate.js` `roundelFrame`, DEMO.md Roundels/Leaders.
- value: "detail inset" for any explainer: product feature zoom, anatomy, map inset, UI zoom; style-agnostic if the ring styling is a prop.

#### `wash-bloom-colour` — NEW
- look: after a black line print, transparent watercolour spreads region by region from where the brush touched, with a ragged wet front, slight spill past the lines and misregistration, a darker tide-line at the dry edge, occasional backruns, granulation; ink stays on top.
- params: per region 1.25–1.6 s, stagger .42 s; alpha .62 (wing .5); spill 3.5 px; offset (2,1.5) px; bloom radius `far·(1−(1−p)^2.2)·1.08` with edge noise ±14 %; wet-front stroke 5 px at .35·(1−p).
- build: SVG: region path filled, then `feMorphology dilate` (spill) + `feTurbulence` displacement for the ragged edge + an edge-detect ring (`feMorphology erode` difference) for the tide-line, all inside a mask = growing noisy circle; `mix-blend-mode: multiply` under the line layer. Props `regions[{path,color,origin,t0}]`.
- source: `styles/engraving/demo/engine/wash.js` (MIT).
- value: "colour arrives" climax for any line-art motion (`line-draw-on`, `plan-tilt`, `handwrite-on`); also maps, botanical, product sketches.

#### `copper-proof-pull` — NEW
- look: an ECU of polished warm copper with a burin cutting a glinting groove (dark trough + bright burr toward the light, a curling copper swarf ribbon ahead of the point); then a paper sheet peels across and reveals the mirrored image printed true on paper.
- params: copper gradient `#5E2A12→#94502C→#4E220E`, polishing-hairline overlay, a blurred 4-pane window reflection (14 px blur); burin turned .22 rad; peel ~0.7 s locked camera; press thump on the downbeat.
- build: 2D: copper layer = gradient + hairline swirl + window reflection; the design drawn as grooves (dark stroke + offset light stroke); peel = a page-turn mask with a curled back face; under it the paper version, mirrored horizontally before the peel. Could reuse our `page-turn` transition with a `mirror` prop.
- source: `styles/engraving/demo/engine/copper.js`, DEMO.md "The copper".
- value: "the secret comes out / draft becomes final / die and strike" reveal; stamps, coins, certificates, brand heritage.

#### `natural-size-inset` — EXTENDS `callout-labels` (new props: `scaleRef`, `label:'NATURAL SIZE'`)
- look: a tiny true-scale copy of the subject sits in an empty margin slot with a tracked roman-caps label, giving scale against the enlarged figure.
- params: scale = real size / plate size (demo .19× the main figure); label 17 px tracking .14.
- build: reuse the subject component at a computed scale in a fixed slot.
- source: `styles/engraving/STYLE.md` §8.
- value: scale reference for microscopic or giant subjects (chips, seeds, insects, buildings).

---

## 17. `game-show` — Game Show Flat (Games, demo *Rhythm of AI 1997 → 2026*, 148.8 s, 30 fps)

### style `game-show` — Game Show Flat (rhythm-game variety show)
- **essence:** a rhythm-game variety show in flat vector: toy bean mascots with thick ink outlines on candy stripe / polka / sunburst sets; every pop, drop, stamp, typed character and camera punch sits on (bar, beat) and is also a sound event; each round = one repeatable verb + a judgement word.
- **palette** (D from `K` in `main_v1.js`; M from poster/styleboard):
  - ink `#1B1B1B` (D) · white `#FFFFFF` · cream cards `#FFF6E5` (D)
  - candy: yellow `#FFD23F` (M `#fad143`), orange `#FF8C42` (M `#d67742`), red `#FF5A5F` (M `#fd5c5e` 8 %), pink `#FF8FB1`, green `#5BD68A` (M `#1eac83`/`#20ab85` = the "gpt" green `#19B388`), lime `#C6F16D`, sky `#8ED1FC`, blue `#4D7CFE` (M `#4490f5`)
  - deep sets: purple `#6B4FBB` / `#46318F` (M `#6b50b9` 59–62 % / `#453289`), teal `#3FB8AF` / `#2B8F88`, navy `#26264A` (M `#2a2241`)
  - props: wood `#C98A52`/`#8E5530`, gray `#C3CAD9`, chalk `#2F5D50`, skin `#FFD1A8`; one set = one hue; neighbouring rounds never share a hue.
- **texture / post-process:** none. Vector only; no gradients, blur, texture or soft shadow. Depth = hard offset shadow (same shape in ink shifted +10 px banners, +14 px cards). Outlines 8 px characters/props, 5–7 px small parts, round joins/caps. Sets: background + same-hue pattern one step lighter: diagonal stripes (bands w=60, rotated −30°, scrolling), offset polka dots (step 70, r 10, 18–25 % white), rotating sunburst (n rays, every other wedge filled, radius 1600). Floor band y 860–900 with an 8 px ink line on top. Final film grain none.
- **typography:** Fredoka 700 (Latin display: GAME N, years, "Perfect!", tags, numbers; judgement 120 px ≈ 11 % H), Noto Sans SC 900 (CJK everywhere; title 200 px ≈ 18.5 % H), ZCOOL KuaiLe (hand-lettered props only). **Telop** = fill white/yellow with ink stroke ≈14 % of font size painted under the fill (`paint-order: stroke`, round joins). Titles built glyph by glyph, popping 0.06 s apart. Telops ARE the subtitles (≤20 CJK / ~12 Latin words per plate).
- **motion rules:** 30 fps on ones; tempo 150 BPM (beat .4 s, bar 1.6 s). Idle = parabolic hop per beat `−h·4f(1−f)` with h 8–30 px, neighbours on the off-beat (crowd ripple). Hit squash `1 − amt·e^(−14Δt)·cos(30Δt)` for .35 s; downbeat squash `1 − .1·e^(−16·frac)`. Entrances drop from the sky 500–900 px with ease-in over .28 s, landing exactly on their beat. Back-ease pops for anything appearing; ease-in exits; shout pose (arms up, open mouth) .24 s. Typewriter 1 char per ⅛ beat, click every 2 chars. Scene change = hard cut on the bar line + 0.08 s white flash; one fade at the very end.
- **camera:** frontal symmetrical proscenium, no travel. Beat punch = zoom about centre, sum over active punches `a·(1 − Δt/.16)²` (a .008 ticks, .02 hits, .03–.05 slams), total < .06. Split stage, shrink-to-thumbnail, vertical set scroll, snap zoom 2× to one prop for one bar.
- **signature moves:** `beat-punch-zoom`, `candy-set-backdrop`, `bean-crowd-drop`, `round-card-jingle`, `judgement-telop-pop`, `remix-thumbnail-shelf`, `report-card-stamp`.
- **do:** derive every cue (cuts, punches, sfx, shouts) from one event table; `render(t)` pure; characters never the set's hue; shouts 20–30 ms before the beat.
- **don't:** gradients/blur/soft shadows, dissolves, off-grid motion, real logos/UI, stateful updates (cold workers show initial state).
- **source:** lemo-opuscar `styles/game-show/` (MIT code, CC BY 4.0 docs; the demo's macOS `say` shouts are NOT covered) — `demo/frame_head.html` (el/txt/tf/chars/charsPop), `demo/main_v1.js` (palette K, `at(bar,beat)`, `ev`, `punch`, `hopY`, `hitSq`, `gtext`, `stripes`, `dots`, `raysEl`, `burst`, `judge`, `banner`), `demo/main_b.js` (`bean()`, `pose()`, `scene()`, `card()`, `dropY`, `heyAt`, camera punch sum at line ~1175), `demo/music.py` + `synth_lib.py`.
- **Port note (MIT):** the beat helpers are one-liners and port directly into a Remotion `beat-kit`: `at(bar,beat) = (bar·4+beat)·60/BPM`; `frac(t) = (t/B) mod 1`; `hopY`, `hitSq`, `dropY(t,t0,y,h,d) = y − h·(1 − easeIn((t−t0+d)/d))` before t0; camera punch sum. `stripes/dots/raysEl` are trivial SVG path generators. `burst` = 8-point star (r 70/28) + expanding white ring (r 50, sw 10) + 8 ink speed lines r 90→130, .3 s.

### Techniques
#### `beat-punch-zoom` — NEW (camera utility for `mix`)
- look: the whole frame "kicks" a few percent toward centre on every accent and relaxes in ~5 frames; several punches in a bar make the frame breathe with the music.
- params: per punch amplitude .008 (tick) / .02 (hit) / .03–.05 (slam); decay window .16 s with quadratic falloff; sum of simultaneous punches capped ≈ .06 so frame edges never show (oversize the stage ~6 %).
- build: `useBeatPunch(punches[], frame, fps)` returns scale; wrap any composition in `<PunchCamera punches>`; punches can be generated from a BPM grid + accent pattern; expose `origin`.
- source: `styles/game-show/demo/main_v1.js` `punch`, `main_b.js` render camera.
- value: universal "music-synced energy" layer for promos, recaps, social cuts; also used by `halftone-dossier` (0.6 % beat pulse).

#### `candy-set-backdrop` — NEW (backdrop)
- look: full-bleed saturated set with a same-hue lighter pattern: slowly scrolling diagonal stripes, offset polka dots or a rotating sunburst, plus an optional darker floor band with an ink line; colour changes per section.
- params: stripes w 60 at −30°, scroll ~1 stripe/bar; dots step 70 r 10 at 18–25 % white; sunburst 16–24 rays, ~10°/s; floor y 80–83 % H; candy palette above.
- build: SVG pattern generators; `variant: 'stripes'|'dots'|'rays'`, `hue`, `patternHue`, `scrollSpeed`, `floor`. Deterministic from frame.
- source: `styles/game-show/demo/main_v1.js` `stripes`, `dots`, `raysEl`.
- value: instant loud backdrop for quizzes, kids' content, sales promos, chapter cards; pairs with `kinetic-captions`, `comic-burst`.

#### `bean-crowd-drop` — EXTENDS `crowd-bob` (new props: `variant:'bean-stage'`, `dropBeats`, `hopAlt`, `nameTags`, `accessory`)
- look: toy bean contestants (rounded body, mitten hands, oval eyes with catch-light, blush, swap-to-open mouth, ink name-tag pill, one head accessory each) drop in from the sky one per beat or half-beat onto a floor band, then all hop on the beat with neighbours on the off-beat; shout pose on accents.
- params: bean 160×172 px at scale 1; drop 500–900 px ease-in .28 s landing on beat (+ pitched pip per landing, rising scale); hop 8–30 px; squash on landing; accessories: antenna ball, heart, "?", moon, bolt, cloud, sprout, beret, hat…
- build: `<Bean color belly accessory name pose>` SVG component (one construction), positions on rows with depth scale; `dropY` + `hopY(t + (i%2)·B/2)`; CAST array as props.
- source: `styles/game-show/demo/main_b.js` `bean()`, `twins()`, `dropY`, `heyAt`; `main_v1.js` `hopY`.
- value: "everyone joins" moments: team intros, product line-ups, community/user counts, ingredient lists.

#### `round-card-jingle` — EXTENDS `chapter-header` (new props: `variant:'game-card'`, `tag`, `years`, `iconHop`, `stripeBg`)
- look: a cream rounded card with hard ink shadow flies in over a full-bleed scrolling-stripe set of the round's colour: pill tag "GAME N", auto-fitted round name, a year range in the set colour, a small icon hopping on the left; held one bar, then a hard cut + white flash into play.
- params: card 1240×460 (65×43 % frame), r 50, 10 px outline, 14 px offset shadow; name fit to 720 px; back-ease in; flash .08 s; 1 bar = 1.6 s at 150 BPM.
- build: composition section with `cardColor === setColor`; text fitting via measure; pairs with `beat-punch-zoom`.
- source: `styles/game-show/demo/main_b.js` `card()`.
- value: chapter/step cards for listicles, tutorials ("Step 3"), history timelines.

#### `judgement-telop-pop` — EXTENDS `comic-burst` (new props: `variant:'telop'`, `angle:-6`, `strokeRatio:.15`, `burst:'star-ring-lines'`)
- look: a huge outlined word ("Perfect!", "Approved!") pops at −6° with a back-ease, drifts up 20 px and pops out; a burst (8-point star + white ring + 8 ink speed lines) fires on the hit.
- params: 120 px Fredoka 700 (11 % H), pink/yellow fill, 18 px ink stroke under fill; in .25 s back-ease; total 1.0 s with last .2 s fade; burst .3 s.
- build: SVG text with `paint-order: stroke`; existing comic-burst starburst replaced by the star+ring+lines burst.
- source: `styles/game-show/demo/main_v1.js` `judge`, `burst`.
- value: verdict/achievement stingers for gamified UI, tutorials, quiz videos.

#### `remix-thumbnail-shelf` — NEW
- look: each finished bit of the scene plays 2 bars centre stage then shrinks (×0.27) into the next slot of a shelf along the bottom under a month/timeline ribbon; at the climax all thumbnails bounce together.
- params: shrink in ~½ bar with ease-in-out; slot pitch = W/(n+1); bounce = shared `hopY` per beat; ribbon across the top marks the current item.
- build: each item is a sub-composition rendered at full size then transformed to its slot; thumbnail state is recomputed from t (freeze at `t1 − ε`), never cached — the demo's bug.
- source: `styles/game-show/DEMO.md` Remix, `main_b.js` `item()`.
- value: year-in-review, release recaps, "everything we shipped" montages.

#### `report-card-stamp` — COVERED by `stamp-slam` + `typewriter-signature`
- look: cream card with typewritten recap lines (1 char per ⅛ beat, click every 2 chars) and a grade stamp/star.
- source: `styles/game-show/DEMO.md` ending.
- value: covered by combining existing motions in `mix`.

---

## 18. `glass-product` — Glass Product Render (Materials & 3D, demo *Aura — Hear the Light*, 32 s)

### style `glass-product` — Glass Product Render (dark-field launch film)
- **essence:** one fictional hero object of clear/frosted glass, metal and light floating in an infinite black studio; strip lights behind and beside turn glass into thin white outlines with rainbow edges; internals show through; light pulses travel inside; exploded views snap shut on a downbeat.
- **palette:**
  - bg black `#000000`→`#010306` (M 56 %) · background radial sweep `#34383D → #16181B → #000` (D; M `#090e15 #131c25 #252c34`)
  - metals/greys (M `#7e8992 #6c757d #545c65 #384049`), strip-reflection white
  - **one accent family for light only**: ice blue `#62DCFF` → soft violet `#A98BFF` (D); M on poster rims `#9ec7fd` / `#a78af6`, in macro frames `#92a1eb #abc7f5 #5c85c4`
  - dispersion rainbow only at thick edges/caustics (M stray `#8b4f1c #198637 #7d1410` in macro frames = R/G/B fringes)
  - clear-glass attenuation `#F3F8FB`, frosted tint `#EEF2F5`, light-guide acrylic `#15181B` (D)
- **texture / post-process (three.js r170):**
  - Studio env = tiny black scene of emissive planes baked to PMREM every frame (`fromScene(env,0,1,1000)`): side strips 22×170 mm ×3.2, horizon strip 260×14 ×1.4, top box 160×70 ×1.1, front card ×.18 (off when concave glass faces camera), top-front key 150×60 ×2.5 (exploded only), pulse-driven accent card, and the **sweep strip** 26×240 on an arc ±1.35 rad BEHIND the camera (azimuth = camera + π) so its highlight/refraction/dispersion move physically.
  - Clear glass: MeshPhysical transmission 1, roughness .015, IOR 1.52, thickness 3–4.5, dispersion 5, DoubleSide. Frosted: transmission .82–.9, roughness .4, thick, with an opaque dim cool-white emissive disc inside. Metals roughness ≥ .14 (.05 blew out).
  - **Comet pulse** emissive (onBeforeCompile on the guide material): for pulse i at UV position p, width w, direction s: `a = (x − p)·s`; head `exp(−a²/(w²/4))`; tail `exp(a/(4w))·.55` for a<0; colour `mix(A,B, age + (1−head)·.25)·max(head,tail) + head³·.35` (white-hot core); up to 8 pulses, optional wrap.
  - **Floor**: black Reflector with 12-tap golden-angle blur, radial fade; procedural caustics = Voronoi F2−F1 edges of a doubly sine-warped domain, `exp(−14·e)`, sampled at scales .985/1/1.015 for R/G/B (dispersion), plus a ring lens caustic `exp(−((r−.72)/.07)²)` with R/G/B radii .70/.72/.74; event "sound-wave" rings: Gaussian band around a growing radius with R/G/B offsets ±.35, hue from A→B with radius.
  - Post: 2× SSAA, physical DoF (aperture 700–900 macro, 70 exploded, 160–300 wides), bloom .16–.3 above 1.1, **Neutral tone mapping** (AgX bleaches accents), exposure 1.1, grain 0.
- **typography:** Inter Tight (Google) — titles weight 200, 112–132 px (10–12 % H), tracking 56–64 px, centred upper third, with a diagonal glint synced to the sweep; kickers 18–20 px (1.7–1.9 %), tracking 8–10, caps; subtitles Inter Tight 300 40 px (3.7 %) on a **frosted-glass bar** (76 px tall, radius 38, live frame `blur(18px) brightness(1.25)` + 10 % cool white, 1.2 px gradient stroke, blue→violet top line).
- **motion rules:** 24 fps on ones, all eased; camera always drifts (orbits .2–.4 rad/shot), never locked or handheld (2 frames micro-shake on the snap only). Exploded view: 3 s ease-out apart → .75 s hover drifting +3 % → **.25 s ease-in snap** on the drop downbeat; per-part tilt `sin(i·1.7)·.32`, `cos(i·2.3)·.28`, spin ∝ offset; axis ~40° to view; push-in ~40 % in the .9 s after the snap. Magnetic lift 1.2–1.4 s eio. Cuts only on beats; transitions = cut or a sweep passing through black.
- **camera:** sweep over dark object + slow push → high 3/4 orbit → macro 25–45 mm with rack focus surface→inside → side macro orbit → exploded orbit → straight-on hero push → top-down macro → top-down floor caustics → low 3/4 pull-back for title.
- **signature moves:** `glass-strip-sweep`, `comet-pulse-guide`, `floor-caustic-rings`, `exploded-view-snap`, `frosted-glass-subtitle`, `glint-thin-title`, `frost-to-clear`.
- **do:** fictional object only; one accent reserved for light; real geometry for highlights; anything inside transmissive glass opaque; limit bass peaks ~3 dB before loudnorm.
- **don't:** HDRIs with windows, painted 2D highlights, coloured emitters inside frosted glass, AgX, dissolves, real silhouettes/brands, profiles that read as mushrooms/pot lids.
- **source:** lemo-opuscar `styles/glass-product/` (MIT code, CC BY 4.0 docs) — `demo/studio.js` (strip env, sweep, floor shader), `demo/product.js` (materials, comet shader, explode), `demo/main.js` (frosted subtitle ~l.242, title glint), `demo/story.js`.
- **Port note (MIT):** the comet-pulse formula and the floor caustic shader (Voronoi F2−F1 on a sine-warped domain, per-channel scale for dispersion, ring caustic, wave rings) are self-contained GLSL and port directly into `three-kit.tsx` (or into a 2D canvas/SVG approximation: caustic net as a `feTurbulence`-free Voronoi computed per frame on a small canvas). The per-frame PMREM strip studio is a ~60-line recipe worth a shared `GlassStudio` component.

### Techniques
#### `glass-strip-sweep` — NEW (3D, three-kit)
- look: a dark glass/metal object in black space; a tall strip light passes behind the camera and its reflection/refraction slides across the object, drawing a thin white contour with rainbow dispersion at thick edges; between sweeps only side-strip silhouettes remain.
- params: sweep 26×240 mm strip on an arc ±1.35 rad at azimuth camera+π, one pass per 1–2 bars; side strips ×3.2; glass IOR 1.52, dispersion 5, roughness .015; Neutral tone mapping exp 1.1; bloom >1.1.
- build: `<GlassStudio sweep={progress}>` building the emissive-plane env scene + PMREM each frame; prop `object` = GLB/lathe geometry; materials presets `clear | frosted | chrome | satin`. Fallback 2D: a bright diagonal gradient band masked to the object's outline with RGB-offset copies for dispersion.
- source: `styles/glass-product/demo/studio.js`, STYLE.md §2.
- value: premium product reveals for any SaaS/hardware brand (with their own GLB), app-icon "glass" hero.

#### `comet-pulse-guide` — NEW
- look: light pulses travel along a channel (spiral, ring, cable, circuit trace) as comets — narrow white-hot head, long exponential tail, hue drifting from accent A to B with age; idle glow ≈ 0.
- params: head σ = w/2, tail 4w at 55 %, core head³·.35; up to 8 pulses; pulses triggered on a beat list (demo bass pattern [0,.75,1,1.5] per bar); colours `#62DCFF → #A98BFF`.
- build: 2D version: SVG path + `getPointAtLength`, draw the pulse as a stroked sub-segment with a gradient (or many short segments with alpha from the formula) + glow filter; 3D version: emissive UV-axis shader as in source. Props `path`, `pulses[{t0,speed,width,hue}]`, `wrap`, `colors`.
- source: `styles/glass-product/demo/product.js` `onBeforeCompile`, `setPulses`.
- value: data/energy flowing — charging, network traffic, pipelines, "sound becomes light"; overlay-capable on UI diagrams.

#### `floor-caustic-rings` — EXTENDS `caustics-godrays` (new props: `variant:'floor'`, `rgbSplit`, `lensRing`, `waveEvents[]`, `accentA/B`)
- look: on a glossy black floor under the object, a dancing net of bright caustic filaments with chromatic fringes, a ring-shaped lens caustic, and coloured rings that spread outward on each beat.
- params: filaments `exp(−14·(F2−F1))` on a warped domain, R/G/B scale .985/1/1.015; lens ring r .72 ± .07 (R .70 / G .72 / B .74); wave ring band width .8 + r·.025, colour by radius 0→90; floor reflection ×.32 with radial fade.
- build: WebGL fragment shader (three-kit) or 2D canvas at ¼ res upscaled with blur; seeded time; `waveEvents` from the beat list.
- source: `styles/glass-product/demo/studio.js` floor shader.
- value: "the effect leaves the object" — speaker range, wireless field, perfume trail; also a premium dark backdrop.

#### `exploded-view-snap` — NEW
- look: a product's parts float apart along one axis into a diagonal with depth, each tilting and spinning slightly, hover and drift, then all snap back together in a quarter second exactly on a downbeat, with a click cluster and a lighting change in the same frame.
- params: spread ~2× product size; 3 s ease-out apart, .75 s hover +3 % drift, .25 s ease-in snap; tilts `sin(i·1.7)·.32`, `cos(i·2.3)·.28`; axis ~40° to view; 2-frame micro-shake; camera push +40 % over .9 s after.
- build: works in 2D layers (SVG parts with z-order + scale for depth) or three.js groups; props `parts[]`, `axis`, `spread`, `tOpen`, `tSnap`, `hover`. Relates to `wireframe-build` but is about reassembly timing.
- source: `styles/glass-product/demo/product.js` `explode()`, DEMO.md Motion numbers.
- value: modular products, architecture "how it fits together", feature stacks, layered UI explainers.

#### `frosted-glass-subtitle` — EXTENDS `kinetic-captions` (new props: `variant:'frosted-bar'`, `blur`, `accentLine`)
- look: subtitle on a rounded slab that shows the live frame beneath it blurred and brightened, with a hairline highlight stroke and a thin accent line on top; light grotesk text.
- params: bar 76 px (7 % H), radius 38; backdrop `blur(18px) brightness(1.25)` + 10 % cool white; 1.2 px gradient stroke; Inter Tight 300 40 px tracking 1; hold ≥ max(1.8 s, speech+.7 s).
- build: CSS `backdrop-filter: blur(18px) brightness(1.25)` on an absolutely positioned div (Remotion renders it), or duplicate background layer clipped + blurred.
- source: `styles/glass-product/demo/main.js` (~l.242).
- value: premium captions for dark product films, keynotes; overlay-ready.

#### `glint-thin-title` — EXTENDS `blur-in-title` (new props: `weight:200`, `tracking:'0.5em'`, `glint:{t0,dur,angle}`)
- look: an ultra-thin, ultra-wide-tracked product name in the upper third with a diagonal specular glint sweeping across the letters, synced to the sweep light on the object; a small tracked caps kicker above.
- params: Inter Tight 200 at 112–132 px, tracking 56–64 px; kicker 18–20 px tracking 8–10; glint ~0.6 s, 30–40° band, white 60 %.
- build: text mask + moving linear-gradient band (SVG `<mask>` or `background-clip:text`).
- source: STYLE.md §4, DEMO.md Palette.
- value: launch-film titles for any product.

#### `frost-to-clear` — NEW (3D or 2D)
- look: a frosted shell clears — roughness and tint animate to zero — and the inside appears sharp.
- params: roughness .4 → .015, transmission .85 → 1 over ~1–1.5 s eio.
- build: three.js material uniform tween; 2D fallback = blurred + white-tinted copy of the inner layer cross-fading to sharp behind a glass outline.
- source: STYLE.md §8.
- value: privacy/transparency features, "honest breakdown" reveals.

---

## 19. `halftone-dossier` — Halftone Dossier (Print & Printmaking, demo *Case File: Chubby*, 30 s, 30 fps)

### style `halftone-dossier` — Halftone Dossier (retro print case file)
- **essence:** the whole film is a printed case file on cream archive paper: overprinted Ben-Day halftone dots in a few flat spot inks, huge black headlines with misregistered shadows, rubber stamps that slam, case numbers and height charts, thick-outlined kawaii characters; one exhibit per 2–4 s card.
- **palette** (D = `C` in index.html; M = PIL):
  - paper `#F4ECDD` (D; M `#ebe4d1` 39–45 % + mottling `#ded7c6 #d0c9b9`)
  - navy ink (outlines, body text, caption bar, fade colour) `#1D2340` (D; M `#1d233d`/`#1b203a`)
  - blue dot layer `#2E55D6` (D; M `#2c4caa`/`#2f4fb9`)
  - pink overprint shadow / caption offset `#FF5A87` (D; M `#e86582`, `#d14457` in multiplied areas)
  - yellow highlight / numerals `#FFC628` (D; M `#f0b32a`/`#f1b828`)
  - mascot orange `#F58A34` / `#D9621E` (D; M `#e58a32`), cream `#FFF4E2`, stamp red `#E8384F`, night `#18203F` / dots `#2A3568`, tiny mint `#56C29E`, skin `#F7C9A1`
  - rule: paper + one dark ink + 4–5 spot inks, flat only.
- **texture / print / post-process:**
  - Paper canvas (built once, multiply over EVERYTHING incl. dark scenes): 96×54 random tile (242–255 grey) upscaled for mottling + per-pixel noise ±13 with −4 blue bias + radial vignette `rgba(120,100,80,.35)` + faint centre fold at x=960.
  - Dust grain canvas per frame: 520 cream specks r .6–2.4 α .75 + 90 navy specks, reseeded every 2 frames.
  - **Halftone**: rotated grid of circles in ONE SVG path; step 20–26 px (≥14 px or it moirés after encoding); screen angle per layer 15/20/25/30/45/60/70°; r = density(x,y)·step·k, k .6–.72 (≈.7 dots merge to solid); dots with density < .05 skipped. Density fields: `radial(cx,cy,R,pw)`, `edge(R,pw)` (crowding the frame border), linear ramp `.25 + .75·clamp((y−250)/650)` ("lit from above"). Second layer `mix-blend-mode: multiply`.
  - **Line boil filter** (characters/props only, re-seeded every .1 s from a 40-seed cycle): `feTurbulence fractalNoise 0.022, 2 oct` → `feDisplacementMap scale 5`; then a fine ink-grain mask `feTurbulence 0.75` → `feColorMatrix` alpha row `0 0 0 −22 15.2` (thresholds the noise into a speckle mask) → `feComposite in`, eating a little of every fill.
  - **Stamp ink filter**: displacement `feTurbulence 0.04, 3 oct` scale 7 + coarse grain mask `feTurbulence 0.55` with alpha row `0 0 0 −9 5.9`; opacity .93; tilt −10…+12°.
  - Halftone-filled numerals: flat fill + darker halftone clipped to the same `<text>` via clipPath (unique id each).
  - mux grain off (paper/dust are already in the picture).
- **typography:** Noto Serif SC 900 headlines 100–230 px (9–21 % H) left at x≈120–170 with misregistration shadow +8/+8 px in pink/yellow (multiply) — for Latin use a black slab/serif such as **Alfa Slab One** or **Roboto Serif 900**; **Bagel Fat One** for names/big numbers (CHUBBY 330 px ≈ 31 % H; exhibit numerals 700–760 px ≈ 65–70 % H bleeding off the right edge); **ZCOOL KuaiLe** interjections (paper fill, 16 px navy stroke, blue offset shadow); **JetBrains Mono 800** case numbers, rulers, clock; **Noto Sans SC 900** captions and stamps (stamp text 120–210 px). Caption bar = navy rounded pill with pink offset shadow, paper text, keyword in yellow, bottom centre y=980.
- **motion rules:** transforms at 30 fps; line boil at ~10 fps. Everything enters with overshoot (back ease 1.9, .3–.45 s), rising from below (`lerp(1200, 470, back)`) or scaling from 0; nothing fades in. Per-glyph pop: drop 30–100 px + squash, stagger .05–.08 s (.02 small). Title letters fall 700 px in .2 s, .25 s apart (one per 8th), damped-cos squash. Stamp slam: .09 s from 2.6× to 1× (ease-in), 5 % damped bounce, same-frame shake + flash + stamp SFX. Squash landing `sq = 1 − k·e^(−7a)·cos(20–22a)` applied as `scale(1/sq, sq)`. Idle: breathing ±2 %, blinks, REC dot 1 Hz. Transitions: **dot wipe** (80 px grid, r → 62, .44 s centred on the cut, diagonal delay `(x/W·.6 + y/H·.4)·.35`, per-cut colour) or a hard cut on a big hit; no dissolves.
- **camera:** 2D group: locked frontal with .6 % beat pulse; slow push 1→1.05 (4 s) / 1→1.08 ease-in (tension); shake with quadratic decay 5–26 px (different sin/cos freqs on x/y); flash frames white .95→0 over .3 s (cap .5 for big hits); pan across pinned board; snap zoom into dots; page turn / folder slide; pull back to the desk. Fade to navy at the end.
- **signature moves:** `halftone-density-field`, `halftone-exhibit-numeral`, `stamp-slam` (rough ink), `mugshot-height-chart`, `halftone-dot-wipe`, `misregistered-headline-pop`, `redaction-bars`, `evidence-board-string`.
- **do:** dots, paper and stamps visible in every frame; one idea per card; preload fonts against the full page text before measuring; unique clip ids; dot wipe must reach full cover (r ≥ cell diagonal / 2).
- **don't:** gradients/transparency ramps, boil on text/dots/HUD, 100 % white flashes, dots < 14 px step, more than five inks; riso grain collage (that is `risograph`), candy sets (that is `game-show`).
- **source:** lemo-opuscar `styles/halftone-dossier/` (MIT code, CC BY 4.0 docs) — everything in `demo/index.html` (filters l.19–37, `halftone()` l.135, `stampEl/stampAnim` l.170–195, `buildPaper`, `drawFx`, `WIPES/wipeUpdate` l.975), `demo/music.py`.
- **Port note (MIT):** `halftone()` (rotated lattice, r = density·step·k, single path) and the density field helpers are 15 lines → a `HalftoneField` SVG component with `density: (x,y)=>0..1`. The boil and stampInk SVG filters are pure markup and can be copied as filter definitions verbatim in spirit (re-typed with our own ids): turbulence → displacement + thresholded-noise alpha mask via `feColorMatrix` alpha row `(0,0,0,−k,b)`. The dot wipe is 10 lines: per grid dot `p = clamp((u − delay)/.65)`, `r = sin(πp)·62`.

### Techniques
#### `halftone-density-field` — EXTENDS `dot-matrix` (new props: `source:'field'`, `field:'radial'|'edge'|'ramp'|fn`, `layers[{color,angle,step,k}]`, `multiply`)
- look: Ben-Day dots whose size follows an analytic field — a halo of dots swelling around a subject, dots crowding the frame edges for tension, a radial bloom for joy — two or three layers at different screen angles overprinting in multiply on paper.
- params: step 20–26 px; k .6–.72; angles 15–70°; radial `(1 − d/R)^pw`; edge field from distance to frame border; animate R/pw over time for "dots swell = emotion".
- build: `HalftoneField` component: compute lattice in rotated frame, emit one `<path>` of circles per layer per frame (memo by quantized params); `mix-blend-mode: multiply`.
- source: `styles/halftone-dossier/demo/index.html` `halftone()`, STYLE.md §2/§8.
- value: print-style backgrounds and emphasis halos for any subject; overlay-capable; brand inks as props.

#### `halftone-exhibit-numeral` — NEW
- look: a giant rounded numeral ("01", "03") bleeding off the right edge, filled with a flat spot ink and overprinted with a darker halftone clipped to the glyph; it rises in with back-ease behind the exhibit.
- params: Bagel Fat One 700–760 px (65–70 % H); fill yellow `#FFC628` / pale pink `#FFD3DF`; dot layer orange/pink step ~22, ramp density; enter .45 s back ease from below.
- build: SVG `<text>` fill + `<clipPath>` with the same text containing a `HalftoneField`; unique clip id per instance.
- source: `index.html` l.513–518 / 709–714 (per DEMO.md).
- value: numbered lists, "Reason 3", step counters, chapter numbers in print/editorial looks.

#### `stamp-slam` (rough ink variant) — EXTENDS `stamp-slam` (new props: `ink:'rough'`, `doubleBorder`, `shake`, `flash`)
- look: a double-bordered rounded-rectangle rubber stamp with mottled ink and rough edges slams from 2.6× in 3 frames, bounces 5 %, with camera shake and a white flash on the same frame.
- params: .09 s 2.6→1× ease-in; outer border 10–14 px, inner .35×; opacity .93; tilt −10…+12°; shake 16–26 px quadratic decay over .45 s; flash ≤ .5.
- build: add the `stampInk` SVG filter (displacement 7 + thresholded grain mask) to our existing stamp-slam.
- source: `index.html` `stampEl`, `stampAnim`, `#stampInk`.
- value: verdicts — APPROVED, SOLD OUT, VERIFIED — with a more physical print feel.

#### `mugshot-height-chart` — NEW
- look: a subject stands front-on before horizontal height-chart lines with cm labels at both edges (mono), holding a dark name plate (name, case no., charge); two camera-flash frames make it squint; a big stat ("99+") and a profile block on the sides.
- params: lines every ~9 % H labelled 0–80; JetBrains Mono 800 labels; plate navy with paper text and yellow keyword; flash .95→0 over .3 s, twice; push-in 1→1.05 over 4 s.
- build: backdrop component + slot for any character/image (`src`); props `name`, `caseNo`, `charge`, `stats[]`, `flashes[]`.
- source: `styles/halftone-dossier/poster.jpg`, STYLE.md §8 "The mugshot".
- value: "meet the suspect" intros — a new feature, a bug, a species, a product, a team member (humour).

#### `halftone-dot-wipe` — EXTENDS transition `dots` (new variant `dots:halftone-wipe`, props `color`, `pitch`, `delayDir`)
- look: a coarse grid of flat-colour circles grows from nothing to full cover with a diagonal ripple, the scene switches while covered, and the dots shrink away revealing the next scene.
- params: pitch 80 px, max r 62 (≥ half diagonal of the cell → full cover), duration .44 s centred on the cut, per-dot delay `(x/W·.6 + y/H·.4)·.35`, local `p = clamp((u−delay)/.65)`, `r = sin(πp)·62`; per-cut colour from the palette.
- build: transition presentation drawing an SVG grid of circles over both scenes; switch scenes at u = .5.
- source: `index.html` `WIPES`, `wipeUpdate`.
- value: print/comic/kids transitions; brand-colour wipes.

#### `misregistered-headline-pop` — EXTENDS `kinetic-captions` (new props: `variant:'print-headline'`, `shadow:{dx:8,dy:8,color,multiply}`, `perGlyphDrop`)
- look: a heavy black headline builds glyph by glyph, each character dropping 30–100 px and squashing in, with an offset overprint shadow in a second ink; a caption pill pops in afterwards with one keyword in the highlight ink.
- params: stagger .05–.08 s; drop with back ease; shadow +8/+8 px multiplied; caption pill navy, pink offset shadow, keyword yellow.
- build: per-glyph SVG text with measured advances (fonts preloaded); shadow = duplicate glyph layer offset.
- source: `index.html` `chars`, `charsPop`, `caption()`.
- value: loud editorial titles for explainers, news-ish shorts.

#### `redaction-bars` — NEW
- look: black bars print over words of a document and later lift one by one to reveal (or keep hidden) the text.
- params: bar = navy rounded rect slightly larger than word bbox; print-on in 2–3 frames with stamp feel; lift by sliding/peeling .3 s with back ease; ink filter optional.
- build: given a text block with word boxes, map `reveals[{wordIndex,t}]`.
- source: STYLE.md §8 "Redaction".
- value: leaks, spoilers, surprise reveals, compliance explainers.

---

## 20. `hd-2d` — HD-2D (Games, demo *The Lampbearer*, 76.5 s, 60 fps)

### style `hd-2d` — HD-2D Diorama (pixel sprites in a lit tilt-shift world)
- **essence:** a 3D miniature set of boxes/cylinders wrapped in pixel-art textures, populated by flat stepped pixel sprites that receive light and cast shadows, seen from a high far camera through a tilt-shift band; light is the subject (practicals, fog, shafts, heavy bloom, vignette); a small RPG UI on top. Sprites step; camera, light, particles and focus glide.
- **palette** (night demo):
  - sky `#050818 → #101D3E → #2C4262` (D; M `#091129 #05244a #06112b #021029`) · fogs `#16223A` / `#152A48` / `#1C2334` (D)
  - darkest = warm ink `#1A1016` (D; M `#080307` 26 %, `#0b0609`)
  - practicals: fire/windows `#FF9D4A #FFAE55 #FF8C3A`, lantern `#FFB050`, lighthouse `#FFF0C8` (D; M bloomed `#fac80d #d55e06 #aa3a06 #792208` on poster, `#f5e198 #d1b26d` in lamp room)
  - moon `#8FA8E0`, hemisphere `#3A4C7A / #0A0A12`, cool front fill `#9FB2E8` (D; M `#3a4e76 #445c8d #2e4572`)
  - hero cloak crimson ramp `#2E0B14 … #C9503F`, scarf gold `#B08424` (D) — the one saturated costume colour no set uses
  - UI gold `#D8C28E #E2C989 #C9A863`, parchment `#F3EAD6 #F6F0E2`, title gradient `#FFF3CF → #E2C27C → #A8803E` (D)
- **texture / post-process:**
  - Pixel surfaces drawn per pixel on small canvases, uploaded with NearestFilter, world-space UVs at constant 24 px/m; sprites 34×50 px at 1/30 m per px (~1.67 m).
  - **Colour ramps with Bayer dither**: luminance v∈[0,1) → index `i = floor(v·(n−1))`, fraction f remapped by a narrow dither band `f' = clamp((f − .5)/dz + .5)`, then pick `i+1` if `bayer4x4(x,y) < f'`; dz ≈ .45 textures, ≈ .22 sprites (wider = checkerboard everywhere).
  - **Selout outline** on sprites: transparent pixel next to opaque → neighbour colour darkened 32 % toward ink `rgb(22,14,30)`.
  - Light rig per set: dim shadow-casting moon (Directional 1.1–1.2, 2048 map) + hemisphere + practical point lights with shadows (windows 8, street lamps 12–14, brazier 16, lantern 2.6–14) + cool front fill 1.2–1.8 ~2 m before the hero (billboards lit from behind stay black) + additive glow sprite on every source. Sprite shader light capped `min(out, diffuse·1.35 + emissive)`.
  - Flame flicker = few summed sines ±20 %; one `level` drives sprite, light intensity (∝ level^1.3), glow opacity and scale.
  - **Post**: render 2× (SSAA, MSAA) → physical DoF with **tilt-shift folded into the signed CoC** (`tc = min(maxCoc, tiltAmt·smoothstep(tiltW, tiltW+tiltF, |y − tiltC|))`, sign by side: above band = far, below = near; far never bleeds over sharp foreground; 96-tap golden-angle spiral gather) → UnrealBloom (strength .55, radius .75, threshold .85) → vignette/grade (amt .62, warm .1, contrast .2) → filmic tone map. No grain.
- **typography:** Cinzel 500/700 (chapter label 34 px ≈3.1 % H, tracking 10 px; title 118 px ≈10.9 %, tracking 14 px, gold gradient + glow); Cormorant Garamond italic 500 (narration subtitles 50 px ≈4.6 % at y = H−88 on a soft dark band max α .38; chapter name 78 px ≈7.2 %; tagline 50 px); Cormorant 500/600 (dialogue box text, name plate).
- **motion rules:** 60 fps output; sprites on 4-frame walk cycles at 6–10 fps (`floor(t·9) mod 4`), idles 2 frames at ~1.4 Hz, blinks every few s, instant pose swaps; camera, lights, particles, beams, focus every frame. Lightning flash curve (strike, dip, re-strike, decay) lifts sky + fill + exposure together. World never shakes except impacts. Transitions: short fades to black or cuts between sets.
- **camera:** always looking down; every path a monotone cubic `track()` of 2–7 keys (no overshoot); focus distance recomputed each frame to hero (+0.7 m); band centre follows hero's projected y (clamped .2–.8) or fixed (34–36 %) without a character. Moves: very high far slow push (fov 36), medium-high 3/4 drift (fov 30), lateral tracking with look-ahead and blurred foreground ferns, dive low/close when kneeling, rising pull-back with focus hand-off, orbit, top-down.
- **signature moves:** `tilt-shift-diorama`, `lit-pixel-sprite`, `practical-light-shadow-jump`, `lights-pop-on-map`, `rpg-dialogue-box`, `ornament-chapter-card`.
- **do:** two temperatures (big cold ambient vs small warm practicals); one fog colour + light key per set; hero wears the unique saturated colour; lift mid-tones ×2–2.5 in dark scenes except the one beat that must go dark.
- **don't:** eye-level camera, voxel characters, tilt as a separate blur pass, cylinder beams facing camera (NaN → black blocks; use billboard beam cards), pure black, film grain, using "HD-2D" as a title/brand.
- **source:** lemo-opuscar `styles/hd-2d/` (MIT code, CC BY 4.0 docs; music track is Scott Buckley CC BY 4.0) — `demo/px.js` (PX canvas, `bayer`, `ramp`, `outline` selout, surfaces), `kit.js`, `fx.js` (sky, pixel sea, particles, rain, beam cards, `flick`), `chars.js` (pose tables), `post_ts.js` (DoF + tilt), `ui.js`.
- **Port note (MIT):** (1) `ramp(cols, dz)` + 4×4 Bayer is a 3-line function — drop-in for our `pixel-dither` and any procedural pixel texture; (2) selout outline is a single neighbour pass; (3) the tilt-shift term is one line added to the CoC of the shared DoF shader (same structure as `core/three/post.js`, which our `three-kit` could adopt: CoC = aper·(1/focus − 1/z) clamped to ±maxCoc, 96-tap spiral gather with the "farther samples limited to centre radius" rule). For a 2D Remotion approximation: apply `blur(px)` to horizontal bands with blur ∝ smoothstep distance from the band.

### Techniques
#### `tilt-shift-diorama` — NEW (3D; 2D fallback)
- look: a high, far three-quarter view of a lit miniature world where only a horizontal band is sharp and everything above/below melts into blur, so the world reads as a tabletop model; band follows the subject.
- params: tiltW .1, tiltF .3 (fractions of screen height), tiltAmt up to maxCoc 16–18 px at 1080p; band centre at subject's projected y clamped .2–.8 or fixed 34–36 %; camera fov 30–42, always looking down; bloom .55/.75/.85; vignette .62.
- build: three.js: extend our DoF pass with the signed tilt term. 2D fallback for image/scene layers: stack of 8–12 horizontal strips each with `filter: blur()` ∝ `smoothstep(w, w+f, |y−c|)`, plus saturation/contrast boost (+15 %) to sell the miniature. Props `center`, `width`, `falloff`, `maxBlur`, `follow`.
- source: `styles/hd-2d/demo/post_ts.js` (MIT), STYLE.md §2/§6.
- value: miniature look over any city/landscape plate (`ken-burns`, `city-skyline`, `parallax-landscape`), map overviews; overlay-capable as an image filter.

#### `lit-pixel-sprite` — NEW
- look: flat low-res pixel characters with 1-px selout outlines stepping on 4-frame cycles, lit by nearby warm lights so their colours shift and their shadows fall on the floor, while the camera and lights move smoothly.
- params: sprite 34×50 px at ~1/30 m/px; walk 4 frames at 6–10 fps; idle 2 frames ~1.4 Hz; sprite light cap `diffuse·1.35 + emissive`; front fill 1.2–1.8 at ~2 m.
- build: sprite = pose table → PX canvas → billboard plane in three.js with MeshLambert/Standard + alpha test + cast shadow; in 2D a canvas sprite multiplied by a light colour computed from distance to lights + a sheared dark shadow polygon on the floor.
- source: `styles/hd-2d/demo/chars.js`, `px.js`, `kit.js`.
- value: retro-game storytelling, pixel mascots in 3D sets, pairs with `pixel-dither`.

#### `practical-light-shadow-jump` — NEW
- look: a small light (lantern, lamp, screen) switches on beside one or two characters; their shadows swing out across the floor, the glow blooms, the set's mood flips from cold to warm.
- params: ignition curve 0→1 over ~.3 s with a flicker overshoot; intensity ∝ level^1.3; glow sprite opacity/scale tied to level; flame flicker ±20 % summed sines (e.g. .5 sin 13t + .3 sin 7.1t + .2 sin 23t).
- build: 2D: radial gradient light + per-object shadow polygons projected from the light position (shadow length ∝ 1/height of light), blend `screen` for glow, `multiply` for shadows; 3D: point light with shadow.
- source: STYLE.md §5/§8, DEMO.md (brazier taper → lantern).
- value: "switching on" moments — product power-on, store opening, idea lighting up.

#### `lights-pop-on-map` — EXTENDS `city-skyline` (new props: `lightsOn[{t,x,y}]`, `cadence`, `glowColor`, `tilt`)
- look: across a dark town map or skyline, windows and lamps light up one by one at a steady cadence, each with a small bloom, until the whole place glows.
- params: cadence on beats or every 2–4 frames; warm `#FFAE55` windows with additive glow; slight overshoot flicker per light.
- build: window grid already in `city-skyline`; add a schedule + glow sprite.
- source: STYLE.md §8.
- value: users joining a network, electrification, festival begins, growth metrics.

#### `rpg-dialogue-box` — EXTENDS `story-caption-box` (new props: `variant:'ornate'`, `namePlate`, `cornerOrnaments`, `typeRatio:.9`, `caret`, `chime`)
- look: a dark translucent plate with a thin gold border, corner ornaments and a name plate on its top edge; text types over ~90 % of the spoken line with a blinking caret; soft chime on entry.
- params: gold `#D8C28E`, parchment `#F6F0E2`; Cormorant 500/600; plate α ~.7; typing spans 90 % of voice duration.
- build: extend story-caption-box (which already has RPG typing) with ornament paths and name plate.
- source: `styles/hd-2d/demo/ui.js`.
- value: character dialogue in explainers, onboarding "NPC" guides.

#### `ornament-chapter-card` — EXTENDS `chapter-header` (new props: `variant:'fantasy'`, `ornament:'diamond-line'`, `emberParticle`)
- look: radial navy background, "CHAPTER I" in wide-tracked inscriptional capitals over a gold ornament line with a diamond, the chapter name in large italic serif with a warm glow, one pixel ember drifting across.
- params: bg `#11172A → #020308`; Cinzel 500 34 px tracking 10; Cormorant italic 78 px; 5.5 s hold.
- build: text + SVG ornament; ember = a 3×3 px square on a slow noise path with glow.
- source: DEMO.md UI, `ui.js`.
- value: fantasy/story chapter cards, game-like course modules.

---

## 21. `hologram-hud` — Sci-fi Hologram HUD (Information & Keynote, demo *VOLT CE-01 spec scan*, ~35 s)

### style `hologram-hud` — Sci-fi Hologram HUD (scanned wireframe spec walkthrough)
- **essence:** an object is scanned into a glowing line wireframe above a round projector pad on a near-black stage; target boxes lock onto parts, each opens in a local exploded view, a leader pulls out and its number rolls from garbage glyphs into the real value (turning accent on the downbeat); it may ignite once into a solid hologram. A scene style for spec walkthroughs, loops, teardowns, upgrades.
- **palette** (all derived from two hue parameters, `theme(hue=188, accent=38)`):
  - stage `hsl(hue+12, 70 %, 2.4 %)` ≈ `#020709` (D; M `#03080b`/`#020709` 43–62 %), radial lift `hsl(hue+6, 65 %, 7 %)` ≈ `#071215`/`#0c1f23` (M)
  - lines `hsla(hue,100 %,72 %,a)` ≈ `#70ECFF` (D; M `#63cad2 #79e2e8 #86ebef` — depth-fogged/bloomed), dim `hsla(hue,70 %,52 %)` ≈ `#26C4D9` (M `#3e8994 #4ea8b3`)
  - hot edges / white heat `hsla(hue,60 %,93 %)` ≈ `#E3F8FB` (M `#94f3f6`)
  - accent (locked values ONLY) `hsla(38,100 %,64 %)` ≈ `#FFBF47` (D; M `#dda95e`/`#d1af65` on the values)
  - text plates `rgba(1,8,12,.72)`, border 28 %.
- **texture / post-process (Canvas 2D):**
  - Wireframe strokes with `globalCompositeOperation = 'lighter'`, 1.3 px, 7 alpha levels from depth fog (near bright, far ~25 %); two glow passes: ¼-res blur 3 px ×.85 and ⅛-res blur 4 px ×.7 added back.
  - Hot edges = the 7 cm band under the scan front + flagged pieces.
  - **Solid hologram**: faces filled with screen-space Fresnel `0.3 + 0.7·(1 − facing)^1.6` where facing = projected area / product of edge lengths, times a scrolling interlace (2 px full / 2 px at 38 %, scrolling 1 px per frame); line width ×1.5 at ignition easing to ×1.12; light wave band ±7 cm climbing the model; beam = one nonzero-winding path with gradient 10 %→0, 26 rays, 70 dust motes.
  - Stage: 48 px dot grid with parallax .2, vignette .5; projector pad in true perspective: concentric rings (one bright, one dashed), ticks, faint rays, slow rotation.
  - Motion blur only inside camera whips: sub-frame accumulation with 180° shutter; HUD stays sharp. Glitch ≤ 3 frames once.
- **typography:** **Rajdhani** caps — Light 300 for product name (176 px ≈ 16 % H, tracking 26 px) and big numbers (~100 px ≈ 9 %), Medium/SemiBold labels (2–3 px tracking); **Share Tech Mono** 20–22 px (≈2 % H) micro data; numbers monospaced (advance = widest digit) with a small square decimal point. Subtitles: plate `rgba(1,8,12,.62)` + diagonal brackets + 4 "voiceprint" bars, Rajdhani Medium 38 px (3.5 %), baseline y 962, wrap 1180.
- **motion rules:** everything on ones at 24 fps; only glyph scrambling steps every frame. Target lock: box starts 1.9× the part bbox at 30 % alpha, rotated 45°, snaps in .22 s cubic ease-out, flashes white 3 frames on the downbeat; tag `TGT 0N · LOCK`. Explode along each piece's assembly axis (shell slides on its own axis, contents stay and turn hot; counter-rotating rotor/stator; caliper halves part, pistons separate less), open over 1–2 beats, close .5 s. Leader anchor ring → diagonal → horizontal in ~.5 s. Rolling value locks right-to-left; accent + 1-frame flash on lock; a progress bar fills while rolling. Chip dock: value slides into a side rail and stays. No cuts/fades inside the scene: scan plane in/erase and loupe iris only.
- **camera:** orbit camera (yaw, pitch, distance, narrow fov .6) with a screen-space target offset so the subject sits beside text; high 3/4 orbit craning down (scan plane reads as an ellipse), top-down plan, eye-level profile, push-in, whip following the target box (starts before next lock), orbit around a part axis, loupe frame-in-frame, turntable 360°.
- **signature moves:** `holo-scan-wireframe`, `target-lock-box`, `rolling-value-lock`, `spec-chip-rail`, `holo-solid-ignite`, `projector-pad`, `loupe-inset`.
- **do:** subject ≥ ⅓ frame height at key moments; every text block on its own dark plate; accent only on true values; parts physically connected; HUD in three depth layers (bg dot grid / subject / fg brackets & rulers with faster parallax).
- **don't:** rendered solid objects (it's always wireframe; solid once), text over the wireframe, floating disconnected parts, generic box parts, UI blips inside silences, whips started inside the next segment.
- **source:** lemo-opuscar `styles/hologram-hud/` (MIT code, CC BY 4.0 docs) — `demo/engine/holo.js` (projection, scan, explode, Fresnel faces, glow, pad, scan plane, `normalizeModel`, `modelFromPath`), `demo/engine/hud.js` (`theme`, `plate`, target box, leader, `rollText`, `monoText`, spec card, chip, beam, subtitle, chrome, glitch), `demo/models/mkmodel.mjs` (tube/ring/disc/box/wheel/cells primitives), `demo/content.json`.
- **Port note (MIT):** `rollText(str,k,frame,seed)` ports directly: for char i of n, `lockAt = .25 + ((n−1−i)/n)·.7` (right side first); spaces/punctuation always shown; unlocked chars = digit or letter glyph set indexed by `hash(frame·13.7 + i·7.1 + seed)`. Fresnel-from-projection (facing = projected polygon area / edge-length product) is a neat trick that needs no normals. Model format = parts → pieces of polylines (rings + longitudinal lines for tubes) with an assembly axis per piece; `modelFromPath` extrudes any 2D path — lets agents turn a logo SVG into a holo model.

### Techniques
#### `holo-scan-wireframe` — EXTENDS `wireframe-build` (new props: `variant:'holo'`, `model` (parts/pieces/axes), `hue`, `scanY`, `depthFog`, `pad`, `glowPasses`)
- look: a cyan line wireframe grows upward through a glowing horizontal scan plane (seen as an ellipse from above) on a rotating perspective projector pad; edges just under the scan front burn near-white; far lines fade to 25 %; soft bloom.
- params: 1.3 px additive lines, 7 alpha levels; hot band 7 cm; glow ¼-res 3 px ×.85 + ⅛-res 4 px ×.7; pad rings (bright + dashed), ticks, rays; dot grid 48 px parallax .2; colours from `hue` (188) / `accent` (38).
- build: own tiny projector (yaw/pitch/dist/fov) in TS; model JSON from primitives (`tube`, `ring`, `wheel`, `box`) or `modelFromPath(svgPath, depth)`; draw on canvas with `lighter` + two downsampled blur layers (or SVG `feGaussianBlur` glow); scan = clip lines by world y < scanY.
- source: `styles/hologram-hud/demo/engine/holo.js`, `models/mkmodel.mjs`.
- value: product/spec explainers for any object, logo-to-hologram intros; relates to but differs from `wireframe-build` (amber galleon from blueprint).

#### `target-lock-box` — NEW
- look: an oversized faint square rotated 45° snaps down onto a part's screen bounding box with corner brackets, flashes white for 3 frames on the downbeat, and shows a small tag `TGT 02 · LOCK`; the camera whip follows the box.
- params: start 1.9× bbox, alpha .3, rot 45° → fit, rot 0, alpha 1 in .22 s cubic ease-out; 3-frame white flash; tag Share Tech Mono 20 px; anchor ring on the part body.
- build: overlay component taking `bbox` per frame (from the scene's projection or a static rect) + `lockFrame`; usable over video/image too.
- source: `styles/hologram-hud/demo/engine/hud.js` target box; DEMO.md motion numbers.
- value: "look here now" pointer for UI walkthroughs, product features, sports/video analysis; overlay-capable.

#### `rolling-value-lock` — EXTENDS `number-counter` (new props: `mode:'scramble'`, `lockOrder:'rtl'`, `accentOnLock`, `flashFrame`, `progressBar`, `monoAdvance`)
- look: a spec value appears as cycling garbage glyphs (digits for digits, letters for letters) and locks character by character from right to left; on the downbeat it turns accent amber with a 1-frame white flash; a thin progress bar fills underneath while it rolls.
- params: lockAt_i = .25 + ((n−1−i)/n)·.7 of roll progress; glyph change every frame; monospaced advance = widest digit; decimal point drawn as a small square; label rolls in first (reveal·1.6 − .2).
- build: pure function `rollText(str,k,frame,seed)` + `monoText` layout; props `value`, `unit`, `label`, `detail[]`, `tRoll`, `dur`, colours.
- source: `styles/hologram-hud/demo/engine/hud.js` l.151–170, l.201–250.
- value: KPI reveals, prices, specs in any techy style; complements odometer mode of `number-counter`.

#### `spec-chip-rail` — NEW
- look: after a value has been read on the big card, it shrinks into a compact chip (index, label, value+unit, one detail line) that slides into a side rail and stays docked; chips accumulate to 3–5, giving reading time; final lockup shows weight/price block and a CTA box.
- params: rail x 110–470 px (6–24 % W); chips ~110 px tall with corner-tick plates `rgba(1,8,12,.72)`; slide .4–.5 s ease-out; values accent amber; each spec on screen 10–25 s total.
- build: list component with `items[{label,value,unit,detail,tDock}]`, FLIP-style interpolation from card rect to rail slot.
- source: `hud.js` chip; DEMO.md structure; poster.
- value: spec sheets, feature checklists, pricing summaries — keeps facts on screen for agents' "reading-time" rule.

#### `holo-solid-ignite` — NEW
- look: the wireframe ignites into a translucent solid hologram: faces fill with edge-bright Fresnel and scrolling interlace lines, a light wave climbs the model, lines thicken then settle, a projector beam with rays and dust rises from the pad; turntable 360°.
- params: Fresnel `.3 + .7(1−facing)^1.6`; interlace 2/2 px at 38 %, scroll 1 px/frame; line width ×1.5 → ×1.12; wave ±7 cm; beam gradient 10 %→0, 26 rays, 70 motes.
- build: per-face polygon fill with computed alpha (no normals needed: facing = |projected area| / (edge lengths product)), interlace as a repeating-line pattern mask; beam as one path.
- source: `holo.js` Fresnel faces + beam.
- value: once-per-film "the whole is ready" launch beat; also applicable to any SVG-extruded logo.

#### `hud-subtitle-voiceprint` — EXTENDS `hud-chrome` (new props: `subtitle`, `voiceBars:4`, `brackets:'diagonal'`)
- look: subtitle on a dark HUD plate with two diagonal cyan corner brackets and four small bars that bounce with the speech envelope.
- params: plate `rgba(1,8,12,.62)`, Rajdhani Medium 38 px, wrap 1180, in .1 s before voice, out .12 s before next line.
- build: bars driven by an amplitude array (or seeded noise gated by speech windows).
- source: `hud.js` subtitle.
- value: sci-fi captions; overlay-capable.

---


## 22. `impasto` — Impasto Oil Painting (Hand-drawn & Painting, *The Colour of Rain*)

### style `impasto` — Impasto · Palette Knife
- **essence:** a moving oil painting built from designed palette-knife strokes (flat slanted planes with ridges, lips and run-out streaks) lit by a raking light over a paint height field. Clear, value-planned, readable at thumbnail size; only story objects move, static paint never boils.
- **palette** (doc = DEMO.md/film.js, meas = PIL on poster / docs frame / styleboard):
  - sky ramp (doc): cobalt `#34507e` → peach `#d99a78` → gold `#f7dca0`; meas sky/facade lights `#e7b46a`, `#efc891`, `#d4a68b`, `#616f9b`.
  - facades (doc): ochre `#dca064`, rose `#c98d7e`, shutter green `#3f7a6c`, awning red `#b8342a`.
  - shadow / wet cobbles (meas): `#302937`, `#473f51`, `#63586c`, `#8d737b` (cool violet-greys — warm light vs cool shadow).
  - umbrellas (doc, full chroma, reserved for the subject): red `#dc2f28`, yellow `#f4bc2a`, cobalt `#2f62c0`, viridian `#23906c`, magenta `#cc3a82`, orange `#ee7a2a`, turquoise `#26aab4`, violet `#6e4cc0`; meas on overhead frame `#db4f23`, `#f1b92a`, `#c93c81`, `#5150b0`, `#20776d`.
  - grey world (meas overhead frame): `#41434b`, `#595a60`, `#73757c`; end-card ground deep ultramarine, credits cream `#efe2c4`, gold `#f6d690`.
- **texture / post:** WebGL2, two render targets at 2× supersampling: colour+coverage and paint height (+wet flag in G). Composite pass computes a normal from height gradients at 1 px and 3 px offsets (weights .7/.18, `norm` 3.2), Lambert + Phong spec (`light [-.55,-.6,.7]`, `amb .8`, `dif .28`, `spec .16–.3`, `shin 26`), cavity AO = (blurred height − height)·`ao 1.2` clamped .55–1.08, canvas weave (product of two sines at 0.9 rad/px + hash noise) shown only where coverage < 1, then expo/contrast/sat/lift-gain grade and an elliptical vignette (`vig .26–.3`). Thin underpainting = the reference blurred ~1.5 px drawn under strokes. **No grain** (kills knife edges); export high bitrate.
- **typography:** demo uses Cormorant Garamond italic 600 (titles, knife-laid) and Cormorant SC 500 (credits); Google Fonts: *Cormorant Garamond*, *Cormorant SC*. Title ≈ 9–12 % of frame height painted as strokes; credits 38/30/21 px at 1080 (≈ 3.5 / 2.8 / 1.9 %) as crisp DOM text with soft shadow. Subtitles: plain serif ≤ 2 lines.
- **motion rules:** smooth 24 fps, no stepping. Moving figures are rebuilt every frame from fixed per-stroke seeds (no boil). Every gesture anticipation → action → follow-through, locked to a BPM grid (`timeline.js`). Transitions: paint-over sweep (`appear` wave, ~1 s) with knife-scrape SFX, or hard cut on the downbeat; **never dissolves** (double ridges = mud). Camera always inside the painted plate (`half = W/2/zoom`); moves: slow truck+push, push through silence, tilt-up from a puddle reflection, pull-back, rotating overhead crane-out, locked frame with moving light, macro slide over the paint.
- **signature moves:** `knife-paint-plate`, `knife-colour-relay`, `one-colour-exception`, `paint-note-ribbon`, `overhead-trail-mandala`, `raking-light-peak`, `paint-over-sweep` transition.
- **do:** plan values first (3 values min, readable at 480 px wide); big strokes in sky/walls (40–60 px), 3–6 px at faces and edges; reflections as stacked horizontal dabs; give silhouettes taper + lit edge + 1–2 defining dabs; reserve full chroma for the subject.
- **don't:** swirl/Van-Gogh filters, noise-sampled "painterly" photo filters, gradients by pixel blending, dissolves, grain, reseeding strokes every frame, strokes crossing shape groups.
- **source:** lemo-opuscar `styles/impasto/` (MIT code, CC BY 4.0 docs) — `demo/engine/impasto.js` (renderer), `demo/engine/plate.js` (reference → strokes), `demo/scenes/figures.js` (walker, umbrella, ribbon, rain), `demo/film.js` (EDIT table, post looks), `demo/timeline.js`.
- **Port note (MIT):**
  - *Instanced stroke quad:* each stroke = 20 floats (x, y, angle, len, width, rgb, rgb2, seed, type, reveal-delay, appear-delay, alpha, height, bend, skew, taper); a 10-segment triangle strip is bent by offset `bend·len·(0.25 − k²)` along the normal (k = −.5….5 along the body), skew slants the ends (`u += skew·v·W/L·0.5`), taper narrows the start `w·mix(1−taper,1,u)`.
  - *Knife fragment:* edge noise from two 1-D value-noise octaves along the stroke; a "load" = .78+rand·.5 sets where paint runs out; streak = 2-octave 2-D noise stretched along the stroke; coverage is cut where `runout > streak` (broken trailing streaks), colour mixes rgb→rgb2 by streak; height = .5 + paint squeezed to one blade side + a lip bump at the lift-off point + a pile at the start − slope along u. Brush type: bristle noise across width + "dry" cut near the end. Dab: wobbly ellipse with a raised rim.
  - *Paint-on / re-lay:* a stroke appears after `appear+delay` and is laid along its length (`cov *= u < ap·1.25`); a grey→colour reveal sweeps `u < rp·1.3 − .15` so each stroke is re-coloured from its start; grey = luma pulled 8 % toward .5, tinted cool, 5 % colour residue.
  - *paintRef (Hertzmann-style coarse→fine):* radii [36,18,9,4.5,2.5]; for each level grid the plate at 0.8 R, measure mean |current − reference| per cell (on a per-shape id map); if error > T(16)·detail place a stroke at 0.7·(max-error pixel)+0.3·cell-centre; colour = mean of reference restricted to the same shape group (crisp silhouettes); angle = fixed per shape, radial around a point, a function, or perpendicular to the luminance gradient (integral-image box means); shuffle order with a seeded RNG.

### Techniques

#### `knife-paint-plate` — NEW
- look: any SVG/reference illustration (or photo) becomes a palette-knife oil painting: slanted mosaic of flat paint planes with ridges, lit by a raking light, canvas weave in thin spots.
- params: radii 36→2.5 px at 1080p; error threshold 16/255; angle jitter ±13°, value jitter ±6 %; stroke 1.7–3.1 R long, 0.95–1.45 R wide; light `[-.55,-.6,.7]`, spec .16–.3, AO 1.2; 2× supersample.
- build: precompute strokes once (seeded, per `src` image) in JS → `Float32Array`; render via three.js `InstancedBufferGeometry` (or raw WebGL2 in a `<canvas>` driven by `useCurrentFrame`) into colour + height MRT, then a lighting full-screen pass. Props: `src`, `strokeScale`, `lightAngle`, `lightElevation`, `spec`, `grey` (0–1), `appearAt`/`appearDur` (paint-on sweep), `seed`, `palette` override.
- source: lemo-opuscar `styles/impasto/demo/engine/impasto.js`, `engine/plate.js` (MIT).
- value: premium "oil painting" look for heroes, art/culture brands, emotional ads; doubles as a paint-on reveal for any image.

#### `knife-colour-relay` — NEW
- look: a grey (wet, cool) painted world where stroke after stroke is re-laid in colour by a wave from a point or along a path; or a world grey except one object (`one-colour-exception`).
- params: reveal per-stroke delay = distance from wave origin / speed; each stroke sweeps along its own length over `revDur` ≈ .25–.5 s; grey = luma·cool tint + 5 % colour residue; spec slightly higher in grey (wet).
- build: same stroke renderer with uniforms `uGrey`, `uReveal`, per-stroke `rev` delay; props `revealOrigin [x,y]`, `revealSpeed`, `exceptionMask` (shape group ids kept in colour).
- source: `impasto.js` FS (reveal sweep), DEMO.md native moves.
- value: "world wakes up", rebrand, recovery, season turning — a story beat in one motion.

#### `paint-note-ribbon` — EXTENDS `ribbon-trail` (new props: `path` bezier, `render: "dabs"`, `drip`, `life`, `cols[]`)
- look: a ribbon of ~20–30 knife dabs flies along a Bézier from a source (an instrument) to a target, carrying colour; dabs drip and are washed down by rain.
- params: n 16–30 dabs, width 13–46 px, life 1.1–3 s, drip .7–1, gold ramp `#f8c850 #f0a030 #ffdf80 #e88a28`.
- build: sample cubic Bézier at u per dab, delay by index, width envelope; draw dabs as rotated rounded rects with c→c2 gradient.
- source: `styles/impasto/demo/scenes/figures.js` `ribbon()`, `film.js` l.68/198/242.
- value: "sound reaches people", rumour spreading, signal travelling between UI nodes.

#### `overhead-trail-mandala` — NEW
- look: top-down umbrellas (8-panel discs with alternating light panels) dance in rings to a waltz while each drips its colour as dashed dabs along its path; the pull-back reveals a coloured mandala on grey cobbles.
- params: rings swell on every downbeat; umbrella radius 128–150 px; trail dab every ~1/8 beat, dashes 20×8 px; camera rotates + cranes out over ~8 s.
- build: parametric dancer positions `dancePos(u, t)` (ring radius + angular speed + downbeat swell); trail = sample past positions at fixed time steps (deterministic, no state); props `count`, `rings`, `bpm`, `palette`, `ground`.
- source: `styles/impasto/demo/film.js` l.284–297; docs/frames/impasto.jpg.
- value: choreography / routes / "many paths make a pattern" — delivery networks, community, team dashboards.

#### `dab-reflection-stack` — EXTENDS `rain` (new prop: `reflections: "dabs"`)
- look: wet ground reflections under each lamp/window as a broken vertical column of short horizontal knife dabs, fading downward.
- params: 6–14 dabs, width 30–80 px tapering, gaps random (seeded), alpha 1→.2.
- build: SVG rects with slight rotation jitter under each light source x; shimmer by shifting dab x ±3 px on twos.
- source: STYLE.md §2, poster.jpg.
- value: painterly night-street finish without a full painting engine.

#### `raking-light-peak` — EXTENDS `knife-paint-plate` (prop `lightElevation` keyframes)
- look: at the emotional peak the light drops to a grazing angle so every ridge glints, then settles.
- params: elevation z .7 → .15 → .6 over ~2 s; spec up to .3.
- build: animate the light vector uniform; works on any height-field look (also emboss/letterpress).
- source: `film.js` l.339.
- value: sunrise / recognition beat.

## 23. `ink-wash` — Chinese Ink Wash (Hand-drawn & Painting, *The Swordsman and the River*)

### style `ink-wash` — Chinese Ink Wash (xieyi on rice paper)
- **essence:** black ink in five tones on warm rice paper plus exactly one vermilion (seal + one tiny story accent); forms are loaded brushstrokes whose dark edge is the contour, wet washes that bleed, dry "flying white" strokes; 60–80 % of the frame is empty paper. Things are painted into existence, never cut to. (Our `styles.json` already has an `ink-wash` *filter* look; this is a much richer stroke-based system — treat it as an upgrade path.)
- **palette:**
  - paper (doc `#F2ECDE`–`#F3EBDD`, rgb .95/.925/.87; meas `#e8e0cd`, `#f1e6d4`, `#e0d8c5`, `#ece3d0`) — bg.
  - ink ramp (doc): cool grey `rgb(.52,.55,.58)` ≈ `#858c94` at low density → warm black `rgb(.075,.068,.062)` ≈ `#131110`; meas mid tones `#cec6b6`, `#a59f93`, `#726e64`, darkest `#171511`.
  - five tones as opacity (doc): jiao .96 · nong .82 · zhong .60 · dan .34 · qing .16.
  - vermilion (doc) `#B02E22` — seal and sword tassel only (the seal on the poster reads ≈ `#b0352a` by eye/measure).
- **texture / post (WebGL compositor, `comp.js`):** three 2D canvases per picture: *wet*, *dry*, *colour*. Paper is procedural in the shader: cloud mottling fbm at 0.0028 and 0.011 cycles/px (±7 % / ±3 %), long fibres in three directions (value noise stretched ~50:1, `smoothstep(.78,.95)`, +1.8 % light), dark pulp spots, fine grain ±3.5 % that fades with zoom (`fine = clamp(scale·1.2)`) to avoid shimmer; anchored to the world offset. Wet ink: domain-warped sample position (fbm displacement ≈ 1.1 R + feather .35 R), 12-tap Poisson disk at radii .5 R and 1.35 R (R ≈ 5–6 px); **edge pigment** = max(0, smallBlur − largeBlur)·rim(.8) added back; granulation ×(.86 + .22·fbm). Dry ink: fibre jitter ±0.8 px + "paper tooth" bites `smoothstep(.62,.9,noise)·.45`. Densities combine as screen `1−(1−wet)(1−dry)`; colour = paper × mix(1, inkRamp(D), D). Seal paste soaks unevenly (×.75–1 noise). Vignette .22 + warm tone. Grain 0 at mux (paper already in shader).
- **typography:** subtitles Cormorant Garamond italic 500, 46 px (4.3 % H), 1 px tracking, ink-coloured, no box, a small vermilion square before each line, "dry" in ~0.35 s. Titles Cormorant SC 600, wide tracking (14 px), written in vertical columns in empty paper (poster: ≈ 5 % H caps, tracking ~0.25 em, italic subline ≈ 2.2 % H). Calligraphy traced from Ma Shan Zheng used only as a skeleton. Google Fonts: *Cormorant Garamond*, *Cormorant SC*, *Ma Shan Zheng* (alt skeletons: *Zhi Mang Xing*, *Liu Jian Mao Cao*).
- **motion rules:** figures on twos (12 fps), camera/blooms/ripples/splatter on ones (24 fps). Strokes seeded by index; bristle breaks computed on normalised arc length × a fixed reference length (`gapLen`) so flying-white gaps don't crawl; only a 5-drawing "boil" cycle on width noise. Stillness before the decisive stroke (slow 5 % push-in), then the stroke crosses the frame in ~4 frames; consequences only after it finishes. Transitions: ink bloom, scroll pan, mist; the only hard cut is to an extreme close-up. Camera: locked paper, right→left handscroll pan, vertical hanging-scroll tilt, lateral tracking with lead room, high-wide tiny figure (150–180 px of 1080), low-angle push with shake, pull-back to the mounted scroll.
- **signature moves:** `ink-brush-stroke`, `ink-wash-paper`, `ink-bloom` (transition), `brush-calligraphy-write`, `handscroll-reveal`, `ink-mass-split`, `ink-footfall-rings`, `vermilion-seal`.
- **do:** remove ink rather than add tone when busy; far = pale/untextured, near = dark/textured; one base mass + two loaded strokes for bodies; mountains dissolve downward into mist; water = blank paper with faint dry streaks and open rings.
- **don't:** closed outlines, flat fills, colour washes, red type or red washes, parallel semi-transparent strokes ("organ pipes"), uniform hatching inside waves, clipping calligraphy by the font outline, generic dissolves/wipes.
- **source:** lemo-opuscar `styles/ink-wash/` (MIT code, CC BY 4.0 docs) — `demo/ink.js` (brush engine), `demo/comp.js` (compositor + bloom), `demo/land.js`, `demo/wave.js`, `demo/glyph.js`, `demo/seal.js`, `demo/hero.js`.
- **Port note (MIT):**
  - *Stroke model:* centreline points with per-point pressure; width(s) = w·profile(s)·pressure·(1 + rough·(2·vnoise(seed + s·gapLen/(1.3w)) − 1)), floor 4 % of w. Named profiles (`brush`, `tip`, `nail`, `lens`, `fan`, `rise`, `robe`, `even`). Body opacity = tone·(1−dry)^1.6. 4–60 bristles across the width; each has load = 1 − dry·(.15 + .85·edgeness)·(.5…1.2 rand) (edge bristles carry less). Along the stroke ink(u) = load − dry·(.08 + 1.15·u^1.25) + long-scale noise·.9·dry + short noise·.25·dry; a bristle segment is drawn only while ink > .42·dry + .02 → believable flying white. "Loaded" strokes darken bristles toward one side (`darkDir`) so the stroke carries its own contour.
  - *Bloom transition:* mask = 1 − smoothstep(.9R, R, d·(.72 + .7·fbm(p·.0028) + .2·fbm(p·.009))); dark tide-line = gaussian band exp(−((dn − .95R)/(.05R + 14))²)·.6 applied as −38 % brightness at the front.
  - *Ripples:* one open ring stroke spanning 1.86π, r ∝ age^0.6, fade over 2.4 s.
  - *Mountains:* per-pixel cached pointed exponential peaks + 3-octave roughness; far range tone .12–.16, near .4–.5 with cun texture and moss dots; range ends faded by a horizontal alpha mask (never by sloping the ridge).

### Techniques

#### `ink-brush-stroke` — NEW
- look: a sumi brushstroke paints on along any path: wet loaded body with a darker contour side, bristle tracks breaking into flying white at the dry tail.
- params: width 6–200 px; dry 0 (wet) / .3 (textured) / .6+ (flying white); bristles 4–60; tone .16–.96; draw time 4 frames (decisive) to 2 s (calm).
- build: Canvas 2D in a Remotion `<canvas>` (or SVG with many thin paths): precompute bristle offsets from `seed`; per frame draw progress p; render wet + dry layers, then the bleed/edge pass (`ink-wash-paper`). Props: `path` (SVG d or points with pressure), `width`, `dry`, `tone`, `profile`, `darkSide`, `drawStart`, `drawDur`, `seed`, `color` (for non-ink use).
- source: lemo-opuscar `styles/ink-wash/demo/ink.js` (MIT).
- value: hand-made accent strokes, underlines, logo swooshes, dividers; the foundation for any brush style (ink, sumi, calligraphy, menu boards).

#### `ink-wash-paper` — EXTENDS style `ink-wash` (new: procedural rice paper + wet-bleed/edge-pigment compositor usable as a post pass)
- look: warm rice paper with cloud mottling and fibres; any dark layer composited on top bleeds softly and pools darker at its edges.
- params: paper `#F2ECDE`; bleed R 5–6 px; rim .8; 12 Poisson taps; fbm domain warp; vignette .22.
- build: a WebGL full-screen pass taking the child layer as a texture (alpha = ink density); SVG approximation: `feTurbulence`(0.003, 4 oct) → `feDisplacementMap`(scale 6) for the warp; `feGaussianBlur` 2 and 6 → `feComposite operator="arithmetic"` (k2 = 1, k3 = −1) for the edge rim; multiply over a turbulence paper.
- source: `styles/ink-wash/demo/comp.js` (MIT).
- value: turns any monochrome motion (pictograms, logos, charts) into ink painting; reusable as a backdrop.

#### `ink-bloom` (transition) — EXTENDS transition `blob` (new props: `noise` fbm radius modulation, `tideLine` dark front band)
- look: the next scene grows inside a spreading ink drop with an irregular edge and a darker water-line at its front.
- params: radius 0 → 1.5 W over ~1–1.5 s, ease-out; front band width .05 R + 14 px, −38 % brightness.
- build: SVG mask circle driven by frame, edge from `feTurbulence` + `feDisplacementMap`, plus a ring stroke for the tide line; or the shader formula above.
- source: `comp.js` (`trans` uniform).
- value: memory, season change, chapter change in any paper/painting style.

#### `brush-calligraphy-write` — EXTENDS `handwrite-on` (new props: `brush: true`, `skeleton`, `pressureFromThickness`, `hiddenTip`, `dry`, `exitTaper`)
- look: a glyph/word is written with a real brush: hidden-tip entry, swelling pressure, tapered exits, dry streaks — not an outline fill.
- params: dryness .17; exits taper to .12–.18 width; 45° lead-in; ~.3–.6 s per stroke, a pluck per stroke.
- build: centrelines from a pre-traced skeleton JSON per glyph (or offline medial axis of an opentype.js outline); pressure = local glyph thickness; render with `ink-brush-stroke`.
- source: `styles/ink-wash/demo/glyph.js`.
- value: East-Asian titles, signatures, "handwritten" brand marks with real brush character.

#### `handscroll-reveal` — NEW
- look: a long horizontal painting pans right→left like an unrolling scroll; at the end the camera pulls back to show the whole scroll on a silk mount with rollers on a dark table; seal stamped.
- params: pan ~.6–1 screen-widths per 10 s; final pull-back 3–4 s ease-in-out to ≈ 25 % scale; silk border, wooden rollers.
- build: render panels into one wide plate (`AbsoluteFill` width N×W); translateX by eased frame; final scale + mount SVG; props `panels[]` (images/children), `mountColor`, `sealText`, `direction`.
- source: STYLE.md §6/§8, DEMO.md shots "Ending".
- value: timelines, histories, supply chains, "a day in a street" — any linear story shown as one artwork.

#### `vermilion-seal` — EXTENDS `stamp-slam` (new variant `seal`: square red seal with knocked-out 白文 glyph lines, irregular edge, paste speckle; wet→dry fade instead of a slam)
- look: small irregular vermilion square, glyph strokes knocked out in paper colour, speckled paste.
- params: `#B02E22`; size ≈ 7 % H; 1–2 % edge jitter; speckle density .75–1.
- build: SVG rect with turbulence-displaced edge, glyph as mask, thresholded `feTurbulence` for speckle.
- source: `styles/ink-wash/demo/seal.js`; poster.jpg.
- value: signature/brand mark in any East-Asian or craft look.

## 24. `iso-infographic` — Isometric Infographic (Information & Keynote, *From Bean to Cup*)

### style `iso-infographic` — Isometric Infographic diorama
- **essence:** a whole process laid out as one floating, true-isometric diorama board (flat three-tone blocks, no outlines on solids) carrying infographic furniture — dashed route, label pins, cut lines, hatched sections, tracking ring, Isotype numbers, a legend end card. One tracked subject turns the diagram into a story.
- **palette** (doc = DEMO.md tri values; meas = poster/frames):
  - ground cream (doc `#F2E6D0`; meas `#f1e5d0` 50–60 %), board top cream `#FBF4E6`, cream dark side `#D9C8A9`.
  - sea blue tri (doc) `#5A9BCB / #3C7FB1 / #2D6390` (meas `#5c9bcb`, `#3f7ba3`).
  - leaf green tri (doc) `#7BA75F / #5E8C4A / #476F37` (meas `#7ca65f`, `#638a4c`).
  - coffee red tri (doc) `#CF5140 / #B3352B / #8C2620` (meas `#a9372f` in frames) — the subject/accent hue.
  - soil tri (doc) `#A77850 / #8A5B3A / #6A432A` (meas `#a87046`, `#6f533b`) — board strata.
  - mustard tri (doc) `#E9BE5C / #D9A53A / #B0832A` (meas `#e0b761`, `#cc9d42`) — cranes, road segment of the Isotype bar.
  - ink (doc) `#2E2522` — 2 px lines and type only. Desaturation target `#E9DFCB`. Shadow mix target `#231A2C`.
  - roast ramp (doc): `#A9B27C` → `#D9C27A` → `#B07A45` → `#6A3B22`.
- **texture / post:** none — pure flat Canvas 2D, grain 0. `tri(c)`: top = mix(c, `#FFF7E6`, .20), left (+y) = c, right (+x) = mix(c, `#231A2C`, .22) (slightly cool shadows). Board floats with a soft blurred drop shadow on the cream ground with a faint isometric dot lattice; the board's front faces show 3 soil strata + pebbles and a 3-blue water column. Hatched section = cream fill + 45° ink hatch. Text halo: 7 px stroke in ground colour under every label.
- **typography:** one geometric sans, *Jost* (Google Fonts). Station titles Jost 600 caps, tracking .12 em (~2.6 % H); numbers Jost 400 at 44 px (4 % H; poster big numbers ≈ 4–6 % H), units Jost 500 at half size; title = Jost 700 words extruded as isometric blocks on a plate (cream face, coffee-red sides), one word per eighth note. Subtitle = map-label card: cream `#FBF4E6`, 10 px radius, 2 px ink border, tiny red iso cube chip, Jost 500 42 px, 64 px from bottom; border draws 0.2 s then text wipes L→R; exit slides down 8 px + fade. End card = legend (title, total, Isotype bar key, "NOT TO SCALE").
- **motion rules:** people/billboards step on twos (12 fps); camera and everything else on ones. Camera = world centre + **log-interpolated zoom k** (3.75 whole board → 8,000 one bean); projection never rotates. "Nothing moves without a line leading it" (route drawn slightly ahead, leader grows before inset, cut line before cutaway). Cutaway: cut line .3 s → skin slides out along its normal .35 s ease-out (alpha 1→0 between 10–75 %) → hatched rims fade in over last 40 %. Isotype icons pop with back-ease (overshoot 2.2), one per 16th note; count-up numbers over the same span. Accumulation = acceleration (quarter → eighth → waves of ~44 per 16th). Squash 18 % on landing + two small bounces. Solids arrive by motion, never by alpha. Dive: three pushes .9/.6/.6 s; snap-out ×470 in 1.2 s with ease-out in log zoom; tall objects fade in by zoom `alpha = clamp((80−k)/40)`.
- **signature moves:** `iso-diorama-board`, `iso-cutaway`, `isotype-count`, `focus-desaturate`, `inset-callout-circle`, `log-zoom-camera`, `iso-extruded-title`, `legend-end-card`, `map-label-subtitle`.
- **do:** square board (projects to ≈ 16:9 rhombus); Z-shaped route far→near; one hue per meaning, subject hue reserved; numbers must add up; give machines tell-tale parts; leave clearance around hulls/wheels; keep bottom ~170 px clear.
- **don't:** perspective, lighting beyond three tones, outlines on solids, semi-transparent moving solids (ghosts), reusing a hue for two meanings, giant world geometry behind close-ups.
- **source:** lemo-opuscar `styles/iso-infographic/` (MIT code, CC BY 4.0 docs) — `demo/engine.js` (Iso engine), `demo/world.js` (board), `demo/hero.js` (hands close-ups), `demo/film.js` (camera path), `demo/timeline.js`.
- **Port note (MIT):** projection `sx = (x − y)·cos30°·k`, `sy = ((x+y)/2 − z)·k`; painter depth = x+y+z with explicit layer + per-item depth bias and sequence tiebreak; face shading picks top/left/right tone from the face's Newell normal (flip to an outward hint before back-face culling); `push(ox,oy,oz,rot,s)` local frames rotate normals so vehicles shade correctly at any heading; `prism` extrudes any footprint and `shape()` extrudes any 2D outline on a chosen plane; one-colour hook: when `desat > 0` and the item is not flagged `keep`, colour → mix(c, mix(luma, `#E9DFCB`, .45), desat) with luma = .3R+.55G+.15B. Zoom interpolation: lerp log(k) then exp, position eased with eio.

### Techniques

#### `iso-diorama-board` — NEW (sibling of `iso-blocks-3d` / `iso-bar-chart`, which are three.js clay charts; this is a flat 2D true-iso map engine)
- look: a floating isometric board with land, sea, roads, buildings and stations, strata on its front edges, a dashed route connecting pinned stations, clouds with fake parallax.
- params: board S = 240 world units; k 3.75 (overview) to thousands; tri tones as above; route dash 10/8 px, 2 px ink; cloud parallax 1.25×, fade above k ≈ 40.
- build: SVG or Canvas in Remotion; a small `iso` helper (`P`, `box`, `prism`, `cyl`, `flat`, `line3`) with a depth-sorted draw list per frame; props `stations[] {pos, label, value, unit, icon}`, `route[]`, `palette`, `camera keyframes {x,y,k,t}`, `subjectId`, `board {size, strata}`.
- source: `styles/iso-infographic/demo/engine.js`, `world.js` (MIT).
- value: supply chains, onboarding flows, "how X works" explainers, product journeys — a premium Monument-Valley/Kurzgesagt-grade map from data.

#### `iso-cutaway` — NEW
- look: a dashed cut line draws across an isometric object; its near skin slides out along its normal and fades; hatched cream/ink section rims stay, revealing the inside.
- params: cut line .3 s; slide .35 s ease-out, alpha 1→0 between 10 % and 75 %; hatch 45°, 6–8 px pitch; rims fade over last 40 %.
- build: draw object as layers (inside, skin faces); animate skin translate along face normal ×(0→0.6 units); `hatch()` pattern via SVG `<pattern>`; props `object` (box/prism/building), `cutFace`, `startFrame`, `inside` children.
- source: DEMO.md "Cutaway timing"; `engine.js` `cutLine`, `hatch`.
- value: show what's inside a product, server, building, organ, package.

#### `isotype-count` — NEW
- look: a number shown as identical icons popping in one per beat subdivision into a calendar grid, a bar, a row, or a silhouette formed by the icons; count-up digits run in sync.
- params: back-ease overshoot 2.2, one icon per 16th note (≈ 150 ms at 100 BPM); grid via `iconGrid(n, m, cols, gap)`; legend "1 icon = N".
- build: SVG `<use>` of an icon symbol per cell; per-icon start = i·subdiv; scale 0→1 with back-ease; `arrangement: grid | bar | row | silhouette(path)` (silhouette = sample N points inside an SVG path, sorted by y); props `count`, `unitLabel`, `icon`, `bpm`, `color`, `countUp`.
- source: `engine.js` `ICON.*`, `iconGrid`; DEMO.md "Isotype numbers".
- value: stats that feel physical — users, litres, votes; a huge fit for explainers and pitch decks.

#### `focus-desaturate` — NEW
- look: at the key moment everything greys toward warm cream except the subject, which keeps full colour.
- params: desat 0→1 over ~1–2 s; grey = mix(luma, `#E9DFCB`, .45).
- build: wrap children; non-kept layers get an SVG `feColorMatrix` saturate + tint driven by frame (or CSS `filter: saturate()` + overlay); the kept layer is rendered on top unfiltered; props `keepIds`, `amount`, `tint`.
- source: `engine.js` colour pipeline.
- value: "this one" moments in any scene — one user, one product, one data point.

#### `inset-callout-circle` — EXTENDS `callout-labels` (new props: `inset: {r, zoom, content}`, leader that grows into a circular window)
- look: a leader line grows from a point on the map and ends in a circular inset showing a close-up; system and detail on screen together.
- params: leader grow ~.3 s, inset scale-up back-ease ~.35 s, ring 2 px ink + cream halo; inset r ≈ 12–18 % H.
- build: SVG `<clipPath>` circle containing a scaled copy of the child scene or another component.
- source: `engine.js` `inset()`, `pin()`.
- value: zoom-to-detail in maps, dashboards, product shots.

#### `log-zoom-camera` — EXTENDS `powers-of-ten` (new: generic `<LogZoom>` wrapper for any child scene, keyframed `{x, y, k}` with log-space interpolation, LOD fade `alpha = clamp((kMax − k)/w)`)
- look: smooth dives ×35 to ×470 that feel even at every scale; tall objects fade in so pull-outs never sweep giant shapes through frame.
- params: dive .9/.6/.6 s accelerating; snap-out 1.2 s ease-out in log k.
- build: interpolate ln(k) with eased t; pass k into children for LOD.
- source: DEMO.md "Shots".
- value: any map/diagram zoom; fixes the "zoom feels fast then slow" problem.

## 25. `kino-montage` — Constructivist Montage (Edit & Documentary, *410 Days*)

### style `kino-montage` — Constructivist Montage
- **essence:** real archive film, photos and documents printed as one ink-on-paper sheet with a single red, cut on a 120 BPM machine beat; type rides steep −18° bands as structural beams; windows hold footage; people are scissored out of photos and stacked into structures; documents are marked in red; two images collide into an idea (A + B → C).
- **palette:**
  - red (doc `#D52B1E`; meas `#d1291c` 7–13 %) — bands, wedges, key numbers, marker bars, circles, the winner.
  - ink (doc `#141210`; meas `#15110f`, `#141210`) — type, beams, window borders, dark grounds.
  - paper (doc `#EDE4D0`; meas `#e8ddc7`, `#e7dcc7` 55–58 % — slightly darker after fibre multiply) — ground, reversed type, cut-out borders.
  - photographic mid-tones are the ink→paper ramp (meas `#797367`, `#9a9183`, `#534e46`, `#2b2722`).
- **texture / print / post:** one "print grade" for film, photos, documents: luminance → percentile stretch (film 0.7/99.5 per *clip*, never per frame; photos 0.8/99.4) → S-curve `g = x + s·(x−.5)·(1−|2x−1|)·2` with s = .32 (documents .18) → `rgb = INK + (PAPER − INK)·g`. Archive film flickers ±2.5 % per frame inside its window (`hash(frame)`). Paper fibre: a seeded full-frame noise canvas drawn once, multiplied at α .5; film grain 4 added at mux. Documents: red highlighter bar in `multiply` over the exact sentence; hand-drawn red ellipse; drawings keyed off their paper with `alpha = (205 − luma)/90`. Cut-outs: person segmentation → threshold .5 → median → largest component → 7 px paper border dilated outside the mask. Resolution ceilings: archive ≤ 2.5× source px, modern ≤ 1.5×; prep `hqdn3d → lanczos → light unsharp`.
- **typography:** CJK display Noto Sans SC 900 (110–210 px = 10–19 % H; vertical stacks 170 px/char); numbers + English display **Oswald** 600–700 (numbers 230–440 px = 21–41 % H; English lines 30–62 px caps, tracking 2–10 px); tags **Space Mono** Bold 17–18 px on ink/red tabs, padding 6 (`FILM · TITLE · PLACE YEAR`, `PHOTO · AUTHOR YEAR`, source tags); subtitles Noto Sans SC 700 40 px over Oswald 500 28 px, bottom-left, ink bar at 90 % with a 10 px red tick. All on Google Fonts. Never centred, never a header.
- **motion rules:** one grid (120 BPM: beat .5 s, bar 2 s); every cut/slam/wipe/count on beat, half-beat or 16th; shots .5–2 s, accelerations halve .5 → .25 → .125 s (min 3 frames). Adjacent shots must conflict in direction, value (paper/ink ground) or geometry. Nothing static > 1 s (film runs in windows, counters tick, slow pushes). Transitions in-medium: *red wipe* (260 px red band at 72° sweeping in .25 s on the downbeat), *iris* (red marker circle becomes aperture), *slam* (arrival along the axis in .08–.2 s ease-out, hard stop, shake 3–18 px decaying `exp(−14·Δt)`), *flash cut* (1 frame of 50–80 % paper), hard cut between opposite grounds, *jump-in* (1.2× crop inside a freeze with annotations scaling along). Two silences: one where only an original recording remains, one true half-bar (ink frame, one red rivet) before the heaviest hit.
- **signature moves:** `diagonal-band-title`, `print-grade-two-tone`, `document-marker-highlight`, `photomontage-tower`, `marker-iris` (transition), `red-band-wipe` (transition), `spiral-grid-count`, `document-to-chart`, `freeze-annotate-jumpin`, `split-strips-axis`.
- **do:** keep every photographic element in the ink/paper ramp; red laid on top as print; alternate grounds paper → ink → paper; counters carry units and rest on dated anchors while captions are up; one marked sentence per document shot; footage tags on every window.
- **don't:** gold, thin decorative rules, centred headlines/bullets, fades, red on red, upscaled archive full-frame, a single face as hero, per-frame grading (pumping), short labels inside ⅛-beat cuts.
- **source:** lemo-opuscar `styles/kino-montage/` (MIT code, CC BY 4.0 docs) — `demo/index.html` (all formats: `slam`, `flash`, `shake`, `slant`, `cover`, `clipImg`, `txt`), `demo/tools/prep.py` (print grade, cut-outs, keying), `demo/audio/mix.py`.
- **Port note (MIT):** print-grade formula above (pure per-pixel, ports to an SVG `feComponentTransfer` table: precompute the S-curve into a 256-entry `tableValues`, then `feColorMatrix` luma + duotone map); slant windows as parallelograms `[[x0, yTop + tan(a)(x0−x1)], [x1,yTop], [x1,yBot], [x0, yBot + tan(a)(x0−x1)]]`; text on a band placed from the band centre-line point + normal offset, rotated by the axis; shake = amplitude·exp(−14·(t−t0))·hash-noise per frame; flash = paper fill α .6 for 1.5 frames; grid cells lit in spiral order every 16th with back-ease scale; tower camera y follows the eased count of floors built.

### Techniques

#### `diagonal-band-title` — NEW
- look: a red girder band slams in along a −18° axis; a footage window is clipped to the band's top edge; a huge number stamps digit by digit with the unit in red; bilingual line rides on the band.
- params: axis −15° to −30° (default −18°); band ~90–120 px thick; slam .08–.2 s ease-out + shake 3–18 px `exp(−14Δt)`; digits one per eighth (.25 s at 120 BPM); number 21–41 % H Oswald 700.
- build: SVG group rotated by axis; band rect animates translateX from off-frame; `clipPath` polygon for the window above the band edge holding `<OffthreadVideo>`/`<Img>` with the print-grade filter; props `number`, `unit`, `line`, `subline`, `src`, `axisDeg`, `red`, `ink`, `paper`, `bpm`.
- source: `styles/kino-montage/demo/index.html` (`S1`, `slam`, `slant`), STYLE.md §6 "Title package".
- value: bold documentary/anniversary/report openers; product-launch numbers with real photos.

#### `print-grade-two-tone` — EXTENDS `duotone` (new props: `percentile: [lo, hi]` per clip, `sCurve` strength, `flicker` ±%, `paperFibre` multiply, `redOverlay` layer)
- look: any photo/video becomes warm ink on paper with constructivist contrast; archive film keeps a slight flicker.
- params: lo/hi .7/99.5 (film), .8/99.4 (photo); s .32 (.18 docs); flicker ±2.5 %; fibre α .5.
- build: compute percentiles once at prep time (or pass as props); SVG `feComponentTransfer` LUT for stretch + S-curve, then map to ink/paper with `feColorMatrix`/`feComponentTransfer` per channel; fibre = seeded noise PNG multiplied.
- source: STYLE.md §2, `demo/tools/prep.py`.
- value: unifies mixed-source brand archives/user photos into one premium printed look.

#### `document-marker-highlight` — NEW
- look: a tilted scanned page slams in; a red highlighter bar sweeps across one exact sentence (multiply), a hand-drawn red ellipse circles a heading, then the key number repeats huge in a red block beside it.
- params: page tilt 3–6°; marker sweep ~.4–.6 s, height ≈ line height ×1.1, `mix-blend-mode: multiply`; ellipse drawn with stroke-dashoffset over .5 s, slight overshoot/wobble; red block slam .14 s.
- build: `<Img>` of the scan + props `highlight {x,y,w,h}` in page coordinates (so camera pushes keep it aligned), `circle {cx,cy,rx,ry}`, `callout {number, unit}`; marker as SVG rect with rough edges (turbulence displacement).
- source: STYLE.md §6 "Document close-up", §8.1; DEMO.md shot 8.
- value: evidence explainers, legal/finance/news videos, "the report says…" moments, investor updates.

#### `photomontage-tower` — NEW
- look: floors made of footage/photo strips slam in from alternate sides every 16th note, an ink beam under each, a cut-out figure (white paper border) lands on every other floor; the camera climbs; a floor counter runs, rests on a dated anchor while its caption is up, then runs to the end; a crown and a figure on top.
- params: 10 floors in ~.9 s then slower; floor height ≈ 7–9 % H; beam 6–10 px ink; counter rests ≥ readcheck time on anchor; camera y = eased(floorsBuilt)·floorH.
- build: data `floors[] {src, side}`, `cutouts[] {src}`, `anchors[] {value, caption}`; each floor = clipped `<Img>` strip with print-grade; per-floor start = i·sixteenth; parent translateY follows the eased count; props `bpm`, `counterUnit`, `crown`.
- source: STYLE.md §6 "Photomontage tower", DEMO.md shot 14.
- value: "people built this" — company growth, team milestones, user-generated photos stacked into a product/building/logo.

#### `marker-iris` (transition) — EXTENDS transition `iris` (new props: `drawnCircle` red hand-drawn ring anchored to a world point, `anchorFromParent` map transform)
- look: a red marker circle is drawn around a place on a map/photo, then becomes an aperture that opens onto the next footage.
- params: circle draw ~.4 s, hold .25 s, aperture radius grows to frame diagonal in ~.5 s ease-in.
- build: SVG `clipPath` circle whose radius animates; ring stroke drawn with dashoffset, slightly irregular path.
- source: STYLE.md §6 "Map + iris" (`mapXf`, `mapToScreen`).
- value: map-to-place reveals in travel, real-estate, news, logistics.

#### `red-band-wipe` (transition) — EXTENDS transition `wipe` (new props: `band` px width, `angleDeg`, `color`, reveal behind the band)
- look: a 260 px red band at 72° sweeps across in .25 s on the downbeat; the next scene is revealed behind it.
- build: draw old scene, clip new scene to the swept half-plane, draw the band on the boundary.
- source: STYLE.md §5.
- value: punchy on-beat cuts for any bold graphic style.

#### `spiral-grid-count` — EXTENDS `thumbnail-mosaic` (new variant `spiral-count`: 3×3 windows light one per 16th in spiral order, centre counts 1…9 and lights last in red)
- params: cells back()-scale in; each a different clip at 1.4–1.8× speed, ping-pong; xylophone note per cell.
- source: STYLE.md §6 "Grid", DEMO.md shot 5.
- value: "nine stores / nine features / nine cities" counts driven by cuts.

## 26. `lidar-survey` — LiDAR Survey (Evidence Films, *The Fields Under the Forest*)

### style `lidar-survey` — LiDAR Survey
- **essence:** real airborne laser returns of a real place float in a dark, cold void; a scan line or cutting plane passes through them and the cloud condenses into a solid, raking-lit surface that is then measured with amber hairlines. One continuous designed camera move; the cloud is flown through, never wobbled.
- **palette** (doc = STYLE.md §3 / DEMO.md; meas = poster/frames):
  - background (doc) `#05080A`, fog `#0A1013` (meas darkest `#0b0d0e`, `#0c0d0e`) — never pure black.
  - canopy ramp by height 0–28 m (doc) `#1F3F35` → `#5C9A7A` → `#E2F3DC`; intensity drives value, not hue (meas teal band on poster ≈ `#5f8f86`–`#9fc2b4` by eye).
  - ground returns (doc) `#C8B38C` (meas `#c5ae85`, `#af9974`).
  - surface (doc) `#BDB5A6` lit from az 315°, 26° up (meas lit stone `#958f84`, `#9e988c`, `#a6a094`, shadows `#5c5c54`).
  - front / seams (doc) `#D4FFF0` — light, not colour.
  - accent amber (doc) `#FFB347` — found features, readings, section line (visible on styleboard frame as ≈ `#f0b04a` lines).
  - chart second hue (doc) `#83C495` — comparisons only.
- **texture / post:** three.js WebGL, 2× supersample. Points = GL points sized in world units (veg .15 m, ground .20 m, ghost .22 m; `size·proj/dist` clamped 1–5 px·SS), soft discs, opaque + depth-tested; distance fog `1 − exp(−d/1600)` ×.7 toward `#0A1013`. Surface: .5–1 m mesh, smooth normals, baked short-radius AO, raking sun 20–35°, faint 2 m and 10 m contour lines via `fract(z/2)` with `fwidth` anti-aliasing (×.72 darkening, fades with distance), crests lightened, relief exaggeration ×2 noted on screen. Feature lines = distance field in the surface shader kept hairline: `1 − smoothstep(.15 + px/2, .55 + 1.2px, d)` with px = fwidth of world coords. Post: high-threshold bloom (only fronts/seams), vignette `1 − v·smoothstep(.3,.95,|p|)` with p.x ×1.5; **no grain** (encode higher CRF).
- **typography:** readings in **Barlow Condensed** 300 at 110–130 px (10–12 % H); instruments/coords/counts/sources in **IBM Plex Mono** 19–22 px (1.8–2 % H, top-left block: place, lat/long, area, dataset + point count, exaggeration note); labels **Noto Sans SC** 500 24–36 px. Subtitle strip bottom-left: 2 px vertical rule, dark plate fading right, CJK line (≈ 3.4 % H bold) over English (Barlow Condensed ≈ 2.3 % H). Nothing below 19 px.
- **motion rules:** on ones, 24 fps; the camera never stops — a C1 spline over time in target / distance / heading / pitch (no lookAt from nadir). Fronts move on an ease, slowest over the subject. The cutting plane steps on the beat (eased steps + short holds, e.g. 30 → 0 m). Points only appear behind a front or by height, never random fades. Readings pop in small; traced features light up along their length in order. Points never move relative to each other. Transitions are fronts and planes — never crossfades or hard cuts in the cloud.
- **signature moves:** `photo-to-points-scan`, `lidar-canopy-peel`, `points-condense-front`, `hairline-feature-trace`, `section-profile-chart`, `survey-window`, `ghost-regrowth`, `survey-instrument-block`.
- **do:** go low and close (10–20° pitch, 90–150 m) for volume; keep a survey window (dim unpeeled points outside the measured area); one reading at a time in the right third; label exaggeration; credit dataset licences.
- **don't:** rainbow elevation ramps, invented/generated clouds as evidence, noise displacement on points, glow anywhere but fronts, framing a reveal on scan striping at grazing angles, houses/yards in frame.
- **source:** lemo-opuscar `styles/lidar-survey/` (MIT code, CC BY 4.0 docs) — `demo/film.js` (point/surface/photo shaders, camera spline `camAt`, overlay `reading`, `drawSection`), `demo/tools/fetch_ept.py`, `terrain.py`, `trace.py`, `profile.py`, `build_data.py`.
- **Port note (MIT):**
  - *Cutting-plane peel (vertex shader):* above = h − cut (h = height above ground); lift = 2.2·above + .35·above² (returns rise faster the higher they are); size/visibility k ×= 1 − smoothstep(0, 5, above); hot rim = exp(−|above|/.7)·.9 for points near the plane (size ×(1 + .8·hot)); colour lerps to the scan white by smoothstep(0, 3, above).
  - *Front:* a world-space plane coordinate F; ground points fade with k ×= 1 − smoothstep(−2, 10, F − x) while the surface fills in behind with smoothstep(2, 60, behind); a thin bright seam at the front.
  - *Survey window:* multiply visibility by a product of 4 smoothsteps on east/north bounds (soft rectangular stage); outside, points stay dim.
  - *Data packing:* uint16 positions at 1–2 cm + bytes for height-above-ground, class, intensity, seed; HAG = z − DTM triangulated from class-2 returns.

### Techniques

#### `lidar-canopy-peel` — NEW
- look: a dense teal-to-pale point cloud forest; a horizontal plane steps down on the beat; returns above it lift upward, glow white and vanish; a glowing ring marks where the plane meets the trees; a ruler on the frame edge (with the canopy height histogram) tracks the height; bare ground stripes remain.
- params: plane 30 → 0 m in eased beat steps with short holds; lift 2.2·a + .35·a²; fade over 5 m; rim width ~.7 m; ramp `#1F3F35 → #5C9A7A → #E2F3DC`, bg `#05080A`.
- build: three.js `Points` with a custom `ShaderMaterial` (uniforms `uCut`, `uT`), data from a binary (real survey) or a procedural forest generator (seeded trunks + crowns as points) for non-evidence use; props `points` (url) or `procedural {trees, seed}`, `cutKeys[]`, `ramp[]`, `rulerSide`.
- source: lemo-opuscar `styles/lidar-survey/demo/film.js` point shader (MIT).
- value: archaeology/forestry/engineering reveals; metaphor for "strip away the noise to find what matters" in product/brand stories.

#### `points-condense-front` — EXTENDS `pointcloud-orbit` (new props: `front {axis, from, to, ease}`, `surface` heightmap mesh with raking light + contours, `seamColor`)
- look: a bright scan front sweeps across a point cloud; behind it the points give way to a solid, raking-lit stone-coloured surface with faint contours.
- params: seam `#D4FFF0`; fill over ~60 m behind the front; sun az 315° el 26°; contours every 2 m / 10 m.
- build: shared uniform `uFront` in points + surface shaders; surface from a heightmap texture (or our `terrain-build-3d` generator).
- source: `film.js` (uF1/uF2), STYLE.md §2.
- value: "data becomes model" moments — scans to BIM, surveys to designs, prototypes to products.

#### `photo-to-points-scan` — EXTENDS `pointcloud-orbit` (new props: `photoPlane` start, `scanLine` left→right, `craneTilt` nadir→44°)
- look: a locked top-down aerial photo; a scan line crosses it and behind the line the place becomes a 3D point cloud coloured by height while the camera cranes down and tilts to oblique.
- params: scan ~3 s; crackle + 700→3800 Hz sweep on the line; tilt 0° → 44° over the same span.
- build: photo quad with discard behind the front + points revealed by the same front; camera spline.
- source: DEMO.md shot 2.
- value: openers that switch "picture" to "data".

#### `hairline-feature-trace` — NEW
- look: amber hairlines light up along traced features (walls, roads, pipes) on a 3D surface, in order, staying 1 px crisp at any distance.
- params: amber `#FFB347`; head glow ×1.8 at the drawing front; light-up speed ~ .3–.6 km/s screen-equivalent; faint halo smoothstep(4, .5, d)·.06.
- build: three.js: polylines baked into a distance-field texture or `Line2` (fat lines) with a per-vertex arc-length attribute and a `uProgress` uniform; SVG overlay version for 2D maps via projected paths + `stroke-dashoffset`.
- source: `film.js` surface shader (feature field with fwidth).
- value: route/network/boundary reveals on terrains and maps; complements `map-route` and `topdown-terrain`.

#### `section-profile-chart` — NEW
- look: a vertical plane slices one feature; its profile glows on the surface and a dimensioned 2D chart of the real returns (points + fitted line, height/width dimension lines, value in the accent) hangs beside it in the right third.
- params: section glow `exp(−|d|/.22)`; chart ~35 % W × 30 % H; dimension ticks 2 px; reading pops in Barlow Condensed 300.
- build: SVG overlay chart fed with `profile[] {x, z}`; a leader through the shared world→screen function; props `profile`, `units`, `reading`, `anchor3d`.
- source: `film.js` `drawSection`, STYLE.md §8 "The section".
- value: engineering clearances, product dimensions, terrain cross-sections in evidence/explainer videos.

#### `survey-instrument-block` — EXTENDS `hud-chrome` (new variant `survey`: quiet top-left mono block — place, lat/long, area, dataset + point count, exaggeration note — that changes only when the medium does)
- params: IBM Plex Mono 19–22 px, 60–70 % white, 3–4 lines; no frame or crop marks.
- source: poster.jpg, STYLE.md §4.
- value: credibility chrome for maps/data films without sci-fi clutter.

## 27. `living-screencast` — Living Screencast (Information & Keynote, *Clawd Moves In*)

### style `living-screencast` — Living Screencast (hi-res UI + low-res mascot)
- **essence:** a product walkthrough that looks like a Screen-Studio-style recording but every window, menu and diff is redrawn in HTML/CSS/SVG; a big-square-pixel mascot lives *inside* the crisp UI and acts out what the software does. Two actors: the cursor is the user, the mascot is the software. The resolution clash is the look.
- **palette** (doc = DEMO.md CSS vars; meas = poster/frames):
  - UI light theme (doc) ink `#1F1E1C`, clay accent `#D97757`, stressed word `#BD5D3A`; meas app bg `#f9f8f4` (79 %), sidebar/window chrome `#e9dfcf`/`#e0d1bf`, greys `#a3a19d`, `#7f7d79`.
  - desktop wallpaper (meas) warm peach gradient `#ecdecd` → `#d5bfab` (styleboard top-left ≈ `#f1d9c8`).
  - dark theme (doc) ink `#EEEAE2`, clay `#E08565`; meas dark panes `#1b1916`, `#201e1a`, `#272522`, cream text `#fef8f1`.
  - mascot (doc) clay `#D97757`, shading `#B85F40`, eyes `#2A2622`; props pencil `#F2C14E`, heart `#E0543A` (meas sprite `#d77556`, `#df5439`).
  - overlays neutral frosted glass; one product accent max.
- **texture / post:** none (no grain, no fake depth on readable text). Window floats on wallpaper with a soft large shadow. Motion blur only on whip-pans: camera velocity from `camAt(t) − camAt(t − 1/24)` → `stdDeviation = min(36, max(0, |v| − 30)·.3)` per axis applied as an SVG `feGaussianBlur` on an **untransformed wrapper** (slow pushes stay sharp; never blur the transformed sprite layer). Rack focus = CSS blur ≤ 3 px only on panes not being read. Spotlight = vignette + push. Theme switch = CSS `clip-path: circle(r at x y)` over a dark copy of the UI anchored at the toggle.
- **typography:** UI fonts follow the product; demo uses **Inter** (UI, 13–15 px), **JetBrains Mono** (code/tree 13–14.5 px), **Newsreader** (empty-state title 96 px ≈ 9 % H, weight 340, −.02 em; end slogan 64 px with last word clay italic) — all Google Fonts. Info layers only: chapter pill (`01`–`04` clay badge + serif label, ≈ 2 % H), KeyCastr-style key HUD, frosted caption pill at bottom, optional "▶▶ 4×" tag.
- **motion rules:** 30 fps; UI on ones; mascot x snapped to half its pixel size (`round(x/(px/2))·(px/2)`) so it reads stepped. Jumps: 0.14 s wind-up squash (.28), parabolic arc (quadratic Bézier with control y = 2·apex − mean(a,b)), stretch −.22 → −.12 in the air, tucked legs, arms up; landing squash .34·(1−k)·cos(7k) over .22 s + dust. Idle bob on each beat (+.07 squash for .12 s); blink every ~2.9 s with hashed jitter; walk = leg alternation at 9 Hz, sprite flipped by direction. Cursor: spring-eased arced paths, never teleports, small push on click. Every mascot action causes a real UI state change. Camera: one take, zoom ≥ 1, cuts only under chapter transitions; push-in to caret, slow drift, whip-pan with blur, push + vignette freeze, rack focus, pull-back, follow along a list, split reframe. Transitions: chapter-pill wipes, pixel wipes, theme reveal circle; never dissolves.
- **signature moves:** `screen-recorder-camera`, `pixel-mascot-on-ui`, `theme-reveal-circle`, `keystroke-hud`, `ui-cursor-path`, `spotlight-freeze`, `karaoke-hop-words`, `mascot-match-cut-origin`, `cell-division-split`.
- **do:** measure the live DOM (`getBoundingClientRect` → world via camera) every frame and stand the mascot only on top edges; keep a text-free lane for the mascot; mascot hue unused by the UI; product names/modes/shortcuts exactly as documented; one feature per VO line with every visual beat hung on a spoken word.
- **don't:** screenshots, lorem ipsum, invented features, hands/fingers, zooming out past the monitor, blur on text being read, motion blur on a transformed layer, foley on word onsets.
- **source:** lemo-opuscar `styles/living-screencast/` (MIT code, CC BY 4.0 docs) — `demo/film.js` (Actor, Cursor, `W(id, word)` word-anchored timeline, camera), `demo/main.js` (DOM anchors, motion blur, HUD, wipes), `demo/clawd.js` (sprite grid, poses, pixel props), `demo/ui.js`, `demo/index.html` (CSS themes). Note: demo mascot is Anthropic's Clawd (fan film) — never reuse that character; use a user mascot or an original sprite.
- **Port note (MIT):** DOM anchor = element rect → world coords `x = (rect.left + w·fx − W/2)/zoom + camX` (fx/fy pick a point on the element, e.g. top-centre = .5/0); jump arc solved as quadratic Bézier with control point set so the apex hits `min(a.y, b.y) − h`; squash/stretch as scaleY = 1 − sq, scaleX = 1 + sq·k about the feet; velocity-driven anisotropic blur formula above; blink scheduling by hash of the 2.9 s bucket.

### Techniques

#### `pixel-mascot-on-ui` — NEW
- look: a chunky pixel-art mascot (≈ 8–12 sprite px wide, each sprite px 7–14 screen px) walks, jumps and lands on the top edges of crisp UI elements (input box, list rows, headings), with squash/stretch, dust, blinking, beat-synced breathing, pixel props (pencil, "!", heart, sparkles).
- params: wind-up .14 s squash .28; air stretch −.22; landing .22 s damped squash .34; walk 9 Hz legs; blink ~2.9 s; idle bob .07 on each beat; x snapped to half-pixels.
- build: sprite = SVG `<rect>` grid from a small char-map (`props.sprite` rows of chars → colours); position from `anchor` = ref to an element in our `browser-mockup`/`typewriter-code` (measure via `useLayoutEffect` + `getBoundingClientRect` at render, deterministic per frame); segments `[{k:'stand'|'walk'|'jump', from, to, t0, t1, eyes, arms}]`.
- source: lemo-opuscar `styles/living-screencast/demo/film.js` (Actor), `clawd.js` (MIT).
- value: product walkthroughs, app-store previews, onboarding videos with a brand mascot; pairs with our `box-bot` personality.

#### `screen-recorder-camera` — NEW
- look: Screen-Studio-style camera inside a UI: eased auto-zoom to the cursor/caret, slow drift at rest, whip-pans between panes with directional motion blur, zoom never below 1.
- params: blur σ = min(36, max(0, |v_px/frame| − 30)·.3) per axis; push-ins 1 → 1.6–2.4× over .6–1 s eio; drift ±10–20 px over 4 s.
- build: `<ScreenCam keys=[{t, x, y, zoom}]>` wrapper: spline position, log-zoom; outer untransformed div gets `filter: url(#mb)` with `feGaussianBlur stdDeviation="bx by"` computed from frame-to-frame delta; clamp so viewport stays inside the content.
- source: `demo/main.js` l.30–36.
- value: any UI demo in the library (browser-mockup, typewriter-code, sms-thread) instantly looks like a premium product recording.

#### `theme-reveal-circle` (transition) — EXTENDS transition `iris` (new props: `anchorEl` origin on a UI element, same scene in two themes, `escapeFrame` so the effect spreads past the app onto the desktop)
- look: the mascot stomps a toggle; dark mode spreads as a circle from the button over the app, then the desktop; later light returns from the mascot's feet.
- params: radius 0 → frame diagonal in ~.8–1.2 s, eo; edge hard (no feather).
- build: render children twice (light/dark CSS variables); top copy `clip-path: circle(r at x y)`.
- source: `main.js` l.31; styleboard frame.
- value: dark-mode/feature-toggle demos, before/after reveals, rebrand "flip".

#### `keystroke-hud` — NEW
- look: KeyCastr-style frosted key caps (⇧ ⌘ M, ⌘↵) pop in at the bottom as shortcuts are pressed, stack briefly, then fade.
- params: cap height ≈ 4 % H, radius 8 px, frosted glass bg rgba(255,255,255,.7) + blur 12 px, pop .12 s back-ease, hold .8–1.2 s.
- build: props `keys[] {t, combo}`; flex row of SVG/HTML caps; keyboard thock+click SFX on each.
- source: STYLE.md §4, `main.js` HUD.
- value: tutorials, dev-tool demos, productivity apps.

#### `ui-cursor-path` — EXTENDS `browser-mockup` (new props: `cursor[] {t0, t1, to, arc}`, `clicks[]` with push-in pulse, `pet` interaction)
- look: macOS arrow cursor glides on spring-eased arcs (never teleports), dips on click with a small camera push; fades in/out over .15/.2 s.
- params: arc 40 px default; click scale .9 for 3 frames.
- source: `demo/film.js` `Cursor`.
- value: realistic UI demos; cursor "pets" a mascot for delight beats.

#### `karaoke-hop-words` — EXTENDS `kinetic-captions` (new prop: `hopper` sprite/ball that jumps word to word on word timestamps, last word accent italic)
- look: a slogan line in large serif; the mascot hops from word to word exactly as each is spoken.
- params: hop = jump arc between word top-centres, duration = gap to next word (min .18 s); landing squash.
- source: STYLE.md §8, DEMO.md end card.
- value: slogans, step names, sing-along end cards.

## 28. `lowpoly-island` — Low-poly Isometric Island (Materials & 3D, *The Island That Grew*)

### style `lowpoly-island` — Low-poly Isometric Island
- **essence:** a tiny flat-shaded low-poly world (hex tile columns, box houses with prism roofs, cone/icosahedron trees) floating in a faceted sea under an orthographic isometric camera; no horizon — distance dissolves into a screen-space sky gradient. Everything arrives with a bounce and a note; light (not texture) tells the time.
- **palette** (doc = DEMO.md sRGB; meas = poster (night) / docs frame (day) / styleboard (dusk)):
  - ground: sand top `#f3dfab` / side `#e2c68e`; grass `#93c96c`, `#7fbd62`; earth side `#c99c6e`; rock `#b4b8bd` / `#8f949c` (meas day sand `#e8d6a8`, grass `#7eb261`, earth `#a37c53`).
  - walls `#fbf3e6 #f5c2b0 #b5dccb #a9cbe8 #f7df8f #e9c9e6`; roofs `#d9644a #4f7fb8 #e0874f #6a5a8e #3f8f86`; pines `#3f8a5a #4f9c63`; leaves `#7fc36a #9ad06f`; lighthouse `#f6f2ea` / `#d9544a`.
  - emissive windows `#ffc676` (night: the only bright things).
  - time-of-day keyframes zenith / horizon / deep / shallow: dawn `#9fb6cf / #f3d2c4 / #4f8ea3 / #8fc9c4`; day `#88c8e8 / #eaf5f2 / #38a5bc / #86e2d4` (meas sea `#329fb0`, lagoon `#7bd2c5`, haze `#b9d7dc`); dusk `#6f6fa8 / #ffa888 / #5a6a9e / #b08aa6`, sun `#ff9a68` el 8° (meas `#bd828d`, `#b77874`, deep `#1e153e`); night `#12163a / #4a4478 / #23264a / #363a66`, moon `#a9b0e8` (meas `#050f39`, `#201e5f`).
- **texture / post (three.js):** `MeshStandardMaterial({flatShading: true, roughness ≈ .9})`, no textures; per-tile lightness jitter a few %. Post chain at 2× (3840×2160): MSAA + depth → **GTAO** (radius .7, scale 1.5; mandatory, draws tile seams and roof undersides; hide sprites/transparent objects during AO) → sky/haze composite (linearised *orthographic* depth blended into a vertical screen gradient; haze start/end = fractions of frustum height × cot(elevation) so the horizon band stays in the top third at any zoom; hash-grid twinkling stars only where haze is thick) → light tilt-shift blur ≤ 3 px at the frame edges → bloom (threshold .95, strength .22 day / .5 night) → pastel grade (sat 1.04–1.1, soft contrast, blue lift at night) → Neutral tone mapping. **Grain 0.** Water: dense non-indexed plane displaced by 4 summed sines, flat-shaded per triangle; shallow-map canvas redrawn per frame mixing deep→shallow with a faint foam rim; transparent surf ring per coastal tile. Beam: camera-facing ribbon with Gaussian profile, halo copy 2.4× wider at .32.
- **typography:** subtitles **Quicksand** 600, 44 px (4 % H), `#fffdf8`, no box, navy drop shadow blur 14, centred 118 px above bottom, a tiny flat-shaded hex icon beside them whose top colour follows the time of day. Title **Josefin Sans** 600 caps 78 px (7 % H), 16 px tracking, letters rise 55 ms apart from under a thin water line; sub-line Josefin Sans 300 lowercase wide-tracked (≈ 3 % H).
- **motion rules:** on ones, 24 fps, smooth; charm lives in arrival curves. Rise from below: cubic ease up over .5 s then damped overshoot `sin(13s)·e^(−7s)·.18` + splash ring/spray at the break. Drop and stack: fast ease-in fall, bounce `|sin(15s)|·e^(−9s)·.22` with volume-preserving squash `sy = 1 − .16·e^(−12s)·cos(26s)`. Pop: `1 − e^(−9s)·cos(17s)` (~25 % overshoot). Life: mills turn, smoke puffs, birds circle, boats bob on the CPU copy of the water function. One piece per smallest music slot; accelerate by density (halves → quarters → eighths), not tempo. Projection never changes. Camera: ortho, frustum height = zoom (5–7 close, 12–16 island, 420 scale reveal), distance ≥ 3× frustum height; azimuth 45°, elevation 30° build / 33–35° day / 20–25° night (wider sky band for stars) / 50° map-like. Transitions: hard cuts on the beat, time-of-day change, zoom through the sky.
- **signature moves:** `hex-island-grow`, `faceted-sea`, `lowpoly-time-of-day`, `light-beam-ribbon`, `rise-from-water-title`, `ortho-scale-zoom`, `emissive-lights-on`.
- **do:** pastel, low contrast, few hues repeated; shadows + AO as the only darks; keep the sun sideways to camera over water; sink side columns below caps (z-fighting); leave hairline gaps between tiles for AO seams; event-driven score (each landing = a pitched-percussion note, pentatonic).
- **don't:** perspective/fov changes, outlines, black, rounded normals, voxel cubes, textures, grain, two pieces landing in one slot, a double-sided additive cone for beams.
- **source:** lemo-opuscar `styles/lowpoly-island/` (MIT code, CC BY 4.0 docs) — `demo/world.js` (hex layout, props, growth schedule, arrival curves), `demo/sea.js` (wave shader, shallow map, beam-lit water), `demo/post.js` (ortho post), `demo/story.js` (beats, time-of-day keys), `demo/main.js`.
- **Port note (MIT):** hex axial → world `x = √3(q + r/2)`, `z = 1.5r`, columns `CylinderGeometry(r, r, h, 6)`; water height `h(x,z,t) = .075 sin(.9x + 1.25t) + .06 sin(.77z − 1.05t + 1.3) + .045 sin(1.6(x+z) + 2t) + .03 sin(2.3x − 1.9z + 2.6t)` (same function on CPU for floating objects); beam fragment `core = (1−s)^1.7·.42 + e^(−10s)·.75`, alpha = exp(−v²·soft)·core (v = across-ribbon coordinate, s = along); arrival curves as above; time of day = interpolate a keyframe record {zenith, horizon, deep, shallow, sunColor, intensity, elevation, azimuth}.

### Techniques

#### `hex-island-grow` — NEW (sibling of `iso-blocks-3d`; flat-shaded ortho hex world rather than clay bars)
- look: hex tiles rise one per beat-slot out of a faceted sea with a splash ring, then houses stack floor by floor and get prism roofs, trees pop, lamps and windmills appear, while the camera turntables around the growing island.
- params: tile rise .5 s + damped overshoot .18 u; floors .62 u high drop with squash .16; pop overshoot ~25 %; one event per 8th/16th; frustum 12–16; azimuth sweep ~45–90° over the build.
- build: three.js inside `@remotion/three` `ThreeCanvas`; deterministic schedule `events[] {t, kind, cell, note}` from a seeded layout; each mesh's y/scale computed from `(frame/fps − t)` via the curves; props `layout` (axial cells + heights or seeded radius), `palette`, `bpm`, `buildings`, `seed`, `exportNotes` (for SFX/score sync).
- source: lemo-opuscar `styles/lowpoly-island/demo/world.js` (MIT).
- value: "growth" stories — startup year, city planning, community, product ecosystem; doubles as a satisfying loop for websites.

#### `faceted-sea` — NEW
- look: an endless low-poly ocean whose triangles glint individually, with a turquoise shallow rim and foam around any land, fading into a horizonless pastel sky gradient.
- params: plane ~120 × 120 segments, 4-sine wave above; roughness ~.6–.8 (too low = white flashes); deep/shallow per time of day.
- build: `PlaneGeometry` toNonIndexed + `onBeforeCompile` vertex displacement + flatShading; shallow map = 2D canvas of land mask blurred → texture; sky via a full-screen gradient behind an ortho camera + depth-based haze.
- source: `demo/sea.js`, `demo/post.js`.
- value: calm backdrop for any 3D diorama, island/travel/logistics brands; looping hero background.

#### `lowpoly-time-of-day` — EXTENDS `time-of-day-grade` (new: `mode: "lowpoly3d"`, keyframes {zenith, horizon, deep, shallow, sun, elevation, azimuth}, emissive windows switching on at dusk one by one)
- look: facets re-colour as the sun sweeps; dusk warms the horizon; at night everything goes blue-violet and only warm windows and a lighthouse beam glow.
- params: keyframe hexes above; bloom .22 → .5; windows `#ffc676` switch on staggered on beats with a low "whump".
- source: `demo/story.js`, DEMO.md palette.
- value: "a day in the life", shifts, seasons.

#### `light-beam-ribbon` — NEW
- look: a soft volumetric beam (lighthouse, searchlight, projector, torch) sweeps like a clock hand; the sea under it lights in a band with per-facet sparkles.
- params: Gaussian across-profile, root-bright core, halo 2.4× wide at .32, tilted 7° down; one turn per 12 beats.
- build: billboarded ribbon (two quads) with additive shader as in port note; for 2D, an SVG polygon with a linear+radial gradient mask and `mix-blend-mode: screen`.
- source: `demo/world.js` l.175–177, `sea.js` beam-lit water.
- value: night scenes, "spotlight on X", searching/discovery metaphors.

#### `rise-from-water-title` — EXTENDS `mask-rise-title` (new: `waterLine` mask with a thin line, per-letter damped-sine overshoot, splash dots, 55 ms stagger)
- look: wide-tracked caps rise one by one from under a thin horizontal line, overshoot and settle; a light sub-line follows.
- params: Josefin Sans 600 caps, 16 px tracking; stagger 55 ms; overshoot `sin(13s)·e^(−7s)`.
- source: DEMO.md title, poster.jpg.
- value: calm, playful titles for kids/edu/travel brands.

#### `ortho-scale-zoom` — EXTENDS `powers-of-ten` (new: pure orthographic frustum zoom ×25 with no perspective, sky band constant via haze formula, echo object placed far away)
- look: a close-up of one tile pulls out until the whole island is a speck in an empty sea.
- params: frustum 7 → 420 over ~4 s, log-interpolated; haze recomputed per frustum.
- source: DEMO.md "Ending".
- value: "one among many" scale reveals in 3D.

## 29. `microgame` — Microgame Frenzy (Games, *Five-Second Astronaut*)

### style `microgame` — Microgame Frenzy
- **essence:** a rapid-fire party-game film: shouted command word + 2.5–4 s + one action + one result, each microgame drawn in a *different* medium (crayon, ink, terminal, riso, pixel, blueprint…), framed by a fixed flat-toon "home stage" (host, TV frame-within-frame, lives board, stage badge, trigger button) that keeps accelerating. The hero survives every medium through 2–3 silhouette marks (antenna ball, helmet, chest number "05").
- **palette** (doc = `demo/toon.js` P; meas = poster/frames):
  - home stage: deep violet ground `#2a0f5c` (meas `#441568`, `#6f2480`, `#211335`), night `#170838`, ink `#1a1030`, magenta `#ff2e88` (meas `#f6428f`), violet `#6b2bd9` (meas `#6a2ad7`), gold `#ffc928` (meas `#fac225`), cyan `#1fd1d1`, orange `#ff7a1a`, suit cream `#f6f1e4`.
  - fixed success / fail: green `#3bdc5a` (meas `#3cd45a`) / red `#ff3b3b`, used only by stamps and the lives board.
  - per-medium palettes (never tinted by home): riso plates blue `rgb(0,.47,.75)` ≈ `#0078bf`, yellow `rgb(1,.91,0)` ≈ `#ffe800`, pink `rgb(1,.28,.69)` ≈ `#ff47b0` on paper `rgb(.953,.933,.890)` ≈ `#f3eee3` (meas riso frame `#1d78ab`, `#ed5da3`, `#f0504c`, paper `#e7e8de`); crayon paper `rgb(.957,.937,.890)`; terminal amber phosphor; pixel limited palette.
- **texture / post:** home = Canvas 2D flat toon: ~7 px near-black outline, flat fills, **one hard-edged shadow** per part (fill whole shape in shade colour → clip → refill shifted up-left in the light colour → outline), rotating sunburst backdrop, marquee bulbs with glow. Per-medium "material pass" (WebGL2 `glpass.js`): source canvases store channels, shaders print them:
  - *riso:* R/G/B = blue/yellow/pink plate density; each plate offset (misregistration), AM halftone dot `1 − |fract(rot(p)/7) − .5|·1.414` at angles .26 / 0 / 1.31 rad, period 7 px, coverage `smoothstep(±.07, d − (1−spot)·.98 + grain)`, solid above .9, 3.5 % pinholes, roller streak `.82 + .12·vn(p.x·.004, p.y·.05)`; plates multiply over paper with fbm mottling.
  - *crayon:* RGB = wax colour, A = pressure; paper tooth = 4-octave value noise (one octave stretched) → wax deposits where `tooth > 1 − 1.22·pressure`; tooth embossed lit from top-left; knock-out (front shapes erase wax behind).
  - *ink:* wet/dry channels (same family as `ink-wash`); *CRT:* phosphor/scanline shader; *blueprint paper.*
  - pixel medium: 240×135 indexed buffer ×8, auto 1 px ink outline, Bayer dither for glows.
  - white flashes capped at ~60 %.
- **typography:** command word = **Titan One** (Google Fonts), white, thick ink outline (lw 10–12), coloured drop, burst behind, skewed a few degrees; slams in over ~3 frames, holds .75 s → .64 s, then shrinks into a top-left corner tag (≈ 4 % H on frames). Marquee title Titan 66 px per letter on glowing bulbs; stage badge "STAGE 02" Titan; lines in a gold rounded card with 7 px outline + hard shadow, **Lilita One** 50 px (4.6 % H) with a stopwatch/helmet icon, pops in 2 steps at 12 fps. Inside games, each medium's own type (e.g. handwritten "yay!" in crayon, mono in terminal).
- **motion rules:** frame rate is part of the ladder: characters 8 fps → 12 fps → 24 fps (boss); camera, transitions and the timer spark always on ones. Five things accelerate together: BPM (120 → 140 → 160), game length (2 bars 4.0 s → 1.5 bars 2.57 s), stage dwell (1 bar → 2 beats), command hold, character fps. Timer = a fuse with one knot per beat; spark passes each knot on the beat; freezes in replay. Transition through the TV: push into the screen ~.25 s to start, shrink back ~.33 s with ✓/✗ stamp; no fades/blank frames. Failure is performed (overshoot, splat, bonk); instant replay = freeze, half speed, push-in, letterbox, caption in the medium's type. Host ticks every beat; stopping it is the big emotional tool.
- **signature moves:** `command-word-slam`, `fuse-beat-timer`, `tv-screen-transition`, `slot-reel-transition`, `lives-counter`, `riso-plate-pass`, `crayon-pressure-pass`, `medium-switch-hero`, `instant-replay`, `tile-flip-recap`.
- **do:** one rule graspable in < 1 s; model-sheet the hero in every medium; one accent that follows the hero across media; game screen ≈ 40 % frame width; a real silence before the biggest hit; host shouts 0.1 s after the brass stab.
- **don't:** tint media with the home palette, luminance-ramp ASCII figures (hand-author glyph art), ink blobs without designed silhouettes, stacked command tags, 100 % white flashes, global drawing contexts for offscreen buffers, using the reference franchise's name/UI.
- **source:** lemo-opuscar `styles/microgame/` (MIT code, CC BY 4.0 docs) — `demo/glpass.js` (riso, crayon, CRT, ink, blueprint shaders), `demo/toon.js` + `demo/stage.js` + `demo/hud.js` (home look, fuse, command word, stamps, lives), `demo/g_*.js` (one per medium), `demo/film.js` (TV transitions, reels, tiles), `demo/timeline.js`.
- **Port note (MIT):** the riso and crayon fragment shaders are small and self-contained — port the math (above) into a Remotion WebGL `<canvas>` pass or three.js `ShaderMaterial` fed by a 2D canvas whose channels hold plate densities / pressure; hard-shadow toon "part" = fill shade → clip → translate(−sh, −sh) refill light → stroke outline (pure Canvas/SVG: shape + clipPath + offset copy); outlined text = strokeText with lw 10 under fillText + offset shadow copy.

### Techniques

#### `riso-plate-pass` — EXTENDS style `risograph` (new: 3 plates instead of 2, per-plate halftone angles .26/0/1.31 rad at 7 px, per-plate misregistration offsets, pinholes 3.5 %, roller streak, channel-encoded input so any motion can author plate densities)
- look: genuine three-ink riso: blue, fluorescent pink, yellow overprinting multiplicatively, coarse rotated dots, slight plate shifts, streaky coverage on warm paper.
- params: inks `#0078bf`, `#ffe800`, `#ff47b0`; paper `#f3eee3`; offsets 2–6 px animated per "print" (kick on beats); solid above .9 density.
- build: WebGL pass over a canvas (R/G/B = plate density) or SVG approximation (3 `feTurbulence`-free halftone patterns as `<pattern>` circles masked by each plate's luminance, `mix-blend-mode: multiply`, offset by translate).
- source: lemo-opuscar `styles/microgame/demo/glpass.js` `riso` (MIT).
- value: poster/zine looks for events, music, indie brands; overprint is far richer than a duotone filter.

#### `crayon-pressure-pass` — NEW
- look: kid's crayon drawing: waxy strokes that skip over a procedural paper tooth, heavier pressure fills more, zig-zag hatching past the lines, slight emboss of the paper grain, indigo wobbly outlines that boil on twos.
- params: deposit `tooth > 1 − 1.22·pressure`; tooth octaves at 1.35, 2.9, 6.3 px + a stretched 10×1.9 octave; paper `#f4efe3`; 8 fps stepping with line boil.
- build: draw shapes into an offscreen canvas with alpha = pressure (hatch strokes alpha .4–.9), then the shader; SVG approximation: `feTurbulence` (baseFreq .45, 4 oct) → `feComponentTransfer` threshold → `feComposite in` with the stroke layer.
- source: `glpass.js` `crayon`; poster.jpg (TV screen).
- value: kids/edu/family brands, "hand-drawn by a child" moments, playful onboarding.

#### `command-word-slam` — EXTENDS `comic-burst` (new props: `tagCorner` — after the hold the word shrinks into a corner tag; `skewDeg`; `flyOut` for secondary commands; `outlineWidth`)
- look: a huge outlined command ("CATCH!", "LAND IT!") with coloured drop and burst slams in over 3 frames, overshoots, holds ~.7 s, then scales down and slides into the top-left as a small tag before the action starts.
- params: Titan One, white fill, ink outline 10–12 px, drop 8 px; slam 3 frames 1.6× → .95× → 1×; tag scale ≈ .25 at (4 % W, 6 % H).
- source: STYLE.md §4, frames.
- value: TikTok-style instructions, quiz/challenge formats, CTA words.

#### `fuse-beat-timer` — NEW
- look: a rope fuse along the bottom with knots one per beat; a sparkling spark travels along it, passing each knot exactly on the beat, toward a small rocket/bomb at the end; freezes in replays.
- params: knots = beats in the game (4–8); spark spawns 6–10 star particles per frame; rope `#d9a85a` with ink outline; rocket red/cream.
- build: SVG path + `getPointAtLength(progress)` with progress = (frame − start)/(beats·framesPerBeat) (linear, so knots land on beats); props `beats`, `bpm`, `endIcon`, `frozen`.
- source: `demo/hud.js`; frames (bottom right).
- value: countdowns for quizzes, challenges, limited-time offers, on-beat timers.

#### `slot-reel-transition` (transition) — NEW
- look: the frame splits into three vertical reels that spin through earlier frames (motion-smeared), then stop one per beat on SPEED | UP | ! (or any three tiles).
- params: spin ≈ 1 bar; stops on beats 2/3/4 with back-ease overshoot; vertical motion blur 20–40 px while spinning.
- build: three clipped columns each rendering a vertical strip of N earlier thumbnails (props `frames[]` or child scenes), translateY by eased spin; `feGaussianBlur stdDeviation="0 σ"` scaled by speed.
- source: STYLE.md §6, DEMO.md signature shot.
- value: recap/acceleration beats, "level up", jackpot/reward moments, product feature shuffles.

#### `tv-screen-transition` (transition) — EXTENDS transition `zoom` (new props: `frameRect` of a frame-within-the-frame, push-in .25 s / shrink-out .33 s, `stamp: ok|fail` ✓/✗ slam on return)
- look: camera pushes into a TV/phone/cabinet screen until the inner content is full-frame; on return the content shrinks back into the screen and an OK!/✗ stamp slams on it.
- source: STYLE.md §5, poster.jpg (OK! stamp).
- value: device-in-scene demos, game/quiz formats.

#### `lives-counter` — NEW
- look: a dark panel with 3 hero-head icons; on a loss one icon cracks (glass-crack SFX) and greys; the last one blinks; optional "top spot" lighting at the last life.
- params: crack 4–6 frames; blink 2 Hz at 1 life; panel rounded 16 px, ink outline 7 px, hard shadow.
- build: SVG icons + crack polyline mask; props `lives`, `max`, `icon`, `events[] {t, delta}`.
- source: STYLE.md §8 "Lives as UI", poster.jpg.
- value: battery/retries/chances metaphors, gamified explainers, quiz shows.



---

## Summary

**Styles documented: 29.** archive-lighttable, art-deco, ascii-crt, backrooms, blueprint, brick-toy, briefing-board,
caption-news, cel-anime-80s, city-symphony, countdown, crayon-book, dark-keynote, data-physical, dataviz, engraving,
game-show, glass-product, halftone-dossier, hd-2d, hologram-hud, impasto, ink-wash, iso-infographic, kino-montage,
lidar-survey, living-screencast, lowpoly-island, microgame. Relative to our `styles.json`, 24 are new styles and 5
extend ours (ascii-crt → crt-terminal, blueprint → blueprint/cyanotype, halftone-dossier → comic-halftone/newsprint,
hd-2d → pixel-8bit, ink-wash → ink-wash).

**Techniques: 187 in total. NEW 103 · EXTENDS 82 · COVERED 2** (both COVERED items are `stamp-slam` variants).

### Merge notes (do these before building, so we don't make near-duplicates)

- **Document evidence family.** `line-light-up` (archive-lighttable), `doc-highlight-evidence` (caption-news) and
  `document-marker-highlight` (kino-montage) → one motion `document-highlight` with
  `variant: 'backlit' | 'desk' | 'marker-slam'`.
- **CRT family.** `vhs-crt-pass` (core/post/crt.js), `crt-power-on-off` and `phosphor-crt-post` (ascii-crt), plus the
  backrooms `vhs-camcorder-look` → one shared post wrapper `<CrtPass>` with presets `crt-restrained`, `phosphor-mono`
  and `vhs-camcorder`, with `power` and `track` props. Power-on/off doubles as a `crt` transition.
- **Split-grid family.** `split-grid-countdown` (countdown) and `grid-multiply` (city-symphony) → one layout-keyframe
  engine `split-grid` (cells lerp between layouts; add, merge and re-cut on the beat).
- **Exploded views.** `exploded-view-balloons` (blueprint, 2D drawing) and `exploded-view-snap` (glass-product, 3D)
  should share one parts schema.
- **Crayon.** `crayon-wax-shader` (crayon-book) and `crayon-pressure-pass` (microgame) → one shader with a `pressure`
  input. `crayon-hatch-fill` stays separate (geometry).
- **Number counters.** `digit-lock-counter`, `glyph-scramble-number`, `rolling-value-lock` and `number-hook-block` are
  all EXTENDS of `number-counter`: build one `mode: 'roll' | 'lock' | 'scramble'` plus a `block` variant, and use
  fixed-width digit slots (caption-news port note).
- **Captions.** Six EXTENDS of `kinetic-captions` (`caption-slam-keyword`, `live-transcript-box`, `caption-toast`,
  `frosted-glass-subtitle`, `misregistered-headline-pop`, `karaoke-hop-words`) → add them as named `variant`s.
- **3D post.** `toy-macro-dof`, `studio-dof-post` and `tilt-shift-diorama` share the `core/three/post.js` DoF gather →
  build `<ThreePost>` once.

### Top 25 NEW techniques worth building (value × reach ÷ effort, after merging)

| # | id | from style | effort | why |
|---|---|---|---|---|
| 1 | `vhs-crt-pass` (+ power-on/off, tracking) | core/post/crt.js, ascii-crt, backrooms | M | Port the MIT shader almost directly. It is a finish for any motion and upgrades the `crt-terminal` style. |
| 2 | `loupe-magnify` | archive-lighttable | M | The "look closer" beat for any image or document: pincushion lens, RGB rim fringe, push through. |
| 3 | `document-highlight` (merged) | caption-news, kino-montage, archive-lighttable | S | Quote a source line on screen: highlighter sweep, then the number lifts big. Core for news, explainers and fact-checks. |
| 4 | `beat-punch-zoom` | game-show | S | A whole-frame punch-in on each beat. An energy layer for `mix` / any recipe. |
| 5 | `target-lock-box` | hologram-hud | S | An oversized 45° bracket box snaps onto a point and flashes for 3 frames. A universal "look here" pointer. |
| 6 | `proportion-sweep` | caption-news | S | A line sweeps across footage to X %; the passed area goes grey and the % pops. Instant data-on-video. |
| 7 | `isotype-count` | iso-infographic | S | Identical icons pop in one per beat into a grid, bar or silhouette, with a synced count-up. |
| 8 | `deco-door-split` (transition `door`) | art-deco | S | Hinged door leaves with gold edges. A strong new transition. |
| 9 | `screen-recorder-camera` | living-screencast | M | Screen-Studio-style auto-zoom, drift and speed-gated motion blur for any UI motion (`browser-mockup`, `typewriter-code`). |
| 10 | `snap-grid-collapse` | dark-keynote | M | Hundreds of UI items fly on curved paths into a perfect grid on one beat. A keynote "order from chaos". |
| 11 | `ui-accumulation-storm` | dark-keynote | M | Seeded generator of notifications, files and badges piling up faster on the beat. The "overwhelm" setup. |
| 12 | `split-grid` (merged countdown + grid-multiply) | countdown, city-symphony | M | A layout-keyframe split screen: 1 → 9 cells, merge into one with a flash. |
| 13 | `ascii-image-grid` | ascii-crt | M | Any image or logo as real monospace glyphs picked by measured ink density with Bayer dither. |
| 14 | `bulb-marquee-sign` | art-deco | M | Any word becomes a bulb sign (skeletonise → bulbs) that lights per beat and then chases. A sibling of `neon-sign`. |
| 15 | `burin-engrave-hatch` | engraving | L | Any SVG path becomes a self-cutting copperplate engraving (swelling lines, 3 hatch passes). The MIT engine ports 1:1. |
| 16 | `ink-brush-stroke` | ink-wash | M | A real sumi stroke with pressure, a darker contour side and "flying white" dry-brush break-up. |
| 17 | `wax-resist-reveal` | crayon-book | M | A watercolour wash sweeps the page and reveals hidden white-crayon marks. A magical reveal for any text or logo. |
| 18 | `board-print-drop` | briefing-board | M | Cut-out prints drop onto a board with a bounce, a shadow that tightens with height, and magnet clacks. |
| 19 | `ride-dimension-line` | briefing-board | M | Quantities drawn as real lengths at one scale. The camera rides the arrow to a limit line and a pass/fail verdict. |
| 20 | `pixel-mascot-on-ui` | living-screencast | M | A low-res mascot standing on real UI element edges: jumps, squash/stretch, blinks. Pairs with `box-bot`. |
| 21 | `iso-diorama-board` | iso-infographic | L | A flat true-isometric map engine (3-tone faces, floating board with strata, routes, pins) for any process story. |
| 22 | `stack-plates-3d` | data-physical | L | Data as countable 3D plates on a walnut base. Counters follow the plates that have landed. |
| 23 | `knife-paint-plate` | impasto | L | Any illustration or photo repainted as palette-knife strokes (coarse → fine) under a raking light. |
| 24 | `brick-snap-build` | brick-toy | L | Glossy bricks arc in and snap into an object on the beat, stepped at 12 fps with a smooth camera. |
| 25 | `tilt-shift-diorama` | hd-2d | M | A miniature look for any plate or 3D scene (DoF band, with a 2D band-blur fallback). |

Runners-up (value 4, mostly S): `freeze-frame-brackets`, `mission-clock`, `negative-develop-reveal`,
`autofocus-hunt`, `tracking-tear-timejump`, `keystroke-hud`, `fuse-beat-timer`, `slot-reel-transition`,
`diagonal-band-title`, `axis-ratchet-rescale`, `dot-to-stripes-morph`, `cel-shade-crescent`, `chrome-80s-title`,
`holo-solid-ignite`, `spec-chip-rail`, `focus-desaturate`, `iso-cutaway`, `exploded-view-balloons`,
`magnification-roundel`, `crayon-wax-shader`, `halftone-exhibit-numeral`, `frame-blend-timelapse`.

### Port-ready MIT algorithms (prose descriptions are in each style's "Port note")

`core/post/crt.js` VHS/CRT composite · `core/three/post.js` spiral-gather DoF with leak guard + linear soft contrast ·
`core/lib.js` Fritsch–Carlson `monotone`/`track` camera keys and `spring` · archive-lighttable lens (pincushion with
per-channel k, bevel ring, refracting skirt), develop front, perspective ruler `y = horizon + K/D` · art-deco text →
bulb skeleton (Zhang–Suen thinning + crossing-number chain tracing + equal-arc resampling), 7-stop banded-gold sheen,
3-stroke engraved keyline, door split · ascii-crt glyph coverage ramp + Bayer/hash dither pick · backrooms VHS camcorder
shader + multi-frequency fear-scaled handheld · blueprint cyanotype sheet shader, cabinet-oblique sweep extrusion with
hidden-line removal, drafting dash patterns · briefing-board beta-ease LUT (`bease`) and speed-gated shutter blur ·
cel-anime-80s offset-union cel shading (shadow/highlight/rim crescents) · city-symphony speed-curve → frame averaging ·
countdown layout keyframes · crayon-book wax/paper-tooth shader + scanline hatch fill · dark-keynote `flyPose`
(back-eased position + spring rotation) · engraving burin engine (outline-distance shading, 3 hatch passes, swelling
line width) · halftone-dossier density-field halftone · impasto instanced knife-stroke quads + Hertzmann-style
coarse→fine `paintRef` · ink-wash pressure-profile stroke + fbm ink-bloom mask with a tide line · lidar-survey
cutting-plane peel vertex shader + survey window · microgame 3-plate riso pass.

### Appendix: per-group NEW shortlists (as reported per style group)

#### Group 1 NEW shortlist

| id | style | effort | value | pitch |
|---|---|---|---|---|
| `loupe-magnify` | archive-lighttable | M | 5 | Physical magnifier lands on any image/document; 2.5× pincushion lens with RGB fringe, optional push-through. |
| `ascii-image-grid` | ascii-crt | M | 5 | Any image/logo rebuilt as real monospace glyphs by ink density on a strict grid, phosphor-coloured. |
| `bulb-marquee-sign` | art-deco | M | 5 | Any word becomes a theatre marquee of bulbs that ignite one per beat with flash overshoot, then chase. |
| `deco-door-split` | art-deco | S | 5 | Transition: outgoing frame splits on the centre seam into two hinged door leaves with gold edges. |
| `crt-power-on-off` | ascii-crt | S | 5 | Dot → line → frame CRT power-on (and collapse to a dot) as opener/ending/transition. |
| `brick-snap-build` | brick-toy | L | 5 | Glossy toy bricks arc in on the beat and snap into a logo/object; stop-motion 12 fps over a smooth camera. |
| `board-print-drop` | briefing-board | M | 5 | Cut-out photos drop onto a board with bounce, height shadow and magnet clacks — evidence/mood boards. |
| `ride-dimension-line` | briefing-board | M | 5 | Quantities drawn as real lengths to one scale; camera rides the arrow past a limit line; pass/fail verdict. |
| `letters-become-image` | ascii-crt | M | 4 | A typed sentence breaks into letter particles that build a picture made only of those letters. |
| `line-light-up` | archive-lighttable | S | 4 | One line of a document brightens, underlines, and a number lifts into a reading card with its source. |
| `negative-develop-reveal` | archive-lighttable | S | 4 | Amber glass negative develops into a positive behind a spreading warm-edged front. |
| `autofocus-hunt` | backrooms | S | 4 | Lens hunts focus (blur → lock → slip → lock) with zoom; a subject exists only in the sharp window. |
| `tracking-tear-timejump` | backrooms | S | 4 | VHS tracking-tear transition that returns to identical framing with something (clock, light) changed. |
| `exploded-view-balloons` | blueprint | M | 4 | Drawn assembly comes apart part-by-part on 8ths with leader balloons and a filling parts list. |
| `oblique-extrude-drawing` | blueprint | M | 4 | Flat line elevation "turns" into a thick oblique drawing as depth factor animates, hidden lines handled. |
| `erase-to-ghost` | briefing-board | S | 4 | Eraser band sweeps marker work away, leaving a 7 % blurred ghost of the rejected idea. |
| `deco-title-bar` | art-deco | M | 4 | Stepped gold title bar unfolding from centre over sunburst + stepped arch, year badge and wings. |
| `glyph-fractal-push` | ascii-crt | M | 4 | Push into one giant glyph until it's made of lines of smaller text (names, logs, headlines). |
| `liminal-corridor-3d` | backrooms | L | 4 | Endless mustard office of troffers fading into dark fog; flat many-light shading, dead/flickering panels. |
| `brick-collapse-physics` | brick-toy | M | 3 | Built tower tips and breaks into bouncing rigid bricks (pre-simulated, deterministic). |
| `revolving-door-wipe` | art-deco | S | 3 | Glass panel with gold mullions sweeps across, revealing the next scene behind it. |
| `ground-plane-ruler` | archive-lighttable | S | 3 | Perspective measuring tape laid on a photo's ground plane, ticks crowding to the horizon, counter lands. |
| `cyanotype-water-bloom` | blueprint | S | 3 | Drops bloom into deeper-blue stains with tide lines; lines inside soften, signatures bleed. |
| `mode7-floor-perspective` | art-deco | S | 3 | Patterned floor in true one-point perspective, row-by-row, with depth darkening and reflections. |
| `brick-rebuild-morph` | brick-toy | M | 3 | The same bricks lift off one build and reassemble into a different object. |
| `brick-fx-fire-smoke` | brick-toy | S | 2 | Stop-motion flame/smoke made of jittered translucent plates and rolling round bricks. |
| `fig-number-rewrite` | blueprint | S | 2 | "FIG. 1" struck through and rewritten "FIG. 2 · …" as an on-sheet chapter change. |

Counts (group 1, 7 styles): **NEW 27 · EXTENDS 14 · COVERED 1** (42 techniques). Styles documented: archive-lighttable, art-deco, ascii-crt, backrooms, blueprint, brick-toy, briefing-board.

Highest-leverage EXTENDS (cheap, upgrade many existing motions): `toy-macro-dof` (port core/three/post.js DOF+GTAO into three-kit), `vhs-camcorder-look` + `camcorder-osd`, `phosphor-crt-post`, `cyanotype-sheet`, `drafting-order-draw`, `gold-sheen-sweep`, `handheld-fear-rig`; plus the beta-ease LUT (`bease`) from briefing-board for `src/core/ease.ts`.

#### Group 2 NEW shortlist

| id | style | effort | value | pitch |
|---|---|---|---|---|
| `vhs-crt-pass` | cel-anime-80s (core/post/crt.js) | M | 5 | Deterministic VHS-on-CRT post (chroma bleed, scanlines, grille, power-on, tracking noise) over any motion; shader math ports directly. |
| `split-grid-countdown` | countdown | M | 5 | Layout-keyframed split screen that multiplies toward zero and merges many cells into one picture with a flash. |
| `snap-grid-collapse` | dark-keynote | M | 5 | Hundreds of UI items fly on typed curved paths into a perfect grid in one beat — the SaaS "we organise it" shot. |
| `ui-accumulation-storm` | dark-keynote | M | 5 | Seeded generator of escalating notifications/files/badges (on beats), the "problem" act of every product film. |
| `stack-plates-3d` | data-physical | L | 5 | Data as countable PBR plates on a walnut base with cascade/feed assembly and landed-count counters. |
| `proportion-sweep` | caption-news | S | 5 | A line sweeps across footage to X %, the passed side goes dark grey, the % pops — any share statistic in one shot. |
| `wax-resist-reveal` | crayon-book | M | 5 | A watercolour wash sweeps and reveals hidden white-crayon marks/message — a unique storybook reveal. |
| `crayon-wax-shader` | crayon-book | M | 4 | Paper-tooth + pressure-threshold wax look (+ emboss) as a style filter for every flat motion. |
| `mission-clock` | countdown | S | 4 | Fixed-slot T− clock with second drops, sub-second bar, inversion at zero and a control strip. |
| `doc-highlight-evidence` | caption-news (+city-symphony reading light) | M | 4 | Document page on a desk, highlighter sweep from bbox coords, the number popped beside it. |
| `freeze-frame-brackets` | caption-news | S | 4 | Freeze, flash, punch, desaturate, corner brackets and paused timecode — "look at this". |
| `frame-blend-timelapse` | city-symphony | M | 4 | Speed-ramped time-lapse with frame averaging (360° shutter) — light rivers from any clip. |
| `grid-multiply` | city-symphony | M | 4 | 1×2→2×2→3×3→4×4 beat-synced grid that re-tiles over itself and re-cuts on sixteenths. |
| `crayon-hatch-fill` | crayon-book | S | 4 | Zig-zag crayon colouring with overshoot and per-pass pressure, progressive fill. |
| `cel-shade-crescent` | cel-anime-80s | S | 4 | Hard shadow/highlight/rim crescents from an offset copy of the shape — instant cel look for any SVG. |
| `chrome-80s-title` | cel-anime-80s | S | 4 | Chrome-gradient italic title with neon outline, 12 fps flicker, light bar sweep and star glint. |
| `chart-to-installation` | data-physical | M | 4 | Crane-back reveal that turns a 3D chart into a dial/sculpture with inlaid typography. |
| `crowd-tracks` | city-symphony | M | 3 | People rendered as fading orange track lines over a darkened plate — people as data. |
| `map-mask-reveal` | caption-news | M | 3 | A photo grows out of a map region's outline after a choropleth push-in. |
| `news-bug-source-tag` | caption-news | S | 3 | Channel bug + source tag + CC credit chip overlay — attribution as design. |
| `planned-vs-heard-checklist` | countdown | S | 3 | Milestone list that ticks on the clock with red "heard" tags for actual times. |
| `colour-model-relight` | cel-anime-80s | S | 3 | Per-time-of-day palette multipliers (lit/shade/line) instead of a frame filter. |
| `last-object-drop` | data-physical | S | 3 | Engraved brass puck drops with gravity and a tiny bounce to state the total. |
| `day-ring-dial` | city-symphony | S | 3 | Thin 24 h ring with sodium hand that freezes, dims and rewinds with the film. |
| `cam-chip-sync-badge` | countdown | S | 3 | Camera chip + LIVE SYNC / SAME WINDOW badge for honest multi-source cells. |
| `ui-put-away` | dark-keynote | S | 3 | UI dismantles one part per beat (retract, CRT-off squash) to one element. |
| `perspective-card-turn` | dark-keynote | S | 2 | Strip-sliced Y-rotation of a flat card with a light sweep — product "turns on stage" without 3D. |
| `strobe-pair` | city-symphony | S | 2 | Two same-position frames alternating every 2 frames as a time-collapse accent. |

Counts (group 2, 7 styles): **NEW 28 · EXTENDS 24 · COVERED 0**. EXTENDS = caption-slam-keyword, number-hook-block, ledger-split-counters, lit-panel-grid, punch-circle-callout, neon-band-sweep, wet-street-reflection, anime-lens-flare, speed-lines horizontal mode, impact-frame, digit-lock-counter, release-print-grade, reverse-flashback, live-transcript-box, event-flag-bar, countdown profile sub-clock, crayon-line-boil, book-pullback-turn, light-reveal-sweep, glyph-scramble-number, caption-toast, cursor-protagonist, pinned-reading-label, studio-dof-post. The dark-keynote stage/grid is a style token for `styles.json`, not counted. Styles documented: 7.

#### Group 3 NEW shortlist

| id | style | effort | value | one-line pitch |
|---|---|---|---|---|
| `burin-engrave-hatch` | engraving | L | 5 | Any SVG path → self-cutting copperplate engraving (swelling hatch, 3 passes, tone from a distance-field pillow); MIT engine ports almost 1:1 |
| `beat-punch-zoom` | game-show | S | 5 | Music-synced frame punches summed per beat; a universal energy layer for any composition |
| `target-lock-box` | hologram-hud | S | 5 | Oversized 45° box snaps onto a part bbox with a 3-frame flash: the "look here" pointer for UI/product walkthroughs |
| `dot-to-stripes-morph` | dataviz | M | 4 | A dot series sweeps into warming stripes; any closed shape can be stripe-filled |
| `axis-ratchet-rescale` | dataviz | M | 4 | A spike pierces the chart frame and the axis rescales in four ratchet clicks |
| `magnification-roundel` | engraving | M | 4 | Ring scribed on a detail, magnified, flown to the margin with a routed leader and engraved label |
| `wash-bloom-colour` | engraving | M | 4 | Transparent watercolour blooms region by region under line art: spill, tide-line, backruns |
| `comet-pulse-guide` | glass-product | M | 4 | Comet-shaped light pulses (Gaussian head, exp tail, hue drift) travel along any path on the beat |
| `exploded-view-snap` | glass-product | M | 4 | Parts drift apart on a 40° axis, hover, then snap shut in 0.25 s on the downbeat |
| `tilt-shift-diorama` | hd-2d | M | 4 | Tilt-shift band folded into DoF (2D band-blur fallback) to make any plate read as a miniature |
| `halftone-exhibit-numeral` | halftone-dossier | S | 4 | Giant numeral bleeding off-frame, flat ink + clipped halftone overprint |
| `spec-chip-rail` | hologram-hud | S | 4 | Read values shrink into a docked side rail of chips so every fact stays on screen |
| `holo-solid-ignite` | hologram-hud | M | 4 | Wireframe ignites into a Fresnel + interlace hologram with a climbing light wave and beam |
| `glass-strip-sweep` | glass-product | L | 4 | Per-frame PMREM strip studio; a sweep light behind camera draws dispersive glass contours |
| `candy-set-backdrop` | game-show | S | 3 | Candy stripes / polka dots / rotating sunburst sets with a floor band, one hue per section |
| `remix-thumbnail-shelf` | game-show | M | 3 | Each bit plays centre stage then shrinks into a bottom shelf; all bounce at the finale |
| `mugshot-height-chart` | halftone-dossier | S | 3 | "Meet the suspect" height-chart backdrop with name plate and double flash for any subject |
| `redaction-bars` | halftone-dossier | S | 3 | Black bars print over words and lift one by one |
| `lit-pixel-sprite` | hd-2d | L | 3 | Stepped pixel sprites lit by real lights, casting shadows, in a smooth world |
| `practical-light-shadow-jump` | hd-2d | M | 3 | A lamp switches on, shadows swing across the floor, mood flips cold→warm |
| `copper-proof-pull` | engraving | M | 3 | Burin cuts glinting copper, then a sheet peels to reveal the true printed image |
| `empty-next-cell` | dataviz | S | 2 | Dashed pencil slot for the unknown next value, widening into an end card |
| `frost-to-clear` | glass-product | S | 2 | Frosted shell clears to reveal the inside |

Counts — styles: 7 (`dataviz`, `engraving`, `game-show`, `glass-product`, `halftone-dossier`, `hd-2d`, `hologram-hud`). Techniques: **NEW 23 · EXTENDS 19 · COVERED 1** (43 total).
- EXTENDS (19): pencil-chart-draw→live-chart, pinned-hand-annotation→callout-labels, natural-size-inset→callout-labels, bean-crowd-drop→crowd-bob, round-card-jingle→chapter-header, judgement-telop-pop→comic-burst, floor-caustic-rings→caustics-godrays, frosted-glass-subtitle→kinetic-captions, glint-thin-title→blur-in-title, halftone-density-field→dot-matrix, stamp-slam rough ink→stamp-slam, halftone-dot-wipe→transition `dots`, misregistered-headline-pop→kinetic-captions, lights-pop-on-map→city-skyline, rpg-dialogue-box→story-caption-box, ornament-chapter-card→chapter-header, holo-scan-wireframe→wireframe-build, rolling-value-lock→number-counter, hud-subtitle-voiceprint→hud-chrome.
- COVERED (1): report-card-stamp (stamp-slam + typewriter-signature).
- Style-level relations to our `styles.json`: `engraving` is a NEW style (closest: `woodcut`, `pencil-sketch`); `halftone-dossier` extends `comic-halftone`/`newsprint`; `hd-2d` extends `pixel-8bit`; `hologram-hud` relates to `crt-terminal`/`neon-noir` (new style); `dataviz`, `game-show`, `glass-product` are NEW styles.

#### Group 4 NEW shortlist

| id | style | effort | value | pitch |
|---|---|---|---|---|
| `isotype-count` | iso-infographic | S | 5 | Numbers as identical icons popping one per beat into grids, bars or a silhouette, with a synced count-up. |
| `iso-diorama-board` | iso-infographic | L | 5 | Flat true-isometric map engine (3-tone faces, floating board with strata, route, pins) for any process story. |
| `screen-recorder-camera` | living-screencast | M | 5 | Screen-Studio camera for any UI motion: auto-zoom, drift, whip-pans with velocity-driven motion blur only when fast. |
| `pixel-mascot-on-ui` | living-screencast | M | 5 | Chunky pixel mascot that stands on real UI element edges, jumps with squash/stretch, blinks and breathes on the beat. |
| `knife-paint-plate` | impasto | L | 5 | Any illustration/photo repainted as palette-knife oil strokes lit by a raking light over a height field. |
| `ink-brush-stroke` | ink-wash | M | 5 | Real sumi brushstroke paint-on: loaded body, darker contour side, bristle tracks breaking into flying white. |
| `document-marker-highlight` | kino-montage | S | 5 | Scanned page slams in; red multiply highlighter sweeps one exact sentence; the number repeats huge in a red block. |
| `diagonal-band-title` | kino-montage | M | 4 | Constructivist red girder slams along −18°, footage window clipped to its edge, digits stamped per eighth. |
| `focus-desaturate` | iso-infographic | S | 4 | Everything drains to warm grey except the kept subject — instant "this one" beat for any scene. |
| `iso-cutaway` | iso-infographic | M | 4 | Cut line draws, the near skin slides out along its normal, hatched section rims reveal the inside. |
| `fuse-beat-timer` | microgame | S | 4 | Rope fuse with a knot per beat; the spark hits each knot exactly on the beat toward a rocket. |
| `slot-reel-transition` | microgame | M | 4 | Frame splits into three spinning reels of earlier frames that stop one per beat (SPEED / UP / !). |
| `crayon-pressure-pass` | microgame | M | 4 | Crayon look: wax deposited where procedural paper tooth beats pressure, embossed grain, boiling outlines on twos. |
| `knife-colour-relay` | impasto | M | 4 | Grey world re-laid in colour stroke by stroke by a wave (or one coloured exception). |
| `hex-island-grow` | lowpoly-island | L | 4 | Flat-shaded ortho hex island rising tile by tile from the sea with splashes, stacking floors, popping trees — one note per piece. |
| `photomontage-tower` | kino-montage | M | 4 | Footage strips slam in as floors from alternating sides with cut-out people on them; the camera climbs, a counter rests on anchors. |
| `keystroke-hud` | living-screencast | S | 4 | KeyCastr-style frosted key caps popping in for shortcuts. |
| `handscroll-reveal` | ink-wash | M | 4 | Long painting pans right→left like a scroll, then pulls back to the mounted scroll with a seal. |
| `lidar-canopy-peel` | lidar-survey | L | 4 | Height plane steps down through a point-cloud forest; returns above lift, glow and vanish; a ruler tracks it. |
| `faceted-sea` | lowpoly-island | M | 3 | Endless flat-shaded low-poly ocean with lagoon rims and a horizonless pastel sky gradient. |
| `lives-counter` | microgame | S | 3 | Three hero icons; one cracks per loss, the last blinks — tension without narration. |
| `hairline-feature-trace` | lidar-survey | M | 3 | Amber hairlines light up along traced features on a 3D surface/map, staying 1 px crisp at any distance. |
| `section-profile-chart` | lidar-survey | M | 3 | A plane slices a feature; a dimensioned profile chart of real samples hangs beside it. |
| `light-beam-ribbon` | lowpoly-island | S | 3 | Soft Gaussian searchlight/lighthouse beam sweeping like a clock hand, lighting the ground below. |
| `overhead-trail-mandala` | impasto | M | 3 | Top-down umbrellas dance in rings, dripping colour trails that form a mandala on the pull-back. |

Counts (group 4, 8 styles: impasto, ink-wash, iso-infographic, kino-montage, lidar-survey, living-screencast, lowpoly-island, microgame): **NEW 25 · EXTENDS 25 · COVERED 0**; styles documented 8 (one, `ink-wash`, upgrades an existing filter style; `risograph` gets a 3-plate extension via `riso-plate-pass`).

