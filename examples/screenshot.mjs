#!/usr/bin/env node
/**
 * Screenshot a page twice (~1 s apart) per scroll target and report how much changed — proves motions animate.
 * Uses puppeteer-core with Remotion's downloaded Chrome headless shell (or CHROME_PATH).
 *
 *   node examples/screenshot.mjs <url> <out-dir> [--targets "top,#numbers,.mix"] [--size 1440x900] [--gap 1000] [--wait 3000] [--reduced]
 * Prints, per target: changed-pixel fraction between the two shots and any console errors.
 */
import puppeteer from 'puppeteer-core';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [url, outDir = 'screenshots', ...rest] = process.argv.slice(2);
const opt = (k, d) => {
  const i = rest.indexOf(`--${k}`);
  return i >= 0 ? rest[i + 1] : d;
};
if (!url) throw new Error('usage: node examples/screenshot.mjs <url> <out-dir> [--targets "top,#id"]');
const findChrome = () => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(root, 'node_modules', '.remotion', 'chrome-headless-shell');
  const walk = (d) => {
    for (const e of fs.readdirSync(d, {withFileTypes: true})) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) {
        const r = walk(f);
        if (r) return r;
      } else if (/^chrome-headless-shell(\.exe)?$/.test(e.name)) return f;
    }
    return null;
  };
  const found = fs.existsSync(base) && walk(base);
  if (!found) throw new Error('no Chrome found: run a render once (Remotion downloads chrome-headless-shell) or set CHROME_PATH');
  return found;
};
const [W, H] = opt('size', '1440x900').split('x').map(Number);
const targets = opt('targets', 'top').split(',');
const gap = Number(opt('gap', 1000));
fs.mkdirSync(outDir, {recursive: true});

const rgba = (png) => execFileSync('ffmpeg', ['-v', 'error', '-i', png, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], {maxBuffer: 256 * 1024 * 1024});
const changed = (a, b) => {
  let n = 0;
  for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++;
  return n / (a.length / 4);
};

const browser = await puppeteer.launch({executablePath: findChrome(), headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']});
const page = await browser.newPage();
await page.setViewport({width: W, height: H});
if (rest.includes('--reduced')) await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, {waitUntil: 'networkidle0', timeout: 60000});
const report = [];
for (const t of targets) {
  if (t === 'top') await page.evaluate(() => window.scrollTo(0, 0));
  else await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({block: 'center'}), t);
  await new Promise((r) => setTimeout(r, Number(opt('wait', 3000))));
  const name = t === 'top' ? 'top' : t.replace(/[^a-z0-9]+/gi, '');
  const a = path.join(outDir, `${name}-a.png`);
  const b = path.join(outDir, `${name}-b.png`);
  await page.screenshot({path: a});
  await new Promise((r) => setTimeout(r, gap));
  await page.screenshot({path: b});
  const players = await page.evaluate(() => document.querySelectorAll('[data-opus-motion]').length);
  const frac = changed(rgba(a), rgba(b));
  report.push({target: t, changed: +frac.toFixed(4), players, shots: [a, b]});
  console.log(`${t.padEnd(12)} changed ${(frac * 100).toFixed(2)} % of pixels between shots (${players} players on page) -> ${a}`);
}
if (errors.length) console.log(`console errors (${errors.length}):\n  ` + [...new Set(errors)].slice(0, 10).join('\n  '));
else console.log('no console errors');
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({url, report, errors}, null, 1));
await browser.close();
