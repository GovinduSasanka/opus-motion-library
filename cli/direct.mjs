#!/usr/bin/env node
/**
 * direct — turn a storyboard into a finished, narrated video.
 *
 *   node cli/direct.mjs storyboards/demo.json [--out out/demo.mp4] [--no-render] [--no-voice]
 *
 * Storyboard:
 * {
 *   "name": "demo", "width": 1920, "height": 1080, "fps": 30,
 *   "voice": {"speaker": "Ryan", "style": "warm documentary narrator", "seed": 7},
 *   "music": {"file": "music/inspiring.mp3", "volume": 0.22, "start": 0, "duck": 0.45},
 *   "captions": true, "captionStyle": {"position": "bottom", "size": 40},
 *   "scenes": [
 *     {"motion": "sonar-ping", "props": {}, "say": "Every motion starts with a dot.",
 *      "min": 90, "lead": 8, "pad": 18, "caption": true, "transition": {"type": "iris", "frames": 12},
 *      "overlays": [{"motion": "confetti-burst", "at": 30, "duration": 60, "props": {}}],
 *      "sfx": [{"file": "sfx/pop.mp3", "at": 10, "volume": 0.5}]}
 *   ]
 * }
 * Each scene lasts max(min, lead + speech + pad) frames. Narration is generated locally with
 * Qwen3-TTS (cli/voice.py), placed at the scene start + lead, and captioned in short chunks.
 */
import {execFileSync, spawnSync} from 'node:child_process';
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
const trFrames = (tr) => tr.frames ?? TF[`${tr.type}:${tr.variant ?? (tr.type === 'bands' && tr.direction === 'from-center' ? 'center' : '')}`] ?? TF[tr.type] ?? 15;
const fps = sb.fps ?? 30;
const name = sb.name ?? path.basename(sbPath, '.json');
const PY = process.env.QWEN_PYTHON ?? 'C:/Users/govin/.qwen-venv/Scripts/python.exe';

// 1. narration
const voiceDir = path.join(root, 'public', 'voice', name);
fs.mkdirSync(voiceDir, {recursive: true});
const lines = sb.scenes.map((s, i) => ({id: `s${String(i + 1).padStart(3, '0')}`, text: s.say ?? '', say: s.direction ?? ''})).filter((l) => l.text);
// re-voice a line whose text changed
const manifestPath = path.join(voiceDir, 'manifest.json');
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
for (const l of lines) if (old[l.id] && old[l.id] !== l.text) fs.rmSync(path.join(voiceDir, `${l.id}.wav`), {force: true});
fs.writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(lines.map((l) => [l.id, l.text])), null, 1));
if (lines.length && !flag('no-voice')) {
  const lp = path.join(voiceDir, 'lines.json');
  fs.writeFileSync(lp, JSON.stringify(lines, null, 1));
  console.log(`voice: ${lines.length} lines (Qwen3-TTS, local)`);
  const r = spawnSync(PY, [path.join(root, 'cli', 'voice.py'), lp, voiceDir, sb.voice?.model ?? 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice', sb.voice?.speaker ?? 'Ryan', String(sb.voice?.seed ?? 7)], {
    stdio: 'inherit',
    env: {...process.env, VOICE_STYLE: sb.voice?.style ?? ''},
  });
  if (r.status !== 0) throw new Error('voice generation failed');
}
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}).trim());

// 2. timing
const scenes = [];
const musicCues = [];
const captions = [];
const duckOnly = [];
const sfx = [];
const overlays = [];
let t = 0;
sb.scenes.forEach((s, i) => {
  const id = `s${String(i + 1).padStart(3, '0')}`;
  const wav = path.join(voiceDir, `${id}.wav`);
  const lead = s.lead ?? 8;
  const pad = s.pad ?? 16;
  const speech = s.say && fs.existsSync(wav) ? Math.ceil(dur(wav) * fps) : 0;
  const d = Math.max(s.min ?? 60, speech ? lead + speech + pad : 0);
  const start = t;
  // a scene can switch the music bed: {"music": {"file": "music/x.mp3", "volume": 0.2, "start": 0}}
  if (s.music) {
    if (musicCues.length) musicCues[musicCues.length - 1].to = start + fps; // overlap 1 s for the crossfade
    musicCues.push({file: s.music.file, from: Math.max(0, start - (musicCues.length ? fps : 0)), to: -1, volume: s.music.volume ?? sb.music?.volume ?? 0.22, start: s.music.start ?? 0, fade: fps});
  }
  if (speech) {
    sfx.push({file: `voice/${name}/${id}.wav`, at: start + lead, volume: 1});
    // caption chunks of <= 7 words, timed by character share
    const words = s.say.split(/\s+/).filter(Boolean);
    const chunks = [];
    for (let k = 0; k < words.length; k += 7) chunks.push(words.slice(k, k + 7).join(' '));
    const total = chunks.reduce((a, c) => a + c.replace(/\*/g, '').length, 0);
    let c0 = start + lead;
    for (const c of chunks) {
      const len = Math.round((speech * c.replace(/\*/g, '').length) / total);
      (s.caption === false ? duckOnly : captions).push({text: c, from: c0, to: c0 + len});
      c0 += len;
    }
  }
  for (const o of s.overlays ?? []) overlays.push({motion: o.motion, from: start + (o.at ?? 0), duration: o.duration ?? 60, props: o.props ?? {}});
  for (const x of s.sfx ?? []) sfx.push({file: x.file, at: start + (x.at ?? 0), volume: x.volume ?? 0.5});
  scenes.push({motion: s.motion, duration: d, props: s.props ?? {}, offset: s.offset, transition: s.transition});
  const tr = i < sb.scenes.length - 1 && s.transition && s.transition.type !== 'cut' ? trFrames(s.transition) : 0;
  t += d - tr;
});

if (musicCues.length) musicCues[musicCues.length - 1].to = t + (sb.scenes.at(-1)?.transition ? 0 : 0);
for (const m of musicCues) if (m.to < 0) m.to = t;
const spec = {
  width: sb.width ?? 1920,
  height: sb.height ?? 1080,
  fps,
  background: sb.background ?? '#000',
  scenes,
  overlays,
  captions: sb.captions === false ? [] : captions,
  captionStyle: sb.captionStyle ?? {position: 'bottom', size: 40},
  audio: {
    music: sb.music?.file,
    musicVolume: sb.music?.volume ?? 0.22,
    musicStart: sb.music?.start ?? 0,
    duck: sb.music?.duck ?? 0.45,
    voice: undefined,
    sfx,
    musicCues,
  },
};
// voice lines are in sfx; ducking keys off caption cues even when captions are hidden
// voice cues that are not shown as captions still duck the music
spec.duckCues = sb.captions === false ? [...captions, ...duckOnly] : duckOnly;
const specDir = path.join(root, 'specs', 'built');
fs.mkdirSync(specDir, {recursive: true});
const specPath = path.join(specDir, `${name}.json`);
fs.writeFileSync(specPath, JSON.stringify(spec, null, 1));
console.log(`spec: ${path.relative(root, specPath)} — ${scenes.length} scenes, ${(t / fps).toFixed(1)} s`);

// 3. render
if (!flag('no-render')) {
  const out = path.resolve(opt('out', path.join(root, 'out', `${name}.mp4`)));
  const r = spawnSync(process.execPath, [path.join(root, 'cli', 'mgl.mjs'), 'compose', specPath, '--out', out, '--concurrency', opt('concurrency', '8')], {stdio: 'inherit'});
  if (r.status !== 0) throw new Error('render failed');
  // loudness pass: -16 LUFS integrated, -1.5 dBTP, video stream copied untouched
  const tmp = out.replace(/[.]mp4$/, '.premaster.mp4');
  fs.renameSync(out, tmp);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', out]);
  fs.rmSync(tmp);
  console.log(`mastered -> ${path.relative(root, out)}`);
}
