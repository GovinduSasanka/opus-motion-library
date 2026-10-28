import {defineStyle} from '../types';

// Styles researched in analysis/sources/pdoom.md and analysis/sources/character-rig.md.
// engraved-treatise: pdoom-video (MIT). ink-wash-cartoon: ClaudeAnimationBase (MIT).
// watercolor-storybook: PDoomVideo (no licence) — idea only, built from scratch here.

export const engravedTreatise = defineStyle({
  id: 'engraved-treatise',
  name: 'Engraved treatise',
  family: 'print',
  description: 'Deadpan scientific plates on near-black: white-line engraving by luminance bands, bone type greys, and one hazard-orange signal that is the only thing allowed to glow.',
  useFor: 'Lyric videos, AI / science essays, banknote-serious explainers, dark technical title sequences.',
  palette: {bg: '#0A0A0B', paper: '#EEE9DF', ink: '#EEE9DF', accent: '#FF4D12', accent2: '#FF8A3D', swatches: ['#0A0A0B', '#151517', '#5E5B57', '#9C978F', '#EEE9DF', '#FF4D12', '#FF8A3D', '#C21D0B']},
  steps: [
    {type: 'autoInvert', want: 'dark'},
    {type: 'accentKeep', color: '#FF4D12', range: 24, minSat: 0.25},
    {type: 'gradientMap', ramp: ['#0A0A0B', '#151517', '#5E5B57', '#9C978F', '#EEE9DF']},
    {type: 'hatch', gap: 6, ink: '#EEE9DF', invert: true, families: [{angle: 45, from: 0.97, max: 0.5}, {angle: -45, from: 0.72, max: 0.5}, {angle: 7, from: 0.45, max: 0.45}]},
    {type: 'accentRestore', saturate: 1.15},
    {type: 'bloom', radius: 6, threshold: 0.8, amount: 0.6, tint: '#FF8A3D'},
    {type: 'chroma', dx: 1.2},
    {type: 'grain', amount: 0.055},
  ],
  overlays: {vignette: {amount: 0.35}},
  fonts: {display: 'Archivo', body: 'Archivo', mono: 'IBM Plex Mono'},
  tags: ['engraving', 'white-line', 'scratchboard', 'dark', 'signal-orange', 'treatise', 'banknote', 'lyric'],
  signature: ['live-chart', 'number-counter', 'compass-construct', 'branch-grow', 'typewriter-code'],
  avoid: ['purple/cyan neon', 'lens flares', 'particle nebulae', 'centred subtitles'],
  confusableWith: ['engraving', 'blueprint', 'film-noir'],
  motionRules: 'Hard cuts on downbeats; strong ease → hold → snap; held words keep creeping (+3.5 %/s).',
  source: 'pdoom-video docs/TREATMENT.md + engine/palette.ts, post.ts (MIT) — see THIRD_PARTY_NOTICES.md',
});

export const inkWashCartoon = defineStyle({
  id: 'ink-wash-cartoon',
  name: 'Ink-and-wash cartoon',
  family: 'paint',
  description: 'Flat 2D cartoon painted in watercolour washes with a boiling tapered ink outline on warm paper: never pure black or white, wet edges, pigment grain, on twos.',
  useFor: 'Mascot acting, story shorts, warm character explainers, hand-made brand films.',
  palette: {bg: '#F3EBDC', paper: '#F3EBDC', ink: '#2B2233', accent: '#D97757', accent2: '#E8AA38', swatches: ['#F3EBDC', '#2B2233', '#FFF5E2', '#D97757', '#1F2550', '#E27A92', '#E8AA38', '#3A9C98']},
  steps: [
    {type: 'saturate', value: 0.95},
    {type: 'toon', levels: 5, smooth: 1.6},
    {type: 'bleed', radius: 3, strength: 0.6},
    {type: 'wobble', scale: 2.2, frequency: 0.03, boil: 2},
    {type: 'edges', color: '#2B2233', strength: 6, width: 1.5},
    {type: 'texture', freq: 0.75, amount: 0.09, mode: 'multiply', boil: 2},
  ],
  overlays: {paper: {color: '#F3EBDC', amount: 0.4, fiber: 0.5, kind: 'cold-press'}, vignette: {amount: 0.3, color: 'rgba(120,95,70,1)'}},
  step: 2,
  fonts: {display: 'Permanent Marker', body: 'Shantell Sans'},
  tags: ['ink', 'wash', 'cartoon', 'watercolor', 'mascot', 'paper', 'boil', 'on-twos', 'hand-made'],
  signature: ['blob-mascot', 'box-bot', 'eyes-blink', 'bouncing-ball', 'crowd-bob'],
  avoid: ['3D rotation', 'pure black or white', 'captions repeating the voice'],
  confusableWith: ['watercolor', 'crayon-book', 'storybook-gouache'],
  motionRules: 'Drawings boil at 12 fps; anticipation before takes; nothing ever perfectly still.',
  source: 'ClaudeAnimationBase ANIMATION_GUIDE.md, src/core.js (MIT) — see THIRD_PARTY_NOTICES.md',
});

export const watercolorStorybook = defineStyle({
  id: 'watercolor-storybook',
  name: 'Watercolour storybook theatre',
  family: 'paint',
  description: 'A hand-painted picture-book stage show: flat colour washes over paper stains and fibres, wobbly boiling outlines, warm edge vignette, chunky lettering.',
  useFor: 'Musical story shorts, karaoke-style sing-alongs, playful narrated tales, warm seasonal campaigns.',
  palette: {bg: '#F3EBDC', paper: '#F3EBDC', ink: '#2B2233', accent: '#E8AA38', accent2: '#D97757', swatches: ['#F3EBDC', '#2B2233', '#D97757', '#1F2550', '#2F3C7A', '#E27A92', '#E8AA38', '#6E9F58', '#8EC3E6']},
  steps: [
    {type: 'saturate', value: 1.05},
    {type: 'toon', levels: 6, smooth: 2, soft: 0.06},
    {type: 'bleed', radius: 4, strength: 0.7},
    {type: 'wobble', scale: 3, frequency: 0.018, boil: 2},
    {type: 'grain', amount: 0.07},
  ],
  overlays: {paper: {color: '#F3EBDC', amount: 0.45, fiber: 0.55, kind: 'mottle'}, vignette: {amount: 0.35, color: 'rgba(110,80,50,1)'}, leak: {color: '#F2C66E', amount: 0.1, at: 'tl'}},
  step: 2,
  fonts: {display: 'Permanent Marker', body: 'Shantell Sans'},
  tags: ['watercolor', 'storybook', 'theatre', 'karaoke', 'paper', 'painted', 'kids', 'musical'],
  signature: ['blob-mascot', 'falling-petals', 'sun-rise-set', 'kinetic-captions', 'heart-draw-fill'],
  avoid: ['labels repeating the lyric', 'pure black outlines'],
  confusableWith: ['ink-wash-cartoon', 'watercolor', 'crayon-book'],
  motionRules: 'Linework boils at 12 fps; characters bounce on every beat with squash; one focal gag per shot.',
  source: 'original (idea after PDoomVideo ANIMATION_GUIDE.md — no licence, no code or assets reused)',
});
