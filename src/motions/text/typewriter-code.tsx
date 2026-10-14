import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, prog} from '../../core/ease';
import {fonts} from '../../core/fonts';
import {useStage} from '../../core/stage';
import {Backdrop, BackdropKind, BlockCursor, cursorOn, eoc} from '../../core/text-kit';
import {defineMotion} from '../../core/types';

/**
 * macOS-style code window that types code (video8 ide-typewriter-panel, video17 typewriter-code,
 * video13 terminal). Editor mode: every line types at `charsPerSecond`, indentation is emitted
 * instantly, block cursor is solid while typing and blinks at 1 Hz when idle; the panel grows upward
 * (bottom edge fixed) with a 4-frame ease-out per new line. Terminal mode: `$ ` lines type,
 * other lines are command output and appear whole after a short pause.
 */

type CodeLine = string | {text: string; color?: string};
type Colors = {keyword: string; fn: string; number: string; string: string; comment: string; text: string; prompt: string; command: string; ok: string; warn: string; error: string; lineNo: string};
type Props = {
  lines: CodeLine[];
  mode: 'editor' | 'terminal';
  title: string;
  charsPerSecond: number;
  startFrame: number;
  outputDelay: number;
  position: 'corner' | 'center';
  fontSize: number;
  lineNumbers: boolean;
  colors: Partial<Colors>;
  panelColor: string;
  headerColor: string;
  cursorColor: string;
  backdrop: BackdropKind | 'auto';
  src: string;
};

const EDITOR: Colors = {keyword: '#b898d8', fn: '#88a0d8', number: '#e0a860', string: '#9fd39a', comment: '#7a7d85', text: '#d8dade', prompt: '#7fb8ff', command: '#a6d4ff', ok: '#7ee2a0', warn: '#ffd76a', error: '#ff7b72', lineNo: '#6b6c72'};
const TERMINAL: Colors = {...EDITOR, text: '#e9e3ef', comment: '#8a8095', lineNo: '#5d5566'};

const KEYWORDS = new Set(
  'float int uint bool void vec2 vec3 vec4 mat2 mat3 mat4 uniform in out inout return for while if else const let var function def class import from export default new await async true false null None self this struct break continue switch case type interface extends public private static'.split(
    ' ',
  ),
);
const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|(\b\d+(?:\.\d+)?f?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+)|([\s\S])/g;

type Seg = {t: string; c: string};
const highlight = (line: string, col: Colors): Seg[] => {
  const out: Seg[] = [];
  for (const m of line.matchAll(TOKEN)) {
    const [s, com, str, num, fn, word] = m;
    let c = col.text;
    if (com) c = col.comment;
    else if (str) c = col.string;
    else if (num) c = col.number;
    else if (fn) c = KEYWORDS.has(fn) ? col.keyword : col.fn;
    else if (word) c = KEYWORDS.has(word) ? col.keyword : col.text;
    out.push({t: s, c});
  }
  return out;
};

const terminalSegs = (line: string, col: Colors): Seg[] => {
  if (/^\$ /.test(line)) return [{t: '$ ', c: col.prompt}, {t: line.slice(2), c: col.command}];
  if (/^> /.test(line)) return [{t: '> ', c: col.warn}, {t: line.slice(2), c: col.text}];
  if (/^[✓✔]/.test(line)) return [{t: line, c: col.ok}];
  if (/^[✗✘!]/.test(line)) return [{t: line, c: col.error}];
  if (/^[◆•→]/.test(line)) return [{t: line.slice(0, 1), c: col.warn}, {t: line.slice(1), c: col.text}];
  if (/^\/\//.test(line)) return [{t: line, c: col.comment}];
  return [{t: line, c: col.warn}];
};

const sliceSegs = (segs: Seg[], n: number) => {
  const out: Seg[] = [];
  let left = n;
  for (const s of segs) {
    if (left <= 0) break;
    out.push({t: s.t.slice(0, left), c: s.c});
    left -= s.t.length;
  }
  return out;
};

const TypewriterCode: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const {w, h, u, portrait} = useStage();
  const col: Colors = {...(p.mode === 'terminal' ? TERMINAL : EDITOR), ...p.colors};
  const lines = p.lines.map((l) => (typeof l === 'string' ? {text: l} : l));
  const fpc = 30 / Math.max(1, p.charsPerSecond);

  // timeline: [start, end] per line
  const sched: {start: number; end: number; indent: number; typedChars: number; isOut: boolean}[] = [];
  let cur = p.startFrame;
  lines.forEach((l, i) => {
    const indent = (l.text.match(/^\s*/) ?? [''])[0].length;
    const isOut = p.mode === 'terminal' && !/^\$ /.test(l.text);
    if (isOut) {
      const start = cur + p.outputDelay;
      sched.push({start, end: start, indent, typedChars: 0, isOut});
      cur = start;
    } else {
      const start = cur + (i === 0 ? 0 : p.mode === 'terminal' ? p.outputDelay + 4 : fpc);
      const n = l.text.length - (p.mode === 'editor' ? indent : 0);
      const end = start + n * fpc;
      sched.push({start, end, indent: p.mode === 'editor' ? indent : 0, typedChars: n, isOut});
      cur = end;
    }
  });
  const doneAt = cur;
  const typing = frame >= p.startFrame && frame < doneAt;

  const big = p.position === 'center';
  const fs = p.fontSize * u * (big ? 1.25 : 1);
  const pitch = fs * 1.55;
  const header = 50 * u * (big ? 1.15 : 1);
  const margin = (portrait ? 54 : 72) * u;
  const panelW = big ? Math.min(w * 0.72, 1360 * u, w - margin * 2) : portrait ? w - margin * 2 : Math.min(w * 0.6, 1140 * u);
  // visible line count with a 4-frame ease per new line (bottom edge fixed -> grows upward)
  let rows = 1;
  sched.forEach((s, i) => {
    if (i > 0) rows += eoc((frame - s.start) / 4);
  });
  // terminal shows a fresh prompt once everything has run
  const promptRow = p.mode === 'terminal' ? eoc((frame - doneAt - p.outputDelay) / 4) : 0;
  rows += promptRow;
  const bodyPad = 24 * u;
  const panelH = header + bodyPad * 2 + rows * pitch;
  const appear = prog(frame, p.startFrame - 6, p.startFrame - 2);
  const left = big ? (w - panelW) / 2 : margin;
  const bottom = big ? (h - panelH) / 2 : portrait ? h * 0.12 : margin;

  const backdrop: BackdropKind = p.backdrop === 'auto' ? (p.mode === 'terminal' ? 'warm' : 'dunes') : p.backdrop;
  const radius = 14 * u;
  const blinkOn = cursorOn(frame, typing, p.mode === 'terminal' ? 2 : 1);
  const lastStarted = sched.reduce((acc, s, i) => (frame >= s.start ? i : acc), -1);

  return (
    <AbsoluteFill>
      <Backdrop kind={backdrop} src={p.src || undefined} drift={0.6} />
      <div
        style={{
          position: 'absolute',
          left,
          bottom: big ? undefined : bottom,
          top: big ? bottom : undefined,
          width: panelW,
          height: panelH,
          borderRadius: radius,
          background: p.panelColor || (p.mode === 'terminal' ? 'rgba(38,31,46,0.95)' : 'rgba(52,53,58,0.88)'),
          backdropFilter: `blur(${6 * u}px)`,
          boxShadow: `0 ${18 * u}px ${50 * u}px rgba(0,0,0,0.28)`,
          overflow: 'hidden',
          opacity: appear,
          transform: `translateY(${(1 - appear) * 10 * u}px)`,
          fontFamily: fonts.mono,
        }}
      >
        <div style={{height: header, background: p.headerColor || (p.mode === 'terminal' ? '#352c3e' : '#4f5055'), display: 'flex', alignItems: 'center', position: 'relative'}}>
          {['#dd5d5d', '#dfac2e', '#2ead4a'].map((c, i) => (
            <div key={i} style={{position: 'absolute', left: 22 * u + i * 26 * u, width: 15 * u, height: 15 * u, borderRadius: '50%', background: c}} />
          ))}
          <div style={{width: '100%', textAlign: 'center', fontSize: 18 * u * (big ? 1.15 : 1), color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em'}}>{p.title}</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: bodyPad, top: header + bodyPad, fontSize: fs, lineHeight: `${pitch}px`, fontWeight: p.mode === 'terminal' ? 700 : 400, whiteSpace: 'pre'}}>
          {lines.map((l, i) => {
            const s = sched[i];
            if (frame < s.start) return null;
            const segsAll = l.color ? [{t: l.text, c: l.color}] : p.mode === 'terminal' ? terminalSegs(l.text, col) : highlight(l.text, col);
            const shown = s.isOut ? l.text.length : s.indent + clamp(Math.floor((frame - s.start) / fpc) + 1, 0, s.typedChars);
            const segs = sliceSegs(segsAll, frame >= s.end ? l.text.length : shown);
            const showCursor = i === lastStarted && !(p.mode === 'terminal' && frame >= doneAt + p.outputDelay);
            const rise = s.isOut ? eoc((frame - s.start) / 4) : 1;
            return (
              <div key={i} style={{display: 'flex', height: pitch, opacity: rise}}>
                {p.lineNumbers && (
                  <span style={{width: fs * 2.6, textAlign: 'right', paddingRight: fs * 0.9, color: col.lineNo, flexShrink: 0}}>
                    {p.mode === 'terminal' ? '' : i + 1}
                  </span>
                )}
                {!p.lineNumbers && <span style={{width: fs * 1.2, flexShrink: 0}} />}
                <span>
                  {segs.map((sg, k) => (
                    <span key={k} style={{color: sg.c}}>
                      {sg.t}
                    </span>
                  ))}
                  {showCursor && <BlockCursor visible={blinkOn} color={p.cursorColor} w={fs * 0.55} h={fs * 1.15} style={{marginLeft: fs * 0.08, transform: `translateY(${-fs * 0.08}px)`}} />}
                </span>
              </div>
            );
          })}
          {p.mode === 'terminal' && promptRow > 0 && (
            <div style={{display: 'flex', height: pitch, opacity: promptRow}}>
              {p.lineNumbers ? <span style={{width: fs * 2.6, flexShrink: 0}} /> : <span style={{width: fs * 1.2, flexShrink: 0}} />}
              <span style={{color: col.prompt}}>
                ${' '}
                <BlockCursor visible={cursorOn(frame, false, 2)} color={p.cursorColor} w={fs * 0.55} h={fs * 1.15} style={{transform: `translateY(${-fs * 0.08}px)`}} />
              </span>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const typewriterCode = defineMotion<Props>({
  id: 'typewriter-code',
  title: 'Typewriter code window',
  category: 'text',
  description: 'macOS-style code editor or terminal window that types syntax-coloured code with a block cursor; the panel grows upward line by line.',
  source: ['video8 0:05-0:30', 'video17 0:00-0:43 footer', 'video13 0:00-0:20'],
  useFor: 'Show the code behind a visual, a command being run, or a "made with code" credit beat.',
  durationInFrames: 180,
  defaultProps: {
    lines: [
      '// fractal brownian motion',
      'float fbm(vec2 p) {',
      '  float v = 0.0, a = 0.5;',
      '  for (int i = 0; i < 6; i++) {',
      '    v += a * noise(p);',
      '    p = p * 2.0 + vec2(1.7, 9.2);',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
    ],
    mode: 'editor',
    title: 'world.glsl',
    charsPerSecond: 42,
    startFrame: 10,
    outputDelay: 8,
    position: 'corner',
    fontSize: 28,
    lineNumbers: true,
    colors: {},
    panelColor: '',
    headerColor: '',
    cursorColor: '#e6e6e6',
    backdrop: 'auto',
    src: '',
  },
  propDocs: {
    lines: 'code lines (strings, or {text, color}); in terminal mode "$ " lines type, other lines are output',
    mode: 'editor (line numbers, syntax colours) | terminal (bold, prompt/output colours)',
    title: 'filename centred in the title bar',
    charsPerSecond: 'typing speed (video17 ≈ 30, video8 time-boxes ≈ 150 chars in 1 s)',
    startFrame: 'frame the first character types (panel fades in 6 frames before)',
    outputDelay: 'terminal: frames between a command finishing and its output appearing',
    position: 'corner (bottom-left panel) | center (bigger, centred)',
    fontSize: 'code size in px at 1080p',
    colors: 'override any of keyword, fn, number, string, comment, text, prompt, command, ok, warn, error, lineNo',
    panelColor: 'window body colour (empty = grey for editor, plum for terminal)',
    headerColor: 'title bar colour (empty = auto)',
    cursorColor: 'block cursor colour (video17 uses red #ED3821)',
    backdrop: 'auto | dunes | warm | ink | cream | peaks | dusk | ocean | none — procedural scene behind the panel',
    src: 'optional public/ image behind the panel (overrides backdrop)',
  },
  component: TypewriterCode,
  tags: ['code', 'typewriter', 'terminal', 'ide', 'hud'],
});
