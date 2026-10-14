# video18 — "Samurai Duel: Dot-Matrix Remix" (generative halftone / particle music-video montage)

## Overview

| Property | Value |
|---|---|
| Resolution | 1920 × 1080 |
| FPS | 24 (481 frames) |
| Duration | 20.10 s |
| Audio | none in file; edit rhythm implies ≈125–130 BPM (main beat ≈ 0.46–0.5 s = 11–12 frames, half-beat 5–6 frames, frame-by-frame stutter bursts) |

**Story / content.** A single short source clip, an illustrated painterly fight with a samurai woman in a red kimono and a schoolgirl in a navy uniform on a flat vermilion background, is remixed through a rapid-fire chain of procedural image-processing styles. Styles include LED dot-matrix, halftone duotones, glowing particle point clouds, 3D voxel depth extrusion, bokeh bursts, metaballs, chromatic RGB split and rainbow time-echo trails. The montage cuts or morphs styles on the beat, frequently every 1–6 frames. It opens and closes on giant zoomed dots.

**Art style.** "Data-moshed pop halftone": every frame is the source footage resampled onto a grid of circles. The style varies along a few axes: grid pitch, dot size from luminance vs. colour, flat background colour, glow, depth jitter and temporal echo. The figures are matted out of the background (the original vermilion background is keyed away and replaced by a flat colour or black). Strong chromatic aberration and occasional white flash frames.

**Palette (sampled):**

| Role | Hex |
|---|---|
| Source background vermilion | `#E04435` / `#DD4832` |
| Source kimono red | `#A53A31` |
| Source navy uniform / teal shadows | `#062323`, `#1A251A`, teal `#2E5D63` (est.) |
| Source skin highlight | `#ECAD91`, `#C1927D` |
| LED-matrix background dot red | `#972C21` on black `#030300` |
| Halftone paper cream | `#FAF1DE` |
| Halftone navy ink | `#29254A` |
| Pop yellow | `#F7F00B` |
| Pop cyan | `#15FFFD` |
| Electric blue | `#2321F5` |
| Magenta-crimson | `#EC0742` / `#EB1458` |
| Orange | `#F2823F` |
| Red-orange | `#EF5E30` / `#F35F30` |
| Deep navy (gold particle bg) | `#09071F` |
| Deep violet (violet particle bg) | `#08001B` |
| Gold particle | core `#FFFEF4`, body `#EAC396` |
| Violet particle | core `#FFFFFF`, body `#FEE8FE` with `#D48AE8` glow (est.) |
| Pure black | `#030303` |

**Fonts.** None (no typography in the piece).

**Layout.** Full-bleed. The figures sit centre or slightly right on a horizontal ground line at ≈ 0.85 H. Dot grids are screen-aligned (except one tilted "LED screen" shot, rotated about −4°).

## Timeline

Cuts were measured by frame differencing (threshold 28/255). The montage has ~200 detected changes in 20 s; the table groups them into phrases.

| Start–End (s) | On screen | What moves | Transition |
|---|---|---|---|
| 0.00–0.70 | Source clip: samurai lunges at the kneeling girl on vermilion; 0.50 is a one-frame flash of the LED dot-matrix version | Source motion plus a slight handheld drift (~30 px/s down) | Stutter |
| 0.70–1.00 | Stutter: 1–3 frame alternation of source / dot-matrix / bokeh | — | Bokeh burst |
| 1.00–1.25 | Bokeh burst: blurred red/teal/cream discs fly outward past camera (zoom-through) | Radial expansion, discs scale ×3 | Hard cut |
| 1.25–1.95 | Giant LED dot-matrix (pitch ≈ 150 px, 13 × 7 dots), dots coloured by the source; background cells are smaller red dots `#972C21`; the figure flickers at ~12 fps | Mosaic updates at the half-frame rate; slight dot jitter | `dot-zoom-punch` 1.90–2.08: grid scales ×3 until 4–5 dots fill the frame, RGB fringe and glow on dot edges |
| 2.08–3.05 | `resolution-ramp`: dot-matrix pitch steps down 150 → 90 → 60 → 40 → 26 px on half-beats; the figure becomes legible | Steps at ~2.17, 2.29, 2.5, 2.62, 2.75, 3.0 | Cut |
| 3.08–3.13 | Navy halftone on cream (pitch 29 px, dot radius ∝ darkness) | — | Cut |
| 3.13–3.60 | Alternating: pink voxel stipple on black, gold particles on navy | 1–3 frame switches | — |
| 3.60–3.95 | Red-orange stipple close-up (pitch ~13 px) | Zoom-in drift | — |
| 4.00–4.20 | Black halftone on pop yellow `#F7F00B` | — | Cut |
| 4.25–4.70 | 3D point cloud (colour dots with depth) → white glowing particles with radial streaks | Points scatter with short motion streaks | Cut |
| 4.75–5.10 | `led-screen-tilt`: the source clip on a tilted dark-red LED panel (−4°), fine dot screen (pitch ~8 px), RGB edge fringes; then a close-up of the orange dot screen | Panel push-in | Cut |
| 5.17–5.90 | Frame-by-frame strobe (each 1 frame): white particles on black, gold particles on navy, violet particles on deep violet, cycling | Particle sizes randomise per frame | Cut |
| 5.90–6.10 | Navy halftone on cream | — | Colour cut |
| 6.12–6.30 | White halftone on crimson `#EC0742` | — | — |
| 6.33–6.55 | White halftone on electric blue `#2321F5` | — | — |
| 6.55–6.65 | `metaball-blobs`: dark gooey blobs (merged circles, R/G-split rims) on orange `#F2823F` | Blobs swell | — |
| 6.65–7.15 | Black halftone on red-orange `#EF5E30`, close-up faces | Slow push | — |
| 7.17–7.60 | Bokeh/particle field strobe (red/teal/cream depth-of-field discs) | Discs drift outward | — |
| 7.50–7.90 | Black halftone on cyan `#15FFFD`, then on yellow | 1–2 frame alternation | — |
| 8.00–8.20 | Big orange pixel blocks plus dots (low-res mosaic, square cells ~90 px) | — | — |
| 8.25–8.75 | Gold particles; navy halftone on white; white halftone on blue (fine pitch ~12 px) | Strobe | — |
| 9.00–9.80 | `depth-pointcloud`: two fighters as dense 3D dot clouds (colour from source, RGB-split), camera orbiting slightly; alternates with white particles and red stipple | Points jitter in z | — |
| 10.00–10.30 | Red noise stipple (very fine, ~6 px), gold particles | — | — |
| 10.50 | `flash-frame`: white bg, RGB-split dark particle silhouette | 1–2 frames | — |
| 10.75–11.20 | Voxel extrusion: figures as columns of beads (depth from luminance), samurai sword visible | Slow rotation | — |
| 11.25–11.70 | Violet / white glowing particles forming the figure | Strobe | — |
| 11.75–12.25 | `particle-disintegrate`: pink voxel figure dissolves into white dots blowing right | Particles drift +x with turbulence | — |
| 12.50 | `flash-frame` (white, RGB-split silhouette) | 2 frames | — |
| 12.75–13.05 | `horizontal-smear`: particles stretched into horizontal streaks (pink, gold) | Streak length ~100–300 px | — |
| 13.25–13.50 | Red/teal particle cloud dissolving | — | — |
| 13.55–13.95 | White halftone figures on electric blue → `chroma-echo-trail` begins; white `metaball-blobs` glow | Echo copies trail | — |
| 14.00–14.45 | Black halftone + rainbow echoes on orange `#F35F30` (one white-bg flash at 14.25) | Samurai charges left→right; ~8 delayed copies | Colour cut on beat (0.46 s) |
| 14.46–14.90 | White halftone + echoes plus white metaballs on crimson `#EB1458` | — | Beat cut |
| 14.92–15.40 | Black halftone + echoes on yellow `#F7F00B` | — | Beat cut |
| 15.42–15.85 | Black halftone + echoes on cyan `#15FFFD` | — | Beat cut |
| 15.88–16.25 | Navy halftone + echoes on cream `#FAF1DE` | — | Cut |
| 16.25–16.40 | Blurred source with heavy chromatic aberration (teal figure on black) | — | — |
| 16.40–17.30 | Bokeh burst (radial streaks) → drifting bokeh discs → dense particle field | Radial zoom outward | — |
| 17.30–17.85 | Particle field (red/teal streaks) condensing into two figure silhouettes | Particles converge | — |
| 18.00 | `flash-frame`: white bg, black silhouette with RGB fringe | 2 frames | — |
| 18.25 | `led-screen` source frame (fine dot screen) | — | — |
| 18.40–19.40 | White dot clusters on black (dot-matrix with only bright cells) alternating with coloured LED matrix (pitch 40 px) | Clusters dissolve | — |
| 19.45–19.85 | `dot-zoom-punch`: matrix pitch ~40 → 80 → 300+ px; final frame has 3 huge white dots plus a sparse dot grid | Scale-up | — |
| 19.88–20.10 | Black | — | End |

## Motion techniques

All styles share one core: **sample the source frame on a grid and draw a primitive per cell**. In Remotion, render each frame of the source video into a hidden `<canvas>` (or `OffthreadVideo` plus `useCurrentFrame` with canvas `drawImage`), read pixels with `getImageData` at grid resolution, then draw circles to a visible canvas, or as SVG for small grids. Pre-compute a figure matte: luminance/chroma key of the vermilion bg (hue ≈ 5°, sat > 0.6, value > 0.75 → background) or a provided alpha video.

### `led-dot-matrix`
**Looks like:** a black panel filled with a perfect grid of circles. Cells inside the figure matte are drawn at full size in the cell's average source colour. Background cells are drawn as smaller dots in a dim background colour (`#972C21` on black), like an LED billboard.

**Parameters:**
- Pitch at 1080p: 26 px (74 × 41 cells) for the "legible" state, up to 150 px for the abstract state.
- Figure dot diameter = 0.92 × pitch; background dot diameter = 0.55 × pitch.
- Colour = mean RGB of the cell, contrast +20 %, no glow (except the zoom state).
- Mosaic refresh can run at half frame rate (hold 2 frames) for a "low-fps" LED feel.

**Recipe:**
```ts
for (let gy=0; gy<rows; gy++) for (let gx=0; gx<cols; gx++) {
  const c = avgColor(src, gx*p, gy*p, p, p); const inFig = matte(gx,gy) > .5;
  ctx.fillStyle = inFig ? boost(c) : bgDot;
  ctx.beginPath(); ctx.arc(gx*p+p/2, gy*p+p/2, (inFig?.46:.275)*p, 0, 2*Math.PI); ctx.fill();
}
```
**Props:** `pitch`, `bgDotColor`, `panelColor`, `figureScale`, `bgScale`, `holdFrames`.

### `resolution-ramp`
**Looks like:** the dot-matrix pitch steps down on the beat grid so the image goes from abstract to legible.

**Measured:** pitch ≈ 150 px (1.25–2.0 s) → ~90 (2.3) → ~60 (2.6) → ~40 (2.75) → 26 (3.0). Steps are quantised to half-beats (5–6 frames). It is a hard step, not a tween. The same idea is used in reverse at the end (40 → 300 px).

**Recipe:** `pitch = steps[floor((t - t0)/stepDur)]`. Optionally add a 2-frame scale overshoot (×1.08) at each step.

**Props:** `pitches[]`, `stepDuration`, `reverse`.

### `dot-zoom-punch`
**Looks like:** the dot grid scales up around the centre until only 3–6 dots fill the frame. Dot edges get a soft glow (blur 8 px) and an R/G/B fringe offset (±4 px). Used as a transition in and out of dot-matrix sections.

**Measured:** 1.90–2.08 (≈4 frames, scale ×3–4) and 19.45–19.85 (pitch 40 → 300 px, `easeInCubic`).

**Recipe:** render the matrix to an offscreen canvas, then `drawImage` scaled about the centre. Glow is the same canvas blurred and composited with `lighter`. The RGB split draws each channel separately with x offsets.

**Props:** `scaleTo`, `duration`, `glow`, `rgbSplit`.

### `halftone-duotone`
**Looks like:** a classic print halftone. Flat solid background colour; ink dots on a square (0°) grid whose radius encodes luminance (darker means a bigger dot for dark ink on light paper, the reverse for white ink on colour). Only the matted figure is drawn; the background is the flat colour.

**Parameters:**
- Pitch 12–29 px (fine ~13 px for wide shots, ~29 px for close-ups).
- `r = 0.5 × pitch × sqrt(1 − L)` for dark ink, clamped to [0.08, 0.62] × pitch so neighbours touch in the shadows.
- Pairings used:

| Paper | Ink |
|---|---|
| `#FAF1DE` cream | `#29254A` navy |
| `#F7F00B` yellow | `#030303` |
| `#15FFFD` cyan | `#030303` |
| `#EF5E30` / `#F35F30` orange | `#030303` |
| `#2321F5` blue | `#FFFFFF` |
| `#EB1458` crimson | `#FFFFFF` |

**Recipe:** as for `led-dot-matrix`, but the radius comes from luminance and the colour is a single ink. Skip cells with matte < 0.5. A slight gamma (L^0.8) keeps midtones.

**Props:** `paper`, `ink`, `pitch`, `invert`, `minDot`, `maxDot`.

### `luma-particle-glow`
**Looks like:** the figure rendered as scattered glowing round particles on a very dark background. Bright areas produce bigger, brighter particles. Particle positions are jittered off-grid, with sizes randomised per frame (shimmer). Variants: white on black, gold on navy `#09071F`, violet/pink on `#08001B`.

**Parameters:**
- Base grid pitch 10–14 px, jitter ±0.5 pitch.
- Particle radius `= rand(0.2, 1.0) × L² × 18 px` (range 1–18 px); cells with L < 0.25 are dropped.
- Glow: duplicate layer blurred 10 px at 70 % with `lighter` blend.
- Colour: lerp(bodyColor, core white, L).
- Reseed every frame (or every 2 frames) for sparkle.

**Props:** `pitch`, `maxRadius`, `bodyColor`, `bgColor`, `glow`, `reseedEvery`.

### `depth-pointcloud`
**Looks like:** the figures rebuilt as a 3D cloud of small coloured beads. Each bead is pushed toward the camera by its luminance (bright = nearer), so the image has relief. The virtual camera slightly orbits/tilts (±8°), revealing columns and extrusion. Edges carry RGB-split fringes; beads near the camera are larger.

**Parameters:** grid pitch 8 px (≈32 000 points), depth `z = L × 250 px`, perspective focal length 1200 px, bead radius 2–5 px scaled by perspective, orbit yaw ±8° over 1 s with `easeInOutSine`. Voxel variant (10.75 s): draw each sample as a short vertical column of 3–4 beads (extrusion).

**Recipe:** project `(x, y, z)` with yaw/pitch rotation about the frame centre, then painter-sort by z and draw circles (canvas). Sample colour from the source pixel.

**Props:** `pitch`, `depthScale`, `orbitAngle`, `beadSize`, `extrusionCount`.

### `particle-burst-zoom` (bokeh burst)
**Looks like:** an explosion of large, soft, defocused discs (bokeh) in the source palette (vermilion, teal, cream, dark green) flying radially outward from the centre toward the camera. They grow from ~10 px to 300+ px with motion-blur streaks pointing at the centre. Used as a transition (1.0–1.25, 16.4–16.75) and as a drifting field afterwards.

**Parameters:** ~400 particles; for each, z goes from 1 → 0.1 over 0.25–0.35 s. Screen position = centre + dir × (r0 / z); radius = r_base / z; opacity fades as it nears the camera; blur = 6 px + radial streak of length ∝ velocity (draw 4 ghost discs). Colours are sampled from random source pixels.

**Props:** `count`, `duration`, `palette (from source)`, `streak`, `focusBlur`.

### `metaball-blobs`
**Looks like:** gooey merged circles (big radius 40–130 px) forming the silhouette as a dark or white mass. Blobs fuse with smooth necks. Outer rims carry an R/G channel split (red offset left/up, green offset right/down) and a soft glow. White glowing variant on crimson/blue.

**Recipe:** SVG "gooey" filter: blur the circles (stdDeviation 18) then `feColorMatrix` alpha `0 0 0 22 -9` to threshold, then composite. Circles are sampled from the matte at pitch 60 px with radius ∝ local density. Swell radius ×1.3 over 4 frames.

**Props:** `pitch`, `radius`, `color`, `goo`, `rgbSplit`.

### `chroma-echo-trail`
**Looks like:** the moving figure leaves 6–10 delayed copies (time echoes) behind it, each copy rendered in the same halftone but tinted along a rainbow cycle (cyan → blue → magenta → orange → yellow). The current frame is drawn on top in the main ink colour. It reads like a stroboscopic motion trail. Combined with background colour cuts on every beat (0.46 s).

**Parameters:** echo delays k = 1…8 frames, spaced 2 source frames apart; opacity `0.85 × (1 − k/9)`; tint hue `h = (200 + 40k) % 360`, saturation 0.7, applied via multiply on white dots or replacing the ink colour. Draw order oldest → newest.

**Recipe:** in Remotion, render the halftone of `frame − 2k` for each k (deterministic, because the source is a video). Tint by setting the dot fill to `hsl(h, 80%, 60%)`.

**Props:** `echoCount`, `echoSpacingFrames`, `hueStart`, `hueStep`, `fade`.

### `rgb-split-flash` (`flash-frame`)
**Looks like:** 1–2 frames of near-white background with the figure as a black silhouette (inverted / threshold). Strong red/cyan channel offsets (±8–12 px) and glow. Punctuates beats (10.5, 12.5, 18.0).

**Recipe:** threshold the matte or luminance → black on `#FFFFFF`. Draw three copies with `mix-blend-mode: multiply` tinted cyan/magenta/yellow, offset (−10, 0), (+10, 0), (0, +4).

**Props:** `offset`, `frames`, `invert`.

### `particle-disintegrate`
**Looks like:** the voxel/pink figure breaks apart from one side. Particles detach and blow sideways (+x) with turbulence, shrinking and turning white, leaving a sparse trail.

**Parameters:** a detach front sweeps across the figure in 0.4 s. Each particle's velocity is +x 400–900 px/s plus curl-noise turbulence of 80 px amplitude; its radius shrinks to 0.3× over 0.6 s.

**Recipe:** `p_i(t) = p_i0 + v_i (t − t_i) + noise2D(p_i0 × 0.01, t) × 80`, where `t_i` = detach time from `(x_i − x_min)/width × 0.4`.

**Props:** `direction`, `speed`, `turbulence`, `sweepDuration`.

### `horizontal-smear`
**Looks like:** particles stretched into horizontal streaks (like a long-exposure pan or a scanline glitch), coloured pink/gold, with bright heads.

**Recipe:** draw each particle as a rounded line from `x − len` to `x` with a horizontal opacity gradient; `len = 100–300 px` random per row band, so the streaks align in row bands of 20–40 px.

**Props:** `length`, `bandHeight`, `colors`.

### `led-screen-tilt`
**Looks like:** the full-colour source clip seen on a tilted LED panel: a fine dot screen (pitch ~8 px, dots 0.8 × pitch) over a dark-red base, rotated ~−4° and slightly smaller than the frame (black corners visible), with a slow push-in.

**Recipe:** a `led-dot-matrix` with a small pitch inside a `<g transform="rotate(-4) scale(1.02→1.08)">`.

**Props:** `angle`, `pitch`, `pushIn`.

### `beat-style-shuffler` (editorial engine)
**Looks like:** the whole video is an edit list cycling these styles in sync with music. Phrase structure: hold 10–17 frames on a style, then a burst of 1-frame alternations (8–24 frames long), then a colour-cut series on beats (11–12 frames each).

**Recipe:** build a deterministic sequence `[{start, end, style, params}]` from a BPM and a seed. Use 1-frame strobe bursts at bar ends. Rotate background colour through `[cream, yellow, cyan, blue, crimson, orange]` on beats. Insert a `flash-frame` on downbeats every 2 bars.

**Props:** `bpm`, `seed`, `styles[]`, `burstProbability`, `palette`.

## Transitions

- **Hard cuts on beat** dominate (main beat ≈ 0.46–0.5 s; colour-cut series at 13.79, 14.0, 14.46, 14.92, 15.42, 15.88).
- **Frame strobes:** 1-frame alternations between styles (e.g. 5.17–5.88, 8.21–8.71, 9.38–9.83, 12.0–13.17).
- **`dot-zoom-punch`** in/out of matrix sections (1.9, 19.45).
- **`particle-burst-zoom`** as zoom-through transitions (1.0, 16.4).
- **`flash-frame`** white inversions on downbeats (10.5, 12.5, 18.0).
- Fade to black only at the very end (19.88).

## Camera

- The source clip has a slight handheld drift (~30 px/s vertical, small zoom jitter ±1.5 %/frame-pair in the opening).
- Effect-space camera moves: slow push-ins on halftone close-ups (~3 %/s); a ±8° orbit in `depth-pointcloud`; radial zoom-through in bokeh bursts; scale-up in `dot-zoom-punch`; −4° tilt on `led-screen-tilt`.
- Layers: (1) flat bg colour, (2) echo copies, (3) current-frame dots, (4) glow/additive layer, (5) RGB-split / flash overlay. No true parallax.

## Library candidates

- `led-dot-matrix`: turn any footage or image into an LED-billboard dot display.
- `resolution-ramp`: beat-synced "focus pull" from abstract mosaic to legible image.
- `dot-zoom-punch`: transition by zooming into a dot grid until dots fill the screen.
- `halftone-duotone`: pop-art print look for footage, portraits and product shots.
- `luma-particle-glow`: glowing sparkle rendition of a subject (gold/violet/white variants).
- `depth-pointcloud`: fake-3D point cloud/voxel relief from any 2D frame.
- `particle-burst-zoom`: bokeh explosion zoom-through transition.
- `metaball-blobs`: gooey blob silhouettes for liquid/organic transitions.
- `chroma-echo-trail`: rainbow stroboscopic motion trails for action shots.
- `rgb-split-flash`: 1–2 frame inverted flash with chromatic aberration for beat hits.
- `particle-disintegrate`: "Thanos snap" dissolve of a subject into drifting particles.
- `horizontal-smear`: streaky long-exposure glitch transition.
- `led-screen-tilt`: present footage as if on a tilted LED wall.
- `beat-style-shuffler`: music-synced edit engine that rotates styles, colours and strobes deterministically.
