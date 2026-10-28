import React, {useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender} from 'remotion';
import {estWidth, TFont} from './text-kit';
import {useStage} from './stage';

/**
 * Shared helpers for the kinetic-typography motions (R3): word wrapping and size fitting from width estimates
 * (stable on the first frame), a DOM width measurer that holds the render until web fonts are loaded, a stable
 * glyph scrambler and a tiny background component that honours `background: 'transparent'` for overlays.
 */

/** greedy word wrap on '\n' and spaces using estimated widths; words longer than maxW stay whole */
export const wrapWords = (text: string, size: number, maxW: number, font: TFont, tracking = 0): string[] => {
  const out: string[] = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = '';
    for (const wd of words) {
      const next = line ? `${line} ${wd}` : wd;
      if (line && estWidth(next, size, font, tracking) > maxW) {
        out.push(line);
        line = wd;
      } else line = next;
    }
    out.push(line);
  }
  return out;
};

/** largest font size <= `size` whose wrapped block fits maxW x maxH; returns the lines too */
export const fitBlock = (text: string, size: number, maxW: number, maxH: number, font: TFont, lineHeight = 1.1, tracking = 0, minSize = 12) => {
  let s = size;
  let lines = wrapWords(text, s, maxW, font, tracking);
  for (let i = 0; i < 60; i++) {
    lines = wrapWords(text, s, maxW, font, tracking);
    const widest = Math.max(...lines.map((l) => estWidth(l, s, font, tracking)), 1);
    if (lines.length * s * lineHeight <= maxH && widest <= maxW * 1.02) break;
    s *= 0.94;
    if (s <= minSize) {
      s = minSize;
      lines = wrapWords(text, s, maxW, font, tracking);
      break;
    }
  }
  return {size: s, lines};
};

/** full-frame background; `transparent` leaves the host content visible (overlay use) */
export const Bg: React.FC<{background: string; glow?: string; glowAmount?: number; children?: React.ReactNode}> = ({background, glow, glowAmount = 0.16, children}) => {
  const transparent = background === 'transparent';
  return (
    <AbsoluteFill style={{background: transparent ? 'transparent' : background}}>
      {glow && !transparent ? (
        <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, ${hexA(glow, glowAmount)} 0%, transparent 62%)`}} />
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

/** '#rrggbb' + alpha -> rgba(); other colour formats are returned unchanged */
export const hexA = (hex: string, a: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** mix two '#rrggbb' colours (t=0 -> a, t=1 -> b); other formats return a */
export const mixCol = (a: string, b: string, t: number) => {
  const pa = /^#?([0-9a-f]{6})$/i.exec(a.trim());
  const pb = /^#?([0-9a-f]{6})$/i.exec(b.trim());
  if (!pa || !pb) return a;
  const x = parseInt(pa[1], 16);
  const y = parseInt(pb[1], 16);
  const ch = (s: number) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

/** stable 0..1 hash of (a, b, seed) — no Math.random */
export const h01 = (a: number, b = 0, seed = 1) => {
  let x = (Math.imul(a + 1, 374761393) ^ Math.imul(b + 7, 668265263) ^ Math.imul(seed + 13, 2147483647)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x / 4294967296;
};

export const CHARSETS: Record<string, string> = {
  glyphs: '█▓▒░#%&@$*+=<>/\\|{}[]0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  binary: '01',
  hex: '0123456789ABCDEF',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  symbols: '!@#$%^&*()_+-=[]{};:<>?/~|',
  digits: '0123456789',
};

/** the character to show for slot `i` at scramble tick `tick` (a custom string is used as its own charset) */
export const scrambleChar = (charset: string, i: number, tick: number, seed: number) => {
  const set = CHARSETS[charset] ?? (charset || CHARSETS.glyphs);
  const arr = [...set];
  return arr[Math.floor(h01(i, tick, seed) * arr.length) % arr.length];
};

const quoteFamily = (f: string) => (/[\s]/.test(f) && !/["']/.test(f) ? `"${f}"` : f);

/**
 * Measures the rendered width of each string (white-space: nowrap) in the given font. Holds the render (delayRender)
 * until the font has loaded; returns null on the very first pass so callers fall back to estimates.
 * Render `probes` once inside the component.
 */
export const useTextWidths = (words: string[], fontFamily: string, fontSize: number, fontWeight: number | string = 400, letterSpacing = 0) => {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [widths, setWidths] = useState<number[] | null>(null);
  const [handle] = useState(() => delayRender('measure text widths'));
  const done = useRef(false);
  const key = `${words.join('|')}::${fontFamily}::${Math.round(fontSize)}::${fontWeight}::${letterSpacing}`;
  useLayoutEffect(() => {
    let dead = false;
    const finish = () => {
      if (dead) return;
      setWidths(refs.current.map((r) => (r ? r.offsetWidth : 0)));
      if (!done.current) {
        done.current = true;
        continueRender(handle);
      }
    };
    const fonts = (typeof document !== 'undefined' ? (document as any).fonts : undefined) as FontFaceSet | undefined;
    if (fonts && fonts.load) {
      const spec = `${fontWeight} ${Math.max(8, Math.round(fontSize))}px ${quoteFamily(fontFamily.split(',')[0].trim())}`;
      Promise.all(words.map((wd) => fonts.load(spec, wd || ' ')))
        .then(() => fonts.ready)
        .then(finish)
        .catch(finish);
    } else finish();
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const probes = (
    <div style={{position: 'absolute', left: -99999, top: 0, visibility: 'hidden', pointerEvents: 'none'}}>
      {words.map((wd, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={{display: 'inline-block', whiteSpace: 'nowrap', fontFamily, fontSize, fontWeight, letterSpacing}}
        >
          {wd}
        </span>
      ))}
    </div>
  );
  return {widths, probes};
};

/** convenience: stage-derived max block box for centred headline motions */
export const useBlockBox = (fracW = 0.86, fracH = 0.7) => {
  const {w, h} = useStage();
  return {maxW: w * fracW, maxH: h * fracH};
};
