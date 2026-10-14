# video9 — "Every house starts as a plan." (LINTEL / Casa Serra scroll-driven architectural walkthrough)

## Overview

| Property | Value |
|---|---|
| Resolution | 3840 x 2160 (4K UHD). All pixel numbers below are given at a **1920x1080 reference**; double them for 4K. |
| FPS | 30 (1724 frames) |
| Duration | 57.5 s (an AAC audio track is present) |
| Story | A screen recording of a scroll-driven 3D architecture website (studio "LINTEL", project "Casa Serra, Sintra"). It opens on a hand-drafted ground-floor plan with a big stencil headline. Scrolling tilts the plan up into a line-drawn 3D model. The visitor then "walks" through 7 rooms (Entrance, Living Room, Kitchen & Dining, Olive Patio, Glass Gallery, Master Suite, Private Garden). Each room arrives as a pencil/ink line drawing, then "renders" into photoreal 3D, and a HUD callout labels it. The camera then cranes up to an aerial view of the whole site, and a rolled sheet of paper unrolls across it to turn it back into the plan. |
| Art style | Two coexisting styles. **(1) Architectural line-art:** black ink 1–3 px strokes on warm off-white paper with mottled cloud texture; poché walls filled solid charcoal; mono drafting labels; dashed grid lines. **(2) Photoreal real-time render:** board-formed concrete, oak, travertine, olive trees, warm late-afternoon sun, soft GI. Orange `#e24d0f` construction-line accents link the two. Everything sits inside a **browser-window mockup** (rounded rectangle with a drop shadow) on a soft blue-grey studio backdrop, with a static macOS arrow cursor. |
| Fonts | Display: heavy **stencil grotesk**, ALL CAPS (e.g. *Big Shoulders Stencil Display 800*, *Saira Stencil One*, or *Stardos Stencil Bold*), tight leading. UI/labels: wide-tracked **monospace** caps (Space Mono / IBM Plex Mono / JetBrains Mono, 10–12 px, tracking 0.18–0.25em). Body: neutral grotesk (Inter / Söhne) 15 px grey. Plan annotations: mono caps (Courier Prime / Space Mono) at drafting sizes. |

### Palette (sampled)

| Role | Hex |
|---|---|
| Backdrop, top highlight / top centre / mid-left / bottom | `#e2e5e6` / `#adb2b6` / `#b9bdc2` / `#7a7f86` (vertical gradient plus a radial highlight top-left) |
| Window drop shadow on backdrop | about `#696e75` |
| Paper base (2 tones of mottling) | `#ece9e0`, `#f2efe6` |
| Ink (walls, strokes, headline) | `#201b1c` – `#2a2829` |
| Accent orange (headline "PLAN.", HUD rule indicator, construction lines) | `#e24d0f` / `#e44d12` |
| Construction-line glow on renders | `#ed984d` (orange at about 70% alpha) |
| "ROOM 0N" label | `#c39482` – `#d06a4a` (orange at about 70%) |
| CTA pill fill | `#f6f4eb` with a 1 px ink outline |
| Render palette (reference only) | concrete `#8a8a8a`, oak `#9b6a43`, travertine `#d8c7a6`, sky `#a9c4dc`, grass `#7f9a4a` |

### Layout (1080p reference)

- **Window mockup:** content rect x 89 → 1831, y 40 → 1040. Insets are 4.6% W left/right, 3.7% H top/bottom. Corner radius about 14 px. Drop shadow about `0 24px 60px rgba(20,25,35,.35)`. A thin scrollbar thumb sits at the right inner edge (x≈1826).
- **Static cursor:** a black macOS arrow at (930, 790). It never moves; it is the screen recorder's cursor.
- **Page chrome:**
  - top-left logo "LINTEL" (stencil, 18 px) at (133, 83)
  - top-right pill "START A PROJECT" (mono 11 px, tracking 0.2em, 157x36, radius 18) at (1630–1787, 65–101)
  - bottom-left nav "WORK | STUDIO | CONTACT ›" (mono 10 px) at y=1012
  - bottom-right counter "02 / 07 ROOMS" (mono 10 px) at y=1012
  - bottom-centre hint "SCROLL TO WALK IN" / "CLICK THE MARKER TO OPEN THE FILE" / "SCROLL TO THE NEXT ROOM" (mono 11 px, tracking 0.3em) at y=949. Under it is a 180x1 px rule containing a 1.5 px dark progress segment.
- **Hero (scene 1):**
  - kicker "LINTEL · CASA SERRA, SINTRA · 2026" (mono 11 px) at (133, 131)
  - headline "EVERY HOUSE / STARTS AS / A PLAN." at x=133. Cap tops at y=165 / 237 / 309, cap height about 46 px, so the font is about 64 px (6% H). "PLAN." is orange.
  - body copy (15 px, `#6b6b6b`, 3 lines, max-width 290 px) at y=407
  - title-block table bottom-left (133–369, 893–981) with mono labels: PROJECT, DRAWING, SCALE, SHEET
- **Plan drawing:** centred-right (x 640–1710, y 100–1015), with grid bubbles A–E / 1–6, dimension strings, a north arrow, "GROUND FLOOR PLAN" title block and a scale bar.
- **HUD right rail:** a vertical ruler at x≈1786 from y=200 to 880 with minor ticks. Corner-bracket glyphs `⌐` mark each of the 7 rooms (y ≈ 300, 410, 460, 545, 595, 685, 780). The current room shows a 22x2 px orange indicator and a "0N" mono label to its left.

---

## Timeline

| # | Start–End (s) | On screen | What moves | Transition out |
|---|---|---|---|---|
| 1 | 0.0–1.6 | Hero: plan plus headline, title block, CTA | Static (diff < 1) | Scroll begins |
| 2 | 1.6–3.5 | `plan-tilt-to-elevation`: the plan zooms toward the entrance. The hero copy fades out by 2.0 and "LINTEL" replaces the kicker. Walls appear as extruded line-art and the camera pitches from top-down (−90°) to eye level (0°), facing the entrance facade. | Zoom about 1→2.6x over 1.6–2.4. Pitch −90°→0° over 2.1–3.4, ease-in-out. | Lands on the elevation |
| 3 | 3.5–5.6 | Line-art front elevation of the entrance wall (timber fins, pivot door, tie-hole dot grid). HUD shows "00 / 07 ROOMS". | Slow dolly-in (scale about 1.0→1.06) | `pivot-door-open` |
| 4 | 5.6–5.93 | The pivot door swings open about 70°, revealing the sketch interior beyond | Door rotateY 0→−70°, ease-out, 10 frames | `sketch-to-render-reveal` |
| 5 | 5.93–6.33 | The facade "renders": orange edge lines flash, then rectangular surface patches pop to photoreal. "CASA SERRA" lettering appears on the concrete. The interior beyond the door stays a sketch. | 12 frames | `doorway-dolly-through` |
| 6 | 6.33–7.7 | Camera dollies through the door into the Entrance. The Entrance walls render progressively (orange construction lines on the panel joints). The pendant globes and planter pop in. | Forward dolly, diff peaks at 7.0 and 7.67 | Settle |
| 7 | 7.9–8.6 | `room-label-callout` "ROOM 01 / THE ENTRANCE / 8.00 × 9.00 M · 72 M² · CEILING 4.80 · OPEN FILE +". The rail indicator moves to 01. The hint changes to "CLICK THE MARKER…". | Callout build about 0.7 s | Hold |
| 8 | 8.6–10.7 | Hold on the Entrance. Through the opening, the Living room is visible as a sketch with "LIVING 108 m² 12.00 × 9.00" stencilled on its floor. | Micro drift | Scroll |
| 9 | 10.7–13.4 | `crane-to-plan`: dolly into the Living sketch, then crane up and pitch down to a near-orthographic top-down view of the Living/Kitchen plan | Approx. 2.7 s, ease-in-out. The callout fades out at 10.9. | Hold |
| 10 | 13.4–15.6 | Top-down line plan (Guest Suite, Living, dims 12.00 / 9.00 / 4.50) | Very slow zoom | Reverse crane |
| 11 | 15.6–17.6 | Crane down and rotate (yaw about +25°) back to eye level inside the Living sketch. The olive field outside the windows renders early. | Approx. 2 s | Reveal |
| 12 | 17.6–18.2 | `sketch-to-render-reveal` of the Living room (sunken sofa, fireplace, arc lamp). Orange construction lines sweep along the ceiling beams. | Approx. 0.5 s | — |
| 13 | 17.9–18.6 | Callout "ROOM 02 / THE LIVING ROOM / 12.00 × 9.00 M · 108 M² · CEILING 4.50 · OPEN FILE +" | 0.7 s build | Hold until 20.0 |
| 14 | 20.0–21.7 | Pan right and dolly toward the Kitchen (sketch). Floating 3D dimension figures ("3.60", "5.00", "16.00") hover in space. The kitchen renders at 20.9–21.7 (island, red stools, brass pendants). | Yaw about +30°, dolly | — |
| 15 | 22.0–22.7 | Callout "ROOM 03 / KITCHEN AND DINING" | — | Hold |
| 16 | 24.0–25.3 | Fast push through a sketch doorway (24.33) into the Olive Patio. A ground-tile render reveal with orange tile edges (24.67) arrives in about 0.3 s. | Fastest move in the video (diff about 30) | — |
| 17 | 25.3–28.6 | Orbit around the ancient olive tree on its round travertine planter: dolly in plus yaw −40° | Ease-in-out | — |
| 18 | 28.6–29.5 | Callout "ROOM 04 / THE OLIVE PATIO" | — | — |
| 19 | 30.0–31.2 | Pan left to the gallery/library glazing, then push into a sketch wall with a painting | — | **Hard cut** at 31.23 |
| 20 | 31.23–32.0 | Glass Gallery (sketch → render: plinth, black sculpture, bench) | Reveal about 0.5 s | — |
| 21 | 32.0–32.6 | Callout "ROOM 05 / THE GLASS GALLERY" | — | — |
| 22 | 33.6–37.4 | Walk down the gallery, then turn into the Master Bedroom sketch with the floor stencil "MASTER BEDROOM 10.00 × …" and floating "3.60" / "10.00" | Dolly plus yaw | — |
| 23 | 37.5–37.8 | Render reveal of the Master Suite (dark timber wall, orange headboard) | — | — |
| 24 | 38.2–39.0 | Callout "ROOM 06 / THE MASTER SUITE". **The text inverts to white** because it sits on the dark wall. | — | — |
| 25 | 40.6–44.0 | Through the dressing corridor (40.8–41.7) into the Bath sketch ("BATH 8.00 × 6.00" on the floor). Render reveal 43.3–44.0. | — | — |
| 26 | 45.8–47.0 | Out through the sliding glass into the Private Garden. Bloom and sun haze at 46.2. | — | — |
| 27 | 47.0–47.6 | Callout "ROOM 07 / THE PRIVATE GARDEN" | — | — |
| 28 | 49.0–52.3 | `aerial-spiral-pullout`: crane up, pitch to −90° and yaw about −60°, ending on an axis-aligned top-down of the whole house in landscape | Ease-in-out, 3.3 s | Hold |
| 29 | 53.1–55.6 | `paper-roll-wipe`: a rolled paper cylinder enters from the left and unrolls to the right. Behind it the aerial becomes the original ink plan, at the same scale and position (match-cut). | Variable speed (see the motion section) | — |
| 30 | 55.6–56.5 | Plan alone (no hero copy) | Static | Fade to black |
| 31 | 56.5–57.4 | Fade to black. The backdrop fades too: the whole frame goes to `#000`. | 0.9 s, ease-in | End |

---

## Motion techniques

### 1. `browser-frame-mockup`

**Look:** All content is shown as a website inside a floating rounded window, as if captured with Screen Studio. A soft studio backdrop sits behind it, and the window casts a large soft shadow.

**Elements**
- Backdrop: a vertical `linear-gradient(#adb2b6 0%, #9ea3a9 55%, #7a7f86 100%)` plus a `radial-gradient(at 0% 0%, #e2e5e6 0%, transparent 45%)` highlight.
- Window: content clipped to an inset rect at 4.6% / 3.7%, radius 1.3% H, `box-shadow: 0 2.2% 5.5% rgba(20,25,35,.35)`.
- A thin scrollbar thumb at the right inner edge, 4x40 px, `#555` at 50%. It moves down with scroll progress.
- Static cursor sprite (SVG arrow, 22x32 px at 1080p) at 48% W, 73% H.

**Animation:** none during the video. The final fade to black covers the backdrop too.

**Remotion:** `<AbsoluteFill style={{background}}><div style={{position:'absolute', inset:'3.7% 4.6%', borderRadius, overflow:'hidden', boxShadow}}>{children}</div><Cursor/></AbsoluteFill>`

**Props:** `inset`, `radius`, `backdropColors`, `showCursor`, `cursorPos`, `scrollProgress`.

---

### 2. `blueprint-paper-texture`

**Look:** Warm paper with low-frequency cloudy mottling (like a scanned trace sheet), visible behind the line drawings and on the "sketch" surfaces of the 3D rooms.

**Recipe:**
- Base `#efece3`.
- Overlay fbm noise: 3 octaves, base frequency about 0.004 (cells of about 250 px), luminance ±4%, slight warm/cool tint shift.
- A second very fine grain layer: σ 2/255, static (not re-seeded per frame, because it is paper).

In SVG: `<feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="3" seed={s}/>` → `feColorMatrix` to a ±4% luma tint → blend multiply.

**Props:** `baseColor`, `mottleScale`, `mottleStrength`, `seed`.

---

### 3. `hero-plan-intro` (static layout plus first scroll fade)

- The headline lines are stacked with leading 1.1. The last word is in the accent colour.
- On scroll start (1.6 s), the left column fades out: opacity 1→0 and translateY 0→−20 px over 0.4 s, ease-in. Elements stagger by 2 frames, top to bottom. The kicker cross-fades to the "LINTEL" logo.
- The title-block table and the "GROUND FLOOR PLAN" legend fade out with the zoom.

**Props:** `kicker`, `headline[]`, `accentWord`, `body`, `titleBlockRows`.

---

### 4. `plan-tilt-to-elevation`

**Look:** The flat 2D floor plan becomes 3D. It first scales up toward a point (the entrance). Walls rise as extruded prisms: poché fill on the cut top, line-art sides. The camera pitches from straight-down to eye level until it faces the front elevation of the entrance wall.

**Parameters (1.6–3.5 s, 57 frames)**
- Zoom: 1.0→2.6x about the entrance door (49% W, 70% H of the plan) over 1.6→2.45 s, `easeInCubic` → linear.
- Pitch: −90°→−55° by 2.53 s, −30° at 2.8 s, −10° at 3.07 s, 0° at 3.4 s. Overall `easeInOutSine` across 2.1→3.4.
- Camera height drops proportionally to stay at about 1.6 m.
- Wall extrusion is present from the start (camera-revealed). Walls are 3 m high, 0.25 m thick, with dark poché tops `#2a2829` and white line-art faces.
- Field of view about 50°.
- Furniture is simple extruded line-art blocks.

**Implementation:**
- **3D route (recommended):** in `@remotion/three`, build walls from a plan JSON (polylines plus thickness), using `ExtrudeGeometry`. Use two materials: (a) `MeshBasicMaterial` in the paper colour with a paper texture; (b) `LineSegments(EdgesGeometry)` in ink `#2a2829` at 1.5 px (use `Line2`/`LineMaterial` for width). Plan annotations are `Text` meshes or textures laid flat on the floor plane at y=0.01. Animate the camera position and rotation with Remotion `interpolate` + `Easing.inOut(Easing.sin)`.
- **2.5D route:** CSS 3D. Put the plan SVG on a plane with `transform: perspective(1200px) rotateX(θ)` from 0°→80°, and fade in pre-rendered elevation art as θ passes 60°. This is cheaper but loses the extrusion.

**Props:** `planSvg|planJson`, `focusPoint`, `zoomTo`, `pitchFrom/To`, `durationFrames`, `wallHeight`.

---

### 5. `pivot-door-open`

**Look:** A large pivot door, hinged off-centre (pivot at about 20% of the door width), swings toward the viewer by about 70° over 10 frames (0.33 s), with an ease-out `cubic-bezier(0.2,0.8,0.2,1)`. The opening reveals the next space, still in sketch style.

**Remotion:** a door mesh with `rotation.y = -interpolate(f, [s, s+10], [0, 1.22], {easing: Easing.out(Easing.cubic)})`, or in 2D CSS: `transform-origin: 20% 50%; transform: perspective(900px) rotateY(-70deg)`.

**Props:** `pivotPct`, `angle`, `durationFrames`, `direction`.

---

### 6. `sketch-to-render-reveal` (signature effect)

**Look:** A room drawn in black ink on white paper "develops" into a photoreal render in about 0.2–0.5 s. The order of events:
1. Orange construction lines `#ed984d` light up along the key edges: panel joints, floor-tile seams, beam edges, window mullions (1–3 frames).
2. Rectangular patches (individual faces, tiles and panels) switch from sketch to render in a scattered random order. For 2–4 frames the frame is a patchwork; some patches flash grey-blue or flat-coloured before the texture lands.
3. The orange lines fade out over about 0.3–0.6 s. On ceilings they linger as thin glowing seams, then fade.
4. Lighting and grade settle: a slight exposure lift over 6 frames.

Distant areas seen through openings (the next room) stay sketched. This is what creates the "portal into the drawing" look.

**Timing examples**

| Room | Lines at | Patches | Clean |
|---|---|---|---|
| Facade | 5.93 | 6.00–6.07 | 6.13, settles 6.33 |
| Living | about 17.6 | — | 18.2 |
| Kitchen | — | 20.9–21.7 (slower, edges linger on the beams) | — |

**Elements:** a sketch layer S (paper plus ink lines), a render layer R, an edge layer E (orange lines), and a reveal mask M.

**Implementation (3D):**
- Give every mesh (or every face group/tile) a random `revealAt ∈ [0,1]`, seeded.
- Shader: `mix(sketchColor, renderColor, step(revealAt, uProgress))`.
- Edges: `EdgesGeometry` lines with opacity `= bump(uProgress - revealAt)`, where `bump(x) = smoothstep(-0.15,0,x) * (1 - smoothstep(0.1,0.6,x))`. Colour `#ed984d`, additive, 1.5 px.
- `uProgress` 0→1 over 6–15 frames, `easeOutQuad`.

**Implementation (2D, from two stills):**
- Split the frame into a grid of rectangles. Better: use the actual face rectangles traced as SVG rects, or a k-d split with random rectangles 3–20% W.
- Each rect r gets `t_r = random(seed+r)*0.7`. Show R inside rect r when `progress > t_r`. Use an SVG `<clipPath>` that is the union of the revealed rects over the R image.
- Draw each rect's border in orange `#ed984d` with opacity `bump(progress - t_r)`, stroke 2 px.
- Add a global `brightness(1.0→1.05)` settle.

**Props:** `sketchSrc`, `renderSrc`, `edges[]` (optional), `durationFrames`, `tileMin/Max`, `edgeColor`, `seed`, `lingerFrames`.

---

### 7. `doorway-dolly-through` (portal walk)

**Look:** The camera stands in a rendered room facing an opening. Through it, the next room is visible as a line drawing. The camera then dollies forward through the opening (often with a slight yaw), and the sketch room surrounds the camera. A `sketch-to-render-reveal` triggers once the camera is inside, or just as it crosses the threshold.

**Parameters**
- Dolly distance about 4–6 m in 1.0–1.7 s.
- Speed profile: ease-in-out (`easeInOutCubic`). The fastest pass (24.0–24.6) uses ease-in into the reveal, then ease-out.
- Optional yaw ±20–35° during the move (20–21.7 s).
- FOV constant about 55°.
- Eye height 1.6 m. A slight 1–2 cm bob is optional; none is visible here.

**Implementation:** a camera spline through room-centre waypoints. Each room has a state `sketch|render` driven by `revealAt` (seconds). Render the rooms beyond the current one with the sketch material only.

**Props:** `waypoints[]`, `segmentDurations[]`, `yaw[]`, `revealOffsets[]`.

---

### 8. `crane-to-plan-and-back`

**Look:** From eye level inside a sketch room, the camera rises and pitches down until it looks straight down. The scene then reads as a 2D plan again, with the floor-stencilled room names and dimension strings legible. It holds there, then descends and yaws back to eye level inside the room. This shows that the 3D model and the drawing are the same thing.

**Parameters**
- Up: 10.8→13.4 s (2.6 s). Height 1.6 → about 14 m, pitch 0°→−88°, `easeInOutCubic`.
- Hold: 13.4–15.6 s, with a 1% slow zoom.
- Down: 15.6→17.6 s, pitch −88°→−8°, height → 1.7 m, yaw +25°, `easeInOutCubic`.

**Props:** `heightTop`, `pitchTop`, `upFrames`, `holdFrames`, `downFrames`, `yawOnReturn`.

---

### 9. `floor-stencil-labels` and `floating-dimensions`

**Look:** In sketch rooms, room names ("LIVING", "BATH", "MASTER BEDROOM") and area/size strings ("108 m²  12.00 × 9.00") are printed **on the floor plane** in large mono caps (letter height about 0.5 m in world space). They read in perspective. Separately, numbers like "3.60", "5.00", "16.00" (ceiling heights, spans) float in 3D near walls as billboards in light grey mono. They fade out as the room renders.

**Implementation:**
- Floor labels: a plane mesh with a text texture (or troika `Text`) laid flat at y=0.005 and rotated to the room axis. Ink colour `#2a2829`, letter-spacing 0.25em.
- Floating dims: `Billboard`ed `Text`, colour `#9a9a9a` at 70%, fading `1 → 0` over 10 frames after the reveal.

**Props:** `label`, `area`, `dims`, `fontSize`, `position`, `rotation`.

---

### 10. `room-label-callout` (HUD title card)

**Look:** An architectural annotation callout placed in open wall or sky space. It has:
- a crosshair marker: four corner brackets (16x16 px L-shapes, 1.5 px) around a ⊕ circle-plus (r=12)
- a T-shaped rule: a vertical line 150 px tall and a horizontal line 240 px long, crossing near the top
- a mono orange micro-label "ROOM 02"
- a two-line stencil title "THE / LIVING ROOM" (about 34 px, cap height 26 px)
- a mono metrics line "12.00 × 9.00 M · 108 M² · CEILING 4.50 · OPEN FILE +" (11 px, tracking 0.2em, 60% ink)

**Build sequence (measured at 17.90–18.60, 30 fps)**

| Frame | Element | Animation |
|---|---|---|
| 0 | Crosshair | Opacity 0→0.4, scale 1.15→1.0. Reaches full opacity by frame 4. Ease-out. |
| 4 | Vertical rule | Draws top→bottom, scaleY 0→1 over 6 frames |
| 6 | Horizontal rule | Draws left→right from the crossing point, scaleX 0→1 over 5 frames |
| 10 | "ROOM 02" | Opacity 0→0.75 over 4 frames |
| 10 | Title line 1 | Rises from a line mask: translateY 100%→0, ease-out `cubic-bezier(0.16,1,0.3,1)`, 6 frames |
| 13 | Title line 2 | Same as line 1 (3-frame stagger) |
| 20 | Metrics line | Opacity 0→1 over 5 frames. Optional tracking 0.3em→0.2em. |

Total about 0.75 s. Exit: everything fades out together over 6 frames when the next scroll move starts. The text colour adapts: ink `#201b1c` on light surfaces, `#f4f1ea` on dark surfaces (Master Suite).

**Remotion:** absolutely positioned SVG lines with `strokeDasharray = len`, `strokeDashoffset = len*(1-p)`. Title lines are `overflow:hidden` wrappers with an inner `translateY`.

**Props:** `index`, `title[]`, `metrics`, `x`, `y`, `theme: 'ink'|'paper'`, `startFrame`.

---

### 11. `scroll-progress-hud`

**Look:** Persistent UI:
- The right vertical ruler with minor ticks every 21 px and 7 bracket markers. The current room gets an orange 22x2 px indicator and a "0N" label. The indicator slides between rooms with an ease-in-out over about 0.4 s while the camera moves.
- Bottom-right "0N / 07 ROOMS". The digit swaps instantly on the callout start.
- Bottom-centre hint text plus progress underline. The hint text cross-fades over 6 frames when it changes ("SCROLL TO WALK IN" → "CLICK THE MARKER TO OPEN THE FILE" → "SCROLL TO THE NEXT ROOM"). The 1.5 px dark segment under the 180 px rule fills left→right with the scroll progress of the current segment.
- Bottom-left nav. It dims to 30% while moving (visible at 12.4 s) and returns to 100% when settled.

**Props:** `rooms[]`, `current`, `progress`, `hints[]`, `accent`.

---

### 12. `aerial-spiral-pullout`

**Look:** From the garden at eye level, the camera rises and swings into a top-down satellite-style view of the entire site (house, lawn, trees, lap pool). It finishes axis-aligned and centred, matching the plan's framing.

**Parameters (49.0–52.3 s, 100 frames)**
- Height 1.6 m → about 60 m.
- Pitch −10° → −90°.
- Yaw rotates about −60° (counter-clockwise on screen).
- Target moves from the fire pit to the house centroid.
- Ease: `easeInOutCubic`. Fastest at about 50.3 s.
- Final framing: the house footprint occupies 45% W, centred at 53% W / 52% H, so it matches the plan's position for the match-cut.

**Props:** `fromCam`, `toCam`, `yawDelta`, `durationFrames`, `finalFraming`.

---

### 13. `paper-roll-wipe`

**Look:** A rolled sheet of drafting paper (a vertical cylinder about 3.5% W thick, slightly tilted about 2°) slides in from the left edge. As it travels, it unrolls flat paper behind it (to its left), covering the aerial render. Under the paper, the original ink plan appears, at the same layout as the aerial (a match-cut through the wipe). The cylinder casts a soft shadow onto the uncovered render to its right.

**Motion profile (X = roll centre as % of window width)**

| Time (s) | 53.1 | 53.4 | 54.6 | 55.0 | 55.3 | 55.6 |
|---|---|---|---|---|---|---|
| X | −4% | 15% | 25% | 45% | 75% | 104% (exits right) |

- Fast entrance: ease-out, 9 frames.
- Slow creep: linear, 36 frames. This is the "user hesitates" beat.
- Accelerating sweep: ease-in-out, 30 frames.

**Elements / recipe (SVG)**
1. Bottom layer: the aerial render.
2. Top layer: the plan on paper, clipped by `<rect x=0 width={X - rollW/2}>`.
3. The roll: a rect `rollW = 3.5% W`, full height, rotated 2°. Fill it with a horizontal linear gradient that fakes a cylinder: `#d7d2c7` 0%, `#f7f5ef` 30%, `#fffefa` 45%, `#e4e0d6` 70%, `#bdb8ad` 100%. Add a 1 px ink line at 50% to suggest the roll seam, and a few small dark notches (about 6 px dashes every 90 px) along it.
4. Shadow: a `linear-gradient(to right, rgba(0,0,0,.25), transparent)` strip, 3% W wide, to the right of the roll, over the aerial.
5. A soft contact shadow under the left edge of the roll (`rgba(0,0,0,.12)`, 1% W) over the paper.

**Props:** `fromSrc`, `toSrc`, `keyframes` (X vs time), `rollWidthPct`, `tiltDeg`, `paperColors`.

---

### 14. `fade-to-black-full`

The whole composition (backdrop, window, content) dims to black over 0.9 s (56.5–57.4), ease-in `cubic-bezier(0.4,0,1,1)`. The mean luma goes 216 → 29 → 0.

---

## Transitions

| Time | Type | Details |
|---|---|---|
| 1.6–3.5 | Camera move (plan → 3D) | `plan-tilt-to-elevation` |
| 5.6–6.33 | Object animation plus style reveal | Door swing, then `sketch-to-render-reveal` |
| 6.3–7.7, 10.7–17.6, 20–21.7, 24–25.3, 33.6–37.4, 40.6–44, 45.8–47 | Continuous camera moves through openings (`doorway-dolly-through`), each ending with a sketch→render reveal | — |
| 31.23 | **Hard cut** | The only one in the video: patio/gallery facade → inside the gallery sketch, mid-move |
| 49–52.3 | Camera crane | `aerial-spiral-pullout` |
| 53.1–55.6 | Wipe plus match-cut | `paper-roll-wipe`: aerial render → ink plan with the same layout |
| 56.5–57.4 | Fade to black | — |

## Camera

- One continuous **first-person architectural camera** (except the 31.23 cut), path-driven by scroll. Eye height about 1.6 m, FOV about 50–55°, no roll.
- Moves are always **ease-in-out**. Holds of 1.5–2.5 s happen at each room for the callout.
- Notable moves:
  - top-down → eye-level tilt (1.9 s)
  - crane-up to the plan (2.6 s), hold (2.2 s), crane-down with yaw (2 s)
  - orbit around the olive tree (about 40° over 3.3 s)
  - final spiral pull-out to the aerial (3.3 s)
- Depth is true 3D. For a 2.5D rebuild, split each room into 3–4 planes (foreground jamb, room walls, back opening, exterior) and dolly with parallax factors 1.6 / 1.0 / 0.6 / 0.2.

## Library candidates

- `browser-frame-mockup` — present any web/product capture as a floating window on a studio backdrop.
- `blueprint-paper-texture` — warm mottled drafting-paper background for technical or sketch scenes.
- `hero-plan-intro` — editorial hero layout with a stencil headline, accent word and title-block table.
- `plan-tilt-to-elevation` — flat 2D diagram tilting up into a 3D extruded model.
- `pivot-door-open` — reveal the next scene through a hinged panel or door opening.
- `sketch-to-render-reveal` — line-drawing to finished-render "develop" transition with orange construction lines.
- `doorway-dolly-through` — portal walk-through from one space or scene into the next.
- `crane-to-plan-and-back` — rise to an orthographic overview and return, to show structure.
- `floor-stencil-labels` — in-world labels printed on surfaces for spatial annotation.
- `room-label-callout` — HUD crosshair, rule and stencil title block for naming locations or features.
- `scroll-progress-hud` — chapter rail, counter and hint bar showing progress through sections.
- `aerial-spiral-pullout` — finale crane to a top-down overview, aligned for a match-cut.
- `paper-roll-wipe` — physical paper-unroll wipe with a match-cut between two states.
- `fade-to-black-full` — whole-frame fade-out, including the backdrop.
