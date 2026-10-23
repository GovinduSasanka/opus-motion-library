# Character rig research: ClaudeAnimationBase ("Clawd")

Source: `opus_sources/repos/ClaudeAnimationBase` (MIT, John Heibel). Files read as text only, nothing executed:
`ANIMATION_GUIDE.md`, `README.md`, `src/clawd.js` (rig, 31 emotions), `src/core.js` (painting, timing, camera),
`src/timeline.js` (shots, loops, brush wipe), `src/sheets.js` (model sheets), `src/scenes/demo.js` (11 s example),
`src/config.js`, `docs/views.jpg`, `docs/emotions.jpg`, `docs/emotions.webp` (192-frame animated sheet).
There is no rendered video in the repo. Frames I looked at (git-ignored): `analysis/frames/clawd/` (bursts of the
animated emotion sheet for excited, cry, furious, ko, playful, decoded from the webp with PIL in `python -I`).

Stack of the source: p5.js + p5.brush (WebGL watercolour/ink brushes), 1920x1080, every frame a pure function of `t`,
rendered by headless Chrome. Our port target: Remotion 4 + SVG (no p5), so every recipe below is re-expressed as
deterministic SVG/React driven by `useCurrentFrame()`.

The character itself (a terracotta block mascot) is the Claude Code mascot and is NOT to be copied. Note also that our
existing `box-bot` already sits close to that silhouette (orange cube, dark rectangular eyes, four stubby legs), so the
new rig in section 6 deliberately uses a different body, limbs, face channels and colour.

---

## 1. Rig construction (how Clawd is built)

**Units and anchor.** One size unit `u`; the character is 10u wide and 8u tall incl. legs. `(x, y)` is the ground point
between the feet; body-local y runs up as negative numbers. Typical `u`: wide 10-16, medium 20-28, close-up 40-70,
extreme close-up 90+. Rule from the guide: the character must stay big (u < 12 only for establishing shots).

**Parts (front view, body-local, in u):**
| part | geometry | notes |
|---|---|---|
| body | rectangle x -5..5, y -8..-2 (10x6) | 8-point polygon (corners + edge midpoints) with per-vertex jitter `J = .07u` |
| shading | light ellipse upper-left (3.4u x 1.5u at (-1.6, -6.4)), dark band along the bottom (1.6u tall) | both as soft watercolour "fill" (bleeding edge), not flat |
| legs | 4 rectangles 1u x 2.2u at x = -4, -2, 1, 3 | far legs darker (body dark mixed 22 % toward ink) |
| arms | 2 rectangles 2.2u x 1u, pivot at (+-4.9, -4.5), default angle .2 rad | a raised/lowered arm slides its root outward by `.55*clamp((abs(a)-.7)/.9)` so it stands beside the body |
| eyes | 2 slits 1u x 2u at (+-2.5, -6) + a small cream highlight | highlight only drawn when `u > 9` (level-of-detail rule) |
| mouth | none at rest; anchor (0, -4.3) | 16 shapes available |
| shadow | ellipse 5.6u x 1u under the feet, ink at ~35 % | width shrinks with jump height: `f = 1 - min(.5, abs(dy)*.06)` |
| lid | top 2.9u of the body hinges open at the back-left corner (front view only) | the "lunchbox" mouth, see technique `chomp-lid` |

**Draw order:** shadow -> smear streaks -> arms behind -> legs -> body wash -> light/dark fills -> (3/4 side strip +
seam line) -> body ink outline -> gloom -> blush -> eyes -> mouth -> face accessories -> hat -> arms in front -> prop hook
-> emote (outside the body transform). Everything inside the body transform squashes, flips and rotates together.

**Transform:** `translate(x, y+dy) rotate(rot) scale(flip * (1 + sq*.6) * (1 + smear*.35), 1 - sq)`. Positive `sq` =
squash (wider, shorter), negative = stretch; the .6 factor keeps rough volume. Rotation pivots at the feet.

**Views:** five drawn key views, all facing right, `flip` mirrors: `front`, `q` (3/4: face shifted toward the heading and
narrowed to 74 %, darker side strip behind with a fine seam line), `side` (body narrowed to 6.2u, one eye, one arm,
diagonal legs), `qback`, `back` (no face). Each view is a small data record: silhouette edges, side-strip range, face
centre/width/visible eyes, leg list with near/far flag, arm list with pivot, direction and layer (behind, in front,
behind-in-shadow), hat offset/width. This data-driven view table is the key idea worth porting.

**Line style / hand-drawn look:**
- Every shape = flat `wash` (exact colour) + optional watercolour `fill` (bleeding, textured edge) + one continuous
  tapered ink outline. Custom brushes: `ink` (weight 5, pressure taper 1.15 -> .75, scatter .25), `inkfine` (2.6),
  `dry` (bristly, weight 14, opacity 90, scatter 3) used for smears.
- Outline weight `sw = clamp(u/15, .45, 2.4)`; limbs at .8 sw; face details .4-.6 sw.
- **Boil:** the random stream is reseeded 12 times a second, so polygon jitter and stroke wobble change every 2 frames
  at 24 fps. Each part (shadow, each arm, each leg, body, eyes, mouth, hat, prop, emote) reseeds from
  `hash("clawd <id> <part>" + boilFrame)`, so a moving arm never makes the still body re-boil, and anything drawn
  after the character is independent of its pose.
- Paper: procedural (70 faint brown radial stains + 1400 short curved fibres) under everything; static grain + warm
  vignette multiplied over the top so pigment sits "in" the paper.
- No pure black/white: ink `#2B2233`, cream `#FFF5E2`, paper `#F3EBDC`.
- Light is the one non-paint mark: an additive radial glow drawn under the grain (pigment mixing would turn yellow over
  blue into green).

**Palette** (`PAL`): paper `#F3EBDC`, ink `#2B2233`, clay `#D97757`, clayDk `#A84D33`, clayLt `#F2A283`, night `#1F2550`,
indigo `#2F3C7A`, rose `#E27A92`, ochre `#E8AA38`, sap `#6E9F58`, teal `#3A9C98`, violet `#7B5CA8`, cream `#FFF5E2`,
sky `#8EC3E6`. Mood tints: pale `#F6E6D2` (fear), flush `#E23E36` (anger), blue `#6D86BE` (sadness), rosy `#EF8EA8`
(love), green `#98B25E` (disgust), gold `#F0BE46` (pride); mixed into body 55 %, dark 50 %, light 45 % x `tintK`.

---

## 2. The 31 expressions

Each emotion = eyes + mouth + optional tint/blush/gloom/lid/emote + a `take` size (how big the reaction is when you
switch INTO it) + an idle body function locked to the beat (`bp` = beat position at `bpm`, 120 by default; `hit` =
`exp(-6*frac(bp))`, 1 on the beat then decaying). Pose values in u (dy, dx), radians (rot, arms), unitless (sq).
Arms: 0 = straight out, + = up, about 1.5 = vertical.

| # | name | family | eyes | mouth | extras | idle motion (beat-locked) | take | use it for |
|---|---|---|---|---|---|---|---|---|
| 1 | neutral | mind | normal slits, auto-blink | none | - | tiny bob -.25u, arms counter-sway +-.05 | .3 | resting, listening |
| 2 | happy | joy | `happy`: upward ^ arcs | smile arc | blush .3 | bob -1.2u per beat, arms swing +-.4 in counter-phase | .6 | default positive beat |
| 3 | excited | joy | `wide` slits (1.25x2.7u) | `open`: dark oval + rose tongue | emote spark (4-point stars) | two hops per beat -2.4u, squash on eighths, arms flap at 2x beat | 1.0 | "yes!", wins, anticipation of fun |
| 4 | laugh | joy | `squeeze` > < chevrons | `laugh`: big D with tongue | blush .45 | 5 Hz chuckle shake (dy -.45, rot -.07+-.03), arms hugging belly -.35 | .8 | jokes, punchline reactions |
| 5 | love | joy | `heart` shapes pulsing on beat | `cat` w-mouth | blush .8, tint rosy .5, emote hearts rising | slow 4-beat sway (rot .08, dx .5), soft bob | .7 | affection, cute payoff |
| 6 | shy | mind | `look` slits, looking down-away (lookX -.7, lookY .8) | `wobble` zig-zag | blush 1 (hatched cheeks) | fidgeting arms at 1.5 Hz with unequal amplitudes, slight hunch sq .06 | .3 | compliments, embarrassment |
| 7 | proud | joy | `closed` content arcs | smile | tint gold .3, emote spark | stands tall (stretch sq -.1), arms down on hips -.9, beat pop | .5 | achievement, "done" |
| 8 | smug | sly | `narrow` flat bars | `smirk` lopsided | - | lean rot -.06, one arm down -.5 / one up .5, side glance lookX .4 | .4 | "told you so", winner |
| 9 | relieved | joy | closed | smile | emote sweat drop | slow breath .35 Hz (sq .05+-.05), arms drooped -.7 | .4 | after danger, problem solved |
| 10 | sad | low | `sad`: top edge slants UP to centre + highlight | frown | tint blue .35, gloom .35, emote rain cloud | slow 8-beat sway, arms hang -.75, looking down | .3 | loss, failure, rejection |
| 11 | cry | low | `cry`: squeezed wavy lids, tear ribbons stream down the body, drops arc off | `wail` trembling trapezoid | tint blue .2 | one sob per beat (`sin(f*pi)*exp(-2f)`: dy -.7, sq .14), arms up .9 flailing at 6 Hz | .8 | big sadness, comic despair |
| 12 | angry | hot | `angry`: top edge slants DOWN to centre | `teeth`: cream rect with tooth grid | tint flush .45, emote anger vein (4 bowed red strokes) | 18 Hz tremble dx .1, arms pump on each beat | .8 | annoyance, bug in prod |
| 13 | furious | hot | `red`: red glow bleed + red slit | none (lid opens .28) | tint flush .85, emote steam puffs | shake dx .22 @20 Hz + rot @13 Hz, hop per beat, arms up 1+-.2 @9 Hz | 1.2 | rage, chomping, shouting |
| 14 | scared | alarm | `scared`: big cream whites, tiny pupils jittering | wobble | tint pale .6, emote sweat | 22 Hz tremble, stretched sq -.06, arms up at 17 / 19 Hz (de-synced), eyes flick L/R | 1.1 | danger, jump scare |
| 15 | surprised | alarm | wide | `O` dark round | emote "!" (one-off, fades 1.4-1.8 s) | stretched -.12, lifted -.3u, arms up 1.1 | 1.3 (largest) | discovery, plot twist |
| 16 | confused | alarm | mismatched pair [narrow, wide] | wobble | emote "?" | head tilt rot .1 over 8 beats, one arm raised 1.5 scratching @3 Hz | .6 | errors, questions |
| 17 | thinking | mind | look up-right (lookX .5, lookY -.8) | flat | emote typing dots | slight tilt .05, one arm to "chin" .9, other taps per beat | .4 | loading, pondering |
| 18 | idea | mind | `shine`: big round pupils with 2 highlights | grin | emote bulb with additive glow + 7 ray ticks | bounce -1u per beat, arm pointing up 1.55 | 1.1 | "eureka", feature reveal |
| 19 | determined | hot | `determined`: shallower angry slant + highlight | flat | - | lean forward .06, fists pumping alternately (sin vs cos of beat fraction) | .7 | effort, before a challenge |
| 20 | sleepy | low | `sleepy`: lower half lid with a line on top | small `o` | emote zzz (3 painted Zs drifting up, 2.5 s cycle) | slow breathing .3 Hz, drifting rot, arms -.6 | .2 | night, waiting, idle |
| 21 | bored | low | narrow | flat | - | one big sigh every 4 beats (inhale 30 % eased, long exhale), arms hanging -.85 | .2 | waiting, slow process |
| 22 | nervous | alarm | look, glancing L/R on alternate beats | wobble | tint pale .2, emote sweat | side shuffle dx .3, arms fidgeting @5 Hz with phase offset | .5 | uncertainty, pending result |
| 23 | suspicious | sly | narrow | flat | - | slow side-eye scan (lookX = sin at .25 Hz) with matching lean and dx | .4 | "hmm", security, detective |
| 24 | disgusted | hot | squeeze | wobble | tint green .5 | recoil (rot -.1, dx -.3) + a shudder every 2 beats (`exp(-6a)*sin(45a)`), arms up fending | .8 | gross, bad code |
| 25 | dizzy | alarm | `swirl`: rotating spirals, opposite direction per eye | wobble | emote stars orbiting the head | drunken circle (rot .12, dx .7 at .8 Hz), arms flail | .7 | after a spin/hit, overload |
| 26 | cool | sly | `shades`: two lenses, bridge, temple arms, 2 glints each | smirk | emote music notes | head-nod on every beat (dy -.35*hit), one arm down, one up .7 | .4 | confidence, swagger |
| 27 | starstruck | joy | `spark`: 4-point stars pulsing on an ochre bleed | open | tint gold .3 | two hops per beat -1.6u, both arms up 1.1 waving | 1.0 | awe, celebrity, big reveal |
| 28 | ko | low | `x` crosses | wobble | tint pale .3, emote stars orbit | slumped sq .28, tilted .12, arms limp -1 / -.9 | 1.0 | defeated, crashed |
| 29 | playful | joy | `wink` (one happy arc + one slit) | `tongue` sticking out | - | side-hop each beat with easeOut lean (dx .8, rot .1), arms seesaw | .6 | teasing, fun |
| 30 | mischief | sly | narrow | grin | gloom .3 (shadowed brow) | hand-rubbing @4 Hz (arms opposite), hunched sq .07 | .5 | scheming, "watch this" |
| 31 | hopeful | joy | shine | cat | blush .35 | looks up (lookY -.4), stands tall, arms open .5, slow sway | .5 | wishing, asking, waiting for result |

**Part libraries behind the table**
- **Eyes (24):** normal, look, wide, happy, closed, sleepy, wink, narrow, angry, determined, sad, teary (sad + wobbling
  tear pool), cry, squeeze, shine, scared, blank (empty whites), spark, red, heart, x, swirl, dot, shades. Any pair can be
  mismatched. `lookX/lookY` move slit pupils by .5u/.4u. `squint` 0..1 scales the eye pair vertically to 0; above .8 it
  becomes a horizontal line. When `smear > .5` the eyes collapse to horizontal dashes (a drawn in-between).
  Auto-blink on normal/look/wide: closed for .12 s every 3.3 s, per-character `seed` offsets the clock (no twinning).
- **Mouths (16):** o, O, smile, grin, flat, wobble, cat, frown, smirk, laugh, open, wail, teeth, tongue, pout, yawn;
  `null` = none. Dark mouth interior `#4A1F2A`, tongue rose.
- **Emotes (18):** ! ? !! !? zzz sweat spark heart hearts anger steam bulb dots scribble music swirl stars cloud. Pop-in
  uses backOut (s = 1.9) scale; "!" and "?" wobble with `sin(age*16)*exp(-3age)`. Over-head emotes: steam, stars,
  cloud, bulb, scribble; the rest sit by the top front corner.
- **Hats (15) + face pieces (3):** party, hard, crown, halo, wizard, hood, top, fedora, band, sweatband, beanie, bow,
  flower, headphones, cat (ears + whiskers); masq, mask, bowtie. Each view has a hat x-offset and width so hats track
  turns.

---

## 3. Poses and gestures

Poses are plain field bags spread together (`{...feel('proud', t), ...turn(...), hat: 'party'}`), later spreads win,
and fields that both moods and actions use (`dy`, `sq`) are added, not replaced. Gestures used in the emotions and
the demo:
- arms: hips/akimbo (-.9 both), hang (-.75), hug belly (-.35), out (0-.2), wave (1.2 + .5 sin(13t)), point up (1.55),
  scratch head (1.5 + waggle), chin (.9), fists pump (alternating), both up cheer (1.1-1.45), fend off (.7).
- body: lean (rot +-.06..-.1), hunch (sq +.06..+.08), stand tall (sq -.06..-.12), slump (sq .28 + rot .12).
- gaze: look target via lookX/lookY; eyes lead, body follows (guide principle "show the thought").
- pick-up: turn to 3/4, crouch (sq .18 over .1 s), lift with backOut, overhead hold, wind-up (arms drop .5, squash .2),
  throw (arms fly to 1.5 with a stretch spring `-.22*exp(-7a)*cos(18a)`), settle back to the mood's arms over .5 s.
- held props attach in arm space at the arm tip (prop draws around (0,0) and follows automatically); anything bigger is
  drawn separately from a point computed from the same pose (head top = `y + dy*u - 8u*(1-sq)`).

## 4. Cycles and acting curves (all closed-form functions of time)

| cycle / helper | timing and curve |
|---|---|
| boil | 12 drawings/s (`floor(t*12)`), i.e. every 2 frames at 24 fps |
| on twos | `onTwos(t) = floor(t*12)/12` wraps a whole shot's time |
| walk, front view | legs in two alternating pairs; a leg lifts while `sin((walk + (i%2)*.5)*2pi) > 0`, height 2.2 -> 1.3u |
| walk, side view | diagonal pairs (phase offsets 0, .5, .5, 0) swing `sin(ph)*.55u` forward and lift `max(0, cos ph)*.8u` |
| stroll(x0 -> x1) | position eased (smoothstep), leg phase = distance / 4u (one cycle per 4u travelled, so no foot-slide), bob `-abs(sin(d*pi))*.5u`, 3/4 view while moving, front when stopped |
| dance walk / run | walk phase = beat/2 (one cycle per 2 beats); run = beat*1.5, lean -.08, arms swing .8 |
| jump(t0 -> t1, h) | crouch .12 s before take-off to sq .18 (smoothstep); air: parabola `dy = -h*4k(1-k)`, stretch `-.16*abs(1-2k)` (thin at take-off and landing, round at apex); land: `sq = .22*exp(-8a)*cos(20a)` |
| take(t0, amt) | .1 s pre-squash to .12*amt, then `sq = -.26*amt*exp(-6a)*cos(16a)`, `dy = -1.2*amt*exp(-7a)*max(0, cos 9a)` |
| spring(t0, k=6, w=18) | `exp(-k*a)*sin(w*a)`; `ring()` sums one kick per event time (hats, tails, props) |
| arcPt(p0, p1, h, k) | straight lerp minus `h*4k(1-k)` (thrown props, hops between points) |
| turn(t0 -> t1, a0 -> a1) | heading eased, snapped to the nearest 1/8 turn -> 8 drawings (front, q, side, qback, back, qback-flip, side-flip, q-flip); smear `.55*sin(k*pi)` both sides; typical .12-.25 s |
| dances (beat-locked, 11 + mix) | bounce (dy -1.6*abs(sin), arms counter), hop (-4u), roof (arms up 1.25), sway (dx 3u, rot .12), spin (a drawn spin through the views once per bar, on beat 4), wave, walk, run, idle, stomp (alternating tilt, big squash .2), shimmy (2x beat), `mix` = new style every 2 bars, seeded |
| emotion idles | 31 bespoke functions, see table; frequencies chosen per mood (breath .3 Hz, chuckle 5 Hz, tremble 17-22 Hz, beat-locked bobs) |

Smear drawing: four dry-brush streaks of body colour (length (3 + 3*hash)*u*k) behind the body at 1.5u spacing, every
other one with a fine ink speed line; the body also widens by `smear*.35`.

## 5. Timeline / keyframe system and scene composition API

- `PROJECT = {duration, bpm, offset, audio?}`; `BEAT = 60/bpm`; beat position `bp = (t - offset)/BEAT`; `pulse(t,k)` =
  1 on each beat decaying `exp(-k*frac)`, `pulse2` on eighths, `beatN` integer beat.
- `shots([[t0, fn], ...])`: each shot `fn(t, lt, dur)` paints the whole frame (background included) and must be pure in
  `t` (frames render in parallel, out of order). `LOOPS.name = fn; LOOPS.name.len = 4` for model sheets and GIFs.
- `kf(t, [[t0, v0], ...], ease)` keyframes (numbers or arrays), `seg(t, a, b)` progress, eases: smoothstep, easeIn
  (cubic), easeOut (cubic), backOut (s = 1.9), elasticOut.
- **Acted emotion timeline** `emotions(t, [[t0, 'sleepy'], [t1, 'surprised', {lookX: .8}], ...], {take})`:
  1. squint ramps to 1 over the last .1 s before a key (eyes close = anticipation, hides the face swap);
  2. the face swaps under the squint; squint releases over .14 s;
  3. a take sized by the NEW emotion's `take` fires at the key; the next key's pre-squash adds in early;
  4. pose fields (dy, sq, arms, rot, dx, look) blend previous -> new idle with backOut over .4 s (overshoot);
  5. colour, blush, gloom and lid cross-fade over .3 s;
  6. the new emote pops in from .06 to .32 s (kept if unchanged); one-off emotes fade out from 1.4 to 1.8 s.
- Camera: `camBegin(cx, cy, zoom, rot)` / `camEnd()`, `toScreen()` to aim irises at a character, `shakeXY(t, amt)`
  (hash-based, changes at 24 fps), decaying shake on impacts `7*exp(-7a)`.
- Full-frame effects: `brushWipe(p)` (cover at p .5, cut underneath), `iris(cx, cy, r)` / `irisShape(pts)`,
  `flash(k)`.
- Workflow rules worth adopting in our docs (in our words): write a storyboard with "reads" (what the viewer must
  understand, start-end per read) before any code; one read at a time; fast actions, held meanings; every seam gets a
  transition; no text in character pieces (emotes instead); never twin (offset arm phases, blink seeds, crowd phases);
  render contact sheets, frame strips and face crops and look at them before shipping. Their worked example: an ending
  first squeezed into 1.3 s was unreadable; re-timed as 7 sequential reads over ~4 s.

---

## 6. Techniques (vs catalog.json)

### `mascot-emotions` — NEW
- look: an original hand-painted mascot ("Nib", spec below) that can show any of 31 named emotions, each with its own
  face, colour shift, emote mark and beat-locked idle, so it is never still.
- params: 31 emotions (table above as the reference behaviour), `bpm` 120 default, boil 12 fps, take sizes .2-1.3.
- build: `src/core/mascot-kit.tsx` = data table `EMOTIONS` + pure `feel(name, frame, fps, bpm)` -> pose record +
  `<MascotRig pose>` SVG. Motion `mascot` exposes `emotion`, `emotions` (keys), `script`, `view`, `hat`, colours.
- source: ClaudeAnimationBase/src/clawd.js `EMO`, `feel()` (MIT).
- value: any explainer, onboarding, error/empty/success states, reaction shots; an AI agent picks an emotion by name.

### `emotion-timeline` — NEW
- look: mood changes are acted: blink-squint, swap under the closed eyes, a squash-stretch take scaled to the new mood,
  overshooting settle, colour cross-fade, emote pop.
- params: squint-in .1 s, squint-out .14 s, pose blend backOut .4 s, colour .3 s, emote pop .06-.32 s, one-off emote fade
  1.4-1.8 s; take amplitude per emotion (.2 sleepy .. 1.3 surprised), global `takeScale`.
- build: `emotionsAt(frame, keys)` returns a blended pose; keys `[{at: frame, emotion, look?, emote?}]`. Pure, no state.
- source: clawd.js `emotions()` (MIT).
- value: one prop (`emotions`) gives a whole acted reaction beat; prevents the "snapping face" failure.

### `emotion-idle-beat` — NEW
- look: every mood has its own body language on the music's pulse (breathing, sobbing per beat, nodding, trembling).
- params: see table column "idle motion"; `hit = exp(-6*frac(beat))`; trembles 17-22 Hz with different frequencies per
  limb to avoid twinning.
- build: each emotion carries `idle(bp, tSec)` returning `{dy, dx, sq, rot, armL, armR, lookX, lookY}`; motion takes
  `bpm` and `beatOffset` so the host's music drives it; can also be applied to `box-bot` poses.
- source: clawd.js `EMO[*].body`, `_b()` (MIT).
- value: characters stay alive on long holds and sync to the host's soundtrack.

### `keyview-turn` — EXTENDS `box-bot`
- look: turns read as a cartoon model sheet: front -> 3/4 -> side -> 3/4 back -> back, one drawing per step with smear
  in-betweens, instead of a projected 3D box.
- params: 5 views + flip = 8 headings; snap to nearest 1/8; turn 3-6 frames at 24 fps; smear `.55*sin(k*pi)`.
- build: add `view: 'front'|'q'|'side'|'qback'|'back'` and a `turnMode: 'drawn'|'projected'` to box-bot; each view a
  data record (edges, side strip, face centre/scale, visible eyes, leg list near/far, arm list with layer).
- source: clawd.js `VIEWS`, `spinView`, `turn` (MIT); docs/views.jpg.
- value: flat hand-drawn styles (ink, paper, risograph) where 3D projection breaks the look.

### `smear-trail` — NEW
- look: for 1-4 frames of a fast move the body stretches and leaves dry-brush streaks of its own colour plus thin speed
  lines; eyes become dashes.
- params: 4 streaks at 1.5u spacing, length (3-6)u x k, every other one with a fine ink line; body widens `k*.35`.
- build: SVG paths with a rough "dry" stroke (`stroke-dasharray` noise + feTurbulence displacement), props `smear`
  0..1, `dir` -1/0/1; reusable as an overlay on any moving subject (`overlay` capable).
- source: clawd.js `smearTrail` (MIT). (Our `speed-lines` is manga focus lines, a different effect.)
- value: makes fast character moves, whip-pans and dashes read on twos.

### `chomp-lid` — NEW
- look: the top of a box-shaped character hinges open like a lunchbox into a dark mouth wedge with staggered teeth and
  a tongue; eyes ride on the lid.
- params: hinge at back-left corner, lid 2.9u (of 6u), angle `lid*1.25` rad; 6 lower / 5 upper teeth 1.3u wide, each
  tooth height `min(.8u, .42*gap)` so teeth never cross even at a crack; interior `#4A1F2A`.
- build: SVG group rotated about the hinge; teeth computed from the local gap; props `lid` 0..1, `chomp` (beat-driven
  open/close).
- source: clawd.js `lunchbox()` (MIT); burst `analysis/frames/clawd/burst_furious.jpg`.
- value: rage / eating / shouting beats for any box-shaped mascot (great on `box-bot`, a "data muncher" metaphor).

### `mood-tint` — EXTENDS `box-bot`
- look: body colour shifts with the mood (pale fear, red anger, blue sadness, pink love, green disgust, gold pride), plus a
  dark "gloom" forehead with hanging lines and blush cheeks that become hatched when strong.
- params: mix 55/50/45 % into body/dark/light x tintK; gloom = indigo wash 2.6u tall at alpha .6*g plus ~7 vertical
  fine lines of length 2.4u*g; blush ellipses .85u x .42u at +-3.6u, hatch when > .6.
- build: new props `tint`, `tintK`, `gloom`, `blush` on box-bot, interpolated by `emotion-timeline`.
- source: clawd.js `TINT`, `tintCols`, `gloom`, `blush` (MIT).
- value: readable emotion at small sizes / wide shots where the face is tiny.

### `eye-library` — EXTENDS `eyes-blink`
- look: 24 eye drawings (see list), mismatched pairs, squint, look targets, auto-blink with per-character seed.
- params: blink .12 s every 3.3 s offset by seed; look offsets .5u x / .4u y; highlight dropped below u = 9 (LOD).
- build: add `eyeStyle` values (happy, closed, sleepy, narrow, angry, determined, sad, teary, cry, squeeze, shine,
  scared, blank, spark, red, heart, x, swirl, dot, shades) and `eyes: [left, right]` to eyes-blink and the new rig.
- source: clawd.js `eyes()`, `eye()` (MIT).
- value: one face component shared by every character in the library.

### `mouth-library` — EXTENDS `box-bot`
- look: 16 mouth shapes from a dot to a wailing trapezoid.
- params: o, O, smile, grin, flat, wobble, cat, frown, smirk, laugh, open, wail (trembles at 30 rad/s), teeth, tongue,
  pout, yawn; anchor (0, -4.3u); dark interior + rose tongue.
- build: `mouth` prop, also driven by a simple lip-flap mode (`talk`: cycle o/open/flat on syllable times).
- source: clawd.js `mouth()` (MIT).
- value: talking-head and reaction shots without a full lip-sync system.

### `emote-set-ext` — EXTENDS `emote-pop`
- look: painted reaction marks: adds `!!`, `anger` vein, `steam` puffs, `spark`, `hearts` (rising), `dots` (typing),
  `swirl`, `stars` (orbiting the head), `cloud` (personal rain cloud), drifting `zzz`, `music`.
- params: pop = backOut (s = 1.9) scale; loops: zzz 2.5 s cycle, hearts 1.8 s, steam .7 s, dots 1.8 s staggered .22, stars
  orbit 5 rad/s on an ellipse 4.2s x 1s; anchors: over-head vs top-corner.
- build: add the new `icons` values and an `anchor: 'head'|'corner'` option to emote-pop; reuse inside the rig.
- source: clawd.js `emote()` (MIT).
- value: wordless reactions (the guide's "no text" rule) for any character or UI element.

### `hat-wardrobe` — EXTENDS `box-bot`
- look: 15 hats + 3 face pieces that follow views and squash with the body.
- params: per-view hat offset and width (front 0/1, q .6/1, side .3/.66, qback -.4/1).
- build: `hat` prop with an enum; drawn inside the body transform after the face.
- source: clawd.js `hat()`, `faceHat()` (MIT).
- value: themed variants (party, safety, royalty, wizard, music) from one rig: holiday and topic re-skins for free.

### `prop-hooks` — EXTENDS `box-bot`
- look: the character holds, lifts and throws objects that stay glued to the hand.
- params: `armL/armR(u, sw)` render callbacks in arm space at the arm tip; `draw(u, sw)` in body space.
- build: React render props `holdL`, `holdR`, `onBody` (ReactNode or `(u) => ReactNode`), plus `throwTo` using `arcPt`.
- source: clawd.js arm hook code, demo.js pick-up and throw (MIT).
- value: product shots (mascot holds the host's logo / phone / coin), "hand over the feature" beats.

### `quad-walk-cycles` — EXTENDS `box-bot`
- look: four-legged trot in front view (alternating pairs) and side view (diagonal pairs with lift), distance-locked.
- params: one leg cycle per 4u travelled; front lift .9u; side swing .55u / lift .8u; bob .5u.
- build: replace box-bot's fixed walk with distance-locked phase (`walk = travelled / (4*u)`) and the side-view pairs.
- source: clawd.js legs code, core.js `stroll()` (MIT).
- value: no foot-sliding at any speed or size.

### `beat-dance` — NEW
- look: a character dancing on the host's music: bounce, hop, roof, sway, drawn spin, wave, walk, run, idle, stomp,
  shimmy, or `mix` (changes style every 2 bars).
- params: all locked to beat position; hit squash .05-.2; spin on beat 4 of each bar through the key views.
- build: `dance(style, beat, seed)` -> pose; motion props `dance`, `bpm`, `beatOffset`, `seed`; works on `box-bot` and
  the new rig; crowds offset `seed` per member.
- source: clawd.js `move()`, `dancer()` (MIT). (`crowd-bob` only covers a synced stomp and cheer.)
- value: music videos, celebration states, "party" end cards.

### `brush-wipe` — NEW (transition)
- look: five fat, ragged paint strokes sweep across a slightly tilted frame, cover it, then drag off the other side.
- params: 5 bands, rotation -.1 rad, stagger delays [0, .14, .06, .18, .1], cover with easeOut (p 0-.5), uncover with
  smoothstep (p .5-1), ragged ends 40-90 px, two alternating colours with charcoal hatch; cut at p = .5. Total ~.6 s.
- build: add to `src/transitions.tsx` as `brush`: SVG paths with feTurbulence-displaced edges and a hatch pattern.
- source: timeline.js `brushWipe` (MIT).
- value: the natural transition for any painted / sketch / paper style.

### `iris-on-subject` — EXTENDS `iris` (transition)
- look: iris opens from / closes onto the character's head, holds a small circle a moment, then shuts; any shape (star,
  heart, keyhole) can be the hole.
- params: open 0 -> 1500 px easeIn .5 s; close 1500 -> 250 over .5 s, drift 250 -> 232 during the hold, shut in .25 s.
- build: iris transition gets `target` (a point from the subject motion), `holdRadius`, `holdFrames`, `shape`.
- source: core.js `iris`, `irisShape`; demo.js ending (MIT).
- value: cartoon "that's all folks" endings that land on the hero.

### `per-element-boil` — EXTENDS `scribble-ball`
- look: linework wobbles at 12 drawings/s, but each element keeps its own random stream so still things only boil on
  the boil beat and never jitter because something else moved.
- params: seed = hash(elementKey + floor(t*12)); vertex jitter .07u; stroke wobble small.
- build: core helper `boilRand(key, frame, fps)` used by all sketch-style motions (scribble-ball, box-bot sketch,
  emote-pop) and by the style engine's `wobble.boil`.
- source: core.js `boilSeed`, clawd.js part seeds (MIT).
- value: hand-drawn look without the "everything shimmering" artefact.

### `twinkle-ripple` — EXTENDS `starfield-night`
- look: a wave of brightened twinkles spreads across the star field from one point (a star "arriving home").
- params: per-star delay = distance / 1100 px/s; boost `1.3*exp(-5a)*min(1, 25a)`.
- build: `ripple: {x, y, at}` prop on starfield-night.
- source: demo.js `sky()` (MIT; idea only, we do not reuse the demo story).
- value: payoff accents for "it worked" moments on night scenes.

### `acting-helpers` — COVERED by `bouncing-ball` / `blob-mascot`
- look: jump with crouch and squash landing, spring settles, arcs.
- params: see section 4 (jump, take, spring, arcPt).
- build: we already have `bounceAt`, `squash`, `springs`, `onTwos` in `src/core/ease.ts` and `principles-kit.tsx`; only
  `take()` (pre-squash + stretch-up spring) is worth adding there.
- source: core.js (MIT).
- value: shared by every character motion.

### `additive-glow-under-grain` — COVERED by `embers` / `film-look`
- look: light added on top of paint, under paper grain, so it does not go muddy.
- build: `mix-blend-mode: screen`/`plus-lighter` radial gradient before the style engine's grain overlay.
- source: core.js `glow()` (MIT).

### `shot-timeline` — COVERED by Compose (`mix`, scenes)
- look: shot list of pure functions with per-shot local time.
- build: Remotion `<Sequence>` and our `Compose` scenes already do this; adopt the "reads" storyboard checklist in
  docs/CHOOSING.md instead.
- source: timeline.js (MIT).

### `emotion-sheet` — NEW
- look: a model sheet grid of all emotions of a character, each alive and labelled (8 x 4), or the views / motion /
  hats sheet.
- params: 8 columns, 4 rows, u = 11 at 1080p; 4 s loop.
- build: motion `mascot-sheet` with `sheet: 'emotions'|'views'|'hats'`, `labels` on/off (labels allowed only here).
- source: sheets.js, docs/emotions.jpg, docs/views.jpg (MIT).
- value: library showcase, agent reference image, documentation thumbnails, AI-agent self-check.

---

## 7. Style

### style `ink-wash-cartoon` — Painted Ink-and-Wash Cartoon
- essence: flat 2D cartoon painted with watercolour washes and a boiling tapered ink outline on warm paper; light is the
  only "digital" element.
- palette: paper `#F3EBDC` (bg), ink `#2B2233` (lines, never pure black), cream `#FFF5E2` (whites), hero `#D97757`-type
  warm (subject; our rig uses its own blue, see below), shade = hero mixed 40 % toward ink, night `#1F2550`, indigo
  `#2F3C7A`, rose `#E27A92`, ochre `#E8AA38` (light/gold), sap `#6E9F58`, teal `#3A9C98`, violet `#7B5CA8`, sky
  `#8EC3E6`. 4-6 per film; colour arc across the film (e.g. cold night -> warm dawn).
- texture / post: (1) shapes: flat fill + inner watercolour edge: `feTurbulence` (fractalNoise, baseFrequency ~.02,
  2 octaves) -> `feDisplacementMap` scale 4-8 on a duplicate fill at 50-60 % opacity, plus a darker rim via
  `feMorphology` erode 1.5 px composited `out` and blurred 1 px (wet-edge darkening). (2) pigment grain: fractal noise
  .6-.9 freq multiplied at 8-12 %. (3) ink: stroke as a filled polygon offset by a pressure profile (1.15 -> .75 along
  the path) with turbulence displacement scale 1-2, seed = boil frame. (4) paper: our style engine `paper` + 1400 fibre
  strokes as an SVG pattern + multiply grain and warm vignette (35 % at the corners, `#785F46`). (5) light: additive
  radial gradient drawn before the grain.
- typography: none by rule (show, don't write). If one or two words are essential: Permanent Marker (hand-lettered),
  painted into the scene once.
- motion rules: drawings boil at 12/s; character on twos optional; every move eased (no linear); anticipation before
  takes and jumps; overshoot settles; nothing ever still (camera drift `20*sin(.6t)` px + push 2 %/s); everything on the
  beat; transitions at every seam: brush-wipe, iris-on-subject, whip pan + smear, match cut.
- signature moves: `mascot-emotions`, `emotion-timeline`, `keyview-turn`, `smear-trail`, `brush-wipe`,
  `iris-on-subject`, `emote-set-ext`, `per-element-boil`.
- do: big characters (medium shot u 20-28 at 1080p), one read at a time, cause then reaction, props touching hands,
  depth by overlap / scale / paler-bluer distance. don't: 3D rotation or perspective projection, gradients mixed into
  paint, pure black/white, captions/signs/speech bubbles with words, twinned limbs or crowds, everything at one speed.
- source: ClaudeAnimationBase ANIMATION_GUIDE.md, src/core.js (MIT).

---

## 8. Spec for OUR original mascot rig: "Nib"

Goal: a library-owned mascot with the same depth of acting (31 emotions, acted changes, views, cycles, wardrobe) but
an original design that cannot be mistaken for Clawd or for our own `box-bot`.

**Design (different silhouette and features):**
- Body: a plump ink-drop / gumdrop, 7u wide x 8u tall, round bottom, sides tapering to a soft tip that curls over to
  one side (the "nib curl"). Single closed path, no corners.
- Signature secondary channel: the **curl** on top is a spring-driven tuft: it lags and overshoots on every move
  (`spring` follow-through), stands straight on surprise, droops on sad/sleepy, spirals tighter on dizzy, bends into a
  hook on confused, flickers like a flame on furious, glows at the tip on idea.
- Limbs: two short capsule legs (1.1u x 1.8u) and two noodle arms as tapered ribbons (2.6u long, bend via one control
  point; no rectangles). Two legs, not four.
- Face: round eyes (not slits) with a sclera-less dark iris and a highlight; **separate brows** (two short strokes; Clawd
  has none, our box-bot has basic ones) as a 3rd expression channel; a small mouth that is visible at rest (smile).
- Default colours (props): body `#3F63C9` (ink blue), shade `#2B4596`, light `#93AEF2`, ink `#1E1B2E`, cheek `#F28AA0`,
  curl tip `#F2B84B`, paper `#F4EEE2`. Pass host brand colours via `bodyColor`/`shadeColor`/`accent`.
- Units: `u` = size unit, anchor = ground point between the feet; `size` prop as fraction of frame height (default .32
  = medium shot).

**Views:** `front`, `q`, `side`, `qback`, `back` as data records (same technique as `keyview-turn`), each with body
path width factor, face centre/scale, which eye/brow shows, arm and leg layering, curl lean.

**Expression library** (`Emotion` enum, 31 entries matching the behaviour table above, re-drawn for round eyes + brows):
`neutral | happy | excited | laugh | love | shy | proud | smug | relieved | sad | cry | angry | furious | scared |
surprised | confused | thinking | idea | determined | sleepy | bored | nervous | suspicious | disgusted | dizzy | cool |
starstruck | ko | playful | mischief | hopeful`. Each entry:
```ts
type EmotionDef = {
  eyes: EyeKind | [EyeKind, EyeKind];  // 24 kinds (eye-library)
  brows: BrowKind;                     // flat | raised | worried | angry | one-up | knit | none
  mouth: MouthKind | null;             // 16 kinds (mouth-library)
  curl: CurlKind;                      // perk | droop | hook | spiral | flicker | glow | rest
  tint?: TintName | string; tintK?: number; blush?: number; gloom?: number; chomp?: number;
  emote?: EmoteKind; emoteOnce?: boolean;
  take: number;                        // 0.2..1.3
  idle: (beat: number, sec: number) => PoseDelta;  // beat-locked, pure
};
```
`chomp` replaces the lunchbox lid: Nib's mouth stretches into a wide toothy D (teeth sized to the opening) instead of a
hinged box top.

**Blend / transition rules** (from `emotion-timeline`): squint-in 3 f before a key (24-30 fps), swap under closed eyes,
release 4 f; take = new emotion's `take` x `takeScale`; pose blend backOut (s 1.9) over 12 f; colour/blush/gloom 9 f;
brows lead the eyes by 2 f (thought before action); curl lags the body by 3-4 f via spring (k 6, w 18); emote pops at
2-10 f after the key; one-off emotes fade at 42-54 f. Never two keys closer than 12 f (enforced: later key is delayed).

**Cycles:** distance-locked two-leg walk (one stride per 3u travelled, bob .4u, arms counter-swing), run (lean -.1,
stride per 2.4u, smear above speed threshold), hop/jump (crouch 3 f, parabola, squash land), `take`, drawn turn
(3-6 f), 11 beat dances + `mix`, blink every 3.3 s +- seed, breathing on all idles.

**Remotion motion** `mascot` (category `character`, overlay-capable: `background: 'transparent'`):
```ts
{
  character: 'nib',                // future: other rigs share the same props
  x: 0.5, y: 0.82, size: 0.32,     // ground point (0..1), height fraction
  emotion: 'happy',                // single mood, alive
  emotions: [],                    // [{at, emotion, look?:[x,y], emote?}] acted changes (frames)
  script: [],                      // box-bot vocabulary + {action:'turn', to:'q'|..} {action:'dance', style, beats}
                                   //   {action:'take', size} {action:'jump', dx, height} {action:'throw', to:[x,y]}
  view: 'front', flip: false,
  dance: '', bpm: 120, beatOffset: 0,
  hat: '', holdL: null, holdR: null,          // ReactNode / image src for held props
  bodyColor: '#3F63C9', shadeColor: '#2B4596', lightColor: '#93AEF2', inkColor: '#1E1B2E', accent: '#F2B84B',
  look: 'ink-wash',                // 'ink-wash' | 'clean' | 'sketch' (renders with the ink-wash-cartoon style or flat)
  boilFps: 12, onTwos: false, takeScale: 1, seed: 1,
  background: 'paper',             // 'paper' | 'transparent' | any colour
}
```
Implementation plan: `src/core/mascot-kit.tsx` (rig SVG, view table, eye/brow/mouth/curl/hat/emote libraries,
`feel`, `emotionsAt`, `dance`, `walk`, `take`), `src/motions/character/mascot.tsx` (props -> pose per frame),
`mascot-sheet` (emotion / views / hats sheets), brush-wipe added to `src/transitions.tsx`. Reuse `Emote` from
character-kit (extended by `emote-set-ext`) and `SoftShadow`. All randomness from `random.ts` seeded by
`(seed, part, floor(frame*boilFps/fps))`.

**Comparison with existing motions:**
| existing | what it has | what Nib adds |
|---|---|---|
| `box-bot` | cube mascot, 8 expressions, action script, yaw projection, on twos | 31 emotions with idles and acted changes, drawn key views, brows, curl secondary, wardrobe, prop hooks, beat dances |
| `blob-mascot` | white sphere with eyes, hop/roll on bars | full face, limbs, emotions; keep blob for data-chart hops |
| `eyes-blink` | eye pair blink/look/happy | 24-kind eye library shared with the rig |
| `emote-pop` | 7 icons chained over a point | 11 more marks, head/corner anchors, auto-driven by emotion |
| `scribble-ball` | boiling frustration tangle | per-element boil helper; scribble remains an emote option |

---

COUNTS: NEW 9 (mascot-emotions, emotion-timeline, emotion-idle-beat, smear-trail, chomp-lid, beat-dance, brush-wipe,
emotion-sheet, plus the watercolour wash/ink renderer inside style ink-wash-cartoon) · EXTENDS 11 (keyview-turn,
mood-tint, eye-library, mouth-library, emote-set-ext, hat-wardrobe, prop-hooks, quad-walk-cycles, iris-on-subject,
per-element-boil, twinkle-ripple) · COVERED 3 (acting-helpers, additive-glow-under-grain, shot-timeline) · STYLES 1
(ink-wash-cartoon) · expressions documented 31 (plus 24 eyes, 16 mouths, 18 emotes, 15 hats + 3 face pieces, 11 dances).
