# lemo-opuscar — styles, second half (B)

**Source:** `C:\Users\govin\Music\opus_sources\repos\lemo-opuscar`, which is LemoLab / @lemomo_ai `lemo-opuscar`. The code is MIT
and the docs (STYLE.md, DEMO.md, TECHNIQUE.md, styleboard) are CC BY 4.0. Credit it as "after LemoLab lemo-opuscar
`styles/<id>` (MIT code, CC BY 4.0 docs)".
**Scope:** 29 style folders, `midcentury-toon` … `woodcut`, plus a schema note on `_template`, plus the OPUSCAR 98 per-film
style list. The first half of `styles/` and the shared core (`core/`, TECHNIQUE.md) are covered in
`analysis/sources/lemo-styles-a.md` by another agent.
**Method:** for each style we read STYLE.md, style.json and DEMO.md, skimmed the demo code (`styles/<s>/demo/*.js`,
`engine/`, `src/`) and looked at `poster.jpg`, `docs/frames/<s>.jpg` and `styleboard/img/<s>_0.jpg`. Palettes were
measured with PIL: median-cut, top 10 colours by area, plus a saturated-pixel accent pass. Each hex is marked *measured*
or *documented*. Nothing from the source was executed. Algorithms are described in our own words.
**Compared against:** `catalog.json` (109 motions), the transitions in `src/transitions.tsx` (cut, fade, slide, wipe, clock,
flip, iris, blob, tear, zoom, flash, glitch, ripple, spiral, wave, bands, diagonal, push-blur, page-turn, storm, whiteout,
bar, strip, dots, xray), and the style engine `src/styles/engine.tsx`. The engine has 13 styles: woodcut, risograph, ink-wash,
blueprint, pixel-8bit, comic-halftone, watercolor, newsprint, neon-noir, crt-terminal, pencil-sketch, cyanotype and
film-noir. Its FilterSteps are saturate, contrast, brightness, posterize, gradientMap, threshold, pixelate, blur, edges,
halftone, lines, misregister, wobble, bleed, grain, tint and glow, and its overlays are paper, vignette, scanlines,
letterbox, deckle, frameLine, filmGrain and leak.

## Summary

**Styles documented: 29.** midcentury-toon, news-package, newsreel, one-line, paper-lantern, paper-popup, papercut-red,
pictogram-motion, pixel-rpg, risograph, rubber-hose, satellite-briefing, scifi-toon, shadow-puppet, silent-film,
silkscreen-poster, spy-titles, stained-glass, swiss-motion, teardown, telestrator, tilt-shift, ukiyoe, urban-sketch,
visual-investigation, watercolor, white-model, whiteboard, woodcut. There is also a schema note on `_template`.
- Three of these are upgrades of a style id the engine already has: `risograph` (real per-ink plates, not a gradient
  map), `watercolor` and `woodcut` (carve-in, wood grain, per-layer on-twos). The other 26 are NEW styles.

**Techniques: 136 in total, of which 76 are NEW and 60 EXTEND an existing motion, transition or engine step. 0 are COVERED as separate
entries.** When a style re-uses something we already have (`neon-sign`, `rain`, `stamp-slam`, `split-compare`,
`sign-drop`, `comic-burst`, `beat-montage`, `origami-fold`, `confetti-burst`, `whiteout`…), the style section says so and
does not add a technique entry.

**OPUSCAR 98:** 98 per-film style prompts. 17 of them map onto an existing style folder. The other 81 films are
grouped into 73 extra style ideas, listed at the end one line each; related films share a line.

### Top 25 NEW techniques worth building (ranked for reuse by host projects and AI agents)
| # | id | style | why |
|---|---|---|---|
| 1 | `tilt-shift-lens` | tilt-shift | turns any aerial photo, footage or our 3D/top-down motions into a model town; cheap and very reusable; also adds a `bandBlur` step |
| 2 | `sticker-cutout` | paper-popup | a `stickerBorder` filter step that gives any transparent motion a die-cut paper edge; one filter, works everywhere |
| 3 | `telestrator-freeze` | telestrator | freeze, flash, desaturate, spotlight, then marker rings and arrows over any footage or screenshot |
| 4 | `brush-paint-in` | watercolor | a dry-brush stroke renderer for any path (logos, icons, plants); adds a `brush` mode to draw-on motions |
| 5 | `news-strap` | news-package | a broadcast lower third (category tab, headline, source line), overlay-capable; the library has none |
| 6 | `toon-cel-shape` | midcentury-toon | core primitive: fill off-register from a breathing ink line, jittered on twos; unlocks the 1950s cartoon look |
| 7 | `wash-arrival` | urban-sketch | watercolour spreads from a source with a ragged wet edge, so a line sketch becomes a painted scene |
| 8 | `doc-highlight` | visual-investigation | a document scan greyed out, a red highlight wiping along a line, strike-through and a fact-check card |
| 9 | `evidence-board` | visual-investigation | evidence tiles whose red links all point to one spot, with check badges; for fact-checks and incident explainers |
| 10 | `intertitle-card` | silent-film | Deco-bordered silent-film card in four moods; cheap; for chapters, quotes and punchlines |
| 11 | `squeegee-pull` | silkscreen-poster | ink revealed behind a squeegee blade with a ragged edge; works as a motion helper and a `squeegee` transition |
| 12 | `marker-ring-arrow` | telestrator | broadcast marker arrows, a perspective ring and a comet trail; a transparent overlay for annotating anything |
| 13 | `woodcut-carve` | woodcut | a photo or video frame turned into knife cuts that follow the forms and carve in live |
| 14 | `motif-grid-pattern` | pictogram-motion | brandable grid of discs and motif tiles in five tones, rows sliding on the beat; works as a website backdrop and as a transition |
| 15 | `pictogram-figure` | pictogram-motion | faceless geometric figure posed from beat keyframes; "a person doing X" without designing a character |
| 16 | `time-rings` | satellite-briefing | soft scan passes swap dated images and leave each date's outline as a ring; before/after over time |
| 17 | `scan-swap` | satellite-briefing | feathered scanner-front transition (`scan`); run upward it reads as a rewind |
| 18 | `diagonal-assemble-title` | spy-titles | the frame splits into diagonal strips and letters fly in along the cut on 16th notes; logo or name reveal |
| 19 | `knife-cut` | swiss-motion | a 2 px strike line, then the element collapses to its midline; removes text without a fade, can also be a transition |
| 20 | `exploded-stack` | teardown | 3D layers lift top-first in a wave with an orbiting camera and a label column; hardware and architecture explainers |
| 21 | `board-camera` | whiteboard | one huge board, a camera dollying between regions with sheen and motion blur; links hand-drawn motions into one explainer |
| 22 | `nib-follow-camera` | one-line | camera that follows the pen tip with lag, lookahead and soft bounds; for every draw-on and route motion |
| 23 | `theatre-gate` | silent-film | shows any motion as a 4:3 print between opening curtains; also fixes 4:3 content inside 16:9 |
| 24 | `press-lift` | shadow-puppet | entrance/exit preset for any layer: comes in large and blurred, snaps sharp, grows and blurs away on exit |
| 25 | `woodblock-print-reveal` | ukiyoe | colour blocks print one by one with a ragged sweep and land slightly off register; craft or heritage opener for logos |

Next tier: `lightbox-stack`, `rundown-board`, `sting-bug`, `frame-breakout`, `sync-grid`, `dot-tally`,
`screenprint-poster`, `riso-plate-reveal`, `popup-spread`, `spinning-headline`, `light-band-window`, `eraser-rewind`,
`bouncing-ball-singalong`, and the transitions `blinds`, `cloud-curtain`, `portal-wipe`, `pillar-wipe`, `mosaic`/`swirl`.

### Style-engine additions proposed across all parts (deduplicated)
- **Hero colour:** `keepHue` / `selectiveColor` / `chromaKeep` desaturates everything except a masked layer or a hue band. It is
  also the main rule of OPUSCAR 98.
- **Plates and registration:** `risoPlates` (per-ink separation with each plate offset), `celRegister` (fill offset from
  the line), `trap`, `spotPlate`, and an overlay `registration`. This generalises the current `misregister`.
- **Line and hand:** `boil` (cycle wobble seeds on twos), `hatch` (form-following hatching from luminance),
  `lineAndWash`, `edgeDarken` (watercolour tide-mark), `dryBrush`, `dryMarker`, `inkSheen`.
- **Material grain:** `woodgrain` (proposed in both D and E), `baren`, `speck` / `inkSpecks`, `pinholes`, `clothWeave`, `cutEdge`,
  `cutGap`, `leadCells`, `transmit` (backlit glass or paper), `stickerBorder`.
- **Optics and tone:** `bandBlur` (tilt-shift), `clarity`, `dither` (ordered or indexed), `bandify` / `hueTonemap`,
  `bloom`.
- **Film and screen overlays:** `filmDamage` / `projector` (flicker, weave, scratches, dust), `gate` / `filmGate` /
  `theatreGate` (pillarbox, rounded gate, curtains), `lampField`, `lightBand`, `spotlight`, `grid`, `board`, `sheen`,
  `kasumi` / `bokashi` (ukiyo-e mist bands and gradations), `fray`, `inkVoid`, `cutFlash`.
- **Engine behaviour:** on-twos per layer (characters stepped, camera smooth), and grading that applies only to image
  sources (grey the evidence, keep the red accent and the text crisp). We should also add `signatureShot`, `camera[]`,
  `avoid[]` and `confusableWith[]` to `StyleDef`; see the `_template` note in part E.
- **New transition types proposed:** blinds, cloud-curtain, rows/cols/quarter/tile-flip, mosaic, swirl, overprint,
  scan, peel, grab-iris, portal-wipe, pillar-wipe, squeegee, knife-cut, handscroll, rewind, mist-erase, print-pull, and
  a 2-frame misregister jolt on `cut`.

---

<!-- part A: lemo-opuscar styles: midcentury-toon, news-package, newsreel, one-line, paper-lantern, paper-popup -->

Source repo for everything below: `opus_sources/repos/lemo-opuscar` (code MIT, docs/STYLE.md/DEMO.md CC BY 4.0, by LemoLab / @lemomo_ai).
Attribution string to use in `source:` fields: `lemo-opuscar/styles/<id>/ (MIT code, CC BY 4.0 docs, LemoLab)`.
All algorithms are restated in my own words; numbers/hexes are from the source docs or the demo code (marked) or from the
PIL measurements in context.txt (marked "measured"). Nothing in the source was executed; images were viewed with Read.

Mapping vocabulary used below: "our steps" = existing `FilterStep` types in `src/styles/engine.tsx`
(saturate, contrast, brightness, posterize, gradientMap, threshold, pixelate, blur, edges, halftone, lines, misregister,
wobble, bleed, grain, tint, glow) and overlays (paper, vignette, scanlines, letterbox, deckle, frameLine, filmGrain, leak),
`step` = hold frames. Anything else is flagged **NEW STEP** / **NEW OVERLAY** with an algorithm.

---

## midcentury-toon

### style `midcentury-toon` — Mid-century Cartoon (1950s flat colour, limited animation)

- **essence**: 1950s classroom/how-to film in flat atomic-age colour: every fill is a separate "cel" printed a few px
  off its thin, breaking, breathing warm-black ink line; geometric presenters whose bodies hold still while only hands,
  eyes and mouth move; rooms reduced to one colour plane + floor band + a broken horizon line. It *performs a use*
  (set-up guide, rules card, recipe), numbered and calm.
- **palette** (documented = DEMO.md content.json defaults; measured = context.txt):
  - bg/paper `#F4EAD5` (doc) ≈ `#F5EAD6` (measured, poster 23 %); paper shades `#E6D8BC`, `#D4C29F` (doc), `#EADFC9` (measured)
  - ink (warm black) `#2B2420` (doc; measured darkest `#1B1512`, AA mid-tones `#604F3D`–`#7B695F`)
  - accent (coral, presenter garment) `#E4613F` / dark `#B8452B` (doc)
  - accent2 (mustard, hook ground, stars, dots) `#E8B43A` (doc) = `#E7B43B` (measured top saturated accent) / light `#F3D37F` (doc), `#EFCD7F` (measured)
  - product (turquoise — keeps one colour through the whole film) `#3FA7A0` / dark `#257A74` (doc)
  - step grounds (rotate per scene): dusty blue `#7F9CC0`, avocado `#A7AE5B`, pink `#F0B4A8`, plum `#6E4A6B`; navy `#3B4766`; kraft `#C9955D`/`#A2713F`/`#DDB47F`; skin `#F2C7A0` (all doc)
  - rule: walls = tint(ground, .45) toward white, floors = shade(ground, .16) toward black; never the product on its own colour.
- **texture / print / post recipe**
  - Off-register cel: fill drawn offset `(+6, +4)` px from its line, offset re-rolled every 2 frames by ±1.6 px
    (hash of floor(frame/2)+seed). Applies to text too (two-plate type: colour plate offset 4–7 px under the ink plate).
    → **NEW STEP `celRegister`** `{dx:6, dy:4, jitter:1.6, inkAt:0.28, breaks:0.18, seed}` for the style engine
    (works on any rendered motion): (1) ink mask = luminance < inkAt (feColorMatrix LUMA → feComponentTransfer discrete);
    (2) fills = SourceGraphic with ink knocked out (feComposite out), then feMorphology dilate r=2 to close the holes;
    (3) feOffset fills by (dx+jx, dy+jy) where jx,jy come from `hash(floor(frame/step))` (same mechanism as `wobble.boil`);
    (4) ink breaks: feTurbulence (baseFrequency ≈ 1/(lineW·11), 1 octave, seeded) thresholded at `breaks` → feComposite
    `out` on the ink mask so 12–25 % of the line length is missing in soft gaps; (5) composite: paper flood → offset fills
    → ink on top. For our own SVG-drawn motions prefer the vector primitive (technique `toon-cel-shape` below).
  - Ink line: 3–5 px ribbon whose half-width = w/2·(1 + 0.4·(noise(d/(16w)) − 0.5)·2), tapered over 4w at open ends,
    with gaps where noise(d/(11w)) < breaks/2. Characters 4 px, props 3–4.5, plan walls 6–7 px broken.
  - Shading: one flat darker plane clipped inside a shape (never a gradient). Drop shadow = copy of the shape offset
    (12, 12) in a paper shade at 50 %.
  - Dry-brush tooth inside every fill: ~3600 short near-horizontal flecks (length 2–11 px, angle ±0.17 rad,
    rgba(40,25,15, .05–.21)) in a 512 tile + ~2600 cream "print holes" (rgba(255,250,236,.1–.42)), clipped to the
    shape, at ~0.35 strength. → our `grain` step is close but isotropic; acceptable approximation:
    `grain {amount .06, size 1.2}` + **NEW STEP option `grain.streak`** (feTurbulence baseFrequency "0.02 0.6" = horizontal
    streaks) if we want the dragged-paint look.
  - Finish: paper mottling tile (fbm, ±23) composited `overlay` at 0.26 + fibres; warm radial vignette multiply
    0.14 from 0.45H to 1.05H in rgb(110,80,50). → overlays `paper {color:'#F4EAD5', amount:.26, fiber:.5}`,
    `vignette {amount:.14, color:'#6E5032'}`, `filmGrain: .04` (mux grain 4 = light; "print, not film").
  - Ornaments: 4-point atomic sparkles, 8–18-point starbursts (inner .42), sunburst rays (30 wedges, 55 % alpha, slow
    rotation 0.06 rad/s), atom (3 ellipses rx:ry 1:.34 at 60°), boomerang, kidney, polka dots.
  - Suggested StyleDef: `steps: [{saturate:.95},{posterize:6},{celRegister:{dx:6,dy:4,jitter:1.6,breaks:.18}},
    {grain:.06}]`, `overlays: {paper, vignette}`, `step: 2`.
- **typography** (source → Google Fonts, all OFL, same faces available): kicker script **Oleo Script** 700;
  titles/numerals/headers **Alfa Slab One** (ink fill over an offset cream or colour plate, 4–7 px); body/labels/captions
  **Jost** 500/600 (letter-spaced caps, tracking ~0.35 em, for small labels "STEP 2 OF 4"). Caption card: Jost 500 42 px
  on a paper rounded slab with 3.6 px ink border, its colour cel offset 5 px, coral 8-point stars spinning at both ends,
  60 px above the bottom; fade 0.16 s with 10 px rise.
- **motion rules**: 24 fps master; poses, hand shapes, cel jitter **on twos** (12 fps); camera, irises, arrows, routes
  and rays on ones. Held body, moving hands: pose switch with a single in-between; hand action = anticipation 20–60 px →
  fast action 0.15–0.25 s ease-out → recoil 6–10 px → settle, landing on a beat. Pop-ins (medallions, tags, titles):
  back-ease 0.24–0.3 s, overshoot ≈1.9. Headers slide in on twos. Camera is "the stand": slow push 1.00→1.07, trucks,
  tilts, pull-back with counter-rotation; never handheld. Transitions: circles (medallion iris, button iris, iris-out),
  colour-block wipes (side for a tip, bottom-up for a summary) with a 6 px ink edge line, hard cuts on a beat; **no
  dissolves**. Dead still ≥ 3 s on the summary ("screenshot frame"). 132 BPM grid in the demo; ≥ 3 bars per step.
- **signature moves**: ours — `iris` (transition), `wipe`, `callout-labels`, `stamp-slam`, `sparkle-burst`,
  `heart-draw-fill` (icon fill), `chapter-header`; proposed — `toon-cel-shape`, `step-medallion-iris`,
  `callout-magnifier`, `coverage-route`, `sunburst-hero`.
- **do**: one ground colour per scene (walls tint, floor shade); product keeps one hue all film; keep register offset on
  text too; data lands on the picture inside the call-out on the action beat; reading time ≥ chars/12 + 1 s.
  **don't**: gradients inside shapes, neon/pure colours, black-and-white rubber-hose bounce, whiteboard "explaining",
  zooming the world for close-ups (triples ink weight — draw the close-up inside a call-out at native scale), separate
  nose wedges, fat-blob glove fingers.
- **source**: `lemo-opuscar/styles/midcentury-toon/` STYLE.md, DEMO.md, demo/engine/toon.js, demo/film.js
  (MIT code, CC BY 4.0 docs).

### `toon-cel-shape` — NEW (core primitive, used by every toon motion)
- look: any closed shape drawn as an off-register flat fill + a broken, pressure-varying ink ribbon; fill shimmers on
  twos as if hand-registered; light dry-brush tooth inside the fill. Text gets the same two-plate treatment.
- params: offset (6,4) px, jitter ±1.6 px re-rolled every 2 frames; line 3–5 px, width breathing ±40 %
  (noise period 16·w along the path), breaks 12–25 % (noise period 11·w), end taper over 4·w; drop shadow (12,12) at
  50 % paper shade; tooth 0.15–0.35.
- build: `src/core/toon.tsx` exporting `<ToonShape d|points fill line breaks seed regK shade/>` and `<ToonText>`.
  Sample the path by arc length (reuse `core/shapes` sampling), compute per-sample half-width
  `w/2·max(.08, 1+wob·(vnoise(s/(16w), seed)−.5)·2)·taper(s)`; split into runs where
  `vnoise(s/(11w), seed+7.3) < breaks/2`; emit each run as a filled polygon (left offsets + reversed right offsets) plus
  round end caps. Fill path translated by `reg(frame, seed) = [dx + (hash(floor(frame/2),seed,1)−.5)·2·jit, …]`.
  Tooth: one shared `<pattern>` (seeded streak flecks drawn once) clipped by the fill, opacity = tooth·0.6.
  Props: `fill, line, lineColor, breaks, wob, seed, off?, jitter, tooth, shadow, drawOn (0..1 → subpath)`.
  `drawOn` gives a free write-on for icons/arrows.
- source: lemo-opuscar/styles/midcentury-toon/demo/engine/toon.js (`ink`, `shape`, `reg`, `text`, `textures`) (MIT).
- value: one primitive turns any icon/diagram/title into a warm printed 1950s card; lets `box-bot`, `emote-pop`,
  `chapter-header`, `kinetic-captions` get a `style:'toon'` variant cheaply; works for help-centre and onboarding videos.

### `step-medallion-iris` — EXTENDS `iris` (transition) + `stamp-slam` (motion)
- look: a numbered medallion (coloured disc, 5 px ink ring, a 16-point white starburst behind, slab numeral with a
  cream plate) stamps onto the outgoing subject one beat before the cut; then a circle grows *from the medallion* to full
  frame revealing the next step, with a thick ink rim; the big numeral scales up and fades during the first half.
- params: stamp pop 0.24 s back-ease (overshoot 1.5–1.9) with rotation (1−k)·0.4 rad; medallion r ≈ 104 px (≈ 9.6 % of
  H); iris runs from next.t0 − 0.5 beat to next.t0 + 0.4 beat; radius `lerp(104, 1250, k²)` (k = easeInOut), centre
  lerps from the medallion's position to frame centre; rim 7 px ink ribbon; numeral alpha 1−2k, scale 1+3k for k<.5.
  Variant "button iris": same from a 40 px button in 0.28 s.
- build: transitions.tsx `iris` gains `variant:'medallion'` with props `origin:[x,y]` (0..1), `r0`, `rimColor`,
  `rimWidth`, `label` (numeral), `labelFont`. Uses the existing SVG luminance mask: circle mask radius = lerp(r0, diag,
  k²). Stamp itself = `stamp-slam` variant `'medallion'` (disc + starburst + numeral, props `index`, `colors[]`).
- source: lemo-opuscar/styles/midcentury-toon/demo/film.js (`medallionAt`, `renderFilm` iris block) (MIT); DEMO.md Shots.
- value: hierarchy that is also the edit — every how-to / checklist / "5 rules" video gets numbered chapter doors.

### `callout-magnifier` — EXTENDS `callout-labels` (new variant `magnifier`)
- look: a round frame-in-frame "manual magnifier": paper ring (r+16) with a 4.5 px broken ink rim, inside a flat
  colour disc showing a close-up drawn at native line weight; a dashed marching leader line runs from the circle edge to
  a dot on the subject; the step's datum (e.g. "50 cm clear on each side") pops as a paper tag with a star bullet
  under it on the action beat.
- params: pop `back(0.32 s, 1.5)` scaling r; dashes 14 on / 10 off, 4 px, marching at 40 px/s; subject dot r 9 px;
  call-out r ≈ 230–260 px (≈ 22 % H); tag Jost 36 px, star bullet; reading hold ≥ chars/12 + 1 s.
- build: in `callout-labels` add `variant:'magnifier'`, items `{target:[x,y], at:[cx,cy], r, inner: motionId|src|icon,
  label, color}`. Render inner content inside `<clipPath circle>` with its own transform (scale k), leader as
  `strokeDasharray` with `strokeDashoffset = -frame*40/fps`, rim via `toon-cel-shape` when style is toon.
- source: lemo-opuscar/styles/midcentury-toon/demo/film.js (`callout`, `tag`) (MIT).
- value: product guides, UI onboarding (the phone screen lives in the circle), recipe quantities, torque values.

### `coverage-route` — NEW
- look: a top-down floor/garden plan; a robot/route line draws itself region by region: one wall-follow loop, then
  boustrophedon lanes that flow smoothly *around* furniture ellipses (never crossing, never entering), a small curl
  at every U-turn, stars and dots revealed in the gaps between lanes; a dotted return line home. Camera pulls back
  5.4× → 1.0× while counter-rotating −6° → 0°; seen whole it reads as an atomic-age textile.
- params: lane spacing 82 px, inset 34 px, U-turn corner r ≤ 34 px, curl r 11–12 px (20 samples), decor every 128 px
  alternating star/dot; obstacles = furniture ellipse + 30 px margin; one region per beat (0.6–0.75 s draw each);
  line = product colour 6–8 px with a darker 3 px ink edge offset (off-register); checkered floor tint.
- build: deterministic path generator `buildCoverage(zones, obstacles)`: for each lane at height y0 and x, displace
  y by solving the potential-flow streamline around each ellipse — in ellipse-normalised coords X=(x−cx)/rx, Y0=(y0−cy)/ry,
  find Y with Y − Y/(X²+Y²) = |Y0| by 40-step bisection, sign of Y0 kept, add (Y−Y0)·ry; skip obstacles with |X|>5 or
  |Y0|>3. Concatenate wall loop + lanes + U-turn arcs + curls; store cumulative arc-length marks per zone. Progress =
  piecewise easeInOut between zone marks keyed to beats; draw with `strokeDasharray=L, dashoffset=L(1−p)` or the toon
  ribbon `drawOn`. Decor items carry their own arc-length u and pop (back-ease) when p passes u. Camera: scale
  `lerp(5.4,1,ease)`, rotate `lerp(−6°,0)` around the route head. Props: `zones[{x0,x1,color,label}]`, `items[{shape,
  x,y,s,rot,color}]`, `dock`, `laneGap`, `curl`, `beatFrames`, `pullback`, `routeColor`, `decor`, `seed`.
- source: lemo-opuscar/styles/midcentury-toon/demo/film.js (`laneY`, `buildPath`, `planProgress`) (MIT); DEMO.md pitfalls 1–2.
- value: payoffs that turn a real process into an ornament: robot vacuums/mowers, delivery rounds, sprinkler coverage,
  cleaning schedules, "how the algorithm covers the space". Not covered by `map-route` (a marker flying one curve).

### `sunburst-hero` — NEW (small)
- look: product/hero reveal: a cream disc opens behind the subject while ~30 semi-transparent wedge rays (ground
  tint) spin slowly to the frame edge; 4-point sparkles (coral, white, ink) twinkle around; colour-plane ground with a
  broken horizon line.
- params: rays 30 wedges, alpha 0.55, radius grows `back(0.37 s, 1.6)` to ~1500 px, rotation 0.06 rad/s; disc r ≈ 330
  px; sparkles 3–5, 28–40 px, twinkle scale on twos.
- build: SVG `<g>` of 30 `path` wedges (alternate on/off), `rotate(frame/fps·0.06 rad)`, mask-free; props
  `rays, rayColor, rayAlpha, discColor, discR, sparkles, sparkleColors, startFrame`. Overlay-capable behind any subject.
- source: lemo-opuscar/styles/midcentury-toon/demo/film.js (`sceneHook`), engine/toon.js (`rays`, `sparkle`) (MIT).
- value: "Meet X." product intros, CTA/QR end frames, award moments in retro brand films.

---

## news-package

### style `news-package` — Broadcast News Package
- **essence**: a TV newsroom's on-air graphics *system* plus its cutting rules: sting that becomes the channel bug, a
  rundown that opens and closes the bulletin, one persistent lower-third strap with a category tab, and one-fact-per-screen
  full-frame graphics (split-flap board, threshold chart, bars, map long take, quote card, spec card, stamps) over ink.
  Flat graphics only — no anchor, no virtual set, no crawl, no burned-in subtitles.
- **palette** (documented, STYLE.md §4; measured agrees):
  - bg/ink `#121417` (doc) ≈ `#131418` (measured 52 %); cards ink2 `#1B1E23`, ink3 `#22262C` (doc) ≈ `#1C1E20` (measured 17 %)
  - accent (lemon) `#F2CF1D`, light `#F8DE4A`, dark `#D8B30C` (doc; measured saturated `#F8D72A`/`#E5C524`)
  - accent2 (gold: thresholds, datelines, source lines) `#D4B064` (doc)
  - paper (strap, documents, chart line) `#F4F1E8` (doc); English secondary line on paper: dark olive `#6E5A1E`
  - reserved alarm (BREAKING / LIVE only) `#FE6B3D`; flip tiles `#2B3038` (top) / `#262A31` (bottom); greys for axis text.
  - measured `#D4C789`/`#373426` are AA mixes of lemon+paper and the 14 % lemon area-fill under the chart line.
- **texture / post recipe**
  - Graphics and package: **no grain, no filter** — crisp vector.
  - Studio background: ink fill + radial lemon glow (16 % → 0, centred (1300,380), r 1100) + 7 slow diagonal light fins
    (lemon at 2.5–6 % alpha, 40–160 px wide, slanted −500 px over the height, drifting 30–66 px/s) + a 48 px dot grid
    of 2 px paper dots at 5 % scrolling 12 px/s. → background motion, not a filter (see `news-studio-bg` note in
    `sting-bug`).
  - Illustrative photo plates (only behind graphics, tagged ILLUSTRATION): greyscale → percentile auto-levels
    (0.5/99.6) → γ1.05 → 35 % S-curve → output 8..232 → duotone `#0E1013 → #ECE7D8`, left-dark ink gradient for type,
    vignette 0.5–0.55, overlay grain 7 % cycling 6 tiles. → our steps: `saturate 0`, `contrast {value:1.35, mid:.5}`,
    `gradientMap {ramp:['#0E1013','#ECE7D8']}`, `grain {amount:.07}`; overlays `vignette {amount:.52, color:'#08090B'}`.
    (Percentile auto-levels = NEW, optional: **NEW STEP `autoLevels {lo:.005, hi:.996}`** is not doable in an SVG
    filter per frame; do it offline in `mgl` image prep or approximate with contrast.)
  - Suggested StyleDef (for image plates): the steps above, `step: 1`, fonts below; `family:'graphic'`.
- **typography** (all Google Fonts, OFL): Latin **Barlow Condensed** 800 (numbers, names, plate, strap EN caps) / 600
  (secondary lines, quotes) / 600 italic (end-card title); mono **IBM Plex Mono** 500 all caps, tracking 1–4 px
  (datelines, sources, axis labels); CJK **Noto Sans SC** 900 (headlines/strap) / 700 (labels). Every label bilingual,
  one line per language, never wrapped. Big readout numbers Barlow Condensed 800 at 150 px.
- **motion rules**: 30 fps, on ones. 120 BPM grid, beat 0 at the end of the 1.5 s sting; every cut/wipe on a beat or
  half beat. Shots: sting 1.5 s, rundown 4–5 s, story graphics 3–7 s, one map long take 6–12 s. "A package action every
  0.5–1 s" (flip, count, stamp, tick, strap change, map light, line step); a strong action within 0.5 s of every cut.
  Entrances: vertical row flips with back-ease (s ≈ 2.0), mask push-ups (type rises from below a clip), light sweeps
  over new rows. Only three transitions: vertical band wipe (lemon 84 px + ink 5 px + gold 14 px, 0.3 s, easeInOut,
  x from −140 to W+140) between stories, hard cut inside a story, slanted wipe (340 px slant, lemon edge) into the end
  card. **The package layer travels with its picture**: under a wipe each side draws its own strap/tab/source/tag, so the
  band brushes the headline over; incoming picture's entrance starts under the band (pre-roll 0.3–0.7 s).
- **signature moves**: ours — `number-counter`, `live-chart`, `stamp-slam`, `map-route`, `scene-tag`, `bar`
  (transition), `kinetic-captions` (quote card lines); proposed — `news-strap`, `sting-bug`, `rundown-board`,
  `split-flap-board`, `threshold-break-chart`, plus transition `bar` variant `tricolor`.
- **do**: one accent + one gold-like secondary + paper + ink + a reserved alarm colour; date every story in mono caps;
  strap holds the headline from first story to recap and never exits mid-programme; source line ≤ 36 chars mono 13 px
  right-aligned; stamps −6°…−10°, land from 1.9× in 0.16 s with an expanding ellipse, one per story max; content zone
  y 56–840 when the strap is up. **don't**: dissolves, 3D flips, fly-throughs, news crawl, burned-in subtitles, rolling
  counters on schematic data (use a mask push instead), gold text on paper (contrast), copying any broadcaster's look.
- **source**: `lemo-opuscar/styles/news-package/` STYLE.md, DEMO.md, demo/main.js (MIT code, CC BY 4.0 docs).

### `news-strap` — NEW (overlay-capable lower third)
- look: persistent lower third: a lemon category tab (bilingual "市场 MARKETS") sitting on top of a paper strap
  (1250×104) with a 14 px lemon left bar, headline 50 px ink + one English caps line 27 px in olive, a 120 px ink end
  block with the channel name in lemon and a 6 px lemon top edge, an 8 px offset 30 % black drop shadow; a right-aligned
  mono source line beside it; optional ILLUSTRATION corner tag (ink 82 %, gold 8 px left bar, mono gold + small white line).
- params (1920×1080): tab x 96 y 856 h 48; strap y 904; source at x 1836 y 950/978, 75 % opacity; corner tag 96,56,
  330×64, flips in/out 0.2 s. Content changes: vertical flip (new words up from below, old up and out) 0.32 s, tab
  flashes white on a category change; or "brushed" by a band wipe. Profile variant (tab "PROFILE") names a speaker.
- build: `motions/text/news-strap.tsx`: props `items:[{at, tab:[primary,secondary], headline, sub, source?, tag?}]`,
  `channel`, `accent`, `paper`, `ink`, `olive`, `inAt`, `outAt`, `changeMode:'flip'|'cut'`, `position` (scales with
  frame size), `background` (transparent default). Each text block is inside an SVG clipPath rect; flip = translateY
  from +h→0 for new, 0→−h for old, eased over 0.32 s. Expose `stateAt(frame)` so a host transition can render old
  state on the outgoing side (match the source's "package travels with picture").
- source: lemo-opuscar/styles/news-package/demo/main.js (`strap`, `cornerTag`, `credit`) (MIT); STYLE.md §2–3.
- value: any news/market/update video, podcasts clips (name straps), product changelog bulletins; the library has
  `scene-tag` (small pill) but no broadcast lower third.

### `sting-bug` — NEW
- look: two lemon slashes zip across a dark studio background at −8°; a lemon parallelogram plate (vertical gradient
  light→dark, ink and gold bars sheared at the left, condensed name letters dropping in one by one) slams in from 0
  with overshoot, an expanding lemon ellipse ring and a horizontal shake; a wordmark and mono dateline open from the
  centre (clip widening); a white glint sweeps the plate; then the plate flies to the top-right corner and stays as the
  channel bug for the whole film.
- params: slashes at 0.04 s and 0.10 s (h 22/8 px, 0.26 s each, easeInOut, ±1900 px); plate 520×180 (≈ 27 %×17 % of
  frame), shear k = 0.28·h, slam 0.16–0.42 s `back(k, 2.2)`, rotation (1−eo)·−0.12 rad; ring 0.42–0.8 s, ellipse
  300→1000 × 120→420 px, width 7→1; shake 0.42–0.7 s `sin(90t)·14·(1−u)`; letters drop `clamp(4·drop − i)`;
  wordmark 0.5–0.8 s; glint 0.85–1.12 s (160 px white 60 % band); fly 1.12–1.45 s to (1739, 86) at scale 0.327.
- build: `motions/text/sting-bug.tsx`, props `name` (plate letters), `wordmark:[[text,color]…]`, `dateline`,
  `accent`, `accentLight`, `accentDark`, `gold`, `ink`, `bugCorner:'tr'|'tl'`, `bugScale`, `holdBug` (keep after the
  sting, overlay-capable), `backdrop:'studio'|'none'`. Studio backdrop = the fins + glow + dot grid described in the
  style (also exported as `newsStudioBg` helper; it is a cheap `backdrop` for `number-counter`, `live-chart`).
- source: lemo-opuscar/styles/news-package/demo/main.js (`shotSting`, `stingLogo`, `plate`, `bug`, `studioBg`) (MIT).
- value: intros for newsletters-as-video, weekly updates, YouTube news channels; opening and persistent branding in one object.

### `rundown-board` — NEW
- look: left column date block (huge "12–18" numerals, month in lemon, mono week, title + English caps) pushing up out
  of masks; right column 3–5 ink rows (lemon number block at left, bilingual title, mono date at right) that flip open
  vertically one per beat with a lemon light sweep; the first row gets a pulsing lemon outline ("this one first").
  Recap mode: same object returns, rows already in, a lemon tick disc pops on each row one per beat.
- params: rows 1024×120 (≈ 53 % W), 140 px pitch, number block 140 px; row flip `scaleY = back(seg(t,a,a+.3), 2.0)`
  at 0.4 s spacing; sweep 0.05–0.45 s after landing (160 px gradient to 28 % lemon); highlight at +1.5 s after last row,
  alpha .6+.4cos(4πt); ticks `back(0.22 s, 2.6)` disc r 30 with 7 px round ink check, 0.4 s apart; whole board slow
  push 1.00→1.03.
- build: `motions/text/rundown-board.tsx` props `date:{big, month, week}`, `title`, `rows:[{n, title, sub, date}]`,
  `mode:'open'|'recap'`, `startFrame`, `rowEvery`, `accent`, `gold`, `ink`, `highlightFirst`, `backdrop`.
  Mask push-ups via clipPath + translateY.
- source: lemo-opuscar/styles/news-package/demo/main.js (`rundown`) (MIT).
- value: "today in this video", agendas, episode chapter lists, top-N countdown intros and recaps (tick-off ending).
  `chapter-header` steps through one title at a time; this shows the whole list then ticks it.

### `split-flap-board` — EXTENDS `number-counter` (new `mode:'flap'`)
- look: old and new values on the same departure-board tiles; each tile's top half and bottom half are clipped
  separately: the old top folds down (scaleY 1→0) revealing the new top, then the new bottom unfolds (0→1) over the old
  bottom; dark hinge line across the middle; a "×2" / "+x %" callout pops to the right.
- params: tile 220×130 px (≈ 11.5 %×12 %), top `#2B3038`, bottom `#262A31`, hinge 3 px black 60 %; flip 0.26 s per tile,
  tiles staggered ~0.05–0.1 s; values Barlow Condensed 800.
- build: in `number-counter` add `mode:'flap'` with props `from`, `to`, `tileW`, `tileH`, `stagger`, `flipFrames`,
  `tileColors`, `callout` (e.g. "×2"). Per tile: four clipPaths; p<.5 → draw new-top + old-bottom + old-top scaled
  (1−2p) about the hinge; p≥.5 → new-top + old-bottom + new-bottom scaled (2p−1).
- source: lemo-opuscar/styles/news-package/demo/main.js (`flipTile`, `shotPrice`) (MIT).
- value: price changes, before/after stats, departures/scoreboards, "rate doubles on 1 Dec" explainers.

### `threshold-break-chart` — EXTENDS `live-chart` (new `mode:'threshold'`)
- look: a line chart (paper line, lemon area fill 14 %→0) draws quickly up to the peak, then advances one period per
  step toward a dashed gold threshold line; a corner counter "DAY n" pops on each step (turns lemon on the last); the
  head dot blinks before the last step; one beat of silence; the last segment crosses the threshold in lemon 7 px with
  a frame shake, the threshold line flashes white, an expanding ring at the head; a readout panel slides in from the
  right (huge −7.57 % rolling up, close value pushed up from a mask, extra lines fading in) and a −7° stamp lands.
- params: early points 0.07 s apart (0.06 s draw each), streak points 0.3 s apart (0.18 s draw), last 0.14 s;
  threshold draws 0.5 s; shake 0.4 s `sin(83t)·14, cos(71t)·10` decaying; ring r 20→280 over 0.58 s; blink 8 Hz for
  0.7 s before the break; readout panel 520×560 slides 600 px in 0.25 s eo, value counts 0→final in 0.4 s; stamp from
  2× in 0.18 s; slow chart push 1.00→1.05.
- build: in `live-chart` add `mode:'threshold'` with props `data:[[label,value]]`, `peakIndex`, `streakStart`,
  `threshold`, `thresholdLabel`, `stepFrames`, `breakAt`, `readout:{title, value, unit, lines[]}`, `stamp`, `accent`,
  `gold`, `paper`, `schematic` (tag + no rolling numbers). Times derived from `breakAt` backwards.
- source: lemo-opuscar/styles/news-package/demo/main.js (`shotKospi`) (MIT); STYLE.md §3 "Threshold chart".
- value: market crashes/records, goal crossings, "first time over X" stories, KPI alert moments.

(also: transition `bar` gains `variant:'tricolor'` — vertical band = accent 84 px + ink 5 px + gold 14 px, 0.3 s
easeInOut, travelling −140 → W+140; and the slanted end-card wipe = existing `diagonal` with a solid 40 px accent edge
instead of the dashed glow — EXTENDS `bar`/`diagonal`, colours as props.)

---

## newsreel

### style `newsreel` — 1920s Sound Newsreel
- **essence**: an *edit* style: real archive material arranged as a late-1920s newsreel issue — searchlight-and-globe
  ident, a newspaper spinning into the lens, place·date cards, maps with dotted arcs, magazine pages, documents underlined,
  grease-pencil freezes, split-screen duels — all inside a projected 1.37:1 gate in warm silver, cut to a hot-dance band.
  Type stays sharp and steady over a weaving, flickering picture.
- **palette** (measured + documented):
  - outside gate black `#000000` (measured 23 %)
  - silver ladder (picture): `#12110F` → `#282621` → `#38342E` → `#4C4840` → `#5D5950` → `#999487` → `#EBE4D4`
    (measured, poster/frame; lightest from saturation scan); sat% = 0 — strictly monochrome
  - warm silver grade: multiply `#EFE7D6`, screen `#17140F` (doc/code)
  - type: cream `#F3EEE4` and `#D6CFC0` on `rgba(12,11,10,.8)` boxes with a 2 px cream inset rule (doc)
  - Art Deco silver lettering gradient `#FFFFFF → #D9D4CA | #9E978A → #EFEBE2` with a hard break at 48/52 %, black
    outline `#0C0B0A` 0.12 em (doc/code)
  - ident: sunburst wedges `#2A2723` / `#1B1916`, bg `#121110`, desk spot `#5B5751 → #151413` (code); grease pencil
    warm white `rgba(250,248,240,.92)`; soft-lead underline dark.
  - no colour accents, no sepia wash.
- **texture / print / post recipe** (picture layer only; type layer untouched)
  - Base grade: greyscale → percentile stretch (0.6 %/99.6 %; print 0.2–0.3 %/99.0–99.7 % with black lifted to 26–30)
    → mild S-curve x + 0.18(x−.5)(1−|2x−1|) → output 14..238; one level set per clip. → `saturate 0`,
    `contrast {value:1.18, mid:.5}`, `brightness .97`.
  - Warm silver: → `tint {color:'#EFE7D6', mode:'multiply'}` + `tint {color:'#17140F', mode:'screen'}` (both exist).
  - Vignette radial 0.42H → 0.95H, edge alpha 0.2 + 0.62·strength → `vignette {amount:.7, color:'#000'}`.
  - Grain: mux grain 7 → `filmGrain: .07`.
  - **NEW OVERLAY `gate`** `{aspect:1.37, radius:26, color:'#000'}`: picture confined to a centred 1480×1080 rounded rect
    (pillarbox); our `letterbox` only handles wider aspects — extend `letterbox` to pillarbox when aspect < frame aspect
    and add `radius`.
  - **NEW OVERLAY `projector`** `{flicker:.035, flickerHz:3, weave:[1.6,2.2], scratches:3, scratchLife:9, dust:4}`:
    per frame f: brightness × (1 + (hash(f·.37)−.5)·0.07 + (vnoise(3t)−.5)·0.05) (feComponentTransfer slope);
    gate weave translate (vnoise(.21f)−.5)·3.2, (vnoise(.17f+9)−.5)·4.4 px applied to the picture group only;
    0–3 vertical scratches: id = floor((f + 5k)/9)·7 + k, skip if hash(1.3id) > .55, x = hash(2.1id)·W jittering
    ±3 px, 1–2.6 px wide, from y∈[0,.4H] to y∈[.7H,H], light (22 % cream) or dark (28 % black); 0–4 one-frame dust ellipses
    r 1–5 px, 55 % dark or 45 % light. Pure function of frame → deterministic.
  - Suggested StyleDef: `family:'photo'`, steps `[saturate 0, contrast 1.18, tint multiply #EFE7D6, tint screen #17140F]`,
    overlays `{gate, projector, vignette .7, filmGrain .07}`, `step: 1` (archive plays at its own 24 fps).
- **typography** (Google Fonts, OFL): ident/item cards/end title **Limelight** 104–118 px silver gradient + black
  outline; English place cards/labels **Oswald** 600 26–34 px, tracking 4–6 px, caps "PLACE · DATE"; subtitles Oswald 400
  29 px; CJK display **Noto Serif SC** 900 50–76 px tracking 10–26 px; CJK labels/subs **Noto Sans SC** 500–600.
  Place card: top-left of gate (+48, 56), dark box with inset 2 px cream frame, pulled out left→right in 0.22 s, fades
  0.15 s; hold ≥ CJK/4.5 + Latin/15 + 1.5 s. Subtitle strip: 180 px dark band at the gate bottom (transparent top edge,
  93–96 % `#0A0908`), held across gaps < 1 s so it never blinks.
- **motion rules**: picture 24 fps on ones (archive frames by floor((t−t0)·24)). The band is the clock: 190–220 BPM
  (demo 200, beat 0.3 s, bar 1.2 s); cuts on bar lines, inserts on beat 3 or the Charleston accent (1 and the "and" of 2).
  Archive shots 1–2.5 s, print 2.5–4 s, comparisons ≥ 2.5 s; never > ~1 s static. Archive gets ≤ 6 % fake moves; stills
  always move with a purpose (spin-and-slam, push then punch-in on a beat, pan, tilt-reveal, map push, grid deal,
  flip-book on the beat, freeze + jolt, split/quad). Transitions each used once as punctuation: iris close/open
  (black 14 px rim), diagonal hard wipe with 6 px bright edge (500 px slant), vertical-axis card flip (scaleX |cos πu|,
  6 % vertical squeeze, 55 % darkening), venetian blinds (12 slats), clock wipe from 12 with 5 px bright hand, spinning
  paper, page turn, panel push-over, freeze; fade only through black at the very end. No dissolves, whip pans, zoom blur.
- **signature moves**: ours — `ken-burns` (push/punch-in), `map-route`, `beat-montage` (grid deal → flip-book on the
  beat ≈ covered), `split-compare`, `film-look`, transitions `iris`, `diagonal`, `flip`, `clock`, `page-turn`;
  proposed — `spinning-headline`, `newsreel-ident`, `projector-gate` (film-look variant), `grease-pencil-mark`,
  transition `blinds`, plus `record-inset` (spinning 78 rpm disc + tone arm corner badge).
- **do**: everything inside the gate shares one grade/weave; type layer sharp and steady; one place + one material +
  one voice line per story; stories get shorter toward the end; band stops dead for the punchline.
  **don't**: generated "archive" pictures, sepia/colourised material, Ken-Burns drifts, modern lower thirds, anything
  drawn outside the gate, grain added twice, per-frame auto-levels (pumping), jaunty grammar for tragedies.
- **source**: `lemo-opuscar/styles/newsreel/` STYLE.md, DEMO.md, demo/index.html (MIT code, CC BY 4.0 docs).

### `spinning-headline` — NEW
- look: a newspaper (or telegram/poster image) spins out of the dark desk into the lens: tiny and turning fast, it
  grows and decelerates through 2.5 turns with three faint motion-blur ghosts, slams flat with a vertical jolt and a
  3 % bounce, pushes toward the headline, then punches in on the next beat to a detail where a grease-pencil ring is
  drawn.
- params: fly T0→TS (demo 1.2 s); scale = fit·(0.06 + 0.94·u^2.3); rotation = −(1−u)^1.25 · 2.5 · 2π; ghosts k=1..3 at
  t − 0.018k with alpha 0.22; drop shadow blur 40 px, offset 14 px, 60 %; slam jolt = e^(−14d)·sin(70d)·16 px; scale
  kick e^(−18d)·0.03; push fit→1.18·fit with focus drifting to the headline (smoothstep), punch to 2.25·fit in 0.14 s
  ease-out at a beat, then +3 % creep; desk bg radial `#5B5751 → #151413`.
- build: `motions/image/spinning-headline.tsx` props `src`, `focus:[x,y]` (headline, 0..1 of image), `punch:{at, focus,
  scale}`, `flyFrames`, `turns`, `ghosts`, `slamJolt`, `ring` (pass-through to `grease-pencil-mark`), `background`,
  `seed`. `<Img>` transforms computed per frame; ghosts = 3 extra `<Img>` copies (cheap: still image).
- source: lemo-opuscar/styles/newsreel/demo/index.html (`scenePaper`) (MIT); STYLE.md §8.
- value: "the headline said…" beats in history, PR, legal, true-crime and news explainers; classic montage move absent
  from the library (`stamp-slam` slams a label, not an image).

### `newsreel-ident` — NEW
- look: dark field; two searchlight beams snap on with a white flash from the bottom corners and sweep; a 36-wedge
  sunburst rotates slowly; a shaded wireframe globe (12 meridians, 5 parallels, tilted, back lines hidden) grows and
  turns; the channel name lands in Art Deco silver lettering with a big overshoot; a small spaced subtitle; an iris
  closes on the globe. Reprise ends the film ("THAT'S THE NEWS!").
- params: beams on at 0.15 s: on = 1 − 0.6·e^(−9Δ), flash alpha 0.5·e^(−7Δ); beam origin ±640 px from centre below
  frame, half-angle 0.085 rad, length 1500, sway 0.42 + 0.22·sin(1.9t + φ) rad, additive gradient 55 % → 16 % → 0;
  sunburst 36 wedges rotating 0.12 rad/s; globe r 60→200 px (eo 0.1–0.9 s), spin 1.4 rad/s, tilt 0.38 rad, radial shade
  `#F4F1EA → #A9A49A → #34312C`, lines 1.2 % r at 75 % ink; title scale 2.4→1 with back(1.3) over 0.5 s; CJK line
  0.35–0.65 s after; iris to 0 eased-in over the last ~0.6 s.
- build: `motions/text/newsreel-ident.tsx` props `title`, `subtitle`, `tagline`, `beamsAt`, `globe:boolean`,
  `sunburstColors`, `silver:[4 stops]`, `irisOut`, `background`. Globe = SVG polylines of projected lat/lon points with
  z>0 culling (pure math, no three.js). Title = SVG text with `paint-order: stroke` and a 4-stop linearGradient.
- source: lemo-opuscar/styles/newsreel/demo/index.html (`sceneLogo`, `globe`, `sunburst`, `beams`, `silverText`,
  `decoTitle`) (MIT).
- value: vintage intros/outros for history channels, anniversaries, retro product launches, "this week in…" shows.

### `projector-gate` — EXTENDS `film-look` (new `overlay:'projector'` / variant)
- look: the picture lives in a 1.37:1 rounded gate on black, warm-silver graded, flickering, weaving a couple of
  pixels, with short-lived vertical scratches and one-frame dust; the type layer above stays rock steady.
- params: see the style's NEW OVERLAY `gate` + `projector` (flicker ±3.5 % + 3 Hz drift; weave ±1.6/±2.2 px value noise;
  scratches live 9 frames; dust 0–4 per frame; vignette 0.42H→0.95H).
- build: `film-look` gets props `gate:{aspect, radius}`, `flicker`, `weave`, `scratches`, `dust`, `silver:true`
  (multiply/screen tints) and `typeLayer` children rendered outside the weave transform. Implement once as
  `<ProjectorOverlay frame>` in `src/core` so both the style engine overlay and the motion share it.
- source: lemo-opuscar/styles/newsreel/demo/index.html (`filmLook`, `window.render` weave/flicker, `subBand`) (MIT).
- value: instant archive look for any footage or for our own motions (e.g. `silent`-era recipes, history explainers).

### `grease-pencil-mark` — NEW (overlay-capable annotation)
- look: over a frozen frame (with a short jolt), a warm-white grease pencil draws a slightly wobbly loop around a detail
  (it overshoots past its start), then a quick arrow (shaft + two barbs); the stroke is doubled by a thinner offset
  pass so it looks waxy. Print variant: dark soft-lead underline under words.
- params: ring = 64 points, angle from −2.2 rad over 1.12 turns, radius × (1 + 0.05·sin(0.7i)), drawn in 0.28 s;
  stroke 7 px at 92 % + second pass offset (1.6, −1.2) at 45 % alpha, 55 % width; per-point jitter ±0.8 px (hashed, so
  stable); arrow shaft 0.15 s, barbs 0.07–0.08 s each, starting 0.6 s after the ring; freeze jolt = damped sine 16 px.
  Underline: 24 points with sin(9u)·2 px wobble.
- build: `motions/fx/grease-pencil-mark.tsx` props `marks:[{type:'ring'|'arrow'|'underline'|'cross', at:[x,y],
  rx, ry, rot, to?, start, dur}]`, `color`, `width`, `double`, `freezeSrc?` (image to freeze + jolt), `jolt`,
  `background` (transparent default). Path sampled once; drawn with dashoffset or point-count slicing per frame.
- source: lemo-opuscar/styles/newsreel/demo/index.html (`pencil`, `ring`, `lineP`, `pencilDark`, `sceneButton`) (MIT).
- value: "look here" evidence circles for documentaries, sports telestration on stills, tutorial screenshots, memes.
  (`callout-labels` is a clean leader-line label; this is hand-made emphasis.)

### `blinds` — NEW (transition)
- look: the frame is cut into 12 horizontal slats that each turn over (scaleY |cos πv|) from the old picture to the
  new one, top slat first in a quick cascade, black showing between half-turned slats.
- params: n = 12 slats, per-slat start i·0.03 of the transition, each slat turns over 0.64 of it, easeInOut;
  ~0.5–0.6 s total. Variant `vertical` (columns) = the pop-up book's day→night sky slats (4 slats, 0.28 s apart).
- build: transitions.tsx `blinds` with props `slats`, `stagger`, `axis:'h'|'v'`, `color` (gap colour). Per slat render
  both scenes clipped to the slat rect; scaleY about the slat centre; choose old/new by v<.5. Note: needs each scene
  rendered once and reused via `<use>`/mask trick, or accept 2 renders like `glitch`.
- source: lemo-opuscar/styles/newsreel/demo/index.html (`composeScene` 'blinds') (MIT); paper-popup DEMO.md sky slats.
- value: period-correct chapter change for vintage/retro edits; also a playful billboard flip for kids/game content.

---

## one-line

### style `one-line` — One-line Drawing
- **essence**: a single ink line that never leaves the paper draws everything — characters, places, time; scenes never
  cut, they morph (the last stroke of one image is the first of the next); the camera follows the nib like a tracking
  shot; at the end a pull-back can reveal that all vignettes were parts of one big picture. Only ink, paper and the pen's
  soft shadow; one accent colour at most, used once.
- **palette**:
  - paper `#F4EFE4` (doc) ≈ `#F3EFE4` with mottling `#ECE6DA`/`#E6E0D4`/`#E9E3D7` (measured); sat% 0
  - ink warm black `#1D1A17` (doc; measured darkest `#514C46` because the line is thin/AA)
  - accent (once) red `#B3332B` (doc; love/danger) — alternatives blue for water/cold, gold for money/prize
  - pen shadow: blurred wedge, alpha 0.15, toward lower right; paper vignette multiply 0.13.
- **texture / post recipe**
  - Paper: procedural mottling (1400-unit tile, soft-light) + long fibres (260-unit tile) that fade out when zoomed out
    + sparse "tooth" speckle screened over the ink at close zoom; textures anchored to the paper (move with the camera).
    → overlays `paper {color:'#F4EFE4', amount:.2, fiber:.6}`, `vignette {amount:.13, color:'#6A5A48'}`; grain 0.
  - Ink: a filled polygon around the path (not a stroke), colour = mix(paper, ink, alpha) per point (opaque),
    width = baseWidth(voice) × pressure × (1 + 0.16·(noise−.5)), pressure = 0.66 + 0.8·e^(−v/300) (v in units/s).
    Bleed: same polygon 1.0–1.3× wider, blurred ≈0.9·zoom px, composited at 22 %. Pooling: extra dots where v < 45.
    Old age: perpendicular tremble (two noise octaves, ≤ 1.1 units) + dry-brush gaps (long-scale noise) + 3 bristle
    strands; reduce dryness for the final strokes. Screen-space minimum width: clamp the zoom used for width to ≥ 1.3.
  - Applying the style to an *image* (for the style engine): `saturate 0` → `edges {color:'#1D1A17', strength:1.4,
    width:1}` → `threshold {at:.55, ink:'#1D1A17', paper:'#F4EFE4'}` → `wobble {scale:1.2, frequency:.02, boil:0}`
    → `bleed {radius:.8, strength:.22}`; overlays paper + vignette; `step: 1`. (It will not be one line, but it matches
    the look for backdrops/stills.)
- **typography** (Google Fonts): subtitles **Caveat** 500 46 px, ink 84 %, no box, centred, baseline 100 px from the
  bottom, written on left→right (0.2 s + 17 ms per character) behind a soft paper-coloured halo, fade 0.45 s; titles
  **Sacramento** 76 px (monoline connected script), written on over 1.6 s in empty paper; end-card labels Caveat 600
  wide-tracked caps.
- **motion rules**: **on ones** (24 fps) — stepping breaks the illusion. Timing = chapter windows + curvature: inside a
  window time per sample ∝ arc step·(1 + K·min(3.2·turn, 3)) (sharp turns get more time, smoothed); beats pinned by marks
  (arc fraction or "the n-th pass near point P"); a stop = two marks at the same place. Speeds 300–700 units/s travel,
  50–150 details; the most important stroke is the slowest. Retracing is legal and invisible. Camera: one continuous
  move (see `nib-follow-camera`); no cuts; transitions are morphs. Silence is literal during a stop (1.5–3 s).
- **signature moves**: ours — `line-draw-on`, `handwrite-on`, `heart-draw-fill` (pencil draw), `typewriter-signature`;
  proposed — `ink-pressure-line` (EXTENDS line-draw-on), `nib-follow-camera`, `ink-blot-stop`, `written-caption`
  (EXTENDS handwrite-on).
- **do**: design the final picture first, cut it into chapters (reverse design); plan the path like an Euler path so
  connectors fall on natural lines; test the full reveal often; one accent stretch that stays in the final picture.
  **don't**: hands/markers/erasing (that's whiteboard), fills, tones, a second line weight, background art, stray
  connectors (read as beards/wrinkles), lines drawn too close (they braid once width is applied), round blots (read as
  moles), translucent overlapping hand shadows.
- **source**: `lemo-opuscar/styles/one-line/` STYLE.md, DEMO.md, demo/ink.js, geom.js, cam.js, subs.js (MIT code,
  CC BY 4.0 docs).

### `ink-pressure-line` — EXTENDS `line-draw-on` (new `mode:'one-line'`)
- look: one continuous line draws itself with real pen dynamics — thin and quick on long travels, fat and slightly pooled
  at slow corners, a faint soaked edge, a short red stretch that blends in and back out; the pen is never drawn, only a
  soft blurred shadow wedge and a tiny contact dot at the nib.
- params: pressure 0.66 + 0.8·e^(−v/300); base widths per "voice": child 2.4 (α .82), teen 2.5, adult 2.9 (.96),
  old 2.7 (.93), next generation 2.0 (.76), blended over ±60 units; ±8 % width noise; bleed 22 % blurred copy; pooling
  dots where v < 45 units/s, r = w·(0.62 + 0.3(1 − v/45)); accent ramp over 34 units in, 30 units out; pen shadow length
  ≈ 560·zoom px, alpha 0.15; time weighting `1 + K·turn` (turn = direction change over ±4 units).
- build: precompute (in a pure helper, memoised per props) the full path from SVG `d` strings + tangent-continuous
  cubic connectors (control length = ⅓ gap along each end tangent), sample every ~1 unit, compute per-sample time from
  chapter windows and curvature weights, speed V, width, colour, accent. Per frame: head index from time (binary search),
  build the left/right offset polygon for samples 0..head (single `<path>` with `fill`), a blurred copy at 22 %
  (`feGaussianBlur`), pool circles; pen shadow = blurred skewed polygon. Props: `paths:[{d, style, transform}]`,
  `chapters:[{from,to,t0,t1,marks,holds}]`, `voices{}`, `accent:{color, from, to}`, `curvatureK`, `penShadow`,
  `minScreenWidth`, `paper`, `ink`. Keep existing `line-draw-on` stroke-by-stroke mode untouched.
- source: lemo-opuscar/styles/one-line/demo/ink.js (`prepare`, `drawLine`), geom.js (`buildPath`, curvature timing) (MIT).
- value: minimal brand stories, signature/logo reveals, life-milestone films, "continuous process" explainers.

### `nib-follow-camera` — NEW (camera helper, reusable by any draw-on motion)
- look: the camera glides with the drawing point with a little lag and a little anticipation, composes still when a
  vignette needs to read whole, never lets the nib leave the central ~70 % of the frame, and can do a long continuous
  pull-back that reveals the whole picture.
- params: keys `{t, x, y, z, roll°, f}` (f = follow weight 0 composed … 1 locked), interpolated with smoothstep, zoom
  interpolated in log space; follow point = Gaussian-weighted mean of the nib position over t−0.55 … t+0.4 s (20 taps,
  weight e^(−(j+1.5)²/40) for j=−11..8 at 0.05 s); centre = lerp(key, follow, f); soft clamp keeps the nib within
  ±0.36 W, ±0.33 H by shifting the centre by the excess. Typical: macro z≈4.3 opening, travel f 0.6–0.85 z≈2.4,
  vignettes f 0.15–0.35, stop = slow push 4.6→5.4, reveal = pull-back 3→1 over 5 s then hold 1 s.
- build: `src/core/followCam.ts` → `camAt(frame, keys, posAt)` returning `{cx, cy, scale, rot}`; motions wrap their world
  `<g>` in `transform="translate(W/2,H/2) rotate(-r) scale(k) translate(-cx,-cy)"`. Pure function of frame. Use in
  `ink-pressure-line`, `line-draw-on`, `map-route`, `coverage-route`, `handwrite-on`.
- source: lemo-opuscar/styles/one-line/demo/cam.js (`camAt`) (MIT); DEMO.md Shots.
- value: makes any path animation feel filmed instead of slid; agents get one reusable "follow the action" camera.

### `ink-blot-stop` — NEW (small fx)
- look: where the pen stops, ink slowly spreads into a teardrop: the tip stays at the nib, the round belly sags downward
  as it grows, an irregular edge with a darker tide line at the rim.
- params: growth g = 1 − (1−u)^2.2 over the hold duration; R = 0.7·lineWidth + 9.5·g units; centre sinks by
  R·(0.25 + 0.9g); upper half pulled to a point: for y<0, x × (1 − 0.72·up), y × (1 + 0.95·up), up = (−y)^1.6·0.9g;
  rim noise ±8–16 %; radial fill 82 % → 66 % → 95 % (rim) → 70 %.
- build: `motions/fx/ink-blot.tsx` props `x, y, start, dur, size, color, seed` (overlay-capable), 90-point SVG path +
  radialGradient; also used internally by `ink-pressure-line` holds.
- source: lemo-opuscar/styles/one-line/demo/ink.js (`drawBlots`) (MIT).
- value: a "loss / hesitation / signature" beat in ink styles (`ink-wash`, `pencil-sketch`, `woodcut` styles too).

### `written-caption` — EXTENDS `handwrite-on` (caption mode) / `kinetic-captions` (variant `written`)
- look: subtitles in a handwriting face that are *written* left→right (clip reveal) behind a soft paper-coloured halo
  that knocks back any line passing behind them; fade out slowly.
- params: reveal 0.2 s + 17 ms per character; ink 84 %; halo = text stroke in paper colour, 12–18 px, blurred 6 px;
  fade 0.45 s; hold ≥ max(1.8 s, speech + 0.6 s); baseline 100 px from the bottom, 46 px.
- build: `kinetic-captions` `variant:'written'`: per line, clipPath rect width = textWidth·p; halo = duplicate `<text>`
  with `stroke=paper`, `filter=blur`; props `font` (Caveat default), `charMs`, `halo`, `ink`, `paper`.
- source: lemo-opuscar/styles/one-line/demo/subs.js (MIT); STYLE.md §4.
- value: captions that belong to hand-drawn styles (one-line, pencil-sketch, whiteboard, watercolor).

---

## paper-lantern

### style `paper-lantern` — Paper-cut Lightbox (纸雕灯)
- **essence**: every shot is one physical object — a shallow shadow box of 6–9 parallel cut-paper sheets lit from behind:
  back layers bright and translucent, front layers near-black and opaque (the value ladder *is* the depth), warm light
  glowing through pulp, windows/moons burning through holes with bloom, soft shadows from each sheet onto the one
  behind, shallow macro depth of field. Things move like paper on a stick.
- **palette** (night ladder documented in DEMO.md S01; measured agrees):
  - sky (bg) gradient `#0A1330 → #172A58 → #2E4478 → #43598A` (doc); measured `#012455` 18 %, `#001A40`, `#00132F`, `#01122E`
  - clouds 祥云 `#C3CBE8` (trans .9); far mountains `#6A86C2` (.7) — measured mountain mid `#313C5F`/`#303B5F`, highlight `#9B918E`
  - mid mountains `#3F5A92` (.45); village walls `#5A70A6`, roofs `#1B284F` (.25); river `#22325E` (.3);
    tree/bridge `#17224A` (.12); foreground bank `#0E1532` (.05); lantern body `#0D1328`
  - light (warm, the only saturated element): moon `#FFFAF0`/`#FFF0CF`/`#F7DCA4` (doc) ≈ `#FAE3B9`/`#FBEDD1` (measured);
    windows `#FFB862`; lanterns `#FF8A48`; moon trail `#E9CF96`; blossoms `#D9A24A`
  - accent: seal red `#B3302A`; gold title paper `#F1DBAC`/`#F3D998`; box red `#9E2A20`; second-side accent blue `#2A4F7A`
  - alternate ladders: interior warm browns (wall `#B08058`, props `#6E3B1F`, figure `#2E170D`, lamp `#FFC878`); far city
    violets (`#2A2456`, windows `#E8CC90`); desert `#F0C890 → #C07850 → #6A3020 → #1E0E08`, fires `#FFD080`; winter
    `#DFE6EE → #9AAEC4 → #4A6078 → #101820`, one red scarf.
- **texture / post recipe**
  - Per sheet finish: fibre grain tile (512², α .9, `source-atop`), warm top rim band rgba(255,236,200,.35) offset 3 px
    up, dark bottom shade rgba(0,0,0,.28) offset 3 px down.
  - Backlight (three.js shader): emissive += albedo × lightCol × trans × lit × fall × (0.35 + 1.3·cloud), fall =
    mix(0.22, 1, exp(−d²/R²)) around a per-shot light point (usually the moon), cloud = tiled pulp-mottle texture.
  - Emissive windows from a second mask canvas gated 0→1 ("switch on"); bloom (strength .35–.4, radius .6, threshold
    1.1–1.15); DoF aperture 12–26 focused on the story layer; vignette .42–.45; SSAA 2×; soft VSM shadows from a top spot.
  - SVG/2D approximation for our engine (no WebGL needed): each layer = `<g>` with its fill + a `feDropShadow`
    (dy ≈ 0.6–1 % H, blur 6–10 px, 35 % black) cast onto the layer behind; backlight = a radial gradient of lightCol
    (centred on the light point, Gaussian-like stops) drawn *inside each layer's clip* with `mix-blend-mode:screen` at
    opacity = trans × lit; pulp = feTurbulence (fractalNoise, 0.012, 3 oct) multiplied into that glow; windows = shapes
    with `glow` step; DoF = per-layer `blur` by |z − focus|. → **NEW STEP `layerShadow`** is not a full-frame filter; it
    belongs to the motion (`lightbox-stack`). For applying the *look* to an image: `posterize 5` → `gradientMap
    {ramp:['#0A1330','#0E1532','#3F5A92','#6A86C2','#C3CBE8'], discrete:true}` → `glow {radius:10, amount:.5}` →
    `grain .03`; overlays `paper {color:'#C3CBE8', amount:.08, fiber:.8}`, `vignette .45`.
  - **NEW OVERLAY `bloom`** (threshold-gated glow, only pixels above luminance 0.85 bloom): feColorMatrix luma →
    feComponentTransfer threshold → feGaussianBlur → screen. Our `glow` blooms everything; this is the selective version
    (useful for neon-noir, film-look too).
- **typography** (Google Fonts, OFL): CJK titles/poems brush **Ma Shan Zheng** (vertical), running script **Zhi Mang
  Xing**, child handwriting **Long Cang**, subtitles/credits **Noto Serif SC** 500; Latin serif **Cormorant** (or
  Cormorant Garamond) 500–600. Subtitle: 40 px CJK / ~38 px Latin, `#FBF3E4`, tracking .06 em, soft black shadow,
  74 px from bottom; split at the comma nearest the middle (> 21 CJK / > 42 Latin chars). Words shown as paper in the
  picture are not subtitled.
- **motion rules**: 30 fps on ones, never stepped. Layers only slide, rotate about a pivot (jointed silhouettes rotate
  limbs only), scale in along one axis ("written out"), or light up — no squash, no morph, no bend. Light cues are the
  big motion: source (moon 0.5–3.2 s), then each layer's translucency in a 0.42 s stagger back→front, then windows,
  then lantern flicker `1 + .06·sin(7.3t)·sin(3.1t)`. Hard action lands on spoken words. Camera: short moves only (the box
  is 16 cm deep) — slow dolly in/out, rack focus between layers, lateral parallax travel (speed ∝ depth), top-down stack,
  push into / pull out of the real box; handheld micro-drift ≈ 0.6 mm. Transitions: dissolves 0.5–1.2 s, iris,
  light off/on, near-plane cloud curtain; no whip pans or digital zooms.
- **signature moves**: ours — `parallax-landscape` (depth travel), `starfield-night`, `city-skyline` (windows on),
  `sun-rise-set`, `falling-petals`, `ken-burns`; proposed — `lightbox-stack`, `cloud-curtain` (transition),
  `paper-strip-title`; `parallax-landscape` EXTENDS with a paper finish.
- **do**: keep the ladder (back bright/translucent → front dark/opaque); one temperature per stack (changing ladder =
  changing place); light warm and the only saturated element besides one accent; never turn shadows off; sheets never
  larger than the cavity. **don't**: pale front layers (flattens the box), bending/morphing paper, glows as textured
  squares (use analytic falloff), sticky grade state between shots, a dissolve that reveals a curtain slit.
- **source**: `lemo-opuscar/styles/paper-lantern/` STYLE.md, DEMO.md, demo/src/paper.js, stage.js, post.js,
  shots/s01_night.js, shots/s17_sushi.js (MIT code, CC BY 4.0 docs; the demo's voice track is excluded from the licence).

### `lightbox-stack` — NEW (hero backdrop; three.js or 2.5D SVG)
- look: a glowing paper-cut lamp scene: starry gradient sky, a moon with halo, paper clouds, two or three mountain
  ranges with carved contour slits, a village with lit windows, a river with a broken moon trail, a dark foreground tree
  and reeds, hanging lanterns; every sheet casts a soft shadow onto the one behind, back sheets glow with light through
  pulp, the camera creeps in with shallow focus. Opening: "the lamp turns on" sequence.
- params: 6–9 layers between z −0.14 (sky) and 0 (front) in a 0.56×0.33×0.16 m box; trans per layer .9/.7/.45/.25/.3/
  .12/.05; camera z 0.56→0.48 over the shot, fov 26°, handheld 0.6 mm; lamp-on: moon 0.5–3.2 s smoothstep, layers'
  `lit` staggered 0.42 s back→front, windows switch on 0.6 s each on spoken words, lanterns flicker; bloom .35/.6/1.15;
  aperture 14.
- build: two renderers behind one prop API. (a) `mode:'svg'` (default, cheap): stack of `<g>` layers drawn from
  procedural generators (`karst(peaks)`, `ridge`, `xiangyun(x,y,r)`, `houses(n)`, `reeds`, `waves`) in a 1920×1080
  viewBox scaled by depth for parallax (`x' = x + camX·(1/z)`), shadows via `feDropShadow`, backlight via clipped
  radial gradients (screen blend), per-layer blur for DoF, windows with a `glow` filter and opacity = switch(t).
  (b) `mode:'3d'`: three.js planes with `CanvasTexture` + `onBeforeCompile` emissive term
  `albedo·lightCol·trans·lit·mix(.22,1,exp(−d²/R²))·(.35+1.3·cloud)`, VSM soft shadows from a top spot, bloom pass.
  Props: `ladder:'night'|'interior'|'city'|'desert'|'winter'|string[]`, `light:{x,y,color,radius}`, `moon`, `layers`
  (override list), `windows`, `lanternCount`, `lampOnAt`, `lampOnStagger`, `camera:{from,to,focus}`, `title`
  (pass-through to `paper-strip-title`), `seed`, `background`.
- source: lemo-opuscar/styles/paper-lantern/demo/src/paper.js (`sheet`, `paperMat`, `finish`), stage.js, art.js,
  shots/s01_night.js (MIT); DEMO.md layer-stack table.
- value: festival greetings (Mid-Autumn, Diwali, Christmas village), gift/brand stories, "two windows, one moon"
  long-distance narratives, cosy hero backgrounds for websites (lazy, reduced-motion still = lamp fully on).

### `cloud-curtain` — NEW (transition)
- look: two near-plane paper curtains whose leading edges are a column of scalloped cloud heads (each with a carved
  spiral slit) slide in from left and right, meet exactly at the centre, then part to reveal the next scene; they are
  out of focus and lit like paper.
- params: each half = flat fill `#CFC4DC` (lilac-grey) with 12 circles r 0.024–0.034·(H/0.33) along the edge, 0.036
  pitch; spiral slits 1.7 turns, r 15 %→75 %; closing over the last 1.2 s of the outgoing shot, opening over 1.3 s
  easeInOut on the next; halves must overlap by the scallop radius at the meeting point (front edges touch).
- build: transitions.tsx `curtain` with `variant:'cloud'|'velvet'|'paper'`, props `color`, `scallops`, `blur`
  (near-plane DoF, 4–8 px), `shadow`. Closing half: translateX from ±(W/2 + r) to ∓overlap; at mid-point swap scenes
  (old fully covered); then open. Draw edges as SVG path of arcs + `destination-out`-style slits via mask.
- source: lemo-opuscar/styles/paper-lantern/demo/src/shots/s17_sushi.js (`cloudCurtain`), s16_mutual.js (overlap note) (MIT).
- value: theatrical chapter change for paper, folk-tale, festival and kids' content; `velvet` variant reusable for
  silent-film/stage looks.

### `paper-strip-title` — NEW
- look: a title on a cut paper strip (cream/gold) grows out of its anchor edge — vertical columns of brush calligraphy
  revealed column by column like a scroll unrolling (glyphs never squashed, the strip is uncovered), then a small red
  seal stamps beside it.
- params: per column scaleY/clip 0→1 with ease-out over 1.25 s, columns staggered ~0.5 s or on spoken words; seal pops
  0.3 s ease-out 1.2 s after the last column; strip `#F1DBAC`/`#F3D998`, ink brown/black, seal `#B3302A` with paper
  characters; soft shadow on the layer behind.
- build: `motions/text/paper-strip-title.tsx` props `columns:[string]` or `lines` (horizontal mode), `vertical`,
  `font` (Ma Shan Zheng default), `stripColor`, `inkColor`, `seal:{text, color}`, `startFrame`, `columnFrames`,
  `stagger`, `anchor:'top'|'left'`, `backdrop`. Reveal = clipPath rect growing from the anchor (equivalent to the
  source's scale-plus-texture-repeat trick).
- source: lemo-opuscar/styles/paper-lantern/demo/src/shots/s17_sushi.js (poem reveal), s13_note.js (`reveal`) (MIT).
- value: East-Asian festival titles, poems, recipes, letters, wedding/anniversary cards; also any "unrolling scroll" title.

### `paper-depth-travel` — EXTENDS `parallax-landscape` (new `finish:'papercut'`)
- look: the train-journey shot: layered paper ranges, rivers and towns scroll sideways at speeds proportional to depth
  inside the lightbox (back slow and glowing, front fast and dark), each layer with rim light and cast shadow.
- params: speed ∝ 1/depth (layers at z −.14…0); lateral travel 3–6 s; same ladder and shadows as `lightbox-stack`.
- build: add `finish:'papercut'` to `parallax-landscape`: per layer flat fill from a `ladder` prop, top rim (+3 px warm
  line at 35 %), bottom shade, `feDropShadow` onto the next layer, optional backlight radial (shares code with
  `lightbox-stack` svg mode).
- source: lemo-opuscar/styles/paper-lantern/STYLE.md §8 "Depth as distance", DEMO.md Shots "Train" (CC BY 4.0).
- value: journeys, shipping/migration routes, timelines in a festive paper look without a new motion.

---

## paper-popup

### style `paper-popup` — Paper Pop-up Book
- **essence**: a real hardcover pop-up book on a real desk becomes a stage: saturated, outlined, flat cut-paper cards
  with thick off-white sticker borders and grey cardboard edges spring up from the page, lit by a real lamp and seen
  through a real macro lens (shallow focus, soft contact shadows shaped like the cut-outs). The charm is the mismatch:
  graphic paper cartoons under photoreal light.
- **palette** (documented DEMO.md; measured from context.txt):
  - home valley: grass `#86C763 → #9FD57A` (doc) ≈ `#98C65A`/`#99C45F` (measured top); hills `#B5E39A` `#A9DD8C` `#8FD06E`,
    shade `#6FB553`; path `#ECD49A`; sky `#7CC6EF → #C9ECF7`
  - sea spread: waves `#9AD8F5` `#79C3EE` `#58ADE3` `#3F95D6` `#2F7FC4`; measured board `#276C95`/`#4187A4`/`#1E608C`;
    day sky `#4FB3EA`, night `#131D44 → #4A5A94`
  - forest: ground `#4F8F46 → #62A653`, pines `#8CC9A0`/`#3F9A5C`, sky `#A8E0CF`
  - border (paper) `#FFFDF7` (doc; measured cream `#EFDDB1`/`#E8DAB7` under warm lamp); card edge `#B9AD9C`; card back `#EFE8DA`
  - ink (never black) `#3A2A24`; accents mushroom red `#E8413A`, sun `#FFD766`, banner gold `#FFCF3F`, ribbon red `#D8423A`
  - real world: walnut `#C9A88A` tint, warm lamp light; measured `#7A6233`/`#9B3A13` = desk wood in lamp shadow.
  - last page "unfinished": cream `#F5EEDC` + graphite `rgba(70,72,82,.45)`.
- **texture / post recipe**
  - Cut-paper finish per card: silhouette dilated (16+ angles on three rings r, .66r, .33r, recoloured `source-in`):
    grey edge = dilate(border+2.5) in `#B9AD9C` offset 1.5 px down; off-white border = dilate(border) in `#FFFDF7`;
    art on top; shared grain tile `source-atop` α .5–.85. Border 12–16 px at 5200 px/m (characters 16, props 14).
    → **NEW STEP `stickerBorder`** `{width:14, color:'#FFFDF7', edge:'#B9AD9C', edgeWidth:2.5, edgeOffset:1.5}`:
    SourceAlpha → feMorphology dilate(width) → feFlood color → feComposite in = border; SourceAlpha → dilate(width+edgeWidth)
    → feOffset dy=edgeOffset → feFlood edge → composite in = edge; feMerge edge, border, SourceGraphic. Works on any motion
    rendered on a transparent background (box-bot, emote-pop, icons, text) — the single most reusable thing in this style.
  - Drawing: dark-brown ink outline 9 px + detail 5 px, round joins; one hard "crescent" shade (fill with shade, refill the
    same path shifted by (dx,dy) with base, clipped) — **NEW helper `crescentShade`** for our SVG art; wobbly shapes from
    3-harmonic noise (our `smoothClosed`).
  - Real world + lens: HDRI room, Neutral tone mapping (ACES shifts paper colours), hand DoF (CoC = aperture·(1/focus −
    1/z), 64-tap golden-angle spiral gather, max 14 px), light bloom, vignette + warmth, mux grain `noise=c0s=2`.
    → for the style engine: `saturate 1.06`, `grain .03`; overlays `vignette {amount:.3, color:'#3A2A24'}`,
    `leak {color:'#FFD9A0', amount:.12}` (warm lamp). DoF only in the 3D motion.
  - Suggested StyleDef: `family:'craft'`, steps `[stickerBorder, saturate 1.06, grain .03]`, overlays vignette + leak,
    `step: 1` (60 fps smooth in source).
- **typography** (Google Fonts, OFL): subtitles/bubbles/signs **Fredoka** 500/600/700; cover, chapter banners, action
  words, end title **Lilita One**; taglines/"The End" **IM Fell English**; CJK **ZCOOL KuaiLe** (with Fredoka in the
  stack). Subtitles 40 px cream `#FFFAF0` with 8 px dark-brown outline + soft shadow, wrap 1720 px; bubbles Fredoka 600
  46 px typed at 30 chars/s; chapter banner Lilita One 84 px gold `#FFCF3F` with 12 px ink stroke on a hanging card;
  action words italic Lilita One 120 px gradient + white/ink double stroke + rays.
- **motion rules**: on ones (source 60 fps), all f(t). Paper moves stiffly; life from easing: pop-ups
  `back(seg(t,t0,t0+.55), 1.7)`, springs for things on strings, squash/stretch on characters only. Pop-ups rise **back to
  front**: delay = (0.3 − z)·1.2 s after the spread's rise time; far pieces lie back, near ones fold forward face-down;
  fold down in the same order. Sway sin(1.6t + φ)·(0.01–0.08 rad) about the base. Characters are flat cards redrawn per
  quantised pose (1/40), walk phase from distance (1.8 cm per half step) so feet never slide, bounce |sin φ|·1.2 mm,
  blink every 3.7 s; turning = scaleX flip between front/back drawings (never rotateY). Jumps = parabolic arc + squash
  both ends + paper puff. Page turn = 40-segment curling strip over 2.3 s. Camera: one virtual macro camera
  (monotone-cubic keys of pos/target/fov/aperture/focus; a new key list = a hard cut); eye-level macro track, 3/4 pull-up
  for page turns, descending dolly, push on a face, reverse shot to the huge blurred room, rack focus paper ↔ real
  object, top-down, rising crane. Transitions: page turns, book close/reopen, hard cut on a paper sound; never a video
  dissolve inside the book.
- **signature moves**: ours — `sign-drop` (hanging chapter sign on strings = COVERED), `origami-fold` (paper plane),
  `comic-burst` (action words ≈ covered), `chat-bubbles`/`story-caption-box` (typed bubbles), `page-turn` (transition),
  `confetti-burst`; proposed — `popup-spread`, `sticker-cutout` (stickerBorder), `page-curl` (EXTENDS page-turn),
  `typed-bubble` (EXTENDS story-caption-box), `blinds` vertical (sky slats, see newsreel).
- **do**: real units, real light, real lens; one dominant hue family per spread (a page turn is a colour change) with a
  few recurring accents; ink dark brown; card backs plain paper; cut-out-shaped shadows. **don't**: neon, black ink,
  modelled-round 3D, squishing paper (claymation), rectangle shadows, `rotateY` turns, ACES tone mapping, foreground
  pop-ups filling the lens with blur, copying Paper Mario / Sabuda designs.
- **source**: `lemo-opuscar/styles/paper-popup/` STYLE.md, DEMO.md, demo/paper.js, cutmesh.js, book.js, sets.js,
  hud.js (MIT code, CC BY 4.0 docs).

### `sticker-cutout` — NEW (FilterStep `stickerBorder` + tiny wrapper motion)
- look: any subject (character, icon, product photo with alpha, text) gets a thick off-white die-cut border, a thin grey
  cardboard edge peeking out below it, paper grain on top, and a cut-out-shaped soft shadow — instantly a paper sticker /
  pop-up card.
- params: border 12–16 px at 1080p (≈ 1.1–1.5 % H), colour `#FFFDF7`; edge +2.5 px, `#B9AD9C`, offset 1.5 px down;
  grain α .5–.85; shadow = same alpha, blurred 8–14 px, offset (6, 10) px, 25–35 % ink.
- build: add `{type:'stickerBorder'; width; color?; edge?; edgeWidth?; edgeOffset?; shadow?}` to `FilterStep` (filter
  chain in the step comment above; runs on SourceAlpha so it composes with every motion). Wrapper `mix` layer prop
  `sticker: true` applies it to one layer only (backdrops must stay unbordered).
- source: lemo-opuscar/styles/paper-popup/demo/paper.js (`finishCut`), cutmesh.js (cut-out shadow) (MIT).
- value: one-line upgrade for kids, games, social stickers, "paper" recipes; makes `box-bot`, `emote-pop`, `chat-bubbles`,
  `card-fan` look craft-made; the most cost-effective item in this part.

### `popup-spread` — NEW (three.js, with a CSS-3D fallback)
- look: an open book on a desk; when the spread "rises", flat cut-paper cards lying on the page flip up around their
  bottom edges with a springy overshoot, back row first then forward, while plants sway gently; on a page turn they fold
  down in the same order as the curling page passes, and the next spread's cards spring up.
- params: per card `rotation.x = −(π/2)·(1−k)`, k = back(seg(t, t0, t0+0.55), 1.7), t0 = RISE + (0.3 − z_m)·1.2 s;
  far cards lie back (dir −1), near ones fold forward face-down (dir +1); sway sin(1.6t + φ)·0.01–0.08 rad; page 0.44×0.30 m,
  actors 3–5 cm, camera 5–10 cm above the page and 30–45 cm back, fov 30, aperture 2.2–2.5; key light shadow map 4096,
  bias −6e-5, normalBias 4e-4; card material alphaTest .5 + alphaToCoverage + customDepthMaterial (cut-out shadows),
  back face paper colour `#EFE8DA`.
- build: `motions/3d/popup-spread.tsx` (three.js via @remotion/three) props `pieces:[{art: motionId|src|preset('hill',
  'pine','mushHouse','cloud','sign','fence','waves'…), x, z, scale, dir, sway}]`, `spreadColor`, `skyColor`, `riseAt`,
  `foldAt`, `nextSpread`, `book:{cover, title}`, `camera:{keys}`, `dof`, `desk:'walnut'|'none'`, `seed`. Cards are planes
  textured from offscreen SVG→canvas with the `stickerBorder` finish baked in. CSS-3D fallback: `transform: rotateX()`
  with `transform-origin: bottom` per card, perspective 1200 px (no shadows; fine for web heroes).
- source: lemo-opuscar/styles/paper-popup/demo/sets.js (`popper`, `updatePops`, `RISE/FOLD`), cutmesh.js, main.js
  minimal example (MIT); DEMO.md Motion numbers.
- value: children's stories, game trailers, product "unboxing" of a feature set, onboarding chapters, kids' edtech;
  a strong hero for websites (CSS-3D mode is light).

### `page-curl` — EXTENDS `page-turn` (transition, new `variant:'curl3d'`)
- look: a real paper leaf lifts from the spine and curls over as it turns — bend strongest mid-turn — showing the old
  ground on its front and the new sky on its back, with soft shading along the curl.
- params: leaf of N = 40 segments; turn angle θ = (π/2)·u in the source (the backdrop board stands at 90°; use π·u for
  a flat-open book); segment angle
  φ(s) = θ·(1 − L·(s − ½)), L = 0.55·sin(πu); positions integrated along the length (z += cos φ·ds, y += sin φ·ds);
  eased with easeInOut over 2.3 s; old pop-ups fold down as the leaf passes their z.
- build: in transitions.tsx `page-turn` add `variant:'curl3d'` rendered as N vertical SVG strips of the outgoing scene
  (front) and incoming scene (back), each strip affine-transformed by its integrated φ (projected with a fixed
  perspective) and shaded by cos φ (multiply black 0–35 %); `bend` prop (default .55), `segments`, `shadow`. The 3D
  motion `popup-spread` uses the true mesh version.
- source: lemo-opuscar/styles/paper-popup/demo/book.js (`setLeaf`) (MIT).
- value: storybook and magazine-style chapter changes that feel physical rather than a flat swing.

### `typed-bubble` — EXTENDS `story-caption-box` (new `variant:'bubble'`)
- look: a white rounded speech bubble with a 6 px ink outline and soft shadow pops in with overshoot next to a speaker,
  its tail always pointing at the speaker (recomputed each frame), text types on with a per-character blip cue, then a
  second-language line and a bobbing red "next" triangle appear.
- params: radius 44 px, outline 6 px ink `#3A2A24`, pop back(…) ~0.3 s; typing 30 chars/s, blip every 2nd letter (sound
  events: per-character pitch range per speaker, square/triangle waves); Fredoka 600 46 px; second line 32 px
  `#7A5E4C`; next-triangle bob 2 Hz, 6 px.
- build: `story-caption-box` `variant:'bubble'` props `items:[{text, sub, speaker:[x,y] | layerRef, at, side}]`,
  `charsPerSecond`, `blipEvery`, `tail:true`, `ink`, `paper`, `next:true`; export blip times via the library's
  events/meta for the mix (like `beat` cues).
- source: lemo-opuscar/styles/paper-popup/demo/hud.js (`drawBubbles`, `blipTimes`) (MIT); STYLE.md §4, §7.
- value: game-like dialogue for tutorials, quizzes, character explainers; `chat-bubbles` is chat UI, this is RPG/storybook dialogue.

---

## Summary of techniques in this part

| style | technique | verdict |
|---|---|---|
| midcentury-toon | `toon-cel-shape` | NEW (core primitive) |
| midcentury-toon | `step-medallion-iris` | EXTENDS `iris` + `stamp-slam` |
| midcentury-toon | `callout-magnifier` | EXTENDS `callout-labels` |
| midcentury-toon | `coverage-route` | NEW |
| midcentury-toon | `sunburst-hero` | NEW (small) |
| news-package | `news-strap` | NEW |
| news-package | `sting-bug` | NEW |
| news-package | `rundown-board` | NEW |
| news-package | `split-flap-board` | EXTENDS `number-counter` |
| news-package | `threshold-break-chart` | EXTENDS `live-chart` |
| news-package | band wipe / slanted wipe | EXTENDS `bar` / `diagonal` (note) |
| newsreel | `spinning-headline` | NEW |
| newsreel | `newsreel-ident` | NEW |
| newsreel | `projector-gate` | EXTENDS `film-look` |
| newsreel | `grease-pencil-mark` | NEW |
| newsreel | `blinds` | NEW (transition) |
| one-line | `ink-pressure-line` | EXTENDS `line-draw-on` |
| one-line | `nib-follow-camera` | NEW (camera helper) |
| one-line | `ink-blot-stop` | NEW (small) |
| one-line | `written-caption` | EXTENDS `handwrite-on` / `kinetic-captions` |
| paper-lantern | `lightbox-stack` | NEW |
| paper-lantern | `cloud-curtain` | NEW (transition) |
| paper-lantern | `paper-strip-title` | NEW |
| paper-lantern | `paper-depth-travel` | EXTENDS `parallax-landscape` |
| paper-popup | `sticker-cutout` | NEW (FilterStep `stickerBorder`) |
| paper-popup | `popup-spread` | NEW |
| paper-popup | `page-curl` | EXTENDS `page-turn` |
| paper-popup | `typed-bubble` | EXTENDS `story-caption-box` |

Already covered (mentioned in styles, no technique entry): hanging chapter sign → `sign-drop`; action words "NICE!" →
`comic-burst`; grid deal → flip-book → `beat-montage`/`thumbnail-mosaic`; lateral map push → `map-route`/`ken-burns`;
paper plane fold → `origami-fold`; whale confetti → `confetti-burst`; iris close/open, diagonal wipe, card flip, clock
wipe, page turn → existing transitions.

New style-engine pieces proposed in this part: FilterSteps `celRegister`, `stickerBorder`, (optional) `grain.streak`;
overlays `gate` (pillarbox + radius, extend `letterbox`), `projector` (flicker/weave/scratches/dust), `bloom`
(threshold-gated glow); helpers `crescentShade`, `followCam`, `ProjectorOverlay`.

Counts: 6 styles; techniques NEW 17 (incl. 2 transitions, 1 camera helper, 1 core primitive, 1 FilterStep),
EXTENDS 10 (+1 transition note), COVERED 0 as entries (7 covered items listed in prose).

---

<!-- part B: lemo-opuscar styles: papercut-red, pictogram-motion, pixel-rpg, risograph, rubber-hose, satellite-briefing -->

Source repo: `opus_sources/repos/lemo-opuscar` (LemoLab / @lemomo_ai). Code MIT, docs (STYLE.md / DEMO.md) CC BY 4.0.
Attribution string for any style/motion built from this: "after LemoLab lemo-opuscar `styles/<id>` (MIT code, CC BY 4.0 docs)".
Everything below is paraphrased; numbers, hexes and one-line formulas are quoted from the files named.
Palette marks: **(M)** = PIL-measured from poster/frame/board (context.txt) or seen in the images; **(D)** = documented in STYLE.md / DEMO.md / engine constants.
Never ship any of the demos' story elements, titles ("Nian Comes to Town", "The Last Save Point", "Sunday Ride", "Coffee Cup Chase", "The Map Still Says Sea"), the "LemoLab × Claude Opus 5.5" sign-off, or (pictogram) anything of the real event identity.

New style-engine pieces proposed in this part (detailed inside each style):
- FilterSteps: `cutEdge` (paper layer shadow + cut rims), `selectiveColor` (keep/re-inject one hue or a masked region in colour), `dither` (ordered Bayer threshold before posterize / gradientMap), `risoPlates` (ink separation → per-plate offset + angled halftone + ink grain → multiply on paper), `clarity` (local contrast), `chromaKeep` (blend back a fraction of source chroma after a gradientMap).
- Overlays: `filmGate` (4:3 rounded pillarbox gate with inner shadow), `filmDamage` (weave + jump, flicker, scratches, dust, hair, cut jump), `registration` (frame-driven per-plate kick/drift for `risoPlates`/`misregister`).
- Transitions: `rows` / `cols` / `quarter` / `tile-flip` (grid-snapped), `mosaic`, `swirl` (encounter), `overprint`, `scan`, `peel`, `grab-iris`.

---

## papercut-red

### style `papercut-red` — Red Paper-cut (window-flower paper cuts)
- **essence**: every visible thing is a piece of scissor-cut paper laid on another sheet; no strokes, no gradients, no shading — detail and expression come only from what was cut away (holes). Red is the hero material on a contrasting paper family (indigo night or rice-paper day); characters are jointed cut-outs stepping at 12 fps; "holes are light" is the special event.
- **palette**:
  - bg (night paper) `#1C2446` (D), sky ink `#0F142A` (D); measured night layers `#0D1126`, `#202652`, `#373D71`, `#6D74AB` (snow/near hills) (M). Night layer ladder (D): far hills `#1F2A55`, near hills `#29356E`, houses `#35457F`, trees `#28346C`, snow `#7A88BA`.
  - paper (day) rice `#F2E8D0` (D); day hills pale red `#E0877F`, mid `#CF4F4A` (D).
  - ink / hero = China red `#D2201F` (D; range `#C8102E`–`#D7261E`); measured reds under night light `#AD1522`, `#8B0F23` (M).
  - accent (one step deeper, antagonist / heavy object) `#B00F26` (D); far red `#7E1424`, mid `#9C1323` (D); subtitle banner red `#A8111F` (D); fold back side `#DE3B30` / paper back `#E98F86` (D).
  - accent2 = gold foil `#D9A93F` (D) — one late moment only (sun, title flecks).
  - light (backlit): radial `#FFF6D6 → #FFC46E → #EC782E`, transmission red `#B51D18`, warm pool `#FFE3A6` (D). Cream text `#FFF1D6` (D).
  - paper shadow `rgba(52,6,10,.38)` (D).
- **texture / print / post recipe** (as a style over any motion):
  1. `gradientMap` discrete, paper-family ramp: night `['#0F142A','#1F2A55','#29356E','#35457F','#7A88BA']` (day: `['#9C1323','#CF4F4A','#E0877F','#F2E8D0']`).
  2. NEW `selectiveColor {hue: 0, range: 25°, minSat: 0.35, color: '#D2201F', levels: 3}` — re-inject the source's saturated reds as flat paper reds (3 tones `#8A0C20/#D2201F/#E94436` by source luminance) on top of the indigo map, so the red subject keeps popping off a different paper family. Algorithm (SVG): feColorMatrix on SourceGraphic → redness = R − 0.5G − 0.5B; feComponentTransfer threshold (discrete table) → mask; feComposite `in` a 3-step posterised red version; feMerge over the mapped frame.
  3. NEW `cutEdge {dx: 2.6, dy: 3.6, blur: 5, color: 'rgba(52,6,10,.38)', rim: 1, rimLight: 0.12, rimDark: 0.25}` — fake stacked paper. Height map = discrete layer index (luminance after step 1, red mask counted as top layer). Shadow = blur(offset(height, dx, dy)) − height, clamped ≥ 0, multiplied by shadow colour (piece sits above the layer below). Cut-face rims: height − offset(height, −1, −1) > 0 → add `rimLight` white (upper-left), height − offset(height, +1, +1) > 0 → multiply `rimDark` (lower-right). All in feOffset / feComposite arithmetic / feGaussianBlur on the luminance channel.
  4. `wobble {scale: 1.2, frequency: 0.02, boil: 0}` — low-frequency hand-cut edge irregularity, never boiling (paper doesn't boil). (Source: edge wobble ≈ 0.35 units at freq 0.09 along arc length.)
  5. overlay `paper {color: '#F2E8D0' (day) | '#1C2446' (night), amount: 0.18, fiber: 0.6}` — fibre mottling ±7 % at ~130 px (source grain: 3 octaves value noise + 700 light fibres + 260 dark fibres, soft-light). **No film grain** (fibres are the texture). Optional `vignette 0.25`.
  6. `step: 2` (figures on 12 fps; camera/light ideally on ones — in the engine, accept 2 for the whole frame).
- **typography**: source Fraunces 800 (cut letters, title) / Fraunces SemiBold 600 44 px cream on red banner (subtitles) / italic sub-line; Ma Shan Zheng for a CJK character in the seal. Both are Google Fonts — use as is. Display `Fraunces` 800, body `Fraunces` 600 italic; CJK accent `Ma Shan Zheng`.
- **motion rules**: characters pose-sampled at floor(t·12)/12; camera, light, weather, flames, flying pieces on ones (24 fps). Hard poses, tiny eases, 1-frame overshoot ("pop" 1.15× for one 12-fps step). Weight from size + camera shake (~6 px per heavy step). Folds ≈ 0.55 s each on a hit; unfolds 0.25 s apart with ease-out snap, then a scale bump + warm flash. Cut reveal: scissor blades open/close every 0.25 s (one snip per eighth note at 120 BPM). Subtitle banner drops in on two 12-fps steps. Transitions are paper actions only: fold over, page turn, corner peel, a sheet flying off, a cut through the frame — never dissolves. Layers stay screen-parallel; depth only from parallax + paper tone.
- **signature moves**: `papercut-rosette` (fold–cut–unfold), `backlit-cutout` (holes are light + projected pattern), `parallax-landscape` mode `papercut` (sawtooth ridge layers; a ridge stands up as a creature), `couplet-banner-caption`, transition `peel` (night sheet peels from top-right to reveal day), `confetti-burst` re-skinned as red paper triangles (scraps come back as confetti/firecrackers — see docs/frames: red triangle scraps), `origami-fold`.
- **do**: different paper family for ground vs hero; near pieces one tone brighter, far one darker; inset contour (thin slit ~3.5 units inside the outline, 1.5 wide) on every figure piece to separate red-on-red overlaps; eyes as two crescents + pupil hole (no floating islands); swap whole face pieces for expressions; keep fold creases visible; gold only once.
- **don't**: red on red; outlines/strokes; gradients except backlight; smoothing architecture (straight segments + wobble); darkening a covered layer through the light map; dissolves; naming the folk/studio references; film grain.
- **source**: `styles/papercut-red/STYLE.md`, `DEMO.md`, `demo/paper.js` (piece builder, grain, edges, shadow), `demo/tuanhua.js` (D4 rosette), `demo/fold.js`, `demo/light.js`, `demo/motifs.js`, `demo/hud.js`; images `poster.jpg`, `docs/frames/papercut-red.jpg`, `styleboard/img/papercut-red_0.jpg`. MIT code + CC BY 4.0 docs.

### `papercut-rosette` — NEW
- look: a square of red paper folds 2/4/8 times in snappy flaps (back side lighter, stack edges darker), scissors cut along a path revealing sawtooth bands, crescents, lantern and cloud motifs as holes, the offcut drops, then the sheet unfolds in quick snaps into an 8-fold round window flower (团花) that blooms to fill the frame with a warm flash; scraps flutter down.
- params: rosette radius TR = 400 units; outer edge scalloped `r(a) = TR·(0.9 + 0.1·|cos 8a|^0.6)`; symmetry D4 = 8 transforms of one 45° wedge (rotations k·90° and the same composed with a mirror about the 45° line); 4-fold and 6-fold options = C2v / D3 of a 90° / 60° wedge. Rings alternate yang (band cut away, red lines left) and yin (lines cut out of a red field); motifs on fold lines (ruyi scrolls), sawtooth on ring edges. Fold ≈ 0.55 s on a beat; flap split into 16 strips, each compressed by cosθ along the fold normal and enlarged along the fold by `1 + 0.28·h` (h = strip distance / TR × lift, lift = √(1 − s²)), shaded `rgba(40,0,6,·)` as it stands up, back colour `#DE3B30` past 90°, growing shadow, crease line after. Stack thickness: n = 2–6 copies offset (1.1, 1.4) px each, alternating `#9C1418` / `#B51A1C`. Cut: reveal circles r ≈ 62 units along the scissor path; blades open/close every 0.25 s; camera holds the tip at ~32 % frame. Unfold: 3 unfolds 0.25 s apart, ease-out; bloom on the next downbeat.
- build: SVG. (1) Wedge = `<path>` of the 45° sector clipped to `r(a)`, filled red, with a `<mask>` whose black shapes are the cut motifs (generated procedurally: sawtooth rows = triangle polylines along an arc, crescents = difference of two offset circles, tapered slits = polygon with width `w·sin(π·i/(n−1))`, lantern = ellipse with ribs). (2) Full rosette = `<use href="#wedge">` ×8 with `transform` matrices of D4. (3) Fold phase: render the square sheet as a `<g>` of 16 strip `<clipPath>`s per flap, each with its own `matrix()` (frame-driven θ = interpolate(frame, foldStart, foldStart+13, [0, π], easeInOut)). (4) Cut phase: reveal mask = union of circles placed along a polyline up to `pathLength · progress`; holes only show inside revealed area. (5) Unfold phase: reverse the fold transforms on the full rosette (wedge → quarter → half → full), each 6 frames apart at 24 fps, then `scale 1→1.06→1` + `#FFF6D6` radial flash 30 %. (6) Scraps: deterministic red triangles with fall + flutter (reuse confetti-burst physics). Props: `color`, `backColor`, `folds` (1|2|3 → 2/4/8-fold), `symmetry` (4|6|8), `motifs` (`['saw','crescent','lantern','cloud','coin','plum','slit']`), `rings` (yang/yin pattern list), `centerIcon` (host SVG path cut into the centre — e.g. a logo as holes), `cutFrames`, `unfoldAt`, `mode` (`full` | `unfold-only` | `static` | `spin`), `scraps`, `backlit` (hands off to `backlit-cutout`), `seed`.
- source: `styles/papercut-red/demo/tuanhua.js` (wedge × D4, outerR), `demo/fold.js` (strip flap, stack), `demo/motifs.js`, STYLE.md §5/§8, DEMO.md S7–S8 (MIT / CC BY 4.0).
- value: Lunar New Year / festive greetings, logo reveal ("logo cut from one fold becomes a rosette"), "one becomes many" metaphors (franchise, team, scaling), loading/hero emblem; `spin` mode as a slow decorative backdrop.

### `backlit-cutout` — NEW
- look: in a dark paper scene a cut-out (rosette, lantern, logo, word) lights from behind: the paper glows deep red, every hole glows warm white, a two-level bloom and soft rays spread, and the hole pattern is thrown as light across the ground (squashed into perspective) and onto a character's face.
- params: light ramp `#FFF6D6 → #FFC46E → #EC782E`; paper transmission `#B51D18` (multiply), holes at full light; bloom radii 10 px and 40 px (half-res), strength ≈ 0.55; optional rays ~18 spokes; projected pattern = hole mask × affine `[1.25, 0, −0.9, 0.3]` (wide, flattened, sheared toward camera) added with `lighter`/screen; on a character: hole mask clipped to the character's silhouette over a solid warm spot so cut features still read. Night ambient ~`rgb(214,214,236)` multiply over the rest.
- build: SVG/HTML layers. Cut-out as a `<mask>` (white piece with black holes). Layer A: the piece filled `#B51D18`, with the radial gradient visible through the holes (mask inverted inside the piece outline). Layer B: bloom = same hole layer, `feGaussianBlur` 10 and 40 px merged with opacity 0.55·ignite. Layer C: projection = `<use>` of the hole layer inside `<g transform="matrix(1.25 0 -0.9 0.3 tx ty)">`, `mix-blend-mode: screen`, blur 2 px, opacity 0.7. Layer D: scene dims with a multiply rect (ambient) before ignite, warm pools (radial gradients) after. `ignite` = interpolate(frame, [igniteAt, igniteAt+12], [0,1], easeOut) with a 2-frame candle flicker (seeded ±6 %). Props: `shape` (`rosette` | `lantern` | `svgPath` | `text` | `src` alpha image), `lightColors`, `transmission`, `groundY`, `projectMatrix`, `projectOnto` (rect/ellipse of a subject), `igniteAt`, `flicker`, `bloom`, `rays`, `ambient`, `background` (transparent → overlay-capable).
- source: `styles/papercut-red/demo/light.js` (glowWindow, bloom, rays, lightMasked/addMasked), DEMO.md "Palette & props" + S9 (MIT / CC BY 4.0).
- value: night reveals, "an idea shines through", lantern/Diwali/Lunar New Year, a logo projected as light on a wall; works as overlay over any dark motion (city-skyline, starfield-night).

### `paper-layer-parallax` — EXTENDS `parallax-landscape`
- look: 3–5 flat paper layers (far hills, near hills, houses, trees, snow) slide in parallax; ridges are sawtooth-cut; snow is punched dots; each layer casts a tight shadow on the one below; windows hold tiny rosettes; a far ridge can "stand up" and become a creature's back.
- params: sawtooth edge h 12, spacing 14 units (`sawEdge`); shadow (2.6, 3.6) px blur 5 `rgba(52,6,10,.38)`; layer tones one step apart within one paper family (night ladder above); parallax factors e.g. 0.3 / 0.55 / 0.8 / 1.0 / 1.3; camera on ones; punched snow = small hole circles in the sky sheet + falling paper dots.
- build: new `mode: 'papercut'` + `paperFamily: 'indigo' | 'rice' | 'jade' | 'black'` on parallax-landscape: replace its gradient sky and shaded hills with flat fills; ridge paths get a sawtooth polyline; add `feDropShadow` per layer; windows = small `papercut-rosette` `static` instances; `standUp {layer, at, frames}` rotates/lifts one ridge layer around its left end (12-fps stepped). Props added: `sawtooth`, `snow`, `standUp`, `windowFlowers`, `lit` (hook into `backlit-cutout`).
- source: `styles/papercut-red/demo/village.js`, `world.js`, `motifs.js`; DEMO.md S3/S4 (MIT / CC BY 4.0).
- value: festive scene backdrops, story intros, title backgrounds that feel handmade.

### `couplet-banner-caption` — EXTENDS `story-caption-box`
- look: subtitles on a dark-red paper strip with serrated edges and swallow-tail ends, cream serif text, a paper shadow; it drops in like a couplet being pasted (two stepped frames). Title variant: cut letters (counters are real holes) pop in letter by letter with a 1-step 1.15× pop, sawtooth border strips and a red seal with one character cut out.
- params: strip `#A8111F`, text `#FFF1D6` Fraunces 600 44 px, centred 70 px from bottom; drop in on two 12-fps steps (e.g. y −40 → +6 → 0 px); hold ≥ max(1.8 s, speech + 0.7 s), never overlap; title Fraunces 800 on rice paper, letter interval one 12-fps step.
- build: new `variant: 'banner' | 'cut-title'`. Banner = path with zig-zag top/bottom (amplitude 4 px, period 14 px) and V-notch ends, `feDropShadow`; text in HTML/SVG. Cut-title = text rendered as a `<mask>` hole inside a red rect per letter (so counters show the paper beneath), letters appear at `floor((frame−start)/2)`; seal = rounded square red with a glyph mask. Props: `bannerColor`, `textColor`, `ends: 'swallow'|'square'`, `serration`, `seal`, `sealGlyph`, `stepFrames`.
- source: `styles/papercut-red/demo/hud.js`, STYLE.md §4, DEMO.md "End card" (MIT / CC BY 4.0).
- value: captions and titles for festive / folk-tale / craft content; matches papercut style without a new font stack.

---

## pictogram-motion

### style `pictogram-motion` — Pictogram Motion (beat-locked flash-card identity)
- **essence**: a catalogue film built from three things only — a square-grid "core graphic" of discs, half-discs and small motif cells in five tones of one hue whose rows slide sideways; faceless geometric pictogram figures of round-capped bars and a disc head; and huge 900-weight type sliding out of masks with mono broadcast HUD text. Every cut lands on a beat; one chapter = one hue.
- **palette**: the demo's five hues were sampled from a real event's identity — **do not reuse those hexes or names**. Use the *system*: 5 hues + 1 dark neutral, each hue in 5 tones t0 (darkest) … t4 (lightest), t2 = base; card pattern at low contrast (`spread 0.42` = tones mixed 42 % from base), chapter cards full contrast (`spread 0.95`).
  - Measured reference (M): green chapter `#006F35 / #04873B / #099A3F / #189F41 / #7BBE89`; gold chapter `#C9A303 / #D9B518 / #E7D16C`, dark fg on gold `#5A480D`.
  - Suggested original set (ours; tones = mix toward black 25 % / 12 %, base, mix toward white 15 % / 32 %): vermilion `#E2462E`, indigo `#3D3A9A`, field green `#0F9A52`, mustard `#D8B21A` (dark fg), clay `#C48A45` (dark fg); dark neutral `#1E1A27` (accent = mustard).
  - roles: bg = t1 of the chapter hue; pattern = t0–t4; fg cream `#FBF6EC` (D), ink `#15111C` (D) on light hues; tag chip accent red; light sweep = white 9 %.
- **texture / post recipe**: flat Canvas-clean; grain only at the end (source: ffmpeg `noise c0s=4` ≈ 1.5 %). As a style over other motions: `gradientMap {discrete: true, ramp: [t0,t1,t2,t3,t4,'#FBF6EC']}` (monochrome flat chapter look), `grain {amount: 0.03}`, no paper, no outline. NEW (optional) overlay `tickBar {count, index, color}` is better built as a HUD motion (see `catalog-card-run`). `step: 1` (source renders 60 fps; motion blur only inside transition windows).
- **typography**: title Inter Tight 900, 150–330 px at 1080p, tracking −0.02 em, auto-fit to 820 px; second language Noto Sans JP / Noto Sans SC 900, 92 px; meta DM Mono 500 22 px tracking 3 px; HUD DM Mono 17 px. All Google Fonts. Display `Inter Tight` 900, body `DM Mono` 500.
- **motion rules**: pick one BPM (demo 150: beat 0.4 s, bar 1.6 s). Every shot starts on a beat; every key action (release, contact, landing) on an integer beat. Normal card = 4 beats; rapid-fire sub-runs = 2 beats with all timings ×0.7 (pace ladder; never change tempo). Easing: exponential ease-out for entrances, exponential in-out for whips/wipes, back ease at most once. Type: mask slide-up, title over 0–0.5 s, second line +0.08 s, tag +0.2 s; meta types on without caret. Figure enters as 54-px horizontal bands offset alternately ±90–250 px sliding into register over 0.42 s (0.28 s on 2-beat cards). Backgrounds: odd rows drift right, even left, 26 px/s + fixed sine per row; chapter cards: every row jumps a quarter-cell on each beat of the second bar. Transitions snap to the grid, window 0.12 s before → 0.26 s after the cut. Sub-frame motion blur (5 samples over a 0.5/60 s shutter) only in transition/whip windows. Long take: camera drifts 42 px/s and whips one screen per cut (ioExp from −0.14 s to +0.24 s around the beat). No dissolves, no 3D camera, no handheld, no DoF.
- **signature moves**: `motif-grid-pattern`, `pictogram-figure`, `catalog-card-run`, grid transitions (`rows`, `cols`, `quarter`, `tile-flip`, `iris`), count-up slam (COVERED by `number-counter` — use odometer mode on a bar), icon wall finale (EXTENDS `thumbnail-mosaic`: 9×5 wall flips in, turns one colour, collapses to one disc), "ON YOUR MARKS… SET…" half-beat silence before a big hit.
- **do**: one card = one item with one verb readable in a bar; chapter = colour; dark type and figures on light hues (their disc uses the lighter tone t4); on the dark neutral the disc uses t3; keep text column and figure stage apart (mask the figure buffer with a gradient before the text column); an `.srt` of the title cards from the edit list.
- **don't**: faces or emotions on figures; outlines/highlights other than the one sweep; gradients; copying any real games' pictograms, emblem, slogan, pattern art or colour names; mascots/landmarks inside motif cells; unbounded pattern caches (LRU ≤ 10).
- **source**: `styles/pictogram-motion/STYLE.md`, `DEMO.md`, `demo/engine.js` (G.pattern, G.drawPattern, G.joints, G.drawFigure, G.keyPose, G.runCycle, G.maskText), `demo/scenes.js` (layouts, transType, isFast/renderFrame blur), `demo/poses/*.js`; images `poster.jpg`, `docs/frames/pictogram-motion.jpg`. MIT code + CC BY 4.0 docs; demo identity elements belong to the event organiser (rights note in DEMO.md) — never reuse.

### `motif-grid-pattern` — NEW
- look: full-bleed backdrop of square cells (cell ≈ 1/6 frame height) carrying big discs and half-discs that straddle grid nodes, discs-with-inner-half-discs, and small motif tiles (quarter-disc, fish-scale waves, dot scales, triangle scales, striped sunset, concentric arcs, sun-wheel/gear, checker, crescent, S-wave, gradient quarter, fading bars) in five tones of one hue; whole rows slide sideways against each other, breathing slowly and jumping a quarter-cell on beats.
- params: cell 180 px at 1080p (10.7 × 6); base fill t1; per grid node: 34 % chance disc r = cell in random tone t0–t3; 16 % chance t3 disc with t0 disc of r/2 inside; then `density` 0.5 of cells get one motif (14 kinds) rotated by k·90°, tones picked so adjacent ones differ; canvas 3 cells wider than the frame so a row can shift ±1 cell; row offset = clamp(alt·26 px/s·t + A·sin(row·k), −cell, cell); beat jump = cell/4 per beat (stepped, eased oExp over 4–6 frames); spread 0.42 under text, 0.95 hero.
- build: SVG. Generate once per (seed, hue, spread) with a seeded RNG: a `<g>` per row containing circles/paths in absolute coordinates (row clipPath height = cell); each row `<g transform="translate(dx(frame,row),0)">`. Motifs as small SVG symbol functions (12–14 generic geometric kinds; all parametric in cell size). Tone set computed from `hue` by mixing toward black/white (or pass 5 explicit `tones`). Props: `tones` | `hue`, `spread`, `cell`, `density`, `motifs` (allow-list), `seed`, `rowDrift` (px/s), `bpm`, `beatJump` (on/off + which bars), `rows` (count or auto), `palette` cycle for multi-colour mode (rotate hues per row block), `background` transparent option, `light sweep` (one diagonal 9 % white band moving slowly). Overlay-capable; `MotionBackground` friendly (cheap: static shapes + transforms).
- source: `styles/pictogram-motion/demo/engine.js` `G.pattern` / `G.drawPattern` / motif kinds; STYLE.md §2, DEMO.md "The pattern" (MIT / CC BY 4.0).
- value: brandable identity backdrop for events, sports, product launches and website hero sections; the row shift doubles as a transition; one prop swaps the whole chapter colour.

### `pictogram-figure` — NEW
- look: a faceless geometric athlete — rounded bars for torso and limbs, a disc head — performing one clear action (run, jump, throw, swim, cycle, lift, serve), far-side limbs in a tone mixed toward the background, standing on a big "sun disc" crossed by a slow light sweep; arrives by horizontal bands sliding into register.
- params: unit = body height, origin at hip. Lengths: torso 0.30, neck 0.045, head r 0.082, upper arm 0.16, forearm 0.15, thigh 0.225, shin 0.225. Widths: torso 0.145, arm 0.076, leg 0.094, round caps, forearm/shin 0.92× width. Draw order: far leg, far arm (fg mixed 42 % toward bg), torso, near leg, near arm, head; second person behind at 60 % mix. Angles: limbs measured from straight down (forward = +90°, overhead 180°), arms in torso frame, legs in body frame. Run cycle: leg swing ±55°·k, arm swing ±60°·k with elbow +85°, lean 12°·k, hip bob −|cos|·0.03·k, knee bend 20 + 70·k·max(0, −cos) (+25·k when leg behind). Key poses are keyframes in **beats** with per-key easing (`io` default) and optional loop length. Disc r 360–380 px; tone t1 (light-fg hues: t4; neutral: t3). Assembly: 54 px bands, alternate offsets 90–250 px, 0.42 s oExp.
- build: SVG `<line strokeLinecap="round">` segments computed from a forward-kinematics function `joints(pose)`; pose = interpolate keyframes by `u = (frame/fps)·bpm/60`. Assembly via N `<clipPath>` horizontal bands, each with its own translateX(frame). Presets: `run`, `walk`, `sprint-start`, `jump`, `throw`, `kick`, `swim` (horizontal; stage moves outward), `cycle`, `lift`, `wave`, `point`, `sit`, `type` (desk), `custom` keys. Props `action`, `keys`, `bpm`, `loop`, `color`, `farMix`, `partner` (+ partner keys), `disc` (on/off, tone), `sweep`, `assemble`, `props` (simple geometric prop list: ball, bar, racket line, ring, capsule, laptop rectangle), `x,y,size`.
- source: `styles/pictogram-motion/demo/engine.js` (LEN, WID, joints, drawFigure, lerpPose, keyPose, runCycle, walkCycle), `demo/poses/base.js` (pose contract), `demo/scenes.js` (stageFigure assembly) (MIT / CC BY 4.0).
- value: universal "person doing X" icon-animation for explainers, onboarding, sports, workplace steps, fitness and safety instructions — no character design needed, works at any size and in any brand colour; complements `box-bot` (mascot) and `crowd-bob`.

### `catalog-card-run` — EXTENDS `chapter-header`
- look: a fast run of item cards on the beat: each card = one pictogram (or icon/image) on a disc + a huge title + a heavy second-language/sub line + mono index "07 / 43" and a tag chip; corner mono HUD and an N-tick progress bar at the bottom; chapter cards open each group with a 2-row colour band growing from centre and a huge outline numeral rising into it.
- params: layouts A (text left x 130, baseline 610; disc right centre 1290; 300 px outline index bottom-right at 20 %), M (mirror), B (title fills the frame 330 px in ghost tone, figure over it, bottom info bar), C (820 px solid left panel wipes in with a 90 px hairline grid at 10 %); rotate layouts per chapter by an order string. Progress bar: N ticks; current tall 4 px, done 75 % opacity, rest 28 %. Timings: 4-beat card, 2-beat card ×0.7; mask slide-up (0.5 s), meta type-on. Chapter band grows oExp (`E.o5`), outline numeral 330 px.
- build: add `variant: 'catalog'` to chapter-header: `items[{title, sub, meta, tag, icon|pose|src}]`, `chapters[{title, hue, startIndex}]`, `beatsPerCard`, `bpm`, `layouts` order string, `lang2` switch; reuse `mask-rise-title` for type, `motif-grid-pattern` for backgrounds, `pictogram-figure` for figures, grid transitions between cards; emit an `.srt` cue list from the same item array.
- source: `styles/pictogram-motion/demo/scenes.js` (layoutOf, cards, HUD), `demo/edl.js` (edit list in beats), DEMO.md "Card layouts", "Motion, as built" (MIT / CC BY 4.0).
- value: listicles, "all N features" launch videos, menus, top-10s, onboarding step lists, event line-ups; data-driven from a JSON list.

### `grid-snap-transitions` — EXTENDS transitions (`bands`, `strip`, `iris`)
- look: cuts that obey the grid: six cell-high rows slide in from alternating sides; eight columns drop/rise; quarter-discs grow from every cell corner until they cover the frame; an 11×6 tile grid flips over with a stagger; an iris opens from the last figure's centre with a shrinking ring.
- params: window 0.12 s before → 0.26 s after the cut (≈ 3 + 6 frames at 24 fps); ioExp easing; rows = H/6 (180 px); cols = 240 px; tiles 11×6; quarter-disc radius grows to cell·√2; stagger for flip ≈ 0.5 frame per diagonal index; 5-sample motion blur inside the window.
- build: four new `TransitionType`s in `src/transitions.tsx`: `rows` (each row of the incoming scene in a `clipPath` translated ±W·(1−p_row)), `cols` (same vertically, alternate up/down), `quarter` (luminance mask of quarter-circles anchored at cell corners, r = p·cell·1.42), `tile-flip` (mask tiles with scaleX = |cos(πp_i)| switching scenes at p_i = 0.5); `iris` gets `ring: true` + `origin` from a prop. Props: `cell`, `cols`, `stagger`, `alternate`.
- source: `styles/pictogram-motion/demo/scenes.js` (transType: rows/cols/slide/quarter/iris/flip, isFast + renderFrame blur) (MIT / CC BY 4.0).
- value: snappy identity-system cuts for sports, events, product grids; pairs with `motif-grid-pattern`.

---

## pixel-rpg

### style `pixel-rpg` — 16-bit Pixel RPG (indexed palette game grammar)
- **essence**: a 320×180 native-pixel world scaled ×6 nearest-neighbour, every colour from a limited indexed palette, gradients only as ordered dither, story told through game systems (dialog boxes with portraits, menus, battles, save files); colour depth itself is a story tool (fewer colours = older / sadder). Not CRT nostalgia: no scanlines, no grain, no bloom.
- **palette** (D, ENDESGA-32 free palette subset with roles): night `#181425`, ink `#262B44`, slate `#3A4466`, `#5A6988`, steel `#8B9BB4`, silver `#C0CBDC`, white `#FFFFFF`; UI blue `#124E89` / `#0099DB`; warm `#BE4A2F #D77643 #E4A672 #EAD4AA #E8B796`; red `#E43B44`, deep red `#A22633`, pink `#F6757A`; gold `#FEAE34 #FEE761`, orange `#F77622`; greens `#63C74D #3E8948 #265C42 #193C3E`; cyan `#2CE8F5`; plum `#68386C`, rose `#B55088`.
  - Measured (M): poster (castle) `#252B43`, `#384161`, `#70778F`, `#345882`, `#FEF8E8` (white light), `#CDC7A9`; battle frame (sunset) `#CA735E`, `#254F80`, `#412532`, `#673866`, `#B25A72`, `#1D1729`.
  - Era tables (D): 8-bit 15 colours `#000000 #FCFCFC #A4A4B8 #58587C #1C2C8C #3C7CFC #94E0FC #B8141C #FC7454 #FCB81C #8C4C1C #2C9C2C #FCD8A8 #0C4C18 #4C2410`; 4-colour `#1F2A1C #4B5E3A #93A263 #D6DBA6` (luminance thresholds < 60, < 115, < 175); faded = 7 blue-greys `#0E0D17 … #C3C9D6` via `lum^0.8 × 7`.
  - Protected (exempt from every palette effect): scarf red `#E43B44/#A22633/#F6757A`, crystal cyan `#2CE8F5/#0099DB/#FFFFFF/#124E89` — use 1–2 as a thread / match-cut colour.
- **texture / post recipe** (as a style over any motion):
  1. `pixelate {size: 6}` (1080/180).
  2. NEW `dither {matrix: 4, cell: 6, spread: 1/levels}` — ordered Bayer threshold: add `(bayer(x/cell, y/cell) − 0.5)·spread` to RGB before quantising. SVG: a 4×4 Bayer tile as a tiny data-URI PNG (`feImage` + `feTile`, scaled to `cell` px so dither matches the pixel grid), `feComposite operator="arithmetic" k2=1 k3=spread k4=−spread/2`.
  3. `posterize {levels: 5}` (16-bit era) **or** `gradientMap {discrete: true, ramp: ['#1F2A1C','#4B5E3A','#93A263','#D6DBA6']}` (4-colour era) **or** faded ramp `['#0E0D17','#2A2B3D','#4A4E66','#6F7690','#97A0B6','#C3C9D6']` (loss/present). Map by luminance with gamma 0.8, never by rank.
  4. optional NEW `selectiveColor {hue: 355, range: 15, color: '#E43B44'}` to protect one colour through era steps.
  5. no overlays (explicitly no scanlines/grain); `step: 2` for sprite feel (source: sprites 8–12 fps, camera on ones at integer pixels).
  - Differs from our `pixel-8bit` (8 px, 6-level posterise, scanlines, saturate): this is dithered, palette-table driven, scanline-free, with era ladders.
- **typography**: source uses an original variable-width pixel font (cap 7 px, x-height 5, descender 2, 1-px shadow). Closest Google Fonts: `Pixelify Sans` (dialog/body, variable width) and `Silkscreen` (UI caps/menus); `Press Start 2P` only for tiny HUD numbers (too wide for dialog). Titles: pixel font at 2×, 8-neighbour ink outline, row-by-row gradient (white → silver → steel, or gold `#FEE761` → orange `#F77622` as in the poster), Bayer-dissolved in/out.
- **motion rules**: output 24 fps; sprites 8 fps (walk) – 12 fps (flames, blinks, KO blink); camera and parallax on ones at integer pixels, each layer rounding its own offset (walk 30 px/s ≈ 1.25 px/frame at 320 res). Game-native acting: hop forward to act, cast pose, knockback, kneel, KO blink, vanish; breath = shoulders up 1 px for 0.6 s. UI windows slide in 0.3 s ease-out at integer px; hand cursor bobs 1 px at 4 fps and stops when the character hesitates; text types 38–40 chars/s (30 in 8-bit), ▼ blinks 3 Hz. Transitions: thumbnail expand + mosaic (block 10 → 1 over 0.75 s), mosaic cross (1 → 16 → 1 over 0.8 s, palette switch at peak), encounter swirl (0.8 s), screen shake 3–2–1 px over 8 frames, palette step fades (4 levels, `darken`/`whiten` quantised to 4 steps) — never alpha fades. Parallax example: far wall 0.35×, colonnade 0.7×, floor 1×, foreground pillars 1.6×.
- **signature moves**: `palette-collapse` (EXTENDS `pixel-dither`), `mosaic-swirl` transitions, `rpg-dialog-box` (EXTENDS `story-caption-box`), `rpg-menu-ui`, integer-pixel tilt up a tall structure, light as index stepping (Bayer-thresholded glow rings that move each index one step up its ramp), dithered light shafts (flat 50 % checker + 25 % edge).
- **do**: keep the floor line above the dialog box (bottom 25 %); draw low eras natively at 160×90 with 4 known indices; keep warm hues (orange, pink, plum) in reduced subsets; warm remap near fire (greens → browns → rust); give the hero a silhouette mark (scarf, cowlick); portraits carry facial acting.
- **don't**: scanlines, grain, bloom, DoF (not HD-2D, not CRT); alpha fades; rank-based palette mapping (crushes to black); post-quantising full colour to 4 shades (mud); existing game names, UI frames, fonts, melodies; negative modulo on sprite frames.
- **source**: `styles/pixel-rpg/STYLE.md`, `DEMO.md`, `demo/px.js` (LUTs, bayer, mosaic, darken/whiten), `demo/main.js` (swirl, flood, shake), `demo/ui.js`, `demo/font.js`, `demo/scenes.js`; images `poster.jpg`, `docs/frames/pixel-rpg.jpg`. MIT code + CC BY 4.0 docs; ENDESGA-32 is a free community palette.

### `palette-collapse` — EXTENDS `pixel-dither`
- look: an image or scene loses colour depth one level per beat (16-bit → 16-colour → 8-colour → 4 grey-blues → 2 tones → faded) while the frame holds still; later full colour floods back as a circle expanding from the hero with a dithered edge. One protected colour (a red scarf) never changes and match-cuts across eras.
- params: ladder `full → c16 → c8 → c4 → c2 → faded`, one step per beat (e.g. 0.5 s); subsets must keep orange/pink/plum; faded = `lum^0.8` into 7 blue-greys; flood: radius R(t) = (t/1.3 s)·360 px at 320 res (≈ full frame in 1.3 s), edge = `R − bayer8(x,y)·34` px compared against distance (ellipse y×1.1) — a dithered, not soft, edge; white flash 1 frame at the climax.
- build: new props on pixel-dither: `ladder` (array of ramps or presets `'16bit'|'c16'|'c8'|'gb4'|'c2'|'faded'`), `stepFrames`, `collapseAt`, `flood {at, frames, origin, edgeDither: 34}`, `protect` (hex list). Render two filtered copies (pre/post ramp) and blend with a mask whose luminance = step(dist, R − bayerTile·34) using an 8×8 Bayer `feImage` tile and `feComposite arithmetic` + discrete transfer (hard edge). Protect = `selectiveColor` step re-injecting the protected hues after the ramp.
- source: `styles/pixel-rpg/demo/px.js` (lutFrom, rampMap, darken/whiten), `demo/main.js` (flood at 47.5 s: `present(fb, faded, full, mask)`), DEMO.md "Palette & props" (MIT / CC BY 4.0).
- value: emotional "memory fading / colour returning" beat for any image, brand-history timelines (older = fewer colours), blackout/recovery stories, a protected brand colour carried across eras.

### `mosaic-swirl` — NEW (transitions `mosaic` + `swirl`)
- look: (a) mosaic: the frame pixelates to big blocks, the palette switches at the peak, blocks shrink back into the new scene; (b) encounter swirl: the image twists around the centre, sinking inward while pixelating, then dissolves to white through a Bayer pattern — the classic "battle start".
- params: mosaic cross block 1 → 16 → 1 over 0.8 s (swap at peak); thumbnail expand: block 10 → 1 over 0.75 s while a thumbnail rect scales to full frame. Swirl 0.8 s: s = (t/0.8)^1.6; sample angle a = atan2 + s·7·(1.2 − r/190) (r in 320-px units, ≈ r/0.59·H), sample radius × (1 − 0.35 s); mosaic block 1 + round(6 s); Bayer 50 % white from t = 0.70 s, full white at 0.85 s; follow with whiteout or cut.
- build: in `src/transitions.tsx`: `mosaic` = render outgoing/incoming through a `pixelate` filter whose size is frame-driven (feFlood-free approach already used by our `pixelate` step; filter attributes change per frame), swap at midpoint; `swirl` = `feDisplacementMap` driven by a precomputed polar-twist displacement image (generated once per resolution into a data-URI canvas: R/G encode the twist offset for unit strength), `scale` = s·maxTwist, combined with frame-driven pixelate and a final Bayer white mask (4×4 tile threshold rising 0 → 1). Props: `blocks` (max), `twist` (turns), `toWhite` (bool), `origin`.
- source: `styles/pixel-rpg/demo/main.js` (encounter swirl 25.4–26.2 s, mosaic cross, thumbnail expand), `demo/px.js` `mosaic` (MIT / CC BY 4.0).
- value: game trailers, "entering a memory/flashback", danger/deadline hits, retro product reveals; pairs with any pixel style.

### `rpg-dialog-box` — EXTENDS `story-caption-box`
- look: a game text window at the bottom quarter: layered rounded border (ink / white / silver), dithered blue → navy → night fill, a 32×32 portrait on the left with expression overlays, pixel text typing with per-character blips, a blinking ▼ when done; a thin top window for system/battle messages ("X used Y"). Skins follow the era (light box for 4-colour, black box with white frame for 8-bit, blue for 16-bit).
- params: native box y 134–176 of 180 (scale ×6), portrait 32×32 px (3/4 view; neutral, wistful, smile, sad, resolve overlays), text white with 1-px night shadow, 38–40 chars/s (30 in 8-bit), ▼ 3 Hz; window slide-in 0.3 s ease-out integer px; hold ≥ max(1.8 s, speech + 0.6 s); next box cuts the previous.
- build: add `variant: 'rpg'` to story-caption-box: render at native 320×180 in an SVG with `shape-rendering="crispEdges"` and `image-rendering: pixelated` scaling; border = 3 nested `<rect rx>` strokes; fill = vertical ramp quantised with a Bayer `<pattern>`; text in `Pixelify Sans` (or a supplied bitmap font) with chars = floor(cps·t); emit `blip` sound cues per char (pitch per speaker); `skin: 'gb'|'nes'|'snes'`, `portrait` (src or built-in box-bot face), `expression` timeline, `topWindow` items.
- source: `styles/pixel-rpg/demo/ui.js`, `demo/font.js`, `demo/portraits.js`, DEMO.md "Titles, subtitles & end card" (MIT / CC BY 4.0).
- value: captions/subtitles for game-themed explainers, nostalgic brand stories, dev-humour content; existing captions get a full retro skin.

### `rpg-menu-ui` — NEW
- look: game systems as narration: command menus (FIGHT / ITEM / MAGIC / RUN) with a bobbing hand cursor, a party status window with HP bars ticking down (red when low), a greyed-out party member, a save-file list (choosing NEW FILE rather than overwriting), a level-up screen where stats rise with a fanfare, an item-get box.
- params: windows slide in 0.3 s ease-out (integer px); cursor bob 1 px at 4 fps, freezes during "hesitation" spans; HP tick-down ~ 1 value per frame or eased over 0.5 s with a low-HP colour `#E43B44`; KO blink 12 fps; stat rise digit roll + fanfare cue; save-slot list with selection highlight; blue window skin (fill `#124E89 → #262B44` dithered, border ink/white/silver).
- build: SVG at 320×180 native, crisp edges, scaled ×6. Components: `Window {x,y,w,h,skin}`, `Menu {items, cursorAt[], hesitate[]}`, `StatusRows {name, hp, hpTo, maxHp, dimmed}`, `SaveSlots {slots, selectAt, choose}`, `LevelUp {stats from→to}`, `ItemGet {icon, label}`; timeline-driven (frame → state). Sound cue events: cursor, select, error buzz, HP tick, fanfare. Props: `screens[]` (sequence of windows with timings), `skin`, `font`, `accent`, `background` (any motion behind, e.g. `pixel-dither` image).
- source: `styles/pixel-rpg/demo/ui.js`, `demo/main.js` (menus, battle UI timing), STYLE.md §8 "Game UI as narration", DEMO.md (MIT / CC BY 4.0).
- value: "level up" product/skill announcements, comparison as a stat screen, career/version histories as save files, playful UI for game studios and dev content.

---

## risograph

### style `risograph` — Risograph Print (three-plate overprint) — EXTENDS our existing style `risograph`
Our current `risograph` = gradientMap pink/blue + posterize 5 + one misregister + grain. The lemo recipe is a true multi-plate print model; propose upgrading `risograph` to it (or adding `risograph-3ink` and keeping the old one as `riso-duotone`).
- **essence**: each colour is its own translucent spot-ink plate printed one at a time on warm paper: 2–3 inks, overprints multiply into extra colours, mid-tones as angled halftone dots, solids with pinholes and feed streaks, and plates that never quite line up. Flat shapes, no outlines; a small figure in a big flat world.
- **palette** (D): paper `#F6F1E6` (demo) / `#F4EEE2` (STYLE); Blue `#0078BF` (screen 15°), Yellow `#FFE800` (0°), Fluorescent Pink `#FF48B0` (75°). Overprints: Blue+Yellow = green, Blue+Pink = violet/indigo, Yellow+Pink = orange-red, all three ≈ near-black; 60 % Blue dots over solid Pink = purple. Alternative ink sets (D): Teal `#00838A` + Fluo Orange `#FF7477`; Federal Blue `#3D5588` + Red `#FF665E` + Sunflower `#FFB511`.
  - Measured (M): pink disc `#DF579E`/`#EF5D9D`, yellow `#D8D033`/`#F4E159`/`#F4DC21`, blue+pink overprint `#373F86`/`#534C7D`, blue+yellow green `#789972`/`#89A25F`, yellow-tinted paper `#F4ECC6`/`#F4EDC4`, Y+P orange `#DC7D72`, B+P violet `#884A93`.
  - roles: bg/paper `#F6F1E6`; ink `#0078BF`; accent `#FF48B0`; accent2 `#FFE800`; mixes as swatches.
- **texture / print recipe** — NEW FilterStep `risoPlates`:
  `{type:'risoPlates', inks:[{color:'#0078BF', angle:15},{color:'#FFE800', angle:0},{color:'#FF48B0', angle:75}], paper:'#F6F1E6', period:7, solidAt:0.9, grain:0.08, pinholes:0.93, streak:0.14, blot:0.08, boil:0.35, offsets:[[0,0],[3,-2],[-3,2.5]]}`
  Algorithm (SVG-feasible): (1) **separation**: plate densities from the source by inverting the multiplicative ink model `pixel = paper · Π mix(1, ink_i, d_i)` → in log space `log(pixel/paper) = Σ d_i · log(ink_i)`; approximate log with an `feComponentTransfer` table (16 entries), then an `feColorMatrix` with the precomputed 3×3 inverse (JS at style build), clamp 0–1. (Cheap fallback for the default inks: d_blue ≈ 1 − R, d_pink ≈ 1 − G, d_yellow ≈ 1 − B with light cross-terms.) (2) **per plate**: isolate channel i, `feOffset` by its registration offset (+ tiny rotation ignored in SVG); (3) **halftone**: `feImage` of a pre-rendered dot-screen tile (spot = 1 − (cos 2πu + cos 2πv + 2)/4 on a grid rotated to the plate angle, period 7 px at 1080p), threshold `cov = smoothstep(spot − 0.07, spot + 0.07, 1.06·d)` approximated with `feComposite arithmetic` (k2 = 8, k3 = −8, k4 = 0.5) + clamp; densities ≥ 0.9 forced solid; (4) **ink grain**: `feTurbulence` fractalNoise (baseFrequency ≈ 0.9) added to the threshold ±0.08, seed changes every 2 frames with 35 % boil (mix a sheet-static noise with a per-print noise); **pinholes** where noise > 0.93 (coverage ×0.75); **density** `k = 0.80 + 0.14·streak + 0.08·blot` with streak = turbulence stretched along the feed (`baseFrequency="0.025 0.0022"`) and blot = very low frequency (0.004), sheet noise re-seeded only at cuts; (5) **composite**: for each plate `layer_i = mix(white, ink_i, cov_i·k)`; `feBlend mode="multiply"` the three layers over `feFlood paper`; paper fibre ±1.5 %. Dots are anchored to the screen (a pan slides the image under a fixed screen).
  NEW overlay/driver `registration {base:[[0,0],[3,-2],[-3,2.5]], perShotJitter:3, kicks:[{frame, amp}], drift:{from, to, vectors}}` — fixed offsets per shot (re-rolled only at cuts); kick `e = exp(−11x)·cos(34x)` over 0.5 s with amp 8–14 px (plate 0 at half amplitude, random direction per plate); drift: smoothstep up to ~25 px (example vectors (−6,5), (24,−13), (−22,15)) through a held bar, snapping back with `exp(−16x)·cos(40x)` on the downbeat.
  Also `gate[i]` (plate present 0/1) and `sweep[i]` (roller reveal x) — see `riso-plate-reveal`. `step: 2` for drawn content; camera on ones. No film grain at mux (the print is the grain).
- **typography**: Bricolage Grotesque 800 (titles, ~190 px), Jost 500–700 (captions ~40–46 px). Both Google Fonts. Type lives on one plate (misregisters and grains with it); title double-hit = same text on two plates offset ~10 px.
- **motion rules**: characters on twos (12 fps), camera on ones; registration static within a shot, kicks on accents, drift during a held moment, snap on the downbeat; grain boils ~1/3 per print; streaks/blots change only at cuts; simple cycles (pigeon flap 4 frames on twos, pedal crank from wheel travel), secondary motion as travelling sine. Prints don't fade: titles arrive by roller wipe or on a beat and leave on a cut. Transitions: overprint growths, roller sweeps, shape match cuts, hard cuts on beats — never cross-dissolves or soft digital wipes.
- **signature moves**: `riso-plate-reveal` (plates as narrative), `riso-overprint-wipe`, `knockout-halo`, registration kick/drift, halftone scale push (dots become shapes), title double-hit, per-plate reflection wobble in water (each plate own phase, separation 14 px·(i−1)).
- **do**: max two plates per area, at most one as a tint; stepped halftone bands (20 / 38 / 62 / 100 %); skin = light tint of the palest ink; every main colour contains some of plate 1 so a one-ink frame still reads; paper-white knockout strips for subtitles (6 px radius); save the full three-ink overprint for the moment that earns it.
- **don't**: three halftones stacked (mud); per-frame registration jitter (flicker, huge files); pure white paper; outlines/keylines; CMYK pop-art look; the RISO brand/logo/machine; JPEG 4:2:0 frames (encode from PNG/yuv444, `-tune grain`).
- **source**: `styles/risograph/STYLE.md`, `DEMO.md`, `demo/riso.js` (WebGL print shader), `demo/film.js` (regist, plates), `demo/draw.js` (ink densities, over, layer halo); images `poster.jpg`, `docs/frames/risograph.jpg`, `demo/stills/modelsheet_v2.jpg`. MIT code + CC BY 4.0 docs.

### `riso-plate-reveal` — NEW
- look: a scene printed one ink at a time: at first only the blue plate exists (complete silhouette world); at a turning point a roller sweeps across and the yellow plate inks in left→right with a slightly heavier band at its edge — objects that were blank paper (a scarf) light up first; later the pink plate arrives and every overprint colour appears.
- params: gate per plate (0/1 at its arrival frame); sweep x(t) = lerp(−60, W + 200, easeInOut(seg(t, a, a + 0.55 s))); reveal = 1 − smoothstep(−5, 5, x − sweep); edge band = exp(−((x − sweep)/22)²)·0.45 extra ink where density > 0; arrivals on beats (demo 0 s, 8 s, 16 s); a plate kick on arrival.
- build: as a motion wrapper (`riso-print` image/scene motion) or as `risoPlates` options: per-plate `mask` = horizontal gradient with soft edge at `sweep(frame)`; band = a Gaussian strip added to that plate's coverage; `gate` multiplies plate i to 0 before arrival. Props: `src` (image) or `children` (scene), `inks`, `arrivals[{plate, at, sweepFrames, from:'left'|'right'}]`, `kickOnArrival`, `registration`, `period`, `paper`.
- source: `styles/risograph/demo/riso.js` (uGate, uSweep, band), `demo/film.js` `plates()`, STYLE.md §8 "Plates as narrative" (MIT / CC BY 4.0).
- value: brand/product reveals where a new colour = a new feature, history timelines (one ink per era), "colour returning" recoveries; a distinctive title/print intro for zines and indie brands.

### `riso-overprint-wipe` — NEW (transition `overprint`)
- look: a flat shape of one ink (disc, blob, the next scene's key shape) grows from a point over the frame; everything beneath turns into the overprint mix colour; at full cover the next scene is underneath and the shape shrinks into that scene's own key shape (a sun disc, a pin).
- params: grow ≈ 10–14 frames ease-in-out, hold 2 frames, shrink to the target shape's position/size ≈ 10 frames; multiply blend (ink over existing ink = darker mix); registration kick on the cover frame.
- build: transition type `overprint` in `src/transitions.tsx`: an SVG shape (circle or path prop) filled with the ink colour, `mix-blend-mode: multiply`, scaled by p; outgoing scene shown until p = 1, incoming after; for the shrink half, interpolate transform from full-cover to `targetRect`. Props: `ink`, `shape` (`disc` | path d), `origin`, `target {x,y,r}`, `kick`.
- source: `styles/risograph/STYLE.md` §8 "Overprint transition", §6 (MIT / CC BY 4.0).
- value: print-feel scene changes for any two-scene edit; match cuts on shapes (spotlight → moon, pill → planet).

### `knockout-halo` — EXTENDS `mix`
- look: subjects carry a 4–5 px paper-white rim (zero ink) separating them from busy backgrounds; because plates misregister, the rim picks up coloured fringes like a real print trap.
- params: halo 4–5 px; 12 stamps around a ring; stamp = subject silhouette with `brightness(0)` then mapped to paper colour (or zero density in the plate model).
- build: new per-layer option in `mix`: `halo {size: 5, color: paper, stamps: 12}` — render the layer 12 times offset on a circle of radius `size` with `filter: brightness(0) invert(...)`/flood to paper colour, then the layer on top; must inherit the layer's transform (zoomed shots). With `risoPlates` the halo is genuine zero ink, so registration offsets create fringes automatically.
- source: `styles/risograph/demo/draw.js` `layer(fn, halo)`, STYLE.md §2 composition rules (MIT / CC BY 4.0).
- value: legibility of any subject/text over busy backgrounds in print styles (also useful for papercut, comic-halftone, woodcut).

### `registration-kick` — EXTENDS `comic-halftone`
- look: the colour plates jolt apart on accents and ring back into register; through a held, silent bar they slowly drift apart into a dizzy ghosted image, then snap back on the downbeat with a click.
- params: kick amp 8–14 px, `exp(−11x)·cos(34x)`, 0.5 s; drift ~25 px max with smoothstep, snap `exp(−16x)·cos(40x)`; base offsets fixed per shot (±1–3 px).
- build: comic-halftone already has `misregister`; add `kicks[{frame, amp}]`, `drift {from, to, amount}` and per-plate random directions (seeded); expose the same driver to the style engine (`registration` overlay animates `misregister`/`risoPlates` offsets by frame).
- source: `styles/risograph/demo/film.js` `regist()` (MIT / CC BY 4.0).
- value: beat-synced print energy on music cues; nerves/dizziness/memory-focus moments.

---

## rubber-hose

### style `rubber-hose` — 1930s Rubber Hose Cartoon
- **essence**: hand-inked black-and-white early-sound cartoons: noodle limbs, white four-finger gloves, pie eyes, balloon squash and stretch, soft grey watercolour backgrounds, and a world where every object breathes to a hot jazz band — shown as a worn 35 mm print in a rounded 4:3 gate.
- **palette** (strict greyscale): paper `#F1EEE6`, light `#C8C5BC`, mid `#9A978F`, dark-mid `#6B6963`, dark `#3B3A37`, ink `#0E0D0C`, character white `#FCFBF7` (D); backgrounds pushed to mid: walls `#8C8981`, tiles `#A29F97`, cabinets `#66635D`–`#7C7972` (D). Measured (M): pillarbox `#000000` (27 %), `#817E76`, `#959289`, `#65635D`, `#3C3B37`, `#BCBAB2`, `#ECEBE9`; saturation 0 %. Roles: bg `#8C8981`, paper `#F1EEE6`, ink `#0E0D0C`, accent `#FCFBF7` (character white), accent2 `#000000` (gate).
- **texture / post recipe**:
  1. `saturate {value: 0}` then `gradientMap {ramp: ['#0E0D0C','#3B3A37','#6B6963','#9A978F','#C8C5BC','#FCFBF7']}` (continuous; warm greys — swap for cool silver-nitrate or faint sepia, one per film).
  2. `contrast {value: 1.14}` (rich black, bright white); `blur {radius: 0.55}`.
  3. `wobble {scale: 1.2, frequency: 0.02, boil: 3}` — line boil ±1.2 px, 3 drawings cycling at 12 fps (source: resample every 7 px, displace along normal by 1D value noise `0.8·n1 + 0.35·n2`; backgrounds never boil — apply only to the character layer when possible).
  4. NEW overlay `filmGate {aspect: 4/3, radius: 28, color: '#000', innerShadow: {width: 14, blur: 6, opacity: 0.55}}` — 1440×1080 centred gate with rounded corners.
  5. NEW overlay `filmDamage {weave: 1.2, jumpChance: 0.015, jumpPx: 5, flicker: 0.04, scratches: 3, dust: [3, 8], hairChance: 0.18, cutJump: 3}` — per-frame deterministic (hash of frame): weave = low-freq noise ±1.2 px (x 2.4·(n−.5), y 2.6·(n−.5)) + rare 3–6 px jump; flicker = (hash − .5)·0.08 + (noise − .5)·0.04 as white/black overlay; 0–3 vertical scratches (light `rgba(245,242,230,.5)` or dark `rgba(10,10,8,.45)`, 0.8–2.2 px, re-rolled every ~0.43 s, wiggling ±6 px); 3–8 dust specks per frame (ellipses 0.8–3.6 px, 65 % dark); a hair (8-segment wavy polyline) ~18 % of 0.67-s windows; 3 px vertical jump on every cut.
  6. `vignette {amount: 0.62}` (radial 380 → 900 px: 0 → 18 % → 62 %), `filmGrain 0.03`. `step: 2`.
- **typography**: titles Shrikhand (white face, ink outline ~14 % of cap height, ink drop shadow down-right, letters hopping in a travelling wave on the beat over a rotating sunburst); sub-lines Limelight caps; subtitles IM Fell English SC ~36 px paper-white on a near-black title-card plate `rgba(12,11,10,.92)` with white double-rule border and dot-and-ring corners. All Google Fonts.
- **motion rules**: characters on twos, camera on ones. Tempo where one beat = an even number of frames at 24 fps (demo 144 BPM = 10 frames). Breathing: every idle object scaleY `1 + b·a`, scaleX `1 − 0.6·b·a`, `b = cos(2π·beats)` sampled on twos, a = 0.04–0.07, all in phase, anchored at the floor; joy peak ×3 and the whole background squashes ~2.5 % around the floor line. Walk: one step per beat, bob 10 px (sad: steps 34, bob 4). Run: windmill legs, lean 0.24 rad, speed lines. Anticipation (squash to 0.8) – hold (band stops) – snap; impacts squash with exponential spring-back. Held frames are acting (glances on eighth notes). Freeze everything (incl. breathing) on a band stop. Transitions: iris (grabbable), hard cut on a beat, title card rolling up like a window shade — no dissolves.
- **signature moves**: `beat-breathe` (EXTENDS `mix`), `toon-object-character`, `bouncing-ball-singalong`, `grab-iris`, `old-film-gate` (EXTENDS `film-look`), sunburst title, rubber-hose stretch reach, transformation (tail → question mark).
- **do**: characters own the extremes (pure white + ink), backgrounds in mid greys; medium shots so gags read; the destination prop enters frame before the gag; mood carried by a secondary feature (steam, flame, spring); constant screen-space ink (~6 px at 1080p) at any zoom; outline the union of glove parts only.
- **don't**: colour of any kind (incl. in film damage); joints/elbows; rendered gradients (one hard light-grey form-shadow band only); wide shots for gags; boiling backgrounds; existing cartoon characters, the "cup-head on a human body with a straw" design, period racial caricature.
- **source**: `styles/rubber-hose/STYLE.md`, `DEMO.md`, `demo/film.js` (gate + damage), `demo/toon.js` (screen-space ink, boil), `demo/chars.js` (pie eyes, gloves, shoes, steam, mug), `demo/cast.js` (breathing props), `demo/story.js` (beat grid); images `poster.jpg`, `docs/frames/rubber-hose.jpg`. MIT code + CC BY 4.0 docs.

### `beat-breathe` — EXTENDS `mix`
- look: every prop and layer in the scene squashes and stretches in unison with the music — stretched on the beat, squashed on the off-beat, stepped on twos — so the whole world dances; at a peak the amplitude triples and even the background painting bounces around the floor line; on a band stop everything freezes.
- params: `b = cos(2π · beats(q(t)))` with q = quantise to twos; scaleY = 1 + b·a, scaleX = 1 − 0.6·b·a; a = 0.04–0.07 (default 0.06), peak ×3, background 0.025; pivot at the layer's bottom centre; freeze windows hold the last value.
- build: per-layer `breathe {amp, bpm | beatFrames, phase, onTwos: true, pivot: 'bottom', peak: [{from, to, mult}], freeze: [{from, to}]}` in `mix`; implemented as a CSS transform on the layer wrapper computed from frame. Also a global `world` breathe for the backdrop layer.
- source: `styles/rubber-hose/demo/story.js` (breath, beat grid), `demo/cast.js` (breathe scale), STYLE.md §5 (MIT / CC BY 4.0).
- value: instantly music-synced scenes from existing motions (sign-drop, box-bot, props); kids/retro ads; any beat-driven social clip.

### `toon-object-character` — NEW
- look: an everyday object (mug, toaster, box, bottle, product) becomes a 1930s cartoon character: the whole object is the body, pie eyes and a big mouth on its front, noodle arms and legs with white four-finger gloves and huge round shoes, black outlines that boil slightly; a secondary feature (steam, flame, spring) carries the mood.
- params: limb width ≈ 1/20 of character height (13 px on 280 px), one smooth bend, round caps; ink 6 px screen space; boil ±1.2 px, 3 drawings at 12 fps; pie eye pupil ≈ 64 % × 74 % of the eye with a wedge cut toward upper right, blink = body-colour lid + lid line; glove = palm + 3 fat fingers + thumb, flared cuff with fold line, 3 stitch lines on the back; shoes = black ovals with white toe glint; mouths: smile with cheek ticks, open grin, O, wavy (scared), pucker, tongue-out; brows defined by inner/outer end; box objects = projected 3D shape viewed slightly from above (elevation ≈ 0.26 rad), face affine-mapped onto the front face; one hard light-grey form-shadow band away from an upper-left light; steam types: lazy waves / bitter zigzag / straight-up alarm / wilted droop / heart.
- build: SVG character kit (alongside `src/core/character-kit.tsx`): `body` presets (`mug`, `box3d`, `bottle`, `can`, `custom` path or `src` silhouette), `face {eyes, mouth, brows}`, limbs as quadratic noodle paths from shoulder/hip anchors to hand/foot targets (IK-free: control point = midpoint + perpendicular·bend), gloves/shoes as symbols; boil = displace sampled path points along normals with seeded noise keyed to floor(frame/2) % 3; actions via a script like box-bot (`walk`, `run` windmill, `anticipate`, `hop`, `reach` stretch, `point`, `cheer`); everything breathes via `beat-breathe`. Props: `body`, `color` (greyscale or brand), `expression` timeline, `steam`, `script`, `bpm`, `boil`, `onTwos`.
- source: `styles/rubber-hose/demo/chars.js` (pieEye, brow, mouth, glove, shoe, steam, mug), `demo/toon.js` (noodle, boilPts, constant ink), STYLE.md §2 anatomy kit (MIT / CC BY 4.0).
- value: product mascots from the host's own product shape (mug, bottle, phone), retro ads, kids content; a second character family beside `box-bot`.

### `bouncing-ball-singalong` — NEW
- look: lyrics/slogan words on a period title card; a white ball hops from word to word exactly on the beat, squashing as it lands, each word lighting up as the ball touches it — the classic cinema singalong.
- params: one hop per beat (or per syllable cue list); parabolic arc between word centres, apex ≈ 0.6 × word spacing above the baseline (min 0.08·H); landing squash scaleY 0.75 / scaleX 1.2 for 2 frames, spring back; ball ≈ cap height × 0.45; touched word fills from paper-white outline to solid (or brightens 100 % from 55 %); card plate `rgba(12,11,10,.92)`, white double-rule border, dot-and-ring corners; text IM Fell English SC or Limelight caps.
- build: text laid out in SVG with measured word boxes (`getComputedTextLength` at render is non-deterministic → use a fixed-width estimate table or Remotion `measureText`), hop timing from `cues[{word, frame}]` or `bpm`; ball position = lerp x, y = baseline − 4h·p·(1−p); lit state by index; props: `lines`, `cues` | `bpm`, `ballColor`, `cardStyle` (`period` | `modern`), `font`, `highlight` style, `backdrop`/`src`.
- source: `styles/rubber-hose/STYLE.md` §8 "The bouncing-ball singalong", §4 title cards (MIT / CC BY 4.0).
- value: jingles, slogans, safety rhymes, karaoke captions, kids learning content; works over any backdrop motion.

### `old-film-gate` — EXTENDS `film-look`
- look: the picture sits in a rounded 4:3 gate inside black pillars, weaving slightly with a rare jump, flickering, with drifting vertical scratches, dust specks, an occasional hair, a strong vignette and a small jump on every cut.
- params: as `filmGate` + `filmDamage` above (weave ±1.2 px, jump 3–6 px at ~1.5 %, flicker ±4 %, ≤ 3 scratches, 3–8 dust, hair ~18 %, vignette 62 %, blur 0.55 px, contrast 1.14).
- build: add props to film-look: `gate: '4:3' | 'none'`, `gateRadius`, `scratches`, `dust`, `hair`, `flicker`, `cutJumps[]` (frames), `monochrome`; implement as the two new style overlays so every motion can use them.
- source: `styles/rubber-hose/demo/film.js` (MIT / CC BY 4.0).
- value: vintage/archival looks for any motion or image (history explainers, retro ads, silent-film jokes).

### `grab-iris` — EXTENDS transitions (`iris`)
- look: the scene closes to a circle that a gloved cartoon hand grabs at the edge and pulls shut (or drags open); alternative: a title card rolls up like a window shade to reveal the next scene.
- params: iris close ~12 frames ease-in, hand enters 4 frames before, pull overshoot 1 frame; shade roll ~10 frames with a roll cylinder shadow.
- build: `iris` gets `variant: 'grab'` (draw glove symbol from `toon-object-character` riding the circle edge at a fixed angle) and `page-turn` `roll` variant reused for the shade-roll card. Props: `hand: true`, `handAngle`.
- source: `styles/rubber-hose/STYLE.md` §6/§8 "The film is a physical object" (MIT / CC BY 4.0).
- value: playful endings/chapter breaks in retro or kids content.

---

## satellite-briefing

### style `satellite-briefing` — Satellite Briefing (analyst grade + measurement hairlines)
- **essence**: real licence-clean satellite imagery graded down to an analyst's grey, with thin white measurement marks anchored to the ground (lock-on reticle, outlines, a range line, one reading in a single amber accent); one continuous zoom from orbit to ground; time runs inside a locked frame via soft scan fronts; true colour returns only where the story turns.
- **palette**: ground ramp `#070B0E → #A1A7A9` (D; ≈ 3–65 % value, white is reserved for marks); marks `#F2F5F6` with dark halo `rgba(3,6,8,.45–.82)` (D); reading amber `#FFBE55` (D); claim/map blue `#2E70CE` (rgb 46,112,206) (D); printed-map layer: paper `#ECE2CB`, sea `#8CB5DB`, coast ink `#1A3B6B`, waterlines `#456BB3`-ish (vec3 .27,.46,.70), name `#1F3F6B` on page / `#D6EAFF` over sand (D); space `#030506` (D). Measured (M): `#414342`, `#4F5251`, `#454847`, `#848683`, `#90948F`, `#9EA29D`, `#292D2C` — neutral greys, saturation ≈ 0 with faint residual brown chroma (`#9C7D49`, `#7C6743`) from the 22 % chroma kept. Roles: bg `#414342`, paper `#070B0E`, ink `#F2F5F6`, accent `#FFBE55`, accent2 `#2E70CE`.
- **texture / post recipe** ("analyst grade", applicable to any image motion):
  1. NEW `clarity {radius: 40, amount: 0.4, detail: 0.8}` — local contrast: L' = m3 + (L_detail − m3)·(1 + amount), where L_detail = L + detail·(0.7·(L − blur_s) + 0.45·(blur_s − blur_m)) and m3 = wide blur. SVG: `feGaussianBlur` at 3 radii on luminance, `feComposite arithmetic` chains.
  2. Shoulder + toe via `feComponentTransfer` table on luminance: d = clamp((L − 0.05)/0.85); d = (1 − e^(−1.9d))/(1 − e^(−1.9)); d = 0.3·smoothstep(d) + 0.7·d; d = d^1.12; then contrast around 0.5 — salt, snow and cloud stay below white.
  3. `gradientMap {ramp: ['#070B0E','#A1A7A9']}` (continuous; optionally a 3rd stop `#4F5251` at 0.45) — blue-black → cool silver.
  4. NEW `chromaKeep {amount: 0.22}` — add back 22 % of source chroma: `out = grey + 0.22·(src − luma(src))` (feColorMatrix = I − luma rows on SourceGraphic, scaled; `feComposite arithmetic` add).
  5. NEW `selectiveColor` in mask mode `{mask: circle|path, amount, lift: [0.85, 1.15, 1.25]}` — colour returns only inside the subject region (water lifted slightly blue).
  6. overlays: `vignette 0.35`, `filmGrain 0.02`; no paper. `step: 1` (camera never stops; no stepped motion).
- **typography**: reading Barlow Condensed 300, 96–130 px (unit at 0.36×); instruments/dates IBM Plex Mono 20–34 px; labels a sans in the film's language 24–42 px (Noto Sans SC / Barlow 500); serif only for the claim map and title (Noto Serif SC / any OFL serif, e.g. Source Serif 4). All Google Fonts. Nothing below 20 px at 1080p (credit included).
- **motion rules**: camera distance interpolates in log space; segments ease; holds keep a 2–5 % creep or slow rotation; never a frozen frame > 1 s. Marks arrive by being made: lines grow, outlines print behind the scan, counters roll and land with a small pop, reticles snap with overshoot. Time changes are soft scan fronts (N → S forward, S → N rewind), never dissolves; the camera accelerates as scan spacing shortens and brakes 0.3 s on the last. Whip pans with directional blur only (~280 km in 0.6 s). Never moving: annotations relative to ground, instrument positions. Subject fills ~1/3 frame height at key moments; reading in the right third; transcript strip bottom-left (2 px white rule, dark plate fading right, single-line cues); instruments in corners (altitude top-right, scale bar + imagery credit bottom-right).
- **signature moves**: `time-rings`, `range-line` (EXTENDS `map-route`), `lock-on-reticle` (EXTENDS `science-reticle`), `orbit-dive` (EXTENDS `powers-of-ten`), transition `scan` (+ printed-map tear), colour-returns-where-the-story-turns (`selectiveColor` mask), reticle opening into the end-card frame, rolling reading (`number-counter`).
- **do**: real, licence-clean imagery only (USGS Landsat, NAIP, NASA Blue Marble/MODIS/VIIRS, EOX 2016 CC BY; credit burned in); one finding per screen; white means measured; keep a FACTS file for claims; dry-season / same-date mosaics; local contrast only at close range.
- **don't**: false-colour ramps, glowing sci-fi chrome, invented UI, slides/header bars, crossfades between places, hard cuts inside a zoom, AI-generated imagery as evidence, Google/Bing/Esri/Mapbox/Planet/Maxar imagery.
- **source**: `styles/satellite-briefing/STYLE.md`, `DEMO.md`, `demo/engine.js` (plate shader, samp/clarity, grade, scan fronts, printed map), `demo/overlay.js` (hair, brackets, readout, subtitle strip), `demo/film.js`; images `poster.jpg`, `styleboard/img/satellite-briefing_0.jpg`, `demo/stills/styleframe.jpg`. MIT code + CC BY 4.0 docs (imagery in the repo has its own public-domain/CC terms per CREDITS — don't copy plates).

### `time-rings` — NEW
- look: a locked top-down image of one place; soft scan passes sweep down the frame one after another, each swapping in an older/newer dated image and leaving that date's outline as a thin white ring with a small year label; the band lost between two rings flashes; a light runs along the newest outline; an amber reading in the right third rolls (dim while rolling) and lands bright ("7 %"). Everything outside the subject is dimmed.
- params: 4–8 dated plates; ring spacing accelerating then braking (demo 1.8 / 1.2 / 0.9 / 0.6 / 0.9 s), camera creep 980 → 600 km and 0 → −15° rotation on an accelerating curve, braking in 0.3 s; scan front soft (≈ 36 px feather) with a trailing glow swath (exp falloff ~70 px, 10 % white); outline hairline 1.2–2.6 px `#F2F5F6` + 3 px dark halo; newest ring heavier; dim outside the subject 40–55 %; reading Barlow Condensed 300 112 px amber, label above (sans), source note below (mono 55 %), underline rule; labels ≥ chars/4.5 + 1.5 s.
- build: SVG/HTML over images. Layers: stacked `<img>` per date (same grid), each revealed by a `<mask>` with a vertical linear gradient whose edge position = scanY(frame) (soft edge); glow = a blurred horizontal band rect following scanY with `mix-blend-mode: screen`; rings = `<path d>` per date (outline in image coords; supplied by host or traced from a mask offline), drawn with `strokeDashoffset` progress tied to scan crossing (clipPath above scanY) and a dark-halo duplicate stroke beneath; lost band flash = fill-rule evenodd between ring k and k+1 at 25 % white for 6 frames; light run = short bright dash animating along the newest path (`strokeDasharray` moving offset); reading via `number-counter`. Grade via the style's filter chain on the image layer only (marks stay white). Props: `plates[{src, date, outline}]`, `spacing[]`, `direction` (`forward`|`rewind`), `subject` (path for dimming), `reading {label, from, to, unit, note}`, `accent`, `grade` (on/off), `creep {scaleFrom, scaleTo, rotate}`, `labels` (year labels on rings).
- source: `styles/satellite-briefing/demo/engine.js` (uScan/uGlow fronts), `demo/overlay.js` (hair, readout), `demo/film.js`, DEMO.md shot 5 (MIT / CC BY 4.0).
- value: any before/after-over-time story on images — glacier retreat, city sprawl, construction progress, deforestation, a product's growth on a map, even non-geo (a photo series of a building site); one of the strongest "evidence" moves.

### `range-line` — EXTENDS `map-route`
- look: over imagery, a target is marked, then a ticked 4 px line grows from A to B with a reticle and a rolling "km" value riding its tip; the camera chases the tip, then pulls back to show the whole distance; a lit corridor along the line, the rest dimmed; the reading lands as the narrator says it.
- params: line 4 px white + halo; minor ticks every 10 units, numbered every 50; grow ≈ 1.8 s eased, camera lens shift follows the tip (e.g. −700 → +60 px) then pull-back ≈ 2.4× ; corridor width ~8 % frame, outside dim 45 %; reading lands with a 1.06 pop; local contrast raised for that range.
- build: map-route gains `mode: 'range'` with `from`, `to` (px or lat/lon with an image bbox), `unitsPerPx`, `tickMinor`, `tickMajor`, `chase` (camera follows tip via transform on the whole stage), `pullBack`, `corridor`, `reading {label, unit}`, `backdrop: 'image'` (src + analyst grade) instead of the illustrated paper map. Tip label = `number-counter` style rolling value.
- source: `styles/satellite-briefing/demo/film.js` (shot 8), `demo/overlay.js` (tick, readout), STYLE.md §8 "The range line" (MIT / CC BY 4.0).
- value: "how far" stories — shoreline moved, delivery distance, commute, distance between two offices; also measuring any dimension on a product photo.

### `lock-on-reticle` — EXTENDS `science-reticle`
- look: four thin corner brackets search across an image (wandering), then snap onto a target with a small overshoot and a ping; a label with a leader line attaches to the ground; later the brackets open out to frame a title card or the final reading.
- params: brackets len 26 px, width 1.6 px + 2.4 px halo; search ≈ 0.6 s low-frequency wander; snap spring (overshoot ~8 %, settle 6 frames); lock ping sound cue; open-to-frame ≈ 0.5 s ease-out to a target rect.
- build: science-reticle gains `mode: 'lock'`: bracket rect position = searchPath(frame) until `lockAt`, then spring to target; size shrinks from 1.6× to target size; `openTo {x,y,w,h, at}` animates the four brackets to a frame rect which then hosts text (title/end card). Props: `target`, `searchFrames`, `lockAt`, `overshoot`, `label`, `openTo`, `color`.
- source: `styles/satellite-briefing/demo/overlay.js` (brackets), DEMO.md shots 1/6/12 (MIT / CC BY 4.0).
- value: pointing at anything in an image/video (feature callouts, investigations, sports analysis), and a clean end-card frame.

### `orbit-dive` — EXTENDS `powers-of-ten`
- look: one continuous zoom from orbit (limb of the Earth, oblique) down to the ground, tilting to nadir, built from nested image plates whose finer detail dissolves in as the camera descends, with an altitude readout and a scale bar driven by the same camera; can climb back out at the end.
- params: distance interpolated in log space (e.g. 3,800 → 160 km), tilt 55° → 0°, accelerate then brake; plates nested world → region → detail with feathered edges (inside() feather ~5–10 % of plate size); altitude readout mono top-right ("590 km"), scale bar bottom-right with round numbers; credit line always visible ≥ 20 px.
- build: 2D version: stacked `<img>` plates positioned by their bbox in a shared world coordinate; camera scale = exp(lerp(log a0, log a1, ease(p))); each plate opacity = smoothstep by on-screen pixel density (fade in when its resolution exceeds the parent's) × edge feather mask; optional orbit start via three.js sphere with an equirectangular world texture and atmosphere rim, handing off to the 2D stack at ~nadir. powers-of-ten gains `images[{src, bbox}]`, `altitude` readout, `scaleBar`, `tilt` keyframes, `grade` (analyst) and `creep`.
- source: `styles/satellite-briefing/demo/engine.js` (makeCamera, nested plates, ray–sphere globe), STYLE.md §2/§6 (MIT / CC BY 4.0).
- value: "where is this" openers for travel, real estate, climate and news explainers; scale reveals in any brand film using the host's own imagery.

### `scan-swap` — NEW (transition `scan`)
- look: a satellite pass — a soft, feathered horizontal front (never a hard line) with a faint glowing swath behind it — sweeps down the frame, swapping scene A for scene B; reversed direction reads as a rewind. Variant `tear`: a printed-map layer (paper, halftone, waterlines, serif name) is torn away by a scanner light bar in ~0.34 s, revealing the real image beneath.
- params: 8–16 frames per pass (0.34 s for the tear); feather ≈ 36 px at 1080p; swath glow 10 % white, exp falloff ~70 px behind the front; optional 0.2–0.45 s audio suck-out before heavy swaps; direction down = forward, up = rewind.
- build: `scan` in `src/transitions.tsx`: luminance `<mask>` = vertical linearGradient with stops at front ± feather (frame-driven), plus a screen-blended blurred band rect; `variant: 'tear'` adds a light-bar rect (2–4 px bright core + blur) at the front and a slight paper-edge shadow on the outgoing layer. Props: `direction` (`down`|`up`|`left`|`right`), `feather`, `glow`, `variant`.
- source: `styles/satellite-briefing/demo/engine.js` (soft scan front, swath glow, uMapWipe), DEMO.md shots 3–5 (MIT / CC BY 4.0).
- value: a calm, technical transition for before/after edits, data updates, timelines and "rewind" moments; works for any two scenes, not only imagery.

---

<!-- part C: lemo-opuscar styles: scifi-toon, shadow-puppet, silent-film, silkscreen-poster, spy-titles, stained-glass -->

Source repo: `opus_sources/repos/lemo-opuscar` (code MIT, docs CC BY 4.0, by LemoLab / @lemomo_ai). Every section below is
written in our own words from STYLE.md / DEMO.md / style.json, a skim of the demo code, and a look at
`styles/<s>/poster.jpg`, `docs/frames/<s>.jpg`, `styleboard/img/<s>_0.jpg` (+ a few `demo/stills/`). Nothing was executed.
Palette tags: **[m]** = measured (PIL, context.txt) or eyeballed from the images, **[d]** = documented in STYLE/DEMO/code.
Never ship the demo's sign-off ("LemoLab × Claude Opus 5.5"), its story names, or its title text.

Notation used in builds: `seg(t,a,b)` = clamp((t-a)/(b-a)), `vn()` = 1D/2D value noise, `h()` = hash 0..1, `back(x,s)` = back-ease-out.

---

## scifi-toon

### style `scifi-toon` — Sci-Fi Sitcom Toon
- **essence**: adult-swim-era TV cartoon grammar: uniform thick dark outlines that *boil*, flat fills with hard-edged shadow shapes, big white eyes with tiny pupils, sci-fi hardware as household junk; one glowing travel device, one palette per "world". Dialogue/reaction comedy: every absurd image is followed by a reaction close-up.
- **palette** (home "lab" world):
  - bg wall sage `#a1c9a7` [m 29 %] (documented `#a7c3b1` [d]); wall lines `#7c9d8a` [d]; upper band `#8fae9b` [d]
  - floor/olive `#798e73` [m] (`#6c7c75` [d]); counter/dark `#4c5349` [m]; highlight `#d1e4bf` [m]
  - ink (line, never changes between worlds) `#1b1422` [d] (slightly purple black); eye white `#ffffff`
  - device glow (reserved, nothing else may use it): source rim `#3fd93a`, arms `#b8ff5a`/`#21b33c`, core `#dcffa8` [d] / `#73d473` [m]
  - title: cream `#fff3d6`, hard offset shadow magenta `#ff4fa3`, orbit ring cyan (~`#4fc8f0` [m])
  - per-world palettes [d]: jelly `#ff4f9a→#ff9bcb` + lime `#b8f03c` + cyan `#52e0e0`; mug `#ff7a2f→#ffb862` + teal `#2b9c98`; teeth `#c3122f`/`#ff8fa6`; pigeon slate `#5f78a8`; clone `#3b1f66` + `#e8d84a`; "suspiciously normal" beige `#f1e3c6` + brown.
  - **Library default recommendation**: ship the device colour as a prop defaulting to violet/magenta (`#b04cff`/`#ff6ad5`/core `#ffe1ff`), because an acid-green swirl portal + slime drips reads as one specific show (the source itself warns against acid green + drips + wobbly bubble lettering together).
- **texture / post** (clean digital TV, no grain, no paper):
  - Existing steps for photos/other motions: `posterize(6)` → `edges(color #1b1422, width 3, strength 1)` → `wobble(scale 3.4, frequency .015, boil 3)` with `step: 2`. No overlays.
  - For vector motions (the real look): stroke every path with `vectorEffect="non-scaling-stroke"` at 7 px (characters/props) / 4–6 px (background) so close-ups keep the same line weight (source transforms to screen space before stroking — this is the SVG equivalent).
  - **NEW step `boil`** (refines `wobble`): feTurbulence (baseFrequency ≈ 1/38 px, 2 octaves) + feDisplacementMap scale ≈ 3.4 (≈ ±1.7 px along the edge normal), seed = `[s0,s1,s2][floor(frame/2) % 3]` — exactly three boil drawings cycling at 12 fps, everything including held poses and backgrounds. Amplitude per element (portal fills 0.3–0.6 of line boil, skies 0).
  - Shadows = hard darker shapes clipped inside the fill (one per form, away from light); glows = 1–2 flat translucent rings; skies = flat colour bands (no gradients).
- **typography** (all Google Fonts, the source's exact fonts): **Bungee** (title, chunky period block caps; alt **Titan One**), **Baloo 2 ExtraBold 800** (subtitles ~50 px, white, ~11 px black outline), **VT323** (retro-terminal world tag).
- **motion rules**: characters (poses, mouths, blinks, walk) on twos = 12 fps; camera, device swirl, flying props and wipes on ones. Device opens with back-ease 0.32 s, ~12 % overshoot (`back(x/0.32, 1.7)`) — a springy 135 % overshoot covers the actors. Landing squash `1 − 0.22·e^(−9u)·cos(30u)` for 0.5 s. Panic shake: per-24 fps-frame random offset ±10 px for 0.5 s on one key word. Nervous jitter 3–6 px at 12 fps. Breathing ±1 % squash. Cuts on a 120 BPM half-second grid; no dissolves: hard cuts or swirl wipes through the device.
- **signature moves**: `swirl-portal` (NEW), `portal-wipe` transition (NEW), `atomic-orbit-title` (NEW), `scene-tag` terminal variant (EXTENDS), plus ours: `emote-pop` (sweat drops), `eyes-blink`, `speed-lines`, `kinetic-captions` (speaker-pill variant), `box-bot`.
- **do / don't**: do a new 3–5-colour palette per world, maximally different in hue *and* value; keep line colour + eye white constant; keep faces out of the bottom ~170 px subtitle band. Don't copy any show's characters (spiky-blue-haired lab-coat scientist + yellow-shirt kid), catchphrases, burp gags, portal-gun look, or the green-slime-drip logo combo. Don't scale line width with zoom. Don't let anything else use the device glow colour.
- **source**: `lemo-opuscar/styles/scifi-toon/{STYLE.md,DEMO.md,demo/toon.js,demo/worlds.js,demo/main.js,demo/story.js}` (MIT code / CC BY 4.0 docs).

### `swirl-portal` — NEW
- look: a vertical oval "hole in the world" with a lumpy, thickly outlined goo rim, five spiral arms in two alternating tints rotating inside it, a pale core with a white hotspot, sparks orbiting just outside, drips sliding off the bottom, and two flat translucent rings of glow washing the scene. Pops open with a gentle overshoot; boils with the rest of the toon.
- params: x-scale 0.74 (oval) — 1.0 when used as a wipe; rim = 22 points, radius factor `1 + 0.09·(2·vn(1.7i + 3t) − 1) + 0.05·sin(5a + 6t)`, closed Catmull-Rom; rim line 8 px; inner disc 0.9 R; 5 arms, each a ribbon from r = 0.95 R to 0, angle `2πk/5 + 3.6u + 2.6·t·spin`, ribbon angular width `0.55·(1 − 0.7u)`; core 0.30 R pale + 0.14 R white; glow rings 1.55×1.45 R α 0.14 and 1.28×1.22 R α 0.18; 12 sparks at distance `R·(1.05 + 0.25·frac(0.8t + h_i))`, radius 5–9 px, 1 in 3 white; 3 drips (only when open > 0.6) cycling at 0.9 Hz, 20–70 px long; open: `back(seg(t,t0,t0+0.32), 1.7)`; arms rotate on ones, boil on twos.
- build: SVG in a `<g transform="translate(cx,cy) scale(sx,1)">`. Rim path from the spline; `<clipPath>` = rim; inside the clip draw inner disc, the 5 arm ribbons (polygon of the outer edge + reversed inner edge, 23 samples each), core discs. Outline the rim with `vectorEffect=non-scaling-stroke`. Sparks/drips outside the clip. Apply the `boil` filter (3 seeds, frame/2 % 3). Props: `x, y, radius, open (0..1 or openAt frame), spin, colors {rim, armA, armB, core, glow}`, `ovalX` (0.74), `sparks`, `drips`, `wash` (full-frame flat tint α while open), `boil`, `seed`. Overlay-capable (transparent background). Default colours non-green (see palette note).
- source: `styles/scifi-toon/demo/worlds.js` (portal), `demo/main.js` (popOpen), DEMO.md "The portal".
- value: any "jump" device — a product teleporting between use cases, a "meanwhile in another universe" beat, a doorway reveal for a picture (`src` inside the core instead of arms), a playful CTA hole. Pairs with `portal-wipe`.

### `portal-wipe` — NEW (transition type)
- look: the portal rushes from a point to cover the whole frame (spinning faster), flashes pale for a frame at full cover, and the next scene opens out of the same swirl.
- params: half-width hw = 0.12–0.20 s (≈ 3–5 frames each side at 24 fps); radius `R = 1350·u^0.6` with `u = 1 − |t − tc| / hw` (fast growth, slow tail); x-scale 1.0; spin 2.2×; pale flash colour `#dcffa8` (use the device core colour) at α 0.7 when |t − tc| < 0.03 s; whoosh starts 0.16 s before centre.
- build: transition presentation in `src/transitions.tsx`: outgoing scene full until tc, incoming after tc; overlay renders `swirl-portal` centred (configurable origin) with the radius curve above; at full cover the scene switch is invisible. Props: `origin`, `colors`, `spin`, `flash`. Distinct from our `spiral` (stripes) and `flash` (light hole) because the cover itself is an animated object with arms.
- source: `styles/scifi-toon/demo/main.js` (`wipe`), `demo/story.js` (WIPES list: half-widths 0.12–0.2 s).
- value: the jump cut for list/montage videos ("five worlds in five seconds"), rule-of-three → machine-gun cuts on the beat.

### `atomic-orbit-title` — NEW
- look: a 1950s atomic-age TV title: fat block caps in cream with a thick ink outline and a hard magenta offset shadow, wrapped by a tilted cyan orbit ellipse that passes behind the top of the letters and in front of the bottom, a small object (bean/planet/logo) flying round it, and a few four-point stars twinkling. Pops in on 12 fps steps on a musical hit.
- params: Bungee ~150 px at 1080p; outline 22 px ink `#1b1422`; shadow offset (12, 12) px in `#ff4fa3`; ring tilt ≈ −6°, ellipse ≈ 1.3× text width × 0.35× text height, stroke ~10 px cyan with ink edges; orbiting object 1 rev / ~2 s; 3–4 stars scale-pulse 0.6–1.0; entrance on twos: scale 0 → 1.08 → 1 over 3 drawings (6 frames).
- build: SVG text with `paint-order: stroke` for the outline, a duplicate offset text for the shadow. Ring = two half-ellipse paths (back half drawn before text, front half after) so it threads the title. Orbiting object position on the ellipse parametric angle; swap z-order with the angle's half. Quantise entrance time to floor(frame/2)*2. Props: `title, subtitle, font, fill, shadowColor, ringColor, ringTilt, orbitIcon (emoji/svg/src), stars, popAt, boil`.
- source: `styles/scifi-toon/demo/main.js` (`titleArt`), DEMO.md "Titles & end card".
- value: playful show/episode titles, product names for tech/comedy brands, YouTube intros; complements `stamp-slam` and `blur-in-title`.

### `scene-tag` terminal variant — EXTENDS `scene-tag`
- look: a rounded box (boiling ink outline, per-world fill) top-left holding a VT323 "▶ ID" line typed in with a blinking block cursor, and a smaller description line typed after it.
- params: box at (70, 62) px, ≥ 360 × 118 px, radius 12, line 7 px; ID 54 px, description 40 px VT323; typing 40 chars/s (110 chars/s if the tag lives < 1.5 s); cursor blink 3 Hz; pop-in `back(seg(t,a,a+0.18), 2.2)`; fg/bg colours per world.
- build: add `variant: 'terminal'` to scene-tag with props `id, desc, bg, fg, charsPerSecond, boil`. Text via substring of `floor((frame-inAt)/fps·cps)`.
- source: `styles/scifi-toon/demo/main.js` (`tag`).
- value: "Universe C-12 / coffee is sentient"-style labels, chapter or version labels, environment labels in tech explainers.

### `toon-boil` — EXTENDS style-engine `wobble` step (and `kinetic-captions`)
- look: every outline wriggles slightly through exactly three drawings at 12 fps; line weight stays constant at every zoom.
- params: resample step 7 px, displacement along normal = (0.8·n1 + 0.35·n2)·1.7 px, noise wavelength ≈ 38 px; 3 drawings, 12 fps.
- build: (a) add `boil: {seeds: 3, every: 2}` semantics to `wobble` (seed cycles instead of random per frame); (b) document `vectorEffect="non-scaling-stroke"` for all toon motions; (c) `kinetic-captions` variant `'toon'`: Baloo 2 800 white with 11 px ink stroke, speaker pill in the character's colour on the left (boiling outline), two-line wrap at ~1300 px, previous line dims to 70 % when lines overlap.
- source: `styles/scifi-toon/demo/toon.js` (toScreen/boilPts), STYLE.md §2/§4.
- value: makes any SVG motion (box-bot, emote-pop, chat-bubbles) read as hand-drawn TV animation.

---

## shadow-puppet

### style `shadow-puppet` — Shadow Puppetry (Chinese piyingxi)
- **essence**: carved, translucent dyed-hide puppets pressed against a cotton screen and lit from behind by oil lamps. Colour arrives *through* the hide (dyes glow like glass, carved holes are the brightest value, overlaps go darker); everything trembles in the hand; the lamp is the world's exposure.
- **palette**:
  - cloth (lit) `#f9f5e6` / `#f2e6d1` / `#ebd5a8` [m]; cloth hotspot near lamp ≈ white
  - lamp light `#ffc475` (1, .77, .46) [d], hotspot `#ffe69e` (1, .9, .62) [d], bloom tint `#ffd199` [d]
  - warm vignette target `#b37840` (.7, .47, .25) [d] — never grey; measured edge browns `#ae793e`, `#7f4019` [m]
  - dyes [d]: vermilion `#b8211a`, flame `#d9541c`, ochre `#dc9d1e`, gold `#c98a26`, malachite `#236e3a`, jade `#2f8a5c`, indigo `#22647e`, raw hide (neutral) `#e2bd80`, ink `#1a100a` (outlines, hair, boots, arrow shafts)
  - stage lacquer frame `#52200e` / `#3e1409` / `#210c05` [m]; audience heads ~`#030101` [m]
  - roles: bg = cloth, paper = raw hide, ink = `#1a100a`, accent = vermilion, accent2 = malachite/indigo.
- **texture / post** — the per-pixel model is `image = 1 − exp(−lampLight × hideTransmission × cloth × exposure)`:
  - hideTransmission: a canvas that starts **white**; every piece drawn with `multiply` (holes stay white, overlaps darken by themselves). In SVG: a group with `mix-blend-mode: multiply` over white, holes via `fill-rule=evenodd` / masks.
  - lampLight per lamp: broad Gaussian σ ≈ 700 px + hotspot σ ≈ 120 px (≈ 6:1 weight), plus ambient 0.3; flicker ≈ ±6 % value noise at ~7 Hz + small 23 Hz sine, per lamp independently.
  - exposure `1.75 / √(lamps lit)` — ten lamps ≈ 3× one lamp: the frame bleaches but stays readable.
  - cloth: fine weave `0.5 + 0.5·sin(2.6x + warp)·sin(2.6y + warp)` (≈ 2.4 px period) at 5 %, fibre speckle 5 %, low-frequency density blotches 9 %, darker 60–70 px edge falloff.
  - post: bloom (3-level, threshold 0.72, strength 0.3, tint `#ffd199`), saturation ×1.1, soft S-curve 0.15, warm vignette 0.45 toward `#b37840`, grain 2.
  - Map onto existing engine: `saturate 1.1` → `contrast 1.12` → `tint(#ffc475, multiply, .35)` → `glow(radius 18, amount .3)`; overlays `paper(#f2e6d1, .5, fiber 1)`, `vignette(.45, #7f4019)`, `leak(#ffe69e, .4)`, `filmGrain .2`.
  - **NEW overlay `lampField`** {lamps:[{x,y,intensity,core}], sigmaBroad, sigmaCore, flicker, ambient, color, hotColor} rendered as stacked radial gradients (`mix-blend-mode: multiply` then a screen-blended hotspot) with per-lamp flicker `1 + 0.06·(vn(7t+i)−.5)·2 + 0.01·sin(2π·23t)`; exposure = 1.75/√n applied as `brightness`.
  - **NEW step `transmit`** (tonemap `1−exp(−k·x)` via feComponentTransfer `type=table` with ~16 samples) so overexposure rolls off warmly instead of clipping.
  - **NEW overlay `clothWeave`**: feTurbulence baseFrequency ≈ 0.42 (fine) multiplied at 5 % + a low-frequency blotch at 0.0045.
- **typography**: **Cormorant Garamond 600** (placard subtitles 46 px cream `#f3e2bf` on dark lacquer; plaques), **Ma Shan Zheng** (single CJK glyph in the carved seal). Both OFL, Google Fonts — the source's exact fonts.
- **motion rules**: puppets and camera at 24 fps continuous (not on twos); only swapped effect pieces (fire, water) step at 12 fps. Hand tremor on every puppet: x ±1.5 px (noise 2.1 Hz), y ±1.2 px (2.7 Hz), rot ±0.009 rad (1.7 Hz), ×1.8 under tension. Loose parts (plumes, legs, tassels) are damped pendulums driven by body acceleration: plumes k 60, damping 5, driven by angular acc; legs k 30, damping 3.5, driven by linear acc; pre-simulated at 120 Hz for determinism, clamp ±0.8 / ±0.5 rad. Operatic phrasing: shuffle → hop → crouch → **freeze pose on a percussion hit ~1 s** (only loose parts quiver) → head turn. Faces never change. Press on / lift off (see technique). Lamp flare overshoots to 1.5×, snuff over 0.35 s with fast gutter flicker. Crash zoom of 5 frames on a gong. Transitions: lamps dimming, blurred foreground pillar wipe, a piece lifting off into light, flash to warm white (our `whiteout`). Never a crossfade or digital wipe.
- **signature moves**: `lamp-screen` (NEW backdrop), `press-lift` entrance/exit (NEW), `carved-plaque` (NEW), `hide-carve-patterns` (NEW util), `pillar-wipe` (NEW transition); ours: `whiteout`, `smoke-puffs` (dark wisps only), `crowd-bob` (audience heads idea).
- **do / don't**: do carve densely (thin strips, most area cut away), outline every region 1.5–2.4 px dark, put sleeves in a different dye from the torso, keep most of the cloth empty, make thin readable things (shafts, strings, text) dark. Don't use flat clip-art fills, grey vignette, cold/blue night grading (night = fewer lamps), white light, morphing (pieces rotate on rivets, slide on rods or are swapped). Flames: fat base, belly, hooked tip with alternating curl — radiating spikes read as saw blades or petals.
- **source**: `lemo-opuscar/styles/shadow-puppet/{STYLE.md,DEMO.md,demo/gl.js,demo/carve.js,demo/stage.js,demo/main.js}` (MIT / CC BY 4.0).

### `lamp-screen` — NEW
- look: a warm cotton screen in a lacquered stage frame (optional blurred audience heads below) lit from behind by one or more flickering oil lamps; any puppet/shape layer placed on it is shown as transmitted light — dyes glow, holes shine, overlaps darken. Turning the lamp count up bleaches the whole frame; snuffing lamps steps it back to gold.
- params: lamp σ broad 700 px / core 120 px, core weight ~6:1, ambient 0.3; flicker ±6 % at ~7 Hz; light `#ffc475`, hot `#ffe69e`; exposure 1.75/√n; weave 5 %, blotches 9 %; bloom thr 0.72 / 0.3; vignette 0.45 → `#b37840`; stage frame: lintel + pillars in `#52200e`/`#3e1409` with gold cloud curls; audience heads in the bottom ~15 % as soft black ellipses.
- build: Remotion composition with three layers: (1) `lampField` as SVG radial gradients (or a small three.js/WebGL quad if available — the formula is a few lines of GLSL: sum of two Gaussians per lamp), (2) a white `<g>` "transmission" layer where children render with `mix-blend-mode: multiply` (accepts any motion as `subject`/`children` or an `src` image), (3) post: weave + vignette + bloom via the style engine. Props: `lamps` (array or count + layout), `lampsLit` (keyframes), `flicker`, `stage` (frame on/off), `audience`, `subject`/`src`, `colors`, `seed`. Per-lamp ignition: flare `1 + 0.5·back-ease` overshoot; snuff 0.35 s with 20 Hz gutter flicker + dark smoke wisp.
- source: `styles/shadow-puppet/demo/gl.js` (compositor), `demo/main.js` (lamps, exposure), DEMO.md "Rendering constants".
- value: "the light is the world": lights switching on one by one (servers, city, a fever), folklore/heritage explainers, festival openers; turns any silhouette/icon set into a warm theatre scene.

### `press-lift` — NEW (entrance/exit preset for any layer)
- look: an arrival comes in large and blurry (as if held near the lamp, off the cloth) and snaps sharp onto the screen; an exit grows, blurs and fades into light, like lifting a puppet away.
- params: press-on scale 2.6 → 1, blur 34 → 0 px, opacity .35 → 1 over 0.55 s, ease-out; lift-off scale 1 → 1.9, blur 0 → 30 px, fade to 0 over ~0.9 s, ease-in; optional thud/flap at the snap.
- build: wrap a layer in `Layers.tsx`/`mix` with `enter: 'press'` / `exit: 'lift'` (CSS `transform: scale()` + `filter: blur()`); deterministic from frame. Props: `pressFrames, liftFrames, fromScale, toScale, maxBlur`.
- source: `styles/shadow-puppet/demo/main.js` (sun pieces: scale `.95·(1+1.6·lift)`, blur `34·lift`), STYLE.md §5.
- value: a universal "comes into focus / fades into memory" entrance for any motion: a rumour growing, a deadline pressing in, forgotten items lifting away.

### `carved-plaque` — NEW
- look: a dark hide (or lacquer) plaque with the title cut out of it so the letters glow with the light behind; carved border with a meander band, cloud-scroll corner roundels and a small red seal with a cut glyph; carried on two thin rods, pressed on to enter and lifted off to exit.
- params: 1180 × 380 px at 1080p; letters via text + `destination-out` (SVG: text in a `<mask>` black on white); border meander, corner roundels in malachite; seal 90 px vermilion `#b3261b` with cut-out glyph; rods 2–2.4 px dark grey at ~0.7 α running off-screen; sways with the puppet tremor.
- build: SVG `<mask>` (white rect, black text/border holes) applied to a `#1a100a`-ish plaque fill; place over `lamp-screen` so holes show the lit cloth (or over any bright backdrop). Props: `lines [{text, font, size}]`, `plaqueColor, borderColor, seal (glyph), rods, enter/exit (press/lift), tremor`.
- source: `styles/shadow-puppet/demo/stage.js` (plaque), DEMO.md "Title plaque".
- value: titles, end cards and chapter cards for heritage, myths, festivals (Lunar New Year, Diwali shadow plays), "a tale of …" openers.

### `hide-carve-patterns` — NEW (shared SVG pattern/mask library)
- look: openwork vocabulary of shadow theatre: rows of crescent "fish-scale" holes, diamond lattice, coin holes (round hole leaving a square of hide inside), cloud scrolls/collars, meander bands, bead lines, tapered slits (rain, fur, cracks that widen), strata cuts following a ridge, leaf holes in a canopy.
- params: scale rows r ≈ 7 px, slit width 1.3 px; lattice cell 10 px, strip 2.2 px; coin r with inner square 0.76 r; meander step 6 px; outlines 1.5–2.4 px ink; hide texture (mottle + fibres + specks) multiplied inside each piece.
- build: functions returning SVG `<pattern>`s or path data to be used as `mask` (black = cut) inside a piece's clip; `evenodd` for coin holes. Export from `src/core/` as `carve.scales(box,r)`, `carve.lattice(box,s)`, `carve.coins(pts,r)`, `carve.cloud(x,y,r)`, `carve.meander(x0,y,x1)`, `carve.taper(path,w0,w1)`. Used by `lamp-screen` subjects, `carved-plaque`, and potentially papercut/woodcut motions.
- source: `styles/shadow-puppet/demo/carve.js`.
- value: makes generated silhouettes (animals, buildings, logos) read as crafted lace rather than clip-art; reusable for papercut-red / folk styles.

### `pillar-wipe` — NEW (transition type)
- look: a huge, heavily blurred dark foreground pillar (stage post) trucks across the frame; the cut happens behind it.
- params: pillar ≈ 35–45 % frame width, colour `#210c05`, blur 40–60 px, travel full width in ~0.5 s, full cover ≈ 1–2 frames centred on the switch.
- build: transition presentation: dark rounded rect with `filter: blur()` translating x from −W to +W with ease-in-out; switch scenes at the frame where the pillar fully covers. Props: `color, width, blur, direction`.
- source: `styles/shadow-puppet/demo/stage.js` ("foreground posts for transitions"), DEMO.md shots ("truck right as a blurred foreground pillar wipes the frame").
- value: a motivated, physical transition for any theatre/stage/backstage piece; also a generic "foreground object passes camera" wipe (pairs with silkscreen's tree truck).

---

## silent-film

### style `silent-film` — 1920s Silent Film
- **essence**: an engraved ink-and-wash drawing printed on silver stock and *projected*: a 4:3 print weaving in a gate between velvet curtains, flicker, scratches and burned edges; nobody speaks — intertitle cards and a cinema piano carry the beats; locked wide shots, deadpan bodies.
- **palette**:
  - print black `#0e0e0e` (0.055) [d], print white `#ededed` (0.93, silver-tinted ≈ `#e9eaed`) [d]
  - neutral silver greys `#9d9995`, `#716c67`, `#35322f`, `#c4c2bf`, `#e3e2e0` [m poster]
  - sepia ramp [d]: shadow `#1b120c` (.105,.07,.045) → mid `#9e805e` (.62,.50,.37) → light `#f7ebd1` (.97,.92,.82); measured sepia frame `#ada49b`, `#8c8379`, `#e0dcd3`, `#37312c` [m]; sepia amount 0.10 (cold/harsh) … 0.36 (warm/tender)
  - theatre drapes `#160b09` / `#0c0605` / `#060302` [m] (deep brown-red velvet, ~`#2a0d0a` where lit by spill)
  - intertitle card black ~`#141210` with border/text `#d9d4c8` [m cards still]
  - burn brown add (+.035, +.012, −.01) on the edges [d]
  - "one colour" option: a single masked element keeps its hue (e.g. `#D97757`), still grained/flickered/vignetted.
  - optional period tints per section: amber day interior, blue night, rose romance.
  - roles: bg = drapes, paper = print white, ink = print black, accent = sepia mid, accent2 = the one colour.
- **texture / print / post**:
  - **Ink "Redraw" pass** (turns tonal greys or footage into an engraving): XDoG lines (σ 1.1 px, k 1.6, sharpen 14–22, ε .35, φ 4) on the dark side of edges + luminance posterised to 5 soft wash steps + 45° hatching in the darks, a second −45° family in deeper darks and a third near-horizontal family (0.12 rad) in the darkest; hatch gap 5.5 px, line width grows with darkness 0.7–1.9 px; **hatch pattern re-seeded every 2 frames** (boils like redrawn animation). Map: `saturate 0` → `contrast 1.15` → `edges(#121212, width 1.2)` → `posterize 5` → `lines(gap 5.5, angle 45, ink #1b1b1b)` — but our `lines` step is uniform; **NEW step `hatch`** {gap, angles[], thresholds[], ink, boil:2}: each angle family masked by a luminance threshold (feComponentTransfer discrete → mask) and its feTurbulence-jittered phase reseeded every 2 frames.
  - **Print pass**: slight softness (mix 45 % of a 0.7 px blur), halation (+0.22·max(0, L_blur − .55)·1.8), uneven density (fbm drifting, ±4.5 %), S-curve, map to print black/white endpoints, scratches, edge burn, vignette (0.62 × smoothstep(.10,.62,r²)), two-octave silver grain (fine 1.25 px hash ±.08 + 2.6 px value noise ±.07, strongest in mids), then sepia toning via the ramp above. Map: `contrast` → `gradientMap([#1b120c,#9e805e,#f7ebd1])` (scale toward neutral by sepia) → overlays `vignette .6`, `filmGrain .5`.
  - **NEW overlay `filmDamage`** {strength .6, flicker, weave, scratches, burn, dust, hair, jump, crank} (algorithm in `film-print-damage` below).
  - **NEW overlay `theatreGate`** (4:3 aperture + curtains, see technique).
- **typography**: **Playfair Display SC** (titles, shouts — small caps display serif), **Old Standard TT Italic** (narration and dialogue). Both OFL Google Fonts, the source's exact faces.
- **motion rules**: **hand-cranked sampling** — characters and camera sampled at 16 fps (`tSample = floor(t·16)/16`; 18 fps and ×1.3 speed for chases), while flicker/weave/grain/scratches change every 24 fps output frame (this split is what reads as projected rather than just choppy). Speed and damage are emotions: undercrank + more damage + colder print when things go wrong; 16 fps, warmer, cleaner when tender. Deadpan faces; the body acts (crouch before effort, held poses, 2-frame double-take snap). Eased keyframed poses only; deliberate gags snap. Camera mostly locked; slow motivated push-ins (zoom 1.6 → 2.1); tracking with foreground at 1.35× and background at 0.8×. Transitions: iris in/out (also stopped half-way and held), fade to black, straight cut, curtains. No dissolves within a scene, no whip pans. Intertitles hold 2.5–3.75 s.
- **signature moves**: `film-print-damage` (EXTENDS `film-look`), `intertitle-card` (NEW), `theatre-gate` (NEW), `ink-redraw` (EXTENDS style engine), `iris-hold` (EXTENDS `iris` transition); ours: `ken-burns` (locked push), `duotone` (sepia), `handwrite-on`.
- **do / don't**: do one legible gag/chain per locked wide (cut rather than add), check every shot as a thumbnail (values carry everything), keep close-ups small or inside an iris, add footlights so closed curtains are not pure black. Don't use the Tramp look (bowler + toothbrush moustache + cane), real films' gags or published melodies, a sepia photo filter over modern flat art (the drawing itself must be inked), more than 3–5 cards per minute, cards that repeat what the picture shows.
- **source**: `lemo-opuscar/styles/silent-film/{STYLE.md,DEMO.md,demo/engine/film.js,demo/engine/redraw.js,demo/engine/cards.js}` (MIT / CC BY 4.0).

### `film-print-damage` — EXTENDS `film-look` (+ NEW style overlay `filmDamage`)
- look: projected nitrate print: whole-frame brightness flicker, the image weaving under a fixed aperture with an occasional perforation jump, broken vertical scratches (white = scraped emulsion, dark = dirt), brown burn creeping in from the edges, dust specks, a hair in the gate, rare blotches, two-octave silver grain, halation on highlights.
- params (strength k ≈ 0.6, crank c ≥ 1): weave `x = (0.6 sin .31f + 0.8 sin(.113f+1.3) + 0.5(h(f)−.5))·1.4k`, `y = (0.7 sin(.23f+.7) + 0.9 sin(.071f+2.1) + 0.6(h(f+99)−.5))·1.6k` px with `f = frame·c`; perforation jump +4k px when `h(floor(frame/2)·3.7) < 0.025k`; flicker `1 + ((h(frame)−.5)·.09 + .025c·sin 1.9f + .02 sin .37f)·k`; 4 scratch lanes, lane i lives `5 + 3i` frames, on when hash > `1 − k(.55 − .1i)`, width 0.6–2 px, x drifts ±3 px, broken along its length (value-noise gate at y/125), 38 % dark (−.55) else white (+.7); burn = smoothstep(0.12 + 0.1·fbm, 0, edgeDist) × k, darkens 55 % and adds brown; vignette .62; grain fine ±.08 (1.25 px) + coarse ±.07 (2.6 px) × mid-tone weight; halation +.22·(Lblur − .55)·1.8; print endpoints black .055 / white .93; sepia 0.10–0.36.
- build: new `filmDamage` overlay in `src/styles/engine.tsx` rendered as an SVG layer per frame: weave = translate of the filtered content (outside area black); flicker = `brightness` on the whole; scratches = 0–4 thin `<rect>`s with a dashed mask; burn = radial/edge mask with feTurbulence (seed drifts slowly); dust/hair = seeded tiny blobs + one bezier hair that lives ~8–20 frames; grain via existing `filmGrain`. Add `scratches, burn, dust, hair, jump, crank, sepia` props to `film-look` and let the style reuse the same code. All deterministic from `frame`.
- source: `styles/silent-film/demo/engine/film.js` (FilmPost shader, weaveAt, flickerAt, damage), DEMO.md "Print".
- value: archive / retro brand pieces, "history of X" explainers, newsreel recaps; turns any motion or footage into a projected 1920s print. Damage as a mood dial (crisis = harsher).

### `intertitle-card` — NEW
- look: a full-frame black painted card with an Art-Deco border whose ornament follows the emotion — **narration**: double rule with stepped corners, small diamond-and-rule ornaments top and bottom and corner fans; **shout**: one heavy single rule, text in big small-caps that shakes; **tender**: double rule plus wavy vines with small flowers down the sides; **title**: double rule, small-caps title + italic subtitle ("a photoplay in one reel"). Gets the same print damage as the film.
- params: card fills the 4:3 gate; border inset ~3 % with a second rule ~1 % inside; narration text Old Standard TT Italic ~60 px, title Playfair Display SC ~90 px + italic 28 px subtitle, shout Playfair SC bold ~110 px with per-frame shake ±2–3 px; text colour `#e8e4da`, border `#bdb6a8`, card `#141210` with faint mottle; hold 2.5–3.75 s (≥ max(1.8 s, reading time + 0.6 s)); cut in/out (or fade from black 4–6 frames).
- build: SVG composition; `decoBorder(level)` builds paths: double rect with stepped corners (notches of ~1 % at each corner), centre ornaments (rule – diamond – rule), corner fans (5 short radiating strokes), vines (sine path with 5 small 5-petal flowers per side). Props: `lines [{text, font, size, italic}]`, `level: 'title'|'narration'|'shout'|'tender'`, `shake`, `cardColor, inkColor, borderColor`, `hold`, `damage` (pass-through to `filmDamage`), `aspect` (4:3 default). Add to the text category; usable as subtitles (the SRT is the card text).
- source: `styles/silent-film/demo/engine/cards.js`, `demo/stills/frame_cards.jpg`, STYLE.md §4.
- value: chapter cards, quotes, punchlines ("Meanwhile, in the lab…"), a statistic as a twist; any retro/silent-comedy explainer; cheap and universal.

### `theatre-gate` — NEW (wrapper / overlay)
- look: the picture is a 4:3 print (1440 × 1080 in the 1920 × 1080 frame) in a rounded aperture with a soft dark rim, flanked by deep red-brown velvet drapes lit by the screen's spill and by footlights; curtains part at the start and close at the end.
- params: aperture 1440 × 1080 centred, corner radius 22 px, soft rim ~12 px; drapes: vertical folds (sine-shaded stripes ~40–60 px period) in `#160b09`…`#3a1410`, spill = horizontal gradient brightening toward the screen edge, modulated by the print's flicker; footlights = warm glow from the bottom 10 %; curtain open/close ≈ 1.5–2 s ease-in-out, each half sliding to the side.
- build: `Layers`-style wrapper motion: `children`/`subject` rendered into a clipped `<foreignObject>`/div at 4:3, drapes as SVG with pattern fills, spill opacity tied to the subject's average brightness (approximate by the flicker value). Props: `aspect (4/3)`, `curtainOpen` keyframes, `drapeColor`, `footlights`, `spill`, `radius`. Could also be a style overlay `theatreGate`.
- source: `styles/silent-film/demo/engine/cards.js` (theatre), DEMO.md "Frame", poster.jpg.
- value: frames any motion as "a film being shown" — retro launches, "the story so far", nostalgia pieces; solves 4:3 content in 16:9 frames elegantly.

### `ink-redraw` — EXTENDS style engine (`edges` + `posterize` + `lines`) — NEW step `hatch`
- look: footage or flat grey painting becomes an engraved ink drawing: crisp ink contours, 5 soft wash steps, cross-hatching only in the darks that re-draws every 2 frames.
- params: XDoG σ 1.1, k 1.6; 5 levels with soft transitions (smoothstep .3–.7 inside each step); hatch families: +45° gap 5.5, −45° gap 6.05, 0.12 rad gap 4.7, each switched on past its own darkness threshold; line width 0.7 + darkness·(0.9–1.1); boil every 2 frames; ink value .07, paper .95; photo mode: bilateral pre-smooth, stronger sharpen (34), ε .24.
- build: implement `hatch` FilterStep: luminance → three feComponentTransfer thresholds → each multiplies a tiled diagonal-line pattern (feImage of an SVG pattern or feTurbulence stretched with `baseFrequency="0 0.18"` + rotate via a wrapping group) whose offset is seeded by `floor(frame/2)`; composite with `edges` and `posterize`. A full-fidelity version can be a WebGL shader in `src/core` (`dog`, `hatch`) used by image motions (`duotone`, `xray-scan`).
- source: `styles/silent-film/demo/engine/redraw.js`, STYLE.md §2.
- value: makes footage and photos share one hand-drawn period look (archive clips, family films, sports moments) — also useful for the existing `pencil-sketch` and `woodcut` styles.

### `iris-hold` — EXTENDS `iris` transition
- look: the classic iris closes on a subject but stops half-way and holds (a character glances at the audience), then shuts; iris edge has a soft dark rim; iris centre tracks the subject.
- params: hold radius ≈ 0.18–0.3 of frame height, hold 1–2 s, close 0.5–0.8 s ease-in; opening iris on the story object at the start; centre in film coordinates (re-mapped after camera zoom).
- build: add `hold: {radius, frames}` and `track: (frame) => [x,y]` (or keyframes) to the iris presentation/overlay; draw black with a circular hole plus a 10–20 px blurred rim.
- source: `styles/silent-film/demo/engine/cards.js` (iris), STYLE.md §6/§8 ("Iris on the look").
- value: wink endings, "keep an eye on this" moments in explainers, mascot glances.

---

## silkscreen-poster

### style `silkscreen-poster` — Silkscreen Travel Poster
- **essence**: a WPA-style travel poster being screen-printed on camera: 4–6 opaque flat inks, each laid by its own squeegee pull on one musical beat, stepped colour bands instead of gradients, thin paper-white slivers where registration slips; information prints last, exactly when it should be read.
- **palette** (per poster; roles sky1, sky2, far, mid, near (= info band), sun (the single bright accent), optional glow) [d]:
  - dawn `#F6CD98 #EE9A73 #9A7FA8 #3E7079 #1E3B3F #FBE6B4`
  - noon `#E4EEDC #86BCD0 #C2AE92 #4C8753 #1D4331 #F2C14A`
  - golden `#F7D787 #E9A94F #A57C68 #5E7A45 #2B3A28 #FFF1C4`
  - dusk `#F4B461 #D8613F #7C3E5F #43325A #1B1B2F #FBE3A6`
  - harbour noon `#E8F0F2 #7FB3C8 #D9C7A3 #2F6E8E #173247 #E8553D`; winter `#EEF1F4 #B8C9D9 #8B9BB0 #4A5D78 #1F2A3C #F2B134`
  - paper `#F2E8D2` [d] (measured `#d8cfb0` under the wall light [m]); banner `#F7C66B #E4683F #2F6F73 #1C2A33` [d]
  - wall / table (scene, not poster): plank brown `#5e4433` [m 23 %], lighter `#cea47d` [m]
  - roles: bg = wall `#5e4433`, paper = `#F2E8D2`, ink = palette `near`, accent = palette `sun`, accent2 = `sky2`.
- **texture / print / post**:
  - existing steps over images: `gradientMap(ramp = [near, mid, far, sky2, sky1, paper], discrete: true)` (5–6 flat inks, depth = value) → `misregister(dx 2, dy −1, color = sun, opacity .9)` → no blur. Overlays: `paper(#F2E8D2, .55, fiber .6)`, `filmGrain .15` (more reads as risograph — keep the texture budget low: mottle multiply ~55 %, pinholes ~75 %).
  - per-ink registration: each layer offset 1–3 px; a knocked-out shape leaves a crescent of bare paper.
  - **NEW step `inkSheen`** (ink thickness with fills only): duplicate the ink alpha, offset (−2, −2) and composite white α .22 inside (top-left light rim), offset (+2, +2) black α .12–.14 inside (bottom-right dark rim); fresh ink adds a wet sheen fading within ~1 s.
  - **NEW step `trap`** (overprint edge): reprint the same alpha offset (2.2, −1.6) in `multiply` at α .45 → darker sliver where ink laps ink.
  - **NEW overlay `pinholes`**: sparse paper-colour specks (feTurbulence high frequency → threshold ~0.97) masked by ink alpha so they only show on ink; + mottle multiply.
  - **NEW step `bandify`** (gradient substitute): stepped bands where stripe i of n has thickness `cell·(1 − (i+.5)/n)·0.95 + 1.2` (stripes thin out toward the next colour), optional sag curve; for SVG-native skies use `stepped-band-sky` (below).
- **typography**: **Big Shoulders Display** 900/800 (names, values, auto-fit), **League Gothic** (alt condensed display), **Outfit 600** letter-spaced (labels, header tracked out). OFL Google Fonts — the source's exact faces.
- **motion rules**: pulls are **linear and steady** (a squeegee does not ease); accent inks start half a beat after their layer's main ink; info items print left to right on eighth notes (0.18 s each at 100 BPM); **no fades anywhere**; screen lift 0.4 s (vertical squash + growing ring shadow); palette re-ink: diagonal blade at −12° crossing the sheet in 0.35 s; loose layers parallax with paper gaps then snap into register on one hit; fast pull-back ease-out 0.65 s; hook truck with −1.7° roll. Transitions: squeegee (layers), a foreground silhouette truck covering the frame ~1 frame (posters), a table move. No dissolves, no bare cuts. Hold rule: each text ≥ chars/12 + 1 s (min 1.5 s) after its *last* item lands.
- **signature moves**: `screenprint-poster` (NEW), `squeegee-pull` (NEW motion + transition), `palette-reink` (NEW), `registration-snap` (NEW); ours extended: `stepped-band-sky` (EXTENDS `sun-rise-set`), dashed route stamp (EXTENDS `map-route`), final series wall (EXTENDS `thumbnail-mosaic`).
- **do / don't**: do one palette per poster ≤ 6 inks, values light (far) → dark (near), paper as the brightest colour (snow, waterfall, beams), text inks picked by WCAG contrast against the ink beneath (never a fixed key), a ~4:1 banner for titles, ring-shaped (even-odd) screen shadows, round ink beads with a lit half. Don't use gradients, halftone dots, fluorescent inks, line work/outlines, blur for depth, stroke-based edge effects on unioned paths (they draw internal lines — use fills), confetti-like random dots. Never copy a real poster composition, park name, lettering, logo or agency.
- **source**: `lemo-opuscar/styles/silkscreen-poster/{STYLE.md,DEMO.md,demo/engine/silk.js,demo/engine/poster.js,demo/engine/scenes.js}` (MIT / CC BY 4.0).

### `screenprint-poster` — NEW
- look: a portrait poster (paper border, art area, dark info band) builds one ink at a time: stepped-band sky, a concentric sun ring, far ridge with a jagged lit facet, mid hills, near pines/forest (darkest), then the info band pulls in and its name, big number, rule and stats row stamp in left to right. Ends as a finished print, optionally lifted off and hung in a series wall.
- params: template 1000 × 1500 u; paper border 26 u; art area to y 1140 (scene shifted up 50 u); info band y 1148–1474 in `near`; name Big Shoulders 900 auto-fit 122 → 60 u; number `01`–`04` in `sun`; 6 u `sun` rule; labels Outfit 600 34–38 u letter-spaced, values Big Shoulders 800 48–68 u; header tracked out 62 u printed in the sky; layer reg offsets 1–3 px; each pull = one beat (100 BPM default), info items 0.18 s apart; screen lift 0.4 s.
- build: SVG; each ink layer is one `<path>` (knock-outs via evenodd) revealed by the `squeegee-pull` clip; apply `misregister`, `inkSheen`, `trap` per layer; scenes are lists of planes (`lake`, `waterfall`, `ridge`, `forest`, `coast`) generated by seeded midpoint-displacement ridges, pine outlines of drooping tiers, water bodies with horizontal glint bars. Props: `title/header`, `name`, `number`, `stats [{label, value}]`, `scene`, `palette {sky1, sky2, far, mid, near, sun, glow?}`, `paper`, `bpm`, `startFrame`, `pullOrder`, `squeegee` (show blade), `screenFrame`, `seed`. Text inks auto-picked by WCAG contrast. Data-driven like the source's content.json.
- source: `styles/silkscreen-poster/demo/engine/poster.js`, `engine/scenes.js`, DEMO.md "Poster template", "content.json fields".
- value: event posters (headline → date → venue → CTA), destination/trail guides, product drops with colourways, seasonal hours notices — a reusable *information* motion with strong craft appeal.

### `squeegee-pull` — NEW (motion helper + transition type `squeegee`)
- look: a flat ink sweeps across the sheet behind a squeegee blade with a rolling ink bead; the leading edge is ragged with short drag streaks (ink not pulled evenly), linear speed; a split-fountain bead lays several colours in one pull.
- params: front position `−tail + p·(L + 2·tail)`; edge sampled every 5 u across; per sample offset back from the front `tail·(0.65·h(i) + 0.35·h(floor(i/3)))` with tail ≈ 26–30 u; linear p (no easing); blade with lit edge, round bead (lit half, dark underside, rolling glints, viscous strands), handle sliver; split fountain = bead segments with colour ranges `[{t0,t1,color}]`.
- build: helper returning an SVG `<clipPath>` polygon for `(box, dir, p, seed)` + a `<Squeegee>` component positioned at the front. As a transition: incoming scene revealed through the ragged clip with blade visible; a wide blade at −12° for re-inks. Props: `dir`, `tail`, `seed`, `bead colors`, `showHandle`, `roll`.
- source: `styles/silkscreen-poster/demo/engine/silk.js` (`wipeRegion`, `wipeFront`, `squeegee`).
- value: a physical print reveal for any layer or scene; sticker/merch/print-shop brands; complements `tear` and `wipe` transitions.

### `palette-reink` — NEW
- look: the same finished poster is pulled again in another palette: a wide tilted blade crosses diagonally and behind it every ink has changed (noon → golden → dusk, or three colourways), geometry identical on both sides.
- params: blade angle −12°, crossing ≈ 0.35 s, linear; ragged front as in `squeegee-pull`; per-poster palettes as above.
- build: render the poster twice (palette A and B) and reveal B with the rotated ragged clip; or a wrapper `reink` that takes any palette-driven motion (`palette` prop) and a list of palettes + switch frames. Props: `palettes[]`, `at[]`, `angle`, `frames`.
- source: STYLE.md §5/§8 ("Palette re-ink"), DEMO.md (the "7 h" time-of-day swap).
- value: time passing (day/night hours), seasons, product colourways, A/B variants — any palette-driven motion in our library could use it.

### `registration-snap` — NEW
- look: during a crane through the print, layers hang loose as separate sheets — paper-white gaps and paper-thickness shadows between planes, parallax by depth — then clamp into register on one loud hit right before the key facts.
- params: parallax `(camTopY − camY)·(depth − 1)·0.42`, sideways slide per plane as a Gaussian bump (190 u × depth); paper gap 3 u, thickness shadow 9 u at 28 %; looseness 1 → 0 at the snap (1–2 frames), with a clamp sound.
- build: SVG planes with per-plane translate from looseness; gap = stroke in paper colour under each plane; shadow = offset blurred copy at 28 %. Props: `planes`, `loosenFrom`, `snapAt`, `depthScale`, `gap`, `shadow`.
- source: DEMO.md (climb shot numbers), STYLE.md §5/§8.
- value: the "everything locks into place" beat before a date or price; multi-plane parallax that doesn't look like moving mountains.

### `stepped-band-sky` — EXTENDS `sun-rise-set` (props `bands`, `duskBands` already exist)
- look: sky as flat colour with thinning stripes stepping into the next colour, plus concentric sun rings.
- params: n stripes per transition (5 default), stripe i thickness `cell·(1 − (i+.5)/n)·0.95 + 1.2`, optional sag; sun as disc + 2–3 concentric rings in paper/sun ink.
- build: add `bandStyle: 'thinning'` + `sunRings` props; export the band generator for other motions (parallax-landscape, map-route).
- source: `styles/silkscreen-poster/demo/engine/silk.js` (`bandSteps`).
- value: instant print look for any sky backdrop without gradients.

(Also: dashed trail stamped segment by segment in `sun` ink, 16th-note ticks → EXTENDS `map-route` with `stamp: true`; final poster wall with log-zoom pull-back, hold ≥ 3 s → EXTENDS `thumbnail-mosaic` `layout: 'wall'`.)

---

## spy-titles

### style `spy-titles` — 60s Spy Title Sequence
- **essence**: a cut-paper, four-ink opening title sequence (Saul Bass grammar): profile silhouettes run through sets *built from the credits*, every brass stab is a cut, shapes rhyme across match cuts, and the chased object assembles into the title.
- **palette**:
  - ink black `#1b1714` [d,m], paper cream `#efe4c9` [d] (`#e4d9bd` [m] after paper multiply), signal red `#d23a22` [d] (`#c83921` [m] — the printed red reads darker), mustard `#e2a52a` [d]
  - "shadow paper" depth variants only: dark red `#9a2a18` [d] (`#a72e1b` [m]), dark mustard `#b07e1c`, distant city `#3a322b` [d]
  - alternate four-ink sets [d]: ink `#161a22` / bone `#ece6d6` / teal `#1f8a8a` / orange `#f07a28`; black / pale pink `#f3d6cc` / cobalt `#2a46b8` / lemon `#f0d23a`
  - roles: bg = one dominant ground per scene (red / black / cream / mustard), paper = cream, ink = black, accent = red (hero accent + danger only), accent2 = mustard (the chased object).
- **texture / post**:
  - flat inks: `gradientMap([ink, red, mustard, cream], discrete: true)` for images; no gradients, no halftone.
  - **scissor-cut edges**: resample each polygon every 9–10 px, displace along the normal by low-frequency noise (amp 1.2–2.2 px, bigger for big shapes; second octave 0.35×) plus a rare 1–2 px nick (~3.5 % of segments) — **computed once in the piece's local space** so a moving cut-out keeps its edge (screen-space edges crawl). In SVG: apply a `wobble` filter **with boil 0 on each piece's own `<g>`** (filters run in the element's user space, so the noise travels with the piece), or bake the rough path with a seeded function.
  - **NEW step `cutGap`**: outline each piece/figure with a 2.4 px gap in the *ground* colour (feMorphology dilate of alpha → flood ground → under the piece) + small paper shadow (offset 2.5, 3.5 px, blur 5, α 0.3 `rgba(20,12,6,.3)`) so a black figure reads in front of a black letter.
  - overlays: `paper(#efe4c9, .35, fiber .5)` multiplied mottling; **NEW `inkVoid`** speckle (sparse light specks only on dark ink); faint horizontal squeegee streaks; `filmGrain .35` (source mux grain ~6).
- **typography**: credits **League Gothic** (glyph outlines re-cut per letter: edge noise, ±0.8° rotation, ±1.5 px baseline jitter); subtitles **League Spartan 600** ~44 px; title = custom geometric cut glyphs (straight cuts + arcs, uneven weights, staggered baselines) — closest Google fallback: **Bebas Neue** or League Gothic re-cut with ±3° rotation and ±6 % staggered baselines. All OFL.
- **motion rules**: puppets (poses, positions, letters landing, vehicles) **on twos**; camera, credit slides and grid growth **on ones** (a stepped camera judders). ~132 BPM; run cycle 8 drawings = 2 beats, lean 0.3 rad, tie streaming at ~65° as a multi-segment ribbon with a travelling sine; walk 1 step/beat. Credits slide in along grid lines and stop dead on the beat (ease-out 0.2 s); letters land with a paper slap. **Stop-time**: at a stab the whole picture (background scroll included) freezes for 2 beats in true silence, then resumes. Match-cut intervals shrink as the chase accelerates (2 bars → 1.5 bars → 2 beats), circle centres/sizes identical across the cut. Strong 30° diagonals; screen direction always left → right in the chase. No dissolves.
- **signature moves**: `type-architecture` (NEW), `diagonal-assemble-title` (NEW), `silhouette-runner` (NEW), `diagonal` transition strips variant (EXTENDS), `paper-strip` captions (EXTENDS `story-caption-box`); ours: `beat-montage` (shape match-cut mode, EXTENDS), `stamp-slam`.
- **do / don't**: do open every credit location wide enough to read the full line, keep background props in a darker ground tone (black props read as letters), give the chased object a black backing so it reads on any ground, let hat/nose/accent stick out when a figure hides behind a letter, merge figure pieces into one outline with only thin joint slits. Don't do gun-barrel openings, cartoon-panther tiptoes, any real title's logo/lettering/shots, the famous chromatic spy crawl, real people's names in credits (fictional roles only), outlines on every internal piece (mannequin look).
- **source**: `lemo-opuscar/styles/spy-titles/{STYLE.md,DEMO.md,demo/paper.js,demo/glyph.js,demo/title.js,demo/film.js}` (MIT / CC BY 4.0; demo vendors opentype.js under its own MIT licence).

### `type-architecture` — NEW
- look: one line of credits fills the frame as a set — letters as colonnade pillars, words as train carriages on wheels, an O as a roulette wheel, a dash as a ledge — in black re-cut paper on a flat red/mustard ground; a silhouette figure runs, leaps the word gaps and hides behind a letter; camera opens wide on the whole line, then trucks with the action.
- params: letter height ≈ 25–30 % of frame; each letter re-cut (edge noise amp 1.5 px, ±0.8° rot, ±1.5 px baseline); 2.4 px ground-colour gap + paper shadow; props per mode: `train` adds a chassis bar + wheels (r ≈ 3 % H) under each word, rails line in cream; `colonnade` adds plinths/capitals; `ledge`; background props in darker ground (`#9a2a18` on red); telegraph wires as thin cream catenaries; truck speed constant, figures on twos.
- build: text → path (load League Gothic via `@remotion/google-fonts` and use `opentype.js`-style glyph paths, or SVG `<text>` with per-letter `<tspan>`s and a static per-letter wobble filter); layout word boxes → attach prop geometry per mode; camera = translateX on ones. Props: `line`, `mode: 'train'|'colonnade'|'ledge'|'plain'`, `ground`, `ink`, `accent`, `figure` (runner config), `truck`, `openWideFrames`, `seed`.
- source: `styles/spy-titles/demo/scenes.js` (train/colonnade/rooftop), `demo/glyph.js`, poster.jpg / styleboard (train of "THE SAMPLER").
- value: conference programmes, team rosters, festival line-ups, feature lists — "credits as a set" for any named list; very distinctive opener.

### `diagonal-assemble-title` — NEW
- look: the previous scene slices into long strips parallel to a 30° cut line that slide off alternately along the diagonal; title glyphs fly in along the same diagonal from alternating sides, rotating, and land one per 16th note; the title sits split in two halves along the cut, then the halves close with a click (e.g. a key turning in a lock-plate letter).
- params: diagonal 30° from vertical; strips 260 px wide, k = −11…11 (23 strips), strip k delay `0.02·|k|` s, travel `ease-in(seg/0.75 s)·2600 px` in alternating directions; glyph fly-in distance 1500 px along the diagonal, alternate sides, rotation `(1 − p)·±1.2 rad`, ease-out over 0.42 s, landing on consecutive 16ths (132 BPM → 0.114 s apart); split gap 40 px → 0 over 0.08 s on the click.
- build: SVG: snapshot of the outgoing scene repeated in 23 `<clipPath>`-ed groups translated along DIR; title letters as cut-paper paths with per-letter transforms from landing schedule; halves offset ±split/2 along the cut normal. Props: `title (lines)`, `cutAngle`, `strips`, `stripWidth`, `landEvery` (frames), `splitFrom`, `closeAt`, `lockLetter` (index + icon), `colors`. Also usable as transition variant (below).
- source: `styles/spy-titles/demo/film.js` (`sShatter`, title world), `demo/title.js` (split along the diagonal).
- value: logo/name reveals ("the chase ends at the brand"), event openers, trailers — an assemble-the-logo finale with real graphic punch.

### `diagonal` strips variant — EXTENDS `diagonal` transition
- look: instead of one hard 45° wipe, the outgoing frame breaks into N parallel strips along a 30° line that slide away in alternating directions, staggered from the centre.
- params: as above (strip 260 px, stagger 0.02 s by distance from centre, ease-in 0.75 s, travel > diagonal of frame).
- build: add `variant: 'strips'` + `angle`, `stripWidth` to the diagonal presentation (outgoing scene rendered once per strip clip — or once as an image via a CSS `mask` with per-strip transforms, keeping the "render each scene once" rule by using `mask-image` of the strip set on a translated copy… simplest: N clipped copies, acceptable for flat scenes).
- source: `styles/spy-titles/demo/film.js`; STYLE.md §5 ("Shattering").
- value: fragmentation/conspiracy beats, split-screen grids, energetic chapter changes.

### `silhouette-runner` — NEW (character)
- look: a flat cut-paper agent in profile (narrow-brim hat with a slit band, broad jacket, pointed shoes) runs on twos with a strong lean, one red tie streaming back as the only colour; a taller villain in a wide brim and A-line coat (red lining only visible when running) carries a mustard object on a black backing.
- params: ~7 heads tall (villain 1.2×); run cycle 8 drawings over 2 beats; lean 0.3 rad; tie ≈ 65° with travelling-sine ribbon + width wobble; joint slits 1.7 px at shoulder, elbow, hip/hem, knee; hands sharp wedges; no face except a cream eye slit in close-ups; poses: run, walk, flatten-against-wall, look back, leap, freeze.
- build: SVG rig: merge all pieces into one group, cut joint slits with a mask (black lines), outline whole figure with the `cutGap` step; limb angles from an 8-key table sampled at `floor(frame/2)`. Props: `character: 'agent'|'courier'`, `action`, `script` (like box-bot), `accentColor`, `x/y path`, `scale`, `onTwos`, `object` (key/briefcase/logo with black backing).
- source: `styles/spy-titles/demo/chars.js`, `demo/stills/modelsheet.jpg`, DEMO.md "Silhouette figures".
- value: chases, heists, couriers on a deadline, detective explainers; pairs with `type-architecture`, `crowd-bob`.

### `paper-strip` caption — EXTENDS `story-caption-box`
- look: a narrow paper strip with scissor-cut ends, tilted −1°, bottom-left, a small glyph bullet (keyhole), slides in from the left; light strip on dark scenes, dark strip on light scenes.
- params: position (96, 958) px at 1080p; League Spartan 600 44 px; slide 60 px in 0.18 s; hold ≥ max(1.8 s, speech + 0.6 s).
- build: add `variant: 'paper-strip'` with `bullet` (svg), `tilt`, auto light/dark by backdrop luminance.
- source: `styles/spy-titles/demo/film.js` (subtitles), DEMO.md "Titles, subtitles".
- value: subtitles that belong to a cut-paper world; also for craft/papercut motions.

(Graphic match cuts — circle stays at the same centre and size through wheel → roulette → pupil → moon → keyhole, intervals shrinking on brass stabs → EXTENDS `beat-montage` with `mode: 'shapes'` and `lockCircle {x,y,r}`. Stop-time freeze → a generic `freeze: [{from, frames}]` prop on `mix`/Compose layers.)

---

## stained-glass

### style `stained-glass` — Stained Glass (window in a dark stone hall)
- **essence**: cut pieces of coloured glass in dark lead cames with brown grisaille painting, seen from inside a dark stone hall; glass glows only where the sun is behind it and throws a soft coloured patch onto the floor; figures move piece by piece; the travelling light is the clock, the camera and the story. Secular subjects only.
- **palette**:
  - transmittance colours [d]: cobalt `#1d3a9c` (dominant), deep blue `#142a70`, ruby `#a8101c`, gold `#dc9a22`, emerald `#2f7f36`, olive `#6b7a22`, murrey `#632a63`, flesh `#d2a288` (darker than you think), white glass `#cfdac6` (greenish), mail `#a9b7b2`, sky `#7fa2cf`, umber `#7a4e24`, story light ember `#ff9a2a`
  - lead `#1d1f23` [d]; grisaille trace `#2c1a0c` at α .88 [d]
  - room darks `#0e0e0e`, `#090909`, `#17181a`, ashlar `#2d2b33`/`#5a5b64` [m poster]; dusk-lit room `#512710`, `#9a4c1c`, `#c9712a`, gold `#e2da8a` [m frame]
  - sun colour = clock [d]: dawn `#b3d4ff` ×2.2, noon `#fff7e6` ×2.7, afternoon `#ffd699` ×2.35, dusk `#ff9957` ×2.6, moonlight `#8ca8ff` ×0.5
  - roles: bg = dark stone `#0e0e0e`, paper = white glass `#cfdac6`, ink = lead `#1d1f23`, accent = ruby, accent2 = cobalt (two hues carry the picture; gold/green/murrey only as touches).
- **texture / post**:
  - compositor formula: `glass = tonemap(backlight(x,y,t) × transmittance × texture) + weatheringHaze × roomLight`; `surface (stone/lead/iron) = albedo × (ambient + spill from lit panes + point lights)`; `floor = flagstones × (ambient + blurred projected colour patch + halo)`; + additive shafts with dust; bloom where bright glass eats into the lead ("irradiation").
  - **hue-preserving tonemap**: `hp = h·(1 − e^(−l))/l` with luminance l; blend toward per-channel `1 − e^(−h)` only when max channel > .55 (smoothstep .55 → 1.6, × .8) so the sun disc burns white while cobalt stays jewel blue (per-channel alone turns blue pastel).
  - unlit panes: weak sky light ~0.18 + room-lit milky haze (figures ghostly but readable); lit panes: backlight 2.2–2.8× inside a soft, slightly skewed band (`bandW ≈ lancet width + 10`, soft 24–30, skew ≈ .3).
  - per piece: streaks at a per-piece angle, hue drift ±10 %, aged darker edges by the lead, ±9 % thickness; world-space seed bubbles, scratches, thickness clouds (fade small features below 0.6× zoom).
  - Map onto existing steps for images: `posterize 6` → `saturate 1.35` → `edges(#1d1f23, width 3, strength 1)` → `glow(radius 10, amount .5)`; overlays `vignette(.6, #000)`. Better: **NEW step `leadCells`** — segment into hand-cut pieces (jittered lozenge lattice, *not* Voronoi), fill each with its mean colour + streak texture, lead lines between (round joins, thinner on small pieces); **NEW step `hueTonemap`** (feComponentTransfer can't do it exactly; approximate with `saturate` boost after a gamma table, or do it in WebGL); **NEW overlay `lightBand`** {sunU, bandW, soft, skew, color, intensity, outside} — multiplies a soft vertical band (brightness 2–3× inside, ~0.2× outside, skewed) that can travel over any motion.
- **typography**: **Cinzel 600** (incised titles in stone, gilded, revealed by moving light; ≥ 30 px on screen), **IM Fell English** (banderole subtitles ~44 px dark ink), extras in the source's fonts dir: **Uncial Antiqua** (decorative), **Cormorant Garamond**. All OFL Google Fonts.
- **motion rules**: figures **step at 8 fps** (hold 3 frames at 24 fps) on rigid pieces with 2D FK; light, camera, shafts and dust move on ones (stepped light reads as flicker). **Freeze rule**: a pane's figures use `min(t, tLightLeft)` — only the lit pane is alive. Actions land on the beat (80 BPM, beat 0.75 s). Crack: lines race from the impact in ~0.28 s, bright with light, 0.45 s white flash, 2-frame shake. Re-leading: piece groups slide one beat each with a small outward bump along the lead, each ending in a weld spark; cracks become mending lead scars. Expressions change by swapping the face piece; glass never bends, morphs or fades in — it is lit. Transitions: moving light, shafts, a crack, darkness — never a dissolve, wipe or flip. A knife-thin dawn ray opening: bandW 18 → 310, skew .45 → .06 over ~1 s.
- **signature moves**: `light-band-window` (NEW), `glass-crack-mend` (NEW), `floor-light-projection` (EXTENDS `caustics-godrays`), `glass-pane-grid` leaded mode (EXTENDS), banderole captions (EXTENDS `story-caption-box`), carved inscription title (proposed `carved-inscription`, small NEW, = Cinzel incised text + `light-sweep`-style moving strip).
- **do / don't**: do two carrying hues + small touches, darker flesh, texture on every piece, heavy grisaille (trace lines, matting, scraped highlights in the piece's own colour), lozenge quarry backgrounds with a motif each, borders of a ruby band with pearls + white fillet with a running vine, big subjects (1.3–2.3× lancet width in close-up), floor patch blurred/desaturated/haloed/mirrored. Don't use Voronoi/kaleidoscope filters, flat clip-art fills, Tiffany Art Nouveau, mosaic reflections, crosses/saints/halos/religious imagery, red dusk × blue glass (mud — keep blue alive, raise intensity), shafts at full strength at the window.
- **source**: `lemo-opuscar/styles/stained-glass/{STYLE.md,DEMO.md,demo/comp.js,demo/glass.js,demo/window.js,demo/scene.js,demo/story.js,demo/subs.js}` (MIT / CC BY 4.0).

### `light-band-window` — NEW
- look: a tall window (2–5 pointed lancets + a rose) in a dark ashlar wall; a soft band of sunlight travels across it — the lit lancet glows jewel-bright with a coloured shaft and floor patch, the others are dark, milky and ghostly; the sun's colour shifts dawn → noon → afternoon → dusk → moon; only the lit pane's figures animate (others freeze where the light left them).
- params: lit backlight 2.2–2.8×, unlit sky 0.18 + haze 0.5, band width ≈ lancet width + 10 u, soft 24–30 u, skew ≈ 0.3 (dawn ray 18 → 310 u, skew .45 → .06 in ~1 s); sun colours/intensities as palette; rose brightness = clock (dark at night); figures on 8 fps; shafts additive with dust, ≈ 0 at the window, peaking ~40 % of the way down; bloom 0.5; vignette .35; saturation 1.08.
- build: SVG panes per lancet (pointed arch path; quarry lattice background; border band with pearls; subject group from a `panes[]` prop that accepts `src` images or our motions as children), each pane wrapped with a `lightBand` mask: brightness/saturate filter driven by its distance from `sunU(frame)`; shafts = skewed gradient polygons with `mix-blend-mode: screen` + dust motes (reuse `embers` motes); hue-preserving tonemap approximated by bright saturated fills + additive glow. Props: `panes [{src|motion, caption}]`, `lancets`, `rose`, `schedule [{at, sunU, color, intensity}]`, `bandWidth`, `freezeUnlit`, `wall`, `shafts`, `dust`, `title` (carved string course), `seed`.
- source: `styles/stained-glass/demo/comp.js` (backlight band, tonemap), `demo/window.js`, `demo/scene.js`, DEMO.md "Shots".
- value: "light is time": recipe steps, the four seasons of a farm, factory shifts, chapters of a biography, product lineup as lancets — each lit in turn; very strong heritage/holiday look.

### `glass-crack-mend` — NEW
- look: a blow hits a pane: nine jagged white-hot cracks race out from the impact in a quarter second, a white flash and a 2-frame shake, silence; then glass pieces slide along the leads into a new arrangement, one group per beat, each ending in a weld spark, and the cracks turn into dark mending lead lines (scars of the change).
- params: 9 cracks at angles `2πi/9 + rnd·0.5`, segments 14 u with random turn ±0.35 rad, length 70–240 u, 60 % spawn one branch (90 u, segments 12 u, offset ±0.6–1.1 rad); per-crack delay ≤ 0.12 s; grow over 0.28 s; crack stroke 2.6–4.6 u `rgba(255,248,232,.95)` with glow; flash 0.45 s; shake 2 frames; re-lead: 4–5 groups, one per beat (0.75 s at 80 BPM), slide 0.5 s with outward bump, weld spark at landing; mended cracks redrawn in lead `#1d1f23`.
- build: seeded crack generator (deterministic polyline list) drawn with `strokeDasharray` reveal; flash = white overlay α; shake = translate ±6 px for 2 frames; re-lead = per-group translate/rotate keyframes with `back`-style bump; sparks reuse `sparkle-burst` / `star-glint`. Works over any image too: Voronoi-free piece split from the crack lines (pieces = polygons between cracks and the existing grid of `glass-pane-grid`). Props: `impact {x,y}`, `cracks`, `seed`, `crackAt`, `groups [{pieces, to:{x,y,rot}, at}]`, `mend`, `flash`, `src`.
- source: `styles/stained-glass/demo/story.js` (CRACKS, WELDS, crackAfter), STYLE.md §5/§8.
- value: turning points: reinvention of a company, injury and recovery, a building restored, a "before/after" pivot; a premium dramatic beat for any glass/window motion.

### `floor-light-projection` — EXTENDS `caustics-godrays` (beam mode)
- look: tilt down the light shafts to a stone floor where the window's picture lies as a long, soft, coloured patch with lead lines, stretching as the sun sinks; a scene can play inside the patch.
- params: patch blurred (σ ≈ 6–12 px), ~20 % desaturated, multiplied by flagstone albedo (large irregular flagstones, never running bond), halo around it, mirrored (window top lands farthest into the room); patch length ∝ 1 / tan(sun height); shafts additive with dust, near 0 at the window, peak ~40 % down.
- build: add `patchSrc` (image or motion rendered once), `sunHeight`, `stretch`, `desaturate`, `floor: 'flagstones'` props; implement as perspective-transformed (CSS 3D `rotateX`) blurred copy of the source with `mix-blend-mode: screen` over a flagstone pattern.
- source: `styles/stained-glass/demo/scene.js`, `demo/comp.js` (floor), DEMO.md S6–S7.
- value: memory-replay beats, "the picture leaves its frame", data trends drawn by lengthening light; works with any colourful backdrop.

### `glass-pane-grid` leaded mode — EXTENDS `glass-pane-grid`
- look: an image re-made as a stained-glass panel: hand-cut lozenge/organic pieces in flat-ish jewel colours with streaky glass texture, dark lead network, grisaille trace lines from the image's edges, white-glass highlights; backlit with the light band.
- params: piece size 30–80 px (smaller on faces), lead 6 u (4.2 on quarries, 3–4 on details), round joins, faint grey flange, solder blobs at junctions; grisaille trace `#2c1a0c` α .88 2.3–3.8 u; matting wash .35–.45; hue drift ±10 %; streak angle per piece.
- build: add `mode: 'leaded'` to glass-pane-grid: jittered lozenge lattice (shared vertices, slight relaxation) clipped to the frame; each cell filled with the posterised/palette-snapped mean colour of the image under it; streak texture = feTurbulence stretched along the piece angle multiplied inside the cell clip; lead = stroked cell edges; grisaille = `edges` step output tinted brown multiplied on top; backlight via `lightBand`. Props: `cellSize`, `palette` (snap to cobalt/ruby/gold/…), `lead`, `grisaille`, `backlight`, `bandAt`.
- source: `styles/stained-glass/demo/glass.js` (pieces, lead, grisaille, quarries), STYLE.md §2/§9.
- value: turns any portrait or product image into a heritage window; pairs with `light-band-window`.

### `banderole` caption — EXTENDS `story-caption-box`
- look: a parchment ribbon near the bottom with curled ends, gentle sag and a thin rule, unfurling from the centre; text fades in only once ≥ 75 % open.
- params: IM Fell English ~44 px dark ink; ribbon padded well past the text; unfurl ≈ 0.3–0.4 s from centre; hold ≥ max(1.8 s, speech + 0.6 s).
- build: `variant: 'banderole'`: SVG ribbon path whose half-width animates 0 → full, curled-end shapes attached at the ends, sag = quadratic curve, parchment fill `#efe3c4` with darker edge; text opacity ramps after 75 %.
- source: `styles/stained-glass/demo/subs.js`, STYLE.md §4.
- value: medieval/heritage/fantasy subtitles and labels; also usable for maps and certificates.

---

## Summary of techniques in this part

| style | NEW | EXTENDS | COVERED |
|---|---|---|---|
| scifi-toon | swirl-portal, portal-wipe, atomic-orbit-title | scene-tag (terminal), wobble/kinetic-captions (toon-boil) | — |
| shadow-puppet | lamp-screen, press-lift, carved-plaque, hide-carve-patterns, pillar-wipe | — | — (whiteout transition reused) |
| silent-film | intertitle-card, theatre-gate | film-look (print damage), style engine (ink-redraw/hatch), iris (iris-hold) | — |
| silkscreen-poster | screenprint-poster, squeegee-pull, palette-reink, registration-snap | sun-rise-set (stepped bands), map-route (stamped route), thumbnail-mosaic (wall) | — |
| spy-titles | type-architecture, diagonal-assemble-title, silhouette-runner | diagonal transition (strips), story-caption-box (paper strip), beat-montage (shape match cuts) | — |
| stained-glass | light-band-window, glass-crack-mend | caustics-godrays (floor projection), glass-pane-grid (leaded), story-caption-box (banderole) | — |

New style-engine pieces proposed: steps `boil` (wobble seeds cycling), `transmit`, `hatch`, `inkSheen`, `trap`, `bandify`, `cutGap`, `leadCells`, `hueTonemap`; overlays `lampField`, `clothWeave`, `filmDamage`, `theatreGate`, `pinholes`, `inkVoid`, `lightBand`.

---

<!-- part D: lemo-opuscar styles: swiss-motion, teardown, telestrator, tilt-shift, ukiyoe, urban-sketch -->

Source repo: `opus_sources/repos/lemo-opuscar` (code MIT © 2026 LemoLab; STYLE.md / DEMO.md docs CC BY 4.0 — credit "LemoLab / @lemomo_ai, lemo-opuscar"). Everything below is described in my own words; numbers, hexes and one-line formulas are quoted from the source where marked "documented". "Measured" = PIL median-cut values from context.txt (poster / docs frame / styleboard) plus what I saw in the images.

Our engine vocabulary used below: FilterStep = saturate, contrast, brightness, posterize, gradientMap, threshold, pixelate, blur, edges, halftone, lines, misregister, wobble, bleed, grain, tint, glow; overlays = paper, vignette, scanlines, letterbox, deckle, frameLine, filmGrain, leak; `step` (on twos); fonts{display, body}.

---

## swiss-motion

### style `swiss-motion` — Swiss Motion Graphics (International Typographic Style in motion)
- **essence**: flat 2D graphic design on a visible modular grid — one neo-grotesque family, black type and bars, light greys and exactly **one** signal colour. Every element snaps to the grid and lands on a beat; nothing bounces. Rigor with one exception: the single element that disobeys (the red one) becomes the character. Extreme scale contrast (a ~700 px numeral beside 19 px technical notes).
- **palette** (documented unless noted):
  - bg/page `#EAE9E5` (measured 56 % of poster — confirms)
  - paper/artifact `#FFFFFF` (measured 20 %)
  - ink `#111111`
  - accent (signal) `#E30613` (measured `#e30713` — matches)
  - grid line on page `#CFCEC9`, grid while building `#C9C8C2`, grid on paper `#E2E1DC`
  - secondary voice (shadow bars) `#CFCEC9` (measured ~`#cfcec9` area in board)
  - muted text `#8a8984`-ish grey for lead-ins (documented as "grey", value is my estimate)
  - alternates (documented): `#F2F0EA`/`#141414`/signal `#FF5A00`; `#E9ECEF`/`#0B0B0B`/signal `#1F3FFF`. Rule: pick ONE signal hue per film, never add a second.
- **texture / post**: none — the style's identity is the *absence* of texture. Filter chain = `[]` (no grain, no vignette, no glow, no gradients, no shadows). Only overlay we need is a **NEW overlay `grid`** (cols, rows, margin, gutter, color, progress) — 12 columns, ~96 px side margins (5 % W), 24 px gutters, 24 px baseline at 1920; lines draw on along their length (linear), staggered one column per 1/8 note. Pixel hygiene rule: merged rects overdraw 1 px at seams (antialias hairlines show after rotate/scale) — in SVG use `shape-rendering="crispEdges"` for axis-aligned bars or extend each rect by 1 px into its neighbour.
- **typography**: source = **Archivo** (variable 400–800, Google Font) as the one family. Alternatives named in the source: Inter, Schibsted Grotesk, Instrument Sans (all Google). Display: Archivo 700–800, letter-spacing −2.2 % at ≥ 90 px, lowercase headlines allowed; body/notes: Archivo 500 at ~19 px (1.8 % of H) with a 1 px rule above ("caption row"); lead-in 30 px Medium grey + statement 76 px Bold. Giant numerals ~980 px font size (≈ 65 % H figure height), **optically** flush-left (subtract the glyph's left side bearing — in SVG measure via `getBBox()` of the glyph and shift by −bbox.x). The "before/messy" state in the demo used DM Serif Display + UnifrakturMaguntia (Google) to show what the rules clean up.
- **motion rules**: smooth 24 fps on ones (no `step`). **Two curves only**: precise ease `cubic-bezier(.7,0,.2,1)` for every snap, linear for lines drawing, playheads and the exception. No overshoot/spring. Durations are note values at the film BPM (120: 1/8 = 0.25 s = 6 f @24, 1/16 = 0.125 s = 3 f). A snap *starts one note value early and lands on the beat*. Entrances are clip-reveals/wipes (text rises out of a clip rect from below baseline in 1/16, leaves upward in 1/8), never fades. Deletions are knife cuts. Ripples ordered by distance from the cause, two units per 1/16. Visual onsets on whole frames (multiples of 0.25 s at 24 fps). Transitions: wipes, knife cuts, 2D camera moves (hard pan by a page/column, rotate 90° and stop, pull out to a wall, push into one module) — **never dissolves**. Camera = 2D matrix (centre, scale, rotation), moves only with the precise ease, only on beats.
- **signature moves**: `knife-cut` (new), `grid-score` (new), `grid-exception` (new), `stepped-numeral` (extends mask-rise-title), `artifact-wall` (extends thumbnail-mosaic); existing fits: `mask-rise-title` (clip-reveal words), `chapter-header`, `split-compare` (locked spread cause→effect), `typewriter-signature` for tech notes. Transitions from ours: `wipe`, `bar`, `strip`, `push-blur` only without blur (`slide`), never `fade`.
- **do**: frame as a spread (left page = programme: numeral + rule + notes; right page = artifact, poster ratio ≈0.70); derive the artifact grid from content (7 cols × 16 rows in demo, module 91×40 px) and make modules wide enough to give mass; one diagonal with long/short rhythm, red element ~2× scale, bleeds off the paper edge, black type overprinting the red; rotate → hold → *then* label. **don't**: thin-column layouts (reads as a chart), gradients/shadows/grain, Helvetica/Akzidenz files, Bauhaus primary-shape pastiche, flying/spinning words, copying a specific Müller-Brockmann composition, naming real institutions.
- **source**: `styles/swiss-motion/{STYLE.md,DEMO.md,style.json,demo/ease.js,demo/film.js}` — lemo-opuscar, MIT code / CC BY 4.0 docs.

### `knife-cut` — NEW
- look: a thin black (or signal-red) 2 px rule shoots across an element left→right, then the element collapses vertically to its own midline and is gone. Reads like a guillotine/editor's strike-through. Swiss "deletion" grammar; also works as a list-item removal or "budget cut" beat.
- params (documented): line crosses in 1/16 note (0.125 s @120 BPM = 3 f @24) **linear**; collapse `scaleY 1→0` around y = baseline − 0.35·fontSize over 1/8 note (6 f) with `cubic-bezier(.7,0,.2,1)`; line thickness 2 px @1080 (0.19 % H), extends 10 px past each side of the element; line disappears when collapse ends. Ripple: neighbours re-flow into the freed space after it, nearest first, one per 1/16.
- build: wrapper component `<KnifeCut at={frame} lineFrames={3} collapseFrames={6} color axis="horizontal">children</KnifeCut>`. Measure the child's bbox (or take `width/height` props). Line: `<rect x={x0-10} y={mid-1} width={(w+20)*lin(f, at-3, at)} height={2}/>` visible from `at-3` to `at+6`. Content: `transform: translateY(mid) scaleY(1 - E(seg(f, at, at+6))) translateY(-mid)`; unmount after. Optional props `direction` (ltr/rtl/vertical), `reflow` (array of sibling ids that slide with E over 6 f, staggered 3 f by distance). Also expose as a transition type `knife` (outgoing scene cut by a full-width line, then collapses to a horizontal sliver → incoming scene wipes in from that line).
- source: lemo-opuscar `styles/swiss-motion/demo/film.js` (drawPosterText `cut`), STYLE.md §5 (MIT / CC BY 4.0).
- value: a precise, non-fade way to remove text, bullet points, prices, features; transition for editorial/brand films; pairs with `kinetic-captions`, `mask-rise-title`, `split-compare`.

### `grid-score` — NEW
- look: a white poster on a pale page; a modular grid draws on column by column, black bars (one per cell group, adjacent cells merged into long bars) step down a diagonal, light-grey "second voice" bars sit under them; then the whole artifact rotates 90° and stops, row labels (note names) and bar numbers wipe in, and a red playhead line sweeps — each bar turns red on the exact frame it is "played", the red circle pulses an expanding ring when hit. "The poster is the score."
- params: grid lines grow per column at 1/8 note each (linear); rotate 90° over 1.5 beats with precise ease, then hold ≥ 1 beat before labels; labels wipe in 1/16 each; playhead linear at 1 bar per 2 s (120 BPM) — onsets snapped to whole frames; hit ring: radius +70 px with E, stroke 6→0 px; bar width = column − 8 px; demo grid 7 cols (91 px) × 16 rows (40 px) on a 706×1008 poster (≈ 37 %W × 93 %H); labels 19–24 px Archivo 700; palette per style.
- build: SVG in a 2D camera group. Props: `cols`, `rows`, `notes: {col,row,len,voice:'main'|'second'}[]` (or `values[]` → auto staircase), `bpm`, `rotateAt`, `playFrom`, `rowLabels`, `colLabels`, `signal`, `ink`, `paper`, `page`, `circle:{col,row,d}`, `bleeds`. Frame-driven: `gridP(c) = lin(f, t0 + c*E8f, t0 + (c+1)*E8f)` sets `stroke-dashoffset`; bars appear with `snap()` (precise ease over 1/16 landing on their onset); rotation `rotate(90*E(seg(f, rot, rot+1.5*beat)))` about the artifact centre; playhead x = `lerp(x0, x1, lin(f, play0, play1))`; bar fill = signal when `playheadX ≥ barX` (compare on integer frames). Merge consecutive cells into one rect (+1 px overdraw). Data can double as a real chart (cols = categories, rows = time) or a schedule.
- source: `styles/swiss-motion/demo/film.js` (buildUnits, drawUnits, gridState, drawScoreLabels), DEMO.md "Shots"/"Palette & props".
- value: music/audio brand films, event posters, timetables, "your data is the design" reveals, product spec sheets; gives agents a data-driven Swiss poster rather than a generic bar chart (complements `iso-bar-chart`, `live-chart`).

### `grid-exception` — NEW
- look: everything on the grid moves in exact eased snaps; one red circle twitches a quarter-column and snaps back (hesitation), then breaks out — the only linear, unsnapped move in the film — grows as it travels, pauses one eighth mid-flight (a glance back), lands off-grid; a mono coordinate readout beside it flips from `col 5.00 row 0.00 · on grid` (ink) to red `off grid` with non-integer/negative values; the other elements re-flow around it nearest-first; grid lines extend past the poster to fill the frame.
- params: hesitation = +0.25 col over 1/16, back after 0.375 s; flight = 40 % of path linear, pause 1/8 note, remaining 60 % linear; diameter grows ×~2 (demo `circleDiameterCols` stiff→final); a 1.5 px red line traces from the vacated cell to the circle and the empty cell outline shrinks after; reflow = units move 2 at a time per 1/16 ordered by distance from the landing point; readout 19 px mono/Archivo 500, updates every frame with 2 decimals.
- build: `<GridSystem cols rows items={[{id,col,row,w,h,kind}]} exceptionId exceptionPath={[[c,r],[c,r]]} hesitateAt breakAt pauseAt landAt reflowTo={{id:[c,r]}}>`. Snapped items: position = `track(keys)` using precise ease; exception: piecewise linear `flight(t)` with a hold; readout text = `col ${((x-x0)/colW).toFixed(2)} row ${...}`, colour switches when non-integer. Reflow delay per item = `rank(distance)/2 * E16frames`.
- source: `styles/swiss-motion/demo/film.js` (circleState, flight, drawCircle, gridState), DEMO.md arc.
- value: "one product/person that breaks the mould" stories, outlier-in-the-data, launch films; a storytelling primitive agents can map any brief onto (system + one exception).

### `stepped-numeral` — EXTENDS `mask-rise-title`
- look: a giant chapter numeral ("1"…"5") climbs into a clip window in four eased steps ("one module at a time"), sits flush-left bottom-aligned with the artifact, and drops out downward with one ease when the next arrives.
- params: rise = `steps(t, tr, tr+beat, 4)` = each quarter uses its own precise ease (`(i + E(frac))/n`); exit 1/4 note (2× eighth) precise ease; size ≈ 65 % H figure height; optical left alignment.
- build: add `variant: 'numeral'` to mask-rise-title with props `steps` (default 4), `stepFrames`, `exitAt`, `opticalAlign` (default true). Implementation: `y = base + (1 - steppedEase(f)) * clipH + exitE * clipH` inside an SVG `clipPath` rect.
- source: `styles/swiss-motion/demo/ease.js` (`steps`), `film.js` (drawNumeral).
- value: chapter cards for listicles ("Rule 3", "Step 4"), countdowns with a mechanical, non-bouncy feel.

### `artifact-wall` — EXTENDS `thumbnail-mosaic`
- look: rotate back from the hero artifact while pulling out to a wall of sibling artifacts generated by the same rules (same grid, different data/colours); then a red line strikes across and the siblings are cut away from the side the line enters, pushing back to the hero.
- params: pull-out with precise ease over 1–2 beats; wall of 3×2–4×3 posters at uniform gutters; cut wipe follows the line in screen space; siblings drawn only while the wall shot is live (avoid leaking into other shots).
- build: new `layout: 'wall'` in thumbnail-mosaic with `hero` index, `variants[]` (each a props object for any motion, e.g. `grid-score`), `cutAt`, `cutColor`; camera group `scale(lerp(1, 1/n, E))`.
- source: DEMO.md "Shots" (scale reveal, ending), `film.js` drawVariant/drawWallLabels.
- value: brand-system/identity reveals ("one programme, many outputs"), product ranges, series covers.

---

## teardown

### style `teardown` — Exploded Teardown (studio packshot taken apart)
- **essence**: a real product built from its own engineering data, photographed (PBR, studio key + cool rim, contact shadow) on a dark graphite seamless and taken apart in front of a constantly travelling camera: layers lift on one axis with even gaps, the camera orbits outside and dives between layers, every part carries a measured number on a leader line, then it closes again and dimension lines are drawn on it in perspective.
- **palette**:
  - bg ground: radial sweep `#34363a` (centre) → `#0d0e10` (edge) — documented; measured image mostly `#050608` / `#08090b` / `#0f1013` / `#16171a` (the sweep reads darker than documented because of the vignette — use documented values + vignette 0.35)
  - ink (labels, names) `#f1efe9` at 100 %; spec text same ink at ~60 % (`rgba(241,239,233,.6)`); leader lines ink at ~0.35–0.6 α — documented
  - accent `#ff6b3d` (index numbers, dimension lines, one matching product detail — the 1.5u key) — documented (measured accent pixels `#c77464`, `#8b2c1e` = shaded orange key + red-brown switch stems)
  - product neutrals (demo): keycap off-white `#d9d4c9`, grey `#686c73`, plate dark grey `#333131` (measured), case/metal mid grey `#86898a` (measured), PCB green mask with gold pads, brass spacers
  - dimension text plate `rgba(14,15,17,.72)`
- **texture / post**: real-time 3D look; for our engine as a filter chain over a three.js render: `contrast(1.05)` → `glow` (threshold high, emitters only: LEDs) → overlay `vignette` (0.35) → `filmGrain` very light (0.03) or none. DOF: one aperture for wide + macro (CoC ∝ |1/focus − 1/z|, so macro gets blurrier naturally) — in three.js use BokehPass with focus = camera–target distance each frame, maxblur clamp ~0.01. Background = **NEW backdrop `studio-sweep`**: screen-space radial gradient `#34363a → #0d0e10` centred slightly above frame centre + `ShadowMaterial` floor (opacity 0.38) so only the soft contact shadow shows. Lights: warm key from above-front, cool rectangular rim behind that **follows the camera azimuth** (rim at azimuth + ~150°), soft top light, low-intensity HDRI/RoomEnvironment for reflections. Lift near-black plastics to dark grey so rim light separates them.
- **typography**: names = clean sans 500 at 28–32 px (source: Noto Sans SC 500 for Chinese; Latin running text **Inter**, end-card title Inter Light); specs, indices, dimensions = **JetBrains Mono** 400–500 15–22 px. All Google Fonts. Index = two digits in accent ("01"), name, one spec line with units (mm, MB, ×n).
- **motion rules**: 24 fps on ones, fully smooth and deterministic. Separation: ease-in-out-cubed feel — source uses `pop(x) = 1 − (1 − smoothstep(x))³` for lifting (fast start of motion, long settle), layers leave **top first** 0.15–0.2 s apart (demo UP times 5.00/5.31/5.47/5.63/5.78/5.94 s, lift duration 1.25 s); repeated parts (keys) lift in a **wave ordered by distance from a corner** (wave spread 0.45 s). Closing: **bottom first**, quicker (1.0 s per layer, wave 0.36 s), each key lands with a small dip `y −= 2.2·sin(πu)·(1−u)` over 0.45 s (a mechanical settle, not a rubber bounce). While held apart, layers float ±1.3 units with phase offsets, but freeze during macro stops. Labels draw in (dot, ring expands 6 px, leader grows over 0.38 s, text slides 10 px and fades in 0.32 s starting at +0.18 s) and fade out (0.3 s) **before parts move again**. Camera: one continuous move, keyframes interpolated with a **monotone cubic** per component (no overshoot, held macros really hold); orbit outside, dive between layers, rise through the stack, fast pull back; view offset (`camera.setViewOffset`, shift 140–170 px) keeps the object left and frees a label column on the right. No cuts to black, no slide transitions, no split screens — transitions are camera moves through the object. Hits on beats/half-beats (demo 96 BPM).
- **signature moves**: `exploded-stack` (new), `leader-label-column` (extends callout-labels), `perspective-dimension` (extends callout-labels), `studio-sweep` backdrop (new, small); existing fits: `wireframe-build` (part-by-part 3D build), `flat-to-3d-sphere` callouts, `number-counter` for spec numbers on an end card.
- **do**: subject ≥ 1/3 frame height at key moments; labels in a fixed column x on the free side; one fact per label; every number sourced (keep a FACTS list); plain package tops (no logos); one real mechanical motion (a key stroke 4 mm down 0.08 s, held, back up). **don't**: glass-product beauty render with no disassembly, blueprint line drawing, keynote slides, assembly-manual arrows/hands, invented numbers, rubbery bounces, Catmull-Rom camera overshoot, text on bright busy parts without a dark plate, over-bright light sweeps.
- **source**: `styles/teardown/{STYLE.md,DEMO.md,demo/src/main.js,overlay.js,timeline.js}` — lemo-opuscar, MIT / CC BY 4.0. (Demo geometry from foostan/crkbd, CC BY 4.0 — not something we reuse.)

### `exploded-stack` — NEW
- look: a stack of flat layers (plates, boards, cards, UI panels, product images on thin slabs) sitting as one object on a dark seamless; on the hit they lift apart along one axis top-first with a short stagger, repeated small parts (keys/icons/chips) rising in a ripple wave across the surface; the camera orbits ~40° while it opens; hold with a gentle float; then bottom-first closing with each small part landing with a tiny mechanical dip.
- params (documented demo values, scaled): layer offsets in units of total stack height (demo OFF = 0/10/18/34/50/70/80/92/116 mm for 9 layers → roughly 1.3–1.5× the closed height between neighbours); up stagger 0.15–0.2 s; lift duration 1.25 s with `pop`; wave across parts 0.45 s ordered by `hypot(x − corner.x, y − corner.y)` normalised 0..1; close 1.0 s/layer, wave 0.36 s, land dip 2.2 units·sin(πu)(1−u) over 0.45 s; float `e²·1.3·sin(2.4t + phase_k)`; orbit az −31° → +18°, elevation 26° → 14°, distance pull-back ×1.15 during the lift; label column at 72 % W.
- build: three.js scene (`@remotion/three`), props: `layers: [{kind:'slab'|'image'|'grid', w, d, h, color, src?, gap, parts?: {count|positions, size, color}}]`, `openAt`, `closeAt`, `stagger`, `wave`, `orbit:{from,to}`, `elevation`, `float`, `labels: [{layer, name, spec, idx}]`, `accent`, `background` (studio-sweep), `keystroke: {part, at, depth}`. Per frame: `lift_k = OFF_k * pop(seg(f, up_k + rank*wave, … + dur)) * (1 − eio(seg(f, down_k + rank*wave, …)))`; camera from monotone-cubic key track (implement Fritsch–Carlson on each of eye.xyz/target.xyz/fov); project label anchors with `vector.project(camera)` to draw 2D overlay (see `leader-label-column`). Images as slabs = `BoxGeometry` with the image as top-face texture (`MeshPhysicalMaterial`, clearcoat 0.3) so any host product screenshot/PCB photo can be exploded.
- source: `styles/teardown/demo/src/main.js` (layerE, gapE, capY, camera track), `src/timeline.js` (UP/DOWN/OFF/WAVE), STYLE.md §5–6.
- value: hardware/product launches, "what's inside" explainers, layered software architecture (UI → API → DB as slabs), feature stacks on landing pages (export to mp4/webm for heavy 3D on mobile).

### `leader-label-column` — EXTENDS `callout-labels`
- look: on each part a small ink dot with a thin ring expanding round it; a hairline leader runs diagonally then horizontally to a label column on the free side; label = accent two-digit index (mono), name (sans 30 px), spec line (mono 17 px, 60 % ink). Labels cascade down the column, then fade before the layers move.
- params (documented): dot r 3.2 px, ring grows +6 px; leader 1.3 px, α ≈ 0.35–0.6; leader draw 0.38 s ease-out; text starts +0.18 s, fades/slides 10 px over 0.32 s; stagger 0.16 s between labels; out 0.3 s; index 15 px mono accent at (lx, ly−6); name 30 px at ly+4; spec 17 px at ly+30; leader ends 34 px before the text with a 14 px horizontal run.
- build: add `variant: 'column'` with props `items: [{anchor:[x,y] | anchor3d, idx, name, spec}]`, `columnX`, `align`, `stagger`, `outAt`, `accent`, `ink`; for 3D hosts accept a `project(anchor3d)` callback or pre-projected per-frame anchors so leaders stay glued to moving parts. Path = polyline (anchor → elbow(columnX − dir·34, ly) → columnX − dir·14) drawn by `stroke-dasharray` progress.
- source: `styles/teardown/demo/src/overlay.js` (`label`), STYLE.md §4.
- value: spec sheets, product feature callouts, annotated screenshots — a more premium, measured look than our current typed callout.

### `perspective-dimension` — EXTENDS `callout-labels`
- look: on a closed object, accent-coloured dimension lines between two real 3D points, drawn outward from the midpoint, with 45° tick marks at both ends and extension lines; the measurement sits on a small dark plate, rotated to the line's angle but never upside down, with an optional grey caption above.
- params (documented): grow 0.55 s ease-out from midpoint; ticks ±6 px at (angle − 45°); line 1.4 px accent; text JetBrains Mono 500 22 px, plate `rgba(14,15,17,.72)` padded 8 px, 30 px tall, offset −34 px from the line; text fades in from +0.35 s over 0.3 s; caption 16 px sans grey at −42 px; stagger 1 beat between dimensions; angle normalised to (−90°, 90°].
- build: `variant: 'dimension'` with `dims: [{a:[x,y,z] | [x,y], b, ext?: [[p,q]], text, sub}]`, `at`, `stagger`, `accent`. For 2D hosts (an image of a product) take screen points directly; for 3D, project each frame.
- source: `styles/teardown/demo/src/overlay.js` (`dimension`).
- value: hardware sizes, architecture plans (complements `plan-tilt`, `line-draw-on`), "it's only 11 mm thin" product beats.

### `studio-sweep` — NEW (small backdrop)
- look: dark graphite photographic seamless — a soft radial gradient with a floor implied only by a soft contact shadow under the subject; optional slow light sweep (a narrow softbox gliding across the subject at ~0.3 of the key's intensity).
- params: centre `#34363a` at (50 %, 42 %), edge `#0d0e10`, radius ~0.9·W; shadow ellipse α 0.38 blurred ~3 % W; light sweep 4.2 s, intensity `sin(π u)^0.7`.
- build: SVG `radialGradient` + blurred ellipse; props `center`, `edge`, `shadow`, `sweep`, `focus`. Overlay-capable backdrop for any `src` product PNG (alpha) or 3D motion.
- source: `styles/teardown/STYLE.md` §2–3, `demo/src/main.js` (sweep light).
- value: instant premium packshot background for product cut-outs, logos, 3D motions.

---

## telestrator

### style `telestrator` — Sports Telestrator (pundit's analysis board over real footage)
- **essence**: TV sports-analysis packaging over real footage: watch the play, rewind, freeze with a white flash and punch, desaturate, and draw on the picture — rings under feet, glowing marker arrows, a red patch for the uncovered space, a one-line label — then play on, split angles, count frames, and finally flatten the pitch into a top-down board. Studio energy held together by a corner bug, score bar and a yellow slanted wipe.
- **palette** (documented roles; keep the three roles even if hues change):
  - accent / "us" + ball + main marker `#FFD400` fluorescent yellow
  - accent2 / opponents `#3FD8FF` cyan
  - accent3 / space `#FF3B30` red (fill α 0.34–0.38 + dashed edge)
  - chalk (traced lines, neutral marks, stamps) `#F4F1E8`
  - board bg `#0C1411` ink green-black with faint 60 px grid
  - card / bug bg `rgba(8,12,14,.9)`, opaque `#080C0E` over logos
  - measured footage: pitch greens `#36431f` `#536536` `#2b371a` `#62713c`, card black `#0b0d0f`, yellow-over-grass blend `#aba359` (spotlight/ring glow on grass). Freeze grade = cooler/desaturated versions of these.
- **texture / post** (map to our FilterStep): live footage grade = `saturate(0.9)` → `contrast(1.04)` → `brightness(0.97)` (gamma proxy) → `tint('#0a161e', mode:'multiply' ~0.05)` (cool shadows) → overlay `vignette(0.38)` → `filmGrain(0.02)`. **Freeze state** (animated, see technique): `saturate(0.58)` (desaturate 42 %) → `tint(rgba(10,22,30,.16), 'normal')` → `vignette(0.58)`. NEW overlay `spotlight(cx, cy, rx, ry, dark=0.42)` (even-odd hole). Slow-mo needs frame blending (cross-fade adjacent source frames by the fractional part) — `<OffthreadVideo>` + a second offset copy at α = frac.
- **typography**: labels: **Noto Sans SC 900** 40 px (Latin alternative with same punch: **Barlow** 800/900 or **Archivo Black**); small spaced English line **Barlow Condensed 600** 21 px, letter-spacing 2 px in role colour; packaging numbers (score, minute, stopwatch, big data) **Barlow Condensed 800 Italic**; clock/frame numbers **IBM Plex Mono 500** 24 px; subtitles Noto Sans SC 500 38 px over Barlow Condensed 600 32 px, black bar 0.64 α with 4 px yellow edge. **No handwriting fonts** (that reads as school notebook). All Google Fonts.
- **motion rules**: 30 fps (demo), on ones. Order inside one piece of action: live 1× → rewind (0.6 s, ease-in-out, ±13 px horizontal jitter, 4 white tracking bars, big ◀◀ + REWIND) → freeze ① → slow play 0.6–0.85× (frame-blended) → freeze ② → … → ball comet → other angle. Freeze 1.8–2.4 s, 2–4 freezes per action, one finding per freeze, draw order ring (who) → area/link (what) → label (finding) 0.3–0.6 s apart. Between segments only the packaging wipe (0.34 s); inside a segment hard cuts; no dissolves/page turns. Trails keep only last ~0.6 s (ball 0.24 s). Stamp (e.g. VAR) once per film: framed card 1.7× → 1× with overshoot, slight rotation, small flash. Comparison boards held ≥ 2.5 s. Overlays share the picture's punch transform.
- **signature moves**: `telestrator-freeze` (new), `marker-ring-arrow` (new overlay), `perspective-flatten` (new), `broadcast-package` (extends hud-chrome), `package-wipe` (extends diagonal transition); existing fits: `split-compare` (dual-angle freeze → extend with `layout:'dual-freeze'`), `stamp-slam` (VAR stamp), `number-counter` (data card big numbers), `glitch-image`/`glitch` transition for the tape rewind, `scene-tag` for camera labels.
- **do**: show the play moving before explaining; rings under feet (ellipse ry = 0.36 r); labels in empty grass/crowd never over the action; one colour = one identity across the whole film; numbers only from frame counts or a fitted homography (mark interpolated with "≈"); packaging present from frame 1 when it hides a broadcaster logo. **don't**: abstract diagram before the flatten, highlight-reel montage, copying any broadcaster's logo/font/colour/graphics, freezing on identifiable spectators, stating ball speed/distance the footage can't support, handwriting fonts.
- **source**: `styles/telestrator/{STYLE.md,DEMO.md,demo/index.html,demo/timeline.json}` — lemo-opuscar, MIT / CC BY 4.0 (demo footage is third-party CC BY; not reused).

### `telestrator-freeze` — NEW (image/video)
- look: footage (or a still `src`) freezes with a white flash and a tiny zoom punch, colour drains and cools, everything outside a focus ellipse darkens; a yellow ring draws clockwise under a subject's feet with a rotating dashed outer ring and a faint light beam; a glowing marker arrow draws along a path with its arrowhead popping at the end; a red translucent "space" patch with dashed edge; a black label card wipes open with a coloured left bar; then play resumes.
- params (documented): flash 0.1–0.12 s, α 0.55–0.65 → 0; punch scale 1.035 → 1.0 over 0.35 s ease-out, then creep +1.2 % over the hold; desaturate 42 %, cool overlay `rgba(10,22,30,.16)`, vignette α 0.38 → 0.58; spotlight outside ellipse α 0.42 fading in 0.3 s; ring: ellipse ry = 0.36·r, fill role-colour α 0.19, 11 px black α .5 under 6 px colour stroke with 16 px glow, drawn clockwise from 12 o'clock with ease-out; outer dashed ring 1.32·r, dash [16,14], `dashoffset = −60·t` px/s, 3 px, α .85; beam = trapezoid from ring up 3.2·r, colour α .33 → 0; label card h = 40+21+30 px, left bar 8 px, wipe-open with ease-out; hold 1.8–2.4 s.
- build: `<TelestratorFreeze src | videoSrc freezeAt holdFrames focus={{cx,cy,rx,ry}} rings={[{x,y,r,color,at,beam}]} arrows={[{pts,color,at,dash,arrow}]} areas={[{poly,at}]} labels={[{x,y,title,sub,color,at}]} slowmo={{from,to,rate}} />`. Picture + overlay in one `<g transform>` carrying the punch scale (about the focus point) so lines stay glued. Freeze uses `<OffthreadVideo startFrom>` → `<Img>` of the freeze frame (or `<Freeze>` from Remotion). Grade via our style engine steps (saturate/tint/vignette) animated by `freezeK = seg(f, at, at+6)`. Spotlight = SVG path `M0,0H W V H H0Z` + ellipse with `fill-rule="evenodd"`. Tracking for moving subjects: keyframes `track[name] = [[frame,x,y]...]` linearly interpolated (source frame space), with a `debug` prop that paints all points magenta.
- source: `styles/telestrator/demo/index.html` (ring, marker, tag, grade, spot, flash), STYLE.md §6, §9.1–9.2.
- value: sports, gameplay, UX-recording teardowns ("freeze the screen recording and circle the button"), product demos, coaching, CCTV-style explainers — very reusable over any host footage or screenshot.

### `marker-ring-arrow` — NEW (overlay-capable accent)
- look: broadcast-marker annotations without the freeze: glowing fluorescent arrows (solid for what happened, dashed for intended), a perspective ring with rotating dashes, a fading comet trail behind a moving point.
- params: marker = dark outline (w + 6, black α .55) + colour core w (6–9 px @1080) with glow blur 18 + white highlight w·0.28 α .55; drawn along length (linear or ease-out); arrowhead pops over the last 10 % with ease-out, size 3.2·w; deterministic vertex wobble ±2–3 px; comet = last 6 source frames sampled every 0.25 f, segment alpha and width ramp (4 → 18 px) toward the head, glow 20; trail window ≤ 0.6 s.
- build: SVG: three stacked `<path>`s sharing `pathLength=1` and `strokeDasharray` progress (for dashed lines use a mask path drawn with progress over a dashed stroke); glow = `feGaussianBlur` stdDev 6–8 merged under the core; arrowhead = `<polygon>` at the tip rotated to the last segment's angle. Props: `items: [{type:'arrow'|'ring'|'comet'|'area', pts|x,y,r, color, at, dur, dash, wobble}]`, `palette` (roles). Pure overlay — transparent background.
- source: `styles/telestrator/demo/index.html` (marker, partial, ring, comet, trail).
- value: annotating any video, map, chart or UI capture; a punchy alternative to our pencil/blueprint annotation looks.

### `perspective-flatten` — NEW (image)
- look: a perspective photo of a plane (pitch, floor, desk, street, whiteboard, map on a table) un-tilts smoothly into a straight top-down board; the photo fades as a chalk diagram board takes over, and dots/markers (from this and other shots) drop onto the board at their true positions.
- params (documented): flatten over 0.9 s (37.35–38.25 s in demo) with ease-in-out; mesh cell 1.5 m (≈ 20–30 px on the board) → ~1000–2000 triangles; homography fitted by least squares from 6–8 known points (residual ≤ 6 px OK); markers drop 0.2 s apart; board `#0C1411` with chalk lines `#F4F1E8` and a 60 px grid; triangles expanded 0.8 px from their centroid to hide seams.
- build: props `src`, `imagePoints: [[x,y]…]`, `boardPoints: [[u,v]…]` (same order, ≥ 4), `at`, `dur`, `grid` (cells), `board` (SVG children or preset 'pitch'|'court'|'floor'), `markers: [{img:[x,y] | board:[u,v], color, at}]`. Compute H (DLT, 8×8 solve) from board→image; for each mesh vertex in board space, imagePos = H·v, finalPos = boardToScreen(v); position at progress p = lerp(imagePos, finalPos, E(p)). Render in a `<canvas>` (`useCurrentFrame` → draw each triangle with `ctx.setTransform(affine from 3 source pts to 3 dest pts)` + clip, as the source does), or three.js plane with per-vertex UV = imagePos/size and animated vertex positions (simpler, GPU). Picture α = 1 − seg(p, .6, 1); board α = seg(p, .4, .9).
- source: `styles/telestrator/demo/index.html` (`drawTri`, `shotMap`), `demo/tools/homography.py` concept, STYLE.md §9.7.
- value: turns any oblique photo into a map/plan — sports shot maps, floor plans from a room photo, a whiteboard photo straightened into a clean diagram, real-estate site plans. Strong "how did they do that" moment.

### `broadcast-package` — EXTENDS `hud-chrome`
- look: TV packaging: top-right corner bug (show name on a yellow block + a mode line LIVE ● red / ANALYSIS yellow / REPLAY cyan), bottom-right score bar `HOME n – n AWAY  67′` whose number rolls on the goal frame with a yellow flash, top-left source clock `❚❚ 04.20s F106` (▶ ½ in slow-mo, ◀◀ in rewind), and a frame-counting stopwatch that stops and turns yellow on the event.
- params (documented, @1920×1080): bug x 1452–1880, y 38–110; score bar x 1392–1880, y 926–996; clock x 40–370, y 38–90; number roll 0.5 s; stopwatch = (sourceFrame − startFrame)/fps shown to 2 decimals, ticks every 0.2 s; numbers Barlow Condensed 800 Italic, clock IBM Plex Mono 500 24 px.
- build: add `theme: 'broadcast'` to hud-chrome with props `show`, `mode` (keyframed `[[frame,'live'|'analysis'|'replay']]`), `score: {home, away, minute, goals: [{frame, side}]}`, `clock: {fps, sourceFrameAt: (f)=>number, state}`, `stopwatch: {start, stop}`, `accent`, `modeColors`. Score digit roll = translateY within a clipPath over 0.5 s E + rect flash α .6→0 over 0.3 s.
- source: `styles/telestrator/demo/index.html` (bugTop, bugScore, stopwatch), STYLE.md §2, §9.3–9.5.
- value: sports, esports, live-event recaps, "breaking analysis" product videos; consistent show branding for series content.

### `package-wipe` — EXTENDS transition `diagonal`
- look: a fat fluorescent-yellow slanted band with thin dark edges sweeps across the frame and swaps the scene behind it — classic sports-show bumper wipe.
- params (documented): duration 0.34 s centred on the cut, x from −900 to W+900 px with ease-in-out; shear −0.38 (≈ 21°); band 520 px wide; dark edge 40 px on the leading side, 18 px on the trailing side `#0B0F14`; colour = role accent `#FFD400`.
- build: add `variant: 'band'` to the `diagonal` transition with props `color`, `edgeColor`, `bandWidth`, `shear`, `edges: [lead, trail]`; scene swap when the band's centre crosses frame centre (clip incoming scene with a polygon following the band's trailing edge).
- source: `styles/telestrator/demo/index.html` (`wipe`).
- value: high-energy segment changes for sports/gaming/news shorts; a branded stinger with zero assets.

---

## tilt-shift

### style `tilt-shift` — Tilt-Shift Miniature
- **essence**: a real-looking place seen from high above through a tilted lens — only a thin horizontal strip is sharp, everything above/below melts into blur — plus saturated, sunny "freshly painted model" colour and time-lapse motion that steps like wind-up toys while the camera glides smoothly. The world reads as a tabletop model.
- **palette** (place-dependent; demo values documented, measured as noted):
  - bg/ground asphalt `#4b4e53` (documented); measured shaded asphalt reads blue `#04274a` / `#05294c` — confirms "shadows stay blue"
  - park/greens `#6fa24a` (documented); measured `#1e6d5c`, `#297363`, `#588e71` in shade, bright tree tops ≈ `#8fd14a` (seen)
  - facades: warm white/cream, terracotta `#c8673a`-ish, brick, pale yellow, mint, sky blue (documented as names; measured dusk poster `#6f504b`, `#913f1d`, `#b58f76`)
  - water/pond `#2f78c8`-ish (seen); car accents red/yellow taxi/blue
  - dawn fill `#ffb48c`; sign panel green `#0f5e3c`; clock amber `#ffb000`-ish (documented "amber") and real-time green
  - night/dusk measured `#201834`, `#355169`, `#27314e` (low saturation states)
- **texture / post** (our engine): `saturate(1.55)` → `contrast(soft +0.42)` (source uses a soft-knee curve `c·(1+k)/(1+k·c/(c+.5))`) → `tint(warm highlights 1.07,1.0,0.88 @ ~0.3)` → **NEW FilterStep `bandBlur(y, width, amp, tilt, pow)`** → `glow` (threshold ~1.1, only lights/windows at night) → overlay `vignette(0.3)` → `filmGrain(0.01)`. `bandBlur` algorithm: CoC(px) = sign(dy)·amp·(max(0,|dy| − w)/0.5)^pow with dy = (uv.y + tilt·(uv.x − .5)) − bandY; demo w = 0.055 (0.035 for intimacy), amp 30 px, pow 1.2–1.3, clamp 30 px. SVG implementation: stack 4 copies of the content blurred at stdDev 0, 3, 8, 15 (or feGaussianBlur in the filter) and blend each through a horizontal-band mask (linearGradient with stops at bandY ± w, ± w+Δ…), i.e. a discrete approximation of the CoC ramp; in WebGL do a 64–128-tap golden-angle spiral gather with per-pixel random rotation (`th = i·2.39996 + hash·2π`, `r = maxCoc·sqrt((i+.5)/N)`) and do not let far samples blur over near sharp ones. Band position animates to follow a subject (project subject to screen each frame → bandY).
- **typography**: **Overpass** 600 (Highway-Gothic revival, Google) for in-world sign subtitles 44 px white on a green `#0f5e3c` rounded road-sign panel with inset white keyline and a tiny traffic-light icon; **Overpass Mono** for the time-lapse clock (`07:12` + small seconds, `×24 TIME-LAPSE` amber / `×1 REAL TIME` green). Titles live in the world (neon roof sign, letters lighting one per 1/8 note — our `neon-sign`).
- **motion rules**: **time-lapse stutter is the soul**: the world (cars, people, lights, sun) updates at a low rate — 8 Hz (= 3 frames held at 24 fps = a 1/16 note at 120 BPM) when rate ≥ ×6, 12 Hz between ×2 and ×6, smooth below ×2 — while the **camera moves on every frame**. Implement as `tq = t0 + floor((t − t0)·hz)/hz` fed to actors only. World clock = ∫ rate dt (pre-integrated), so speed ramps are continuous (demo ×40 → ×1 over 1.5 s with smoothstep, back up over 0.6 s). Hero actors get art-directed timing through beat times; close-up acting = anticipation squash (0.28 s) → stretch → land squash → settle, with one failed attempt before success. Cuts on the beat, speed ramps, dives and rises; avoid dissolves (they reveal the fake lens). Camera: high oblique 45–55° pitch, 27–30° vFOV, 100–200 m; straight top-down slowly rotating; continuous dive to actor height with a speed ramp; logarithmic vertical rise (40 → 820 m) as the scale reveal.
- **signature moves**: `tilt-shift-lens` (new image motion + bandBlur step), `toy-town-traffic` (new), `timelapse-clock` (extends number-counter), `long-exposure-trails` (new); existing fits: `neon-sign` (in-world title), `ken-burns` (slow slide over a plate), `city-skyline`, `topdown-terrain` (pair with band blur), `time-of-day-grade` (dawn → day), `parallax-landscape`.
- **do**: pitch ≥ 45°, low/mid-rise buildings so streets show; route the subject on the camera-side lane; make the subject the one saturated thing inside the sharp band; cheat the sun per shot (front-light facades); keep shadows blue and clean; drop to real time on one detail and cut the music to silence. **don't**: street-level views (except a deliberate low close-up with blurred foreground), toy/clay shading, game-UI flatness, grey backlit scenes, real landmarks/brands, long dissolves.
- **source**: `styles/tilt-shift/{STYLE.md,DEMO.md,demo/post.js,demo/main.js,demo/story.js}` — lemo-opuscar, MIT / CC BY 4.0.

### `tilt-shift-lens` — NEW (image category; also a style step)
- look: any aerial/high-angle photo or video (or one of our 3D/top-down motions) turns into a miniature: a thin sharp horizontal (optionally tilted) band, progressive blur above and below, punchy saturation, slight warm highlights, vignette; the band can slide to follow a point and narrow to a sliver for emphasis; optional slow drift.
- params: band centre `bandY` 0–1 (default 0.55), half-width `w` 0.055 (0.035 narrow), blur amp 30 px @1080 (2.8 % H), falloff pow 1.2–1.3, tilt −0.3..0.3, saturation 1.55, soft contrast 0.42, vignette 0.3, follow keyframes `[[frame, y]]` eased; drift scale 1.00 → 1.04.
- build: `<TiltShiftLens src|children bandY w amp pow tilt follow saturation contrast vignette drift>`; SVG/CSS approach: render `children` 4× — sharp, blur(4), blur(12), blur(24) px — each masked by `mask-image: linear-gradient(...)` stops computed from bandY/w/pow so each layer covers its ring of the CoC ramp (tilt via rotating the mask gradient angle); grade with our engine steps. WebGL option for 3D motions: post-pass gather as in the style section. Frame-driven `bandY = interpolate(frame, follow)`.
- source: `styles/tilt-shift/demo/post.js` (cocShader band term, gather, grade), STYLE.md §2.
- value: makes any city/drone/real-estate/event footage or our `city-skyline`, `topdown-terrain`, `iso-blocks-3d` renders look like a model town — cheap, high-delight, broadly reusable; ideal "style" toggle for hosts.

### `toy-town-traffic` — NEW (environment)
- look: a seeded top-down (or 50° oblique) grid town — blocks with rooftops, parks with round trees and a pond, crosswalks, lanes — with dozens of little cars that flow, queue at red lights and surge on green, pedestrians gathering at corners; all actors step at 8 Hz while the camera rotates slowly; tilt-shift band over it.
- params (documented demo): lights cycle (96 s real, compressed by time-lapse rate) with offsets so changes land on bar lines; IDM-style car following (keep gap, accelerate to v0, brake behind leader); "don't block the box" rule; inflow density ramps to gridlock at the peak; crowds = closed-form gather on red / surge on green; stepping 8 Hz (×≥6), 12 Hz (×2–6), smooth (<×2); camera rotation slow (~3–6°/s); car colours white/silver/black/red/blue/yellow taxi; trees bright `#8fd14a`, asphalt `#4b4e53` (blue in shade), crossings white.
- build: SVG or three.js instanced boxes. Pre-compute per-lane car positions deterministically for the whole duration in `useMemo` (simple 1-D follow-the-leader sim per lane at 1/30 s steps from a seed) and look them up at `tq` (stepped time). Props: `seed`, `blocks` (cols, rows), `density` (or keyframes), `rate` (time-lapse curve), `stepHz`, `lights` (cycle, offsets), `rotation`, `view: 'top'|'oblique'`, `heroCar` (path + colour + `band follow`), `palette`, `band` (tilt-shift params), `clock` (timelapse-clock overlay on/off). Speed ramp `rate(t)` 40 → 1 lets a host stage the "real-time detail" moment.
- source: `styles/tilt-shift/demo/traffic.js`, `story.js`, `main.js` (stepT), DEMO.md "Palette & props".
- value: mobility/logistics/smart-city/real-estate explainers, "rush hour" metaphors for queues and load (a SaaS traffic graph as a city), satisfying loops for backgrounds; nothing in our catalog animates traffic systems.

### `timelapse-clock` — EXTENDS `number-counter`
- look: a compact clock readout `07:12` with small seconds and a speed tag below: amber `×24 TIME-LAPSE` that rolls through rates, switching to green `×1 REAL TIME` on the drop.
- params: clock = start + ∫rate dt (pre-integrated table, 1 ms steps in source); tag colour amber → green when rate < 2; mono font Overpass Mono; 28–36 px clock, 16 px tag; dark rounded plate α 0.7 (seen in frame top-left).
- build: add `mode: 'clock'` to number-counter with props `clockStart` (seconds since midnight), `rate` keyframes `[[frame, rate]]`, `format` ('HH:MM' + small ss), `speedTag` on/off, `tagColors`. Value computed by cumulative trapezoid sum over frames (deterministic).
- source: `styles/tilt-shift/demo/story.js` (windows, rate curves, pre-integration), DEMO.md "Titles".
- value: any time-lapse, "a day in…", process speed-ups, render/build progress in product videos.

### `long-exposure-trails` — NEW (fx, overlay-capable)
- look: at dusk/dawn moving lights (headlights, tail-lights, lanterns, boats) leave glowing streaks that draw over the scene — the hero car's light trail is the opening image.
- params: trail length = last N seconds of the light's path (1–4 s of world time; under time-lapse that is long), width 2–6 px core + 12–20 px additive glow, colours warm white `#fff1c9` heads / red `#ff3b30` tails; alpha fades toward the tail; positions sampled at stepped or smooth time.
- build: props `paths` (array of polylines or a function of time), `count`, `colors`, `trail` (seconds), `width`, `glow`, `rate` (time-lapse), `background` (overlay over `city-skyline`, `toy-town-traffic`, or an image). Each frame: sample the path from t − trail to t, draw as SVG `<path>` with a `linearGradient` along it (or many short segments with ramped α), blend `screen`/`plus-lighter`.
- source: STYLE.md §8 "Long-exposure light", DEMO.md (dawn car trail).
- value: night-city intros, logistics routes, "data packets" metaphors, festive lantern scenes.

---

## ukiyoe

### style `ukiyoe` — Ukiyo-e (Edo woodblock print)
- **essence**: every shot is a complete woodblock print — washi paper with fibres, a thick + thin ink border, flat colour areas printed from separate blocks slightly **out of register** with a black key-line block, woodgrain and baren-rubbing texture in large fills, hand-wiped **bokashi** gradients in skies and water, a vertical title cartouche and a red seal. Depth comes from stacked horizontal layers, mist bands and bold cropping, never from shading or perspective.
- **palette** (documented demo pigment set; measured confirms the blue/tan dominance):
  - paper `#eee2c6` (washi base; measured `#e3d3b6`, `#e9dcc0`, `#f3e8cb`); fibres light `#fbf6e9` / dark `#c7b893`
  - mount (scroll backing) `#c9b690` (measured `#c3ab7f`, `#bfa47d`)
  - ink / sumi key block `#231f1c`
  - accent (dominant hue family) Prussian blue `#1d3a66`, dark `#13284a`, light `#4d6f98`, deep trough `#0f2344` (measured `#213351`, `#35547d`, `#42576f`)
  - pale blues `#8db0c6`, `#bcd0d6`
  - accent2 (rare) beni red `#b8412f`, pale beni `#e3a08a`, peach `#efc4a8` (seals, sun, cartouche tab, dawn bokashi)
  - ochre / straw `#cf9f4a`, `#c9a45c`
  - greens `#8aa152`, `#50703c`, pine `#3e5a3a`
  - indigo cloth `#2c4a70`, `#1d2c44`
  - cartouche `#f3e7c6`; end-card bg `#161a22`
- **texture / post** (our engine + NEW steps): base = `posterize(6–8)` → `gradientMap(discrete pigment ramp: sumi, prussian dark, prussian, light blue, pale blue, green, ochre, paper)` → `edges(ink #231f1c, ~2.4–3 px @1080)` → `misregister` per colour block (demo offsets: blues (2.2,−1.3), greens (−1.8,1.9), reds/figures (1.5,2.2) px @1080) → overlay `paper(#eee2c6, amount, fiber)` with fibre α ≈ 0.09 → `frameLine` (double border: 3.4 px + 1 px 9 px outside, inset 2.3 % × 3.5 % of frame) → `deckle` light. NEW steps needed:
  - **`woodgrain(scale, angle, alpha 0.1–0.17)`**: iso-lines of a warped noise field `u = y·0.035 + fbm·9 (+ sin(x·0.0021)·1.4 + knot bumps)`; thin dark line where `|frac(u) − .5|·2 > 0.8`, plus a broad band term `0.5 + 0.5·sin(0.9u)` at α 0.28 → composite `source-atop` on colour areas only (SVG: `feTurbulence` type=fractalNoise baseFrequency "0.002 0.03" → `feComponentTransfer` discrete/table creating periodic bands → `feComposite operator="in"` with SourceAlpha → multiply).
  - **`baren(alpha 0.38)`**: ~260 blurred circular arc strokes (r 40–210 px, width 14–54 px, blur 7 px) + ~70 zigzag rubs, used as `destination-out` on colour blocks → uneven ink density (SVG: pre-rendered texture `<image>` used as `feComposite operator="out"` mask at low α).
  - **`speck` (goma-zuri, alpha ≈ 0.3; key block 0.12)**: sparse random pixels with probability 0.02 + 0.32·fbm³·⁵ punched out of ink (SVG: high-freq `feTurbulence` → `feComponentTransfer` alpha threshold → `out`).
  - **`bokashi` overlay(color, top, bottom, a0, a1, rough 20–30 px)**: vertical gradient whose top edge wanders per column by low-frequency noise (±20–30 px) — never stacked strips (seams). SVG: linearGradient rect displaced by `feDisplacementMap` from 1-D-ish turbulence (baseFrequency "0.006 0") scale ~40.
  - **`kasumi` overlay**: long rounded mist bands, horizontal gradient 0 → a (12 %) … a → 0 (88 %), optional vertical fade.
- **typography**: subtitles **Shippori Mincho** 500 (Google) 42 px sumi on a cream horizontal cartouche (2.6 px + 1 px ink border, small red seal left), 72 px above the bottom; vertical view titles in **Yuji Syuku** 400 (Google, brush) in a vertical cartouche with a pale-beni series tab; Latin title on the poster appears to be a sturdy Mincho/serif (use **Shippori Mincho B1** or **Zen Old Mincho** for Latin; spaced small caps for the sub-line). Titles live on the print as cartouches and seals, never floating type.
- **motion rules**: prints are still — most of the frame does not move; 1–2 small actions per view. **Figures and nature on 8 fps (hold 3 f), rain and fast water 12 fps, camera on ones (24 fps)** — a stepped camera judders. Printing reveal: each block ~0.3–0.34 s, revealed by a noisy diagonal baren-sweep mask (12 discrete mask levels from fbm + diagonal ramp), sliding 5–6 px into registration while it lands (offset × (1 − smoothstep(reveal·1.6))). Cartouches drop in (fade + 14 px slide); seals stamp (scale 1.35 → 1 in 0.2 s). A native move needs ~1 s held to read. Camera: locked frame; handscroll slide right → left through a 260 px mounting gap (durations accelerating 1.0 → 0.9 → 0.6 s for urgency); very slow push 1.00 → 1.065; tilt past the border into the mount; crash-zoom into the texture; pull-back to the whole scroll; hard cut to a blank sheet (ma). No cross-dissolves, no 3D flips. Our `step` option should apply to subject layers only, not the camera group.
- **signature moves**: `woodblock-print-reveal` (new), `frame-breakout` (new), `handscroll` (extends slide transition), `seal-cartouche` (extends stamp-slam), `print-wave` (new); existing fits: `rain` (two sets of fine straight lines at slightly different angles, 12 fps), `flock` (geese), `falling-petals`, `ken-burns` (slow push), `woodcut`/`ink-wash` styles are related but different (no colour blocks).
- **do**: paper is the white (foam, snow, mist, blank sky are unprinted paper); one dominant hue family (Prussian blue) for sky and water, red rare; far layers pale and low-contrast, near layers saturated with dark key lines; fields as parallel slanted layers (never converging perspective); pines as flat needle pads; figures small (80–130 px at full sheet), flat, clear silhouette; seals `source-over` on dark grounds. **don't**: copy a famous print (no Great Wave, Red Fuji, Ōhashi shower compositions), flat vector with only a paper overlay, ink-wash bleeding, anime cel shading, perspective grids, sandpaper-level specks (keep α ≈ 0.3) or fibres (≈ 0.09).
- **source**: `styles/ukiyoe/{STYLE.md,DEMO.md,demo/print.js,demo/views.js,demo/wave.js,demo/main.js}` — lemo-opuscar, MIT / CC BY 4.0.

### `woodblock-print-reveal` — NEW (image / text / any layers)
- look: on a blank washi sheet the black key-line block prints first, then each colour block lands one by one — revealed by a ragged diagonal sweep like ink taken up under the baren, sliding a few pixels and snapping into (slightly imperfect) register; woodgrain and specks visible in every block; finally the cartouche drops and the seal stamps.
- params (documented): per block ~0.34 s (0.22 s for subtitle cartouches); 12 quantised reveal levels; reveal mask = diagonal ramp `1 − (x/W·0.75 + y/H·0.25)` + fbm noise·0.55 thresholded with a 0.06 soft edge; landing slide from (5, −4) px into the block's final registration offset (1.5–2.5 px off-key), eased by smoothstep(reveal·1.6); block order key → blues → greens → reds/figures; hyōshigi-clap timing accelerating per block; seal stamp scale 1.35 → 1 in 0.2 s.
- build: `<WoodblockReveal blocks={[{layer: ReactNode|src, color?, reg:[dx,dy], at}]} keyLine={ReactNode|'auto'} paper texture={{grain,baren,speck}} cartouche seal>`. Auto mode for an image `src`: derive blocks by `posterize` + per-band `gradientMap` masks (k colour bands → k SVG masks), key = `edges` threshold. Each block: `<g mask=url(#reveal-k)>` where the mask is a pre-rendered noise ramp image whose threshold steps with `Math.floor(reveal*12.999)` (deterministic, no per-frame noise) + `transform=translate(reg + shift*(1-ss(min(1,reveal*1.6))))`. Texture via the new style steps (woodgrain/baren/speck) clipped to each block.
- source: `styles/ukiyoe/demo/print.js` (buildTextures reveal masks, stampLayer, inkify), STYLE.md §5, §8.
- value: "printing" any logo, illustration, map or product shot into existence; strong Japanese/heritage/craft brand openers; generalises to any multi-layer reveal (riso, screen-print styles).

### `frame-breakout` — NEW (layout/fx)
- look: a framed print (or card, phone, photo) sits on its mount; the subject inside grows and pushes out past the top border into the mount area while the rest stays clipped inside — then the camera tilts up into the mount to follow it, holds the "frozen" crest outside the frame, and pushes in.
- params (documented climax beats): rise ~1.9 s (camera tilts past the top border and widens so the figure shrinks), hang ~1.2 s (crest outside border, jitter ×0.25, nearly frozen), fall ~1.2 s (lip rotates toward lens, claws ×2.5, camera push to 3× with small roll), foam ~0.7 s (bursts to full screen, fades to bare paper) → hard cut to blank sheet hold ≈ 1.8 s. Breakout layer clipped only on left/right/bottom (to the frame), unclipped on top — must escape both sheet clip and frame clip.
- build: `<FrameBreakout frame={{x,y,w,h,border}} mount color subject={ReactNode|src} breakEdge="top" growAt hangAt fallAt camera={{tilt,push,roll}}>`: two copies of the subject — one inside `clipPath(frame)` and one in a `clipPath` that is the frame extended upward to infinity (left/right/bottom still bound) — layered above the border; camera as an outer `<g transform>` keyframed with the precise curves. Props `breakEdge` (top/right/any), `jitter`, `endWash` (fade to paper colour).
- source: `styles/ukiyoe/DEMO.md` (climax), STYLE.md §6 "Tilt past the border", §8 "The frame is an object", pitfalls (double clip).
- value: thumbnail-style "pop out of the frame" moments for any framed media (product breaking out of a phone screen, a character leaping out of a comic panel, a chart line breaking its axis box). Very reusable.

### `handscroll` — EXTENDS transition `slide`
- look: prints sit side by side on a long tan mounting scroll with a wooden roller at one end; the camera slides right → left through the mounting gap to the next sheet; successive slides get faster.
- params (documented): mount `#c9b690`, gap 260 px @1920 (13.5 % W) between sheets; slide durations 1.0 / 0.9 / 0.6 s accelerating; easing smooth in-out; camera on ones; end = pull-back to the whole scroll (2 s).
- build: add `variant: 'scroll'` to `slide` with props `gap`, `mountColor`, `direction: 'rtl'`, `roller` (bool), `durations` sequence; render both scenes as sheets (with optional `frameLine`) on a shared mount strip and translate the strip.
- source: `styles/ukiyoe/DEMO.md` "Shots", STYLE.md §6.
- value: journeys, step-by-step processes, timelines, galleries, recipe steps — any series of stills.

### `seal-cartouche` — EXTENDS `stamp-slam`
- look: a vermilion square seal with cut-out characters and chipped edges stamps beside a vertical cream title cartouche (thick + thin border, pale-red series tab); horizontal cartouche variant for subtitles.
- params: seal scale 1.35 → 1.0 in 0.2 s (≈ 5 f @24), `source-over` (not multiply) on dark grounds; seal colour beni `#b8412f`; cartouche fill `#f3e7c6`, borders 2.6 px + 1 px sumi; drop-in = fade + 14 px slide over ~0.3 s; vertical text Yuji Syuku, size 50 px, series tab 27 px.
- build: add `keywordStyle/variant: 'seal'` to stamp-slam (props `sealText` 1–4 chars, `sealSize`, `chip` seed, `cartouche: {title, series, orientation}`); chipped edges = seal square path with noise-displaced edge (`feTurbulence` + `feDisplacementMap` scale 3) and characters as knock-out text (`mask`).
- source: `styles/ukiyoe/demo/print.js` (sealCanvas, drawSeal, cartouche, vtext), STYLE.md §4.
- value: Japanese/East-Asian themed titles, artisan/food/tea brands, chapter stamps; also works as a premium "approved" stamp.

### `print-wave` — NEW (environment)
- look: an original woodblock wave (not the Great Wave composition): a tall wall of water in three banded blues with bokashi between bands, grouped white flow lines following the back slope, a foam rim along the crest, fractal claws (each claw splits into 3 fingers, each finger splits again, all tips hooking inward) with a pale-blue back layer, and spray in clusters (one big dot, a few medium, many small); background sea as banded rows of curls.
- params (documented): bands light blue (near crest) → Prussian → deep trough `#0f2344`; flow lines in groups of 3, long broken arcs; claw roots tapered to ~40 % width and buried in foam blobs (stroke all blobs, then fill all → one union outline); animation: swell rise, hang with jitter ×0.25, lip rotation; nature motion on 8 fps, fast water 12 fps.
- build: SVG procedural: wave outline = normalised curve (back slope → crest → lip → curl → hollow) scaled by props; bands = inward offset strokes of the back-slope curve (only the gentle side, to avoid self-intersection); claws = recursive function `claw(p, dir, len, depth)` producing tapered filled strokes (variable-width polygon from the centreline: half-width = w·(0.25 + 0.75·taperProfile)·(1 ± 0.22 noise)); seeded. Props: `height`, `crestAt`, `bands` colours, `clawDepth` (2–3), `spray`, `seed`, `stepFps` (8), `breakout` (pairs with frame-breakout), `paper`.
- source: `styles/ukiyoe/demo/wave.js`, DEMO.md "Props → The wave" and pitfalls.
- value: dramatic climax/backdrop for Japanese-themed content, "a wave of …" metaphors (sales surge, data flood); fills a gap — we have no stylised wave/ocean.

---

## urban-sketch

### style `urban-sketch` — Urban Sketch · Pen & Wash
- **essence**: a sketchbook page drawn on location: a thin sepia fineliner line that wobbles, overshoots corners and skips, with loose transparent watercolour glazed on top — misregistered 1–3 px from the line, spilling over it, pooling darker at dried edges, granulating into cream cold-press paper — and the painting fraying into leaf-sized dabs at the page edge. Line and wash, both, always; colour can be withheld and arrive as an event.
- **palette** (documented demo; measured as noted):
  - paper `#f5eede` (measured `#f2ebd9`, `#f0e9d7`, `#f5eedc` — confirms warm cream)
  - ink `#2b2520` dark sepia at 96 % coverage (never changes)
  - lawn `#c3c96f` / light band `#dcd98b` / shade dabs `#7f9c52` (measured wash-over-paper results `#a0a172`, `#bcb887`, `#797e51`, `#acb283`)
  - foliage ramp `#d6d56f` → `#aabf57` → `#7fa04a` → `#56793c` → `#3f5d36`
  - sky `#9fbcd6` / `#86a6c8` at 10–20 % α; cloud belly `#b7b3c9`
  - buildings: limestone `#d8c6a0`, ochre `#cfaa72`, glass `#98b1c8`, brick `#c49a7a`; shadow = local colour mixed 45 % with violet-grey `#5a5f82`; distance mixed 50 % with haze `#b9c0cc`
  - figure shadow violet `#464873`; path `#d8ccb1`
  - accent (the one coloured thing): straw `#d9b26a`-ish (seen; hat) — choose any single saturated local colour
  - alternates (documented): harbour (sea `#7fa6b8`, hulls `#c9573f`, rope `#c8a86b`, sky `#bcd0dc`); winter market (roofs `#8b93a6`, lights `#e2b04a`, awnings `#b8483e`, snow = paper)
- **texture / post** (our engine + NEW): line layer = `edges(ink #2b2520, ~1.3–3.4 px)` → `wobble(scale ~1 px, low frequency, boil only on figures)`; wash layer = `saturate(0.8)` → `posterize(5)` → `blur(1)` → `misregister(dx 2, dy 2)` (wash offset from line by 0.7–1× line width) → multiply over paper; then `grain` as granulation (`pigment × (0.82 + 0.36·fbm(p·0.21))`) → overlay `paper(#f5eede, mottling ±4.5 % at 0.0011 & 0.0062 cycles/px, tooth)`. NEW pieces:
  - **NEW FilterStep `lineAndWash(ink, offset, edgeDark 0.3–0.4, rough 4–12 px)`**: split the source into an ink layer (edges) and a wash layer (simplified colour), roughen the wash boundary with `feTurbulence` + `feDisplacementMap` (scale 4–12), darken the wash rim (dried tide line: wash − `feMorphology erode r≈2` → multiply darker at 30–40 %), offset the wash, multiply onto paper, ink on top. Existing `watercolor` style lacks the separate misregistered ink line; `pencil-sketch` lacks wash.
  - **NEW overlay `fray(edgeNoise ±80 px, band 70 px)`**: painting stops before the page edge with a noisy boundary (fbm 0.004), a band of white dabs inside and a spray of coloured dabs outside — the "sketchbook vignette". Differs from `deckle` (paper edge) — this frays the *paint*.
  - **wet front** (for colour arrival, see technique): reveal smoothstep over 0.16 s of arrival time, front band darkened +70 % (Gaussian at +0.07 s, σ 0.08 s), slight wet sheen decaying over 0.55 s.
- **typography**: all text is handwriting on the page, written left → right with pen sound, moving with the camera: corner note in **Reenie Beanie** (day, time, weather, place, e.g. small 24–30 px); titles and colophon in **Caveat** 500–600 (title 190 px in the lower-left margin). Both Google Fonts. Subtitles, if any: handwritten lines in the margin, never an overlay box.
- **motion rules**: page and static ink do not boil (it's a real page); **figures boil at 12 fps** (line wobble and wash seeds change every 1/12 s = every 2 f at 24); camera moves every frame, smoothly. Designed moves with cubic easing; follow shots use a critically damped spring on a lead-ahead target (stiffness 28; 70 for a fall) so the camera lags like a hand-held follow; punch-in with 0.35 s shake on impact; whip-tilt with slight roll; pull back to the whole page as end card (page 5120×2880 shown at 0.375×). Anything that appears is drawn in stroke order; colour never snaps — it blooms from a point (noisy circular clip) or arrives through the field. Invisible forces drawn: wind = ink curls spawning on each beat, drawing on in 0.4 s, erasing from the tail, with trailing leaf dabs. Footsteps on the beat (run cycle = 2 beats). Transitions: camera travel on the page, page turns (our `page-turn`), colour arriving — no dissolves.
- **signature moves**: `wash-arrival` (new), `fineliner-draw-on` (extends line-draw-on), `ink-wind-curls` (extends flow-lines), `carrot-crowd` (extends crowd-bob), `fray` overlay (new); existing fits: `handwrite-on` (with Caveat/Reenie Beanie), `page-turn` transition, `ken-burns` (pan over the page), `sprout-grow`, `perspective-grid` (pencil-hatch cousins), `heart-draw-fill`.
- **do**: leave margins and fray the edge; keep paper white as the brightest value (reserves for highlights and figures, a faint paper halo around a small key object); few pigments, shadows mixed toward one shared violet; ink suggests (a few window ticks, scalloped tree fragments) rather than describes; subjects ≥ 1/3 frame height at story beats; "the one coloured thing" for a protagonist. **don't**: paint edge to edge, line-free wet-in-wet (that's watercolor), marker/explainer diagrams (whiteboard), brush calligraphy (ink wash), straight bbox edges in colour reveals, colour that pops on.
- **source**: `styles/urban-sketch/{STYLE.md,DEMO.md,demo/engine.js,demo/film.js,demo/world.js}` — lemo-opuscar, MIT / CC BY 4.0.

### `wash-arrival` — NEW (image / scene)
- look: a scene sits as a pure ink sketch on cream paper; colour spreads outward from one or more sources (a moving object, a point, a sunrise line) like watercolour flooding wet paper — an irregular cauliflower-shaped front with a darker pooled tide line just behind it, granulation and a brief wet sheen — so whatever an event touches becomes painted; figures stay frozen line drawings until colour reaches them.
- params (documented): per-cell arrival time `T = s.t + min(d, R)/v + max(0, d − R)·creep` (creep 0.028 s/px beyond reach radius R; d = distance with vertical stretch `sy` + noise offset); noise offset per cell = fbm at 0.0024 cycles/px × amp 170 px + fbm at 0.011 × 0.35·amp; per-pixel jitter fbm at 0.0032/0.021/0.09 (±0.35 s, ±0.11 s, ±0.03 s); reveal = smoothstep(0, 0.16, now − T); front = exp(−((dt − 0.07)/0.08)²) adds +70 % pigment; wet sheen +12 % decaying with τ 0.55 s; granulation ×(0.82 + 0.36·fbm(p·0.21)); grid e.g. 160×90 cells for 1920×1080. Clip by the noisy distance, never a bounding box.
- build: `<WashArrival line={src|ReactNode} color={src|ReactNode} sources={[{x,y,t,v,R,sy,path?}]} paper="#f5eede" ink="#2b2520" amp creep front>`. Precompute the arrival field `Float32Array` in `useMemo` (deterministic seed), upload as a small canvas texture; per frame in WebGL (three.js ShaderMaterial on a full-screen plane, or a `<canvas>` 2D with `getImageData` at 1/2 res): `out = paper · (1 − pig)` with `pig = (1 − colour)·rev·(1 + 0.7·front + 0.12·wet)·gran`, then multiply ink. Without WebGL: build an SVG mask from iso-contours of the field at the current time (marching squares on the coarse grid → smoothed path), blur 2 px, plus a darker stroke of the same contour for the tide line. For a moving source (`path`), add samples along the path with t = time at that point. Line version of an image `src` can come from our `edges` step; colour version = the image through the `lineAndWash` wash layer.
- source: `styles/urban-sketch/demo/engine.js` (arrivalField, compositor shader), DEMO.md "Palette & props", STYLE.md §8.
- value: "colour follows the product/runner/sunrise" storytelling, before/after reveals (sketch → finished render) for architecture and real estate, onboarding illustrations that come alive; a fresh alternative to `xray-scan` and `duotone` reveals.

### `fineliner-draw-on` — EXTENDS `line-draw-on`
- look: lines draw in stroke order like a 0.3–0.5 mm fineliner: slightly wobbly, overshooting corners by a few px, tapering, occasionally skipping (a small gap mid-stroke), never quite closing shapes.
- params (documented): width 1.3–3.4 px (thinner far, thicker near); taper profile `w·(0.55 + 0.45·sin(π·clamp(1.1u − .02))^0.35)·(0.85 + 0.3·noise)`; wobble 0.9–1.3 px (two noise octaves, low freq 0.018/px); overshoot 3–8 px (start extended by 0.5·over, end by over, along the tangent); one 3–9 px gap in 30–60 % of strokes longer than 60 px (placed at 25–75 % of length); stroke speed as needed; erase-from-tail option (`from`).
- build: add `pen: 'fineliner'` to line-draw-on with props `wobble`, `overshoot`, `gapChance`, `taper`, `seed`, `erase` (tail-erase progress), `boil` (re-seed every N frames, default off; 2 for figures at 12 fps). Precompute per stroke a resampled polyline (step ≈ 1.4·w) with normal-offset wobble, then draw as variable-width polygon (or many short segments with per-segment width) up to `progress·L`, skipping gap ranges. Ink colour `#2b2520` default.
- source: `styles/urban-sketch/demo/engine.js` (penStroke, drawPen, rasterPen).
- value: upgrades every sketch-type motion (plans, products, icons, handwriting) to a convincing hand-drawn reportage line; reusable across `line-draw-on`, `heart-draw-fill`, `perspective-grid`, `plan-tilt`.

### `ink-wind-curls` — EXTENDS `flow-lines`
- look: wind drawn as little ink "~@" curl strokes that spawn behind a moving object on every beat, draw on, then erase from their tail, with a trail of leaf-shaped wash dabs tumbling after.
- params (documented): spawn every beat; draw-on 0.4 s; erase from tail after; curl = short wavy line ending in a loop; leaf dabs 5–20 px, foliage colours, rotate and fall; ink `#2b2520`, fineliner widths.
- build: add `mode: 'ink-curls'` to flow-lines with props `followPath` (points or a function of frame), `spawnEvery` (frames or `bpm`), `drawFrames`, `life`, `curlSize`, `dabs` (count, colours), `ink`. Each curl: precomputed fineliner stroke (see above) placed at the path position at spawn time, drawn with `progress = seg(f, s, s+drawFrames)` and `from = seg(f, s+drawFrames, s+life)`.
- source: `styles/urban-sketch/STYLE.md` §5, DEMO.md "Motion as used".
- value: wind, motion, sound or scent cues in illustrated explainers and children's/lifestyle content; makes invisible forces legible.

### `carrot-crowd` — EXTENDS `crowd-bob`
- look: distant crowds sketched as "carrot people": one vertical wash blob (body colour), two short leg lines and a head dot — dozens of them along a path or lawn edge, boiling lightly at 12 fps.
- params (documented): one wash blob + two leg ticks + head dot; colours from the palette's local hues, shadow side toward violet `#464873`; scale by depth; boil every 2 f at 24 fps; static ink must not be overlapped by later washes, which is why far crowds use this cheap form.
- build: add `character: 'carrot'` to crowd-bob with props `colors`, `ink`, `boil`, `density`, `depthFalloff`; each person = rounded-rect wash path roughened (displacement 1–2 px) + 2 fineliner ticks + 3 px dot; reuse crowd-bob's row/column layout, crane and stomp-hop timing.
- source: `styles/urban-sketch/STYLE.md` §8, DEMO.md pitfalls.
- value: event, city, station and "community" scenes in the sketch style at near-zero cost; also usable in `walker-world-scroll` and `map-route` backdrops.

---

## Counts (this part)
- Styles: 6 (swiss-motion, teardown, telestrator, tilt-shift, ukiyoe, urban-sketch).
- Techniques: 27 total (NEW 15, EXTENDS 12, COVERED 0):
  - NEW (15): knife-cut, grid-score, grid-exception, exploded-stack, studio-sweep, telestrator-freeze, marker-ring-arrow, perspective-flatten, tilt-shift-lens, toy-town-traffic, long-exposure-trails, woodblock-print-reveal, frame-breakout, print-wave, wash-arrival
  - EXTENDS (12): stepped-numeral→mask-rise-title, artifact-wall→thumbnail-mosaic, leader-label-column→callout-labels, perspective-dimension→callout-labels, broadcast-package→hud-chrome, package-wipe→diagonal, timelapse-clock→number-counter, handscroll→slide, seal-cartouche→stamp-slam, fineliner-draw-on→line-draw-on, ink-wind-curls→flow-lines, carrot-crowd→crowd-bob
  - COVERED (0 listed as techniques; noted inline: tilt-shift's in-world neon title = `neon-sign`, ukiyoe rain = `rain`, VAR stamp = `stamp-slam`, dual-angle split = `split-compare`).
- New engine pieces proposed: FilterSteps `bandBlur`, `woodgrain`, `baren`, `speck`, `lineAndWash`; overlays `grid`, `spotlight`, `bokashi`, `kasumi`, `fray`; backdrop `studio-sweep`.

---

<!-- part E: lemo-opuscar styles: visual-investigation, watercolor, white-model, whiteboard, woodcut (+ _template) -->

Source repo: `opus_sources/repos/lemo-opuscar` by LemoLab / @lemomo_ai. Code MIT, docs (STYLE.md / DEMO.md) CC BY 4.0.
Everything below is written in our own words from reading STYLE.md, DEMO.md, style.json and skimming the demo
code, and from looking at poster.jpg, docs/frames/<s>.jpg, styleboard/img/<s>_0.jpg and demo/stills. Nothing was executed.
Palette tags: **[doc]** = hex given in the source docs/code, **[meas]** = from the PIL measurements in context.txt
(or read off the images), **[derived]** = computed from a documented blend (e.g. α-over-ground).

Counts for this part: 5 styles. Techniques: 13 NEW, 10 EXTENDS, 0 COVERED (one or two sub-moves noted as covered inline).

---

## visual-investigation

### style `visual-investigation` — Visual Investigation (forensic evidence desk)

- **essence**: a cold, near-black investigation desk where footage, photos, document scans, sound waveforms and drawn
  schematics from one real event sit on one shared clock and are made to agree. The palette is greyscale evidence and a
  single red that only ever *points* (circles, links, highlights, playhead, ✓ badges, the converging zone).
  It is a layout and grade language, not a texture style. Do not confuse it with satellite-briefing, archive-lighttable,
  halftone-dossier, a newsreel package (no bug, no ticker) or a keynote (no centred title slides).
- **palette**
  - bg / ground `#0B0C0E` [doc] — measured `#0b0c0e` at 51–63 % of every image [meas] ✓
  - panel `#141619` [doc] (measured `#161619` / `#101113` [meas])
  - hairline / frame `#2E3238` [doc]
  - ink / text `#ECEAE4` [doc] (lightest measured `#f2f2f2` [meas])
  - secondary text `#8B9097` [doc]; ticks / *uncertain* / unplayed waveform `#4A4F57` [doc]
  - **accent (the only colour): `#FF4A2E`** [doc]. Zone fill = accent at α 0.5 over ground → `#85291E` [derived]; this matches the
    measured saturated accent `#832a1d` [meas]. Multiply highlight (α 0.6) on a grey doc → about `#D9705E` [derived]
    (measured `#cc7e72` [meas]).
  - paper card (typeset telegrams) `#E4E0D4` with ink `#1D1D1B` [doc]
  - grey photo midtones measured `#cac9c8`, `#86807e`, `#7d7877` [meas] (these come from the greyscale sources, not the UI)
- **texture / post-process recipe** (apply to *media only*, never to type or lines)
  - footage and photos: `saturate 0` → `contrast 1.22` → `brightness 0.94` (all existing FilterSteps).
  - document scans: `saturate 0` → `contrast 1.05` → `brightness 0.86` (white paper pushed down to light grey ≈ `#DBDBDB`).
  - maps: `saturate 0` → `brightness 0.62` → `contrast 1.1` (optionally inverted) so they read as dark line drawings.
  - grain: six 256² Gaussian tiles (value = 128 + (r+r+r−1.5)·120), one per frame (frame % 6), blend `overlay`,
    α 0.22 on footage/photos, 0.10 on paper, none on maps → our `filmGrain` overlay, but **scoped to image layers**.
  - **NEW engine concept: `mediaSteps` / style scope "media"** — a StyleDef field whose filter chain is applied only to
    `src`/`images` layers of image motions (ken-burns, duotone, glitch-image…), while UI, type and drawn lines stay
    clean. Without it, the global SVG chain would grain and grey the red accent too.
  - **NEW overlay `cutFlash {rect, frames: 4}`**: a white rectangle over a panel whose α goes 1 → 0 in 0.12–0.14 s;
    every element "cuts in" this way (opacity ≤ 0.1 s plus the flash).
  - No vignette, no letterbox, no paper, no glow.
- **typography**: headings and findings Noto Sans SC 700 (30–124 px) for CJK; for Latin use **Inter** or **Noto Sans 700**;
  tags, timecodes, ticks **IBM Plex Mono** 400/600; original quotes **Source Serif 4 Italic**; translations Noto Serif SC 500 in
  the secondary colour. All Google Fonts. Source tag = 6×12 px chip + `type · source` in mono 16 px, 600 weight, tracking 1,
  ≤ ~12 characters, sitting just above its frame. Lower third: red bar + place name 36 px bold + one mono line.
  Subtitles at the very bottom (CJK baseline y≈984, Latin y≈1022 at 1080p), 34/23 px, black 10 px shadow, one line per language.
  Reading hold: CJK chars/4.5 + Latin chars/15 + 1.5 s; verdict frames ≥ 2.5 s.
- **motion rules**: 30 fps, on ones. Elements **cut in** (≤ 3 frames of opacity + 4-frame white flash); nothing flies,
  bounces or scale-pops (the only scale is the ✓ badge 1.3 → 1 in 0.18 s). Only *drawn* things are progressive: circles
  clockwise in 0.5 s ease-out cubic, leaders/links 0.4–0.8 s, plans stroke by stroke, highlights wiped L→R, telegrams typed.
  The "camera" never moves; only a slow push *inside* a picture (≤ 1.06× on photos, ≤ 1.9× on maps). Layout changes on
  hard cuts on a 0.5 s grid. Something changes at least every second; holds only for verdicts. The event clock eases
  between keyframes and runs at constant speed inside a timed run (one tick = one real second). Transitions: `cut`,
  `flash` (existing) and a proposed **`rewind`** transition (NEW): the outgoing footage plays backwards (57 frames in 0.4 s
  in the demo) under 7 white 2 px horizontal scan bars at α 0.6·progress, bar y = (frame·37 + k·131) mod frameHeight.
  Forbidden: dissolves, page turns, centred slides, slow motion of a catastrophe.
- **signature moves**: `evidence-ring` (EXTENDS callout-labels), `evidence-board`, `sync-grid`, `doc-highlight`,
  `dot-tally` (all proposed below); a data chart with a red playhead that carries the clock and event bands → EXTENDS
  `live-chart` (new mode `playhead`: event bands labelled with one word, message pins tied by red dashed leaders to cards);
  `number-counter` for the big `T+xx.x` readout; `hud-chrome` must NOT be used (no channel-bug look).
- **do**: one finding per layout; ≤ 5 sources on a board; mark inference with `≈`, *inferred*, dashed boxes; let a late
  source simply appear late; keep content in y 60–900 with 60 px margins and full height (no reserved timeline band).
- **don't**: empty "no footage" placeholder boxes (read as render errors); English twins under every label; grain on type;
  colourised archive; more than one hue; full-screen flames; sound on deaths.
- **source**: `lemo-opuscar/styles/visual-investigation/{STYLE.md,DEMO.md,style.json,demo/index.html}` (MIT code, CC BY 4.0 docs).

### `evidence-ring` — EXTENDS `callout-labels`
- look: a freeze frame slams in with a 4-frame white flash; a 2.5 px red circle draws itself clockwise from 12 o'clock;
  at 60 % a diagonal leader and a bold label come out; a red-framed ×2 loupe opens beside it showing the same source
  pixels, joined to the circle by thin red dashed lines.
- params: flash α 1→0 over 0.13 s; ring 15 frames @30 fps, ease-out cubic, start −90°, stroke 2.5 px `#FF4A2E`;
  label appears when ring progress > 0.6, fades over the next 0.15; leader = from (cx + side·0.72r, cy − 0.72r) 40 px
  diagonally out and 30 px up, then 14 px horizontal; label 21 px bold, sub-label 14 px mono `#8B9097`; loupe 2× max,
  never more than 1 source px per screen px, border 2 px red, connector dash [4,3].
- build: new `variant: 'evidence'` on callout-labels. Props `src`, `rings: [{x, y, r, label, sub, side, at}]` given in
  **source-image pixels**; a `cover()` helper fits the image into the panel (centre crop, focal fx/fy) and returns a
  source→screen mapper so ring coordinates survive any panel size. Ring = SVG `<circle>` with
  `strokeDasharray=2πr`, `strokeDashoffset=2πr·(1−easeOutCubic(p))`, rotated −90°. Loupe = nested `<svg>` with a
  `viewBox` equal to the source crop rect, 2× scale. Grade via `mediaSteps` (saturate 0, contrast 1.22, brightness .94, grain .22).
- source: `styles/visual-investigation/demo/index.html` `ring()`, `cover()`, `plate()`, STYLE.md §8 "Freeze, circle, magnify".
- value: point at the licence plate, the crack, the face, the logo in any screenshot or photo; fact-check and
  "spot the detail" explainers; product-review close-ups.

### `evidence-board` — NEW
- look: up to five evidence tiles (document strip with a highlighted line, freeze frame with ring + loupe, photo with
  ring, waveform tile with quote, report quote) cut in one by one; each sends a thin red dashed link to the same zone of
  a line-drawn schematic, the zone fills red, and ✓ badges land on each tile a beat apart. Poster frame of the style.
- params: tiles cut in 0.25–0.35 s apart, each with flash; links 0.4–0.8 s each, 1.2–1.5 px, dash ≈ [5,4], accent at
  ~70 % α; zone fill accent α 0.5 (→ `#85291E` on ground); badge 30×30, ground-coloured fill at 85 %, 2 px red frame,
  3 px check stroke (−8,0)→(−2,7)→(9,−7), fade 0.06 s + scale 1.3→1 over 0.18 s, badges 0.12 s apart (one mallet note
  each); waveform tile: one bar per peak, played part `#ECEAE4`, unplayed `#4A4F57`, red 2 px play-line ±6 px taller.
- build: props `sources: [{kind: 'doc'|'photo'|'video'|'audio'|'quote', src, tag, crop, highlight, ring, quote, peaks}]`,
  `target: {schematic: 'cells'|'svg', path, zone: [x0,x1] | {x,y,w,h}, cells, numbers}`, `layout: 'board5'|'grid2x2'|'row'`,
  `linkStart`, `badgeStart`, `accent`. Layout on a 60 px grid inside y 60–900. The schematic is plain SVG line art
  (1.6 px `#ECEAE4`, 1 px internal dividers `#3A3F46`, tiny mono numbers, the zone cells' numbers in full text colour).
  Links are `<path>` with dash and a `strokeDashoffset` reveal ending at the zone centre. Waveform peaks: pass an array
  or synthesise from a seed. All timings frame-based (`interpolate`).
- source: `demo/index.html` five-source section (24–32 s), `badge()`, `wave()`, `schematic()`; frames
  `docs/frames/visual-investigation.jpg`, `styleboard/img/visual-investigation_0.jpg`, poster "evidence map".
- value: "N sources agree" moments for fact-checks, incident reports, product teardowns ("reviews, benchmarks and the spec
  sheet all point to the battery"), investigative explainers, legal/compliance stories; an AI agent can fill it from
  any list of screenshots + quotes.

### `sync-grid` — NEW
- look: three evidence columns (report text / photo / video) side by side under one huge monospaced stopwatch
  `T+07.3 s`; each column cuts in with a flash only when its source begins on the event clock, so the grid fills left
  to right as time runs; at the sync point everything freezes, the column gets a red border and a word, a red dashed line
  runs across the pictures and the stopwatch turns into a big red verdict ("32 s").
- params: columns 580×520 px at x 60 / 670 / 1280, y 92; stopwatch IBM Plex Mono 600 at 150 px (unit `s` 52 px dim), on
  the bottom-left; verdict 150→170 px over 0.25 s ease-out, accent colour; dashed line [6,5] 1.5 px at column mid-height;
  event clock = piecewise-linear keyframes `[[filmSec, eventSec], …]` (may run faster than real time; constant speed inside
  a run, one sound tick per event second, accent every 5).
- build: props `columns: [{tag, kind, src | frames | text, startsAt}]`, `clock: [[frame, eventSeconds], …]`, `syncAt`,
  `verdict`, `format: 'T+'|'hh:mm:ss'|'date'`. `eventTime(frame)` = linear interpolation between clock keys; a column is
  visible when `eventTime ≥ startsAt`, its video frame index = `(eventTime − startsAt)·srcFps` (use `<OffthreadVideo>`
  with `startFrom` or an image sequence). Freeze = hold last frame + border + label.
- source: `demo/index.html` `sRun()`, `playhead()`, film.json; DEMO.md shot 8.
- value: dashcam + CCTV + log comparisons, "which happened first", sports replays, launch/telemetry reconstructions,
  A/B latency demos (three apps responding to one tap), product race comparisons.

### `doc-highlight` — NEW
- look: a greyed document scan (or typeset transcript) cut in as a wide strip; the one decisive line is wiped in red with
  a multiply highlight; optionally a claim card where wrong words are struck through in red and a fact-check card with a
  thin red frame and pale red tint gives the corrected number.
- params: doc grade `saturate 0, contrast 1.05, brightness 0.86`; highlight `rgba(255,74,46,0.6)` `mix-blend-mode:
  multiply`, wipe 0.3–0.35 s ease-out cubic, successive lines 0.3–0.4 s apart; strike 3 px accent, drawn 0.4 s;
  fact-check card fill accent α 0.08, 1.5 px accent border, kicker 22 px bold accent with 4 px tracking, figure 48 px bold.
- build: props `src` (scan) or `text` (typeset, mono / serif italic), `crop: [x,y,w,h]` in source px, `highlights:
  [{rect, at}]` (source px, mapped like `evidence-ring`), `strikes: [{rect, at}]`, `claim`, `factCheck: {kicker, figure,
  sub, source}`, `translation`. Highlight = `<rect>` whose width = w·easeOut(p), blended multiply above the image.
- source: `demo/index.html` `sInquiry()`, `sPeople()`, cold-open highlight; `styleboard/img/visual-investigation_0.jpg` (salmon highlight on the testimony).
- value: quote a contract clause, a court filing, a changelog line, a scientific paper, a tweet screenshot; "claim vs record"
  fact-checks; any explainer that must show where a statement comes from.

### `dot-tally` — NEW
- look: one dot per person/item in labelled groups; selected dots turn, one by one, from filled cream discs into open red
  rings; a single huge number and a two-symbol legend land at the end.
- params: grid 18 columns, pitch 44 px, radius 13 px; filled `#ECEAE4`; marked = fill fades out and a 1.8 px accent ring
  fades in over 0.25 s; stagger 0.03 s per dot, groups 0.4 s apart; total figure 124 px bold, legend mono 18 px
  (`● survived   ○ died` style).
- build: props `groups: [{label, count, marked}]`, `cols`, `pitch`, `radius`, `markStart`, `stagger`, `total`, `legend`,
  `ink`, `accent`, `markStyle: 'ring'|'fill'|'cross'`. Pure SVG circles; mark order = index within group (seeded shuffle option).
- source: `demo/index.html` `sPeople()` dot grid.
- value: casualties, survey answers ("37 of 100 said…"), seats won, users affected, failure rates; a restrained
  alternative to a bar chart that agents can generate from two numbers.

---

## watercolor

### style `watercolor` — Watercolor Brush (field journal that paints itself)

- **essence**: a hand-painted naturalist's journal page on warm fibrous cotton paper; every object is built from
  individual translucent brush strokes with dry-brush "flying white" bristle tracks, painted in front of you structure
  first (trunk → branches → leaves); a quiet annotation layer in handwriting with pen leader lines; no vector outlines.
  **What the lemo version adds beyond our generic `watercolor` filter** (saturate .85 + bleed + wobble + paper): (1) the
  look comes from *stroke construction*, not a pixel filter — ribbons + dashed bristles, so a "paint-in" reveal is possible;
  (2) pooled darker wash edges from 3 jittered passes; (3) paper is the only white and is also the eraser (mist);
  (4) colour can carry data (zone palettes blended by position, quantised map ramps); (5) annotation layer grammar
  (serif title, handwritten note, mono measured label). Not ink-wash, not impasto, not crayon picture book, not vector art
  with a texture on top.
- **palette**
  - paper `#F1E9DA` [doc] — measured `#ebe2d3` / `#eee6d5` / `#ede4d3` [meas] ✓ (paper is the white; never paint pure white)
  - ink `#2B2520` (lines, text, trunk edges) [doc]; ink2 `#3D3129` (branches, stems) [doc]; darkest measured `#191b15` [meas]
  - accent `#CF4F2C` vermilion (sun "seal", with 7 horizontal dry-brush bars `#B8401F`) [doc]; measured accent `#bb7857` [meas]
  - accent2 `#3F7FA8` rain blue (drops, gauge) [doc]
  - zone ramp (sky / far hills / mid / ground) [doc]: desert `#F0D6B8 #DCAE8E #DBA47E #DDA27A` · mulga `#EFDCC6 #C89B8C #D0AE80 #DBB584`
    · woodland `#ECE2CD #BDB99C #CBC28F #DCCB92` · wet forest `#DFE3DC #9FB1B8 #98AA8A #A7B48E` · rainforest `#DBE3D8 #9AB19F #6F8D6D #6E8B69`
  - foliage measured `#406f50`, `#4d6950`, `#8ea68b`, `#b4bfa8`; ochres `#d5b793`, `#dab68c`, `#e1c4a4` [meas]
  - map ramp quantised to 5 bands [doc]: `#CF7C4F → #CDA35F → #B3B07A → #7F9A6C → #46705A → #2F5A45`
  - other documented example sets (harbour dawn `#F3E2C8 #9FB4C4 #5F7486` + `#C8442A`; garden `#E8E0C0 #8EA860 #4E6E3C` + `#D9632E`).
- **texture / print / post-process recipe**
  - paper (generated once, drawn first every frame): base `#F1E9DA` × (1 + 0.035·m), m = 0.9·n240 + 0.5·n90 + 0.25·n25
    (smooth bicubic noise at cell sizes 240/90/25 px); 2,600 short curved fibres (5-point random walk, 8–40 px, heading jitter
    σ 0.35 rad, 1 px, blur 0.6) that lighten or darken by 3.5 % according to a fine sign noise; Gaussian grain σ 1.6;
    5 % elliptical vignette. → our `paper` overlay (amount ≈ 0.35, fiber ≈ 0.6) can carry this; tweak to these numbers.
  - stroke ribbon: body at ≈ 0.57 opacity + bristle tracks (see `brush-paint-in`); overlaps darken by transparency
    ("darker = more passes"). As a whole-frame **filter approximation** for restyling any motion:
    `saturate 0.85` → `bleed` (existing, radius 3) → **NEW `edgeDarken {radius 4, strength 0.35}`** → **NEW `dryBrush
    {angle 0, freq [0.004, 0.12], cut 0.78}`** → `wobble {scale 1.5, frequency 0.02}` with **no boil**.
    - `edgeDarken` (pooled edge) algorithm in SVG: `feGaussianBlur(SourceGraphic, r)` → `feBlend mode="difference"` with the
      source → `feColorMatrix` to luminance → `feComponentTransfer` gamma to sharpen → use as mask to `feComposite
      arithmetic` the source multiplied by 0.65 back in. Result: a dark rim inside every colour boundary, like pigment
      that pooled while drying.
    - `dryBrush` (flying white): `feTurbulence type=fractalNoise baseFrequency="0.004 0.12" numOctaves=2 seed=s` (strongly
      anisotropic → horizontal streaks) → `feComponentTransfer` discrete threshold at `cut` → mask that knocks the paint
      back to paper only where the pixel differs from paper (compute "painted" mask = distance from paper colour via
      `feColorMatrix`). Rotate by drawing the filter region on a rotated group for other angles.
  - mist / erase: paper texture clipped by a wavy rising edge (see `mist-erase`).
  - no grain beyond paper, no vignette beyond the paper's own 5 %, no step.
- **typography**: titles and subtitles **Cormorant Garamond** (biome title 500 52 px; film title italic 124 px; subtitles
  italic 500 36 px, ink at 78 % over an 18 px paper-coloured shadow halo, drawn twice); notes **Caveat** 500/600 26–42 px
  (drawn twice over a 12 px paper halo, revealed L→R like writing); measured labels **IBM Plex Mono** 400 with 3 px
  tracking (`ANNUAL RAINFALL`, `01 / 05`); CJK Noto Serif SC. All Google Fonts. Note: our current `watercolor` StyleDef has
  display Caveat / body Cormorant — lemo's roles suggest **display = Cormorant Garamond, note/hand = Caveat** (add a `hand`
  font role).
- **motion rules**: 60 fps smooth, on ones, nothing jitters or boils. Painting-in is the main motion; an object's progress is
  a function of where it sits on screen (enters from the right → painted over ~380 px of travel) or of a cue; strokes in a
  list each take a slice `clamp(4/N, .12, .5)` of the progress so structure comes first. A `burst` paints a whole group in
  ≤ 0.9 s at a peak. Sway only after an object is finished: horizontal skew `k·(sin(1.15t+φ) + 0.4·sin(2.7t+2φ))`,
  k = 0.006 trees, 0.01–0.03 grass. Easing: smoothstep `ss`, easeInOutCubic `eio`, easeOutCubic `eo`, ease-in `t^2.2`.
  Creatures may be phased to the music beat grid (e.g. a hop per 2 beats so landings hit beats). Camera: long lateral
  dolly with monotone-cubic keyframes (speeds up between zones, slows on events), vertical tilt along a tall object,
  push into a detail, pull back to a map. **Transitions**: brush-edge wipe, mist erase, page turn (existing `page-turn`),
  continuous camera; no hard cuts, no dissolves between unrelated pictures.
- **signature moves**: `brush-paint-in` (NEW), `painted-transect` (EXTENDS parallax-landscape), `mist-erase` (EXTENDS
  wipe transition), `hand-note` (EXTENDS callout-labels), `painted-choropleth` (NEW); existing `falling-petals`,
  `flock`, `grass-field`, `sun-rise-set` work under the style; a "seal sun" = vermilion disc with 7 darker dry-brush bars
  stamped in 1.6 s (could be a `stamp-slam` variant).
- **do**: let paper be the light; 3–5 hues per scene + ink; quantise data ramps into 4–6 bands (continuous ramps read as
  software); one hero specimen per view with its note; generous paper margins; labels never over the subject.
- **don't**: vector outlines; pure white paint; continuous gradients for data; hard cuts; letting translucent wash strips end
  inside the frame (hard seam — extend below the frame and fade to paper); building strokes inside the render without a
  fixed seed.
- **source**: `lemo-opuscar/styles/watercolor/{STYLE.md,DEMO.md,style.json,demo/engine.js,scene.js,main.js,paper.py}` (MIT / CC BY 4.0).

### `brush-paint-in` — NEW
- look: any path set (icon, logo, plant, horizon, illustration) paints itself in stroke by stroke: each stroke is a
  translucent variable-width ribbon with 3–9 thin bristle tracks that break into dashes and end early (dry-brush flying
  white); overlaps darken; a finished drawing can sway.
- params: width profiles over normalised length s: `brush` = min(1, s/.1+.3)·(1−.85s)^.6 (fat start, taper);
  `leaf` = sin(π(.94s+.03))^.7; `even` = min(1,s/.06+.35)·min(1,(1−s)/.08+.4); `tip` = (1−.92s)^.85·min(1,s/.05+.6);
  `trunk` = (1−.62s)·(1+9·max(0,.06−s)). Width noise ±22 % (1-D value noise along the stroke, `rough` 0.22).
  Body α = a·rib with a .92, rib .62 if bristles else .92 (≈ .57 body). Bristles nb = clamp(round(w/3.2), 3, 9) when w ≥ 6;
  each: offset across the ribbon in [−.46, .46]·w, width w/nb·[.6,1.3] (≥ .7 px), α [.3,.85]·a, dash array of 3 on/off pairs
  (on 18–90 px, off 1 – (w/2+3) px), ends at [.72, 1] of the length. Live tip: last vertex at half width. List paint-in:
  stroke i of N gets a slice of the overall progress of length clamp(4/N, .12, .5).
- build: Remotion SVG (or canvas). `useMemo` builds strokes from `paths` (SVG `d` → sampled centre-lines via
  `getPointAtLength`, or `qcurve` helpers) with a mulberry32 RNG seeded from `seed`. Per frame: p = interpolate(frame,
  [start, start+dur]); for each stroke compute its local progress; body = one `<path>` polygon (left offsets forward,
  right offsets back) truncated at p·len; bristles = `<polyline>` with `strokeDasharray` and round caps, truncated at
  min(p, end). Optional `sway` via a `skewX` transform after p = 1. Props: `paths`, `colors`, `width`, `profile`,
  `bristles`, `rough`, `opacity`, `order: 'given'|'top-down'|'radial'|'byLength'`, `startFrame`, `durationFrames`,
  `burst`, `sway`, `paper`, `seed`. Cache finished strokes (render once, then a static group) for performance.
- source: `styles/watercolor/demo/engine.js` `mk`, `drawS`, `drawList`, `sprite`, `clump`, `edgeOf`; DEMO.md "Engine reference".
- value: the core primitive for a painted look across the library — logo reveals for wellness/travel brands, painted
  icons in explainers, botanical specimens, kids' content; it can also restyle `sprout-grow`, `petal-bloom`,
  `heart-draw-fill` and `line-draw-on` (give them `brush: true`).

### `painted-transect` — EXTENDS `parallax-landscape`
- look: one continuous sideways dolly across a painted world laid out along a measured gradient (rainfall, altitude,
  depth, distance); every plant paints itself in as it enters; sky, hills and ground colours blend by camera position;
  a top-left zone card and a top-right gauge rise with the value.
- params: layers far / mid / main / fg with parallax .25 / .55 / 1 / 1.55, ground y 640 / 690 / 745 / 1115 (1080p),
  scale .38 / .62 / 1 / 1.75, α .5 / .78 / 1 / .95; paper-coloured mist bands between layers (vertical gradient 0 → a → 0);
  plant progress = clamp((revealX − screenX) / (span·max(.55, parallax))); zones 10–18 s each; gauge = log bar 100–4000
  with a blue drop marker; zone card = colour swatch stroke + `01 / 05` mono + Cormorant 52 px name + italic sub.
- build: add `style: 'watercolor'` to parallax-landscape with new props `zones: [{at, sky, far, mid, ground, title, sub,
  value}]`, `paintIn: 'onEnter'|'none'`, `gauge: {label, unit, min, max, log}`, `camera: [[frame, worldX], …]`
  (monotone cubic), `specimens: [{worldX, layer, kind, note}]`. Hills/ground = wash polygons painted with 3 jittered passes
  (vertex y ± jitter every 3rd point, α = a/3·1.6) into long pre-rendered strips extending well below the frame.
  Plants use `brush-paint-in` generators (seeded). Zone colours via `mixColor(zoneA, zoneB, blend(cameraX))`.
- source: `styles/watercolor/demo/scene.js` (`LAY`, `ZCOL`, `washPoly`, `buildStrips`, `plantP`, `mistBand`), main.js HUD; DEMO.md "Shots".
- value: any "walk along a gradient" explainer — climate zones, a mountain's altitude bands, ocean depth, a city from centre
  to suburbs, a product's evolution along a timeline; travel and nature documentaries.

### `mist-erase` — EXTENDS `wipe` (transition)
- look: two wavy-edged layers of *paper texture* rise from the bottom and wash the scene back to blank paper; the inverse
  (a vertical wavy brush edge sweeping L→R) reveals a painted scene.
- params: progress c = easeInOutCubic over ~3.3 s (the demo used 70.3–73.6 s); two layers (lift 120 px at α .55, lift 0 at
  α 1); edge y(x) = 1180 − c·1400 − lift + (vnoise(x·.006 + lift) − .5)·160 + sin(x·.01 + t)·12, sampled every 40 px.
  Brush-edge reveal: edge x(y) = lerp(−150, 2100, p) + (vnoise(y·.02) − .5)·160, sampled every 40 px.
- build: new wipe options `edge: 'mist'|'brush'`, `fill: 'paper'|'color'`, `layers: 2`, `amplitude: 160`. Implement as
  an SVG `<clipPath>` polygon recomputed per frame (deterministic value noise), filled with the paper overlay image.
- source: `styles/watercolor/demo/main.js` `drawMist`, `scene.js` `drawStripAt`.
- value: soft chapter transitions for any paper/paint style (watercolor, pencil-sketch, ink-wash), "forgetting / time
  passes" beats, gentle brand films.

### `hand-note` — EXTENDS `callout-labels`
- look: a handwritten label writes itself left to right next to a specimen, with a thin curved pen leader growing from
  the label to a dot on the object; labels never cover the subject.
- params: Caveat 500, 26–42 px, ink `#2B2520` α .9, drawn twice over a 12 px paper-coloured blur halo; reveal = clip rect
  width (w+12)·easeOutCubic(p); leader = quadratic curve, 16 points, bend 20 px, revealed by point count, 1.6 px ink α .75,
  round cap, 3 px end dot when complete; notes fade out over 0.5 s.
- build: `variant: 'hand'` with props `items: [{anchor:[x,y], label:[x,y], text, at, out, bend}]`, `font: 'Caveat'`,
  `halo: paperColor`. SVG `<clipPath>` rect for the writing; `<path>` with dashoffset reveal for the leader.
- source: `styles/watercolor/demo/scene.js` `hand`, `leader`, `note`.
- value: specimen labels, product part call-outs in a soft editorial look, recipe ingredients, map annotations.

### `painted-choropleth` — NEW
- look: a painted map (coastline brushed in segment by segment) whose regions fill with quantised watercolour bands
  driven by data; the field can morph through time (e.g. 50 Ma → today) with a radial fill reveal and a huge serif year.
- params: 5 quantised bands (demo ramp `#CF7C4F` 150 mm → `#CDA35F` 300 → `#B3B07A` 650 → `#7F9A6C` 1150 → `#46705A` 2000 →
  `#2F5A45` 4000); each band painted as a 3-pass jittered wash; year label Cormorant 150 px; time morph = per-station value
  × time multiplier re-evaluated per frame; flicker accents (fires) allowed in one band.
- build: props `geo` (GeoJSON or simplified rings, equirectangular with cos(lat) correction), `stations: [{lon, lat,
  value}]` or `field(lon, lat, t)`, `bands`, `colors`, `timeKeys: [[frame, tau]]`, `reveal: 'radial'|'coast'`, `title`.
  Interpolate field on a coarse grid (IDW), contour with marching squares into band polygons (d3-contour), paint with
  `washPoly`-style passes; recompute only when the quantised band set changes.
- source: `styles/watercolor/demo/main.js` map section (`MSTOP`, `mapTau`), DEMO.md "Map".
- value: climate/data stories in a warm editorial look; election or survey maps for softer brands; "how X spread" maps.

---

## white-model

### style `white-model` — Projection on White Model (data as light on a massing model)

- **essence**: a pure white architectural massing model of a real place on a dark plinth in a dark room; a projector
  paints data on it as *light*, one layer at a time, brightening faces turned to the projector, stopping at the edge of the
  throw and spilling a little onto the plinth. The model never changes; only the light does. House lights out = data starts;
  lights up = data ends. Not iso-infographic, not lowpoly, not hologram HUD, not satellite, not point-cloud scan lines.
- **palette**
  - room / bg near-black, radial gradient — measured `#080A0E`, `#1F2129`, `#3B393F` [meas]
  - plinth `#17181A` [doc]; plate water inlay satin rgb(0.10, 0.13, 0.17) ≈ `#1A2129` [doc]
  - model (house light) `#F3F3F1`, roughness 0.88 [doc]; under the warm sun it reads `#D1BAA5` / `#9F918B` / `#7E716B` [meas]
  - layer 1 "the old / exception" amber `#FFA13D` [doc] (measured orange pick-out roofs in poster)
  - time ramp (cool, sequential) `#2A46FF → #2F98FF → #6FDCFF → #E6FBFF` [doc]
  - height ramp `#1A1440 → #5A35D6 → #E2509A → #FFE7C4` (breaks at 30 / 80 / 200 m) [doc]
  - sun `#FFD9AD` [doc]; projected shade `#1C2C66` [doc]; shadow-trace fill rgb(.10,.22,.65) ≈ `#1A38A6` + pale edge ≈ `#BFE6FF`
    [doc/derived]; measured trace blues `#819BDF`, `#4B5B85`, `#394564` [meas]; newer shaded roofs `#BFF3FF` [doc]
  - UI text white `#F5F5F2`-ish over a soft dark gradient; one accent amber rule.
- **texture / post-process recipe**: this is a 3D lighting language, not a filter. Post: bloom threshold 0.85, strength
  0.32, radius 0.55 (threshold 1.6 while the house lights are on, so only projection highlights bloom); physical depth of
  field (focus = camera distance, aperture lerp(5.5, 2.0) as distance grows, max CoC 14 px); GTAO only on close opening
  shots (it bands on wide grazing views); vignette; light grain. Mapping to our engine as an *overlay pack* for 3D motions:
  `glow {threshold .85}` (existing), overlays `vignette` + `filmGrain` (light). **NEW concept: `projection` material
  term** (see `white-model-projection`); **NEW transition `lights-out`**.
- **typography**: figure **Inter Tight 200** at 120–140 px; labels **Noto Sans SC** 300/500 20–36 px (Latin: **Inter** 300/500);
  instruments, years, coordinates **IBM Plex Mono** 18–22 px. Readout block in the left third: index + layer name, one
  figure, one label, one source line, a legend bar / time slider. Identity label top-left (place · scale · data sources).
  Pins: hairline from a roof (tallest part) up to a tag on a dark plate (title 26 px + sub 20 px). Nothing below 18 px.
- **motion rules**: one continuous take; the camera always moves slowly and changes speed with the layers (never stops
  dead): macro glide at rooftop height → crane up/back → slow orbit with rise → boom down to a low angle → side-on track
  along a measured line → pull back as lights return. House lights cut in 0.25 s (relay) and return in 1.0 s; the projector
  strikes in 0.12 s with a 0.25 s flicker; each layer arrives by a soft light gesture (wash, pop-on, rising level, sun
  clock), never a hard line sweep. Counters roll while the light moves and land when it lands. Layer onsets on the music
  beat (demo 100 BPM). Acceleration by shrinking the spread per layer (1.0 / 0.9 / 0.9 / 0.75 s), not by tempo.
  Transitions are light changes inside one take; no cuts, fades or wipes.
- **signature moves**: `white-model-projection` (NEW, modes wash / grow / level / pick), `sun-shadow-measure` (NEW),
  `world-pin` (EXTENDS callout-labels), `lights-out` (NEW transition); `number-counter` for the rolling year/height.
  Related existing: `city-skyline` (2D), `iso-blocks-3d` (clay) — neither does projected light on white geometry.
- **do**: real geometry (or an honestly procedural "massing" city labelled as schematic); one hue family per layer;
  colours return only with the same meaning; ≤ 2 layer palettes on screen; neutral studio environment (warm HDRIs turn the
  model beige); anchor pins on the tallest roof part.
- **don't**: paint colour into the material; hairline scan lines (read as laser scanning); fake shadows; wide-shot AO;
  invented data layers.
- **source**: `lemo-opuscar/styles/white-model/{STYLE.md,DEMO.md,style.json,demo/studio.js,main.js,overlay.js}` (MIT / CC BY 4.0).
  Building data in the demo is 3DBAG (CC BY 4.0) — not needed for our implementation (use a procedural city or the host's data).

### `white-model-projection` — NEW
- look: a white 1:1000-style massing city on a dark plinth; house lights snap off, a projector strikes with a flicker and
  a warm wash spreads out from the projector axis lighting one set of buildings amber (the rest stay dark, so absences draw
  a shape); later layers pop buildings on one by one with a short white flash in a cool ramp; a soft level of light climbs
  every facade colouring by height; a pick-out lights one building alone.
- params: projection term added to the lit surface: `L = c · (0.42 + 0.58·max(N·normalize(projPos − P), 0)) · throw · uProj`,
  `throw = 1 − smoothstep(0, .03, max(|x|−W/2−.05, |z|−D/2−.05))`, reduced ×(1 − .55·water); added as
  `outgoingLight += L · mix(albedo, 1, .1) · 1.35`. **Wash**: front radius R(t) = lerp(0, 2.4, easeOutCubic) model units,
  soft edge smoothstep(.06, −.06, r − R), warm rim `exp(−s²/.004)·.55` fading out at the end. **Grow**: onset_i = bandStart +
  rank_i·spread, a = smoothstep(0, .22, e), flash = exp(−e/.16)·1.4·colour + 0.6 white. **Level**: front height
  f(t) = 50/50 mix of easeOut and smoothstep; below the front, facade colour = height ramp; a bright band
  `exp(−s²/1.6e−5)·.9` rides the front; 25 m contour rings via an antialiased `fract` line on world y. **Pick**: glow
  `.8 + 1.4·exp(−e/.25)`. Lights: house directional (az 215°, el 40°, intensity 1.7, soft shadow 4096²), hemisphere .25,
  environment .75 → .06 when off. Projector strike: ramp 0.12 s × flicker (0.75 + 0.25·sin(90·(t−t0))) for 0.25 s.
- build: `@remotion/three` scene. Props `buildings` (`[{poly:[[x,z]…], h, year?, value?, tag?}]`) or `seed` + `blocks`
  for a procedural city (grid streets, setbacks, a river inlay), `scale`, `layers: [{mode:'wash'|'grow'|'level'|'pick',
  at, select:'year<1940'|fn|tags, color|ramp, spread, center}]`, `camera: [[frame, az, el, dist, target]]`, `lightsOutAt`,
  `lightsUpAt`, `readouts`, `pins`. Geometry: extrude footprints (outward normals from ring orientation; skip shared-wall
  overlaps); per-vertex attributes (year, height, rank, flags) → shader decides colour each frame from uniforms set from
  `useCurrentFrame()` (no state). `MeshStandardMaterial.onBeforeCompile` injection before `#include <opaque_fragment>`.
  Post via `@react-three/postprocessing` (Bloom, DepthOfField, Vignette) with the numbers above.
- source: `styles/white-model/demo/studio.js` (`projLight`, `roofGlow`, `projMaterial`, `buildCity`), `main.js` `setLight`;
  poster / styleboard frames.
- value: urban planning, real-estate portfolios ("our sites by year"), campus master plans, flood/height studies,
  logistics hubs, any "data on a physical model" museum-style piece; also a premium generic "city data" hero for
  B2B/infra brands using a procedural city.

### `sun-shadow-measure` — NEW
- look: data is put away; a real low winter sun swings across the model (a clock readout runs 10:55 → 12:40), shadow sides go
  deep projected blue; then the projector traces one tower's shadow as a cool fill with a bright edge while a measured
  range line with 100 m ticks grows from its base to the tip and a counter lands ("777 m"); the roofs inside the shadow
  ping on one by one (old ones in the first layer's amber).
- params: sun from latitude/longitude/date/time (NOAA / Meeus solar position) as a DirectionalLight with shadow maps;
  shade = `#1C2C66`·0.42 on buildings (0.3 on plate); trace fill rgb(.10,.22,.65)·.9 + edge `exp(−((m−.5)/.16)²)` pale
  blue-white, revealed by distance from the base `smoothstep(prog, prog−.03, d)`; range line pale amber 1.5 px with dots
  every 100 m, tag at the end; roof pings 0.1 s apart with glow .8 + 1.4·exp(−e/.25).
- build: props `lat, lon, date, timeKeys: [[frame, "HH:MM"]]`, `subject` (building id), `traceAt`, `traceFrames`,
  `unit: 'm'`, `tickEvery: 100`, `roofsInShadow` (auto). Shadow footprint computed analytically for extruded prisms:
  translate each roof vertex by h/tan(elevation) along the anti-azimuth, take the convex hull of base ∪ translated roof,
  intersect with other footprints to find shaded roofs; draw the trace as a ground decal mesh (or projected texture), the
  range line in screen space via `camera.project`. Clock readout = `number-counter` style with mono time.
- source: `styles/white-model/demo/studio.js` (sun light, `uZS*` trace), `tools/sun.py`, DEMO.md shot 9; poster (blue trace + 777 m tag).
- value: shadow-impact stories for new buildings, solar-panel roof ranking, "daylight in a courtyard", sundial/education
  pieces; works on any 3D motion with a directional light.

### `world-pin` — EXTENDS `callout-labels`
- look: a thin hairline rises from a point on a 3D object (a roof) to a small dark plate with a title and one sub-line;
  it stays pinned while the camera orbits; a left-third readout shows index, layer name, one huge thin figure, label, source.
- params: plate dark α ~.7, title 26 px, sub 20 px; hairline 1 px pale amber; readout figure Inter Tight 200 120–140 px;
  anchor = tallest part's top, not centroid; pins never over the readout.
- build: new `anchor3d: [x,y,z]` prop resolved each frame with `vector.project(camera)` inside the three scene and passed
  out to an HTML overlay layer (or render the overlay inside `@remotion/three` with `Html`); `readout` sub-component.
- source: `styles/white-model/demo/overlay.js` (readout, pin, range line), poster.
- value: labels on any 3D motion (terrain-build-3d, pointcloud-orbit, wireframe-build, plan-tilt) and product renders.

### `lights-out` — NEW (transition / lighting cue)
- look: a room's lights snap off like a relay, leaving a dark scene; a projector (or a single key light) strikes with a
  brief flicker; at the end the house lights come back slowly.
- params: off = smoothstep over 0.25 s to 6 % of the house intensity; on = smoothstep over 1.0 s to 50–100 %; strike = linear
  0.12 s × flicker 0.75 + 0.25·sin(90·Δt) for 0.25 s; bloom threshold swaps 1.6 ↔ 0.85 with the lights; optional 0.35 s fade
  to dark for a "projector off" silence beat.
- build: as a 3D cue = uniforms/intensities driven by frame; as a 2D transition = black overlay α = 0.94·off over the
  outgoing scene, then the incoming scene fades in through the flicker curve (multiply brightness). Props `offAt`,
  `strikeAt`, `onAt`, `floor: .06`, `flickerHz`.
- source: `styles/white-model/demo/main.js` `setLight()`.
- value: dramatic "now look closer" beats in keynote, museum and product films; a reset between topics; reusable by every
  3D motion we have.

---

## whiteboard

### style `whiteboard` — Whiteboard Explainer (one glossy board, written live)

- **essence**: an explainer drawn live in dry-erase marker on one glossy board: single-line handwriting actually written
  stroke by stroke, floating markers with real cast shadows (no hands, no cursor), magnets and an eraser that move on
  their own, ghosts of old lessons, a window sheen that drifts slower than the board, and a camera that travels across the
  board (the board is a map of the argument) instead of cutting. Not blueprint, not crayon book, not kinetic type.
- **palette**
  - board `#FBFBF9 → #EEEDE9` diagonal gradient [doc]; measured `#f9f9f7`, `#f8f8f6`, `#f1f0ec`, `#efeeea` [meas] ✓
  - ink black `#23262C` [doc] (darkest measured `#090a0f` incl. marker caps [meas])
  - ink blue `#2A5CB3` (signals, measurement, process) [doc]
  - accent orange `#D97757` (you / time / the thing that matters) [doc]; measured `#d9886c`, `#d69a85`, `#c07054` [meas] ✓
  - ghost marks grey `#9AA0A8`, pale blue `#8AA0C8` at 5–10 % [doc]; measured faint `#968c8a`, `#c8bbb6` [meas]
  - wall `#D8D3CA`, aluminium frame/tray only in the final wide shot [doc]
  - alternative documented sets: black / green `#2E8B57` / red `#C8363A`; navy `#1F2A44` / teal `#1F8A8A` / purple `#7A4FB3`.
- **texture / post-process recipe**
  - ink: α 0.94, composited **multiply** onto the board (overlaps darken); widths 6–11 px drawing, 13 % of cap height for lettering.
  - dry-marker texture: 512 px tile of 2,600 speckles (r 0.3–1.9, α ≤ .35) + 260 short streaks (20–90 px, α ≤ .22, near
    horizontal ±0.25 rad) **subtracted** from the ink layer (destination-out) at α .9, locked to board space, faded out when
    zoom < 0.8 → **NEW FilterStep `dryMarker {density, scale}`**: in SVG = `feTurbulence` (fractalNoise, baseFrequency ≈ 0.6) →
    threshold → `feComposite operator="out"` against the ink alpha (or a pre-rendered tile used as an inverse mask).
  - board: scuff tile (900 faint dots α ≤ .03 + 70 wide soft scratches α ≤ .028, wrapped seamless) + ~46 ghost strokes
    (old words, circles, arrows) at 5–10 % → **NEW overlay `board {from, to, ghosts, scuff}`**.
  - gloss: **NEW overlay `sheen {angle, speed: 0.35}`** — a diagonal white band (stops 0 / .10 / .16 / .10 / 0 across
    1,400 px) whose x = −cameraX·zoom·0.35 + 900, i.e. it drifts at 0.35× the camera; "this one detail sells glossy".
  - as a whole-frame filter restyle of other motions (approximation): `saturate 0` → `posterize 3` → `gradientMap
    {ramp: ['#23262C', '#FBFBF9'], discrete: false}` → `wobble {scale 1.5, frequency 0.02}` (no boil) → `dryMarker`;
    overlays `board`, `sheen`. Real quality comes from the stroke motions below.
- **typography**: board lettering in a **single-line (single-stroke) font** written in stroke order — the source uses
  EMS Tech (OFL, a single-stroke conversion of Architects Daughter, shipped as JSON); closest Google Font is
  **Architects Daughter** (outline font, use it for subtitles and static text); for true stroke-order writing ship a
  single-stroke font (EMS family, OFL, or Hershey, public domain) as JSON. Title 120–200 px cap height, labels 30–70 px; per
  glyph ±2° rotation, ±3.5 % baseline and scale jitter; hand-defined missing glyphs (μ ≈ → × − ✓ ² ° ±, and dots for
  punctuation). Subtitles: off-white rounded label (~90 %), Architects Daughter 44 px, dark ink, a short accent marker dash;
  ≤ 44 chars/line; bottom 12 % of every shot kept free. Title and end card are written on the board.
- **motion rules**: camera on ones (24–30 fps), real motion blur when moving > 14 px/frame (average sub-frames ≤ 4 px apart,
  up to 12). Every stroke uses the hand-speed curve `u − sin(2πu)/(2π)·0.8` (slow land, fast middle, slow lift); strokes are
  scheduled into a deadline window and the engine solves the speed so writing finishes on the spoken word; a label
  0.3–0.8 s, a title ~3 s, a full drawing ~1 s. Pens hop, park off-frame when idle > 0.75 s and return 0.42 s before the
  next stroke. Magnets drop / slide / sink; the eraser runs at constant speed. No cuts on the board — if needed, a whip.
  Allowed transitions: camera move (ride the pen line), whip pan (existing `push-blur`), eraser wipe; forbidden: dissolves, slides.
- **signature moves**: `marker-write` (EXTENDS handwrite-on), `floating-marker` (EXTENDS line-draw-on), `board-camera`
  (NEW), `eraser-rewind` (NEW), `magnet-pin` (NEW); "two pens at once" duet = two `floating-marker` pens; existing
  `perspective-grid`, `gears` (coloured-pencil), `easing-graph`, `heart-draw-fill` can live as regions on the board.
- **do**: ≤ 3 marker colours with fixed meanings; one accent per region; give each idea its own board region and travel;
  write each term exactly when it is said; keep labels fully in or fully out of a shot.
- **don't**: hands, arms, cursors; block-animated text; pooled-ink dots bigger than the stroke start (halos); too many jobs
  for one pen (it drifts late — give each drawing a deadline and a second pen); eraser paths across labels you keep.
- **source**: `lemo-opuscar/styles/whiteboard/{STYLE.md,DEMO.md,style.json,demo/engine/wb.js,film.js}` (MIT / CC BY 4.0;
  EMS Tech and Architects Daughter fonts OFL).

### `marker-write` — EXTENDS `handwrite-on`
- look: text and line drawings written live in dry-erase marker: slightly wobbly single strokes, chisel-tip width that
  changes with direction, a heavier start, a little taper and overshoot at the end, a darker pooled dot where the nib
  landed, dry speckle, overlaps darkening.
- params: resample every max(3, 0.6w) px; wobble offset along the normal = J·2.6·[(vnoise(s/220 + seed)−.5)·2 +
  .45·(vnoise(s/50.6 + seed')−.5)] px (wavelength ~220 px + finer tremor); half-width = w/2 · (0.8 + 0.2·|sin(θ − 2.35)|)
  (chisel) · min(1, .72 + d/(2.2w)) (pressure ramp) · (1 − .12·clamp((d − (L − 2w))/(2w))) (end taper); round end caps;
  pooled dot r = .33w at d = .5w, α .3, only for strokes > 30 px; strokes shorter than 1.2w render as dots; overshoot hook
  `over` px with ±.25 rad curl; lines get a random bow ±1.2 % of length; circles start at an angle and overlap past
  closure; rectangles = 4 strokes with corner overshoot. Deadline solver: hop time between strokes = clamp(dist/2600, .035,
  .3) s, scaled so hops ≤ 35 % of the window; remaining time split by stroke length.
- build: add props `font: 'single-line'` (JSON stroke font: glyph → polylines in writing order), `tool: 'marker'|'pen'`,
  `markerColor`, `by` (deadline frame per line), `wobble`, `chisel`, `pool`, `dry`. Each stroke → SVG `<path>` ribbon
  (computed outline, as in the source) truncated at prog(u)·len; ink group `mix-blend-mode: multiply`; dry texture as an
  SVG `<mask>` with a seeded speckle pattern. Shape builders `line/curve/arc/circle/rect/arrow/dashed/hatch` reuse the same
  stroke. Deterministic: seeds per stroke index.
- source: `styles/whiteboard/demo/engine/wb.js` (`Stroke`, `ribbon`, shape builders, `text`, `Timeline.draw`).
- value: the backbone of whiteboard/RSA-style explainers, course videos and sales "napkin" explainers; also upgrades
  `handwrite-on` with a marker tool and deadline timing (write on the word from a word-timestamp list).

### `floating-marker` — EXTENDS `line-draw-on`
- look: a dry-erase marker (white barrel, colour band, posted cap, felt nib) floats over the board with a soft cast
  shadow; its tip rides every stroke as it is drawn; between strokes it hops in an arc (shadow slides and blurs);
  when idle it flies off-frame and returns just before its next stroke; two markers can draw a live duet.
- params: on-stroke pose = tip at current stroke point; hop if the gap < 0.75 s: position smoothstep, lift = sin(πu)·min(1,
  dist/220 + .25); leave to park over 0.38 s (ease-in u², lift min(1, 3u)); return over 0.42 s (ease-out cubic, lift
  min(1, 2.2(1−u))); shadow offset and blur grow with lift; marker tilted ~35–45°.
- build: new `pen: 'marker'` option plus `pens: [{id, color, park:[sx,sy]}]` on line-draw-on / marker-write; pen pose computed
  per frame from the scheduled stroke list (pure function of frame). Marker drawn as an SVG group (barrel rect with round
  ends, band, cap in ink colour, nib triangle) + blurred ellipse shadow.
- source: `styles/whiteboard/demo/engine/wb.js` `penPose`, `drawMarker`, `Pen`; styleboard frame (two pens drawing ground/orbit ticks).
- value: makes any draw-on motion feel performed; duets for comparisons (two plans, two runners, two growth curves).

### `board-camera` — NEW
- look: a very large board holds every idea in its own region; the camera glides between regions like a dolly, rides the
  line the pen is drawing, pushes into one symbol, whips to a new idea after a pause, and finally pulls back past the board
  edge to show the whole lesson hanging on a wall in an aluminium frame with a pen tray.
- params: board 8000×4500 world px; camera keys `[t, x, y, zoom, roll, ease]` with eases quintic smootherstep
  (u³(6u²−15u+10)), cubic in/out, smoothstep, linear, hold; zoom interpolated in log space, position weighted by
  w = (1/za − 1/z)/(1/za − 1/zb) so the screen mid-point stays stable (a push feels like a dolly); small roll; motion blur when
  > 14 px/frame; frame + tray + wall `#D8D3CA` + blurred wall shadow shown only when zoom < 0.5; sheen parallax 0.35×.
- build: a container motion: props `regions: [{id, x, y, w, h, layers}]` where each region hosts any library motion
  (Sequence offsets), `camera: [[frame, x, y, zoom, roll, ease]]` or `follow: {pen, from, to}` (camera = pen tip with lag),
  `board: {from, to, ghosts, scuff}`, `sheen`, `frame`, `motionBlur: {threshold: 14, maxSamples: 12}`. Implement with one
  transformed `<div>` (translate/scale/rotate) and `@remotion/motion-blur` `CameraMotionBlur` (or manual sub-frame
  averaging) when the camera speed crosses the threshold.
- source: `styles/whiteboard/demo/engine/wb.js` `Camera`, `applyCam`, `Board.render`, `frame`; STYLE.md §6; DEMO.md "Shots".
- value: turns the library's hand-drawn motions into one continuous explainer; course intros, "how it works" product
  videos, onboarding; a full-board pull-back is a natural recap/end card.

### `eraser-rewind` — NEW
- look: a charcoal felt eraser slides along a zig-zag path at constant speed and wipes a wide band of ink, leaving a faint
  ghost; played along a trail it reads as "undo / rewind time".
- params: band width 90–230 px, strength 0.9 (10 % ghost remains), constant speed along the path; zig-zag path over a box
  with n = 5 passes; eraser block with a small accent label; felt-rub sound cue.
- build: props `path` or `box: [x,y,w,h]` + `passes`, `startFrame`, `durationFrames`, `width`, `strength`, `target`
  (which layer). SVG `<mask>`: white rect minus a black `<path>` stroke (width, round joins) with α = strength, revealed by
  `strokeDashoffset` = len·(1−p); the eraser graphic rides `getPointAtLength(p·len)` with a slight zig-zag tilt.
  Usable as a transition (erase the outgoing region, then write the next).
- source: `styles/whiteboard/demo/engine/wb.js` `Timeline.erase`, `zigzag`, `drawEraser`, `Board.render` erasers.
- value: undo/rewind beats, "what if we hadn't…" storytelling, clean wipes between whiteboard sections, correcting a
  wrong answer on screen.

### `magnet-pin` — NEW
- look: a glossy round magnet (here an orange map pin with a white dot and a specular highlight) drops onto the board
  with a shrinking shadow and a click, slides between spots with a small lift, can be lifted off or "sink" (tilt and drop).
- params: drop 0.3 s (lift 1 → 0, shadow large & blurred → small & sharp); slide = smoothstep per step with a small lift;
  sink = tilt 0.5 rad + 40 px drop; radial-gradient body, specular dot, soft cast shadow.
- build: props `shape: 'pin'|'disc'|'icon'`, `color`, `keys: [{frame, x, y, action:'drop'|'slide'|'lift'|'sink'}]`. SVG
  group with transform from interpolated keys; shadow = blurred ellipse offset by lift.
- source: `styles/whiteboard/demo/engine/wb.js` `drawPinMagnet`; DEMO.md motion numbers.
- value: the "hero token" on any board or map (you-are-here, a delivery truck, a player), works with `map-route` and
  `board-camera`.

---

## woodcut

### style `woodcut` — Woodcut Print (a relief print that carves itself)

- **essence**: every shot is one printed plate — black ink on laid paper inside a paper margin, with a ragged block edge.
  Black is the uncut wood, white is only where a knife removed wood: light is *carved* (bright = many wide cuts, dark = no
  cuts), cuts follow the form (Doré grammar) and pictures appear by being carved, coarse gouges first. At most one colour
  plate, printed only in the carved white, reserved for the thing that burns. The block is a mirror: titles read backwards
  until the paper is pulled. Not copperplate engraving, not linocut flat colour, not a photo through a threshold filter.
  **What the lemo version adds beyond our existing `woodcut` style** (contrast 1.5 + uniform `lines` gap 7 + wobble + paper
  + deckle): (1) **form-following cuts** — direction from a structure-tensor/contour field, width from tone, broken into
  separate 30–160 px knife cuts with blunt entry and tapered exit (our `lines` is one global angle); (2) **carve reveal** —
  strokes have their own start times (lights first / radial / down); (3) a **print compositor** with ragged knife-edge
  displacement, ink unevenness, wood-grain streaks and specks where ink didn't take, plus a mottled, misregistered colour
  plate that only shows in cuts; (4) **print-pull / peel** as the one transition and a 2-frame misregistration jolt on hard
  cuts; (5) characters on twos with everything else on ones; (6) a fixed paper margin with letterpress captions.
- **palette**
  - ink `#111111` [doc] — measured `#191918`, `#181614`, `#151110` [meas]
  - paper `#EFE8D8` [doc] — measured `#eee7d7`, `#efe8d8`, `#f0e9d9`, `#f1eada` [meas] ✓ (our style uses `#EFE6D2`, close)
  - block wood `#D8C29C` [doc] (only in shots showing the block)
  - one colour plate, demo "copper" `#C8502A` [doc]; printed over paper with mottle it reads `#D67E5E`, `#BE7053`, `#D7A18A`,
    `#C67255` [meas]; ink over the plate gets an 18 % warm tint → `#4F362C` / `#54382E` [meas]
  - documented alternatives for the plate: cold Prussian blue (water/night), deep oxblood (wound/seal).
- **texture / print / post-process recipe** (map to FilterSteps where possible)
  1. tone → cut mask: existing `contrast 1.5` + `lines {gap 6–7, angle}` stays the cheap fallback for arbitrary motions;
     for images use `woodcut-carve` (form-following). A cheap middle ground for the global chain: **NEW step
     `contourLines {gap, field: 'luma'}`** — not expressible in pure SVG (no per-pixel rotated pattern); implement as a
     WebGL post pass (`<canvas>` in a Remotion `<AbsoluteFill>` reading the image `src`) when needed.
  2. ragged knife edge = existing `wobble {scale 2.6, frequency 0.33}` (feTurbulence + feDisplacementMap) followed by
     existing `threshold {at 0.5, ink '#111111', paper '#EFE8D8'}`; lemo also jitters the threshold itself by ±0.17 with
     low-frequency noise → **extend `threshold` with `jitter: 0.17, jitterFreq: 0.7`** (feTurbulence added to luminance before
     the discrete transfer).
  3. ink density: 0.965 ± 0.035 fbm; minus 4.5 % **wood-grain streaks** = **NEW overlay/step `woodGrain {angle, freq:
     [0.0035, 0.7], amount: 0.045}`** — SVG `feTurbulence baseFrequency="0.0035 0.7"` → threshold 0.62–0.9 → lighten ink;
     minus 55 % **specks where ink didn't take** = **NEW step `inkSpecks {freq 0.5, cut 0.84–0.92, amount 0.55}`** —
     feTurbulence (0.5) gated by a low-frequency fbm (0.007) → paper shows through in small blotches.
  4. paper: cloud fbm(0.0035) ±5 % + two anisotropic fibre noises rotated +0.35 and −0.8 rad at freq (0.9, 0.035) ±2.2 % +
     per-pixel hash ±1.8 % → existing `paper` overlay (amount .35, fiber .45) is close; add `fiberAngles`.
  5. colour plate: **NEW step `spotPlate {color, reg: [3, 2], mottle: [0.8, 1.08], blotch: 0.35}`** — the plate is sampled
     3 px right / 2 px down (existing `misregister` can do the offset), multiplied over the paper (`paper · plate/paper`),
     mottled by fbm(0.02), with 35 % blotches; it is visible only where the mask is cut white; ink over it is tinted 18 %.
     Source of the plate mask: either a separate layer (`plateLayer`) or pixels above a saturation threshold in the input.
  6. block mode (showing the inked wood): grain = anisotropic noise (0.003, 0.09) & (0.01, 0.35); groove depth from a blurred
     mask (mip 2.2); groove walls lit by the mask gradient; glossy ink sheen; a wet highlight band for the brayer.
  7. print frame: image area inset 36 px, bottom margin ~132 px for captions; ragged block edge (not a clean rectangle) →
     existing `deckle` overlay inverted (ragged ink edge) + `frameLine` off.
  8. per-impression noise seed changes on each hard cut (and may step at 12 fps), paper noise stays fixed.
- **typography**: captions letterpress in the bottom paper margin in **IM Fell English** 40–44 px, ink, through the same print
  shader, in over 0.1 s (no slide), out over 0.15 s; titles carved (white out of black) in **IM Fell English SC**, mirrored
  when shown on the block. Both Google Fonts (matches our current StyleDef fonts).
- **motion rules**: characters on twos (12 fps), camera / particles / fire / light on ones (24 fps) → our global `step: 2`
  is too blunt; propose **per-layer `step`** (characters only). Hatching lives in each body part's local space (cuts move
  with limbs, no boil); only fire and liquids re-cut every 2 frames. Anticipation → 2-frame strike → settle + short shake
  (demo: lean back 4 f, strike 2 f, 3-frame shake). Carve reveal per stroke 0.08–0.35 s. **Hard cut = new impression**:
  2 frames of misregistration [5, −3] px then [−2, 1] px → propose `cut` transition option `jolt: [[5,-3],[-2,1]]`.
  The one transition grammar is the **print pull / peel** (`print-pull`); never a dissolve. Montage cuts can accelerate
  (1 / 1 / 1 / .5 / .5 / .25 / .25 s). The paper margin never moves.
- **signature moves**: `woodcut-carve` (NEW), `carved-light-burst` (EXTENDS speed-lines), `print-pull` (EXTENDS page-turn),
  `stab-flecks` (EXTENDS snowfall); existing `line-draw-on` with `engrave`, `crowd-bob` (ink-etched soldiers) and `flock`
  fit the grammar; mirrored title → true print via `print-pull`.
- **do**: black masses on carved white or white on uncut black (never grey on grey); 3–6 cuts on a figure's lit edge only
  (grazing light z ≈ 0.2); skin carved white, features left black; long cuts (14–50 × spacing) with one broad highlight band;
  plan the colour plate on carved white; text only in the margin.
- **don't**: hatch every surface (reads as fur or rain); white flecks on white areas (invisible); short tonal-wobble hatch
  segments (zig-zag chevrons); steam drawn over the subject (reads as flames); lazily cached strokes (non-deterministic);
  low CRF (fine hatching + grain explode file size — use higher CRF with `-tune grain`).
- **source**: `lemo-opuscar/styles/woodcut/{STYLE.md,DEMO.md,style.json,demo/engine/{index,knife,hatch,print,filter}.js,demo/trans.js}`
  (MIT / CC BY 4.0). Our existing StyleDef already credits it as grammar inspiration.

### `woodcut-carve` — NEW
- look: a photo or video frame turns into a white-line woodcut: thousands of separate knife cuts that wrap around forms
  (along the isophotes, like an engraver following a cheek), wide where the image is bright and absent where it is dark;
  the cuts are carved in live — highlights first, coarse to fine — then the block is printed on paper with ragged edges,
  ink unevenness and an optional colour plate glowing out of the cuts.
- params: analysis at 1/3 resolution; luminance Rec.709, pre-blur r 1; levels T = clamp((L − 0.08)/(0.85 − 0.08))^γ (γ 1);
  Sobel gradients → tensor Jxx, Jxy, Jyy box-blurred r 4; orientation θ = ½·atan2(2Jxy, Jxx − Jyy) + π/2 (along edges);
  coherence = √((Jxx−Jyy)² + 4Jxy²)/(Jxx+Jyy) (clamp negatives first), strength = clamp(√(trace/max)·6); blend the doubled-angle
  vector (cos2θ, sin2θ) with a fallback angle a0 = 0.45 rad by weight coh·str, blur r 2; trace evenly spaced streamlines
  (Jobard–Lefer: random-order seeds on a coarse grid + neighbour seeding, stop when closer than 0.62·sp to another line,
  stop closed loops); spacing sp 5–6 px; split each line into cuts of length [5sp, 22sp] with gaps [1, 0.6sp]; cut width =
  wmax(≈1.02 sp)·tone^0.9 mapped between lo 0.12 and hi 1 (dark → no cut); V-gouge profile: entry 0.35 + 0.65·a(2−a),
  exit b^0.75 (a, b = distance from ends over 0.9w+1 and 2.6w+2); reveal key "light" = (1−tone)·0.85 + 0.15·y/h (or radial /
  down), start jitter ±0.06, knife speed 1200 px/s; ~1,900 cuts and ~140 ms per 1080p frame in JS.
- build: props `src` (image or video), `rect`, `sp`, `black`, `white`, `gamma`, `tensor`, `a0`, `reveal: {mode:
  'light'|'radial'|'down', startFrame, durationFrames, cx, cy}`, `ink`, `paper`, `plate: {color, mask: 'saturation'|src,
  reg: [3,2]}`, `seed`, `onTwos` (re-run per 2 frames for video with the same seed), `print` (compositor on/off).
  Compute strokes in `useMemo` keyed on (src, seed, frame-bucket) with `delayRender` while the image decodes; draw white cut
  polygons onto a black `<canvas>` mask; composite with a small WebGL pass (or canvas ops) implementing the print recipe in
  the style section. For long video, prefer stills + `ken-burns` push or pre-bake with `mgl export`.
- source: `styles/woodcut/demo/engine/filter.js` (`woodcutFilter`), `hatch.js` (`hatch`, Jobard–Lefer), `knife.js` (`prof`,
  `drawStrokes`), `print.js` (`makePrinter`); `demo/stills/frame_filter.jpg` (photo → woodcut, carved live at t = .25/.45/.65/.85).
- value: a striking, very "crafted" image treatment for book trailers, folk/heritage brands, history explainers, portraits
  in editorial pieces; an agent can apply it to any `src` the host provides. Relation: our `duotone` "ink etching with
  cross-hatch" preset and `line-draw-on` `engrave` are uniform hatch looks; this one follows form and carves in.

### `carved-light-burst` — EXTENDS `speed-lines`
- look: on black wood, a burst of tapered white U-gouge rays is carved outward from a point (a lamp, molten metal, an idea);
  the colour plate floods the carved white with copper and later withdraws to a single highlight.
- params: n ≈ 36 rays, inner radius r0 300 px, outer r1 ∈ [420, 640], width ≈ 10 px (U-gouge profile √(1−(1−a)²) at both
  ends), angle jitter and slight bend, reveal from the centre over ~0.5 s with per-ray jitter; plate α ramps 0 → 1 at the peak.
- build: add `style: 'woodcut'` to speed-lines: rays drawn white on a black mask (radial, not converging on a subject),
  `reveal: {startFrame, durationFrames, jitter}`, `plate: {color, from, to, withdrawTo: 'highlight'}`, then the style's print
  pass. Props `n, r0, r1, width, bend, center`.
- source: `styles/woodcut/demo/engine/index.js` `rays`; styleboard `woodcut_0.jpg` (pour shot with copper rays).
- value: "light is carved" hero moment — product reveal, eureka beats, a city powering on — in any print style.

### `print-pull` — EXTENDS `page-turn` (transition)
- look: a brayer rolls ink across the block (a wet highlight band sweeps), paper lays down, the baren spirals and the
  image soaks through, then the sheet peels off on a cylinder toward camera — heavy, then fast — its back showing the
  mirrored show-through; a mirrored title on the block now reads true on the print.
- params: peel curve (u ∈ [0,1]): e = u < .22 ? .12·(u/.22)² : .12 + .88·(1 − (1 − (u−.22)/.78)^2.2); fold line
  xf = W·(1 − e) (−12 px overshoot after u .9); curl radius r = 4 + 150·sin(π·min(1, 1.05u))^0.7; perspective distance
  F 2400 px (lifted paper grows toward camera); shadow α .38; brayer wet band = smoothstep(wetX+40, wetX−60, x)·(0.05 + 0.22·noise²).
- build: new page-turn variant `print`: props `incoming` (print face), `outgoing` (block face, rendered with the block-mode
  look and `scaleX(−1)` text), `stages: {brayer, lay, baren, peel}` in frames. The curl: split the sheet at xf; the part beyond
  the fold is drawn mirrored, wrapped around a cylinder of radius r (sample columns, x' = xf − r·sin(φ), y scaled by
  F/(F − r(1−cos φ))), darkened by a cylinder shading term; drop shadow under the lifted part.
- source: `styles/woodcut/demo/trans.js` (`curl`, `peelState`); `engine/print.js` block mode (`wetX`, sheen); STYLE.md §5, §8.
- value: the reveal transition for any print style (woodcut, risograph, silkscreen, newsprint); "mirror → true" reveals of a
  name, a vote result or a logo.

### `stab-flecks` — EXTENDS `snowfall`
- look: snow (or sparks, stars, chips) as short white stab cuts in black wood; they fall, can freeze mid-air, and at the
  end can be "inked back in" one by one until the black is clean.
- params: radius 3–8 px; stab profile sin(π·min(1, 1.35u))^0.6·(1 − 0.35u) (a teardrop); a slight shared angle; only visible on
  dark masses (add black banks/sky behind); freeze = stop time for the layer; re-ink = draw the same flecks in ink colour on a
  stagger.
- build: snowfall gains `style: 'stab'` with `freezeAt`, `reinkFrom`, `reinkStagger`, `angle`, `sizeRange`; flecks are SVG
  teardrop paths drawn white on the mask layer (print pass applies).
- source: `styles/woodcut/demo/engine/index.js` `flecks`, `knife.js` stab profile; DEMO.md story (snow inked back in).
- value: an ending no other medium has (the sky cleared); starfields and sparks in print styles; "rain stopped / disease
  receding" metaphors.

---

## _template (schema note)

`styles/_template/` defines what every lemo style folder contains — a useful schema for our own `StyleDef`:

- **style.json** (catalogue card): `slug`, `num`, `en`, `cn`, `category_en`, `category_cn`, `film` (demo title), `line` /
  `line_cn` (one sentence: what happens in the demo), `uses` (3 use cases), `frame_sec` (time of the poster/style frame in the
  demo), `dur` (demo length). Folder also holds `poster.jpg`, `<slug>.srt`, `demo/` and `demo/stills/styleframe.jpg`.
- **STYLE.md** (rules that hold for *every* film in the style, 6–11 KB, fixed section numbers so other guides can refer to
  them): 1 Essence & what it is not (3–5 defining traits + confusable styles and the line between them); 2 Materials &
  rendering (medium, how code imitates it, what is procedural/world-anchored vs screen-space); 3 Colour logic (rules, number of
  hues, neutral ground, what the accent is reserved for, one example palette marked as example); 4 Type & subtitles (licence-free
  faces, roles, size ranges, how subtitles belong to the world, reading-time rule ≥ max(1.8 s, speech + 0.6 s)); 5 Motion quality
  (fps, ones/twos, easing families, what never moves); 6 Camera grammar (table: move | what it expresses | can serve; framing
  rules; allowed/forbidden transitions); 7 Sound palette; 8 Native moves (menu, each with "fits content like" ≥ 3 examples
  unlike the demo); 9 Pitfalls of the medium (each with a fix); 10 Engine (reusable files and functions + a minimal example not
  in the demo); 11 Variation space (what the agent decides; three structures, three openings, three endings).
- **DEMO.md** (everything specific to one example film): story & structure, shot table with times, score structure, palette &
  props, end card, build notes, and for "scene styles" a `content.json` field table.
- **Rule worth copying**: a number measured in a demo becomes a *rule* in STYLE.md, while the demo's actual value stays as an
  example in DEMO.md; no story, BPM or palette props in the style file.
- **Suggested additions to our `StyleDef`** (beyond id/name/family/description/useFor/palette/steps/overlays/step/fonts/tags/source):
  `notConfusedWith: [{style, line}]`; `colourLogic: {hues, ground, accentReservedFor, never}`; `fonts.hand`, `fonts.mono`,
  `subtitle: {placement, treatment, readingRule}`; `motion: {fps, step per layer ('characters'|'all'), easing, cutGrid,
  transitionsAllowed[], transitionsForbidden[]}`; `camera: [{move, expresses, serves}]`; `nativeMoves: [{name, motionIds[],
  fitsContentLike[]}]`; `pitfalls: [{problem, fix}]`; `mediaSteps` (filter chain for image sources only — needed by
  visual-investigation); `variation: {structures[3], openings[3], endings[3]}`; `uses[3]`; `posterFrame`.

---

---

## OPUSCAR 98 — extra style ideas beyond the 59 style folders

Source: `lemo-opuscar/styleboard/opuscar98_styles.json` (98 films, each with `style_en`, `blend_en`, `render`, `dim`,
`prompt_en`, `shots[]`, `direction_en`), `docs/opuscar98.jpg`, `docs/opuscar98-styles.jpg` (CC BY 4.0 docs, LemoLab).
The 98 prompts are text recipes, not code; 77 are 2D, 4 are 2.5D and 17 are 3D. Everything below is paraphrased. Hexes and
fractions come from the prompts.

### What the 98 prompts teach as a schema (worth copying into our `StyleDef`)
- **Sizes as fractions of the frame**, never pixels: line width "1/600 of frame width", dot pitch "1/250", stroke length
  "1/80–1/40". Our style props should take `lineW`, `dotPitch` and `strokeLen` as fractions of W, so a style renders the
  same at 1080p, 4K and 1080×1920.
- **The hero-colour rule**, used in about 70 of the 98: the whole frame stays in the style's restricted palette (or greyscale), and
  only the subject the story centres on carries one accent (default terracotta `#D97757`). Lamps and fires stay neutral.
  That is one engine feature: a `keepHue` / `heroMask` step that desaturates everything except a masked layer or
  a hue band. Part B's `selectiveColor` / `chromaKeep` is the same idea. Every style gets an `accent` = "hero only" role.
- **Values as area budgets**: "deep black 25–35 % of frame", "70 % above mid-grey", "gold ≥ 1/10 of frame". A review
  script could measure these from a still and warn.
- **Each style has a "signature shot" + camera grammar + "Avoid:" list.** We should add `signatureShot`, `camera[]`
  and `avoid[]` fields to `StyleDef`; part E's `_template` note proposes the same.
- **Develop-in openers**: many prompts say "the picture builds in the first 1–1.5 s, then holds". Examples: typewriter art
  that types itself, graphite construction lines, a daguerreotype developing, a blueprint standing up into 3D. That is one
  generic `build-in` wrapper with per-style reveal modes.

### Already covered by a style folder (no new style)
2 Art Deco revue → `art-deco` · 3 Kollwitz woodcut → `woodcut` · 7 B&W rubber hose → `rubber-hose` · 11 WPA silkscreen →
`silkscreen-poster` (adds split-fountain blends) · 12 Technicolor impasto → `impasto` · 17 Gothic stained glass →
`stained-glass` · 23 Hirschfeld caricature → `one-line` · 29 UPA cartoon → `midcentury-toon` · 30 cyanotype engineering
sheet → `blueprint` (adds red-pencil notes) · 40 three-ink riso night → `risograph` · 52 child's wax crayon → `crayon-book` ·
53/63 transparent watercolour, field journal → `watercolor` · 59 combat pen & wash → `urban-sketch` · 67 Sabuda pop-up →
`paper-popup` · 81 quiz-show studio → `game-show` · 84 polished silent B&W → `silent-film`.

### Extra style ideas (one line each; `proposed-style-id` — idea · key recipe)
1. `ortho-tint-3d` — 3D graded as a 1927 orthochromatic print: reds go black, whites blended halfway to amber `#FFCC80`, one hero in colour, iris open (No. 1).
2. `albumen-panorama` — moving 1880s gold-toned albumen photo: three horizontal smear copies scaling with camera speed, cream multiply `#F2DCB4`, umber blacks `#2E1C0F`, hand-tinted hero (4, 47).
3. `silver-screen-3d` — 1930s MGM silver B&W on a real 3D Deco set: ~40 % deep black, glossy floor reflections, one high light shaft, overhead "chess-piece" shot (5, 9).
4. `art-nouveau-litho` — Mucha panel: doubled brown contours `#4B3326`, pastel flats with hard shadow tone, ring halo, whiplash vines, serif band (6).
5. `sea-chart-copperplate` — Admiralty chart: 1/1200-W burin hatching, rhumb lines from 32-point roses, graduated border, cartouche, route that inks itself in, engraved vignette for the action (8).
6. `letterpress-newsprint` — 1890s newspaper: type as a sharp mask, then a noisy threshold for ink spread, show-through, wood-type headline blocks slamming down, line-engraved pictures (10).
7. `charcoal-erasure` — Kentridge-style charcoal: tooth catches peaks, eraser-lift mist streaks, palimpsest of earlier drawings, fog bands at different speeds (13).
8. `gouache-landscape` — Kyffin Williams opaque gouache: ragged directional strokes 1/80–1/40 W, broken dark dash outlines, knife flecks on dark hills (14).
9. `wartime-litho-poster` — three-plate stone lithograph (colour flats, crayon shadow plate, key line), 1–3 px off-register, boiling paper grain at 12 fps; variants 1940s war-bond with 45° halftone bands and 1924 four-stone speckle (15, 43, 54).
10. `glamour-still-bw` — airbrushed 1940s studio portrait: Rembrandt-triangle key, diagonal blind-slat shadows, diffusion glow, 30–40 % black (16).
11. `typewriter-art` — image typed in a mono grid: key ladder `. : - = + o X # M`, overstrikes for darks, half-inked ribbon, hero struck in red, types itself in 1 s (18).
12. `picture-magazine-spread` — 1946 photo essay: 45° halftone at 1/250 W across a two-page spread with gutter crease, hero on a spot-orange plate at another angle (19).
13. `graphite-illustration` — 1940s magazine pencil: perspective rays, then pressure contours, then 1–4 hatch passes, then rubbed tone and eraser lifts; hero in coloured pencil (20).
14. `fog-castle-3d` — deep-focus B&W 3D: lower-third fog, far plane at 60–70 % grey, silver sky, soft overcast, no hard shadows (21).
15. `wood-type-poster` — Hatch Show Print letterpress: three inks 2–4 px off, pinholes, starved patches, linocut figures, wood-type banners, bump on every beat (22).
16. `dufy-offset-wash` — colour washes deliberately 10–40 % oversized and slid 1/30 W off a dense, quick ink line; cobalt/lemon/rose overlaps (24).
17. `circus-chromolitho` — Strobridge four-stone litho: flat chrome yellow / vermilion / cobalt / key, screens only on gradients, radial lines converging on the action (25).
18. `high-key-bw` — 1950s high-key beach photo: 70 % above mid-grey, halation, blown lace foam, hero in colour (26).
19. `blotted-line-tempera` — Ben Shahn: jittery broken ink line with a faint offset ghost, tempera blocks 2–4 px off, dry-brush streaks (27).
20. `kinescope-tv` — B&W broadcast on a curved 1950s CRT inside a warm illustrated living room, cold screen glow on walls, push through the glass (28).
21. `epic-3d-technicolor` — 65mm-epic 3D: hard 50° sun, warm haze mixed 20 % into the mid-distance, monumental repeated architecture, low tracking shot (32).
22. `bass-line-set` — Saul Bass title lines that grow into a one-point-perspective grid set, 4–5 grey steps plus one orange-red `#E2472A` (33).
23. `technicolor-stage-3d` — 1961 musical stage set: red-orange painted sky `#E0481E`, raking low sun, dense built detail, mannequin figures (34).
24. `epic-poster-gouache` — 1960s painted film poster: three-value modelling, warm–cool contrast, a hero gesture on the diagonal (35; Remington variant 65).
25. `satirical-print` — Hogarth / Rowlandson hand-coloured copperplate: washes spilling off the line, caricature crowd, a handwritten speech balloon (36).
26. `fashion-ink-wash` — Bob Peak: fast swelling ink line, pink/magenta pools, a frieze of 9–10-head figures repeated across the frame (37).
27. `storybook-alpine-3d` — sculpted (not low-poly) 3D meadows: emerald `#3FA33A` / cobalt sky, wind-bent grass, flight → descent → low orbit (38).
28. `old-master-glaze` — Holbein oil: material-specific rendering (fur, velvet ridges, metal with two highlights), craquelure, warm varnish (39; Rembrandt top-light chiaroscuro variant 45).
29. `toy-theatre` — Pollock's paper theatre: printed card flats with white scissor margins, candle footlights casting 1.5× flickering shadows, gilt proscenium (41).
30. `warhol-photo-silkscreen` — halftone photo plate over hand-painted colour blocks offset 1/100 W, silver ground, squeegee flood and streak, figure repeated 2–3× (42).
31. `pushed-16mm-3d` — gritty 1970s doc grade: cyan shadows, warm-brown mids, clumped ±8 % grain, handheld low rushing lens (44; 35mm sunrise variant 49).
32. `post-cover-illustration` — Leyendecker / Rockwell block-plane modelling with blended strokes 1/150 W, warm key and cool shadows, narrative bystanders (46, 62).
33. `hopper-realism` — flat pale institutional planes, hard sun parallelograms `#FCE6AC` crossed by frame shadows, stillness then one sudden event (48).
34. `gag-cartoon` — New Yorker single panel: nib line with flicked ends, pale washes slipping off the line, a deadpan caption written letter by letter (50).
35. `egg-tempera` — Wyeth: hairline cross-hatched strokes, muted straw/umber, wind-combed grass blades, a small lonely subject (51).
36. `block-print-textile` — Rajasthani dabu: stamp blocks of 1/8 H misregistered 2–4 px, dye bleed along the weave, mud-resist crackle inside indigo, paisley frieze (55).
37. `polaroid-album` — faded snapshots in a magnetic album: lifted teal blacks, white borders, photo-booth strips, ballpoint captions, push into a photo that comes alive (56).
38. `rococo-silhouette` — black cut-paper profiles with 2–3 px gold rims toward candles, gilt and velvet opera-box frame, flickering ±5 % halos (57).
39. `aerial-3d-flocks` — warm 1980s location grade, thousands of instanced birds lifting in staggered waves as the hero passes (58).
40. `gongbi-silk` — Chinese court painting: iron-wire outlines, mineral pigments under a 30 % ochre glaze, ruled-line architecture, silk weave (60).
41. `airbrush-chrome-80s` — Nagel figures, Sorayama banded chrome, mint/pink, plus a cyan technical-callout overlay that counts things (61).
42. `natural-history-plate` — hand-coloured engraved specimen plate: Fig. 1 in the centre with numbered part figures and a legend; one thing moves (64).
43. `selective-color-bw` — Schindler-grade B&W with an S-curve and ±6 % silver grain, exactly one saturated object, long-lens crowd (66).
44. `illuminated-manuscript` — vellum, lapis, vermilion, raised burnished gold that a candle glint sweeps across, gilded initial, interlace borders, textura (68).
45. `scrapbook-collage` — 6–10 overlapping taped items (watercolour, map, sepia photo, notes, pressed flower), push into the painting (69).
46. `blueprint-to-3d` — blueprint elevation stands up via dolly-zoom into golden-hour 3D, colour spreading out from the hero (70).
47. `portrait-miniature` — Hilliard limning: ultramarine oval ground, shell-gold flecks, lead-white dots, gold locket on damask, arched motto (71).
48. `dv-camcorder` — 1990s DV register: chroma bleed, macroblocks, interlace, breathing exposure, REC/date OSD; petal-blizzard transition back to the clean register (72).
49. `floor-mosaic` — Roman tesserae at 1/150 W: two or three courses following each outline (opus vermiculatum), dark grout, slow glints on gold-glass tesserae (73).
50. `window-marker-math` — translucent wax-marker formulas on leaded glass, chosen symbols joined by glowing gold lines into a figure; chalk-slate variant (74).
51. `fosse-silhouette-stage` — black stage, backlit red cells through haze, rim-lit black dancers, one big neon shape, follow spot (75).
52. `concept-art-watercolour` — Alan Lee: granulated washes over pencil, 3–5 aerial-perspective planes, one burning light source, cut-away fantasy map (76).
53. `arcade-fighter` — 320×180 nearest-neighbour ×6, scanlines, 5×7 pixel font, health bars with a damage trail, 3–4-frame hit-stop and white flash, K.O. (77).
54. `long-exposure-night` — sodium `#F2A24A` against cyan `#3FD0D8`, continuous headlight ribbons with hot cores, snow seen only in light cones (78).
55. `stencil-graffiti` — 3–5 sprayed stencil layers on brick, overspray and drips, paint sinking into the mortar joints, torn paste-up (79).
56. `deakins-dusk-3d` — sky 60 % of frame, sun 1–2° up, low saturation, a backlit hero with a long shadow toward the lens, locked low wide shot (80).
57. `tech-manual` — military TM line art: exploded views on a dash-dot axis, circled callouts, WARNING boxes, olive/sand tints, animated on twos (82).
58. `padded-wall-oscilloscope` — tufted gold wall or peeling layered paint, thin gold scope lines crossing the wall as the sound (83).
59. `kirby-comic` — tapered brush, Kirby Krackle, CMYK Ben-Day 45° on aged newsprint, panel-to-panel camera, dots growing on push-ins (85).
60. `daguerreotype` — cased silver plate in a brass mat with a tarnish halo; the image develops shadows-first behind a left-to-right front in 3 s (86).
61. `long-take-3d` — Birdman corridor: practical lights every 2–3 m, one flickering fluorescent, handheld sway ±1°, one unbroken 20–40 s take (87).
62. `microfiche-reader` — CMYK halftone shown on phosphor-green monochrome, scan bar every 4 s, sideways fiche slide as the scene change (88).
63. `moonlight-oil` — blue-violet `#32377a` / teal / magenta-rim night portraiture in low-contrast short strokes (89).
64. `underwater-3d-teal` — projected moving caustic cells 1/20 W, shafts, warm practicals against teal fog (90).
65. `linen-postcard` — Curt Teich linen weave (ink only on raised threads), "Greetings from" 3D block letters each holding a scene, card on a desk that comes alive (91).
66. `section-axonometric` — dimetric 7°/42° cut-away section with poché, scale figures and 1 px lines; crane along the rooms (92).
67. `soft-pastel` — grey-violet toned paper `#7d7079` with tooth speckle, upright grass strokes, gold → rose → violet sky drift (93).
68. `scrimshaw` — needle hatching on a whale tooth lying on an oak table: rope border, ribbon motto, one gloss streak (94).
69. `multiverse-jumps` — ray-marched universes, each with its own grade, linked by a googly-eye prop; rainbow-ring burst transition (95).
70. `particle-fireball-3d` — ~500k-particle fireball behind the hero acting as a halo, warm glow on everything, IMAX grain and halation (96).
71. `neon-night-photo` — real neon tubes (glass, core, clips, jumper wires), wet-ground vertical reflections, snow tinted by spill (97).
72. `telephoto-dip-road` — 2–5° horizontal FOV stacking road dips into waves, subject sinking and reappearing, heat mirage growing with distance (98).
73. `lautrec-litho` — Belle Époque poster: wobbly flat plates, loaded-brush outlines (blunt start, swelling middle, split dry tail), crachis spatter only on shadow sides (< 15 % of frame), one big figure cropped in front (31).

The most reusable of these for our library are the cross-cutting pieces: `selective-color-bw` / hero `keepHue`,
`typewriter-art` (a new image filter), `daguerreotype` develop-in, `linen-postcard` + "Greetings from" letters,
`floor-mosaic` (an image filter), `microfiche-reader`, `dv-camcorder`, `arcade-fighter` HUD, `stencil-graffiti`,
`illuminated-manuscript` gold glint, `toy-theatre` and `section-axonometric`. Most of the 3D ones are camera/grade recipes
for `three-kit`, not new styles.
