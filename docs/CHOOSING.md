# Choosing motions

Start with `node cli/mgl.mjs suggest "<the brief>"`, then use this page to sanity-check and to build a mix.
Every motion's props are in [CATALOG.md](CATALOG.md); previews in `gallery/` and `recipes/previews/`.

## The layering model

A rich shot is usually four layers, bottom to top (`roles` in `catalog.json`):

| role | job | typical opacity | examples |
|---|---|---|---|
| **backdrop** | sets the world and the mood; quiet, continuous | 0.4–1 | `aurora`, `starfield-night`, `caustics-godrays`, `city-skyline`, `ken-burns` (photo), `radial-blueprint` (dimmed), `flow-lines` |
| **subject** | the one thing the shot is about | 1 | `browser-mockup`, `sms-thread`, `iso-bar-chart`, `line-draw-on`, `era-dial`, `box-bot`, `heart-draw-fill` |
| **type** | the words (in video); on the web the words go in HTML instead | 1 | `blur-in-title`, `mask-rise-title`, `number-counter`, `glyph-orbit-logo`, `chapter-header`, `kinetic-captions` |
| **accent** | small life: particles, a glint, a burst — overlay-capable, `blend: "screen"` on dark | 0.4–0.8 | `embers` (motes), `star-glint`, `confetti-burst`, `sparkle-burst`, `fireworks` (`scene:false`), `falling-petals` |
| **frame** | finishing pass over everything | 1 | `film-look` (`overlay:true`), `hud-chrome` (`backdrop:"transparent"`), `scene-tag` |

Rules of thumb: one subject **or** one big type element is the hero — not both fighting. Dim a busy backdrop. Accents
are few and soft (`count` low, `opacity` 0.5–0.7). Text motions over another layer need their backdrop off
(`backdrop: "none"` and/or `background: "transparent"` — see `overlayProps`).

```jsonc
// a layer stack: a recipe's "layers", a Compose scene's "layers", the `mix` motion, or <MotionMix layers>
[
  {"motion": "aurora", "props": {"pixelSize": 0}},                                   // backdrop
  {"motion": "blur-in-title", "from": 18, "props": {"title": "ACME", "subtitle": "…", "swapTo": null,
    "backdrop": "none", "background": "transparent", "fadeOut": false}},              // type
  {"motion": "embers", "props": {"mode": "motes", "background": "transparent", "backdrop": false, "count": 18},
    "blend": "screen", "opacity": 0.7}                                               // accent
]
```

## By goal

### Hero / first impression (website hero, video opener)
- Recipes: **`hero-aurora-night`** (dark, calm, premium), **`hero-paper-sketch`** (warm, hand-made),
  **`hero-blueprint-logo`** (tech / AI / dev tools), `product-launch` (video).
- Backdrops that loop well behind HTML: `aurora` (pixelSize 0), `caustics-godrays`, `starfield-night`, `flow-lines`,
  `iso-bar-chart` (playful, seamless loop), `curl-flow` (lens off for full-frame), `city-skyline`.
- Titles (video): `blur-in-title` (cinematic serif), `mask-rise-title` (editorial), `glyph-orbit-logo` (mono logotype),
  `handwrite-on` (personal), `neon-sign` (nightlife).

### Explain a process / how it works
- Recipe: **`onboarding-steps`** (blueprint drawing + numbered steps).
- `line-draw-on` (your SVG paths draw themselves), `chapter-header` (step titles + progress), `gears` (mechanism),
  `panel-triptych` (three panels), `callout-labels` (annotate a subject), `origami-fold` (step-by-step transform),
  `flat-to-3d-sphere` / `easing-graph` / `onion-skin-arc` (teaching animation principles), `typewriter-code` (code).

### Show numbers / data
- Recipe: **`stats-reveal`** (one big number), `event-countdown`.
- `number-counter` (odometer / tick, prefix/unit, gauge), `live-chart` (line / ECG / decline gauge), `iso-bar-chart`
  (looping clay bar chart), `cell-division` (exponential growth), `pair-field` (population / network), `metaball-heatmap`.
- Pair a number with ONE quiet accent (`star-glint` on the final value, `flow-lines` behind) — not a second chart.

### Tell a story / documentary
- Recipes: `testimonial-quote`, `ocean-explainer`, `history-timeline`, `social-short-captions`.
- Photo looks: `ken-burns` (always with type + `film-look`), `light-sweep`, `duotone`, `film-look`, `pixel-dither`,
  `glass-pane-grid`, `comic-halftone`, `dot-matrix`.
- Words: `story-caption-box`, `kinetic-captions`, `chapter-header` (era / location variants), `blur-in-title`.
- Worlds: `depth-descent`, `walker-world-scroll`, `map-route`, `topdown-terrain`, `parallax-landscape`, `time-of-day-grade`.

### Social proof / testimonial
- Recipes: **`testimonial-chat`** (SMS thread), **`testimonial-quote`** (photo + caption box).
- `sms-thread`, `chat-bubbles`, `story-caption-box`.

### Celebrate / success state
- Recipe: **`success-celebration`** (drawn check + confetti).
- Overlays on top of your UI: `confetti-burst` (`overlay`), `sparkle-burst` (`variant: "cheer"`), `fireworks`
  (`scene:false`), `star-glint`. Subjects: `heart-draw-fill` (heart / star / check / bolt), `crowd-bob`.

### Error / warning / broken
- Recipe: **`error-glitch`** (404).
- `glitch-image` (pass a screenshot of your UI), `scribble-ball` (frustration), `smoke-puffs` (broken machine),
  `lightning-flash`, `electric-arcs`.

### Loading / waiting
- Recipe: **`loading-loop`** (seamless sonar).
- `sonar-ping` (`windowSize: 0`, `echoAngles: []`), `iso-bar-chart` (seamless), `compass-construct`, `gears`.
  Check `loopable` in `catalog.json`; loop the exact length.

### Transition / section divider
- Recipe: **`section-divider`** (pencil waves band; give it a short box with `fit="cover"` on the web).
- In videos use Compose transitions (`docs/TRANSITIONS.md`: iris, wipe, wave, ink blob, page turn, glitch, whiteout…),
  or `transition-reel` to preview them all. Motion-based breaks: `zoom-tunnel`, `powers-of-ten`, `chapter-header`.

### Ambient background (behind content, long dwell)
- Calm, continuous, low contrast: `aurora`, `starfield-night`, `caustics-godrays`, `snowfall`, `rain`, `embers`
  (motes), `falling-petals`, `flow-lines`, `bubbles`, `grass-field`.
- Use `MotionBackground` (`loop="auto"` crossfades non-loopable ones) and a `scrim` for text contrast.

### Product UI demo
- `browser-mockup` (your `heroSrc` screenshot), `sms-thread` (messaging products), `chat-bubbles` (AI assistants),
  `card-fan` (games / cards), `typewriter-code` (developer tools), `split-compare` (before / after).
- Recipes: `product-launch`, `app-store-preview` (portrait).

### Brand / logo
- Recipe: **`hero-blueprint-logo`**, `end-card`.
- `glyph-orbit-logo`, `typewriter-signature`, `neon-sign`, `sign-drop`, `star-glint` (shine), `compass-construct`
  (geometric build), `handwrite-on` (signature).

### Social short (9:16)
- Recipes: **`social-short-captions`**, **`app-store-preview`**. Render with `--format portrait`.
- Captions: `kinetic-captions` at the bottom third; keep the top 12 % and bottom 18 % clear of other text
  (platform UI). Photo plates: `ken-burns`. Energy: `beat-montage`, `speed-lines`, `comic-burst`.

### Music / nightlife / event
- Recipes: **`music-neon-promo`**, `event-countdown`.
- `neon-sign`, `dot-matrix` (LED), `beat-montage`, `crowd-bob`, `ribbon-trail` (neon), `fireworks`, `city-skyline`.

### Science / nature / education
- Recipe: **`ocean-explainer`**.
- `science-reticle`, `cell-division`, `swimmers-converge`, `branch-grow`, `depth-descent`, `fish-school`,
  `caustics-godrays`, `flock`, `sprout-grow`, `petal-bloom`, `powers-of-ten`.

## Mood quick-pick

| mood | backdrops | type | accents |
|---|---|---|---|
| dark / premium | `aurora`, `starfield-night`, `radial-blueprint` (dim) | `blur-in-title`, `glyph-orbit-logo` | `embers` motes, `star-glint` |
| light / paper / human | `handwrite-on` paper, `flow-lines` waves, `sprout-grow`, `perspective-grid` | `handwrite-on`, `mask-rise-title` (cream) | `sparkle-burst`, `falling-petals` |
| tech / blueprint | `radial-blueprint`, `line-draw-on`, `era-dial`, `zoom-tunnel` | `glyph-orbit-logo`, `typewriter-code`, `chapter-header` | `electric-arcs`, `star-glint` |
| playful | `iso-bar-chart`, `blob-mascot`, `box-bot` | `sign-drop`, `comic-burst` | `confetti-burst`, `emote-pop` |
| cinematic / photo | `ken-burns`, `light-sweep`, `duotone` | `story-caption-box`, `blur-in-title` | `rain`, `film-look` frame |
| neon / night | `city-skyline`, `neon-sign` wall | `neon-sign` | `embers`, `fireworks` |

## Pairs well with

Generated from `docs/motion-meta.json` by `cli/gen-docs.mjs`.

<!-- pairs:start -->
| motion | roles | pairs well with | note |
|---|---|---|---|
| `iso-blocks-3d` | subject | `number-counter`, `confetti-burst`, `chapter-header` |  |
| `plan-tilt` | subject | `callout-labels`, `film-look`, `mask-rise-title` |  |
| `pointcloud-orbit` | subject | `blur-in-title`, `film-look`, `embers` | Pass src for your own subject (a cut-out PNG works best). |
| `terrain-build-3d` | subject | `end-card-credits`, `typewriter-code`, `film-look` |  |
| `wireframe-build` | subject | `callout-labels`, `mask-rise-title`, `glyph-orbit-logo` |  |
| `blob-mascot` | subject | `confetti-burst`, `emote-pop`, `number-counter` |  |
| `box-bot` | subject | `emote-pop`, `scribble-ball`, `sparkle-burst`, `chat-bubbles` |  |
| `crowd-bob` | subject | `neon-sign`, `confetti-burst`, `fireworks` |  |
| `sign-drop` | subject | `embers`, `film-look`, `confetti-burst` |  |
| `walker-world-scroll` | subject | `chapter-header`, `era-dial`, `film-look` |  |
| `beat-montage` | subject | `neon-sign`, `kinetic-captions`, `film-look` |  |
| `iso-bar-chart` | subject | `number-counter`, `chapter-header`, `confetti-burst` | loop: true (default) is a seamless loop; great as a friendly looping stats hero. |
| `live-chart` | subject | `number-counter`, `hud-chrome`, `callout-labels` |  |
| `map-route` | subject | `chapter-header`, `number-counter`, `story-caption-box` |  |
| `panel-triptych` | subject | `stamp-slam`, `film-look`, `kinetic-captions` |  |
| `perspective-grid` | subject | `handwrite-on`, `sparkle-burst`, `emote-pop` |  |
| `science-reticle` | subject | `callout-labels`, `number-counter`, `caustics-godrays` |  |
| `thumbnail-mosaic` | subject | `end-card-credits`, `mask-rise-title`, `confetti-burst` |  |
| `aurora` | backdrop, accent | `blur-in-title`, `embers`, `starfield-night`, `glyph-orbit-logo`, `neon-sign` | pixelSize 0 = smooth (premium web look); 6 = pixel-art. |
| `bubbles` | backdrop, accent | `caustics-godrays`, `fish-school`, `blur-in-title` |  |
| `caustics-godrays` | backdrop, accent | `fish-school`, `depth-descent`, `blur-in-title`, `bubbles` | Excellent calm web hero background for water / health / science brands. |
| `city-skyline` | backdrop | `number-counter`, `fireworks`, `rain`, `neon-sign` |  |
| `curl-flow` | backdrop, accent | `blur-in-title`, `science-reticle`, `glitch-image` |  |
| `depth-descent` | backdrop | `caustics-godrays`, `blur-in-title`, `fish-school` |  |
| `embers` | backdrop, accent | `aurora`, `neon-sign`, `end-card-credits`, `blur-in-title`, `light-sweep` | mode motes + low count is the classic subtle accent over any dark scene (blend screen). |
| `falling-petals` | backdrop, accent | `handwrite-on`, `petal-bloom`, `blur-in-title` |  |
| `fireworks` | backdrop | `city-skyline`, `number-counter`, `mask-rise-title`, `neon-sign` | scene:false = transparent bursts over your own scene (use blend screen). |
| `fish-school` | backdrop | `caustics-godrays`, `bubbles`, `blur-in-title` |  |
| `flock` | backdrop | `blur-in-title`, `sun-rise-set`, `handwrite-on` |  |
| `flow-lines` | backdrop, accent | `handwrite-on`, `number-counter`, `chapter-header` | mode waves on paper makes a good section divider band. |
| `grass-field` | backdrop | `starfield-night`, `insect-flight`, `blur-in-title` |  |
| `insect-flight` | backdrop, accent | `grass-field`, `starfield-night`, `handwrite-on` |  |
| `lightning-flash` | backdrop, accent | `rain`, `stamp-slam`, `glitch-image` |  |
| `parallax-landscape` | backdrop | `map-route`, `chapter-header`, `kinetic-captions` |  |
| `rain` | backdrop, accent | `light-sweep`, `city-skyline`, `lightning-flash`, `story-caption-box` |  |
| `snowfall` | backdrop, accent | `starfield-night`, `blur-in-title`, `handwrite-on` |  |
| `starfield-night` | backdrop, accent | `aurora`, `blur-in-title`, `grass-field`, `end-card-credits` |  |
| `sun-rise-set` | backdrop | `flock`, `blur-in-title`, `handwrite-on` |  |
| `time-of-day-grade` | backdrop | `chapter-header`, `number-counter`, `kinetic-captions` |  |
| `topdown-terrain` | backdrop | `map-route`, `chapter-header`, `number-counter` |  |
| `confetti-burst` | accent | `heart-draw-fill`, `number-counter`, `mask-rise-title`, `browser-mockup` | As a web overlay: <MotionPlayer motion="confetti-burst" overlay loop="once"/> over your success screen. |
| `electric-arcs` | accent | `stamp-slam`, `glitch-image`, `zoom-tunnel` |  |
| `emote-pop` | accent | `box-bot`, `chat-bubbles`, `perspective-grid` |  |
| `eyes-blink` | accent | `starfield-night`, `giant-eye-reveal`, `story-caption-box` |  |
| `giant-eye-reveal` | accent | `lightning-flash`, `glitch-image`, `blur-in-title` |  |
| `scribble-ball` | accent | `box-bot`, `error-glitch`, `chat-bubbles` |  |
| `smoke-puffs` | accent | `gears`, `box-bot`, `stamp-slam` |  |
| `sparkle-burst` | accent | `heart-draw-fill`, `number-counter`, `box-bot` |  |
| `star-glint` | accent | `glyph-orbit-logo`, `number-counter`, `browser-mockup`, `neon-sign` | The 'shiny / premium' accent on a logo, badge or number. |
| `blur-redact-region` | frame, accent | `cursor-driver`, `keystroke-hud`, `spotlight-dim-focus` | Replace the sample labels (Blurred / Pixelated / Hidden). |
| `callout-labels` | subject, frame | `flat-to-3d-sphere`, `science-reticle`, `ken-burns` |  |
| `click-ripple-markers` | frame, accent | `cursor-driver`, `keystroke-hud`, `zoom-inset-box` | Transparent overlay: clicks are 0-1 points with a frame `at`; timestamps are derived from `at` at 30 fps. |
| `era-dial` | subject | `film-look`, `chapter-header`, `walker-world-scroll` |  |
| `hand-drawn-arrow-callout` | frame, accent | `cursor-driver`, `keystroke-hud`, `scribble-circle-highlight` | Replace the sample labels (Click here / Watch this bar / Then save). |
| `hud-chrome` | accent, subject, frame | `bouncing-ball`, `live-chart`, `typewriter-code` |  |
| `numbered-step-badges` | frame, accent | `cursor-driver`, `tooltip-pointer`, `spotlight-dim-focus` | Replace the sample captions (Search for a file / Pick a chart ...). |
| `powers-of-ten` | subject | `zoom-tunnel`, `radial-blueprint`, `number-counter` |  |
| `radial-blueprint` | subject | `glyph-orbit-logo`, `zoom-tunnel`, `typewriter-code` | At 30-40 % opacity with categories [] it is a premium tech texture behind a logo. |
| `scribble-circle-highlight` | frame, accent | `cursor-driver`, `hand-drawn-arrow-callout`, `spotlight-dim-focus` | Replace the sample labels (New project / Spot the dip / Total). |
| `spotlight-dim-focus` | frame, accent | `cursor-driver`, `tooltip-pointer`, `numbered-step-badges` | Replace the sample captions (Start with a search / Read the chart ...). |
| `tooltip-pointer` | frame, accent | `cursor-driver`, `spotlight-dim-focus`, `numbered-step-badges` | Replace the sample tip titles and text (Search / Live chart / Save). |
| `zoom-inset-box` | frame, accent | `cursor-driver`, `hand-drawn-arrow-callout`, `click-ripple-markers` | Pass src = a still of the same footage frame so the inset magnifies the real picture; without src it magnifies the built-in mock screen. |
| `zoom-tunnel` | subject | `radial-blueprint`, `glyph-orbit-logo`, `electric-arcs` |  |
| `comic-halftone` | backdrop | `comic-burst`, `speed-lines`, `story-caption-box` |  |
| `dot-matrix` | backdrop | `neon-sign`, `beat-montage`, `kinetic-captions` |  |
| `duotone` | backdrop | `mask-rise-title`, `stamp-slam`, `film-look` |  |
| `film-look` | backdrop, accent, frame | `ken-burns`, `light-sweep`, `story-caption-box`, `neon-sign` | overlay:true (+ flare:false, letterbox:'off') is the finishing frame layer on top of any mix. |
| `glass-pane-grid` | backdrop | `mask-rise-title`, `blur-in-title`, `film-look` |  |
| `glitch-image` | backdrop | `stamp-slam`, `typewriter-code`, `electric-arcs` |  |
| `ken-burns` | backdrop | `film-look`, `story-caption-box`, `kinetic-captions`, `blur-in-title` | Do not use ken-burns as the only motion of a piece: add type + an accent, or pick a richer image look (film-look, light-sweep, duotone). |
| `light-sweep` | backdrop | `rain`, `film-look`, `story-caption-box` |  |
| `pixel-dither` | backdrop | `snowfall`, `aurora`, `story-caption-box` |  |
| `xray-scan` | backdrop | `callout-labels`, `science-reticle`, `typewriter-code` |  |
| `bouncing-ball` | subject | `hud-chrome`, `easing-graph`, `onion-skin-arc` |  |
| `branch-grow` | subject | `radial-blueprint`, `pair-field`, `callout-labels` |  |
| `call-response` | subject | `chat-bubbles`, `handwrite-on`, `sparkle-burst` |  |
| `cell-division` | subject | `number-counter`, `science-reticle`, `swimmers-converge` |  |
| `compass-construct` | subject | `glyph-orbit-logo`, `hex-comb-build`, `typewriter-signature` |  |
| `easing-graph` | subject | `bouncing-ball`, `hud-chrome`, `onion-skin-arc` |  |
| `flat-to-3d-sphere` | subject | `callout-labels`, `hud-chrome`, `easing-graph` |  |
| `gears` | subject | `smoke-puffs`, `line-draw-on`, `chapter-header` |  |
| `heart-draw-fill` | subject | `confetti-burst`, `sparkle-burst`, `handwrite-on` |  |
| `hex-comb-build` | subject | `compass-construct`, `number-counter`, `glyph-orbit-logo` |  |
| `line-draw-on` | subject | `chapter-header`, `callout-labels`, `gears` |  |
| `metaball-heatmap` | subject | `live-chart`, `number-counter`, `curl-flow` |  |
| `onion-skin-arc` | subject | `easing-graph`, `bouncing-ball`, `hud-chrome` |  |
| `origami-fold` | subject | `flock`, `handwrite-on`, `falling-petals` |  |
| `pair-field` | subject | `number-counter`, `branch-grow`, `blur-in-title` |  |
| `petal-bloom` | subject | `falling-petals`, `handwrite-on`, `sparkle-burst` |  |
| `ribbon-trail` | subject | `neon-sign`, `hud-chrome`, `easing-graph` |  |
| `rose-curve-trace` | subject | `easing-graph`, `bouncing-ball`, `mask-rise-title` |  |
| `sonar-ping` | subject | `starfield-night`, `chat-bubbles`, `embers` | windowSize 0 + echoAngles [] + pings/pingEvery multiple of the length = a clean loading loop. |
| `speed-lines` | subject | `comic-burst`, `stamp-slam`, `comic-halftone` |  |
| `sprout-grow` | subject | `handwrite-on`, `sun-rise-set`, `number-counter` |  |
| `swimmers-converge` | subject | `cell-division`, `science-reticle`, `blur-in-title` |  |
| `blur-in-title` | type, accent | `aurora`, `starfield-night`, `caustics-godrays`, `embers`, `ken-burns` | Change title and subtitle (defaults ABYSSES / THE MIDNIGHT ZONE are sample text); set swapTo null for a single card. |
| `chapter-header` | type | `line-draw-on`, `flow-lines`, `ken-burns`, `map-route` |  |
| `comic-burst` | type | `speed-lines`, `comic-halftone`, `confetti-burst` |  |
| `end-card-credits` | type | `embers`, `starfield-night`, `thumbnail-mosaic` |  |
| `glyph-orbit-logo` | type | `radial-blueprint`, `star-glint`, `aurora` | Change logo / tagline / pill (defaults are sample text). |
| `handwrite-on` | type | `flow-lines`, `falling-petals`, `heart-draw-fill`, `sprout-grow` |  |
| `kinetic-captions` | type, frame | `ken-burns`, `film-look`, `beat-montage` | Do not put captions over a motion that already shows its own words (titles, signs, counters). |
| `mask-rise-title` | type | `fireworks`, `glass-pane-grid`, `duotone`, `confetti-burst` | Change chapter / lines / sideCopy / sideMono (defaults like STAGING, 12 PRINCIPLES are sample text). |
| `neon-sign` | type | `embers`, `film-look`, `rain`, `crowd-bob` | Change lines (default NOODLES / open late is sample text). |
| `number-counter` | type | `star-glint`, `flow-lines`, `confetti-burst`, `iso-bar-chart` | Set label, unit ('' to hide 'm'), readouts [] and keyframes — defaults are the DEPTH dive sample. |
| `scene-tag` | type, accent | `hud-chrome`, `film-look` |  |
| `stamp-slam` | type | `glitch-image`, `duotone`, `lightning-flash` | Change lines / preTitle / keyword (defaults LONDON 1736 / GIN are sample text). Not a default choice for every title. |
| `story-caption-box` | type | `ken-burns`, `film-look`, `light-sweep`, `pixel-dither` |  |
| `typewriter-code` | type | `glitch-image`, `hud-chrome`, `radial-blueprint` |  |
| `typewriter-signature` | type | `compass-construct`, `end-card-credits`, `starfield-night` |  |
| `browser-mockup` | subject | `star-glint`, `confetti-burst`, `mask-rise-title` | heroSrc = your real screenshot or hero art. |
| `card-fan` | subject | `sparkle-burst`, `number-counter`, `comic-burst` |  |
| `chat-bubbles` | subject | `emote-pop`, `starfield-night`, `box-bot` |  |
| `empty-state-illustration` | subject | `skeleton-shimmer`, `toast-stack-loop`, `browser-mockup` | Purely periodic (float, twinkle, button pulse): seamless loop. variant: box\|search\|inbox. |
| `hero-gradient-orbs` | accent, subject | `blur-in-title`, `mask-rise-title`, `film-look` | Pass your brand colours in palette. speed is an integer (laps per loop). Put headline text in HTML on top. |
| `loader-spinner-set` | accent, subject | `film-look`, `number-counter`, `sonar-ping` | variant: ring\|dots\|bars\|orbit\|pulse\|morph\|all; speed is an integer (whole cycles per loop) so the loop stays seamless. |
| `skeleton-shimmer` | accent, subject | `loader-spinner-set`, `browser-mockup`, `device-mockup` | Seamless loop: the shimmer starts and ends fully off-screen. Dark background colours switch to a dark skeleton. |
| `sms-thread` | subject | `film-look`, `number-counter`, `confetti-burst` |  |
| `split-compare` | subject | `mask-rise-title`, `film-look`, `callout-labels` |  |
| `success-check-burst` | accent, subject | `confetti-burst`, `number-counter`, `toast-stack-loop` | Fades back to an empty frame at the end, so it loops (frame 0 == last frame). variant: success\|error\|warning. |
| `toast-stack-loop` | accent, subject | `browser-mockup`, `device-mockup`, `success-check-burst` | Empty at the first and last frame; with background transparent and showPage false it overlays a screenshot or UI. |
| `typing-indicator-chat` | subject | `device-mockup`, `sms-thread`, `film-look` | Conversation clears at the end so it loops; messages is a prop (from "me"\|"them"). |
| `upload-progress` | accent, subject | `skeleton-shimmer`, `success-check-burst`, `browser-mockup` | Card enters, uploads to 100%, completes and leaves: seamless loop. |
<!-- pairs:end -->
