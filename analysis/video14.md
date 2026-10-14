# video14 — "Walk Through Art History" side-scroller

## Overview

| Property | Value |
|---|---|
| Resolution | 1920 x 1080 (16:9) |
| FPS | 60 (constant) |
| Duration | 127.68 s (7661 frames) |
| Audio | none |
| Scene cuts | **none.** The whole video is one continuous world scroll. Scene changes are spatial seams that scroll past. |

**Story:** A small chibi explorer (white bucket hat, round black glasses, white tee, shorts, white clogs) walks left-to-right through 24 "eras" of art history laid end to end on one long horizontal strip. The eras run from a 15000 BC cave wall through Egyptian murals, Greek black-figure pottery, Dunhuang, Song ink landscape, a Gothic manuscript, Renaissance, Rembrandt, Hokusai, Seurat, Van Gogh, Munch, Monet, Klimt, Cubism, Dalí, Hopper, Warhol, Magritte, a Kirby comic, 8-bit pixel art, a Ghibli-style rainy bus stop and vaporwave, ending in a 2026 flat-vector bedroom. Each era is joined to the next by a torn or decorated vertical seam. When the seam crosses the character, he is redrawn in that era's art style with a confetti burst, and a year/title badge in the top-right updates. In most eras he pauses for about 1 s for a small gag. At the end he sits at a desk, the camera pushes into his monitor, and a 5x5 grid of thumbnails, one per era, pops in as a recap.

**Art style:** Each era imitates its source painting style (paper and plaster grain, pointillist dots, impasto brush strokes, halftone, pixel art, synthwave neon grid, flat vector). There is a constant global paper-grain/noise overlay. The character is one rig re-skinned per era: same silhouette, different fill and line treatment.

**Palette (dominant per era, sampled with PIL median-cut)**

| Era | Key colours |
|---|---|
| Cave 15000 BC | #342013 floor, #aa7c54 / #c09d78 / #dabb97 rock, #895839 bison, hand-stencil red ≈ #c8402a |
| Egypt 1350 BC | #d8c499 papyrus, #2f5d87 Nile blue, frieze red/green/blue/yellow, #463c55 outlines |
| Greek 540 BC | #db6930 terracotta, #1b100a black-figure, #69341e |
| Dunhuang 720 | #693c30 oxblood wall, #ad765b, #697b7b teal mountains, #b9c0aa |
| Song ink 1000 | #e0d3b4 / #cdbea1 paper, #827867 ink wash |
| Gothic MS 1300 | #c6a364 gold leaf, #53445e, #e3d2b1 vellum, lapis #2a3f9a, rubric red #c0392b |
| Renaissance 1503 | #878974 / #a5a893 sfumato hills, #4b3720 / #6c4f2d floor |
| Rembrandt 1642 | #0c0501 / #090301 blacks, #5c4228, candle glow #f0b860 |
| Hokusai 1831 | #283d66 Prussian blue, #dfc28c / #e2cd92 sand, #697989 |
| Seurat 1884 | #b9c559 lawn, #2f7167, #324067, #e5e4cb |
| Van Gogh 1889 | #2b4578 / #1f3568 sky, #a1915c, star yellow #f2d45c |
| Munch 1893 | #ad6a3c, #cb7e3b, #c4371e, #eaa84b sky, #453f45 fjord |
| Monet 1899 | #466656, #6d9762, #618462, #b5c3a2 |
| Klimt 1907 | #876a2d / #9f7c3c gold, #1c331e / #2c4528 meadow |
| Cubism 1912 | #31261c, #4e3d2d, #8c8478, #c0b6a4 |
| Dalí 1931 | #5c432e, #b58850 sand, #6b88ac sky |
| Hopper 1942 | #241b18, #29352d / #1a2421 street, #cbc392 diner light |
| Warhol 1962 | #f6d32b yellow, #fcf5d6, #713c4c, panels lime/magenta/cyan/orange, red stripe #e3262b |
| Magritte 1964 | #968d7e, #bcc4ca sky, #626663 |
| Kirby 1966 | #141b49, #562e8b, #364090, #ddd398 |
| 8-bit 1980s | #0b0822, #351f69, #170e3f, ground #3a486a, grass line #3fb27f |
| Ghibli 1988 | #39435b, #587f65, #dadbe6, #233254 |
| Vaporwave 2011 | #080112, #541957, #270537, neon magenta #ff3df0, sun #ffb347 to #ff3d7f |
| 2026 room | #eee0c9 / #f6efe3 wall, #ebdbce, rug #d1e5e1, pink blob #fae0d6, monitor bezel #3f4175, screen off #1b1d38, mug #e66359 |

**Badge:** fill ≈ #f8f3ea at about 85% opacity. Text #1f2018.

**Fonts**
- Badge year: geometric heavy sans (Poppins ExtraBold or Montserrat 800), right-aligned, cap height ≈ 40 px (3.7% of H).
- Badge subtitle: CJK sans (Noto Sans SC Medium), ≈ 24–26 px (2.3% of H), right-aligned. Format: "Artist《Work》" or a style name.
- In-world text uses era fonts: Greek-style caps ("NIKA", "XAIPE KAI ΠΙΕΙ"), blackletter for the manuscript, comic italic caps ("MEANWHILE, IN THE COSMOS...", "SUDDENLY...!", "BAM!", "ZAP!", "POW!"), a pixel font for the 8-bit HUD ("HUASHU 002000 x07"), a wide-tracked chrome "AESTHETIC" and VHS mono timestamp "OCT. 04 2011 23:59:31:05".

**Layout**
- The character is pinned at screen x ≈ 720 px (37.5% W). He is ≈ 300 px tall (28% H), with feet on a baseline at y ≈ 750 px (≈ 70% H).
- The badge is top-right: about x 1595–1890, y 50–165. That is a right margin of ≈ 30 px (1.6%), a top margin of ≈ 50 px (4.6%), corner radius ≈ 14 px and padding ≈ 25 px.

## Timeline

Badge-change times were measured from text-mask changes in the badge region. Each "stop" is when the world scroll velocity is 0.

| # | Start–End (s) | Era (badge) | On screen | What moves / gag (scroll stop) | Into next |
|---|---|---|---|---|---|
| 1 | 0.0–4.4 | 15000 BC 洞穴壁画 | Plaster cave wall with bison/horses in ochre, ladder glyphs, red hand stencils, dotted red lines, dark pebble floor | Glowing ember motes drift. Stop 1.5–2.4: he presses a palm to the wall and a red spray hand stencil blooms. Floor pebbles scroll. | Egyptian seam (multicolour tile border, wavy) |
| 2 | 4.4–9.5 | 1350 BC 古埃及壁画 | Hieroglyph columns, winged sun disk, geese, papyrus thicket with birds, amphorae, offering tables, zig-zag Nile with fish, colour frieze top and bottom | Fish swim, birds flit. Stop 6.4–7.4: a scarab rolls a red dung ball in; he crouches, leaps over it in a long arc, lands and turns to face camera. He has Egyptian skin tone and flat outline. | Greek seam (black jagged edge) |
| 3 | 9.5–14.5 | 540 BC 古希腊黑绘陶瓶 | Terracotta field, black-figure runners, ship with sail, dolphins, amphorae, meander key band, spike band | He becomes a black-figure silhouette. Stop ≈ 11.5–12.6: runner pose and crouch; an octopus or bird pops on the ship. | Dunhuang seam (teal wavy stripe) |
| 4 | 14.5–19.8 | 720 敦煌莫高窟·飞天 | Oxblood mural, flying apsaras with ribbons, clouds, teal mountains, pavilion, lotus pond, floral tile band | Ribbons flutter. Stop 16.4–17.4: an apsaras ribbon wraps around him. Petals float. | Torn rice-paper edge |
| 5 | 19.8–24.65 | 1000 北宋山水 | Ink-wash cliffs, mist bands, pines, boat, waterfall | He becomes black line-art. A crow flies across. Stop 21.4–22.4. Mist drifts. | Manuscript seam (coloured tile ribbon) |
| 6 | 24.65–30.0 | 1300 哥特手抄本 | Vellum page, gold-leaf illuminated "H", starry lapis arch, blackletter Latin, flower vine border, rabbit, snail-knight drollery | Stop 27.2–28.1: he touches the gold initial and a bird flutters out. The vine border flowers bob. | Torn paper edge |
| 7 | 30.0–34.95 | 1503 达·芬奇·文艺复兴 | Loggia with columns, Mona Lisa on easel, Vitruvian sketch, sfumato landscape | Loose sketch papers fall and tumble. Stop 31.4–32.9: a da Vinci ornithopter flaps overhead. | Black torn edge into darkness |
| 8 | 34.95–40.7 | 1642 伦勃朗·明暗法 | Dark hall, Night Watch figures, window light shaft | God-ray shaft with dust motes. Stop 36.7–38.7: he picks up a candle and a warm light pool follows the candle and flickers. | White scalloped-dot edge |
| 9 | 40.7–45.3 | 1831 葛饰北斋 | Great Wave, Fuji, pines, boats, sand | Wave claws curl, foam dots spray. Stop 42.8–43.3: the wave crashes over him and he ducks. | Pointillist dotted edge |
| 10 | 45.3–49.95 | 1884 修拉 | Dotted lawn, parasol figures, river, trees | Everything is made of dots, including him. Stop 47.2–47.9. | Impasto stroke edge |
| 11 | 49.95–54.65 | 1889 梵高《星月夜》 | Swirling sky, haloed stars, cypress, village | Star halos pulse. Stop 51.8–52.6: he flicks a star upward with a sparkle trail. | Orange impasto edge |
| 12 | 54.65–60.6 | 1893 蒙克《呐喊》 | Flame-stroke sky, blue fjord, railing, screaming figure | Stop 56.8–58.6: wind blows his hat off. The hat flies up and he does a scream pose with hands on cheeks. The hat drops back. | Torn green edge |
| 13 | 60.6–66.5 | 1899 莫奈 | Willow wall, arched green Japanese bridge, lily pond | His y follows the bridge arc: up onto the apex, wave, down. Stop 61.9–63.9. A ripple ring forms when he steps down. | Torn gold edge |
| 14 | 66.5–72.0 | 1907 克里姆特 | Gold-leaf wall, spiral tree of life, flower meadow, checker band | His outfit turns into gold mosaic. Gold flecks float. Stop 68.8–70.0: a Horus-eye ornament spins above his head. | Faceted (shattered) edge |
| 15 | 72.0–77.4 | 1912 立体主义 | Brown and grey triangle shards, "CAFE", guitar, newspaper "JOU" | A fractured mirror shows him in 3 facets. Stop 74.3–75.4. | Torn sand edge |
| 16 | 77.4–83.05 | 1931 达利 | Desert beach, melting clocks, dead tree, rocks | Stop 79.8–81.0: he picks up a melting clock and it droops. | Dark wavy edge |
| 17 | 83.05–88.8 | 1942 霍珀《夜鹰》 | Brick building, lit diner window "DINER", green street | Muted night grade. Stop 85.8–86.9: he raises a cup/paper towards the diner. | Wavy red-black comic edge |
| 18 | 88.8–93.95 | 1962 沃霍尔·波普 | Halftone wall, Campbell cans, ribbons, 2x2 Warhol portrait panel of HIM, thought bubble "...", "ZAP!" | Panel colours and poses cycle. Stop 90.8–91.9: he poses (wave, arms crossed, arms up) and "POW!" pops. | Torn grey edge |
| 19 | 93.95–99.3 | 1964 马格利特《人子》 | Raining bowler-hat men, clouds, sea wall, streetlamp | Stop 96.3–97.4: a green apple floats in front of his face. | Comic wavy edge |
| 20 | 99.3–104.45 | 1966 Kirby 漫画 | Cosmic space highway, planets, Kirby crackle, captions | Stop 101.5–102.4: a robot drops in, ground ring shockwave, "BAM!", he kicks, the robot breaks apart and flies off, thumbs-up. | Pixel edge |
| 21 | 104.45–109.75 | 1980s 8-bit | Night pixel forest, brick ground, floating blocks, moon, HUD | He is pixelated. Stop 106.6–107.6: he jumps, hits a "?" block, a coin pops, x07 becomes x08, "100" floats up, then 3 celebratory hops. | Watercolour torn edge |
| 22 | 109.75–115.2 | 1988 吉卜力雨夜车站 | Rain, puddles, bus-stop sign, streetlamp, tree, clouds | Diagonal rain streaks and puddle ripples. Stop 111.8–113.0: he holds a big leaf as an umbrella (Totoro nod). | Neon magenta glitch edge |
| 23 | 115.2–119.4 | 2011 蒸汽波 | Synthwave grid floor, striped sun, palms, Greek busts, "AESTHETIC", Windows-95 loading dialog, VHS date | Chromatic aberration on him. 116.5–118.3: he hops on a skateboard and scroll speed boosts to ≈1140 px/s, decelerates to 0, and resumes. | Pastel torn edge |
| 24 | 119.4–127.68 | 2026 回到2026·我的书桌 | Flat pastel room, window, monstera plants, lamp, desk, monitor, mug, speckled pink blob | Stops at 121.3, sits, takes off hat. Camera push 1 (121.7–122.9). Monitor powers on (≈123.0–123.25). 23 thumbnails pop in (123.28–124.72). Camera push 2 into monitor (125.25–126.35). Hold to end. | end (hard stop on last frame) |

Average era length is ≈ 5.0–5.9 s. The rhythm repeats every era: walk about 3 s, ease to a stop, gag about 1 s, ease back up, walk, seam passes the character.

## Motion techniques

### 1. `pinned-walker-world-scroll`
**Looks like:** A side-scrolling platformer camera. The hero stays at a fixed screen x and walks in place while the whole world strip slides right-to-left. It stops and starts with eased velocity.

**Elements:**
- One very wide world container (all eras placed end to end).
- The character sprite/rig, on its own layer above the world.
- The HUD badge, fixed to the screen.

**Parameters (measured by frame-to-frame SAD shift)**
- Cruise speed: **≈ 560 px/s at 1920 px width**. That is 9.3 px/frame at 60 fps, or 0.29 frame-widths per second. Expose it as `speed`.
- Deceleration to 0 takes ≈ 0.75 s. The velocity profile drops fast and then has a long tail (540 → 480 → 360 → 300 → 180 → 120 → 120 → 120 → 60 → 60 → 0 px/s at 15 fps samples). That is an ease-out on position, approx. `cubic-bezier(0.15, 0.6, 0.3, 1)`.
- Hold at 0: ≈ 0.5–1.5 s (gag time). It is longer for big gags: Rembrandt 2.0 s, Munch 1.8 s, Monet 2.0 s.
- Acceleration back to cruise takes ≈ 0.4 s (0 → 60 → 120 → 180 → 300 → 420 → 480 → 540). That is a near-linear velocity ramp, so an ease-in-quad on position.
- Boost variant (skateboard): 0.25 s ramp to 1140 px/s, then decay over ≈ 1.3 s through a 780 px/s plateau to 0, then re-accelerate to 540.

**Implementation**
1. Do not tween position directly. Define a velocity keyframe list `[{t, v}]` and integrate it so that stops land exactly.
   ```ts
   // precompute cumulative offset per frame
   const vel = (t) => piecewise velocity with eased ramps
   worldX[f] = worldX[f-1] + vel(f/fps)/fps   // memoise in useMemo
   <div style={{transform:`translateX(${-worldX[frame]}px)`}}>{eras}</div>
   ```
2. Simpler alternative: build a `stops: {atWorldX, holdSec}[]` list and generate the velocity profile automatically. Use decel 0.75 s with an ease-out curve, hold, then accel 0.4 s with ease-in.
3. The character plays a walk cycle while `v > 0`. Blend to an idle or gag pose when `v ≈ 0`. Walk cycle ≈ 0.35–0.4 s per full cycle (2 steps), with a body bob of ≈ 1.5% of height (approximate; the legs are not ground-locked, so a small amount of slide is fine).

**Props:** `speed`, `stops[]`, `decelSec`, `accelSec`, `heroX` (default 0.375 W), `baselineY` (0.70 H).

### 2. `torn-seam-era-wipe`
**Looks like:** Two completely different painted worlds meet at a vertical, irregular, decorated edge. The edge is part of the world and scrolls in from the right at world speed. It is not a screen-space wipe.

**Elements:**
- An era A panel and an era B panel, each with its own background.
- A seam path: a vertical polyline with noise displacement.
- A seam decoration stroke matching the incoming era, for example:
  - Egyptian red/blue/green/yellow tile strip about 20 px wide, gently wavy (amplitude ≈ 25 px, wavelength ≈ 180 px)
  - Greek black jagged teeth
  - Dunhuang teal 6 px wavy line
  - Song plain torn rice paper with a lighter fibrous rim
  - Hokusai white scallop dots (circles ≈ 10 px, spaced 14 px)
  - Seurat dot fringe
  - Van Gogh / Munch impasto stroke fringe
  - Cubist shard teeth
  - comic black wavy line plus a red line
  - pixel stair-step
  - vaporwave magenta neon glow line (blur 8 px)

**Parameters**
- Edge jaggedness: two-octave noise. Low frequency has amplitude ≈ 20–30 px over a 150–250 px wavelength. High frequency has amplitude ≈ 4–8 px over a 10–20 px wavelength.
- A seam crosses the full screen in 1920 / 560 ≈ 3.4 s.
- Era B content is fully live (animating) right of the seam even before the crossing.

**Implementation (SVG)**
1. Each era is a `<g>` clipped by a `clipPath` polygon: left edge = seam(prevEra), right edge = seam(thisEra).
2. Generate the seam as `points = for y in 0..H step 6: x = seamX + fbm(y*0.006, seed)*25 + fbm(y*0.06, seed2)*6`.
3. Draw the decoration as a `<path>` stroke along the same points, or as repeated glyphs (dots, tiles) placed along it.
4. Add a faint inner shadow on the B side for a paper-cut feel: blurred dark copy of the path with 15% opacity, offset 3 px.
5. Seeded noise via `simplex-noise` or a hash function, with the seed per seam.

**Props:** `edgeStyle` (enum), `edgeColors[]`, `amplitude`, `roughness`, `seed`.

### 3. `seam-split-character-restyle` (+ `style-swap-confetti-burst`)
**Looks like:** As the seam slides across the hero, he is split vertically. The part left of the seam is still in the old style (for example crayon-textured cave kid). The part right of the seam is already in the new style (for example Egyptian flat colours and darker skin). When the seam reaches his centre, a burst of confetti dashes in the new era's palette sprays out around him, and the badge swaps.

**Parameters**
- The hero spans ≈ 250 px, so the split phase lasts ≈ 0.45 s at 560 px/s.
- Confetti:
  - 30–40 rounded capsules, ≈ 8 x 20 px, colours sampled from the new era palette (Egyptian red/blue/green/yellow; Song ink black/red; and so on).
  - They spawn on a ring of radius 60–120 px around the hero's torso centre.
  - Each gets a radial velocity of 250–500 px/s plus an upward bias of −150 px/s and gravity of +600 px/s².
  - Random spin is ±360°/s.
  - Lifetime 0.6–0.8 s, with opacity 1 → 0 over the last 50%. Scale stays at 1.
  - Particles live in world space, so they drift left with the scroll.

**Implementation**
1. Render the hero twice: `<Hero skin={A} clip=leftOf(seam)/>` and `<Hero skin={B} clip=rightOf(seam)/>`. Use the same clip path as the seam, translated into hero space.
2. Skins are style variants of one rig: fill palette, outline width/colour, texture filter. Examples:
   - crayon grain: `feTurbulence` + displacement
   - pointillism: dot pattern fill
   - black-figure: solid #1b100a
   - pixel: render at 1/6 scale with `image-rendering: pixelated`
   - vaporwave: RGB-split by duplicating with `mix-blend-mode: screen` at ±4 px
3. Confetti: seeded RNG per seam. Compute positions analytically `p = p0 + v*t + 0.5*g*t²` from `frame - burstFrame`.

**Props:** `skins[]`, `confettiCount`, `confettiColors`, `burstRadius`, `life`.

### 4. `era-badge-crossfade`
**Looks like:** A semi-transparent rounded card at the top-right, with a bold year and a small CJK subtitle under it.

**Change behaviour:** When the seam reaches the hero, the old text fades out and the new text fades in. It is a crossfade of ≈ 0.3 s. The card stays put; its width animates to fit the new subtitle over the same 0.3 s with ease-in-out.

**Specs:**
- Card: rgba(250,246,238,0.85), radius 14, padding 22–25 px.
- Year: 44–48 px weight 800 #1f2018, right-aligned.
- Subtitle: 24 px weight 500, line gap 8 px.

**Props:** `year`, `subtitle`, `font`, `bg`, `opacity`.

### 5. `chibi-hero-rig`
- A single vector character built from parts: head with bucket hat, glasses, body, two arms, two legs, clogs.
- **Walk cycle:**
  - legs swing ±25° from the hip, opposite arms ±20°
  - head bob 4 px at twice the cycle frequency
  - hat lags the head by 1 frame
- **Poses used by gags:** wave, palm press, crouch (anticipation 0.1 s), jump arc, scream (hands on cheeks), arms crossed, arms up, kick, thumbs-up, sit, take off hat.
- **Jump (scarab and 8-bit):**
  - 0.1 s squash crouch (scaleY 0.92)
  - airborne 0.55–0.7 s on a parabola, peak height ≈ 200–250 px (≈ 20% H)
  - a shadow ellipse on the ground scales to 60% at the apex
  - landing squash 0.08 s
- Expose `pose`, `skin`, `facing` (side or front). The front-facing turn is a 2-frame swap.

### 6. `gag-beat` (per-era micro-interaction template)
Every era uses the same structure: decelerate, hold, then a 0.8–2.0 s interaction prop animation, then accelerate. These are reusable mini-components:

- **`spray-hand-stencil` (cave)**
  - Arm reaches to the wall over 0.3 s.
  - On contact, ≈ 150 red dots (#c8402a, r 1–4 px) scatter in a Gaussian halo σ ≈ 40 px around a hand silhouette.
  - Dots fade in over 0.25 s.
  - The palm shape is left as a negative (unpainted) mask.
- **`rolling-obstacle-jump` (Egypt)**
  - A scarab with a red polka-dot ball enters from the right at world speed plus 150 px/s.
  - Ball rotation = distance / r.
  - The hero jumps (see rig) as the ball passes under him.
- **`hat-blown-away` (Munch)**
  - Wind gust: a few curved white swoosh strokes drawn on.
  - The hat detaches and flies up and back along a bezier path (≈ 300 px up), rotating 540° over 0.9 s.
  - It hangs, then falls back onto the head with a squash at 1.6 s.
- **`star-flick-sparkle` (Van Gogh)**
  - The hand flicks and a 4-point star sprite with a golden dashed trail arcs up to the sky over 0.5 s.
  - Star halos in the sky pulse with radius ±6%, period ≈ 1.2 s.
- **`comic-impact-burst` (Kirby / Warhol)**
  - A jagged starburst polygon (12–16 points, alternating radii 1 : 0.65) in yellow #f6d32b with a red outline. Text "BAM!" / "POW!" / "ZAP!" in italic heavy comic caps, red with a black stroke.
  - Pop scale 0 → 1.15 → 1 over 0.25 s (spring, damping ≈ 10), with rotation −8° → 0.
  - Paired with a ground shockwave ellipse: stroke yellow, rx 0 → 450 px, ry = rx × 0.18, opacity 1 → 0 over 0.6 s.
- **`pop-art-panel-cycle` (Warhol)**
  - A 2x2 grid of hero portraits.
  - Every ≈ 0.14 s (≈ 8–9 frames at 60 fps), each cell's background colour rotates through [#9bd33a lime, #e83e8c magenta, #2bbbad cyan, #f28c28 orange] and the pose changes.
  - The thought bubble "..." animates its dots 1 → 2 → 3 at 0.25 s each.
- **`pixel-block-bump-coin` (8-bit)**
  - Jump. The "?" block (star icon) turns into a grey used block.
  - A coin sprite rises 100 px over 0.3 s with ease-out and vanishes.
  - HUD counter "x07" changes to "x08" and the score changes 002000 → 002100 (hard swap).
  - A "100" label floats up 30 px and fades over 0.8 s.
  - Then 3 small hops (≈ 0.25 s each, 40 px high, arms up).
  - All movement snaps to a 6 px grid.
- **`skateboard-speed-boost` (vaporwave)**
  - The hero steps onto the board, the world speed doubles (see `pinned-walker-world-scroll`), and the hero gets an RGB-split ghost trail (2 copies at −12 / −24 px, 40% / 20% opacity).
- **`bridge-arc-climb` (Monet)**
  - The hero's y follows the bridge curve `y = baseline − 120·sin(π·u)` while the world scrolls.
  - On landing, a water ripple ring: 2 ellipses that scale up and fade out.

### 7. Era ambience layers (procedural, reusable)
- **`ember-motes`**
  - 20–30 soft orange dots (r 3–6 px, glow blur 6) rising at 10–25 px/s.
  - Horizontal sine sway: amplitude 8 px, period 3 s.
  - Twinkle: opacity 0.4–1.
- **`falling-papers`**
  - 6–8 cream rectangles (40 x 55 px) falling at 60–100 px/s.
  - rotateZ oscillates ±25° (1.5 s period); a scaleX "flip" cosine fakes 3D tumble.
- **`light-shaft-dust` (chiaroscuro)**
  - A diagonal trapezoid with a linear gradient from rgba(255,220,150,0.35) to 0, blend mode screen.
  - Dust motes inside drift along the beam.
  - A candle light pool is a radial gradient (r ≈ 300 px) multiplied over the dark scene. Flicker: radius ±4% and opacity ±8% driven by 2 summed sines (7 Hz and 11 Hz) plus noise.
- **`pointillism-fill`**
  - Fill shapes with Poisson-disc dots (r 3–5 px, spacing 7 px).
  - Colour = base colour with ±15% HSL jitter, plus 10% complementary dots.
  - For "boiling" (shimmer), re-seed jitter every 6 frames.
- **`impasto-stroke-field` (Van Gogh / Munch skies)**
  - Many short rounded strokes (len 18–40 px, width 5–8 px) oriented along a flow field: swirl `angle = atan2(dy,dx)+π/2` around vortex centres, or horizontal sine bands for Munch.
  - 2–3 tone palette per band, with a darker outline variant.
  - Animate by slowly rotating the vortex flow, about 6°/s, or by advecting stroke phase.
- **`halftone-bg`**
  - SVG `<pattern>` of dots (blue #3a5bd9 on white, 10 px pitch).
  - Bottom band: orange dots on yellow.
- **`synthwave-grid`**
  - Perspective grid: horizontal lines spaced by `y = horizon + k/(z)` scrolling toward the viewer (z decreases), plus vertical lines converging at a vanishing point. Colour #ff3df0 with glow.
  - Striped sunset sun: circle gradient #ffb347 → #ff3d7f, masked by horizontal bars that get thicker toward the bottom.
- **`rain-streaks`**
  - 150 diagonal 1–2 px lines (length 30–60 px, angle ≈ 75°), speed 1400 px/s, opacity 0.3–0.6.
  - Puddles get expanding ripple ellipses.
- **`pixel-starfield`**
  - Square 2–4 px stars blinking on and off at random 0.5–1.5 s intervals.
- **`gold-fleck-float` (Klimt)**
  - Small gold rectangles and circles (#e2b84a) drifting up and rotating, with sparkle scale pulses.

### 8. `monitor-push-thumbnail-recap` (finale)
**Looks like:**
1. The hero, seated at a desk, takes his hat off.
2. The camera eases in.
3. The dark monitor powers on to white.
4. Thumbnails of every era pop into a grid one by one.
5. The camera dives in until the monitor fills the frame.

**Measured timings**

| Beat | Time (s) | Details |
|---|---|---|
| Scroll stops | 121.3 | |
| Hat off / sit | 121.3–121.7 | |
| **Push 1** | 121.7 → 122.9 (1.2 s) | Scale 1 → ≈ 1.4, ease-in-out (≈ `cubic-bezier(0.45,0,0.2,1)`). Focus point ≈ the desk/monitor area. |
| **Power-on** | 123.0 → 123.25 | Screen fill #1b1d38 → #5a5c6e → #9a9aa2 → #cfcdca → #ebe7e2 → #fdf9f0 → #ffffff (≈ 0.2–0.25 s, ease-out). Optional: 3 short yellow "spark" tick lines at the monitor corner. |
| **Thumbnails** | 123.28 → 124.72 | 23 items in a 5-column grid (rows 5,5,5,5,3), row-major. **Stagger = 4 frames at 60 fps = 66.7 ms.** Each pops scale 0.3 → 1.08 → 1.0 in ≈ 150 ms (spring, stiffness ≈ 300, damping ≈ 18). |
| **Push 2** | 125.25 → 126.35 (1.1 s) | Scale ×≈ 2.95 more, so the monitor bezel goes from 520 px to 1534 px wide. Ease-in-out with slow start, fast middle, soft settle. Final view: bezel nearly fills the frame (x 192–1726, y 18 to bottom), mug at bottom-right, speckled pink backdrop around it. |
| Hold | 126.35 → 127.68 | Ends on that frame. |

Grid geometry in screen space (before push 2): cell pitch 88.7 x 49.7 px, cell 84 x 45 px, origin (925, 362), each cell with a 2 px dark border.

**Implementation**
```tsx
const camScale = interpolate(f,[p1s,p1e],[1,1.4],{easing:Easing.bezier(.45,0,.2,1),extrapolate:'clamp'})
               * interpolate(f,[p2s,p2e],[1,2.95],{easing:Easing.bezier(.45,0,.2,1),extrapolate:'clamp'});
// transform-origin = monitor centre
thumbs.map((t,i)=>{ const s = spring({frame:f-(gridStart+i*4), fps, config:{stiffness:300,damping:18}}); ... scale(0.3+0.7*s) })
```
The thumbnails can literally be rendered with `<Freeze>` snapshots of each era composition at its midpoint.

**Props:** `items[]`, `cols`, `stagger`, `pushScales`, `screenOnColors`.

### 9. `speckle-grain-overlay`
A global paper/print grain across the whole frame.
- `feTurbulence` (baseFrequency ≈ 0.9, numOctaves 2) as an alpha mask of small specks.
- Blend overlay at 6–10% opacity.
- Re-seed every 2–3 frames for a light boil, or keep it static for paper.

The 2026 room additionally uses large flat blobs (pink, lilac) filled with sparse darker specks (dots r 1–2 px, density ≈ 0.002/px²) as a "riso" texture.

## Transitions
- **Era to era:** world-space torn or decorated seams scrolling at 560 px/s (`torn-seam-era-wipe`). Each seam crosses the full frame in ≈ 3.4 s. Hero style split ≈ 0.45 s. Confetti ≈ 0.7 s. Badge crossfade ≈ 0.3 s at the moment the seam passes the hero centre.
- **No cuts, fades or dissolves** anywhere in the video.
- **Finale:** two eased camera pushes (scale) into the monitor. It ends on a hold; there is no fade to black.

## Camera
- **Horizontal truck:** 560 px/s cruise with eased stops (decel 0.75 s, accel 0.4 s) about once per era. One boost segment reaches ≈ 1140 px/s.
- **No vertical camera motion.** Vertical movement comes from the hero (jumps, bridge arc).
- **Parallax:** most eras are effectively single-plane flat murals scrolling 1:1, matching the "walking along a painted wall" conceit. A few eras show mild depth layering: floor pebbles and rain move at the same speed, the light shaft is screen-fixed in the Rembrandt era, and sky elements in the vaporwave era (sun) move slower (≈ 0.3x). For a rebuild, use 1–2 layers per era (backdrop 1.0x, optional far sky 0.3x).
- **Finale:** two zoom pushes (1 → 1.4 → ≈ 4.1 total), ease-in-out, anchored on the monitor.

## Library candidates
- `pinned-walker-world-scroll`: any timeline or "journey" explainer where a mascot walks past milestones with eased stop-and-go.
- `torn-seam-era-wipe`: a spatial transition between two styled worlds or chapters (before/after, then/now, product versions).
- `seam-split-character-restyle`: show one subject converting between styles, brands or eras as a boundary passes over it.
- `style-swap-confetti-burst`: a celebratory particle accent when an element changes state or levels up.
- `era-badge-crossfade`: a chapter or location HUD label (year, step number, place) with a smooth swap.
- `chibi-hero-rig`: a reusable mascot rig with walk, jump, crouch, wave and celebrate poses plus skin variants.
- `gag-beat`: a template for brief prop interactions during a pause (comic beats in explainers).
- `spray-hand-stencil`: an organic "stamp" or reveal of a silhouette via a spray-paint dot halo.
- `comic-impact-burst`: emphasis callouts (BAM/POW/NEW!) with spring pop and a ground shockwave ring.
- `pop-art-panel-cycle`: a rhythmic multi-panel colour-swap grid for avatars or product variants.
- `pixel-block-bump-coin`: gamified reward feedback (score increment, coin pop, floating +100).
- `light-shaft-dust` / `ember-motes` / `falling-papers` / `rain-streaks` / `gold-fleck-float`: drop-in ambience particle layers.
- `pointillism-fill` / `impasto-stroke-field` / `halftone-bg` / `synthwave-grid`: procedural art-style fills for themed backgrounds.
- `monitor-push-thumbnail-recap`: an outro recap that zooms into a device screen while a grid of scene thumbnails pops in staggered.
- `speckle-grain-overlay`: a global print or paper texture to unify flat vector scenes.
