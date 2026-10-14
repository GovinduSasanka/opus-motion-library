# video8 — "every pixel you just saw is math" (procedural mountain build-up)

## Overview

| Property | Value |
|---|---|
| Resolution | 1280 x 720 (16:9) |
| FPS | 24 (1032 frames) |
| Duration | 43.05 s (the file has an AAC audio track; the end card credits "music" as code too) |
| Story | A photoreal sunrise over a Himalayan-style peak is revealed to be code. A glitch rewinds the scene to a flat grey plane, then the world is rebuilt in 9 labelled stages (NOTHING, NOISE, FRACTAL, EROSION, MATERIAL, SUN, ATMOSPHERE, CLOUDS, LENS). An IDE panel types the code for each stage and the 3D view updates in sync. Then a long cinematic fly-past of the finished peak over a cloud sea, and an end card. |
| Art style | Real-time raymarched heightfield terrain (Shadertoy-like, e.g. iq's "Elevated" or "Rainforest"), physically based sky, volumetric clouds, post FX (bloom, film grain, lens ghosts). The UI is a dark, semi-transparent "code editor" overlay with a minimal Swiss-style title block. |
| Fonts | Titles: geometric/neo-grotesk sans (Inter / SF Pro Display), Bold, ALL CAPS, tracking about +0.12em. Captions: same family, SemiBold, lowercase. Code, counters and stats line: monospace (JetBrains Mono / SF Mono), Regular. |

### Palette (sampled)

| Role | Hex |
|---|---|
| Opening sky, zenith → horizon (column x=20) | `#4c545b` → `#6c6e6b` → `#8e8662` → `#a79127` → `#af8a0e` (golden horizon band at about 30–33% H) |
| Opening cloud sea (shadow) | `#444759` |
| Sunlit rock (orange alpenglow) | `#9a5133` to `#d29b48` |
| "Unlit" stage sky (grey studio) | `#9898a0` top → `#7e818a` at the horizon |
| Unlit terrain (clay/white) | `#b9b9b9` – `#bcbcbc` |
| Code panel body | `#45464b` (about 85% opaque over the scene) |
| Code panel header bar | `#4f5055` |
| Traffic lights | red `#dd5d5d`, amber `#dfac2e`, green `#2ead4a` |
| Line numbers | `#5b5c61` |
| Syntax: keyword/type (purple) | about `#b898d8` |
| Syntax: function/identifier (blue) | about `#88a0d8` |
| Syntax: numbers (orange) | about `#e0a860` |
| Syntax: default text | `#d8dade` |
| Title text | `#f4f4f4` plus a soft dark drop shadow |
| Progress dash, active / inactive | `#f0f4f6` / `#a0a3ac` (about 45% alpha) |
| End-card sky / sun core / horizon / clouds / bottom scrim | `#b2b3b8` / `#f3f1ef` / `#ddcd68` / `#c19464` / `#13161d` |
| "it's code…" interstitial text | `#0a0a0a` on the grey plane |

### Layout grid (720p reference)

- Safe margin: **48 px left (3.75% W)**. The title block and the code panel share this left edge.
- Title block, top-left:
  - counter `01 / 08` in mono 13 px, tracking +0.15em, at y=59 px
  - stage TITLE at cap-top y=83 px; cap height 28 px, so font size is about 39 px (5.4% H)
  - subtitle at y≈138 px, 20 px (2.8% H), white at 85%
  - progress bar at y=163 px: 9 dashes, each 21 px x 2 px, 3 px gap, total 210 px
- Code panel: x 48 → 808 px (59% W), bottom edge fixed at y=675 px (45 px from the bottom). It grows **upward** with line count. Radius 10 px. Header bar 34 px tall, with traffic lights (r=5 px) at x=66/84/102 and a centred mono 12 px filename (`world.glsl`, `terrain.js`, `post.glsl`). Body: line numbers at x=76, code at x=100, 17 px mono, line pitch 29 px, top padding 22 px, bottom padding about 30 px.
- Captions (opening): centred, baseline y≈620 px (about 85% H), 30 px SemiBold, white with a soft shadow.
- End card: headline centred at y≈505 px (70% H), 38 px Bold. Stats mono 15 px at y=572 (white 85%) and y=604 (white 55%). Credit "written by Claude" 18 px SemiBold at y=651.

---

## Timeline

| # | Start–End (s) | On screen | What moves | Transition out |
|---|---|---|---|---|
| 1 | 0.00–3.95 | Hero: golden-hour peak above a cloud sea. Captions "this is not a photo." (0.6–2.1), then "and it's not a video model." (2.25–3.95). | Very slow camera push-in/drift (frame diff about 0.3/255 per frame). Clouds drift slowly. Captions blur-fade in and out. | Glitch rewind (`glitch-layer-rewind`) |
| 2 | 3.96–4.60 | Glitch: horizontal slice displacement while the shading layers are stripped in reverse order (LENS → … → NOISE → flat). Black blocks show at the left/right edges. | Camera stays roughly fixed. Bands jump every frame. | Lands on the flat plane |
| 3 | 4.60–5.65 | Flat grey studio: horizon at 30% H, flat clay ground. Centred dark text "it's code. watch it get written." | Static | The title block and panel fade in over it |
| 4 | 5.67–6.00 | Stage 00 **NOTHING** / "a flat plane." Panel `world.glsl`: `float terrain(vec2 p) { return 0.0; }` | Overlay fades in over about 4 frames | 1–2 frame overlay blank (`stage-cut`) |
| 5 | 6.00–8.00 | Stage 01 **NOISE** / "one octave of noise." Code `return 1500.0 * noise(p / 2600.0);` | Code types out. The plane rises into soft dunes over 6.1→6.45 s. The interstitial text fades out (6.1–6.3). | Stage cut |
| 6 | 8.00–10.00 | Stage 02 **FRACTAL** / "twelve octaves. mountains." `terrain.js`, a 3-line fbm loop | Typing runs about 8.1–8.9. Mountains grow from 8.17 to 8.50 s; the peak spikes up. | Stage cut |
| 7 | 10.00–12.00 | Stage 03 **EROSION** / "10,485,760 simulated raindrops." 5 lines (droplet loop, deposit/erode) | Typing runs 10.1–11.3. Terrain gains gullies and smooths gradually (diff 0.3–0.7 per frame across 10.25–11.0). | Stage cut |
| 8 | 12.00–13.90 | Stage 04 **MATERIAL** / "rock. scree. snow." 3 lines (`mix(rock, scree, sediment)`, `smoothstep` snow, albedo) | Albedo pops in as one step at 12.0: grass green in the valleys, snow on the slopes | Stage cut (overlay plus a brief darker frame) |
| 9 | 13.92–15.90 | Stage 05 **SUN** / "a star, 8 light-minutes away." 3–4 lines (`softShadow`, `sunTrans`, lighting) | Frame darkens at 13.92. The sun direction then sweeps over about 1.2 s (14.1–15.3): long shadows rotate across the faces and the blue sky-fill appears. Typing finishes around 15.1. | Stage cut |
| 10 | 16.00–17.90 | Stage 06 **ATMOSPHERE** / "rayleigh · mie · ozone." 3 lines (`const vec3 BR = vec3(5.8e-6,13.5e-6,33.1e-6)`, …) | The sky changes from flat grey to the golden-hour gradient over about 0.4 s (16.0–16.4). Aerial perspective fogs the distant peaks. | Stage cut |
| 11 | 18.00–19.90 | Stage 07 **CLOUDS** / "volumetric. perlin-worley." 5 lines (raymarch loop) | The cloud sea fades and rises in from the valley floor over about 1.2 s (18.4–19.6) | Stage cut |
| 12 | 20.00–21.85 | Stage 08 **LENS** / "and a camera." `post.glsl`: `motionBlur(); depthOfField(); godRays(); lensFlare(); bloom(); filmGrain();` | Bloom, grain and vignette come on as the calls type | The overlay fades out (21.75–22.0) and is gone |
| 13 | 22.0–38.3 | Clean cinematic fly-past: the camera dollies forward and yaws right around the peak (22–30). It passes close by the dark north face (30–32), crests the ridge into direct sun with a rim light and hexagonal lens ghosts (32–33.7), then reveals the sunrise over the cloud sea (34–38). | Camera speed ramps up 22→25.5 s, eases slightly at 27–29, peaks again at 30.5–31.5, then decelerates to a slow drift by 34.5 s. The sun sits at about 57% W, 18% H. | Bottom scrim fades in |
| 14 | 38.4–42.45 | End card over the drifting sunrise: "every pixel you just saw is math." (in at about 38.9), stats line 1 (39.4), stats line 2 (40.1), "written by Claude" (40.9) | The bottom gradient scrim darkens over 38.5–39.2. Lines fade/blur in with a 0.6–0.75 s stagger. | Fade to black over 42.45–42.9 (about 0.45 s, ease-in) |

---

## Motion techniques

### 1. `blur-caption-swap`

**Look:** Lowercase centred captions fade in from a blur and fade out into a blur. One caption shows at a time, and the next starts as the previous ends.

**Parameters**
- In: 6 frames (0.25 s). Opacity 0→1; `filter: blur(8px)`→0; letter-spacing 0.02em→0 (optional); ease `cubic-bezier(0.22, 1, 0.36, 1)`.
- Hold: about 1.3 s.
- Out: 6 frames. Opacity 1→0, blur 0→8 px, ease-in `cubic-bezier(0.55, 0, 1, 0.45)`.
- The next caption starts on the frame after the previous one finishes, or overlaps it by 1–2 frames.
- Text style: white `#ffffff`, 30 px/720 (4.2% H), SemiBold, `text-shadow: 0 2px 10px rgba(0,0,0,.45)`, baseline at 86% H.

**Remotion:**
```ts
const p = spring({frame: f - start, fps, config: {damping: 200}, durationInFrames: 6});
const out = interpolate(f, [end - 6, end], [0, 1], clamp);
opacity = p * (1 - out);
blur = 8 * (1 - p) + 8 * out;
```

**Props:** `lines: {text, start, end}[]`, `yPct`, `fontSize`, `blurPx`, `fadeFrames`.

---

### 2. `glitch-layer-rewind`

**Look:** A "deconstruct" effect lasting about 15 frames (0.62 s). The finished render tears into horizontal bands that shift sideways. Within the bands you can see the build stages being peeled off in reverse: the lens grade goes, then the sunlight, then the material colour (green grass and white clay show through), then erosion, then fractal detail. It lands on the flat plane. Black rectangles appear wherever a band has slid inward from the frame edge. The caption is caught in the bands and dies with them.

**Elements:** N full-frame layers (one per build stage, newest on top) and a band mask generator.

**Parameters**
- Duration: 15 frames at 24 fps.
- Band count: 12–20 horizontal bands with random heights, 2–8% H each. Bands are re-randomised every 1–2 frames (seeded by `floor(frame/1.5)`).
- Horizontal offset per band: ±0.5–4% W. Bands are biased toward the frame edges, which reveals black `#000` slivers 1–3% W wide at the left and right borders.
- Stage stepping: in each band, show stage `s = round(lerp(N, 0, t) + bandJitter)` with `bandJitter ∈ {-1,0,+1}`. This means different bands show different stages at the same moment, which is the key to the look.
- A global luminance flash is optional. The mean brightness here jumps from 95 to 170 because the clay layers are bright.

**Remotion/SVG recipe:**
```tsx
// layers: React nodes or <Img> for each build stage, 0 = flat .. N = final
const t = (f - start) / 15;                       // 0..1
const seed = Math.floor((f - start) / 1.5);
const bands = makeBands(seed);                    // [{y, h, dx, jitter}]
return (
  <AbsoluteFill style={{background: '#000'}}>
    {bands.map(b => {
      const s = clamp(Math.round((1 - easeIn(t)) * N + b.jitter), 0, N);
      return (
        <div style={{position: 'absolute', top: b.y, height: b.h, width: '100%',
                     overflow: 'hidden', transform: `translateX(${b.dx}px)`}}>
          <div style={{position: 'absolute', top: -b.y}}>{layers[s]}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);
```
Use `random(seed + i)` from `remotion` for deterministic bands.

**Props:** `layers[]`, `durationFrames`, `bandCount`, `maxOffsetPct`, `edgeBlack`.

---

### 3. `stage-title-block`

**Look:** A top-left chapter header: a mono counter `NN / 08`, a big tracked uppercase TITLE, a subtitle, and a segmented progress bar of 9 dashes. On each stage change:
1. The previous title and subtitle disappear within 1–2 frames (a hard blank, not a fade).
2. The new title drops in from about 20 px above, clipped by a mask whose top edge sits just under the counter. It fades from 0 to 1 at the same time. Duration 5 frames (0.2 s), ease-out `cubic-bezier(0.16,1,0.3,1)`.
3. The subtitle fades in 4 frames later, over 4 frames (opacity 0→0.85).
4. The counter switches value instantly. The progress dash for the new stage turns from inactive `#a0a3ac@45%` to active `#f0f4f6` on the stage frame.

**Parameters:** Title 39 px Bold, tracking 0.12em, `text-shadow: 0 2px 8px rgba(0,0,0,.35)`. Counter 13 px mono, 70% white. Dashes 21x2 px with a 3 px gap.

**Props:** `stages: {title, subtitle, file}[]`, `index`, `total`, `accent`.

---

### 4. `ide-typewriter-panel`

**Look:** A macOS-style dark code window, semi-transparent, sitting bottom-left over the 3D scene. Each stage starts with an empty panel (line numbers only). The code then types character by character with a block cursor `▌` at the insertion point. The panel's height grows upward as lines are added. Its bottom edge stays fixed.

**Typing is time-boxed, not a constant speed.** Every stage finishes typing in about 1.0–1.2 s, whatever its length:
- NOISE: about 62 chars in about 0.9 s
- FRACTAL: about 150 chars in 0.75 s (≈200 cps, about 8 chars per frame)
- EROSION: about 150 chars in 1.15 s
- SUN: about 160 chars in 1.0 s

So `charsVisible = floor(total * ease(t))` with `t = (f - typeStart)/typeFrames`, `typeFrames ≈ 26` at 24 fps. The ease is close to linear, with a slight ease-out at the end. Whitespace-only runs (indentation) are emitted instantly.

**Cursor:** a solid block 9x18 px, colour `#e6e6e6`. It stays solid while typing, then blinks at 1 Hz (0.5 s on / 0.5 s off) after typing ends.

**Syntax colours:** keywords/types `#b898d8`, functions/identifiers `#88a0d8`, numbers `#e0a860`, comments `#7a7d85`, operators/default `#d8dade`. Tokenise with a tiny regex highlighter. Do not use a full parser.

**Panel:**
- Background `rgba(58,59,64,0.86)`, plus `backdrop-filter: blur(6px)` (optional).
- Radius 10 px, header 34 px `#4f5055`, traffic lights `#dd5d5d/#dfac2e/#2ead4a`.
- Centred filename in 12 px mono at 55% white.
- Lines at a 29 px pitch, line numbers `#5b5c61`.
- Panel height = `34 + 22 + lines*29 + 30`.
- When the line count changes, animate the height over 4 frames with an ease-out.

**Stage change:** the panel body clears to empty for 1–2 frames, with the filename and line numbers kept. A filename change is instant. On the first appearance the whole panel fades in over 4 frames.

**Props:** `code`, `language`, `filename`, `typeStart`, `typeDurationFrames`, `cursorBlinkHz`, `maxLines`, `width`, `anchor`.

---

### 5. `procedural-terrain-build` (the core 3D piece)

**Look:** A single raymarched heightfield whose look is driven by a "stage" uniform. Each stage adds one technique, and the change animates in sync with the typing.

| Stage | Visual change | Animation |
|---|---|---|
| 0 NOTHING | Flat plane `h=0`, grey sky `#9898a0→#7e818a`, clay shading `#b9b9b9`, simple Lambert plus ambient | — |
| 1 NOISE | One octave of value noise: amplitude 1500, wavelength 2600 (world units). Gives soft dunes. | Amplitude 0→1 over 8 frames, ease-out |
| 2 FRACTAL | 12-octave fbm with derivative damping (`a += b*n/(1+dot(d,d))`, iq style). Gives sharp peaks, with one hero peak centred at about 50% W. | Octave weight ramps 1→12 over 8 frames. The hero peak spikes upward. |
| 3 EROSION | Analytic or precomputed hydraulic erosion: gullies, smoothed scree fans | Blend 0→1 over about 24 frames (slow, gradual) |
| 4 MATERIAL | Albedo: rock `#6e6a66`, scree `#9a948c`, snow `#f2f2f2` where slope < 0.6 and height > threshold, grass `#4f6a3a` in the valleys | Instant switch on the stage frame |
| 5 SUN | Directional sun with soft raymarched shadows. The sun moves from high (overhead studio) to low golden (elevation about 6°, azimuth from the left). | Sun direction slerps over about 28 frames, ease-in-out |
| 6 ATMOSPHERE | Rayleigh `BR = (5.8e-6, 13.5e-6, 33.1e-6)`, Mie `1.6e-6`… in-scatter. Sky becomes zenith `#4c545b`, golden horizon `#af8a0e`, aerial haze on the distant peaks. | Crossfade about 10 frames |
| 7 CLOUDS | Volumetric low cloud sea below the peaks (Perlin-Worley density, 110 raymarch steps, Beer–Lambert) | Coverage 0→1 over about 30 frames. The clouds rise and fade in from the valley floor. |
| 8 LENS | Bloom (threshold 0.8, radius 8 px), film grain (σ≈0.04, re-seeded every frame), vignette (corners −25%), slight contrast S-curve, lens ghosts | Instant / 4 frames |

**Implementation options for Remotion:**
- **(a) WebGL fragment shader.** Use a `<canvas>` with a full-screen quad, or a `@remotion/three` `<ThreeCanvas>` with a `ShaderMaterial`. Uniforms: `uStage` (float, allowing fractional blends), `uSunDir`, `uCam`, `uTime = frame/fps`, `uSeed`. This is deterministic per frame, so it renders cleanly with Remotion. Use 128–200 march steps at 1280x720, which is fine for offline rendering.
- **(b) Cheap 2.5D SVG/canvas approximation**, when a GPU shader isn't wanted. Generate ridge-line silhouettes from 1D fbm (seeded noise) as 6–10 depth layers. Shade each layer with a vertical gradient. Fake the sunlight with a lit-side mask computed from the derivative of the ridge (lit when slope < 0 for a sun on the left). Clouds are blurred noise sprites between the layers. This gives the "fly-past" parallax without raymarching.

**Props:** `stage` (0–8, float), `seed`, `sunElevation`, `sunAzimuth`, `palette` (sky/rock/snow/grass), `cloudCoverage`, `heroPeakPos`.

---

### 6. `stage-cut` (overlay reset between stages)

**Look:** When a new stage begins, the UI overlay (title text and panel contents) vanishes for 1–2 frames, then rebuilds. The 3D scene behind it does not cut. On the SUN stage there is also a one-frame dip in scene brightness (mean 136 → 109).

**Recipe:** `overlayVisible = (f - stageStart) >= 2`. The panel chrome stays visible but its body is cleared. Use an optional `brightness(0.8)` on the scene for 1 frame.

**Props:** `blankFrames` (default 2).

---

### 7. `cinematic-flyby-camera`

**Look:** After the build, the camera performs one continuous move:
- 22–30 s: dolly forward and yaw right about 35° around the hero peak, keeping it on the right third.
- 30–32 s: pass close by the dark north face; the peak fills 60% of the frame.
- 32–33.7 s: crest the ridge. The sun pops out from behind the ridge line, giving a bright rim-light on the ridge silhouette (`#f2c35a`, 2–3 px), a lens flare streak, and a 4–5 ghost hexagon chain along the sun→centre axis.
- 34–38 s: ease out to a slow forward drift over the sunrise cloud sea.

**Speed profile** (mean frame diff as a proxy): ramps from 0 at 22.0 to a peak at 25.5. There is a lull of about 0.5 speed around 27.5–29, a second peak at about 31, then decay to a constant slow drift by 34.5 s. Model it as two overlapping `easeInOutCubic` segments on a Catmull-Rom camera path with 5 keys:

| t (s) | Camera action |
|---|---|
| 22 | start |
| 26 | yaw +20° |
| 29.5 | close pass |
| 33 | over the ridge, pitch −5° → +3° |
| 38 | wide reveal |

Then continue linearly at 0.02 units per frame for the end card.

**Lens ghosts:** 4–6 discs/hexagons along the line from the sun position S through the centre C, at positions `C + (C-S)*k`, `k ∈ {0.3, 0.5, 0.8, 1.1, 1.4}`. Radii 6–20 px, colours alternate amber/cyan, opacity 0.08–0.2, additive blend. Ghost visibility = `smoothstep` of the sun's unoccluded fraction.

**Props:** `path` keys, `duration`, `sunScreenPos`, `ghostCount`.

---

### 8. `end-card-stats-stagger`

**Look:** A bottom gradient scrim fades in over the moving shot. A headline, then two mono stats lines, then a bold credit appear one after another, each with a short fade-up and blur-in. The scene keeps drifting underneath.

**Parameters**
- Scrim: a linear gradient from transparent at 45% H to `rgba(10,12,18,0.75)` at 100% H. Opacity 0→1 over 0.7 s (38.5–39.2), ease-in-out.
- Headline "every pixel you just saw is math.": 38 px Bold white, centred at 70% H. In at 38.9 s over 8 frames: opacity 0→1, y +8 px→0, blur 6→0.
- Stats line 1 "0 images · 0 footage · 0 video models · 0 audio samples": mono 15 px, 85% white, letter-spacing 0.02em. In at +0.55 s.
- Stats line 2 "terrain · erosion · light · sky · clouds · lens · music — 1,135 lines of code": mono 15 px, 55% white. In at +1.2 s.
- Credit "written by Claude": 18 px SemiBold, 100% white. In at +2.0 s.
- Each fade lasts 8–10 frames with ease-out.
- Global fade to black: last 11 frames (0.45 s), ease-in.

**Props:** `headline`, `lines[]`, `credit`, `staggerSec`, `scrimStrength`.

---

### 9. `film-post-stack` (applies to all shots after LENS)

- Grain: per-frame seeded noise. Gaussian σ = 4/255, monochrome, blend mode overlay at 35%.
- Vignette: radial, corners darkened about 25%.
- Bloom: threshold 0.8, mixed at 0.35 over the sun and highlights.
- Mild chromatic fringe: 0.5 px.

In Remotion, render these as an SVG `<filter>` (feTurbulence with `seed={frame}` for the grain) or as a final shader pass.

---

## Transitions

| Time | Type | Details |
|---|---|---|
| 3.96–4.60 | `glitch-layer-rewind` | 15 frames: horizontal band displacement plus reverse stage stepping, ending on the flat plane |
| 4.6 → 5.67 | Hold | Interstitial text on the flat plane |
| 5.67 | Overlay fade-in | 4 frames |
| 6.0, 8.0, 10.0, 12.0, 13.92, 16.0, 18.0, 20.0 | `stage-cut` | Overlay blank for 1–2 frames, then the title drops in and the panel types. The 3D scene morphs in place with no camera cut. |
| 21.75–22.0 | Overlay fade-out | 6 frames, opacity 1→0 |
| 22–38 | Continuous camera move | No cuts |
| 38.5–39.2 | Scrim fade-in | — |
| 42.45–42.9 | Fade to black | — |

There are **no hard cuts** in the whole video; scene-cut detection returned none.

## Camera

- **Opening (0–4 s):** an almost static aerial with a slow push. Background parallax is under 1 px per frame.
- **Stages (4.6–22 s):** completely locked off, the same viewpoint as the opening hero frame. This is what makes the "same world being built" reading work: the stage 8 frame equals the opening frame.
- **Flyby (22–38 s):** a single 3D path (see `cinematic-flyby-camera`), with true parallax across the depth of the raymarched scene. If rebuilding in 2.5D, use 6–10 ridge layers plus 2 cloud layers, with parallax factors from 0.05 (far range) to 1.0 (hero face).
- **End (38–43 s):** a slow forward drift of about 0.4% frame scale per second.

## Library candidates

- `blur-caption-swap` — minimal lower-third or centred subtitles with blur in/out, for teaser narration.
- `glitch-layer-rewind` — "rewind/deconstruct" transition from a finished state back to a blank state.
- `stage-title-block` — numbered chapter header with a segmented progress bar, for any step-by-step explainer.
- `ide-typewriter-panel` — "watch the code get written" overlay with time-boxed typing, for dev/AI demos.
- `procedural-terrain-build` — layered procedural landscape that grows stage by stage, for "how it's made" or generative-art reveals.
- `stage-cut` — micro overlay reset that marks a step change without cutting the background.
- `cinematic-flyby-camera` — eased spline camera past a hero object, with sun rim-light and lens ghosts.
- `end-card-stats-stagger` — credits or stats reveal over a live background with a scrim.
- `film-post-stack` — grain, vignette and bloom finishing pass for a filmic look.
