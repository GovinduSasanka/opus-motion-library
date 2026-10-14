# video12 — "A Day in the Life of Claude" (toon 3D + comic overlays)

## Overview

| | |
|---|---|
| Resolution / fps | 1920×1080, 30 fps container, 91.30 s, no audio. **The whole video is rendered on twos.** Every image is held for exactly 2 frames, so the effective rate is 15 fps. Luma pairs and frame differences confirm this (for example, frames 1/2, 3/4… are identical at 0.0–0.7 s, 7.8–8.7 s and 5.2–6.0 s). The 3D camera, the characters and the 2D overlays are all stepped this way. |
| Story | A day in the life of an orange box-robot "Claude". Sunrise over a San Francisco apartment block and the title. The alarm rings (BEEP / BONK). Hop out of bed, toast, cereal "TOKEN O's", off to work by subway. A passenger says "Morning, little guy!". Escalator, Anthropic HQ, a badge scan. Into a neon synthwave "cyberspace" desk: "hi Claude!" leads to a clone-army reveal of 48,213 sessions. The afternoon is spent being "SUMMONED" to Lab 3 for experiments: an invisible watermark, effort HIGH→MEDIUM ("did Claude get dumber?" → postmortem), usage limits ("LIMIT REACHED" → "RESET!"). A montage of dated incidents (MAR 31 source leak "CRASH!", APR 4 harnesses unplugged "ZAP!", FEB 27 "SUPPLY CHAIN RISK" crate "THUNK!"). The ride home with "zzz", a sunset over the Golden Gate, "SIGH…", and a thought bubble recapping the day "…and again tomorrow". The camera pulls back from the night city for the end card. |
| Art style | **Comic-book toon 3D (three.js).** Voxel/box characters, flat toon shading with 2–3 bands, and thick dark ink outlines (`#16081C`, about 3–4 px). A **luminance halftone screen** covers the midtones and shadows. Dots are about 5 px pitch at 45°: dark dots on light surfaces and light dots on dark ones. **Radial chromatic aberration** is about 1 px at the centre and 3–4 px at the frame edges (magenta/green fringes). There is also soft bloom on lamps, windows and neon, a light vignette and fine grain. The overlays are flat 2D "comic print" graphics: starbursts with halftone dots, offset-print cyan/magenta misregistration outlines, and yellow caption boxes with hard black drop shadows. |
| Palette | **Ink** `#16081C` / `#141123`. **Comic overlays:** caption yellow `#FEE04A` (dots `#F8D541`/`#E8B030`), SFX text gradient top `#FFCB64` → bottom `#FF9253`, SFX dot tint `#DD6D4E`, SFX cream text `#FEF4D7`, burst white `#FFFFFF`, burst pink dots `#EE97B6`, offset cyan `#1DD1D9`, offset magenta `#FA3D8C`, pink burst `#FF3C8A` (orange dots `#EA9678`), yellow burst `#FFE049`, green burst `#7DFDB0`, cyan burst ≈ `#8BE3ED`, title logotype fill `#FBBC47`→`#F69A45`, end-title fill `#FAB446`. **Impact frames:** yellow `#F1D741` / deep violet `#120222`. Red speed lines `#E75855`. Flash/whiteout cream `#EDE4D5` (RESET flash average `#CFC4A2`). **3D world:** sunset sky `#ED9E65`/`#E8A966`, building blues `#10278B`/`#243684`/`#4D1361`, Claude orange lit `#E57016`, shade `#8E4326`. Cyberspace floor `#270778`, grid lines `#37C5D7`, horizon glow `#E22289`, sky `#6004A0`–`#880A99`. Chat bubble dark `#120223`, reply bubble `#DB8644`, prompt chips `#F28E68`. Banner maroon `#440213` with salmon text `#FB8179`. Lab label text `#71EFE6` on `#100433`. Night city roofs `#310D4B`, sky `#61165A`. |
| Fonts | **SFX, timestamps and titles:** *Bangers* (condensed, slanted comic caps), with letters given a slight random per-letter rotation and baseline jitter. **Caption sub-text** ("RISE AND SHINE", "A DAY IN THE LIFE OF"): a hand-lettered comic caps face such as *Comic Neue Bold* or *Patrick Hand SC*, with wide-ish tracking. **Chat bubbles, chips, neon signs and counters:** a rounded geometric sans such as *Nunito ExtraBold*, *Fredoka* or *Quicksand Bold*. **Speech balloon** ("Morning, little guy!"): *Comic Neue* in mixed case. |

## Timeline

Hard cuts come from scene detection (threshold 0.25). Every time below is quantised to 1/15 s.

| # | t (s) | On screen | Motion | Transition out |
|---|---|---|---|---|
| 1 | 0.00–4.80 | Sunset roofscape. A blue apartment block with a water tower; string lights. | `fade-from-black` 0→0.73 s, linear, starting at ~30 % brightness. `camera-orbit-push-in` toward the block (≈2.3× over 4.6 s, ~20° orbit right, rising slightly). `comic-title-pop`: the yellow tag "A DAY IN THE LIFE OF" at 0.60 s, then "CLAUDE" at 0.93 s. Title hard-off at 4.00 s. Apartment window lights flick on at 3.7 s (bloom). | Hard cut |
| 2 | 4.80–6.40 | Bedside alarm clock close-up | The clock flips 6:59→7:00 at 5.20 and rattles (±8° rotation jitter). `sfx-starburst-pop` "BEEP! BEEP!" (white burst) at 5.27. `timestamp-caption` "7:00 AM / RISE AND SHINE" slides in at 5.40. | Cut |
| 3 | 6.40–7.87 | Claude asleep under the duvet, in a nightcap | Small plain `sfx-text` "BEEP!" next to the clock wobbles and fades. The eyes open grumpy and an arm reaches out. | `impact-frame` |
| 4 | 7.87–9.23 | Same bed shot | `impact-frame` (yellow/violet duotone plus black speed lines) 7.87–8.00. "BONK!" pink burst at 7.93. `radial-speed-lines` fade 8.00–8.27. The burst exits 8.53–8.60. The caption exits (slide left) 8.55–8.75. | Cut |
| 5 | 9.23–12.00 | Wide diorama bedroom ("hello world" garland, THINK! poster) | `character-hop-squash`: Claude jumps out of bed in a 0.6 s arc and the nightcap flies off. Landing squash at 10.03. "YAAAWN" (`sfx-text`, blue) at about 9.9. "THUMP" at 10.10. Claude turns and walks off. | Cut |
| 6 | 12.00–13.80 | Kitchen; Claude close-up beside the toaster | Toast pops at 13.07 with white streak lines. "POP!" orange-red burst at 13.20, exits 13.73. | Cut |
| 7 | 13.80–17.00 | Breakfast table, "TOKEN O's" cereal | Caption "7:30 AM / BREAKFAST". Chewing bob. "CRUNCH" white burst at about 15.0 with crumb particles. | Cut |
| 8 | 17.00–19.20 | Wide kitchen with a door | Claude walks to the door. "OFF TO WORK!" yellow burst at about 18.0. | Cut |
| 9 | 19.20–22.80 | Subway platform | Caption "8:15 AM / CASTRO STATION". The train slides in. "SCREEEE" plain SFX (cyan, 21.0). "DING-DONG" yellow burst (22.0). Passengers board. | Cut |
| 10 | 22.80–25.10 | Inside the train | "CLACK-CLACK" plain SFX bobbing. LED sign "NEXT • MONTGOMERY". Train sway (camera roll ±1°). | Cut |
| 11 | 25.10–27.00 | Low angle on Claude with a tall passenger | `speech-balloon-pop` "Morning, little guy!" at 25.90. Claude's eyes squint happily at 26.2. | Cut |
| 12 | 27.00–28.63 | Escalator rising toward a bright exit | Camera follows behind and up. | `light-whiteout` (28.53→28.73 into cream) |
| 13 | 28.63–31.40 | Anthropic HQ exterior with a sun-glare door | Comes out of the whiteout, decaying 28.73→29.10. Caption "9:00 AM / ANTHROPIC HQ". | Cut |
| 14 | 31.40–33.60 | Street, a badge reader post | "GULP" plain SFX (32.0). A badge scan gives a "BEEP!" green burst (33.0). Camera dolly-in onto Claude with a bloom glow (33.2–33.55). | Cut (glow push) |
| 15 | 33.60–40.20 | Synthwave cyberspace: neon grid floor, purple sky, Claude's desk with a "CLAUDE" nameplate | Claude hops up to the desk. Caption "9:05 AM / FIRST SESSION OF THE DAY". `chat-bubble-pop` "hi Claude!" (34.57). "TAP TAP TAP" (35.0). The reply "Hi! How can I help?" flies out of Claude (35.90). `clone-army-crane-reveal` 36.5–38.6. `pop-swarm` of small POP bursts 37.0–38.4. Floating prompt chips. `counter-ticker` "ACTIVE SESSIONS" 8 k→48,213 (38.2–40.0) with a glitch at the end. "48,213 SESSIONS!" pink burst (38.8). | Cut |
| 16 | 40.20–43.03 | Over the shoulder at the monitor (chat UI: "You're absolutely right!") | Caption "1:59 PM / SESSION 48,213". "TAPTAPTAP" (41.0). Message rows append. | Cut |
| 17 | 43.03–45.60 | Wide desk farm, pink-purple sky | The banner "ATTENTION / CLAUDE → LAB" swings in from the top right (43.17) with red `radial-speed-lines`. "ATTENTION!" yellow burst (43.23). `glitch-slice` 43.30–43.50. Caption "2:00 PM / SUMMONED". "CLANK!" (44.0): a claw grabs Claude. "WHIRRRR" (45.0) as the claw lifts. | Cut |
| 18 | 45.60–48.03 | Lab 3: Claude on a glowing pedestal under the claw; a scientist; a REASONING EFFORT gauge | Caption "2:00 PM / THE LAB". | Cut |
| 19 | 48.03–50.20 | Conveyor machine | Caption "EXP. 01 / INVISIBLE WATERMARK". "CLICK" plain SFX. | Cut |
| 20 | 50.20–52.83 | Claude close-up | `watermark-pattern-reveal`: a "© CLAUDE" diagonal pattern fades onto the body. "!?" lavender burst (51.0) together with a green scanline glitch. The pattern fades away. | Cut |
| 21 | 52.83–55.03 | Lab wide: gauge, thought bubble of gears | Caption "EXP. 02 / EFFORT: HIGH → MEDIUM". The scientist turns the gauge (the needle swings). "CLUNK" white burst (54.0). | Cut |
| 22 | 55.03–57.60 | Lab close; "QUALITY" chart monitor | The chart line turns red and declines. `comment-chip-stagger`: "did Claude get dumber?", "is it nerfed??", "it forgot what it just did". "WOMP WOMP" plain SFX. "SLAP!" yellow burst. A green chip "POSTMORTEM: 3 changes, all reverted" drops in at the top. | Cut |
| 23 | 57.60–60.60 | EXP. 03 – USAGE LIMITS: a tank labelled "WEEKLY LIMIT" and a RESET button | A big "6:00 PM" time card at the top left. A red "−17 %" tag. The tank drains. | `impact-frame` (red) |
| 24 | 60.60–62.43 | Same set | Red-duotone impact frame 60.60–60.73. The neon sign "LIMIT REACHED / resets in 4h 59m" drops in from the top (`sign-drop-swing`). "BZZZT!" yellow burst plus red speed lines plus `glitch-slice` 60.8–61.3. Claude gets knocked over: "THUD" plain SFX (61.4). | Cut |
| 25 | 62.43–63.60 | A box falls off a shelf | Caption "MAR 31 / 512,000 LINES OF SOURCE SHIP TO NPM". Inverted B/W `impact-frame` (63.10). "CRASH!" white burst (63.17) plus white speed lines; papers burst out of the box (particles). | Cut |
| 26 | 63.60–65.20 | Claude with a lobster plugged in | Caption "APR 4 / THIRD-PARTY HARNESSES UNPLUGGED". A hand pulls the plug. "ZAP!" cyan burst with sparks. | Cut |
| 27 | 65.20–66.00 | A crate drops over Claude | Black/yellow `impact-frame` 65.23–65.33. "SUPPLY CHAIN RISK" stamp on the crate. "THUNK!" white burst with red text (65.37). Caption "FEB 27 / LABELLED A "SUPPLY CHAIN RISK"". | Cut |
| 28 | 66.00–69.60 | The usage-limits set again | The scientist hits RESET. `flash-to-cream` (66.80, 1 render frame). "RESET!" green burst (66.87) plus white speed lines plus `confetti-burst`. The tank refills. The neon sign becomes green: "LIMITS RESET ✓ / sorry about that". "PAT PAT" plain SFX as the scientist pats Claude. Caption "6:00 PM / LIMITS RESET". | Cut |
| 29 | 69.60–72.00 | Train at sunset, "NEXT • CASTRO" | Caption "6:40 PM / HEADING HOME". | Cut |
| 30 | 72.00–74.40 | Claude close-up, dozing | Eyes droop. "zzz" plain SFX rising and bobbing. | Cut |
| 31 | 74.40–77.40 | Balcony exterior | Caption "7:15 PM / HOME". Slow push-in. | Cut |
| 32 | 77.40–81.60 | Sunset over the Golden Gate from the balcony (Claude in the foreground) | Slow drift; lens flare at the sun. | Cut |
| 33 | 81.60–87.00 | Claude on the balcony rail | "SIGH…" plain SFX (82). `thought-bubble-sequence` (83.8–86.4): icons alarm, train, toast, flask, red button, moon, then "…and again tomorrow". "CLICK" (85.0): the room light goes off and Claude darkens. | Cut |
| 34 | 87.00–91.30 | Night exterior of the apartment block; city lights | `crane-pull-back` 87.5–89.3. `end-card-stack`: tag "TOMORROW, HE DOES IT ALL AGAIN." drops in (88.43); "A DAY IN THE LIFE OF CLAUDE" pops (88.90); white disclaimer chip "a fan-made parody · not affiliated with Anthropic" (89.55). The scene fades to black 90.73→91.3 **under** the overlays, which stay visible. | End |

## Motion techniques

### `render-on-twos`
**Look:** everything (3D camera, characters and overlays) updates every second frame. This gives a hand-animated, stop-motion comic cadence.

**Measured:** consecutive frame pairs are pixel-identical (mean abs diff < 1 against 3–11 between pairs), across the intro, the BEEP/BONK sequence and the end. Effective rate 15 fps.

**Remotion:** wrap the composition in a time-quantiser: `const f = Math.floor(useCurrentFrame()/step)*step` (step = 2), and feed `f` to every child via context. For three.js, call `renderer.render` only when `f` changes. **Props:** `step=2` (1 = off), `exclude` (layers that stay smooth).

### `comic-halftone-postfx`
**Look:** the print-comic finish over the toon 3D render.
- Luminance-driven halftone dots in midtones and shadows (5 px pitch at 1080p, 45° screen). Dark dots sit in light areas and light dots in dark areas, so flat colours stay flat at the extremes.
- Ink outlines about 3–4 px, `#16081C`.
- Radial chromatic aberration: 0.5 px at the centre, 3–4 px at the corners (R pushed out, B pulled in, green fringe visible).
- Bloom on emissives (window lights, neon, sun glare), radius about 2 % H.
- Light vignette (corners −10 %), fine grain about ±3 luma.

**three.js recipe:** `MeshToonMaterial` with a 3-step gradient map, plus an inverted-hull outline or a Sobel depth/normal edge pass. Then an `EffectComposer` with UnrealBloom (strength 0.6, threshold 0.8), then a custom halftone shader. The halftone shader computes `lum`, rotates the UV by 45°, sets `cell = 5px`, `d = length(fract(uv/cell)-.5)`, `dot = smoothstep(r+aa, r-aa, d)` with `r = f(lum)` in the 0.2 < lum < 0.75 band, and mixes toward a shade colour or a highlight colour. After that comes the CA pass (`offset = (uv-.5)*k`, k = 0.004) and finally vignette plus grain.

**Props:** `dotPitch=5`, `dotAngle=45`, `dotBand=[0.2,0.75]`, `outlineWidth=3`, `outlineColor`, `caStrength=0.004`, `bloom`, `vignette=0.1`, `grain=0.03`. The same SVG overlays can get halftone via a `<pattern>` of circles masked by a gradient (see `sfx-starburst-pop`).

### `comic-title-pop`
**Look:** a two-tier title. First a small yellow caption tag, then a huge slanted comic logotype pops in under it with a springy overshoot. The logotype has an orange gradient fill with polka dots in its lower half, a thick black outline, offset cyan and magenta outlines (print misregistration) and a black extrude shadow.

**Elements and layout** (opening): tag box x 1095–1570, y 250–345 (25 % W × 9 % H), rotated −2°. Fill `#FEE04A`, 4 px ink border, hard shadow offset (+8,+8) in ink. Text "A DAY IN THE LIFE OF" in comic caps, 40 px. Logotype "CLAUDE" at x 960–1770, y 345–625 (42 % W × 26 % H, cap height ≈ 230 px), skewed −8°, centred right of the frame centre. Fill is a vertical gradient `#FBBC47` (top) → `#F69A45` (bottom), with `#E65855` dots (≈ 18 px pitch) in the bottom 55 %. Strokes from the outside in: ink 14 px; cyan `#1DD1D9` offset (−6,−4); magenta `#FA3D8C` offset (+6,−6); a black extrude shadow (+10,+12).

**Measured:**
- Tag at 0.60 s: scale about 0.85, then 1.08 at 0.73, then 1.0 by 0.80. Spring, about 6 frames, overshoot about 8 %.
- Logotype at 0.93 s: scale ≈ 0.2. At 1.00 it is 0.94 (cyan bbox width 846 px). At 1.13 it overshoots to 1.03 (917 px). By 1.20 it settles at 1.0 (893–896 px). About 8 frames (0.27 s) in total, mild overshoot. Anchor at the logotype centre.
- No drift during the hold. Hard-off exit (both elements vanish between 3.97 and 4.00).
- The end card reuses the same pop: "A DAY IN THE LIFE OF CLAUDE" on one line, about 63 % W × 6 % H, appears tiny at 88.90 and overshoots at 89.03.

**Remotion:** `s = spring({frame:f-start, fps:30, config:{damping:11, stiffness:220, mass:0.6}})` mapped to `scale = interpolate(s,[0,1],[0.2,1])`. Apply it after the on-twos quantise. Build the logotype in SVG: `<text>` with `paint-order: stroke`, and stack 4 copies (shadow, magenta, cyan, ink + fill). The dots are a `<pattern>` clipped by `<clipPath>` of the text and masked to the bottom half.

**Props:** `kicker`, `title`, `kickerDelay=0`, `titleDelay=10f`, `skew=-8`, `fillGradient`, `dotColor`, `offsetColors=[cyan,magenta]`, `exit='cut'|'shrink'`, `anchor`.

### `sfx-starburst-pop`
**Look:** the main comic sound effect. A jagged starburst (14–20 spikes of random length) with halftone dots, a thick ink outline and a hard ink drop shadow. On it sits slanted Bangers lettering with a gradient fill, offset cyan/magenta outlines and an ink extrude. Long spikes stick out on one side like speed spikes. It pops in, "boils" (jitters) while held, and snaps away.

**Variants seen** (burst fill / dot / text):
- white `#FFFFFF` / pink `#EE97B6` / orange gradient (BEEP! BEEP!, CRASH!, CLANK!, CLUNK, CRUNCH, THUNK! with red text)
- pink `#FF3C8A` / orange `#EA9678` / cream `#FEF4D7` → peach (BONK!, 48,213 SESSIONS!)
- orange-red / orange / cream (POP!)
- yellow `#FFE049` / orange / white with pink dots (ATTENTION!, DING-DONG, OFF TO WORK!, BZZZT!, SLAP!)
- cyan / blue / cream (POP! POP!, ZAP!)
- green `#7DFDB0` / teal / cream (RESET!, badge BEEP!)
- lavender / purple / cream (!?)

**Size and placement:** 30–45 % W wide for the main hits (BEEP! BEEP! burst ≈ 1100×400 px, top-left; BONK ≈ 800×450 px, right of centre), and 8–15 % W for swarm pops. Rotation −4° to +4°. Placed next to the sound source and never over the character's face.

**Measured timing (BEEP / BONK / POP / CRASH):**
- In: on the first render frame the scale is about 1.12 (BEEP bbox x 66 vs 115 later), then 1.0 on the next. That is a 2-render-frame "pop" (0.13 s), effectively `[1.12, 1.0]` with no grow-from-zero. When an impact frame comes first, the burst appears on the impact's second render frame (BONK 7.93, CRASH 7.17, THUNK 65.37, RESET 66.87).
- Hold: 0.5–1.1 s. **Boil:** on every render frame the burst re-jitters by ±4–8 px translation and ±1.5° rotation (seeded noise, not a smooth wobble).
- Out: one render frame at scale about 0.4–0.6 (BONK 8.53, POP 13.73, CRASH 13.57), then gone. A shot cut may end it instead.
- Typical lifetimes: BONK 0.67 s, POP 0.60 s, CRASH 0.43 s (ended by the cut).

**Remotion/SVG:**
- Burst polygon: `points = for i<N: angle = i/N·2π + jitter; r = i%2 ? rIn : rOut·rand(0.8,1.35)`.
- Shadow: the same polygon offset (+10,+10) in ink, under the shape.
- Fill plus a dot `<pattern>` (circles r = 3 px, pitch 12 px).
- Text drawn the same way as `comic-title-pop`.
- `scale = local<2 ? 1.12 : local>=dur-2 ? 0.5 : 1`, quantised on twos.
- `jitter = seededNoise(floor(local/2))`.

**Props:** `text`, `variant` (palette), `spikes=16`, `spikeLengthVar`, `speedSpikeSide`, `rotation`, `width`, `position`, `holdFrames`, `boilAmp=6`, `boilRot=1.5`, `withImpactFrame`, `withSpeedLines`.

### `sfx-text-plain`
**Look:** lettering-only SFX with no burst ("YAAAWN", "THUMP", "SCREEEE", "CLACK-CLACK", "GULP", "TAP TAP TAP", "TAPTAPTAP", "WHIRRRR", "CLICK", "THUD", "WOMP WOMP", "PAT PAT", "zzz", "SIGH…"). Bangers with a per-letter random rotation (±8°) and baseline bounce. Fills are cream→lavender `#F3E9FF`→`#B9A6E8` (THUMP, THUD, WOMP), cyan `#8BE3ED`→`#3A9FD0` (SCREEEE, TAP, CLACK), or white. Each has an ink outline of 6 px, a cyan/magenta offset and a small extrude. Size 4–10 % H cap height.

**Motion:**
- Appears at scale 1 (or 0.8→1 over 2 render frames).
- **Wobble:** each letter bobs `y = A·sin(2π(t·2.5 + i·0.15))` with A ≈ 4 px, on twos.
- Rhythmic SFX (CLACK-CLACK, PAT PAT, TAP TAP) re-trigger by alternating size between two values every 0.2–0.27 s.
- "zzz" letters rise about 6 % H and fade over 1.5 s, staggered by 0.3 s.
- Exit: shrink in one render frame, or fade over 0.2 s.

**Props:** `text`, `palette`, `letterRotateVar=8`, `bobAmp=4`, `bobHz=2.5`, `pulseEvery`, `rise` (zzz mode).

### `impact-frame`
**Look:** an anime/manga "impact frame". For 1–2 render frames the whole image (3D render and overlays below the burst) turns into a hard two-tone print, with thick tapered ink speed lines converging on the hit point. Variants:
- yellow `#F1D741` / violet-black `#120222` (BONK, 7.87–8.00)
- inverted B/W, white edges on black (CRASH, 63.10)
- black / yellow (THUNK, 65.23–65.33)
- red / maroon (LIMIT REACHED, 60.60–60.73)

The halftone stays visible in the duotone.

**Measured:** 2 render frames (0.13 s; BONK yellow coverage 28 % then 22 % as the burst lands on frame 2), then a hard return to colour. Overall luma drops from 119 to 85 during BONK. Speed lines stay for 2–4 more render frames in normal colour (see `radial-speed-lines`).

**Implementation:**
- three.js: a post pass with `uImpact` 0/1, `lum = dot(rgb, w)`, `t = smoothstep(th-0.02, th+0.02, lum)` (threshold ≈ 0.45), `out = mix(dark, light, t)` (swap for the inverted variant), keeping the halftone pass after it.
- Remotion with a video or image background: an SVG filter (`feColorMatrix` to luminance, then `feComponentTransfer` with a discrete table, then a duotone `feColorMatrix`) on an `AbsoluteFill` for those frames.

**Props:** `at`, `durationFrames=4`, `colors=[dark,light]`, `invert`, `threshold`, `focus` (speed-line centre).

### `radial-speed-lines`
**Look:** manga focus lines. Thin-to-thick tapered wedges radiate from outside the frame toward a focus point and stop short of it, leaving a clear ellipse (about 35–45 % of the frame) around the subject. Colours: ink on the BONK impact; white `#FFFFFF` on CRASH/RESET; red `#E75855` on ATTENTION/BZZZT. There are 40–70 lines, each 2–18 px wide at the outer edge and tapering to 0, with random lengths.

**Measured:** they appear with the impact frame or the burst, and are redrawn with a new random set each render frame (boil). Opacity goes 1 → 0 over about 4 render frames (0.27 s: BONK 8.00→8.27, CRASH 63.17→63.5). On ATTENTION they persist for about 0.6 s. The inner radius grows 10 % as they fade.

**SVG:** `lines.map(i => <polygon points={wedge(angle_i, rInner·rand(1,1.3), rOuter, w_i)}/>)`. Reseed with `floor(frame/2)`.

**Props:** `focus {x,y}`, `count=56`, `innerRadius` (ellipse rx, ry), `color`, `maxWidth=18`, `durationFrames=8`, `reseedEvery=2`.

### `timestamp-caption`
**Look:** a lower-left comic caption box: a bold slanted time ("7:00 AM", Bangers about 52 px) followed by a subtitle in comic caps (about 30 px). Yellow `#FEE04A` fill with a faint orange halftone in the right half, 4 px ink border, hard ink shadow (+8,+8), a thin magenta `#FA3D8C` CA line on the top edge, and a rotation of about −1.5°. The same component, top-left and larger, carries "EXP. 03 – USAGE LIMITS" (dark `#100433` with cyan `#71EFE6` text) and the big "6:00 PM" card.

**Layout:** x 80–612, y 955–1020 for a short text (box h ≈ 65 px = 6 % H; left margin 80 px = 4.2 % W; bottom margin 60 px = 5.5 % H). The width follows the text.

**Measured motion:**
- **In** (5.40): a spring from off-screen left. Successive render frames at offset −87 px, +85 px (overshoot ≈ 16 % of width), +38, +13, 0. Settled by about 5.75 (≈ 0.35 s). Spring guess `{damping:12, stiffness:180, mass:0.8}` from x = −(w+80).
- **Hold:** it can last across several cuts in the same "time chapter" (7:00 AM spans 5.4–8.75 over 3 shots).
- **Out:** ease-in slide left. Offsets per render frame 0, −130, −360, −590, then gone, about 0.2 s (`Easing.in(Easing.quad)`). It finishes ≈ 0.45 s before the next cut.
- New captions enter ≈ 0.2–0.4 s after their shot starts.

**Props:** `time`, `label`, `position='bottom-left'`, `variant` ('yellow' | 'dark-lab'), `inDelay`, `outAt`, `tilt=-1.5`, `springConfig`.

### `glitch-slice`
**Look:** a digital glitch. 4–8 horizontal bands (2–6 % H high) are displaced sideways by ±20–80 px, some tinted cyan-teal `#2FB5A8` at 40 % opacity. A strong RGB split (±6 px) runs on the text and signs, and text (banner, counter) gets letter-corruption overprints.

**Measured:** ATTENTION 43.30–43.50 (3 render frames), counter 39.6–39.8, LIMIT REACHED 60.8–61.3 (intermittent, about every other render frame), watermark 51.0 (green horizontal scanlines). New random bands every render frame.

**Remotion:** clone the layer N times inside `clipPath` rects for the bands, translate each by `noise(seed, i)`, and add a separate R/B channel offset via an SVG `feOffset` + `feBlend` (screen) stack, or a three.js post pass (`uv.x += step(band)·offset`).

**Props:** `bands=6`, `maxShift=80`, `rgbSplit=6`, `tint`, `bursts=[{start,frames}]`.

### `flash-to-cream`
**Look:** a hit flash where the frame washes out to a warm cream for a single beat (RESET!). In the whiteout variant the frame dissolves into cream across a cut (the escalator into HQ light).
- **Hit flash (66.80):** cream overlay `#EDE4D5` at about 75 % for 1 render frame (frame average `#CFC4A2`). On the next frame it drops to about 20 % with the burst on top, and is gone after 2 render frames.
- **Whiteout transition (28.53→29.10):** luma 88→105→154→205→213 (peak, nearly flat `#EDE4D5`) over 0.2 s (ease-in), cut at the peak, then 213→203→188→175→165→160 in the new shot (0.4 s ease-out). The outgoing shot's bright light source grows with it (bloom scale-up).

**Remotion:** `<AbsoluteFill style={{background:'#EDE4D5', opacity}}/>`, with opacity from `interpolate(f,[a,b,c,d],[0,1,1,0])` (easings: in-quad, then out-cubic).

**Props:** `color='#EDE4D5'`, `peakOpacity`, `inFrames=6`, `outFrames=12`, `mode` ('flash' | 'whiteout').

### `counter-ticker`
**Look:** an "ACTIVE SESSIONS" dark display panel (`#120223`, rounded corners 12 px) with a small label in cyan caps above big glowing amber digits (`#FFB347` with a 12 px glow) in a rounded sans with tabular figures and thousands separators. A small cyan sparkline sits at the left.

**Measured:** 8,7xx at 38.2 → 18,797 (38.8) → 23,210 (39.0) → 28,210 (39.2) → 33,823 (39.4) → (glitch) → 48,213 at 40.0. The rate is roughly linear, ≈ 22–25 k/s, with a hard stop at the target. The readout updates on twos. The last 0.4 s shows `glitch-slice` and garbled digits before it settles. A follow-up "48,213 SESSIONS!" pink burst confirms the number (38.8).

**Remotion:** `value = Math.round(interpolate(f,[a,b],[from,to],{easing: Easing.bezier(0.2,0,0.6,1)}))`, formatted with `toLocaleString('en-US')`. Show random digits at a glitch window just before b.

**Props:** `from`, `to`, `start`, `durationFrames`, `label`, `glitchTail=12`, `digitColor`, `glow`.

### `chat-bubble-pop`
**Look:** UI-style rounded-rect message bubbles in the cyberspace scene. The user bubble ("hi Claude!") is dark `#120223` with white text, radius 14 px, about 230×70 px, top-right of the desk. The reply ("Hi! How can I help?") is an orange `#DB8644` pill with white text, top-left.
- **User bubble:** grows from about 0.3 to 1 at its own spot over 2 render frames (34.57→34.70), with a slight overshoot.
- **Reply:** "flies out" of Claude. It starts at scale ≈ 0.3 near the TAP SFX/Claude (left) and lands on its target 2 render frames later (35.90→36.03), translating about 300 px up and right.
- **Prompt chips** (`#F28E68` fill, 70 % opacity, white text: "rename all the variables", "why is prod down??", "help me quit vim", …): they appear over the clone farm one by one (stagger about 0.13–0.27 s), drift upward about 1 % H/s, and some fade with bloom.

**Props:** `text`, `variant` ('user-dark' | 'assistant-orange' | 'chip'), `from {x,y}` (fly origin), `to`, `inFrames=4`, `overshoot=1.06`, `drift`.

### `speech-balloon-pop`
**Look:** a classic white oval balloon with a 3 px ink stroke and a tapered tail pointing to the speaker; mixed-case comic text "Morning, little guy!". Size about 260×70 px. Appears at full size in one render frame (25.90) with no tween, holds for about 1.1 s, and ends at the cut.

**Props:** `text`, `tailTo {x,y}`, `position`, `font`, `appearAt`, `popScale` (default 1, so no tween).

### `comment-chip-stagger`
**Look:** social-comment chips in the lab: white rounded rects with a 2 px ink border and dark text in a rounded sans ("did Claude get dumber?", "is it nerfed??", "it forgot what it just did"). They appear one by one about 0.8 s apart, each popping 0.9→1.0 in 2 render frames, at different positions around the subject. The verdict chip ("POSTMORTEM: 3 changes, all reverted": green `#7DFDB0` fill, dark text) drops in from above at the top last, about 0.4 s before the cut.

**Props:** `items[] {text, at, pos}`, `verdict {text, color}`, `stagger=24f`.

### `thought-bubble-sequence`
**Look:** 2–3 small lavender/purple glossy circles (r 8, 12, 18 px) rise from the character's head. Then a pale lavender rounded "cloud" pill (≈ 700×160 px, 75 % opacity, soft shadow) fades and grows in above. Icons fill it left to right, separated by small dot bullets: alarm clock, train, toast, flask, red button, moon. Then a caption line ("…and again tomorrow") types or fades in under the icons.

**Measured:** dots at 83.6–84.0. Cloud at 84.0 (fade and scale 0.9→1 over about 0.25 s). Icons at 84.2, 84.4, 84.6, 84.8, 85.0, 85.4 (≈ 0.2 s stagger), each popping 0→1.1→1 over 3 render frames. Caption at 85.6. The bubble then drifts up and out of frame (85.8–86.6, about 15 % H, ease-in) while the camera pulls back.

**Props:** `icons[]`, `caption`, `dotCount=3`, `iconStagger=6f`, `anchor` (head), `exitDrift`.

### `confetti-burst`
Multicolour paper bits (cyan `#2BCCD0`, magenta `#FA3D8C`, yellow `#FFE049`, navy, orange) plus round dots. They spawn from the RESET button with an initial upward velocity (≈ 0.9 H/s, spread ±60°), gravity about 1.2 H/s², flutter rotation (each piece flips scaleY via `cos(ωt)`), and a lifetime of about 2.5 s. Simulation updates on twos. Used for RESET! and, as a sparse dot variant, floating over the session farm (`#1DD1D9`, `#FA3D8C` and black circles drifting). **Props:** `origin`, `count=120`, `colors[]`, `velocity`, `spread`, `gravity`, `seed`.

### `character-hop-squash`
**Look:** the box robot (orange `#E57016` cube, black slit eyes, little block arms and legs) hops: anticipation, a parabolic arc, landing squash, then recovery. Arms fly up in the air, legs tuck, and the body pitches forward about 10°.

**Measured** (bed → rug, 9.33–10.40): airborne ≈ 0.6 s; apex ≈ 18 % H above the take-off point; horizontal travel ≈ 25 % W. Landing at 10.03: scaleX ≈ 1.07–1.10, scaleY ≈ 0.85–0.88, then recovery over ≈ 0.27 s to 1.0 with no visible overshoot. The eyes close to slits for 0.3 s on landing (a "blink-squint"). A "THUMP" `sfx-text-plain` lands 1 render frame after contact. The camera follows slightly (pan about 3 % W). Walk cycle: body bob ±2 % of body height at 2 steps per second, with a small side-to-side roll.

**Implementation (three.js):** squash the root group with `scale.set(1+s, 1-s·1.4, 1+s)`, where `s = 0.1·exp(-t/0.12)·cos(t·25)` after contact. Use parabolic position `y = v0·t − ½g·t²` and limb rotation keyed to the arc phase.

**Props:** `from`, `to`, `apexHeight`, `airFrames=18`, `squash=0.12`, `recoverFrames=8`, `blinkOnLand`.

### `sign-drop-swing`
**Look:** a hanging sign or banner enters from above (or from the top right) and swings to rest.
- **ATTENTION banner** (maroon `#440213` with a salmon `#FB8179` "ATTENTION / CLAUDE → LAB", 3D card): swings in from the top right at 43.17, rotated about −10° at rest, with a damped pendulum of ±4° over about 1 s.
- **LIMIT REACHED neon sign** (red neon on a dark plate, 60.67): falls from above to about y = 12 % H with a bounce (offset per render frame: −120 px, then +10 px, then 0), then flickers.
- **"LIMITS RESET ✓ / sorry about that":** the same sign in green neon `#7DFDB0` with a 20 px glow.

**Remotion:** `y = spring({..., config:{damping:9, stiffness:160}})`; `rotate = A·e^(−t/τ)·sin(2πt/0.6s)`. **Props:** `text`, `subtext`, `style` ('banner' | 'neon'), `color`, `from`, `swingAmp=4`, `flicker`.

### `watermark-pattern-reveal`
A tiled diagonal text pattern ("© CLAUDE", cream at 35 % opacity, about 12 px caps, rotated −30°) fades onto the character's body (texture blend 0→1 over about 0.4 s, 50.6–51.0). A green scanline `glitch-slice` and a "!?" lavender burst accompany it, and it fades back out by 52.4. In three.js this is a second texture layer in the material with a `uMix` uniform. **Props:** `text`, `angle`, `opacity`, `in`, `out`.

### `pop-swarm`
Many small starbursts (POP!, POP! POP!) in white, cyan and yellow appear at random positions across a crowd shot, 8–15 % W wide. A new one every 0.13–0.27 s, each living 0.3–0.5 s and using the same pop/boil/snap timing as `sfx-starburst-pop`, with smaller ones further back. It conveys "lots happening at once". **Props:** `words[]`, `palettes[]`, `rate`, `life`, `sizeRange`, `region`, `seed`.

### `data-decline-chart`
A monitor shows a "QUALITY" sparkline. It starts as a cyan sine wave, then the line colour switches to red `#E75855` and the trace redraws as a descending wobbly line (stroke-dashoffset draw-on over about 0.8 s). A gauge ("REASONING EFFORT", LOW/MEDIUM/HIGH arc in red→green) needle swings from HIGH to MEDIUM with a damped overshoot (about 0.5 s). **Props:** `values[]`, `colorFrom`, `colorTo`, `drawFrames`, `gaugeFrom`, `gaugeTo`.

### `end-card-stack`
**Look:** the closing title over the night city.
- **Kicker tag** "TOMORROW, HE DOES IT ALL AGAIN.": yellow `#FFE049` box with ink border, about 28 % W, centred at y ≈ 16 %. It drops from about 40 px above in 1 render frame plus a settle (88.43).
- **Main line** "A DAY IN THE LIFE OF CLAUDE": `comic-title-pop` style on one line, about 63 % W, fill `#FAB446` with offset outlines, y ≈ 22–28 %. Pop at 88.90: scale 0.25 → 1.0 → 1.07 → 1.0.
- **Disclaimer chip**: white with ink border, small sans, centred at y ≈ 94 %. Appears at 89.55.
- **Final fade:** the 3D scene fades to black 90.73→91.3 (luma 64→33) while all overlays stay at full opacity, ending on titles over black.

**Props:** `kicker`, `title`, `disclaimer`, `delays`, `fadeSceneOnly=true`.

## Transitions

- **Hard cuts** are the default (about 35). Shots run 0.6–6.6 s; the average is about 2.6 s.
- **`fade-from-black`** at the open: 0→0.73 s, linear, starting at about 30 % brightness (luma 35→118).
- **`impact-frame`** used as a cut accent: BONK, LIMIT REACHED, CRASH and THUNK all land as a 2-render-frame duotone *at* or right after a cut.
- **`flash-to-cream` whiteout**: escalator → HQ (28.53–29.10). The light source fills the frame, then the new scene decays from overexposed.
- **Glow push-in cut**: badge scan → cyberspace (33.2–33.6). The camera dollies into Claude's face while bloom brightens it (luma 110→144), then a hard cut to the dark purple grid.
- **Scene-only fade to black** at the end, with overlays left on top.
- Overlays (captions, bursts) never cross-fade. They snap, or slide out before the cut.

## Camera

All camera motion is three.js, on twos. Values are estimates from the frame tiles.
- **`camera-orbit-push-in`** (0–4.8): starts as a wide rooftop shot. Dolly toward the apartment block (block width 33 % → 78 % W, ≈ 2.3×), orbiting about 20° to the right and rising slightly so the balcony becomes the focus. easeInOutSine over the whole shot.
- **Slow push / drift** in most interior shots: about 3–5 % scale over the shot, linear, plus a small parallax truck (1–2 % W).
- **Follow cam**: escalator (behind and up, constant speed); hop pan in the bedroom (≈ 3 % W).
- **Train sway**: roll ±1°, vertical bob ±0.5 % H at about 1 Hz.
- **`clone-army-crane-reveal`** (36.5–38.6): starts from an eye-level desk shot. Crane up about 6× height, pull back and tilt down to a high three-quarter view of hundreds of instanced desks and clones (`InstancedMesh`; clones tinted with a few colour variants). easeInOutCubic over 2.1 s.
- **Impact shake**: on bursts with impact frames, translate ±8–12 px and rotate ±0.6° with fresh random values each render frame, decaying over about 0.3 s.
- **`crane-pull-back`** (87.5–89.3): from the balcony close-up to a wide city view (≈ 4× wider), rising. easeInOutCubic, mostly static at the start (87.0–87.5) and settled by 89.3 for the end card.
- **Dutch angles**: tilted framing of about −8° to −12° in action beats (BONK, ATTENTION).

## Library candidates

- `render-on-twos`: quantise time to every Nth frame for a hand-animated or comic cadence.
- `comic-halftone-postfx`: toon outline, halftone screen, chromatic aberration, bloom, vignette and grain post stack for a 3D scene.
- `comic-title-pop`: two-tier kicker tag and big offset-print logotype that spring in.
- `sfx-starburst-pop`: parameterised comic sound-effect starburst with pop-in, boil and snap-out.
- `sfx-text-plain`: lettering-only comic SFX with per-letter wobble, pulse or rise.
- `impact-frame`: one or two frames of duotone or inverted print with speed lines on a hit.
- `radial-speed-lines`: manga focus lines toward a point, reseeded each frame and faded.
- `timestamp-caption`: lower-left comic caption box with spring slide-in and ease-in slide-out.
- `glitch-slice`: horizontal band displacement with RGB split for digital errors.
- `flash-to-cream`: hit flash, or a whiteout dip-to-colour across a cut.
- `counter-ticker`: glowing numeric counter rolling to a target with a glitch tail.
- `chat-bubble-pop`: UI message bubbles and chips that pop in place or fly from a source.
- `speech-balloon-pop`: classic comic speech balloon with a tail, snapping on.
- `comment-chip-stagger`: staggered comment chips around a subject ending in a verdict chip.
- `thought-bubble-sequence`: rising dots, a cloud, an icon stagger and a caption recap.
- `confetti-burst`: seeded paper-and-dot confetti physics burst.
- `character-hop-squash`: parabolic hop with landing squash and stretch for a box character.
- `sign-drop-swing`: banner or neon sign dropping in with a damped swing or bounce.
- `watermark-pattern-reveal`: tiled text pattern fading onto a surface.
- `pop-swarm`: many small staggered SFX bursts across a crowd shot.
- `data-decline-chart`: sparkline recolour and redraw plus a gauge needle swing.
- `end-card-stack`: kicker, title and disclaimer, with a scene-only fade to black.
- `clone-army-crane-reveal`: crane-up camera revealing an instanced crowd.
- `camera-orbit-push-in`: establishing dolly with orbit onto a hero building.
