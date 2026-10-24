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
| `seed` | changes jagged / organic edges (tear zig-zag, storm scallops, blob, xray hatch, glitch bands, brush rag, flood bulges, layer-swap contours) |
| `colors` | palette array for multi-colour types (flood sheets, stripes bands, brush paints, squeegee bead segments, portal core→arms→rim, `bands:line` dot) |
| `text` | words a type draws (`rewrite`: `"old\|new"`) |
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

## Round-2 types (src/transitions/*.tsx)

Built from the source-repo research docs (`analysis/sources/*`, `analysis/ext/*`). Same spec fields as above, plus
`colors` (palette array for multi-colour types) and `text` (for types that draw words).

| type (variant) | what it looks like | source | spec fields used | recommended frames |
|---|---|---|---|---|
| `door` | the old frame splits on the centre seam into two door leaves hinged at the outer edges that swing open toward the camera (perspective, leaf shading), gold glowing free edges and a warm seam flash; the new scene is in the opening | lemo-opuscar art-deco `splitOpen()` | `color` (edge glow, `#E8C27A`) | 28 |
| `door` (`revolve`) | a translucent glass panel with gold mullions sweeps across; the new scene is revealed behind its leading edge; a fainter second wing follows | art-deco `revolve()` | `direction`/`angle` (default from-right), `color` (mullions) | 26 |
| `door` (`saloon`) | wooden Z-braced half-doors swing shut over the old scene, then burst open toward the camera with a damped rocking settle on the new one | x4 swing-doors-reveal | `color` (wood, `#8A5A34`) | 34 |
| `curtain` | two out-of-focus paper curtains whose leading edges are scalloped cloud heads with carved spiral slits close from left and right, meet at the centre (scene swap), then part | paper-lantern `cloudCurtain` | `color` (paper, `#CFC4DC`), `seed` | 40 |
| `curtain` (`velvet`) | red stage-velvet curtains with vertical folds and a gold hem close and part | stage look | `color` (velvet, `#7A1424`) | 40 |
| `crt` | TV power: the picture squashes to a bright horizontal line, the line shrinks to a glowing dot with afterglow; the new picture powers on dot → line → open | lemo crt.js, mg-styles 10/20 PWR, pdoom crt-collapse | `x` `y` (collapse point), `color` (phosphor, `#B8D6FF`) | 22 |
| `crt` (`off` / `on`) | only the switch-off (new scene fades in from black) / only the power-on (hard cut to black first) | same | same | 16 / 14 |
| `tracking` | a rolling VHS noise band tears the picture into offset rows (static + chroma slivers, slight vertical roll) as it travels down; above the band the new scene has replaced the old | lemo vhs.js track/roll | `size` (band height, 0.12), `seed` | 16 |
| `rewrite` | a small paper label is struck through by hand and the next label written beside it with a nib while the scenes cross underneath ("FIG. 1" → "FIG. 2") | lemo sheet.js figure relabel | `text` ("old\|new"), `color` (ink, `#C8372D`), `x` `y` (label centre, y 0.84) | 32 |
| `erase` | an eraser band with a scrubby feathered edge sweeps across with white haze and crumbs; behind it only a 7 % ghost of the old scene remains until the end | lemo board.js eraser pass | `direction`/`angle`, `color` (haze), `seed` | 22 |
| `blinds` | the frame is cut into slats that each turn over from the old picture to the new one in a quick cascade, black showing between half-turned slats | lemo newsreel `composeScene('blinds')` | `bands` (slats, 12), `color` (gap) | 18 |
| `blinds` (`vertical`) | column slats (the pop-up book's day→night sky) | paper-popup sky slats | `bands` (8) | 18 |
| `blinds` (`open`) | the old scene's slats shrink to thin lines and vanish over the new scene | x2 field-blinds-wipe | `bands` | 14 |
| `tiles` | the frame is diced into cards that flip over (foreshortened, shaded, black bed behind) in a diagonal wave from the top-left | mg-styles 09-bauhaus tile cascade | `size` (tile, 0.12 of min side), `color` (bed) | 22 |
| `tiles` (`radial`) | the flip wave spreads from a point | bauhaus cues R1/R4 | `x` `y` | 22 |
| `mosaic` | the frame pixelates to big blocks (stepped powers of two), the scenes swap at the peak, the blocks shrink back into the new scene | pixel-rpg mosaic cross | `size` (max block, 0.06 of 1080) | 24 |
| `mosaic` (`swirl`) | the old image twists around a point, sinking inward while pixelating, then dissolves to white through a 4×4 Bayer pattern; the new scene returns through the reverse dither | pixel-rpg encounter swirl | `x` `y` `color` (white) | 40 |
| `overprint` | a flat wobbly ink disc grows from a point with multiply blend (everything beneath becomes the overprint mix), a registration kick at full cover, scene swap, then the disc shrinks away | risograph STYLE.md §8 | `x` `y` `color` (ink, `#FF48B0`), `seed` | 26 |
| `scan` | a soft feathered satellite-scan front with a faint glowing swath and scanline texture behind it sweeps down, swapping the scenes; up = rewind | satellite-briefing engine.js | `direction`/`angle` (default from-top), `color` (glow) | 14 |
| `scan` (`tear`) | a hard front with a bright scanner light bar and a paper-edge shadow on the old side | satellite map tear | same, `color` (`#fff7e0`) | 10 |
| `portal` | a spinning swirl portal (log-spiral arms around a dark core) rushes from a point to cover the frame, flashes pale for a beat, and the next scene opens out of the shrinking swirl | scifi-toon `wipe` | `x` `y`, `colors` (core→arms→rim), `color` (flash, `#DCFFA8`) | 16 |
| `occluder` | a huge, heavily blurred dark foreground pillar trucks across the frame; the cut happens behind it | shadow-puppet stage posts, x5 | `direction`/`angle`, `color` (`#210c05`) | 16 |
| `occluder` (`trunks`) | three tree trunks at different depths pass with parallax (nearest widest, blurriest, slowest start) | x5 trunk passes | `color` (bark) | 24 |
| `occluder` (`foliage`) | blurred fern fronds close in from all four edges to a leaf-dark frame, then part on the new scene | x5 foliage | `color` (leaf, `#1d3a1b`), `seed` | 22 |
| `occluder` (`clouds`) | a scalloped cloud bank rolls down over the frame and clears | x5 cloud bank | `direction` (from-top), `color` | 22 |
| `occluder` (`waves`) | a wall of waves with foam crests and spray lines rises up through the frame | x5 wave wall | `direction` (from-bottom), `color` (`#1d5fa8`) | 26 |
| `squeegee` | a screen-print squeegee (rubber blade, rolling ink bead with glints, wooden handle) pulls the new scene on at linear speed behind a ragged drag-streak edge; several bead colours = split fountain | silkscreen silk.js `wipeRegion`/`squeegee` | `direction`/`angle`, `colors` (bead), `seed` | 18 |
| `lights` | the house lights snap off like a relay (to 6 %, with one stutter), a dark beat, then a key light strikes on the new scene with a flicker and the house lights come up slowly | paper-lantern projection-room lights-out | `x` `y` (key light), `color` (`#FFE2B0`) | 42 |
| `flood` | three liquid colour sheets with wavy bulging fronts sweep diagonally in a quick stagger, immerse the frame, then drain away revealing the next scene; marbled bands + lit front edge inside each sheet | mg-styles 07-liquid | `angle` (default 20°), `colors` (sheets), `seed` | 36 |
| `stripes` | a slanted stack of pink/yellow/cyan bands sweeps across trailing a cyan/white diagonal stripe field that fills the frame for a few frames; the trailing bands reveal the new scene | mg-styles 18-hanazi candy wipe | `direction`/`angle`, `colors` (bands), `color` (field stripe) | 12 |
| `burn` | the next scene's spark travels under the page (its light glows through), bursts through, burns the page in two along its path (ember edge, char, sparks) and the halves swing away | pdoom bureau page burn-through | `y` (burn line), `color` (ember, `#FF8A2A`), `seed` | 32 |
| `brush` | five fat ragged paint bands (frame tilted ~−6°) sweep across with staggered delays, cover the frame (scene swaps under full cover), then drag off the other side; two alternating colours with dry-brush streaks | ClaudeAnimationBase `brushWipe` (+ pdoom idea) | `direction`/`angle`, `colors` (2 paints), `seed` | 20 |
| `ball` | a ball leaves (x, y), flies at the camera (exponential growth, motion-blurred edge) until its flat colour floods the frame; the new scene comes up out of that colour | x2 ball-zoom-flood | `x` `y` (start, 0.68/0.58), `color` (`#FF5A2C`) | 14 |
| `shockwave` | a white-orange flash at the core, one flat grey beat, then a disc of the new scene expands with a chromatic fringe ring, a fainter trailing ring, radial streak spray and a dark core that closes | x2 core-shockwave-reveal | `x` `y`, `color` (fringe, `#C8D86A`), `seed` | 16 |
| `screen` | a monitor showing the next scene settles over the old one, then the camera pushes into its screen until the content is the frame; the bezel slides out past the edges, a warm glare fades | x4 screen-portal-push | `x` `y` (screen centre), `size` (screen width, 0.42), `color` (bezel) | 36 |
| `layer-swap` | the old scene is cut into paper layers along wavy horizon contours that drop out of frame near-to-far (vertical motion blur), the sky cross-fades, and the new scene's layers rise far-to-near | x5 diorama layer-swap | `seed` (contours) | 24 |
| `expand` | a small UI rect at (x, y) fills with `color` and grows (easeInQuad) into a full-screen panel inside which the next screen fades up; a tiny white centre dot rides along | x6 container-expand | `x` `y`, `size` (rect width, 0.27), `color` (panel) | 14 |
| `expand` (`collapse`) | the old screen shrinks to a small rectangle, then to a 4 px dot on black that holds; the next screen fades in | x6 container-expand (exit) | — | 18 |
| `diagonal` (`stepped`) | a broad colour band whose both edges are hard pixel staircases sweeps across at ~−30° carrying the new scene behind it, with a faint smear on the lead edge | x2 stepped-diagonal-wipe | `angle` (150), `color` (band, `#D2FC36`), `bands` (steps, 22), `size` (band width, 0.25) | 14 |
| `bands` (`line`) | a dot appears at (x, y), a thin line shoots out to both edges (easeOutExpo), then the line opens vertically into a band of the new scene with feathered motion-blurred edges; the dot stays to the end | x2 line-open-wipe | `x` `y`, `color` (line), `colors[0]` (dot, `#F6481E`) | 12 |

## Notes

- Almost all custom presentations render each scene once. Soft, banded and organic reveals use an SVG `<mask>`
  referenced from CSS (`mask: url(#id)`), so three.js and video scenes are not duplicated. Exceptions that render
  a scene more than once during the transition: `glitch` (3 offset copies), `door` (2 leaves of the old scene),
  `burn` (2 page halves of the old scene) and `layer-swap` (4 paper layers of each scene) — avoid those on very
  heavy three.js scenes.
- `mosaic`, `mosaic:swirl` and `tracking` drive SVG filters (`feDisplacementMap`, pixelate) per frame; `mosaic:swirl`
  generates its twist map on a canvas from the frame number only, so renders stay deterministic.
- The source timings are very fast (iris 4 f, bar 2–3 f, ripple 8 f at 60 fps). The recommended frames are a
  little longer so they read at 30 fps; use the source values for a harder cut feel.
- Overlays drawn by a transition (rims, bars, rays, snow) sit above both scenes. Compose overlays and captions
  stay above the transition.
