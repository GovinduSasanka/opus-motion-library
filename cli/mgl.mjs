#!/usr/bin/env node
/**
 * mgl — Opus Motion Library command line.
 *
 *   node cli/mgl.mjs list [--category text]            list motions
 *   node cli/mgl.mjs info <motion-id>                  props, defaults, source
 *   node cli/mgl.mjs render <motion-id> [options]      render one motion to mp4
 *        --props '{"title":"Hello"}' | --props-file p.json
 *        --format landscape|square|portrait | --size 1920x1080
 *        --frames 150   --fps 30   --out out/x.mp4
 *   node cli/mgl.mjs still <motion-id> [--frame 60 | --at 10,40,80] [options]   one PNG, or a contact sheet
 *   node cli/mgl.mjs compose <spec.json> [--out out/x.mp4]      render a multi-scene video
 *   node cli/mgl.mjs gallery [--only a,b] [--force]                 gallery/<id>.jpg preview strip for every motion
 *
 * Choosing and mixing
 *   node cli/mgl.mjs suggest "<brief>" [--overlay] [--image] [--text] [--loop] [--light] [--category data] [--limit 8] [--json]
 *        rank motions + recipes for a need, with why and a ready props snippet
 *   node cli/mgl.mjs recipes [--json]                                list ready-made mixes (recipes/*.json)
 *   node cli/mgl.mjs recipe <id> [--format …] [--overrides '{"blur-in-title":{"title":"ACME"}}'] [--out out/x.mp4]
 *   node cli/mgl.mjs recipe <id> --preview                           recipes/previews/<id>.jpg (3-frame strip)
 *
 * Using motions in other projects
 *   node cli/mgl.mjs add <motion|recipe ...> --to <host-dir> [--player] [--dir opus-motion] [--public public] [--dry]
 *        copy only the needed source (shadcn-style) + local registry + assets; prints the npm install line
 *   node cli/mgl.mjs export <motion|recipe> --as mp4|webm|webm-alpha|prores-alpha|gif|png|poster [--format …] [--props …] [--frame N] [--out …]
 *        files for non-JS hosts (iOS, Android, Flutter, React Native, video editors, Keynote); alpha exports
 *        render the motion on a transparent background (its overlayProps)
 */
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...x) => path.join(root, ...x);
const [cmd, ...rest] = process.argv.slice(2);

const opts = {};
const pos = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) {
    const k = rest[i].slice(2);
    const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
    opts[k] = v;
  } else pos.push(rest[i]);
}

const FORMATS = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]};
const size = () => {
  if (opts.size) return opts.size.split('x').map(Number);
  return FORMATS[opts.format ?? 'landscape'];
};

const catalog = () => JSON.parse(fs.readFileSync(p('catalog.json'), 'utf8'));

let served;
const serve = async () => {
  if (served) return served;
  process.stdout.write('bundling… ');
  served = await bundle({entryPoint: p('src/index.ts'), publicDir: p('public')});
  console.log('ok');
  return served;
};

let browser;
const getBrowser = async () => (browser ??= await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}}));

const renderOne = async (compId, inputProps, out, media = {codec: 'h264', crf: 18, pixelFormat: 'yuv420p', audioCodec: 'aac'}) => {
  const serveUrl = await serve();
  const puppeteerInstance = await getBrowser();
  const composition = await selectComposition({serveUrl, id: compId, inputProps, puppeteerInstance});
  fs.mkdirSync(path.dirname(out), {recursive: true});
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    ...media,
    inputProps,
    outputLocation: out,
    puppeteerInstance,
    concurrency: Number(opts.concurrency ?? 8),
    chromiumOptions: {gl: 'angle'},
    onProgress: ({progress}) => {
      const pc = Math.floor(progress * 20);
      if (pc !== last) {
        last = pc;
        process.stdout.write(`\r  ${compId} ${Math.round(progress * 100)}%   `);
      }
    },
  });
  console.log(`\n  -> ${path.relative(root, out)}`);
};

const motionProps = () => {
  let props = {};
  if (opts['props-file']) props = JSON.parse(fs.readFileSync(opts['props-file'], 'utf8'));
  if (typeof opts.props === 'string') props = {...props, ...JSON.parse(opts.props)};
  const [width, height] = size();
  return {props, width, height, fps: Number(opts.fps ?? 30), frames: opts.frames ? Number(opts.frames) : undefined};
};

const recipeList = () =>
  fs.existsSync(p('recipes')) ? fs.readdirSync(p('recipes')).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(p('recipes', f), 'utf8'))) : [];
const findRecipe = (id) => recipeList().find((r) => r.id === id);

/** recipe -> Compose spec; --overrides merges props into layers / scenes by motion id */
const recipeSpec = (r) => {
  const [width, height] = opts.size || opts.format ? size() : FORMATS[r.format ?? 'landscape'];
  const ov = typeof opts.overrides === 'string' ? JSON.parse(opts.overrides) : {};
  const apply = (l) => (ov[l.motion] ? {...l, props: {...(l.props ?? {}), ...ov[l.motion]}} : l);
  const scenes = r.scenes
    ? r.scenes.map((s) => ({...apply(s), ...(s.layers ? {layers: s.layers.map(apply)} : {})}))
    : [{layers: r.layers.map(apply), duration: opts.frames ? Number(opts.frames) : r.duration ?? 180}];
  return {width, height, fps: r.fps ?? 30, background: r.background ?? '#000', scenes, overlays: r.overlays};
};

/** three frames side by side (gallery-style strip) */
const strip = async (compId, inputProps, out, ks = [0.2, 0.5, 0.85], each = 480) => {
  const serveUrl = await serve();
  const puppeteerInstance = await getBrowser();
  const composition = await selectComposition({serveUrl, id: compId, inputProps, puppeteerInstance});
  const pngs = [];
  for (const k of ks) {
    const png = out.replace(/[.](png|jpg)$/, `.${k}.png`);
    await renderStill({composition, serveUrl, inputProps, output: png, frame: Math.floor((composition.durationInFrames - 1) * k), puppeteerInstance, chromiumOptions: {gl: 'angle'}});
    pngs.push(png);
  }
  const portrait = composition.height > composition.width;
  const sc = portrait ? `scale=-2:${Math.round(each * 0.75)}` : `scale=${each}:-2`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...pngs.flatMap((x) => ['-i', x]), '-filter_complex', `${pngs.map((_, i) => `[${i}]${sc}[v${i}]`).join(';')};${pngs.map((_, i) => `[v${i}]`).join('')}hstack=inputs=${pngs.length}`, '-q:v', '4', out]);
  pngs.forEach((x) => fs.rmSync(x, {force: true}));
};

const EXPORTS = {mp4: '.mp4', webm: '.webm', 'webm-alpha': '.webm', 'prores-alpha': '.mov', gif: '.gif', png: '', poster: '.png'};

const main = async () => {
  if (!cmd || cmd === 'help') {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    return;
  }
  if (cmd === 'list') {
    const rows = catalog().filter((m) => !opts.category || m.category === opts.category);
    const w = Math.max(...rows.map((r) => r.id.length));
    for (const m of rows) console.log(`${m.id.padEnd(w)}  ${m.category.padEnd(12)} ${m.description}`);
    console.log(`\n${rows.length} motions`);
    return;
  }
  if (cmd === 'info') {
    const m = catalog().find((x) => x.id === pos[0]);
    if (!m) throw new Error(`no motion "${pos[0]}" — run: node cli/mgl.mjs list`);
    console.log(JSON.stringify(m, null, 2));
    return;
  }
  if (cmd === 'suggest') {
    const {suggest, propsSnippet} = await import('./suggest.mjs');
    const brief = pos.join(' ');
    if (!brief) throw new Error('usage: mgl suggest "<what you need>" [--overlay] [--image] [--text] [--loop] [--category c] [--limit n]');
    const {results} = suggest(brief, catalog(), recipeList(), {overlay: opts.overlay, image: opts.image, text: opts.text, loop: opts.loop, light: opts.light, category: opts.category, recipesOnly: opts.recipes, motionsOnly: opts.motions});
    const top = results.slice(0, Number(opts.limit ?? 8));
    if (opts.json) {
      const rows = top.map((r) =>
        r.kind === 'motion'
          ? {kind: r.kind, id: r.id, score: r.score, why: r.why, roles: r.entry.roles, overlay: r.entry.overlay, overlayProps: r.entry.overlayProps, loopable: r.entry.loopable, weight: r.entry.weight, pairsWith: r.entry.pairsWith, props: propsSnippet(r.entry, {overlay: opts.overlay})}
          : {kind: r.kind, id: r.id, score: r.score, why: r.why, format: r.entry.format, title: r.entry.title, motions: (r.entry.layers ?? r.entry.scenes ?? []).map((l) => l.motion ?? 'scene')},
      );
      console.log(JSON.stringify(rows, null, 1));
      return;
    }
    if (!top.length) console.log('no match — try other words, or: node cli/mgl.mjs list');
    for (const r of top) {
      const e = r.entry;
      if (r.kind === 'recipe') {
        const mixOf = (e.layers ?? []).map((l) => l.motion).join(' + ') || `${e.scenes.length} scenes: ` + e.scenes.map((s) => s.motion ?? (s.layers ?? []).map((x) => x.motion).join('+')).join(' → ');
        console.log(`\n★ recipe ${r.id}  (${r.score})  ${e.title} — ${e.format}`);
        console.log(`  why:   ${r.why.join('; ')}`);
        console.log(`  use:   ${e.useFor}`);
        console.log(`  mix:   ${mixOf}`);
        console.log(`  video: node cli/mgl.mjs recipe ${r.id} --overrides '{"<motion-id>":{...props}}'`);
        console.log(`  web:   <MotionBackground recipe="${r.id}">…</MotionBackground>  |  <opus-motion recipe="${r.id}" background>`);
      } else {
        const flags = [e.category, e.overlay && 'overlay', e.loopable && 'loops', e.weight === 'heavy' && 'heavy (3D)'].filter(Boolean).join(', ');
        console.log(`\n• ${r.id}  (${r.score})  [${flags}]  ${e.title}`);
        console.log(`  why:   ${r.why.join('; ')}`);
        console.log(`  use:   ${e.useFor}`);
        if (e.pairsWith?.length) console.log(`  pairs: ${e.pairsWith.join(', ')}`);
        console.log(`  props: ${JSON.stringify(propsSnippet(e, {overlay: opts.overlay}))}`);
      }
    }
    console.log(`\n${results.length} matches (showing ${top.length}). Prefer a ★ recipe, or layer backdrop + subject + type + accent (docs/CHOOSING.md).`);
    return;
  }
  if (cmd === 'recipes') {
    const list = recipeList().filter((r) => !opts.only || String(opts.only).split(',').includes(r.id));
    if (opts.previews) {
      // recipes/previews/<id>.jpg for every recipe from one bundle + browser
      for (const r of list) {
        const out = p('recipes', 'previews', `${r.id}.jpg`);
        fs.mkdirSync(path.dirname(out), {recursive: true});
        await strip('Compose', {spec: recipeSpec(r)}, out);
        console.log(`  preview ${r.id}`);
      }
      if (browser) await browser.close({silent: true});
      return;
    }
    if (opts.json) {
      console.log(JSON.stringify(list.map(({id, title, useFor, format, tags}) => ({id, title, useFor, format, tags})), null, 1));
      return;
    }
    const w = Math.max(...list.map((r) => r.id.length));
    for (const r of list) console.log(`${r.id.padEnd(w)}  ${(r.format ?? 'landscape').padEnd(9)} ${r.title} — ${r.useFor}`);
    console.log(`\n${list.length} recipes (recipes/*.json, previews in recipes/previews/)`);
    return;
  }
  if (cmd === 'add') {
    const {addToHost} = await import('./add.mjs');
    await addToHost({root, ids: pos, to: opts.to, dir: opts.dir ?? 'opus-motion', publicDir: opts.public ?? 'public', player: Boolean(opts.player), dry: Boolean(opts.dry)});
    return;
  }
  if (cmd === 'recipe') {
    const r = findRecipe(pos[0]);
    if (!r) throw new Error(`no recipe "${pos[0]}" — run: node cli/mgl.mjs recipes`);
    const spec = recipeSpec(r);
    if (opts.preview) {
      const out = path.resolve(opts.out ?? p('recipes', 'previews', `${r.id}.jpg`));
      fs.mkdirSync(path.dirname(out), {recursive: true});
      await strip('Compose', {spec}, out);
      console.log(`-> ${path.relative(root, out)}`);
    } else {
      await renderOne('Compose', {spec}, path.resolve(opts.out ?? p('out', 'recipes', `${r.id}.mp4`)));
    }
  } else if (cmd === 'export') {
    const id = pos[0];
    const as = String(opts.as ?? 'mp4');
    if (!(as in EXPORTS)) throw new Error(`--as must be one of ${Object.keys(EXPORTS).join(' | ')}`);
    const r = findRecipe(id);
    const m = catalog().find((x) => x.id === id);
    if (!r && !m) throw new Error(`no motion or recipe "${id}"`);
    const alpha = /alpha/.test(as) || ((as === 'png' || as === 'poster') && opts.transparent);
    let compId;
    let inputProps;
    if (r) {
      compId = 'Compose';
      const spec = recipeSpec(r);
      if (alpha) spec.background = 'transparent';
      inputProps = {spec};
    } else {
      compId = 'Motion';
      const mp = motionProps();
      // alpha formats: put the motion on a transparent background when it can be an overlay
      if (alpha && m.overlayProps) mp.props = {...m.overlayProps, ...mp.props};
      else if (alpha) console.warn(`note: ${id} paints its own background (not overlay-capable), so the alpha channel will be opaque`);
      inputProps = {motion: id, ...mp};
    }
    const out = opts.out ? path.resolve(opts.out) : p('out', 'export', `${id}${opts.format ? '-' + opts.format : ''}${as === 'png' ? '-frames' : ''}${EXPORTS[as]}`);
    if (as === 'mp4') await renderOne(compId, inputProps, out);
    else if (as === 'webm') await renderOne(compId, inputProps, out, {codec: 'vp9', crf: 30});
    else if (as === 'webm-alpha') await renderOne(compId, inputProps, out, {codec: 'vp9', pixelFormat: 'yuva420p', imageFormat: 'png', crf: 30});
    else if (as === 'prores-alpha') await renderOne(compId, inputProps, out, {codec: 'prores', proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png'});
    else if (as === 'gif') await renderOne(compId, inputProps, out, {codec: 'gif', everyNthFrame: Number(opts.every ?? 2), scale: Number(opts.scale ?? 0.5), numberOfGifLoops: 0});
    else {
      const serveUrl = await serve();
      const puppeteerInstance = await getBrowser();
      const composition = await selectComposition({serveUrl, id: compId, inputProps, puppeteerInstance});
      if (as === 'poster') {
        const frame = Math.min(composition.durationInFrames - 1, Number(opts.frame ?? Math.floor(composition.durationInFrames * 0.6)));
        fs.mkdirSync(path.dirname(out), {recursive: true});
        await renderStill({composition, serveUrl, inputProps, output: out, frame, puppeteerInstance, chromiumOptions: {gl: 'angle'}, imageFormat: /\.jpe?g$/.test(out) ? 'jpeg' : 'png'});
      } else {
        const {renderFrames} = await import('@remotion/renderer');
        fs.mkdirSync(out, {recursive: true});
        await renderFrames({composition, serveUrl, inputProps, outputDir: out, imageFormat: 'png', puppeteerInstance, chromiumOptions: {gl: 'angle'}, concurrency: Number(opts.concurrency ?? 4), onStart: () => {}, onFrameUpdate: () => {}});
      }
      console.log(`-> ${path.relative(root, out)}`);
    }
  } else if (cmd === 'render') {
    const id = pos[0];
    const out = opts.out ?? p('out', `${id}.mp4`);
    await renderOne('Motion', {motion: id, ...motionProps()}, path.resolve(out));
  } else if (cmd === 'still') {
    // one frame (--frame N) or a contact sheet of several (--at 10,40,80) from a single bundle
    const id = pos[0];
    const serveUrl = await serve();
    const inputProps = {motion: id, ...motionProps()};
    const puppeteerInstance = await getBrowser();
    const composition = await selectComposition({serveUrl, id: 'Motion', inputProps, puppeteerInstance});
    const frames = opts.at ? String(opts.at).split(',').map(Number) : [Number(opts.frame ?? Math.floor(composition.durationInFrames / 2))];
    const out = path.resolve(opts.out ?? p('out', frames.length > 1 ? `${id}-sheet.jpg` : `${id}.png`));
    fs.mkdirSync(path.dirname(out), {recursive: true});
    const pngs = [];
    for (const f of frames) {
      const png = frames.length > 1 ? out.replace(/[.](png|jpg)$/, `.f${f}.png`) : out;
      await renderStill({composition, serveUrl, inputProps, output: png, frame: Math.min(f, composition.durationInFrames - 1), puppeteerInstance, chromiumOptions: {gl: 'angle'}});
      pngs.push(png);
    }
    if (pngs.length > 1) {
      const cols = Math.min(4, pngs.length);
      const args = ['-v', 'error', '-y'];
      pngs.forEach((x) => args.push('-i', x));
      const scaled = pngs.map((_, i) => `[${i}]scale=640:-2,drawtext=text='f${frames[i]}':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6:fontfile=/Windows/Fonts/arial.ttf[v${i}]`).join(';');
      const rows = Math.ceil(pngs.length / cols);
      const layout = pngs.map((_, i) => `${(i % cols) === 0 ? '0' : Array.from({length: i % cols}, () => 'w0').join('+')}_${Math.floor(i / cols) === 0 ? '0' : Array.from({length: Math.floor(i / cols)}, () => 'h0').join('+')}`).join('|');
      args.push('-filter_complex', `${scaled};${pngs.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${pngs.length}:layout=${layout}:fill=black`, '-frames:v', '1', out);
      if (pngs.length === 1) fs.copyFileSync(pngs[0], out);
      else execFileSync('ffmpeg', args);
      pngs.forEach((x) => fs.rmSync(x, {force: true}));
      void rows;
    }
    console.log(`-> ${path.relative(root, out)}`);
  } else if (cmd === 'compose') {
    const specPath = path.resolve(pos[0]);
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    const out = opts.out ?? p('out', path.basename(specPath).replace(/\.json$/, '.mp4'));
    await renderOne('Compose', {spec}, path.resolve(out));
  } else if (cmd === 'gallery') {
    // gallery/<id>.jpg: three frames (25 / 55 / 85 %) side by side, from one bundle and one browser
    const rows = catalog().filter((m) => !opts.only || String(opts.only).split(',').includes(m.id));
    const dir = p('gallery');
    fs.mkdirSync(dir, {recursive: true});
    const serveUrl = await serve();
    const puppeteerInstance = await getBrowser();
    const [width, height] = size();
    for (const m of rows) {
      const jpg = path.join(dir, `${m.id}.jpg`);
      if (fs.existsSync(jpg) && !opts.force) continue;
      const inputProps = {motion: m.id, props: {}, width, height, fps: 30};
      const composition = await selectComposition({serveUrl, id: 'Motion', inputProps, puppeteerInstance});
      const pngs = [];
      for (const k of [0.25, 0.55, 0.85]) {
        const png = path.join(dir, `${m.id}.${k}.png`);
        await renderStill({composition, serveUrl, inputProps, output: png, frame: Math.floor((composition.durationInFrames - 1) * k), puppeteerInstance, chromiumOptions: {gl: 'angle'}});
        pngs.push(png);
      }
      execFileSync('ffmpeg', ['-v', 'error', '-y', ...pngs.flatMap((x) => ['-i', x]), '-filter_complex', '[0]scale=480:-2[a];[1]scale=480:-2[b];[2]scale=480:-2[c];[a][b][c]hstack=inputs=3', '-q:v', '4', jpg]);
      pngs.forEach((x) => fs.rmSync(x, {force: true}));
      console.log(`  gallery ${m.id}`);
    }
    console.log(`gallery: ${rows.length} motions in gallery/`);
  } else {
    throw new Error(`unknown command ${cmd}`);
  }
  if (browser) await browser.close({silent: true});
};

main().catch(async (e) => {
  console.error(e?.stack ?? e?.message ?? e);
  if (browser) await browser.close({silent: true}).catch(() => {});
  process.exit(1);
});
