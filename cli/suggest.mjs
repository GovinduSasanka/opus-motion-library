// `mgl suggest "<brief>"` — rank motions and recipes for a natural-language need.
// Keyword + synonym scorer over id, title, description, useFor, tags, category and catalog metadata
// (roles, mood, overlay/text/image capabilities). No network, deterministic.

/**
 * Synonyms: a word in the brief expands into extra search terms (weight 0.6) and may boost specific
 * motions / recipes directly (weight = number). Keys are stems (see stem()).
 */
export const SYNONYMS = {
  hero: {terms: ['title', 'backdrop', 'headline', 'landing', 'ambience', 'sky'], boost: {'blur-in-title': 3, aurora: 2, 'mask-rise-title': 2, 'hero-aurora-night': 5, 'hero-paper-sketch': 4, 'hero-blueprint-logo': 4}},
  landing: {terms: ['website', 'hero', 'browser', 'headline'], boost: {'browser-mockup': 3, 'hero-aurora-night': 3}},
  website: {terms: ['hero', 'background', 'landing'], boost: {'hero-aurora-night': 2, 'hero-paper-sketch': 1, 'browser-mockup': 1}},
  mockup: {terms: ['browser', 'ui', 'website'], boost: {'browser-mockup': 5}},
  screenshot: {terms: ['browser', 'mockup', 'image'], boost: {'browser-mockup': 4}},
  meditation: {terms: ['calm', 'ambient', 'night', 'slow'], boost: {aurora: 3, 'starfield-night': 3, 'hero-aurora-night': 3, 'caustics-godrays': 2}},
  wellness: {terms: ['calm', 'nature', 'soft'], boost: {'caustics-godrays': 2, 'falling-petals': 2, 'hero-aurora-night': 2}},
  health: {terms: ['heartbeat', 'calm', 'science'], boost: {'live-chart': 2, 'caustics-godrays': 2}},
  api: {terms: ['code', 'network', 'diagram', 'developer'], boost: {'typewriter-code': 4, 'onboarding-steps': 3, 'radial-blueprint': 2, 'hero-blueprint-logo': 2}},
  work: {terms: ['process', 'steps'], boost: {'onboarding-steps': 2}},
  background: {terms: ['backdrop', 'ambience', 'overlay', 'sky', 'loop'], boost: {aurora: 2, 'starfield-night': 2, 'caustics-godrays': 2, 'flow-lines': 1, 'curl-flow': 1}},
  ambient: {terms: ['ambience', 'backdrop', 'calm', 'loop'], boost: {aurora: 2, 'starfield-night': 2, rain: 1, snowfall: 1, embers: 1}},
  loading: {terms: ['loop', 'spinner', 'pulse', 'progress', 'orbit', 'wait'], boost: {'sonar-ping': 4, 'compass-construct': 2, 'glyph-orbit-logo': 2, 'iso-bar-chart': 2, gears: 3, 'loading-loop': 6}},
  spinner: {terms: ['loop', 'orbit', 'pulse'], boost: {'sonar-ping': 3, gears: 3, 'loading-loop': 5}},
  wait: {terms: ['loading', 'loop'], boost: {'loading-loop': 4}},
  stat: {terms: ['number', 'counter', 'chart', 'data', 'gauge', 'metric'], boost: {'number-counter': 5, 'live-chart': 4, 'iso-bar-chart': 4, 'stats-reveal': 6}},
  number: {terms: ['counter', 'stats', 'odometer', 'data'], boost: {'number-counter': 5, 'stats-reveal': 3}},
  metric: {terms: ['number', 'counter', 'chart', 'kpi'], boost: {'number-counter': 4, 'live-chart': 3, 'stats-reveal': 4}},
  kpi: {terms: ['number', 'counter', 'chart'], boost: {'number-counter': 4, 'stats-reveal': 4}},
  chart: {terms: ['graph', 'data', 'bar', 'line'], boost: {'live-chart': 4, 'iso-bar-chart': 4}},
  graph: {terms: ['chart', 'data', 'line', 'network'], boost: {'live-chart': 3, 'easing-graph': 2}},
  data: {terms: ['chart', 'number', 'hud', 'stats'], boost: {'live-chart': 2, 'number-counter': 2, 'iso-bar-chart': 2}},
  growth: {terms: ['grow', 'chart', 'exponential', 'doubling'], boost: {'cell-division': 3, 'iso-bar-chart': 2, 'branch-grow': 2, 'sprout-grow': 2}},
  testimonial: {terms: ['chat', 'quote', 'caption', 'review', 'conversation', 'story'], boost: {'chat-bubbles': 5, 'story-caption-box': 4, 'sms-thread': 3, 'testimonial-chat': 6}},
  review: {terms: ['testimonial', 'quote', 'chat'], boost: {'chat-bubbles': 3, 'testimonial-chat': 4}},
  quote: {terms: ['caption', 'testimonial', 'editorial'], boost: {'story-caption-box': 4, 'blur-in-title': 2, 'testimonial-chat': 3}},
  chat: {terms: ['bubbles', 'message', 'conversation', 'sms'], boost: {'chat-bubbles': 4, 'sms-thread': 4}},
  message: {terms: ['chat', 'sms', 'phone', 'bubbles'], boost: {'sms-thread': 4, 'chat-bubbles': 3}},
  sms: {terms: ['chat', 'phone', 'message'], boost: {'sms-thread': 5}},
  launch: {terms: ['celebrate', 'burst', 'reveal', 'announce', 'impact', 'logo'], boost: {fireworks: 4, 'confetti-burst': 4, 'stamp-slam': 3, 'neon-sign': 2, 'product-launch': 6}},
  announce: {terms: ['launch', 'stamp', 'impact', 'title'], boost: {'stamp-slam': 3, 'sign-drop': 3, 'product-launch': 4}},
  product: {terms: ['launch', 'ui', 'browser', 'mockup', 'app'], boost: {'browser-mockup': 3, 'sms-thread': 2, 'product-launch': 4, 'app-store-preview': 3}},
  app: {terms: ['phone', 'product'], boost: {'app-store-preview': 2, 'sms-thread': 1}},
  store: {terms: ['app', 'preview', 'portrait'], boost: {'app-store-preview': 5}},
  mobile: {terms: ['phone', 'portrait', 'app'], boost: {'app-store-preview': 3, 'sms-thread': 2}},
  celebrat: {terms: ['confetti', 'fireworks', 'party', 'sparkle', 'success'], boost: {'confetti-burst': 5, fireworks: 4, 'sparkle-burst': 3, 'success-celebration': 6}},
  success: {terms: ['celebrate', 'check', 'sparkle', 'confetti', 'done'], boost: {'sparkle-burst': 4, 'confetti-burst': 3, 'heart-draw-fill': 3, 'success-celebration': 6}},
  done: {terms: ['success', 'check'], boost: {'heart-draw-fill': 2, 'success-celebration': 3}},
  check: {terms: ['success', 'icon', 'draw'], boost: {'heart-draw-fill': 3}},
  party: {terms: ['confetti', 'fireworks', 'celebrate', 'crowd'], boost: {'confetti-burst': 3, fireworks: 3, 'crowd-bob': 2}},
  error: {terms: ['glitch', 'warning', 'broken', 'fail', 'storm'], boost: {'glitch-image': 5, 'scribble-ball': 3, 'smoke-puffs': 2, 'error-glitch': 6, 'lightning-flash': 2}},
  fail: {terms: ['error', 'glitch', 'broken'], boost: {'glitch-image': 3, 'scribble-ball': 3, 'error-glitch': 4}},
  broken: {terms: ['error', 'glitch', 'smoke'], boost: {'smoke-puffs': 3, 'glitch-image': 2, 'error-glitch': 3}},
  glitch: {terms: ['rgb', 'datamosh', 'error'], boost: {'glitch-image': 5, 'error-glitch': 4}},
  '404': {terms: ['error', 'glitch'], boost: {'error-glitch': 5, 'glitch-image': 3}},
  onboard: {terms: ['steps', 'tutorial', 'explain', 'chapter', 'process'], boost: {'chapter-header': 3, 'panel-triptych': 3, 'onboarding-steps': 6, 'line-draw-on': 2}},
  step: {terms: ['process', 'chapter', 'onboarding', 'sequence'], boost: {'chapter-header': 3, 'panel-triptych': 3, 'origami-fold': 2, 'onboarding-steps': 4}},
  tutorial: {terms: ['steps', 'explain', 'code'], boost: {'typewriter-code': 3, 'onboarding-steps': 3}},
  process: {terms: ['steps', 'mechanism', 'gears', 'flow', 'build'], boost: {gears: 3, 'line-draw-on': 3, 'panel-triptych': 2, 'wireframe-build': 2}},
  explain: {terms: ['diagram', 'explainer', 'steps', 'callout', 'label'], boost: {'callout-labels': 3, 'line-draw-on': 2, 'panel-triptych': 2, 'flat-to-3d-sphere': 1}},
  explainer: {terms: ['explain', 'diagram', 'callout'], boost: {'callout-labels': 2, 'panel-triptych': 2}},
  diagram: {terms: ['blueprint', 'line', 'callout', 'draw'], boost: {'line-draw-on': 4, 'callout-labels': 3, 'radial-blueprint': 2}},
  countdown: {terms: ['counter', 'timer', 'number', 'event', 'clock'], boost: {'number-counter': 5, 'era-dial': 2, 'event-countdown': 6}},
  timer: {terms: ['countdown', 'counter', 'clock'], boost: {'number-counter': 4, 'event-countdown': 4}},
  event: {terms: ['countdown', 'launch', 'fireworks', 'neon'], boost: {'event-countdown': 5, fireworks: 2, 'neon-sign': 2}},
  music: {terms: ['beat', 'neon', 'rhythm', 'montage', 'party', 'synthwave'], boost: {'beat-montage': 4, 'neon-sign': 3, 'dot-matrix': 3, 'music-neon-promo': 6, 'ribbon-trail': 2}},
  concert: {terms: ['music', 'neon', 'crowd'], boost: {'crowd-bob': 3, 'neon-sign': 3, 'music-neon-promo': 4}},
  neon: {terms: ['glow', 'sign', 'night'], boost: {'neon-sign': 5, 'music-neon-promo': 4, 'sign-drop': 2}},
  ocean: {terms: ['underwater', 'sea', 'water', 'fish', 'depth'], boost: {'depth-descent': 4, 'caustics-godrays': 4, 'fish-school': 4, 'ocean-explainer': 6}},
  sea: {terms: ['ocean', 'underwater', 'water'], boost: {'caustics-godrays': 3, 'fish-school': 3}},
  underwater: {terms: ['ocean', 'water', 'bubbles'], boost: {'depth-descent': 3, 'caustics-godrays': 4}},
  science: {terms: ['biology', 'cell', 'hud', 'microscope', 'lab'], boost: {'science-reticle': 4, 'cell-division': 3, 'swimmers-converge': 2, 'ocean-explainer': 3}},
  biology: {terms: ['cell', 'science', 'growth'], boost: {'cell-division': 4, 'swimmers-converge': 3, 'science-reticle': 3}},
  history: {terms: ['timeline', 'era', 'years', 'past', 'documentary'], boost: {'era-dial': 4, 'walker-world-scroll': 4, 'history-timeline': 6, 'ken-burns': 1}},
  timeline: {terms: ['history', 'era', 'years', 'progress', 'chapter'], boost: {'era-dial': 4, 'walker-world-scroll': 3, 'history-timeline': 5}},
  roadmap: {terms: ['timeline', 'steps', 'route', 'journey'], boost: {'map-route': 3, 'history-timeline': 3}},
  journey: {terms: ['route', 'map', 'travel', 'path'], boost: {'map-route': 4, 'topdown-terrain': 3, 'parallax-landscape': 2}},
  travel: {terms: ['journey', 'map', 'route', 'landscape'], boost: {'map-route': 3, 'parallax-landscape': 3, 'topdown-terrain': 3}},
  map: {terms: ['route', 'aerial', 'terrain'], boost: {'map-route': 4, 'topdown-terrain': 3}},
  social: {terms: ['portrait', 'captions', 'short', 'vertical'], boost: {'social-short-captions': 6, 'kinetic-captions': 3}},
  short: {terms: ['social', 'vertical', 'portrait', 'captions'], boost: {'social-short-captions': 5}},
  reel: {terms: ['social', 'vertical', 'montage'], boost: {'social-short-captions': 4, 'beat-montage': 2}},
  tiktok: {terms: ['social', 'vertical', 'captions'], boost: {'social-short-captions': 5}},
  story: {terms: ['caption', 'narrative', 'chapter'], boost: {'story-caption-box': 3, 'chapter-header': 2}},
  caption: {terms: ['subtitle', 'captions', 'text'], boost: {'kinetic-captions': 4, 'story-caption-box': 3}},
  subtitle: {terms: ['caption', 'captions'], boost: {'kinetic-captions': 4}},
  end: {terms: ['endcard', 'credits', 'outro', 'logo'], boost: {'end-card-credits': 4, 'glyph-orbit-logo': 3, 'end-card': 6}},
  outro: {terms: ['endcard', 'credits', 'logo'], boost: {'end-card-credits': 4, 'glyph-orbit-logo': 3, 'end-card': 5}},
  credit: {terms: ['endcard', 'outro'], boost: {'end-card-credits': 4, 'typewriter-signature': 3}},
  cta: {terms: ['endcard', 'button', 'outro'], boost: {'end-card': 4, 'end-card-credits': 2}},
  logo: {terms: ['brand', 'glyph', 'endcard', 'reveal'], boost: {'glyph-orbit-logo': 5, 'hero-blueprint-logo': 4, 'typewriter-signature': 2}},
  brand: {terms: ['logo', 'identity'], boost: {'glyph-orbit-logo': 4, 'neon-sign': 2}},
  intro: {terms: ['title', 'opener', 'reveal', 'logo'], boost: {'blur-in-title': 3, 'mask-rise-title': 3, 'product-launch': 3}},
  title: {terms: ['headline', 'text', 'type'], boost: {'blur-in-title': 3, 'mask-rise-title': 3}},
  headline: {terms: ['title', 'text'], boost: {'mask-rise-title': 3, 'blur-in-title': 3, 'stamp-slam': 2}},
  chapter: {terms: ['section', 'header', 'title'], boost: {'chapter-header': 4, 'mask-rise-title': 3}},
  section: {terms: ['chapter'], boost: {'section-divider': 1}},
  divider: {terms: ['section', 'transition', 'wipe'], boost: {'section-divider': 6}},
  transition: {terms: ['wipe', 'cut', 'reveal', 'divider'], boost: {'transition-reel': 3, 'section-divider': 4, 'glitch-image': 1}},
  wipe: {terms: ['transition', 'reveal'], boost: {'section-divider': 3, 'xray-scan': 2}},
  reveal: {terms: ['unveil', 'appear', 'mask', 'scan'], boost: {'mask-rise-title': 2, 'xray-scan': 2, 'giant-eye-reveal': 2}},
  photo: {terms: ['image', 'picture', 'grade', 'look'], boost: {'ken-burns': 2, 'film-look': 2, duotone: 2}},
  image: {terms: ['photo', 'picture'], boost: {'ken-burns': 1, 'film-look': 1}},
  cinematic: {terms: ['film', 'letterbox', 'grain', 'documentary'], boost: {'film-look': 4, 'light-sweep': 3, 'blur-in-title': 2}},
  film: {terms: ['cinematic', 'grain', 'letterbox'], boost: {'film-look': 5}},
  retro: {terms: ['pixel', 'dither', 'vintage', 'neon', 'synthwave'], boost: {'pixel-dither': 4, 'dot-matrix': 3, 'neon-sign': 2}},
  vintage: {terms: ['film', 'paper', 'grain', 'retro'], boost: {'film-look': 3, 'ken-burns': 2}},
  comic: {terms: ['halftone', 'pop', 'burst', 'manga'], boost: {'comic-burst': 5, 'comic-halftone': 4, 'speed-lines': 3}},
  paper: {terms: ['sketch', 'pencil', 'handwriting', 'craft'], boost: {'handwrite-on': 3, 'hero-paper-sketch': 4, 'origami-fold': 2}},
  sketch: {terms: ['paper', 'pencil', 'draw', 'doodle'], boost: {'handwrite-on': 3, 'line-draw-on': 3, 'hero-paper-sketch': 4}},
  handwrit: {terms: ['handwriting', 'pen', 'signature'], boost: {'handwrite-on': 5}},
  signature: {terms: ['credit', 'typewriter', 'handwriting'], boost: {'typewriter-signature': 4, 'handwrite-on': 3}},
  blueprint: {terms: ['technical', 'line', 'hud', 'radar'], boost: {'radial-blueprint': 4, 'line-draw-on': 3, 'hero-blueprint-logo': 4}},
  tech: {terms: ['hud', 'code', 'blueprint', 'data', 'network'], boost: {'hud-chrome': 3, 'typewriter-code': 3, 'radial-blueprint': 3}},
  ai: {terms: ['network', 'neuron', 'data', 'tech', 'code'], boost: {'branch-grow': 3, 'radial-blueprint': 2, 'typewriter-code': 2, 'pair-field': 2}},
  code: {terms: ['terminal', 'typewriter', 'developer'], boost: {'typewriter-code': 5}},
  developer: {terms: ['code', 'terminal'], boost: {'typewriter-code': 4}},
  network: {terms: ['graph', 'nodes', 'hub', 'connect'], boost: {'radial-blueprint': 3, 'pair-field': 3, 'branch-grow': 3}},
  security: {terms: ['scan', 'xray', 'radar', 'shield'], boost: {'xray-scan': 3, 'sonar-ping': 3}},
  scan: {terms: ['xray', 'radar', 'sonar'], boost: {'xray-scan': 4, 'sonar-ping': 3}},
  compare: {terms: ['split', 'before', 'after', 'versus'], boost: {'split-compare': 6}},
  versus: {terms: ['compare', 'split'], boost: {'split-compare': 5}},
  before: {terms: ['compare', 'after'], boost: {'split-compare': 4}},
  weather: {terms: ['rain', 'snow', 'storm', 'sun'], boost: {rain: 3, snowfall: 3, 'lightning-flash': 3, 'sun-rise-set': 2}},
  winter: {terms: ['snow', 'cold'], boost: {snowfall: 5}},
  christmas: {terms: ['snow', 'winter', 'celebrate'], boost: {snowfall: 4, 'star-glint': 2}},
  spring: {terms: ['petals', 'flowers', 'bloom'], boost: {'falling-petals': 4, 'petal-bloom': 3, 'sprout-grow': 2}},
  nature: {terms: ['grass', 'flowers', 'birds', 'landscape'], boost: {'grass-field': 2, flock: 2, 'parallax-landscape': 2}},
  calm: {terms: ['ambient', 'slow', 'night', 'stars'], boost: {'starfield-night': 3, aurora: 3, 'grass-field': 2}},
  night: {terms: ['stars', 'moon', 'dark'], boost: {'starfield-night': 3, aurora: 2, 'city-skyline': 2}},
  city: {terms: ['skyline', 'urban', 'night'], boost: {'city-skyline': 5}},
  space: {terms: ['stars', 'planet', 'cosmic', 'tunnel'], boost: {'starfield-night': 3, 'zoom-tunnel': 3, 'science-reticle': 2, 'powers-of-ten': 2}},
  zoom: {terms: ['scale', 'tunnel', 'push'], boost: {'powers-of-ten': 4, 'zoom-tunnel': 4}},
  scale: {terms: ['zoom', 'nested', 'size'], boost: {'powers-of-ten': 4}},
  '3d': {terms: ['three', 'isometric', 'extrude'], boost: {'iso-blocks-3d': 2, 'wireframe-build': 2}},
  mascot: {terms: ['character', 'cute', 'bot'], boost: {'box-bot': 4, 'blob-mascot': 4}},
  character: {terms: ['mascot', 'bot', 'walk'], boost: {'box-bot': 3, 'blob-mascot': 3, 'walker-world-scroll': 2}},
  cute: {terms: ['mascot', 'playful', 'emote'], boost: {'box-bot': 3, 'eyes-blink': 2, 'emote-pop': 2}},
  fun: {terms: ['playful', 'mascot', 'bounce', 'confetti'], boost: {'box-bot': 2, 'bouncing-ball': 2}},
  love: {terms: ['heart'], boost: {'heart-draw-fill': 5}},
  like: {terms: ['heart', 'reaction'], boost: {'heart-draw-fill': 3, 'emote-pop': 3}},
  reaction: {terms: ['emote', 'icon'], boost: {'emote-pop': 5}},
  game: {terms: ['cards', 'play', 'pixel'], boost: {'card-fan': 5, 'pixel-dither': 2}},
  cards: {terms: ['card', 'deal', 'game'], boost: {'card-fan': 5}},
  portfolio: {terms: ['mosaic', 'thumbnails', 'gallery', 'grid'], boost: {'thumbnail-mosaic': 5, 'beat-montage': 3, 'glass-pane-grid': 2}},
  gallery: {terms: ['mosaic', 'thumbnails', 'grid', 'photo'], boost: {'thumbnail-mosaic': 5, 'beat-montage': 3}},
  recap: {terms: ['mosaic', 'montage', 'thumbnails'], boost: {'thumbnail-mosaic': 4, 'beat-montage': 3}},
  energy: {terms: ['electric', 'power', 'lightning'], boost: {'electric-arcs': 5, 'lightning-flash': 2}},
  fire: {terms: ['embers', 'sparks', 'flame'], boost: {embers: 5}},
  magic: {terms: ['sparkle', 'glint', 'embers', 'stars'], boost: {'sparkle-burst': 3, 'star-glint': 3, embers: 2}},
  premium: {terms: ['glint', 'shine', 'cinematic', 'serif'], boost: {'star-glint': 3, 'blur-in-title': 2, 'film-look': 2}},
  luxury: {terms: ['premium', 'glint', 'gold', 'serif'], boost: {'star-glint': 3, embers: 2, 'blur-in-title': 2}},
  slide: {terms: ['title', 'chapter', 'presentation'], boost: {'mask-rise-title': 2, 'chapter-header': 2}},
  presentation: {terms: ['slide', 'title', 'compare', 'chapter'], boost: {'split-compare': 2, 'chapter-header': 2}},
  keynote: {terms: ['presentation', 'title'], boost: {'mask-rise-title': 2}},
  emphasis: {terms: ['impact', 'stamp', 'burst', 'speed'], boost: {'stamp-slam': 3, 'speed-lines': 3, 'comic-burst': 2}},
  impact: {terms: ['slam', 'burst', 'shake'], boost: {'stamp-slam': 4, 'comic-burst': 3, 'speed-lines': 3}},
  overlay: {terms: ['transparent', 'overlay'], boost: {}},
  transparent: {terms: ['overlay'], boost: {}},
  hud: {terms: ['overlay', 'timecode', 'broadcast'], boost: {'hud-chrome': 4}},
  frame: {terms: ['hud', 'chrome', 'overlay'], boost: {'hud-chrome': 3, 'film-look': 2}},
};

const STOP = new Set('a an the and or of for to in on with my our your me we i it is be as at by from that this some something make build create want need show use using into about like look looks looking'.split(' '));

export const stem = (w) => {
  let s = w.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (s.length > 4) s = s.replace(/(ations|ation|ings|ing|ers|er|ies|ed|es|s)$/, (m) => (m === 'ies' ? 'y' : ''));
  return s;
};
const words = (text) => String(text ?? '').toLowerCase().split(/[^a-z0-9-]+/).flatMap((w) => [w, ...w.split('-')]).filter(Boolean);
const stems = (text) => new Set(words(text).map(stem));

const synonymFor = (st) => SYNONYMS[st] ?? Object.entries(SYNONYMS).find(([k]) => k.length >= 4 && (st.startsWith(k) || k.startsWith(st) && st.length >= 4))?.[1];

/** fields of a motion with weights */
const motionFields = (m) => [
  ['id', m.id, 3],
  ['title', m.title, 3],
  ['tags', (m.tags ?? []).join(' '), 2.5],
  ['category', m.category, 2],
  ['use', m.useFor, 2],
  ['description', m.description, 1.4],
  ['mood', (m.mood ?? []).join(' ') + ' ' + (m.roles ?? []).join(' '), 1.2],
];
const recipeFields = (r) => [
  ['id', r.id, 3],
  ['title', r.title, 3],
  ['tags', (r.tags ?? []).join(' '), 2.5],
  ['use', r.useFor, 2.2],
  ['notes', r.notes, 0.8],
  ['motions', recipeMotions(r).join(' '), 0.8],
];

export const recipeMotions = (r) => [...new Set([...(r.layers ?? []), ...(r.scenes ?? []).flatMap((s) => [s, ...(s.layers ?? [])]), ...(r.overlays ?? [])].map((l) => l.motion).filter(Boolean))];

const scoreFields = (fields, terms) => {
  let score = 0;
  const why = [];
  const fieldStems = fields.map(([name, text, w]) => [name, stems(text), w, String(text ?? '').toLowerCase()]);
  for (const {term, weight, from, label} of terms) {
    let best = 0;
    let where = '';
    for (const [name, set, w, raw] of fieldStems) {
      const hit = set.has(term) || (term.length >= 5 && raw.includes(term));
      if (hit && w > best) {
        best = w;
        where = name;
      }
    }
    if (best) {
      score += best * weight;
      why.push(label === from ? `"${from}" in ${where}` : `"${label}" (from "${from}") in ${where}`);
    }
  }
  return {score, why};
};

/**
 * @param brief  free text
 * @param catalog catalog.json entries
 * @param recipes recipe objects
 * @param f filters {overlay, image, text, loop, category, light, recipesOnly, motionsOnly}
 */
export const suggest = (brief, catalog, recipes, f = {}) => {
  const base = words(brief).filter((w) => !STOP.has(w) && w.length > 1).map(stem);
  const terms = [];
  const boosts = {};
  const seen = new Set();
  const addTerm = (term, weight, from) => {
    const t = stem(term);
    if (seen.has(t)) return;
    seen.add(t);
    terms.push({term: t, weight, from, label: term});
  };
  const raw = words(brief).filter((w) => !STOP.has(w) && w.length > 1);
  for (const [i, w] of base.entries()) {
    addTerm(raw[i] ?? w, 1, raw[i] ?? w);
    const syn = synonymFor(w);
    if (syn) {
      for (const t of syn.terms) addTerm(t, 0.6, raw[i] ?? w);
      for (const [id, b] of Object.entries(syn.boost ?? {})) (boosts[id] ??= []).push([b, w]);
    }
  }
  const out = [];
  const wantOverlay = f.overlay || base.some((w) => ['overlay', 'transparent'].includes(w));
  if (!f.recipesOnly) {
    for (const m of catalog) {
      if (m.id === 'mix') continue;
      if (f.overlay && !m.overlay) continue;
      if (f.image && !m.takesImage) continue;
      if (f.text && !m.takesText) continue;
      if (f.loop && !m.loopable) continue;
      if (f.light && m.weight === 'heavy') continue;
      if (f.category && m.category !== f.category) continue;
      const {score, why} = scoreFields(motionFields(m), terms);
      let s = score;
      for (const [b, w] of boosts[m.id] ?? []) {
        s += b * 1.5;
        why.unshift(`fits "${raw[base.indexOf(w)] ?? w}"`);
      }
      if (wantOverlay && m.overlay) s += 2;
      if (s > 0) out.push({kind: 'motion', id: m.id, score: +s.toFixed(1), why: [...new Set(why)].slice(0, 4), entry: m});
    }
  }
  if (!f.motionsOnly && !f.overlay && !f.image && !f.loop && !f.category) {
    for (const r of recipes) {
      const {score, why} = scoreFields(recipeFields(r), terms);
      let s = score;
      for (const [b, w] of boosts[r.id] ?? []) {
        s += b * 1.5;
        why.unshift(`fits "${raw[base.indexOf(w)] ?? w}"`);
      }
      if (f.text && !recipeMotions(r).some((id) => catalog.find((m) => m.id === id)?.takesText)) continue;
      // recipes are already-mixed, richer results: small bonus
      if (s > 0) out.push({kind: 'recipe', id: r.id, score: +(s * 1.15 + 1).toFixed(1), why: [...new Set(why)].slice(0, 4), entry: r});
    }
  }
  out.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return {terms, results: out};
};

/** a ready-to-paste props object: text, image and the first colour props, plus overlay props when asked */
export const propsSnippet = (m, {overlay} = {}) => {
  const p = {};
  for (const k of m.textProps ?? []) p[k] = m.props[k]?.default;
  for (const k of m.imageProps ?? []) p[k] = Array.isArray(m.props[k]?.default) ? ['<public/ path or https URL>'] : '<public/ path or https URL>';
  for (const k of (m.colorProps ?? []).filter((k) => !(overlay && m.overlayProps && k in m.overlayProps)).slice(0, 3)) p[k] = m.props[k]?.default;
  if (overlay && m.overlayProps) Object.assign(p, m.overlayProps);
  return p;
};
