# video7 — "Downhill" isometric bar-chart staircase (seamless loop)

## Overview

| | |
|---|---|
| Resolution / fps | 1920×1080, **60 fps**, 16.04 s (960 frames). Has an audio track (ignored). One continuous shot that **loops seamlessly**: the last frame flows into the first. |
| Theme / story | A tiny white ball character with two black oval eyes hops down a descending bar chart that doubles as a staircase. Each bar it lands on is "painted" with an orange cap block. Near the bottom it speeds up and the paint cascades ahead of it. It lands on the floor with a tile ripple, then rolls back along the base of the chart to the start. A peach pillar grows under it and lifts it back to the top while the orange caps un-paint. It hops off onto step 1 again. Read it as the metaphor "declining metric / going down, and the cycle repeats". |
| Art style | Soft **clay / minimal 3D isometric** (dimetric camera with very slight perspective), matte materials, soft ambient occlusion, warm off-white palette and one accent colour. No outlines. Gentle radial vignette (top-right brighter). |
| Palette | Background/vignette `#DCD3C9` (edges) → `#EFE8DE` (centre). Floor tile top `#ECE4D8`, tile gap/groove `#CEC5B7`. Bar faces: front-left `#CAC2B7`, front-right `#CEC6BB`; unvisited bar top recess `#F9F5EF`; faint horizontal segment lines on bar faces `#C2BAAF`. Accent cap: top `#E48E6D`, left face `#D27557`, right/dark face `#BA6142`; mid `#DC7D5C`, highlight `#EE9371`. Transitional "ghost" cap / trail tint `#F7DAC9` (top) and `#F0D5C3` (side). Pillar peach: light `#E5BDA6`, mid `#D5A78B`, shade `#C79B82`. Character body `#F9F4EE` with a soft grey shade `#D9D2CA` and a white specular highlight; eyes `#160A00`. Floor footprint marks `#E3C8B6`. |
| Fonts | None. There is no text. |

## Timeline

| t (s) | On screen | Motion |
|---|---|---|
| 0.00–0.50 | Close framing (step spacing 103 px). The character has just landed on step 1. The peach pillar on the left sinks into the floor. | Step 1 cap fills ghost→orange. `pillar-rise-sink` (sink). The camera starts tracking. |
| 0.50–6.50 | Descending staircase of 16 bars. | `hop-and-paint` every **0.5 s** (landings at 0.5, 1.0, …, 6.5), with `squash-stretch-blob` and `impact-confetti`. `follow-cam-diagonal` pans with the character. The camera eases out slowly (step spacing 103 → 98 px, scale 1.0 → 0.95). |
| 6.50–8.00 | Last 7 bars | Hops still land every 0.5 s (7.0, 7.5, 8.0) but each one covers 2–4 bars. `paint-cascade` caps light up ahead with a stagger of 0.13–0.17 s (caps 10, 11, 12 at 7.03/7.17/7.37; 13–16 at 7.52/7.53/7.67/7.83). The camera **zooms out** 1.0 → 0.62 (easeInOutCubic) to reveal the whole chart. |
| 8.00–9.10 | The character lands on the floor at the foot of the chart. | `floor-tile-ripple` (8.08–8.9), confetti burst, the character bobs/settles. The camera holds at 0.62, then starts zooming back in. |
| 9.10–12.20 | The character rolls back to the upper-left along the base of the chart wall. | `roll-with-trail`: the ball spins (eyes come round every ≈ 0.35 s) and leaves a peach tint on the floor tiles it passes. The camera pans up-left following it and zooms back to 1.0 (scale 0.62 → 0.91 by 11.5 → 1.0 by 12.5). |
| 12.20–14.10 | Left end of the chart | `pillar-rise-sink` (rise): a peach block rises under the ball and grows into a tall pillar, carrying the ball to the top step's height. At the same time `paint-cascade` runs in reverse (**un-paint**): caps go from orange to ghost and vanish, one about every 0.1 s from the bottom of the chart upward (orange area 33 600 → 3 200 px between 12.9 and 14.05). The camera pushes in and re-frames the top of the chart. |
| 14.10–15.50 | The ball sits on the pillar, which has its own orange cap. The staircase is all white again. | Idle breathing: a slow 2-cycle bob (≈ ±8 px). The camera drifts slightly down. |
| 15.50–16.04 | — | The ball hops off the pillar onto step 1 (takeoff 15.5, landing 16.04 = frame 0). **Loop.** |

## Motion techniques

### `iso-bar-staircase` (scene build)
**Look:** a 3D bar chart on a tiled floor. There are N = 16 bars side by side along the floor X axis, each 1 cell wide and deep. Heights decrease linearly by 1 "segment" per bar, which makes a staircase. Each bar is a box with faint horizontal segment lines every 0.5 cell on its faces (stacked-block look). Unvisited bars have a **recessed top** (an inset tray 0.15 cell deep, lighter `#F9F5EF`). The floor is a grid of separate rounded tiles (cell 1.0, gap 0.06) on a slightly darker base.

**Projection (measured):**
- Floor X axis (along the chart) points down-right at about +18° on screen.
- Floor Z axis points up-right at about −30°.
- World Y is screen up.
- At scale 1 one step moves the cap by **(+103 px, +85 px)** on screen: one cell along X plus a 1-segment height drop.
- One cell is ≈ 155 px wide on screen at scale 1.

**Remotion/SVG:** write a small projector `P(x,y,z) => [ox + x*ax.x + z*az.x, oy + x*ax.y + z*az.y - y*k]` with `ax = (147,48)` px/cell, `az = (134,-77)` px/cell and `k = 150` px per unit height (tune these to the numbers above). Draw each box as 3 polygons (top, left face, right face), sorted back-to-front by `x - z` (painter's algorithm). Floor tiles are rhombus polygons drawn first. Use per-face flat colours from the palette, and add an AO gradient on the side faces (darker at the bottom, 6 %).

**Props:** `values[]` (bar heights, so any data series works), `cell`, `palette`, `segmentLines`, `recessTop`.

### `hop-and-paint`
**Look:** the character hops from the top of bar *n* to bar *n+1*, once per beat. On touchdown, the bar's cap materialises as a pale ghost block and then saturates to the accent colour.

**Measured** (60 fps; landing at t=0, screen eye-Y relative to landing, the camera compensates the pan):

| t | 0 | +0.05 | +0.10 | +0.15 | +0.20 | +0.25 (apex) | +0.30 | +0.35 | +0.40 | +0.45 | +0.50 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| y px | 0 | −5 | −33 | −46 | −57 | −61 | −60 | −54 | −43 | −26 | 0 |

- **Period 30 f (0.5 s).** The arc is a near-parabola with a slightly late apex (≈ 0.27 s), so the drop into the landing is faster.
- Horizontal world motion is linear over the hop.
- **Cap paint:** the cap is a box 1 cell × 0.45 cell tall on top of the bar.
  - Frame 0 (touchdown): the ghost cap appears at ≈ 35 % opacity in `#F7DAC9`.
  - Frames 0→5: opacity rises to 100 % and the colour goes `#F7DAC9` → `#E48E6D` (easeOutQuad, ≈ 0.08 s).
  - No scale change; it materialises in place.
  - The ghost actually appears 1–2 frames *before* contact, as anticipation.

**Remotion:**
```
const k = Math.floor((f - f0) / 30); const p = ((f - f0) % 30) / 30;
pos = lerp(top(k), top(k+1), p); pos.y += 61 * 4 * p * (1 - p) * skew(p);   // skew moves apex to .55
capProgress_n = clamp((f - landFrame_n + 2) / 6);
capColor = mix('#F7DAC9', '#E48E6D', easeOutQuad(capProgress_n)); capOpacity = .35 + .65 * capProgress_n;
```

**Props:** `beatFrames=30`, `hopHeight`, `accent`, `ghost`, `apexBias=0.55`.

### `squash-stretch-blob`
**Character:** a sphere of radius ≈ 0.28 cell (≈ 42 px at scale 1). Body `#F9F4EE`, with a radial shading to `#D9D2CA` at the lower-right and a specular dot at the upper-left. Two vertical black oval eyes (6×11 px, 14 px apart) placed slightly below the centre on the camera-facing side. Soft contact shadow ellipse below it.

**Deformation:**

| Phase | Timing | Scale X / Y |
|---|---|---|
| Landing squash | frames 0–2 | sx 1.35, sy 0.70; pivot at the contact point; eyes squash too |
| Takeoff stretch | frames 4–8 | sx 0.90, sy 1.12 |
| Neutral | by about frame 10 | 1 / 1 |

At a hard landing (the floor, 8.0 s) the squash is stronger (sy ≈ 0.5) and the eyes are hidden for 5 frames (squeezed or blinking).

**Remotion:** `sy = interpolate(pf,[0,2,5,8,12],[0.7,0.7,1.12,1.0,1.0])`, `sx = 1/sqrt(sy)` (volume preserving), `transform-origin` at the bottom of the ball.

**Props:** `squash`, `stretch`, `eyeBlink`.

### `impact-confetti`
On each landing, 3–6 tiny square particles burst from the contact point. They are 5–9 px, coloured accent `#E48E6D` and ghost `#F7DAC9`. Initial velocity is up and outward (60–140 px/s), with gentle gravity (≈ 300 px/s²), random spin, a life of 0.25–0.4 s, and a fade over the last 40 %. The bigger floor landing (8.0 s) spawns about 12 particles. **Props:** `count`, `colors`, `speed`, `life`, `seed`.

### `paint-cascade` (and reverse `unpaint-cascade`)
**Look:** caps light up along the remaining bars in a staggered domino ahead of the character. In reverse, caps fade back to ghost and vanish one by one.
- Forward stagger ≈ **8–10 f (0.13–0.17 s)** per bar, each with the same 6 f ghost→accent ramp.
- Reverse stagger ≈ **6 f (0.1 s)** per bar, running from the lowest bar toward the top. Each cap ramps accent → ghost → opacity 0 over 8 f.

**Remotion:** `capProgress_i = clamp((f - start - i*stagger)/6)`; reverse with `1 - clamp(...)`, ordered by `N-1-i`.

**Props:** `stagger`, `direction`, `rampFrames`.

### `floor-tile-ripple`
**Look:** when the character slams onto the floor, the floor tiles around the impact pop up and tint peach in an expanding ring, then settle back.
- Each tile's lift is `h = A·exp(−((d − v·t)/w)²)·decay(t)`, where `d` is the tile's distance from the impact in cells.
- **A ≈ 0.25 cell**, wave speed **v ≈ 6 cells/s**, ring width **w ≈ 0.8 cell**, overall decay over **0.8 s** (8.08 → 8.9).
- The tint follows the lift: `mix(tileColor, '#F0D6C4', h/A)`.
- Tiles lift as rigid prisms, so their side faces show (draw the side faces when h > 0). A random ±20 % amplitude jitter per tile breaks the regularity. Maximum radius ≈ 5 cells.

**Props:** `origin`, `amplitude`, `speed`, `width`, `duration`, `tint`.

### `roll-with-trail`
**Look:** the ball rolls along the floor (along −X at the base of the wall) at about **3.3 cells/s** (screen ≈ 300–400 px/s at the current scale). Its rotation matches the distance travelled (`angle = dist/r`), so the eyes come round to the front every ≈ 0.35 s; draw the eyes only when the facing angle is within ±50°. Every floor tile it touches turns peach `#F0D6C4` (the trail) and stays tinted, fading back over about 3 s. Speed eases in over 0.3 s and eases out into the stop at 12.2.

**Remotion:** `x(t)` via easeInOut over the duration; `eyeVisible = cos(angle) > 0.64`; trail tiles are `tint_i = clamp(1 - (t - tTouched_i)/3)`.

**Props:** `path`, `speed`, `trailColor`, `trailFade`.

### `pillar-rise-sink`
**Look:**
- **Rise:** a peach box (1×1 cell footprint) grows upward out of the floor under the character from 12.25 to ≈ 14.1 s (**1.85 s, easeInOutCubic**) until its top matches the first bar plus one step. The ball rides on top, with a tiny squash when the rise stops. The top gets an orange cap at ≈ 14.0 (same paint ramp).
- **Sink:** after the ball leaves (0.0–0.5 s), the pillar lowers into the floor (easeInQuad, **0.5 s**). Its cap fades from accent to ghost as it goes down. A faint peach footprint `#E3C8B6` stays on the floor tile.

Pillar colours: light `#E5BDA6`, mid `#D5A78B`, shade `#C79B82`.

**Props:** `height`, `riseFrames=111`, `sinkFrames=30`, `colors`.

### `follow-cam-diagonal`
**Look:** the camera tracks the character down the diagonal at constant speed, keeping it near (920–1060, 450–585) on screen (slightly above and right of centre, drifting lower-right as the scale eases out).
- Pan speed during the descent: **(−206, −170) px/s** at scale 1 (one step every 0.5 s).
- Zoom keys (step spacing in px): 0 s 103 → 6 s 99 → 6.5 s 98 → 7.0 s 87 → 7.5 s 71.5 → 8.0 s 63.6 → 9.0 s 66 → 9.5 s 70 → 10 s 78 → 11 s 85 → 11.5 s 91 → 12.5 s 101 → 13 s 102 (= the 0 s framing).
- The camera move is smooth (no shake). Easing is in-out between keys. During 13–14 s the framing moves up with the rising pillar so that frame 960 matches frame 0.

**Remotion:** `scale = interpolate(t, keyT, keyScale, {easing: Easing.inOut(Easing.cubic)})` and `translate = -charScreenTarget + lerp(...)` with a small lag: `cam += (target - cam) * 0.15` per frame, done deterministically by pre-integrating a damped follow. For a loop, make sure all camera keys at t = 0 and t = T are equal.

**Props:** `followLag=0.15`, `zoomKeys`, `frameOffset`.

### `seamless-loop-structure`
The whole piece is a **cycle that resets itself**: descend and paint, a release at the bottom, travel back, lift up and un-paint, re-enter. Frame 960 equals frame 0 because:
1. The state matches: the ball is on step 1, the pillar is sinking, the caps are empty.
2. The camera keys match.
3. All periodic motions (the 30 f hop) divide the loop length.

Use this as a template for any looping explainer. **Props:** `totalFrames`, phase durations `{descend, release, return, reset}`.

## Transitions

None (one continuous shot). The "transition" is the loop seam at 16.04 → 0.00, hidden inside a hop.

## Camera

A single virtual camera with dimetric projection: the floor X axis at ≈ +18° down-right, the Z axis at ≈ −30° up-right, and a very mild perspective (the far floor recedes into a soft fog/vignette at the top-right).
- Diagonal follow pan at ≈ 270 px/s during the descent.
- Zoom range 1.0 ↔ 0.62.
- Pan up-left along the wall during the return.
- No rotation, no parallax layers: it is all one 3D scene, with the tile grid giving the depth cue.
- A vignette overlay is screen-locked: a radial gradient centred at the upper-right (1500, 200) going from `#EFE8DE` to `#D5CBBF` at the corners.

## Library candidates

- `iso-bar-staircase`: data-driven isometric 3D bar chart (any series) for metric stories.
- `hop-and-paint`: a character or token progresses through items one by one, marking each as done.
- `squash-stretch-blob`: an expressive, minimal mascot for any explainer.
- `impact-confetti`: a small celebratory burst on any landing, tap or completion.
- `paint-cascade`: staggered highlight sweep across a row of items (progress or reset).
- `floor-tile-ripple`: shockwave on a tiled surface for impact or "a big moment happened".
- `roll-with-trail`: shows a path or journey with a fading breadcrumb tint.
- `pillar-rise-sink`: an elevator/podium that lifts or lowers a subject ("level up / reset").
- `follow-cam-diagonal`: a smooth damped follow-camera with zoom keys for any tracked subject.
- `seamless-loop-structure`: a recipe for perfectly looping hero animations (social loops, website backgrounds).
