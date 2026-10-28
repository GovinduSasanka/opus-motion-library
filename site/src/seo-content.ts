/*
 * Copy and data helpers shared by the React app (src/) and the build-time prerenderer (prerender/).
 * Pure TypeScript, no imports from the app — esbuild bundles this file for Node.
 * Every number comes from a Totals object computed from catalog.json / styles.json / transitions.json / recipes at build time.
 */

export const REPO_URL = 'https://github.com/GovinduSasanka/opus-motion-library';
export const REPO_API = 'https://api.github.com/repos/GovinduSasanka/opus-motion-library';
export const SITE_NAME = 'Opus Motion Library';

export interface Totals {
  motions: number;
  styles: number;
  transitions: number;
  recipes: number;
  categories: number;
}

export const HEADLINE = "The world's largest open-source motion graphics library";
export const TITLE_TAG = "World's Largest Open-Source Motion Graphics Library | Opus Motion";

export const subline = (t: Totals) => `${t.motions} motions · ${t.styles} styles · ${t.transitions} transitions · ${t.recipes} recipes`;

export const lede = (t: Totals) =>
  `${t.motions} free, MIT-licensed motion graphics for Remotion, React and plain HTML — lower thirds, animated charts, kinetic type, backdrops, 3D and more. Pick one by name, change the words and colours, render a video or play it live in your site.`;

export const metaDescription = (t: Totals) =>
  `The world's largest open-source motion graphics library: ${t.motions} Remotion & React animation templates, ${t.transitions} transitions, ${t.recipes} recipes. Free, MIT, AI-agent ready.`;

export const KEYWORDS = [
  'motion graphics library',
  'open source motion graphics',
  'Remotion templates',
  'React animation components',
  'free motion graphics',
  'animated charts',
  'lower thirds',
  'video transitions',
  'AI agent video',
  'MCP',
  'kinetic typography',
  'animated backgrounds',
  'three.js animation',
  'After Effects alternative',
];

// ---------------------------------------------------------------- categories

export interface CategoryInfo {
  /** short chip label */
  label: string;
  /** page heading */
  title: string;
  /** singular noun for titles: "<Motion> — free <noun> for Remotion & React" */
  noun: string;
  /** 1–2 sentences for the category page intro + meta description */
  blurb: string;
}

export const CATEGORY_INFO: Record<string, CategoryInfo> = {
  text: {label: 'Type', title: 'Text animations & kinetic typography', noun: 'text animation', blurb: 'Title cards, lower thirds, kinetic typography, captions, quote cards and countdowns — animated text you can set in your own words, fonts and colours.'},
  shape: {label: 'Shapes', title: 'Shape & geometric animations', noun: 'shape animation', blurb: 'Morphing blobs, patterns, grids, paths and abstract geometry for backgrounds, loaders and accents — vector animations that stay sharp at any resolution.'},
  fx: {label: 'FX', title: 'Visual effects & particles', noun: 'visual effect', blurb: 'Particles, glitches, light leaks, confetti, fire, smoke and screen effects to layer over footage or on a transparent background.'},
  environment: {label: 'Worlds', title: 'Animated worlds & backdrops', noun: 'animated background', blurb: 'Weather, landscapes, skies, oceans, cities and abstract scenes that run as living video backgrounds for hero sections, intros and explainers.'},
  character: {label: 'Characters', title: 'Animated characters', noun: 'character animation', blurb: 'Rigged and procedural characters, crowds and creatures that blink, walk, react and speak — for explainers, stories and UI delight.'},
  data: {label: 'Data', title: 'Animated charts & data visualisation', noun: 'animated chart', blurb: 'Animated bar, line, pie and area charts, counters, dashboards, maps of numbers and infographics that count up and draw themselves from your data.'},
  ui: {label: 'UI', title: 'UI & product mockup animations', noun: 'UI animation', blurb: 'Browser, phone and app mockups, chat bubbles, notifications, cursors and interface flows for product videos, launch pages and app-store previews.'},
  hud: {label: 'HUD', title: 'HUD & sci-fi interface graphics', noun: 'HUD graphic', blurb: 'Heads-up displays, radar sweeps, telemetry, scanning lines and futuristic overlays for tech trailers, games and cinematic titles.'},
  image: {label: 'Image looks', title: 'Image looks & photo effects', noun: 'image effect', blurb: 'Ken Burns moves, duotones, halftones, reveals and painterly looks that turn your own photos into motion.'},
  '3d': {label: '3D', title: '3D motion graphics (three.js)', noun: '3D motion graphic', blurb: 'Real 3D scenes built on three.js and React Three Fiber: extruded text, floating devices, isometric builds and camera flythroughs.'},
  transition: {label: 'Transitions', title: 'Video transitions', noun: 'video transition', blurb: 'Scene-to-scene transitions and transition reels you can chain between any two shots.'},
  game: {label: 'Game & sports', title: 'Game & sports graphics', noun: 'game graphic', blurb: 'Scoreboards, leaderboards, lineups, countdowns and match stats for esports, sports and game trailers.'},
  music: {label: 'Music', title: 'Music visualisers & audio graphics', noun: 'music visualizer', blurb: 'Waveforms, spectrum bars, lyric reveals and beat-synced graphics for music videos, podcasts and audiograms.'},
  document: {label: 'Documents', title: 'Document, form & report animations', noun: 'document animation', blurb: 'Animated pages, forms, receipts, contracts and reports that fill in, stamp and sign themselves.'},
  map: {label: 'Maps', title: 'Animated maps & geo graphics', noun: 'animated map', blurb: 'Route lines, pins, regions and globe-style maps that draw themselves for travel, logistics and news stories.'},
  mascot: {label: 'Mascots', title: 'Mascots & brand characters', noun: 'mascot animation', blurb: 'Friendly brand mascots with expressions and idle loops for onboarding, empty states and kids content.'},
  product: {label: 'Product', title: 'Product & e-commerce animations', noun: 'product animation', blurb: 'Price tags, sale badges, product reveals, carousels and cart moments for shops, ads and social promos.'},
  camera: {label: 'Camera', title: 'Camera moves & lens effects', noun: 'camera effect', blurb: 'Dolly, whip-pan, shake, focus-pull and lens looks that add a virtual camera to flat graphics.'},
  texture: {label: 'Textures', title: 'Animated textures & surface looks', noun: 'animated texture', blurb: 'Grain, paper, noise and shader surfaces that make a flat layer feel tactile.'},
};

export const CATEGORY_ORDER = ['text', 'shape', 'environment', 'fx', 'character', 'data', 'ui', 'hud', 'image', '3d', 'game', 'music', 'product', 'document', 'map', 'mascot', 'camera', 'texture', 'transition'];

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const categoryInfo = (id: string): CategoryInfo =>
  CATEGORY_INFO[id] ?? {label: titleCase(id), title: `${titleCase(id)} motion graphics`, noun: `${id} animation`, blurb: `${titleCase(id)} motion graphics for Remotion, React and plain HTML.`};

export const CATEGORY_LABEL: Record<string, string> = new Proxy({} as Record<string, string>, {
  get: (_t, id: string) => categoryInfo(String(id)).label,
});

/** known categories first (in CATEGORY_ORDER), then any new ones alphabetically */
export const orderCategories = (ids: Iterable<string>): string[] => {
  const set = new Set(ids);
  const known = CATEGORY_ORDER.filter((c) => set.has(c));
  const rest = [...set].filter((c) => !CATEGORY_ORDER.includes(c)).sort();
  return [...known, ...rest];
};

// ---------------------------------------------------------------- FAQ (visible on the landing page and in its JSON-LD)

export const faq = (t: Totals): {q: string; a: string}[] => [
  {
    q: 'What is the Opus Motion Library?',
    a: `An open-source collection of ${t.motions} parameterised motion graphics, ${t.styles} one-line visual styles, ${t.transitions} transitions and ${t.recipes} ready-made recipes. Every motion is a Remotion + React component: you pick it by name, change its words, colours and images, then render an mp4 or play it live in a website or app.`,
  },
  {
    q: 'Is it really the largest open-source motion graphics library?',
    a: `With ${t.motions} motions, ${t.styles} styles, ${t.transitions} transitions and ${t.recipes} recipes in a single MIT-licensed repository, it is the largest open-source collection of ready-to-use, code-driven motion graphics we know of — and it grows with every release. The counts on this page are read from the repository when the site is built.`,
  },
  {
    q: 'Is it free for commercial use?',
    a: 'The library code is released under the MIT licence, so you can use it in personal and commercial projects. Remotion itself is source-available and has its own licence for companies — see remotion.dev/license.',
  },
  {
    q: 'How do I use these as Remotion templates or React animation components?',
    a: 'In Remotion, run `mgl add <motion>` to copy a motion into your project, or render it directly with `mgl render`. In React and Next.js, import `MotionPlayer` or `MotionBackground` from `opus-motion-library/web`. In plain HTML or WordPress, drop in the `<opus-motion>` custom element — no build step.',
  },
  {
    q: 'Can an AI agent use it to make videos? Is there an MCP server?',
    a: 'Yes. The repository ships AGENTS.md, a measured catalog.json, a `mgl suggest` command that ranks motions for a brief, and an MCP server so Claude, Codex, Cursor and other agents can search, preview, render and integrate motions for you.',
  },
  {
    q: 'Does it include lower thirds, animated charts and video transitions?',
    a: `Yes — lower thirds and kinetic typography, animated bar, line and pie charts with counters, ${t.transitions} scene transitions, animated backgrounds, characters, HUDs, UI mockups and 3D scenes, in 16:9, 1:1 and 9:16.`,
  },
  {
    q: 'Can I use the motions outside Remotion — in an app or a video editor?',
    a: 'Yes. Export any motion as mp4, WebM with alpha, ProRes 4444, GIF or PNG for iOS, Android, Flutter, Premiere, Final Cut or DaVinci Resolve, or play it live on the web with the lightweight player.',
  },
];

// ---------------------------------------------------------------- docs list (Docs page + /docs/ static page)

export interface DocItem {
  tag: string;
  title: string;
  text: string;
  url: string;
}

export const docsList = (t: Totals): DocItem[] => {
  const REPO = REPO_URL;
  const BLOB = `${REPO}/blob/main`;
  return [
    {tag: 'Start', title: 'README', text: 'What the library is, quick start, compose specs, narrated storyboards, layout.', url: `${REPO}#readme`},
    {tag: 'Start', title: 'Quick start', text: 'Install, list, info, render, still, studio — the first ten minutes.', url: `${REPO}#quickstart`},
    {tag: 'Agents', title: 'AGENTS.md', text: 'For the AI agent doing the work: choose, make it the host’s own, performance rules, anti-patterns.', url: `${BLOB}/AGENTS.md`},
    {tag: 'Agents', title: 'Use it from your AI agent', text: 'What to paste into Claude, Codex or Cursor, and what the agent does with it.', url: `${REPO}#use-it-from-your-ai-agent`},
    {tag: 'Agents', title: 'MCP server', text: 'Search, preview, render and integrate motions from any MCP client.', url: `${REPO}#use-from-ai-agents-mcp`},
    {tag: 'Choose', title: 'Choosing motions', text: 'Goal → motions, recipes and pairings: hero, numbers, story, celebrate, ambient, product UI…', url: `${BLOB}/docs/CHOOSING.md`},
    {tag: 'Integrate', title: 'Integration guide', text: 'Remotion, Next.js, Vite/React, plain HTML & WordPress, native apps and video editors, step by step.', url: `${BLOB}/docs/INTEGRATION.md`},
    {tag: 'Reference', title: 'Catalog', text: 'Every motion with its props, defaults, roles, overlay, loop, mood and weight.', url: `${BLOB}/docs/CATALOG.md`},
    {tag: 'Reference', title: 'Transitions', text: `All ${t.transitions} transitions (types and variants) with fields and recommended lengths.`, url: `${BLOB}/docs/TRANSITIONS.md`},
    {tag: 'Reference', title: 'Styles', text: `${t.styles} one-line visual styles: palette, fonts and rules for restyling any scene.`, url: `${BLOB}/docs/STYLES.md`},
    {tag: 'Video', title: 'Mix motions', text: 'Layer several motions into one shot, or chain scenes with transitions, overlays, captions and music.', url: `${REPO}#mix-motions`},
    {tag: 'Video', title: 'Narrated storyboards', text: 'Storyboard → local TTS voice, word-timed captions, beat-snapped cuts, mastered mix.', url: `${REPO}#make-a-narrated-video`},
    {tag: 'Web', title: 'Use it on the web', text: 'MotionPlayer, MotionBackground and the <opus-motion> element in React, Next.js and plain HTML.', url: `${REPO}#in-a-react--nextjs-site`},
    {tag: 'Reference', title: 'Motion catalogue', text: 'The live catalogue table in the README: every motion by family, with what it is for.', url: `${REPO}#motion-catalogue`},
    {tag: 'Contribute', title: 'Contributing', text: 'How to propose a motion, report a bug and open a pull request.', url: `${BLOB}/CONTRIBUTING.md`},
    {tag: 'Contribute', title: 'Authoring a motion', text: 'The conventions every motion follows: u-units, measured easing, seeded noise, three formats.', url: `${BLOB}/docs/AUTHORING.md`},
    {tag: 'Background', title: 'How it works', text: `Reference films, MIT motion repos and a prompt corpus → ${t.motions} generalised motions and ${t.styles} styles.`, url: `${REPO}#how-it-works`},
  ];
};

// ---------------------------------------------------------------- transitions table (docs/TRANSITIONS.md + transitions.json)

export interface TransitionInfo {
  key: string; // "type" or "type:variant"
  type: string;
  variant?: string;
  looks: string;
  source: string;
  fields: string;
  frames: number;
}

const stripMd = (s: string) => s.replace(/`/g, '').replace(/\*\*/g, '').trim();

export const parseTransitions = (md: string, frames: Record<string, number>): TransitionInfo[] => {
  const rows = new Map<string, {looks: string; source: string; fields: string}>();
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^\|\s*`([a-z-]+)`(?:\s*\(`([a-z-]+)`[^)]*\))?\s*\|(.+)$/);
    if (!m) continue;
    const cells = m[3].split('|').map((c) => c.trim());
    if (cells.length < 4) continue;
    const key = m[2] ? `${m[1]}:${m[2]}` : m[1];
    rows.set(key, {looks: stripMd(cells[0]), source: stripMd(cells[1]), fields: stripMd(cells[2])});
  }
  return Object.keys(frames)
    .filter((k) => k !== 'cut')
    .map((key) => {
      const [type, variant] = key.split(':');
      const r = rows.get(key);
      return {key, type, variant, looks: r?.looks ?? '', source: r?.source ?? '', fields: r?.fields ?? '', frames: frames[key]};
    });
};

/** URL slug for a transition key, "iris:bloom" -> "iris-bloom" */
export const transitionSlug = (key: string) => key.replace(':', '-');
