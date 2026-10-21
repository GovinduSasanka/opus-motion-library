<div align="center">

# Opus Motion Library

**109 motion graphics you can drop into videos, websites and apps — by name, with your own words, colours and images.**

Titles · transitions · weather · characters · data · HUDs · image looks · real 3D — for Remotion, React, plain HTML and native apps.<br/>
Built so an AI agent can pick, mix and ship them for you.

[![MIT licence](https://img.shields.io/badge/licence-MIT-E9C27A?style=flat-square)](LICENSE)
[![Release](https://img.shields.io/github/v/release/GovinduSasanka/opus-motion-library?style=flat-square&color=E9C27A)](https://github.com/GovinduSasanka/opus-motion-library/releases)
[![Remotion 4](https://img.shields.io/badge/Remotion-4-0B84F3?style=flat-square)](https://www.remotion.dev)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev)
[![Stars](https://img.shields.io/github/stars/GovinduSasanka/opus-motion-library?style=flat-square&color=F2EEE6)](https://github.com/GovinduSasanka/opus-motion-library/stargazers)

[**Live gallery**](https://govindusasanka.github.io/opus-motion-library/) ·
[**Watch the 8-minute showreel**](https://github.com/GovinduSasanka/opus-motion-library/releases/tag/v1.1.0) ·
[**Quickstart**](#quickstart) ·
[**For AI agents**](AGENTS.md)

<img src="docs/media/preview.gif" alt="Opus Motion Library showreel preview" width="100%"/>

</div>

---

## Why

Good motion design is slow to make and hard to reuse. Every motion here is a **pure function of time** with **JSON
props**: give it your text, palette and pictures and it renders the same way every time, at **16:9, 1:1 or 9:16**, in a
**video**, on a **web page**, or as an **exported clip** for an app.

- **109 motions, 33 transitions, 19 recipes**: from a sonar ping, an origami crane and a deep-sea dive to iso bar charts,
  chat bubbles, glitch looks and a terrain that builds itself in real 3D.
- **Mix anything**: stack a backdrop, a subject, type and an accent in one shot (`layers`), with blend modes.
- **Use it anywhere**: Remotion video · `<MotionPlayer>` / `<MotionBackground>` in React or Next.js ·
  `<opus-motion>` custom element for any HTML site · `mp4` / `webm`-with-alpha / ProRes 4444 / GIF exports for
  iOS, Android, Flutter, Keynote and video editors.
- **AI-agent ready**: paste the repo into any project and tell Claude, Codex or Cursor *"pick motions from this library"*
  — [`AGENTS.md`](AGENTS.md) and `mgl suggest` tell it what to choose, how to mix it and how to wire it into that stack.
- **Narrated films from a storyboard**: local text-to-speech, word-synced captions placed clear of on-screen text,
  cuts on the beat, loudness mastering — no cloud services.
- **Deterministic and resolution independent**: seeded randomness, sizes in frame units, no timers.

![Every motion in the library](docs/library-overview.jpg)

## Quickstart

```bash
git clone https://github.com/GovinduSasanka/opus-motion-library.git
cd opus-motion-library && npm install
node cli/gen-registry.mjs

node cli/mgl.mjs list                                          # all 109 motions
node cli/mgl.mjs suggest "dark hero for a launch with stats"   # what should I use?
node cli/mgl.mjs render stamp-slam --props '{"lines":["HELLO","2026"],"keyword":"LAUNCH"}' --format portrait
npm run studio                                                 # browse everything in Remotion Studio
```

### In a React / Next.js site

```bash
npm run build:lib            # in the library folder, once
```

```tsx
import {MotionBackground, MotionPlayer} from 'opus-motion-library/web';

<MotionBackground recipe="hero-aurora-night">
  <h1>Ship faster</h1>          {/* real HTML text on top of a live motion */}
</MotionBackground>

<MotionPlayer motion="number-counter" props={{keyframes: [[0, 0], [60, 48210]], label: 'USERS'}} playOnView />
```

### In any HTML page (WordPress, Vue, Svelte, Webflow…)

```html
<script src="opus-motion.element.js"></script>
<opus-motion motion="aurora" props='{"pixelSize":0}' background loop></opus-motion>
```

### In a Remotion project, or as files for an app

```bash
node cli/mgl.mjs add depth-descent stamp-slam --to ../my-video/src     # copies only the source you need
node cli/mgl.mjs export confetti-burst --as webm-alpha                 # transparent overlay for apps / editors
```

Full guides: [`docs/INTEGRATION.md`](docs/INTEGRATION.md) (every stack, step by step) ·
[`docs/CHOOSING.md`](docs/CHOOSING.md) (intent → motions) · [`docs/CATALOG.md`](docs/CATALOG.md) (every prop).

## Use it from your AI agent

Copy or link this repo into your project and say:

> *Use the Opus Motion Library in `./opus-motion-library` to add an animated hero, a stats section and a success state.*

The agent reads [`AGENTS.md`](AGENTS.md) (also [`CLAUDE.md`](CLAUDE.md)), runs `mgl suggest` with your brief, prefers a
tested **recipe**, layers backdrop + subject + type + accent, swaps in your copy and brand colours, and picks the right
integration path for your stack. A Claude Code skill ships in [`.claude/skills/opus-motion`](.claude/skills/opus-motion/SKILL.md).

## Mix motions

```jsonc
{"layers": [
  {"motion": "city-skyline", "props": {"pullback": false}},
  {"motion": "rain", "props": {"background": "transparent"}},
  {"motion": "blur-in-title", "from": 12, "props": {"title": "AFTER HOURS", "backdrop": "none", "background": "transparent"}},
  {"motion": "film-look", "props": {"overlay": true}}
]}
```

Use it as a scene in a video spec, `node cli/mgl.mjs render mix --props '{"layers":[…]}'`, or `<MotionMix layers={…} />` on
the web. Nineteen ready mixes live in [`recipes/`](recipes) — `node cli/mgl.mjs recipes`.

## Make a narrated video

```jsonc
// storyboards/my-story.json
{
  "name": "my-story",
  "voice": {"speaker": "Ryan", "style": "warm documentary narrator"},
  "music": {"snap": true},
  "captionStyle": {"variant": "premium"},
  "scenes": [
    {"motion": "sonar-ping", "say": "Every motion starts with a single *dot.*", "transition": {"type": "iris"}, "tag": true},
    {"motion": "handwrite-on", "props": {"lines": [{"text": "hello"}]}, "say": "And a pen that writes its name."}
  ]
}
```

```bash
node cli/direct.mjs storyboards/my-story.json
```

Voice comes from local Qwen3-TTS, Whisper aligns every word so captions light up as they are spoken, rendered stills of
each scene decide where captions and index tags sit (never on a motion's own text), cuts snap to the music's beats, and
the mix is mastered to −16 LUFS. The showreel is built this way: `python storyboards/build-demo.py && node cli/direct.mjs storyboards/demo.json`.

## Motion catalogue

<!-- catalogue:start -->
<details open><summary><b>Type</b> (15)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/blur-in-title.jpg" width="260" alt="blur-in-title"/> | **`blur-in-title`**<br/>Blur-in title card `overlay` `your image` | Wide-tracked title whose letters sharpen out of a blur with a random stagger, tagline and rule below, then blur-swap to a second title. |
| <img src="gallery/chapter-header.jpg" width="260" alt="chapter-header"/> | **`chapter-header`**<br/>Chapter header `overlay` `your image` | Numbered chapter/stage header that steps through titles: tracked title + segmented progress bar, era badge card, or vertical location tag. |
| <img src="gallery/comic-burst.jpg" width="260" alt="comic-burst"/> | **`comic-burst`**<br/>Comic SFX burst `overlay` `your image` | Comic onomatopoeia (BONK! POP!) in a jagged halftone starburst that springs in after an impact frame, wobbles and boils, with speed lines and a shockwave ring. |
| <img src="gallery/end-card-credits.jpg" width="260" alt="end-card-credits"/> | **`end-card-credits`**<br/>End card credits `overlay` `your image` | Bottom scrim fades in over a drifting landscape; headline, mono stat lines and a credit stagger in with a blur fade-up, then fade to black. |
| <img src="gallery/glyph-orbit-logo.jpg" width="260" alt="glyph-orbit-logo"/> | **`glyph-orbit-logo`**<br/>Glyph-orbit logo build `overlay` `your image` | Glyphs fly in and orbit a ring, then resolve into a typed mono logotype (scrambled letter fragments, blue dot becomes the i tittle); a frame draws around it and tagline lines type below. |
| <img src="gallery/handwrite-on.jpg" width="260" alt="handwrite-on"/> | **`handwrite-on`**<br/>Handwrite-on title  | Text written glyph by glyph with a pen: outline strokes on, ink fill follows; optional fast un-write. |
| <img src="gallery/kinetic-captions.jpg" width="260" alt="kinetic-captions"/> | **`kinetic-captions`**<br/>Kinetic word captions `overlay` | Word-by-word pop-in captions; *starred* words sit on a solid highlight box. |
| <img src="gallery/mask-rise-title.jpg" width="260" alt="mask-rise-title"/> | **`mask-rise-title`**<br/>Mask-rise title `overlay` `your image` | Editorial title whose letters rise out of baseline masks with motion blur; chapter variant rolls a red italic numeral and types a subtitle, stack variant builds an end-card headline. |
| <img src="gallery/neon-sign.jpg" width="260" alt="neon-sign"/> | **`neon-sign`**<br/>Neon sign ignite  | Dark plum plate on a brick wall; rounded neon lettering strikes on letter by letter with flicker, then hums, with one faulty letter stuttering and glow spilling onto the wall. |
| <img src="gallery/number-counter.jpg" width="260" alt="number-counter"/> | **`number-counter`**<br/>Number counter `overlay` `your image` | Huge thin-mono counter that ticks or odometer-rolls through dwell keyframes, with unit, label and derived readouts (pressure, light, temperature, percent). |
| <img src="gallery/scene-tag.jpg" width="260" alt="scene-tag"/> | **`scene-tag`**<br/>Scene index tag `overlay` | Small glass pill in a corner with an index number, a hairline and a name; slides in, holds, fades. Transparent overlay. |
| <img src="gallery/stamp-slam.jpg" width="260" alt="stamp-slam"/> | **`stamp-slam`**<br/>Stamp slam + keyword pop `overlay` `your image` | A rotated vermilion label slams down from 1.3x like a rubber stamp over the scene (the serif title blurs away), then a huge keyword punches in. |
| <img src="gallery/story-caption-box.jpg" width="260" alt="story-caption-box"/> | **`story-caption-box`**<br/>Story caption box `overlay` `your image` | Double-ruled black narrative caption box under a letterboxed scene (RPG-style typing), or a yellow comic time-stamp plate ("7:00 AM  RISE AND SHINE"). |
| <img src="gallery/typewriter-code.jpg" width="260" alt="typewriter-code"/> | **`typewriter-code`**<br/>Typewriter code window `overlay` `your image` | macOS-style code editor or terminal window that types syntax-coloured code with a block cursor; the panel grows upward line by line. |
| <img src="gallery/typewriter-signature.jpg" width="260" alt="typewriter-signature"/> | **`typewriter-signature`**<br/>Typewriter signature `overlay` | Small lowercase credit typed into a corner two frames per character, no cursor; optional glyph-scramble dissolve out. |

</details>

<details><summary><b>Transitions</b> (1)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/transition-reel.jpg" width="260" alt="transition-reel"/> | **`transition-reel`**<br/>Transition reel  | Every scene transition in the library, one after another, between contrasting labelled colour panels. |

</details>

<details><summary><b>Shapes & line art</b> (22)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/bouncing-ball.jpg" width="260" alt="bouncing-ball"/> | **`bouncing-ball`**<br/>Bouncing ball (squash, anticipation, crack, hop)  | A red ball over a dark dev-HUD: gravity bounces with velocity stretch and 1-frame squash, or a charge-gauge launch, an exaggerated ground-cracking drop, or beat hops that write notes on a staff. |
| <img src="gallery/branch-grow.jpg" width="260" alt="branch-grow"/> | **`branch-grow`**<br/>Branching growth (dendrites / tree / network)  | A glowing recursive branching structure draws itself level by level from the trunk in a navy HUD void, gold dots pop at every tip, signal pulses run root to tips, and a binary-tree diagram counts the doubling. |
| <img src="gallery/call-response.jpg" width="260" alt="call-response"/> | **`call-response`**<br/>Call & response (two spheres)  | Blue and pink glossy spheres take turns pinging rings, flash a colour-swap halo, the paper tilts into a perspective floor, sparkles ride the ring crossings and a lotus blooms between them. |
| <img src="gallery/cell-division.jpg" width="260" alt="cell-division"/> | **`cell-division`**<br/>Cell division doubling  | Glossy gold nuclei bud and split inside an egg outline, doubling every few frames up to 256, while a corner binary tree grows one level per doubling. |
| <img src="gallery/compass-construct.jpg" width="260" alt="compass-construct"/> | **`compass-construct`**<br/>Compass geometry construct  | A drafting compass sweeps a circle and the six Seed-of-Life petals, a ruler draws the hexagon with a bright tip, nodes glint, then the construction spins and implodes to a point. |
| <img src="gallery/easing-graph.jpg" width="260" alt="easing-graph"/> | **`easing-graph`**<br/>Easing graph + compare tracks  | A linear black ball and an eased red ball race along two tracks with per-frame spacing ticks, while a dark graph-editor panel drags its bezier handles from linear to an S-curve and prints cubic-bezier(...). |
| <img src="gallery/flat-to-3d-sphere.jpg" width="260" alt="flat-to-3d-sphere"/> | **`flat-to-3d-sphere`**<br/>Flat disc to 3D sphere  | A flat red disc gains a wireframe, a perspective floor grid and gradient 3D shading with specular and cast shadow, leader-line callouts (highlight, terminator, core shadow…) type in, then it renders back flat. |
| <img src="gallery/gears.jpg" width="260" alt="gears"/> | **`gears`**<br/>Meshing gears  | Procedural hatched cog wheels pop in and mesh, counter-rotating at the correct tooth ratios; coloured-pencil gears on paper or white line-art gears on black. |
| <img src="gallery/heart-draw-fill.jpg" width="260" alt="heart-draw-fill"/> | **`heart-draw-fill`**<br/>Icon draw, fill & glow (heart)  | On warm sketch paper a pencil draws a red heart outline (or star / check / bolt), the hatched fill fades in, 4-point sparkles twinkle around it and a soft warm glow pulses while it hovers. |
| <img src="gallery/hex-comb-build.jpg" width="260" alt="hex-comb-build"/> | **`hex-comb-build`**<br/>Hex comb build  | Cream wax hexagon edges grow segment by segment with node balls and compass-circle previews, cells fill with honey colours, wax caps spiral shut and the comb tilts into extruded prisms. |
| <img src="gallery/line-draw-on.jpg" width="260" alt="line-draw-on"/> | **`line-draw-on`**<br/>Line-art draw-on  | Line art constructs itself stroke by stroke with a pen nib riding each tip, then groups of lines recolour to a highlight; defaults to a blueprint building elevation. |
| <img src="gallery/metaball-heatmap.jpg" width="260" alt="metaball-heatmap"/> | **`metaball-heatmap`**<br/>Metaball heat-map / goo  | A liquid splat spreads and oozes, rendered as heat-map contour bands (maroon core to mint rim) on a starfield; or gooey dark blobs merge and swell with an RGB-split rim. |
| <img src="gallery/onion-skin-arc.jpg" width="260" alt="onion-skin-arc"/> | **`onion-skin-arc`**<br/>Onion-skin arc (straight ahead vs pose to pose)  | Two panels compare animation methods: ghost circles drawn frame by frame along a wandering path vs keys, a breakdown and eased in-betweens filling an arc; or (mode drop) a bowling ball, ball and balloon fall the same height in different frame counts. |
| <img src="gallery/origami-fold.jpg" width="260" alt="origami-fold"/> | **`origami-fold`**<br/>Origami fold sequence (paper crane)  | A paper sheet in front of a sunny window: crease lines draw on, the sheet folds in snappy 2-3 frame flap rotations (excess strip falls away, pre-creases, diamond, 3/4 tilt, kite and narrowing folds, neck, tail, head) into a crane that flaps its wings; reversible (unfold). |
| <img src="gallery/pair-field.jpg" width="260" alt="pair-field"/> | **`pair-field`**<br/>Pair field zoom-out  | Dark violet field of hundreds of cyan+pink dot pairs pinging small rings; the camera pulls out 2.5x from a hero pair. |
| <img src="gallery/petal-bloom.jpg" width="260" alt="petal-bloom"/> | **`petal-bloom`**<br/>Petal bloom (lotus / radial)  | Layered petals unfold radially with spring overshoot into a lotus, or dense rings of spike petals sweep round a seed disk into a sunflower / fur ball. |
| <img src="gallery/ribbon-trail.jpg" width="260" alt="ribbon-trail"/> | **`ribbon-trail`**<br/>Ribbon follow-through trail  | A red ball swoops across a blue field trailing five lagging pastel ribbons; when it stops the ribbons whip past and settle hanging with a damped swing (or, style neon, two orbiting dots draw looping neon tube trails). |
| <img src="gallery/rose-curve-trace.jpg" width="260" alt="rose-curve-trace"/> | **`rose-curve-trace`**<br/>Rose-curve pendulum trace  | A red ball swings on a dotted pendulum string tracing petal loops; the outlines complete into a flower that fills pink, then zooms past camera and its colour becomes the background. |
| <img src="gallery/sonar-ping.jpg" width="260" alt="sonar-ping"/> | **`sonar-ping`**<br/>Sonar ping + echo window `your image` `loops` | Glossy dot on paper emits sonar rings; echo arcs return and pop open a circular picture window. |
| <img src="gallery/speed-lines.jpg" width="260" alt="speed-lines"/> | **`speed-lines`**<br/>Manga speed lines + impact frame  | Manga focus lines converge on a subject over a halftone comic backdrop, re-randomised every render frame on twos; at the hit the frame flips for two render frames into a yellow / violet two-tone impact print with a giant comic word, then red lines fade out and calm lines return. |
| <img src="gallery/sprout-grow.jpg" width="260" alt="sprout-grow"/> | **`sprout-grow`**<br/>Sprout grow row  | Pencil-sketch planters on a park lawn: stems rise one after another, leaf pairs pop and flower heads (sunflower, blossom, tulip) scale in with overshoot, then sway with twinkling sparkles inside a torn-paper frame. |
| <img src="gallery/swimmers-converge.jpg" width="260" alt="swimmers-converge"/> | **`swimmers-converge`**<br/>Swimmers converge + shockwave + fusion  | Small glowing agents with wavy sine tails swim in along dotted S-curves and stop around a glowing cell; one gets through with a flash and an expo shockwave ring, the rest fade, then two aster dots drift together and fuse in a starburst. |

</details>

<details><summary><b>Effects & accents</b> (10)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/confetti-burst.jpg" width="260" alt="confetti-burst"/> | **`confetti-burst`**<br/>Confetti burst `overlay` | Flat circles, rings, squares and capsules explode radially from a point with drag, gravity, spin and 3D flutter; fill mode tiles the whole frame (video17). Overlay-ready: background "transparent". |
| <img src="gallery/electric-arcs.jpg" width="260" alt="electric-arcs"/> | **`electric-arcs`**<br/>Electric arcs `overlay` | Jagged white-core lightning arcs with violet glow, re-randomised every 1-2 frames with drop-outs and brightness flashes, radiating from a plasma orb, jumping between two electrodes or crawling around an object. Overlay-ready: background "transparent". |
| <img src="gallery/emote-pop.jpg" width="260" alt="emote-pop"/> | **`emote-pop`**<br/>Emote pop `overlay` | Doodle reaction icons (! ? lightbulb hearts sweat-drop music notes) pop in over a point in 1-2 frames, boil, bob and fade, chained one after another above a box-bot. Overlay-ready: background "transparent". |
| <img src="gallery/eyes-blink.jpg" width="260" alt="eyes-blink"/> | **`eyes-blink`**<br/>Eyes blink & look `overlay` | A pair of cartoon eyes on a red ball blinks, darts between look targets and switches to happy ^ ^ arcs with a squash hop; watching variant fills dark negative space with staggered glowing green eye pairs. Overlay-ready: background "transparent". |
| <img src="gallery/giant-eye-reveal.jpg" width="260" alt="giant-eye-reveal"/> | **`giant-eye-reveal`**<br/>Giant eye reveal `overlay` `your image` | In darkness a huge reptilian eye opens from a cyan slit through an almond lid mask, with a glowing fibrous iris, contracting slit pupil and lit scales; ends with an exponential push into the pupil (or an eyelid close). Overlay-ready: background "transparent". |
| <img src="gallery/scribble-ball.jpg" width="260" alt="scribble-ball"/> | **`scribble-ball`**<br/>Scribble ball `overlay` | A boiling tangle of open ink loops, regenerated every 2 frames, floats over an upset box-bot linked by a red steam squiggle; storm variant swaps in a boiling doodle cloud with a lightning scribble and rain. Overlay-ready: background "transparent". |
| <img src="gallery/smoke-puffs.jpg" width="260" alt="smoke-puffs"/> | **`smoke-puffs`**<br/>Smoke puffs `overlay` | Clusters of open doodle ink circles (or soft blurred circles) rise from a vent, grow and fade, then shrink away when fixed; flash mode fires a 2-frame muzzle flash and a forward-drifting smoke puff. Overlay-ready: background "transparent". |
| <img src="gallery/sparkle-burst.jpg" width="260" alt="sparkle-burst"/> | **`sparkle-burst`**<br/>Sparkle burst `overlay` | Four-point doodle sparkles burst from a contact point and twinkle out (tool-tap repair), or gold stars fly out of a jittering scuffle cloud, or twinkle around a cheering character. Overlay-ready: background "transparent". |
| <img src="gallery/star-glint.jpg" width="260" alt="star-glint"/> | **`star-glint`**<br/>Star glint flare `overlay` | A six-spike specular "ting" with soft bloom flashes on a blade tip, shimmers through a hold and slowly decays; can slide along an edge, or fire as a quick 4-point twinkle. Overlay-ready: background "transparent". |
| <img src="gallery/mix.jpg" width="260" alt="mix"/> | **`mix`**<br/>Mix (layer motions together)  | Stacks any motions in one frame: backdrop + subject + text + accent, each with its own timing, opacity and blend mode. |

</details>

<details><summary><b>Worlds & weather</b> (22)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/aurora.jpg" width="260" alt="aurora"/> | **`aurora`**<br/>Aurora curtain `overlay` | Undulating teal-green aurora curtains shimmer over a navy starry sky, snowy mountains and an icy sea, with an optional pixel-art (pixelate + dither) look. Overlay-capable. |
| <img src="gallery/bubbles.jpg" width="260" alt="bubbles"/> | **`bubbles`**<br/>Iridescent bubbles `overlay` | A packed foam of soap bubbles on a steel sink: rotating rainbow thin-film rims, jiggle, occasional pops and re-growth; "rising" mode sends bubbles up through deep water. Overlay-capable. |
| <img src="gallery/caustics-godrays.jpg" width="260" alt="caustics-godrays"/> | **`caustics-godrays`**<br/>Caustics & god-rays `overlay` | Underwater: a rippling caustic web at the surface, swaying light shafts and drifting motes; "pool" = full-frame scrolling caustic texture; "beam" = warm window light shaft with dust. Overlay-capable. |
| <img src="gallery/city-skyline.jpg" width="260" alt="city-skyline"/> | **`city-skyline`**<br/>City skyline (window flicker, dusk to night)  | Seeded procedural city: three depth rows of buildings with setbacks, water tanks, antennas and window grids that flicker on and off; the sky goes from dusk to night as more windows light up, with traffic on the street and an optional aerial crane pull-back from one window to the whole skyline. Sketch style gives the hatched pencil-on-paper look. |
| <img src="gallery/curl-flow.jpg" width="260" alt="curl-flow"/> | **`curl-flow`**<br/>Curl-flow swirl `overlay` | Hundreds of coloured ribbons stream through a turbulent curl-noise vortex around a dark spiky pupil, inside a red magnifier lens on cream paper (or full-frame). Overlay-capable. |
| <img src="gallery/depth-descent.jpg" width="260" alt="depth-descent"/> | **`depth-descent`**<br/>Deep-sea depth descent `your image` | Underwater descent infographic: a bobbing brass bathysphere hangs on its cable while the world scrolls up past it — surface god-rays, a fish school, glowing jellyfish, a trench wall and the seafloor — the water darkens with depth, marine snow drifts, the headlamp beam rises as light falls, a depth counter with pressure/light/temperature counts top-left, a log-scale depth ruler with landmark ticks scrolls on the right and zone titles blur in letter by letter. |
| <img src="gallery/embers.jpg" width="260" alt="embers"/> | **`embers`**<br/>Embers & gold flecks `overlay` `loops` | Golden additive sparks rising and twinkling over a fire glow; "motes" = slow soft glowing ember dots, "gold" = spinning Klimt gold flecks with sparkle pulses. Overlay-capable. |
| <img src="gallery/falling-petals.jpg" width="260" alt="falling-petals"/> | **`falling-petals`**<br/>Falling petals / leaves / papers `overlay` | Petals (or autumn leaves, or paper sheets) sway, spin and flip in 3D as they fall in three depth layers past a blossom branch over a soft meadow. Overlay-capable. |
| <img src="gallery/fireworks.jpg" width="260" alt="fireworks"/> | **`fireworks`**<br/>Fireworks `overlay` | Staggered fireworks over a night city: a faint launch streak climbs, a white flash ball holds for a few frames, then a peony of sparks expands with an ease-out-cubic, droops under gravity, fades from the core out and twinkles away, while a warm global light pulse briefly lifts the whole scene. |
| <img src="gallery/fish-school.jpg" width="260" alt="fish-school"/> | **`fish-school`**<br/>Fish school + jellyfish  | Underwater scene: a loose school of fish sweeps across the frame along an eased Bézier S-curve, each fish trailing at its own lag with tail wobble, depth-faded colour and gentle wander, past pulsing glowing jellyfish, swaying kelp, god-rays and drifting particles. |
| <img src="gallery/flock.jpg" width="260" alt="flock"/> | **`flock`**<br/>V-formation flock  | A V-formation of red-crowned cranes flies right-to-left over snowy peaks: birds shrink with depth along each arm, flap on twos with offset phases (white down-strokes, grey-blue up-strokes) and bob against their wings, while a lone paper crane swoops in from the lower right and takes the last slot. |
| <img src="gallery/flow-lines.jpg" width="260" alt="flow-lines"/> | **`flow-lines`**<br/>Flow lines (wind / heat / steam / waves) `overlay` | Wavy streamlines: wind lines with end curls across a sky, rising heat wiggles over a desert road, soft steam wisps from a bowl, or braided pencil wave rows on paper. Overlay-capable. |
| <img src="gallery/grass-field.jpg" width="260" alt="grass-field"/> | **`grass-field`**<br/>Grass field (teal blades + golden leaves)  | Procedural tapered teal grass blades grow up from the bottom edge in a staggered wave, golden pointed leaves pop up behind, and the whole field sways with travelling wind gusts under a starry night sky. |
| <img src="gallery/insect-flight.jpg" width="260" alt="insect-flight"/> | **`insect-flight`**<br/>Insect dart flight (dragonflies / fireflies) `overlay` | Red dragonflies zig-zag over a sunny lotus pond in fast expo-eased darts separated by jittery hovers, their translucent wings flickering every frame, and one lands on a lotus bud and folds its wings; firefly mode fills a night meadow with glowing, blinking fireflies drifting between waypoints. |
| <img src="gallery/lightning-flash.jpg" width="260" alt="lightning-flash"/> | **`lightning-flash`**<br/>Lightning flash relight `overlay` | A rainy night house scene is relit by lightning: a forked bolt draws on, the frame flashes to a pink storm-lit plate for 2 frames and decays back to night in ~0.3 s; repeatable, with double strikes. Overlay-capable. |
| <img src="gallery/parallax-landscape.jpg" width="260" alt="parallax-landscape"/> | **`parallax-landscape`**<br/>Parallax landscape truck / speed-run  | Layered flat-vector landscape (sky and clouds, two mountain ranges, distant fields with a village, a hill, a tree row, foreground and whizzing near blades) trucking sideways at depth-proportional speeds with a flapping paper crane; speed-run mode ramps to a gallop-speed rush over a savanna with a fixed giant sun, horizontal streak blur on the near layers and light streaks. |
| <img src="gallery/rain.jpg" width="260" alt="rain"/> | **`rain`**<br/>Rain `overlay` | Night street in the rain: 3 parallax layers of slanted streaks, lamp-lit cone, ground ripples; optional glass droplets and trickles. Works as a transparent overlay. |
| <img src="gallery/snowfall.jpg" width="260" alt="snowfall"/> | **`snowfall`**<br/>Snowfall `overlay` | Layered snow drifting diagonally over a dusk snowy landscape; blizzard mode streams pixel snow and streaks sideways through a blue-grey white-out. Overlay-capable. |
| <img src="gallery/starfield-night.jpg" width="260" alt="starfield-night"/> | **`starfield-night`**<br/>Starfield night `overlay` | Dark teal night sky with twinkling cream stars, a grainy crescent moon that fades in, swaying teal grass and a shooting star. Overlay-capable. |
| <img src="gallery/sun-rise-set.jpg" width="260" alt="sun-rise-set"/> | **`sun-rise-set`**<br/>Sun rise / sun set  | Sunrise: a huge orange gradient disc rises from behind teal grass with an ease-out, grows a ring of spike rays and golden leaves pop up over a starry night. Sunset mode: stepped purple-to-peach sky bands, a cream sun with rotating dashed rays sinks behind the horizon and the sky darkens to dusk. |
| <img src="gallery/time-of-day-grade.jpg" width="260" alt="time-of-day-grade"/> | **`time-of-day-grade`**<br/>Time-of-day grade (day to night)  | A simple procedural hillside village whose sky gradient and colour grade keyframe from day through golden hour, dusk pink and mauve to night: the sun arcs down and sets behind the hills, clouds pick up the sunset, a multiply night grade cools everything, the moon and stars come out and the house windows switch on one by one. |
| <img src="gallery/topdown-terrain.jpg" width="260" alt="topdown-terrain"/> | **`topdown-terrain`**<br/>Top-down terrain scroll `your image` | Bird’s-eye view: a fixed paper crane (with hatched cast shadow and streaming dashed trail) flies over seeded top-down terrain — fields, river and town roofs, ocean with a whale breach, desert dunes, snowy peaks, night city, autumn forest — that scrolls diagonally with a speed ramp and hard-cuts between biomes. |

</details>

<details><summary><b>Characters</b> (5)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/blob-mascot.jpg" width="260" alt="blob-mascot"/> | **`blob-mascot`**<br/>Blob mascot hop & roll  | White eyed sphere hops down an isometric bar staircase with squash/stretch, painting each cap, lands with a tile ripple, then rolls back with its eyes coming round, leaving a fading peach trail. |
| <img src="gallery/box-bot.jpg" width="260" alt="box-bot"/> | **`box-bot`**<br/>Box-bot mascot  | Orange cube mascot with dark rectangular eyes, little arms and four stubby legs acting out a script: walk on twos, look around, emote, hop with squash and landing, wave, run off. |
| <img src="gallery/crowd-bob.jpg" width="260" alt="crowd-bob"/> | **`crowd-bob`**<br/>Crowd stomp / cheer  | A massed perspective crowd of box-bots, ink-etched soldiers or paper dolls; the camera cranes up to reveal its size while everyone stomp-hops in sync (or cheer-bobs with hearts). |
| <img src="gallery/sign-drop.jpg" width="260" alt="sign-drop"/> | **`sign-drop`**<br/>Sign drop & swing  | A neon, comic banner or wooden sign drops in on ropes with a springy bounce, swings on a damped pendulum and settles into a gentle sway; neon flickers on after landing. |
| <img src="gallery/walker-world-scroll.jpg" width="260" alt="walker-world-scroll"/> | **`walker-world-scroll`**<br/>Walker world scroll (era wipe)  | A chibi explorer in a bucket hat walks in place at 37.5 % W while procedural era panels (cave, Egypt, Greek vase, ink wash, 8-bit, vaporwave) scroll by with eased stop-and-go; torn decorated seams restyle him as they pass, with a confetti burst and an era badge swap. |

</details>

<details><summary><b>Data</b> (8)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/beat-montage.jpg" width="260" alt="beat-montage"/> | **`beat-montage`**<br/>Accelerating beat montage `your image` | Hard-cut image montage whose cuts accelerate 12 f -> 6 f -> 3 f, a persistent centre dot, breathing sonar rings on the beat, per-shot micro push and beat-synced style swaps. |
| <img src="gallery/iso-bar-chart.jpg" width="260" alt="iso-bar-chart"/> | **`iso-bar-chart`**<br/>Isometric bar-chart staircase `loops` | Data-driven clay-isometric bar chart on a tiled floor; a white eyed blob hops down it on the beat painting each cap orange (squash, confetti), the paint cascades, the floor ripples, and it rides a pillar back up — a seamless loop. |
| <img src="gallery/live-chart.jpg" width="260" alt="live-chart"/> | **`live-chart`**<br/>Live chart / ECG traces  | Line charts that draw live with a glowing head dot: growth curve + synapse curve + scrolling ECG ('trace'), two heartbeats drifting into sync ('sync'), or a quality line turning red and falling while a gauge needle swings down ('decline'). |
| <img src="gallery/map-route.jpg" width="260" alt="map-route"/> | **`map-route`**<br/>Map route  | Top-down illustrated paper map (fields, river, trees, blossoms) with a marker flying a curved dotted route, a red bearing vector with angle arc and distance ticks, a dashed line to the sun; hop style hops leg by leg leaving popping dots. |
| <img src="gallery/panel-triptych.jpg" width="260" alt="panel-triptych"/> | **`panel-triptych`**<br/>Panel triptych collide  | Navy grid backdrop; three coloured panel outlines draw on clockwise, pictures slide into them with numbered labels, the panels slam together with doubled misprint outlines, then prison bars drop. |
| <img src="gallery/perspective-grid.jpg" width="260" alt="perspective-grid"/> | **`perspective-grid`**<br/>Hand-drawn perspective board  | Pen strokes draw a perspective trapezoid board, coloured-pencil hatch fills squares, doodle pieces pop in (outline -> blob -> sprite) during a pull-back that reveals margin doodles, then move-hint rings and "your move". |
| <img src="gallery/science-reticle.jpg" width="260" alt="science-reticle"/> | **`science-reticle`**<br/>Science HUD reticle  | Instrument overlay (rings, spokes, tick ring, axis, scale bar) builds around a procedural cell or planet that is drawn by a clockwise comet sweep; typed mono labels on leader lines, comet laps the outlines. |
| <img src="gallery/thumbnail-mosaic.jpg" width="260" alt="thumbnail-mosaic"/> | **`thumbnail-mosaic`**<br/>Thumbnail mosaic (disc / grid / recap) `your image` | Dozens of thumbnails as a tilted glowing disc of rings, a gapless wall you zoom out into, or a recap grid springing onto a monitor; all end in a staggered pop-out to a single dot. |

</details>

<details><summary><b>Interfaces</b> (5)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/browser-mockup.jpg" width="260" alt="browser-mockup"/> | **`browser-mockup`**<br/>Browser mockup with living hero `your image` | Rounded, shadowed browser window on a blue-grey backdrop showing a landing page whose hero illustration is a living cinemagraph; cursor clicks the CTA, page scrolls. |
| <img src="gallery/card-fan.jpg" width="260" alt="card-fan"/> | **`card-fan`**<br/>Card fan: deal & play / connect  | Cards deal from a pile into a fanned hand, one is hovered, played to centre and hits an enemy (white flash, slash, damage pop, HP drain); 'connect' mode links three glass cards' icons and merges them. |
| <img src="gallery/chat-bubbles.jpg" width="260" alt="chat-bubbles"/> | **`chat-bubbles`**<br/>Chat bubbles, chips & thought bubble  | Chat bubbles and comment / prompt chips pop in one by one around a box-bot, a speech balloon snaps on, then a thought bubble rises (dots -> cloud -> icons -> caption) and a green verdict chip drops in. |
| <img src="gallery/sms-thread.jpg" width="260" alt="sms-thread"/> | **`sms-thread`**<br/>SMS thread on a phone `your image` | A phone rises in beside a headline; a missed-call alert, typing dots and SMS bubbles pop in one by one and the thread scrolls like a real chat, with day notes and a verdict badge springing in under the headline. |
| <img src="gallery/split-compare.jpg" width="260" alt="split-compare"/> | **`split-compare`**<br/>Split-screen compare `your image` | Presentation layout: headline, two perfectly synced panels (line-art vs colour by default) with colour-coded labels, stat lines and a footnote. |

</details>

<details><summary><b>HUD & blueprints</b> (6)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/callout-labels.jpg" width="260" alt="callout-labels"/> | **`callout-labels`**<br/>Callout labels `your image` | Staggered annotation callouts — dot, leader line and typed mono label — over a procedural subject; variants: room callout with crosshair and T-rules, translucent tags riding scrolling objects, and circular medallions popping on a blueprint plan. |
| <img src="gallery/era-dial.jpg" width="260" alt="era-dial"/> | **`era-dial`**<br/>Era dial counter  | Gear-ringed blueprint dial that turns a notch per era while the date plate rolls and the centre line-art illustration swaps (plan, press, book, computer, monitor, network). |
| <img src="gallery/hud-chrome.jpg" width="260" alt="hud-chrome"/> | **`hud-chrome`**<br/>HUD chrome overlay `overlay` | Overlay HUD: corner crop marks, header with red counter, live timecode, typed code line with red block cursor, BPM beat squares, chapter progress bar and a right-side ruler with "0N / 07" counter. |
| <img src="gallery/powers-of-ten.jpg" width="260" alt="powers-of-ten"/> | **`powers-of-ten`**<br/>Powers-of-ten zoom  | Continuous exponential pull-back (or push-in) through nested blueprint drawings — word, badge, radar, library plan, dial, network — with level-of-detail fading and a scale readout; snap mode jumps level to level. |
| <img src="gallery/radial-blueprint.jpg" width="260" alt="radial-blueprint"/> | **`radial-blueprint`**<br/>Radial blueprint plan  | Dark blueprint: a blue dot pings, the camera snaps back to a seeded circular library plan with a glowing hub, blue paths and flowing nodes, then spokes shoot out to category labels. |
| <img src="gallery/zoom-tunnel.jpg" width="260" alt="zoom-tunnel"/> | **`zoom-tunnel`**<br/>Zoom-through tunnel  | Blueprint radar target opens into a tunnel of outlined capsule rings; the camera accelerates through it and a hero word punches in as the tunnel slows, with an optional arc subtitle. |

</details>

<details><summary><b>Image looks</b> (10)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/comic-halftone.jpg" width="260" alt="comic-halftone"/> | **`comic-halftone`**<br/>Comic halftone post FX `your image` | Print-comic finish over an image: posterised toon colour, 45° halftone ink dots in the midtones and shadows, ink outlines, colour misregistration and vignette, animated on twos. |
| <img src="gallery/dot-matrix.jpg" width="260" alt="dot-matrix"/> | **`dot-matrix`**<br/>Dot matrix / halftone / particle image `your image` | Image resampled to a grid of dots — LED billboard, print halftone duotone, glowing luma particles or pointillist dabs — with a stepped resolution ramp from abstract to legible and back. |
| <img src="gallery/duotone.jpg" width="260" alt="duotone"/> | **`duotone`**<br/>Duotone recolour `your image` | A full-colour image cross-fades into a 2–3 colour brand ramp (blue, pink-violet, ink etching with cross-hatch, madness green flash or a day-to-night grade). |
| <img src="gallery/film-look.jpg" width="260" alt="film-look"/> | **`film-look`**<br/>Film finishing stack `overlay` `your image` | Cinematic finish over an image: bloom on highlights, radial chromatic fringe, grain, vignette, gate weave, a flickering blue anamorphic flare streak and optional 2.39:1 bars (or overlay-only mode). |
| <img src="gallery/glass-pane-grid.jpg" width="260" alt="glass-pane-grid"/> | **`glass-pane-grid`**<br/>Mondrian glass pane grid `your image` | A black-leaded Mondrian grid draws on over an image; each glass pane offsets, scales and tints its piece of the picture and keeps drifting, like looking through stained glass. |
| <img src="gallery/glitch-image.jpg" width="260" alt="glitch-image"/> | **`glitch-image`**<br/>Glitch image bursts `your image` | An image hit by timed digital-glitch bursts: RGB-split band displacement, datamosh column smear, stage-rewind bands with black slivers, 1–2 frame CMY silhouette flashes and a rainbow chroma echo trail. |
| <img src="gallery/ken-burns.jpg" width="260" alt="ken-burns"/> | **`ken-burns`**<br/>Ken Burns push / pull / tilt `your image` | Slow push, pull, pan or tall tilt-up across a still plate with handheld noise, an optional punch-in cut, rain and print grain. |
| <img src="gallery/light-sweep.jpg" width="260" alt="light-sweep"/> | **`light-sweep`**<br/>Night light sweep `your image` | Cinematic night lighting: headlights sweep across a rain-streaked window, sodium street lamps flicker on with volumetric cones through rain, or a door opens and floods a corridor floor with light and a long shadow. |
| <img src="gallery/pixel-dither.jpg" width="260" alt="pixel-dither"/> | **`pixel-dither`**<br/>Pixelate + Bayer dither look `your image` | Image rendered as chunky 6 px pixel art with 2x2 Bayer ordered dither, a 5–8 colour hue ramp, 2.34:1 letterbox, grain and vignette, slowly tilting. |
| <img src="gallery/xray-scan.jpg" width="260" alt="xray-scan"/> | **`xray-scan`**<br/>X-ray scan reveal `your image` | A glowing vertical scan beam (or an inky organic blob / hatched hole) sweeps across an image, revealing a glowing x-ray / blueprint line-art version in its wake. |

</details>

<details><summary><b>Real 3D</b> (5)</summary>

| preview | motion | what it does |
|---|---|---|
| <img src="gallery/iso-blocks-3d.jpg" width="260" alt="iso-blocks-3d"/> | **`iso-blocks-3d`**<br/>Iso blocks (3D clay) `3D` | Soft clay isometric 3D bar chart: a white ball with eyes hops down the bars painting each top orange, slams onto the tiled floor with a ripple, rolls back and rides a rising pillar while the caps un-paint — a seamless loop with a follow camera. |
| <img src="gallery/plan-tilt.jpg" width="260" alt="plan-tilt"/> | **`plan-tilt`**<br/>Plan tilt to 3D `3D` | An ink floor plan draws on top-down, then the camera tilts to eye level as the walls extrude into a 3D line drawing, dollies through the front door, and cranes back up until it reads as the plan again. |
| <img src="gallery/pointcloud-orbit.jpg" width="260" alt="pointcloud-orbit"/> | **`pointcloud-orbit`**<br/>Point cloud orbit `your image` `3D` | An image (default: a procedural swordswoman) becomes a 3D cloud of coloured beads pushed forward by brightness; the camera orbits, beads extrude into voxel columns, then the figure disintegrates into white particles blown sideways. |
| <img src="gallery/terrain-build-3d.jpg" width="260" alt="terrain-build-3d"/> | **`terrain-build-3d`**<br/>Terrain build (3D) `3D` | A procedural mountain heightmap rebuilds itself in labelled stages — flat, noise, fractal, erosion, materials, sun, atmosphere, clouds, lens — with a typing code panel, then a cinematic eased fly-by past the peak. |
| <img src="gallery/wireframe-build.jpg" width="260" alt="wireframe-build"/> | **`wireframe-build`**<br/>Wireframe build `3D` | A glowing amber wireframe galleon lifts out of a parchment blueprint part by part with sparks, then hull strips flash white-hot and cool into dark wood and sails fill with canvas, under a slow orbiting camera. |

</details>

<!-- catalogue:end -->

Every motion: `node cli/mgl.mjs info <id>` or [`docs/CATALOG.md`](docs/CATALOG.md). Transitions: [`docs/TRANSITIONS.md`](docs/TRANSITIONS.md).

## How it works

```
src/motions/<family>/<id>.tsx   defineMotion({id, props, propDocs, component})  — pure function of the frame
        │  node cli/gen-registry.mjs
        ▼
src/registry.ts · catalog.json (props + measured metadata: overlay, loop, mood, roles, weight, pairs-with)
        │
        ├─ cli/mgl.mjs       list · info · suggest · render · still · compose · recipe(s) · add · export · gallery
        ├─ src/Compose.tsx   scenes · layers · 33 transitions · overlays · captions · music cues · sfx · ducking
        ├─ src/web/          MotionPlayer · MotionMix · MotionBackground · <opus-motion>  (npm run build:lib)
        └─ cli/direct.mjs    storyboard → voice → word alignment → beat-snapped timing → caption zones → render → master
```

Stack: Remotion 4 · React 19 · TypeScript · SVG · three.js / @react-three/fiber · FFmpeg · optional Python (Qwen3-TTS,
Whisper, librosa) for narration.

**Requirements**: Node 20+, FFmpeg on `PATH`. Narration (optional): a Python env with PyTorch, `qwen-tts`, `soundfile`,
`librosa` (set `QWEN_PYTHON`) and one with `openai-whisper` (set `WHISPER_PYTHON`). Audio files are not bundled —
`node cli/fetch-audio.mjs` downloads the sound-effect kit and lists the music beds.

## Origin

The library started as an experiment: 23 short films made by Claude Opus 5.5 were taken apart frame by frame — timing,
easing curves, palettes, layout — and every technique (320 of them, documented in [`analysis/`](analysis)) was rebuilt
as a reusable, parameterised component. [`docs/TECHNIQUES.md`](docs/TECHNIQUES.md) maps each one to the motion that
rebuilds it.

## Contributing

New motions, recipes, transitions and integrations are very welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the
[authoring guide](docs/AUTHORING.md). Share what you make in [Discussions](https://github.com/GovinduSasanka/opus-motion-library/discussions).

## Licence and credits

- Code: [MIT](LICENSE). Rendering uses [Remotion](https://www.remotion.dev/license), which is free for individuals and
  small teams; larger companies need a Remotion company licence.
- Demo illustrations in `public/demo/` were generated for this project. Music and sound effects (Pixabay Content
  License) are not redistributed; sources are listed in `public/music/music.json` and `public/sfx/sfx.json`.
- Fonts load from Google Fonts (OFL).
- Not affiliated with or endorsed by Anthropic. "Claude" and "Opus" are trademarks of Anthropic.

<div align="center"><br/>If this saves you time, a ⭐ helps others find it.<br/><br/>
<a href="https://star-history.com/#GovinduSasanka/opus-motion-library&Date"><img src="https://api.star-history.com/svg?repos=GovinduSasanka/opus-motion-library&type=Date" width="560" alt="Star history"/></a></div>
