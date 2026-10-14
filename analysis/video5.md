# video5 — "An Army of AI" living landing-page hero (cinemagraph)

## Overview

| | |
|---|---|
| Resolution / fps | 1280×720, 30 fps, 9.96 s (297 frames). Has an audio track (ignored). Single shot, no cuts. |
| Theme / story | A SaaS landing-page hero for "Imperium": "An Army of AI / One Powerful Vision". The hero art shows a huge formation of cute robot legionaries on a snowy plain. The hero knight in front raises his sword, the sword flashes with a star glint, and then the whole army stomps in unison in a steady march rhythm. The UI chrome (nav, headline, CTAs, logo strip) is completely static. This is a **cinemagraph**: a still layout where only the illustration moves. |
| Art style | **Monochrome blue-ink etching / pencil cross-hatch** illustration, like a blueprint or cyanotype drawing, with a cool lavender sky gradient. Flat modern web UI over it. |
| Palette | Background sky top `#BBC2D9`, mid `#C5CCDF`, bottom `#B8BFDA`. Illustration ink dark `#2D3A6F`, mid `#6A74A2`, paper highlights `#E6E9F3`. Headline gradient `#14235B` (left) → `#3D4773` → `#63678F` (right end of "Vision"). Primary button fill `#344A87` with white text. Secondary button 1 px `#1A2350` outline. Nav and body text `#151C42`. Logo strip `#111C4A`. Glint core `#FFFFFF`, bloom `#DDE6FF`. |
| Fonts | Geometric/grotesk sans (Inter / General Sans / Satoshi feel). Headline semibold (~600), two lines, each ≈ 50 px cap+x height (lines at y≈140 and y≈190; ≈ 6.5 % H per line), tight tracking (−1 %). Subtitle 14 px regular, 2 lines, right column x=885. Nav 14 px regular. Buttons are 14 px medium pills, 32 px tall, fully rounded. |
| Layout | 12-col web grid. Left margin 72 px (5.6 % W), right margin 78 px. Headline top-left (x 72–485, y 118–212). Subtitle and CTAs in the right column (x 885–1203, y 133–224). Nav bar y≈48. Logo strip centred at y≈674 (x 336–966, 6 logos evenly spaced ≈ 107 px apart). The illustration fills y≈220–650, full bleed, with the horizon/mountain ridge at y≈230–300. |

## Timeline

| t (s) | On screen | What moves |
|---|---|---|
| 0.00–0.57 | Static hero. The knight holds his sword lowered to the left. | Nothing (a hold to let the viewer read the page) |
| 0.57–0.60 | — | `pose-swap-raise`: the sword jumps up to vertical within 1 frame |
| 0.60–0.70 | — | The sword blade brightens |
| 0.70–2.30 | — | `star-glint-flare` at the blade tip (554,389): full intensity with a slight shimmer |
| 2.30–2.90 | — | The glint decays (bright pixel count 3500 → 1500) |
| 2.40–9.96 | — | `crowd-stomp-hop`: the whole army hops in unison every 0.75 s (first hop at 2.57 s, then 3.73, 4.48, 5.23 …). The hero knight stays still. |
| whole clip | UI chrome | Static: frame-diff ≈ 0, apart from codec keyframe pulses at 3.0, 6.0 and 9.0 s, which can be ignored |

## Motion techniques

### `cinemagraph-hero-loop`
**Look:** a pixel-perfect static web layout in which only the illustration plate is animated, so a landing page feels alive.

**Elements (bottom to top):**
1. Sky gradient rect.
2. Illustration plate: mountains layer, back army, front army rows, hero character, FX.
3. UI layer: nav, headline, subtitle, CTAs, logo strip.

The UI never animates. This is what makes the piece read as a "living website".

**Remotion:** `<AbsoluteFill>` with the UI as HTML/SVG on top of an animated `<svg>` or sprite stage. Keep the UI in a separate component so it can be swapped. If no motion should touch the UI, keep its transform at identity.

**Props:** `headline[]`, `subtitle`, `ctas[]`, `logos[]`, `brandName`, `plate` (child component), `palette`.

### `gradient-headline`
A static two-line headline with a horizontal linear gradient fill: `#14235B` at 0 % → `#63678F` at 100 % of the text box width, so the last word fades lighter. Semibold, −1 % tracking, line-height 1.0. SVG: `<linearGradient x1=0 x2=1>` with `fill="url(#g)"` on `<text>`, or CSS `background-clip:text`. **Props:** `lines`, `from`, `to`. It could get an optional animated shine: move the gradient stops 0→1 over 1.5 s. This is not in the source, but it fits the style.

### `pose-swap-raise`
**Look:** the hero character's arm and sword change from "lowered, pointing down-left" (blade about −135°) to "raised vertical" (0°) **within one frame** (0.57→0.60 s). There is no in-between: a snap/pop, like a held-pose cut in limited animation. The next 3 frames add a subtle brightness flash on the blade, which hides the jump.

**Remotion:** build the character as layered SVG groups (body, shield arm, sword arm). Rotate the sword-arm group around the shoulder pivot with `rotate = frame < F ? -135 : 0`. Alternatively, for a smoother library version, `spring({damping:14, stiffness:220})` over ~6 f with an overshoot of about 8°. Add a 3 f white `feFlood` overlay on the blade at 0→60 %→0.

**Props:** `fromAngle`, `toAngle`, `pivot`, `mode: 'snap'|'spring'`, `flashFrames=3`.

### `star-glint-flare`
**Look:** a big specular "ting" on the sword tip. It is a white core with a soft bloom (radius ≈ 45 px at 720p, 6 % H) and **6 spikes**: 2 long diagonals in an X at ±45° (length ≈ 110 px each side), 1 vertical (≈ 70 px) and short secondary rays. The whole flare covers about 160×160 px.

**Timing:**
- Ramps in over 3 frames (0.60→0.70), easeOutQuad.
- Holds 1.6 s with a shimmer: spike length ±8 % and rotation ±3° at about 6 Hz noise.
- Peaks again slightly at 2.1 s (+20 % area).
- Decays over 0.6 s (2.3→2.9), easeInQuad, leaving the blade lightly glowing.

**Remotion SVG:**
```
<g transform={`translate(x,y) rotate(${jitter})`} style={{mixBlendMode:'screen'}}>
  <circle r={45*s} fill="url(#bloom)"/>   // radialGradient: white 1 → #DDE6FF .6 → transparent
  {spikes.map(a => <path d={diamondSpike(len*s, width=6*s)} transform={`rotate(${a})`} fill="url(#spikeGrad)"/>)}
</g>
```
Spikes are thin diamond shapes (lens shapes), white at the centre fading to transparent at the tips. Use `feGaussianBlur stdDeviation=2` on the spike group.

**Props:** `x, y`, `size`, `spikeAngles=[45,135,90]`, `inFrames=3`, `holdFrames`, `outFrames=18`, `shimmerHz=6`, `color`.

### `crowd-stomp-hop`
**Look:** an entire formation of identical soldiers hops up and lands together, in a steady march rhythm. The hops are synchronised across the whole row, not a wave. Amplitude falls off with depth.

**Measured** (phase-correlation on image patches, 720p):
- **Period 22–23 frames = 0.75 s (80 BPM).** The first hop at 2.57 s comes after a 35-frame lead-in.
- Hop profile in frames relative to the takeoff:

| frame | −2 | −1 | 0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| dy px | +2 | +3 | 0 | −4 | −10 | −16 | −12 | −7 | −7 | −3 | 0 | +1 |

  The +2/+3 at the start is a squash anticipation; the +1 at the end is a landing settle. The rise is about 3 f and the fall about 5 f, i.e. a quick snap up and a softer, heavier landing. The hop lasts ≈ 10 f (0.33 s), followed by a rest of ≈ 12 f.
- Amplitude by depth: front rows (y≈430–560) **−16 px (2.2 % H)**; middle rows (y≈360–430) −3 px; far rows (y<330) ≈ 0–1 px. Roughly `amp = 16·((y−300)/260)^2.2`.
- The hero character does **not** hop (it was 0 px for the whole clip). This keeps the hero as the stable focal point.

**Remotion:** generate the soldiers procedurally on a perspective grid: rows `r = 0..R`, `y_r = horizon + k/(r+1)`-style spacing, `scale_r ∝ depth`, x staggered by half a cell on odd rows, elliptical clip of the formation. Each soldier is a `<use href="#soldier">` with `scale(s_r)`. Then:
```
const p = (frame - start) % 22;
const hop = interpolate(p, [0,1,3,4,6,8,9,10,22], [0,3,0,-16*0.25,-16,-7,-3,0,0]); // multiplier ≈ 1 at front
dy = hop * depthAmp(row);
```
Optional: add a per-soldier phase jitter of ±1 f and an amplitude jitter of ±10 % for realism (the source is nearly perfectly in sync). Spears are part of the sprite, so they move with it.

**Props:** `periodFrames=22`, `amplitude`, `depthFalloff`, `startFrame`, `syncJitterFrames=0`, `heroExcluded=true`, `rows`, `cols`.

### `ink-etching-tint`
A look, not a motion: the whole illustration is a single-hue ink drawing. To make new content match, render any illustration/asset through a monochrome map: shadows `#1E2A5E` → mids `#6A74A2` → highlights `#E6E9F3`. SVG: `feColorMatrix` (luminance) followed by `feComponentTransfer` tables. Optionally add a cross-hatch pattern overlay (`<pattern>` of 1 px diagonal lines at 45° and −45°, 4 px spacing, `multiply` blend, 25 % opacity) masked by darkness. **Props:** `shadow`, `mid`, `highlight`, `hatchOpacity`.

## Transitions

None. It is one continuous shot. The clip does **not** loop seamlessly: it starts with the sword lowered and ends with it raised. To make a looping version, hold the sword raised and loop only `crowd-stomp-hop` (an integer number of 22-frame periods, e.g. 297 f ≈ 13.5 periods; use 286 f = 13 periods for a clean loop).

## Camera

Completely locked off. No pan, zoom or parallax: UI and plate patches show 0 px drift across all 297 frames. All the life comes from the character animation. (A natural library upgrade is a 1–2 % slow push-in on the plate only, keeping the UI fixed.)

## Library candidates

- `cinemagraph-hero-loop`: turns any static landing-page or product mock into a "living" hero for promo videos.
- `gradient-headline`: brand headline with a fade-to-light last word; a static title treatment for hero frames.
- `pose-swap-raise`: a snap pose change (raise sword, flag or hand) for a character "call to action" beat.
- `star-glint-flare`: specular "ting" highlight on a logo, product edge, blade or badge.
- `crowd-stomp-hop`: makes a massed grid of characters or icons pulse in unison ("scale / many agents" message).
- `ink-etching-tint`: a monochrome blueprint/ink colour grade that unifies mixed assets.
