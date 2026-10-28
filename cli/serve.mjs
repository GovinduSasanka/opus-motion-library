#!/usr/bin/env node
/**
 * mgl serve — a small HTTP render + catalog server so any website, editor, backend or agent can use the library
 * over plain HTTP (JSON in, mp4 / webm / prores / gif / png out). Node built-ins + the Remotion renderer only.
 *
 *   node cli/mgl.mjs serve [--port 4321] [--host 127.0.0.1]      (or: node cli/serve.mjs …, npm run serve)
 *
 * Options
 *   --port N            default 4321 (env PORT)
 *   --host H            default 127.0.0.1 (local only). Use 0.0.0.0 in Docker / behind a proxy (env HOST)
 *   --token T           require "Authorization: Bearer T" (or ?token=T) on every /api route (env MGL_SERVE_TOKEN).
 *                       No token is built in: unset means open, which is fine on 127.0.0.1 only
 *   --cors-origin O     Access-Control-Allow-Origin value, default * (set your editor's origin when hosting)
 *   --concurrency N     frames rendered in parallel per job (default min(4, CPUs))
 *   --gl angle|swangle|egl|vulkan   Chrome GL backend (default angle; swangle in Docker without a GPU)
 *   --max-frames N      reject longer renders (default 9000 = 5 min at 30 fps)
 *   --max-queue N       queued + running jobs allowed (default 50)
 *   --ttl MIN           delete finished files after MIN minutes (default 60)
 *   --out DIR           where renders are written (default out/serve)
 *   --no-warm           bundle on the first render instead of at start-up
 *   --allow-shutdown    enable POST /api/shutdown (for supervisors and tests)
 *
 * Routes (JSON unless noted; full reference: docs/HTTP_API.md)
 *   GET  /api/health
 *   GET  /api/motions[?category=&q=&overlay=1&loopable=1&weight=light&full=1&limit=&offset=]   catalog (+ props schema with full=1)
 *   GET  /api/motions/:id            catalog entry + props JSON Schema + preview url
 *   GET  /api/motions/:id/schema     props JSON Schema only
 *   GET  /api/motions/:id/preview    gallery jpg (3 frames)          GET /api/recipes/:id/preview
 *   GET  /api/schema                 every props schema               GET /api/render-schema   POST /api/render body schema
 *   GET  /api/suggest?q=<brief>[&overlay=1&image=1&text=1&loop=1&light=1&category=&limit=]
 *   GET  /api/styles[?family=&full=1]   GET /api/styles/:id   GET /api/recipes   GET /api/recipes/:id   GET /api/transitions
 *   POST /api/render[?wait=1]        {motion|recipe|layers|spec, props, overrides, style, format, aspect, width, height, fps, frames, quality}
 *   GET  /api/jobs                   GET /api/jobs/:id   DELETE /api/jobs/:id (cancel)   GET /api/jobs/:id/file
 *   GET  /assets/<path>              the library's public/ folder (images the motions load; use as asset-base)
 *   GET  /dist/<path>                built web files (opus-motion.element.js) when `npm run build:lib` was run
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {motionSchema, renderRequestSchema} from './schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FORMATS = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]};
const OUTPUTS = {
  mp4: {ext: '.mp4', mime: 'video/mp4'},
  webm: {ext: '.webm', mime: 'video/webm'},
  'webm-alpha': {ext: '.webm', mime: 'video/webm', alpha: true},
  'prores-alpha': {ext: '.mov', mime: 'video/quicktime', alpha: true},
  gif: {ext: '.gif', mime: 'image/gif'},
  poster: {ext: '.png', mime: 'image/png', still: true},
};
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.map': 'application/json'};

const parseArgs = (argv) => {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const k = argv[i].slice(2);
    o[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return o;
};

export async function startServer({root, opts = {}} = {}) {
  root ??= path.resolve(here, '..');
  const o = opts;
  const host = String(o.host ?? process.env.HOST ?? '127.0.0.1');
  const port = Number(o.port ?? process.env.PORT ?? 4321);
  const token = typeof o.token === 'string' ? o.token : process.env.MGL_SERVE_TOKEN || '';
  const corsOrigin = typeof o['cors-origin'] === 'string' ? o['cors-origin'] : '*';
  const concurrency = Number(o.concurrency ?? Math.min(4, os.cpus().length));
  const gl = typeof o.gl === 'string' ? o.gl : 'angle';
  const maxFrames = Number(o['max-frames'] ?? 9000);
  const maxQueue = Number(o['max-queue'] ?? 50);
  const ttlMs = Number(o.ttl ?? 60) * 60_000;
  const outDir = path.resolve(root, typeof o.out === 'string' ? o.out : path.join('out', 'serve'));
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(host);
  const p = (...x) => path.join(root, ...x);
  fs.mkdirSync(outDir, {recursive: true});

  // ------------------------------------------------------------------------------------------------ data (reloaded when the file changes)
  const cache = new Map();
  const load = (file, fallback) => {
    const f = p(file);
    if (!fs.existsSync(f)) return fallback;
    const m = fs.statSync(f).mtimeMs;
    const hit = cache.get(file);
    if (hit && hit.m === m) return hit.v;
    const v = JSON.parse(fs.readFileSync(f, 'utf8'));
    cache.set(file, {m, v});
    return v;
  };
  const catalog = () => load('catalog.json', []);
  const styles = () => load('styles.json', []);
  const transitions = () => load('transitions.json', {});
  const recipes = () => {
    const dir = p('recipes');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => load(path.join('recipes', f), null)).filter(Boolean);
  };
  const schemaCache = new Map();
  const schemaFor = (m) => {
    const hit = schemaCache.get(m.id);
    if (hit && hit.m === m) return hit.s;
    const s = motionSchema(m);
    schemaCache.set(m.id, {m, s});
    return s;
  };
  const find = (list, id) => list.find((x) => x.id === id);
  const hasFile = (...x) => fs.existsSync(p(...x));

  const motionSummary = (m) => ({
    id: m.id, title: m.title, category: m.category, description: m.description, useFor: m.useFor, tags: m.tags,
    durationInFrames: m.durationInFrames, bestLength: m.bestLength, formats: m.formats, overlay: m.overlay,
    overlayProps: m.overlayProps ?? null, loopable: m.loopable, weight: m.weight, roles: m.roles, mood: m.mood,
    takesText: m.takesText, textProps: m.textProps ?? [], takesImage: m.takesImage, imageProps: m.imageProps ?? [], colorProps: m.colorProps ?? [],
    pairsWith: m.pairsWith ?? [],
    previewUrl: hasFile('gallery', `${m.id}.jpg`) ? `/api/motions/${m.id}/preview` : null,
    schemaUrl: `/api/motions/${m.id}/schema`,
  });
  const recipeSummary = (r) => ({
    id: r.id, title: r.title, useFor: r.useFor, format: r.format ?? 'landscape', tags: r.tags ?? [], notes: r.notes,
    durationInFrames: r.duration ?? (r.scenes ? undefined : 180),
    kind: r.scenes ? 'scenes' : 'layers',
    motions: [...new Set([...(r.layers ?? []), ...(r.scenes ?? []).flatMap((s) => [s, ...(s.layers ?? [])]), ...(r.overlays ?? [])].map((l) => l.motion).filter(Boolean))],
    previewUrl: hasFile('recipes', 'previews', `${r.id}.jpg`) ? `/api/recipes/${r.id}/preview` : null,
  });

  // ------------------------------------------------------------------------------------------------ rendering
  let remotion; // {bundle, renderMedia, renderStill, selectComposition, openBrowser, makeCancelSignal}
  let serveUrl;
  let browser;
  let bundleState = 'pending';
  let bundleError;
  let bundlePromise;
  const loadRemotion = async () => {
    if (remotion) return remotion;
    const [{bundle}, r] = await Promise.all([import('@remotion/bundler'), import('@remotion/renderer')]);
    remotion = {bundle, ...r};
    return remotion;
  };
  const ensureBundle = () => {
    bundlePromise ??= (async () => {
      bundleState = 'building';
      try {
        const R = await loadRemotion();
        const t0 = Date.now();
        serveUrl = await R.bundle({entryPoint: p('src/index.ts'), publicDir: p('public')});
        bundleState = 'ready';
        console.log(`[serve] bundle ready in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
      } catch (e) {
        bundleState = 'error';
        bundleError = String(e?.message ?? e);
        bundlePromise = undefined; // retry on the next render
        console.error('[serve] bundle failed:', e?.stack ?? e);
        throw e;
      }
    })();
    return bundlePromise;
  };
  const getBrowser = async () => {
    if (browser) return browser;
    const R = await loadRemotion();
    browser = await R.openBrowser('chrome', {chromiumOptions: {gl}});
    return browser;
  };

  const jobs = new Map();
  const queue = [];
  let running = null;
  const newId = () => crypto.randomBytes(6).toString('hex');

  const err = (status, message, extra) => Object.assign(new Error(message), {status, ...extra});
  const motionIds = () => new Set(catalog().map((m) => m.id));

  /** validate a request body and turn it into {compId, inputProps, out, meta}; throws a 400 on bad input */
  const plan = (b) => {
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw err(400, 'body must be a JSON object');
    const targets = ['motion', 'recipe', 'layers', 'spec'].filter((k) => b[k] != null);
    if (targets.length !== 1) throw err(400, 'give exactly one of: motion, recipe, layers, spec');
    const kind = targets[0];
    // `format` is the output file type; the legacy aspect names are accepted there too
    let fmt = b.format ?? 'mp4';
    let aspect = b.aspect;
    if (FORMATS[fmt]) {
      aspect ??= fmt;
      fmt = 'mp4';
    }
    const out = OUTPUTS[fmt];
    if (!out) throw err(400, `format must be one of ${Object.keys(OUTPUTS).join(' | ')}`);
    if (aspect != null && !FORMATS[aspect]) throw err(400, 'aspect must be landscape | square | portrait');
    const int = (name, lo, hi) => {
      if (b[name] == null) return undefined;
      const v = Number(b[name]);
      if (!Number.isInteger(v) || v < lo || v > hi) throw err(400, `${name} must be an integer ${lo}..${hi}`);
      return v;
    };
    let width = int('width', 16, 4096);
    let height = int('height', 16, 4096);
    const fps = int('fps', 1, 120);
    const frames = int('frames', 1, maxFrames);
    const frame = int('frame', 0, 1_000_000);
    if ((width == null) !== (height == null)) throw err(400, 'give width and height together');
    const quality = b.quality ?? 'normal';
    if (!['draft', 'normal', 'high'].includes(quality)) throw err(400, 'quality must be draft | normal | high');
    const scale = b.scale == null ? 0.5 : Number(b.scale);
    if (!(scale >= 0.1 && scale <= 1)) throw err(400, 'scale must be 0.1..1');
    if (b.style != null && typeof b.style !== 'string' && typeof b.style !== 'object') throw err(400, 'style must be a style id or {id, strength}');
    if (b.props != null && (typeof b.props !== 'object' || Array.isArray(b.props))) throw err(400, 'props must be an object');
    const warnings = [];
    const ids = motionIds();
    const need = (id, where) => {
      if (typeof id !== 'string' || !ids.has(id)) throw err(400, `unknown motion "${id}"${where ? ` in ${where}` : ''}: see GET /api/motions`);
    };

    const dims = () => {
      if (width) return [width, height];
      return FORMATS[aspect ?? 'landscape'];
    };
    let compId;
    let inputProps;
    let label;
    let natural; // natural length in frames when known
    if (kind === 'motion') {
      need(b.motion);
      const m = find(catalog(), b.motion);
      label = b.motion;
      let props = b.props ?? {};
      if (out.alpha) {
        if (m.overlayProps) props = {...m.overlayProps, ...props};
        else warnings.push(`${b.motion} paints its own background (not overlay-capable), so the alpha channel will be opaque`);
      }
      const [w, h] = dims();
      compId = 'Motion';
      inputProps = {motion: b.motion, props, width: w, height: h, fps: fps ?? 30, frames, style: b.style};
      natural = m.durationInFrames;
    } else {
      let spec;
      if (kind === 'recipe') {
        const r = find(recipes(), b.recipe);
        if (!r) throw err(400, `unknown recipe "${b.recipe}": see GET /api/recipes`);
        label = b.recipe;
        const ov = b.overrides ?? {};
        if (typeof ov !== 'object' || Array.isArray(ov)) throw err(400, 'overrides must be {motionId: props}');
        const apply = (l) => (ov[l.motion] ? {...l, props: {...(l.props ?? {}), ...ov[l.motion]}} : l);
        const [w, h] = width || aspect ? dims() : FORMATS[r.format ?? 'landscape'];
        const scenes = r.scenes
          ? r.scenes.map((s) => ({...apply(s), ...(s.layers ? {layers: s.layers.map(apply)} : {})}))
          : [{layers: r.layers.map(apply), duration: frames ?? r.duration ?? 180}];
        const style = b.style ?? r.style;
        spec = {width: w, height: h, fps: r.fps ?? 30, background: r.background ?? '#000', scenes, overlays: r.overlays, ...(style ? {style} : {})};
      } else if (kind === 'layers') {
        if (!Array.isArray(b.layers) || !b.layers.length) throw err(400, 'layers must be a non-empty array');
        b.layers.forEach((l, i) => need(l?.motion, `layers[${i}]`));
        const [w, h] = dims();
        spec = {width: w, height: h, fps: 30, scenes: [{layers: b.layers, duration: frames ?? 180}], ...(b.style ? {style: b.style} : {})};
        label = 'mix';
      } else {
        const s = b.spec;
        if (typeof s !== 'object' || Array.isArray(s) || !Array.isArray(s.scenes) || !s.scenes.length) throw err(400, 'spec must be a Compose spec with a non-empty scenes array');
        s.scenes.forEach((sc, i) => {
          if (sc.motion) need(sc.motion, `scenes[${i}]`);
          else if (Array.isArray(sc.layers)) sc.layers.forEach((l, j) => need(l?.motion, `scenes[${i}].layers[${j}]`));
          else throw err(400, `scenes[${i}] needs motion or layers`);
        });
        (s.overlays ?? []).forEach((l, i) => need(l?.motion, `overlays[${i}]`));
        const [w, h] = width || aspect ? dims() : [s.width ?? 1920, s.height ?? 1080];
        spec = {...s, width: w, height: h, fps: fps ?? s.fps ?? 30, ...(b.style ? {style: b.style} : {})};
        label = 'spec';
      }
      if (fps && kind !== 'spec') spec.fps = fps;
      if (out.alpha) {
        spec.background = 'transparent';
        warnings.push('alpha output: scenes that paint their own background stay opaque (use overlay-capable motions)');
      }
      width = spec.width;
      height = spec.height;
      compId = 'Compose';
      inputProps = {spec};
    }
    if (compId === 'Motion') {
      width = inputProps.width;
      height = inputProps.height;
    }
    if (fmt === 'mp4') {
      // H.264 / yuv420p needs even dimensions
      width -= width % 2;
      height -= height % 2;
      if (compId === 'Motion') Object.assign(inputProps, {width, height});
      else Object.assign(inputProps.spec, {width, height});
    }
    return {kind, label, fmt, out, compId, inputProps, frame, quality, scale, warnings, natural, requestFrames: frames, width, height};
  };

  const MEDIA = (pl) => {
    const crf = {draft: 28, normal: 18, high: 12}[pl.quality];
    switch (pl.fmt) {
      case 'mp4': return {codec: 'h264', crf, pixelFormat: 'yuv420p', audioCodec: 'aac'};
      case 'webm': return {codec: 'vp9', crf: crf + 12};
      case 'webm-alpha': return {codec: 'vp9', pixelFormat: 'yuva420p', imageFormat: 'png', crf: crf + 12};
      case 'prores-alpha': return {codec: 'prores', proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png'};
      case 'gif': return {codec: 'gif', everyNthFrame: 2, scale: pl.scale, numberOfGifLoops: 0};
      default: throw new Error('no media settings');
    }
  };

  const runJob = async (job) => {
    const pl = job.plan;
    job.status = 'bundling';
    job.startedAt = Date.now();
    await ensureBundle();
    const R = await loadRemotion();
    const puppeteerInstance = await getBrowser();
    const composition = await R.selectComposition({serveUrl, id: pl.compId, inputProps: pl.inputProps, puppeteerInstance});
    const file = path.join(outDir, `${job.id}${pl.out.ext}`);
    job.output = {format: pl.fmt, width: composition.width, height: composition.height, fps: composition.fps, durationInFrames: composition.durationInFrames};
    job.status = 'rendering';
    if (pl.out.still) {
      const frame = Math.min(composition.durationInFrames - 1, pl.frame ?? Math.floor(composition.durationInFrames * 0.6));
      await R.renderStill({composition, serveUrl, inputProps: pl.inputProps, output: file, frame, puppeteerInstance, chromiumOptions: {gl}});
      job.output.frame = frame;
      job.progress = 1;
    } else {
      const {cancel, cancelSignal} = R.makeCancelSignal();
      job.cancel = cancel;
      try {
        await R.renderMedia({
          composition, serveUrl, ...MEDIA(pl), inputProps: pl.inputProps, outputLocation: file, puppeteerInstance, concurrency, cancelSignal,
          chromiumOptions: {gl},
          onProgress: ({progress}) => (job.progress = Math.round(progress * 1000) / 1000),
        });
      } finally {
        job.cancel = undefined;
      }
    }
    job.file = file;
    job.output.bytes = fs.statSync(file).size;
    job.output.filename = `${pl.label}${pl.out.ext}`;
    job.output.url = `/api/jobs/${job.id}/file`;
    job.status = 'done';
    job.progress = 1;
  };

  const pump = async () => {
    if (running || !queue.length) return;
    const job = queue.shift();
    if (job.status === 'canceled') return pump();
    running = job;
    try {
      await runJob(job);
      console.log(`[serve] ${job.id} done: ${job.plan.label} ${job.plan.fmt} ${job.output.width}x${job.output.height} ${job.output.durationInFrames}f ${(job.output.bytes / 1024).toFixed(0)} KB in ${((Date.now() - job.startedAt) / 1000).toFixed(1)} s`);
    } catch (e) {
      if (job.status === 'canceled' || /cancel/i.test(String(e?.message ?? e))) job.status = 'canceled';
      else {
        job.status = 'error';
        job.error = String(e?.message ?? e).split('\n').slice(0, 6).join('\n');
        console.error(`[serve] ${job.id} failed:`, e?.stack ?? e);
      }
    } finally {
      job.finishedAt = Date.now();
      job.cancel = undefined;
      running = null;
      job.done?.forEach((f) => f());
      pump();
    }
  };

  const publicJob = (j) => {
    const pos = queue.indexOf(j);
    return {
      id: j.id, status: j.status, progress: j.progress, ...(pos >= 0 ? {queuePosition: pos + 1} : {}),
      request: {kind: j.plan.kind, target: j.plan.label, format: j.plan.fmt, width: j.plan.width, height: j.plan.height},
      createdAt: new Date(j.createdAt).toISOString(),
      ...(j.startedAt ? {startedAt: new Date(j.startedAt).toISOString()} : {}),
      ...(j.finishedAt ? {finishedAt: new Date(j.finishedAt).toISOString()} : {}),
      ...(j.output ? {output: j.output} : {}),
      ...(j.plan.warnings.length ? {warnings: j.plan.warnings} : {}),
      ...(j.error ? {error: j.error} : {}),
      links: {self: `/api/jobs/${j.id}`, ...(j.status === 'done' ? {file: `/api/jobs/${j.id}/file`} : {})},
    };
  };

  const gc = () => {
    const now = Date.now();
    for (const [id, j] of jobs) {
      if (!j.finishedAt || now - j.finishedAt < ttlMs) continue;
      if (j.file) fs.rmSync(j.file, {force: true});
      jobs.delete(id);
    }
  };
  const gcTimer = setInterval(gc, 60_000);
  gcTimer.unref();

  // ------------------------------------------------------------------------------------------------ http
  const send = (res, status, body, headers = {}) => {
    const isBuf = Buffer.isBuffer(body);
    const data = isBuf ? body : JSON.stringify(body, null, headers['x-pretty'] ? 1 : 0);
    delete headers['x-pretty'];
    res.writeHead(status, {'content-type': isBuf ? 'application/octet-stream' : 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers});
    res.end(data);
  };
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      let n = 0;
      req.on('data', (c) => {
        n += c.length;
        if (n > 4 * 1024 * 1024) {
          reject(err(413, 'body too large (max 4 MB)'));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => {
        try {
          resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
        } catch {
          reject(err(400, 'body is not valid JSON'));
        }
      });
      req.on('error', reject);
    });

  /** stream a file with Range support (browsers need it to seek in <video>) */
  const sendFile = (req, res, file, {mime, download, cache} = {}) => {
    const st = fs.statSync(file);
    const type = mime ?? MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    const h = {'content-type': type, 'accept-ranges': 'bytes', 'cache-control': cache ?? 'no-store', ...(download ? {'content-disposition': `attachment; filename="${download}"`} : {})};
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    if (range && (range[1] || range[2])) {
      let start = range[1] ? Number(range[1]) : Math.max(0, st.size - Number(range[2]));
      let end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
      if (start >= st.size || start > end) {
        res.writeHead(416, {...h, 'content-range': `bytes */${st.size}`});
        return res.end();
      }
      res.writeHead(206, {...h, 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1});
      return req.method === 'HEAD' ? res.end() : fs.createReadStream(file, {start, end}).pipe(res);
    }
    res.writeHead(200, {...h, 'content-length': st.size});
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  };

  /** map /assets/x and /dist/x onto a folder without escaping it */
  const staticFrom = (req, res, dir, rel, cache) => {
    let decoded;
    try {
      decoded = decodeURIComponent(rel);
    } catch {
      return send(res, 400, {error: 'bad path'});
    }
    const base = path.resolve(dir);
    const f = path.resolve(base, decoded.replace(/^\/+/, ''));
    if (f !== base && !f.startsWith(base + path.sep)) return send(res, 403, {error: 'forbidden'});
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return send(res, 404, {error: 'not found'});
    sendFile(req, res, f, {cache});
  };

  const truthy = (v) => v === '1' || v === 'true' || v === 'yes' || v === '';
  const openapi = () => ({
    openapi: '3.0.3',
    info: {title: 'Opus Motion render server', version: JSON.parse(fs.readFileSync(p('package.json'), 'utf8')).version, description: 'Catalog + render API of the Opus Motion Library (mgl serve).'},
    paths: {
      '/api/health': {get: {summary: 'status, counts, bundle state'}},
      '/api/motions': {get: {summary: 'catalog', parameters: ['category', 'q', 'overlay', 'loopable', 'weight', 'full', 'limit', 'offset'].map((n) => ({name: n, in: 'query', schema: {type: 'string'}}))}},
      '/api/motions/{id}': {get: {summary: 'one motion with its props JSON Schema'}},
      '/api/motions/{id}/schema': {get: {summary: 'props JSON Schema (draft 2020-12)'}},
      '/api/motions/{id}/preview': {get: {summary: 'gallery jpg'}},
      '/api/suggest': {get: {summary: 'rank motions and recipes for a brief', parameters: [{name: 'q', in: 'query', required: true, schema: {type: 'string'}}]}},
      '/api/styles': {get: {summary: 'visual styles'}},
      '/api/recipes': {get: {summary: 'ready-made mixes'}},
      '/api/transitions': {get: {summary: 'transition types and default frames'}},
      '/api/render': {post: {summary: 'queue a render', requestBody: {content: {'application/json': {schema: renderRequestSchema}}}, responses: {'202': {description: 'job'}}}},
      '/api/jobs': {get: {summary: 'recent jobs'}},
      '/api/jobs/{id}': {get: {summary: 'job status + progress'}, delete: {summary: 'cancel'}},
      '/api/jobs/{id}/file': {get: {summary: 'the rendered file (Range supported)'}},
    },
  });

  const route = async (req, res, url) => {
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const q = url.searchParams;
    const m = req.method;
    const pretty = q.has('pretty') ? {'x-pretty': '1'} : {};
    const ok = (body) => send(res, 200, body, {...pretty});
    const seg = pathname.split('/').filter(Boolean); // ['api','motions',':id',…]

    if (pathname === '/' || pathname === '/api') {
      return ok({
        name: 'opus-motion render server', docs: 'docs/HTTP_API.md in the library',
        routes: ['GET /api/health', 'GET /api/motions', 'GET /api/motions/:id', 'GET /api/motions/:id/schema', 'GET /api/suggest?q=', 'GET /api/styles', 'GET /api/recipes', 'GET /api/transitions', 'POST /api/render', 'GET /api/jobs/:id', 'GET /api/jobs/:id/file', 'GET /api/openapi.json', 'GET /assets/<public file>', 'GET /dist/<built file>'],
      });
    }
    if (seg[0] === 'assets') return staticFrom(req, res, p('public'), pathname.slice('/assets'.length), 'public, max-age=3600');
    if (seg[0] === 'dist') return staticFrom(req, res, p('dist'), pathname.slice('/dist'.length), 'no-cache');
    if (seg[0] !== 'api') return send(res, 404, {error: 'not found'});

    if (token) {
      const auth = req.headers.authorization ?? '';
      const given = auth.startsWith('Bearer ') ? auth.slice(7) : q.get('token') ?? '';
      const a = Buffer.from(given);
      const b = Buffer.from(token);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, {error: 'unauthorized: send "Authorization: Bearer <token>"'});
    }

    // ---- catalog
    if (m === 'GET' && pathname === '/api/health') {
      return ok({ok: true, bundle: bundleState, ...(bundleError ? {bundleError} : {}), motions: catalog().length, recipes: recipes().length, styles: styles().length, queue: queue.length, running: running?.id ?? null, concurrency});
    }
    if (m === 'GET' && pathname === '/api/openapi.json') return ok(openapi());
    if (m === 'GET' && pathname === '/api/render-schema') return ok(renderRequestSchema);
    if (m === 'GET' && pathname === '/api/schema') return ok({$schema: 'https://json-schema.org/draft/2020-12/schema', motions: Object.fromEntries(catalog().map((x) => [x.id, schemaFor(x)]))});
    if (m === 'GET' && pathname === '/api/transitions') return ok(Object.entries(transitions()).map(([type, defaultFrames]) => ({type, defaultFrames})));

    if (m === 'GET' && pathname === '/api/motions') {
      const text = (q.get('q') ?? '').toLowerCase().split(/\s+/).filter(Boolean);
      const full = truthy(q.get('full') ?? 'no');
      let rows = catalog().filter((x) => {
        if (q.get('category') && x.category !== q.get('category')) return false;
        if (q.has('overlay') && truthy(q.get('overlay')) !== Boolean(x.overlay)) return false;
        if (q.has('loopable') && truthy(q.get('loopable')) !== Boolean(x.loopable)) return false;
        if (q.get('weight') && x.weight !== q.get('weight')) return false;
        if (q.get('role') && !(x.roles ?? []).includes(q.get('role'))) return false;
        if (q.get('mood') && !(x.mood ?? []).includes(q.get('mood'))) return false;
        if (text.length) {
          const hay = `${x.id} ${x.title} ${x.description} ${x.useFor} ${(x.tags ?? []).join(' ')} ${x.category}`.toLowerCase();
          return text.every((w) => hay.includes(w));
        }
        return true;
      });
      const total = rows.length;
      const offset = Number(q.get('offset') ?? 0);
      const limit = q.get('limit') ? Number(q.get('limit')) : full ? 50 : rows.length;
      rows = rows.slice(offset, offset + limit);
      const categories = [...new Set(catalog().map((x) => x.category))].sort();
      return ok({total, count: rows.length, offset, categories, motions: rows.map((x) => (full ? {...x, ...motionSummary(x), props: x.props, propsSchema: schemaFor(x)} : motionSummary(x)))});
    }
    if (m === 'GET' && seg[1] === 'motions' && seg[2]) {
      const x = find(catalog(), seg[2]);
      if (!x) return send(res, 404, {error: `unknown motion "${seg[2]}"`});
      if (!seg[3]) return ok({...x, ...motionSummary(x), propsSchema: schemaFor(x)});
      if (seg[3] === 'schema') return ok(schemaFor(x));
      if (seg[3] === 'preview') {
        const f = p('gallery', `${x.id}.jpg`);
        return fs.existsSync(f) ? sendFile(req, res, f, {cache: 'public, max-age=300'}) : send(res, 404, {error: 'no preview image for this motion'});
      }
    }
    if (m === 'GET' && pathname === '/api/suggest') {
      const brief = q.get('q');
      if (!brief) return send(res, 400, {error: 'q is required, e.g. /api/suggest?q=dark hero with stats'});
      const {suggest, propsSnippet} = await import('./suggest.mjs');
      const f = {};
      for (const k of ['overlay', 'image', 'text', 'loop', 'light']) if (q.has(k) && truthy(q.get(k))) f[k] = true;
      if (q.get('category')) f.category = q.get('category');
      const {results} = suggest(brief, catalog(), recipes(), f);
      const rows = results.slice(0, Number(q.get('limit') ?? 10)).map((r) =>
        r.kind === 'motion'
          ? {kind: 'motion', id: r.id, score: r.score, why: r.why, motion: motionSummary(r.entry), props: propsSnippet(r.entry, {overlay: f.overlay})}
          : {kind: 'recipe', id: r.id, score: r.score, why: r.why, recipe: recipeSummary(r.entry)},
      );
      return ok({query: brief, total: results.length, results: rows});
    }
    if (m === 'GET' && pathname === '/api/styles') {
      const rows = styles().filter((s) => !q.get('family') || s.family === q.get('family'));
      return ok({count: rows.length, styles: rows.map((s) => (truthy(q.get('full') ?? 'no') ? s : {id: s.id, name: s.name, family: s.family, description: s.description, useFor: s.useFor, tags: s.tags, palette: s.palette}))});
    }
    if (m === 'GET' && seg[1] === 'styles' && seg[2]) {
      const s = find(styles(), seg[2]);
      return s ? ok(s) : send(res, 404, {error: `unknown style "${seg[2]}"`});
    }
    if (m === 'GET' && pathname === '/api/recipes') {
      const full = truthy(q.get('full') ?? 'no');
      return ok({count: recipes().length, recipes: recipes().map((r) => (full ? {...r, ...recipeSummary(r)} : recipeSummary(r)))});
    }
    if (m === 'GET' && seg[1] === 'recipes' && seg[2]) {
      const r = find(recipes(), seg[2]);
      if (!r) return send(res, 404, {error: `unknown recipe "${seg[2]}"`});
      if (!seg[3]) return ok({...r, ...recipeSummary(r)});
      if (seg[3] === 'preview') {
        const f = p('recipes', 'previews', `${r.id}.jpg`);
        return fs.existsSync(f) ? sendFile(req, res, f, {cache: 'public, max-age=300'}) : send(res, 404, {error: 'no preview image for this recipe'});
      }
    }

    // ---- rendering
    if (m === 'POST' && pathname === '/api/render') {
      const body = await readBody(req);
      const pl = plan(body);
      if (pl.requestFrames && pl.requestFrames > maxFrames) throw err(400, `frames exceeds --max-frames ${maxFrames}`);
      if (queue.length + (running ? 1 : 0) >= maxQueue) throw err(429, 'queue is full, retry later', {headers: {'retry-after': '10'}});
      const job = {id: newId(), status: 'queued', progress: 0, createdAt: Date.now(), plan: pl, done: []};
      jobs.set(job.id, job);
      queue.push(job);
      if (bundleState === 'pending') ensureBundle().catch(() => {});
      pump();
      if (truthy(q.get('wait') ?? 'no')) {
        await new Promise((resolve) => (job.finishedAt ? resolve() : job.done.push(resolve)));
        return send(res, job.status === 'done' ? 200 : 500, publicJob(job), {...pretty});
      }
      return send(res, 202, publicJob(job), {location: `/api/jobs/${job.id}`, ...pretty});
    }
    if (m === 'GET' && pathname === '/api/jobs') return ok({jobs: [...jobs.values()].reverse().slice(0, 100).map(publicJob)});
    if (seg[1] === 'jobs' && seg[2]) {
      const job = jobs.get(seg[2]);
      if (!job) return send(res, 404, {error: `unknown job "${seg[2]}" (finished jobs are deleted after ${Math.round(ttlMs / 60000)} min)`});
      if (m === 'GET' && !seg[3]) return ok(publicJob(job));
      if (m === 'DELETE' && !seg[3]) {
        if (job.status === 'queued') {
          queue.splice(queue.indexOf(job), 1);
          job.status = 'canceled';
          job.finishedAt = Date.now();
        } else if (job.status === 'bundling' || job.status === 'rendering') {
          job.status = 'canceled';
          job.cancel?.();
        }
        return ok(publicJob(job));
      }
      if ((m === 'GET' || m === 'HEAD') && seg[3] === 'file') {
        if (job.status !== 'done') return send(res, 409, {error: `job is ${job.status}`, job: publicJob(job)});
        return sendFile(req, res, job.file, {mime: job.plan.out.mime, download: job.output.filename});
      }
    }
    if (m === 'POST' && pathname === '/api/shutdown' && o['allow-shutdown']) {
      send(res, 200, {ok: true});
      setTimeout(() => shutdown(0), 50);
      return;
    }
    return send(res, 404, {error: `no route ${m} ${pathname}`});
  };

  const hostOk = (req) => {
    // loopback binding: only answer requests addressed to localhost (blocks DNS-rebinding from web pages)
    if (!loopback) return true;
    const h = String(req.headers.host ?? '').replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
    return ['localhost', '127.0.0.1', '::1'].includes(h);
  };

  const server = http.createServer(async (req, res) => {
    const cors = {'access-control-allow-origin': corsOrigin, 'access-control-allow-methods': 'GET, POST, DELETE, HEAD, OPTIONS', 'access-control-allow-headers': 'content-type, authorization, range', 'access-control-expose-headers': 'content-disposition, content-length, content-range, location', 'access-control-max-age': '600'};
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    if (corsOrigin !== '*') res.setHeader('vary', 'origin');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }
    if (!hostOk(req)) return send(res, 403, {error: 'bad Host header (server is bound to localhost; use --host to expose it)'});
    try {
      await route(req, res, new URL(req.url, 'http://localhost'));
    } catch (e) {
      if (res.headersSent) return res.end();
      const status = e.status ?? 500;
      if (status === 500) console.error('[serve]', e?.stack ?? e);
      send(res, status, {error: status === 500 ? 'internal error' : e.message}, e.headers ?? {});
    }
  });

  let closing = false;
  const shutdown = async (code = 0) => {
    if (closing) return;
    closing = true;
    console.log('\n[serve] shutting down');
    server.close();
    try {
      running?.cancel?.();
      await browser?.close({silent: true});
    } catch {}
    process.exit(code);
  };
  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  const shown = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
  console.log(`opus-motion render server: http://${shown}:${server.address().port}/  (${catalog().length} motions, ${recipes().length} recipes, ${styles().length} styles)`);
  if (!loopback && !token) console.warn('[serve] WARNING: listening on a non-local address without --token: anyone who can reach it can queue renders');
  console.log(`  output ${path.relative(root, outDir) || '.'}  concurrency ${concurrency}  gl ${gl}  cors ${corsOrigin}${token ? '  auth: bearer token' : ''}`);
  if (!o['no-warm']) {
    console.log('  bundling the compositions (once, ~30-90 s)…');
    ensureBundle().catch(() => {});
  }
  return {server, shutdown};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer({opts: parseArgs(process.argv.slice(2))}).catch((e) => {
    console.error(e?.code === 'EADDRINUSE' ? `port in use: ${e.message}. Try --port <n>` : (e?.stack ?? e));
    process.exit(1);
  });
}
