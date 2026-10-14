# video3 — "Same Blueprint, Two Renderers" (Blender vs Three.js split-screen pirate-galleon build)

Scratch frames: `analysis/frames/video3/` (`p_L.jpg` / `p_R.jpg` = 2 fps panel overviews, `d_*.jpg` = dense bursts of unroll, wire build, masts/sails, dissolve, cannon, title, logo; `f_*.png` full-res frames; `c_*.png` panel crops).

## Overview

| Property | Value |
|---|---|
| Resolution | 1920 × 1080 (16:9) |
| FPS | 24, animation on ones |
| Duration | 23.55 s (564 frames) |
| Audio | AAC present (ignored) |

**Story/theme.** A Japanese-language comparison card: the headline 「同じ「設計書」から、2通りの描き方」 ("From the same blueprint, two ways of drawing") sits above two synchronized 16:9 panels. Both panels play the *same* storyboard rendered by two engines — left "Blender" (offline, export ≈12 min), right "Three.js" (browser, export ≈45 s): a parchment blueprint unrolls, a glowing wireframe galleon extrudes up out of the plan, planks materialize, masts and sails build, then a dissolve to the finished ship sailing a sunset sea, firing its cannons, with an in-panel title card 「海賊船 / The Pirate Galleon / 夕凪の海へ、帆を上げよ」, a fade to black and a "Create by Ayuneo" signature. The surrounding chrome (title, labels, captions, footnote) never moves.

**Art style.** Dark, warm "cinema presentation" layout: near-black warm background, cream headline, orange vs. blue colour-coding for the two sides. Panel content is 3D-rendered (PBR wood, emissive amber wireframe with bloom, golden spark particles, sunset sky, reflective sea). For a Remotion/SVG rebuild, the panel content is best treated as either (a) embedded video/`<OffthreadVideo>`, (b) `@remotion/three` scenes, or (c) 2.5D SVG approximations described below.

**Palette (sampled).**
- Background `#0b0907`; divider hairline `#35342d`
- Headline `#f8e2c0`; subheadline `#d5d0c7`; body text `#e8e4df`; footnote `#928e89`
- Left accent (Blender) `#e8af78` label / `#e3b181` stat line
- Right accent (Three.js) `#76c8fb` label / `#80c4f2` stat line
- Panel content: parchment `#ccbca6` / `#93826b`, ink lines `#3a3026`, wax seal red `#b0242a`, wireframe glow amber `#ca9d66` (Three.js) / peach-white `#d47c64`→`#fae8d3` (Blender), spark gold `#ffd79a`, wood dark `#332015` / `#3c2a1b`, hull red stripe `#8a2a22`, sail canvas `#c8b48a` (Blender) / `#d8d2c0` (Three.js), sunset sky `#917a77` / `#a48a82`, sea `#5c483a`
- In-panel title `#f3d8c5`; end logo `#a0cdf8`

**Fonts.**
- Headline: Japanese gothic sans **Bold** (Noto Sans JP / Hiragino Kaku Gothic W6 look), glyph height 51 px (≈4.7 % H → font-size ≈ 54 px), centred, bbox x 533–1388, y 92–143.
- Subheadline: same family Regular, ≈30 px (glyph 28 px, 2.6 % H), y 170–198, centred, slight tracking (+0.05em).
- Panel labels "Blender" / "Three.js": geometric sans **Bold** (Futura/Jost/Nunito-Sans-Bold look), ≈38 px (glyph 30 px), centred under each panel at y 837–875.
- Description lines: JP sans Regular ≈28 px, line 1 white y 900–926, line 2 coloured y 944–971.
- Footnote: JP sans Regular ≈22 px, `#928e89`, centred y 1022–1045, begins with "※".
- In-panel title: 「海 賊 船」 Mincho serif (Noto Serif JP SemiBold) with ≈1 em tracking, ≈34 px (6.5 % of panel H); "The Pirate Galleon" **blackletter** (UnifrakturMaguntia / Old English) ≈18 px; tagline Mincho ≈14 px.
- End logo: "Create by" thin humanist sans small caps-ish (≈22 px) + "Ayuneo" elegant high-contrast display serif/script with a swash "A" (≈40 px), light blue.

**Layout grid (1920 × 1080).**
- Outer margin 8 px left/right; panels: left `x 8–952`, right `x 968–1912`, both `y 275–805` (944 × 530 ≈ 16:9); 16 px gutter with a 2 px divider at x 960.
- Header block occupies y 90–200 (top margin ≈8.5 %); panel block y 275–805 (49 % of H, vertically centred at 540); label block y 837–971; footnote y 1022–1045 (bottom margin ≈3 %).
- Everything horizontally centred: headline on 960; each label stack on its panel centre (480 / 1440).

## Timeline

Both panels follow the same beat sheet, in sync (±2 frames). Chrome is static for the full 23.55 s.

| # | Start–End (s) | Panels show | What moves | Transition |
|---|---|---|---|---|
| 1 | 0.00–0.75 | Rolled parchment blueprint on a wooden rod, dark void | **Scroll unrolls** downward (rod travels down ≈60 % of panel H, paper revealed above it), camera tilting from oblique; panel luminance ramps (fade-in 0→1.5 s) | continuous |
| 2 | 0.75–2.40 | Blueprint lies flat (galleon plan, compass rose, title cartouche, red wax seal stamps in at 0.9 s) | Slow **camera orbit/push** over the plane (rotation ≈15°, dolly in ≈20 %), ease-in-out | continuous |
| 3 | 2.40–4.40 | Blueprint + rising wireframe | **Wireframe extrudes** out of the plan: keel & frame ribs rise as glowing amber lines (2.6–3.4), deck furniture boxes light up, stern castle & rails wire in (3.0–3.9); golden **spark particles** drift up; a few bright "light pen" streaks whip around (3.0–3.3) | continuous |
| 4 | 4.40–5.75 | Close on hull | **Planks materialize**: strips flash bright white/emissive then cool to dark wood (4.4–5.5), red gunwale stripe & gunports appear; camera dollies along hull | continuous |
| 5 | 5.75–8.75 | Deck & rigging | Masts/yards rise as wireframe lines (5.75–7.5), sails exist as grid wireframes; camera tracks aft-to-fore & tilts up | continuous |
| 6 | 8.75–11.85 | Rigging, then 3/4 stern view | **Sail cloth fills** the wire grids (8.75–9.25, ≈0.5 s), camera pulls back to stern 3/4 (10.25–11.8); blueprint visible beneath ship | 0.1 s dissolve |
| 7 | 11.85–16.60 | Finished galleon on a sunset sea (reflective water, island silhouette) | Slow push-in / drift, gentle ship bob, water reflections ripple; **cannon fire** 15.45–16.0 (two flashes ≈0.25 s apart, then smoke puffs grow) | continuous |
| 8 | 16.60–19.50 | Same + in-panel title card | **Title lines fade in staggered** (海賊船 16.6–17.0, "The Pirate Galleon" 16.95–17.3, tagline 17.05–17.4); Blender = bottom-left placement, Three.js = top-left | fade |
| 9 | 19.50–20.00 | — | **Panels fade to black** (0.5 s, linear-ish: luminance 100 → 51 → 0 at 19.5/19.75/20.0) | black |
| 10 | 20.00–23.00 | Black panels | **Logo feather-wipe reveal** "Create by Ayuneo" left→right 20.6–21.15 (≈0.55 s) with simultaneous opacity rise; hold | — |
| 11 | 23.00–23.55 | Logo | Fade out (0.5 s) to black panels; chrome remains | end |

## Motion techniques

### `split-screen-compare` (layout template, core)
- **Look:** static presentation chrome around two equal 16:9 panels playing synchronized content; each panel has a colour-coded label (orange vs blue), a one-line description, and a coloured stat line; a shared headline + subheadline above and a footnote below. No chrome animation — the comparison is the motion.
- **Parameters:** see Layout grid above; panel aspect 944:530; gutter 16 px with 2 px divider `#35342d`; label colours `#e8af78` / `#76c8fb`.
- **Recipe (Remotion):** `<AbsoluteFill style={{background:'#0b0907'}}>` → header `<div>` centred (top 92 px), two `<div>` panels absolutely placed with `overflow:hidden`, each containing a `<Sequence>`/`<OffthreadVideo>` or scene component receiving the *same* `frame` (keep perfectly in sync). Label stacks positioned at panel centres. Optional: chrome fade-in at start (not used here).
- **Props:** `headline`, `subheadline`, `left {label, color, desc, stat, content}`, `right {…}`, `footnote`, `gutter`, `panelAspect`, `background`.

### `scroll-unroll-reveal`
- **Look:** a parchment scroll on a wooden rod unrolls: the rod (cylinder with end caps, `#8a5a2b`, specular stripe) translates downward across ≈60 % of the panel height in ≈0.75 s (`easeOutCubic`), revealing the paper above it (clip follows the rod); the paper surface is in perspective (tilted ≈55°) and the camera simultaneously pushes in; a red wax seal stamps onto the corner at 0.9 s (scale 1.3 → 1, 4 frames).
- **Recipe (2.5D SVG):** paper as a `<g>` with `transform: perspective()`-style matrix (use a CSS 3D `rotateX(55deg)` container); clip rect height = `rodY(t)`; rod = rounded rect with linear gradient, a slight rotation wobble. Seal = `spring()` scale.
- **Props:** `duration` (0.75 s), `paperContent`, `rodColor`, `tiltDeg`, `sealAt`.

### `plane-camera-orbit`
- **Look:** slow camera move over a flat document: combined rotateZ ≈15°, push-in scale 1 → 1.2 and tilt change, ease-in-out over ≈1.6 s. Lighting vignette (dark corners) stays fixed to the screen.
- **Recipe:** CSS 3D container `perspective: 1200px`, inner plane `rotateX(a(t)) rotateZ(b(t)) scale(s(t))`, all `interpolate` with `Easing.inOut(Easing.cubic)`; vignette overlay radial gradient.
- **Props:** `from {rx, rz, scale}`, `to {…}`, `duration`.

### `wireframe-extrude-build` (core)
- **Look:** a 3D object assembles out of its 2D plan: lines first appear on the blueprint, then **lift vertically** into 3D (ribs grow upward from the keel line, frames rise like bars), each line drawn on with a bright emissive head (white-hot `#fff2dc`) and an amber tail (`#ca9d66`, glow ≈6–10 px blur at 60 %); parts appear in a build order (keel → ribs → decks → castles → rails → masts → yards → sail grids), staggered ≈0.08–0.15 s per part, each part drawing in ≈0.3–0.5 s. Blender look = thin peach-white grid mesh; Three.js look = sparser amber lines with more bloom.
- **Recipe:** model the object as 3D line segments grouped by `buildOrder`; per segment progress `u = clamp((t − start_i)/dur_i)`; vertical extrusion: `z = z_final · easeOutCubic(u_lift)` (start from z=0 on the plan); draw-on with `strokeDashoffset`. Project with a simple perspective camera (shared with `plane-camera-orbit`). Glow = duplicate path with `filter: blur(6px)` and `mix-blend-mode: screen`. Head = small circle at the current draw tip, radius 3 px, white with blur halo.
- **Props:** `segments[] {a, b, group}`, `groupOrder`, `stagger`, `drawDuration`, `lineColor`, `glowColor`, `glowRadius`, `liftFromPlane: boolean`.

### `ember-spark-particles`
- **Look:** tiny golden sparks (1–3 px, `#ffd79a`, additive) drifting upward from the build area with slight sideways wobble, twinkling (opacity flicker), lifetimes 0.6–1.5 s; density highest where lines are being drawn; 40–120 visible.
- **Recipe:** seeded emitter positions sampled along currently-drawing segments; `p = p0 + (vx, −vy)·age + wobble`; opacity `sin(π·age/life)·(0.6+0.4·noise)`; `mix-blend-mode: screen`.
- **Props:** `rate`, `life`, `rise` (px/s ≈ 40–80), `color`, `emitFrom`.

### `emissive-materialize`
- **Look:** surfaces fill in strip by strip (planks along the hull, then sails): each strip first appears **overexposed white/amber** (emissive) and cools within ≈0.3 s to its final material colour (dark wood `#332015`, canvas `#c8b48a`), wave travelling along the hull length (≈1 s for the hull, ≈0.5 s for sails); the wireframe stays visible on top and fades out afterwards (≈0.5 s).
- **Recipe:** strips ordered by position; `heat_i(t) = clamp(1 − (t − t_i)/0.3)` once visible; `fill = interpolateColors(heat, [material, '#fff2dc'])`, add a blurred copy with opacity `heat` for bloom. Visibility `t ≥ t_i = t0 + i·stagger`.
- **Props:** `strips[]`, `stagger`, `coolDuration`, `hotColor`, `materialColor`, `wireFadeOut`.

### `quick-dissolve`
- **Look:** the build set (dark void + blueprint) cross-dissolves to the finished hero shot (sunset sea) in ≈3 frames (11.85–11.97 s), with the ship roughly in the same screen position (match-dissolve).
- **Recipe:** `opacity = interpolate(frame, [s, s+3], [0,1])` on the incoming layer.
- **Props:** `frames` (3), `matchTransform`.

### `cannon-flash-smoke`
- **Look:** muzzle flash at a gunport: bright orange-white starburst/bloom (≈6 % of panel width) for 2 frames, light spill on water reflection; followed by a soft grey-white smoke puff that grows (scale 0.3 → 1.6 over 1.5 s, `easeOutQuad`) and fades (opacity 0.9 → 0.3), drifting slightly forward; repeated 2× ≈0.25 s apart.
- **Recipe:** flash = radial gradient circle `#fff3c0 → #ff9a3c → transparent`, opacity keyframes [0,1,1,0] over 3 frames; smoke = union of 5–7 blurred circles with seeded offsets, each scale `0.3 + 1.3·easeOut(u)`.
- **Props:** `origin`, `shots[] {t}`, `flashColor`, `smokeColor`, `smokeDuration`.

### `staggered-title-fade`
- **Look:** three-line title card (big tracked serif kanji, blackletter English, small tagline) fades in line by line: each line opacity 0 → 1 over ≈0.4 s (`easeOutQuad`), stagger ≈0.15–0.3 s, no movement (or ≤4 px rise). Positioned top-left (≈5 % inset) or bottom-left depending on composition.
- **Recipe:** `lines.map((l,i)=> opacity = interpolate(frame, [s+i·stag, s+i·stag+0.4fps],[0,1]))`.
- **Props:** `lines[] {text, font, size, tracking}`, `stagger`, `fadeDuration`, `anchor`, `color`.

### `fade-to-black`
- **Look:** panel content fades to pure black over 0.5 s (19.5–20.0 s), approximately linear (100 % → 51 % at midpoint → 0).
- **Recipe:** black overlay opacity `interpolate(frame,[s, s+12],[0,1])`.
- **Props:** `duration`.

### `logo-feather-wipe`
- **Look:** signature logo is revealed left→right by a soft-edged mask (feather ≈15 % of logo width) over ≈0.55 s while overall opacity rises 0 → 1 (20.6–21.15 s); holds ≈1.9 s; fades out over 0.5 s.
- **Recipe:** `<mask>` with a linearGradient whose stops move: `x0 = interpolate(u,[0,1],[−0.15,1])`, stops at `x0` (white) and `x0+0.15` (black); apply to logo group; `opacity = interpolate(u,[0,0.6],[0,1])`.
- **Props:** `text|svgLogo`, `revealDuration`, `feather`, `holdDuration`, `fadeOut`, `color`.

### `sea-reflection-bob`
- **Look:** ship on calm reflective water at sunset: gentle bob (±0.5 % panel H, period ≈3 s) and roll (±1°), reflection = vertically flipped ship broken into wavy horizontal bands that ripple (band displacement ±4–8 px, travelling down), lanterns glow.
- **Recipe:** hero image/SVG + flipped copy clipped below horizon, strip-wobble (as in video1 `water-landing-reflection`) using `sin(y·k − t·ω)`; bob via `sin(2πt/3)`.
- **Props:** `horizonY`, `bobAmp`, `rollDeg`, `rippleAmp`, `period`.

## Transitions

- Chrome: none (static).
- Panel content: fade-in from black at start (0–1.5 s, combined with scroll unroll and lighting), continuous camera moves through the build (no cuts), 3-frame `quick-dissolve` into the hero shot (11.85 s), `fade-to-black` (19.5–20.0), logo feather-wipe in (20.6–21.15), fade out (23.0–23.5).
- Both panels transition simultaneously — essential for the comparison read.

## Camera

- Single continuous virtual camera per panel during the build (0–11.85 s): unroll tilt, orbit/push over the plan (≈15° rotation, ×1.2 dolly), low dolly along the hull aft→fore while tilting up to the masts (5–9 s), pull-back to a stern 3/4 view (10.25–11.8 s) — all ease-in-out, no cuts.
- Hero shot (12–19.5 s): slow push-in (≈5 %) with ship bob; the two renderers use slightly different camera angles/lighting (Blender = golden-hour, Three.js = pinker dusk with island left).
- Depth: real 3D (not layered parallax). For a 2D rebuild use CSS 3D transforms on SVG planes or `@remotion/three`.

## Library candidates

- `split-screen-compare` — A vs B comparisons (tools, before/after, old/new) with synchronized panels and colour-coded labels.
- `scroll-unroll-reveal` — open a document/map/plan to start a story.
- `plane-camera-orbit` — dramatic 2.5D moves over flat artwork, maps, dashboards.
- `wireframe-extrude-build` — "from blueprint to product" builds, architecture, engineering reveals.
- `ember-spark-particles` — magic/creation/energy ambience around a build.
- `emissive-materialize` — hot-to-final material fill for constructing objects or UI panels.
- `quick-dissolve` — near-invisible match dissolve between "construction" and "final" states.
- `cannon-flash-smoke` — explosions, launches, impact beats.
- `staggered-title-fade` — elegant multi-line title cards inside a scene.
- `fade-to-black` — clean section/ending fades.
- `logo-feather-wipe` — creator signature / brand sting reveal.
- `sea-reflection-bob` — floating objects on reflective water.
