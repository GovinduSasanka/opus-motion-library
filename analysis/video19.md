# video19 — "AI in Public: Knowledge was always the technology" (blueprint line-art brand film)

## Overview

| Property | Value |
|---|---|
| Resolution | 1920 × 1080 |
| FPS | 60 (1200 frames) |
| Duration | 20.05 s |
| Audio | none in file (cuts and zooms land on a ~0.5 s grid, ≈120 BPM) |

**Story.** A brief history of knowledge as technology. An ancient scribe carves glyphs ("KOK…") into tablets. Scholars in a circular, Library-of-Alexandria-style hall connect scrolls on a machine of cubbies. The hall becomes a top-down radar and then a tunnel of "MEMORY" capsules, and the film steps through RETRIEVE → CONNECT → REASON → "CLEAR.". A huge radial library plan with ASK / BUILD / INSPECT / TEACH vignettes follows, then a gear dial counting the eras (300 BC → 1450 → 1650 → 1946 → 2007 → TODAY) and a radar chart of MODELS / AGENTS / CONTEXT / TOOLS / EVALS. It resolves into the logotype "AI in Public": "KNOWLEDGE WAS ALWAYS THE TECHNOLOGY." / "KNOWLEDGE. IN PUBLIC." / aiinpublic.com.

**Art style.** Monochrome blueprint / technical line art: thin white strokes on near-black, diagonal hatching for solids, wireframe architecture in perspective. One electric-blue accent carries the narrative: a glowing blue dot (cursor/focus) and blue path lines that travel through every scene, ending as the tittle of the "i" in the logotype. A few muted amber gear icons appear. Heavy use of continuous zoom-through camera moves ("powers of ten") instead of cuts.

**Palette (sampled):**

| Role | Hex |
|---|---|
| Background | `#090A0F` |
| Scanline/texture lines | `#15161B` |
| Primary line / text white | `#DADDE5` (strokes at 100 %, 60 %, 25 % → `#DADDE5`, `#8A8C93`, `#303136`) |
| Mid steel line | `#485E7F` |
| Accent blue line | `#4777D2` / `#5474B4` (median) |
| Accent blue glow dot core | `#5086FE` → `#75AAF7` (hot centre) |
| Deep blue line on dark | `#2F5594` |
| Muted amber gear glyph | ~`#9C7A45` at 60 % (sparingly) |

**Fonts:**
- Headline words (MEMORY, RETRIEVE, CONNECT, REASON, CLEAR., "AI in Public"): **JetBrains Mono** ExtraBold / Bold. "MEMORY" is ~140 px cap height (13 % H); "CLEAR." ~100 px; labels like CONNECT 48 px. Colour `#DADDE5` with a subtle 2-px offset dark shadow / emboss.
- Small labels (BUILD, INSPECT, ASK, TEACH, MODELS, TODAY, "KNOWLEDGE WAS ALWAYS"): **IBM Plex Mono** Medium caps, tracking +0.3 em, 16–22 px.
- Glyph alphabet: a custom monoline geometric script built from simple primitives: K, O, Δ (triangle), Θ (circle with bar), Ξ (three bars), a "Z"-like hook, and a slashed circle. Stroke 3 px, round caps. Build it as SVG paths on a 1:1.2 cell.
- Logotype "AI in Public" is ~52 % W wide (x 461–1453), centred, with the blue dot replacing the tittle of "i". URL "aiinpublic.com" in Plex Mono 18 px, tracking +0.2 em, grey `#8A8C93`.

**Layout.** Everything is radially organised around the frame centre (960, 540). Rings, spokes and dials are all concentric to it. Text either sits centred or at quadrant anchors (CONNECT top-left at (100, 595)/(1540, 325), REASON right). The margin is ~6 % W.

## Timeline

| Start–End (s) | On screen | What moves | Transition out |
|---|---|---|---|
| 0.00–0.50 | Extreme close-up: a stylus/chisel (hatched cylinder) engraves a thick double-line glyph stroke. Outlined quadrilateral chips fly off; the background is fine horizontal scanline dashes; tall white vertical bars at right | Stylus moves down-right along the stroke; chips spray; slight drift | Snap zoom-out |
| 0.50–1.20 | Zoom-out reveals the carved word "OKΛ…" then "ΞKOK" | Camera scale 1 → 0.51 in 0.4 s (ease-out), then pan left as more glyphs are carved | `bar-slide-wipe` (white vertical bar sweeps) ~1.30–1.42 |
| 1.25–1.50 | Wireframe library interior: large tablet with 7 rows of glyph script; hatched scholar silhouette at right | Slight push | Camera tilts/pulls back |
| 1.50–4.00 | Perspective → top-down view of a circular domed amphitheatre (rings of desks, central oculus); hatched wireframe | 1.5–2.3: tilt-up crane into a top-down plan; 2.3–2.7: zoom-out ×0.64 (ease-out); 2.7–3.9: slow rotation/pan (~90 px/s) | Snap zoom-in (×1.32 in 0.2 s) cut at 4.05 |
| 4.05–5.60 | Scholar at a desk/machine: cabinet of scroll cubbies (circles in grid cells), network strings connecting documents; glyph string "KΔΘOOKΔΘΔKKΔΔΔ" on the desk front, blue cursor dot under one letter; constellation wheel at right | Network lines pulse; 4.7–5.6 scrolls burst out of the cubbies and fly toward camera (3D scale-up, rotation) | Push-in |
| 5.60–6.90 | Camera cranes up and orbits: the desk becomes one station in a huge 3D ring hall (rings of desks with hatched people, screens with diagrams, amber gear medallions). A blue arc line travels along a ring | 5.5–5.9 push-in (ease-in-out, ×1.07); 6.3–6.8 fast lateral pan (~5000 px/s peak) plus zoom-in ×1.5 (orbit feel) | Morph to top-down radar |
| 6.90–7.50 | Top-down blue radar target: concentric blue circles, 8 blue spokes, hatched centre disc | Rings settle; centre disc starts filling with tunnel lines | `zoom-through-tunnel` |
| 7.50–8.20 | Zoom through the centre into a tunnel of outlined capsule shapes in concentric perspective rings | Exponential zoom-in (per 0.1 s scale ×1.24, ×1.52, … ×1.39); "MEMORY" pops in big at centre 8.0–8.2 (scale 0.6 → 1.15 → 1, flashing) | Text zooms past camera |
| 8.20–9.00 | Tunnel recedes to the centre, smaller; three blue capsules orbit at the bottom; "RETRIEVE" arcs over the top of the circle | Arc text types in letter by letter along a circular path (8.55–8.75); tunnel spins | Tunnel collapses into a ring with 3 capsules |
| 9.00–10.30 | Octagonal frame plus inscribed triangle and circles. The 3 capsules unfold into 3 floating cards (map with markers, number table with boxed 17/42/08, UI card with icons ⊖ △ ○ ☰) | Cards fly in from the capsule positions, rotate ±8°, fan (9.25–9.45). Blue lines connect icons across cards; glowing blue dot travels. "CONNECT" label types top-left (9.7), then the cards collapse into a single card (10.0). "REASON" label at right (10.2); centre icon highlighted | Card fades; slider remains |
| 10.30–11.05 | "CLEAR." big centred plus a 3-node slider (o—●—o, blue middle node) | Text appears at 10.4 (scale 1.05 → 1, opacity), holds | Zoom-out: CLEAR. shrinks into a round badge |
| 11.05–11.75 | Massive pull-back: CLEAR. badge → radar → radial library plan (rings of hatched shelf blocks, blue paths entering from 3 sides) | Zoom-out ≈ 37× in 0.6 s (per 0.1 s: ×0.94, 0.41, 0.43, 0.48, 0.57, 0.69, 0.86), heavy ease-out | Holds |
| 11.75–13.35 | Radial plan centre; 4 circular vignette medallions pop in at the quadrants: ASK (bottom-left 11.9), INSPECT (top-right 12.2), BUILD (top-left 12.4), TEACH (bottom-right 12.6), each with a leader line to a dot on the plan | `medallion-pop` per vignette; the plan rotates slowly (~3°/s) | 13.25 medallions vanish (scale → 0) |
| 13.35–14.40 | Snap zoom-out into a gear-ringed dial (saw-tooth outer ring, glyph markers, ticks); the plan is visible inside the dial window; date plate below. Grey hatched gears rotate in the background | `era-dial-counter`: 300 BC → 1450 (press) → 1650 (book/library) → 1946 (ENIAC panel) → 2007 (monitor); each step rolls the date and rotates the dial | Dial dissolves to radar |
| 14.40–15.40 | Polar chart "TODAY": concentric rings plus 12 spokes in thin blue-grey | `radar-spoke-draw`: a blue spoke shoots to the top → label MODELS; then pairs → AGENTS, CONTEXT; then EVALS, TOOLS (≈0.15 s each) | Grid collapses inward |
| 15.40–16.40 | Rings shrink into one circle; glyphs and scroll icons orbit at radius ~150 px | `glyph-orbit-assemble`: glyphs fly in from off-screen to orbit (15.6–15.9), the circle stroke draws on, then the circle unwinds while "AI in Public" types left→right, glyph fragments scrambling into letters (15.9–16.5) | Text slides up to the top line |
| 16.40–17.30 | Text box: "AI in Public" / "KNOWLEDGE WAS ALWAYS" (small, tracked) / "THE TECHNOLOGY." inside a thin rectangular frame with corner dots | Frame draws on (0.15 s); lines type in (0.2 s each) | Pull-back |
| 17.30–18.60 | Pull-back reveals a radial network: rings, 8 blue spokes with nodes, groups of people icons on spokes, circular badge emblems; label box "KNOWLEDGE. IN PUBLIC." at the bottom types in (18.2–18.4) | Zoom-out ×0.51 over 0.5 s (ease-out) then a slight drift | Zoom-in ×2 in 0.25 s and cut at 18.68 |
| 18.68–19.90 | End card: "AI in Public" logotype centred, "aiinpublic.com" fades in (18.9–19.1) | `dot-ping`: a blue ring (r ≈ 80 px) contracts onto the blue tittle dot (19.2–19.35); dot glows | Hard cut to black at 19.92 |

## Motion techniques

### `engrave-stroke-draw`
**Looks like:** a hatched stylus tip moves along a letter stroke. Behind it the stroke appears as a thick white double-line (two parallel 18 px white bars with an 18 px dark gap, i.e. an outlined stroke) with a rounded cap at the tip. Tiny outlined chips (irregular quads 10–60 px, 1.5 px white stroke) spray from the tip and tumble away; little dust dots (3–6 px grey) puff.

**Parameters:** stroke progress ~600 px/s; chips spawn 20/s with velocity 200–600 px/s perpendicular-ish to the stroke, spin 90–360°/s, fade over 0.8 s. The stylus is a long cylinder at ~40° with 6 parallel hatch lines along its body.

**Recipe:** the glyph path drives `strokeDashoffset` on two offset strokes (or one stroke of width 54 with an inner dark stroke of width 18). The stylus is positioned at `path.getPointAtLength(L·p)` and rotated to the tangent. Chips use seeded ballistic particles (no gravity, linear drag 0.9/s).

**Props:** `glyphPath`, `duration`, `chipCount`, `strokeWidth`.

### `scanline-texture-bg`
**Looks like:** the background is filled with fine horizontal dashes (1 px tall, 20–200 px long, `#15161B`–`#22232a`, rows every 6 px, random x offsets), like an engraved plate or CRT. Rows drift horizontally slowly with parallax while the camera pans.

**Recipe:** a seeded set of `<line>`s per row, or a pre-rendered pattern tile 1920 × 120 repeated, with `translateX` offset = camera pan × 0.3.

### `snap-zoom-reveal` (camera)
**Looks like:** after a close-up detail, the camera jumps back fast with a strong ease-out to reveal context (and the reverse snap zoom-in before cuts).

**Measured:**
- 0.5–0.9 s: scale per 0.1 s ×0.66, ×0.84, ×0.95, ×0.99, total ≈ 0.51× in 0.4 s.
- 2.3–2.7 s: ×0.83, ×0.90, ×0.95, ×0.98, total 0.69×.
- 17.6–18.0 s: ×0.76, ×0.78, ×0.90, ×0.96, total 0.51×.
- Snap-in at 3.9–4.1 s: ×1.03, ×1.20, ×1.10 then cut.

**Recipe:** `scale = interpolate(f, [0, N], [1, target], {easing: Easing.out(Easing.expo)})` with N ≈ 24 frames at 60 fps. Apply to a single "world" `<g>` with the transform origin at the focus point. Add 4–6 px directional blur (zoom blur) during the first 30 % of the move.

**Props:** `from`, `to`, `focus {x,y}`, `durationFrames`, `easing`.

### `powers-of-ten-pullback`
**Looks like:** a continuous pull-back across multiple nested drawings. The text becomes a badge, the badge sits inside a radar, the radar sits inside a library plan. Each level is a separate vector drawing scaled so the inner one sits exactly in the outer one's centre.

**Measured (11.05–11.75 s):** ≈ 37× total, per 0.1 s ×0.94, 0.41, 0.43, 0.48, 0.57, 0.69, 0.86 (exponential ease-out).

**Recipe:** model the world as nested layers `L_k` with scale ratio `r_k` (e.g. 8× each). Camera log-scale `s(t) = s0 · (s1/s0)^{easeOutExpo(p)}`; render layer k at `scale = s(t) · Π r_j`, culling when the on-screen size is < 2 px or > 8000 px. Crossfade a layer's fine detail in as it grows past ~300 px on screen (LOD).

**Props:** `layers[]`, `ratio`, `duration`, `direction (in|out)`.

### `zoom-through-tunnel`
**Looks like:** zooming into the centre of a radar target, which opens into a tunnel. Rings of outlined capsule shapes (stadium shapes, 1.5 px white strokes, varying 20–120 px long) arranged on concentric circles in perspective, rushing outward past the camera and rotating. A big word ("MEMORY") flashes in the middle.

**Measured:** 7.3 zoom-out ×0.91 (anticipation), then 7.5–8.2 accelerating zoom-in (per 0.1 s ×1.24, ×1.52, …, ×1.26, ×1.31, ×1.39). The word pops 8.0–8.2 at scale 0.6 → 1.15 → 1.0 and also flickers opacity 1/0.6/1 over 3 frames.

**Recipe:** a 3D-ish tunnel without WebGL. For ring i with depth `z_i = z0 + i·Δz − speed·t` (wrapping), screen radius `R_i = f / z_i`. Place M capsules around each ring at angle `θ_j + spin·t`, capsule length ∝ 1/z, oriented tangentially (or radially for streaks), opacity ∝ smoothstep of z. 12 rings × 24 capsules works. Also draw 8 radial blue spokes (`#4777D2`, 2 px) and 10 thin concentric guide circles.

**Props:** `rings`, `perRing`, `speed`, `spin`, `word`, `shape`.

### `arc-text-type`
**Looks like:** a word ("RETRIEVE") laid out on a circular arc above the tunnel circle, letters appearing one by one left→right (typewriter on a path), each letter popping from 0 → 1 opacity with a 4 px upward settle.

**Parameters:** arc radius ≈ 260 px, span ~70°, ~25 ms per letter, font JetBrains Mono Bold 44 px, tracking +0.12 em.

**Recipe:** SVG `<textPath href="#arc">` with per-letter `<tspan>` opacity; or compute each glyph position on the arc and rotate it to the tangent.

**Props:** `text`, `radius`, `startAngle`, `sweep`, `charDelay`.

### `card-fan-connect`
**Looks like:** three blue-edged glass "cards" (map/chart, number table with boxed values 17 · 42 · 08, UI panel with icon row) emerge from three pill shapes. They fly to positions around the centre, rotated −8°, +6°, −2°, overlapping. Thin lines then connect matching icons across cards (draw-on), and a glowing blue dot (radius 6 px core, 40 px soft glow) hops along the connections. Finally all cards collapse onto the bottom card, which shrinks to an icon bar with the centre icon highlighted.

**Parameters:**
- Card size ~450 × 290 px with a 1.5 px white border at 80 % and 4 px blue (`#4777D2`) left/right rails.
- Fly-in: 0.2 s, `easeOutBack(1.2)`, stagger 0.05 s.
- Connection lines: 1.5 px, 0.15 s each.
- Collapse: 0.2 s `easeInOutCubic`.

**Props:** `cards[]`, `connections[]`, `labels[] ("CONNECT", "REASON")`.

### `quadrant-label-type`
**Looks like:** big step words ("CONNECT", "REASON") appear at alternating quadrants (top-left, then right) as the topic changes, typed quickly (~40 ch/s) without a cursor and held ~0.5 s. Then the next word replaces it on the opposite side.

**Props:** `words[]`, `positions[]`.

### `hero-word-punch`
**Looks like:** a single big word ("CLEAR.", "MEMORY") cuts in at full size with a one-frame overshoot (scale 1.06 → 1.0 over 4 frames) and a faint dark drop shadow (2 px offset), plus a minimal 3-node slider/indicator underneath (two hollow circles and a filled blue centre node joined by 1 px lines, 100 px wide).

**Props:** `word`, `indicator`, `holdDuration`.

### `medallion-pop`
**Looks like:** circular vignettes (≈330 px diameter, 2 px white circle with a 6 px hatched outer rim) containing line-art scenes (people at a whiteboard, a monolith being built, a person reading a screen, a teacher with students). Each pops in from a dot: scale 0 → 1.08 → 1 over 0.2 s with `easeOutBack`. A leader line (1 px, 50 % white) draws from the medallion edge to a small hollow-circle anchor on the central plan. A caption in tracked mono caps sits under it (BUILD, INSPECT, ASK, TEACH).

**Timing:** first medallion at 11.9, then +0.3 s, +0.2 s, +0.2 s. A tiny 60 px "preview" circle appears first at the target spot, then expands. Exit: scale → 0 over 0.1 s, all at once.

**Props:** `items[{position, art, label, anchor}]`, `stagger`.

### `radial-plan-blueprint` (procedural)
**Looks like:** a top-down circular library: 6–7 concentric annular rings subdivided into sectors (12 spokes). Each sector is filled with small hatched rectangles (shelves/desks) in rows, a crosshair through the centre, and a bright blue inner hub (3 concentric blue rings, 8 spokes, ticks). Three thick blue paths (6 px, glow) enter from outside to the hub at irregular angles, with ticks along them. Small dots and anchor circles are scattered.

**Recipe:** for each ring k (r_in, r_out) and sector s: place rectangles along arcs with `n = floor(arcLength / 26)` per row, 2–3 rows, each rotated to the tangent, 1 px stroke at 35 % white, every third one hatched (pattern of 45° lines). Blue hub: rings at r = 60/100/150 with stroke `#4777D2` 3 px plus an `feGaussianBlur` glow copy at 40 % opacity. Paths: polylines with 2–3 bends. Everything is seeded, so it is deterministic.

**Props:** `rings`, `sectors`, `seed`, `accentPaths`, `hubColor`.

### `era-dial-counter`
**Looks like:** a large circular dial (r ≈ 450 px) with a saw-tooth gear rim (120 teeth, 18 px tall, thin white), an inner tick ring, glyph markers (K, Δ, Ξ, Θ …) around the band, and a small orbiting knob. The central circular window (r ≈ 250) shows an era illustration. A date plate (rounded rectangle, mono digits) sits below. Each step:
- the dial rotates by about −30° (`easeInOutCubic`, 0.25 s);
- the date rolls vertically (old value slides up and fades, new value slides in from below, 0.15 s);
- the centre illustration crossfades/morphs: plan → printing press → open book with shelves → punch-card computer → desktop monitor.

Background: 5–6 large grey hatched gears (fill `#2a2b30` with radial spokes and teeth) partially off-frame, rotating slowly at ±6°/s in alternating directions, meshing.

**Timing:** steps at 13.6 (300 BC → 1450), 13.85 (1650), 14.1 (1946), 14.3 (2007), about 0.25 s apart (fast montage). Initial entry: snap zoom-out from the plan (×0.55 in 0.1 s) so the plan becomes the window content.

**Recipe:** gear path from a polar function `r(θ) = R + (tooth ? h : 0)` sampled with sawtooth; rotation via transform. Roll digits via a `masked-title-swap`-style odometer.

**Props:** `eras[{label, art}]`, `stepDuration`, `gearCount`.

### `radar-spoke-draw`
**Looks like:** a polar grid (4 concentric circles, 12 spokes, 1 px `#485E7F` at 50 %) with a glowing centre dot. A blue line (`#4777D2`, 3 px) shoots out from the centre to the rim in 0.1 s (`easeOutExpo`), its tip then detaches as a label appears at the end (MODELS top; AGENTS upper-right; CONTEXT lower-right; EVALS left; TOOLS lower-left). The line retracts, so only the label remains. Pairs of spokes fire simultaneously. Labels are small tracked mono caps in blue `#5474B4`. "TODAY" sits below the centre.

**Timing:** 14.6 MODELS, 14.75 AGENTS+CONTEXT, 14.95 EVALS+TOOLS. Each spoke takes 0.1 s out, 0.05 s hold, 0.1 s retract (`strokeDasharray` on a line).

**Props:** `axes[{angle,label}]`, `groups`, `stagger`.

### `glyph-orbit-assemble`
**Looks like:**
- The radar grid collapses (rings shrink to the centre, spokes shorten to ticks, 0.2 s).
- A white circle (r ≈ 150, 2 px) draws on.
- ~16 glyphs and small scroll icons fly in from off-screen (from radius 900 → 230, `easeOutCubic`, 0.3 s, staggered 10 ms) and orbit the ring slowly (8°/s).
- Then the circle stroke erases clockwise from 9 o'clock while the logotype types in letter by letter from the left at the ring's left edge ("AI" → "AI in" → "AI in Public").
- Each new letter first appears as a jumble of glyph fragments (2–3 frames of scrambled line pieces), then resolves to the letter. Orbiting glyphs near the typing point get sucked into it (fade and scale 0).
- The blue centre dot moves to become the tittle of "i".

**Timing:** collapse 15.4–15.6, orbit-in 15.6–15.9, typing 15.9–16.5 (~7 ch over 0.6 s), text slides from the vertical centre to y≈110 (16.4–16.6 for the box layout).

**Recipe:** a per-letter scramble picks random glyph-fragment paths for 3 frames before showing the real glyph; the erase uses `strokeDashoffset` on the circle.

**Props:** `text`, `glyphSet`, `orbitRadius`, `charDuration`, `dotTarget`.

### `framed-tagline-build`
**Looks like:** a thin rectangular frame (1 px `#DADDE5` at 30 %, small corner dots) draws around the logotype (top line → sides → bottom, 0.15 s). Then "KNOWLEDGE WAS ALWAYS" (small mono caps, tracking 0.35 em, grey) types under it, then "THE TECHNOLOGY." (bold mono, white) types below, ~35 ch/s each. Later a second label box "KNOWLEDGE. IN PUBLIC." (bordered pill, double border) types at the bottom centre.

**Props:** `logo`, `lines[]`, `boxStyle`.

### `radial-network-reveal`
**Looks like:** pulling back from the tagline box reveals it sitting at the centre of a radial network. 5 thin concentric rings, 8 blue spokes (2 px) dotted with nodes (6 px filled blue circles, some brighter), small groups of standing-people line icons on the spokes and around the inner ring (as if facing the centre), circular "badge" emblems (concentric dotted circles r≈60 px) floating at 4 positions, and sparse tiny squares scattered. Spoke nodes slide outward slowly (data flowing).

**Recipe:** procedural; nodes at `r = r0 + (speed·t + i·gap) % L` along each spoke.

**Props:** `spokes`, `rings`, `iconSet`, `badgeCount`, `flowSpeed`.

### `blue-dot-motif` / `dot-ping`
**Looks like:** a single glowing blue dot (core `#75AAF7`, 6 px; halo `#3477FC` radial gradient to 0 at 30 px) appears in nearly every scene. It is the cursor under a glyph, the hub of the plan, the centre of the radar and finally the tittle of "i". On the end card it receives a "ping": a thin blue-grey circle (r 80 px) contracts onto the dot in 0.15 s, `easeInCubic`, opacity 0.6 → 0, then the dot glows +30 % for 0.2 s.

**Props:** `position`, `color`, `pingRadius`.

### `bar-slide-wipe`
**Looks like:** a tall white/grey vertical bar (~70 px wide, `#C0C3CA`) sweeps across a black frame as the scene changes from carving to tablet. Two frames show just the bar on black.

**Measured:** ~1.38–1.45 s; the bar moves ~600 px in 2 frames.

### `flying-scrolls-burst`
**Looks like:** scroll cylinders (hatched outlined tubes with end ellipses) and loose sheets erupt from the cabinet. They tumble toward the camera, growing in scale (z approach) and rotating, while network strings between documents vibrate.

**Parameters:** ~25 objects; z from 1 → 0.2 over 0.8 s (`scale = 1/z`); random spin 60–200°/s; start positions inside the cabinet grid.

**Props:** `count`, `objectArt[]`, `duration`.

## Transitions

| Time (s) | Type | Duration |
|---|---|---|
| 0.5 | Snap zoom-out (camera) | 0.4 s |
| 1.38 | `bar-slide-wipe` + cut | 2–3 frames |
| 1.5–2.3 | Camera tilt into top-down (continuous) | 0.8 s |
| 4.05 | Snap zoom-in + hard cut | 0.2 s |
| 5.6–6.9 | Push-in, crane, orbit pan (continuous; the cut is hidden in a 6.3 s whip pan) | 1.3 s |
| 6.9 | Morph: perspective hall → flat radar (rings align) | 0.3 s |
| 7.5–8.2 | `zoom-through-tunnel` | 0.7 s |
| 9.0 | Tunnel collapses into octagon frame (shape morph) | 0.2 s |
| 10.3 | Cards dissolve, word cut | — |
| 11.05–11.75 | `powers-of-ten-pullback` | 0.7 s |
| 13.35 | Snap zoom-out into dial window (match-cut on the plan) | 0.1 s |
| 14.4 | Dial crossfade to radar | 0.2 s |
| 15.4 | Radar collapse → glyph ring (morph) | 0.2 s |
| 17.4–18.0 | Pull-back zoom-out | 0.5 s |
| 18.5–18.68 | Zoom-in ×2 + cut to end card | 0.2 s |
| 19.92 | Cut to black | — |

The dominant language is match-cuts on concentric circles: almost every scene's centre circle becomes the next scene's centre circle, hidden by a fast zoom.

## Camera

- One virtual 2D camera with scale + translate (+ occasional fake-3D tilt via perspective drawings swapped mid-move).
- Typical zoom speeds: snap moves cover 0.5–2× in 0.2–0.4 s with `easeOutExpo`; the big pull-back covers ~37× in 0.7 s; tunnel zoom-in accelerates to ~×1.5 per 0.1 s.
- Slow drifts between snaps: pan ~90 px/s (2.7–3.9 s) and plan rotation ~3°/s.
- Depth layers: 3 typical. (1) Scanline/texture bg at 0.3× parallax. (2) Main line drawing. (3) Foreground text/labels, screen-locked. Background gears in the dial scene rotate independently.

## Library candidates

- `engrave-stroke-draw`: carved/handwritten letter reveal with chips and a tool following the stroke.
- `scanline-texture-bg`: subtle engraved/CRT line texture for dark technical backgrounds.
- `snap-zoom-reveal`: fast ease-out camera pull-back from a detail to context.
- `powers-of-ten-pullback`: nested-scale zoom through multiple diagrams in one continuous move.
- `zoom-through-tunnel`: hyperspace-like tunnel of shapes for "entering the system" beats.
- `arc-text-type`: curved typewriter text around a circle or emblem.
- `card-fan-connect`: UI cards that fan out, then get connected by lines (data linking story).
- `quadrant-label-type`: step labels typed at alternating screen positions for process sequences.
- `hero-word-punch`: single-word statement cards with a minimal indicator.
- `medallion-pop`: circular vignette callouts linked to a central diagram.
- `radial-plan-blueprint`: procedural circular blueprint/map as a hero background.
- `era-dial-counter`: timeline dial for history/year progressions with rolling dates.
- `radar-spoke-draw`: polar chart axes that shoot out and drop category labels.
- `glyph-orbit-assemble`: logo reveal where orbiting symbols resolve into typed text.
- `framed-tagline-build`: logotype plus tagline lockup built inside a drawn frame.
- `radial-network-reveal`: community/network diagram revealed by pull-back.
- `blue-dot-motif`: persistent focus dot that threads scenes together and ends in the logo.
- `bar-slide-wipe`: quick vertical bar sweep for hard-cut punctuation.
- `flying-scrolls-burst`: objects bursting toward camera from a container (documents, files, icons).
