# video21 — "The Call of the Lantern / ランタンの呼び声" (pixel-art game trailer)

## Overview

| Property | Value |
|---|---|
| Resolution | 1920×1080, 30 fps, 900 frames, 30.06 s, no audio |
| Active picture | Cinemascope letterbox: rows **130–950** (820 px tall, 2.34:1) for all cinematic shots; title card uses **155–925**. Gameplay shots (7.2–15.9 s) are full-frame 16:9. |
| Pixel grid | Cinematic art is rendered at **320×137 virtual pixels**, upscaled ×6 nearest-neighbour (every "pixel" = 6×6 screen px). Gameplay UI is crisp full-res; only the 3D scene / lantern inside it is pixelated. |

**Story.** Polar-expedition horror deck-builder. A cold-open pans up from a burning brass lantern to the gloved hand holding it and on to the weathered explorer's face (breath fogging). Hard cut to a white blizzard that clears into card-battle gameplay (blind penguin, then a purple "beyond the mountains" level). A sanity hit triggers a letterboxed eye close-up that snaps to green "madness" (狂気). Story beats follow as pixel-art stills (ice ship under aurora with a subtitle box, man clutching his head, sepia portrait, scattered sketches with a photo tossed on top, rope between mittens, explorer watched by glowing green eyes), ending on the aurora title card.

**Art style.** Low-res pixel art painted over 3D or photo renders. Hard 6 px pixels, ordered 2×2 checkerboard dithering on soft gradients (breath, fog, glow), limited palettes per shot (each shot is graded to one hue family: amber/orange, navy+teal, sepia, green). Light film grain and a soft dark vignette. Gameplay is a dark, desaturated low-poly 3D scene with a clean, thin-line Japanese UI.

**Palette (sampled).**
- Letterbox / void `#000000`, night sky `#030409`, deep navy `#03081C`, sea `#030A1E`, mountain shadow `#101D38`
- Lantern: flame core `#FCFDFC`, flame orange `#F17F2A`, brass `#F4B84D`, ember `#B76A27`
- Skin, lantern-lit: highlight `#DC6722`, shadow `#261512`
- Aurora: `#46DEA0` (highlight), `#1C7B64`, `#124E49`
- Blizzard white-out `#97A3BB` (centre), `#727A8E` (edges)
- Sepia paper `#946C23`, photo grey `#776765`
- Madness green: highlight `#89E04D`, overlay `#0B2A10`; kanji red `#DA4F4D`
- Title gold `#F3BE66`, title English `#EBF3FB`
- UI: bar background `#16110F`, energy orb `#EDCE93`, HP bar red `#96606E`

**Fonts.**
- Title, Japanese: brush-style Mincho in gold, about 122 px tall (11 % of H), x 454–1481.
- Title, English: "THE CALL OF THE LANTERN", a slab-serif typewriter face in all caps, about 50 px cap block (4.6 % of H), sitting above the JP line, centred.
- Subtitles: white Gothic (sans) at about 34 px, inside a thin grey double-rule box (`#616161` outer line) spanning x 467–1452 and y 933–1045. The box overlaps the bottom letterbox.
- Madness kanji 狂気: bold red Mincho at about 65 px (6 % of H), centred just under the eye strip (y 784–849).
- UI: Japanese Gothic with thin outlined panels.

## Timeline

| # | Start–end (s) | On screen | Motion | Out-transition |
|---|---|---|---|---|
| 1 | 0.00–7.20 | Brass lantern (flame flickering) → gloved hand on handle → arm → explorer's face, eyes lift, breath puff | Fade up from black over 0.2–0.6 s. A continuous **camera tilt-up** of about 2210 px of painting with ease-in-out (peak about 580 px/s at 3.8 s) plus a slight rightward drift of about 70 px/s. The lantern sways a few degrees. A dithered breath puff appears at about 5.5 s. | Hard cut |
| 2 | 7.20–8.35 | Full-frame blizzard white-out (horizontal pixel snow) | Snow streaks fly horizontally. Gameplay dissolves in through it over 7.3–8.3 s. The "あなたのターン / 1ターン目" banner fades in centred. | Crossfade (about 1.0 s) |
| 3 | 8.35–9.27 | Gameplay: blind penguin in snow, lantern at bottom-left, 5-card hand | Cards deal in from the left; a "+6" buff number rises; snow falls | Hard cut |
| 4 | 9.27–11.80 | Gameplay level 2 (purple cave, octopus enemy) | A card is selected and its tooltip pops. Hit reaction: the enemy flashes to a white silhouette, a diagonal slash streak crosses it, the damage number "13" pops and floats up, and the status "脆弱+3" rises. The energy orb counts 3→1. | Hard cut |
| 5 | 11.80–15.10 | Gameplay level 3 (dark purple, 3 enemies, lantern turns violet) | Card hover lifts a card; a played card flies to centre-top, enlarges, and an orange burn line runs along its base. A second hit-flash appears with "25". | **Eye-strip slam** at 15.10 |
| 6 | 15.10–15.90 | Horizontal band (y 324–755) with a pixel close-up of the eyes in orange; gameplay behind dims to about 25 % | The strip opens from the centre line in 0.2 s; the eyes squint | **Green flash** at 15.93 |
| 7 | 15.93–17.17 | Same layout, now green duotone; the eyes are wide with orange irises; 狂気 in red below | Flash decays (see `madness-flash-tint`); the kanji flickers on | Hard cut |
| 8 | 17.20–18.17 | Ice ship under aurora, pixel art, with a JP subtitle box | Static; aurora shimmer; sparse snow | Hard cut |
| 9 | 18.20–19.07 | Man clutching his head by a lamp (red/orange) | Static hold | Hard cut |
| 10 | 19.10–20.17 | Sepia portrait (old bearded man) lying on a patterned cloth, seen at an angle | Near static, slight brightness breathing | Hard cut |
| 11 | 20.20–21.87 | Table covered in sepia mountain sketches; a grey mountain photo is **tossed onto the pile** (enters at 20.75, lands at 21.6) | Photo drop (see `photo-toss-settle`). Warm light pool in the top-left. | Hard cut |
| 12 | 21.90–23.27 | Two orange mittens pulling a rope taut against a navy blizzard | Rope tension jitter of 1–2 px; snow streaks | Hard cut |
| 13 | 23.30–25.77 | Explorer (left third) looks over his shoulder; glowing green eyes in the dark on the right | Eye pairs fade or blink in at staggered times; diagonal wind streaks; snow | Hard cut |
| 14 | 25.80–30.06 | Title card: aurora over pixel mountains, a lone figure with a lantern glow at bottom centre | The aurora curtain shimmers. **Title pops on at 26.70 with no fade.** Snow falls. Letterbox is slightly narrower (155–925). | End |

## Motion techniques

### `pixelate-dither-look` (global style pass)
- **Look.** Every cinematic frame is a 320×137 image upscaled ×6 with nearest-neighbour. Soft regions (fog, breath, glow halos) use a 2×2 checkerboard (Bayer) dither in virtual pixels. Each shot is graded to 3–6 hue ramps. A faint grain and a vignette sit over the top.
- **Recipe (Remotion).**
  - Draw the scene into an offscreen canvas at `W/6 × H_active/6` (`320×137`).
  - Optionally quantise: map each pixel's luminance to an N-step ramp (props `palette: string[]`, N about 5–8). Apply ordered dither with the threshold `bayer2[x&1][y&1] * (1/N)` added before quantising.
  - Draw it to the visible canvas with `imageSmoothingEnabled=false` at ×6.
  - SVG alternative: render vector art inside a `<foreignObject>`/canvas, then CSS `image-rendering: pixelated` on a 320-px-wide `<canvas>` scaled to 1920.
  - Overlay grain: per frame, seeded `random(frame)` noise at 3–4 % opacity, blend `overlay`.
  - Vignette: radial gradient from transparent at 55 % radius to `rgba(0,0,0,.55)` at the corners.
- **Props.** `pixelSize` (6), `palette`, `ditherStrength`, `grain`, `vignette`.

### `cinemascope-letterbox`
- Black bars hold the active area at y 130–950 (820 px). The title card tightens to 155–925.
- Bars are always pure `#000000` and are hard-cut, never animated. UI subtitle boxes may overlap the bottom bar.
- **Props.** `aspect` (2.34), `offsetY`.

### `tall-tilt-reveal` (cold-open camera tilt)
- **Look.** One tall pixel painting (about 3030 px tall, i.e. 3.7× the active height): lantern at the bottom, hand, arm, face at the top. The camera tilts up across it in one move, which turns a single still into a "shot".
- **Timing (measured by phase correlation).** Motion begins at about 1.0 s and ends at 7.2 s; total travel is about 2210 px.
  - Velocity per 0.2 s: 12, 24, 36, 48, 52, 60, 72, 76, 84, 92, 96, 96, 100, **116, 116** (peak at 3.6–4.0 s), then 112, 108 … 60, 48, 28, 12.
  - This is a sine ease-in-out with the peak slightly early; use `cubic-bezier(0.45, 0, 0.4, 1)`.
  - Horizontal drift: a constant −14 px per 0.2 s (content moves left, so the camera pans right) about 70 px/s, about 430 px in total.
- **Extras.**
  - Fade from black, 0.2→0.6 s, linear.
  - Flame flicker: per-frame random scale 0.9–1.1 on the flame sprite plus 2–3 alternating sprite frames.
  - Sparks: 3–6 one-pixel embers rising at 20–40 px/s.
  - Lantern sway: rotate ±3° with a 2.5 s sine, pivot at the handle.
  - Breath puff: dithered white blob (`#C8C8D0` at 70 %). Scale it 0.6→1.2 and fade it 0.8→0 over 1.0 s, drifting right 60 px.
- **Recipe.** `translateY = interpolate(frame, [30, 216], [0, 2210], {easing: Easing.bezier(.45,0,.4,1)})` applied to a tall `<g>`. Apply `translateX` linearly to −430. Pixelate after the transform so pixels stay on the 6 px grid: round the translation to multiples of 6.
- **Props.** `layers[]` (stacked image sections), `travel`, `durationInFrames`, `drift`.

### `blizzard-whiteout-dissolve`
- **Look.** Hard cut to a pale blue-grey white-out (`#97A3BB` centre, vignetted to `#727A8E`). Hundreds of white pixel snowflakes stream sideways. Flakes are 6×6 or 12×6 rectangles plus faint 30–60 px horizontal streak lines at about 25 % opacity.
- **Timing.** The pure white-out holds for 0.1–0.2 s. Then the next scene fades in underneath: overall luminance goes 160→50 over 7.3–8.3 s, ease-out (fast at first). The snow layer keeps running on top at reduced density.
- **Particles.** About 600 flakes. Speed: x of 900–1600 px/s, y of 50–150 px/s. Size 6–12 px. Opacity 0.6–1.0. Use seeded random positions that wrap modulo the width.
- **Recipe.** `snowX = (seedX*W + frame*speed) % (W+100)`. Draw rects snapped to 6 px. Streaks are `<line>` elements of length `speed*0.04` at 20 % opacity. The scene underneath gets `opacity = interpolate(f, [3, 33], [0, 1], easeOut)` and the white overlay `opacity = 1 - that`.
- **Props.** `flakeCount`, `wind`, `tint`, `fadeDuration`.

### `turn-banner-fade`
- "あなたのターン" appears in wide-tracked thin Mincho (tracking about 0.4 em) with a small sub-line "1ターン目" beneath, centred at 35 % of H. It fades in over about 0.4 s, holds for about 0.6 s, then fades out over 0.3 s as the cards deal.
- **Props.** `title`, `subtitle`, `hold`.

### `card-hand-deal-and-play` (deck-builder UI)
- **Hand.** 5 cards (about 175×250 px), fanned with a −6°…+6° rotation and a y-arc of about 20 px, bottom centre (x 510–1460, y 800–1070). Each card has a cost circle top-left, a title, an art window and a description.
- **Deal.** Cards fly from the draw pile at bottom-left (about x 300, y 1000) to their fan slots. Stagger about 0.08 s, duration about 0.35 s with ease-out back, `cubic-bezier(.2,.9,.3,1.2)`.
- **Hover/select.** The card lifts 40 px and scales 1.0→1.15, and a tooltip box appears to its right. Takes about 0.15 s.
- **Play.**
  - The card moves to the top centre (about x 960, y 310) and scales to about 0.9.
  - After about 0.3 s an orange glowing underline (`#F2A54A`) appears at its base.
  - It then dissolves upward.
  - The remaining cards close the gap over about 0.25 s, ease-out.
- **Energy orb.** A gold radial-gradient circle (`#EDCE93` to `#B07020`) with a number; the number swaps instantly.
- **Props.** `cards[]`, `fanAngle`, `dealStagger`, `playIndex`.

### `hit-flash-damage-pop`
- **Look.** Hit reaction on an enemy.
  - Frame 0: the enemy is replaced by a flat white silhouette (opacity 0.9) for 2–3 frames.
  - A diagonal white slash streak (a thin tapered line about 260 px long at about −25°) wipes across it in 3 frames.
  - The damage number ("13", "25") pops at the enemy chest: scale 1.6→1.0 in 4 frames. It then rises about 40 px while fading over 0.8 s.
  - A secondary status text ("脆弱+3", pink `#E07A8A`) rises from the same spot 0.3 s later.
  - The HP bar shrinks from right to left over 0.3 s, with a white "ghost" segment trailing by 0.2 s.
- **Recipe.** Use `<filter>` with `feColorMatrix` set to white for the silhouette. Animate the slash `<path>` with `stroke-dashoffset`. Number `transform = translateY(-40*p) scale(spring(...))`.
- **Props.** `damage`, `status`, `color`.

### `eye-strip-slam`
- **Look.** A full-width horizontal band slams open over the dimmed gameplay, showing an extreme close-up of the eyes. Band final bounds: y 324–755 (431 px, 40 % of H), full width. It is centred vertically (centre y 540).
- **Timing (measured at 30 fps from 15.117 s).** Band height per frame: 29, 212, 348, 407, 423, 431 px. That is about 6 frames (0.2 s) with a fast-middle ease-out, `cubic-bezier(.3,.0,.2,1)`. It opens symmetrically from the centre line.
- **Background dim.** Behind the band, luminance drops 8.4→2.2 (a black overlay ramping to about 0.75 alpha) over the same 6 frames.
- **Content.** The pixel image inside does not scale; the band is a mask. Its content is an orange-graded pixel close-up.
- **Recipe.** `<rect y={540 - h/2} height={h} width=1920>` used as a `clipPath` over the eye image. `h = interpolate(f, [0, 6], [0, 431], {easing: bezier(.3,0,.2,1)})`. Underneath, `<rect fill="#000" opacity={0.75*p}>`.
- **Props.** `image`, `bandHeight` (0.4 H), `openFrames` (6), `dim` (0.75).

### `madness-flash-tint`
- **Look.** A sanity-break stinger. The band's image swaps to the "wide-eyed" version. At the same frame the whole screen flashes pale green-white, then settles into a green duotone tint, and a red kanji flickers on.
- **Flash.** Top-area RGB goes from black to `#74A07B` in 1 frame (15.933 s). It then decays exponentially over about 0.2 s, roughly halving every 2 frames: (116,160,123) → (86,132,94) → (69,117,76) → (46,96,54) → (35,83,44) → (21,69,30) by +5 frames. A slow linear fade follows from (17,61,24) to (7,27,11) over 1.0 s.
- **Duotone.** The band content is remapped to a green ramp: shadows `#030407`, mids `#4E6A2C`, highlights `#89E04D`. The orange irises are kept (selective colour).
- **Kanji 狂気.** Red `#DA4F4D` Mincho bold, 65 px, centred at y 816. It flickers: on at +0.30 s for 2 frames, off for 3 frames, then on steadily from +0.47 s. There is no scale animation.
- **Recipe.**
  - Flash: `<rect fill="#B6F0BE" opacity={exp(-f/2.5)}>` with `mix-blend-mode: screen`.
  - Tint: `<rect fill="#0B6A1A" style="mix-blend-mode:color">` at 0.7 opacity plus `multiply` darkening that ramps over 30 frames.
  - Duotone on the band: an SVG `feColorMatrix` to luminance, then `feComponentTransfer` table mapping to the green ramp.
  - Flicker: `visible = f>=9 && f<11 || f>=14`.
- **Props.** `tintColor`, `flashColor`, `word`, `flickerPattern`.

### `subtitle-box`
- A centred black box with a 2 px grey `#616161` border and an inner 1 px rule, about 990×112 px, at the bottom (y 933–1045), overlapping the letterbox. It holds white Gothic text (about 34 px), left-padded about 40 px.
- It appears instantly on the shot cut. No typewriter is visible: the sentence is fully shown within the 1 s shot.
- **Props.** `text`, `width`.

### `photo-toss-settle`
- **Look.** A grey photo (white border about 10 px) is dropped onto a pile of sepia sketches, entering from the top-right of frame.
- **Measured** (centre x/y in px, apparent width).

| t (s) | Centre | Width | Note |
|---|---|---|---|
| 20.77 | (1323, 181) | partly off-frame | enters |
| 21.00 | (1127, 248) | 628 | |
| 21.13 | (1084, 297) | 650 | maximum |
| 21.40 | (1053, 347) | 548 | |
| 21.60 | (1011, 459) | 455 | final |

  - Settles at 21.6 s with no overshoot. Total about 0.85 s.
  - Its apparent size grows to 1.4× of the final size mid-flight, then shrinks to 1.0, which reads as falling from above the camera onto the table.
  - Rotation goes from about −12° to about −2°.
- **Recipe.** Use a keyframed path:
  - `x: [1500, 1130, 1010]` and `y: [-100, 250, 460]` over frames `[0, 8, 26]`, `Easing.out(Easing.cubic)`.
  - `scale: [1.3, 1.43, 1.0]`, peaking at frame 11.
  - `rotate: [-14, -6, -2]`.
  - Add a drop shadow `drop-shadow(0 0 12px rgba(0,0,0,.6))` whose offset shrinks as the photo nears the table.
- **Props.** `image`, `from`, `to`, `duration`, `scalePeak`.

### `aurora-curtain`
- **Look.** Vertical teal-green light curtains (`#46DEA0` → `#1C7B64` → `#124E49`) above silhouetted mountains, pixelated and dithered. The curtains slowly undulate and shimmer in brightness.
- **Recipe.**
  - Draw 8–14 vertical gradient strips (width 40–140 px, height 300–600 px) with tapered alpha at both ends.
  - For each strip: `x += sin(t*0.4 + i)*8 px`, `opacity = 0.5 + 0.3*noise(i, t*0.5)`, and a slight skew of ±3°.
  - Blend `screen` over the navy `#03081C` sky, then run the `pixelate-dither-look` pass.
- **Props.** `colors`, `curtainCount`, `speed`.

### `watching-eyes-in-dark`
- **Look.** Pairs of glowing green elliptical eyes (`#4CB040` with a bright `#C8F0A0` core and a dark slit pupil) at different sizes (40–110 px) scattered through dark negative space on the right of frame.
  - New pairs fade in over about 0.3 s, staggered about 0.4 s apart, so the count grows.
  - Each pair blinks occasionally: scaleY 1→0.1→1 over 4 frames.
  - The pairs drift slightly with the wind streaks.
- **Recipe.** Use a seeded array of `{x, y, size, tIn}`. Set `opacity = interpolate(f - tIn, [0, 9], [0, 1])` and `blink = (f + seed*37) % 75 < 4 ? 0.1 : 1`. Give each eye a small radial `feGaussianBlur` glow.
- **Props.** `count`, `color`, `staggerSec`, `region`.

### `title-hard-pop`
- The title appears in a single frame (26.70 s) over the running aurora scene, with no fade or scale. Layout: the English slab line is centred at y about 445 and the JP gold line centred at y about 570. Both lines are centred horizontally.
- Text is crisp, not pixelated. The JP title has a subtle 2 px dark drop shadow.
- **Props.** `titleEn`, `titleJa`, `delay`.

## Transitions
- Fade from black at 0.2–0.6 s (open).
- At 7.20 a hard cut to the white-out, then a 1.0 s ease-out dissolve into gameplay (`blizzard-whiteout-dissolve`).
- Gameplay cuts (9.27, 11.80) are hard cuts.
- 15.10 uses the `eye-strip-slam` as a band-mask overlay; 15.93 uses the `madness-flash-tint` (a white-green flash frame).
- All story stills (17.2, 18.2, 19.1, 20.2, 21.9, 23.3, 25.8) are **hard cuts on beat** with no dissolves, each about 1.0–2.5 s long.
- The title text hard-pops 0.9 s after the title-scene cut.

## Camera
- Shot 1 is a continuous tilt-up of about 2210 px plus a pan of about 430 px, ease-in-out over 6.2 s (`tall-tilt-reveal`).
- Every other shot is a locked-off camera. Life comes from in-image animation: flame, snow, aurora, blinking eyes, rope jitter.
- There are no parallax layers in the cinematics apart from a snow layer in front.
- Gameplay has a fixed camera with a low-poly 3D background and one particle snow layer.

## Library candidates
- `pixelate-dither-look`: a retro 6 px pixel and ordered-dither post-process for any scene or still.
- `cinemascope-letterbox`: hard 2.34:1 bars for a cinematic trailer feel.
- `tall-tilt-reveal`: turns one tall illustration into an eased vertical camera reveal shot.
- `blizzard-whiteout-dissolve`: a weather white-out cut that dissolves into the next scene.
- `turn-banner-fade`: a centred, wide-tracked announcement such as "Your turn" or "Chapter 1".
- `card-hand-deal-and-play`: a card fan with deal, hover and play for game or product-feature reels.
- `hit-flash-damage-pop`: a white flash, slash and floating number for impact or stat-change moments.
- `eye-strip-slam`: a horizontal band mask opening fast over dimmed content for a dramatic close-up.
- `madness-flash-tint`: a flash plus duotone recolour plus flickering keyword for "state change" stingers.
- `subtitle-box`: a bordered narrative caption box for story beats.
- `photo-toss-settle`: a photo or card dropped onto a surface with scale-down and rotate settle.
- `aurora-curtain`: a procedural shimmering aurora sky backdrop.
- `watching-eyes-in-dark`: staggered glowing eye pairs for suspense or horror moments.
- `title-hard-pop`: a single-frame title reveal on a beat over a living background.
