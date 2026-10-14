# video23 — "ABYSSES" (bathysphere descent infographic)

## Overview

| Property | Value |
|---|---|
| Resolution | 1920×1080, 30 fps, 2818 frames, 93.97 s, no audio |
| Structure | One continuous shot, no cuts, until a fade to black at 90.5 s and a title card |

**Story.** A French-language "how deep is the ocean" explainer. A brass steampunk bathysphere, with a cartoon old scientist at the porthole, hangs on a cable at the left third of frame while the world scrolls up past it. Real-world landmarks are used as depth rulers: the Statue of Liberty, an inverted Eiffel Tower, the Burj Khalifa. Then come deep-sea zones: midnight zone with jellyfish and anglerfish, a sperm whale vs giant squid, the Titanic wreck, the hadal zone with a snailfish and trench walls, and Challenger Deep with a plastic bag. A giant eye opens in the dark. The video fades to black and the title "A B Y S S E S" / "moins de 5 % de l'océan a été exploré" appears.

**Art style.** Photoreal / AI-painted cut-out sprites composited over a procedural vertical ocean gradient. Overlaid is a refined sci-doc HUD: thin monospace data, serif zone titles, and a log-scale depth ruler. There is a cinematic heavy vignette, god-rays and caustics near the surface, floating particulate ("marine snow"), and an additive lamp beam.

**Palette (sampled).**
- Water by depth, sampled at a mid-left patch over time (also used as the backdrop gradient):

| t (s) | Water colour |
|---|---|
| 5 | `#5EABBA` |
| 13 | `#2B88A2` |
| 18 | `#066F8F` |
| 22 | `#005C7D` |
| 26 | `#004768` |
| 30 | `#003B59` |
| 38 | `#00213A` |
| 46 | `#001326` |
| 50 | `#000C1D` |
| 56 | `#000005` |
| ≥62 | `#000000` |

  The top of frame is about one stop lighter than the bottom (for example, at 18 s the top is `#2D92AF` and the bottom `#004969`). Corners are always black (vignette).
- HUD:
  - Big depth number `#97CEE8`
  - Micro-labels `#51758B`
  - Stat values `#77B9D8`
  - Zone title `#DDEBF1`
  - Zone subtitle `#9DC3D8`
  - Ruler active label `#61ACCC`
  - Ruler inactive labels `#2A7191`
  - Callout box fill `rgba(10,40,55,.6)` with a 1 px border `#6FA5BC`
- Light: lamp glow `#BAA37C` (warm), beam core `#E8D2A0` at 25–40 % additive, bioluminescent jelly `#8A7CFF`/`#C7B8FF`, creature eye cyan `#38C8F0`
- End card: title `#E8EAEC` on `#000000`, tagline `#546067`

**Fonts.**
- Monospace (IBM Plex Mono / JetBrains Mono feel) for all data:
  - "PROFONDEUR" micro-label: 11 px caps height at y 63–74, tracking about 0.35 em
  - Big depth number: Light weight, cap height about 78 px (y 103–180, 7.2 % of H), French thin-space thousands ("10 935"), followed by a small "m" at about 30 % size
  - Stat row (PRESSION / LUMIÈRE / TEMP.): 10 px tracked labels over 18 px values
  - Ruler numbers and callouts: about 17 px
- High-contrast Garamond-style serif (Cormorant Garamond / EB Garamond):
  - Zone titles: all caps, cap height about 52 px (y 894–946), tracking about 0.25 em, at x 74
  - Ruler landmark names: italic, about 17 px
  - End card: "ABYSSES" with tracking about 1.1 em; tagline italic at about 18 px
- Margins: left HUD at x = 72 (3.75 %); title baseline y 946; ruler line at x = 1836 (84 px from the right edge).

## Timeline (one continuous shot)

| t (s) | Zone title (bottom-left) / subtitle | Landmarks and creatures | HUD and light events |
|---|---|---|---|
| 0.0–1.5 | — | Bathysphere silhouette in dark water; the scene fades up from black | Fade-in 0.3→1.5 s, ease-out |
| 1.0–7.6 | SURFACE / "11 km sous vos pieds" | Surface caustics and god-rays at top; a turtle enters from the right at 3 s and swims up-left; a fish school drifts in | The depth counter appears at 1.0 showing 0 and starts counting at 3.5. The title letters blur in at 2.5–3.3. |
| 7.6–16.2 | STATUE DE LA LIBERTÉ / "93 m · pression ×10" | The statue rises from the bottom-right at about 5 s; the fish school swirls around the torch; a callout "93 m · Statue de la Liberté" appears at 7.5 | Water darkens from a cyan to a teal gradient |
| 16.2–26.3 | TOUR EIFFEL / "330 m · record de plongée : 332 m" | An inverted Eiffel Tower hangs from above (enters at 13 s from the bottom, tip downward) | The lamp starts glowing at about 19 s and the beam fades in from 20 s |
| 26.3–36.0 | BURJ KHALIFA / "828 m · dernière lueur" | The Burj rises from below; the first jellyfish appear (28 s) | The counter slows to about 10 m/s around 828 m (a dwell) |
| 36.0–43.7 | ZONE DE MINUIT / "1 000 m · 90 % des espèces produisent leur lumière" | Many glowing jellyfish; an anglerfish swims into the beam (37–44) | The counter accelerates |
| 43.7–52.5 | CACHALOT · CALMAR GÉANT / "2 000 m · jamais filmé" | A sperm whale glides in at right (45 s); a giant squid crosses in front of the lamp (47–50), lit hot-orange by the beam | Squid flare: frame luminance +40 % at 48.5 |
| 52.5–61.2 | TITANIC / "3 800 m · neige marine" | The Titanic bow rises from the bottom-right, lit only inside the beam; a callout "3 803 m · épave du Titanic" | Background reaches black at about 56 s |
| 61.2–71.0 | ZONE HADALE / "6 000 m · pression ×600 · poisson à 8 336 m" | Rocky trench wall on the right edge, scrolling up; a pale snailfish swims slowly left in the beam (64–75) with a callout | |
| 71.0–83.3 | CHALLENGER DEEP / "10 935 m · 1 100 kg sur chaque cm²" | Seafloor ridge rises at the bottom-right (76 s); a plastic bag drifts into the beam with a callout "sac plastique trouvé à 10 928 m (2019)" | The counter stops at **10 935** at about 79.7 s |
| 83.3–90.5 | (title fades out) small text "moins de 5 % explorés" | A **giant eye opens** in the darkness behind the bag (87.1–88.4), then holds | HUD remains |
| 90.5–90.7 | — | — | Fast fade to black (0.2 s) |
| 91.0–93.97 | End card | — | "A B Y S S E S" per-letter blur-in (91.0–92.3), then the tagline fades in (92.3–93.0) |

## Motion techniques

### `depth-descent-scroll` (core layout engine)
- **Look.** The camera "sinks" while the hero object stays fixed at the left third (bathysphere centre about x 480, y 500). Every world object (landmarks, creatures, rocks, seabed) scrolls upward at a **constant about 90 px/s (3 px/frame)**. This was measured by feature tracking on the right half at 4–80 s: 86–96 px/s throughout, with short exceptions only where creatures self-animate. The background colour gradient darkens with depth, independently of scroll.
- **Decoupling.** The on-screen scroll is constant-speed for readability. The *numeric* depth runs on a separate keyframed curve (see `depth-counter-hud`). Landmarks are placed so they are on screen when the counter passes their real depth.
- **Recipe.**
  - Keep a world container `translateY = -frame * 3`.
  - Each item has `worldY` (px) chosen so that `worldY - scroll` is about 540 when `depthCurve(t) == item.depth`. Items enter from below at y 1080 + their height, and exit at the top.
  - Background: a `<rect>` filled with a vertical linear gradient whose two stops (top and bottom) are sampled from a depth→colour table: `[0 m #6BB6C6/#2E8AA0, 100 #3B9AB0/#136983, 300 #2D92AF/#004969, 800 #005070/#002641, 1500 #002844/#001125, 3000 #021629/#000209, 4500 #000A1A/#000000, ≥6000 #000105/#000000]`. Interpolate in linear RGB.
  - Vignette: a radial gradient that is transparent at 45 % and `#000` at 100 % (corners pure black), always on top of the world but below the HUD.
- **Props.** `items[] {sprite, depth, x, scale, flip}`, `scrollPxPerSec` (90), `depthColorStops`, `heroSprite`, `heroPos`.

### `depth-counter-hud`
- **Look.** Top-left block:
  - "PROFONDEUR" (mono, tracked, `#51758B`) over a huge light-mono number (`#97CEE8`, 78 px caps) with a small "m".
  - Below it, a stat row of three columns (PRESSION ×N | LUMIÈRE N % | TEMP. N °C) at x 72 / 192 / 302.
  - Numbers update every frame (rounded integers, French thin-space thousands).
- **Depth keyframes** (read from the 1 fps sheets, metres):

| t (s) | Depth | t (s) | Depth | t (s) | Depth |
|---|---|---|---|---|---|
| 3 | 0 | 30 | 860 | 55 | 3882 |
| 5 | 12 | 33 | 889 | 60 | 5089 |
| 8 | 60 | 35 | 924 | 65 | 6453 |
| 10 | 101 | 37 | 1004 | 70 | 7952 |
| 13 | 167 | 40 | 1260 | 75 | 9516 |
| 16 | 248 | 43 | 1651 | 78 | 10453 |
| 20 | 403 | 46 | 2112 | 79 | 10762 |
| 24 | 630 | 50 | 2830 | 79.7 | 10935 (stop, hold) |
| 27 | 781 | | | | |

  - Rates: 20 m/s at 8 s; 55 m/s at 22 s; slows to **about 10 m/s at 31–33 s** (dwell at the Burj, 828 m); then accelerates steadily to about 230 m/s at 55 s and about 310 m/s at 70–78 s; finally a hard ease-out stop.
  - Rule of thumb: speed eases down to about 15 % near hero landmarks, otherwise the curve is close to exponential acceleration.
- **Stats derived from depth.**
  - `pression = 1 + depth/10` (×8 at 71 m, ×86 at 853 m, ×1 095 at the bottom).
  - `lumière = max(0, 100*exp(-depth/14))` %, with 2 decimals near 0 ("0.03 %"). It shows 21 % at 71 m and 0 % beyond about 200 m.
  - `temp`: 19 °C at the surface, 11 °C at 300 m, 5.8 °C at 850 m, 2.2 °C at the bottom. Interpolate on a log-depth table.
- **Recipe.** `depth = monotoneCubic(keyframes)(frame/30)`. Render it with `toLocaleString('fr-FR')` and `font-variant-numeric: tabular-nums` so the digits don't jitter. Fade the HUD in at 1.0 s over 0.3 s.
- **Props.** `depthKeyframes`, `labels` (localised), `statFns`, `unit`, `colors`.

### `log-depth-ruler`
- **Look.**
  - A vertical hairline at x 1836 runs the full height (`#2A7191`, 1 px).
  - Tick marks (14 px) point left at x 1822–1836.
  - Labels are right-aligned at x 1805: a mono number plus an italic serif landmark name (for example "330 m *Tour Eiffel*").
  - A fixed "current depth" marker sits at y 540: a 6 px filled dot on the hairline with a 45 px horizontal line to its left.
  - The ruler scrolls so that the current depth is always at y 540.
  - The label nearest the marker brightens (`#61ACCC`, about 100 % opacity); the rest are dim (`#2A7191`, about 45 %).
  - Labels fade out about 120 px before reaching the top or bottom edge.
- **Scale (fitted from tick positions at t = 9 s and t = 30 s).** Logarithmic with an offset: `y = 540 + K*(log10(d + 20) - log10(D + 20))`, where D is the current depth and K is about 560–630 px per decade. A 625-px decade fits t = 30 to ±3 px.
  - Example at D = 853: 150 m → y 98, 330 m → 294, 500 m → 398, 1000 m → 594, 2000 m → 773, 5000 m → 1024.
- **Ticks.** Plain round depths (10, 20, 60, 150, 500, 1 500, 3 000, 5 000 m) interleaved with named landmarks (40 plongée loisir, 93 Statue de la Liberté, 214 record d'apnée, 330 Tour Eiffel, 535 manchot empereur, 828 Burj Khalifa, 1 000 zone de minuit, 2 000 cachalot, 3 803 Titanic, 6 000 zone hadale, 8 336 poisson le plus profond, 10 935 Challenger Deep).
- **Props.** `ticks[] {depth, name?}`, `pxPerDecade`, `offset` (20), `x`, `markerY`.

### `zone-title-blur-swap`
- **Look.** Bottom-left caption: a tracked serif caps title (52 px caps) over a mono subtitle line (17 px) and a thin 1 px underline rule (about 400 px, fading at its right end).
- **Out (about 0.55 s).** The subtitle and rule fade first (0.25 s). Then the title letters blur (0→8 px Gaussian) and fade together (0.3 s).
- **In (about 0.8–1.0 s).** Letters appear **left to right**. Each goes from opacity 0 and blur 10 px to opacity 1 and blur 0 over about 0.35 s, staggered **about 0.045 s per letter** (20 letters in about 0.9 s). The subtitle fades in 0.1 s after the last letter starts (0.3 s), and the underline draws left to right (0.4 s).
- Measured: SURFACE→STATUE swap with out 7.65–8.2 and in 8.2–9.1. Swaps happen at about 7.6, 16.2, 26.3, 36.0, 43.7, 52.5, 61.2, 71.0, plus a fade-out at about 83.
- **Recipe.** Split the title into `<tspan>`s. Per letter: `p = clamp((f - start - i*1.35)/10.5)`, `opacity = p`, `filter: blur((1-p)*10px)`. Use CSS `filter` on spans, or an SVG `feGaussianBlur` per glyph group.
- **Props.** `title`, `subtitle`, `letterStagger`, `blurPx`, `holdUntil`.

### `object-callout-tag`
- **Look.** A small HUD label attached to a moving object: a dark translucent box (`rgba(15,45,60,.65)`, 1 px light border, padding 8×10, mono 17 px text "93 m · Statue de la Liberté") offset up-right of the object. A thin diagonal leader line (1 px, 60 % white) runs from the box's lower-left corner to a small hollow 8 px circle on the object.
- **In.** Opacity 0→1 with y +12→0 px over about 0.25 s, ease-out. The leader line draws from the box toward the anchor over about 0.3 s. Out is a 0.3 s fade.
- The tag and anchor ride with the object (they scroll with the world).
- **Props.** `text`, `anchor`, `offset`, `inFrame`, `outFrame`.

### `bathysphere-idle-bob`
- The hero hangs on a cable that extends off the top of frame.
  - Vertical drift ±8–9 px on a period of about 7–8 s.
  - Horizontal drift ±6 px phase-shifted by about π/2.
  - Rotation 0° (measured: offsets ranged −16…+2 px in y and −6…+6 px in x over 24–32 s).
  - Rising bubbles (4–8 px circles at 40–60 % opacity) leave the top of the sphere every 1–2 s, rise at about 60 px/s and wobble ±4 px.
  - The propeller spins slowly.
- **Recipe.** `y = 9*sin(2π t/7.5)` and `x = 6*sin(2π t/7.5 + π/2)`. The cable is a line from (x+cx, −50) to the hook.
- **Props.** `amplitude`, `period`, `bubbleRate`.

### `headlamp-beam`
- **Look.** A brass lamp on the sphere (about x 690, y 330) gains a warm bloom halo: a radial gradient `#F4E2B0` at the centre to transparent at a radius of about 65 px. A soft volumetric cone projects to the right and slightly down, about 15–25° below horizontal, with a half-angle of about 4° near the lamp widening to about 8°. It is about 900–1100 px long and fades with distance.
- **Timing.** The lamp halo fades in over 19–24 s (lamp-patch luminance 108→134). It has a slow flicker of ±5 % at about 1 Hz. The beam opacity rises as ambient light falls (≈ `1 - lumière%`), so it is fully visible from about 26 s.
- Objects that intersect the beam are brightened (Titanic, squid, snailfish, bag). Recreate this with the beam shape as a mask over a "lit" copy of the sprite, or with `mix-blend-mode: screen` on the beam plus a separate brightened sprite clipped by the cone.
- The beam aim drifts slowly to point at the current subject: from about 18° at the Burj to about 25° at the Titanic and the bag, eased over 2–3 s.
- **Recipe.**
  - Cone: `<polygon>` filled with a `linearGradient` (along the axis) from `rgba(240,215,160,.45)` to 0, blurred with `feGaussianBlur stdDeviation=12`, `mix-blend-mode: screen`.
  - Add 10–20 drifting dust motes inside the cone that brighten when inside it.
- **Props.** `origin`, `angle` (keyframed), `length`, `spread`, `color`, `intensity` (driven by depth).

### `surface-caustics-godrays`
- **Look (0–12 s).** At the top 40 % of frame there is a rippling bright surface with caustic web lines. Diagonal light shafts (god-rays) fan down from the top centre-left, slowly swaying. All of this fades out with depth by about 14 s.
- **Recipe.**
  - Caustics: two layers of `feTurbulence type="fractalNoise"` (baseFrequency 0.006×0.02) animated via the `seed` or `baseFrequency` offset per frame, thresholded with `feComponentTransfer` (table to a thin bright web), tinted `#CFF3F8`, and masked by a top gradient.
  - God-rays: 6–10 long skinny triangles from a point above frame, opacity 0.05–0.15, each with a `sin(t*0.3+i)` opacity and ±1.5° sway, blend screen.
- **Props.** `rayCount`, `causticScale`, `fadeDepth`.

### `marine-snow-particles`
- **Look.** Hundreds of tiny (1–3 px) pale dots (`#8FB8C8` at 20–60 %) fill the deep scenes. They drift up with the world scroll (90 px/s) plus a slight independent sway, giving parallax: 3 depth layers at scroll factors 0.6 / 1.0 / 1.3 and sizes 1 / 2 / 3 px.
- **Recipe.** Use seeded positions with `y = (y0 - scroll*factor) mod H` and `x += sin(t*0.5 + seed)*6`.
- **Props.** `count`, `layers`, `color`.

### `sprite-swim-cycle` (creatures)
- **Fish school.** 30–40 small fish sprites in a boids-like loose cluster. The cluster centre drifts left→right at about 120 px/s. Each fish has `±1.5°` tail wiggle and a position offset `noise(i, t)` of ±25 px, all facing the travel direction.
- **Turtle / anglerfish / snailfish.** A single sprite with a slow path (Bezier, 4–7 s across). It has a 2–3 % squash or rotation wobble on a 1–1.5 s cycle (fin strokes), and a body tilt aligned to the path tangent.
- **Jellyfish.** The bell pulses: scaleY 1→0.85→1 and scaleX 1→1.08→1 with a period of 1.6–2.2 s and a random phase. On each contraction it moves upward 10–15 px relative to the world. The tentacles lag (skew ±6°). Glow: `drop-shadow(0 0 18px #8A7CFF)`.
- **Whale and squid.** Large sprites crossing in 3–4 s with ease-in-out. The squid has an orange highlight overlay while inside the beam.
- **Props.** `sprite`, `path`, `duration`, `wobbleHz`, `count` (schools).

### `drifting-debris-focus` (plastic bag)
- A small white bag sprite sinks diagonally toward the beam at about 25 px/s, rotating ±15° in a slow pendulum of about 3 s. It settles in the beam centre and becomes the focal subject for the eye reveal, with a callout attached. It is a narrative "punchline" object.
- **Props.** `sprite`, `path`, `swayDeg`, `callout`.

### `giant-eye-reveal`
- **Look.** In near-black, a huge reptilian eye, about 1300×620 px (x 600–1838, y 125–740), opens behind the bag. It starts as a thin horizontal slit of cyan light at 87.1 s.
  - The lids open vertically: the eye's lit area grows from about 200 px² to its full extent over **1.3 s (87.1→88.4)**, ease-out. Height per 0.1 s: 1, 3.5, 5.3, 6.9, 8.7, 10.0, 11.9, 13.3, 15.1, 15.4, 16.4, 17.1, 17.3 (×1000 px area).
  - The slit pupil then holds with slight shimmer.
  - Frame brightness rises from 12 to 17 (eye glow).
- **Recipe.**
  - Eye image masked by an almond `clipPath` whose height interpolates 0→620 px with `Easing.out(Easing.cubic)` over 39 frames.
  - Add a cyan glow halo `drop-shadow(0 0 40px #38C8F0)` ramping with it.
  - Pupil: scaleX 1→0.85 slowly (contracting from the lamp light).
  - The iris has a slow 0.5 Hz sparkle (opacity noise on a highlight layer).
- **Props.** `image`, `openDuration`, `glowColor`, `bbox`.

### `blur-letter-title-card`
- **Look.** On pure black: "A B Y S S E S" in white serif caps with very wide tracking (about 1.1 em), centred at about y 540, spanning about x 470–1450 with a cap height of about 70 px. A small italic serif tagline in grey `#546067` sits about 100 px lower.
- **Timing.** Fade to black is 90.5→90.7 (6 frames). The title starts at 91.0. All letters appear blurred (12 px) at low opacity, with a **randomised per-letter stagger** (B/Y/S/S/E first, the initial "A" and last "S" about 0.4 s later). They sharpen to 0 blur by about 92.3; each letter takes about 0.8 s, ease-out. The tagline fades in over 92.3–93.0 with a slight blur, then holds.
- **Recipe.** Per letter `delay = seededRandom(i)*0.45s`, `p = easeOut((t - 91 - delay)/0.8)`, `opacity = p`, `blur = 12*(1-p)`. Add a subtle text-shadow glow at 0.3.
- **Props.** `title`, `tagline`, `tracking`, `maxBlur`, `staggerRandomness`.

## Transitions
- Opening: fade up from black, 0.3→1.5 s, ease-out (the luminance curve rises steeply, then plateaus).
- There are no cuts in the 90-second body. "Scenes" are depth zones joined by the continuous scroll, the background colour ramp, and `zone-title-blur-swap` captions.
- Ending: a 0.2 s fade to black, a 0.3 s black beat, then the blur-in title card.

## Camera
- Locked 2D frame, with the descent implied by a world layer scrolling up at a constant 90 px/s.
- Parallax: world objects at 1.0, marine snow at 0.6/1.0/1.3, and surface caustics and god-rays as a screen-fixed layer that fades with depth.
- The hero (bathysphere) is screen-fixed with only an idle bob.
- No zoom or rotation.

## Library candidates
- `depth-descent-scroll`: a vertical "journey" layout with a fixed hero and a scrolling world, for depth, height, timelines or scale comparisons.
- `depth-counter-hud`: a keyframed odometer with derived stat readouts for any scientific or metric countdown.
- `log-depth-ruler`: a scrolling log-scale ruler with landmark ticks for magnitude comparisons such as height, distance or money.
- `zone-title-blur-swap`: an elegant per-letter blur-in chapter title with a subtitle and underline.
- `object-callout-tag`: a HUD label with a leader line attached to a moving object.
- `bathysphere-idle-bob`: a gentle floating idle motion with bubbles for any suspended hero object.
- `headlamp-beam`: a volumetric light cone with a halo that reveals and illuminates objects in darkness.
- `surface-caustics-godrays`: a procedural underwater surface light for aquatic or dreamy openings.
- `marine-snow-particles`: a multi-layer drifting dust parallax for depth and atmosphere.
- `sprite-swim-cycle`: reusable swim, pulse and school behaviours for creature cut-outs.
- `drifting-debris-focus`: a slow sinking, pendulum-swaying focal prop that leads into a reveal.
- `giant-eye-reveal`: a lid-opening masked reveal with glow for a dramatic creature or "being watched" twist.
- `blur-letter-title-card`: a black end card with a randomised per-letter blur-in title and tagline.
