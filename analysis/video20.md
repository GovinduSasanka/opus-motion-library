# video20 — "The Little Fix-It Box" (pencil-sketch 3D town, 218 s)

## Overview

| Property | Value |
|---|---|
| Resolution | 1920 x 1080 (16:9) |
| Container fps | 30 (h264). **Unique frames come at 24 fps.** Every 5th frame is a duplicate (a 4-6-5 duplicate cadence, about 20% of frames), so the animation was rendered at 24 fps and converted to 30 fps. |
| Duration | 218.6 s (6557 frames) |
| Audio | An AAC stream exists but it was not analysed. |

**Story.** A small orange box robot looks like a cube pig. It has four block legs, a snout and a side "arm" that holds a pencil. It walks through a hand-drawn town and fixes everyone's small problems, one vignette at a time: a pothole, a box on an awning, a balloon in a tree, a smoking toaster, a bent awning pole, a bike, a traffic light, a guitar, a flower cart, a ring lost in a drain, a café display, a neon sign, a stuck door, a sewing machine, a delivery robot, a kite, a fountain, planters, a dog leash, a chalk drawing, a bus display, a bakery oven, a blueprint and finally the town clock. The town cheers, the robot draws a heart, the camera cranes out over the city, and everything fades back to blank paper with only the heart left.

**Art style.** The scenes are real-time 3D (a three.js-style perspective camera) rendered with an **architectural pencil-sketch NPR look**:
- Outlines are thin dark-brown ink lines, 1.5–3 px at 1080p. Lines **overshoot the corners** by 6–15 px, like an architect's construction lines.
- Every face is filled with **diagonal coloured-pencil hatching**. The hatch lines run at about 60–65° (rising to the right), sit about 5–7 px apart and have streaky opacity. Darker faces use denser or darker hatching (a cross-hatch effect).
- All colours are muted watercolour-on-paper tones over a cream paper texture with fine grain.
- A **deckled / torn watercolour vignette frame** wraps the whole video. The image sits inside an irregular torn rectangle. The outer margin is lighter paper. A soft darker watercolour bleed runs along the edge.
- Characters are flat "paper-doll" figures: rectangle torso, cylinder limbs, round head, simple dot eyes, and the same hatching.
- Emotions are shown with 2D doodle icons: ? ! lightbulb, hearts, scribble ball, sweat drop and 4-point sparkles.
- The colour grade warms over the video. It starts neutral cream, goes green in the park, turns sky blue at the clock tower and ends in peach/golden-hour.

**Palette** (sampled from full-res frames; hatch fills sampled as medians):

| Role | Hex |
|---|---|
| Outer paper margin | `#e3dac9` |
| Paper / wall / floor (neutral act) | `#e1d7c5`, `#dfd6c5`, `#d9cfb8` |
| Door / shadow-side wall | `#c6b9a7` |
| Ink line (dark brown-black) | ≈ `#2e2a26` (thin lines measure lighter, `#574230`, because of anti-aliasing) |
| Robot body, lit face | `#cf8465` (more saturated strokes ≈ `#d9785a`) |
| Robot body, shade face | `#b36a56` |
| Robot legs | `#d29278` |
| Robot eyes | `#262021` with a white catch-light dot |
| Robot head flower (later acts) | ≈ `#e0626a` |
| Pencil prop | yellow `#e8c25a`, eraser `#e59a9a`, ferrule grey |
| Yellow shirt | `#e5c88b` |
| Teal shirt | ≈ `#4fa598` |
| Jeans | `#626d79` |
| Skin | `#dbc1a4` |
| Hair | `#685b54` |
| Grey props (stones, bins) | `#b1a79a` |
| Balloon red | `#d37064` |
| Lightbulb | `#f4d780` |
| Heart fill | `#e38c76` |
| Heart outline | ≈ `#c0403e` |
| Park grass | `#c6c9a0` |
| Rainbow crayon (R→V) | `#e05a4a` `#f0a050` `#f2d060` `#7cbf6a` `#5a8ad0` `#9070c0` |
| Blueprint panel | `#42668d` with white lines |
| Neon sign plate | `#45323e` |
| Neon text | `#f59ac4` core, glow `#be5b80` |
| Clock-tower sky | ≈ `#c9d6dc` |
| Final warm grade | ≈ `#dfb389` (overall mean shifts to rgb(215,183,153)) |
| Gear yellow | `#cfb68c` |
| Gear mauve | ≈ `#b59a8f` |
| Sparkles | green `#5fa55a`, blue `#4a6fc2`, gold `#e8b84a`, red `#d65a5a` |

**Typography.** There are no titles or captions; all text is diegetic.
- **Shop signs** (BOOKS, CAFE, MARKET, CYCLES, FLOWERS, TRATTORIA, TAILOR, BAKERY, COMING SOON, LIBRARY) are a hand-lettered marker/handwriting face in ink, all caps, slightly irregular. Good stand-ins are *Architects Daughter*, *Gloria Hallelujah* or *Patrick Hand*. Cap height is about 3–5% of frame height. The signs are placed on 3D sign boards, so their perspective changes with the camera.
- **Neon "NOODLES"**: rounded bold sans (e.g. *Baloo* or *Comfortaa Bold*) with wide tracking (+10%), pink with an outer glow.
- **Bus display**: handwritten yellow "BUS 7 2 min" with a small "on time :)" line, on a near-black LCD.
- **Comic SFX**: tiny handwritten words ("HONK", "beep beep!", "err..", "whine") at about 1.5% of frame height, grey ink.

## Timeline

Times are taken from 1 fps contact sheets and checked with frame-difference analysis. Most "scene" changes are **continuous camera moves inside one 3D town**, not hard cuts.

| # | Start–end (s) | On screen | What moves | Into next |
|---|---|---|---|---|
| 1 | 0.0–2.9 | Neutral street with a doorway and two grey balls. A boy in a yellow shirt. | The camera trucks right (about 0.3 s). The robot **materialises** with sparkles (0.33–0.55 s), the pencil arm draws in (≈0.55–0.8 s), and the robot and boy walk. | Whip-pan right |
| 2 | 2.9–3.9 | Long street perspective, "BOOKS". | Whip-truck with ease-in-out and a small overshoot (see `whip-pan-truck`). | Settles |
| 3 | 3.9–10.0 | Cyclist with a pothole; he has a scribble ball on his head. | Robot emotes "!" → "?" → blink → lightbulb. The pencil **morphs into a hammer**. Close-up 3/4 low angle. A **grate is drawn bar by bar** over the hole. Sweat drop. | Dolly back |
| 4 | 10.0–11.9 | Cyclist happy (a heart pops) and rides off. | Pull-back to a wide shot. | Pan/truck |
| 5 | 11.9–19.0 | Old man with a scribble halo; a box is stuck on the door awning. | Robot extends a **telescoping grabber claw**. A tilt-up shows the claw grabbing the box. Delivery and cheer. | Truck right |
| 6 | 19.0–26.9 | Café street with a red balloon caught in a tree. | The robot sends a line/pole up the trunk. The balloon floats down to the child. Hearts rise. | Truck right with a foreground pedestrian wipe |
| 7 | 26.9–34.0 | Café counter with a smoking toaster/espresso machine (scribble smoke circles). | Screwdriver fix. The smoke puffs shrink away. Barista cheers. | Truck |
| 8 | 34.0–37.4 | Burst pipe spraying water into a blue puddle; a couple stands under the "MARKET" awning. | "!" → lightbulb. The camera passes the foreground legs of a person. | Cut/whip (37.4–37.7, the only scene-detector hit) |
| 9 | 37.4–41.0 | Bent awning pole. | Wrench fix; the pole straightens; the camera pulls back to the "CYCLES"/"MARKET" storefronts; couple cheers. | Truck |
| 10 | 41.0–48.0 | Bike-shop customer ("HONK") with a broken bike. | Screwdriver fix, close-ups, sparkle burst. | Truck to street corner |
| 11 | 48.0–55.0 | Traffic light stuck on red; pink cars waiting. | Robot opens the control box. **Coloured wires** are redrawn. Red → green. Cars move ("beep beep!"). | Truck |
| 12 | 55.0–63.0 | Street musician with a guitar; "FLOWERS" shop. | Tuning-key fix; music notes and coins pop. | Truck |
| 13 | 63.0–70.8 | Flower cart with a broken wheel. | Wrench fix, flowers wobble, pull-back to the storefront. | Truck |
| 14 | 70.8–78.0 | Girl drops a ring into a drain grate. | Lightbulb → **U-magnet** tool → the ring is fished out on a string. Hearts and sparkles. | Truck |
| 15 | 78.0–85.0 | "TRATTORIA": chef with a cracked display glass. | Robot traces the crack (crack line redrawn as a straight line). Chef cheers. | Truck right |
| 16 | 85.0–92.8 | Dangling broken lamp/sign wire on a wall. | Pliers reconnect the wire. **Neon "NOODLES" switches on** (cut + pull-back at 90.7). | Truck |
| 17 | 92.8–99.7 | Two men carry a box; a door is stuck. | Pliers/oil on the hinge; the door swings open. | Truck |
| 18 | 99.7–105.0 | "TAILOR": sewing machine jammed. | Magnet/pliers fix; the tailor cheers. | Truck |
| 19 | 105.0–113.8 | Sad delivery robot with broken wheels; giant pedestrian legs walk past in the foreground. | Claw/pliers fix; wheels roll; "err.." SFX. | Pedestrian-leg wipe |
| 20 | 113.8–121.0 | Park; fruit vendor; red-and-white kite stuck in a tree. | Magnet grabs the kite. Wide shots with background crowd figures (sprites). | Truck |
| 21 | 121.0–129.0 | Dry fountain. | Wrench fix; **water arcs** spray in blue. | Truck |
| 22 | 129.0–136.2 | Planters. | Trowel; **sprouts and yellow flowers grow** in a row. | Truck |
| 23 | 136.2–141.0 | Bench with a dog and a tangled leash. | Pliers untangle the leash. | Truck |
| 24 | 141.0–153.0 | Girl drawing with chalk. | The robot's pencil turns **rainbow-striped**. A top-down shot shows a **doodle draw-on**: sun, house, rainbow, flowers. | Truck |
| 25 | 153.0–160.2 | Bus stop display showing "ERR". | Magnifier fix. The text shows **upside down**, then upright: "BUS 7 2 min / on time :)". | Bus wipe |
| 26 | 160.2–161.6 | Yellow "7" bus drives in from the right and fills the frame. | **Foreground-vehicle wipe** (≈1.3 s). | Bus exits to the bakery |
| 27 | 161.6–168.0 | "BAKERY": oven door hanging, a "FLOUR" sack. | Pliers fix; the door is redrawn shut. Baker and kids cheer. | Truck |
| 28 | 168.0–176.0 | Construction worker with a crumpled blueprint; "COMING SOON". | A **blueprint panel is drawn line by line** (windows grid). Worker cheers. Tilt up to a new building: "LIBRARY / OPENING SOON". | Crane up |
| 29 | 176.0–182.5 | Town square, aerial view, people looking up. | Camera cranes down/around and tilts up the clock tower. | Wave-line wipe |
| 30 | 182.5–183.7 | Full frame of wavy horizontal pencil lines. | `wave-line-wipe`. | Reveal |
| 31 | 183.7–189.0 | Inside the clock: gears turning. | Robot on a beam; gear fix; lightbulb; tilt. | Cut/tilt |
| 32 | 189.0–196.0 | Clock tower exterior against blue sky; bunting. | Crane up. Clock hands move. The grade warms to sunset. | Dolly over the rooftop |
| 33 | 196.0–201.8 | Robot on the tower roof. | Pull-back to an **aerial city flyover**: dozens of procedural buildings, a park, a crowd in the street. | Swoop down |
| 34 | 201.8–205.0 | Low-angle crowd cheering at the tower base. | Crowd bobs; hearts float; crowd slides out of frame (tilt up). | Cut |
| 35 | 205.0–209.5 | Robot close-up on the roof. | Eyes close (dash → ^ ^). The pencil redraws the face into a smile. | Pull-back |
| 36 | 209.5–213.0 | Robot on the roof terrace. | **Heart draw-on**: outline stroke, then fill, then sparkles. | Crane |
| 37 | 213.0–216.5 | Pull-back: heart → tower roof → whole city from above. | Crane-out with the heart centred. | Fade |
| 38 | 216.5–218.6 | Blank paper with a glowing heart. | `fade-to-paper` (the city dissolves; the heart stays). | End |

## Motion techniques

### 1. `pencil-sketch-render` (global look; applies to everything)

**What it looks like.** Every object is a flat-shaded 3D primitive drawn as ink outlines with overshooting corners, filled with diagonal coloured-pencil hatching over grainy cream paper.

**Elements and parameters**
- **Paper.** Base `#dfd6c5`. Two noise layers sit on top:
  - fine grain: feTurbulence `baseFrequency 0.9`, 1 octave, opacity 0.06;
  - large blotches: `baseFrequency 0.004`, opacity 0.08, multiply.
- **Hatch fill.** Per face: a fill colour at 55–70% opacity, plus a line pattern.
  - Angle −62° (rising to the right).
  - Spacing 6 px; stroke 1.2 px; stroke colour = face colour × 0.8 at 35% opacity.
  - Shade faces use a second pass at −62° offset by 3 px, or a second angle at 28° for cross-hatch, at 25% opacity.
  - Stroke dash randomisation (dasharray from seeded random values in 40–200 / 3–10) gives the "streaky pencil" look.
- **Outlines.** Ink `#2e2a26`, 2–2.5 px for silhouettes and 1–1.5 px for interior edges.
  - Each edge is extended past both vertices by `rand(4,14)` px.
  - Each edge gets a perpendicular jitter of ±1 px (seeded per edge, fixed over time).
  - Lines **do not boil**: frame-to-frame differences in static shots are about 0, so jitter is fixed per object.
- **Contact shadows.** A hatched ellipse under each object at 30% opacity, made of dense short diagonal strokes.

**Implementation (Remotion).** Option A, recommended for fidelity: `@remotion/three` with a custom material.
- Lambert shading quantised into 3 bands.
- A screen-space hatch texture (tiling diagonal strokes) whose density follows the band.
- Edges from `EdgesGeometry`, rendered as `Line2` with extended endpoints.
- A full-screen pass multiplies in the paper texture.

Option B, SVG 2.5D:
- Build boxes in a projected isometric/perspective helper. Each face becomes a `<polygon fill="url(#hatch-<color>)">` plus `<line>` edges with overshoot.
- Define one `<pattern id="hatch-x" patternTransform="rotate(-62)" width="6" height="6">` per colour.
- Add an SVG `feTurbulence` + `feDisplacementMap` (scale 1.5) on the fill group for organic hatching.

**Props:** `paperColor`, `inkColor`, `hatchAngle`, `hatchSpacing`, `overshoot`, `seed`.

### 2. `deckle-vignette-frame` (global overlay)

**What it looks like.** The picture sits inside an irregular torn-paper rectangle. Outside it is a lighter paper margin (`#e3dac9`). Along the edge runs a darker watercolour bleed (≈ `#c4b9a8`, 20–40 px soft band) that tints with the scene grade: grey in neutral acts, green in the park, orange at sunset.

**Parameters**
- Inset about 4% on left/right (≈ 70–130 px) and 3–5% top/bottom (40–60 px).
- Edge displacement amplitude 10–25 px. Noise frequency ≈ 0.015 px⁻¹ along the edge, 3 octaves.
- The overlay is **static** for the whole video; corner pixels stay ≈ `#c3baaa` throughout.
- Inner bleed: a 30 px inner shadow (multiply, 35%) with a turbulence-displaced edge.

**Remotion recipe.**
- Absolutely positioned full-frame SVG with `mask`.
- Path = rectangle whose edges are sampled every 8 px and displaced by `noise1D(seed, s*0.015)*20`.
- Fill the outside with the paper colour and grain.
- Draw the edge with `feGaussianBlur stdDeviation=12` + multiply blend.
- Expose `tint` so the bleed can follow the scene grade.

**Props:** `insetPct`, `roughness`, `bleedColor`, `seed`.

### 3. `box-bot-character` (rig + walk + idle)

**Elements**
- Body: cuboid 1 : 0.85 : 0.75 (W:H:D).
- Four square legs, each 22% of body width and 30% of body height.
- Snout: a rounded rectangle on the back face (it reads as a pig snout or a tail).
- Face on the front: two rectangular black eyes (8% of body width, 2:1 tall) with a white catch-light dot.
- Brow lines: two short ink strokes above the eyes, angled for emotion.
- Side "hand" nub: rounded flap that holds the tool.
- From act 14 onwards: a pink 5-petal flower on top of the head.

**Motion**
- **Walk.** Legs alternate in diagonal pairs with ±10° swing. Body bob is 2% of body height at twice the step rate. Step cycle ≈ 0.42 s.
- **Speed lines.** While moving, 3–4 short horizontal ink dashes trail behind the body (length 10–25% of body width, opacity 0.6). They appear with motion and fade within 0.15 s of stopping.
- **Eye states**:
  - open: rectangles;
  - blink: eyes become horizontal dashes for 4 frames (0.13 s); a double blink is 0.13 on / 0.1 off / 0.13 on;
  - happy: "^ ^" chevrons;
  - asleep/content: "– –";
  - worried: brows tilt 15°.
- **Spawn / materialise** (0.33–0.55 s): body opacity 0 → 1 over 5–6 frames (linear), while 5–8 sparkles flicker around it. A thin construction-line box (outline only) shows on the first visible frame.
- **Pencil draw-in**: the tool scales along its length from the hand, 0 → 1 over about 6 frames (ease-out).

**Remotion recipe.**
- `<BoxBot pose expression tool flower facing />`. Use spring-free interpolation; motion is mostly linear or ease-in-out.
- Leg angle = `sin(t*2π/0.42 + phase)*10°` with phases [0, π, π, 0].
- Body y = `|sin(...)|*bob`.

**Props:** `bodyColor`, `shadeColor`, `expression`, `tool`, `walkSpeed`, `accessory`.

### 4. `emote-icon-pop`

**What it looks like.** Doodle icons sit about 0.4 body heights above the character's head:
- red-filled "!" with 2–3 short radial tick lines;
- ink "?";
- yellow lightbulb with 3 horizontal glow dashes underneath and a soft radial glow;
- pink hearts (1–3, rising);
- blue sweat drop;
- the scribble ball (see `scribble-frustration-ball`).

**Timing** (measured at 30 fps):
- **Pop-in is near-instant**: 1–2 frames, scale 0.85 → 1 and opacity 0 → 1. No overshoot is visible.
- Hold 0.6–1.2 s.
- **Fade-out over 4–5 frames** (0.15 s, linear opacity).
- A chained emote ("!" then "?") starts its fade-in on the frame after the previous one finishes.
- Lightbulb fades out over about 0.3 s.
- Hearts drift up 3–5% of frame height over 1 s while fading. Several hearts are staggered by 0.15–0.25 s with ±10° tilt.

**Recipe.**
- `opacity = interpolate(f, [in, in+1, out, out+5], [0, 1, 1, 0])` and `scale = interpolate(f, [in, in+2], [0.85, 1])`.
- Icons are SVG paths with ink stroke 2.5 px. Use `stroke-linecap: round` and slight jitter.
- The bulb glow is a radial gradient `#fff3b0` → transparent with radius 1.6× the bulb.

**Props:** `type`, `anchor`, `start`, `hold`, `color`.

### 5. `scribble-frustration-ball`

**What it looks like.** A tangle of 6–10 overlapping elliptical ink loops floats just above an upset character's head. Ellipse aspect is about 2.2:1, width about 1.3× head width. A thin red vertical "steam" squiggle connects it to the head. The scribble is **regenerated every unique frame** (24 fps "boil"), so it seethes.

**Recipe.**
- Each frame, seed = `floor(frame*24/30)`.
- Draw one path of N = 8 loops. Loop k is an ellipse with centre jitter ±6%, radius jitter ±15%, rotation ±8°, and a start angle that drifts.
- Stroke 1.8 px ink, slightly open (draw 330–380° of each loop).
- Fade in and out over 0.2 s.

**Props:** `loops`, `size`, `boilFps`, `color`.

### 6. `sketch-morph-tool-swap`

**What it looks like** (6.3–6.95 s, pencil → hammer; reused for every tool: hammer, wrench, screwdriver, pliers, claw, magnet, trowel, magnifier, rainbow pencil):
1. The current tool loses its fill and fades to a pale ghost (0.12 s).
2. A **single wobbly closed ink outline** appears and **morphs shape** over about 0.45 s, from a jagged blob to a rough hammer silhouette. Faint concentric construction circles (1–2 large pale arcs, opacity 0.2) and a small blue "+" crosshair flash around the hand while it morphs.
3. The final outline snaps to the clean tool shape.
4. A hatched fill floods in over 2–3 frames (0.1 s).
5. The tool then rotates into its working angle: 0° → −35° over 0.3 s, ease-out.

Total ≈ 0.8 s.

**Recipe.**
- Store tool silhouettes as polygons resampled to the same 64 points.
- Morph with `flubber` or point-wise lerp between a noisy blob (`circle + noise(seed)*0.35r`) and the target.
- Add per-frame noise amplitude that decays from 0.25 → 0 (`noiseAmp = interpolate(p, [0, 0.8, 1], [0.25, 0.08, 0])`).
- Fill opacity: `interpolate(p, [0.85, 1], [0, 1])`.
- Construction circles: two SVG circles r = 1.5–2.5× tool length, stroke 1 px at 0.2 opacity, appearing for 0.4 s.

**Props:** `fromTool`, `toTool`, `duration`, `pivot`.

### 7. `tool-tap-repair` (+ `sparkle-burst`)

**What it looks like.** The tool rocks or taps against the target:
- Hammer: rotate −35° ↔ −10°, 3 taps at 0.25 s intervals, ease-in on the down-stroke and ease-out on recovery.
- Wrench / screwdriver: twist ±25° about its axis, 2–3 cycles.

On the final tap a **sparkle burst** fires: 5–9 four-point stars (thin cross with a longer vertical arm, 1.5 px stroke) in green, blue, gold and red.
- Sizes 12–40 px, scattered within a radius of 1.2 body widths.
- Each star scales 0 → 1 in 3 frames, twinkles (scale ×0.7–1 at 8 Hz) and fades over 0.4–0.7 s.
- Stagger 0–0.2 s.
- 4–6 short radial "impact" ticks (ink, 15–30 px) flash for 3 frames at the contact point.

**Recipe.** Seeded star list `{x, y, size, color, delay}`. `scale = interpolate(f-d, [0, 3], [0, 1]) * (0.85 + 0.15*sin(f*0.9))` and `opacity = interpolate(f-d, [12, 20], [1, 0])`.

**Props:** `count`, `radius`, `colors`, `duration`.

### 8. `line-by-line-construct` (grate, blueprint, wires, crack repair)

**What it looks like.** The repair object is **drawn into existence one primitive at a time**:
- Pothole (7–9.6 s): the black blob gets a rectangular frame, then 9–10 parallel bars, about 0.15 s per bar, front to back. The dark hole fades from opacity 1 → 0 over 2 s underneath.
- Blueprint (172.5–175 s): a blue panel slides/fades in from the top (0.3 s). Inside, white lines draw on in order: building outline → window grid (3×4 small squares, about 0.12 s each, row-major) → second panel with a cross. Each element appears with a small pencil cursor/"+" flash at the drawing point.
- Traffic-light wires: coloured lines (red, green, blue, yellow) are stroked from the box to the light.

**Recipe.**
- Ordered list of SVG paths. For each: `strokeDashoffset = interpolate(f, [s_i, s_i+d], [len, 0], {easing: Easing.inOut(Easing.quad)})` with `s_i = start + i*stagger`.
- Stagger 0.12–0.15 s; per-path draw time 0.1–0.2 s.
- Fills (bars) appear as hatch at the end of each stroke.

**Props:** `paths[]`, `stagger`, `drawDur`, `strokeColor`, `cursor: boolean`.

### 9. `crayon-doodle-draw-on` (chalk drawing, act 24)

**What it looks like.** A top-down camera looks at the grass. The rainbow-striped pencil (6 stripes along its length) travels along each doodle path and leaves thick crayon strokes:
- sun: circle + 8 ray dashes;
- house: square + roof chevron in red/purple;
- rainbow: 6 concentric arcs;
- lollipop flowers: circles on stems.

Strokes are 8–12 px wide with round caps and a textured (grainy) alpha, slightly wobbly.

**Timing.** About 0.6–1.0 s per doodle. Sun 146.9–147.6, house 148.0–148.6, rainbow arc 148.6–149.5, flowers 150.0–151.0. The pencil tip is locked to the stroke head. The rainbow's 6 arcs draw simultaneously, offset in radius, so one sweep paints all colours.

**Recipe.**
- `getPointAtLength` drives the pencil sprite position and its rotation (tangent). Stroke head = `len*progress`.
- Crayon texture: `feTurbulence baseFrequency 0.8` → `feComposite` as an alpha mask on the stroke group.
- Easing: linear along the path, ease-in-out between paths.

**Props:** `doodles[]` (path + colour), `perDoodleDur`, `gap`, `strokeWidth`, `pencilStripes`.

### 10. `heart-draw-fill-glow` (finale)

**What it looks like** (209.5–213 s):
1. A red outline heart (stroke ≈ `#c0403e`, 3 px) **draws on** from the top-centre dip: first the left lobe, then around to the point and up the right lobe. Duration ≈ 1.2 s, ease-in-out.
2. 0.2 s after the stroke closes, the fill (`#e38c76` with fine hatch) fades in over about 0.5 s.
3. 3–5 four-point sparkles twinkle around it.
4. A soft radial glow (`#ffb070` → transparent, radius 1.8× the heart) fades in.
5. The heart then hovers. It stays screen-centred during the crane-out and the final fade-to-paper, where it scales down about 15%.

**Recipe.** Heart path (two cubic béziers). `strokeDashoffset` = len → 0 over 36 frames with `Easing.inOut(Easing.cubic)`. Fill opacity from frame 42 to 57. Glow is a radial-gradient circle with `mix-blend-mode: multiply` or screen at 0.6.

**Props:** `color`, `outlineColor`, `size`, `drawDur`, `glow`.

### 11. `whip-pan-truck` (camera; the main way the video moves between vignettes)

**What it looks like.** The camera trucks sideways along the street, about one frame-width, to the next vignette. The motion is fast in the middle and accelerates/decelerates smoothly. It ends with a small **overshoot and settle back**.

**Measured** (phase correlation, 26.6–27.8 s, on a 160 px-wide proxy):
- Per-frame horizontal shift ramps 1 → 12 px/frame over about 0.5 s, peaks at ≈ 7.5% of frame width per frame, and ramps down over about 0.35 s.
- Total travel ≈ 0.97 frame-width.
- Then a reverse drift of ≈ −3 px/frame for about 0.35 s, i.e. ≈ 8–10% overshoot that settles back.
- The 2.6–4.1 s pan behaves the same, with a −6 px/frame settle.

Duration ≈ 0.9 s plus a 0.35 s settle. The curve is cubic-bezier(0.45, 0, 0.35, 1) into a 10% overshoot. Equivalently, a spring with damping 14, stiffness 120 and mass 1 starting from rest. There is no motion blur; frames are crisp and some at 24 fps repeat.

**Recipe (2D).** The world is a wide strip: `translateX = -spring({frame, fps, config: {damping: 14, stiffness: 120}}) * distance`. Background layers get parallax multipliers (see Camera).

**Props:** `distance`, `direction`, `duration`, `overshoot`.

### 12. `foreground-occluder-wipe`

**What it looks like.** A large out-of-scale foreground object passes very close to the camera and covers most of the frame while the camera trucks. The cut or scene change hides behind it. Variants:
- a pedestrian's torso or legs (27.0 s, 34.4 s, 50.7 s, 105–113 s);
- a striped awning arm swinging in (37.4 s);
- a **yellow bus with the number "7"** driving in from the right (160.2 s). The bus fills the frame in 1.0 s, holds full-frame for 2 frames, then reveals the bakery.

The occluder moves 1.5–2× faster than the background (near-plane parallax). Its edges are soft and watercolour-bled because it is out of the "focus" plane: a blurred hatch with no ink outline, opacity 0.85–1.

**Recipe.** A `<Sequence>` overlap of about 0.4 s. The occluder `translateX` runs from 110% to −110% of frame width over 0.8–1.2 s with an ease-in-out cubic. Switch scenes at the frame where occluder coverage is greater than 90%.

**Props:** `occluder` (svg/component), `direction`, `duration`, `switchAt`.

### 13. `wave-line-wipe`

**What it looks like** (182.5–183.7 s). Horizontal wavy ink lines fill the screen; they read as sound or time ripples:
- 14–18 rows;
- each a sine with amplitude 1.5–3% of frame height, wavelength 20–35% of frame width;
- neighbouring rows have different phase, so they cross and braid;
- stroke 1.5–3 px, ink at 50–90% opacity.

They fade in over the outgoing shot (clock-tower tilt), sit full-frame for about 0.4 s while scrolling horizontally (about 15% of frame width per second), then fade out to reveal the gear interior.

**Recipe.**
- N `<path>` elements built with `y = y0 + A*sin(2π(x/λ) + φ_i + t*ω)`. Add a second harmonic at 0.3A for organic look.
- Group opacity 0 → 1 over 0.35 s, hold 0.4 s, 1 → 0 over 0.35 s.
- Crossfade the scenes underneath, centred in the hold.

**Props:** `rows`, `amplitude`, `wavelength`, `scrollSpeed`, `color`, `duration`.

### 14. `meshing-gears`

**What it looks like** (183.7–189 s). 6–7 cog wheels of varying size overlap as layered planes behind the robot:
- colours: mustard `#cfb68c`, mauve `#b59a8f`, beige;
- teeth are soft rounded bumps (10–12 per gear);
- 5 straight spokes and a hub circle, all hatched.

Gears rotate slowly (≈10–15°/s for the large gear). Meshing neighbours counter-rotate at the ratio of tooth counts. A horizontal beam crosses them; a ladder hangs below.

**Recipe.**
- Gear path: polar `r(θ) = R + h*smoothstep-ish(cos(nθ))` with tooth height h = 0.08R.
- `rotate = dir_i * ω * (R0/R_i) * t`.
- Every gear uses hatch fill + ink outline.

**Props:** `gears[] {x, y, R, teeth, color}`, `speed`.

### 15. `water-spray-arcs` (burst pipe, fountain)

**What it looks like.** Thin blue pencil lines (`#6f9bd0`, 1.5 px) fan upward from a point in 4–6 parabolic arcs. They re-draw continuously as dashes travel along each arc (dash 20 / gap 30 px, offset scrolling about 200 px/s). A blue elliptical puddle (`#a8c4dd`, hatched) **grows** under people: radius scales 0 → 1 over about 2 s, ease-out. The fountain uses the same arcs in a symmetric crown.

**Recipe.** Quadratic paths from the source with randomised angles (±35°) and heights. `strokeDashoffset = -t*speed`. Puddle `scale = interpolate(t, [0, 2], [0, 1], {easing: Easing.out(Easing.cubic)})`.

**Props:** `arcs`, `color`, `height`, `spread`, `puddle`.

### 16. `smoke-puff-circles`

**What it looks like** (27–33 s). Above a broken appliance, clusters of overlapping ink circles (3–6 per cluster, different radii, 1–2 px strokes) represent smoke. Puffs spawn at the vent, rise about 15% of frame height, grow ×1.5 and fade over 1.2 s; a new cluster appears every 0.3 s. When the repair finishes, the clusters shrink back to nothing (0.5 s).

**Recipe.** Particle list with `spawn = i*0.3s`. For each, `y -= t*v`, `r *= 1 + 0.4t`, `opacity = 1 - t/1.2`. Circles are slightly open arcs with a seeded start angle.

**Props:** `rate`, `rise`, `life`, `strokeColor`, `active`.

### 17. `sprout-grow-row`

**What it looks like** (129–136 s). Small stems rise out of the planters with a stagger, then flower heads (yellow circles with petals) scale in.
- Stem scaleY 0 → 1 over 0.4 s, ease-out.
- Leaves pop at 60%.
- Head scale 0 → 1.1 → 1 over 0.25 s.
- Stagger left-to-right, 0.08 s.

**Props:** `count`, `stagger`, `colors`.

### 18. `neon-sign-ignite`

**What it looks like** (90.7 s). The camera cuts to a dark plum plate (`#45323e`) with pink rounded caps "NOODLES". The text has a white-pink core (`#f59ac4`) and a 12–20 px outer glow (`#be5b80`, opacity 0.6). The camera then pulls back about 2× in 0.6 s to show the storefront.

The glow is steady after ignition. The saturated-pixel count stays stable for 2 s, so there is no ongoing flicker. Model a 3-frame flicker (on, off, on) at ignition if you want one.

**Recipe.** Text with `filter: drop-shadow(0 0 6px core) drop-shadow(0 0 18px glow)`. Opacity keyframes `[0, 1, 0.3, 1]` over 4 frames.

**Props:** `text`, `plateColor`, `neonColor`, `font`.

### 19. `display-glitch-fix` (bus sign)

**What it looks like.**
1. A near-black LCD shows "ERR" in red handwriting.
2. Cut: the correct text "BUS 7 2 min" shows **rotated 180°** (upside-down gag) in yellow, held about 2 s while a scribble ball boils over the waiting man.
3. After the magnifier fix, the text snaps upright and a second line "on time :)" appears.

Changes are hard switches between frames. Sparkles appear at the fix.

**Props:** `errorText`, `wrongText`, `fixedText`, `subText`, `colors`.

### 20. `traffic-light-switch`

**What it looks like.** Three ink circles in a dark grey housing. The red lamp (`#e05050` with radial glow 1.6× radius) is lit while the others are dark grey. On the fix it hard-switches to the bottom green lamp (`#58c060` + glow). Cars then begin moving and a "beep beep!" word pops in.

**Props:** `state`, `switchFrame`.

### 21. `crowd-cheer-bob`

**What it looks like** (201.8–205 s). 20–30 paper-doll townspeople in one or two ranks are seen from a low angle (heads at the bottom 25% of frame). Their arms are raised in a V and bob:
- arm angle ±15° at 2–3 Hz;
- body y ±1.5% of height;
- each person has a random phase.

Hearts float up from a random subset every 0.3 s. The whole crowd slides down out of frame as the camera tilts up to the tower (≈ 1.5 s, ease-in-out).

**Recipe.** Seeded array of figures `{x, scale, palette, phase}`. Per-person `armAngle = 70° + 15*sin(2π*2.5*t + phase)`.

**Props:** `count`, `palette[]`, `bobHz`, `heartsRate`.

### 22. `procedural-sketch-city`

**What it looks like** (196–201 s and 213–216 s). An aerial view of a dense town:
- extruded boxes on a street grid with heights from 2 to 12 storeys;
- gabled-roof houses mixed in;
- rooftop boxes (AC units / chimneys);
- grids of yellow-lit windows;
- a park block of round-canopy trees;
- tiny crowd dots along a street with bunting lines.

All of it is hatched and outlined; colours are peach, mauve, sage and slate at low saturation. Atmospheric fade: distant buildings blend toward the sky colour (`#e8d6c0`) over 60% of the depth range.

**Recipe** (three.js).
- Grid of lots. Each lot is `BoxGeometry(w, h, d)` with `h = 1 + floor(rand()*rand()*12)` storeys.
- Windows as instanced quads; 30% lit `#f2d27a`.
- Edges with overshoot; fog = linear to the paper colour.

**Props:** `blocksX`, `blocksZ`, `seed`, `maxStoreys`, `palette`, `litRatio`.

### 23. `crane-pullback-reveal`

**What it looks like.** The camera starts close on the subject (robot or heart), then pulls back and up at the same time, keeping the subject at screen centre. The world opens up to a full aerial city view.
- 213.0 → 216.5 s.
- Distance ×12; elevation rises about 45°.
- Ease: cubic-bezier(0.4, 0, 0.2, 1), i.e. slow start with a long glide.
- A gentle 10–15° yaw happens during the move.

**Recipe.** The camera follows a bezier path `P(t)`, `lookAt` locked on the subject, with `t = Easing.bezier(0.4, 0, 0.2, 1)(progress)`. In 2D, scale the world from 4 → 1 around the subject anchor, with slight rotate.

### 24. `fade-to-paper`

**What it looks like** (216.5–218.6 s). The whole scene, except a hero element (the heart), dissolves into blank paper. Measured whole-frame std drops 26 → 16 between 216.5 and 218.0 s, and the mean brightens to rgb(226, 215, 193). The fog/wash comes first (washes out distant detail), then everything fades. The deckle frame stays. The heart keeps its glow and sparkles.

**Recipe.** Overlay a paper-coloured rect with opacity `interpolate(f, [216.5s, 218.0s], [0, 0.92], {easing: Easing.inOut(Easing.sine)})` **beneath** the hero layer. Optionally add a radial gradient so the edges vanish first.

**Props:** `start`, `duration`, `paperColor`, `keepLayers`.

### 25. `scene-grade-shift`

**What it looks like.** The colour temperature moves continuously across acts:
- neutral cream (mean ≈ rgb(217, 207, 184));
- green park (≈ rgb(197, 201, 161));
- cool sky at the clock (sky `#c9d6dc`);
- warm sunset (rgb(215, 183, 153) for the frame mean, `#dfb389` wash).

Each shift happens over 2–5 s inside camera moves, never as a cut.

**Recipe.** A full-frame multiply layer whose colour is keyframed per act, plus an optional soft sun glow. `interpolateColors(frame, keyframes, colors)`.

**Props:** `keyframes [{frame, color}]`, `blendMode`.

## Transitions

| Type | Where | Timing |
|---|---|---|
| **Whip-pan truck** (dominant, ≈25 uses) | Between almost every vignette (2.9, 11.9, 19, 26.9, 41, 48, 55, 63, 70.8, 78, 85, 92.8, 99.7, 105 …) | 0.8–1.0 s ease-in-out plus 0.35 s overshoot settle; travel ≈ 1 frame width |
| **Foreground occluder wipe** | Pedestrians (27.0, 34.4, 50.7, 105–113), awning arm (37.4), bus "7" (160.2–161.6) | 0.8–1.3 s; the switch hides at >90% coverage |
| **Dolly in/out inside a vignette** | Close-ups of the robot's tool work (5.3, 6.3, 7.0, 44, 50.6, 73.8, 110 …) | 0.4–0.6 s ease-in-out; framing pushes from wide to about 3× |
| **Hard cut** | Few: 90.7 (neon close-up, then pull-back), 156 (bus sign), 201.8 (crowd) | 1 frame |
| **Wave-line wipe** | 182.5–183.7 (tower → gear interior) | 0.35 s in, 0.4 s hold, 0.35 s out |
| **Crane pull-back** | 196–201 (rooftop → city), 213–216.5 (heart → city) | 3–5 s, long ease-out |
| **Fade to paper** | 216.5–218.6 | 1.5 s sine in-out |

## Camera

- A single perspective 3D camera, FOV ≈ 40–50°. It usually sits at about child eye-height (the robot is 10–20% of frame height in wide shots). Low 3/4 angles are used for close-ups, with the robot filling 40–60% of frame height.
- **Idle drift.** During holds the camera is never fully static. It slowly orbits or trucks about 1–2% of frame width per second, ease-in-out.
- **Depth layers** (useful for a 2.5D rebuild): parallax multipliers should be FG ×1.8, robot ×1.0, mid ×0.6, BG ×0.35, far BG ×0.15.
  1. FG occluders (pedestrians, poles, bus);
  2. robot + main character plane;
  3. street furniture and storefronts;
  4. building facades / trees;
  5. far skyline (park acts only).
- **Moves.** Whip trucks (above), tilt-ups to awnings, trees, towers and blueprints (0.8–1.5 s), top-down for the chalk doodles (≈ 90° pitch at 145.5 s via a 0.6 s swoop), crane-ups and aerial flyovers at the end.
- No motion blur, no depth-of-field blur, except near-plane occluders, which get a soft watercolour edge.

## Library candidates

- `pencil-sketch-render`: a global hand-drawn architectural look for any explainer or story video.
- `deckle-vignette-frame`: a torn-paper frame overlay that gives any composition a sketchbook feel.
- `box-bot-character`: a cute rigged mascot with walk, blink and expression states for product explainers.
- `emote-icon-pop`: quick ? ! lightbulb heart sweat reactions over any character or UI element.
- `scribble-frustration-ball`: a boiling scribble cloud to show a "problem" or frustration state.
- `sketch-morph-tool-swap`: morph one icon into another through a wobbly outline, for feature switches.
- `tool-tap-repair` / `sparkle-burst`: tap-to-fix action plus a celebratory sparkle burst on success moments.
- `line-by-line-construct`: build diagrams, blueprints or UI wireframes stroke by stroke.
- `crayon-doodle-draw-on`: a pencil follows a path and leaves crayon doodles; good for playful annotations.
- `heart-draw-fill-glow`: an outline draw-on, then fill, then glow; works as a logo or end-card reveal.
- `whip-pan-truck`: a spring-eased lateral camera move between side-by-side vignettes or slides.
- `foreground-occluder-wipe`: hide scene changes behind a passing foreground object (bus, person, product).
- `wave-line-wipe`: a full-frame sine-line wipe for time, sound or dream transitions.
- `meshing-gears`: procedural counter-rotating gears for "how it works" or process sections.
- `water-spray-arcs`: dashed parabolic spray plus a growing puddle for leaks, fountains or flow.
- `smoke-puff-circles`: rising doodle-circle puffs for malfunction, steam or thinking.
- `sprout-grow-row`: staggered plant growth for growth or progress metaphors.
- `neon-sign-ignite`: a glowing sign switch-on for title cards or brand names.
- `display-glitch-fix`: an error → wrong → fixed text-display gag for bug-fix storytelling.
- `traffic-light-switch`: a red-to-green state change for "approved", "go" or unblocked moments.
- `crowd-cheer-bob`: a seeded cheering crowd with floating hearts for success or community beats.
- `procedural-sketch-city`: a seeded hatched city flyover for establishing shots and finales.
- `crane-pullback-reveal`: pull from a hero detail out to the big picture in a single move.
- `fade-to-paper`: dissolve everything except a hero element back to blank paper for an ending.
- `scene-grade-shift`: keyframed colour wash to carry the mood or time of day across acts.
