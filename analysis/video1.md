# video1 — "Paper Crane Journey" (origami crane flies around the world and returns to the notebook)

Scratch frames / bursts used for this analysis: `analysis/frames/video1/` (`b_*` = 3–6 fps overviews, `d_*` = 12 fps dense bursts, `f_*.png` = full-res key frames). Helper scripts: `analysis/frames/burst.sh`, `analysis/frames/tools/{palette,motion}.py`.

## Overview

| Property | Value |
|---|---|
| Resolution | 1080 × 1080 (1:1) |
| FPS | 24 (container), **character / scene animation is drawn on twos (12 fps holds)**; scrolling terrain is on ones |
| Duration | 69.23 s (1660 frames) |
| Audio | AAC track present (ignored) |

**Story.** A folded paper crane on an open notebook "rewinds" — it unfolds back into a flat page, the page peels out of the notebook, and is folded step-by-step into a crane in front of a sunny window. The crane flies out the window, over a town and river, then a top-down montage of biomes (farmland, ocean with whale, desert, snowy peaks, night city, autumn forest, clouds, wetland), joins a flock of real red-crowned cranes, gets caught in a storm, lands on a lotus pond, the rain clears, it drifts under a stone bridge, takes off at sunset, returns at night through the window, lands on the notebook, unfolds into a sheet showing its crease pattern (with a pink lotus petal it picked up), a page turns over it and the signature "opus 5.5" is typed. The film is a perfect loop: it begins and ends on the notebook.

**Art style.** Flat vector illustration with a warm risograph/paper feel: every fill has a subtle paper grain (σ ≈ 1.5–2 levels in flat areas, re-seeded every frame so it "breathes" slightly), thin dark ink outlines (≈1.5–2 px @1080, colour ≈ `#2a2630`), hatched (parallel 45° lines) shading for shadows and undersides, limited palettes per scene, atmospheric layering by flat value steps (no gradients except sunset sky bands, which are also stepped). The origami crane is off-white paper with very faint grey crease lines and tiny dot speckle; edges are inked.

**Global palette (sampled).**
- Paper / crane: `#e6decd` (lit), `#d1c9bb` (shade face), `#efebe3` (top-down lit), `#e9eaf2` (moonlit), crease lines faint `#bdb6a8`; ink `#2a2630`
- Room: desk `#ad8b76`, desk light patch `#c49f80`, wall `#e2d8c1`, window sky `#b7cddc`, notebook edge `#5e6670`, pencil `#e0b23a`
- Day exterior: sky top `#91b4ce`, sky haze band `#a2c0d4`, mountains `#75938c`, fields `#79a958` / `#8bad7d` / `#bfba79`, river `#74a4ab`, wind lines ≈ `#5a6fae`
- Biomes: ocean `#375f8f` w/ wave ticks `#d3d7d7`; sand `#c8a26f` / `#d7b57a` / dune shade `#b0895a`, cast shadow on sand `#897257`; snow-peak ground `#556e5c`, rock lavender `#9ea2af`; night city `#24203f` / `#171128` w/ gold grid `#a79469`; autumn `#b39349` `#aa6533` `#9b3d2a`; cloud layer `#e8e4db`; wetland `#92a466` / water `#9ab9c0`; flight-trail dashes `#8688ad`
- Flock / mountains: sky `#7a9fc0`, crane body white `#f2f1ec`, crane black `#1d1f2c`, crown red `#b61f3c`
- Storm: `#5b5f6e` (top) `#6d7384` (mid) `#7c808d` (low); rain pond `#7d8b8c`, rain sky `#a8abb2`
- Lotus pond (sunny): sky `#e8ddcf`, water `#5e908f`, pads `#83a078`, lotus `#cf7396`, willow `#91a570`
- Green pond close: `#426966`, `#26433c`, `#87a68e`
- Sunset: `#8d5f88` → `#a76a82` → `#bb727d` → `#dcab8c` → horizon cream `#f5edda`; land `#65536e` `#50425e`; dusk top `#423463`
- Night / end: wall `#434669`, moonlit desk `#473c4d`, notebook page `#999dbe`, crease highlight blue `#6773b5`, petal pink `#d8789e`, signature text `#dcdffe`

**Fonts.** Only text is the end signature "opus 5.5": thin geometric rounded sans (Quicksand Light / Comfortaa Light look-alike), lowercase, weight ≈300, letter-spacing ≈ +0.05em, size ≈ 28 px (2.6 % of frame height), colour `#dcdffe` on `#999dbe`, bottom-right (text right edge ≈ x 980, baseline ≈ y 1000 → ~9 % right / 7 % bottom margin).

## Timeline

| # | Start–End (s) | On screen | What moves | Transition out |
|---|---|---|---|---|
| 1 | 0.00–1.67 | Close-up of crane resting on open notebook; dutch tilt ≈ −8°; window-light shadow shafts across page | Nothing but grain boil (static hold) | Hard cut |
| 2 | 1.67–3.33 | Wide room: wall, window w/ branch, desk, open notebook + pencil | Crane **reverse-folds** (crane→bird base→square base→flat) 1.70–2.37 s, flat sheet sinks into right page; right page corner curls (2.54–2.79) then **peels up & lifts** off the notebook toward camera (2.87–3.29) | Hard cut (match on the lifted sheet) |
| 3 | 3.33–11.25 | Sheet in front of the window (close-up), dutch angle re-framed at each fold group | **Origami fold sequence**: sheet rotates to face camera 3.33–3.58; crease X draws 3.6–3.9; diagonal fold + excess strip cut & falls 3.98–4.5; pre-crease folds 4.57–5.23; rotate to diamond 5.32; tilt into perspective 5.40; square-base collapse 5.57–5.8; kite folds 6.0–6.4; petal folds w/ dashed arc guides 6.5–7.1; bird base 7.1–7.8; flip 8.0; narrowing 8.3; neck/tail reverse folds 8.6–8.9; head fold + sparkle 9.1–9.5; wings drop 9.3; crane flaps in place 9.6–11.25 | Hard cut |
| 4 | 11.25–13.33 | Wide room again | Crane takes off from window sill, flies one clockwise loop around the room (shadow tracks across desk/notebook), exits through window top-right 13.0–13.3 | Hard cut |
| 5 | 13.33–15.00 | Exterior: sky, clouds, mountains, dense town | Crane flies away from camera (scale 1 → ~0.4, rises), flap cycle | Hard cut |
| 6 | 15.00–18.33 | Perspective river valley, village, wind streamlines | Crane flaps/hovers mid-sky, wind lines drift; slow camera truck (foreground ≈45 px/s left, mountains static = parallax) | Hard cut |
| 7 | 18.33–28.33 | **Top-down montage** (crane centred, cast shadow, dashed trail) | Terrain scrolls diagonally down-left; biomes hard-cut: farmland/river/town 18.33–20.00, ocean (boat + whale breach + splash) 20.00–21.67, desert (oasis, camel caravan) 21.67–22.92, snowy peaks 22.92–24.17, night city 24.17–25.00, autumn forest 25.00–25.83, clouds over patchwork 25.83–26.67, wetland w/ crane flock passing 26.67–28.33 | Hard cut |
| 8 | 28.33–30.00 | Side view, snowy mountain band at bottom, flock in diagonal line | Flock flies right→left in staggered V; paper crane enters lower-left and joins | Hard cut |
| 9 | 30.00–32.50 | Close two-shot: big red-crowned crane above, paper crane below | Real crane 0.83 s flap cycle, turns its head down to look at paper crane (≈31.0–32.0) | Hard cut |
| 10 | 32.50–35.00 | Wide: long diagonal flock line + paper crane over mountains | Flock glides, paper crane flaps | Hard cut into 11 with wipe already running |
| 11 | 35.00–38.33 | Close on paper crane at storm front | **Storm wall wipes** right→left (34.97–35.66), rain streaks, flock flies off into distance, paper crane loses height & greys | Hard cut |
| 12 | 38.33–40.00 | Rainy pond, reeds lower-left | Crane glides down and lands, reflection + ripples | Hard cut |
| 13 | 40.00–45.00 | Lotus pond in rain (desaturated) | Rain + ripples; **watercolour-front wipe** to sunny scene left→right 41.75–42.9; dragonfly darts in and lands on crane (42.5–44) | Hard cut |
| 14 | 45.00–47.50 | Stone arch bridge framing the pond | Crane drifts toward camera under the arch, tinted dark in arch shadow (46.0) then relit | Hard cut |
| 15 | 47.50–52.50 | Close-up crane on green pond (willow reflections), lotus petal stuck in its back | Gentle bob/drift; takes off 51.0–52.5 (reflection separates and fades) | Hard cut |
| 16 | 52.50–55.00 | Sunset landscape, sun with ray burst, winding river | Crane flies right→left & rises; camera tilts up (horizon moves down ≈ 60 px/s) | Hard cut |
| 17 | 55.00–57.50 | Dusk, sun half below horizon, village lights | Crane small, recedes; sun sinks; first star appears | Hard cut |
| 18 | 57.50–58.33 | Night window (moon), desk below | Crane flies in through window | Hard cut |
| 19 | 58.33–64.90 | Top-down notebook in moonlight (lavender), window-frame shadows | Crane lands, **reverse-fold** to flat sheet 58.3–62.6 (with petal), sheet rotates/scales into page outline 62.6–62.93 (ease-out), **crease pattern highlights** in blue 63.1–64.6 | Page turn |
| 20 | 64.93–65.60 | Same | **Page turn** from left spine covers the sheet (0.67 s), settles 65.6–65.8 | — |
| 21 | 66.15–69.23 | Blank lavender page | **Typewriter signature** "opus 5.5" types 66.23–66.48, hold to end | End (loops to shot 1) |

Cut cadence: most cuts land on multiples of 1/24·40 = 1.667 s or 1.25 s (e.g. 1.667, 3.333, 13.333, 15, 18.333, 20, 21.667, 25, 26.667, 28.333, 30, 32.5, 35, 38.333, 40, 45, 47.5, 52.5, 55, 57.5) — i.e. the edit is on a 0.4167 s (10-frame) grid.

## Motion techniques

### `style-paper-onTwos` (global look system)
- **Look:** every scene is flat vector + paper grain + ink outlines, animated on twos.
- **Parameters:** posterize animation time to 12 fps (`const t = Math.floor(frame/2)*2`), but keep camera scrolls (terrain) on ones. Grain: full-frame noise overlay, monochrome, amplitude ±4/255, `mix-blend-mode: multiply` at 6–8 % plus a second "fibre" layer of sparse short dark strokes (opacity 5 %). Re-seed grain every frame (`seed = frame`) → slight boil (frame diff ≈0.2–0.7 on holds).
- **Ink:** stroke `#2a2630`, 1.5–2 px @1080 (0.15 % of H), `stroke-linejoin: round`.
- **Hatching:** shadows = polygon clip filled with `<pattern>` of parallel lines at 45°, spacing 6 px, stroke 1 px, colour = 25 % darker than the surface, pattern opacity 0.5–0.7.
- **Remotion recipe:** `<AbsoluteFill>` root with an `<svg>` per scene; a `<PaperGrain seed={frame} opacity={0.07}/>` component using SVG `feTurbulence` (`baseFrequency=0.9, numOctaves=2, seed=frame%997`) + `feColorMatrix` to grey, blended `multiply`. Wrap every animated value in `onTwos(frame)`.
- **Props:** `grainOpacity`, `inkColor`, `inkWidth`, `onTwos: boolean`, `hatchSpacing`.

### `origami-fold-sequence` (core)
- **Look:** a square sheet is folded into a crane through ~20 discrete steps; each fold is a flap rotating 180° about a crease line, executed in **2–3 frames** (0.08–0.125 s) followed by a 2–4-frame hold → a snappy, stop-motion "stepped" rhythm (≈0.17–0.33 s per step). Folds are flat (2D) for the first half; from the square-base onward the model is shown in 3/4 perspective (tilted ≈55–60° rotateX) and folds read as 3D.
- **Elements:** paper polygons with face colour `#e6decd`, back-face / far-flap colour `#d1c9bb` (≈8 % darker), flap-in-motion colour darkened further (`#c9c1b0`) while its rotation is between 30° and 150°; inked edges; faint crease lines `#bdb6a8` 1 px; tiny speckle dots. Optional **dashed arc guides**: thin dotted ellipse arcs (1 px, 40 % opacity, dash 2/4) drawn along the path of moving flap corners during the petal / square-base folds (seen 5.4–7.1 s).
- **Fold primitive (per flap):** for every vertex `p` of the flap, with crease line through `a` (unit dir `d`) and in-plane normal `n`:
  `q = a + d·((p−a)·d)` (foot on crease), `h = (p−a)·n` (signed distance), at angle θ∈[0,π]: `p' = q + n·h·cos θ` and a fake depth `z = h·sin θ` (use `z` for slight perspective scale `s = 1 + z/1500` and for painter ordering). θ(t) uses `easeInOutCubic` over 2–3 frames (or just steps 0→90→180 on twos). Swap fill to back-face colour when cos θ < 0.
- **Sequence used (times from video, step = fold):** rotate sheet to frontal (3.33–3.58), crease X draws (3.6–3.9, see `crease-line-draw`), diagonal fold to triangle (3.98–4.07), excess strip separates and falls (4.15–4.5, `paper-scrap-fall`), unfold (4.57), other diagonal fold/unfold (4.65/4.82), book fold/unfold (4.90/4.98), cupboard fold (5.07–5.15), unfold square with creases (5.23), rotate 45° to diamond (5.32, 2 frames), tilt into perspective (5.40), collapse to square base (5.57–5.8), kite folds L/R (6.0–6.4), petal fold up (6.5–7.1), repeat on back = bird base (7.1–7.8), flip over (8.0), narrow legs (8.3), inside-reverse-fold neck & tail up (8.6–8.9), head reverse fold (9.1), wings pulled down (9.3), sparkle at beak tip (9.5: 8-ray star, 12 px, 3 frames), then live flapping.
- **Camera:** during folding the dutch angle jumps (−6° → +4° → −3° …) at fold-group boundaries (5.4, 6.25, 7.1, 8.3, 9.3) as hard re-frames, giving a hand-held/storyboard feel.
- **Reverse use:** the same keyframe list played backwards = `reverse-unfold` (1.70–2.37 s, ~16 frames, ≈1 step per 2 frames; 58.3–62.6 s, ≈1 step per 4 frames with longer holds).
- **Implementation:** define the crane as a list of `FoldStep {flapVertexIds, creaseA, creaseB, side}` acting on a vertex array of the unfolded square (crease-pattern coordinates). Precompute the state after each step; at frame `f` find step `k` and local progress `u`, apply previous states fully + step `k` with θ=π·ease(u). For the 3D half, keep the same math in 3D (`x,y,z`) and project with a simple perspective matrix (rotateX 55°, rotateZ dutch, focal 1400 px). Render polygons sorted by average z.
- **Props:** `steps` (array of fold definitions or preset `"crane"`), `stepDuration` (default 3 frames), `holdDuration` (default 3 frames), `direction: "fold"|"unfold"`, `paperColor`, `backColor`, `showArcGuides`, `dutchJitter`.

### `crease-line-draw`
- **Look:** crease lines appear on a flat sheet as thin lines drawing from one end to the other (3.6–3.9 s: two diagonals, 0.15 s each, staggered 0.1 s). Finale variant (63.1–64.6 s): the full crane crease pattern (radial fans from corners, centre star, bisectors) first shows faint grey, then lines **recolour to blue `#6773b5`** progressively in groups (≈5 groups, one per 0.33 s, each group fading/drawing over 0.25 s).
- **Recipe:** each crease = `<line>` with `strokeDasharray=len`, `strokeDashoffset = len·(1−ease(u))`, `easeOutQuad`. Colour pass = second copy stroked blue 1.5 px with same draw-on, stagger by group index.
- **Props:** `lines[]`, `color`, `highlightColor`, `drawDuration` (0.15–0.25 s), `stagger`, `groups`.

### `paper-scrap-fall`
- **Look:** after the diagonal fold the excess rectangular strip detaches and drops out of frame: translate down-left ≈ 35 % of H over 0.5 s, rotate −15° → −35°, slight scale-down (1 → 0.8), drawn on twos. Easing: gravity (`easeInQuad`) for y, linear for x and rotation.
- **Props:** `polygon`, `fallDistance`, `spin`, `duration` (0.5 s).

### `page-peel-lift`
- **Look:** (2.54–3.29 s) the right page of the notebook curls at its top-right corner (a small triangular curl that grows over 0.25 s), then the whole page lifts toward the camera — rendered as a quad whose far edge rises and whose near edge pivots on the spine, becoming a frontal rectangle in ≈0.4 s, then hard-cut to the close-up of the same sheet.
- **Recipe:** corner curl = triangle flap using the fold primitive with a curved (quadratic) edge; lift = quad corners interpolated from page-on-desk corners to frontal-sheet corners with `easeOutCubic`, plus shadow under it growing offset.
- **Props:** `pageRect`, `curlCorner`, `curlDuration` (0.25 s), `liftDuration` (0.4 s).

### `paper-crane-flap`
- **Look:** the origami crane flaps by rotating its two wing triangles about the body's long axis; on twos; wing tips sweep ≈ ±50°; one beat ≈ 0.5–0.67 s (6–8 drawings) when airborne, irregular & smaller when perched. In top-down shots the wings are drawn as two triangles whose far vertex moves in and out (foreshortening) with ≈15 % span change, plus the cast shadow mirrors it.
- **Recipe:** wing = triangle (shoulder A, shoulder B, tip T); `T(t) = rotate T around axis AB by φ(t)`, `φ = 50°·sin(2π t / period)` sampled on twos; project with fixed camera. Body (neck, tail, head) as fixed polygons with small bob `y += 0.01H·sin(2πt/period + π/2)`.
- **Props:** `period` (0.5–0.67 s), `amplitude` (deg), `view: "side"|"top"|"3/4"`, `bank` (deg).

### `bird-flap-cycle` (red-crowned crane)
- **Look:** realistic stylised Japanese crane, side view: white body, black secondaries & neck, red crown, long trailing legs (single line). Wing = fan of 6–8 rounded feather lobes. Flap cycle = **10 drawings on twos = 0.833 s**: down-stroke frames show near wing white with black trailing band; up-stroke frames show the wing grey-blue (`#a9b4c8`, back side) and narrower; the body bobs ±1 % H opposite to the wing. Head can turn down to look (acting beat, 31.0–32.0 s: neck bends ~35° over 0.33 s ease-in-out, holds, returns).
- **Recipe:** keyframe 5 wing poses (wing polygon points), interpolate between them on twos with a looping index `pose = floor(frame/2) % 10`; mirror pose index for up/down; swap fill colour by phase. Neck = 3-segment polyline with angle props.
- **Props:** `period` (0.833 s), `phase`, `wingFill`, `wingBackFill`, `headAngle` (animatable), `scale`.

### `v-formation-flock`
- **Look:** 8–12 cranes in a staggered diagonal line / V, each ~70 % the size of the previous toward the back (depth), flying right→left, individual flap phases offset (random 0–1 cycle), slight vertical bob, overall formation drifting slowly upward (−2.4 px per 12 fps step ≈ 29 px/s). Later the formation recedes (scale shrinking 1 → 0.5 over 3 s) into the storm.
- **Recipe:** leader position `L(t)`; bird i at `L + i·(dx, dy)·depthScale_i` with `dx≈+6 % W, dy≈−3.5 % H` (behind and above), `scale_i = 0.93^i`, `phase_i = hash(i)`. Small per-bird noise `±0.5 % W` with low-frequency simplex.
- **Props:** `count`, `spacing`, `angleDeg`, `scaleFalloff`, `direction`, `birdComponent`.

### `topdown-terrain-scroll` (core)
- **Look:** camera looks straight down; the crane stays near frame centre (±3 % drift), its hatched cast shadow offset (+17.5 % W, +15.7 % H) down-right, a dashed flight trail extends from the crane's tail to the frame edge bottom-left. The ground scrolls diagonally toward bottom-left at constant speed that **increases through the montage**: 8.0 px/f (farmland) → 10 (ocean) → 11 (desert) → 12 (peaks) → 13 (city/forest) → 15.7 px/f (wetland) @1080 (≈18–35 % of frame width per second). Direction vector ≈ (−0.65, +0.76) (terrain moves left & down, crane heads up-right at ≈50°). Scroll is on ones (smooth), crane on twos.
- **Elements per biome (all procedural):**
  - *Farmland*: rotated grid (≈25°) of irregular quads (Voronoi cells jittered), fills chosen from `#bfba79 #7dab69 #97b96d #b3c079 #9fc5d6(paddy water)`; river = wide polyline band `#74a4ab` w/ darker banks; rows of tiny house rectangles (roof colours `#5e6278 #8b5a4a`) along roads; red bridge.
  - *Ocean*: flat `#375f8f`, scattered small white "v" wave ticks (density ≈ 1 per 40×40 px, size 6–10 px) scrolling with ground; boat with V-wake lines; event: whale silhouette darkens under the surface (opacity 0 → 0.6, 0.5 s), breaches as dark body + white splash puffs (3–5 circles scaling 0 → 1 with `easeOutBack`, 0.4 s), then sinks.
  - *Desert*: horizontal sinusoidal dune bands `y = y0 + A·sin(2πx/λ + φ_i)` (λ ≈ 70 % W, A ≈ 4 % H), each band = lit face `#d7b57a`, ridge ink line, shaded underside `#b0895a` + hatch; oasis blob with pond and radial palm stars; camel caravan (6 camels with long cast shadows).
  - *Snowy peaks*: star-shaped mountain polygons (8–12 radial spikes) with white tops `#e8e9ee`, lavender flanks `#9ea2af`, on forest green `#556e5c`; glacial lake.
  - *Night city*: dark navy blocks `#24203f/#171128`, gold street grid lines `#a79469` (rotated 40°), sparse light pixels, a dark river band, a few lit plaza crosses.
  - *Autumn forest*: dense packed circles (r 10–18 px) of `#b39349 #aa6533 #9b3d2a #6b623a` with darker edge rim, winding path band, lake.
  - *Clouds*: pale patchwork ground + fluffy white cloud clusters (union of circles, `#f2efe8`, shadow `#b7beac` offset down-right) — clouds move slower than the ground (parallax: ground ≈ 1/3 cloud speed in this shot).
  - *Wetland*: green `#92a466` with darker blobs `#72864f`, blue ponds `#9ab9c0`, meandering stream; a line of real cranes (top view) passes diagonally above.
- **Implementation:** each biome is a tiling `<g>` generated once from a seeded PRNG (mulberry32(seed)) over an area ≥ 3× frame; translate it by `v·frame` (wrap with modulo tile size). Hatching via SVG `<pattern>`. Crane shadow = same crane polygons, filled with hatch pattern at 55 % opacity, translated by the shadow offset (keep it un-rotated relative to the light). Trail = `<path>` from crane tail to off-screen along −v, `stroke #8688ad`, width 3 px, `strokeDasharray "16 10"`, dash offset animated `−speed·frame` so dashes stream away.
- **Props:** `biomes[]` (id + seed + duration), `speed` (px/frame, or `speedRamp`), `direction` (deg), `shadowOffset`, `trail: {color, dash}`, `subject` (component at centre), `events` (e.g. whale breach at t).

### `biome-hardcut-montage`
- **Look:** sequence of top-down biomes joined by straight hard cuts with no transition; subject stays locked in place across cuts (match cut), so only the ground changes. Durations: 1.67, 1.67, 1.25, 1.25, 0.83, 0.83, 0.83, 1.67 s (accelerating rhythm in the middle, then a longer settle).
- **Recipe:** `<Series>` of `<Series.Sequence durationInFrames=…>` each rendering `topdown-terrain-scroll` with the same subject transform and a continuous `frame` offset for the shadow/flap phase (pass global frame so flap doesn't restart).
- **Props:** `segments[] {biome, frames}`.

### `wind-streamlines`
- **Look:** 6–8 long thin wavy lines (≈1.5 px, `#5a6fae`, 70 % opacity) crossing the sky horizontally, some ending in a small curl spiral; they drift left ≈1.5 % W per second while their waves undulate slowly.
- **Recipe:** each line = polyline sampled from `y = y0 + a·sin(2πx/λ + ωt + φ)` (a 1–3 % H, λ 40–70 % W), optional end curl = Archimedean spiral of 1.25 turns radius 2 % W. Draw-on with dashoffset when entering. On twos.
- **Props:** `count`, `color`, `speed`, `amplitude`, `curlProbability`.

### `room-flight-loop`
- **Look:** crane takes off from a sill and flies one elliptical loop around a room seen from a high 3/4 view (≈2 s), scale changes with depth (0.6–1.2), and its soft hatched shadow slides over the desk/notebook below; exits through the window (shrinks to 0.3 and passes behind the window frame).
- **Recipe:** parametric path `P(u) = C + (Rx cos(2πu), Ry sin(2πu))` with u eased (`easeInOutSine`), depth `z = sin(2πu)` → scale `0.9 + 0.3z`; shadow = projection of P onto desk plane (fixed y), opacity 0.35, scale 0.8. Exit segment = bezier to window centre with scale → 0.3 and clip-path to the window opening.
- **Props:** `path` (ellipse or bezier list), `duration`, `exitTarget`, `shadowPlaneY`.

### `parallax-landscape-truck`
- **Look:** perspective landscape (sky/clouds, 2 mountain ranges, distant fields, village, river, foreground fields) with a slow horizontal camera truck: foreground ≈ 45 px/s, mid ≈ 20 px/s, mountains ≈ 0–5 px/s, sky static. Also used vertically (sunset shot 52.5–55: tilt up, landscape/sun move down ≈ 60 px/s with ground layers ≈ 1.2× sky speed).
- **Recipe:** 5 layers, `translateX = speed_i·t`, speeds proportional to 1/depth. Layer edges = noise-based ridge lines (`simplex1D`, 2 octaves).
- **Props:** `layers[] {component, depth}`, `cameraVelocity`, `axis`.

### `storm-wall-wipe`
- **Look:** a dark storm-cloud wall enters from the right edge and sweeps across to the left in **0.67 s (16 frames, 34.97–35.66 s)** with **ease-in (accelerating)** motion: edge x/W at 12 fps steps = 0.73, 0.70, 0.64, 0.51, 0.44, 0.33, 0.18, 0.05, 0. The leading edge is scalloped (bumps of radius ≈3–5 % H) and slants ≈4° (bottom leads by ≈8 % W); the wall itself has 3 horizontal value bands (`#5b5f6e` top, `#6d7384` mid, `#7c808d` bottom) with soft scalloped boundaries; rain streaks begin inside the wall. Characters in front (paper crane) stay on top.
- **Recipe:** clipPath polygon whose left edge = `x(y) = X(t) + 0.08W·(y/H) + bumps(y)` with `bumps = Σ r·|sin(π (y−y_k)/span)|` (pre-generated arcs); `X(t) = W·(0.73·(1 − easeInCubic(u)))`. Under the clip render the storm scene; outside it the previous sky.
- **Props:** `direction`, `duration` (0.67 s), `bumpRadius`, `bands[] colors`, `slantDeg`.

### `rain-streaks`
- **Look:** thin straight streaks (1 px, white at 35–50 % opacity, 20–45 px long, angled ≈5–8° from vertical), sparse (~60–90 on screen), falling fast (~1.0–1.4 H/s ≈ 20 px per 12-fps step), redrawn on twos. On water: small expanding ripple ellipses at impact points.
- **Recipe:** N particles with seeded x0, phase; `y = (y0 + v·t) mod (H+L)`; `x = x0 + y·tan(angle)`. Ripples: spawn at random (x, y in water band) every 2 frames, ellipse rx 0→18 px, ry = rx·0.3, opacity 0.5→0 over 0.5 s.
- **Props:** `density`, `speed`, `angle`, `length`, `color`, `ripples: boolean`, `waterRect`.

### `water-landing-reflection`
- **Look:** paper crane gliding down onto water: descent on an `easeOutQuad` curve over ≈1.2 s, a vertically mirrored copy below the waterline (opacity 0.35–0.45, tinted toward water colour, sliced into 6–10 horizontal strips that each offset ±3 px with a sine wobble). On touchdown 2–3 concentric ripple ellipses expand (0.6 s). On take-off (51–52.5 s) the reflection separates from the crane, stretches and fades out over 0.5 s.
- **Recipe:** `<g transform="scale(1,-1)">` of the subject, clipped to water region, `filter`-free strip wobble via repeating clipPaths; opacity `0.4`. Ripples as above.
- **Props:** `waterlineY`, `reflectionOpacity`, `wobbleAmp`, `rippleCount`.

### `watercolor-front-wipe` (weather change)
- **Look:** rain-grey scene is replaced by the sunny version of the same composition through an irregular, organic vertical front that travels **left → right in ≈1.15 s (41.75–42.9 s), roughly linear**, with the bottom of the front leading the top by ≈0.3 s (the front is tilted ≈15°). The boundary is jagged/wobbly (amplitude ≈3–5 % W along y, like a wet paint edge) and has a ≈60–80 px translucent band where the sunny layer is at ~50 % opacity. Rain particles exist only on the un-wiped side.
- **Recipe:** render both scene variants; mask the sunny one with a path `x(y) = X(t) + tilt·(H−y) + fbm(y·0.01, seed)·0.04W`, plus a second wider mask at 50 % opacity offset +70 px for the soft band (or SVG `feGaussianBlur` on the mask, stdDev ≈ 12). `X(t)` linear from −0.2W to 1.2W.
- **Props:** `fromScene`, `toScene`, `duration`, `direction`, `edgeRoughness`, `featherPx`, `tiltDeg`.

### `insect-dart-land` (dragonfly)
- **Look:** small red dragonfly enters fast along a zig-zag path (3 straight darts of 0.1–0.15 s each with 2–4-frame hovers), lands on the crane's head/back and stays with wing flicker (wings alternate 2 drawings every frame pair). Also hovers above the bridge shot.
- **Recipe:** path = list of waypoints; between waypoints `easeOutExpo` over 3 frames, hold 3 frames; wing quads alternate scaleY 1/0.4 on twos.
- **Props:** `waypoints[]`, `color` (`#c0392b`), `dartFrames`, `holdFrames`.

### `shadow-pass-tint`
- **Look:** when the floating crane passes under the bridge arch its fill shifts to a cool dark slate (`#4a5560`, 46.0 s) and back to paper white as it exits (≈0.4 s each way); also used for storm greying (crane goes from `#e6decd` to `#c4c6cc` while in rain).
- **Recipe:** interpolate subject fill & stroke colours with `interpolateColors` driven by a scalar `shade(t)`; can also be a `multiply` overlay rectangle clipped to the shadow region.
- **Props:** `shadeColor`, `inFrames`, `outFrames`, `region`.

### `sun-set-descent`
- **Look:** flat-band sunset sky (5–6 horizontal stepped bands, purple → pink → coral → peach → cream at horizon) with thin cream "streak" clouds; sun = cream disc (r ≈ 3 % W) with a ring of 30–40 short dashed rays (length 1–4 % W, opacity 0.6) that slowly rotate (≈10°/s). Over the dusk shot the sun sinks ≈0.5 sun-diameter per second, clipped by the horizon (becomes orange `#e8a54a` half disc), and the sky bands darken (top band → `#423463`). A tiny 4-point star appears near top centre (57.0 s, scale 0 → 1 over 0.25 s, twinkle).
- **Recipe:** sky = stacked rects with wobbly top edges (low-freq noise), colours from an array interpolated with a `dusk` scalar; sun `<circle>` + `<g>` of rays rotating; `clipPath` = above-horizon.
- **Props:** `bands[]`, `sunRadius`, `rayCount`, `sinkSpeed`, `dusk` (0..1 animatable).

### `page-turn-cover`
- **Look:** a notebook page swings over from the left spine to cover the right page in **0.67 s (64.93–65.60 s)**, then a 0.15 s settle. Mid-turn the page is a quad whose free edge is a curved arc (bulging outward like a bending sheet), page colour `#999dbe` slightly lighter than the page beneath, thin white rim highlight on the curling edge; ease-in-out (slow start, fast middle, soft landing, tiny overshoot of ≈1 % at landing).
- **Recipe:** param `u = easeInOutCubic(progress)`; angle φ = π·u around the spine axis; projected width `w = W_page·cos φ` (negative = landed side); free-edge control point offset `bulge = 0.12·W_page·sin(φ)` → path `M spineTop L freeTop Q ctrl freeBottom L spineBottom Z`. Draw shadow under the turning page with opacity `0.3·sin φ`.
- **Props:** `duration` (0.67 s), `pageRect`, `direction`, `color`, `bulge`.

### `typewriter-signature`
- **Look:** small lowercase signature types on in the bottom-right corner: 2 characters per 12-fps step (≈24 chars/s) — "op" → "opus" → "opus 5" → "opus 5.5" in 4 steps (66.23–66.48 s), no cursor, no fade; hold.
- **Recipe:** `text.slice(0, Math.floor((frame−start)/2)*2)`; thin rounded sans (Quicksand 300), 2.6 % H, colour `#dcdffe`, right-aligned at 91 % W, baseline 93 % H.
- **Props:** `text`, `charsPerStep` (2), `stepFrames` (2), `font`, `color`, `anchor`.

### `cast-shadow-hatched`
- **Look:** subject shadows are the subject's silhouette (projected/offset), filled with 45° hatch lines rather than a flat colour (both top-down and in the room/notebook shots). Opacity ≈0.35–0.55; offset fixed relative to light direction; on twos with the subject.
- **Recipe:** `<use href="#subject" fill="url(#hatch)" transform="translate(dx,dy) skewX(k)">`.
- **Props:** `offset`, `skew`, `hatchSpacing`, `opacity`.

## Transitions

- **Hard cuts** everywhere between shots (no dissolves). Cuts sit on a 10-frame grid (multiples of 0.4167 s) — 1.25 s / 1.667 s / 2.5 s shot lengths dominate.
- **Match-cuts on the subject:** paper sheet lift (3.33), crane leaves window → outdoors (13.33), and all top-down biome cuts keep the crane at the same screen position (18.33–28.33).
- **In-shot wipes:** `storm-wall-wipe` (right→left, 0.67 s ease-in, 34.97–35.66) and `watercolor-front-wipe` (left→right, ≈1.15 s linear, 41.75–42.9).
- **Cover transition:** `page-turn-cover` (0.67 s) into the end card.
- **Loop:** last shot (notebook) mirrors the first (crane on notebook), enabling seamless looping.

## Camera

- Mostly locked-off 2D frames; "camera" changes are hard re-frames with dutch-angle jumps during the folding sequence (−8° … +4°).
- Top-down section: constant-velocity diagonal scroll (on ones), speed ramps per biome (8 → 15.7 px/frame); cloud biome uses 2-layer parallax (clouds faster than ground ≈3×).
- River valley (15–18.3 s): slow truck left, 3–5 parallax layers (foreground ≈45 px/s, mid ≈20 px/s, mountains ≈0).
- Sunset (52.5–55 s): slow tilt-up/pedestal, scene moves down ≈60 px/s.
- Exit through window / flying away = subject scaling (0.4–0.3) rather than camera motion.

## Library candidates

- `style-paper-onTwos` — global flat-vector + grain + ink + 12 fps look for any storybook video.
- `origami-fold-sequence` — fold/unfold any polygon "object" step-by-step; great for build-up reveals, logo unfolds.
- `crease-line-draw` — draw-on line networks / blueprint lines with group colour highlights.
- `paper-scrap-fall` — discarded fragment falling out of frame after a cut/trim action.
- `page-peel-lift` — lift a document/page off a surface to start a story.
- `paper-crane-flap` — generic low-poly bird/plane wing flap for flying mascots.
- `bird-flap-cycle` — realistic 10-drawing bird flight loop with acting head turns.
- `v-formation-flock` — migrating groups, "join the team" metaphors, crowds moving together.
- `topdown-terrain-scroll` — map-style journey/travel sequences with a fixed hero and scrolling world.
- `biome-hardcut-montage` — rapid "around the world" montage with locked subject.
- `wind-streamlines` — show air flow, speed, breeze in any sky.
- `room-flight-loop` — hero circling a space before exiting; also UI icons looping a canvas.
- `parallax-landscape-truck` — calm establishing shots with depth.
- `storm-wall-wipe` — mood change / conflict entrance wipe with organic edge.
- `rain-streaks` — rain weather overlay with optional water ripples.
- `water-landing-reflection` — any object resting on water with reflection and ripples.
- `watercolor-front-wipe` — weather/time-of-day/before-after scene swap with organic edge.
- `insect-dart-land` — small secondary character that darts and lands (dragonfly, bee, firefly).
- `shadow-pass-tint` — object passing through shadow or mood tint.
- `sun-set-descent` — stepped sunset/dusk sky with rotating sun rays.
- `page-turn-cover` — book/notebook page turn as a scene transition.
- `typewriter-signature` — small signature/credit typing in a corner.
- `cast-shadow-hatched` — illustrated hatched drop shadows for any vector subject.
