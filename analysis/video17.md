# video17 — "12 Principles. 0 Cuts. 1 Ball." (one-take code-animation explainer)

## Overview

| Property | Value |
|---|---|
| Resolution | 1920 × 1080 |
| FPS | 60 (2610 frames) |
| Duration | 43.56 s (designed as a seamless loop: footer reads `tt = ((t % 43.5) + 43.5) % 43.5; // 43.5 → 0.0, no seam`) |
| Audio | none in file (HUD claims "160 BPM", every timing is on a 160 BPM grid: 1 beat = 0.375 s, 8 beats = 3.0 s) |

**Story.** A single red ball demonstrates Disney's 12 principles of animation, one chapter per principle (01 Squash & Stretch … 12 Appeal). The film is presented as one continuous take with no cuts. Each chapter's background change is a stylised in-frame wipe that the ball causes, so the ball itself is the transition. It ends on a typographic end card ("12 PRINCIPLES. / 0 CUTS. / 1 BALL.") and loops back to frame 0.

**Art style.** Flat vector "Swiss/editorial" design with a technical HUD overlay (timecode, code comments, beat indicator, crop marks). Shapes are solid fills with no strokes, plus thin 1–2 px diagrammatic lines (dotted trajectories, leader lines, graph editor). Only chapter 11–12 switches to a soft 3D-shaded sphere, which is still reproducible with SVG radial gradients. Hard-edged transitions use banded, posterised soft edges (stepped gradients), which is a signature look.

**Palette (sampled):**

| Role | Hex |
|---|---|
| Ink / dark background | `#0B0D0C` (sampled #0b0d0d) |
| Paper / cream background | `#EEEBDE` (sampled #eeebde / #edebde) |
| Hero ball red (also accent text, progress bar, numerals) | `#ED3821` |
| Ultramarine (chapters 04–05 background) | `#2536F4` |
| Signal yellow (chapters 06→07 background) | `#F5CA1E` |
| Bubblegum pink (chapters 07→08 background) | `#F7A7CC` |
| Warm grey (staging confetti, dimmed shapes) | `#888578` |
| Mid grey HUD text on dark | `#92908D` |
| Dim grey HUD rules on dark | `#393939` |
| 3D studio background gradient | `#FBF3E6` (centre) → `#C2BDB1` (vignette) |
| 3D ball shadow core | `#5D100A` |

**Fonts (closest free matches):**
- Chapter title: extended ultra-black grotesk, ALL CAPS. Use **Archivo** at `wdth 125, wght 900` (Monument Extended / Druk Wide look). The cap height is 45 px, or 4.2 % of H.
- Chapter numeral: high-contrast italic serif. Use **Instrument Serif Italic**, red. It is 110 px tall (10 % H), e.g. "01", "02".
- Chinese subtitle: Noto Sans SC Bold, 26 px (2.4 % H).
- Mono HUD and code: **JetBrains Mono** Medium/Bold, caps, tracking +0.15 em, 13 px (1.2 % H).
- End-card body: Inter Tight SemiBold, ~30 px.

**Layout.** The safe margin is 44 px (2.3 % W) left and right. Corner crop marks sit 18 px from the edges with 22 px arms, 2 px thick, grey `#888`. The header baseline is y≈50. The chapter title block anchors bottom-left: the numeral sits at x=88, y=842–951; the title at x=239, y=861–905; the Chinese line at y=928–953. The footer HUD runs from y=1000 to 1040. The ball's home position is screen centre (960, 540) with radius 69.5 px (diameter 139 px, 12.9 % H).

## Timeline

Chapters change on a fixed 3.0 s grid (8 beats at 160 BPM). The background wipe happens mid-chapter, about 1.5–1.75 s in.

| Start–End (s) | On screen | What moves | Transition out |
|---|---|---|---|
| 0.00–3.00 | **01 Squash & Stretch**. Dark bg; ball drops from y=230 onto an invisible floor (ball centre at rest y=710). Dotted trajectory trail; scale readouts "0.92 1.10 1.00" (sx, sy, area) in italic serif digits. At 2.0 s a "circle = ellipse = ellipse" volume diagram appears top-right | Gravity bounce with squash/stretch (see `squash-stretch-bounce`). Readout digits roll each frame | Ball squashes into the anticipation pose |
| 3.00–4.55 | **02 Anticipation**. Ball squashes in place (w 155, h 121). A semicircular gauge arc above the ball fills 0→100 % with a counter "27 % … 53 % … 98 % … 100 %" | Gauge fills, ball deepens its squash (the anticipation "pump"), then launches straight up (stretch h 504 px) and exits the top at 4.55 | Ball leaves the frame top → `luma-ramp-wipe` dark→cream, top-to-bottom, 4.57–4.72 |
| 4.72–6.10 | Cream bg; the ball falls back in from the top (stretched), lands at screen centre with a damped spring ("caught"). Timeline bars "ANTICIPATION 90F / ACTION 45F / FOLLOW-THROUGH 45F" | Spring settle, bar chart fills | Title swap 6.0–6.3 (`masked-title-swap`) |
| 6.10–7.60 | **03 Staging**. At 6.4 s about 141 confetti shapes burst out of the ball and tile the frame. Labels "WHERE IS THE IDEA? / ✕ NO STAGING" and "OBJECTS 141 · SIGNAL 1 : 140" | `confetti-burst-fill` | `spotlight-iris` 7.50–7.70: dark vignette closes onto a cream disc around the ball; shapes go grey and snap to a dot grid |
| 7.70–9.00 | Spotlight disc with halftone edge; "FOLLOW" callout on the ball; surrounding grey shapes regularised into a grid | Ball wobbles | Panels open (9.0) |
| 9.00–11.60 | **04 Straight Ahead & Pose to Pose**. Two inset panels: cream left "STRAIGHT AHEAD" (onion-skin circles drawn frame by frame, frame counter 06→14→22→31) and dark right "POSE TO POSE" (key poses KEY 1/KEY 2 plus in-betweens filling an arc) | `onion-skin-trail` in both panels, at different rates | Panels collapse with a stepped shutter (11.55), the balls merge at centre, then `ripple-flood` to blue 11.65–11.75 |
| 11.75–14.75 | **05 Follow Through & Overlapping Action**. Blue bg. The ball flies on an arc trailing 5 ribbon strands (white / pink / lavender / yellow); "STOP" label at 13.0, strands overshoot and settle; "FRAMES AFTER STOP · SETTLE" bars | `ribbon-follow-through` | `spiral-wipe` 14.55–14.75: strands wind into an expanding spiral that floods cream |
| 14.75–17.75 | **06 Slow In & Slow Out**. Cream bg. Two tracks: black ball "A · LINEAR" and red ball "B · EASE IN · EASE OUT", with spacing ticks under each; dark "GRAPH EDITOR · EASE" panel draws `cubic-bezier(0.70, 0.00, 0.30, 1.00)` | `ease-compare-tracks` + `graph-editor-curve` | `liquid-wave-wipe` yellow from the bottom-right, 17.75–17.90 |
| 17.90–20.70 | **07 Arcs**. Yellow bg. "STRAIGHT ✕" with the ball on a straight dotted line, then "ARC ✓" (red check) as the ball swings on pendulum arcs tracing a 6-petal rose; petals fill pink | `rose-curve-trace` | `petal-zoom-wipe` 20.65–20.80: petals scale past camera, pink becomes the bg |
| 20.80–23.75 | **08 Secondary Action**. Pink bg. Ball bounces along a ground line (dotted arcs); a music staff at top gets a note for each bounce ("if (landed) emit(note[k++ % 8]); // E G A G E D E C") | `note-per-bounce` | `bar-expand-wipe` 23.75–23.95: the staff thickens into a black band that floods the frame |
| 23.95–27.00 | **09 Timing**. Dark bg. The ball splits into 3 drop columns: bowling ball (grey, 9 F), red ball (24 F), pink balloon (52 F), each with a frame counter and a vertical dashed guide. At 26.5 the balloon floats away | `split-compare-drop` | Columns merge back to one ball |
| 27.00–28.45 | **10 Exaggeration**. Ball at ×1, ×2, ×4 push (red italic multiplier "×4" plus measurement brackets), speed lines | Bigger squash and taller stretch per level; 28.15–28.20 comic `impact-frame` ("×4.0" on radial speed lines) | `lens-iris-open` cream, 28.45–28.60, ground cracks and debris |
| 28.60–30.00 | Cream bg; crack lines on the ground, black polygon debris tumbling | `ground-crack-debris` | Title swap |
| 30.00–34.50 | **11 Solid Drawing**. Flat disc → wireframe sphere (meridians/parallels) → glossy 3D sphere with perspective floor grid; leader-line callouts HIGHLIGHT / TERMINATOR / CORE SHADOW / REFLECTED LIGHT / CAST SHADOW | `flat-to-3d-sphere` + `callout-leader-labels` | Seamless |
| 34.50–38.70 | **12 Appeal**. 3D ball gets eyes: blink, look left/right, happy "^ ^" eyes, a hop with squash | `character-eyes` | 38.3–38.7 `render-flatten` back to the flat cream style |
| 38.70–42.55 | End card. Ball hops; headline lines "12 PRINCIPLES." / "0 CUTS." / "1 BALL." slide up from masks (italic serif numerals plus extended black words); the ball lands as the period of "BALL"; right column "Every frame and every sound in this film is code. / 每一帧、每一个声音，都是代码。", rule, "8,951 LINES OF CODE · 37 FILES" (grey mono), "0 KEYFRAMES IN AE · MADE WITH CLAUDE" (red mono) | `masked-line-reveal` stagger, `typewriter-code` | 42.55–42.80 text exits with skew + motion blur; ball drops |
| 42.80–43.56 | Ball falls stretched; `eyelid-iris-close` (cream ellipse squashes to a horizontal sliver over dark) | — | Loops to frame 0 (dark bg, ball at top) |

## Motion techniques

### `squash-stretch-bounce`
**Looks like:** a red disc dropped from the upper middle, bouncing with decreasing height. It stretches vertically while falling fast and squashes flat for 1–2 frames on contact. Area is conserved.

**Measured (60 fps, full-res tracking):**
- Drop: centre y 230 → impact 0.367 s. Floor contact where centre ≈ 710 at rest (bottom of ball at y≈779).
- Gravity: 480 px in 0.367 s → **g ≈ 7100 px/s²** at 1080p (0.66 H/s²).
- Apexes: y=460 @0.667 s, 614 @1.133, 662 @1.45, 697 @1.70; at rest by 1.85 s. Bounce heights 480 → 250 → 96 → 48 → 13 px, so energy ratio ≈ 0.45 and **velocity restitution e ≈ 0.67**.
- Impacts at 0.367, 0.933, 1.30, 1.58, 1.77 s.
- Stretch just before impact: w 99 / h 181 (sx 0.71, sy 1.30).
- Squash at contact: w 243 / h 77 (sx 1.75, sy 0.55), held for **1–2 frames** (16–33 ms); the next frame is already rebounding with slight stretch.
- Near the apex sy ≈ 1.0 (w 139 / h 138).

**Recipe:**
```ts
// analytic piecewise ballistic, frame-exact
const g = 0.66 * H;           // px/s²
const e = 0.67;               // restitution
// precompute bounce segments: h0 = dropHeight; v0 = sqrt(2 g h0); T_k = 2 v_k / g; v_{k+1} = e v_k
// for time t inside segment k: y = floorY - (v_k * τ - 0.5 g τ²)
const v = vy(t);                                  // signed velocity
let sy = 1 + clamp(Math.abs(v) * 1.15e-4, 0, 0.32);   // stretch with speed
if (framesSinceImpact <= 1) sy = 0.55 * lerp(1, impactSpeed / v0max, 1); // squash
const sx = 1 / sy;            // "sx = 1 / sy; // area π·r² is conserved"
// anchor the transform at the contact point on impact frames (squash spreads along the floor)
<circle cx={x} cy={y} r={R} transform={`translate(${x} ${y}) scale(${sx} ${sy}) translate(${-x} ${-y})`} />
```
Draw the trail as dots every 2 frames (1.5 px white dots at 50 % opacity) along the past path, plus a faint floor ellipse (shadow ring) under the contact point.

**Props:** `dropHeight`, `restitution`, `gravity`, `maxStretch=0.3`, `squash=0.55`, `color`, `radius`, `showTrail`, `showReadout`.

### `anticipation-charge-launch`
**Looks like:** the ball sinks into a squash and holds it while a gauge above charges, then fires straight up as a long streak.

**Parameters:**
- 3.0–3.35 s: ease into squash (w 155 / h 121: sx 1.12, sy 0.87) with `easeOutCubic`.
- 3.35–4.30 s: hold/pump. A gauge (semicircle arc r≈95 px, 6 px red stroke, tick marks every 30°) fills clockwise; the counter shows percentage in italic serif ("27 %" @3.0, "53 %" @3.5, "98 %" @4.0, "100 %" @4.4). The ball's squash deepens slightly with the fill.
- 4.30–4.55 s: launch with `easeInExpo`. Stretch up to sy≈3.6 (h 504 px), sx≈0.45 (vertical motion-blur feel), and exit at the top in 0.2 s.
- 5.20 s: re-entry from the top, stretched (h 515). Landing at 5.30 (squash w 173 / h 103). Spring settle: y 588 → 540 → 534 → 539 → 540 by 5.5 s.
- Spring: footer formula `y = 540 + A·e^(-ζω·t)·sin(ωd·t)`, with ζ≈0.45 and ωd≈30 rad/s. Remotion `spring({fps:60, config:{mass:1, stiffness:1200, damping:30}})`.

**Props:** `chargeDuration`, `gaugeLabelFormat`, `launchDirection`.

### `luma-ramp-wipe`
**Looks like:** the new background colour slides down over the old one with a soft, visibly banded edge (about 8 stepped bands), like a posterised gradient. The ball leaving the top "pulls" the wipe.

**Measured:** 4.57–4.72 s (about 9 frames at 60 fps), top → bottom, near-linear with a slight ease-in. The edge band height is about 12 % of H.

**Recipe:** one rectangle of the new colour with `y = lerp(-H*0.12, H, easeInQuad(p))`, plus a gradient edge strip made of 8 stacked rects whose opacity steps 1, 0.875 … 0.125 (stepping, not smooth, gives the banding). The old-scene elements below the edge stay visible until covered.

**Props:** `direction (top|bottom|left|right)`, `fromColor`, `toColor`, `bands=8`, `edgeSize=0.12`, `duration=0.15s`.

### `masked-title-swap`
**Looks like:** the chapter title block changes like a split-flap or odometer. The old title text slides up out of a clip mask with vertical motion blur. The red italic numeral rolls (02 slides up and out while 03 slides up from below, both blurred). The new title letters rise from a baseline mask with a fast left→right stagger. Then the mono subtitle types out with a cursor.

**Measured (title change at 6.0 s):**
- Old title exit: 6.03–6.10 (about 4 frames, `easeInCubic`, translateY −100 % of cap height, blur 6 px vertical).
- Numeral roll: 6.13–6.27, translateY by the numeral height, motion blur during travel, `easeInOutCubic`.
- New title letters: 6.17–6.30. Per-letter stagger ≈ 1 frame (16 ms); each letter rises 100 % from its own baseline mask in ~6 frames with `easeOutCubic`.
- Chinese line: rises together with the title, 2 frames behind.
- Subtitle typewriter ("— One idea. Unmistakably clear."): starts about 0.1 s after the title lands, ~30 chars/s, block cursor while typing.
- A red progress rule under the title block (2 px, x 45→331 at 6.8 s) is the global film progress `t/duration × 1830 px`.

**Exit variant (14.75→15.0):** the title compresses vertically (scaleY → 0 anchored at the top) while sliding up, 4 frames.

**Recipe:** each glyph is a `<span style={{display:'inline-block', transform:`translateY(${(1-easeOutCubic(p_i))*110}%)`}}>` inside an `overflow:hidden` line box. Fake motion blur with `filter: blur(0 Npx)` (an SVG `feGaussianBlur stdDeviation="0 N"`) proportional to velocity.

**Props:** `number`, `title`, `subtitleCN`, `subtitle`, `stagger`, `typeSpeed`.

### `hud-chrome-overlay`
**Looks like:** a persistent broadcast/dev HUD over every scene.
- Corner crop marks.
- Header left: "THE 12 PRINCIPLES OF ANIMATION / 动画十二法则", with the Chinese in red.
- Header right: "ONE BALL · ONE TAKE   CUTS **00**", with 00 in red.
- Footer left: "TC 00:00:41:30" timecode (frames at 60 fps, updating live).
- Footer centre: live code comment for the current chapter, typed with a red block cursor. Examples: `sx = 1 / sy; // area π·r² is conserved`, `y = 540 + A·e^(-ζω·t)·sin(ωd·t); // caught`, `x = x0 + Δx·u // linear: the same Δx every frame`, `θ'' = -(g/L)·sin θ // pendulum → arcs`, `t = √(2h/g) // same h: 9f heavy · 24f · 52f light`, `anticipation = 72px · k // k: 1 real → 4 pushed`, `L = albedo·max(n·l…`.
- Footer right: "160 BPM · 60 FPS" plus a 4-square beat indicator. The current beat square is filled red; it advances every 0.375 s.
- Progress bar: a 2 px hairline across x 44→1876 at y≈1010, a red fill = t/T, a tick every 3.0 s (one per chapter, spacing ≈126.7 px), and a red playhead tick.

Text colour is `#0B0D0C` on light backgrounds and `#EEEBDE` on dark ones. It flips with the bg colour at the moment the wipe passes the text's y position (the HUD is coloured per pixel row, as if `mix-blend-mode: difference` were limited to two colours). Easiest approach: render the HUD twice (dark and light versions) and clip each by the wipe mask.

**Props:** `title`, `subtitle`, `bpm`, `fps`, `codeLine(t)`, `chapters[]`.

### `confetti-burst-fill`
**Looks like:** about 141 flat shapes (filled circles, rings, rounded squares rotated, capsules/pills, small dots) in red/blue/yellow/pink/black/grey explode out of the ball and settle into a dense, roughly uniform field filling the frame (the "no staging" chaos).

**Measured:** 6.40–6.70 s. Starts as a tight motion-blurred cluster (radius ~100 px at 6.40), reaches full spread at ~6.55, then settles with slight overshoot until 6.75. Shapes rotate ±90° in flight.

**Recipe:** seed random targets with Poisson-disk sampling over the frame (minimum distance ~60 px). For each shape: `pos = lerp(ballCenter, target, easeOutBack(p, 1.3))`, `rot = rot0 + (1-p)*rand(±90°)`, `scale = easeOutCubic(p)`. Per-shape delay `rand(0, 0.05s)`. Add directional blur in the radial direction while velocity is high (or draw 3 ghost copies at 30/15/8 % opacity along −velocity). Shape sizes 30–110 px. Colour weights: red 0.18, blue 0.18, yellow 0.12, pink 0.14, black 0.2, grey 0.18.

**Props:** `count`, `palette`, `seed`, `shapeKinds`, `duration`.

### `spotlight-iris`
**Looks like:** the whole frame darkens to ink while a cream circular spotlight closes in on the ball. The spotlight edge is a halftone/dithered dot ring rather than a blur. Shapes outside the light desaturate to grey and then re-flow into a regular dot grid (signal vs. noise).

**Measured:** 7.50–7.70 s. The spotlight radius goes from about 1.0 W (off-screen) to ~290 px (27 % H) with `easeOutCubic`. The halftone edge ring is ~25 px wide. Outside shapes fade from colour to `#3a3936` grey over the same window, then 7.70–8.00 tween into grid positions (pitch ~60 px) and shrink to 8–20 px dots.

**Recipe:** a `<mask>` with a white circle plus a halftone ring (circles on a 6 px grid, radius ∝ (1 − distance into edge)). Dark overlay `#0B0D0C` uses the inverted mask. Grey shapes: CSS `filter: grayscale(1) brightness(.35)`. Grid snap: `lerp(pos, gridPos, easeInOutCubic)`.

**Props:** `target {x,y}`, `endRadius`, `edgeStyle (halftone|soft)`, `dimColor`.

### `onion-skin-trail`
**Looks like:** two side-by-side panels compare the methods. The left panel (cream) draws a new outlined circle each frame on the ball's path ("straight ahead"), accumulating a chain of thin-stroked ghost circles; a counter in the bottom-right counts drawings (06, 14, 22, 31). The right panel (dark) shows KEY 1 and KEY 2 as outlined ellipses, then fills in-between red circles along a parabolic arc with decreasing opacity (red → dark red), and a keyframe timeline with diamonds below.

**Parameters:** panels are about 33 % W × 30 % H each with 4 px corner radius, inset from the centre line by 60 px. Ghost circles have a 1.5 px stroke `#0B0D0C` at 70 % opacity. In-betweens are 8 positions with `opacity = 0.25 + 0.75*(i/7)`.

**Recipe:** sample the path `p(t)`. Left panel: render ghosts at every k-th frame up to the current frame. Right panel: render keys at fixed u, then in-betweens at `u_i = ease(i/n)`, spacing them closer near the keys to show ease.

**Props:** `path`, `keyCount`, `inbetweens`, `panelLayout`.

### `ripple-flood`
**Looks like:** concentric rings burst outward from the ball and the outermost ring becomes the new background colour (blue). The edge has visible discrete ring bands, like a ripple tank.

**Measured:** 11.62–11.75 s (about 8 frames). The radius grows from 0 to ~1200 px with `easeInQuad` (accelerating). There are ~8 band rings, each 12 px, with opacity stepping.

**Recipe:** `<circle r={R(p)} fill={newColor}/>` plus N rings at `R - k*12` with stroke `newColor` at opacity `1 - k/N`. Clip the old scene by the circle.

**Props:** `origin`, `color`, `duration`, `bands`.

### `ribbon-follow-through`
**Looks like:** the ball trails 5–6 parallel soft ribbons (white `#FFFFFF`, lavender `#C9B6F2`, pink `#F7A7CC`, yellow `#F5CA1E`) like jellyfish tentacles. When the ball changes direction the ribbons lag and swing (overlapping action). On "STOP" the ball halts and the ribbons keep travelling, overshoot past the ball, then settle hanging down with damped wiggle.

**Parameters:** ribbon length ≈ 300–380 px, width 10–14 px each, gap 4 px, soft edge (blur 2 px). Each ribbon is a polyline of the last N=40 ball positions delayed by `i*1.5` frames. Settle after stop: damped oscillation, period ~0.35 s, ζ≈0.3, 3 visible swings.

**Recipe:** keep a position history buffer (deterministic: compute ball position at `t - k*dt` analytically). For ribbon i, points `P_k = ballPos(t - (k + i*1.5)/fps) + perpendicular*i*14`. After stop, replace `ballPos(t-τ)` with a spring-integrated chain (verlet rope with 20 segments, gravity down) seeded from the history. Draw each as an SVG `<path>` with `stroke-linecap=round` and a gradient alpha from 1 (head) to 0 (tail).

**Props:** `ribbonCount`, `colors`, `length`, `lag`, `stopTime`, `damping`.

### `spiral-wipe`
**Looks like:** the ribbons coil into an Archimedean spiral of white stripes centred on the ball; the spiral expands and the stripe width grows until white/cream fills the screen. The edges carry a faint blue fringe.

**Measured:** 14.55–14.75 s. About 6 turns. Stripe width goes from 20 px to above the gap width; the spiral scale grows ×8.

**Recipe:** path `r = a + bθ`, θ ∈ [0, 12π], drawn as a stroke with `strokeWidth = lerp(20, 260, easeInCubic(p))` and `scale = lerp(0.3, 3, easeInCubic(p))`, with rotation +90° over the wipe. When the coverage is effectively full, swap the bg to the new colour.

**Props:** `turns`, `color`, `origin`, `duration`.

### `ease-compare-tracks` / `graph-editor-curve`
**Looks like:** two horizontal tracks with a ball on each (A linear, black; B eased, red). Below each track is a strip of vertical tick marks showing per-frame spacing: even for linear, bunched at the ends for the ease, with labels "SLOW OUT · FAST · SLOW IN". On the right, a dark square panel "GRAPH EDITOR · EASE" plots the value curve with two bezier handles (squares) and the label `cubic-bezier(0.70, 0.00, 0.30, 1.00)` in mono. The curve morphs from linear to S-curve while the handles drag out (16.3–17.0 s, with ghost motion blur on the curve).

**Parameters:** tracks span x 45→230 of a 384-px-wide tile (≈ x 230→1150 full-res), ball radius 30 (black) / 44 (red). One traverse takes 1.0 s. Ticks: 1 px, 18 px tall, one per frame-sample (every 2 frames), red for the eased track.

**Recipe:** `x = x0 + Δx * u` versus `x = x0 + Δx * bezierEase(0.7,0,0.3,1)(u)`. Tick k sits at `ease(k/N)`. Graph: draw the path for the bezier and interpolate the control points from (0.33,0.33)/(0.67,0.67) to (0.7,0)/(0.3,1) over 0.6 s.

**Props:** `easing`, `duration`, `tickCount`, `labels`.

### `liquid-wave-wipe`
**Looks like:** a yellow fluid surge sweeps from the bottom-right corner toward the top-left with a soft, wavy (sinusoidal), banded leading edge.

**Measured:** 17.75–17.90 s (9 frames). The edge travels diagonally about 2200 px. The wave amplitude is ~60 px with wavelength ~700 px.

**Recipe:** in coordinates rotated by −30°, the edge is `y = front(p) + A sin(2π x/λ + φ(t))`, filled with the new colour. Add 6 stepped-opacity offset copies for the banded edge. `front` uses `easeInOutCubic`.

**Props:** `angle`, `color`, `amplitude`, `wavelength`, `duration`.

### `rose-curve-trace`
**Looks like:** the ball swings like a pendulum (dotted pendulum string and pivot shown), tracing petal-shaped loops. Each loop leaves a thin black outline petal. After 6 petals a 6-petal flower is complete around the ball, and the petals fill pink with a slight 3-layer offset echo (grey strokes).

**Parameters:** rose `r = R·cos(3θ)`, R ≈ 300 px, at ~0.5 s per petal. Petal outline 2 px `#0B0D0C`. The fill fades in over 0.2 s. The ball keeps moving on the curve during the fill.

**Recipe:** `x = cx + R cos(3θ) cos θ, y = cy + R cos(3θ) sin θ`, θ = f(t). Draw the outline with `strokeDashoffset` driven by θ. "STRAIGHT ✕ / ARC ✓" labels use strikethrough animation (the line draws across in 0.15 s) and a check-mark path draw.

**Props:** `petals`, `radius`, `traceSpeed`, `fillColor`.

### `petal-zoom-wipe`
**Looks like:** the flower scales up past camera while rotating; petal edges smear radially (zoom blur with multiple faint outline copies). The petal colour becomes the new full background.

**Measured:** 20.65–20.80 s. Scale goes 1 → 8 (`easeInCubic`), rotation +35°. Ghost outlines: 6 copies at scale ×0.92^k.

**Props:** `shape`, `color`, `scaleTo`, `rotate`, `duration`.

### `note-per-bounce`
**Looks like:** the ball bounces along the ground in small hops (dotted arc trail left behind). On each landing a music note appears on a 5-line staff at the top of the frame, progressing left→right. Notes pop in with a small bounce and a red tint that fades to black.

**Parameters:** hop height 70–110 px, hop period ~0.375 s (one beat). Staff: 5 lines, 1 px, spacing 10 px, at y≈130–170 spanning the width. Note sequence E G A G E D E C. Note pop: scale 0 → 1.15 → 1 over 0.15 s; colour `#ED3821` → `#0B0D0C` over 0.3 s.

**Props:** `notes[]`, `bpm`, `hopHeight`.

### `bar-expand-wipe`
**Looks like:** a horizontal band (starting as the staff line) thickens into a soft-edged black bar that expands until the frame is dark.

**Measured:** 23.75–23.95 s. The top edge goes from y≈0.12 H to 0 and the bottom edge from 0.15 H to 1.05 H, `easeInOutQuad`. The edge is a soft gradient ~5 % H.

**Props:** `startY`, `color`, `duration`.

### `split-compare-drop`
**Looks like:** the ball duplicates. Copies slide left and right (±480 px, motion blur, 0.2 s, `easeOutCubic`) and morph: left into a bowling ball (grey with 3 holes, outline style), right into a pink balloon with a string. All three drop from the same height with different durations. Frame counters above each ("09F / 24F / 52F") roll as each falls; vertical dashed guides and a floor line show the drop.

**Parameters:** 9, 24 and 52 frames at 60 fps for the same 300 px drop. Bowling uses `easeInQuad` (heavy), the ball real gravity, the balloon linear-slow with sway (x sin wave, 10 px amplitude, 1.2 s period). The balloon later floats up off the top (26.4–26.8) with `easeInCubic`.

**Props:** `objects[{label, frames, easing, art}]`, `dropHeight`.

### `impact-frame`
**Looks like:** a 2–3 frame comic "smash" frame: monochrome radial speed lines (white on black), a jagged starburst under the ball, and a giant extra-bold italic "×4.0" in white across the frame. Then it snaps back.

**Measured:** 28.15–28.20 s (3 frames at 60 fps). Speed lines: ~80 lines with random width 2–10 px, starting at radius 250 px. Text ~240 px tall, skew −10°.

**Props:** `label`, `durationFrames=3`, `lineCount`.

### `lens-iris-open`
**Looks like:** a cream disc with concentric faint rings (lens elements) expands from the impact point. Soft edge; the dark scene outside fades.

**Measured:** 28.45–28.62 s. The radius goes 150 → 1400 px with `easeOutQuad`. The edge feather is ~60 px. The interior shows 2 faint rings (`#000` at 6 %).

**Props:** `origin`, `color`, `duration`.

### `ground-crack-debris`
**Looks like:** on heavy impact, the ground line cracks into branching jagged black polylines (3–4 main branches spreading ±300 px). ~12 small black polygon shards (triangles/quads 8–25 px) fly up in ballistic arcs, spinning, and fall away by ~1 s.

**Recipe:** crack = L-system/random-walk polylines grown with `strokeDashoffset` over 0.15 s. Debris: `x = x0 + vx t`, `y = y0 - vy t + 0.5 g t²`, `rot = ω t`, seeded.

**Props:** `branches`, `shards`, `seed`, `gravity`.

### `flat-to-3d-sphere`
**Looks like:** the flat red disc gains a thin white rim and wireframe (2 meridian ellipses, 2 parallels, crosshair) drawn on in sequence. A perspective grid floor fades in (light grey lines, 3-point perspective). A shading layer crossfades in: radial gradient body (`#FF4A34` highlight side → `#ED3821` → `#5D100A` core shadow), a white specular blob (rounded rect, top-left at 30 % radius), and a soft elliptical cast shadow (blur 40 px, `#000` at 25 %) to the lower right. The background turns into a warm studio gradient (`#FBF3E6` → `#C2BDB1` vignette). Then the ball floats slightly (y ±10 px, 1.5 s period).

**Timing:** 30.0–30.4 wireframe draw-on (each ellipse 0.15 s, stagger 0.08 s); 30.5–31.4 shading crossfade plus camera tilt (floor grid perspective change); 31.5–34.3 callouts.

**Recipe:** SVG `<radialGradient fx=0.35 fy=0.3>` with 4 stops; terminator softness via a second dark radial gradient offset to the bottom-right with multiply blend; specular as a white blurred rounded rect.

**Props:** `color`, `lightDir`, `showWireframe`, `showGrid`.

### `callout-leader-labels`
**Looks like:** small dots appear on surface features. Thin 1 px dark leader lines draw out at 30–45° with a horizontal shelf, ending in a mono caps label (HIGHLIGHT, TERMINATOR, CORE SHADOW, REFLECTED LIGHT, CAST SHADOW) plus a smaller grey sublabel.

**Timing:** each callout gets a dot (scale 0 → 1, 0.1 s), then the line (0.2 s `easeOutCubic` dashoffset), then the label typed (25 ch/s). Stagger 0.35 s.

**Props:** `items[{anchor, elbow, label, sublabel}]`.

### `character-eyes`
**Looks like:** two black vertical ovals (about 12 × 22 px on the 139 px ball; larger on the 3D ball, ~22 × 40 px) with a tiny white catch-light. They blink (scaleY 1 → 0.1 → 1 over 5 frames), saccade left/right (translate ±15 px in 3 frames, hold), and switch to happy closed-arc eyes "^ ^" (2 px arcs). A hop has anticipation squash.

**Props:** `eyeShape`, `blinkTimes[]`, `lookTargets[]`, `mood`.

### `render-flatten`
**Looks like:** the 3D-shaded glossy ball loses gloss and shading, becoming the flat red disc again. The studio gradient flattens to cream. The specular highlight shrinks into the eyes' catch-light.

**Measured:** 38.3–38.7 s, crossfade of the shading layer opacity 1 → 0 with `easeInOutSine` while the cast shadow scales to 0.

### `masked-line-reveal` (end card)
**Looks like:** each headline line ("12 PRINCIPLES." / "0 CUTS." / "1 BALL") rises from its own mask with vertical motion blur. The italic serif numeral and the black extended word move together. Line stagger is ~0.4 s (39.25, 39.65, 40.0). The right-hand column types in (Inter body + Chinese + grey rule drawing left→right 0.3 s + two mono lines, the second in red).

**Exit (42.55–42.80):** all lines slide down ~40 px with skew-Y 6° and blur, opacity → 0, stagger 2 frames bottom-first.

**Props:** `lines[{numeral, word}]`, `stagger`, `sideCopy[]`.

### `eyelid-iris-close`
**Looks like:** the cream frame closes like an eyelid. The dark colour encroaches from top and bottom with curved (elliptical) soft edges, leaving a horizontal lens-shaped sliver that collapses. The ball falls through it, so it loops to the dark opening frame.

**Measured:** 42.95–43.25 s. The cream region is an ellipse with rx ≈ 1.2 W and ry going from 1.0 H to 0.05 H, `easeInCubic`. Soft edge ~40 px, banded.

**Props:** `color`, `duration`, `axis (horizontal|vertical)`.

### `typewriter-code`
Footer and subtitle typing: ~30 characters/s at 60 fps (1 char per 2 frames). Red block cursor `▮` (`#ED3821`, 9 × 14 px) that is solid while typing and blinks at 2 Hz when idle. Prefix "//" comments are rendered in the same weight. Chinese characters type at the same rate.

## Transitions

Every scene change is an in-frame motion graphic. There are no editorial cuts (the HUD literally reads "CUTS 00").

| Time (s) | Transition | Duration | Notes |
|---|---|---|---|
| 4.57 | `luma-ramp-wipe` dark → cream (top→bottom) | 0.15 s | Triggered by the ball exiting the top |
| 6.03 | `masked-title-swap` (title only) | 0.3 s | On the 3 s chapter grid |
| 7.50 | `spotlight-iris` (colour → dark with cream disc) | 0.2 s + 0.3 s grid regroup | |
| 9.00 | panel split open | 0.1 s | Spotlight disc becomes panels |
| 11.55–11.75 | panel shutter collapse → `ripple-flood` blue | 0.1 s + 0.13 s | |
| 14.55 | `spiral-wipe` blue → cream | 0.2 s | |
| 17.75 | `liquid-wave-wipe` cream → yellow | 0.15 s | |
| 20.65 | `petal-zoom-wipe` yellow → pink | 0.15 s | |
| 23.75 | `bar-expand-wipe` pink → dark | 0.2 s | |
| 28.15 / 28.45 | `impact-frame` → `lens-iris-open` dark → cream | 0.05 s + 0.17 s | |
| 31.0 | studio gradient crossfade | 0.6 s | |
| 38.3 | `render-flatten` | 0.4 s | |
| 42.95 | `eyelid-iris-close` cream → dark → loop | 0.3 s | |

All wipes are fast (9–12 frames at 60 fps) and use banded soft edges. The chapter title always swaps on a 3.0 s boundary; the background wipe happens on beat 4–5 of the 8-beat chapter.

## Camera

Essentially a locked-off 2D camera; all apparent motion is object or wipe motion. Exceptions:
- 30.5–31.5 (Solid Drawing): a fake 3D tilt. The perspective floor grid's vanishing point moves up ~80 px and the sphere's wireframe parallels rotate (implied camera orbit of about 15°).
- 34.5–38.0: very slow drift of the 3D studio background gradient (vignette centre moves ~40 px).
- No parallax layers. The HUD layer is screen-locked (depth layer 2 of 2).

## Library candidates

- `squash-stretch-bounce`: physically correct bouncing element for logos, icons, or mascots dropping into frame.
- `anticipation-charge-launch`: "loading/charging then launch" beat for stats, CTAs, rocket-style exits.
- `luma-ramp-wipe`: fast banded directional colour wipe between sections.
- `masked-title-swap`: chapter or step title changer with odometer numeral roll plus staggered letter rise.
- `hud-chrome-overlay`: dev/broadcast HUD frame with timecode, beat dots, progress ticks and live code line.
- `confetti-burst-fill`: explode a hero element into a full-frame field of brand shapes.
- `spotlight-iris`: focus attention on one element by darkening and halftone-iris around it.
- `onion-skin-trail`: show a motion path or process history as ghosted frames.
- `ripple-flood`: radial banded colour flood from any point (tap/impact transitions).
- `ribbon-follow-through`: trailing ribbons for cursors, comets, mascots with overlapping action.
- `spiral-wipe`: playful hypnotic transition expanding from a point.
- `ease-compare-tracks`: explainer for easing/spacing, A/B comparison of motion curves.
- `graph-editor-curve`: animated cubic-bezier editor visual for tech/design tutorials.
- `liquid-wave-wipe`: organic diagonal colour flood with a wavy edge.
- `rose-curve-trace`: decorative parametric curve drawing (flowers, spirographs, loaders).
- `petal-zoom-wipe`: zoom-through transition using any shape that becomes the next background.
- `note-per-bounce`: event-synced icon emission along a staff or timeline (beats, milestones).
- `bar-expand-wipe`: horizontal band that grows into a full-screen colour change.
- `split-compare-drop`: side-by-side comparison of the same action with different timings.
- `impact-frame`: 2–3 frame comic smash frame for emphasis hits.
- `lens-iris-open`: circular reveal of a new scene from an impact point.
- `ground-crack-debris`: heavy-landing impact effect (cracks plus flying shards).
- `flat-to-3d-sphere`: upgrade a flat icon into a shaded 3D look with an SVG-only render.
- `callout-leader-labels`: staggered annotation callouts for diagrams and product shots.
- `character-eyes`: give any shape a blinking, looking personality.
- `render-flatten`: return a rich render to flat brand style (style reset beat).
- `masked-line-reveal`: headline/end-card line-by-line rise with motion blur.
- `eyelid-iris-close`: elliptical close transition, a seamless loop or ending.
- `typewriter-code`: monospace typing with a block cursor for code captions and subtitles.
