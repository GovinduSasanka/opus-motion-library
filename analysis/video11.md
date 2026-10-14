# video11 — "A life, in one breath" (egg → old age → egg loop, opus 5.5)

## Overview

| | |
|---|---|
| Resolution / fps | 1920×1080, 24 fps, 30.06 s (720 frames). No audio. |
| Theme / story | A full human life cycle that loops. A pregnant woman sits in an armchair. An ink blob opens on her belly and turns the room into a blueprint X-ray, which falls away into a microscope world: sperm meet the egg, a fertilization wave runs out, two pronuclei fuse, the cell cleaves 2→4→8→16, the blastocyst implants, somites appear, the first heartbeat pulses, and the fetus grows and turns head-down. A white-out marks birth. Then come the first breath (X-ray lungs and coloured cry arcs), a grip on a finger, crawling (top-down), a height chart, an eye whose pupil opens into a retina mosaic of memories, a brain whose fibre tracts myelinate, a near-miss on a bike, and a dance where two heartbeats sync. The next generation repeats the chair and height chart. A day/night time-lapse ages the couple, the partner's chair empties, and the old woman vanishes. A cream ripple blob swallows the room and inverts to navy, the rings collapse to a star, a new egg forms, "opus 5.5" types on, and the egg wobbles and collapses to black. |
| Art style | Two render worlds alternate. (1) **Warm storybook world**: flat vector illustration with 3–4 px near-black ink outlines (`#10131C`), fine diagonal hatch texture on fills, cream walls and paper grain, diagonal sunbeams with hatched rays, slow push-in camera, and characters drawn on twos. (2) **Scientific HUD world**: deep navy void with faint star dust and diagonal streak particles. Bioluminescent line-art cells (white-lavender strokes with glow, honeycomb texture inside the cytoplasm), teal/magenta/cyan accents, thin reticle circles, tick-marked axes, scale bars, mini-charts and monospace typewriter labels. Some overlays carry the HUD world into the warm one (lungs X-ray, red hazard HUD, dance trails, ECG panel). |
| Palette | **Void/HUD**: bg `#020414` (centre `#050717`), vignette corners `#01000F`; reticle lines `#302F4E`/`#3C3D54` (≈15–25 % lavender); HUD text `#A2A2C7`; tree/axis strokes `#A09FC2`; scale bar `#898AA8`. **Cells**: membrane highlight `#D8DAF5` (core `#F7FFFF`); cytoplasm `#282D6D`→`#34387E`; cell fill `#1E204A`; cumulus cells `#8683D8` strokes on `#40408E`; zona after fertilization: teal `#A3EDE6` core with glow `#5FD6C8`. Female pronucleus `#C35CCB`; male `#62CAD8`. Somites green `#4FD39A`/`#64BFA1`; heart/heartbeat magenta `#E05DD5` (ring `#7B5884` at alpha); fibre tracts lavender `#C8D0F5`, cyan `#7FE0E8`, green `#64BFA1`, magenta `#E05DD5`; dendrite synapse gold `#D3B761`; chart trace teal `#40868B`; placenta `#C0407A`. **Warm world**: wall `#D9C7A9`, floor `#BD9062`/`#D39D67`, chair teal `#26635F`, cardigan `#CC6174`, hair `#B8482D`, skin `#EDC09E`, blossom `#EDC3CD`, sky `#8FC0DE`, frame wood `#68462C`, sunbeam `#E5D5B6` @ 40 %, ink `#10131C`. Plaza `#CC856F`; asphalt `#5C5F72`. **Overlays**: hazard red `#D9313B`; dance trail magenta `#E978D6` and yellow `#F4D96A`; cry arcs magenta `#D95B9E`, green `#5EE0A0`, yellow `#F0C040`, cyan `#62CAD8`; bronchi `#60CEAA` with alveoli dots `#4FD8E8`; lungs `#75778C` @ 70 % with a honeycomb pattern. Cream paper (birth / end blob) `#F3F0E6`. Night grade: multiply ≈ `#6A6AB0`, so the wall reads `#8B7B87`. |
| Fonts | **HUD labels**: a monospace (JetBrains Mono / IBM Plex Mono look), lower-case, 26–30 px at 1080p (≈2.6 % H), letter-spacing +2 %. Colour `#A2A2C7` on the void, `#FDCCFB` for magenta events, and dark navy `#1E2A4A` on the warm scenes ("first breath / lungs inflate · t = 0 s"). A block cursor `▊` follows the typing. Two-line labels: the title is about 30 px and the sub-line about 22 px at 70 % opacity. **Hand-written numerals** (height marks, ages "30 40 50 60 70" on the wall): a thin blue pencil script (`#5B6FB8`). |
| Frame cadence | The source is 24 fps, but the warm character animation and many HUD elements are **animated on twos** (12 fps): identical pairs of frames at 7.54/7.58, and a strict 2-frame diff pattern at 11–12 s and 18–20 s. The time-lapse at 24–26 s cuts every **3 frames**. Camera pushes are smooth at 24 fps. |

## Timeline

| # | t (s) | On screen | Motion | Transition out |
|---|---|---|---|---|
| 1 | 0.00–1.29 | Pregnant woman in a teal armchair, side view. Window with blossom tree, sunbeam, steaming tea. A faint HUD reticle circle (r≈150 px) already sits on her belly. | `ken-burns-push`: 1.0→1.11 over 1.25 s, drifting towards the belly. Steam and dust drift. Hands are on twos. | `organic-blob-reveal` starts from the belly |
| 2 | 1.29–1.66 | A navy blob with a fuzzy, hairy edge grows from the belly (1146,506) and reveals `blueprint-xray-style` (the same room as white line-art on navy). | Blob r: 41→78→131→217→323→421→513→584→637 px per frame. | Covers the frame by 1.62 |
| 3 | 1.66–1.80 | Blueprint room | `card-tilt-recede`: scale 1→0.45, rotate 0→12°, slides down-left, fades | Cross-dissolve to the star (2 f) |
| 4 | 1.79–2.10 | Navy void, reticle, a white 8-point star glint at the centre, sperm swimming inward | `starburst-flare`, then `ring-sweep-build` (egg zona arc draws clockwise with a comet head, 1.875→2.08). The egg scales up 0→230 px r. | — |
| 5 | 2.10–2.50 | Egg with corona cells, honeycomb cytoplasm, female pronucleus; ~13 sperm converge | `wavy-swimmers-converge` | — |
| 6 | 2.50–2.90 | One sperm enters at the upper right (flash). | `pulse-shockwave-ring`: fertilization wave r 230→346→404→424→450 px over 0.35 s. The zona recolours lavender→teal. Other sperm fade. | — |
| 7 | 2.90–3.55 | Male (cyan) and female (magenta) pronuclei with radiating "aster" spikes | `twin-dot-fusion`: both drift to the centre (≈0.55 s, easeInOut) and fuse into a white flash at 3.50 | — |
| 8 | 3.55–5.20 | Cleavage: 2 cells (3.83), 4 (4.25), 8 (4.5), 16 (4.75), morula (5.0). A binary-tree diagram grows top-left, the corona cells fade out, and labels "day 1…day 3" and "100 µm" appear. | `cell-cleavage-cascade` + `branching-tree-diagram` + `typewriter-mono-label` + `scientific-hud-reticle` | — |
| 9 | 5.20–6.00 | Blastocyst (hollow ring and magenta inner cell mass). A magenta uterine wall with wavy lines slides in from the right. The blastocyst hatches out of the zona (the ghost ring stays behind and fades) and moves right to the wall, which flashes on contact (5.75). | Wall: x 1920→1260 over 0.6 s, easeOutCubic. The camera pans right ≈100 px. | Hard cut at 6.00 |
| 10 | 6.00–7.45 | Embryo (kidney-shaped line-art), side inset circle (yolk sac), label "day 20 · somites" | `sequential-segment-build`: about 12 green somites, one every 2–3 f, with a glowing scan dot running down the spine. The heart tube draws on in magenta (7.0–7.4). | — |
| 11 | 7.45–8.00 | — | `bloom-whiteout-flash` (magenta, 7.50, 1 f peak), then 2 `pulse-shockwave-ring`s from the heart (r≈190→400→545→640 px over 0.33 s). "day 22 · first heartbeat" types on. An ECG starts bottom-right. | Hard cut at 8.00 |
| 12 | 8.00–9.42 | Fetus in a womb circle with umbilical cord and placenta. HUD: growth curve (kg vs wk) top-right, "wk 8 → wk 40 · 3.4 kg" counter bottom-left, ECG bottom-right. | `growth-scale-counter`: fetus scale ×2.4 plus camera zoom ×1.25. `live-chart-trace` on the curve and the ECG. | — |
| 13 | 9.42–9.79 | Fetus rotates head-down (180°, 2 f on twos). A light glows at the bottom of the womb. | `bloom-whiteout-flash` grows from the cervix | White-out 9.83→9.96. Cream hold 10.00. |
| 14 | 10.00–10.96 | Newborn in a white swaddle on a teal blanket, top view | Fades in from cream (4 f). `anatomy-xray-overlay` (lungs with growing bronchi, 10.25), then the baby cries: `sound-arc-burst` (10.42–10.92). Label "first breath". | Hard cut at 11.00 |
| 15 | 11.00–11.96 | Macro: baby fist grips an adult finger | `emphasis-tick-flicker` around the knuckles (squeeze pulses at 11.1, 11.5) | Hard cut at 12.00 |
| 16 | 12.00–12.96 | Top-down: baby crawls off a concentric rainbow rug towards a table and pulls up to stand (12.6). A dotted trail is left behind. | `topdown-follow-cam`: world pans ≈−480 px x, +320 px y in 0.5 s, easeOut | Hard cut at 13.00 |
| 17 | 13.00–13.96 | Height chart: a child stands against a door frame and a hand pencils marks. The child grows taller (head swaps for each age), and drawings appear on the wall. | `vertical-track-growth`: wall scrolls down ≈600 px/s while the child's head stays at y≈360. Marks 1–8 are written on. | Hard cut at 14.00 |
| 18 | 14.00–14.17 | Extreme close-up of a green eye | Push-in | `pupil-portal-zoom` (14.17–14.25) |
| 19 | 14.21–15.96 | Circular "lens" of memories on navy: kite, sailboat, birthday cake, dog, book, fireworks, mountain. Counter "1 / 7", label "retina · cone mosaic". | `retina-mosaic-toggle`: each memory is shown clean for 2 f, then as a phyllotaxis cone mosaic for 4 f (6 f period) | Hard cut at 16.00 |
| 20 | 16.00–17.96 | Brain in sagittal view (lavender outline glow); inset neuron circle; "synapses" chart (0–25 yr) | `outline-comet-trace` (16.0–16.2). `fiber-tract-wipe` back→front (16.4–17.4). `branching-growth-stroke` (dendrites with gold synapses, 16.1–17.0). `live-chart-trace` (rise, then pruning). Frontal flare at 17.5; "prefrontal cortex · myelin ~25" types on. | Hard cut at 18.00 |
| 21 | 18.00–19.96 | Top-down street: a cyclist rides in the bike lane and a blue car pulls out | `topdown-follow-cam` follows the cyclist. `hazard-sensor-overlay` (red sensor rings, velocity line "v", "0.25 s reaction time", swerve-path arrow, 18.75–19.55). The cyclist swerves. | Hard cut at 20.00 |
| 22 | 20.00–21.96 | Top-down plaza with string lights: a couple dances | `motion-trail-ribbons` (magenta / yellow loop trails with bead dots). `dual-heartbeat-sync` panel at the bottom ("in sync" types on). At 21.58 a spark where their hands meet. | Hard cut at 22.00 |
| 23 | 22.00–22.96 | Next generation: the same armchair composition, a red-haired woman in a yellow cardigan, a couple photo on the wall | `ken-burns-push` 1.0→1.07 | Hard cut |
| 24 | 23.00–23.96 | Height chart again, a boy in a striped shirt | `vertical-track-growth` | Hard cut |
| 25 | 24.00–26.00 | Living room: the couple and the kid, then the couple ages | `daynight-timelapse-flicker`: 3-frame alternation of day (season variants: blossom, autumn, snow, summer) and night (blue grade, moon). Ages "30 40 50 60 70" are hand-written on the wall. The partner's chair is empty from 25.0. | Hard cut at 26.00 |
| 26 | 26.00–27.42 | Old woman alone in the armchair at autumn dusk. A window "bubble" glint, plants growing. | `ken-burns-push` ≈1.10 over 1.2 s with a slight pan. She closes her eyes (27.33). | `fade-vanish-spark`: she is cut out at 27.42 and a dark spark appears at (1596,410) |
| 27 | 27.58–27.96 | Cream blob with a fuzzy edge and thin concentric ripple rings grows from the spark | `organic-blob-reveal` (end variant, 7 f, accelerating) | `ripple-invert-collapse`: hard invert to navy at 28.00 |
| 28 | 28.00–29.45 | Navy with 8 concentric rings that collapse into the centre, then a star (28.25), twin pronuclei (28.5), and the egg rebuilt with `ring-sweep-build` (28.67–29.0) | "opus 5.5" types bottom-right of the egg (29.0–29.35) | — |
| 29 | 29.45–30.06 | Egg membrane wobbles (noise displacement), crumples inward, shrinks to a glowing point (29.75), black at 29.875 | `wobble-collapse-out` | End (black) |

## Motion techniques

### `organic-blob-reveal`
**Look:** an irregular, slowly morphing blob grows from a seed point and reveals a different render of the scene inside (navy blueprint at the start, cream paper with ripple rings at the end). Its rim is fuzzy and hairy: hundreds of short dark bristle strokes (6–20 px long, 1 px, `#10131C` @ 60 %) stick out normal to the edge, like ink bleeding into felt. A thin 2 px dark rim line sits under the bristles.

**Measured:**
- Opening (seed at the belly, 1146,506): equivalent radius per frame 41, 78, 131, 217, 323, 421, 513, 584, 637 px (1.29→1.625 s, **9 f**). Growth accelerates over the first 4 f and then becomes nearly linear at about 100 px/f. Fits `cubic-bezier(0.55,0,0.45,1)` with r_max ≈ 1300 px (beyond the frame corners).
- End (seed at 1596,410): 48, 126, 227, 368, 523, 657, 768 → full frame (27.58→27.875, **7 f**), stronger ease-in (`cubic-bezier(0.6,0,0.9,0.6)`). The centroid drifts towards the frame centre (950,530) as it grows.
- Blob shape: 5–7 lobes, radius noise ±12 %, rotating slowly (≈20°/s). Not a circle.

**Remotion/SVG:** build a closed path from N=64 polar samples `r_i = R(t)·(1 + 0.12·noise2D(cos θ_i, sin θ_i, t·0.6))` with a Catmull-Rom → Bézier smoothing. Use it as a `<clipPath>` on the "inside" layer. Bristles: for 300 seeded angles, draw a `<line>` from the edge point outward along the normal, length `6+14·rand`, with a jittered angle of ±15°. Centre lerp: `c = lerp(seed, frameCentre, ease(t))`.

**Props:** `seed {x,y}`, `durationFrames`, `easing`, `maxRadius`, `lobeNoise=0.12`, `bristleCount=300`, `bristleColor`, `inside` (ReactNode), `centerDriftTo?`.

### `blueprint-xray-style`
A render variant of an illustration. Fills become navy `#070818`, every ink line becomes a 1.5–2 px white-lavender stroke `#D8DAF5` with a soft outer glow, and hatch areas become dense white hatching. Faint construction circles and guides are overlaid (a reticle r≈300 px around the subject). In Remotion, author each illustration as SVG with a `variant: 'color'|'blueprint'` prop. Blueprint mode sets `fill: none` (or the navy fill) and `stroke: #D8DAF5` and adds an `feGaussianBlur` glow copy at 35 %. **Props:** `strokeColor`, `bg`, `glow`.

### `card-tilt-recede`
The full-frame blueprint layer recedes like a sheet of paper dropped away: scale 1→0.85→0.45, rotate 0→+8°→+12° (clockwise), translate towards the lower-left/centre, opacity 1→0.6→0, over **5 f (1.625→1.79)**, easeInCubic. The next scene (void with star) is underneath. **Remotion:** `const p = Easing.in(Easing.cubic)(clamp(t/5))`, then `transform: translate(${-80*p}px, ${60*p}px) rotate(${12*p}deg) scale(${1-0.55*p})` and `opacity = 1-p` in the last 40 %. Optionally add `perspective(1200px) rotateX(${15*p}deg)`. **Props:** `durationFrames=5`, `rotateTo=12`, `scaleTo=0.45`, `direction`.

### `starburst-flare`
A white 8-point star glint marks a moment of origin (before the egg, after the inverted rings, and at fusion). Elements: 8 thin rays (2 long at 70 px, 6 short at 40 px, `#FFFFFF`, some tinted cyan `#7FE0E8`) rotated randomly; a radial glow `#C8C8FF` r≈120 px @ 60 %; and an optional thin ring r≈50 px. Timing: pops in over 1–2 f (scale 0→1.2→1), holds 3–5 f with a slight rotation (+10°), then either shrinks into the next element or fades over 3 f. **Props:** `rays=8`, `size`, `glowRadius`, `tint`, `inFrames=2`, `holdFrames`.

### `ring-sweep-build`
**Look:** a circular object (the egg) is constructed by a bright arc that sweeps clockwise from about 10 o'clock. The arc has a glowing comet head: a white dot with a radial glow of r≈30 px. Everything inside (cytoplasm, honeycomb) and outside (corona cells) is revealed by the same angular sweep, like a conic wipe. At the same time the circle radius grows.

**Measured:** sweep angle ≈ 120° (1.875), 220° (1.917), 300° (1.958), 330° (2.0), 345° (2.04), 360° (2.08): **~6 f, easeOutCubic**. Radius 0→128→208→220→230 px (easeOutCubic, 4 f, no overshoot). The corona cells appear in the swept sector with a 1–2 f lag and a small scale pop (0.6→1). Repeated at 28.67–29.0.

**Remotion:** use a conic mask `<mask>` containing a `<path>` pie wedge from `θ0` to `θ0+sweep`, applied to the inner and outer groups. Draw the membrane as `<circle strokeDasharray={C} strokeDashoffset={C*(1-sweep/360)} transform="rotate(θ0)"/>` and place the comet head at the arc end.

**Props:** `radius`, `startAngle=-150`, `sweepFrames=6`, `growFrames=4`, `headGlow`, `children`.

### `wavy-swimmers-converge`
About 13 sperm (head: an ellipse 10×7 px, white core `#EAFBFF` with a cyan rim; tail: a 1.5 px white path about 90 px long) start off-screen and swim radially towards a target circle. Each follows a faint dotted guide path (1 px, `#3C3D54`, dash 2/6) that is a gentle S-curve. The tail undulates as a travelling sine: `y(s) = A·sin(k·s − ω·t)` with A = 6 px, wavelength 45 px, ω ≈ 2π·4 Hz, amplitude growing towards the tail tip. Speed ≈ 250 px/s, slowing as they approach (easeOutQuad), and they stop at the corona radius (≈330 px) pointing inward. On the fertilization event the losers fade over 6 f. **Props:** `count`, `target`, `stopRadius`, `speed`, `tailLength`, `waveHz`, `color`.

### `pulse-shockwave-ring`
A thin ring expands from a source with fast ease-out and fades. It is used for the fertilization wave and the heartbeat (2 rings, the second 2 f later), and in spirit for the end ripples.
- Fertilization: r 230→346 (+2 f)→404 (+4 f)→424 (+6 f)→450 (+8 f). That is **easeOutExpo over ~8 f**, stroke 2 px white-lavender. Opacity 1→0 over the last 50 %. At ring launch the zona stroke recolours `#D8DAF5`→teal `#A3EDE6` (3 f cross-fade) with a 2× glow.
- Heartbeat: launched from the heart at 7.54. r ≈ 190 (+1 f), 400 (+3 f), 545 (+5 f), 640 (+7 f); stroke 3 px `#7B5884` (magenta at 55 %). Paired with `bloom-whiteout-flash`.

**Remotion:** `r = r0 + (rMax-r0)*(1-Math.pow(2,-10*u))`, with `u = (f-start)/dur` and `opacity = interpolate(u,[0.5,1],[1,0])`. **Props:** `center`, `r0`, `rMax`, `durationFrames=8`, `count=1|2`, `gapFrames=2`, `color`, `strokeWidth`.

### `twin-dot-fusion`
Two glossy dots (r 18 px: magenta `#C35CCB` and cyan `#62CAD8`, each with a white specular dot and 20–30 radiating aster spikes of 1 px, 30–60 px long, rotating slowly) drift from their own positions to a meeting point. Path: a slight curve, easeInOutCubic, 0.55 s (2.9→3.45). On contact the spikes fade, a white flash r 60 px expands with `starburst-flare`, and on the next beat one dot splits into two daughter nuclei (3.83). Generic use: "two things combine into one". **Props:** `a`, `b`, `meet`, `colors`, `travelFrames=13`, `flash`.

### `cell-cleavage-cascade`
**Look:** a glossy cell divides repeatedly inside a fixed ring: 1→2→4→8→16, then a morula, then a hollow blastocyst. Each cell is a translucent sphere: radial gradient `#8C90E0`→`#2E3877`, a white 2 px rim with a teal inner arc, a small bright nucleus, and a soft highlight at the upper left.

**Measured:** divisions at 3.83, 4.25, 4.50, 4.75, 5.0. Each split takes **3–4 f** (on twos): the cell elongates (scaleX 1→1.25), pinches, and two daughters move apart to packed positions with easeOutBack (overshoot ≈ 5 %). Daughter radius = parent·0.79 (volume-conserving 2^(-1/3)). Total cluster radius stays within the zona (r≈190 px). Blastocyst at 5.25: the cells reorganise to a ring of small cells (cavity) plus a magenta inner cluster (`#B05AC8`) at the 3 o'clock side, over 4 f.

**Remotion:** precompute packed layouts for n = 1, 2, 4, 8, 16 (circle packing in a disc, seeded). For each generation, map each child to its parent and interpolate the position from the parent centre with `spring({damping:14, stiffness:220})`. Step the frame with `Math.floor(f/2)*2` for the on-twos feel.

**Props:** `generations=[1,2,4,8,16]`, `splitTimes[]`, `containerRadius`, `cellColor`, `onTwos=true`.

### `branching-tree-diagram`
A binary tree (top-left, 310×150 px, 1.5 px `#A09FC2` lines, root marked with a small open circle) gains one level per division. Each new level's horizontal bar draws out from its parent's centre over 2 f, then the vertical drops draw down over 2 f. Leaf count = cell count. Generic use: a doubling or exponential growth indicator. **Props:** `levels`, `levelTimes[]`, `width`, `height`, `color`.

### `scientific-hud-reticle`
The persistent instrument overlay around the hero object:
- 3–4 concentric circles (r ≈ 360, 420, and the frame-height circle; 1 px `#302F4E`).
- 6 radial spoke segments between the two outer rings.
- A dashed tick ring (ticks 6 px every 3°).
- A long diagonal axis at −28° through the centre with minor ticks every 30 px, ending in 8 px open circles.
- A scale bar under the object (340 px wide, ticks every 17 px, label "100 µm").
- A leader line to a corner label ("day 3").

It fades in over 6 f with an opacity stagger per part. During zooms (fetus) it scales with the camera; it does not rotate. **Props:** `center`, `radii[]`, `axisAngle`, `scaleBar {width,label}`, `spokes=6`, `color`, `opacity`.

### `typewriter-mono-label`
Monospace lower-case labels type on with a solid block cursor (`▊`, same colour, 55 % opacity) that sits after the last char and blinks at 4 Hz when idle. Measured speeds: "day 22 · first heartbeat" ≈ 23 chars in 0.33 s (**~3 chars/frame**); "opus 5.5" in 0.35 s (**~1 char/frame**, i.e. ~2 chars per 2 frames on twos). Labels often have a leader line (1 px) that draws on first (3 f). The middle dot " · " separates the stage from the descriptor. **Remotion:** `text.slice(0, Math.floor((f-start)*cps/fps))` plus the cursor `<rect>`; the cursor is removed 12 f after finishing. **Props:** `text`, `charsPerFrame`, `cursor=true`, `color`, `leader {from,to}`, `subText?`.

### `sequential-segment-build`
A row of rounded rectangles (somites: 40×28 px, r 10, fill `#1C5E4A`, stroke 2 px `#4FD39A`, inner speckle dots) appears one at a time along a curved spine path. A glowing scan dot (white core, green glow r 25) leads, and each segment pops in (scale 0.4→1, 2 f, easeOutBack) as the dot passes. Rate ≈ 1 segment per 2–3 f (12 segments in 6.08→7.0 s). Generic use: progress along a path, counting up items. **Props:** `path`, `count`, `framesPerItem=2.5`, `itemShape`, `leaderGlow`.

### `bloom-whiteout-flash`
A full-screen additive bloom from a point.
- **Heartbeat** (7.50): for 1 f the whole frame lifts (mean luminance 16→37), a magenta radial glow r≈300 px `#FFACFF` sits at the heart and a lavender veil `#5B4A8F` @ 40 % covers everything. It decays over 4 f (luminance 37→29→24→23).
- **Birth** (9.67→10.0): a white glow at the bottom of the womb grows from r 60 to the full frame over 4 f (easeInQuad), the scene desaturates to grey `#9A9A9A`, and the frame holds pure cream `#F3F0E6` for 1–2 f. The next warm scene then fades in from cream over **4 f** (opacity 0→1, linear).

**Remotion:** absolutely positioned `<div>` layers with `radial-gradient` and `mix-blend-mode: screen`, opacity keyed. **Props:** `origin`, `color`, `peakFrames=1`, `decayFrames=4`, `toSolid?` (`#F3F0E6`).

### `live-chart-trace`
Mini line charts: the growth curve (kg vs wk), ECG (bottom-right, magenta `#E05DD5`) and synapses (teal `#40868B`, axis labels 0 2 6 12 18 25). The plotted line grows from the left. The head is a white dot (r 5) with a glow, and on the growth chart an open ring (r 16) that pulses. Chart axes are 1 px `#A09FC2` with tiny monospace axis titles ("kg", "wk", "synapses"). The ECG scrolls at about 160 px/s with a spike every ≈ 0.42 s (≈140 bpm). The growth curve reveals sample points one per 0.25 s with a dot marker. The synapse curve rises quickly to a peak at x = "2", then declines (pruning). The ECG background has a faint grid with 40 px verticals. **Props:** `data[]`, `progress`, `color`, `headStyle`, `axes {x,y,labels}`, `mode: 'reveal'|'scroll'`.

### `growth-scale-counter`
The subject grows while its counter ticks. Fetus scale 1→2.4 (8.0→9.33, easeInOutSine, slightly stepped on twos). The womb, HUD and charts get a camera zoom ×1.25 over the same span. Label "wk 8 ·" → "wk 12 · 14 g" → "wk 20 · 300 g" → "wk 36" → "wk 40 · 3.4 kg", each re-typed with `typewriter-mono-label`. At the end the subject rotates 180° (head-down) over 2 f (9.42→9.5). **Props:** `scaleFrom`, `scaleTo`, `cameraZoom`, `stages[{t,label}]`, `flipAt?`.

### `anatomy-xray-overlay`
A semi-transparent anatomical layer laid over a warm illustration: lungs (`#75778C` @ 70 % fill with a honeycomb pattern of 12 px hexes, rim glow `#B8B8FF`). The trachea and bronchi grow as `branching-growth-stroke` in green `#60CEAA` with cyan alveoli dots, plus a small magenta heart. Fade-in over 3 f (10.25), then the bronchi grow over ≈ 6 f. Labels sit in dark navy mono. On "inflate" the lungs scale 1→1.06 (breath) on twos. **Props:** `shape`, `pattern`, `opacity`, `growthPaths[]`.

### `branching-growth-stroke`
A recursive branching structure that draws itself from the trunk outward (bronchi, dendrite tree in the neuron inset, and in spirit the tree diagram). Depth 5–6. Each level's strokes reveal via `strokeDashoffset` over 3–4 f, and each child level starts when its parent is 70 % drawn. Terminal nodes pop in as dots (gold `#D3B761` synapses r 4–6, or cyan alveoli r 3) with a scale pop of 2 f. The dendrite inset (circle r 130, white rim with tick marks) completes in ≈ 0.9 s (16.1→17.0). **Remotion:** generate an L-system / recursive tree with seeded angles (±25–35°, length ×0.72 per level). Use `pathLength` for the dash reveal. **Props:** `depth`, `angleSpread`, `lengthDecay`, `framesPerLevel=3`, `tipColor`, `seed`.

### `sound-arc-burst`
Short coloured arcs (each spans 60–120°, 3–4 px, with round caps) appear around a head in concentric bands (r ≈ 380–620 px). Colours rotate magenta, green, yellow, cyan. Each arc grows its radius by +80 px and fades over 8 f, with a new set every 2 f (on twos). There are also short black "emphasis" dashes (20–40 px) around the head. Duration 10.42–10.92. Generic use: a loud cry or exclamation. **Props:** `center`, `colors[]`, `radiusRange`, `spawnEveryFrames=2`, `lifeFrames=8`.

### `emphasis-tick-flicker`
3–5 short dark ink ticks (1.5 px, 12–20 px long) radiate around a point of action (the baby's squeezing knuckles). They appear for 2 f, vanish for 2 f, and reappear shifted 4 px outward. A squeeze pulse is the hand scale 1→1.03→1 on twos. **Props:** `anchor`, `count=5`, `spreadDeg=120`, `flickerFrames=2`.

### `topdown-follow-cam`
A top-down tracking camera that keeps the subject (crawling baby, cyclist) near a fixed screen anchor while the world layer translates. Crawl: world moves ≈ (−480, +320) px in 0.5 s, then decelerates (easeOutQuad). Street: ≈ −550 px/s easing to −200 px/s while the car enters. The subject itself moves slightly within the frame (±80 px) for life. **Remotion:** the world group gets `translate(anchor - subjectWorldPos(t))`, smoothed with a critically damped spring (`damping:20`). **Props:** `subjectPath(t)`, `anchor`, `smoothing`.

### `vertical-track-growth`
Height-chart scene. The camera tracks upward as the child grows, so the wall scrolls down ≈ 600 px/s (0.55 H/s) and the head stays at y ≈ 360. The child body is redrawn taller in steps (every ~0.25 s, a new age pose). A pencil-holding hand at the top marks a new tick (horizontal 40 px line plus a hand-written number) every step; the line draws in 2 f. New drawings (a kid's sun and stick-figure picture) pop in on the wall. **Props:** `steps[]`, `scrollSpeed`, `markColor`, `headY`.

### `pupil-portal-zoom`
An extreme close-up of an eye. The pupil is the portal: over **3 f (14.167→14.25)** the dark pupil circle (`#0A0F22`) expands from r≈90 to beyond the frame (r ≈ 1100, easeInCubic). An inner lens disc (r 0→430→500) shows the next scene with a spherical bulge (fish-eye) and an inner vignette. The iris and eyelids scale up with the pupil (camera push ×6) and leave the frame. A square window-reflection highlight (`#FFFFFF` @ 80 %, 4-pane) stays on the lens at the upper left. The final lens is r = 500 px at the centre, with an outer dark ring band and a faint tick ring. **Props:** `eyeCenter`, `pupilR`, `lensR=500`, `durationFrames=3`, `inner` (ReactNode), `reflection=true`.

### `retina-mosaic-toggle`
**Look:** an image inside the lens alternates between clean and a "cone mosaic": rounded Voronoi tiles (each tile = average colour of the image under it, corner radius 30 %, separated by 3–4 px navy grout `#1A2236`), arranged as a **phyllotaxis spiral** (golden angle 137.5°), smaller near the centre (fovea: 8 px) and larger at the rim (32 px). There are about 1500 tiles.

**Measured cadence:** 6 f per memory. The clean image shows for 2 f, then the mosaic for 4 f (switches at 14.33, 14.5→14.58, 14.75→14.83 …). Seven memories, with the counter "k / 7" top-left (mono, `#A2A2C7` @ 60 %).

**Remotion:** precompute phyllotaxis points `r = c·√i`, `θ = i·137.508°`, with tile size ∝ r. Draw each as a rounded `<path>` from a Voronoi cell (d3-delaunay) inset by 2 px. Sample the colour from a pre-rendered low-res version of each image (canvas `getImageData` at build time). Toggle the layer by `(f-start)%6 >= 2`.

**Props:** `images[]`, `framesClean=2`, `framesMosaic=4`, `tileCount`, `fovea`, `grout`, `counter`.

### `fiber-tract-wipe`
**Look:** a brain outline (4 px white-lavender rim, inner glow) fills with hundreds of fibre streamlines (1–2 px, colours lavender `#C8D0F5`, cyan, green, magenta; additive). They are revealed by a vertical wipe from back to front (left→right) whose leading edge is a bright vertical band (white, 6 px, blurred 10 px) with sparkles. A white flare (r 120) blooms at the frontal pole at the end (17.5).

**Measured edge x:** 552 (16.42), 664 (16.5), 728 (16.67), 824 (16.75), 936 (16.92), 1064 (17.0), 1160 (17.17), 1288 (17.25), ≈1340 (17.5). That is about **880 px/s (0.46 W/s)**, roughly linear but advancing in steps every 2–4 f (tract bundles pop as groups).

**Remotion:** generate the streamlines as smoothed random walks along a vector field inside the brain mask. Clip the group with a `<rect width={edgeX - x0}>`. The edge is a separate blurred `<rect>`. Each bundle also gets its own `strokeDashoffset` grow (8 f), triggered when the edge passes its start x.

**Props:** `mask`, `fiberCount=600`, `colors[]`, `direction='ltr'`, `durationFrames=24`, `stepFrames=2`, `endFlare`.

### `outline-comet-trace`
A glowing comet (white core r 4, glow r 30) runs along an outline path (the brain rim) and leaves the full-brightness stroke behind it. The rest of the outline is dim (40 %). Around 1 lap in ≈ 0.25 s (16.0→16.25). **Props:** `path`, `durationFrames=6`, `glow`, `trailLength`.

### `hazard-sensor-overlay`
**Look:** a red (`#D9313B`) technical overlay on a warm top-down scene:
- 2 overlapping sensor circles (r ≈ 200 and 180, 3 px) around the cyclist, with dashed radial ticks and 4 crosshair stubs.
- Concentric arc ripples (5 arcs, 1 px, fading outward to r≈420).
- A velocity line drawn down from above the car to the impact point, with an arrowhead and the label "v".
- A curved swerve-prediction arrow from the cyclist to the right (3 px, arrowhead).
- A label "0.25 s" (bold mono 30 px) with "reaction time" under it (16 px, 60 %).

Timing: the ripple arcs appear first (18.75), the circles snap in (2 f), the velocity line draws down (4 f), the label types on, and the arrow draws (6 f, 19.0–19.25). The overlay rides with the cyclist and fades out over 4 f at 19.5. **Props:** `anchor`, `threatFrom`, `predictedPath`, `label`, `color`.

### `motion-trail-ribbons`
Each moving character leaves a thick neon tube trail along its path: magenta `#E978D6` and yellow `#F4D96A`, 14 px wide with a 2 px dark centreline (`#2A1E3A`) and bead dots every ~70 px. Paths are looping trochoids (orbits with small curls), because the dancers orbit each other. The trail is drawn by extending the path as the character moves (`strokeDashoffset` tied to the arc length travelled) and never fades within the shot. The characters carry a small matching halo ring (r 70, 3 px). Where their hands meet, a white `starburst-flare` (21.58). **Props:** `paths[]`, `colors[]`, `width=14`, `beadSpacing=70`, `progress(t)`.

### `dual-heartbeat-sync`
A translucent dark rounded panel (970×140 px at the bottom centre, `#2A1E3A` @ 55 %, radius 14) holds two ECG traces (magenta and yellow, 2 px) with heart icons on the left. The traces scroll left. They start out of phase and gradually align: the phase offset lerps to 0 over ≈ 1.5 s, with the spikes coinciding by 21.5. Then the label "in sync" types on at the upper right of the panel. A dot grid row sits along the top edge. **Props:** `colors`, `bpm`, `syncProgress`, `label`.

### `daynight-timelapse-flicker`
A static interior shot that cuts between states every **3 frames**. Even states are "day" in a different season (window content swaps: blossom, autumn sunset with a low orange sun, snow, summer green), plus incremental content changes (ages written on the wall, characters aging, the partner gone). Odd states are "night": the same layout with a cool multiply grade (≈ `#6A6AB0` @ 55 %), a moon in the window, and lamps off. Over 2 s that gives ~16 states, so the eye reads time racing. **Remotion:** `state = Math.floor((f-start)/3)`, `isNight = state%2===1`, `dayIndex = Math.floor(state/2)`. Render `<Scene variant={dayStates[dayIndex]} />` with a `<NightGrade/>` overlay (a `<div>` with `mix-blend-mode:multiply` plus a moon sprite). **Props:** `dayStates[]`, `framesPerState=3`, `nightTint`, `moon`.

### `fade-vanish-spark`
A character "passes": eyes close (27.33), then the character is hard-removed in 1 f (left-behind props stay, like the blanket on the chair). A tiny dark 6-point spark (12 px) appears at head height 2 f later and becomes the seed of the next `organic-blob-reveal`. **Props:** `removeAt`, `sparkAt`, `sparkPos`.

### `ripple-invert-collapse`
The end blob's inside is cream paper with 8 thin concentric rings (1 px, `#C8C4BA`, radii stepping 45 px, plus a centre crosshair). At 28.00 there is a hard cut to the same rings inverted (navy bg, `#2A2B48` rings). The rings then contract into the centre (r × (1−p), easeInCubic, 6 f, 28.0→28.25) and become a `starburst-flare`. Generic use: "everything returns to a point", a loop reset. **Props:** `ringCount=8`, `spacing`, `invertAt`, `collapseFrames=6`.

### `wobble-collapse-out`
Final exit. The circular membrane's radius gets low-frequency noise (amplitude 0→18 % over 4 f, 6–8 lobes, animated fast), so it crumples. The whole object then scales to 0.15 (6 f, easeInBack), concentrating into a glowing point. The point fades in 3 f to pure black. The title stays until the crumple. 29.45→29.875. **Props:** `noiseAmp`, `lobes`, `durationFrames=10`, `endGlow`.

### `ken-burns-push`
Slow camera push on warm scenes: ×1.11 in 1.25 s (opening), ×1.07 in 0.95 s (22 s), ×1.10 in 1.2 s with a +40 px pan (26 s). So ≈ 8–9 % scale per second, linear or easeInOutSine, focus point near the subject's torso. **Props:** `from=1`, `to`, `focus`, `durationFrames`.

### `ambient-streak-particles`
Atmosphere on both worlds:
- In the void: sparse star dust (1 px dots `#3C3D54`) plus short diagonal streaks (8–14 px, 1 px, `#3A4A8A` @ 50 %, angle ≈ 60°) drifting slowly along their own direction (~40 px/s), like rain in the vitreous.
- In warm scenes: dust motes in the sunbeam (2–3 px cream dots drifting up) and fine rain hatch on surfaces.

Seeded and continuous across cuts. **Props:** `count`, `angle`, `speed`, `color`, `kind:'streak'|'mote'`.

### `animate-on-twos`
Global stylisation: character and overlay animation holds every pose for 2 frames (12 fps) while camera moves run at 24. Implement as a wrapper `useSteppedFrame(step=2)` that returns `Math.floor(frame/step)*step` to the child animation, while the camera uses the raw frame. **Props:** `step=2`.

## Transitions

| Transition | When | How |
|---|---|---|
| Organic blob reveal | 1.29–1.62 (into blueprint), 27.58–27.875 (into cream rings) | Fuzzy-edged noise-blob mask grows from a seed point (see `organic-blob-reveal`) |
| Tilt-recede + dissolve | 1.625–1.83 | Blueprint card shrinks, rotates and fades over the void; 2 f dissolve to the star |
| Star origin | 1.83, 28.25 | `starburst-flare`, then `ring-sweep-build` constructs the next object |
| Hard cuts | 6.0, 8.0, 11.0, 12.0, 13.0, 14.0, 16.0, 18.0, 20.0, 22.0, 23.0, 24.0, 26.0 | Straight cuts on whole seconds (scenes are 1–2 s long) |
| White-out | 9.67–10.17 | Bloom from the cervix → cream hold → 4 f fade-in of the warm scene |
| Pupil portal | 14.17–14.25 | The pupil expands to fill the frame and reveals the lens scene |
| Flicker time-lapse | 24.0–26.0 | 3-frame cuts between day and night states |
| Vanish | 27.42 | 1-frame removal of a character |
| Colour inversion | 28.00 | Hard invert cream→navy with identical ring geometry, then collapse |
| Crumple to black | 29.45–29.875 | `wobble-collapse-out` |

## Camera

- **Warm scenes:** slow 2D push-ins (≈ 8–9 %/s) towards the subject (`ken-burns-push`). Top-down scenes (crawl, street) use `topdown-follow-cam`. The height chart uses a vertical track (`vertical-track-growth`). The eye uses a fast push into the pupil (×6 in 3 f).
- **HUD scenes:** mostly locked off and centred on the hero object at (960,540). A small pan right (≈100 px) follows the blastocyst to the wall (5.5–5.9). Zoom ×1.25 during the fetus growth (8.0–9.33). The reticle and charts are in world space for the zoom; the corner labels are screen space.
- There is no 3D camera. Every move is a 2D affine transform.

## Library candidates

- `organic-blob-reveal` — a fuzzy, ink-bleed blob mask reveal from any point; scene-to-scene or "look inside" transition.
- `blueprint-xray-style` — a render variant that turns any illustration into glowing line-art on navy ("under the hood").
- `card-tilt-recede` — drop a full-frame layer away (scale + rotate + fade) to exit a scene.
- `starburst-flare` — a white star glint for origins, moments of creation, or hits.
- `ring-sweep-build` — construct a circular object with a clockwise comet-arc conic wipe.
- `wavy-swimmers-converge` — many agents with undulating tails converging on a target (competition, demand).
- `pulse-shockwave-ring` — ease-out expo ring wave for events (heartbeat, activation, impact).
- `twin-dot-fusion` — two entities travel to meet and fuse into one (merge, partnership).
- `cell-cleavage-cascade` — exponential doubling of packed circles (growth, scaling, replication).
- `branching-tree-diagram` — a binary tree that gains levels in sync with a counter (doubling indicator).
- `scientific-hud-reticle` — instrument overlay of rings, spokes, tick axis and scale bar for a hero object.
- `typewriter-mono-label` — a monospace label typed on with a block cursor and leader line.
- `sequential-segment-build` — items pop in one by one along a path behind a glowing scan dot.
- `bloom-whiteout-flash` — a full-screen additive flash or white-out for big moments and birth/scene resets.
- `live-chart-trace` — mini line chart / ECG that draws or scrolls with a glowing head.
- `growth-scale-counter` — subject scales up with a camera zoom while a typed counter steps.
- `anatomy-xray-overlay` — a translucent patterned organ layer over an illustration ("what's inside").
- `branching-growth-stroke` — a recursive tree that draws itself, with tip dots (neurons, bronchi, roots, networks).
- `sound-arc-burst` — multicolour partial arcs bursting from a source (cry, shout, loud sound).
- `emphasis-tick-flicker` — tiny flickering ink ticks to emphasise a physical action.
- `topdown-follow-cam` — top-down camera tracking a moving subject through a world layer.
- `vertical-track-growth` — the camera rises with a growing subject, with marks written on a scale.
- `pupil-portal-zoom` — push into an eye whose pupil becomes a lens onto another scene.
- `retina-mosaic-toggle` — an image alternating with a phyllotaxis Voronoi mosaic (perception, pixelation, memory).
- `fiber-tract-wipe` — a bright-edged wipe that reveals dense streamlines inside a mask (wiring, maturation, data flow).
- `outline-comet-trace` — a glowing comet lighting up an outline path.
- `hazard-sensor-overlay` — a red predictive HUD (sensor rings, velocity vector, swerve arrow, timing label).
- `motion-trail-ribbons` — neon tube trails following moving characters (dance, choreography, routes).
- `dual-heartbeat-sync` — two ECG traces that drift into phase (connection, synchrony).
- `daynight-timelapse-flicker` — 3-frame day/night alternation with incremental state changes (time passing, aging).
- `fade-vanish-spark` — an instant character removal leaving a seed spark (loss, ending).
- `ripple-invert-collapse` — concentric rings invert colour and collapse to a point (loop reset).
- `wobble-collapse-out` — a noisy crumple-and-shrink exit to black.
- `ken-burns-push` — a slow push-in on illustrated scenes.
- `ambient-streak-particles` — drifting star dust, streaks and dust motes for atmosphere.
- `animate-on-twos` — a stepped-frame wrapper for a hand-animated 12 fps feel.
