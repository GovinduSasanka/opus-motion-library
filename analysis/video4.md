# video4 — "Listening" sonar montage (opus 5.5 / claude)

## Overview

| | |
|---|---|
| Resolution / fps | 1920×1080, 24 fps, 28.05 s (672 frames). Has an audio track, but the analysis ignores it. |
| Theme / story | A small blue sphere ("the listener") sits at the centre of a sheet of paper and sends out sonar pings. Each echo that comes back opens a circular window onto a sound-making scene. The scenes grow into a montage of 40+ scenes whose cuts get faster and faster. The montage collapses into a disc of thumbnails, which empties out. A second, pink sphere answers the ping; the two spheres "talk", a lotus blooms between them, and the frame becomes a field of countless blue+pink pairs. It ends on the hand-written title "opus 5.5 / claude". |
| Art style | Two worlds. (1) **Paper UI world**: warm off-white paper with grain and a strong vignette, thin vector ring strokes, and glossy 3D-ish spheres with soft lavender drop shadows. (2) **Scene world**: stylised low-poly / flat-shaded 3D illustration (Pixar-short look: soft gradients, haze, god-rays, dusk palettes). The scenes are pre-rendered stills with small loops; in a rebuild they are image/video assets. The motion library only needs to rebuild the paper world and the way scenes are framed and cut. |
| Palette | Paper centre `#ECE4D7`, paper edge/vignette `#BEB8AF` (mid-edge `#D1CCC0`), grain ±6 lum. Listener blue sphere base `#3780E7`, highlight `#ABCFFF`, core shadow `#2B4681`. Sonar ring stroke `#3383CB`. Partner pink sphere / pink rings `#E546AA` (shade `#922568`). Sphere drop shadow lavender ≈ `#C9BFD0` @ 60 %. Title text `#2B74C5` (inner dark `#001B53`, pink rim light). Thumbnail-disc plate: soft yellow `#F6DEA2`→`#EADEAE` with radial falloff. Night field: centre `#452F7A`, vignette corners `#19113E`; field dots cyan `#549BEA`, pink `#E54FC0`. Sparkle `#FFF6B0`. |
| Fonts | Title only: a **monoline rounded single-stroke hand-lettering** (similar to Quicksand Light, Comfortaa or a Hershey single-line font). Lower-case, normal tracking. The stroke looks like a glossy tube: base `#2B74C5`, a 2 px lighter highlight along the stroke centre, and a 1 px pink/magenta rim on the lower-right edge. "opus 5.5" spans 747 px wide (39 % W). Glyph height from the '5' top to baseline is ≈190 px (18 % H), centred at y≈340. "claude" is 345 px wide (18 % W), ascender to baseline 105 px (≈10 % H), at y≈700. |

## Timeline

| # | t (s) | On screen | Motion | Transition out |
|---|---|---|---|---|
| 1 | 0.00–2.00 | Paper, blue dot at frame centre (960,540) | `sonar-ping-rings` ×3 (0.00/0.17/0.33). The rings fragment into dashes at the edges. `echo-arcs-return` comes from the lower right (0.67–1.46). `sonar-window-pop` shows a koi pond (1.46–1.98). | Window shrinks back into the dot |
| 2 | 2.00–4.00 | Paper | Ping cycle 2. The echo comes from above (2.50–2.71). Cricket-on-moon window 2.75–3.21, plus `sound-tick-marks`. Jellyfish window 3.25–3.98, popping on the right. | Window shrinks into the dot |
| 3 | 4.00–4.46 | Paper | Ping cycle 3. The echo comes from the lower right. | `iris-reveal-from-dot` 4.46→4.58 |
| 4 | 4.50–6.00 | Full-frame scenes: owl (4.5), temple bell with faint white sound rings (5.0), lighthouse (5.5). The blue dot stays at the centre on top. | Slow push-in inside each scene | Each one irises in from the centre over the previous scene; at 6.0, a hard cut to paper |
| 5 | 6.00–6.50 | Paper | Ping cycle 4. The echo comes from the upper right. | Iris to the wolf/aurora scene (6.46) |
| 6 | 6.50–8.00 | Wolf (6.5–7.0), then hard cuts every 0.25 s: phone, turntable, frogs, bats | `accelerating-montage` (0.5 s → 0.25 s) | Hard cut |
| 7 | 8.00–8.20 | Paper, mini ping (2 rings) | | Cut |
| 8 | 8.20–9.95 | 0.25 s cuts: bicycle, cat at a bokeh window, kettle, radio, fairground, fireworks, piano | | Cut to paper ping at 9.95 |
| 9 | 9.95–10.20 | Paper, ping | | Cut |
| 10 | 10.20–12.00 | 0.25 s cuts: whale, balloons, city, desert, Saturn, campfire, storm | | Cut |
| 11 | 12.00–16.00 | **0.125 s (3-frame) cuts** of 32 scenes, all reprising the earlier ones. A light overlay of white double rings (`sonar-ring-overlay`) pulses over the scenes. | Rings pulse outward | Hard cut at 16.0 |
| 12 | 16.00–17.00 | `thumbnail-disc-collapse`: every scene as a circular thumbnail in concentric rings on a yellow glowing elliptical plate. A thick pink outer ring expands and dashes. | Pink ring expands and fades; plate glow fades 16.8–17.0 | → |
| 13 | 16.98–17.75 | The same thumbnails go blue duotone (`duotone-recolor`), then shrink to nothing one after another (`staggered-pop-out`) until only the blue dot is left (17.7) | | → |
| 14 | 17.75–19.70 | Paper. Pink rings arrive from off-screen at the lower left (18.0). The blue dot "receives" them with a small blue halo ring (18.4–18.6) and pings back with elliptical rings (19.07), as the camera starts to tilt. The pink sphere slides in from the lower left (19.6). | `dual-sphere-call-response` | Camera move |
| 15 | 19.70–20.50 | `paper-plane-tilt-camera`: the camera tilts from top-down (0°) to about 70° (low grazing view). The rings become flat ellipses and the dots read as 3D spheres. | | → |
| 16 | 20.50–22.95 | Perspective plane. Pink and blue alternate pings (pink 20.5, blue 20.8, pink 21.3, blue 21.65). At 21.98 a one-frame swap-colour halo flash. At 22.02 both ping together; `ring-intersection-sparkles` run along the overlapping rings; `lotus-bloom-pop` between them (22.10–22.35). The camera slowly pulls back. | | Hard cut 23.0 |
| 17 | 23.00–24.00 | `duotone-recolor` montage: earlier scenes recoloured pink/violet. Cuts every 0.125–0.17 s (koi, cricket, jellyfish, owl, bell, lighthouse, phone). Blue and pink dot overlaid near the centre. | | Hard cut 24.0 |
| 18 | 24.00–26.00 | `pair-field-zoom-out`: dark violet field with hundreds of cyan+pink dot pairs. Each pair pings small rings. The camera zooms out (≈2.5× over 2 s) from the hero pair. | | Hard cut 26.0 |
| 19 | 26.00–27.70 | Paper. The blue+pink sphere pair sits at centre (y≈540). "opus 5.5" is written on with `handwrite-stroke-on` (26.00–26.48). The pink sphere pings (26.77) and "claude" is written (26.77–27.10). | | Hard cut 27.75 to the bare blue dot (end card), until 28.05 |

## Motion techniques

### `sonar-ping-rings`
**Look:** a sphere emits 3 concentric stroke rings, 4 frames apart. Each ring grows fast and then slows down, thins as it grows, and breaks into dashes near the screen edge before it vanishes. The sphere briefly swells at each emission.

**Elements:** a `<circle>` per ring (`fill:none`, stroke `#3383CB`); the emitter sphere (see `glossy-sphere`).

**Measured** (from the dot centre, 1080p, frames after emission at 24 fps):

| frame | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| radius px | 156 | 280 | 392 | 490 | 578 | 654 | 720 |
| stroke px (ring 1) | 20 | 18 | 14 | 14 | 12 | 10 | 10 |

- Radius follows **easeOutQuad**, `r = R·(1−(1−u)²)`, with `u = t/T`, **T ≈ 0.54 s (13 f)** and **R ≈ 885 px (0.82 H)**. In practice the ring is gone by about u = 0.6 (720 px).
- Stroke width: `lerp(20, 4, u)` px. Later rings start thinner: ring 1 starts at 20 px, ring 2 at 14 px, ring 3 at 10 px, i.e. `strokeStart·0.7^i`.
- Spacing: **0.167 s (4 f)** between rings; 3 rings per ping.
- **Dash breakup:** once r > 0.6 H (≈650 px), set `stroke-dasharray` to irregular dashes (lengths 40–120 px, gaps 10–40 px, seeded per ring). Ramp the gap ratio from 0 to 0.5 as r goes 650→900. Opacity goes 1→0 over the last 25 % of life.
- **Emitter pulse:** the sphere radius goes 20→24→20 px over 3 frames at each emission (scale 1.2 peak).

**Remotion:** `const life = frame - emitFrame - i*4; const u = clamp(life/13); r = R*(1-(1-u)**2); strokeWidth = interpolate(u,[0,1],[w0*0.7**i, 2]); dash = r>0.6*H ? seededDash(i) : 'none'`.

**Props:** `center`, `color`, `ringCount=3`, `ringGapFrames=4`, `maxRadius`, `lifeFrames=13`, `startStroke=20`, `dashFromRadius`, `ellipseRatio` (1 when flat; <1 once the camera tilts, see `paper-plane-tilt-camera`).

### `echo-arcs-return`
**Look:** after the rings have gone out, 3 short concentric arcs fly back towards the sphere from one direction, like a reflected echo. They tell you where the next window will appear.

**Elements:** 3 `<path>` arcs centred on the dot, each spanning about 35–45° around a direction angle θ. They are spaced 20–30 px radially and drawn with round caps.

**Timing:** the arcs appear at r ≈ 0.65 H about 0.5–0.65 s after the ping and travel inward with **easeInQuad** (slow at first, then fast). Measured radius ≈ 690 px at t₀, 320 px at t₀+0.33 s and 100 px at t₀+0.46 s, where they hit the dot. Arc stroke grows from 2 to 6 px as the arcs get closer, and arc length in degrees stays constant, so the arcs get shorter on screen. The innermost arc arrives first and the others trail 2 frames behind.

In cycle 1 the arcs travel for ~0.8 s (0.67→1.46); in cycle 2 they are quicker, ~0.25 s (2.50→2.71).

**Props:** `angleDeg` (direction of the source), `arcSpanDeg=40`, `count=3`, `travelFrames`, `startRadius`.

### `sonar-window-pop`
**Look:** a circular picture window pops out of the sphere, slides a little towards the echo direction, holds, then shrinks back into the sphere. The sphere stays visible on top of the window.

**Elements:** a circle with a `clipPath` holding the scene (image or video). Border is 3 px `#3383CB`, no shadow. The inner scene is drawn about 1.15× the window size and drifts slowly (Ken-Burns).

**Measured (pond window):**
- Pop in 1.46→1.61 s (**4 f**, easeOutCubic): diameter 0→575 px (**0.53 H**). The centre moves from the dot (960,540) to (1022,676), an offset of ~0.13 H towards the echo direction.
- Hold 1.61–1.82 s.
- Shrink out 1.82→1.98 s (**4 f**, easeInCubic), back to diameter 0 at the dot.
- Variants: the cricket window has diameter ≈ 0.55 H and its centre offset upward, so the dot sits near the lower inner edge. Its hold is 0.4 s. The jellyfish window is 595 px, offset +154 px in x, held 0.45 s.
- No visible overshoot; the motion is crisp and snappy.

**Remotion:** `s = spring({frame:f-in, fps, config:{damping:30, stiffness:300}})` or `interpolate(f,[in,in+4],[0,1],{easing:Easing.out(Easing.cubic)})`. Then `cx = lerp(dot.x, target.x, s)`, `r = s*R`, and the exit is mirrored. Draw the scene inside `<clipPath><circle/></clipPath>`.

**Props:** `src`, `diameter`, `offset {dx,dy}`, `inFrames=4`, `holdFrames`, `outFrames=4`, `borderColor`, `borderWidth`.

### `sound-tick-marks`
3 short vertical parallel arcs (each ~40 px tall, 3 px stroke, 8 px apart) appear beside a window to suggest emitted sound. They flicker on and off at 6–8 Hz and shift 4 px outward each flicker. Use them next to any element that "makes noise". **Props:** `side`, `count=3`, `color`.

### `iris-reveal-from-dot`
**Look:** a hard-edged circle with a thin blue border grows from the central dot to cover the whole frame in about 3 frames, showing the next scene. The same move is reused scene-to-scene (owl→bell→lighthouse), where the new scene's circle opens over the previous scene.

**Measured:** radius 0 → 410 px (f1) → 870 px (f2) → full frame by f3. That is **3 frames (0.125 s), easeInQuad**. The border is 3 px `#3383CB` and disappears once the circle is past the corners (r > 1102 px).

**Remotion:** `r = interpolate(f,[0,3],[0,Math.hypot(W,H)/2],{easing:Easing.in(Easing.quad)})`. Use a `clipPath` circle on the incoming scene and draw the border circle on top.

**Props:** `center`, `durationFrames=3`, `borderColor`, `borderWidth=3`.

### `accelerating-montage`
**Look:** a sequence of full-frame scenes whose cut length shrinks in steps: **0.5 s (12 f) → 0.25 s (6 f) → 0.125 s (3 f)**. Short "paper ping" beats (5–6 f) are inserted between blocks (8.0, 9.95). The blue listener dot stays fixed at the frame centre over every scene, which glues the montage together.

**Schedule used:**
- 4.5–6.0: 3 scenes × 12 f, joined by iris.
- 6.5–8.0: wolf 12 f, then 4 × 6 f, hard cuts.
- 8.2–12.0: 6 f cuts.
- 12.0–16.0: 32 × 3 f cuts.

The last block repeats all earlier scenes in order (a "recap").

**Remotion:** `scenes.map((s,i)=><Sequence from={start_i} durationInFrames={len_i}>…)`, with `len_i` taken from a step function or `Math.round(L0*0.5**floor(i/blockSize))`. Each scene gets `scale = interpolate(local,[0,len],[1.0,1.03])` for life.

**Props:** `scenes[]`, `stepDurations=[12,6,3]`, `blockSizes`, `overlay` (the persistent dot).

### `sonar-ring-overlay`
During the 3-frame cuts (12–16 s), 2 concentric rings sit over the scenes, centred on the dot. Radii ≈ 0.22 H and 0.45 H. Each ring is a white 4 px stroke with a 2 px `#7AA8E0` outer edge (a double line), at 85 % opacity. The rings "breathe": the radius grows 0→+30 % over 0.5 s and then re-emits (a new ring every 0.5 s, on the beat). This makes any montage feel connected to the listener. **Props:** `ringCount=2`, `period=12f`, `color`.

### `thumbnail-disc-collapse`
**Look:** the whole montage gathers into a disc of circular thumbnails, one per scene, laid out on a slightly tilted plane (an ellipse with aspect 0.82). There is a centre dot, then rings of 6, 12, 16 and 20 thumbnails. Behind them is a soft yellow radial glow plate with tiny dotted "orbit" text-like rings and small pink 4-point sparkles. A thick pink outer ring (stroke 14 px `#E546AA`) expands from 0.95 to 1.15 of the plate radius, turning into dashes (16.0–16.4).

**Sizes:** the plate is ≈ 0.95 H wide. Thumbnails are 40–70 px, larger near the centre: `size = lerp(70,42,ringIndex/4)`. Each thumbnail has a lavender drop shadow offset (+12 px, +18 px) with 6 px blur.

**Timing:** appears by hard cut at 16.00. The pink ring expands and fades over 16.0–16.4. The plate glow fades 16.85–17.0. Then `duotone-recolor` (17.0–17.15) and `staggered-pop-out` (17.3–17.7).

**Remotion:** polar layout `angle = 2π·k/n_ring + ringOffset`, `x = cx + R_ring·cos`, `y = cy + R_ring·sin·0.82`. Each item is a `<clipPath>` circle with an `<image>`.

**Props:** `items[]`, `ringCounts=[1,6,12,16,20]`, `tilt=0.82`, `plateColor`, `accentRing`.

### `duotone-recolor`
Turns full-colour imagery into a two-tone map.
- **Blue version** (17.0): shadows `#1F4FA0`, highlights `#E8EEF8`.
- **Pink/violet version** (23–24 s montage): shadows `#2A1E66`, mids `#C04FB0`, highlights `#FFE6F4`.

The blue version sweeps in over 4 frames as a cross-fade of the colour layer to the duotone layer.

**SVG:** `<filter><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="0.12 0.91"/>…</feComponentTransfer></filter>`. Animate by cross-fading the filtered copy's opacity.

**Props:** `shadow`, `highlight`, `mid?`, `mix 0..1`.

### `staggered-pop-out`
The thumbnails shrink to 0 one at a time in a random order, about 0.4 s in total (17.3→17.7). Each one shrinks over 3–4 frames with easeInBack (a small 1.05 bump, then down to 0). Start times are random within the window, with a slight bias to the outer rings first. The **shadows lag one frame behind and stay offset**, which is what gives the floating feel. Ends with only the centre dot.

**Remotion:** `start_i = winStart + rand(i)*0.8*win`; `scale = interpolate(f,[start_i,start_i+4],[1,0],{easing:Easing.in(Easing.back(1.5))})`.

**Props:** `window`, `seed`, `order: 'random'|'outerFirst'`.

### `dual-sphere-call-response`
**Look:** a second agent's pings arrive from off-screen. The listener shows a small "received" halo ring: a 1 px ring at r = 30 px that blinks twice. The listener answers with its own ping, then the partner sphere enters and they take turns pinging.
- Pink rings use the same `sonar-ping-rings` recipe with colour `#E546AA`, starting off-screen at the lower left (−100, 1180), with a soft pink radial glow at the source (`#E546AA` at 25 % → 0).
- Partner entry: slides from the lower left to (350,850) with easeOutCubic over 0.35 s.
- Turn-taking interval ≈ 0.4–0.5 s.
- **Sync flash** at 21.98 (1 frame): each sphere gets a filled halo of the *other* sphere's colour (r = 2.2× sphere radius; yellow `#FFF26B` on pink, pink `#F08AD8` on blue). On the next frame both emit thick rings at the same time.

**Props:** `colors`, `turnFrames`, `partnerEntry`, `syncFrame`.

### `paper-plane-tilt-camera`
**Look:** the flat top-down paper turns into a perspective floor. The camera pitches from 0° to about 70° (looking along the plane) over **0.8 s (19.7→20.5), easeInOutCubic**, while dollying to keep the blue sphere around (960,560). Afterwards the rings are ellipses with aspect ≈ 0.25–0.35, and the far rings bunch together near the horizon at y ≈ 120. Spheres get a ground shadow ellipse offset to the lower right.
- Vignette and paper grain stay screen-space.
- Afterwards there is a slow pull-back of about 5 % per second.

**Remotion:** do not use real 3D. Keep the ring "world" coordinates on a plane and project them: `screenY = horizonY + (worldY·f)/(worldY·sinθ + d)` and `rx = r·k(y)`. Simpler alternative: draw each ring as an `<ellipse>` with `ry = rx·cos(pitch)` and `cy` shifted by `cy0 + (worldY)·cos(pitch)`, and interpolate `pitch` 0→70°. Spheres stay circles (billboards). Shadows get `ry = 0.3·rx`.

**Props:** `pitchFrom=0`, `pitchTo=70`, `durationFrames=19`, `focusPoint`.

### `ring-intersection-sparkles`
Small 4-point star sparkles (12–18 px, `#FFF6B0`, with an additive glow) sit where pink and blue rings cross. They ride the intersection points as the rings expand: compute the circle-circle intersections every frame. They also drift along the outermost far rings near the horizon. Each sparkle lives 6–10 frames, pulsing in scale 0→1→0, and turns 45° over its life.

**Props:** `color`, `size`, `maxCount`.

### `lotus-bloom-pop`
**Look:** a pink lotus (2 layers of 8 pointed petals, `#F08AD8`→`#E546AA` gradient, golden centre `#F2B33D`) rises at the midpoint between the two spheres. The petals unfold from closed (scaleY 0.2, all pointing up) to open, over **6 frames (22.10→22.35)**. It overshoots by about 8 % and settles by 22.45. There is a soft drop shadow on the plane.

**Remotion:** for each petal `rotate = lerp(0, angle_i, s)` around the base, and `scaleY = lerp(0.3,1,s)`, with `s = spring({damping:12, stiffness:180})`. Outer layer delayed by 2 f.

Generic use: "result / idea blooms where two things meet".

**Props:** `petalCount=8`, `layers=2`, `colors`, `delayFrames`.

### `pair-field-zoom-out`
**Look:** a dark violet field (radial `#452F7A`→`#19113E`) holding N≈400 dot pairs (a cyan 6 px dot and a pink 6 px dot, 8–12 px apart, at random angles). Each pair pings occasional thin rings (r up to 30 px, 1 px stroke, each ring's colour matching its dot), on random phases. The hero pair at the centre has bigger rings (r 60–120 px).
- The camera zooms out ≈ 2.5× over 2 s (scale 2.5→1, easeOutQuad).
- New pairs fade in from the edges as the view widens, and density rises as you zoom out.
- Dots also drift slowly, with a seeded Perlin flow of about 10 px/s.

**Remotion:** pre-generate pair positions in a 3×-wide world with seeded random; `transform: scale(z)` on a group. Ring phases are `(f + seed*97) % period`.

**Props:** `count`, `colors`, `zoomFrom`, `zoomTo`, `pingPeriod`.

### `glossy-sphere`
A circle with a radial gradient: highlight `#ABCFFF` at (35 %,30 %), base `#3780E7`, rim `#2B4681`. It has a small white specular dot (r = 0.15R), and a soft lavender shadow ellipse offset (+0.4R, +0.5R), blur 0.4R, at 50 % opacity. Blue R = 22 px; pink R = 16 px in the title. Used for all "agents".

**Props:** `color` (derive highlight and shade with a ±L shift), `radius`, `shadow`.

### `handwrite-stroke-on`
**Look:** monoline lower-case text drawn as if written with a pen, one glyph after another, left to right.

**Measured:**
- "opus 5.5" (8 glyphs including the space) takes **0.48 s** (26.00→26.48), about 1.4 frames per glyph. Each glyph's stroke is revealed along its path, with the next glyph starting before the previous one finishes (overlap ~30 %).
- "claude" starts 0.3 s after the title finishes and is triggered by a pink ping. It takes 0.33 s.
- There is no fade: the strokes simply draw on.

**Remotion:** use a single-line (centre-line) font or convert glyphs to centre-line paths. For each path set `strokeDasharray = len` and `strokeDashoffset = len*(1-p_i)`, with `p_i = clamp((f - i*1.4)/2)`. Stroke 10 px, round caps and joins. For the tube look, add a second stroke on top (3 px, `#8FC2FF`, 60 % opacity, offset −1,−1) and a pink 1 px rim offset (+1,+1).

**Props:** `text`, `color`, `strokeWidth`, `framesPerGlyph=1.4`, `overlap`, `fontPaths`.

## Transitions

| Transition | When | How |
|---|---|---|
| Window pop / shrink | 1.46, 1.82, 2.75, 3.21, 3.25 | Scale from and back into the dot over 4 f (see `sonar-window-pop`). No cuts in the paper world. |
| Iris from the centre | 4.46, 5.0, 5.5, 6.46 | 3 f circular reveal with a blue border |
| Hard cuts | Most montage changes; paper↔scene beats at 6.0, 8.0, 8.2, 9.95, 10.2; 16.0, 23.0, 24.0, 26.0, 27.75 | Straight cut. Pacing is 12 f → 6 f → 3 f. |
| Recolour in place | 17.0 | Colour to duotone over 4 f |
| Collapse | 17.3–17.7 | Thumbnails pop out until only the dot is left. This is the reverse of the montage expansion. |
| Camera tilt | 19.7–20.5 | Continuous 3D-ish pitch (the only true camera move) |

## Camera

- **Paper world:** static, top-down orthographic, until 19.7. Then the pitch tilt of 0→70° over 0.8 s, then a slow dolly-out of about 5 %/s to 22.9.
- **Scene world:** every scene has a slow push-in or drift of about 1–3 % scale over its lifetime, sometimes with a small pan (owl: 2 % right). The 3D illustrations have built-in parallax (2–4 depth layers: foreground leaves, subject, mid trees, sky).
- **Pair field:** zoom-out from 2.5× to 1× over 2 s, easeOutQuad.
- The blue dot is screen-locked at (960,540) through the whole montage. This is a HUD layer.

## Library candidates

- `sonar-ping-rings`: "broadcast / listening / signal sent" beat; a radar or notification pulse.
- `echo-arcs-return`: shows a response coming back from a direction; foreshadows where the next element will appear.
- `sonar-window-pop`: a picture-in-circle pops out of an anchor point to show an example or use-case.
- `sound-tick-marks`: a tiny "this makes noise" indicator next to any element.
- `iris-reveal-from-dot`: a fast circular scene transition centred on a persistent anchor.
- `accelerating-montage`: an energy build-up of cuts at 12f → 6f → 3f for "so many possibilities" moments.
- `sonar-ring-overlay`: a HUD ring overlay that unifies very fast cuts.
- `thumbnail-disc-collapse`: summarises many items or scenes as a radial gallery ("everything at once").
- `duotone-recolor`: brand-colour wash for imagery, or a "memory / recap" state.
- `staggered-pop-out`: a playful way to clear many items back to a single focus point.
- `dual-sphere-call-response`: two agents or users communicating; handshake, sync.
- `paper-plane-tilt-camera`: turns a flat 2D diagram into a 3D floor for a cinematic shift.
- `ring-intersection-sparkles`: marks the "connection points" where two signals meet.
- `lotus-bloom-pop`: an organic reveal of a result where two inputs meet.
- `pair-field-zoom-out`: "this happens millions of times": scale reveal of a population.
- `glossy-sphere`: a reusable character/agent token with soft shadow.
- `handwrite-stroke-on`: a friendly hand-lettered title or end-card reveal.
