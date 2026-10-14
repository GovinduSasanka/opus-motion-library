# Transitions

Scene-to-scene transitions live in `src/transitions.tsx`. A compose spec puts one on a scene with
`"transition": {...}` (it plays INTO the next scene). `presentationFor(spec, width, height)` turns a
`TransitionSpec` into a `@remotion/transitions` presentation; `transitionFrames(spec)` gives the length to use
(`spec.frames`, or the type's recommended default from the table below).

Preview all of them: `node cli/mgl.mjs render transition-reel --concurrency 4` (motion `transition-reel`, props
`types` — entries like `"page-turn:roll"` — `holdFrames`, `transitionFrames` (0 = recommended per type), `title`).

## Spec fields

| field | meaning |
|---|---|
| `type` | one of the types below (`cut` = no transition) |
| `frames` | length in frames. If you leave it out, **Compose uses 15**; the reel uses the recommended value. Set it explicitly for long looks (whiteout, roll, watercolor, wave lines). |
| `direction` | `from-left` / `from-right` / `from-top` / `from-bottom`: the side the new scene comes from (`from-center` = `bands` variant `center`) |
| `angle` | travel direction in degrees for front wipes (0 = moving right, 90 = moving down, 180 = left, 270 = up). Overrides `direction`, allows diagonals. |
| `x`, `y` | origin / centre, 0..1 of the frame (default 0.5, 0.5) |
| `color` | the accent colour of the type (border, rim, edge line, bar, light, tint; see table) |
| `bands` | stepped bands in soft edges (ripple 8, wave 6, bands 8) |
| `size` | bar width (fraction of the travel length), strip band height (fraction of H), paper-roll width |
| `variant` | alternative look of a type (listed per type) |
| `seed` | changes jagged / organic edges (tear zig-zag, storm scallops, blob, xray hatch, glitch bands) |
| `spring` | Compose: use spring timing instead of linear |

## Types

| type (variant) | what it looks like | source | fields used | recommended frames |
|---|---|---|---|---|
| `fade` | crossfade | most videos | `frames` | 15 |
| `slide` | Remotion push: new scene pushes the old one out | v10, v17 cards | `direction` | 15 |
| `wipe` | Remotion hard-edged wipe | — | `direction` | 15 |
| `clock` | radial clock-hand wipe | v19 HUD | — | 20 |
| `flip` | 3D card flip | — | — | 20 |
| `iris` | hard-edged circle opens from a point with a thin blue border; easeInQuad, so it starts slow and slams open | v4 iris-reveal-from-dot | `x` `y` `color` (border, `#3383CB`) | 8 (source: 4) |
| `blob` | dark ink blob with a soft inner stain and hairy fibre edge grows organically from a point and reveals the next scene inside | v11 0:01 x-ray reveal | `x` `y` `color` (ink, `#0b0d1c`) `seed` | 18 |
| `tear` | jagged zig-zag torn-paper edge sweeps across (−8 % → 108 %, bezier .3,.1,.3,1) with a paper-white fibre rim and a soft shadow on the old side; the new scene is behind the tear | v10 torn-paper-wipe, v14 torn-seam-era-wipe | `direction`/`angle` (default from-left), `color` (rim, `#f3efe6`), `seed` | 12 |
| `zoom` | zoom-through: old scene pushes in ×3.6 with blur and fades, new scene settles from 0.62 | v4, v6, v19 | `x` `y` (zoom origin) | 14 |
| `flash` | a wobbly hole of light (cream fill, gold rim, dark-brown outer rim, 80 straw rays) expands with easeInExpo until the frame is light, then the new scene fades up out of it | v6 light-hole-expand | `x` `y` `color` (light, `#F6F0E4`) `seed` | 20 |
| `flash` (`plain`) | old scene overexposes to white, new scene comes back from white | v16 0:14 | `color` | 12 |
| `glitch` | 12–20 horizontal bands re-randomised every 1.5 frames shift sideways with black slivers at the edges; each band flips from old to new scene on its own jittered schedule | v8 glitch-layer-rewind | `seed` | 15 |
| `ripple` | banded concentric flood: a disc of the new scene with 8 stepped-opacity rings at its edge, easeInQuad | v17 ripple-flood | `x` `y` `bands` | 12 |
| `spiral` | Archimedean stripes coil out from a point, turn, widen and merge until the new scene fills the frame; thin fringe on the stripe edges | v17 spiral-wipe | `x` `y` `color` (fringe, white) | 18 |
| `wave` | liquid surge: a sinusoidal front (two harmonics, phase moving) sweeps diagonally from the bottom-right with 6 stepped-opacity bands, easeInOutCubic | v17 liquid-wave-wipe | `angle`/`direction` (default 205°), `bands`, `seed` | 14 |
| `wave` (`lines`) | 16 wavy ink lines fade in over the old scene, scroll sideways, the scenes crossfade under them, lines fade out | v20 wave-line-wipe | `color` (ink, `#2b2622`), `seed` | 36 |
| `bands` | straight wipe whose leading edge is a posterised ramp of 8 stepped bands (12 % of the frame) | v17 luma-ramp-wipe | `direction`/`angle` (default from-top), `bands` | 10 |
| `bands` (`center`, or `direction: from-center`) | a thin line at `y` thickens into a band with stepped soft edges until it floods the frame | v17 bar-expand-wipe | `y` `bands` | 12 |
| `diagonal` | 45° hard straight wipe, linear, with a white dashed glowing edge line | v6 diagonal-palette-wipe | `angle`/`direction` (default 45° = towards bottom-right), `color` (line) | 10 |
| `push-blur` | whip push: both scenes travel together (easeInOutQuart) with directional motion blur from their speed, a thin dark seam between them, and a 4 % overshoot that settles | v10 push-slide-blur, v20 whip-pan-truck | `direction`/`angle` (default from-right) | 12 |
| `page-turn` | the new scene is a page hinged on the `direction` side: it swings over with foreshortening, a curved free edge, white rim highlight, page darkening and a soft cast shadow | v1 page-turn-cover | `direction` (spine side, default from-left), `color` (rim) | 22 |
| `page-turn` (`roll`) | a paper cylinder (shaded gradient, seam, notches, cast shadow) enters fast, creeps, then sweeps across, unrolling the new scene behind it | v9 paper-roll-wipe | `direction`, `size` (roll width, 0.035) | 60 |
| `storm` | a scalloped front (arcs 3–5 % H) slanted 4° (bottom leads) sweeps across with ease-in, a feathered half-opacity band ahead of it and a thin light edge line | v1 storm-wall-wipe | `direction` (default from-right), `color` (edge line), `seed` | 20 |
| `storm` (`watercolor`) | wet-paint front: fbm-wobbly edge tilted 15°, wide 50 % feather band, heavy blur, linear | v1 watercolor-front-wipe | `direction` (default from-left), `seed` | 34 |
| `whiteout` | bloom to white: old scene brightens and blurs into white (easeInQuad, 21 %), holds, then the new scene fades up milky (blur 12→0, contrast 0.7→1, easeOutCubic) | v16 bloom-whiteout | `color` (white) | 42 |
| `whiteout` (`burnout`) | a light at (x,y) intensifies: radial glow + 24 rotating god-rays, frame burns to white (easeInExpo), then a hard cut | v16 glow-burnout-cut | `x` `y` `color` | 24 |
| `whiteout` (`blizzard`) | hard cut to a blue-grey white-out with ~600 pixel snowflakes and streaks streaming sideways; the new scene fades in underneath as the snow thins | v21 blizzard-whiteout-dissolve | `color` (tint, `#97A3BB`), `seed` | 36 |
| `bar` | a thin grey-white bar sweeps across; the scene cuts underneath it (new scene behind the bar) | v19 bar-slide-wipe | `direction`/`angle` (default from-left), `color` (`#C0C3CA`), `size` (0.036) | 8 |
| `bar` (`black`) | old scene → bar sweeping over black → new scene (the source's black frames) | v19 bar-slide-wipe | same | 10 |
| `strip` | full-width band slams open from the centre line to 40 % H (bezier .3,0,.2,1) over the dimmed old scene, holds, then expands to the full frame | v21 eye-strip-slam | `y` (band centre), `size` (band height, 0.4) | 24 |
| `dots` | the old scene breaks into a dot grid that zooms around (x,y) while the dots shrink away, with glow and red/blue fringes on dot edges | v18 dot-zoom-punch | `x` `y` `color` (glow) | 16 |
| `dots` (`bokeh`) | 150 soft defocused discs (vermilion, teal, cream, green, amber) fly at the camera with ghost streaks while the new scene fades in | v18 particle-burst-zoom | `x` `y` `color` (added to palette), `seed` | 20 |
| `xray` | a noisy circular hole opens (easeInQuad) with a ring of hand-hatched ink strokes that boil every 2 frames | v6 xray-hatch-hole | `x` `y` `color` (ink, `#1d140c`), `seed` | 10 |

## Notes

- All custom presentations render each scene once. Soft, banded and organic reveals use an SVG `<mask>`
  referenced from CSS (`mask: url(#id)`), so three.js and video scenes are not duplicated. `glitch` is the
  exception: it renders 3 offset copies of each scene during the transition.
- The source timings are very fast (iris 4 f, bar 2–3 f, ripple 8 f at 60 fps). The recommended frames are a
  little longer so they read at 30 fps; use the source values for a harder cut feel.
- Overlays drawn by a transition (rims, bars, rays, snow) sit above both scenes. Compose overlays and captions
  stay above the transition.
