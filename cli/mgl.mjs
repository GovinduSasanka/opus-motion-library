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

const renderOne = async (compId, inputProps, out) => {
  const serveUrl = await serve();
  const puppeteerInstance = await getBrowser();
  const composition = await selectComposition({serveUrl, id: compId, inputProps, puppeteerInstance});
  fs.mkdirSync(path.dirname(out), {recursive: true});
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 18,
    pixelFormat: 'yuv420p',
    audioCodec: 'aac',
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
  if (cmd === 'render') {
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
  console.error(e.message ?? e);
  if (browser) await browser.close({silent: true}).catch(() => {});
  process.exit(1);
});
