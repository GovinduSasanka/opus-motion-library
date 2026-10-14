# video2 — "Living Illustration Showreel" (rapid-cut gallery of 24 animated stills → mosaic of hundreds)

Scratch frames: `analysis/frames/video2/` (`o_*.jpg` 6 fps overviews, `s*/z*` per-shot bursts and zoom strips, `motionmaps.jpg` = per-shot temporal-std heatmap in red over the first frame, `m_XX.png` mid-shot full-res frames, `trip_*.jpg` start/mid/end triptychs, `d_mosaic.jpg` finale cut).

## Overview

| Property | Value |
|---|---|
| Resolution | 1080 × 1080 (1:1) |
| FPS | 24; all shot animation runs **on ones** (no holds) except the final mosaic (≈50 % held frames) |
| Duration | 30.76 s (737 frames) |
| Audio | AAC present (ignored); the cut rhythm is clearly beat-locked |

**Story/theme.** A showreel of AI-generated "living illustrations": 24 unrelated single-subject artworks, each in a radically different illustration style (X-ray, iridescent 3D, painterly fur, anime landscape, Memphis pattern, engraving, glitch, low-poly, crosshatch…), each shown for one beat (~1.08 s) with a subtle in-place loop animation, ending with a hard cut to a 23 × 23 mosaic of hundreds of thumbnails ("…and hundreds more"). No text, no camera moves, no transitions — the energy is entirely in the edit cadence and the variety.

**Art style.** Per-shot: every shot is a full-bleed square illustration with a single centred subject and one "alive" element (a looped micro-animation driven by a procedural effect). Edges full-bleed except shots 20 (letterboxed truck on cream mat) and 14/16 (hairline borders).

**Palette.** No global palette — each shot has its own (see table). Recurring: deep navy/black backgrounds (`#020714`, `#030409`, `#0d1018`), cream paper (`#efe4d3`, `#e7ddc7`, `#eee6d9`), saturated reds (`#b43523`, `#7d1135`, `#be3d1b`).

**Fonts.** None.

## Timeline

Cut frames detected with `select='gt(scene,0.25)'`. Standard shot = **26 frames (1.083 s)**, alternating 26/27 to stay on a 13/12 s grid (≈55.4 BPM half-notes / 110.8 BPM beats). Double-length shots = 52 frames.

| # | Frames | Start–End (s) | Subject / style (dominant colours) | Micro-animation (what moves) | Out |
|---|---|---|---|---|---|
| 1 | 0–25 | 0.00–1.08 | X-ray of a bag with keys, phone, coins; blue luminescent on navy (`#020714 #1d4066 #3d76a2 #82b9d7`), rotated ≈−20° | **Scan beam** sweeps left→right (x 0.22W→0.88W, ≈0.75 W/s, linear) with glow; faint full-frame flicker/scanlines | cut |
| 2 | 26–52 | 1.08–2.21 | Soap-bubble cluster by a sink drain; glossy iridescent (`#cad8de #9fddd9`) | Bubbles drift/jiggle, thin-film rainbow rims rotate hue, a few small bubbles pop/appear | cut |
| 3 | 53–78 | 2.21–3.29 | Rooster head, painterly strand-based feathers on black (`#030409 #61552a #481619`) | Thousands of feather strokes ruffle in a wind-like wave; head micro-turn; eye blink | cut |
| 4 | 79–104 | 3.29–4.38 | Anime summer landscape: cumulonimbus, power poles, red vending machine, rice paddy (`#fbf9f7 #3288bd #8b4348`) | 2–3 dragonflies fly zig-zag paths; paddy reflections shimmer | cut |
| 5 | 105–130 | 4.38–5.46 | Maroon bowling ball on lane with neon reflection (`#7d1135 #29303c`) | Ball **rolls toward camera in place** (finger holes travel down ≈25 % of diameter/s) under a fixed specular window highlight | cut |
| 6 | 131–156 | 5.46–6.54 | Tortoiseshell sunglasses on Memphis-pattern background (`#fdf5d7 #d8b36a #76ab96 #ad616e`) | Glasses **wobble & spawn offset echo copies** (2–3 ghost outlines stepping up-right), confetti jitter | cut |
| 7 | 157–182 | 6.54–7.63 | Car POV, rainy windshield over sea, glowing gauge (`#1d2028 #808891`) | **Wiper sweeps** from horizontal up ≈65° (pivot bottom-right) over 1 s, wiping drops; drops/streaks slide | cut |
| 8 | 183–209 | 7.63–8.75 | Kid in an orange retro helmet-pod (`#ebeede #be3d1b #2c3137`) | Eyes look around (saccades every ≈0.3 s) + one blink; slight head shift | cut |
| 9 | 210–235 | 8.75–9.83 | Synthwave gumball machine of eyeballs on checker floor (`#2b2542 #01000d #803c56`) | Eyeballs swivel; background **horizontal glitch bands** + settle (motion energy decays 9→3 over 0.5 s = ease-out) | cut |
| 10 | 236–252 | 9.83–10.54 | Engraved cast-iron skillet with egg, cream paper (`#efe4d3 #3d3632`) — 17 frames | **Line-boil** steam squiggles & hatching re-drawn every frame | cut |
| 11 | 253–287 | 10.54–12.00 | Denim zipper "Y" on red (`#b43523 #141a25`), Swiss-grid guide lines — 35 frames | Zipper slider bobs up/down a few px, metal glint sparkle | cut |
| 12 | 288–313 | 12.00–13.08 | Bike at snowy railway crossing, watercolour (`#466b8c #edf2f7`) | **Snowfall** (fine particles drifting down-right) | cut |
| 13 | 314–339 | 13.08–14.17 | Heat-map paint blob spilling from tipped jar, starfield (`#0d1018 #c1cb7f #6f0d28`) | **Metaball blob grows/spreads**, iso-contour colour bands (maroon→red→orange→yellow→mint) | cut |
| 14 | 340–365 | 14.17–15.25 | Woven lawn chair on pool deck (`#dacebd #694332 #6d9e9a`) | Pool surface switches from wire-grid to **caustic ripple** texture in 3 frames (motion energy 0.8→5.2), then ripples scroll | cut |
| 15 | 366–392 | 15.25–16.38 | Purple cassette, synthwave grid + lightning (`#472b54 #261521 #7a869b`) | **Electric arcs flicker** (random jagged polylines re-generated each frame) | cut |
| 16 | 393–444 | 16.38–18.54 | Glass kettle seen through a Mondrian window grid (`#c7c1b4 #000001 #c06b45 #c0ad70 #677489`) — 52 f | **Each pane refracts the image with its own offset/tint**; offsets drift slowly (energy ramps 0.6→2.0 = ease-in), hold every 12 frames | cut |
| 17 | 445–496 | 18.54–20.71 | Magnifying glass over psychedelic swirl/vortex, cream paper (`#e7ddc7 #972b3d #82b19e`) — 52 f | Strands inside lens **flow along a curl field** (non-rigid swirl), outer sketch strokes boil | cut |
| 18 | 497–523 | 20.71–21.83 | Worm's-eye tower of microwave ovens (`#9fa6ae #6d7477 #a48567`) | **Random window lights switch on/off** (≈2–4 toggles per 6 fps step); a door swings | cut |
| 19 | 524–548 | 21.83–22.88 | Woman in yellow raincoat, glitched crowd behind (`#cf7c27 #263e40 #9bc4a9`) | **RGB slice glitch**: horizontal bands displaced ±2–8 % W, colour-channel split, re-randomised every 1–2 frames; figure stable | cut |
| 20 | 549–575 | 22.88–24.00 | Semi truck on desert highway, matted photo on cream (`#75808a #eee6d9`) | **Datamosh column smear** above the truck: horizontal slices of the image stack and jitter in a vertical column | cut |
| 21 | 576–601 | 24.00–25.08 | Road worker in hi-vis vest & helmet, low-poly paint (`#3e3e39 #d1ee15 #c4602b`) | Head bob; **retro-reflective strips flash** (sheen sweep) on frame 2–3 then shimmer; light streaks pass in background | cut |
| 22 | 602–627 | 25.08–26.17 | Man wrapped in iridescent crystal-facet coat (`#faefd7 #9ee691 #844171`) | **Facet colours cycle** every frame (energy 10–18: all facets change) | cut |
| 23 | 628–653 | 26.17–27.25 | Toaster, cross-hatched (`#866f35 #c6b899 #182b23`) | **Toast pops** up in 0.25 s with small settle; heat shimmer lines | cut |
| 24 | 654–693 | 27.25–28.92 | Red fire hydrant buried in snow, white field (`#f4f6fa #dfd3d7`) — 40 f | Fine wind-blown snow streaks across | **hard cut** |
| 25 | 694–736 | 28.92–30.76 | Mosaic 23 × 23 of ~47 px square thumbnails (all styles; first tiles = shots above) | Near-static; tiles twinkle subtly (alternating held frames) | end |

## Motion techniques

### `beat-hardcut-montage` (core edit pattern)
- **Look:** one illustration per beat, hard cuts only, every shot fully different in style; standard length **26 frames (1.083 s)**, with occasional 2× shots (52 f) to give a breather mid-reel (shots 16–17), and a 40 f last shot before the finale. No transitions, no fades, no titles.
- **Recipe:** `<Series>` over `shots[]`; `durationInFrames = round(beats·fps·60/bpm)`; accumulate fractional frames so cuts stay on the grid (26/27 alternation). Every shot component receives `localFrame` and loops its micro-animation so it looks "alive" from frame 0 (no intro ease).
- **Props:** `bpm` (≈55.4 half-time), `shots[] {component, beats}`, `fps`.

### `xray-scan-sweep`
- **Look:** monochrome cyan-blue X-ray image (objects drawn as additive translucent shapes, brighter where overlapping) with a **vertical scan beam**: bright core line (3–4 px, `#e6f6ff`), 40–60 px soft glow (`#82b9d7` at 40 %), 2–3 thin secondary lines trailing 20–30 px behind, travelling left→right at ≈0.75 W/s linear; the region under the beam is +20 % brighter. Background has faint horizontal scanlines (1 px every 4 px, 6 % opacity) and a slight luminance flicker (±3 %, random per frame).
- **Recipe:** content `<g style="mix-blend-mode:screen">` of shapes with `fill-opacity 0.25–0.5` and `stroke` outlines; beam = `<rect>` with linearGradient horizontal (transparent→white→transparent) at `x = interpolate(frame,[0,dur],[0.2W,0.9W])`; brightness boost via a clipPath around beam applying `filter: brightness(1.2)`.
- **Props:** `speed`, `direction`, `beamColor`, `glowWidth`, `flicker`.

### `iridescent-bubble-cluster`
- **Look:** dozens of transparent bubbles (radius 15–60 px) packed in a cluster; each bubble = near-invisible fill, thin rim, specular highlight, rainbow thin-film arcs along the rim. Bubbles jiggle (±2 px, 0.5–1 Hz), rainbow arcs rotate around each bubble (≈60°/s), occasional small bubble pops (scale 1→1.15→0 over 4 frames) and new ones appear.
- **Recipe:** circle packing (seeded) → for each bubble: `<circle stroke="url(#rainbowConic)">` where the conic-like gradient is emulated with 6 arc segments of hue `h0 + 60k + 60·t`; highlight = small white ellipse; offset `noise2D(i, t)·2px`.
- **Props:** `count`, `radiusRange`, `hueSpeed`, `popRate`, `seed`.

### `strand-ruffle` (feathers / fur / grass)
- **Look:** subject built from thousands of short tapered strokes (feathers), each swaying with a travelling wave (as if a breeze passes): angle offset `±4°`, wave travelling top→bottom at ≈1 subject-height/s; dark background so strokes read as glowing colour (greens, ochres, reds).
- **Recipe:** generate strokes along a flow field over the subject mask (seeded); each stroke angle `θ0 + 4°·sin(2π(t·f − y/λ) + φ_i)`; draw as quadratic paths, `stroke-linecap round`, varying width 0.8–2 px. Pre-generate geometry once, only rotate per frame (cheap).
- **Props:** `strokeCount`, `palette[]`, `waveSpeed`, `amplitudeDeg`, `mask`.

### `insect-zigzag-flight`
- **Look:** 2–3 dragonflies flitting over a landscape: fast straight darts (≈20–30 % W in 4–6 frames) separated by short hovers, wings rendered as blurred translucent ellipses alternating every frame.
- **Recipe:** waypoint chain with `easeOutQuart` darts + hover jitter; wings `opacity 0.5`, `scaleY` alternating 1/0.5 each frame.
- **Props:** `count`, `bounds`, `dartFrames`, `hoverFrames`, `seed`.

### `sphere-texture-roll`
- **Look:** a glossy sphere rolls toward the viewer in place: surface pattern (finger holes, swirl lines) moves downward across the sphere and wraps around the limb, while the specular highlight (window reflection) and neon floor reflection stay fixed.
- **Recipe:** map surface features with spherical coordinates (lat, lon); per frame add `ω·t` to latitude; project orthographically `x = R cos(lat) sin(lon)`, `y = R sin(lat)`; hide back-facing (`cos(lat)cos(lon) < 0`); foreshorten shapes by the local normal. Overlay fixed highlight layer and a radial-gradient shading layer on top.
- **Props:** `radius`, `rollSpeed` (rad/s, ≈0.8), `features[]`, `baseColor`, `highlight`.

### `echo-ghost-wobble`
- **Look:** the hero object wobbles (rotation ±4°, 1.5 Hz) and leaves 2–3 **offset duplicate outlines** stepping up-right (each offset ≈4 % W, decreasing opacity 0.8/0.5/0.3), like a misregistered print; the Memphis background confetti (squiggles, triangles, dots) jitters ±2 px per frame.
- **Recipe:** `<use>` the subject N times with `transform=translate(k·dx, −k·dy) rotate(wobble(t − k·lag))`, opacity `1 − 0.3k`; lag 2 frames. Confetti = seeded scatter of primitives with per-frame random offset (`random(seed+frame)`).
- **Props:** `echoCount`, `echoOffset`, `lagFrames`, `wobbleDeg`, `confettiDensity`, `palette`.

### `wiper-sweep-clear`
- **Look:** windshield covered with droplets (circles with dark bottom rim + light top highlight, 3–12 px) and horizontal rain smears; a dark wiper blade (line, 4 px) pivots from bottom-right, sweeping from ≈5° to ≈70° over ≈1 s with ease-in-out; the area already swept is clear (drops removed) and slowly repopulates (new drops fade in over 0.3 s).
- **Recipe:** blade angle `a(t) = interpolate(easeInOutSine(t/1s), [5°, 70°])`; for each drop compute its polar angle from pivot; if `angle < a(t)` and it was "hit" → hidden, then re-spawn after random delay. Drops = `<circle>` + highlight arc.
- **Props:** `pivot`, `sweepDeg`, `duration`, `dropDensity`, `refillDelay`.

### `eye-look-blink`
- **Look:** character eyes: pupils jump between 3–4 look targets (saccade = 2-frame move, holds ≈0.25–0.35 s), one blink per ≈1 s (lids close in 2 frames, hold 1, open in 3), tiny head drift (±1 % W).
- **Recipe:** schedule of `{t, lookX, lookY}`; pupil offset = `easeOutExpo` between targets; lid = clipPath rect whose height animates.
- **Props:** `targets[]`, `blinkTimes[]`, `saccadeFrames`, `maxOffset`.

### `glitch-band-displace` (RGB slice glitch)
- **Look:** the image is cut into horizontal bands (height 4–40 px, random), a random subset (≈20–40 %) is shifted horizontally by ±2–8 % W, with chromatic split (R shifted +6 px, B −6 px) inside glitched bands, re-randomised every 1–2 frames; an "intact" foreground subject (raincoat girl) stays mostly unaffected. Gumball variant: bands only in the background, energy decays over 0.5 s (glitch → settle).
- **Recipe:** render scene to a `<pattern>`/`<image>` once; draw N `<use>` strips each clipped to its band with `translateX(offset_i(frame))`; chromatic split = 3 copies with `feColorMatrix` isolating channels + `mix-blend-mode: screen`. Seeded `random(seed + floor(frame/holdFrames) + i)`.
- **Props:** `bandCount`, `maxShift`, `rgbSplitPx`, `holdFrames`, `intensity` (animatable, for decay), `protectMask`.

### `datamosh-column-smear`
- **Look:** in a vertical column above the subject (truck), image slices are duplicated and stacked as if pixels "smear upward": thin horizontal slices (3–10 px) sampled from the subject repeated upward with random x jitter (±3 % W) and partial transparency, re-randomised each frame; rest of the frame clean.
- **Recipe:** for k in 0..N: copy of a source slice (y_src near subject top) placed at `y = y_src − k·h`, `x jitter = rand`, opacity `1 − k/N`; clip to column width ≈25 % W.
- **Props:** `columnRect`, `sliceHeight`, `stackCount`, `jitter`.

### `line-boil`
- **Look:** hand-engraved/hatched illustration where every stroke is re-drawn each frame with tiny random offsets (≈1–2 px), giving a nervous "boiling" line; steam = 4–6 wavy vertical squiggles above the pan whose phase and positions re-randomise every frame.
- **Recipe:** keep stroke geometry; per frame displace control points by `noise(i, floor(frame/boilEvery))·amp` (SVG `feTurbulence` + `feDisplacementMap` with `seed=frame` and `scale=2–3` on the whole layer is the cheap version).
- **Props:** `amp` (px), `boilEvery` (1–2 frames), `targetLayer`.

### `zipper-slide-glint`
- **Look:** zipper slider bobs ±1 % H on a sine (≈1 Hz), teeth open/close correspondingly; a 4-point star glint flashes on the metal pull (scale 0→1→0 over 6 frames).
- **Recipe:** slider y = `y0 + A sin(2πt)`; tooth pairs above slider rendered apart with spread angle proportional to distance from slider. Glint = `<path>` star with `scale(easeOutBack)`.
- **Props:** `amplitude`, `period`, `glintTimes[]`.

### `snowfall-drift`
- **Look:** fine snow particles (1–3 px, white, 60–90 % opacity) drifting diagonally down-right at varying speeds (3 depth layers: far small slow, near larger faster), slight horizontal sway. Hydrant variant: almost horizontal wind streaks (short white lines 10–30 px at 10–20 % opacity) sliding across a white field.
- **Recipe:** seeded particles per layer; `y = (y0 + v_l·t) mod H`, `x = x0 + wind·t + 3px·sin(t·f + φ)`.
- **Props:** `layers`, `density`, `wind`, `speed`, `size`, `streakMode`.

### `metaball-heatmap-blob`
- **Look:** a liquid splat (irregular blob with tendrils and satellite droplets) rendered as a **heat-map**: concentric iso-bands from centre outward deep maroon `#6f0d28` → red `#d4344a` → orange `#f08a3c` → yellow `#e9e36a` → mint `#9fe0b0` rim, with a thin dark speckled outline; the blob slowly expands/oozes (tendrils lengthen ≈3–5 % over 1 s), on starfield background.
- **Recipe:** field `F(x,y) = Σ r_i² / |p − c_i|²` over ~12 seeded metaballs whose centres move outward slowly; render by sampling F on a grid and drawing marching-squares contours for 5 thresholds (or render as a `<canvas>` in Remotion with per-pixel colour lookup). Animate centres with `c_i + v_i·t`.
- **Props:** `ballCount`, `thresholds[]`, `colors[]`, `growthSpeed`, `seed`.

### `caustic-water-texture`
- **Look:** pool water surface of bright interlocking caustic cells (turquoise `#6d9e9a` with light lines `#cfeff0`) that ripple/scroll diagonally; the shot opens with a wireframe grid that "switches on" to the caustic texture in 3 frames.
- **Recipe:** Voronoi/worley cell borders computed on a seeded point set that moves with `noise` (or `feTurbulence type=fractalNoise baseFrequency=0.03` + `feComponentTransfer` to sharpen bright ridges); animate `baseFrequency` seed or translate pattern ≈ 2 % W/s.
- **Props:** `cellSize`, `speed`, `colors`, `introFrames`.

### `electric-arc-flicker`
- **Look:** 10–20 thin jagged lightning arcs radiating from the subject, white core with violet glow, completely re-randomised every 1–2 frames, random brightness flashes.
- **Recipe:** arc = midpoint-displacement polyline between subject edge and random far point (5–6 recursion levels, displacement 0.25·segment length), stroke 1.5 px white + 6 px `#b48cff` at 30 % behind (glow). New seed every `holdFrames`.
- **Props:** `count`, `origin`, `reach`, `holdFrames`, `color`, `glowColor`.

### `refraction-pane-grid` (Mondrian / stained-glass lens)
- **Look:** a black-leaded window grid (thick 10–12 px black bars, irregular Mondrian rectangles) in front of an image; each pane shows the underlying image **with its own translate (±3–6 % W), slight scale (0.95–1.1) and colour tint** (red `#c06b45`, blue `#677489`, yellow `#c0ad70`, clear), so the subject looks fractured; offsets drift slowly over 2 s (ease-in), like moving behind textured glass.
- **Recipe:** define panes as rects; for each pane `<g clipPath=pane><g transform=translate(o_i(t)) scale(s_i)><Subject/></g><rect fill=tint opacity=0.35 style="mix-blend-mode:multiply"/></g>`; `o_i(t) = o_i0 + d_i·easeInQuad(t/T)`; grid lines on top.
- **Props:** `panes[]` or `gridSeed`, `maxOffset`, `tints[]`, `barWidth`, `driftDuration`.

### `curl-flow-swirl`
- **Look:** hundreds of coloured ribbon strokes (magenta, teal, gold, black) inside a circular lens flow around a dark central "pupil" in a turbulent vortex; strokes advect along the flow (not a rigid rotation — confirmed: best rigid-rotation fit = 0°) and their tails redraw continuously; outside the lens, sketchy circular strokes boil.
- **Recipe:** curl-noise velocity field `v = curl(simplex3(x·s, y·s, t·0.2))` plus a tangential vortex term `ω·(−dy, dx)/r`; spawn particles inside the lens, integrate for N steps each frame to draw streamline polylines (length 20–60 px) and advance their seeds along the field over time; clip to lens circle.
- **Props:** `particleCount`, `palette[]`, `vortexStrength`, `noiseScale`, `flowSpeed`, `clipShape`.

### `window-grid-flicker`
- **Look:** a dense grid of repeating units (microwave windows) where individual lit windows (`#e8a040` glow) randomly turn off/on (≈5 % of units toggle per 0.17 s), plus one door swinging open.
- **Recipe:** per unit state `on = hash(i, floor(frame/4)) > p`; lit = orange fill + inner radial glow; off = dark `#3b3e42`.
- **Props:** `rows`, `cols`, `toggleRate`, `onColor`, `offColor`, `stepFrames`.

### `retroreflective-sheen`
- **Look:** reflective stripes on a vest/helmet flash white for 2–3 frames (as if hit by headlights) then settle to silver with a soft moving highlight; head nods slightly (±1 % H at ≈1 Hz); background has diagonal light streaks passing (car lights) left→right.
- **Recipe:** stripes `fill = interpolateColors(flash(t), [silver, white])`, highlight = linearGradient whose offset moves across stripe width; streaks = thin bright lines translating at ≈1.5 W/s.
- **Props:** `flashAt`, `flashFrames`, `stripeColor`, `streakCount`.

### `facet-color-cycle`
- **Look:** a large area (coat) made of hundreds of triangles (low-poly/crystal), each filled from a saturated pastel palette (`#9ee691 #844171 #eabf83 #e6e598 #85b996 …`) with hatched sub-textures; **every frame most facets swap colour** (high energy, like a holographic shimmer), outlines stay.
- **Recipe:** Delaunay triangulation of seeded points inside the coat mask; `fill = palette[hash(i, frame) % n]` (or `palette[(i + floor(frame/k)) % n]` for a smoother cycle).
- **Props:** `pointCount`, `palette[]`, `changeEvery` (1 frame), `mask`.

### `pop-up-bounce` (toast)
- **Look:** object pops vertically out of a container: rises ≈12 % of its height in 3 frames (12 fps steps) then settles back 2–3 % (overshoot), plus heat-shimmer squiggles above.
- **Recipe:** `spring({frame, fps, config:{damping:10, stiffness:180, mass:0.6}})` mapped to `translateY` from 0 to −h·0.12; clip by container slot.
- **Props:** `distance`, `springConfig`, `delay`.

### `mosaic-grid-finale`
- **Look:** hard cut to a seamless 23 × 23 grid of ~47 px square thumbnails (no gutters) filling the frame — the first row starts with the shots seen in the reel (bowling ball, bubbles, rooster, vending machine, X-ray, sunglasses…), the rest are hundreds of other works; near-static for 1.8 s (tiles shimmer subtly on alternating frames).
- **Recipe:** `cols = rows = ceil(1080/47)`; `<Img>` tiles from a list; optional twinkle = per-tile brightness `1 + 0.03·sin(frame·0.5 + i)`. (A variant: zoom out from the last shot into its tile — not used here.)
- **Props:** `images[]`, `tileSize`, `gap` (0), `twinkle`, `highlightFirstN`.

## Transitions

- **Only hard cuts.** Every shot change is a single-frame cut on the 26/27-frame beat grid (frames 26, 53, 79, 105, 131, 157, 183, 210, 236, 253, 288, 314, 340, 366, 393, 445, 497, 524, 549, 576, 602, 628, 654, 694). Shots 10/11 split one 52-frame slot unevenly (17 + 35).
- Every shot starts already in motion (no ease-in) and is cut mid-loop — reinforcing the "flip-through" energy.
- Finale: hard cut to the mosaic (no zoom).

## Camera

- No camera moves at all — every shot is a locked square frame. All motion is internal to the illustration (micro-loops). Perspective/depth is only drawn (worm's-eye microwaves, one-point truck road).

## Library candidates

- `beat-hardcut-montage` — beat-synced gallery / portfolio / "N things" rapid reels.
- `xray-scan-sweep` — scanning, security, inspection, "look inside" reveals.
- `iridescent-bubble-cluster` — playful/clean/soap/beauty themes, background texture.
- `strand-ruffle` — fur, feathers, grass, hair moving in wind.
- `insect-zigzag-flight` — ambient life in landscapes (dragonflies, bees, fireflies).
- `sphere-texture-roll` — rolling balls, planets, globes rotating in place.
- `echo-ghost-wobble` — retro/Memphis misprint echo emphasis on a product.
- `wiper-sweep-clear` — "clearing the view" reveal, before/after wipes.
- `eye-look-blink` — bring any character portrait to life.
- `glitch-band-displace` — glitch transitions, digital disruption, tech themes.
- `datamosh-column-smear` — localized corruption/teleport/speed effects.
- `line-boil` — hand-drawn/engraved living-line feel for any vector art.
- `zipper-slide-glint` — product details, opening/closing metaphors.
- `snowfall-drift` — snow/dust/ash ambient particles with depth layers.
- `metaball-heatmap-blob` — data heat maps, liquid spills, thermal imagery, organic growth.
- `caustic-water-texture` — pools, underwater light, summer vibes.
- `electric-arc-flicker` — energy, power, excitement, sci-fi surges.
- `refraction-pane-grid` — art-deco/Mondrian glass reveals, fractured perspectives.
- `curl-flow-swirl` — vortex, hypnotic, "deep dive" or brain/idea visuals.
- `window-grid-flicker` — buildings at night, server racks, grid status displays.
- `retroreflective-sheen` — safety/industrial gear, shiny highlights on stripes.
- `facet-color-cycle` — holographic/iridescent low-poly shimmer.
- `pop-up-bounce` — any element popping out of a slot (toast, cards, notifications).
- `mosaic-grid-finale` — "and many more" endings, portfolio walls, community collages.
