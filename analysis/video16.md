# video16 — "Father & Son: A Lifetime" (AI-generated painterly animated short)

## Overview

| Property | Value |
|---|---|
| Resolution | 1920 × 1080 |
| FPS | 30 (2706 frames) |
| Duration | 90.26 s |
| Audio | none in file |

**Story.** A wordless short about a father's life with his son.
- A newborn's hand grips the young father's finger in a sunlit hospital; the father weeps and holds the baby.
- Years pass in the same house: TV nights, a toddler walking in, hugs and kisses, the son grows up and leaves through the front door with a backpack, and the father (now older, then elderly with glasses) waves him off.
- The old man waits alone at night by the bay window in the rain (clock, covered dinner plate, headlights that are not his son's car).
- The son returns, they share a dinner, and later the son runs home through the rain. He arrives to find doctors covering his father with a sheet, and kneels in the open doorway.
- Hard cut to black.

**Art style.** AI-generated, video-model character animation in a painterly 2.5D "Arcane / Spider-Verse"-like look. Brushy textures on skin, cel-like shapes with soft cinematic lighting, strong motivated light (window sun, TV glow, table lamp, street lamps), and rain. **The character animation itself is not procedural**, so a Remotion rebuild must use pre-rendered or generated plates. This document therefore focuses on the reproducible layer: edit rhythm, transitions, camera moves on plates, light/weather overlays and colour grading.

**Palette by act (dominant colours, median-cut on full frames):**

| Act / look | Hex |
|---|---|
| Hospital morning (warm skin + teal room + cream window) | `#894B48`, `#9D5D5C`, `#C8BEB1`, `#8F8B83`, `#AAAB9E`, `#DBD3C5` |
| White-out flash | `#FFFFFF` → `#E8E8E8` |
| Night TV room (cold blue + amber lamp) | `#06080D`, `#110F12`, `#1D1C23`, `#383542`, `#867573` |
| Night interior blue | `#040C22`, `#24263D`, `#6D5353` |
| Sunny day hallway / front door | `#E0DDC5`, `#C3B095`, `#9E5852`, `#281F1E` |
| Rainy night exterior | `#091421`, `#131E2D`, `#0E1927`, `#060D16` |
| Warm lamp interior | `#6F4529`, `#9F8766`, `#C6B291` |
| Kitchen dinner (amber) | `#AD8C64`, `#624D3E`, `#211A17` |
| Street-lamp sodium glow | ~`#E27A4A` cone on `#1A2230` |
| Accent red door | ~`#B8323A` |

**Fonts.** None (no on-screen text).

## Timeline

Cuts were found by scene detection (threshold 0.3) plus luma tracking. Shot lengths are mostly 1.0–2.5 s, typical of a music-video-paced emotional montage.

| Start–End (s) | Shot | Motion | Out |
|---|---|---|---|
| 0.00–1.33 | Baby hand opens from fist above white blanket, sunlit teal hospital | Fingers open; slight push | Cut |
| 1.33–5.43 | Father's finger enters, baby grips it; camera tilts up to the father's tearful face | Tilt up ~60 px/s (3.4–4.6 s, ease-in-out), slow push 0.6 %/s | Cut |
| 5.43–6.77 | Nurse hands the swaddled baby to the father (medium shot) | Locked-off | Cut |
| 6.77–7.93 | Baby close-up (sleeping) | Static | Cut |
| 7.93–14.80 | Father kisses and hugs the baby (several angles: 9.23, 11.1, 12.47, 13.83 cuts) | Slow pull-backs −1 to −3 %/s | 13.83: silhouette in a bright window |
| 13.83–14.80 | Silhouette of father with baby against a blown-out window, curtains | Push-in 6 %/s | `bloom-whiteout` 14.70–15.50 |
| 15.50–17.30 | Night TV room: father on the floor by the couch, TV glow | Fade up from white (luma 232 → 48 by 16.2 s); pull-back −5 %/s plus pan | Cut |
| 17.30–19.27 | Low angle behind the couch; a toddler's legs walk in | Locked-off | Cut |
| 19.27–29.40 | Father and child moments (couch, hug, kiss, laughing child, fist bump); cuts at 20.5, 22.13, 23.47, 25.1, 26.6, 27.73, 28.83 | Gentle pushes 1.5–3 %/s; handheld drift | 28.83: backs of father + child watching TV |
| 28.83–30.07 | Silhouettes in front of a glowing TV | TV glow intensifies with god-rays | `glow-burnout-cut` 29.4–30.07 |
| 30.07–32.47 | Hallway, morning: the front door opens, sun floods in, teenage son silhouetted with bag; anamorphic flare | `door-light-flood` + `anamorphic-flare` | Cut |
| 32.47–36.13 | Feet with backpack at the door; son in hoodie at the door (34.17) | Static / slow push 3 %/s | Cut |
| 36.13–40.0 | Older father drying dishes (36.13), plates close-up (37.13), father in hallway opens arms (38.37) | Static | Cut |
| 40.0–44.6 | Goodbye hug-kiss, hands parting (41.2), son walks out (41.8), father's wistful face (43.13) | Push 4.7 %/s on the face | `grade-to-night` 44.6–46.0 |
| 46.0–52.2 | Exterior bay window at night: old man alone in an armchair, rain (47.87 glasses close-up with drops; 49.13 window POV; 50.1 wall clock; 51.2 covered dinner plate) | Locked-off; rain overlay | Cut |
| 52.2–54.5 | Bay window exterior again | `lightning-relight` 52.72–53.2 | Cut |
| 54.5–56.5 | Elderly man in armchair (static) | Lamp flicker | Cut |
| 56.5–57.63 | Rain-streaked window; car headlights sweep across, car passes | `headlight-sweep` | Cut |
| 57.63–60.5 | Glasses close-up, eyes open; old man leans forward (58.4) | — | Dark door |
| 59.7–62.8 | Dark door; it opens: the son in the rain with a dark coat | `door-reveal` from black | Cut |
| 62.8–66.0 | Father's joy, grabs son's arm, they walk down the hall | — | Cut |
| 65.8–74.2 | Kitchen dinner under a warm pendant lamp, steam; son eats; father watches (cuts 67.1, 69.43, 71.07, 72.7) | Steam wisps; push 2 %/s | 72.7: glasses close-up |
| 72.7–76.0 | Glasses close-up | `superimpose-dissolve` 74.2–75.9 into rainy street | — |
| 75.9–80.1 | Son running down a rainy street under sodium lamps (76.87 close-up crying; 79.2 sneaker splash in puddle) | Rain, light cones | Cut |
| 80.1–81.2 | House exterior at night | `lightning-relight` 80.72–81.1 | Cut |
| 81.2–83.4 | Dark door opens → son in doorway, shocked | `door-reveal` | Cut |
| 83.4–85.4 | Living room: three doctors around the father in the armchair; sheet pulled over his face (84.37) | Static, symmetric | Cut |
| 85.4–87.6 | Son's face close-up (rain), hands at sides (86.6) | Push 4.9 %/s | Cut |
| 87.6–89.70 | Wide back silhouette: son kneeling in the doorway, rain outside | Static | Hard cut to black |
| 89.70–90.26 | Black `#030303` | — | End |

## Motion techniques

These are the reusable, non-character pieces. Everything below can be done with still or generated plates in Remotion.

### `bloom-whiteout`
**Looks like:** a backlit window shot overexposes. Highlights bloom and expand, then the whole frame goes to white, holds, and the next scene fades up out of a milky white haze (like eyes adjusting).

**Measured (frame luma, 0–255):** 14.70 → 171, 14.80 → 196, 14.90 → 221, 15.00–15.40 → 232 (hold 0.4 s), 15.50 → 205, 15.60 → 157, 15.70 → 131, 15.80 → 95, 15.90 → 77, 16.00 → 65, 16.10 → 52, 16.20 → 48.
- Ramp up 0.3 s (`easeInQuad`).
- Hold 0.4 s.
- Fade-down 0.7 s (`easeOutCubic`); during the fade-down the incoming shot is milky (lifted blacks: white overlay at decreasing opacity, plus a blur of 12 px → 0).

**Recipe:** outgoing layer gets `filter: brightness(1 + 2p) blur(4p px)` plus a white overlay `opacity = easeInQuad(p)`. Incoming layer has a white overlay `opacity = 1 − easeOutCubic(q)` and `filter: blur((1−q)·12px) contrast(0.7 + 0.3q)`.

**Props:** `rampIn=0.3`, `hold=0.4`, `rampOut=0.7`, `color='#FFFFFF'`.

### `glow-burnout-cut`
**Looks like:** a light source in frame (CRT TV) intensifies, throwing god-rays and halation around the silhouettes, until the frame burns to white. Then a hard cut lands on a different, normally exposed scene (no fade back).

**Measured:** 29.40 luma 62 → 29.50 77 → 29.60 115 → 29.70 173 → 29.80 232, hold to 30.0, then a hard cut at 30.07 to luma 54. Ramp 0.4 s, hold 0.25 s.

**Recipe:**
- Additive radial glow centred on the light (radial gradient white → transparent, radius growing 300 → 2000 px).
- Volumetric rays: 24 thin white wedges from the light centre, opacity 0.15, rotated slowly.
- Global white overlay `easeInExpo`.

**Props:** `lightPos`, `rampDuration`, `rayCount`, `holdFrames`.

### `grade-to-night` (in-shot day→night relight)
**Looks like:** within one held close-up, the warm daylight grade slowly turns into a cold dark blue night grade (the time-passing beat), then cuts to a night exterior.

**Measured:** luma 122 → 44 between 44.6 and 46.0 s (≈1.4 s, near-linear with an ease-out tail). Hue shifts warm → teal-blue.

**Recipe:** overlay a `#0C1A2E` multiply layer with opacity 0 → 0.75 and a `#2A4060` screen layer at 0.1. Alternatively, crossfade between a day plate and a pre-graded night plate. Add `saturate(1 → 0.7)`.

**Props:** `fromGrade`, `toGrade`, `duration`.

### `lightning-relight`
**Looks like:** a dark rainy night exterior is suddenly fully lit (lightning): flat bright exposure with a pink/magenta storm sky. It holds 2–5 frames, then decays back to night through an intermediate half-lit frame.

**Measured:**
- 80.72–81.10: 2 frames full bright (luma 135), then 131 → 100 → 69 → 43 over 0.3 s (exponential decay, τ ≈ 0.1 s).
- 52.72–53.20: bright for ~0.45 s (luma 112 → 140 → 122 → 121 → 87 → 44).

**Recipe:** two plates of the same composition (night and lit). Compute `lit = flashEnvelope(t)` where the envelope = 1 for N frames, then `exp(−(t−t1)/0.1)`, and apply `opacity` of the lit plate. Optional double-strike: a second flash 3 frames later at 0.6 intensity. Also add a white overlay at `0.15 × lit` for the frame of the strike.

**Props:** `strikeTimes[]`, `holdFrames`, `decay`, `litPlate`, `nightPlate`.

### `headlight-sweep`
**Looks like:** through a rain-streaked window at night, a bright cone of headlight beams grows from the left edge, sweeps right, and blows out a horizontal band of the frame. Then the car body passes left→right, the beams leave, and red tail-lights trail.

**Measured:** 56.50–57.60 s. The beam brightens 0 → peak in 0.4 s and travels ~1400 px across the frame in ~0.8 s. Beam shape is a horizontal wedge (apex at the headlight, 20° spread) with soft falloff.

**Recipe:**
- Beam: an SVG polygon wedge with a linear gradient (white 90 % → 0) plus a blur of 30 px, blend `screen`, apex moving along x.
- Two bright headlight blobs (radial gradient `#FFFFFF` → `#BFE6FF` → 0, r 60 px).
- Rain streaks over the glass, lit only inside the beam via a mask.

**Props:** `direction`, `duration`, `beamSpread`, `color`.

### `anamorphic-flare`
**Looks like:** when a bright door opening appears behind a figure, a thin horizontal blue lens streak spans the frame at the light's height, flickering as the figure occludes the light.

**Measured:** 30.8–31.9 s. The streak is ~1 px core plus 8 px soft glow, colour `#7FA8FF` at 50 %, horizontal across 80 % of the width, centred on the doorway light. Intensity tracks the light visibility (drops when the figure blocks it).

**Recipe:** a horizontal ellipse with a linear gradient fading to the ends (rx 800, ry 3), blur 4 px, `screen` blend. Its opacity is driven by the light-source brightness. Add 2 small ghost discs mirrored through the frame centre.

**Props:** `y`, `color`, `length`, `intensity(t)`.

### `door-light-flood`
**Looks like:** a front door opens at the end of a corridor and sunlight floods down the hallway floor. A bright trapezoid of light stretches toward camera with a long cast shadow of the figure; the doorway itself blooms.

**Recipe:** a floor light trapezoid (perspective quad, warm `#FFE6B8` at 60 %, `screen`) that scales along the floor with the door-opening angle; the shadow is a dark quad skewed from the figure's feet. The doorway is a bloom (radial white).

**Props:** `doorRect`, `floorVanishing`, `openDuration`, `lightColor`.

### `door-reveal`
**Looks like:** the frame is almost black (a closed door, luma ~30) and the door swings open, revealing a lit/rainy exterior with a figure. This is the scene's "transition from black". The opening takes ~0.5 s.

**Measured:** 59.7–60.5 (luma 27 → 33 → 47 → 56 over ~1.5 s) and 81.2–81.9.

**Recipe:** door plate (dark) with a 3D `rotateY` 0 → −80° about the hinge edge (CSS perspective 1200 px) revealing the plate behind. Interior light spill grows with the angle.

### `superimpose-dissolve`
**Looks like:** a long double-exposure crossfade. A close-up face (glasses) stays semi-visible over the next shot (a wide rainy street with a tiny running figure and sodium lamps), creating a "memory/thought" link. The face lingers.

**Measured:** 74.2–75.9 s (≈1.7 s). Overall luma 104 → 52. The outgoing opacity curve is roughly linear 1 → 0 while the incoming is 0 → 1; at the midpoint both are ~50 % (additive-ish: blend `screen` on the bright lamp regions).

**Recipe:** `<AbsoluteFill style={{opacity: 1-p}}>` over `<AbsoluteFill style={{opacity: p}}>` with linear p over 51 frames. Optionally blend the outgoing layer with `screen` for a luminous double exposure.

**Props:** `duration`, `blend ('normal'|'screen')`.

### `rain-overlay`
**Looks like:** diagonal fine rain streaks over night shots (exteriors, window POV, doorway). Thin light-grey lines 1–2 px wide, 30–120 px long, slight angle (~8° from vertical), varying opacity 10–40 %, plus occasional brighter drops near light sources. On glass shots: static droplets with refraction highlights and slow downward trickles.

**Recipe:**
- 3 parallax layers (near / mid / far): counts 150 / 300 / 600, speeds 2600 / 1800 / 1200 px/s, lengths 120 / 70 / 35 px, opacity 0.35 / 0.22 / 0.12.
- Seeded positions wrap vertically: `y = (y0 + v·t) % (H + len)`.
- Streaks are lit only inside light-source masks (street-lamp cones) for realism.
- Glass droplets: 40 small ellipses with a white specular dot; trickles move down at 20–60 px/s along a wobbly path.

**Props:** `density`, `angle`, `speed`, `layers`, `glassDrops`, `tint`.

### `light-cone-volumetric`
**Looks like:** sodium street-lamps cast orange triangular cones of light through the rain, with puddle reflections on wet asphalt beneath (vertical streak reflections).

**Recipe:**
- Cone: a triangle with a vertical linear gradient `#F0904F` at 55 % → 0, blur 12 px, `screen` blend.
- Reflection: vertically stretched blurred copy of the lamp (scaleY 4, opacity 0.4) on the road.
- Rain streaks intersecting the cone get +30 % opacity.

**Props:** `lamps[{x,y,angle,color}]`, `reflection`.

### `slow-push-ken-burns` (camera on plates)
**Looks like:** nearly every held shot has a subtle push-in or pull-back. Emotional close-ups push in faster.

**Measured rates (scale change per second):**
- Ambient: 0.6–2 % (e.g. 2–4 s: +0.65 %/s; 20 s: +1.6 %/s; 72–76 s: +2 %/s).
- Emotional push: +3 to +5 %/s (34 s: +3.2; 44 s: +4.65; 86 s: +4.9).
- Pull-backs: −1 to −5 %/s (10–12 s: −3; 16 s: −5 with a +50 px/s pan).
- Tilt: 1.3–4.6 s moves up ~60 px/s with ease-in-out.

**Recipe:** `scale = 1 + rate · t` (linear) or `interpolate(f, [0, N], [1, 1+rate·T], {easing: Easing.inOut(Easing.sin)})`. Translate toward the subject's eyes. Add 1–2 px handheld noise: `x += noise1D(t·0.7)·2, y += noise1D(t·0.6+9)·2`.

**Props:** `rate`, `focus {x,y}`, `pan {dx,dy}`, `handheld`.

### `steam-wisps`
**Looks like:** soft white steam rising from hot dishes in the kitchen scene (66–72 s), curling and fading.

**Recipe:** 6–10 blurred white bezier ribbons (stroke 20–40 px, blur 12 px, opacity 0.15–0.3) whose control points follow curl noise upward at 40 px/s, fading out over 2 s and respawning.

**Props:** `sources[]`, `count`, `riseSpeed`, `opacity`.

## Transitions

| Time (s) | Type | Duration | Notes |
|---|---|---|---|
| most | Hard cut | — | ~55 cuts; average shot 1.6 s |
| 14.70–16.20 | `bloom-whiteout` → fade up from white | 1.5 s total | Time-skip (baby → toddler years) |
| 29.40–30.07 | `glow-burnout-cut` | 0.67 s | Time-skip (child → teen leaving) |
| 44.60–46.00 | `grade-to-night` then cut | 1.4 s | Time-skip (son gone, father ages) |
| 52.72, 80.72 | `lightning-relight` | 0.3–0.5 s | Dramatic punctuation |
| 59.7, 81.2 | `door-reveal` from near-black | ~0.6 s | Arrival beats |
| 74.20–75.90 | `superimpose-dissolve` (face → rainy street) | 1.7 s | Memory/causal link |
| 89.70 | Hard cut to black | — | Ending |

**Pattern:** the "light transitions" (whiteouts and glows) mark time jumps between life stages; hard cuts are used within a stage.

## Camera

- Single virtual lens per shot, mostly locked-off or slow push/pull (0.5–5 %/s), occasional tilt-up reveals (60 px/s) and small lateral pans (15–50 px/s).
- No whip pans, no fast zooms.
- Depth: plates behave like 2.5D (character over background with slight parallax in the generated footage). For a rebuild, use 3 layers: background (0.6× move), character (1×), foreground/rain (1.3×). Push-ins scale layers by `1 + rate·t·depthFactor` for parallax.

## Library candidates

- `bloom-whiteout`: emotional time-skip transition through overexposure.
- `glow-burnout-cut`: a light source in frame burns to white, then hard cut (dramatic scene change).
- `grade-to-night`: in-shot day→night or mood-shift colour grade animation.
- `lightning-relight`: storm flash relighting a night scene from two plates.
- `headlight-sweep`: passing car light beam across a window or scene.
- `anamorphic-flare`: horizontal cinematic lens streak tied to a bright source.
- `door-light-flood`: doorway light spilling across the floor with a cast shadow.
- `door-reveal`: transition out of black by opening a door onto the next scene.
- `superimpose-dissolve`: long double-exposure crossfade for memories and thoughts.
- `rain-overlay`: parallax rain streaks plus glass droplets for night or moody shots.
- `light-cone-volumetric`: street-lamp or spotlight cones with wet reflections.
- `slow-push-ken-burns`: cinematic push/pull/tilt with handheld noise on still or AI plates.
- `steam-wisps`: rising steam or smoke for food, coffee and warmth shots.
