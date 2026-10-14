# video22 — "ballpoint gambit" (hand-drawn chess game trailer)

## Overview

| Property | Value |
|---|---|
| Resolution | 1920×1080, **60 fps**, 73.62 s, no audio |
| Format | Full-frame 16:9; no letterbox |

**Story.** A trailer for a chess game drawn entirely in ballpoint pen and coloured pencil on cream paper. It opens on fast gameplay snippets. The title is then handwritten, un-written, and replaced by a board that draws itself line by line, with every creature piece doodled into place. The rest intercuts quick, push-in gameplay shots with handwritten caption cards ("every piece is a creature", "captures get personal", "the opera game, paris 1858", "a queen sacrifice…"). It ends on "checkmate!" / "you win!" and a pull-back, then fades to the handwritten logo plus the tagline "chess, drawn in ballpoint pen".

**Art style.**
- Paper-and-pen illustration with a slightly 3D presentation.
- The board is a perspective plane: a trapezoid, wider at the bottom, viewed from about 35–45° above.
- Wobbly monoline pen strokes and coloured-pencil hatching (green diagonal hatch on dark squares).
- Cute kawaii creature pieces: the pieces are mushrooms, owl, bee, snail, deer, rook-stump, blobs.
- Margin doodles: rainbow, whale, clouds, sleeping pebbles, ants, bunting, sun/moon.
- The paper has a subtle mottled texture and two faint diagonal fold creases. It is not animated (no line boil).

**Palette (sampled).**

| Use | Hex |
|---|---|
| Paper | `#D6D3C6` (very uniform) |
| Red ballpoint (title, white side) | `#A03C3C` (stroke core about `#B03838`); file labels a–d `#7A3235` |
| Blue ballpoint (title, black side) | `#433284`; labels e–h `#413574` |
| Brown/graphite ink (grid, captions) | grid `#483E31`; caption ink `#705F4F` |
| Board hatch green | `#9BAF8E` |
| Move-hint ring ochre | `#B19551` |
| Light pieces: mushroom-cap red | `#C66C67` |
| Light pieces: skin | `#D0A078` |
| Dark pieces: indigo | `#494880` |
| Accents: star gold | `#E0B84A` |
| Accents: dotted-trail red | `#B83A3A` |
| Accents: dotted-trail navy | `#3A3A80` |

**Fonts.** Everything is handwriting: a monoline French-school-style cursive with no joins and tall loops (closest: *Playwrite FR Moderne* or *Sniglet*-light; alternatives *Caveat* or *Schoolbell*).
- Title "ballpoint gambit": x-height about 95 px, ascender to descender 364–659 px (27 % of H). It spans x 318–1600 and sits at y about 470–600. "ballpoint" is red and "gambit" is blue; the stroke is about 4 px.
- Caption cards: brown `#705F4F`, x-height about 35 px, single line, centred slightly above the middle (y about 520–560).
- Tagline: brown, about 60 px tall, centred under the title (y 600–744).
- In-game status ("your move", "checkmate!", "you win!"): red or blue, about 90 px, centred below the board, sometimes with a scribbled double underline.

## Timeline

| # | Start–end (s) | On screen | Motion | Out |
|---|---|---|---|---|
| 1 | 0.00–5.25 | Cold-open gameplay montage: close angles on the board. A purple wizard captures, a deer jumps, the cursor selects. | Each shot pushes in 1.08–1.16×. Pieces hop, dotted trails, a sparkle capture. Cuts at about 0.4, 2.05, 4.0. | Hard cut |
| 2 | 5.25–7.55 | Blank paper → "ballpoint" (red) + "gambit" (blue) handwritten | Write-on 5.40–6.35, hold, then **un-write** 7.30–7.50 | (same shot) |
| 3 | 7.55–8.75 | Blank paper → board grid draws itself → rank/file labels | `perspective-grid-draw-on` | Hard cut or jump-zoom |
| 4 | 8.75–10.55 | Board fills: light pieces doodle in, then dark pieces; margin doodles appear; "your move" writes | `doodle-piece-pop-in` + **pull-back zoom** (scale ×0.585 over 1.7 s) | Hard cut |
| 5 | 10.6–14.2 | Gameplay: e-pawn hover, hint rings, move e2-e4 with a red dotted trail; dark reply | `move-hint-rings`, `hop-move-dotted-trail` | Hard cut |
| 6 | 14.25–15.55 | Caption card: "every piece is a creature" | `caption-card-scribble` | Hard cut |
| 7 | 15.55–21.95 | Gameplay shots (cuts at 16.4, 17.5, 18.7, 19.8): knight hops, a bishop diagonal with a navy dotted trail, capture brawl | `capture-scuffle-sparkles` | Hard cut |
| 8 | 21.95–23.15 | Caption: "captures get personal" | write-on | Hard cut |
| 9 | 23.15–26.8 | Captured piece carried by ants to the whale doodle; the whale wakes and fills with blue hatch; "resign?" note | `scribble-fill-wipe` | Hard cut |
| 10 | 26.8–40.85 | Fast gameplay montage, cuts about every 1.1–2.0 s (26.8, 27.2, 29.6, 30.8, 31.8, 33.0, 34.4, 35.6, 37.4, 39.6). Musical notes, sweat drops, "is a knight" sticky notes. | Push-ins; piece emotes | Hard cut |
| 11 | 40.85–42.25 | Caption: "the opera game, paris 1858" | write-on | Hard cut |
| 12 | 42.25–53.55 | Opera-game moves: long dotted trails, queen sacrifice, a butterfly piece | Cuts at 43.6, 45.0, 46.8, 49.0, 51.2 | Hard cut |
| 13 | 53.55–54.80 | Caption: "a queen sacrifice…" | write-on | Hard cut |
| 14 | 54.8–64.2 | Final attack (cuts 57.4, 59.8, 61.8, 63.2). Long red dotted rook trail up the d-file. **"checkmate!"** is written with an underline and pieces cheer (stars, notes). | Push-ins; cheer bounce | Hard cut |
| 15 | 64.2–69.05 | Wide board, "you win!", "gg", "rematch?" | Pull-back ×0.78 over 3.2 s, ease-in-out, then a slight push-in | **Fade to paper** 69.05–69.35 |
| 16 | 69.35–73.62 | Blank paper → logo write-on (69.85–70.80) → tagline write-on (71.00–71.72) → hold | `handwrite-on` | End |

## Motion techniques

### `handwrite-on` (with optional `handwrite-off`)
- **Look.** Text appears as if written by an invisible pen, stroke by stroke, left to right at a near-constant speed. There is no pen sprite and no wobble animation; the finished glyphs stay static.
- **Measured speeds.**

| Text | Duration | Rate |
|---|---|---|
| Title "ballpoint" | 0.50 s (5.40→5.90) | x advances 410→1000 px ≈ 1,200 px/s |
| Title "gambit" | 0.45 s (5.90→6.35) | |
| Caption "every piece is a creature" (25 chars, 1030 px wide) | 0.50 s | ≈ 2,000 px/s, 50 chars/s |
| Caption "the opera game, paris 1858" | 0.55 s | |
| Final logo | 0.95 s | slower, about 1,300 px/s |
| Tagline (31 chars) | 0.72 s | |

  The red word finishes before the blue word starts, with no overlap.
- **Easing.** Linear in time per word; letters are drawn in stroke order.
- **Un-write.** The same title disappears in reverse, right to left, in 0.20 s (7.30→7.50), about 4× faster than writing. A 0.05 s blank of paper follows.
- **Recipe (Remotion/SVG).**
  - Convert the text to single-line stroke paths. Use a single-stroke (Hershey-style) font, or outline the font to paths and use `pathLength` with a centre-line approximation. Order the paths left to right.
  - Compute the total length L, then `strokeDashoffset = L * (1 - p)` per path with sequential reveal: `p_i = clamp((progress*L - cumLen_i)/len_i)`.
  - Stroke width 4 px, `stroke-linecap: round`.
  - For un-write, run `progress` from 1 to 0 over 12 frames at 60 fps.
- **Props.** `text`, `color` (per word), `charsPerSecond` (default 45), `strokeWidth`, `reverseOut`, `font`.

### `caption-card-scribble`
- **Structure.** A hard cut to blank paper. After 0.1 s (6 frames) a one-line handwritten brown caption writes on in about 0.5 s and holds for 0.6–1.0 s. A hard cut follows to the next gameplay shot. The whole card is 1.2–1.4 s.
- Text is centred, lowercase, brown `#705F4F`, and may end with "…".
- **Props.** `text`, `holdSec`, `color`.

### `paper-texture-bg`
- **Look.** Flat `#D6D3C6` with very low-contrast mottling (±3 luminance, blobs of 40–120 px) and 1–2 faint fold creases: straight lines of 1–2 px with a light/dark pair, nearly vertical at about 80°, near x 270–320, plus a horizontal crease near y 10.
- **Recipe.** Base rect, then an `feTurbulence` (`baseFrequency 0.008`, 3 octaves) through `feColorMatrix` to about 4 % alpha. Draw two crease `<line>`s with a white 1 px line at 25 % opacity offset 1 px from a dark 1 px line at 10 %. The texture is static.
- **Props.** `paperColor`, `creases[]`, `grainAmount`.

### `perspective-grid-draw-on`
- **Look.** On blank paper, the 8×8 board outline draws in pen strokes, each stroke drawn quickly from one end to the other:
  1. The top edge is a single horizontal line of about 580 px.
  2. The rectangle closes, as a trapezoid wider at the bottom.
  3. The vertical file lines are added one after another, left to right.
  4. The horizontal rank lines are added top to bottom.
  5. The file letters a–h are handwritten below, red then blue (a–d red, e–h blue). Rank numbers 1–8 go up the left side.
- **Timing (60 fps).** Grid strokes 7.60–8.30 s: 18 strokes in 0.7 s, about 0.04 s each, essentially continuous. Labels 8.30–8.70 s, about 0.05 s per glyph.
- **Geometry.** Trapezoid with a top width of about 0.72× the bottom width (perspective). The grid is centred at x 960. Lines are 3–4 px dark brown `#483E31` with slight end overshoot (lines extend 6–15 px past the corners, like real pen).
- **Recipe.**
  - Generate lines in board space `(u,v) ∈ [0,8]²` and project with a 3×3 homography (or just a bilinear map between 4 corner points).
  - Give each line a random endpoint overshoot of 4–14 px and a tiny mid-point bow of ±2 px using a quadratic curve.
  - Animate each `<path>` with `strokeDashoffset`, start `t_i = i*2.4 frames` at 60 fps.
  - Labels use `handwrite-on`.
- **Props.** `cols`, `rows`, `corners[4]`, `strokeColor`, `stagger`, `labelColors`.

### `pencil-hatch-squares`
- Dark squares are filled with diagonal coloured-pencil hatch (`#9BAF8E`, about 45–60° strokes, 6–8 px spacing, stroke 2 px, jittered length and opacity 0.5–0.9). The hatch appears with the board (after the grid) as a quick fade of about 0.2 s.
- **Recipe.** Use an SVG `<pattern>` of jittered short strokes generated from a seeded RNG, clipped per square and transformed by the board homography.
- **Props.** `hatchColor`, `angle`, `density`.

### `doodle-piece-pop-in`
- **Look.** Each piece materialises in three drawing stages, staggered left to right across a rank:
  1. **Outline.** A thin red or brown pen ellipse (egg shape, the piece silhouette) draws on in about 3 frames at 15 fps sampling (about 0.1 s).
  2. **Flat fill.** The egg fills with a soft pastel blob (cream or orange, `#E8C9A0`) for about 0.07 s.
  3. **Final art.** The detailed sprite replaces the blob with a tiny pop of scale 0.9→1.05→1.0 over about 0.15 s, eased with `spring({damping: 12, stiffness: 200})`.
- **Order and stagger.** The light pawn row (rank 2) goes a→h, then the back rank, then the dark pieces in the same way. The stagger is about 0.05–0.07 s per piece, and a full rank takes about 0.5 s.
- At the same time, margin doodles (clouds, rainbow, whale, sun, bunting) fade or draw in during the pull-back.
- **Recipe.** For each piece `i`, `t0 = rankStart + i*4 frames` at 60 fps:
  - Outline: `<ellipse>` with dash reveal over frames t0…t0+6.
  - Fill: opacity 1 for frames t0+6…t0+10.
  - Sprite: `<image>` from t0+10, scale using spring; the fill blob fades out under it.
- **Props.** `pieces[]` (sprite, square), `stagger`, `outlineColor`, `blobColor`.

### `board-pullback-reveal`
- **Measured.** A continuous zoom-out from 8.8 to 10.5 s. Per-0.1 s scale factors: 0.998, 0.994, 0.989, 0.982, 0.974, 0.963, 0.952, 0.938, 0.925 (peak speed at 9.7 s), then 0.931 … 0.998. Cumulative scale is **0.585** (1.71× zoom-out). The camera drifts up by about 140 px.
- This is a symmetric ease-in-out, `cubic-bezier(0.45, 0, 0.55, 1)`.
- The end-of-game pull-back (64.3–67.5 s) has the same shape: scale ×0.78 over 3.2 s, peak at 65.8 s. It then reverses into a slow push-in of 1.02 over 1.2 s.
- **Recipe.** `scale = interpolate(f, [0, 102], [1, 0.585], {easing: Easing.bezier(.45,0,.55,1)})` on the whole board group, with the transform origin near the board's top centre.
- **Props.** `fromScale`, `toScale`, `duration`, `origin`.

### `shot-push-in` (gameplay camera)
- Every gameplay shot (1.1–2.5 s long) is a perspective view of the board at a different angle and crop. The camera slowly pushes in: cumulative scale 1.08–1.16 over the shot, ease-in-out, peaking mid-shot (for example 47.0–48.8: 1.003, 1.010, 1.019, **1.023**, 1.013, 1.005, 1.001).
- Rotation is about 0°. Small pans of 0–40 px happen at the start of a shot. Shots alternate between near (2–3 ranks visible) and medium (5–8 ranks visible).
- **Recipe.** Render the board scene in 3D (CSS `perspective` with `rotateX(35–45deg)` on the board plane) or with a precomputed homography. Wrap each shot in `scale = 1 + amp*easeInOut(t)` with `amp` 0.08–0.16.
- **Props.** `amp`, `cameraTilt`, `cropRect`.

### `move-hint-rings`
- **Look.**
  - Hovering a piece shows its legal destination squares as hand-drawn ochre circles (`#B19551`, about 70 % of the square width, 3 px stroke, slightly unclosed) with a tiny green leaf sprout on the top-right.
  - The hovered target gets four corner brackets (an L-shaped ochre selection box).
  - The selected piece gets a red pen circle under it.
  - A hand cursor (white glove, black outline) and an arrow cursor are visible.
- **Timing.** Rings draw on (dash reveal) in about 0.15 s, staggered 0.05 s. The brackets snap in, with a 1-frame scale of 1.1→1.0.
- **Props.** `squares[]`, `ringColor`, `showCursor`.

### `hop-move-dotted-trail`
- **Look.** A piece moves from square A to B with a small arc hop: it lifts about 20–30 px at mid-path and squashes slightly on landing. It leaves a trail of **dots** in the side's ink colour (red `#B83A3A` or navy `#3A3A80`) along the straight path. Dot diameter 8–12 px, spaced about 28 px, with dot size shrinking slightly with perspective.
  - The trail persists for the rest of the shot and is not erased within the shot.
  - A red ring (`#C04040`, 2 px) around the destination fades in on landing.
- **Timing.**
  - One-square pawn push: about 0.35 s.
  - Long rook or bishop slides (5–6 squares): 0.5–0.7 s, ease-in-out.
  - The dots appear progressively behind the piece, each dot popping in at scale 0→1 over 3 frames.
  - The knight follows an arc and its trail is an L of dots.
- **Recipe.**
  - Position: `pos = lerp(A, B, easeInOut(p))` and `y -= sin(πp)*hopHeight`.
  - Dots: for `k < floor(p*N)`, render `<circle>` at `lerp(A, B, k/N)`, projected through the board homography.
  - Landing: `scaleY = 1 - 0.12*bump(p, 0.95)`.
- **Props.** `from`, `to`, `path` ('line' or 'L'), `dotColor`, `dotSpacing`, `hopHeight`, `duration`.

### `capture-scuffle-sparkles`
- **Look.** The attacker lands on the victim's square. The two overlap and "scuffle": they jitter ±6 px and rotate ±10° at about 12 Hz for about 0.6 s, while 4–6 small gold stars (`#E0B84A`, 5-point, 14–20 px) burst outward. The victim then tumbles off, rotating 90–180° and sliding away, and exits the shot. A water-drop "sweat" emote may appear.
- **Recipe.** Shake: `x += sin(f*1.3)*6` and `rot = sin(f*0.9)*10` during the window. Stars: seeded radial velocity 200–350 px/s, scale 0→1→0, rotation spin. Victim: after the window, `rotate` 0→160° and `translate` (+120, −80) with ease-in over 0.4 s.
- **Props.** `attacker`, `victim`, `starCount`, `duration`.

### `scribble-fill-wipe`
- **Look.** An outlined blue whale doodle gets coloured in with vertical blue ballpoint hatch strokes (`#4A55B0`, 2 px, 5–7 px spacing, length = shape height with jitter). The fill sweeps **left to right** across the body in about 0.6 s (25.3→25.9 s). The eye opens (from closed curve to dot) just before the fill. A spout doodle pops up after.
- **Recipe.**
  - Create a hatch pattern clipped to the shape path.
  - Animate a `clipPath` rect width 0→bboxWidth with `Easing.inOut(Easing.quad)`.
  - Optionally reveal each stroke as it is crossed by the wipe, with a 2-frame dash reveal per stroke for a "being drawn" feel.
- **Props.** `shapePath`, `hatchColor`, `direction`, `duration`.

### `cheer-bounce-emotes`
- At checkmate, pieces raise their arms and bounce: y −12 px at 3 Hz with squash on landing. Gold stars twinkle around them (scale pulse 0.8↔1.1 at 2 Hz, staggered phase), and music-note doodles float up 30 px while fading over 1 s. The status text "checkmate!" writes on with a double red underline that draws left to right after the word (about 0.3 s).
- **Props.** `pieces[]`, `emotes`, `bounceHz`.

### `fade-to-paper-endcard`
- The board scene fades out to the plain paper over 0.30 s (69.05→69.35, linear). Blank paper holds 0.5 s, then the logo writes (0.95 s), a 0.2 s pause follows, then the tagline writes (0.72 s), then a hold of about 1.9 s to the end. There is no camera motion on the end card.
- **Props.** `title`, `titleColors`, `tagline`, `gapSec`.

## Transitions
- Nearly everything is a **hard cut**, about every 1.1–2.5 s, timed to an implied music beat.
- Caption cards are hard-cut in and out, with a 6-frame blank-paper beat before the writing starts.
- The intra-shot "transition" at the opening is un-write → blank → grid draw-on (the paper acts as a continuous canvas).
- The only dissolve is the final fade to paper (0.3 s).

## Camera
- A virtual 3D camera looks at a flat paper board plane, tilted about 35–45°, so the grid is a trapezoid with top/bottom width ratio about 0.72.
- Per-shot slow push-ins (scale +8–16 %, ease-in-out) and two large ease-in-out pull-backs (×0.585 over 1.7 s; ×0.78 over 3.2 s). There is no rotation and no parallax: everything is drawn on one plane, so a single 2D homography plus scale is enough.

## Library candidates
- `handwrite-on`: stroke-order handwritten text reveal, with optional fast reverse un-write, for any title or caption.
- `caption-card-scribble`: a quick blank-paper interstitial with one handwritten line between shots.
- `paper-texture-bg`: a static cream paper backdrop with fold creases for hand-drawn themes.
- `perspective-grid-draw-on`: pen-drawn grid or table construction for boards, charts or calendars.
- `pencil-hatch-squares`: coloured-pencil hatch fills for cells, bars or regions.
- `doodle-piece-pop-in`: an outline → blob → sprite staggered reveal for icons or characters.
- `board-pullback-reveal`: an ease-in-out zoom-out revealing a full layout after a close start.
- `shot-push-in`: a subtle per-shot Ken-Burns push to keep static scenes alive.
- `move-hint-rings`: hand-drawn target rings and brackets to highlight UI options.
- `hop-move-dotted-trail`: an object hop-move leaving a dotted path for routes or step-by-step moves.
- `capture-scuffle-sparkles`: a comic scuffle shake with a star burst for conflict or replacement moments.
- `scribble-fill-wipe`: a hatch colour-in wipe of an outlined shape for progress or "filling" reveals.
- `cheer-bounce-emotes`: a celebratory bounce with twinkling stars and notes for success states.
- `fade-to-paper-endcard`: a fade to a blank canvas, then a sequential handwritten logo and tagline.
