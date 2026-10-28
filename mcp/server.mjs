#!/usr/bin/env node
/**
 * Opus Motion MCP server — lets any MCP client (Claude Desktop, Claude Code, Cursor, Windsurf, Codex…) search,
 * preview, style, render and integrate the library's motions directly.
 *
 *   claude mcp add opus-motion -- node /path/to/opus-motion-library/mcp/server.mjs
 *   or in a client config: {"mcpServers": {"opus-motion": {"command": "node", "args": ["/path/to/mcp/server.mjs"]}}}
 *
 * Tools: search_motions, list_motions, get_motion, list_styles, get_style, list_recipes, get_recipe,
 * preview (returns a contact-sheet image), render (mp4), export (webm-alpha/prores/gif/png…),
 * add_to_project (copy source into a host project), integration_guide.
 * Rendering needs the repo's npm dependencies installed (npm install) and FFmpeg on PATH.
 */
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const catalog = () => read('catalog.json');
const styleList = () => (fs.existsSync(path.join(root, 'styles.json')) ? read('styles.json') : []);
const recipeDir = path.join(root, 'recipes');
const recipeList = () => fs.readdirSync(recipeDir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(recipeDir, f), 'utf8')));
const FORMATS = ['landscape', 'square', 'portrait'];
const outDir = path.join(root, 'out', 'mcp');
fs.mkdirSync(outDir, {recursive: true});

/** run the CLI, collect output; never write to stdout (that is the MCP channel) */
const mgl = (args, timeoutMs = 20 * 60 * 1000) =>
  new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(root, 'cli', 'mgl.mjs'), ...args], {cwd: root, windowsHide: true});
    let out = '';
    let err = '';
    const t = setTimeout(() => {
      p.kill();
      reject(new Error('render timed out'));
    }, timeoutMs);
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) resolve(out);
      else reject(new Error((err || out).split('\n').filter((l) => l.trim()).slice(-6).join('\n')));
    });
  });

const text = (t) => ({content: [{type: 'text', text: typeof t === 'string' ? t : JSON.stringify(t, null, 1)}]});
const slug = (s) => String(s).replace(/[^a-z0-9-]+/gi, '-').slice(0, 40);
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

/** turn {motion | recipe | layers | spec} into args for `mgl` */
const target = async ({motion, recipe, layers, spec, props, style, format, frames}) => {
  const fmt = ['--format', FORMATS.includes(format) ? format : 'landscape'];
  if (motion) return {kind: 'motion', id: motion, args: [motion, ...fmt, ...(props ? ['--props', JSON.stringify(props)] : []), ...(style ? ['--style', style] : []), ...(frames ? ['--frames', String(frames)] : [])]};
  let s = spec;
  if (recipe) {
    const r = recipeList().find((x) => x.id === recipe);
    if (!r) throw new Error(`unknown recipe "${recipe}" — call list_recipes`);
    s = r.scenes ? {scenes: r.scenes, overlays: r.overlays} : {scenes: [{layers: r.layers, duration: r.duration ?? frames ?? 180}], overlays: r.overlays};
    if (r.style) s.style = r.style;
  }
  if (layers) s = {scenes: [{layers, duration: frames ?? 180}]};
  if (!s) throw new Error('give one of: motion, recipe, layers, spec');
  const dims = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[FORMATS.includes(format) ? format : 'landscape'];
  s = {width: dims[0], height: dims[1], fps: 30, ...s, ...(style ? {style} : {})};
  const f = path.join(os.tmpdir(), `opus-motion-spec-${stamp()}-${Math.random().toString(36).slice(2, 7)}.json`);
  fs.writeFileSync(f, JSON.stringify(s));
  return {kind: 'spec', id: recipe ?? 'mix', specPath: f, spec: s};
};

const server = new McpServer({name: 'opus-motion', version: '1.2.0'});

const targetShape = {
  motion: z.string().optional().describe('motion id (see search_motions / list_motions)'),
  recipe: z.string().optional().describe('recipe id: a tested mix of motions (see list_recipes)'),
  layers: z.array(z.record(z.any())).optional().describe('mix: [{motion, props?, from?, duration?, opacity?, blend?, style?}] bottom to top'),
  spec: z.record(z.any()).optional().describe('full Compose spec: {scenes:[{motion|layers, props, duration, transition}], overlays, style}'),
  props: z.record(z.any()).optional().describe('props for `motion` (see get_motion for every prop and default)'),
  style: z.string().optional().describe('visual style id applied to everything (see list_styles), e.g. woodcut, risograph, blueprint'),
  format: z.enum(['landscape', 'square', 'portrait']).optional().describe('16:9 (default), 1:1 or 9:16'),
  frames: z.number().int().positive().optional().describe('length in frames at 30 fps'),
};

server.tool(
  'search_motions',
  'Find the best motions and recipes for a brief, in plain words ("dark hero for a launch with stats", "celebration after checkout"). Returns ranked ids with reasons and ready props. Always call this before choosing.',
  {
    brief: z.string(),
    overlay: z.boolean().optional().describe('only motions that render on a transparent background (to sit on top of other content)'),
    image: z.boolean().optional().describe('only motions that take the user’s image'),
    text: z.boolean().optional().describe('only motions that show the user’s text'),
    loop: z.boolean().optional(),
    light: z.boolean().optional().describe('skip heavy 3D motions'),
    category: z.string().optional(),
    limit: z.number().int().optional(),
  },
  async (a) => {
    const args = ['suggest', a.brief, '--json', '--limit', String(a.limit ?? 10)];
    for (const k of ['overlay', 'image', 'text', 'loop', 'light']) if (a[k]) args.push(`--${k}`);
    if (a.category) args.push('--category', a.category);
    const out = await mgl(args, 120000);
    const styles = styleList()
      .map((s) => ({id: s.id, name: s.name, score: a.brief.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && (s.tags.join(' ') + ' ' + s.description + ' ' + s.useFor).toLowerCase().includes(w)).length}))
      .filter((s) => s.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, 5);
    return text(`${out.trim()}\n\nstyles that fit: ${JSON.stringify(styles)}`);
  },
);

server.tool('list_motions', 'Compact list of every motion (id, category, one-line description). Filter by category.', {category: z.string().optional()}, async ({category}) =>
  text(catalog().filter((m) => !category || m.category === category).map((m) => `${m.id} [${m.category}${m.overlay ? ', overlay' : ''}${m.takesImage ? ', image' : ''}] — ${m.description}`).join('\n')),
);

server.tool('get_motion', 'Everything about one motion: props with defaults and docs, which props hold text / colours / images, overlay props, roles, pairs-with, length.', {id: z.string()}, async ({id}) => {
  const m = catalog().find((x) => x.id === id);
  if (!m) throw new Error(`unknown motion "${id}"`);
  return text(m);
});

server.tool('list_styles', 'Visual styles that restyle ANY motion (woodcut, risograph, ink wash, blueprint, pixel, neon noir…).', {family: z.string().optional()}, async ({family}) =>
  text(styleList().filter((s) => !family || s.family === family).map((s) => `${s.id} [${s.family}] — ${s.description} Use for: ${s.useFor}`).join('\n')),
);

server.tool('get_style', 'Palette, fonts, timing and description of one style.', {id: z.string()}, async ({id}) => {
  const s = styleList().find((x) => x.id === id);
  if (!s) throw new Error(`unknown style "${id}"`);
  return text(s);
});

server.tool('list_recipes', 'Ready-made, previewed mixes (hero backgrounds, launch intro, stats, testimonial, loader, success state, social short…).', {}, async () =>
  text(recipeList().map((r) => `${r.id} (${r.format ?? 'landscape'}) — ${r.title}: ${r.useFor ?? ''}`).join('\n')),
);

server.tool('get_recipe', 'The full layer stack / scene list of a recipe, to customise.', {id: z.string()}, async ({id}) => {
  const r = recipeList().find((x) => x.id === id);
  if (!r) throw new Error(`unknown recipe "${id}"`);
  return text(r);
});

server.tool(
  'preview',
  'Render still frames (a contact sheet) of a motion, recipe, mix or spec and return the image, so you can SEE the result before rendering video. Use it to check text fits, colours, clutter.',
  {...targetShape, at: z.array(z.number().int()).optional().describe('frames to show, default 4 across the motion')},
  async (a) => {
    const t = await target(a);
    const file = path.join(outDir, `${stamp()}-${slug(t.id)}-preview.jpg`);
    if (t.kind === 'motion') {
      const m = catalog().find((x) => x.id === a.motion);
      const d = a.frames ?? m?.durationInFrames ?? 150;
      const at = a.at ?? [0.15, 0.4, 0.65, 0.9].map((k) => Math.floor(d * k));
      await mgl(['still', ...t.args, '--at', at.join(','), '--out', file]);
    } else {
      const total = t.spec.scenes.reduce((s, x) => s + (x.duration ?? 150), 0);
      const at = a.at ?? [0.15, 0.4, 0.65, 0.9].map((k) => Math.floor(total * k));
      const spec = {...t.spec, scenes: [{layers: [], duration: 1}]};
      void spec;
      // render the spec's frames through the mix host by turning it into a single-scene compose still
      await mgl(['still', 'mix', '--props', JSON.stringify({layers: t.spec.scenes[0].layers ?? [{motion: t.spec.scenes[0].motion, props: t.spec.scenes[0].props}]}), ...(a.style ? ['--style', a.style] : []), '--format', a.format ?? 'landscape', '--frames', String(total), '--at', at.join(','), '--out', file]);
    }
    const data = fs.readFileSync(file).toString('base64');
    return {content: [{type: 'image', data, mimeType: 'image/jpeg'}, {type: 'text', text: `saved ${file}`}]};
  },
);

server.tool(
  'render',
  'Render an MP4 of a motion, recipe, layered mix or full Compose spec (with transitions, overlays, captions, music). Returns the file path. Takes ~10–60 s per 10 s of video.',
  {...targetShape, out: z.string().optional().describe('output .mp4 path (default out/mcp/…)')},
  async (a) => {
    const t = await target(a);
    const file = path.resolve(a.out ?? path.join(outDir, `${stamp()}-${slug(t.id)}.mp4`));
    if (t.kind === 'motion') await mgl(['render', ...t.args, '--concurrency', '4', '--out', file]);
    else await mgl(['compose', t.specPath, '--concurrency', '4', '--out', file]);
    return text(`rendered ${file}`);
  },
);

server.tool(
  'export',
  'Export a motion as a file for apps, editors and slides: mp4, webm, webm-alpha (transparent), prores-alpha (transparent, editors), gif, png (sequence) or poster (one frame).',
  {motion: z.string(), as: z.enum(['mp4', 'webm', 'webm-alpha', 'prores-alpha', 'gif', 'png', 'poster']), props: z.record(z.any()).optional(), format: z.enum(['landscape', 'square', 'portrait']).optional(), out: z.string().optional()},
  async (a) => {
    const args = ['export', a.motion, '--as', a.as, '--format', a.format ?? 'landscape'];
    if (a.props) args.push('--props', JSON.stringify(a.props));
    if (a.out) args.push('--out', path.resolve(a.out));
    return text(await mgl(args));
  },
);

server.tool(
  'add_to_project',
  'Copy only the source a host project needs (motions or recipes, with their helpers and assets) into <dir>/opus-motion/, and return the npm install line and a usage snippet. Use for Remotion, React, Next.js and Vite projects.',
  {ids: z.array(z.string()).describe('motion and/or recipe ids'), dir: z.string().describe('host project folder, e.g. /path/to/app/src'), player: z.boolean().optional().describe('also copy the web MotionPlayer for React/Next.js sites')},
  async (a) => text(await mgl(['add', ...a.ids, '--to', path.resolve(a.dir), ...(a.player ? ['--player'] : [])])),
);

server.tool(
  'integration_guide',
  'Step-by-step integration instructions for a stack: remotion, nextjs, react, vite, html, wordpress, vue, svelte, react-native, flutter, ios, android, keynote, premiere.',
  {stack: z.string()},
  async ({stack}) => {
    const doc = fs.readFileSync(path.join(root, 'docs', 'INTEGRATION.md'), 'utf8');
    const parts = doc.split(/\n(?=## )/);
    const key = stack.toLowerCase().replace(/[^a-z]/g, '');
    const hit = parts.filter((p) => p.split('\n')[0].toLowerCase().replace(/[^a-z]/g, '').includes(key) || (key === 'react' && /vite|cra/i.test(p.split('\n')[0])) || (/native|flutter|ios|android/.test(key) && /native/i.test(p.split('\n')[0])) || (/wordpress|vue|svelte|html/.test(key) && /html/i.test(p.split('\n')[0])));
    return text((hit.length ? hit : parts.slice(0, 2)).join('\n'));
  },
);

server.resource('agents-guide', 'opus-motion://AGENTS.md', async (uri) => ({contents: [{uri: uri.href, text: fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')}]}));
server.resource('choosing-guide', 'opus-motion://docs/CHOOSING.md', async (uri) => ({contents: [{uri: uri.href, text: fs.readFileSync(path.join(root, 'docs', 'CHOOSING.md'), 'utf8')}]}));

await server.connect(new StdioServerTransport());
