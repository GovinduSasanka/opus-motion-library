import {defineStyle} from '../types';

// Original base styles. Each turns ANY motion into that visual language.

export const woodcut = defineStyle({
  id: 'woodcut',
  name: 'Woodcut print',
  family: 'print',
  description: 'Black relief print on warm laid paper: hard ink/paper threshold, carved line screen, ragged block edge, one spot colour.',
  useFor: 'Folk tales, craft brands, book trailers, serious history.',
  palette: {bg: '#EFE6D2', paper: '#EFE6D2', ink: '#16120E', accent: '#B5462A', swatches: ['#16120E', '#EFE6D2', '#B5462A']},
  steps: [
    {type: 'contrast', value: 1.5},
    {type: 'lines', gap: 7, ink: '#16120E', paper: '#EFE6D2'},
    {type: 'wobble', scale: 2.2, frequency: 0.03},
  ],
  overlays: {paper: {color: '#EFE6D2', amount: 0.35, fiber: 0.45}, deckle: {color: '#EFE6D2', size: 26}},
  step: 2,
  fonts: {display: 'IM Fell English SC', body: 'IM Fell English'},
  tags: ['print', 'monochrome', 'folk', 'carved', 'woodcut'],
  source: 'original (grammar inspired by lemo-opuscar styles/woodcut, MIT/CC BY 4.0)',
});

export const risograph = defineStyle({
  id: 'risograph',
  name: 'Risograph',
  family: 'print',
  description: 'Two-ink riso print: pink + blue gradient map, coarse halftone, misregistered second plate, grainy paper.',
  useFor: 'Zines, indie brands, event posters, playful explainers.',
  palette: {bg: '#F3EEE3', paper: '#F3EEE3', ink: '#2A3B8F', accent: '#FF4F8B', accent2: '#FFD23F', swatches: ['#2A3B8F', '#FF4F8B', '#FFD23F', '#F3EEE3']},
  steps: [
    {type: 'gradientMap', ramp: ['#2A3B8F', '#7A4FA0', '#FF4F8B', '#F7C7D6', '#F3EEE3']},
    {type: 'posterize', levels: 5},
    {type: 'misregister', dx: 4, dy: -3, color: '#FF4F8B', opacity: 0.35},
    {type: 'grain', amount: 0.12},
  ],
  overlays: {paper: {color: '#F3EEE3', amount: 0.25, fiber: 0.5}},
  fonts: {display: 'Archivo Black', body: 'Space Grotesk'},
  tags: ['print', 'riso', 'zine', 'pink', 'blue', 'grain'],
  source: 'original',
});

export const inkWash = defineStyle({
  id: 'ink-wash',
  name: 'Ink wash (sumi-e)',
  family: 'paint',
  description: 'Monochrome brush ink on rice paper: soft grey washes, bleeding edges, slight wobble, a single red seal accent.',
  useFor: 'Calm, poetic, nature, East-Asian themes, meditation and craft stories.',
  palette: {bg: '#EEE9DE', paper: '#EEE9DE', ink: '#1C1C1E', accent: '#B83A2C', swatches: ['#1C1C1E', '#6D6B66', '#B7B2A6', '#EEE9DE']},
  steps: [
    {type: 'gradientMap', ramp: ['#1C1C1E', '#4A4946', '#8C8A84', '#C9C4B8', '#EEE9DE']},
    {type: 'bleed', radius: 3, strength: 0.7},
    {type: 'wobble', scale: 3, frequency: 0.015},
  ],
  overlays: {paper: {color: '#EEE9DE', amount: 0.4, fiber: 0.55}, vignette: {amount: 0.18, color: 'rgba(60,50,40,1)'}},
  fonts: {display: 'Cormorant Garamond', body: 'Cormorant Garamond'},
  tags: ['ink', 'brush', 'zen', 'monochrome', 'paper'],
  source: 'original',
});

export const blueprint = defineStyle({
  id: 'blueprint',
  name: 'Blueprint',
  family: 'technical',
  description: 'White technical line-work on Prussian blue: edge-detected drawing, faint grid paper, cyan glow.',
  useFor: 'Engineering, architecture, product teardown, "how it works" sections.',
  palette: {bg: '#123A6B', paper: '#123A6B', ink: '#EAF4FF', accent: '#7FD3FF', swatches: ['#0C2A50', '#123A6B', '#7FD3FF', '#EAF4FF']},
  steps: [
    {type: 'gradientMap', ramp: ['#0C2A50', '#123A6B', '#1B4B85', '#2E66A6']},
    {type: 'edges', color: '#EAF4FF', strength: 9, width: 1.4},
    {type: 'glow', radius: 2, amount: 0.35},
  ],
  overlays: {frameLine: {color: 'rgba(234,244,255,0.5)', inset: 28, width: 1.2}, vignette: {amount: 0.3, color: 'rgba(4,12,30,1)'}},
  fonts: {display: 'Space Grotesk', body: 'JetBrains Mono'},
  tags: ['technical', 'blueprint', 'line', 'engineering', 'blue'],
  source: 'original',
});

export const pixel8 = defineStyle({
  id: 'pixel-8bit',
  name: '8-bit pixel',
  family: 'retro',
  description: 'Chunky 8 px pixels, 6-level posterised palette, steps on twos — any motion becomes a retro game cutscene.',
  useFor: 'Games, nostalgia, playful product moments, developer humour.',
  palette: {bg: '#1A1C2C', paper: '#1A1C2C', ink: '#F4F4F4', accent: '#FFCD75', accent2: '#38B764', swatches: ['#1A1C2C', '#5D275D', '#B13E53', '#EF7D57', '#FFCD75', '#38B764', '#41A6F6', '#F4F4F4']},
  steps: [{type: 'pixelate', size: 8}, {type: 'posterize', levels: 6}, {type: 'saturate', value: 1.25}],
  overlays: {scanlines: {gap: 4, opacity: 0.12}},
  step: 2,
  fonts: {display: 'Press Start 2P', body: 'VT323'},
  tags: ['pixel', 'retro', 'game', '8-bit'],
  source: 'original',
});

export const comicHalftone = defineStyle({
  id: 'comic-halftone',
  name: 'Comic halftone',
  family: 'print',
  description: 'Pop-art print: punchy saturated colour, ink outlines and a dot screen over the midtones.',
  useFor: 'Punchlines, launches, pop culture, energetic social clips.',
  palette: {bg: '#FFF4D6', paper: '#FFF4D6', ink: '#14110F', accent: '#E8322E', accent2: '#1F6FEB', swatches: ['#14110F', '#E8322E', '#FFD400', '#1F6FEB', '#FFF4D6']},
  steps: [{type: 'saturate', value: 1.6}, {type: 'posterize', levels: 4}, {type: 'edges', color: '#14110F', strength: 8, width: 1.6}],
  overlays: {paper: {color: '#FFF4D6', amount: 0.2}},
  step: 2,
  fonts: {display: 'Bangers', body: 'Archivo Black'},
  tags: ['comic', 'pop-art', 'halftone', 'outline'],
  source: 'original',
});

export const watercolor = defineStyle({
  id: 'watercolor',
  name: 'Watercolour',
  family: 'paint',
  description: 'Soft pigment washes with darkened bleeding edges, gentle wobble and cold-press paper texture.',
  useFor: 'Children’s stories, travel, wellness, gentle brand films.',
  palette: {bg: '#F6F1E7', paper: '#F6F1E7', ink: '#3B3A4A', accent: '#E07A5F', accent2: '#3D85C6', swatches: ['#E07A5F', '#F2CC8F', '#81B29A', '#3D85C6', '#F6F1E7']},
  steps: [{type: 'saturate', value: 0.85}, {type: 'bleed', radius: 4, strength: 0.8}, {type: 'wobble', scale: 4, frequency: 0.012}, {type: 'brightness', value: 1.04}],
  overlays: {paper: {color: '#F6F1E7', amount: 0.45, fiber: 0.6}},
  fonts: {display: 'Caveat', body: 'Cormorant Garamond'},
  tags: ['paint', 'soft', 'watercolor', 'kids', 'paper'],
  source: 'original',
});

export const newsprint = defineStyle({
  id: 'newsprint',
  name: 'Newsprint',
  family: 'print',
  description: 'Greyscale newspaper photo screen: fine halftone dots on yellowed paper, slight ink spread.',
  useFor: 'History, journalism, "breaking" moments, archival documentaries.',
  palette: {bg: '#E9E2CF', paper: '#E9E2CF', ink: '#1E1C1A', accent: '#A3271F', swatches: ['#1E1C1A', '#E9E2CF']},
  steps: [{type: 'saturate', value: 0}, {type: 'contrast', value: 1.25}, {type: 'halftone', size: 7, ink: '#1E1C1A', paper: '#E9E2CF'}],
  overlays: {paper: {color: '#E9E2CF', amount: 0.3, fiber: 0.5}, vignette: {amount: 0.2, color: 'rgba(80,60,30,1)'}},
  fonts: {display: 'Playfair Display', body: 'Source Serif 4'},
  tags: ['newspaper', 'halftone', 'archival', 'history'],
  source: 'original',
});

export const neonNoir = defineStyle({
  id: 'neon-noir',
  name: 'Neon noir',
  family: 'screen',
  description: 'Night-city grade: crushed blacks, magenta/cyan split, bloom on highlights, rain-wet sheen and grain.',
  useFor: 'Tech launches, music, gaming, cyber themes, night scenes.',
  palette: {bg: '#07060D', paper: '#07060D', ink: '#F3E9FF', accent: '#FF2E97', accent2: '#21E6FF', swatches: ['#07060D', '#3A0D5C', '#FF2E97', '#21E6FF', '#F3E9FF']},
  steps: [{type: 'gradientMap', ramp: ['#07060D', '#2A0C4E', '#9B1C8C', '#FF2E97', '#7FF6FF']}, {type: 'glow', radius: 6, amount: 0.7}, {type: 'grain', amount: 0.08}],
  overlays: {vignette: {amount: 0.45}, leak: {color: '#21E6FF', amount: 0.15}},
  fonts: {display: 'Space Grotesk', body: 'Inter'},
  tags: ['neon', 'cyber', 'night', 'glow', 'synthwave'],
  source: 'original',
});

export const crtTerminal = defineStyle({
  id: 'crt-terminal',
  name: 'CRT terminal',
  family: 'screen',
  description: 'Green phosphor monitor: monochrome green ramp, scanlines, glow bloom and curved-screen vignette.',
  useFor: 'Hacker/dev themes, retro computing, logs and data, sci-fi interfaces.',
  palette: {bg: '#020A05', paper: '#020A05', ink: '#8CFFB0', accent: '#D9FFE5', swatches: ['#020A05', '#0B3A1C', '#1F8A45', '#8CFFB0']},
  steps: [{type: 'gradientMap', ramp: ['#020A05', '#0B3A1C', '#1F8A45', '#8CFFB0', '#E6FFEE']}, {type: 'glow', radius: 4, amount: 0.8}],
  overlays: {scanlines: {gap: 3, opacity: 0.35}, vignette: {amount: 0.6}},
  fonts: {display: 'VT323', body: 'JetBrains Mono'},
  tags: ['crt', 'terminal', 'green', 'retro', 'hacker'],
  source: 'original',
});

export const pencilSketch = defineStyle({
  id: 'pencil-sketch',
  name: 'Pencil sketch',
  family: 'drawing',
  description: 'Graphite on sketch paper: soft grey edges, boiling line wobble on twos, paper fibre.',
  useFor: 'Storyboards, ideation, "drawing it out", education and explainers.',
  palette: {bg: '#F4F1EA', paper: '#F4F1EA', ink: '#3A3A3C', accent: '#D24B3E', swatches: ['#3A3A3C', '#8E8C86', '#F4F1EA']},
  steps: [
    {type: 'gradientMap', ramp: ['#9C9A94', '#C9C6BE', '#E6E2D8', '#F4F1EA']},
    {type: 'edges', color: '#3A3A3C', strength: 7, width: 1.2},
    {type: 'wobble', scale: 2.5, frequency: 0.04, boil: 3},
  ],
  overlays: {paper: {color: '#F4F1EA', amount: 0.4, fiber: 0.6}},
  step: 2,
  fonts: {display: 'Caveat', body: 'Caveat'},
  tags: ['pencil', 'sketch', 'drawing', 'storyboard'],
  source: 'original',
});

export const cyanotype = defineStyle({
  id: 'cyanotype',
  name: 'Cyanotype',
  family: 'photo',
  description: 'Sun-print blue: Prussian-blue to paper-white ramp, soft chemical edges and brushed border.',
  useFor: 'Botany, science history, calm product stories, archival looks.',
  palette: {bg: '#0E3B6E', paper: '#E8EEF2', ink: '#0E3B6E', accent: '#F2F6F8', swatches: ['#0B2E57', '#2A5D93', '#9DB8D4', '#E8EEF2']},
  steps: [{type: 'gradientMap', ramp: ['#0B2E57', '#1F4F86', '#5D86B5', '#B8CCE0', '#EEF3F6']}, {type: 'grain', amount: 0.07}],
  overlays: {deckle: {color: '#E8EEF2', size: 22}, vignette: {amount: 0.2, color: 'rgba(5,20,45,1)'}},
  fonts: {display: 'Cormorant Garamond', body: 'Inter'},
  tags: ['blue', 'photo', 'archival', 'science'],
  source: 'original',
});

export const filmNoir = defineStyle({
  id: 'film-noir',
  name: 'Film noir',
  family: 'photo',
  description: 'High-contrast black-and-white cinema: deep shadows, silver highlights, gate grain and 2.39:1 bars.',
  useFor: 'Mystery, drama, serious brand films, trailers.',
  palette: {bg: '#050505', paper: '#050505', ink: '#F2F2F2', accent: '#BFBFBF', swatches: ['#050505', '#3A3A3A', '#9A9A9A', '#F2F2F2']},
  steps: [{type: 'saturate', value: 0}, {type: 'contrast', value: 1.55, mid: 0.45}],
  overlays: {filmGrain: 0.12, vignette: {amount: 0.55}, letterbox: {aspect: 2.39}},
  fonts: {display: 'Playfair Display', body: 'Inter'},
  tags: ['noir', 'black-and-white', 'cinema', 'drama'],
  source: 'original',
});
