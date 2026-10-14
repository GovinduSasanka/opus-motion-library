# video13 — "Clawd's Kakigōri" (a summer evening, made in code)

## Overview

| | |
|---|---|
| Resolution / fps | 1920×1080, 24 fps, 69.0 s, no audio. 30 shots joined by hard cuts, one whip-pan and a fade to black. The title card runs from 66.2 to 69.0. |
| Theme / story | A summer day on a Japanese balcony: a sky full of cumulus, paper lanterns, a glass wind chime (furin), a strawberry and an ice tray. A laptop terminal reads `npm test ✓ 42 passing / git push / done for today ☀`, then the screen sleeps. **Clawd**, an orange cube mascot, wanders along the rail and hops down to the laptop. He types `> make kakigōri for four`, the terminal answers `spawning helpers…`, and three mini-Clawd helpers pop out of the screen (strawberry, mint, ice). Each helper fetches its ingredient: it hops to knock down a strawberry and chops it on a lever slicer, catches a falling mint leaf on its head, and has an ice cube catapulted onto its head from the tray. Then they climb a tower of kana blocks and crank an ice shaver. Snow piles into a glass bowl. Toppings (strawberry slice, mochi) are pushed off a shelf onto the mound, and red, green and blue syrups pour in as glowing beams at golden hour. The four eat at dusk, watch a firework at night and pose for a group "photo". Fade to the title card "Clawd's Kakigōri — かき氷 · a summer evening, made in code". |
| Art style | Stylised three.js / toon-PBR look in the style of a Shinkai/Ghibli summer: painted cel-shaded cumulus, saturated skies, warm sun bloom and lens glow. Shallow depth of field in almost every shot (foreground leaves and background city are heavy bokeh). Props have rounded edges (bevelled boxes). Characters are made of **rounded-box primitives only**. Post-processing: bloom on emissive items (syrup beams, sun, firework), mild chromatic aberration at the frame edges (RGB fringe on the laptop bezel), very light grain, and a soft vignette. A per-shot colour grade moves through the day (see `time-of-day-grade`). **Characters are animated on twos (12 fps); the camera, particles and lighting run on ones (24 fps).** |
| Palette | **Day sky:** top `#5A8AE7`, mid `#85AAEB`, horizon `#D0DAEF`. Cloud lit `#F1EFEF`, cloud shade `#8A99D2`, sun core `#FBFBF8`. Lantern red `#A0384D`, terracotta pot `#8E4F4B`, deck wood (lit) `#FFD579`. **Clawd / helpers:** body lit `#FA7C50`/`#E8683F`, body mid `#C95E3B`, body shade `#BF5235`, eyes `#1E1620` (sampled `#48343E` through blur) with a white catch-light. **Terminal:** bg `#362D43`, title bar `#3F344B`, traffic lights `#FE624E` `#FCCC31` `#4ED88A`, command blue `#6AC4FF`, success green `#6DECA6`, highlight yellow `#FFD85D` / `#FFCE5E`, status blue `#86CCFF`, list salmon `#FFA484`, pixel sprite `#F07A58`. **Syrups:** red `#FE2638` (on ice `#D2235E`), green `#5EC85C` (on ice `#4DA789`), blue `#6FA0F9` (on ice `#6387F6`), ice lilac `#9B9AEF`/`#B9B0E3`. **Golden hour:** sky `#B59EC5`, sun `#FEFDF6`. **Dusk:** sky `#EE9392`. **Night:** sky top `#3A346B` → `#303453` after the firework, sky mid `#7B5084`, night cloud `#52427C`, trees `#293248`. **Title card:** bg `#000000`, sprite `#D77655`, box stroke `#E5E5E5`, title `#FFFFFF`, subtitle `#CBCBCB`. |
| Fonts | **Terminal:** a bold monospace (JetBrains Mono Bold / DejaVu Sans Mono Bold). On screen the x-height is about 30 px (≈2.8 % H) in the close-up, and the line pitch is about 1.45 em (≈82 px). **Title card:** a neo-grotesque regular (Arial / Helvetica). "Clawd's Kakigōri" is about 84 px with a 607 px ink width. The subtitle is the same family at about 28 px, with the kana set in Noto Sans JP. |

## Timeline

Cut times are from ffmpeg scene detection, frame-exact at 24 fps.

| # | t (s) | Content | Motion | Transition out |
|---|---|---|---|---|
| 1 | 0.000–1.625 | Establishing shot: cumulus sky, a string of 4 lanterns, a potted plant on the balcony rail, tiny Clawd on the rail, a kana block stack at the lower right | `slow-dolly-push` variant: tilt up, the content drifts down 36 px/s (≈58 px total). `pendulum-sway` on the lanterns. | Hard cut |
| 2 | 1.625–2.833 | Glass furin with a goldfish print and a blue tanzaku strip. The background is bokeh city. | `pendulum-sway` (±3°, 1.2 s period). A slight pan of −30 px at 1.83. | Hard cut |
| 3 | 2.833–3.917 | Macro: a strawberry hanging from its stem | `droplet-slide-drip`: a water bead slides from the shoulder to the tip and drips | Hard cut |
| 4 | 3.917–5.000 | Macro: ice-cube tray on the warm deck | Near-static, with a faint push | Hard cut |
| 5 | 5.000–6.000 | Terminal close-up, already complete: `$ npm test`, `✓ 42 passing`, `$ git push`, `done for today ☀`, `$ _` | `terminal-line-reveal` (cursor blink). Screen power-down 5.60→5.90. Camera drifts left 36 px/s. | Hard cut |
| 6 | 6.000–12.000 | Wide balcony: white planter, Clawd on the rail, terracotta pot, city haze | `cube-mascot-walk`: Clawd shuffles right, yaw-turns to camera (10.35–10.6), walks toward camera, hops off the rail (11.1–11.3, exits bottom). The empty frame holds 0.7 s. `slow-dolly-push` at ≈3 %/s scale. | Hard cut |
| 7 | 12.000–14.208 | Laptop through out-of-focus foreground leaves; Clawd on the keyboard | Old text fades 12.00→12.45. `terminal-line-reveal`: prompt at 12.51, status and helper 1 at 12.72, helper 2 at 12.97, helper 3 at 13.22. `screen-spawn-pop-out` ×3 (stagger 0.25 s) with `sparkle-burst`. Helpers land and turn to camera with `eye-expression-swap` (^ ^). | Hard cut |
| 8 | 14.208–16.417 | Strawberry helper beneath a hanging strawberry | `hop-cycle` ×2 (0.42 s hops, apex ≈27 % H), then `gravity-drop-settle`: the strawberry falls 15.50→15.75 and bounces | Hard cut |
| 9 | 16.417–18.833 | Lever slicer on a cutting board | `lever-stomp-action`: the helper hops onto the knife handle about every 0.5 s and the blade pivots down; slices flop over and pile up | Hard cut |
| 10 | 18.833–20.417 | Mint helper beside a blue plant pot (close) | `eye-expression-swap` to "> <" (effort). Small `hop-cycle` (8 f period, ≈6.5 % H) ×3, then a big leap at 19.85–20.1. | Hard cut |
| 11 | 20.417–21.417 | Close-up of the helper's face | `leaf-flutter-fall` 20.60→21.00 lands on the head. Blink "— —" at 21.08, then "^ ^" at 21.33. | Hard cut |
| 12 | 21.417–24.000 | Ice tray, slicer and blocks; Clawd and the ice helper | `lever-stomp-action`: Clawd stomps a blue paddle (21.6, 22.3). `steam-puff` billows over the tray. An ice cube is launched and lands on the ice helper's head (23.2–23.45). | Hard cut |
| 13 | 24.000–26.625 | A tower of coloured kana/number blocks beside the blue ice-shaver frame | The helper climbs with `hop-cycle` steps. `crane-up` camera: 330 px each in x and y, easeInOut, 24.25–26.25, peak 216 px/s. | Hard cut |
| 14 | 26.625–29.625 | Top of the ice shaver (spring spindle, red crank) | `crank-orbit-walk`: the helper circles the spindle pushing the crank, ≈1 rev / 1.25 s. Push-in ≈4.5 % over 1.8 s. | Hard cut |
| 15 | 29.625–32.625 | Under the blade disk; the block tower in bokeh | `snow-fall-accumulate`: flakes fall from the disk and the mound grows from the bottom edge | Hard cut |
| 16 | 32.625–35.000 | Mint helper (leaf on head) under the snow | `snow-fall-accumulate` on the head (33.2–33.9), squint "> <", `shake-off-particles` 34.0–34.35, "^ ^" at 34.4 | Hard cut |
| 17 | 35.000–37.417 | Snow mound in a footed glass bowl on a wicker mat | `orbit-arc` around the bowl (≈0.5 s accelerating truck at 36.3–36.9, ≈340 px) | Hard cut |
| 18 | 37.417–39.625 | Upper shelf: a helper with a plate. Mound in the blurred foreground. | `gravity-drop-settle`: the strawberry slice is nudged off, tumbles and lands on the mound (37.9–38.4) | Hard cut |
| 19 | 39.625–42.000 | Same set-up | `gravity-drop-settle` ×2: pink mochi (≈40.3) then green mochi (≈40.9), stagger ≈0.6 s | Hard cut |
| 20 | 42.000–45.000 | Golden hour, low angle: helpers beside a rack of red/green/blue syrup bottles, the ice-shaver frame, the 氷 flag, sun flare | `time-of-day-grade` shifts to warm. `slow-dolly-push` ≈6 % over 3 s. | Hard cut |
| 21 | 45.000–46.625 | Close-up: Clawd beside the red bottle, a helper peeking | Slow drift down 36 px/s plus ≈5 % push | Hard cut |
| 22 | 46.625–49.625 | Mound with toppings, from the shelf side | `syrup-beam-pour` red, beam on at 47.12; red coverage creeps down the mound | Hard cut |
| 23 | 49.625–51.625 | Same mound | `whip-pan` 49.79→49.96 (366 px in 4 f, then settling 48 px), then `syrup-beam-pour` green at 50.96 | Hard cut |
| 24 | 51.625–53.625 | Wide dusk: two helpers stack into a tower to tip the blue bottle | `hop-cycle` onto the partner's head. `syrup-beam-pour` blue at 52.4. | Hard cut |
| 25 | 53.625–56.000 | Hero: the tri-colour kakigōri with wavy syrup bands | `slow-dolly-push` ≈6 % plus tilt (−6 px/step). `steam-puff` mist drifting at the sides. | Hard cut |
| 26 | 56.000–58.417 | Two helpers with spoons by the bowl, dusk purple | `spoon-bob-eat` loop | Hard cut |
| 27 | 58.417–60.625 | Close: the helpers' spoons in front of the bowl | `spoon-bob-eat` (spoon-to-mouth ≈0.6 s), push ≈6 % | Hard cut |
| 28 | 60.625–64.000 | Night: four characters on the ledge with spoons, city lights, purple clouds | `time-of-day-grade` (purple → navy at the flash). `firework-burst`: launch 62.0, flash 62.25, expansion to 63.0, fade to 64. `scene-light-flash` on the trees. | Hard cut |
| 29 | 64.000–65.750 | Group portrait: four characters with coloured spoons (yellow/blue/red/green), all "^ ^" | `scene-light-flash` (firework light, warm flash at 65.21, +31 luma, 0.5 s decay). Clawd leans 8–10° on twos. Push ≈6 %. | `fade-to-black` 65.75→66.15 |
| 30 | 66.17–69.000 | Title card on black | `title-card-fade` in 66.17→66.55, then hold | End |

## Motion techniques

### `cube-mascot-rig`
**Look:** Clawd is one bevelled box body with a width:height ratio of about 1.35:1, flat front, corner radius ≈8 % of the body height. Two small box "arms" stick out at mid-height on the sides, about 0.25×0.3 of the body height. Four short rectangular legs sit in a row under the body (each ≈0.12 W wide and 0.3 H tall, with even gaps). The face is two square eyes at ≈0.3 H from the top, ≈0.55 W apart, each with a one-pixel-style white catch-light at the top left. There is no mouth. Helpers use the same rig at 0.55–0.65× scale. The 2D twin is a 12×8 pixel sprite (9 px cells on the title card):
```
..########..
..#.####.#..   (eye holes at col 3 and 8)
############
############
..########..
..########..
..#.#..#.#..
..#.#..#.#..
```
**Walk:** the legs alternate in pairs (1+3 / 2+4), lifting ≈0.1 H for 2 drawings each (4 f per step at 12 fps). The body bobs 2 % H and rocks ±3° in roll. A turn is a pure yaw of 90° over ≈6 f (eased in/out) with no squash.
**three.js:** `RoundedBoxGeometry` for every part; `MeshToonMaterial` or a 3-band ramp with body colours `#FA7C50`/`#C95E3B`/`#BF5235`; eyes are a separate plane with an expression texture atlas.
**Props:** `scale`, `bodyColor`, `expression`, `accessory` (leaf | ice-cube | snow-cap | spoon), `walkPhase`, `yaw`, `lean`.

### `animate-on-twos`
**Look:** character transforms change only every 2nd frame. Measured frame differences alternate low/high (e.g. 0.13 / 3.9 / 0.10 / 3.7 at 22 s). The camera, particles and lighting stay smooth at 24 fps. This gives the hand-animated, stop-motion feel.
**Remotion:** `const charFrame = Math.floor(frame/2)*2;` feed `charFrame` to all character poses and the real `frame` to the camera, particles and lights.
**Props:** `step=2` (1 = off), and per-layer opt-in.

### `eye-expression-swap`
**Look:** expressions are instant texture swaps, held on twos. There is no tween. Set: `dots` (default), `closed` "— —" (blink, 2–4 f), `squint` "> <" (effort / snow on head), `happy` "^ ^" (end of each beat). A blink sits between expression changes: `dots` → `closed` (≈6 f) → `happy` (21.08 → 21.33).
**Implementation:** an SVG/canvas atlas of 4 glyph pairs, drawn as a `CanvasTexture` on the face plane. Stroke weight ≈0.04 body H, colour `#1E1620`.
**Props:** `keyframes: [{frame, expression}]`, `autoBlink` (every 2.5–4 s, 3 f).

### `hop-cycle`
**Look:** a snappy parabolic hop with no stretch. The body keeps its shape and tilts slightly forward on the way up. The rise is slower than the fall.
**Measured (strawberry helper, close shot):** take-off 14.58, apex 14.83 (6 f rise), land 15.00 (4 f fall), ground contact 2 f, next hop 15.08 → **period 0.5 s**. Apex ≈296 px (**27 % H**). Small mint hops: **8 f period**, amplitude ≈70 px (6.5 % H). A big leap is about 1.5× the duration.
**Curve:** `y = h·sin(π·u)` skewed with `u' = u<0.6 ? 0.5*u/0.6 : 0.5+0.5*(u-0.6)/0.4`, giving a 60 % rise and 40 % fall. Add pitch `+6°·sin(πu)`. Land with a 1-drawing 5 % squash (y-scale 0.95).
**Props:** `height`, `durationFrames=10`, `contactFrames=2`, `count`, `from`, `to` (for climbing steps or landing on a partner, as in the stack in shot 24), `riseRatio=0.6`.

### `terminal-line-reveal`
**Look:** a dark macOS-style terminal (bg `#362D43`, three traffic-light dots, 8-bit Clawd sprite at the top right). Each line appears **whole in one frame**, with no per-character typing, and each line has its own colour. Lines arrive about 5–6 f apart. A static `$ _` cursor blinks.
**Measured:** prompt `> make kakigōri for four` (yellow `#FFCE5E`) and `thinking…` (blue) at 12.51. `spawning helpers…` replaces "thinking" at 12.72 along with `◆ helper 1  strawberry` (salmon `#FFA484`). helper 2 at 12.97 and helper 3 at 13.22 (**6 f stagger**). Clearing the old text: opacity 1→0 over 12.00→12.45 (≈11 f, linear). Power-down (shot 5): all text and chrome dim to the screen bg over 5.60→5.90 (7 f, easeIn).
**Implementation:** an HTML/SVG texture on the laptop screen plane (CanvasTexture re-drawn per frame), or a flat Remotion `<div>` with `font-family: JetBrains Mono; font-weight: 700`. `visibleLines = lines.filter(l => frame >= l.at)`.
**Props:** `lines: [{text, color, at}]`, `cursorBlinkFrames=12`, `clearAt`, `powerOffAt`, `spriteCorner`.

### `screen-spawn-pop-out`
**Look:** a bright pin-point glint appears on the terminal next to a new line, then a ring of tiny 4-point sparkles. A small 3D helper materialises inside the screen and flies **out of the screen plane** toward the camera, growing, before landing on the keyboard or deck in front.
**Measured:** glint 1 f (12.72) → sparkle ring 1 f → helper visible at ≈7 % H (12.80) → leaves the screen, scale ×3–4, travelling down-left over ≈10–12 f → lands with a `hop-cycle` contact. Three spawns, **stagger 6 f**.
**three.js:** start at the screen-plane position with `scale 0.25`; tween position along a quadratic Bezier (control point toward the camera) with `easeOutQuad` and scale with `easeOutCubic`. Hide by depth until it crosses the screen plane, or render the screen as a portal.
**Props:** `origin` (screen uv), `landing` (world pos), `flightFrames=12`, `stagger=6`, `count`, `withSparkle`.

### `sparkle-burst`
6–10 tiny white/pale-yellow 4-point stars (plus-shaped, 6–14 px) spread in a ring of radius 3–5 % H around a point. They twinkle in scale (0→1→0 over 6–8 f, random phase) and drift outward ≈20 px. They are used at spawns, at snow shake-off and as ambient specks on the terminal screen. **Props:** `count=8`, `radius`, `color='#FFF6D8'`, `lifeFrames=8`.

### `gravity-drop-settle`
**Look:** a prop (whole strawberry, a strawberry slice, mochi balls) is nudged off an edge, tumbles with a small spin and falls under gravity. It lands with one small bounce and settles into the surface.
**Measured:** strawberry top edge 152 → 268 → 432 → 652 px at 2 f steps (15.50→15.75), i.e. ≈500 px in 6 f, accelerating (`easeInQuad`). Bounce ≈8 % of the fall height over 4 f. Toppings are staggered ≈0.5–0.6 s. Spin ≈90–180° during the fall.
**Implementation:** `y = y0 + 0.5*g*t²` with g chosen so the fall takes 6–10 f. On contact use `spring({damping:12, stiffness:200})` for the settle and a slight tilt to align with the surface normal.
**Props:** `from`, `to`, `fallFrames`, `bounce=0.08`, `spinDeg`, `delay`.

### `leaf-flutter-fall`
A thin leaf falls 20.60→21.00 in a falling-leaf path: x oscillates ±6 % W with a 0.35 s half-period and roll ±40°, y descends with a near-linear (drag-limited) speed of ≈1.2 H/s, and it lands flat on the character's head. **Props:** `from`, `to`, `swayAmp`, `swayPeriod`, `durationFrames=10`.

### `droplet-slide-drip`
A clear refractive bead (`MeshPhysicalMaterial` with transmission) slides down a curved surface from the shoulder to the tip over ≈0.9 s, accelerating (`easeInQuad`). It elongates by 1.3× at the tip, detaches and drops out of frame (≈4 f). A new bead forms at the top. **Props:** `pathCurve`, `durationFrames=22`, `beadSize`.

### `steam-puff`
A cloud of soft white sprites (alpha 0.3–0.6) billows up and sideways from a source: it grows from 0 to about 30 % W in ≈0.4 s (`easeOutCubic`), then drifts and fades over 1–1.5 s. It is used for frost off the ice tray and for the mist around the hero bowl. **Implementation:** 20–40 billboard sprites with a radial gradient, each with its own scale/opacity curve, or an SVG `feTurbulence` blob mask. **Props:** `origin`, `spread`, `riseSpeed`, `lifeFrames`.

### `lever-stomp-action`
A character hops onto one end of a lever or handle (the knife slicer, the ice-tray paddle). On contact the lever rotates about its pivot by 20–30° in 2 f (`easeOutQuad`) and returns as the character rebounds (≈6 f, `easeOutBack`). Each press triggers a payload: a strawberry slice falls over, or an ice cube launches on a parabola and lands on another character's head. Cycle ≈0.5 s. **Props:** `pivot`, `angleDeg`, `pressFrames=2`, `returnFrames=6`, `onPress` (spawn payload).

### `crank-orbit-walk`
A character walks a circle around a vertical spindle, holding the crank arm, with its body yaw locked tangent to the circle. Period ≈1.25 s per revolution, constant angular speed, walk cycle on twos. The spindle spring compresses slightly each half turn. **Props:** `center`, `radius`, `revPeriodFrames=30`, `direction`.

### `snow-fall-accumulate`
**Look:** shaved-ice flakes (white specks 3–8 px, some triangular) fall from the blade-disk centre in a column ≈15 % W wide and fan out slightly. The mound under the column grows as a dome rising from the bottom edge: height 0 → ≈35 % H over 3 s (`easeOutQuad`), width ≈1.7× height. On a character, a lilac snow cap (`#B9B0E3`) grows on the head over ≈0.7 s.
**Implementation:** a GPU particle system (instanced quads, ≈300 alive, vy 0.6–1.0 H/s, small x jitter, 1–1.5 s life). The mound is a hemisphere scaled in y with a noise-displaced surface, toon-shaded white/lilac.
**Props:** `emitter`, `rate`, `columnWidth`, `moundGrowFrames`, `moundMaxHeight`.

### `shake-off-particles`
The character wiggles in roll ±12° at ≈8 Hz on twos for ≈8 f, offset ±2 % W. On the first wiggle the accumulated cap bursts into 10–20 flakes that fly out radially (speed ≈0.8 H/s, gravity) and fade over 10 f. The expression switches to `happy` right after. **Props:** `durationFrames=8`, `angle=12`, `particleCount=16`.

### `syrup-beam-pour`
**Look:** the syrup is a thin vertical **emissive beam** (width ≈1.5 % W, a hot white core with a coloured rim and strong bloom) from the top of the frame down to the mound. It switches on in 1 f and wobbles ±2 px. Where it hits, the colour spreads down the mound as a **wavy-edged band** whose lower edge creeps down with `easeOutQuad` over ≈2.5 s. Adjacent bands are separated by lilac wavy gaps, which gives the final striped look.
**Measured:** red on 47.12 (band reaches the base ≈49.5), green on 50.96, blue on 52.4. Beam colours red `#FE2638`, green `#5EC85C`, blue `#6FA0F9`.
**three.js:** the beam is a `CylinderGeometry` with additive emissive material plus `UnrealBloomPass`. The coverage is a shader on the dome: `mask = step(angleDist, bandWidth) * step(heightFromTop, progress + 0.04*sin(12*angle + time))`.
**Props:** `color`, `startFrame`, `spreadFrames=60`, `bandAngle`, `bandWidth`, `waveFreq=12`, `waveAmp`.

### `spoon-bob-eat`
A spoon held at a 45° tilt dips toward the bowl and back to the character's face in a ≈0.6 s loop, with `easeInOutSine` on rotation (±25°) and position (≈5 % H), on twos. Characters are offset in phase by ≈0.2 s. **Props:** `periodFrames=14`, `phaseOffset`, `spoonColor`.

### `firework-burst`
**Look:** a faint launch streak rises (62.0–62.2). A **flash ball** (white core `#FFF6E0`, soft glow radius ≈150 px) appears at 62.25 and holds 2–3 f. It turns into a peony of ≈250 gold sparks. Sparks fade from the core first, drift down ≈3 % H and twinkle.
**Measured burst radius:** 83 px (62.42) → 133 (62.58) → 160 (62.75) → 183 (63.0) → 193 (63.4). That is `easeOutCubic`, **R ≈195 px (18 % H)** over ≈0.9 s. Dim-out by 64.0. Centre ≈(1290, 300) px.
**Implementation:** spark i has direction `dir_i` on a sphere (projected), `r(t) = R*easeOutCubic(t/0.9s)`, `alpha = 1 - smoothstep(0.4, 1.0, t/T)`, plus `y += 0.5*g*t²`. Add an additive-blend glow sprite for the flash.
**Props:** `center`, `radius`, `sparkCount=250`, `color`, `launchFrames=5`, `flashFrames=3`, `expandFrames=22`, `fadeFrames=24`.

### `scene-light-flash`
Global illumination pulse synced to an off-screen light (a firework). Frame mean luma jumps +31 (97 → 128) in 1 f at 65.21 and decays exponentially (`τ ≈ 0.3 s`) back to base over ≈0.5 s. The flash is warm (`#FFC48A` tint). In shot 28 the trees brighten and green up during the firework flash. **Remotion:** an overlay `<AbsoluteFill style={{background: tint, mixBlendMode: 'screen', opacity: a*Math.exp(-(f-f0)/7)}}>`. In three.js, animate a point/hemisphere light's intensity instead. **Props:** `at`, `peak=0.3`, `decayFrames=7`, `tint`.

### `pendulum-sway`
Hanging items (lanterns, furin, the furin's paper strip) rotate about their hanging point: `θ = A·sin(2πt/T + φ)` with A 2–4°, T 1.2–2 s, and a different phase per item. The paper strip lags by ≈0.15 s. **Props:** `amplitudeDeg`, `periodFrames`, `phase`, `pivot`.

### `time-of-day-grade`
**Look:** one continuous evening across the film. Mean frame colour per second: day `#A7B5D1` (0–12 s) → warm interior `#B49386` (14–24) → golden hour `#B0908C`, sky `#C9A8AF` (42–44) → dusk pink `#C58E89` (48) → mauve `#A36E7C` (50–53) → purple `#7F5868` (56–60) → night `#5D465E`, sky `#302F60` (62–63) → warm portrait `#A06359` (65).
**Implementation:** a keyframed grade (lift/gamma/gain or a 3-colour gradient-map LUT) indexed by global time, plus the matching sky gradient and sun-light colour and angle in three.js. In Remotion use `interpolateColors(frame, stops, colors)` for the light colour and a CSS `filter` / SVG `feColorMatrix` overlay for the grade.
**Props:** `stops: [{t, sky, sun, ambient, grade}]`.

### `dof-bokeh-layers`
Every shot uses a shallow depth of field with a fixed focus on the hero (no rack-focus pulls were measured: per-region sharpness stays flat inside every shot). There is a foreground blur layer (leaves, a pot rim, the mound) and a background city/sky bokeh. Blur radii are ≈12–25 px for the background and ≈30 px for the foreground. **three.js:** `BokehPass` / postprocessing `DepthOfFieldEffect` with `focusDistance` locked to the subject. **SVG:** stack layers with `filter: blur()`. **Props:** `focusTarget`, `bokehScale`, `fgBlur`, `bgBlur`.

### `slow-dolly-push`
Nearly every held shot creeps in. Measured scale growth: ≈1.5–3 %/s (6–12 s: 1.03 per second; 42–45: 6 % over 3 s; 53.6–56: 6 % plus a tilt of 36 px/s). Motion is linear or very gentle `easeInOutSine`. A few shots tilt (0–1.6: content drifts down 36 px/s) or drift laterally at 36 px/s. **Props:** `zoomPerSecond=0.025`, `panPx`, `tiltPx`, `easing`.

### `crane-up`
The camera rises past the block tower to follow the climbing helper. Translation is ≈330 px in x and ≈330 px in y (diagonal, ≈30 % H) over ≈2.0 s. The velocity profile is bell-shaped: 18 → 36 px per ¼ s peak → 12 px, i.e. **easeInOutSine**. **Props:** `deltaWorld`, `durationFrames=48`, `easing`.

### `whip-pan`
A fast lateral camera swing between two framings of the same subject: 366 px in 4 f (≈2200 px/s) with motion blur, followed by a 4 f settle (48 px, `easeOutCubic`). It reveals a new side of the subject inside one shot (49.79→50.13). **Props:** `deltaX`, `whipFrames=4`, `settleFrames=4`, `motionBlur=true`.

### `orbit-arc`
The camera orbits the bowl about its vertical axis by ≈25–35° over the 2.4 s shot. It starts slow and accelerates near the end (36.3–36.9 lateral speed ≈120 px per ¼ s), i.e. `easeInCubic`, which leads into the next cut. **Props:** `target`, `startAzimuth`, `endAzimuth`, `radius`, `easing`.

### `fade-to-black` and `title-card-fade`
**Fade to black:** frame luma 103 → 85 → 61 → 35 → 12 → 0 over 65.73→66.15 (**10 f, roughly linear to easeIn**). The black gap is 1 f.
**Title card fade-in:** text peak luma 13 → 58 → 120 → 187 → 243 → 255 over 66.17→66.55 (**9 f, linear opacity**), then a static hold of ≈2.5 s.
**Layout (all centred on x = 960):** pixel sprite 108×72 px at (906, 354), 9 px cells, `#D77655`. Outlined box 707×135 px from (606, 454) to (1313, 589) (36.8 % W × 12.5 % H), stroke 2–3 px `#E5E5E5`, no fill. Title "Clawd's Kakigōri" in white Arial ≈84 px, ink 656–1263 × 492–571. Subtitle "かき氷 · a summer evening, made in code" in `#CBCBCB` at ≈28 px, ink 661–1259 × 621–653. Vertical gaps: sprite→box 29 px, box→subtitle 32 px.
**Props:** `title`, `subtitle`, `sprite` (pixel matrix), `boxPadding={x:50,y:38}`, `fadeInFrames=9`, `fadeOutFrames=10`.

## Transitions
- **Hard cuts** carry the film (28 of 30 shot changes). Cuts land on beat ends: a character finishes an action, turns to camera or shows a "^ ^" face, and the next shot opens on the next task. Shots last 1.0–3.0 s, apart from the 6 s establishing wide (shot 6).
- **Empty-frame hold before a cut** (11.3–12.0): the character exits the frame and the empty set holds ≈0.7 s.
- **Whip-pan** inside shot 23 (4 f) instead of a cut.
- **Fade to black** (10 f) → 1 f of black → **title-card fade-in** (9 f).
- **Screen power-down** (5.60→5.90) works as an in-shot "lights out" before the cut to the wide.

## Camera
- A three.js perspective camera with a moderate-tele look (≈35–50 mm equivalent) and shallow DOF in every shot. The camera height is mostly at character eye level (low, on the deck). Shot 20 is a low-angle hero shot looking up at the shelf against the sun.
- Moves are slow and continuous: push-ins of 1.5–3 %/s, tilts and drifts of 36 px/s, the crane-up in shot 13 (easeInOut, 2 s), the orbit in shot 17 (easeIn) and the whip-pan in shot 23. There is no handheld shake.
- The camera runs at 24 fps while characters animate on twos.
- Lighting tracks the time of day: a directional sun with a warm rim and a cool ambient, moving to a low golden sun with lens flare, then a pink/purple dusk, then night with city emissives and firework flashes.

## Library candidates
- `cube-mascot-rig` — parametric rounded-box mascot (body, arms, 4 legs, eye atlas, accessories) in three.js plus a 2D pixel-sprite twin
- `animate-on-twos` — wrapper that steps character animation at 12 fps while the camera stays at 24
- `eye-expression-swap` — instant face-texture swaps (dots, blink, squint, happy) with auto-blink
- `hop-cycle` — snappy no-stretch hop with a 60/40 rise/fall split; chainable to climb steps or stack on a partner
- `terminal-line-reveal` — coloured mono terminal, line-at-a-time reveal, clear and power-down states
- `screen-spawn-pop-out` — sprite spawns with a glint and sparkle on a screen, then flies out into 3D and lands
- `sparkle-burst` — ring of twinkling 4-point stars
- `gravity-drop-settle` — nudge-off, gravity fall with spin, bounce and settle
- `leaf-flutter-fall` — swaying falling-leaf path
- `droplet-slide-drip` — refractive bead slides down a surface and drips
- `steam-puff` — billowing soft smoke/frost cloud
- `lever-stomp-action` — character stomps a lever that pivots and fires a payload
- `crank-orbit-walk` — character walks a circle around a pivot, turning a crank
- `snow-fall-accumulate` — falling particle column plus a growing mound/cap
- `shake-off-particles` — roll wiggle that throws off accumulated particles
- `syrup-beam-pour` — emissive beam plus a wavy-edged colour band spreading over a dome
- `spoon-bob-eat` — looping eat gesture with phase offsets
- `firework-burst` — launch, flash, easeOut peony expansion, drooping fade
- `scene-light-flash` — global light/tint pulse with exponential decay
- `pendulum-sway` — phase-offset swing for hanging props
- `time-of-day-grade` — keyframed sky/sun/LUT progression from day to night
- `dof-bokeh-layers` — fixed-focus shallow DOF with foreground and background blur layers
- `slow-dolly-push` — per-shot creeping zoom, tilt or drift
- `crane-up` — eased diagonal camera rise following a subject
- `whip-pan` — 4-frame motion-blurred lateral swing plus settle
- `orbit-arc` — eased azimuth orbit around a target
- `title-card-fade` — black end card with pixel sprite, outlined title box and subtitle; fades in and out
