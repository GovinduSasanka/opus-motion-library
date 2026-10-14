# video15 — "anidoodle" cheetah sunrise (spike-fur vector)

## Overview

| Property | Value |
|---|---|
| Resolution | 1080 x 1080 (1:1) |
| FPS | 30 |
| Duration | 31.0 s (930 frames) |
| Audio | none |
| Hard cuts | 2 (25.55 s, eye to night sky match-cut; scene detect also flagged 24.7 during the fast eye push). Everything else is continuous. |

**Story:**
1. Night savanna with a crescent moon and teal grass. A giant orange sun rises behind the grass and grows a ring of spike rays. The grass turns to golden leaves.
2. A seed disk sprouts in front of the sun and blooms ring by ring into a cheetah face built entirely from radial spike/petal shapes. Ears, nose and white muzzle form, the eyes open and black spots pop on.
3. The camera pulls back as the head turns to profile, revealing a full cheetah under acacia trees. It walks, does a play-bow stretch, breaks into a full gallop with motion-blurred parallax grass, slows to a stop, then turns to camera.
4. The camera pushes into one eye. The pupil's crescent highlight match-cuts to the moon in a night sky, grass grows back, and the script logo "anidoodle" writes itself on, followed by a GitHub URL.

**Art style:** Flat-vector "papercut / stylised folk illustration" built from hundreds of elongated leaf/spike primitives with linear gradients. A fine grain speckle overlay covers everything (sun, grass). Dark navy night background, hot orange sun disc as a giant backlight, golden and cream fur, teal grass. Strong central symmetry in the face shots.

**Palette (sampled)**

| Element | Colours |
|---|---|
| Night bg | **#0c1820** / #0d1921 (very dark blue-teal) |
| Sun disc | radial gradient, hot centre **#fb8346** → rim **#f26e42 / #f1643e**. Spike rays #c4573c → #8a3a2c fading into bg. |
| Hills (body scenes) | #68382a, darker #4a2a22 |
| Teal grass | blades **#253a43 / #2b4b53** base → **#3f7f86** tips, plus grain |
| Golden leaf grass | **#74461d, #85542c, #b07a35** (pointed ovals with a midrib) |
| Fur gold | **#cd9a3a, #c08938, #e1c689, #ccb78c**. Centre seed disk **#b9711f**. Petal tips cream **#ecc67a → #f3ecd6**. |
| Eye | iris orange #e8892a → #f4a43c radial streaks, rim/lid line #060a0e, pupil #060a0e, crescent catch-light #f3eedc. Eye surround = ring of white spikes #f3efe4 / #b3ac9a. |
| Nose / tear marks / spots | **#180d0a / #060a0e / ≈#120c08** |
| Muzzle | #f3efe4 white spikes with #b3ac9a shading, black whisker-dots |
| Logo / moon / stars | **#fdf3db** (cream) |

**Fonts**
- Logo "anidoodle": high-contrast calligraphic copperplate script (Pinyon Script / Great Vibes / "Monte Carlo" class), lowercase, with a long looping swash from the final "e" that returns under the word as a hairline. Size: x-height ≈ 75 px, ascenders ≈ 150 px (≈ 14% H). Baseline ≈ y 520, spanning x 150–930.
- URL "github.com/alexgreensh/anidoodle": humanist bold sans (Open Sans / Source Sans Bold), ≈ 30 px (2.8% H), cream, centred at y ≈ 618.

**Layout:**
- Centred composition. The sun disc centre is at (539, ≈465), radius ≈ 468 px (diameter 87% of the frame), so it nearly fills the square.
- The face is centred at (540, ≈560) with fur-ball radius ≈ 380–400 px.
- Grass occupies the bottom ≈ 30% (y > 750).
- The moon sits at (≈755, 215) in the end card.

## Timeline

| # | Start–End (s) | On screen | What moves | Into next |
|---|---|---|---|---|
| 1 | 0.0–0.35 | Night: stars, crescent moon upper-left-centre, teal grass along the bottom | Stars twinkle. The grass sways slightly. | sun rises |
| 2 | 0.35–1.85 | Sun rises from behind the grass | Sun top edge goes from y ≈ 1150 to y ≈ −5 in 1.5 s, **ease-out-quad** (velocity falls linearly). The moon drifts down/right and fades as the sun overtakes it. | rays |
| 3 | 1.4–1.7 | Ring of ≈ 70 thin spike rays around the sun | Rays grow outward from the disc rim (length 0 → ≈ 60–70 px), staggered around the circle | grass swap |
| 4 | 1.8–2.4 | Golden pointed-leaf grass rises behind the teal grass | Leaves pop up staggered (scaleY 0 → 1 from the base, ≈ 0.25 s each, random order across x) | bloom |
| 5 | 2.35–4.6 | **Fur bloom**: a brown seed disk appears and rings of cream/gold petal spikes sweep around it, growing to a full fur-ball | Ring 1 sweeps clockwise from 12 o'clock (2.45–2.85). Outer rings follow. Ball radius ≈ 70 → 380 px (ease-out). Centre rises from y ≈ 610 to 560. | features |
| 6 | 3.85–5.6 | Face features | Nose wedge emerges from the centre (3.85). Eye daisy rings and ears pop (4.1). White muzzle puffs (4.35). Closed-eye lines (4.6). Black nose and tear marks (4.85). **Eyes open** (≈ 5.0–5.15). Spots pop in random order (5.0–5.6). Whiskers draw on (≈ 5.5–6.0). | idle |
| 7 | 5.6–8.9 | Full frontal cheetah face in front of the sun | Idle: slow cat-blink ≈ 7.3–7.8 (lids half-close then close then open, 0.5 s). Subtle whisker/fur sway. | pull-back |
| 8 | 8.9–9.7 | **Pull-back plus head-turn** | The camera dollies out (head scale ≈ 1 → 0.3) while the head rotates frontal → 3/4 → profile. Heavy horizontal motion blur mid-move. Acacia silhouettes and hills fade in. | body |
| 9 | 9.7–10.7 | Profile cheetah walking in place, acacias and hills behind, sun backdrop | Walk cycle. Background static. | stretch |
| 10 | 10.7–12.0 | Play-bow stretch: front legs extended, rump and tail up | Pose ease-in 0.3 s, hold ≈ 0.8 s, release | walk |
| 11 | 12.0–13.4 | Walk, then lowers into a sprint crouch | | run |
| 12 | 13.4–19.0 | **Gallop** | Gallop cycle **0.5 s** (15 frames). Foreground grass speed ramps 0 → ≈ 3700 px/s between 13.4 and 15.0 (ease-in) with directional motion-blur streaks. Mid layers (hills, acacias) ≈ 600–1200 px/s. Sun fixed. Occasional foreground blades whip past. | decel |
| 13 | 19.0–20.2 | Decelerates | Grass speed 3700 → 0 over ≈ 1.1 s (ease-out). Gallop → trot → walk. | stand |
| 14 | 20.2–21.95 | Cheetah stands in profile, head raised | Idle breathing, tail flick | push-in |
| 15 | 21.95–22.65 | **Push-in plus head-turn to camera** (reverse of #8) | Scale up ≈ 3x with motion blur. Head rotates profile → frontal. Golden grass returns in the foreground. | face |
| 16 | 22.65–24.6 | Frontal face again (tighter, sun crops top) | Slight settle zoom, eye catch-lights glint | eye push |
| 17 | 24.6–25.55 | **Exponential push into the left eye** | Zoom ≈ 1 → 20x centred on the left eye (screen ≈ 390, 505). The iris fills the frame, then the pupil fills it. The crescent catch-light stays upper-right in the pupil. | **match-cut** |
| 18 | 25.55–26.1 | Black night (#0c1820) | The crescent moon fades and scales in at the catch-light's screen position (≈ 755, 215), 0.5 s ease-out. Stars fade in. | grass |
| 19 | 26.1–26.8 | Teal grass grows up from the bottom edge | Blades rise (scaleY from base) staggered, ≈ 0.7 s total | logo |
| 20 | 27.3–28.2 | Logo "anidoodle" writes on left to right | ≈ 0.9 s, near-linear progression. The final swash flourish completes last (28.15). | URL |
| 21 | 28.6–31.0 | URL appears under the logo (fast fade ≈ 0.1 s). Hold. | Stars twinkle, grass sways | end |

## Motion techniques

### 1. `sunrise-disc-rise`
**Looks like:** A huge flat orange disc with a radial gradient rises from behind the foreground grass, decelerating into place. Then a corona of thin spike rays grows around it.

**Elements:**
- A circle (r = 0.433 x H) with `radialGradient` (centre offset up 10%): #fb8346 → #f26e42.
- A grain-noise overlay clipped to the disc.
- Rays: N ≈ 70 isosceles triangles (base 8–10 px, length 55–75 px, randomised ±15%). Each starts at radius r + 4 px with angle i·360/N + jitter ±1.5°. Fill is a linear gradient along the ray, #c4573c → transparent/bg.

**Timing:**
- Rise lasts 1.5 s with `Easing.out(Easing.quad)`. The disc centre goes from y = H + r to y = 0.43 H.
- Rays start 1.05 s into the rise. Each ray grows (scaleY 0 → 1 from its base) over 0.25 s, staggered by angle so a wave runs around the ring in ≈ 0.3 s (or a random order).
- An existing moon element translates +40 px down and fades out over the rise.

**Props:** `color`, `radius`, `rayCount`, `rayLength`, `riseSec`, `finalY`.

### 2. `grass-blade-field` (+ `grass-grow-up`)
**Looks like:**
- Dense foreground of thin, tapered, slightly curved blades, teal with lighter tips, in 2–3 overlapping rows.
- A second variant uses fat pointed-oval golden leaves with a midrib line, in staggered rows (like scales).

**Procedural recipe:**
- For x in 0..W step 6–10 px (seeded jitter), create a blade:
  - height 120–300 px
  - base width 8–16 px
  - lean −12° to +12°
  - quadratic-curve path tapering to a point
  - fill = linear gradient from #253a43 (base) to #3f7f86 (tip) with opacity 0.7–1
- 3 depth rows: the back row is darker and shorter.
- Grain overlay.
- Golden leaves: ellipse-ish `path` (pointed both ends), 50 x 130 px, gradient #74461d → #b07a35. Rows offset by half a spacing.

**Animation:**
- Sway: `rotate = 2°·sin(2π(t/2.5) + x·0.01)` around the base.
- Grow-up: scaleY 0 → 1 from the base, per-blade random delay over 0.5–0.7 s, each 0.25 s `Easing.out(Easing.back(1.4))`.
- During the run, foreground blades become streaks (see #7).

**Props:** `density`, `heightRange`, `colors`, `swayAmp`, `seed`.

### 3. `radial-petal-bloom` (spike-fur build)
**Looks like:**
- A seed disk appears.
- Rings of narrow leaf/spike petals radiate from it, each ring appearing as a clockwise sweep starting at 12 o'clock.
- Rings are added outward until a dense, sunflower-like fur ball forms. Outer petals are golden; inner petals near the centre are cream/white.

**Elements:**
- Disk circle (#b9711f, r ≈ 70 px at full ball scale).
- K rings (≈ 6–9). Ring k has N_k petals (N₁ ≈ 36, increasing ≈ 6 per ring).
- Each petal is a pointed lens path, length 90–140 px and width 14–20 px, with a gradient from base (#c08938) to tip (#ecc67a, inner rings #f3ecd6). Petals have 1–2 shade variants for depth: one side darker by 15%.
- Petals overlap; later rings are drawn beneath earlier ones, or randomise z for a scruffy look.

**Timing (at full scale):**
- Disk pops 2.35 s, scale 0 → 1 over 0.15 s with back-out easing.
- Ring 1 sweep is 0.4 s for 360°: petal i appears at `delay = i/N · 0.4 s`. Each petal grows (scale 0 → 1 from its base, along its radial direction) over 0.2 s with `out(back(1.6))`.
- Following rings start every ≈ 0.12 s, so they overlap.
- The whole group's scale grows ≈ 0.18 → 1 over 2.0 s (`out(cubic)`), and the group centre moves up 50 px.
- Tiny random rotation jitter ±4° per petal. Optional slight spiral offset per ring (golden angle 137.5° start offset) for a phyllotaxis look.

**Implementation:** Precompute `petals[]` with ring, angle, len, colour and delay from a seeded RNG. Each renders as `<path transform="rotate(a) translate(r0) scale(s(t))">`.

**Props:** `rings`, `petalsPerRing`, `palette`, `sweepSec`, `ringStagger`, `seed`.

### 4. `spike-fur-face-assembly`
**Looks like:** Facial features assemble on top of the bloom in a staged sequence. Every feature is itself made of radial spikes.

**Layers and order (offset from bloom start, at 1.0x)**
- **+1.5 s, nose bridge:** a narrow vertical fan of cream spikes, growing up from the centre (scaleY 0 → 1, 0.3 s).
- **+1.75 s, ears:**
  - Two dark circles (#120c08) at ±250 px, −270 px from the face centre, popping from tiny dots to full size (0.3 s, back-out).
  - Inner cream disk with fine radial white spikes.
  - Outer rim of gold spikes.
- **+1.75 s, eye surrounds:** two "daisies" of ≈ 40 white spikes (#f3efe4) around each eye position (±150 px, −60 px). Same sweep-bloom as #3 but faster (0.25 s).
- **+2.0 s, muzzle:** two white spike puffs below the nose with black whisker-dot rows (3 rows x 3–4 dots, r 3 px).
- **+2.25 s, closed eyes:** two thin arcs (stroke 5 px #060a0e).
- **+2.5 s, black nose and tear marks:**
  - Nose: rounded triangle #180d0a, scale pop.
  - Tear lines: tapered black bands from the inner eye corners to the mouth corners, drawn top-to-bottom via `stroke-dashoffset` over 0.25 s.
  - Mouth: "w" stroke.
- **+2.65 s, eyes open:** almond lids. The upper and lower lid paths interpolate from closed (flat line) to open over 0.15 s with ease-out. Iris = radial-streak gradient (orange), pupil black circle, catch-light crescent.
- **+2.65–3.25 s, spots:**
  - ≈ 180 black dots (r 7–11 px) on a jittered polar grid over the fur ball, excluding the eye/muzzle masks.
  - Each pops scale 0 → 1.15 → 1 (0.12 s) with random delay in a 0.6 s window, biased centre-out.
- **+3.2 s, whiskers:** 6–8 thin white lines (1.5 px, 300–400 px long, slight curve) per side, drawn from the muzzle outward via dashoffset over 0.4 s.

**Idle (slow blink):** lids close to 30% over 0.15 s, hold 0.1 s, close fully, then reopen over 0.2 s (total ≈ 0.5 s). Catch-light glint pulse.

**Props:** `eyeColor`, `furPalette`, `spotCount`, `blinkTimes[]`.

### 5. `turn-and-dolly-reveal` (face ↔ profile body)
**Looks like:** One continuous camera move. The frontal close-up pulls back while the head swivels to profile, revealing the side-on full body in a wider landscape. It is used in both directions.

**Measured:**
- Out: 8.9 → 9.7 s (0.8 s).
- In: 21.95 → 22.65 s (0.7 s).
- Ease-in-out with peak speed mid-way. Strong horizontal motion blur at peak (≈ 30–60 px).
- Scale change ≈ 3–3.5x (head width ≈ 850 px frontal vs ≈ 250 px profile).

**Implementation (2D cheat that matches the look):**
1. Have two rigs: `FaceFront` and `BodyProfile`.
2. Over the move, animate a camera scale `S(t)` from 1 → 0.3 (or the reverse), with the transform origin at the head.
3. Crossfade the rigs during the middle 40% of the move (opacity ramps 0.25 s), where blur is highest.
4. Insert an intermediate 3/4 head drawing if available; it is visible for 2–3 frames.
5. Add motion blur by rendering 6–8 sub-frame samples (`@remotion/motion-blur` `<CameraMotionBlur samples={8} shutterAngle={270}>`) or by applying `feGaussianBlur stdDeviation="20 0"` scaled to velocity.
6. Background elements (acacias, hills) fade in over the same window. The sun stays fixed (the far layer barely changes).

**Props:** `fromScene`, `toScene`, `durSec`, `scaleRatio`, `blurMax`.

### 6. `quadruped-gait-cycle` (walk / stretch / gallop)
- The body profile is a puppet:
  - torso
  - neck/head
  - 4 legs with 3 segments each (upper, lower, paw)
  - tail as a 6–8 joint chain (spring-follow)
- **Walk:** ≈ 1.0 s cycle (lateral sequence LH, LF, RH, RF at 25% phase offsets). Shoulder and hip swing ±18°. Body bob 6 px.
- **Gallop:** **0.5 s cycle** (measured). Rotary gallop with phases: gathered (all legs under) → extended (front reaching, hind pushing). Spine flexes ±12° (torso split into two segments). Head stays level (stabilised). Tail streams back with spring lag.
- **Play-bow stretch:**
  - Front legs slide forward 120 px and the chest lowers 80 px over 0.35 s (ease-in-out).
  - Hold 0.8 s with the tail curled upward into an S.
  - Return 0.3 s.
- Use motion blur on the legs during the gallop.

**Props:** `gait` (walk | trot | gallop), `cycleSec`, `poses`.

### 7. `parallax-speed-run`
**Looks like:** The subject stays centred and galloping while the world rushes past. Foreground grass smears into horizontal streaks, mid-ground acacias whip by, hills slide slower, and the sun stays fixed.

**Layers and speeds (at peak):**

| Layer | Speed |
|---|---|
| Foreground grass | ≈ 3700 px/s (3.4 frame widths/s) |
| Acacia mid layer | ≈ 1200 px/s |
| Hill silhouettes | ≈ 600 px/s |
| Sun | 0 |

Ramp-up 1.6 s with ease-in (13.4 → 15.0). Ramp-down 1.1 s with ease-out (19.0 → 20.1).

**Streak effect:**
- Replace the foreground with a blurred copy, `feGaussianBlur stdDeviation="v*0.012, 0"` (≈ 45 px at peak).
- Add 20–30 thin horizontal light streaks (#3f7f86 at 40%, length 200–600 px) moving at 1.2x foreground speed.
- Occasionally a single tall dark blade or trunk whizzes across the frame in 2–3 frames.

**Implementation:** Tile each layer seamlessly (width ≥ 2W). Position = `-(∫v dt · factor) mod tileWidth`.

**Props:** `peakSpeed`, `layerFactors[]`, `rampIn`, `rampOut`, `blurScale`.

### 8. `eye-zoom-match-cut`
**Looks like:**
1. The camera accelerates into the cheetah's eye.
2. The orange iris and then the black pupil fill the screen.
3. The crescent catch-light in the pupil becomes the crescent moon in a black night sky (match-cut).

**Timing:**
- Push 24.6 → 25.55 s (0.95 s) with **exponential/expo-in** zoom. Scale ≈ 1, 1.15, 1.5, 2.5, 5, 9, 15+ at 0.1 s steps over the last 0.6 s.
- Interpolate `log(scale)` with ease-in, centred on the eye.
- Blur on the fur at high zoom: fur spikes become soft (raster upscaling look). Fine to add a radial zoom blur.
- At pupil fill (all ≈ #060a0e), cut to the night background #0c1820.
- The moon element is placed at the catch-light's last screen position. It fades from 0 → 1 while scaling 0.6 → 1 over 0.5 s (ease-out).
- Stars fade in with random delays over 0.8 s.

**Implementation:** `scale = exp(interpolate(t,[t0,t1],[0, ln(20)],{easing:Easing.in(Easing.cubic)}))`, `transform-origin` = eye centre. Track the catch-light: `screenPos = origin + (p − origin)·scale`. Then pin the moon to that position.

**Props:** `target` (point), `maxScale`, `durSec`, `matchElement`.

### 9. `script-logo-write-on`
**Looks like:** A calligraphic wordmark draws itself left to right as if by pen, ending with the swash underline loop. A bold sans URL then snaps in below.

**Timing:** write 27.3 → 28.2 s (≈ 0.9 s), near-linear (`Easing.inOut(Easing.sin)` acceptable). The swash finishes last. The URL appears at 28.6 s (≈ 3 frames fade). Hold ≈ 2.4 s.

**Implementation, choose one:**
- (a) **Preferred:** a single-line centreline "pen path" of the script (hand-authored or traced) used as a mask stroke. Width ≈ 1.3x the max stroke weight. `stroke-dasharray = L`, `stroke-dashoffset = L·(1−p)`. Mask the filled outline glyphs with it, so true thick/thin contrast survives.
- (b) A rectangular reveal mask sweeping x from 150 → 930 with a 40 px soft edge, plus a separate dashoffset for the swash hairline. Less authentic but simpler.

**Props:** `text` or `svgPath`, `font`, `color` (#fdf3db), `durSec`, `subtitle`, `subtitleDelay`.

### 10. `starfield-moon-night`
- **Background:** #0c1820.
- **Stars:** ≈ 80 dots, r 1–2.5 px, colour #fdf3db at 0.3–0.9 opacity. Twinkle opacity ±0.3 with random phases (period 1.5–3 s).
- **Crescent moon:** difference of two circles (r 38 px; inner offset (+16, −10) px), fill #fdf3db with fine grain speckle.
- **Sky gradient:** a very subtle vertical darkening toward the top.

**Props:** `starCount`, `moonPos`, `moonPhase`, `seed`.

### 11. `grain-speckle-overlay`
- Dense fine speckle (1 px dots, ≈ 5–8% coverage) that darkens orange areas and lightens dark ones, giving a risograph/print texture.
- `feTurbulence baseFrequency 1.2` → `feColorMatrix` threshold → blend `multiply` (darks) + `screen` (lights) at 15%.
- It is static (no boil) in this video.

## Transitions
| Time | Transition |
|---|---|
| 0–1.85 | Night to day via `sunrise-disc-rise` (no cut) |
| 8.9–9.7 | Face → body: `turn-and-dolly-reveal`, camera pull-back + head-turn + motion blur + rig crossfade |
| 21.95–22.65 | Body → face: the same move reversed (push-in) |
| 24.6–25.55 | `eye-zoom-match-cut`: exponential push, pupil fills frame, cut to night with moon at the catch-light position |
| 26.1–28.6 | End card builds in place: grass grow, logo write-on, URL fade |

There are no crossfades between scenes. Every change is a camera move or a match-cut.

## Camera
- **0–8.9 s:** locked off (static, centred).
- **8.9–9.7:** dolly out ≈ 3.3x with head-turn (ease-in-out).
- **9.7–21.95:** locked frame on the profile cheetah. Motion is faked by layer scrolling:
  - 4 depth layers: sun 0x, hills ≈ 0.16x, acacias ≈ 0.32x, foreground grass 1.0x (relative to a 3700 px/s peak).
  - The cheetah stays at a fixed screen x (centre).
- **21.95–22.65:** dolly in ≈ 3x with head-turn.
- **24.6–25.55:** exponential zoom ×20 into the left eye.
- **25.55–31:** static end card.

## Library candidates
- `sunrise-disc-rise`: a hero backdrop entrance (sun, planet, spotlight disc) with a ray corona; good for openers.
- `grass-blade-field`: procedural foreground vegetation with sway and grow-up for nature scenes and end cards.
- `radial-petal-bloom`: organic "sprouting" construction of any radial emblem, flower, logo mark or mascot.
- `spike-fur-face-assembly`: a staged feature-by-feature build of a symmetric character face or icon.
- `turn-and-dolly-reveal`: a camera pull-back with subject rotation to go from a close-up to a wide establishing shot.
- `quadruped-gait-cycle`: walk, stretch and gallop puppet cycles for animal mascots.
- `parallax-speed-run`: a high-speed motion feel with layered parallax and streak blur behind a centred subject.
- `eye-zoom-match-cut`: an exponential zoom through a detail that match-cuts to a new scene (pupil to sky, lens to world).
- `script-logo-write-on`: a calligraphic signature or brand wordmark reveal with a URL or subtitle follow-up.
- `starfield-moon-night`: a calm night-sky end-card backdrop with twinkling stars and a crescent moon.
- `grain-speckle-overlay`: a print/riso texture unifying flat vector art.
