# video10 — "Can we end it differently?" (drug crises through history, vertical explainer short)

## Overview

| Property | Value |
|---|---|
| Resolution | 1080 x 1920 (9:16 vertical) |
| FPS | 30 (1260 frames) |
| Duration | 42.0 s (an AAC narration track is present; the captions are word-synced to it) |
| Story | Today's fentanyl crisis (San Francisco/Vancouver street scenes) is match-cut to identical compositions from Rome c.100 AD, London 1730s (gin), China 1800s (opium) and America 1880s (morphine). A dark navy "infographic" beat explains that "every time, three things collided": a cheaper, stronger drug; people pushed out of their homes; nothing left to catch them. It ends on Roman ruins ("people died"), an asylum ("locked away"), and a return to the opening shot with the question "Can we end it differently?" |
| Art style | Illustrated stills and short clips in a **Japanese woodblock / risograph print** look (Hasui-like ukiyo-e meets modern comic ink): heavy black linework, flat indigo / vermilion / ochre, sunset gradients, visible paper grain and print noise. Some shots have slight motion (walking pedestrians, a bus, rain), so treat them as illustrated clips. Graphic overlays are flat vector: red stamp labels, red highlight caption boxes, thin coloured frame borders, and a navy grid "blueprint" background. |
| Fonts | **Serif display** for headlines and city names: a high-contrast Garamond (Cormorant Garamond Medium / EB Garamond), sentence case, off-white with a soft shadow. **Bold grotesk** for captions and panel labels: Helvetica Neue Bold / Arial Bold / Inter Bold, white with a dark outline/shadow. **Heavy sans** for the big keyword ("GIN", "OPIUM", "MORPHINE"): Arial Black / Inter Black, vermilion with a dark stroke. **Serif caps** stacked vertically inside the red vertical location labels. |

### Palette (sampled)

| Role | Hex |
|---|---|
| Vermilion (highlight box, stamps, big keyword) | `#c14d3c` / `#cc493f` / `#cb4e3d` (darker variant `#bf483a`) |
| Stamp/label inner border (cream) | `#dfd9c0` |
| Panel border 1 (red) | `#ad3f32` |
| Panel border 2 (gold) | `#cfa44d` |
| Panel border 3 (steel blue) | `#8ca7c5` |
| Navy background (centre / edge / corner vignette) | `#2a3242` / `#283040` / `#0b1018` |
| Navy grid lines | `#2f394a` (about +4% luma), 90 px pitch |
| Serif headline / title text | `#efe8dc` (warm off-white) with shadow `rgba(0,0,0,.55)` |
| Caption text | `#ffffff` with a 3 px dark stroke `#1a1a1a` and a soft shadow |
| Illustration key colours (reference) | indigo sky `#2c4a78`, sunset `#e7826a`, cream sky `#e9d9b8`, ink `#151515`, concrete `#8c8f92`, curb red `#b5463a` |

### Layout grid (1080 x 1920)

- Side safe margin: **58 px (5.4% W)**. Panels span x 58–1028.
- City/headline serif titles: centred, at y≈315 px (16.5% H). Size about 78 px (cap height about 52 px), tracking −0.01em.
- Captions: centred line at **y≈1415 px (73.7% H)**. Font about 56 px Bold (cap height about 40 px). Word gap about 0.45em. The highlight box is the word bbox plus padding (12 px horizontal, 6 px vertical), radius 8 px. Measured box for "catch": 201x89 px.
- Big keyword ("GIN"): centred at y≈1225 (64% H), cap height about 100 px (about 140 px font), just above the caption.
- Vertical location label: right edge, x 903–1020, y 128–605 for LONDON. A vermilion box with a 2 px cream inner border inset 6 px. Stacked serif caps about 52 px with 60 px pitch. A small sans "1730S" (22 px) sits at the bottom.
- Horizontal stamp (e.g. "LONDON 1736", "PEOPLE DIED", "LOCKED AWAY"): about 52–60% W wide, at y≈18–20% H, rotated about −4° to −6°.
- Infographic panels (navy section): heading serif at y=130, 62 px. Three panels each 970 x 365 px, at y = 190, 575, 958, with a 20 px gap. Each has a bottom label strip (black gradient, 90 px) holding a coloured numeral (42 px) and a white caps label (34 px Bold, tracking 0.04em).
- Navy grid: 90 px square cells (x lines at 91, 181, 271…; y lines at …1531, 1621, 1711…), 1 px.

---

## Timeline

| # | Start–End (s) | On screen | What moves | Transition |
|---|---|---|---|---|
| 1 | 0.0–3.5 | SF street at sunset: a bent-over man (fentanyl "fold"), tents, cart, bus. Serif title "San Francisco" (0–2.0), then "Vancouver" (2.0–3.45). | The clip animates (bus pulls in, background morphs slightly). Slow push-in about 3% over 3.5 s. The title swaps with a hard out and a 5-frame fade/blur in. | **Punch-in cut** at 3.50 (same image, about 1.25x closer, re-centred on the man) |
| 2 | 3.5–6.43 | Same scene, tighter. Captions "People bent double" / "on fentanyl." | Captions: line fade-in 2–3 frames, word-by-word highlight | Hard cut |
| 3 | 6.43–7.97 | Freeway underpass tent encampment, LA. "Tents on every block." | Slow push | Hard cut |
| 4 | 7.97–13.75 | Low-angle sidewalk: a man passed out, commuters walking past (animated walk cycles). "People passed out / on the sidewalk." "It looks like / something new." Serif "Something new?" appears at 11.85. "It isn't." | Clip motion, slight drift | `torn-paper-wipe` (match-cut) |
| 5 | 13.77–14.40 | London 1736: same low-angle composition. Stamp "LONDON 1736" slams in at 14.07. | Wipe 13.77–14.13. Stamp 14.05–14.17. | `push-slide-blur` |
| 6 | 14.40–15.95 | Rome c.100 AD alley with aqueduct. "Rome had it." Vertical label "ROME / C. 100 AD" drops in from the top. | Push 14.40–14.67. Label drop 14.53–14.73. | `push-slide-blur` |
| 7 | 15.95–17.85 | London 1730s, rainy lane with a gin-bottle sign. "London with gin." Label "LONDON / 1730S". Big keyword "GIN" pops at 17.03 on the word "gin". | Rain animated. Keyword pop. | `push-slide-blur` |
| 8 | 17.85–19.55 | China 1800s opium den. "China with opium." Label "CHINA 1800S". Keyword "OPIUM". | — | `push-slide-blur` |
| 9 | 19.55–21.9 | America 1880s elevated railway street. "America with morphine." Label "AMERICA 1880S". Keyword "MORPHINE". | — | `torn-paper-wipe` |
| 10 | 21.9–22.25 | Wipe to the navy grid background. The serif heading "Every time, three things collided" sits on the new layer. | 0.35 s | — |
| 11 | 22.25–23.0 | Navy plus heading. Caption "Every time," | Static | — |
| 12 | 23.0–23.65 | `stroke-draw-frames`: 3 panel borders draw on (red, gold, blue), staggered | 0.65 s total | — |
| 13 | 23.65–31.35 | Panels fill one by one with an illustration and a label, synced to narration: 25.48 "1 A CHEAPER, STRONGER DRUG", 28.1 "2 PUSHED OUT OF THEIR HOMES", 30.0 "3 NOTHING LEFT TO CATCH THEM" | `mask-slide-image-fill`, each 0.25 s | — |
| 14 | 31.37–31.45 | `panel-collide`: the three panels slam together (outer panels move toward the centre, gaps close and overlap). Ghost double-outlines appear. | 3 frames | — |
| 15 | 31.85–32.25 | `torn-paper-wipe` to the Roman Forum ruins at sunset | 0.4 s | — |
| 16 | 32.25–36.1 | Ruins. "And it usually / ended the hard way." Serif "The hard way" (32.6–34.7). "People died or". Stamp "PEOPLE DIED" slams in at 34.73. | Slow push. Stamp. | `push-slide-blur` (36.1–36.37) |
| 17 | 36.37–37.3 | Victorian asylum behind iron gates. "they were locked / away." Stamp "LOCKED AWAY" at 36.40. `prison-bars-drop` at 36.37–36.75. | Bars drop | Crossfade (37.3–37.8) |
| 18 | 37.3–37.8 | The bars and asylum crossfade to the opening SF shot (bookend) | 0.5 s dissolve | — |
| 19 | 37.8–41.5 | SF opening shot, wider. Serif "Can we end it" (39.0) / "differently?" in vermilion (39.55). The background darkens and slowly pushes in; litter flutters. | `end-question-title` | Fade to black 41.5–42.0 |

---

## Motion techniques

### 1. `kinetic-word-highlight-captions`

**Look:** Two- to four-word caption chunks, centred at 73.7% H. Bold white words have a dark outline. The word currently being spoken sits on a vermilion rounded-rect "marker" box. The box jumps from word to word in sync with the narration. Chunks replace each other: the old chunk disappears, and the new chunk fades in over about 3 frames, starting with the box on its first word.

**Parameters**
- Chunk in: opacity 0→1 over 3 frames. The box starts at 40% opacity and goes to 100% (3.53→3.63 s). No y-motion.
- Chunk out: hard cut, or a 2-frame fade with a 4 px blur when a scene transition overlaps it.
- Highlight move: **instant swap** on the word's start time. The box snaps; there is no tween between words. On appear it does a 2-frame fade.
- Word duration follows TTS timestamps (about 0.25–0.55 s per word).
- Text: 56 px Bold, `#fff`, `paint-order: stroke; -webkit-text-stroke: 3px #161616`, plus `text-shadow: 0 3px 6px rgba(0,0,0,.6)`.
- Box: `#c94b3d`, radius 8 px, padding `6px 12px`. Box opacity 0.95. It sits behind the text.
- The first chunk of a new scene starts dim (opacity 0.35) and rises to 1 within 3 frames.

**Remotion:**
```tsx
const words = chunk.words; // [{text, start, end}] in frames
const active = words.findIndex(w => f >= w.start && f < w.end);
<div style={{display: 'flex', gap: '0.45em', justifyContent: 'center', opacity: fadeIn}}>
  {words.map((w, i) => (
    <span style={{position: 'relative', padding: '6px 12px'}}>
      {i === active && <span style={{position: 'absolute', inset: 0, background: '#c94b3d', borderRadius: 8}}/>}
      <span style={{position: 'relative'}}>{w.text}</span>
    </span>
  ))}
</div>
```

**Props:** `transcriptWords[]` (with timings), `maxWordsPerChunk` (2–4), `yPct`, `fontSize`, `highlightColor`, `strokeColor`, `fadeInFrames`.

---

### 2. `serif-title-fade`

**Look:** Large sentence-case serif titles in warm off-white with a soft drop shadow, in the upper sky area: city names, "Something new?", "The hard way", "Every time, three things collided".

**Parameters**
- In: 3–5 frames, opacity 0→1, blur 6→0 px, scale 1.02→1.0, ease-out.
- Out: hard cut, or blur-fade over 3 frames.
- Text swap (San Francisco → Vancouver): the old text hard-cuts and the new one fades in over 5 frames on the same baseline.
- Style: 78 px Cormorant Garamond Medium, `#efe8dc`, `text-shadow: 0 4px 14px rgba(0,0,0,.55)`. Centred at 16.5% H.
- Two-line variant (end): line 2 in vermilion `#c14d3c`, about 1.3x size, enters 0.55 s after line 1.

**Props:** `text`, `accentLine`, `yPct`, `fontSize`, `fadeFrames`, `blurPx`.

---

### 3. `torn-paper-wipe` (signature transition, usually a match-cut)

**Look:** The new scene is revealed behind a **jagged, zig-zag tear edge** sweeping horizontally across the frame. The edge is a vertical polyline with sharp random zigzags (amplitude about 4–6% W, segment length about 3–6% H), outlined with a 3–4 px off-white `#f3efe6` highlight stroke like a paper fibre edge. A soft dark shadow (about 6 px) falls on the outgoing side. Overlays belonging to the outgoing scene (serif title, keyword, labels) are cut along with it. The caption layer sits above the wipe and stays.

**Parameters**

| Instance | Times (s) | Duration | Direction |
|---|---|---|---|
| a | 13.77 → 14.13 | 11 frames | New scene on the left, edge travels left → right |
| b | 21.90 → 22.25 | 10 frames | Same as (a) |
| c | 31.85 → 32.22 | 11 frames | Same as (a) |

- Ease: roughly linear with an ease-out at the end (`cubic-bezier(0.3,0.1,0.3,1)`).
- Edge X goes from −8% W to 108% W.
- The zigzag shape is **static** relative to the edge (seeded), and the edge translates rigidly. A slight per-frame wobble of ±2 px is optional.
- Used as a **match-cut**: the incoming image keeps the same composition (low-angle sidewalk then and now), which sells the "history repeats" idea.

**Recipe (SVG):**
```ts
// build once, seeded
const pts = []; let y = -20;
while (y < H + 20) {
  pts.push([random(seed+y)*0.05*W - 0.025*W, y]);
  y += 0.03*H + random(seed+y+1)*0.03*H;
}
// per frame
const X = interpolate(f, [s, s+11], [-0.08*W, 1.08*W], {easing: Easing.bezier(.3,.1,.3,1)});
const path = `M -10 -20 ` + pts.map(([dx, y]) => `L ${X+dx} ${y}`).join(' ') + ` L -10 ${H+20} Z`;
// incoming scene clipped by <clipPath><path d={path}/></clipPath>
// draw the same polyline (without the closing segment) as stroke #f3efe6 width 4, plus a feDropShadow
```

**Props:** `direction`, `durationFrames`, `jaggedAmplitudePct`, `segmentPct`, `edgeColor`, `edgeWidth`, `shadow`, `seed`.

---

### 4. `push-slide-blur`

**Look:** A fast whip transition. The incoming scene slides in from the right and pushes the outgoing one left. Both get strong horizontal motion blur during the move. There is a thin dark gap or seam between them.

**Parameters**
- Duration 7–8 frames (14.40→14.67; 16.00→16.23; 17.85→18.13; 19.55→19.83; 36.10→36.37).
- `easeInOutQuart`, so the peak speed is mid-transition.
- Both layers translate by −100% W together.
- Directional blur ≈ `|velocity| * 0.35` px, peaking at about 40 px.
- Overlays (vertical label, stamp) belonging to the incoming scene enter after the push (see `vertical-label-drop`, `stamp-slam`).

**Remotion:** two `<AbsoluteFill>` layers with `translateX`. For the motion blur, use an SVG `feGaussianBlur stdDeviation={`${b} 0`}`, or `@remotion/motion-blur` `<CameraMotionBlur>`.

**Props:** `direction`, `durationFrames`, `maxBlurPx`, `easing`.

---

### 5. `stamp-slam` (rotated label card)

**Look:** A vermilion rectangular label with a thin cream inner border and serif caps text ("LONDON / 1736", "PEOPLE DIED", "LOCKED AWAY"). It slams down onto the scene like a rubber stamp or pasted label: it starts big and translucent, then hits its final size with a tiny settle.

**Parameters (34.73 → 34.90, 30 fps)**

| Frame | Scale | Opacity | Rotation |
|---|---|---|---|
| 0 | 1.30 | 0.25 | −8° |
| 2 | 1.08 | 0.75 | −5° |
| 3 | 0.98 | 1.0 | −4° (overshoot) |
| 5 | 1.00 | 1.0 | −4° |

- Any preceding serif title fades or blurs out over the same 3 frames.
- After landing, the stamp drifts with the background push (it is attached to the scene layer).
- Implement with `spring({damping: 12, stiffness: 260, mass: 0.6})` on scale from 1.3→1 and a linear opacity ramp over 3 frames.
- Style: fill `#c14d3c` at 92% with multiply blend, so the paper texture shows through. Inner border 2 px `#dfd9c0` inset 6 px. Text `#f3ead8` serif caps 54 px, tracking 0.06em. A second line (year) in larger serif digits. Slight print texture (noise mask at 10%).
- Final rotation −4° to −6°. Position y 18–20% H, x centred or slightly left.

**Props:** `lines[]`, `rotation`, `x`, `y`, `width`, `color`, `slamFrames`.

---

### 6. `vertical-location-label`

**Look:** A tall vermilion tag on the right edge. It holds the place name stacked letter-by-letter vertically in serif caps, plus a small era line ("C. 100 AD", "1730S", "1800S", "1880S"). It drops in from above after the push transition.

**Parameters**
- Drop: translateY −110% → 0 over 6 frames (14.53→14.73 for ROME; 16.23→16.37 for LONDON), ease-out `cubic-bezier(0.2,0.9,0.3,1.05)` with a slight overshoot.
- Holds for the scene and leaves with the scene (part of the scene layer).
- Size: 117x477 px for a 6-letter name. Letters 52 px serif, `#f3ead8`, pitch 60 px. Inner cream border 2 px inset 6 px.

**Props:** `name`, `era`, `side`, `topPct`, `color`.

---

### 7. `keyword-pop`

**Look:** On the narrated keyword, a huge vermilion heavy-sans word ("GIN", "OPIUM", "MORPHINE") pops in above the caption, at 64% H.

**Parameters**
- 17.03 → 17.20: scale 1.15→1.0, opacity 0→1 over 2 frames, then settles over 4 more frames. Ease-out back (`Easing.out(Easing.back(1.4))`).
- Style: Inter Black / Arial Black, about 140 px, `#cb4e3d`, 3 px stroke `#1d1a18`, shadow `0 6px 14px rgba(0,0,0,.5)`.
- It stays until the scene leaves. For long words ("MORPHINE") it fills about 85% W.
- Sync: triggers on the caption word's start frame (the same as the highlight box).

**Props:** `word`, `triggerFrame`, `color`, `yPct`, `maxWidthPct`.

---

### 8. `navy-grid-backdrop`

**Look:** A deep navy flat background with a faint 90 px square grid and a strong radial vignette (centre `#2a3242`, corners `#0b1018`). Used as the "explainer" interstitial.

**Recipe:** `background: radial-gradient(ellipse at 50% 40%, #2c3546 0%, #232b3a 55%, #0b1018 100%)`, then an overlay SVG `<pattern width=90 height=90>` with 1 px lines `rgba(255,255,255,0.045)`. Add 3% print grain.

**Props:** `baseColor`, `gridSize`, `gridOpacity`, `vignetteStrength`.

---

### 9. `stroke-draw-frames`

**Look:** Three stacked rectangles draw their outlines on, one after another. Each stroke starts at the top-left corner and runs clockwise (top edge → right edge → bottom edge → left edge). Each has its own colour: red `#ad3f32`, gold `#cfa44d`, steel blue `#8ca7c5`.

**Parameters**
- Stroke width 3 px. Each frame draws over 10 frames (0.33 s) with `easeInOutQuad`.
- Stagger 5 frames (0.17 s).
- Panel 1: 23.00→23.33. Panel 2: 23.13→23.47. Panel 3: 23.30→23.63.
- Narration sync: they draw on "three things collided".

**Remotion:** a `<rect>` with `pathLength={1}`, `strokeDasharray="1 1"`, `strokeDashoffset={1 - p}`. Rotate the path start to the top-left by drawing a `<path d="M x y H x+w V y+h H x Z">`.

**Props:** `rects[]`, `colors[]`, `strokeWidth`, `drawFrames`, `staggerFrames`, `startFrame`.

---

### 10. `mask-slide-image-fill` (numbered panel content)

**Look:** On cue, an illustration slides into its frame from the left while being clipped by the frame. The visible part grows from the left edge, and the image travels with the reveal (not a static wipe). The bottom label strip ("1  A CHEAPER, STRONGER DRUG") travels with the image.

**Parameters**
- Duration 8 frames (25.48→25.72), `easeOutCubic`.
- Image translateX −100% → 0 inside `overflow:hidden`.
- The panel's border colour also tints the label numeral (red / gold / blue).
- Label strip: `linear-gradient(transparent, rgba(0,0,0,.75))`, 90 px tall. Numeral 42 px in the panel colour. Text 34 px Bold white caps.
- Cues: 25.48 (panel 1), 28.10 (panel 2), 30.00 (panel 3), on the narration keywords.

**Props:** `src`, `label`, `index`, `color`, `startFrame`, `durationFrames`, `direction`.

---

### 11. `panel-collide`

**Look:** On "…to catch them", the stacked panels slam into each other. The top panel shifts down about 10 px, the bottom shifts up about 10 px, and the gaps close to about −4 px (slight overlap). Their borders double: a second copy of each outline is offset by about (4, 4) px at 60% opacity. This is a print-misregistration "impact" that stays until the torn-paper wipe.

**Parameters**
- 3 frames (31.37→31.45), `easeInExpo`, with no rebound.
- The ghost outlines appear on the impact frame.
- An optional 2-frame camera shake (±3 px) on impact.

**Props:** `gapFrom`, `gapTo`, `ghostOffset`, `impactFrame`, `shakePx`.

---

### 12. `prison-bars-drop`

**Look:** Vertical black iron bars fall from the top of the frame over the asylum shot. Each bar slides down at a slightly different time, giving a ragged "dripping" front that quickly forms a cell grille. Later the whole grille dissolves along with the scene into the bookend shot.

**Parameters**
- 12 bars across 1080 px (pitch about 90 px, aligned to the grid). Bar width 18 px (1.7% W).
- Bar colour `#141519` with a 2 px left highlight `#3a3d44` (a cylinder hint). A horizontal crossbar is optional; none here.
- Each bar: translateY −100% → 0 over 6–8 frames with `easeInQuad` (falling, accelerating) and a 1-frame 2% overshoot/settle.
- Per-bar delay `random(seed+i) * 6` frames, starting at 36.37 s. All are down by 36.75.
- Exit: the bars fade out with the scene crossfade (37.3–37.8).

**Props:** `count`, `barWidthPct`, `color`, `startFrame`, `maxDelayFrames`, `fallFrames`.

---

### 13. `bookend-crossfade`

**Look:** The asylum and bars dissolve into the opening SF image (the circular structure of the story), rather than wiping.

**Parameters:** a 15-frame (0.5 s) opacity crossfade, linear, 37.3→37.8 s. The incoming shot is framed wider than the punch-in of scene 2 (it matches the scene 1 framing).

---

### 14. `end-question-title`

**Look:** Over the final street shot:
- The background slowly darkens and desaturates around the title: a radial/top-weighted scrim goes 0→35% over 38.8→40.0 s.
- Slow push-in continues (about 2% over 3 s).
- Paper litter particles flutter across the pavement. These are part of the clip; a procedural version is 6–10 small paper quads drifting with a sin wobble.
- "Can we end it" (off-white serif, 78 px) fades/blurs in at 39.0 over 6 frames.
- "differently?" (vermilion serif, about 100 px, slightly tighter tracking) fades/blurs in at 39.55 over 6 frames, on line 2 directly below.
- Hold, then a global fade to black 41.5→42.0 (15 frames, ease-in).

**Props:** `line1`, `line2Accent`, `scrimOpacity`, `stagger`, `fadeOutFrames`.

---

### 15. `woodblock-ken-burns` (base layer for every illustrated shot)

**Look:** Each illustration is shown full-bleed with a slow push-in or drift (about 2–4% scale over the shot) so the frame never sits still. In the source, many shots are image-to-video clips with small in-scene motion (pedestrians, bus, rain). For a library version, use stills plus Ken Burns, plus optional procedural rain or particles.

**Recipe**
- `scale = interpolate(f, [0, dur], [1.0, 1.04])`.
- `translate` drifts ±1.5% toward a focal point.
- Add a **print-grain overlay**: per-frame noise at 4%, and a static paper-fibre texture at 6% multiply. This unifies AI images with the vector overlays.
- Rain (London): 120 thin lines, 1 px x 40–80 px, angle 75°, speed 60 px per frame, opacity 0.25, seeded positions wrapped vertically.

**Props:** `src`, `focal`, `zoomFrom/To`, `drift`, `grain`, `rain`.

---

### 16. `punch-in-cut`

**Look:** A hard cut to the same image at about 1.25x scale, re-centred on the subject (3.50 s), synced to the start of the first caption. It is an emphasis beat with no transition frames.

**Props:** `scaleTo`, `focal`, `atFrame`.

---

## Transitions

| Time (s) | Type |
|---|---|
| 3.50 | Punch-in hard cut (same shot) |
| 6.43, 7.97 | Hard cuts |
| 13.77–14.13 | `torn-paper-wipe`, match-cut modern → 1736 London |
| 14.40–14.67, 16.00–16.23, 17.85–18.13, 19.55–19.83 | `push-slide-blur` (right → left) through the historical montage |
| 21.90–22.25 | `torn-paper-wipe` → navy infographic |
| 31.85–32.22 | `torn-paper-wipe` → Roman ruins |
| 36.10–36.37 | `push-slide-blur` → asylum |
| 37.30–37.80 | Crossfade (bookend) → SF opening |
| 41.5–42.0 | Fade to black |

The rhythm is a transition every 1.5–2.0 s during the montage, synced to narration phrases.

## Camera

- No 3D camera. Every shot is a 2D frame with a **slow push-in (2–4%)** or slight lateral drift. Some source clips contain their own motion (people walking, the bus, rain).
- Emphasis comes from cuts (the punch-in), whip pushes and a micro shake on the panel collision.
- The navy infographic section is locked off (zero motion except the elements).
- Depth layers: one (flat illustration) plus a graphic overlay stack, in this order:
  1. caption (top)
  2. keyword
  3. stamp / vertical label
  4. serif title
  5. image

## Library candidates

- `kinetic-word-highlight-captions` — TikTok-style word-synced captions with a jumping highlight box, for any narrated short.
- `serif-title-fade` — elegant serif place or chapter titles over imagery.
- `torn-paper-wipe` — jagged paper-tear wipe, ideal for then/now match-cuts.
- `push-slide-blur` — fast whip-push between montage shots.
- `stamp-slam` — rotated label slams for dates, verdicts and emphasis words.
- `vertical-location-label` — side tag giving place and era for location-hopping stories.
- `keyword-pop` — big coloured keyword hit synced to narration.
- `navy-grid-backdrop` — dark blueprint background for explainer or infographic beats.
- `stroke-draw-frames` — staggered outline draw-on to set up a list of items.
- `mask-slide-image-fill` — image slides into a frame with a numbered caption strip.
- `panel-collide` — impact beat where list items slam together with a misregistration effect.
- `prison-bars-drop` — bars falling over a scene for confinement or "trapped" themes.
- `bookend-crossfade` — dissolve back to the opening shot for circular endings.
- `end-question-title` — two-line closing question with an accent line and a darkening scrim.
- `woodblock-ken-burns` — slow push on illustrations, with grain, paper texture and optional rain.
- `punch-in-cut` — instant zoom-cut on the same frame for emphasis.
