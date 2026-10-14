# Library plan — from ~340 reverse-engineered techniques to one motion library

The 23 analysis docs (`analysis/videoN.md`) describe ~340 techniques. Many are the same idea in different
clothes (five different "draw-on line" effects, four "counter" effects, six particle weathers…). The library
generalises each idea once, with props that reproduce every source variant. `docs/TECHNIQUES.md` maps every
source technique id to the library motion (or transition / core helper) that rebuilds it.

Families and their motion ids. `(vN technique-id)` = where it comes from.

## text/  — typography & captions
| id | rebuilds |
|---|---|
| kinetic-captions ✅ | v10 kinetic-word-highlight-captions |
| handwrite-on ✅ | v4 handwrite-stroke-on, v22 handwrite-on, caption-card-scribble, fade-to-paper-endcard, v15 script-logo-write-on |
| typewriter-code | v8 ide-typewriter-panel, v17 typewriter-code, v13 terminal typing |
| typewriter-signature | v1/v6 typewriter-signature (corner credit typing, scramble-out) |
| blur-in-title | v23 blur-letter-title-card, zone-title-blur-swap, v8 blur-caption-swap, v10 serif-title-fade, v21 turn-banner-fade |
| mask-rise-title | v17 masked-title-swap + masked-line-reveal, v3 staggered-title-fade, v18 end card |
| stamp-slam | v10 stamp-slam, keyword-pop, v19 hero-word-punch, v21 title-hard-pop |
| comic-burst | v12 comic SFX bursts, v14 comic-impact-burst, v17 impact-frame |
| chapter-header | v8 stage-title-block, v17 principle title, v14 era-badge-crossfade, v10 vertical-location-label |
| number-counter | v23 depth-counter-hud, v19 era-dial counter roll, v17 anticipation gauge counter, v14 coin counter |
| neon-sign | v20 neon-sign-ignite |
| glyph-orbit-logo | v19 glyph-orbit-assemble, arc-text-type, framed-tagline-build |
| end-card-credits | v8 end-card-stats-stagger, v17 end card, v23 title |
| story-caption-box | v21 subtitle-box, v12 time-stamp label plates |

## transitions (src/transitions.tsx, demo motion: transition-reel)
existing: fade slide wipe iris blob tear zoom flash glitch clock flip
add: `ripple` (v17 ripple-flood), `spiral` (v17 spiral-wipe), `wave` (v17 liquid-wave-wipe, v20 wave-line-wipe),
`bands` (v17 luma-ramp-wipe, bar-expand-wipe), `diagonal` (v6 diagonal-palette-wipe), `push-blur` (v10 push-slide-blur, v20 whip-pan-truck),
`page-turn` (v1 page-turn-cover, v9 paper-roll-wipe), `storm` (v1 storm-wall-wipe, watercolor-front-wipe), `whiteout`
(v16 bloom-whiteout, glow-burnout-cut, v21 blizzard-whiteout-dissolve, v6 light-hole-expand), `bar` (v19 bar-slide-wipe),
`strip` (v21 eye-strip-slam), `dots` (v18 dot-zoom-punch, particle-burst-zoom), `xray` (v6 xray-hatch-hole, v11 blob reveal).

## shape/ — geometry, line art, physics toys
sonar-ping ✅ (v4) · call-response (v4 dual-sphere, tilt camera, sparkles, lotus) · pair-field (v4) ·
line-draw-on (v1 crease-line-draw, v20 line-by-line-construct, v10 stroke-draw-frames, v19 engrave-stroke-draw) ·
compass-construct (v6 compass-geometry-construct, geometry-implode) · hex-comb-build (v6 hex-comb-build-strokes, hex-prism-extrude, spiral-cap-close) ·
petal-bloom (v4 lotus-bloom-pop, v15 radial-petal-bloom) · rose-curve-trace (v17 rose-curve-trace, petal-zoom-wipe) ·
gears (v20 meshing-gears) · cell-division (v6 cell-division-doubling + binary-tree-grow) · metaball-heatmap (v2, v18 metaball-blobs) ·
sprout-grow (v20) · heart-draw-fill (v20) · origami-fold (v1 origami-fold-sequence, paper-scrap-fall) ·
bouncing-ball (v17 squash-stretch-bounce, anticipation-charge-launch, note-per-bounce, ground-crack-debris) ·
ribbon-trail (v17 ribbon-follow-through) · onion-skin-arc (v17 onion-skin-trail, split-compare-drop) · easing-graph (v17 ease-compare-tracks, graph-editor-curve) ·
flat-to-3d-sphere (v17 flat-to-3d-sphere, callout-leader-labels, render-flatten)

## fx/ — bursts & accents (mostly overlay-capable)
confetti-burst (v17 confetti-burst-fill, v7 impact-confetti, v14 style-swap-confetti-burst) · sparkle-burst (v20 tool-tap-repair, v22 capture-scuffle-sparkles, cheer-bounce-emotes) ·
star-glint (v5 star-glint-flare, v2 zipper glint) · emote-pop (v20 emote-icon-pop) · scribble-ball (v20 scribble-frustration-ball, v2 line-boil) ·
smoke-puffs (v20 smoke-puff-circles, v3 cannon-flash-smoke) · electric-arcs (v2) · eyes-blink (v17 character-eyes, v2 eye-look-blink, v21 watching-eyes-in-dark) ·
giant-eye-reveal (v23, v15 eye-zoom-match-cut, v17 eyelid-iris-close)

## environment/ — weather, skies, landscapes, worlds
rain (v1, v14, v16 rain-overlay) · snowfall (v2, v21) · embers (v3 ember-spark-particles, v14 ember-motes, gold-fleck) · falling-petals (v6, v14 falling-papers) ·
caustics-godrays (v23 surface-caustics-godrays, v2 caustic-water-texture, v14 light-shaft-dust) · aurora (v21 aurora-curtain) ·
starfield-night (v15) · flow-lines (v1 wind-streamlines, v6 heat-wiggle-lines, v16 steam-wisps, v20 wave-line) ·
curl-flow (v2 curl-flow-swirl) · bubbles (v2 iridescent-bubble-cluster) · lightning-flash (v16 lightning-relight) · grass-field (v15) ·
sun-rise-set (v15 sunrise-disc-rise, v1 sun-set-descent) · topdown-terrain (v1 topdown-terrain-scroll, biome montage) ·
parallax-landscape (v1 parallax-landscape-truck, v15 parallax-speed-run) · city-skyline (v20 procedural-sketch-city, v2 window-grid-flicker) ·
depth-descent (v23 depth-descent-scroll, log-depth-ruler, marine-snow, bathysphere-idle-bob, headlamp-beam) · flock (v1 v-formation-flock, bird-flap-cycle) ·
fish-school (v23 sprite-swim-cycle) · insect-flight (v1 insect-dart-land, v2 insect-zigzag-flight)

## data/ & hud/
iso-bar-chart (v7 iso-bar-staircase, hop-and-paint, floor-tile-ripple, paint-cascade, pillar-rise-sink) ·
hud-chrome (v17 hud-chrome-overlay, v9 scroll-progress-hud) · callout-labels (v9 room-label-callout, v23 object-callout-tag, v19 medallion-pop, v6 callout-inset-lens) ·
map-route (v6 map-flight-path, waggle-dance-diagram, v22 hop-move-dotted-trail) · era-dial (v19 era-dial-counter) · radial-blueprint (v19 radial-plan-blueprint, radar-spoke-draw, radial-network-reveal) ·
zoom-tunnel (v19 zoom-through-tunnel) · powers-of-ten (v19 powers-of-ten-pullback, snap-zoom-reveal) · split-compare (v3 split-screen-compare) ·
browser-mockup (v9 browser-frame-mockup, v5 cinemagraph-hero-loop, gradient-headline) · card-fan (v21 card-hand-deal-and-play, v19 card-fan-connect) ·
thumbnail-mosaic (v4 thumbnail-disc-collapse, staggered-pop-out, v2 mosaic-grid-finale, v14 monitor-push-thumbnail-recap) ·
panel-triptych (v10 stroke-draw-frames, mask-slide-image-fill, panel-collide, prison-bars-drop) ·
beat-montage (v4 accelerating-montage, sonar-ring-overlay, v2 beat-hardcut-montage, v18 beat-style-shuffler) ·
perspective-grid (v22 perspective-grid-draw-on, pencil-hatch-squares, doodle-piece-pop-in, move-hint-rings, board-pullback-reveal)

## image/ — image plates & post effects (all take `src`, fall back to a procedural plate)
ken-burns (v10 woodblock-ken-burns, v16 slow-push-ken-burns, v22 shot-push-in, v21 tall-tilt-reveal, v10 punch-in-cut) ·
dot-matrix (v18 led-dot-matrix, halftone-duotone, luma-particle-glow, resolution-ramp, v14 pointillism-fill/halftone-bg) ·
pixel-dither (v21 pixelate-dither-look, cinemascope-letterbox) · duotone (v4 duotone-recolor, v5 ink-etching-tint, v21 madness-flash-tint, v16 grade-to-night) ·
xray-scan (v2 xray-scan-sweep, v6 xray-hatch-hole, v11 x-ray reveal) · glass-pane-grid (v2 refraction-pane-grid) · glitch-image (v2 glitch-band-displace, datamosh, v8 glitch-layer-rewind, v18 rgb-split-flash, chroma-echo-trail) ·
film-look (v8 film-post-stack, v16 anamorphic-flare, v21 letterbox, grain) · light-sweep (v16 headlight-sweep, light-cone-volumetric, door-light-flood)

## 3d/ — three.js
terrain-build-3d (v8 procedural-terrain-build, cinematic-flyby-camera, stage-cut) · wireframe-build (v3 wireframe-extrude-build, emissive-materialize, v9 sketch-to-render-reveal) ·
plan-tilt (v9 plan-tilt-to-elevation, v4 paper-plane-tilt-camera, v6 perspective-hex-floor) · pointcloud-orbit (v18 depth-pointcloud, particle-disintegrate)

## character/
box-bot (v20 box-bot-character, v12/v13 cube mascot, emote) · blob-mascot (v7 squash-stretch-blob, roll-with-trail) ·
walker-world-scroll (v14 pinned-walker-world-scroll, torn-seam-era-wipe, seam-split-character-restyle, chibi-hero-rig, gag-beat) ·
crowd-bob (v5 crowd-stomp-hop, v20 crowd-cheer-bob)

## core look helpers (src/core) — not motions
PaperTexture (v1 style-paper, v9 blueprint-paper, v22 paper-texture-bg), FilmGrain (v14/v15 speckle-grain), Vignette, Scanlines (v19 scanline-texture-bg),
Camera + useHandheld, onTwos (v1 12-fps stepped timing), GlossySphere, Sparkle, hatch patterns (v1 cast-shadow-hatched, v20 pencil-sketch-render).
