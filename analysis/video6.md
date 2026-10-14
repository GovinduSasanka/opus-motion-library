# video6 — "The Life of a Honeybee" (scientific-illustration explainer, opus 5.5)

## Overview

| | |
|---|---|
| Resolution / fps | **1080×1080 (square)**, 24 fps, 53.38 s (1280 frames). Has an audio track (ignored). |
| Theme / story | The complete life cycle of a worker honeybee as a continuous visual essay with no narration text. In order: x-ray into the comb, the sacred geometry of the hexagonal cell, the egg (cell division, then segmentation stripes), the larva fed by nurse bees, the capped cell, metamorphosis, emergence, comb building, leaving the hive, bee vision (compound eye mosaic, then UV), the foraging flight map, pollinating an apple branch (flowers become fruit), the waggle dance mapped onto the meadow, nectar handover, fanning, capping honey, days passing (tally marks), and the window to the outside. It ends by collapsing back to the geometry and the signature "opus 5.5". The first shot is repeated at 13.9–14.6 s, so the life cycle visually loops. |
| Art style | **Vintage scientific / naturalist illustration** with **fine engraving cross-hatch textures** on flat colour shapes, a warm paper feel, and a subtle grain on everything. It alternates with **"blueprint" diagram interludes**: a near-black warm background, thin lavender construction lines, cream outlines and glowing nodes. The two styles are cut together with match-cuts and graphic transitions. |
| Palette | **Diagram world:** bg `#180F0B`, construction lines `#7589CB` (bright `#C9D1F5`), cream outlines/dots `#DCE5CA` / `#E9E0D5`, gold nuclei `#E7B96B` (highlight `#F6C886`), magenta morphogen wash `#972C65`, segment-stripe green `#4CAD6D` (glow `#A6FFC7`). **Hive:** comb wall wax `#E9D38B`, cell interior `#AE8142` / `#9D642F` / `#7E4E23`, honey `#E8B04A`, wax cap cream `#F2EAD8`, royal jelly `#F6F1E4`. Pollen cell colours: red `#C8473A`, orange `#E07B2E`, yellow `#D9C23A`, olive `#7E9A3E`, cream `#F1E7C8`. **Outdoors:** sky `#ABCAD7` → horizon `#C4CEAE`, ground `#BBCC99`, meadow map `#C0D288`, river `#92BCCE`, apple blossom white `#FBF3F0` with pink edge `#E6A6B8`, leaf `#7DBB6A`. **Diagram red** (waggle and map vectors) `#CA4146` / `#C83230`. Night sky `#272556`, night bark `#433E56`, day bark `#816F5C`. Bee: amber `#C88838`, dark bands `#3A2414`, fuzz `#B98E52`, eyes `#2A2421`. |
| Fonts | Only the end signature: "opus 5.5", lower-case, a **thin monoline rounded sans** (Quicksand Light / Comfortaa Light feel), cream `#E9E0D5`, ≈ 40 px glyph height (3.7 % H), right-aligned with its right edge at x≈995 (8 % margin) and baseline y≈1015 (6 % bottom margin). |
| Layout | Square frame. Subjects are mostly centred. Diagram geometry is centred at (540,557) with radius ≈ 237 px (22 % H). Insets and callouts sit in the upper-left quadrant (callout circle ≈ 0.27 W diameter, centred at ≈ (0.15 W, 0.2 H)). A small secondary diagram (binary tree) sits in the top-right corner (≈ 0.12 W wide, 4 % margin). |

## Timeline

| # | t (s) | On screen | Motion | Out |
|---|---|---|---|---|
| 1 | 0.00–1.40 | Top-down bee on a comb of colourful pollen cells | Idle: leg/antenna micro-motion, slight breathing | `xray-hatch-hole` |
| 2 | 1.42–1.96 | Bee turns into a wireframe; a dark x-ray hole with a hatched edge expands to the full frame, showing a wireframe comb | Fast zoom-out ×6 (1.67→1.96); the wireframe dissolves to a point | Glow point stays |
| 3 | 2.00–3.15 | Dark diagram: compass draws circle → 6 petals → hexagon → 3D prism with gold dust | `compass-geometry-construct`, `hex-prism-extrude` | Cut |
| 4 | 3.15–4.60 | Bullet-shaped egg outline with an inner hex texture. Gold nuclei double 2→256. Binary tree grows top-right. | `cell-division-doubling`, `binary-tree-grow` | Continuous zoom-out |
| 5 | 4.60–5.60 | The egg shrinks to a tilted ellipse made of thousands of cream dots resting on a slanted surface line; slight 3D rotation | Dot cloud reshapes | → |
| 6 | 5.60–7.25 | Magenta gradient floods from the anterior end; green segment stripes appear 1→7→14; a ruler axis draws beside it | `morphogen-wash`, `segment-stripes` | Egg fills white, then a match-cut |
| 7 | 7.33–9.25 | Illustrated comb cell: a small C-shaped larva in jelly. A nurse bee drops jelly; the larva grows ×2.5. | `grow-in-place` with droplet feeding | → |
| 8 | 9.25–9.92 | A wax cap closes over the cell as a spiral | `spiral-cap-close` | Cut |
| 9 | 10.00–12.00 | Cut-away cell "frame" with dim ghost stages left and right. Larva → straightens → pupa; eye colour white→pink→purple→brown; body cream→grey | `metamorphosis-morph` | Cut |
| 10 | 12.00–13.10 | Capped comb seen from above. The bee chews round the cap (a dark line traces the circle); the lid hinges open; its head pops out. | `lid-cut-hinge-open` | Cut |
| 11 | 13.17–14.60 | The bee climbs out; the camera pulls back; the grey bee colourises (head → thorax → abdomen stripes). Ends **identical to frame 0** (loop). | `greyscale-to-colour-mature` | Cut |
| 12 | 14.67–16.60 | Dark diagram: the bee builds comb. White wax hex edges grow with round node caps; lavender compass circles preview the next cell. 16.0: the bee caps a larva cell. | `hex-comb-build-strokes` | Cut |
| 13 | 16.67–17.25 | The bee from above in a dark tunnel; a bright arch at the top | Slow push | Cut |
| 14 | 17.33–17.95 | A wobbly bright hole (the hive entrance) with radiating straw-like light rays expands until the frame is white; the bee walks out | `light-hole-expand` | White frame (a match through white) |
| 15 | 18.00–18.50 | Hex-pixel mosaic (compound-eye view) of a sunflower; colour spreads outward from the centre | `compound-eye-mosaic` | `diagonal-palette-wipe` |
| 16 | 18.50–19.30 | The same flower in UV false colour (violet/periwinkle) | Diagonal wipe 18.50→18.83 | Cut |
| 17 | 19.33–21.30 | Top-down meadow map: tree, flower patches, river. The bee flies a curved route; a dashed line goes to the sun; a red vector goes back to the hive. | `map-flight-path`, map pans | Cut |
| 18 | 21.33–39.30 | Apple branch against the sky. The bee visits flowers; pollinated flowers drop petals and swell into apples. Callout inset (24.0–31.0) shows a flower cross-section with a growing pollen tube. The camera slowly zooms out ×2.4 over 13 s. Petals drift. | `flower-to-fruit`, `callout-inset-lens`, `petal-fall-particles`, `slow-dolly-out` | Cut |
| 19 | 39.33–41.60 | Dark comb at night. Waggle-dance diagram: a red vertical "sun" axis, an angled waggle run with a white sine trail, distance ticks, a return loop | `waggle-dance-diagram` | **Match-cut** of the diagram |
| 20 | 41.67–43.30 | Meadow map. The same red diagram (sun axis, angle arc, tick ruler) now points to a flower patch; a red target circle draws round it | `vector-match-cut` | Cut |
| 21 | 43.33–44.00 | Two bees face to face passing a nectar drop (trophallaxis) | Drop pulse | Cut |
| 22 | 44.00–44.60 | Perspective comb floor; bees fanning with heat-wiggle lines | `heat-wiggle-lines` | Cut |
| 23 | 44.67–45.90 | The bee deposits honey; the cell fills, then is capped with wax (a ring closes, then turns white) | `spiral-cap-close` variant | Cut |
| 24 | 45.98–47.95 | Hollow tree with a hive hole and the sky on the right. Hard flips between **day and night every 0.33 s (8 f)**; the sun/moon arcs; tally marks pile up top-right; seasons dry out the meadow | `day-night-flip-tally` | Cut |
| 25 | 48.00–50.90 | A deep perspective comb hall with a wavy window at the top showing the sun. Close-up of the bee looking up: a dome/droplet reflects an upside-down landscape (48.6–50.3). Back to the wide shot; the bee walks away and gets smaller. | `perspective-hex-floor` | `window-blob-collapse` |
| 26 | 50.97–51.30 | The window shape (hatched edge) floats to the centre and shrinks ×20 to a tiny glowing bee point | | → |
| 27 | 51.30–52.90 | Diagram: the compass draws a circle around two glowing nodes, then petals, hexagon and vesica ellipses (a reprise of #3). Text "opus 5.5" types bottom-right (52.30–52.88). | `compass-geometry-construct`, `typewriter-signature` | `geometry-implode` |
| 28 | 52.95–53.38 | Geometry spins and shrinks into the centre while its lines un-draw; the text breaks into noise | | Black |

## Motion techniques

### `xray-hatch-hole`
**Look:** an illustrated subject turns into a cream wireframe (contour lines plus a lattice) for 2–3 frames. Then a near-black hole with a **rough, hand-hatched ink edge** opens around it, revealing the "x-ray" layer (a dark background with a wireframe version of the scene).

**Timing:**
- Wireframe overlay on the bee 1.42→1.46 (2 f).
- Hole radius 0 → 0.4 W at 1.50 → 0.75 W at 1.54 → full frame (> 0.71 W·√2) at 1.58. That is **≈ 4 f, easeInQuad**.

**Edge:** a ring 30–50 px wide of short dark strokes (length 20–40 px, random angles ±25° around the radial direction, density ~ 1 stroke per 4 px of circumference), multiplied over the incoming layer.

**Remotion:** mask the dark layer with a circle whose outline is perturbed by `noise1D(angle*6)*0.04R`. Render the hatch ring as N seeded `<line>`s placed at `R + rand(-15,15)` px. Re-seed every 2 frames for boil.

**Props:** `center`, `durationFrames=4`, `edgeWidth`, `hatchColor`, `strokeDensity`, `revealLayer`.

### `compass-geometry-construct`
**Look:** a geometry-construction animation, like a compass drawing:
1. A radius line from the centre to 12 o'clock appears.
2. The circle's arc sweeps clockwise.
3. Six petal arcs (the Seed of Life: arcs of radius R centred on the six circle points) grow.
4. Hexagon edges are ruled vertex to vertex, clockwise from the top.
5. Vertex nodes appear as small 4-point glints.

**Measured (24 fps):**

| Phase | Time | Notes |
|---|---|---|
| Circle | 2.00→2.17 (**4 f**) | Near-linear sweep: ≈ 60° at f0, 150° at f1, 240° at f2, 320° at f3, 360° at f4 |
| Petals | 2.17→2.33 (**4 f**) | All 6 drawn from the centre outward with a 0–1 f stagger |
| Hexagon | 2.33→2.62 | One edge every ≈ 1.5 f (0.06 s); the leading tip is a bright dot `#FFFFFF` |
| Strengthen | 2.62→2.70 | The hexagon strokes thicken from 2 to 3 px |

Line styles: construction lines 1.5 px `#7589CB` at 90 %; hexagon edges 2.5 px `#C9D1F5`; vertex dots r=3 px, white with a 6 px glow. Centre node: a gold star glint `#F6C886`. Geometry radius ≈ 237 px (22 % of the frame).

The reprise at the end (51.4–52.3) adds two vertical vesica ellipses (`rx = 0.25R`, `ry = 0.95R`) and two glowing gold nodes at (0, ±0.08R).

**Remotion:** every element is a path with `pathLength=1`, `strokeDasharray=1` and `strokeDashoffset = 1 - progress_i`. Schedule them with `progress_i = clamp((f - start_i)/dur_i)`. Petal arcs: `M center A R R 0 0 1 pointOnCircle(θ_i)`, etc. Draw a small `<circle>` at the current tip (`getPointAtLength`) while it is drawing.

**Props:** `radius`, `center`, `steps` (circle / petals / hexagon / vesica), `stepFrames`, `colors`, `glintNodes`.

### `hex-prism-extrude`
**Look:** the flat hexagon tilts into perspective (top face squashes to about 0.45 vertical scale over 6 f) while 6 vertical edges grow downward (to ≈ 0.9R), forming a 3D cell. Gold dust particles (≈ 200 dots, 1–2 px, `#E7B96B`) settle at the bottom. Then a gold-hatched fill fades in (2.95→3.10): vertical strokes, 1 px, `#E7B96B` at 60 %, like wax.

**Remotion:** compute 3D hexagon vertices `(R cosθ, 0, R sinθ)` and the bottom copy at `y = h`. Project with a pitch angle interpolated 90°→25°. Draw the edges as lines and the back edges at 40 % opacity.

**Props:** `radius`, `depth`, `pitchFrom/To`, `fillHatch`, `particleCount`.

### `cell-division-doubling`
**Look:** inside a container outline (egg: a bullet/teardrop shape with a cream 3 px stroke and a faint hex texture inside), glossy gold spheres ("nuclei") double over and over. Each sphere buds into two overlapping spheres, then they slide apart along a random axis, joined by thin lavender "spindle" lines.

**Timing:** a doubling every **4 frames (0.167 s)**: 2 f bud (overlap 60 % → 20 %), then 2 f separate. Counts: 3.32: 2, 3.48: 4, 3.65: 8, 3.82: 16, 3.98: 32, 4.15: 64, 4.32: 128, 4.48: 256. Sphere radius halves about every 2 doublings: 40 px → 4 px. At 256 they turn into flat cream dots.

**Positions:** relax them inside the container with a few iterations of a seeded Poisson/Lloyd step per frame, so they spread evenly.

**Spheres:** radial gradient `#F6C886` → `#E7B96B` → `#B8863F`, a white specular dot, and a 1 px dark rim.

**Remotion:** precompute the generations: the children of node *k* are `pos_k ± dir_k*d_g`, then relax. Render generation `g = floor((f-start)/4)` and tween within the generation using `split = clamp(((f-start)%4)/4)`.

**Props:** `generations=8`, `framesPerDoubling=4`, `container` (SVG path), `colors`.

### `binary-tree-grow`
A small diagram in the top-right corner (≈ 130×60 px). It is a dendrogram that adds one level per doubling, in sync with `cell-division-doubling`: lines 1 px `#7589CB`, a root node circle r=3. At the deepest levels the leaves merge into a solid bar of horizontal lines (a blue `#4A5A9A` stacked band). It fades out at 5.85. **Props:** `levels`, `syncFrames`, `position`.

### `morphogen-wash` + `segment-stripes`
**Look:**
- **Morphogen wash:** a magenta gradient spreads from the anterior (top) tip of the egg down about 60 % of its length (5.67→5.92, 6 f). Its colour is a radial-gradient tint `#972C65` → transparent, applied only to the egg's dot texture: it colours the dots and does not fill the shape.
- **Segment stripes:** bright green translucent bands perpendicular to the long axis. Their counts:

| t | 6.00 | 6.17 | 6.33 | 6.5 | 6.67 | 6.83 | 7.0 | 7.17 |
|---|---|---|---|---|---|---|---|---|
| bands | 1 | 2 | 3 | 4 | 5–6 | 7 | 7 (sharpening) | 14 (each band splits in two) |

  The bands appear top to bottom. Each band fades in over 2 f and slightly widens. They are drawn in `#4CAD6D` with a `#A6FFC7` glowing edge, built from dense dots with `screen` blend. The magenta fades out as the stripes complete.
- **Ruler:** a long thin axis line parallel to the egg, with perpendicular tick crosses every ≈ 50 px, drawn on over 1 s.
- **Exit:** at 7.25 the egg fills solid cream/white (larva body) in 1 f, then a cut.

**Remotion:** clip to the egg path. Stripes are `<rect>`s in the egg's local rotated frame, at positions `y_i = top + (i+0.5)*L/n`, with opacity ramps scheduled by index. The wash is a `<linearGradient>` along the egg axis whose stop offset animates 0→0.6.

**Props:** `stripeCount`, `stagger`, `splitAt`, `colors`, `axisAngle`.

### `grow-in-place` (feeding)
The subject (C-shaped larva) scales from 1.0 to 2.5 over **2 s (7.4→9.2)**, easeOutQuad, staying anchored at the cell centre. The jelly pool grows with it. A nurse bee enters from the upper-left and later the right (sliding 150 px over 0.5 s). It drops white droplets (circles of r 10–14 px) that scale in over 4 f and then merge into the pool. The camera zooms in slightly at the same time (≈ 1.1×). **Props:** `scaleFrom/To`, `duration`, `feedEvents[]`.

### `spiral-cap-close`
**Look:** a wax cap closes over a round opening like a spiral iris. Concentric wax rings appear from the outside inward, and the remaining hole shrinks: radius 1.0 → 0.6 (9.33) → 0.35 (9.5) → 0.15 (9.67) → 0 (9.83), **≈ 12 f, easeInQuad**. The final cap shows an engraved Archimedean spiral line. The honey-cell variant (45.4–45.9): the honey is covered by a cream ring, then the whole cell turns flat white-cream `#F2EAD8` with a fine grain.

**Remotion:** the cap is a `<circle>` filled with the wax texture and masked by an annulus with an inner radius r(t). Add a spiral path `r = a + bθ` with its `strokeDashoffset` animated in sync.

**Props:** `radius`, `frames`, `waxColor`, `spiralTurns=4`.

### `metamorphosis-morph`
**Look:** inside a vertical cut-away frame (a rounded-rect wooden cell wall, `#8A5A2B`, 12 px), the occupant morphs through stages: curled larva → upright larva → pupa with limbs → adult shape. Two dim ghost silhouettes of neighbouring stages (25 % opacity) sit left and right, cropped by the frame edges.

**Changes:**
- Shape changes by cross-dissolve: 4–6 f per stage, with slight scale overshoot.
- Eye colour shifts in steps: white → `#E8879F` pink (10.67) → `#7A2E9C` purple (11.0) → `#5A3022` brown (11.33).
- Body tint: cream `#F3EEE2` → grey `#B5B1AB` (11.2–11.7).
- Thin horizontal "time" streak lines pass behind the subject (motion lines).

**Remotion:** one SVG per stage. Cross-fade with `opacity` and `scale` springs. Tint layers via `feColorMatrix` or a `fill` interpolation.

**Props:** `stages[]`, `framesPerStage`, `eyeColors[]`, `ghosts`.

### `lid-cut-hinge-open`
**Look:** a dark line traces around a circular cap clockwise, drawn like a cut (12.17→12.6, ≈ 10 f, starting at 9 o'clock with a leading bite mark). Then the lid rotates open on a hinge on its left edge (`rotateY` 0→80°, so it becomes a thin ellipse/edge, 12.6→12.85, 6 f, easeIn). This reveals a black hole, and the bee's head pops up from below (scale 0.8→1, 4 f).

**Remotion:** the cut line is a dash-offset circle. The lid is an SVG group with `scaleX = cos(angle)` around the hinge x, plus a darkened edge highlight.

**Props:** `cutFrames`, `hingeSide`, `openFrames`.

### `greyscale-to-colour-mature`
The newly emerged bee starts desaturated (light grey `#B9B6B2`, grey fuzz) and gains full colour in body-part order: head and thorax fuzz at 13.58 (2 f fade), then abdomen amber at 13.67, then the dark bands at 13.75–13.83. Meanwhile the background comb transitions to the colourful pollen-cell comb from the opening. Implement it as per-part `saturate` filter ramps with a 2 f stagger. **Props:** `partsOrder[]`, `staggerFrames`, `rampFrames`.

### `hex-comb-build-strokes`
**Look:** on the dark background, thick cream "wax" strokes (12 px, round caps, `#F2EAD8`, with a subtle inner shade) extend hexagon edges one segment at a time from the bee's mandibles. Each growing tip carries a **round node ball** (r = 9 px). A new edge branches at 120° from the last vertex. Ahead of the build, thin lavender compass circles (1 px `#7589CB`, r = edge length) with small cross-hair ticks preview the next cell. Faint pre-existing comb outlines in dark gold `#5A4026` show where the comb will go.

**Timing:** ≈ 0.17 s (4 f) per edge, easeOutQuad. The bee's head bobs 6 px per edge.

**Remotion:** a hex lattice graph; animate edges in a BFS order from the seed vertex. Each edge path uses `dashoffset`; the node ball is placed at the tip.

**Props:** `edgeLength`, `order`, `framesPerEdge`, `strokeColor`, `showCompassPreview`.

### `light-hole-expand`
**Look:** a cut to darkness with an irregular glowing opening: a blob outlined by a 6 px gold rim `#C99A55` and a dark brown outer rim, with a cream fill `#F4EFE6`. Radial "straw" rays (≈ 80 thin lines, 1–2 px, gold-grey `#A88F67`, lengths 0.15–0.35 W) fan downward from its lower edge. Faint concentric wood-grain lines in the dark background suggest a tunnel. The blob grows and swallows the frame: radius 0.1 W (17.33) → 0.13 (17.5) → 0.2 (17.67) → 0.5 (17.75) → full (17.83). That is **12 f, easeInExpo**. Its outline wobbles: Perlin noise on the radius, ±6 %, 0.5 Hz. The bee walks through and ends on pure white.

**Props:** `center`, `frames`, `rimColor`, `rayCount`, `wobble`.

### `compound-eye-mosaic`
**Look:** the image is shown through a hexagonal pixel grid (a "hexel" mosaic). Cell flat-to-flat ≈ 18 px (60 cells across), each hexel filled with the flat colour sampled at its centre. Hexels are separated by a 1.5 px darker gap (−15 % luminance), which gives an insect-eye texture. The frame has a soft rounded-octagon dark vignette (the corners cut by ~0.12 W).

**Reveal:** colour spreads radially from the centre (18.0 → 18.17, 4 f, r 0.1 → 1.0). Unrevealed hexels are cream `#F1EDE4` with grey gaps.

**Remotion:** generate the hex centres; for each, `fill = sample(imageColorFn, cx, cy)`. Precompute from a source image with a canvas `getImageData`, or draw the subject as flat SVG and map colours analytically. `reveal_i = clamp((t - d_i/v)/2f)`.

**Props:** `hexSize`, `gap`, `revealSpeed`, `source`, `vignette`.

### `diagonal-palette-wipe`
A straight wipe boundary at **45° (top-left → bottom-right travel)** sweeps over the frame in **8 f (18.50→18.83)**, linear. It swaps between two colourings of the same image (natural → UV false colour: greens become `#5A5A8A` periwinkle, yellow petals `#C9A8F0`, the centre `#3B1B6E`). The boundary is drawn as a 1.5 px white dashed line with a slight glow.

**Remotion:** two layers; the top one has `clipPath` polygon `[(-W+p*2W,0),(p*2W,0),(p*2W-W..)…]`, i.e. a half-plane `x + y < k(t)`.

**Props:** `angle=45`, `frames=8`, `edgeStyle`.

### `map-flight-path`
**Look:** a top-down paper map (meadow green `#C0D288` with tiny flower speckles, grain). It contains a big tree canopy (scalloped dark green with a hatched shadow), flower patches (clusters of 20–40 small blossoms), and a blue river (a 14 px curvy stroke `#92BCCE`). The bee (top-down, wings blurred) follows a smooth Catmull-Rom path through the patches. It leaves a thin black trail (1.5 px, drawn on behind it), with a dashed orange line from the bee to the sun icon at the top edge (`#E8A93A`, dash 4/6). A red vector line `#C83230` from the hive draws on as the outbound bearing. The camera pans to keep the bee in the central third, ≈ 120 px/s.

**Props:** `path[]`, `speed`, `sunPos`, `trailColor`, `showBearing`.

### `callout-inset-lens`
**Look:** a magnifier inset circle (cream `#F1EDE2`, diameter ≈ 0.27 W, centred in the upper-left), joined to its target by two thin tangent leader lines (1 px, grey-blue, 50 % opacity).

**In:** the circle reveals by a **clockwise pie/radial wipe from 12 o'clock** over 6 f (24.03→24.28). Then the diagram inside (a flower cross-section in pale green with a pistil and stamens) fades and scales in from 0.9 over 4 f (24.37→24.53). Inside it, a pollen tube line grows down the style over ~5 s.

**Out:** the inner diagram fades over 4 f (30.37→30.53). The blank disc then **shrinks and flies to the target flower** (30.6→30.95, 9 f, easeInCubic), landing exactly where the flower turns into a small green fruit.

**Remotion:** the pie wipe is a `<path>` arc mask (`d = describeArc(0, p*360)`). Leader lines are tangents from the circle to the target point, recomputed per frame as the camera zooms.

**Props:** `target`, `position`, `radius`, `content`, `inFrames=6`, `outFrames=9`.

### `flower-to-fruit`
On pollination, a flower's 5 petals detach one by one (stagger 3 f). Each petal falls with sway (see `petal-fall-particles`) while the centre swells from a green ovary (r 10 → 30 px over 1.5 s) into an apple: green `#9CC25A` → blushed orange-red `#D9733F`, with fine hatching and a highlight. Repeat for each flower the bee visits, every ≈ 1.5–2 s. **Props:** `flowers[]`, `swellFrames`, `colors`.

### `petal-fall-particles`
Pink and white petals (ellipses 8×14 px, `#F4C9D6` / `#FFFFFF`) drift down at 40–80 px/s. Each sways sideways in a sine (amplitude 20 px, 1.2 s period) and rotates at 90–180°/s, flipping in 3D (`scaleX = cos(φ)`). There are about 15 on screen during the branch scene. Seeded spawn across the top and from the visited flowers. **Props:** `count`, `colors`, `speed`, `sway`.

### `slow-dolly-out`
The branch scene zooms out continuously from 1.0 to ≈ 0.41 between 21.3 and 34 s (ease-out: flower diameter 440 → 300 (26 s) → 220 (30 s) → 180 px (34 s)), then holds. Combined with a slight upward and leftward pan, it reveals the whole branch. Background layers (clouds, the distant tree line on the horizon) move about 40 % slower (2-layer parallax). **Props:** `scaleKeys`, `parallaxFactor`.

### `waggle-dance-diagram`
**Look:** an annotated dance on a dark comb:
- A vertical red axis (1.5 px `#CA4146`) runs from a hive glyph at the bottom (a seed-shaped marker) to a sun icon at the top (a circle with 8 rays).
- The bee runs straight along an angled line at θ ≈ 40° right of vertical, leaving a **white sine-wave trail** (amplitude 10 px, wavelength 22 px).
- A red ruler parallel to the run has perpendicular ticks every 35 px, drawn on as it runs.
- A small red angle arc sits between the axis and the run.
- After the run, the bee loops back along a dotted ellipse (the return path) and repeats on the other side (a figure-8).
- Background bees are blurred and dimmed (50 %).

**Timing:** a run of ≈ 1 s (39.6→40.6), the return 0.6 s, then the run again.

**Props:** `angle`, `runLength`, `waveAmp`, `tickSpacing`, `colors`.

### `vector-match-cut`
The same red vector diagram (axis to the sun, angle arc, distance ruler) keeps its screen position across a cut from the dance (abstract) to the map (literal). On the map the vector points to the real flower patch. Then a red target circle is drawn around the destination (43.0→43.2, clockwise, 5 f) with a small crosshair. This explains how a symbolic gesture maps to the world. **Props:** `vector` (angle, length), `target`, `fromScene`, `toScene`.

### `heat-wiggle-lines`
Wavy white lines (1.5 px, 60 % opacity, about 12 strands, each 40–80 px tall) rise from the bees' wings. Each is a sine path whose phase scrolls upward at 1.5 cycles/s; opacity fades at the top. It suggests airflow or evaporation. **Props:** `count`, `amplitude`, `speed`.

### `day-night-flip-tally`
**Look:** the same composition (a hollow tree with the hive hole on the left, the sky and meadow on the right) alternates by **hard cut every 8 f (0.33 s)** between day (sky `#B8D0DA`, bark `#816F5C`, sun disc `#F2B53A`) and night (sky `#272556` with star specks, bark `#433E56`, a white moon crescent). In each phase the sun or moon moves along a dotted arc from left to right. Tally marks (hand-drawn, 1.5 px, `#7A8AC8`, in groups of five with a diagonal strike) build up in the upper-right: 2–3 marks are added per flip, each popping in over 1 f. The meadow changes with the seasons (flowers → dry grass). The bee is present in some day phases.

**Remotion:** `isNight = floor((f-start)/8) % 2`. Swap palettes and draw `tally(n)` with `n = floor(f/3)`.

**Props:** `flipFrames=8`, `palettes`, `tallyRate`, `seasonRamp`.

### `perspective-hex-floor`
A one-point perspective "hall" of honeycomb. Rows of hexagonal cells recede to a horizon at about 30 % H. Cells near the camera show capped honey (amber domes `#E8B04A` with highlights) and white wax caps. A wooden ceiling band sits above, with a wavy cut-out window showing the outside landscape (sun, silhouetted plants). The bee stands in the foreground looking towards it. **Remotion:** generate a hex grid in world XZ and project `y_screen = horizon + f*h/z`; sort far to near. **Props:** `rows`, `horizon`, `cellColors`, `windowContent`.

### `window-blob-collapse`
**Look:** at the end of a scene, a meaningful shape (the window) detaches. Its outline gets a heavy **scribble-hatch border** (like `xray-hatch-hole`), the rest of the frame cuts to the dark background, and the blob shrinks to the centre: scale 1 → 0.55 (51.05) → 0.25 (51.13) → 0.05 (51.22) → a point (51.3). That is **≈ 8 f, easeInCubic**. Its content simplifies to a sun "egg yolk". It ends as a tiny glowing bee/node, which becomes the seed point of the geometry reprise. **Props:** `shape`, `frames`, `hatch`, `endPoint`.

### `typewriter-signature`
Text in the bottom-right corner, typed 1 character per **2 frames (0.083 s)**. There is a small hold after the word "opus" (4 f), no cursor, and each character appears at 100 % opacity instantly. "opus 5.5" takes 52.30→52.88. **Exit (52.97–53.2):** the glyphs jitter into scrambled shapes: each glyph is replaced by random similar glyphs for 1–2 f ("opus" → "cpus" → "crus"), losing pixels (a dissolve mask of random 2×2 px blocks), and are gone within 6 f. **Props:** `text`, `framesPerChar=2`, `position`, `font`, `scrambleOut`.

### `geometry-implode`
The construction geometry collapses: the whole group rotates −60° and scales 1 → 0.1 over **6 f (52.95→53.2), easeInCubic**. At the same time the strokes un-draw: dashoffset back to 1, random per path. It finishes at a single point that fades out. The mirror of `compass-geometry-construct`; use it as an outro. **Props:** `frames`, `rotate`, `undraw`.

## Transitions

| t (s) | From → to | Type |
|---|---|---|
| 1.50 | Comb → x-ray world | `xray-hatch-hole` (4 f iris with a hatched edge) |
| 1.67–2.0 | x-ray → geometry | Fast zoom-out (×6 in 7 f, easeInCubic) into a glow point that becomes the compass centre |
| 3.15 | Prism → egg | Hard cut (geometry style continues) |
| 4.6 | Egg detail → whole egg | Continuous zoom-out (≈ ×4 in 0.5 s) |
| 7.25/7.33 | Diagram egg → illustrated larva | Fill-white flash (1 f), then a cut. A shape match-cut: the white egg becomes the white larva. |
| 9.9 / 12.0 / 13.17 / 14.67 / 16.0 / 16.67 / 17.33 | | Hard cuts |
| 17.83–18.0 | Hive exit → bee vision | Light hole grows to pure white, then the mosaic reveals from the centre (a match through white) |
| 18.5 | Visible → UV | `diagonal-palette-wipe` 8 f |
| 19.33 / 21.33 / 39.33 | | Hard cuts |
| 41.67 | Dance → map | `vector-match-cut` (the diagram persists) |
| 43.33 / 44.0 / 44.67 / 46.0 | | Hard cuts |
| 46.0–48.0 | Day ↔ night | Rhythmic hard cuts every 8 f |
| 48.67 / 50.33 | Wide ↔ close-up | Hard cuts |
| 50.97 | Hall → dark | `window-blob-collapse` |
| 52.95 | Outro | `geometry-implode` + text scramble |
| 13.9–14.6 ≡ 0.0–0.6 | — | The story's loop point (frame-identical composition) |

Pacing: cuts every 0.7–2 s in the first half (dense "chapters"). The long 18 s branch scene is the breather. The second half quickens again (0.6–2 s), with 8 f day/night flips as the climax of "time passing".

## Camera

- **Mostly locked top-down compositions** with gentle push-ins or pull-backs of about 5–10 % per shot (e.g. larva feeding ≈ 1.1×, emergence pull-back ≈ 0.85×).
- **Big zoom moves:**
  - 1.67–1.96: zoom-out ×6, easeIn.
  - 4.5–4.7: zoom-out ×4.
  - 21.3–34: dolly-out ×2.4 (easeOut) with 2-layer parallax (sky/horizon at 0.4×).
- **Map pan** 19.3–21.3 at ≈ 120 px/s, following the bee.
- 3D perspective is only simulated: the prism tilt (2.7–2.95) and the perspective comb hall (44, 48–50.9) use a single vanishing point.
- No camera shake. All moves are smooth eases.

## Library candidates

- `xray-hatch-hole`: reveal a hidden "inner workings" layer through a hand-inked hole.
- `compass-geometry-construct`: elegant draw-on of construction geometry for logos, intros and "the math behind it".
- `hex-prism-extrude`: turns a 2D shape into a 3D cell or container; product or concept "build-up".
- `cell-division-doubling`: exponential growth and scaling visualisation (users, data, cells).
- `binary-tree-grow`: a small synced diagram counter showing generations or levels.
- `morphogen-wash`: a gradient "signal" spreading through an object; heat-map onset.
- `segment-stripes`: progressive banding or segmentation of an object; progress or structure reveal.
- `grow-in-place`: growth over time of a subject in a fixed container, with feeding events.
- `spiral-cap-close`: a seal / lock / complete closing iris.
- `metamorphosis-morph`: staged transformation of one subject with ghost context stages.
- `lid-cut-hinge-open`: an unboxing / breakthrough / emergence moment.
- `greyscale-to-colour-mature`: maturity or activation by colourising parts in sequence.
- `hex-comb-build-strokes`: constructive line-building of a lattice with node caps (networks, structures).
- `light-hole-expand`: a "stepping into the light" scene exit to white.
- `compound-eye-mosaic`: hex-pixel stylisation, a "how X sees" point-of-view filter.
- `diagonal-palette-wipe`: before/after or alternate-spectrum comparison of the same image.
- `map-flight-path`: route or journey visualisation on an illustrated top-down map.
- `callout-inset-lens`: zoomed explanatory inset with leader lines that returns to its target.
- `flower-to-fruit`: cause → result transformation of items after an interaction.
- `petal-fall-particles`: ambient drifting particles (petals, leaves, confetti, snow).
- `slow-dolly-out`: a slow reveal of context with parallax.
- `waggle-dance-diagram`: annotated motion diagram (angle, distance, path) over live footage.
- `vector-match-cut`: carries an abstract annotation across a cut onto the real-world target.
- `heat-wiggle-lines`: airflow, heat, smell or energy indication.
- `day-night-flip-tally`: rhythmic time-lapse with a running counter.
- `perspective-hex-floor`: an immersive one-point-perspective tiled environment.
- `window-blob-collapse`: collapses a scene into a point to hand off to the next section or outro.
- `typewriter-signature`: a minimal corner signature with a glitch-out.
- `geometry-implode`: a spinning collapse with un-draw outro for diagram scenes.
