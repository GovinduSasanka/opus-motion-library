/*
 * Renders site/public/media/og-card.png (1200x630): the Open Graph / Twitter card of the landing page.
 * The card carries no counts, so it never goes stale. Re-run after changing the design:
 *   npm run og-card            (needs Chrome / Edge; set CHROME=/path/to/chrome if it is not auto-detected)
 * The PNG is committed; the site build does not run this.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(SITE, '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');

const candidates = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = candidates.find((p) => fs.existsSync(p));
if (!executablePath) throw new Error('no Chrome/Edge found — set CHROME=/path/to/chrome');

const frames = ['aurora', 'neon-sign', 'city-skyline', 'live-chart', 'fireworks', 'origami-fold', 'ken-burns', 'depth-descent', 'comic-burst'].filter((id) =>
  fs.existsSync(path.join(ROOT, 'gallery', `${id}.jpg`)),
);
const tile = (id, i) =>
  `<div class="t t${i}" style="background-image:url('${pathToFileURL(path.join(ROOT, 'gallery', `${id}.jpg`)).href}')"></div>`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#07080b;color:#f2eee6;font-family:Inter,system-ui,sans-serif;position:relative;overflow:hidden}
.glow{position:absolute;inset:0;background:radial-gradient(70% 90% at 82% 10%,rgba(233,194,122,.28),transparent 60%),radial-gradient(60% 70% at 0% 100%,rgba(233,194,122,.12),transparent 60%)}
.mosaic{position:absolute;right:-90px;top:-70px;width:620px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;transform:rotate(-8deg);opacity:.95}
.t{aspect-ratio:16/9;border-radius:12px;background-size:300% 100%;background-position:50% 0;border:1px solid rgba(242,238,230,.16);box-shadow:0 18px 50px -20px #000}
.t1,.t4,.t7{margin-top:38px}
.fade{position:absolute;inset:0;background:linear-gradient(90deg,#07080b 0%,#07080b 38%,rgba(7,8,11,.55) 62%,rgba(7,8,11,0) 100%),linear-gradient(0deg,#07080b 0%,rgba(7,8,11,0) 30%)}
.copy{position:absolute;left:64px;top:64px;bottom:56px;width:760px;display:flex;flex-direction:column}
.kick{font:500 17px 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#e9c27a;display:flex;align-items:center;gap:12px}
.kick i{width:8px;height:8px;border-radius:50%;background:#e9c27a;box-shadow:0 0 14px #e9c27a}
h1{font-weight:700;font-size:72px;line-height:1.0;letter-spacing:-.045em;margin-top:34px}
h1 em{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-weight:400;color:#e9c27a;letter-spacing:-.02em;font-size:1.12em;line-height:.9}
p{margin-top:26px;font-size:24px;line-height:1.4;color:rgba(242,238,230,.78);max-width:620px}
.foot{margin-top:auto;display:flex;align-items:center;gap:14px;font-size:21px;font-weight:600;white-space:nowrap}
.mark{width:34px;height:34px;flex:none}
.foot span{color:rgba(242,238,230,.55);font-weight:500;font-size:17px}
</style></head><body>
<div class="glow"></div>
<div class="mosaic">${frames.slice(0, 9).map(tile).join('')}</div>
<div class="fade"></div>
<div class="copy">
  <div class="kick"><i></i>Open source · MIT · Remotion + React</div>
  <h1>The world's largest open-source <em>motion graphics library</em></h1>
  <p>Free Remotion &amp; React templates, transitions and recipes — for videos, websites and apps. AI-agent ready.</p>
  <div class="foot">
    <svg class="mark" viewBox="0 0 64 64"><circle cx="32" cy="32" r="19" fill="none" stroke="#E9C27A" stroke-width="5"/><circle cx="45.5" cy="18.5" r="6" fill="#F2EEE6"/></svg>
    Opus Motion Library <span>github.com/GovinduSasanka/opus-motion-library</span>
  </div>
</div>
</body></html>`;

const tmp = path.join(SITE, 'node_modules', '.cache', 'og-card.html');
fs.mkdirSync(path.dirname(tmp), {recursive: true});
fs.writeFileSync(tmp, html);

const browser = await puppeteer.launch({executablePath, headless: true, args: ['--no-sandbox', '--allow-file-access-from-files']});
try {
  const pg = await browser.newPage();
  await pg.setViewport({width: 1200, height: 630, deviceScaleFactor: 1});
  await pg.goto(pathToFileURL(tmp).href, {waitUntil: 'networkidle0', timeout: 30000});
  await pg.evaluate(() => document.fonts.ready);
  const out = path.join(SITE, 'public', 'media', 'og-card.png');
  await pg.screenshot({path: out, type: 'png', clip: {x: 0, y: 0, width: 1200, height: 630}});
  console.log(`wrote ${path.relative(ROOT, out)} (${fs.statSync(out).size} bytes)`);
} finally {
  await browser.close();
}
