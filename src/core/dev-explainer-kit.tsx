import React from 'react';
import {clamp} from './ease';
import {fonts} from './fonts';
import {hexRgb, mixHex, withAlpha} from './r2-s1-kit';

/**
 * Shared helpers for the software / developer / AI explainer motions (code diff, git graph, API flow,
 * deploy pipeline, AI chat, terminal install, server rack, JSON tree). Pure functions of the frame.
 */
export {mixHex, withAlpha};

export const isTransparent = (b: string) => !b || b === 'transparent';
export const bgOf = (b: string) => (isTransparent(b) ? 'transparent' : b);

/** perceived luminance 0..1 of a hex colour */
export const lum = (hex: string) => {
  try {
    const [r, g, b] = hexRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  } catch {
    return 0.5;
  }
};
export const isDark = (hex: string) => lum(hex) < 0.5;

/** readable text colour (black-ish / white-ish) on a given fill */
export const onFill = (hex: string) => (lum(hex) > 0.6 ? '#10131A' : '#FFFFFF');

export const monoFont = (family: string) => (family && family.trim() ? family : fonts.mono);
export const sansFont = (family: string) => (family && family.trim() ? family : fonts.sans);

/** frames -> segment progress 0..1 (linear, clamped) */
export const seg = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1e-6, b - a));
export const outCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const inOutCubic = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const backOut = (t: number, s = 1.6) => {
  const x = clamp(t) - 1;
  return 1 + x * x * ((s + 1) * x + s);
};

/** deterministic 0..1 hash of an integer (no Math.random) */
export const hash01 = (n: number) => {
  let x = (Math.imul(Math.floor(n) + 0x9e3779b9, 0x85ebca6b) ^ 0xc2b2ae35) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0;
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0;
  x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
};

/** smooth value-noise in 0..1 of a continuous input (for wobbling meters) */
export const smoothNoise = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash01(i * 7 + seed * 131);
  const b = hash01((i + 1) * 7 + seed * 131);
  const s = f * f * (3 - 2 * f);
  return a + (b - a) * s;
};

/** substring of `s` typed at `cps` chars per second, starting at frame `start` */
export const typed = (s: string, frame: number, start: number, cps = 30, fps = 30) =>
  s.slice(0, Math.max(0, Math.min(s.length, Math.floor(((frame - start) * cps) / fps))));

/** blinking caret visibility (0/1) */
export const blink = (frame: number, period = 16) => (Math.floor(frame / (period / 2)) % 2 === 0 ? 1 : 0);

/** monospace font size so that `chars` columns and `rows` rows fit in a box; capped at `max` */
export const fitMono = (boxW: number, boxH: number, chars: number, rows: number, max: number, min: number, lineK = 1.55) => {
  const byW = boxW / Math.max(1, chars * 0.6);
  const byH = boxH / Math.max(1, rows * lineK);
  return Math.max(min, Math.min(max, byW, byH));
};

/** simple, language-agnostic syntax colouring for short code/JSON-ish lines */
export type Tok = {text: string; kind: 'kw' | 'str' | 'num' | 'com' | 'fn' | 'plain' | 'punct'};
const KW = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'from', 'export', 'default', 'class', 'new', 'await',
  'async', 'def', 'try', 'catch', 'throw', 'true', 'false', 'null', 'None', 'True', 'False', 'in', 'of', 'type', 'interface', 'public',
  'private', 'static', 'void', 'int', 'string', 'self', 'this', 'elif', 'except', 'with', 'as', 'pass', 'yield', 'fn', 'pub', 'use', 'mut',
]);
export const tokenize = (line: string): Tok[] => {
  const out: Tok[] = [];
  const re = /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\()|([A-Za-z_$][\w$]*)|([^\sA-Za-z0-9_$]+)|(\s+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({text: m[1], kind: 'com'});
    else if (m[2]) out.push({text: m[2], kind: 'str'});
    else if (m[3]) out.push({text: m[3], kind: 'num'});
    else if (m[4]) out.push({text: m[4], kind: KW.has(m[4]) ? 'kw' : 'fn'});
    else if (m[5]) out.push({text: m[5], kind: KW.has(m[5]) ? 'kw' : 'plain'});
    else if (m[6]) out.push({text: m[6], kind: 'punct'});
    else out.push({text: m[7], kind: 'plain'});
  }
  return out;
};
export const syntaxPalette = (dark: boolean) =>
  dark
    ? {kw: '#FF7B9C', str: '#8DE0A5', num: '#F2C46D', com: '#7C8798', fn: '#79B8FF', plain: '#E6EAF2', punct: '#9AA6BA', key: '#79B8FF'}
    : {kw: '#C2185B', str: '#1B7F3B', num: '#B25E09', com: '#7A8494', fn: '#1F5FBF', plain: '#1B2233', punct: '#5A6578', key: '#1F5FBF'};

/** window chrome (traffic lights + title) with children laid out in the body. All sizes in px. */
export const Win: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  u: number;
  title: string;
  panel: string;
  ink: string;
  opacity?: number;
  scale?: number;
  dy?: number;
  radius?: number;
  headerRight?: React.ReactNode;
  fontFamily?: string;
  children?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
}> = ({x, y, w, h, u, title, panel, ink, opacity = 1, scale = 1, dy = 0, radius = 22, headerRight, fontFamily, children, bodyStyle}) => {
  const head = 62 * u;
  const dark = isDark(panel);
  const line = withAlpha(ink, dark ? 0.14 : 0.12);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        opacity,
        transform: `translateY(${dy}px) scale(${scale})`,
        transformOrigin: '50% 50%',
        borderRadius: radius * u,
        background: panel,
        border: `${1.5 * u}px solid ${line}`,
        boxShadow: `0 ${24 * u}px ${70 * u}px ${withAlpha('#000000', dark ? 0.45 : 0.16)}`,
        overflow: 'hidden',
        color: ink,
      }}
    >
      <div style={{height: head, display: 'flex', alignItems: 'center', padding: `0 ${22 * u}px`, borderBottom: `${1.5 * u}px solid ${line}`, background: mixHex(panel, ink, dark ? 0.05 : 0.035)}}>
        <div style={{display: 'flex', gap: 10 * u}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 16 * u, height: 16 * u, borderRadius: '50%', background: c}} />
          ))}
        </div>
        <div style={{flex: 1, textAlign: 'center', fontFamily: fontFamily ?? fonts.mono, fontSize: 21 * u, color: withAlpha(ink, 0.62), letterSpacing: 0.3 * u, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: `0 ${14 * u}px`}}>{title}</div>
        <div style={{minWidth: 56 * u, textAlign: 'right', fontFamily: fontFamily ?? fonts.mono, fontSize: 19 * u, color: withAlpha(ink, 0.6)}}>{headerRight}</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: head, bottom: 0, ...bodyStyle}}>{children}</div>
    </div>
  );
};

/** spinning arc loader (SVG), angle from the frame */
export const Spinner: React.FC<{size: number; color: string; frame: number; stroke?: number; speed?: number}> = ({size, color, frame, stroke = 3, speed = 14}) => {
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display: 'block', overflow: 'visible'}}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={withAlpha(color, 0.22)} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * 0.28} ${c}`}
        transform={`rotate(${frame * speed} ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

/** check mark that draws on (k 0..1) inside a circle of `size` */
export const CheckDot: React.FC<{size: number; color: string; k: number; fg?: string; filled?: boolean}> = ({size, color, k, fg = '#FFFFFF', filled = true}) => {
  const s = size;
  const pop = backOut(seg(k, 0, 0.55), 2);
  const tick = seg(k, 0.35, 1);
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{display: 'block', overflow: 'visible'}}>
      <circle cx={12} cy={12} r={11 * pop} fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 0 : 2} />
      <path d="M7 12.5 L10.5 16 L17 8.5" fill="none" stroke={filled ? fg : color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - tick)} />
    </svg>
  );
};

/** cross mark inside a circle */
export const CrossDot: React.FC<{size: number; color: string; k: number; fg?: string}> = ({size, color, k, fg = '#FFFFFF'}) => {
  const pop = backOut(seg(k, 0, 0.55), 2);
  const tick = seg(k, 0.35, 1);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', overflow: 'visible'}}>
      <circle cx={12} cy={12} r={11 * pop} fill={color} />
      <path d="M8 8 L16 16 M16 8 L8 16" fill="none" stroke={fg} strokeWidth={2.4} strokeLinecap="round" strokeDasharray={24} strokeDashoffset={24 * (1 - tick)} />
    </svg>
  );
};
