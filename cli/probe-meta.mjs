#!/usr/bin/env node
/**
 * probe-meta — measures every motion so catalog.json metadata is based on pixels, not guesses.
 * Writes docs/motion-probe.json:  {motions: {id: {luma, seam, motion, transparent}}}
 *   luma         mean Rec.709 luma (0-255) of frames at 30/50/70 %          -> mood dark / mid / light
 *   motion       mean abs pixel change between consecutive frames (0-255)
 *   seam         diff(last frame -> frame 0) / median consecutive diff       -> loopable when ≤ 1.6
 *   end          motion over the last two frames / median (≈0 = the motion has stopped by the end: not a loop)
 *   transparent  fraction of fully transparent pixels at 50 % when rendered with the catalog's overlayProps
 *   alpha        mean alpha (0-1) of that frame; < 0.85 = genuinely see-through
 *
 *   node cli/probe-meta.mjs [--only a,b] [--size 384x216]
 * Then run node cli/gen-registry.mjs again to fold the measurements into catalog.json.
 */
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inferOverlayProps} from './meta.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const [W, H] = opt('size', '384x216').split('x').map(Number);
const only = opt('only') ? opt('only').split(',') : null;
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
const overrides = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'motion-meta.json'), 'utf8')).motions ?? {};
const outFile = path.join(root, 'docs', 'motion-probe.json');
const result = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {motions: {}};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mgl-probe-'));

const rgba = (png) => execFileSync('ffmpeg', ['-v', 'error', '-i', png, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], {maxBuffer: 64 * 1024 * 1024});
const diff = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  return s / (a.length / 4) / 3;
};
const lumaOf = (a) => {
  let s = 0;
  for (let i = 0; i < a.length; i += 4) s += 0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2];
  return s / (a.length / 4);
};
const transparentOf = (a) => {
  let n = 0;
  for (let i = 3; i < a.length; i += 4) if (a[i] === 0) n++;
  return n / (a.length / 4);
};
const alphaOf = (a) => {
  let s = 0;
  for (let i = 3; i < a.length; i += 4) s += a[i];
  return s / (a.length / 4) / 255;
};

process.stdout.write('bundling… ');
const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, 'public')});
console.log('ok');
const puppeteerInstance = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const still = async (inputProps, frame, name) => {
  const composition = await selectComposition({serveUrl, id: 'Motion', inputProps, puppeteerInstance});
  const png = path.join(tmp, `${name}.png`);
  await renderStill({composition, serveUrl, inputProps, output: png, frame: Math.max(0, Math.min(frame, composition.durationInFrames - 1)), puppeteerInstance, chromiumOptions: {gl: 'angle'}, imageFormat: 'png'});
  return rgba(png);
};

for (const m of catalog) {
  if (only && !only.includes(m.id)) continue;
  if (m.category === 'transition') continue;
  const d = m.durationInFrames;
  const inputProps = {motion: m.id, props: m.loopProps ?? {}, width: W, height: H, fps: 30};
  try {
    const first = await still(inputProps, 0, 'a');
    const last = await still(inputProps, d - 1, 'z');
    const consec = [];
    let lsum = 0;
    for (const k of [0.3, 0.5, 0.7]) {
      const f = Math.floor(d * k);
      const a = await still(inputProps, f, 'k');
      const b = await still(inputProps, f + 1, 'k1');
      consec.push(diff(a, b));
      lsum += lumaOf(a);
    }
    consec.push(diff(await still(inputProps, d - 2, 'y'), last));
    const sorted = [...consec].sort((x, y) => x - y);
    const med = Math.max(0.35, sorted[Math.floor(sorted.length / 2)]);
    const r = {luma: Math.round(lsum / 3), motion: +(consec.reduce((s, x) => s + x, 0) / consec.length).toFixed(2), seam: +(diff(last, first) / med).toFixed(2), end: +(consec[consec.length - 1] / med).toFixed(2)};
    const ov = overrides[m.id]?.overlayProps !== undefined ? overrides[m.id].overlayProps : inferOverlayProps(m);
    if (ov) {
      const o = await still({...inputProps, props: {...(m.loopProps ?? {}), ...ov}}, Math.floor(d * 0.5), 'o');
      r.transparent = +transparentOf(o).toFixed(3);
      r.alpha = +alphaOf(o).toFixed(3);
    }
    result.motions[m.id] = r;
    console.log(m.id.padEnd(22), JSON.stringify(r));
  } catch (e) {
    console.log(m.id.padEnd(22), 'FAILED', e.message.split('\n')[0]);
  }
  fs.writeFileSync(outFile, JSON.stringify(result, null, 1));
}
await puppeteerInstance.close({silent: true});
fs.rmSync(tmp, {recursive: true, force: true});
console.log(`-> docs/motion-probe.json (${Object.keys(result.motions).length} motions)`);
