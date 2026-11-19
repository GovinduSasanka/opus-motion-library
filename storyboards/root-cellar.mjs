// Builds storyboards/root-cellar.json — "How a hole in your yard becomes a root cellar" (What Would You Do? channel).
// One continuous 3D cross-section shot (section-build-3d), one scene per narration line, real CC0 foley per action,
// no music bed (the 3D build references run voice + foley only: gap −30 to −43 dB). 2026-11-20 quality rebuild.
import fs from 'node:fs';
import path from 'node:path';

const LANG = process.argv[2] ?? 'en';
const STONE = '#cfc6b4'; // light concrete/stone like the reference interior
const BACK = '#ddd4c2';
const WOOD = '#b07a45';
const steps = [
  {ops: [{type: 'dig', x: 0, w: 3.2, depth: 2.6}], cam: {x: 0, y: -1.0, dist: 16.5}},
  {ops: [{type: 'box', x: -1.52, y: -1.3, w: 0.16, h: 2.6, d: 3.1, z: -1.6, anim: 'rise', color: STONE}, {type: 'box', x: 1.52, y: -1.3, w: 0.16, h: 2.6, d: 3.1, z: -1.6, anim: 'rise', color: STONE, delay: 10}, {type: 'box', x: 0, y: -1.3, w: 2.9, h: 2.6, d: 0.1, z: -3.1, anim: 'rise', color: BACK, delay: 20}], cam: {x: 0.3, y: -1.5, dist: 13}},
  {ops: [{type: 'box', x: 0, y: -2.55, w: 2.88, h: 0.1, d: 3.1, z: -1.6, anim: 'grow', color: '#bdb4a3'}], cam: {x: -0.2, y: -2.0, dist: 11}},
  {ops: [{type: 'box', x: 0, y: 0.07, w: 3.7, h: 0.14, anim: 'drop', color: WOOD}, {type: 'box', x: 0, y: 0.34, w: 4.1, h: 0.4, anim: 'drop', color: '#7a5030', delay: 22}], cam: {x: 0, y: -0.7, dist: 15.5}},
  {ops: [{type: 'ladder', x: -1.05, y0: -2.5, y1: 0.75}, {type: 'box', x: -1.05, y: 0.6, w: 0.9, h: 0.08, d: 0.9, anim: 'fade', color: '#6b4a2f', delay: 24}], cam: {x: -0.5, y: -1.3, dist: 12.5}},
  {ops: [{type: 'person', x: -3.2, y: 0.55, toX: -0.5, toY: -2.5}], cam: {x: -0.7, y: -1.9, dist: 10.5}},
  {ops: [{type: 'pipe', x: 1.15, y0: -2.2, y1: 1.5, color: '#8d969c'}, {type: 'pipe', x: 0.25, y0: -0.15, y1: 1.9, color: '#8d969c', delay: 18}], cam: {x: 0.5, y: -0.6, dist: 14.5}},
  {ops: [{type: 'arrows', x0: 0.25, y0: -0.4, x1: 0.25, y1: 2.1, color: '#ff7a45'}, {type: 'arrows', x0: 1.15, y0: 1.6, x1: 1.15, y1: -2.1, color: '#4fb3ff', delay: 10}], cam: {x: 0.6, y: -0.4, dist: 12.5}},
  {ops: [{type: 'sun', on: true}, {type: 'clock'}, {type: 'label', text: '10 °C', x: 0.5, y: 0.58}], cam: {x: 0, y: -1.1, dist: 16}},
  {ops: [{type: 'sun', on: false}, {type: 'shelf', x: 0.6, y: -2.5, w: 1.3, h: 1.7, rows: 3}], cam: {x: 0.4, y: -1.9, dist: 10.5}},
  {ops: [{type: 'label', text: LANG === 'de' ? 'Kein Strom' : 'No power', x: 0.5, y: 0.3}], cam: {x: 0, y: -0.6, dist: 18.5}},
];

const T = {
  en: [
    'You dig a hole in your backyard, about two meters deep.',
    'But the walls keep crumbling, so you line them with stone.',
    'You lay a gravel floor, so water drains away.',
    'Then wooden beams, and a thick roof of dirt on top.',
    'A ladder and a hatch, so you can get in.',
    'But down there, the air gets damp and stuffy.',
    'So you run one pipe down low, and one up high.',
    'Warm air rises out the top. Cool air sinks in.',
    'Now it stays cool all year, even in the summer.',
    'You fill the shelves with potatoes, carrots and apples.',
    'And they last for months. No fridge. No power.',
  ],
  de: [
    'Du gräbst ein Loch im Garten, etwa zwei Meter tief.',
    'Aber die Wände bröckeln, also mauerst du sie mit Stein aus.',
    'Unten kommt Kies hin, damit das Wasser abläuft.',
    'Dann Holzbalken und ein dickes Dach aus Erde.',
    'Eine Leiter und eine Luke, damit du hineinkommst.',
    'Aber da unten wird die Luft feucht und stickig.',
    'Also legst du ein Rohr nach unten und eins nach oben.',
    'Warme Luft steigt oben raus. Kühle Luft sinkt hinein.',
    'Jetzt bleibt es das ganze Jahr kühl, auch im Sommer.',
    'Du füllst die Regale mit Kartoffeln, Karotten und Äpfeln.',
    'Und sie halten monatelang. Kein Kühlschrank. Kein Strom.',
  ],
};
// foley per step: [file, frame after scene start, volume]
const F = (f) => `sfx/foley/${f}.mp3`;
const sfx = [
  [[F('scrape1'), 6, 0.9], [F('gravel'), 34, 0.8], [F('scrape3'), 60, 0.7]],
  [[F('wood-on-concrete'), 10, 0.7], [F('thuds'), 24, 0.6]],
  [[F('gravel'), 8, 0.9]],
  [[F('wood-on-wood-thuds'), 12, 0.8], [F('mud02'), 32, 0.9]],
  [[F('wood01'), 8, 0.8], [F('creak1'), 30, 0.7], [F('doorclose_1'), 50, 0.6]],
  [[F('footstep02'), 8, 0.7], [F('footstep02'), 22, 0.6], [F('wood01'), 44, 0.5]],
  [[F('metal-clatter'), 8, 0.6], [F('metal-drop'), 30, 0.5]],
  [],
  [],
  [[F('wood-clap'), 10, 0.6], [F('wood-hammering'), 20, 0.25]],
  [],
];

const sb = {
  name: `root-cellar-${LANG}`,
  width: 1080,
  height: 1920,
  fps: 30,
  voice: LANG === 'de'
    ? {model: 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', speaker: 'Ryan', seed: 7, language: 'German', lang: 'de', style: 'Ein deutscher Muttersprachler, männlicher Dokumentarfilm-Sprecher Mitte dreißig, klare hochdeutsche Aussprache ohne Akzent, ruhig, warm und spannend, wie ein Wissens-Kanal im Fernsehen.'}
    : {speaker: 'Ryan', seed: 7, style: 'Calm, curious documentary narrator telling a quick survival build story. Clear, natural, slightly intrigued, never robotic.'},
  captions: true,
  captionStyle: {variant: 'word', size: 96, y: 0.43},
  scenes: T[LANG].map((say, i) => ({
    motion: 'section-build-3d',
    props: {steps, stage: i, dur: 110, delay: 2, t0: 'auto', len: 'auto'},
    say,
    lead: 4,
    pad: 10,
    min: 100,
    captionPosition: 'bottom',
    sfx: sfx[i].map(([file, at, volume]) => ({file, at, volume})),
  })),
};
const out = path.join(import.meta.dirname, `root-cellar-${LANG}.json`);
fs.writeFileSync(out, JSON.stringify(sb, null, 1));
console.log(out);
