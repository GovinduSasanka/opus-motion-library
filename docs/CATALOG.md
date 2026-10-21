# Motion catalog

109 motions. Generated from `catalog.json` by `cli/gen-docs.mjs` — do not edit by hand.

Render any of them: `node cli/mgl.mjs render <id> [--props '{...}'] [--format landscape|square|portrait]`. Previews live in `gallery/`.

Choosing: `node cli/mgl.mjs suggest "<what you need>"` and [CHOOSING.md](CHOOSING.md). Using them in a website / app / other project: [INTEGRATION.md](INTEGRATION.md).

- [text](#text) (15)
- [transition](#transition) (1)
- [shape](#shape) (22)
- [fx](#fx) (10)
- [environment](#environment) (22)
- [character](#character) (5)
- [data](#data) (8)
- [ui](#ui) (5)
- [hud](#hud) (6)
- [3d](#3d) (5)
- [image](#image) (10)
- [recipes](#recipes) (ready-made mixes)

## Capability index

| capability | motions |
|---|---|
| overlay (transparent background — put it on top of other motions or your page) | `aurora`, `bubbles`, `caustics-godrays`, `curl-flow`, `embers`, `falling-petals`, `fireworks`, `flow-lines`, `insect-flight`, `lightning-flash`, `rain`, `snowfall`, `starfield-night`, `confetti-burst`, `electric-arcs`, `emote-pop`, `eyes-blink`, `giant-eye-reveal`, `scribble-ball`, `smoke-puffs`, `sparkle-burst`, `star-glint`, `hud-chrome`, `film-look`, `blur-in-title`, `chapter-header`, `comic-burst`, `end-card-credits`, `glyph-orbit-logo`, `kinetic-captions`, `mask-rise-title`, `number-counter`, `scene-tag`, `stamp-slam`, `story-caption-box`, `typewriter-code`, `typewriter-signature` |
| seamless loop | `iso-bar-chart`, `embers`, `sonar-ping` |
| takes your image (`src` / `images` / `heroSrc`) | `pointcloud-orbit`, `beat-montage`, `thumbnail-mosaic`, `depth-descent`, `topdown-terrain`, `giant-eye-reveal`, `callout-labels`, `comic-halftone`, `dot-matrix`, `duotone`, `film-look`, `glass-pane-grid`, `glitch-image`, `ken-burns`, `light-sweep`, `pixel-dither`, `xray-scan`, `sonar-ping`, `blur-in-title`, `chapter-header`, `comic-burst`, `end-card-credits`, `glyph-orbit-logo`, `mask-rise-title`, `number-counter`, `stamp-slam`, `story-caption-box`, `typewriter-code`, `browser-mockup`, `sms-thread`, `split-compare` |
| heavy (three.js / WebGL — prefer an exported video on mobile web) | `iso-blocks-3d`, `plan-tilt`, `pointcloud-orbit`, `terrain-build-3d`, `wireframe-build` |

## recipes

Ready-made mixes in `recipes/` — render with `node cli/mgl.mjs recipe <id>`, play on the web with `<MotionBackground recipe="<id>">` / `<MotionMix recipe="<id>">` / `<opus-motion recipe="<id>">`.

### `app-store-preview` — App store preview (portrait) (portrait)

![app-store-preview](../recipes/previews/app-store-preview.jpg)

A vertical 9:16 app preview / store video / story ad: hook title, the app conversation in a phone, then the rating.

**Mix:** `aurora` + `blur-in-title` → `sms-thread` → `number-counter` + `sparkle-burst`  
**Customise:** All three scenes are resolution independent; render with --format portrait (default for this recipe). Replace the hook title, sms-thread texts and the rating.

### `end-card` — End card with call to action (landscape)

![end-card](../recipes/previews/end-card.jpg)

The last shot of a video or the footer of a landing page: headline, short stat lines and a credit / CTA over a drifting sunrise.

**Mix:** `end-card-credits` (type) + `embers` (accent)  
**Customise:** Replace title / headline / lines / credit. Set fadeToBlack true when it is the very last shot of a video.

### `error-glitch` — Error / 404 glitch (landscape)

![error-glitch](../recipes/previews/error-glitch.jpg)

Error, 404, outage and "something broke" states — a glitching night plate with a stamped code.

**Mix:** `glitch-image` (backdrop) + `stamp-slam` (type)  
**Customise:** Change stamp-slam.lines / keyword. Use glitch-image.src for a screenshot of your own UI breaking.

### `event-countdown` — Event countdown (landscape)

![event-countdown](../recipes/previews/event-countdown.jpg)

Countdown to a launch, live stream or event: a night city with a big counter ticking down and fireworks at zero.

**Mix:** `city-skyline` (backdrop) + `number-counter` (type) + `fireworks` (accent)  
**Customise:** number-counter.keyframes counts 10 → 0 over 8 s; change the values / frames for your countdown and label. For a real-time web countdown render the number in HTML and use only city-skyline + fireworks.

### `hero-aurora-night` — Aurora night hero (landscape)

![hero-aurora-night](../recipes/previews/hero-aurora-night.jpg)

Dark website hero background or video title card: calm, premium, "wonder" mood. Put your headline in HTML on top (web) or in the title layer (video).

**Mix:** `aurora` (backdrop) + `embers` (accent) + `blur-in-title` (type)  
**Customise:** Change blur-in-title.title/subtitle (video) — on the web MotionBackground drops the type layer so your HTML headline sits there. Tint aurora.colors to the brand (e.g. ["#7AA2FF","#3B4FC4","#1B2466"]).

### `hero-blueprint-logo` — Blueprint logo reveal (landscape)

![hero-blueprint-logo](../recipes/previews/hero-blueprint-logo.jpg)

Developer-tool / AI / engineering brand intro: a rotating blueprint plan as texture and a typed monospace logotype on top.

**Mix:** `radial-blueprint` (backdrop) + `glyph-orbit-logo` (type)  
**Customise:** Change glyph-orbit-logo.logo / tagline / pill and accent (dot colour). The blueprint is dimmed to 38 % so it reads as texture, not a second subject.

### `hero-paper-sketch` — Paper sketch hero (landscape)

![hero-paper-sketch](../recipes/previews/hero-paper-sketch.jpg)

Warm, human, hand-made hero for craft / education / indie brands: a headline handwritten on paper with soft pencil wind lines.

**Mix:** `handwrite-on` (type) + `flow-lines` (accent)  
**Customise:** Replace handwrite-on.lines. Plays once and holds (writing should not loop). For a looping web background drop the type layer and keep the paper + wind lines.

### `history-timeline` — History timeline dial (landscape)

![history-timeline](../recipes/previews/history-timeline.jpg)

A company history, product versions or "how we got here" timeline: a blueprint dial turns one notch per era while the year rolls.

**Mix:** `era-dial` (subject) + `film-look` (frame)  
**Customise:** Replace era-dial.eras (label, year, icon: plan | press | book | computer | monitor | network). stepFrames × eras ≈ duration.

### `loading-loop` — Loading loop (square)

![loading-loop](../recipes/previews/loading-loop.jpg)

Seamless loading / waiting / processing loop for splash screens, empty states and "generating…" moments.

**Mix:** `sonar-ping` (subject)  
**Customise:** A 144-frame (3 × 48) sonar loop with no picture windows. Recolour with color and background. For dark UIs: background "#0E1116", color "#7AA2FF", paper false.

### `music-neon-promo` — Neon music promo (landscape)

![music-neon-promo](../recipes/previews/music-neon-promo.jpg)

Gig, club night, album drop or late-night food promo: a neon sign strikes on over a brick wall with drifting embers and film grain.

**Mix:** `neon-sign` (type) + `embers` (accent) + `film-look` (frame)  
**Customise:** Replace neon-sign.lines (text, color, glow, size). Keep to two lines; one line in a second colour.

### `ocean-explainer` — Ocean / science explainer (landscape)

![ocean-explainer](../recipes/previews/ocean-explainer.jpg)

Open a science or nature explainer: a serif title over the ocean, then a depth-gauge descent past landmarks with light rays.

**Mix:** `blur-in-title` → `depth-descent` + `caustics-godrays`  
**Customise:** Change blur-in-title.title / subtitle and depth-descent.landmarks ([{depth, label, …}]). The god-rays fade out as the descent gets dark (layer duration 140).

### `onboarding-steps` — Onboarding steps (landscape)

![onboarding-steps](../recipes/previews/onboarding-steps.jpg)

Explain a 3-step process or onboarding flow: a blueprint drawing builds while numbered step titles advance with a progress bar.

**Mix:** `line-draw-on` (subject) + `chapter-header` (type)  
**Customise:** Replace chapter-header.stages (one per step) and stageFrames (= duration / steps). line-draw-on.paths can draw your own SVG icon / product outline.

### `product-launch` — Product launch intro (landscape)

![product-launch](../recipes/previews/product-launch.jpg)

A 12-second launch / announcement video: teaser title over night sky, the product (website mockup), then "now available" with fireworks.

**Mix:** `starfield-night` + `blur-in-title` → `browser-mockup` → `fireworks` + `mask-rise-title`  
**Customise:** Replace the texts in all three scenes. browser-mockup.heroSrc can show your real screenshot. Swap the fireworks scene for confetti-burst for a lighter, daytime brand.

### `section-divider` — Section divider wipe (landscape)

![section-divider](../recipes/previews/section-divider.jpg)

A soft, full-width animated band between website sections, or a quick chapter break in a video (pencil wave rows sweep across).

**Mix:** `flow-lines` (backdrop) + `chapter-header` (type)  
**Customise:** On the web, give MotionBackground a short height (e.g. 160–240 px) with fit cover — the waves read as a divider band; drop the type layer (default) and put your section title in HTML.

### `social-short-captions` — Social short with captions (portrait) (portrait)

![social-short-captions](../recipes/previews/social-short-captions.jpg)

A vertical short / reel / TikTok: photo plates with a slow push, word-by-word kinetic captions with highlighted keywords, and a soft grade.

**Mix:** `ken-burns` + `kinetic-captions` → `ken-burns` + `kinetic-captions`  
**Customise:** Swap ken-burns.src for your photos and the caption lines (*word* = highlighted). Captions sit at the bottom third, clear of the platform UI; nothing else in the frame carries text.

### `stats-reveal` — Stats reveal (landscape)

![stats-reveal](../recipes/previews/stats-reveal.jpg)

One big number with context — users, revenue, growth — for an "in numbers" website section or a data beat in a video.

**Mix:** `number-counter` (type) + `flow-lines` (accent) + `star-glint` (accent)  
**Customise:** Set number-counter.keyframes ([[frame, value], …]; two close keys = dwell), label, prefix ("$") and unit ("%"). Web: plays once on view and holds the final number.

### `success-celebration` — Success celebration (square)

![success-celebration](../recipes/previews/success-celebration.jpg)

The "done!" moment: order placed, payment received, level complete, onboarding finished — a drawn check with a confetti burst.

**Mix:** `heart-draw-fill` (subject) + `confetti-burst` (accent)  
**Customise:** For an in-app overlay use just the confetti layer: <MotionPlayer motion="confetti-burst" overlay loop={false}/> over your UI. icon can be check | heart | star | bolt.

### `testimonial-chat` — Customer message testimonial (landscape)

![testimonial-chat](../recipes/previews/testimonial-chat.jpg)

Social proof as a real-feeling text thread: a customer message, your reply, the outcome badge — for testimonial sections, case-study videos and ads.

**Mix:** `sms-thread` (subject) + `film-look` (frame)  
**Customise:** Replace kicker / title / subtitle / contact / messages / badge with a real customer quote. Colours: background, ink, accent, mint. A quieter alternative: story-caption-box over ken-burns of the customer photo.

### `testimonial-quote` — Photo testimonial quote (landscape)

![testimonial-quote](../recipes/previews/testimonial-quote.jpg)

A customer quote typed in a cinematic caption box over a slowly pushed-in photo of the person or their work.

**Mix:** `ken-burns` (backdrop) + `film-look` (frame) + `story-caption-box` (type)  
**Customise:** Set ken-burns.src to your photo (public/ path or https URL) and the story-caption-box.items to the quote and name.

## motions by category

## text

### `blur-in-title` — Blur-in title card

![blur-in-title](../gallery/blur-in-title.jpg)

Wide-tracked title whose letters sharpen out of a blur with a random stagger, tagline and rule below, then blur-swap to a second title.

**Use for:** Documentary title cards, chapter/zone names, place names and calm caption swaps.  
**Rebuilt from:** video23 1:31-1:33, video23 0:07.6-0:09.1, video8 0:00-0:40, video10 0:02-0:40, video21 0:12  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** type · **Mood:** dark, cinematic, editorial  
**Capabilities:** overlay (`{"backdrop":"none","background":"transparent"}`) · text: `title`, `subtitle`, `swapTo` · image: `src` · weight: light  
**Pairs well with:** `aurora`, `starfield-night`, `caustics-godrays`, `embers`, `ken-burns`  
**Avoid:** Change title and subtitle (defaults ABYSSES / THE MIDNIGHT ZONE are sample text); set swapTo null for a single card.  

| prop | default | notes |
|---|---|---|
| `title` | `"ABYSSES"` | first title (use caps + wide tracking for the video23 look) |
| `subtitle` | `"less than five percent of the ocean has been explored"` | tagline under the first title |
| `swapTo` | `{"title":"THE MIDNIGHT ZONE","subtitle":"1 000 m  ·  no s…` | {title, subtitle} to blur-swap to at swapAt, or null for a single card |
| `swapAt` | `118` | frame the first title starts blurring out |
| `startFrame` | `10` |  |
| `stagger` | `"random"` | random (video23 card) \| ltr (video23 zone swap) |
| `staggerFrames` | `14` | max random delay per letter (0.45 s = 14 f) |
| `letterFrames` | `24` | frames each letter takes to sharpen (0.8 s = 24 f) |
| `maxBlur` | `12` | starting blur in px |
| `font` | `"serif"` | font role: serif \| sans \| grotesk \| display \| instrument \| mono \| rounded … |
| `weight` | `500` |  |
| `size` | `84` |  |
| `tracking` | `1.1` | letter spacing in em (video23 ≈ 1.1, video21 ≈ 0.4) |
| `color` | `"#EEF0F2"` |  |
| `subtitleFont` | `"serif"` |  |
| `subtitleItalic` | `true` |  |
| `subtitleColor` | `"#7d8b93"` |  |
| `underline` | `false` | thin rule under the subtitle that draws left→right and fades at its end |
| `layout` | `"center"` | center \| upper (video10 sky titles) \| lower-left (video23 zone caption) |
| `glow` | `0.3` | soft white glow opacity behind letters |
| `backdrop` | `"ocean"` | ocean \| ink \| dusk \| peaks \| dunes \| warm \| none (plain background colour) |
| `background` | `"#020406"` |  |
| `src` | `""` | optional public/ image behind the title |
| `fadeOut` | `true` | blur-fade everything out over the last 16 frames |

### `chapter-header` — Chapter header

![chapter-header](../gallery/chapter-header.jpg)

Numbered chapter/stage header that steps through titles: tracked title + segmented progress bar, era badge card, or vertical location tag.

**Use for:** Step-by-step explainers, timelines, era/location markers and chapter breaks.  
**Rebuilt from:** video8 0:00-0:36, video17 0:00-0:39, video14 0:00-2:06, video10 0:14.5-0:16.4  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** type · **Mood:** light, editorial  
**Capabilities:** overlay (`{"backdrop":"none"}`) · text: `stages` · image: `src` · weight: light  
**Pairs well with:** `line-draw-on`, `flow-lines`, `ken-burns`, `map-route`  

| prop | default | notes |
|---|---|---|
| `variant` | `"stage"` | stage (video8 top-left block) \| era (video14 top-right year card) \| location (video10 vertical tag) |
| `stages` | `[]` | [{title, subtitle}] stepped through in order; [] = built-in sample for the variant |
| `stageFrames` | `56` | frames per stage |
| `startFrame` | `8` | frame the first stage appears |
| `startIndex` | `1` | stage: number shown for the first stage |
| `total` | `8` | stage: total count shown after the slash (progress dashes = total + 1) |
| `scale` | `1.25` | overall size multiplier (1 = source size at 1080p) |
| `color` | `"#f0f4f6"` | text colour (stage) / letter + border colour (location) |
| `accent` | `"#c14d3c"` | location tag fill |
| `backdrop` | `"auto"` | auto (dunes / warm / dusk per variant) \| any backdrop kind |
| `src` | `""` | optional public/ image behind the header |

### `comic-burst` — Comic SFX burst

![comic-burst](../gallery/comic-burst.jpg)

Comic onomatopoeia (BONK! POP!) in a jagged halftone starburst that springs in after an impact frame, wobbles and boils, with speed lines and a shockwave ring.

**Use for:** Impacts, punchlines, notifications and any "sound you can see" beat.  
**Rebuilt from:** video12 0:07-0:66, video14 1:46-1:58, video17 0:28.15-0:28.20  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** type · **Mood:** mid, comic  
**Capabilities:** overlay (`{"backdrop":"none"}`) · text: `bursts` · image: `src` · weight: light  
**Pairs well with:** `speed-lines`, `comic-halftone`, `confetti-burst`  

| prop | default | notes |
|---|---|---|
| `bursts` | `[{"text":"BONK!","at":10,"x":0.66,"y":0.34,"palette":"pin…` | [{text, at, x, y, palette?, rotate?, size?, impact?, life?}] — palette pink \| yellow \| white \| cyan \| green; impact = 3-frame yellow smash frame before it; life = frames until it pops away |
| `points` | `15` | number of star points (12–18) |
| `speedLines` | `true` | radial speed lines whip in on each burst |
| `shockwave` | `true` | ground shockwave ellipse under each burst |
| `wobble` | `0.035` | post-pop scale wobble amount |
| `outline` | `"#1b1030"` | ink colour for outlines and shadows |
| `backdrop` | `"comic"` | comic \| dusk \| warm \| … procedural scene behind |
| `src` | `""` | optional public/ image as the scene |
| `seed` | `3` | changes the burst shapes |

### `end-card-credits` — End card credits

![end-card-credits](../gallery/end-card-credits.jpg)

Bottom scrim fades in over a drifting landscape; headline, mono stat lines and a credit stagger in with a blur fade-up, then fade to black.

**Use for:** Closing cards, "how it was made" stats, credits and calls to action over the last shot.  
**Rebuilt from:** video8 0:38.5-0:43, video17 0:38.7-0:42.8, video23 1:31  
**Default length:** 165 frames (5.5 s @ 30 fps)

**Roles:** type · **Mood:** mid, cinematic, editorial, nature  
**Capabilities:** overlay (`{"backdrop":"none"}`) · text: `title`, `headline`, `lines`, `credit` · image: `src` · weight: light  
**Pairs well with:** `embers`, `starfield-night`, `thumbnail-mosaic`  

| prop | default | notes |
|---|---|---|
| `title` | `""` | optional wide-tracked serif title shown above the headline ("" = none) |
| `headline` | `"every pixel you just saw is math."` | main end-card sentence |
| `lines` | `["0 images · 0 footage · 0 video models · 0 audio samples…` | mono stat lines (first at 85 % white, the rest 55 %) |
| `credit` | `"written by Claude"` | bold credit line |
| `startFrame` | `18` | frame the headline fades in |
| `offsets` | `[0.55,1.2,2]` | seconds after the headline for each stat line and the credit (video8: 0.55, 1.2, 2.0) |
| `scrimStrength` | `1` | bottom gradient scrim opacity |
| `headlineY` | `0.72` | vertical centre of the text block as a fraction of height |
| `fadeToBlack` | `true` | fade to black over the last 11 frames |
| `backdrop` | `"peaks"` | peaks (sunrise over mountains) \| dunes \| dusk \| ocean \| … scene behind |
| `src` | `""` | optional public/ image or still of your last shot |

### `glyph-orbit-logo` — Glyph-orbit logo build

![glyph-orbit-logo](../gallery/glyph-orbit-logo.jpg)

Glyphs fly in and orbit a ring, then resolve into a typed mono logotype (scrambled letter fragments, blue dot becomes the i tittle); a frame draws around it and tagline lines type below.

**Use for:** Logo reveals, brand end cards, product names and title lock-ups.  
**Rebuilt from:** video19 0:15.4-0:20.0  
**Default length:** 220 frames (7.3 s @ 30 fps)

**Roles:** type · **Mood:** dark, blueprint  
**Capabilities:** overlay (`{"backdrop":"none"}`) · text: `logo`, `tagline`, `pill` · image: `src` · weight: light  
**Pairs well with:** `radial-blueprint`, `star-glint`, `aurora`  
**Avoid:** Change logo / tagline / pill (defaults are sample text).  

| prop | default | notes |
|---|---|---|
| `logo` | `"Ideas in Motion"` | logotype text (monospaced; the first lowercase i/j gets the blue dot) |
| `tagline` | `["KNOWLEDGE WAS ALWAYS","THE TECHNOLOGY."]` | up to two lines typed under the logo: [small tracked line, bold line] |
| `pill` | `"BUILT IN THE OPEN."` | double-ruled label typed at the bottom ("" = none) |
| `glyphCount` | `16` | number of orbiting glyphs |
| `orbitRadius` | `230` | glyph orbit radius in px at 1080p |
| `framesPerChar` | `3` | logotype typing speed (frames per letter; each letter scrambles for 3 frames) |
| `typeStart` | `44` | frame the logotype starts typing |
| `color` | `"#DADDE5"` |  |
| `dim` | `"#8A8C93"` |  |
| `accent` | `"#5086FE"` | focus dot colour |
| `backdrop` | `"ink"` | ink (blueprint black) \| any backdrop kind |
| `src` | `""` |  |
| `seed` | `2` |  |

### `handwrite-on` — Handwrite-on title

![handwrite-on](../gallery/handwrite-on.jpg)

Text written glyph by glyph with a pen: outline strokes on, ink fill follows; optional fast un-write.

**Use for:** Friendly titles, end cards, chapter interstitials and handwritten captions.  
**Rebuilt from:** video4 0:26-0:28, video22 0:05-0:07, video22 0:14-0:16  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** type · **Mood:** light, paper  
**Capabilities:** paints its own background · text: `lines` · weight: light  
**Pairs well with:** `flow-lines`, `falling-petals`, `heart-draw-fill`, `sprout-grow`  

| prop | default | notes |
|---|---|---|
| `lines` | `[{"text":"ballpoint","color":"#C8363A"},{"text":"gambit",…` | array of {text, color?, size?, delay?} — each line written after the previous |
| `background` | `"#EFE9DC"` |  |
| `color` | `"#2B74C5"` |  |
| `font` | `"hand"` | hand \| serif \| sans \| grotesk |
| `size` | `150` |  |
| `framesPerGlyph` | `3` | writing speed (video4 ≈ 1.75 f @30fps, video22 ≈ 3 f) |
| `strokeWidth` | `2` |  |
| `unwriteAt` | `0` | frame to start erasing backwards at 2x speed (0 = never) |
| `paper` | `true` |  |
| `jitter` | `1.2` | pen wobble in px |

### `kinetic-captions` — Kinetic word captions

![kinetic-captions](../gallery/kinetic-captions.jpg)

Word-by-word pop-in captions; *starred* words sit on a solid highlight box.

**Use for:** Narrated shorts: subtitles that pace with the voice and punch key words.  
**Rebuilt from:** video10 0:04-0:42  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** type, frame · **Mood:** dark, editorial  
**Capabilities:** overlay (`{"background":"transparent"}`) · text: `lines` · weight: light  
**Pairs well with:** `ken-burns`, `film-look`, `beat-montage`  
**Avoid:** Do not put captions over a motion that already shows its own words (titles, signs, counters).  

| prop | default | notes |
|---|---|---|
| `lines` | `["People *bent* double","on the *sidewalk.*","It *isn't* …` | caption lines; wrap a word in *stars* to highlight it |
| `framesPerLine` | `50` | frames each line stays on screen |
| `background` | `"#1c2433"` |  |
| `position` | `"center"` | bottom \| center \| top |
| `highlightColor` | `"#d23a2c"` | box colour behind highlighted words |
| `size` | `64` |  |
| `variant` | `"kinetic"` | kinetic (word pop + highlight boxes) \| premium (calm line, words brighten as spoken, soft scrim) |
| `accent` | `"#E9C27A"` | premium: colour of *starred* words |

### `mask-rise-title` — Mask-rise title

![mask-rise-title](../gallery/mask-rise-title.jpg)

Editorial title whose letters rise out of baseline masks with motion blur; chapter variant rolls a red italic numeral and types a subtitle, stack variant builds an end-card headline.

**Use for:** Chapter titles, principle/step headers, end-card headlines and list reveals.  
**Rebuilt from:** video17 0:06.0-0:06.6, video17 0:38.7-0:42.8, video3 0:16.6-0:17.4  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** type · **Mood:** light, editorial  
**Capabilities:** overlay (`{"backdrop":"none","background":"transparent"}`) · text: `chapter`, `fromChapter`, `lines`, `sideCopy`, `sideMono` · image: `src` · weight: light  
**Pairs well with:** `fireworks`, `glass-pane-grid`, `duotone`, `confetti-burst`  
**Avoid:** Change chapter / lines / sideCopy / sideMono (defaults like STAGING, 12 PRINCIPLES are sample text).  

| prop | default | notes |
|---|---|---|
| `variant` | `"chapter"` | chapter (numeral + title + typed subtitle) \| stack (end-card lines + side column) |
| `chapter` | `{"number":"03","title":"STAGING","subtitle":"— One idea. …` | {number, title, kicker?, subtitle?} shown (after the swap if fromChapter is set) |
| `fromChapter` | `{"number":"02","title":"ANTICIPATION","subtitle":"— Wind …` | previous chapter shown first and swapped out at swapAt (null = enter fresh, numeral rolls from 00) |
| `swapAt` | `78` | frame the previous title exits upward |
| `lines` | `[{"numeral":"12","word":"PRINCIPLES."},{"numeral":"0","wo…` | stack: [{numeral?, word}] headline lines |
| `sideCopy` | `["Every frame and every sound","in this film is code."]` | stack: body lines in the right column |
| `sideMono` | `["8,951 LINES OF CODE · 37 FILES","0 KEYFRAMES · MADE WIT…` | stack: mono lines typed under the rule (last one in accent colour) |
| `startFrame` | `8` |  |
| `letterFrames` | `7` | frames each letter takes to rise |
| `letterStagger` | `1` | frames between letters (video17 ≈ 1) |
| `lineStagger` | `12` | stack: frames between lines (0.4 s = 12) |
| `typeSpeed` | `30` | subtitle typing, characters per second |
| `background` | `"#EEEBDE"` |  |
| `ink` | `"#0B0D0C"` |  |
| `accent` | `"#ED3821"` | numeral / cursor / progress colour |
| `muted` | `"#888578"` |  |
| `progressRule` | `true` | chapter: global progress rule + timecode at the bottom |
| `cropMarks` | `true` |  |
| `exit` | `true` | compress (chapter) or skew-slide (stack) out over the last 12 frames |
| `backdrop` | `"cream"` | cream \| ink \| dunes \| … (plain background colour for cream) |
| `src` | `""` |  |

### `neon-sign` — Neon sign ignite

![neon-sign](../gallery/neon-sign.jpg)

Dark plum plate on a brick wall; rounded neon lettering strikes on letter by letter with flicker, then hums, with one faulty letter stuttering and glow spilling onto the wall.

**Use for:** Shop/venue names, nightlife or retro beats, "open" moments and glowing titles.  
**Rebuilt from:** video20 1:30.7-1:32.5  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** type · **Mood:** dark, neon, night  
**Capabilities:** paints its own background · text: `lines` · weight: light  
**Pairs well with:** `embers`, `film-look`, `rain`, `crowd-bob`  
**Avoid:** Change lines (default NOODLES / open late is sample text).  

| prop | default | notes |
|---|---|---|
| `lines` | `[{"text":"NOODLES","color":"#f59ac4","glow":"#be5b80"},{"…` | [{text, color?, glow?, font?, size?}] neon lines stacked on the plate (size is relative to the first line) |
| `igniteAt` | `16` | frame the first letters strike |
| `igniteSpread` | `22` | frames over which the letters strike in random order |
| `faultyLetter` | `4` | index (across all lines) of a letter that keeps stuttering; -1 = none |
| `plateColor` | `"#45323e"` | sign plate colour |
| `wallColor` | `"#2a1c22"` | brick colour |
| `color` | `"#f59ac4"` | default tube colour |
| `glow` | `"#be5b80"` | default outer glow colour |
| `font` | `"neon"` | font role for lines without their own (neon = Tilt Neon) |
| `tracking` | `0.08` | letter spacing in em for the main font |
| `pullBack` | `true` | start tight on the plate and pull back after ignition |
| `seed` | `5` | changes the ignition order and stutters |

### `number-counter` — Number counter

![number-counter](../gallery/number-counter.jpg)

Huge thin-mono counter that ticks or odometer-rolls through dwell keyframes, with unit, label and derived readouts (pressure, light, temperature, percent).

**Use for:** Depth/altitude/speed meters, growing stats, countdowns, progress percentages and scoreboards.  
**Rebuilt from:** video23 0:03-1:20, video19 0:13.6-0:14.3, video17 0:03.0-0:04.4  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** type · **Mood:** dark, hud  
**Capabilities:** overlay (`{"backdrop":"none"}`) · text: `keyframes`, `label`, `unit`, `prefix`, `readoutLabels` · image: `src` · weight: light  
**Pairs well with:** `star-glint`, `flow-lines`, `confetti-burst`, `iso-bar-chart`  
**Avoid:** Set label, unit ('' to hide 'm'), readouts [] and keyframes — defaults are the DEPTH dive sample.  

| prop | default | notes |
|---|---|---|
| `keyframes` | `[[0,0],[14,0],[62,760],[96,868],[168,10935],[180,10935]]` | [[frame, value], …] monotone-cubic; put two close keys to dwell (slow down) near a landmark |
| `mode` | `"roll"` | roll (odometer digit strips with motion blur) \| tick (re-typeset each frame) |
| `label` | `"DEPTH"` | small tracked label above the number |
| `unit` | `"m"` | unit after the number ("" = none) |
| `prefix` | `""` | text before the number (e.g. "$", "×") |
| `decimals` | `0` | decimal places (tick mode; roll mode uses integers) |
| `separator` | `" "` | thousands separator (" " thin space, ",", "") |
| `readouts` | `["pressure","light","temp"]` | derived stats under the number: pressure \| light \| temp \| percent \| rate |
| `readoutLabels` | `[]` | override the readout labels (same order) |
| `layout` | `"center"` | center (big, standalone) \| hud (top-left overlay block like video23) |
| `gauge` | `false` | semicircle gauge above the number (video17 anticipation meter); centre layout only |
| `size` | `300` | number size in px at 1080p (auto-shrinks to fit) |
| `labelSize` | `28` | label size in px at 1080p (centre layout) |
| `labelColor` | `"#6c95ac"` |  |
| `numberColor` | `"#a9d8ee"` |  |
| `accent` | `"#ED3821"` |  |
| `backdrop` | `"ocean"` | ocean \| ink \| dunes \| … scene behind |
| `linkBackdrop` | `true` | ocean backdrop darkens with the value (log scale) like a dive |
| `src` | `""` | optional public/ image behind |

### `scene-tag` — Scene index tag

Small glass pill in a corner with an index number, a hairline and a name; slides in, holds, fades. Transparent overlay.

**Use for:** Labelling items in showreels, galleries, portfolios, product feature tours and step-by-step videos.  
**Rebuilt from:** library  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** type, accent · **Mood:** dark  
**Capabilities:** overlay (`{"background":"transparent"}`) · text: `index`, `name`, `family` · weight: light  
**Pairs well with:** `hud-chrome`, `film-look`  

| prop | default | notes |
|---|---|---|
| `index` | `"042"` | index text, e.g. "042 / 108" |
| `name` | `"Depth Descent"` | item name (shown in tracked caps) |
| `family` | `"environment"` | small second line ("" to hide) |
| `corner` | `"top-left"` | top-left \| top-right \| bottom-left \| bottom-right |
| `tone` | `"light"` | light (for dark scenes) \| dark (for bright scenes) |
| `accent` | `"#E9C27A"` |  |
| `accentDark` | `"#8A5A12"` |  |
| `inAt` | `6` |  |
| `outBefore` | `4` |  |
| `background` | `"#1a2230"` | "transparent" to overlay (default shows a preview colour) |

### `stamp-slam` — Stamp slam + keyword pop

![stamp-slam](../gallery/stamp-slam.jpg)

A rotated vermilion label slams down from 1.3x like a rubber stamp over the scene (the serif title blurs away), then a huge keyword punches in.

**Use for:** Hard facts, place/date stamps, verdicts and single-word emphasis beats.  
**Rebuilt from:** video10 0:34.7-0:34.9, video10 0:17.0-0:17.2, video19 0:10-0:12, video21 0:26.7  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** type · **Mood:** mid, editorial  
**Capabilities:** overlay (`{"backdrop":"none"}`) · text: `lines`, `preTitle`, `keyword` · image: `src` · weight: light  
**Pairs well with:** `glitch-image`, `duotone`, `lightning-flash`  
**Avoid:** Change lines / preTitle / keyword (defaults LONDON 1736 / GIN are sample text). Not a default choice for every title.  

| prop | default | notes |
|---|---|---|
| `lines` | `["LONDON","1736"]` | stamp lines; the 2nd+ lines render 1.25x (years / numbers) |
| `preTitle` | `"The hard way"` | serif title shown first that blurs out as the stamp lands ("" = none) |
| `keyword` | `"GIN"` | big word that pops later ("" = none) |
| `keywordStyle` | `"plain"` | plain \| box (outlined plate) \| indicator (video19 3-node slider under the word) |
| `slamAt` | `36` | frame the stamp hits (5-frame slam) |
| `keywordAt` | `84` | frame the keyword pops |
| `rotation` | `-4` | final stamp rotation in degrees (−4…−6) |
| `x` | `0.5` | stamp centre x as a fraction of width |
| `y` | `0.22` | stamp centre y as a fraction of height (video10 ≈ 0.18–0.22) |
| `keywordY` | `0.64` | keyword centre y fraction (video10 ≈ 0.64) |
| `color` | `"#c14d3c"` | stamp fill (multiply-blended) |
| `textColor` | `"#f3ead8"` |  |
| `keywordColor` | `"#cb4e3d"` |  |
| `font` | `"serif"` | stamp font role |
| `keywordFont` | `"sans"` | keyword font role (sans = Inter heavy, display = Archivo Black) |
| `size` | `64` | stamp text size in px at 1080p |
| `shake` | `true` | camera jolt on impacts |
| `push` | `0.06` | slow scene push-in amount over the clip |
| `backdrop` | `"dusk"` | dusk \| peaks \| warm \| comic \| … procedural scene behind |
| `src` | `""` | optional public/ image as the scene |

### `story-caption-box` — Story caption box

![story-caption-box](../gallery/story-caption-box.jpg)

Double-ruled black narrative caption box under a letterboxed scene (RPG-style typing), or a yellow comic time-stamp plate ("7:00 AM  RISE AND SHINE").

**Use for:** Story narration, game cutscene text, timeline time-stamps and location/time chyrons.  
**Rebuilt from:** video21 0:17.2-0:18.2, video12 0:02-1:30  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** type · **Mood:** dark, comic, cinematic, editorial  
**Capabilities:** overlay (`{"backdrop":"none"}`) · text: `items` · image: `src` · weight: light  
**Pairs well with:** `ken-burns`, `film-look`, `light-sweep`, `pixel-dither`  

| prop | default | notes |
|---|---|---|
| `variant` | `"box"` | box (video21 narrative box) \| plate (video12 time-stamp plate) |
| `items` | `[]` | [{text, tag?}] shown in order; plate uses tag as the time and text as the label; [] = built-in sample |
| `framesPerItem` | `66` | frames each caption stays |
| `startFrame` | `8` | frame the first caption appears |
| `reveal` | `"type"` | box: type (RPG typing + ▼) \| instant (video21) \| fade |
| `charsPerSecond` | `36` | typing speed for reveal = type |
| `letterbox` | `true` | box: black cinema bars top and bottom |
| `textColor` | `"#ffffff"` |  |
| `boxColor` | `"#000000"` |  |
| `borderColor` | `"#8a8a8a"` | box outline + inner rule colour (video21 #616161 on 1080p) |
| `plateColor` | `"#ffd93a"` | plate fill |
| `inkColor` | `"#1b1030"` | plate border / shadow / text colour |
| `size` | `34` | caption text size in px at 1080p (plate scales with it) |
| `backdrop` | `"auto"` | auto (aurora pixel night for box, comic room for plate) \| any backdrop kind |
| `src` | `""` | optional public/ image as the scene |

### `typewriter-code` — Typewriter code window

![typewriter-code](../gallery/typewriter-code.jpg)

macOS-style code editor or terminal window that types syntax-coloured code with a block cursor; the panel grows upward line by line.

**Use for:** Show the code behind a visual, a command being run, or a "made with code" credit beat.  
**Rebuilt from:** video8 0:05-0:30, video17 0:00-0:43 footer, video13 0:00-0:20  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** type · **Mood:** mid, hud  
**Capabilities:** overlay (`{"backdrop":"none"}`) · text: `lines`, `title` · image: `src` · weight: light  
**Pairs well with:** `glitch-image`, `hud-chrome`, `radial-blueprint`  

| prop | default | notes |
|---|---|---|
| `lines` | `["// fractal brownian motion","float fbm(vec2 p) {","  fl…` | code lines (strings, or {text, color}); in terminal mode "$ " lines type, other lines are output |
| `mode` | `"editor"` | editor (line numbers, syntax colours) \| terminal (bold, prompt/output colours) |
| `title` | `"world.glsl"` | filename centred in the title bar |
| `charsPerSecond` | `42` | typing speed (video17 ≈ 30, video8 time-boxes ≈ 150 chars in 1 s) |
| `startFrame` | `10` | frame the first character types (panel fades in 6 frames before) |
| `outputDelay` | `8` | terminal: frames between a command finishing and its output appearing |
| `position` | `"corner"` | corner (bottom-left panel) \| center (bigger, centred) |
| `fontSize` | `28` | code size in px at 1080p |
| `lineNumbers` | `true` |  |
| `colors` | `{}` | override any of keyword, fn, number, string, comment, text, prompt, command, ok, warn, error, lineNo |
| `panelColor` | `""` | window body colour (empty = grey for editor, plum for terminal) |
| `headerColor` | `""` | title bar colour (empty = auto) |
| `cursorColor` | `"#e6e6e6"` | block cursor colour (video17 uses red #ED3821) |
| `backdrop` | `"auto"` | auto \| dunes \| warm \| ink \| cream \| peaks \| dusk \| ocean \| none — procedural scene behind the panel |
| `src` | `""` | optional public/ image behind the panel (overrides backdrop) |

### `typewriter-signature` — Typewriter signature

![typewriter-signature](../gallery/typewriter-signature.jpg)

Small lowercase credit typed into a corner two frames per character, no cursor; optional glyph-scramble dissolve out.

**Use for:** Sign-offs, maker credits, version tags and quiet end stamps.  
**Rebuilt from:** video1 1:06.2-1:06.5, video6 0:52.3-0:53.2  
**Default length:** 90 frames (3.0 s @ 30 fps)

**Roles:** type · **Mood:** dark, editorial  
**Capabilities:** overlay (`{"background":"transparent"}`) · text: `text` · weight: light  
**Pairs well with:** `compass-construct`, `end-card-credits`, `starfield-night`  

| prop | default | notes |
|---|---|---|
| `text` | `"opus 5.5"` | the credit text |
| `framesPerChar` | `2` | frames per typing step (2 = video6; video1 uses 2 with charsPerStep 2) |
| `charsPerStep` | `1` | characters added per step |
| `startFrame` | `24` | frame the first character appears |
| `wordPause` | `4` | extra frames held after the first word |
| `scrambleOut` | `true` | glyph-scramble + pixel dissolve exit |
| `scrambleAt` | `0` | frame the scramble-out starts (0 = 14 frames before the end) |
| `position` | `"bottom-right"` | bottom-right \| bottom-left \| top-right \| top-left \| center |
| `font` | `"rounded"` | font role (rounded = Quicksand, video1/6 look) |
| `weight` | `300` |  |
| `size` | `44` | glyph size in px at 1080p |
| `color` | `"#E9E0D5"` |  |
| `tracking` | `0.05` |  |
| `background` | `"#15100E"` | scene colour (use "transparent" to overlay) |
| `decor` | `true` | draw a faint flower-of-life construction behind the credit |
| `decorColor` | `"#6f86d8"` |  |

## transition

### `transition-reel` — Transition reel

![transition-reel](../gallery/transition-reel.jpg)

Every scene transition in the library, one after another, between contrasting labelled colour panels.

**Use for:** Previewing and choosing transitions; each panel names the transition (and variant) that revealed it.  
**Rebuilt from:** video1, video4, video6, video8, video9, video10, video11, video14, video16, video17, video18, video19, video20, video21  
**Default length:** 1858 frames (61.9 s @ 30 fps)

**Roles:** transition · **Mood:** —  
**Capabilities:** paints its own background · text: `title` · weight: light  

| prop | default | notes |
|---|---|---|
| `types` | `["fade","slide","wipe","clock","flip","iris","blob","tear…` | transition entries to show in order, "type" or "type:variant" (e.g. "page-turn:roll") |
| `holdFrames` | `36` | frames each panel holds between transitions |
| `transitionFrames` | `0` | length of every transition in frames; 0 = each type's recommended length |
| `title` | `"Transitions"` | label on the opening panel |

## shape

### `bouncing-ball` — Bouncing ball (squash, anticipation, crack, hop)

![bouncing-ball](../gallery/bouncing-ball.jpg)

A red ball over a dark dev-HUD: gravity bounces with velocity stretch and 1-frame squash, or a charge-gauge launch, an exaggerated ground-cracking drop, or beat hops that write notes on a staff.

**Use for:** Explaining physics / animation principles, playful logo or mascot drops, "charging then launch" beats, heavy-impact emphasis.  
**Rebuilt from:** video17 0:00-0:05 squash-stretch-bounce + anticipation-charge-launch, video17 0:21-0:24 note-per-bounce, video17 0:27-0:30 impact-frame + ground-crack-debris  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, hud, playful, night  
**Capabilities:** paints its own background · text: `title`, `subtitle` · weight: light  
**Pairs well with:** `hud-chrome`, `easing-graph`, `onion-skin-arc`  

| prop | default | notes |
|---|---|---|
| `mode` | `"bounce"` | 'bounce' (gravity bounces) \| 'anticipation' (charge gauge + launch) \| 'crack' (exaggerated drop, impact frame, ground crack + debris) \| 'hop' (beat hops, a note per landing) |
| `background` | `""` | background colour; '' = mode default (ink / pink for hop; crack flips to cream) |
| `color` | `"#ED3821"` | ball colour |
| `radius` | `69.5` | ball radius in u (1080-short-side px) |
| `restitution` | `0.67` | velocity kept per bounce (0.67 measured) |
| `gravity` | `7100` | gravity in u/s² (7100 measured at 1080p) |
| `maxStretch` | `0.3` | max extra vertical stretch from speed |
| `squash` | `0.55` | scaleY on the hardest impact frame |
| `notes` | `["E","G","A","G","E","D","E","C"]` | hop mode: note names on the staff, one per landing (C D E F G A B C5 D5…) |
| `bpm` | `160` | beat rate (hop period, HUD beat squares) |
| `hud` | `true` | show the HUD chrome + chapter title |
| `numeral` | `""` | chapter numeral ('' = mode default) |
| `title` | `""` | chapter title, \n for a second line ('' = mode default) |
| `subtitle` | `""` | small line under the title |
| `code` | `""` | live code comment typed in the footer |
| `seed` | `4` | crack / debris randomness |

### `branch-grow` — Branching growth (dendrites / tree / network)

![branch-grow](../gallery/branch-grow.jpg)

A glowing recursive branching structure draws itself level by level from the trunk in a navy HUD void, gold dots pop at every tip, signal pulses run root to tips, and a binary-tree diagram counts the doubling.

**Use for:** Growth, learning, neural networks, family trees, decision trees, "one idea spreads into many" beats.  
**Rebuilt from:** video11 0:16.1-0:17.0 branching-growth-stroke, video11 0:03.5-0:05.2 branching-tree-diagram  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, hud  
**Capabilities:** paints its own background · text: `label`, `sublabel` · weight: light  
**Pairs well with:** `radial-blueprint`, `pair-field`, `callout-labels`  

| prop | default | notes |
|---|---|---|
| `layout` | `"neuron"` | 'neuron' (dendrites up, roots down, inside a reticle) \| 'tree' (one tree from the bottom) \| 'radial' (network from the centre) |
| `depth` | `6` | recursion depth (levels) |
| `angleSpread` | `28` | branch angle from the parent in degrees (25-35 measured) |
| `lengthDecay` | `0.74` | child length / parent length (0.72 measured) |
| `framesPerLevel` | `8` | frames to draw one level (children start at 70 %) |
| `startAt` | `10` | frame the trunk starts drawing |
| `color` | `"#C8D0F5"` |  |
| `tipColor` | `"#D3B761"` | synapse dot colour at the tips |
| `pulseColor` | `"#7FE0E8"` | signal pulse colour |
| `pulses` | `true` | run signal pulses root -> tips after growth |
| `diagram` | `true` | show the doubling binary-tree diagram + count |
| `label` | `"dendrites · synapses form"` | typed mono label |
| `sublabel` | `"one cell, thousands of connections"` | second label line |
| `seed` | `3` | branch randomness |

### `call-response` — Call & response (two spheres)

![call-response](../gallery/call-response.jpg)

Blue and pink glossy spheres take turns pinging rings, flash a colour-swap halo, the paper tilts into a perspective floor, sparkles ride the ring crossings and a lotus blooms between them.

**Use for:** Two agents / users / systems communicating, a handshake or sync moment, "a result blooms where two inputs meet".  
**Rebuilt from:** video4 0:17.75-0:22.95  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, paper  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `chat-bubbles`, `handwrite-on`, `sparkle-burst`  

| prop | default | notes |
|---|---|---|
| `background` | `"#ECE4D7"` |  |
| `colors` | `["#3780E7","#E546AA"]` | [listener, partner] sphere colours |
| `ringColors` | `["#3383CB","#E546AA"]` | [listener, partner] ring stroke colours |
| `turnFrames` | `11` | frames between alternate pings after the tilt |
| `tiltStart` | `62` | frame the paper starts tilting into a floor |
| `tiltFrames` | `24` | length of the tilt (easeInOutCubic) |
| `pitchTo` | `70` | final camera pitch in degrees (0 = top-down) |
| `lotus` | `true` | bloom a lotus between the spheres after the joint ping |
| `lotusColors` | `["#F8B6E6","#E546AA","#F2B33D"]` | [petal light, petal deep, centre] |
| `sparkles` | `true` | sparkles at pink/blue ring intersections |
| `sparkleColor` | `"#FFF6B0"` |  |
| `paper` | `true` | paper grain + vignette |

### `cell-division` — Cell division doubling

![cell-division](../gallery/cell-division.jpg)

Glossy gold nuclei bud and split inside an egg outline, doubling every few frames up to 256, while a corner binary tree grows one level per doubling.

**Use for:** Exponential growth, doubling, compounding, replication, "one becomes many".  
**Rebuilt from:** video6 0:03.15-0:04.6  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `number-counter`, `science-reticle`, `swimmers-converge`  

| prop | default | notes |
|---|---|---|
| `background` | `"#180F0B"` |  |
| `outlineColor` | `"#E9E0D5"` | egg outline / count text colour |
| `nucleusColors` | `["#F6C886","#E7B96B","#B8863F"]` | [highlight, base, rim] of the gold nuclei |
| `lineColor` | `"#7589CB"` | spindle lines and binary tree |
| `dotColor` | `"#EFE6D2"` | colour the nuclei flatten to at the end |
| `generations` | `8` | number of doublings (8 = 256 nuclei, max 10) |
| `framesPerDoubling` | `8` | frames per doubling (source: 5 at 30 fps) |
| `start` | `20` | frame of the first split |
| `tree` | `true` | grow the binary-tree diagram in the top-right corner |
| `showCount` | `true` | show the running count under the tree |
| `seed` | `6` |  |

### `compass-construct` — Compass geometry construct

![compass-construct](../gallery/compass-construct.jpg)

A drafting compass sweeps a circle and the six Seed-of-Life petals, a ruler draws the hexagon with a bright tip, nodes glint, then the construction spins and implodes to a point.

**Use for:** Sacred-geometry / "first principles" / "how it is built" openers, logo construction, a geometric intro or outro.  
**Rebuilt from:** video6 0:02.00-0:03.15, video6 0:51.3-0:53.2  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, blueprint  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `glyph-orbit-logo`, `hex-comb-build`, `typewriter-signature`  

| prop | default | notes |
|---|---|---|
| `background` | `"#180F0B"` |  |
| `lineColor` | `"#7589CB"` | construction lines (circle, petals, vesica) |
| `hexColor` | `"#C9D1F5"` | hexagon edges |
| `nodeColor` | `"#F6C886"` | gold centre / node glints |
| `compassColor` | `"#E9E0D5"` | compass legs and radius line |
| `radius` | `0.27` | circle radius as a fraction of the short side |
| `speed` | `1` | time multiplier (2 = twice as fast, like the source) |
| `showCompass` | `true` | show the compass arms + pivot while arcs are drawn |
| `vesica` | `true` | add the vertical vesica lens and two gold nodes |
| `implode` | `true` | end by spinning -60 deg, shrinking and un-drawing into a point |
| `seed` | `6` |  |

### `easing-graph` — Easing graph + compare tracks

![easing-graph](../gallery/easing-graph.jpg)

A linear black ball and an eased red ball race along two tracks with per-frame spacing ticks, while a dark graph-editor panel drags its bezier handles from linear to an S-curve and prints cubic-bezier(...).

**Use for:** Explaining easing / timing, UI motion specs, "slow in, slow out" lessons, any linear-vs-curved comparison.  
**Rebuilt from:** video17 0:14.75-0:17.75 ease-compare-tracks + graph-editor-curve  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, editorial  
**Capabilities:** paints its own background · text: `title`, `subtitle` · weight: light  
**Pairs well with:** `bouncing-ball`, `hud-chrome`, `onion-skin-arc`  

| prop | default | notes |
|---|---|---|
| `background` | `"#EEEBDE"` |  |
| `easing` | `[0.7,0,0.3,1]` | target cubic-bezier [x1, y1, x2, y2] the graph handles drag to |
| `traverse` | `30` | frames per track traverse (30 = 1.0 s) |
| `tickCount` | `16` | spacing ticks per track (one per sampled frame) |
| `colorA` | `"#0B0D0C"` | linear ball / tick colour |
| `colorB` | `"#ED3821"` | eased ball / tick colour |
| `labelA` | `"A · LINEAR"` |  |
| `labelB` | `"B · EASE IN · EASE OUT"` |  |
| `zones` | `["SLOW OUT","FAST","SLOW IN"]` | three labels under the eased track (start, middle, end) |
| `hud` | `true` | show HUD chrome + chapter title |
| `numeral` | `"06"` |  |
| `title` | `"SLOW IN & SLOW OUT"` |  |
| `subtitle` | `"Ease into every pose. Ease out of it."` |  |
| `code` | `"x = x0 + Δx·ease(u) // same frames, different spacing"` |  |

### `flat-to-3d-sphere` — Flat disc to 3D sphere

![flat-to-3d-sphere](../gallery/flat-to-3d-sphere.jpg)

A flat red disc gains a wireframe, a perspective floor grid and gradient 3D shading with specular and cast shadow, leader-line callouts (highlight, terminator, core shadow…) type in, then it renders back flat.

**Use for:** Explaining form / lighting / "2D vs 3D", product feature callouts on a hero object, before-after render reveals.  
**Rebuilt from:** video17 0:30-0:34.5 flat-to-3d-sphere + callout-leader-labels, video17 0:38.3-0:38.7 render-flatten  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, 3d, editorial  
**Capabilities:** paints its own background · text: `title`, `subtitle` · weight: light  
**Pairs well with:** `callout-labels`, `hud-chrome`, `easing-graph`  

| prop | default | notes |
|---|---|---|
| `background` | `"#EEEBDE"` | flat background (also the HUD colour reference) |
| `studio` | `["#FBF3E6","#C2BDB1"]` | studio gradient [centre, vignette] shown while the ball is 3D |
| `color` | `"#ED3821"` | ball base colour |
| `highlight` | `"#FF6A50"` | lit-side colour of the 3D shading |
| `shadowCore` | `"#5D100A"` | core-shadow colour |
| `callouts` | `[{"label":"HIGHLIGHT","sub":"where the light lands","anch…` | leader labels: anchor = [x, y] in ball radii from the centre (y > 1.05 = on the floor), side = -1 left / 1 right |
| `flattenAt` | `150` | frame the render flattens back to the flat disc |
| `hud` | `true` | show HUD chrome + chapter title |
| `numeral` | `"11"` |  |
| `title` | `"SOLID DRAWING"` |  |
| `subtitle` | `"Think in volume, light and weight."` |  |
| `code` | `"L = albedo·max(n·l, 0) + spec // light it like an object"` |  |

### `gears` — Meshing gears

![gears](../gallery/gears.jpg)

Procedural hatched cog wheels pop in and mesh, counter-rotating at the correct tooth ratios; coloured-pencil gears on paper or white line-art gears on black.

**Use for:** "How it works" / process / mechanism sections, cause and effect, teamwork, machinery of an idea.  
**Rebuilt from:** video20 3:03.7-3:09, video19 0:13.35-0:14.4 (background gears)  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, paper, blueprint  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `smoke-puffs`, `line-draw-on`, `chapter-header`  

| prop | default | notes |
|---|---|---|
| `style` | `"filled"` | "filled" (video20 coloured pencil on paper) or "line" (video19 white line art on black) |
| `gears` | `[]` | list of {teeth, parent, angle(deg), color?}: each gear meshes with its parent at that angle; [] = built-in 8-gear train |
| `module` | `22` | tooth size in u (pitch radius = module x teeth / 2) |
| `speed` | `14` | root gear speed in degrees per second (children follow the tooth ratio) |
| `colors` | `[]` | gear fill colours, cycled ([] = style palette) |
| `background` | `""` | background colour ("" = style default) |
| `inkColor` | `""` | outline colour ("" = style default) |
| `hatch` | `true` | pencil hatching on the faces |
| `origin` | `[]` | [x, y] of the root gear as fractions of the frame ([] = default) |

### `heart-draw-fill` — Icon draw, fill & glow (heart)

![heart-draw-fill](../gallery/heart-draw-fill.jpg)

On warm sketch paper a pencil draws a red heart outline (or star / check / bolt), the hatched fill fades in, 4-point sparkles twinkle around it and a soft warm glow pulses while it hovers.

**Use for:** Love / thanks / success end beats, like-subscribe moments, a finished checkmark or a power-up icon.  
**Rebuilt from:** video20 3:29.5-3:33 heart-draw-fill-glow, video20 3:36.5 fade-to-paper heart  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, paper  
**Capabilities:** paints its own background · text: `icon` · weight: light  
**Pairs well with:** `confetti-burst`, `sparkle-burst`, `handwrite-on`  

| prop | default | notes |
|---|---|---|
| `icon` | `"heart"` | 'heart' \| 'star' \| 'check' \| 'bolt' |
| `background` | `"#E9D3B6"` | paper colour |
| `color` | `"#E38C76"` | fill colour (hatched) |
| `outlineColor` | `"#C0403E"` | pencil outline colour |
| `glowColor` | `"#FFB070"` | radial glow colour |
| `size` | `0.46` | icon width as a fraction of the short side |
| `drawDur` | `36` | frames for the outline draw-on (36 measured) |
| `startAt` | `8` | frame the outline starts drawing |
| `glow` | `true` | warm glow fades in after the fill |
| `pencil` | `true` | show the pencil that draws the outline |
| `sparkleCount` | `5` | twinkling 4-point sparkles around the icon |
| `frame` | `true` | draw the torn deckle paper frame |

### `hex-comb-build` — Hex comb build

![hex-comb-build](../gallery/hex-comb-build.jpg)

Cream wax hexagon edges grow segment by segment with node balls and compass-circle previews, cells fill with honey colours, wax caps spiral shut and the comb tilts into extruded prisms.

**Use for:** Building a system cell by cell, modular growth, teamwork / hive, filling a grid of slots.  
**Rebuilt from:** video6 0:14.67-0:16.6, video6 0:09.25-0:09.92 (spiral cap), video6 0:02.6-0:03.1 (prism extrude)  
**Default length:** 200 frames (6.7 s @ 30 fps)

**Roles:** subject · **Mood:** dark, nature  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `compass-construct`, `number-counter`, `glyph-orbit-logo`  

| prop | default | notes |
|---|---|---|
| `background` | `"#180F0B"` |  |
| `waxColor` | `"#F2EAD8"` | wax edge colour |
| `guideColor` | `"#7589CB"` | compass-preview circle colour |
| `ghostColor` | `"#3A2A1A"` | faint pre-existing comb outline colour |
| `cellColors` | `["#E8B04A","#E8B04A","#D99A3A","#E8B04A","#E8B04A","#C847…` | fill colours picked per cell (honey, pollen...) |
| `rings` | `2` | rings of cells built around the seed cell (1 = 7 cells, 2 = 19, 3 = 37) |
| `edgeLength` | `98` | hexagon edge length in u |
| `framesPerEdge` | `5` | frames each wax edge takes to grow (easeOutQuad) |
| `edgeStagger` | `1.6` | frames between edge starts |
| `compassPreview` | `true` | lavender compass circles preview each next cell |
| `fill` | `true` | fill finished cells with colour |
| `caps` | `0.25` | fraction of filled cells that get a spiral wax cap |
| `extrude` | `true` | end by tilting the comb into perspective and extruding prisms |
| `seed` | `6` |  |

### `line-draw-on` — Line-art draw-on

![line-draw-on](../gallery/line-draw-on.jpg)

Line art constructs itself stroke by stroke with a pen nib riding each tip, then groups of lines recolour to a highlight; defaults to a blueprint building elevation.

**Use for:** Build any diagram, blueprint, wireframe, icon or logo line by line; highlight the part you are talking about.  
**Rebuilt from:** video20 2:52.5-2:55 (blueprint), video1 1:03.1-1:04.6 (crease recolour), video10 0:23.0-0:23.65, video19 engrave-stroke-draw  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** subject · **Mood:** mid, blueprint  
**Capabilities:** paints its own background · text: `caption` · weight: light  
**Pairs well with:** `chapter-header`, `callout-labels`, `gears`  

| prop | default | notes |
|---|---|---|
| `paths` | `[]` | SVG path strings in any coordinate space (auto-fitted); empty = built-in blueprint drawing |
| `groups` | `[]` | group index per path (for the highlight recolour) |
| `background` | `"#2E5E91"` |  |
| `grid` | `true` | blueprint grid background |
| `strokeColor` | `"#F2F6FF"` | line colour |
| `strokeWidth` | `3` | line width in u (screen space) |
| `highlightColor` | `"#FFD36B"` | colour lines recolour to in the highlight pass |
| `highlightGroups` | `[1]` | which groups recolour, in order, after everything is drawn |
| `drawFrames` | `10` | frames each stroke takes (easeInOutQuad) |
| `stagger` | `4` | frames between stroke starts (auto-tightened to fit 60% of the duration) |
| `startFrame` | `8` |  |
| `pen` | `true` | pen-nib dot on each stroke tip and a "+" flash where a stroke starts |
| `engrave` | `false` | draw strokes as outlined double lines (video19 engraving) |
| `fillOpacity` | `0.28` | highlighted closed shapes get a soft fill of the highlight colour |
| `caption` | `"ELEVATION A  ·  1:100"` | small mono title block typed after the drawing ("" to hide) |
| `margin` | `0.1` | margin around the drawing as a fraction of the frame |

### `metaball-heatmap` — Metaball heat-map / goo

![metaball-heatmap](../gallery/metaball-heatmap.jpg)

A liquid splat spreads and oozes, rendered as heat-map contour bands (maroon core to mint rim) on a starfield; or gooey dark blobs merge and swell with an RGB-split rim.

**Use for:** Heat maps, spills, thermal / density imagery, organic growth, liquid transitions, "it spreads".  
**Rebuilt from:** video2 0:13.08-0:14.17 (heatmap), video18 0:06.55-0:06.65 (goo)  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, night  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `live-chart`, `number-counter`, `curl-flow`  

| prop | default | notes |
|---|---|---|
| `style` | `"heatmap"` | "heatmap" (iso-contour bands) or "goo" (gooey blobs with RGB-split rim) |
| `ballCount` | `12` | number of metaball lobes (tendrils and droplets scale with it) |
| `colors` | `[]` | heatmap: 5 bands rim->core; goo: [blob, rim A, rim B] ([] = source palette) |
| `background` | `""` | background colour ("" = starfield navy / orange) |
| `blur` | `34` | field softness in u (bigger = smoother, wider bands) |
| `growth` | `0.045` | heatmap ooze rate (fraction per second the splat keeps spreading) |
| `rgbSplit` | `true` | goo: red/green channel-split rim |
| `stars` | `true` | heatmap: starfield specks |
| `seed` | `2` |  |

### `onion-skin-arc` — Onion-skin arc (straight ahead vs pose to pose)

![onion-skin-arc](../gallery/onion-skin-arc.jpg)

Two panels compare animation methods: ghost circles drawn frame by frame along a wandering path vs keys, a breakdown and eased in-betweens filling an arc; or (mode drop) a bowling ball, ball and balloon fall the same height in different frame counts.

**Use for:** Explaining process vs planning, keyframes and in-betweens, timing and weight, any "same task, different approach" comparison.  
**Rebuilt from:** video17 0:09-0:11.6 onion-skin-trail, video17 0:24-0:27 split-compare-drop  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** mid  
**Capabilities:** paints its own background · text: `dropLabels`, `title`, `subtitle` · weight: light  
**Pairs well with:** `easing-graph`, `bouncing-ball`, `hud-chrome`  

| prop | default | notes |
|---|---|---|
| `mode` | `"compare"` | 'compare' (straight-ahead vs pose-to-pose panels) \| 'drop' (three objects, same height, different timing) |
| `background` | `"#0B0D0C"` |  |
| `color` | `"#ED3821"` | hero ball colour |
| `inbetweens` | `8` | number of eased in-between circles on the pose-to-pose arc |
| `dropFrames` | `[5,12,26]` | drop mode: frames each object takes to fall (heavy, ball, light) |
| `dropLabels` | `["HEAVY","BALL","LIGHT"]` | drop mode: labels above the three columns |
| `hud` | `true` | show HUD chrome + chapter title |
| `numeral` | `""` | chapter numeral ('' = mode default) |
| `title` | `""` | chapter title ('' = mode default) |
| `subtitle` | `""` |  |
| `code` | `""` |  |

### `origami-fold` — Origami fold sequence (paper crane)

![origami-fold](../gallery/origami-fold.jpg)

A paper sheet in front of a sunny window: crease lines draw on, the sheet folds in snappy 2-3 frame flap rotations (excess strip falls away, pre-creases, diamond, 3/4 tilt, kite and narrowing folds, neck, tail, head) into a crane that flaps its wings; reversible (unfold).

**Use for:** Making / transformation / "step by step" stories, craft or paper themes, turning a plain idea into something that flies.  
**Rebuilt from:** video1 0:03.3-0:11.25 origami-fold-sequence, crease-line-draw, paper-scrap-fall, paper-crane-flap, video1 1:58-1:02.6 reverse unfold + crease highlight  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, paper, nature  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `flock`, `handwrite-on`, `falling-petals`  

| prop | default | notes |
|---|---|---|
| `direction` | `"fold"` | 'fold' (sheet → crane, then flapping) \| 'unfold' (crane flaps, unfolds back to the sheet, crease pattern highlights) |
| `paperColor` | `"#E6DECD"` | front face colour |
| `backColor` | `"#D1C9BB"` | back face colour (≈8 % darker) |
| `creaseColor` | `"#BDB6A8"` | faint crease line colour |
| `highlightColor` | `"#6773B5"` | unfold mode: crease highlight colour |
| `inkColor` | `"#2A2630"` |  |
| `wall` | `"#E2D8C1"` |  |
| `sky` | `"#B7CDDC"` |  |
| `stepFrames` | `4` | frames per flap rotation (2-3 at 24 fps measured; animated on twos) |
| `holdFrames` | `4` | hold frames after each fold |
| `showArcGuides` | `true` | dotted arc guides along flap-corner paths in the 3/4 view |
| `dutchJitter` | `true` | hard dutch-angle re-frames at fold-group boundaries |
| `window` | `true` | draw the sunny window backdrop |
| `seed` | `3` |  |

### `pair-field` — Pair field zoom-out

![pair-field](../gallery/pair-field.jpg)

Dark violet field of hundreds of cyan+pink dot pairs pinging small rings; the camera pulls out 2.5x from a hero pair.

**Use for:** "This happens millions of times" — scale reveal of a population of connections, users, agents or conversations.  
**Rebuilt from:** video4 0:24.0-0:26.0  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, night  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `number-counter`, `branch-grow`, `blur-in-title`  

| prop | default | notes |
|---|---|---|
| `count` | `360` | number of dot pairs in the field |
| `colors` | `["#549BEA","#E54FC0"]` | [dot A, dot B] colours (rings match their dot) |
| `background` | `["#452F7A","#19113E"]` | [centre, corner] of the radial background |
| `zoomFrom` | `2.5` | starting camera zoom |
| `zoomTo` | `1` | zoom after the pull-out (then a slow 7% drift further) |
| `zoomFrames` | `70` | length of the pull-out (easeOutQuad) |
| `pingPeriod` | `70` | average frames between pings of each pair |
| `ringRadius` | `42` | max ring radius of field pairs (u) |
| `heroRingRadius` | `120` | max ring radius of the hero pair (u) |
| `stars` | `true` | faint star specks in the background |
| `seed` | `4` |  |

### `petal-bloom` — Petal bloom (lotus / radial)

![petal-bloom](../gallery/petal-bloom.jpg)

Layered petals unfold radially with spring overshoot into a lotus, or dense rings of spike petals sweep round a seed disk into a sunflower / fur ball.

**Use for:** An organic reveal of a result or idea; "it blossoms"; building a radial emblem, flower, logo mark or mascot head.  
**Rebuilt from:** video4 0:22.10-0:22.45 (lotus), video15 0:02.35-0:04.6 (radial)  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, nature  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `falling-petals`, `handwrite-on`, `sparkle-burst`  

| prop | default | notes |
|---|---|---|
| `style` | `"lotus"` | "lotus" (spring-unfolding layered petals) or "radial" (spike rings sweeping round a seed disk) |
| `petalCount` | `8` | lotus: petals per layer; radial: ring 1 gets 4.5x this (8 -> 36), +6 per ring |
| `layers` | `3` | lotus: petal layers; radial: rings = 2.34x this (3 -> 7) |
| `colors` | `[]` | lotus: [light, deep]; radial: [base, outer tip, inner tip] — empty uses the source palette |
| `centerColor` | `""` | lotus centre / radial seed disk colour ("" = default) |
| `background` | `""` | background colour ("" = paper for lotus, navy for radial) |
| `sun` | `true` | radial: big orange sun disc behind the bloom |
| `start` | `10` | frame the bloom starts |
| `seed` | `15` |  |

### `ribbon-trail` — Ribbon follow-through trail

![ribbon-trail](../gallery/ribbon-trail.jpg)

A red ball swoops across a blue field trailing five lagging pastel ribbons; when it stops the ribbons whip past and settle hanging with a damped swing (or, style neon, two orbiting dots draw looping neon tube trails).

**Use for:** Follow-through / overlapping-action explainers, energetic logo or cursor trails, dance / orbit paths, "two things meet" moments.  
**Rebuilt from:** video17 0:11-0:15 ribbon-follow-through, video11 0:20-0:22 motion-trail-ribbons  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, neon, night  
**Capabilities:** paints its own background · text: `label`, `title`, `subtitle` · weight: light  
**Pairs well with:** `neon-sign`, `hud-chrome`, `easing-graph`  

| prop | default | notes |
|---|---|---|
| `style` | `"ribbons"` | 'ribbons' (video17 ball + lagging ribbons) \| 'neon' (video11 orbiting neon tube trails with beads) |
| `background` | `""` | background colour ('' = blue for ribbons, plaza terracotta for neon) |
| `ballColor` | `"#ED3821"` |  |
| `colors` | `["#FFFFFF","#C9B6F2","#F7A7CC","#F5CA1E","#FFFFFF"]` | ribbon colours (one ribbon each) |
| `neonColors` | `["#E978D6","#F4D96A"]` | neon style: the two trail colours |
| `label` | `"two paths · in sync"` | neon style: mono label typed when the two dots meet |
| `ribbonLength` | `330` | ribbon length in u |
| `ribbonWidth` | `12` | ribbon width in u |
| `stopAt` | `84` | frame the ball halts (ribbons overshoot and settle after it) |
| `period` | `10.5` | settle swing period in frames (~0.35 s) |
| `damping` | `0.3` | settle damping ratio ζ |
| `path` | `[[-0.08,0.82],[0.2,0.36],[0.42,0.66],[0.66,0.3],[0.8,0.58…` | ball waypoints as [x,y] fractions of the frame (smooth curve through them; ends at the last one) |
| `hud` | `true` | show HUD chrome + chapter title |
| `numeral` | `"05"` |  |
| `title` | `"FOLLOW THROUGH\n& OVERLAPPING ACTION"` |  |
| `subtitle` | `"Nothing stops all at once."` |  |
| `code` | `"strand[i].pos = ball.pos(t - i·Δ) // drag & settle"` |  |

### `rose-curve-trace` — Rose-curve pendulum trace

![rose-curve-trace](../gallery/rose-curve-trace.jpg)

A red ball swings on a dotted pendulum string tracing petal loops; the outlines complete into a flower that fills pink, then zooms past camera and its colour becomes the background.

**Use for:** Decorative parametric drawing (flower, spirograph, loader), "natural motion follows arcs", a chapter transition.  
**Rebuilt from:** video17 0:17.9-0:20.8  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, nature  
**Capabilities:** paints its own background · text: `title` · weight: light  
**Pairs well with:** `easing-graph`, `bouncing-ball`, `mask-rise-title`  

| prop | default | notes |
|---|---|---|
| `background` | `"#F5CA1E"` |  |
| `ballColor` | `"#ED3821"` |  |
| `lineColor` | `"#0B0D0C"` |  |
| `fillColor` | `"#F7A7CC"` | petal fill, and the background after the zoom wipe |
| `echoColor` | `"#888578"` | offset echo outlines under the filled flower |
| `petals` | `6` | number of petal loops traced |
| `radius` | `0.3` | petal length as a fraction of the short side |
| `framesPerPetal` | `15` | frames per petal loop (pendulum swing out and back) |
| `zoomWipe` | `true` | end with the flower scaling past the camera into a full pink frame |
| `number` | `"07"` | chapter number label ("" to hide) |
| `title` | `"ARCS"` | chapter title label ("" to hide) |

### `sonar-ping` — Sonar ping + echo window

![sonar-ping](../gallery/sonar-ping.jpg)

Glossy dot on paper emits sonar rings; echo arcs return and pop open a circular picture window.

**Use for:** Listening / broadcasting / searching beats; reveal examples one by one from an anchor point.  
**Rebuilt from:** video4 0:00-4:46  
**Default length:** 150 frames (5.0 s @ 30 fps) · best 144

**Roles:** subject · **Mood:** light, paper  
**Capabilities:** paints its own background · seamless loop · image: `windowImages` · weight: light  
**Pairs well with:** `starfield-night`, `chat-bubbles`, `embers`  
**Note:** windowSize 0 + echoAngles [] + pings/pingEvery multiple of the length = a clean loading loop.  

| prop | default | notes |
|---|---|---|
| `background` | `"#ECE4D7"` |  |
| `color` | `"#3383CB"` |  |
| `pings` | `3` | number of ping cycles |
| `pingEvery` | `48` | frames per ping cycle |
| `ringCount` | `3` |  |
| `ringGap` | `4` |  |
| `ringLife` | `13` |  |
| `echoAngles` | `[40,-70,160]` | degrees (0 = right, 90 = down) each echo comes from |
| `windowImages` | `[]` | public/ paths of images shown in the pop-out windows (falls back to colour gradients) |
| `windowColors` | `["#2b6e8f","#3b2a6b","#a34b6b"]` |  |
| `windowSize` | `0.53` | window diameter as a fraction of the short side |
| `paper` | `true` |  |

### `speed-lines` — Manga speed lines + impact frame

![speed-lines](../gallery/speed-lines.jpg)

Manga focus lines converge on a subject over a halftone comic backdrop, re-randomised every render frame on twos; at the hit the frame flips for two render frames into a yellow / violet two-tone impact print with a giant comic word, then red lines fade out and calm lines return.

**Use for:** Hits, reveals, sudden realisations, "ATTENTION" moments, comic or anime-styled emphasis on any subject.  
**Rebuilt from:** video12 0:07.87-0:08.27 impact-frame (BONK) + radial-speed-lines, video12 1:03.1 CRASH, video17 0:28.15 impact-frame  
**Default length:** 90 frames (3.0 s @ 30 fps)

**Roles:** subject · **Mood:** mid, comic  
**Capabilities:** paints its own background · text: `label` · weight: light  
**Pairs well with:** `comic-burst`, `stamp-slam`, `comic-halftone`  

| prop | default | notes |
|---|---|---|
| `background` | `"#C4489A"` | backdrop centre colour |
| `backgroundEdge` | `"#3A0B5C"` | backdrop edge colour (radial) |
| `color` | `"#FFFFFF"` | line colour before the impact / in the calm return |
| `afterColor` | `"#E75855"` | line colour right after the impact (fades over ~4 render frames) |
| `count` | `56` | number of lines (40-70) |
| `maxWidth` | `18` | max wedge width at the outer edge in u |
| `innerRadius` | `[0.42,0.3]` | clear ellipse [rx, ry] around the focus as fractions of the short side |
| `focus` | `[0.5,0.52]` | [x, y] focus point as fractions of the frame |
| `reseedEvery` | `2` | frames per redraw (2 = on twos boil) |
| `impactAt` | `40` | frame of the 2-render-frame impact (-1 = never) |
| `impactColors` | `["#120222","#F1D741"]` | impact two-tone [dark, light] (yellow/violet, B/W, red/maroon…) |
| `label` | `"BONK!"` | giant comic word shown during the impact frame |
| `subject` | `"ball"` | 'ball' (toon ball at the focus) \| 'none' (lines only) |
| `subjectColor` | `"#E57016"` |  |
| `halftone` | `true` | comic halftone dot screen on the backdrop |
| `seed` | `2` | line randomness |

### `sprout-grow` — Sprout grow row

![sprout-grow](../gallery/sprout-grow.jpg)

Pencil-sketch planters on a park lawn: stems rise one after another, leaf pairs pop and flower heads (sunflower, blossom, tulip) scale in with overshoot, then sway with twinkling sparkles inside a torn-paper frame.

**Use for:** Growth / progress / "it worked" beats, gardening or sustainability topics, a cheerful payoff after a fix.  
**Rebuilt from:** video20 2:09-2:16 sprout-grow-row  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, paper, nature  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `handwrite-on`, `sun-rise-set`, `number-counter`  

| prop | default | notes |
|---|---|---|
| `background` | `"#DFD6C5"` | paper colour (sky) |
| `ground` | `"#C6C9A0"` | lawn colour under the hatching |
| `rows` | `0` | planter rows (0 = auto: 2 landscape, 3 portrait; back rows smaller) |
| `planters` | `3` | planters per row |
| `perPlanter` | `5` | sprouts per planter |
| `stagger` | `2.4` | frames between consecutive sprouts (left to right, 0.08 s measured) |
| `startAt` | `8` | frame the first sprout starts |
| `headColors` | `["#E8C25A","#E0626A","#9070C0","#F2A65A"]` | flower head colours (picked per sprout) |
| `stemColor` | `"#5F8F4E"` |  |
| `leafColor` | `"#7CAE5E"` |  |
| `sparkles` | `true` | twinkle 4-point sparkles after the flowers open |
| `frame` | `true` | draw the torn deckle paper frame |
| `seed` | `3` | layout / colour randomness |

### `swimmers-converge` — Swimmers converge + shockwave + fusion

![swimmers-converge](../gallery/swimmers-converge.jpg)

Small glowing agents with wavy sine tails swim in along dotted S-curves and stop around a glowing cell; one gets through with a flash and an expo shockwave ring, the rest fade, then two aster dots drift together and fuse in a starburst.

**Use for:** Competition / "one wins" moments, many inputs converging on a goal, biology or origin stories, two things combining into one.  
**Rebuilt from:** video11 0:02.1-0:03.55 wavy-swimmers-converge + pulse-shockwave-ring + twin-dot-fusion  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, hud  
**Capabilities:** paints its own background · text: `label`, `finalLabel` · weight: light  
**Pairs well with:** `cell-division`, `science-reticle`, `blur-in-title`  

| prop | default | notes |
|---|---|---|
| `count` | `13` | number of swimmers |
| `stopRadius` | `1.5` | where they stop, in target radii |
| `tailLength` | `90` | tail length in u |
| `waveHz` | `4` | tail undulation frequency |
| `arriveFrames` | `52` | average frames to arrive (easeOutQuad) |
| `hitAt` | `72` | frame the winner touches the membrane (flash + shockwave) |
| `fusion` | `true` | run the twin-dot fusion after the hit |
| `color` | `"#EAFBFF"` |  |
| `membrane` | `"#D8DAF5"` | membrane colour before the hit |
| `hitColor` | `"#A3EDE6"` | membrane colour after the hit |
| `dotColors` | `["#C35CCB","#62CAD8"]` | the two fusing dots [resident, incoming] |
| `label` | `"fertilization · t = 0 s"` | typed label at the hit |
| `finalLabel` | `"two become one"` | typed label after fusion |
| `seed` | `4` | layout randomness |

## fx

### `confetti-burst` — Confetti burst

![confetti-burst](../gallery/confetti-burst.jpg)

Flat circles, rings, squares and capsules explode radially from a point with drag, gravity, spin and 3D flutter; fill mode tiles the whole frame (video17). Overlay-ready: background "transparent".

**Use for:** Celebrations, completions, level-ups, "chaos" beats; small counts make an impact puff on a landing or tap.  
**Rebuilt from:** video17 6.40-7.50 confetti-burst-fill, video7 impact-confetti, video14 style-swap-confetti-burst  
**Default length:** 100 frames (3.3 s @ 30 fps)

**Roles:** accent · **Mood:** light, playful  
**Capabilities:** overlay (`{"background":"transparent","showSubject":false}`) · weight: light  
**Pairs well with:** `heart-draw-fill`, `number-counter`, `mask-rise-title`, `browser-mockup`  
**Note:** As a web overlay: <MotionPlayer motion="confetti-burst" overlay loop="once"/> over your success screen.  

| prop | default | notes |
|---|---|---|
| `background` | `"#EEEBDE"` | scene colour; 'transparent' = overlay (subject ball hidden) |
| `x` | `0.5` | burst origin x (0..1 of frame width) |
| `y` | `0.55` | burst origin y (0..1 of frame height) |
| `delay` | `18` | local frame the burst fires (the hero ball winds up during the frames before it) |
| `count` | `150` | number of pieces (v17 ~141, v14 30-40, v7 3-12) |
| `palette` | `["#ED3821","#2536F4","#F5CA1E","#F7A7CC","#0B0D0C","#8A87…` | piece colours |
| `weights` | `[0.18,0.18,0.12,0.14,0.2,0.18]` | relative weight of each palette colour (same length as palette, else uniform) |
| `shapes` | `["circle","ring","square","capsule","dot"]` | any of circle, ring, square, capsule, dot, triangle |
| `power` | `1` | launch speed multiplier (0.15 = tiny landing puff, 1 = fills the frame) |
| `gravity` | `1` | gravity multiplier (0 = float) |
| `size` | `1` | piece size multiplier |
| `spread` | `360` | launch cone in degrees, centred upward (360 = all directions) |
| `upBias` | `520` | extra upward launch speed in px/s (v14 -150..-500) |
| `flutter` | `1` | sway + 3D flip amount while falling (0 = rigid) |
| `fill` | `false` | true = v17 mode: pieces fly to a jittered grid that tiles the whole frame, float, then drop out |
| `life` | `4` | seconds before a piece fades (burst mode) |
| `ringRadius` | `40` | spawn ring radius in u (v14 spawns on a 60-120 px ring) |
| `ghosts` | `true` | draw motion-blur ghost copies while pieces move fast |
| `showSubject` | `true` | draw the hero ball that pops (scene mode only) |
| `subjectColor` | `"#ED3821"` | hero ball colour |
| `seed` | `3` | random seed |

### `electric-arcs` — Electric arcs

![electric-arcs](../gallery/electric-arcs.jpg)

Jagged white-core lightning arcs with violet glow, re-randomised every 1-2 frames with drop-outs and brightness flashes, radiating from a plasma orb, jumping between two electrodes or crawling around an object. Overlay-ready: background "transparent".

**Use for:** Energy, power, surges, sci-fi, "electrifying" ideas; around mode electrifies a logo or product.  
**Rebuilt from:** video2 electric-arc-flicker  
**Default length:** 90 frames (3.0 s @ 30 fps)

**Roles:** accent · **Mood:** dark, night  
**Capabilities:** overlay (`{"background":"transparent","showSubject":false}`) · weight: light  
**Pairs well with:** `stamp-slam`, `glitch-image`, `zoom-tunnel`  

| prop | default | notes |
|---|---|---|
| `background` | `"#0d1018"` | scene colour; 'transparent' = overlay (no orb / electrodes) |
| `x` | `0.5` | arc origin x (0..1) — orb centre or first electrode |
| `y` | `0.47` | arc origin y (0..1) |
| `delay` | `0` | frame the arcs switch on |
| `mode` | `"radial"` | radial (out of an object edge) \| between (x,y) and (x2,y2) \| around (crawling over the object surface) |
| `x2` | `0.75` | between mode: second point x (0..1) |
| `y2` | `0.5` | between mode: second point y (0..1) |
| `count` | `14` | number of arcs (10-20) |
| `reach` | `0.46` | radial mode: max arc length as a fraction of the short side |
| `radius` | `120` | object radius in u (arcs start at its edge) |
| `holdFrames` | `2` | regenerate every N frames (1-2) |
| `levels` | `6` | midpoint-displacement recursion levels (5-6) |
| `jaggedness` | `0.25` | displacement factor (0.25 = source) |
| `branches` | `true` | add short forks off the arcs |
| `color` | `"#ffffff"` | arc core colour |
| `glowColor` | `"#b48cff"` | glow colour |
| `coreWidth` | `2` | core stroke width in u |
| `flashes` | `true` | random full-frame brightness flashes |
| `rampIn` | `8` | frames to power up |
| `rampOut` | `12` | frames to power down at the end |
| `showSubject` | `true` | draw the plasma orb / electrodes (scene mode only) |
| `seed` | `7` | random seed |

### `emote-pop` — Emote pop

![emote-pop](../gallery/emote-pop.jpg)

Doodle reaction icons (! ? lightbulb hearts sweat-drop music notes) pop in over a point in 1-2 frames, boil, bob and fade, chained one after another above a box-bot. Overlay-ready: background "transparent".

**Use for:** Quick reactions over any character, face or UI element: surprise, confusion, idea, love, stress, joy.  
**Rebuilt from:** video20 emote-icon-pop, video22 cheer-bounce-emotes floating notes  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** accent · **Mood:** light, paper, playful  
**Capabilities:** overlay (`{"background":"transparent","showSubject":false}`) · weight: light  
**Pairs well with:** `box-bot`, `chat-bubbles`, `perspective-grid`  

| prop | default | notes |
|---|---|---|
| `background` | `"#E1D7C5"` | scene paper colour; 'transparent' = overlay (no bot, no paper) |
| `x` | `0.5` | emote anchor x (0..1) — the point the icons pop over |
| `y` | `0.3` | emote anchor y (0..1) |
| `delay` | `8` | frame the first emote pops |
| `icons` | `["!","?","bulb","heart"]` | sequence of icons: '!', '?', '!?', 'bulb', 'heart', 'sweat', 'note' (each starts the frame after the previous ends) |
| `hold` | `22` | frames each icon holds (0.6-1.2 s) |
| `size` | `1` | icon size multiplier |
| `ink` | `"#2e2a26"` | ink line colour |
| `red` | `"#D2454F"` | "!" fill colour |
| `bulb` | `"#F6DC72"` | lightbulb fill colour |
| `heart` | `"#E9727C"` | heart fill colour |
| `sweat` | `"#7DB3E0"` | sweat-drop colour |
| `showSubject` | `true` | draw the reacting box-bot under the icons (scene mode only) |
| `seed` | `2` | random seed (line boil) |

### `eyes-blink` — Eyes blink & look

![eyes-blink](../gallery/eyes-blink.jpg)

A pair of cartoon eyes on a red ball blinks, darts between look targets and switches to happy ^ ^ arcs with a squash hop; watching variant fills dark negative space with staggered glowing green eye pairs. Overlay-ready: background "transparent".

**Use for:** Give any shape, logo or object a personality; suspense / "being watched" beats in dark scenes.  
**Rebuilt from:** video17 34.5-38.7 character-eyes, video2 eye-look-blink, video21 watching-eyes-in-dark  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** accent · **Mood:** light, playful, comic  
**Capabilities:** overlay (`{"background":"transparent","showSubject":false}`) · weight: light  
**Pairs well with:** `starfield-night`, `giant-eye-reveal`, `story-caption-box`  

| prop | default | notes |
|---|---|---|
| `background` | `"auto"` | 'auto' = cream (character) or near-black (watching); any colour; 'transparent' = overlay |
| `variant` | `"character"` | character (one pair that blinks / looks / smiles) \| watching (field of glowing eye pairs in the dark) |
| `x` | `0.5` | character: eye-pair centre x (0..1) |
| `y` | `0.47` | character: eye-pair centre y (0..1) |
| `delay` | `0` | frame offset for the whole timeline |
| `eyeStyle` | `"oval"` | oval (v17 black ovals) \| sclera (v2 white eyes with moving pupils and lids) |
| `size` | `1` | size multiplier |
| `spacing` | `1` | distance between the two eyes multiplier |
| `color` | `"#0B0D0C"` | eye / ink colour |
| `blinks` | `[12,58,104]` | frames (after delay) at which the eyes blink |
| `looks` | `[{"at":22,"x":-1,"y":0},{"at":36,"x":1,"y":-0.3},{"at":66…` | saccade schedule [{at, x, y}] with x,y in -1..1 of maxOffset |
| `maxOffset` | `40` | look offset in u at x/y = 1 |
| `happyAt` | `80` | frame the eyes switch to happy arcs (-1 = never) |
| `happyFor` | `26` | frames the happy arcs hold |
| `hop` | `true` | squash-and-stretch hop when happy (scene mode) |
| `showSubject` | `true` | draw the ball (character) or the fog, wind and lantern figure (watching) — scene mode only |
| `subjectColor` | `"#ED3821"` | ball colour (also lid colour for sclera eyes) |
| `count` | `8` | watching: number of eye pairs |
| `stagger` | `12` | watching: frames between pairs appearing (~0.4 s) |
| `region` | `[0.5,0.1,0.95,0.8]` | watching: [x0, y0, x1, y1] area (0..1) the pairs scatter in |
| `glowColor` | `"#4CB040"` | watching: eye glow colour |
| `coreColor` | `"#C8F0A0"` | watching: bright iris core colour |
| `seed` | `8` | random seed |

### `giant-eye-reveal` — Giant eye reveal

![giant-eye-reveal](../gallery/giant-eye-reveal.jpg)

In darkness a huge reptilian eye opens from a cyan slit through an almond lid mask, with a glowing fibrous iris, contracting slit pupil and lit scales; ends with an exponential push into the pupil (or an eyelid close). Overlay-ready: background "transparent".

**Use for:** Creature reveals, "you are being watched" twists, dramatic awakenings, zoom-through-the-pupil transitions.  
**Rebuilt from:** video23 87.1-90.5 giant-eye-reveal, video15 24.6-25.55 eye-zoom-match-cut, video17 eyelid-iris-close  
**Default length:** 128 frames (4.3 s @ 30 fps)

**Roles:** accent · **Mood:** dark, night  
**Capabilities:** overlay (`{"background":"transparent"}`) · image: `src` · weight: light  
**Pairs well with:** `lightning-flash`, `glitch-image`, `blur-in-title`  

| prop | default | notes |
|---|---|---|
| `background` | `"#020406"` | scene colour (near-black); 'transparent' = overlay |
| `x` | `0.5` | eye centre x (0..1) |
| `y` | `0.48` | eye centre y (0..1) |
| `delay` | `8` | frame the slit appears |
| `size` | `1` | eye size multiplier (1 = ~72 % of frame width in landscape) |
| `openFrames` | `39` | lid opening frames (39 = 1.3 s, easeOutCubic) |
| `holdFrames` | `52` | frames the open eye holds (pupil contracts, iris sparkles) |
| `ending` | `"push"` | push (exponential zoom into the pupil -> endColor) \| close (lids squash shut) \| hold |
| `pushFrames` | `28` | push duration (0.95 s = 28) |
| `maxScale` | `60` | final zoom of the push |
| `closeFrames` | `9` | close duration (0.3 s = 9) |
| `irisColor` | `"#38C8F0"` | iris mid colour |
| `glowColor` | `"#38C8F0"` | glow / halo colour |
| `pupil` | `"slit"` | slit (reptile) \| round |
| `endColor` | `"#010406"` | colour the push lands on (match-cut into the next scene) |
| `src` | `""` | optional public/ image shown inside the lids instead of the procedural iris |
| `scales` | `true` | draw lit scales around the eye |
| `seed` | `9` | random seed |

### `scribble-ball` — Scribble ball

![scribble-ball](../gallery/scribble-ball.jpg)

A boiling tangle of open ink loops, regenerated every 2 frames, floats over an upset box-bot linked by a red steam squiggle; storm variant swaps in a boiling doodle cloud with a lightning scribble and rain. Overlay-ready: background "transparent".

**Use for:** Frustration, confusion, overthinking, "problem" states, bad moods.  
**Rebuilt from:** video20 scribble-frustration-ball, video2 line-boil  
**Default length:** 90 frames (3.0 s @ 30 fps)

**Roles:** accent · **Mood:** light, paper, playful  
**Capabilities:** overlay (`{"background":"transparent","showSubject":false}`) · weight: light  
**Pairs well with:** `box-bot`, `error-glitch`, `chat-bubbles`  

| prop | default | notes |
|---|---|---|
| `background` | `"#E1D7C5"` | scene paper colour; 'transparent' = overlay (no bot, no paper) |
| `x` | `0.5` | scribble centre x (0..1) |
| `y` | `0.27` | scribble centre y (0..1) |
| `delay` | `6` | frame the scribble fades in (it fades out at the end of the clip) |
| `variant` | `"tangle"` | tangle (v20 frustration ball) \| storm (doodle storm cloud with lightning scribble) |
| `loops` | `8` | number of ink loops (6-10) |
| `size` | `1` | size multiplier (1 = 430 u wide tangle) |
| `boilEvery` | `2` | regenerate the drawing every N frames (1-2 = line boil) |
| `color` | `"#2e2a26"` | ink colour |
| `steamColor` | `"#C8424F"` | colour of the steam squiggle to the head |
| `cloudColor` | `"#c3c6cb"` | storm cloud fill |
| `boltColor` | `"#F2C94C"` | lightning fill |
| `steam` | `true` | draw the red steam squiggle (tangle variant) |
| `fade` | `6` | fade in/out frames (0.2 s) |
| `showSubject` | `true` | draw the upset box-bot underneath (scene mode only) |
| `seed` | `5` | random seed |

### `smoke-puffs` — Smoke puffs

![smoke-puffs](../gallery/smoke-puffs.jpg)

Clusters of open doodle ink circles (or soft blurred circles) rise from a vent, grow and fade, then shrink away when fixed; flash mode fires a 2-frame muzzle flash and a forward-drifting smoke puff. Overlay-ready: background "transparent".

**Use for:** Broken machines, steam, thinking, engines; with flash: cannon / gun / launch / explosion beats.  
**Rebuilt from:** video20 27-33 s smoke-puff-circles, video3 cannon-flash-smoke  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** accent · **Mood:** light, paper  
**Capabilities:** overlay (`{"background":"transparent","showSubject":false}`) · weight: light  
**Pairs well with:** `gears`, `box-bot`, `stamp-slam`  

| prop | default | notes |
|---|---|---|
| `background` | `"auto"` | scene colour; 'auto' = cream paper (doodle) or dusk navy (soft); 'transparent' = overlay |
| `x` | `0.5` | vent / muzzle x (0..1) |
| `y` | `0.42` | vent / muzzle y (0..1) |
| `delay` | `0` | frame the first puff (or shot) fires |
| `style` | `"doodle"` | doodle (v20 open ink circles) \| soft (v3 blurred grey-white smoke) |
| `flash` | `false` | true = cannon mode: muzzle flash + one big puff per shot |
| `shots` | `2` | flash mode: number of shots |
| `shotEvery` | `8` | flash mode: frames between shots (0.25 s) |
| `rate` | `9` | continuous mode: frames between new clusters (0.3 s) |
| `rise` | `0.24` | rise distance as a fraction of frame height |
| `life` | `36` | frames each puff lives (1.2 s) |
| `grow` | `1.5` | scale reached at end of life |
| `size` | `1` | size multiplier |
| `direction` | `-25` | flash mode: barrel / blast direction in degrees (0 = right, -90 = up) |
| `drift` | `0` | sideways wind in u per second |
| `stopAt` | `-1` | continuous mode: local frame spawning stops and puffs shrink away (-1 = 22 frames before the end) |
| `color` | `"#2e2a26"` | ink colour |
| `smokeColor` | `"#e7e4dd"` | soft smoke colour |
| `flashColor` | `"#ff9a3c"` | muzzle flash outer colour |
| `showSubject` | `true` | draw the broken machine (doodle) or cannon (flash) — scene mode only |
| `seed` | `6` | random seed |

### `sparkle-burst` — Sparkle burst

![sparkle-burst](../gallery/sparkle-burst.jpg)

Four-point doodle sparkles burst from a contact point and twinkle out (tool-tap repair), or gold stars fly out of a jittering scuffle cloud, or twinkle around a cheering character. Overlay-ready: background "transparent".

**Use for:** Success / fixed / done accents, comic fights and replacements, celebration beats.  
**Rebuilt from:** video20 tool-tap-repair + sparkle-burst, video22 capture-scuffle-sparkles, video22 cheer-bounce-emotes  
**Default length:** 64 frames (2.1 s @ 30 fps)

**Roles:** accent · **Mood:** light, paper, playful  
**Capabilities:** overlay (`{"background":"transparent","showSubject":false}`) · weight: light  
**Pairs well with:** `heart-draw-fill`, `number-counter`, `box-bot`  

| prop | default | notes |
|---|---|---|
| `background` | `"#E1D7C5"` | scene paper colour; 'transparent' = overlay (no subject, no paper) |
| `x` | `0.5` | contact point x (0..1) |
| `y` | `0.56` | contact point y (0..1) |
| `delay` | `34` | repair: frame of the final tap (sparkles fire here); scuffle/cheer: start frame |
| `variant` | `"repair"` | repair (4-point colour sparkles + impact ticks) \| scuffle (dust cloud + gold stars) \| cheer (twinkling gold stars around a bouncing bot) |
| `count` | `8` | number of stars (v20 5-9, v22 4-6) |
| `radius` | `230` | scatter radius in u (~1.2 body widths) |
| `colors` | `["#5FAE6E","#3F7FD6","#E0B84A","#D9534F"]` | sparkle colours (repair variant) |
| `starColor` | `"#E0B84A"` | gold star colour (scuffle / cheer) |
| `size` | `1` | overall size multiplier |
| `life` | `21` | sparkle life in frames (0.4-0.7 s) |
| `ticks` | `true` | flash radial ink impact ticks for 3 frames on each tap |
| `taps` | `3` | repair scene: number of hammer taps (sparkles on the last) |
| `tapEvery` | `8` | frames between taps (0.25 s) |
| `scuffleFrames` | `40` | scuffle variant: length of the jittering cloud window |
| `ink` | `"#2e2a26"` | outline colour |
| `showSubject` | `true` | draw the scene subject (hammer + cracked pipe / bouncing bot); ignored in overlay mode |
| `seed` | `4` | random seed |

### `star-glint` — Star glint flare

![star-glint](../gallery/star-glint.jpg)

A six-spike specular "ting" with soft bloom flashes on a blade tip, shimmers through a hold and slowly decays; can slide along an edge, or fire as a quick 4-point twinkle. Overlay-ready: background "transparent".

**Use for:** Specular highlight on a logo, product edge, blade, badge or coin; "shiny / new / premium" accents.  
**Rebuilt from:** video5 0.60-2.90 star-glint-flare, video2 zipper-slide-glint  
**Default length:** 90 frames (3.0 s @ 30 fps)

**Roles:** accent · **Mood:** light  
**Capabilities:** overlay (`{"background":"transparent","showSubject":false}`) · weight: light  
**Pairs well with:** `glyph-orbit-logo`, `number-counter`, `browser-mockup`, `neon-sign`  
**Note:** The 'shiny / premium' accent on a logo, badge or number.  

| prop | default | notes |
|---|---|---|
| `background` | `"#BBC2D9"` | scene colour (lavender sky); 'transparent' = overlay (no blade scene) |
| `x` | `0.5` | glint x (0..1) |
| `y` | `0.3` | glint y (0..1) |
| `delay` | `14` | frame the glint fires |
| `style` | `"flare"` | flare (v5 6-spike flare with hold) \| twinkle (v2 quick 4-point star, repeated) |
| `size` | `1.7` | flare size multiplier |
| `hold` | `48` | frames the flare holds with shimmer (v5 ~48) |
| `inFrames` | `3` | ramp-in frames (easeOutQuad) |
| `outFrames` | `18` | decay frames (easeInQuad) |
| `color` | `"#FFFFFF"` | core / spike colour |
| `bloomColor` | `"#DDE6FF"` | bloom tint |
| `spikeAngles` | `[45,135,0,90,22,158]` | spike angles in degrees; first two are the long X diagonals, a vertical (0) is mid-length, others short |
| `shimmer` | `1` | shimmer strength (spike length +-8 %, rotation +-3 deg) |
| `to` | `[]` | [x, y] (0..1) to slide the glint along an edge during the hold; [] = stays put |
| `repeat` | `3` | twinkle style: number of twinkles |
| `every` | `20` | twinkle style: frames between twinkles |
| `showSubject` | `true` | draw the etched sword-and-army scene (scene mode only) |
| `ink` | `"#2D3A6F"` | etching ink colour for the scene |
| `seed` | `1` | random seed |

### `mix` — Mix (layer motions together)

Stacks any motions in one frame: backdrop + subject + text + accent, each with its own timing, opacity and blend mode.

**Use for:** Building a richer shot out of several motions at once (e.g. aurora sky + neon sign + embers, or a photo look + callouts + captions).  
**Rebuilt from:** library  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** mix · **Mood:** dark  
**Capabilities:** paints its own background · weight: light  

| prop | default | notes |
|---|---|---|
| `background` | `"#05070d"` | colour under all layers |
| `layers` | `[{"motion":"aurora","props":{"pixelSize":0}},{"motion":"b…` | [{motion, props?, from?, duration?, offset?, opacity?, blend?, scale?, x?, y?}] bottom to top |

## environment

### `aurora` — Aurora curtain

![aurora](../gallery/aurora.jpg)

Undulating teal-green aurora curtains shimmer over a navy starry sky, snowy mountains and an icy sea, with an optional pixel-art (pixelate + dither) look. Overlay-capable.

**Use for:** Polar / night / wonder / title-card backdrops; transparent overlay for any night sky.  
**Rebuilt from:** video21 15.5-16.6, 24.0-27.5  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** dark, pixel, nature, night  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `blur-in-title`, `embers`, `starfield-night`, `glyph-orbit-logo`, `neon-sign`  
**Note:** pixelSize 0 = smooth (premium web look); 6 = pixel-art.  

| prop | default | notes |
|---|---|---|
| `background` | `"#03081C"` | CSS background; "transparent" = overlay (only the curtains) |
| `backdrop` | `true` | paint sky, stars, mountains and ice |
| `colors` | `["#46DEA0","#1C7B64","#124E49"]` | [bright edge, mid, dark] curtain colours |
| `topColor` | `"#6C5BC4"` | faint tint at the curtain tops |
| `curtains` | `3` | number of ray curtains (1-4) |
| `strips` | `11` | broad soft strips behind the curtains (8-14 in source) |
| `speed` | `1` | undulation speed multiplier |
| `intensity` | `1` | overall brightness multiplier |
| `height` | `0.32` | curtain height as a fraction of frame height |
| `pixelSize` | `6` | pixel-art block size at 1080p; 0 = smooth (6 = video21 look) |
| `stars` | `170` | stars per 1080p frame |
| `seed` | `1` | random seed |

### `bubbles` — Iridescent bubbles

![bubbles](../gallery/bubbles.jpg)

A packed foam of soap bubbles on a steel sink: rotating rainbow thin-film rims, jiggle, occasional pops and re-growth; "rising" mode sends bubbles up through deep water. Overlay-capable.

**Use for:** Clean / fresh / soap / fizz / bubbly-mood beats, underwater ambience; overlay bubbles on footage.  
**Rebuilt from:** video2 1.08-2.21, video23 bathysphere-idle-bob bubbles  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** light, cinematic, nature  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `caustics-godrays`, `fish-school`, `blur-in-title`  

| prop | default | notes |
|---|---|---|
| `mode` | `"cluster"` | "cluster" (packed foam with pops) or "rising" (bubbles rising through water) |
| `background` | `"#B7C3C9"` | CSS background; "transparent" = overlay |
| `backdrop` | `true` | paint the steel sink (cluster) or deep-water gradient (rising) |
| `count` | `95` | number of bubbles (rising: per 1080p frame) |
| `radiusRange` | `[12,72]` | [min, max] bubble radius in px at 1080p |
| `hueSpeed` | `60` | thin-film rainbow rotation in degrees per second |
| `popRate` | `1.2` | cluster pops per second |
| `speed` | `1` | rising speed multiplier |
| `foam` | `true` | tiny foam bubbles around the cluster |
| `seed` | `1` | random seed |

### `caustics-godrays` — Caustics & god-rays

![caustics-godrays](../gallery/caustics-godrays.jpg)

Underwater: a rippling caustic web at the surface, swaying light shafts and drifting motes; "pool" = full-frame scrolling caustic texture; "beam" = warm window light shaft with dust. Overlay-capable.

**Use for:** Ocean / underwater openers, pool or summer textures, quiet interiors with a single light shaft; layer over footage as light.  
**Rebuilt from:** video23 0.0-14.0, video2 14.17-15.25, video14 era ambience (light-shaft-dust)  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** mid, cinematic, nature  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `fish-school`, `depth-descent`, `blur-in-title`, `bubbles`  
**Note:** Excellent calm web hero background for water / health / science brands.  

| prop | default | notes |
|---|---|---|
| `mode` | `"underwater"` | "underwater" (surface web + god-rays), "pool" (full-frame caustic texture), "beam" (window light shaft + dust) |
| `background` | `"#11577E"` | CSS background; "transparent" = overlay (only light elements are drawn) |
| `backdrop` | `true` | paint the procedural water / room |
| `lineColor` | `"#CFF3F8"` | caustic web line colour (pool source: #cfeff0) |
| `rayColor` | `""` | light shaft colour; empty = #E6FBFF underwater, #FFDC96 beam |
| `rayCount` | `8` | number of god-rays (underwater) |
| `causticScale` | `1` | caustic cell size multiplier |
| `speed` | `1` | animation speed multiplier |
| `motes` | `1` | dust / marine-snow density multiplier |
| `fadeDepth` | `0.42` | fraction of height the surface caustics reach before fading (underwater) |
| `intro` | `true` | pool mode: open on a wire grid that switches to caustics in 3 frames |
| `seed` | `1` | random seed |

### `city-skyline` — City skyline (window flicker, dusk to night)

![city-skyline](../gallery/city-skyline.jpg)

Seeded procedural city: three depth rows of buildings with setbacks, water tanks, antennas and window grids that flicker on and off; the sky goes from dusk to night as more windows light up, with traffic on the street and an optional aerial crane pull-back from one window to the whole skyline. Sketch style gives the hatched pencil-on-paper look.

**Use for:** Urban establishing shots, "the city at night", time passing, ending pull-backs, backdrops behind titles.  
**Rebuilt from:** video20 3:16-3:36 procedural-sketch-city + crane-pullback-reveal, video2 window-grid-flicker  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, night, cinematic  
**Capabilities:** paints its own background · weight: medium  
**Pairs well with:** `number-counter`, `fireworks`, `rain`, `neon-sign`  

| prop | default | notes |
|---|---|---|
| `style` | `"flat"` | "flat" dusk/night silhouettes or "sketch" hatched pencil-on-paper (video20) |
| `pullback` | `true` | start close on one window and crane back to the whole city |
| `pullFrom` | `0` | frame the pull-back starts |
| `pullFrames` | `105` | pull-back length (bezier .4,0,.2,1) |
| `toNight` | `true` | sky grades from dusk to night while windows switch on (flat style) |
| `litRatio` | `0.55` | share of windows lit at full night |
| `stepFrames` | `5` | frames between window flicker steps (5 = 0.17 s) |
| `windowColor` | `"#f2d27a"` | lit window colour |
| `traffic` | `true` | cars with head/tail lights on the street |
| `seed` | `"metro"` | city seed |

### `curl-flow` — Curl-flow swirl

![curl-flow](../gallery/curl-flow.jpg)

Hundreds of coloured ribbons stream through a turbulent curl-noise vortex around a dark spiky pupil, inside a red magnifier lens on cream paper (or full-frame). Overlay-capable.

**Use for:** Inspection / insight / chaos-under-the-lens beats, psychedelic or hypnotic transitions, "looking closer" moments.  
**Rebuilt from:** video2 18.54-20.71  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** light, paper  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `blur-in-title`, `science-reticle`, `glitch-image`  

| prop | default | notes |
|---|---|---|
| `background` | `"#E7DDC7"` | CSS background; "transparent" = overlay |
| `backdrop` | `true` | paper texture, iris lines, magnifier handle and boiling sketch arcs |
| `lens` | `true` | clip the flow inside a magnifier lens circle; false = full frame |
| `lensColor` | `"#B8323F"` | magnifier rim colour |
| `pupil` | `true` | dark spiky pupil at the vortex centre |
| `palette` | `["#D6317A","#22B0C4","#E3A72F","#161616","#5FC3E4","#E35D…` | ribbon colours |
| `particleCount` | `760` | number of ribbons |
| `vortexStrength` | `1.5` | tangential swirl strength |
| `noiseScale` | `0.65` | curl-noise feature frequency (higher = smaller eddies) |
| `flowSpeed` | `1` | curl-noise advection speed |
| `ribbonWidth` | `1` | ribbon width multiplier |
| `seed` | `1` | random seed |

### `depth-descent` — Deep-sea depth descent

![depth-descent](../gallery/depth-descent.jpg)

Underwater descent infographic: a bobbing brass bathysphere hangs on its cable while the world scrolls up past it — surface god-rays, a fish school, glowing jellyfish, a trench wall and the seafloor — the water darkens with depth, marine snow drifts, the headlamp beam rises as light falls, a depth counter with pressure/light/temperature counts top-left, a log-scale depth ruler with landmark ticks scrolls on the right and zone titles blur in letter by letter.

**Use for:** Scale explainers ("how deep / how far / how big"), descending through levels or eras, any ranked list read as depth.  
**Rebuilt from:** video23 0:00-1:30 depth-descent-scroll, depth-counter-hud, log-depth-ruler, bathysphere-idle-bob, headlamp-beam, marine-snow-particles, zone-title-blur-swap  
**Default length:** 480 frames (16.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, nature, hud, night  
**Capabilities:** paints its own background · text: `landmarks`, `surfaceTitle`, `surfaceNote`, `unit`, `labels` · image: `heroSrc` · weight: light  
**Pairs well with:** `caustics-godrays`, `blur-in-title`, `fish-school`  

| prop | default | notes |
|---|---|---|
| `landmarks` | `[{"depth":93,"label":"Statue of Liberty","note":"pressure…` | ruler ticks + zone titles: [{depth, label, note}] (depth in metres) |
| `maxDepth` | `10935` | depth reached at the end (counter stops here) |
| `surfaceTitle` | `"Surface"` | first zone title |
| `surfaceNote` | `"11 km below your feet"` | first zone subtitle |
| `descentStart` | `40` | frame the counter starts counting |
| `holdFrames` | `40` | frames held at the bottom at the end |
| `scrollSpeed` | `7` | world scroll speed in px per frame at 1080 (constant, decoupled from the counter) |
| `unit` | `"m"` | unit after numbers |
| `labels` | `["DEPTH","PRESSURE","LIGHT","TEMP."]` | HUD labels [depth, pressure, light, temperature] |
| `ticks` | `[10,20,60,150,500,1500,3000,5000]` | extra plain round-depth ruler ticks |
| `heroSrc` | `""` | optional public/ image to replace the procedural bathysphere |
| `hud` | `true` | show the counter and zone titles |
| `ruler` | `true` | show the log depth ruler |
| `seed` | `"abyss"` | random seed |

### `embers` — Embers & gold flecks

![embers](../gallery/embers.jpg)

Golden additive sparks rising and twinkling over a fire glow; "motes" = slow soft glowing ember dots, "gold" = spinning Klimt gold flecks with sparkle pulses. Overlay-capable.

**Use for:** Warmth, fire, magic, craft/forge or luxury beats; drop over any dark scene as an additive ambience layer.  
**Rebuilt from:** video3 2.40-4.40, video14 era ambience (ember-motes, gold-fleck-float)  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** dark, night, cinematic  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · seamless loop · weight: light  
**Pairs well with:** `aurora`, `neon-sign`, `end-card-credits`, `blur-in-title`, `light-sweep`  
**Note:** mode motes + low count is the classic subtle accent over any dark scene (blend screen).  

| prop | default | notes |
|---|---|---|
| `mode` | `"sparks"` | "sparks" (fast golden sparks), "motes" (slow glowing dots), "gold" (spinning gold flecks) |
| `background` | `"#070405"` | CSS background; "transparent" = overlay (particles use screen blend) |
| `backdrop` | `true` | paint the procedural dark fire-glow (or Klimt) backdrop |
| `color` | `""` | particle colour; empty = mode default (#FFD79A / #FF9A4A / #E2B84A) |
| `count` | `0` | particles per 1080p frame; 0 = mode default (140 / 34 / 70) |
| `speed` | `1` | rise speed multiplier |
| `life` | `1` | spark lifetime multiplier (sparks mode) |
| `size` | `1` | particle size multiplier |
| `wind` | `0.3` | sideways drift (positive = right) |
| `glow` | `true` | soft glow halos and fire glow |
| `seed` | `1` | random seed |

### `falling-petals` — Falling petals / leaves / papers

![falling-petals](../gallery/falling-petals.jpg)

Petals (or autumn leaves, or paper sheets) sway, spin and flip in 3D as they fall in three depth layers past a blossom branch over a soft meadow. Overlay-capable.

**Use for:** Spring / romance / seasons / time passing; papers for office chaos, letters, bureaucracy; overlay on any scene.  
**Rebuilt from:** video6 21.33-39.30, video14 era ambience (falling-papers)  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** light, nature  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `handwrite-on`, `petal-bloom`, `blur-in-title`  

| prop | default | notes |
|---|---|---|
| `mode` | `"petals"` | "petals", "leaves" or "papers" |
| `background` | `"#A9CDE0"` | CSS background; "transparent" = overlay (no painted meadow) |
| `backdrop` | `true` | paint the procedural sky / meadow / branch |
| `colors` | `[]` | fill colours; empty = mode palette |
| `count` | `0` | items per 1080p frame; 0 = mode default (30 / 22 / 8) |
| `speed` | `1` | fall speed multiplier |
| `sway` | `1` | sideways sway amplitude multiplier |
| `size` | `1` | item size multiplier |
| `wind` | `0.6` | constant sideways drift (positive = right) |
| `branch` | `true` | draw the blossom (or autumn) branch in the top-left |
| `seed` | `1` | random seed |

### `fireworks` — Fireworks

![fireworks](../gallery/fireworks.jpg)

Staggered fireworks over a night city: a faint launch streak climbs, a white flash ball holds for a few frames, then a peony of sparks expands with an ease-out-cubic, droops under gravity, fades from the core out and twinkles away, while a warm global light pulse briefly lifts the whole scene.

**Use for:** Celebrations, launches, milestones, "it worked!" beats, festive end cards.  
**Rebuilt from:** video13 1:02-1:04 firework-burst, video13 1:05 scene-light-flash  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, playful, night  
**Capabilities:** overlay (`{"scene":false}`) · weight: light  
**Pairs well with:** `city-skyline`, `number-counter`, `mask-rise-title`, `neon-sign`  
**Note:** scene:false = transparent bursts over your own scene (use blend screen).  

| prop | default | notes |
|---|---|---|
| `count` | `6` | number of shells |
| `every` | `30` | frames between launches |
| `firstAt` | `4` | frame of the first launch |
| `sparkCount` | `170` | sparks per burst |
| `radius` | `195` | burst radius in u (195 = 18 % of a 1080 frame) |
| `colors` | `["#ffcf73","#ff7aa8","#8fd3ff","#ffd27a","#b6ff8f","#ff9a…` | spark colours, one per shell (cycled) |
| `launchFrames` | `12` | launch streak duration |
| `flashFrames` | `3` | frames the white flash ball holds |
| `expandFrames` | `27` | burst expansion (ease-out cubic) |
| `fadeFrames` | `30` | extra frames for the sparks to fade and twinkle out |
| `lightPulse` | `0.3` | peak opacity of the warm global light pulse |
| `tint` | `"#FFC48A"` | light pulse colour (screen blend) |
| `scene` | `true` | paint the night sky + city (false = transparent overlay) |
| `seed` | `"festival"` | random seed |

### `fish-school` — Fish school + jellyfish

![fish-school](../gallery/fish-school.jpg)

Underwater scene: a loose school of fish sweeps across the frame along an eased Bézier S-curve, each fish trailing at its own lag with tail wobble, depth-faded colour and gentle wander, past pulsing glowing jellyfish, swaying kelp, god-rays and drifting particles.

**Use for:** Ocean / nature beats, "moving together" or crowd metaphors, calm ambient backgrounds.  
**Rebuilt from:** video23 0:03-0:40 sprite-swim-cycle (fish school, jellyfish)  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, nature  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `caustics-godrays`, `bubbles`, `blur-in-title`  

| prop | default | notes |
|---|---|---|
| `count` | `42` | number of fish in the school |
| `path` | `[[-0.1,0.66],[0.3,0.06],[0.7,1],[1.1,0.34]]` | cubic Bézier control points [[x,y] x4] as fractions of the frame; the school travels it over the clip (ease in-out) |
| `fishSize` | `78` | fish length in u |
| `fishColor` | `"#2d6c84"` | back colour of the fish |
| `bellyColor` | `"#cfe9ee"` | belly colour of the fish |
| `spread` | `150` | half-width of the school across its path (u) |
| `jellies` | `5` | number of pulsing jellyfish |
| `waterTop` | `"#2B88A2"` | water colour at the top |
| `waterBottom` | `"#004768"` | water colour at the bottom |
| `floor` | `true` | sandy floor with swaying kelp |
| `rays` | `true` | god-rays and surface shimmer |
| `seed` | `"reef"` | random seed |

### `flock` — V-formation flock

![flock](../gallery/flock.jpg)

A V-formation of red-crowned cranes flies right-to-left over snowy peaks: birds shrink with depth along each arm, flap on twos with offset phases (white down-strokes, grey-blue up-strokes) and bob against their wings, while a lone paper crane swoops in from the lower right and takes the last slot.

**Use for:** Migration / journey / teamwork beats, "joining the group" metaphors, sky interludes.  
**Rebuilt from:** video1 0:28-0:35 v-formation-flock, video1 0:30-0:32 bird-flap-cycle  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** light, paper, nature  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `blur-in-title`, `sun-rise-set`, `handwrite-on`  

| prop | default | notes |
|---|---|---|
| `count` | `9` | number of real cranes (including the leader) |
| `spacing` | `175` | distance between birds in u |
| `angleDeg` | `30` | angle of the V arms (degrees from horizontal) |
| `scaleFalloff` | `0.93` | size factor per bird toward the back (depth) |
| `birdSize` | `68` | leader body half-length in u |
| `period` | `25` | flap cycle in frames (25 = 0.833 s, drawn on twos) |
| `paperCrane` | `true` | a paper crane flies in and joins the formation |
| `joinAt` | `18` | frame the paper crane enters |
| `joinFrames` | `110` | frames it takes to reach its slot |
| `sky` | `"#7a9fc0"` | sky colour (top) |
| `horizon` | `"#a9c1d6"` | sky colour at the horizon |
| `mountains` | `true` | snowy peaks, cloud banks and conifers below |
| `grain` | `0.05` | film grain opacity |
| `seed` | `"migrate"` | random seed |

### `flow-lines` — Flow lines (wind / heat / steam / waves)

![flow-lines](../gallery/flow-lines.jpg)

Wavy streamlines: wind lines with end curls across a sky, rising heat wiggles over a desert road, soft steam wisps from a bowl, or braided pencil wave rows on paper. Overlay-capable.

**Use for:** Show air, heat, smell, sound or time: breeze over a landscape, a hot day, a hot meal, a ripple/time wipe.  
**Rebuilt from:** video1 15.0-18.33, video6 heat-wiggle-lines, video16 65.8-74.2, video20 182.5-183.7  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** light, paper, nature  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `handwrite-on`, `number-counter`, `chapter-header`  
**Note:** mode waves on paper makes a good section divider band.  

| prop | default | notes |
|---|---|---|
| `mode` | `"wind"` | "wind", "heat", "steam" or "waves" |
| `background` | `"#A2C0D4"` | CSS background; "transparent" = overlay (lines only) |
| `backdrop` | `true` | paint the mode scene (sky / desert road / kitchen bowl / paper) |
| `color` | `""` | line colour; empty = mode default (#5A6FAE / white / white / ink #2B2622) |
| `count` | `0` | lines per frame; 0 = mode default (7 / 16 / 8 per source / 16) |
| `speed` | `1` | animation speed multiplier |
| `amplitude` | `1` | wave amplitude multiplier |
| `weight` | `1` | stroke width multiplier |
| `curlProbability` | `0.5` | wind: chance a line ends in a curl |
| `sources` | `[]` | steam: [[x, y], ...] emitter positions as frame fractions (default bowl at [0.5, 0.66]) |
| `fade` | `true` | waves: 0.35 s fade in at the start and out at the end (wipe use) |
| `seed` | `1` | random seed |

### `grass-field` — Grass field (teal blades + golden leaves)

![grass-field](../gallery/grass-field.jpg)

Procedural tapered teal grass blades grow up from the bottom edge in a staggered wave, golden pointed leaves pop up behind, and the whole field sways with travelling wind gusts under a starry night sky.

**Use for:** A living foreground for night/sunrise scenes, an opening or end-card ground plane, a calm nature beat.  
**Rebuilt from:** video15 0:00-0:03 grass-blade-field, video15 0:26-0:27 grass-grow-up  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, nature, night  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `starfield-night`, `insect-flight`, `blur-in-title`  

| prop | default | notes |
|---|---|---|
| `background` | `"#0c1820"` | night sky colour (top) |
| `horizon` | `"#13262f"` | sky colour at the bottom edge |
| `bladeBase` | `"#253a43"` | front blade colour at the base |
| `bladeTip` | `"#3f7f86"` | front blade colour at the tip |
| `golden` | `true` | add the row of golden pointed leaves behind the teal blades |
| `goldenAt` | `26` | frame the golden leaves start popping up |
| `growAt` | `0` | frame the teal blades start growing (-1 = already grown) |
| `density` | `1` | blade density multiplier |
| `heightScale` | `1` | blade height multiplier |
| `swayAmp` | `2` | base sway in degrees (2.5 s period) |
| `gust` | `6` | extra lean of the travelling wind gust (degrees) |
| `windSpeed` | `1` | speed multiplier for sway and gusts |
| `stars` | `true` | twinkling stars |
| `moon` | `true` | crescent moon |
| `motes` | `true` | floating pollen motes drifting on the wind |
| `grain` | `0.07` | film grain opacity (0 = off) |
| `seed` | `"meadow"` | random seed for the blades |

### `insect-flight` — Insect dart flight (dragonflies / fireflies)

![insect-flight](../gallery/insect-flight.jpg)

Red dragonflies zig-zag over a sunny lotus pond in fast expo-eased darts separated by jittery hovers, their translucent wings flickering every frame, and one lands on a lotus bud and folds its wings; firefly mode fills a night meadow with glowing, blinking fireflies drifting between waypoints.

**Use for:** Nature ambience, "a small idea arrives / lands" beats, summer or night atmosphere.  
**Rebuilt from:** video1 0:42-0:46 insect-dart-land (dragonfly), video2 insect-zigzag-flight  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** mid, nature, night  
**Capabilities:** overlay (`{"scene":false}`) · weight: light  
**Pairs well with:** `grass-field`, `starfield-night`, `handwrite-on`  

| prop | default | notes |
|---|---|---|
| `kind` | `"dragonfly"` | "dragonfly" (sunny pond) or "firefly" (night meadow) |
| `count` | `3` | number of dragonflies |
| `fireflies` | `40` | number of fireflies (firefly mode) |
| `color` | `"#c0392b"` | dragonfly body colour |
| `dartFrames` | `5` | frames per dart (dragonfly; fireflies are slower) |
| `holdFrames` | `7` | hover frames between darts |
| `land` | `true` | the first dragonfly lands on the lotus bud |
| `glowColor` | `"#e8ff8a"` | firefly glow colour |
| `scene` | `true` | paint the pond / meadow background (false = transparent overlay) |
| `seed` | `"pond"` | random seed |

### `lightning-flash` — Lightning flash relight

![lightning-flash](../gallery/lightning-flash.jpg)

A rainy night house scene is relit by lightning: a forked bolt draws on, the frame flashes to a pink storm-lit plate for 2 frames and decays back to night in ~0.3 s; repeatable, with double strikes. Overlay-capable.

**Use for:** Drama, shock, revelation or horror punctuation; a storm establishing shot; overlay the flash + bolt on any night footage.  
**Rebuilt from:** video16 52.72-53.20, 80.72-81.10  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** dark, nature, night  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `rain`, `stamp-slam`, `glitch-image`  

| prop | default | notes |
|---|---|---|
| `background` | `"#04080F"` | CSS background; "transparent" = overlay (bolt + screen flash + rain only) |
| `backdrop` | `true` | paint the night house scene and its lit plate |
| `strikes` | `[28,104]` | frames where lightning strikes |
| `sheetFlashes` | `[66]` | frames of distant cloud-only flickers (no bolt, ~0.35 intensity) |
| `holdFrames` | `2` | frames the flash holds at full brightness |
| `decay` | `0.1` | exponential decay time constant in seconds (0.1 = source) |
| `doubleStrike` | `true` | second flash 3 frames after the hold at 0.6 intensity |
| `rain` | `true` | rain streaks (brighten during the flash) |
| `boltColor` | `"#FFFFFF"` | bolt core colour |
| `glowColor` | `"#C9A8FF"` | bolt glow colour |
| `flashColor` | `"#E8C6E0"` | overlay-mode flash tint |
| `shake` | `6` | camera jolt in px on strike frames |
| `seed` | `1` | random seed (changes bolt shapes) |

### `parallax-landscape` — Parallax landscape truck / speed-run

![parallax-landscape](../gallery/parallax-landscape.jpg)

Layered flat-vector landscape (sky and clouds, two mountain ranges, distant fields with a village, a hill, a tree row, foreground and whizzing near blades) trucking sideways at depth-proportional speeds with a flapping paper crane; speed-run mode ramps to a gallop-speed rush over a savanna with a fixed giant sun, horizontal streak blur on the near layers and light streaks.

**Use for:** Travel and progress beats, establishing shots, "moving fast" moments behind a hero character.  
**Rebuilt from:** video1 0:15-0:18 parallax-landscape-truck, video15 0:13-0:20 parallax-speed-run  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, paper, nature  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `map-route`, `chapter-header`, `kinetic-captions`  

| prop | default | notes |
|---|---|---|
| `mode` | `"truck"` | "truck" (slow camera truck) or "speedrun" (ramp up to a rush, blur streaks, ramp down) |
| `palette` | `"auto"` | "auto" (day for truck, savanna for speedrun) \| "day" \| "savanna" \| "dusk" |
| `speed` | `3` | truck mode foreground speed in px per frame at 1080 |
| `peakSpeed` | `123` | speed-run peak foreground speed in px per frame (123 = 3700 px/s) |
| `layerFactors` | `[]` | speed factors for [far mtn, near mtn, fields, hill, trees, ground, front blades]; [] = auto per mode |
| `rampIn` | `48` | speed-run ease-in ramp length (frames) |
| `rampOut` | `33` | speed-run ease-out ramp length (frames) |
| `hero` | `"crane"` | "crane" flapping paper crane or "none" |
| `streaks` | `true` | horizontal light streaks at speed (speed-run) |
| `grain` | `0.06` | film grain opacity |
| `seed` | `"valley"` | landscape seed |

### `rain` — Rain

![rain](../gallery/rain.jpg)

Night street in the rain: 3 parallax layers of slanted streaks, lamp-lit cone, ground ripples; optional glass droplets and trickles. Works as a transparent overlay.

**Use for:** Moody/rainy ambience under any scene; set background "transparent" to lay rain over footage, glass: true for a window POV.  
**Rebuilt from:** video1 34.9-41.7, video14 109.75-115.2, video16 46.0-52.2, 75.9-80.1  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** dark, nature, night  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `light-sweep`, `city-skyline`, `lightning-flash`, `story-caption-box`  

| prop | default | notes |
|---|---|---|
| `background` | `"#060D16"` | CSS background; "transparent" = overlay mode (no painted street) |
| `backdrop` | `true` | paint the procedural night street (sky, blocks, wet road, lamp) |
| `color` | `"#C8D6E5"` | streak / ripple colour |
| `density` | `1` | streak + ripple count multiplier (1 = 150/300/600 per 1080p frame) |
| `speed` | `1` | fall speed multiplier (1 = 2600/1800/1200 px/s) |
| `angle` | `8` | degrees from vertical; positive falls to the right |
| `layers` | `3` | 1-3 parallax layers (near layer always kept) |
| `ripples` | `true` | expanding ripple ellipses on the ground band |
| `groundY` | `0.64` | fraction of height where the ground / ripple band starts |
| `glass` | `false` | window-glass POV: droplets with highlights, slow trickles, backdrop blurred |
| `glassDrops` | `40` | number of static droplets per 1080p frame |
| `lamp` | `true` | street lamp with volumetric cone that lights the streaks |
| `lampColor` | `"#F0904F"` | sodium lamp colour |
| `seed` | `1` | random seed |

### `snowfall` — Snowfall

![snowfall](../gallery/snowfall.jpg)

Layered snow drifting diagonally over a dusk snowy landscape; blizzard mode streams pixel snow and streaks sideways through a blue-grey white-out. Overlay-capable.

**Use for:** Winter / cold / quiet beats; blizzard for harsh weather, isolation or a white-out scene change; set background "transparent" to snow over anything.  
**Rebuilt from:** video2 12.00-13.08, 27.25-28.92, video21 7.20-8.35, 21.9-23.3  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** light, pixel, nature  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `starfield-night`, `blur-in-title`, `handwrite-on`  

| prop | default | notes |
|---|---|---|
| `mode` | `"drift"` | "drift" (soft layered snow) or "blizzard" (horizontal pixel snow + white-out) |
| `background` | `"#3A5D80"` | CSS background; "transparent" = overlay (no painted landscape) |
| `backdrop` | `true` | paint the procedural landscape / white-out |
| `color` | `"#FFFFFF"` | flake colour |
| `density` | `1` | flake count multiplier (drift 520/240/60, blizzard 600 per 1080p frame) |
| `speed` | `1` | fall / stream speed multiplier |
| `wind` | `1` | horizontal drift multiplier (negative blows left) |
| `size` | `1` | flake size multiplier (drift mode) |
| `streaks` | `0` | extra fast wind streak lines in drift mode (video2 hydrant look), e.g. 120 |
| `pixelSize` | `6` | blizzard pixel size in px at 1080p (6 = source) |
| `seed` | `1` | random seed |

### `starfield-night` — Starfield night

![starfield-night](../gallery/starfield-night.jpg)

Dark teal night sky with twinkling cream stars, a grainy crescent moon that fades in, swaying teal grass and a shooting star. Overlay-capable.

**Use for:** Calm night / sleep / dream / wish beats, end cards and quiet intros; transparent overlay for stars over any sky.  
**Rebuilt from:** video15 0.0-0.35, 25.55-26.1  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop, accent · **Mood:** dark, nature, night  
**Capabilities:** overlay (`{"background":"transparent","backdrop":false}`) · weight: light  
**Pairs well with:** `aurora`, `blur-in-title`, `grass-field`, `end-card-credits`  

| prop | default | notes |
|---|---|---|
| `background` | `"#0C1820"` | CSS background; "transparent" = overlay (stars, moon, shooting star only) |
| `backdrop` | `true` | paint the teal sky gradient, grass and print grain |
| `starCount` | `90` | stars per 1080p frame (source ≈ 80) |
| `starColor` | `"#FDF3DB"` | star / moon colour |
| `moon` | `true` | show the crescent moon |
| `moonPos` | `[0.7,0.22]` | [x, y] moon centre as fractions of the frame |
| `moonSize` | `46` | moon radius in px at 1080p |
| `moonPhase` | `0.42` | crescent thickness: inner-circle offset as a fraction of the radius (0.42 = source) |
| `shootingStar` | `true` | one shooting star streak |
| `shootingAt` | `0.45` | when the shooting star starts, as a fraction of the duration |
| `grass` | `true` | swaying teal grass silhouette along the bottom |
| `grain` | `true` | static print speckle over the frame |
| `seed` | `1` | random seed |

### `sun-rise-set` — Sun rise / sun set

![sun-rise-set](../gallery/sun-rise-set.jpg)

Sunrise: a huge orange gradient disc rises from behind teal grass with an ease-out, grows a ring of spike rays and golden leaves pop up over a starry night. Sunset mode: stepped purple-to-peach sky bands, a cream sun with rotating dashed rays sinks behind the horizon and the sky darkens to dusk.

**Use for:** Openers, "a new day" beats, endings and time-passing; a giant backlight disc behind a hero.  
**Rebuilt from:** video15 0:00-0:03 sunrise-disc-rise, video1 0:52-0:58 sun-set-descent  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, nature, night  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `flock`, `blur-in-title`, `handwrite-on`  

| prop | default | notes |
|---|---|---|
| `mode` | `"rise"` | "rise" (video15 sunrise disc) or "set" (video1 sunset descent) |
| `background` | `"#0c1820"` | night sky colour (rise mode) |
| `sunCore` | `"#fb8346"` | sun gradient centre colour (rise) |
| `sunRim` | `"#f1643e"` | sun gradient rim colour (rise) |
| `rayColor` | `"#c4573c"` | spike ray colour (rise) |
| `rayCount` | `70` | number of rays (70 rise, try 36 for set) |
| `rayLength` | `72` | ray length in u (rise) / ray length scale (set) |
| `sunScale` | `1` | sun size multiplier |
| `riseStart` | `6` | frame the sun starts rising |
| `riseFrames` | `45` | rise duration in frames (ease-out quad) |
| `grass` | `true` | teal grass foreground (rise) |
| `golden` | `true` | golden leaves pop up after the rise |
| `moon` | `true` | crescent moon that sinks and fades as the sun rises |
| `bands` | `["#8d5f88","#a76a82","#bb727d","#d08a80","#dcab8c","#f5ed…` | sunset sky band colours, top to horizon (set) |
| `duskBands` | `["#423463","#563d6e","#6e4672","#8a5272","#a8636a","#d08a…` | the same bands at full dusk (set) |
| `land` | `["#65536e","#50425e","#3f344c"]` | land layer colours far to near (set) |
| `grain` | `0.07` | film grain opacity |
| `seed` | `"sun"` | random seed |

### `time-of-day-grade` — Time-of-day grade (day to night)

![time-of-day-grade](../gallery/time-of-day-grade.jpg)

A simple procedural hillside village whose sky gradient and colour grade keyframe from day through golden hour, dusk pink and mauve to night: the sun arcs down and sets behind the hills, clouds pick up the sunset, a multiply night grade cools everything, the moon and stars come out and the house windows switch on one by one.

**Use for:** Time passing, "by the end of the day", before/after moods, calm transitions between story beats.  
**Rebuilt from:** video13 time-of-day-grade, video16 0:44-0:46 grade-to-night, video20 scene-grade-shift  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, nature, night  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `chapter-header`, `number-counter`, `kinetic-captions`  

| prop | default | notes |
|---|---|---|
| `stops` | `[{"t":0,"skyTop":"#7fa6d6","skyBottom":"#cfe0ec","sun":"#…` | grade keyframes [{t 0..1, skyTop, skyBottom, sun, grade}] (grade = multiply wash colour) |
| `holdStart` | `12` | frames held at the first stop |
| `holdEnd` | `30` | frames held at the last stop |
| `lights` | `true` | house windows switch on as it gets dark |
| `lightsAt` | `0.25` | darkness (0..1) at which the first windows light |
| `nightGrade` | `0.75` | strength of the #0C1A2E night multiply layer (video16 uses 0.75) |
| `sun` | `true` | sun disc that sets behind the hills |
| `moon` | `true` | moon rising at night |
| `hills` | `["#9db4c4","#7fa37a","#5f8f4f"]` | hill colours far, mid, near (before grading) |
| `seed` | `"village"` | random seed |

### `topdown-terrain` — Top-down terrain scroll

![topdown-terrain](../gallery/topdown-terrain.jpg)

Bird’s-eye view: a fixed paper crane (with hatched cast shadow and streaming dashed trail) flies over seeded top-down terrain — fields, river and town roofs, ocean with a whale breach, desert dunes, snowy peaks, night city, autumn forest — that scrolls diagonally with a speed ramp and hard-cuts between biomes.

**Use for:** Journeys and "around the world" montages, travel/progress beats, map-like transitions under a hero.  
**Rebuilt from:** video1 0:18-0:28 topdown-terrain-scroll, video1 0:18-0:28 biome-hardcut-montage  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, paper, nature  
**Capabilities:** paints its own background · image: `heroSrc` · weight: light  
**Pairs well with:** `map-route`, `chapter-header`, `number-counter`  

| prop | default | notes |
|---|---|---|
| `biomes` | `["farmland","ocean","desert","snow","city","forest"]` | list of biomes: farmland \| ocean \| desert \| snow \| city \| forest |
| `montage` | `true` | hard-cut through all biomes (true) or scroll only the first one (false) |
| `speed` | `8` | ground speed in px per frame at 1080 (8 = source farmland speed) |
| `speedRamp` | `1.96` | speed multiplier reached at the end (1.96 = 8 -> 15.7 px/f as in the source) |
| `angle` | `40` | flight heading in degrees clockwise from up (terrain moves the opposite way) |
| `hero` | `"crane"` | "crane" (procedural paper crane) or "none" |
| `heroSrc` | `""` | optional public/ image path used as the hero instead of the crane |
| `heroSize` | `165` | hero half-wingspan in u |
| `shadow` | `true` | hatched cast shadow under the hero |
| `trail` | `true` | dashed flight trail behind the hero |
| `trailColor` | `"#8688ad"` | trail colour |
| `grain` | `0.06` | paper grain opacity |
| `seed` | `"journey"` | terrain seed |

## character

### `blob-mascot` — Blob mascot hop & roll

![blob-mascot](../gallery/blob-mascot.jpg)

White eyed sphere hops down an isometric bar staircase with squash/stretch, painting each cap, lands with a tile ripple, then rolls back with its eyes coming round, leaving a fading peach trail.

**Use for:** Declining-metric metaphors, playful loaders, step-by-step progress where a tiny character visits each step.  
**Rebuilt from:** video7 0:00-0:16 squash-stretch-blob, roll-with-trail, hop-and-paint, floor-tile-ripple, impact-confetti, follow-cam-diagonal  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, 3d, playful  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `confetti-burst`, `emote-pop`, `number-counter`  

| prop | default | notes |
|---|---|---|
| `background` | `"#EFE8DE"` |  |
| `floorColor` | `"#ECE4D8"` |  |
| `barColor` | `"#CEC6BB"` |  |
| `accent` | `"#E48E6D"` | cap paint colour |
| `trailColor` | `"#F0D6C4"` | roll trail tint |
| `bodyColor` | `"#F9F4EE"` |  |
| `steps` | `5` | number of bars in the staircase |
| `hopFrames` | `18` | frames per hop at the top (hops speed up toward the bottom) |
| `rollFrames` | `72` | frames for the roll back along the floor |
| `trailFade` | `90` | frames for a trail tile to fade back |
| `squash` | `0.3` | landing squash amount (sy = 1 - squash; floor landing is 1.6x) |
| `followCam` | `true` | camera follows the blob diagonally |

### `box-bot` — Box-bot mascot

![box-bot](../gallery/box-bot.jpg)

Orange cube mascot with dark rectangular eyes, little arms and four stubby legs acting out a script: walk on twos, look around, emote, hop with squash and landing, wave, run off.

**Use for:** A friendly guide/mascot that walks in, reacts (? ! idea, hearts) and leaves; explainer beats that need a character.  
**Rebuilt from:** video20 box-bot-character + emote-icon-pop, video13 cube-mascot-rig, eye-expression-swap, hop-cycle, video12 character-hop-squash  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, paper, playful  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `emote-pop`, `scribble-ball`, `sparkle-burst`, `chat-bubbles`  

| prop | default | notes |
|---|---|---|
| `style` | `"sketch"` | 'sketch' (v20 pencil on paper) \| 'clean' (v13 sunny toon) \| 'toon' (v12 comic synthwave) |
| `script` | `[{"action":"walk","to":0.5,"frames":54},{"action":"look",…` | sequence of actions: {action:'walk'\|'run', to?\|dx?, frames} {action:'hop', dx?, height?, frames} {action:'look', dir:-1\|1} {action:'emote', icon:'?'\|'!'\|'heart'\|'bulb'\|'sweat'\|'scribble'\|'sparkle'\|'zzz'} {action:'wave'} {action:'turn', yaw} {action:'blink'} {action:'idle'\|'expression', expression?} |
| `startX` | `0.16` | start position as a fraction of frame width |
| `size` | `0.26` | body width as a fraction of the short side |
| `bodyColor` | `""` | override body colour ('' = style default) |
| `shadeColor` | `""` | override shade-face colour ('' = style default) |
| `eyeColor` | `""` | override eye colour ('' = style default) |
| `legs` | `"quad"` | 'quad' (v20 four corner legs) \| 'row' (v13 four legs in a row) |
| `snout` | `false` | pig-snout variant |
| `flower` | `false` | pink flower on the head (v20 later acts) |
| `onTwos` | `true` | step the character every 2nd frame (12/15 fps hand-animated feel) |
| `background` | `""` | override background colour ('' = style default) |
| `floorY` | `0` | ground line as a fraction of height (0 = auto) |

### `crowd-bob` — Crowd stomp / cheer

![crowd-bob](../gallery/crowd-bob.jpg)

A massed perspective crowd of box-bots, ink-etched soldiers or paper dolls; the camera cranes up to reveal its size while everyone stomp-hops in sync (or cheer-bobs with hearts).

**Use for:** Scale beats (“thousands of users / sessions / agents”), community and celebration moments, armies of AI.  
**Rebuilt from:** video5 crowd-stomp-hop (0:02.6-0:10), video20 crowd-cheer-bob (3:22-3:25), video12 clone-army-crane-reveal (0:36.5-0:38.6)  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** subject · **Mood:** mid, paper, playful  
**Capabilities:** paints its own background · weight: light  
**Pairs well with:** `neon-sign`, `confetti-burst`, `fireworks`  

| prop | default | notes |
|---|---|---|
| `character` | `"boxbot"` | 'boxbot' (v12 synthwave clones) \| 'soldier' (v5 blue ink etching) \| 'doll' (v20 paper sketch) |
| `mode` | `"stomp"` | 'stomp' synchronised hop (v5) \| 'cheer' random-phase arms-up bob with hearts (v20) |
| `crane` | `true` | camera cranes up and tilts down to reveal the crowd |
| `craneStart` | `14` |  |
| `craneFrames` | `66` | length of the crane move (easeInOutCubic) |
| `rows` | `30` | rows in the formation |
| `cols` | `27` | columns in the formation |
| `periodFrames` | `22` | stomp period (v5: 22 f = 80 BPM) |
| `amplitude` | `0.45` | hop height in character heights at the front row |
| `depthFalloff` | `1.4` | exponent of the amplitude falloff toward the back rows |
| `stompStart` | `30` | frame of the first stomp |
| `hearts` | `true` | float hearts in cheer mode |
| `heroExcluded` | `true` | front-centre hero stays still (v5) |
| `seed` | `7` |  |
| `background` | `""` |  |

### `sign-drop` — Sign drop & swing

![sign-drop](../gallery/sign-drop.jpg)

A neon, comic banner or wooden sign drops in on ropes with a springy bounce, swings on a damped pendulum and settles into a gentle sway; neon flickers on after landing.

**Use for:** Announcements, chapter cards, “now open / limit reached / reset” beats, shop or level names.  
**Rebuilt from:** video12 43:17 sign-drop-swing (ATTENTION banner), 60:67 LIMIT REACHED neon, video13 pendulum-sway  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, neon, playful  
**Capabilities:** paints its own background · text: `text`, `subtext` · weight: light  
**Pairs well with:** `embers`, `film-look`, `confetti-burst`  

| prop | default | notes |
|---|---|---|
| `text` | `"Now Open"` | main sign text |
| `subtext` | `"step right in"` | small second line ('' to hide) |
| `style` | `"neon"` | 'neon' (dark plate, glowing tube) \| 'banner' (v12 maroon comic banner) \| 'wood' (planks on ropes) |
| `color` | `""` | text / neon colour ('' = style default) |
| `background` | `""` | scene colour ('' = style default) |
| `from` | `"top"` | 'top' drop or 'topRight' swing-in |
| `dropFrame` | `6` | frame the drop starts |
| `swingAmp` | `8` | initial swing amplitude in degrees |
| `restAngle` | `0` | resting tilt in degrees (v12 banner hangs at about -10) |
| `width` | `0.6` | sign width as a fraction of frame width (landscape) |
| `exit` | `false` | pull the sign back up at the end |

### `walker-world-scroll` — Walker world scroll (era wipe)

![walker-world-scroll](../gallery/walker-world-scroll.jpg)

A chibi explorer in a bucket hat walks in place at 37.5 % W while procedural era panels (cave, Egypt, Greek vase, ink wash, 8-bit, vaporwave) scroll by with eased stop-and-go; torn decorated seams restyle him as they pass, with a confetti burst and an era badge swap.

**Use for:** History / timeline / evolution stories, “through the ages” montages, product version timelines, chapter travel.  
**Rebuilt from:** video14 pinned-walker-world-scroll, torn-seam-era-wipe, seam-split-character-restyle, style-swap-confetti-burst, era-badge-crossfade, chibi-hero-rig, gag-beat  
**Default length:** 570 frames (19.0 s @ 30 fps)

**Roles:** subject · **Mood:** mid, paper, playful  
**Capabilities:** paints its own background · text: `eras` · weight: light  
**Pairs well with:** `chapter-header`, `era-dial`, `film-look`  

| prop | default | notes |
|---|---|---|
| `eras` | `[{"style":"cave","label":"Cave painting","year":"15000 BC…` | list of {style: 'cave'\|'egypt'\|'greek'\|'ink'\|'pixel'\|'vaporwave', label, year} |
| `speed` | `0.42` | cruise speed in frame widths per second (source ≈ 0.29) |
| `stopFrames` | `30` | hold length of each gag stop |
| `eraWidth` | `0.8` | width of each era panel in frame widths |
| `stopAt` | `0.45` | where in each era the walker stops (0..1) |
| `heroX` | `0` | hero screen x as a fraction of width (0 = auto: 0.375 landscape) |
| `gags` | `true` | play a small gag (wave / jump / point / cheer) at every stop |
| `badge` | `true` | show the year / title badge top-right |
| `confettiCount` | `36` | confetti capsules per seam crossing |
| `grain` | `true` | global speckle grain overlay |

## data

### `beat-montage` — Accelerating beat montage

![beat-montage](../gallery/beat-montage.jpg)

Hard-cut image montage whose cuts accelerate 12 f -> 6 f -> 3 f, a persistent centre dot, breathing sonar rings on the beat, per-shot micro push and beat-synced style swaps.

**Use for:** Recaps, "so many examples" sequences, showreels, building energy before a reveal.  
**Rebuilt from:** video4 4:50-16:00 accelerating-montage + sonar-ring-overlay, video2 beat-hardcut-montage, video18 beat-style-shuffler  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** mid, photo, hud  
**Capabilities:** paints its own background · image: `images` · weight: light  
**Pairs well with:** `neon-sign`, `kinetic-captions`, `film-look`  

| prop | default | notes |
|---|---|---|
| `images` | `["demo/koi.jpg","demo/jellyfish.jpg","demo/lighthouse.jpg…` | public/ image paths cycled through the shots (empty = procedural scenes) |
| `steps` | `[12,6,3]` | frames per cut for each block (accelerating) |
| `counts` | `[6,8,24]` | number of shots in each block |
| `bpm` | `150` | beat tempo: sets the sonar ring period and the dot pulse (150 bpm = 12 f) |
| `shuffle` | `0.35` | 0..1 chance that a shot after the first block is restyled |
| `styles` | `["duotone","dot","invert"]` | styles to shuffle between: duotone \| dot \| invert |
| `rings` | `"fast"` | sonar ring overlay: 'fast' (last block), 'always' or 'off' |
| `pingBeats` | `true` | insert 6-frame paper ping beats between blocks |
| `dotColor` | `"#3780E7"` |  |
| `paper` | `"#ECE4D7"` |  |
| `ringColor` | `"#7AA8E0"` |  |
| `seed` | `2` |  |

### `iso-bar-chart` — Isometric bar-chart staircase

![iso-bar-chart](../gallery/iso-bar-chart.jpg)

Data-driven clay-isometric bar chart on a tiled floor; a white eyed blob hops down it on the beat painting each cap orange (squash, confetti), the paint cascades, the floor ripples, and it rides a pillar back up — a seamless loop.

**Use for:** Metric stories (declines, rankings, progress through steps) as a friendly looping hero animation.  
**Rebuilt from:** video7 0:00-16:04 (iso-bar-staircase, hop-and-paint, squash-stretch-blob, impact-confetti, paint-cascade, floor-tile-ripple, roll-with-trail, pillar-rise-sink, follow-cam-diagonal)  
**Default length:** 480 frames (16.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, 3d, playful  
**Capabilities:** paints its own background · seamless loop · weight: light  
**Pairs well with:** `number-counter`, `chapter-header`, `confetti-burst`  
**Note:** loop: true (default) is a seamless loop; great as a friendly looping stats hero.  

| prop | default | notes |
|---|---|---|
| `values` | `[16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]` | bar heights (any series; loop length = (N-2)*beat + 270 f for N>=6) |
| `beatFrames` | `15` | frames per hop (15 = 0.5 s) |
| `showCharacter` | `true` | show the hopping blob (off: caps paint on the same beat) |
| `loop` | `true` | true = seamless loop with return trip; false = bars rise in, blob drops, descends and settles on the floor |
| `maxHeight` | `8` | height of the tallest bar in cells |
| `zoom` | `1` | close-up camera scale multiplier |
| `hopHeight` | `0.6` | hop arc height in cells |
| `accent` | `"#E48E6D"` | painted cap colour |
| `ghost` | `"#F7DAC9"` | cap colour as it materialises |
| `barColor` | `"#E7E0D5"` | bar body colour |
| `floorColor` | `"#ECE4D8"` | floor tile colour |
| `background` | `"#E9E1D6"` | backdrop colour behind the floor |
| `pillarColor` | `"#E5BDA6"` | lift pillar colour |
| `seed` | `7` | confetti / ripple jitter seed |

### `live-chart` — Live chart / ECG traces

![live-chart](../gallery/live-chart.jpg)

Line charts that draw live with a glowing head dot: growth curve + synapse curve + scrolling ECG ('trace'), two heartbeats drifting into sync ('sync'), or a quality line turning red and falling while a gauge needle swings down ('decline').

**Use for:** Growth / vital-sign / metric beats, "in sync" relationship moments, "it got worse" data moments.  
**Rebuilt from:** video11 8:00-9:42 live-chart-trace, video11 20:00-21:96 dual-heartbeat-sync, video12 52:83-57:60 data-decline-chart  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, hud  
**Capabilities:** paints its own background · text: `title`, `xLabel`, `yLabel`, `label`, `gaugeLabels` · weight: light  
**Pairs well with:** `number-counter`, `hud-chrome`, `callout-labels`  

| prop | default | notes |
|---|---|---|
| `mode` | `"trace"` | 'trace' (growth + synapses + ECG), 'sync' (dual heartbeat sync), 'decline' (quality chart + gauge) |
| `data` | `[0.05,0.12,0.3,0.6,1,1.5,2.1,2.7,3.1,3.4]` | trace: main curve values (one sample revealed per 0.25 s) |
| `declineValues` | `[1,0.93,0.97,0.8,0.84,0.62,0.66,0.45,0.32]` | decline: values of the falling red line |
| `title` | `"fetal growth"` | trace: chart title; decline: monitor title ('QUALITY' also names the gauge REASONING EFFORT) |
| `xLabel` | `"wk"` |  |
| `yLabel` | `"kg"` |  |
| `readout` | `"wk 8 → wk 40 · 3.4 kg"` | trace: typed mono readout under the chart |
| `color` | `"#C8D0F5"` | trace: main curve colour |
| `ecgColor` | `"#E05DD5"` | trace: ECG colour |
| `syncColors` | `["#E978D6","#F4D96A"]` | sync: [first, second] trace / heart colours |
| `label` | `"in sync"` | sync: label typed when the traces align |
| `bpm` | `140` | ECG beats per minute (sync uses it for both hearts) |
| `colorFrom` | `"#5FE0F0"` | decline: starting line colour |
| `colorTo` | `"#E75855"` | decline: colour after the switch |
| `gaugeLabels` | `["LOW","MEDIUM","HIGH"]` |  |
| `gaugeFrom` | `0.85` | decline: needle start 0..1 (0 = LOW, 1 = HIGH) |
| `gaugeTo` | `0.5` | decline: needle end 0..1 |
| `background` | `"#020414"` | background colour (trace / decline) |

### `map-route` — Map route

![map-route](../gallery/map-route.jpg)

Top-down illustrated paper map (fields, river, trees, blossoms) with a marker flying a curved dotted route, a red bearing vector with angle arc and distance ticks, a dashed line to the sun; hop style hops leg by leg leaving popping dots.

**Use for:** Journeys, routes, foraging / delivery paths, travel distances, "from A to B" explainers.  
**Rebuilt from:** video6 32-40 s (map-flight-path, waggle-dance-diagram), video22 (hop-move-dotted-trail)  
**Default length:** 270 frames (9.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, paper, nature  
**Capabilities:** paints its own background · text: `waypoints` · weight: light  
**Pairs well with:** `chapter-header`, `number-counter`, `story-caption-box`  

| prop | default | notes |
|---|---|---|
| `waypoints` | `[{"x":-0.62,"y":0.55,"label":"Hive"},{"x":-0.18,"y":0.12,…` | route stops {x, y, label} in map space -1..1 (first = start, last = bearing target) |
| `style` | `"flight"` | flight = smooth curve; hop = straight legs with hop arcs, popping dots and landing rings |
| `trail` | `"dots"` | dots \| dash (marching) \| line |
| `marker` | `"bee"` | bee \| pin \| dot |
| `showBearing` | `true` | red bearing vector, angle arc and distance ticks from the start |
| `showSun` | `true` | sun icon with dashed tie line to the marker |
| `distanceKm` | `2.4` | distance shown at the end of the route |
| `seed` | `6` | map layout seed |
| `paper` | `"#C0D288"` | map base colour |
| `trailColor` | `"#24221C"` |  |
| `vectorColor` | `"#C83230"` |  |
| `sunColor` | `"#E8A93A"` |  |
| `zoom` | `1` | camera zoom |

### `panel-triptych` — Panel triptych collide

![panel-triptych](../gallery/panel-triptych.jpg)

Navy grid backdrop; three coloured panel outlines draw on clockwise, pictures slide into them with numbered labels, the panels slam together with doubled misprint outlines, then prison bars drop.

**Use for:** "Three things came together" explainers, numbered causes/factors, list reveals that end in a consequence.  
**Rebuilt from:** video10 23:00-37:80 navy-grid-backdrop, stroke-draw-frames, mask-slide-image-fill, panel-collide, prison-bars-drop  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, photo, editorial  
**Capabilities:** paints its own background · text: `title`, `panels`, `caption` · weight: light  
**Pairs well with:** `stamp-slam`, `film-look`, `kinetic-captions`  

| prop | default | notes |
|---|---|---|
| `title` | `"Every time, three things collided"` | serif title above the panels |
| `panels` | `[{"src":"demo/lantern.jpg","label":"A light left burning"…` | {src, label, color} for each of the three panels (src empty = procedural scene) |
| `caption` | `"three things collided."` | kinetic caption under the panels (words pop on one by one) |
| `highlight` | `"collided"` | caption word that gets the red highlight box |
| `bars` | `true` | drop prison bars at the end |
| `barCount` | `12` | number of bars across the frame |
| `collideAt` | `104` | frame of the panel slam |
| `background` | `"#0b1018"` |  |
| `gridSize` | `90` | backdrop grid spacing in px at 1080p |
| `seed` | `3` |  |

### `perspective-grid` — Hand-drawn perspective board

![perspective-grid](../gallery/perspective-grid.jpg)

Pen strokes draw a perspective trapezoid board, coloured-pencil hatch fills squares, doodle pieces pop in (outline -> blob -> sprite) during a pull-back that reveals margin doodles, then move-hint rings and "your move".

**Use for:** Game boards, calendars / schedules drawn by hand, planning grids, playful "your move" decision beats.  
**Rebuilt from:** video22 7:60-10:50 perspective-grid-draw-on, pencil-hatch-squares, doodle-piece-pop-in, move-hint-rings, board-pullback-reveal  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, paper  
**Capabilities:** paints its own background · text: `caption` · weight: light  
**Pairs well with:** `handwrite-on`, `sparkle-burst`, `emote-pop`  

| prop | default | notes |
|---|---|---|
| `cols` | `8` | board columns (files) |
| `rows` | `8` | board rows (ranks) |
| `strokeColor` | `"#483E31"` | pen ink colour |
| `hatchColor` | `"#9BAF8E"` | coloured-pencil hatch on dark squares |
| `labelColors` | `["#C8453B","#3F5FB8"]` | [left-half, right-half] file letter colours |
| `lightColors` | `["#F2B36B","#E08F4A","#5A3A22"]` | [body, shade, ink] of the light pieces |
| `darkColors` | `["#8A7FE6","#5E54C8","#2A2550"]` | [body, shade, ink] of the dark pieces |
| `ringColor` | `"#B19551"` | ochre hint ring / bracket colour |
| `paper` | `"#E9E4DA"` |  |
| `caption` | `"your move"` | handwritten line under the board at the end |
| `pieces` | `true` | pop in doodle pieces on the first/last two ranks |
| `doodles` | `true` | draw margin doodles during the pull-back |
| `hints` | `true` | select a piece and show move-hint rings + cursor |
| `pullback` | `1.35` | starting zoom of the camera pull-back (1 = none) |
| `seed` | `2` |  |

### `science-reticle` — Science HUD reticle

![science-reticle](../gallery/science-reticle.jpg)

Instrument overlay (rings, spokes, tick ring, axis, scale bar) builds around a procedural cell or planet that is drawn by a clockwise comet sweep; typed mono labels on leader lines, comet laps the outlines.

**Use for:** Scientific / microscopic / astronomical subjects, "under the microscope" beats, measured close-ups.  
**Rebuilt from:** video11 1:79-5:20 scientific-hud-reticle, ring-sweep-build, typewriter-mono-label, outline-comet-trace  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, hud  
**Capabilities:** paints its own background · text: `labels`, `scaleLabel` · weight: light  
**Pairs well with:** `callout-labels`, `number-counter`, `caustics-godrays`  

| prop | default | notes |
|---|---|---|
| `subject` | `"cell"` | 'cell' (egg with corona cells, honeycomb and pronuclei) or 'planet' (banded planet with a ring) |
| `labels` | `["day 0 · fertilisation","zona pellucida"]` | [upper label, lower label] typed on leader lines |
| `scaleLabel` | `"100 µm"` | scale bar caption |
| `axisAngle` | `-28` | angle of the long tick axis in degrees |
| `spokes` | `6` | number of spoke segments between the outer rings |
| `color` | `"#5A5D8A"` | reticle line colour |
| `accent` | `"#8B8DB8"` | leader line colour |
| `background` | `"#020414"` |  |
| `seed` | `3` |  |

### `thumbnail-mosaic` — Thumbnail mosaic (disc / grid / recap)

![thumbnail-mosaic](../gallery/thumbnail-mosaic.jpg)

Dozens of thumbnails as a tilted glowing disc of rings, a gapless wall you zoom out into, or a recap grid springing onto a monitor; all end in a staggered pop-out to a single dot.

**Use for:** "…and hundreds more" endings, recaps of everything shown, portfolio walls, collapsing many items into one idea.  
**Rebuilt from:** video4 16:00-17:75 thumbnail-disc-collapse + staggered-pop-out, video2 mosaic-grid-finale, video14 121-127 monitor-push-thumbnail-recap  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, photo, playful  
**Capabilities:** paints its own background · image: `images` · weight: light  
**Pairs well with:** `end-card-credits`, `mask-rise-title`, `confetti-burst`  

| prop | default | notes |
|---|---|---|
| `layout` | `"disc"` | 'disc' (video4 ring disc), 'grid' (video2 mosaic wall), 'recap' (video14 monitor grid) |
| `images` | `["demo/koi.jpg","demo/jellyfish.jpg","demo/lighthouse.jpg…` | public/ image paths cycled through the thumbnails (empty = all procedural scenes) |
| `procedural` | `0.45` | 0..1 share of thumbnails drawn as procedural mini scenes instead of images |
| `seed` | `4` |  |
| `rings` | `[1,6,12,16,20]` | disc: items per ring, first = centre dot |
| `tilt` | `0.82` | disc: vertical squash of the plate (0.82 = slight tilt) |
| `tileSize` | `72` | grid: tile size in px at 1080p |
| `background` | `"#ECE4D7"` |  |
| `plateColor` | `"#F4D76E"` | disc plate colour |
| `accent` | `"#E546AA"` | disc pink ring / sparkle colour |
| `dotColor` | `"#3780E7"` | final centre dot colour |
| `duotone` | `["#1F4FA0","#E8EEF8"]` | disc: [shadow, highlight] of the duotone recolour before the pop-out |

## ui

### `browser-mockup` — Browser mockup with living hero

![browser-mockup](../gallery/browser-mockup.jpg)

Rounded, shadowed browser window on a blue-grey backdrop showing a landing page whose hero illustration is a living cinemagraph; cursor clicks the CTA, page scrolls.

**Use for:** Product / website showcases, "here is the site" beats, SaaS launch videos, portfolio pieces.  
**Rebuilt from:** video9 browser-frame-mockup, video5 cinemagraph-hero-loop, video5 gradient-headline  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, ui  
**Capabilities:** paints its own background · text: `brand`, `url`, `nav`, `headline`, `subtitle`, `ctas`, `logos`, `features` · image: `heroSrc` · weight: light  
**Pairs well with:** `star-glint`, `confetti-burst`, `mask-rise-title`  
**Note:** heroSrc = your real screenshot or hero art.  

| prop | default | notes |
|---|---|---|
| `brand` | `"Lumen"` | brand name in the nav |
| `url` | `"lumen.studio"` | address-bar text (chrome: true) |
| `nav` | `["Product","Resources","Pricing","Blog"]` |  |
| `headline` | `["A Thousand Lights","One Living Website"]` | two-line headline (gradient filled) |
| `subtitle` | `"Turn still artwork into pages that breathe, so every vis…` |  |
| `ctas` | `["Get started","Book a demo"]` | button labels; the first is the filled primary the cursor clicks |
| `logos` | `["Vertex","Northwind","Orbit","Halcyon","Kitebase","Stack…` | logo strip names |
| `features` | `["Living heroes","Pixel-perfect UI","Ships anywhere"]` | feature card titles shown after the scroll |
| `heroSrc` | `""` | public/ image for the hero (empty = procedural etched lighthouse scene) |
| `heroTint` | `true` | gradient-map the hero image to ink/paper so it matches the page |
| `glint` | `[0.27,0.12]` | [x, y] fraction of the hero where the star glint sits (image hero only) |
| `ink` | `"#14235B"` |  |
| `paper` | `"#EDEFF7"` |  |
| `gradFrom` | `"#14235B"` |  |
| `gradTo` | `"#63678F"` |  |
| `backdrop` | `["#e2e7ee","#aeb6c2","#9da6b4","#76808f"]` | [highlight, top, mid, bottom] studio backdrop colours |
| `chrome` | `true` | show the browser top bar (traffic lights + URL) |
| `cursor` | `true` |  |
| `scroll` | `0.5` | how far the page scrolls (fraction of the viewport, 0 = no scroll) |

### `card-fan` — Card fan: deal & play / connect

![card-fan](../gallery/card-fan.jpg)

Cards deal from a pile into a fanned hand, one is hovered, played to centre and hits an enemy (white flash, slash, damage pop, HP drain); 'connect' mode links three glass cards' icons and merges them.

**Use for:** Game / deck-builder reels, feature cards, "these pieces connect" data stories, choosing an option.  
**Rebuilt from:** video21 7:20-15:10 card-hand-deal-and-play, hit-flash-damage-pop, video19 9:00-10:30 card-fan-connect  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, ui, playful  
**Capabilities:** paints its own background · text: `cards`, `labels` · weight: light  
**Pairs well with:** `sparkle-burst`, `number-counter`, `comic-burst`  

| prop | default | notes |
|---|---|---|
| `mode` | `"hand"` | 'hand' (deal, hover, play, hit) or 'connect' (three glass cards linked then merged) |
| `cards` | `[{"title":"Ember Strike","cost":1,"icon":"flame","text":"…` | hand cards {title, cost, icon, text, color}; icon = alarm\|train\|toast\|flask\|button\|moon\|sun\|coffee\|bolt\|heart\|star\|gear\|chat\|leaf\|check\|flame\|shield\|sword |
| `playIndex` | `2` | which card is played |
| `damage` | `25` | damage number shown on the hit |
| `status` | `"Vulnerable +3"` | status text that rises after the damage |
| `energy` | `3` | energy orb value before playing (drops by the card cost) |
| `enemyHp` | `[38,62]` | [current, max] enemy HP |
| `fanAngle` | `6` | outer card rotation in degrees |
| `dealStagger` | `0.08` | seconds between dealt cards |
| `background` | `"#0b0815"` |  |
| `labels` | `["CONNECT","REASON"]` | connect mode: [first label, final label] |
| `accent` | `"#4777D2"` | connect mode rail / capsule colour |

### `chat-bubbles` — Chat bubbles, chips & thought bubble

![chat-bubbles](../gallery/chat-bubbles.jpg)

Chat bubbles and comment / prompt chips pop in one by one around a box-bot, a speech balloon snaps on, then a thought bubble rises (dots -> cloud -> icons -> caption) and a green verdict chip drops in.

**Use for:** Conversations, user feedback / comments, "what people are asking", a character thinking back over its day, verdict reveals.  
**Rebuilt from:** video12 25:90-36:03 chat-bubble-pop, speech-balloon-pop, video12 55:03-57:60 comment-chip-stagger, video12 83:80-86:60 thought-bubble-sequence  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, playful, ui  
**Capabilities:** paints its own background · text: `messages`, `thoughtCaption`, `verdict` · weight: light  
**Pairs well with:** `emote-pop`, `starfield-night`, `box-bot`  

| prop | default | notes |
|---|---|---|
| `messages` | `[{"text":"hi Claude!","kind":"user"},{"text":"Hi! How can…` | [{text, kind, at?}] kind = user (dark bubble) \| reply (orange, flies from the bot) \| chip (orange prompt chip) \| comment (white ink chip) \| speech (comic balloon); at = start frame |
| `stagger` | `10` | frames between messages when `at` is not given |
| `thoughtIcons` | `["alarm","train","toast","flask","button","moon"]` | icons that pop into the thought cloud (alarm\|train\|toast\|flask\|button\|moon\|sun\|coffee\|bolt\|heart\|star\|gear\|chat\|leaf\|check\|flame\|shield\|sword) |
| `thoughtCaption` | `"…and again tomorrow"` | caption typed under the thought cloud |
| `verdict` | `"POSTMORTEM: 3 changes, all reverted"` | text of the green chip that drops in at the end ("" = none) |
| `verdictColor` | `"#7DFDB0"` | verdict chip colour |
| `showBot` | `true` | draw the orange box-bot speaker |
| `background` | `"#12031f"` |  |

### `sms-thread` — SMS thread on a phone

A phone rises in beside a headline; a missed-call alert, typing dots and SMS bubbles pop in one by one and the thread scrolls like a real chat, with day notes and a verdict badge springing in under the headline.

**Use for:** Product explainers that show an automated text conversation, follow-up sequences ("Day 2 / Day 5"), booking confirmations.  
**Rebuilt from:** original (Leadlatch explainer); bubble pop timing after video12 chat-bubble-pop  
**Default length:** 210 frames (7.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, ui  
**Capabilities:** paints its own background · text: `messages`, `contact`, `contactSub`, `kicker`, `title`, `subtitle`, `badge` · image: `src` · weight: light  
**Pairs well with:** `film-look`, `number-counter`, `confetti-burst`  

| prop | default | notes |
|---|---|---|
| `messages` | `[{"text":"Missed call · 2:14 pm","from":"alert"},{"text":…` | [{text, from, at?, tag?}] from = us (right, ink bubble) \| them (left, white bubble) \| note (small centred "DAY 2" divider) \| alert (orange missed-call pill); tag = small mint line under a bubble |
| `start` | `14` | frame of the first message |
| `stagger` | `34` | frames between messages when `at` is not given |
| `typing` | `14` | frames of typing dots before each us/them bubble (0 = none) |
| `contact` | `"New enquiry"` | name in the thread header (its first letter fills the avatar) |
| `contactSub` | `"Mobile · just now"` | small line under the contact name |
| `kicker` | `"MISSED CALL TEXT-BACK"` | small tracked mono line above the headline ("" = none) |
| `title` | `"Texts back\nin seconds"` | headline beside / above the phone; \n splits lines |
| `subtitle` | `""` | body line under the headline ("" = none) |
| `badge` | `"Booked: Thu 9am"` | mint verdict pill that springs in under the headline ("" = none) |
| `badgeAt` | `-1` | frame of the badge (-1 = 24 frames after the last message) |
| `background` | `"#0E2621"` | scene colour |
| `paper` | `"#F5F1E8"` | headline colour and text colour in "us" bubbles |
| `screen` | `"#F5F1E8"` | phone screen colour |
| `ink` | `"#0E2621"` | "us" bubble colour and dark text |
| `accent` | `"#FF5A1F"` | kicker, avatar and alert colour |
| `mint` | `"#22B573"` | badge and tag colour |
| `src` | `""` | optional public/ image shown blurred and dimmed behind |
| `dim` | `0.78` | how strongly the background colour covers `src` (0..1) |
| `phoneHeight` | `0.72` | landscape phone height as a fraction of frame height |
| `grain` | `0.05` | film grain opacity |

### `split-compare` — Split-screen compare

![split-compare](../gallery/split-compare.jpg)

Presentation layout: headline, two perfectly synced panels (line-art vs colour by default) with colour-coded labels, stat lines and a footnote.

**Use for:** Before/after, A vs B, two tools / two styles / two renderers of the same thing.  
**Rebuilt from:** video3 0:00-0:23 split-screen-compare  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, photo, editorial  
**Capabilities:** paints its own background · text: `headline`, `subheadline`, `footnote`, `left`, `right` · image: `image` · weight: light  
**Pairs well with:** `mask-rise-title`, `film-look`, `callout-labels`  

| prop | default | notes |
|---|---|---|
| `background` | `"#0b0907"` |  |
| `headline` | `"Same blueprint, two ways to draw it"` | headline above the panels |
| `subheadline` | `"Same scene, same camera, same timing. Only the renderer …` | one-line subheading |
| `footnote` | `"※ Export time = time to turn the finished 8-second anima…` | small grey footnote at the bottom |
| `left` | `{"label":"Line pass","color":"#e8af78","desc":"Every edge…` | {label, color, desc, stat, src, style} for the left (top in portrait) panel; style lines\|color\|mono\|sepia\|warm |
| `right` | `{"label":"Full render","color":"#76c8fb","desc":"Light, c…` | same for the right (bottom) panel |
| `image` | `"demo/lighthouse.jpg"` | public/ image shown in both panels when a side has no own src (empty = procedural plate) |
| `seed` | `4` | procedural plate seed |
| `layout` | `"panels"` | 'panels' = two side-by-side (stacked in portrait) panels, 'wipe' = one frame with a moving divider |
| `introWipe` | `true` | divider draws on and the panels open outward from it |
| `push` | `0.14` | shared camera push amount over the whole motion (0.14 = +14 %) |
| `fadeOut` | `false` | panels fade to black over the last 0.5 s (chrome stays) |
| `build` | `true` | both panels are revealed in sync by a rising scan line after the intro |
| `headlineColor` | `"#f8e2c0"` |  |
| `textColor` | `"#e8e4df"` |  |
| `dividerColor` | `"#35342d"` |  |

## hud

### `callout-labels` — Callout labels

![callout-labels](../gallery/callout-labels.jpg)

Staggered annotation callouts — dot, leader line and typed mono label — over a procedural subject; variants: room callout with crosshair and T-rules, translucent tags riding scrolling objects, and circular medallions popping on a blueprint plan.

**Use for:** Label the parts of a product, diagram, room or scene; attach facts to moving objects; link vignettes to a central diagram.  
**Rebuilt from:** video17 31.5-34.3 (callout-leader-labels), video9 17.9-18.6 (room-label-callout), video23 (object-callout-tag), video19 11.75-13.35 (medallion-pop), video6 24.0-31.0 (callout-inset-lens)  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject, frame · **Mood:** light, blueprint, hud  
**Capabilities:** paints its own background · text: `items` · image: `src` · weight: light  
**Pairs well with:** `flat-to-3d-sphere`, `science-reticle`, `ken-burns`  

| prop | default | notes |
|---|---|---|
| `variant` | `"leader"` | leader \| room \| tag \| medallion |
| `items` | `[]` | callouts {x, y, label, sublabel?, ex?, ey?, icon?}: x,y anchor as frame fractions (0..1); ex,ey label offset in px@1080 (leader) or plan-anchor offset (medallion); room titles split lines with "/"; [] = built-in demo |
| `src` | `""` | optional public/ image used as the subject instead of the procedural one |
| `stagger` | `10.5` | frames between callouts (0.35 s = 10.5) |
| `medallionReveal` | `"pop"` | pop (scale from a preview dot) or pie (clockwise wipe + tangent leaders) |
| `accent` | `"#E24D0F"` | accent colour (room label, medallion highlights) |
| `ink` | `"#0B0D0C"` | line / text colour for leader and room callouts |

### `era-dial` — Era dial counter

![era-dial](../gallery/era-dial.jpg)

Gear-ringed blueprint dial that turns a notch per era while the date plate rolls and the centre line-art illustration swaps (plan, press, book, computer, monitor, network).

**Use for:** History / timeline beats: step through years or versions with a mechanical, technical feel.  
**Rebuilt from:** video19 13.35-14.40 (era-dial-counter)  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, blueprint  
**Capabilities:** paints its own background · text: `eras` · weight: light  
**Pairs well with:** `film-look`, `chapter-header`, `walker-world-scroll`  

| prop | default | notes |
|---|---|---|
| `background` | `"#090A0F"` |  |
| `eras` | `[{"label":"Library","year":"300 BC"},{"label":"Printing p…` | list of {label, year, icon?}; icon one of plan\|press\|book\|computer\|monitor\|network\|scroll\|build\|inspect\|ask\|teach (defaults cycle) |
| `stepFrames` | `34` | frames between era steps |
| `stepAngle` | `-30` | degrees the dial turns per step |
| `accent` | `"#4777D2"` |  |
| `line` | `"#DADDE5"` |  |
| `gears` | `true` | hatched background gears |
| `showLabels` | `true` | show the era label above the window |

### `hud-chrome` — HUD chrome overlay

![hud-chrome](../gallery/hud-chrome.jpg)

Overlay HUD: corner crop marks, header with red counter, live timecode, typed code line with red block cursor, BPM beat squares, chapter progress bar and a right-side ruler with "0N / 07" counter.

**Use for:** Technical / "made with code" framing over any scene; chaptered explainers. Set backdrop to "transparent" to overlay.  
**Rebuilt from:** video17 0:00-43:56 (hud-chrome-overlay, typewriter-code), video9 (scroll-progress-hud)  
**Default length:** 360 frames (12.0 s @ 30 fps)

**Roles:** accent, subject, frame · **Mood:** dark, hud, editorial  
**Capabilities:** overlay (`{"backdrop":"transparent","previewSubject":false}`) · text: `title`, `subtitle`, `headerRight`, `counterLabel`, `chapters` · weight: light  
**Pairs well with:** `bouncing-ball`, `live-chart`, `typewriter-code`  

| prop | default | notes |
|---|---|---|
| `backdrop` | `"#0B0D0C"` | background colour; "transparent" to use as an overlay |
| `previewSubject` | `true` | draw a bouncing red ball on the backdrop (preview only) |
| `theme` | `"dark"` | dark = light text (for dark scenes), light = ink text |
| `title` | `"THE 12 PRINCIPLES OF ANIMATION"` | header left text |
| `subtitle` | `"ONE BALL"` | header left accent text after " / " |
| `headerRight` | `"ONE TAKE · LIVE"` | header right text |
| `counterLabel` | `"CUTS"` | grey label before the red counter |
| `counter` | `"00"` | red counter value (e.g. "00") |
| `chapters` | `[{"label":"Squash & stretch","code":"sx = 1 / sy;  // are…` | list of {label, code}; chapters split the duration evenly; code is typed in the footer |
| `bpm` | `160` | beat indicator tempo |
| `accent` | `"#ED3821"` | red accent (cursor, progress, beat) |
| `rulerAccent` | `"#E24D0F"` | orange indicator on the right ruler |
| `showRuler` | `true` | right-side progress ruler with "0N / 0L" counter |
| `showProgress` | `true` | bottom hairline progress bar with chapter ticks |
| `rulerUnit` | `""` | word after the ruler counter, e.g. "ROOMS" |

### `powers-of-ten` — Powers-of-ten zoom

![powers-of-ten](../gallery/powers-of-ten.jpg)

Continuous exponential pull-back (or push-in) through nested blueprint drawings — word, badge, radar, library plan, dial, network — with level-of-detail fading and a scale readout; snap mode jumps level to level.

**Use for:** Show how a small thing sits inside ever bigger systems (or dive the other way), in one continuous move.  
**Rebuilt from:** video19 11.05-11.75 (powers-of-ten-pullback), video19 0.5-0.9, 2.3-2.7, 17.6-18.0 (snap-zoom-reveal)  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, blueprint, hud  
**Capabilities:** paints its own background · text: `levels` · weight: light  
**Pairs well with:** `zoom-tunnel`, `radial-blueprint`, `number-counter`  

| prop | default | notes |
|---|---|---|
| `background` | `"#090A0F"` |  |
| `levels` | `[{"label":"CLEAR."},{"label":"Idea"},{"label":"Signal"},{…` | innermost first: {label, kind?}; kind word\|badge\|radar\|plan\|dial\|network (defaults cycle in that order; level 1 shows its label as a big word) |
| `direction` | `"out"` | out = pull back from the first level, in = dive from the last |
| `mode` | `"continuous"` | continuous log-scale move, or snap (hold, then easeOutExpo snap per level) |
| `ratio` | `3.2` | scale ratio between neighbouring levels |
| `accent` | `"#4777D2"` |  |
| `line` | `"#DADDE5"` |  |
| `hud` | `true` | scale readout and level list |

### `radial-blueprint` — Radial blueprint plan

![radial-blueprint](../gallery/radial-blueprint.jpg)

Dark blueprint: a blue dot pings, the camera snaps back to a seeded circular library plan with a glowing hub, blue paths and flowing nodes, then spokes shoot out to category labels.

**Use for:** Hero background for systems / knowledge / network stories; reveal 3-8 categories around a hub.  
**Rebuilt from:** video19 11.05-15.40 (radial-plan-blueprint, radar-spoke-draw, radial-network-reveal, blue-dot-motif)  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, blueprint, hud, night  
**Capabilities:** paints its own background · text: `categories`, `centerLabel` · weight: light  
**Pairs well with:** `glyph-orbit-logo`, `zoom-tunnel`, `typewriter-code`  
**Note:** At 30-40 % opacity with categories [] it is a premium tech texture behind a logo.  

| prop | default | notes |
|---|---|---|
| `background` | `"#090A0F"` |  |
| `categories` | `["MODELS","AGENTS","CONTEXT","TOOLS","EVALS"]` | labels the blue spokes shoot out to (first fires alone, then in pairs) |
| `centerLabel` | `"TODAY"` | small tracked label under the hub ("" to hide) |
| `seed` | `7` | procedural plan layout seed |
| `rings` | `4` | number of shelf rings |
| `sectors` | `12` | number of radial sectors |
| `accentPaths` | `3` | thick blue paths entering from outside |
| `networkSpokes` | `8` | thin blue spokes with flowing nodes |
| `pullFrom` | `5` | starting zoom of the pull-back reveal |
| `rotateSpeed` | `3` | plan rotation in degrees per second |
| `accent` | `"#4777D2"` | blue accent colour |
| `line` | `"#DADDE5"` | line-art colour |
| `labelColor` | `"#7FA2E6"` | category label colour |
| `scanlines` | `true` | engraved scanline texture behind |

### `zoom-tunnel` — Zoom-through tunnel

![zoom-tunnel](../gallery/zoom-tunnel.jpg)

Blueprint radar target opens into a tunnel of outlined capsule rings; the camera accelerates through it and a hero word punches in as the tunnel slows, with an optional arc subtitle.

**Use for:** "Entering the system" / hyperspace beats that land on a single key word.  
**Rebuilt from:** video19 7.30-8.90 (zoom-through-tunnel, arc-text-type, hero-word-punch)  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, blueprint, hud  
**Capabilities:** paints its own background · text: `word`, `subtitle` · weight: light  
**Pairs well with:** `radial-blueprint`, `glyph-orbit-logo`, `electric-arcs`  

| prop | default | notes |
|---|---|---|
| `background` | `"#090A0F"` |  |
| `word` | `"MEMORY"` | hero word that punches in at the end |
| `subtitle` | `"RETRIEVE"` | text typed along an arc above the word ("" to hide) |
| `rings` | `16` | number of capsule rings in depth |
| `perRing` | `34` | capsules per ring |
| `spin` | `0.35` | tunnel spin in radians per second |
| `speed` | `1` | peak travel speed multiplier |
| `popFrame` | `92` | frame where the word pops (the zoom accelerates for ~2.4 s before it) |
| `shape` | `"capsule"` | capsule \| line \| square |
| `accent` | `"#4777D2"` |  |
| `line` | `"#DADDE5"` |  |

## 3d

### `iso-blocks-3d` — Iso blocks (3D clay)

![iso-blocks-3d](../gallery/iso-blocks-3d.jpg)

Soft clay isometric 3D bar chart: a white ball with eyes hops down the bars painting each top orange, slams onto the tiled floor with a ripple, rolls back and rides a rising pillar while the caps un-paint — a seamless loop with a follow camera.

**Use for:** Declining (or any) metric stories, step-by-step progress, playful looping data explainers in real 3D.  
**Rebuilt from:** video7 0:00-0:16  
**Default length:** 390 frames (13.0 s @ 30 fps)

**Roles:** subject · **Mood:** mid, 3d, playful  
**Capabilities:** paints its own background · weight: heavy  
**Pairs well with:** `number-counter`, `confetti-burst`, `chapter-header`  

| prop | default | notes |
|---|---|---|
| `values` | `[16,15,14,13,12,11,10,9,8,7,6,5]` | bar heights in slabs (any series; the ball hops left to right) |
| `beatFrames` | `15` | frames per hop |
| `background` | `"#E6DED3"` | backdrop colour behind the floor |
| `barColor` | `"#EDE6DC"` | bar clay colour |
| `floorColor` | `"#EDE5D9"` | floor tile colour |
| `grooveColor` | `"#CEC5B7"` | colour of the gaps between tiles |
| `accent` | `"#E48E6D"` | painted cap colour |
| `ghost` | `"#F7DAC9"` | cap colour at the moment of touchdown |
| `pillar` | `"#E5BDA6"` | lift pillar colour |
| `ballColor` | `"#F9F4EE"` | ball body colour |
| `hopHeight` | `0.75` | hop arc height (world units, 1 = one cell) |
| `zoomOut` | `0.62` | camera zoom at the reveal (1 = close follow) |

### `plan-tilt` — Plan tilt to 3D

![plan-tilt](../gallery/plan-tilt.jpg)

An ink floor plan draws on top-down, then the camera tilts to eye level as the walls extrude into a 3D line drawing, dollies through the front door, and cranes back up until it reads as the plan again.

**Use for:** Architecture, product or system explainers: show that the diagram and the 3D thing are the same; walk into a space.  
**Rebuilt from:** video9 0:01-0:17, video4 paper-plane-tilt-camera  
**Default length:** 300 frames (10.0 s @ 30 fps)

**Roles:** subject · **Mood:** light, blueprint, 3d  
**Capabilities:** paints its own background · text: `title`, `kicker` · weight: heavy  
**Pairs well with:** `callout-labels`, `film-look`, `mask-rise-title`  

| prop | default | notes |
|---|---|---|
| `walls` | `[[0,0,16,0],[16,0,16,11],[16,11,8.7,11],[7.3,11,0,11],[0,…` | wall segments [x1, z1, x2, z2] in metres (gaps = openings) |
| `rooms` | `[{"name":"BEDROOM","x":3,"z":4.7,"w":6,"d":6},{"name":"BA…` | floor labels {name, x, z, w, d} (w×d prints the area string) |
| `furniture` | `[{"x":2.2,"z":2.6,"w":2,"d":2.2,"h":0.5},{"x":8.9,"z":1.3…` | extruded blocks {x, z, w, d, h} |
| `doors` | `[{"x":7.3,"z":11,"r":1.4,"a0":0},{"x":6,"z":4,"r":1,"a0":…` | door swings {x, z, r, a0} (hinge point, radius, start angle) |
| `entrance` | `[8,11]` | [x, z] of the front door the camera tilts to and walks through |
| `wallHeight` | `3` | wall height in metres after extrusion |
| `wallThickness` | `0.28` | wall thickness in metres |
| `paper` | `"#efece3"` | paper colour |
| `ink` | `"#201b1c"` | ink colour |
| `poche` | `"#2a2829"` | wall-top (poché) fill |
| `accent` | `"#e24d0f"` | accent colour (last title line, construction line) |
| `title` | `"Every house\|starts as\|a plan."` | hero headline, lines separated by \| |
| `kicker` | `"LINTEL · CASA SERRA · 2026"` | small mono line above the headline |
| `showTitle` | `true` | show the headline over the plan |
| `walkIn` | `true` | dolly through the doorway before craning back up |

### `pointcloud-orbit` — Point cloud orbit

![pointcloud-orbit](../gallery/pointcloud-orbit.jpg)

An image (default: a procedural swordswoman) becomes a 3D cloud of coloured beads pushed forward by brightness; the camera orbits, beads extrude into voxel columns, then the figure disintegrates into white particles blown sideways.

**Use for:** Turn any still into a living 3D data sculpture; "Thanos snap" exits; tech/AI vision moments.  
**Rebuilt from:** video18 0:09-0:12  
**Default length:** 240 frames (8.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, photo, 3d  
**Capabilities:** paints its own background · image: `src` · weight: heavy  
**Pairs well with:** `blur-in-title`, `film-look`, `embers`  
**Note:** Pass src for your own subject (a cut-out PNG works best).  

| prop | default | notes |
|---|---|---|
| `src` | `""` | optional image in public/ (e.g. demo/owl.jpg); empty = procedural figure |
| `background` | `"#050407"` | backdrop colour |
| `density` | `1` | grid density multiplier (1 ≈ 150 rows) |
| `depthScale` | `2.4` | how far brightness pushes beads toward the camera |
| `beadSize` | `0.085` | bead diameter in world units (picture is 10 units tall) |
| `orbitAngle` | `24` | camera yaw swing in degrees (±) |
| `extrusion` | `1` | 0..1 voxel column extrusion (0 = flat relief only) |
| `disintegrate` | `true` | blow the cloud away at the end |
| `direction` | `1` | +1 blow to the right, -1 to the left |
| `speed` | `5` | particle drift speed (world units per second) |
| `turbulence` | `0.8` | noise turbulence amplitude |
| `fringe` | `0.07` | RGB rim split on each bead (0 = off) |
| `keyDark` | `0.06` | for images: luminance below this is keyed out (0 = keep all) |

### `terrain-build-3d` — Terrain build (3D)

![terrain-build-3d](../gallery/terrain-build-3d.jpg)

A procedural mountain heightmap rebuilds itself in labelled stages — flat, noise, fractal, erosion, materials, sun, atmosphere, clouds, lens — with a typing code panel, then a cinematic eased fly-by past the peak.

**Use for:** "How it is made" / generative-art explainers: show a world being built step by step, then reward with a hero fly-through.  
**Rebuilt from:** video8 0:04-0:38  
**Default length:** 650 frames (21.7 s @ 30 fps)

**Roles:** subject · **Mood:** mid, 3d, cinematic, nature  
**Capabilities:** paints its own background · text: `stages` · weight: heavy  
**Pairs well with:** `end-card-credits`, `typewriter-code`, `film-look`  

| prop | default | notes |
|---|---|---|
| `stages` | `[{"title":"NOTHING","subtitle":"a flat plane.","file":"wo…` | list of {title, subtitle, file, code}; index order maps to the fixed build techniques (0 flat … 8 lens) |
| `seed` | `3` | terrain seed |
| `stageFrames` | `48` | frames per stage |
| `leadIn` | `6` | frames before stage 0 |
| `flyby` | `true` | fly past the peak after the build (overlay fades out) |
| `flybyFrames` | `210` | length of the fly-by |
| `showCode` | `true` | show the typing code panel |
| `showTitle` | `true` | show the stage title block + progress dashes |
| `sunElevation` | `7` | final sun elevation in degrees (low = golden hour) |
| `sunAzimuth` | `104` | final sun azimuth in degrees (90 = from screen right) |
| `snowLine` | `13` | height above which snow settles (world units, hero peak ≈ 32) |
| `colors` | `{"rock":"#6e6a66","scree":"#9a948c","grass":"#4f6a3a","sn…` | rock / scree / grass / snow / clay / sun / zenith / horizon / cloudShadow / cloudLight |

### `wireframe-build` — Wireframe build

![wireframe-build](../gallery/wireframe-build.jpg)

A glowing amber wireframe galleon lifts out of a parchment blueprint part by part with sparks, then hull strips flash white-hot and cool into dark wood and sails fill with canvas, under a slow orbiting camera.

**Use for:** "From plan to product" reveals, build/compile metaphors, engineering and making-of sequences.  
**Rebuilt from:** video3 0:00-0:12, video9 sketch-to-render-reveal  
**Default length:** 300 frames (10.0 s @ 30 fps)

**Roles:** subject · **Mood:** dark, blueprint, 3d  
**Capabilities:** paints its own background · weight: heavy  
**Pairs well with:** `callout-labels`, `mask-rise-title`, `glyph-orbit-logo`  

| prop | default | notes |
|---|---|---|
| `background` | `"#0b0907"` | void colour around the blueprint |
| `paper` | `"#e6d8c0"` | parchment tint |
| `ink` | `"#3a3026"` | blueprint ink colour |
| `wire` | `"#e2a35a"` | wireframe glow colour (amber) |
| `hot` | `"#fff2dc"` | white-hot colour of fresh lines / materialising strips |
| `wood` | `"#3a2718"` | hull wood colour |
| `stripe` | `"#8a2a22"` | gunwale stripe colour |
| `sail` | `"#d8d2c0"` | sail canvas colour |
| `spark` | `"#ffd79a"` | spark particle colour |
| `lineWidth` | `1.4` | core wire width in px at 1080 |
| `sparks` | `260` | number of spark particles |
| `orbit` | `70` | camera orbit sweep in degrees |

## image

### `comic-halftone` — Comic halftone post FX

![comic-halftone](../gallery/comic-halftone.jpg)

Print-comic finish over an image: posterised toon colour, 45° halftone ink dots in the midtones and shadows, ink outlines, colour misregistration and vignette, animated on twos.

**Use for:** Comic / pop-art stylisation of any still or render, playful explainers, a stylised hold before comic SFX overlays.  
**Rebuilt from:** video12 0:00-1:10 comic-halftone-postfx, video12 render-on-twos  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, photo, comic  
**Capabilities:** paints its own background · image: `src` · weight: medium  
**Pairs well with:** `comic-burst`, `speed-lines`, `story-caption-box`  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path; empty = procedural plate |
| `seed` | `1` | procedural plate seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `dotPitch` | `6` | halftone cell size in px at 1080p (5 in the source) |
| `dotAngle` | `45` | screen angle in degrees (45) |
| `dotBand` | `[0.2,0.75]` | [lo, hi] luminance band that gets ink dots (0.2–0.75); outside it colours stay flat |
| `inkStrength` | `0.55` | how dark the dots print (0..1) |
| `levels` | `5` | posterise steps per channel |
| `outline` | `3.5` | ink outline width in px at 1080p (3–4) |
| `edgeThreshold` | `0.14` | edge sensitivity (lower = more lines) |
| `misregister` | `3` | colour misregistration offset in px |
| `step` | `2` | hold every drawing for N frames (2 = on twos, 1 = smooth) |
| `push` | `2.5` | slow push-in in %/s |
| `pan` | `-12` | lateral drift in px/s |
| `vignette` | `0.35` | corner darkening |
| `grain` | `0.06` | grain amount |

### `dot-matrix` — Dot matrix / halftone / particle image

![dot-matrix](../gallery/dot-matrix.jpg)

Image resampled to a grid of dots — LED billboard, print halftone duotone, glowing luma particles or pointillist dabs — with a stepped resolution ramp from abstract to legible and back.

**Use for:** Music-video stylisation, beat-synced reveals of a picture, retro LED signage, print/poster looks.  
**Rebuilt from:** video18 0:00-0:20 led-dot-matrix, resolution-ramp, halftone-duotone, luma-particle-glow, video14 pointillism-fill / halftone-bg  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, photo, comic  
**Capabilities:** paints its own background · image: `src` · weight: medium  
**Pairs well with:** `neon-sign`, `beat-montage`, `kinetic-captions`  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path; empty = procedural plate (sampled analytically) |
| `seed` | `1` | procedural plate / jitter seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `style` | `"led"` | led \| halftone \| glow \| pointillism |
| `pitch` | `26` | legible dot pitch in px at 1080p (led 26, halftone 13–29, glow 12–18); auto-raised to keep ≤ 5000 dots |
| `ramp` | `[150,90,60,40]` | coarser pitches stepped through before the legible one ([] = no ramp) |
| `stepFrames` | `6` | frames per ramp step (half-beats: 5–6) |
| `rampStart` | `8` | frame of the first ramp step |
| `rampOut` | `true` | reverse ramp (coarser and coarser) over the last steps |
| `push` | `2` | slow push-in of the sampled image in %/s (keeps the dots alive) |
| `holdFrames` | `2` | refresh the mosaic every N frames (LED low-fps feel) |
| `panel` | `"#060404"` | led: panel colour |
| `bgDot` | `"#972C21"` | led: dim background-dot colour |
| `matte` | `0.14` | led: cells darker than this luma become background dots (0 = off) |
| `paper` | `"#FAF1DE"` | halftone / pointillism: paper colour (pairs: #FAF1DE/#29254A, #F7F00B/#030303, #15FFFD/#030303, #EF5E30/#030303, #2321F5/#FFFFFF, #EB1458/#FFFFFF) |
| `ink` | `"#29254A"` | halftone: ink colour |
| `invert` | `false` | halftone: light ink on dark paper (dot size grows with brightness) |
| `body` | `"#FFC861"` | glow: particle body colour (gold #FFC861, violet #D88BFF, white) |
| `maxRadius` | `18` | glow: max particle radius in px at 1080p |
| `glow` | `1` | glow: blurred bloom copy strength 0..1 |

### `duotone` — Duotone recolour

![duotone](../gallery/duotone.jpg)

A full-colour image cross-fades into a 2–3 colour brand ramp (blue, pink-violet, ink etching with cross-hatch, madness green flash or a day-to-night grade).

**Use for:** Brand-colour unification of mixed stills, mood switches (calm -> panic, day -> night), print-style looks.  
**Rebuilt from:** video4 0:17 duotone-recolor, video5 ink-etching-tint, video21 0:15.9 madness-flash-tint, video16 0:44.6-0:46 grade-to-night  
**Default length:** 120 frames (4.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, photo, night  
**Capabilities:** paints its own background · text: `word` · image: `src` · weight: medium  
**Pairs well with:** `mask-rise-title`, `stamp-slam`, `film-look`  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path; empty = procedural plate |
| `seed` | `1` | procedural plate seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `preset` | `"blue"` | blue \| pink-violet \| ink-etching \| madness \| night |
| `colors` | `[]` | custom ramp dark -> light (2–3 hex colours) overriding the preset |
| `at` | `36` | frame the recolour starts |
| `fade` | `0` | cross-fade length in frames (0 = preset: 4 / 4 / 10 / 1 / 42) |
| `push` | `1.5` | slow push-in in %/s |
| `hatch` | `0.25` | ink-etching: cross-hatch opacity in the darks (0.25 in the source) |
| `word` | `""` | madness: word that flickers on (+0.30 s for 2 f, off 3 f, then steady), e.g. 狂気 |
| `wordColor` | `"#DA4F4D"` | madness: word colour |
| `grain` | `0.03` | film grain amount |

### `film-look` — Film finishing stack

![film-look](../gallery/film-look.jpg)

Cinematic finish over an image: bloom on highlights, radial chromatic fringe, grain, vignette, gate weave, a flickering blue anamorphic flare streak and optional 2.39:1 bars (or overlay-only mode).

**Use for:** Making any still or scene feel shot on film; a final pass over composites; a flare accent on a light source.  
**Rebuilt from:** video8 film-post-stack, video16 0:30.8-0:31.9 anamorphic-flare, video21 cinemascope-letterbox  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop, accent, frame · **Mood:** dark, photo, cinematic  
**Capabilities:** overlay (`{"overlay":true}`) · image: `src` · weight: medium  
**Pairs well with:** `ken-burns`, `light-sweep`, `story-caption-box`, `neon-sign`  
**Note:** overlay:true (+ flare:false, letterbox:'off') is the finishing frame layer on top of any mix.  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path; empty = procedural plate |
| `seed` | `1` | procedural plate seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `overlay` | `false` | true = transparent background, only grain / vignette / flare / bars (layer over another scene) |
| `grain` | `0.1` | grain opacity (overlay blend) |
| `vignette` | `0.35` | corner darkening 0..1 (≈0.25–0.35) |
| `bloom` | `0.35` | bloom mix over highlights (0.35) |
| `threshold` | `0.8` | bloom luminance threshold (0.8) |
| `fringe` | `1` | chromatic fringe at the frame edge in px at 1080p |
| `flare` | `true` | draw the anamorphic streak |
| `flareX` | `-1` | light x 0..1 (-1 = the procedural sun / 0.62) |
| `flareY` | `-1` | light y 0..1 (-1 = the procedural sun / 0.45) |
| `flareColor` | `"#7FA8FF"` | streak colour (#7FA8FF measured) |
| `flareLength` | `0.8` | streak length as a fraction of the width (0.8) |
| `letterbox` | `"auto"` | auto (landscape only) \| on \| off |
| `aspect` | `2.39` | letterbox picture aspect (2.39) |
| `weave` | `0.6` | gate weave jitter in px |
| `push` | `1` | slow push-in in %/s |

### `glass-pane-grid` — Mondrian glass pane grid

![glass-pane-grid](../gallery/glass-pane-grid.jpg)

A black-leaded Mondrian grid draws on over an image; each glass pane offsets, scales and tints its piece of the picture and keeps drifting, like looking through stained glass.

**Use for:** Fractured / multiple-perspective beats, art-history or design references, stylish holds on a hero image.  
**Rebuilt from:** video2 0:16-0:18 refraction-pane-grid  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, photo  
**Capabilities:** paints its own background · image: `src` · weight: medium  
**Pairs well with:** `mask-rise-title`, `blur-in-title`, `film-look`  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path; empty = procedural plate |
| `seed` | `1` | procedural plate seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `gridSeed` | `4` | seed of the Mondrian subdivision |
| `depth` | `5` | subdivision depth (3 = few big panes, 5 = many) |
| `barWidth` | `14` | leading bar width in px at 1080p (10–12 measured at 720p, ≈14 at 1080p) |
| `barColor` | `"#0b0b0d"` | leading colour |
| `maxOffset` | `0.055` | max pane offset as a fraction of the frame width (0.03–0.06) |
| `tints` | `["#c06b45","#677489","#c0ad70","clear","clear","#c06b45",…` | pane tint colours (multiply); "clear" = untinted |
| `tintOpacity` | `0.6` | tint strength 0..1 |
| `driftDuration` | `60` | frames for the refraction offsets to ease in (easeInQuad), then a slow drift continues |
| `start` | `10` | frame the leading starts drawing on |
| `sheen` | `1` | glass sheen / bevel highlight strength |

### `glitch-image` — Glitch image bursts

![glitch-image](../gallery/glitch-image.jpg)

An image hit by timed digital-glitch bursts: RGB-split band displacement, datamosh column smear, stage-rewind bands with black slivers, 1–2 frame CMY silhouette flashes and a rainbow chroma echo trail.

**Use for:** Beat hits, "system error" / hacked moments, energetic transitions between stills, music-video accents.  
**Rebuilt from:** video2 glitch-band-displace + datamosh-column-smear, video8 0:00 glitch-layer-rewind, video12 0:43 glitch-slice, video18 rgb-split-flash + chroma-echo-trail  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, photo, hud  
**Capabilities:** paints its own background · text: `bursts` · image: `src` · weight: medium  
**Pairs well with:** `stamp-slam`, `typewriter-code`, `electric-arcs`  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path; empty = procedural plate |
| `seed` | `1` | procedural plate / glitch seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `bursts` | `[{"at":14,"frames":12,"kind":"bands","strength":1},{"at":…` | list of {at, frames, kind: bands\|smear\|rewind\|flash\|echo, strength} — the intensity envelope |
| `intensity` | `1` | global multiplier on every burst |
| `maxShift` | `0.08` | max band shift as a fraction of the width (0.02–0.08) |
| `rgbSplit` | `6` | R/B channel offset in px at 1080p inside glitched bands |
| `tint` | `"#2FB5A8"` | teal tint for some bands / smear edge |
| `smearColumn` | `[0.25,0.5]` | [x0, x1] 0..1 column of the datamosh smear (≈25 % W) |
| `smearY` | `0.62` | source row (0..1) of the smear, i.e. the top of the subject |
| `echoCount` | `8` | number of chroma echo copies (6–10) |
| `push` | `1` | slow push-in in %/s |
| `grain` | `0.035` | film grain amount |

### `ken-burns` — Ken Burns push / pull / tilt

![ken-burns](../gallery/ken-burns.jpg)

Slow push, pull, pan or tall tilt-up across a still plate with handheld noise, an optional punch-in cut, rain and print grain.

**Use for:** Turning any still (AI art, photo, illustration) into a living shot; emphasis punch-ins on a caption beat; cold-open tilt reveals of tall images.  
**Rebuilt from:** video10 0:00-0:42 woodblock-ken-burns + punch-in-cut, video16 slow-push-ken-burns, video22 shot-push-in, video21 0:01-0:07 tall-tilt-reveal, video11 ken-burns-push  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** mid, photo, nature  
**Capabilities:** paints its own background · image: `src`, `images` · weight: medium  
**Pairs well with:** `film-look`, `story-caption-box`, `kinetic-captions`, `blur-in-title`  
**Avoid:** Do not use ken-burns as the only motion of a piece: add type + an accent, or pick a richer image look (film-look, light-sweep, duotone).  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path (e.g. "demo/owl.jpg"); empty = procedural dusk plate |
| `images` | `[]` | several public/ images: the duration is split into hard-cut shots alternating push / pull |
| `seed` | `1` | procedural plate seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `mode` | `"push"` | push \| pull \| pan \| tall-tilt (tilts bottom -> top over a tall image) |
| `rate` | `2.5` | scale change in %/s (ambient 0.6–2, emotional 3–5, warm push 8–9) |
| `focus` | `[0.62,0.55]` | [x, y] 0..1 point the push moves toward (subject / eyes) |
| `pan` | `[-14,0]` | [dx, dy] lateral drift in px/s at 1080p |
| `easing` | `"sine"` | linear \| sine \| inOut (shot-push-in uses inOut) |
| `handheld` | `1.5` | handheld noise amplitude in px (0 = locked off) |
| `punchAt` | `96` | frame of the punch-in hard cut (-1 = off) |
| `punchScale` | `1.25` | extra scale at the punch-in (≈1.25) |
| `punchFocus` | `[0.63,0.56]` | [x, y] subject the punch-in re-centres on |
| `drift` | `70` | tall-tilt horizontal drift in px/s (camera pans right for positive) |
| `rain` | `false` | overlay 3-layer rain streaks |
| `rainDensity` | `0.6` | rain density multiplier |
| `grain` | `0.04` | print grain amount (0.04 ≈ source) |
| `paper` | `0.06` | paper fibre multiply amount (0.06 ≈ source) |
| `vignette` | `0.3` | corner darkening 0..1 |
| `fadeIn` | `0` | fade from black over this many frames (tall-tilt source: 18) |

### `light-sweep` — Night light sweep

![light-sweep](../gallery/light-sweep.jpg)

Cinematic night lighting: headlights sweep across a rain-streaked window, sodium street lamps flicker on with volumetric cones through rain, or a door opens and floods a corridor floor with light and a long shadow.

**Use for:** Mood beats in night scenes: a car passing, arriving somewhere at night, a reveal of someone at the door.  
**Rebuilt from:** video16 0:56.5-0:57.6 headlight-sweep, video16 light-cone-volumetric + rain-overlay, video16 door-light-flood  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, photo, cinematic, nature, night  
**Capabilities:** paints its own background · image: `src` · weight: medium  
**Pairs well with:** `rain`, `film-look`, `story-caption-box`  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image for the outside view (window / street / doorway); empty = procedural night (dawn for door) |
| `seed` | `1` | procedural plate / rain / droplet seed |
| `mode` | `"headlight"` | headlight \| streetlamp \| door |
| `color` | `"#E8F4FF"` | headlight beam colour |
| `beamSpread` | `20` | headlight wedge spread in degrees (20) |
| `rain` | `0.8` | rain density multiplier (0 = dry) |
| `lamps` | `3` | streetlamp: number of lamps |
| `lampColor` | `"#F0904F"` | streetlamp: sodium colour (#F0904F) |
| `lightColor` | `"#FFE6B8"` | door: light colour (#FFE6B8) |
| `figure` | `true` | door: a figure steps into the doorway and casts a long shadow |
| `push` | `1` | slow push-in in %/s |
| `grain` | `0.08` | film grain amount |

### `pixel-dither` — Pixelate + Bayer dither look

![pixel-dither](../gallery/pixel-dither.jpg)

Image rendered as chunky 6 px pixel art with 2x2 Bayer ordered dither, a 5–8 colour hue ramp, 2.34:1 letterbox, grain and vignette, slowly tilting.

**Use for:** Retro game / pixel-art cinematics, moody cold opens, unifying mixed stills into one pixel style.  
**Rebuilt from:** video21 0:00-0:20 pixelate-dither-look, video21 cinemascope-letterbox  
**Default length:** 180 frames (6.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, photo, pixel, cinematic, nature  
**Capabilities:** paints its own background · image: `src` · weight: medium  
**Pairs well with:** `snowfall`, `aurora`, `story-caption-box`  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path; empty = procedural plate |
| `seed` | `1` | procedural plate / ember seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `pixelSize` | `6` | virtual pixel size in px at 1080p (source: 6) |
| `colors` | `["#06050a","#170d1a","#33172a","#5e2430","#93392d","#c864…` | luminance ramp dark -> light (3–8 colours); [] keeps source colours, posterised |
| `dither` | `1` | 2x2 Bayer dither strength in palette steps (0 = none, 1 = classic) |
| `tilt` | `22` | slow vertical tilt in px/s (+ = tilt up) |
| `push` | `1.2` | slow push-in in %/s |
| `letterbox` | `"auto"` | auto (landscape only) \| on \| off — hard black bars |
| `aspect` | `2.34` | active picture aspect (2.34 in the source) |
| `embers` | `18` | number of rising pixel embers (0 = none) |
| `grain` | `0.035` | grain amount (0.03–0.04) |
| `vignette` | `0.55` | corner darkening (0.55 in the source) |
| `fadeIn` | `18` | fade from black over this many frames |

### `xray-scan` — X-ray scan reveal

![xray-scan](../gallery/xray-scan.jpg)

A glowing vertical scan beam (or an inky organic blob / hatched hole) sweeps across an image, revealing a glowing x-ray / blueprint line-art version in its wake.

**Use for:** Showing what is inside / how it works, scanning or analysing beats, tech and science explainers.  
**Rebuilt from:** video2 0:00 xray-scan-sweep, video11 0:01.3 organic-blob-reveal + blueprint-xray-style, video6 0:01.4 xray-hatch-hole  
**Default length:** 150 frames (5.0 s @ 30 fps)

**Roles:** backdrop · **Mood:** dark, blueprint, photo, hud  
**Capabilities:** paints its own background · image: `src` · weight: medium  
**Pairs well with:** `callout-labels`, `science-reticle`, `typewriter-code`  

| prop | default | notes |
|---|---|---|
| `src` | `""` | public/ image path (edge-detected into an x-ray); empty = procedural plate drawn as line art |
| `seed` | `1` | procedural plate seed |
| `palette` | `"dusk"` | procedural plate palette: dusk \| night \| dawn |
| `mode` | `"beam"` | beam \| blob \| hole |
| `look` | `"blueprint"` | blueprint (lavender on navy) \| xray (cyan on deep blue) |
| `speed` | `0.75` | beam speed in frame-widths per second (0.75 measured) |
| `start` | `14` | frame the first reveal starts |
| `passes` | `2` | beam passes: 1 = reveal only, 2 = reveal then sweep back to colour |
| `beamColor` | `"#e6f6ff"` | beam core colour |
| `glowColor` | `"#82b9d7"` | beam glow colour (drawn at 40 %) |
| `glowWidth` | `50` | beam glow half-width in px at 1080p (40–60) |
| `flicker` | `0.03` | x-ray luminance flicker (±3 %) |
| `reticle` | `true` | draw construction circles / reticle over the x-ray |
| `bristleColor` | `"#10131C"` | blob / hole ink edge colour |
| `push` | `1.2` | slow push-in in %/s |

