#!/usr/bin/env node
/**
 * direct — turn a storyboard into a finished, narrated video.
 *
 *   node cli/direct.mjs storyboards/demo.json [--out out/demo.mp4] [--no-render] [--no-voice] [--no-zones] [--concurrency 4]
 *
 * Storyboard:
 * {
 *   "name": "demo", "width": 1920, "height": 1080, "fps": 30,
 *   "voice": {"speaker": "Ryan", "style": "warm documentary narrator", "seed": 7},
 *   "music": {"volume": 0.22, "duck": 0.45, "snap": true},       // snap = cut on the music's beats
 *   "captions": true, "captionStyle": {"variant": "premium", "size": 40, "accent": "#E9C27A"},
 *   "tags": {"total": 108, "accent": "#E9C27A"},                   // index tags for scenes with "tag"
 *   "overlays": [{"motion": "film-look", "props": {"overlay": true}}],   // whole-video overlays
 *   "scenes": [
 *     {"motion": "sonar-ping", "props": {}, "say": "Every motion starts with a dot.",
 *      "min": 90, "lead": 8, "pad": 18, "offset": 0, "caption": true, "transition": {"type": "iris"},
 *      "music": {"file": "music/inspiring.mp3", "volume": 0.2, "start": 0},   // switch the music bed here
 *      "tag": true | {"name": "Sonar Ping", "family": "shape"},
 *      "captionPosition": "top", "tagCorner": "top-right",                     // override automatic zones
 *      "overlays": [{"motion": "confetti-burst", "at": 30, "duration": 60, "props": {}}],
 *      "sfx": [{"file": "sfx/pop.mp3", "at": 10, "volume": 0.5}]},
 *     {"layers": [{"motion": "aurora"}, {"motion": "blur-in-title", "from": 20, "props": {...}}], "min": 120}
 *   ]
 * }
 * Each scene lasts max(min, lead + speech + pad) frames (then nudged so the cut lands on a beat).
 * Narration: local Qwen3-TTS (cli/voice.py); Whisper (cli/voice-check.py) aligns every word so the
 * captions light up word by word in sync. Caption and tag placement come from rendered stills of each
 * scene (cli/zones.py): captions take the calmer band (bottom/top) and contrast with what is behind.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const sbPath = path.resolve(args[0] ?? '');
if (!fs.existsSync(sbPath)) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
  process.exit(1);
}
const flag = (k) => args.includes(`--${k}`);
const opt = (k, d) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);

const sb = JSON.parse(fs.readFileSync(sbPath, 'utf8'));
const TF = JSON.parse(fs.readFileSync(path.join(root, 'transitions.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
const titleOf = Object.fromEntries(catalog.map((m) => [m.id, m]));
const trFrames = (tr) => tr.frames ?? TF[`${tr.type}:${tr.variant ?? (tr.type === 'bands' && tr.direction === 'from-center' ? 'center' : '')}`] ?? TF[tr.type] ?? 15;
const fps = sb.fps ?? 30;
const W = sb.width ?? 1920;
const H = sb.height ?? 1080;
const name = sb.name ?? path.basename(sbPath, '.json');
// Python envs: QWEN_PYTHON (PyTorch + qwen-tts + librosa) and WHISPER_PYTHON (openai-whisper); default `python`
const PY = process.env.QWEN_PYTHON ?? 'python';
const WPY = process.env.WHISPER_PYTHON ?? PY;
const sid = (i) => `s${String(i + 1).padStart(3, '0')}`;

// 1. narration --------------------------------------------------------------------------------
const voiceDir = path.join(root, 'public', 'voice', name);
fs.mkdirSync(voiceDir, {recursive: true});
const clean = (t) => t.replace(/\*/g, '');
const lines = sb.scenes.map((s, i) => ({id: sid(i), text: s.say ? clean(s.say) : '', say: s.direction ?? ''})).filter((l) => l.text);
const manifestPath = path.join(voiceDir, 'manifest.json');
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
for (const l of lines)
  if (old[l.id] && old[l.id] !== l.text) {
    fs.rmSync(path.join(voiceDir, `${l.id}.wav`), {force: true});
    fs.rmSync(path.join(voiceDir, `${l.id}.words.json`), {force: true});
  }
fs.writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(lines.map((l) => [l.id, l.text])), null, 1));
fs.writeFileSync(path.join(voiceDir, 'lines.json'), JSON.stringify(lines, null, 1));
if (lines.length && !flag('no-voice')) {
  console.log(`voice: ${lines.length} lines (Qwen3-TTS, local)`);
  const r = spawnSync(PY, [path.join(root, 'cli', 'voice.py'), path.join(voiceDir, 'lines.json'), voiceDir, sb.voice?.model ?? 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice', sb.voice?.speaker ?? 'Ryan', String(sb.voice?.seed ?? 7)], {
    stdio: 'inherit',
    env: {...process.env, VOICE_STYLE: sb.voice?.style ?? ''},
  });
  if (r.status !== 0) throw new Error('voice generation failed');
}
// word alignment (Whisper) for any line without a fresh words file
const needWords = lines.filter((l) => {
  const f = path.join(voiceDir, `${l.id}.words.json`);
  if (!fs.existsSync(path.join(voiceDir, `${l.id}.wav`))) return false;
  if (!fs.existsSync(f)) return true;
  return JSON.parse(fs.readFileSync(f, 'utf8')).text !== l.text;
});
if (needWords.length && !flag('no-voice')) {
  console.log(`align: ${needWords.length} lines (Whisper, local)`);
  const r = spawnSync(WPY, [path.join(root, 'cli', 'voice-check.py'), voiceDir, 'small'], {stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8'});
  const bad = (r.stdout ?? '').split('\n').filter((x) => x.startsWith('BAD'));
  if (bad.length) console.log(`speech check flagged:\n${bad.join('\n')}`);
}
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}).trim());

/** map script words to Whisper word times (sequence alignment on normalised tokens) */
const alignWords = (script, wordsFile, speechFrames) => {
  const toks = script.split(/\s+/).filter(Boolean);
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
  let heard = [];
  if (fs.existsSync(wordsFile)) heard = JSON.parse(fs.readFileSync(wordsFile, 'utf8')).words ?? [];
  const out = toks.map(() => null);
  let j = 0;
  for (let i = 0; i < toks.length; i++) {
    const n = norm(toks[i]);
    for (let k = j; k < Math.min(heard.length, j + 4); k++) {
      const hn = norm(heard[k].word);
      if (hn && (hn === n || hn.startsWith(n) || n.startsWith(hn) || (n.length > 3 && hn.slice(0, 3) === n.slice(0, 3)))) {
        out[i] = {from: heard[k].start * fps, to: heard[k].end * fps};
        j = k + 1;
        break;
      }
    }
  }
  // fill gaps by interpolating between known neighbours (or spreading over the speech)
  const total = speechFrames;
  for (let i = 0; i < out.length; i++) {
    if (out[i]) continue;
    let a = i - 1;
    while (a >= 0 && !out[a]) a--;
    let b = i + 1;
    while (b < out.length && !out[b]) b++;
    const t0 = a >= 0 ? out[a].to : 0;
    const t1 = b < out.length ? out[b].from : total;
    const span = b - a;
    const f = t0 + ((t1 - t0) * (i - a)) / span;
    out[i] = {from: f, to: f + (t1 - t0) / span};
  }
  return toks.map((t, i) => ({text: t, from: out[i].from, to: out[i].to}));
};

/** split timed words into caption lines: one sentence per line when it fits (<= 10 words / 56 chars),
 *  otherwise a balanced split at the comma nearest the middle, else at the middle word */
const chunkWords = (words) => {
  const sentences = [];
  let cur = [];
  for (const w of words) {
    cur.push(w);
    if (/[.!?;]$/.test(w.text)) {
      sentences.push(cur);
      cur = [];
    }
  }
  if (cur.length) sentences.push(cur);
  const fits = (ws) => ws.length <= 10 && clean(ws.map((x) => x.text).join(' ')).length <= 56;
  const split = (ws) => {
    if (fits(ws)) return [ws];
    const mid = ws.length / 2;
    let cut = -1;
    ws.forEach((w, i) => {
      if (i < ws.length - 1 && /,$/.test(w.text) && (cut < 0 || Math.abs(i + 1 - mid) < Math.abs(cut - mid))) cut = i + 1;
    });
    if (cut < 2 || cut > ws.length - 2) cut = Math.round(mid);
    return [...split(ws.slice(0, cut)), ...split(ws.slice(cut))];
  };
  return sentences.flatMap(split);
};

// beats per music file
const beatsOf = {};
const loadBeats = (file) => {
  if (beatsOf[file]) return beatsOf[file];
  const f = path.join(root, 'public', file + '.beats.json');
  if (!fs.existsSync(f)) spawnSync(PY, [path.join(root, 'cli', 'beats.py'), path.join(root, 'public', file)], {stdio: 'inherit'});
  beatsOf[file] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {beats: []};
  return beatsOf[file];
};

// 2. timing -----------------------------------------------------------------------------------
const scenes = [];
const musicCues = [];
const captions = [];
const duckOnly = [];
const sfx = [];
const overlays = [];
const meta = []; // per scene: start, length, caption cue indexes, tag
let t = 0;
let tagN = 0;
const snapAll = sb.music?.snap ?? false;
sb.scenes.forEach((s, i) => {
  const id = sid(i);
  const wav = path.join(voiceDir, `${id}.wav`);
  const lead = s.lead ?? 8;
  const pad = s.pad ?? 16;
  const speech = s.say && fs.existsSync(wav) ? Math.ceil(dur(wav) * fps) : 0;
  let d = Math.max(s.min ?? 60, speech ? lead + speech + pad : 0);
  const start = t;
  if (s.music) {
    if (musicCues.length) musicCues[musicCues.length - 1].to = start + fps;
    musicCues.push({file: s.music.file, from: Math.max(0, start - (musicCues.length ? fps : 0)), to: -1, volume: s.music.volume ?? sb.music?.volume ?? 0.22, start: s.music.start ?? 0, fade: fps});
  }
  const tr = i < sb.scenes.length - 1 && s.transition && s.transition.type !== 'cut' ? trFrames(s.transition) : 0;
  // snap the cut (or the middle of the transition) to the nearest musical beat
  const cue = musicCues.at(-1);
  if ((s.snap ?? snapAll) && cue) {
    const bt = loadBeats(cue.file).beats;
    const cutAt = (len) => start + len - tr / 2;
    const minLen = speech ? lead + speech + 6 : Math.round(d * 0.85);
    const best = bt
      .map((b) => Math.round((b - cue.start) * fps + cue.from + tr / 2 - start))
      .filter((len) => len >= minLen && len <= Math.round(d * 1.35) + 2)
      .sort((a, b) => Math.abs(a - d) - Math.abs(b - d))[0];
    if (best) d = best;
    void cutAt;
  }
  const m = {start, length: d, caps: [], tag: null, scene: s};
  if (speech) {
    sfx.push({file: `voice/${name}/${id}.wav`, at: start + lead, volume: 1});
    const words = alignWords(s.say, path.join(voiceDir, `${id}.words.json`), speech);
    const chunks = chunkWords(words);
    chunks.forEach((c, k) => {
      const from = Math.round(start + lead + c[0].from) - 2;
      const next = chunks[k + 1];
      const to = next ? Math.round(start + lead + next[0].from) - 3 : Math.round(start + lead + c.at(-1).to) + 14;
      const cue2 = {text: c.map((x) => x.text).join(' '), from, to: Math.max(from + 12, to), words: c.map((x) => ({text: x.text, from: Math.round(start + lead + x.from), to: Math.round(start + lead + x.to)}))};
      if (s.caption === false) duckOnly.push(cue2);
      else {
        captions.push(cue2);
        m.caps.push(captions.length - 1);
      }
    });
  }
  if (s.tag) {
    tagN++;
    const def = titleOf[s.motion ?? 'mix'];
    const tg = typeof s.tag === 'object' ? s.tag : {};
    m.tag = {
      index: `${String(tg.index ?? tagN).padStart(3, '0')} / ${sb.tags?.total ?? catalog.length}`,
      name: tg.name ?? (s.motion ?? 'mix').split('-').map((w) => (w === '3d' ? '3D' : w[0].toUpperCase() + w.slice(1))).join(' '),
      family: tg.family ?? def?.category ?? '',
    };
  }
  for (const o of s.overlays ?? []) overlays.push({motion: o.motion, from: start + (o.at ?? 0), duration: o.duration ?? 60, props: o.props ?? {}, blend: o.blend, opacity: o.opacity});
  for (const x of s.sfx ?? []) sfx.push({file: x.file, at: start + (x.at ?? 0), volume: x.volume ?? 0.5});
  scenes.push({motion: s.motion, layers: s.layers, duration: d, props: s.props ?? {}, offset: s.offset, transition: s.transition});
  meta.push(m);
  t += d - tr;
});
// a transition can't be longer than either scene it joins
scenes.forEach((sc, i) => {
  if (!sc.transition || sc.transition.type === 'cut' || i === scenes.length - 1) return;
  const f = trFrames(sc.transition);
  if (f >= sc.duration || f >= scenes[i + 1].duration) throw new Error(`scene ${i + 1} (${sc.motion ?? 'layers'}): transition "${sc.transition.type}" is ${f} frames but a joined scene is shorter — use "cut" or a longer scene`);
});
if (musicCues.length) musicCues[musicCues.length - 1].to = t;
for (const m of musicCues) if (m.to < 0) m.to = t;

// 3. caption + tag zones from rendered stills ---------------------------------------------------
const zonesNeeded = meta.some((m) => m.caps.length || m.tag) && !flag('no-zones');
let zones = {};
if (zonesNeeded) {
  const {bundle} = await import('@remotion/bundler');
  const {renderStill, selectComposition, openBrowser} = await import('@remotion/renderer');
  const cacheDir = path.join(root, 'out', 'zones-cache');
  fs.mkdirSync(cacheDir, {recursive: true});
  const jobs = [];
  const todo = [];
  meta.forEach((m, i) => {
    if (!m.caps.length && !m.tag) return;
    const sc = {...scenes[i], transition: undefined};
    const frames = new Set([Math.floor(m.length * 0.5)]);
    for (const ci of m.caps) frames.add(Math.max(0, Math.min(m.length - 1, Math.round((captions[ci].from + captions[ci].to) / 2 - m.start))));
    if (m.tag) frames.add(Math.min(m.length - 1, 20));
    const files = [...frames].slice(0, 4).map((f) => {
      const key = crypto.createHash('sha1').update(JSON.stringify({sc, f, W, H})).digest('hex').slice(0, 16);
      const png = path.join(cacheDir, `${key}.png`);
      if (!fs.existsSync(png)) todo.push({sc, f, png});
      return png;
    });
    jobs.push({key: String(i), files});
  });
  if (todo.length) {
    console.log(`zones: rendering ${todo.length} stills…`);
    const serveUrl = await bundle({entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, 'public')});
    const puppeteerInstance = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
    let n = 0;
    for (const j of todo) {
      const inputProps = {spec: {width: W, height: H, fps, scenes: [j.sc]}};
      const composition = await selectComposition({serveUrl, id: 'Compose', inputProps, puppeteerInstance});
      await renderStill({composition, serveUrl, inputProps, output: j.png, frame: Math.min(j.f, composition.durationInFrames - 1), scale: 0.25, puppeteerInstance, chromiumOptions: {gl: 'angle'}});
      if (++n % 20 === 0) process.stdout.write(`\r  ${n}/${todo.length}`);
    }
    await puppeteerInstance.close({silent: true});
    console.log('');
  }
  const jobsPath = path.join(cacheDir, `${name}.jobs.json`);
  const zonesPath = path.join(root, 'specs', 'built', `${name}.zones.json`);
  fs.mkdirSync(path.dirname(zonesPath), {recursive: true});
  fs.writeFileSync(jobsPath, JSON.stringify(jobs));
  const r = spawnSync(PY, [path.join(root, 'cli', 'zones.py'), jobsPath, zonesPath], {stdio: 'inherit'});
  if (r.status === 0) zones = JSON.parse(fs.readFileSync(zonesPath, 'utf8'));
}
meta.forEach((m, i) => {
  const z = zones[String(i)] ?? {caption: 'bottom', captionTone: 'light', tag: 'top-left', tagTone: 'light'};
  const capPos = m.scene.captionPosition ?? z.caption;
  for (const ci of m.caps) Object.assign(captions[ci], {position: capPos, tone: m.scene.captionTone ?? z.captionTone});
  if (m.tag) {
    let corner = m.scene.tagCorner ?? z.tag;
    if (m.caps.length && !m.scene.tagCorner && corner.startsWith(capPos === 'bottom' ? 'bottom' : 'top')) corner = capPos === 'bottom' ? 'top-left' : 'bottom-left';
    overlays.push({
      motion: 'scene-tag',
      from: m.start,
      duration: m.length,
      props: {...m.tag, corner, tone: m.scene.tagTone ?? z.tagTone, background: 'transparent', accent: sb.tags?.accent ?? '#E9C27A', inAt: 8, outBefore: 6},
    });
  }
});
for (const o of sb.overlays ?? []) overlays.push({motion: o.motion, from: o.from ?? 0, duration: o.duration ?? t - (o.from ?? 0), props: o.props ?? {}, blend: o.blend, opacity: o.opacity});

// audio is optional (not shipped in the repo): drop any music bed or sound effect whose file is missing
const have = (f) => fs.existsSync(path.join(root, 'public', f));
const missingAudio = new Set([...musicCues.map((m) => m.file), ...sfx.map((x) => x.file)].filter((f) => !have(f)));
if (missingAudio.size) console.log(`audio: skipping ${missingAudio.size} missing file(s) (run node cli/fetch-audio.mjs): ${[...missingAudio].join(', ')}`);
for (const arr of [musicCues, sfx]) for (let k = arr.length - 1; k >= 0; k--) if (missingAudio.has(arr[k].file)) arr.splice(k, 1);

const spec = {
  width: W,
  height: H,
  fps,
  background: sb.background ?? '#000',
  scenes,
  overlays,
  captions: sb.captions === false ? [] : captions,
  captionStyle: sb.captionStyle ?? {position: 'bottom', size: 40},
  audio: {
    musicVolume: sb.music?.volume ?? 0.22,
    duck: sb.music?.duck ?? 0.45,
    sfx,
    musicCues,
  },
};
if (sb.music?.file) Object.assign(spec.audio, {music: sb.music.file, musicStart: sb.music.start ?? 0});
spec.duckCues = sb.captions === false ? [...captions, ...duckOnly] : duckOnly;
const specDir = path.join(root, 'specs', 'built');
fs.mkdirSync(specDir, {recursive: true});
const specPath = path.join(specDir, `${name}.json`);
fs.writeFileSync(specPath, JSON.stringify(spec, null, 1));
console.log(`spec: ${path.relative(root, specPath)} — ${scenes.length} scenes, ${(t / fps).toFixed(1)} s, ${captions.length} captions, ${tagN} tags`);

// 4. render -----------------------------------------------------------------------------------
if (!flag('no-render')) {
  const out = path.resolve(opt('out', path.join(root, 'out', `${name}.mp4`)));
  const r = spawnSync(process.execPath, [path.join(root, 'cli', 'mgl.mjs'), 'compose', specPath, '--out', out, '--concurrency', opt('concurrency', '4')], {stdio: 'inherit'});
  if (r.status !== 0) throw new Error('render failed');
  // loudness pass: -16 LUFS integrated, -1.5 dBTP, video stream copied untouched
  const tmp = out.replace(/[.]mp4$/, '.premaster.mp4');
  fs.renameSync(out, tmp);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', out]);
  fs.rmSync(tmp);
  console.log(`mastered -> ${path.relative(root, out)}`);
}
